import { describe, expect, it } from "vitest";
import { createCipheriv, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("bid opening committee security contracts", () => {
  const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
  const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
  const schemaSource = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");

  it("requires server-side deadline comparison before opening", () => {
    expect(routerSource).toContain("serverNow.getTime() < tender.deadline.getTime()");
    expect(routerSource).toContain("يعتمد النظام على وقت الخادم");
  });

  it("requires an active committee member and quorum", () => {
    expect(routerSource).toContain("activeIds.has(ctx.user.id)");
    expect(routerSource).toContain("selectedIds.length < quorum");
    expect(routerSource).toContain("opening_committee_member_appointed");
  });

  it("creates minutes and seals them inside the same database transaction", () => {
    expect(dbSource).toContain("return db.transaction(async tx => {");
    expect(dbSource).toContain("await tx.insert(bidOpeningMinutes)");
    expect(dbSource).toContain("contentDigest: createHash(\"sha256\")");
    expect(dbSource).toContain('await tx.update(bidOpeningSessions).set({ status: "sealed" })');
  });

  it("keeps payload and minutes inaccessible until the session is sealed", () => {
    expect(routerSource).toContain('openingSession.status !== "sealed"');
    expect(routerSource).toContain('session.status !== "sealed"');
    expect(schemaSource).toContain('["scheduled", "opened", "sealed"]');
  });

  it("does not expose a mutable minutes blob on the opening session", () => {
    expect(schemaSource).toContain('minutes: text("minutes")');
    expect(dbSource).toContain("minutes: null");
  });

  it("converts a concurrent unique-key race into an idempotent result", () => {
    expect(dbSource).toContain('code === "ER_DUP_ENTRY"');
    expect(dbSource).toContain("alreadyOpened: true as const");
    expect(dbSource).toContain("const existing = await getBidOpeningSession(tenderId)");
  });
});

// This test intentionally does not create or mutate procurement records. It verifies
// the security contract statically and leaves data-flow/concurrency verification to
// the configured database integration suite.


describe("bid opening encryption secret", () => {
  it.skip("is configured as a 32-byte AES-256 key (deferred by user)", () => {
    const raw = process.env.BID_OPENING_ENCRYPTION_KEY;
    expect(raw).toBeTruthy();
    const key = /^[0-9a-fA-F]{64}$/.test(raw ?? "")
      ? Buffer.from(raw!, "hex")
      : Buffer.from(raw ?? "", "base64");
    expect(key.byteLength).toBe(32);
    const cipher = createCipheriv("aes-256-gcm", key, randomBytes(12));
    cipher.update("bid-opening-secret-validation");
    cipher.final();
    expect(cipher.getAuthTag().byteLength).toBe(16);
  });
});

describe("opening minutes detail view contract", () => {
  it("scopes audit events and renders sealed minutes with explicit states", () => {
    const db = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const authority = readFileSync(resolve(process.cwd(), "client/src/pages/AuthorityShell.tsx"), "utf8");
    expect(db).toContain("listAuditLogsForTender");
    expect(db).toContain('eq(auditLogs.entityType, "tender")');
    expect(router).toContain("getActiveOpeningCommitteeMember(input, ctx.user.id)");
    expect(router).toContain("listAuditLogsForTender(input)");
    expect(router).toContain('session.status !== "sealed"');
    expect(authority).toContain("سجل الأحداث القابل للتدقيق");
    expect(authority).toContain("محضر رسمي مختوم");
    expect(authority).toContain("minutesQuery.isError");
  });
});

describe("opening minutes digital approval contract", () => {
  it("binds each signature to the minutes digest and committee identity", () => {
    const db = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
    expect(schema).toContain("bidOpeningMinutesSignatures");
    expect(schema).toContain("minutesId");
    expect(schema).toContain("signatureDigest");
    expect(db).toContain('createHash("sha256").update(`${minutes.contentDigest}|${minutes.id}|${tenderId}|${userId}|${member.role}|${signedAt.toISOString()}`)');
    expect(db).toContain('signatureAlgorithm: "SHA256-IDENTITY-BOUND"');
  });

  it("prevents duplicate member signatures and approves only after quorum", () => {
    const db = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
    expect(schema).toContain('uniqueIndex("bid_opening_minutes_signatures_minutes_user_unique")');
    expect(db).toContain("alreadySigned: true");
    expect(db).toContain("Math.max(2, Math.ceil(committee.length / 2))");
    expect(db).toContain('approvalStatus: "approved"');
    expect(router).toContain('action: "opening_minutes_signed"');
    expect(router).toContain('action: "opening_minutes_approved"');
  });

  it("limits signing to an authority owner who is an active committee member", () => {
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const authority = readFileSync(resolve(process.cwd(), "client/src/pages/AuthorityShell.tsx"), "utf8");
    expect(router).toContain('ctx.user.role !== "authority"');
    expect(router).toContain("tender.authorityId !== ctx.user.id");
    expect(router).toContain("يجب أن تكون عضواً فعلياً في لجنة الفتح");
    expect(authority).toContain("اعتماد أعضاء اللجنة");
    expect(authority).toContain("توقيع واعتماد");
  });
});
