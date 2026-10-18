export type TenderState = "draft" | "published" | "closed" | "evaluation" | "awarded" | "cancelled";
export type BidState = "draft" | "submitted" | "under_review" | "accepted" | "rejected";

const tenderTransitions: Record<TenderState, readonly TenderState[]> = {
  draft: ["published"],
  published: ["closed"],
  closed: ["evaluation"],
  evaluation: ["awarded", "cancelled"],
  awarded: [],
  cancelled: [],
};

const bidTransitions: Record<BidState, readonly BidState[]> = {
  draft: ["submitted"],
  submitted: ["under_review"],
  under_review: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
};

export function isTenderTransitionAllowed(from: TenderState, to: TenderState) {
  return tenderTransitions[from]?.includes(to) ?? false;
}

export function isBidTransitionAllowed(from: BidState, to: BidState) {
  return bidTransitions[from]?.includes(to) ?? false;
}

export function assertTenderTransition(from: TenderState, to: TenderState) {
  if (!isTenderTransitionAllowed(from, to)) throw new Error(`Invalid tender transition: ${from} -> ${to}`);
}

export function assertBidTransition(from: BidState, to: BidState) {
  if (!isBidTransitionAllowed(from, to)) throw new Error(`Invalid bid transition: ${from} -> ${to}`);
}

export const ADMIN_DELEGATION_SCOPES = ["manage", "decide"] as const;
export type AdminDelegationScope = (typeof ADMIN_DELEGATION_SCOPES)[number];

export function scopeAllows(scope: AdminDelegationScope, required: AdminDelegationScope) {
  return scope === required || (scope === "manage" && required === "decide");
}


export type AdminDelegationWindow = {
  startsAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
};

export function isAdminDelegationActive(delegation: AdminDelegationWindow, at = new Date()) {
  return delegation.revokedAt === null && delegation.startsAt <= at && delegation.expiresAt > at;
}
