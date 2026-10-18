import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync(new URL("../client/src/components/SupplierSmartTenderSection.tsx", import.meta.url), "utf8");

describe("supplier smart tender interaction contract", () => {
  it("keeps contextual guidance available for every supplier field", () => {
    expect(component).toContain("instantGuidance");
    expect(component).toContain("aria-describedby={`smart-${field.key}-guidance`}");
    expect(component).toContain("role=\"note\"");
    expect(component).toContain("activeField");
  });

  it("exposes accessible loading feedback for AI assistance and saving", () => {
    expect(component).toContain("aria-busy={assist.isPending}");
    expect(component).toContain("جاري التحليل…");
    expect(component).toContain("يحلل المساعد الحقول الحالية");
    expect(component).toContain("aria-busy={save.isPending}");
    expect(component).toContain("جاري الحفظ…");
    expect(component).toContain("motion-safe:animate-pulse");
  });

  it("preserves the advisory-only human review guardrail", () => {
    expect(component).toContain("المساعد استشاري فقط");
    expect(component).toContain("مراجعة بشرية إلزامية");
  });

  it("shows live completion from valid fields only", () => {
    expect(component).toContain("validFieldCount");
    expect(component).toContain("values[field.key].trim().length >= 20");
    expect(component).toContain("اكتمال دفتر الشروط");
    expect(component).toContain("role=\"progressbar\"");
    expect(component).toContain("aria-valuenow={completion.percentage}");
    expect(component).toContain("من {fields.length} حقول مكتملة بشكل صحيح");
  });
});
