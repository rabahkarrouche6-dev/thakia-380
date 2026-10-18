import { describe, expect, it } from "vitest";
import { computeAuditEntryHash, verifyAuditLogChain } from "./db";

function entry(id: number, previousHash: string, metadata = "{\"ok\":true}") {
  const base = { id, actorId: 7, actorRole: "authority", action: "tender_updated", entityType: "tender", entityId: 11, result: "success", metadata, createdAt: new Date(`2026-08-18T12:00:0${id}Z`), previousHash };
  return { ...base, entryHash: computeAuditEntryHash(base) };
}

describe("audit log hash chain", () => {
  it("accepts a valid genesis-linked chain", () => {
    const first = entry(1, "GENESIS");
    const second = entry(2, first.entryHash);
    expect(verifyAuditLogChain([second, first])).toBe(true);
  });

  it("rejects metadata tampering", () => {
    const first = entry(1, "GENESIS");
    const second = entry(2, first.entryHash);
    second.metadata = "{\"ok\":false}";
    expect(verifyAuditLogChain([first, second])).toBe(false);
  });

  it("rejects a broken predecessor link", () => {
    const first = entry(1, "GENESIS");
    const second = entry(2, "different-predecessor");
    expect(verifyAuditLogChain([first, second])).toBe(false);
  });
});
