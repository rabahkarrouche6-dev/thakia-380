import { describe, expect, it } from "vitest";
import { decryptBidPayloadText, encryptBidPayload } from "./bidEncryption";

describe("BID_ENCRYPTION_MASTER_KEY validation", () => {
  it("rejects a missing or invalid production key without enabling encryption", () => {
    const masterKey = process.env.BID_ENCRYPTION_MASTER_KEY;
    if (masterKey && Buffer.from(masterKey, "base64").length === 32) return;

    expect(() =>
      encryptBidPayload({
        plaintext: "pilot-key-validation",
        masterKey: masterKey ?? "",
        keyVersion: "pilot-validation",
        additionalData: "test:pilot-key-validation",
      })
    ).toThrow("must decode to exactly 32 bytes");
  });

  it("round-trips when a valid 32-byte key is explicitly configured", () => {
    const masterKey = process.env.BID_ENCRYPTION_MASTER_KEY;
    if (!masterKey || Buffer.from(masterKey, "base64").length !== 32) return;

    const encrypted = encryptBidPayload({
      plaintext: "pilot-key-validation",
      masterKey,
      keyVersion: "pilot-validation",
      additionalData: "test:pilot-key-validation",
    });

    expect(
      decryptBidPayloadText({
        encrypted,
        masterKey,
        additionalData: "test:pilot-key-validation",
      })
    ).toBe("pilot-key-validation");
  });
});
