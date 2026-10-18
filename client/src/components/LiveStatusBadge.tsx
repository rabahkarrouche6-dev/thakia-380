import { CheckCircle2, CircleAlert, CircleX, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";

const statusCopy = {
  operational: {
    label: "الخدمات تعمل",
    className: "text-emerald-700 dark:text-emerald-300",
    dotClassName: "bg-emerald-500",
    Icon: CheckCircle2,
  },
  degraded: {
    label: "تدهور جزئي",
    className: "text-amber-700 dark:text-amber-300",
    dotClassName: "bg-amber-500",
    Icon: CircleAlert,
  },
  outage: {
    label: "توقف رئيسي",
    className: "text-rose-700 dark:text-rose-300",
    dotClassName: "bg-rose-500",
    Icon: CircleX,
  },
} as const;

type PublicStatus = keyof typeof statusCopy;

export default function LiveStatusBadge() {
  const { data, isError, isLoading } = trpc.system.status.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const status: PublicStatus = isError
    ? "degraded"
    : data?.overall === "operational"
      ? "operational"
      : data?.overall === "degraded"
        ? "degraded"
        : "degraded";
  const copy = statusCopy[status];
  const Icon = isLoading ? Activity : copy.Icon;

  return (
    <a
      href="/status"
      aria-label="عرض حالة المنصة"
      className={`group inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-3 py-1.5 text-xs font-bold shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--landing-teal)]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--landing-teal)]/20 dark:border-white/10 dark:bg-white/5 ${copy.className}`}
    >
      <span className={`relative flex h-2.5 w-2.5 items-center justify-center rounded-full ${copy.dotClassName}`}>
        <span aria-hidden="true" className="absolute h-full w-full animate-ping rounded-full opacity-40 motion-reduce:hidden" />
      </span>
      <Icon className={`h-3.5 w-3.5 ${isLoading ? "animate-pulse motion-reduce:animate-none" : ""}`} aria-hidden="true" />
      <span>{isLoading ? "جارٍ التحقق" : copy.label}</span>
    </a>
  );
}
