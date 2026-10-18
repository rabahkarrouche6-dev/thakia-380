import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("supplier contract and operational alert contracts", () => {
  const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
  const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
  const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
  const supplierPage = readFileSync(resolve(process.cwd(), "client/src/pages/SupplierWorkspace.tsx"), "utf8");

  it("persists contracts and alerts with supplier-scoped indexes", () => {
    expect(schema).toContain("supplierContracts");
    expect(schema).toContain("supplierOperationalAlerts");
    expect(schema).toContain("supplier_contracts_supplier_status_idx");
    expect(schema).toContain("supplier_operational_alerts_supplier_read_idx");
    expect(dbSource).toContain("listSupplierContracts");
    expect(dbSource).toContain("listSupplierOperationalAlerts");
    expect(dbSource).toContain("markSupplierOperationalAlertsRead");
  });

  it("creates a contract and an auditable alert together when an award is recorded", () => {
    expect(dbSource).toContain('if (supplierContract && nextTenderState === "awarded")');
    expect(dbSource).toContain("await tx.insert(supplierContracts).values");
    expect(dbSource).toContain("await tx.insert(supplierOperationalAlerts).values");
    expect(dbSource).toContain("contract_awarded");
    expect(dbSource).toContain("awardedAt: new Date()");
  });

  it("exposes supplier-only read and acknowledgement procedures", () => {
    const supplierRouter = router.slice(router.indexOf("supplier: router({"), router.indexOf("authority: router({"));
    expect(supplierRouter).toContain('roleProcedure(["supplier"])');
    expect(supplierRouter).toContain("contracts: router({");
    expect(supplierRouter).toContain("alerts: router({");
    expect(supplierRouter).toContain("markRead:");
    expect(supplierRouter).toContain("markAllRead:");
  });

  it("renders clear contract state and visually distinct unread alerts", () => {
    expect(supplierPage).toContain("contractStatusLabels");
    expect(supplierPage).toContain("عرض التفاصيل");
    expect(supplierPage).toContain("alertAccent");
    expect(supplierPage).toContain("جديد");
    expect(supplierPage).toContain("تمييز الكل كمقروء");
  });
});
