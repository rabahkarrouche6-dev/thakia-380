import { ArrowLeft, Check, FileCheck2, Flag, Landmark, Radar, Rocket, ShieldCheck, Sparkles, Trophy, Workflow } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

const capabilities = [
  [ShieldCheck, "صلاحيات مؤسسية واضحة", "كل مستخدم يرى المسار المرتبط بدوره وكيانه، مع بقاء الحماية في الخادم."],
  [FileCheck2, "أثر قابل للمراجعة", "الوثائق والحالات والمواعيد منظمة لتسهيل الفهم والمتابعة دون إخفاء السياق."],
  [Radar, "ذكاء اصطناعي استشاري", "قرائن وملاحظات تساعد على المراجعة، ولا تستبدل الاعتماد أو القرار البشري."],
];

const supplierJourney = [
  [Rocket, "التسجيل الآمن", "أنشئ حسابك المؤسسي وابدأ ملفك القانوني بخطوات واضحة."],
  [FileCheck2, "تجهيز الملف", "أكمل بيانات المتعامل والوثائق الأساسية ليصبح ملفك جاهزاً للتقديم."],
  [Radar, "اكتشاف الفرص", "تابع الصفقات المنشورة واستعمل أدوات الإرشاد لفهم الملاءمة والمتطلبات."],
  [Flag, "إيداع العرض", "حضّر عرضك وتابع حالته من مساحة واحدة مع أثر واضح لكل مرحلة."],
  [Trophy, "الفوز والمتابعة", "استلم النتيجة وتابع العقد والالتزامات من البوابة نفسها."],
] as const;

const authorityJourney = [
  [Workflow, "البرمجة والتخطيط", "حوّل الاحتياج إلى برنامج قابل للمتابعة ومواعيد واضحة."],
  [FileCheck2, "إعداد دفتر الشروط", "نظّم الوثائق والمتطلبات قبل إطلاق الصفقة ضمن مسار مؤسسي منضبط."],
  [Flag, "النشر والاستقبال", "انشر الصفقة واستقبل العروض مع تتبع المواعيد والحالات الحرجة."],
  [Radar, "الفتح والتقييم", "راجع العروض وفق المسار المخول واستفد من المؤشرات الاستشارية دون استبدال القرار."],
  [Trophy, "الترسية والاستلام", "ثبّت النتيجة وتابع العقد والتنفيذ حتى الاستلام مع أثر قابل للمراجعة."],
] as const;

function Journey({ id, label, title, description, steps, accent }: { id: string; label: string; title: string; description: string; steps: ReadonlyArray<readonly [typeof Rocket, string, string]>; accent: "teal" | "gold" }) {
  return (
    <section id={id} className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/75 p-6 shadow-[0_20px_70px_rgba(7,51,74,.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] sm:p-10" aria-labelledby={`${id}-title`}>
      <div aria-hidden="true" className={`absolute -top-28 h-64 w-64 rounded-full blur-3xl ${accent === "teal" ? "-left-20 bg-emerald-400/15" : "-right-20 bg-amber-300/15"}`} />
      <div className="relative">
        <div className="max-w-3xl"><p className={`text-sm font-black ${accent === "teal" ? "text-[var(--landing-teal)]" : "text-amber-600 dark:text-amber-300"}`}>{label}</p><h2 id={`${id}-title`} className="landing-heading mt-3 text-3xl font-black text-[var(--landing-navy)] dark:text-white sm:text-4xl">{title}</h2><p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">{description}</p></div>
        <div className="mt-9 grid gap-4 md:grid-cols-5">
          {steps.map(([Icon, stepTitle, stepDescription], index) => <article key={stepTitle} className="group relative rounded-2xl border border-slate-200/80 bg-white/75 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-within:-translate-y-1 dark:border-white/10 dark:bg-white/[0.055]">
            <div aria-hidden="true" className={`absolute ${index === steps.length - 1 ? "hidden" : "-left-2 top-10 h-px w-4 md:block"} ${accent === "teal" ? "bg-emerald-400/50" : "bg-amber-400/60"}`} />
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent === "teal" ? "bg-emerald-400/15 text-[var(--landing-teal)]" : "bg-amber-400/15 text-amber-600 dark:text-amber-300"}`}><Icon className="h-5 w-5" aria-hidden="true" /></div>
            <span className="mt-4 block text-xs font-black text-slate-500 dark:text-slate-400">المرحلة {index + 1}</span><h3 className="mt-2 text-base font-black text-[var(--landing-navy)] dark:text-white">{stepTitle}</h3><p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">{stepDescription}</p>
          </article>)}
        </div>
      </div>
    </section>
  );
}

export default function Discover() {
  const { direction } = useLocale();
  return (
    <main dir={direction} className="min-h-screen overflow-hidden bg-[var(--landing-paper)] text-[var(--landing-ink)]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 opacity-70 [background-image:radial-gradient(circle_at_12%_12%,rgba(13,128,98,.16),transparent_28%),radial-gradient(circle_at_88%_22%,rgba(212,160,23,.14),transparent_26%),radial-gradient(circle_at_55%_90%,rgba(13,92,121,.13),transparent_32%)] dark:opacity-35" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-8 lg:px-10">
        <header className="algerian-topbar"><span aria-hidden="true" className="algerian-flag-ribbon" /><a href="/" className="algerian-brand" aria-label="العودة إلى الصفحة الرئيسية"><span aria-hidden="true" className="algerian-brand-mark"><Landmark className="h-5 w-5" /></span><span className="algerian-brand-copy"><span className="algerian-brand-kicker">منظومة جزائرية للصفقات العمومية</span><span className="landing-heading algerian-brand-name">صفقات ذكية</span></span><span className="algerian-dz-chip">DZ</span></a><div className="algerian-topbar-utilities"><a href="/" className="algerian-entry-link inline-flex"><ArrowLeft className="h-4 w-4" aria-hidden="true" /><span>العودة للرئيسية</span></a></div></header>
        <section className="relative mt-6 overflow-hidden rounded-[2.5rem] border border-white/15 bg-[#071b2d] px-6 py-14 text-center text-white shadow-[0_35px_100px_rgba(4,22,38,.25)] sm:px-12 sm:py-20 lg:px-20 lg:py-24"><div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(0,184,121,.28),transparent_30%),radial-gradient(circle_at_83%_24%,rgba(212,160,23,.22),transparent_28%),radial-gradient(circle_at_55%_95%,rgba(35,160,200,.2),transparent_34%),linear-gradient(135deg,rgba(7,27,45,.98),rgba(8,40,58,.76))]" /><div aria-hidden="true" className="cyber-hero-grid absolute inset-0 opacity-25" /><div aria-hidden="true" className="hero-aurora hero-aurora-one" /><div aria-hidden="true" className="hero-aurora hero-aurora-two" /><div className="relative mx-auto max-w-4xl"><span className="ai-upgrade-kicker border-white/20 bg-white/10 text-emerald-100"><Sparkles className="h-4 w-4" aria-hidden="true" /> اكتشف منظومة صفقات ذكية</span><h1 className="landing-heading mt-7 text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">منصة واحدة، <span className="bg-gradient-to-l from-white via-emerald-100 to-amber-300 bg-clip-text text-transparent">ثلاثة مسارات أوضح</span></h1><p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">صفقات ذكية هي مساحة رقمية جزائرية تساعد أطراف دورة الصفقات العمومية على العمل ضمن مسارات مترابطة، بصلاحيات واضحة، وأدوات استشارية تحافظ على القرار بيد الإنسان.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><a href="/login" className="inline-flex min-h-13 items-center gap-2 rounded-2xl bg-emerald-300 px-6 py-4 font-black text-[#062336] transition hover:-translate-y-1 hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/50 motion-reduce:transform-none">اختر بوابتك وابدأ <ArrowLeft className="h-5 w-5" /></a><a href="#portals" className="inline-flex min-h-13 items-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 font-bold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40">استكشف المسارات</a></div></div></section>
        <div className="space-y-8"><Journey id="supplier-journey" label="رحلة المتعامل الاقتصادي" title="من التسجيل إلى الفوز" description="مسار عملي يرافق المتعامل خطوة بخطوة من إنشاء الملف المؤسسي إلى متابعة النتيجة والعقد." steps={supplierJourney} accent="teal" /><Journey id="authority-journey" label="رحلة المصلحة المتعاقدة" title="من البرمجة والتخطيط إلى الترسية والاستلام" description="دورة عمل مترابطة تساعد المصلحة على تنظيم الصفقة، استقبال العروض، تثبيت النتيجة، ومتابعة الاستلام." steps={authorityJourney} accent="gold" /></div>
        <section className="mt-8 rounded-[2rem] border border-emerald-500/15 bg-white/70 p-6 shadow-[0_20px_70px_rgba(7,51,74,.08)] backdrop-blur-xl dark:bg-white/5 sm:p-10" aria-labelledby="capabilities-title"><div className="max-w-2xl"><p className="text-sm font-bold text-[var(--landing-teal)]">لماذا المنصة؟</p><h2 id="capabilities-title" className="landing-heading mt-3 text-3xl font-black text-[var(--landing-navy)] dark:text-white sm:text-4xl">وضوح في المسار، وانضباط في القرار</h2></div><div className="mt-8 grid gap-4 md:grid-cols-3">{capabilities.map(([Icon, title, description]) => <article key={title as string} className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"><Icon className="h-6 w-6 text-[var(--landing-teal)]" aria-hidden="true" /><h3 className="mt-4 font-black text-[var(--landing-navy)] dark:text-white">{title as string}</h3><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{description as string}</p></article>)}</div></section>
        <section className="relative mt-8 overflow-hidden rounded-[2rem] bg-[var(--landing-navy)] px-6 py-12 text-white sm:px-10 sm:py-14"><div aria-hidden="true" className="absolute -left-12 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" /><div aria-hidden="true" className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-amber-300/15 blur-3xl" /><div className="relative flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center"><div><p className="text-sm font-bold text-emerald-200">خطوتك التالية واضحة</p><h2 className="landing-heading mt-3 text-3xl font-black sm:text-4xl">ابدأ من البوابة المناسبة لك</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">يمكنك العودة إلى الصفحة الرئيسية أو الدخول مباشرة لاختيار البوابة واستكمال المسار المؤسسي الآمن.</p></div><a href="/login" className="inline-flex min-h-13 shrink-0 items-center gap-2 rounded-2xl bg-emerald-300 px-6 py-4 font-black text-[#062336] transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/50">اختيار البوابة <ArrowLeft className="h-5 w-5" aria-hidden="true" /></a></div></section>
        <footer className="flex flex-col gap-4 border-t border-slate-200/70 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-slate-400"><span>صفقات ذكية — بنية رقمية مؤسسية للصفقات العمومية</span><a href="/" className="font-semibold transition hover:text-[var(--landing-teal)]">العودة إلى الرئيسية</a></footer>
      </div>
    </main>
  );
}
