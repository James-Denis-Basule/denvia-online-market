import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {
  addToCart,
  calculateCartTotals,
  createOrderForUser,
  getCart,
  updateCartItem,
  removeCartItem,
  getCheckoutQuote,
  getOrderForCustomerOrAuthorizedSeller,
  getOrdersForUser,
  getSellerDashboardSummary,
  getSellerOrdersForBusinessIds,
  updateOrderStatus,
  cancelOrderForUserOrAuthorizedSeller,
  assignDeliveryToOrder,
  requireAuthorizedSellerForOrder,
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

    const { productId, businessId, quantity } = req.body ?? {};

    if (typeof productId !== "string" || !productId) {
      res.status(400).json({
        success: false,
        message: "productId is required",
      });
      return;
    }

    const cart = await addToCart(req.user.userId, {
      productId,
      businessId: typeof businessId === "string" ? businessId : undefined,
      quantity,
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

export async function updateCartItemController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const productIdParam = req.params.productId;
    const productId = typeof productIdParam === "string" ? productIdParam : undefined;
    const quantity = Number(req.body?.quantity);

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "productId is required",
      });
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      res.status(400).json({
        success: false,
        message: "quantity must be a positive integer",
      });
      return;
    }

    const cart = await updateCartItem(
      req.user.userId,
      productId,
      quantity,
    );

    const totals = calculateCartTotals(
      cart.items.map((item) => ({
        price: Number(item.price),
        quantity: Number(item.quantity),
      })),
    );

    res.status(200).json({
      success: true,
      message: "Cart item updated",
      data: {
        cart,
        totals,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function removeCartItemController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const productId =
      typeof req.params.productId === "string"
        ? req.params.productId
        : undefined;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "productId is required",
      });
      return;
    }

    const cart = await removeCartItem(req.user.userId, productId);

    const totals = calculateCartTotals(
      cart.items.map((item) => ({
        price: Number(item.price),
        quantity: Number(item.quantity),
      })),
    );

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
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
    const quote = await getCheckoutQuote(items ?? [], paymentMethod, shippingMethod, deliveryAddress);

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

    const orders = await getSellerOrdersForBusinessIds(req.user, rawBusinessIds);

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

    const summary = await getSellerDashboardSummary(req.user, rawBusinessIds);

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
    const order = await getOrderForCustomerOrAuthorizedSeller(req.user, orderId);

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

    await requireAuthorizedSellerForOrder(req.user, orderId);
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

export async function cancelOrderController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const orderId = Array.isArray(req.params.orderId)
      ? req.params.orderId[0]
      : req.params.orderId;

    const order = await cancelOrderForUserOrAuthorizedSeller(
      req.user,
      orderId,
    );

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
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

    await requireAuthorizedSellerForOrder(req.user, orderId);
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
    await getOrderForCustomerOrAuthorizedSeller(req.user, orderId);
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

    await requireAuthorizedSellerForOrder(req.user, orderId);
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
