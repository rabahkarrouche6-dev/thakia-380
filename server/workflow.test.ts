import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function callerFor(role: "supplier" | "authority" | "regulator") {
  const ctx: TrpcContext = {
    user: { id: 21, openId: `workflow-${role}`, name: "Workflow Test", email: "workflow@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

describe("tender workflow safeguards", () => {
  it("blocks publishing from a non-authority context", async () => {
    await expect(callerFor("supplier").tenders.publish(1)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks evaluation from a non-authority context", async () => {
    await expect(callerFor("regulator").bids.evaluate({ tenderId: 1, bidId: 1, status: "accepted", evaluationNote: "ملاحظة اختبار" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks award decisions from a non-authority context", async () => {
    await expect(callerFor("supplier").awards.decide({ tenderId: 1, decision: "awarded", winningBidId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
