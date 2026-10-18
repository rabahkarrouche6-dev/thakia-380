import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { decodeDocument } from "./routers";

const pdf = Buffer.from("%PDF-1.7\n").toString("base64");

describe("document security gate", () => {
  it("accepts a PDF whose bytes match its MIME and extension", () => {
    expect(decodeDocument({ fileName: "spec.pdf", mimeType: "application/pdf", dataBase64: pdf })).toBeInstanceOf(Buffer);
  });

  it("rejects MIME spoofing", () => {
    expect(() => decodeDocument({ fileName: "spec.pdf", mimeType: "application/pdf", dataBase64: Buffer.from("not-a-pdf").toString("base64") })).toThrow();
  });

  it("rejects path traversal names", () => {
    expect(() => decodeDocument({ fileName: "../secret.pdf", mimeType: "application/pdf", dataBase64: pdf })).toThrow();
  });

  it("strips storage internals from document responses", () => {
    const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(routerSource).toContain("function stripStorageMetadata");
    expect(routerSource).toContain("return { ...stripStorageMetadata(document), url }");
    expect(routerSource).not.toContain("return { ...document, url }");
  });
});
