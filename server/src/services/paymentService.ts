import crypto from "node:crypto";

import mongoose from "mongoose";

import Payment from "../models/Payment.js";

import Order from "../models/Order.js";

import { AppError } from "../utils/AppError.js";

import { notifyOrderStatusChange } from "./notificationService.js";

export const PAYMENT_PROVIDERS = {
  mobile_money: { label: "Mobile money" },
  card: { label: "Card" },
  cash_on_delivery: { label: "Cash on delivery" },
} as const;

export type PaymentProvider = keyof typeof PAYMENT_PROVIDERS;

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface CreatePaymentIntentInput {
  orderId: string;
  userId: string;
  amount: number;
  currency?: string;
  provider: PaymentProvider;
  method: PaymentProvider;
}

export function normalizePaymentProvider(provider?: string) {
  const normalized = (provider ?? "cash_on_delivery").trim().toLowerCase();

  if (!(normalized in PAYMENT_PROVIDERS)) {
    throw new AppError(
      `Unsupported payment provider: ${provider ?? "cash_on_delivery"}`,
      400,
    );
  }

  return normalized as PaymentProvider;
}

export function validatePaymentStatus(status?: string): PaymentStatus {
  const normalized = (status ?? "pending").trim().toLowerCase();

  const validStatuses: PaymentStatus[] = [
    "pending",
    "paid",
    "failed",
    "refunded",
  ];

  if (!validStatuses.includes(normalized as PaymentStatus)) {
    throw new AppError(
      `Unsupported payment status: ${status ?? "pending"}`,
      400,
    );
  }

  return normalized as PaymentStatus;
}

export function createPaymentIntent({
  orderId,
  userId,
  amount,
  currency = "UGX",
  provider,
  method,
}: CreatePaymentIntentInput) {
  if (!orderId || !userId) {
    throw new AppError("orderId and userId are required", 400);
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("Payment amount must be a positive number", 400);
  }

  const normalizedProvider = normalizePaymentProvider(provider);
  const normalizedMethod = normalizePaymentProvider(method);

  return {
    orderId,
    userId,
    amount,
    currency: currency.toUpperCase(),
    provider: normalizedProvider,
    method: normalizedMethod,
    reference: `pay_${crypto.randomUUID()}`,
    status: "pending" as const,
    providerLabel: PAYMENT_PROVIDERS[normalizedProvider].label,
  };
}

export function applyWebhookPaymentState(
  currentStatus: PaymentStatus,
  nextStatus: PaymentStatus,
  metadata?: {
    provider?: string;
    reference?: string;
  },
) {
  const finalStatus = updatePaymentStatus(currentStatus, nextStatus);

  return {
    status: finalStatus,
    provider: metadata?.provider ?? "mobile_money",
    reference: metadata?.reference ?? "unknown",
  };
}

export function isPaymentTransitionAllowed(
  currentStatus: PaymentStatus,
  nextStatus: PaymentStatus,
) {
  const allowedTransitions: Record<PaymentStatus, PaymentStatus[]> = {
    pending: ["paid", "failed"],
    paid: ["refunded"],
    failed: [],
    refunded: [],
  };

  return allowedTransitions[currentStatus]?.includes(nextStatus) ?? false;
}

export function updatePaymentStatus(
  currentStatus: PaymentStatus,
  nextStatus: PaymentStatus,
) {
  /*
   * Webhook providers may deliver the same event more than once.
   * A repeated identical status is therefore considered idempotent.
   *
   * Provider event IDs provide the stronger event-level
   * idempotency guarantee in updatePaymentStatusForOrder().
   */
  if (currentStatus === nextStatus) {
    return currentStatus;
  }

  if (!isPaymentTransitionAllowed(currentStatus, nextStatus)) {
    throw new AppError(
      `Payment cannot move from ${currentStatus} to ${nextStatus}`,
      400,
    );
  }

  return nextStatus;
}

function getOrderStatusRank(status: string) {
  const orderRank: Record<string, number> = {
    pending: 0,
    paid: 1,
    confirmed: 2,
    packed: 3,
    shipped: 4,
    completed: 5,
    cancelled: 6,
  };

  return orderRank[status] ?? 0;
}

async function synchronizeOrderPaymentState(
  orderId: string,
  paymentStatus: PaymentStatus,
  session: mongoose.ClientSession,
) {
  const order = await Order.findById(orderId).session(session);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  order.paymentStatus = paymentStatus;

  /*
   * A successful payment moves a still-pending order to paid.
   *
   * We deliberately do not move an order backwards. For example:
   * confirmed -> paid must never happen merely because a webhook
   * arrived late.
   */
  if (
    paymentStatus === "paid" &&
    getOrderStatusRank(String(order.status)) < getOrderStatusRank("paid")
  ) {
    order.status = "paid";
  }

  /*
   * Failed or pending payments do not automatically regress the
   * order lifecycle. A later webhook must not turn a progressed
   * order back into pending.
   */
  await order.save({ session });

  if (paymentStatus === "paid") {
    try {
      await notifyOrderStatusChange(
        String(order.userId),
        String(order._id),
        "paid",
      );
    } catch {
      // Notification failure must not block payment synchronization.
    }
  }

  return order;
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

export async function updatePaymentStatusForOrder(
  orderId: string,
  nextStatus: PaymentStatus,
  metadata?: {
    provider?: string;
    reference?: string;
    providerEventId?: string;
  },
) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError("Valid orderId is required", 400);
  }

  const normalizedNextStatus = validatePaymentStatus(nextStatus);
  const provider = metadata?.provider?.trim();
  const providerEventId = metadata?.providerEventId?.trim();

  /*
   * Fast-path provider-event idempotency check.
   *
   * The database unique index remains the final concurrency guard.
   */
  if (provider && providerEventId) {
    const existingPayment = await Payment.findOne({
      provider,
      providerEventId,
    }).lean();

    if (existingPayment) {
      return existingPayment;
    }
  }

  const session = await mongoose.startSession();
  let result: any;

  try {
    await session.withTransaction(async () => {
      /*
       * Re-check inside the transaction because two concurrent
       * webhook requests can pass the initial lookup together.
       */
      if (provider && providerEventId) {
        const existingPayment = await Payment.findOne({
          provider,
          providerEventId,
        })
          .session(session)
          .lean();

        if (existingPayment) {
          result = existingPayment;
          return;
        }
      }

      const payment = await Payment.findOne({ orderId })
        .sort({ createdAt: -1 })
        .session(session);

      if (!payment) {
        throw new AppError("Payment record not found", 404);
      }

      const currentStatus = validatePaymentStatus(payment.status);

      const finalStatus = updatePaymentStatus(
        currentStatus,
        normalizedNextStatus,
      );

      if (provider) {
        payment.provider = provider;
      }

      if (metadata?.reference) {
        payment.reference = metadata.reference;
      }

      if (providerEventId) {
        payment.providerEventId = providerEventId;
      }

      payment.status = finalStatus;

      await payment.save({ session });

      /*
       * Payment and order payment state are now committed
       * atomically in the same transaction.
       */
      await synchronizeOrderPaymentState(
        String(payment.orderId),
        finalStatus,
        session,
      );

      result = payment.toObject();
    });
  } catch (error) {
    /*
     * Concurrent identical webhook requests can both pass the
     * initial lookup. The unique provider + providerEventId index
     * guarantees that only one can commit the event.
     */
    if (
      provider &&
      providerEventId &&
      isDuplicateKeyError(error)
    ) {
      const existingPayment = await Payment.findOne({
        provider,
        providerEventId,
      }).lean();

      if (existingPayment) {
        return existingPayment;
      }
    }

    throw error;
  } finally {
    await session.endSession();
  }

  return result;
}
