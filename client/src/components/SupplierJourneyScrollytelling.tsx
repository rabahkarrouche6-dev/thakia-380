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
      className="landing-section my-8 relative scroll-mt-8 overflow-hidden rounded-3xl border border-[#135041] bg-[#0A2E24] p-6 sm:p-10 lg:p-14 text-white shadow-sm"
    >
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#1C6B55] bg-[#135041] px-4 py-2 text-xs font-semibold text-[#D1F4E7] shadow-sm">
          <Sparkles className="h-4 w-4 text-[#C79A3C]" /> رحلة المتعامل الاقتصادي
        </div>
        <h2 className="landing-heading mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
          من الاكتشاف إلى التتويج
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[#D1F4E7]">
          مسار واضح يساعدك على الانتقال من ملف مؤسسي منظم إلى عرض متابع وموثق،
          مع بقاء القرار النهائي لدى الجهات المخولة.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-[#D1F4E7]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1C6B55] bg-[#135041] px-3.5 py-1.5"><span className="h-2 w-2 rounded-full bg-[#087F5B]" /> المسار موثق</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1C6B55] bg-[#135041] px-3.5 py-1.5"><Clock3 className="h-3.5 w-3.5 text-[#63B99C]" /> الأجل يحدده الخادم</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1C6B55] bg-[#135041] px-3.5 py-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#63B99C]" /> القرار بشري</span>
        </div>
      </div>

      <div className="relative mx-auto mt-12 max-w-5xl">
        <div
          aria-hidden="true"
          className="absolute bottom-8 start-[1.15rem] top-8 w-1 rounded-full bg-[#135041] sm:start-1/2 sm:-translate-x-1/2"
        >
          <span
            className="absolute inset-x-0 top-0 rounded-full bg-[#087F5B] transition-[height] duration-700 ease-out motion-reduce:transition-none"
            style={{ height: isVisible ? progress : "0%" }}
          />
          <span
            className="absolute -right-1 top-0 h-3.5 w-3.5 rounded-full border-2 border-[#0A2E24] bg-[#63B99C] transition-[top] duration-700 ease-out motion-reduce:transition-none"
            style={{
              top: isVisible ? `calc(${progress} - 0.35rem)` : "-0.35rem",
            }}
          />
        </div>

        <div className="journey-opposed-pairs space-y-8 sm:space-y-12" role="list">
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
                <span className={`h-px flex-1 origin-right transition-colors duration-300 ${pairIsActive ? "bg-[#087F5B]" : "bg-[#1C6B55]"}`} />
                <span className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border font-mono text-[11px] font-bold tracking-wider transition-colors duration-300 ${pairIsActive ? "border-[#63B99C] bg-[#135041] text-white shadow-sm" : "border-[#1C6B55] bg-[#0A2E24] text-[#D1F4E7]"}`}>
                  {pair.map(item => item.number).join("·")}
                </span>
                <span className={`h-px flex-1 origin-left transition-colors duration-300 ${pairIsActive ? "bg-[#087F5B]" : "bg-[#1C6B55]"}`} />
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
                            className={`group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border p-6 text-start outline-none transition-all duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#087F5B] ${active ? "border-[#63B99C] bg-[#175C4B] shadow-md" : "border-[#1C6B55] bg-[#135041]"}`}
                          >
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={`rounded-xl p-2.5 transition-colors ${active ? "bg-[#087F5B] text-white" : "bg-[#1C6B55] text-[#63B99C]"}`}
                              >
                                <Icon className="h-5 w-5" />
                              </span>
                              <span className="text-xs font-semibold tracking-wider text-[#63B99C]">
                                {eyebrow}
                              </span>
                            </div>
                            <span className="rounded-full border border-[#1C6B55] bg-[#0A2E24] px-2.5 py-1 font-mono text-xs font-bold text-[#D1F4E7]">
                              {number}
                            </span>
                          </div>
                          <h3 className="mt-4 text-xl sm:text-2xl font-bold text-white">{title}</h3>
                          <p className="mt-2 text-sm leading-relaxed text-[#D1F4E7]">{description}</p>
                          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#A7F3D0]">
                            <span className="inline-block h-px w-5 bg-[#63B99C]" />
                            <span>{handoff}</span>
                          </div>
                        </div>
                        <div
                          className={`mt-6 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${active ? "border-[#63B99C]/50 bg-[#087F5B]/20 text-[#63B99C]" : "border-[#1C6B55] bg-[#0A2E24] text-[#D1F4E7]"}`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {detail}
                        </div>
                          </a>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={10} className="bg-[#041D17] text-white border border-[#135041]">
                          {cue} · اضغط للانتقال إلى التفاصيل
                        </TooltipContent>
                      </Tooltip>
                    </article>
                  );
                }
              )}
            </div>
            {pairIndex < milestonePairs.length - 1 && (
              <div className="journey-handoff relative mx-auto flex w-fit items-center gap-2.5 rounded-full border border-[#1C6B55] bg-[#135041] px-4 py-2 text-xs font-medium text-[#D1F4E7] shadow-sm" aria-label="انتقال إلى المرحلة التالية">
                <ArrowDown className="h-4 w-4 text-[#63B99C]" aria-hidden="true" />
                <span>انتقال موثق إلى الخطوة التالية</span>
              </div>
            )}
            </Fragment>
            );
          })}
        </div>
      </div>

      <div className="relative mx-auto mt-12 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-[#1C6B55] bg-[#135041] p-6 text-center sm:flex-row sm:text-right shadow-sm">
        <p className="text-sm leading-relaxed text-[#D1F4E7]">
          ابدأ من المسار الفعلي، وراجع كل خطوة قبل اتخاذ القرار المناسب.
        </p>
        <a
          href="/login"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#087F5B] hover:bg-[#066A4C] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#087F5B]/30"
        >
          الدخول إلى المنصة <ArrowLeft className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
