import type { Request, Response, NextFunction } from "express";
import { updatePaymentStatusForOrder, validatePaymentStatus } from "../services/paymentService.js";
import { updateDeliveryStatusForOrder, normalizeDeliveryStatus } from "../services/deliveryService.js";
import { buildWebhookResponse, verifyWebhookSignature } from "../services/webhookService.js";

export async function paymentWebhookController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const payload = JSON.stringify(req.body ?? {});
    const signature = req.headers["x-signature"] as string | undefined;
    verifyWebhookSignature(payload, signature, process.env.PAYMENT_WEBHOOK_SECRET ?? "demo-secret");

    const { orderId, status, provider, reference } = req.body ?? {};
    const normalizedStatus = validatePaymentStatus(status);
    const payment = await updatePaymentStatusForOrder(orderId, normalizedStatus, {
      provider,
      reference,
    });

    res.status(200).json({
      success: true,
      message: "Payment webhook processed successfully",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

export async function deliveryWebhookController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const payload = JSON.stringify(req.body ?? {});
    const signature = req.headers["x-signature"] as string | undefined;
    verifyWebhookSignature(payload, signature, process.env.DELIVERY_WEBHOOK_SECRET ?? "demo-secret");

    const { orderId, status, courier, trackingCode } = req.body ?? {};
    const normalizedStatus = normalizeDeliveryStatus(status);
    const delivery = await updateDeliveryStatusForOrder(orderId, normalizedStatus, {
      courier,
      trackingCode,
    });

    res.status(200).json({
      success: true,
      message: "Delivery webhook processed successfully",
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
}
