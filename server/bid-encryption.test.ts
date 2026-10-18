import { describe, expect, it } from "vitest";
import { decryptBidPayloadText, encryptBidPayload } from "./crypto/bidEncryption";

const masterKey = Buffer.alloc(32, 7).toString("base64");
const additionalData = "bid:42:payload:v1";

function encryptedPayload() {
  return encryptBidPayload({
    plaintext: JSON.stringify({ amount: 125000, proposal: "عرض فني سري" }),
    masterKey,
    keyVersion: "test-v1",
    additionalData,
  });
}

describe("isolated bid encryption contract", () => {
  it("round-trips Arabic bid payloads without changing plaintext", () => {
    const encrypted = encryptedPayload();
    expect(encrypted.algorithm).toBe("aes-256-gcm");
    expect(encrypted.version).toBe(1);
    expect(decryptBidPayloadText({ encrypted, masterKey, additionalData })).toBe(
      JSON.stringify({ amount: 125000, proposal: "عرض فني سري" }),
    );
  });

  it("does not expose plaintext in the encrypted fields", () => {
    const encrypted = encryptedPayload();
    expect(JSON.stringify(encrypted)).not.toContain("عرض فني سري");
    expect(JSON.stringify(encrypted)).not.toContain("125000");
  });

  it("rejects a wrong master key", () => {
    const encrypted = encryptedPayload();
    const wrongKey = Buffer.alloc(32, 8).toString("base64");
    expect(() => decryptBidPayloadText({ encrypted, masterKey: wrongKey, additionalData })).toThrow();
  });

  it("rejects tampered ciphertext", () => {
    const encrypted = encryptedPayload();
    const tampered = { ...encrypted, ciphertext: Buffer.from("tampered").toString("base64") };
    expect(() => decryptBidPayloadText({ encrypted: tampered, masterKey, additionalData })).toThrow();
  });

  it("rejects tampering with the wrapped data key", () => {
    const encrypted = encryptedPayload();
    const wrapped = Buffer.from(encrypted.wrappedDataKey, "base64");
    wrapped[0] ^= 1;
    expect(() => decryptBidPayloadText({
      encrypted: { ...encrypted, wrappedDataKey: wrapped.toString("base64") },
      masterKey,
      additionalData,
    })).toThrow();
  });

  it("generates independent data keys for repeated payloads", () => {
    const first = encryptedPayload();
    const second = encryptedPayload();
    expect(first.wrappedDataKey).not.toBe(second.wrappedDataKey);
    expect(first.keyWrapNonce).not.toBe(second.keyWrapNonce);
  });

  it("rejects a different additional-data binding", () => {
    const encrypted = encryptedPayload();
    expect(() => decryptBidPayloadText({ encrypted, masterKey, additionalData: "bid:43:payload:v1" })).toThrow();
  });

  it("rejects invalid key length and missing binding", () => {
    expect(() => encryptBidPayload({ plaintext: "x", masterKey: "short", keyVersion: "test-v1", additionalData })).toThrow();
    expect(() => encryptBidPayload({ plaintext: "x", masterKey, keyVersion: "test-v1", additionalData: "" })).toThrow();
  });

  const configuredKey = process.env.BID_ENCRYPTION_MASTER_KEY;
  const configuredKeyIsValid = Boolean(
    configuredKey && (/^[0-9a-f]{64}$/i.test(configuredKey.trim()) || Buffer.from(configuredKey.trim(), "base64").length === 32),
  );

  it.skipIf(!configuredKeyIsValid)("validates the configured production key through the encryption API", () => {
    const encrypted = encryptBidPayload({
      plaintext: "secret-validation",
      masterKey: configuredKey!,
      keyVersion: "configured-v1",
      additionalData: "bid:secret-validation:payload:v1",
    });
    expect(decryptBidPayloadText({
      encrypted,
      masterKey: configuredKey!,
      additionalData: "bid:secret-validation:payload:v1",
    })).toBe("secret-validation");
  });
});
