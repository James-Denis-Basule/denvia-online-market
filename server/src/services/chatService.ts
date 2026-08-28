import mongoose from "mongoose";

import Message from "../models/Message.js";
import Business from "../models/Business.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

import { AppError } from "../utils/AppError.js";
import {
  consumeAiCredits,
} from "./marketingService.js";
import {
  generateBusinessAssistantReply,
  type BusinessAssistantContext,
} from "./aiService.js";

function buildDateRange(days = 30) {
  const safeDays = Math.max(1, Math.min(Math.trunc(days), 365));

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(start.getDate() - (safeDays - 1));
  start.setHours(0, 0, 0, 0);

  return {
    start,
    end,
    days: safeDays,
  };
}

async function buildBusinessContext(userId: string) {
  const ownerId = new mongoose.Types.ObjectId(userId);

  const business = await Business.findOne({
    ownerId,
    status: "active",
  }).lean();

  if (!business) {
    throw new AppError(
      "No active business is associated with this account.",
      404,
    );
  }

  const products = await Product.find({
    businessId: business._id,
    isVisible: true,
    status: { $ne: "archived" },
  })
    .select(
      "name price currency stockQuantity averageRating reviewCount status",
    )
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const { start, end, days } = buildDateRange(30);

  const orderMatch = {
    createdAt: {
      $gte: start,
      $lte: end,
    },
    "items.businessId": business._id,
  };

  const [summaryRows, statusRows, topProductRows] =
    await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        { $unwind: "$items" },
        {
          $match: {
            "items.businessId": business._id,
          },
        },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: {
                $multiply: [
                  "$items.price",
                  "$items.quantity",
                ],
              },
            },
            quantitySold: {
              $sum: "$items.quantity",
            },
            orderIds: {
              $addToSet: "$_id",
            },
            currency: {
              $first: "$items.currency",
            },
          },
        },
      ]),
      Order.aggregate([
        { $match: orderMatch },
        { $unwind: "$items" },
        {
          $match: {
            "items.businessId": business._id,
          },
        },
        {
          $group: {
            _id: "$status",
            orderIds: {
              $addToSet: "$_id",
            },
          },
        },
      ]),
      Order.aggregate([
        { $match: orderMatch },
        { $unwind: "$items" },
        {
          $match: {
            "items.businessId": business._id,
          },
        },
        {
          $group: {
            _id: {
              productId: "$items.productId",
              name: "$items.name",
              currency: "$items.currency",
            },
            quantitySold: {
              $sum: "$items.quantity",
            },
            revenue: {
              $sum: {
                $multiply: [
                  "$items.price",
                  "$items.quantity",
                ],
              },
            },
          },
        },
        { $sort: { quantitySold: -1, revenue: -1 } },
        { $limit: 10 },
      ]),
    ]);

  const summary = summaryRows[0];

  const statusCounts: Record<string, number> = {};

  for (const row of statusRows) {
    statusCounts[row._id ?? "unknown"] =
      row.orderIds?.length ?? 0;
  }

  const topProducts = topProductRows.map((row) => ({
    name: row._id?.name ?? "Unknown product",
    quantitySold: Number(row.quantitySold ?? 0),
    revenue: Number(row.revenue ?? 0),
    currency: row._id?.currency ?? "UGX",
  }));

  const context: BusinessAssistantContext = {
    business: {
      name: business.name,
      description: business.description,
      category: business.category,
      location: business.location,
    },
    products: products.map((product) => ({
      name: product.name,
      price: Number(product.price),
      currency: product.currency,
      stockQuantity: Number(product.stockQuantity),
      averageRating: Number(product.averageRating),
      reviewCount: Number(product.reviewCount),
      status: product.status,
    })),
    analytics: {
      periodDays: days,
      orderCount: summary?.orderIds?.length ?? 0,
      revenue: Number(summary?.revenue ?? 0),
      currency: summary?.currency ?? "UGX",
      statusCounts,
      topProducts,
    },
  };

  return {
    businessId: String(business._id),
    context,
  };
}

export async function saveUserMessage(
  userId: string,
  content: string,
) {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError(
      "Valid authenticated user is required",
      401,
    );
  }

  if (!content || !content.trim()) {
    throw new AppError(
      "Message content is required",
      400,
    );
  }

  const senderId = new mongoose.Types.ObjectId(userId);

  const msg = await Message.create({
    senderId,
    role: "user",
    content: content.trim(),
  });

  try {
    const { businessId, context } =
      await buildBusinessContext(userId);

    const previousMessages = await Message.find({
      senderId,
      _id: { $ne: msg._id },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const history = previousMessages
      .reverse()
      .map((message) => ({
        role:
          message.role === "assistant"
            ? ("model" as const)
            : ("user" as const),
        text: message.content,
      }));

    const reply =
      await generateBusinessAssistantReply(
        content.trim(),
        context,
        history,
      );

    const creditResult = await consumeAiCredits({
      userId,
      businessId,
      action: "assistant_chat",
      creditsRequired: 1,
      metadata: {
        model: "gemini",
      },
    });

    const assistant = await Message.create({
      senderId,
      conversationId: msg.conversationId,
      role: "assistant",
      content: reply,
      metadata: {
        ai: true,
        creditsUsed: creditResult.creditsUsed,
      },
    });

    return {
      userMessage: msg.toObject(),
      assistantMessage: assistant.toObject(),
    };
  } catch (error) {
    await Message.create({
      senderId,
      conversationId: msg.conversationId,
      role: "assistant",
      content:
        error instanceof AppError
          ? error.message
          : "The AI assistant is temporarily unavailable. Please try again.",
      metadata: {
        ai: true,
        failed: true,
      },
    });

    throw error;
  }
}

export async function getMessages(
  userId: string,
  limit = 50,
) {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError(
      "Valid authenticated user is required",
      401,
    );
  }

  const safeLimit = Number.isFinite(limit)
    ? Math.min(
        Math.max(Math.trunc(limit), 1),
        100,
      )
    : 50;

  const messages = await Message.find({
    senderId: new mongoose.Types.ObjectId(userId),
  })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  return messages.reverse();
}
