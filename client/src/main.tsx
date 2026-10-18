import { trpc } from "@/lib/trpc";
import { COOKIE_NAME } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { trackError, trackProductEvent } from "@/lib/analytics";
import "./index.css";

const queryClient = new QueryClient();

function productEventForMutationKey(key: unknown): { name: Parameters<typeof trackProductEvent>[0]; entityType?: "tender" | "bid" | "portal" } | null {
  const path = Array.isArray(key) ? key.join(".") : String(key ?? "");
  if (path.endsWith("auth.setRole")) return { name: "role_portal_opened", entityType: "portal" };
  if (path.endsWith("tenders.create")) return { name: "tender_created", entityType: "tender" };
  if (path.endsWith("tenders.publish")) return { name: "tender_published", entityType: "tender" };
  if (path.endsWith("bids.createDraft") || path.endsWith("bids.updateDraft")) return { name: "bid_draft_saved", entityType: "bid" };
  if (path.endsWith("bids.submit")) return { name: "bid_submitted", entityType: "bid" };
  if (path.endsWith("bidOpening.open")) return { name: "bid_opening_completed", entityType: "tender" };
  if (path.endsWith("tenders.startEvaluation")) return { name: "evaluation_started", entityType: "tender" };
  if (path.endsWith("awards.decide")) return { name: "award_created", entityType: "tender" };
  return null;
}

function currentActorRole(): "anonymous" | "supplier" | "authority" | "regulator" | "admin" | "user" {
  const data = queryClient.getQueryCache().find({ queryKey: ["auth", "me"] })?.state.data as { role?: string } | undefined;
  return data?.role === "supplier" || data?.role === "authority" || data?.role === "regulator" || data?.role === "admin" || data?.role === "user" ? data.role : "anonymous";
}

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    console.error("[API Query Error]", error);
    trackError(error, { route: typeof window !== "undefined" ? window.location.pathname : undefined });
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    console.error("[API Mutation Error]", error);
    const mapped = productEventForMutationKey(event.mutation.options.mutationKey);
    if (mapped) trackProductEvent(mapped.name, { actorRole: currentActorRole(), entityType: mapped.entityType, outcome: "failure", failureCategory: "server_failure" });
    trackError(error, { route: typeof window !== "undefined" ? window.location.pathname : undefined });
  }
  if (event.type === "updated" && event.action.type === "success") {
    const mapped = productEventForMutationKey(event.mutation.options.mutationKey);
    if (mapped) trackProductEvent(mapped.name, { actorRole: currentActorRole(), entityType: mapped.entityType, outcome: "success" });
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Preview auto-login fallback: when the browser blocks iframe cookies
        // (Safari ITP / private browsing / WebView), the runtime mirrors the
        // session into sessionStorage so we can forward it as a Bearer token.
        // The regular OAuth cookie flow keeps working and takes priority server-side.
        try {
          const raw = sessionStorage.getItem("manus-cookie") || localStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // storage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
