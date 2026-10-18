# SYSTEM HEALTH — INTEGRATION LOGIC

## المبدأ

تُعامل أدوات المراقبة كمصادر خارجية اختيارية، ولا تُستدعى من صفحة عامة مباشرة. يمر أي قياس عبر خدمة خادمية تقوم بالتطبيع، إزالة البيانات الحساسة، وتحديد `source`, `observedAt`, `status`, و`availability`.

## Prometheus

يُفضّل أن يقرأ خادم داخلي مؤشرات محددة allowlist فقط، مثل زمن استجابة API، معدل أخطاء HTTP، واتصال قاعدة البيانات. لا تُرسل كلمات مرور أو رموز جلسات أو محتوى عروض. لا تُعرض عناوين Prometheus أو labels الداخلية للزائر العام.

```ts
type MetricSnapshot = {
  key: string;
  value: number | null;
  unit: string;
  status: "healthy" | "degraded" | "unavailable";
  source: "prometheus" | "internal" | "sentry";
  observedAt: string | null;
};
```

## Grafana

Grafana طبقة عرض داخلية وليست مصدر ثقة للصفحة العامة. يُستخدم رابط لوحة داخلية محمية أو proxy خادمي، ولا يتم تضمين iframe عام. تُطابق كل لوحة مع صلاحية تشغيلية واضحة وتُحفظ تغييراتها خارج الواجهة العامة.

## Sentry

يُستخدم لتجميع أخطاء التطبيق والسياق التقني فقط. يجب تنقية البريد، المعرفات الشخصية، التوكنات، محتوى الملفات، ومحتوى العروض قبل الإرسال. تعرض غرفة العمليات عدادات مجمعة لا stack traces للمستخدم العام.

## مسار الحادثة

```text
Probe/Metric → Server normalizer → Threshold evaluation
     → audit-safe incident record → internal notification
     → public status update only after human/operational policy
```

لا يتم تغيير الحالة العامة تلقائياً إلى حادثة حرجة اعتماداً على عتبة غير معتمدة. يمكن استخدام حالة `degraded` للفحص الحالي، مع مراجعة تشغيلية قبل نشر رسالة حادثة.

## عقود API المقترحة لاحقاً

- `system.status`: عام، يعرض الحالة الحالية للخدمات الأساسية فقط.
- `system.operationsOverview`: داخلي، محمي خادمياً، يعرض snapshots من مصادر allowlist.
- `system.incidents`: داخلي للقراءة/الإدارة، مع سجل تدقيقي.
- `system.publicIncident`: عام، يعرض رسالة حادثة منشورة ومراجعة فقط.

## ما لا يفعّل في هذه المرحلة

لا توجد حالياً وصلة إنتاجية موثقة إلى Prometheus أو Grafana أو Sentry، ولا عداد موثوق لعمليات AI اليومية، ولا تاريخ uptime لـ90 يوماً، ولا قياس Blockchain/WAF/DDoS. لذلك تُعرض هذه العناصر كغير متاحة بدلاً من اختلاق بيانات.
