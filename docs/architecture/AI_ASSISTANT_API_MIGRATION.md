# تكييف مسار AI Assistant

## القرار المعماري

الملف المرفق `apps/ai_assistant/urls.py` ينتمي إلى بنية Django، بينما مشروع **صفقات ذكية** يعمل بخادم Express وtRPC. لذلك لا يُضاف مسار Django مستقل ولا endpoint REST موازٍ؛ لأن ذلك قد يتجاوز حواجز المصادقة والامتيازات والحصة الذرية الموجودة في `assistant.ask`.

## العقد الفعلي

يُستدعى المساعد عبر tRPC باسم `assistant.ask`، مع مدخلات `task_description` و`answers`. الإجراء المحمي يتحقق من هوية المستخدم، وامتياز `ai_rfp_generation`، والحصة قبل استدعاء طبقة LLM، ثم يعيد نتيجة استشارية دون تسجيل نص المهمة أو الإجابات الحساسة.

من واجهة React يُستخدم عميل tRPC الموجود في `client/src/lib/trpc.ts`، وليس `fetch('/api/generate-prompt/')`. ولأي مستهلك خارجي، يجب بناء adapter موثق فوق tRPC أو إضافة endpoint رسمي لاحقاً عبر نفس service layer؛ لا يجوز إعادة تنفيذ المنطق داخل view مستقل.

## مطابقة المسار

| Django المرفق | البديل في صفقات ذكية |
|---|---|
| `api/generate-prompt/` | `assistant.ask` عبر `/api/trpc` |
| `task_description` | `task_description` |
| `answers` | `answers` |
| `api_generate_smart_prompt` | إجراء tRPC المحمي |
| `logger.exception` | معالجة خطأ خادمية وتدقيق غير حساس |
| رد نصي محاكٍ | نتيجة LLM استشارية من `server/aiAssistant.ts` |

## حدود الامتثال

المساعد لا يصدر قرار إسناد أو أهلية قانونية ولا يغير حالة صفقة أو عرض. كما أن بيانات الاعتماد الخارجية لا تُضاف إلى المشروع ضمن هذا التكييف؛ طبقة LLM المدمجة هي نقطة التكامل الوحيدة.
