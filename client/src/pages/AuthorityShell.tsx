import { trpc } from "@/lib/trpc";
import AuthorityTenderCreate from "./AuthorityTenderCreate";
import { ProcurementAiWorkbench } from "@/components/ProcurementAiWorkbench";
import AiDocumentAssistantPanel from "@/components/AiDocumentAssistantPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalStatCard, PortalStatGrid } from "@/components/PortalStatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Archive, BarChart3, BellRing, BriefcaseBusiness, CalendarClock, CheckCircle2, ChevronLeft, CircleAlert, ClipboardList, Clock3, CreditCard, Download, FileCheck2, FilePlus2, FileText, Gavel, Hash, LayoutDashboard, Loader2, LockKeyhole, PenLine, Printer, Search, Settings2, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import type { NavItem } from "@/components/DashboardLayout";
import { ContextualOnboarding } from "@/components/ContextualOnboarding";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocale } from "@/contexts/LocaleContext";
import { toast } from "sonner";
import AuthorityProgrammingPlanning from "@/components/AuthorityProgrammingPlanning";

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  published: "منشورة",
  closed: "مغلقة",
  evaluation: "قيد التقييم",
  awarded: "مسندة",
  cancelled: "ملغاة",
};

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  published: "bg-emerald-50 text-emerald-700",
  closed: "bg-amber-50 text-amber-700",
  evaluation: "bg-blue-50 text-blue-700",
  awarded: "bg-[#e6f5ed] text-[#0d8062]",
  cancelled: "bg-red-50 text-red-700",
};

const activeLocale = () => document.documentElement.lang === "en" ? "en-DZ" : "ar-DZ";
const formatDate = (value: Date | string | null | undefined) => value ? new Date(value).toLocaleDateString(activeLocale()) : "—";
const formatAmount = (value: number | null | undefined, currency = "DZD") => value == null ? (activeLocale() === "en-DZ" ? "Not specified" : "غير محدد") : `${new Intl.NumberFormat(activeLocale()).format(value)} ${currency === "DZD" && activeLocale() !== "en-DZ" ? "دج" : currency}`;

export type AuthoritySection = "overview" | "planning" | "current-tenders" | "tender-documents" | "publication-reception" | "opening-evaluation" | "awards" | "contracts" | "archive" | "reports" | "alerts" | "settings";
type Section = AuthoritySection;
type NavigationSection = "overview" | "planning" | "tenders" | "tender-documents" | "evaluation" | "execution" | "archive" | "reports" | "alerts" | "settings";
type AuthorityContractStatus = "pending_signature" | "active" | "completed" | "suspended" | "terminated";
type AuthorityContractTransitionStatus = Exclude<AuthorityContractStatus, "pending_signature">;
type AuthorityContract = { id: number; contractReference: string; amount: number; currency: string; status: AuthorityContractStatus; awardedAt: Date | string; updatedAt: Date | string; tenderReference: string; tenderTitle: string; supplierName: string | null };
type AuthorityArchiveDocument = { id: number; tenderId: number; fileName: string; mimeType: string | null; sizeBytes: number | null; createdAt: Date | string; tenderReference: string; tenderTitle: string; tenderStatus: string };

const authorityContractStatusLabels: Record<AuthorityContractStatus, { ar: string; en: string }> = {
  pending_signature: { ar: "بانتظار التوقيع", en: "Pending signature" },
  active: { ar: "ساري", en: "Active" },
  completed: { ar: "مكتمل", en: "Completed" },
  suspended: { ar: "معلّق", en: "Suspended" },
  terminated: { ar: "منتهٍ", en: "Terminated" },
};

const authorityContractStatusStyles: Record<AuthorityContractStatus, string> = {
  pending_signature: "bg-amber-50 text-amber-700",
  active: "bg-emerald-50 text-emerald-700",
  completed: "bg-sky-50 text-sky-700",
  suspended: "bg-orange-50 text-orange-700",
  terminated: "bg-slate-100 text-slate-600",
};

const authorityContractTransitions: Record<AuthorityContractStatus, AuthorityContractTransitionStatus[]> = {
  pending_signature: ["active", "terminated"],
  active: ["completed", "suspended"],
  completed: [],
  suspended: ["active", "terminated"],
  terminated: [],
};

const formatFileSize = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const authorityWorkflowSections: Array<{ key: NavigationSection; path: string; labelAr: string; labelEn: string; icon: typeof LayoutDashboard }> = [
  { key: "overview", path: "/app?section=overview", labelAr: "الرئيسية", labelEn: "Home", icon: LayoutDashboard },
  { key: "planning", path: "/app?section=planning", labelAr: "البرمجة والتخطيط", labelEn: "Programming & planning", icon: ClipboardList },
  { key: "tenders", path: "/app?section=tenders", labelAr: "الصفقات", labelEn: "Tenders", icon: BriefcaseBusiness },
  { key: "tender-documents", path: "/app?section=tender-documents", labelAr: "إعداد دفتر الشروط", labelEn: "Tender document preparation", icon: FilePlus2 },
  { key: "evaluation", path: "/app?section=evaluation", labelAr: "التقييم", labelEn: "Evaluation", icon: Search },
  { key: "execution", path: "/app?section=execution", labelAr: "المتابعة والتنفيذ", labelEn: "Follow-up & execution", icon: FileCheck2 },
  { key: "archive", path: "/app?section=archive", labelAr: "الوثائق والأرشيف", labelEn: "Documents & archive", icon: Archive },
  { key: "reports", path: "/app?section=reports", labelAr: "التقارير", labelEn: "Reports", icon: BarChart3 },
  { key: "alerts", path: "/app?section=alerts", labelAr: "التنبيهات", labelEn: "Alerts", icon: BellRing },
  { key: "settings", path: "/app?section=settings", labelAr: "الإعدادات", labelEn: "Settings", icon: Settings2 },
];

const sectionFromSearch = (search: string): Section => {
  const section = new URLSearchParams(search).get("section");
  const sectionMapping: Record<string, Section> = {
    overview: "overview", planning: "planning", tenders: "current-tenders", "tender-documents": "tender-documents", evaluation: "opening-evaluation", execution: "contracts", archive: "archive", reports: "reports", alerts: "alerts", settings: "settings",
    "current-tenders": "current-tenders", "publication-reception": "publication-reception", "opening-evaluation": "opening-evaluation", awards: "awards", contracts: "contracts",
  };
  return sectionMapping[section ?? ""] ?? "overview";
};

const navigationSectionFor = (section: Section): NavigationSection => ({
  overview: "overview", planning: "planning", "current-tenders": "tenders", "tender-documents": "tender-documents", "publication-reception": "tenders", "opening-evaluation": "evaluation", awards: "execution", contracts: "execution", archive: "archive", reports: "reports", alerts: "alerts", settings: "settings",
} satisfies Record<Section, NavigationSection>)[section];

export const getAuthorityNavItems = (isEnglish: boolean): NavItem[] => authorityWorkflowSections.map(item => ({
  label: isEnglish ? item.labelEn : item.labelAr,
  path: item.path,
  icon: item.icon,
}));

export function TenderStatusBadge({ status }: { status: string }) {
  return <Badge className={`border-0 rounded-full px-3 py-1 ${statusStyles[status] || "bg-slate-100 text-slate-600"}`}>{statusLabels[status] || status}</Badge>;
}

function StateBlock({ type, title, description }: { type: "loading" | "empty" | "error"; title: string; description: string }) {
  const Icon = type === "loading" ? Loader2 : type === "error" ? CircleAlert : LockKeyhole;
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center"><Icon className={`mx-auto h-7 w-7 ${type === "loading" ? "animate-spin text-[#0d5c79]" : type === "error" ? "text-red-500" : "text-slate-400"}`} /><div className="mt-4 font-semibold text-[#092e49]">{title}</div><p className="mt-2 text-sm leading-7 text-slate-500">{description}</p></div>;
}

const authorityFeatureLabels: Record<string, string> = {
  ai_rfp_generation: "مساندة استشارية في إعداد دفتر الشروط",
  smart_evaluator_support: "مساندة استشارية للتقييم",
  advanced_notifications: "تنبيهات متقدمة",
  team_management: "إدارة الفريق والمقاعد",
};

export function AuthoritySubscriptions() {
  const plansQuery = trpc.subscriptions.plans.useQuery({});
  const plans = plansQuery.data ?? [];
  return <section aria-labelledby="authority-subscriptions-title" className="space-y-5">
    <div className="rounded-3xl border border-teal-100 bg-gradient-to-l from-teal-50 to-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><div className="text-xs font-bold tracking-[.18em] text-[#0d8062]">الخطط المؤسسية</div><h2 id="authority-subscriptions-title" className="mt-2 text-2xl font-black text-[#092e49]">اشتراك المصلحة المتعاقدة</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">اختر أدوات إنتاجية ومساندة استشارية إضافية. لا تمنح أي خطة أفضلية في الإسناد ولا تحجب تصفح الصفقات أو الحقوق الإجرائية الأساسية.</p></div>
        <CreditCard className="h-8 w-8 shrink-0 text-[#0d8062]" aria-hidden="true" />
      </div>
    </div>
    {plansQuery.isLoading && <StateBlock type="loading" title="جاري تحميل الخطط" description="نقرأ كتالوج الاشتراكات من المصدر المحمي." />}
    {plansQuery.isError && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-800">تعذر تحميل الخطط حالياً. لا يؤثر ذلك في الصفقات أو الإجراءات الأساسية.</div>}
    {!plansQuery.isLoading && !plansQuery.isError && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{plans.map(plan => <Card key={plan.code} className={`rounded-3xl shadow-sm ${plan.billingCycle === "free" ? "border-slate-200 bg-white" : "border-teal-200 bg-teal-50/40"}`}><CardHeader><CardTitle className="flex items-center justify-between gap-3 text-lg">{plan.nameAr}<span className="text-xs font-medium text-slate-500">{plan.billingCycle === "free" ? "أساسي" : plan.billingCycle === "monthly" ? "شهري" : "سنوي"}</span></CardTitle><p className="text-sm text-slate-500">{plan.priceDzd.toLocaleString("ar-DZ")} دج</p></CardHeader><CardContent className="space-y-4"><ul className="space-y-2 text-sm leading-6">{plan.features.map(feature => <li key={feature.featureCode} className="flex gap-2"><span className="text-emerald-600" aria-hidden="true">✓</span><span>{authorityFeatureLabels[feature.featureCode] ?? "ميزة إنتاجية مؤسسية"}{feature.quotaLimit ? ` — ${feature.quotaLimit.toLocaleString("ar-DZ")} وحدة` : ""}</span></li>)}</ul><Button type="button" variant={plan.billingCycle === "free" ? "outline" : "default"} className="w-full" onClick={() => window.location.assign("/pricing")}>{plan.billingCycle === "free" ? "عرض تفاصيل الوصول" : "طلب الترقية المؤسسية"}</Button></CardContent></Card>)}</div>}
  </section>;
}

export function AuthorityKpiStrip({ tenders, onDrillDown }: { tenders: any[]; onDrillDown: (section: Section, status?: string) => void }) {
  const metrics = [
    { label: "إجمالي الصفقات", value: tenders.length, hint: "كل صفقات الجهة", icon: BriefcaseBusiness, section: "current-tenders" as Section },
    { label: "المسودات", value: tenders.filter(item => item.status === "draft").length, hint: "تحتاج مراجعة أو نشر", icon: FilePlus2, section: "planning" as Section, status: "draft" },
    { label: "منشورة", value: tenders.filter(item => item.status === "published").length, hint: "متاحة للمتعاملين", icon: Gavel, section: "publication-reception" as Section, status: "published" },
    { label: "مغلقة", value: tenders.filter(item => item.status === "closed").length, hint: "جاهزة لبدء التقييم", icon: ClipboardList, section: "opening-evaluation" as Section, status: "closed" },
    { label: "قيد التقييم", value: tenders.filter(item => item.status === "evaluation").length, hint: "تتطلب مراجعة العروض", icon: CheckCircle2, section: "opening-evaluation" as Section, status: "evaluation" },
    { label: "مسندة", value: tenders.filter(item => item.status === "awarded").length, hint: "قرارات مسجلة", icon: CheckCircle2, section: "awards" as Section, status: "awarded" },
    { label: "ملغاة", value: tenders.filter(item => item.status === "cancelled").length, hint: "قرارات إلغاء مسجلة", icon: XCircle, section: "awards" as Section, status: "cancelled" },
  ];
  return <PortalStatGrid>{metrics.map(metric => <Tooltip key={metric.label}><TooltipTrigger asChild><div className="h-full"><PortalStatCard label={metric.label} value={metric.value} hint={`${metric.hint} · عرض التفاصيل`} icon={metric.icon} tone={metric.status === "cancelled" ? "red" : metric.status === "closed" || metric.status === "evaluation" ? "amber" : metric.status === "awarded" || metric.status === "published" ? "green" : "navy"} onClick={() => onDrillDown(metric.section, metric.status)} tooltip={`افتح قائمة ${metric.label.toLowerCase()} بالتصفية المناسبة`} /></div></TooltipTrigger><TooltipContent side="top" sideOffset={8}>افتح قائمة {metric.label.toLowerCase()} بالتصفية المناسبة</TooltipContent></Tooltip>)}</PortalStatGrid>;
}

export function AuthorityTenderList({ tenders, section, statusFilter, onSelectSection }: { tenders: any[]; section: Section; statusFilter?: string; onSelectSection: (section: Section) => void }) {
  const filtered = useMemo(() => {
    if (statusFilter) return tenders.filter(item => item.status === statusFilter);
    if (section === "planning") return tenders.filter(item => item.status === "draft");
    if (section === "opening-evaluation") return tenders.filter(item => item.status === "closed" || item.status === "evaluation");
    if (section === "awards") return tenders.filter(item => item.status === "awarded" || item.status === "cancelled" || item.status === "evaluation");
    return tenders;
  }, [section, statusFilter, tenders]);
  if (!tenders.length) return <StateBlock type="empty" title="لا توجد صفقات بعد" description="أنشئ أول صفقة من إجراء الإنشاء، وستظهر هنا بعد حفظها كمسودة." />;
  if (!filtered.length) return <StateBlock type="empty" title="لا توجد نتائج في هذا القسم" description="لا توجد صفقة بالحالة المطلوبة حالياً. يمكنك العودة إلى قائمة الصفقات أو إنشاء مسودة جديدة." />;
  return <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader className="flex flex-row items-center justify-between"><div><div className="flex flex-wrap items-center gap-3"><CardTitle className="text-lg text-[#092e49]">{statusFilter ? `الصفقات · ${statusLabels[statusFilter] || statusFilter}` : section === "planning" ? "البرمجة والتخطيط" : section === "opening-evaluation" ? "فتح وتقييم العروض" : section === "awards" ? "المنح والإسناد والنتائج" : "الصفقات / المشاريع الجارية"}</CardTitle><span className="rounded-full bg-[#e8f3ee] px-3 py-1 text-xs font-bold tabular-nums text-[#0d8062]">{filtered.length} صفقة</span></div><p className="mt-1 text-sm text-slate-400">بيانات صفقات الجهة الحالية فقط · اختر صفقة لفتح مسارها</p></div><Button type="button" variant="outline" size="sm" onClick={() => onSelectSection("current-tenders")}>عرض الكل</Button></CardHeader><CardContent className="space-y-3">{filtered.map(tender => { const nextSection: Section = tender.status === "draft" ? "planning" : tender.status === "closed" || tender.status === "evaluation" ? "opening-evaluation" : tender.status === "awarded" || tender.status === "cancelled" ? "awards" : "current-tenders"; const actionLabel = tender.status === "draft" ? "فتح التخطيط" : tender.status === "closed" || tender.status === "evaluation" ? "فتح التقييم" : tender.status === "awarded" || tender.status === "cancelled" ? "فتح النتائج" : "فتح الصفقة"; return <button type="button" key={tender.id} onClick={() => onSelectSection(nextSection)} className="w-full rounded-2xl border border-slate-100 p-4 text-right transition duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:border-[#b8e5d1] hover:bg-[#fbfefd] focus-visible:ring-2 focus-visible:ring-[#0d8062]"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="text-xs font-bold text-[#0d8062]">{tender.reference}</div><div className="mt-1 font-bold text-[#092e49]">{tender.title}</div><div className="mt-2 text-xs text-slate-400">{tender.category} · آخر أجل {formatDate(tender.deadline)}</div></div><div className="flex items-center gap-3"><div className="text-left text-sm font-semibold text-[#092e49]">{formatAmount(tender.budget)}</div><TenderStatusBadge status={tender.status} /><ChevronLeft className="h-4 w-4 text-slate-400" /></div></div><div className="mt-3 text-xs font-bold text-[#0d8062]">{actionLabel} ←</div></button>; })}</CardContent></Card>;
}

const authorityAlertCopy: Record<string, { label: string; style: string }> = {
  success: { label: "مكتمل", style: "bg-emerald-50 text-emerald-700" },
  warning: { label: "يتطلب متابعة", style: "bg-amber-50 text-amber-700" },
  info: { label: "تحديث", style: "bg-blue-50 text-blue-700" },
};

function AuthorityOperationalAlerts({ compact = false, onOpenAlerts }: { compact?: boolean; onOpenAlerts?: () => void }) {
  const utils = trpc.useUtils();
  const input = useMemo(() => ({ limit: compact ? 4 : 30 }), [compact]);
  const alerts = trpc.authority.alerts.list.useQuery(input, { refetchInterval: 15_000 });
  const markRead = trpc.authority.alerts.markRead.useMutation({ onSuccess: () => void utils.authority.alerts.list.invalidate() });
  const markAllRead = trpc.authority.alerts.markAllRead.useMutation({ onSuccess: () => void utils.authority.alerts.list.invalidate() });
  useEffect(() => {
    const source = new EventSource("/api/notifications/stream");
    const refresh = () => void utils.authority.alerts.list.invalidate();
    source.addEventListener("notifications", refresh);
    return () => source.close();
  }, [utils]);
  if (alerts.isLoading) return <StateBlock type="loading" title="جاري تحميل إشعارات المصلحة" description="نراجع التحديثات التشغيلية المرتبطة بحساب المصلحة فقط." />;
  if (alerts.isError) return <StateBlock type="error" title="تعذر تحميل الإشعارات" description="حاول إعادة المحاولة. لا يؤثر ذلك في إجراءات الصفقات المحمية." />;
  const items = alerts.data?.items ?? [];
  return <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2 text-lg text-[#092e49]"><BellRing className="h-5 w-5 text-[#0d8062]" /> الإشعارات التشغيلية {alerts.data?.unreadCount ? <span className="rounded-full bg-[#0d8062] px-2 py-0.5 text-xs text-white">{alerts.data.unreadCount}</span> : null}</CardTitle><p className="mt-1 text-sm leading-6 text-slate-500">تحديثات حقيقية عن اعتماد الحساب وتغيرات حالة الصفقات.</p></div><div className="flex items-center gap-2">{Boolean(alerts.data?.unreadCount) && <Tooltip><TooltipTrigger asChild><Button type="button" variant="outline" size="sm" disabled={markAllRead.isPending} onClick={() => markAllRead.mutate()}>تعليم الكل</Button></TooltipTrigger><TooltipContent side="bottom">تمييز الإشعارات الحالية كمقروءة</TooltipContent></Tooltip>}{compact && <Button type="button" variant="outline" size="sm" onClick={onOpenAlerts}>عرض الكل</Button>}</div></CardHeader><CardContent>{!items.length ? <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-500">لا توجد تحديثات تشغيلية بعد. ستظهر هنا الإشعارات الناتجة عن إجراءات حقيقية داخل المنصة.</div> : <div className="space-y-3">{items.map((alert: any) => { const meta = authorityAlertCopy[alert.severity] ?? authorityAlertCopy.info; return <button type="button" key={alert.id} onClick={() => !alert.readAt && markRead.mutate({ alertId: alert.id })} className={`w-full rounded-2xl border p-4 text-right transition duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:border-[#b8e5d1] focus-visible:ring-2 focus-visible:ring-[#0d8062] ${alert.readAt ? "border-slate-100 bg-white" : "border-[#b8e5d1] bg-[#f7fcf9]"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="font-bold text-[#092e49]">{alert.title}</span>{!alert.readAt && <span className="h-2 w-2 rounded-full bg-[#0d8062]" aria-label="غير مقروء" />}</div><p className="mt-1 text-sm leading-6 text-slate-600">{alert.message}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.style}`}>{meta.label}</span></div><div className="mt-3 flex items-center gap-1 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" />{new Date(alert.createdAt).toLocaleString(activeLocale())}</div></button>; })}</div>}</CardContent></Card>;
}

function AuthorityTimelineInsights({ tenders, onDrillDown }: { tenders: any[]; onDrillDown: (section: Section, status?: string) => void }) {
  const { isEnglish } = useLocale();
  // This timeline is presentation-only; server-side procedures remain the source of enforcement time.
  const now = new Date().getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const datedTenders = useMemo(() => tenders
    .filter(tender => tender.status !== "cancelled" && tender.deadline && !Number.isNaN(new Date(tender.deadline).getTime()))
    .map(tender => ({ ...tender, deadlineTime: new Date(tender.deadline).getTime() }))
    .sort((a, b) => a.deadlineTime - b.deadlineTime), [tenders]);
  const upcoming = datedTenders.filter(tender => tender.deadlineTime >= now && ["published", "closed", "evaluation"].includes(tender.status));
  const critical = datedTenders.filter(tender => tender.deadlineTime < now || tender.deadlineTime - now <= 7 * dayMs).slice(0, 5);
  const daysUntil = (timestamp: number) => Math.ceil((timestamp - now) / dayMs);
  const deadlineLabel = (timestamp: number) => {
    const days = daysUntil(timestamp);
    if (days < 0) return isEnglish ? `Overdue by ${Math.abs(days)} day(s)` : `متأخر منذ ${Math.abs(days)} يوم`;
    if (days === 0) return isEnglish ? "Due today" : "يستحق اليوم";
    return isEnglish ? `Due in ${days} day(s)` : `يستحق خلال ${days} يوم`;
  };
  const renderTender = (tender: any, criticalItem = false) => {
    const isOverdue = daysUntil(tender.deadlineTime) < 0;
    const tone = criticalItem && isOverdue ? "bg-red-50 text-red-700" : criticalItem ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
    return <button type="button" key={tender.id} onClick={() => onDrillDown(tender.status === "draft" ? "planning" : "current-tenders", tender.status)} className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-right transition duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:border-[#b8e5d1] focus-visible:ring-2 focus-visible:ring-[#0d8062]">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-xs font-bold text-[#0d8062]">{tender.reference || (isEnglish ? "Tender" : "صفقة")}</div><div className="mt-1 truncate font-bold text-[#092e49]">{tender.title}</div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{deadlineLabel(tender.deadlineTime)}</span></div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{formatDate(tender.deadline)}</div>
    </button>;
  };
  return <div className="grid gap-6 xl:grid-cols-2" aria-label={isEnglish ? "Tender timeline insights" : "مؤشرات الجدول الزمني للصفقات"}><Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2 text-lg text-[#092e49]"><CalendarClock className="h-5 w-5 text-[#0d8062]" />{isEnglish ? "Upcoming tenders" : "الصفقات القادمة"}</CardTitle><p className="mt-1 text-sm leading-6 text-slate-500">{isEnglish ? "Published and active tenders with a recorded deadline." : "الصفقات المنشورة والنشطة التي لها تاريخ نهاية مسجل."}</p></div><span className="rounded-full bg-[#eef8f3] px-3 py-1 text-xs font-bold text-[#0d8062]">{upcoming.length}</span></CardHeader><CardContent>{!upcoming.length ? <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-500">{isEnglish ? "No upcoming tender deadlines are recorded yet." : "لا توجد مواعيد صفقات قادمة مسجلة حالياً."}</div> : <div className="space-y-3">{upcoming.slice(0, 4).map(tender => renderTender(tender))}</div>}</CardContent></Card><Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2 text-lg text-[#092e49]"><CircleAlert className="h-5 w-5 text-amber-600" />{isEnglish ? "Critical dates" : "التواريخ الحرجة"}</CardTitle><p className="mt-1 text-sm leading-6 text-slate-500">{isEnglish ? "Overdue or due within the next seven days." : "مواعيد متأخرة أو تستحق خلال الأيام السبعة القادمة."}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{critical.length}</span></CardHeader><CardContent>{!critical.length ? <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-500">{isEnglish ? "No critical dates require attention right now." : "لا توجد تواريخ حرجة تتطلب المتابعة حالياً."}</div> : <div className="space-y-3">{critical.map(tender => renderTender(tender, true))}</div>}</CardContent></Card></div>;
}

function AuthorityActivitySummary({ tenders, onDrillDown }: { tenders: any[]; onDrillDown: (section: Section) => void }) {
  const recent = useMemo(() => [...tenders].sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime()).slice(0, 4), [tenders]);
  return <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle className="text-lg text-[#092e49]">ملخص النشاط</CardTitle><p className="mt-1 text-sm text-slate-500">آخر تغييرات مسجلة على صفقات جهتك.</p></div><Tooltip><TooltipTrigger asChild><Button type="button" variant="outline" size="sm" onClick={() => onDrillDown("current-tenders")}>كل الصفقات</Button></TooltipTrigger><TooltipContent side="bottom">افتح القائمة الكاملة للصفقات</TooltipContent></Tooltip></CardHeader><CardContent>{!recent.length ? <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-500">لا توجد أنشطة للعرض بعد. عند إنشاء أول صفقة أو تغيير حالتها، سيظهر ملخصها هنا.</div> : <div className="space-y-3">{recent.map(tender => <button type="button" key={tender.id} onClick={() => onDrillDown(tender.status === "draft" ? "planning" : tender.status === "closed" || tender.status === "evaluation" ? "opening-evaluation" : tender.status === "awarded" || tender.status === "cancelled" ? "awards" : "current-tenders")} className="w-full rounded-2xl border border-slate-100 p-4 text-right transition duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:border-[#b8e5d1] focus-visible:ring-2 focus-visible:ring-[#0d8062]"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-bold text-[#0d8062]">{tender.reference}</div><div className="mt-1 font-bold text-[#092e49]">{tender.title}</div></div><TenderStatusBadge status={tender.status} /></div><div className="mt-3 text-xs text-slate-400">آخر تحديث: {tender.updatedAt || tender.createdAt ? new Date(tender.updatedAt ?? tender.createdAt).toLocaleString(activeLocale()) : "—"}</div></button>)}</div>}</CardContent></Card>;
}

function AuthorityAccountSummary({ tenders, onDrillDown }: { tenders: any[]; onDrillDown: (section: Section, status?: string) => void }) {
  const pendingActions = tenders.filter(tender => tender.status === "draft" || tender.status === "closed" || tender.status === "evaluation").length;
  const accountState = "مفعّل";
  const accountHint = "الدور معتمد والصلاحيات محكومة من الخادم";
  return <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#092e49] via-[#0d5c79] to-[#0d8062] text-white shadow-[0_18px_50px_rgba(9,46,73,.16)]"><CardContent className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-5"><div><div className="flex items-center gap-2 text-xs font-bold tracking-[.16em] text-[#b8e5d1]"><ShieldCheck className="h-4 w-4" aria-hidden="true" />حالة الحساب</div><div className="mt-2 flex items-center gap-3"><h2 className="text-2xl font-black">{accountState}</h2><span className="rounded-full bg-[#b8e5d1] px-3 py-1 text-xs font-bold text-[#092e49]">متاح للعمل</span></div><p className="mt-2 text-sm leading-7 text-white/70">{accountHint}</p></div><div className="grid min-w-[220px] grid-cols-2 gap-3"><button type="button" onClick={() => onDrillDown("planning", "draft")} className="rounded-2xl border border-white/15 bg-white/10 p-4 text-right transition duration-200 motion-reduce:transition-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-[#b8e5d1]"><div className="text-xs text-white/65">طلبات تحتاج إجراء</div><div className="mt-2 text-3xl font-black">{pendingActions}</div><div className="mt-1 text-[11px] text-white/60">مسودات أو تقييمات</div></button><button type="button" onClick={() => onDrillDown("current-tenders")} className="rounded-2xl border border-white/15 bg-white/10 p-4 text-right transition duration-200 motion-reduce:transition-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-[#b8e5d1]"><div className="text-xs text-white/65">إجمالي الصفقات</div><div className="mt-2 text-3xl font-black">{tenders.length}</div><div className="mt-1 text-[11px] text-white/60">سجلات الجهة الحالية</div></button></div></div></CardContent></Card>;
}

export function AuthorityHome({ tenders, userKey, onDrillDown }: { tenders: any[]; userKey?: string | number | null; onDrillDown: (section: Section, status?: string) => void }) {
  const hasTender = tenders.length > 0;
  const hasPublished = tenders.some(tender => tender.status === "published" || tender.status === "closed" || tender.status === "evaluation" || tender.status === "awarded");
  return <div className="space-y-6"><AuthorityAccountSummary tenders={tenders} onDrillDown={onDrillDown} /><ContextualOnboarding role="authority" userKey={userKey} title="جولة قصيرة: ابدأ بإدارة صفقتك" description="ثلاث خطوات عملية تساعدك على فهم مساحة المصلحة المتعاقدة والوصول إلى الإجراءات الأكثر استخداماً." steps={[{ id: "create", label: "أنشئ صفقة جديدة", description: "اجمع البيانات المدعومة واحفظ الصفقة من مسار دفتر الشروط الحالي.", complete: hasTender, actionLabel: "إنشاء صفقة", onAction: () => onDrillDown("tender-documents") }, { id: "planning", label: "راجع التخطيط", description: "افتح المسودات الحالية وراجعها قبل نشر الصفقة.", complete: tenders.some(tender => tender.status === "draft"), actionLabel: "فتح التخطيط", onAction: () => onDrillDown("planning") }, { id: "publish", label: "تابع النشر", description: "بعد اكتمال البيانات، استخدم إجراء النشر المحمي على الخادم.", complete: hasPublished, actionLabel: "فتح النشر", onAction: () => onDrillDown("publication-reception") }]} /> <div className="rounded-[28px] bg-[#092e49] p-7 text-white shadow-[0_18px_50px_rgba(9,46,73,.16)]"><div className="flex flex-wrap items-end justify-between gap-6"><div><div className="text-xs font-bold tracking-[.18em] text-[#b8e5d1]">مساحة المصلحة المتعاقدة</div><h1 className="mt-3 text-3xl font-black tracking-tight lg:text-4xl">لوحة قيادة الصفقات</h1><p className="mt-3 max-w-2xl leading-8 text-white/65">تابع صفقات جهتك، انتقل مباشرة إلى الحالات التي تحتاج إجراءً، واترك القرارات التنفيذية للعمليات المحمية على الخادم.</p></div><Tooltip><TooltipTrigger asChild><Button type="button" className="bg-[#b8e5d1] text-[#092e49] hover:bg-white" onClick={() => onDrillDown("tender-documents")}>إنشاء صفقة جديدة <FilePlus2 className="mr-2 h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="bottom">أنشئ مسودة صفقة جديدة ضمن صلاحيات الجهة</TooltipContent></Tooltip></div></div><AuthorityKpiStrip tenders={tenders} onDrillDown={onDrillDown} /><AuthorityTimelineInsights tenders={tenders} onDrillDown={onDrillDown} /><div className="grid gap-6 xl:grid-cols-2"><AuthorityActivitySummary tenders={tenders} onDrillDown={onDrillDown} /><AuthorityOperationalAlerts compact onOpenAlerts={() => onDrillDown("alerts")} /></div><AuthorityTenderList tenders={tenders} section="current-tenders" onSelectSection={onDrillDown} /></div>;
}

const auditActionLabels: Record<string, string> = {
  bid_opening_attempted: "محاولة فتح الأظرفة",
  bid_opened: "فتح العروض",
  opening_minutes_generated: "توليد محضر الفتح",
  opening_minutes_sealed: "ختم محضر الفتح",
  opening_committee_member_appointed: "تعيين عضو لجنة",
  opening_committee_member_revoked: "سحب عضوية لجنة",
};

function OpeningMinutesDetail({ minutes, opening, tenderTitle, currentUserId, onSign, signing }: { minutes: any; opening: any; tenderTitle: string; currentUserId?: number; onSign: () => void; signing: boolean }) {
  const content = minutes?.content ?? {};
  const events = Array.isArray(minutes?.events) ? minutes.events : [];
  const committee = Array.isArray(opening?.committee) ? opening.committee : [];
  const signatures = Array.isArray(minutes?.signatures) ? minutes.signatures : [];
  const signedUserIds = new Set(signatures.map((signature: any) => signature.userId));
  const currentMember = committee.find((member: any) => member.userId === currentUserId);
  const quorum = Math.max(2, Math.ceil(committee.length / 2));
  const isApproved = minutes?.approvalStatus === "approved";
  const actionLabel = (action: string) => auditActionLabels[action] ?? action;
  const exportPdf = () => {
    document.body.classList.add("printing-opening-minutes");
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => document.body.classList.remove("printing-opening-minutes"), 500);
    }, 0);
  };
  const eventSummary = (event: any) => {
    if (!event.metadata) return event.result === "success" ? "اكتملت العملية بنجاح" : event.result;
    try {
      const metadata = JSON.parse(event.metadata) as Record<string, unknown>;
      const values = Object.entries(metadata).filter(([key]) => !["digest", "sessionId"].includes(key)).slice(0, 2).map(([key, value]) => `${key}: ${String(value)}`);
      return values.join(" · ") || "تم تسجيل العملية دون تفاصيل إضافية";
    } catch {
      return "تم تسجيل العملية في سجل التدقيق";
    }
  };

  return <div className="mt-5 space-y-5" aria-label="تفاصيل محضر فتح الأظرفة">
    <div className="rounded-[28px] bg-[#092e49] p-6 text-white shadow-[0_18px_50px_rgba(9,46,73,.14)]">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><div className="flex items-center gap-2 text-xs font-bold tracking-[.16em] text-[#b8e5d1]"><FileCheck2 className="h-4 w-4" /> محضر رسمي مختوم</div><h3 className="mt-3 text-2xl font-black">{tenderTitle}</h3><p className="mt-2 text-sm leading-7 text-white/65">هذا العرض للقراءة فقط. تم تثبيت محتوى المحضر رقمياً ولا يمكن تعديله من الواجهة.</p></div>
        <div className="flex flex-wrap items-center gap-2"><div className="flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-200"><ShieldCheck className="h-4 w-4" /> مختوم وغير قابل للتعديل</div><Button type="button" variant="outline" onClick={exportPdf} className="print-hide border-white/25 bg-white/10 text-white hover:bg-white/20"><Printer className="ml-2 h-4 w-4" />تصدير PDF</Button>{isApproved ? <div className="flex items-center gap-2 rounded-full bg-[#b8e5d1] px-4 py-2 text-sm font-bold text-[#092e49]"><CheckCircle2 className="h-4 w-4" /> معتمد نهائياً</div> : currentMember && <Button type="button" disabled={signing || signedUserIds.has(currentUserId)} onClick={onSign} className="bg-[#d7b56d] text-[#092e49] hover:bg-[#e7cb92]">{signing ? "جاري التوقيع..." : signedUserIds.has(currentUserId) ? "تم توقيعك" : "توقيع واعتماد"}<PenLine className="mr-2 h-4 w-4" /></Button>}</div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[{ label: "رقم الجلسة", value: String(minutes.sessionId ?? "—"), icon: Hash }, { label: "تاريخ الختم", value: minutes.sealedAt ? new Date(minutes.sealedAt).toLocaleString("ar-DZ") : "—", icon: LockKeyhole }, { label: "عدد العروض", value: String(content.submittedCount ?? 0), icon: FileCheck2 }, { label: "البصمة الرقمية", value: minutes.contentDigest ? `${String(minutes.contentDigest).slice(0, 12)}…` : "—", icon: ShieldCheck }].map(item => <div key={item.label} className="rounded-2xl border border-white/10 bg-white/8 p-4"><item.icon className="h-4 w-4 text-[#b8e5d1]" /><div className="mt-3 text-[11px] text-white/50">{item.label}</div><div className="mt-1 truncate text-sm font-bold text-white" title={item.value}>{item.value}</div></div>)}
      </div>
    </div>

    <Card className="border-0 bg-[#f7fbf9] shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="flex items-center justify-between gap-4 text-lg text-[#092e49]"><span className="flex items-center gap-2"><PenLine className="h-5 w-5 text-[#0d8062]" /> اعتماد أعضاء اللجنة</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{isApproved ? "اعتماد مكتمل" : `${signatures.length} من ${quorum} توقيعات النصاب`}</span></CardTitle><p className="text-sm leading-7 text-slate-500">يُنشئ الخادم بصمة توقيع مرتبطة بهوية العضو وبصمة المحضر. لا يصبح المحضر معتمداً نهائياً إلا بعد اكتمال النصاب.</p></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{committee.map((member: any) => { const signed = signedUserIds.has(member.userId); return <div key={member.id ?? member.userId} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3"><div><div className="font-bold text-[#092e49]">{member.userName || member.name || `عضو رقم ${member.userId}`}</div><div className="text-xs text-slate-500">{member.role === "chair" ? "رئيس اللجنة" : member.role === "secretary" ? "أمين اللجنة" : "عضو"}</div></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${signed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{signed ? "وقّع" : "بانتظار التوقيع"}</span></div>; })}</div>{signatures.length > 0 && <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2"><div>آخر توقيع: <strong className="text-[#092e49]">{new Date(signatures[signatures.length - 1].signedAt).toLocaleString("ar-DZ")}</strong></div><div>الخوارزمية: <strong className="text-[#092e49]">{signatures[0].signatureAlgorithm}</strong></div></div>}</CardContent></Card>

    <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="flex items-center gap-2 text-lg text-[#092e49]"><UserRound className="h-5 w-5 text-[#0d8062]" /> أعضاء لجنة الفتح</CardTitle><p className="text-sm leading-7 text-slate-500">الأعضاء المرتبطون بالصفقة وقت تنفيذ الجلسة.</p></CardHeader><CardContent>{committee.length ? <div className="space-y-2">{committee.map((member: any) => <div key={member.id ?? member.userId} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><div><div className="font-bold text-[#092e49]">{member.userName || member.name || `عضو رقم ${member.userId}`}</div><div className="text-xs text-slate-500">{member.role === "chair" ? "رئيس اللجنة" : member.role === "secretary" ? "أمين اللجنة" : "عضو"}</div></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">عضوية نشطة</span></div>)}</div> : <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">لا توجد بيانات أعضاء إضافية في سجل الجلسة.</div>}</CardContent></Card>
      <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="text-lg text-[#092e49]">ملخص المحضر</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-7 text-slate-600"><div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><span>وقت الخادم عند الفتح</span><strong className="text-[#092e49]">{content.serverOpenedAt ? new Date(content.serverOpenedAt).toLocaleString("ar-DZ") : "—"}</strong></div><div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><span>النصاب المعتمد</span><strong className="text-[#092e49]">{content.quorum ?? opening?.quorum ?? "—"}</strong></div><div className="flex justify-between gap-4"><span>الاستثناءات</span><strong className="text-[#092e49]">{content.exceptions?.length ? content.exceptions.join("، ") : "لا توجد"}</strong></div></CardContent></Card>
    </div>

    <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="text-lg text-[#092e49]">سجل الأحداث القابل للتدقيق</CardTitle><p className="text-sm leading-7 text-slate-500">تسلسل زمني للعمليات المسجلة على الصفقة. لا يعرض النظام محتوى العروض الحسّاس داخل السجل.</p></CardHeader><CardContent>{events.length ? <div className="relative space-y-4 pr-7 before:absolute before:right-2 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-[#b8e5d1]">{events.map((event: any) => <div key={event.id} className="relative"><span className="absolute -right-[1.52rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#0d8062] shadow-[0_0_0_3px_#dff3e8]" /><div className="rounded-2xl border border-slate-100 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-bold text-[#092e49]">{actionLabel(event.action)}</div><div className="mt-1 text-xs leading-6 text-slate-500">{eventSummary(event)}</div></div><div className="flex items-center gap-1 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" />{event.createdAt ? new Date(event.createdAt).toLocaleString("ar-DZ") : "—"}</div></div><div className="mt-3 flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">الفاعل: {event.actorRole || "غير محدد"}</span><span className={`rounded-full px-2.5 py-1 ${event.result === "success" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{event.result === "success" ? "نجاح" : event.result}</span></div></div></div>)}</div> : <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">لا توجد أحداث مرتبطة بهذه الصفقة في السجل.</div>}</CardContent></Card>
  </div>;
}

function AuthorityBidOpeningSection({ tenders }: { tenders: any[] }) {
  const [selectedTenderId, setSelectedTenderId] = useState<number | null>(null);
  const opening = trpc.bidOpening.eligibility.useQuery(selectedTenderId ?? 0, { enabled: selectedTenderId !== null });
  const minutesQuery = trpc.bidOpening.minutes.useQuery(selectedTenderId ?? 0, { enabled: Boolean(selectedTenderId && opening.data?.alreadyOpened) });
  const currentUser = trpc.auth.me.useQuery();
  const openMutation = trpc.bidOpening.open.useMutation();
  const signMutation = trpc.bidOpening.sign.useMutation();
  const eligibleTenders = tenders.filter(tender => ["published", "closed"].includes(tender.status));
  const selectedTender = eligibleTenders.find(tender => tender.id === selectedTenderId);
  const sessionMinutes = minutesQuery.data?.content as { submittedCount?: number; openedBids?: Array<{ bidId: number }>; exceptions?: string[] } | undefined;
  const committeeMemberIds = opening.data?.committee?.map((member: { userId: number }) => member.userId) ?? [];
  useEffect(() => { if (openMutation.isSuccess || signMutation.isSuccess) { void opening.refetch(); void minutesQuery.refetch(); } }, [openMutation.isSuccess, signMutation.isSuccess]);

  if (!eligibleTenders.length) return <StateBlock type="empty" title="لا توجد صفقات جاهزة لجلسة الفتح" description="تظهر هنا الصفقات المنشورة أو المغلقة فقط عندما تكون مملوكة لهذه الجهة." />;
  return <div className="space-y-5">
    <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]">
      <CardHeader><CardTitle className="text-lg text-[#092e49]">جلسة فتح العروض</CardTitle><p className="text-sm leading-7 text-slate-500">يُحسم توقيت الفتح والصلاحية على الخادم، ولا تكشف الشاشة تفاصيل العرض قبل أهلية الفتح.</p></CardHeader>
      <CardContent className="grid gap-3">
        {eligibleTenders.map(tender => <button type="button" key={tender.id} onClick={() => setSelectedTenderId(tender.id)} className={`rounded-2xl border p-4 text-right transition ${selectedTenderId === tender.id ? "border-[#0d8062] bg-[#f2faf6]" : "border-slate-100 hover:border-[#b8e5d1]"}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-bold text-[#0d8062]">{tender.reference}</div><div className="mt-1 font-bold text-[#092e49]">{tender.title}</div></div><TenderStatusBadge status={tender.status} /></div><div className="mt-2 text-xs text-slate-400">موعد الفتح: {new Date(tender.deadline).toLocaleString("ar-DZ")}</div></button>)}
      </CardContent>
    </Card>
    {selectedTenderId !== null && <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]">
      <CardContent className="space-y-4 p-6">
        {opening.isLoading && <StateBlock type="loading" title="جاري التحقق من أهلية الفتح" description="يتم التحقق باستخدام وقت الخادم وصلاحية المستخدم." />}
        {opening.isError && <StateBlock type="error" title="تعذر تحميل جلسة الفتح" description="حاول مرة أخرى. لا يتم كشف بيانات العروض عند فشل التحقق." />}
        {opening.data && <>
          <div><div className="text-xs font-bold text-[#0d8062]">{opening.data.reference}</div><h2 className="mt-1 text-xl font-black text-[#092e49]">{selectedTender?.title || opening.data.title}</h2></div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">موعد الفتح المعتمد من الخادم: <strong className="text-[#092e49]">{new Date(opening.data.scheduledAt).toLocaleString("ar-DZ")}</strong><br />وقت الخادم الحالي: <strong className="text-[#092e49]">{new Date(opening.data.serverNow).toLocaleString("ar-DZ")}</strong></div>
          {opening.data.alreadyOpened && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-7 text-emerald-800"><strong>تم فتح العروض بنجاح.</strong><br />عدد العروض التي سجلها المحضر: {sessionMinutes?.submittedCount ?? 0}. لا يمكن إعادة العملية.</div>}
          {!opening.data.alreadyOpened && opening.data.status === "before_opening" && <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-7 text-amber-800">لم يحل موعد الفتح بعد. سيبقى زر الفتح غير متاح حتى يسمح وقت الخادم بالعملية.</div>}
          {!opening.data.alreadyOpened && opening.data.status === "no_submitted_bids" && <div className="space-y-3"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">لا توجد عروض مقدمة جاهزة للفتح. يمكن إنشاء محضر فتح بعدد صفر وفق وقت الخادم بعد اعتماد اللجنة وتحقيق النصاب.</div><Button type="button" disabled={openMutation.isPending || committeeMemberIds.length < (opening.data.quorum ?? 2)} onClick={() => openMutation.mutate({ tenderId: selectedTenderId, committeeMemberIds })} className="bg-[#0d8062] text-white hover:bg-[#0a6d53]">{openMutation.isPending ? "جاري إنشاء المحضر..." : "إنشاء محضر فتح بعدد صفر"}</Button></div>}
          {!opening.data.alreadyOpened && opening.data.status === "opening_available" && <div className="space-y-3"><div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-blue-800">الفتح متاح الآن وفق وقت الخادم. عدد العروض المقدمة: {opening.data.submittedCount}. النصاب المطلوب: {opening.data.quorum}. ستنتقل العروض المقدمة إلى حالة قيد المراجعة وسيُحفظ محضر مختوم.</div><Button type="button" disabled={openMutation.isPending || committeeMemberIds.length < (opening.data.quorum ?? 2)} onClick={() => openMutation.mutate({ tenderId: selectedTenderId, committeeMemberIds })} className="bg-[#0d8062] text-white hover:bg-[#0a6d53]">{openMutation.isPending ? "جاري تنفيذ الفتح..." : "فتح العروض وإنشاء المحضر"}</Button></div>}
          {openMutation.isError && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-800">{openMutation.error.message || "تعذر تنفيذ فتح العروض. لم تتغير بيانات العروض."}</div>}
          {openMutation.isSuccess && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-7 text-emerald-800">تم فتح العروض وإنشاء محضر الفتح وتسجيل العملية في سجل التدقيق.</div>}
                     {opening.data.alreadyOpened && opening.data.session && <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-7 text-slate-600"><div className="font-bold text-[#092e49]">محضر الفتح المختوم</div><div>تاريخ ووقت الفتح: {opening.data.session.openedAt ? new Date(opening.data.session.openedAt).toLocaleString("ar-DZ") : "غير متاح"}</div><div>العروض المقبولة للفتح: {sessionMinutes?.openedBids?.length ?? 0}</div><div>الاستثناءات: {sessionMinutes?.exceptions?.length ? sessionMinutes.exceptions.join("، ") : "لا توجد"}</div></div>}
           {minutesQuery.isLoading && opening.data.alreadyOpened && <StateBlock type="loading" title="جاري تحميل المحضر والسجل" description="يتم جلب النسخة المختومة والأحداث المرتبطة بها من الخادم." />}
           {minutesQuery.isError && opening.data.alreadyOpened && <StateBlock type="error" title="تعذر تحميل تفاصيل المحضر" description="تحقق من عضويتك في اللجنة أو أعد المحاولة لاحقاً." />}
           {minutesQuery.data && opening.data.alreadyOpened && <><OpeningMinutesDetail minutes={minutesQuery.data} opening={opening.data} tenderTitle={selectedTender?.title || opening.data.title} currentUserId={currentUser.data?.id} onSign={() => signMutation.mutate({ tenderId: selectedTenderId })} signing={signMutation.isPending} />{signMutation.isError && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-800">{signMutation.error.message || "تعذر تسجيل التوقيع. لم يتغير المحضر."}</div>}{signMutation.isSuccess && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-7 text-emerald-800">تم تسجيل توقيعك ببصمة مرتبطة بالمحضر. سيظهر الاعتماد النهائي بعد اكتمال النصاب.</div>}</>}

        </>}
      </CardContent>
    </Card>}
  </div>;
}

function AuthorityContractsSection() {
  const { isEnglish } = useLocale();
  const utils = trpc.useUtils();
  const contracts = trpc.authority.contracts.list.useQuery();
  const transitionStatus = trpc.authority.contracts.transitionStatus.useMutation({
    onSuccess: () => {
      toast.success(isEnglish ? "Contract status updated" : "تم تحديث حالة العقد");
      void utils.authority.contracts.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  if (contracts.isLoading) return <StateBlock type="loading" title={isEnglish ? "Loading contracts" : "جاري تحميل سجل العقود"} description={isEnglish ? "Reading contracts owned by the current authority from the protected source." : "نقرأ العقود التابعة للمصلحة المتعاقدة الحالية من المصدر المحمي."} />;
  if (contracts.isError) return <div className="space-y-4"><StateBlock type="error" title={isEnglish ? "Unable to load contracts" : "تعذر تحميل سجل العقود"} description={isEnglish ? "Try again or review your authority session and permissions." : "حاول إعادة المحاولة أو راجع جلسة المصلحة وصلاحياتها."} /><Button type="button" variant="outline" onClick={() => contracts.refetch()}>{isEnglish ? "Try again" : "إعادة المحاولة"}</Button></div>;
  const items = (contracts.data ?? []) as AuthorityContract[];
  if (!items.length) return <StateBlock type="empty" title={isEnglish ? "No contracts recorded" : "لا توجد عقود مسجلة بعد"} description={isEnglish ? "A contract appears here only after an award related to a tender owned by this authority." : "يظهر العقد هنا فقط بعد إسناد مرتبط بصفقة تملكها هذه المصلحة."} />;
  return <section aria-labelledby="authority-contracts-title" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><div className="text-xs font-bold tracking-[.18em] text-[#0d8062]">{isEnglish ? "GOVERNED RECORD · FOLLOW-UP" : "سجل محكوم · العقود والمتابعة"}</div><h2 id="authority-contracts-title" className="mt-2 text-xl font-black text-[#092e49]">{isEnglish ? "Contracts and follow-up" : "العقود والمتابعة"}</h2><p className="mt-1 max-w-2xl text-sm leading-7 text-slate-500">{isEnglish ? "Only contracts created from awards owned by the current authority are shown. Status changes are validated by the server." : "تظهر فقط العقود الناتجة عن إسناد صفقات هذه المصلحة. يتحقق الخادم من كل انتقال للحالة."}</p></div>
      <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600" aria-live="polite">{items.length} {isEnglish ? "recorded contracts" : "عقد مسجل"}</div>
    </div>
    {items.map(contract => {
      const availableTransitions = authorityContractTransitions[contract.status] ?? [];
      const status = authorityContractStatusLabels[contract.status];
      const updatingThisContract = transitionStatus.isPending && transitionStatus.variables?.contractId === contract.id;
      return <Card key={contract.id} className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardContent className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="text-xs font-bold text-[#0d8062]">{contract.contractReference} · {contract.tenderReference}</div><h3 className="mt-2 text-lg font-bold text-[#092e49]">{contract.tenderTitle}</h3><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm leading-6 text-slate-500"><span>{isEnglish ? "Amount:" : "القيمة:"} <strong className="text-[#092e49]">{formatAmount(contract.amount, contract.currency)}</strong></span><span>{isEnglish ? "Awarded:" : "تاريخ الإسناد:"} {formatDate(contract.awardedAt)}</span><span>{isEnglish ? "Supplier:" : "المتعامل:"} <strong className="text-[#092e49]">{contract.supplierName || (isEnglish ? "Not specified" : "غير محدد")}</strong></span></div></div><span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${authorityContractStatusStyles[contract.status]}`}><FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />{isEnglish ? status.en : status.ar}</span></div><div className="mt-5 border-t border-slate-100 pt-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="text-xs text-slate-400">{isEnglish ? "Last record update:" : "آخر تحديث للسجل:"} {formatDate(contract.updatedAt)}</div>{availableTransitions.length ? <div className="flex flex-wrap gap-2">{availableTransitions.map(nextStatus => { const next = authorityContractStatusLabels[nextStatus]; const actionText = isEnglish ? `Set ${next.en}` : `تعيين الحالة: ${next.ar}`; return <Tooltip key={nextStatus}><TooltipTrigger asChild><Button type="button" variant="outline" size="sm" disabled={transitionStatus.isPending} onClick={() => transitionStatus.mutate({ contractId: contract.id, status: nextStatus })}>{updatingThisContract ? (isEnglish ? "Updating…" : "جاري التحديث…") : actionText}</Button></TooltipTrigger><TooltipContent side="top">{isEnglish ? `Apply the server-validated transition to ${next.en}` : `تطبيق انتقال الحالة المتحقق منه على الخادم إلى «${next.ar}»`}</TooltipContent></Tooltip>; })}</div> : <span className="text-xs font-medium text-slate-400">{isEnglish ? "No further status transitions are available." : "لا تتوفر انتقالات حالة إضافية لهذا العقد."}</span>}</div></div></CardContent></Card>;
    })}
  </section>;
}

function AuthorityArchiveSection() {
  const { isEnglish } = useLocale();
  const [downloadId, setDownloadId] = useState<number | null>(null);
  const archive = trpc.authority.archive.list.useQuery();
  const download = trpc.tenders.documents.download.useQuery(downloadId ?? 0, { enabled: Boolean(downloadId) });
  useEffect(() => {
    if (download.data?.url) {
      window.open(download.data.url, "_blank", "noopener,noreferrer");
      setDownloadId(null);
    }
  }, [download.data]);
  useEffect(() => {
    if (download.error && downloadId) {
      toast.error(download.error.message);
      setDownloadId(null);
    }
  }, [download.error, downloadId]);
  if (archive.isLoading) return <StateBlock type="loading" title={isEnglish ? "Loading documents and archive" : "جاري تحميل الوثائق والأرشيف"} description={isEnglish ? "Reading documents related to tenders owned by the current authority." : "نقرأ وثائق الصفقات التابعة للمصلحة المتعاقدة الحالية."} />;
  if (archive.isError) return <div className="space-y-4"><StateBlock type="error" title={isEnglish ? "Unable to load the archive" : "تعذر تحميل الأرشيف"} description={isEnglish ? "Try again or review your authority session and permissions." : "حاول إعادة المحاولة أو راجع جلسة المصلحة وصلاحياتها."} /><Button type="button" variant="outline" onClick={() => archive.refetch()}>{isEnglish ? "Try again" : "إعادة المحاولة"}</Button></div>;
  const items = (archive.data ?? []) as AuthorityArchiveDocument[];
  if (!items.length) return <StateBlock type="empty" title={isEnglish ? "No archived documents" : "لا توجد وثائق مؤرشفة بعد"} description={isEnglish ? "Documents will appear here after they are attached to a tender owned by this authority." : "ستظهر الوثائق هنا بعد إرفاقها بصفقة تملكها هذه المصلحة."} />;
  return <section aria-labelledby="authority-archive-title" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><div className="text-xs font-bold tracking-[.18em] text-[#0d8062]">{isEnglish ? "GOVERNED RECORD · DOCUMENTS" : "سجل محكوم · الوثائق"}</div><h2 id="authority-archive-title" className="mt-2 text-xl font-black text-[#092e49]">{isEnglish ? "Documents and archive" : "الوثائق والأرشيف"}</h2><p className="mt-1 max-w-2xl text-sm leading-7 text-slate-500">{isEnglish ? "Each document is linked to a tender owned by the authority. Downloads use a server-issued signed link." : "كل وثيقة مرتبطة بصفقة تملكها المصلحة. يُصدر الخادم رابط تنزيل موقعاً بعد التحقق من الوصول."}</p></div>
      <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600" aria-live="polite">{items.length} {isEnglish ? "recorded documents" : "وثيقة مسجلة"}</div>
    </div>
    <div className="space-y-3">{items.map(document => {
      const downloadingThisDocument = downloadId === document.id && download.isFetching;
      return <article key={document.id} className="rounded-[22px] border border-slate-100 bg-white p-4 shadow-[0_8px_24px_rgba(9,46,73,.025)] transition duration-200 hover:border-[#b7dfd1] hover:shadow-[0_12px_30px_rgba(9,46,73,.06)] motion-reduce:transition-none sm:p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#eef8f3] text-[#0d8062]"><FileText className="h-5 w-5" aria-hidden="true" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="break-all font-bold text-[#092e49]">{document.fileName}</h3><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusStyles[document.tenderStatus] ?? "bg-slate-100 text-slate-600"}`}>{isEnglish ? document.tenderStatus : (statusLabels[document.tenderStatus] ?? document.tenderStatus)}</span></div><p className="mt-1 text-sm leading-7 text-slate-500">{document.tenderReference} · {document.tenderTitle}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400"><span>{document.mimeType || (isEnglish ? "Document" : "وثيقة")}</span><span>{formatFileSize(document.sizeBytes)}</span><span>{isEnglish ? "Added:" : "أضيف في:"} {formatDate(document.createdAt)}</span></div></div></div><Tooltip><TooltipTrigger asChild><Button type="button" variant="outline" size="sm" disabled={Boolean(downloadId) || download.isFetching} onClick={() => setDownloadId(document.id)}><Download className="ml-1.5 h-4 w-4" aria-hidden="true" />{downloadingThisDocument ? (isEnglish ? "Preparing…" : "جاري التحضير…") : (isEnglish ? "Download" : "تنزيل")}</Button></TooltipTrigger><TooltipContent side="top">{isEnglish ? "Open a signed download link in a new tab" : "فتح رابط تنزيل موقّع في علامة تبويب جديدة"}</TooltipContent></Tooltip></div></article>;
    })}</div>
  </section>;
}

function AuthoritySettingsSection() {
  const { isEnglish } = useLocale();
  const profile = trpc.profile.get.useQuery();
  const [form, setForm] = useState({ organizationName: "", registrationNumber: "", phone: "", address: "" });
  const save = trpc.profile.save.useMutation({
    onSuccess: () => {
      toast.success(isEnglish ? "Institutional settings saved" : "تم حفظ إعدادات المؤسسة");
      void profile.refetch();
    },
    onError: error => toast.error(error.message),
  });
  useEffect(() => {
    if (profile.data) setForm({ organizationName: profile.data.organizationName || "", registrationNumber: profile.data.registrationNumber || "", phone: profile.data.phone || "", address: profile.data.address || "" });
  }, [profile.data]);
  if (profile.isLoading) return <StateBlock type="loading" title={isEnglish ? "Loading institutional settings" : "جاري تحميل إعدادات المؤسسة"} description={isEnglish ? "Reading the protected profile linked to the current authority." : "نقرأ الملف المحمي المرتبط بالمصلحة المتعاقدة الحالية."} />;
  if (profile.isError) return <div className="space-y-4"><StateBlock type="error" title={isEnglish ? "Unable to load institutional settings" : "تعذر تحميل إعدادات المؤسسة"} description={isEnglish ? "Try again or review your authority session and permissions." : "حاول إعادة المحاولة أو راجع جلسة المصلحة وصلاحياتها."} /><Button type="button" variant="outline" onClick={() => profile.refetch()}>{isEnglish ? "Try again" : "إعادة المحاولة"}</Button></div>;
  const completion = [form.organizationName, form.registrationNumber, form.phone, form.address].filter(value => value.trim()).length * 25;
  const updateField = (field: keyof typeof form, value: string) => setForm(current => ({ ...current, [field]: value }));
  return <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs font-bold tracking-[.18em] text-[#0d8062]">{isEnglish ? "GOVERNED PROFILE" : "ملف محكوم"}</div><CardTitle className="mt-2 text-xl text-[#092e49]">{isEnglish ? "Institutional settings" : "إعدادات المؤسسة"}</CardTitle><p className="mt-1 max-w-2xl text-sm leading-7 text-slate-500">{isEnglish ? "Maintain the institutional data used by the current authority. The server applies the same protected profile controls on every save." : "حدّث بيانات المؤسسة التي تستخدمها المصلحة الحالية. يطبق الخادم ضوابط الملف المحمي نفسها عند كل حفظ."}</p></div><div className="rounded-2xl bg-[#eef8f3] px-3 py-2 text-xs font-bold text-[#0d8062]">{isEnglish ? `Completion: ${completion}%` : `نسبة الاكتمال: ${completion}%`}</div></div></CardHeader><CardContent><form className="space-y-5" onSubmit={event => { event.preventDefault(); save.mutate({ ...form, completion }); }}><div className="grid gap-4 md:grid-cols-2"><div><Label htmlFor="authority-organization-name">{isEnglish ? "Organization name" : "اسم المؤسسة"}</Label><Input id="authority-organization-name" className="mt-2" value={form.organizationName} onChange={event => updateField("organizationName", event.target.value)} required minLength={2} /></div><div><Label htmlFor="authority-registration-number">{isEnglish ? "Registration number" : "رقم التسجيل"}</Label><Input id="authority-registration-number" className="mt-2" value={form.registrationNumber} onChange={event => updateField("registrationNumber", event.target.value)} /></div><div><Label htmlFor="authority-phone">{isEnglish ? "Phone" : "الهاتف"}</Label><Input id="authority-phone" className="mt-2" type="tel" value={form.phone} onChange={event => updateField("phone", event.target.value)} /></div><div><Label htmlFor="authority-address">{isEnglish ? "Address" : "العنوان"}</Label><Input id="authority-address" className="mt-2" value={form.address} onChange={event => updateField("address", event.target.value)} /></div></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"><p className="text-xs leading-6 text-slate-400">{isEnglish ? "The completion indicator reflects only the four fields shown above." : "يعكس مؤشر الاكتمال الحقول الأربعة المعروضة أعلاه فقط."}</p><Tooltip><TooltipTrigger asChild><Button type="submit" className="bg-[#0d8062] text-white hover:bg-[#0a6d53]" disabled={save.isPending || form.organizationName.trim().length < 2}>{save.isPending ? (isEnglish ? "Saving…" : "جاري الحفظ…") : (isEnglish ? "Save institutional settings" : "حفظ إعدادات المؤسسة")}</Button></TooltipTrigger><TooltipContent side="top">{isEnglish ? "Save the protected institutional profile" : "حفظ ملف المؤسسة المحمي"}</TooltipContent></Tooltip></div></form></CardContent></Card>;
}

export default function AuthorityWorkspace() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { isEnglish } = useLocale();
  const [section, setSection] = useState<Section>(() => sectionFromSearch(search));
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const tenders = trpc.tenders.mine.useQuery();
  const me = trpc.auth.me.useQuery();
  useEffect(() => { setSection(sectionFromSearch(search)); setStatusFilter(new URLSearchParams(search).get("status") || undefined); }, [search]);
  const drillDown = (nextSection: Section, status?: string) => {
    const params = new URLSearchParams({ section: navigationSectionFor(nextSection) });
    if (status) params.set("status", status);
    setLocation(`/app?${params.toString()}`);
  };
  const requestedNavigationSection = new URLSearchParams(search).get("section") as NavigationSection | null;
  const sectionMeta = authorityWorkflowSections.find(item => item.key === requestedNavigationSection) ?? authorityWorkflowSections.find(item => item.key === navigationSectionFor(section));
  const sectionTitle = isEnglish ? sectionMeta?.labelEn : sectionMeta?.labelAr;
  const usesTenderData = !["contracts", "archive", "alerts", "settings"].includes(section);
  if (usesTenderData && tenders.isLoading) return <StateBlock type="loading" title={isEnglish ? "Loading authority tenders" : "جاري تحميل صفقات الجهة"} description={isEnglish ? "The protected authority source is being read." : "نقرأ البيانات من المصدر المحمي للمصلحة المتعاقدة."} />;
  if (usesTenderData && tenders.isError) return <div className="space-y-6"><StateBlock type="error" title={isEnglish ? "Unable to load tenders" : "تعذر تحميل الصفقات"} description={isEnglish ? "Try again or review your authority session and permissions." : "حاول إعادة المحاولة. إذا استمر الخطأ، راجع جلسة الدخول أو صلاحية الجهة."} /><Button type="button" variant="outline" onClick={() => tenders.refetch()}>{isEnglish ? "Try again" : "إعادة المحاولة"}</Button></div>;
  const data = tenders.data || [];
  return <div className="space-y-6"><div className="flex items-center justify-between gap-4"><div><div className="text-xs font-bold tracking-[.18em] text-[#0d8062]">{isEnglish ? "CONTRACTING AUTHORITY" : "بوابة المصلحة المتعاقدة"} · {sectionTitle}</div><p className="mt-2 text-sm text-slate-500">{usesTenderData ? (isEnglish ? "Operational values are derived from tenders owned by the current authority." : "البيانات المعروضة مشتقة من صفقات المصلحة المتعاقدة الحالية.") : (isEnglish ? "This section reads only the protected records owned by the current authority." : "يقرأ هذا القسم سجلات المصلحة المتعاقدة الحالية المحمية فقط.")}</p></div><div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-slate-500 shadow-sm sm:flex"><LockKeyhole className="h-3.5 w-3.5 text-[#0d8062]" />{isEnglish ? "Server-enforced ownership" : "حماية الملكية على الخادم"}</div></div>{section === "overview" && <AuthorityHome tenders={data} userKey={me.data?.id} onDrillDown={drillDown} />}{section === "planning" && <AuthorityProgrammingPlanning onNavigate={drillDown} />}{section === "current-tenders" && <AuthorityTenderList tenders={data} section="current-tenders" statusFilter={statusFilter} onSelectSection={drillDown} />}{section === "tender-documents" && <div className="space-y-6"><AiDocumentAssistantPanel audience="authority" /><ProcurementAiWorkbench audience="authority" /><AuthorityTenderCreate onSaved={() => tenders.refetch()} /></div>}{section === "publication-reception" && <AuthorityTenderList tenders={data} section="current-tenders" statusFilter="published" onSelectSection={drillDown} />}{section === "opening-evaluation" && <div className="space-y-6"><AuthorityBidOpeningSection tenders={data} /><AuthorityTenderList tenders={data} section="opening-evaluation" statusFilter={statusFilter} onSelectSection={drillDown} /></div>}{section === "awards" && <AuthorityTenderList tenders={data} section="awards" statusFilter={statusFilter} onSelectSection={drillDown} />}{section === "contracts" && <AuthorityContractsSection />}{section === "archive" && <AuthorityArchiveSection />}{section === "alerts" && <AuthorityOperationalAlerts />}{section === "settings" && <AuthoritySettingsSection />}{section === "reports" && <div className="space-y-6"><AuthorityKpiStrip tenders={data} onDrillDown={drillDown} /><AuthorityActivitySummary tenders={data} onDrillDown={drillDown} /><AuthorityTenderList tenders={data} section="current-tenders" onSelectSection={drillDown} /></div>}</div>;
}
