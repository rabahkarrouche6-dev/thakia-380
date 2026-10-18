import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const state = vi.hoisted(() => ({
  tender: { id: 1, authorityId: 7, reference: "WF-001", title: "اختبار دورة", description: "وصف كافٍ للاختبار", category: "خدمات", budget: 1000, currency: "DZD", location: "الجزائر", deadline: new Date(Date.now() + 86_400_000), status: "draft" as string, createdAt: new Date(), updatedAt: new Date(), publishedAt: null, closedAt: null },
  bids: [{ id: 11, tenderId: 1, supplierId: 9, amount: 900, proposal: "عرض فني واضح وكافٍ للاختبار", status: "submitted" as string, evaluationNote: null, submittedAt: new Date(), evaluatedAt: null }],
  audits: [] as any[],
}));

vi.mock("./db", () => ({
  getTender: vi.fn(async () => state.tender),
  getBid: vi.fn(async () => state.bids[0]),
  getBidForTender: vi.fn(async () => state.bids[0]),
  updateTender: vi.fn(async (_id: number, _authorityId: number, input: any) => { Object.assign(state.tender, input); return state.tender; }),
  transitionTenderState: vi.fn(async (_id: number, _authorityId: number, _from: string, _to: string, extra: any = {}) => { Object.assign(state.tender, extra, { status: _to }); return state.tender; }),
  transitionTenderStateById: vi.fn(async (_id: number, _from: string, _to: string, extra: any = {}) => { Object.assign(state.tender, extra, { status: _to }); return state.tender; }),
  listBidsForTender: vi.fn(async () => state.bids),
  updateBid: vi.fn(async (_id: number, input: any) => { Object.assign(state.bids[0], input); return state.bids[0]; }),
  transitionBidState: vi.fn(async (_id: number, _from: string, to: string, extra: any = {}) => { Object.assign(state.bids[0], extra, { status: to }); return state.bids[0]; }),
  createAward: vi.fn(async (input: any) => input),
  decideAwardAtomically: vi.fn(async (input: any) => { state.tender.status = input.decision === "awarded" ? "awarded" : "cancelled"; return input; }),
  hasActiveAdminDelegation: vi.fn(async () => false),
  getUserById: vi.fn(async () => undefined),
  listAdminDelegations: vi.fn(async () => []),
  revokeAdminDelegation: vi.fn(async () => false),
  createAdminDelegation: vi.fn(async (input: any) => ({ id: 1, ...input })),
  logAudit: vi.fn(async (input: any) => { state.audits.push(input); }),
  createAuthorityOperationalAlert: vi.fn(async (input: any) => input),
  getProfile: vi.fn(async () => undefined), saveProfile: vi.fn(), createTender: vi.fn(), createBid: vi.fn(), listBidsForSupplier: vi.fn(async () => []), listPublishedTenders: vi.fn(async () => []), listTendersForAuthority: vi.fn(async () => []), listAuditLogs: vi.fn(async () => state.audits), getPlatformStats: vi.fn(async () => ({ tenders: 1, published: 1, bids: 1, awarded: 0, audits: state.audits.length })),
}));

const { appRouter } = await import("./routers");

function authorityCaller() {
  const ctx: TrpcContext = { user: { id: 7, openId: "authority-workflow", name: "Authority", email: "authority@example.com", loginMethod: "test", role: "authority", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
  return appRouter.createCaller(ctx);
}

function supplierCaller() {
  const ctx: TrpcContext = { user: { id: 9, openId: "supplier-workflow", name: "Supplier", email: "supplier@example.com", loginMethod: "test", role: "supplier", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
  return appRouter.createCaller(ctx);
}

describe("successful procurement workflow", () => {
  it("moves draft to evaluation, records an evaluation audit, then awards an accepted bid", async () => {
    state.tender.status = "draft"; state.bids[0].status = "submitted"; state.audits.length = 0;
    const caller = authorityCaller();
    await caller.tenders.publish(1);
    await caller.tenders.close(1);
    await caller.tenders.startEvaluation(1);
    expect(state.tender.status).toBe("evaluation");
    state.bids[0].status = "under_review";
    await caller.bids.evaluate({ tenderId: 1, bidId: 11, status: "accepted", evaluationNote: "عرض مستوفٍ للشروط الأولية" });
    await caller.awards.decide({ tenderId: 1, winningBidId: 11, decision: "awarded", notes: "قرار اختبار موثق" });
    expect(state.tender.status).toBe("awarded");
    expect(state.bids[0].status).toBe("accepted");
    expect(state.audits.map(log => log.action)).toEqual(expect.arrayContaining(["نشر صفقة", "إغلاق صفقة", "بدء تقييم العروض", "تقييم عرض", "إسناد الصفقة"]));
  });

  it("records a cancellation decision from evaluation without a winning bid", async () => {
    state.tender.status = "evaluation"; state.audits.length = 0;
    await authorityCaller().awards.decide({ tenderId: 1, decision: "cancelled", notes: "لا توجد مطابقة" });
    expect(state.tender.status).toBe("cancelled");
    expect(state.audits.at(-1)?.action).toBe("إلغاء الصفقة");
  });

  it("rejects supplier submission after the server-side deadline", async () => {
    state.tender.status = "published";
    state.tender.deadline = new Date(Date.now() - 1_000);
    await expect(supplierCaller().bids.submit({ tenderId: 1, amount: 900, proposal: "عرض فني واضح وكافٍ للاختبار" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: "انتهى أجل استقبال العروض، ولا يمكن إرسال عرض جديد لهذه الصفقة" });
    state.tender.deadline = new Date(Date.now() + 86_400_000);
  });
});
