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
  teal: "bg-[#E6F4EF] text-[#05543D] border-[#C9E7DC]",
  blue: "bg-[#E8F8F2] text-[#135041] border-[#C9E7DC]",
  gold: "bg-[#FBF5E7] text-[#634616] border-[#F4E6C4]",
  navy: "bg-[#E8F8F2] text-[#0A2E24] border-[#A7F3D0]",
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
      className="landing-section my-8 rounded-3xl border border-[#E2E8F0] bg-white p-6 sm:p-10 lg:p-12 shadow-sm"
    >
      <div className="relative grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:items-center lg:gap-14">
        <div className="relative lg:sticky lg:top-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-1.5 text-xs font-semibold text-[#066A4C] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#C79A3C]" aria-hidden="true" />
            المشهد الافتتاحي
          </div>
          <h2
            id="cinematic-scene-title"
            className="landing-heading max-w-xl text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-[#111827]"
          >
            من البيانات
            <span className="text-[#087F5B]"> إلى الأثر</span>
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#4B5563]">
            رحلة بصرية قصيرة توضّح أين تساعد المنصة، وأين يبقى القرار البشري واضحاً وموثقاً.
          </p>
          <div className="mt-6 flex items-center gap-2.5 text-xs font-semibold text-[#4B5563]">
            <span className="h-2 w-2 rounded-full bg-[#087F5B]" />
            مسار مؤسسي قابل للتتبع
          </div>

          <div className="relative mx-auto mt-8 hidden h-44 max-w-sm lg:block" aria-hidden="true">
            <svg viewBox="0 0 420 120" className="h-full w-full overflow-visible" role="presentation">
              <path d="M12 88 C105 16 170 105 246 42 C306 0 348 48 408 18" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#E2E8F0]" />
              <path d="M12 88 C105 16 170 105 246 42 C306 0 348 48 408 18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" pathLength="1" className={`cinematic-path text-[#087F5B] ${isVisible ? "cinematic-path-visible" : ""}`} />
              {[12, 138, 267, 408].map((cx, index) => (
                <g key={cx}>
                  <circle cx={cx} cy={index % 2 ? 66 : index === 2 ? 42 : index === 3 ? 18 : 88} r="10" className="fill-white stroke-[#087F5B]" strokeWidth="2.5" />
                  <text x={cx} y={(index % 2 ? 70 : index === 2 ? 46 : index === 3 ? 22 : 92)} textAnchor="middle" className="fill-[#0A2E24] font-mono text-[10px] font-bold">{index + 1}</text>
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
                  className={`group rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#A7F3D0] hover:shadow-md flex flex-col justify-between ${isVisible ? "cinematic-card-visible" : ""}`}
                  style={{ transitionDelay: isVisible ? `${index * 120}ms` : "0ms" }}
                >
                  <div>
                    <div className="relative flex items-start justify-between gap-4">
                      <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${toneClasses[tone]}`}>
                        <Icon className="h-6 w-6" aria-hidden="true" />
                        <span className="absolute -right-2 -top-2 rounded-full bg-[#0A2E24] px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow-sm">{number}</span>
                      </div>
                      <span className="rounded-full border border-[#C9E7DC] bg-[#E6F4EF] px-2.5 py-1 text-xs font-semibold text-[#05543D]">{signal}</span>
                    </div>
                    <div className="mt-5">
                      <p className="text-xs font-semibold text-[#066A4C]">{eyebrow}</p>
                      <h3 className="mt-1 text-lg font-bold text-[#111827]">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">{description}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-[#E2E8F0] pt-4 text-xs font-medium text-[#4B5563]">
                    <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-[#087F5B]" aria-hidden="true" /> أثر قابل للتتبع</span>
                    {isEven ? <ArrowDownLeft className="h-4 w-4 text-[#C79A3C]" aria-hidden="true" /> : <ArrowUpRight className="h-4 w-4 text-[#C79A3C]" aria-hidden="true" />}
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-[#4B5563]">
            الذكاء الاصطناعي هنا استشاري فقط؛ لا يحل محل التحقق البشري أو الصلاحيات النظامية.
          </p>
        </div>
      </div>
    </section>
  );
}
