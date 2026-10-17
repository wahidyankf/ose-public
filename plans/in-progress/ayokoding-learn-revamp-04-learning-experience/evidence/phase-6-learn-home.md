# Phase 6 — Learn Home, Reset, and the Overview Redirect

Date: 2026-10-14. Execution branch `ayokoding-learn-revamp-04-learning-experience`.

## Files

- `src/features/learning-progress/shell/{learn-home,continue-learning-card,reset-progress-control}.tsx`
  and `src/features/course-paths/shell/{learn-path-card,path-card-progress}.tsx`.
- `src/redirects/learn-home.ts` (spread in `next.config.ts` after `courseRehomeRedirects`, before
  `learnThreeBucketRedirects`); `content/en/learn/overview.md` deleted; `content/en/learn/_index.md`
  gained the `description`.
- `src/app/[locale]/(content)/[...slug]/page.tsx`: skips the `learn` slug in `generateStaticParams` and
  renders `LearnHome` for `locale === "en"` and slug `learn`.
- Translations for the home keys in both locales.
- Tests: `tests/unit/redirects/learn-home.unit.test.ts`; `tests/unit/features/learning-progress/{sequence-payload-size.corpus.unit.test.ts,continue-learning-card.test.tsx,reset-progress-control.test.tsx,learn-home.test.tsx}`;
  `tests/unit/features/course-paths/shell/{route-data-shape.unit.test.ts,learn-path-card.test.tsx,path-card-progress.test.tsx}`;
  `tests/unit/fe-steps/learn-home.steps.tsx` + S6/S7 in `progress-store.steps.tsx`;
  `apps/ayokoding-www-fe-e2e/tests/e2e/steps/learn-home.steps.ts` + S6/S7 in `progress-store.steps.ts`.
- **U6:** every real-route opener of `/en/learn/overview` repointed to
  `/en/learn/courses/backend-essentials/overview` (the tech-docs/008 ledger: `content-rendering`,
  `resizable-sidebar` (`DOCS_PAGE`), `common`, `static-delivery` (both), `responsive`, the unit
  `static-delivery.steps.tsx`, and the integration `static-delivery.steps.ts`). Synthetic mock slugs
  were left unchanged.
- **U1:** the sidebar-order bindings rewritten in `tests/unit/fe-steps/navigation.steps.tsx` and
  `apps/ayokoding-www-fe-e2e/tests/e2e/steps/navigation.steps.ts` for the new scenario.
- **U2:** the two example rows in `i18n/locale-redirects.feature` now use `/EN/learn/courses` and
  `/ID/learn/courses`.

## Gates

- Unit gate (`--maxWorkers=1`): `Test Files 239 passed (239)`, `Tests 4109 passed (4109)`, coverage
  `All files … Lines 99.54` ≥ 99%. (Three earlier attempts were pressure-shed by HIPPO; the fourth and
  fifth completed.)
- `GEN-INDEXES` / `VALIDATE-INDEXES`: exit 0; the regenerated `_index.md` body no longer lists Overview.
- `typecheck` (ayokoding-www and ayokoding-www-fe-e2e), `lint`, and `bddgen` exit 0.
- Flow-scoped `E2E` (learn-home + progress-store + navigation, Chromium/Firefox/WebKit, `--workers=1`):
  **`282 passed`**, 0 failed.

### HTTP checks (`rtk curl` recipes, against the production standalone server)

```
--- /en/learn/overview ---
308 http://localhost:3101/en/learn
--- /en/learn ---
200
--- /en/learn/overview-does-not-exist ---
404
--- /id/learn ---
404
```

Matches the expected `308 → /en/learn`, `200`, and `404`; `/id/learn` stays `404`, unchanged from
Phase 0.

### Fixes found while getting the E2E green

- S30's card assertion used a trailing `\b` after "done", but the card's text concatenates into
  "doneView path →" (no word boundary); simplified.
- S7 compared the whole stored record byte-for-byte, which races with best-effort visit metadata
  (`lastCourse`/`lastPath`); narrowed to the recorded `completed` map — the part the scenario is about.

### Note

The plan text's `rtk curl` recipes against `nx dev` could not be used (the `nx dev` server stops
responding under host memory pressure); the same three recipes were run against the production
standalone server the E2E suite uses, which is the stronger proof.
