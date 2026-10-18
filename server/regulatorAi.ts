import type { Bid, Profile, Tender } from "../drizzle/schema";

export type AdvisorySeverity = "low" | "medium" | "high";
export type AdvisoryConfidence = "low" | "medium" | "high";
export type AdvisoryKind = "collusion_signal" | "rfp_observation" | "tender_risk";

export type AdvisoryEvidence = {
  code: string;
  label: string;
  value: string;
  source: "bids" | "profiles" | "tenders";
};

export type RegulatorInsight = {
  kind: AdvisoryKind;
  tenderId: number;
  severity: AdvisorySeverity;
  confidence: AdvisoryConfidence;
  title: string;
  summary: string;
  evidence: AdvisoryEvidence[];
  limitations: string[];
  recommendedAction: string;
};

export type RegulatorAiResult = {
  tenderId: number;
  tenderReference: string;
  tenderTitle: string;
  generatedAt: Date;
  openingAvailable: boolean;
  insights: RegulatorInsight[];
  disclaimer: string;
};

const DISCLAIMER = "مؤشر استشاري للمراجعة البشرية فقط؛ لا يمثل حكماً قانونياً أو إثباتاً للتواطؤ ولا ينفذ أي قرار تعاقدي.";
const LIMITATIONS = [
  "النتيجة مبنية على الحقول المسجلة في المنصة فقط.",
  "لا تتوفر في النموذج الحالي عناوين IP أو بصمات أجهزة أو metadata رقمية موثقة للوثائق.",
  "لا يجوز اتخاذ إجراء إقصاء أو إلغاء أو إسناد اعتماداً على هذه الإشارة وحدها.",
];

function normalizedTokens(value: string) {
  return new Set(value.toLowerCase().replace(/[\u064B-\u065F]/g, "").replace(/[^A-Za-z0-9\u0600-\u06FF]+/g, " ").trim().split(/\s+/).filter(token => token.length > 2));
}

function jaccard(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  left.forEach(token => { if (right.has(token)) intersection += 1; });
  return intersection / (left.size + right.size - intersection);
}

function severityFor(count: number): AdvisorySeverity {
  return count >= 3 ? "high" : count === 2 ? "medium" : "low";
}

function confidenceFor(evidenceCount: number, bidCount: number): AdvisoryConfidence {
  return evidenceCount >= 3 && bidCount >= 2 ? "high" : evidenceCount >= 2 ? "medium" : "low";
}

function pairLabel(a: Bid, b: Bid) {
  return `العرضان #${a.id} و#${b.id}`;
}

export function buildCollusionSignals(tender: Tender, submittedBids: Bid[], profilesByUserId: Map<number, Profile | undefined>): RegulatorInsight[] {
  if (submittedBids.length < 2) return [];
  const evidence: AdvisoryEvidence[] = [];
  const registrationGroups = new Map<string, Bid[]>();
  for (const bid of submittedBids) {
    const registrationNumber = profilesByUserId.get(bid.supplierId)?.registrationNumber?.trim();
    if (registrationNumber) registrationGroups.set(registrationNumber, [...(registrationGroups.get(registrationNumber) ?? []), bid]);
  }
  registrationGroups.forEach((groupBids, registrationNumber) => {
    if (groupBids.length > 1) evidence.push({ code: "shared_registration_number", label: "رقم تسجيل مكرر بين عروض متعددة", value: `${groupBids.map((bid: Bid) => `#${bid.id}`).join("، ")} · ${registrationNumber.slice(0, 3)}…`, source: "profiles" });
  });
  for (let index = 0; index < submittedBids.length; index += 1) {
    for (let next = index + 1; next < submittedBids.length; next += 1) {
      const left = submittedBids[index];
      const right = submittedBids[next];
      if (left.amount === right.amount && left.amount > 0) evidence.push({ code: "identical_amount", label: "تطابق مبلغ العرض", value: `${pairLabel(left, right)} · ${left.amount.toLocaleString("fr-FR")} دج`, source: "bids" });
      if (left.submittedAt && right.submittedAt && Math.abs(left.submittedAt.getTime() - right.submittedAt.getTime()) <= 60_000) evidence.push({ code: "close_submission_time", label: "تقارب زمني شديد في الإرسال", value: `${pairLabel(left, right)} · خلال دقيقة واحدة`, source: "bids" });
      const similarity = jaccard(normalizedTokens(left.proposal), normalizedTokens(right.proposal));
      if (similarity >= 0.8) evidence.push({ code: "similar_proposal_terms", label: "تقارب لغوي مرتفع بين ملخصي العرضين", value: `${pairLabel(left, right)} · تشابه تقريبي ${Math.round(similarity * 100)}%`, source: "bids" });
    }
  }
  if (!evidence.length) return [];
  return [{
    kind: "collusion_signal",
    tenderId: tender.id,
    severity: severityFor(evidence.length),
    confidence: confidenceFor(evidence.length, submittedBids.length),
    title: "إشارة تستحق مراجعة النزاهة",
    summary: `رُصدت ${evidence.length} قرينة قابلة للمقارنة بين العروض المفتوحة في هذه الصفقة.`,
    evidence,
    limitations: LIMITATIONS,
    recommendedAction: "مراجعة القرائن مع السجل الأصلي والوثائق المسموح بها، ثم توثيق نتيجة المراجعة البشرية دون اعتبار المؤشر حكماً نهائياً.",
  }];
}

export function buildRfpObservations(tender: Tender): RegulatorInsight[] {
  const text = `${tender.title} ${tender.description}`;
  const evidence: AdvisoryEvidence[] = [];
  const rules: Array<{ code: string; label: string; pattern: RegExp; value: string }> = [
    { code: "brand_without_equivalent", label: "ذكر علامة أو منتج بصياغة قد تقيد التكافؤ", pattern: /\b(brand|ماركة|علامة تجارية|موديل|model)\b(?![^.،؛]{0,80}(أو ما يعادلها|or equivalent))/i, value: "تظهر إشارة إلى علامة/موديل دون عبارة تكافؤ واضحة في النص القريب." },
    { code: "exclusive_wording", label: "صياغة حصرية مطلقة", pattern: /(حصريا|حصرياً|حصري|exclusively|only|فقط)/i, value: "توجد صياغة حصرية تحتاج إلى مراجعة مبررها الفني والتنظيمي." },
    { code: "narrow_experience", label: "اشتراط خبرة بصياغة شديدة التحديد", pattern: /(خبرة\s+(لا تقل عن|أكثر من)\s*\d+|experience\s+(of|over)\s*\d+)/i, value: "يوجد شرط مدة خبرة رقمي يستحق فحص تناسبه مع موضوع الصفقة." },
  ];
  for (const rule of rules) if (rule.pattern.test(text)) evidence.push({ code: rule.code, label: rule.label, value: rule.value, source: "tenders" });
  if (tender.description.trim().length < 80) evidence.push({ code: "short_description", label: "وصف مختصر يحتاج إلى استكمال", value: "الوصف المسجل أقصر من الحد الاستكشافي البالغ 80 حرفاً.", source: "tenders" });
  if (!evidence.length) return [];
  return [{
    kind: "rfp_observation",
    tenderId: tender.id,
    severity: severityFor(evidence.length),
    confidence: "low",
    title: "ملاحظات استكشافية على كراسة الشروط",
    summary: `تحتاج ${evidence.length} ملاحظة إلى مراجعة بشرية للتأكد من التناسب وعدم تقييد المنافسة.`,
    evidence,
    limitations: ["الفحص لغوي استكشافي ولا يثبت مخالفة قانونية.", ...LIMITATIONS],
    recommendedAction: "مراجعة المبرر الفني وصياغة الشرط مع الجهة المختصة، وإثبات سبب الإبقاء عليه أو تعديله.",
  }];
}

export function buildTenderDataNote(tender: Tender, submittedBids: Bid[]): RegulatorInsight[] {
  const evidence: AdvisoryEvidence[] = [];
  if (!tender.budget) evidence.push({ code: "missing_budget", label: "الميزانية غير محددة", value: "لا توجد قيمة ميزانية مسجلة للصفقة.", source: "tenders" });
  if (submittedBids.length < 2) evidence.push({ code: "limited_competition_signal", label: "عدد عروض مفتوحة محدود", value: `عدد العروض المفتوحة: ${submittedBids.length}`, source: "bids" });
  if (!evidence.length) return [];
  return [{
    kind: "tender_risk",
    tenderId: tender.id,
    severity: "low",
    confidence: "low",
    title: "بيانات تحتاج إلى استكمال أو متابعة",
    summary: "توجد قيود في البيانات المتاحة تمنع تكوين قراءة رقابية مكتملة.",
    evidence,
    limitations: ["هذه ملاحظة جودة بيانات وليست توقعاً للتعثر أو حكماً على المنافسة.", ...LIMITATIONS],
    recommendedAction: "استكمال البيانات المؤسسية المسموح بها ومراجعة تفسير المؤشر ضمن سياق الصفقة الكامل.",
  }];
}

export function buildRegulatorAiResult(tender: Tender, bids: Bid[], profilesByUserId: Map<number, Profile | undefined>, openingAvailable: boolean, generatedAt = new Date()): RegulatorAiResult {
  const submittedBids = bids.filter(bid => bid.status !== "draft" && Boolean(bid.submittedAt));
  const insights = [
    ...buildRfpObservations(tender),
    ...(openingAvailable ? buildCollusionSignals(tender, submittedBids, profilesByUserId) : []),
    ...(openingAvailable ? buildTenderDataNote(tender, submittedBids) : []),
  ];
  return { tenderId: tender.id, tenderReference: tender.reference, tenderTitle: tender.title, generatedAt, openingAvailable, insights, disclaimer: DISCLAIMER };
}
