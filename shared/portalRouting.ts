export type PortalId = "supplier" | "authority" | "regulator";

export const resolvePortalForRole = (role: string): PortalId | null => {
  if (role === "supplier") return "supplier";
  if (role === "authority") return "authority";
  if (role === "regulator" || role === "admin") return "regulator";
  return null;
};
