# Matching Adversarial Review — Evidence Notes

## Scope and architecture

The attached specification assumes Django Templates, PostgreSQL, Django Sessions, and Python services. The actual project inspected is React/Vite + Express/tRPC 11 + Drizzle/MySQL/TiDB. The matching implementation is `server/tenderMatching.ts`, with a client-side consumption path in `SupplierWorkspace.tsx` and a server procedure in `server/routers.ts`.

## Direct observations from `server/tenderMatching.ts`

- `rankTendersForSupplier(profile, tenders, now)` accepts an arbitrary array of Tender records and does not itself generate candidates from the database.
- It labels every input tender whose status is not `published`, or whose deadline is not in the future, as `not_eligible`; therefore the pure function returns non-published/expired rows in its result array, rather than excluding them. The UI or router must filter these rows before display.
- The eligibility gate is limited to deadline and status. It has no explicit policy-backed checks for supplier blacklist, category hard mismatch, geography exclusivity, qualification, mandatory documents, or document expiry.
- The category signal uses `Profile.organizationName` as if it were an activity/category field. The schema inspected has `organizationName`, `registrationNumber`, `phone`, `address`, and `completion`; no structured activity/category field was observed.
- The score uses four factors with hard-coded weights 0.45, 0.35, 0.10, and 0.10. The implementation normalizes by `Math.max(0.45, availableWeight)` rather than a Decimal-based validated weight dictionary. Missing profile data can therefore alter the effective score denominator and produce a score based on partial data.
- Semantic matching is keyword overlap from organization name against tender title/description/category. It is not TF-IDF, embeddings, or an external model.
- Geography is an unstructured token overlap between profile address and tender location; it does not implement `covered_wilayas` or an exclusive geographic rule.
- The output contains tender id, reference, title, label, score, reasons, gaps, recommended action, and factor names/scores. It does not include document contents or competitor bid data.
- Sorting is only `right.matchScore - left.matchScore`; ties have no explicit deterministic secondary key.
- The function does not implement persistence/cache, algorithm version, refresh expiry, or performance metrics.

## Schema observations

The actual schema contains `profiles` with organizationName, registrationNumber, phone, address, completion; `tenders` with authorityId, reference, title, description, category, location, deadline, status, publishedAt and closedAt; and documents/bids. There is no observed SupplierMatchingProfile or TenderMatchCache model.

## Test observations

`server/tenderMatching.test.ts` covers a published tender with a profile, a closed tender, missing profile data, sensitive output string checks, and a basic score/reason contract. The visible tests do not, by themselves, prove database candidate generation, router-level supplier isolation, direct supplier_id rejection, N+1 behavior, cache freshness, cancelled tender handling, deterministic tie ordering, weight-sum validation, or migration rollback.

## Initial risk hypotheses requiring router/UI inspection

1. Whether the router queries only published and non-expired tenders or passes all rows to the pure ranker.
2. Whether the router derives supplier context exclusively from `ctx.user` and exposes no client-controlled supplier identifier.
3. Whether the UI filters out `not_eligible` outputs before rendering.
4. Whether logs include recommendation payloads or sensitive profile/document data.
5. Whether the current implementation has any cache or external service path.
