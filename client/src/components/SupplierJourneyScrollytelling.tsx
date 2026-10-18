import { Fragment, useEffect, useRef, useState, type MouseEvent } from "react";
import {
  ArrowDown,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  LockKeyhole,
  Radar,
  Route,
  Sparkles,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const milestones = [
  {
    id: "footprint",
    number: "01",
    eyebrow: "البداية",
    title: "البصمة الذكية",
    description:
      "أكمل ملف مؤسستك لتصبح بياناتك أساساً لمطابقة إرشادية أكثر صلة، دون ادعاء أهلية أو نتيجة مسبقة.",
    icon: FileText,
    detail: "بيانات ملف واضحة وقابلة للمراجعة",
    handoff: "ملف منظم ← جاهز للاكتشاف",
    cue: "ابدأ من البيانات الفعلية",
  },
  {
    id: "radar",
    number: "02",
    eyebrow: "الاكتشاف",
    title: "رادار الفرص",
    description:
      "استكشف الصفقات المنشورة التي تتقاطع مع بيانات ملفك، مع تفسير للعوامل المستخدمة في ترتيب النتائج.",
    icon: Radar,
    detail: "الصفقات المنشورة فقط",
    handoff: "فرصة منشورة ← قرار مدروس",
    cue: "قارن قبل أن تختار",
  },
  {
    id: "prepare",
    number: "03",
    eyebrow: "الاستعداد",
    title: "تجهيز العرض",
    description:
      "راجع متطلبات الصفقة وجهّز عرضك عبر المسار الفعلي، واحرص على الإرسال قبل الأجل الذي يحدده الخادم.",
    icon: Route,
    detail: "مراجعة بشرية قبل الإرسال",
    handoff: "متطلبات واضحة ← عرض مستعد",
    cue: "تحقق من كل مستند",
  },
  {
    id: "submit",
    number: "04",
    eyebrow: "المتابعة",
    title: "الإرسال والمتابعة",
    description:
      "أرسل العرض ضمن الأجل وتابع حالته في حدود الصلاحيات المتاحة. الذكاء مساعد، والقرار لدى الجهات المخولة.",
    icon: LockKeyhole,
    detail: "تدفق موثق وحالات واضحة",
    handoff: "إرسال موثق ← متابعة مستمرة",
    cue: "اعرف الخطوة التالية",
  },
];

const milestonePairs = [milestones.slice(0, 2), milestones.slice(2, 4)];

export default function SupplierJourneyScrollytelling() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [interactionIndex, setInteractionIndex] = useState<number | null>(null);

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
      { threshold: 0.12, rootMargin: "0px 0px -12% 0px" }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const index = milestones.findIndex(
            milestone =>
              milestone.id === (visible.target as HTMLElement).dataset.milestone
          );
          if (index >= 0) setActiveIndex(index);
        }
      },
      { threshold: [0.35, 0.58, 0.8], rootMargin: "-18% 0px -35% 0px" }
    );

    section
      .querySelectorAll<HTMLElement>("[data-milestone]")
      .forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const highlightedIndex = interactionIndex ?? activeIndex;
  const progress = `${(highlightedIndex / (milestones.length - 1)) * 100}%`;

  const handleMilestoneNavigation = (event: MouseEvent<HTMLAnchorElement>, milestoneId: string) => {
    event.preventDefault();
    const target = document.getElementById(`journey-detail-${milestoneId}`);
    if (!target) return;

    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
    window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
  };

  return (
    <section
      ref={sectionRef}
      id="supplier-journey"
      className="relative scroll-mt-8 overflow-hidden rounded-[2.25rem] border border-[var(--landing-navy)]/10 bg-[var(--landing-navy)] px-5 py-20 text-white shadow-[0_30px_80px_rgba(13,45,72,.16)] sm:px-10 lg:px-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_12%_16%,rgba(45,210,153,.2),transparent_25%),radial-gradient(circle_at_90%_80%,rgba(52,142,190,.2),transparent_30%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-emerald-200/70 to-transparent"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-white/10 px-4 py-2 text-xs font-bold text-emerald-100">
          <Sparkles className="h-4 w-4" /> رحلة المتعامل الاقتصادي
        </div>
        <h2 className="landing-heading mt-5 text-3xl font-black leading-tight sm:text-5xl">
          من الاكتشاف إلى التتويج
        </h2>
        <p className="mt-5 text-sm leading-8 text-slate-200 sm:text-base">
          مسار واضح يساعدك على الانتقال من ملف مؤسسي منظم إلى عرض متابع وموثق،
          مع بقاء القرار النهائي لدى الجهات المخولة.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-slate-300">
          <span className="journey-status-pill"><span className="journey-status-dot" /> المسار موثق</span>
          <span className="journey-status-pill"><Clock3 className="h-3.5 w-3.5 text-emerald-200" /> الأجل يحدده الخادم</span>
          <span className="journey-status-pill"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" /> القرار بشري</span>
        </div>
      </div>

      <div className="relative mx-auto mt-16 max-w-5xl">
        <div
          aria-hidden="true"
          className="absolute bottom-8 start-[1.15rem] top-8 w-1 rounded-full bg-white/10 sm:start-1/2 sm:-translate-x-1/2"
        >
          <span
            className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-emerald-200 via-emerald-400 to-cyan-300 transition-[height] duration-1000 ease-out motion-reduce:transition-none"
            style={{ height: isVisible ? progress : "0%" }}
          />
          <span
            className="absolute -right-1.5 top-0 h-4 w-4 rounded-full border-4 border-[var(--landing-navy)] bg-emerald-300 shadow-[0_0_22px_rgba(110,231,183,.8)] transition-[top] duration-1000 ease-out motion-reduce:transition-none"
            style={{
              top: isVisible ? `calc(${progress} - 0.4rem)` : "-0.4rem",
            }}
          />
        </div>

        <div className="journey-opposed-pairs space-y-10 sm:space-y-14" role="list">
          {milestonePairs.map((pair, pairIndex) => {
            const pairIsActive = pair.some(
              milestone => milestones.findIndex(item => item.id === milestone.id) === highlightedIndex
            );

            return (
            <Fragment key={`journey-pair-${pairIndex + 1}`}>
            <div
              key={`journey-pair-${pairIndex + 1}`}
              className="relative grid grid-cols-1 items-stretch gap-5 pr-10 sm:grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)] sm:gap-7 sm:pr-0"
            >
              <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 hidden w-[5.5rem] -translate-x-1/2 -translate-y-1/2 items-center sm:flex">
                <span className={`h-px flex-1 origin-right bg-white/20 transition-[transform,background-color] duration-500 ${pairIsActive ? "scale-x-100 bg-emerald-200/80" : "scale-x-75"} motion-reduce:transition-none`} />
                <span className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border text-[10px] font-black tracking-[.1em] transition-[transform,background-color,border-color,box-shadow] duration-500 ${pairIsActive ? "scale-110 border-emerald-100 bg-emerald-200 text-[var(--landing-navy)] shadow-[0_0_24px_rgba(110,231,183,.55)]" : "border-white/20 bg-[var(--landing-navy)] text-emerald-100"} motion-reduce:transition-none`}>
                  {pair.map(item => item.number).join("·")}
                </span>
                <span className={`h-px flex-1 origin-left bg-white/20 transition-[transform,background-color] duration-500 ${pairIsActive ? "scale-x-100 bg-emerald-200/80" : "scale-x-75"} motion-reduce:transition-none`} />
              </div>
              {pair.map(
                ({ id, number, eyebrow, title, description, icon: Icon, detail, handoff, cue }, cardIndex) => {
                  const index = milestones.findIndex(milestone => milestone.id === id);
                  const active = index === highlightedIndex;
                  return (
                    <article
                      key={id}
                      data-milestone={id}
                      role="listitem"
                      className={`journey-opposed-card relative min-h-[15rem] text-start transition-[opacity,transform] duration-700 ease-out ${cardIndex === 0 ? "sm:col-start-1" : "sm:col-start-3"} ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none`}
                      style={{
                        transitionDelay: isVisible ? `${index * 130}ms` : "0ms",
                      }}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={`#journey-detail-${id}`}
                            aria-controls={`journey-detail-${id}`}
                            aria-label={`${title}: ${cue}`}
                            title="عرض تفاصيل المرحلة"
                            onClick={event => handleMilestoneNavigation(event, id)}
                            onFocus={() => setInteractionIndex(index)}
                            onBlur={() => setInteractionIndex(null)}
                            onMouseEnter={() => setInteractionIndex(index)}
                            onMouseLeave={() => setInteractionIndex(null)}
                            className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border p-6 text-start outline-none transition-[transform,box-shadow,border-color,background-color] duration-300 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:ring-4 focus-visible:ring-emerald-200/35 ${active ? "border-emerald-200/40 bg-white/12 shadow-[0_18px_48px_rgba(0,0,0,.18)]" : "border-white/10 bg-white/[.06]"} motion-reduce:transform-none motion-reduce:transition-none`}
                          >
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -inset-x-1/2 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent opacity-70 transition-transform duration-700 group-hover:translate-x-full motion-reduce:transition-none"
                        />
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`rounded-2xl p-3 ${active ? "bg-emerald-200 text-[var(--landing-navy)]" : "bg-white/10 text-emerald-100"}`}
                            >
                              <Icon className="h-6 w-6" />
                            </span>
                            <span className="text-xs font-bold tracking-[.14em] text-emerald-200">
                              {eyebrow}
                            </span>
                          </div>
                          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-black tracking-[.16em] text-emerald-100">
                            {number}
                          </span>
                        </div>
                        <h3 className="mt-5 text-2xl font-black text-white">{title}</h3>
                        <p className="mt-3 text-sm leading-8 text-slate-200">{description}</p>
                        <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-emerald-100/80">
                          <span className="journey-step-line" />
                          <span>{handoff}</span>
                        </div>
                        <div
                          className={`mt-auto inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${active ? "bg-emerald-200/15 text-emerald-100" : "bg-white/5 text-slate-300"}`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {detail}
                        </div>
                          </a>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={10} className="bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                          {cue} · اضغط للانتقال إلى التفاصيل
                        </TooltipContent>
                      </Tooltip>
                    </article>
                  );
                }
              )}
            </div>
            {pairIndex < milestonePairs.length - 1 && (
              <div className={`journey-handoff relative mx-auto flex w-fit items-center gap-3 rounded-full border px-4 py-2 text-[11px] font-bold transition-[border-color,background-color,color,box-shadow] duration-500 ${pairIsActive ? "border-emerald-200/40 bg-emerald-200/10 text-emerald-100 shadow-[0_0_22px_rgba(110,231,183,.12)]" : "border-white/10 bg-white/[.04] text-slate-400"}`} aria-label="انتقال إلى المرحلة التالية">
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
                <span>انتقال موثق إلى الخطوة التالية</span>
              </div>
            )}
            </Fragment>
            );
          })}
        </div>
      </div>

      <div className="relative mx-auto mt-12 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/10 p-5 text-center sm:flex-row sm:text-right">
        <p className="text-sm leading-7 text-slate-200">
          ابدأ من المسار الفعلي، وراجع كل خطوة قبل اتخاذ القرار المناسب.
        </p>
        <a
          href="/login"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-200 px-5 py-3 text-sm font-black text-[var(--landing-navy)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/30 motion-reduce:transition-none"
        >
          الدخول إلى المنصة <ArrowLeft className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
