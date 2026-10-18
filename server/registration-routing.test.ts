import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beginPortalRegistration, getPortalKey } from "../shared/login";

describe("registration routing", () => {
  it("retains the requested portal when language or fragment parameters are present", () => {
    expect(getPortalKey("/register/authority?lang=en")).toBe("authority");
    expect(getPortalKey("/login/supplier?lang=ar#register")).toBe("supplier");
    expect(getPortalKey("/portal/regulator#overview")).toBe("regulator");
  });

  it("stores the selected portal before it starts authentication", async () => {
    const events: string[] = [];
    const selected = await beginPortalRegistration("authority", {
      storePortal: (portal) => events.push(`store:${portal}`),
      startAuthentication: () => events.push("start"),
    });

    expect(selected).toBe("authority");
    expect(events).toEqual(["store:authority", "start"]);
  });

  it("preserves the chosen portal when authentication startup fails", async () => {
    const stored: string[] = [];
    await expect(beginPortalRegistration("regulator", {
      storePortal: (portal) => stored.push(portal),
      startAuthentication: () => { throw new Error("provider unavailable"); },
    })).rejects.toThrow("provider unavailable");
    expect(stored).toEqual(["regulator"]);
  });

  it("connects the registration page to a read-only preview instead of account selection", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/PortalRegistration.tsx"), "utf8");
    expect(source).toContain("/preview/${portalKey");
    expect(source).toContain("استكشف البوابة قبل التسجيل");
    expect(source).not.toContain("beginPortalRegistration");
    expect(source).not.toContain("startLogin");
  });
});
