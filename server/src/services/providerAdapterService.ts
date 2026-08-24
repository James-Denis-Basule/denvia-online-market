import env from "../config/env.js";
import { normalizePaymentProvider } from "./paymentService.js";

export type ProviderMode = "demo" | "live";

export type PaymentProviderRequest = {
  provider: string;
  mode: ProviderMode;
  enabled: boolean;
  configured: boolean;
  gateway: "cash_on_delivery" | "demo" | "stripe" | "flutterwave";
  reference: string;
  metadata: Record<string, unknown>;
};

export type DeliveryProviderRequest = {
  provider: string;
  mode: ProviderMode;
  enabled: boolean;
  configured: boolean;
  gateway: "local_dispatch" | "demo" | "courier";
  reference: string;
  metadata: Record<string, unknown>;
};

function hasLivePaymentConfig(provider: string) {
  const normalized = provider.trim().toLowerCase();

  if (normalized === "card") return Boolean(env.stripeSecretKey);
  if (normalized === "mobile_money") return Boolean(env.flutterwaveSecretKey);
  return true;
}

function hasLiveDeliveryConfig(provider: string) {
  const normalized = provider.trim().toLowerCase();

  if (normalized === "courier") return Boolean(env.courierApiKey);
  return true;
}

export function buildPaymentProviderRequest({
  provider,
  orderId,
  amount,
  currency = "UGX",
}: {
  provider: string;
  orderId: string;
  amount: number;
  currency?: string;
}): PaymentProviderRequest {
  const normalized = normalizePaymentProvider(provider);
  const configured = hasLivePaymentConfig(normalized);
  const mode: ProviderMode = env.paymentProviderMode === "live" && configured ? "live" : "demo";
  const gateway = normalized === "card" ? "stripe" : normalized === "mobile_money" ? "flutterwave" : normalized === "cash_on_delivery" ? "cash_on_delivery" : "demo";

  return {
    provider: normalized,
    mode,
    enabled: normalized === "cash_on_delivery" || configured || mode === "demo",
    configured,
    gateway,
    reference: `${mode === "live" ? "live" : "demo"}_${normalized}_${orderId}_${Date.now()}`,
    metadata: {
      orderId,
      amount,
      currency: currency.toUpperCase(),
      provider: normalized,
      mode,
    },
  };
}

export function buildDeliveryProviderRequest({
  provider,
  orderId,
  trackingCode,
}: {
  provider: string;
  orderId: string;
  trackingCode?: string;
}): DeliveryProviderRequest {
  const normalized = provider.trim().toLowerCase() || "local_dispatch";
  const configured = hasLiveDeliveryConfig(normalized);
  const mode: ProviderMode = env.deliveryProviderMode === "live" && configured ? "live" : "demo";
  const gateway = normalized === "courier" ? "courier" : normalized === "local_dispatch" ? "local_dispatch" : "demo";

  return {
    provider: normalized,
    mode,
    enabled: normalized === "local_dispatch" || configured || mode === "demo",
    configured,
    gateway,
    reference: `${mode === "live" ? "live" : "demo"}_${normalized}_${orderId}_${trackingCode ?? Date.now().toString()}`,
    metadata: {
      orderId,
      trackingCode: trackingCode ?? `DEL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      provider: normalized,
      mode,
    },
  };
}
