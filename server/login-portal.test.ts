import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getPortalKey } from "../shared/login";

const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const redirectSource = readFileSync(new URL("../client/src/pages/LoginRedirect.tsx", import.meta.url), "utf8");

describe("portal login route selection", () => {
  it("recognizes the three supported portal routes", () => {
    expect(getPortalKey("/login/supplier")).toBe("supplier");
    expect(getPortalKey("/login/authority")).toBe("authority");
    expect(getPortalKey("/login/regulator")).toBe("regulator");
  });

  it("does not grant a portal context to unsupported routes", () => {
    expect(getPortalKey("/login/unknown")).toBeNull();
    expect(getPortalKey("/login")).toBeNull();
    expect(getPortalKey("/app")).toBeNull();
  });

  it("keeps legacy login links functional through the direct institutional redirect", () => {
    expect(appSource).toContain('<Route path="/login" component={LoginRedirect} />');
    expect(appSource).toContain('<Route path="/login/:portal" component={LoginRedirect} />');
    expect(appSource).not.toContain('component={Login}');
    expect(redirectSource).toContain("storePortalSelection(portal)");
    expect(redirectSource).toContain("window.location.replace(`/preview/");
  });
});
