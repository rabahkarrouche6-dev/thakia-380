import { describe, expect, it } from "vitest";
import { decodeOperatorPdf, operatorProfileInput } from "./routers";

const pdf = Buffer.from("%PDF-1.7\nminimal").toString("base64");

describe("economic operator registration validation", () => {
  it("accepts the approved shape with format-only identifiers", () => {
    const result = operatorProfileInput.safeParse({ operatorType: "مؤسسة", legalForm: "SARL", legalName: "شركة اختبار قانونية", wilayaCode: "16", taxCenterType: "IFU", representativeName: "ممثل قانوني", nif: "123456789012345", rc: "RC-123" });
    expect(result.success).toBe(true);
  });

  it("requires a supported Algerian legal form", () => {
    expect(operatorProfileInput.safeParse({ operatorType: "مؤسسة", legalName: "شركة اختبار قانونية", nif: "123456789012345", rc: "RC-123" }).success).toBe(false);
    expect(operatorProfileInput.safeParse({ operatorType: "مؤسسة", legalForm: "UNKNOWN", legalName: "شركة اختبار قانونية", nif: "123456789012345", rc: "RC-123" }).success).toBe(false);
  });

  it("rejects malformed identifiers without claiming official verification", () => {
    const result = operatorProfileInput.safeParse({ operatorType: "مؤسسة", legalName: "شركة اختبار قانونية", representativeName: "ممثل", nif: "123", rc: "../../etc/passwd" });
    expect(result.success).toBe(false);
  });

  it("accepts a PDF with a matching signature and rejects spoofed MIME or extension", () => {
    expect(() => decodeOperatorPdf({ fileName: "tax-card.pdf", mimeType: "application/pdf", dataBase64: pdf })).not.toThrow();
    expect(() => decodeOperatorPdf({ fileName: "tax-card.exe", mimeType: "application/pdf", dataBase64: pdf })).toThrow();
    expect(() => decodeOperatorPdf({ fileName: "tax-card.pdf", mimeType: "application/pdf", dataBase64: Buffer.from("not-pdf").toString("base64") })).toThrow();
  });

  it("rejects unsafe client names and malformed base64", () => {
    expect(() => decodeOperatorPdf({ fileName: "../secret.pdf", mimeType: "application/pdf", dataBase64: pdf })).toThrow();
    expect(() => decodeOperatorPdf({ fileName: "safe.pdf", mimeType: "application/pdf", dataBase64: "%%%" })).toThrow();
  });
});
