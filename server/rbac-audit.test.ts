import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const state = vi.hoisted(() => ({ audits: [] as Array<Record<string, unknown>> }));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    getUserByOpenId: vi.fn(async () => undefined),
    upsertUser: vi.fn(async () => undefined),
    logAudit: vi.fn(async (input: Record<string, unknown>) => {
      state.audits.push(input);
    }),
  };
});

const { appRouter } = await import("./routers");

function callerFor(role: "user" | "admin") {
  const ctx: TrpcContext = {
    user: {
      id: role === "admin" ? 1 : 9,
      openId: `audit-${role}`,
      name: "Audit Test User",
      email: "audit@example.com",
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

describe("RBAC audit trail", () => {
  it("records a safe audit event after a sensitive role change", async () => {
    state.audits.length = 0;
    await callerFor("user").auth.setRole("supplier");
    expect(state.audits).toEqual(expect.arrayContaining([
      expect.objectContaining({
        actorId: 9,
        action: "role_assigned",
        entityType: "user",
        result: "success",
      }),
    ]));
    expect(JSON.stringify(state.audits)).not.toContain("password");
    expect(JSON.stringify(state.audits)).not.toContain("token");
  });

  it("does not allow an unauthenticated caller to reach audited role mutation", async () => {
    state.audits.length = 0;
    const anonymous = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => undefined } as TrpcContext["res"],
    });
    await expect(anonymous.auth.setRole("supplier")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(state.audits).toHaveLength(0);
  });
});

void callerFor;
