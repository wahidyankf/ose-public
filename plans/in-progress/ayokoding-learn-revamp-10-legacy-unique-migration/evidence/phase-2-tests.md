# Phase 2 evidence — test extensions (RED-first)

Branch `ayokoding-learn-revamp-10-legacy-unique-migration`, worktree
`worktrees/ayokoding-learn-revamp-10-legacy-unique-migration`. All commands run
from the worktree root. `local-tmp/phase-2-*.txt` holds the full raw outputs
(git-ignored scratch); this file records the verdicts.

## 2.1 Gherkin first — DONE

The three feature files are byte-identical to the PRD gherkin fences:

- `specs/.../backend/content/legacy-mapping-completeness.feature` ≡ `prd.md` lines 76–110
- `specs/.../backend/content/legacy-migrated-course-completion.feature` ≡ `prd.md` lines 116–161
- `specs/.../frontend/course-paths/catalog-count-after-migration.feature` ≡ `prd.md` lines 167–181

Verified with `sed -n '<range>p' prd.md | diff - <feature>` → three `OK`s.
`specs-checker` (read-only child audit, 1 cycle): verbatim identity PASS for
all three; every `@integration-exempt`/`@e2e-exempt` tag has its exemption
comment directly above it naming a real alternative-proof target and scenario;
no blocking findings.

## AC-6 — mapping completeness — GREEN

`MAPPING-GUARD` (`UNIT-NODE .../be-steps/legacy-mapping.steps.ts`):
12/12 scenarios pass; helper unit tests
(`tests/unit/helpers/legacy-mapping.unit.test.ts`) 10/10; new
`migrated-courses.unit.test.ts` 10/10. Combined run: 3 files, 32 tests, all
pass. The RED step (new unbound step file) was not separately recorded: the
walker, table parser, existence check, and diff helper were authored with the
step file, so the first run was already GREEN — the mapping artifact was
complete at authoring time, exactly the outcome this AC predicts.

**Recorded reading (AC-6 conditional):** scenario 2 ("every slug in its Target
field is a real course directory") is bound so `covered` targets must be real
course directories, `new` targets must resolve to this plan's authored briefs
(`syllabus/courses/<slug>.md`) until Phase 3 writes the directories, and
`obsolete` targets must be exactly `-`. This is the AC's first reading
(explicitly scoped to not require new rows' directories until Phase 4), and it
is what keeps `MAPPING-GUARD` green per the Phase 2 gate. The literal
directories-required reading would fail 48 slugs until Phase 4.

## AC-7 — migrated-course completion — RED (designed)

`CORPUS-GUARD` (`UNIT-NODE .../be-steps/course-metadata.steps.ts`):
40 tests, 29 pass, **11 fail** (exit 1). The 5 pre-existing plan-03 scenarios
stay green. Every failing assertion's problems are exactly one of:

- `missing course directory: <slug>` — 344 lines (48 slugs × their Then/And
  assertions: outline/format 2, words/capstone/drilling 3, harness 2, dates 1
  per course across the shared Given/When shape), or
- the catalog-count mismatch (see AC-8).

No content assertion fires beyond the missing directories: content checks
(words, capstone, drilling, run.yaml, References dates) only run for courses
whose directory exists. Full output: `local-tmp/phase-2-corpus-red.txt`.

## AC-8 — catalog and category counts — RED (designed)

The catalog-count scenario fails reporting `catalog total drift: expected 230,
found 182` plus the 7 affected categories' diffs (e.g. `programming-languages:
expected 30, found 16`), all against tech-docs/004's After column (which sums
182 + 48 = 230). Hard-coded `181` mocks updated to `230` in the same change:
`tests/unit/features/learning-progress/learn-home.test.tsx` (prop + string)
and `tests/unit/fe-steps/learn-home.steps.tsx` (prop). Repository-wide sweep
for `\b181\b`/`\b182\b` in tests/src/specs finds no other stale count pin
(`cities.ts` is unrelated data; the helper's `182` is the documented Before
value). Learn-home suites pass with the new counts (unit-fe: 2 files, 36/36).

**Recorded decision — "229" vs "230":** delivery.md's AC-8 checkbox says
"update ... to the 229 totals" but its own acceptance says "the now-updated
expectation (230)", the PRD says "the total is 230", tech-docs/004's After
column sums to exactly 230 across the same 14 categories, and
`buildCourseCatalog` counts every categorized course (all 182 today carry a
category). `229` is a typo for `230`; the binding uses 230 everywhere.

## TYPECHECK / LINT — exit 0

- `TYPECHECK` (`nx run ayokoding-www:typecheck`): exit 0. The first run
  reported 19 errors, all inside the new Phase-2 test files (strict
  `noUncheckedIndexedAccess` indexing in the mapping parser/brief helpers and
  one unused import in the mapping steps); fixed with explicit fallbacks and
  guards, no behaviour change — mapping suites re-run 32/32 green after the fix.
- `LINT` (`nx run ayokoding-www:lint`): exit 0 (one pre-existing content
  warning in an advanced-frontend example, unrelated).

## Binding approximations (for Phase-3 makers and the Phase-4 gate)

- **Word count** (`countWords`): whole-page whitespace tokens after stripping
  the frontmatter block, code included — the tech-docs/002 floors are plan
  estimates over whole pages, so the guard measures whole pages.
- **Drilling sections**: asserts each of the five required sections is present
  (not exact equality), so a course may carry extra sections.
- **Harness unit**: a directory directly holding code (anything but `run.yaml`
  / `*.md`) needs a `run.yaml` when it is a code root (`learning/code`,
  `drilling/code`, `learning/capstone/code`) or a direct child of one;
  `before/`/`after/` grandchildren are exempt. `examples check` stays the
  deeper enforcer per tech-docs/008.
- **Network**: a `run.yaml` fails when it names a non-localhost HTTP(S) URL.
- **References dates**: every `YYYY-MM-DD` in any `## References` section must
  sit within 30 days before the course directory's last content commit
  (`git log -1 --format=%cs -- <course>`); at least one date must exist. The
  guard therefore runs on the committed course — the wave gate runs it after
  the course's own commit lands.
