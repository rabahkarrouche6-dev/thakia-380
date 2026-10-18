import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BarChart3, BrainCircuit, ChevronLeft, FileSearch, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useLocale } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";

type Severity = "low" | "medium" | "high";
type SeverityFilter = Severity | "all";
type LocaleKey = "ar" | "en";

const severityOrder: Severity[] = ["high", "medium", "low"];
const severityLabels = {
  ar: { low: "منخفضة", medium: "متوسطة", high: "مرتفعة" },
  en: { low: "Low", medium: "Medium", high: "High" },
} satisfies Record<LocaleKey, Record<Severity, string>>;

const severityColors: Record<Severity, string> = {
  low: "#64748b",
  medium: "#d97706",
  high: "#dc2626",
};

const severityClass: Record<Severity, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
};

const kindLabels = {
  ar: {
    collusion_signal: "إشارة نزاهة",
    rfp_observation: "تدقيق دفتر الشروط",
    tender_risk: "جودة البيانات",
  },
  en: {
    collusion_signal: "Integrity signal",
    rfp_observation: "Tender-document review",
    tender_risk: "Data quality",
  },
} as const;

function getCopy(isEnglish: boolean) {
  return isEnglish
    ? {
        title: "Smart review radar",
        description: "Explainable signals derived from recorded tender and bid data. Results are not legal findings and do not execute contracting decisions.",
        humanReview: "Mandatory human review",
        loading: "Analysing available records…",
        loadError: "The oversight radar could not be loaded. Please try again.",
        noSignals: "No signals requiring review were found in the current records.",
        noSignalsHint: "This is an honest result from the available data, not evidence that no risks exist.",
        summaryTitle: "Advisory data summary",
        summaryHint: "Live aggregation of explainable radar signals, for prioritising human review only.",
        tendersToReview: "Tenders to review",
        highPriority: "High priority",
        observationsRecorded: "Recorded observations",
        primaryLens: "Primary review lens",
        severityChart: "Priority distribution",
        severityChartHint: "Select a segment or a filter to focus the signal list.",
        kindChart: "Observations by analytical lens",
        kindChartHint: "Counts may include more than one observation per tender.",
        filter: "Filter by priority",
        allSignals: "All signals",
        signalList: "Signal list",
        signalListHint: "Tenders with reviewable observations",
        noFilteredSignals: "No tenders match this priority level.",
        observations: "observations",
        reviewDetails: "Review details",
        chooseTender: "Choose a tender from the list",
        detailsError: "The indicator details could not be loaded.",
        chooseEvidence: "Choose a tender to view its signals.",
        nextStep: "Suggested next step:",
        limitations: "Limitations:",
        noNotes: "No observations are recorded for this tender.",
        cancel: "Clear tender selection",
        summaryHigh: "high-priority tender(s) deserve timely human review.",
        summaryCalm: "No high-priority signal is currently present in the available radar data.",
        summaryFocus: "The most frequent analytical lens is",
      }
    : {
        title: "رادار المراجعة الذكية",
        description: "قرائن قابلة للتفسير مشتقة من بيانات الصفقات والعروض المسجلة. لا تمثل النتائج حكماً قانونياً ولا تنفذ قراراً تعاقدياً.",
        humanReview: "مراجعة بشرية إلزامية",
        loading: "جارٍ تحليل السجلات المتاحة…",
        loadError: "تعذر تحميل الرادار الرقابي. حاول مرة أخرى.",
        noSignals: "لا توجد قرائن تستدعي المراجعة في السجلات الحالية.",
        noSignalsHint: "هذه نتيجة صادقة من البيانات المتاحة وليست دليلاً على غياب المخاطر.",
        summaryTitle: "ملخص البيانات الاستشاري",
        summaryHint: "تجميع حيّ للقرائن القابلة للتفسير في الرادار، لترتيب المراجعة البشرية فقط.",
        tendersToReview: "صفقات للمراجعة",
        highPriority: "أولوية مرتفعة",
        observationsRecorded: "ملاحظات مسجلة",
        primaryLens: "محور المراجعة الأبرز",
        severityChart: "توزيع الأولوية",
        severityChartHint: "اختر شريحة أو مرشحاً للتركيز على قائمة الإشارات.",
        kindChart: "الملاحظات حسب محور التحليل",
        kindChartHint: "قد تضم الصفقة الواحدة أكثر من ملاحظة واحدة.",
        filter: "تصفية حسب الأولوية",
        allSignals: "كل الإشارات",
        signalList: "قائمة الإشارات",
        signalListHint: "الصفقات التي تحتوي على ملاحظات قابلة للمراجعة",
        noFilteredSignals: "لا توجد صفقات تطابق مستوى الأولوية هذا.",
        observations: "ملاحظات",
        reviewDetails: "تفاصيل المراجعة",
        chooseTender: "اختر صفقة من القائمة",
        detailsError: "تعذر تحميل تفاصيل المؤشر.",
        chooseEvidence: "اختر صفقة لعرض القرائن.",
        nextStep: "الخطوة المقترحة:",
        limitations: "القيود:",
        noNotes: "لا توجد ملاحظات مسجلة لهذه الصفقة.",
        cancel: "إلغاء اختيار الصفقة",
        summaryHigh: "صفقة/صفقات عالية الأولوية تستحق مراجعة بشرية في الوقت المناسب.",
        summaryCalm: "لا تظهر أي إشارة عالية الأولوية في بيانات الرادار المتاحة حالياً.",
        summaryFocus: "محور التحليل الأكثر تكراراً هو",
      };
}

function MetricCard({ label, value, detail, icon: Icon, tone = "blue" }: { label: string; value: string | number; detail: string; icon: typeof BarChart3; tone?: "blue" | "green" | "amber" | "red" }) {
  const palette = tone === "green" ? "bg-[#e6f5ed] text-[#11815e]" : tone === "amber" ? "bg-amber-50 text-amber-700" : tone === "red" ? "bg-red-50 text-red-700" : "bg-[#e8f0f7] text-[#0d5c79]";
  return <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><div className="text-sm text-slate-500">{label}</div><div className="mt-3 text-3xl font-black text-[#092e49]">{value}</div><div className="mt-3 text-xs leading-5 text-slate-400">{detail}</div></div><div className={`grid h-11 w-11 place-items-center rounded-2xl ${palette}`}><Icon className="h-5 w-5" /></div></div></CardContent></Card>;
}

export default function RegulatorAiPanel() {
  const { direction, locale } = useLocale();
  const isEnglish = locale === "en";
  const language = isEnglish ? "en" : "ar";
  const copy = getCopy(isEnglish);
  const severityLabel = severityLabels[language];
  const kindLabel = kindLabels[language];
  const radar = trpc.regulator.ai.radar.useQuery();
  const [selectedTenderId, setSelectedTenderId] = useState<number | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const insights = trpc.regulator.ai.insights.useQuery(
    { tenderId: selectedTenderId ?? 0 },
    { enabled: selectedTenderId !== null }
  );

  const analysis = useMemo(() => {
    const items = radar.data ?? [];
    const severityCounts = severityOrder.map(severity => ({ severity, label: severityLabel[severity], count: items.filter(item => item.highestSeverity === severity).length, fill: severityColors[severity] }));
    const kindCounts = Object.entries(kindLabel).map(([kind, label]) => ({ kind, label, count: items.reduce((total, item) => total + item.kinds.filter(itemKind => itemKind === kind).length, 0) })).filter(item => item.count > 0).sort((left, right) => right.count - left.count);
    const observationCount = items.reduce((total, item) => total + item.insightCount, 0);
    return { items, severityCounts, kindCounts, observationCount, highPriorityCount: severityCounts.find(item => item.severity === "high")?.count ?? 0, primaryKind: kindCounts[0] ?? null };
  }, [kindLabel, radar.data, severityLabel]);

  const filteredRadar = useMemo(
    () => severityFilter === "all" ? analysis.items : analysis.items.filter(item => item.highestSeverity === severityFilter),
    [analysis.items, severityFilter]
  );

  useEffect(() => {
    if (selectedTenderId === null && radar.data?.[0]) setSelectedTenderId(radar.data[0].tenderId);
  }, [radar.data, selectedTenderId]);

  const selected = useMemo(
    () => radar.data?.find(item => item.tenderId === selectedTenderId),
    [radar.data, selectedTenderId]
  );

  const selectPriority = (filter: SeverityFilter) => {
    setSeverityFilter(filter);
    const next = filter === "all" ? analysis.items[0] : analysis.items.find(item => item.highestSeverity === filter);
    if (next) setSelectedTenderId(next.tenderId);
  };

  const severityChartConfig = {
    count: { label: isEnglish ? "Tenders" : "الصفقات" },
  } satisfies ChartConfig;
  const kindChartConfig = {
    count: { label: isEnglish ? "Observations" : "الملاحظات", color: "#0d8062" },
  } satisfies ChartConfig;

  return (
    <section id="regulator-ai" className="space-y-5" dir={direction}>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 text-xs font-bold tracking-[.16em] text-[#0d8062]">{isEnglish ? "ADVISORY ANALYSIS · HUMAN REVIEW" : "تحليل استشاري · مراجعة بشرية"}</div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-[#092e49]">
            <BrainCircuit className="h-6 w-6 text-[#0d8062]" />
            {copy.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">{copy.description}</p>
        </div>
        <Badge className="w-fit rounded-full border-0 bg-[#e8f3ee] px-4 py-2 text-[#0d8062]">
          <ShieldCheck className={direction === "ltr" ? "mr-2 h-4 w-4" : "ml-2 h-4 w-4"} />
          {copy.humanReview}
        </Badge>
      </div>

      {radar.isLoading ? (
        <Card><CardContent className="flex items-center justify-center gap-3 p-8 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />{copy.loading}</CardContent></Card>
      ) : radar.isError ? (
        <Card><CardContent className="p-8 text-center text-red-600">{copy.loadError}</CardContent></Card>
      ) : !radar.data?.length ? (
        <Card className="border-dashed"><CardContent className="p-8 text-center"><FileSearch className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-[#092e49]">{copy.noSignals}</p><p className="mt-2 text-sm text-slate-500">{copy.noSignalsHint}</p></CardContent></Card>
      ) : (
        <>
          <section aria-labelledby="ai-advisory-summary" className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h3 id="ai-advisory-summary" className="flex items-center gap-2 text-lg font-black text-[#092e49]"><Sparkles className="h-5 w-5 text-[#0d8062]" />{copy.summaryTitle}</h3>
                <p className="mt-1 text-sm text-slate-400">{copy.summaryHint}</p>
              </div>
              <p className="max-w-xl rounded-xl bg-[#f7fbf8] px-3 py-2 text-xs leading-5 text-[#176345]">
                {analysis.highPriorityCount > 0 ? `${analysis.highPriorityCount} ${copy.summaryHigh}` : copy.summaryCalm}{analysis.primaryKind ? ` ${copy.summaryFocus} ${analysis.primaryKind.label}.` : ""}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label={copy.tendersToReview} value={analysis.items.length} detail={copy.signalListHint} icon={FileSearch} />
              <MetricCard label={copy.highPriority} value={analysis.highPriorityCount} detail={isEnglish ? "Highest recorded signal per tender" : "أعلى إشارة مسجلة لكل صفقة"} icon={AlertTriangle} tone="red" />
              <MetricCard label={copy.observationsRecorded} value={analysis.observationCount} detail={isEnglish ? "Across the current radar set" : "ضمن مجموعة الرادار الحالية"} icon={BarChart3} tone="amber" />
              <MetricCard label={copy.primaryLens} value={analysis.primaryKind?.label ?? "—"} detail={isEnglish ? "Most frequently observed signal type" : "نوع الإشارة الأكثر تكراراً"} icon={BrainCircuit} tone="green" />
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="text-base text-[#092e49]">{copy.severityChart}</CardTitle><p className="mt-1 text-xs text-slate-400">{copy.severityChartHint}</p></CardHeader><CardContent><ChartContainer config={severityChartConfig} aria-label={copy.severityChart} className="h-64 w-full"><PieChart><ChartTooltip content={<ChartTooltipContent hideLabel />} /><Pie data={analysis.severityCounts} dataKey="count" nameKey="label" innerRadius={54} outerRadius={82} paddingAngle={3} onClick={entry => selectPriority((entry.payload as { severity: Severity }).severity)} className="cursor-pointer">{analysis.severityCounts.map(entry => <Cell key={entry.severity} fill={entry.fill} />)}</Pie></PieChart></ChartContainer><div className="mt-2 flex flex-wrap justify-center gap-2">{analysis.severityCounts.map(item => <button key={item.severity} type="button" aria-pressed={severityFilter === item.severity} onClick={() => selectPriority(item.severity)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${severityFilter === item.severity ? "border-[#0d8062] bg-[#f0faf5] text-[#0d8062]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}><span className="me-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />{item.label} · {item.count}</button>)}</div></CardContent></Card>
              <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="text-base text-[#092e49]">{copy.kindChart}</CardTitle><p className="mt-1 text-xs text-slate-400">{copy.kindChartHint}</p></CardHeader><CardContent><ChartContainer config={kindChartConfig} aria-label={copy.kindChart} className="h-64 w-full"><BarChart data={analysis.kindCounts} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" /><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} /><YAxis dataKey="label" type="category" width={isEnglish ? 126 : 118} orientation={direction === "ltr" ? "left" : "right"} axisLine={false} tickLine={false} /><ChartTooltip content={<ChartTooltipContent hideLabel />} /><Bar dataKey="count" fill="#0d8062" radius={[6, 6, 6, 6]} barSize={28} /></BarChart></ChartContainer></CardContent></Card>
            </div>
          </section>

          <section aria-labelledby="ai-signal-list" className="space-y-4">
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"><div><h3 id="ai-signal-list" className="text-lg font-black text-[#092e49]">{copy.signalList}</h3><p className="mt-1 text-sm text-slate-400">{copy.signalListHint}</p></div><div className="flex flex-wrap gap-2" aria-label={copy.filter}><button type="button" aria-pressed={severityFilter === "all"} onClick={() => selectPriority("all")} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d8062] ${severityFilter === "all" ? "border-[#0d8062] bg-[#f0faf5] text-[#0d8062]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{copy.allSignals}</button>{severityOrder.map(severity => <button key={severity} type="button" aria-pressed={severityFilter === severity} onClick={() => selectPriority(severity)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d8062] ${severityFilter === severity ? "border-[#0d8062] bg-[#f0faf5] text-[#0d8062]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{severityLabel[severity]}</button>)}</div></div>
            <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
              <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardContent className="space-y-2 p-4">{filteredRadar.length ? filteredRadar.map(item => <button key={item.tenderId} type="button" onClick={() => setSelectedTenderId(item.tenderId)} className={`w-full rounded-2xl border p-4 text-start transition-colors ${selectedTenderId === item.tenderId ? "border-[#0d8062] bg-[#f0faf5]" : "border-slate-100 hover:bg-slate-50"}`}><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold text-[#0d8062]">{item.tenderReference}</div><div className="mt-1 text-sm font-semibold text-[#092e49]">{item.tenderTitle}</div></div><Badge className={`border-0 ${severityClass[item.highestSeverity as Severity]}`}>{severityLabel[item.highestSeverity as Severity]}</Badge></div><div className="mt-3 text-xs text-slate-400">{item.insightCount} {copy.observations} · {item.kinds.map(kind => kindLabel[kind as keyof typeof kindLabel] || kind).join(isEnglish ? ", " : "، ")}</div></button>) : <div className="p-8 text-center text-sm text-slate-400">{copy.noFilteredSignals}</div>}</CardContent></Card>
              <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="text-base text-[#092e49]">{copy.reviewDetails}</CardTitle><p className="mt-1 text-xs text-slate-400">{selected ? `${selected.tenderReference} · ${selected.tenderTitle}` : copy.chooseTender}</p></CardHeader><CardContent>{insights.isLoading ? <div className="flex justify-center p-8 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /></div> : insights.isError ? <div className="p-8 text-center text-red-600">{copy.detailsError}</div> : !insights.data ? <div className="p-8 text-center text-slate-400">{copy.chooseEvidence}</div> : <div className="space-y-4">{insights.data.insights.map((insight, index) => <div key={`${insight.kind}-${index}`} className="rounded-2xl border border-slate-100 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><Badge className="border-0 bg-[#e8f3ee] text-[#0d8062]">{kindLabel[insight.kind as keyof typeof kindLabel] || insight.kind}</Badge><h3 className="mt-3 font-bold text-[#092e49]">{insight.title}</h3></div><Badge className={`border-0 ${severityClass[insight.severity]}`}>{severityLabel[insight.severity]}</Badge></div><p className="mt-3 text-sm leading-7 text-slate-600">{insight.summary}</p><div className="mt-4 space-y-2">{insight.evidence.map(evidence => <div key={evidence.code} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><div><div className="font-semibold text-[#092e49]">{evidence.label}</div><div className="mt-1 text-slate-500">{evidence.value}</div></div></div>)}</div><div className="mt-4 rounded-xl bg-[#f7fbf8] p-3 text-sm text-[#176345]"><strong>{copy.nextStep}</strong> {insight.recommendedAction}</div><div className="mt-3 text-xs leading-6 text-slate-400">{copy.limitations} {insight.limitations.join(" ")}</div></div>)}{!insights.data.insights.length && <div className="p-8 text-center text-slate-400">{copy.noNotes}</div>}<div className="rounded-xl bg-[#092e49] p-4 text-xs leading-6 text-white/80">{insights.data.disclaimer}</div></div>}</CardContent></Card>
            </div>
          </section>
        </>
      )}

      {selected && <Button variant="ghost" className="text-[#0d8062]" onClick={() => setSelectedTenderId(null)}>{direction === "ltr" ? <ArrowRight className="mr-1 h-4 w-4" /> : <ChevronLeft className="ml-1 h-4 w-4" />}{copy.cancel}</Button>}
    </section>
  );
}
