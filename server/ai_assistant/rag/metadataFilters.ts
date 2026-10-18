import type { User } from "../../../drizzle/schema";

export type RetrievalScope = {
  actorId: number;
  actorRole: User["role"];
  entityType?: string;
  entityId?: number;
};

export function buildRetrievalMetadataFilter(scope: RetrievalScope) {
  return {
    actorId: scope.actorId,
    actorRole: scope.actorRole,
    ...(scope.entityType ? { entityType: scope.entityType } : {}),
    ...(scope.entityId != null ? { entityId: scope.entityId } : {}),
  };
}

export function matchesRetrievalScope(scope: RetrievalScope, metadata: Record<string, unknown>) {
  if (metadata.actorRole !== scope.actorRole && scope.actorRole !== "admin" && scope.actorRole !== "regulator") return false;
  if (scope.entityType && metadata.entityType !== scope.entityType) return false;
  if (scope.entityId != null && metadata.entityId !== scope.entityId) return false;
  if (scope.actorRole !== "admin" && scope.actorRole !== "regulator" && metadata.actorId !== scope.actorId) return false;
  return true;
}
