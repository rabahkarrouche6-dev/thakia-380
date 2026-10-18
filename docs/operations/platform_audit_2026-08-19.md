# Platform Audit — 19 August 2026

## Scope and method

This is a read-first technical audit of the React/Vite client, Express/tRPC server, Drizzle schema and migrations, role guards, database access paths, test suite, and production-serving configuration. The baseline ran `pnpm lint`, `pnpm test`, `pnpm check`, and `pnpm build` before remediation.

| Baseline signal | Observation |
| --- | --- |
| Tests and type check | 176 tests passed; 5 were skipped by project configuration; `tsc --noEmit` passed. |
| Lint | Failed: Prettier reported style drift in 196 files. |
| Production build | Completed in 18.64 seconds, but emitted a 3,237,369-byte bootstrap script (853,310 bytes gzip) and Vite emitted the over-500 KB chunk warning. |
| Deployment assets | `dist/public` was served with Express defaults, without an immutable-cache policy for content-hashed assets. |

## Findings

### P0 — none confirmed

No confirmed P0 was found in the reviewed paths. OAuth callback state has a nonce comparison, tRPC has protected/admin procedures, and the supplier/authority/regulator portal resolver rejects an unapproved role rather than falling back to a workspace.

### P1 — Address in this remediation

| ID | Evidence | Risk | Root cause | Fix | Files impacted | Test needed |
| --- | --- | --- | --- | --- | --- | --- |
| P1-PERF-01 | Production build emitted `index-*.js` at 3.24 MB / 853 KB gzip and a Vite large-chunk warning. `Portal.tsx` eagerly imported every workspace and `AIChatBox`/Streamdown, while legacy portal components remained in the same module although the live render uses the dedicated workspaces. | Slow first authenticated render, higher mobile data use, and slower time to interactivity. | Eager imports and dead duplicated dashboard code keep chart, markdown, and chat dependencies in the bootstrap graph. | Remove legacy unused portal implementations and lazy-load role-specific workspaces. | `client/src/pages/Portal.tsx`, optionally workspace entry pages. | Build-size assertion plus portal-access view tests. |
| P1-PERF-02 | `serveStatic` called `express.static(distPath)` with default caching even though emitted JavaScript and CSS files are content-hashed. | Repeat visits revalidate/download more often than necessary, degrading perceived platform speed. | No differentiation between immutable hashed assets and HTML entry point. | Apply long-lived immutable caching only to `/assets`, retain no-cache HTML fallback. | `server/_core/vite.ts` | Static-serving header contract test. |

### P2 — Track after P1

| ID | Evidence | Risk | Root cause | Fix | Files impacted | Test needed |
| --- | --- | --- | --- | --- | --- | --- |
| P2-SEC-01 | Session cookie is `httpOnly` and conditionally secure, but has `sameSite: "none"`; session lifetime is one year. OAuth state itself is nonce-checked. | Wider cross-site cookie exposure and long compromise window if a session is stolen. | Cross-origin OAuth compatibility was prioritized without an explicit session-rotation/revocation policy. | Validate `SameSite=Lax` against the real OAuth provider and implement a revocation/rotation policy before changing production behavior. | `server/_core/cookies.ts`, `server/_core/oauth.ts` | OAuth callback and cookie-policy integration tests. |
| P2-SEC-02 | API body parsers allow 50 MB globally; no application-level rate-limit middleware was found in server bootstrap. | Higher resource exhaustion risk on public endpoints; a per-instance in-memory limiter would not be sufficient for autoscaling. | File size and abuse controls are not separated by route or centralized at the edge. | Add edge/distributed rate limiting and endpoint-specific body limits after selecting the production control plane. | `server/_core/index.ts`, hosting/edge configuration | Load and abuse-resistance tests. |
| P2-PERF-03 | Each open notification SSE connection performs `listUpgradeRequestNotifications` every 15 seconds. | Database work grows linearly with connected users. | Polling is instantiated per connection instead of fanning out a shared invalidation/snapshot. | Add user-scoped invalidation or an event-backed notification fan-out. | `server/notificationStream.ts`, notification data layer | Multi-client connection/query-count test. |
| P2-QUAL-01 | `pnpm lint` reports Prettier drift in 196 files. | CI cannot act as a clean formatting gate; diffs become noisy. | Formatting was not enforced continuously. | Run a separate, reviewed formatting migration and make lint mandatory in CI. | Repository-wide | Clean lint pipeline. |

### P3 — Maintainability

| ID | Evidence | Risk | Root cause | Fix | Files impacted | Test needed |
| --- | --- | --- | --- | --- | --- | --- |
| P3-MAINT-01 | `Portal.tsx` contained parallel legacy portal widgets plus the newer dedicated workspace components, duplicating dashboard responsibilities. | Confusing ownership and higher regression probability. | Incremental replacement left obsolete implementation in the route entry module. | Remove obsolete components while retaining the role picker and access-denied guard. | `client/src/pages/Portal.tsx` | Existing portal-routing and portal-access tests. |
| P3-DB-01 | Supplier contracts and operational notifications now have owner-oriented indexes and are generated in the award transaction. Other high-volume query plans were not profiled against production-sized data. | Future scale regressions can remain hidden. | No production-like query benchmark or explain-plan gate. | Add anonymized workload fixtures and `EXPLAIN` review in a separate data-performance task. | `server/db.ts`, test fixtures | Query-plan and latency regression tests. |

## Remediation results

| Item | Change applied | Evidence after remediation | Status |
| --- | --- | --- | --- |
| P1-PERF-01 | Replaced the duplicated portal widget implementation with a guarded, lazy-loaded portal entry. Extracted lightweight role navigation into `client/src/lib/portalNavigation.ts`, leaving `AuthorityShell`, `SupplierWorkspace`, and `CentralAdminPortal` in role-specific chunks. | Bootstrap `index-*.js` fell from **3,237,369 bytes / 853,310 gzip bytes** to **1,531,350 bytes / 403,970 gzip bytes**: reductions of **52.69%** and **52.65%** respectively. The role-specific Central Admin chunk is now deferred at **1,462.27 KB / 416.48 KB gzip**. | Resolved |
| P1-PERF-02 | Added long-lived immutable caching for content-hashed `/assets/*` in production static serving, retaining no-cache behavior for the HTML fallback. | `server/static-serving.contract.test.ts` passes and confirms the header policy. | Resolved |
| P3-MAINT-01 | Removed legacy duplicated portal content from the route entry while retaining loading, role-request, access-denied, locale, and role guards. | `server/portal-lazy-loading.contract.test.ts`, access tests, and role-specific navigation contract tests pass. | Resolved as part of P1-PERF-01 |

## Verification after remediation

| Check | Result |
| --- | --- |
| Tests | **47 files passed**, **178 tests passed**, and 1 file / 5 tests remained skipped by existing project configuration. |
| Type check | `pnpm check` (`tsc --noEmit`) passed. |
| Production build | Passed in **16.60 seconds**. The remaining large-chunk warning identifies deferred/feature-specific chunks, including Central Admin, rather than the initial bootstrap path. |
| Lint | Still fails on Prettier style drift, now reported in **201 files**. This is tracked as P2-QUAL-01; a repository-wide formatting rewrite was intentionally excluded from this focused P1 remediation. |

## Remediation boundary

This remediation completed **P1-PERF-01** and **P1-PERF-02**. The P2 security and scaling items require a validated production edge/session decision or workload sizing and are documented rather than changed speculatively.
