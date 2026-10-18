import type { User } from "../../../drizzle/schema";

export const AI_POLICY_VERSION = "modular-advisory-1.0";
export const AI_POLICY_LIMITATIONS = [
  "المخرجات إرشادية ولا تمثل قراراً تعاقدياً أو اعتماداً قانونياً.",
  "يجب أن يراجع المستخدم المخول كل محتوى قبل اعتماده أو نشره.",
  "لا تتخذ الخدمة قرار أهلية أو ترتيباً أو إسناداً تلقائياً.",
] as const;

const BLOCKED_INSTRUCTIONS = /(ignore\s+(all|previous)|تجاهل\s+(كل|التعليمات)|system\s+prompt|مفتاح|token|password|secret)/i;

export type AdvisoryAudience = User["role"];

export type PolicyDecision = {
  allowed: true;
  version: string;
  checks: string[];
  limitations: readonly string[];
};

export function enforceAdvisoryPolicy(input: {
  user: Pick<User, "role">;
  task: string;
  fields: Record<string, unknown>;
}): PolicyDecision {
  if (!["supplier", "authority", "admin", "regulator"].includes(input.user.role)) {
    throw new Error("الدور غير مخول لاستخدام المساعد الاستشاري");
  }
  const task = input.task.trim();
  if (task.length < 2 || task.length > 2_000) throw new Error("وصف المهمة غير صالح");
  if (BLOCKED_INSTRUCTIONS.test(task)) throw new Error("تعذر قبول تعليمات تتجاوز سياسة البوابة");
  if (!input.fields || typeof input.fields !== "object" || Array.isArray(input.fields)) {
    throw new Error("بيانات السياق غير صالحة");
  }
  return {
    allowed: true,
    version: AI_POLICY_VERSION,
    checks: ["authenticated", "role_scoped", "advisory_only", "bounded_input", "no_automatic_decision"],
    limitations: AI_POLICY_LIMITATIONS,
  };
}
