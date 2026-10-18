import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const state = vi.hoisted(() => ({
  tender: undefined as any,
  audits: [] as any[],
  nextId: 41,
}));

vi.mock("./db", () => ({
  createTender: vi.fn(async (input: any) => {
    state.tender = { id: state.nextId, createdAt: new Date(), updatedAt: new Date(), publishedAt: null, closedAt: null, ...input };
    return state.tender;
  }),
  getTender: vi.fn(async (id: number) => state.tender?.id === id ? state.tender : undefined),
  transitionTenderState: vi.fn(async (id: number, authorityId: number, _from: string, to: string, input: any = {}) => {
    if (!state.tender || state.tender.id !== id || state.tender.authorityId !== authorityId) return undefined;
    Object.assign(state.tender, input, { status: to, updatedAt: new Date() });
    return state.tender;
  }),
  transitionTenderStateById: vi.fn(async (id: number, _from: string, to: string, input: any = {}) => {
    if (!state.tender || state.tender.id !== id) return undefined;
    Object.assign(state.tender, input, { status: to, updatedAt: new Date() });
    return state.tender;
  }),
  updateTender: vi.fn(async (id: number, authorityId: number, input: any) => {
    if (!state.tender || state.tender.id !== id || state.tender.authorityId !== authorityId) return state.tender;
    Object.assign(state.tender, input, { updatedAt: new Date() });
    return state.tender;
  }),
  logAudit: vi.fn(async (input: any) => { state.audits.push(input); }),
  getProfile: vi.fn(async () => undefined),
  saveProfile: vi.fn(),
  createBid: vi.fn(),
  listBidsForSupplier: vi.fn(async () => []),
  listPublishedTenders: vi.fn(async () => []),
  listTendersForAuthority: vi.fn(async () => state.tender ? [state.tender] : []),
  listBidsForTender: vi.fn(async () => []),
  getBid: vi.fn(),
  getBidForTender: vi.fn(),
  transitionBidState: vi.fn(),
  updateBid: vi.fn(),
  decideAwardAtomically: vi.fn(),
  createAward: vi.fn(),
  hasActiveAdminDelegation: vi.fn(async () => false),
  getUserById: vi.fn(async () => undefined),
  listAdminDelegations: vi.fn(async () => []),
  revokeAdminDelegation: vi.fn(async () => false),
  createAdminDelegation: vi.fn(),
  listAuditLogs: vi.fn(async () => state.audits),
  getPlatformStats: vi.fn(async () => ({ tenders: state.tender ? 1 : 0, published: state.tender?.status === "published" ? 1 : 0, bids: 0, awarded: 0, audits: state.audits.length })),
  listAllTenders: vi.fn(async () => state.tender ? [state.tender] : []),
  upsertUser: vi.fn(),
  createAuthorityOperationalAlert: vi.fn(async (input: any) => input),
}));

const { appRouter } = await import("./routers");

function callerFor(id: number) {
  const ctx: TrpcContext = {
    user: { id, openId: `authority-${id}`, name: "Authority", email: "authority@example.com", loginMethod: "test", role: "authority", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

const validInput = {
  title: "اقتناء تجهيزات مكتبية",
  description: "وصف تفصيلي كافٍ لاختبار إنشاء الصفقة في المسار المؤسسي",
  category: "تجهيزات",
  location: "الجزائر",
  budget: 1500000,
  deadline: new Date(Date.now() + 86_400_000),
};

describe("authority tender create flow", () => {
  it("creates a draft, updates it, then publishes it through protected procedures", async () => {
    state.tender = undefined;
    state.audits.length = 0;
    const caller = callerFor(7);

    const created = await caller.tenders.create(validInput);
    expect(created?.status).toBe("draft");
    expect(created?.authorityId).toBe(7);
    expect(created?.currency).toBe("DZD");

    const updated = await caller.tenders.update({ id: 41, data: { title: "اقتناء تجهيزات مكتبية محدثة" } });
    expect(updated?.title).toContain("محدثة");
    expect(updated?.status).toBe("draft");

    const published = await caller.tenders.publish(41);
    expect(published?.status).toBe("published");
    expect(state.audits.map(log => log.action)).toEqual(expect.arrayContaining(["إنشاء صفقة", "نشر صفقة"]));
  });

  it("rejects update and publish attempts from a different authority owner", async () => {
    state.tender = { ...validInput, id: 41, authorityId: 7, status: "draft" };
    const otherAuthority = callerFor(8);
    await expect(otherAuthority.tenders.update({ id: 41, data: { title: "محاولة غير مصرح بها" } })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(otherAuthority.tenders.publish(41)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
