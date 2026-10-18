# خطة rollback والاسترجاع قبل Pilot

## نطاقها

الترحيلات الحالية versioned تحت `drizzle/` ويُطبَّق كل ملف مرة واحدة وفق `drizzle/meta/_journal.json`. لا تُنفَّذ عمليات `DROP` تلقائياً عند rollback لأن قاعدة البيانات تحتوي بيانات تشغيلية حساسة.

## آخر ترحيل غير هدّام

`0008_heavy_young_avengers.sql` يضيف فهارس فقط إلى `auditLogs` و`bids` و`tenders`. عكسه اليدوي، بعد أخذ نسخة احتياطية والتحقق من اسم الفهرس في قاعدة البيانات، هو:

```sql
DROP INDEX `audit_logs_created_at_idx` ON `auditLogs`;
DROP INDEX `bids_tender_status_idx` ON `bids`;
DROP INDEX `tenders_status_deadline_idx` ON `tenders`;
```

## الإجراء التشغيلي

قبل أي rollback، أوقف mutations التعاقدية، خذ نسخة احتياطية قابلة للاستعادة، تحقق من نسخة schema والبيانات، ثم نفّذ العكس في نافذة صيانة. بعد ذلك شغّل `pnpm check` و`pnpm test` و`pnpm build` واختبارات smoke لمسارات النشر وتقديم العرض وفتح العروض. لا يُعاد فتح العمليات إلا بعد تحقق مسؤولين اثنين من سلامة البيانات وسجل التدقيق.

## قاعدة أمان

لا يُستخدم `git reset --hard` أو حذف migration مطبق. إذا كان الإصلاح البرمجي هو سبب العطل، يُستعاد checkpoint البرمجي، بينما تُدار قاعدة البيانات بعكس migration موثق أو migration تصحيحي جديد. يجب تسجيل كل rollback في سجل التدقيق مع السبب والمنفذ والوقت ونتيجة التحقق.
