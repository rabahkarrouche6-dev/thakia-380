import { describe, expect, it } from "vitest";
import { rankTendersForSupplier } from "./tenderMatching";

const tender = (overrides: Partial<Parameters<typeof rankTendersForSupplier>[1][number]> = {}) => ({
  id: 7,
  reference: "2026-001",
  title: "اقتناء تجهيزات معلوماتية",
  description: "تجهيز وصيانة أنظمة معلوماتية",
  category: "تجهيزات معلوماتية",
  location: "الجزائر",
  budget: 100000,
  deadline: new Date(Date.now() + 86400000),
  status: "published",
  ...overrides,
});

describe("tender matching MVP", () => {
  it("ranks matching published tenders using real profile and tender fields", () => {
    const [match] = rankTendersForSupplier({ category: "تجهيزات معلوماتية", location: "الجزائر", completion: 100 }, [tender()]);
    expect(match.eligibilityStatus).toBe("eligible");
    expect(match.matchScore).toBeGreaterThan(0);
    expect(match.topMatchReasons.length).toBeGreaterThan(0);
    expect(match.recommendedAction).toContain("راجع تفاصيل");
  });

  it("never recommends a closed or expired tender as eligible", () => {
    const matches = rankTendersForSupplier(undefined, [tender({ status: "closed" })]);
    expect(matches).toEqual([]);
  });

  it("does not treat missing profile data as disqualification", () => {
    const [match] = rankTendersForSupplier({}, [tender()]);
    expect(match.eligibilityStatus).toBe("eligible");
    expect(match.gapAnalysis.length).toBeGreaterThan(0);
    expect(match.topMatchReasons).not.toContain("بيانات غير متوفرة");
  });

  it("does not expose sensitive fields or add eligibility claims to the contract", () => {
    const [match] = rankTendersForSupplier({ category: "خدمات" }, [tender()]);
    expect(JSON.stringify(match)).not.toMatch(/password|token|document|secret/i);
    expect(match.recommendedAction).not.toContain("مؤهل");
  });
});
