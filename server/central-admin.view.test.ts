import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("central admin regulator view contract", () => {
  const portalSource = readFileSync(resolve(process.cwd(), "client/src/pages/Portal.tsx"), "utf8");
  const navigationSource = readFileSync(resolve(process.cwd(), "client/src/lib/portalNavigation.ts"), "utf8");
  const centralSource = readFileSync(resolve(process.cwd(), "client/src/pages/CentralAdminPortal.tsx"), "utf8");
  const layoutSource = readFileSync(resolve(process.cwd(), "client/src/components/DashboardLayout.tsx"), "utf8");
  const overviewSource = readFileSync(resolve(process.cwd(), "client/src/pages/RegulatorOverview.tsx"), "utf8");
  const aiPanelSource = readFileSync(resolve(process.cwd(), "client/src/pages/RegulatorAiPanel.tsx"), "utf8");

  it("routes regulator to the central admin portal component", () => {
    expect(portalSource).toContain("isRegulator ? <CentralAdminPortal />");
    expect(portalSource).toContain('const CentralAdminPortal = lazy(() => import("@/pages/CentralAdminPortal"))');
  });

  it("offers six workflow-ordered central administration destinations with shallow section routes", () => {
    const arabicLabels = ["لوحة القيادة", "الهيئات/المصالح المتعاقدة", "المتعاملون الاقتصاديون", "الصفقات المركزية", "الرقابة والتنبيهات", "التحليل الذكي للبيانات"];
    const englishLabels = ["Dashboard", "Contracting authorities", "Economic operators", "Central tenders", "Oversight & alerts", "AI data analysis"];
    const sections = ["dashboard", "authorities", "operators", "tenders", "oversight", "ai-analysis"];

    arabicLabels.forEach(label => expect(navigationSource).toContain(label));
    englishLabels.forEach(label => expect(navigationSource).toContain(label));
    sections.forEach(section => {
      expect(navigationSource).toContain(`/app?section=${section}`);
      expect(centralSource).toContain(`"${section}"`);
    });
    expect(centralSource).toContain("centralSections");
    expect(centralSource).toContain("useSearch");
    expect(layoutSource).toContain("aria-current={isActive ? \"page\" : undefined}");
    expect(layoutSource).toContain("itemSection === activeSection");
    expect(layoutSource).toContain("mobileNavigationOpen");
    expect(portalSource).toContain("getRegulatorNavItems(isEnglish)");
  });

  it("keeps contractual decisions out of the regulator view", () => {
    expect(centralSource).not.toContain("trpc.awards");
    expect(centralSource).not.toContain("trpc.tenders.publish");
    expect(centralSource).not.toContain("تقييم أولي");
    expect(centralSource).not.toContain("إسناد الصفقة");
    expect(centralSource).not.toContain("إلغاء الصفقة");
    expect(centralSource).toContain("صلاحيات قراءة ومراجعة");
  });

  it("binds authority and operator registries to regulator-only read contracts without sensitive identity fields", () => {
    const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const databaseSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    expect(routerSource).toContain("authorities: roleProcedure([\"regulator\", \"admin\"])");
    expect(routerSource).toContain("operators: roleProcedure([\"regulator\", \"admin\"])");
    expect(centralSource).toContain("trpc.regulator.authorities.useQuery()");
    expect(centralSource).toContain("trpc.regulator.operators.useQuery()");
    expect(centralSource).toContain("سجل الهيئات واعتماداتها");
    expect(centralSource).toContain("سجل المتعاملين الاقتصاديين");
    expect(databaseSource).toContain("listCentralAuthorityRegistry");
    expect(databaseSource).toContain("listCentralOperatorRegistry");
    expect(databaseSource).not.toContain("email: users.email");
    expect(databaseSource).not.toContain("nif: operatorProfiles.nif");
    expect(databaseSource).not.toContain("rib: operatorProfiles.rib");
  });

  it("keeps authority approval restricted to central reviewers and exposed through the reviewed registry", () => {
    const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(routerSource).toContain("approveAuthority: roleProcedure([\"regulator\", \"admin\"])");
    expect(routerSource).toContain("authority_role_approved");
    expect(routerSource).toContain("authority_role_requested");
    expect(centralSource).toContain("trpc.regulator.approveAuthority.useMutation");
    expect(centralSource).toContain("authority.approvalStatus === \"pending\"");
    expect(centralSource).toContain("اعتماد كمصلحة متعاقدة");
  });

  it("binds the overview component to the server contract and explicit data states", () => {
    expect(centralSource).toContain("RegulatorOverview");
    expect(overviewSource).toContain("trpc.regulator.overview.useQuery()");
    expect(overviewSource).toContain("overview.isLoading");
    expect(overviewSource).toContain("overview.isError");
    expect(overviewSource).toContain("لا توجد بيانات تشغيلية بعد");
    expect(overviewSource).toContain("إعادة المحاولة");
    expect(overviewSource).toContain("tenderStatusCounts");
    expect(overviewSource).toContain("ResponsiveContainer");
    expect(overviewSource).toContain("توزيع حالات الصفقات");
    expect(overviewSource).toContain("لا توجد حالات صفقات متاحة للرسم بعد");
    expect(overviewSource).toContain("tabular-nums");
  });

  it("keeps the central tender workspace filter-aware and the audit trail visually attributable", () => {
    expect(centralSource).toContain("activeTenderFilterCount");
    expect(centralSource).toContain("tenderListSummary");
    expect(centralSource).toContain('aria-live="polite"');
    expect(centralSource).toContain('aria-pressed={status === key}');
    expect(centralSource).toContain("border-s-[#0d8062]");
    expect(centralSource).toContain("futureReady");
  });

  it("keeps AI radar summaries explainable, interactive, and advisory-only", () => {
    expect(aiPanelSource).toContain("trpc.regulator.ai.radar.useQuery()");
    expect(aiPanelSource).toContain("Advisory data summary");
    expect(aiPanelSource).toContain("ملخص البيانات الاستشاري");
    expect(aiPanelSource).toContain("Priority distribution");
    expect(aiPanelSource).toContain("توزيع الأولوية");
    expect(aiPanelSource).toContain("ChartContainer");
    expect(aiPanelSource).toContain("PieChart");
    expect(aiPanelSource).toContain("BarChart");
    expect(aiPanelSource).toContain("severityFilter");
    expect(aiPanelSource).toContain('aria-pressed={severityFilter === item.severity}');
    expect(aiPanelSource).toContain("Mandatory human review");
    expect(aiPanelSource).toContain("مراجعة بشرية إلزامية");
    expect(aiPanelSource).toContain("ADVISORY ANALYSIS · HUMAN REVIEW");
    expect(aiPanelSource).toContain("تحليل استشاري · مراجعة بشرية");
    expect(aiPanelSource).toContain("focus-visible:ring-2 focus-visible:ring-[#0d8062]");
  });
});


describe("central administration operations center contract", () => {
  const navigationSource = readFileSync(resolve(process.cwd(), "client/src/lib/portalNavigation.ts"), "utf8");
  const operationsSource = readFileSync(resolve(process.cwd(), "client/src/components/CentralOperationsCenter.tsx"), "utf8");
  const centralSource = readFileSync(resolve(process.cwd(), "client/src/pages/CentralAdminPortal.tsx"), "utf8");

  it("exposes the requested Arabic administration and operations groups", () => {
    ["الإدارة المركزية", "مركز إعدادات وتشغيل المنصة", "المستخدمون والجهات", "الصفقات والمناقصات", "التقارير الإدارية", "الإشراف العام", "لوحة التشغيل", "إعدادات المنصة", "إعدادات الذكاء الاصطناعي", "إعدادات الأمن والتشفير", "صحة الخدمات", "مراقبة الأداء", "المهام الخلفية", "سجل التدقيق", "سجل الأخطاء", "التنبيهات", "النسخ الاحتياطي والصيانة"].forEach(label => expect(navigationSource).toContain(label));
  });

  it("routes operations sections to a governed, non-destructive workspace", () => {
    ["operations", "platform-settings", "ai-settings", "security", "health", "performance", "jobs", "audit-log", "error-log", "alerts", "backup"].forEach(section => {
      expect(navigationSource).toContain(`/app?section=${section}`);
      expect(centralSource).toContain(`"${section}"`);
    });
    expect(centralSource).toContain("CentralOperationsCenter");
    expect(operationsSource).toContain("استشاري فقط");
    expect(operationsSource).toContain("هذه المساحة غير مدمرة عمداً");
    expect(operationsSource).toContain("Sensitive mutations require a separate approved workflow");
  });
});
