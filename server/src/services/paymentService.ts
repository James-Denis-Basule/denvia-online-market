import crypto from "node:crypto";

import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import { AppError } from "../utils/AppError.js";

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
    throw new AppError(`Unsupported payment provider: ${provider ?? "cash_on_delivery"}`, 400);
  }

  return normalized as PaymentProvider;
}

export function validatePaymentStatus(status?: string): PaymentStatus {
  const normalized = (status ?? "pending").trim().toLowerCase();
  const validStatuses: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

  if (!validStatuses.includes(normalized as PaymentStatus)) {
    throw new AppError(`Unsupported payment status: ${status ?? "pending"}`, 400);
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
  metadata?: { provider?: string; reference?: string },
) {
  const finalStatus = updatePaymentStatus(currentStatus, nextStatus);

  return {
    status: finalStatus,
    provider: metadata?.provider ?? "mobile_money",
    reference: metadata?.reference ?? "unknown",
  };
}

export function isPaymentTransitionAllowed(currentStatus: PaymentStatus, nextStatus: PaymentStatus) {
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
  if (!isPaymentTransitionAllowed(currentStatus, nextStatus)) {
    throw new AppError(
      `Payment cannot move from ${currentStatus} to ${nextStatus}`,
      400,
    );
  }

  return nextStatus;
}

export async function updatePaymentStatusForOrder(
  orderId: string,
  nextStatus: PaymentStatus,
  metadata?: { provider?: string; reference?: string },
) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError("Valid orderId is required", 400);
  }

  const payment = await Payment.findOne({ orderId }).sort({ createdAt: -1 });

  if (!payment) {
    throw new AppError("Payment record not found", 404);
  }

  const currentStatus = validatePaymentStatus(payment.status);
  const finalStatus = updatePaymentStatus(currentStatus, nextStatus);

  payment.status = finalStatus;
  if (metadata?.provider) payment.provider = metadata.provider;
  if (metadata?.reference) payment.reference = metadata.reference;
  await payment.save();

  return payment.toObject();
}
