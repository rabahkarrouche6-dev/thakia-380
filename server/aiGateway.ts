import { createHash } from "node:crypto";
import { invokeLLM } from "./_core/llm";
import type { User } from "../drizzle/schema";

export const AI_GATEWAY_VERSION = "phase-0.1";
export const AI_ADVISORY_LIMITATIONS = [
  "المخرجات إرشادية ولا تمثل قراراً تعاقدياً أو اعتماداً قانونياً.",
  "لا يجوز نشر أو اعتماد أي نص مولد دون مراجعة بشرية من المستخدم المخول.",
  "لا تتخذ البوابة قرارات أهلية أو ترتيباً أو إسناداً تلقائياً.",
] as const;

const MAX_FIELD_VALUE = 4_000;
const MAX_FIELDS = 80;
const BLOCKED_INSTRUCTIONS = /(ignore\s+(all|previous)|تجاهل\s+(كل|التعليمات)|system\s+prompt|مفتاح|token|password|secret)/i;

type GatewayRequest = {
  featureCode: "document_preparation_assistance" | "ai_rfp_generation";
  task: string;
  fields: Record<string, unknown>;
  entityType: "smart_tender_document" | "tender";
  entityId?: number;
};

export type GatewayResult = {
  content: string;
  modelUsed: boolean;
  advisoryOnly: true;
  policy: { allowed: true; version: string; checks: string[] };
  limitations: readonly string[];
  inputDigest: string;
  outputDigest: string;
};

function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, MAX_FIELD_VALUE) : String(value ?? "").slice(0, MAX_FIELD_VALUE);
}

export function enforceAiPolicy(user: Pick<User, "role">, request: GatewayRequest) {
  const checks = ["authenticated", "role_scoped", "advisory_only", "bounded_input", "no_automatic_decision"];
  if (!["supplier", "authority", "admin", "regulator"].includes(user.role)) throw new Error("الدور غير مخول لاستخدام بوابة الذكاء الاصطناعي");
  if (request.task.trim().length < 2 || request.task.length > 2_000) throw new Error("وصف المهمة غير صالح");
  if (BLOCKED_INSTRUCTIONS.test(request.task)) throw new Error("تعذر قبول تعليمات تتجاوز سياسة البوابة");
  if (!request.fields || typeof request.fields !== "object" || Array.isArray(request.fields)) throw new Error("بيانات دفتر الشروط غير صالحة");
  return { allowed: true as const, version: AI_GATEWAY_VERSION, checks };
}

function normalizeFields(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).slice(0, MAX_FIELDS).flatMap(([key, value]) => {
    const safeKey = clean(key).slice(0, 120);
    const safeValue = clean(typeof value === "string" ? value : JSON.stringify(value));
    return safeKey && safeValue ? [[safeKey, safeValue]] : [];
  }));
}

function extractText(content: unknown) {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content.filter((item): item is { type: "text"; text: string } => Boolean(item && typeof item === "object" && (item as { type?: unknown }).type === "text" && typeof (item as { text?: unknown }).text === "string")).map(item => item.text).join("\n").trim();
}

export async function runAiGateway(user: Pick<User, "role">, request: GatewayRequest): Promise<GatewayResult> {
  const policy = enforceAiPolicy(user, request);
  const fields = normalizeFields(request.fields);
  const inputDigest = digest({ featureCode: request.featureCode, task: request.task, fields });
  let content = "";
  let modelUsed = false;
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "أنت بوابة مساعدة استشارية لمنصة صفقات ذكية في الجزائر. ساعد المستخدم في تنظيم أو استكمال حقول دفتر الشروط من المعطيات المقدمة فقط. لا تخترع بيانات أو مراجع، ولا تتخذ قراراً قانونياً أو تعاقدياً، ولا تنشر أو تعتمد أي وثيقة. أعد اقتراحات واضحة قابلة للمراجعة البشرية، واذكر الحقول التي لا تملك معطيات لها." },
        { role: "user", content: `المهمة: ${request.task}\n\nالحقول الحالية:\n${JSON.stringify(fields, null, 2)}\n\nأعد إرشادات أو قيمة مقترحة للحقول الناقصة فقط، مع تنبيه المستخدم إلى ضرورة المراجعة.` },
      ],
      max_tokens: 1_100,
    });
    content = extractText(response.choices?.[0]?.message?.content);
    modelUsed = Boolean(content);
  } catch {
    content = "تعذر الوصول إلى النموذج حالياً. راجع الحقول يدوياً واستكملها من وثائق الصفقة الرسمية.";
  }
  if (!content) content = "لم تُنتج البوابة اقتراحاً. أكمل الحقول من الوثائق الرسمية ثم اطلب مراجعة بشرية.";
  return { content, modelUsed, advisoryOnly: true, policy, limitations: AI_ADVISORY_LIMITATIONS, inputDigest, outputDigest: digest(content) };
}
