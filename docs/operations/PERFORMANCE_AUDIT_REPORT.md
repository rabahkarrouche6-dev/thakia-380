# Performance Audit

## Findings

| Bottleneck | Location | Impact | Cause | Fix | Priority |
|---|---|---|---|---|---|
| استعلامات قوائم غير محدودة | `server/db.ts:150-166`, `server/db.ts:189-201`, `server/db.ts:247-283` — `listAllTenders`, `listPublishedTenders`, `listTendersForAuthority`, `listAllBids`, `listBidsForTender`, `listBidsForSupplier`, وقوائم الوثائق | حجم الاستجابة وزمن القراءة والذاكرة ينموان مع عدد الصفوف. الاختناق مثبت بنيوياً؛ لا توجد قياسات إنتاجية متاحة لتحديد مقدار التأثير | لا يوجد `limit/offset` أو cursor في إجراءات القوائم | إضافة cursor pagination وحد أقصى خادمي، وإرجاع الحقول اللازمة فقط. لا تستخدم `select_related/prefetch_related`؛ هذه ليست Django/DRF | P1 |
| مسح جداول كامل لحساب الإحصاءات | `server/db.ts:374-384` — `getPlatformStats` | كل استدعاء ينفذ خمس قراءات، أربع منها تقرأ جداول كاملة (`tenders` مرتين، `bids`، `auditLogs`). الزمن والـI/O يتوسعان خطياً مع البيانات | استخدام `select().from(...)` بلا `count(*)` أو projection مناسب، مع إعادة صفوف كاملة رغم الحاجة إلى أعداد | استبدالها بـ`count(*)`/`count` projected queries، واستخدام استعلامات مجمعة مشروطة. قياس `EXPLAIN` قبل وبعد | P1 |
| مسح جداول كامل في نظرة الإدارة الرقابية | `server/db.ts:387-405` — `getRegulatorOverview` | القراءة تعيد جميع صفوف `tenders` و`bids` ثم تحسب الأعداد في الذاكرة؛ التأثير يتوسع مع البيانات | اختيار صفوف كاملة (`select().from`) بدلاً من counts/grouping خادمية | نقل التجميع إلى SQL عبر `count` و`groupBy`/conditional aggregates، وإرجاع الأعمدة المطلوبة فقط | P1 |
| فهارس ثانوية غير موجودة على predicates والترتيب المتكرر | `drizzle/schema.ts:1-170`; الجداول الأساسية تحتوي PK فقط، بينما الاستعلامات تستخدم `status`, `deadline`, `publishedAt`, `authorityId`, `tenderId`, `supplierId`, `userId`, و`createdAt` للفرز | خطط القراءة قد تتحول إلى table scans/filesort عند نمو الجداول. غياب الفهارس مثبت؛ تكلفة فعلية تحتاج `EXPLAIN` على قاعدة بيانات ممثلة | لا توجد `index()`/`uniqueIndex()` ثانوية في schema المقروء | بعد قياس `EXPLAIN`: فهارس مركبة مرشحة مثل `tenders(status, deadline, publishedAt)`, `tenders(authorityId, createdAt)`, `bids(tenderId, createdAt)`, `bids(supplierId, createdAt)`, `auditLogs(createdAt)`, ووثائق FK مع ترتيب مناسب. لا تُطبّقها قبل قياس الانتقائية | P1 |
| فرز سجل التدقيق على عمود غير مفهرس | `server/db.ts:368-371`, `server/db.ts:400` — `listAuditLogs` و`getRegulatorOverview` | `ORDER BY createdAt DESC` قد يفرز مجموعة كبيرة قبل تطبيق `LIMIT`; التأثير الفعلي يعتمد على حجم `auditLogs` وخطة التنفيذ | لا يظهر فهرس على `auditLogs.createdAt` في schema | إضافة index على `createdAt` بعد التحقق بـ`EXPLAIN`; إبقاء `LIMIT` الخادمي | P1 |
| تحليل العروض يقرأ كل عروض الصفقة دفعة واحدة | `server/db.ts:216` داخل فتح العروض، و`server/db.ts:195-198` — `listBidsForTender` | الذروة في الذاكرة ووقت المعاملة ترتفع مع عدد العروض؛ لا توجد pagination في القراءة | `select().from(bids)` مع filter على `tenderId` دون projection أو حد | استخدام projection للحقول اللازمة، index على `tenderId`, ومعالجة/تجميع streaming أو chunks إذا كان workflow يسمح بذلك. لا تغيّر workflow قبل قياس حجم العروض | P1 |
| تحليل body بحجم 50MB على مستوى Express العام | `server/_core/index.ts:42-43` — `express.json({ limit: "50mb" })` و`express.urlencoded({ limit: "50mb" })` | كل route JSON/urlencoded يقبل ويحلل body كبيراً؛ يزيد استهلاك CPU والذاكرة عند الطلبات الكبيرة. لم يثبت وجود اختناق فعلي في الإنتاج | حد parsing عام مرتفع، رغم أن رفع الملفات يستخدم تخزيناً منفصلاً | خفض الحد إلى حجم API الفعلي، أو تطبيق parser محدود على مسارات تحتاجه فقط، ورفض payloads الكبيرة قبل parsing حيث أمكن | P2 |

## Not Findings

| Bottleneck | Location | Impact | Cause | Fix | Priority |
|---|---|---|---|---|---|
| N+1 في الاستعلامات المقروءة | لم يثبت من القراءة الحالية | غير مثبت | لم يظهر loop يطلق استعلاماً لكل صف في الأدلة المتاحة | لا تغيير قبل profiler/query trace يثبت N+1 | — |
| Caching مفقود | المشروع الحالي | لا يمكن اعتباره bottleneck دون hit-rate/latency baseline | لم يظهر cache provider في الفحص | لا تضف cache قبل قياس وتحليل invalidation | — |
| `select_related/prefetch_related` | غير منطبق | لا أثر | المشروع React + tRPC + Drizzle + Express، وليس Django/DRF | استخدم Drizzle joins/projections عند الحاجة | — |
| DRF أو Django production settings | غير موجودة | لا أثر | لا توجد `manage.py` أو `settings.py` أو DRF في المشروع | تدقيق Express/Vite/Drizzle بدلاً من Django checklist | — |
