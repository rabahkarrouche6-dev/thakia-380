# تحقق مسار OAuth — 18 أغسطس 2026

تم التحقق من قبول بوابة المصادقة لعنوان عودة معاينة المشروع عبر الرابط العام التالي، دون بدء جلسة أو إدخال بيانات اعتماد:

`https://manus.im/app-auth?appId=GcyMKQ3scaepwXPGQjdvQg&redirectUri=https%3A%2F%2F3000-iirpjexb62ewcqub7jno6-2b19538a.us4.manus.computer%2Fapi%2Foauth%2Fcallback&type=signIn`

أعادت البوابة واجهة تسجيل الدخول والتنبيه التشغيلي، ما يؤكد قبول `redirectUri` و`appId` في بيئة المعاينة. لم يُستكمل تسجيل دخول حي، لأن إدخال بيانات الاعتماد أو مفاتيح المرور يبقى بيد المستخدم فقط.

## تحقق النسخة المنشورة

تمت إعادة التحقق في 18 أغسطس 2026 من عنوان العودة المنشور عبر المصدر العام التالي:

`https://manus.im/app-auth?appId=GcyMKQ3scaepwXPGQjdvQg&redirectUri=https%3A%2F%2Fdhakiyaapp-gcymkq3s.manus.space%2Fapi%2Foauth%2Fcallback&type=signIn`

أعادت بوابة الهوية صفحة **Sign in to صفقات ذكية — منصة إدارة الصفقات العمومية**، ما يثبت أن `appId` و`redirectUri` المنشورين مقبولان من وجهة OAuth. ظهرت أيضاً ملاحظة تشغيلية عامة من مزود الهوية عن فترة صيانة واستعادة محتملة؛ يجب الرجوع إلى إشعار المستخدم داخل الحساب وبريده الإلكتروني لتحديد ما إذا كان يتأثر بها.
