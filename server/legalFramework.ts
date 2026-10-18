import PDFDocument from "pdfkit";
import { invokeLLM } from "./_core/llm";

export const legalReferences = [
  {
    id: "procurement",
    category: "الصفقات العمومية",
    law: "القانون 23-12",
    description: "القواعد العامة للصفقات ومبادئ حرية الوصول والمساواة والشفافية.",
    summary: "مرجع أساسي لفهم المبادئ العامة وإجراءات الصفقات العمومية.",
    href: "https://www.mf.gov.dz/images/pdf/reglementation/A2023051marchAR.pdf",
  },
  {
    id: "data",
    category: "حماية المعطيات",
    law: "القانون 18-07",
    description: "حماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي.",
    summary: "يوضح الضوابط العامة لمعالجة البيانات وحقوق الأشخاص المعنيين.",
    href: "https://www.arpce.dz/ar/pub/c7e6n6",
  },
  {
    id: "commerce",
    category: "المعاملات الرقمية",
    law: "القانون 18-05",
    description: "الإطار المنظم للتجارة الإلكترونية والمعاملات ذات الصلة.",
    summary: "يضع سياقاً قانونياً للمعاملات والتبادل التجاري عبر الوسائط الرقمية.",
    href: "https://www.arpce.dz/ar/pub/z2g9u7",
  },
  {
    id: "signature",
    category: "التوقيع الإلكتروني",
    law: "القانون 15-04",
    description: "القواعد العامة المتعلقة بالتوقيع والتصديق الإلكترونيين.",
    summary: "يساعد على فهم متطلبات الثقة والتصديق في الوثائق الإلكترونية.",
    href: "https://www.commerce.gov.dz/reglementation/loi-n-deg-15-04",
  },
] as const;

export type LegalReferenceId = (typeof legalReferences)[number]["id"];

const allowedIds = new Set<string>(legalReferences.map(item => item.id));
const safeText = (value: string, max: number) => value.trim().slice(0, max);

export function selectLegalReferences(ids: string[]) {
  return legalReferences.filter(item => ids.includes(item.id));
}

export function validateLegalReferenceIds(ids: string[]) {
  return ids.length > 0 && ids.length <= legalReferences.length && ids.every(id => allowedIds.has(id));
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .filter((item): item is { type: "text"; text: string } => typeof item === "object" && item !== null && (item as { type?: unknown }).type === "text" && typeof (item as { text?: unknown }).text === "string")
    .map(item => item.text)
    .join("\n")
    .trim();
}

export async function answerLegalQuestion(question: string, referenceIds: string[]) {
  const references = selectLegalReferences(referenceIds);
  const context = references.map(item => `${item.law} — ${item.category}\n${item.description}\nالمصدر الرسمي: ${item.href}`).join("\n\n");
  const limitations = [
    "الإجابة إرشادية وليست استشارة أو اعتماداً قانونياً.",
    "اعتمد المساعد على المراجع المحددة في السؤال فقط.",
    "يجب الرجوع إلى النص الرسمي الساري والتحقق من آخر التعديلات قبل اتخاذ أي إجراء.",
  ];

  try {
    const response = await invokeLLM({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: "أنت مساعد قانوني استشاري لقسم الإطار القانوني في منصة صفقات ذكية الجزائرية. أجب بالعربية الواضحة وباختصار. لا تستخدم أي معرفة خارج المراجع التي يرسلها النظام، ولا تخترع مادة أو مرسوماً أو رقماً. إذا لم تكفِ المراجع، صرّح بعدم كفاية المعلومات ووجّه المستخدم إلى المصدر الرسمي. لا تقدم قراراً ملزماً ولا تنفذ أي إجراء.",
        },
        { role: "user", content: `المراجع المتاحة:\n${context}\n\nسؤال المستخدم:\n${safeText(question, 1200)}` },
      ],
      maxTokens: 650,
    });
    const content = extractText(response.choices?.[0]?.message?.content);
    if (content) return { content, advisoryOnly: true as const, limitations, modelUsed: true };
  } catch {
    // Return a safe deterministic answer when the optional provider is unavailable.
  }

  return {
    content: "تعذر تشغيل المساعد حالياً. يمكنك فتح المصدر الرسمي لكل مرجع أو تنزيل الملخص والتحقق من النص الساري قبل اتخاذ أي إجراء.",
    advisoryOnly: true as const,
    limitations: [...limitations, "خدمة النموذج غير متاحة حالياً."],
    modelUsed: false,
  };
}

export async function createLegalSummaryPdf(referenceIds: string[]) {
  const references = selectLegalReferences(referenceIds);
  const chunks: Buffer[] = [];
  const document = new PDFDocument({ size: "A4", margin: 48, info: { Title: "ملخص الإطار القانوني — صفقات ذكية", Author: "منصة صفقات ذكية" } });
  document.on("data", (chunk: string | Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
  const done = new Promise<Buffer>((resolve, reject) => {
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });
  document.font("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
  document.fillColor("#092e49").fontSize(20).text("ملخص الإطار القانوني", { align: "right" });
  document.moveDown(0.4).fillColor("#475569").fontSize(10).text("منصة صفقات ذكية · ملخص إرشادي · آخر تحديث: 21 أوت 2026", { align: "right" });
  document.moveDown().fillColor("#334155").fontSize(11).text("هذا الملخص للتعريف والتنظيم فقط، ولا يمثل استشارة قانونية أو بديلاً عن النصوص الرسمية السارية.", { align: "right" });
  references.forEach(reference => {
    document.moveDown(1).fillColor("#0d8062").fontSize(15).text(reference.law, { align: "right" });
    document.fillColor("#1e293b").fontSize(10).text(`المجال: ${reference.category}`, { align: "right" });
    document.moveDown(0.25).text(reference.description, { align: "right" });
    document.moveDown(0.25).fillColor("#64748b").text(`ملخص: ${reference.summary}`, { align: "right" });
    document.moveDown(0.25).fillColor("#2563eb").fontSize(9).text(`المصدر الرسمي: ${reference.href}`, { align: "right", link: reference.href, underline: true });
  });
  document.end();
  return done;
}
