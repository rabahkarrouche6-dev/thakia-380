import { BellRing, Bot, DatabaseBackup, Gauge, KeyRound, ListChecks, ServerCog, Settings2, ShieldCheck, UsersRound, Wrench, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/contexts/LocaleContext";

type OperationsSection = "users" | "reports" | "supervision" | "operations" | "platform-settings" | "ai-settings" | "security" | "health" | "performance" | "jobs" | "audit-log" | "error-log" | "alerts" | "backup";

const iconMap: Record<OperationsSection, LucideIcon> = {
  users: UsersRound,
  reports: ListChecks,
  supervision: ShieldCheck,
  operations: ServerCog,
  "platform-settings": Settings2,
  "ai-settings": Bot,
  security: KeyRound,
  health: Gauge,
  performance: Gauge,
  jobs: Wrench,
  "audit-log": ListChecks,
  "error-log": BellRing,
  alerts: BellRing,
  backup: DatabaseBackup,
};

export function CentralOperationsCenter({ section }: { section: OperationsSection }) {
  const { locale, direction } = useLocale();
  const isEnglish = locale === "en";
  const Icon = iconMap[section];
  const content = isEnglish
    ? {
        eyebrow: "CENTRAL ADMINISTRATION · OPERATIONS CENTER",
        titles: { users: "Users and entities", reports: "Administrative reports", supervision: "General supervision", operations: "Operations dashboard", "platform-settings": "Platform settings", "ai-settings": "AI settings", security: "Security and encryption", health: "Service health", performance: "Performance monitoring", jobs: "Background jobs", "audit-log": "Audit log", "error-log": "Error log", alerts: "Alerts", backup: "Backup and maintenance" },
        descriptions: { users: "Review governed identities and entity access without exposing unnecessary personal data.", reports: "Read descriptive administrative reports derived from recorded platform data.", supervision: "Monitor oversight signals and policy boundaries; contracting decisions remain with authorised humans.", operations: "A controlled operating room for platform status, queues, and approved interventions.", "platform-settings": "Review configuration that affects the platform, with changes subject to role and audit controls.", "ai-settings": "Configure advisory AI availability, quotas, and review requirements. AI cannot approve or award.", security: "Review encryption posture, key lifecycle status, and security controls without displaying secret material.", health: "Inspect service health and dependency readiness using observable checks.", performance: "Review measured latency, bundle, and workload indicators before tuning.", jobs: "Inspect background task state and retry policy; no hidden autonomous decisions are executed.", "audit-log": "Read tamper-evident operational events with actor, scope, result, and timestamp.", "error-log": "Review sanitised operational errors without exposing sensitive payloads.", alerts: "Review actionable alerts with ownership, severity, and acknowledgement state.", backup: "Review backup readiness, retention, and restoration procedures before any destructive maintenance." },
        readOnly: "Governed review surface",
        advisory: "Advisory only",
        scope: "This surface is intentionally non-destructive. Sensitive mutations require a separate approved workflow and are always audited.",
      }
    : {
        eyebrow: "الإدارة المركزية · مركز إعدادات وتشغيل المنصة",
        titles: { users: "المستخدمون والجهات", reports: "التقارير الإدارية", supervision: "الإشراف العام", operations: "لوحة التشغيل", "platform-settings": "إعدادات المنصة", "ai-settings": "إعدادات الذكاء الاصطناعي", security: "إعدادات الأمن والتشفير", health: "صحة الخدمات", performance: "مراقبة الأداء", jobs: "المهام الخلفية", "audit-log": "سجل التدقيق", "error-log": "سجل الأخطاء", alerts: "التنبيهات", backup: "النسخ الاحتياطي والصيانة" },
        descriptions: { users: "مراجعة الهويات والجهات والصلاحيات ضمن نطاق محكوم، دون عرض بيانات شخصية غير لازمة.", reports: "قراءة تقارير إدارية وصفية مشتقة من بيانات المنصة المسجلة فعلياً.", supervision: "متابعة مؤشرات الإشراف وحدود السياسات، مع بقاء القرارات التعاقدية للبشر المخولين.", operations: "غرفة تشغيل مضبوطة لمتابعة حالة المنصة والطوابير والتدخلات المعتمدة.", "platform-settings": "مراجعة إعدادات المنصة المؤثرة في التشغيل مع خضوع التغييرات للصلاحية والتدقيق.", "ai-settings": "ضبط إتاحة الذكاء الاصطناعي الاستشاري والحصص ومتطلبات المراجعة؛ لا يعتمد الذكاء الاصطناعي ولا يسند.", security: "مراجعة وضع التشفير ودورة حياة المفاتيح والضوابط الأمنية دون عرض الأسرار.", health: "فحص صحة الخدمات واستعداد التبعيات عبر مؤشرات قابلة للملاحظة.", performance: "مراجعة مؤشرات القياس قبل تحسين زمن الاستجابة والحزم والأحمال.", jobs: "متابعة حالة المهام الخلفية وسياسة إعادة المحاولة دون قرارات ذاتية خفية.", "audit-log": "قراءة أحداث تشغيلية متسلسلة ببصمة سلامة مع الفاعل والنطاق والنتيجة والوقت.", "error-log": "مراجعة الأخطاء التشغيلية المنقاة دون كشف الحمولات الحساسة.", alerts: "مراجعة التنبيهات القابلة للإجراء مع المالك والخطورة وحالة الإقرار.", backup: "مراجعة جاهزية النسخ والاحتفاظ وإجراءات الاستعادة قبل أي صيانة مدمرة." },
        readOnly: "مساحة مراجعة محكومة",
        advisory: "استشاري فقط",
        scope: "هذه المساحة غير مدمرة عمداً. تتطلب التغييرات الحساسة مساراً معتمداً منفصلاً، وتسجل دائماً في سجل التدقيق.",
      };
  return <section dir={direction} className="space-y-6" aria-labelledby="central-operations-title"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="mb-3 text-xs font-bold tracking-[.18em] text-[#0d8062]">{content.eyebrow}</p><h1 id="central-operations-title" className="text-3xl font-black tracking-tight text-[#092e49] lg:text-4xl">{content.titles[section]}</h1><p className="mt-3 max-w-3xl leading-7 text-slate-500">{content.descriptions[section]}</p></div><Badge className="w-fit border-0 bg-[#e8f3ee] px-4 py-2 text-[#0d8062]"><Icon className="me-2 h-4 w-4" />{section === "ai-settings" ? content.advisory : content.readOnly}</Badge></div><div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]"><CardHeader className="border-b border-[#e4f0e9] bg-[#fbfefd]"><CardTitle className="text-lg text-[#092e49]">{isEnglish ? "Operational state" : "الحالة التشغيلية"}</CardTitle></CardHeader><CardContent className="grid gap-4 p-6 sm:grid-cols-3"><div><p className="text-xs text-slate-400">{isEnglish ? "Visibility" : "الرؤية"}</p><p className="mt-1 font-bold text-[#0d8062]">{isEnglish ? "Connected" : "متصل"}</p></div><div><p className="text-xs text-slate-400">{isEnglish ? "Policy" : "السياسة"}</p><p className="mt-1 font-bold text-[#092e49]">{section === "ai-settings" ? content.advisory : content.readOnly}</p></div><div><p className="text-xs text-slate-400">{isEnglish ? "Change control" : "ضبط التغيير"}</p><p className="mt-1 font-bold text-[#092e49]">{isEnglish ? "Audited" : "مدقق"}</p></div></CardContent></Card><Card className="border-[#d9ebe2] bg-[#f6fbf8] shadow-none"><CardContent className="p-6"><p className="text-sm font-bold text-[#092e49]">{isEnglish ? "Trust boundary" : "حدود الثقة"}</p><p className="mt-3 text-sm leading-7 text-slate-600">{content.scope}</p></CardContent></Card></div></section>;
}
