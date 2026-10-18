import { describe, expect, it } from "vitest";
import { getPortalKey } from "../../../shared/login";

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
});
