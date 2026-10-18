# Smart-Deals-Platform — Project Structure

## ملاحظة عن المسار

تمثل هذه الوثيقة البنية الموحّدة لمشروع **Smart-Deals-Platform**. المساحة المُدارة الحالية هي `/home/ubuntu/safaqat-dhakiya` ولا يمكن نقلها مباشرة إلى `C:\Users\DELL\Desktop\New plat\Smart-Deals-Platform` داخل بيئة Linux. يمكن تنزيل نسخة المشروع من واجهة الإدارة ووضعها داخل ذلك المجلد على جهاز Windows عند الحاجة.

## البنية النهائية الفعلية

```text
Smart-Deals-Platform/
├── client/                 # React 19 + Vite: الواجهة والمكونات
├── server/                 # Express + tRPC: API، الصلاحيات والخدمات
├── shared/                 # أنواع وثوابت مشتركة
├── drizzle/                # مخطط Drizzle وسجل migrations القائم
├── storage/                # تكامل التخزين الموقّع
├── docs/
│   ├── architecture/       # قرارات المعمارية والتصاميم والبحث
│   ├── operations/         # التشغيل، التقارير والتوطين
│   ├── security/           # مراجعات الأمن والوصول والتشفير
│   ├── legal/              # مساحة للمستندات القانونية المعتمدة مستقبلاً
│   └── README.md           # فهرس الوثائق
├── infrastructure/
│   ├── docker/             # مرجع فقط؛ لا توجد ملفات Docker حالياً
│   ├── nginx/              # مرجع فقط؛ لا توجد إعدادات Nginx حالياً
│   ├── postgres/           # غير منطبق: المشروع يستخدم MySQL/TiDB
│   └── monitoring/         # مرجع لتوثيق المراقبة
├── .github/
│   └── workflows/          # محجوز لـ CI مستقبلي؛ لا توجد workflow حالياً
├── patches/                # patch محكوم لاعتماد Wouter
├── package.json            # أوامر Node/pnpm الوحيدة المعتمدة
├── pnpm-lock.yaml          # قفل الاعتمادات
├── tsconfig.json           # TypeScript
├── vite.config.ts          # Vite
├── vitest.config.ts        # Vitest
├── README.md               # مدخل المشروع
└── PROJECT_STRUCTURE.md    # هذه الوثيقة
```

لا توجد مجلدات `backend/` أو `frontend/` منفصلة لأنها لا تعكس تقنية المشروع الحالية، ولا توجد `manage.py` أو `requirements.txt` أو `pytest.ini`. كما لا يوجد `docker-compose.yml` أو ملفات Docker أو Swagger/ReDoc في النسخة الحالية.

## الأوامر المعتمدة

| الغرض             | الأمر        |
| ----------------- | ------------ |
| التطوير المحلي    | `pnpm dev`   |
| فحص الأنواع       | `pnpm check` |
| فحص التنسيق       | `pnpm lint`  |
| الاختبارات        | `pnpm test`  |
| البناء            | `pnpm build` |
| تشغيل ناتج البناء | `pnpm start` |

## متغيرات البيئة دون قيم

تُدار المتغيرات داخل خدمة الأسرار ولا تُحفظ في المستودع. يتطلب التشغيل المعتاد اتصال قاعدة البيانات وسياق OAuth وJWT وتكامل التخزين، ومنها: `DATABASE_URL` و`JWT_SECRET` و`VITE_APP_ID` و`OAUTH_SERVER_URL` و`VITE_OAUTH_PORTAL_URL` ومفاتيح Forge المهيأة من المنصة. لا تنشئ أو تنسخ ملفات `.env` حقيقية، ولا تضف مفاتيح أو كلمات مرور إلى الوثائق.

## الواجهات والـ API

الخادم والواجهة يعملان على المنفذ 3000 في التطوير. واجهة الإجراءات الأساسية هي `/api/trpc`، ويظهر مسار الحالة المرئي في `/status`. لا توجد Swagger أو ReDoc أو OpenAPI schema لأن المنصة ليست REST API.

## المعاينة المحلية الآمنة

شغّل `pnpm dev` ثم افتح `http://127.0.0.1:3000`. لا تشغّل `pnpm db:push` أو أي migration أثناء المعاينة. استعمل بيانات اختبار معتمدة فقط، ولا تدخل أسرار الإنتاج.
