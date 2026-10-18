import type { User } from "../../../drizzle/schema";

export function canUseAdvisoryAssistant(role: User["role"]) {
  return ["supplier", "authority", "admin", "regulator"].includes(role);
}

export function canReadEntity(input: { actor: Pick<User, "id" | "role">; ownerId?: number; entityAuthorityId?: number }) {
  if (input.actor.role === "admin" || input.actor.role === "regulator") return true;
  if (input.ownerId != null) return input.ownerId === input.actor.id;
  if (input.entityAuthorityId != null) return input.entityAuthorityId === input.actor.id;
  return false;
}
