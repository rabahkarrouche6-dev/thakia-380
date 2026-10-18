import { CheckCircle2, ChevronLeft, Compass, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/contexts/LocaleContext";

export type OnboardingStep = {
  id: string;
  label: string;
  description: string;
  complete: boolean;
  actionLabel: string;
  onAction: () => void;
};

type ContextualOnboardingProps = {
  role: "supplier" | "authority" | "regulator";
  userKey?: string | number | null;
  title: string;
  description: string;
  steps: OnboardingStep[];
};

const storagePrefix = "safaqat-onboarding-dismissed";

export function ContextualOnboarding({ role, userKey, title, description, steps }: ContextualOnboardingProps) {
  const { direction, isEnglish } = useLocale();
  const storageKey = useMemo(() => `${storagePrefix}:${role}:${userKey ?? "session"}`, [role, userKey]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(storageKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  if (dismissed) return null;

  const nextStep = steps.find(step => !step.complete) ?? steps[steps.length - 1];
  const completedCount = steps.filter(step => step.complete).length;

  const dismiss = () => {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // Local persistence is optional; the onboarding remains usable if storage is unavailable.
    }
    setDismissed(true);
  };

  const copy = isEnglish
    ? { dismiss: "Dismiss onboarding guidance", progress: `${completedCount} of ${steps.length} steps completed from current data`, optional: "Optional guidance", next: "Recommended next step" }
    : { dismiss: "إخفاء إرشاد البداية", progress: `${completedCount} من ${steps.length} خطوات مكتملة من البيانات الحالية`, optional: "إرشاد اختياري", next: "الخطوة التالية المقترحة" };

  return <Card dir={direction} className="border border-[#d7e9e0] bg-[#f7fcf9] shadow-[0_12px_40px_rgba(9,46,73,.06)]">
    <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#e1f3e9] text-[#0d8062]" aria-hidden="true"><Compass className="h-5 w-5" /></div>
        <div>
          <CardTitle className="text-lg text-[#092e49]">{title}</CardTitle>
          <p className="mt-1 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon" aria-label={copy.dismiss} title={copy.dismiss} onClick={dismiss} className="shrink-0 text-slate-500 hover:text-[#092e49]"><X className="h-4 w-4" /></Button>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500" aria-live="polite"><span>{copy.progress}</span><span>{copy.optional}</span></div>
      <div className="grid gap-2">
        {steps.map(step => <div key={step.id} className={`flex items-start gap-3 rounded-2xl border p-3 ${step.complete ? "border-[#d7e9e0] bg-white" : "border-slate-200 bg-white"}`}>
          <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${step.complete ? "text-[#0d8062]" : "text-slate-300"}`} aria-hidden="true" />
          <div className="min-w-0 flex-1"><div className={`font-semibold ${step.complete ? "text-[#0d8062]" : "text-[#092e49]"}`}>{step.label}</div><p className="mt-1 text-xs leading-6 text-slate-500">{step.description}</p></div>
          {!step.complete && <Button type="button" variant="outline" size="sm" onClick={step.onAction} className="shrink-0 gap-1">{step.actionLabel}<ChevronLeft className={`h-3.5 w-3.5 ${isEnglish ? "rotate-180" : ""}`} /></Button>}
        </div>)}
      </div>
      {nextStep && !nextStep.complete && <div className="rounded-2xl bg-[#092e49] p-4 text-white"><div className="text-xs font-semibold text-[#b8e5d1]">{copy.next}</div><div className="mt-1 flex flex-wrap items-center justify-between gap-3"><div className="text-sm leading-6">{nextStep.label}</div><Button type="button" size="sm" onClick={nextStep.onAction} className="bg-[#b8e5d1] text-[#092e49] hover:bg-white">{nextStep.actionLabel}<ChevronLeft className={`h-3.5 w-3.5 ${isEnglish ? "ml-1 rotate-180" : "mr-1"}`} /></Button></div></div>}
    </CardContent>
  </Card>;
}
