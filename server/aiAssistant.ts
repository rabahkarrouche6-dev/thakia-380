import { invokeLLM } from "./_core/llm";

const MAX_TASK_LENGTH = 2_000;
const MAX_ANSWER_KEY_LENGTH = 80;
const MAX_ANSWER_VALUE_LENGTH = 1_000;
const MAX_ANSWERS = 30;

export type SmartAssistantAnswers = Record<string, unknown>;

export type SmartAssistantResult = {
  content: string;
  advisoryOnly: true;
  modelUsed: boolean;
  limitations: string[];
};

const LIMITATIONS = [
  "النتيجة إرشادية ولا تمثل قراراً تعاقدياً أو اعتماداً قانونياً.",
  "يجب التحقق من النصوص والوثائق الرسمية ومنح القرار للمستخدم المخول.",
  "لا تُستخدم النتيجة لتغيير صفقة أو عرض أو ترتيب متعاملين تلقائياً.",
];

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function normalizeAssistantInput(taskDescription: string, answers: SmartAssistantAnswers) {
  const task = cleanText(taskDescription, MAX_TASK_LENGTH);
  if (task.length < 2) throw new Error("وصف المهمة غير صالح.");
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) throw new Error("الإجابات يجب أن تكون في صيغة كائن JSON.");

  const entries = Object.entries(answers).slice(0, MAX_ANSWERS).flatMap(([key, value]) => {
    const safeKey = cleanText(key, MAX_ANSWER_KEY_LENGTH);
    const safeValue = cleanText(typeof value === "string" ? value : JSON.stringify(value), MAX_ANSWER_VALUE_LENGTH);
    return safeKey && safeValue ? [[safeKey, safeValue] as const] : [];
  });

  return { task, answers: Object.fromEntries(entries) };
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content.filter((item): item is { type: "text"; text: string } => typeof item === "object" && item !== null && (item as { type?: unknown }).type === "text" && typeof (item as { text?: unknown }).text === "string").map(item => item.text).join("\n").trim();
}

export async function generateSmartPromptResult(taskDescription: string, answers: SmartAssistantAnswers): Promise<SmartAssistantResult> {
  const normalized = normalizeAssistantInput(taskDescription, answers);
  const formattedAnswers = Object.entries(normalized.answers).map(([key, value]) => `- ${key}: ${value}`).join("\n") || "- لا توجد معطيات إضافية";

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "أنت مساعد استشاري لمنصة صفقات ذكية في الجزائر. أجب بالعربية المؤسساتية الواضحة. حلل المعطيات المقدمة فقط. لا تدّع اعتماداً قانونياً، ولا تتخذ قراراً تعاقدياً، ولا تعدّل أو تنشر أي كيان، ولا تعد بالفوز أو الأهلية. اذكر حدود الإجابة واقترح التحقق من الوثائق الرسمية عند الحاجة." },
        { role: "user", content: `المهمة:\n${normalized.task}\n\nالمعطيات:\n${formattedAnswers}` },
      ],
      max_tokens: 900,
    });
    const content = extractText(response.choices?.[0]?.message?.content);
    if (content) return { content, advisoryOnly: true, modelUsed: true, limitations: LIMITATIONS };
  } catch {
    // Keep the service usable when the optional LLM provider is unavailable.
  }

  return {
    content: `تمت معالجة الطلب إرشادياً.\n\nالمهمة:\n${normalized.task}\n\nينبغي التحقق من نوع الإجراء، الوثائق المطلوبة، الشروط الشكلية والآجال من المصادر الرسمية قبل أي قرار.`,
    advisoryOnly: true,
    modelUsed: false,
    limitations: [...LIMITATIONS, "خدمة النموذج غير متاحة حالياً؛ عُرضت إرشادات أساسية فقط."],
  };
}

export { LIMITATIONS as SMART_ASSISTANT_LIMITATIONS };
