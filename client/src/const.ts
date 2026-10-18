import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const buildOAuthLoginDestination = ({ oauthPortalUrl, appId, origin, nonce }: { oauthPortalUrl: string; appId: string; origin: string; nonce: string }) => {
  const redirectUri = `${origin}/api/oauth/callback`;
  const state = encodeOAuthState({ redirectUri, nonce });
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  return { destination: url.toString(), redirectUri, state };
};

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns the destination solely so the caller
// can expose a recovery link when a browser prevents automatic navigation.
// `deferNavigation` preserves the same one-time nonce and destination while
// allowing the UI to paint a keyboard-accessible recovery link first.
export const startLogin = ({ deferNavigation = false }: { deferNavigation?: boolean } = {}): string => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  if (!oauthPortalUrl || !appId) {
    throw new Error("تعذر بدء التسجيل لأن إعدادات الدخول المؤسسي غير مكتملة.");
  }

  const nonce = crypto.randomUUID();
  const secureAttribute = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=Lax${secureAttribute}`;
  const { destination } = buildOAuthLoginDestination({ oauthPortalUrl, appId, origin: window.location.origin, nonce });
  if (!deferNavigation) window.location.assign(destination);
  return destination;
};
