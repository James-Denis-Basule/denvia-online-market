import mongoose from "mongoose";

import Message from "../models/Message.js";
import Order from "../models/Order.js";
import { AppError } from "../utils/AppError.js";

// Save user message and return assistant reply (insight or echo).
export async function saveUserMessage(
  userId: string,
  content: string,
) {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("Valid authenticated user is required", 401);
  }

  if (!content || !content.trim()) {
    throw new AppError("Message content is required", 400);
  }

  const senderId = new mongoose.Types.ObjectId(userId);

  const msg = await Message.create({
    senderId,
    role: "user",
    content: content.trim(),
  });

  const reply = await generateAssistantReply(content, userId);

  const assistant = await Message.create({
    conversationId: msg.conversationId,
    role: "assistant",
    content: reply,
  });

  return {
    userMessage: msg.toObject(),
    assistantMessage: assistant.toObject(),
  };
}

export async function getMessages(
  userId: string,
  limit = 50,
) {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("Valid authenticated user is required", 401);
  }

  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Math.trunc(limit), 1), 100)
    : 50;

  const messages = await Message.find({
    senderId: new mongoose.Types.ObjectId(userId),
  })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  return messages.reverse();
}

// Very small local "insight" engine. Matches keywords and runs safe aggregations.
async function generateAssistantReply(
  userContent: string,
  userId?: string,
) {
  const lc = (userContent ?? "").toLowerCase();

  if (
    lc.includes("top sellers") ||
    lc.includes("top businesses") ||
    lc.includes("top sellers by revenue")
  ) {
    const rows = await Order.aggregate([
      {
        $group: {
          _id: "$items.businessId",
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    if (!rows || !rows.length) {
      return "No seller data available for the requested period.";
    }

    const lines = rows.map(
      (r: any, idx: number) =>
        `${idx + 1}. ${String(r._id).slice(-6).toUpperCase()} — UGX ${Number(r.revenue).toLocaleString()} (${r.orders} orders)`,
    );

    return `Top sellers by revenue:

${lines.join("\n")}`;
  }

  if (lc.includes("revenue") && lc.match(/\d+\s*d/)) {
    const m = lc.match(/(\d+)\s*d/);
    const days = m
      ? Math.max(1, Math.min(Number(m[1]), 365))
      : 30;

    const end = new Date();
    const start = new Date(
      end.getTime() -
        (days - 1) * 24 * 60 * 60 * 1000,
    );

    const row = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
    ]);

    const revenue =
      row && row[0] ? Number(row[0].revenue) : 0;

    const orders =
      row && row[0] ? Number(row[0].orders) : 0;

    return `Revenue for last ${days} days: UGX ${revenue.toLocaleString()} across ${orders} orders.`;
  }

  return `I received your message: "${userContent}". Try asking things like "Show revenue 30d" or "Top sellers".`;
}