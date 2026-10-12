# Phase 7 Evidence — Rules and Docs

## Rules

Owner: rules-maker (rules half). Placement record:
`local-tmp/ayokoding-learn/plan-02/rules-placement.md` (uncommitted).

- Inventory: PM1–PM3 frozen with reason, strength MUST, scope
  (`apps/ayokoding-www/content/en/learn/courses/**`,
  `apps/ayokoding-www/src/features/course-paths/manifests/**`), intended enforcement;
  revision `3a55b8d97`; worktree clean at freeze; stale example identified.
- Falsifiability: PM1/PM2 falsifiable with recorded violating/conforming pairs; PM3 ruled
  unfalsifiable by design (rubric judgement needs a human reading intent) with reason.
- Existing-rule check: searched `repo-governance/`, `.agents/`, `AGENTS.md` by term/verb/
  surface — no existing rule carries PM1–PM3; plan 01 R1–R3 adjacent but disjoint.
- Conflict: none vs the syllabus convention or plan 01 R1–R3; no 001 routing, no supersession.
- Placement: proposed home confirmed —
  `.agents/skills/apps-ayokoding-www-developing-content/reference/course-status-and-path-model.md`;
  no eviction.
- Canonical edits: new module (PM1/PM2 MUST + enforcement lines; PM3 MUST rubric duty,
  unenforced by decision with reason); linked from `SKILL.md` + `reference/README.md`;
  trigger example narrow-edited to "rewrites the manifest's `phases` entries". Word budgets
  held (module 369 words; SKILL.md 532; budget target 650 / fail 750).
- Enforcement, proven both ways (raw outputs in `evidence/scratch/`):
  - PM1 break (`pm1-break.md`): removed `status: outline` from `accounting-foundations` →
    `course-frontmatter.unit.test.ts` exit 1, 1 failed / 1 passed, names the slug.
  - PM1 restore (`pm1-restore.md`): exit 0, 2 passed.
  - PM2 break (`pm2-break.md`): removed `version-control-and-git` from the AI manifest's
    `assumes` → `path-model-integrity.unit.test.ts` exit 1, 1 failed / 7 passed, closure
    violation `cicd-and-release-engineering` missing `version-control-and-git`.
  - PM2 restore (`pm2-restore.md`): exit 0, 8 passed.
  - Temp edits restored byte-identical. PM1 → `gated`; PM2 → `gated`;
    PM3 → `unenforced by decision`.
- Bindings: `rhino harness adapters generate` exit 0 (10 mirror catalog/provenance files
  regenerated); `adapters validate` exit 0.
- Verification: `LINT-MD` exit 0 (7,935 files, 0 errors); `QUICK` exit 0; rule text read
  once for closure; `git status` fully reconciled.
- Rules Quality Gate: `PASS` (2 cycles, 0 open blocking);
  ledger `local-tmp/quality/rules/course-status-and-path-model__20261012T0645Z.md`.
- Propagation `status`: `landed`. Delivery.md Phase 7 rule checkboxes left unticked.

## Docs

Owner: docs-fixer + readme-fixer (docs half). Docs-propagation for the branch change
(`origin/main..HEAD`, phases 0–6: phase schema, migrated manifests, integrity tests, phase UI,
plain-language copy, contracted schema).

- `apps/ayokoding-www/src/features/course-paths/manifests/README.md`: rewritten (257 words,
  apps README budget target 900 / fail 1000). Documents `phases` (id/title/kind/courses,
  core `outcome`), `goals` (capstone IDs feeding `computeCore`), `assumes` (closure rule),
  temporary `restructurePendingIn` (allowlist-only; plan 06 removes accounting entries, plan 07
  ERP entries + the module), derived `courseOrder`, and the three integrity test files.
  Fixed stale `<path-id>.yaml` → `.json`; dropped the obsolete plan-02-authorship paragraph.
- `apps/ayokoding-www-fe-e2e/fixtures/manifests/README.md`: added "Fixture shape" (261 words)
  — phase shape, `assumes`, derived `courseOrder`, fixture core outcome. Kept the usage and
  coverage sections untouched.
- `specs/apps/ayokoding/www/behaviours/frontend/course-paths/README.md`: added the five new
  feature files in alpha order with one-line annotations (312 words; `specs/` is outside every
  word-budget surface): `core-closure`, `outline-course-status`, `path-assumes`, `path-copy`,
  `path-phases`. Verified each `Feature:` header matches its annotation.
- Stale-statement sweep: `git grep "courseOrder"` and `"first three"` over `docs/` and
  `apps/ayokoding-www/README.md` → no hits; broader `manifest|learning path` hits are legacy
  content links and cargo `--manifest-path` usage, none normative about this plan. No doc
  changed, none deleted.
- `QUICK` skipped: only READMEs changed, no code-adjacent files touched.
- Verification: `LINT-MD` exit 0 (7,936 files, 0 errors), first run, no repairs.
- Docs-propagation `status`: `landed`. Delivery.md Phase 7 docs checkbox left unticked.
