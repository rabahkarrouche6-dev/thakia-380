import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type PortalStatTone = "navy" | "green" | "amber" | "red";

const toneClasses: Record<PortalStatTone, { icon: string; accent: string }> = {
  navy: { icon: "bg-[#e8f0f7] text-[#0d5c79]", accent: "bg-[#0d5c79]" },
  green: { icon: "bg-[#e8f3ee] text-[#0d8062]", accent: "bg-[#0d8062]" },
  amber: { icon: "bg-amber-50 text-amber-700", accent: "bg-amber-500" },
  red: { icon: "bg-red-50 text-red-700", accent: "bg-red-500" },
};

type PortalStatCardProps = {
  label: string;
  value: number | string;
  hint: string;
  icon: LucideIcon;
  tone?: PortalStatTone;
  onClick?: () => void;
  tooltip?: string;
};

export function PortalStatCard({ label, value, hint, icon: Icon, tone = "navy", onClick, tooltip }: PortalStatCardProps) {
  const palette = toneClasses[tone];
  const content = <Card className="relative h-full overflow-hidden rounded-3xl border border-slate-100/90 bg-white/90 shadow-[0_12px_40px_rgba(9,46,73,.07)] transition duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(9,46,73,.12)] dark:border-slate-800/80 dark:bg-slate-900/85">
    <div className={`absolute inset-x-0 top-0 h-1 ${palette.accent}`} aria-hidden="true" />
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 text-start">
          <div className="truncate text-sm font-semibold text-slate-500 dark:text-slate-300">{label}</div>
          <div className="mt-3 text-3xl font-black tabular-nums tracking-tight text-[#092e49] dark:text-slate-50">{value}</div>
          <div className="mt-2 text-xs leading-5 text-slate-400 dark:text-slate-400">{hint}</div>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${palette.icon}`} aria-hidden="true"><Icon className="h-5 w-5" /></div>
      </div>
    </CardContent>
  </Card>;

  if (!onClick) return <div title={tooltip}>{content}</div>;
  return <button type="button" title={tooltip} onClick={onClick} className="group block h-full w-full text-start outline-none focus-visible:ring-2 focus-visible:ring-[#0d8062] focus-visible:ring-offset-2" aria-label={`${label}: ${value}. ${hint}`}>{content}</button>;
}

export function PortalStatGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>{children}</div>;
}
