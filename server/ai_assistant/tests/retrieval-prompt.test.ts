import { describe, expect, it } from "vitest";
import { buildRolePrompt } from "../prompts";
import { buildRetrievalMetadataFilter, matchesRetrievalScope } from "../rag/metadataFilters";
import { requireCitationsForReferenceAnswer } from "../services/citationService";

describe("modular retrieval and prompt boundaries", () => {
  it("keeps prompts role-specific and advisory", () => {
    const prompt = buildRolePrompt("authority");
    expect(prompt).toContain("استشاري");
    expect(prompt).toContain("دون اعتماد أو نشر تلقائي");
  });

  it("filters retrieval by actor and entity scope", () => {
    const scope = { actorId: 7, actorRole: "authority" as const, entityType: "tender", entityId: 41 };
    expect(buildRetrievalMetadataFilter(scope)).toEqual(scope);
    expect(matchesRetrievalScope(scope, { actorId: 7, actorRole: "authority", entityType: "tender", entityId: 41 })).toBe(true);
    expect(matchesRetrievalScope(scope, { actorId: 8, actorRole: "authority", entityType: "tender", entityId: 41 })).toBe(false);
  });

  it("requires citations when an answer makes a reference claim", () => {
    expect(() => requireCitationsForReferenceAnswer({ answer: "وفق مصدر السوق", citations: [] })).toThrow();
    expect(requireCitationsForReferenceAnswer({ answer: "ملاحظة عامة", citations: [] })).toEqual([]);
  });
});
