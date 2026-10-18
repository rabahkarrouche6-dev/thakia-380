import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "ar" | "en";

type LocaleContextValue = {
  locale: Locale;
  direction: "rtl" | "ltr";
  isEnglish: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const STORAGE_KEY = "safaqat-locale";
const LocaleContext = createContext<LocaleContextValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  const localeFromQuery = new URLSearchParams(window.location.search).get("lang");
  if (localeFromQuery === "ar" || localeFromQuery === "en") return localeFromQuery;
  return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "ar";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const direction = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.title = locale === "ar"
      ? "صفقات ذكية | منصة إدارة الصفقات العمومية"
      : "Smart Procurement | Public Procurement Management Platform";
  }, [direction, locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    direction,
    isEnglish: locale === "en",
    setLocale,
    toggleLocale: () => setLocale(current => current === "ar" ? "en" : "ar"),
  }), [direction, locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
