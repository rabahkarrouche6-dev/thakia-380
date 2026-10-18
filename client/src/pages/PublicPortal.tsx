import { ArrowLeft, ArrowRight, CheckCircle2, FileCheck2, FileText, LockKeyhole, Network, ShieldCheck, Sparkles, Store, UsersRound } from "lucide-react";
import { Link, useRoute } from "wouter";
import type { PortalKey } from "../../../shared/login";
import { useLocale } from "@/contexts/LocaleContext";

const portalContent: Record<PortalKey, {
  label: string;
  labelEn: string;
  eyebrow: string;
  description: string;
  icon: typeof Store;
  tone: string;
  soft: string;
  actions: string[];
}> = {
  supplier: {
    label: "المتعامل الاقتصادي",
    labelEn: "Economic Operator",
    eyebrow: "مساحة اكتشاف وفرص",
    description: "استكشف كيف تساعدك المنصة على متابعة الصفقات المنشورة وتجهيز عروضك ضمن مسار واضح، قبل تسجيل الدخول إلى مساحة العمل الخاصة بك.",
    icon: Store,
    tone: "#0d8062",
    soft: "#e7f4ee",
    actions: ["استكشاف الصفقات المنشورة بعد الدخول", "استكمال الملف المؤسسي والوثائق", "إيداع العروض ومتابعة حالتها"],
  },
  authority: {
    label: "المصلحة المتعاقدة",
    labelEn: "Contracting Authority",
    eyebrow: "مساحة إدارة الدورة",
    description: "تعرّف على مسار إعداد الصفقة ونشرها ومتابعة العروض والتقييم، ثم انتقل إلى مساحة العمل عند جاهزيتك.",
    icon: UsersRound,
    tone: "#0d5c79",
    soft: "#e8f0f7",
    actions: ["إعداد الصفقة ومراجعة المسودة", "نشر الصفقات ومتابعة العروض", "تنظيم التقييم والقرار ضمن مسار موثق"],
  },
  regulator: {
    label: "الإدارة المركزية",
    labelEn: "Central Administration",
    eyebrow: "مساحة الرقابة والحوكمة",
    description: "استكشف كيف تدعم المنصة المتابعة المركزية وسجل التدقيق وأدوات الذكاء الاصطناعي الاستشارية دون استبدال القرار البشري.",
    icon: ShieldCheck,
    tone: "#092e49",
    soft: "#e8edf1",
    actions: ["متابعة المؤشرات المتاحة فعلياً", "الوصول إلى سجل التدقيق حسب الصلاحية", "استخدام أدوات استشارية قابلة للمراجعة"],
  },
};

export default function PublicPortal() {
  const [, params] = useRoute("/portal/:portal");
  const { isEnglish } = useLocale();
  const portal = (params?.portal ?? "supplier") as PortalKey;
  const content = portalContent[portal] ?? portalContent.supplier;
  const Icon = content.icon;

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7fafc] text-[#122b3c]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1180px] items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#092e49] text-[#b8e5d1] shadow-lg"><ShieldCheck className="h-6 w-6" /></div>
            <div><div className="font-black text-lg leading-tight text-[#092e49]">صفقات ذكية</div><div className="mt-1 text-[10px] text-slate-400">استكشاف البوابات المؤسسية</div></div>
          </Link>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <Link href="/login" className="hidden text-slate-500 transition hover:text-[#0d5c79] sm:inline">اختيار البوابة</Link>
            <Link href={`/login/${portal}`} className="rounded-xl bg-[#092e49] px-4 py-2.5 text-white transition hover:bg-[#0d5c79]">الدخول</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-5 py-12 lg:px-8 lg:py-16">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#092e49] px-6 py-10 text-white shadow-[0_24px_80px_rgba(9,46,73,.15)] sm:px-10 lg:px-14 lg:py-14">
          <div aria-hidden="true" className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-36 right-10 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-emerald-100"><Icon className="h-4 w-4" />{content.eyebrow}</div>
              <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.25] tracking-tight sm:text-5xl">{isEnglish ? `${content.labelEn} Portal` : `بوابة ${content.label}`}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">{content.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/login/${portal}`} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-black text-[#062336] transition hover:-translate-y-0.5 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/50">الدخول إلى البوابة {isEnglish ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}</Link>
                <Link href={`/register/${portal}`} className="inline-flex min-h-12 items-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-bold text-white transition hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40">التسجيل لأول مرة</Link>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/15 bg-white/[.07] p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-4"><span className="text-sm font-bold text-slate-200">ما ستجده هنا</span><div className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: content.soft, color: content.tone }}><Icon className="h-5 w-5" /></div></div>
              <div className="mt-5 space-y-4">{content.actions.map((action) => <div key={action} className="flex items-start gap-3 text-sm leading-7 text-slate-200"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />{action}</div>)}</div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 py-12 sm:grid-cols-3">
          {[
            [FileText, "مسار واضح", "تبدأ من الخطوة المناسبة لدورك، مع معلومات عملية دون ازدحام."],
            [Sparkles, "ذكاء استشاري", "تساعد الأدوات المتاحة على المراجعة والفهم، ويبقى القرار بيد أصحابه."],
            [LockKeyhole, "وصول منضبط", "الاستكشاف متاح للجميع، أما البيانات والعمليات فتظل مرتبطة بالمصادقة والصلاحيات."],
          ].map(([FeatureIcon, title, description]) => <article key={title as string} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid h-11 w-11 place-items-center rounded-xl" style={{ backgroundColor: content.soft, color: content.tone }}><FeatureIcon className="h-5 w-5" /></div><h2 className="mt-5 text-lg font-black text-[#092e49]">{title as string}</h2><p className="mt-2 text-sm leading-7 text-slate-500">{description as string}</p></article>)}
        </section>

        <section className="rounded-2xl border border-[#dbe8ee] bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3"><Network className="mt-1 h-5 w-5 shrink-0 text-[#0d5c79]" /><div><h2 className="font-black text-[#092e49]">صفحة استكشاف عامة</h2><p className="mt-2 text-sm leading-7 text-slate-500">يمكنك الاطلاع على وظيفة هذه البوابة دون تسجيل. لن تظهر بيانات صفقات خاصة، ولن تكون العمليات التعاقدية أو الوثائق متاحة قبل التحقق من هويتك وصلاحياتك.</p></div></div>
        </section>
      </main>
    </div>
  );
}
