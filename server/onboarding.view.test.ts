import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const supplier = readFileSync("client/src/pages/SupplierWorkspace.tsx", "utf8");
const authority = readFileSync("client/src/pages/AuthorityShell.tsx", "utf8");
const regulator = readFileSync("client/src/pages/CentralAdminPortal.tsx", "utf8");
const component = readFileSync("client/src/components/ContextualOnboarding.tsx", "utf8");

 describe("contextual onboarding view contracts", () => {
  it("uses real role-specific portals and actions", () => {
    expect(supplier).toContain('role="supplier"');
    expect(supplier).toContain('onNavigate("opportunities")');
    expect(supplier).toContain('trpc.profile.get.useQuery()');
    expect(authority).toContain('role="authority"');
    expect(authority).toContain('onDrillDown("tender-documents")');
    expect(authority).toContain('trpc.tenders.mine.useQuery()');
    expect(regulator).toContain('role="regulator"');
    expect(regulator).toContain('regulator-overview');
    expect(regulator).toContain('regulator-audit');
  });

  it("does not introduce a fake server progress or a new onboarding API", () => {
    expect(component).toContain("localStorage");
    expect(component).toContain("إرشاد اختياري");
    expect(component).not.toContain("fetch(");
    expect(component).toContain("Recommended next step");
    expect(component).not.toContain("onboarding.progress");
    expect(supplier).not.toContain("onboarding.update");
    expect(authority).not.toContain("onboarding.update");
    expect(regulator).not.toContain("onboarding.update");
  });

  it("keeps the three required Arabic role messages", () => {
    expect(supplier).toContain("ابدأ من هنا");
    expect(authority).toContain("ابدأ بإدارة صفقتك");
    expect(regulator).toContain("ابدأ بالمراجعة الرقابية");
  });
});
