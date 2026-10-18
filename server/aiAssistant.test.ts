import { describe, expect, it } from "vitest";
import { normalizeAssistantInput } from "./aiAssistant";

describe("smart assistant service", () => {
  it("normalizes bounded task and answers without changing the contract", () => {
    const result = normalizeAssistantInput("  راجع خطوات إنشاء الصفقة  ", { context: "authority", role: "user", empty: "   " });
    expect(result.task).toBe("راجع خطوات إنشاء الصفقة");
    expect(result.answers).toEqual({ context: "authority", role: "user" });
  });

  it("rejects blank or non-string task descriptions", () => {
    expect(() => normalizeAssistantInput(" ", {})).toThrow("وصف المهمة غير صالح");
    expect(() => normalizeAssistantInput(null as unknown as string, {})).toThrow("وصف المهمة غير صالح");
  });

  it("rejects arrays as answers and bounds oversized values", () => {
    expect(() => normalizeAssistantInput("مهمة صحيحة", [] as unknown as Record<string, unknown>)).toThrow("كائن JSON");
    const result = normalizeAssistantInput("مهمة صحيحة", { key: "x".repeat(2_000) });
    expect(result.answers.key).toHaveLength(1_000);
  });

  it("does not include raw sensitive-looking fields unless explicitly supplied", () => {
    const result = normalizeAssistantInput("تحليل إرشادي", { tenderId: 42, documentUrl: "https://private.example/doc.pdf" });
    expect(result.answers).toEqual({ tenderId: "42", documentUrl: "https://private.example/doc.pdf" });
  });
});
