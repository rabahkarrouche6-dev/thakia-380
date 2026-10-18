import { useCallback, useEffect, useRef, useState } from "react";

export const INSTITUTIONAL_REDIRECT_DELAY_MS = 1200;
const COUNTDOWN_UPDATE_INTERVAL_MS = 100;

export function formatInstitutionalRedirectCountdown(remainingMs: number, locale: "ar" | "en") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.max(0, remainingMs) / 1000);
}

export function useInstitutionalRedirectCountdown() {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clearCountdown = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const scheduleRedirect = useCallback((destination: string) => {
    clearCountdown();
    const redirectAt = Date.now() + INSTITUTIONAL_REDIRECT_DELAY_MS;
    const updateRemainingTime = () => setRemainingMs(Math.max(0, redirectAt - Date.now()));

    updateRemainingTime();
    intervalRef.current = window.setInterval(updateRemainingTime, COUNTDOWN_UPDATE_INTERVAL_MS);
    timeoutRef.current = window.setTimeout(() => {
      clearCountdown();
      setRemainingMs(0);
      window.location.assign(destination);
    }, INSTITUTIONAL_REDIRECT_DELAY_MS);
  }, [clearCountdown]);

  useEffect(() => clearCountdown, [clearCountdown]);

  return { remainingMs, scheduleRedirect };
}
