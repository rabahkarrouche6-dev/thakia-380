import { Activity, ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Info, RefreshCw, Server } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/LocaleContext";
import { canReturnWithinApp } from "@/lib/safeNavigation";

const statusCopy = {
  operational: { label: "يعمل بشكل طبيعي", className: "text-emerald-700 dark:text-emerald-300", dotClassName: "bg-emerald-500" },
  degraded: { label: "أداء متأثر", className: "text-amber-700 dark:text-amber-300", dotClassName: "bg-amber-500" },
  outage: { label: "توقف رئيسي", className: "text-rose-700 dark:text-rose-300", dotClassName: "bg-rose-500" },
} as const;

const uptimeMarkers = Array.from({ length: 90 }, (_, index) => index);

export default function StatusPage() {
  const { direction, isEnglish, locale } = useLocale();
  const [, setLocation] = useLocation();
  const statusQuery = trpc.system.status.useQuery(undefined, { refetchInterval: 60_000 });
  const checkedAt = useMemo(() => {
    if (!statusQuery.data?.checkedAt) return null;
    return new Date(statusQuery.data.checkedAt).toLocaleString(locale === "en" ? "en-DZ" : "ar-DZ", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [locale, statusQuery.data?.checkedAt]);

  const overall = statusQuery.data?.overall === "operational" ? "operational" : "degraded";
  const overallCopy = statusCopy[overall];
  const serviceLabels: Record<string, string> = isEnglish
    ? { "المنصة والخادم": "Platform and server", "قاعدة البيانات": "Database", "المصادقة وتسجيل الدخول": "Authentication and sign-in", "تخزين الوثائق": "Document storage" }
    : {};
  const statusLabel = (status: keyof typeof statusCopy) => isEnglish
    ? status === "operational" ? "Operating normally" : status === "degraded" ? "Degraded performance" : "Major outage"
    : statusCopy[status].label;
  const handleBackNavigation = () => {
    if (canReturnWithinApp(document.referrer, window.location.origin, window.history.length)) {
      window.history.back();
      return;
    }

    setLocation("/");
  };

  return (
    <main dir={direction} className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBackNavigation}
                className="gap-2 border-teal-200 bg-teal-50/70 font-bold text-teal-800 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-200 dark:hover:bg-teal-950/60"
              >
                {isEnglish ? <ArrowLeft className="h-4 w-4" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                {isEnglish ? "Back" : "عودة"}
              </Button>
              <Link href="/" className="text-sm font-semibold text-teal-700 underline-offset-4 hover:underline dark:text-teal-300">
                {isEnglish ? "Smart Procurement" : "صفقات ذكية"}
              </Link>
            </div>
            <h1 className="mt-3 font-[Cairo] text-3xl font-bold tracking-tight">{isEnglish ? "Platform status" : "حالة المنصة"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              {isEnglish ? "Clear operational visibility into public services available to users, without exposing server logs or sensitive data." : "شفافية تشغيلية مبسطة حول الخدمات العامة المتاحة للمستخدمين، دون كشف سجلات الخادم أو البيانات الحساسة."}
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
            <Server className="h-8 w-8" aria-hidden="true" />
          </div>
        </header>

        <Card className="rounded-3xl border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-xl">
              <span className="flex items-center gap-3">
                {statusQuery.isLoading ? <Skeleton className="h-6 w-40" /> : statusQuery.isError ? <CircleAlert className="h-6 w-6 text-amber-600" aria-hidden="true" /> : <CheckCircle2 className={`h-6 w-6 ${overallCopy.className}`} aria-hidden="true" />}
                <span>{statusQuery.isLoading ? isEnglish ? "Checking status" : "جارٍ فحص الحالة" : statusQuery.isError ? isEnglish ? "Unable to check status" : "تعذر فحص الحالة" : overall === "operational" ? isEnglish ? "All systems are operating normally" : "كل الأنظمة تعمل بشكل طبيعي" : isEnglish ? "Some services are operating with degraded performance" : "بعض الخدمات تعمل بأداء متأثر"}</span>
              </span>
              {!statusQuery.isLoading && !statusQuery.isError && (
                <span className={`inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold dark:bg-slate-800 ${overallCopy.className}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${overallCopy.dotClassName}`} aria-hidden="true" />
                  {statusLabel(overall)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusQuery.isLoading && <div className="space-y-3" aria-label={isEnglish ? "Loading service status" : "جارٍ تحميل حالة الخدمات"}><Skeleton className="h-16 w-full rounded-2xl" /><Skeleton className="h-16 w-full rounded-2xl" /></div>}
            {statusQuery.isError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200" role="alert">
                {isEnglish ? "Unable to reach the status service right now. You can try again; if the issue persists, contact the platform administrator." : "تعذر الوصول إلى خدمة الحالة حالياً. يمكنك إعادة المحاولة، وإذا استمرت المشكلة تواصل مع مسؤول المنصة."}
              </div>
            )}
            {statusQuery.data && (
              <div className="space-y-3" aria-live="polite">
                {statusQuery.data.services.map(service => {
                  const copy = statusCopy[service.status as keyof typeof statusCopy] ?? statusCopy.degraded;
                  return (
                    <div key={service.key} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/60">
                      <span className="font-medium">{serviceLabels[service.label] ?? service.label}</span>
                      <span className={`flex items-center gap-2 text-sm font-semibold ${copy.className}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${copy.dotClassName}`} aria-hidden="true" />
                        {statusLabel(service.status as keyof typeof statusCopy)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
              <span>{checkedAt ? isEnglish ? `Last checked: ${checkedAt}` : `آخر فحص: ${checkedAt}` : isEnglish ? "Check not yet completed" : "لم يكتمل الفحص بعد"}</span>
              <Button variant="outline" className="gap-2" onClick={() => statusQuery.refetch()} disabled={statusQuery.isFetching}>
                <RefreshCw className={`h-4 w-4 ${statusQuery.isFetching ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
                {isEnglish ? "Check again" : "إعادة الفحص"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-2" aria-label={isEnglish ? "Operational transparency indicators" : "مؤشرات الشفافية التشغيلية"}>
          <Card className="rounded-3xl border-slate-200 shadow-sm dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-teal-700 dark:text-teal-300" aria-hidden="true" />{isEnglish ? "Availability record" : "سجل الجهوزية"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-black text-slate-400">{isEnglish ? "Unavailable" : "غير متاح"}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">{isEnglish ? "A 90-day percentage is not shown before a trusted historical source is enabled." : "لا نعرض نسبة 90 يوماً قبل تفعيل مصدر تاريخي موثوق."}</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">{isEnglish ? "Last 90 days" : "آخر 90 يوماً"}</span>
              </div>
              <div className="flex gap-1" aria-label={isEnglish ? "Historical availability data is unavailable" : "بيانات الجهوزية التاريخية غير متاحة"}>
                {uptimeMarkers.map(marker => <span key={marker} className="h-8 flex-1 rounded-sm bg-slate-200 dark:bg-slate-700" aria-hidden="true" />)}
              </div>
              <p className="flex items-start gap-2 text-xs leading-6 text-slate-500 dark:text-slate-400"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{isEnglish ? "The grey indicator means that the historical record is not enabled yet; it does not indicate an outage history." : "المؤشر الرمادي يعني أن السجل التاريخي لم يُفعّل بعد، وليس أنه سجل أعطال."}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-sm dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-teal-700 dark:text-teal-300" aria-hidden="true" />{isEnglish ? "AI processing indicator" : "مؤشر معالجة الذكاء الاصطناعي"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div>
                  <p className="font-bold">{isEnglish ? "Successful analyses today" : "التحليل الناجح اليوم"}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">{isEnglish ? "A public counter is unavailable because historical measurement is not connected yet." : "عداد عام غير متاح حالياً لأن القياس التاريخي لم يُوصل بعد."}</p>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 dark:border-slate-700 dark:text-slate-400">{isEnglish ? "Not measured" : "غير مقاس"}</span>
              </div>
              <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">{isEnglish ? "Available AI functions continue to operate within their permissions, but this page does not infer figures from records not intended for public display." : "تستمر وظائف الذكاء الاصطناعي المتاحة في العمل ضمن صلاحياتها، لكن هذه الصفحة لا تستنتج أرقاماً من سجلات غير مخصصة للعرض العام."}</p>
            </CardContent>
          </Card>
        </section>

        <p className="text-center text-xs leading-6 text-slate-500 dark:text-slate-400">
          {isEnglish ? "This page presents general operational status only. It does not expose server logs, user data or internal infrastructure details. The internal operations room and advanced measurement sources will be added after documented permissions and integrations are enabled." : "تعرض هذه الصفحة حالة تشغيلية عامة فقط، ولا تكشف سجلات الخادم أو بيانات المستخدمين أو تفاصيل البنية الداخلية. ستُضاف غرفة العمليات الداخلية ومصادر القياس المتقدمة بعد تفعيل الصلاحيات والتكاملات الموثقة."}
        </p>
      </div>
    </main>
  );
}
