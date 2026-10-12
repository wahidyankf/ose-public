# Evidence — Phase 5: Plain Path Page Copy

## Gherkin first (BEHAVIOUR RED)

Created `specs/apps/ayokoding/www/behaviours/frontend/course-paths/path-copy.feature`
with both prd.md scenarios, exemption comments, and `@integration-exempt`/`@e2e-exempt`
tags in the `core-closure.feature` format.

`BEHAVIOUR` (hippo): exit 1, naming only the two new scenarios as missing unit
bindings (6 undefined step bindings across the two scenarios).

## RED — `path-copy.unit.test.ts` (UNIT-NODE, hippo)

Created `apps/ayokoding-www/tests/unit/features/course-paths/content/path-copy.unit.test.ts`:
hub page plus every `.md` under `content/en/learn/paths/careers/` scanned
case-insensitively for `dangerous`, `oi-2`, `append`, `manifest`, `from.scratch`;
AI page description and AI manifest description must contain
"for developers who already code".

Result: 2 failed. Offending pages listed by the failure output:

- `content/en/learn/paths/_index.md` (`/manifest/i`)
- `content/en/learn/paths/careers/interview-ready/_index.md` (`/manifest/i`)
- `content/en/learn/paths/careers/immediately-effective/_index.md` (`/manifest/i`)
- `content/en/learn/paths/careers/fundamentally-strong/_index.md` (`/manifest/i`)
- `content/en/learn/paths/careers/immediately-effective/ai-engineer/_index.md`
  (`/from.scratch/i`, plus its description lacked "for developers who already code")

Bound both scenarios in `apps/ayokoding-www/tests/unit/fe-steps/path-copy.steps.ts`
(same readers as the unit test, committed files only, no fixtures).

## GREEN — copy applied

Applied every description and body in tech-docs/006 to the 8 listed `_index.md`
files; frontmatter keys other than `description` unchanged; skills, fixture, and
`careers/_index.md` pages untouched; "Proposed for Plans 06 and 07" not applied.
Each of the 4 career path page descriptions equals its manifest description verbatim.

- `UNIT-NODE path-copy.unit.test.ts` (hippo): 2 passed.
- `UNIT-FE fe-steps/path-copy.steps.ts` (hippo): 6 passed.

AI manifest note: `manifests/careers/immediately-effective/ai-engineer.json`
already read "For developers who already code: …" (Phase 3 output), so no
manifest edit was needed; the page description was brought to the same phrase.

## REFACTOR

- Read each changed page once: short plain sentences, no internal plan names
  ("Phase 1 prioritizes …" gone from the Interview-Ready body; "manifest ships"
  and "from-scratch" gone from every description).
- Forbidden-word rescan over the hub plus `paths/careers/`: CLEAN.
- `rtk git diff --stat origin/main -- apps/ayokoding-www/content/en/learn/paths`
  lists exactly the 8 pages (hub + 3 arcs + 4 career paths), 20 insertions,
  20 deletions.
- `VALIDATE-INDEXES` (hippo): exit 0, no drift (no `GEN-INDEXES` output kept).
- `QUICK` (hippo): exit 0.
- `BEHAVIOUR` (hippo, `--skip-nx-cache` fresh run): exit 0
  (53 features, 423 expanded scenarios).

## E2E gate (direct, per prescription — not a substitution)

- Fresh build without hippo
  (`AYOKODING_WEB_MANIFESTS_DIR="$PWD/fixtures/manifests"`
  `AYOKODING_WEB_SHOW_DRAFTS=true nx run ayokoding-www:build --skip-nx-cache`):
  exit 0.
- `npx bddgen && npx playwright test`, sequential per browser, all exit 0:
  chromium 354 passed; firefox 351 passed + 2 skipped;
  webkit 351 passed + 2 skipped.
  Fixture pages unchanged, so `skills-path-landing-body.feature` still passes.
