# SMART DEALS MVP GAP AUDIT

## Executive verdict

أُجري هذا التدقيق على الكود الحالي فعلياً في `/home/ubuntu/safaqat-dhakiya`، مع الالتزام بعدم تعديل أي ملف وظيفي أو إنشاء أي feature أو بيانات تجريبية أثناء الفحص. النتيجة التنفيذية هي:

> **NOT_READY** — النسخة الحالية مناسبة للتجربة الداخلية والعرض المراقب، لكنها ليست جاهزة بعد لـ Pilot تشغيلي يتعامل مع صفقات عمومية حقيقية.

يوجد أساس full-stack حقيقي ومترابط نسبياً: React/Vite/Wouter في الواجهة، Express/tRPC في الخادم، وDrizzle مع MySQL/TiDB في قاعدة البيانات. كما أن إنفاذ الموعد النهائي لتقديم العرض أُضيف على الخادم وأصبح مغطى باختبار مباشر. لكن ما زالت توجد موانع P0 في اعتماد الأدوار، فتح العروض، محضر الفتح، حماية الملفات، وإثبات دورة تشغيل كاملة ببيئة شبيهة بالإنتاج.

## ملاحظة بنيوية حاسمة

وصف المهمة السابق يشير إلى Django/DRF وNext.js وPostgreSQL، لكن المستودع المفحوص لا يحتوي هذه البنية. لا توجد `manage.py` أو Django apps/models/serializers أو ملفات Next.js من نمط `page.tsx` و`layout.tsx`، ولا يظهر PostgreSQL في الاعتمادات. البنية الفعلية هي:

| الطبقة | الواقع المثبت | الأدلة المحلية |
|---|---|---|
| الواجهة | React 19 + Vite + Wouter + Tailwind 4 | `client/src/App.tsx`, `client/src/pages/*`, `package.json` |
| الخادم | Express + tRPC 11 | `server/_core/index.ts`, `server/routers.ts` |
| قاعدة البيانات | Drizzle ORM على MySQL/TiDB | `drizzle/schema.ts`, `drizzle.config.ts`, `mysql2` في `package.json` |
| المصادقة | Manus OAuth، JWT cookie، وBearer fallback للمعاينة | `server/_core/oauth.ts`, `server/_core/sdk.ts`, `client/src/pages/LoginRedirect.tsx` |
| التخزين | Forge presigned PUT/GET primitives فقط | `server/storage.ts` |
| الاختبارات | Vitest في Node، مع اختبارات workflow وpermissions وsource-contract | `server/*.test.ts`, `vitest.config.ts` |
| النشر | Vite build ثم esbuild لخادم الإنتاج | `package.json`, نتيجة `pnpm build` |

## تصنيف المجالات

| المجال | الحالة | الدليل من الكود | المخاطر | الأولوية |
|---|---|---|---|---|
| التسجيل والدخول واسترجاع كلمة المرور | **PARTIAL** | OAuth callback يتحقق من `code` و`state` وnonce، وينشئ جلسة JWT؛ `auth.me` و`auth.logout` موجودان. صفحة `Login.tsx` تقدم اختيار سياق البوابة وإرشادات استعادة الوصول، لكن كلمة المرور والاسترجاع يديرهما المزود الخارجي فقط | لا توجد عملية تسجيل محلية أو reset محلي أو مسار بديل عند فشل مزود الدخول؛ اختيار البوابة ليس اعتماداً مؤسسياً | P1 |
| الصلاحيات حسب الدور | **PARTIAL** | `roleProcedure` يفرض الأدوار خادمياً، واختبارات `permissions.test.ts` تثبت عزل عدة إجراءات. لكن `auth.setRole` يقبل `supplier` و`authority` و`regulator` من حساب حالته `user` دون workflow اعتماد مستقل | يستطيع المستخدم تعيين دور حساس لنفسه؛ أخطرها `regulator` و`authority` | P0 |
| إنشاء الصفقة ونشرها | **IMPLEMENTED_AND_VERIFIED** | `tenders.create/update/publish` موجودة، والملكية تتحقق خادمياً، والحالات المطلوبة من الإنشاء والنشر مغطاة في اختبارات تدفق الإنشاء والصلاحيات | لا توجد مراجعة أو اعتماد مستقل قبل النشر، كما أن النشر يتم مباشرة من authority المخول | P1 |
| البحث عن الصفقات وعرض التفاصيل | **PARTIAL** | `tenders.published` و`tenders.get` موجودان، وSupplier Workspace يعرض الصفقات مع تصفية وفرز محليين. الاستعلام المنشور يعرض فقط `published` ذات `deadline` مستقبلية | `tenders.get` عام، ولا توجد pagination أو بحث خادمي؛ قد يكشف تفاصيل غير مقصودة إذا أضيفت حقول حساسة لاحقاً | P1 |
| تقديم العرض ورفع الوثائق | **PARTIAL** | `bids.submit` ينشئ عرضاً بحقلي المبلغ والنص الفني، لكن جدول `bids` لا يحتوي وثائق أو مرفقات، ولا يوجد document model أو endpoint مجالـي لرفعها | لا يمكن إثبات رفع الوثائق أو ارتباطها بالعرض أو صلاحيات تنزيلها | P0 |
| منع تعديل/تقديم العرض بعد انتهاء الأجل | **IMPLEMENTED_NOT_VERIFIED** | الخادم يقارن `tender.deadline` مع `Date.now()` داخل `bids.submit`، واستعلام الصفقات المنشورة يستبعد الأجل المنتهي، ويوجد اختبار مباشر لرفض العرض بعد الأجل | الاختبار الحالي لا يثبت race condition أو atomicity على قاعدة البيانات في بيئة إنتاجية؛ لا توجد عملية تحديث عرض، وهو آمن حالياً بغيابها لكنه غير موثق كسياسة انتقال كاملة | P0 |
| فتح العروض بعد الوقت القانوني فقط | **MISSING** | توجد `tenders.close` و`tenders.startEvaluation` فقط. لا توجد `openBids`، ولا نافذة فتح، ولا وقت فتح مستقل، ولا صلاحية منفصلة أو سجل حدث فتح | يمكن الانتقال من الإغلاق إلى التقييم دون إثبات فتح قانوني قابل للتدقيق | P0 |
| محضر فتح العروض | **MISSING** | لا يوجد جدول أو endpoint أو صفحة لمحضر فتح؛ `auditLogs` سجل عام ولا يكوّن محضراً قانونياً immutable | لا يمكن إثبات قائمة العروض والمبالغ والفاعل ووقت الفتح والنتيجة في وثيقة منظمة | P0 |
| التقييم والإرساء | **PARTIAL** | `bids.evaluate` يتحقق من ملكية authority وانتماء العرض وحالة `evaluation`، و`awards.decide` يتحقق من وجود العرض الفائز وقبوله، مع تسجيل audit | لا توجد معايير أو مصفوفة تقييم أو فصل صلاحيات أو اعتماد ثانٍ؛ لا يوجد نموذج Contract بعد الإرساء | P1 |
| سجل التدقيق Audit Trail | **PARTIAL** | جدول `auditLogs` يحوي actor/action/entity/result/metadata/createdAt، وتُسجل أحداث الإنشاء والنشر والإغلاق والتقييم والإرساء وتقديم العرض وتحديث الملف، وقراءة السجل مقيدة بـ regulator/admin | الحقول لا تطابق بالكامل المرجع المطلوب: لا يوجد `actor_role` أو `request_id` مستقل أو `safe_metadata` مسمى؛ لا توجد سياسة retention/export/immutability، ولا تغطية شاملة للقراءات والفشل | P1 |
| حماية الملفات | **MISSING** | `storagePut` و`storageGetSignedUrl` يوفران primitives عامة، لكن لا يوجد نموذج وثيقة أو ربط بصفقة/عرض أو authorization على القراءة أو سجل وصول | لا يجوز اعتبار storage primitive حماية مجال؛ خطر تسريب الملفات عند إضافة الرفع | P0 |
| حالات loading/empty/error | **IMPLEMENTED_NOT_VERIFIED** | Supplier وAuthority وRegulator تعرض loading/empty/error، وتم تحسين رسائل مصدر الخطأ في Supplier Workspace؛ الاختبارات الحالية source-contract بدرجة كبيرة | لا توجد تغطية متصفح آلية لأخطاء الشبكة وإعادة المحاولة وتزامن الحالات؛ التحقق البصري منفصل عن اختبار السلوك | P2 |
| التنبيهات والإشعارات | **MISSING** | لا يوجد جدول notifications أو router مجالـي أو inbox؛ الموجود رسائل toast محلية ونتائج mutation | لا توجد قناة موثوقة للتنبيه بالنشر أو قرب deadline أو الإيداع أو الإسناد أو الرفض | P1 |
| تحليلات الإدارة المركزية | **PARTIAL** | `regulator.stats`, `regulator.overview`, `regulator.audit`, `regulator.tenders` موجودة، وRegulatorOverview يعرض KPIs وتوزيع الحالات من بيانات فعلية | التحليل وصفي آني؛ لا توجد اتجاهات زمنية أو مؤشرات مخاطر أو SLA أو drill-down تشغيلي كامل | P1 |
| المراقبة والأخطاء التشغيلية | **PARTIAL** | توجد سجلات خادم وVite وOAuth، وتعريفات env، ويمكن تشغيل build وtest. توجد تحذيرات حجم chunks في البناء | لا يظهر structured logging موحد أو request/correlation id أو error tracking أو health/readiness endpoint أو alerting تشغيلي شامل | P1 |
| الاختبارات والنشر | **IMPLEMENTED_NOT_VERIFIED** | `pnpm check` نجح، و`pnpm test` نجح بـ10 ملفات و36 اختباراً، و`pnpm build` نجح. `pnpm lint` يعمل لكنه يفشل بسبب مشكلات تنسيق في 72 ملفاً. لا توجد Playwright/Cypress أو E2E حقيقية في الاعتمادات | نجاح Node/Vitest لا يثبت دورة متكاملة بجلسات منفصلة وقاعدة بيانات نشر وترحيل وrollback/backup rehearsal | P0 |

## الحالات والتحولات الفعلية

الحالات الفعلية في `drizzle/schema.ts` هي:

| الكيان | الحالات الفعلية | الملاحظة |
|---|---|---|
| Tender | `draft`, `published`, `closed`, `evaluation`, `awarded`, `cancelled` | لا توجد `under_evaluation` بالاسم المرجعي، بل `evaluation` |
| Bid | `submitted`, `under_review`, `accepted`, `rejected` | لا توجد `draft`, `sealed`, `opened`, `withdrawn` |
| Contract | غير موجود | لا يوجد جدول Contract أو انتقالات توقيع/تنفيذ |

التحولات الخادمية الحالية هي: إنشاء tender في `draft`، ثم نشره، ثم إغلاقه، ثم بدء `evaluation`، ثم اتخاذ قرار `awarded` أو `cancelled`. العرض ينتقل عند الإنشاء مباشرة إلى `submitted`، ويمكن تقييمه إلى `under_review` أو `accepted` أو `rejected`. لا يوجد مسار مستقل للإغلاق التلقائي بالوقت، أو الفتح، أو المحضر، أو العقد، أو التنفيذ والمتابعة.

## P0 — موانع الإطلاق التجريبي

| المانع | سبب اعتباره P0 | الإجراء الأدنى المطلوب |
|---|---|---|
| التعيين الذاتي للأدوار | يمنح حساباً غير معتمد دور authority أو regulator من خلال إجراء خادمي متاح للحساب العام | منع الدورين الحساسين من `auth.setRole` وإسنادهما إدارياً أو عبر workflow اعتماد موثق |
| فتح العروض | لا يوجد إجراء أو وقت فتح قانوني مستقل | إضافة عقد خادمي للفتح، شرط زمني وصلاحية منفصلة وسجل audit immutable |
| محضر الفتح | لا يوجد نموذج قانوني منظم | إضافة نموذج محضر مرتبط بالصفقة، يحفظ الفاعل والوقت وقائمة العروض والمبالغ والنتيجة |
| وثائق العروض | لا يوجد domain model أو authorization على الملفات | إضافة metadata model، ربط بالعرض، signed access authorization، فحص MIME/الحجم، وسجل وصول |
| إثبات التشغيل الكامل | لا توجد E2E بجلسات وأدوار وقاعدة بيانات نشر | تنفيذ سيناريو authority → supplier → close/open → evaluation → award مع migrations وبيئة شبيهة بالإنتاج |
| جودة التحقق | lint يفشل في 72 ملفاً ولا توجد E2E آلية | فصل إصلاح التنسيق عن منطق الأعمال، ثم إضافة browser E2E وCI gate واضح |

## P1 — واجب خلال أول أسبوعين من Pilot

ينبغي إضافة اعتماد أو مراجعة قبل نشر الصفقة إذا كان الفصل المؤسسي يتطلب ذلك، وتقييد تفاصيل `tenders.get` العامة إلى الحقول المسموح بها، وإضافة بحث وpagination خادميين. كما يلزم تعريف معايير تقييم قابلة لإعادة الإنتاج أو إبقاء التقييم خارج نطاق pilot بدلاً من تقديم status/note كبديل لمصفوفة تقييم.

ويجب توحيد قاموس أحداث التدقيق وإضافة `actor_role` و`request_id` وmetadata آمنة وتسجيل الفشل والعمليات الحساسة، مع سياسة retention/export وحماية من التعديل. كما يلزم بناء إشعارات أساسية، وstructured logs، وhealth checks، وerror tracking، وتحسين حجم chunks أو lazy loading.

## P2 — مؤجل بعد إثبات الاستخدام

يمكن تأجيل التحليلات الزمنية المتقدمة، مركز المخاطر، التقارير القابلة للتصدير، البحث المتقدم، الإشعارات الغنية، تحسينات تجربة الاستخدام غير المرتبطة بالسلامة، ومكونات العقد والتنفيذ المتقدمة إلى ما بعد إثبات التدفق الأساسي واعتماد نموذج الحوكمة.

## قائمة الملفات الأكثر خطورة

| الملف | سبب الخطورة |
|---|---|
| `server/routers.ts` | يجمع RBAC والتحولات وقواعد deadline وقرارات الإرساء في عقد واحد؛ أي تعديل غير منضبط قد يغير الأمن أو الحالة القانونية |
| `server/db.ts` | يحتوي الاستعلامات والكتابات وملكية الكيانات؛ لا توجد معاملات مركبة للتحولات الحساسة |
| `drizzle/schema.ts` | يحدد الحالات الفعلية، ولا يحتوي Contract أو Documents أو Opening Minutes |
| `client/src/pages/Portal.tsx` | يعرض RolePicker ويستدعي `auth.setRole` مباشرة لحساب `user` |
| `server/_core/sdk.ts` | ينفذ الجلسة وتهيئة المستخدم تلقائياً من OAuth ويحدّث آخر دخول |
| `server/storage.ts` | يوفر signed storage primitives دون authorization مجالـي أو سجل وصول |
| `client/src/pages/SupplierWorkspace.tsx` | واجهة تقديم العرض وحالات deadline؛ لا ينبغي اعتبار تعطيل الزر حماية مستقلة |
| `package.json` و`vitest.config.ts` | يحددان أن lint هو Prettier فقط وأن الاختبارات Node وليست browser E2E |

## الادعاءات التي لا يمكن إثباتها من الكود

لا يمكن إثبات أن المنصة متوافقة قانونياً مع إجراءات الشراء العمومي الجزائرية، أو أن كل صفقات قاعدة البيانات حقيقية وغير تجريبية، أو أن فتح العروض يتم في الوقت القانوني، أو أن الوثائق محمية، أو أن audit log غير قابل للتلاعب، أو أن notifications تصل فعلياً، أو أن النشر والنسخ الاحتياطي والاسترجاع مجرّبة في بيئة إنتاجية. كذلك لا يمكن إثبات أن النجاح الحالي في الاختبارات يمثل دورة تشغيل كاملة بين ثلاث جلسات مستقلة.

## خطة التنفيذ بأقل تغيير ممكن

1. **أولاً:** إغلاق `auth.setRole` للحسابات العادية بالنسبة إلى `authority` و`regulator`، وإضافة اختبار رفض صريح مع إبقاء supplier onboarding فقط إذا كان معتمداً تشغيلياً.
2. **ثانياً:** تثبيت عقد الإغلاق والفتح والموعد النهائي في الخادم مع اختبارات قبل/بعد الموعد، ومنع الانتقالات غير الصالحة داخل قاعدة البيانات أو transaction مناسبة.
3. **ثالثاً:** إضافة Opening Minutes وDocuments كحد أدنى قبل pilot، مع authorization لكل قراءة وكتابة وسجل تدقيق منظم.
4. **رابعاً:** إضافة E2E لدورة الصفقة الكاملة ببيانات اختبار معلنة ومفصولة عن بيانات الإنتاج.
5. **خامساً:** إصلاح lint على دفعات، ثم إضافة CI gate يجمع check/test/build/lint/E2E، ومعالجة تحذير chunks الكبيرة.

## نتائج التحقق الحالية

| الأمر | النتيجة |
|---|---|
| `pnpm check` | ناجح، exit 0 |
| `pnpm test` | ناجح، 10 ملفات و36 اختباراً |
| `pnpm build` | ناجح، مع تحذير chunks أكبر من 500KB |
| `pnpm lint` | فاشل، Prettier أبلغ عن 72 ملفاً |
| Permission tests | موجودة وناجحة ضمن Vitest، لكنها لا تغطي self-role assignment |
| RTL/mobile | تم التحقق البصري سابقاً لمسارات عامة و`/app`؛ لا يمثل ذلك E2E وظيفياً |
| Django/Next/PostgreSQL audit | غير منطبق على البنية الحالية؛ لم توجد هذه الطبقات في المستودع |

## الخلاصة

المشروع يملك أساساً حقيقياً صالحاً للتجربة الداخلية، وتوجد فيه حماية خادمية مهمة للملكية والأدوار الأساسية وdeadline تقديم العرض. غير أن **NOT_READY** هو التصنيف الصحيح للإطلاق التجريبي التشغيلي بسبب التعيين الذاتي للأدوار، غياب الفتح ومحضر الفتح، غياب حماية وثائق المجال، وعدم وجود E2E إنتاجية. لا ينبغي توسيع الواجهة أو إضافة تقارير وإشعارات قبل إغلاق هذه الموانع.

## مراجع الأدلة المحلية

[1]: `server/routers.ts` — عقود tRPC والصلاحيات والتحولات.
[2]: `server/db.ts` — استعلامات وكتابات Drizzle، بما فيها deadline والملكية.
[3]: `drizzle/schema.ts` — الكيانات والحالات الفعلية.
[4]: `server/storage.ts` — primitives التخزين الموقعة.
[5]: `server/_core/sdk.ts` و`server/_core/oauth.ts` — الجلسات وOAuth وتهيئة المستخدم.
[6]: `client/src/pages/Portal.tsx` و`client/src/pages/LoginRedirect.tsx` — `/app` واختيار سياق البوابة وتدفق الدخول.
[7]: `server/permissions.test.ts` و`server/workflow.success.test.ts` و`server/tender-create-flow.test.ts` — اختبارات الصلاحيات والتدفق والdeadline.
[8]: `package.json` و`vitest.config.ts` — أوامر التحقق ونطاق الاختبارات والاعتمادات.
