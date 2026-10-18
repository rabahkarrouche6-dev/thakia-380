import type { Express, Request, Response } from "express";
import { listAuthorityOperationalAlerts, listUpgradeRequestNotifications, listSupplierOperationalAlerts } from "./db";
import { sdk } from "./_core/sdk";

const POLL_INTERVAL_MS = 15_000;
const HEARTBEAT_INTERVAL_MS = 20_000;

export function notificationSnapshotFingerprint(snapshot: { items: Array<{ id: number; readAt: Date | null; status?: string; type?: string }>; unreadCount: number }) {
  return JSON.stringify({
    unreadCount: snapshot.unreadCount,
    items: snapshot.items.map(item => ({ id: item.id, readAt: item.readAt?.toISOString() ?? null, status: item.status ?? item.type ?? "notification" })),
  });
}

export function registerNotificationStream(app: Express) {
  app.get("/api/notifications/stream", async (req: Request, res: Response) => {
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.status(401).json({ error: "UNAUTHENTICATED" });
      return;
    }
    if (!user || (user.role !== "supplier" && user.role !== "authority")) {
      res.status(403).json({ error: "FORBIDDEN" });
      return;
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    let closed = false;
    let lastFingerprint = "";
    const writeEvent = (event: string, data: unknown) => {
      if (closed || res.writableEnded) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const publishSnapshot = async () => {
      if (closed) return;
      try {
        const items = user.role === "authority"
          ? await listAuthorityOperationalAlerts(user.id, 30)
          : user.role === "supplier"
            ? await listSupplierOperationalAlerts(user.id, 30)
            : await listUpgradeRequestNotifications(user.id, 30);
        const snapshot = { items, unreadCount: items.filter(item => !item.readAt).length, refreshedAt: new Date() };
        const fingerprint = notificationSnapshotFingerprint(snapshot);
        if (fingerprint !== lastFingerprint) {
          lastFingerprint = fingerprint;
          writeEvent("notifications", snapshot);
        }
      } catch {
        writeEvent("error", { code: "NOTIFICATIONS_UNAVAILABLE" });
      }
    };

    const pollTimer = setInterval(() => void publishSnapshot(), POLL_INTERVAL_MS);
    const heartbeatTimer = setInterval(() => writeEvent("heartbeat", { at: new Date().toISOString() }), HEARTBEAT_INTERVAL_MS);
    req.on("close", () => {
      closed = true;
      clearInterval(pollTimer);
      clearInterval(heartbeatTimer);
    });

    writeEvent("ready", { pollIntervalMs: POLL_INTERVAL_MS });
    await publishSnapshot();
  });
}
