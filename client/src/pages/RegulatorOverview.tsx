import { AlertCircle, BarChart3, FileCheck2, RefreshCw, ShieldAlert, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocale, type Locale } from "@/contexts/LocaleContext";
import { PortalStatCard } from "@/components/PortalStatCard";

const statusLabel: Record<string, string> = {
  draft: "مسودة",
  published: "منشورة",
  closed: "مغلقة",
  evaluation: "قيد التقييم",
  awarded: "مسندة",
  cancelled: "ملغاة",
};

const statusColor: Record<string, string> = {
  draft: "#94a3b8",
  published: "#0d8062",
  closed: "#d97706",
  evaluation: "#0d5c79",
  awarded: "#13734f",
  cancelled: "#dc2626",
};

function MetricCard({ label, value, detail, icon: Icon, tone = "blue" }: { label: string; value: number; detail: string; icon: typeof BarChart3; tone?: "blue" | "green" | "amber" }) {
  return <div className="tabular-nums"><PortalStatCard label={label} value={value} hint={detail} icon={Icon} tone={tone === "blue" ? "navy" : tone} /></div>;
}

function LoadingOverview() {
  return <div aria-label="جاري تحميل المؤشرات" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <Card key={index} className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardContent className="animate-pulse p-5"><div className="h-4 w-28 rounded bg-slate-200" /><div className="mt-5 h-9 w-16 rounded bg-slate-200" /><div className="mt-4 h-3 w-36 rounded bg-slate-100" /></CardContent></Card>)}</div>;
}

function StatusDistributionChart({ counts, locale }: { counts: Record<string, number>; locale: Locale }) {
  const labels: Record<string, string> = locale === "en"
    ? { draft: "Draft", published: "Published", closed: "Closed", evaluation: "Under evaluation", awarded: "Awarded", cancelled: "Cancelled" }
    : statusLabel;
  const chartData = Object.entries(counts).map(([status, count]) => ({ status, label: statusLabel[status] ?? status, count })).sort((a, b) => b.count - a.count);

  return <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="text-base text-[#092e49]">{locale === "en" ? "Tender status distribution" : "توزيع حالات الصفقات"}</CardTitle><p className="mt-1 text-sm text-slate-400">{locale === "en" ? "Tenders by their live recorded status" : "عدد الصفقات حسب الحالة المسجلة فعلياً"}</p></CardHeader><CardContent>{chartData.length === 0 ? <div className="flex min-h-56 items-center justify-center rounded-2xl bg-slate-50 px-6 text-center text-sm leading-6 text-slate-400">{locale === "en" ? "No tender statuses are available for the chart yet." : "لا توجد حالات صفقات متاحة للرسم بعد."}</div> : <div dir={locale === "en" ? "ltr" : "rtl"} aria-label={locale === "en" ? "Tender status distribution chart" : "رسم بياني لتوزيع حالات الصفقات"} className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 18, left: 18, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" /><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} /><YAxis dataKey="label" type="category" orientation={locale === "en" ? "left" : "right"} axisLine={false} tickLine={false} tick={{ fill: "#092e49", fontSize: 12 }} width={100} /><Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", direction: locale === "en" ? "ltr" : "rtl" }} formatter={(value: number) => [locale === "en" ? `${value} tenders` : `${value} صفقة`, locale === "en" ? "Count" : "العدد"]} /><Bar dataKey="count" name={locale === "en" ? "Tenders" : "الصفقات"} radius={[6, 6, 6, 6]} barSize={28}>{chartData.map(item => <Cell key={item.status} fill={statusColor[item.status] ?? "#0d5c79"} />)}</Bar></BarChart></ResponsiveContainer></div>}</CardContent></Card>;
}

export default function RegulatorOverview() {
  const { locale } = useLocale();
  const overview = trpc.regulator.overview.useQuery();

  if (overview.isLoading) return <LoadingOverview />;

  if (overview.isError) return <Card role="alert" className="border border-red-100 bg-red-50/60 shadow-none"><CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" /><div><h2 className="font-bold text-red-900">تعذر تحميل مؤشرات المرصد</h2><p className="mt-1 text-sm leading-6 text-red-700">تحقق من الاتصال والصلاحيات ثم أعد المحاولة. لا تعرض المنصة مؤشرات غير مؤكدة.</p></div></div><Button variant="outline" className="border-red-200 bg-white text-red-800 hover:bg-red-100" onClick={() => overview.refetch()}><RefreshCw className="ml-2 h-4 w-4" />إعادة المحاولة</Button></CardContent></Card>;

  const data = overview.data;
  if (!data) return null;

  const isEmpty = data.stats.tenders === 0 && data.stats.bids === 0 && data.recentAudit.length === 0;
  if (isEmpty) return <Card className="border-dashed border-slate-200 bg-slate-50/60 shadow-none"><CardContent className="flex items-start gap-3 p-6"><ShieldAlert className="mt-0.5 h-5 w-5 text-[#0d8062]" /><div><h2 className="font-bold text-[#092e49]">لا توجد بيانات تشغيلية بعد</h2><p className="mt-1 text-sm leading-6 text-slate-500">ستظهر مؤشرات Overview عند توفر صفقات أو عروض أو أحداث تدقيق فعلية.</p></div></CardContent></Card>;

  return <section aria-labelledby="regulator-overview-title" className="space-y-5"><div className="flex items-center justify-between gap-3"><div><h2 id="regulator-overview-title" className="text-xl font-black text-[#092e49]">{locale === "en" ? "Regulatory observatory summary" : "ملخص المرصد الرقابي"}</h2><p className="mt-1 text-sm text-slate-400">{locale === "en" ? "Descriptive indicators derived from current operational data" : "مؤشرات وصفية مشتقة من البيانات التشغيلية الحالية"}</p></div><span className="text-xs font-semibold text-[#0d8062]">{locale === "en" ? "Read-only" : "قراءة فقط"}</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><MetricCard label={locale === "en" ? "Total tenders" : "إجمالي الصفقات"} value={data.stats.tenders} detail={locale === "en" ? "Across all recorded statuses" : "من جميع الحالات المسجلة"} icon={BarChart3} /><MetricCard label={locale === "en" ? "Published tenders" : "الصفقات المنشورة"} value={data.stats.published} detail={locale === "en" ? "Currently published" : "بحالة منشورة حالياً"} icon={TrendingUp} tone="green" /><MetricCard label={locale === "en" ? "Under evaluation" : "قيد التقييم"} value={data.stats.evaluation} detail={locale === "en" ? "Currently in evaluation" : "بحالة تقييم حالياً"} icon={FileCheck2} /><MetricCard label={locale === "en" ? "Recorded bids" : "العروض المسجلة"} value={data.stats.bids} detail={locale === "en" ? "Across all available bids" : "من جميع العروض الموجودة"} icon={FileCheck2} /><MetricCard label={locale === "en" ? "Activity events" : "أحداث النشاط"} value={data.stats.audits} detail={locale === "en" ? "Across the latest 8 audit entries" : "ضمن آخر 8 سجلات تدقيق"} icon={ShieldAlert} tone="amber" /></div><StatusDistributionChart counts={data.tenderStatusCounts} locale={locale} /></section>;
}
