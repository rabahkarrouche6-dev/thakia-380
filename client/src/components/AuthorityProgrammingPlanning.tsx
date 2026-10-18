import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, CheckCircle2, FilePlus2, LockKeyhole, ShieldCheck } from "lucide-react";
import type { AuthoritySection } from "@/pages/AuthorityShell";

type PermissionState = "allowed" | "review" | "blocked";

type PermissionRow = {
  label: string;
  description: string;
  state: PermissionState;
};

const rows: PermissionRow[] = [
  { label: "تسجيل الاحتياج", description: "وصف الحاجة، الأولوية، المصلحة المستفيدة، والمرجع الداخلي.", state: "allowed" },
  { label: "اقتراح البرمجة", description: "إعداد اقتراح أولي للميزانية والجدولة دون اعتماد نهائي.", state: "allowed" },
  { label: "إرفاق المبررات", description: "إضافة مستندات التخطيط والمذكرات الداعمة مع بقاء الملكية للجهة.", state: "allowed" },
  { label: "إرسال للمراجعة", description: "تحويل النسخة إلى مسؤول المراجعة مع بصمة وتاريخ في سجل التدقيق.", state: "review" },
  { label: "اعتماد البرمجة", description: "قرار مستقل يتطلب صلاحية اعتماد مخصصة ولا ينفذ من شاشة الإعداد.", state: "blocked" },
  { label: "النشر أو الإسناد", description: "خارج نطاق قسم البرمجة والتخطيط بالكامل ويظل ضمن المسارات المحمية الأخرى.", state: "blocked" },
];

const stateCopy: Record<PermissionState, { ar: string; className: string }> = {
  allowed: { ar: "مسموح ضمن النطاق", className: "bg-emerald-50 text-emerald-700" },
  review: { ar: "يتطلب مراجعة", className: "bg-amber-50 text-amber-700" },
  blocked: { ar: "غير متاح هنا", className: "bg-slate-100 text-slate-600" },
};

export default function AuthorityProgrammingPlanning({ onNavigate }: { onNavigate: (section: AuthoritySection) => void }) {
  return <section aria-labelledby="authority-planning-title" className="space-y-6">
    <div className="rounded-[28px] bg-[#092e49] p-7 text-white shadow-[0_18px_50px_rgba(9,46,73,.14)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-[.16em] text-[#b8e5d1]"><CalendarClock className="h-4 w-4" aria-hidden="true" /> قسم البرمجة والتخطيط</div>
          <h2 id="authority-planning-title" className="mt-3 text-2xl font-black sm:text-3xl">حوّل الاحتياج إلى برنامج قابل للمراجعة</h2>
          <p className="mt-3 max-w-2xl text-sm leading-8 text-white/70">مساحة إعداد وتنسيق وليست مساحة قرار نهائي. كل محتوى مساعد يبقى اقتراحاً يحتاج مراجعة بشرية، وكل انتقال حساس يخضع لملكية الجهة وسجل التدقيق.</p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-bold text-[#b8e5d1]"><ShieldCheck className="mb-2 h-5 w-5" aria-hidden="true" />صلاحيات أقل امتيازاً</div>
      </div>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button type="button" className="bg-[#b8e5d1] text-[#092e49] hover:bg-white" onClick={() => onNavigate("tender-documents")}><FilePlus2 className="ml-2 h-4 w-4" />إنشاء مسودة صفقة</Button>
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-xs text-white/70"><LockKeyhole className="h-4 w-4 text-[#b8e5d1]" />لا اعتماد أو إسناد من هنا</div>
      </div>
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]">
        <CardHeader className="border-b border-slate-100"><CardTitle className="text-lg text-[#092e49]">مصفوفة صلاحيات القسم</CardTitle><p className="text-sm leading-7 text-slate-500">توضح ما يمكن إعداده، وما يحتاج مراجعة، وما يبقى خارج هذا المسار.</p></CardHeader>
        <CardContent className="divide-y divide-slate-100 p-0">{rows.map(row => <div key={row.label} className="flex flex-wrap items-start justify-between gap-4 p-5"><div className="min-w-0 flex-1"><div className="flex items-center gap-2 font-bold text-[#092e49]"><CheckCircle2 className={`h-4 w-4 ${row.state === "allowed" ? "text-emerald-600" : "text-slate-300"}`} aria-hidden="true" />{row.label}</div><p className="mt-2 text-sm leading-7 text-slate-500">{row.description}</p></div><Badge className={`shrink-0 border-0 ${stateCopy[row.state].className}`}>{stateCopy[row.state].ar}</Badge></div>)}</CardContent>
      </Card>
      <Card className="border-0 bg-[#f7fbfa] shadow-[0_12px_40px_rgba(9,46,73,.05)]"><CardHeader><CardTitle className="text-lg text-[#092e49]">قواعد الحوكمة</CardTitle></CardHeader><CardContent className="space-y-4 text-sm leading-7 text-slate-600"><p><strong className="text-[#092e49]">فصل الواجبات:</strong> مُعدّ البرنامج لا يعتمد النسخة النهائية ولا ينفذ الإسناد.</p><p><strong className="text-[#092e49]">عزل الملكية:</strong> لا تظهر إلا سجلات الصفقات التابعة للمصلحة المتعاقدة الحالية.</p><p><strong className="text-[#092e49]">أثر قابل للتدقيق:</strong> الإرسال للمراجعة يسجل الفاعل والنتيجة والتوقيت والبصمة.</p><div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-900">الذكاء الاصطناعي هنا <strong>استشاري فقط</strong>؛ لا يتحول اقتراحه إلى اعتماد أو نشر تلقائي.</div></CardContent></Card>
    </div>
  </section>;
}
