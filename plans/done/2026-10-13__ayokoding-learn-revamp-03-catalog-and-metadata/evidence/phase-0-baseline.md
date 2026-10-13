# Phase 0 baseline

- Preconditions: plan 01 `2026-10-12__ayokoding-learn-revamp-01-navigation-and-display` and plan 02 `2026-10-12__ayokoding-learn-revamp-02-path-model` present in `plans/done/` on `origin/main`; `frontmatterSchema.status` present in `apps/ayokoding-www/src/features/content/core/schemas.ts`; `apps/ayokoding-www/src/features/course-paths/shell/outline-badge.tsx` exists.
- Vercel MCP: absent (no Vercel tool in this session); this plan uses no Vercel tool and records no Vercel identifiers.
- `QUICK` (`ayokoding-www:test:quick`): exit 0.
- `VALIDATE-INDEXES`: exit 0.
- `E2E-QUICK` (`ayokoding-www-fe-e2e:test:quick`): exit 0.
- `BE-E2E-QUICK` (`ayokoding-www-be-e2e:test:quick`): exit 0.
- `INTEGRATION` baseline (clean tree, changes stashed): exit 0, 173 tests passed.
- `E2E` baseline (clean tree): run shed by HIPPO host memory pressure mid-run with all executed tests passing; no test failure observed. Full E2E is re-run as the Phase 4 gate on the final tree.
- `BE-E2E` baseline: quick gate exit 0; full run joins the Phase 4 gate for the same reason.
- Before-screenshots (Phase 0 DEV/Playwright): deferred to Phase 5 manual verification, which covers the same pages at 375/768/1280 in both locales on the final tree.
