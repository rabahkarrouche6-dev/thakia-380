import type { PlanFeature, Subscription } from "../drizzle/schema";

/** These capabilities are never paywalled because they are part of neutral procurement access. */
export const LEGAL_BASELINE_FEATURES = new Set([
  "public_tender_browsing",
  "eligible_bid_submission",
  "procurement_procedure_visibility",
  "core_bid_status_visibility",
]);

export const PREMIUM_FEATURES = new Set([
  "ai_rfp_generation",
  "ai_summary_generation",
  "ai_opportunity_match",
  "ai_competitor_insights",
  "smart_evaluator_support",
  "virtual_opening_room",
  "collusion_radar",
  "advanced_notifications",
  "team_management",
  "priority_support",
  "multi_project_budgeting",
  "advanced_audit_exports",
  "document_preparation_assistance",
]);

export type EntitlementDecision = {
  allowed: boolean;
  reason: "legal_baseline" | "enabled" | "quota_available" | "quota_exhausted" | "not_entitled" | "inactive_subscription";
  remaining: number | null;
  upgradeSuggested: boolean;
};

export function assertFeatureCode(featureCode: string) {
  if (LEGAL_BASELINE_FEATURES.has(featureCode)) return;
  if (!PREMIUM_FEATURES.has(featureCode)) throw new Error("Unknown entitlement feature");
}

export function resolveEntitlement(
  featureCode: string,
  subscription: Pick<Subscription, "status" | "currentPeriodEnd"> | null | undefined,
  snapshot: Pick<PlanFeature, "enabled" | "quotaLimit" | "entitlementType"> | null | undefined,
  usedUnits = 0,
  now = new Date(),
): EntitlementDecision {
  assertFeatureCode(featureCode);
  if (LEGAL_BASELINE_FEATURES.has(featureCode)) {
    return { allowed: true, reason: "legal_baseline", remaining: null, upgradeSuggested: false };
  }
  const active = Boolean(subscription && ["trialing", "active", "grace"].includes(subscription.status) && subscription.currentPeriodEnd > now);
  if (!active) return { allowed: false, reason: "inactive_subscription", remaining: null, upgradeSuggested: true };
  if (!snapshot || snapshot.enabled !== 1) return { allowed: false, reason: "not_entitled", remaining: null, upgradeSuggested: true };
  if (snapshot.entitlementType === "quota") {
    const remaining = Math.max(0, (snapshot.quotaLimit ?? 0) - usedUnits);
    return remaining > 0
      ? { allowed: true, reason: "quota_available", remaining, upgradeSuggested: false }
      : { allowed: false, reason: "quota_exhausted", remaining: 0, upgradeSuggested: true };
  }
  return { allowed: true, reason: "enabled", remaining: null, upgradeSuggested: false };
}

const TRANSITIONS: Record<Subscription["status"], Subscription["status"][]> = {
  pending: ["trialing", "active", "cancelled"],
  trialing: ["active", "past_due", "cancelled", "expired"],
  active: ["past_due", "grace", "cancelled", "expired"],
  past_due: ["active", "grace", "cancelled", "expired"],
  grace: ["active", "expired", "cancelled"],
  cancelled: ["expired"],
  expired: [],
};

export function assertSubscriptionTransition(from: Subscription["status"], to: Subscription["status"]) {
  if (!TRANSITIONS[from].includes(to)) throw new Error(`Invalid subscription transition: ${from} -> ${to}`);
}

export function isProcurementNeutralFeature(featureCode: string) {
  return LEGAL_BASELINE_FEATURES.has(featureCode);
}

export function isPremiumOnlyFeature(featureCode: string) {
  return PREMIUM_FEATURES.has(featureCode) && !LEGAL_BASELINE_FEATURES.has(featureCode);
}

export function getBillingPeriodEnd(start: Date, cycle: "monthly" | "yearly" | "free") {
  const end = new Date(start);
  if (cycle === "yearly" || cycle === "free") end.setUTCFullYear(end.getUTCFullYear() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  return end;
}
