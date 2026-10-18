import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { bidDocuments, bids, tenderDocuments, tenders, users } from "../drizzle/schema";

/**
 * This suite is intentionally opt-in. It must run only against an isolated
 * integration database, never against the deployed application database.
 *
 * Example:
 * RUN_IDOR_INTEGRATION=1 DATABASE_URL=mysql://... pnpm vitest run server/idor.integration.test.ts
 */
const enabled = process.env.RUN_IDOR_INTEGRATION === "1" && Boolean(process.env.DATABASE_URL);
const describeIntegration = enabled ? describe : describe.skip;

type Fixture = {
  authorityA: number;
  authorityB: number;
  supplierA: number;
  supplierB: number;
  tenderA: number;
  bidA: number;
  tenderDocumentA: number;
  bidDocumentA: number;
};

function callerFor(id: number, role: "supplier" | "authority") {
  const ctx: TrpcContext = {
    user: { id, openId: `idor-${id}`, name: "IDOR integration", email: `idor-${id}@example.test`, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

describeIntegration("IDOR ownership isolation on an isolated integration database", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let fixture: Fixture;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("RUN_IDOR_INTEGRATION requires a reachable isolated database");

    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const insertedUsers = await db.insert(users).values([
      { openId: `idor-authority-a-${suffix}`, name: "Authority A", role: "authority" },
      { openId: `idor-authority-b-${suffix}`, name: "Authority B", role: "authority" },
      { openId: `idor-supplier-a-${suffix}`, name: "Supplier A", role: "supplier" },
      { openId: `idor-supplier-b-${suffix}`, name: "Supplier B", role: "supplier" },
    ]);
    const firstId = Number(insertedUsers[0].insertId);
    fixture = { authorityA: firstId, authorityB: firstId + 1, supplierA: firstId + 2, supplierB: firstId + 3, tenderA: 0, bidA: 0, tenderDocumentA: 0, bidDocumentA: 0 };

    const tenderInsert = await db.insert(tenders).values({
      authorityId: fixture.authorityA,
      reference: `IDOR-${suffix}`,
      title: "Tender isolation fixture",
      description: "Fixture used only by the opt-in IDOR integration suite.",
      category: "services",
      budget: 1000,
      currency: "DZD",
      location: "Algeria",
      deadline: new Date(Date.now() + 86_400_000),
      status: "published",
    });
    fixture.tenderA = Number(tenderInsert[0].insertId);

    const bidInsert = await db.insert(bids).values({ tenderId: fixture.tenderA, supplierId: fixture.supplierA, amount: 500, proposal: "A valid fixture proposal with enough content", status: "draft" });
    fixture.bidA = Number(bidInsert[0].insertId);

    const tenderDocumentInsert = await db.insert(tenderDocuments).values({ tenderId: fixture.tenderA, uploadedBy: fixture.authorityA, fileName: "tender.pdf", mimeType: "application/pdf", sizeBytes: 4, storageKey: `idor/${suffix}/tender.pdf`, storageUrl: "https://example.test/tender.pdf" });
    fixture.tenderDocumentA = Number(tenderDocumentInsert[0].insertId);
    const bidDocumentInsert = await db.insert(bidDocuments).values({ bidId: fixture.bidA, uploadedBy: fixture.supplierA, fileName: "bid.pdf", mimeType: "application/pdf", sizeBytes: 4, storageKey: `idor/${suffix}/bid.pdf`, storageUrl: "https://example.test/bid.pdf" });
    fixture.bidDocumentA = Number(bidDocumentInsert[0].insertId);
  });

  it("rejects cross-authority tender mutation and bid visibility", async () => {
    const authorityB = callerFor(fixture.authorityB, "authority");
    await expect(authorityB.tenders.update({ id: fixture.tenderA, data: { title: "unauthorized mutation" } })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(authorityB.bids.forTender(fixture.tenderA)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects cross-supplier bid mutation and bid-document listing", async () => {
    const supplierB = callerFor(fixture.supplierB, "supplier");
    await expect(supplierB.bids.updateDraft({ bidId: fixture.bidA, amount: 700, proposal: "unauthorized mutation" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(supplierB.bids.documents.list(fixture.bidA)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(supplierB.bids.documents.upload({ bidId: fixture.bidA, document: { fileName: "x.pdf", mimeType: "application/pdf", dataBase64: "ZGF0YQ==" } })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects cross-owner document downloads", async () => {
    const supplierB = callerFor(fixture.supplierB, "supplier");
    const authorityB = callerFor(fixture.authorityB, "authority");
    await expect(supplierB.tenders.documents.download(fixture.tenderDocumentA)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(authorityB.bids.documents.download(fixture.bidDocumentA)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  afterAll(async () => {
    if (!db || !fixture) return;
    await db.delete(bidDocuments).where(eq(bidDocuments.id, fixture.bidDocumentA));
    await db.delete(tenderDocuments).where(eq(tenderDocuments.id, fixture.tenderDocumentA));
    await db.delete(bids).where(eq(bids.id, fixture.bidA));
    await db.delete(tenders).where(eq(tenders.id, fixture.tenderA));
    await db.delete(users).where(eq(users.id, fixture.authorityA));
    await db.delete(users).where(eq(users.id, fixture.authorityB));
    await db.delete(users).where(eq(users.id, fixture.supplierA));
    await db.delete(users).where(eq(users.id, fixture.supplierB));
  });
});
