import { describe, expect, it } from "vitest";
import { readinessItems, supplierAiKpis } from "../client/src/components/SupplierAiAssistantMockup";

describe("supplier AI assistant mockup", () => {
  it("keeps readiness states explicit and covers the core field statuses", () => {
    expect(readinessItems).toHaveLength(4);
    expect(new Set(readinessItems.map(item => item.state))).toEqual(new Set(["complete", "incomplete", "needs_review"]));
  });

  it("does not present demo KPI values as measured outcomes", () => {
    expect(supplierAiKpis).toHaveLength(4);
    expect(supplierAiKpis.map(kpi => kpi.value)).toEqual(["غير مقاس", "خط الأساس قيد القياس", "غير مقاس", "لا توجد بيانات بعد"]);
    expect(supplierAiKpis.map(kpi => kpi.label)).toEqual([
      "معدل استخدام المساعد",
      "زمن إكمال المسودة",
      "مراجعة بشرية مكتملة",
      "حوادث عزل البيانات",
    ]);
  });
});
