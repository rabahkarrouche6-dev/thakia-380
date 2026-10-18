import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { logProductEvent, logServerError } from "./observability";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      const existingUser = await db.getUserByOpenId(userInfo.openId);
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });
      const authenticatedUser = await db.getUserByOpenId(userInfo.openId);

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // After authentication, open the protected workspace directly so users do not land back on the marketing page.
      logProductEvent({ name: "login_succeeded", actorRole: authenticatedUser?.role ?? "user", outcome: "success", entityType: "user", entityId: authenticatedUser?.id, requestId: res.locals.requestId });
      if (!existingUser) {
        logProductEvent({ name: "registration_completed", actorRole: authenticatedUser?.role ?? "user", outcome: "success", entityType: "user", entityId: authenticatedUser?.id, requestId: res.locals.requestId });
      }
    res.redirect(302, "/app");
  } catch (error) {
    logProductEvent({ name: "login_failed", actorRole: "anonymous", outcome: "failure", failureCategory: "oauth_callback_failed", requestId: res.locals.requestId });
    logServerError({ error, requestId: res.locals.requestId, route: req.path, category: "oauth_callback_failed" });
    res.status(500).json({ error: "OAuth callback failed" });

    }
  });
}
