# Phase 9 — Rule Impact and Docs Propagation

Date: 2026-10-14. Execution branch `ayokoding-learn-revamp-04-learning-experience`.

## Automatic rule-impact coverage — repository `ose-public`

- **Inventory:** `git diff --name-only origin/main...HEAD` lists no path under `repo-governance/`,
  `.agents/`, `.claude/`, `AGENTS.md`, `CLAUDE.md`, `repo-config.yml`, or another declared harness
  directory (`grep` returned `NONE`).
- **Existing-rule check:** `rtk git grep -n "learn/overview" -- repo-governance .agents AGENTS.md`
  returns nothing; `rtk git grep -n -i "progress" -- .agents/skills/apps-ayokoding-www-developing-content`
  returns only unrelated matches ("progressive disclosure", "during execution"). No rule names the
  removed page, the Learn home layout, or browser progress.
- **Classification and status:** **no normative rule surface changes; no binding regeneration** —
  `status: none-required`. The stale `canonical-content-tree-shape.md` claim stays a reported follow-up
  (README Follow-Ups) and is not edited here.

## Docs Propagation

Updated five READMEs (verified against the feature files, not against the brief):

- `apps/ayokoding-www/README.md` — the `learning-progress` feature (`core/` pure modules vs `shell/`
  store/hook/components), browser-only progress with no account, and the Learn-home dispatch
  (`/en/learn` from `page.tsx`, `/en/learn/overview` → 308, deeper addresses still 404).
- `specs/apps/ayokoding/www/behaviours/frontend/README.md` — the `learning-progress/` folder.
- `specs/…/frontend/learning-progress/README.md` — now lists all five feature files with current
  scenario counts (course-landing-progress 2, learn-home 7, learning-progress-accessibility 5,
  lesson-navigation 9, progress-store 9), replacing the stale "three scenarios Phase 3 renders" line.
- `specs/…/frontend/course-paths/README.md` — `path-roadmap.feature` (8 scenarios).
- `apps/ayokoding-www-fe-e2e/fixtures/manifests/README.md` — each fixture's purpose as it now stands,
  including `skills/conventional-accounting.json` (the pending-restructure flat-roadmap fixture).

`grep docs/` for `learn/overview`, `Learn home`, and `Learn overview` returns no stale statement, so no
`docs/` file changed.

## Gate

- `LINT-MD` (`rtk npm run lint:md`): **0 errors**, exit 0 (7711 files linted).
- `QUICK` exit 0 (241 files, 4147 tests, lines 99.54% — the last full run, unchanged by this phase's
  documentation-only edits).
