import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Bot, CheckCircle2, FilePenLine, History, Loader2, LockKeyhole, Plus, Save, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

const fields = [
  { key: "technicalApproach", label: "المنهجية التقنية", hint: "اشرح بإيجاز كيف ستنفذ نطاق الصفقة والنتائج المنتظرة." },
  { key: "teamExperience", label: "خبرة الفريق", hint: "اذكر الخبرات ذات الصلة دون إدراج أسرار أو بيانات شخصية غير لازمة." },
  { key: "deliveryPlan", label: "خطة الإنجاز", hint: "حدد المراحل الرئيسية والآجال والموارد المقترحة." },
  { key: "complianceNotes", label: "ملاحظات المطابقة", hint: "سجل نقاط المطابقة التي تحتاج إلى مراجعة يدوية مع دفتر الشروط الرسمي." },
] as const;

type FieldKey = typeof fields[number]["key"];
type FieldValues = Record<FieldKey, string>;

const emptyFields: FieldValues = { technicalApproach: "", teamExperience: "", deliveryPlan: "", complianceNotes: "" };
const instantGuidance: Record<FieldKey, string> = {
  technicalApproach: "ابدأ بنطاق العمل والنتائج القابلة للقياس، ثم اربط كل خطوة بالموارد التي يملكها فريقك.",
  teamExperience: "اذكر مشاريع أو خبرات مماثلة قابلة للتحقق، وتجنب إدراج أرقام هويات أو بيانات شخصية لا تطلبها الصفقة.",
  deliveryPlan: "قسّم الإنجاز إلى مراحل واضحة مع مدة تقريبية ومسؤولية كل مرحلة ونقطة تحقق قابلة للمراجعة.",
  complianceNotes: "حوّل كل شرط إلى نقطة تحقق، وحدد ما يحتاج إلى وثيقة إثبات أو مراجعة بشرية قبل الإرسال.",
};

export function SupplierSmartTenderSection() {
  const docs = trpc.smartDocuments.list.useQuery({ audience: "supplier" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [task, setTask] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [activeField, setActiveField] = useState<FieldKey | null>(null);
  const [values, setValues] = useState<FieldValues>(emptyFields);
  const create = trpc.smartDocuments.create.useMutation({ onSuccess: document => { setSelectedId(document.id); setTitle(document.title); docs.refetch(); toast.success("تم إنشاء مسودة دفتر الشروط"); }, onError: error => toast.error(error.message) });
  const save = trpc.smartDocuments.saveVersion.useMutation({ onSuccess: () => { docs.refetch(); toast.success("تم حفظ إصدار جديد للمسودة"); }, onError: error => toast.error(error.message) });
  const assist = trpc.smartDocuments.requestAssistance.useMutation({ onSuccess: result => { setSuggestion(result.content); setTask(""); toast.success("تم تجهيز اقتراح استشاري للمراجعة"); }, onError: error => toast.error(error.message) });
  const submit = trpc.smartDocuments.submitForReview.useMutation({ onSuccess: () => { docs.refetch(); toast.success("أُرسلت المسودة إلى المراجعة البشرية"); }, onError: error => toast.error(error.message) });
  const selected = docs.data?.find(document => document.id === selectedId) ?? docs.data?.[0];
  const documentDetails = trpc.smartDocuments.get.useQuery({ documentId: selected?.id ?? 0 }, { enabled: Boolean(selected?.id) });
  const latestVersion = documentDetails.data?.versions?.[0];
  const completion = useMemo(() => { const validFieldCount = fields.filter(field => values[field.key].trim().length >= 20).length; return { validFieldCount, percentage: Math.round((validFieldCount / fields.length) * 100) }; }, [values]);

  const chooseDocument = (id: number) => {
    const next = docs.data?.find(document => document.id === id);
    setSelectedId(id);
    setTitle(next?.title ?? "");
    const version = documentDetails.data?.document.id === id ? documentDetails.data.versions[0] : undefined;
    if (version) {
      try { setValues({ ...emptyFields, ...(JSON.parse(version.contentJson) as { fields?: Partial<FieldValues> }).fields }); } catch { setValues(emptyFields); }
    }
  };

  const handleCreate = () => { if (title.trim().length < 2) { toast.error("أدخل عنواناً واضحاً للمسودة"); return; } create.mutate({ title: title.trim() }); };
  const handleSave = () => { if (!selected) return; save.mutate({ documentId: selected.id, fields: values, source: "human" }); };
  const handleAssist = () => { if (!selected || task.trim().length < 2) { toast.error("اختر مسودة واكتب المطلوب من المساعد"); return; } assist.mutate({ documentId: selected.id, task: task.trim(), fields: values }); };
  const handleSubmit = () => { if (!selected || !latestVersion) { toast.error("احفظ إصداراً قبل إرساله للمراجعة"); return; } submit.mutate({ documentId: selected.id, versionId: latestVersion.id }); };

  return (
    <section dir="rtl" className="space-y-6" aria-labelledby="smart-tender-title">
      <div className="rounded-[28px] bg-gradient-to-br from-[#092e49] via-[#0d5c79] to-[#0d8062] p-6 text-white shadow-[0_18px_50px_rgba(9,46,73,.16)] sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-[.16em] text-[#b8e5d1]"><Sparkles className="h-4 w-4" />ميزة مدفوعة · إعداد المستندات</div>
            <h2 id="smart-tender-title" className="mt-3 text-2xl font-black sm:text-3xl">املأ دفتر الشروط بمساعدة استشارية</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">تساعدك البوابة على تنظيم إجاباتك واقتراح صيغ أولية. لا تعتمد أي إجابة تلقائياً، ويظل دفتر الشروط الرسمي والمراجعة البشرية هما المرجع.</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm"><div className="flex items-center gap-2 font-bold"><LockKeyhole className="h-4 w-4 text-[#b8e5d1]" />مراجعة بشرية إلزامية</div><div className="mt-1 text-xs text-white/65">لا توجد قرارات أهلية أو إرسال تلقائي</div></div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]">
          <CardHeader><CardTitle className="flex items-center justify-between gap-3 text-lg text-[#092e49]"><span className="flex items-center gap-2"><History className="h-5 w-5 text-[#0d8062]" />مسوداتي</span><Badge variant="secondary">{docs.data?.length ?? 0}</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {docs.isLoading ? <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 motion-safe:animate-spin" />جاري تحميل المسودات…</div> : docs.isError ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700" role="alert">تعذر تحميل المسودات. أعد المحاولة لاحقاً.</div> : !docs.data?.length ? <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm leading-7 text-slate-500">لا توجد مسودة بعد. أنشئ مسودة لبدء تنظيم إجاباتك.</div> : docs.data.map(document => <button key={document.id} type="button" onClick={() => chooseDocument(document.id)} className={`w-full rounded-2xl border p-4 text-right transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d8062] ${selected?.id === document.id ? "border-[#0d8062] bg-[#f0f8f4]" : "border-slate-100 bg-white hover:border-[#b8e5d1]"}`}><div className="flex items-start justify-between gap-3"><div><div className="font-bold text-[#092e49]">{document.title}</div><div className="mt-1 text-xs text-slate-500">آخر إصدار {document.currentVersionNumber} · {document.status === "in_review" ? "قيد المراجعة" : "مسودة"}</div></div><Badge className="bg-[#e6f5ee] text-[#0d8062]">{document.completion}%</Badge></div></button>)}
            <div className="space-y-2 border-t border-slate-100 pt-4"><Label htmlFor="smart-document-title">عنوان المسودة الجديدة</Label><div className="flex gap-2"><Input id="smart-document-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="مثال: ملف العرض التقني — الصفقة 2026/…" maxLength={255} /><Button type="button" onClick={handleCreate} disabled={create.isPending} aria-busy={create.isPending} className="shrink-0 bg-[#092e49] hover:bg-[#0d5c79]">{create.isPending ? <Loader2 className="ml-1 h-4 w-4 motion-safe:animate-spin" /> : <Plus className="ml-1 h-4 w-4" />}{create.isPending ? "جاري الإنشاء…" : "إنشاء"}</Button></div></div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]">
          <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-lg text-[#092e49]"><FilePenLine className="h-5 w-5 text-[#0d8062]" />{selected?.title || "محرر دفتر الشروط"}</CardTitle><p className="mt-1 text-sm text-slate-500">أدخل المعلومات التي ستراجعها قبل الحفظ أو طلب المساعدة.</p></div><div className="min-w-[170px] text-left" aria-label={`اكتمال دفتر الشروط: ${completion.percentage}%`}><div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500"><span>اكتمال المسودة</span><span className="font-black text-[#0d8062]">{completion.percentage}%</span></div><div className="mt-1 text-[11px] text-slate-400">{completion.validFieldCount} من {fields.length} حقول مكتملة بشكل صحيح</div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion.percentage} aria-label="نسبة اكتمال الحقول الصحيحة"><div className="h-full rounded-full bg-[#0d8062] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${completion.percentage}%` }} /></div></div></div></CardHeader>
          <CardContent className="space-y-5">
            {!selected ? <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm leading-7 text-slate-500">أنشئ مسودة من القائمة للبدء. ستبقى البيانات مرتبطة بحسابك ولا تُعرض لمستخدمين آخرين.</div> : <>
              <div className="grid gap-4 md:grid-cols-2">{fields.map(field => <div key={field.key} className={`space-y-2 rounded-2xl border p-3 transition-colors ${activeField === field.key ? "border-[#8bcdb2] bg-[#fbfefd]" : "border-transparent"}`}><Label htmlFor={`smart-${field.key}`}>{field.label}</Label><Textarea id={`smart-${field.key}`} value={values[field.key]} onFocus={() => setActiveField(field.key)} onBlur={() => setActiveField(current => current === field.key ? null : current)} onChange={event => setValues(current => ({ ...current, [field.key]: event.target.value }))} placeholder={field.hint} rows={5} maxLength={4000} aria-describedby={`smart-${field.key}-guidance`} />{(activeField === field.key || values[field.key].trim().length === 0) && <p id={`smart-${field.key}-guidance`} className="flex items-start gap-2 text-xs leading-6 text-slate-500" role="note"><Sparkles className="mt-1 h-3.5 w-3.5 shrink-0 text-[#0d8062]" />{instantGuidance[field.key]}</p>}</div>)}</div>
              <div className="rounded-2xl border border-[#cfe3dc] bg-[#f5fbf8] p-4"><div className="flex items-start gap-3"><Bot className="mt-1 h-5 w-5 shrink-0 text-[#0d8062]" /><div className="min-w-0 flex-1"><div className="font-bold text-[#092e49]">اطلب مساعدة في حقل محدد</div><p className="mt-1 text-xs leading-6 text-slate-600">سيعود المساعد باقتراح استشاري قابل للتعديل، ولن يكتب فوق إجابتك إلا بعد مراجعتك.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input value={task} onChange={event => setTask(event.target.value)} placeholder="مثال: اقترح صياغة لخطة الإنجاز" maxLength={2000} /><Button type="button" onClick={handleAssist} disabled={assist.isPending} aria-busy={assist.isPending} className="bg-[#0d8062] hover:bg-[#095b48]">{assist.isPending ? <Loader2 className="ml-1 h-4 w-4 motion-safe:animate-spin" /> : <Sparkles className="ml-1 h-4 w-4" />}{assist.isPending ? "جاري التحليل…" : "طلب اقتراح"}</Button></div></div></div></div>
              {assist.isPending && <div className="rounded-2xl border border-[#b8e5d1] bg-white/80 p-4" role="status" aria-live="polite" aria-busy="true"><div className="flex items-center gap-3 text-sm font-semibold text-[#0d8062]"><Loader2 className="h-4 w-4 motion-safe:animate-spin" />يحلل المساعد الحقول الحالية ويجهز إرشاداً قابلاً للمراجعة…</div><div className="mt-3 space-y-2"><div className="h-2 w-4/5 rounded-full bg-[#d9eee4] motion-safe:animate-pulse" /><div className="h-2 w-3/5 rounded-full bg-[#e7f4ee] motion-safe:animate-pulse" /></div></div>}
              {suggestion && <div className="rounded-2xl border border-[#b8e5d1] bg-white p-4" role="status" aria-live="polite"><div className="flex items-center gap-2 font-bold text-[#092e49]"><Bot className="h-4 w-4 text-[#0d8062]" />الاقتراح الاستشاري — راجعه وعدّله قبل الحفظ</div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{suggestion}</p></div>}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><div className="flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 className="h-4 w-4 text-[#0d8062]" />المساعد استشاري فقط</div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={handleSave} disabled={save.isPending} aria-busy={save.isPending}>{save.isPending ? <Loader2 className="ml-1 h-4 w-4 motion-safe:animate-spin" /> : <Save className="ml-1 h-4 w-4" />}{save.isPending ? "جاري الحفظ…" : "حفظ إصدار"}</Button><Button type="button" onClick={handleSubmit} disabled={submit.isPending || !latestVersion} className="bg-[#092e49] hover:bg-[#0d5c79]"><Send className="ml-1 h-4 w-4" />إرسال للمراجعة</Button></div></div>
            </>}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
