import type { User } from "../../../drizzle/schema";

const SENSITIVE_KEYS = /(^|_)(token|password|secret|key|credential|authorization)(_|$)/i;

export type AdvisoryContext = {
  actorId: number;
  actorRole: User["role"];
  entityType: "tender" | "smart_tender_document" | "supplier_profile";
  entityId?: number;
  fields: Record<string, string>;
};

export function buildAdvisoryContext(input: {
  user: Pick<User, "id" | "role">;
  entityType: AdvisoryContext["entityType"];
  entityId?: number;
  fields: Record<string, unknown>;
}): AdvisoryContext {
  const fields = Object.fromEntries(Object.entries(input.fields).slice(0, 80).flatMap(([key, value]) => {
    const safeKey = key.trim().slice(0, 120);
    if (!safeKey || SENSITIVE_KEYS.test(safeKey)) return [];
    const safeValue = typeof value === "string" ? value.trim().slice(0, 4_000) : JSON.stringify(value ?? "").slice(0, 4_000);
    return safeValue ? [[safeKey, safeValue]] : [];
  }));
  return { actorId: input.user.id, actorRole: input.user.role, entityType: input.entityType, entityId: input.entityId, fields };
}
