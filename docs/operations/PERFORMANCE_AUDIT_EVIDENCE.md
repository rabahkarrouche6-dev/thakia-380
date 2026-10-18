# Performance Audit Evidence

## Scope and stack
The inspected project is not Django/DRF. It is a React 19/Vite frontend with an Express/tRPC server and Drizzle ORM over MySQL/TiDB. Therefore Django-specific findings cannot be asserted from this codebase.

## Observed query patterns
- `server/db.ts` contains unpaginated list queries for operator documents, declarations, tenders, bids, tender documents, bid documents, and audit logs.
- Repeated patterns include `select().from(...).where(...).orderBy(...)` without `limit`/`offset` for several list helpers.
- `getPublicTenders` filters `status = published` and `deadline > now`, then orders by `publishedAt`.
- `getTendersByAuthority` filters only by `authorityId` and orders by `createdAt`.
- `getBidsByTender` filters only by `tenderId` and orders by `createdAt`.
- `getBidsBySupplier` filters only by `supplierId` and orders by `createdAt`.
- `getTenderDocuments` and `getBidDocuments` filter by parent ID and order by `createdAt`.
- `getAuditLogs` orders by `createdAt` and applies a limit.
- Regulator/overview helpers use multiple independent `select()` calls in `Promise.all`, which is parallel I/O but still full-table or broad scans where no filter is present.
- Some single-row fetches correctly use `where(id = ...)` and `limit(1)`.

## Evidence status
The above are code-level findings. Runtime latency, row counts, query plans, and production traffic metrics were not available from the current sandbox evidence. No N+1 pattern or cache defect is asserted yet without measured call traces or query plans.

## Required next measurements
1. Capture representative endpoint timings and DB query timings in a controlled environment.
2. Run `EXPLAIN` for public tender, authority tender, bid-by-tender, document-by-parent, and audit-log list queries against the real schema/data.
3. Inspect actual indexes in the database before recommending composite indexes.
4. Compare bounded versus unbounded list response sizes and latency.
