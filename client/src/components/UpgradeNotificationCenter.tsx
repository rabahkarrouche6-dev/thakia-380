import { useEffect } from "react";
import { Bell, CheckCircle2, CircleAlert, Clock3, Info, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const statusMeta: Record<string, { label: string; className: string; icon: typeof Clock3 }> = {
  pending_contact: { label: "قيد المراجعة", className: "bg-amber-50 text-amber-800", icon: Clock3 },
  approved: { label: "تمت الموافقة", className: "bg-emerald-50 text-emerald-800", icon: CheckCircle2 },
  rejected: { label: "لم تتم الموافقة", className: "bg-red-50 text-red-800", icon: XCircle },
  needs_info: { label: "يلزم استكمال بيانات", className: "bg-blue-50 text-blue-800", icon: CircleAlert },
};

const formatDate = (value: Date | string | null | undefined) => value ? new Date(value).toLocaleString("ar-DZ", { dateStyle: "medium", timeStyle: "short" }) : "—";

type UpgradeNotificationRole = "authority" | "supplier";

export function UpgradeNotificationCenter({ compact = false, role }: { compact?: boolean; role: UpgradeNotificationRole }) {
  const utils = trpc.useUtils();
  const notificationsEnabled = role === "authority" || role === "supplier";
  const notifications = trpc.subscriptions.notifications.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
    enabled: notificationsEnabled,
  });

  useEffect(() => {
    if (!notificationsEnabled) return;
    const stream = new EventSource("/api/notifications/stream");
    const refresh = () => void utils.subscriptions.notifications.invalidate();
    stream.addEventListener("notifications", refresh);
    stream.onerror = () => stream.close();
    return () => stream.close();
  }, [notificationsEnabled, utils]);
  const markRead = trpc.subscriptions.markNotificationRead.useMutation({
    onSuccess: () => utils.subscriptions.notifications.invalidate(),
    onError: error => toast.error(error.message || "تعذر تحديث حالة الإشعار"),
  });
  const markAllRead = trpc.subscriptions.markAllNotificationsRead.useMutation({
    onSuccess: async () => {
      await utils.subscriptions.notifications.invalidate();
      toast.success("تم تحديد جميع الإشعارات كمقروءة");
    },
    onError: error => toast.error(error.message || "تعذر تحديث الإشعارات"),
  });

  const items = notifications.data?.items ?? [];
  const unreadCount = notifications.data?.unreadCount ?? 0;

  const markOneRead = (notificationId: number, readAt: Date | string | null) => {
    if (!readAt && !markRead.isPending) markRead.mutate({ notificationId });
  };

  if (notifications.isLoading) {
    return <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]" aria-busy="true"><CardContent className="flex items-center gap-3 p-5 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin text-[#0d8062]" />جاري تحميل إشعارات طلبات الترقية…</CardContent></Card>;
  }

  if (notifications.isError) {
    return <Card className="border border-amber-100 bg-amber-50/60 shadow-none"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div className="flex items-start gap-3"><CircleAlert className="mt-1 h-5 w-5 shrink-0 text-amber-700" /><div><div className="font-bold text-[#092e49]">تعذر تحميل الإشعارات</div><p className="mt-1 text-sm leading-7 text-slate-600">يمكنك إعادة المحاولة دون التأثير على طلب الترقية. ستُحدّث القائمة تلقائياً عند بقاء البوابة مفتوحة.</p></div></div><Button type="button" variant="outline" onClick={() => notifications.refetch()}><RefreshCw className="ml-2 h-4 w-4" />إعادة المحاولة</Button></CardContent></Card>;
  }

  return <Card className="border-0 shadow-[0_12px_40px_rgba(9,46,73,.07)]" aria-label="مركز إشعارات طلبات الترقية">
    <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-100">
      <div><CardTitle className="flex items-center gap-2 text-lg text-[#092e49]"><Bell className="h-5 w-5 text-[#0d8062]" />متابعة طلب الترقية{unreadCount > 0 && <Badge className="rounded-full border-0 bg-[#0d8062] px-2.5 text-white">{unreadCount} جديد</Badge>}</CardTitle><p className="mt-1 text-sm leading-7 text-slate-500">تظهر هنا آخر تحديثات طلبات الترقية المرتبطة بحسابك فقط.</p></div>
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => markAllRead.mutate()} disabled={!unreadCount || markAllRead.isPending} className="text-xs text-[#0d8062] hover:bg-emerald-50">
          {markAllRead.isPending && <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin" />}
          تحديد الكل كمقروء
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="تحديث الإشعارات" onClick={() => notifications.refetch()} disabled={notifications.isFetching || markAllRead.isPending}><RefreshCw className={`h-4 w-4 ${notifications.isFetching ? "animate-spin" : ""}`} /></Button>
      </div>
    </CardHeader>
    <CardContent className={compact ? "p-4" : "p-5"}>
      {!items.length ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center"><Info className="mx-auto h-6 w-6 text-slate-400" /><div className="mt-3 font-semibold text-[#092e49]">لا توجد تحديثات بعد</div><p className="mt-1 text-sm leading-7 text-slate-500">عند إرسال طلب ترقية أو تحديث حالته سيظهر هنا إشعار مرتبط بحسابك.</p></div> : <div className="space-y-3">{items.map(item => { const meta = statusMeta[item.status] || statusMeta.pending_contact; const Icon = meta.icon; return <article key={item.id} className={`rounded-2xl border p-4 transition ${item.readAt ? "border-slate-100 bg-white" : "border-[#b8e5d1] bg-[#f5fbf7]"}`} onClick={() => markOneRead(item.id, item.readAt)}><div className="flex items-start gap-3"><Icon className="mt-1 h-5 w-5 shrink-0 text-[#0d8062]" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div className="font-bold text-[#092e49]">{item.title}</div><Badge className={`rounded-full border-0 ${meta.className}`}>{meta.label}</Badge></div><p className="mt-2 text-sm leading-7 text-slate-600">{item.message}</p><div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400"><span>الخطة: {item.planCode}</span><span>{formatDate(item.createdAt)}</span>{!item.readAt && <span className="font-semibold text-[#0d8062]">غير مقروء</span>}</div></div></div></article>; })}</div>}
    </CardContent>
  </Card>;
}
