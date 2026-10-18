import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { PortalStatCard, PortalStatGrid } from "@/components/PortalStatCard";
import { ArrowLeft, BellRing, BriefcaseBusiness, CheckCircle2, CircleAlert, CircleHelp, CircleDot, FileCheck2, FileText, FileUp, FolderOpen, LayoutDashboard, Loader2, LockKeyhole, MapPin, RotateCcw, Search, Send, SlidersHorizontal, Sparkles, Store, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import type { NavItem } from "@/components/DashboardLayout";
import { ContextualOnboarding } from "@/components/ContextualOnboarding";
import { UpgradeNotificationCenter } from "@/components/UpgradeNotificationCenter";
import { trackProductEvent } from "@/lib/analytics";
import { SupplierSmartTenderSection } from "@/components/SupplierSmartTenderSection";
import { SupplierAiAssistantMockup } from "@/components/SupplierAiAssistantMockup";
import { ProcurementAiWorkbench } from "@/components/ProcurementAiWorkbench";
import AiDocumentAssistantPanel from "@/components/AiDocumentAssistantPanel";

type SupplierSection = "home" | "opportunities" | "bids" | "profile" | "smart-documents" | "contracts" | "alerts" | "help";

const supplierLegalFormOptions = [
  { value: "مؤسسة فردية", label: "مؤسسة فردية" },
  { value: "EURL", label: "مؤسسة ذات شخص وحيد (EURL)" },
  { value: "SARL", label: "شركة ذات مسؤولية محدودة (SARL)" },
  { value: "SPA", label: "شركة ذات أسهم (SPA)" },
  { value: "SNC", label: "شركة تضامن (SNC)" },
  { value: "SCS", label: "شركة التوصية البسيطة (SCS)" },
  { value: "شركة ذات أسهم بالتوصية", label: "شركة ذات أسهم بالتوصية" },
  { value: "تعاونية", label: "تعاونية" },
  { value: "فرع شركة أجنبية", label: "فرع شركة أجنبية" },
] as const;

type Tender = {
  id: number;
  reference: string;
  title: string;
  description: string;
  category: string;
  budget: number | null;
  currency: string;
  location: string | null;
  deadline: Date | string;
  status: string;
};

type Bid = {
  id: number;
  tenderId: number;
  amount: number;
  proposal: string;
  status: string;
  submittedAt: Date | string | null;
  createdAt?: Date | string;
};

type TenderMatch = {
  tenderId: number;
  reference: string;
  title: string;
  label: "Highly Relevant" | "Relevant" | "Potential Fit" | "Low Fit" | "Not Eligible";
  matchScore: number;
  topMatchReasons: string[];
  gapAnalysis: string[];
  recommendedAction: string;
  disclaimer?: string;
  explanationVersion?: string;
  algorithmVersion?: string;
};

type SupplierContract = {
  id: number;
  tenderId: number;
  winningBidId: number;
  contractReference: string;
  amount: number;
  currency: string;
  status: "pending_signature" | "active" | "completed" | "suspended" | "terminated";
  awardedAt: Date | string;
  tenderReference: string;
  tenderTitle: string;
  tenderCategory: string;
  tenderLocation: string | null;
  decisionNotes: string | null;
  decidedAt: Date | string | null;
};

type SupplierAlert = {
  id: number;
  contractId: number | null;
  tenderId: number | null;
  type: "contract_awarded" | "contract_status" | "tender_deadline";
  severity: "success" | "info" | "warning";
  title: string;
  message: string;
  readAt: Date | string | null;
  createdAt: Date | string;
};

const statusLabels: Record<string, string> = { draft: "مسودة", submitted: "مرسل", under_review: "قيد المراجعة", accepted: "مقبول", rejected: "مرفوض" };
const statusStyles: Record<string, string> = { submitted: "bg-blue-50 text-blue-700", under_review: "bg-amber-50 text-amber-700", accepted: "bg-emerald-50 text-emerald-700", rejected: "bg-red-50 text-red-700" };
const contractStatusLabels: Record<SupplierContract["status"], string> = { pending_signature: "بانتظار التوقيع", active: "ساري", completed: "مكتمل", suspended: "معلّق", terminated: "منتهٍ" };
const contractStatusStyles: Record<SupplierContract["status"], string> = { pending_signature: "bg-amber-50 text-amber-700", active: "bg-emerald-50 text-emerald-700", completed: "bg-sky-50 text-sky-700", suspended: "bg-orange-50 text-orange-700", terminated: "bg-slate-100 text-slate-600" };
const alertAccent: Record<SupplierAlert["severity"], string> = { success: "border-emerald-200 bg-emerald-50/70", info: "border-sky-200 bg-sky-50/70", warning: "border-amber-200 bg-amber-50/70" };
const alertSeverityLabels: Record<SupplierAlert["severity"], string> = { success: "مكتمل", info: "معلومة", warning: "يتطلب الانتباه" };
const activeLocale = () => document.documentElement.lang === "en" ? "en-DZ" : "ar-DZ";
const tenderDate = (value: Date | string | null | undefined) => value ? new Date(value).toLocaleDateString(activeLocale()) : "—";
const isTenderDeadlinePassed = (value: Date | string) => new Date(value).getTime() <= Date.now();
const money = (value: number | null | undefined, currency = "DZD") => value == null ? (activeLocale() === "en-DZ" ? "Not specified" : "غير محدد") : `${new Intl.NumberFormat(activeLocale()).format(value)} ${currency === "DZD" && activeLocale() !== "en-DZ" ? "دج" : currency}`;

const supplierWorkflowSections: Array<{ key: SupplierSection; path: string; label: string; icon: typeof LayoutDashboard }> = [
  { key: "home", path: "/app?section=home", label: "الرئيسية", icon: LayoutDashboard },
  { key: "opportunities", path: "/app?section=opportunities", label: "الصفقات", icon: BriefcaseBusiness },
  { key: "bids", path: "/app?section=bids", label: "عروضي", icon: FileCheck2 },
  { key: "profile", path: "/app?section=profile", label: "ملفي ووثائقي", icon: UserRound },
  { key: "smart-documents", path: "/app?section=smart-documents", label: "دفتر الشروط الذكي", icon: Sparkles },
  { key: "contracts", path: "/app?section=contracts", label: "العقود والمتابعة", icon: FileText },
  { key: "alerts", path: "/app?section=alerts", label: "التنبيهات", icon: BellRing },
  { key: "help", path: "/app?section=help", label: "المساعدة", icon: CircleHelp },
];

export const supplierNavItems: NavItem[] = supplierWorkflowSections.map(({ label, path, icon }) => ({ label, path, icon }));

const supplierSectionFromSearch = (value: string | null): SupplierSection => {
  const knownSections = new Set<SupplierSection>(supplierWorkflowSections.map(item => item.key));
  return value && knownSections.has(value as SupplierSection) ? value as SupplierSection : "home";
};

function StateBlock({ type, title, description }: { type: "loading" | "empty" | "error"; title: string; description: string }) {
  const Icon = type === "loading" ? Loader2 : type === "error" ? CircleAlert : LockKeyhole;
  return <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-8 text-center shadow-[0_10px_30px_rgba(9,46,73,.035)] sm:p-10" role={type === "error" ? "alert" : "status"} aria-live={type === "loading" ? "polite" : undefined}><div className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl ${type === "loading" ? "bg-sky-50 text-[#0d5c79]" : type === "error" ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"}`}><Icon className={`h-5 w-5 ${type === "loading" ? "animate-spin" : ""}`} /></div><div className="mt-4 font-bold text-[#092e49]">{title}</div><p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-500">{description}</p></div>;
}

function BidStatusBadge({ status }: { status: string }) {
  return <Badge className={`inline-flex items-center gap-1.5 rounded-full border-0 px-3 py-1 ${statusStyles[status] || "bg-slate-100 text-slate-600"}`}><CircleDot className="h-3.5 w-3.5" aria-hidden="true" />{statusLabels[status] || status}</Badge>;
}

function SupplierFutureSection({ icon: Icon, title, description, detail }: { icon: typeof FileText; title: string; description: string; detail: string }) {
  return <Card className="border border-dashed border-slate-200 bg-slate-50/70 shadow-none"><CardContent className="flex items-start gap-4 p-6"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-slate-400"><Icon className="h-5 w-5" /></div><div><div className="font-bold text-[#092e49]">{title}</div><p className="mt-2 text-sm leading-7 text-slate-600">{description}</p><p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-6 text-slate-500">{detail}</p></div></CardContent></Card>;
}

function SupplierSidebar(_: { active: SupplierSection; onSelect: (section: SupplierSection) => void }) {
  return null;
}

function ProfileSection() {
  const profile = trpc.profile.get.useQuery();
  const operator = trpc.operator.get.useQuery();
  const [form, setForm] = useState({ organizationName: "", registrationNumber: "", phone: "", address: "" });
  const [legalForm, setLegalForm] = useState("");
  const save = trpc.profile.save.useMutation({ onSuccess: () => { toast.success("تم حفظ الملف المؤسسي"); profile.refetch(); }, onError: error => toast.error(error.message) });
  const saveOperator = trpc.operator.save.useMutation({ onSuccess: () => { toast.success("تم حفظ الشكل القانوني"); operator.refetch(); }, onError: error => toast.error(error.message) });
  useEffect(() => { if (profile.data) setForm({ organizationName: profile.data.organizationName || "", registrationNumber: profile.data.registrationNumber || "", phone: profile.data.phone || "", address: profile.data.address || "" }); }, [profile.data]);
  useEffect(() => { if (operator.data?.legalForm) setLegalForm(operator.data.legalForm); }, [operator.data?.legalForm]);
  if (profile.isLoading || operator.isLoading) return <StateBlock type="loading" title="جاري تحميل الملف المؤسسي" description="نقرأ بيانات المؤسسة من المصدر المحمي." />;
  if (profile.isError || operator.isError) return <div className="space-y-4"><StateBlock type="error" title="تعذر تحميل الملف المؤسسي" description="تحقق من جلسة الدخول ثم أعد المحاولة." /><Button type="button" variant="outline" onClick={() => { profile.refetch(); operator.refetch(); }}>إعادة المحاولة</Button></div>;
  const completion = [form.organizationName, form.registrationNumber, form.phone, form.address].filter(Boolean).length * 25;
  const saveLegalForm = () => {
    if (!legalForm || form.organizationName.trim().length < 2) return;
    const current = operator.data;
    saveOperator.mutate({ operatorType: current?.operatorType || "مؤسسة", legalForm: legalForm as (typeof supplierLegalFormOptions)[number]["value"], legalName: current?.legalName || form.organizationName.trim(), wilayaCode: current?.wilayaCode || "", taxCenterType: current?.taxCenterType === "IFU" || current?.taxCenterType === "RNI" || current?.taxCenterType === "IBS" ? current.taxCenterType : undefined, activityCodes: current?.activityCodes || "", representativeName: current?.representativeName || "", representativeQuality: current?.representativeQuality || "", nif: current?.nif || "", nis: current?.nis || "", rc: current?.rc || "", taxArticle: current?.taxArticle || "", nin: current?.nin || "", rib: current?.rib || "" });
  };
  return <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="text-xl text-[#092e49]">الملف المؤسسي</CardTitle><p className="mt-1 text-sm leading-7 text-slate-500">حدّث البيانات المدعومة في الملف حتى تظهر بصورة دقيقة في حساب المتعامل.</p></CardHeader><CardContent className="space-y-5">{!profile.data && !operator.data && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900" role="status"><strong>الملف غير مكتمل بعد.</strong> أدخل اسم المؤسسة واختر الشكل القانوني، ثم احفظ البيانات لإنشاء الملف المؤسسي الأولي.</div>}<div className="rounded-2xl bg-[#f0f8f4] p-4 text-sm leading-7 text-[#0d5c79]">نسبة الاكتمال الحالية: <strong>{profile.data?.completion || 0}%</strong>. هذه النسبة وصفية ومبنية على الحقول الأربعة الموجودة فعلياً في الملف.</div><div className="grid gap-4 md:grid-cols-2"><div><Label>اسم المؤسسة</Label><Input className="mt-2" value={form.organizationName} onChange={event => setForm({ ...form, organizationName: event.target.value })} /></div><div><Label>رقم التسجيل</Label><Input className="mt-2" value={form.registrationNumber} onChange={event => setForm({ ...form, registrationNumber: event.target.value })} /></div><div><Label>الهاتف</Label><Input className="mt-2" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></div><div><Label>العنوان</Label><Input className="mt-2" value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} /></div><div className="md:col-span-2 rounded-2xl border border-[#cfe3dc] bg-[#f5faf8] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><Label htmlFor="supplier-legal-form">الشكل القانوني</Label><p className="mt-1 text-xs leading-6 text-slate-500">اختر الصيغة المطابقة لمستخرج السجل التجاري.</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0d5c79]">قائمة جزائرية</span></div><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center"><Select value={legalForm || undefined} onValueChange={setLegalForm}><SelectTrigger id="supplier-legal-form" className="bg-white"><SelectValue placeholder="اختر الشكل القانوني" /></SelectTrigger><SelectContent>{supplierLegalFormOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" className="shrink-0 border-[#9fd9c6] text-[#0d5c79]" disabled={!legalForm || form.organizationName.trim().length < 2 || saveOperator.isPending} onClick={saveLegalForm}>{saveOperator.isPending ? "جاري الحفظ…" : "حفظ الشكل القانوني"}</Button></div></div></div><div className="flex flex-wrap gap-3"><Button type="button" className="bg-[#0d8062] hover:bg-[#0b6d52]" disabled={save.isPending || form.organizationName.trim().length < 2} onClick={() => save.mutate({ ...form, completion })}>{save.isPending ? "جاري الحفظ…" : "حفظ الملف المؤسسي"}</Button></div></CardContent></Card>;
}

function TenderCard({ tender, hasBid, onOpen }: { tender: Tender; hasBid: boolean; onOpen: () => void }) {
  const deadlinePassed = isTenderDeadlinePassed(tender.deadline);
  const actionLabel = deadlinePassed ? "انتهى أجل استقبال العروض" : hasBid ? "لديك عرض مسجل" : "مراجعة التفاصيل والتقديم";
  return <button type="button" onClick={() => { trackProductEvent("tender_viewed", { actorRole: "supplier", entityType: "tender", outcome: "success" }); onOpen(); }} aria-label={`${actionLabel}: ${tender.title}`} className="group w-full rounded-[22px] border border-slate-100 bg-white p-5 text-right shadow-[0_8px_24px_rgba(9,46,73,.03)] transition duration-200 hover:-translate-y-0.5 hover:border-[#9fd9c6] hover:bg-[#fbfefd] hover:shadow-[0_14px_30px_rgba(9,46,73,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d8062] focus-visible:ring-offset-2 active:scale-[.99]"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#eef8f3] px-2.5 py-1 text-[11px] font-bold text-[#0d8062]">{tender.reference}</span><span className="text-xs font-semibold text-slate-500">{tender.category}</span></div><div className="mt-3 text-lg font-bold text-[#092e49] group-hover:text-[#0d5c79]">{tender.title}</div><p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-7 text-slate-500">{tender.description}</p><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#0d8062]" />{tender.location || "غير محدد"}</span><span className="inline-flex items-center gap-1.5"><CircleDot className="h-3.5 w-3.5 text-[#0d8062]" />آخر أجل: {tenderDate(tender.deadline)}</span></div></div><div className="min-w-32 shrink-0 rounded-2xl bg-slate-50 px-4 py-3 text-left"><div className="text-[11px] font-medium text-slate-400">الميزانية التقديرية</div><div className="mt-1 font-bold text-[#092e49]">{money(tender.budget, tender.currency)}</div><div className={`mt-3 text-xs font-bold ${deadlinePassed ? "text-slate-500" : hasBid ? "text-amber-700" : "text-[#0d8062]"}`}>{actionLabel}<ArrowLeft className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /></div></div></div></button>;
}

function BidSubmissionPanel({ tender, existingBid, onSubmitted, onClose }: { tender: Tender; existingBid?: Bid; onSubmitted: () => void; onClose: () => void }) {
  const [amount, setAmount] = useState(existingBid?.amount ? existingBid.amount.toString() : "");
  const [proposal, setProposal] = useState(existingBid?.proposal || "");
  const [bidId, setBidId] = useState<number | null>(existingBid?.status === "draft" ? existingBid.id : null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [downloadTenderDocumentId, setDownloadTenderDocumentId] = useState<number | null>(null);
  const bidDocuments = trpc.bids.documents.list.useQuery(bidId ?? 0, { enabled: Boolean(bidId) });
  const tenderDocuments = trpc.tenders.documents.list.useQuery(tender.id);
  const tenderDocumentDownload = trpc.tenders.documents.download.useQuery(downloadTenderDocumentId ?? 0, { enabled: Boolean(downloadTenderDocumentId) });
  useEffect(() => {
    if (tenderDocumentDownload.data?.url) {
      window.open(tenderDocumentDownload.data.url, "_blank", "noopener,noreferrer");
      setDownloadTenderDocumentId(null);
    }
  }, [tenderDocumentDownload.data]);
  const createDraft = trpc.bids.createDraft.useMutation();
  const updateDraft = trpc.bids.updateDraft.useMutation();
  const uploadDocument = trpc.bids.documents.upload.useMutation();
  const submit = trpc.bids.submit.useMutation({ onSuccess: () => { toast.success("تم إرسال العرض نهائياً وتسجيله في سجل التدقيق"); onSubmitted(); }, onError: error => toast.error(error.message) });
  const busy = createDraft.isPending || updateDraft.isPending || uploadDocument.isPending || submit.isPending;
  const saveDraft = async () => {
    if (isTenderDeadlinePassed(tender.deadline)) { toast.error("انتهى أجل استقبال العروض"); return null; }
    const saved = bidId ? await updateDraft.mutateAsync({ bidId, amount: Number(amount) || 0, proposal }) : await createDraft.mutateAsync({ tenderId: tender.id });
    const savedId = saved.id;
    setBidId(savedId);
    if (!bidId) await updateDraft.mutateAsync({ bidId: savedId, amount: Number(amount) || 0, proposal });
    for (const file of pendingFiles) {
      const dataBase64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("تعذر قراءة الوثيقة")); reader.readAsDataURL(file); });
      await uploadDocument.mutateAsync({ bidId: savedId, document: { fileName: file.name, mimeType: file.type || "application/pdf", dataBase64 } });
    }
    setPendingFiles([]);
    await bidDocuments.refetch();
    toast.success("تم حفظ مسودة العرض والوثائق");
    return savedId;
  };
  const submitFinal = async () => {
    if (Number(amount) <= 0 || proposal.trim().length < 20) { toast.error("أكمل قيمة العرض والملخص الفني قبل الإرسال"); return; }
    try {
      const savedId = await saveDraft();
      if (!savedId) return;
      await submit.mutateAsync({ bidId: savedId, amount: Number(amount), proposal: proposal.trim() });
    } catch (error: any) { toast.error(error?.message || "تعذر إرسال العرض النهائي"); }
  };
  if (existingBid && existingBid.status !== "draft") return <Card className="border border-amber-100 bg-amber-50/40 shadow-none"><CardContent className="p-5"><div className="flex items-start gap-3"><CircleAlert className="mt-1 h-5 w-5 shrink-0 text-amber-700" /><div><div className="font-bold text-[#092e49]">يوجد عرض مرسل لهذه الصفقة</div><p className="mt-2 text-sm leading-7 text-slate-600">العرض #{existingBid.id} مسجل بحالة <strong>{statusLabels[existingBid.status] || existingBid.status}</strong> ولا يمكن تعديله بعد الإرسال.</p></div></div><Button type="button" variant="outline" className="mt-4" onClick={onClose}>العودة إلى قائمة الصفقات</Button></CardContent></Card>;
  if (isTenderDeadlinePassed(tender.deadline)) return <Card className="border border-amber-100 bg-amber-50/40 shadow-none"><CardContent className="p-5"><div className="flex items-start gap-3"><CircleAlert className="mt-1 h-5 w-5 shrink-0 text-amber-700" /><div><div className="font-bold text-[#092e49]">انتهى أجل استقبال العروض</div><p className="mt-2 text-sm leading-7 text-slate-600">لا يمكن إنشاء أو تعديل أو إرسال عرض بعد {tenderDate(tender.deadline)}. هذا التحقق مطبق على الخادم أيضاً.</p></div></div><Button type="button" variant="outline" className="mt-4" onClick={onClose}>العودة إلى قائمة الصفقات</Button></CardContent></Card>;
  return <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader className="flex flex-row items-start justify-between gap-4"><div><div className="text-xs font-bold text-[#0d8062]">{tender.reference}</div><CardTitle className="mt-2 text-xl text-[#092e49]">إعداد عرض: {tender.title}</CardTitle><p className="mt-2 text-sm leading-7 text-slate-500">احفظ المسودة والوثائق أولاً، ثم أرسل النسخة النهائية قبل انتهاء الأجل.</p></div><Button type="button" variant="outline" onClick={onClose}>إلغاء</Button></CardHeader><CardContent className="space-y-6"><div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-600">{tender.description}<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500"><span>الميزانية التقديرية: {money(tender.budget, tender.currency)}</span><span>آخر أجل: {tenderDate(tender.deadline)}</span></div></div><div className="grid gap-5 lg:grid-cols-[1fr_.92fr]"><div className="space-y-5"><div><Label>قيمة العرض بالدينار</Label><Input type="number" min="1" className="mt-2" value={amount} onChange={event => setAmount(event.target.value)} /></div><div><Label>ملخص العرض الفني</Label><Textarea className="mt-2 min-h-32" value={proposal} onChange={event => setProposal(event.target.value)} placeholder="اكتب ملخصاً واضحاً للعرض الفني…" /></div></div><div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><div><Label className="flex items-center gap-2 text-[#092e49]"><FolderOpen className="h-4 w-4 text-[#0d8062]" />وثائق الصفقة المتاحة</Label><div className="mt-3 space-y-2 text-xs text-slate-600">{tenderDocuments.isLoading && <div className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" />جارٍ تحميل الوثائق…</div>}{tenderDocuments.data?.length ? tenderDocuments.data.map(document => <button type="button" key={document.id} className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-right text-[#0d8062] transition hover:bg-[#eef8f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d8062]" onClick={() => setDownloadTenderDocumentId(document.id)}><span className="truncate">{document.fileName}</span><span className="shrink-0 text-[11px] font-bold">تحميل</span></button>) : !tenderDocuments.isLoading && <div className="rounded-xl bg-white p-3 text-slate-500">لا توجد وثائق منشورة لهذه الصفقة.</div>}{tenderDocumentDownload.isError && <div className="rounded-xl bg-red-50 p-3 text-red-700">تعذر تحميل الوثيقة المسموح بها.</div>}</div></div><div><Label className="flex items-center gap-2 text-[#092e49]"><FileUp className="h-4 w-4 text-[#0d8062]" />وثائق العرض</Label><Input className="mt-2 bg-white" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" multiple onChange={event => setPendingFiles(Array.from(event.target.files ?? []))} /><div className="mt-2 space-y-1.5 text-xs text-slate-600">{pendingFiles.map(file => <div key={file.name} className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-800">{file.name} — في انتظار الحفظ</div>)}{bidDocuments.data?.map(document => <div key={document.id} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-800">{document.fileName} — محفوظة</div>)}</div></div></div></div><div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5"><Button type="button" className="order-1 bg-[#0d8062] hover:bg-[#0b6d52]" disabled={busy || Number(amount) <= 0 || proposal.trim().length < 20} onClick={submitFinal}>{submit.isPending ? "جاري الإرسال…" : <><Send className="ml-2 h-4 w-4" />إرسال العرض نهائياً</>}</Button><Button type="button" variant="outline" className="order-2" disabled={busy} onClick={() => saveDraft()}>{busy ? "جاري الحفظ…" : "حفظ كمسودة"}</Button><Button type="button" variant="ghost" className="order-3" onClick={onClose}>مراجعة لاحقاً</Button></div></CardContent></Card>;
}

function OpportunitiesSection({ tenders, bids, onSubmitted }: { tenders: Tender[]; bids: Bid[]; onSubmitted: () => void }) {
  const [selectedTenderId, setSelectedTenderId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"deadlineSoon" | "deadlineLate" | "budgetHigh" | "budgetLow" | "title">("deadlineSoon");
  const selectedTender = tenders.find(tender => tender.id === selectedTenderId);
  const existingBid = bids.find(bid => bid.tenderId === selectedTenderId);
  const categories = useMemo(() => Array.from(new Set(tenders.map(tender => tender.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ar")), [tenders]);
  useEffect(() => {
    if (searchTerm.trim() || categoryFilter !== "all" || sortBy !== "deadlineSoon") {
      trackProductEvent("tender_search_performed", { actorRole: "supplier", entityType: "tender_search", outcome: "success" });
    }
  }, [categoryFilter, searchTerm, sortBy]);
  const filteredTenders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("ar");
    return tenders
      .filter(tender => {
        const searchable = `${tender.title} ${tender.reference} ${tender.description} ${tender.location || ""}`.toLocaleLowerCase("ar");
        return (!normalizedSearch || searchable.includes(normalizedSearch)) && (categoryFilter === "all" || tender.category === categoryFilter);
      })
      .sort((a, b) => {
        if (sortBy === "title") return a.title.localeCompare(b.title, "ar");
        if (sortBy === "budgetHigh" || sortBy === "budgetLow") {
          const aBudget = a.budget ?? -1;
          const bBudget = b.budget ?? -1;
          return sortBy === "budgetHigh" ? bBudget - aBudget : aBudget - bBudget;
        }
        const aDeadline = new Date(a.deadline).getTime();
        const bDeadline = new Date(b.deadline).getTime();
        return sortBy === "deadlineSoon" ? aDeadline - bDeadline : bDeadline - aDeadline;
      });
  }, [categoryFilter, searchTerm, sortBy, tenders]);
  if (selectedTender) return <BidSubmissionPanel tender={selectedTender} existingBid={existingBid} onSubmitted={() => { setSelectedTenderId(null); onSubmitted(); }} onClose={() => setSelectedTenderId(null)} />;
  if (!tenders.length) return <StateBlock type="empty" title="لا توجد صفقات منشورة حالياً" description="ستظهر هنا الصفقات التي تنشرها المصالح المتعاقدة وتتاح للمتعاملين الاقتصاديين." />;
  const hasActiveFilters = Boolean(searchTerm.trim()) || categoryFilter !== "all" || sortBy !== "deadlineSoon";
  const resetFilters = () => { setSearchTerm(""); setCategoryFilter("all"); setSortBy("deadlineSoon"); };
  return <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader className="pb-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-bold tracking-[.16em] text-[#0d8062]"><BriefcaseBusiness className="h-4 w-4" />فرص متاحة للتقديم</div><CardTitle className="mt-2 text-xl text-[#092e49]">الصفقات المنشورة</CardTitle><p className="mt-1 max-w-2xl text-sm leading-7 text-slate-500">ابحث في العنوان أو المرجع أو الموقع، ثم صفِّ القائمة ورتّبها وفق ما يهمك.</p></div><div className="rounded-2xl bg-[#eef8f3] px-3 py-2 text-xs font-bold text-[#0d8062]" aria-live="polite">{filteredTenders.length} نتيجة متاحة</div></div><div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs font-bold text-[#092e49]"><SlidersHorizontal className="h-4 w-4 text-[#0d8062]" />بحث وتصفية</div>{hasActiveFilters && <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs text-[#0d8062] hover:bg-white" onClick={resetFilters}><RotateCcw className="ml-1 h-3.5 w-3.5" />إزالة التصفية</Button>}</div><div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]"><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input aria-label="البحث في الصفقات" className="bg-white pr-9" placeholder="ابحث بالعنوان أو المرجع أو الموقع" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} /></div><div><Label htmlFor="supplier-category-filter" className="sr-only">التصنيف</Label><select id="supplier-category-filter" aria-label="تصفية حسب التصنيف" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">كل التصنيفات</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></div><div><Label htmlFor="supplier-sort" className="sr-only">ترتيب الصفقات</Label><select id="supplier-sort" aria-label="ترتيب الصفقات" value={sortBy} onChange={event => setSortBy(event.target.value as typeof sortBy)} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="deadlineSoon">الأقرب موعداً</option><option value="deadlineLate">الأبعد موعداً</option><option value="budgetHigh">الميزانية: الأعلى أولاً</option><option value="budgetLow">الميزانية: الأقل أولاً</option><option value="title">العنوان: أ–ي</option></select></div></div>{hasActiveFilters && <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600"><span className="font-medium">التصفية النشطة:</span>{searchTerm.trim() && <span className="rounded-full bg-white px-2 py-1">بحث: {searchTerm}</span>}{categoryFilter !== "all" && <span className="rounded-full bg-white px-2 py-1">{categoryFilter}</span>}{sortBy !== "deadlineSoon" && <span className="rounded-full bg-white px-2 py-1">ترتيب مخصص</span>}</div>}</div></CardHeader><CardContent className="space-y-3">{filteredTenders.length ? filteredTenders.map(tender => <TenderCard key={tender.id} tender={tender} hasBid={bids.some(bid => bid.tenderId === tender.id)} onOpen={() => setSelectedTenderId(tender.id)} />) : <div className="space-y-4"><StateBlock type="empty" title="لا توجد نتائج مطابقة" description="جرّب تغيير عبارة البحث أو اختيار تصنيف آخر." />{hasActiveFilters && <div className="text-center"><Button type="button" variant="outline" onClick={resetFilters}>عرض كل الصفقات</Button></div>}</div>}</CardContent></Card>;
}

function BidsSection({ bids, tenders }: { bids: Bid[]; tenders: Tender[] }) {
  const tenderById = useMemo(() => new Map(tenders.map(tender => [tender.id, tender])), [tenders]);
  if (!bids.length) return <StateBlock type="empty" title="لم تُودع عروض بعد" description="عند إيداع أول عرض من قسم الصفقات المنشورة سيظهر مساره هنا." />;
  return <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-bold tracking-[.16em] text-[#0d8062]"><FileCheck2 className="h-4 w-4" />سجل عروضك</div><CardTitle className="mt-2 text-xl text-[#092e49]">عروضي</CardTitle><p className="mt-1 text-sm leading-7 text-slate-500">متابعة العروض المرتبطة بحسابك فقط، وفق الحالات التي يسجلها الخادم.</p></div><div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{bids.length} عرض مسجل</div></div></CardHeader><CardContent className="space-y-3">{bids.map(bid => { const tender = tenderById.get(bid.tenderId); return <article key={bid.id} className="rounded-[22px] border border-slate-100 bg-white p-4 shadow-[0_8px_24px_rgba(9,46,73,.025)] sm:p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="text-xs font-bold text-[#0d8062]">{tender?.reference || `الصفقة #${bid.tenderId}`}</div><h2 className="mt-1 font-bold text-[#092e49]">{tender?.title || "صفقة مرتبطة بالعرض"}</h2><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500"><span>قيمة العرض: <strong className="text-[#092e49]">{money(bid.amount)}</strong></span><span>تاريخ الإيداع: {tenderDate(bid.submittedAt)}</span></div></div><BidStatusBadge status={bid.status} /></div><div className="mt-4 border-t border-slate-100 pt-3 text-sm leading-7 text-slate-600"><span className="ml-1 text-xs font-bold text-slate-400">الملخص الفني</span>{bid.proposal}</div></article>; })}</CardContent></Card>;
}

function ContractsSection() {
  const contracts = trpc.supplier.contracts.list.useQuery();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  if (contracts.isLoading) return <StateBlock type="loading" title="جاري تحميل سجل العقود" description="نقرأ العقود المرتبطة بعروضك الفائزة من المصدر المحمي." />;
  if (contracts.isError) return <div className="space-y-4"><StateBlock type="error" title="تعذر تحميل سجل العقود" description="تحقق من جلسة الدخول ثم أعد المحاولة." /><Button type="button" variant="outline" onClick={() => contracts.refetch()}>إعادة المحاولة</Button></div>;
  const items = (contracts.data || []) as SupplierContract[];
  if (!items.length) return <StateBlock type="empty" title="لا توجد عقود مسجلة لحسابك" description="سيظهر العقد هنا تلقائياً بعد اعتماد عرضك الفائز وصدور قرار الإسناد." />;
  return <div className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-xs font-bold tracking-[.18em] text-[#0d8062]">سجل موثق · العقود والمتابعة</div><p className="mt-2 text-sm leading-7 text-slate-500">تظهر هنا العقود الناتجة عن إسناد صفقات مرتبطة بحسابك فقط.</p></div><div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{items.length} عقد مسجل</div></div>{items.map(contract => { const expanded = expandedId === contract.id; return <Card key={contract.id} className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardContent className="p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs font-bold text-[#0d8062]">{contract.contractReference} · {contract.tenderReference}</div><h2 className="mt-2 text-lg font-bold text-[#092e49]">{contract.tenderTitle}</h2><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500"><span>القيمة: <strong className="text-[#092e49]">{money(contract.amount, contract.currency)}</strong></span><span>تاريخ الإسناد: {tenderDate(contract.awardedAt)}</span></div></div><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${contractStatusStyles[contract.status]}`}><CircleDot className="h-3.5 w-3.5" aria-hidden="true" />{contractStatusLabels[contract.status]}</span></div><Button type="button" variant="ghost" className="mt-3 px-0 text-[#0d8062] hover:bg-transparent hover:text-[#092e49]" aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : contract.id)}>{expanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}<ArrowLeft className={`mr-2 h-4 w-4 transition-transform ${expanded ? "-rotate-90" : "rotate-90"}`} /></Button>{expanded && <div className="mt-3 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600 md:grid-cols-2"><div><span className="font-semibold text-[#092e49]">التصنيف:</span> {contract.tenderCategory}</div><div><span className="font-semibold text-[#092e49]">الموقع:</span> {contract.tenderLocation || "غير محدد"}</div><div><span className="font-semibold text-[#092e49]">معرّف العرض الفائز:</span> #{contract.winningBidId}</div><div><span className="font-semibold text-[#092e49]">قرار الإسناد:</span> {contract.decidedAt ? tenderDate(contract.decidedAt) : "مسجل"}</div>{contract.decisionNotes && <div className="border-t border-slate-200 pt-3 md:col-span-2"><span className="font-semibold text-[#092e49]">ملاحظة القرار:</span> {contract.decisionNotes}</div>}</div>}</CardContent></Card>; })}</div>;
}

function AlertsSection() {
  const alerts = trpc.supplier.alerts.list.useQuery({ limit: 30 });
  const markRead = trpc.supplier.alerts.markRead.useMutation({ onSuccess: () => alerts.refetch(), onError: error => toast.error(error.message) });
  const markAllRead = trpc.supplier.alerts.markAllRead.useMutation({ onSuccess: () => alerts.refetch(), onError: error => toast.error(error.message) });
  if (alerts.isLoading) return <StateBlock type="loading" title="جاري تحميل التنبيهات" description="نقرأ التنبيهات التشغيلية المسجلة لحسابك فقط." />;
  if (alerts.isError) return <div className="space-y-4"><StateBlock type="error" title="تعذر تحميل التنبيهات" description="تحقق من جلسة الدخول ثم أعد المحاولة." /><Button type="button" variant="outline" onClick={() => alerts.refetch()}>إعادة المحاولة</Button></div>;
  const items = (alerts.data?.items || []) as SupplierAlert[];
  const unreadCount = alerts.data?.unreadCount || 0;
  return <div className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="text-xs font-bold tracking-[.18em] text-[#0d8062]">مركز التنبيهات التشغيلية</div><p className="mt-2 text-sm leading-7 text-slate-500">تُنشأ التنبيهات تلقائياً عند الأحداث المسجلة، ولا تعتمد على تذكيرات غير موثقة.</p></div>{unreadCount > 0 && <Button type="button" variant="outline" disabled={markAllRead.isPending} onClick={() => markAllRead.mutate()}>تمييز الكل كمقروء ({unreadCount})</Button>}</div>{!items.length ? <StateBlock type="empty" title="لا توجد تنبيهات تشغيلية" description="ستظهر هنا التنبيهات الناتجة عن إسناد صفقة أو تغير حالة عقد مرتبط بحسابك." /> : <div className="space-y-3">{items.map(alert => { const unread = !alert.readAt; return <article key={alert.id} className={`rounded-[22px] border p-5 shadow-[0_8px_24px_rgba(9,46,73,.025)] ${unread ? alertAccent[alert.severity] : "border-slate-100 bg-white"}`}><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><div className={`mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${unread ? "bg-white text-[#0d8062]" : "bg-slate-100 text-slate-500"}`}><BellRing className="h-4 w-4" /></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-[#092e49]">{alert.title}</h2><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${unread ? "bg-[#092e49] text-white" : "bg-slate-100 text-slate-600"}`}>{unread ? "جديد" : "مقروء"}</span><span className="text-[11px] font-semibold text-slate-500">{alertSeverityLabels[alert.severity]}</span></div><p className="mt-2 text-sm leading-7 text-slate-600">{alert.message}</p><p className="mt-2 text-xs text-slate-400">سُجل في {new Date(alert.createdAt).toLocaleString(activeLocale())}</p></div></div>{unread && <Button type="button" variant="ghost" size="sm" disabled={markRead.isPending} onClick={() => markRead.mutate({ alertId: alert.id })}>تحديد كمقروء</Button>}</div></article>; })}</div>}</div>;
}

const matchLabels: Record<TenderMatch["label"], string> = { "Highly Relevant": "ملاءمة عالية", Relevant: "ملاءمة جيدة", "Potential Fit": "احتمال مناسب", "Low Fit": "ملاءمة محدودة", "Not Eligible": "غير متاح" };

function RecommendedTendersSection({ matches, isLoading, isError, onNavigate }: { matches: TenderMatch[]; isLoading: boolean; isError: boolean; onNavigate: (section: SupplierSection) => void }) {
  const [expandedTenderId, setExpandedTenderId] = useState<number | null>(null);
  useEffect(() => {
    if (matches.length) trackProductEvent("recommendations_viewed", { actorRole: "supplier", entityType: "recommendation", outcome: "success" });
  }, [matches.length]);
  if (isLoading) return <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardContent className="flex items-center gap-3 p-5 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin text-[#0d8062]" />جاري تحليل الصفقات المنشورة وفق بيانات الملف المتاحة…</CardContent></Card>;
  if (isError) return <Card className="border border-amber-100 bg-amber-50/40 shadow-none"><CardContent className="p-5"><div className="flex items-start gap-3"><CircleAlert className="mt-1 h-5 w-5 shrink-0 text-amber-700" /><div><div className="font-bold text-[#092e49]">تعذر تحميل الصفقات الأنسب</div><p className="mt-1 text-sm leading-7 text-slate-600">يمكنك متابعة الصفقات المنشورة يدوياً؛ لم يؤثر هذا الخطأ على إمكانية البحث أو التقديم.</p></div></div><Button type="button" variant="outline" className="mt-4" onClick={() => onNavigate("opportunities")}>فتح الصفقات المنشورة</Button></CardContent></Card>;
  if (!matches.length) return <Card className="border border-dashed border-slate-200 bg-slate-50/70 shadow-none"><CardContent className="p-5"><div className="flex items-start gap-3"><Sparkles className="mt-1 h-5 w-5 shrink-0 text-[#0d8062]" /><div><div className="font-bold text-[#092e49]">لا توجد توصيات حالياً</div><p className="mt-1 text-sm leading-7 text-slate-600">تعتمد المطابقة على الصفقات المنشورة وبيانات الملف المؤسسي الحالية فقط. افتح القائمة لاستكشاف جميع الفرص المتاحة.</p></div></div><Button type="button" variant="outline" className="mt-4" onClick={() => onNavigate("opportunities")}>استكشاف الصفقات</Button></CardContent></Card>;
  return <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2 text-lg text-[#092e49]"><Sparkles className="h-5 w-5 text-[#0d8062]" />الصفقات الأنسب لك</CardTitle><p className="mt-1 text-sm leading-7 text-slate-500">ترتيب إرشادي مبني على الحقول المتاحة، وليس قرار أهلية أو ضماناً لقبول العرض.</p></div><Button type="button" variant="ghost" className="shrink-0" onClick={() => onNavigate("opportunities")}>كل الصفقات<ArrowLeft className="mr-2 h-4 w-4" /></Button></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{matches.map(match => { const expanded = expandedTenderId === match.tenderId; return <div key={match.tenderId} className="rounded-2xl border border-slate-100 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold text-[#0d8062]">{match.reference}</div><div className="mt-1 font-bold text-[#092e49]">{match.title}</div><div className="mt-1 text-xs text-slate-500">{matchLabels[match.label]}</div></div><div className="rounded-full bg-[#f0f8f4] px-3 py-1 text-sm font-bold text-[#0d8062]">{match.matchScore}%</div></div><ul className="mt-3 space-y-1 text-xs leading-6 text-slate-500">{match.topMatchReasons.slice(0, 2).map(reason => <li key={reason}>• {reason}</li>)}</ul><Button type="button" variant="ghost" className="mt-3 w-full" aria-expanded={expanded} onClick={() => { setExpandedTenderId(expanded ? null : match.tenderId); trackProductEvent("explanation_opened", { actorRole: "supplier", entityType: "matching_explanation", outcome: "success" }); }}>{expanded ? "إخفاء التفسير" : "لماذا هذه الصفقة؟"}</Button>{expanded && <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600" role="region" aria-label={`تفسير المطابقة للصفقة ${match.reference}`}><div className="font-semibold text-[#092e49]">أسباب المطابقة</div><ul className="mt-1 list-disc space-y-1 pr-4">{match.topMatchReasons.map(reason => <li key={reason}>{reason}</li>)}</ul>{match.gapAnalysis.length > 0 && <><div className="mt-2 font-semibold text-[#092e49]">بيانات تحتاج إلى مراجعة</div><ul className="mt-1 list-disc space-y-1 pr-4">{match.gapAnalysis.map(gap => <li key={gap}>{gap}</li>)}</ul></>}<p className="mt-2 border-t border-slate-200 pt-2 text-[11px] text-slate-500">{match.disclaimer || "المطابقة إرشادية ولا تغني عن قراءة الشروط الرسمية."}</p></div>}<Button type="button" variant="outline" className="mt-3 w-full" onClick={() => { trackProductEvent("recommendation_clicked", { actorRole: "supplier", entityType: "recommendation", outcome: "success" }); onNavigate("opportunities"); }}>مراجعة التفاصيل</Button></div>; })}</CardContent></Card>;
}

function HomeSection({ tenders, bids, recommended, recommendedLoading, recommendedError, profileCompletion, organizationName, legalForm, userKey, onNavigate }: { tenders: Tender[]; bids: Bid[]; recommended: TenderMatch[]; recommendedLoading: boolean; recommendedError: boolean; profileCompletion: number; organizationName: string; legalForm?: string | null; userKey?: string | number | null; onNavigate: (section: SupplierSection) => void }) {
  return <div className="space-y-6"><UpgradeNotificationCenter compact role="supplier" /><ContextualOnboarding role="supplier" userKey={userKey} title="ابدأ من هنا" description="لديك مساحة مخصصة لاكتشاف الصفقات وإعداد عروضك ومتابعة حالتها من مكان واحد." steps={[{ id: "profile", label: "أكمل الملف المؤسسي", description: "أضف الحقول المدعومة حتى تظهر بيانات مؤسستك بصورة دقيقة.", complete: profileCompletion >= 100, actionLabel: "فتح الملف", onAction: () => onNavigate("profile") }, { id: "opportunities", label: "ابحث عن الصفقة المناسبة", description: "استعرض الصفقات المنشورة واستخدم البحث والتصفية للوصول إلى الفرص المتاحة.", complete: tenders.length > 0, actionLabel: "استكشاف الصفقات", onAction: () => onNavigate("opportunities") }, { id: "first-bid", label: "ابدأ إعداد أول عرض", description: "بعد اختيار صفقة منشورة، احفظ مسودة العرض أو أرسله نهائياً قبل الأجل.", complete: bids.length > 0, actionLabel: "عرض عروضي", onAction: () => onNavigate(bids.length > 0 ? "bids" : "opportunities") }]} /> <Card className="border border-[#cfe3dc] bg-gradient-to-br from-[#f5fbf8] via-white to-[#eef7fb] shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardContent className="p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#092e49] text-[#b8e5d1]"><UserRound className="h-5 w-5" aria-hidden="true" /></div><div className="min-w-0"><div className="text-xs font-bold tracking-[.14em] text-[#0d8062]">الملف الشخصي للمستخدم</div><h2 className="mt-1 truncate text-xl font-black text-[#092e49]" title={organizationName}>{organizationName}</h2><p className="mt-1 text-sm text-slate-500">بيانات مؤسستك المعتمدة في مساحة المتعامل الاقتصادي.</p></div></div><div className="grid w-full gap-3 sm:w-auto sm:min-w-[230px] sm:grid-cols-2"><div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3"><div className="text-xs font-semibold text-slate-500">اسم المتعامل</div><div className="mt-1 truncate font-bold text-[#092e49]" title={organizationName}>{organizationName}</div></div><div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3"><div className="text-xs font-semibold text-slate-500">الشكل القانوني</div><div className="mt-1 truncate font-bold text-[#0d5c79]" title={legalForm || "غير محدد"}>{legalForm || "غير محدد"}</div></div></div><Button type="button" variant="outline" className="shrink-0 border-[#9fd9c6] text-[#0d5c79] hover:bg-white" onClick={() => onNavigate("profile")}>عرض الملف<ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /></Button></div></CardContent></Card> <RecommendedTendersSection matches={recommended} isLoading={recommendedLoading} isError={recommendedError} onNavigate={onNavigate} /> <div className="rounded-[28px] bg-[#092e49] p-7 text-white shadow-[0_18px_50px_rgba(9,46,73,.16)]"><div className="flex flex-wrap items-end justify-between gap-6"><div><div className="text-xs font-bold tracking-[.18em] text-[#b8e5d1]">مساحة المتعامل الاقتصادي</div><h1 className="mt-3 text-3xl font-black tracking-tight lg:text-4xl">أدر فرصك من مساحة واحدة</h1><p className="mt-3 max-w-2xl leading-8 text-white/65">اكتشف الصفقات المنشورة، جهّز عروضك، وتابع الحالات المسجلة لحسابك ضمن مسار واضح وقابل للمراجعة.</p></div><Button type="button" className="bg-[#b8e5d1] text-[#092e49] hover:bg-white" onClick={() => onNavigate("opportunities")}>استكشاف الصفقات <BriefcaseBusiness className="mr-2 h-4 w-4" /></Button></div></div><PortalStatGrid className="xl:grid-cols-2"><PortalStatCard label="الصفقات المنشورة" value={tenders.length} hint="فتح قائمة الفرص" icon={BriefcaseBusiness} tone="green" onClick={() => onNavigate("opportunities")} tooltip="استعرض الصفقات المنشورة المتاحة" /><PortalStatCard label="العروض المسجلة" value={bids.length} hint="متابعة حالة العروض" icon={FileCheck2} tone="navy" onClick={() => onNavigate("bids")} tooltip="افتح سجل عروضك وحالاتها" /></PortalStatGrid><div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="text-lg text-[#092e49]">خطوتك التالية</CardTitle></CardHeader><CardContent><p className="text-sm leading-7 text-slate-500">{!tenders.length ? "لا توجد صفقة منشورة لتقديم عرض حالياً." : bids.length === 0 ? "ابدأ بمراجعة الصفقات المنشورة وإعداد أول عرض." : "راجع حالة عروضك وتحقق من البيانات المرتبطة بها."}</p><Button type="button" variant="outline" className="mt-4" onClick={() => onNavigate(bids.length ? "bids" : "opportunities")}>{bids.length ? "عرض عروضي" : "فتح الصفقات المنشورة"}</Button></CardContent></Card><Card className="border border-dashed border-slate-200 bg-slate-50/70 shadow-none"><CardContent className="flex items-start gap-4 p-5"><LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-slate-400" /><div><div className="font-bold text-[#092e49]">البيانات محمية</div><p className="mt-1 text-sm leading-7 text-slate-500">العروض المعروضة مرتبطة بحسابك عبر الإجراء الخادمي المحمي، والمساعد الذكي لا ينفذ قرارات أو تغييرات.</p></div></CardContent></Card></div></div>;
}

export default function SupplierWorkspace() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const querySection = supplierSectionFromSearch(new URLSearchParams(search).get("section"));
  const [section, setSection] = useState<SupplierSection>(querySection);
  const tenders = trpc.tenders.published.useQuery();
  const bids = trpc.bids.mine.useQuery();
  const profile = trpc.profile.get.useQuery();
  const operator = trpc.operator.get.useQuery();
  const recommended = trpc.tenders.recommended.useQuery(undefined, { enabled: section === "home" });
  const me = trpc.auth.me.useQuery();
  useEffect(() => { setSection(querySection); }, [querySection]);
  const navigate = (next: SupplierSection) => { setSection(next); setLocation(`/app?section=${next}`); };
  const sectionTitle = supplierWorkflowSections.find(item => item.key === section)?.label || "الرئيسية";
  if (tenders.isLoading || bids.isLoading) return <div className="space-y-6"><SupplierSidebar active={section} onSelect={navigate} /><StateBlock type="loading" title="جاري تحميل مساحة المتعامل" description="نقرأ الصفقات المنشورة والعروض المرتبطة بحسابك." /></div>;
  if (tenders.isError || bids.isError) return <div className="space-y-6"><SupplierSidebar active={section} onSelect={navigate} /><StateBlock type="error" title={tenders.isError && bids.isError ? "تعذر تحميل بيانات المتعامل" : tenders.isError ? "تعذر تحميل الصفقات المنشورة" : "تعذر تحميل عروضك"} description={tenders.isError && bids.isError ? "تحقق من جلسة الدخول أو الاتصال ثم أعد المحاولة." : tenders.isError ? "تعذر الوصول إلى مصدر الصفقات المنشورة. أعد المحاولة قبل متابعة التقديم." : "تعذر الوصول إلى العروض المرتبطة بحسابك. أعد المحاولة لمتابعة حالاتها."} /><Button type="button" variant="outline" onClick={() => { tenders.refetch(); bids.refetch(); }}>إعادة المحاولة</Button></div>;
  if (section === "smart-documents") return <div dir="rtl" className="space-y-6"><SupplierSidebar active={section} onSelect={navigate} /><AiDocumentAssistantPanel audience="supplier" /><ProcurementAiWorkbench audience="supplier" /><SupplierAiAssistantMockup /><SupplierSmartTenderSection /></div>;
  if (section === "contracts") return <div dir="rtl" className="space-y-6"><SupplierSidebar active={section} onSelect={navigate} /><ContractsSection /></div>;
  if (section === "alerts") return <div dir="rtl" className="space-y-6"><SupplierSidebar active={section} onSelect={navigate} /><AlertsSection /></div>;
  if (section === "help") return <div dir="rtl" className="space-y-6"><div><div className="text-xs font-bold tracking-[.18em] text-[#0d8062]">بوابة المتعامل الاقتصادي · المساعدة</div><p className="mt-2 text-sm text-slate-500">دليل مختصر للاستخدام لا يحل محل الوثائق القانونية أو دفتر الشروط.</p></div><Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="text-xl text-[#092e49]">ابدأ بهذه الخطوات</CardTitle><p className="mt-1 text-sm leading-7 text-slate-500">استكشف الصفقات المنشورة، حدّث ملفك ووثائقك، ثم احفظ العرض كمسودة أو أرسله قبل انتهاء الأجل.</p></CardHeader><CardContent className="space-y-3 text-sm leading-7 text-slate-600"><div className="rounded-2xl bg-slate-50 p-4">تظهر الصفقات في قسم <strong>الصفقات</strong> فقط بعد نشرها من المصلحة المتعاقدة.</div><div className="rounded-2xl bg-slate-50 p-4">يتابع قسم <strong>عروضي</strong> العروض المرتبطة بحسابك، ولا يمكن تعديل العرض بعد إرساله.</div><div className="rounded-2xl bg-slate-50 p-4">تُعرض حالة كل عملية من بيانات الخادم، ويظل دفتر الشروط المرجع الرسمي للمتطلبات والمواعيد.</div></CardContent></Card></div>;
  const tenderData = (tenders.data || []) as Tender[];
  const bidData = (bids.data || []) as Bid[];
  return <div dir="rtl" className="space-y-6"><SupplierSidebar active={section} onSelect={navigate} /><div className="flex items-center justify-between gap-4"><div><div className="text-xs font-bold tracking-[.18em] text-[#0d8062]">بوابة المتعامل الاقتصادي · {sectionTitle}</div><h1 className="mt-2 text-xl font-black text-[#092e49]">{operator.data?.legalName || profile.data?.organizationName || me.data?.name || "مساحة المتعامل"}</h1><p className="mt-1 text-sm text-slate-500">البيانات المعروضة مشتقة من الصفقات المنشورة والعروض المرتبطة بحسابك.</p></div><div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-slate-500 shadow-sm sm:flex"><LockKeyhole className="h-3.5 w-3.5 text-[#0d8062]" />حماية الملكية على الخادم</div></div>{section === "home" && <HomeSection tenders={tenderData} bids={bidData} recommended={(recommended.data || []) as TenderMatch[]} recommendedLoading={recommended.isLoading} recommendedError={recommended.isError} profileCompletion={profile.data?.completion || 0} organizationName={operator.data?.legalName || profile.data?.organizationName || me.data?.name || "مساحة المتعامل"} legalForm={operator.data?.legalForm} userKey={me.data?.id} onNavigate={navigate} />}{section === "profile" && <ProfileSection />}{section === "opportunities" && <OpportunitiesSection tenders={tenderData} bids={bidData} onSubmitted={() => bids.refetch()} />}{section === "bids" && <BidsSection bids={bidData} tenders={tenderData} />}</div>;
}
