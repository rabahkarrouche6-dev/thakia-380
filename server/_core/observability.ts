import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import type { ActorRole, ProductEventName } from "@shared/observability";

const REQUEST_ID_HEADER = "x-request-id";

function normalizeRequestId(value: string | undefined) {
  return value && /^[a-zA-Z0-9._:-]{8,100}$/.test(value) ? value : randomUUID();
}

export function attachRequestId(req: Request, res: Response, next: () => void) {
  const requestId = normalizeRequestId(req.header(REQUEST_ID_HEADER));
  res.locals.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}

export function getRequestId(req: Request) {
  return String(req.res?.locals.requestId ?? req.header(REQUEST_ID_HEADER) ?? "unknown").slice(0, 100);
}

function write(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}) {
  const safe = Object.fromEntries(
    Object.entries(fields).filter(([key, value]) => {
      if (["authorization", "cookie", "password", "token", "secret", "body", "query", "params", "content", "stack"].includes(key.toLowerCase())) return false;
      return ["string", "number", "boolean"].includes(typeof value) || value === null;
    }),
  );
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...safe });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function logRequest(req: Request, status: number, durationMs: number, role?: ActorRole) {
  write(status >= 500 ? "error" : status >= 400 ? "warn" : "info", "http_request", {
    requestId: getRequestId(req),
    method: req.method,
    route: req.path,
    status,
    durationMs: Math.round(durationMs),
    actorRole: role ?? "anonymous",
  });
}

export function logProductEvent(input: {
  name: ProductEventName;
  actorRole: ActorRole;
  outcome: "success" | "failure";
  failureCategory?: string;
  entityType?: string;
  entityId?: number;
  requestId?: string;
}) {
  write("info", "product_event", {
    eventName: input.name,
    actorRole: input.actorRole,
    outcome: input.outcome,
    failureCategory: input.failureCategory ?? null,
    entityType: input.entityType ?? "none",
    entityId: input.entityId ?? null,
    requestId: input.requestId ?? null,
  });
}

export function logServerError(input: {
  error: unknown;
  requestId?: string;
  route?: string;
  actorRole?: ActorRole;
  category: string;
}) {
  write("error", "application_error", {
    requestId: input.requestId ?? null,
    route: input.route ?? null,
    actorRole: input.actorRole ?? "anonymous",
    category: input.category,
  });
}
