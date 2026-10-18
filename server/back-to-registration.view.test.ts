import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("back to portal selection view contract", () => {
  const layoutSource = readFileSync(resolve(process.cwd(), "client/src/components/DashboardLayout.tsx"), "utf8");
  const routesSource = readFileSync(resolve(process.cwd(), "shared/login.ts"), "utf8");
  const redirectSource = readFileSync(resolve(process.cwd(), "client/src/pages/LoginRedirect.tsx"), "utf8");

  it("provides one shared registration route helper", () => {
    expect(routesSource).toContain("AUTH_ROUTES");
    expect(routesSource).toContain('registration: "/login"');
  });

  it("renders the secondary Arabic action from the shared authenticated layout", () => {
    expect(layoutSource).toContain("AUTH_ROUTES.registration");
    expect(layoutSource).toContain("العودة إلى اختيار البوابة");
    expect(layoutSource).toContain("focus-visible:ring-2");
    expect(layoutSource).toContain("border-slate-200");
  });

  it("keeps preview navigation on the login action and navigation on the back action", () => {
    expect(layoutSource).toContain("onClick={() => setLocation(AUTH_ROUTES.registration)}");
    expect(redirectSource).toContain("/preview/");
  });

  it("redirects the base login route without rendering the removed chooser", () => {
    expect(redirectSource).toContain("getPortalKey(location)");
    expect(redirectSource).not.toContain("startLogin");
    expect(redirectSource).toContain("sr-only");
  });
});
