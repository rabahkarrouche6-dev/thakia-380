# English UI Visual Audit

- Home page direction, navigation, time and statistics render in LTR with English localisation.
- The brand name remains in Arabic by design, while supporting public-facing copy is translated.
- The cinematic lifecycle scene and supplier journey illustration still contain Arabic labels and require additional dictionary coverage.
- Desktop English hero, cards and footer remain legible without clipping.
- Mobile home page retained a compact LTR hero without clipped statistics or actions.
- Login-page headings, actions, portal descriptions and support guidance were added to the English copy set after the first visual audit.
- The login page now renders its visible mobile copy in English and retains a usable LTR layout.
- The preview route used during testing resolved to the existing English 404 page; the plans page exposed additional Arabic header and neutral-plan language, which was queued for translation.
- Confirmed public routes: home, status, pricing, login, registration, public portal and preview. Authenticated workspaces remain behind the `/app` route and inherit the global locale provider and translation bridge.
- English supplier portal and preview were structurally LTR but retained a small set of Arabic portal labels, sign-in actions and sample-status strings. These visible labels were identified for dictionary coverage.
- Mobile supplier portal now renders its principal content in English. The status page remains structurally LTR but exposed its Arabic explanatory paragraph and subsystem labels for a final dictionary pass.
- Desktop recheck confirmed a legible LTR home page and sign-in journey, but exposed residual Arabic plan labels, feature bullets, status descriptions, subsystem names, date phrasing, and selected portal benefit rows.
- The `/portals` path is not registered; public-portal verification must use the existing registered route rather than treating that 404 view as a translation defect.
- Final desktop recheck confirmed that the English home page and pricing page are legible in LTR. The attempted `/portal-registration` route resolved to the existing English 404 state, so it must not be used as a registration-translation check.
- The registered paths `/register/supplier?lang=en` and `/preview/supplier?lang=en` both render English-only content with a coherent LTR desktop layout; the registration call to action, onboarding steps, preview board and status labels were visually verified.
- Mobile verification for the same registered paths confirmed readable English copy, LTR control placement, visible calls to action and no clipped registration or preview content at a 375px viewport.
- The published URL `/app?lang=en` was extracted after deployment and returned the English protected-state copy: “Sign-in required” and “This area is protected and reserved for registered platform users.” The published authenticated workspace could not be opened because no signed-in session was available; its English sidebar and onboarding were instead covered by the development preview and contract tests.

## Central Administration sidebar — 18 August 2026

| Section | Verified English route | Result |
|---|---|---|
| Dashboard | `/app?section=dashboard&lang=en` | The overview loads and the Dashboard item is active. |
| Contracting authorities | `/app?section=authorities&lang=en` | The governed-registry readiness state loads and the matching item is active. |
| Economic operators | `/app?section=operators&lang=en` | The governed-registry readiness state loads and the matching item is active. |
| Central tenders | `/app?section=tenders&lang=en` | The read-only tender monitoring view loads and the matching item is active. |
| Oversight & alerts | `/app?section=oversight&lang=en` | The audit-log view loads and the matching item is active. |
| AI data analysis | `/app?section=ai-analysis&lang=en` | The advisory radar view loads and the matching item is active. |

The final English visual check confirmed that `section` selects the requested workspace, `lang=en` preserves LTR rendering, and a language query does not break the active sidebar state. Sections without a verified data-source contract show an explicit readiness state rather than invented records.
