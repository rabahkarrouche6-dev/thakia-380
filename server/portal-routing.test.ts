import { describe, expect, it } from "vitest";
import { resolvePortalForRole } from "../shared/portalRouting";

describe("portal routing by role", () => {
  it("routes admin to the central administration portal", () => {
    expect(resolvePortalForRole("admin")).toBe("regulator");
  });

  it("keeps regulator and supplier routing unchanged", () => {
    expect(resolvePortalForRole("regulator")).toBe("regulator");
    expect(resolvePortalForRole("supplier")).toBe("supplier");
  });

  it("uses the authority portal only for authority users", () => {
    expect(resolvePortalForRole("authority")).toBe("authority");
  });

  it("denies unknown roles instead of falling through to the authority portal", () => {
    expect(resolvePortalForRole("guest")).toBeNull();
    expect(resolvePortalForRole("unsupported-role")).toBeNull();
  });
});
