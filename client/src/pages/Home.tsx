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
    <main dir={direction} className="landing-page min-h-screen overflow-hidden bg-[var(--landing-paper)] text-[var(--landing-ink)]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 opacity-60 [background-image:radial-gradient(circle_at_15%_10%,rgba(13,128,98,.14),transparent_30%),radial-gradient(circle_at_85%_70%,rgba(13,92,121,.14),transparent_35%)] dark:opacity-35" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-6 lg:px-10 max-[640px]:px-2 max-[640px]:py-3">
        <div className="mb-3 flex items-center justify-center gap-3 border-b border-slate-200/70 pb-3 text-center dark:border-white/10 max-[640px]:gap-2" aria-label="الهوية الرسمية">
          <img src="/manus-storage/algeria-republic-emblem_af169b8a.png" alt="شعار الجمهورية الجزائرية الديمقراطية الشعبية" className="h-12 w-12 shrink-0 object-contain max-[640px]:h-8 max-[640px]:w-8" />
          <p className="font-['Amiri'] text-[32px] font-bold leading-none tracking-[0.02em] text-[#0b5d1e] dark:text-[#8fd19e] max-[640px]:text-[18px]">الجمهورية الجزائرية الديمقراطية الشعبية</p>
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
              className="mobile-menu-toggle lg:hidden"
              aria-label={isMobileMenuOpen ? "إغلاق قائمة التنقل" : "فتح قائمة التنقل"}
              aria-controls="mobile-landing-navigation"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(open => !open)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
            <div className="topbar-live-time" aria-label={`الوقت والتاريخ الحاليان: ${formattedTime}، ${formattedDate}`}>
              <span className="topbar-time-icon" aria-hidden="true"><Clock3 className="h-4 w-4" /></span>
              <span className="topbar-time-content">
                <span className="topbar-time-label">الوقت المحلي</span>
                <time dateTime={dateTime.toISOString()} dir="ltr">{formattedTime}</time>
              </span>
              <span className="topbar-live-date"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /><span>{formattedDate}</span></span>
            </div>
            <LanguageToggle className="topbar-language-toggle max-lg:!hidden lg:!inline-flex" />
            <button
              type="button"
              onClick={toggleTheme}
              className="topbar-theme-toggle"
              aria-label={theme === "light" ? (isEnglish ? "Enable dark mode" : "تفعيل الوضع الليلي") : (isEnglish ? "Enable light mode" : "تفعيل الوضع النهاري")}
              aria-pressed={theme === "dark"}
              title={theme === "light" ? (isEnglish ? "Dark mode" : "الوضع الليلي") : (isEnglish ? "Light mode" : "الوضع النهاري")}
            >
              {theme === "light" ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
            </button>
            <a href="/login" onClick={() => trackProductEvent("registration_started")} className="algerian-entry-link hidden lg:inline-flex"><span>الدخول للمنصة</span><ArrowLeft className="h-4 w-4" aria-hidden="true" /></a>
          </div>
          {isMobileMenuOpen ? (
            <nav id="mobile-landing-navigation" aria-label="التنقل على الهاتف" className="mobile-landing-navigation lg:hidden">
              <a href="#platform" onClick={event => handleMobileNavigation(event, "platform")}>المنصة</a>
              <a href="#ai-suite" onClick={event => handleMobileNavigation(event, "ai-suite")}>الذكاء الاصطناعي</a>
              <a href="#faq" onClick={event => handleMobileNavigation(event, "faq")}>الأسئلة الشائعة</a>
              <a href="/status">حالة المنصة</a>
              <a href="/login" onClick={() => trackProductEvent("registration_started")}>الدخول للمنصة</a>
              <LanguageToggle className="w-full justify-center" />
              <div className="mobile-timezone-field">
                <label htmlFor="landing-timezone-mobile">المنطقة الزمنية</label>
                <select id="landing-timezone-mobile" value={timeZone} onChange={event => setTimeZone(event.target.value as SupportedTimeZone)} className="topbar-timezone-select" aria-label="اختر المنطقة الزمنية">
                  {timeZoneOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </nav>
          ) : null}
        </header>
        <nav aria-label="التنقل الرئيسي للأقسام" className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#0b5d1e]/15 bg-white/75 px-3 py-2 text-sm font-bold text-[#0b5d1e] shadow-sm backdrop-blur-sm dark:border-emerald-200/15 dark:bg-white/5 dark:text-emerald-100 max-[640px]:mt-3 max-[640px]:gap-0.5 max-[640px]:rounded-xl max-[640px]:px-1 max-[640px]:py-1 max-[640px]:text-xs max-[640px]:leading-5">
          <a href="/" className="rounded-xl px-4 py-2 transition-colors hover:bg-[#0b5d1e]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5d1e] dark:hover:bg-white/10 max-[640px]:px-2.5 max-[640px]:py-1.5">الرئيسية</a>
          <a href="#platform" className="rounded-xl px-4 py-2 transition-colors hover:bg-[#0b5d1e]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5d1e] dark:hover:bg-white/10 max-[640px]:px-2.5 max-[640px]:py-1.5">الخدمات</a>
          <a href="#ai-suite" className="rounded-xl px-4 py-2 transition-colors hover:bg-[#0b5d1e]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5d1e] dark:hover:bg-white/10 max-[640px]:px-2.5 max-[640px]:py-1.5">الذكاء الاصطناعي</a>
          <a href="#faq" className="rounded-xl px-4 py-2 transition-colors hover:bg-[#0b5d1e]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5d1e] dark:hover:bg-white/10 max-[640px]:px-2.5 max-[640px]:py-1.5">الأسئلة الشائعة</a>
          <a href="/status" className="rounded-xl px-4 py-2 transition-colors hover:bg-[#0b5d1e]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5d1e] dark:hover:bg-white/10 max-[640px]:px-2.5 max-[640px]:py-1.5">حالة المنصة</a>
        </nav>

        <section className="cyber-hero relative isolate mt-6 flex min-h-[31rem] items-center justify-center overflow-hidden rounded-[2.5rem] max-[640px]:mt-4 max-[640px]:min-h-[29rem] max-[640px]:rounded-[2rem] border border-white/10 bg-[#071b2d] px-6 py-10 text-center text-white shadow-[0_35px_100px_rgba(4,22,38,.28)] sm:min-h-[38rem] sm:px-10 sm:py-16 lg:px-14 lg:py-24">
          <CyberParticleField className="absolute inset-0 -z-10" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(0,184,121,.22),transparent_32%),radial-gradient(circle_at_82%_72%,rgba(212,160,23,.14),transparent_28%),linear-gradient(120deg,rgba(7,27,45,.96),rgba(8,40,58,.78))]" />
          <div aria-hidden="true" className="cyber-hero-grid absolute inset-0 -z-10 opacity-30" />
          <div aria-hidden="true" className="hero-aurora hero-aurora-one" />
          <div aria-hidden="true" className="hero-aurora hero-aurora-two" />
          <div aria-hidden="true" className="hero-starlight hero-starlight-one" />
          <div aria-hidden="true" className="hero-starlight hero-starlight-two" />
          <div aria-hidden="true" className="hero-starlight hero-starlight-three" />
          <div className="relative z-10 flex max-w-4xl flex-col items-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-white/10 px-4 py-2 text-xs font-bold text-emerald-100 shadow-sm"><Sparkles className="h-4 w-4" /> منظومة رقمية لدورة الصفقات</div>
            <h1 className="landing-heading landing-title-reveal m-0 text-5xl font-black leading-[1.15] tracking-tight text-white sm:text-6xl lg:text-8xl">
              <span className="platform-name-crystal-card">
                <span className="landing-title-word platform-name-crystal-text bg-gradient-to-l from-white via-amber-100 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(212,160,23,.35)]">صفقات</span>
                <span className="landing-title-word platform-name-crystal-text cyber-hero-accent">ذكية</span>
              </span>
            </h1>
            <div ref={heroStatsRef} className="hero-statistics-ticker mt-5 grid w-full max-w-2xl grid-cols-3 overflow-hidden rounded-2xl border border-white/15 bg-white/[.07] text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,.12)] backdrop-blur-md">
              <div className="hero-statistic"><strong className="hero-stat-count">{hasLiveLandingStats ? numberFormatter.format(publishedTenderCount) : "—"}</strong><span>مناقصات منشورة</span></div>
              <div className="hero-statistic"><strong className="hero-stat-count">{hasLiveLandingStats ? numberFormatter.format(bidCount) : "—"}</strong><span>عروض مسجلة</span></div>
              <div className="hero-statistic"><strong className="hero-stat-count">{hasLiveLandingStats ? numberFormatter.format(awardedTenderCount) : "—"}</strong><span>قرارات إسناد</span></div>
            </div>
            <p className="sr-only" aria-live="polite">{hasLiveLandingStats ? "الإحصاءات معروضة من بيانات تشغيلية محدثة." : "يتعذر حالياً جلب الإحصاءات التشغيلية."}</p>
            <p className="mt-6 max-w-3xl text-lg font-medium leading-9 text-slate-200 sm:mt-8 sm:text-xl">صفقات ذكية تجمع الإدارة المركزية، المصلحة المتعاقدة، والمتعامل الاقتصادي داخل دورة رقمية مترابطة؛ بأدوات استشارية تساعد على المراجعة، دون أن تستبدل القرار البشري.</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:mt-9">
              <a href="/discover" className="hero-action cyber-hero-cta inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-7 py-4 text-lg font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/50 active:translate-y-0">اكتشف المنصة <ArrowLeft className="h-5 w-5" /></a>
              <a href="#platform" onClick={event => handleHeroScroll(event, "platform")} className="hero-action hero-action-secondary inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/40">كيف تعمل المنصة؟</a>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-300 sm:mt-8"><span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" /> صلاحيات واضحة</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" /> أثر قابل للتتبع</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" /> واجهة عربية RTL</span></div>
          </div>
        </section>

        <section id="platform" className="landing-section py-14 sm:py-16 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="text-sm font-bold text-[var(--landing-teal)]">لماذا صفقات ذكية؟</p><h2 className="landing-heading mt-3 whitespace-nowrap text-[clamp(1.25rem,6vw,3rem)] font-black tracking-tight text-[var(--landing-navy)] dark:text-white sm:text-5xl" style={{color: '#094910', fontSize: '44px'}}>رقمنة المسار لا تعقيد العمل</h2></div><p className="max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">من أول مسودة إلى تتبع الأثر، تجمع المنصة الأدوات في مساحة واحدة وتفصل بين ما هو مؤتمت، وما هو استشاري، وما يتطلب اعتماداً بشرياً.</p></div>
          <div className="lifecycle-opposed-grid mt-10 grid gap-4 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-6" role="list">{lifecycle.map(([number, title, description]) => <article key={number} role="listitem" className="lifecycle-opposed-card landing-glass-card relative rounded-2xl p-5 text-[var(--landing-ink)] transition-[transform,box-shadow,border-color] duration-300"><span className="text-xs font-black text-[var(--landing-teal)]">{number}</span><h3 className="mt-7 text-lg font-black text-[var(--landing-navy)] dark:text-white">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p></article>)}</div>
        </section>

        <section aria-label="ملخص المنصة" className="border-y border-slate-200/70 py-7 dark:border-white/10"><div className="grid gap-4 text-center sm:grid-cols-3"><div><p className="text-2xl font-black text-[var(--landing-navy)] dark:text-white">3</p><p className="mt-1 text-sm text-slate-500">بوابات متخصصة</p></div><div><p className="text-2xl font-black text-[var(--landing-navy)] dark:text-white">0</p><p className="mt-1 text-sm text-slate-500">قرارات آلية بديلة</p></div><div><p className="text-2xl font-black text-[var(--landing-navy)] dark:text-white">24/7</p><p className="mt-1 text-sm text-slate-500">مسار حالة قابل للمراجعة</p></div></div></section>

        <CinematicLandingScene />
        <SupplierJourneyScrollytelling />

        <section className="landing-section py-16 sm:py-18 lg:py-20"><div className="max-w-3xl"><p className="text-sm font-bold text-[var(--landing-teal)]">مصمم حسب الدور</p><h2 className="landing-heading mt-3 text-3xl font-black text-[var(--landing-navy)] dark:text-white sm:text-5xl">كل مستخدم يرى المسار الذي يخصه</h2><p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">لا تبدأ من لوحة مزدحمة. ابدأ من هدفك، ثم انتقل داخل أدوات ومعلومات مرتبطة بصلاحيتك ومسؤوليتك.</p></div><div className="mt-10 grid gap-5 lg:grid-cols-3">{audienceCards.map(({ icon: Icon, label, title, description, href }) => <article key={label} className="landing-glass-card rounded-[1.75rem] p-6 text-[var(--landing-ink)] shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex items-center justify-between"><div className="rounded-2xl bg-[var(--landing-teal)]/10 p-3 text-[var(--landing-teal)]"><Icon className="h-6 w-6" /></div><span className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</span></div><h3 className="mt-6 text-2xl font-black text-[var(--landing-navy)] dark:text-white">{title}</h3><p className="mt-4 min-h-20 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p><a href={href} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--landing-teal)] hover:gap-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--landing-teal)]/20">اختيار البوابة <ArrowLeft className="h-4 w-4" /></a></article>)}</div></section>

        <section id="ai-suite" className="landing-section border-t border-slate-200/70 py-16 sm:py-18 lg:py-20 dark:border-white/10"><div className="max-w-3xl"><p className="text-sm font-bold text-[var(--landing-teal)]">الذكاء الاصطناعي تحت الإشراف</p><h2 className="landing-heading mt-3 text-3xl font-black text-[var(--landing-navy)] dark:text-white sm:text-5xl">أدوات تساعدك على المراجعة لا تتخذ القرار عنك</h2><p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">النتائج مبنية على البيانات المتاحة داخل المنصة، وتُعرض بصياغة قابلة للفهم والمراجعة.</p></div><div ref={pillarsRef} className="mt-10 grid gap-5 lg:grid-cols-3">{activePillars.map(({ id, icon: Icon, eyebrow, title, description, points }, index) => <article id={id} key={id} tabIndex={0} style={{ transitionDelay: arePillarsVisible ? `${index * 110}ms` : "0ms" }} className={`group/card relative isolate overflow-hidden landing-glass-card rounded-[1.75rem] p-6 shadow-sm outline-none transition-[opacity,transform,box-shadow,border-color] duration-700 ease-out hover:-translate-y-2 hover:border-[var(--landing-teal)]/35 hover:shadow-[0_22px_45px_rgba(13,45,72,.14)] focus-visible:-translate-y-2 focus-visible:border-[var(--landing-teal)]/50 dark:border-white/10 dark:bg-white/5 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transform-none motion-reduce:transition-none ${arePillarsVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}><div className="relative flex items-center justify-between gap-4"><div className="rounded-2xl bg-[var(--landing-teal)]/10 p-3 text-[var(--landing-teal)]"><Icon className="h-6 w-6" /></div><span className="text-xs font-bold text-slate-500 dark:text-slate-400">{eyebrow}</span></div><h3 className="relative mt-6 text-2xl font-black text-[var(--landing-navy)] dark:text-white">{title}</h3><p className="relative mt-4 min-h-20 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p><ul className="relative mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">{points.map(point => <li key={point} className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--landing-teal)]" />{point}</li>)}</ul></article>)}</div></section>

        <section id="ai-upgrade" className="ai-upgrade-panorama landing-section relative isolate overflow-hidden border-t border-slate-200/70 py-16 dark:border-white/10 sm:py-20 lg:py-24" aria-labelledby="ai-upgrade-title">
          <div aria-hidden="true" className="ai-upgrade-aurora ai-upgrade-aurora-one" />
          <div aria-hidden="true" className="ai-upgrade-aurora ai-upgrade-aurora-two" />
          <div aria-hidden="true" className="ai-upgrade-stars" />
          <div className="relative">
            <div className="mx-auto max-w-4xl text-center">
              <span className="ai-upgrade-kicker"><Sparkles className="h-4 w-4" aria-hidden="true" /> ترقية مؤسسية بمسار واضح</span>
              <h2 id="ai-upgrade-title" className="landing-heading mt-5 text-3xl font-black text-[var(--landing-navy)] dark:text-white sm:text-5xl lg:text-6xl">وسّع الاستفادة من الذكاء الاصطناعي، <span className="ai-upgrade-title-glow">مع بقاء القرار بيدك</span></h2>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">اختر الباقة الملائمة، قدّم طلب الترقية من حساب مؤسستك، ثم تابع الإشعارات داخل البوابة. الأدوات الإرشادية تساعد في المراجعة والتنظيم ولا تمنح أفضلية في المنافسة أو تتخذ قراراً بدلاً من المستخدم المخوّل.</p>
            </div>

            <div className="ai-upgrade-panorama-shell mt-10 grid gap-5 lg:grid-cols-[.86fr_1.5fr] lg:gap-6">
              <aside className="ai-upgrade-command relative overflow-hidden rounded-[2rem] p-6 text-white sm:p-8">
                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-center justify-between gap-4"><span className="text-xs font-black uppercase tracking-[.2em] text-emerald-200">AI CONTROL / 01</span><span className="ai-upgrade-live-dot" aria-label="حالة المسار نشطة" /></div>
                  <h3 className="mt-10 text-3xl font-black leading-tight">ابدأ بخطوة واضحة،<br /><span className="text-emerald-200">وتابع الأثر بنفسك.</span></h3>
                  <p className="mt-5 text-sm leading-7 text-slate-300">الترقية تفتح أدوات إرشادية إضافية، بينما تبقى كل موافقة وإجراء ضمن صلاحياتك المؤسسية.</p>
                  <ol className="mt-8 space-y-4" aria-label="خطوات الترقية المؤسسية">
                    {[["01", "استعرض الباقات", "قارن نطاق الأدوات وفق احتياج مؤسستك."], ["02", "أرسل طلب الترقية", "قدّم الطلب من البوابة بعد تسجيل الدخول."], ["03", "تابع الحالة", "تظهر التحديثات والإجراءات المطلوبة في الإشعارات."]].map(([step, title, description]) => <li key={step} className="ai-upgrade-step"><span>{step}</span><span><strong>{title}</strong><small>{description}</small></span></li>)}
                  </ol>
                  <a href="/pricing" className="mt-auto inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-[#062336] transition hover:-translate-y-1 hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/50 motion-reduce:transform-none">استعرض باقات الترقية <ArrowLeft className="h-4 w-4" /></a>
                </div>
              </aside>

              <div className="grid gap-5 sm:grid-cols-2">
                {[{label:"للمتعامل الاقتصادي",title:"فرص أوضح، وتحضير أكثر تركيزاً",description:"استفد من المطابقة الإرشادية للفرص المنشورة ومن أسباب الملاءمة والفجوات، ثم راجع المستندات والعروض وفق مسؤولية مؤسستك.",points:["ترشيحات قابلة للتفسير وليست قراراً آلياً","متابعة العروض والعقود والتنبيهات من بوابة واحدة"],href:"/login",cta:"الدخول إلى بوابة المتعامل",tone:"mint"},{label:"للمصلحة المتعاقدة",title:"مراجعة منظمة، ورقابة قابلة للتتبع",description:"استخدم المراجعة الإرشادية لدفاتر الشروط والملخصات التشغيلية للعقود والتنبيهات لتسريع الفهم، مع بقاء الاعتماد والقرار القانوني بيد الجهة المخوّلة.",points:["نتائج موثقة بملاحظات وأدلة قابلة للمراجعة","إشعارات ومتابعة مؤسسية عبر دورة الصفقة"],href:"/login",cta:"الدخول إلى بوابة المصلحة",tone:"gold"}].map(({label,title,description,points,href,cta,tone}) => <article key={label} className={`ai-upgrade-card ai-upgrade-card-${tone} group relative overflow-hidden rounded-[2rem] p-6 text-[var(--landing-ink)] shadow-sm sm:p-7`}><div className="ai-upgrade-card-glow" aria-hidden="true" /><div className="relative z-10 flex h-full flex-col"><div className="flex items-center justify-between gap-3"><span className="ai-upgrade-card-index">AI / {tone === "mint" ? "02" : "03"}</span><Sparkles className="h-5 w-5 text-[var(--landing-gold)] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-125" aria-hidden="true" /></div><p className="mt-10 text-xs font-black tracking-wide text-[var(--landing-teal)]">{label}</p><h3 className="mt-3 text-2xl font-black text-[var(--landing-navy)] dark:text-white">{title}</h3><p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p><ul className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">{points.map(point => <li key={point} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--landing-teal)]" />{point}</li>)}</ul><a href={href} className="mt-auto pt-7 inline-flex items-center gap-2 text-sm font-black text-[var(--landing-teal)] transition hover:gap-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--landing-teal)]/20">{cta} <ArrowLeft className="h-4 w-4" /></a></div></article>)}
              </div>
            </div>
          </div>
        </section>

        <section id="legal-framework" className="landing-section py-16 sm:py-18 lg:py-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-emerald-200/60 bg-gradient-to-br from-white via-emerald-50/60 to-sky-50/70 p-6 shadow-[0_24px_80px_rgba(15,118,110,0.12)] dark:border-emerald-400/20 dark:from-slate-950 dark:via-emerald-950/30 dark:to-sky-950/30 sm:p-10">
            <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-400/10" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-400/10" />
            <div className="relative">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm font-bold text-[var(--landing-teal)]">مرجعية مؤسسية</p>
                  <h2 className="landing-heading mt-3 text-3xl font-black text-[var(--landing-navy)] dark:text-white sm:text-5xl">الإطار القانوني للمنصة</h2>
                  <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">تستند «صفقات ذكية» إلى أبرز النصوص الجزائرية المنظمة للصفقات العمومية والرقمنة وحماية المعطيات والتوقيع الإلكتروني، لتكون التقنية خادمة للشفافية والامتثال.</p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400"><span className="block text-[var(--landing-teal)]">آخر تحديث</span><time dateTime="2026-08-21">21 أوت 2026</time></p>
                  <button type="button" onClick={() => legalSummaryPdf.mutate({ referenceIds: selectedLegalIds })} disabled={legalSummaryPdf.isPending || selectedLegalIds.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--landing-navy)] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-[var(--landing-teal)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 motion-reduce:transform-none">
                    {legalSummaryPdf.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />} تحميل ملخص مخصص ({selectedLegalIds.length})
                  </button>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <label className="relative flex min-h-11 flex-1 items-center"><Search className="pointer-events-none absolute start-3 h-4 w-4 text-slate-400" aria-hidden="true" /><input type="search" value={legalQuery} onChange={event => setLegalQuery(event.target.value)} placeholder="ابحث عن قانون أو مجال..." aria-label="البحث في الإطار القانوني" className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 pe-4 ps-10 text-sm text-[var(--landing-ink)] outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-slate-900/60 dark:text-white" /></label>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية المراجع القانونية">{legalFilters.map(filter => <button key={filter} type="button" onClick={() => setActiveLegalFilter(filter)} aria-pressed={activeLegalFilter === filter} className={`rounded-full px-3.5 py-2 text-xs font-bold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transform-none ${activeLegalFilter === filter ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/15" : "bg-slate-100 text-slate-600 hover:bg-emerald-50 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-emerald-900/40"}`}>{filter}</button>)}</div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>اختر التشريعات التي تريد تضمينها في الملخص المخصص.</span>
                  <button type="button" onClick={() => setSelectedLegalIds(visibleLegalReferences.map(reference => reference.id))} className="font-bold text-[var(--landing-teal)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">تحديد النتائج الظاهرة</button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {visibleLegalReferences.map(reference => {
                  const isSelected = selectedLegalIds.includes(reference.id);
                  const isFavorite = favoriteLegalIds.includes(reference.id);
                  return <article key={reference.id} className={`landing-glass-card group rounded-2xl p-5 transition ${isSelected ? "ring-2 ring-emerald-500/40" : ""}`}>
                    <div className="flex items-start justify-between gap-3"><p className={`text-xs font-bold text-${reference.tone}-700 dark:text-${reference.tone}-300`}>{reference.category}</p><button type="button" onClick={() => setFavoriteLegalIds(current => isFavorite ? current.filter(id => id !== reference.id) : [...current, reference.id])} aria-pressed={isFavorite} aria-label={isFavorite ? `إزالة ${reference.law} من المفضلة` : `حفظ ${reference.law} في المفضلة`} className="rounded-full p-1.5 text-slate-400 transition hover:scale-110 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 motion-reduce:transform-none"> <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} aria-hidden="true" /></button></div>
                    <h3 className="mt-3 font-black text-[var(--landing-navy)] dark:text-white">{reference.law}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{reference.description}</p>
                    <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={isSelected} onChange={() => setSelectedLegalIds(current => isSelected ? current.filter(id => id !== reference.id) : [...current, reference.id])} className="h-4 w-4 accent-emerald-600" /> تضمين في الملخص</label>
                    <div className="legal-reference-link-wrap group/link relative mt-4 w-fit"><a className="inline-flex items-center text-sm font-bold text-[var(--landing-teal)] underline-offset-4 transition hover:-translate-y-0.5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transform-none" href={reference.href} target="_blank" rel="noreferrer" aria-describedby={`legal-preview-${reference.id}`}>النص الرسمي <ArrowLeft className="ms-1 h-3.5 w-3.5 transition-transform group-hover/link:-translate-x-1" aria-hidden="true" /></a><span id={`legal-preview-${reference.id}`} role="tooltip" className="legal-law-preview pointer-events-none absolute bottom-full start-0 z-20 mb-3 w-64 rounded-xl border border-emerald-200/70 bg-white/95 p-3 text-xs font-semibold leading-6 text-slate-700 opacity-0 shadow-xl backdrop-blur-md transition duration-200 group-hover/link:pointer-events-auto group-hover/link:translate-y-0 group-hover/link:opacity-100 group-focus-within/link:pointer-events-auto group-focus-within/link:translate-y-0 group-focus-within/link:opacity-100 dark:border-emerald-300/20 dark:bg-slate-900/95 dark:text-slate-200">{reference.summary}</span></div>
                  </article>;
                })}
                {visibleLegalReferences.length === 0 && <div className="md:col-span-2 lg:col-span-4 rounded-2xl border border-dashed border-slate-300 bg-white/45 p-8 text-center dark:border-white/15 dark:bg-white/[0.03]"><p className="font-bold text-[var(--landing-navy)] dark:text-white">لا توجد مراجع مطابقة</p><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">جرّب كلمة بحث أخرى أو أعد التصفية إلى «الكل».</p></div>}
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
                <div className="rounded-2xl border border-emerald-200/70 bg-white/65 p-5 shadow-sm dark:border-emerald-300/15 dark:bg-white/[0.04]">
                  <div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><MessageCircle className="h-5 w-5" /></span><div><h3 className="font-black text-[var(--landing-navy)] dark:text-white">مساعد الإطار القانوني</h3><p className="text-xs text-slate-500 dark:text-slate-400">اسأل عن المراجع المحددة فقط</p></div></div>
                  <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={event => { event.preventDefault(); setLegalAnswer(null); legalAssistant.mutate({ question: legalQuestion, referenceIds: selectedLegalIds.length ? selectedLegalIds : legalReferences.map(reference => reference.id) }); }}><input value={legalQuestion} onChange={event => setLegalQuestion(event.target.value)} required minLength={2} maxLength={1200} placeholder="مثال: ما المجال العام للقانون 23-12؟" aria-label="سؤال المساعد القانوني" className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white/85 px-4 text-sm text-[var(--landing-ink)] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-slate-900/60 dark:text-white" /><button type="submit" disabled={legalAssistant.isPending || legalQuestion.trim().length < 2} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white transition hover:bg-emerald-800 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30">{legalAssistant.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />} اسأل</button></form>
                  {legalAnswer && <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm leading-7 text-slate-700 dark:border-emerald-300/15 dark:bg-emerald-400/10 dark:text-slate-200"><p className="font-bold text-emerald-800 dark:text-emerald-300">إجابة إرشادية</p><p className="mt-2 whitespace-pre-line">{legalAnswer}</p></div>}
                </div>
                <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-5 text-sm leading-7 text-amber-950 dark:border-amber-300/15 dark:bg-amber-400/10 dark:text-amber-100"><p className="font-black">تنبيه الاستخدام</p><p className="mt-2">المساعد لا يقدم استشارة قانونية ولا يستبدل النص الرسمي، ولا يتخذ قراراً أو ينفذ إجراءً. تحقق دائماً من آخر إصدار منشور قبل الاعتماد.</p><p className="mt-3 text-xs font-semibold">المراجع المحفوظة محلياً في هذا المتصفح: {favoriteLegalIds.length}</p></div>
              </div>
              <p className="relative mt-7 text-xs leading-6 text-slate-500 dark:text-slate-400">هذه قائمة مرجعية مختصرة وليست استشارة قانونية. قد تخضع النصوص للتعديل؛ ويظل المرجع الملزم هو آخر إصدار منشور في الجريدة الرسمية أو الجهة الحكومية المختصة.</p>
            </div>
          </div>
        </section><section id="faq" className="landing-section py-16 sm:py-18 lg:py-20"><div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-sm font-bold text-[var(--landing-teal)]">أسئلة قبل البدء</p><h2 className="landing-heading mt-3 text-3xl font-black text-[var(--landing-navy)] dark:text-white sm:text-5xl">وضوح قبل الدخول</h2><p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">إجابات مختصرة على الأسئلة التي تهم الثقة، الصلاحيات، ودور الذكاء الاصطناعي.</p></div><div className="space-y-3">{faqs.map(([question, answer]) => <details key={question} className="group landing-glass-card rounded-2xl p-5 text-[var(--landing-ink)] transition-colors duration-300"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[var(--landing-navy)] marker:hidden dark:text-white"><span>{question}</span><ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" /></summary><p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:text-slate-300">{answer}</p></details>)}</div></div></section>

        <section className="relative overflow-hidden rounded-[2rem] bg-[var(--landing-navy)] px-6 py-12 text-white sm:px-10 sm:py-14"><div aria-hidden="true" className="absolute -left-10 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" /><div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center"><div><p className="text-sm font-bold text-emerald-200">خطوتك التالية واضحة</p><h2 className="landing-heading mt-3 text-3xl font-black sm:text-4xl">اختر بوابتك وابدأ من المسار المناسب</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">لا تحتاج إلى معرفة كل شيء قبل الدخول. صُممت كل بوابة لتقودك إلى الخطوة التالية.</p></div><a href="/discover" className="inline-flex min-h-14 shrink-0 items-center gap-2 rounded-2xl bg-emerald-400 px-7 py-4 text-base font-black text-[#062336] transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/50">اكتشف المنصة <ArrowLeft className="h-5 w-5" /></a></div></section>

        <footer className="flex flex-col gap-4 border-t border-slate-200/70 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-slate-400"><span>صفقات ذكية — بنية رقمية مؤسسية للصفقات العمومية</span><div className="flex flex-wrap items-center gap-3"><LiveStatusBadge /><a href="/status" className="font-semibold transition hover:text-[var(--landing-teal)]">صفحة الحالة التفصيلية</a><a href="/login" className="font-semibold transition hover:text-[var(--landing-teal)]">اختيار البوابة</a></div></footer>
      </div>
    </main>
  );
}

function Building2({ className }: { className?: string }) {
  return <Landmark className={className} />;
}
