export type PortalKey = "supplier" | "authority" | "regulator";

const supportedPortals = new Set<PortalKey>(["supplier", "authority", "regulator"]);
export const LOGIN_PORTAL_STORAGE_KEY = "safaqat-login-portal";
export const LOGIN_PORTAL_FALLBACK_STORAGE_KEY = "safaqat-login-portal-fallback";

export const AUTH_ROUTES = {
  registration: "/login",
} as const;

export function getPortalKey(pathname: string): PortalKey | null {
  const pathWithoutQueryOrHash = pathname.split(/[?#]/)[0] || "";
  const key = pathWithoutQueryOrHash.split("/").filter(Boolean).at(-1);
  return key && supportedPortals.has(key as PortalKey) ? (key as PortalKey) : null;
}

export function storePortalSelection(portal: PortalKey) {
  try { sessionStorage.setItem(LOGIN_PORTAL_STORAGE_KEY, portal); } catch { /* Session storage is optional. */ }
  try { localStorage.setItem(LOGIN_PORTAL_FALLBACK_STORAGE_KEY, portal); } catch { /* Local storage is optional. */ }
}

export function consumePortalSelection(): PortalKey | null {
  let selected: string | null = null;
  try { selected = sessionStorage.getItem(LOGIN_PORTAL_STORAGE_KEY); } catch { /* Session storage is optional. */ }
  if (!selected) {
    try { selected = localStorage.getItem(LOGIN_PORTAL_FALLBACK_STORAGE_KEY); } catch { /* Local storage is optional. */ }
  }
  try { sessionStorage.removeItem(LOGIN_PORTAL_STORAGE_KEY); } catch { /* Session storage is optional. */ }
  try { localStorage.removeItem(LOGIN_PORTAL_FALLBACK_STORAGE_KEY); } catch { /* Local storage is optional. */ }
  return selected && supportedPortals.has(selected as PortalKey) ? (selected as PortalKey) : null;
}

export async function beginPortalRegistration(
  portalKey: PortalKey | null,
  actions: { storePortal: (portal: PortalKey) => void; startAuthentication: () => void | Promise<void> },
): Promise<PortalKey> {
  const selectedPortal = portalKey ?? "supplier";
  actions.storePortal(selectedPortal);
  await actions.startAuthentication();
  return selectedPortal;
}
