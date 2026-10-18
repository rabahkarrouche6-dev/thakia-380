import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CircleAlert, Clock3, FileSearch, Gauge, Info, LockKeyhole, MessageSquareText, Send, Sparkles, XCircle } from "lucide-react";

type ReadinessState = "complete" | "incomplete" | "needs_review";

type ReadinessItem = {
  label: string;
  detail: string;
  state: ReadinessState;
};

export const readinessItems: ReadinessItem[] = [
  { label: "المنهجية التقنية", detail: "يتطلب وصفاً من 20 حرفاً على الأقل.", state: "complete" },
  { label: "خبرة الفريق", detail: "أضف دليلاً قابلاً للتحقق من الخبرة ذات الصلة.", state: "needs_review" },
  { label: "خطة الإنجاز", detail: "لم تُسجل مراحل التنفيذ والآجال بعد.", state: "incomplete" },
  { label: "ملاحظات المطابقة", detail: "تحتاج إلى مطابقة يدوية مع دفتر الشروط.", state: "needs_review" },
];

export const supplierAiKpis = [
  { label: "معدل استخدام المساعد", value: "غير مقاس", target: "الهدف: 60% من الملفات النشطة", icon: Sparkles, tone: "emerald" },
  { label: "زمن إكمال المسودة", value: "خط الأساس قيد القياس", target: "الهدف: خفض 20% بعد Pilot", icon: Clock3, tone: "sky" },
  { label: "مراجعة بشرية مكتملة", value: "غير مقاس", target: "المعيار: 100% من اقتراحات الإدراج", icon: LockKeyhole, tone: "amber" },
  { label: "حوادث عزل البيانات", value: "لا توجد بيانات بعد", target: "المعيار: 0 حادثة", icon: Gauge, tone: "violet" },
];

const stateCopy: Record<ReadinessState, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  complete: { label: "مكتمل", className: "bg-emerald-50 text-emerald-700", Icon: CheckCircle2 },
  incomplete: { label: "غير مكتمل", className: "bg-slate-100 text-slate-600", Icon: XCircle },
  needs_review: { label: "يحتاج مراجعة", className: "bg-amber-50 text-amber-700", Icon: CircleAlert },
};

export function SupplierAiAssistantMockup() {
  const [activeTab, setActiveTab] = useState<"assistant" | "kpis">("assistant");
  const [selectedField, setSelectedField] = useState("خطة الإنجاز");
  const [question, setQuestion] = useState("");
  const [suggestionVisible, setSuggestionVisible] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<"pending" | "accepted" | "rejected">("pending");

  const completion = useMemo(() => {
    const complete = readinessItems.filter(item => item.state === "complete").length;
    return Math.round((complete / readinessItems.length) * 100);
  }, []);

  const requestSuggestion = () => {
    if (question.trim().length > 1) setSuggestionVisible(true);
  };

  return (
    <section dir="rtl" aria-labelledby="supplier-ai-mockup-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-[.16em] text-[#0d8062]"><Sparkles className="h-4 w-4" />معاينة تجريبية · مساعد المتعامل</div>
          <h2 id="supplier-ai-mockup-title" className="mt-2 text-2xl font-black text-[#092e49]">مساعد ذكي يوضح الخطوة التالية</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">هذه معاينة غير تشغيلية لتجربة المساعد. كل الاقتراحات استشارية، وتبقى الوثائق الرسمية والمراجعة البشرية هي المرجع.</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1" role="tablist" aria-label="أقسام المعاينة">
          <button type="button" role="tab" aria-selected={activeTab === "assistant"} onClick={() => setActiveTab("assistant")} className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d8062] ${activeTab === "assistant" ? "bg-[#092e49] text-white" : "text-slate-500 hover:bg-slate-50"}`}>المساعد</button>
          <button type="button" role="tab" aria-selected={activeTab === "kpis"} onClick={() => setActiveTab("kpis")} className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d8062] ${activeTab === "kpis" ? "bg-[#092e49] text-white" : "text-slate-500 hover:bg-slate-50"}`}>مؤشرات النجاح</button>
        </div>
      </div>

      {activeTab === "assistant" ? <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]">
          <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-lg text-[#092e49]"><FileSearch className="h-5 w-5 text-[#0d8062]" />جاهزية الملف</CardTitle><Badge className="bg-[#e6f5ee] text-[#0d8062]">{completion}%</Badge></div><p className="text-sm leading-6 text-slate-500">حالات توضيحية مبنية على متطلبات الحقول، وليست حكماً على الأهلية.</p></CardHeader>
          <CardContent className="space-y-3">
            <div className="h-2 rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion} aria-label={`نسبة الجاهزية التجريبية ${completion}%`}><div className="h-full rounded-full bg-[#0d8062]" style={{ width: `${completion}%` }} /></div>
            {readinessItems.map(item => { const status = stateCopy[item.state]; const Icon = status.Icon; return <button type="button" key={item.label} onClick={() => setSelectedField(item.label)} className={`w-full rounded-2xl border p-3 text-right transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d8062] ${selectedField === item.label ? "border-[#8bcdb2] bg-[#f5fbf8]" : "border-slate-100 hover:border-[#b8e5d1]"}`}><div className="flex items-center justify-between gap-3"><span className="font-bold text-[#092e49]">{item.label}</span><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${status.className}`}><Icon className="h-3.5 w-3.5" />{status.label}</span></div><p className="mt-1 text-xs leading-6 text-slate-500">{item.detail}</p></button>; })}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg text-[#092e49]"><MessageSquareText className="h-5 w-5 text-[#0d8062]" />مساعد الحقل: {selectedField}</CardTitle><p className="text-sm leading-6 text-slate-500">اكتب سؤالاً أو اطلب توضيحاً، ثم راجع المقترح قبل إدراجه.</p></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-[#cfe3dc] bg-[#f5fbf8] p-4"><div className="flex items-start gap-3"><Info className="mt-1 h-5 w-5 shrink-0 text-[#0d8062]" /><p className="text-sm leading-7 text-slate-600">مثال: اطلب من المساعد ترتيب مراحل التنفيذ أو تحديد المعلومات الناقصة، دون أن يضيف بيانات غير موجودة.</p></div></div>
            <div className="flex flex-col gap-2 sm:flex-row"><input value={question} onChange={event => setQuestion(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0d8062] focus:ring-2 focus:ring-[#b8e5d1]" placeholder="مثال: ما المعلومات الناقصة في خطة الإنجاز؟" aria-label="سؤال المساعد" /><Button type="button" onClick={requestSuggestion} className="bg-[#0d8062] hover:bg-[#095b48]"><Send className="ml-1 h-4 w-4" />طلب اقتراح</Button></div>
            {suggestionVisible && <div className="rounded-2xl border border-[#b8e5d1] bg-white p-4" role="status" aria-live="polite"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-bold text-[#092e49]"><Sparkles className="h-4 w-4 text-[#0d8062]" />اقتراح تجريبي قابل للمراجعة</div><Badge variant="outline" className="border-amber-200 text-amber-700">استشاري فقط</Badge></div><p className="mt-3 text-sm leading-7 text-slate-600">قسّم خطة الإنجاز إلى مراحل، وحدد المدة والمسؤولية ونقطة التحقق لكل مرحلة. أضف فقط المعلومات التي يمكن إثباتها من وثائق المؤسسة.</p><div className="mt-4 flex flex-wrap gap-2"><Button type="button" size="sm" onClick={() => setReviewStatus("accepted")} variant={reviewStatus === "accepted" ? "default" : "outline"}>{reviewStatus === "accepted" ? "تم وضعه للمراجعة" : "إدراج بعد المراجعة"}</Button><Button type="button" size="sm" variant="ghost" onClick={() => setReviewStatus("rejected")}>{reviewStatus === "rejected" ? "تم رفض الاقتراح" : "رفض"}</Button></div></div>}
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-500"><LockKeyhole className="h-4 w-4 shrink-0 text-[#0d8062]" />لا يتم اعتماد الاقتراح أو إرساله تلقائياً، وتُسجل المراجعة البشرية عند الاستخدام الفعلي.</div>
          </CardContent>
        </Card>
      </div> : <div className="grid gap-4 sm:grid-cols-2">{supplierAiKpis.map(({ label, value, target, icon: Icon, tone }) => <Card key={label} className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-[#092e49]">{label}</p><p className="mt-3 text-xl font-black text-[#0d5c79]">{value}</p><p className="mt-2 text-xs leading-6 text-slate-500">{target}</p></div><div className={`grid h-10 w-10 place-items-center rounded-2xl ${tone === "emerald" ? "bg-emerald-50 text-emerald-700" : tone === "sky" ? "bg-sky-50 text-sky-700" : tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-violet-50 text-violet-700"}`}><Icon className="h-5 w-5" /></div></div></CardContent></Card>)}</div>}
    </section>
  );
}
