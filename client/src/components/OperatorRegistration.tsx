import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Save, Send, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/contexts/LocaleContext";

const steps = ["بيانات المؤسسة", "الممثل والنشاط", "الأرقام المرجعية", "الوثائق والإقرار"];
const declarationVersion = "operator-registration-v1";
const legalFormOptions = [
  { value: "مؤسسة فردية", label: "مؤسسة فردية" },
  { value: "EURL", label: "مؤسسة ذات شخص وحيد (EURL)" },
  { value: "SARL", label: "شركة ذات مسؤولية محدودة (SARL)" },
  { value: "SPA", label: "شركة ذات أسهم (SPA)" },
  { value: "SNC", label: "شركة التضامن (SNC)" },
  { value: "SCS", label: "شركة التوصية البسيطة (SCS)" },
  { value: "شركة ذات أسهم بالتوصية", label: "شركة ذات أسهم بالتوصية" },
  { value: "تعاونية", label: "تعاونية" },
  { value: "فرع شركة أجنبية", label: "فرع شركة أجنبية" },
] as const;
const documentTypes = [
  { value: "tax_card", label: "البطاقة الجبائية" },
  { value: "rc_extract", label: "مستخرج السجل التجاري" },
  { value: "identity", label: "وثيقة هوية الممثل" },
  { value: "other", label: "وثيقة أخرى" },
];

type FormState = {
  operatorType: string;
  legalForm: string;
  legalName: string;
  wilayaCode: string;
  taxCenterType: "IFU" | "RNI" | "IBS" | undefined;
  activityCodes: string;
  representativeName: string;
  representativeQuality: string;
  nif: string;
  nis: string;
  rc: string;
  taxArticle: string;
  nin: string;
  rib: string;
};

const emptyForm: FormState = { operatorType: "مؤسسة", legalForm: "", legalName: "", wilayaCode: "", taxCenterType: undefined, activityCodes: "", representativeName: "", representativeQuality: "", nif: "", nis: "", rc: "", taxArticle: "", nin: "", rib: "" };

type FieldError = string | undefined;
type TouchedFields = Partial<Record<keyof FormState, boolean>>;

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function validateField(key: keyof FormState, rawValue: string): FieldError {
  const value = rawValue.trim();
  if (["legalForm", "legalName", "representativeName", "representativeQuality", "nif", "rc"].includes(key) && !value) return "هذا الحقل مطلوب لإكمال الملف.";
  if (["legalName", "representativeName", "representativeQuality"].includes(key) && value.length < 2) return "أدخل قيمتين على الأقل حتى يظهر الاسم بصورة صحيحة.";
  if (key === "legalForm" && !legalFormOptions.some(option => option.value === value)) return "اختر شكلاً قانونياً من القائمة الجزائرية المعتمدة في هذا النموذج.";
  if (key === "wilayaCode" && value && !/^\d{2}$/.test(value)) return "أدخل رمز الولاية من رقمين فقط.";
  if (key === "nif" && !/^\d{15}$/.test(value)) return "رقم NIF يجب أن يتكون من 15 رقماً.";
  if (key === "nis" && value && !/^\d{15}$/.test(value)) return "رقم NIS يجب أن يتكون من 15 رقماً.";
  if (key === "rc" && !/^[A-Za-z0-9\u0600-\u06FF\/-]{3,}$/.test(value)) return "أدخل رقم السجل التجاري بالحروف أو الأرقام بصورة صحيحة.";
  if (key === "taxArticle" && value && !/^\d{11}$/.test(value)) return "المادة الجبائية يجب أن تتكون من 11 رقماً.";
  if (key === "nin" && value && !/^\d{18}$/.test(value)) return "رقم NIN يجب أن يتكون من 18 رقماً.";
  if (key === "rib" && value && !/^\d{20}$/.test(value)) return "رقم RIB يجب أن يتكون من 20 رقماً.";
  return undefined;
}

function validateForm(form: FormState) {
  const keys: Array<keyof FormState> = ["legalForm", "legalName", "wilayaCode", "representativeName", "representativeQuality", "nif", "nis", "rc", "taxArticle", "nin", "rib"];
  return keys.reduce<Record<string, string>>((errors, key) => {
    const error = validateField(key, String(form[key] ?? ""));
    if (error) errors[key] = error;
    return errors;
  }, {});
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("تعذر قراءة الملف"));
    reader.readAsDataURL(file);
  });
}

export default function OperatorRegistration() {
  const { direction, isEnglish } = useLocale();
  const profile = trpc.operator.get.useQuery();
  const documents = trpc.operator.documents.list.useQuery();
  const declarations = trpc.operator.declaration.list.useQuery();
  const utils = trpc.useUtils();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [hydrated, setHydrated] = useState(false);
  const [documentType, setDocumentType] = useState("tax_card");
  const [uploading, setUploading] = useState(false);
  const [accuracyAccepted, setAccuracyAccepted] = useState(false);
  const [advisoryAccepted, setAdvisoryAccepted] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>({});

  useEffect(() => {
    if (!hydrated && profile.data) {
      setForm({ operatorType: profile.data.operatorType || "مؤسسة", legalForm: profile.data.legalForm || "", legalName: profile.data.legalName || "", wilayaCode: profile.data.wilayaCode || "", taxCenterType: profile.data.taxCenterType as FormState["taxCenterType"], activityCodes: profile.data.activityCodes || "", representativeName: profile.data.representativeName || "", representativeQuality: profile.data.representativeQuality || "", nif: profile.data.nif || "", nis: profile.data.nis || "", rc: profile.data.rc || "", taxArticle: profile.data.taxArticle || "", nin: profile.data.nin || "", rib: profile.data.rib || "" });
      setHydrated(true);
    }
  }, [hydrated, profile.data]);

  const save = trpc.operator.save.useMutation({ onSuccess: () => { toast.success("تم حفظ المسودة خادمياً"); profile.refetch(); }, onError: error => toast.error(error.message) });
  const submit = trpc.operator.submit.useMutation({ onSuccess: () => { toast.success("تم إرسال الملف للمراجعة البشرية"); profile.refetch(); }, onError: error => toast.error(error.message) });
  const accept = trpc.operator.declaration.accept.useMutation({ onSuccess: () => { toast.success("تم تسجيل الإقرار"); declarations.refetch(); }, onError: error => toast.error(error.message) });
  const remove = trpc.operator.documents.delete.useMutation({ onSuccess: () => { toast.success("تم حذف الوثيقة"); documents.refetch(); }, onError: error => toast.error(error.message) });
  const upload = async (file: File) => {
    setUploading(true);
    try {
      const dataBase64 = await fileToBase64(file);
      await utils.operator.documents.list.cancel();
      await new Promise<void>((resolve, reject) => uploadMutation.mutate({ documentType, document: { fileName: file.name, mimeType: file.type || "application/octet-stream", dataBase64 } }, { onSuccess: () => resolve(), onError: reject }));
      await documents.refetch();
      toast.success("تم رفع الوثيقة بعد التحقق من نوعها وحجمها");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل رفع الوثيقة");
    } finally { setUploading(false); }
  };
  const uploadMutation = trpc.operator.documents.upload.useMutation();
  const currentProfile = profile.data;
  const hasDeclarations = (declarations.data || []).some(item => item.declarationType === "accuracy") && (declarations.data || []).some(item => item.declarationType === "advisory_only");
  const completionChecks = [
    { label: "الشكل القانوني", valid: Boolean(form.legalForm) && !validateField("legalForm", form.legalForm) },
    { label: "التسمية القانونية", valid: Boolean(form.legalName.trim()) && !validateField("legalName", form.legalName) },
    { label: "رمز الولاية", valid: Boolean(form.wilayaCode.trim()) && !validateField("wilayaCode", form.wilayaCode) },
    { label: "النظام الجبائي", valid: Boolean(form.taxCenterType) },
    { label: "اسم الممثل القانوني", valid: Boolean(form.representativeName.trim()) && !validateField("representativeName", form.representativeName) },
    { label: "صفة الممثل", valid: Boolean(form.representativeQuality.trim()) && !validateField("representativeQuality", form.representativeQuality) },
    { label: "رموز النشاط", valid: Boolean(form.activityCodes.trim()) },
    { label: "NIF", valid: Boolean(form.nif.trim()) && !validateField("nif", form.nif) },
    { label: "السجل التجاري", valid: Boolean(form.rc.trim()) && !validateField("rc", form.rc) },
    { label: "وثيقة داعمة", valid: Boolean(documents.data?.length) },
    { label: "الإقرارات", valid: hasDeclarations },
  ];
  const completedFields = completionChecks.filter(item => item.valid).length;
  const completion = Math.round((completedFields / completionChecks.length) * 100);
  const remainingFields = completionChecks.filter(item => !item.valid).map(item => item.label);
  const validationErrors = validateForm(form);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const canSubmit = Boolean(!hasValidationErrors && form.legalForm && form.legalName && form.representativeName && form.nif && form.rc && documents.data?.length && hasDeclarations);
  const savePayload = { ...form, legalForm: form.legalForm as (typeof legalFormOptions)[number]["value"] };
  const updateField = (key: keyof FormState, value: string) => {
    setForm(current => ({ ...current, [key]: key === "wilayaCode" || ["nif", "nis", "taxArticle", "nin", "rib"].includes(key) ? digitsOnly(value) : value }));
    setTouched(current => ({ ...current, [key]: true }));
  };
  const field = (key: keyof FormState, label: string, hint?: string) => {
    const error = touched[key] ? validateField(key, String(form[key] || "")) : undefined;
    const valid = touched[key] && !error && Boolean(String(form[key] || "").trim());
    return <div>
      <Label htmlFor={key}>{label}</Label>
      <div className="relative mt-2">
        <Input id={key} className={`${error ? "border-red-500 focus-visible:ring-red-500" : valid ? "border-emerald-500 focus-visible:ring-emerald-500" : ""} ${valid || error ? "pl-10" : ""}`} value={form[key] || ""} onChange={event => updateField(key, event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error || hint ? `${key}-message` : undefined} />
        {(error || valid) && <span className="absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true">{error ? <AlertCircle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}</span>}
      </div>
      {error ? <p id={`${key}-message`} role="alert" className="text-xs text-red-600 mt-1">{error}</p> : hint ? <p id={`${key}-message`} className="text-xs text-slate-400 mt-1">{hint}</p> : null}
    </div>;
  };

  return <Card dir={direction} className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)] overflow-hidden">
    <CardHeader className="bg-[#092e49] text-white"><div className="flex items-start justify-between gap-4"><div><div className="text-xs text-[#b8e5d1] font-bold tracking-[.12em]">ملف المتعامل الاقتصادي</div><CardTitle className="text-xl mt-2">استكمال البيانات قبل تقديم العروض</CardTitle><p className="text-sm text-white/65 mt-2 leading-7">هذه العملية تحفظ مسودة ملفك خادمياً. التحقق هنا شكلي، ولا يمثل اعتماداً قانونياً أو حكومياً.</p></div><ShieldCheck className="text-[#d4a017] shrink-0" /></div></CardHeader>
    <CardContent className="p-5 md:p-7 space-y-6">
      <div className="grid grid-cols-4 gap-2">{steps.map((label, index) => <button type="button" key={label} onClick={() => setStep(index)} className={`${isEnglish ? "text-left" : "text-right"} border-b-2 pb-3 text-xs md:text-sm transition-colors ${step === index ? "border-[#0d8062] text-[#092e49] font-bold" : "border-slate-100 text-slate-400"}`}><span className="block mb-1">0{index + 1}</span>{label}</button>)}</div>
      <section aria-labelledby="operator-completion-title" className="rounded-2xl border border-[#b8e5d1] bg-[#f3fbf7] p-4 md:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div><h2 id="operator-completion-title" className="text-sm font-bold text-[#092e49]">اكتمال نموذج التسجيل</h2><p className="text-xs text-slate-500 mt-1">تُحتسب النسبة من الحقول المكتملة والصحيحة فقط.</p></div>
          <strong className="text-xl text-[#0d8062]" aria-live="polite">{completion}%</strong>
        </div>
        <div role="progressbar" aria-label="نسبة اكتمال نموذج التسجيل" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion} className="h-2.5 overflow-hidden rounded-full bg-white/80">
          <div className="h-full rounded-full bg-gradient-to-l from-[#0d8062] to-[#d4a017] transition-[width] duration-300" style={{ width: `${completion}%` }} />
        </div>
        <p className="text-xs text-slate-500">اكتمل {completedFields} من {completionChecks.length} حقول أساسية.{remainingFields.length > 0 ? ` المتبقي: ${remainingFields.slice(0, 3).join("، ")}${remainingFields.length > 3 ? " وغيرها" : ""}.` : " النموذج جاهز للمراجعة."}</p>
      </section>
      {currentProfile?.status === "submitted" && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800"><CheckCircle2 className="h-4 w-4" /><AlertDescription>تم إرسال الملف. أي مراجعة لاحقة يجب أن تتم وفق إجراء بشري موثق.</AlertDescription></Alert>}
      {step === 0 && <div className="grid md:grid-cols-2 gap-4"><div><Label htmlFor="legalForm">الشكل القانوني</Label><Select value={form.legalForm || undefined} onValueChange={value => updateField("legalForm", value)}><SelectTrigger id="legalForm" className={`mt-2 ${touched.legalForm && validateField("legalForm", form.legalForm) ? "border-red-500" : touched.legalForm ? "border-emerald-500" : ""}`} aria-invalid={Boolean(touched.legalForm && validateField("legalForm", form.legalForm))}><SelectValue placeholder="اختر الشكل القانوني" /></SelectTrigger><SelectContent>{legalFormOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>{touched.legalForm && validateField("legalForm", form.legalForm) ? <p id="legalForm-message" role="alert" className="mt-1 text-xs text-red-600">{validateField("legalForm", form.legalForm)}</p> : <p id="legalForm-message" className="mt-1 text-xs text-slate-400">اختر الصيغة كما تظهر في مستخرج السجل التجاري.</p>}</div>{field("legalName", "التسمية القانونية", "كما تظهر في الوثائق الرسمية")}{field("operatorType", "طبيعة المتعامل")}{field("wilayaCode", "رمز الولاية", "رقمان فقط؛ التحقق شكلي")}{<div><Label>النظام الجبائي</Label><Select value={form.taxCenterType} onValueChange={value => setForm(current => ({ ...current, taxCenterType: value as FormState["taxCenterType"] }))}><SelectTrigger className="mt-2"><SelectValue placeholder="اختر النظام" /></SelectTrigger><SelectContent><SelectItem value="IFU">IFU</SelectItem><SelectItem value="RNI">RNI</SelectItem><SelectItem value="IBS">IBS</SelectItem></SelectContent></Select></div>}</div>}
      {step === 1 && <div className="grid gap-4">{field("representativeName", "اسم الممثل القانوني")}{field("representativeQuality", "صفة الممثل")}{<div><Label>رموز النشاط</Label><Textarea className="mt-2 min-h-24" value={form.activityCodes} onChange={event => updateField("activityCodes", event.target.value)} placeholder="أدخل الرموز أو وصف النشاط كما هو متاح لديك" /></div>}</div>}
      {step === 2 && <div className="grid md:grid-cols-2 gap-4">{field("nif", "NIF", "15 رقماً — تحقق شكلي فقط")}{field("nis", "NIS", "15 رقماً — اختياري")}{field("rc", "السجل التجاري RC", "حروف/أرقام وشرطة")}{field("taxArticle", "المادة الجبائية", "11 رقماً — اختياري")}{field("nin", "NIN", "18 رقماً — حساس واختياري")}{field("rib", "RIB", "20 رقماً — حساس واختياري")}</div>}
      {step === 3 && <div className="space-y-5"><div className="grid md:grid-cols-[1fr_180px] gap-3 items-end"><div><Label>نوع الوثيقة</Label><Select value={documentType} onValueChange={setDocumentType}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{documentTypes.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div><label className="h-10 rounded-xl bg-[#0d8062] text-white flex items-center justify-center gap-2 cursor-pointer hover:bg-[#0b6d52] transition-colors">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}رفع PDF<input className="sr-only" type="file" accept="application/pdf,.pdf" disabled={uploading} onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = ""; }} /></label></div><p className="text-xs text-slate-400">PDF فقط، حتى 5MB، وبحد أقصى 8 وثائق. لا تستخدم الاسم الأصلي كمسار تخزين.</p><div className="space-y-2">{(documents.data || []).map(document => <div key={document.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><FileText className="h-5 w-5 text-[#0d8062]" /><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-[#092e49] truncate">{document.fileName}</div><div className="text-xs text-slate-400 mt-1">{document.documentType} · {Math.round(document.sizeBytes / 1024)}KB</div></div><Badge className="bg-emerald-50 text-emerald-700 border-0">مرفوعة</Badge><Button variant="ghost" size="icon" aria-label="حذف الوثيقة" onClick={() => { if (window.confirm("هل تريد حذف هذه الوثيقة؟")) remove.mutate(document.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>)}{!documents.data?.length && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">أضف وثيقة واحدة على الأقل قبل الإرسال.</div>}</div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3"><div className="flex gap-2 items-start"><AlertCircle className="h-4 w-4 text-amber-700 mt-1" /><p className="text-sm text-amber-900 leading-7">الإقرارات التالية تحفظ كإقرار موافقة على النص المعروض، ولا تستبدل المراجعة القانونية أو التحقق من الجهات الرسمية.</p></div><label className="flex gap-2 items-start text-sm text-amber-950"><input type="checkbox" checked={accuracyAccepted} onChange={event => setAccuracyAccepted(event.target.checked)} /> أقر بأن البيانات التي أدخلتها تعكس ما لدي من مستندات، مع علمي بأن التحقق النهائي ليس آلياً.</label><label className="flex gap-2 items-start text-sm text-amber-950"><input type="checkbox" checked={advisoryAccepted} onChange={event => setAdvisoryAccepted(event.target.checked)} /> أفهم أن أدوات الذكاء الاصطناعي في المنصة إرشادية ولا تتخذ قرار أهلية أو إسناد.</label></div></div>}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 border-t border-slate-100 pt-5"><Button variant="outline" disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}>السابق</Button><div className="flex flex-col sm:flex-row gap-2"><Button variant="outline" disabled={save.isPending} onClick={() => save.mutate(savePayload)}><Save className={`${isEnglish ? "mr-2" : "ml-2"} h-4 w-4`} />حفظ المسودة</Button>{step < steps.length - 1 ? <Button className="bg-[#0d8062]" onClick={() => setStep(value => Math.min(steps.length - 1, value + 1))}>التالي</Button> : <><Button variant="outline" disabled={!accuracyAccepted || accept.isPending} onClick={async () => { if (accuracyAccepted) await new Promise<void>((resolve, reject) => accept.mutate({ declarationType: "accuracy", textVersion: declarationVersion }, { onSuccess: () => resolve(), onError: reject })); if (advisoryAccepted) await new Promise<void>((resolve, reject) => accept.mutate({ declarationType: "advisory_only", textVersion: declarationVersion }, { onSuccess: () => resolve(), onError: reject })); }}><CheckCircle2 className={`${isEnglish ? "mr-2" : "ml-2"} h-4 w-4`} />حفظ الإقرارات</Button><Button className="bg-[#092e49]" disabled={!canSubmit || submit.isPending} onClick={() => submit.mutate()}><Send className={`${isEnglish ? "mr-2" : "ml-2"} h-4 w-4`} />إرسال للمراجعة</Button></>}</div></div>      <div className="text-xs text-slate-400">اكتمال إرشادي: {completion}% · لا يعني قبولاً أو أهلية قانونية</div>
</CardContent>
  </Card>;
}
