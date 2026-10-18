import type { User } from "../../../drizzle/schema";
import { enforceAdvisoryPolicy } from "./policyService";
import { buildAdvisoryContext } from "./contextService";
import { classifyAdvisoryIntent, type AdvisoryIntent } from "./intentService";
import { assertAdvisoryAction } from "./actionGuardService";

export type AdvisoryRequest = {
  user: Pick<User, "id" | "role">;
  task: string;
  fields: Record<string, unknown>;
  entityType: "tender" | "smart_tender_document" | "supplier_profile";
  entityId?: number;
  action?: "suggest" | "draft" | "review";
};

export type PreparedAdvisoryRequest = {
  intent: AdvisoryIntent;
  context: ReturnType<typeof buildAdvisoryContext>;
  policy: ReturnType<typeof enforceAdvisoryPolicy>;
  action: { allowed: true; requiresHumanReview: true };
};

export function prepareAdvisoryRequest(request: AdvisoryRequest): PreparedAdvisoryRequest {
  const policy = enforceAdvisoryPolicy({ user: request.user, task: request.task, fields: request.fields });
  const context = buildAdvisoryContext({ user: request.user, entityType: request.entityType, entityId: request.entityId, fields: request.fields });
  const action = assertAdvisoryAction(request.action ?? "suggest");
  return { intent: classifyAdvisoryIntent(request.task), context, policy, action };
}
