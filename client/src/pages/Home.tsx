import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  FileSearch,
  Download,
  Heart,
  Landmark,
  Loader2,
  MessageCircle,
  Menu,
  Moon,
  Radar,
  Route,
  Search,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";
import { trackProductEvent } from "@/lib/analytics";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocale } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";
import SupplierJourneyScrollytelling from "@/components/SupplierJourneyScrollytelling";
import CinematicLandingScene from "@/components/CinematicLandingScene";
import CyberParticleField from "@/components/CyberParticleField";
import LanguageToggle from "@/components/LanguageToggle";
import LiveStatusBadge from "@/components/LiveStatusBadge";

const audienceCards = [
  {
    icon: Landmark,
    label: "للإدارة المركزية",
    title: "رؤية رقابية تستند إلى قرائن",
    description:
      "تجميع إشارات قابلة للمراجعة، مع الحفاظ على حدود الصلاحية ووضوح أثر القرار البشري.",
    href: "/login",
  },
  {
    icon: Building2,
    label: "للمصلحة المتعاقدة",
    title: "مسار أوضح من المسودة إلى النشر",
    description:
      "إنشاء الصفقات ومراجعة دفاتر الشروط ومتابعة العروض ضمن دورة عمل منظمة.",
    href: "/login",
  },
  {
    icon: Users,
    label: "للمتعامل الاقتصادي",
    title: "فرص أوضح وعروض أكثر انضباطاً",
    description:
      "تصفح الصفقات المنشورة، استكمل ملف المؤسسة، وقدّم العرض من المسار المخصص لك.",
    href: "/login",
  },
];

const lifecycle = [
  ["01", "تحديد الحاجة", "ابدأ من معطيات واضحة وملف صفقة منظم."],
  ["02", "إعداد ومراجعة", "استخدم أدوات استشارية قبل اعتماد الوثائق."],
  ["03", "نشر واستقبال", "افتح مساراً واضحاً للمتعاملين المؤهلين."],
  ["04", "فتح وتتبع", "احفظ الأثر وتابع المراحل بصلاحيات موثقة."],
];

const activePillars = [
  {
    id: "radar",
    icon: Radar,
    eyebrow: "للإدارة المركزية",
    title: "الرادار الرقابي",
    description:
      "قرائن استشارية قابلة للتفسير تساعد على توجيه المراجعة، دون اعتبارها قراراً نهائياً أو إثباتاً لمخالفة.",
    points: ["إشارات من البيانات الفعلية", "حماية للبيانات الحساسة", "قرار نهائي بشري وموثق"],
  },
  {
    id: "authority",
    icon: FileSearch,
    eyebrow: "للمصلحة المتعاقدة",
    title: "تدقيق دفتر الشروط",
    description:
      "مساعد يراجع المسودة المحفوظة ويقترح ملاحظات حول الاكتمال والصياغات التي تستحق المراجعة قبل النشر.",
    points: ["فحص حتمي قابل للإعادة", "مراجعة لغوية استشارية", "لا تعديل أو نشر تلقائي"],
  },
  {
    id: "matching",
    icon: Route,
    eyebrow: "للمتعامل الاقتصادي",
    title: "المطابقة الإرشادية",
    description:
      "ترتيب إرشادي للصفقات المنشورة ذات الصلة ببيانات الملف، مع تفسير للعوامل المستخدمة في الترتيب.",
    points: ["الصفقات المنشورة فقط", "نتائج قابلة للتفسير", "ليست وعداً بالفوز أو الأهلية"],
  },
];

const roadmap = ["مساعد التقييم", "تحليل الأسعار المرجعية", "متابعة التنفيذ"];


const legalReferences = [
  {
    id: "procurement",
    category: "الصفقات العمومية",
    law: "القانون 23-12",
    description: "القواعد العامة للصفقات ومبادئ حرية الوصول والمساواة والشفافية.",
    summary: "مرجع أساسي لفهم المبادئ العامة وإجراءات الصفقات العمومية.",
    href: "https://www.mf.gov.dz/images/pdf/reglementation/A2023051marchAR.pdf",
    tone: "emerald",
  },
  {
    id: "data",
    category: "حماية المعطيات",
    law: "القانون 18-07",
    description: "حماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي.",
    summary: "يوضح الضوابط العامة لمعالجة البيانات وحقوق الأشخاص المعنيين.",
    href: "https://www.arpce.dz/ar/pub/c7e6n6",
    tone: "sky",
  },
  {
    id: "commerce",
    category: "المعاملات الرقمية",
    law: "القانون 18-05",
    description: "الإطار المنظم للتجارة الإلكترونية والمعاملات ذات الصلة.",
    summary: "يضع سياقاً قانونياً للمعاملات والتبادل التجاري عبر الوسائط الرقمية.",
    href: "https://www.arpce.dz/ar/pub/z2g9u7",
    tone: "violet",
  },
  {
    id: "signature",
    category: "التوقيع الإلكتروني",
    law: "القانون 15-04",
    description: "القواعد العامة المتعلقة بالتوقيع والتصديق الإلكترونيين.",
    summary: "يساعد على فهم متطلبات الثقة والتصديق في الوثائق الإلكترونية.",
    href: "https://www.commerce.gov.dz/reglementation/loi-n-deg-15-04",
    tone: "amber",
  },
] as const;

const legalFilters = ["الكل", ...legalReferences.map(reference => reference.category)] as const;

const faqs = [
  ["هل الذكاء الاصطناعي يتخذ القرار بدلاً عن المستخدم؟", "لا. الأدوات تعرض ملاحظات أو قرائن استشارية، وتبقى المراجعة والاعتماد لدى المستخدم المخول."],
  ["هل يمكن لكل طرف رؤية بيانات الأطراف الأخرى؟", "لا. الوصول مرتبط بالدور والكيان ومسار الصفقة، ولا تستبدل الواجهة ضوابط الخادم."],
  ["كيف أبدأ استخدام المنصة؟", "اختر البوابة المناسبة من صفحة الدخول، ثم أنشئ حسابك المؤسسي عبر المسار المتاح واستكمل بيانات المؤسسة."],
  ["هل المنصة متاحة على الهاتف؟", "نعم، صُممت الواجهة العربية لتعمل على الشاشات الصغيرة مع الحفاظ على وضوح المسارات وحالات التحميل والخطأ."],
];

const arabicNumber = new Intl.NumberFormat("ar-DZ");

const timeZoneOptions = [
  { value: "Africa/Algiers", label: "الجزائر (GMT+1)" },
  { value: "Africa/Casablanca", label: "الدار البيضاء" },
  { value: "Europe/Paris", label: "باريس" },
  { value: "Asia/Riyadh", label: "الرياض" },
  { value: "UTC", label: "التوقيت العالمي" },
] as const;

type SupportedTimeZone = (typeof timeZoneOptions)[number]["value"];

function getPreferredTimeZone(): SupportedTimeZone {
  if (typeof window === "undefined") return "Africa/Algiers";
  const stored = window.localStorage.getItem("landing-timezone");
  return timeZoneOptions.some(option => option.value === stored)
    ? stored as SupportedTimeZone
    : "Africa/Algiers";
}

function useLiveDateTime() {
  const [dateTime, setDateTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setDateTime(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return dateTime;
}

function useAnimatedCount(target: number, shouldStart: boolean) {
  const [count, setCount] = useState(0);
  const hasStarted = useRef(false);
  const lastTarget = useRef(target);

  useEffect(() => {
    if (lastTarget.current !== target) {
      lastTarget.current = target;
      hasStarted.current = false;
    }
    if (!shouldStart || hasStarted.current) return;
    hasStarted.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || target === 0) {
      setCount(target);
      return;
    }

    const duration = 820;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      setCount(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [shouldStart, target]);

  return count;
}

export default function Home() {
  const [arePillarsVisible, setArePillarsVisible] = useState(false);
  const [areHeroStatsVisible, setAreHeroStatsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [legalQuery, setLegalQuery] = useState("");
  const [activeLegalFilter, setActiveLegalFilter] = useState<(typeof legalFilters)[number]>("الكل");
  const [selectedLegalIds, setSelectedLegalIds] = useState<string[]>(legalReferences.map(reference => reference.id));
  const [favoriteLegalIds, setFavoriteLegalIds] = useState<string[]>([]);
  const [legalQuestion, setLegalQuestion] = useState("");
  const [legalAnswer, setLegalAnswer] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState<SupportedTimeZone>(getPreferredTimeZone);
  const pillarsRef = useRef<HTMLDivElement | null>(null);
  const heroStatsRef = useRef<HTMLDivElement | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { direction, isEnglish } = useLocale();
  const { data: landingStats, isError: hasLandingStatsError } = trpc.landing.stats.useQuery(undefined, {
    staleTime: 45_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
  const legalAssistant = trpc.landing.legalAssistant.useMutation({ onSuccess: result => setLegalAnswer(result.content) });
  const legalSummaryPdf = trpc.landing.legalSummaryPdf.useMutation({
    onSuccess: result => {
      const link = document.createElement("a");
      link.href = `data:${result.mimeType};base64,${result.dataBase64}`;
      link.download = result.fileName;
      link.click();
    },
  });
  const dateTime = useLiveDateTime();
  const publishedTenderCount = useAnimatedCount(landingStats?.published ?? 0, areHeroStatsVisible);
  const bidCount = useAnimatedCount(landingStats?.bids ?? 0, areHeroStatsVisible);
  const awardedTenderCount = useAnimatedCount(landingStats?.awarded ?? 0, areHeroStatsVisible);
  const displayLocale = isEnglish ? "en-GB" : "ar-DZ";
  const numberFormatter = new Intl.NumberFormat(displayLocale);
  const formattedTime = dateTime.toLocaleTimeString(displayLocale, { timeZone, hour: "2-digit", minute: "2-digit", hour12: false });
  const formattedDate = dateTime.toLocaleDateString(displayLocale, { timeZone, weekday: "short", day: "numeric", month: "short" });
  const hasLiveLandingStats = Boolean(landingStats) && !hasLandingStatsError;
  const normalizedLegalQuery = legalQuery.trim().toLocaleLowerCase("ar");
  const visibleLegalReferences = legalReferences.filter(reference => {
    const matchesFilter = activeLegalFilter === "الكل" || reference.category === activeLegalFilter;
    const searchableText = `${reference.category} ${reference.law} ${reference.description} ${reference.summary}`.toLocaleLowerCase("ar");
    return matchesFilter && (!normalizedLegalQuery || searchableText.includes(normalizedLegalQuery));
  });

  useEffect(() => {
    trackProductEvent("landing_viewed");
    try {
      const stored = JSON.parse(window.localStorage.getItem("legal-framework-favorites") || "[]");
      if (Array.isArray(stored)) setFavoriteLegalIds(stored.filter((id): id is string => legalReferences.some(reference => reference.id === id)));
    } catch {
      setFavoriteLegalIds([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("legal-framework-favorites", JSON.stringify(favoriteLegalIds));
  }, [favoriteLegalIds]);

  useEffect(() => {
    const section = pillarsRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      setArePillarsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArePillarsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ticker = heroStatsRef.current;
    if (!ticker || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAreHeroStatsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setAreHeroStatsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(ticker);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    window.localStorage.setItem("landing-timezone", timeZone);
  }, [timeZone]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileMenuOpen]);

  const scrollToSection = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  };

  const handleHeroScroll = (event: MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    scrollToSection(targetId);
  };

  const handleMobileNavigation = (event: MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    setIsMobileMenuOpen(false);
    scrollToSection(targetId);
  };

  return (
    <main dir={direction} className="landing-page min-h-screen bg-[#F5F7FA] text-[#111827]">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-6 lg:px-10 max-[640px]:px-2 max-[640px]:py-3">
        <div className="mb-4 flex items-center justify-center gap-3 border-b border-[#E2E8F0] pb-3 text-center max-[640px]:gap-2" aria-label="الهوية الرسمية">
          <img src="/manus-storage/algeria-republic-emblem_af169b8a.png" alt="شعار الجمهورية الجزائرية الديمقراطية الشعبية" className="h-10 w-10 shrink-0 object-contain max-[640px]:h-8 max-[640px]:w-8" />
          <p className="font-['Cairo'] text-xl sm:text-2xl font-bold leading-none tracking-tight text-[#0A2E24] max-[640px]:text-sm">الجمهورية الجزائرية الديمقراطية الشعبية</p>
        </div>
        <header className="algerian-topbar">
          <span aria-hidden="true" className="algerian-flag-ribbon" />
          <a href="/" className="algerian-brand" aria-label={isEnglish ? "Smart Deals home" : "الصفحة الرئيسية لصفقات ذكية"}>
            <span aria-hidden="true" className="algerian-brand-mark"><Landmark className="h-5 w-5" /></span>
            <span className="algerian-brand-copy">
              <span className="algerian-brand-kicker">{isEnglish ? "Algerian procurement workspace" : "منظومة جزائرية للصفقات العمومية"}</span>
              <span className="landing-heading algerian-brand-name">صفقات ذكية</span>
            </span>
            <span className="algerian-dz-chip" aria-label={isEnglish ? "Algerian context" : "سياق جزائري"}>DZ</span>
          </a>
          <nav aria-label={isEnglish ? "Primary navigation" : "التنقل الرئيسي"} className="algerian-primary-nav hidden lg:flex">
            <a href="#platform">المنصة</a>
            <a href="#ai-suite">الذكاء الاصطناعي</a>
            <a href="#faq">الأسئلة الشائعة</a>
            <a href="/status" className="algerian-status-link"><span aria-hidden="true" />حالة المنصة</a>
          </nav>
          <div className="algerian-topbar-utilities">
            <button
              type="button"
              className="mobile-menu-toggle lg:hidden min-h-[44px] min-w-[44px]"
              aria-label={isMobileMenuOpen ? "إغلاق قائمة التنقل" : "فتح قائمة التنقل"}
              aria-controls="mobile-landing-navigation"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(open => !open)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
            <div className="topbar-live-time min-h-[44px]" aria-label={`الوقت والتاريخ الحاليان: ${formattedTime}، ${formattedDate}`}>
              <span className="topbar-time-icon" aria-hidden="true"><Clock3 className="h-4 w-4" /></span>
              <span className="topbar-time-content">
                <span className="topbar-time-label">الوقت المحلي</span>
                <time dateTime={dateTime.toISOString()} dir="ltr">{formattedTime}</time>
              </span>
              <span className="topbar-live-date"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /><span>{formattedDate}</span></span>
            </div>
            <LanguageToggle className="topbar-language-toggle max-lg:!hidden lg:!inline-flex min-h-[44px]" />
            <button
              type="button"
              onClick={toggleTheme}
              className="topbar-theme-toggle min-h-[44px] min-w-[44px]"
              aria-label={theme === "light" ? (isEnglish ? "Enable dark mode" : "تفعيل الوضع الليلي") : (isEnglish ? "Enable light mode" : "تفعيل الوضع النهاري")}
              aria-pressed={theme === "dark"}
              title={theme === "light" ? (isEnglish ? "Dark mode" : "الوضع الليلي") : (isEnglish ? "Light mode" : "الوضع النهاري")}
            >
              {theme === "light" ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
            </button>
            <a href="/login" onClick={() => trackProductEvent("registration_started")} className="algerian-entry-link hidden lg:inline-flex min-h-[44px]"><span>الدخول للمنصة</span><ArrowLeft className="h-4 w-4" aria-hidden="true" /></a>
          </div>
          {isMobileMenuOpen ? (
            <nav id="mobile-landing-navigation" aria-label="التنقل على الهاتف" className="mobile-landing-navigation lg:hidden">
              <a href="#platform" onClick={event => handleMobileNavigation(event, "platform")}>المنصة</a>
              <a href="#ai-suite" onClick={event => handleMobileNavigation(event, "ai-suite")}>الذكاء الاصطناعي</a>
              <a href="#faq" onClick={event => handleMobileNavigation(event, "faq")}>الأسئلة الشائعة</a>
              <a href="/status">حالة المنصة</a>
              <a href="/login" onClick={() => trackProductEvent("registration_started")}>الدخول للمنصة</a>
              <LanguageToggle className="w-full justify-center min-h-[44px]" />
              <div className="mobile-timezone-field">
                <label htmlFor="landing-timezone-mobile">المنطقة الزمنية</label>
                <select id="landing-timezone-mobile" value={timeZone} onChange={event => setTimeZone(event.target.value as SupportedTimeZone)} className="topbar-timezone-select min-h-[44px]" aria-label="اختر المنطقة الزمنية">
                  {timeZoneOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </nav>
          ) : null}
        </header>
        <nav aria-label="التنقل الرئيسي للأقسام" className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-semibold text-[#111827] shadow-sm max-[640px]:mt-3 max-[640px]:gap-1 max-[640px]:rounded-xl max-[640px]:px-2 max-[640px]:py-1.5 max-[640px]:text-xs">
          <a href="/" className="min-h-[44px] inline-flex items-center rounded-xl px-4 py-2 transition-colors hover:bg-[#E6F4EF] hover:text-[#066A4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F5B] max-[640px]:px-2.5 max-[640px]:py-1.5">الرئيسية</a>
          <a href="#platform" className="min-h-[44px] inline-flex items-center rounded-xl px-4 py-2 transition-colors hover:bg-[#E6F4EF] hover:text-[#066A4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F5B] max-[640px]:px-2.5 max-[640px]:py-1.5">الخدمات</a>
          <a href="#ai-suite" className="min-h-[44px] inline-flex items-center rounded-xl px-4 py-2 transition-colors hover:bg-[#E6F4EF] hover:text-[#066A4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F5B] max-[640px]:px-2.5 max-[640px]:py-1.5">الذكاء الاصطناعي</a>
          <a href="#faq" className="min-h-[44px] inline-flex items-center rounded-xl px-4 py-2 transition-colors hover:bg-[#E6F4EF] hover:text-[#066A4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F5B] max-[640px]:px-2.5 max-[640px]:py-1.5">الأسئلة الشائعة</a>
          <a href="/status" className="min-h-[44px] inline-flex items-center rounded-xl px-4 py-2 transition-colors hover:bg-[#E6F4EF] hover:text-[#066A4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F5B] max-[640px]:px-2.5 max-[640px]:py-1.5">حالة المنصة</a>
        </nav>

        <section className="relative isolate mt-6 flex min-h-[30rem] items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl border border-[#135041] bg-[#0A2E24] px-6 py-12 text-center text-white shadow-md sm:min-h-[36rem] sm:px-10 sm:py-16 lg:px-14 lg:py-20">
          <div className="relative z-10 flex max-w-4xl flex-col items-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C79A3C]/40 bg-[#135041] px-4 py-2 text-xs font-semibold text-[#D1F4E7] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C79A3C]" aria-hidden="true" />
              <Sparkles className="h-4 w-4 text-[#C79A3C]" /> منظومة رقمية لدورة الصفقات
            </div>
            <h1 className="landing-heading m-0 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              <span className="text-white">صفقات </span><span className="text-white">ذكية</span>
            </h1>
            <div className="my-5 h-1 w-16 rounded-full bg-[#C79A3C]" aria-hidden="true" />
            <div ref={heroStatsRef} className="hero-statistics-ticker mt-4 grid w-full max-w-2xl grid-cols-3 overflow-hidden rounded-2xl border border-[#1C6B55] bg-[#135041] text-white shadow-sm">
              <div className="hero-statistic p-3 sm:p-4 border-e border-[#1C6B55] last:border-e-0">
                <strong className="hero-stat-count font-mono font-bold text-2xl sm:text-3xl text-white block">{hasLiveLandingStats ? numberFormatter.format(publishedTenderCount) : "—"}</strong>
                <span className="text-xs text-[#D1F4E7] mt-1 block font-medium">مناقصات منشورة</span>
              </div>
              <div className="hero-statistic p-3 sm:p-4 border-e border-[#1C6B55] last:border-e-0">
                <strong className="hero-stat-count font-mono font-bold text-2xl sm:text-3xl text-white block">{hasLiveLandingStats ? numberFormatter.format(bidCount) : "—"}</strong>
                <span className="text-xs text-[#D1F4E7] mt-1 block font-medium">عروض مسجلة</span>
              </div>
              <div className="hero-statistic p-3 sm:p-4 border-e border-[#1C6B55] last:border-e-0">
                <strong className="hero-stat-count font-mono font-bold text-2xl sm:text-3xl text-white block">{hasLiveLandingStats ? numberFormatter.format(awardedTenderCount) : "—"}</strong>
                <span className="text-xs text-[#D1F4E7] mt-1 block font-medium">قرارات إسناد</span>
              </div>
            </div>
            <p className="sr-only" aria-live="polite">{hasLiveLandingStats ? "الإحصاءات معروضة من بيانات تشغيلية محدثة." : "يتعذر حالياً جلب الإحصاءات التشغيلية."}</p>
            <p className="mt-6 max-w-3xl text-base font-normal leading-relaxed text-[#D1F4E7] sm:mt-8 sm:text-lg">صفقات ذكية تجمع الإدارة المركزية، المصلحة المتعاقدة، والمتعامل الاقتصادي داخل دورة رقمية مترابطة؛ بأدوات استشارية تساعد على المراجعة، دون أن تستبدل القرار البشري.</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4 sm:mt-9">
              <a href="/discover" className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#087F5B] hover:bg-[#066A4C] px-8 py-3 text-base sm:text-lg font-semibold text-white transition-colors duration-150 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#087F5B]/30">اكتشف المنصة <ArrowLeft className="h-5 w-5" /></a>
              <a href="#platform" onClick={event => handleHeroScroll(event, "platform")} className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[#D1F4E7]/50 hover:border-[#D1F4E7] bg-transparent hover:bg-white/5 px-6 py-3 text-sm sm:text-base font-semibold text-[#D1F4E7] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D1F4E7]/30">كيف تعمل المنصة؟</a>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-[#D1F4E7] sm:mt-8">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#63B99C]" /> صلاحيات واضحة</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#63B99C]" /> أثر قابل للتتبع</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#63B99C]" /> واجهة عربية RTL</span>
            </div>
          </div>
        </section>

        <section id="platform" className="landing-section my-8 rounded-3xl border border-[#E2E8F0] bg-white p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[#066A4C]">لماذا صفقات ذكية؟</p>
              <h2 className="landing-heading mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111827]">رقمنة المسار لا تعقيد العمل</h2>
            </div>
            <p className="max-w-2xl text-base leading-relaxed text-[#4B5563]">من أول مسودة إلى تتبع الأثر، تجمع المنصة الأدوات في مساحة واحدة وتفصل بين ما هو مؤتمت، وما هو استشاري، وما يتطلب اعتماداً بشرياً.</p>
          </div>
          <div className="lifecycle-opposed-grid mt-8 grid gap-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6" role="list">
            {lifecycle.map(([number, title, description]) => (
              <article key={number} role="listitem" className="lifecycle-opposed-card rounded-2xl border border-[#E2E8F0] bg-[#F5F7FA] p-6 text-[#111827] shadow-sm transition-all duration-200 hover:border-[#A7F3D0] hover:bg-white hover:shadow-md">
                <span className="font-mono text-base font-bold text-[#087F5B]">{number}</span>
                <h3 className="mt-4 text-xl font-bold text-[#111827]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-label="ملخص المنصة" className="my-8 rounded-2xl border border-[#E2E8F0] bg-[#F5F7FA] p-6 shadow-sm">
          <div className="grid gap-4 text-center sm:grid-cols-3">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <p className="font-mono text-3xl sm:text-4xl font-extrabold text-[#0A2E24] tabular-nums">3</p>
              <p className="mt-1.5 text-sm font-medium text-[#4B5563]">بوابات متخصصة</p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <p className="font-mono text-3xl sm:text-4xl font-extrabold text-[#0A2E24] tabular-nums">0</p>
              <p className="mt-1.5 text-sm font-medium text-[#4B5563]">قرارات آلية بديلة</p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <p className="font-mono text-3xl sm:text-4xl font-extrabold text-[#0A2E24] tabular-nums">24/7</p>
              <p className="mt-1.5 text-sm font-medium text-[#4B5563]">مسار حالة قابل للمراجعة</p>
            </div>
          </div>
        </section>

        <CinematicLandingScene />
        <SupplierJourneyScrollytelling />

        <section className="landing-section my-8 rounded-3xl border border-[#E2E8F0] bg-[#F5F7FA] p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#066A4C]">مصمم حسب الدور</p>
            <h2 className="landing-heading mt-2 text-3xl sm:text-4xl font-extrabold text-[#111827]">كل مستخدم يرى المسار الذي يخصه</h2>
            <p className="mt-3 text-base leading-relaxed text-[#4B5563]">لا تبدأ من لوحة مزدحمة. ابدأ من هدفك، ثم انتقل داخل أدوات ومعلومات مرتبطة بصلاحيتك ومسؤوليتك.</p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {audienceCards.map(({ icon: Icon, label, title, description, href }) => {
              const isContractingAuthority = label === "للمصلحة المتعاقدة";
              return (
                <article
                  key={label}
                  className={`rounded-2xl border p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between ${
                    isContractingAuthority
                      ? "border-[#135041] bg-[#0A2E24] text-white"
                      : "border-[#E2E8F0] bg-white text-[#111827]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className={`rounded-xl p-3 ${isContractingAuthority ? "bg-[#135041] text-[#C79A3C] border border-[#1C6B55]" : "bg-[#E6F4EF] text-[#087F5B]"}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className={`text-xs font-semibold ${isContractingAuthority ? "text-[#D1F4E7]" : "text-[#4B5563]"}`}>{label}</span>
                    </div>
                    <h3 className={`mt-5 text-xl font-bold ${isContractingAuthority ? "text-white" : "text-[#111827]"}`}>{title}</h3>
                    <p className={`mt-3 text-sm leading-relaxed ${isContractingAuthority ? "text-[#D1F4E7]" : "text-[#4B5563]"}`}>{description}</p>
                  </div>
                  <a
                    href={href}
                    className={`mt-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                      isContractingAuthority
                        ? "text-[#63B99C] hover:text-white focus-visible:ring-[#63B99C]"
                        : "text-[#066A4C] hover:text-[#05543D] focus-visible:ring-[#087F5B]"
                    }`}
                  >
                    اختيار البوابة <ArrowLeft className="h-4 w-4" />
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        <section id="ai-suite" className="landing-section my-8 rounded-3xl border border-[#E2E8F0] bg-white p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#066A4C]">الذكاء الاصطناعي تحت الإشراف</p>
            <h2 className="landing-heading mt-2 text-3xl sm:text-4xl font-extrabold text-[#111827]">أدوات تساعدك على المراجعة لا تتخذ القرار عنك</h2>
            <p className="mt-3 text-base leading-relaxed text-[#4B5563]">النتائج مبنية على البيانات المتاحة داخل المنصة، وتُعرض بصياغة قابلة للفهم والمراجعة.</p>
          </div>
          <div ref={pillarsRef} className="mt-8 grid gap-5 lg:grid-cols-3">
            {activePillars.map(({ id, icon: Icon, eyebrow, title, description, points }, index) => (
              <article
                id={id}
                key={id}
                tabIndex={0}
                style={{ transitionDelay: arePillarsVisible ? `${index * 110}ms` : "0ms" }}
                className={`group/card relative isolate overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm outline-none transition-all duration-300 hover:-translate-y-1 hover:border-[#A7F3D0] hover:shadow-md flex flex-col justify-between ${
                  arePillarsVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-[#C79A3C]" aria-hidden="true" />
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="rounded-xl bg-[#FBF5E7] p-3 text-[#A87C2C] border border-[#F4E6C4]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold text-[#4B5563]">{eyebrow}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-[#111827]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">{description}</p>
                </div>
                <ul className="mt-5 space-y-2.5 border-t border-[#E2E8F0] pt-4 text-sm font-medium text-[#4B5563]">
                  {points.map(point => (
                    <li key={point} className="flex items-start gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#087F5B]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="ai-upgrade" className="landing-section my-8 rounded-3xl border border-[#E2E8F0] bg-[#F5F7FA] p-6 sm:p-10 lg:p-12 shadow-sm" aria-labelledby="ai-upgrade-title">
          <div className="relative">
            <div className="mx-auto max-w-4xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-[#066A4C] shadow-sm">
                <Sparkles className="h-4 w-4 text-[#C79A3C]" aria-hidden="true" /> ترقية مؤسسية بمسار واضح
              </span>
              <h2 id="ai-upgrade-title" className="landing-heading mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827]">
                وسّع الاستفادة من الذكاء الاصطناعي، <span className="text-[#087F5B]">مع بقاء القرار بيدك</span>
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-[#4B5563]">اختر الباقة الملائمة، قدّم طلب الترقية من حساب مؤسستك، ثم تابع الإشعارات داخل البوابة. الأدوات الإرشادية تساعد في المراجعة والتنظيم ولا تمنح أفضلية في المنافسة أو تتخذ قراراً بدلاً من المستخدم المخوّل.</p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[.86fr_1.5fr] lg:gap-6">
              <aside className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#135041] bg-[#0A2E24] p-6 text-white shadow-sm sm:p-8">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#63B99C]">AI CONTROL / 01</span>
                    <span className="h-2 w-2 rounded-full bg-[#087F5B]" aria-label="حالة المسار نشطة" />
                  </div>
                  <h3 className="mt-6 text-2xl sm:text-3xl font-extrabold leading-tight text-white">ابدأ بخطوة واضحة،<br /><span className="text-[#63B99C]">وتابع الأثر بنفسك.</span></h3>
                  <p className="mt-4 text-sm leading-relaxed text-[#D1F4E7]">الترقية تفتح أدوات إرشادية إضافية، بينما تبقى كل موافقة وإجراء ضمن صلاحياتك المؤسسية.</p>
                  <ol className="mt-6 space-y-3" aria-label="خطوات الترقية المؤسسية">
                    {[
                      ["01", "استعرض الباقات", "قارن نطاق الأدوات وفق احتياج مؤسستك."],
                      ["02", "أرسل طلب الترقية", "قدّم الطلب من البوابة بعد تسجيل الدخول."],
                      ["03", "تابع الحالة", "تظهر التحديثات والإجراءات المطلوبة في الإشعارات."]
                    ].map(([step, title, description]) => (
                      <li key={step} className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#135041] border border-[#1C6B55] font-mono text-xs font-bold text-[#63B99C]">{step}</span>
                        <div>
                          <strong className="block text-sm font-semibold text-white">{title}</strong>
                          <small className="block text-xs text-[#D1F4E7] mt-0.5 leading-normal">{description}</small>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
                <a href="/pricing" className="mt-8 inline-flex min-h-[44px] w-fit items-center gap-2 rounded-xl bg-[#087F5B] hover:bg-[#066A4C] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#087F5B]/30">استعرض باقات الترقية <ArrowLeft className="h-4 w-4" /></a>
              </aside>

              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  {
                    label: "للمتعامل الاقتصادي",
                    title: "فرص أوضح، وتحضير أكثر تركيزاً",
                    description: "استفد من المطابقة الإرشادية للفرص المنشورة ومن أسباب الملاءمة والفجوات، ثم راجع المستندات والعروض وفق مسؤولية مؤسستك.",
                    points: ["ترشيحات قابلة للتفسير وليست قراراً آلياً", "متابعة العروض والعقود والتنبيهات من بوابة واحدة"],
                    href: "/login",
                    cta: "الدخول إلى بوابة المتعامل",
                    index: "02"
                  },
                  {
                    label: "للمصلحة المتعاقدة",
                    title: "مراجعة منظمة، ورقابة قابلة للتتبع",
                    description: "استخدم المراجعة الإرشادية لدفاتر الشروط والملخصات التشغيلية للعقود والتنبيهات لتسريع الفهم، مع بقاء الاعتماد والقرار القانوني بيد الجهة المخوّلة.",
                    points: ["نتائج موثقة بملاحظات وأدلة قابلة للمراجعة", "إشعارات ومتابعة مؤسسية عبر دورة الصفقة"],
                    href: "/login",
                    cta: "الدخول إلى بوابة المصلحة",
                    index: "03"
                  }
                ].map(({ label, title, description, points, href, cta, index }) => (
                  <article key={label} className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#A7F3D0] hover:shadow-md">
                    <div className="absolute inset-x-0 top-0 h-1 bg-[#C79A3C]" aria-hidden="true" />
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-[#E8F8F2] px-2.5 py-1 font-mono text-xs font-bold text-[#4B5563]">AI / {index}</span>
                        <Sparkles className="h-4 w-4 text-[#C79A3C]" aria-hidden="true" />
                      </div>
                      <p className="mt-4 text-xs font-semibold text-[#066A4C]">{label}</p>
                      <h3 className="mt-1 text-xl font-bold text-[#111827]">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">{description}</p>
                      <ul className="mt-5 space-y-2 border-t border-[#E2E8F0] pt-4 text-sm font-medium text-[#4B5563]">
                        {points.map(point => (
                          <li key={point} className="flex items-start gap-2.5">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#087F5B]" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <a href={href} className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#066A4C] hover:text-[#05543D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F5B]">{cta} <ArrowLeft className="h-4 w-4" /></a>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="legal-framework" className="landing-section my-8 rounded-3xl border border-[#E2E8F0] bg-white p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="relative">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold text-[#066A4C]">مرجعية مؤسسية</p>
                <h2 className="landing-heading mt-2 text-3xl sm:text-4xl font-extrabold text-[#111827]">الإطار القانوني للمنصة</h2>
                <p className="mt-3 text-base leading-relaxed text-[#4B5563]">تستند «صفقات ذكية» إلى أبرز النصوص الجزائرية المنظمة للصفقات العمومية والرقمنة وحماية المعطيات والتوقيع الإلكتروني، لتكون التقنية خادمة للشفافية والامتثال.</p>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-3 sm:flex-row sm:items-center">
                <p className="text-xs font-medium text-[#4B5563]"><span className="block font-semibold text-[#066A4C]">آخر تحديث</span><time dateTime="2026-08-21">21 أوت 2026</time></p>
                <button type="button" onClick={() => legalSummaryPdf.mutate({ referenceIds: selectedLegalIds })} disabled={legalSummaryPdf.isPending || selectedLegalIds.length === 0} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0A2E24] hover:bg-[#135041] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F5B]">
                  {legalSummaryPdf.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />} تحميل ملخص مخصص ({selectedLegalIds.length})
                </button>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[#E2E8F0] bg-[#F5F7FA] p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <label className="relative flex min-h-[44px] flex-1 items-center">
                  <Search className="pointer-events-none absolute start-3 h-4 w-4 text-[#4B5563]" aria-hidden="true" />
                  <input type="search" value={legalQuery} onChange={event => setLegalQuery(event.target.value)} placeholder="ابحث عن قانون أو مجال..." aria-label="البحث في الإطار القانوني" className="min-h-[44px] w-full rounded-xl border border-[#E2E8F0] bg-white pe-4 ps-10 text-sm text-[#111827] outline-none transition placeholder:text-[#4B5563]/60 focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20" />
                </label>
                <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية المراجع القانونية">
                  {legalFilters.map(filter => (
                    <button key={filter} type="button" onClick={() => setActiveLegalFilter(filter)} aria-pressed={activeLegalFilter === filter} className={`min-h-[44px] sm:min-h-[36px] rounded-full px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F5B] ${activeLegalFilter === filter ? "bg-[#087F5B] text-white shadow-sm" : "border border-[#E2E8F0] bg-white text-[#4B5563] hover:bg-[#E6F4EF] hover:text-[#066A4C]"}`}>{filter}</button>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#4B5563]">
                <span>اختر التشريعات التي تريد تضمينها في الملخص المخصص.</span>
                <button type="button" onClick={() => setSelectedLegalIds(visibleLegalReferences.map(reference => reference.id))} className="min-h-[44px] sm:min-h-0 inline-flex items-center font-semibold text-[#066A4C] hover:text-[#05543D] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F5B]">تحديد النتائج الظاهرة</button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {visibleLegalReferences.map(reference => {
                const isSelected = selectedLegalIds.includes(reference.id);
                const isFavorite = favoriteLegalIds.includes(reference.id);
                const badgeColor = reference.tone === "emerald"
                  ? "bg-[#E6F4EF] text-[#05543D] border-[#C9E7DC]"
                  : reference.tone === "amber"
                  ? "bg-[#FBF5E7] text-[#634616] border-[#F4E6C4]"
                  : "bg-[#E8F8F2] text-[#135041] border-[#D1F4E7]";
                return (
                  <article key={reference.id} className={`group rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between ${isSelected ? "border-[#087F5B] bg-white ring-2 ring-[#087F5B]/30" : "border-[#E2E8F0] bg-white"}`}>
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeColor}`}>{reference.category}</span>
                        <button type="button" onClick={() => setFavoriteLegalIds(current => isFavorite ? current.filter(id => id !== reference.id) : [...current, reference.id])} aria-pressed={isFavorite} aria-label={isFavorite ? `إزالة ${reference.law} من المفضلة` : `حفظ ${reference.law} في المفضلة`} className="min-h-[44px] min-w-[44px] rounded-full p-2 text-[#4B5563] transition-colors hover:text-[#C8102E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] flex items-center justify-center">
                          <Heart className={`h-4 w-4 ${isFavorite ? "fill-[#C8102E] text-[#C8102E]" : ""}`} aria-hidden="true" />
                        </button>
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-[#0A2E24]">{reference.law}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">{reference.description}</p>
                    </div>
                    <div>
                      <label className="mt-4 flex min-h-[44px] cursor-pointer items-center gap-2 text-xs font-semibold text-[#4B5563]">
                        <input type="checkbox" checked={isSelected} onChange={() => setSelectedLegalIds(current => isSelected ? current.filter(id => id !== reference.id) : [...current, reference.id])} className="h-4 w-4 rounded border-[#E2E8F0] accent-[#087F5B]" /> تضمين في الملخص
                      </label>
                      <div className="legal-reference-link-wrap group/link relative mt-2 w-fit">
                        <a className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[#066A4C] hover:text-[#05543D] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F5B]" href={reference.href} target="_blank" rel="noreferrer" aria-describedby={`legal-preview-${reference.id}`}>
                          النص الرسمي <ArrowLeft className="ms-1 h-3.5 w-3.5 transition-transform group-hover/link:-translate-x-1" aria-hidden="true" />
                        </a>
                        <span id={`legal-preview-${reference.id}`} role="tooltip" className="legal-law-preview pointer-events-none absolute bottom-full start-0 z-20 mb-3 w-64 rounded-xl border border-[#E2E8F0] bg-white p-3 text-xs font-medium leading-relaxed text-[#111827] opacity-0 shadow-lg transition duration-200 group-hover/link:pointer-events-auto group-hover/link:opacity-100 group-focus-within/link:pointer-events-auto group-focus-within/link:opacity-100">{reference.summary}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
              {visibleLegalReferences.length === 0 && (
                <div className="md:col-span-2 lg:col-span-4 rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F5F7FA] p-8 text-center">
                  <p className="font-bold text-[#0A2E24]">لا توجد مراجع مطابقة</p>
                  <p className="mt-2 text-sm text-[#4B5563]">جرّب كلمة بحث أخرى أو أعد التصفية إلى «الكل».</p>
                </div>
              )}
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F5F7FA] p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F4EF] text-[#05543D]">
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-[#0A2E24] text-base">مساعد الإطار القانوني</h3>
                    <p className="text-xs text-[#4B5563]">اسأل عن المراجع المحددة فقط</p>
                  </div>
                </div>
                <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={event => { event.preventDefault(); setLegalAnswer(null); legalAssistant.mutate({ question: legalQuestion, referenceIds: selectedLegalIds.length ? selectedLegalIds : legalReferences.map(reference => reference.id) }); }}>
                  <input value={legalQuestion} onChange={event => setLegalQuestion(event.target.value)} required minLength={2} maxLength={1200} placeholder="مثال: ما المجال العام للقانون 23-12؟" aria-label="سؤال المساعد القانوني" className="min-h-[44px] flex-1 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm text-[#111827] outline-none placeholder:text-[#4B5563]/60 focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20" />
                  <button type="submit" disabled={legalAssistant.isPending || legalQuestion.trim().length < 2} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#087F5B] hover:bg-[#066A4C] px-5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#087F5B]/30">
                    {legalAssistant.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />} اسأل
                  </button>
                </form>
                {legalAnswer && (
                  <div role="status" className="mt-4 rounded-xl border border-[#C9E7DC] bg-[#E6F4EF] p-4 text-sm leading-relaxed text-[#111827]">
                    <p className="font-bold text-[#05543D]">إجابة إرشادية</p>
                    <p className="mt-2 whitespace-pre-line text-[#111827]">{legalAnswer}</p>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-[#E9CF8B] bg-[#FBF5E7] p-5 text-sm leading-relaxed text-[#634616] shadow-sm">
                <p className="font-bold text-[#634616]">تنبيه الاستخدام</p>
                <p className="mt-2 text-[#634616]">المساعد لا يقدم استشارة قانونية ولا يستبدل النص الرسمي، ولا يتخذ قراراً أو ينفذ إجراءً. تحقق دائماً من آخر إصدار منشور قبل الاعتماد.</p>
                <p className="mt-3 text-xs font-semibold text-[#85601F]">المراجع المحفوظة محلياً في هذا المتصفح: {favoriteLegalIds.length}</p>
              </div>
            </div>
            <p className="relative mt-6 text-xs leading-relaxed text-[#4B5563]">هذه قائمة مرجعية مختصرة وليست استشارة قانونية. قد تخضع النصوص للتعديل؛ ويظل المرجع الملزم هو آخر إصدار منشور في الجريدة الرسمية أو الجهة الحكومية المختصة.</p>
          </div>
        </section>

        <section id="faq" className="landing-section my-8 rounded-3xl border border-[#E2E8F0] bg-[#F5F7FA] p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <p className="text-sm font-semibold text-[#066A4C]">أسئلة قبل البدء</p>
              <h2 className="landing-heading mt-2 text-3xl sm:text-4xl font-extrabold text-[#111827]">وضوح قبل الدخول</h2>
              <p className="mt-3 text-base leading-relaxed text-[#4B5563]">إجابات مختصرة على الأسئلة التي تهم الثقة، الصلاحيات، ودور الذكاء الاصطناعي.</p>
            </div>
            <div className="space-y-3">
              {faqs.map(([question, answer]) => (
                <details key={question} className="group rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 font-bold text-base text-[#0A2E24] marker:hidden">
                    <span>{question}</span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#4B5563] transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 border-t border-[#E2E8F0] pt-4 text-sm leading-relaxed text-[#4B5563]">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative my-8 overflow-hidden rounded-3xl border border-[#135041] bg-[#0A2E24] p-8 sm:p-12 lg:p-16 text-white shadow-sm">
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold text-[#63B99C]">خطوتك التالية واضحة</p>
              <h2 className="landing-heading mt-2 text-3xl sm:text-4xl font-extrabold text-white">اختر بوابتك وابدأ من المسار المناسب</h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#D1F4E7]">لا تحتاج إلى معرفة كل شيء قبل الدخول. صُممت كل بوابة لتقودك إلى الخطوة التالية.</p>
            </div>
            <a href="/discover" className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-[#087F5B] hover:bg-[#066A4C] px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#087F5B]/30">
              اكتشف المنصة <ArrowLeft className="h-5 w-5" />
            </a>
          </div>
        </section>

        <footer className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#135041] bg-[#041D17] px-6 py-6 sm:px-8 text-sm text-[#D1F4E7] sm:flex-row sm:items-center sm:justify-between shadow-sm">
          <span className="font-normal text-[#D1F4E7]">صفقات ذكية — بنية رقمية مؤسسية للصفقات العمومية</span>
          <div className="flex flex-wrap items-center gap-4">
            <LiveStatusBadge />
            <a href="/status" className="min-h-[44px] inline-flex items-center font-medium text-[#A7F3D0] hover:text-white transition-colors">صفحة الحالة التفصيلية</a>
            <a href="/login" className="min-h-[44px] inline-flex items-center font-medium text-[#A7F3D0] hover:text-white transition-colors">اختيار البوابة</a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Building2({ className }: { className?: string }) {
  return <Landmark className={className} />;
}
