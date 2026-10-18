export type AdvisoryAction = "suggest" | "draft" | "review" | "publish" | "award" | "sign" | "mutate";

const BLOCKED_ACTIONS = new Set<AdvisoryAction>(["publish", "award", "sign", "mutate"]);

export function assertAdvisoryAction(action: AdvisoryAction): { allowed: true; requiresHumanReview: true } {
  if (BLOCKED_ACTIONS.has(action)) {
    throw new Error("المساعد الاستشاري لا ينفذ النشر أو الإسناد أو التوقيع أو تعديل السجلات");
  }
  return { allowed: true, requiresHumanReview: true };
}

export function isAdvisoryOnlyAction(action: AdvisoryAction) {
  return !BLOCKED_ACTIONS.has(action);
}
