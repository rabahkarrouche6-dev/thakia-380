import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "./db";

describe("database readiness integration", () => {
  it("exposes the critical indexes when a database is configured", async () => {
    const db = await getDb();
    if (!db) return;
    const result = await db.execute(sql`SELECT TABLE_NAME, INDEX_NAME FROM information_schema.statistics WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME IN ('bids_tender_supplier_unique', 'bids_tender_status_idx', 'tenders_status_deadline_idx', 'audit_logs_created_at_idx')`);
    const rows = (result as any)[0] ?? result ?? [];
    const names = new Set(rows.map((row: any) => row.INDEX_NAME ?? row.indexName));
    expect(names.has("bids_tender_supplier_unique")).toBe(true);
    expect(names.has("bids_tender_status_idx")).toBe(true);
    expect(names.has("tenders_status_deadline_idx")).toBe(true);
    expect(names.has("audit_logs_created_at_idx")).toBe(true);
  });

  it("keeps the audit log projection aligned with the Drizzle schema", async () => {
    const db = await getDb();
    if (!db) return;
    const result = await db.execute(sql`SELECT COLUMN_NAME FROM information_schema.columns WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auditLogs'`);
    const rows = (result as any)[0] ?? result ?? [];
    const columns = new Set(rows.map((row: any) => row.COLUMN_NAME ?? row.columnName));
    for (const column of ["id", "actorId", "actorRole", "action", "entityType", "entityId", "result", "metadata", "previousHash", "entryHash", "createdAt"]) {
      expect(columns.has(column)).toBe(true);
    }
  });
});


describe("bid opening concurrency integration", () => {
  it("documents the production concurrency gate without mutating live procurement data", async () => {
    const db = await getDb();
    if (!db) return;
    const result = await db.execute(sql`SELECT INDEX_NAME FROM information_schema.statistics WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bidOpeningSessions' AND INDEX_NAME = 'bidOpeningSessions_tenderId_unique'`);
    const rows = (result as any)[0] ?? result ?? [];
    expect(rows.length).toBeGreaterThan(0);
  });
});
