import { describe, expect, it } from "vitest";
import { assertSubscriptionTransition, getBillingPeriodEnd, isProcurementNeutralFeature, resolveEntitlement } from "./subscriptions";

describe("subscription entitlement guardrails", () => {
  const active = { status: "active" as const, currentPeriodEnd: new Date("2030-01-01T00:00:00Z") };
  it("never paywalls legally neutral procurement access", () => {
    const decision = resolveEntitlement("eligible_bid_submission", { status: "expired", currentPeriodEnd: new Date("2020-01-01T00:00:00Z") }, null, 999, new Date("2026-01-01T00:00:00Z"));
    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBe("legal_baseline");
    expect(isProcurementNeutralFeature("public_tender_browsing")).toBe(true);
  });
  it("enforces quota exhaustion on premium features", () => {
    const decision = resolveEntitlement("ai_opportunity_match", active, { enabled: 1, quotaLimit: 10, seatLimit: null, entitlementType: "quota" }, 10, new Date("2026-01-01T00:00:00Z"));
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("quota_exhausted");
    expect(decision.upgradeSuggested).toBe(true);
  });
  it("rejects invalid lifecycle transitions", () => {
    expect(() => assertSubscriptionTransition("expired", "active")).toThrow("Invalid subscription transition");
    expect(() => assertSubscriptionTransition("active", "grace")).not.toThrow();
  });
  it("calculates monthly and yearly periods in UTC", () => {
    expect(getBillingPeriodEnd(new Date("2026-01-31T00:00:00Z"), "monthly").getUTCMonth()).toBe(2);
    expect(getBillingPeriodEnd(new Date("2026-01-01T00:00:00Z"), "yearly").getUTCFullYear()).toBe(2027);
  });
});
