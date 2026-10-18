import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("safe preview mode", () => {
  it("keeps preview UI static and separate from the protected app route", () => {
    const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
    const previewSource = readFileSync(resolve(process.cwd(), "client/src/pages/PreviewPortals.tsx"), "utf8");

    expect(appSource).toContain('path="/preview"');
    expect(appSource).toContain('path="/preview/:portal"');
    expect(appSource).toContain('path="/app" component={Portal}');
    expect(previewSource).not.toContain("trpc.");
    expect(previewSource).not.toContain("useMutation");
    expect(previewSource).toContain("بيانات ثابتة غير تشغيلية");
  });
});
