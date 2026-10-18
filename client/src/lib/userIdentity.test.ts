import { describe, expect, it } from "vitest";
import {
  accountIdentityCardClass,
  accountIdentityNameClass,
  getDisplayName,
} from "./userIdentity";

describe("هوية المستخدم في الشريط العلوي", () => {
  it("تحافظ على الاسم كما أُدخل وتستخدم اسماً احتياطياً عند غيابه", () => {
    const longName = "المؤسسة الوطنية للتجهيزات والخدمات المتكاملة";

    expect(getDisplayName(longName)).toBe(longName);
    expect(getDisplayName("   ")).toBe("مستخدم المنصة");
  });

  it("تعتمد نمط سطر واحد داخل بطاقة زجاجية", () => {
    expect(accountIdentityNameClass).toContain("whitespace-nowrap");
    expect(accountIdentityNameClass).toContain("truncate");
    expect(accountIdentityCardClass).toContain("backdrop-blur-xl");
    expect(accountIdentityCardClass).toContain("rounded-2xl");
  });
});
