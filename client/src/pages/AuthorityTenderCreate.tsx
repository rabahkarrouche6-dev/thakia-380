import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, FilePlus2, FileText, Loader2, Save, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import AuthorityRfpAdvisor from "./AuthorityRfpAdvisor";
import { useLocale } from "@/contexts/LocaleContext";

type TenderForm = {
  title: string;
  description: string;
  category: string;
  location: string;
  budget: string;
  deadline: string;
};

type Step = 1 | 2 | 3;

const emptyForm: TenderForm = {
  title: "",
  description: "",
  category: "",
  location: "",
  budget: "",
  deadline: "",
};

const toDateInputValue = (value: Date | string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const formFromTender = (tender: any): TenderForm => ({
  title: tender.title ?? "",
  description: tender.description ?? "",
  category: tender.category ?? "",
  location: tender.location ?? "",
  budget: tender.budget == null ? "" : String(tender.budget),
  deadline: toDateInputValue(tender.deadline),
});

const readFileAsBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error("تعذر قراءة الوثيقة"));
  reader.readAsDataURL(file);
});

function fieldError(form: TenderForm, field: keyof TenderForm) {
  if (field === "title" && form.title.trim().length < 4) return "العنوان مطلوب، وبحد أدنى 4 أحرف.";
  if (field === "description" && form.description.trim().length < 12) return "الوصف مطلوب، وبحد أدنى 12 حرفاً.";
  if (field === "category" && form.category.trim().length < 2) return "الفئة مطلوبة.";
  if (field === "deadline") {
    if (!form.deadline) return "الموعد النهائي مطلوب.";
    if (new Date(form.deadline).getTime() <= Date.now()) return "يجب أن يكون الموعد في المستقبل.";
  }
  if (field === "budget" && form.budget && (!/^\d+$/.test(form.budget) || Number(form.budget) <= 0)) return "أدخل ميزانية صحيحة موجبة بالدينار الجزائري.";
  return "";
}

function validateStep(form: TenderForm, step: Step) {
  const fields: Array<keyof TenderForm> = step === 1 ? ["title", "description", "category"] : step === 2 ? ["budget", "deadline"] : ["title", "description", "category", "budget", "deadline"];
  return fields.reduce<Record<string, string>>((errors, field) => {
    const error = fieldError(form, field);
    if (error) errors[field] = error;
    return errors;
  }, {});
}

export default function AuthorityTenderCreate({ onSaved }: { onSaved?: () => void }) {
  const { locale, direction } = useLocale();
  const t = (arabic: string, english: string) => locale === "en" ? english : arabic;
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<TenderForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tenderId, setTenderId] = useState<number | null>(null);
  const [savedReference, setSavedReference] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const documents = trpc.tenders.documents.list.useQuery(tenderId ?? 0, { enabled: Boolean(tenderId) });
  const createTender = trpc.tenders.create.useMutation();
  const updateTender = trpc.tenders.update.useMutation();
  const publishTender = trpc.tenders.publish.useMutation();
  const uploadDocument = trpc.tenders.documents.upload.useMutation();
  const busy = createTender.isPending || updateTender.isPending || publishTender.isPending || uploadDocument.isPending;

  const payload = useMemo(() => ({
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    location: form.location.trim() || undefined,
    budget: form.budget ? Number(form.budget) : undefined,
    deadline: new Date(form.deadline),
  }), [form]);

  const updateField = (field: keyof TenderForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: "" }));
    setNotice(null);
  };

  const goToStep = (nextStep: Step) => {
    if (nextStep > step) {
      const nextErrors = validateStep(form, step);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
    }
    setStep(nextStep);
    setNotice(null);
  };

  const uploadPendingDocuments = async (savedId: number) => {
    for (const file of pendingFiles) {
      const dataBase64 = await readFileAsBase64(file);
      await uploadDocument.mutateAsync({ tenderId: savedId, document: { fileName: file.name, mimeType: file.type || "application/pdf", dataBase64 } });
    }
    if (pendingFiles.length) {
      setPendingFiles([]);
      await documents.refetch();
    }
  };

  const saveDraft = async (): Promise<number | null> => {
    const nextErrors = validateStep(form, 3);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStep(nextErrors.title || nextErrors.description || nextErrors.category ? 1 : 2);
      return null;
    }
    try {
      const result = tenderId
        ? await updateTender.mutateAsync({ id: tenderId, data: payload })
        : await createTender.mutateAsync(payload);
      const savedId = result?.id ?? tenderId;
      if (savedId) setTenderId(savedId);
      if (result?.reference) setSavedReference(result.reference);
      if (savedId) await uploadPendingDocuments(savedId);
      setNotice({ type: "success", text: tenderId ? "تم تحديث المسودة والوثائق بنجاح." : "تم حفظ الصفقة كمسودة بنجاح." });
      toast.success(tenderId ? "تم تحديث المسودة" : "تم إنشاء المسودة");
      onSaved?.();
      return savedId ?? null;
    } catch (error: any) {
      const message = error?.message || "تعذر حفظ المسودة. تحقق من البيانات أو الجلسة ثم أعد المحاولة.";
      setNotice({ type: "error", text: message });
      toast.error(message);
      return null;
    }
  };

  const publish = async () => {
    const confirmed = window.confirm("هل تؤكد نشر هذه الصفقة؟ بعد النشر لا يمكن تعديلها من هذا المسار.");
    if (!confirmed) return;
    const savedId = await saveDraft();
    if (!savedId) return;
    try {
      await publishTender.mutateAsync(savedId);
      setNotice({ type: "success", text: "تم نشر الصفقة بنجاح، وأصبحت جاهزة للعرض وفق صلاحيات النظام." });
      toast.success("تم نشر الصفقة");
      onSaved?.();
    } catch (error: any) {
      const message = error?.message || "تعذر النشر. نفّذ الخادم التحقق النهائي من الملكية والحالة.";
      setNotice({ type: "error", text: message });
      toast.error(message);
    }
  };

  const reset = () => {
    setForm(emptyForm);
    setStep(1);
    setErrors({});
    setTenderId(null);
    setSavedReference(null);
    setPendingFiles([]);
    setNotice(null);
  };

  return <div dir={direction} className="space-y-6">
    <div className="rounded-[28px] bg-[#092e49] p-7 text-white shadow-[0_18px_50px_rgba(9,46,73,.16)]">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div><div className="text-xs font-bold tracking-[.18em] text-[#b8e5d1]">{t("مسار عمل محمي", "PROTECTED WORKFLOW")}</div><h1 className="mt-3 text-3xl font-black">{t("إنشاء صفقة جديدة", "Create a new tender")}</h1><p className="mt-3 max-w-2xl leading-8 text-white/70">{t("أكمل المعلومات الفعلية للصفقة، راجع الملخص، ثم اختر الحفظ كمسودة أو النشر بعد التأكيد.", "Complete the tender’s live information, review the summary, then save a draft or publish after confirmation.")}</p></div>
        <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80">{savedReference ? `${t("المرجع", "Reference")}: ${savedReference}` : t("لم تُحفظ بعد", "Not saved yet")}</div>
      </div>
    </div>

    <div className="grid gap-3 md:grid-cols-3">{( [
      [1, t("المعلومات الأساسية", "Core details"), t("بيانات التعريف", "Identification data")], [2, t("الميزانية والموعد", "Budget and deadline"), t("القيمة الزمنية", "Financial and time details")], [3, t("المراجعة والنشر", "Review and publish"), t("تأكيد الإجراء", "Confirm the action")],
    ] as Array<[Step, string, string]>).map(([number, label, hint]) => <button type="button" key={number} onClick={() => goToStep(number as Step)} className={`rounded-2xl border p-4 text-right transition ${step === number ? "border-[#0d8062] bg-[#f2faf6] shadow-sm" : "border-slate-200 bg-white hover:border-[#b8e5d1]"}`}><div className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black ${step === number ? "bg-[#0d8062] text-white" : "bg-slate-100 text-slate-500"}`}>{step > number ? <Check className="h-4 w-4" /> : number}</span><span><span className="block font-bold text-[#092e49]">{label}</span><span className="text-xs text-slate-400">{hint}</span></span></div></button>)}</div>

    {notice && <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm leading-7 ${notice.type === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}><span className="mt-1">{notice.type === "error" ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</span><span>{notice.text}</span></div>}

    {step === 1 && <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="text-xl text-[#092e49]">{t("المعلومات الأساسية", "Core details")}</CardTitle><p className="text-sm text-slate-500">{t("هذه الحقول مطلوبة أو مدعومة مباشرة في نموذج Tender الحالي.", "These fields are required or directly supported by the current Tender model.")}</p></CardHeader><CardContent className="grid gap-5 md:grid-cols-2"><label className="space-y-2 md:col-span-2"><span className="text-sm font-bold text-[#092e49]">{t("عنوان الصفقة", "Tender title")} *</span><Input value={form.title} onChange={event => updateField("title", event.target.value)} placeholder={t("مثال: اقتناء تجهيزات مكتبية", "Example: office equipment procurement")} aria-invalid={Boolean(errors.title)} />{errors.title && <span className="text-xs text-red-600">{errors.title}</span>}</label><label className="space-y-2 md:col-span-2"><span className="text-sm font-bold text-[#092e49]">{t("الوصف", "Description")} *</span><Textarea value={form.description} onChange={event => updateField("description", event.target.value)} placeholder={t("اكتب وصفاً واضحاً لنطاق الصفقة", "Describe the scope of the tender clearly")} rows={6} aria-invalid={Boolean(errors.description)} />{errors.description && <span className="text-xs text-red-600">{errors.description}</span>}</label><label className="space-y-2"><span className="text-sm font-bold text-[#092e49]">{t("الفئة", "Category")} *</span><Input value={form.category} onChange={event => updateField("category", event.target.value)} placeholder={t("مثال: تجهيزات", "Example: equipment")} aria-invalid={Boolean(errors.category)} />{errors.category && <span className="text-xs text-red-600">{errors.category}</span>}</label><label className="space-y-2"><span className="text-sm font-bold text-[#092e49]">{t("الموقع", "Location")}</span><Input value={form.location} onChange={event => updateField("location", event.target.value)} placeholder={t("المكان المرتبط بالتنفيذ، إن وجد", "Place of delivery or performance, if applicable")} /></label><div className="flex justify-start pt-2 md:col-span-2"><Button type="button" className="bg-[#092e49]" onClick={() => goToStep(2)}>{t("التالي", "Next")} <ArrowLeft className="mr-2 h-4 w-4" /></Button></div></CardContent></Card>}

    {step === 2 && <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="text-xl text-[#092e49]">{t("الميزانية والموعد", "Budget and deadline")}</CardTitle><p className="text-sm text-slate-500">{t("العملة الحالية في إجراء الإنشاء هي الدينار الجزائري (DZD) ويثبتها الخادم.", "The currency for this creation flow is Algerian dinar (DZD), enforced by the server.")}</p></CardHeader><CardContent className="grid gap-5 md:grid-cols-2"><label className="space-y-2"><span className="text-sm font-bold text-[#092e49]">{t("الميزانية", "Budget")}</span><Input type="number" min="1" step="1" value={form.budget} onChange={event => updateField("budget", event.target.value)} placeholder={t("مثال: 1500000", "Example: 1500000")} aria-invalid={Boolean(errors.budget)} />{errors.budget && <span className="text-xs text-red-600">{errors.budget}</span>}</label><label className="space-y-2"><span className="text-sm font-bold text-[#092e49]">{t("العملة", "Currency")}</span><Input value={t("DZD — الدينار الجزائري", "DZD — Algerian dinar")} readOnly className="bg-slate-50" /></label><label className="space-y-2 md:col-span-2"><span className="text-sm font-bold text-[#092e49]">{t("الموعد النهائي", "Deadline")} *</span><Input type="datetime-local" value={form.deadline} onChange={event => updateField("deadline", event.target.value)} aria-invalid={Boolean(errors.deadline)} />{errors.deadline && <span className="text-xs text-red-600">{errors.deadline}</span>}</label><div className="flex flex-wrap justify-between gap-3 pt-2 md:col-span-2"><Button type="button" variant="outline" onClick={() => goToStep(1)}><ArrowRight className="ml-2 h-4 w-4" />{t("السابق", "Previous")}</Button><Button type="button" className="bg-[#092e49]" onClick={() => goToStep(3)}>{t("مراجعة الصفقة", "Review tender")} <ArrowLeft className="mr-2 h-4 w-4" /></Button></div></CardContent></Card>}

    {step === 3 && <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="text-xl text-[#092e49]">المراجعة والنشر</CardTitle><p className="text-sm text-slate-500">راجع الحقول الحقيقية قبل الحفظ أو النشر. يمكنك العودة إلى أي خطوة للتعديل.</p></CardHeader><CardContent><div className="divide-y rounded-2xl border border-slate-100">{[
      [t("العنوان", "Title"), form.title, 1], [t("الوصف", "Description"), form.description, 1], [t("الفئة", "Category"), form.category, 1], [t("الموقع", "Location"), form.location || t("غير محدد", "Not specified"), 1], [t("الميزانية", "Budget"), form.budget ? `${new Intl.NumberFormat(locale === "en" ? "en-DZ" : "fr-FR").format(Number(form.budget))} DZD` : t("غير محددة", "Not specified"), 2], [t("الموعد النهائي", "Deadline"), form.deadline ? new Date(form.deadline).toLocaleString(locale === "en" ? "en-DZ" : "ar-DZ") : t("غير محدد", "Not specified"), 2],
    ].map(([label, value, target]) => <div key={String(label)} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start"><span className="w-36 shrink-0 text-sm font-bold text-slate-500">{label}</span><span className="flex-1 whitespace-pre-wrap text-sm leading-7 text-[#092e49]">{String(value)}</span><button type="button" onClick={() => goToStep(target as Step)} className="text-xs font-bold text-[#0d8062] hover:underline">تعديل</button></div>)}</div><div className="mt-5 rounded-2xl border border-[#dbe8ee] bg-[#f8fbfc] p-4"><div className="flex items-center gap-2 font-bold text-[#092e49]"><FileText className="h-4 w-4 text-[#0d8062]" />وثائق الصفقة</div><p className="mt-2 text-sm leading-7 text-slate-600">أضف ملفات PDF أو Word أو Excel. تحفظ الوثائق عبر التخزين المؤسسي وتصبح متاحة للمتعاملين بعد النشر.</p><Input className="mt-3" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" multiple onChange={event => setPendingFiles(Array.from(event.target.files ?? []))} /><div className="mt-3 space-y-2 text-sm">{pendingFiles.map(file => <div key={file.name} className="rounded-lg bg-white px-3 py-2 text-slate-600">{file.name}</div>)}{documents.isLoading && tenderId && <div className="text-slate-500">جارٍ تحميل الوثائق المحفوظة…</div>}{documents.data?.map(document => <div key={document.id} className="rounded-lg bg-white px-3 py-2 text-slate-600">{document.fileName} <span className="text-xs text-slate-400">(محفوظة)</span></div>)}</div></div><div className="mt-5 rounded-2xl border border-[#dbe8ee] bg-[#f8fbfc] p-4 text-sm leading-7 text-slate-600"><strong className="text-[#092e49]">الحالة الحالية:</strong> {tenderId ? "مسودة محفوظة ويمكن تحديثها أو نشرها." : "لم تُحفظ بعد؛ سيؤدي أول حفظ إلى إنشاء مسودة على الخادم."}</div><div className="mt-5"><AuthorityRfpAdvisor tenderId={tenderId} /></div><div className="mt-6 flex flex-wrap justify-between gap-3"><Button type="button" variant="outline" onClick={() => goToStep(2)}><ArrowRight className="ml-2 h-4 w-4" />العودة للتعديل</Button><div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={saveDraft} disabled={busy}><Save className="ml-2 h-4 w-4" />{tenderId ? "حفظ التعديلات" : "حفظ كمسودة"}</Button><Button type="button" onClick={publish} disabled={busy} className="bg-[#0d8062] hover:bg-[#0a6b52]"><Send className="ml-2 h-4 w-4" />تأكيد والنشر</Button></div></div>{busy && <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />جارٍ تنفيذ الإجراء المحمي على الخادم…</div>}{tenderId && <Button type="button" variant="ghost" onClick={reset} className="mt-4 text-slate-500">بدء صفقة أخرى <FilePlus2 className="mr-2 h-4 w-4" /></Button>}</CardContent></Card>}
  </div>;
}
