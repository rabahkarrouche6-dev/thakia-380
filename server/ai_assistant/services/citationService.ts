export type AdvisoryCitation = {
  sourceId: string;
  title: string;
  issuedAt?: string;
  locator?: string;
};

export function formatCitations(citations: AdvisoryCitation[]) {
  return citations.slice(0, 20).map((citation, index) => {
    const date = citation.issuedAt ? ` · ${citation.issuedAt}` : "";
    const locator = citation.locator ? ` · ${citation.locator}` : "";
    return `[${index + 1}] ${citation.title}${date}${locator} · المصدر: ${citation.sourceId}`;
  });
}

export function requireCitationsForReferenceAnswer(input: { answer: string; citations: AdvisoryCitation[] }) {
  const mentionsReference = /مرجع|مصدر|السوق|قانون|reference|source|market|law/i.test(input.answer);
  if (mentionsReference && input.citations.length === 0) {
    throw new Error("لا يمكن تقديم إجابة مرجعية دون مصدر قابل للتحقق");
  }
  return formatCitations(input.citations);
}
