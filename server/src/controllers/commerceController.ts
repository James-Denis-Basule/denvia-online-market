import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {
  addToCart,
  calculateCartTotals,
  createOrderForUser,
  getCart,
  getCheckoutQuote,
  getOrderByIdForUser,
  getOrdersForUser,
  getSellerDashboardSummary,
  getSellerOrdersForBusinessIds,
  updateOrderStatus,
  assignDeliveryToOrder,
} from "../services/commerceService.js";
import { getDeliveryForOrder, updateDeliveryStatusForOrder } from "../services/deliveryService.js";

export async function getCartController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const cart = await getCart(req.user.userId);
    const totals = calculateCartTotals(
      cart.items.map((item) => ({
        price: Number(item.price),
        quantity: Number(item.quantity),
      })),
    );

    res.status(200).json({
      success: true,
      data: {
        items: cart.items,
        totals,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addToCartController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { productId, businessId, name, price, quantity = 1, currency = "UGX", image } = req.body ?? {};

    if (!productId || !businessId || !name || typeof price !== "number") {
      res.status(400).json({
        success: false,
        message: "productId, businessId, name, and price are required",
      });
      return;
    }

    const cart = await addToCart(req.user.userId, {
      productId,
      businessId,
      name,
      price,
      quantity,
      currency,
      image,
    });

    const totals = calculateCartTotals(
      cart.items.map((item) => ({
        price: Number(item.price),
        quantity: Number(item.quantity),
      })),
    );

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      data: {
        cart,
        totals,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createOrderController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { items, paymentMethod, shippingMethod, deliveryAddress } = req.body ?? {};
    const order = await createOrderForUser(req.user.userId, {
      items,
      paymentMethod,
      shippingMethod,
      deliveryAddress,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrdersController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const orders = await getOrdersForUser(req.user.userId);

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCheckoutQuoteController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { items, paymentMethod, shippingMethod, deliveryAddress } = req.body ?? {};
    const quote = getCheckoutQuote(items ?? [], paymentMethod, shippingMethod, deliveryAddress);

    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSellerOrdersController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const rawBusinessIds = Array.isArray(req.query.businessIds)
      ? req.query.businessIds.filter((value): value is string => typeof value === "string")
      : typeof req.query.businessIds === "string"
        ? req.query.businessIds.split(",").filter((value) => value.trim().length > 0)
        : [];

    const orders = await getSellerOrdersForBusinessIds(rawBusinessIds);

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSellerDashboardSummaryController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const rawBusinessIds = Array.isArray(req.query.businessIds)
      ? req.query.businessIds.filter((value): value is string => typeof value === "string")
      : typeof req.query.businessIds === "string"
        ? req.query.businessIds.split(",").filter((value) => value.trim().length > 0)
        : [];

    const summary = await getSellerDashboardSummary(req.user.userId, rawBusinessIds);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderByIdController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const order = await getOrderByIdForUser(req.user.userId, orderId);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatusController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const status = typeof req.body?.status === "string" ? req.body.status : undefined;

    if (!status) {
      res.status(400).json({ success: false, message: "status is required" });
      return;
    }

    const order = await updateOrderStatus(orderId, status as Parameters<typeof updateOrderStatus>[1]);

    res.status(200).json({
      success: true,
      message: "Order status updated",
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function assignDeliveryController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const courier = typeof req.body?.courier === 'string' ? req.body.courier : undefined;
    const trackingCode = typeof req.body?.trackingCode === 'string' ? req.body.trackingCode : undefined;

    const delivery = await assignDeliveryToOrder(orderId, courier, trackingCode);

    res.status(200).json({
      success: true,
      message: 'Delivery assigned',
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDeliveryForOrderController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const delivery = await getDeliveryForOrder(orderId);

    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
}

export async function updateDeliveryStatusController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const status = typeof req.body?.status === 'string' ? req.body.status : undefined;
    const courier = typeof req.body?.courier === 'string' ? req.body.courier : undefined;
    const trackingCode = typeof req.body?.trackingCode === 'string' ? req.body.trackingCode : undefined;

    if (!status) {
      res.status(400).json({ success: false, message: 'status is required' });
      return;
    }

    const delivery = await updateDeliveryStatusForOrder(orderId, status as Parameters<typeof updateDeliveryStatusForOrder>[1], {
      courier,
      trackingCode,
    });

    res.status(200).json({
      success: true,
      message: 'Delivery status updated',
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
}
