import { describe, expect, it } from "vitest";
import { deterministicFindings } from "./authorityAi";
import type { Tender } from "../drizzle/schema";

function tender(overrides: Partial<Tender> = {}): Tender {
  return {
    id: 7,
    authorityId: 11,
    reference: "AO-2026-00007",
    title: "توريد تجهيزات معلوماتية",
    description: "توريد وتركيب وتجريب تجهيزات معلوماتية لفائدة المصلحة مع تحديد المخرجات والضمان ومكان التنفيذ.",
    category: "تجهيزات",
    budget: 1500000,
    currency: "DZD",
    location: "الجزائر",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: null,
    closedAt: null,
    ...overrides,
  };
}

describe("authority RFP advisory", () => {
  it("does not flag a complete neutral draft with restrictive findings", () => {
    expect(deterministicFindings(tender())).toEqual([]);
  });

  it("flags missing operational fields using real tender fields", () => {
    const findings = deterministicFindings(tender({ description: "توريد تجهيزات.", location: null, budget: null }));
    expect(findings.map(finding => finding.code)).toEqual(expect.arrayContaining(["short_description", "missing_location", "missing_budget"]));
  });

  it("flags exclusive or brand wording as review observations, not legal conclusions", () => {
    const findings = deterministicFindings(tender({ title: "توريد حصري لعلامة تجارية محددة", description: "توريد موديل Alpha فقط." }));
    expect(findings.map(finding => finding.code)).toEqual(expect.arrayContaining(["exclusive_wording", "brand_without_equivalent"]));
    expect(findings.every(finding => !finding.explanation.includes("مخالفة قانونية"))).toBe(true);
  });

  it("uses server-visible deadline data and reports an invalid draft deadline", () => {
    const findings = deterministicFindings(tender({ deadline: new Date(Date.now() - 60_000) }));
    expect(findings.some(finding => finding.code === "deadline_not_future" && finding.severity === "high")).toBe(true);
  });
});
