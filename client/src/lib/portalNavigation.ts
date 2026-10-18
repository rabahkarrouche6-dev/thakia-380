import type { NavItem } from "@/components/DashboardLayout";
import { Archive, BarChart3, BellRing, BriefcaseBusiness, CircleHelp, ClipboardList, FileCheck2, FilePlus2, FileText, Gauge, LayoutDashboard, Search, Settings2, ShieldAlert, Sparkles, Store, UserRound, UsersRound } from "lucide-react";

export const getAuthorityNavItems = (isEnglish: boolean): NavItem[] => [
  { group: isEnglish ? "Workspace" : "مساحة العمل", label: isEnglish ? "Home" : "الرئيسية", path: "/app?section=overview", icon: LayoutDashboard },
  { group: isEnglish ? "Workspace" : "مساحة العمل", label: isEnglish ? "Programming & planning" : "البرمجة والتخطيط", path: "/app?section=planning", icon: ClipboardList },
  { group: isEnglish ? "Procurement cycle" : "دورة الصفقة", label: isEnglish ? "Tenders" : "الصفقات", path: "/app?section=tenders", icon: BriefcaseBusiness },
  { group: isEnglish ? "Procurement cycle" : "دورة الصفقة", label: isEnglish ? "Tender document preparation" : "إعداد دفتر الشروط", path: "/app?section=tender-documents", icon: FilePlus2 },
  { group: isEnglish ? "Procurement cycle" : "دورة الصفقة", label: isEnglish ? "Evaluation" : "التقييم", path: "/app?section=evaluation", icon: Search },
  { group: isEnglish ? "Follow-up" : "المتابعة", label: isEnglish ? "Follow-up & execution" : "المتابعة والتنفيذ", path: "/app?section=execution", icon: FileCheck2 },
  { group: isEnglish ? "Follow-up" : "المتابعة", label: isEnglish ? "Documents & archive" : "الوثائق والأرشيف", path: "/app?section=archive", icon: Archive },
  { group: isEnglish ? "Administration" : "الإدارة", label: isEnglish ? "Reports" : "التقارير", path: "/app?section=reports", icon: BarChart3 },
  { group: isEnglish ? "Administration" : "الإدارة", label: isEnglish ? "Alerts" : "التنبيهات", path: "/app?section=alerts", icon: BellRing },
  { group: isEnglish ? "Administration" : "الإدارة", label: isEnglish ? "Settings" : "الإعدادات", path: "/app?section=settings", icon: Settings2 },
];

export const supplierNavItems: NavItem[] = [
  { label: "الرئيسية", path: "/app?section=home", icon: LayoutDashboard },
  { label: "الصفقات", path: "/app?section=opportunities", icon: BriefcaseBusiness },
  { label: "عروضي", path: "/app?section=bids", icon: FileCheck2 },
  { label: "ملفي ووثائقي", path: "/app?section=profile", icon: UserRound },
  { label: "دفتر الشروط الذكي", path: "/app?section=smart-documents", icon: Sparkles },
  { label: "العقود والمتابعة", path: "/app?section=contracts", icon: FileText },
  { label: "التنبيهات", path: "/app?section=alerts", icon: BellRing },
  { label: "المساعدة", path: "/app?section=help", icon: CircleHelp },
];

export const getRegulatorNavItems = (isEnglish: boolean): NavItem[] => isEnglish
  ? [
      { group: "Central administration", label: "Dashboard", path: "/app?section=dashboard", icon: LayoutDashboard },
      { group: "Central administration", label: "Users and entities", path: "/app?section=users", icon: UsersRound },
      { group: "Central administration", label: "Contracting authorities", path: "/app?section=authorities", icon: UsersRound },
      { group: "Central administration", label: "Economic operators", path: "/app?section=operators", icon: Store },
      { group: "Central administration", label: "Central tenders", path: "/app?section=tenders", icon: BriefcaseBusiness },
      { group: "Central administration", label: "Administrative reports", path: "/app?section=reports", icon: BarChart3 },
      { group: "Central administration", label: "General supervision", path: "/app?section=supervision", icon: ShieldAlert },
      { group: "Central administration", label: "Oversight & alerts", path: "/app?section=oversight", icon: ShieldAlert },
      { group: "Operations center", label: "Operations dashboard", path: "/app?section=operations", icon: LayoutDashboard },
      { group: "Operations center", label: "Platform settings", path: "/app?section=platform-settings", icon: Settings2 },
      { group: "Operations center", label: "AI settings", path: "/app?section=ai-settings", icon: Sparkles },
      { group: "Operations center", label: "AI data analysis", path: "/app?section=ai-analysis", icon: Sparkles },
      { group: "Operations center", label: "Security and encryption", path: "/app?section=security", icon: ShieldAlert },
      { group: "Operations center", label: "Service health", path: "/app?section=health", icon: Gauge },
      { group: "Operations center", label: "Performance monitoring", path: "/app?section=performance", icon: BarChart3 },
      { group: "Operations center", label: "Background jobs", path: "/app?section=jobs", icon: Settings2 },
      { group: "Operations center", label: "Audit log", path: "/app?section=audit-log", icon: ClipboardList },
      { group: "Operations center", label: "Error log", path: "/app?section=error-log", icon: ShieldAlert },
      { group: "Operations center", label: "Alerts", path: "/app?section=alerts", icon: BellRing },
      { group: "Operations center", label: "Backup and maintenance", path: "/app?section=backup", icon: Archive },
    ]
  : [
      { group: "الإدارة المركزية", label: "لوحة القيادة", path: "/app?section=dashboard", icon: LayoutDashboard },
      { group: "الإدارة المركزية", label: "المستخدمون والجهات", path: "/app?section=users", icon: UsersRound },
      { group: "الإدارة المركزية", label: "الهيئات/المصالح المتعاقدة", path: "/app?section=authorities", icon: UsersRound },
      { group: "الإدارة المركزية", label: "المتعاملون الاقتصاديون", path: "/app?section=operators", icon: Store },
      { group: "الإدارة المركزية", label: "الصفقات والمناقصات · الصفقات المركزية", path: "/app?section=tenders", icon: BriefcaseBusiness },
      { group: "الإدارة المركزية", label: "التقارير الإدارية", path: "/app?section=reports", icon: BarChart3 },
      { group: "الإدارة المركزية", label: "الإشراف العام", path: "/app?section=supervision", icon: ShieldAlert },
      { group: "الإدارة المركزية", label: "الرقابة والتنبيهات", path: "/app?section=oversight", icon: ShieldAlert },
      { group: "مركز إعدادات وتشغيل المنصة", label: "لوحة التشغيل", path: "/app?section=operations", icon: LayoutDashboard },
      { group: "مركز إعدادات وتشغيل المنصة", label: "إعدادات المنصة", path: "/app?section=platform-settings", icon: Settings2 },
      { group: "مركز إعدادات وتشغيل المنصة", label: "إعدادات الذكاء الاصطناعي", path: "/app?section=ai-settings", icon: Sparkles },
      { group: "مركز إعدادات وتشغيل المنصة", label: "التحليل الذكي للبيانات", path: "/app?section=ai-analysis", icon: Sparkles },
      { group: "مركز إعدادات وتشغيل المنصة", label: "إعدادات الأمن والتشفير", path: "/app?section=security", icon: ShieldAlert },
      { group: "مركز إعدادات وتشغيل المنصة", label: "صحة الخدمات", path: "/app?section=health", icon: Gauge },
      { group: "مركز إعدادات وتشغيل المنصة", label: "مراقبة الأداء", path: "/app?section=performance", icon: BarChart3 },
      { group: "مركز إعدادات وتشغيل المنصة", label: "المهام الخلفية", path: "/app?section=jobs", icon: Settings2 },
      { group: "مركز إعدادات وتشغيل المنصة", label: "سجل التدقيق", path: "/app?section=audit-log", icon: ClipboardList },
      { group: "مركز إعدادات وتشغيل المنصة", label: "سجل الأخطاء", path: "/app?section=error-log", icon: ShieldAlert },
      { group: "مركز إعدادات وتشغيل المنصة", label: "التنبيهات", path: "/app?section=alerts", icon: BellRing },
      { group: "مركز إعدادات وتشغيل المنصة", label: "النسخ الاحتياطي والصيانة", path: "/app?section=backup", icon: Archive },
    ];
