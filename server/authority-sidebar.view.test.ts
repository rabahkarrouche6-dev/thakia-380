import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("authority workflow sidebar contract", () => {
  const authoritySource = readFileSync(resolve(process.cwd(), "client/src/pages/AuthorityShell.tsx"), "utf8");
  const portalSource = readFileSync(resolve(process.cwd(), "client/src/pages/Portal.tsx"), "utf8");

  it("offers the ten institutional authority destinations in workflow order in Arabic and English", () => {
    const arabicLabels = ["الرئيسية", "البرمجة والتخطيط", "الصفقات", "إعداد دفتر الشروط", "التقييم", "المتابعة والتنفيذ", "الوثائق والأرشيف", "التقارير", "التنبيهات", "الإعدادات"];
    const englishLabels = ["Home", "Programming & planning", "Tenders", "Tender document preparation", "Evaluation", "Follow-up & execution", "Documents & archive", "Reports", "Alerts", "Settings"];
    const sections = ["overview", "planning", "tenders", "tender-documents", "evaluation", "execution", "archive", "reports", "alerts", "settings"];

    arabicLabels.forEach(label => expect(authoritySource).toContain(label));
    englishLabels.forEach(label => expect(authoritySource).toContain(label));
    sections.forEach(section => expect(authoritySource).toContain(`/app?section=${section}`));
    const sidebarDefinition = authoritySource.match(/const authorityWorkflowSections[\s\S]*?= \[([\s\S]*?)\n\];/)?.[1] ?? "";
    expect((sidebarDefinition.match(/key:/g) ?? [])).toHaveLength(10);
    expect(new Set(sections).size).toBe(10);
    let previousPosition = -1;
    sections.forEach(section => {
      const position = sidebarDefinition.indexOf(`key: "${section}"`);
      expect(position).toBeGreaterThan(previousPosition);
      previousPosition = position;
    });
    expect(authoritySource).toContain("getAuthorityNavItems");
    expect(portalSource).toContain("getAuthorityNavItems(isEnglish)");
  });

  it("normalizes legacy links and routes every destination to an existing operational surface", () => {
    expect(authoritySource).toContain("useSearch");
    expect(authoritySource).toContain("sectionFromSearch(search)");
    expect(authoritySource).toContain("navigationSectionFor(nextSection)");
    expect(authoritySource).toContain('section === "tender-documents"');
    expect(authoritySource).toContain('section === "opening-evaluation"');
    expect(authoritySource).toContain('section === "contracts" && <AuthorityContractsSection');
    expect(authoritySource).toContain('section === "archive" && <AuthorityArchiveSection');
    expect(authoritySource).toContain('section === "alerts" && <AuthorityOperationalAlerts');
    expect(authoritySource).toContain('section === "settings" && <AuthoritySettingsSection');
    expect(authoritySource).toContain("trpc.authority.contracts.list.useQuery");
    expect(authoritySource).toContain("trpc.authority.archive.list.useQuery");
    expect(authoritySource).toContain("trpc.profile.get.useQuery");
    expect(authoritySource).toContain("trpc.profile.save.useMutation");
    expect(authoritySource).toContain("trpc.tenders.documents.download.useQuery");
    expect(authoritySource).toContain('const usesTenderData = !["contracts", "archive", "alerts", "settings"].includes(section)');
    expect(authoritySource).toContain("if (usesTenderData && tenders.isLoading)");
    expect(authoritySource).toContain("if (usesTenderData && tenders.isError)");
  });

  it("renders an auditable authority dashboard with live notification states and accessible interaction hints", () => {
    expect(authoritySource).toContain("AuthorityActivitySummary");
    expect(authoritySource).toContain("AuthorityOperationalAlerts");
    expect(authoritySource).toContain("trpc.authority.alerts.list.useQuery");
    expect(authoritySource).toContain("trpc.authority.alerts.markRead.useMutation");
    expect(authoritySource).toContain('new EventSource("/api/notifications/stream")');
    expect(authoritySource).toContain("TooltipContent");
    expect(authoritySource).toContain("motion-reduce:transition-none");
    expect(authoritySource).toContain("لا توجد تحديثات تشغيلية بعد");
  });

  it("exposes upcoming tenders and critical deadline indicators from protected tender data", () => {
    expect(authoritySource).toContain("AuthorityTimelineInsights");
    expect(authoritySource).toContain("tender.deadline");
    expect(authoritySource).toContain("الصفقات القادمة");
    expect(authoritySource).toContain("التواريخ الحرجة");
    expect(authoritySource).toContain("No upcoming tender deadlines are recorded yet.");
    expect(authoritySource).toContain("لا توجد تواريخ حرجة تتطلب المتابعة حالياً");
    expect(authoritySource).toContain("<AuthorityTimelineInsights tenders={tenders} onDrillDown={onDrillDown} />");
    expect(authoritySource).toContain("onDrillDown(tender.status === \"draft\" ? \"planning\" : \"current-tenders\", tender.status)");
  });

  it("keeps contracts, archive, and institutional settings localized for Arabic and English", () => {
    expect(authoritySource).toContain("function AuthorityContractsSection()");
    expect(authoritySource).toContain("function AuthorityArchiveSection()");
    expect(authoritySource).toContain("function AuthoritySettingsSection()");
    expect((authoritySource.match(/const \{ isEnglish \} = useLocale\(\);/g) ?? []).length).toBeGreaterThanOrEqual(3);
    ["Contracts and follow-up", "Documents and archive", "Institutional settings"].forEach(label => expect(authoritySource).toContain(label));
    ["العقود والمتابعة", "الوثائق والأرشيف", "إعدادات المؤسسة"].forEach(label => expect(authoritySource).toContain(label));
  });
});

describe("authority programming and planning permissions contract", () => {
  const authoritySource = readFileSync(resolve(process.cwd(), "client/src/pages/AuthorityShell.tsx"), "utf8");
  const planningSource = readFileSync(resolve(process.cwd(), "client/src/components/AuthorityProgrammingPlanning.tsx"), "utf8");

  it("separates planning preparation from approval, publication, and award decisions", () => {
    expect(authoritySource).toContain("AuthorityProgrammingPlanning");
    expect(authoritySource).toContain('{section === "planning" && <AuthorityProgrammingPlanning onNavigate={drillDown} />}');
    expect(planningSource).toContain("تسجيل الاحتياج");
    expect(planningSource).toContain("اقتراح البرمجة");
    expect(planningSource).toContain("إرسال للمراجعة");
    expect(planningSource).toContain("اعتماد البرمجة");
    expect(planningSource).toContain("النشر أو الإسناد");
    expect(planningSource).toContain("استشاري فقط");
    expect(planningSource).toContain("لا اعتماد أو إسناد من هنا");
  });

  it("keeps the section scoped to server ownership and auditable review", () => {
    expect(planningSource).toContain("عزل الملكية");
    expect(planningSource).toContain("أثر قابل للتدقيق");
    expect(planningSource).toContain("صلاحيات أقل امتيازاً");
    expect(authoritySource).toContain("tenders.mine.useQuery");
  });
});
