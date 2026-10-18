export const PRODUCT_EVENTS = [
  "landing_viewed",
  "registration_started",
  "registration_completed",
  "login_succeeded",
  "login_failed",
  "role_portal_opened",
  "tender_created",
  "tender_published",
  "tender_viewed",
  "tender_search_performed",
  "bid_draft_saved",
  "bid_submitted",
  "bid_submission_failed",
  "bid_opening_started",
  "bid_opening_completed",
  "evaluation_started",
  "award_created",
  "recommendations_viewed",
  "recommendation_clicked",
  "explanation_opened",
  "profile_completion_cta_clicked",
  "recommendation_action_clicked",
  "recommendation_hidden",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENTS)[number];
export type ActorRole = "anonymous" | "supplier" | "authority" | "regulator" | "admin" | "user";

export type SafeProductEvent = {
  name: ProductEventName;
  actorRole: ActorRole;
  entityType?: "none" | "user" | "portal" | "tender" | "bid" | "tender_search" | "recommendation" | "matching_explanation";
  outcome: "success" | "failure";
  failureCategory?:
    | "validation"
    | "unauthorized"
    | "forbidden"
    | "not_found"
    | "deadline_passed"
    | "conflict"
    | "oauth_callback_failed"
    | "network"
    | "server_failure";
};

export const SAFE_FAILURE_CATEGORIES = new Set<NonNullable<SafeProductEvent["failureCategory"]>>([
  "validation",
  "unauthorized",
  "forbidden",
  "not_found",
  "deadline_passed",
  "conflict",
  "oauth_callback_failed",
  "network",
  "server_failure",
]);

export function isProductEventName(value: string): value is ProductEventName {
  return (PRODUCT_EVENTS as readonly string[]).includes(value);
}
