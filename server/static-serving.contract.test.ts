import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const servingPath = path.resolve(import.meta.dirname, "../server/_core/vite.ts");
const servingSource = fs.readFileSync(servingPath, "utf8");

describe("production asset cache contract", () => {
  it("uses immutable caching only for content-hashed asset paths and no-cache HTML", () => {
    expect(servingSource).toContain('app.use("/assets", express.static(path.resolve(distPath, "assets"), {');
    expect(servingSource).toContain("immutable: true");
    expect(servingSource).toContain('maxAge: "1y"');
    expect(servingSource).toContain('res.setHeader("Cache-Control", "no-cache")');
  });
});
