# Phase 3 Evidence — Course Titles Without Numbers (S4, S9)

> Dry-run counts, apply counts, and the zero-hit search per delivery.md Phase 3 Proof. The
> codemod ran from uncommitted scratch (`local-tmp/ayokoding-learn/plan-01/strip-titles.py`,
> Decision D1) with `python3 -I`.

## RED

- **Unit S9** (`UNIT-NODE tests/unit/be-steps/course-content-hygiene.steps.ts`): exit 1 — "76 of
  181 course frontmatter titles still start with a catalogue number or a pass number" with all 76
  offending slugs listed (including the three `Pass N` capstones), plus 76 course-list page
  titles with a leading number.
- **Unit S4** (`UNIT-FE tests/unit/fe-steps/path-position-numbers.steps.tsx`): exit 1 — 13
  offending surfaces across just-enough-bash, backend-essentials, and sql-essentials (h1 +
  breadcrumb + prev/next + prereq carrying numbered titles); the "Course 2 of 3" readout
  assertion passes (existing behaviour, as the RED acceptance anticipates).
- **E2E** (targeted, both new scenarios): 6 failed — both scenarios fail in all three browsers
  with the numbered-title assertions (e.g. `"66 · Just Enough Elixir"` received against
  `not /^\d+\s*·\s|^Pass \d+ /`).

## GREEN (dry run)

- `strip-titles.py --dry-run`: exit 0 — **291 replacements in 182 files**, exactly the Phase 0
  title inventory's 291 outside-the-index matches (inventory total 443 = 291 outside + 152 inside
  the two generated index files, which are excluded from the strip and regenerated instead).
- Two codemod bugs were caught by the dry run BEFORE any write and fixed: (1) a strip expression
  that deleted the whole title (`'67 · X' -> ''`), (2) a replacement dict keyed on the stripped
  title so the apply wrote unchanged content. Samples verified `'67 · Actor-Model Concurrency' ->
'Actor-Model Concurrency'`.

## GREEN (apply)

- `strip-titles.py` without `--dry-run`: exit 0 — 291 replacements in 182 files written.
- `GEN-INDEXES`: regenerated the learn index; courses are now listed without numbers (0 `NN ·`
  and 0 `Pass N` matches in `content/en/learn/courses/_index.md`).
- `VALIDATE-INDEXES`: exit 0.
- Test literals updated: the old-title literals in
  `apps/ayokoding-www-fe-e2e/tests/e2e/steps/course-paths.steps.ts` (9 lines) and the comment in
  `apps/ayokoding-www-fe-e2e/tests/e2e/steps/resizable-sidebar.steps.ts` (1 line).
- Zero-hit closed-list search: (recorded below after the final verification run).
