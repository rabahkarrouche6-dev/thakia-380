import type { ActorRole, ProductEventName, SafeProductEvent } from "@shared/observability";

const ANALYTICS_BASE = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
const WEBSITE_ID = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined;
const ANALYTICS_ENDPOINT = ANALYTICS_BASE
  ? ANALYTICS_BASE.endsWith("/api/send")
    ? ANALYTICS_BASE
    : `${ANALYTICS_BASE.replace(/\/$/, "")}/api/send`
  : undefined;

const MAX_QUEUE_SIZE = 20;
let queue: SafeProductEvent[] = [];

function safeRole(role: string | null | undefined): ActorRole {
  if (role === "supplier" || role === "authority" || role === "regulator" || role === "admin" || role === "user") {
    return role;
  }
  return "anonymous";
}

function flush() {
  if (!ANALYTICS_ENDPOINT || !WEBSITE_ID || queue.length === 0 || typeof window === "undefined") return;
  const events = queue.splice(0, MAX_QUEUE_SIZE);
  const body = JSON.stringify({
    type: "event",
    payload: {
      website: WEBSITE_ID,
      eventName: events[0]?.name,
      eventData: {
        actorRole: events[0]?.actorRole,
        entityType: events[0]?.entityType ?? "none",
        outcome: events[0]?.outcome,
        ...(events[0]?.failureCategory ? { failureCategory: events[0].failureCategory } : {}),
      },
    },
  });

  try {
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(ANALYTICS_ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
    }).catch(() => undefined);
  } catch {
    // Observability must never affect the product flow.
  }
}

export function trackProductEvent(
  name: ProductEventName,
  input: Omit<SafeProductEvent, "name"> = { actorRole: "anonymous", outcome: "success" },
) {
  if (!ANALYTICS_ENDPOINT || !WEBSITE_ID) return;
  queue.push({
    name,
    actorRole: safeRole(input.actorRole),
    entityType: input.entityType,
    outcome: input.outcome,
    failureCategory: input.failureCategory,
  });
  flush();
}

export function trackError(error: unknown, context: { route?: string; requestId?: string } = {}) {
  // Keep the browser payload strictly technical and bounded. Never serialize the error object.
  if (!ANALYTICS_ENDPOINT || !WEBSITE_ID) return;
  const category = error instanceof Error ? error.name.slice(0, 40) : "unknown_error";
  const eventData = {
    website: WEBSITE_ID,
    eventName: "client_error",
    eventData: {
      category,
      route: context.route?.split("?")[0]?.slice(0, 120),
      requestId: context.requestId?.slice(0, 80),
    },
  };
  try {
    void fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "event", payload: eventData }),
      keepalive: true,
      credentials: "omit",
    }).catch(() => undefined);
  } catch {
    // Ignore monitoring failures.
  }
}
