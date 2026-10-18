import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("supplier sidebar MVP contract", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/pages/SupplierWorkspace.tsx"), "utf8");
  const portalSource = readFileSync(resolve(process.cwd(), "client/src/pages/Portal.tsx"), "utf8");
  const navigationSource = readFileSync(resolve(process.cwd(), "client/src/lib/portalNavigation.ts"), "utf8");

  it("keeps the supplier workflow destinations in the requested order", () => {
    const labels = ["الرئيسية", "الصفقات", "عروضي", "ملفي ووثائقي", "دفتر الشروط الذكي", "العقود والمتابعة", "التنبيهات", "المساعدة"];
    const positions = labels.map(label => navigationSource.indexOf(`label: \"${label}\"`));

    expect(positions).not.toContain(-1);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(source).toContain("const supplierWorkflowSections");
    expect(navigationSource).toContain("export const supplierNavItems: NavItem[] = [");
  });

  it("uses only known section keys and falls back unknown URLs to the home section", () => {
    expect(source).toContain('"home" | "opportunities" | "bids" | "profile" | "smart-documents" | "contracts" | "alerts" | "help"');
    expect(source).toContain("const supplierSectionFromSearch");
    expect(source).toContain('return value && knownSections.has(value as SupplierSection) ? value as SupplierSection : "home"');
    expect(source).toContain("const querySection = supplierSectionFromSearch");
  });

  it("binds contracts and alerts to protected operational sources instead of readiness placeholders", () => {
    expect(source).toContain("function ContractsSection()");
    expect(source).toContain("trpc.supplier.contracts.list.useQuery()");
    expect(source).toContain("function AlertsSection()");
    expect(source).toContain("trpc.supplier.alerts.list.useQuery({ limit: 30 })");
    expect(source).toContain("trpc.supplier.alerts.markRead.useMutation");
    expect(source).toContain("مركز التنبيهات التشغيلية");
    expect(source).toContain("تحديد كمقروء");
    expect(source).not.toContain("العقود والمتابعة قيد التجهيز");
    expect(source).not.toContain("التنبيهات غير مفعّلة في MVP");
    expect(source).toContain("دليل مختصر للاستخدام لا يحل محل الوثائق القانونية");
  });

  it("binds this navigation exclusively to the supplier portal branch", () => {
    expect(portalSource).toContain("const isSupplier = portal === \"supplier\"");
    expect(portalSource).toContain("const items = isSupplier ? supplierNavItems");
    expect(portalSource).toContain("{isSupplier ? <SupplierWorkspace />");
  });
});
