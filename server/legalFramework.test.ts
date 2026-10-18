import { describe, expect, it } from "vitest";
import { createLegalSummaryPdf, selectLegalReferences, validateLegalReferenceIds } from "./legalFramework";

describe("legal framework advisory contracts", () => {
  it("accepts only known reference identifiers", () => {
    expect(validateLegalReferenceIds(["procurement", "data"])).toBe(true);
    expect(validateLegalReferenceIds([])).toBe(false);
    expect(validateLegalReferenceIds(["unknown-law"])).toBe(false);
  });

  it("selects a bounded subset for a custom summary", () => {
    expect(selectLegalReferences(["signature", "commerce"]).map(item => item.id)).toEqual(["commerce", "signature"]);
  });

  it("generates a real PDF buffer for selected references", async () => {
    const pdf = await createLegalSummaryPdf(["procurement"]);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(500);
  });
});
