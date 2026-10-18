import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

type ContractStatus = "pending_signature" | "active" | "completed" | "suspended" | "terminated";

const state = vi.hoisted(() => ({
  contractStatus: "pending_signature" as ContractStatus,
  authorityAlerts: [] as Array<Record<string, unknown>>,
  supplierAlerts: [] as Array<Record<string, unknown>>,
  audits: [] as Array<Record<string, unknown>>,
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  const contract = (status: ContractStatus) => ({
    id: 91,
    tenderId: 38,
    supplierId: 27,
    contractReference: "CT-2026-00091",
    tenderReference: "AO-2026-00038",
    tenderTitle: "اقتناء تجهيزات مهنية",
    supplierName: "المتعامل المعتمد",
    amount: 450000,
    currency: "DZD",
    status,
    awardedAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
  });
  return {
    ...actual,
    listAuthorityContracts: vi.fn(async (authorityId: number) => authorityId === 41 ? [contract(state.contractStatus)] : []),
    getAuthorityContract: vi.fn(async (contractId: number, authorityId: number) => contractId === 91 && authorityId === 41 ? contract(state.contractStatus) : undefined),
    updateAuthorityContractStatus: vi.fn(async (contractId: number, expectedStatus: ContractStatus, nextStatus: ContractStatus) => {
      if (contractId !== 91 || state.contractStatus !== expectedStatus) return undefined;
      state.contractStatus = nextStatus;
      return contract(nextStatus);
    }),
    listAuthorityTenderDocuments: vi.fn(async (authorityId: number) => authorityId === 41 ? [{ id: 7, tenderId: 38, fileName: "cahier-des-charges.pdf", mimeType: "application/pdf", sizeBytes: 1024, createdAt: new Date("2026-08-01T00:00:00.000Z"), tenderReference: "AO-2026-00038", tenderTitle: "اقتناء تجهيزات مهنية", tenderStatus: "draft" }] : []),
    createAuthorityOperationalAlert: vi.fn(async (input: Record<string, unknown>) => state.authorityAlerts.push(input)),
    createSupplierOperationalAlert: vi.fn(async (input: Record<string, unknown>) => state.supplierAlerts.push(input)),
    logAudit: vi.fn(async (input: Record<string, unknown>) => state.audits.push(input)),
  };
});

const { appRouter } = await import("./routers");

function callerFor(role: "authority" | "supplier" | "admin", id = role === "authority" ? 41 : 72) {
  const ctx: TrpcContext = {
    user: { id, openId: `${role}-caller`, name: "Authority contracts test", email: "authority-contracts@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

describe("authority contracts and archive governance", () => {
  beforeEach(() => {
    state.contractStatus = "pending_signature";
    state.authorityAlerts.length = 0;
    state.supplierAlerts.length = 0;
    state.audits.length = 0;
  });

  it("lists only the current authority contract record and archive", async () => {
    await expect(callerFor("authority").authority.contracts.list()).resolves.toHaveLength(1);
    await expect(callerFor("authority").authority.archive.list()).resolves.toMatchObject([{ id: 7, tenderId: 38 }]);
  });

  it("rejects supplier access to authority contracts and archive", async () => {
    await expect(callerFor("supplier").authority.contracts.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor("supplier").authority.archive.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows only a valid owned transition and produces audited notifications for both parties", async () => {
    await expect(callerFor("authority").authority.contracts.transitionStatus({ contractId: 91, status: "active" })).resolves.toMatchObject({ id: 91, status: "active" });
    expect(state.authorityAlerts).toContainEqual(expect.objectContaining({ authorityId: 41, type: "contract_status" }));
    expect(state.supplierAlerts).toContainEqual(expect.objectContaining({ supplierId: 27, contractId: 91, type: "contract_status" }));
    expect(state.audits).toContainEqual(expect.objectContaining({ actorId: 41, action: "authority_contract_status_updated", result: "success" }));
  });

  it("rejects invalid transitions and contracts outside the current authority ownership", async () => {
    state.contractStatus = "completed";
    await expect(callerFor("authority").authority.contracts.transitionStatus({ contractId: 91, status: "active" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(callerFor("authority").authority.contracts.transitionStatus({ contractId: 404, status: "active" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
