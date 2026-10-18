import { describe, expect, it } from "vitest";
import { assistantProfiles, assistantThreads, assistantMessages, knowledgeSources, knowledgeChunks, assistantPolicies, assistantAuditLogs, assistantFeedback } from "../../../drizzle/schema";

describe("assistant data model contract", () => {
  it("exposes all proposed normalized entities", () => {
    expect([assistantProfiles, assistantThreads, assistantMessages, knowledgeSources, knowledgeChunks, assistantPolicies, assistantAuditLogs, assistantFeedback]).toHaveLength(8);
  });

  it("keeps thread scope and message trace fields available", () => {
    expect(Object.keys(assistantThreads)).toEqual(expect.arrayContaining(["tenantId", "organizationId", "roleCode", "contextType", "contextObjectId", "status"]));
    expect(Object.keys(assistantMessages)).toEqual(expect.arrayContaining(["threadId", "senderType", "citationsJson", "blockedReason"]));
  });

  it("keeps knowledge and audit isolation fields available", () => {
    expect(Object.keys(knowledgeSources)).toEqual(expect.arrayContaining(["tenantId", "organizationId", "confidentialityLevel"]));
    expect(Object.keys(knowledgeChunks)).toEqual(expect.arrayContaining(["tenantId", "organizationId", "roleWhitelistJson", "entityWhitelistJson"]));
    expect(Object.keys(assistantAuditLogs)).toEqual(expect.arrayContaining(["actionType", "riskLevel", "decisionJson"]));
  });
});
