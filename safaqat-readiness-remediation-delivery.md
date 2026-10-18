# Safaqat Dhakiya — Readiness Remediation Delivery

## Executive status

The copied Smart Tenders environment has completed the additive database repair and the associated verification baseline. The live TiDB database now contains **33 application tables**, matching the Drizzle schema inventory. The original migration blocker was isolated to a multi-statement `auditLogs` backfill; the migration file was split with statement breakpoints, and the migration ledger was reconciled only after the corresponding schema changes had been reviewed and applied.

The platform remains **advisory-only** for AI features. No automated step in this remediation grants an award, approves a document, or replaces a human procurement decision.

## Completed controls

| Area | Evidence | Result |
|---|---|---|
| Database schema | `SHOW TABLES` and information-schema count | 33 application tables present; migration runner completes without replaying duplicates |
| TiDB migration compatibility | `drizzle/0004_right_gwen_stacy.sql` | Audit backfill split into separate executable statements |
| Managed secrets | Existing managed-secret validation and crypto tests | `BID_ENCRYPTION_MASTER_KEY` validated as a 32-byte key; `ENABLE_ADVISORY_LLM` managed outside source files |
| IDOR coverage | `server/idor.integration.test.ts` | Real multi-role, multi-entity test fixture for authorities, suppliers, tenders, bids, and documents; opt-in only against an isolated database |
| Browser coverage | `e2e/procurement-flow.spec.ts` | Public landing and portal-selection flows pass; protected scenario is explicitly gated on an authenticated session |
| Frontend performance | `vite.config.ts` | Targeted chunks separate charts, graph, Mermaid, documents, and UI vendor code from route entry bundles |
| Existing regression baseline | `pnpm check`, `pnpm test -- --run`, `pnpm build` | TypeScript passes; 237 tests pass; the existing IDOR integration test remains environment-gated; production build completes |
| Integration governance | `government-integration-contract-template.md` | Contracts, data minimization, authentication, signature, audit, SLA, incident, and stop-switch controls documented |

## Verification commands

The following commands were executed successfully in the project directory:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
pnpm check
pnpm test -- --run
pnpm build
pnpm e2e
```

The browser suite completed with **2 passing tests and 1 intentionally skipped protected test**. The protected test is not marked as passed because the environment does not provide a provisioned authenticated authority or supplier browser session.

## Remaining gates

Two readiness gates remain intentionally open. First, `pnpm test:idor` requires an explicitly isolated `IDOR_DATABASE_URL`; it must never point at the application database. Second, the protected E2E journey requires a controlled authenticated session and test fixtures for the sequence Need → Draft → Publish → Match → Bid. These are execution prerequisites, not reasons to weaken access controls or seed production-like data into the live environment.

The production encryption wiring for bid payloads and documents, including session-bound opening/sealing behavior and key rotation, also remains a separate P0 implementation gate. The managed key is validated, but validation alone does not claim that the production storage path is encrypted.

## Operational handoff

Before any pilot, run the isolated IDOR command with a dedicated database URL, provision an authenticated E2E browser state through the approved identity process, and review the generated Playwright report. Keep the government connectors in contract-first status until endpoint ownership, data classification, signing, audit retention, SLA, and incident contacts are approved by the relevant institution.

## V1 boundary: contracts and execution

The post-award `contracts` and `execution` domain remains outside the current Pilot scope. A future V1 should model the awarded contract as a distinct aggregate linked to the tender and winning bid, then add milestones, deliverables, amendments, payment certificates, performance evidence, suspension, termination, and role-scoped audit events. No production connector or mutation is introduced until the legal owner, workflow authority, document retention, signature policy, and dispute process are approved.

## Historical TODO reconciliation

The authority portal discovery and redesign items repeated in the historical TODO section are satisfied by the later scoped implementation section: the grouped RTL sidebar, clearer tender hierarchy, loading/empty/error states, responsive behavior, focused tests, and checkpoint were already delivered and verified. They are retained as history rather than treated as new implementation work.

## Central operations-center visual verification

The authenticated preview confirms that `/app?section=operations` renders the Arabic `لوحة التشغيل` view and `/app?section=ai-settings` renders `إعدادات الذكاء الاصطناعي` with an explicit `استشاري فقط` badge. The grouped sidebar visibly separates `الإدارة المركزية` from `مركز إعدادات وتشغيل المنصة`, while the trust-boundary panel states that the surface is non-destructive and audited. The public landing shell remains visually intact. TypeScript, 10 central-admin contract tests, the full Vitest suite, and the production build pass; the protected IDOR/concurrency and production encryption gates remain environment-dependent and intentionally unclaimed.

The mobile verification at 390×844 also passed for `operations`, `ai-settings`, and `backup`: the compact header exposes the navigation trigger, headings remain readable in RTL, the operational-state panel stacks without clipping, and the trust boundary remains visible. The AI route continues to display `استشاري فقط`.
