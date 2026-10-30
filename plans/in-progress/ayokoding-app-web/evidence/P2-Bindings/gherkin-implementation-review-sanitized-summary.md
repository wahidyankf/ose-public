# Gherkin Implementation Review — Sanitized Summary (full, final re-verification)

- Scope: `full`, owners `ayokoding-web` (+ `ayokoding-web-e2e`). `ayokoding-data` excluded: no changes
  under `libs/ayokoding-data` or `specs/libs/ayokoding-data` (prior 2 PASS / 3 PARTIAL / 1 FAIL carried).
- Corpus: `specs/apps/ayokoding/web/behaviours`, 10 features, 81 expanded scenarios (two new: legacy
  archived page, legacy deep-course redirect). All four static coverage gates exit 0 at 81.
- Matrix: 243 rows = 81 unit + 81 integration + 81 e2e. Result: **155 PASS / 56 PARTIAL / 22 FAIL /
  10 EXEMPT (valid)**. Final status: **FAIL**.

## What changed since the prior full-final report

- Godog tools adapter rewritten to shared-data vectors (`apps/ayokoding-web/tests/internal/glue/steps_tools.go`;
  `engines.go` deleted; `world.go` fake fields removed; `tests/fixtures/*.json` re-keyed to the
  current codec). Production handler rewired to embedded shared datasets (`internal/web/seed.go`,
  `internal/web/server.go` fragment handlers, templates). Result: B1, T1, B5, T4 graduate PARTIAL→PASS
  on unit and integration (8 rows).
- E2E tools adapter (`apps/ayokoding-web-e2e/tests/e2e/steps/tools.steps.ts`) was NOT updated: it still
  drives retired fake-engine URLs and figures, which current production answers with
  `data-invalid-filters`. Result: all 10 tools E2E rows FAIL (8 were PASS, 2 were PARTIAL).
- E2E back-navigation fixed (`routes.steps.ts` now uses a real `page.goBack()`): R6 E2E FAIL→PASS.
  Godog R6 stays FAIL (simulated history + re-GET).
- E2E locale-switch (H2) and search-result-choice (S4 first Then) now assert the real navigation
  outcome: H2 E2E PARTIAL→PASS; S4 E2E stays PARTIAL on a narrower cause (dialog-closes Then reads
  step memory).
- New R7/R8 rows: PASS on all three adapters (legacy page served; deep URL 308s to the canonical sub-page).
- Formatting/static checks on the current tree are clean (`gofmt` clean, `go vet` exit 0).

## Unresolved FAIL rows (22)

C10 unit + integration (viewport overflow unobserved); L6 unit, L7 unit (self-certifying port /
vacuous no-rewrite proof); R6 unit + integration (back navigation simulated); H4a–c unit +
integration (6 rows, viewport never measured); tools E2E B1, B2, B3, B4, B5, T1, T2, T3, T4, T5
(10 rows, stale adapter vs current-codec production). Full per-row locations and red-capability
statements are in the ledger report
(`local-tmp/plan/ayokoding-app-web/P2-Bindings/gherkin-implementation-review__full-final-2026-10-30.md`).

## Runtime proof (current tree)

- Static coverage gates: unit, integration, e2e, e2e-owner — all 81 scenarios, exit 0.
- `go test ./internal/web/ ./internal/tools/shareddata/` — pass (current-codec page + fragment tests,
  embedded==canonical drift test).
- `go test ./tests/bdd/` — 80/81 scenarios pass; the single failure is L6 binding port 3191, occupied
  by a pre-existing listener (environmental, left untouched).
- No new integration or E2E suite launched (reviewer shell constraint). Prior E2E full-run evidence
  predates the current-codec production edits and is stale.
- 10 integration exemptions (browser-progress) remain valid: genuine boundary mismatch with passing
  alternative proof.
