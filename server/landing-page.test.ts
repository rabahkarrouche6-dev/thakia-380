import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("public landing page contract", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

  it("keeps the landing page independent from protected portal routes", () => {
    expect(source).not.toContain("/login/supplier");
    expect(source).not.toContain("/login/authority");
    expect(source).not.toContain("/login/regulator");
    expect(source).not.toContain("DashboardLayout");
  });

  it("presents the platform and its implemented advisory AI capabilities", () => {
    expect(source).toContain("صفقات ذكية");
    expect(source).not.toContain("منصة واحدة،");
    expect(source).not.toContain("صفقات أكثر حكامة.");
    expect(source).toContain("الرادار الرقابي");
    expect(source).toContain("تدقيق دفتر الشروط");
    expect(source).toContain("المطابقة الإرشادية");
  });

  it("keeps the platform name in a single crystalline glass card", () => {
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

    expect(source).toContain("platform-name-crystal-card");
    expect(source).toContain("platform-name-crystal-text");
    expect(styles).toContain("white-space: nowrap");
    expect(styles).toContain("backdrop-filter: blur(15px)");
  });

  it("centers the platform name and supporting text without the side card", () => {
    expect(source).toContain("flex min-h-[31rem] items-center justify-center");
    expect(source).toContain("relative z-10 flex max-w-4xl flex-col items-center");
    expect(source).toContain("mt-6 max-w-3xl text-lg");
    expect(source).not.toContain("SOVEREIGN WORKSPACE");
  });

  it("keeps the platform-process heading on one responsive line", () => {
    expect(source).toContain("رقمنة المسار لا تعقيد العمل");
    expect(source).toContain("whitespace-nowrap text-[clamp(1.25rem,6vw,3rem)]");
  });

  it("arranges the procurement lifecycle cards as opposing responsive pairs", () => {
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
    const supplierJourney = readFileSync(
      resolve(process.cwd(), "client/src/components/SupplierJourneyScrollytelling.tsx"),
      "utf8"
    );

    expect(source).toContain("lifecycle-opposed-grid");
    expect(source).toContain("sm:grid-cols-2");
    expect(source).toContain("lifecycle-opposed-card");
    expect(styles).toContain(".lifecycle-opposed-grid::before");
    expect(styles).toContain(".lifecycle-opposed-card:nth-child(odd)::after");
    expect(styles).toContain('[dir="rtl"] .lifecycle-opposed-card:nth-child(odd)::after');
    expect(supplierJourney).toContain("milestonePairs");
    expect(supplierJourney).toContain("journey-opposed-pairs");
    expect(supplierJourney).toContain("sm:grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)]");
    expect(supplierJourney).toContain('cardIndex === 0 ? "sm:col-start-1" : "sm:col-start-3"');
    expect(supplierJourney).toContain("text-start");
  });

  it("connects each interactive supplier-journey card to its accessible stage detail", () => {
    const supplierJourney = readFileSync(
      resolve(process.cwd(), "client/src/components/SupplierJourneyScrollytelling.tsx"),
      "utf8"
    );
    const cinematicScene = readFileSync(
      resolve(process.cwd(), "client/src/components/CinematicLandingScene.tsx"),
      "utf8"
    );

    expect(supplierJourney).toContain("handleMilestoneNavigation");
    expect(supplierJourney).toContain("scrollIntoView");
    expect(supplierJourney).toContain('href={`#journey-detail-${id}`}');
    expect(supplierJourney).toContain("aria-controls={`journey-detail-${id}`}");
    expect(supplierJourney).toContain("TooltipTrigger");
    expect(supplierJourney).toContain("motion-reduce:transition-none");
    expect(cinematicScene).toContain('id={`journey-detail-${id}`}');
    expect(cinematicScene).toContain("tabIndex={-1}");
  });

  it("explains the governed AI-upgrade path for suppliers and authorities", () => {
    expect(source).toContain('id="ai-upgrade"');
    expect(source).toContain("استعرض باقات الترقية");
    expect(source).toContain('href="/pricing"');
    expect(source).toContain("للمتعامل الاقتصادي");
    expect(source).toContain("للمصلحة المتعاقدة");
    expect(source).toContain("لا تمنح أفضلية في المنافسة");
    expect(source).toContain("ليست قراراً آلياً");
  });

  it("provides a persisted English locale with LTR document support and translated public copy", () => {
    const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
    const locale = readFileSync(resolve(process.cwd(), "client/src/contexts/LocaleContext.tsx"), "utf8");
    const toggle = readFileSync(resolve(process.cwd(), "client/src/components/LanguageToggle.tsx"), "utf8");
    const bridge = readFileSync(resolve(process.cwd(), "client/src/components/LocaleTranslationBridge.tsx"), "utf8");
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

    expect(app).toContain("LocaleProvider");
    expect(app).toContain("LocaleTranslationBridge");
    expect(locale).toContain("window.localStorage.setItem(STORAGE_KEY, locale)");
    expect(locale).toContain("document.documentElement.dir = direction");
    expect(locale).toContain('localeFromQuery === "ar" || localeFromQuery === "en"');
    expect(toggle).toContain("useLocale");
    expect(bridge).toContain("arabicToEnglish");
    expect(bridge).toContain("MutationObserver");
    expect(bridge).toContain("Digitise the process, not the work");
    expect(source).toContain("displayLocale");
    expect(source).toContain("dir={direction}");
    expect(styles).toContain('html[dir="ltr"] .text-right');
  });

  it("orders public portal titles naturally in English and mirrors the action arrow", () => {
    const publicPortal = readFileSync(resolve(process.cwd(), "client/src/pages/PublicPortal.tsx"), "utf8");

    expect(publicPortal).toContain("useLocale");
    expect(publicPortal).toContain("labelEn: \"Economic Operator\"");
    expect(publicPortal).toContain("`${content.labelEn} Portal`");
    expect(publicPortal).toContain("isEnglish ? <ArrowRight");
    expect(publicPortal).not.toContain("بوابة {content.label}");
  });

  it("renders registration and preview portals from the selected locale instead of fixed RTL copy", () => {
    const registration = readFileSync(resolve(process.cwd(), "client/src/pages/PortalRegistration.tsx"), "utf8");
    const preview = readFileSync(resolve(process.cwd(), "client/src/pages/PreviewPortals.tsx"), "utf8");

    expect(registration).toContain("useLocale");
    expect(registration).toContain("Register with ${content.label}");
    expect(registration).toContain("dir={direction}");
    expect(registration).toContain("Explore the portal before signing in");
    expect(registration).toContain("/preview/${portalKey");
    expect(preview).toContain("useLocale");
    expect(preview).toContain("Explore platform portals before signing in");
    expect(preview).toContain("${content.label} Portal");
    expect(preview).toContain("dir={direction}");
    expect(preview).not.toContain('dir="rtl"');
  });

  it("keeps direct institutional login and the authority workspace locale-aware", () => {
    const login = readFileSync(resolve(process.cwd(), "client/src/pages/LoginRedirect.tsx"), "utf8");
    const authority = readFileSync(resolve(process.cwd(), "client/src/pages/AuthorityShell.tsx"), "utf8");

    expect(login).toContain("getPortalKey(location)");
    expect(login).toContain("storePortalSelection(portal)");
    expect(login).toContain("window.location.replace(`/preview/");
    expect(authority).toContain('document.documentElement.lang === "en" ? "en-DZ" : "ar-DZ"');
    expect(authority).toContain("new Intl.NumberFormat(activeLocale())");
  });

  it("keeps protected supplier, tender-creation, and regulator views locale-aware", () => {
    const supplier = readFileSync(resolve(process.cwd(), "client/src/pages/SupplierWorkspace.tsx"), "utf8");
    const tenderCreate = readFileSync(resolve(process.cwd(), "client/src/pages/AuthorityTenderCreate.tsx"), "utf8");
    const centralAdmin = readFileSync(resolve(process.cwd(), "client/src/pages/CentralAdminPortal.tsx"), "utf8");
    const regulator = readFileSync(resolve(process.cwd(), "client/src/pages/RegulatorAiPanel.tsx"), "utf8");

    expect(supplier).toContain('document.documentElement.lang === "en" ? "en-DZ" : "ar-DZ"');
    expect(supplier).toContain("new Intl.NumberFormat(activeLocale())");
    expect(tenderCreate).toContain("useLocale");
    expect(tenderCreate).toContain("dir={direction}");
    expect(centralAdmin).toContain("useLocale");
    expect(regulator).toContain("useLocale");
    expect(regulator).toContain("dir={direction}");
    expect(regulator).toContain("direction === \"ltr\" ? <ArrowRight");
  });

  it("adds concise hero statistics, accessible button motion, and a compact mobile hero", () => {
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

    expect(source).toContain("hero-statistics-ticker");
    expect(source).toContain("مناقصات منشورة");
    expect(source).toContain("عروض مسجلة");
    expect(source).toContain("قرارات إسناد");
    expect(source).toContain("hero-action hero-action-secondary");
    expect(source).toContain("sm:min-h-[38rem]");
    expect(styles).toContain(".hero-action:hover");
    expect(styles).toContain("hero-statistics-enter");
    expect(styles).toContain("hero-statistic-enter");
    expect(styles).toContain("prefers-reduced-motion: reduce");
    expect(styles).toContain(".cyber-hero { min-height: 31rem; }");
  });

  it("layers restrained atmospheric light over the hero and disables its motion when requested", () => {
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

    expect(source).toContain("hero-aurora hero-aurora-one");
    expect(source).toContain("hero-starlight hero-starlight-one");
    expect(styles).toContain(".platform-name-crystal-card::after");
    expect(styles).toContain("hero-aurora-drift");
    expect(styles).toContain("hero-starlight-pulse");
    expect(styles).toContain("crystal-sheen");
    expect(styles).toContain("prefers-reduced-motion: reduce");
  });

  it("adds live header controls, visible-count statistics, and smooth hero navigation", () => {
    const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

    expect(source).toContain("topbar-live-time");
    expect(source).toContain("topbar-theme-toggle");
    expect(source).toContain("aria-pressed={theme === \"dark\"}");
    expect(source).toContain("Enable dark mode");
    expect(source).toContain("تفعيل الوضع الليلي");
    expect(source).toContain("useLiveDateTime");
    expect(source).toContain("useAnimatedCount");
    expect(source).toContain("heroStatsRef");
    expect(source).toContain("IntersectionObserver");
    expect(source).toContain('href="/discover"');
    expect(source).toContain('handleHeroScroll(event, "platform")');
    expect(app).toContain("switchable");
    expect(styles).toContain(".topbar-live-time");
    expect(styles).toContain("font-variant-numeric: tabular-nums");
    expect(styles).toContain("flex: 0 0 4.5rem");
    expect(styles).toContain(".topbar-time-icon { display: none; }");
  });

  it("strengthens dark-mode contrast for shared surfaces, text, controls, and focus states", () => {
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

    expect(styles).toContain("--muted-foreground: oklch(0.82 0.025 195)");
    expect(styles).toContain("--border: oklch(0.72 0.025 190 / 32%)");
    expect(styles).toContain(".dark .landing-copy { color: #d8eceb; }");
    expect(styles).toContain(".dark :is(a, button, input, select, textarea):focus-visible");
  });

  it("presents an accessible Algerian identity header without changing the public navigation", () => {
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

    expect(source).toContain("algerian-topbar");
    expect(source).toContain("algerian-flag-ribbon");
    expect(source).toContain("algerian-brand-mark");
    expect(source).toContain("منظومة جزائرية للصفقات العمومية");
    expect(source).toContain("algerian-primary-nav");
    expect(source).toContain("algerian-entry-link");
    expect(source).toContain('className="mobile-menu-toggle lg:hidden"');
    expect(styles).toContain(".algerian-topbar");
    expect(styles).toContain(".algerian-flag-ribbon");
    expect(styles).toContain("prefers-reduced-motion: reduce");
  });

  it("uses a public operational-statistics API, a persisted time zone, and an accessible mobile menu", () => {
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

    expect(router).toContain("landing: router");
    expect(router).toContain("stats: publicProcedure.query");
    expect(router).toContain("getPlatformStats");
    expect(source).toContain("trpc.landing.stats.useQuery");
    expect(source).toContain("landing-timezone");
    expect(source).not.toContain("landing-timezone-desktop");
    expect(source).toContain("landing-timezone-mobile");
    expect(source).toContain("LanguageToggle");
    expect(source).toContain("topbar-language-toggle");
    expect(source).toContain("localStorage.setItem");
    expect(source).toContain('window.localStorage.setItem("landing-timezone", timeZone)');
    expect(source).toContain('timeZone, hour: "2-digit", minute: "2-digit", hour12: false');
    expect(source).toContain("topbar-time-icon");
    expect(source).toContain("topbar-time-label");
    expect(source).toContain("mobile-landing-navigation");
    expect(source).toContain("aria-expanded={isMobileMenuOpen}");
    expect(source).toContain("handleMobileNavigation");
    expect(source).toContain("setIsMobileMenuOpen(open => !open)");
    expect(source).toContain('if (event.key === "Escape") setIsMobileMenuOpen(false)');
    expect(source).toContain("setIsMobileMenuOpen(false)");
    expect(styles).toContain(".topbar-timezone-select");
    expect(styles).toContain(".mobile-timezone-field");
    expect(styles).toContain(".topbar-time-icon");
    expect(styles).toContain(".topbar-time-label");
    expect(styles).toContain(".mobile-landing-navigation");
  });

  it("includes the cinematic opening scene with advisory-only messaging", () => {
    const scene = readFileSync(
      resolve(process.cwd(), "client/src/components/CinematicLandingScene.tsx"),
      "utf8"
    );
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

    expect(source).toContain("CinematicLandingScene");
    expect(scene).toContain("من البيانات إلى الأثر");
    expect(scene).toContain("المطابقة الإرشادية");
    expect(scene).toContain("لا قبول تلقائي ولا وعد بالأهلية أو الفوز");
    expect(scene).toContain("IntersectionObserver");
    expect(styles).toContain("prefers-reduced-motion");
  });

  it("includes the Cyber-Algeria particle hero without unsupported claims", () => {
    const particleField = readFileSync(
      resolve(process.cwd(), "client/src/components/CyberParticleField.tsx"),
      "utf8"
    );

    expect(source).toContain("CyberParticleField");
    expect(source).toContain("CyberParticleField");
    expect(source).toContain("صفقات ذكية");
    expect(particleField).toContain("THREE.WebGLRenderer");
    expect(particleField).toContain("prefers-reduced-motion");
    expect(particleField).toContain("renderer.dispose");
  });

  it("avoids unsupported performance claims and labels roadmap items clearly", () => {
    expect(source).toContain("0");
    expect(source).toContain("قرارات آلية");
    expect(source).toContain("تحت الإشراف");
    expect(source).toContain("مساعد التقييم");
    expect(source).not.toContain("94%");
    expect(source).not.toContain("95%");
    expect(source).not.toContain("100% وقاية");
    expect(source).not.toContain("-70%");
    expect(source).not.toContain("موثقة برقم المادة");
  });
});


  it("presents the data-to-impact section as an accessible cinematic card grid", () => {
    const scene = readFileSync(resolve(process.cwd(), "client/src/components/CinematicLandingScene.tsx"), "utf8");
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

    expect(scene).toContain("من البيانات إلى الأثر");
    expect(scene).toContain("cinematic-impact-section");
    expect(scene).toContain("cinematic-impact-grid");
    expect(scene).toContain("cinematic-impact-card");
    expect(scene).toContain("cinematic-impact-card-shine");
    expect(styles).toContain(".cinematic-impact-section::before");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });


  it("routes discovery CTAs to the public platform overview page", () => {
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
    const discover = readFileSync(resolve(process.cwd(), "client/src/pages/Discover.tsx"), "utf8");

    expect(home).toContain('href="/discover"');
    expect(app).toContain('path="/discover" component={Discover}');
    expect(discover).not.toContain("كل جهة تبدأ من المسار الذي يخصها");
    expect(discover).toContain("صلاحيات مؤسسية واضحة");
    expect(discover).toContain("المصلحة المتعاقدة");
    expect(discover).toContain("المتعامل الاقتصادي");
    expect(discover).toContain('href="/login"');
    expect(discover).toContain('dir={direction}');
  });

describe("discover journey paths contract", () => {
  it("explains the supplier journey from registration to award", () => {
    const discover = readFileSync(resolve(process.cwd(), "client/src/pages/Discover.tsx"), "utf8");

    expect(discover).toContain("رحلة المتعامل الاقتصادي");
    expect(discover).toContain("التسجيل الآمن");
    expect(discover).toContain("إيداع العرض");
    expect(discover).toContain("الفوز والمتابعة");
  });

  it("explains the authority journey from planning to handover", () => {
    const discover = readFileSync(resolve(process.cwd(), "client/src/pages/Discover.tsx"), "utf8");

    expect(discover).toContain("رحلة المصلحة المتعاقدة");
    expect(discover).toContain("البرمجة والتخطيط");
    expect(discover).toContain("الترسية والاستلام");
    expect(discover).toContain("aria-labelledby");
  });
});


describe("legal framework landing section", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

  it("presents official procurement and digital-law references without legal advice claims", () => {
    expect(source).toContain("الإطار القانوني");
    expect(source).toContain("الصفقات العمومية");
    expect(source).toContain("المعاملات الرقمية");
    expect(source).toContain("حماية المعطيات");
    expect(source).toContain("النص الرسمي");
    expect(source).toContain("ليست استشارة قانونية");
    expect(source).toContain("mf.gov.dz");
    expect(source).toContain("arpce.dz");
  });

  it("adds a dated downloadable legal summary with searchable and filterable references", () => {
    expect(source).toContain('dateTime="2026-08-21"');
    expect(source).toContain("آخر تحديث");
    expect(source).toContain("تحميل ملخص مخصص");
    expect(source).toContain("legalSummaryPdf.mutate");
    expect(source).toContain("selectedLegalIds");
    expect(source).toContain("aria-label=\"البحث في الإطار القانوني\"");
    expect(source).toContain("activeLegalFilter");
    expect(source).toContain("visibleLegalReferences");
    expect(source).toContain("aria-pressed={activeLegalFilter === filter}");
    expect(source).toContain("aria-describedby={`legal-preview-${reference.id}`}");
    expect(source).toContain("group-focus-within/link:opacity-100");
    expect(source).toContain("ليست استشارة قانونية");
  });

  it("supports advisory legal answers and local favorites without changing decisions", () => {
    expect(source).toContain("legalAssistant.mutate");
    expect(source).toContain("favoriteLegalIds");
    expect(source).toContain("legal-framework-favorites");
    expect(source).toContain("aria-pressed={isFavorite}");
    expect(source).toContain("إجابة إرشادية");
    expect(source).toContain("لا يتخذ قراراً أو ينفذ إجراءً");
  });
});
