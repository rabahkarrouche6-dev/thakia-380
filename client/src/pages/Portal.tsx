import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getAuthorityNavItems, getRegulatorNavItems, supplierNavItems } from "@/lib/portalNavigation";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Gavel, LockKeyhole, RefreshCw, ShieldAlert, Store } from "lucide-react";
import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { consumePortalSelection, storePortalSelection } from "../../../shared/login";
import { resolvePortalForRole } from "../../../shared/portalRouting";

const CentralAdminPortal = lazy(() => import("@/pages/CentralAdminPortal"));
const AuthorityWorkspace = lazy(() => import("@/pages/AuthorityShell"));
const SupplierWorkspace = lazy(() => import("@/pages/SupplierWorkspace"));

function WorkspaceLaunchScreen({ title, message, detail, direction }: { title: string; message: string; detail: string; direction: "rtl" | "ltr" }) {
  return <div dir={direction} className="mx-auto max-w-xl py-10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-reduce:animate-none"><Card className="overflow-hidden border border-[#c8dfd4] bg-[#fbfefd] shadow-[0_18px_50px_rgba(9,46,73,.1)]"><div className="h-1.5 overflow-hidden bg-[#e7f4ee]"><div className="h-full w-1/3 rounded-full bg-[#0d8062] motion-safe:animate-[workspace-progress_1.4s_ease-in-out_infinite]" /></div><CardHeader><CardTitle className="flex items-center gap-3 text-[#092e49]"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e1f3e9] text-[#0d8062] motion-safe:animate-pulse motion-reduce:animate-none"><RefreshCw className="h-5 w-5 motion-safe:animate-spin motion-reduce:animate-none" /></span>{title}</CardTitle></CardHeader><CardContent className="space-y-5 text-sm leading-7 text-slate-600"><p>{message}</p><div className="grid gap-2" aria-hidden="true"><div className="h-3 w-full rounded-full bg-slate-100 motion-safe:animate-pulse motion-reduce:animate-none" /><div className="h-3 w-4/5 rounded-full bg-slate-100 motion-safe:animate-pulse motion-reduce:animate-none [animation-delay:120ms]" /><div className="h-3 w-2/5 rounded-full bg-slate-100 motion-safe:animate-pulse motion-reduce:animate-none [animation-delay:240ms]" /></div><p className="text-xs text-slate-400">{detail}</p></CardContent></Card></div>;
}

function RolePicker() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("supplier");
  const [organizationName, setOrganizationName] = useState("");
  const [professionalEmail, setProfessionalEmail] = useState("");
  const beginRegistration = () => {
    storePortalSelection(role as "supplier" | "authority" | "regulator");
    window.location.assign(`/register/${role}`);
  };
  const options = [
    { value: "supplier", label: "متعامل اقتصادي", icon: Store, description: "تصفح الصفقات وتقديم العروض" },
    { value: "authority", label: "مصلحة متعاقدة", icon: Gavel, description: "إدارة دورة الصفقة من البرمجة إلى الإسناد" },
    { value: "regulator", label: "إدارة مركزية", icon: ShieldAlert, description: "رقابة وتحليل وسجل تدقيق" },
  ];

  return <div className="mx-auto max-w-4xl py-10" dir="rtl">
    <div className="mb-7"><div className="text-[11px] font-bold tracking-[.18em] text-[#0d8062]">تهيئة الوصول</div><h1 className="mt-2 text-2xl font-black text-[#092e49]">اختر مساحتك المهنية</h1><p className="mt-2 text-sm leading-7 text-slate-500">يُراجع كل طلب قبل التفعيل لضمان الحوكمة والصلاحيات الصحيحة.</p></div>
    <div className="grid gap-5 md:grid-cols-3">{options.map(option => <Card key={option.value} className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardContent className="p-6"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f1f7] text-[#0d5c79]"><option.icon className="h-6 w-6" /></div><h2 className="mt-5 font-bold text-[#092e49]">{option.label}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{option.description}</p><Button className="mt-6 w-full bg-[#0d5c79] hover:bg-[#092e49]" onClick={() => { setRole(option.value); setOpen(true); }}>طلب التفعيل <ArrowLeft className="mr-2 h-4 w-4" /></Button></CardContent></Card>)}</div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent dir="rtl"><DialogHeader><DialogTitle>طلب تفعيل الدور</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>الجهة أو المؤسسة</Label><Input value={organizationName} onChange={event => setOrganizationName(event.target.value)} placeholder="اسم الجهة" /></div><div><Label>البريد المهني</Label><Input value={professionalEmail} onChange={event => setProfessionalEmail(event.target.value)} placeholder="name@organization.dz" /></div><div><Label>ملاحظات التحقق</Label><Textarea placeholder="معلومات إضافية تساعد المراجعة" /></div><Button disabled={!organizationName || !professionalEmail} className="w-full bg-[#0d5c79]" onClick={beginRegistration}>متابعة التسجيل</Button></div></DialogContent></Dialog>
  </div>;
}

export default function Portal() {
  const { user, refresh } = useAuth();
  const { isEnglish, direction } = useLocale();
  const [loginContext, setLoginContext] = useState<string | null>(null);
  const [portalContextReady, setPortalContextReady] = useState(false);
  const [authorityRequestSubmitted, setAuthorityRequestSubmitted] = useState(false);
  const autoPostOAuthActionStarted = useRef(false);
  const utils = trpc.useUtils();
  const activateSupplier = trpc.auth.setRole.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      await refresh();
    },
    onError: error => toast.error(isEnglish ? `Supplier activation could not be completed: ${error.message}` : `تعذر إتمام تفعيل المتعامل الاقتصادي: ${error.message}`),
  });
  const requestAuthorityApproval = trpc.auth.requestAuthorityApproval.useMutation({
    onSuccess: () => setAuthorityRequestSubmitted(true),
    onError: error => toast.error(isEnglish ? `Authority approval request could not be submitted: ${error.message}` : `تعذر إرسال طلب اعتماد المصلحة: ${error.message}`),
  });

  useEffect(() => {
    setLoginContext(consumePortalSelection());
    setPortalContextReady(true);
  }, []);

  useEffect(() => {
    if (!portalContextReady || user?.role !== "user") return;
    if (autoPostOAuthActionStarted.current) return;
    if (loginContext === "supplier" && !activateSupplier.isPending && !activateSupplier.isSuccess) {
      autoPostOAuthActionStarted.current = true;
      activateSupplier.mutate("supplier");
    }
    if (loginContext === "authority" && !authorityRequestSubmitted && !requestAuthorityApproval.isPending && !requestAuthorityApproval.isSuccess) {
      autoPostOAuthActionStarted.current = true;
      requestAuthorityApproval.mutate();
    }
  }, [activateSupplier, authorityRequestSubmitted, loginContext, portalContextReady, requestAuthorityApproval, user?.role]);

  if (user?.role === "user" && portalContextReady && loginContext === "supplier" && activateSupplier.isPending) {
    return <DashboardLayout title={isEnglish ? "Opening workspace" : "فتح مساحة العمل"}><WorkspaceLaunchScreen direction={direction} title={isEnglish ? "Opening your workspace" : "جارٍ فتح مساحة عملك"} message={isEnglish ? "Your identity is verified. We are applying the supplier role and opening the workspace automatically." : "تم التحقق من هويتك. نطبّق دور المتعامل الاقتصادي ونفتح مساحة العمل تلقائياً."} detail={isEnglish ? "This usually takes a moment. No additional sign-in is required." : "تستغرق العملية لحظات عادةً، ولا تحتاج إلى تسجيل دخول إضافي."} /></DashboardLayout>;
  }

  if (user?.role === "user" && portalContextReady && loginContext === "authority" && (authorityRequestSubmitted || requestAuthorityApproval.isPending || requestAuthorityApproval.isSuccess)) {
    return <DashboardLayout title={isEnglish ? "Approval request" : "طلب الاعتماد"}><div dir={direction} className="mx-auto max-w-xl py-10"><Card className="border border-amber-200 bg-amber-50 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="text-amber-950">{isEnglish ? "Your request is under review" : "طلبك قيد المراجعة"}</CardTitle></CardHeader><CardContent className="space-y-5 text-sm leading-7 text-amber-950/80"><p>{isEnglish ? "Your contracting-authority request was saved successfully. Central administration will review it before opening the workspace." : "تم حفظ طلب المصلحة المتعاقدة بنجاح. ستراجعه الإدارة المركزية قبل فتح مساحة العمل."}</p><div className="rounded-xl border border-amber-200 bg-white/70 p-4"><p className="font-bold text-amber-950">{isEnglish ? "What happens next?" : "ماذا سيحدث الآن؟"}</p><p className="mt-1 text-xs leading-6">{isEnglish ? "You can safely leave this page. Sign in again later to continue; your request is not lost." : "يمكنك مغادرة الصفحة بأمان. عُد وسجّل الدخول لاحقاً للمتابعة؛ لن يضيع طلبك."}</p></div><div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" className="flex-1 border-amber-300 bg-white/80" onClick={() => window.location.assign("/login/authority")}>{isEnglish ? "Back to sign-in" : "العودة إلى الدخول"}</Button><Button className="flex-1 bg-[#092e49] hover:bg-[#0d5c79]" onClick={() => window.location.assign("/")}>{isEnglish ? "Return home" : "العودة للرئيسية"}</Button></div></CardContent></Card></div></DashboardLayout>;
  }

  if (!user || user.role === "user") {
    if (typeof window !== "undefined") {
      window.location.assign("/register");
    }
    return null;
  }

  const portal = resolvePortalForRole(user.role);
  if (!portal) {
    return <DashboardLayout title={isEnglish ? "Access control" : "التحكم في الوصول"}><div dir={direction} className="mx-auto max-w-xl py-10"><Card className="border border-amber-200 bg-amber-50 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader><CardTitle className="flex items-center gap-2 text-amber-900"><LockKeyhole className="h-5 w-5" />{isEnglish ? "Workspace access is unavailable" : "الوصول إلى مساحة العمل غير متاح"}</CardTitle></CardHeader><CardContent className="text-sm leading-7 text-amber-900/80">{isEnglish ? "Your account does not have an approved workspace role. Ask an administrator to assign an authorized role before continuing." : "لا يرتبط حسابك بدور مساحة عمل معتمد. اطلب من مسؤول النظام تعيين دور مخوّل قبل المتابعة."}</CardContent></Card></div></DashboardLayout>;
  }

  const isSupplier = portal === "supplier";
  const isRegulator = portal === "regulator";
  const roleLabels: Record<string, string> = isEnglish ? { supplier: "Economic operator", authority: "Contracting authority", regulator: "Central administration" } : { supplier: "المتعامل الاقتصادي", authority: "المصلحة المتعاقدة", regulator: "الإدارة المركزية" };
  const title = isSupplier ? (isEnglish ? "Economic operator workspace" : "مساحة المتعامل الاقتصادي") : isRegulator ? (isEnglish ? "Central administration observatory" : "مرصد الإدارة المركزية") : (isEnglish ? "Contracting authority workspace" : "مساحة المصلحة المتعاقدة");
  const items = isSupplier ? supplierNavItems : isRegulator ? getRegulatorNavItems(isEnglish) : getAuthorityNavItems(isEnglish);
  const contextMessage = loginContext === portal
    ? (isEnglish ? `The ${roleLabels[portal]} workspace is open for your approved role.` : `تم فتح بوابة ${roleLabels[portal]} وفق الدور المرتبط بحسابك.`)
    : loginContext && roleLabels[loginContext]
      ? (isEnglish ? `You selected ${roleLabels[loginContext]}; the workspace matching your approved role is now open: ${roleLabels[portal]}.` : `تم اختيار ${roleLabels[loginContext]} عند الدخول، وفتحت البوابة المتوافقة مع صلاحيات حسابك الفعلية: ${roleLabels[portal]}.`)
      : null;

  return <DashboardLayout title={title} items={items}>
    {contextMessage && <div dir={direction} className="mb-5 rounded-2xl border border-[#d7e9e0] bg-[#f0f8f4] px-4 py-3 text-sm text-[#0d5c79]">{contextMessage}</div>}
    <Suspense fallback={<WorkspaceLaunchScreen direction={direction} title={isEnglish ? "Loading workspace" : "جارٍ تحميل مساحة العمل"} message={isEnglish ? "The protected workspace is loading its current records and permissions." : "يجري تحميل مساحة العمل المحمية مع سجلاتها الحالية وصلاحياتها."} detail={isEnglish ? "Your session remains active while the workspace loads." : "تبقى جلستك فعالة أثناء تحميل مساحة العمل."} />}>
      {isSupplier ? <SupplierWorkspace /> : isRegulator ? <CentralAdminPortal /> : <AuthorityWorkspace />}
    </Suspense>
  </DashboardLayout>;
}
