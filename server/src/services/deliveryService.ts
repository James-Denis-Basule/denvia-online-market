import mongoose from "mongoose";

import Delivery from "../models/Delivery.js";

import Order from "../models/Order.js";

import { AppError } from "../utils/AppError.js";

import { notifyDeliveryStatusChange } from "./notificationService.js";

export const DELIVERY_PROVIDERS = {
  local_dispatch: { label: "Local dispatch" },
  courier: { label: "Courier" },
  pickup: { label: "Pickup" },
} as const;

export type DeliveryMethod =
  | "standard"
  | "express"
  | "delivery"
  | "pickup";

export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "failed";

const ORDER_STATUS_RANK: Record<string, number> = {
  pending: 0,
  paid: 1,
  confirmed: 2,
  packed: 3,
  shipped: 4,
  completed: 5,
  cancelled: 6,
};

export function normalizeDeliveryMethod(
  method?: string,
): DeliveryMethod {
  const normalized = (method ?? "standard").trim().toLowerCase();

  const validMethods: DeliveryMethod[] = [
    "standard",
    "express",
    "delivery",
    "pickup",
  ];

  if (
    !validMethods.includes(
      normalized as DeliveryMethod,
    )
  ) {
    throw new AppError(
      `Unsupported delivery method: ${method ?? "standard"}`,
      400,
    );
  }

  return normalized as DeliveryMethod;
}

export function calculateDeliveryFee(method?: string) {
  const normalized = normalizeDeliveryMethod(method);

  const feeMap: Record<DeliveryMethod, number> = {
    standard: 5000,
    express: 15000,
    delivery: 5000,
    pickup: 0,
  };

  return feeMap[normalized];
}

export function normalizeDeliveryStatus(
  status?: string,
): DeliveryStatus {
  const normalized = (status ?? "pending").trim().toLowerCase();

  const validStatuses: DeliveryStatus[] = [
    "pending",
    "assigned",
    "in_transit",
    "delivered",
    "failed",
  ];

  if (
    !validStatuses.includes(
      normalized as DeliveryStatus,
    )
  ) {
    throw new AppError(
      `Unsupported delivery status: ${status ?? "pending"}`,
      400,
    );
  }

  return normalized as DeliveryStatus;
}

export function isDeliveryTransitionAllowed(
  currentStatus: DeliveryStatus,
  nextStatus: DeliveryStatus,
) {
  const allowedTransitions: Record<
    DeliveryStatus,
    DeliveryStatus[]
  > = {
    pending: ["assigned", "failed"],
    assigned: ["in_transit", "failed"],
    in_transit: ["delivered", "failed"],
    delivered: [],
    failed: [],
  };

  return (
    allowedTransitions[currentStatus]?.includes(
      nextStatus,
    ) ?? false
  );
}

export function updateDeliveryStatus(
  currentStatus: DeliveryStatus,
  nextStatus: DeliveryStatus,
) {
  if (currentStatus === nextStatus) {
    return currentStatus;
  }

  if (
    !isDeliveryTransitionAllowed(
      currentStatus,
      nextStatus,
    )
  ) {
    throw new AppError(
      `Delivery cannot move from ${currentStatus} to ${nextStatus}`,
      400,
    );
  }

  return nextStatus;
}

export function mapDeliveryStatusToOrderStatus(
  status: DeliveryStatus | string,
) {
  const normalized = normalizeDeliveryStatus(
    status as string,
  );

  const mapping: Record<
    DeliveryStatus,
    string | null
  > = {
    pending: null,
    assigned: "packed",
    in_transit: "shipped",
    delivered: "completed",
    failed: null,
  };

  return mapping[normalized] ?? null;
}

/**
 * Synchronize the order status with a delivery status.
 *
 * IMPORTANT:
 * This function must always run using the same MongoDB
 * session as the delivery update.
 *
 * If this function throws, the surrounding transaction
 * rolls back the delivery change as well.
 */
async function synchronizeOrderStatus(
  orderId: string,
  mappedStatus: string | null,
  session: mongoose.ClientSession,
) {
  if (!mappedStatus) {
    return null;
  }

  const order = await Order.findById(orderId)
    .session(session);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const currentOrderRank =
    ORDER_STATUS_RANK[String(order.status)] ?? 0;

  const nextOrderRank =
    ORDER_STATUS_RANK[String(mappedStatus)] ?? 0;

  if (nextOrderRank > currentOrderRank) {
    order.status = mappedStatus as any;

    await order.save({ session });
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

export async function updateDeliveryStatusForOrder(
  orderId: string,
  nextStatus: DeliveryStatus,
  metadata?: {
    courier?: string;
    trackingCode?: string;
    provider?: string;
    providerEventId?: string;
  },
) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError(
      "Valid orderId is required",
      400,
    );
  }

  const normalizedNextStatus =
    normalizeDeliveryStatus(nextStatus);

  const provider = metadata?.provider?.trim();

  const providerEventId =
    metadata?.providerEventId?.trim();

  /**
   * Fast-path idempotency check.
   *
   * This avoids opening a transaction when the exact
   * provider event has already been committed.
   *
   * IMPORTANT:
   * This check alone is not sufficient for concurrency
   * because two identical requests can pass it before
   * either request commits.
   */
  if (provider && providerEventId) {
    const existingDelivery =
      await Delivery.findOne({
        provider,
        providerEventId,
      }).lean();

    if (existingDelivery) {
      return existingDelivery;
    }
  }

  const session = await mongoose.startSession();

  let result: any;

  let notificationUserId: string | null = null;

  try {
    await session.withTransaction(async () => {
      const delivery =
        await Delivery.findOne({ orderId })
          .sort({ createdAt: -1 })
          .session(session);

      if (!delivery) {
        throw new AppError(
          "Delivery record not found",
          404,
        );
      }

      /**
       * TRANSACTION-SAFE IDEMPOTENCY CHECK
       *
       * The initial lookup above is only a fast path.
       *
       * Concurrent webhook requests can both pass it.
       *
       * MongoDB serializes conflicting writes to the same
       * delivery document. When the second transaction
       * continues/retries after the first transaction commits,
       * it must recognize that the exact provider event has
       * already been applied.
       *
       * Without this check, the second request attempts:
       *
       *   in_transit -> in_transit
       *
       * which correctly fails the normal delivery lifecycle
       * validation, but is incorrect for an already-processed
       * webhook event.
       */
      if (
        provider &&
        providerEventId &&
        delivery.provider === provider &&
        delivery.providerEventId === providerEventId
      ) {
        result = delivery.toObject();

        return;
      }

      const currentStatus =
        normalizeDeliveryStatus(
          delivery.status,
        );

      const finalStatus = updateDeliveryStatus(
        currentStatus,
        normalizedNextStatus,
      );

      const order = await Order.findById(orderId)
        .session(session);

      if (!order) {
        throw new AppError(
          "Order not found",
          404,
        );
      }

      const event = {
        status: finalStatus,

        /**
         * courier identifies the courier handling the
         * delivery. It must not overwrite delivery.provider.
         */
        courier:
          metadata?.courier ??
          delivery.provider,

        trackingCode:
          metadata?.trackingCode ??
          delivery.trackingCode,

        createdAt: new Date(),
      };

      delivery.events = Array.isArray(
        delivery.events,
      )
        ? delivery.events
        : [];

      delivery.events.push(event);

      delivery.status = finalStatus;

      /**
       * provider identifies the external delivery provider.
       */
      if (provider) {
        delivery.provider = provider;
      }

      /**
       * providerEventId identifies the provider's unique
       * webhook event and is persisted atomically with the
       * delivery transition.
       */
      if (providerEventId) {
        delivery.providerEventId =
          providerEventId;
      }

      /**
       * IMPORTANT:
       *
       * Do NOT assign metadata.courier to delivery.provider.
       *
       * provider and courier are different concepts.
       *
       * The courier belongs to the delivery event metadata.
       * The provider remains the external delivery provider.
       */

      if (metadata?.trackingCode) {
        delivery.trackingCode =
          metadata.trackingCode;
      }

      /**
       * Delivery and its provider event ID are saved
       * atomically.
       */
      await delivery.save({ session });

      const mappedOrderStatus =
        mapDeliveryStatusToOrderStatus(
          finalStatus,
        );

      await synchronizeOrderStatus(
        orderId,
        mappedOrderStatus,
        session,
      );

      notificationUserId = order.userId
        ? String(order.userId)
        : null;

      result = delivery.toObject();
    });
  } catch (error) {
    /**
     * Two identical webhook requests can arrive at
     * almost exactly the same time.
     *
     * Both requests may pass the initial lookup before
     * either request commits the provider event ID.
     *
     * The unique compound index on
     * provider + providerEventId is still the final
     * database-level concurrency guard.
     */
    if (
      provider &&
      providerEventId &&
      isDuplicateKeyError(error)
    ) {
      const existingDelivery =
        await Delivery.findOne({
          provider,
          providerEventId,
        }).lean();

      if (existingDelivery) {
        return existingDelivery;
      }
    }

    throw error;
  } finally {
    await session.endSession();
  }

  /**
   * Notifications happen only after the transaction
   * commits.
   *
   * Notification failure must never roll back
   * committed database state.
   */
  if (notificationUserId) {
    try {
      await notifyDeliveryStatusChange(
        notificationUserId,
        String(orderId),
        normalizedNextStatus,
      );
    } catch {
      // Notification failure does not affect
      // committed database state.
    }
  }

  return result;
}

export async function assignDeliveryToOrder(
  orderId: string,
  courier?: string,
  trackingCode?: string,
) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError(
      "Valid orderId is required",
      400,
    );
  }

  const session = await mongoose.startSession();

  let result: any;

  let notificationUserId: string | null = null;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId)
        .session(session);

      if (!order) {
        throw new AppError(
          "Order not found",
          404,
        );
      }

      let delivery =
        await Delivery.findOne({ orderId })
          .sort({ createdAt: -1 })
          .session(session);

      if (!delivery) {
        const generatedTrackingCode =
          trackingCode ??
          createTrackingCode();

        delivery = new Delivery({
          orderId: order._id,

          userId: order.userId,

          businessId:
            order.items?.[0]?.businessId,

          method: "standard",

          provider:
            courier ??
            "local_dispatch",

          zone: "local",

          status: "assigned",

          trackingCode:
            generatedTrackingCode,

          address:
            order.deliveryAddress,

          events: [
            {
              status: "assigned",

              courier:
                courier ??
                "local_dispatch",

              trackingCode:
                generatedTrackingCode,

              createdAt: new Date(),
            },
          ],
        });

        await delivery.save({
          session,
        });
      } else {
        const currentStatus =
          normalizeDeliveryStatus(
            delivery.status,
          );

        if (
          currentStatus === "delivered" ||
          currentStatus === "failed"
        ) {
          throw new AppError(
            "Cannot assign delivery for completed or failed deliveries",
            400,
          );
        }

        const event = {
          status:
            "assigned" as DeliveryStatus,

          courier:
            courier ??
            delivery.provider,

          trackingCode:
            trackingCode ??
            delivery.trackingCode,

          createdAt: new Date(),
        };

        delivery.events =
          Array.isArray(
            delivery.events,
          )
            ? delivery.events
            : [];

        delivery.events.push(event);

        delivery.status =
          "assigned";

        /**
         * Preserve the existing provider unless a new
         * provider/courier value is explicitly supplied
         * through the existing assignment API.
         */
        delivery.provider =
          courier ??
          delivery.provider ??
          "local_dispatch";

        delivery.trackingCode =
          trackingCode ??
          delivery.trackingCode ??
          createTrackingCode();

        await delivery.save({
          session,
        });
      }

      /**
       * Assignment and the corresponding order
       * transition are committed atomically.
       */
      await synchronizeOrderStatus(
        orderId,
        mapDeliveryStatusToOrderStatus(
          "assigned",
        ),
        session,
      );

      notificationUserId =
        order.userId
          ? String(order.userId)
          : null;

      result = delivery.toObject();
    });
  } finally {
    await session.endSession();
  }

  /**
   * Notify only after the transaction has
   * successfully committed.
   */
  if (notificationUserId) {
    try {
      await notifyDeliveryStatusChange(
        notificationUserId,
        String(orderId),
        "assigned",
      );
    } catch {
      // Notification failure does not affect
      // committed database state.
    }
  }

  return result;
}

export function applyWebhookDeliveryState(
  currentStatus: DeliveryStatus,
  nextStatus: DeliveryStatus,
  metadata?: {
    courier?: string;
    trackingCode?: string;
  },
) {
  const finalStatus =
    updateDeliveryStatus(
      currentStatus,
      nextStatus,
    );

  return {
    status: finalStatus,

    courier:
      metadata?.courier ??
      "local_dispatch",

    trackingCode:
      metadata?.trackingCode ??
      "unknown",
  };
}

export function createTrackingCode() {
  return `DEL-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

export async function getDeliveryForOrder(
  orderId: string,
) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError(
      "Valid orderId is required",
      400,
    );
  }

  const delivery =
    await Delivery.findOne({
      orderId,
    })
      .sort({ createdAt: -1 })
      .lean();

  if (!delivery) {
    return null;
  }

  return delivery;
}