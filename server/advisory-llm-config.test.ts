import { describe, expect, it, vi } from "vitest";
import { buildAuthorityRfpAudit } from "./authorityAi";

describe("advisory LLM activation", () => {
  it("uses the enabled flag for an advisory-only mocked completion", async () => {
    expect(process.env.ENABLE_ADVISORY_LLM).toBe("true");

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          id: "test-completion",
          created: Date.now(),
          model: "test-advisory-model",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify({ findings: [] }),
              },
              finish_reason: "stop",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    ) as typeof fetch;

    try {
      const audit = await buildAuthorityRfpAudit({
        id: 1,
        reference: "TEST-ADVISORY-001",
        title: "توريد تجهيزات مكتبية للمصلحة",
        description: "وصف تجريبي طويل بما يكفي لاختبار المسار الاستشاري دون بيانات تشغيلية حقيقية.",
        category: "supplies",
        location: "الجزائر",
        budget: 1000,
        deadline: new Date(Date.now() + 86_400_000),
      } as never);

      expect(audit.disclaimer).toContain("استشارية");
      expect(audit.llmUsed).toBe(false);
      expect(audit.limitations).toBeDefined();
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
