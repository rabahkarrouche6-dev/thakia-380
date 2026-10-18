import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const portalPath = path.resolve(import.meta.dirname, "../client/src/pages/Portal.tsx");
const portalSource = fs.readFileSync(portalPath, "utf8");

describe("portal bootstrap performance contract", () => {
  it("defers workspace modules until an approved role selects one", () => {
    expect(portalSource).toContain('lazy(() => import("@/pages/CentralAdminPortal"))');
    expect(portalSource).toContain('lazy(() => import("@/pages/AuthorityShell"))');
    expect(portalSource).toContain('lazy(() => import("@/pages/SupplierWorkspace"))');
    expect(portalSource).toContain("<Suspense");
    expect(portalSource).not.toContain('import CentralAdminPortal from "@/pages/CentralAdminPortal"');
    expect(portalSource).not.toContain('import AuthorityWorkspace from "@/pages/AuthorityShell"');
    expect(portalSource).not.toContain('import SupplierWorkspace from "@/pages/SupplierWorkspace"');
  });
});
