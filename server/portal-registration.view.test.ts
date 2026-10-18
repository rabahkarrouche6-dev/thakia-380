import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("portal-specific registration view contract", () => {
  const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
  const registrationSource = readFileSync(resolve(process.cwd(), "client/src/pages/PortalRegistration.tsx"), "utf8");
  const operatorSource = readFileSync(resolve(process.cwd(), "client/src/components/OperatorRegistration.tsx"), "utf8");

  it("registers a dedicated route per portal", () => {
    expect(appSource).toContain('path="/register/:portal"');
    expect(appSource).toContain("PortalRegistration");
    expect(appSource).toContain('path="/login/:portal" component={LoginRedirect}');
  });

  it("keeps the supplier registration copy and preview CTA", () => {
    expect(registrationSource).toContain("المتعامل الاقتصادي");
    expect(registrationSource).toContain("استكشف البوابة قبل التسجيل");
    expect(registrationSource).toContain("/preview/${portalKey");
    expect(registrationSource).not.toContain("startLogin");
    expect(registrationSource).toContain("العودة إلى اختيار البوابة");
    expect(registrationSource).toContain("الدخول نفسه مخصص للمستخدم الجديد والعائد");
  });

  it("does not claim that the registration page grants permissions", () => {
    expect(registrationSource).toContain("لا تمنح هذه الصفحة صلاحيات تعاقدية");
    expect(registrationSource).toContain("تعيين الدور الرقابي يتم من الخادم");
  });

  it("adds inline validation and accessible field feedback to the operator form", () => {
    expect(operatorSource).toContain("function validateField");
    expect(operatorSource).toContain("aria-invalid={Boolean(error)}");
    expect(operatorSource).toContain('role="alert"');
    expect(operatorSource).toContain("رقم NIF يجب أن يتكون من 15 رقماً");
    expect(operatorSource).toContain("هذا الحقل مطلوب لإكمال الملف");
  });

  it("shows a live completion progress bar based on valid fields", () => {
    expect(operatorSource).toContain("completionChecks");
    expect(operatorSource).toContain("aria-valuenow={completion}");
    expect(operatorSource).toContain("الحقول المكتملة والصحيحة فقط");
    expect(operatorSource).toContain("المتبقي:");
  });

  it("shows document-aligned fields after secure authentication", () => {
    expect(registrationSource).toContain("حقول الملحق الثاني");
    expect(registrationSource).toContain("التسمية أو اسم المتعامل");
    expect(registrationSource).toContain("تسمية المصلحة");
    expect(registrationSource).toContain("بعد المصادقة");
    expect(registrationSource).toContain("requiredFields");
  });
});
