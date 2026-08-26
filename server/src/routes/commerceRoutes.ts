import { Router } from "express";
import {
  getCartController,
  addToCartController,
  createOrderController,
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
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/cart", authenticate, getCartController);
router.post("/cart/items", authenticate, addToCartController);
router.post("/checkout/quote", authenticate, getCheckoutQuoteController);
router.get("/orders", authenticate, getOrdersController);
router.get("/orders/seller", authenticate, getSellerOrdersController);
router.get("/orders/seller/summary", authenticate, getSellerDashboardSummaryController);
router.get("/orders/:orderId", authenticate, getOrderByIdController);
router.post("/orders", authenticate, createOrderController);
router.post("/orders/:orderId/cancel", authenticate, cancelOrderController);
router.patch("/orders/:orderId/status", authenticate, updateOrderStatusController);
router.post("/orders/:orderId/assign-delivery", authenticate, assignDeliveryController);
router.get("/orders/:orderId/delivery", authenticate, getDeliveryForOrderController);
router.patch("/orders/:orderId/delivery/status", authenticate, updateDeliveryStatusController);

export default router;
