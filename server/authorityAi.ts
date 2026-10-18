import type { Tender } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";

export type AuthorityRfpSeverity = "info" | "warning" | "high";
export type AuthorityRfpSource = "deterministic" | "llm";

export type AuthorityRfpFinding = {
  code: string;
  severity: AuthorityRfpSeverity;
  title: string;
  explanation: string;
  evidence: string;
  recommendation: string;
  source: AuthorityRfpSource;
};

export type AuthorityRfpAudit = {
  tenderId: number;
  tenderReference: string;
  tenderTitle: string;
  generatedAt: Date;
  findings: AuthorityRfpFinding[];
  disclaimer: string;
  llmUsed: boolean;
  limitations: string[];
};

const DISCLAIMER = "هذه مراجعة استشارية أولية وليست اعتماداً قانونياً أو تقنياً، ولا تعدّل الصفقة ولا تنشرها. يبقى القرار للمصلحة المتعاقدة والجهات المختصة.";
const LIMITATIONS = [
  "الفحص مبني على الحقول المسجلة في نموذج الصفقة الحالي فقط.",
  "لا يتضمن هذا الإصدار تدقيقاً قانونياً بمراجع مواد أو نماذج وزارية معتمدة.",
  "لا توجد في النموذج الحالي حقول مستقلة لمعايير التنقيط أو جدول الكميات أو قائمة الوثائق الإلزامية.",
];

function deterministicFindings(tender: Tender): AuthorityRfpFinding[] {
  const findings: AuthorityRfpFinding[] = [];
  const title = tender.title.trim();
  const description = tender.description.trim();
  const text = `${title} ${description}`;

  if (title.length < 12) findings.push({ code: "short_title", severity: "warning", title: "عنوان مختصر يحتاج إلى مزيد من التحديد", explanation: "العنوان الحالي لا يوضح بما يكفي موضوع التوريد أو الخدمة أو الأشغال المقصودة.", evidence: `طول العنوان المسجل: ${title.length} حرفاً.`, recommendation: "أضف نوع العملية وموضوعها الرئيسي ونطاقها المختصر دون تضمين شرط موجه لمتعامل بعينه.", source: "deterministic" });
  if (description.length < 80) findings.push({ code: "short_description", severity: "warning", title: "وصف الصفقة مختصر", explanation: "الوصف الحالي قد لا يكون كافياً لفهم النطاق والمخرجات المتوقعة قبل استكمال دفتر الشروط.", evidence: `طول الوصف المسجل: ${description.length} حرفاً.`, recommendation: "استكمل النطاق، المخرجات، مكان التنفيذ، والافتراضات الأساسية في الوثائق الرسمية المتاحة للجهة.", source: "deterministic" });
  if (!tender.location?.trim()) findings.push({ code: "missing_location", severity: "info", title: "موقع التنفيذ غير محدد", explanation: "لا يوجد موقع تنفيذ مسجل في بيانات الصفقة الحالية.", evidence: "حقل الموقع فارغ.", recommendation: "حدد الموقع أو اذكر صراحة أن التنفيذ غير مرتبط بموقع محدد إذا كان ذلك صحيحاً.", source: "deterministic" });
  if (tender.budget == null) findings.push({ code: "missing_budget", severity: "warning", title: "الميزانية التقديرية غير مسجلة", explanation: "غياب الميزانية يمنع المراجعة الأولية للاتساق المالي داخل المنصة.", evidence: "لا توجد قيمة في حقل الميزانية.", recommendation: "استكمل القيمة وفق الإجراء الداخلي المعتمد، مع عدم اعتبار هذا الفحص بديلاً عن تقدير الأسعار الرسمي.", source: "deterministic" });
  if (tender.deadline.getTime() <= Date.now()) findings.push({ code: "deadline_not_future", severity: "high", title: "الموعد النهائي ليس في المستقبل", explanation: "الموعد المسجل لا يحقق شرط الإجراء التشغيلي الحالي للنشر.", evidence: `الموعد المسجل: ${tender.deadline.toISOString()}.`, recommendation: "صحح الموعد من مسار الصفقة قبل محاولة النشر. يعتمد الخادم على وقته للتحقق النهائي.", source: "deterministic" });

  const restrictivePatterns: Array<{ code: string; pattern: RegExp; title: string; explanation: string; recommendation: string }> = [
    { code: "exclusive_wording", pattern: /(حصريا|حصرياً|حصري|فقط|exclusively|only)/i, title: "صياغة حصرية تستحق المراجعة", explanation: "تتضمن الصياغة كلمة قد تفهم على أنها حصر غير مبرر للمنافسة.", recommendation: "راجع المبرر الفني والتنظيمي وأعد صياغة الشرط بما يسمح بالتكافؤ عندما يكون ذلك ممكناً.", },
    { code: "brand_without_equivalent", pattern: /(ماركة|علامة تجارية|موديل|brand|model)/i, title: "ذكر علامة أو موديل دون قرينة تكافؤ واضحة", explanation: "ظهر ذكر علامة أو موديل في نص الصفقة، ولا يثبت الفحص الحالي وجود عبارة تكافؤ قريبة.", recommendation: "أضف المواصفات الوظيفية وعبارة التكافؤ المناسبة بعد مراجعة الجهة المختصة، إن كان ذلك منطبقاً.", },
  ];
  for (const rule of restrictivePatterns) {
    if (rule.pattern.test(text) && !/(أو ما يعادلها|أو ما يعادله|or equivalent)/i.test(text)) {
      findings.push({ code: rule.code, severity: "warning", title: rule.title, explanation: rule.explanation, evidence: "مطابقة لغوية في العنوان أو الوصف الحالي.", recommendation: rule.recommendation, source: "deterministic" });
    }
  }
  return findings;
}

function parseLlmFindings(content: unknown): AuthorityRfpFinding[] {
  if (typeof content !== "string") return [];
  try {
    const parsed = JSON.parse(content) as { findings?: Array<Record<string, unknown>> };
    if (!Array.isArray(parsed.findings)) return [];
    return parsed.findings.slice(0, 6).flatMap(item => {
      const code = typeof item.code === "string" ? item.code : "llm_observation";
      const severity = item.severity === "high" || item.severity === "warning" ? item.severity : "info";
      const strings = ["title", "explanation", "evidence", "recommendation"] as const;
      if (!strings.every(key => typeof item[key] === "string" && String(item[key]).trim())) return [];
      return [{ code, severity, title: String(item.title), explanation: String(item.explanation), evidence: String(item.evidence), recommendation: String(item.recommendation), source: "llm" as const }];
    });
  } catch {
    return [];
  }
}

export async function buildAuthorityRfpAudit(tender: Tender): Promise<AuthorityRfpAudit> {
  const findings = deterministicFindings(tender);
  let llmFindings: AuthorityRfpFinding[] = [];
  let llmUsed = false;
  if (process.env.ENABLE_ADVISORY_LLM !== "true") {
    return { tenderId: tender.id, tenderReference: tender.reference, tenderTitle: tender.title, generatedAt: new Date(), findings, disclaimer: DISCLAIMER, llmUsed: false, limitations: [...LIMITATIONS, "التحليل اللغوي الخارجي معطل افتراضياً؛ لا تُرسل بيانات الصفقة إلى خدمة خارجية إلا بعد تفعيل ENABLE_ADVISORY_LLM صراحةً."] };
  }
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "أنت مراجع استشاري لبيانات دفتر شروط في منصة صفقات عمومية جزائرية. حلل الحقول المقدمة فقط. لا تستشهد بمواد قانونية، لا تقل إن هناك مخالفة، ولا تقترح قراراً نهائياً. أعد JSON فقط." },
        { role: "user", content: JSON.stringify({ title: tender.title, description: tender.description, category: tender.category, location: tender.location ?? null, budget: tender.budget ?? null, deadline: tender.deadline.toISOString() }) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "authority_rfp_advisory",
          strict: true,
          schema: {
            type: "object",
            properties: {
              findings: { type: "array", maxItems: 6, items: { type: "object", properties: { code: { type: "string" }, severity: { type: "string", enum: ["info", "warning", "high"] }, title: { type: "string" }, explanation: { type: "string" }, evidence: { type: "string" }, recommendation: { type: "string" } }, required: ["code", "severity", "title", "explanation", "evidence", "recommendation"], additionalProperties: false } },
            },
            required: ["findings"],
            additionalProperties: false,
          },
        },
      },
    });
    llmFindings = parseLlmFindings(response.choices?.[0]?.message?.content);
    llmUsed = llmFindings.length > 0;
  } catch {
    llmFindings = [];
  }
  const unique = new Map<string, AuthorityRfpFinding>();
  for (const finding of [...findings, ...llmFindings]) unique.set(`${finding.code}:${finding.title}`, finding);
  return { tenderId: tender.id, tenderReference: tender.reference, tenderTitle: tender.title, generatedAt: new Date(), findings: Array.from(unique.values()), disclaimer: DISCLAIMER, llmUsed, limitations: LIMITATIONS };
}

export { DISCLAIMER as AUTHORITY_RFP_DISCLAIMER, LIMITATIONS as AUTHORITY_RFP_LIMITATIONS, deterministicFindings };
