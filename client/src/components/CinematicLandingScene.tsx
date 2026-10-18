import { useEffect, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  FileText,
  Network,
  Radar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const toneClasses = {
  teal: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  blue: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  gold: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  navy: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
} as const;

const scenes = [
  {
    id: "footprint",
    number: "01",
    eyebrow: "البصمة",
    title: "ملف قابل للمراجعة",
    description: "ابدأ ببيانات مؤسستك الفعلية، لتظهر قدراتك ضمن ملف واضح يمكن مراجعته وتحديثه.",
    Icon: FileText,
    tone: "teal",
    signal: "بيانات موثقة",
  },
  {
    id: "radar",
    number: "02",
    eyebrow: "الرادار",
    title: "اكتشاف الفرص المنشورة",
    description: "تساعد المطابقة الإرشادية على ترتيب الصفقات المنشورة ذات الصلة، مع إبقاء القرار والبحث بيدك.",
    Icon: Radar,
    tone: "blue",
    signal: "فرص ذات صلة",
  },
  {
    id: "prepare",
    number: "03",
    eyebrow: "المساعد",
    title: "مراجعة قبل الإرسال",
    description: "راجع اكتمال العرض والمتطلبات بملاحظات استشارية؛ لا قبول تلقائي ولا وعد بالأهلية أو الفوز.",
    Icon: Network,
    tone: "gold",
    signal: "قرارك أولاً",
  },
  {
    id: "submit",
    number: "04",
    eyebrow: "التتويج",
    title: "أثر واضح حتى النهاية",
    description: "اتبع الحالة والإجراءات عبر مسارات المنصة الفعلية، مع بقاء الاعتماد النهائي لدى المستخدم المخوّل.",
    Icon: ShieldCheck,
    tone: "navy",
    signal: "تتبع مستمر",
  },
] as const;

export default function CinematicLandingScene() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="cinematic-scene-title"
      className="cinematic-impact-section landing-section relative isolate overflow-hidden border-y border-slate-200/70 py-20 dark:border-white/10 sm:py-28"
    >
      <div className="cinematic-impact-noise" aria-hidden="true" />
      <div className="cinematic-impact-orb cinematic-impact-orb-one" aria-hidden="true" />
      <div className="cinematic-impact-orb cinematic-impact-orb-two" aria-hidden="true" />

      <div className="relative grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:items-center lg:gap-16">
        <div className="relative lg:sticky lg:top-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--landing-border)] bg-white/60 px-3 py-1.5 text-xs font-bold text-[var(--landing-teal-deep)] shadow-sm backdrop-blur-md dark:bg-white/[.06] dark:text-[var(--landing-mint)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--landing-gold)]" aria-hidden="true" />
            المشهد الافتتاحي
          </div>
          <h2
            id="cinematic-scene-title"
            className="landing-heading max-w-xl text-4xl font-black leading-tight text-[var(--landing-navy)] dark:text-white sm:text-6xl"
          >
            من البيانات
            <span className="cinematic-impact-title-accent"> إلى الأثر</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
            رحلة بصرية قصيرة توضّح أين تساعد المنصة، وأين يبقى القرار البشري واضحاً وموثقاً.
          </p>
          <div className="mt-8 flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="cinematic-impact-pulse h-2.5 w-2.5 rounded-full bg-[var(--landing-live)]" />
            مسار مؤسسي قابل للتتبع
          </div>

          <div className="relative mx-auto mt-10 hidden h-48 max-w-sm lg:block" aria-hidden="true">
            <svg viewBox="0 0 420 120" className="h-full w-full overflow-visible" role="presentation">
              <path d="M12 88 C105 16 170 105 246 42 C306 0 348 48 408 18" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-200 dark:text-white/10" />
              <path d="M12 88 C105 16 170 105 246 42 C306 0 348 48 408 18" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" pathLength="1" className={`cinematic-path text-[var(--landing-teal)] ${isVisible ? "cinematic-path-visible" : ""}`} />
              {[12, 138, 267, 408].map((cx, index) => (
                <g key={cx}>
                  <circle cx={cx} cy={index % 2 ? 66 : index === 2 ? 42 : index === 3 ? 18 : 88} r="10" className="fill-[var(--landing-paper)] stroke-[var(--landing-teal)]" strokeWidth="3" />
                  <text x={cx} y={(index % 2 ? 70 : index === 2 ? 46 : index === 3 ? 22 : 92)} textAnchor="middle" className="fill-[var(--landing-navy)] text-[9px] font-bold dark:fill-white">{index + 1}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="relative">
          <div className="cinematic-impact-grid" aria-label="مراحل التحول من البيانات إلى الأثر">
            {scenes.map(({ id, number, eyebrow, title, description, Icon, tone, signal }, index) => {
              const isEven = index % 2 === 1;
              return (
                <article
                  id={`journey-detail-${id}`}
                  key={number}
                  tabIndex={-1}
                  className={`cinematic-scene-card cinematic-impact-card group landing-glass-card rounded-[1.75rem] p-5 shadow-sm transition-[opacity,transform,box-shadow,border-color] duration-700 ease-out hover:-translate-y-2 hover:border-[var(--landing-teal)]/45 hover:shadow-[0_24px_55px_rgba(13,45,72,.16)] focus-within:border-[var(--landing-teal)]/60 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none dark:border-white/10 dark:bg-white/[.045] ${isVisible ? "cinematic-card-visible" : ""}`}
                  style={{ transitionDelay: isVisible ? `${index * 120}ms` : "0ms" }}
                >
                  <div className="cinematic-impact-card-shine" aria-hidden="true" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-current/15 ${toneClasses[tone]}`}>
                      <Icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" aria-hidden="true" />
                      <span className="absolute -right-2 -top-2 rounded-full bg-[var(--landing-navy)] px-2 py-0.5 text-[10px] font-black text-white shadow-lg dark:bg-[var(--landing-teal)]">{number}</span>
                    </div>
                    <span className="rounded-full border border-[var(--landing-border)] bg-white/45 px-2.5 py-1 text-[10px] font-bold text-[var(--landing-teal-deep)] dark:bg-white/[.06] dark:text-[var(--landing-mint)]">{signal}</span>
                  </div>
                  <div className="relative mt-7">
                    <p className="text-xs font-bold tracking-wide text-[var(--landing-teal)]">{eyebrow}</p>
                    <h3 className="mt-1 text-xl font-black text-[var(--landing-navy)] dark:text-white sm:text-2xl">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
                  </div>
                  <div className="relative mt-6 flex items-center justify-between border-t border-slate-200/70 pt-4 text-xs font-bold text-slate-500 dark:border-white/10 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-[var(--landing-teal)]" aria-hidden="true" /> أثر قابل للتتبع</span>
                    {isEven ? <ArrowDownLeft className="h-4 w-4 text-[var(--landing-gold)] transition-transform duration-300 group-hover:-translate-x-1 group-hover:translate-y-1" aria-hidden="true" /> : <ArrowUpRight className="h-4 w-4 text-[var(--landing-gold)] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />}
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-6 text-slate-500 dark:text-slate-400">
            الذكاء الاصطناعي هنا استشاري فقط؛ لا يحل محل التحقق البشري أو الصلاحيات النظامية.
          </p>
        </div>
      </div>
    </section>
  );
}
