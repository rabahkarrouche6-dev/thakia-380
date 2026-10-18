import React, { useState } from "react";
import { Building2, CheckCircle2, ChevronLeft, Loader2, ShieldCheck, Sparkles, Store, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

type PortalRole = "supplier" | "authority" | "regulator";

interface PortalOption {
  role: PortalRole;
  title: string;
  badge: string;
  description: string;
  personaName: string;
  icon: typeof Store;
  colorScheme: {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    iconBg: string;
    iconText: string;
    button: string;
  };
  features: string[];
}

const portals: PortalOption[] = [
  {
    role: "supplier",
    title: "بوابة المتعامل الاقتصادي",
    badge: "المؤسسات والشركات",
    description: "استعراض الصفقات المنشورة، سحب دفاتر الشروط، تقديم العروض الفنية والمالية المشفرة، ومتابعة المحاضر.",
    personaName: "مؤسسة الإنجاز (متعامل اقتصادي)",
    icon: Store,
    colorScheme: {
      bg: "bg-white",
      border: "border-emerald-200 hover:border-emerald-500",
      badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      badgeText: "text-emerald-700",
      iconBg: "bg-emerald-100 text-emerald-800",
      iconText: "text-emerald-700",
      button: "bg-[#0d8062] hover:bg-[#0a664e] text-white shadow-emerald-700/20",
    },
    features: [
      "تصفح الإعلانات والفرص الاستثمارية",
      "إيداع العروض بتشفير الأظرفة المزدوج",
      "المطابقة الإرشادية الذكية للعروض",
      "متابعة محاضر الفتح والمنح والطعون",
    ],
  },
  {
    role: "authority",
    title: "بوابة المصلحة المتعاقدة",
    badge: "الإدارات والمؤسسات العمومية",
    description: "إعداد وبرمجة الصفقات، تدقيق دفاتر الشروط، فتح الأظرفة وتقييم العروض بلجان مخصصة، وإصدار القرارات.",
    personaName: "مديرية التجهيزات العمومية (مصلحة متعاقدة)",
    icon: Building2,
    colorScheme: {
      bg: "bg-white",
      border: "border-sky-200 hover:border-sky-500",
      badgeBg: "bg-sky-50 text-sky-800 border-sky-200",
      badgeText: "text-sky-700",
      iconBg: "bg-sky-100 text-sky-800",
      iconText: "text-sky-700",
      button: "bg-[#075985] hover:bg-[#034264] text-white shadow-sky-800/20",
    },
    features: [
      "إعداد ونشر مشاريع الصفقات العمومية",
      "المساعد الاستشاري لفحص دفتر الشروط",
      "إدارة جلسات فتح الأظرفة والتوقيع الرقمي",
      "تقييم العروض والمنح المؤقت والنهائي",
    ],
  },
  {
    role: "regulator",
    title: "مرصد الإدارة المركزية",
    badge: "الهيئات الرقابية والحوكمة",
    description: "مرصد رقابي شامل لمتابعة النزاهة وسجل التدقيق الحصين وإشارات الرادار الرقابي المدعوم بالذكاء الاصطناعي.",
    personaName: "المرصد الوطني للصفقات العمومية (إدارة مركزية)",
    icon: ShieldCheck,
    colorScheme: {
      bg: "bg-white",
      border: "border-slate-300 hover:border-[#092e49]",
      badgeBg: "bg-slate-100 text-slate-800 border-slate-300",
      badgeText: "text-slate-700",
      iconBg: "bg-slate-100 text-[#092e49]",
      iconText: "text-[#092e49]",
      button: "bg-[#092e49] hover:bg-[#061e30] text-white shadow-slate-900/20",
    },
    features: [
      "الرادار الرقابي الاستشاري لرصد المؤشرات",
      "سجل تدقيق رقمي غير قابل للتعديل (Blockchain-like)",
      "لوحة قيادة مركزية لمتابعة الصفقات وطنياً",
      "تحليل الحوكمة ومؤشرات النزاهة المؤسسية",
    ],
  },
];

interface DirectPortalSelectorProps {
  title?: string;
  subtitle?: string;
  onSuccess?: (role: PortalRole) => void;
  compact?: boolean;
}

export default function DirectPortalSelector({
  title = "الدخول المباشر للبوابات — صفقات ذكية",
  subtitle = "تم تفعيل الوصول الفوري لكافة البوابات التشغيلية. اختر مساحة العمل التي ترغب في استعراضها مباشرة دون الحاجة لأي تسجيل أو كلمات مرور.",
  onSuccess,
  compact = false,
}: DirectPortalSelectorProps) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [activeRole, setActiveRole] = useState<PortalRole | null>(null);

  const directLoginMutation = trpc.auth.directLogin.useMutation({
    onSuccess: async (data, variables) => {
      if (data.token) {
        try {
          sessionStorage.setItem("manus-cookie", `app_session_id=${data.token}`);
          localStorage.setItem("manus-cookie", `app_session_id=${data.token}`);
        } catch {}
      }
      utils.auth.me.setData(undefined, data.user as any);
      toast.success(`تم الدخول بنجاح: ${data.user.name}`);
      if (onSuccess) {
        onSuccess(variables.role);
      } else {
        setTimeout(() => {
          window.location.assign("/app");
        }, 150);
      }
    },
    onError: (error) => {
      toast.error(`تعذر الدخول المباشر: ${error.message}`);
      setActiveRole(null);
    },
  });

  const handleSelectRole = (role: PortalRole) => {
    setActiveRole(role);
    directLoginMutation.mutate({ role });
  };

  return (
    <div className="w-full" dir="rtl">
      {!compact && (
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>وصول تشغيلي فوري ومفتوح</span>
          </div>
          <h1 className="mt-4 text-3xl font-black text-[#092e49] sm:text-4xl">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            {subtitle}
          </p>
        </div>
      )}

      <div className={`grid gap-6 ${compact ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 lg:grid-cols-3"}`}>
        {portals.map((portal) => {
          const Icon = portal.icon;
          const isLoading = directLoginMutation.isPending && activeRole === portal.role;

          return (
            <div
              key={portal.role}
              className={`group flex flex-col justify-between rounded-3xl border-2 p-6 transition-all duration-200 shadow-sm hover:shadow-xl ${portal.colorScheme.bg} ${portal.colorScheme.border}`}
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl ${portal.colorScheme.iconBg}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${portal.colorScheme.badgeBg}`}>
                    {portal.badge}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-black text-[#092e49]">
                  {portal.title}
                </h3>

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  الدخول باسم: {portal.personaName}
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {portal.description}
                </p>

                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                  {portal.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={directLoginMutation.isPending}
                  onClick={() => handleSelectRole(portal.role)}
                  className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${portal.colorScheme.button}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>جارٍ فتح مساحة العمل…</span>
                    </>
                  ) : (
                    <>
                      <span>دخول فوري إلى البوابة</span>
                      <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
