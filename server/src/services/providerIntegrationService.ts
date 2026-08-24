import env from "../config/env.js";

export type ProviderMode = "demo" | "live";

export type ProviderStatus = {
  name: string;
  type: "payment" | "delivery";
  mode: ProviderMode;
  enabled: boolean;
  configured: boolean;
  status: "demo" | "ready" | "missing-config";
};

const paymentProviders: Array<{ name: string; envKey?: string }> = [
  { name: "mobile_money", envKey: "FLUTTERWAVE_SECRET_KEY" },
  { name: "card", envKey: "STRIPE_SECRET_KEY" },
  { name: "cash_on_delivery", envKey: undefined },
];

const deliveryProviders: Array<{ name: string; envKey?: string }> = [
  { name: "local_dispatch", envKey: undefined },
  { name: "courier", envKey: "COURIER_API_KEY" },
  { name: "pickup", envKey: undefined },
];

function hasConfiguredSecret(key?: string) {
  if (!key) {
    return true;
  }

  return Boolean((process.env[key] ?? "").trim());
}

export function getProviderHealthSummary() {
  const summary: {
    payment: ProviderStatus[];
    delivery: ProviderStatus[];
    mode: { payment: ProviderMode; delivery: ProviderMode };
    warnings: string[];
  } = {
    payment: paymentProviders.map((provider) => {
      const configured = hasConfiguredSecret(provider.envKey);
      const liveMode = env.paymentProviderMode === "live";
      const enabled = provider.name === "cash_on_delivery" || (liveMode ? configured : true);
      const status: ProviderStatus["status"] = provider.name === "cash_on_delivery"
        ? "demo"
        : configured && enabled
          ? "ready"
          : "missing-config";

      return {
        name: provider.name,
        type: "payment",
        mode: env.paymentProviderMode,
        enabled,
        configured,
        status,
      };
    }),
    delivery: deliveryProviders.map((provider) => {
      const configured = hasConfiguredSecret(provider.envKey);
      const liveMode = env.deliveryProviderMode === "live";
      const enabled = provider.name === "local_dispatch" || (liveMode ? configured : true);
      const status: ProviderStatus["status"] = provider.name === "local_dispatch"
        ? "demo"
        : configured && enabled
          ? "ready"
          : "missing-config";

      return {
        name: provider.name,
        type: "delivery",
        mode: env.deliveryProviderMode,
        enabled,
        configured,
        status,
      };
    }),
    mode: {
      payment: env.paymentProviderMode,
      delivery: env.deliveryProviderMode,
    },
    warnings: [],
  };

  if (env.paymentProviderMode === "live") {
    const missingPayment = summary.payment.filter((provider) => provider.name !== "cash_on_delivery" && !provider.configured);
    if (missingPayment.length > 0) {
      summary.warnings.push(
        `Payment providers missing live credentials: ${missingPayment.map((provider) => provider.name).join(", ")}`,
      );
    }
  }

  if (env.deliveryProviderMode === "live") {
    const missingDelivery = summary.delivery.filter((provider) => provider.name !== "local_dispatch" && !provider.configured);
    if (missingDelivery.length > 0) {
      summary.warnings.push(
        `Delivery providers missing live credentials: ${missingDelivery.map((provider) => provider.name).join(", ")}`,
      );
    }
  }

  return summary;
}
