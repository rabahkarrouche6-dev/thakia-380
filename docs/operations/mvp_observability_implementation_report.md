# MVP OBSERVABILITY IMPLEMENTATION REPORT

## Executive summary

أضيفت طبقة MVP للقياس والمراقبة لمنصة **صفقات ذكية** دون إنشاء جدول تحليلات جديد، ودون تخزين محتوى الأعمال أو كلمات المرور أو الوثائق أو رموز الجلسات. تعتمد الطبقة على مزود Umami الموجود مسبقاً في `client/index.html` للقياس المنتجّي، وعلى سجل خادم منظم بصيغة JSON لمراقبة الطلبات والأحداث الحساسة، مع `request ID` قابل للتتبع بين الطلب والاستجابة.

> القياس المنتجّي في هذا الإصدار مخصص لفهم المسار التشغيلي في Pilot، وليس لبناء ملف سلوكي للمستخدم أو تخزين بيانات شخصية.

## الأداة والبنية المستخدمة

| المجال | البنية المستخدمة | النتيجة |
|---|---|---|
| Product Analytics | `VITE_ANALYTICS_ENDPOINT` و`VITE_ANALYTICS_WEBSITE_ID` مع `client/src/lib/analytics.ts` | إرسال قائمة سماح من الأحداث المختصرة فقط، مع `credentials: omit` وبدون معرفات كيان على العميل |
| Error Monitoring | `trackError` في `client/src/lib/analytics.ts` و`ErrorBoundary` | إرسال فئة خطأ تقنية محدودة ومسار منزوع query، دون stack trace أو payload |
| Server Logging | `server/_core/observability.ts` | سجل JSON يتضمن timestamp وlevel وevent وسياقاً تقنياً محدوداً |
| Request Correlation | middleware في `server/_core/index.ts` | إنشاء أو قبول `x-request-id` آمن وإعادته في الاستجابة |
| Audit Trail | النظام القائم في `server/db.ts` و`server/routers.ts` | بقي مستقلاً كمصدر التدقيق القانوني؛ طبقة observability لا تستبدله ولا تنسخ محتوى السجلات الحساسة |
| Privacy | قائمة سماح، حذف الحقول الحساسة، منع credentials، وعدم إرسال document content | لا توجد migration أو secrets جديدة |

## Event catalog ومكان إطلاق كل حدث

| الحدث | نقطة الإطلاق | actor role | entity type | النتيجة |
|---|---|---|---|---|
| `landing_viewed` | mount في `Home.tsx` | anonymous | none | success |
| `registration_started` | زر الدخول من `Home.tsx` أو اختيار بوابة Login | anonymous | portal | success |
| `registration_completed` | OAuth callback بعد إنشاء مستخدم غير موجود سابقاً | الدور الفعلي | user | success |
| `login_succeeded` | OAuth callback بعد إنشاء الجلسة | الدور الفعلي | user | success |
| `login_failed` | catch في OAuth callback | anonymous | none | failure مع `oauth_callback_failed` |
| `role_portal_opened` | نجاح `auth.setRole` عبر مراقب mutations المركزي في `main.tsx` | الدور الحالي | portal | success/failure |
| `tender_created` | نجاح `tenders.create` | الدور الحالي | tender | success/failure |
| `tender_published` | نجاح `tenders.publish` | الدور الحالي | tender | success/failure |
| `tender_viewed` | فتح بطاقة صفقة في `SupplierWorkspace.tsx` | supplier | tender | success |
| `tender_search_performed` | تغيير معيار البحث أو التصفية أو الفرز | supplier | tender_search | success |
| `bid_draft_saved` | نجاح `bids.createDraft` أو `bids.updateDraft` | الدور الحالي | bid | success/failure |
| `bid_submitted` | نجاح `bids.submit` | الدور الحالي | bid | success/failure |
| `bid_submission_failed` | حالة فشل `bids.submit` | الدور الحالي | bid | failure؛ تصنيفها الحالي server_failure عام |
| `bid_opening_started` | العقد محفوظ ضمن catalog للتوسعة الآمنة | — | tender | غير مطلق كحدث مستقل في هذه النسخة |
| `bid_opening_completed` | نجاح `bidOpening.open` | الدور الحالي | tender | success/failure |
| `evaluation_started` | نجاح `tenders.startEvaluation` | الدور الحالي | tender | success/failure |
| `award_created` | نجاح `awards.decide` | الدور الحالي | tender | success/failure |

تتعمد طبقة العميل عدم إرسال `entityId`، أو عنوان المؤسسة، أو قيمة العرض، أو نص البحث، أو أسماء الملفات. أما `entityId` الداخلي، عند الحاجة إلى الربط التشغيلي، فيظهر فقط في سجل الخادم المنظم ولا يخرج إلى المتصفح.

## تصميم الفشل الآمن

تُستخدم فئات ثابتة مثل `validation` و`unauthorized` و`forbidden` و`not_found` و`deadline_passed` و`conflict` و`oauth_callback_failed` و`network` و`server_failure`. لا تُرسل رسائل الاستثناء كاملة إلى مزود analytics، ولا stack trace، ولا جسم الطلب، ولا query parameters. ما زالت بعض أحداث mutations المركزية تستخدم `server_failure` العام لأن طبقة client لا تفكك أخطاء الأعمال إلى فئاتها التفصيلية؛ وهذا مقصود لتجنب تسريب رسائل الخادم في MVP.

## Error boundaries وfallback العربية

تم تحديث `client/src/components/ErrorBoundary.tsx` ليعرض fallback عربية مؤسساتية بعنوان **حدث خطأ غير متوقع** ورسالة إجراء واضحة وزر **إعادة المحاولة**. عند التقاط الخطأ، يرسل المكوّن فئة اسم الخطأ التقني ومسار الصفحة دون query إلى `trackError`. لا يعرض الواجهة stack trace للمستخدم ولا يرسله إلى analytics.

كما يلتقط `client/src/main.tsx` أخطاء الاستعلامات والـ mutations ويربطها بصفحة المسار الحالية، مع إبقاء فشل طبقة الرصد غير مؤثر في المسار الأساسي.

## Server logging وrequest IDs

يضيف `server/_core/observability.ts` middleware لإنشاء `x-request-id` أو قبول قيمة آمنة مطابقة للنمط المسموح، ثم يعيدها في response header. ويسجل middleware الطلبات بصيغة JSON تشمل method وroute وstatus وdurationMs وactorRole. لا يسجل `authorization` أو `cookie` أو `password` أو `token` أو `secret` أو `body` أو `query` أو `params` أو `content` أو `stack`.

تسجل أحداث OAuth والأحداث المنتجية الخادمية عبر `logProductEvent`، مع timestamp من الخادم وrequest ID وentity ID داخلي عند توفره. لا تُعتبر هذه السجلات بديلاً عن Audit Trail؛ فهي مخصصة للمراقبة التشغيلية والتحليل التجميعي.

## Privacy controls

| الضابط | التطبيق |
|---|---|
| تقليل البيانات | إرسال اسم الحدث والدور والنتيجة ونوع الكيان فقط |
| عدم إرسال الأسرار | `credentials: "omit"`، وعدم قراءة أو إرسال cookies أو authorization headers |
| عدم إرسال محتوى الأعمال | لا تُرسل عروض، وثائق، نصوص proposals، قيم مالية، أو نصوص بحث |
| عدم كشف معرفات الكيانات للعميل | wrapper العميل لا يقبل `entityId` أصلاً ضمن `SafeProductEvent` |
| حماية السجلات | logger يحذف الحقول الحساسة بالاسم قبل إخراج JSON |
| فشل الرصد | جميع عمليات الإرسال محاطة بمعالجة فشل لا توقف المنتج |
| القانون والحوكمة | لم تُضف موافقة قانونية أو retention policy جديدة؛ يجب اعتمادها تشغيلياً قبل Pilot |

## Verification

| الفحص | النتيجة |
|---|---|
| TypeScript | ناجح عبر `pnpm check` |
| Vitest | ناجح: **14 ملفاً، 52 اختباراً** |
| Observability contract tests | ناجحة: 3 اختبارات للأسماء والخصوصية وrequest ID/fallback |
| Build | ناجح عبر `pnpm build` |
| Error fallback | تحقق نصي من fallback العربية وربطه بـ `trackError` |
| Privacy contract | تحقق من غياب password وdocument content وstack في payload العميل، وتنقية الحقول الخادمية |
| RTL/mobile | لم يتغير layout؛ fallback يستخدم اتجاه التطبيق الحالي ويظل قابلاً للعرض على الهاتف |

يحذر البناء من وجود chunks كبيرة مسبقاً، وهو تحذير أداء غير مانع للنشر ولم ينتج عن إضافة observability وحدها.

## Dashboard بسيط مقترح للـ Pilot

يُبنى dashboard التجريبي كتجميع زمني للأحداث دون بيانات فردية:

```text
landing_viewed
  → registration_started
  → registration_completed / login_succeeded
  → role_portal_opened
  → tender_published
  → bid_submitted
```

| المؤشر | التعريف | الغرض |
|---|---|---|
| Visits | عدد `landing_viewed` الفريد/الإجمالي حسب سياسة المزود | قياس الوصول الأولي |
| Registrations | عدد `registration_completed` | قياس اكتمال التسجيل الفعلي |
| Active users | مستخدمون نشطون وفق تعريف مزود analytics المجهل أو aggregate server logs | قياس الاستخدام دون تصدير هوية |
| Tender published | عدد `tender_published` الناجحة | قياس تفعيل المصلحة المتعاقدة |
| Bid submitted | عدد `bid_submitted` الناجحة | قياس تفعيل المتعامل الاقتصادي |

ينبغي قراءة هذه المؤشرات حسب الفترة والدور والنتيجة فقط. لا يُقترح في MVP تخزين cohort فردي، أو تسجيل session replay، أو تتبع حقول النماذج، أو بناء لوحة مالية.

## ما لم يتم قياسه عمداً

لم يتم قياس محتوى الوثائق أو أسماء الملفات أو قيم الميزانيات والعروض أو نصوص البحث أو العناوين المؤسسية أو البريد الإلكتروني أو أرقام التسجيل أو session replay أو سلوك النقر التفصيلي. كما لم يُنشأ endpoint تحليلات داخلي دائم أو جدول events في قاعدة البيانات، لأن ذلك يوسع النطاق ويخلق عبئاً قانونياً وتشغيلياً قبل إثبات الحاجة.

لم يُطلق `bid_opening_started` كحدث مستقل لأن التدفق الحالي يملك عملية خادمية ذرية لفتح العروض ولا يوفر نقطة بدء منفصلة مستقرة عن محاولة الفتح نفسها. بقي الاسم ضمن العقد الموحد حتى لا تتغير قائمة السماح لاحقاً، بينما يغطي `bid_opening_completed` النجاح الفعلي. كذلك لا يمكن فصل `bid_submission_failed` عن كل فشل mutation عام إلا بإضافة تصنيف خطأ خادمي مشترك، لذلك يرسل MVP فئة عامة آمنة.

## الملفات المتغيرة والمضافة

| الملف | التغيير |
|---|---|
| `shared/observability.ts` | عقد أسماء الأحداث والأدوار والفئات الآمنة |
| `client/src/lib/analytics.ts` | wrapper مزود analytics وتنقية payload وtrackError |
| `client/src/main.tsx` | ربط أخطاء queries وmutations وقياس نجاح/فشل إجراءات الأعمال |
| `client/src/pages/Home.tsx` | `landing_viewed` و`registration_started` |
| `client/src/pages/LoginRedirect.tsx` | قياس بدء الدخول من سياق البوابة |
| `client/src/pages/SupplierWorkspace.tsx` | قياس عرض الصفقة والبحث/التصفية |
| `client/src/components/ErrorBoundary.tsx` | fallback عربية وربط أخطاء تقنية آمن |
| `server/_core/observability.ts` | request ID وJSON logging وserver product events |
| `server/_core/index.ts` | middleware للـ request ID وقياس الطلبات |
| `server/_core/oauth.ts` | login/registration success وOAuth failure events |
| `server/observability.contract.test.ts` | اختبارات عقد القياس والخصوصية |
| `mvp_observability_plan.md` | خطة ما قبل التنفيذ |

## المخاطر والقيود المتبقية

الخطر الرئيسي قبل Pilot هو اعتماد dashboard التجميعي على إعدادات retention والوصول لدى مزود Umami، وهي لم تُضف لها سياسة قانونية داخل التطبيق. يجب اعتماد مدة الاحتفاظ، ومكان المعالجة، وصلاحيات الوصول إلى لوحة المزود من الجهة المسؤولة عن الحوكمة.

كما أن `request ID` محلي لكل طلب ولا يمثل trace موزعاً بين خدمات خارجية، وهو كافٍ لـ MVP أحادي الخادم لكنه لا يعوض OpenTelemetry أو distributed tracing. وأخيراً، تصنيف أخطاء mutations ما زال محافظاً وعاماً في المتصفح؛ يمكن تحسينه لاحقاً عبر error codes خادمية ثابتة دون إرسال الرسائل الخام.

## الحكم النهائي

التنفيذ صالح كطبقة **Pilot MVP** للمراقبة والقياس الأساسي، بشرط إقرار سياسة الخصوصية والاحتفاظ والوصول إلى analytics قبل تشغيل Pilot فعلياً. لم تُضف ميزات أعمال أو حالات قاعدة بيانات أو بيانات تجريبية، ولم تُمس حماية الصلاحيات أو تدفق الصفقة.
