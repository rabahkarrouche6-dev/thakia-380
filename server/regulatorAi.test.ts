import { describe, expect, it } from "vitest";
import { buildCollusionSignals, buildRegulatorAiResult, buildRfpObservations } from "./regulatorAi";
import type { Bid, Profile, Tender } from "../drizzle/schema";

const tender = (overrides: Partial<Tender> = {}) => ({
  id: 11,
  reference: "2026-001",
  title: "اقتناء تجهيزات معلوماتية",
  description: "تحتاج المصلحة إلى تجهيزات معلوماتية متوافقة مع المعايير التقنية المعتمدة.",
  category: "تجهيزات",
  location: "الجزائر",
  budget: 1000000,
  deadline: new Date("2026-12-01T10:00:00Z"),
  status: "published",
  authorityId: 3,
  publishedAt: new Date("2026-08-01T10:00:00Z"),
  closedAt: null,
  createdAt: new Date("2026-07-30T10:00:00Z"),
  updatedAt: new Date("2026-08-01T10:00:00Z"),
  ...overrides,
}) as Tender;

const bid = (id: number, overrides: Partial<Bid> = {}) => ({
  id,
  tenderId: 11,
  supplierId: id + 100,
  amount: 500000,
  proposal: "توريد وتركيب التجهيزات حسب المواصفات التقنية المطلوبة",
  status: "submitted",
  evaluationNote: null,
  submittedAt: new Date(`2026-09-01T10:0${id}:00Z`),
  openedAt: null,
  createdAt: new Date("2026-08-20T10:00:00Z"),
  evaluatedAt: null,
  ...overrides,
}) as Bid;

const profile = (userId: number, registrationNumber: string) => ({ userId, registrationNumber }) as Profile;

describe("regulator AI advisory engine", () => {
  it("does not produce collusion signals before an opening session", () => {
    const result = buildRegulatorAiResult(tender(), [bid(1), bid(2)], new Map(), false);
    expect(result.openingAvailable).toBe(false);
    expect(result.insights.some(insight => insight.kind === "collusion_signal")).toBe(false);
  });

  it("flags real repeated registration and identical amount evidence", () => {
    const result = buildRegulatorAiResult(tender(), [bid(1), bid(2)], new Map([[101, profile(101, "RC-77")], [102, profile(102, "RC-77")]]), true);
    const signal = result.insights.find(insight => insight.kind === "collusion_signal");
    expect(signal).toBeDefined();
    expect(signal?.evidence.map(item => item.code)).toEqual(expect.arrayContaining(["shared_registration_number", "identical_amount"]));
    expect(signal?.limitations.length).toBeGreaterThan(0);
  });

  it("flags restrictive wording as an observation, not a legal violation", () => {
    const observations = buildRfpObservations(tender({ title: "اقتناء Brand X حصريا", description: "خبرة لا تقل عن 10 سنوات فقط." }));
    expect(observations[0]?.kind).toBe("rfp_observation");
    expect(observations[0]?.limitations[0]).toContain("لا يثبت مخالفة قانونية");
  });

  it("does not flag a brand when an equivalent clause is present nearby", () => {
    const observations = buildRfpObservations(tender({ title: "اقتناء Brand X أو ما يعادلها", description: "وصف تقني مفصل يشرح الغرض والكمية وشروط التسليم والمسؤوليات المطلوبة من المتعامل الاقتصادي." }));
    expect(observations.some(observation => observation.evidence.some(evidence => evidence.code === "brand_without_equivalent"))).toBe(false);
  });
});
