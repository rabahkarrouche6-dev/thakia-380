import { describe, expect, it } from "vitest";
import { notificationSnapshotFingerprint } from "./notificationStream";

describe("notification SSE snapshot contract", () => {
  it("produces the same fingerprint for the same notification state", () => {
    const snapshot = { unreadCount: 1, items: [{ id: 7, status: "pending_contact", readAt: null }] };
    expect(notificationSnapshotFingerprint(snapshot)).toBe(notificationSnapshotFingerprint(snapshot));
  });

  it("changes when read state or status changes", () => {
    const unread = { unreadCount: 1, items: [{ id: 7, status: "pending_contact", readAt: null }] };
    const read = { unreadCount: 0, items: [{ id: 7, status: "pending_contact", readAt: new Date("2026-01-01T00:00:00.000Z") }] };
    const approved = { unreadCount: 1, items: [{ id: 7, status: "approved", readAt: null }] };
    expect(notificationSnapshotFingerprint(unread)).not.toBe(notificationSnapshotFingerprint(read));
    expect(notificationSnapshotFingerprint(unread)).not.toBe(notificationSnapshotFingerprint(approved));
  });

  it("accepts an operational notification type without serializing message content", () => {
    const unread = { unreadCount: 1, items: [{ id: 11, type: "authority_role_approved", readAt: null, message: "خاص" }] };
    const changedType = { unreadCount: 1, items: [{ id: 11, type: "tender_status_updated", readAt: null, message: "خاص آخر" }] };
    expect(notificationSnapshotFingerprint(unread)).not.toBe(notificationSnapshotFingerprint(changedType));
    expect(notificationSnapshotFingerprint(unread)).not.toContain("خاص");
  });

  it("does not include notification message content in the change fingerprint", () => {
    const first = { unreadCount: 1, items: [{ id: 7, status: "pending_contact", readAt: null, message: "أ" }] };
    const second = { unreadCount: 1, items: [{ id: 7, status: "pending_contact", readAt: null, message: "ب" }] };
    expect(notificationSnapshotFingerprint(first)).toBe(notificationSnapshotFingerprint(second));
  });
});
