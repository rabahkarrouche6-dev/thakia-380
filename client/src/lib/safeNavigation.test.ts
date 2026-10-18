import { describe, expect, it } from "vitest";
import { canReturnWithinApp } from "./safeNavigation";

describe("canReturnWithinApp", () => {
  it("يسمح بالعودة عندما تكون الصفحة السابقة من نطاق المنصة نفسه", () => {
    expect(canReturnWithinApp("https://example.test/app", "https://example.test", 2)).toBe(true);
  });

  it("يرفض العودة عند فتح صفحة الحالة مباشرة أو من نطاق خارجي", () => {
    expect(canReturnWithinApp("", "https://example.test", 1)).toBe(false);
    expect(canReturnWithinApp("https://outside.test/page", "https://example.test", 3)).toBe(false);
  });
});
