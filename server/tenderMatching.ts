import type { Profile, Tender } from "../drizzle/schema";

export const MATCHING_ALGORITHM_VERSION = "mvp-2026-08-15-v2";
export const HIGHLY_RELEVANT = 80;
export const RELEVANT = 65;
export const POTENTIAL_FIT = 50;

export type MatchLabel = "Highly Relevant" | "Relevant" | "Potential Fit" | "Low Fit" | "Not Eligible";
export type EligibilityStatus = "eligible" | "not_eligible";
export type RelevanceBand = "HIGHLY_RELEVANT" | "RELEVANT" | "POTENTIAL_FIT" | "LOW_FIT" | "NOT_ELIGIBLE";

export type ExplanationResult = {
  topReasons: string[];
  gaps: string[];
  recommendedAction: string;
  disclaimer: string;
  explanationVersion: string;
};

export type TenderMatch = {
  tenderId: number;
  reference: string;
  title: string;
  label: MatchLabel;
  relevanceBand: RelevanceBand;
  matchScore: number;
  eligibilityStatus: EligibilityStatus;
  topMatchReasons: string[];
  gapAnalysis: string[];
  recommendedAction: string;
  disclaimer: string;
  explanationVersion: string;
  algorithmVersion: string;
  factors: { name: string; score: number; available: boolean }[];
};

type Factor = { name: string; score: number; available: boolean; weight: number; reason: string };

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  أشغال: ["اشغال", "travaux", "construction", "bâtiment", "batiment"],
  خدمات: ["خدمات", "services", "service", "maintenance", "صيانة"],
  توريد: ["توريد", "fourniture", "fournitures", "supply", "equipment", "تجهيز"],
  دراسات: ["دراسات", "études", "etudes", "study", "consulting", "استشارة"],
};

export const MATCH_WEIGHTS = { category: 0.45, semantic: 0.35, geo: 0.1, readiness: 0.1 } as const;

const WEIGHT_TOTAL = Object.values(MATCH_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
if (Math.abs(WEIGHT_TOTAL - 1) > Number.EPSILON) throw new Error("Matching weights must sum to 1");

const DISCLAIMER = "هذه المطابقة أداة مساعدة مبنية على البيانات المتوفرة في ملفك، ولا تغني عن قراءة دفتر الشروط والتحقق من الشروط الرسمية.";

function normalize(value: string | null | undefined) {
  return (value || "")
    .toLocaleLowerCase("ar-DZ")
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[^\u0600-\u06FFA-Za-z0-9]+/g, " ")
    .trim();
}

function tokens(value: string) {
  return new Set(normalize(value).split(/\s+/).filter(token => token.length > 2));
}

function overlap(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) return 0;
  let count = 0;
  left.forEach(token => { if (right.has(token)) count += 1; });
  return count / Math.max(1, Math.min(left.size, right.size));
}

function categoryMatch(profile: Profile | undefined, tender: Tender) {
  if (!profile?.organizationName) return { score: 0.5, available: false, reason: "لا تتوفر فئة نشاط منظمة في الملف الحالي" };
  const supplierText = normalize(profile.organizationName);
  const tenderCategory = normalize(tender.category);
  const exact = supplierText.includes(tenderCategory) || tenderCategory.includes(supplierText);
  const synonym = Object.values(CATEGORY_SYNONYMS).some(words => words.some(word => tenderCategory.includes(normalize(word)) && words.some(candidate => supplierText.includes(normalize(candidate)))));
  return { score: exact || synonym ? 1 : 0.35, available: true, reason: exact || synonym ? "يوجد تقاطع نصي مع فئة الصفقة" : "لا يظهر تقاطع مباشر مع فئة الصفقة ضمن البيانات المتاحة" };
}

function semanticMatch(profile: Profile | undefined, tender: Tender) {
  const supplier = tokens(profile?.organizationName || "");
  const tenderText = tokens(`${tender.title} ${tender.description} ${tender.category}`);
  const score = overlap(supplier, tenderText);
  return { score: supplier.size ? score : 0.5, available: supplier.size > 0, reason: score >= 0.5 ? "توجد كلمات مشتركة مع موضوع الصفقة" : "التطابق النصي محدود بسبب البيانات المتاحة في الملف" };
}

function geoMatch(profile: Profile | undefined, tender: Tender) {
  if (!profile?.address || !tender.location) return { score: 0.5, available: false, reason: "لا تتوفر بيانات موقع كافية للمقارنة" };
  const score = overlap(tokens(profile.address), tokens(tender.location));
  return { score, available: true, reason: score > 0 ? "يوجد توافق جزئي مع الموقع المعلن" : "لا يظهر توافق نصي مع الموقع المعلن" };
}

function readinessMatch(profile: Profile | undefined) {
  const completion = profile?.completion ?? 0;
  return { score: Math.max(0, Math.min(1, completion / 100)), available: Boolean(profile), reason: completion >= 75 ? "الملف المؤسسي مكتمل بدرجة جيدة" : "أكمل الملف المؤسسي لتحسين دقة المطابقة" };
}

function getEligibility(tender: Tender, now: Date) {
  if (tender.status !== "published") return { eligible: false, gap: "الصفقة ليست منشورة حالياً" };
  if (tender.deadline.getTime() <= now.getTime()) return { eligible: false, gap: "انتهى أجل استقبال العروض" };
  return { eligible: true, gap: undefined };
}

export function buildExplanation(context: { eligible: boolean; factors: Factor[]; eligibilityGap?: string }): ExplanationResult {
  if (!context.eligible) {
    return {
      topReasons: [],
      gaps: context.eligibilityGap ? [context.eligibilityGap] : ["لا تتوفر أهلية تشغيلية للمطابقة"],
      recommendedAction: "لا يمكن بدء عرض جديد لهذه الصفقة.",
      disclaimer: DISCLAIMER,
      explanationVersion: MATCHING_ALGORITHM_VERSION,
    };
  }
  const topReasons = context.factors.filter(factor => factor.available && factor.score >= 0.5).map(factor => factor.reason).slice(0, 3);
  const gaps = context.factors.filter(factor => !factor.available || factor.score < 0.5).map(factor => factor.reason).slice(0, 3);
  return {
    topReasons: topReasons.length ? topReasons : ["المطابقة إرشادية ومبنية على البيانات المتاحة فقط"],
    gaps,
    recommendedAction: gaps.length ? "راجع تفاصيل الصفقة وأكمل بيانات مؤسستك قبل اتخاذ قرار التقديم." : "راجع الشروط والوثائق المنشورة ثم جهّز العرض قبل الموعد.",
    disclaimer: DISCLAIMER,
    explanationVersion: MATCHING_ALGORITHM_VERSION,
  };
}

function relevance(score: number, eligible: boolean): { label: MatchLabel; band: RelevanceBand } {
  if (!eligible) return { label: "Not Eligible", band: "NOT_ELIGIBLE" };
  if (score >= HIGHLY_RELEVANT) return { label: "Highly Relevant", band: "HIGHLY_RELEVANT" };
  if (score >= RELEVANT) return { label: "Relevant", band: "RELEVANT" };
  if (score >= POTENTIAL_FIT) return { label: "Potential Fit", band: "POTENTIAL_FIT" };
  return { label: "Low Fit", band: "LOW_FIT" };
}

export function rankTendersForSupplier(profile: Profile | undefined, tenders: Tender[], now = new Date()): TenderMatch[] {
  return tenders.map((tender): TenderMatch => {
    const eligibility = getEligibility(tender, now);
    if (!eligibility.eligible) {
      const explanation = buildExplanation({ eligible: false, factors: [], eligibilityGap: eligibility.gap });
      return { tenderId: tender.id, reference: tender.reference, title: tender.title, label: "Not Eligible", relevanceBand: "NOT_ELIGIBLE", matchScore: 0, eligibilityStatus: "not_eligible", topMatchReasons: explanation.topReasons, gapAnalysis: explanation.gaps, recommendedAction: explanation.recommendedAction, disclaimer: explanation.disclaimer, explanationVersion: explanation.explanationVersion, algorithmVersion: MATCHING_ALGORITHM_VERSION, factors: [] };
    }

    const factors: Factor[] = [
      { name: "category", ...categoryMatch(profile, tender), weight: MATCH_WEIGHTS.category },
      { name: "semantic", ...semanticMatch(profile, tender), weight: MATCH_WEIGHTS.semantic },
      { name: "geo", ...geoMatch(profile, tender), weight: MATCH_WEIGHTS.geo },
      { name: "readiness", ...readinessMatch(profile), weight: MATCH_WEIGHTS.readiness },
    ];
    const availableWeight = factors.filter(factor => factor.available).reduce((sum, factor) => sum + factor.weight, 0);
    const weighted = factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0);
    const score = Math.min(100, Math.max(0, Math.round((weighted / Math.max(MATCH_WEIGHTS.category, availableWeight)) * 100)));
    const result = relevance(score, true);
    const explanation = buildExplanation({ eligible: true, factors });
    return { tenderId: tender.id, reference: tender.reference, title: tender.title, label: result.label, relevanceBand: result.band, matchScore: score, eligibilityStatus: "eligible", topMatchReasons: explanation.topReasons, gapAnalysis: explanation.gaps, recommendedAction: explanation.recommendedAction, disclaimer: explanation.disclaimer, explanationVersion: explanation.explanationVersion, algorithmVersion: MATCHING_ALGORITHM_VERSION, factors: factors.map(({ name, score: factorScore, available }) => ({ name, score: Math.round(factorScore * 100), available })) };
  }).filter(match => match.eligibilityStatus === "eligible").sort((left, right) => right.matchScore - left.matchScore || left.tenderId - right.tenderId);
}
