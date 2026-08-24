import { AppError } from "../utils/AppError.js";
import AIUsage from "../models/AIUsage.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";

export const defaultPlanCatalog = [
  {
    name: "Free",
    slug: "free",
    price: 0,
    aiCreditsIncluded: 10,
    features: ["Business profile", "Storefront", "Manual posts"],
    isActive: true,
  },
  {
    name: "Growth",
    slug: "growth",
    price: 14900,
    aiCreditsIncluded: 100,
    features: ["AI copy generation", "Content planning", "Basic analytics"],
    isActive: true,
  },
  {
    name: "Pro",
    slug: "pro",
    price: 29900,
    aiCreditsIncluded: 250,
    features: ["Advanced AI", "Email campaigns", "Priority support"],
    isActive: true,
  },
] as const;

export function getDefaultPlanCatalog() {
  return [...defaultPlanCatalog];
}

export function calculateRemainingCredits(
  totalCredits: number,
  creditsUsed: number,
) {
  return Math.max(0, totalCredits - creditsUsed);
}

export async function getPlanCatalog() {
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 }).lean();

  if (plans.length > 0) {
    return plans;
  }

  const seededPlans = await SubscriptionPlan.insertMany(getDefaultPlanCatalog());
  return seededPlans;
}

export async function getUsageSummary(
  filters: {
    userId?: string;
    businessId?: string;
  } = {},
) {
  const query: Record<string, unknown> = {};

  if (filters.userId) {
    query.userId = filters.userId;
  }

  if (filters.businessId) {
    query.businessId = filters.businessId;
  }

  const [usageRecords, totalCreditsUsed] = await Promise.all([
    AIUsage.find(query).sort({ createdAt: -1 }).limit(20).lean(),
    AIUsage.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$creditsUsed" } } },
    ]),
  ]);

  return {
    totalCreditsUsed: totalCreditsUsed[0]?.total ?? 0,
    recentUsage: usageRecords,
  };
}

export async function consumeAiCredits(
  params: {
    userId?: string;
    businessId?: string;
    action: string;
    creditsRequired: number;
    metadata?: Record<string, unknown>;
  },
) {
  const creditsRequired = Number(params.creditsRequired) || 0;

  if (creditsRequired < 0) {
    throw new AppError("AI credit cost cannot be negative", 400);
  }

  if (creditsRequired === 0) {
    return {
      creditsUsed: 0,
      remainingCredits: 0,
      status: "success",
    };
  }

  const plan = await SubscriptionPlan.findOne({ isActive: true, slug: "free" }).lean();
  const availableCredits = plan?.aiCreditsIncluded ?? 10;

  if (creditsRequired > availableCredits) {
    throw new AppError(
      `Insufficient AI credits. Required: ${creditsRequired}, available: ${availableCredits}`,
      402,
    );
  }

  const usage = await AIUsage.create({
    userId: params.userId,
    businessId: params.businessId,
    action: params.action,
    creditsUsed: creditsRequired,
    metadata: params.metadata ?? {},
    status: "success",
  });

  return {
    creditsUsed: usage.creditsUsed,
    remainingCredits: calculateRemainingCredits(availableCredits, creditsRequired),
    status: usage.status,
  };
}
