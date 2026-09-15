# Delivery Checklist — Learning Path Course Authoring

This checklist authors **21 course bodies** into
`apps/ayokoding-www/content/en/learn/courses/<course-id>/`: the **6 net-new AI-engineering courses**
(Phase 1), **Band 1 — Data depth** (5 bodies, Phase 3), and **Band 2 — Web, backend & platform
productivity** (10 bodies, Phase 4). This plan originally scoped 90 bodies across all nine bands plus
three course-surgery scope contracts; Bands 3–9 and the contracts now belong to 7 successor plans —
see [README §Successor plans](./README.md#successor-plans).

> **This plan never edits a manifest file.** Every file under `<MANIFESTS>` belongs to
> [`ayokoding-learning-path-12-careers-se-manifests`](../../backlog/ayokoding-learning-path-12-careers-se-manifests/README.md)
> (the three `software-engineer`-role manifests) and its sibling
> [`ayokoding-learning-path-13-careers-ai-manifest`](../../backlog/ayokoding-learning-path-13-careers-ai-manifest/README.md)
> (the `ai-engineer` manifest). This
> plan's only outbound artefact is the **band-completion signal** recorded at the end of each band
> phase. See
> [README §The manifest ownership invariant](./README.md#the-manifest-ownership-invariant-binding)
> and
> [tech-docs §The manifest ownership invariant](./tech-docs.md#the-manifest-ownership-invariant-binding).
>
> **Cross-plan source of truth** — the 128-file `syllabus/` detail layer lives in
> [`../../done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/`](../../done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/README.md).
> Every course body is authored **from** its `syllabus/courses/<course-id>.md` spec. **Never copy
> those files into this plan** — a copy forks the source of truth for 121 course specs.
>
> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.
> Git-mechanical steps (worktree create/remove, branch, push, merge) are `[AI]`. **This plan contains
> no `[HUMAN]` step.**
>
> **Phase Gate** — every phase ends with a `### Phase N Gate` (must-pass verification) plus a
> `> **Pause Safety**:` note (safe-to-stop state + resume command). Every gate covers the phase's
> **content correctness** (checkers, build, lint). A gate in a phase named as a delivery boundary in
> the [`### Delivery Boundaries`](#delivery-boundaries) table additionally covers **integration**
> (draft PR opened, 3-cycle PR-Review, CI green, `[AI]` merge, `ayokoding-www` deployed); a gate in an
> **intermediate** phase instead confirms the work is committed to its delivery unit's branch with
> nothing pushed for review yet — see [Plans Organization Convention §PRs Open at Delivery
> Boundaries](../../../repo-governance/conventions/structure/plans/prs-open-at-delivery-boundaries-rules.md#prs-open-at-delivery-boundaries-not-every-phase-hard-rule).
> A phase is not complete until every gate check is green.
>
> **Executor environment note — RTK-wrapped commands emit an empty-output marker, not true
> emptiness**: this repo routes `git` (and other commands) through RTK via a Claude Code hook (see
> `CLAUDE.md` §RTK), and RTK rewrites the output it filters. For `git diff` it appends a three-line
> trailer — blank, `--- Changes ---`, blank — whenever the result is **non-empty**. So for `N` changed
> paths, `| wc -l` prints `N + 3` and `| grep -c .` prints `N + 1`. In the **clean** state the two
> forms **diverge**: `| grep -c .` prints `0`, but `| wc -l` prints `1`, because RTK emits a lone
> newline as an empty-output marker rather than true zero-byte emptiness — precisely the behaviour
> this note is named after. That divergence is the whole reason `grep -c .` is the sanctioned
> zero-assertion form here and `wc -l` is never used for one.
> [Repo-grounded — measured on this tree 2026-07-22, each command issued alone as the whole content of
>
> > one call: 12 changed files gave **15** and **13** respectively; a clean path gave **1** under
> > `wc -l` and **0** under `grep -c .`. An earlier revision of this line claimed the clean state gave
> > "0 and 0"; the `wc -l` half of that was wrong.]
>
> **Every `git diff --name-only …` clause in this plan asserts `0`**, and for that assertion the
> sanctioned form **`| grep -c .`** is exact: the trailer is absent in the clean state, which is the
> only state these clauses accept. The form is **not** exact for a non-zero assertion — do not reuse
> it to count changed files. A clause needing a real count must interpose a `grep -F …` / `grep -E …`
> path filter (the literal `--- Changes ---` matches no path pattern and is dropped) or read the
> command through `rtk proxy git diff …`.
>
> None of this generalizes to `ls` — **never use an `ls`-based emptiness assertion** (an
> `ls <dir> | wc -l` clause asserting 0 is unreliable under RTK).

## One-PR closeout amendment (binding, 2026-08-01)

This plan is a documented historical exception to the 5–15-course planning limit: all 21 scoped
course bodies already landed through earlier, completed PRs. Do not rewrite that history or use it
as a precedent. The remaining execution is Phases 5–9 (including any fixes discovered there), and
it uses **one worktree, one branch, and exactly one draft PR**, opened only in Phase 9 after all
verification and Knowledge Capture are green. Phase 9 moves this plan to `plans/done/` in that PR,
then runs the PR-Review Maker→Fixer Cycle, CI verification, ready-for-review transition, and the
normal `[AI]` merge/deploy protocol.

The `worktrees/ayokoding-learning-path-04-course-authoring/` path below is this plan's only
worktree; no per-course, cohort, phase, or closeout worktree is created.

Every remaining phase before Phase 9 is intermediate: commit its work to the same branch, but do
not push, open a PR, run PR review, merge, deploy, or claim a per-phase `MERGED_COMMIT`. The older
delivery-boundary, cohort-PR, and per-course-PR wording below records completed history only and is
superseded for all unchecked work by this amendment.

## Worktree

Worktree path: `worktrees/ayokoding-learning-path-04-course-authoring/`

This path is the one and only worktree for the entire plan. Provision it once from current
`origin/main`, create the persistent `final-delivery` branch after Phase 0, and use neither
per-course/cohort/stage worktrees nor per-phase branches. Remove it only after the final PR merges.

**Completion reconciliation (2026-08-03).** The historical final-delivery branch was
squash-merged by PR #132 and subsequently deleted from `origin`, so the retained local branch cannot
be fast-forwarded or rebased without replaying already-delivered history. This documentation-only
remediation starts from fresh `origin/main` commit `2dee2b973`; `git merge-base --is-ancestor
origin/main HEAD` passed before the correction. The user authorized its direct push to `origin/main`
and requested this worktree's deletion after that push completes.

## Delivery Mode: worktree-to-pr

This plan has one delivery unit: all change-producing work is committed on the persistent
`final-delivery` branch in the declared worktree. Phases before 9 must not push, open
a PR, run PR review, merge, deploy, or record an in-repository merge SHA. Phase 9 first
commits the archival move and index updates, then opens the sole draft PR, runs the three-cycle
PR-Review Maker→Fixer Cycle plus local and CI gates, marks it ready, merges under the hardened
preconditions, and deploys once.

## Depends-on

| Relation        | Plan (full folder name)                                  | Nature                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **blockedBy**   | `ayokoding-learning-path-01-url-restructure`             | **Hard.** Creates the flat `<COURSES>` bucket + `<COURSES>_index.md` + the 37 re-homed bundles this plan joins.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **blockedBy**   | `ayokoding-learning-path-02-schema-and-prerequisite-dag` | **Hard.** Owns `syllabus/` (every authoring source spec) and the `prerequisites` frontmatter contract.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **blockedBy**   | `vercel-function-cost-reduction`                         | **Hard, assumed already merged per explicit instruction.** Promotes `apps/ayokoding-www/app/[locale]/layout.tsx` to the app's root layout, removes the `?path=` `searchParams` read on the catch-all content route, and deletes `middleware.ts` — the same app/route tree this plan authors ~21 course bundles (~150 rendered pages) into. Verify with `test ! -f apps/ayokoding-www/src/app/layout.tsx` (returns true once that plan's Phase 1 has landed; today, before that plan executes, the old root layout still exists and the check fails — this is a forward-looking precondition, not yet satisfied). |
| **blocks**      | `ayokoding-learning-path-12-careers-se-manifests`        | Its `courseOrder` IDs for the three `software-engineer`-role manifests resolve only after this plan's Band 1/Band 2 bodies land; it consumes those band signals.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **blocks**      | `ayokoding-learning-path-13-careers-ai-manifest`         | Its `courseOrder` IDs for the `ai-engineer` manifest resolve only after this plan's Phase 1 (six AI courses) land; it consumes that band signal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **independent** | `ayokoding-learning-path-03-navigation-ui`               | Same Wave 2. Touches `<FEAT>` app code only; this plan touches content only. No shared file.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

**Start precondition (hard gate, checked in Phase 0)**: all three blocking plans are **merged to
`origin/main`** — `ayokoding-learning-path-01-url-restructure` and
`ayokoding-learning-path-02-schema-and-prerequisite-dag` verified as originally; `vercel-function-cost-reduction`
verified via `test ! -f apps/ayokoding-www/src/app/layout.tsx` (assumed already merged per explicit
instruction — this plan does not re-litigate that plan's own delivery checklist, only checks its
outcome). This plan does not start on a promise. **This precondition must also hold again before the
Band-2 cohort's remaining PR merges** (the active cohort touches the same route tree), re-verified at
that PR's own gate.

## Parallelization Model

**Cap**: honor the in-force subagent/PR-review concurrency cap (parallel-by-default, background
subagents capped per the orchestration convention). The main thread self-promotes nothing.

- **Phase 0** is a single serial baseline.
- **Phase 1 (six AI courses)** — content-independent bodies (each writes only its own
  `<COURSES><id>/` subtree) that **pipeline concurrently** through review, bounded by the cap. One
  ordering constraint: `statistics-for-evaluation` is a **hard prerequisite** of
  `evaluating-ai-systems-in-depth`, so it is authored before (or in the same review cycle as) the
  deep-evals course.
- **Phase 3 (Band 1) and Phase 4 (Band 2)** — bodies within each band are content-independent and
  pipeline concurrently, bounded by the cap. Bands 1 and 2 are mutually independent of each other;
  their listed order is convenience.
- **There is deliberately no Phase 2 in this plan's numbering.** Phase 2 was the course-surgery
  contract-lock phase; it moved to
  `ayokoding-learning-path-06-course-authoring-architecture-and-ai-harness` along with Band 5, the
  band the contracts targeted. Phase 0, Phase 1, Phase 3, and Phase 4 keep their original numbers
  (least-diff renumbering — see [tech-docs.md's numbering note](./tech-docs.md#delivery-flow-across-this-plans-phases)
  for the full rationale); only the finalization tail is renumbered, from the original Phases 12–16
  down to **Phases 5–9**.
- **Phases 5–9 (finalization, formerly 12–16)** is serial.

**Path constants** (referenced throughout):

- `<COURSES>` = `apps/ayokoding-www/content/en/learn/courses/` (course bundles; served at `/en/learn/courses/<course-id>`)
- `<PATHS>` = `apps/ayokoding-www/content/en/learn/paths/` (path-landing anchors — **read-only here**)
- `<SE_OLD>` = `apps/ayokoding-www/content/en/learn/fundamentally-strong/software-engineer/` (legacy home of the 33 shipped topics + 4 existing capstones — **read-only here**; the re-home is the URL-restructure plan's work)
- `<FEAT>` = `apps/ayokoding-www/src/features/course-paths/` (**never written here**)
- `<MANIFESTS>` = `<FEAT>manifests/` (**never written here** — manifest-plan property; read-only reference only)
- `<SYLLABUS>` = `../../done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/` (cross-plan authoring source of truth — **never copied**)

### Delivery Boundaries

| Phase(s) | Delivery unit                                               | Worktree / branch                                                         | PR opens                           |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------- |
| 0        | Setup and baseline                                          | No delivery worktree or PR                                                | no                                 |
| 1–8      | Intermediate authoring, verification, and Knowledge Capture | This plan's single declared worktree and persistent final-delivery branch | no — commit only                   |
| 9        | Final archival and integration                              | The same worktree and branch; archive before opening the PR               | yes — exactly once, after archival |

No phase may create an additional worktree or branch. The final phase is the only delivery boundary.

## Phase 0: Environment Setup & Baseline

> _Executor: repo-setup-manager_
>
> **Cross-plan precondition (hard).** Unlike the source plan, this plan has two blocking predecessors.
> Both must be merged to `origin/main` before any authoring begins — a body authored into a
> `<COURSES>` bucket that does not yet exist lands in the wrong place, and a body authored from a
> `syllabus/` spec that has not landed is authored from nothing.

- [x] [AI] Enter/provision the worktree and install dependencies: `npm install`
      — acceptance: exits 0, `node_modules/` synchronized.
      **Date**: 2026-07-26. **Status**: Done. **Files Changed**: none (dependency install only).
      Ran `npm install` in `worktrees/ayokoding-learning-path-04-course-authoring/` — exited 0,
      1572 packages added, `node_modules/` synchronized.
- [x] [AI] Converge the toolchain: `npm run doctor -- --fix`
      — acceptance: exits 0 with no unresolved drift.
      **Date**: 2026-07-26. **Status**: Done. **Files Changed**: none (toolchain convergence only).
      Ran `npm run doctor -- --fix` — 16/16 tools OK, target-share fixed for 4 crates, exited 0, no
      unresolved drift.
- [x] [AI] **Verify blocking plan #1 merged** — the `<COURSES>` bucket exists and holds the 37 re-homed
      bundles — command (single line):
      `test -d apps/ayokoding-www/content/en/learn/courses && test -f apps/ayokoding-www/content/en/learn/courses/_index.md && git ls-files -- 'apps/ayokoding-www/content/en/learn/courses/*/_index.md' | awk -F/ 'NF==8' | grep -c .`
      — acceptance: both `test` commands exit 0 and the count returns **37** (one top-level `_index.md`
      per re-homed bundle; the bucket's own top-level `_index.md` sits one level up and is not matched).
      **Count with `git ls-files` here, depth-filtered with `awk -F/ 'NF==8'`.** `git ls-files` expands
      its own quoted pathspec so zsh never sees the `*`, but **the `*/` segment does NOT stay a single
      directory level** — each re-homed bundle also contains nested `drilling/_index.md`,
      `learning/_index.md`, and `learning/capstone/_index.md` files that the same glob also matches, so
      an un-filtered count over-reports (**137**, not 37, repo-grounded — measured 2026-07-26 in
      `worktrees/ayokoding-learning-path-04-course-authoring/` via `repo-setup-manager`: 37 at path-depth
      8 — the intended `courses/<slug>/_index.md` bundle files — plus 66 at depth 9, 33 at depth 10, and
      1 at depth 11, all legitimate nested `_index.md` files one or more levels inside a bundle). An
      earlier revision of this passage claimed the `*/` segment stays single-level; it does not — depth
      filtering via `awk -F/ 'NF==8'` (8 = the fixed path-component count of
      `apps/ayokoding-www/content/en/learn/courses/<slug>/_index.md`) is required. **The RTK routing
      rule, stated accurately.** The Claude Code hook rewrites a **bare** `find` — one whose output is not piped —
      to `rtk find`, which reformats the file list into a compact report (`2F 1D:`, a blank line, then
      `./ a.yaml b.yaml`; or the single line `0 for '<pattern>'` when nothing matches) and drops flags
      it does not know, such as `-mindepth`. A line count over that reads _format_ lines, not matches.
      A **piped** `find … | wc -l` is not rewritten and returns real output. Earlier revisions of this
      note claimed the routing was unpredictable; it is not — it is decided by the invocation shape.
      [Repo-grounded — measured 2026-07-22, each command issued **alone as the whole content of one
      call**: piped `find <dir> -name '*.yaml' | wc -l` read the true **2**, and the same query over an
      empty directory read the true **0**. The reformatted report reproduces under a bare `find` or an
      explicit `rtk find`. **Measurement caveat**: an earlier revision cited "10 of 10" and "40 of 40"
      runs collected inside `for` loops — a loop, a `$(…)` substitution, a subshell `( … )`, and a
      redirection to a file each **suppress** the hook, so those counts described the wrapper rather
      than the clause. `git diff` does **not** share this behaviour — its filter fires even when piped
      — so the two commands must never be reasoned about as one rule.] Falsifiable both ways:
      before the URL-restructure plan merges the leading `test -d` exits non-zero, the `&&` chain
      short-circuits so the `git ls-files` count never runs and no number is printed at all; a
      depth-8 count other than 37
      means the re-home is incomplete and this plan must not start.
      **Date**: 2026-07-26. **Status**: Done. **Files Changed**: this bullet's command/rationale text
      only (the un-filtered `git ls-files` count over-reports 137 due to nested bundle `_index.md`
      files; fixed to depth-filter with `awk -F/ 'NF==8'`). Verified via `repo-setup-manager`: both
      `test` commands exit 0; depth-8 count = **37**. Blocking plan #1
      (`ayokoding-learning-path-01-url-restructure`) confirmed merged.
- [x] [AI] **Verify blocking plan #2 merged** — the cross-plan syllabus layer is on `origin/main`.
      Locate it with a command that neither zsh nor RTK can distort — command (single line):
      `git ls-files -- 'plans/done/*ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/courses/README.md'`
      — acceptance: three checks, all required. (a) It prints **exactly one** path — pipe it to
      `grep -c .` and read **1**. Its directory is `<SYLLABUS_ROOT>`. (b) `test -d "<SYLLABUS_ROOT>"`
      exits 0. (c) `git ls-files -- '<SYLLABUS_ROOT>/*.md' | grep -c .` returns **122**. Record the printed path
      to `evidence/phase-0-snapshot.txt` as `SYLLABUS_ROOT=<path>` — every later authoring step reads
      from that recorded root, never from a copy.
      **Do not write this as `test -d plans/done/*__…/syllabus/courses || test -d plans/in-progress/…`.**
      This harness runs **zsh**, where an unmatched glob is a fatal error rather than a literal:
      whenever the referenced plan is still in-progress (as plan 02 was when this check was
      authored; it is now archived), the `plans/done/*__…` pattern matches nothing, zsh aborts the
      whole command line with `no matches found`, and the `||` fallback **never runs** — a false red
      in the single most likely state at authoring time. Were the glob instead to match two archived
      copies, `test -d` would
      receive two arguments and exit **2** (`too many arguments`). Both measured on this machine
      2026-07-22. **`find` is also the wrong instrument for this particular check** — not because a
      piped `find … | wc -l` miscounts (it does not; see the bare-versus-piped rule in the previous
      step), but because locating a stage-ambiguous path needs a pathspec that `git ls-files` expands
      itself, and because the **bare** form of `find` — the one an executor is most likely to run
      interactively while debugging this step — is rewritten to `rtk find`, which reformats the result
      and drops flags it does not know. An explicit `rtk find` on this very query printed the single
      **stdout** line `0 for '<pattern>'` for the nothing-landed case, which `| grep -c .` reads as
      **1** — the exact inversion of the answer, and the reason `find` is not used here.
      `ls … | wc -l` is unreliable for the same family of reasons (see this file's Phase 0 preamble).
      `git ls-files` is unfiltered and expands its own quoted patterns, so neither zsh nor RTK ever
      sees the `*`.
      [Repo-grounded — measured 2026-07-22, each command issued alone as the whole content of one call:
      `rtk find … -path '<pattern>'` wrote `0 for '<root>'` to stdout and **nothing to stderr**, so
      both the stdout-only and the `2>&1`-merged forms of `| grep -c .` read **1**. An earlier revision
      of this passage claimed `-path` emits `rtk find: unknown flag '-path', ignored` on stderr, that
      the merged form therefore reads **2**, and that the dropped flag makes `rtk find` "list the search
      roots wholesale" — **none of those three reproduced**. They appear to have been generalised from
      `-mindepth`, which genuinely does emit that warning. The inversion-to-**1** point, which is what
      actually justifies avoiding `find` here, is unaffected.]
      Falsifiable both ways: before plan 02 lands in either stage the `git ls-files` locate step
      matches no path and check (a) reads **0** (`grep -c` also exits 1 on a zero count — read the
      printed number, never `&&`-chain it); **2** means the corpus was archived twice and the root is ambiguous; and a
      folder that exists but whose `syllabus/courses/` holds a count other than 122 fails check (c).
      **Date**: 2026-07-26. **Status**: Done. **Files Changed**: `evidence/phase-0-snapshot.txt` (new).
      `git ls-files` located exactly one path
      (`plans/done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/courses/README.md`);
      `SYLLABUS_ROOT` directory exists; its `*.md` count is **122**. Recorded
      `SYLLABUS_ROOT=plans/done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/courses`
      to `evidence/phase-0-snapshot.txt`. Blocking plan #2 confirmed merged.
- [x] [AI] Establish content baselines: `npx nx run ayokoding-www:build` and
      `npx nx run ayokoding-www:test:unit`
      — acceptance: both exit 0; record pass state in `evidence/phase-0-snapshot.txt`.
      **Date**: 2026-07-26. **Status**: Done. **Files Changed**: `evidence/phase-0-snapshot.txt`
      (appended); `apps/ayokoding-www/next-env.d.ts` (Next.js auto-regenerated by the build, not a
      manual edit). `ayokoding-www:build` exited 0 (1850/1850 static pages generated);
      `ayokoding-www:test:unit` exited 0 (126 test files, 2424 passed, 6 skipped).
- [x] [AI] **Confirm all twenty-nine NEW slugs are absent (no collision)** under `<SE_OLD>` and
      `<COURSES>` (six net-new AI-engineering courses + fourteen new courses + nine new capstones:
      three original plus six **DD-20** inter-topic capstones):

  ```bash
  for s in evaluating-ai-output-essentials evaluating-ai-systems-in-depth statistics-for-evaluation \
    product-patterns-for-probabilistic-systems inference-serving-and-model-deployment \
    fine-tuning-and-adaptation \
    coding-interview take-home-and-live-coding system-design-interview \
    behavioral-and-leadership-interviews capstone-interview-loop \
    async-python-and-fastapi-services self-hosting-essentials browser-automation-with-cdp \
    the-agent-loop agent-tools-and-mcp agent-context-and-memory \
    agent-permissions-and-sandboxing agent-orchestration-subagents-and-observability \
    capstone-build-your-own-coding-agent just-enough-cpp \
    detection-engineering-and-siem-operations capstone-build-your-own-pentest-engine \
    capstone-real-world-delivery capstone-secure-service capstone-data-pipeline \
    capstone-concurrency-and-systems capstone-concurrency-showdown capstone-lead-at-altitude; do
    test -e "apps/ayokoding-www/content/en/learn/fundamentally-strong/software-engineer/$s" && echo "EXISTS SE_OLD $s"
    test -e "apps/ayokoding-www/content/en/learn/courses/$s" && echo "EXISTS COURSES $s"
  done
  ```

  — acceptance: **zero** output lines. Falsifiable both ways: `mkdir -p apps/ayokoding-www/content/en/learn/courses/just-enough-cpp`
  makes the loop print `EXISTS COURSES just-enough-cpp`, proving the check fires.

  **Date**: 2026-07-26. **Status**: Done. **Files Changed**: none (read-only check). Ran the loop
  verbatim over all 29 slugs against `<SE_OLD>` and `<COURSES>` — zero output lines, no collisions.

- [x] [AI] **Create the authored-body slug register** — write the 90 slugs this plan authors, one per
      line, to `evidence/authored-body-slugs.txt` (6 AI + Bands 1–9), transcribed from this
      checklist's own phase sections:

  ```bash
  cat > evidence/authored-body-slugs.txt <<'EOF'
  evaluating-ai-output-essentials
  evaluating-ai-systems-in-depth
  statistics-for-evaluation
  product-patterns-for-probabilistic-systems
  inference-serving-and-model-deployment
  fine-tuning-and-adaptation
  nosql-databases
  graph-databases
  database-internals-and-storage-engines
  data-engineering
  search-and-information-retrieval
  api-design
  advanced-frontend
  backend-at-scale
  async-python-and-fastapi-services
  self-hosting-essentials
  containers-and-orchestration
  cloud-and-iac
  cicd-and-release-engineering
  build-automation-and-task-runners
  information-architecture-and-seo
  just-enough-kotlin
  android-app-development
  just-enough-swift
  ios-app-development
  just-enough-dart
  hybrid-app-development
  just-enough-csharp
  windows-app-development
  linux-app-development
  building-production-cli-tools
  just-enough-go
  csp-style-concurrency
  just-enough-elixir
  actor-model-concurrency
  software-architecture
  domain-driven-design
  system-design
  event-driven-architecture
  distributed-systems
  build-your-own-web-framework
  build-your-own-reactive-ui
  creating-ai-powered-apps
  agentic-ai
  browser-automation-with-cdp
  the-agent-loop
  agent-tools-and-mcp
  agent-context-and-memory
  agent-permissions-and-sandboxing
  agent-orchestration-subagents-and-observability
  just-enough-c
  just-enough-cpp
  linux-os
  windows-os
  system-programming
  just-enough-rust
  modern-system-programming
  just-enough-java
  enterprise-java-and-the-jvm
  lisp
  just-enough-fsharp
  type-systems
  compilers-parsers-and-transpilers
  build-your-own-git
  build-your-own-database
  build-your-own-raft
  it-and-application-security
  offensive-security
  defensive-security
  detection-engineering-and-siem-operations
  vulnerability-management-and-assessment
  it-governance-grc
  bare-metal-virtualization
  self-managed-kubernetes-and-gitops
  platform-engineering-and-devex
  site-reliability-engineering
  analytics-and-experimentation
  capstone-build-your-own-coding-agent
  capstone-build-your-own-pentest-engine
  capstone-real-world-delivery
  capstone-secure-service
  capstone-data-pipeline
  capstone-concurrency-and-systems
  capstone-concurrency-showdown
  capstone-lead-at-altitude
  coding-interview
  take-home-and-live-coding
  system-design-interview
  behavioral-and-leadership-interviews
  capstone-interview-loop
  EOF
  ```

  — acceptance: `wc -l < evidence/authored-body-slugs.txt` returns **90**, and
  `sort evidence/authored-body-slugs.txt | uniq -d | wc -l` returns **0** (no duplicate slug).
  Falsifiable both ways: deleting one line makes the first check return 89; duplicating one makes
  the second return 1.

  **Date**: 2026-07-26. **Status**: Done. **Files Changed**: `evidence/authored-body-slugs.txt`
  (new). `wc -l` = 90; `sort | uniq -d | wc -l` = 0 (no duplicates).

- [x] [AI] **Record the authored-body baseline (the falsifiable-both-ways anchor for archival)** —
      `while read -r s; do test -d "apps/ayokoding-www/content/en/learn/courses/$s" || echo "ABSENT $s"; done < evidence/authored-body-slugs.txt | wc -l`
      — acceptance: returns **90** today (none authored yet) and is recorded in
      `evidence/phase-0-snapshot.txt`. The same command must return **0** at archival (Phase 9). This
      is this plan's own assertion; the 127-course catalog total is asserted by the manifest plans
      (`ayokoding-learning-path-12-careers-se-manifests` / `ayokoding-learning-path-13-careers-ai-manifest`),
      never here.
      **Date**: 2026-07-26. **Status**: Done. **Files Changed**: `evidence/phase-0-snapshot.txt`
      (appended). ABSENT count = **90** (none of the 90 slugs authored yet, as expected today).
- [x] [AI] Confirm `learnings.md` exists in the plan folder with its H1 — command:
      `test -f learnings.md && head -1 learnings.md` — acceptance: file present and the first line is
      `# Learnings: ayokoding-learning-path-04-course-authoring`.
      **Date**: 2026-07-26. **Status**: Done. **Files Changed**: none (read-only check). File present,
      first line matches exactly.
- [x] [AI] **Cross-plan link gate (BF-8)** — confirm every `../ayokoding-learning-path-*` reference
      in this plan's own files resolves:

  ```bash
  cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate \
    --quiet \
    --exclude plans/done \
    --exclude apps/ayokoding-www/content \
    --exclude apps/ose-www/content 2>&1 | grep -F "ayokoding-learning-path-04-course-authoring"
  ```

  — acceptance: the `grep` finds **no** matching line (exits 1). Falsifiable both ways: adding one
  bad `../../done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/nope.md` link makes the
  same command print that file and exit 0. `md links validate` accepts **no positional path**
  (passing one errors out) and the bare repo-wide form is unsatisfiable (a pre-existing, non-zero
  backlog of broken links, nearly all under `plans/done/`, unrelated to this work — 137 of 138
  repo-wide as of 2026-07-22) — use this exact form.

  **Date**: 2026-07-26. **Status**: Done. **Files Changed**: none (read-only check). `rhino-cli md
links validate` exited 0 with "All links valid! No broken links found."; grep for this plan's
  folder name found no matching line.

- [x] [AI] **Confirm no manifest file changed in this phase** — this phase only writes
      `evidence/` toolchain-baseline files, and it opens **no** PR (the Delivery-Boundary Integration
      Protocol applies from Phase 1 onward), but the manifest-isolation assertion still holds here:
      `git diff --name-only origin/main...HEAD -- 'apps/ayokoding-www/src/features/course-paths/manifests/' | grep -c .`
      — acceptance: returns **0**. Falsifiable both ways: touching any file under that path makes the
      command return ≥1 and the phase gate fails.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: none (read-only verification).
    The manifest diff returned `0` paths.
    **Date**: 2026-07-26. **Status**: Done. **Files Changed**: none (read-only check). Count = 0.

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `npm install` exited 0 and `npm run doctor -- --fix` reports no unresolved drift.
      **Date**: 2026-07-26. **Status**: Done. Re-verified against the item-level checks above.
- [x] [AI] Both blocking plans verified merged: `<COURSES>` holds exactly 37 re-homed bundles; the
      cross-plan `syllabus/courses/` holds 122 entries and its root is recorded as `SYLLABUS_ROOT`.
      **Date**: 2026-07-26. **Status**: Done. Re-verified against the item-level checks above.
- [x] [AI] `ayokoding-www:build` + `test:unit` baselines recorded green.
      **Date**: 2026-07-26. **Status**: Done. Re-verified against the item-level checks above.
- [x] [AI] All 29 new slugs confirmed absent (zero `EXISTS` lines).
      **Date**: 2026-07-26. **Status**: Done. Re-verified against the item-level checks above.
- [x] [AI] `evidence/authored-body-slugs.txt` holds 90 unique slugs; the ABSENT-count baseline of 90 is
      recorded in `evidence/phase-0-snapshot.txt`.
      **Date**: 2026-07-26. **Status**: Done. Re-verified against the item-level checks above.
- [x] [AI] Cross-plan link gate green (no line naming this plan's folder).
      **Date**: 2026-07-26. **Status**: Done. Re-verified against the item-level checks above.
- [x] [AI] Zero manifest files touched (`git diff --name-only ... | grep -c .` returns 0).
      **Date**: 2026-07-26. **Status**: Done. Re-verified against the item-level checks above.
- [x] [AI] **No PR was opened for this phase and nothing was pushed** — the Delivery-Boundary Integration
      Protocol applies from **Phase 1 onward** and explicitly excludes Phase 0. Read the printed
      number from each (never `&&`-chained, since `grep -c` exits 1 on a zero count):
      `git ls-remote --heads origin "$(git branch --show-current)" | grep -c .` returns **0**, and
      `gh pr list --head "$(git branch --show-current)" --json number --jq 'length'` returns **0**.
      Falsifiable both ways: pushing this branch makes the first return **1**; opening a PR for it
      makes the second return **1** — either fails the gate. The `evidence/` baseline and slug
      register written here ride the **Phase 1** PR
      ([§Phase 0 Opens No PR](../../../repo-governance/conventions/structure/plans/phase-0-opens-no-pr.md#phase-0-opens-no-pr--the-earliest-pr-is-phase-1-hard-rule)).
      **Date**: 2026-07-26. **Status**: Done. Both commands returned **0** — branch not pushed, no
      PR open.

> **Pause Safety**: only the toolchain, the two upstream preconditions, and the slug register were
> established — no course body exists yet, nothing is pushed, and no PR exists. Safe to stop
> indefinitely. To resume: re-run the two blocking-plan verification commands and the baseline build.

---

## Historical execution record — Phases 1–4

All checked course-authoring entries in Phases 1–4 are factual records of execution completed before
the one-final-PR amendment. They preserve provenance only: they must not be used to create a new
per-course or per-cohort worktree, branch, PR, review, merge, or deployment. The remaining unchecked
work starts with Phase 5 and follows the one-worktree, one-branch, one-final-PR contract.

## Phase 1: Author the six net-new AI-engineering courses

> Each NEW course is authored as a full page-bundle into `<COURSES><course-id>/`. These six bodies are
> content-independent (each writes only its own subtree) and **pipeline concurrently** through review
> (bounded by the cap). Per-course concept/example/prerequisite/capstone detail is **already settled**
> in the cross-plan
> [`syllabus/courses/`](../../done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/courses/README.md) —
> each of the six has a complete 295–425-line spec file with concrete `co-NN` concept enumeration,
> `ex-NN` worked examples, a concrete prerequisite chain, and a capstone spec. **Author each course
> body from its `<SYLLABUS_ROOT>/<id>.md` spec, not from a fresh judgment call.**
>
> Every course is split into a **stable spine** and **dated accuracy-note sidebars** (volatile
> SDK/model/pricing/framework specifics), matching the pattern the existing AI-band courses use
> (DD-28's durability constraint) — an explicit authoring requirement, not optional polish.

### NEW-course authoring convention (applies to every authoring step in Phases 1 and 3–11)

1. [AI] **V (accuracy pre-verify)** — spot-check version-pinned / market / pre-1.0-stack facts via
   `web-researcher` — acceptance: no version-pinned claim written `[Unverified]`; every volatile fact
   sits in a dated accuracy-note sidebar, not the stable spine.
2. [AI] **Skeleton** — create `<COURSES><course-id>/` (`_index.md` with `prerequisites: [...]` +
   `overview.md` + `learning/_index.md` + `drilling/_index.md`), mirroring the sibling bundle shape;
   the `course-id` slug and the prerequisite chain are **settled** — use the exact values declared in
   `<SYLLABUS_ROOT>/<course-id>.md`, not a fresh decision — acceptance: `test -d "<COURSES><course-id>"`,
   `test -d "<COURSES><course-id>/learning"`, and `test -d "<COURSES><course-id>/drilling"` all exit 0,
   and `grep -F -q 'prerequisites:' "<COURSES><course-id>/_index.md"` exits 0.
3. [AI] **Author learning track** — `overview.md` (purpose + `## Prerequisites` naming only earlier
   library courses + register per `prd.md`), concept coverage, example/scenario pages + colocated
   `code/` where code-bearing, and `learning/capstone/`; the concept-coverage floor and example volume
   are **settled** in the spec's `co-NN`/`ex-NN` enumeration — acceptance: the course's own
   `overview.md` states its scope boundary against any sibling course it could be confused with.
4. [AI] **Author drilling track** — `drilling/overview.md` in the fixed five-section order —
   acceptance: all five sections present.
5. [AI] **Run content checkers** — the matching learning checker, `apps-ayokoding-www-facts-checker`,
   and `apps-ayokoding-www-link-checker` (plus `apps-ayokoding-www-general-checker` on
   `drilling/overview.md`) — acceptance: findings recorded. _(Content authoring is a
   maker-checker-fixer cycle, not code TDD — no RED/GREEN/REFACTOR labels; see steps 6–7 and
   [tech-docs §TDD exemption](./tech-docs.md#tdd-exemption-this-plan-ships-no-application-code).)_
6. [AI] **Apply content fixers** — resolve every CRITICAL/HIGH/MEDIUM finding via the matching fixer —
   acceptance: every finding addressed.
7. [AI] **Re-verify** — re-run checkers + `npx nx run ayokoding-www:build` + `npm run lint:md` —
   acceptance: zero CRITICAL/HIGH/MEDIUM remain; build + lint exit 0.
8. [AI] **Confirm no manifest file changed in this course's own diff** — the per-band and per-phase
   manifest checks elsewhere in this file each branch fresh from `origin/main` and so can only see
   their own diff, never an already-merged sub-phase's diff (same reasoning as every other individual
   check in this file); this course's own sub-phase branch needs its own check for the same reason:
   `git diff --name-only origin/main...HEAD -- 'apps/ayokoding-www/src/features/course-paths/manifests/' | grep -c .`
   — acceptance: returns **0** on this course's own branch before it merges. Falsifiable both ways:
   touching any file under that path makes the command return ≥1.
9. [AI] **Licensing self-check (programme
   [`A8`](./tech-docs.md#programme-decisions))** — grep this course's
   own worked-example code for the CC-BY-SA Stack Overflow hazard `A8` names explicitly:
   `grep -rn 'stackoverflow\.com\|reddit\.com' "<COURSES><course-id>/learning/code/" 2>/dev/null | grep -c .`
   — acceptance: prints `0` (a zero-count `grep -c` exits 1 under every grep engine this harness may
   use — do not chain with `&&`; read the printed output). Falsifiable both ways: pasting an SO/Reddit URL into any file under that directory makes
   the count ≥1 today, before this step is satisfied. This is a targeted heuristic, not a full
   copyright audit — the maker-checker-fixer content checkers (step 5) and the human author's own
   judgment remain the primary `A8` control for prose, figures, and structure.

Each course below is its own sub-phase (own branch → draft PR → 3-cycle review → `[AI]` merge →
deploy), applying the convention:

- [x] [AI] Light eval gate (`evaluating-ai-output-essentials` — Annotated-concept, Python, settled per
      `<SYLLABUS_ROOT>/evaluating-ai-output-essentials.md`, 295 lines) — sits right after the first
      working LLM call, before RAG/agents; answers "how will you know this works?" (DD-25) —
      acceptance: all 9 convention steps complete; checkers report zero CRITICAL/HIGH/MEDIUM;
      `grep -F -q 'evaluating-ai-systems-in-depth' "<COURSES>evaluating-ai-output-essentials/overview.md"`
      exits 0 (the scope boundary against the deep-evals course is stated). Falsifiable both ways: the
      same command exits **2** today, because `overview.md` does not exist yet: `grep` exits 2 on a
      missing path and 1 only on a genuine no-match (measured 2026-07-22, and true under both the ugrep
      and BSD `grep` engines this harness may route to) — the two are never the same observation; and once the file exists it exits **1** if the boundary line is
      dropped. Only exit 0 satisfies this clause, so either failure mode fails it.
      **Date**: 2026-07-26. **Status**: Done. **Files Changed**: 76 files under
      `apps/ayokoding-www/content/en/learn/courses/evaluating-ai-output-essentials/` plus
      `apps/ayokoding-www/content/en/learn/{_index.md,courses/_index.md}`.
      Authored via `apps-ayokoding-www-annotated-concept-maker`, checker/fixer cycle clean (zero
      CRITICAL/HIGH/MEDIUM). Own branch `ayokoding-learning-path-04-course-authoring/evaluating-ai-output-essentials`,
      draft PR [#98](https://github.com/wahidyankf/ose-public/pull/98), 3-cycle PR review (8 findings
      raised across governance/logic/docs disciplines, all fixed; 0 CRITICAL/HIGH outstanding at
      merge), squash-merged to `main` and deployed to `prod-ayokoding-www`. Acceptance clause verified
      post-merge: `grep -F -q 'evaluating-ai-systems-in-depth' "<COURSES>evaluating-ai-output-essentials/overview.md"`
      exits 0.
  - _Suggested executor: `apps-ayokoding-www-annotated-concept-maker`_
- [x] [AI] Statistics for evals (`statistics-for-evaluation` — Annotated-concept, code-bearing, Python,
      settled per `<SYLLABUS_ROOT>/statistics-for-evaluation.md`, 368 lines) — scoped tightly to what
      evals demand (judge concordance, significance testing), not a general statistics survey (DD-26);
      it is a **hard prerequisite** of `evaluating-ai-systems-in-depth`, so it is authored before (or
      in the same review cycle as) the deep-evals course — acceptance: all 9 convention steps complete;
      checkers report zero CRITICAL/HIGH/MEDIUM;
      `grep -F -q 'analytics-and-experimentation' "<COURSES>statistics-for-evaluation/overview.md"`
      exits 0 (the scope boundary against classical A/B testing is stated).
      **Date**: 2026-07-26. **Status**: Done. **Files Changed**: 99 files under
      `apps/ayokoding-www/content/en/learn/courses/statistics-for-evaluation/`.
      Authored via `apps-ayokoding-www-annotated-concept-maker`, checker/fixer cycle clean (zero
      CRITICAL/HIGH/MEDIUM). Own branch `ayokoding-learning-path-04-course-authoring/statistics-for-evaluation`,
      draft PR [#100](https://github.com/wahidyankf/ose-public/pull/100), 3-cycle PR review completed
      (0 CRITICAL/HIGH outstanding at merge), merged to `main` via merge commit (`6fbe1bf17`) and
      deployed to `prod-ayokoding-www`. Acceptance clause verified post-merge:
      `grep -F -q 'analytics-and-experimentation' "<COURSES>statistics-for-evaluation/overview.md"`
      exits 0.

  **Gherkin (binds) →** "The statistics-for-evals course stays scoped to what evals demand"

  ```gherkin
  Scenario: The statistics-for-evals course stays scoped to what evals demand
    Given the statistics-for-evals course is authored
    When a reader compares it with analytics-and-experimentation
    Then it covers judge concordance and significance testing for evals only
    And it does not re-teach general product A/B testing, which stays analytics-and-experimentation's scope
  ```

  - _Suggested executor: `apps-ayokoding-www-annotated-concept-maker`_

- [x] [AI] Deep evals (`evaluating-ai-systems-in-depth` — By Example, Python, settled per
      `<SYLLABUS_ROOT>/evaluating-ai-systems-in-depth.md`, 384 lines) — sits after agents; error
      analysis, task-specific criteria, LLM-as-judge with measured human agreement, CI gating,
      judge-scope reliability (DD-25); declares `statistics-for-evaluation` a **hard prerequisite** —
      acceptance: all 9 convention steps complete; checkers report zero CRITICAL/HIGH/MEDIUM;
      `grep -F -q 'statistics-for-evaluation' "<COURSES>evaluating-ai-systems-in-depth/_index.md"`
      exits 0 (the hard prerequisite is declared) **and**
      `grep -F -q 'evaluating-ai-output-essentials' "<COURSES>evaluating-ai-systems-in-depth/overview.md"`
      exits 0 (the scope boundary against the light gate is stated).
      **Date**: 2026-07-26. **Status**: Done. **Files Changed**: 101 files under
      `apps/ayokoding-www/content/en/learn/courses/evaluating-ai-systems-in-depth/`.
      Authored via `apps-ayokoding-www-by-example-maker`, checker/fixer cycle clean (zero
      CRITICAL/HIGH/MEDIUM). Own branch `ayokoding-learning-path-04-course-authoring/evaluating-ai-systems-in-depth`,
      draft PR [#103](https://github.com/wahidyankf/ose-public/pull/103), 3-cycle PR review completed
      (0 CRITICAL/HIGH outstanding at merge), merged to `main` via merge commit (`be07b257c`) and
      deployed to `prod-ayokoding-www`. Acceptance clauses verified post-merge:
      `grep -F -q 'statistics-for-evaluation' "<COURSES>evaluating-ai-systems-in-depth/_index.md"`
      exits 0 **and**
      `grep -F -q 'evaluating-ai-output-essentials' "<COURSES>evaluating-ai-systems-in-depth/overview.md"`
      exits 0.

  **Gherkin (binds) →** "The light eval gate and deep evals course do not overlap"

  ```gherkin
  Scenario: The light eval gate and deep evals course do not overlap
    Given the light-eval-gate course and the deep-evals course are authored
    When a reader compares their overviews
    Then each overview states an explicit scope boundary against the other
    And neither course re-teaches the material the other owns
  ```

  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_

- [x] [AI] Product patterns for probabilistic systems (`product-patterns-for-probabilistic-systems` —
      Annotated-concept, no code, settled per
      `<SYLLABUS_ROOT>/product-patterns-for-probabilistic-systems.md`, 370 lines) — product design
      patterns for probabilistic (not deterministic) outputs; no course owns this today (DD-28) —
      acceptance: all 9 convention steps complete; checkers report zero CRITICAL/HIGH/MEDIUM.
      **Date**: 2026-07-26. **Status**: Done. **Files Changed**: 20 files under
      `apps/ayokoding-www/content/en/learn/courses/product-patterns-for-probabilistic-systems/`.
      Authored via `apps-ayokoding-www-annotated-concept-maker`, checker/fixer cycle clean (zero
      CRITICAL/HIGH/MEDIUM). Own branch `ayokoding-learning-path-04-course-authoring/product-patterns-for-probabilistic-systems`,
      draft PR [#99](https://github.com/wahidyankf/ose-public/pull/99), 3-cycle PR review completed
      (0 CRITICAL/HIGH outstanding at merge), merged to `main` via merge commit (`2c6ebcc6a`) and
      deployed to `prod-ayokoding-www`.
  - _Suggested executor: `apps-ayokoding-www-annotated-concept-maker`_
- [x] [AI] Inference serving and model deployment (`inference-serving-and-model-deployment` — By
      Example, Python, settled per `<SYLLABUS_ROOT>/inference-serving-and-model-deployment.md`, 405
      lines) — vLLM/TGI, KV-cache, batching, GPU considerations; entirely absent from the library today
      (DD-28) — acceptance: all 9 convention steps complete; checkers report zero CRITICAL/HIGH/MEDIUM;
      every vLLM/TGI version claim sits in a dated accuracy-note sidebar, verified by the facts checker.
      **Date**: 2026-07-26. **Status**: Done. **Files Changed**: 99 files under
      `apps/ayokoding-www/content/en/learn/courses/inference-serving-and-model-deployment/`.
      Authored via `apps-ayokoding-www-by-example-maker`, checker/fixer cycle clean (zero
      CRITICAL/HIGH/MEDIUM). Own branch `ayokoding-learning-path-04-course-authoring/inference-serving-and-model-deployment`,
      draft PR [#101](https://github.com/wahidyankf/ose-public/pull/101), 3-cycle PR review completed
      (0 CRITICAL/HIGH outstanding at merge), merged to `main` via merge commit (`cdc8a0b26`) and
      deployed to `prod-ayokoding-www`.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] Fine-tuning and adaptation (`fine-tuning-and-adaptation` — By Example, Python, settled per
      `<SYLLABUS_ROOT>/fine-tuning-and-adaptation.md`, 423 lines) — fine-tuning/LoRA/PEFT versus RAG as
      a foil (DD-28) — acceptance: all 9 convention steps complete; checkers report zero
      CRITICAL/HIGH/MEDIUM.
      **Date**: 2026-07-26. **Status**: Done. **Files Changed**: 97 files under
      `apps/ayokoding-www/content/en/learn/courses/fine-tuning-and-adaptation/`.
      Authored via `apps-ayokoding-www-by-example-maker`, checker/fixer cycle clean (zero
      CRITICAL/HIGH/MEDIUM). Own branch `ayokoding-learning-path-04-course-authoring/fine-tuning-and-adaptation`,
      draft PR [#102](https://github.com/wahidyankf/ose-public/pull/102), 3-cycle PR review completed
      (0 CRITICAL/HIGH outstanding at merge), merged to `main` via merge commit (`2cd85dc30`) and
      deployed to `prod-ayokoding-www`.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] **Add catalog rows** — replace the "per its settled spec" prerequisite cells in
      [tech-docs §AI-engineering specialization](./tech-docs.md#ai-engineering-specialization-the-fourth-paths-six-net-new-courses)
      with the chains transcribed from each course's `_index.md`, and add all six course IDs to
      `<COURSES>_index.md` — acceptance:
      `for s in evaluating-ai-output-essentials evaluating-ai-systems-in-depth statistics-for-evaluation product-patterns-for-probabilistic-systems inference-serving-and-model-deployment fine-tuning-and-adaptation; do grep -F -q "$s" apps/ayokoding-www/content/en/learn/courses/_index.md || echo "MISSING $s"; done | wc -l`
      returns **0** (returns 6 before this step); `apps-ayokoding-www-link-checker` green on
      `<COURSES>_index.md`.
- [x] [AI] **Record the band-completion signal** for the AI-engineering set in this file (see
      [README §Band-completion signal contract](./README.md#band-completion-signal-contract)) — all
      five fields present: `BAND`, `PLAN`, `LANDED_COURSE_IDS` (the six IDs), `GROW_MANIFESTS`
      (`<MANIFESTS>careers/immediately-effective/ai-engineer.yaml` — the AI path only),
      `MERGED_COMMIT` — acceptance: the signal block is present in this file with all five fields
      populated and `MERGED_COMMIT` a real 40-char SHA on `origin/main`
      (`git cat-file -e <sha>^{commit}` exits 0). Falsifiable both ways: a placeholder SHA fails
      `git cat-file -e`.
- [x] [AI] **Confirm no manifest file changed in this phase** — this phase authors six course bodies
      via the same mechanism Bands 1–9 use, so it gets the identical individual gate every band
      already carries via its own "per-band closing steps" step 3:
      `git diff --name-only origin/main...HEAD -- 'apps/ayokoding-www/src/features/course-paths/manifests/' | grep -c .`
      — acceptance: returns **0**. Falsifiable both ways: touching any file under that path makes the
      command return ≥1 and the phase gate fails.

### Phase 1 Gate

- [x] [AI] All six AI courses live under `<COURSES>` with declared prerequisites; each passed its
      checker + facts + link checkers; each states its scope boundary against any course it could be
      confused with.
- [x] [AI] Every Phase 1 course's volatile facts sit in dated accuracy-note sidebars, not the stable
      spine (DD-28 durability constraint) — verified by `apps-ayokoding-www-facts-checker`. (Scoped
      explicitly to Phase 1's six courses — later phases carry the identical gate on their own
      per-phase closing steps, so this bullet is not a plan-wide claim.)
- [x] [AI] `evaluating-ai-systems-in-depth/_index.md` declares `statistics-for-evaluation` as a
      prerequisite (`grep -F -q` exits 0).
- [x] [AI] Six catalog rows completed in `tech-docs.md`; `<COURSES>_index.md` lists all six
      (the MISSING loop returns 0).
- [x] [AI] `npx nx run ayokoding-www:build` + `npm run lint:md` +
      `cargo run --release --manifest-path apps/rhino-cli/Cargo.toml -- md heading-hierarchy validate`
      all exit 0.
- [x] [AI] Band-completion signal recorded with all five fields; `MERGED_COMMIT` verified real.
- [x] [AI] Zero manifest files touched (`git diff --name-only ... | grep -c .` returns 0).
- [x] [AI] Every course sub-phase PR is `[AI]`-merged and deployed.

```text
BAND: Phase 1 — AI-engineering specialization (six net-new courses)
PLAN: ayokoding-learning-path-04-course-authoring
LANDED_COURSE_IDS:
  evaluating-ai-output-essentials
  statistics-for-evaluation
  evaluating-ai-systems-in-depth
  product-patterns-for-probabilistic-systems
  inference-serving-and-model-deployment
  fine-tuning-and-adaptation
GROW_MANIFESTS: apps/ayokoding-www/src/features/course-paths/manifests/careers/immediately-effective/ai-engineer.yaml
MERGED_COMMIT: be07b257cd86155a6a10bf3f7b476c8135cbb73c
```

> **Pause Safety**: the library holds the 37 re-homed bundles plus six new AI courses, all at canonical
> URLs and all rendering. No manifest references them yet, so nothing downstream can break. Safe to
> stop. To resume: re-run the section build + link validation.

---

## Phases 3–4: Author the 15 remaining native bodies — Band 1, then Band 2

Every body is authored NATIVE into `<COURSES><course-id>/` (no legacy home, no re-home) per the
**NEW-course authoring convention** in Phase 1. Bodies within a band are content-independent and
**pipeline concurrently** through review, bounded by the cap. Per-course detail:
`<SYLLABUS_ROOT>/<course-id>.md` and the tracked
[Course Library Catalog](./tech-docs.md#course-library-catalog). Each band authors its own catalog
rows as part of "convention complete".

> **Moved out.** The reconciliation rulings this preamble previously carried for `defensive-security`
> / `detection-engineering-and-siem-operations` (DD-12) and the AI-band scope-guard
> (`creating-ai-powered-apps` → `agentic-ai` → the harness cluster, DD-11) targeted Band 7 and
> Band 5 respectively — neither is authored by this plan. They now live in
> `ayokoding-learning-path-08-course-authoring-security-and-ops` and
> `ayokoding-learning-path-06-course-authoring-architecture-and-ai-harness`.

**Reconciliation ruling baked into authoring** (locked):

- `async-python-and-fastapi-services` stays framework-concrete: defer async _concepts_ to
  `concurrency-and-parallelism` and framework _internals_ to `build-your-own-web-framework`;
  cross-link both.

**Per-band closing steps** (identical for every band; listed once, applied in each phase's gate):

1. [AI] Add each landed course's row to
   [tech-docs §Course Library Catalog](./tech-docs.md#course-library-catalog) and its ID to
   `<COURSES>_index.md`.
2. [AI] Record the band-completion signal in this file with all five fields (`BAND`, `PLAN`,
   `LANDED_COURSE_IDS`, `GROW_MANIFESTS`, `MERGED_COMMIT`) per
   [README §Band-completion signal contract](./README.md#band-completion-signal-contract).
3. [AI] Confirm zero manifest files were touched:
   `git diff --name-only origin/main...HEAD -- 'apps/ayokoding-www/src/features/course-paths/manifests/' | grep -c .`
   returns **0**.

---

## Phase 3: Band 1 — Data depth (5 bodies)

- [x] [AI] `nosql-databases` (By Example · Python) — convention complete; checkers clean. PR #109,
      3 review cycles, merged commit `4456198d4ee2a5043b6c6b28a727af953a3d3dfb`.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] `graph-databases` (By Example · Cypher + Python) — convention complete; checkers clean.
      PR #106, 3 review cycles, merged commit `7e9f5add4db37dad1568690127b4aef8b084e620`.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] `database-internals-and-storage-engines` (By Example · Python) — convention complete;
      checkers clean. PR #107, 3 review cycles, merged commit
      `2839678af1cce9f253865533fd75b5f4a92fe2c9`.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] `data-engineering` (Annotated-concept · Python) — convention complete; checkers clean.
      PR #105, 3 review cycles, merged commit `36bfef524138baf4c3f8c1c6d95174421c153306`.
  - _Suggested executor: `apps-ayokoding-www-annotated-concept-maker`_
- [x] [AI] `search-and-information-retrieval` (By Example · Python) — convention complete; checkers
      clean. PR #108, 3 review cycles, merged commit `81257e2f6a382c4170cbb16c1805077340c60531`.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] Apply the three per-band closing steps (catalog rows, band signal, zero-manifest check).
      `GROW_MANIFESTS` for this band = the three software-engineer-role manifests.

### Phase 3 Gate

- [x] [AI] All 5 Band-1 bodies exist with declared prerequisites:
      `for s in nosql-databases graph-databases database-internals-and-storage-engines data-engineering search-and-information-retrieval; do test -d "apps/ayokoding-www/content/en/learn/courses/$s" || echo "ABSENT $s"; done | wc -l`
      returns **0** (returns 5 before this phase). Verified on `origin/main` post-merge.
- [x] [AI] Every body passed its learning checker + facts checker + link checker with zero
      CRITICAL/HIGH/MEDIUM. Fulfilled via this plan's established `worktree-to-pr` delivery-mode gate
      (the PR-Review Maker→Fixer Cycle: 3 sequential CI-gated cycles, 8 discipline specialists
      including docs/governance/logic, per PR) rather than standalone checker-agent invocation — every
      finding raised across all 3 cycles on all 5 PRs, including MEDIUM/LOW, was resolved by each PR's
      final fixer pass; 0 CRITICAL/HIGH/MEDIUM/LOW outstanding at merge time on all 5.
- [x] [AI] `npx nx run ayokoding-www:build` + `npm run lint:md` exit 0. Verified on `origin/main`
      post-merge (build: 1991/1991 pages generated; markdownlint: 0 errors across 3459 files).
- [x] [AI] Catalog rows added; `<COURSES>_index.md` lists all 5; band signal recorded with all five
      fields; zero manifest files touched.
- [x] [AI] Every sub-phase PR is `[AI]`-merged and deployed.

```text
BAND: Phase 3 — Band 1 — Data depth (5 bodies)
PLAN: ayokoding-learning-path-04-course-authoring
LANDED_COURSE_IDS:
  data-engineering
  database-internals-and-storage-engines
  search-and-information-retrieval
  nosql-databases
  graph-databases
GROW_MANIFESTS:
  apps/ayokoding-www/src/features/course-paths/manifests/careers/interview-ready/software-engineer.yaml
  apps/ayokoding-www/src/features/course-paths/manifests/careers/immediately-effective/software-engineer.yaml
  apps/ayokoding-www/src/features/course-paths/manifests/careers/fundamentally-strong/software-engineer.yaml
MERGED_COMMIT: 7e9f5add4db37dad1568690127b4aef8b084e620
```

> **Pause Safety**: five self-contained data-depth bodies are live at canonical URLs; no manifest
> references them, so no path can break. Safe to stop. To resume: re-run the section build.

---

## Phase 4: Band 2 — Web, backend & platform productivity (10 bodies)

- [x] [AI] `api-design` (By Example · Python) — convention complete; checkers clean.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
  - _Implementation note: authored in `worktrees/ayokoding-course-api-design` on branch
    `ayokoding-learning-path-04-course-authoring/api-design`; 111 files across `_index.md`,
    `overview.md`, `learning/` (5-part By Example structure, 80 examples + capstone), `drilling/`
    (6 katas). PR #116 went through 3 full PR-Review Maker→Fixer cycles (8-specialist fan-out ×3);
    merged squash commit `8c99f2d857dd2b778e444945374f55f752d2b7a8` into `main`; deployed to
    `prod-ayokoding-www`._
- [x] [AI] `advanced-frontend` (By Example · TypeScript) — convention complete; checkers clean.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
  - _Implementation note: authored via `apps-ayokoding-www-by-example-maker` in
    `worktrees/ayokoding-course-advanced-frontend` on branch
    `ayokoding-learning-path-04-course-authoring/advanced-frontend`; 111 files (37 concepts, 80
    worked examples + capstone). Build green (2015 pages), markdownlint clean, heading hierarchy
    clean. PR [#119](https://github.com/wahidyankf/ose-public/pull/119), 3-cycle PR review (cycle 1
    clean; cycle 2 — 1 MEDIUM false positive resolved + `<details>` typo fixed; cycle 3 clean),
    squash-merged `57c2377bc` into `main`; deployed to `prod-ayokoding-www`._
- [x] [AI] `backend-at-scale` (By Example · Python) — convention complete; checkers clean.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
  - _Implementation note: authored via `apps-ayokoding-www-by-example-maker` in
    `worktrees/ayokoding-course-backend-at-scale` on branch
    `ayokoding-learning-path-04-course-authoring/backend-at-scale`; 110 files (40 concepts, 80 worked
    examples + capstone). Build green, markdownlint clean, pyright --strict clean. PR
    [#120](https://github.com/wahidyankf/ose-public/pull/120), 3-cycle PR review (cycle 1: 1 LOW f-string
    fix; cycle 2: 1 MEDIUM capstone checklist fix; cycle 3 clean), squash-merged `7818b8272` into `main`;
    deployed to `prod-ayokoding-www`._
- [x] [AI] `async-python-and-fastapi-services` (By Example · Python) — convention complete; checkers
      clean; **framework-concrete scope note applied**: async concepts deferred to
      `concurrency-and-parallelism`, framework internals to `build-your-own-web-framework`, both
      cross-linked — acceptance:
      `grep -F -q 'concurrency-and-parallelism' "<COURSES>async-python-and-fastapi-services/overview.md"`
      exits 0 **and**
      `grep -F -q 'build-your-own-web-framework' "<COURSES>async-python-and-fastapi-services/overview.md"`
      exits 0.
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
  - _Implementation note: authored via `apps-ayokoding-www-by-example-maker` in
    `worktrees/ayokoding-course-async-fastapi` on branch
    `ayokoding-learning-path-04-course-authoring/async-python-and-fastapi-services`; 113 files (24
    concepts, 78 worked examples + capstone). Framework-concrete scope: both cross-links verified in
    overview.md. Build green, markdownlint clean, pyright clean. PR
    [#121](https://github.com/wahidyankf/ose-public/pull/121), 3-cycle PR review (cycle 1: 1 HIGH test
    fixture lifespan fix + hadolint dir-rename; cycle 2: 1 HIGH pytest_asyncio.fixture fix; cycle 3
    clean), squash-merged `d64df3995` into `main`; deployed to `prod-ayokoding-www`._
- [x] [AI] `self-hosting-essentials` (By Example · ops/config) — convention complete; checkers clean —
      scope-boundary acceptance: the course teaches running one box, containerizing a service, a
      reverse proxy, and PaaS git-push deploy; its `overview.md` **explicitly excludes** clusters,
      Terraform/Packer/Ansible IaC, and Proxmox. Verify each exclusion is **stated** (not merely
      absent):
      `for w in cluster Terraform Packer Ansible Proxmox; do grep -F -q -i "$w" "<COURSES>self-hosting-essentials/overview.md" || echo "MISSING $w"; done | wc -l`
      returns **0**, and no lesson body under `<COURSES>self-hosting-essentials/learning/` teaches
      them. Falsifiable both ways: the loop returns 5 today (no such file) and returns ≥1 if any
      exclusion is dropped.

  **Gherkin (binds) →** "The light self-hosting course stays below clusters and IaC"

  ```gherkin
  Scenario: The light self-hosting course stays below clusters and IaC
    Given the self-hosting-essentials course is authored
    When a reader compares it with containers-and-orchestration and cloud-and-iac
    Then it teaches running one box, containerizing a service, a reverse proxy, and PaaS git-push deploy
    And its overview explicitly excludes clusters, Terraform/Packer/Ansible IaC, and Proxmox
  ```

  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
  - _Implementation note: authored via `apps-ayokoding-www-by-example-maker` in
    `worktrees/ayokoding-course-self-hosting` on branch
    `ayokoding-learning-path-04-course-authoring/self-hosting-essentials`; 102 files (22 concepts, 78
    worked examples + capstone). Scope exclusions verified (all 5 words present). Build green,
    markdownlint clean, heading hierarchy clean. PR
    [#124](https://github.com/wahidyankf/ose-public/pull/124), 3-cycle PR review (cycle 1: 4 CRITICAL
    hadolint + shellcheck fixes; cycles 2-3 clean), squash-merged `32896383b` into `main`; deployed to
    `prod-ayokoding-www`._

- [x] [AI] `containers-and-orchestration` (By Example · YAML/CLI) — convention complete; checkers
      clean.
  - _Completed 2026-07-31: authored the 83-example (27/28/28) Docker, Compose, Kubernetes, OCI, and
    Quadlet course bundle with its capstone and course-owned runnable artifacts; regenerated the two
    learn indexes. Fresh By-Example and factual audits pass after annotation-density and cgroup-v1/v2
    portability repairs. Course-scoped Prettier, markdownlint, Mermaid, heading, YAML, JSON, Node,
    and Compose-config checks pass; the production build completed from the initialized worktree.
    Repository-wide link validation has 145 pre-existing historical findings outside this course and
    reports none in its bundle. Per the 2026-07-31 five-course cadence amendment, this thematic
    commit remains local to the active cohort branch: no PR or deployment opens until the following
    four courses are completed._
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] `cloud-and-iac` (Annotated-concept · HCL/YAML) — convention complete; checkers clean.
  - _Completed 2026-07-31: authored the 53-example (18/20/15) LocalStack-only cloud and IaC course
    with capstone, drilling, and dedicated course-owned artifacts. Fresh Annotated-concept acceptance
    passes after full artifact self-containment, LocalStack provider, local-backend, decision-artifact,
    and Mermaid-label repairs. Course-scoped Prettier, markdownlint, Terraform formatting/validation,
    YAML, Node, and Mermaid checks pass; the production build regenerated the two learn indexes. Per
    the five-course cadence amendment, this thematic commit remains on the active cohort branch: no
    PR or deployment opens until the following three courses are completed._
  - _Suggested executor: `apps-ayokoding-www-annotated-concept-maker`_
- [x] [AI] `cicd-and-release-engineering` (By Example · YAML + Python) — convention complete; checkers
      clean.
  - _Completed 2026-07-31: authored the 83-example (28/27/28) GitHub Actions and typed-Python course
    with capstone, drilling, 83 dedicated artifact pairs, and controller artifacts for Argo Rollouts and
    Flagger. Fresh By-Example and factual audits pass after real Actions-control, controller-manifest,
    diagram, Flagger-range, Nx-runner, and OIDC-exchange repairs. Course-scoped Prettier, markdownlint,
    Python, YAML, Mermaid, and actionlint checks pass; the production build regenerated both learn indexes.
    Per the five-course cadence amendment, this thematic commit remains on the active cohort branch: no PR
    or deployment opens until the following two courses are completed._
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] `build-automation-and-task-runners` (By Example · multi-tool) — convention complete;
      checkers clean.
  - _Completed 2026-07-31: authored the 80-example (27/28/25) multi-tool build-automation course
    with 30 accessible Mermaid diagrams, 79 dedicated example artifact directories, and a real
    Make/npm/just capstone. Fresh By-Example and factual audits pass after full one-per-example
    navigation, density, explanation-length, special-character-anchor, Bazel target-pattern, and
    Gradle-cache-enable repairs. Course-scoped JSON, Node, C, Make dry-run/runtime, Prettier,
    markdownlint, Mermaid, and production-build checks pass; the build regenerated both learn indexes.
    just, Bazel, and Gradle CLIs are unavailable locally, so their complete local definitions received
    static and factual validation. Per the five-course cadence, this thematic commit remains on the
    active cohort branch: no PR or deployment opens until the following course is completed._
  - _Suggested executor: `apps-ayokoding-www-by-example-maker`_
- [x] [AI] `information-architecture-and-seo` (Annotated-concept · HTML) — convention complete;
      checkers clean.
  - _Completed 2026-07-31: authored the 53-example (18/20/15) information-architecture and SEO
    course with 53 dedicated artifacts and a runnable discoverability capstone. Course-scoped
    Prettier, markdownlint, Mermaid, XML, JSON, HTML-structure, local-artifact-link, and production
    build checks pass. The active five-course cohort is now complete and is ready for its single PR._
  - _Suggested executor: `apps-ayokoding-www-annotated-concept-maker`_
- [x] [AI] Apply the three per-band closing steps. `GROW_MANIFESTS` = the three software-engineer-role
      manifests.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**:
    `plans/done/2026-08-02__ayokoding-learning-path-04-course-authoring/delivery.md`. Verified all ten
    Band-2 IDs are catalogued in `tech-docs.md` and `<COURSES>_index.md`; the fresh
    `origin/main...HEAD` manifest diff is empty. The completion signal below identifies the final
    Band-2 content landing commit without asserting a new per-phase PR or deployment.

### Phase 4 Gate

- [x] [AI] All 10 Band-2 bodies exist:
      `for s in api-design advanced-frontend backend-at-scale async-python-and-fastapi-services self-hosting-essentials containers-and-orchestration cloud-and-iac cicd-and-release-engineering build-automation-and-task-runners information-architecture-and-seo; do test -d "apps/ayokoding-www/content/en/learn/courses/$s" || echo "ABSENT $s"; done | wc -l`
      returns **0** (returns 10 before this phase).
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: none (read-only verification).
    The ten-directory existence loop returned zero absent course IDs in the refreshed dedicated
    worktree.
- [x] [AI] The `self-hosting-essentials` exclusion loop returns 0 and the
      `async-python-and-fastapi-services` two cross-links both exit 0.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: none (read-only verification).
    All five required self-hosting exclusions are stated in `overview.md`; both required FastAPI
    scope-boundary links are present.
- [x] [AI] Every body passed its checkers with zero CRITICAL/HIGH/MEDIUM; build + `lint:md` exit 0.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: none (read-only verification).
    The recorded per-course checker evidence remains clean; a fresh `ayokoding-www:build` completed
    static generation in the dedicated worktree and Markdown lint completed without findings. The
    pinned Node 24.13.1 runtime and lockfile install were used.
- [x] [AI] Catalog rows added; band signal recorded; zero manifest files touched.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**:
    `plans/done/2026-08-02__ayokoding-learning-path-04-course-authoring/delivery.md`. All ten catalog
    rows and course-index entries are present, the Band-2 signal carries its five contract fields,
    and `git diff --name-only origin/main...HEAD -- manifests/` returned no paths before this
    plan-only documentation change.
- [x] [AI] **`vercel-function-cost-reduction` precondition holds** (hard gate on the remaining Band-2
      terminal PR — see [§`vercel-function-cost-reduction` precondition](./README.md#vercel-function-cost-reduction-precondition)):
      `test ! -f apps/ayokoding-www/src/app/layout.tsx` — acceptance: exits **0** (the old root layout
      no longer exists, i.e. `vercel-function-cost-reduction`'s Phase 1 has merged to `origin/main`).
      **This check MUST pass before the cohort's remaining PR merges** — if it fails, do not merge;
      wait for `vercel-function-cost-reduction` Phase 1 to land first.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: none (read-only verification).
    `test ! -f apps/ayokoding-www/src/app/layout.tsx` exited 0 in the refreshed worktree.
- [x] [AI] Commit this phase's checked artifacts on the persistent final-delivery branch — acceptance: no PR, merge, deployment, or in-repository merge SHA occurs before Phase 9.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**:
    `plans/done/2026-08-02__ayokoding-learning-path-04-course-authoring/delivery.md`. Committed the
    verified Phase-4 evidence as `4c620a02e` (`docs(plans): record course authoring phase 4 evidence`)
    on `ayokoding-learning-path-04-course-authoring-final-delivery`; no PR, push, merge, or deployment
    occurred.

```text
BAND: Phase 4 — Band 2 — Web, backend & platform productivity (10 bodies)
PLAN: ayokoding-learning-path-04-course-authoring
LANDED_COURSE_IDS:
  api-design
  advanced-frontend
  backend-at-scale
  async-python-and-fastapi-services
  self-hosting-essentials
  containers-and-orchestration
  cloud-and-iac
  cicd-and-release-engineering
  build-automation-and-task-runners
  information-architecture-and-seo
GROW_MANIFESTS:
  apps/ayokoding-www/src/features/course-paths/manifests/careers/interview-ready/software-engineer.yaml
  apps/ayokoding-www/src/features/course-paths/manifests/careers/immediately-effective/software-engineer.yaml
  apps/ayokoding-www/src/features/course-paths/manifests/careers/fundamentally-strong/software-engineer.yaml
MERGED_COMMIT: 8bca5d45b5e27cb037319f88fbdb343183bfeb3d
```

> **Pause Safety**: the web/platform productivity band is live and self-contained. Safe to stop. To
> resume: re-run the section build.

---

> **Numbering note.** Phases 5–11 (Bands 3–9: Mobile & desktop platforms, Concurrency
> languages, Architecture/distributed/AI-harness, Low-level systems/JVM, Security/ops/quality/delivery,
> Remaining capstones, Interview-technique) moved to the 7 successor plans — see
> [README §Successor plans](./README.md#successor-plans). This plan's next phase is renumbered from
> the original Phase 12 down to **Phase 5**, continuing directly from Phase 4 (Band 2) above.

---

## Phase 5: Section and authored-tree verification

- [x] [AI] Verify the 21 historically authored course bundles and their catalogue rows using `npx nx run ayokoding-www:build` — acceptance: exits `0` and every expected course route resolves in the generated output.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**:
    `evidence/authored-body-slugs.txt` (corrected from the superseded 90-body scope to this plan's
    21 owned bodies). A clean webpack-backed `ayokoding-www:build` completed successfully
    (`.next/export-detail.json` reports `success: true`); every registered course body and its
    `/en/learn/courses/<id>` prerendered route is present.
- [x] [AI] Check the manifest-ownership boundary on the persistent final-delivery branch: `git diff --name-only origin/main...HEAD -- apps/ayokoding-www/src/features/course-paths/manifests/ | grep -c .` — acceptance: returns `0`.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: none (read-only verification).
    The `origin/main...HEAD` manifest diff returned zero paths.

### Phase 5 Gate

- [x] [AI] The course-tree verification and ownership-boundary check are green, with no PR, merge, deployment, or new merge SHA.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: none (verification only).
    The authored-tree and ownership checks passed on the persistent final-delivery branch; no PR,
    push, merge, deployment, or merge SHA was created.

> **Pause Safety**: verification is committed only on the persistent final-delivery branch.

---

## Phase 6: Manual content verification

- [x] [AI] Run `npx nx run ayokoding-www:build` and use Playwright MCP to inspect representative AI-engineering, Band 1, and Band 2 courses across supported locales — acceptance: routes render with titles, navigation, and declared prerequisites.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: none (runtime verification).
    A clean local production build was served on port 3104. Playwright MCP verified the English
    content locale (the Indonesian mirror is a deferred non-goal): `evaluating-ai-output-essentials`
    (AI engineering, prerequisite `15 · Software Testing`), `nosql-databases` (Band 1,
    prerequisite `10 · SQL Essentials`), and `api-design` (Band 2, prerequisite
    `11 · Backend Essentials`) all rendered their title, shared navigation, and prerequisite links.
- [x] [AI] Save committed screenshot evidence under `plans/done/2026-08-02__ayokoding-learning-path-04-course-authoring/evidence/` — acceptance: evidence covers the tested locales and breakpoints.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**:
    `evidence/phase-6-en-ai-desktop.png`, `evidence/phase-6-en-band-1-desktop.png`, and
    `evidence/phase-6-en-band-2-mobile.png`. Playwright MCP captured the English content locale
    at 1440×1000 desktop (AI and Band 1) and 390×844 mobile (Band 2); the three PNGs are non-empty
    and will travel with the archival evidence folder.
- [x] [AI] Run the Rule-15 exploratory, usability, and design retest; record and fix every EWT/UWT/DWT defect before continuing — acceptance: no unresolved defect remains.
  - **Date**: 2026-08-02. **Status**: Exempt (documented). **Files Changed**:
    `learnings.md`. The plan's existing, narrow Rule-15 exemption applies because it ships content
    bundles but owns none of the rendering or navigation components that the triad would test; those
    components belong to `ayokoding-learning-path-03-navigation-ui`. Manual Playwright verification
    remains mandatory and passed above, so there are no EWT/UWT/DWT findings to fix.

### Phase 6 Gate

- [x] [AI] Manual assertions, evidence, and the Rule-15 retest are green on the persistent final-delivery branch; no PR is open.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**:
    `evidence/phase-6-en-*.png`, `learnings.md`. The three Playwright assertions and committed
    desktop/mobile screenshots are green; Rule 15 is explicitly waived by the plan's content-only
    exemption, and no PR has been opened.

> **Pause Safety**: manual verification is complete but not deployed; it rides the sole Phase 9 archival PR.

---

## Phase 7: Final branch verification

- [x] [AI] Confirm the persistent final-delivery branch has no open PR: `gh pr list --head "$(git branch --show-current)" --state open --json number --jq 'length'` — acceptance: returns `0`.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: none (read-only verification).
    The sandbox does not expose the `gh` executable, so the equivalent GitHub REST query for
    `ayokoding-learning-path-04-course-authoring-final-delivery` returned zero open pull-request
    numbers.
- [x] [AI] Run the complete local quality suite on the persistent branch: `npx nx affected -t typecheck lint test:quick test:unit specs:behavior:coverage && npx nx run ayokoding-www:build` — acceptance: exits `0`.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: none (verification only).
    The affected suite's concurrent wrapper hit a nested-Nx coverage-directory race, so its same
    targets were completed serially: typecheck, lint, behavior coverage (44 specs / 376 scenarios /
    1,350 steps), unit tests (158 files / 3,462 passed), and isolated coverage (96.4% statements,
    97.72% lines). The clean local production build was also served and manually verified in Phase 6.
- [x] [AI] Record any required downstream manifest handoff in `plans/done/2026-08-02__ayokoding-learning-path-04-course-authoring/delivery.md` — acceptance: it names only the historically completed course bodies and does not claim a new merge SHA.

### Phase 7 Gate

- [x] [AI] No PR is open; the full local suite and build are green; the handoff is branch-local and ready for the sole Phase 9 archival PR.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: none (gate verification).
    The branch remains without an open PR, all required local target outcomes are green, and the
    zero-manifest handoff is branch-local for the sole Phase 9 archival PR.

> **Pause Safety**: final verification is green on the one persistent branch; nothing is deployed or merged yet.

---

## Phase 8: Knowledge Capture

> _Triage every surviving `learnings.md` entry before archival. See the
> [Knowledge Capture Convention](../../../repo-governance/development/quality/knowledge-capture.md)._

- [x] [AI] Apply the litmus test to every `learnings.md` entry — keep only if a durable surface would
      catch this automatically next time; discard the rest with a one-line reason — acceptance: every
      entry has a route or a discard reason.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: `learnings.md`.
    All entries pass the litmus through their recorded terminal routes: workflow correction, separate
    code-homed backlog plan, or the existing Rule-15 exemption record.
- [x] [AI] Apply the **secret/sensitivity gate** to every surviving entry — sanitize any secret,
      credential, token, or private hostname to a `<placeholder>` token, or discard if unsanitizable —
      acceptance: `learnings.md` contains no raw secret.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: none (read-only review).
    The entries contain only public repository paths, public PR URLs, and generic branch examples;
    no credential, token, private hostname, inventory, or secret is recorded.
- [x] [AI] Apply the **repo-relevance gate** — infra-private content (Terraform, k3s, Proxmox, real
      hostnames/inventories) stays in the private sibling only and is NEVER cross-routed into
      `ose-public`/`ose-primer`; public-governance content may propagate via the existing parity loop —
      acceptance: no infra-private content appears in this repo's routed output.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: none (review only).
    Every learning concerns this public repository's workflow, public course content, or its
    documented Rule-15 scope; no infra-private material is routed or retained.
- [x] [AI] Route each surviving learning to exactly one durable home per the open-ended routing matrix
      — non-code homes may land inline (small edit) or as a `plans/backlog/` follow-up (large); **code
      homes (`apps/`, `libs/`, tests) are ALWAYS filed as a separate `plans/backlog/<slug>/` plan and
      NEVER landed inline**. Note this plan's own artefacts are content, not code — a learning about
      the `course-paths` feature code is code-homed and goes to backlog — acceptance: every entry
      records its terminal routing state.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**:
    `repo-governance/workflows/plan/plan-execution.md`,
    `plans/backlog/ayokoding-database-internals-ruff-config/README.md`, and `learnings.md`.
    The workflow learning landed inline, the code-homed Ruff learning has one separate backlog home,
    and the Rule-15 entry retains its existing documented home.
- [x] [AI] If no generalizable learning surfaced, record `No generalizable learnings — <reason>` in
      `learnings.md` — acceptance: `learnings.md` is never silently empty.
  - **Date**: 2026-08-02. **Status**: Not applicable. **Files Changed**: none.
    Three generalizable learnings surfaced and all have terminal routes, so the explicit-none escape
    is neither needed nor appropriate.
- [x] [AI] **Confirm no manifest file changed in this phase** — Phase 8 is intermediate (see the
      [`### Delivery Boundaries`](#delivery-boundaries) table): it commits the `learnings.md` triage
      and any inline non-code fixes on the shared closeout branch and folds into the Phase 9 PR
      rather than opening one of its own, so this phase still gets the same individual gate on its own
      diff (the code-routing rule above already forbids landing a manifest-touching fix inline; this
      re-asserts it mechanically rather than trusting the routing rule alone):
      `git diff --name-only origin/main...HEAD -- 'apps/ayokoding-www/src/features/course-paths/manifests/' | grep -c .`
      — acceptance: returns **0**. Falsifiable both ways: touching any file under that path makes the
      command return ≥1 and the phase gate fails.

### Phase 8 Gate

- [x] [AI] Every `learnings.md` entry is terminal (routed inline / filed as backlog / discarded with
      reason) or the explicit "none" escape is present.
- [x] [AI] No code-homed learning landed inline in this plan's own commits/PRs.
- [x] [AI] Zero manifest files touched (`git diff --name-only ... | grep -c .` returns 0).
- [x] [AI] **No PR opens for this phase** (intermediate — see the
      [`### Delivery Boundaries`](#delivery-boundaries) table): the `learnings.md` triage is committed
      on the shared closeout branch, this phase's own gate above is green, and nothing is pushed for
      review yet — the closeout PR for Phases 6–9 opens at Phase 9.
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**:
    `learnings.md`, `repo-governance/workflows/plan/plan-execution.md`, and the Ruff backlog plan.
    Every learning is terminal; no code-homed change landed inline; the manifest diff is zero; and no
    PR has been opened.

> **Pause Safety**: `learnings.md` is fully triaged; nothing depends on querying it later. Safe to
> stop. To resume: re-read `learnings.md` and confirm every entry is terminal.

---

## Phase 9: Plan Archival

### Sole PR integration (binding)

- [x] [AI] Archive this plan on its persistent final-delivery branch before review — acceptance: the archive move and index updates are committed in the same branch.
  - **Date**: 2026-08-02. **Status**: Done. Committed as `bf7f399c5`.
- [x] [AI] Open exactly one draft PR from that branch and run the PR-Review Maker→Fixer Cycle plus every local and CI gate — acceptance: the PR is the only PR for this plan.
  - **Event Date**: 2026-08-02. **Recorded**: 2026-08-03. **Status**: Done. **Files Changed**:
    `delivery.md` (completion evidence only). Draft PR [#132](https://github.com/wahidyankf/ose-public/pull/132)
    was the plan's sole delivery PR. Its three consolidated review cycles completed, and every
    non-skipped GitHub Actions check concluded `SUCCESS`.
- [x] [AI] Mark the PR ready, merge under the hardened preconditions, and deploy once — acceptance: the merge/deploy record is the plan's sole delivery record.
  - **Event Date**: 2026-08-02. **Recorded**: 2026-08-03. **Status**: Done. **Files Changed**:
    `delivery.md` (completion evidence only). PR #132 merged to `main` as
    `0afd9cc278c0693b3fc5c5ecee1b8bfa32d9a776`. The closeout deployment was a no-op; on
    2026-08-03, all 21 delivered public course routes returned HTTP 200.

- [x] [AI] Verify ALL delivery checklist items are ticked.
  - **Date**: 2026-08-03. **Status**: Done. **Files Changed**: `delivery.md` (completion evidence
    only). `rg -n '^\\s*- \\[ \\]' delivery.md` returned no remaining unchecked checklist item.
- [x] [AI] Verify the Knowledge Capture phase is complete (every entry terminal or the explicit "none"
      escape present; both safety gates applied to every surviving entry).
- [x] [AI] Verify ALL manual assertions pass (Playwright MCP) with committed evidence in `evidence/`;
      the `en` content locale exercised (per the Indonesian-mirror-deferred non-goal).
- [x] [AI] Verify the **rule-15 exemption is recorded with reasons** in `learnings.md` and in Phase 6
      — acceptance: `grep -F -q 'rule-15' learnings.md` exits 0. The triad itself is exempt here; the
      navigation-UI plan runs it against the surface it owns.
- [x] [AI] **Verify this plan's authored-body assertion** —
      `while read -r s; do test -d "apps/ayokoding-www/content/en/learn/courses/$s" || echo "ABSENT $s"; done < evidence/authored-body-slugs.txt | wc -l`
      returns **0**, and `wc -l < evidence/authored-body-slugs.txt` returns **21** — acceptance: both
      hold. **This plan asserts 21, not 127.** The 127-course catalog total is the manifest plans'
      (`ayokoding-learning-path-12-careers-se-manifests` / `ayokoding-learning-path-13-careers-ai-manifest`)
      terminal assertion (21 authored here + 106 elsewhere:
      33 shipped + 4 existing capstones re-homed by `ayokoding-learning-path-01-url-restructure`, plus
      69 native bodies carried by the 7 successor plans — see
      [README §Successor plans](./README.md#successor-plans)).
- [x] [AI] **Verify the ownership invariant held** — re-assert the same sound diff-based mechanism used
      by every prior commit-producing phase's own individual check (Phase 0, Phase 1, Phase 3's and
      Phase 4's per-band closing steps, every one of the 21 individual course sub-phases' own convention
      step 8, Phase 5, Phase 6, and Phase 8), on this phase's own diff (a commit-message `--grep`
      filter is unsound: nothing mandates the plan identifier appear in commit messages, and a filter
      matching zero commits exits 0 and looks like success regardless of whether the invariant actually
      held):
      `git diff --name-only origin/main...HEAD -- 'apps/ayokoding-www/src/features/course-paths/manifests/' | grep -c .`
      returns **0** — acceptance: no manifest file was touched on this branch. Falsifiable both ways:
      touching any file under that path makes it return ≥1.
- [x] [AI] **Verify every cross-plan reference still resolves after upstream archival** — the schema
      plan archives to `plans/done/YYYY-MM-DD__…` while this plan runs, so re-run the BF-8 link gate:

  ```bash
  cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate \
    --quiet \
    --exclude plans/done \
    --exclude apps/ayokoding-www/content \
    --exclude apps/ose-www/content 2>&1 | grep -F "ayokoding-learning-path-04-course-authoring"
  ```

  — acceptance: the `grep` finds **no** matching line (exits 1). If the schema plan's reciprocal
  repoint step has not landed, fix the references in **this plan's own files** and record it —
  never edit the other plan's folder.

- [x] [AI] Move: `git mv plans/in-progress/ayokoding-learning-path-04-course-authoring/ plans/done/YYYY-MM-DD__ayokoding-learning-path-04-course-authoring/`
  - **Date**: 2026-08-02. **Status**: Done. **Files Changed**: the complete archived plan folder,
    including `evidence/`. The plan moved from `in-progress/` to its completion-date folder.
    using today's **completion** date, not the creation date (the `evidence/` subfolder moves with it).
- [x] [AI] Update `plans/in-progress/README.md` — remove the plan entry.
- [x] [AI] Update `plans/done/README.md` — add the plan entry with completion date.
- [x] [AI] Update any other READMEs that reference this plan (`plans/README.md`,
      `plans/backlog/README.md`) and notify every sibling plan whose `Depends-on` table names this plan
      by folder path — this now includes `ayokoding-learning-path-12-careers-se-manifests`,
      `ayokoding-learning-path-13-careers-ai-manifest`, and the 7 successor
      plans carved from this plan's former scope (see
      [README §Successor plans](./README.md#successor-plans)) — acceptance: no sibling plan's link to
      this folder is left dangling (re-run the BF-8 gate with each sibling's folder name substituted in
      the `grep -F`).
- [x] [AI] Commit the archival:
      `chore(plans): move ayokoding-learning-path-04-course-authoring to done`.
  - **Date**: 2026-08-02. **Status**: Done. Commit `bf7f399c5` contains the move, index updates,
    and cross-plan repoints.

### Phase 9 Gate

- [x] [AI] All 21 authored bodies present (the ABSENT loop returns 0, down from the Phase-0 baseline of
      90); the slug register holds 21 unique lines.
- [x] [AI] Zero manifest files touched across the plan's entire history.
- [x] [AI] The BF-8 cross-plan link gate is green after the schema plan's archival.
- [x] [AI] Plan folder is under `plans/done/YYYY-MM-DD__ayokoding-learning-path-04-course-authoring/`;
      all READMEs updated; archival committed.
- [x] [AI] Draft PR opened for the Phase 6–9 closeout unit (manual verification evidence,
      `learnings.md` triage, and the archival move — this unit's own boundary; see the
      [`### Delivery Boundaries`](#delivery-boundaries) table); 3-cycle PR-Review complete; CI green;
      PR `[AI]`-merged; deployed (no-op).
  - **Event Date**: 2026-08-02. **Recorded**: 2026-08-03. **Status**: Done. **Files Changed**:
    `delivery.md` (completion evidence only). PR #132 contains the archival commit, three completed
    review cycles, and green CI; its merged `main` commit is `0afd9cc278c0693b3fc5c5ecee1b8bfa32d9a776`.

> **Completion**: the plan's sole delivery PR (#132) is merged and its complete evidence is recorded
> above. The documentation-only reconciliation commit is authorized to go directly to `origin/main`.
> The user requested deletion of this worktree after that push completes.

---

### Commit Guidelines (all phases)

- [x] [AI] Commit changes thematically — group related changes into logically cohesive commits (one
      course bundle per commit is the natural unit here).
- [x] [AI] Follow Conventional Commits: `<type>(<scope>): <description>` (imperative, no period) —
      e.g. `feat(ayokoding-www): add nosql-databases course body`.
- [x] [AI] Split domains/concerns into separate commits; preexisting fixes get their own commits.
- [x] [AI] Do NOT bundle unrelated changes into a single commit.
- [x] [AI] Stage only this plan's paths (`git add <explicit paths>`) — **never** `git add -A`; sibling
      split plans are being authored concurrently in the same repo.

### Local Quality Gates (Before Every Push)

- [x] [AI] `npx nx affected -t typecheck` exits 0.
- [x] [AI] `npx nx affected -t lint` exits 0.
- [x] [AI] `npx nx affected -t test:quick test:unit` exits 0.
- [x] [AI] `npx nx affected -t specs:behavior:coverage` exits 0.
- [x] [AI] `npm run lint:md` exits 0.
- [x] [AI] Fix ALL failures — including preexisting issues not caused by your changes (Root Cause
      Orientation).
  - **Date**: 2026-08-03. **Status**: Done. **Files Changed**: `delivery.md` (completion evidence
    only). The affected typecheck, lint, quick-test, and behavior-coverage suite completed with no
    failing target; pre-existing lint warnings remained warnings and introduced no failure to fix.

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes.
> This follows the root cause orientation principle — proactively fix preexisting errors encountered
> during work. Commit preexisting fixes separately with appropriate conventional-commit messages.

### Note: plan location at archival time

This plan is created in `plans/backlog/ayokoding-learning-path-04-course-authoring/`. When work
starts it is promoted to `plans/in-progress/ayokoding-learning-path-04-course-authoring/` (no date
prefix on either); the `git mv` in Phase 9 then archives it to
`plans/done/YYYY-MM-DD__ayokoding-learning-path-04-course-authoring/` using the completion date.
