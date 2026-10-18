export type BidOpeningAccessInput = {
  sessionStatus: "scheduled" | "opened" | "sealed";
  tenderDeadline: Date;
  serverNow: Date;
};

/**
 * Pure policy guard. It is intentionally not wired to production routers yet;
 * callers must provide a trusted server timestamp and the persisted session state.
 */
export function assertBidPayloadDecryptable(input: BidOpeningAccessInput): void {
  if (!(input.tenderDeadline instanceof Date) || Number.isNaN(input.tenderDeadline.getTime())) {
    throw new Error("Invalid tender deadline");
  }
  if (!(input.serverNow instanceof Date) || Number.isNaN(input.serverNow.getTime())) {
    throw new Error("Invalid server time");
  }
  if (input.serverNow.getTime() < input.tenderDeadline.getTime()) {
    throw new Error("Bid payload remains time-locked");
  }
  if (input.sessionStatus !== "sealed") {
    throw new Error("Bid opening session is not sealed");
  }
}
