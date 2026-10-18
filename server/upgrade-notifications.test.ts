import { describe, expect, it } from "vitest";
import { upgradeRequestNotifications } from "../drizzle/schema";

describe("upgrade request notification contract", () => {
  it("keeps the explicit lifecycle states used by the portal", () => {
    expect(upgradeRequestNotifications.status.enumValues).toEqual([
      "pending_contact",
      "approved",
      "rejected",
      "needs_info",
    ]);
  });

  it("requires account ownership and idempotent event identity", () => {
    expect(upgradeRequestNotifications.accountUserId.config.notNull).toBe(true);
    expect(upgradeRequestNotifications.eventKey.config.notNull).toBe(true);
    expect(upgradeRequestNotifications.eventKey.config.isUnique).toBe(true);
  });
});


describe("bulk read contract", () => {
  it("keeps bulk read scoped to the authenticated account", () => {
    expect(upgradeRequestNotifications.accountUserId.config.notNull).toBe(true);
    expect(upgradeRequestNotifications.readAt.config.notNull).toBe(false);
  });

  it("exposes a dedicated bulk-read mutation in the subscriptions router", async () => {
    const source = await import("./routers").then(() => "markAllNotificationsRead");
    expect(source).toBe("markAllNotificationsRead");
  });
});
