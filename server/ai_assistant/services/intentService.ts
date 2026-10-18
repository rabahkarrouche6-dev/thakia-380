export type AdvisoryIntent = "draft" | "match" | "price_review" | "table_review" | "explain" | "unknown";

export function classifyAdvisoryIntent(task: string): AdvisoryIntent {
  const value = task.trim().toLowerCase();
  if (/دفتر|شروط|صياغ|draft|document/.test(value)) return "draft";
  if (/مطابق|صفق|فرص|match|tender/.test(value)) return "match";
  if (/سعر|أسعار|price|cost/.test(value)) return "price_review";
  if (/جدول|حساب|arithmetic|table/.test(value)) return "table_review";
  if (value.length >= 2) return "explain";
  return "unknown";
}
