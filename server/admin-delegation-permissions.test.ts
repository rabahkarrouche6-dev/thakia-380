import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextFor(role: "supplier" | "authority" | "admin", openId = `test-${role}`): TrpcContext {
  return {
    user: {
      id: 9,
      openId,
      name: "Test User",
      email: "test@example.com",
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

const validDelegationInput = {
  delegateAdminId: 12,
  authorityUserId: 44,
  scope: "manage" as const,
  reason: "تفويض إداري مضبوط النطاق للاختبار العقدي",
  startsAt: new Date(Date.now() + 60_000),
  expiresAt: new Date(Date.now() + 86_400_000),
};

describe("admin delegation permission contract", () => {
  it("rejects non-admin users from listing, creating, or revoking delegations", async () => {
    const supplier = appRouter.createCaller(contextFor("supplier"));
    const authority = appRouter.createCaller(contextFor("authority"));

    await expect(supplier.adminDelegation.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(authority.adminDelegation.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(supplier.adminDelegation.create(validDelegationInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(authority.adminDelegation.revoke(1)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps creation and revocation reserved for the system owner", async () => {
    const nonOwnerAdmin = appRouter.createCaller(contextFor("admin"));

    await expect(nonOwnerAdmin.adminDelegation.create(validDelegationInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(nonOwnerAdmin.adminDelegation.revoke(1)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an admin role to reach the read contract without exposing another admin scope", async () => {
    const admin = appRouter.createCaller(contextFor("admin"));
    await expect(admin.adminDelegation.list()).resolves.toBeDefined();
  });
});

if (import.meta.vitest) {
  void import.meta.vitest;
}
