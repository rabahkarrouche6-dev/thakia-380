import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("core procurement flow contracts", () => {
  const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
  const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
  const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
  const authorityPage = readFileSync(resolve(process.cwd(), "client/src/pages/AuthorityTenderCreate.tsx"), "utf8");
  const supplierPage = readFileSync(resolve(process.cwd(), "client/src/pages/SupplierWorkspace.tsx"), "utf8");

  it("declares real tender, bid, and document persistence contracts", () => {
    expect(schema).toContain('"draft"');
    expect(schema).toContain("tenderDocuments");
    expect(schema).toContain("bidDocuments");
    expect(schema).toContain("storageKey");
    expect(dbSource).toContain("createTenderDocument");
    expect(dbSource).toContain("createBidDocument");
    expect(dbSource).toContain("listTenderDocuments");
    expect(dbSource).toContain("listBidDocuments");
  });

  it("exposes protected lifecycle, document, and server-time contracts", () => {
    expect(router).toContain("documents: router({");
    expect(router).toContain("createDraft: roleProcedure");
    expect(router).toContain("updateDraft: roleProcedure");
    expect(router).toContain("upload: roleProcedure([\"supplier\", \"admin\"])");
    expect(router).toContain("storagePut");
    expect(router).toContain("storageGetSignedUrl");
    expect(router).toContain("Date.now()");
    expect(router).toContain("رفع وثيقة صفقة");
    expect(router).toContain("رفع وثيقة عرض");
    expect(router).toContain("إرسال عرض نهائي");
  });

  it("declares bid opening persistence, server-time enforcement, and audit contracts", () => {
    expect(schema).toContain("bidOpeningSessions");
    expect(schema).toContain("openedAt");
    expect(dbSource).toContain("openTenderBids");
    expect(dbSource).toContain("getBidOpeningSession");
    expect(dbSource).toContain("alreadyOpened");
    expect(router).toContain("bidOpening: router({");
    expect(router).toContain("bid_opening_attempted");
    expect(router).toContain("bid_opening_denied");
    expect(router).toContain("bid_opened");
    expect(router).toContain("opening_minutes_generated");
    expect(router).toContain("PRECONDITION_FAILED");
    expect(router).toContain("serverNow.getTime() < tender.deadline.getTime()");
    expect(router).toContain('ctx.user.role === "authority" && tender.authorityId === ctx.user.id');
    const bidOpeningSource = router.slice(router.indexOf("bidOpening: router({"), router.indexOf("awards: router({"));
    expect(bidOpeningSource).toContain("activeIds.has(ctx.user.id)");
    expect(bidOpeningSource).toContain("selectedIds.length < quorum");
  });

  it("connects both portals to draft, upload, download, and final-submit states", () => {
    expect(authorityPage).toContain("type=\"file\"");
    expect(authorityPage).toContain("uploadPendingDocuments");
    expect(authorityPage).toContain("تأكيد والنشر");
    expect(supplierPage).toContain("trpc.bids.createDraft.useMutation");
    expect(supplierPage).toContain("حفظ كمسودة");
    expect(supplierPage).toContain("إرسال العرض نهائياً");
    expect(supplierPage).toContain("trpc.tenders.documents.download.useQuery");
    expect(supplierPage).toContain("trpc.bids.documents.upload.useMutation");
  });

  it("renders explicit bid opening states without using client time as enforcement", () => {
    const authorityShell = readFileSync(resolve(process.cwd(), "client/src/pages/AuthorityShell.tsx"), "utf8");
    expect(authorityShell).toContain('opening.data.status === "before_opening"');
    expect(authorityShell).toContain('opening.data.status === "no_submitted_bids"');
    expect(authorityShell).toContain('opening.data.status === "opening_available"');
    expect(authorityShell).toContain("محضر الفتح");
    expect(authorityShell).toContain("opening.data.serverNow");
    expect(authorityShell).not.toContain("Date.now()");
  });
});
