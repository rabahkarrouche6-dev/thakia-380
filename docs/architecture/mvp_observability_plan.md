# MVP OBSERVABILITY PLAN

## الحكم التنفيذي

البنية الحالية تملك أدوات متفرقة لكنها لا تملك طبقة Product Analytics أو Error Monitoring مملوكة للتطبيق. يوجد endpoint تحليلات عام مدمج من بيئة Manus، كما توجد أدوات debug داخلية تلتقط الشبكة والواجهة مع تنقية لبعض الحقول، لكن لا يوجد عقد أحداث domain ثابت، ولا سجل أخطاء مركزي، ولا request/correlation ID محفوظ في قاعدة البيانات أو ممرر بوضوح عبر tRPC. أقل تنفيذ صالح للـ Pilot هو طبقة خفيفة داخل التطبيق: مُرسل أحداث مضبوط بقائمة سماح، إطلاق خادمي للأحداث الحساسة عند نجاح الإجراء أو فشله، إطلاق واجهة للأحداث العامة، logging JSON آمن للخادم، request ID لكل طلب، وErrorBoundary عربي لا يعرض stack trace.

## نتائج التدقيق الحالي

| المجال | الحالة الحالية | الفجوة العملية |
|---|---|---|
| Analytics provider | يوجد قياس عام مدمج يظهر في سجل الشبكة عبر `manus-analytics.com/api/send`، مع متغيرات `VITE_ANALYTICS_ENDPOINT` و`VITE_ANALYTICS_WEBSITE_ID` في البيئة. | لا يوجد catalog لأحداث المنتج ولا wrapper مملوك للتطبيق ولا ضوابط domain واضحة للأحداث المطلوبة. |
| Error monitoring | لا يوجد Sentry أو مزود أخطاء مستقل. أخطاء React تمر إلى `ErrorBoundary`، وأخطاء React Query تُسجل عبر `console.error`. | لا يوجد تجميع أو تصنيف آمن للأخطاء ولا ربط بمعرّف طلب. |
| Server logging | يوجد `console.log` و`console.error` مباشر في الخادم وOAuth، و`logAudit` durable للعمليات الحساسة. | لا يوجد logger منظم موحد أو request context، وقد تحتوي أخطاء غير منضبطة على تفاصيل أكثر من اللازم. |
| Request IDs | لا يوجد حقل request ID في `auditLogs` ولا middleware واضح يضيفه إلى كل طلب. | يلزم request ID في الذاكرة والسجلات والاستجابة، دون تغيير schema في MVP. |
| Privacy | `sanitizeAuditMetadata` ينقح مفاتيح حساسة مثل password وtoken وsecret وcontent، وأداة debug المدمجة تنقح حقولاً حساسة. | يلزم allowlist صريحة لأحداث analytics، ومنع URL/query/body/stack والملفات والبريد والمعرفات الشخصية من payload. |
| Fallback UI | يوجد fallback إنجليزي يعرض `error.stack`. | يجب استبداله بصفحة عربية RTL عامة مع request ID فقط إن توفر. |

## مبدأ التنفيذ

لا تُنشأ قاعدة بيانات جديدة للـ analytics في هذه المرحلة، ولا تُخزّن أحداث المنتج في جداول الأعمال، ولا تُرسل payloads كاملة من الطلبات. تُرسل الأحداث إلى endpoint التحليلات المتاح فقط عبر wrapper آمن. إذا لم يكن endpoint أو website ID متاحاً، يفشل القياس بصمت ولا يؤثر على تدفق الصفقات.

يُستخدم request ID عشوائي لكل طلب خادم. يُسمح بإعادته في header `x-request-id` وفي سجل الخادم، ويُعرض للمستخدم فقط في fallback عند الحاجة. لا يُستخدم request ID كمعرف مستخدم أو معرف منظمة.

## Event catalog MVP

| الحدث الثابت | نقطة الإطلاق | actor role | entity | النتيجة الآمنة |
|---|---|---|---|---|
| `landing_viewed` | mount الصفحة العامة | `anonymous` | `none` | `success` |
| `registration_started` | نقر بدء التسجيل/اختيار البوابة | `anonymous` | `none` | `success` |
| `registration_completed` | نجاح مصادقة/عودة OAuth | الدور المعروف إن توفر | `user` دون ID خارجي | `success`/`failure` |
| `login_succeeded` | نجاح OAuth الخادمي | الدور بعد upsert | `user` داخلي اختياري للخادم فقط | `success` |
| `login_failed` | فشل OAuth | `anonymous` | `none` | فئة آمنة مثل `oauth_callback_failed` |
| `role_portal_opened` | فتح البوابة بعد توجيه الدور | الدور الحالي | `portal` باسم ثابت | `success` |
| `tender_created` | نجاح `tenders.create` | `authority` | `tender` بمعرف داخلي خادمي فقط | `success` |
| `tender_published` | نجاح `tenders.publish` | `authority` | `tender` بمعرف داخلي خادمي فقط | `success` |
| `tender_viewed` | فتح تفاصيل صفقة منشورة | `supplier` أو `authority` | `tender` بمعرف داخلي خادمي فقط | `success` |
| `tender_search_performed` | تنفيذ بحث/تصفية | `supplier` | `tender_search` دون النص الخام | `success` |
| `bid_draft_saved` | نجاح إنشاء/تحديث المسودة | `supplier` | `bid` بمعرف داخلي خادمي فقط | `success` |
| `bid_submitted` | نجاح الإرسال النهائي | `supplier` | `bid` بمعرف داخلي خادمي فقط | `success` |
| `bid_submission_failed` | فشل الإرسال | `supplier` | `bid` دون محتوى | `failure` + category |
| `bid_opening_started` | محاولة/بدء جلسة الفتح | `authority` أو `admin` | `tender` خادمي فقط | `success`/`failure` |
| `bid_opening_completed` | نجاح الفتح | `authority` أو `admin` | `tender` خادمي فقط | `success` |
| `evaluation_started` | نجاح بدء التقييم | `authority` | `tender` خادمي فقط | `success` |
| `award_created` | نجاح قرار الإسناد/الإلغاء | `authority` | `tender` خادمي فقط | `success` |

لا يُرسل organization identifier في MVP لأن النموذج الحالي يملك `organizationName` و`registrationNumber` وقد يشكلان بيانات تعريفية مباشرة. إذا اعتمدت المراجعة القانونية إرسال معرف منظمة غير حساس، يُضاف لاحقاً كقيمة مشتقة ومشفرة/مجزأة خارج نطاق هذه النسخة.

## Error monitoring

يُطبّق `ErrorBoundary` على مستوى التطبيق مع رسالة عربية مؤسسية، زر إعادة المحاولة، ورقم طلب/مرجع تقني إن توفر؛ لا يُعرض stack trace أو رسالة الاستثناء الخام. تُسجل أخطاء الواجهة بصيغة آمنة تحتوي نوع الخطأ، route عام، request ID إن وجد، ونسخة التطبيق، دون state أو props أو body.

يُنشأ logger خادمي JSON يكتب مستوى الحدث، timestamp، request ID، method، route العام، status، duration، actor role إن كانت متاحة، وfailure category. لا يسجل Authorization headers أو cookies أو payloads أو أسماء الملفات أو محتوى الوثائق أو stack traces في الإنتاج. يمكن إبقاء stack trace في stdout التطويري فقط مع إزالة أي بيانات حساسة.

## Privacy controls

تُستخدم allowlist للأحداث والحقول، وتُحذف المفاتيح غير المعروفة قبل الإرسال. لا يُرسل البريد، الاسم، openId، IP، cookie، token، URL الكامل، query string، محتوى البحث، نص العرض، قيم الميزانية، محتوى الوثائق، أو stack trace. معرف الكيان لا يُرسل للعميل كسر ولا يُستخدم في analytics payload؛ إن احتاج الخادم ربطاً داخلياً يبقى داخل سجل آمن غير تحليلي.

## Dashboard Pilot المقترح

يُبنى dashboard بسيط من عدادات الأحداث دون تحليل أفراد: `landing_viewed → registration_started → login_succeeded → role_portal_opened → tender_published → bid_submitted`. يُعرض حسب الفترة والدور العام فقط، مع معدلات التحويل المجمعة وعدد الإخفاقات حسب failure category. لا يعرض أسماء، معرفات مؤسسات، معرفات مستخدمين، نصوصاً، أو تفاصيل عروض.

## خارج النطاق عمداً

لا تشمل هذه المرحلة session replay، heatmaps، profiling، تتبع IP، تسجيل payloads، مراقبة ملفات التخزين، tracing موزع، SLA/SLO رسمي، تنبيهات هاتفية، أو لوحات تحليلية متقدمة. كما لا تُعتبر أحداث analytics بديلاً عن Audit Trail القانوني؛ يبقى `auditLogs` هو المصدر التدقيقي للعمليات الحساسة.

## خطة التنفيذ

1. إنشاء wrapper موحد للأحداث مع allowlist وتنقية payload، وlogger خادمي مع request ID.
2. ربط الأحداث الخادمية بنجاحات وفشل إجراءات OAuth والصفقات والعروض والفتح والتقييم والإسناد.
3. ربط الأحداث العامة في Home/Login/Portal وبعض واجهات المورد والسلطة دون تكرار أو إرسال بيانات حساسة.
4. تعميم ErrorBoundary العربي وإضافة اختبار يثبت عدم كشف stack trace والبيانات الحساسة.
5. تشغيل typecheck وVitest وbuild، ومراجعة سجل الشبكة للتأكد من أن القياس لا يعطل التدفق.
