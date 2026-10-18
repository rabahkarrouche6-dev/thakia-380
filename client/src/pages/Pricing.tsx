import { useEffect, useMemo, useState } from "react";
import { Check, LockKeyhole, ShieldCheck, Sparkles, Building2, Store, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocale } from "@/contexts/LocaleContext";

type Audience = "supplier" | "authority";

const featureLabels: Record<string, string> = {
  public_tender_browsing: "تصفح الصفقات المتاحة للجمهور",
  eligible_bid_submission: "إيداع العروض المؤهلة",
  procurement_procedure_visibility: "الاطلاع على الإجراءات الأساسية",
  core_bid_status_visibility: "متابعة الحالة الأساسية للعرض",
  ai_opportunity_match: "مطابقة استشارية للفرص الذكية",
  advanced_notifications: "تنبيهات متقدمة حسب الاهتمامات",
  ai_rfp_generation: "مساندة استشارية في إعداد دفتر الشروط",
  smart_evaluator_support: "مساندة استشارية للتقييم",
  team_management: "إدارة الفريق والمقاعد",
};

const featureLabelsEn: Record<string, string> = {
  public_tender_browsing: "Browse publicly available tenders",
  eligible_bid_submission: "Submit eligible bids",
  procurement_procedure_visibility: "View essential procedures",
  core_bid_status_visibility: "Track core bid status",
  ai_opportunity_match: "Guided opportunity matching",
  advanced_notifications: "Advanced alerts by interests",
  ai_rfp_generation: "Advisory support for specification preparation",
  smart_evaluator_support: "Advisory support for evaluation",
  team_management: "Team and seat management",
};

const englishPlanNames: Record<string, string> = {
  "المعياري للمصلحة المتعاقدة": "Authority essential",
  "المصلحة الذكية — شهري": "Smart authority — monthly",
  "المصلحة الذكية — سنوي": "Smart authority — annual",
  "الحوكمة المؤسسية — سنوي": "Institutional governance — annual",
  "المعياري للمتعامل الاقتصادي": "Economic operator essential",
  "المتعامل الذكي — شهري": "Smart operator — monthly",
  "المتعامل الذكي — سنوي": "Smart operator — annual",
};

const audienceCopy: Record<Audience, { label: string; title: string; description: string; icon: typeof Building2 }> = {
  authority: {
    label: "المصلحة المتعاقدة",
    title: "خطط تساعدكم على إدارة الصفقة بوضوح أكبر",
    description: "أدوات إنتاجية للتهيئة والمتابعة والتعاون الداخلي، مع بقاء قرار التقييم والإسناد خاضعاً للصلاحيات والإجراءات القانونية.",
    icon: Building2,
  },
  supplier: {
    label: "المتعامل الاقتصادي",
    title: "خطط تساعدكم على الوصول والاستعداد دون أفضلية غير مشروعة",
    description: "مطابقة وتنبيهات ومساندة استشارية لتحسين جاهزية الملف، دون حجب الصفقات العامة أو تغيير معايير المنافسة.",
    icon: Store,
  },
};

export default function Pricing() {
  const { direction, isEnglish, locale } = useLocale();
  const auth = trpc.auth.me.useQuery();
  const [audience, setAudience] = useState<Audience>("authority");
  const plansQuery = trpc.subscriptions.plans.useQuery({ audience });
  const upgrade = trpc.subscriptions.requestUpgrade.useMutation({
    onSuccess: result => toast.success(result.message),
    onError: error => toast.error(error.message || "تعذر تسجيل طلب الترقية"),
  });

  useEffect(() => {
    if (auth.data?.role === "supplier" || auth.data?.role === "authority") setAudience(auth.data.role);
  }, [auth.data?.role]);

  const copy = audienceCopy[audience];
  const AudienceIcon = copy.icon;
  const plans = useMemo(() => plansQuery.data ?? [], [plansQuery.data]);
  const signedInForAudience = auth.data?.role === audience;

  return (
    <main dir={direction} className="min-h-screen bg-[#f6f8f7] px-4 py-8 text-[#092e49] dark:bg-slate-950 dark:text-slate-50 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="overflow-hidden rounded-[2rem] border border-[#dce8e2] bg-white shadow-[0_18px_60px_rgba(9,46,73,.07)] dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:p-12">
            <div className="max-w-3xl">
              <Link href="/" className="text-sm font-black text-[#0d8062] transition-colors hover:text-[#092e49] hover:underline dark:text-emerald-300">صفقات ذكية</Link>
              <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#e8f3ee] px-3.5 py-2 text-xs font-black text-[#0d8062] dark:bg-emerald-950/40 dark:text-emerald-200"><Sparkles className="h-4 w-4" />خطط مؤسسية واضحة</div>
              <h1 className="mt-5 max-w-3xl font-[Cairo] text-3xl font-black leading-[1.35] tracking-tight sm:text-5xl">اختر مستوى المساندة الذي يناسب مساحة عملك</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">الاشتراك يضيف أدوات إنتاجية وحصصاً استشارية فقط. لا يشتري أفضلية في المنافسة ولا يحجب الوصول القانوني إلى الصفقات والإجراءات الأساسية.</p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"><ShieldCheck className="mb-3 h-7 w-7" /><strong className="block text-base">ضمان الحياد</strong><span>كل قرار تعاقدي يبقى خاضعاً للجهة المخولة وسجل التدقيق، بصرف النظر عن الخطة.</span></div>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2" role="tablist" aria-label="اختيار نوع الباقة">
              {(["authority", "supplier"] as Audience[]).map(key => {
                const item = audienceCopy[key];
                const Icon = item.icon;
                const active = audience === key;
                return <button key={key} type="button" role="tab" aria-selected={active} onClick={() => setAudience(key)} className={`flex items-center gap-3 rounded-2xl border p-4 text-right transition-all ${active ? "border-[#0d8062] bg-white text-[#092e49] shadow-sm dark:bg-slate-900 dark:text-white" : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-white dark:hover:border-slate-700 dark:hover:bg-slate-900"}`}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${active ? "bg-[#e8f3ee] text-[#0d8062]" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}><Icon className="h-5 w-5" /></span><span><strong className="block text-sm">{item.label}</strong><span className="mt-1 block text-xs leading-5">عرض الباقات المناسبة لهذه البوابة</span></span></button>;
              })}
            </div>
          </div>
        </header>

        <section aria-labelledby="plans-heading">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-black text-[#0d8062]">{copy.label}</p><h2 id="plans-heading" className="mt-1 text-2xl font-black sm:text-3xl">{copy.title}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">{copy.description}</p></div><span className="text-xs font-bold text-slate-400">{plans.length} خطط متاحة حالياً</span></div>
          {plansQuery.isLoading && <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[30rem] rounded-3xl" />)}</div>}
          {plansQuery.isError && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 leading-7 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">تعذر تحميل باقات هذه البوابة حالياً. لا يؤثر ذلك في الوصول إلى الصفقات أو الإجراءات الأساسية.</div>}
          {!plansQuery.isLoading && !plansQuery.isError && plans.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900">لا توجد باقات منشورة لهذه البوابة حالياً.</div>}
          {!plansQuery.isLoading && !plansQuery.isError && plans.length > 0 && <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">{plans.map(plan => {
            const premium = plan.billingCycle !== "free";
            return <Card key={plan.code} className={`flex h-full flex-col overflow-hidden rounded-3xl shadow-sm transition-transform hover:-translate-y-1 ${premium ? "border-[#93d1bb] bg-white dark:border-emerald-900/60 dark:bg-slate-900" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
              {premium && <div className="bg-[#0d8062] px-5 py-2 text-center text-xs font-black text-white">{isEnglish ? "Extended support" : "مساندة موسعة"}</div>}
              <CardHeader className="pb-4"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-lg">{isEnglish ? englishPlanNames[plan.nameAr] ?? "Institutional plan" : plan.nameAr}</CardTitle><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{isEnglish ? plan.billingCycle === "free" ? "Essential and available" : plan.billingCycle === "monthly" ? "Monthly billing" : "Annual billing" : plan.billingCycle === "free" ? "أساسي ومتاح" : plan.billingCycle === "monthly" ? "دفع شهري" : "دفع سنوي"}</p></div>{premium ? <Sparkles className="h-5 w-5 text-amber-600" /> : <LockKeyhole className="h-5 w-5 text-slate-400" />}</div></CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5"><div><span className="text-3xl font-black">{plan.priceDzd.toLocaleString(locale === "en" ? "en-DZ" : "ar-DZ")}</span><span className="mx-1 text-sm text-slate-500">{isEnglish ? "DZD" : "دج"}</span></div><ul className="flex-1 space-y-3 text-sm leading-6">{plan.features.map(feature => <li key={feature.featureCode} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /><span>{(isEnglish ? featureLabelsEn : featureLabels)[feature.featureCode] ?? (isEnglish ? "Institutional productivity feature" : "ميزة إنتاجية مؤسسية")}{feature.quotaLimit ? isEnglish ? ` — ${feature.quotaLimit.toLocaleString("en-DZ")} units` : ` — ${feature.quotaLimit.toLocaleString("ar-DZ")} وحدة` : ""}</span></li>)}</ul>{premium && signedInForAudience ? <Button type="button" className="w-full bg-[#0d8062] hover:bg-[#0b6d52]" disabled={upgrade.isPending} onClick={() => upgrade.mutate({ planCode: plan.code })}>{upgrade.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEnglish ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}{isEnglish ? "Request institutional upgrade" : "طلب الترقية المؤسسية"}</Button> : <Button asChild className="w-full" variant={premium ? "default" : "outline"}><Link href={signedInForAudience ? "/authority" : "/login"}>{isEnglish ? premium ? signedInForAudience ? "Request institutional upgrade" : "Sign in to upgrade" : "Start with basic access" : premium ? signedInForAudience ? "طلب الترقية المؤسسية" : "تسجيل الدخول للترقية" : "البدء بالوصول الأساسي"}</Link></Button>}</CardContent>
            </Card>;
          })}</div>}
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 text-sm leading-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 md:grid-cols-3"><div><strong>متاح دون اشتراك</strong><p className="mt-1 text-slate-600 dark:text-slate-300">تصفح الصفقات المنشورة، الاطلاع الإجرائي، وإيداع العروض المؤهلة وفق شروط الصفقة.</p></div><div><strong>قابل للترقية</strong><p className="mt-1 text-slate-600 dark:text-slate-300">المطابقة والتنبيهات والمساندة الاستشارية وإدارة الفريق والحصص المرتبطة بها.</p></div><div><strong>طلب غير ملزم</strong><p className="mt-1 text-slate-600 dark:text-slate-300">بوابة الدفع غير مفعلة في هذه المرحلة؛ تسجيل الطلب لا ينشئ التزاماً مالياً.</p></div></section>
      </div>
    </main>
  );
}
