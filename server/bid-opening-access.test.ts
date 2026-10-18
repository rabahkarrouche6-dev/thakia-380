import { describe, expect, it } from "vitest";
import { assertBidPayloadDecryptable } from "./crypto/bidOpeningAccess";

const deadline = new Date("2026-08-18T12:00:00.000Z");
const afterDeadline = new Date("2026-08-18T12:00:01.000Z");

 describe("bid payload opening access guard", () => {
  it("rejects decryption before the server-side deadline", () => {
    expect(() => assertBidPayloadDecryptable({
      sessionStatus: "sealed",
      tenderDeadline: deadline,
      serverNow: new Date("2026-08-18T11:59:59.000Z"),
    })).toThrow("time-locked");
  });

  it("rejects decryption when the session is not sealed", () => {
    expect(() => assertBidPayloadDecryptable({
      sessionStatus: "opened",
      tenderDeadline: deadline,
      serverNow: afterDeadline,
    })).toThrow("not sealed");
  });

  it("allows decryption only after the deadline and sealing", () => {
    expect(() => assertBidPayloadDecryptable({
      sessionStatus: "sealed",
      tenderDeadline: deadline,
      serverNow: afterDeadline,
    })).not.toThrow();
  });

  it("rejects invalid trusted time inputs", () => {
    expect(() => assertBidPayloadDecryptable({
      sessionStatus: "sealed",
      tenderDeadline: new Date("invalid"),
      serverNow: afterDeadline,
    })).toThrow("Invalid tender deadline");
  });
});
