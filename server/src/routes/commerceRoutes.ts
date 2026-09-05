import { Router } from "express";
import {
  getCartController,
  addToCartController,
  updateCartItemController,
  removeCartItemController,
  createOrderController,
  trackGuestOrderController,
  getCheckoutQuoteController,
  getOrderByIdController,
  getOrdersController,
  getSellerDashboardSummaryController,
  getSellerOrdersController,
  updateOrderStatusController,
  assignDeliveryController,
  getDeliveryForOrderController,
  updateDeliveryStatusController,
  cancelOrderController
} from "../controllers/commerceController.js";
import { authenticate, optionalAuthenticate } from "../middleware/authMiddleware.js";
import { createRateLimiter } from "../middleware/securityMiddleware.js";

const router = Router();

router.get("/cart", authenticate, getCartController);
router.post("/cart/items", authenticate, addToCartController);
router.patch(
  "/cart/items/:productId",
  authenticate,
  updateCartItemController,
);
router.delete(
  "/cart/items/:productId",
  authenticate,
  removeCartItemController,
);
router.post("/checkout/quote", getCheckoutQuoteController);
router.get("/orders", authenticate, getOrdersController);
router.get("/orders/seller", authenticate, getSellerOrdersController);
router.get("/orders/seller/summary", authenticate, getSellerDashboardSummaryController);
router.get("/orders/track", trackGuestOrderController);
router.get("/orders/:orderId", authenticate, getOrderByIdController);
const orderCreationRateLimiter = createRateLimiter({
  windowMs: 10 * 60_000,
  maxRequests: 10,
});

router.post("/orders", optionalAuthenticate, orderCreationRateLimiter, createOrderController);
router.post("/orders/:orderId/cancel", authenticate, cancelOrderController);
router.patch("/orders/:orderId/status", authenticate, updateOrderStatusController);
router.post("/orders/:orderId/assign-delivery", authenticate, assignDeliveryController);
router.get("/orders/:orderId/delivery", authenticate, getDeliveryForOrderController);
router.patch("/orders/:orderId/delivery/status", authenticate, updateDeliveryStatusController);

export default router;
