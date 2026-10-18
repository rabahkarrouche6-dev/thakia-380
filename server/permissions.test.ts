import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextFor(role: "user" | "supplier" | "authority" | "regulator" | "admin"): TrpcContext {
  return {
    user: {
      id: 9,
      openId: `test-${role}`,
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

describe("server-side role permissions", () => {
  it("requires authentication for protected procedures when called directly", async () => {
    const anonymous = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => undefined } as TrpcContext["res"],
    });
    await expect(anonymous.profile.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anonymous.regulator.audit()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("prevents self-assignment of privileged authority and regulator roles", async () => {
    const caller = appRouter.createCaller(contextFor("user"));
    await expect(caller.auth.setRole("authority")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.auth.setRole("regulator")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("restricts audit visibility to regulator and admin roles", async () => {
    const supplier = appRouter.createCaller(contextFor("supplier"));
    const authority = appRouter.createCaller(contextFor("authority"));
    const regulator = appRouter.createCaller(contextFor("regulator"));
    const admin = appRouter.createCaller(contextFor("admin"));
    await expect(supplier.regulator.audit()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(authority.regulator.audit()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(regulator.regulator.audit()).resolves.toBeDefined();
    await expect(admin.regulator.audit()).resolves.toBeDefined();
  });
  it("protects the authority shell data source by role", async () => {
    const authority = appRouter.createCaller(contextFor("authority"));
    const supplier = appRouter.createCaller(contextFor("supplier"));
    const regulator = appRouter.createCaller(contextFor("regulator"));
    await expect(authority.tenders.mine()).resolves.toBeDefined();
    await expect(supplier.tenders.mine()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(regulator.tenders.mine()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects supplier access to authority tender creation", async () => {
    const caller = appRouter.createCaller(contextFor("supplier"));
    await expect(caller.tenders.create({ title: "صفقة اختبار", description: "وصف طويل لاختبار صلاحية الإنشاء", category: "خدمات", deadline: new Date() })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects regulator access to supplier bid submission", async () => {
    const caller = appRouter.createCaller(contextFor("regulator"));
    await expect(caller.bids.submit({ tenderId: 1, amount: 1000, proposal: "هذا عرض فني تجريبي يتجاوز الحد الأدنى" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects supplier from reading authority bids", async () => {
    const caller = appRouter.createCaller(contextFor("supplier"));
    await expect(caller.bids.forTender(1)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows regulator read-only monitoring procedures", async () => {
    const caller = appRouter.createCaller(contextFor("regulator"));
    await expect(caller.regulator.stats()).resolves.toBeDefined();
    await expect(caller.regulator.audit()).resolves.toBeDefined();
    await expect(caller.regulator.tenders()).resolves.toBeDefined();
  });

  it("exposes the Overview MVP contract only to regulator and admin roles", async () => {
    const regulator = appRouter.createCaller(contextFor("regulator"));
    const supplier = appRouter.createCaller(contextFor("supplier"));
    const authority = appRouter.createCaller(contextFor("authority"));

    await expect(regulator.regulator.overview()).resolves.toMatchObject({
      stats: expect.objectContaining({ tenders: expect.any(Number), published: expect.any(Number), evaluation: expect.any(Number), bids: expect.any(Number), audits: expect.any(Number) }),
      tenderStatusCounts: expect.any(Object),
      recentAudit: expect.any(Array),
    });
    await expect(supplier.regulator.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(authority.regulator.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects regulator from every contractual mutation", async () => {
    const caller = appRouter.createCaller(contextFor("regulator"));
    await expect(caller.tenders.create({ title: "صفقة اختبار", description: "وصف طويل لاختبار الصلاحية", category: "خدمات", deadline: new Date() })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.tenders.publish(1)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.tenders.close(1)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.tenders.startEvaluation(1)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.bids.evaluate({ tenderId: 1, bidId: 1, status: "accepted", evaluationNote: "اختبار" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.awards.decide({ tenderId: 1, winningBidId: 1, decision: "awarded" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
