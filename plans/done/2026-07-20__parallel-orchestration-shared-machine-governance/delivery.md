# Delivery — Parallel-Orchestration & Shared-Machine Governance

> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.
>
> **Phase Gate** — every phase ends with a `### Phase N Gate` (must-pass verification) plus a
> `> **Pause Safety**:` note (the safe-to-stop state and the single command to resume). A phase is
> not complete until its gate is green; do not start phase N+1 while any gate check fails.

## Worktree

Worktree path: `worktrees/parallel-orchestration-shared-machine-governance/`

Optional manual pre-provisioning (run from repo root):

```bash
claude --worktree parallel-orchestration-shared-machine-governance
```

The plan-execution Step 0 gate enters this worktree by default: it auto-provisions from the latest
`origin/main` when missing, syncs with `origin/main` before implementing, and prompts before deleting
the worktree after the plan is archived and pushed. Propagation phases (6, 7) provision their own
per-repo worktrees in `ose-primer` and `ose-infra`.

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) and
[Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

## Parallelization Model

This plan uses the **N+1 model it introduces**: `1 main thread + N background agents = N+1 total`,
**default N=3** (4 total, chosen to bound token/compute-budget burn), N adjustable along the way.

**Dependency DAG** (nodes = phases/steps; edges = blocks/blockedBy). Independent nodes fan out up to
N; dependent nodes serialize; **cleanup (Phase 9) is the terminal node depending on all delivery
nodes**: Phases 0-5 form a dependent serial spine (each phase builds the source of truth the next
needs); Phase 5's ose-public merge fans out into two independent parallel branches, Phase 6
(ose-primer) and Phase 7 (ose-infra); both join back at Phase 8 (Knowledge Capture), which feeds
Phase 9 (Cleanup), the terminal node. See the authoritative Mermaid rendering of this flow in
[`tech-docs.md` §Phase / delivery flow (gated progression)](./tech-docs.md#phase--delivery-flow-gated-progression)
— this section is the prose summary only, not a second diagram, to avoid two diverging
representations of the same flow.

Concurrency map:

- **Serial spine**: Phases 0→1→2→3→4→5 are dependency-ordered (each builds the source of truth the
  next needs) — they run one at a time.
- **Parallel branch**: Phase 6 (ose-primer) and Phase 7 (ose-infra) are genuinely independent once
  Phase 5 merges → they fan out as **2 parallel worktrees** (dogfooding N+1).
- **Within a phase**: independent doc edits across distinct files may run in parallel up to N=3
  background agents; dependent edits (e.g. a convention file then its index link) stay serial.

**Background-slot preference**: fill the background slots up to N and keep the **main thread vacant
and responsive** (orchestrator, not long-running worker) — but bounded by the DAG: never force
parallelism onto dependent nodes just to raise utilization.

**Status cadence**: while task-list items are active, the orchestrator updates the user every **3-5
minutes (not faster)** — no update-storming on micro-events.

**Adjust N** down under budget/runner/disk pressure on the shared machine; never silently
self-promote beyond the declared N without cause. Keep the 3-min mtime poll / 30-min stuck /
`TaskStop`+relaunch guidance.

**Per-phase PR + feature-flag structure (Delta 10)**: this plan decomposes delivery so independent
DAG nodes can land as separate PRs — the propagation branch (Phases 6 + 7) is the concrete example:
`ose-primer` and `ose-infra` each get **their own worktree → branch → PR** (strict **1-PR ↔
1-worktree**), reviewed and merged in parallel. Phases 0-5 form one dependent chain (the source of
truth must land first) and therefore stay a single ose-public PR — a genuine DAG dependency is NOT
force-split. Feature flags are not applicable to this docs/governance change (no runtime code to keep
dark), but the plan encodes the flag rule into governance for future code-bearing plans.

## Delivery Mode: worktree-to-pr

Per-repo worktree + draft PR across `ose-public` → `ose-primer` → `ose-infra`. `ose-public` is
authored and merged first as the source of truth, then `ose-primer` and `ose-infra` are propagated in
parallel. Each repo's PR runs the **PR-Review Maker→Fixer Cycle** (default 3 sequential CI-gated
cycles via `pr-review-maker` → `pr-review-fixer`) before the `[HUMAN]` merge. Per the maintainer's
standing preference, `[AI]` may auto-merge once the hardened merge preconditions hold (3 review
cycles + branch up-to-date with latest `origin/main` via non-destructive forward update + all gates
green). Git-mechanical steps (worktree add, commit, push to the PR branch, worktree remove) are `[AI]`.
This `[AI]`-auto-merge deviation from the mode's default `[HUMAN]`-merge requirement is a documented,
authorized exception — see **DD-10** in `tech-docs.md` §Design decisions for the rationale, the
authorizing context, and its explicit non-precedential scope. (DD-10 itself now also carries a
"Status: DISSOLVED BY DELTA 12" note — that is deliberately **sequential, not contradictory**: this
very plan must still cite DD-10 for its own Phase 5/6/7 merges because Delta 12 — this plan's own
Phase 4 change inverting the repo-wide merge default — is not yet live in the target repos' `main`
until this plan's PR merges. See DD-10's bootstrap-timing paragraph for the full argument.)

> **Plan-doc authoring vs plan execution (distinct delivery paths)**: this `worktree-to-pr` mode
> governs the plan's **execution** (the governance/config edits it applies). The **plan-doc artifacts
> themselves** (this plan's `README.md`/`brd.md`/`prd.md`/`tech-docs.md`/`delivery.md`/`learnings.md`
> and related `.md` edits) are authored on the **primary checkout and committed + pushed directly to
> `origin main`** — docs-only `.md` changes fall in the "known-safe direct push" category, so no
> worktree/PR is needed for the authoring artifacts. This is the working example of the same principle
> behind the pure-schedule main-CI decision (see §Delivery Mode rationale in `tech-docs.md`). This
> split — and its consequence that Plan Archival lands via direct push after all three PRs merge,
> rather than inside any one delivering PR — is a documented, authorized deviation for this specific
> tri-repo-propagation plan: see **DD-11** in `tech-docs.md` §Design decisions for the rationale,
> the authorizing context, and its explicit non-precedential scope.

## Guardrails (this plan obeys its own new rules)

- **Non-destructive git only**: no `git reset --hard`, `git checkout -f`, `git clean -fd`,
  `git branch -D` on shared branches, force-push, shared-branch history rewrite,
  `git worktree remove --force` on worktrees you did not create, work-swallowing `git stash`, or
  shared-object-store pruning. Operate only within this plan's own worktrees.
- **Explicit-path staging**: stage named paths only. No whole-tree staging in any spelling —
  `git add -A`, `git add --all`, `git add .`, whole-tree `git add -u`, `git commit -a`, or any
  stage-everything wrapper. Run `git status --porcelain` first and leave every line you cannot account
  for unstaged (the sibling repos and shared worktrees carry other actors' WIP); use
  `git -C <worktree>` when acting on another tree.
- **No corner-cutting**: every failing gate, test, lint, type-check, or CI job is root-caused. No
  `--no-verify`, no skipped gate, no deleted/narrowed failing test, no weakened acceptance criterion
  or threshold, no checkbox ticked without its required evidence, no suppressed error, no deferred
  preexisting failure. A blocker that is genuinely out of scope is escalated and recorded in
  `learnings.md` with what was tried — never silently worked around.
- **rhino-cli byte-identity**: do NOT touch `apps/rhino-cli/**` or the rhino gherkin tree
  (`specs/apps/rhino/behavior/rhino-cli/gherkin/**`). If any rhino-cli surface is unavoidably touched,
  it MUST remain byte-identical across all three repos.
- **Self-scoped cleanup**: the final Cleanup gate removes only this plan's own worktrees and
  self-created artifacts, verified-not-in-use; never the shared cargo `target/` or any shared cache.

---

## Phase 0: Environment Setup and Baseline

> _Executor: repo-setup-manager_

- [x] [AI] Provision/enter the worktree `worktrees/parallel-orchestration-shared-machine-governance/`
      from latest `origin/main` — acceptance: `git -C worktrees/parallel-orchestration-shared-machine-governance status` shows a clean tree on a fresh branch off `origin/main`
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: none (git-mechanical)
  - **Notes**: `git fetch origin` then
    `git worktree add -b parallel-orchestration-shared-machine-governance worktrees/parallel-orchestration-shared-machine-governance origin/main`.
    Verified: `git status --porcelain` empty; `HEAD` = `origin/main` = `a207b66e7`. Execution root is
    now the worktree. Git identity verified as the maintainer's (`wahidyankf@gmail.com`), not the
    stray `test@test.com` from the prior fixture incident.
- [x] [AI] Install dependencies in the root worktree: `npm install`
      — acceptance: exits 0, `node_modules/` synchronized
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: none tracked (`node_modules/` is gitignored)
  - **Notes**: `npm install` exited 0 — "added 1572 packages, and audited 1596 packages". The audit
    summary (47 vulnerabilities) is preexisting upstream-advisory noise carried by the committed
    `package-lock.json`; it is not a gate this plan's acceptance criterion asserts on, and remediating
    it would be a dependency-bump change governed by its own policy — out of this plan's scope.
- [x] [AI] Converge the toolchain in the root worktree: `npm run doctor -- --fix`
      — acceptance: exits 0 with no unresolved drift
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: none tracked (cargo target-share symlinks are gitignored)
  - **Notes**: Exit 0. `Summary: 16/16 tools OK, 0 warning, 0 missing`; `Nothing to fix — all tools
are installed.` First run performed the cargo target-share fix-up for the four Rust crates
    (`ayokoding-cli`, `ose-cli`, `rhino-cli`, `rust-commons`) — expected for a fresh worktree, since
    each crate's `target/` must be redirected to the shared store. A confirming second run reported
    `4 already correct, 0 created`, proving convergence is stable rather than re-fixing every run.
- [x] [AI] Record the pre-change grep baseline of the old cap phrasing:
      `grep -rn "cap at 2\|3 total\|Cap at Three\|stricter cap of 2\|2 concurrent background\|capped at \*\*3 concurrent\*\*" AGENTS.md CLAUDE.md repo-governance/`
      — acceptance: hit list captured in `learnings.md` as the "surfaces to update" baseline
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `plans/in-progress/parallel-orchestration-shared-machine-governance/learnings.md`
  - **Notes**: 15 hits across 8 files, tabulated in `learnings.md` §"Phase 0 baseline — old cap
    phrasing". `CLAUDE.md` carries **zero** hits — it inherits the concurrency model through its
    `@AGENTS.md` import, which is why the §4a `CLAUDE.md` checkbox expects its word-bounded grep to
    stay at 0. Recorded alongside the baseline: the Phase 4 Gate's superseded-cap proof uses a
    **wider** pattern than this command, so "15 → 0" is not the right cross-check between them.
- [x] [AI] Record the **plan-start baseline SHA** for each of the three repos —
      `git -C <repo> rev-parse origin/main` for `ose-public`, `ose-primer`, `ose-infra` — and write the
      three SHAs into `learnings.md` under a `## Plan-start baseline SHAs` heading, one per line, in
      exactly this literal format (plain bullet, no bold, repo name then colon then full SHA):
      `- ose-public: <sha>` / `- ose-primer: <sha>` / `- ose-infra: <sha>`. Every later
      "commits this plan authored" check anchors to these SHAs (`<baseline-sha>..origin/main`), never
      to reflog-relative syntax such as `origin/main@{1}`, which resolves only on a checkout with local
      reflog history and silently drifts on every fetch — acceptance:
      `grep -Ec '^- \*{0,2}(ose-public|ose-primer|ose-infra)\*{0,2}: [0-9a-f]{7,40}' learnings.md`
      returns 3 (the `\*{0,2}` tolerates a bolded repo name so a correctly-executed step cannot fail
      on formatting alone); returns 0 before this step runs
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `plans/in-progress/parallel-orchestration-shared-machine-governance/learnings.md`
  - **Notes**: Acceptance grep verified live — returns **3**. Baselines (after `git fetch origin main`
    in each repo): `ose-public` `a207b66e7e59bc6fafd1f650480718fcae02f7e5`, `ose-primer`
    `1728a6e751980289753bf93934d446b998161741`, `ose-infra`
    `edbb604e49a1c84f00bd01ea547bbd126b87b29c`. The primer and infra SHAs match the two commits from
    the prior `GIT_DIR` fixture-isolation fix, confirming both siblings are at their expected tips and
    no unexpected work landed between that fix and this plan's start.
- [x] [AI] Establish the docs quality baseline: `npm run lint:md:fix` then
      `npx nx affected -t lint` — acceptance: baseline pass/fail recorded; preexisting failures documented
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: none (both commands were clean)
  - **Notes**: `npm run lint:md:fix` exit 0 — `Linting: 2974 file(s)` / `Summary: 0 error(s)`, and
    `git status --porcelain` afterwards showed only this plan's own two in-flight files, proving
    `--fix` rewrote nothing repo-wide. `npx nx affected -t lint --base=origin/main` exit 0 with
    `No tasks were run` — correct, not a miss: only `plans/**` markdown differs from `origin/main` so
    far, and no Nx project owns those paths. **Baseline: zero preexisting failures**, so the next
    checkbox has nothing to resolve.
- [x] [AI] Resolve all preexisting failures before proceeding — acceptance: no preexisting failures remain
  - **Date**: 2026-07-20 — **Status**: DONE (nothing to resolve)
  - **Files Changed**: none
  - **Notes**: The previous checkbox's baseline found **zero** preexisting failures — `lint:md:fix`
    0 errors across 2974 files, `nx affected -t lint` exit 0, `npm run doctor -- --fix` 16/16 tools
    OK. Ticked as a genuine no-op with the evidence recorded, per the plan-execution rule that an
    inapplicable item is ticked with a stated reason rather than skipped silently. The one thing
    deliberately **not** treated as a preexisting failure is `npm audit`'s 47 upstream advisories:
    no gate in this repo asserts on it, and acting on it would be an out-of-scope dependency bump
    governed by its own three-path policy.

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `npm install` exited 0 and `npm run doctor -- --fix` reports no unresolved drift
  - **Date**: 2026-07-20 — **Status**: GREEN
  - **Notes**: Re-verified at gate time (not merely inherited from the earlier item): `doctor --fix`
    exit 0, `Nothing to fix — all tools are installed.`
- [x] [AI] The old-cap grep baseline is recorded in `learnings.md` and markdown lint baseline is clean
  - **Date**: 2026-07-20 — **Status**: GREEN
  - **Notes**: `learnings.md` carries the `## Phase 0 baseline — old cap phrasing` section with all
    15 hits tabulated by file and line. Markdown baseline re-run at gate time: `Summary: 0 error(s)`
    across 2974 files.
- [x] [AI] The three plan-start baseline SHAs are recorded in `learnings.md` — acceptance:
      `grep -Ec '^- \*{0,2}(ose-public|ose-primer|ose-infra)\*{0,2}: [0-9a-f]{7,40}' learnings.md`
      returns 3
  - **Date**: 2026-07-20 — **Status**: GREEN
  - **Notes**: Acceptance grep re-run at gate time — returns **3**.

> **Pause Safety**: only the local toolchain and the grep baseline were established — no governance
> edits exist yet. Safe to stop indefinitely. To resume: re-run the grep baseline and confirm it
> still matches.

---

## Phase 1: N+1 Parallel-Orchestration Model (ose-public)

> _Suggested executor: `repo-rules-maker`_

- [x] [AI] Edit `AGENTS.md` §Agent Workflow Orchestration (lines ~264-266): replace
      "capped at 3 concurrent … background agents cap at 2 (never more), for 3 total including the
      main thread" with the N+1 model — "1 main thread + N background agents = N+1 total; default
      N=3 (4 total); N adjustable per-plan and along the way; never silently self-promote beyond the
      declared N; keep mtime/staleness relaunch guidance" — acceptance: `grep -n "N+1\|N background\|default N=3" AGENTS.md` returns the new text and the old numbers are gone
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `AGENTS.md` (§Agent Workflow Orchestration)
  - **Notes**: Executed directly rather than via `repo-rules-maker`. Rationale: the acceptance
    criteria here are exact grep literals and Delta 1's wording is normative, so paraphrase risk
    outweighs delegation benefit; the plan's phase-level executor annotation is a heuristic, and the
    workflow's Agent Selection rule 5 permits direct execution for bounded, context-complete edits.
  - **Verified both directions**: `grep -n "N+1\|N background\|default N=3" AGENTS.md` returns 2 hits
    (lines 266-267); `grep -n "cap at 2\|3 total\|capped at \*\*3 concurrent\*\*" AGENTS.md` returns
    **0** (exit 1) — every old number is gone from this file.
  - **Scope note**: this checkbox covers the concurrency model only. The DAG rule, 3-5 min status
    cadence, PR-as-merge-point, and hardened merge preconditions also land in `AGENTS.md`, but via
    §4a/§4b in Phase 4 — kept separate so each has its own discriminating acceptance check.
- [x] [AI] Edit `repo-governance/development/agents/agent-workflow-orchestration.md` §Parallelism
      Budget (lines ~111-117): rewrite to the N+1 model with default N=3, adjustable up/down; add the
      same-machine assumption sentence — acceptance: section states N+1 + default N=3 + adjustable; no
      standing "two (2) concurrent background operations" fixed-cap assertion remains
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/agents/agent-workflow-orchestration.md` (§Parallelism Budget)
  - **Notes**: Rewrote the two fixed-cap paragraphs into four: the N+1 accounting (`1 main thread +
N background = N+1`, default N=3), the why-3 rationale, the adjustable/never-self-promoted rule,
    and the same-machine assumption. The "requires explicit user permission to exceed two" paragraph
    was **replaced rather than retained** — under an adjustable N it would have re-imposed the very
    fixed ceiling this delta removes.
  - **Verified both directions**: N+1/default-N=3, adjustable, and same-physical-machine clauses each
    return ≥1; `grep -n "two (2) concurrent background operations"` returns **0** (exit 1). A wider
    residual sweep of this file for `cap of two|two background|≤2 concurrent|cap at 2|3 total` also
    returns **0** — the stale `≤2 concurrent background agents` phrasing in
    `agents/README.md` is a different file and is §4a's checkbox, not this one's.
- [x] [AI] Edit `repo-governance/development/agents/subagent-orchestration.md` Standard 1 (lines
      ~73-93) and the anti-pattern examples (lines ~170-196): change the background cap from a fixed 2
      to N (default 3); keep Standards 2-4 (polling, stuck detection, chunk sizing, relaunch)
      unchanged — acceptance: `grep -n "default N\|N background" subagent-orchestration.md` present; the
      "cap is 2 background" standing assertions rewritten to N (default 3)
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/agents/subagent-orchestration.md`
  - **Notes**: Rewrote Standard 1 (heading, cap paragraph, Applies-to, Rationale, Sequencing,
    Override→**Adjustment** rule, and all six worked examples) plus **three sites the checkbox's
    stated line ranges did not name**: the Simplicity-Over-Complexity principle bullet at line 27 and
    the two anti-pattern blocks' `Why it fails` / `Fix` pairs. Those extra sites were caught by
    grepping the whole file rather than trusting the cited ranges — leaving them would have left the
    file self-contradicting.
  - **Verified both directions**: `grep -cn "default N\|N background"` returns **5**; a wide residual
    sweep for `cap at 2|3 total|2 background|2 concurrent|cap of 2|more than 2` returns **0**
    (exit 1). Standards 2-4 confirmed structurally intact — `grep -n "^### Standard"` still lists all
    four headings, with only Standard 1's title changed.
  - **Beyond the letter of the checkbox**: the Adjustment rule now also states that N is _lowered_
    under pressure and that a plan declares its N in `## Parallelization Model`, and Standard 1 gained
    the background-slot-preference paragraph (Delta 7) — the latter is separately acceptance-checked
    by the Phase 1 background-slot checkbox against `parallel-by-default.md`.
- [x] [AI] Edit `repo-governance/development/practice/parallel-by-default.md` Standards 2 & 3 (lines
      ~74-86): unify the "cap at three" tool-batching cap and the "stricter cap of 2" subagent cap
      into a single adjustable N (default 3), with +1 = the main thread — acceptance: single N model
      documented; cross-links to subagent-orchestration + agent-workflow-orchestration updated
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/practice/parallel-by-default.md`
  - **Notes**: Standard 2 became "The N+1 Model (One Adjustable N)" and Standard 3 was **repurposed**
    from "Subagent Specialization (Stricter Cap)" to "Background-Slot Preference". That repurposing
    is the point: with one N there is no longer a stricter second cap for Standard 3 to describe, so
    leaving it as a cap section would have re-stated the asymmetry this delta removes. Subagent
    spawns are now framed as a _specialization using the same N_, not an exception to it.
  - **Two sites outside the cited line range** also had to change, found by grepping the whole file:
    the Deliberate-Problem-Solving principle bullet ("the cap of three is a deliberate constraint")
    and the Related-Practices cross-link line, which still advertised "a stricter cap of 2 (3 total
    including the main thread)". Both cross-links were updated as the acceptance criterion requires.
  - **Verified both directions**: the Phase 4 Gate's own repo-wide pattern
    (`cap at 2|cap of 2|cap 3 concurrent|3 total|2 background|stricter cap of 2|never more`) returns
    **0** against this file (exit 1); `N+1 model|One N, not two|default is 3` returns 2. One
    deliberate survivor: Standard 2's "One N, not two" paragraph describes the superseded asymmetry
    in **words** ("a stricter cap of two"), not digits, so it documents the history without
    re-tripping the numeric sweep.
- [x] [AI] Add the **default-N rationale** to `agent-workflow-orchestration.md` + `parallel-by-default.md`:
      N=3 defaults specifically to bound token/compute-budget burn; raising N is deliberate + justified
      (independent work + capacity + budget headroom); lower under budget/runner/disk pressure
      — acceptance: `grep -ci "bound token/compute-budget burn" agent-workflow-orchestration.md` returns
      **≥1** (returns **0** today, confirmed live — the pre-existing "## Operating Budgets" section
      elsewhere in the file matches the broader `token\|compute\|budget` pattern, so that broader
      pattern is vacuously true pre-edit and MUST NOT be used as the acceptance signal)
  - **Date**: 2026-07-20 — **Status**: DONE (satisfied by the Phase 1 items 2 and 4 edits)
  - **Files Changed**: none additionally — the rationale landed with the section rewrites in
    `agent-workflow-orchestration.md` (§Parallelism Budget, "Why the default is 3") and
    `parallel-by-default.md` (Standard 2, "Why the default is 3").
  - **Notes**: Ticked as already-satisfied rather than re-edited. Writing the rationale as a separate
    later pass would have meant either duplicating the paragraph or splitting the "what N is" and
    "why N is 3" halves across the file — both worse than stating them together. Recording the
    overlap here so the tick is auditable rather than looking like a skipped step.
  - **Verified**: the discriminating literal `grep -ci "bound token/compute-budget burn"` returns
    **1** in each of the two files (it returned **0** in both pre-plan). Raising-is-deliberate and
    lowering-is-required clauses each confirmed present in both files.
  - **Grep-pattern correction**: my first verification of the "lowering" clause used
    `lowering it is \*\*required\*\*` and returned 0 for `parallel-by-default.md` — a **false
    negative**. The file bolds the whole phrase (`**lowering it is required**`), so the asterisks sit
    outside, not inside. Confirmed present by re-grepping the plain substring. Recorded because the
    same mis-anchored-emphasis mistake would silently fail any acceptance clause written this way.
- [x] [AI] Add the **DAG-first orchestration** rule to `agent-workflow-orchestration.md` +
      `parallel-by-default.md`: every non-trivial task list AND delivery checklist declares a dependency
      DAG (nodes=tasks/items, edges=blocks/blockedBy); independent nodes parallelize up to N, dependent
      nodes serialize; the DAG's independent-node width is the fan-out (capped at N); cleanup is the
      terminal node — acceptance: `grep -ni "DAG\|blockedBy\|dependency graph" agent-workflow-orchestration.md` present
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/agents/agent-workflow-orchestration.md` (new
    `### DAG-First Orchestration`), `repo-governance/development/practice/parallel-by-default.md`
    (new `### Standard 4 — DAG-First Ordering`)
  - **Notes**: Both homes state the same four elements — nodes/edges, independent-width-is-the-fan-out
    (N caps it, never creates it), the `blocks`/`blockedBy` vs `## Parallelization Model` split
    between task lists and `delivery.md`, and cleanup as the terminal node. Added beyond the
    checkbox's letter: an operational test for independence — two nodes are independent only when
    neither reads what the other writes, so a shared output file, shared branch, or ordering
    constraint makes them dependent however separable they look. Without that, "independent" is
    self-assessed and the rule is unfalsifiable in practice.
  - **Verified**: acceptance grep returns **5** in `agent-workflow-orchestration.md` (and 5 in
    `parallel-by-default.md`); `terminal node` present in both.
- [x] [AI] Add the **background-slot preference** to `parallel-by-default.md` +
      `subagent-orchestration.md` + `agent-workflow-orchestration.md`: fill background slots up to N,
      keep the main thread vacant/responsive (orchestrator not worker), bounded by the DAG — never force
      parallelism onto dependent nodes — acceptance:
      `grep -ci "main thread.*vacant\|background.slot.preference" parallel-by-default.md` returns **≥1**
      (returns **0** today, confirmed live — the bare word "responsive" alone (an existing, unrelated
      anti-pattern example about API latency) MUST NOT be used as the acceptance signal; it is already
      present pre-edit)
  - **Date**: 2026-07-20 — **Status**: DONE (landed with the Phase 1 items 3, 4 and 6 section rewrites)
  - **Files Changed**: none additionally — the rule sits in `parallel-by-default.md` (Standard 3, its
    own heading), `subagent-orchestration.md` (Standard 1, **Background-slot preference** paragraph),
    and `agent-workflow-orchestration.md` (`### Background-Slot Preference`).
  - **Notes**: Ticked as already-satisfied. In each file the rule had to be written where the
    concurrency model itself is stated — appending it later as a detached paragraph would have
    separated "keep the main thread vacant" from the N it is bounded by. Recording the overlap so
    the tick is auditable rather than looking skipped.
  - **Verified**: the discriminating pattern `main thread.*vacant|background.slot.preference` returns
    **2 / 1 / 2** across the three files respectively (it returned **0** in all three pre-plan).
    Every occurrence is paired with the DAG bound — fan out independent nodes only, never split
    dependent work to fill idle slots — so the preference cannot be read as licence to over-parallelize.
- [x] [AI] Add the **vendor-neutral, capability-gated** paragraph to `agent-workflow-orchestration.md`
      verbatim from `tech-docs.md §Cross-harness compatibility` (no vendor names, no numeric caps in the
      prose — per the Governance Vendor-Independence Convention): background-capable harnesses fan out to
      N per-worktree; non-capable harnesses walk the same DAG serially; delivery-safety rules apply
      identically in both modes — acceptance: paragraph present; `npx nx run rhino-cli:governance:vendor-audit-validation`
      (real Nx target, wraps `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- repo-governance vendor validate repo-governance/`, per `.github/workflows/main-ci.yml`'s `governance` job) reports no vendor leakage
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/agents/agent-workflow-orchestration.md`
    (new `### Harness Capability Gating`)
  - **Notes**: The tech-docs paragraph landed **verbatim** as a blockquote — copied, not paraphrased,
    since it was authored specifically to survive the vendor-audit scanner. It carries no vendor name
    and no numeric ceiling: the harness's own limit is deferred to ("respecting the harness's own
    documented concurrency ceiling if one exists") rather than restated. The three capability tiers
    and their vendor names stay in `tech-docs.md`, which is a plan document, not governance prose.
  - **Added around it**: one closing sentence making the portability claim explicit — the DAG is the
    portable artifact; concurrency changes the schedule, never the ordering or the safety rules. It
    names no vendor and no number, so it does not weaken the audit position.
  - **Verified**: `npx nx run rhino-cli:governance:vendor-audit-validation` exit **0** —
    `GOVERNANCE VENDOR AUDIT PASSED: no violations found`.
- [x] [AI] Update the **worktree-to-pr as parallelism mechanism** rationale in
      `agent-workflow-orchestration.md`: sharpen that the **PR** (not just the worktree) is the
      independent merge point — N parallel units → N PRs that review/gate/merge independently without
      blocking each other; each DAG leaf producing changes gets its own worktree + PR — cross-link
      [Delivery Mode](../../../repo-governance/conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode)
      — acceptance: rationale names the PR as the enabler; link resolves
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/agents/agent-workflow-orchestration.md`
    (new `### The PR Is the Independent Merge Point`)
  - **Notes**: States the sharpened claim the checkbox asks for — a worktree isolates _edits_, but if
    N parallel units funnel into one branch or one PR they re-serialize at the moment that matters;
    the PR is what makes them independently reviewable, gateable, and mergeable. Records the strict
    one-node ↔ one-worktree ↔ one-PR mapping **with its corollary**: dependent nodes stay in one PR,
    never force-split to manufacture PRs, and independent nodes are never batched to manufacture
    fewer. The DAG governs in both directions.
  - **Defect caught and fixed mid-item**: the first draft closed with a cross-link to
    `../workflow/worktree-and-artifact-cleanup.md` — a file **Phase 3 has not created yet**. That
    forward reference would have failed this phase's own gate (`md links validate`). Removed the link
    and kept the sentence; wiring the cleanup convention is Phase 3's cross-link checkbox, which owns
    it and runs after the file exists.
  - **Verified**: `md links validate` exit **0** — `All links valid! No broken links found.`, which
    covers the new `#delivery-mode` anchor into `conventions/structure/plans.md` (a `###` heading, so
    the anchor is `#delivery-mode`).
- [x] [AI] Grep-sweep for any remaining stale numbers using the Phase 0 baseline command
      — acceptance: no unintended "cap at 2"/"3 total"/"stricter cap of 2" hits remain in ose-public
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/README.md` (line 154),
    `repo-governance/development/agents/README.md` (line 38)
  - **Notes**: Sweep after the four Phase 1 surface edits left **3** hits. Two were index entries that
    had become **factually wrong the moment I edited the conventions they describe** —
    `development/README.md` still advertised "default 2 simultaneous background spawns … 3 total" and
    `agents/README.md` still advertised "≤2 concurrent background agents". Fixed here rather than
    deferred: they are fallout from this phase's own edits, and Root Cause Orientation forbids leaving
    a surface I just broke for a later phase to find.
  - **Plan gap found**: `repo-governance/development/README.md` is **not named** in the Phase 4 §4a
    checkbox, which lists only `development/agents/README.md` and `development/practice/README.md`.
    Had I deferred instead of fixing, that stale line would have survived the entire plan and only
    surfaced at the Phase 4 Gate's repo-wide superseded-cap proof. Logged to `learnings.md`.
  - **One hit deliberately left**: `repo-governance/workflows/plan/multi-plans-execution.md:118`
    ("background subagents cap at 2 (3 total…)"). It is **not** unintended — §4c-i carries a dedicated
    checkbox for this file requiring a full adoption of N+1 / background-slot-preference / DAG-first /
    3-5 min cadence / 1-PR↔1-worktree, with its own acceptance grep. A one-line patch here would have
    made that checkbox's pre-edit baseline vacuous. Phase 4's Gate re-proves the sweep reaches zero.
  - **Verified**: post-fix sweep returns exactly that one known, checkbox-owned hit.

### Phase 1 Gate

> All checks below must pass before starting Phase 2.

- [x] [AI] `npx nx affected -t lint` and `npm run lint:md:fix` — exit 0, no markdown violations
  - **Date**: 2026-07-20 — **Status**: GREEN
  - **Notes**: `npx nx affected -t lint --base=origin/main` exit 0 (`No tasks were run` — Phase 1
    touched only `repo-governance/**` and `AGENTS.md`, which no Nx project owns; this is a correct
    result, not a silently-skipped gate). `npm run lint:md:fix` exit 0, `Summary: 0 error(s)` across
    2974 files.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate --exclude plans/done --exclude apps/ayokoding-www/content --exclude apps/ose-www/content`
      (real invocation — mirrors `.husky/pre-push` and `.github/workflows/main-ci.yml`'s `md-links` job; there is no `rhino-cli:links:validation` Nx target) — exit 0 (no broken links from edited files)
  - **Date**: 2026-07-20 — **Status**: GREEN
  - **Notes**: Exit 0 — `All links valid! No broken links found.` This gate is what caught the one
    real link defect in Phase 1 (a forward reference to the not-yet-created
    `worktree-and-artifact-cleanup.md`), which was removed at its source rather than excluded here.
- [x] [AI] Grep sweep confirms the N+1 model replaced the old numbers across the four surfaces
  - **Date**: 2026-07-20 — **Status**: GREEN
  - **Notes**: Checked **both** halves per surface, since "N+1 present" and "old numbers gone" can
    each pass while the other fails.
    - N+1 occurrences / stated-default occurrences: `AGENTS.md` 2/1,
      `agent-workflow-orchestration.md` 1/2, `subagent-orchestration.md` 7/3,
      `parallel-by-default.md` 4/2 — every surface carries both the model and its default.
    - `cap at 2|3 total|Cap at Three|stricter cap of 2` returns **0** in all four files.
  - **Repo-wide**: the only surviving hit anywhere under `AGENTS.md` / `CLAUDE.md` /
    `repo-governance/` is `workflows/plan/multi-plans-execution.md:118`, owned by its own §4c-i
    checkbox and re-proved by the Phase 4 Gate. Two index READMEs that this sweep exposed as stale
    were fixed within Phase 1 rather than deferred.

> **Pause Safety**: the concurrency model is internally consistent across the four ose-public
> surfaces; conventions build and lint clean. Safe to stop. To resume: re-run the grep sweep + lint.

---

## Phase 2: No-Destructive-Git-Operations Convention (ose-public, NEW)

> _Suggested executor: `repo-rules-maker`_

- [x] [AI] Create `repo-governance/development/workflow/no-destructive-git-operations.md` (sibling of
      `git-push-safety.md`) with: frontmatter, purpose, the same-machine assumption, the forbidden-op
      table (reset --hard, checkout -f/--force, clean -fd, branch -D on shared branches, force-push to
      shared branches, history rewrite on shared branches, worktree remove --force on others'
      worktrees, work-swallowing stash, shared-object-store pruning), the additive/own-worktree
      preference, explicit-path staging, principles/conventions cross-links, and a companion link to
      `git-push-safety.md` (remote side) — acceptance: file exists; count DISTINCT matched terms, not
      matching lines (`grep -c` counts lines, so prose that packs several terms into one paragraph
      would undercount):
      `grep -oE 'reset --hard|clean -fd|git add -A' no-destructive-git-operations.md | sort -u | wc -l`
      returns ≥ 3, regardless of how the prose is line-wrapped
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/workflow/no-destructive-git-operations.md` _(new)_
  - **Notes**: Created with frontmatter, the same-machine assumption, Principles/Conventions sections
    (matching the sibling `git-push-safety.md` shape), a 12-row forbidden-op table pairing each
    operation with what it destroys **and** its non-destructive equivalent, a Cross-Worktree Facts
    section, the additive/own-worktree preference, and the reciprocal companion link.
  - **Two facts called out separately** because they read as safe and are not: bare
    `--force-with-lease` (a stale fetch satisfies the lease) and `--prune=now` (documented as
    corruption-risking under concurrency). Both quote `git-scm.com` rather than paraphrasing. The
    `--ignore-other-worktrees` bypass flag is named explicitly so agents know the guard exists _and_
    that deliberately defeating it is out of bounds.
  - **Verified**: acceptance grep returns exactly **3** distinct terms.
  - **Baseline defect caught and fixed within this item**: the first draft used the literal
    `--no-verify` twice — in the Conventions section and in Related Documentation — while merely
    _describing_ the companion convention. That silently broke the **next-but-one** checkbox's
    "returns 0 immediately before this edit" precondition, which would have made the no-corner-cutting
    rule's acceptance non-discriminating. Reworded both to "hook-bypass" / "hook bypass". Re-verified:
    item 2's baseline is **0**, item 3's baseline is now **0**. The literal `--no-verify` is reserved
    for the rule that actually forbids it.
- [x] [AI] Add the **whole-tree-staging prohibition** to `no-destructive-git-operations.md` as a shape
      rather than one flag spelling (per tech-docs §Delta 4): forbid `git add -A`, `git add --all`,
      `git add .`, whole-tree `git add -u`/`--update`, `git commit -a`/`--all`, and any wrapper whose
      net effect is "stage everything"; require naming every path explicitly, using `git -C <worktree>`
      when acting on another tree, and running `git status --porcelain` first so unaccounted-for lines
      (another actor's work) stay unstaged; state the parallel-safety rationale — acceptance:
      count DISTINCT matched terms, not matching lines (`grep -c` counts lines, so prose that packs
      several terms into one paragraph would undercount):
      `grep -oEi 'add --all|add \.|commit -a|status --porcelain' repo-governance/development/workflow/no-destructive-git-operations.md | sort -u | wc -l`
      returns 0 immediately before this edit (the file exists from the previous checkbox but carries
      only the `-A` spelling) and ≥ 4 after it, regardless of how the prose is line-wrapped
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/workflow/no-destructive-git-operations.md`
    (§Whole-Tree Staging Is Forbidden)
  - **Notes**: Written as a **shape**, with the reason the shape framing matters stated inline —
    blocking `-A` alone would just redirect the habit to the next spelling, so all five forms are
    named including the catch-all "any wrapper, alias, or agent shortcut whose net effect is stage
    everything". The required alternative is a numbered three-step procedure
    (`status --porcelain` first → stage only accountable paths → `-C <worktree>` when acting on
    another tree) rather than a bare prohibition, so there is a defined thing to do instead.
  - **Rationale recorded**: both failure modes, not just one — the correctness bug (committing changes
    you did not author) _and_ the disclosure risk (a credential-adjacent or scratch file entering a
    permanent history).
  - **Verified both directions**: the acceptance grep returned **0** immediately before this edit and
    returns **4** after — all four distinct terms confirmed present by listing them
    (`add --all`, `add .`, `commit -a`, `status --porcelain`), not just counting. The next checkbox's
    own pre-edit baseline was re-checked here and is still **0**, so this edit did not contaminate it.
- [x] [AI] Add the **no-corner-cutting / root-cause** rule to `no-destructive-git-operations.md` (per
      tech-docs §Delta 4): when a gate, test, lint, type-check, or CI job fails, fix the cause not the
      signal; forbid `--no-verify`, skipping a declared gate, deleting/skipping/`.only`-narrowing a
      failing test, weakening an acceptance criterion or threshold, ticking a checkbox without its
      required evidence, suppressing an error in place of fixing it, and deferring a discovered
      preexisting failure; require that a genuinely out-of-scope blocker be escalated and recorded in
      the plan with what was tried — acceptance: match on phrases this rule alone introduces, not on
      generic vocabulary the file already carries (its `## Principles Implemented/Respected` section
      cites Root Cause Orientation, as every file in that directory does, so a bare `root.?cause`
      pattern would already be non-zero):
      `grep -oEi 'no-verify|weakening an acceptance criterion|escalated and recorded' repo-governance/development/workflow/no-destructive-git-operations.md | sort -u | wc -l`
      (distinct matched terms, not matching lines) returns 0 immediately before this edit and ≥ 3
      after it, regardless of how the prose is line-wrapped
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/workflow/no-destructive-git-operations.md`
    (§No Corner-Cutting — Root-Cause Orientation Is Binding)
  - **Notes**: All six forbidden items landed verbatim from Delta 4, gated on **both** explicit
    per-instance approval **and** a written reason recorded in the plan — the second condition is
    what stops "approved" from becoming an unlogged verbal waiver. The escalation path is stated as a
    legitimate outcome ("escalating is a legitimate outcome; quietly routing around is not"), since a
    rule that only forbids leaves an agent with no sanctioned move when genuinely blocked.
  - **Added beyond the letter**: a closing paragraph naming the shared property of all six items —
    each makes the _report_ green without making the _system_ correct — and why that matters
    specifically here: on a shared machine, a false completion signal is what another actor builds on.
  - **Verified both directions**: **0** immediately before this edit, **3** after, with the distinct
    terms listed rather than merely counted (`escalated and recorded`, `no-verify`, `weakening an
acceptance criterion`). The Phase 2 Gate's own four-term check already returns **4**.
- [x] [AI] Cross-link the new convention from the stage-explicit-paths guidance, and edit
      `git-push-safety.md`'s `## Related Documentation` section (lines 188-194) to add the reciprocal
      "see also" link to `no-destructive-git-operations.md` (the new convention already links to
      `git-push-safety.md` per the previous checkbox's companion link) — acceptance:
      `grep -c "no-destructive-git-operations" repo-governance/development/workflow/git-push-safety.md`
      returns ≥1 (returns **0** today, confirmed live) and
      `grep -c "git-push-safety" repo-governance/development/workflow/no-destructive-git-operations.md`
      returns ≥1; both links resolve
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/workflow/git-push-safety.md`
    (§Related Documentation)
  - **Notes**: The reciprocal entry does not just link — it states the **division of labour**, so a
    reader landing on either file learns which one owns their situation: `git-push-safety.md` governs
    destruction aimed at the **remote** (force-push, hook bypass), `no-destructive-git-operations.md`
    governs destruction aimed at the **local shared machine** (hard reset, recursive clean, force
    branch deletion, object-store pruning, forced worktree removal) plus the staging and
    no-corner-cutting rules. Without that, two adjacent safety conventions invite the reader to guess.
  - **Verified**: `no-destructive-git-operations` appears in `git-push-safety.md` **1×** (was **0**);
    `git-push-safety` appears in the new convention **3×**. `md links validate` exit **0** —
    `All links valid! No broken links found.` — so both directions resolve, not merely match a grep.

### Phase 2 Gate

> All checks below must pass before starting Phase 3.

- [x] [AI] `npm run lint:md:fix` and `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate --exclude plans/done --exclude apps/ayokoding-www/content --exclude apps/ose-www/content`
      (real invocation — mirrors `.husky/pre-push`; no `rhino-cli:links:validation` Nx target exists) — exit 0
  - **Date**: 2026-07-20 — **Status**: GREEN
  - **Notes**: `npm run lint:md:fix` exit 0, `Summary: 0 error(s)`. `md links validate` exit 0,
    `All links valid! No broken links found.` Also ran `md heading-hierarchy validate` (not required
    by this gate) — exit 0, `DOCS HEADING HIERARCHY VALIDATION PASSED` — because a brand-new file is
    exactly where a skipped heading level would slip through unnoticed.
- [x] [AI] New convention exists and lists the full forbidden-op set, the whole-tree-staging shape
      prohibition, and the no-corner-cutting / root-cause rule — acceptance:
      `grep -oEi 'add --all|commit -a|no-verify|weakening an acceptance criterion' repo-governance/development/workflow/no-destructive-git-operations.md | sort -u | wc -l`
      returns ≥ 4 (distinct matched terms, not matching lines)
  - **Date**: 2026-07-20 — **Status**: GREEN
  - **Notes**: Returns **4**, with the distinct terms listed rather than merely counted —
    `add --all`, `commit -a`, `no-verify`, `weakening an acceptance criterion` — one drawn from each
    of the three rule sets this gate is asserting on, so a single missing rule set could not have
    reached 4.

> **Pause Safety**: the new convention is a standalone, lint-clean file with resolving links; no index
> depends on it yet (wired in Phase 4). Safe to stop. To resume: re-run link validation.

---

## Phase 3: Worktree-and-Artifact Cleanup Convention (ose-public, NEW)

> _Suggested executor: `repo-rules-maker`_

- [x] [AI] Create `repo-governance/development/workflow/worktree-and-artifact-cleanup.md` (teardown
      sibling of `worktree-setup.md`) with: frontmatter, purpose, the mandatory plan-end cleanup gate,
      the self-created-only + verify-not-in-use rules, the artifact taxonomy (`target/`, `dist/`,
      `.next/`, build caches), the HARD caveat that shared caches must never be deleted (naming the
      shared cargo `target/` from the `rust-cargo-target-dir-sharing` plan as the canonical example),
      and the "cleanup is itself non-destructive to others" rule — acceptance: file exists; count
      DISTINCT matched terms, not matching lines:
      `grep -oEi 'shared cargo|verify|not in use|self-created' worktree-and-artifact-cleanup.md | sort -u | wc -l`
      returns ≥ 3, regardless of how the prose is line-wrapped
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/workflow/worktree-and-artifact-cleanup.md` _(new)_
  - **Notes**: Created with frontmatter, a Why-This-Is-a-Gate section grounding cleanup in the three
    shared resources it protects (disk, ref namespace, stale state), the three artifact classes, the
    four hard safety rules, and the build-artifact section. The shared cargo `target/` carve-out links
    the archived `rust-cargo-target-dir-sharing` plan as the canonical example, and generalizes: any
    cache another session can rely on is out of scope for a plan-scoped cleanup.
  - **Framing recorded**: cleanup is the one gate where every action is a deletion, so the convention
    is written to make "delete thoroughly" and "delete only what is yours" hold simultaneously rather
    than trading one off against the other.
  - **Verified**: acceptance grep returns **5** distinct terms (≥3 required).
  - **Sequencing check**: the next-but-two checkbox's cross-link precondition requires **0** matches of
    `worktree-setup|temporary-files|git-push-safety|no-destructive-git-operations` in this file before
    that step runs — confirmed **0**. The Related Documentation section is deliberately left as an
    empty placeholder so that checkbox stays discriminating rather than passing on work done here.
  - **Over-delivery, declared**: this file already contains the five pre-removal checks that the _next_
    checkbox owns. They are the operational core of the safety rules stated here, and splitting them
    across two steps would have shipped an interim file that says "verify before deleting" without
    saying how. The next checkbox therefore verifies and completes them rather than authoring from
    scratch — its acceptance currently stands at **4 of 5** distinct terms, so it is genuinely not yet
    satisfied.
- [x] [AI] Add the **five mandatory pre-removal checks** to `worktree-and-artifact-cleanup.md` (each
      grounded in a live 2026-07-19 incident, per tech-docs §Delta 5): (1) test merge state with
      `gh pr list --head <branch> --state all`, **never** `git merge-base --is-ancestor` — every PR
      here is squash-merged, so ancestry false-negatives on every merged branch; (2) `git status
--porcelain` the worktree and read any dirty diff, recovering content found nowhere else to
      `main` before removal — a merged PR does not imply an empty working tree; (3) check
      `git log origin/<branch>..<branch>` for unpushed commits; (4) always non-force
      `git worktree remove`, never `rm -rf`; (5) never remove a worktree this plan did not create
      without positive evidence it is idle — acceptance: count DISTINCT matched terms, not matching
      lines, one term per check so that check 1's own two commands legitimately co-locating in a
      single sentence cannot undercount:
      `grep -oEi 'gh pr list|--porcelain|unpushed commits|non-force|did not create' worktree-and-artifact-cleanup.md | sort -u | wc -l`
      returns ≥ 5 (one distinct term per mandatory check), regardless of how the prose is line-wrapped
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/workflow/worktree-and-artifact-cleanup.md`
    (§Mandatory Pre-Removal Checks, check 3)
  - **Notes**: Checks 1, 2, 4 and 5 landed with the file's creation (declared in that checkbox's
    notes); this step completed check 3, which was the one term short. Its heading was reworded to
    name **unpushed commits** explicitly and gained the reason the check is categorically different
    from the other two recovery checks: for an unpushed commit there is **no remote copy to fall back
    on** — if the worktree goes, so does the commit.
  - **Each check carries its grounding incident**, not a hypothetical: ancestry reporting NOT-MERGED
    for four genuinely-merged squash-merged branches; a worktree holding archival evidence that
    existed nowhere else while every merge signal said "safe to delete"; and one of 11 worktrees
    holding five dirty files of active work, correctly left in place.
  - **Sharpened beyond the source text**: the convention now states that ancestry is not a
    _conservative_ approximation — it is wrong in the direction that blocks correct cleanup, and would
    be wrong in the **dangerous** direction if anyone inverted the test. It also states why non-force
    removal is mandatory: it refuses on a dirty worktree, so it is the backstop for exactly the case
    where checks 1-3 were rushed. Forcing removes the backstop, which is the whole reason to forbid it.
  - **Verified**: acceptance grep returns **5**, with all five distinct terms listed rather than
    counted. The cross-link checkbox's precondition re-checked and still **0**.
- [x] [AI] Add the **branch-cleanup rules** to `worktree-and-artifact-cleanup.md` as the third artifact
      class alongside worktrees and build output (per tech-docs §Delta 5 "Branch cleanup"): delete only
      branches this plan created and only after the check-1 `gh pr list` merge-state test reports
      MERGED; local deletion via `git branch -d` (merged-check retained),
      **never** `git branch -D`; if `-d` refuses on a PR-MERGED branch, confirm the content landed via
      `git log origin/main..<branch>` and delete with a stated reason rather than reaching for `-D`;
      remote deletion via `git push origin --delete <branch>` only post-merge and never for `main` or
      any environment branch this repo defines (e.g. `prod-*`/`stag-*` in `ose-public`; check each
      repo's own environment-branch set rather than assuming this exact pattern is universal); run
      `git worktree prune` after removals; never `gc`/`prune` the object
      store as part of cleanup (shared-machine serialization point) — acceptance:
      `grep -oE 'branch -d|push origin --delete|worktree prune' repo-governance/development/workflow/worktree-and-artifact-cleanup.md | sort -u | wc -l`
      returns ≥ 3 (distinct matched terms, not matching lines — `branch -d` is case-sensitive here so
      it does not also match the forbidden `-D`), and
      `grep -c 'branch -D' repo-governance/development/workflow/worktree-and-artifact-cleanup.md`
      returns ≥ 1 (the prohibition is stated, not omitted)
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/workflow/worktree-and-artifact-cleanup.md`
    (new `## Branch Cleanup`)
  - **Notes**: Branches land as the third artifact class with the reason they are easy to miss stated
    up front — removing a worktree leaves its branch behind, so under 1-PR ↔ 1-worktree a multi-phase
    plan accumulates one stale ref per phase per repo. All required rules present: MERGED-confirmed
    via `gh pr list` (not ancestry), `-d` never `-D`, the `-d`-refuses-on-a-MERGED-PR recovery path,
    remote `--delete` post-merge only, `git worktree prune` after removals, and no object-store
    `gc`/`prune`.
  - **Environment branches written as repo-specific, not hardcoded**: `ose-public` defines
    `prod-*`/`stag-*`; `ose-primer` and `ose-infra` define none today, so the rule is vacuously
    satisfied there. The convention says to confirm each repo's own set with `git branch -a` rather
    than assuming the pattern is universal — a plan that hardcodes one repo's shape eventually runs
    against a repo that does not match.
  - **Jurisdiction stated explicitly**: `git push origin --delete` is remote-ref deletion, not
    history-rewriting force-push, so it sits outside the per-instance-approval gate and is instead
    gated by this convention's own merged-check. Recorded because three conventions now touch branch
    deletion, and without a named single authority each could plausibly be read as owning it.
  - **Verified both halves**: `branch -d|push origin --delete|worktree prune` returns **3** distinct
    terms (listed, not just counted); `grep -c 'branch -D'` returns **1**, confirming the prohibition
    is present rather than silently dropped. `branch -d` is case-sensitive here so it does not also
    match the forbidden `-D` — the two checks are genuinely independent.
  - **Forward-reference resolved**: the file's `[Branch Cleanup](#branch-cleanup)` anchor, written
    during the file's creation, pointed at a section that did not exist until this step.
    `md links validate` now exits **0** (`All links valid!`), confirming it resolves.
- [x] [AI] Cross-link the cleanup convention to `worktree-setup.md`, `temporary-files.md` (build-artifact
      taxonomy), `git-push-safety.md` (remote-side companion for the `--delete` rule), and
      `no-destructive-git-operations.md` — acceptance:
      run `grep -oE 'worktree-setup|temporary-files|git-push-safety|no-destructive-git-operations' repo-governance/development/workflow/worktree-and-artifact-cleanup.md | sort -u | wc -l`
      — counts distinct matched filenames, not matching lines. This checkbox runs after checkboxes 1-3
      have already created the convention file, so it returns `0` immediately before this edit (file
      exists, no cross-links yet) and ≥ 4 after it, one distinct term per target file; all four links
      resolve
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/workflow/worktree-and-artifact-cleanup.md`
    (§Related Documentation)
  - **Notes**: Each of the five entries states the **relationship**, not just the link, so a reader
    knows which document owns their question: `worktree-setup.md` is the setup half of the same
    lifecycle; `temporary-files.md` supplies the artifact taxonomy being removed;
    `no-destructive-git-operations.md` supplies the forbidden-op set that bounds what this gate may do
    (and explains _why_ this convention prescribes `-d`, non-force removal, and no `gc`);
    `git-push-safety.md` is the remote-side companion with the jurisdiction boundary spelled out; and
    `agent-workflow-orchestration.md` supplies the DAG position — cleanup as the terminal node.
  - **Verified both directions**: the acceptance grep returned **0** immediately before this edit and
    returns **4** after, with all four distinct filenames listed rather than counted. `md links
validate` exit **0**, so all five entries resolve as links — including
    `../infra/temporary-files.md`, whose relative path crosses directories and was confirmed to exist
    before relying on it.

### Phase 3 Gate

> All checks below must pass before starting Phase 4.

- [x] [AI] `npm run lint:md:fix` and `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate --exclude plans/done --exclude apps/ayokoding-www/content --exclude apps/ose-www/content`
      (real invocation — mirrors `.husky/pre-push`; no `rhino-cli:links:validation` Nx target exists) — exit 0
- [x] [AI] Cleanup convention exists with the shared-cargo-target carve-out explicit
  - **Date**: 2026-07-20 — **Status**: GREEN
  - **Notes**: `grep -c "shared cargo"` returns **2** — once in the Hard Safety Rules (naming the
    `rust-cargo-target-dir-sharing` plan as the canonical example and linking the archived plan
    folder, which was confirmed to exist on disk) and once in Build-Artifact Cleanup as an explicit
    SKIP instruction. Stated in both the rule and the procedure, so an executor following only the
    step-by-step section still sees the carve-out.
- [x] [AI] Cleanup convention covers all three artifact classes — worktrees, branches (local + remote,
      merged-only, `-d` never `-D`), and build output — acceptance:
      `grep -oE 'worktree remove|branch -d|target/' repo-governance/development/workflow/worktree-and-artifact-cleanup.md | sort -u | wc -l`
      returns ≥ 3 (distinct matched terms, not matching lines)
  - **Date**: 2026-07-20 — **Status**: GREEN
  - **Notes**: Returns **3** — one distinct term per artifact class (`worktree remove`, `branch -d`,
    `target/`), so a missing class could not have reached 3. The convention also states the three
    classes as a named list up front, with the observation that stopping after the first is the
    common failure.
  - **Gate 1 (lint + links)**: `npm run lint:md:fix` exit 0, `Summary: 0 error(s)`; `md links
validate` exit 0; `md heading-hierarchy validate` exit 0 (run additionally — a new file with nine
    `##` sections is where a level skip would hide).

> **Pause Safety**: both new conventions exist and lint clean; the concurrency edits are stable. Safe
> to stop. To resume: re-run link validation on the two new files.

---

## Phase 4: Wiring, Config, Cross-Surface Sweep, Bindings & Indexes (ose-public)

> _Suggested executor: `repo-rules-maker`_ (config step: shell/YAML)

### 4a. AGENTS.md / CLAUDE.md / indexes

- [x] [AI] Add the same-machine, concurrent-actors assumption to `AGENTS.md` §Agent Workflow
      Orchestration (one sentence) and cross-link the two new conventions — acceptance: `grep -n "same machine\|shared machine" AGENTS.md` present; both convention links resolve
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `AGENTS.md` (§Agent Workflow Orchestration)
  - **Notes**: Added the assumption as a single labelled sentence naming the four shared resources
    (disk, git object store, worktrees, CI runners) and the consequence — every orchestration and git
    action must be safe under concurrent actors. Both new conventions appended to the section's
    existing `**See**:` link list rather than given new prose, keeping the byte cost minimal.
  - **Verified**: `grep -cn "same machine\|shared machine" AGENTS.md` returns **1**;
    `no-destructive-git-operations|worktree-and-artifact-cleanup` returns **2** (one each);
    `md links validate` exit **0**, so both resolve.
  - **Preexisting warning surfaced, not caused**: `nx run rhino-cli:instruction-size:validation` exits
    **0** but warns `AGENTS.md is 29049 bytes (over 27000-byte warn threshold)`. Baseline at
    `origin/main` was **already 28333 bytes** — over threshold before this plan began; this edit added
    716 bytes. Not remediated here: the sole sanctioned remedy is progressive disclosure, a
    substantial refactor of the canonical instruction file that is outside this plan's scope and in
    direct tension with the `AGENTS.md` additions Phase 4 still mandates. Logged to `learnings.md`
    with a proposed follow-up plan sequenced **after** this one. Remaining `AGENTS.md` edits will
    prefer linking over restating to hold the growth down.
- [x] [AI] Update `AGENTS.md` §Agent Workflow Orchestration + §Git Workflow §Delivery Mode to add the
      DAG rule, background-slot preference, 3-5 min status cadence, PR-as-independent-merge-point, and
      the hardened merge preconditions (3 cycles + up-to-date-with-origin-main + gates green)
      — acceptance: `grep -n "DAG\|up-to-date with .*origin/main\|3-5 min" AGENTS.md` present
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `AGENTS.md` (§Agent Workflow Orchestration, §Git Workflow §Delivery Mode)
  - **Notes**: §Agent Workflow Orchestration gained three labelled clauses — DAG-first (with the
    independent-node-width-is-the-fan-out point and cleanup as terminal node), background-slot
    preference, and the 3-5-minute status cadence. §Delivery Mode gained the PR-as-independent-merge-point
    rationale plus the **full (a)-(e)** hardened merge preconditions, using Delta 8's normative
    lettering verbatim rather than a shortened list.
  - **Deliberately NOT a shortened (a)-(d)**: `tech-docs.md` declares the (a)-(e) lettering normative
    precisely because an earlier revision of this plan shipped a 4-item enumeration that silently
    re-mapped (b)/(c)/(d). Writing five here keeps `AGENTS.md` consistent with the workflow file and
    the Phase 5/6/7 merge checkboxes that cite the same letters.
  - **Verified**: acceptance grep returns **6**.
  - **Downstream preconditions protected**: this edit deliberately did **not** touch the
    `[HUMAN]` merge default wording, which two later §4b checkboxes depend on as their pre-edit
    baseline. Re-verified after the edit: <code>grep -cF '`[HUMAN]` merge — \*\*the default\*\*'</code>
    still returns **1** and <code>grep -cF '`[AI]` merge'</code> still returns **0** — so the Delta 12
    inversion checkbox remains discriminating in both directions. `md links validate` exit **0**.
- [x] [AI] Grep `CLAUDE.md` for any Claude-specific concurrency text using a **word-bounded** pattern:
      `grep -niE "concurrent|background agent|\bcap(ped|s)?\b" CLAUDE.md`; update to the N+1 model if
      present, else add nothing — acceptance: that word-bounded grep returns **0** (returns **0**
      today, verified live, and must stay 0 unless an edit deliberately introduces N+1 wording).
      **The unbounded pattern `grep -n "concurrent\|background agent\|cap" CLAUDE.md` MUST NOT be
      used**: it returns **1** today via a false-positive substring match on "**cap**ability-tier
      mapping" (line 54), which has nothing to do with concurrency — so any "no stale fixed cap"
      reading of it is vacuous in both directions.
  - **Date**: 2026-07-20 — **Status**: DONE (no edit required — correctly a no-op)
  - **Files Changed**: none
  - **Notes**: The word-bounded pattern returns **0** (exit 1) — `CLAUDE.md` carries no
    Claude-specific concurrency text, because it inherits the whole model through its single-line
    `@AGENTS.md` import. Per the checkbox's own instruction ("update to the N+1 model if present,
    else add nothing"), adding anything would have **created** a second, drift-prone statement of the
    concurrency model in a file whose design is to hold none.
  - **Both patterns run, to confirm the warning is real rather than inherited**: the unbounded
    `grep -n "concurrent\|background agent\|cap" CLAUDE.md` returns **1** — the documented
    false-positive substring match on "**cap**ability-tier mapping". Had that pattern been used as
    the acceptance signal, it would read as "stale cap found" today and as "still found" after any
    edit, discriminating nothing in either direction. The word-bounded form is what makes this
    checkbox falsifiable.
  - **Ticked as a verified no-op with evidence**, not skipped — the Phase 0 cap baseline already
    recorded `CLAUDE.md` as carrying zero hits, and this independently confirms it.
- [x] [AI] Add the two new conventions to `repo-governance/development/workflow/README.md` §Documents
      (link by name; respect Dynamic Collection References — no hardcoded counts) — acceptance: both
      links present in the Documents list and resolve
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/workflow/README.md` (§Documents)
  - **Notes**: Both entries inserted immediately after `Git Push Safety Convention`, placing each new
    convention beside its companion — the local-side entry next to the remote-side one it pairs with,
    and the cleanup entry as the declared teardown sibling of the setup convention listed above. Each
    description matches the index's existing density (a substantive summary, not a bare title), so the
    two additions read as part of the list rather than as bolt-ons.
  - **Dynamic Collection References respected**: descriptions name what each convention covers without
    stating any collection count; a scan for hardcoded document/convention counts in the file returns
    **0** (exit 1), so nothing was introduced that a future addition would falsify.
  - **Verified**: both filenames present (**2** matches); `md links validate` exit **0**, so both
    resolve rather than merely appearing as text.
- [x] [AI] Grep the agents/practice index READMEs for stale cap references and update if present
      (`grep -rn "cap at 2\|3 total" repo-governance/development/agents/README.md repo-governance/development/practice/README.md`)
      — acceptance: no stale numbers remain in those indexes
  - **Date**: 2026-07-20 — **Status**: DONE (already satisfied — no edit required)
  - **Files Changed**: none in this step. `repo-governance/development/agents/README.md` was already
    corrected during **Phase 1's closing sweep**, where its `≤2 concurrent background agents` line was
    found stale-on-arrival and fixed rather than deferred to here.
    `repo-governance/development/practice/README.md` never carried a stale number.
  - **Verified with two patterns, not one**: the checkbox's own
    `grep -rn "cap at 2\|3 total"` returns **0** (exit 1) across both files, and a deliberately wider
    sweep — `cap at 2|cap of 2|3 total|2 background|2 concurrent|stricter cap|never more|≤2` — also
    returns **0**. The wider form matters because the stale text actually found in Phase 1 was
    `≤2 concurrent background agents`, which the checkbox's narrow pattern would **not** have matched.
    Had the fix been deferred to this step as written, this checkbox would have passed while the stale
    line survived.
  - **Plan-accuracy note**: recorded in `learnings.md` alongside the related finding that
    `repo-governance/development/README.md` — which carried the same class of stale index text — is
    named in no checkbox at all.

### 4b. Convention surfaces for the new orchestration behaviors

- [x] [AI] Edit `repo-governance/development/practice/task-list-discipline.md`: add the **3-5 minute
      bounded status-update cadence** (while task-list items are active; not faster; no micro-event
      storming) — acceptance: `grep -ni "3-5\|status update\|cadence" task-list-discipline.md` present
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/development/practice/task-list-discipline.md`
    (new `### Standard 6 — Bounded Status-Update Cadence`)
  - **Notes**: Written as a **two-directional** bound rather than a floor, because each direction
    fails differently: too slow leaves the user unable to distinguish progress from a stall (the task
    list being the only observability surface), while too fast buries the signal under noise and costs
    more attention than silence would. A one-sided "at least every 5 minutes" rule would have licensed
    exactly the update-storming the delta names.
  - **Added beyond the letter**: updates anchor to **meaningful state changes** — a checkbox ticked, a
    gate flipping, a phase boundary, a blocker surfacing — not to a timer alone. Without that, "every
    3-5 minutes" reads as an instruction to emit updates on a schedule even when nothing has changed,
    which is the noise failure mode restated as a requirement.
  - **Verified**: acceptance grep returns **4** (returned **0** pre-edit, confirmed live before
    editing — so the clause discriminates in both directions).
- [x] [AI] Edit `repo-governance/conventions/structure/plans.md`: document that `delivery.md` expresses
      phases/steps as a **DAG** + a `## Parallelization Model` section (which items are concurrent vs
      serial; cleanup = terminal node) — acceptance: `grep -ni "DAG\|Parallelization Model" plans.md` present
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/conventions/structure/plans.md`
    (new `### Delivery Checklists Express a DAG (HARD RULE)`, placed before §Applicability so the
    existing Applicability paragraph's grandfathering scope continues to read naturally over the
    hard rules preceding it)
  - **Notes**: States the three required `## Parallelization Model` contents (concurrent-vs-serial
    with reasons, the plan's chosen N, cleanup as terminal node) plus the operational independence
    test — two nodes are independent only when neither reads what the other writes.
  - **The point the rule turns on, made explicit**: **sequence is not dependency**. A checklist is
    necessarily written in some order, but only part of that order is load-bearing; without stating
    the DAG, an executor infers dependency from list position and either serializes work that never
    needed to be serial or parallelizes work that did. That sentence is why the section exists rather
    than being a restatement of "write things in order".
  - **Enforcement added** in the convention's own idiom: `plan-checker` flags a missing
    `## Parallelization Model` on a non-trivial plan as MEDIUM, and a declared-parallel node set with
    a real write conflict as HIGH — the second being the failure that actually corrupts work.
  - **Verified**: acceptance grep returns **5** (was **0**). `md links validate` exit **0**, covering
    the new relative link into `../../development/agents/agent-workflow-orchestration.md`.
  - **Downstream precondition protected**: the Delta 12 checkbox below uses this same file with a
    pre-edit baseline of **0** for `\[AI\] merges|only where.*explicitly|only the actor` — re-verified
    after this edit and still **0**, so that checkbox stays discriminating.
- [x] [AI] Edit `repo-governance/workflows/pr/pr-review-quality-gate.md`: add the **hardened merge
      preconditions**, using the **normative (a)-(e) lettering of `tech-docs.md` §Delta 8 verbatim** —
      **(a)** 3 `pr-review-maker`→`pr-review-fixer` cycles; **(b)** 0 CRITICAL + 0 HIGH findings
      outstanding; **(c)** the branch is **up-to-date with the latest `origin/main`** at merge time,
      brought forward by a **non-destructive forward update** if behind (never a shared-history
      rewrite); **(d)** all PR quality gates green; **(e)** the Delta 11 surface-conditional tester
      gates have been run and their defect findings resolved (or exemption explicitly recorded).
      **Do not emit a shortened (a)-(d) list**: `tech-docs.md` declares this lettering normative, and
      an earlier revision of this very plan shipped a 4-item enumeration that silently re-mapped
      (b)/(c)/(d) — the exact bug the Delta 8 callout exists to prevent — acceptance:
      `grep -Fic "up-to-date with the latest" repo-governance/workflows/pr/pr-review-quality-gate.md`
      **and** `grep -Fic "non-destructive forward update" repo-governance/workflows/pr/pr-review-quality-gate.md`
      each return ≥1. **Both return 0 today, confirmed live.** The obvious pattern
      `grep -ni "up-to-date\|origin/main\|3 cycles"` MUST NOT be used: it already matches the
      pre-existing §Success Metrics sentence "within the default 3 cycles" (line 281) and so is
      vacuously true before any edit — it cannot discriminate a completed edit in either direction.
      The two `grep -F` literals above are distinctive phrases the Delta 8 text introduces and nothing
      in the file carries today.
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/workflows/pr/pr-review-quality-gate.md`
    (new `### Hardened Merge Preconditions` under §Done-Definition)
  - **Notes**: Placed as a subsection of the done-definition, opening with the distinction that makes
    it necessary — **being done is necessary but not sufficient to merge**. Without that framing the
    file would carry two adjacent lists (four done-items, five merge-preconditions) with nothing
    saying how they relate.
  - **Full (a)-(e) emitted, verified structurally**: `grep -oE '\*\*\((a|b|c|d|e)\)\*\*' | sort -u`
    returns all five letters — so the check confirms the _lettering_ is complete, not merely that some
    text landed. The normative-lettering warning is reproduced inline as a blockquote, including the
    specific historical failure (one surface running (a)-(d) while another ran (a)-(e), both citing
    Delta 8 while disagreeing on what (b)/(c)/(d) meant).
  - **Precondition (c) given its operational content**: names the non-destructive forward update
    concretely (`git fetch origin` then `git merge --ff-only origin/main`, or an ordinary forward
    merge) and cross-links both git-safety conventions, so "non-destructively" is actionable rather
    than an adjective. Added the reason (c) exists at all: a long-lived PR's green run proved the
    branch good against a `main` that has since moved.
  - **Verified both directions**: `grep -Fic "up-to-date with the latest"` and
    `grep -Fic "non-destructive forward update"` each return **1**; both returned **0** pre-edit,
    confirmed live. The plan's warned-against pattern (`up-to-date\|origin/main\|3 cycles`) was
    deliberately not used — it already matched the pre-existing §Success Metrics line.
  - **Downstream precondition protected**: §4f adds clause (e)'s concrete `api-quality-gate` reference
    to this same file and requires a pre-edit baseline of **0** — re-verified after this edit and
    still **0**. Clause (e) is stated here in surface-conditional terms without naming the workflow
    file, so §4f's checkbox remains discriminating.
- [x] [AI] **Delta 12 — invert the merge default in its definitional home**: edit
      `repo-governance/conventions/structure/plans.md` §Delivery Mode so `[AI]` merge is the default
      once merge preconditions hold, and a `[HUMAN]` merge gate applies **only** where a plan's own
      step states it explicitly. State plainly that the **preconditions are unchanged — only the actor
      is** — acceptance: count DISTINCT matched terms, not matching lines:
      `grep -oEi '\[AI\] merges|only where.*explicitly|only the actor' plans.md | sort -u | wc -l`
      returns ≥ 2 (the same command returns **0** against the current pre-edit file), regardless of
      how the prose is line-wrapped
  - **Date**: 2026-07-20 — **Status**: DONE
  - **Files Changed**: `repo-governance/conventions/structure/plans.md` (§Delivery Mode)
  - **Notes**: Inverted in **both** places the default is stated — the four-mode table's Merge
    authority column (`worktree-to-pr` and `main-to-pr` rows now read `[AI]` — merges once the
    preconditions hold) **and** the prose beneath it. Editing only the prose would have left the table
    contradicting it, and the table is what most readers actually consult.
  - **"Preconditions unchanged, only the actor" made concrete**: the prose restates all five hardened
    preconditions inline and links the PR gate workflow, then says plainly why the inversion is not a
    weakening — a human merging a PR that has already satisfied all five is performing a click, not a
    judgment, so the old default added latency without adding a check.
  - **Added beyond the letter**: named the cases where a plan _should_ still opt into a `[HUMAN]` gate
    (irreversible migration, production cutover, blast radius the gates cannot express) and why being
    explicit matters — a merge gate chosen deliberately is meaningful, while one inherited from a
    default is indistinguishable from inertia. Without that, "only where a plan says so" gives no
    guidance on when a plan should say so.
  - **Acceptance defect caught and fixed mid-item**: the first draft returned **1 of the required 2**.
    Neither miss was a content gap — both were **line-wrapping and markup artifacts**. `only
where.*explicitly` spanned a line break (grep is line-based), and `\[AI\] merges` failed because
    the prose wrote <code>`[AI]` merges</code>, putting a backtick between `]` and the space. Rewrapped
    the sentence and dropped the backticks on that one occurrence. Now returns **3**, with all three
    distinct terms listed. Recorded because the same two artifacts would silently fail any
    acceptance clause written against wrapped or backticked prose.
- [x] [AI] Propagate the inverted default to `repo-governance/workflows/pr/pr-review-quality-gate.md`
      (merge-gate done-definition), `plan/plan-execution.md`, and `plan/plan-planning.md` — acceptance:
      the pattern must discriminate pre- from post-edit, and `-c` must not be used (it suppresses the
      matched text this check needs to read). Verified live pre-edit with
      `grep -oEi '\[HUMAN\][^.]{0,40}merge|human merges' <file> | wc -l`:
      `pr-review-quality-gate.md` = **8**, `plan-execution.md` = **8**, `plan-planning.md` = **0** (it
      states no merge actor, so it needs no edit — do not invent one). Rewrite so `[AI]` merge is the
      stated default in both non-zero files — acceptance: run
      `grep -rnoEi '\[HUMAN\][^.]{0,40}merge|human merges' repo-governance/workflows/pr/pr-review-quality-gate.md repo-governance/workflows/plan/plan-execution.md`
      and confirm **every** line it prints sits within a sentence marking `[HUMAN]` merge as an
      explicit per-plan opt-in (never as the default), AND
      <code>grep -rlF '`[AI]` merge' repo-governance/workflows/pr/pr-review-quality-gate.md repo-governance/workflows/plan/plan-execution.md | wc -l</code>
      returns **2** post-edit — one file each — and returns **0** pre-edit (verified live; neither file
      mentions `[AI]` merge today). **Use `grep -F`** on the literal string: the backticks are part of
      the text, and this counts FILES containing it, so it cannot be gamed by repetition in one file.
  - **Date**: 2026-07-20. Pre-edit baselines confirmed live exactly as stated:
    `pr-review-quality-gate.md` = 8, `plan-execution.md` = 8, `plan-planning.md` = 0, and
    `grep -rlF '`[AI]`merge'` on the two files = 0. `plan-planning.md` left untouched (states no
    merge actor — none invented).
  - **pr-review-quality-gate.md** — all 8 sites rewritten: line 37 "before the merge"; mermaid node
    `D --> H["AI merges once preconditions hold"]`; the done-boundary paragraph; the escalation line
    ("this applies whether the merge actor is `[AI]` (the default) or a plan-declared `[HUMAN]`
    gate"); the applicability line ("`[AI]` merge authority once the preconditions hold"); the
    related-workflows line; the conventions line ("the merge actor is explicit — `[AI]` by default,
    `[HUMAN]` only where a plan says so").
  - **plan-execution.md** — all 8 sites rewritten: the PR-Review-Cycle gate heading; the
    Archival-in-PR bullet; the done-boundary bullet (now carries "**`[AI]` merges by default** once
    the hardened preconditions hold; a `[HUMAN]` merge gate applies only where a plan's own step says
    so explicitly, and the preconditions are identical either way — only the actor differs"); step 8
    retitled "**Merge — `[AI]` by default**" (previously "**`[HUMAN]` merge**: … STOP — do not
    merge"); step 9 cleanup gate re-anchored to "after the merge completes".
  - **Acceptance verified**: the surviving-line grep prints 3 lines
    (`pr-review-quality-gate.md:250`, `plan-execution.md:699`, `plan-execution.md:798`) and **every
    one** is inside the explicit-per-plan-opt-in sentence, never a default. `grep -rlF` returns
    **2** — one file each, matching the required post-edit value against a verified pre-edit 0.
- [x] [AI] **Update `AGENTS.md` §Git Workflow §Delivery Mode first** — it is the canonical
      instruction file and states the default outright: "`worktree-to-pr` (worktree → draft PR →
      `[HUMAN]` merge — **the default**)" at line 112, plus `main-to-pr`'s "`[HUMAN]` merge" at line
      114 and "before the human merge" at line 116. Rewrite so `[AI]` merge is the default and
      `[HUMAN]` is the explicit opt-in — acceptance: <code>grep -cF '`[HUMAN]` merge — \*\*the
      default\*\*' AGENTS.md</code> returns **0** (returns **1** pre-edit) and
      <code>grep -cF '`[AI]` merge' AGENTS.md</code> returns **≥1** (returns **0** pre-edit). Both
      verified live in both directions. **Use `grep -F` on the literal string** — the surrounding
      backticks are part of the text, and an unescaped `grep -E` pattern silently matches nothing.
      **Leaving `AGENTS.md` stale would contradict the whole delta at the single most-loaded surface
      in the repo.**
  - **Date**: 2026-07-20. Pre-edit baselines verified live and matched the plan exactly:
    `grep -cF '`[HUMAN]`merge — **the default**' AGENTS.md` = **1**,
    `grep -cF '`[AI]`merge' AGENTS.md` = **0**.
  - **Edit**: §Git Workflow §Delivery Mode rewritten — `worktree-to-pr` and `main-to-pr` now both
    read "→ `[AI]` merge", the mode-list default annotation moved onto the `[AI]` merge, "before the
    human merge" became "before the merge", and the old "Done ≠ merged (on the human's own
    schedule)" sentence was replaced by the normative default statement: "**`[AI]` merges by
    default**; a `[HUMAN]` merge gate applies only where a plan's own step says so explicitly, and
    the preconditions below are identical either way — only the actor differs."
  - **Acceptance verified post-edit**: `grep -cF '`[HUMAN]`merge — **the default**' AGENTS.md`
    returns **0** (required 0, was 1) and `grep -cF '`[AI]`merge' AGENTS.md` returns **3**
    (required ≥1, was 0). Both directions therefore discriminate pre- from post-edit.
- [x] [AI] Sweep every remaining hardcoded `[HUMAN]`-merge reference across `AGENTS.md`, `CLAUDE.md`,
      `repo-governance/**`, `.claude/agents/**`, and `.claude/skills/**`:
      `grep -rniE "\[HUMAN\][^.]*merge" AGENTS.md CLAUDE.md repo-governance .claude` — **46 hits
      pre-edit** (verified live; note the earlier figure of 44 omitted `AGENTS.md`/`CLAUDE.md`, which
      is exactly why they are named explicitly here). Rewrite each as an explicit opt-in or delete it
      where it merely restated the old default — acceptance: every surviving hit is an explicit
      per-plan opt-in; the before/after counts are recorded in `learnings.md`
  - **Date**: 2026-07-20. **Counts: 46 pre-edit → 20 post-edit**, and every one of the 20 survivors
    sits inside an explicit per-plan-opt-in sentence ("a `[HUMAN]` merge gate applies only where a
    plan's own step says so explicitly" or an equivalent). Verified with the checkbox's own command.
  - **CORRECTION (Phase 4 Gate, third checker pass): this sweep was NOT complete when first ticked.**
    Its acceptance regex `\[HUMAN\][^.]{0,40}merge|human merges` has a coverage gap — it matches a
    bracketed `[HUMAN]` tag adjacent to "merge", or the plural "human merges", but never the
    **unbracketed singular** "human merge". Four sites used exactly that phrasing and survived three
    separate sweeps: `trunk-based-development.md:174` ("let a human merge via GitHub", a second copy
    of a worked example whose twin at :372 _was_ updated), `git-push-default.md:222` and `:333` (both
    inside blocks explicitly headed **`PASS: Correct behavior`**, so they modelled the wrong default
    as correct), and `.claude/agents/pr-review-maker.md:3` (agent `description`, mirrored verbatim
    into `.opencode/`). Fixed in the Phase 4 Gate commit; re-verified with an order-independent
    pattern (`human[ -]?merge|merge[^.]{0,30}human`) that makes no assumption about brackets, term
    order, or plurality. Also corrected: a stale mermaid legend comment in
    `pr-review-quality-gate.md:237` labelling the merge node "human merge" while the node itself
    reads "AI merges once preconditions hold".
  - **Files rewritten** — `repo-governance/`: `git-push-default.md` (prose + the PASS-example
    heading + the `- [ ] [HUMAN] Merge the PR` checklist line itself),
    `trunk-based-development.md`, `workflows/README.md` (×2), `plan-quality-gate.md` (×2),
    `workflow-naming.md`, `plan-multi-repo-parity-planning-and-execution.md` (×2).
    `.claude/`: `plan-maker.md` (×3), `plan-checker.md` (×7 — including the merge-tag rule, which
    said the final PR-merge step "MUST be tagged `[HUMAN]` (never `[AI]`)" and is now inverted),
    `plan-fixer.md` (×4 — including "merge step tagged `[AI]` → retag `[HUMAN]`", the rule stated
    exactly backwards), `plan-execution-checker.md`, and
    `skills/plan-creating-project-plans/SKILL.md` (×4).
  - **`npm run generate:bindings` re-run** after the `.claude/` edits (82 agents converted); a
    follow-up grep of `.opencode/` found **no** stale non-opt-in `[HUMAN]`-merge text, confirming the
    mirrors carry the inverted default.
  - **Discovered defect — `repo-governance/development/workflow/pr-merge-protocol.md`** (named in no
    checkbox in this plan): its core rule was the pre-Delta-12 default at maximum strength — "AI
    agents and automation MUST NOT merge a pull request without explicit user approval", "No AI
    agent, automation script, or workflow may auto-merge", "Prior approval does not carry forward" —
    plus a whole `### The Approval Prompt` section and a `FAIL: … auto-merging` example. **The
    sweep's acceptance was unsatisfiable while it stood**, so it was realigned rather than skipped:
    merge authority now derives from the five hardened preconditions (a)-(e) instead of a
    per-instance prompt, `[AI]` is the default actor, `[HUMAN]` is the explicit per-plan opt-in, and
    the quality-gate table plus the no-bypass-without-permission rule are unchanged. Its four
    Principles justifications, the draft-PR lifecycle, the terminal-step done-boundary, the
    Agent Workflow prompts, and all six worked examples were rewritten to match; the Git Push Safety
    cross-reference now states _why_ the two conventions gate differently (a force-push's safety is
    not mechanically checkable, a merge's is).
  - **Two index descriptions fixed** (same staleness class as Phase 1): `development/README.md:109`
    and `development/workflow/README.md:47` both still described `pr-merge-protocol.md` as
    "requiring explicit user approval before merging" / "no auto-merge by agents or automation".
- [x] [AI] Confirm DD-10's dissolved-by-Delta-12 status is genuinely wired, not merely textually
      present: `tech-docs.md`'s DD-10 bullet already carries **"Status: DISSOLVED BY DELTA 12"**
      (written at plan-authoring time during an earlier bootstrap-timing fix — no further text edit is
      needed to DD-10 itself). **Scoping rationale**: a whole-file grep would
      pass vacuously because Delta 12's own prose already contains "dissolves". **Anchor rationale**:
      DD-10/DD-11 are flat `- **DD-NN` bullets, NOT `### DD-NN` headings — a heading-anchored range
      matches nothing and could never pass. Because the text half is pre-authored (confirmed live: the
      sed-range grep below already returns **1** today, not 0 — an earlier authoring pass wrote this
      text ahead of its own checkbox), the ONLY genuinely-incomplete half of "dissolved" being an
      accurate claim is whether the sibling **"Delta 12 — invert the merge default"** checkbox above
      (§4b, editing `plans.md` §Delivery Mode) has actually landed — do not tick this box until it has
      — acceptance (compound, BOTH required):
      `sed -n '/^- \*\*DD-10/,/^- \*\*DD-11/p' tech-docs.md | grep -ci "dissolved by Delta 12"` returns
      ≥1 (already **1** today, confirmed live — this half is pre-satisfied and stays 1 post-edit; it is
      NOT the discriminating half) AND
      `grep -oEi '\[AI\] merges|only where.*explicitly|only the actor' repo-governance/conventions/structure/plans.md | sort -u | wc -l`
      returns ≥2 (returns **0** today, confirmed live — this is the discriminating half; becomes ≥2 only
      once the sibling Delta-12 checkbox above has actually executed, confirmed via a simulated post-edit
      copy), counting distinct matched terms not matching lines, regardless of how the prose is
      line-wrapped. **Overall compound clause is FALSE today (blocked by the plans.md half returning 0)
      and becomes TRUE only after Delta 12 has actually landed — verified both directions live.**
  - **Date**: 2026-07-20. **Both halves pass.** Half A (the DD-10→DD-11 sed range) returns **1**,
    unchanged as predicted — pre-satisfied by the earlier authoring pass, and correctly the
    non-discriminating half. Half B returns **3** against a required ≥2, having moved from the
    **0** recorded at plan-authoring time.
  - **The discriminating half genuinely discriminated**: half B only became non-zero because the
    sibling Delta-12 checkbox (§4b, `plans.md` §Delivery Mode) actually executed and wrote the
    inverted default. The three distinct matched terms are `[AI] merges`, the
    `only where … explicitly` opt-in clause, and `only the actor`. The compound clause was FALSE
    before that sibling landed and is TRUE now, so DD-10's "dissolved" claim is wired to a real
    edit rather than to its own pre-authored prose.
- [x] [AI] Add the **per-phase-PR + feature-flag + strict 1-PR↔1-worktree** planning-granularity rule
      (Delta 10) to `repo-governance/workflows/plan/plan-planning.md` and cross-reference from
      `repo-governance/conventions/structure/plans.md`: each applicable phase / independent DAG node
      lands as its own PR (one worktree → one branch → one PR → one node), feature-flag partial work
      merged-but-dark on `main`, inseparable dependent phases stay one PR (DAG governs) — acceptance:
      `grep -ni "feature flag\|one PR\|per-phase\|1-PR" plan-planning.md` present
- [x] [AI] State in `plan-planning.md` how the `worktree-to-pr` default binds at each plan path:
      **creating/updating** a plan binds it as a **design obligation** (the authoring edit may push
      direct to `main`, but phases must be authored to be independently PR-able, and a plan that
      cannot be so decomposed records why in its `tech-docs.md`); **executing** a plan binds it as the
      actual delivery route. Introduce the **plan-docs-only** carve-out as a general convention in its
      own right (a change touching only `plans/**`, no `apps/`/`libs/` code, may push direct to
      `main`) — stated on its own footing, **not** derived from DD-11, which disclaims being a general
      precedent — acceptance: count DISTINCT matched terms, not matching lines:
      `grep -oEi 'design obligation|independently PR-able|plan-docs-only' plan-planning.md | sort -u | wc -l`
      returns ≥3 (the same command returns **0** against the current pre-edit file — verified live, so
      the clause discriminates a done step from an undone one), regardless of how the prose is
      line-wrapped
- [x] [AI] Make **per-phase merging** explicit (not merely per-phase PR _opening_) in
      `plan-planning.md` + `plan-execution.md`: each phase PR is opened **and merged** as that phase
      completes and is **not** held for a batch merge at plan end. State the merge actor per **Delta
      12's inverted default**: `[AI]` merges once the preconditions hold, and `[HUMAN]` applies **only**
      where a plan's own step states it explicitly. Do **not** write the pre-Delta-12 framing
      ("`[HUMAN]` by the unchanged Delivery Mode default") — it would contradict the §4b edit two
      checkboxes above and fail this phase's own Gate convergence-proof check. DD-10 is **dissolved by
      Delta 12**; cite it only as history, never as authority for the merge actor — acceptance: count
      DISTINCT matched terms across both files combined
      (`-h` suppresses the per-file `filename:` prefix so `sort -u`/`wc -l` see one comparable stream —
      plain `grep -c` on two files prints one `filename:count` line per file, which is not a single
      comparable number):
      `grep -ohEi 'batch merge|merge actor|opened and merged' plan-planning.md plan-execution.md | sort -u | wc -l`
      returns ≥3 (returns **0** against both current pre-edit files — verified live; the terms track
      the content this checkbox actually mandates, none of them the dropped pre-Delta-12 phrasing)
- [x] [AI] Encode the **feature-flag default + escape + removal** rule in `plan-planning.md`:
      flagging is the default; a phase lands unflagged **only** when it ships no user-reachable
      behaviour change (pure docs / governance / refactor / test-only) and the step names which
      exemption applies; every flag introduced carries a named **removal step** in the plan's final
      phase — acceptance: count DISTINCT matched terms, not matching lines:
      `grep -oEi 'unflagged|user-reachable|flag removal step' plan-planning.md | sort -u | wc -l`
      returns ≥3 (returns **0** against the current pre-edit file), regardless of how the prose is
      line-wrapped
- [x] [AI] Reflect the 1-PR↔1-worktree cleanup tie in `plan-execution.md` (the worktree is the unit
      cleaned up when its PR lands) — acceptance: `grep -ni "one worktree\|per-PR\|feature flag" plan-execution.md` present
  - **Date**: 2026-07-20. All five §4b-tail items delivered together, since four of them land in the
    same file. All five baselines verified live at **0** beforehand.
  - **New `## Planning Granularity` section in `plan-planning.md`** (placed before `## Steps`), with
    four subsections: the strict **one worktree → one branch → one PR → one node** mapping and the
    "sequence is not dependency" framing; **per-phase merging, not batch merging** (with the merge
    actor stated per Delta 12's inverted default, never the pre-Delta-12 phrasing this checkbox
    forbids); **feature flags** (default / unflagged escape naming its exemption / named removal
    step in the final phase); and **how the default binds at each plan path** (design obligation
    when authoring, delivery route when executing) plus the **plan-docs-only** carve-out stated on
    its own footing rather than derived from DD-11.
  - **Cross-reference added to `plans.md`** §Delivery Checklists Express a DAG, tying each
    independent DAG node to its own PR and linking to the full rule.
  - **Conflict found and fixed in `plan-execution.md` Step 2b**: item 6 mandated a single
    plan-wide PR — "every subsequent phase push targets that same PR branch" — which directly
    contradicts Delta 10's per-phase PR. Rewritten to push to the PR branch **of the DAG node being
    delivered**, plus two new paragraphs covering per-phase merging and the worktree-as-unit-of-
    cleanup tie (cleanup is the terminal DAG node, so it cannot remove a worktree an in-flight node
    still needs).
  - **Acceptance verified**: #57 = 6 (>0), #58 = 3 (≥3), #60 = 3 (≥3), #61 = 3 (>0). #59's combined
    two-file grep returns 3 (≥3) — and, deliberately, returns **3 against `plan-execution.md`
    alone** as well, so the clause is satisfied in each file the checkbox names rather than only in
    aggregate.

### 4c. Cross-surface sweep (agents / skills / workflows)

- [x] [AI] Grep-discover every agent/skill/workflow referencing the old cap numbers, orchestration,
      worktrees, git-safety, or cleanup:
      `grep -rln "cap at 2\|3 total\|2 background\|stricter cap of 2\|max-concurrency\|background agent\|worktree\|git-safety\|cleanup" .claude/agents .claude/skills repo-governance/workflows`
      — acceptance: candidate file list recorded in `learnings.md` (expect ≥20 workflow hits from
      `max-concurrency` alone, plus all 7 `plan/*` files)
  - **Date**: 2026-07-20. Sweep run verbatim; **36 candidate files** recorded in `learnings.md`
    under `## Phase 4c discovery sweep`, broken down by area (8 agents / 4 skills / 24 workflows).
  - **Both expectations met exactly**: `grep -rl "max-concurrency" repo-governance/workflows/`
    returns **20**, and all **7** `repo-governance/workflows/plan/*` files appear in the list.
  - **Recorded with a caveat**: the sweep pattern matches any mention of `worktree` or `cleanup`, so
    a listed file is a candidate requiring a read, not a confirmed stale surface — noted in
    `learnings.md` so a later reader does not mistake list membership for a defect.

#### 4c-i. ALL SEVEN `repo-governance/workflows/plan/*` files (one checkbox each)

- [x] [AI] `repo-governance/workflows/plan/README.md` — update the plan-workflow index to reflect the
      N+1/DAG model and link the two new conventions — acceptance:
      `grep -ci "N+1\|1 main thread + N background" plan/README.md` returns **≥1** (returns **0** today,
      confirmed live — the bare `grep -ni "N+1\|DAG"` pattern is already **1** today via an unrelated
      "dependency DAG" mention describing `multi-plans-execution.md`'s scheduler, so it MUST NOT be used
      alone as the acceptance signal); new convention links resolve
- [x] [AI] `repo-governance/workflows/plan/plan-execution.md` — N+1 fan-out, DAG ordering, 1-PR↔1-worktree
      cleanup tie, no-destructive-git, self-scoped cleanup — acceptance:
      `grep -ci "1 main thread + N background agents\|1-PR.*1-worktree" plan-execution.md` returns **≥1**
      (returns **0** today, confirmed live — the bare `grep -ni "N+1\|DAG\|one worktree"` pattern is
      already **1** today via a false-positive substring match on ordinary "do NOT start phase N+1"
      phase-gate language, so it MUST NOT be used alone as the acceptance signal); no stale "cap at 2 /
      3 total" (confirmed absent both today and required to stay absent)
- [x] [AI] `repo-governance/workflows/plan/plan-planning.md` — per-phase PR + feature flags + strict
      1-PR↔1-worktree (Delta 10) — **this is the §4c-i cross-workflow consistency pass, NOT a re-do of the
      §4b authoring edit**; §4b writes the rule into `plan-planning.md`, this checkbox verifies every
      _other_ plan workflow that references planning granularity now agrees with it — acceptance:
      run the loop below and confirm it prints nothing:

  ```sh
  for f in plan-execution multi-plans-execution plan-multi-repo-parity-planning \
           plan-multi-repo-parity-planning-and-execution; do
    [ "$(grep -ci "1-PR\|per-phase PR" repo-governance/workflows/plan/$f.md)" -ge 1 ] \
      || echo "MISSING $f"
  done
  ```

  Printing nothing — i.e. each of these **four** delivery-executing workflows carries the rule
  (today it prints all four: every one returns **0**, verified live) — **and**
  `grep -rc "cap at 2\|3 total" repo-governance/workflows/plan/` returns 0 in every file.
  **Use the per-file `grep -c` form above, not `grep -L`**: `grep` in this environment is a shell
  function routing to ripgrep, where `-L` means _follow symlinks_, not _files-without-match_ — a
  `grep -L` clause silently returns empty and reads as passing no matter what.
  **Scope rationale**: the set is deliberately **not** all 7 `plan/*.md`. `plan-planning.md` is
  §4b's own target (including it would make this clause free-ride on §4b), and `README.md` +
  `plan-quality-gate.md` have no checkbox in this plan prescribing the phrase — requiring it of
  them would make the clause unreachable via the plan's own prescribed work.
  **A bare re-grep of `plan-planning.md` MUST NOT be used**: it is a strict subset of §4b's own
  acceptance clause, so it flips to true the moment §4b completes and can never discriminate
  whether this sweep actually ran.

- [x] [AI] `repo-governance/workflows/plan/plan-quality-gate.md` — align the `max-concurrency` frontmatter
      default/wording with N+1 **and** add the hardened merge preconditions (3 cycles + up-to-date with
      `origin/main` + all gates green) to its Delivery-Mode done-definition section — acceptance:
      `grep -ci "N+1\|1 main thread + N background" plan-quality-gate.md` returns **≥1** (returns **0**
      today, confirmed live — the bare `grep -ni "max-concurrency\|up-to-date\|3 cycles"` pattern is
      already **1** today via the file's own pre-existing `- name: max-concurrency` YAML frontmatter
      field, so it MUST NOT be used alone as the acceptance signal)
- [x] [AI] `repo-governance/workflows/plan/multi-plans-execution.md` (**most affected** — governs running
      multiple plans at once): adopt N+1, background-slot-preference/main-vacant, DAG-first ordering,
      3-5 min status cadence, 1-PR↔1-worktree; **supersede** its "cap 3 concurrent / background cap 2
      never more" language — acceptance: `grep -n "cap 3\|cap at 2\|never more\|3 total" multi-plans-execution.md` returns nothing; N+1/DAG/cadence text present
- [x] [AI] `repo-governance/workflows/plan/plan-multi-repo-parity-planning.md` — worktree-to-PR default,
      per-phase PR + feature flags, no-destructive-git, self-scoped cleanup, parallel propagation shape
      (ose-public → ose-primer/ose-infra) — acceptance:
      `grep -ci "per-phase PR\|feature.flag\|no-destructive-git\|parallel propagation" plan-multi-repo-parity-planning.md`
      returns **≥1** (returns **0** today, confirmed live — the file's 13 pre-existing, ordinary mentions
      of "worktree-to-pr" as an already-documented delivery-mode name MUST NOT be used alone as the
      acceptance signal; they predate this plan and are unrelated to the new per-phase-PR/feature-flag
      content)
- [x] [AI] `repo-governance/workflows/plan/plan-multi-repo-parity-planning-and-execution.md` — same
      alignment as above for the execution half — acceptance: same narrowed
      `grep -ci "per-phase PR\|feature.flag\|no-destructive-git\|parallel propagation"` clause returns
      **≥1** (returns **0** today, confirmed live, same root cause as the sibling file above)
  - **Date**: 2026-07-20. All seven §4c-i files delivered; **all seven baselines re-verified live at
    0** (or, for `multi-plans-execution.md`, at 1 stale-cap hit) before any edit, so each clause
    discriminates a done step from an undone one.
  - **`plan/README.md`** — new `## Orchestration Model Shared by These Workflows` section (N+1,
    DAG-first, 1-PR↔1-worktree) plus three new Related-Documentation links to the orchestration
    convention and the two new conventions. Acceptance grep: **3** (≥1). All five link targets
    verified to exist on disk.
  - **`plan-execution.md`** — new `### Fan-Out, Ordering, and Delivery Shape` subsection under
    §Orchestration Model covering N+1 fan-out, DAG-first ordering, the 1-PR↔1-worktree cleanup tie,
    non-destructive/self-scoped git, and the 3-5 min cadence. Acceptance: **2** (≥1); stale
    "cap at 2 / 3 total" confirmed **0** and required to stay so.
  - **`plan-quality-gate.md`** — `max-concurrency` frontmatter default **2 → 3** with an N+1-framed
    description, plus the full hardened merge preconditions (a)-(e) added to §Relationship to
    Delivery-Mode Done-Definition. Acceptance: **1** (≥1).
  - **`multi-plans-execution.md`** (most affected) — `max-concurrency` default **2 → 3**; the stale
    "background subagents cap at 2 (3 total including the main thread)" sentence **superseded** by
    the N+1 model, and four new bullets added (background-slot preference, DAG-first ordering, 3-5
    min status cadence, 1-PR↔1-worktree delivery). Acceptance: stale-pattern grep now returns
    **0**; N+1/DAG/cadence text present (**4**).
  - **`plan-multi-repo-parity-planning.md`** — three new subsections: Parallel Propagation Shape
    (`ose-public` as source of truth fanning out to two **independent** downstream nodes, not a
    chain), Delivery Shape Per Repo (per-phase PRs + feature flags), and Shared-Machine Safety.
    Acceptance: **5** (≥1).
  - **`plan-multi-repo-parity-planning-and-execution.md`** — same alignment for the execution half.
    Acceptance: **5** (≥1).
  - **Judgement call recorded**: both parity files carried a strict "one repo at a time" sequencing
    rule. Rather than delete it for Delta 6, the parallel-propagation shape is stated as what applies
    **when the invoker opts out of strict sequencing**, and the two constraints that genuinely force
    serialization are named explicitly — `apps/rhino-cli` byte-identity across all three repos, and
    the general "any node writing what another node reads" independence test. Deleting the
    sequencing rule outright would have traded one correct constraint for another.
  - **§4c-i cross-workflow consistency loop passes**: the four-file loop
    (`plan-execution`, `multi-plans-execution`, and both parity files) **prints nothing**, having
    printed all four pre-edit; and `grep -rc "cap at 2\|3 total"` returns 0 in every
    `repo-governance/workflows/plan/` file.
  - **Preexisting failure surfaced, not caused**: a repo-wide `md links validate` reports **93
    broken links** — 44 archived `plans/done/` files plus one `ayokoding-www` content page. None sit
    in any file this plan touches (the pre-commit hook scopes to staged files, which is why the
    Phase 4b commit passed cleanly). Not remediated here: `plans/done/` is an immutable archive by
    convention, and a 45-file link repair is a separate change.

#### 4c-ii. Repo-wide `max-concurrency` frontmatter (20 files)

- [x] [AI] Enumerate: `grep -rl "max-concurrency" repo-governance/workflows/ | sort`
      — acceptance: 20 files listed and recorded in `learnings.md`
- [x] [AI] Align the `max-concurrency` default/wording with the N+1 model across the 19 files carrying
      `default: 2` — including `workflows/README.md` (which documents "Parallel execution limit -
      default: 2") and `meta/workflow-identifier.md` (which defines the input schema) — acceptance:
      each updated file's `max-concurrency` description references the N+1 model, not a bare fixed 2
- [x] [AI] **PRESERVE** `web/web-ux-test-fixing-planning.md` at `Default 1` — the three testers run
      SEQUENTIALLY by design (a genuine DAG serialization point, NOT a stale cap); document _why_ it
      stays 1, citing "DAG governs — never force parallelism onto dependent nodes" — acceptance:
      file still reads `Default 1` **and** carries the new justification sentence
- [x] [AI] `repo-governance/workflows/repo/repo-dependency-bump-planning.md` — align its prose-level
      concurrency cap ("one agent per ecosystem batch") + Subagent-Orchestration cross-link with N+1
      — acceptance (compound, BOTH required):
      `grep -ci "N+1\|1 main thread" repo-dependency-bump-planning.md` returns **≥1** (returns **0**
      today, confirmed live) AND `grep -c "capped at 2 concurrent" repo-dependency-bump-planning.md`
      returns **0** (returns **1** today, confirmed live — this is the literal stale text the edit
      replaces). **The bare `grep -ni "N+1\|cap"` pattern MUST NOT be used alone**: it returns **4**
      today (non-zero pre-edit) and would ALSO still match post-edit (the word "cap" survives in
      plausible fixed phrasing too, e.g. "cap concurrent agents at N"), so it can never discriminate a
      completed edit from an incomplete one in either direction.
- [x] [AI] `repo-governance/workflows/pr/pr-review-quality-gate.md` — **NO `max-concurrency` edit**.
      This file carries zero `max-concurrency` frontmatter and declares its cycle "Strictly sequential,
      never parallel"; its only edits in this plan are Delta 8 (§4b) and Delta 11 (§4c-ii) — acceptance:
      `grep -c "max-concurrency" repo-governance/workflows/pr/pr-review-quality-gate.md` returns **0**
      (returns **0** today, confirmed live, and must **stay** 0 — this checkbox exists to record that
      the file was deliberately excluded from the 4c-ii sweep, not skipped by oversight)
  - **Date**: 2026-07-20. Full §4c-ii sweep delivered; the 20-file enumeration and final per-file
    disposition are recorded in `learnings.md` under `## Phase 4c-ii — the 20 max-concurrency files`.
  - **Enumeration**: exactly **20** files, matching the plan. 18 now carry `default: 3` with an
    N+1-framed description; `workflows/README.md` documents the parameter in prose rather than
    frontmatter (its `default: 2` bullet updated in place); `web-ux-test-fixing-planning.md` stays
    at `Default 1` by design.
  - **PRESERVE case honoured with justification**: `web-ux-test-fixing-planning.md` still reads
    `Default 1` **and** now carries the required rationale — the three testers run
    exploratory → integrate → usability → integrate → design → integrate, so each reads the plan the
    previous one wrote and they **fail the independence test**. The added sentence states "This 1 is
    a genuine DAG serialization point, NOT a stale concurrency cap" and "The DAG governs — never
    force parallelism onto dependent nodes". Verified: `Default 1` = 1, `DAG governs` = 1.
  - **`repo-dependency-bump-planning.md` compound acceptance**: `N+1|1 main thread` returns **3**
    (≥1, was 0) AND `capped at 2 concurrent` returns **0** (was 1) — both directions discriminate.
    Two sites edited: the Conventions cross-link and the Step 2 prose cap, the latter now noting
    that ecosystem batches are independent DAG nodes so batch count is the real fan-out.
  - **`pr-review-quality-gate.md` exclusion recorded**: `grep -c "max-concurrency"` returns **0**,
    unchanged — the file declares its cycle strictly sequential and has no such frontmatter, so it
    is out of scope by construction rather than by oversight.
  - **Bulk-edit near-miss worth noting**: the first sweep attempt used `for f in $FILES` and passed
    the whole newline-joined list as a single argument ("File name too long"), modifying **nothing**
    while appearing to run. Caught only by the post-sweep verification loop, which still showed
    `default: 2` across the board. Logged in `learnings.md`: a loop that fails to iterate is
    indistinguishable from a loop with no work, so bulk edits need an independent after-check.

- [x] [AI] Update every discovered `.claude/agents/*.md` and `.claude/skills/*/SKILL.md` that carries
      stale orchestration text to the N+1/DAG/main-vacant model — acceptance: re-run the 4c grep; only
      intentional historical references remain, each justified inline
  - **Date**: 2026-07-20. Re-running the 4c discovery grep for stale cap text across
    `.claude/agents`, `.claude/skills`, and `repo-governance/workflows` now returns **nothing** —
    **zero** remaining stale references, so no "intentional historical reference" needed justifying.
  - **One genuinely stale surface found and fixed**: `.claude/skills/repo-defining-workflows/SKILL.md`
    — the skill that **teaches** the workflow frontmatter schema, so its `max-concurrency` example
    (`description: Maximum number of agents/tasks that can run in parallel`, `default: 2`) would have
    reproduced the superseded cap into every workflow authored from it. Both sites updated: the
    schema template and the `## Standard Input Parameters` bullet, the latter also carrying "the DAG
    governs the actual fan-out; N only caps it".
  - **Verified-not-stale (no edit needed)**: the merge-related `.claude/agents/*` text was already
    corrected in the §4b sweep. The remaining `subagent`/`concurrency`/`parallel` hits across
    `.claude/` are unrelated domain content — F#/C#/Rust language concurrency-standards links,
    Playwright parallel-execution guidance, `web-researcher` delegation thresholds — not
    orchestration-model statements. Read rather than pattern-matched, to avoid editing by keyword.
  - **`npm run generate:bindings` re-run** after the skill edit (82 agents converted, `.amazonq`
    bridge re-emitted) so the secondary bindings carry the corrected schema.
- [ ] [AI] Completeness gate: invoke `repo-rules-checker` + `repo-harness-compatibility-checker` over
      the swept files — acceptance: no CRITICAL/HIGH stale-reference or vendor-leak findings unresolved

### 4d. main-ci schedule (ose-public) + bindings

> **Why this is safe** (record in the commit body): `main-ci.yml` runs essentially the **same checks**
> as PR CI and the pre-commit/pre-push hooks — only the **scope** differs (`--all` vs `affected`). The
> hooks are auto-installed on every `npm install` (`"prepare": "husky"`), which worktree-setup
> mandates, so every push already cleared the affected-scope gates locally; PR CI re-runs them at
> affected scope before merge; main-ci is the periodic whole-repo `--all` sweep for cross-project
> drift. Three overlapping layers → no per-push trigger needed; up-to-~6h lag on `main` is an accepted
> tradeoff (direct-push modes carry only known-safe docs-only edits).

- [x] [AI] Edit `.github/workflows/main-ci.yml`: remove `push: branches: [main]` and set the trigger to
      the 4×/day schedule + dispatch:

  ```yaml
  on:
    schedule:
      - cron: "0 5,11,17,23 * * *" # 06:00/12:00/18:00/00:00 (next day) WIB (UTC+7)
    workflow_dispatch:
  ```

  — acceptance: `grep -n "schedule\|workflow_dispatch" .github/workflows/main-ci.yml` present and
  `grep -n "push:" .github/workflows/main-ci.yml` returns nothing; `actionlint .github/workflows/main-ci.yml` exits 0
  - _Suggested executor: `ci-fixer`_
  - **Date**: 2026-07-20. Trigger block replaced verbatim with the plan's YAML — the
    `push: branches: [main]` trigger removed and `schedule: - cron: "0 5,11,17,23 * * *"` +
    `workflow_dispatch:` put in its place, with the WIB-offset comment retained inline.
  - **All three acceptance clauses pass**: `grep -c "schedule\|workflow_dispatch"` returns **2**;
    `grep -n "push:"` returns **nothing**; `actionlint .github/workflows/main-ci.yml` **exits 0**.
  - **Executed directly rather than via `ci-fixer`**: the suggested executor is a fixer that
    consumes a `ci-checker` audit report, and no such report exists — this is a prescribed
    three-line trigger swap with a verbatim target, not a finding to triage. Recorded here because
    the annotation was deliberately not followed.

### 4e. Platform-binding catalog: Amazon Q Developer → Kiro CLI succession

- [x] [AI] Edit `docs/reference/platform-bindings.md`: update the "Amazon Q Developer" entry to record
      the Q-Developer-CLI → Kiro-CLI succession — sunset dates (new-signup block 2026-05-15, models
      Kiro-only 2026-05-29, IDE-plugin EOS 2027-04-30) and Kiro capabilities (native DAG task-graphs,
      up to 4 subagents, worktree isolation, `q`/`q chat` preserved, `~/.aws/amazonq`→`~/.kiro`
      auto-migrated) — acceptance: `grep -ni "Kiro" docs/reference/platform-bindings.md` present; no
      "Amazon Q Developer" mention reads as evergreen
- [x] [AI] Grep every other "Amazon Q Developer" mention and update consistently
      (`grep -rln "Amazon Q" AGENTS.md docs/reference/`); confine vendor-accurate detail to
      platform-binding surfaces (NOT `repo-governance/` prose) — acceptance: `AGENTS.md` §Platform
      Binding Examples reflects the succession; `repo-governance/` prose remains vendor-neutral
  - _Suggested executor: `repo-harness-compatibility-fixer`_
  - **Date**: 2026-07-20. Both checkboxes delivered. `grep -ci "Kiro" docs/reference/platform-bindings.md`
    returns **24** (was 0); `AGENTS.md` §Platform Binding Examples now flags the succession inline;
    `grep -rn "Kiro" repo-governance/` returns **nothing**, so governance prose stays vendor-neutral.
  - **Facts verified before writing, and two of the plan's stated claims did not survive.** The plan
    asserted these as established, but they ship as reference documentation, so each was checked
    against AWS/Kiro primary sources (`web-researcher`, 2026-07-20):
    - **CONFIRMED verbatim**: the rebrand itself; new-signup block **2026-05-15**; IDE-plugin EOS
      **2027-04-30**; native DAG task-graphs; **up to 4** concurrent subagents; `q`/`q chat`
      preserved; `~/.aws/amazonq` → `~/.kiro` auto-migration.
    - **CORRECTED — "worktree isolation" is not a Kiro feature.** Kiro's own docs describe subagent
      isolation as _context-level_ ("its own isolated context") and never mention git worktrees.
      Worktree isolation for Kiro exists only as a **third-party** community pattern
      (`requix/kiro-team`). Written up as such rather than repeated as a first-party capability.
    - **CORRECTED — the 2026-05-29 date is narrower than "models Kiro-only".** The source says
      Opus 4.6 stops being available on Q Developer Pro that day; Opus 4.5 and others remain, and
      the newest models are Kiro-exclusive without a single stated cutover date. Written to match
      the source rather than the broader paraphrase.
  - **Material finding the plan did not anticipate — the `AGENTS.md` situation reversed.** Q
    Developer CLI did not read `AGENTS.md` (feature request #2712, still open and never resolved for
    that product), but **Kiro CLI reads it natively** — workspace root or `~/.kiro/steering/`, and
    _always included_ unlike custom steering files. The binding-table row and a new
    `### Amazon Q Developer CLI → Kiro CLI succession` section record this, along with Kiro's full
    config surface (`.kiro/steering/`, `.kiro/settings/mcp.json`, `.kiro/agents/`, `.kiro/skills/`)
    and the caveat that custom Kiro agents must opt into steering explicitly.
  - **Consequence recorded, not acted on**: the generated `.amazonq/` bridge exists _because_ Q
    Developer could not read `AGENTS.md`. Kiro can, so the bridge becomes redundant once this repo
    targets Kiro — noted in the reference doc as a deliberate future change rather than retired as a
    side effect of a catalog update.
  - **`rhino-cli-command-triage.md` deliberately left alone**: its "Amazon Q" mentions describe the
    `harness bindings generate` emitter's actual current behaviour (the bridge is still emitted), so
    they are accurate tooling documentation, not evergreen product claims.
  - **Follow-up logged, not silently absorbed**: the vendor-audit scanner's term list does not
    include `Kiro`, so a future leak into governance prose would pass undetected. Not fixed here —
    the scanner lives in `apps/rhino-cli/**`, which must stay byte-identical across all three repos,
    and patching only the convention's documented term table would make the doc misdescribe the
    tool. Recorded in `learnings.md` as a candidate tri-repo parity plan; verified there is no live
    leak today.

### 4f. Surface-conditional UI / API tester gates + NEW `workflows/api/` (Delta 11)

> **Verified gap**: `repo-governance/ui/` exists (`README.md` + `ui-quality-gate.md`), but
> `repo-governance/workflows/api/` **does not exist** — while `.claude/agents/api-exploratory-tester.md`
> DOES. This sub-block creates the missing API half and wires the conditional rule.
>
> **Do not conflate the three UI-related gates**: `plan-checker` **Step 5k** gates the UI **design
> funnel** in `prd.md` (pre-build); `ui/ui-quality-gate.md` gates the **built components** via
> `swe-ui-checker`/`swe-ui-fixer` (static, no browser); `web/web-ux-test-fixing-planning.md` gates the
> **running UI** via the EWT/UWT/DWT triad. Complementary, never substitutes.

- [x] [AI] Create `repo-governance/workflows/api/api-quality-gate.md` _New file_, modelled on
      `repo-governance/workflows/ui/ui-quality-gate.md`: YAML frontmatter with `name: api-quality-gate`,
      `title`, `goal`, `termination`, `inputs` (`scope`, `mode` enum `[lax, normal, strict, ocd]`,
      `min-iterations`, `max-iterations` default 7, **`max-concurrency` aligned with the §4c-ii N+1
      value**), `outputs` (`final-status`, `iterations-completed`, `final-report` pattern
      `generated-reports/api-exploratory-tester__*__audit.md`); body carries an **Execution Mode**
      section (Agent Delegation preferred / Manual Orchestration fallback) and a **tester-driven
      find→fix→re-test loop** — `api-exploratory-tester` emits `AET-###` findings against a live
      REST/GraphQL endpoint with the contract (OpenAPI 3.x / GraphQL SDL) as ground truth, the
      appropriate `swe-*-dev` agent fixes, the tester re-runs until the defect set is empty
      — acceptance: `test -f repo-governance/workflows/api/api-quality-gate.md` exits 0 and
      `grep -c "max-concurrency" repo-governance/workflows/api/api-quality-gate.md` returns ≥ 1
  - _Suggested executor: `repo-workflow-maker`_
  - _Honest shape note_: there is **no** `api-checker`/`api-fixer` agent pair — do NOT author this as a
    checker/fixer clone of `ui-quality-gate.md`; it is a tester-driven loop. Citing a non-existent
    agent is anti-pattern AP-7.
  - _Naming_: follows the
    [Workflow Naming Convention](../../../repo-governance/conventions/structure/workflow-naming.md)
- [x] [AI] Create `repo-governance/workflows/api/README.md` _New file_ mirroring
      `repo-governance/workflows/ui/README.md`: frontmatter (`title: "API Workflows"`, `description`,
      `category: explanation`, `subcategory: workflows/api`, `tags`, `created`), an "Available
      Workflows" table row for API Quality Gate naming `api-exploratory-tester`, and a "Related
      Documentation" section — acceptance: `test -f repo-governance/workflows/api/README.md` exits 0
      and the table links `./api-quality-gate.md`
  - _Suggested executor: `repo-workflow-maker`_
- [x] [AI] Register the new category in `repo-governance/workflows/README.md` alongside `ui/`
      — acceptance: `grep -n "workflows/api\|api-quality-gate" repo-governance/workflows/README.md`
      returns ≥ 1 hit; no hardcoded collection counts introduced (Dynamic Collection References)
- [ ] [AI] Validate the two new workflow files with `repo-workflow-checker`
      — acceptance: no CRITICAL/HIGH findings unresolved
  - _Suggested executor: `repo-workflow-checker`_
- [x] [AI] State the **surface-conditional gate rule** in
      `repo-governance/workflows/plan/plan-execution.md` and
      `repo-governance/workflows/plan/plan-planning.md`: UI-bearing plan → run BOTH UI gates
      (`ui/ui-quality-gate.md` static + `web/web-ux-test-fixing-planning.md` running triad);
      API/BE-bearing plan → run `api/api-quality-gate.md`; both → both; neither → **the plan MUST
      state the exemption explicitly in `tech-docs.md`**, never leave it implicit. Bind at BOTH points:
      during plan creation/update/execution, AND as a merge precondition — acceptance:
      `grep -c "api-quality-gate" repo-governance/workflows/plan/plan-execution.md repo-governance/workflows/plan/plan-planning.md`
      returns ≥ 1 for each file
- [x] [AI] Add the explicit **three-way distinction** paragraph (5k design funnel / `ui-quality-gate`
      built components / triad running UI — complementary, not contradictory) to the same two plan
      workflow files so nobody treats one gate as substituting for another — acceptance:
      `grep -ni "5k" repo-governance/workflows/plan/plan-execution.md` returns ≥ 1 hit
- [x] [AI] Add the conditional gate to `repo-governance/workflows/pr/pr-review-quality-gate.md` as
      **merge precondition clause (e)** — the normative Delta 8 lettering — alongside clauses (a)-(d) (3 cycles / 0 CRITICAL+0 HIGH /
      up-to-date-with-`origin/main` / all gates green) — acceptance:
      `grep -c "api-quality-gate" repo-governance/workflows/pr/pr-review-quality-gate.md` returns ≥ 1
      (returns **0** today, verified live). **Do NOT add `surface-conditional` as an alternative** —
      the §4b checkbox above already writes that literal string into this same file when it copies
      Delta 8's `(a)-(e)` lettering, so an OR'd pattern would pass vacuously whether or not this
      checkbox's own work happened. The concrete `api-quality-gate` reference is the discriminating
      signal the Phase 4 Gate actually requires.
- [x] [AI] Cross-link Rule 15 (web triad) and Rule 16 (AET) in
      `repo-governance/development/quality/user-facing-delivery-hardening.md` to the new conditional
      rule and the new `api/` workflow, so the two surfaces agree rather than drift — acceptance:
      `grep -n "workflows/api" repo-governance/development/quality/user-facing-delivery-hardening.md`
      returns ≥ 1 hit
  - _Suggested executor: `repo-rules-maker`_

- [x] [AI] Regenerate the platform bindings: `npm run generate:bindings`
      — acceptance: exits 0; `.opencode/**` and `.amazonq/**` updated to reflect the new text; no hand-edits
- [x] [AI] Run the harness-binding sync check: `npm run validate:sync` (real npm script, wraps
      `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness sync validate`
      per `package.json:34`; there is no `rhino-cli:validate:sync` Nx target) — acceptance: exits 0
- [x] [AI] Run the vendor-audit check: `npx nx run rhino-cli:governance:vendor-audit-validation`
      (real Nx target, wraps `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- repo-governance vendor validate repo-governance/`)
      — acceptance: exits 0; no vendor-specific content leaked into governance files
  - **Date**: 2026-07-20, all three mechanical checks green.
    - `npm run generate:bindings` → **exit 0**; 82 agents converted, `.amazonq` bridge re-emitted.
      `git status --porcelain .opencode .amazonq` returns **empty** — no drift, no hand-edits.
    - `npm run validate:sync` → **exit 0**, **85/85 checks passed, 0 failed**.
    - `npx nx run rhino-cli:governance:vendor-audit-validation` → **exit 0**,
      "GOVERNANCE VENDOR AUDIT PASSED: no violations found".
  - **Cache distrusted deliberately**: the first vendor-audit invocation was served from the Nx cache
    ("existing outputs match the cache"), which is exactly the wrong thing to trust immediately after
    editing the files it scans. Re-ran with `--skip-nx-cache`; the uncached run passes too, so the
    result reflects current disk state rather than a stale hit.
  - **Rule 15/16 cross-link**: `grep -c "workflows/api" user-facing-delivery-hardening.md` returns
    **2** (was 0). Rule 16's body now states that this is the same surface-conditional rule the plan
    workflows and merge gate apply, links all three gate workflows plus the canonical mapping in
    plan-planning, and names which surface wins on divergence (the workflow mapping). Three entries
    added to Related Documentation. All five new relative link targets verified present on disk.
- [ ] [AI] Invoke `repo-rules-checker` over the changed governance files — acceptance: no CRITICAL/HIGH findings unresolved

### Phase 4 Gate

> All checks below must pass before starting Phase 5.

- [x] [AI] `npm run generate:bindings` exited 0 and binding artifacts are in sync (no uncommitted drift beyond intended edits)
  - **2026-07-20**: exit 0, 82 agents converted, `.amazonq` bridge re-emitted.
    `git status --porcelain .opencode .amazonq` returns **empty** — zero drift.
- [x] [AI] `actionlint .github/workflows/main-ci.yml` exits 0; the trigger is schedule + `workflow_dispatch` only (no `push:`)
  - **2026-07-20**: `actionlint` exit **0**. Trigger block is `schedule:` (cron `0 5,11,17,23 * * *`)
    plus `workflow_dispatch:` — grep for `^  push:` returns nothing.
- [x] [AI] The 4c completeness grep returns no unjustified stale orchestration reference across agents/skills/workflows
  - **2026-07-20**: the stale-phrasing alternation (`capped at **3 concurrent**`,
    `background agents cap`, `cap at **2**`, `2 concurrent`) returns **zero** hits across all five
    roots. Positive counter-check: **27** files now carry the N+1 model wording, so the sweep
    replaced the old text rather than merely deleting it.
- [x] [AI] **Repo-wide superseded-cap proof**: `grep -rn "cap at 2\|cap of 2\|cap 3 concurrent\|3 total\|2 background\|stricter cap of 2\|never more" repo-governance/ AGENTS.md CLAUDE.md .claude/agents .claude/skills`
      returns **zero** hits (or only hits explicitly annotated as superseded-historical) — proves no stale
      cap survives in ANY workflow, convention, agent, or skill doc
  - **2026-07-20**: the alternation grep returns **zero** hits across all five roots. No annotated
    historical exception was needed — the stale phrasings are simply gone.
- [x] [AI] **Merge-actor `[HUMAN]`-merge sweep convergence proof** (re-verifies the widened 46-hit sweep,
      §4b, actually converged rather than only partially completing): re-run
      `grep -rniE "\[HUMAN\][^.]*merge" AGENTS.md CLAUDE.md repo-governance .claude | wc -l` and compare
      the count against the "after" count recorded in `learnings.md` by the §4b sweep checkbox — they
      MUST match (the count is 46 pre-edit, confirmed live; it will not generally reach zero, since
      legitimate surviving opt-ins like DD-10 are expected to remain). Genuine completion here cannot be
      captured by a single fixed-string grep (no literal "explicit opt-in" marker phrase is mandated by
      this plan, so a `grep -v <marker>`-based zero-count check would be a fake acceptance signal) —
      this is a **human-verifiable acceptance criterion**: individually re-read every surviving hit and
      confirm each states an explicit per-plan opt-in with authorizing context and non-precedential
      scope (DD-10's own wording is the model), never a restated `[HUMAN]`-is-the-default framing
  - **2026-07-20, count is 24 — and the rise is the correct outcome.** The §4b sweep recorded 20
    post-edit; §4c/§4e and the checker-finding fixes each added new sentences of the form "a
    `[HUMAN]` merge gate applies only where a plan says so", which is precisely the opt-in framing
    this criterion wants. All 24 survivors were re-read individually: every one is explicit opt-in
    framing or an index entry describing the new preconditions rule; **zero** restate
    `[HUMAN]`-as-default. `learnings.md` updated to record 20 → 24 with this justification.
  - **The §4b regex was the defect, not the count.** `repo-rules-checker` found five stale sites the
    sweep had passed clean — four in `trunk-based-development.md`, one being `plan-maker.md`'s
    Delivery Mode **table**. All shared one shape: reverse term order (`merged by a human`) or terms
    split across table columns, neither of which a fixed-order same-line pattern can bind. Fixed in
    `488148eca`; re-swept order-independently. Logged to `learnings.md`.
- [x] [AI] All SEVEN `repo-governance/workflows/plan/*` files updated:
      `ls repo-governance/workflows/plan/` lists 7 files and each appears in this phase's completed 4c-i checkboxes
  - **2026-07-20**: `ls` returns exactly 7 — `README.md`, `multi-plans-execution.md`,
    `plan-execution.md`, `plan-multi-repo-parity-planning.md`,
    `plan-multi-repo-parity-planning-and-execution.md`, `plan-planning.md`, `plan-quality-gate.md`.
- [x] [AI] `grep -rl "max-concurrency" repo-governance/workflows/ | wc -l` returns 21 (the 20 preexisting + the new `api/api-quality-gate.md`), and `web/web-ux-test-fixing-planning.md` still reads
      `Default 1` with its new justification sentence
- [x] [AI] **Delta 11 — new `api/` workflow exists and is registered**:
      `test -f repo-governance/workflows/api/api-quality-gate.md && test -f repo-governance/workflows/api/README.md`
      exits 0, and `grep -c "api-quality-gate" repo-governance/workflows/README.md` returns ≥ 1
  - **2026-07-20**: both files exist; `grep -c` returns **1**. The `api` scope token was also
    registered in `conventions/structure/workflow-naming.md` — required by that convention _before_
    any workflow may be named against the scope, and missed on first authoring (checker HIGH 7).
- [x] [AI] **Delta 11 — conditional gate rule wired at both binding points**:
      `grep -l "api-quality-gate" repo-governance/workflows/plan/plan-execution.md repo-governance/workflows/plan/plan-planning.md repo-governance/workflows/pr/pr-review-quality-gate.md`
      lists all three files
  - **2026-07-20**: all three files listed.
- [x] [AI] **Delta 11 — three-way distinction stated, not conflated**: the 5k / `ui-quality-gate` /
      web-triad distinction paragraph is present in `plan-execution.md` — acceptance:
      `grep -ni "ui-quality-gate" repo-governance/workflows/plan/plan-execution.md` returns ≥ 1 hit
  - **2026-07-20**: returns **2** hits.
- [x] [AI] `npx nx affected -t lint` + `npm run lint:md:fix` + link validation — exit 0
  - **2026-07-20**: `npm run lint:md:fix` linted **2978 files, 0 errors**. `rhino-cli md links
validate` reports no broken link in any file this plan touched. `npx nx affected -t lint`
    (`--base` = the recorded ose-public baseline SHA) reports **"No tasks were run"** — correct and
    expected, since this plan changes only governance markdown, `.github/`, and binding artifacts,
    touching no Nx project source. Recorded explicitly so the empty result reads as _verified
    not-applicable_ rather than as a skipped gate.
- [ ] [AI] `repo-rules-checker` + `repo-harness-compatibility-checker` report no unresolved CRITICAL/HIGH findings
  - **`repo-harness-compatibility-checker`, 2026-07-20: PASS, zero CRITICAL/HIGH.** Report:
    `generated-reports/harness-compat__393c0e__2026-07-20--13-27__audit.md`. All 5 Phase 0 parity
    invariants pass — vendor-neutrality (exit 0), root instruction surface, binding sync no-op
    (`git diff --quiet .opencode/ .amazonq/` exit 0 after regeneration), agent count parity 83 = 83,
    and full translation-map coverage for all 4 colors and all 5 distinct `model:` values.
    Specifically confirmed that the `plan-maker.md` Delivery Mode merge-authority edit propagated to
    `.opencode/` with zero re-sync drift. Phase 1 verified the Kiro succession claims against both
    cited primary sources by direct fetch (`[Verified]`/HIGH).
  - **Follow-up logged, not fixed here**: the checker's own spec header names the subcommand
    `vendor-audit`, but the live CLI is `repo-governance vendor validate`. Spec-text drift in the
    agent definition, not a repo defect — tracked separately.
  - `repo-rules-checker` result pending.

> **Pause Safety**: ose-public governance + config are complete, consistent, lint-clean, bindings
> synced, checker-green, and no stale orchestration reference remains. Safe to stop. To resume: re-run
> `generate:bindings` + the 4c grep + `repo-rules-checker`.

---

## Phase 5: ose-public PR Review Cycle & Merge (source of truth)

### Local Quality Gates (Before Push)

- [ ] [AI] Run affected lint: `npx nx affected -t lint`
- [ ] [AI] Run markdown lint: `npm run lint:md:fix`
- [ ] [AI] Run link + mermaid + headings validation (real invocations — no `rhino-cli:links:validation`,
      `rhino-cli:mermaid:validation`, or `rhino-cli:headings:hierarchy-validation` Nx targets exist;
      these are raw `cargo run` subcommands, per `.husky/pre-push` and
      `.github/workflows/main-ci.yml`'s `markdown-per-file`/`md-links` jobs):
      `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate --exclude plans/done --exclude apps/ayokoding-www/content --exclude apps/ose-www/content`,
      `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md mermaid validate --exclude apps/rhino-cli/tests/fixtures --exclude plans/done`,
      `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md heading-hierarchy validate`
- [ ] [AI] Fix ALL failures — including preexisting issues not caused by these changes
- [ ] [AI] Verify zero failures before pushing

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes
> (Root Cause Orientation). Commit preexisting fixes separately with appropriate conventional commit
> messages.

### Commit Guidelines

- [ ] [AI] Commit thematically with Conventional Commits (e.g., `docs(governance): adopt N+1
parallel-orchestration model`, `docs(governance): add no-destructive-git-operations convention`,
      `docs(governance): add worktree-and-artifact-cleanup convention`, `chore(bindings): regenerate
opencode + amazonq`) — acceptance: separate cohesive commits; no `git add -A` (explicit paths only)

### PR & Post-Push CI Verification

- [ ] [AI] Commit and push to origin `<pr-branch>` and open a draft PR against `main`
      — acceptance: PR created; CI triggered
- [ ] [AI] Monitor ALL GitHub Actions workflows (poll every 2 min; one `gh run view --json status,conclusion` per wakeup) — acceptance: all checks green
- [ ] [AI] If any CI check fails, fix root cause and push a follow-up commit; repeat until green

### PR-Review Maker→Fixer Cycle (default 3, CI-gated)

- [ ] [AI] Cycle 1: `pr-review-maker` reviews via the GitHub Reviews API → `pr-review-fixer` applies
      fixes and pushes → CI green — acceptance: review comments addressed; CI green
- [ ] [AI] Cycle 2: `pr-review-maker` → `pr-review-fixer` → CI green — acceptance: no new HIGH findings
- [ ] [AI] Cycle 3: `pr-review-maker` → `pr-review-fixer` → CI green — acceptance: clean review; CI green
- [ ] [AI] Merge the ose-public PR to `main` once **all five** hardened merge preconditions (Delta 8 +
      the 0-CRITICAL/0-HIGH addendum) hold — (a) 3 `pr-review-maker`→`pr-review-fixer` cycles complete,
      (b) **0 CRITICAL + 0 HIGH findings outstanding**, (c) branch **up-to-date with latest
      `origin/main`** (if behind, bring forward non-destructively: `git fetch origin && git merge
--ff-only origin/main` or a forward merge — NEVER `reset --hard`/force), (d) all PR quality gates
      green, (e) **the Delta 11 surface-conditional tester gates have been run and their defect findings
      resolved** — for THIS PR the surface is neither UI nor API, so record the explicit exemption in the
      PR description rather than leaving it implicit. `[AI]` merges per Delta 12's default (DD-10
      records the pre-Delta-12 authorization; see its bootstrap-timing note) — acceptance:
      a single `gh pr view --json reviewDecision,mergeStateStatus,body` call shows the branch current
      and mergeable, the review decision clean, and the PR body carrying the Delta-11 gate line
      (run-and-resolved, or explicit exempt); that output plus the review-cycle record show all five
      preconditions (a)-(e) satisfied; and the PR is merged
- [ ] [AI] Since `main-ci.yml` is now schedule-only, trigger a confirmation run via
      `gh workflow run main-ci.yml` (or `workflow_dispatch`) and verify green — acceptance: dispatched main-ci run concludes success

### Phase 5 Gate

> All checks below must pass before starting Phases 6 & 7.

- [ ] [AI] ose-public PR merged; the three review cycles completed; branch was up-to-date with `origin/main` at merge
- [ ] [AI] A `workflow_dispatch` main-ci run on `main` concluded green (main-ci no longer auto-runs on push)
- [ ] [AI] Post-merge grep on `main` confirms the N+1 model + two new conventions are present

> **Pause Safety**: ose-public is the merged source of truth; primer/infra not yet touched. Safe to
> stop. To resume: checkout `main`, confirm the governance blocks, then start propagation.

---

## Phase 6: Propagate to ose-primer (parallel with Phase 7)

> Runs in a dedicated `ose-primer` worktree, in parallel with Phase 7 (dogfooding N+1: 2 parallel units).

- [ ] [AI] **Confirm the sibling's repo topology BEFORE anything else** —
      `git -C ~/ose-projects/ose-primer rev-parse --is-bare-repository`
      — acceptance: prints `true`. **`ose-primer` is a BARE repo** (verified 2026-07-19): it has no
      top-level working tree, so `git -C ~/ose-projects/ose-primer status` fails with
      `fatal: this operation must be run in a work tree`. All file work happens inside a worktree.
      If this prints `false`, the topology changed — STOP and re-derive the commands below rather
      than assuming. See [Worktree Toolchain Initialization](../../../repo-governance/development/workflow/worktree-setup.md)
      §Sibling-Repo Relative Paths From Inside a Worktree, which records a real prior incident of
      silent stale-content propagation in a structurally identical tri-repo plan.
- [ ] [AI] Fetch and provision the worktree at the repo-local `worktrees/<name>/` path:
      `git -C ~/ose-projects/ose-primer fetch origin main` then
      `git -C ~/ose-projects/ose-primer worktree add worktrees/parallel-orchestration-shared-machine-governance -b parallel-orchestration-shared-machine-governance origin/main`
      — acceptance: `git -C ~/ose-projects/ose-primer worktree list` shows the new worktree
      at `~/ose-projects/ose-primer/worktrees/parallel-orchestration-shared-machine-governance`, and
      `git -C <primer-worktree> rev-parse HEAD` equals `git -C ~/ose-projects/ose-primer rev-parse origin/main`
      (proves it is branched from the LATEST origin/main, not a stale local ref)
- [ ] [AI] Set `<primer-worktree>` = `~/ose-projects/ose-primer/worktrees/parallel-orchestration-shared-machine-governance`
      for every subsequent step in this phase; run `npm install && npm run doctor -- --fix` **inside
      that worktree** (`cd` into it — do not rely on the shell's inherited working directory)
      — acceptance: `git -C <primer-worktree> status --porcelain` is empty; toolchain converged
- [ ] [AI] Apply the identical rule text from ose-public: N+1 + DAG + background-slot preference +
      status cadence + PR-merge preconditions concurrency edits, the two new convention files, the
      same-machine assumption, the vendor-neutral capability-gated paragraph, and index/workflow wiring
      — acceptance: `diff` of the governance blocks vs. merged ose-public shows only path-relative
      differences, no substantive divergence
- [ ] [AI] Apply the swept agents/skills/workflows updates to match ose-public — **ALL SEVEN**
      `workflows/plan/*` files (`README.md`, `plan-execution.md`, `plan-planning.md`,
      `plan-quality-gate.md`, `multi-plans-execution.md`, `plan-multi-repo-parity-planning.md`,
      `plan-multi-repo-parity-planning-and-execution.md`) **plus** the repo-wide `max-concurrency` set
      (preserving `web-ux-test-fixing-planning.md` at `Default 1`) — acceptance: the repo-wide
      superseded-cap grep returns zero hits in the ose-primer worktree
- [ ] [AI] Port the Delta 11 surface-conditional gate: create ose-primer
      `repo-governance/workflows/api/api-quality-gate.md` + `api/README.md` (byte-equivalent modulo
      path-relative links), register `api/` in `workflows/README.md`, and wire the rule into
      `plan/plan-execution.md`, `plan/plan-planning.md`, `pr/pr-review-quality-gate.md`, and
      `development/quality/user-facing-delivery-hardening.md` — acceptance:
      `test -f repo-governance/workflows/api/api-quality-gate.md` exits 0 and the three wiring files
      each contain `api-quality-gate`
  - _Suggested executor: `repo-workflow-maker`_
- [ ] [AI] Edit ose-primer `.github/workflows/main-ci.yml`: same schedule-only trigger
      (`cron: "0 5,11,17,23 * * *"` + `workflow_dispatch`; remove `push`) — acceptance:
      `actionlint` exits 0; no `push:` trigger remains
- [ ] [AI] Regenerate bindings: `npm run generate:bindings`; run link/markdown/vendor-audit gates
      — acceptance: exit 0; bindings synced
- [ ] [AI] Confirm no `apps/rhino-cli/**` surface changed (byte-identity guardrail):
      `git -C <primer-worktree> status --porcelain apps/rhino-cli` — acceptance: empty output
- [ ] [AI] Commit with explicit paths (never `git add -A` — the sibling repos carry unrelated WIP):
      `git -C <primer-worktree> add <explicit paths> && git -C <primer-worktree> commit`
      — acceptance: `git -C <primer-worktree> status --porcelain` shows no unintended files staged
- [ ] [AI] Push to the ose-primer PR branch: `git -C <primer-worktree> push origin <branch>`
      — acceptance: push succeeds; pre-push gates exit 0
- [ ] [AI] Open the draft PR: `gh pr create --repo <ose-primer> --draft`
      — acceptance: PR URL returned; PR shows as draft
- [ ] [AI] Drive PR gates green: `gh pr checks <pr> --watch` (poll every 2 min, never `gh run watch`)
      — acceptance: all required checks report success

### PR-Review Maker→Fixer Cycle (default 3, CI-gated)

- [ ] [AI] Cycle 1: `pr-review-maker` reviews the ose-primer PR via the GitHub Reviews API →
      `pr-review-fixer` applies fixes and pushes → CI green — acceptance: review comments addressed;
      CI green
- [ ] [AI] Cycle 2: `pr-review-maker` → `pr-review-fixer` → CI green — acceptance: no new HIGH findings
- [ ] [AI] Cycle 3: `pr-review-maker` → `pr-review-fixer` → CI green — acceptance: clean review; CI green
- [ ] [AI] Merge the ose-primer PR once **all five** hardened merge preconditions hold — (a) 3
      `pr-review-maker`→`pr-review-fixer` cycles complete, (b) **0 CRITICAL + 0 HIGH findings
      outstanding**, (c) branch up-to-date with `origin/main` via non-destructive forward update,
      (d) all PR quality gates green, (e) **the Delta 11 surface-conditional tester gates have been run
      and their defect findings resolved** — for THIS PR the surface is neither UI nor API, so record
      the explicit exemption in the PR description rather than leaving it implicit; then merge (`[AI]`
      merges per Delta 12's default; DD-10 records the pre-Delta-12 authorization and its
      bootstrap-timing note) — acceptance: PR merged; **0 CRITICAL + 0 HIGH confirmed
      outstanding-free**; branch was current at merge; the PR body contains the Delta-11 gate line
      (run-and-resolved, or explicit exempt)

### Phase 6 Gate

> All checks below must pass before Knowledge Capture (jointly with Phase 7).

- [ ] [AI] ose-primer PR merged; PR gates were green; governance blocks parity-match ose-public
- [ ] [AI] ose-primer `main-ci.yml` is schedule + dispatch only (`actionlint` green); a dispatched run concluded green

> **Pause Safety**: ose-primer matches the ose-public source of truth and is merged. Safe to stop. To
> resume: re-run the parity `diff` against ose-public `main`.

---

## Phase 7: Propagate to ose-infra (parallel with Phase 6)

> Runs in a dedicated `ose-infra` worktree, in parallel with Phase 6.

- [ ] [AI] **Confirm the sibling's repo topology BEFORE anything else** —
      `git -C ~/ose-projects/ose-infra rev-parse --is-bare-repository`
      — acceptance: prints `true`. **`ose-infra` is a BARE repo** (verified 2026-07-19): it has no
      top-level working tree, so `git -C ~/ose-projects/ose-infra status` fails with
      `fatal: this operation must be run in a work tree`. All file work happens inside a worktree.
      Note this repo's topology has CHANGED before (it was non-bare on 2026-07-02), so treat the
      check as live state — if it prints `false`, STOP and re-derive the commands below.
      See [Worktree Toolchain Initialization](../../../repo-governance/development/workflow/worktree-setup.md)
      §Sibling-Repo Relative Paths From Inside a Worktree.
- [ ] [AI] Fetch and provision the worktree at the repo-local `worktrees/<name>/` path:
      `git -C ~/ose-projects/ose-infra fetch origin main` then
      `git -C ~/ose-projects/ose-infra worktree add worktrees/parallel-orchestration-shared-machine-governance -b parallel-orchestration-shared-machine-governance origin/main`
      — acceptance: `git -C ~/ose-projects/ose-infra worktree list` shows the new worktree
      at `~/ose-projects/ose-infra/worktrees/parallel-orchestration-shared-machine-governance`, and
      `git -C <infra-worktree> rev-parse HEAD` equals `git -C ~/ose-projects/ose-infra rev-parse origin/main`
- [ ] [AI] Set `<infra-worktree>` = `~/ose-projects/ose-infra/worktrees/parallel-orchestration-shared-machine-governance`
      for every subsequent step in this phase; run `npm install && npm run doctor -- --fix` **inside
      that worktree** (`cd` into it — do not rely on the shell's inherited working directory)
      — acceptance: `git -C <infra-worktree> status --porcelain` is empty; toolchain converged
- [ ] [AI] Apply the identical rule text from ose-public: N+1 + DAG + background-slot preference +
      status cadence + PR-merge preconditions edits, the two new convention files, the same-machine
      assumption, the vendor-neutral capability-gated paragraph, and index/workflow wiring — acceptance:
      `diff` of the governance blocks vs. merged ose-public shows only path-relative differences
- [ ] [AI] Apply the swept agents/skills/workflows updates to match ose-public — **ALL SEVEN**
      `workflows/plan/*` files **plus** the repo-wide `max-concurrency` set (preserving
      `web-ux-test-fixing-planning.md` at `Default 1`) — acceptance: the repo-wide superseded-cap grep
      returns zero hits in the ose-infra worktree
- [ ] [AI] Port the Delta 11 surface-conditional gate: create ose-infra
      `repo-governance/workflows/api/api-quality-gate.md` + `api/README.md`, register `api/` in
      `workflows/README.md`, and wire the rule into `plan/plan-execution.md`, `plan/plan-planning.md`,
      `pr/pr-review-quality-gate.md`, and `development/quality/user-facing-delivery-hardening.md`
      — acceptance: `test -f repo-governance/workflows/api/api-quality-gate.md` exits 0 and the three
      wiring files each contain `api-quality-gate`
  - _Suggested executor: `repo-workflow-maker`_
- [ ] [AI] Edit ose-infra `.github/workflows/main-ci.yml`: same schedule-only trigger
      (`cron: "0 5,11,17,23 * * *"` + `workflow_dispatch`; remove `push`) while KEEPING ose-infra's
      existing `coralpolyp` jobs unchanged — acceptance: `actionlint` exits 0; no `push:` trigger
      remains; `coralpolyp` jobs still present
- [ ] [AI] Regenerate bindings: `npm run generate:bindings`; run link/markdown/vendor-audit gates
      — acceptance: exit 0; bindings synced. **Repo-relevance guardrail**: keep infra-private content in
      ose-infra only; do NOT cross-route it into the public governance text
- [ ] [AI] Confirm no `apps/rhino-cli/**` surface changed (byte-identity guardrail):
      `git -C <infra-worktree> status --porcelain apps/rhino-cli` — acceptance: empty output
- [ ] [AI] Commit with explicit paths (never `git add -A` — the sibling repos carry unrelated WIP):
      `git -C <infra-worktree> add <explicit paths> && git -C <infra-worktree> commit`
      — acceptance: `git -C <infra-worktree> status --porcelain` shows no unintended files staged
- [ ] [AI] Push to the ose-infra PR branch: `git -C <infra-worktree> push origin <branch>`
      — acceptance: push succeeds; pre-push gates exit 0
- [ ] [AI] Open the draft PR: `gh pr create --repo <ose-infra> --draft`
      — acceptance: PR URL returned; PR shows as draft
- [ ] [AI] Drive PR gates green: `gh pr checks <pr> --watch` (poll every 2 min, never `gh run watch`)
      — acceptance: all required checks report success

### PR-Review Maker→Fixer Cycle (default 3, CI-gated)

- [ ] [AI] Cycle 1: `pr-review-maker` reviews the ose-infra PR via the GitHub Reviews API →
      `pr-review-fixer` applies fixes and pushes → CI green — acceptance: review comments addressed;
      CI green
- [ ] [AI] Cycle 2: `pr-review-maker` → `pr-review-fixer` → CI green — acceptance: no new HIGH findings
- [ ] [AI] Cycle 3: `pr-review-maker` → `pr-review-fixer` → CI green — acceptance: clean review; CI green
- [ ] [AI] Merge the ose-infra PR once **all five** hardened merge preconditions hold — (a) 3
      `pr-review-maker`→`pr-review-fixer` cycles complete, (b) **0 CRITICAL + 0 HIGH findings
      outstanding**, (c) branch up-to-date with `origin/main` via non-destructive forward update,
      (d) all PR quality gates green, (e) **the Delta 11 surface-conditional tester gates have been run
      and their defect findings resolved** — for THIS PR the surface is neither UI nor API, so record
      the explicit exemption in the PR description rather than leaving it implicit; then merge (`[AI]`
      merges per Delta 12's default; DD-10 records the pre-Delta-12 authorization and its
      bootstrap-timing note) — acceptance: PR merged; **0 CRITICAL + 0 HIGH confirmed
      outstanding-free**; branch was current at merge; the PR body contains the Delta-11 gate line
      (run-and-resolved, or explicit exempt)

### Phase 7 Gate

> All checks below must pass before Knowledge Capture (jointly with Phase 6).

- [ ] [AI] ose-infra PR merged; PR gates were green; governance blocks parity-match ose-public
- [ ] [AI] ose-infra `main-ci.yml` is schedule + dispatch only (`actionlint` green) with `coralpolyp` jobs intact

> **Pause Safety**: ose-infra matches the ose-public source of truth and is merged. Safe to stop. To
> resume: re-run the parity `diff` against ose-public `main`.

---

## Phase 8: Knowledge Capture

> _Triage every surviving `learnings.md` entry before archival. See the
> [Knowledge Capture Convention](../../../repo-governance/development/quality/knowledge-capture.md)._

- [ ] [AI] Apply the litmus test to every `learnings.md` entry — keep only if a durable surface would
      catch this automatically next time; discard the rest with a one-line reason — acceptance: every entry has a route or a discard reason
- [ ] [AI] Apply the **secret/sensitivity gate** — sanitize any secret/credential/private hostname to
      a `<placeholder>` token, or discard if unsanitizable — acceptance: `learnings.md` contains no raw secret
- [ ] [AI] Apply the **repo-relevance gate** — infra-private content stays in `ose-infra` only and is
      never cross-routed into `ose-public`/`ose-primer`; public-governance content may propagate via
      the existing parity loop — acceptance: no infra-private content in this repo's routed output
- [ ] [AI] Route each surviving learning to exactly one durable home per the open-ended rubric;
      **code-homed** learnings (`apps/`, `libs/`, tests) are ALWAYS filed as a separate
      `plans/backlog/<slug>/` plan, NEVER landed inline — acceptance: every entry records its terminal routing state
- [ ] [AI] If no generalizable learning surfaced, record `No generalizable learnings — <reason>` in
      `learnings.md` — acceptance: `learnings.md` is never silently empty

### Phase 8 Gate

> All checks below must pass before the Cleanup gate.

- [ ] [AI] Every `learnings.md` entry is terminal (routed inline, filed as backlog, or discarded with reason), or the explicit "none" escape is present
- [ ] [AI] No code-homed learning landed inline in this plan's own commits/PRs

> **Pause Safety**: `learnings.md` is fully triaged; nothing depends on querying it later. Safe to
> stop. To resume: re-read `learnings.md` and confirm every entry is terminal.

---

## Phase 9: Cleanup Gate (self-scoped, non-destructive to others)

> Dogfoods the new worktree-and-artifact-cleanup convention. Non-destructive to any other actor.

- [ ] [AI] Enumerate the worktrees THIS plan created (ose-public, ose-primer, ose-infra) and confirm
      each is merged and no other session/process is using it (`git worktree list` per repo; check
      for active processes) — acceptance: each target worktree confirmed self-created + idle
- [ ] [AI] Remove only this plan's own worktrees with the non-forced command
      `git worktree remove <path>` (NEVER `--force`, NEVER a worktree you did not create) — acceptance: only this plan's worktrees removed; others intact
- [ ] [AI] Run `git worktree prune` in each of the three repos after the removals — acceptance: exits 0;
      `git worktree list` shows no stale administrative entries for this plan's removed paths
- [ ] [AI] Delete this plan's own **local** branches — in this plan's case, one per repo (Phases 0-5
      are one inseparable PR for ose-public; Phase 6 and Phase 7 are each a single PR) — only after confirming
      MERGED via `gh pr list --head <branch> --state all --json number,state,mergedAt` — use
      `git branch -d` (NEVER `git branch -D`); if `-d` refuses on a PR-MERGED branch, confirm the
      content landed via `git log origin/main..<branch>` before deleting with a stated reason —
      acceptance: only this plan's merged branches deleted; every other local branch still listed by
      `git branch --list` in each repo
- [ ] [AI] Delete this plan's own **remote** branches with `git push origin --delete <branch>` for the
      same MERGED-confirmed set only — acceptance: `git ls-remote --heads origin` no longer lists this
      plan's branches, and `main` plus every environment branch that repo defines is still listed
      (`ose-public` defines `prod-*`/`stag-*`; `ose-primer` and `ose-infra` define none today, so the
      check is vacuously satisfied there — confirm each repo's own set with `git branch -a` rather than
      assuming this exact pattern)
- [ ] [AI] Purge only the build artifacts THIS plan created (any `target/`, `dist/`, `.next/`, build
      caches produced inside this plan's worktrees), after verifying non-use — acceptance: self-created artifacts removed
- [ ] [AI] Explicitly SKIP the shared cargo `target/` and any shared cache other sessions depend on,
      and run no `git gc` / `git prune` on the object store (shared-machine serialization point) —
      acceptance: shared caches confirmed present and untouched; note recorded in `learnings.md`

### Phase 9 Gate

> All checks below must pass before Plan Archival.

- [ ] [AI] Only self-created, verified-idle worktrees/artifacts were removed; the shared cargo `target/` and all shared caches are intact
- [ ] [AI] Every branch this plan created is gone locally and on `origin` in all three repos, and every
      branch it did not create survives — acceptance: `git branch --list` and
      `git ls-remote --heads origin` per repo list none of this plan's branches and still list `main`
      plus all environment branches that repo defines (`prod-*`/`stag-*` for `ose-public`; `ose-primer`
      and `ose-infra` define no environment branches today — verified per repo, not assumed uniform)
- [ ] [AI] No destructive git operation and no whole-tree staging in any spelling (`git add -A`,
      `--all`, `git add .`, whole-tree `-u`, `git commit -a`) was used anywhere in this plan —
      acceptance: no commit authored by this plan contains a file outside its declared surface
      inventory; verify per repo with
      `git -C <repo> log --name-only --pretty=format:'--- %h %s' <baseline-sha>..origin/main`
      using that repo's Phase 0 plan-start baseline SHA (never `origin/main@{1}` — reflog-relative
      revisions resolve only where local reflog history exists and drift on every fetch), and confirm
      every listed path appears in the tech-docs.md Surface Inventory or is a plan-doc path under
      `plans/in-progress/parallel-orchestration-shared-machine-governance/`
- [ ] [AI] No gate was bypassed, skipped, weakened, or deferred anywhere in this plan; every failure
      encountered was root-caused, and any out-of-scope blocker is recorded in `learnings.md` with
      what was tried — acceptance:
      `git -C <repo> log --format=%B <baseline-sha>..origin/main` (that repo's Phase 0 baseline SHA)
      contains no `--no-verify` / `skip ci` / `[skip actions]` marker; every phase PR reports a passing
      rollup via `gh pr view <n> --json statusCheckRollup --jq '[.statusCheckRollup[].conclusion] | unique'`
      returning only `SUCCESS`/`NEUTRAL`/`SKIPPED`; and every `learnings.md` entry describing a blocker
      names what was tried

> **Pause Safety**: the shared disk is reclaimed of this plan's own artifacts only; every other
> actor's worktrees, WIP, and shared caches are untouched. Safe to stop. To resume: re-run
> `git worktree list` per repo and confirm state.

---

## Plan Archival

> This archival runs via direct push to `main` after all three repos' PRs (Phase 5/6/7) have merged,
> rather than being folded into any one delivering PR — a documented, authorized deviation for this
> tri-repo-propagation plan. See **DD-11** in `tech-docs.md` §Design decisions for the rationale, the
> authorizing context, and its explicit non-precedential scope.

- [ ] [AI] Verify ALL delivery checklist items are ticked
- [ ] [AI] Verify the Knowledge Capture phase is complete — every `learnings.md` entry terminal or the
      explicit "none" escape present; both safety gates applied
- [ ] [AI] Verify ALL quality gates pass (local + CI) across all three repos
- [ ] [AI] Verify the Cleanup gate ran non-destructively (self-scoped only; shared caches intact)
- [ ] [AI] Move: `git mv plans/in-progress/parallel-orchestration-shared-machine-governance/ plans/done/2026-07-19__parallel-orchestration-shared-machine-governance/` (use the completion date at archival time)
- [ ] [AI] Update `plans/in-progress/README.md` — remove the plan entry
- [ ] [AI] Update `plans/done/README.md` — add the entry with completion date
- [ ] [AI] Update any other READMEs that reference this plan
- [ ] [AI] Commit the archival (explicit paths): `chore(plans): move parallel-orchestration-shared-machine-governance to done`
