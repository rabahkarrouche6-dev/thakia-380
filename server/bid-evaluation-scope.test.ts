import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dbSource = readFileSync(join(process.cwd(), "server/db.ts"), "utf8");
const routerSource = readFileSync(join(process.cwd(), "server/routers.ts"), "utf8");

describe("bid evaluation query scope", () => {
  it("provides a bid-and-tender scoped query", () => {
    expect(dbSource).toContain("export async function getBidForTender(bidId: number, tenderId: number)");
    expect(dbSource).toContain("eq(bids.id, bidId), eq(bids.tenderId, tenderId)");
  });

  it("does not load every tender bid to validate one evaluation target", () => {
    const evaluateStart = routerSource.indexOf("evaluate: roleProcedure");
    const bidOpeningStart = routerSource.indexOf("bidOpening: router({", evaluateStart);
    const evaluateBlock = routerSource.slice(evaluateStart, bidOpeningStart === -1 ? undefined : bidOpeningStart);
    expect(evaluateBlock).toContain("getBidForTender(input.bidId, input.tenderId)");
    expect(evaluateBlock).not.toContain("listBidsForTender(input.tenderId)");
  });
});
