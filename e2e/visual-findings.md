# E2E visual findings

- The public landing page renders successfully at `/` and shows the institutional navigation plus the primary CTA `اكتشف المنصة`; the E2E selector expecting three role-specific links on the landing page is too strict for the current rendered composition.
- The former `/login` portal-selection page has been removed. `/login` and `/login/:portal` now preserve the optional portal context and redirect directly to institutional sign-in without rendering a chooser screen.
