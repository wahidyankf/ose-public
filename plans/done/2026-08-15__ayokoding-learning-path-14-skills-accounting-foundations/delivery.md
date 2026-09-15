# Delivery Checklist — Skills Paths: Accounting Foundations & Transactional Cycles

> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`). `[HUMAN]`:
> only a human can do it (physical action, out-of-band approval, real-secret or privileged-credential
> handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.
>
> **Phase Gate** — every phase ends with a `### Phase N Gate`: a must-pass verification checklist plus
> a **Pause Safety** note. A phase is **not complete until its gate is green**; do not start phase N+1
> while any check in phase N's gate is failing.

## One-PR delivery contract (binding, 2026-08-01)

This 11-course plan is one inseparable delivery unit: every Phase 1–8 change lands in **one
worktree, one branch, and exactly one draft PR**. Courses may still be authored, checked, and
committed in their dependency order, but no intermediate phase may push, open a PR, run the PR
merge, deploy, or record a merge SHA. Only Phase 8 opens the draft PR, after all
course work, verification, and Knowledge Capture are green; it includes the archival move to
`plans/done/`, then runs the secret scan, local quality checks, and PR quality-gate verification, CI verification, ready-for-review
transition, and the normal `[AI]` merge/deploy protocol. No earlier stage or delivery boundary opens
a PR.

The `worktrees/ayokoding-learning-path-14-skills-accounting-foundations/` path below is this
plan's only worktree; no per-course, stage, phase, or closeout worktree is created.

## Worktree

Worktree path: `worktrees/ayokoding-learning-path-14-skills-accounting-foundations/`

Provision this path exactly once with `claude --worktree ayokoding-learning-path-14-skills-accounting-foundations` (or `git worktree add -b worktree/ayokoding-learning-path-14-skills-accounting-foundations worktrees/ayokoding-learning-path-14-skills-accounting-foundations origin/main` when provisioning manually). Both forms designate the same one worktree; never create a second path for a phase, course, or closeout.

Final-delivery branch: `ayokoding-learning-path-14-skills-accounting-foundations/final-delivery`

This path is the one and only worktree for the entire plan. Provision it once from current
`origin/main`, create the persistent `final-delivery` branch after Phase 0, and use neither
per-course/cohort/stage worktrees nor per-phase branches. Remove it only after the final PR merges.

> **Worktree Cap conformance note (added when the rule landed):** this plan already declared a
> single, plan-wide worktree before the
> [Worktree Cap](../../../repo-governance/conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule)
> and
> [Per-Repository Delivery Mode Restrictions](../../../repo-governance/conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule)
> rules landed. Reviewed against both — already compliant, no change required.

## Delivery Mode: worktree-to-pr

**CI scope note**: "CI green"/"CI gates" below mean the PR's own check run
(`pr-quality-gate.yml`) — never `.github/workflows/main-ci.yml`, which is deprecated,
schedule-only, and must not be monitored or gated on.

This plan has one delivery unit: all change-producing work is committed on the persistent
`final-delivery` branch in the declared worktree. Phases before 8 must not push, open
a PR, start an external merge, deploy, or record an in-repository merge SHA. Phase 8 first
commits the archival move and index updates, then opens the sole draft PR, runs the secret scan, local quality checks, and PR quality-gate verification plus local and CI gates, marks it ready, merges under the hardened
preconditions, and deploys once.

## Content-only delivery safeguards

This plan produces content only and has exactly one final PR. It has no review-cycle requirement. Before pushing that PR:

- [x] [AI] Inspect the staged diff and confirm it contains no machine-secret value.
- [x] [AI] Use a scoped Conventional Commit (for example, `docs(plans): refresh course-preparation backlog`).
- [x] [AI] Run `apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push`; acceptance: exits 0 for the affected scope.
- [x] [AI] Push the single branch, then wait for `.github/workflows/pr-quality-gate.yml`; acceptance: the PR quality gate is green before merge.

## Depends-on

| Relation      | Plan (full folder name)                          | Nature                                                                                                                                                                                                                         |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **blockedBy** | `ayokoding-learning-path-13-careers-ai-manifest` | **Hard; sole direct execution prerequisite.** It must be fully merged and archived on `origin/main` before Phase 0. All earlier completion and repository-baseline facts are transitive context, not extra plan prerequisites. |

**Phase 0 start check:** `git ls-tree -r --name-only origin/main plans/done | rg -q "__ayokoding-learning-path-13-careers-ai-manifest/README\.md$"` exits 0. This is this plan's only plan-level start gate.

## Parallelization Model

Courses with no prerequisite edge between them author in parallel up to the concurrency cap;
courses with an edge serialize. Within this plan's own range: courses #6, #8, and #9 share
prerequisite #4/#3/#2 only and can author in parallel with each other once their shared prerequisite
merges; #7 waits on both #4 and #5; #10 waits on #8; #11 waits on #9. Both manifests' TDD growth
cycles are two separate, parallelizable sub-phases once their shared courses exist. See
[tech-docs §The eleven-course catalog slice](./tech-docs.md#the-eleven-course-catalog-slice-courses-111)
for the full topological ordering this parallelization respects.

Research and drafting may run concurrently, but all changes are committed serially on the one
persistent branch in the declared worktree (see [§Worktree](#worktree)).

### Delivery Boundaries

| Phase(s) | Delivery unit                                               | Worktree / branch                                                         | PR opens                           |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------- |
| 0        | Setup and baseline                                          | No delivery worktree or PR                                                | no                                 |
| 1–7      | Intermediate authoring, verification, and Knowledge Capture | This plan's single declared worktree and persistent final-delivery branch | no — commit only                   |
| 8        | Final archival and integration                              | The same worktree and branch; archive before opening the PR               | yes — exactly once, after archival |

No phase may create an additional worktree or branch. The final phase is the only delivery boundary.

## Path constants

```bash
# Run from the repo root. Detects this plan's current lifecycle stage and re-derives every path.
if [ -d "plans/backlog/ayokoding-learning-path-14-skills-accounting-foundations" ]; then
  PLANDIR="plans/backlog/ayokoding-learning-path-14-skills-accounting-foundations/"
elif [ -d "plans/in-progress/ayokoding-learning-path-14-skills-accounting-foundations" ]; then
  PLANDIR="plans/in-progress/ayokoding-learning-path-14-skills-accounting-foundations/"
else
  PLANDIR=$(find plans/done -maxdepth 1 -type d -name "*ayokoding-learning-path-14-skills-accounting-foundations" | head -1)/
fi
echo "PLANDIR=$PLANDIR"
```

- `COURSES="apps/ayokoding-www/content/en/learn/courses/"`
- `LANDING_CA="apps/ayokoding-www/content/en/learn/paths/skills/conventional-accounting/"`
- `LANDING_SA="apps/ayokoding-www/content/en/learn/paths/skills/sharia-accounting/"`
- `MANIFEST_CA="apps/ayokoding-www/src/features/course-paths/manifests/skills/conventional-accounting.json"`
- `MANIFEST_SA="apps/ayokoding-www/src/features/course-paths/manifests/skills/sharia-accounting.json"`
- `MTEST_CA="apps/ayokoding-www/src/features/course-paths/manifests/skills/conventional-accounting-manifest.unit.test.ts"`
- `MTEST_SA="apps/ayokoding-www/src/features/course-paths/manifests/skills/sharia-accounting-manifest.unit.test.ts"`
- `SPEC="${PLANDIR}syllabus/courses/"`
- `SPECPATHS="${PLANDIR}syllabus/paths/"`
- `SPECS="specs/apps/ayokoding/behavior/ayokoding-www/gherkin/course-paths/"`

## Course ID lists (define once, reuse in every clause — shell ARRAYS only, HARD rule)

```bash
ACCT_S1=(accounting-foundations chart-of-accounts-and-data-modeling financial-statements-and-close-cycle)

ACCT_S1B=(journal-entries-and-posting-mechanics accrual-accounting-and-revenue-recognition \
  accounts-payable-and-procure-to-pay accounts-receivable-and-order-to-cash \
  managerial-and-cost-accounting fixed-assets-and-depreciation inventory-and-cogs-accounting \
  lease-and-intangible-asset-accounting)

ACCT_P14=("${ACCT_S1[@]}" "${ACCT_S1B[@]}")   # 11 — both manifests' full courseOrder at this plan's end
ACCT_SILENT=("${ACCT_S1B[@]}")                 # 8 — courses #4-#11, each carrying the silent-failure section
```

**Never** iterate these as a space-separated string — zsh does not word-split unquoted parameters,
and a string form silently short-circuits to a single false-passing iteration.

---

## Phase 0: Environment Setup and Baseline

> _Suggested executor: direct tool use, no content-authoring agent needed._

### Environment Setup

- [x] [AI] **Promote out of `plans/backlog/` first — on the local `main` checkout, before any worktree exists.**
      Run `git mv plans/backlog/ayokoding-learning-path-14-skills-accounting-foundations/ plans/in-progress/ayokoding-learning-path-14-skills-accounting-foundations/`
      (a pure move — neither stage carries a date prefix), update `plans/backlog/README.md` and
      `plans/in-progress/README.md`, commit on the plan branch and include the move in the one final PR — acceptance:
      `git ls-tree -r --name-only origin/main -- plans/in-progress/ayokoding-learning-path-14-skills-accounting-foundations/README.md | grep -c .`
      returns **1** and the same query against `plans/backlog/ayokoding-learning-path-14-skills-accounting-foundations/README.md` returns **0**.
      Falsifiable both ways: before the push lands, the first query returns 0 and the second
      returns 1. Execution never runs out of `plans/backlog/` — this push is a mandatory
      precondition, not a courtesy. See
      [plan-execution → Execute Plan from Backlog](../../../repo-governance/workflows/plan/plan-execution/example-usage-and-iteration-example.md#execute-plan-from-backlog).
- [x] [AI] Confirm the worktree is provisioned and current: `git worktree list | grep -F "ayokoding-learning-path-14-skills-accounting-foundations"` exits 0.
- [x] [AI] Install dependencies: `npm install`.
- [x] [AI] Run doctor to verify tooling: `npm run doctor -- --fix`.
- [x] [AI] Verify dev server starts: `nx dev ayokoding-www` (start, confirm it serves, stop).
- [x] [AI] Verify existing tests pass before making changes: `npm exec nx run ayokoding-www:test:quick`.

### Baseline (must all be true before any content is authored)

- [x] [AI] Direct predecessor archival check passed; repository baseline facts checked — run the loop in
      [§Depends-on](#depends-on); acceptance: empty output.
- [x] [AI] `<PLANDIR>` resolves. Create `"${SPEC}"` and `"${SPECPATHS}"` if absent (Phase 1
      authors into them) — acceptance: `test -d "${PLANDIR}"` exits 0.
- [x] [AI] Neither manifest exists yet: `test -f "$MANIFEST_CA" && echo FOUND || echo ABSENT`
      prints `ABSENT`, and the same for `$MANIFEST_SA` — acceptance: both print `ABSENT`.
      Falsifiable both ways: both flip to `FOUND` after Phase 2.
- [x] [AI] No course in `ACCT_P14` exists yet:
      `for c in "${ACCT_P14[@]}"; do test -d "${COURSES}$c" && echo "FOUND $c"; done | wc -l` returns
      **0** — acceptance: returns 0 today, returns 3 after Phase 2, returns 11 after Phase 3.
- [x] [AI] Neither landing exists yet: `test -d "$LANDING_CA" && echo FOUND || echo ABSENT` prints
      `ABSENT`, and the same for `$LANDING_SA`.

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `npm run doctor -- --fix` exits 0.
- [x] [AI] `npm exec nx run ayokoding-www:test:quick` exits 0.
- [x] [AI] Every Baseline check above holds.

> **Pause Safety**: no plan content exists yet; the worktree is clean and tooling-verified. Safe to
> stop. To resume: re-run `npm exec nx run ayokoding-www:test:quick` and confirm 0 exit before starting Phase 1.

---

## Phase 1: The eleven syllabus specs

> _Suggested executor: direct authoring, `web-researcher` (coverage pass only, per A12), then
> delegate content authoring per course to `apps-ayokoding-www-by-example-maker` in Phases 2/3._

### 1.1 · Create the spec folders

- [x] [AI] Create `"${SPEC}"` and `"${SPECPATHS}"` _(new directories)_ — acceptance: both
      `test -d` exit 0.
- [x] [AI] Create `"${SPEC}README.md"` and `"${SPECPATHS}README.md"` _(new files)_ per the
      [Learning-Plan Syllabus Convention](../../../repo-governance/conventions/structure/learning-plan-syllabus.md) —
      acceptance: both `test -f` exit 0.
- [x] [AI] Create `"${PLANDIR}syllabus/README.md"` _(new file)_ with the corpus overview and the
      `**Custodian**: ayokoding-learning-path-14-skills-accounting-foundations` line — acceptance:
      `grep -q '\*\*Custodian\*\*: ayokoding-learning-path-14-skills-accounting-foundations' "${PLANDIR}syllabus/README.md"`
      exits 0.

### 1.2 · Author all eleven syllabi

- [x] [AI] Author `"${SPEC}<course-id>.md"` for each of the 11 courses in `ACCT_P14`, following the
      REQUIRED + RECOMMENDED template from the
      [Learning-Plan Syllabus Convention](../../../repo-governance/conventions/structure/learning-plan-syllabus/copy-paste-course-template.md#copy-paste-course-template) —
      acceptance: `for c in "${ACCT_P14[@]}"; do test -f "${SPEC}$c.md" || echo "MISSING $c"; done | wc -l`
      returns **0**.
  - _Suggested executor: `apps-ayokoding-www-general-maker`_
- [x] [AI] Confirm every syllabus has no `## Capstone spec` section (A6) and does have
      `## Applied synthesis (no build — A6)`:
      `for c in "${ACCT_P14[@]}"; do grep -q '^## Capstone spec' "${SPEC}$c.md" && echo "VIOLATION $c"; done | wc -l`
      returns **0**, AND
      `for c in "${ACCT_P14[@]}"; do grep -q '^## Applied synthesis (no build — A6)' "${SPEC}$c.md" || echo "MISSING $c"; done | wc -l`
      returns **0**.
- [x] [AI] Confirm every course in `ACCT_SILENT` carries a worked silent-failure example:
      `for c in "${ACCT_SILENT[@]}"; do grep -q 'silent-failure' "${SPEC}$c.md" || echo "MISSING $c"; done | wc -l`
      returns **0** (8 courses checked).
- [x] [AI] Confirm courses #1–#3 (`ACCT_S1`) carry NO silent-failure requirement, instead each
      stating its forward boundary to the next course:
      `for c in "${ACCT_S1[@]}"; do grep -q 'forward boundary' "${SPEC}$c.md" || echo "MISSING $c"; done | wc -l`
      returns **0**.

### 1.3 · Coverage pass (A12 step 2 — after authoring, never before)

- [x] [AI] For each course, dispatch `web-researcher` (delegated, isolated context) with the
      question "what would a practitioner expect this syllabus's concept list to cover that it
      omits, and what does it include that the field does not recognise?" — never "does this match a
      named curriculum's structure." Record findings as `[Needs Verification]` annotations or new
      concept bullets **added to the existing syllabus**, never as a restructuring — acceptance: for
      every course, the syllabus's `## In which paths` section is unchanged by the coverage pass.
- [x] [AI] Confirm no syllabus was rewritten to mirror an external curriculum's module titles or
      sequence — verified by reading the diff, not by grep.

### 1.4 · Licensing-sensitive-sources recording

- [x] [AI] For each of the 11 syllabi, record which standard numbers it cites (revenue-recognition,
      lease-accounting, depreciation, inventory-costing standards) and whether it references any
      reference implementation, in `## Accuracy notes` — acceptance:
      `for c in "${ACCT_P14[@]}"; do grep -q '^## Accuracy notes' "${SPEC}$c.md" || echo "MISSING $c"; done | wc -l`
      returns **0**.

### Phase 1 Gate

> All checks below must pass before starting Phase 2.

- [x] [AI] All 11 syllabus files exist, each with `## Applied synthesis (no build — A6)` and no
      `## Capstone spec`.
- [x] [AI] All 8 `ACCT_SILENT` syllabi carry a worked silent-failure example; `ACCT_S1`'s 3 do not.
- [x] [AI] Every syllabus has a non-empty `## Accuracy notes` licensing-sensitive-sources record.
- [x] [AI] **Concept floor holds (≥ 8)** —
      `for c in "${ACCT_P14[@]}"; do n=$(grep -c '^- \*\*co-[0-9]' "${SPEC}$c.md"); [ "$n" -ge 8 ] || echo "UNDER-FLOOR $c = $n"; done | wc -l`
      returns **0**.
- [x] [AI] `npm run lint:md` exits 0 on the new `syllabus/` tree.
- [x] [AI] **Every prerequisite edge is transcribed and resolves** —

```bash
# (1) Unresolved prior-course edges within this plan's own 11-course range. MUST print 0.
for f in $(find "${SPEC}" -maxdepth 1 -name '*.md' ! -name 'README.md'); do
  awk '/^- \*\*Prior courses\*\*/{p=1;print;next} p&&/^- \*\*/{p=0} p' "$f" \
    | grep -oE '`[a-z0-9-]+`' | tr -d '`' | while IFS= read -r id; do
        [ -f "${SPEC}${id}.md" ] || [ "$id" = "sql-essentials" ] || echo "UNRESOLVED $(basename "$f") -> $id"
      done
done | wc -l

# (2) Anti-vacuity companion: total edges examined. MUST be > 0 (courses 2-11 each cite at least one).
for f in $(find "${SPEC}" -maxdepth 1 -name '*.md' ! -name 'README.md'); do
  awk '/^- \*\*Prior courses\*\*/{p=1;print;next} p&&/^- \*\*/{p=0} p' "$f" \
    | grep -oE '`[a-z0-9-]+`'
done | wc -l
```

Acceptance: command (1) returns **0**; command (2) returns a count **> 0**. The `sql-essentials`
exclusion in command (1) accounts for course #2's one linked (never-walked) external edge.

> **Pause Safety**: the full spec layer for this plan's 11-course range exists and is internally
> consistent; no course body or manifest exists yet. Safe to stop. To resume: re-run the Phase 1
> Gate's checks and confirm 0/0/>0 as specified before starting Phase 2.

---

## Phase 2: Stage 1 — courses #1–#3, both manifests created, both landings created

> _Suggested executor: `apps-ayokoding-www-by-example-maker` (all three bodies are By Example) +
> `apps-ayokoding-www-general-maker` (both landings) + `web-researcher` (accuracy pre-verify)._
>
> **The first ramp boundary, the two manifests' first publication, and both landings' creation all
> land in one phase.** At its end a reader on either path can build a correctly balancing ledger.

### 2.1 · Author the three Stage-1 bodies (maker-checker-fixer, not TDD)

Apply the seven-step per-course convention to each course; each course is its own sub-phase (own

1. [AI] **Accuracy pre-verify** — spot-check every external claim via `web-researcher`.
2. [AI] **Skeleton** — create `"${COURSES}<course-id>/"` (`_index.md` with `prerequisites: [...]`,
   `overview.md`, `learning/_index.md`, `drilling/_index.md`) from `"${SPEC}<course-id>.md"`.
3. [AI] **Author learning track** from the spec's `## Concepts` and `## Worked examples`, plus
   `learning/synthesis/` from `## Applied synthesis (no build — A6)` — never a `learning/capstone/`
   directory.
4. [AI] **Author drilling track** — `drilling/_index.md` + `drilling/overview.md`.
5. [AI] **Run content checkers** — `apps-ayokoding-www-by-example-checker`,
   `apps-ayokoding-www-facts-checker`, `apps-ayokoding-www-link-checker`.
6. [AI] **Apply content fixers** — every CRITICAL/HIGH/MEDIUM finding addressed.
7. [AI] **Re-verify** — checkers + `npm exec nx run ayokoding-www:build` + `npm run lint:md`.

- [x] [AI] Course #1 `accounting-foundations` (By Example, no prerequisites) — mines the legacy
      accounting article per DD-1410. **Verify the source exists before mining it**:
      `SRC=apps/ayokoding-www/content/en/learn/legacy/business/accounting.md; test -f "$SRC" && echo "MINING $SRC" || echo "SOURCE-MISSING"`
      — acceptance: prints `MINING <path>`, never `SOURCE-MISSING`. Then all 7 convention steps
      complete; checkers report zero CRITICAL/HIGH/MEDIUM;
      `grep -F -q 'chart-of-accounts-and-data-modeling' "${COURSES}accounting-foundations/overview.md"`
      exits 0. **No paragraph from the legacy article moves verbatim** — verified by reading the diff.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] Course #2 `chart-of-accounts-and-data-modeling` (By Example; prerequisites: #1 and the
      **linked** `sql-essentials`) — acceptance: all 7 steps complete;
      `grep -F -q 'sql-essentials' "${COURSES}chart-of-accounts-and-data-modeling/_index.md"` exits 0
      **and**
      `grep -F -q 'sql-essentials' "${COURSES}chart-of-accounts-and-data-modeling/overview.md"` exits 0.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] Course #3 `financial-statements-and-close-cycle` (By Example; prerequisite: #2) —
      acceptance: all 7 steps complete; checkers report zero CRITICAL/HIGH/MEDIUM.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] **Stage-1 body check** —
      `for c in "${ACCT_S1[@]}"; do test -d "${COURSES}$c" || echo "MISSING $c"; done | wc -l`
      — acceptance: returns **0**.
- [x] [AI] Append the three catalog rows to `"${COURSES}_index.md"` _(existing file, created by
      plan 01)_ — acceptance:
      `for c in "${ACCT_S1[@]}"; do grep -F -q "$c" "${COURSES}_index.md" || echo "MISSING $c"; done | wc -l`
      returns **0**; `apps-ayokoding-www-link-checker` green on `"${COURSES}_index.md"`.

### 2.2 · TDD cycle — create BOTH manifests

- [x] [AI] **RED** — create `$MTEST_CA` and `$MTEST_SA` _(new files)_ with failing assertions that
      each manifest loads, zod-validates, declares `pathId` equal by **string equality** to
      `skills/conventional-accounting` / `skills/sharia-accounting` respectively, `arc` equal to
      `immediately-effective`, a `courseOrder` of **length 3** equal to `ACCT_S1` in order, and
      passes `checkManifestIntegrity` + `checkPrerequisiteConsistency`; plus one negative assertion
      per file that a malformed id is rejected by `safeParse`
      — command: `npm exec nx run ayokoding-www:test:unit`
      — acceptance: both new test files **fail** with a module-not-found or empty-glob error naming
      their respective YAML file.

  **Gherkin (underpins) →** Outline "A two-segment skills path ID resolves end to end" (Examples:
  `skills/conventional-accounting`, `skills/sharia-accounting`)

  ```gherkin
  Scenario Outline: A two-segment skills path ID resolves end to end
    Given the <path> manifest declares its pathId and arc immediately-effective
    When a reader walks the path from its landing
    Then the landing, the prev and next controls, and the breadcrumb all resolve against that two-segment path ID
    And the ?path=<path> context persists across every course in the walk
    And no resolver assumes a three-segment path ID

    Examples:
      | path                           |
      | skills/conventional-accounting |
      | skills/sharia-accounting       |
  ```

- [x] [AI] **GREEN** — author `$MANIFEST_CA` and `$MANIFEST_SA` _(new files)_ each with its `pathId`,
      `arc: immediately-effective`, a title, a description, and a 3-entry `courseOrder`,
      **byte-identical to each other at this stage**, transcribed from `"${SPECPATHS}"`, entries as
      **plain ID strings**, no `framing` mappings
      — command: `npm exec nx run ayokoding-www:test:unit`
      — acceptance: both exit 0, AND
      `diff <(grep -E '^  - ' "$MANIFEST_CA") <(grep -E '^  - ' "$MANIFEST_SA")` returns empty.
- [x] [AI] **REFACTOR** — align JSON property order/comment style across both manifests; factor a shared
      load-and-validate helper in a common test utility so §3.2 adds assertions, not copied blocks
      — command: `npm exec nx run ayokoding-www:test:unit && npm exec nx run ayokoding-www:lint` — acceptance: both
      exit 0; no assertion weakened.

- [x] [AI] **Shared-course non-duplication check (A11)** —
      `for c in "${ACCT_S1[@]}"; do n=$(find "${COURSES}$c" -maxdepth 0 -type d | wc -l); [ "$n" -eq 1 ] || echo "DUPLICATE-OR-MISSING $c"; done | wc -l`
      returns **0**.

  **Gherkin (binds) →** "Both manifests are created identically and grow together within this plan"

  ```gherkin
  Scenario: Both manifests are created identically and grow together within this plan
    Given neither manifest exists before this plan runs
    When Phase 2 and Phase 3 complete
    Then both manifests hold exactly the same eleven course IDs, in the same order
    And no course file exists at two different paths for the same subject matter
    And neither manifest's courseOrder exceeds eleven entries
  ```

### 2.3 · Both landings, created here (content — maker-checker-fixer, not TDD)

- [x] [AI] Author `"${LANDING_CA}_index.md"` _(new file)_ per
      [tech-docs §Landing content contract](./tech-docs.md#the-ramp-and-its-stages-this-plans-slice):
      the immediately-effective promise, the Dangerous-1 boundary, and the linked `sql-essentials`
      prerequisite at its canonical URL — acceptance:
      `grep -oE 'courseOrder' "${LANDING_CA}_index.md" | wc -l` returns **0**, AND
      `grep -F -q 'Dangerous 1' "${LANDING_CA}_index.md"` exits 0.
  - _Suggested executor: `apps-ayokoding-www-general-maker`_
- [x] [AI] Author `"${LANDING_SA}_index.md"` _(new file)_ — same contract, plus a stated Sharia arc
      and a **path-choice affordance note** distinguishing it from `conventional-accounting` —
      acceptance: `grep -F -q 'Dangerous 1' "${LANDING_SA}_index.md"` exits 0, AND
      `grep -F -q 'conventional-accounting' "${LANDING_SA}_index.md"` exits 0.
  - _Suggested executor: `apps-ayokoding-www-general-maker`_

  **Gherkin (binds) →** Outline "A path landing states its arc and ramp before the course list"
  (Examples: `conventional-accounting`, `sharia-accounting`)

  ```gherkin
  Scenario Outline: A path landing states its arc and ramp before the course list
    Given the <path> path landing is published
    When a reader opens /en/learn/paths/skills/<path>
    Then the immediately-effective promise and the Dangerous-1 boundary appear before the ordered course list
    And the boundary names both what the reader can do and what the reader cannot yet do
    And the ordered course list is rendered from the manifest rather than hand-listed in the landing

    Examples:
      | path                    |
      | conventional-accounting |
      | sharia-accounting       |
  ```

- [x] [AI] **Ordering check, both landings** —
      `for L in "$LANDING_CA" "$LANDING_SA"; do grep -oE 'journal-entries-and-posting-mechanics' "${L}_index.md" | sort -u | wc -l; done`
      returns **0 0** (no later-stage course ID is hand-listed).
- [x] [AI] Run `apps-ayokoding-www-link-checker` and `apps-ayokoding-www-general-checker` over both
      landings — apply fixers — acceptance: zero CRITICAL/HIGH/MEDIUM remain.

### 2.4 · TDD cycle — both path-walk e2e specs

- [x] [AI] **RED** — add `"${SPECS}skills-path-composition.feature"` _(new file)_ carrying the
      two-Examples-row scenario above, plus failing e2e steps in
      `apps/ayokoding-www-fe-e2e/src/steps/skills-path-composition.steps.ts` _(new file, pairing
      1:1)_ that open each landing, walk all three courses via prev/next, assert `?path=`
      persistence, assert breadcrumb resolution, and assert a deliberately over-segmented id is hard
      rejected — for **both** `pathId`s — command: `npm exec nx run ayokoding-www-fe-e2e:test:e2e` —
      acceptance: the new spec **fails** for both Examples rows.

  **Gherkin (binds) →** aggregate BDD binder consuming the whole `.feature` file for E2E — Outline
  "A two-segment skills path ID resolves end to end" (Examples: `skills/conventional-accounting`,
  `skills/sharia-accounting`)

- [x] [AI] **GREEN** — implement the step bindings against both published manifests and live
      landings — command:
      `npm exec nx run ayokoding-www:specs:behavior:coverage && npm exec nx run ayokoding-www-fe-e2e:test:e2e`
      — acceptance: both exit 0.
- [x] [AI] **REFACTOR** — extract a reusable "walk a skills path given a path id" helper step
      definition parameterized on `pathId`, so Phase 3 reuses it without duplication — command:
      `npm exec nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: exits 0, scenario count unchanged.

### Phase 2 Gate

> All checks below must pass before starting Phase 3.

- [x] [AI] All 3 Stage-1 course bodies exist, checkers green.
- [x] [AI] Both manifests created, byte-identical at 3 entries, both pass `test:unit`.
- [x] [AI] Both landings created, ordering check clean, checkers green.
- [x] [AI] Both e2e walk specs green.
- [x] [AI] `npm exec nx run ayokoding-www:build` exits 0.

  **Gherkin (binds) →** "The first ramp boundary is reachable in three courses"

  ```gherkin
  Scenario: The first ramp boundary is reachable in three courses
    Given both accounting manifests are published with courses 1 through 3 in courseOrder
    When a reader finishes the third course
    Then the reader can build a correctly balancing ledger and produce the three statements for a single entity
    And both landings state that the reader cannot yet safely handle journal-entry mechanics, revenue recognition, procurement, order-to-cash, cost accounting, fixed assets, inventory, or leases
  ```

> **Pause Safety**: both paths have a working, correctly balancing three-course ledger and a live
> landing. Safe to stop — this is a genuinely shippable, if minimal, state. To resume: re-run
> `npm exec nx run ayokoding-www:test:unit && npm exec nx run ayokoding-www-fe-e2e:test:e2e` and confirm 0 exit before
> starting Phase 3.

---

## Phase 3: Stage 1B — courses #4–#11, both manifests grown to eleven

> _Suggested executor: `apps-ayokoding-www-by-example-maker` + `web-researcher` (accuracy
> pre-verify)._
>
> **The transactional-and-cost-accounting cycle completes; both manifests reach their in-plan
> terminal state of 11.** Apply the same seven-step convention from §2.1 to each course below.

### 3.1 · Author the eight Stage-1B bodies

- [x] [AI] Course #4 `journal-entries-and-posting-mechanics` (By Example; prerequisite: #3) —
      **first course carrying the formal silent-failure section** — acceptance: 7 steps complete;
      `grep -F -q 'What still balances while being wrong' "${COURSES}journal-entries-and-posting-mechanics/overview.md"`
      exits 0.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] Course #5 `accrual-accounting-and-revenue-recognition` (By Example; prerequisite: #4) —
      acceptance: 7 steps complete; silent-failure section present.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] Course #6 `accounts-payable-and-procure-to-pay` (By Example; prerequisite: #4) —
      acceptance: 7 steps complete; silent-failure section present.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] Course #7 `accounts-receivable-and-order-to-cash` (By Example; prerequisites: #4, #5) —
      acceptance: 7 steps complete; silent-failure section present.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] Course #8 `managerial-and-cost-accounting` (By Example; prerequisite: #3) — acceptance: 7
      steps complete; silent-failure section present.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] Course #9 `fixed-assets-and-depreciation` (By Example; prerequisite: #2) — acceptance: 7
      steps complete; silent-failure section present.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] Course #10 `inventory-and-cogs-accounting` (By Example; prerequisites: #2, #8) —
      acceptance: 7 steps complete; silent-failure section present.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] Course #11 `lease-and-intangible-asset-accounting` (By Example; prerequisite: #9) — the
      last course this plan authors — acceptance: 7 steps complete; silent-failure section present;
      `grep -F -q 'multi-currency-accounting-and-fx-translation' "${COURSES}lease-and-intangible-asset-accounting/overview.md"`
      exits 0 (this course's overview states the forward boundary into plan 15's own range, without
      creating any prerequisite edge onto a not-yet-authored course).
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] **Stage-1B body check** —
      `for c in "${ACCT_S1B[@]}"; do test -d "${COURSES}$c" || echo "MISSING $c"; done | wc -l`
      — acceptance: returns **0**.
- [x] [AI] Append all eight catalog rows to `"${COURSES}_index.md"` — acceptance:
      `for c in "${ACCT_S1B[@]}"; do grep -F -q "$c" "${COURSES}_index.md" || echo "MISSING $c"; done | wc -l`
      returns **0**.

### 3.2 · TDD cycle — grow BOTH manifests to eleven

- [x] [AI] **RED** — extend `$MTEST_CA` and `$MTEST_SA` with failing assertions that each
      `courseOrder` grows from length 3 to length 11, appending `ACCT_S1B` in order, still passing
      `checkManifestIntegrity` + `checkPrerequisiteConsistency` — command:
      `npm exec nx run ayokoding-www:test:unit` — acceptance: both new assertions fail (length still 3).

  **Gherkin (underpins) →** "Both manifests are created identically and grow together within this
  plan"

- [x] [AI] **GREEN** — grow `$MANIFEST_CA` and `$MANIFEST_SA` to 11 entries each (both hold exactly
      `ACCT_P14` in order, still byte-identical to each other) — command:
      `npm exec nx run ayokoding-www:test:unit` — acceptance: exits 0; both files have exactly 11
      `courseOrder` entries; `diff <(grep -E '^  - ' "$MANIFEST_CA") <(grep -E '^  - ' "$MANIFEST_SA")`
      returns empty.
- [x] [AI] **REFACTOR** — command: `npm exec nx run ayokoding-www:test:unit && npm exec nx run ayokoding-www:lint` —
      acceptance: both exit 0.

- [x] [AI] **This plan's own terminal-length check (new to this split)** —
      `grep -cE '^  - ' "$MANIFEST_CA"` returns **11**, AND `grep -cE '^  - ' "$MANIFEST_SA"` returns
      **11** — falsifiable both ways: this check returned 3 before this sub-phase and must return
      11, never more, after it.

### 3.3 · Both landings updated to reflect the transactional-cycle boundary

- [x] [AI] Update `"${LANDING_CA}_index.md"` and `"${LANDING_SA}_index.md"` to state the
      transactional-and-cost-accounting cycle is complete through course #11, **without** claiming
      either path is done — acceptance:
      `for L in "$LANDING_CA" "$LANDING_SA"; do grep -F -q 'transactional' "${L}_index.md" || echo "MISSING $L"; done | wc -l`
      returns **0**, AND neither landing contains the string "complete" applied to the whole path:
      `for L in "$LANDING_CA" "$LANDING_SA"; do grep -F -q 'the path is complete' "${L}_index.md" && echo "PREMATURE-COMPLETION $L"; done | wc -l`
      returns **0**.
- [x] [AI] Run `apps-ayokoding-www-link-checker` and `apps-ayokoding-www-general-checker` over both
      updated landings — apply fixers — acceptance: zero CRITICAL/HIGH/MEDIUM remain.

### 3.4 · Shared-course non-duplication re-check

- [x] [AI] `for c in "${ACCT_P14[@]}"; do n=$(find "${COURSES}$c" -maxdepth 0 -type d | wc -l); [ "$n" -eq 1 ] || echo "DUPLICATE-OR-MISSING $c"; done | wc -l`
      returns **0** (all 11 courses checked).

### 3.5 · TDD cycle — extend both path-walks to the full eleven-course range

- [x] [AI] **RED** — extend the reusable "walk a skills path given a path id" helper (from §2.4's
      REFACTOR) in `apps/ayokoding-www-fe-e2e/src/steps/skills-path-composition.steps.ts` so both
      `pathId`s walk all **11** published courses via prev/next — command:
      `npm exec nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: the new 11-course assertion **fails** for
      both Examples rows (only 3 courses were walked before this phase).

  **Gherkin (underpins) →** aggregate BDD binder extending the whole `.feature` file for E2E —
  Outline "A two-segment skills path ID resolves end to end" (Examples:
  `skills/conventional-accounting`, `skills/sharia-accounting`)

- [x] [AI] **GREEN** — implement against both grown manifests — command:
      `npm exec nx run ayokoding-www:specs:behavior:coverage && npm exec nx run ayokoding-www-fe-e2e:test:e2e`
      — acceptance: both exit 0.
- [x] [AI] **REFACTOR** — parameterize the walk on expected course count so plan 15 extends it to
      19 without duplicating the helper — command: `npm exec nx run ayokoding-www-fe-e2e:test:e2e` —
      acceptance: exits 0, scenario count unchanged.

### 3.6 · Full-slice silent-failure check

- [x] [AI] `for c in "${ACCT_SILENT[@]}"; do grep -q 'silent-failure\|What still balances while being wrong' "${COURSES}$c/overview.md" || echo "MISSING $c"; done | wc -l`
      returns **0** (all 8 checked).

  **Gherkin (binds) →** "Every course from four through eleven names what still balances while
  being wrong"

  ```gherkin
  Scenario: Every course from four through eleven names what still balances while being wrong
    Given a course numbered four through eleven is authored
    When its overview is inspected
    Then it contains an explicit section naming at least one outcome that still balances while being substantively wrong
    And that section names the observable signal, if any, that would reveal the error
  ```

### Phase 3 Gate

> All checks below must pass before starting Phase 4.

- [x] [AI] All 8 Stage-1B course bodies exist, checkers green, every one carries a silent-failure
      section.
- [x] [AI] **Both path-walk e2e specs walk all 11 courses, not 3** — command:
      `npm exec nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: exits 0.
- [x] [AI] Both manifests grown to 11, still byte-identical, both pass `test:unit`.
- [x] [AI] Both landings state the transactional-cycle boundary, not path completion.
- [x] [AI] `sql-essentials` link-don't-walk check holds on both manifests:
      `for M in "$MANIFEST_CA" "$MANIFEST_SA"; do grep -oE 'sql-essentials' "$M" | wc -l; done`
      returns **0 0**.
- [x] [AI] `npm exec nx run ayokoding-www:build` exits 0.

> **Pause Safety**: this plan's full eleven-course range is authored and both manifests hold their
> in-plan terminal state (11 entries, byte-identical), **walked end to end by §3.5's e2e**. Safe to
> stop indefinitely — plan 15 has an unambiguous, merged starting point to grow from. To resume:
> re-run `npm exec nx run ayokoding-www:test:unit` and confirm 0 exit before starting Phase 4.

---

## Phase 4: Section and app verification

> _Suggested executor: direct verification; `apps-ayokoding-www-facts-checker` and
> `apps-ayokoding-www-link-checker` for the corpus-wide sweep._

### 4.1 · Manifest integrity, both manifests

- [x] [AI] `npm exec nx run ayokoding-www:test:unit` (both `$MTEST_CA` and `$MTEST_SA`) exits 0.
- [x] [AI] `checkManifestIntegrity` and `checkPrerequisiteConsistency` pass for both manifests as a
      standalone sweep — command: re-run the same test target with `--verbose` and read the
      assertion count matches 11 for both.

### 4.2 · Ownership footprint check

- [x] [AI] Authorship-scoped commit-footprint check:
      `gh pr list --search "ayokoding-learning-path-14-skills-accounting-foundations" --state merged --json number,files` and
      confirm every touched path under `apps/ayokoding-www/src/features/course-paths/manifests/` is
      one of the two files this plan owns — acceptance: no path under `manifests/careers/`,
      `manifests/skills/conventional-erp.json`, or `manifests/skills/sharia-erp.json` appears; no
      `_index.md` under `paths/` (other than the two landings) appears.

### 4.3 · Shared-course non-duplication, final sweep

- [x] [AI] `for c in "${ACCT_P14[@]}"; do n=$(find "${COURSES}$c" -maxdepth 0 -type d | wc -l); [ "$n" -eq 1 ] || echo "DUPLICATE-OR-MISSING $c"; done | wc -l`
      returns **0** (final confirmation, all 11).

### 4.4 · Licensing reading audit (A8)

- [x] [AI] For every file in `"${SPEC}"` (11 syllabi) **and** every `overview.md` under
      `"${COURSES}"` for `ACCT_P14` (11 course bodies) — 22 files total — read against the eleven
      safe-authoring rules in
      [tech-docs §Licensing and IP Compliance](./tech-docs.md#licensing-and-ip-compliance-a8): no
      standard's clause text or numbering layout reproduced, no chart of accounts copied, no
      copyleft code pasted, no vendor name used in a title — acceptance: zero violations found; any
      finding is fixed before this gate closes.
- [x] [AI] **Every citation resolves to a full URL.**

  ```bash
  for f in $(find "${SPEC}" -maxdepth 1 -name '*.md' ! -name 'README.md'); do
    awk '/^## Read more$/{flag=1;next}/^## /{flag=0}flag' "$f" \
      | grep -E '^\s*[-*] ' | grep -qv 'http' && echo "UNLINKED CITATION: $f"
  done
  ```

  Acceptance: **empty output**. Where a source is offline-only, cite it nominatively and record it
  as deliberately unlinked with the reason in that file's Accuracy notes — that is a pass, not a
  violation. **Do not fabricate a URL to satisfy this clause.**

### 4.5 · Scope-boundary sweep

- [x] [AI] Confirm neither manifest walks `sql-essentials` into `courseOrder` (final sweep) —
      `for M in "$MANIFEST_CA" "$MANIFEST_SA"; do grep -oE 'sql-essentials' "$M" | wc -l; done`
      returns **0 0**.
- [x] [AI] Confirm course #2's overview states its scope boundary against `sql-essentials` rather
      than re-teaching it — verified by reading.

  **Gherkin (binds) →** "This plan's corpus never re-teaches the linked library course"

  ```gherkin
  Scenario: This plan's corpus never re-teaches the linked library course
    Given this plan's eleven-course corpus is authored
    When course two's scope is compared with sql-essentials
    Then course two states its scope boundary against sql-essentials explicitly
    And no course in this plan's range teaches relational modelling or query performance as its own subject
  ```

### 4.6 · No-unverified-claim sweep

- [x] [AI] `apps-ayokoding-www-facts-checker` run over all 11 course bodies and all 11 syllabi —
      acceptance: zero unmarked claims; every `[Unverified]` / `[Needs Verification]` claim is
      genuinely marked, not silently stated as fact.
- [x] [AI] If any `[Needs Verification]` marker still stands after the facts-checker run, create
      `"${PLANDIR}verification-log.md"` _(new file)_ and, for each surviving marker, record its
      source file, the claim, and the reason it cannot yet resolve to `[Verified]` or `[Unverified]`
      — acceptance: `test -f "${PLANDIR}verification-log.md"` exits 0 with one entry per surviving
      marker; if zero markers remain, this file is not required and its absence is not a failure.

  **Gherkin (binds) →** "No unverified claim is published as fact"

  ```gherkin
  Scenario: No unverified claim is published as fact
    Given the research seeding this plan's syllabi marked items as Unverified or Needs Verification
    When a syllabus spec or a course body states a claim
    Then the claim carries either a primary-source citation or an explicit confidence marker
    And every item still marked Needs Verification when this plan's Phase 4 gate runs is registered with a reason in verification-log.md
  ```

### Phase 4 Gate

> All checks below must pass before starting Phase 5.

- [x] [AI] 4.1 through 4.6 all clean, zero unresolved findings.
- [x] [AI] `npm exec nx run ayokoding-www:build` exits 0.
- [x] [AI] `npm run lint:md` exits 0 across the whole plan folder and the whole
      `apps/ayokoding-www` content touched.

> **Pause Safety**: the corpus is verified, licensing-clean, and scope-consistent. Safe to stop. To
> resume: re-run 4.1's `test:unit` and 4.4's licensing sweep before starting Phase 5.

---

## Phase 5: Manual UI Verification + Rule-15 Three-Tester Retest

> _Suggested executor: Playwright MCP direct use for manual verification; the
> `web-ux-test-fixing-planning` workflow (`web-exploratory-tester` + `web-usability-tester` +
> `web-design-tester`) for the Rule-15 retest below._
>
> **This plan runs its own Rule-15 three-tester retest**, scoped to the two live partial landings as
> they actually exist at this plan's end — courses #1–#11 of the eventual 19/24. An 11-course
> landing is still a coherent, reachable UI surface for the triad to exercise: it can find a broken
> breadcrumb, a console error, or a design-token drift without needing a "complete" catalog. Plans
> 15 and 16 each run their own **follow-up** retest, scoped to their own incremental delta, once they
> grow either manifest past 11 entries. See
> [README.md §Rule-15 disposition](./README.md#rule-15-disposition-for-this-plan--scoped-retest-against-the-eleven-course-slice)
> for the full reasoning.

### Manual UI Verification (Playwright MCP) — three breakpoints

- [x] [AI] Start dev server: `nx dev ayokoding-www`.
- [x] [AI] For EACH breakpoint (375 / 768 / 1280 px): `browser_resize` to that width, then navigate
      to `/en/learn/paths/skills/conventional-accounting` via `browser_navigate`.
- [x] [AI] Inspect DOM via `browser_snapshot` at every breakpoint — verify the arc promise, the
      transactional-cycle boundary statement, and the rendered 11-course list all appear.
- [x] [AI] For EACH breakpoint (375 / 768 / 1280 px): `browser_resize` to that width, then navigate
      to `/en/learn/paths/skills/sharia-accounting` — verify the arc promise, the Dangerous-1
      boundary, the path-choice note, and the rendered 11-course list.
- [x] [AI] Walk both paths end to end via prev/next controls (`browser_click`) — verify breadcrumb
      and `?path=` persistence at every step.
- [x] [AI] Check for JS errors via `browser_console_messages` on both landings and a sample of
      walked courses, at every breakpoint — zero errors.
- [x] [AI] Take one screenshot per landing per breakpoint via `browser_take_screenshot`, saved to
      `evidence/phase-5-<landing>-en-<breakpoint>px.png` — commit as evidence.
- [x] [AI] Document verification results in this checklist, referencing each committed screenshot.

### Rule-15 Three-Tester Retest (before archival)

- [x] [AI] Run the three live-site testers (the `web-ux-test-fixing-planning` workflow:
      `web-exploratory-tester` + `web-usability-tester` + `web-design-tester`) against the running
      `conventional-accounting` and `sharia-accounting` path landings and a sample of their
      eleven published courses, in path context, in `en`, at all three breakpoints — scoped to this
      plan's own eleven-course slice as it actually exists at this plan's end — acceptance:
      EWT/UWT/DWT findings + spec-gaps recorded.
- [x] [AI] Append each finding below as a new unchecked checkbox, source-attributed
      (`- [ ] EWT-NNN:` / `- [ ] UWT-NNN:` / `- [ ] DWT-NNN: <defect> — fix before archival`); append
      any SG-###/USS-### items to the Specs & Gherkin Delivery steps in Phase 1, 2, or 3.
- [x] [AI] Fix every rule-15 EWT/UWT/DWT defect finding before archival — deferral requires explicit
      user permission (only when genuinely impossible) for defect findings; SG-### spec-gap
      proposals and USS-### spec-suggestions may be triaged or deferred with written rationale.
- [x] [AI] Where a finding implicates a surface outside this plan's own diff (e.g. a pre-existing
      `course-paths` shell defect owned by `ayokoding-learning-path-03-navigation-ui`), disposition
      it as pre-existing/out-of-scope and file it to a backlog idea brief rather than fixing it here
      — never silently drop it.

#### Rule-15 retest follow-ups

> _Findings from the retest run above are recorded here, source-attributed and dispositioned
> (fixed / deliberate descope / pre-existing filed), before this plan's Phase 5 Gate can close._

### Phase 5 Gate

> All checks below must pass before starting Phase 6.

- [x] [AI] Both landings walked end to end with zero JS console errors.
- [x] [AI] Screenshot evidence committed for both landings, all three breakpoints.
- [x] [AI] All rule-15 EWT/UWT/DWT defect findings are dispositioned: every in-scope defect is
      **fixed** and ticked; every pre-existing/out-of-scope finding is filed to a backlog idea
      brief; every SG-###/USS-### item is triaged or deferred with written rationale. No unresolved
      in-scope defect remains.

> **Pause Safety**: both partial-corpus landings are manually verified end to end and the Rule-15
> retest is fully dispositioned. Safe to stop. To resume: re-open both landings via
> `browser_navigate`, re-check `browser_console_messages`, and confirm every Rule-15 finding above
> is terminal before starting Phase 6.

---

## Phase 6: Final quality and archival-PR readiness

> _Suggested executor: direct git/CI operations._

### Local Quality Gates (Before archival)

- [x] [AI] `npm exec nx affected -t typecheck,build,test:quick,lint` exits 0.
- [x] [AI] `npm exec nx run ayokoding-www:specs:behavior:coverage` exits 0.
- [x] [AI] `npm run lint:md` exits 0.

> **Important**: fix ALL failures found during these gates, not just those caused by this plan's own
> changes.

### Commit Guidelines

- [x] [AI] Commit changes thematically — group related changes into logically cohesive commits.
- [x] [AI] Follow Conventional Commits format: `<type>(<scope>): <description>`.
- [x] [AI] Split different domains/concerns into separate commits.
- [x] [AI] Do NOT bundle unrelated fixes into a single commit.

### Pre-archival readiness

- [x] [AI] Commit this phase's checked artifacts on the persistent final-delivery branch; acceptance:
      no PR, merge, deployment, or merge-commit record occurs before Phase 8.
- [x] [AI] Rebase or otherwise non-destructively reconcile the persistent branch with current
      `origin/main`, then re-run every local quality gate; acceptance: the branch is current and all
      gates are green.
- [x] [AI] Preserve the Phase 5 local UI evidence as the pre-archival verification record. The sole
      PR is intentionally not opened until the Phase 8 archival move is committed.

  **Gherkin (binds) →** "This plan's authored slice builds and validates green"

  ```gherkin
  Scenario: This plan's authored slice builds and validates green
    Given both manifests hold eleven entries and all eleven course bodies are authored
    When the app build, the affected test tiers, and the link and heading validators run
    Then the build and every affected tier succeed
    And manifest integrity and prerequisite consistency report zero violations for both manifests
    And the manifests directory contains exactly two data files plus their co-located unit tests this plan created
  ```

### Phase 6 Gate

> All checks below must pass before starting Phase 7.

- [x] [AI] All local quality gates and Phase 5 evidence are green and committed on the persistent
      final-delivery branch.
- [x] [AI] No PR exists yet for this plan; Phase 8 is the sole terminal archival delivery boundary.

> **Pause Safety**: this plan's authored corpus is verified and committed on the persistent
> final-delivery branch. Safe to stop. To resume: re-run the local quality gates before starting
> Phase 7.

---

## Phase 7: Knowledge Capture

> _Triage every surviving `learnings.md` entry before archival. See the
> [Knowledge Capture Convention](../../../repo-governance/development/quality/knowledge-capture.md)._

- [x] [AI] Apply the litmus test to every `learnings.md` entry — keep only if a durable surface
      would catch this automatically next time; discard the rest with a one-line reason.
- [x] [AI] Apply the secret/sensitivity gate — sanitize any secret, credential, token, or private
      hostname, or discard if unsanitizable.
- [x] [AI] Apply the repo-relevance gate — infra-private content stays in the private sibling only.
- [x] [AI] Route each surviving learning to exactly one durable home; code-homed learnings are
      filed as a separate `plans/backlog/<slug>/` plan, never landed inline.
- [x] [AI] For any entry routed to `plans/ideas/`, scan `plans/ideas/README.md` and the existing
      two-pagers FIRST for a brief already covering the same problem or area — fold the learning into
      that brief instead of creating a new file; only create a new `plans/ideas/<slug>.md` when the
      scan confirms no existing brief overlaps (see
      [Integrate Before You Add](../../../repo-governance/conventions/structure/plans/ideas-folder-overview-rationale-and-file-layout.md#integrate-before-you-add-no-duplicate-two-pagers))
      — acceptance: the entry's routing line names either the folded-into brief or confirms the
      overlap scan found nothing.
- [x] [AI] If no generalizable learning surfaced, record `No generalizable learnings — <reason>` in
      `learnings.md`.

### Phase 7 Gate

> All checks below must pass before Plan Archival.

- [x] [AI] Every `learnings.md` entry is terminal, or the explicit "none" escape is recorded.
- [x] [AI] No code-homed learning landed inline in this plan's own commits/PRs.

> **Pause Safety**: `learnings.md` is fully triaged. Safe to stop. To resume: re-read
> `learnings.md` and confirm every entry is terminal.

---

## Phase 8: Plan Archival

### Sole PR integration (binding)

- [x] [AI] Archive this plan on its persistent final-delivery branch before review — acceptance: the archive move and index updates are committed in the same branch.
- [x] [AI] Open exactly one draft PR from that branch and run the secret scan, local quality checks, and PR quality-gate verification plus every local and CI gate — acceptance: the PR is the only PR for this plan.
- [x] [AI] Mark the PR ready, merge under the hardened preconditions, and deploy once — acceptance: the merge/deploy record is the plan's sole delivery record.

- [x] [AI] `git mv plans/in-progress/ayokoding-learning-path-14-skills-accounting-foundations plans/done/$(date +%Y-%m-%d)__ayokoding-learning-path-14-skills-accounting-foundations`
      (always from `plans/in-progress/` — Phase 0's promotion step is a mandatory precondition).
- [x] [AI] Update `plans/in-progress/README.md` — remove this
      plan's entry.
- [x] [AI] Update `plans/done/README.md` — add this plan's entry with its completion date.
- [x] [AI] Update `ayokoding-learning-path-15-skills-accounting-enterprise-reporting`'s own docs (if
      it exists at this point) to note this plan's merge is on `origin/main`, per its own Phase 0
      precondition check — this is a note only; plan 15 verifies readiness itself.
- [x] [AI] Commit the archival move to the persistent final-delivery branch, before opening the
      plan's only PR.
      `git commit -m "chore(plans): archive ayokoding-learning-path-14-skills-accounting-foundations"`.
- [x] [AI] **Push the archival commit** — `git push origin HEAD` — acceptance: exits 0 and
      `git status -sb | grep -c 'ahead'` returns **0**.
- [x] [AI] **Monitor CI on the new head** — poll every 2 minutes, one
      `gh run view --json status,conclusion` per wakeup. Acceptance: `status` is `completed` **and**
      `conclusion` is `success` for the run whose head SHA equals `git rev-parse HEAD`.
- [x] [AI] Re-confirm all five PR Merge Protocol preconditions still hold after the archival commit,
      then perform the `[AI]` merge. This is the terminal step of the plan.

### Phase 8 Gate

- [x] [AI] `test -d plans/done/*__ayokoding-learning-path-14-skills-accounting-foundations` exits 0.
- [x] [AI] `test -d plans/backlog/ayokoding-learning-path-14-skills-accounting-foundations` and
      `test -d plans/in-progress/ayokoding-learning-path-14-skills-accounting-foundations` both
      exit 1.
- [x] [AI] The archival commit is an ancestor of the merged PR head — verify with
      `gh pr list --head "$(git rev-parse --abbrev-ref HEAD)" --state merged --json number,mergeCommit`,
      not `git merge-base --is-ancestor` (this repo squash-merges).

> **Pause Safety**: plan complete and archived. Plan 15 may now start. Nothing further to resume.
