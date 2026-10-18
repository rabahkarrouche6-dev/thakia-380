import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

type Theme = "light" | "dark";
type ThemePreference = Theme | "system";

interface ThemeContextType {
  theme: Theme;
  preference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
  switchable?: boolean;
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredPreference(defaultTheme: ThemePreference): ThemePreference {
  if (typeof window === "undefined") return defaultTheme;
  const stored = window.localStorage.getItem("theme");
  return stored === "light" || stored === "dark" || stored === "system" ? stored : defaultTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [preference, setPreference] = useState<ThemePreference>(() =>
    switchable ? getStoredPreference(defaultTheme) : defaultTheme,
  );
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);
  const authMe = trpc.auth.me.useQuery(undefined, { staleTime: 30_000, retry: false });
  const { mutate: persistThemePreference } = trpc.auth.setThemePreference.useMutation();
  const lastSyncedUserId = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };
    setSystemTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener?.("change", handleChange);
    return () => mediaQuery.removeEventListener?.("change", handleChange);
  }, []);

  const theme: Theme = preference === "system" ? systemTheme : preference;

  useEffect(() => {
    const user = authMe.data;
    if (!switchable || !user || lastSyncedUserId.current === user.id) return;
    if (user.themePreference === "light" || user.themePreference === "dark" || user.themePreference === "system") {
      setPreference(user.themePreference);
    }
    lastSyncedUserId.current = user.id;
  }, [authMe.data, switchable]);


  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;

    if (switchable) {
      window.localStorage.setItem("theme", preference);
    }
  }, [preference, switchable, theme]);

  const setThemePreference = (nextPreference: ThemePreference) => {
    if (!switchable) return;
    setPreference(nextPreference);
    if (authMe.data) persistThemePreference(nextPreference);
  };

  const toggleTheme = switchable
    ? () => {
        setThemePreference(theme === "light" ? "dark" : "light");
      }
    : undefined;

  const value = useMemo(
    () => ({ theme, preference, setThemePreference, toggleTheme, switchable }),
    [theme, preference, toggleTheme, switchable],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
