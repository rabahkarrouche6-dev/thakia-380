import { describe, expect, it } from "vitest";
import { resolveEntitlement } from "./subscriptions";

describe("assistant entitlement contract", () => {
  const active = {
    status: "active" as const,
    currentPeriodEnd: new Date("2030-01-01T00:00:00Z"),
  };

  it("allows a quota-backed assistant feature while units remain", () => {
    const decision = resolveEntitlement("ai_rfp_generation", active, {
      enabled: 1,
      entitlementType: "quota",
      quotaLimit: 10,
    }, 9, new Date("2029-01-01T00:00:00Z"));
    expect(decision).toMatchObject({ allowed: true, reason: "quota_available", remaining: 1 });
  });

  it("denies the assistant after quota exhaustion", () => {
    const decision = resolveEntitlement("ai_rfp_generation", active, {
      enabled: 1,
      entitlementType: "quota",
      quotaLimit: 10,
    }, 10, new Date("2029-01-01T00:00:00Z"));
    expect(decision).toMatchObject({ allowed: false, reason: "quota_exhausted", remaining: 0, upgradeSuggested: true });
  });

  it("never turns procurement access into a paid feature", () => {
    const decision = resolveEntitlement("eligible_bid_submission", null, null, 999, new Date("2029-01-01T00:00:00Z"));
    expect(decision).toMatchObject({ allowed: true, reason: "legal_baseline", upgradeSuggested: false });
  });
});
