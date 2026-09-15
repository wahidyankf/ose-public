# Delivery Checklist — Course Authoring: Interview-Technique Courses (Band 9)

This checklist authors **5 course bodies** into `apps/ayokoding-www/content/en/learn/courses/<course-id>/`:
`coding-interview`, `take-home-and-live-coding`, `system-design-interview`,
`behavioral-and-leadership-interviews`, and `capstone-interview-loop`.

> **This plan never edits a manifest file.** Every file under
> `apps/ayokoding-www/src/features/course-paths/manifests/` (`<MANIFESTS>`) belongs to a downstream
> manifest-growth plan. This plan's only outbound artefact is the **one band-completion signal**
> recorded at the end of Phase 1. See
> [README.md §The manifest ownership invariant](./README.md#the-manifest-ownership-invariant--this-band-is-the-special-case)
> and
> [tech-docs.md §The manifest ownership invariant](./tech-docs.md#the-manifest-ownership-invariant-binding).
>
> **Cross-plan source of truth** — the `syllabus/` detail layer lives in
> [`../../done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/`](../../done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/README.md).
> Every course body is authored **from** its `syllabus/courses/<course-id>.md` spec. **Never copy
> those files into this plan.**
>
> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.
> Git-mechanical steps (worktree create/remove, branch, push, merge) are `[AI]`. **This plan contains
> no `[HUMAN]` step.**
>
> **Phase Gate** — every phase ends with a `### Phase N Gate` (must-pass verification) plus a
> `> **Pause Safety**:` note (safe-to-stop state + resume command). Only Phase 6 is an integration
> boundary; every earlier gate confirms work committed locally on `final-delivery`, with no PR,
> merge, or deployment.
>
> **Executor environment note — RTK-wrapped commands emit an empty-output marker, not true
> emptiness**: this repo routes `git` (and other commands) through RTK via a Claude Code hook (see
> `CLAUDE.md` §RTK). For `git diff`, a **non-empty** result gets a three-line trailer appended
> (blank, `--- Changes ---`, blank), so `| wc -l` reads `N + 3` and `| grep -c .` reads `N + 1` for `N`
> changed paths. In the **clean** state the two forms **diverge**: `| grep -c .` reads `0`, but
> `| wc -l` reads `1` (a lone newline, not true zero-byte emptiness). **Every zero-assertion in this
> plan uses `| grep -c .`, never `| wc -l`, for exactly this reason.** `grep -c .` on a genuine
> zero-count exits status `1` — read the **printed number**, never `&&`-chain the command. Never use
> an `ls`-based emptiness assertion (`ls <dir> | wc -l` is unreliable under RTK for the same family of
> reasons; unrelated to the `git diff` trailer specifically).

## One-PR delivery contract (binding, 2026-08-01)

This 5-course plan is one inseparable delivery unit: every Phase 1–6 change lands in **one
worktree, one branch, and exactly one draft PR**. Courses may still be authored, checked, and
committed in their dependency order, but no intermediate phase may push, open a PR, run the PR
merge, deploy, or record a merge SHA. Only Phase 6 opens the draft PR, after all
course work, verification, and Knowledge Capture are green; it includes the archival move to
`plans/done/`, then runs the secret scan, local quality checks, and PR quality-gate verification, CI verification, ready-for-review
transition, and the normal `[AI]` merge/deploy protocol. This contract supersedes every older
cohort or delivery-boundary PR reference below.

The `worktrees/ayokoding-learning-path-09-course-authoring-interview-technique/` path below is
this plan's only worktree; no per-course, cohort, phase, or closeout worktree is created.

## Worktree

Worktree path: `worktrees/ayokoding-learning-path-09-course-authoring-interview-technique/`

Provision this path exactly once with `claude --worktree ayokoding-learning-path-09-course-authoring-interview-technique` (or `git worktree add -b worktree/ayokoding-learning-path-09-course-authoring-interview-technique worktrees/ayokoding-learning-path-09-course-authoring-interview-technique origin/main` when provisioning manually). Both forms designate the same one worktree; never create a second path for a phase, course, or closeout.

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
`final-delivery` branch in the declared worktree. Phases before 6 must not push, open
a PR, start an external merge, deploy, or record an in-repository merge SHA. Phase 6 first
commits the archival move and index updates, then opens the sole draft PR, runs the secret scan, local quality checks, and PR quality-gate verification plus local and CI gates, marks it ready, merges under the hardened
preconditions, and deploys once.

## Content-only delivery safeguards

This plan produces content only and has exactly one final PR. It has no review-cycle requirement. Before pushing that PR:

- [x] [AI] Inspect the staged diff and confirm it contains no machine-secret value.
- [x] [AI] Use a scoped Conventional Commit (for example, `docs(plans): refresh course-preparation backlog`).
- [x] [AI] Run `apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push`; acceptance: exits 0 for the affected scope.
- [x] [AI] Push the single branch, then wait for `.github/workflows/pr-quality-gate.yml`; acceptance: the PR quality gate is green before merge.

## Depends-on

| Relation      | Plan (full folder name)                                        | Nature                                                                                                                                                                                                                         |
| ------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **blockedBy** | `ayokoding-learning-path-08-course-authoring-security-and-ops` | **Hard; sole direct execution prerequisite.** It must be fully merged and archived on `origin/main` before Phase 0. All earlier completion and repository-baseline facts are transitive context, not extra plan prerequisites. |

**Phase 0 start check:** `git ls-tree -r --name-only origin/main plans/done | rg -q "__ayokoding-learning-path-08-course-authoring-security-and-ops/README\.md$"` exits 0. This is this plan's only plan-level start gate.

## Parallelization Model

**Cap**: honor the in-force subagent/PR-review concurrency cap (parallel-by-default, background
subagents capped per the orchestration convention). The main thread self-promotes nothing.

- **Phase 0** is a single serial baseline.
- **Phase 1 (5 Band-9 courses)** — the four interview-technique courses are content-independent
  (each writes only its own `<COURSES><id>/` subtree) and may author/check concurrently, bounded by
  the cap. `capstone-interview-loop` has a hard ordering constraint: it declares all four as
  prerequisites, so it is authored **after** the four (or in the same once all four
  bundles exist on the shared branch).
- **Phases 2–6 (finalization)** are serial — each consumes the prior phase's output.

**Path constants** (referenced throughout):

- `<COURSES>` = `apps/ayokoding-www/content/en/learn/courses/` (course bundles; served at `/en/learn/courses/<course-id>`)
- `<FEAT>` = `apps/ayokoding-www/src/features/course-paths/` (**never written here**)
- `<MANIFESTS>` = `<FEAT>manifests/` (**never written here** — downstream manifest-plan property; read-only reference only)
- `<SYLLABUS>` = `../../done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/` (cross-plan authoring source of truth — **never copied**)
- `<SYLLABUS_ROOT>` = `<SYLLABUS>courses/` (discovered and verified in Phase 0's blocking-plan-#2 check,
  recorded in `evidence/phase-0-snapshot.txt`). Written as a doc-macro placeholder — like `<COURSES>`
  above — never as a `$SYLLABUS_ROOT` shell variable: exported shell state does not persist across
  this harness's separate tool-invocation boundaries, so every reference below substitutes the literal
  path directly rather than relying on a re-export.

### Delivery Boundaries

| Phase(s) | Delivery unit                                               | Worktree / branch                                                         | PR opens                           |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------- |
| 0        | Setup and baseline                                          | No delivery worktree or PR                                                | no                                 |
| 1–5      | Intermediate authoring, verification, and Knowledge Capture | This plan's single declared worktree and persistent final-delivery branch | no — commit only                   |
| 6        | Final archival and integration                              | The same worktree and branch; archive before opening the PR               | yes — exactly once, after archival |

No phase may create an additional worktree or branch. The final phase is the only delivery boundary.

## Phase 0: Environment Setup & Baseline

> _Executor: repo-setup-manager_
>
> **Cross-plan precondition (hard).** Four preconditions gate this phase — two upstream plans merged,
> the parent plan's own Phase 0 baseline established, and the `vercel-function-cost-reduction` fix
> landed. A body authored before any of these lands into the wrong place, from a spec that does not
> yet exist, or onto a site that is still knowingly over-cost.

- [x] [AI] **Promote out of `plans/backlog/` first — on the local `main` checkout, before any worktree exists.**
      Run `git mv plans/backlog/ayokoding-learning-path-09-course-authoring-interview-technique/ plans/in-progress/ayokoding-learning-path-09-course-authoring-interview-technique/`
      (a pure move — neither stage carries a date prefix), update `plans/backlog/README.md` and
      `plans/in-progress/README.md`, commit on the plan branch and include the move in the one final PR — acceptance:
      `git ls-tree -r --name-only origin/main -- plans/in-progress/ayokoding-learning-path-09-course-authoring-interview-technique/README.md | grep -c .`
      returns **1** and the same query against `plans/backlog/ayokoding-learning-path-09-course-authoring-interview-technique/README.md` returns **0**.
      Falsifiable both ways: before the push lands, the first query returns 0 and the second
      returns 1. Execution never runs out of `plans/backlog/` — this push is a mandatory
      precondition, not a courtesy. See
      [plan-execution → Execute Plan from Backlog](../../../repo-governance/workflows/plan/plan-execution/example-usage-and-iteration-example.md#execute-plan-from-backlog).
- [x] [AI] Enter/provision the worktree and install dependencies: `npm install` — acceptance: exits 0,
      `node_modules/` synchronized.
- [x] [AI] Converge the toolchain: `npm run doctor -- --fix` — acceptance: exits 0 with no unresolved
      drift.
- [x] [AI] **Verify repository baseline** — the `<COURSES>` bucket exists and holds at least the 37
      re-homed bundles — command (single line):
      `test -d apps/ayokoding-www/content/en/learn/courses && test -f apps/ayokoding-www/content/en/learn/courses/_index.md && git ls-files -- 'apps/ayokoding-www/content/en/learn/courses/*/_index.md' | awk -F/ 'NF==8' | grep -c .`
      — acceptance: both `test` commands exit 0 and the count returns **at least 37**. Depth-filter
      with `awk -F/ 'NF==8'` (8 = the fixed path-component count of
      `apps/ayokoding-www/content/en/learn/courses/<slug>/_index.md`) — an un-filtered
      `git ls-files` count over-reports because each bundle also nests `drilling/_index.md` and
      `learning/_index.md` at deeper path levels. Falsifiable both ways: before the URL-restructure
      plan merges, the leading `test -d` exits non-zero and the `&&` chain short-circuits with no
      number printed at all; a count below 37 means the re-home is incomplete.
- [x] [AI] **Verify repository baseline** — the cross-plan syllabus layer is on `origin/main` and
      holds the 5 Band-9 spec files — command (single line):
      `git ls-files -- 'plans/done/*ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/courses/README.md'`
      — acceptance: (a) prints **exactly one** path (pipe to `grep -c .`, read **1**); its directory is
      `<SYLLABUS_ROOT>`. (b) `test -d "<SYLLABUS_ROOT>"` exits 0. (c) all 5 spec files exist:
      `for f in coding-interview take-home-and-live-coding system-design-interview behavioral-and-leadership-interviews capstone-interview-loop; do test -f "<SYLLABUS_ROOT>/$f.md" || echo "MISSING $f"; done | grep -c .`
      returns `0`. Record the printed path to `evidence/phase-0-snapshot.txt` as
      `SYLLABUS_ROOT=<path>`. **Do not write this as a `test -d plans/done/*__…/syllabus/courses`
      glob** — this harness runs zsh, where an unmatched glob is a fatal error, not a literal; `git
ls-files` expands its own quoted pathspec so neither zsh nor RTK ever sees the `*`.
- [x] [AI] **Verify repository baseline — the parent plan's own Phase 0 established** — command
      (single line):
      `git log --oneline -1 -- plans/done/2026-08-02__ayokoding-learning-path-04-course-authoring/delivery.md | grep -c .`
      — acceptance: returns **1** (the parent plan's `delivery.md` has at least one commit on
      `origin/main`, i.e. its own Phase 0 has run and been committed). This is a **baseline** check,
      not a full-completion check — see [tech-docs.md §Baseline
      precondition](./tech-docs.md#baseline-precondition-on-plan-04) for why this plan does not require
      all of the parent plan's other 85 non-Band-9 bodies merged first.
- [x] [AI] **Verify repository baseline — the `vercel-function-cost-reduction` Phase 1–4 fix landed** —
      three checks, all required (single line each):
      `test ! -f apps/ayokoding-www/src/app/layout.tsx && echo OK1`;
      `test -f "apps/ayokoding-www/src/app/[locale]/layout.tsx" && echo OK2`;
      `test ! -f apps/ayokoding-www/src/middleware.ts && echo OK3`
      — acceptance: all three print their `OK<n>` marker. Falsifiable both ways: before that plan's
      Phase 1 merges, `apps/ayokoding-www/src/app/layout.tsx` still exists and `OK1` is not printed;
      reintroducing the file after the fix breaks the check again. See [tech-docs.md §The
      vercel-function-cost-reduction precondition](./tech-docs.md#repository-baseline)
      for the full three-phase signal table this check is grounded in.
- [x] [AI] Establish content baselines: `npm exec nx run ayokoding-www:build` and
      `npm exec nx run ayokoding-www:test:unit` — acceptance: both exit 0; record pass state in
      `evidence/phase-0-snapshot.txt`.
- [x] [AI] **Confirm all 5 Band-9 slugs are absent (no collision)** under `<COURSES>`:

  ```bash
  for s in coding-interview take-home-and-live-coding system-design-interview \
    behavioral-and-leadership-interviews capstone-interview-loop; do
    test -e "apps/ayokoding-www/content/en/learn/courses/$s" && echo "EXISTS $s"
  done
  ```

  — acceptance: **zero** output lines. Falsifiable both ways:
  `mkdir -p apps/ayokoding-www/content/en/learn/courses/coding-interview` makes the loop print
  `EXISTS coding-interview`, proving the check fires.

- [x] [AI] **Create the authored-body slug register** — write the 5 slugs this plan authors, one per
      line, to `evidence/authored-body-slugs.txt`:

  ```bash
  cat > evidence/authored-body-slugs.txt <<'EOF'
  coding-interview
  take-home-and-live-coding
  system-design-interview
  behavioral-and-leadership-interviews
  capstone-interview-loop
  EOF
  ```

  — acceptance: `wc -l < evidence/authored-body-slugs.txt` returns **5**, and
  `sort evidence/authored-body-slugs.txt | uniq -d | wc -l` returns **0** (no duplicate slug).

- [x] [AI] **Record the authored-body baseline (the falsifiable-both-ways anchor for archival)** —
      `while read -r s; do test -d "apps/ayokoding-www/content/en/learn/courses/$s" || echo "ABSENT $s"; done < evidence/authored-body-slugs.txt | grep -c .`
      — acceptance: returns **5** today (none authored yet), recorded in
      `evidence/phase-0-snapshot.txt`. The same command must return **0** at archival (Phase 6).
- [x] [AI] Confirm `learnings.md` exists in the plan folder with its H1 — command:
      `test -f learnings.md && head -1 learnings.md` — acceptance: file present and the first line is
      `# Learnings: ayokoding-learning-path-09-course-authoring-interview-technique`.
- [x] [AI] **Cross-plan link gate** — confirm every reference in this plan's own files resolves:

  ```bash
  apps/rhino-cli/scripts/rhino-bin.sh md links validate \
    --quiet \
    --exclude plans/done \
    --exclude apps/ayokoding-www/content \
    --exclude apps/ose-www/content 2>&1 | grep -F "ayokoding-learning-path-09-course-authoring-interview-technique"
  ```

  — acceptance: the `grep` finds **no** matching line (exits 1).

- [x] [AI] **Confirm no manifest file changed in this phase** — this phase opens **no** PR (the
      Delivery-Boundary Integration Protocol applies from Phase 1 onward), but the manifest-isolation
      assertion still holds:
      `git diff --name-only origin/main...HEAD -- 'apps/ayokoding-www/src/features/course-paths/manifests/' | grep -c .`
      — acceptance: returns **0**.

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `npm install` exited 0 and `npm run doctor -- --fix` reports no unresolved drift.
- [x] [AI] All four blocking preconditions verified: `<COURSES>` bucket populated (≥ 37 bundles);
      `<SYLLABUS_ROOT>` located with all 5 Band-9 specs present; the parent plan's own Phase 0 baseline
      committed; the `vercel-function-cost-reduction` three-check signal (`OK1`/`OK2`/`OK3`) all print.
- [x] [AI] `ayokoding-www:build` + `test:unit` baselines recorded green.
- [x] [AI] All 5 Band-9 slugs confirmed absent (zero `EXISTS` lines).
- [x] [AI] `evidence/authored-body-slugs.txt` holds 5 unique slugs; the ABSENT-count baseline of 5 is
      recorded in `evidence/phase-0-snapshot.txt`.
- [x] [AI] Cross-plan link gate green (no line naming this plan's folder).
- [x] [AI] Zero manifest files touched.
- [x] [AI] **No PR was opened for this phase and nothing was pushed**:
      `git ls-remote --heads origin "$(git branch --show-current)" | grep -c .` returns **0**, and
      `gh pr list --head "$(git branch --show-current)" --json number --jq 'length'` returns **0**.

> **Pause Safety**: only the toolchain, the four upstream preconditions, and the slug register were
> established — no course body exists yet, nothing is pushed, and no PR exists. Safe to stop
> indefinitely. To resume: re-run the four blocking-plan verification commands and the baseline build.

---

## Phase 1: Author the 5 interview-technique courses (Band 9)

> Each course is authored as a full page-bundle into `<COURSES><course-id>/`. The four
> interview-technique courses are content-independent and may pipeline through review concurrently,
> bounded by the cap; `capstone-interview-loop` follows once all four exist on the shared branch,
> since it declares them all as prerequisites. Per-course concept/example/prerequisite/capstone detail
> is **already settled** in the cross-plan
> [`syllabus/courses/`](../../done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/courses/README.md) —
> author each course body from its `<SYLLABUS_ROOT>/<id>.md` spec, not from a fresh judgment call.

### Per-course authoring convention (applies to every course below)

1. [AI] **V (accuracy pre-verify)** — spot-check any dated, company-specific, or market-facing claim
   (e.g. a cited interview-loop format) via `web-researcher` — acceptance: no version- or
   market-pinned claim written `[Unverified]`; every volatile fact sits in a dated accuracy-note
   sidebar, not the stable spine.
2. [AI] **Skeleton** — create `<COURSES><course-id>/` (`_index.md` with `prerequisites: [...]` +
   `overview.md` + `learning/_index.md` + `drilling/_index.md`), mirroring the sibling bundle shape;
   the `course-id` slug and prerequisite chain are **settled** — use the exact values declared in
   `<SYLLABUS_ROOT>/<course-id>.md` — acceptance: `test -d "<COURSES><course-id>"`,
   `test -d "<COURSES><course-id>/learning"`, and `test -d "<COURSES><course-id>/drilling"` all exit
   0, and `grep -F -q 'prerequisites:' "<COURSES><course-id>/_index.md"` exits 0.
3. [AI] **Author learning track** — `overview.md` (purpose + `## Prerequisites` naming only earlier
   library courses + the refresh register, per `prd.md`), concept coverage, example/scenario pages +
   colocated `code/` where code-bearing, and `learning/capstone/` where applicable — acceptance: the
   course's own `overview.md` states its scope boundary against any sibling course it could be
   confused with.
4. [AI] **Author drilling track** — `drilling/overview.md` in the fixed five-section order —
   acceptance: all five sections present.
5. [AI] **Run content checkers** — the matching learning checker, `apps-ayokoding-www-facts-checker`,
   and `apps-ayokoding-www-link-checker` (plus `apps-ayokoding-www-general-checker` on
   `drilling/overview.md`) — acceptance: findings recorded. _(Content authoring is a
   maker-checker-fixer cycle, not code TDD — see
   [tech-docs.md §TDD exemption](./tech-docs.md#tdd-exemption-this-plan-ships-no-application-code).)_
6. [AI] **Apply content fixers** — resolve every CRITICAL/HIGH/MEDIUM finding via the matching fixer —
   acceptance: every finding addressed.
7. [AI] **Re-verify** — re-run checkers + `npm exec nx run ayokoding-www:build` + `npm run lint:md` —
   acceptance: zero CRITICAL/HIGH/MEDIUM remain; build + lint exit 0.
8. [AI] **Confirm no manifest file changed in this course's own diff**:
   `git diff --name-only origin/main...HEAD -- 'apps/ayokoding-www/src/features/course-paths/manifests/' | grep -c .`
9. [AI] **Licensing self-check (programme A8)** — grep this course's own worked-example code for the
   CC-BY-SA Stack Overflow hazard:
   `grep -rn 'stackoverflow\.com\|reddit\.com' "<COURSES><course-id>/learning/code/" 2>/dev/null | grep -c .`
   — acceptance: prints `0` (a zero-count `grep -c` exits 1 — do not chain with `&&`; read the printed
   output).

### The 5 courses

- [x] [AI] `coding-interview` (By Example · Python, patterns language-agnostic; 24 concepts, 56 worked
      examples, settled per `<SYLLABUS_ROOT>/coding-interview.md`, 282 lines) — reload LeetCode-style
      pattern recognition + time-boxed problem-solving narration; hosts the interview-loop map —
      acceptance: all 9 convention steps complete; checkers report zero CRITICAL/HIGH/MEDIUM;
      `grep -F -q 'assumes' "<COURSES>coding-interview/overview.md"` exits 0 (the refresh register is
      stated).
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_

- [x] [AI] `take-home-and-live-coding` (By Example · Python; 22 concepts, 50 worked examples, settled
      per `<SYLLABUS_ROOT>/take-home-and-live-coding.md`, 269 lines) — time-boxed take-home + observed
      live/pair technique: scope, test, README hygiene, thinking aloud — acceptance: all 9 convention
      steps complete; checkers report zero CRITICAL/HIGH/MEDIUM;
      `grep -F -q 'assumes' "<COURSES>take-home-and-live-coding/overview.md"` exits 0.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_

- [x] [AI] `system-design-interview` (Annotated-concept · no code; 22 concepts, 44 worked scenarios,
      settled per `<SYLLABUS_ROOT>/system-design-interview.md`, 263 lines; forward-links
      `system-design`) — the senior/staff system-design interview rubric + whiteboard flow —
      acceptance: all 9 convention steps complete; checkers report zero CRITICAL/HIGH/MEDIUM;
      `grep -F -q 'assumes' "<COURSES>system-design-interview/overview.md"` exits 0 **and**
      `grep -F -q 'system-design' "<COURSES>system-design-interview/overview.md"` exits 0 (the rubric
      course forward-links the depth course rather than re-teaching it, DD-10).

  **Gherkin (binds) →** "The system-design-interview course forward-links depth rather than
  re-teaching it"

  ```gherkin
  Scenario: The system-design-interview course forward-links depth rather than re-teaching it
    Given the system-design-interview course is authored
    When a reader compares its overview against the system-design course
    Then it teaches only the interview rubric and whiteboard flow
    And it forward-links system-design for architecture depth rather than re-teaching it
  ```

  - _Suggested executor: `apps-ayokoding-www-annotated-concept-maker`_

- [x] [AI] `behavioral-and-leadership-interviews` (Annotated-concept · no code; 22 concepts, 42 worked
      scenarios, settled per `<SYLLABUS_ROOT>/behavioral-and-leadership-interviews.md`, 256 lines) —
      convention complete; checkers clean — coverage acceptance: the learning track explicitly covers
      framing an employment gap, a layoff, and a re-entry story, and treats senior/staff/EM leadership
      rounds as core (not optional) material. Verify:
      `for w in "employment gap" "layoff" "re-entry"; do grep -F -q -r -i "$w" "<COURSES>behavioral-and-leadership-interviews/learning/" || echo "MISSING $w"; done | grep -c .`
      returns **0** (returns 3 before this step, since the directory does not exist yet) **and**
      `grep -F -q 'assumes' "<COURSES>behavioral-and-leadership-interviews/overview.md"` exits 0.

  **Gherkin (binds) →** "The behavioral course covers the layoff and employment-gap narrative"

  ```gherkin
  Scenario: The behavioral course covers the layoff and employment-gap narrative
    Given the behavioral-and-leadership-interviews course is authored
    When an experienced re-entrant reads its learning track
    Then it explicitly covers framing an employment gap, a layoff, or a re-entry story
    And it treats senior/staff/EM leadership rounds as core material
  ```

  - _Suggested executor: `apps-ayokoding-www-annotated-concept-maker`_

- [x] [AI] **Verify the refresh register across all four interview courses** — each course's
      `overview.md` states it assumes prior professional experience and frames the material as
      technique/breadth refresh, never a from-zero concept teach. Verify:
      `for s in coding-interview take-home-and-live-coding system-design-interview behavioral-and-leadership-interviews; do grep -F -q -i "assumes" "<COURSES>$s/overview.md" || echo "MISSING $s"; done | grep -c .`
      returns **0** (returns 4 before this phase, since none of the four directories exists yet).

  **Gherkin (binds) →** "Interview courses are written in a refresh register"

  ```gherkin
  Scenario: Interview courses are written in a refresh register
    Given the four new interview-technique courses are authored
    When an experienced engineer reads them
    Then each assumes prior professional experience and focuses on interview technique and breadth refresh
    And none teaches core concepts from zero
  ```

- [x] [AI] `capstone-interview-loop` (Interview milestone · Python + prose; integrates the four
      courses above, no new concepts of its own, settled per
      `<SYLLABUS_ROOT>/capstone-interview-loop.md`, 98 lines; five ordered artefacts: coding round,
      take-home + live round, system-design walkthrough, behavioral mock round, score sheet) —
      convention complete; checkers clean — acceptance: its `_index.md` declares all four interview
      courses as prerequisites:
      `for s in coding-interview take-home-and-live-coding system-design-interview behavioral-and-leadership-interviews; do grep -F -q "$s" "<COURSES>capstone-interview-loop/_index.md" || echo "MISSING $s"; done | grep -c .`
      returns **0**.

  **Gherkin (binds) →** "The coding-agent capstone assembles the four interview courses into a
  runnable mock loop"

  ```gherkin
  Scenario: The coding-agent capstone assembles the four interview courses into a runnable mock loop
    Given the four interview-technique courses and capstone-interview-loop are authored
    When a reader completes the capstone
    Then they run a coding round, a take-home/live round, a system-design round, and a behavioral round
    And their `_index.md` declares all four interview courses as prerequisites
  ```

  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_

- [x] [AI] Run `npm exec nx run ayokoding-www:generate-indexes`; do not manually edit `<COURSES>_index.md`
      ID, in the order authored above — acceptance:
      `for s in coding-interview take-home-and-live-coding system-design-interview behavioral-and-leadership-interviews capstone-interview-loop; do grep -F -q "$s" "<COURSES>_index.md" || echo "MISSING $s"; done | grep -c .`
      returns **0**.

- [x] [AI] **Record the one band-completion signal** — append the following fenced `text` block,
      verbatim in structure, to this file on `final-delivery`; downstream work consumes it only after
      this plan's terminal archival PR merges
      immediately below this step:

  ```text
  BAND: Band 9 — Interview-technique courses
  PLAN: ayokoding-learning-path-09-course-authoring-interview-technique
  LANDED_COURSE_IDS:
    coding-interview
    take-home-and-live-coding
    system-design-interview
    behavioral-and-leadership-interviews
    capstone-interview-loop
  GROW_MANIFESTS:
    <MANIFESTS>careers/interview-ready/software-engineer.json
    <MANIFESTS>careers/fundamentally-strong/software-engineer.json
  ```

  ```text
  BAND: Band 9 — Interview-technique courses
  PLAN: ayokoding-learning-path-09-course-authoring-interview-technique
  LANDED_COURSE_IDS:
    coding-interview
    take-home-and-live-coding
    system-design-interview
    behavioral-and-leadership-interviews
    capstone-interview-loop
  GROW_MANIFESTS:
    <MANIFESTS>careers/interview-ready/software-engineer.json
    <MANIFESTS>careers/fundamentally-strong/software-engineer.json
  ```

  — acceptance: the block names **exactly two** `GROW_MANIFESTS` paths, never three; the receiving
  plan (`ayokoding-learning-path-12-careers-se-manifests`) rejects an incomplete signal rather than
  guessing.

  **Gherkin (binds) →** "The band-completion signal names exactly the two manifests this band feeds"

  ```gherkin
  Scenario: The band-completion signal names exactly the two manifests this band feeds
    Given all 5 Band-9 bodies are authored on this plan's final-delivery branch
    When the band-completion signal is recorded in delivery.md
    Then GROW_MANIFESTS names exactly careers/interview-ready/software-engineer.json and careers/fundamentally-strong/software-engineer.json
    And it does not name careers/immediately-effective/software-engineer.json
  ```

### Phase 1 Gate

> All checks below must pass before starting Phase 2.

- [x] [AI] All 5 bodies exist:
      `for s in coding-interview take-home-and-live-coding system-design-interview behavioral-and-leadership-interviews capstone-interview-loop; do test -d "<COURSES>$s" || echo "ABSENT $s"; done | grep -c .`
      returns **0** (returns 5 before this phase).
- [x] [AI] The refresh-register loop returns 0 across all four interview courses; the
      employment-gap/layoff/re-entry loop returns 0; `capstone-interview-loop` declares all four as
      prerequisites.
- [x] [AI] `system-design-interview` forward-links `system-design` rather than re-teaching depth
      (DD-10).
- [x] [AI] Checkers clean across all 5; build + `lint:md` exit 0.
- [x] [AI] `<COURSES>_index.md` carries all 5 new entries.
- [x] [AI] Band-completion signal recorded naming **exactly two** manifests; zero manifest files
      touched (`git diff --name-only origin/main...HEAD -- 'apps/ayokoding-www/src/features/course-paths/manifests/' | grep -c .`
      returns 0).
- [x] [AI] Commit this phase's checked artifacts on the persistent final-delivery branch — acceptance:
      no PR, merge, or deployment occurs before Phase 6. The band-completion signal is committed with
      the authored bodies and becomes consumable only after the Phase 6 terminal archival PR merges.

> **Pause Safety**: all 5 authored bodies and the band-completion signal are committed on
> `final-delivery`; they are not yet on `origin/main`. The library is content-complete from this
> plan's side. Safe to stop.
> To resume: re-run the 5-slug presence check and the section build.

---

## Phase 2: Section & Authored-Tree Verification

- [x] [AI] **Verify all 5 authored bodies are present** —
      `while read -r s; do test -d "<COURSES>$s" || echo "ABSENT $s"; done < evidence/authored-body-slugs.txt | grep -c .`
      — acceptance: returns **0**. Falsifiable both ways: this returned **5** at the Phase-0 baseline.
- [x] [AI] **Verify every authored body declares prerequisites** —
      `while read -r s; do grep -F -q 'prerequisites:' "<COURSES>$s/_index.md" || echo "MISSING $s"; done < evidence/authored-body-slugs.txt | grep -c .`
      — acceptance: returns **0** (returns 5 at baseline).
- [x] [AI] **Verify every authored body has both tracks** —
      `while read -r s; do test -d "<COURSES>$s/learning" && test -d "<COURSES>$s/drilling" || echo "INCOMPLETE $s"; done < evidence/authored-body-slugs.txt | grep -c .`
      — acceptance: returns **0**.
- [x] [AI] **Supersession sweep — not applicable.** All 5 Band-9 bodies are Origin `N` (new), with no
      legacy `fundamentally-strong/software-engineer/` home — the parent plan's Q-A supersession
      obligation (a "superseded by" line for a course whose subject is covered by a legacy page)
      applies only to re-homed shipped topics 1–33, none of which this plan authors. No conditional
      sweep step is needed here.
- [x] [AI] Run the full authored-tree build and lint sweep:
      `npm exec nx run ayokoding-www:build`, `npm run lint:md`, and the link-validation command from
      [tech-docs.md §Cross-plan syllabus/ reference rule](./tech-docs.md#cross-plan-syllabus-reference-rule-binding)
      — acceptance: all three exit 0 / print no matching line.

  **Gherkin (binds) →** "The authored Band-9 course library builds and validates green"

  ```gherkin
  Scenario: The authored Band-9 course library builds and validates green
    Given all 5 course bodies this plan authors have landed under the courses bucket
    When the ayokoding-www build, markdownlint, link validation, and heading-hierarchy validation run
    Then the build succeeds over the 5 authored course bodies
    And link, heading-hierarchy, and markdownlint validation report no errors across them
  ```

- [x] [AI] Run heading-hierarchy validation over the 5 authored bodies (per the content-quality
      checker suite already invoked in Phase 1) — acceptance: zero heading-hierarchy violations
      reported for any of the 5 course bundles.

### Phase 2 Gate

- [x] [AI] All 5 presence/prerequisite/track checks return 0.
- [x] [AI] Build, `lint:md`, and link validation all pass with zero findings for this plan's own
      files.
- [x] [AI] Work committed to the persistent `final-delivery` branch; nothing pushed for review yet.

> **Pause Safety**: the authored tree is structurally verified. Safe to stop. To resume: re-run the
> three presence/prerequisite/track loops and the build/lint/link sweep.

---

## Phase 3: Manual Behavioral Verification (Playwright MCP) — `en` locale, all 3 breakpoints

> **Rule-15 exemption reused (narrow).** Per [README.md §Not
> UI-bearing](./README.md#not-ui-bearing-rule-15-exemption-reused-reasoning), the three-tester triad
> (`web-exploratory-tester` / `web-usability-tester` / `web-design-tester`) is waived — this plan ships
> no screen. Manual Playwright verification below is still **mandatory**.
>
> **Single-locale scope (stated inline, not just cross-referenced).** This phase verifies the `en`
> locale only, across all 5 pages and all 3 breakpoints. No `id` (Indonesian) content exists for these
> 5 course IDs — this plan authors `en`-only bodies per its own Business-Scope Non-Goals (see
> [brd.md §Business-Scope Non-Goals](./brd.md#business-scope-non-goals)) — so there is no `id` page to
> navigate to or verify; this is a recorded content-scope deferral, not an incomplete locale sweep.

- [x] [AI] Start the dev server: `npm exec nx dev ayokoding-www`.
- [x] [AI] For each of the 5 authored course pages, at each of 3 breakpoints (375 / 768 / 1280 px),
      navigate to `/en/learn/courses/<course-id>` via `browser_navigate` + `browser_resize`.
- [x] [AI] Inspect DOM via `browser_snapshot` — verify `html[lang="en"]`, the prerequisites list
      renders, and no untranslated or placeholder string appears.
- [x] [AI] Check for JS errors via `browser_console_messages` — must be zero errors per page.
- [x] [AI] Capture one screenshot per course per breakpoint via `browser_take_screenshot`, saved to
      `evidence/phase-3-<course-id>-en-<breakpoint>px.png` (15 screenshots: 5 courses × 3 breakpoints).
- [x] [AI] Document evidence in this checklist: reference each screenshot
      (`![alt](./evidence/phase-3-<course-id>-en-<breakpoint>px.png)`).
- [x] [AI] **Locale deferral stated inline** — an `id` (Indonesian) walk-through of these 5 courses is
      not performed; the `id` mirror is explicitly deferred per [brd.md §Business-Scope
      Non-Goals](./brd.md#business-scope-non-goals), not a silent omission.

Playwright MCP ran against the green production build from this worktree. The required `nx dev` process
was started but stalled while compiling its first route; `next start` on the same local build served each
route for direct rendered-page checks. Every capture returned HTTP 200, `html[lang="en"]`, no placeholder
text, and zero console errors. `behavioral-and-leadership-interviews` correctly has no rendered list items
because its settled prerequisite array is empty.

![Coding Interview, 375 px](./evidence/phase-3-coding-interview-en-375px.png)
![Coding Interview, 768 px](./evidence/phase-3-coding-interview-en-768px.png)
![Coding Interview, 1280 px](./evidence/phase-3-coding-interview-en-1280px.png)
![Take-Home and Live Coding, 375 px](./evidence/phase-3-take-home-and-live-coding-en-375px.png)
![Take-Home and Live Coding, 768 px](./evidence/phase-3-take-home-and-live-coding-en-768px.png)
![Take-Home and Live Coding, 1280 px](./evidence/phase-3-take-home-and-live-coding-en-1280px.png)
![System-Design Interview, 375 px](./evidence/phase-3-system-design-interview-en-375px.png)
![System-Design Interview, 768 px](./evidence/phase-3-system-design-interview-en-768px.png)
![System-Design Interview, 1280 px](./evidence/phase-3-system-design-interview-en-1280px.png)
![Behavioral and Leadership Interviews, 375 px](./evidence/phase-3-behavioral-and-leadership-interviews-en-375px.png)
![Behavioral and Leadership Interviews, 768 px](./evidence/phase-3-behavioral-and-leadership-interviews-en-768px.png)
![Behavioral and Leadership Interviews, 1280 px](./evidence/phase-3-behavioral-and-leadership-interviews-en-1280px.png)
![Capstone Interview Loop, 375 px](./evidence/phase-3-capstone-interview-loop-en-375px.png)
![Capstone Interview Loop, 768 px](./evidence/phase-3-capstone-interview-loop-en-768px.png)
![Capstone Interview Loop, 1280 px](./evidence/phase-3-capstone-interview-loop-en-1280px.png)

### Phase 3 Gate

- [x] [AI] 15 screenshots committed under `evidence/`, one per course per breakpoint, `en` locale.
- [x] [AI] Zero JS console errors across all 5 pages at all 3 breakpoints.
- [x] [AI] Work committed to the persistent `final-delivery` branch; nothing pushed for review yet.

> **Pause Safety**: manual verification evidence is committed locally. Safe to stop. To resume:
> re-open the dev server and re-capture any missing screenshot.

---

## Phase 4: Pre-PR CI Readiness Verification

- [x] [AI] Run the applicable local quality gates against the persistent `final-delivery` branch.
- [x] [AI] If any check fails, fix it on `final-delivery` before proceeding; do not push or open a PR.

### Phase 4 Gate

- [x] [AI] The applicable local quality gates on `final-delivery` are green.
- [x] [AI] No unresolved CI failure remains.

> **Pause Safety**: this plan's local readiness checks are green on `final-delivery`. Safe to stop.
> To resume: re-run the applicable local quality gates.

---

## Phase 5: Knowledge Capture

- [x] [AI] Apply the litmus test to every `learnings.md` entry — keep only entries where a durable
      surface would catch this automatically next time; discard the rest with a one-line reason.
- [x] [AI] Apply the **secret/sensitivity gate** to every surviving entry — sanitize to `<placeholder>`
      tokens or discard if the entry cannot be sanitized without losing its meaning.
- [x] [AI] Apply the **repo-relevance gate** to every surviving entry — this repo is `ose-public`; a
      public-governance learning may route to `repo-governance/` or `docs/` here, never to
      the private sibling.
- [x] [AI] Route each surviving entry to exactly one durable home (`repo-governance/`, `docs/`, an
      agent, a skill, or a `plans/backlog/` follow-up plan for larger non-code work).
- [x] [AI] **Code-routing rule**: if a learning's home is `apps/`, `libs/`, or tests, file it as a
      separate `plans/backlog/` plan — never land it inline in this plan's own commits/PR. The sole
      carve-out is a bug/lint/test failure that blocks THIS plan's own scope, fixed inline as ordinary
      Root Cause Orientation work.
- [x] [AI] Record the terminal state of every entry (routed inline / filed as backlog at `<path>` /
      discarded with reason) directly in `learnings.md`.
- [x] [AI] For any entry routed to `plans/ideas/`, scan `plans/ideas/README.md` and the existing
      two-pagers FIRST for a brief already covering the same problem or area — fold the learning into
      that brief instead of creating a new file; only create a new `plans/ideas/<slug>.md` when the
      scan confirms no existing brief overlaps (see
      [Integrate Before You Add](../../../repo-governance/conventions/structure/plans/ideas-folder-overview-rationale-and-file-layout.md#integrate-before-you-add-no-duplicate-two-pagers))
      — acceptance: the entry's routing line names either the folded-into brief or confirms the
      overlap scan found nothing.
- [x] [AI] If execution genuinely surfaced no generalizable learning, record the explicit escape
      `No generalizable learnings — <one-line reason>` instead.

### Phase 5 Gate

- [x] [AI] Verify every `learnings.md` entry has reached a terminal state (routed / filed / discarded)
      or the explicit "none" escape is present.
- [x] [AI] Verify no code-homed learning landed inline — every code-routed learning has a corresponding
      `plans/backlog/` folder.

> **Pause Safety**: all learnings are triaged to durable homes or explicitly discarded; nothing is
> left dangling in `learnings.md`. Safe to stop. To resume: re-check `learnings.md` for any entry
> without a terminal-state marker.

---

## Phase 6: Plan Archival

### Sole PR integration (binding)

- [x] [AI] Archive this plan on its persistent final-delivery branch before review — acceptance: the archive move and index updates are committed in the same branch.
- [x] [AI] Open exactly one draft PR from that branch and run the secret scan, local quality checks, and PR quality-gate verification plus every local and CI gate — acceptance: the PR is the only PR for this plan.
- [x] [AI] Mark the PR ready, merge under the hardened preconditions, and deploy once — acceptance: the merge/deploy record is the plan's sole delivery record.

- [x] [AI] Verify ALL delivery checklist items above are ticked.
- [x] [AI] Verify ALL quality gates pass (local + CI): `npm exec nx affected -t typecheck lint test:quick
test:unit specs:behavior:coverage` all exit 0 for `ayokoding-www`. Fix ALL failures, including
      preexisting ones (Root Cause Orientation).
- [x] [AI] Verify ALL manual assertions pass with committed evidence in `evidence/` (15 screenshots +
      the Phase 0/2 snapshot text files).
- [x] [AI] Verify the `en` locale was exercised at all 3 breakpoints across all 5 authored pages (the
      `id` mirror is a recorded deferral, not a gap).
- [x] [AI] **Rule-15 not applicable** — no EWT/UWT/DWT findings exist to resolve; the triad was waived
      per [README.md §Not UI-bearing](./README.md#not-ui-bearing-rule-15-exemption-reused-reasoning).
- [x] [AI] **Rule-16 not applicable** — no API surface exists for this plan.
- [x] [AI] **Verify the plan's own terminal assertion** — the 5 authored-body baseline reads **0**
      ABSENT: `while read -r s; do test -d "apps/ayokoding-www/content/en/learn/courses/$s" || echo "ABSENT $s"; done < evidence/authored-body-slugs.txt | grep -c .`
      returns **0** (returned 5 at the Phase-0 baseline).
- [x] [AI] **Archive the plan folder — on the persistent `final-delivery` branch, before opening the PR**, so
      the archival commit lands inside the same reviewed PR rather than as an unreviewed post-merge
      commit. Move this plan folder from `plans/backlog/` to `plans/done/` via
      `git mv plans/in-progress/ayokoding-learning-path-09-course-authoring-interview-technique plans/done/YYYY-MM-DD__ayokoding-learning-path-09-course-authoring-interview-technique`
      (substitute the actual completion date; the `evidence/` subfolder moves with it).
- [x] [AI] Update `plans/in-progress/README.md` — remove this plan's entry.
- [x] [AI] Update `plans/done/README.md` — add this plan's entry with its completion date.
- [x] [AI] Update any other README that references this plan by its `backlog/` path.
- [x] [AI] Commit: `chore(plans): move ayokoding-learning-path-09-course-authoring-interview-technique to done`.
- [x] [AI] **Open the terminal archival PR** from `final-delivery`, carrying the archival commit above; run the secret scan, local quality checks, and PR quality-gate verification, and `[AI]` merge once all quality gates are green.
- [x] [AI] Prompt the user before removing the worktree
      (`worktrees/ayokoding-learning-path-09-course-authoring-interview-technique/`) — confirm nothing
      is uncommitted or unpushed first.

### Phase 6 Gate

> All checks below must pass before the plan is considered complete.

- [x] [AI] All delivery checklist items in this file are ticked.
- [x] [AI] All quality gates (typecheck, lint, `test:quick`, `test:unit`, `specs:behavior:coverage`)
      pass for `ayokoding-www`, locally and in CI.
- [x] [AI] The plan's own terminal assertion (5-slug ABSENT check) returns **0**.
- [x] [AI] The plan folder move (`git mv` to `plans/done/`) and all three README updates are committed
      on the `final-delivery` branch — verify with
      `git log --oneline -1 -- plans/done/*ayokoding-learning-path-09-course-authoring-interview-technique/README.md | grep -c .`
      returning **1**.
- [x] [AI] The terminal archival PR carrying that archival commit is opened, the secret scan, local quality checks, and PR quality-gate verification is complete, all quality gates are green, and the PR is `[AI]`-merged — confirmed by
      `gh pr list --state merged --head final-delivery --json number --jq 'length'`
      returning **1**.

> **Pause Safety**: the plan is fully archived, all 5 bodies are live on `origin/main`, and the
> band-completion signal is available for `ayokoding-learning-path-12-careers-se-manifests` to consume.
> Nothing further to do. To resume a partial archival: re-run the terminal-assertion check above and
> continue from the first unticked step in this phase.
