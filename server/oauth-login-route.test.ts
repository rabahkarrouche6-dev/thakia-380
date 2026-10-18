import { describe, expect, it } from "vitest";
import { decodeOAuthState } from "../shared/const";
import { buildOAuthLoginDestination } from "../client/src/const";

describe("OAuth login redirect route", () => {
  it("builds the institutional sign-in route from the active frontend origin", () => {
    const { destination, redirectUri, state } = buildOAuthLoginDestination({
      oauthPortalUrl: "https://auth.example.test",
      appId: "smart-procurement",
      origin: "https://dhakiyaapp.example.test",
      nonce: "nonce-for-test",
    });
    const url = new URL(destination);

    expect(url.origin).toBe("https://auth.example.test");
    expect(url.pathname).toBe("/app-auth");
    expect(url.searchParams.get("appId")).toBe("smart-procurement");
    expect(url.searchParams.get("redirectUri")).toBe("https://dhakiyaapp.example.test/api/oauth/callback");
    expect(url.searchParams.get("type")).toBe("signIn");
    expect(redirectUri).toBe("https://dhakiyaapp.example.test/api/oauth/callback");
    expect(decodeOAuthState(state)).toEqual({ redirectUri, nonce: "nonce-for-test" });
  });

  it("does not hardcode a deployment domain into the OAuth redirect", () => {
    const { redirectUri } = buildOAuthLoginDestination({
      oauthPortalUrl: "https://auth.example.test",
      appId: "smart-procurement",
      origin: "https://preview.example.test",
      nonce: "different-nonce",
    });

    expect(redirectUri).toBe("https://preview.example.test/api/oauth/callback");
  });
});
