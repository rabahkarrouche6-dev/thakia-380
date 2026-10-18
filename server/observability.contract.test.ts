import { describe, expect, it } from "vitest";
import { PRODUCT_EVENTS } from "../shared/observability";
import { readFileSync } from "node:fs";

const analytics = readFileSync("client/src/lib/analytics.ts", "utf8");
const errorBoundary = readFileSync("client/src/components/ErrorBoundary.tsx", "utf8");
const serverObserver = readFileSync("server/_core/observability.ts", "utf8");
const index = readFileSync("server/_core/index.ts", "utf8");

 describe("MVP observability contracts", () => {
  it("keeps the required product event catalog stable", () => {
    expect(PRODUCT_EVENTS).toEqual([
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
    ]);
  });

  it("does not serialize sensitive request or business payloads", () => {
    expect(analytics).toContain('credentials: "omit"');
    expect(analytics).not.toContain("password");
    expect(analytics).not.toContain("documentContent");
    expect(serverObserver).toContain('"authorization"');
    expect(serverObserver).toContain('"cookie"');
    expect(serverObserver).toContain('"stack"');
  });

  it("has an Arabic unexpected-error fallback and request correlation", () => {
    expect(errorBoundary).toContain("حدث خطأ غير متوقع");
    expect(errorBoundary).toContain("trackError");
    expect(serverObserver).toContain("attachRequestId");
    expect(serverObserver).toContain("x-request-id");
    expect(index).toContain("app.use(attachRequestId)");
  });
});
