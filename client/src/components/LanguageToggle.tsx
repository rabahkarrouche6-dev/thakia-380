import { Languages } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { isEnglish, toggleLocale } = useLocale();
  const nextLabel = isEnglish ? "التبديل إلى العربية" : "Switch to English";

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`language-toggle inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--landing-teal)]/30 ${className}`}
      aria-label={nextLabel}
      title={nextLabel}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span lang={isEnglish ? "ar" : "en"}>{isEnglish ? "العربية" : "English"}</span>
    </button>
  );
}
