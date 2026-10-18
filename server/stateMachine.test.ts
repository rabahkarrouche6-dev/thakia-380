import { describe, expect, it } from "vitest";
import { assertBidTransition, assertTenderTransition, isBidTransitionAllowed, isTenderTransitionAllowed, scopeAllows } from "./stateMachine";

describe("procurement state machine", () => {
  it("allows only the documented tender lifecycle", () => {
    expect(isTenderTransitionAllowed("draft", "published")).toBe(true);
    expect(isTenderTransitionAllowed("published", "closed")).toBe(true);
    expect(isTenderTransitionAllowed("closed", "evaluation")).toBe(true);
    expect(isTenderTransitionAllowed("evaluation", "awarded")).toBe(true);
    expect(isTenderTransitionAllowed("evaluation", "cancelled")).toBe(true);
    expect(isTenderTransitionAllowed("awarded", "draft")).toBe(false);
    expect(isTenderTransitionAllowed("published", "awarded")).toBe(false);
  });

  it("rejects illegal transitions instead of silently mutating state", () => {
    expect(() => assertTenderTransition("awarded", "evaluation")).toThrow();
    expect(() => assertBidTransition("accepted", "rejected")).toThrow();
    expect(isBidTransitionAllowed("submitted", "under_review")).toBe(true);
    expect(isBidTransitionAllowed("draft", "accepted")).toBe(false);
  });

  it("keeps delegation scope monotonic and explicit", () => {
    expect(scopeAllows("manage", "manage")).toBe(true);
    expect(scopeAllows("manage", "decide")).toBe(true);
    expect(scopeAllows("decide", "manage")).toBe(false);
  });
});


describe("admin delegation activity window", () => {
  const base = {
    startsAt: new Date("2026-08-18T10:00:00.000Z"),
    expiresAt: new Date("2026-08-18T12:00:00.000Z"),
    revokedAt: null,
  };

  it("accepts only an unrevoked delegation inside its half-open window", async () => {
    const { isAdminDelegationActive } = await import("./stateMachine");
    expect(isAdminDelegationActive(base, new Date("2026-08-18T10:00:00.000Z"))).toBe(true);
    expect(isAdminDelegationActive(base, new Date("2026-08-18T11:59:59.999Z"))).toBe(true);
    expect(isAdminDelegationActive(base, new Date("2026-08-18T12:00:00.000Z"))).toBe(false);
  });

  it("rejects revoked delegations even when their time window is valid", async () => {
    const { isAdminDelegationActive } = await import("./stateMachine");
    expect(isAdminDelegationActive({ ...base, revokedAt: new Date("2026-08-18T11:00:00.000Z") }, new Date("2026-08-18T11:30:00.000Z"))).toBe(false);
  });
});
