# Phase 0 Baseline — Plan 10 Legacy-Unique Migration (2026-10-20)

Worktree `worktrees/ayokoding-learn-revamp-10-legacy-unique-migration/`, branch
`ayokoding-learn-revamp-10-legacy-unique-migration` (promotion `32ec44423`, #722).
No product change yet: only `<plan>/` evidence + one e2e helper hardening (see below).

## Corpus counts

- Legacy corpus: 1150 `.md` files under `learn/legacy/` (matches authoring).
- Course count: 182 `_index.md` with `category:` (matches tech-docs/004 Before column).
- Mapping re-validation: 105/105 rows verified (104 file/dir counts exact + 65-nav-shell
  row consistent with disposition Obsolete 4 rows / 113 files). Zero slug collisions
  (48 new slugs vs 182 existing). Details: `phase-0-mapping.md`.
- Mapping guard note: 6 legacy paths in the table are single `.md` files, not
  directories; each counts as 1 and matches its claimed Files value.

## Outline baseline: 62, not 0 (recorded order deviation, not a blocker)

The checklist acceptance assumed plans 06–09 merged first (0 outlines). The user's
standing order runs plan 10 before 06–09, so 62 `status: outline` skeletons still exist:
30 `erp-systems`, 24 `accounting`, 8 others — all inside unexecuted plans 06–09 scope,
none inside this plan's 48. Plans 06–09 fill them later; proceeding does not depend on it.

## Green baseline (all exit 0, before any course change)

- `QUICK` CLI (`nx run ayokoding-cli:test:quick`): exit 0 — lint, typecheck, unit,
  coverage all green (16 test packages, 289 test funcs statically).
- `QUICK` WWW (`nx run ayokoding-www:test:quick --skip-nx-cache`): exit 0 — typecheck,
  lint, unit 247 files / 4177 tests passed, coverage Stmts 98.6 / Branch 91.46 /
  Funcs 99.22 / Lines 99.54.
- `E2E-QUICK` (`ayokoding-www-fe-e2e:test:quick`): exit 0.
- `BE-E2E-QUICK` (`ayokoding-www-be-e2e:test:quick`): exit 0.
- `INTEGRATION` (`ayokoding-www:test:integration`): exit 0 — 13 files / 192 tests passed.
- `E2E` (`ayokoding-www-fe-e2e:test:e2e`): exit 0 on rerun — FE junit 1236 tests,
  0 failed, 4 skipped. First run: 1231 passed + 1 Firefox-only timeout in
  `complete-course.ts` (load flake, root-caused in `phase-0-e2e-failure.md`); helper
  hardened to click-and-verify, typecheck + lint clean, affected spec 6/6 on all
  3 browsers before the full rerun.
- `BE-E2E` (`ayokoding-www-be-e2e:test:e2e`): exit 0 — junit 37 tests, 0 failed.
- `VALIDATE-INDEXES` (`ayokoding-www:validate-indexes`): exit 0.
- `CLI-BUILD` (`ayokoding-cli:build`): exit 0.
- `EX-COVERAGE` (`examples coverage`): exit 0 — **0 of 0 applicable courses covered**.
  The checklist parenthetical ("the 182 pre-existing courses are covered") is a stale
  authoring-time assumption (plan written 2026-10-09, before plan 05 built the CLI):
  the as-built CLI only covers opted-in courses (a `run.yaml` anywhere under the
  course), and zero courses opt in yet. With `--include-inert`: 182 courses listed,
  126 applicable, 0 covered. This 0 is the honest baseline; coverage grows as this
  plan's courses opt in.

## DEV catalog check

`DEV` served `http://localhost:3101/en/learn/courses` (HTTP 200): "182 courses in
14 categories"; sidebar per-category counts exactly the tech-docs/004 Before column
(11/16/13/18/11/7/8/9/9/15/6/5/24/30); 182 distinct `/en/learn/courses/<slug>` card
links in the served HTML. `next-env.d.ts` restored afterwards; DEV stopped.
No PNG screenshot: this execution environment has no browser-screenshot tool, so the
`phase-0-before-catalog-en-1280px.png` artifact is replaced by the HTTP verification
above plus the green `course-catalog` E2E scenarios.

## Probes

- Vercel MCP: `absent` — no Vercel tool exists in this session; this plan uses no Vercel
  tool (it adds no `app` deploy surface). No Vercel identifiers recorded.
- `api-gate: not applicable` — this plan adds Markdown content and test files only; no
  tRPC procedure or payload shape changes. (`apps/ayokoding-www/src/server` is an empty
  tree on `origin/main`, and tech-docs/010 names no file under it.)
