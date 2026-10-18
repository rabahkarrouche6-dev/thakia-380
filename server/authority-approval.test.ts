import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const state = vi.hoisted(() => ({
  audits: [] as Array<Record<string, unknown>>,
  authorityRequestPending: false,
  assignedRoles: [] as Array<Record<string, unknown>>,
  alerts: [] as Array<Record<string, unknown>>,
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    getUserByOpenId: vi.fn(async () => undefined),
    getUserById: vi.fn(async (id: number) => id === 21 ? { id, openId: "authority-applicant", role: "user" } : undefined),
    hasAuthorityApprovalRequest: vi.fn(async () => state.authorityRequestPending),
    upsertUser: vi.fn(async (input: Record<string, unknown>) => state.assignedRoles.push(input)),
    createAuthorityOperationalAlert: vi.fn(async (input: Record<string, unknown>) => state.alerts.push(input)),
    logAudit: vi.fn(async (input: Record<string, unknown>) => {
      state.audits.push(input);
      if (input.action === "authority_role_requested" && input.result === "pending") state.authorityRequestPending = true;
    }),
  };
});

const { appRouter } = await import("./routers");

function callerFor(role: "user" | "supplier" | "admin" | "regulator") {
  const ctx: TrpcContext = {
    user: {
      id: role === "user" ? 21 : 1,
      openId: `${role}-caller`,
      name: "Role approval test",
      email: "approval@example.com",
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

describe("authority approval flow", () => {
  beforeEach(() => {
    state.audits.length = 0;
    state.assignedRoles.length = 0;
    state.alerts.length = 0;
    state.authorityRequestPending = false;
  });

  it("records a pending authority request without self-assigning a privileged role", async () => {
    await expect(callerFor("user").auth.requestAuthorityApproval()).resolves.toMatchObject({ success: true, status: "pending" });
    expect(state.assignedRoles).toHaveLength(0);
    expect(state.audits).toContainEqual(expect.objectContaining({
      action: "authority_role_requested",
      actorId: 21,
      entityId: 21,
      result: "pending",
    }));
  });

  it("allows only central reviewers to approve a pending authority request and records the decision", async () => {
    await callerFor("user").auth.requestAuthorityApproval();
    await expect(callerFor("admin").regulator.approveAuthority({ userId: 21 })).resolves.toEqual({ success: true, role: "authority" });
    expect(state.assignedRoles).toContainEqual({ openId: "authority-applicant", role: "authority" });
    expect(state.audits).toContainEqual(expect.objectContaining({ action: "authority_role_approved", entityId: 21, result: "success" }));
    expect(state.alerts).toContainEqual(expect.objectContaining({ authorityId: 21, type: "authority_approved" }));
  });

  it("rejects a pending request with a reason and records the decision", async () => {
    await callerFor("user").auth.requestAuthorityApproval();
    await expect(callerFor("admin").regulator.rejectAuthority({ userId: 21, reason: "ينقص الطلب محضر التفويض الرسمي" })).resolves.toEqual({ success: true, status: "rejected" });
    expect(state.audits).toContainEqual(expect.objectContaining({ action: "authority_role_rejected", entityId: 21, result: "rejected", metadata: expect.stringContaining("محضر التفويض") }));
  });

  it("rejects an approval attempt from a supplier", async () => {
    await expect(callerFor("supplier").regulator.approveAuthority({ userId: 21 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
