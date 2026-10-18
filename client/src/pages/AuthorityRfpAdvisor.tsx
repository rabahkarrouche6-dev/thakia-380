import { AlertTriangle, CheckCircle2, Info, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

const severityLabel: Record<string, string> = { high: "أولوية عالية", warning: "تحتاج مراجعة", info: "ملاحظة" };
const severityClass: Record<string, string> = { high: "bg-red-50 text-red-700", warning: "bg-amber-50 text-amber-700", info: "bg-blue-50 text-blue-700" };

export default function AuthorityRfpAdvisor({ tenderId }: { tenderId: number | null }) {
  const review = trpc.authority.ai.reviewTender.useMutation();
  const audit = review.data as any;

  const runReview = async () => {
    if (!tenderId) return;
    await review.mutateAsync(tenderId);
  };

  return <Card dir="rtl" className="border border-[#b8e5d1] bg-gradient-to-br from-[#f7fcfa] to-white shadow-[0_12px_40px_rgba(13,128,98,.08)]">
    <CardHeader className="flex flex-row items-start justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[.12em] text-[#0d8062]"><Sparkles className="h-4 w-4" />مراجعة استشارية</div>
        <CardTitle className="text-lg text-[#092e49]">تدقيق أولي لدفتر الشروط</CardTitle>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">يفحص المساعد الحقول المسجلة في المسودة بحثاً عن نواقص أو صياغات تستحق مراجعة بشرية. لا يغيّر البيانات ولا يمنح اعتماداً قانونياً.</p>
      </div>
      <div className="hidden rounded-2xl bg-[#e8f3ee] p-3 text-[#0d8062] sm:block"><Sparkles className="h-5 w-5" /></div>
    </CardHeader>
    <CardContent className="space-y-4">
      {!tenderId && <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm leading-7 text-slate-600"><Info className="ml-2 inline h-4 w-4 text-slate-400" /> احفظ الصفقة كمسودة أولاً حتى يعمل التدقيق على بيانات حقيقية محفوظة على الخادم.</div>}
      {tenderId && !review.data && !review.isPending && !review.error && <div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-sm leading-7 text-slate-600">يمكنك تشغيل مراجعة استشارية عند اكتمال الحقول. النتيجة لا تمنع الحفظ أو النشر تلقائياً.</div><Button type="button" onClick={runReview} className="shrink-0 bg-[#092e49] hover:bg-[#12496b]"><Sparkles className="ml-2 h-4 w-4" />بدء التدقيق</Button></div>}
      {review.isPending && <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"><Loader2 className="h-5 w-5 animate-spin" />جارٍ تحليل المسودة وإعداد ملاحظات قابلة للمراجعة…</div>}
      {review.error && <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-800"><AlertTriangle className="mt-1 h-5 w-5 shrink-0" /><div><div className="font-bold">تعذر إتمام المراجعة</div><div>{review.error.message || "تحقق من الصلاحية واتصال الخادم ثم أعد المحاولة."}</div><Button type="button" variant="outline" onClick={runReview} className="mt-3 border-red-200 bg-white text-red-800">إعادة المحاولة</Button></div></div>}
      {audit && <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="h-5 w-5" />اكتملت المراجعة الاستشارية</div><Badge className="border-0 bg-white text-emerald-800">{audit.llmUsed ? "تحليل حقلي + لغوي" : "تحليل حقلي"}</Badge></div>
        {!audit.findings?.length && <div className="rounded-xl border border-slate-100 bg-white p-5 text-center text-sm leading-7 text-slate-600">لم تظهر ملاحظات في الحقول الحالية ضمن قواعد الفحص الأولي. يبقى استكمال دفتر الشروط ومراجعته مسؤولية الجهة المختصة.</div>}
        {audit.findings?.map((finding: any) => <div key={`${finding.code}-${finding.title}`} className="rounded-xl border border-slate-100 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-bold text-[#092e49]">{finding.title}</div><p className="mt-2 text-sm leading-7 text-slate-600">{finding.explanation}</p></div><Badge className={`shrink-0 border-0 ${severityClass[finding.severity] || severityClass.info}`}>{severityLabel[finding.severity] || "ملاحظة"}</Badge></div><div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-600"><strong>الدليل المسجل:</strong> {finding.evidence}</div><div className="mt-3 text-sm leading-7 text-[#0d8062]"><strong>المقترح:</strong> {finding.recommendation}</div></div>)}
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-7 text-amber-900"><strong>حدود الاستخدام:</strong> {audit.disclaimer}<div className="mt-2">{audit.limitations?.join(" ")}</div></div>
        <Button type="button" variant="outline" onClick={runReview} disabled={review.isPending}>إعادة تشغيل المراجعة</Button>
      </div>}
    </CardContent>
  </Card>;
}
