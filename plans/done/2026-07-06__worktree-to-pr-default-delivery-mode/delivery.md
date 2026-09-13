# Delivery Checklist — Worktree-to-PR Default Delivery Mode

> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.
>
> **Phase Gate** — every phase ends with a `### Phase N Gate` (must-pass verification) plus a
> `> **Pause Safety**:` note (the safe-to-stop state and the single command to resume). A phase is
> not complete until its gate is green; do not start phase N+1 while any gate check fails.
>
> **This plan's terminal trunk write is a `[HUMAN]` PR merge** (per the mode below). All
> git-mechanical work — worktree create, branch, commit, push, PR open, worktree remove — is `[AI]`.
> The single irreversible action (clicking Merge) is `[HUMAN]`.
>
> **PR-review loop** — every `*-to-pr` delivery runs the **PR-Review Maker→Fixer Cycle** (see the
> reusable procedure below) BEFORE the `[HUMAN]` merge. The loop (default 3 sequential cycles) is
> entirely `[AI]`. "Done" for the AI = N cycles complete + every comment answered + gates green +
> archival-in-PR (ose-public only) committed. The `[HUMAN]` merge sits **outside** that done-boundary.

## Worktree

Worktree path: `worktrees/worktree-to-pr-default-delivery-mode/`

Optional manual pre-provisioning (run from repo root):

```bash
claude --worktree worktree-to-pr-default-delivery-mode
```

The plan-execution Step 0 gate enters this worktree by default: it auto-provisions from the latest
`origin/main` when missing, syncs with `origin/main` before implementing, and prompts before deleting
the worktree after the plan is archived and pushed.

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) and
[Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

> This `## Worktree` section governs the **`ose-public`** worktree. The `ose-primer` and `ose-infra`
> replication phases provision their own worktrees at their own repo roots (see Phases 4 and 5).

## Delivery Mode

**Delivery Mode: `worktree-to-pr`** (the new default this plan establishes — dogfooded here).

- **Work location**: git worktree on a plan branch (`worktree-to-pr-default-delivery-mode`).
- **Integration target**: ONE Pull Request per repo, opened at the phase where that repo's work
  starts, targeting `main`.
- **Merge authority**: `[AI]` opens the PR, pushes every phase's commits to the PR branch (never to
  `main`), runs the PR-Review Maker→Fixer Cycle, and drives all local + CI gates to GREEN; the
  terminal **PR merge is `[HUMAN]`**, outside the AI done-boundary.
- **Three-repo sweep**: three worktrees + three PRs (one per repo), each reviewed + driven green by
  `[AI]` and merged by the human.

Precedence (mirrors work-branch precedence): invocation argument > this `## Delivery Mode` field >
default (`worktree-to-pr`).

### Ordering note — why ose-public finalizes LAST

The `ose-public` PR is opened at Phase 0 and stays **open** through Phase 6. Because the plan folder
lives only in `ose-public`, the **archival-in-PR** move (`plans/in-progress → plans/done`) must be
committed inside the ose-public PR; and the **Knowledge Capture** edits (Phase 6) may also land in the
ose-public PR. So `ose-primer` (Phase 4) and `ose-infra` (Phase 5) are delivered + merged first, then
Knowledge Capture runs (Phase 6), then the ose-public PR is finalized last (Phase 7) — review loop →
done (archival-in-PR committed) → `[HUMAN]` merge.

## PR-Review Maker→Fixer Cycle (reusable procedure)

> Referenced by every `*-to-pr` delivery phase (Phases 4, 5, 7). Full design + agent specs live in
> [`tech-docs.md` §PR-Review Maker→Fixer Cycle](./tech-docs.md#pr-review-makerfixer-cycle-design-spec)
> and the new workflow doc `repo-governance/workflows/pr/pr-review-quality-gate.md` (created in
> Phase 2). Run this loop against a PR AFTER its own local + CI gates are green and BEFORE the
> `[HUMAN]` merge. `N` defaults to **3** and cycles run **strictly sequentially** (a fresh
> `pr-review-maker` each cycle; `pr-review-fixer` answers every thread before the next cycle).

For cycle `i` in `1..N` (against the PR number `$PR` for the current repo):

- [ ] [AI] Invoke `pr-review-maker` on `$PR`: it reads the diff + plan context, posts inline review
      comments via the GitHub Reviews API (`gh api` / `gh api graphql`), applying its numeric
      confidence hard-filter (drop < 80), severity tags (CRITICAL/HIGH/MEDIUM/LOW), evidence citations,
      and scope/CI-gaming guards. — acceptance: `gh pr view $PR --json reviews` shows a new review for
      cycle `i` (or an explicit "no findings ≥ threshold" review that ends the loop early).
  - _Suggested executor: `pr-review-maker`_
- [ ] [AI] Invoke `pr-review-fixer` on `$PR`: it enumerates unresolved threads
      (`gh api graphql` `reviewThreads(isResolved:false)`), applies the 4-way triage (fix / reject with
      reason / defer with reason / clarify), pushes fixes to the PR branch, replies to EVERY thread,
      and calls `resolveReviewThread` only on threads it fixed or the maker accepts as resolved.
      — acceptance: `gh api graphql` reports **zero** `reviewThreads(isResolved:false)` authored by the
      maker for cycle `i`, and every such thread has at least one fixer reply.
  - _Suggested executor: `pr-review-fixer`_
- [ ] [AI] Re-run local gates + monitor CI on `$PR` after the fixer's push; fix at root + follow-up
      commit if red. — acceptance: `gh pr checks $PR` all green.

Loop exit: stop when either `N` cycles are complete OR a `pr-review-maker` cycle produces zero
findings at/above threshold (whichever comes first). Escalation: if the fixer rejects the same maker
finding across two consecutive cycles, surface it in the PR description as an unresolved
disagreement for the `[HUMAN]` reviewer to adjudicate (do not silently suppress).

**Cycle done-definition** (per `*-to-pr` PR): N cycles complete AND every inline comment answered
(fix or reasoned-reject/defer) AND `gh pr checks` green AND (ose-public only) archival-in-PR committed.
Only after this is the PR flipped to ready and handed to the `[HUMAN]` merge.

## Delivery Flow

```mermaid
%% Phase progression — ose-public content first, siblings delivered, KC, ose-public finalized last
stateDiagram-v2
  direction LR
  [*] --> Phase0
  Phase0: Phase 0 — baseline + open ose-public PR (stays open)
  Phase1: Phase 1 — ose-public conventions
  Phase2: Phase 2 — ose-public workflows + pr-review-cycle doc + loop wiring
  Phase3: Phase 3 — ose-public agents (incl. 2 review agents) + checkers + bindings
  Phase4: Phase 4 — ose-primer replicate + PR + review loop + [HUMAN] merge
  Phase5: Phase 5 — ose-infra replicate + PR + review loop + [HUMAN] merge
  Phase6: Phase 6 — Knowledge Capture (triage + route learnings)
  Phase7: Phase 7 — ose-public finalize (KC edits + archival-in-PR + review loop + [HUMAN] merge)
  Phase0 --> Phase1 --> Phase2 --> Phase3 --> Phase4 --> Phase5 --> Phase6 --> Phase7 --> [*]
```

---

## Phase 0: Environment Setup and Baseline

> _Executor: repo-setup-manager_
>
> All commands run from the `ose-public` root unless noted. This phase also opens the single
> `ose-public` PR (per `worktree-to-pr` mechanics — one PR per plan, opened at execution start). The
> ose-public PR stays **open** through Phase 6 and is finalized in Phase 7.

- [x] [AI] Provision the worktree from latest `origin/main` (from `ose-public` root):
      `git fetch origin && git worktree add -b worktree-to-pr-default-delivery-mode worktrees/worktree-to-pr-default-delivery-mode origin/main`
      — acceptance: `git worktree list` shows `worktrees/worktree-to-pr-default-delivery-mode` on branch `worktree-to-pr-default-delivery-mode`. Done: worktree created at HEAD `b3b6d18b7`.
- [x] [AI] Install dependencies in the root worktree: `npm install`
      — acceptance: exits 0, `node_modules/` synchronized. Done: 13/13 doctor tools OK, exit 0.
- [x] [AI] Converge the toolchain in the root worktree: `npm run doctor -- --fix`
      — acceptance: exits 0 with no unresolved drift. Done: "Nothing to fix — all tools are installed."
- [x] [AI] Establish the docs/governance baseline in the worktree:
      `npx nx affected -t typecheck lint test:quick specs:behavior:coverage` (and `npm run lint:md` if present)
      — acceptance: baseline pass/fail recorded; every preexisting failure documented. Done: 0 projects affected vs. `origin/main` (worktree HEAD == main, no drift).
- [x] [AI] Resolve all preexisting failures before proceeding
      — acceptance: no preexisting failures remain unresolved. Done: zero failures (zero affected projects).
- [x] [AI] Open the single draft PR for this plan (from the worktree):
      `gh pr create --draft --base main --head worktree-to-pr-default-delivery-mode --title "docs(governance): worktree-to-pr default delivery mode" --body "Establishes the worktree-to-pr default delivery mode, the four-mode vocabulary, and the pr-review maker→fixer cycle. Delivered via this PR (dogfooding). See plans/in-progress/worktree-to-pr-default-delivery-mode/."`
      — acceptance: `gh pr view --json number,isDraft` shows a draft PR number for this branch. Done: ose-public PR [#29](https://github.com/wahidyankf/ose-public/pull/29) (an empty marker commit was required first — GitHub refuses PR creation with zero commit diff).

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `npm install` exited 0 and `npm run doctor -- --fix` reports no unresolved drift.
- [x] [AI] `npx nx affected -t typecheck lint test:quick specs:behavior:coverage` baseline recorded and every
      preexisting failure resolved (zero unresolved).
- [x] [AI] `gh pr view --json number,state` returns an open draft PR for
      `worktree-to-pr-default-delivery-mode`. Confirmed: PR #29, `state: OPEN`, `isDraft: true`.

> **Pause Safety**: only the toolchain was verified, the baseline recorded, and an empty draft PR
> opened — no governance edits exist yet. Safe to stop indefinitely. To resume: re-run the baseline
> command and confirm the draft PR still exists (`gh pr view`).

---

## Phase 1: ose-public — Convention Layer

> All edits in the worktree; commits push to the PR branch, never to `main`.

- [x] [AI] Edit `repo-governance/conventions/structure/plans.md`: add a `## Delivery Mode` section
      (sibling to the existing `## Worktree` section) defining the four modes
      (`worktree-to-pr` [default], `worktree-to-origin-main`, `main-to-origin-main`, `main-to-pr`),
      each mode's three attributes (work location, integration target, merge authority), and the
      three-tier precedence (invocation argument > plan field > default).
      — acceptance: `grep -c "worktree-to-pr" repo-governance/conventions/structure/plans.md` ≥ 1 and
      all four mode names appear in the file.
  - _Suggested executor: `repo-rules-maker`_
  - **Done**: added `### Delivery Mode` as an H3 sibling of `### Worktree Specification` under
    `## Plan Contents` (the file has no literal H2 `## Worktree`, so this is the structurally
    accurate placement). `grep -c "worktree-to-pr" plans.md` = 5; all four mode names present.
- [x] [AI] Edit `repo-governance/conventions/structure/worktree-path.md`: cross-reference the delivery
      mode (a worktree is used by `worktree-to-pr` and `worktree-to-origin-main`); link to the new
      `## Delivery Mode` section in `plans.md`.
      — acceptance: `grep -c "Delivery Mode" repo-governance/conventions/structure/worktree-path.md` ≥ 1.
  - _Suggested executor: `repo-rules-maker`_
  - **Done**: added `## Relationship to Delivery Mode` section after `## Purpose`. `grep -c
"Delivery Mode" worktree-path.md` = 3.

### Local Quality Gates (Before Push)

- [x] [AI] Fix + verify markdown: `npm run lint:md:fix && npm run lint:md`
      — acceptance: exits 0, no violations.
  - **Done**: exits 0, 2249 files linted, 0 errors.
- [x] [AI] Validate mermaid/links/headings on changed docs:
      `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md mermaid validate --changed-only && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md heading-hierarchy validate`
      — acceptance: all three exit 0.
  - **Done**: mermaid validator's 4 reported failures are pre-existing negative-test fixtures under
    `apps/rhino-cli/tests/fixtures/state/` (unrelated to this diff, confirmed via `git diff
--name-only origin/main...HEAD`). Links validator caught one real regression (a forward
    reference to a Phase-2-only file) — fixed by converting to backtick prose; re-run confirmed
    zero broken links in both changed files. Heading-hierarchy clean.
- [x] [AI] Run affected gates: `npx nx affected -t typecheck lint test:quick specs:behavior:coverage`
      — acceptance: exits 0. **Fix ALL failures found — including preexisting issues not caused by
      these changes** (root-cause orientation).
  - **Done**: `NX No tasks were run` — both changed files are docs under `repo-governance/`, not
    owned by any Nx project, so the affected graph is empty. Exits 0.

### Commit + Push to PR branch

- [x] [AI] Commit thematically (Conventional Commits):
      `git commit -m "docs(governance): define delivery-mode vocabulary in plans + worktree-path conventions"`
      — acceptance: commit created on branch `worktree-to-pr-default-delivery-mode`.
  - **Done**: commit `9428548`.
- [x] [AI] Push to the PR branch (NOT `main`): `git push origin worktree-to-pr-default-delivery-mode`
      — acceptance: `gh pr view --json commits` shows the new commit on the PR.
  - **Done**: pushed `f31c7b074..9428548`; `gh pr view 29 --json headRefOid` confirms head =
    `9428548e7662df003e924b22be1ed1fb143d558f`.

### Post-Push CI Verification (on the PR)

- [x] [AI] Monitor CI on the PR (poll every ~2 min): `gh pr checks --watch` or
      `gh run list --branch worktree-to-pr-default-delivery-mode`
      — acceptance: all PR checks green; if any fail, fix at root and push a follow-up commit; repeat
      until green. Do NOT proceed while any PR check is red.
  - **Done**: all checks reached `pass` or `skipping` (expected for untouched .NET/Rust/TypeScript
    stacks) on commit `9428548`. No failures — no follow-up commit needed.

### Phase 1 Gate

> All checks below must pass before starting Phase 2.

- [x] [AI] `grep -l "worktree-to-pr" repo-governance/conventions/structure/plans.md` returns the file
      and all four mode names are present.
  - **Done**: confirmed above.
- [x] [AI] `gh pr checks` shows all checks passing for the PR after the Phase 1 push.
  - **Done**: `gh pr checks 29 --repo wahidyankf/ose-public` on head `9428548` — every check `pass`
    or `skipping`, none `pending`/`fail`.

> **Pause Safety**: convention-layer edits are committed and pushed to a green (still-draft) PR; `main`
> is untouched. Safe to stop. To resume: `git -C worktrees/worktree-to-pr-default-delivery-mode status`
> (clean) and `gh pr checks` (green).

---

## Phase 2: ose-public — Workflow Layer (incl. pr-review-cycle doc + loop wiring)

- [x] [AI] Edit `repo-governance/workflows/plan/plan-execution.md`:
      (a) Step 0 — add delivery-mode selection with the three-tier precedence alongside the existing
      work-branch precedence; (b) Steps 2b/2c — under `worktree-to-pr` the push target is the PR
      branch and CI is monitored on the PR; (c) Step 8 finalization — wire the **PR-Review
      Maker→Fixer Cycle** (default 3 sequential cycles) as a gate before the `[HUMAN]` merge, define
      the `*-to-pr` **done-definition** (N cycles + every comment answered + gates green +
      archival-in-PR), and specify **archival-in-PR** (the `plans/in-progress → plans/done` move is
      committed INSIDE the delivering PR) with worktree cleanup AFTER merge. Keep the other three
      modes documented.
      — acceptance: `grep -c "worktree-to-pr" repo-governance/workflows/plan/plan-execution.md` ≥ 1,
      the precedence phrase (invocation > plan > default) appears near Step 0, and Step 8 references
      both the review cycle and archival-in-PR.
  - _Suggested executor: `repo-workflow-maker`_
- [x] [AI] Create the new workflow doc
      `repo-governance/workflows/pr/pr-review-quality-gate.md` _(New file; new `pr/` workflow
      subdir)_ documenting the loop: participants (`pr-review-maker`, `pr-review-fixer`), the strictly
      sequential N-cycle algorithm (default N=3), the GitHub Reviews API mechanics
      (`gh api` / `gh api graphql`, `reviewThreads(isResolved:false)`, `resolveReviewThread`,
      `gh pr view <PR> --json headRefOid`), the loop-exit + escalation rules, and the applicability
      (every `*-to-pr` mode). Link it from `plan-execution.md` Step 8 and from the workflows index
      `repo-governance/workflows/README.md`.
      — acceptance: `test -f repo-governance/workflows/pr/pr-review-quality-gate.md` and
      `grep -c "pr-review-maker" repo-governance/workflows/pr/pr-review-quality-gate.md` ≥ 1 and
      the workflows index links the new doc.
  - _Suggested executor: `repo-workflow-maker`_
- [x] [AI] Edit `repo-governance/development/workflow/trunk-based-development.md`: reconcile the "all
      development on `main`" posture (decision 6) — frame worktree → PR via short-lived plan branches
      as a valid TBD flavor; update `## Default Push and Worktree Execution` so the default is
      short-lived-branch-via-PR while preserving TBD spirit. Honor the maintenance note listing the
      four duplication sites.
      — acceptance: `grep -ci "short-lived" repo-governance/development/workflow/trunk-based-development.md` ≥ 1
      and the doc no longer states direct-push-to-main as the sole default.
  - _Suggested executor: `repo-rules-maker`_
- [x] [AI] Edit `repo-governance/development/workflow/git-push-default.md` and
      `repo-governance/development/workflow/git-push-safety.md`: reconcile push semantics — default
      integration target is a PR branch; direct push remains available via `*-to-origin-main` modes;
      keep force-push/linear-history rules correct for plan branches.
      — acceptance: both files reference the PR-branch default and the `*-to-origin-main` modes.
  - _Suggested executor: `repo-rules-maker`_
- [x] [AI] Edit `repo-governance/development/workflow/pr-merge-protocol.md`: document the
      `worktree-to-pr` terminal step — `[AI]` runs the PR-Review Maker→Fixer Cycle and ensures all
      gates (local + CI) are GREEN and the done-definition is met; `[HUMAN]` merge performs the trunk
      write, outside the AI done-boundary.
      — acceptance: `grep -ci "worktree-to-pr" repo-governance/development/workflow/pr-merge-protocol.md` ≥ 1
      and the doc references the review cycle + done-boundary.
  - _Suggested executor: `repo-rules-maker`_
- [x] [AI] Edit `repo-governance/workflows/plan/plan-planning.md`,
      `repo-governance/workflows/plan/plan-quality-gate.md`,
      `repo-governance/workflows/plan/plan-multi-repo-parity-planning.md`, and
      `repo-governance/workflows/plan/plan-multi-repo-parity-planning-and-execution.md`: reference
      delivery-mode selection and the pr-review cycle where each touches
      worktrees/pushing/plan-structure validation.
      — acceptance: `grep -lc "Delivery Mode" repo-governance/workflows/plan/plan-planning.md repo-governance/workflows/plan/plan-quality-gate.md repo-governance/workflows/plan/plan-multi-repo-parity-planning.md repo-governance/workflows/plan/plan-multi-repo-parity-planning-and-execution.md`
      returns all four files.
  - _Suggested executor: `repo-workflow-maker`_

### Local Quality Gates (Before Push)

- [x] [AI] `npm run lint:md:fix && npm run lint:md` — acceptance: exits 0.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md mermaid validate --changed-only && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md heading-hierarchy validate`
      — acceptance: all exit 0.
- [x] [AI] `npx nx affected -t typecheck lint test:quick specs:behavior:coverage` — acceptance: exits 0.
      **Fix ALL failures, including preexisting.**

### Commit + Push to PR branch

- [x] [AI] Commit thematically:
      `git commit -m "docs(workflow): add delivery-mode selection + pr-review maker→fixer cycle to plan-execution; reconcile TBD/push semantics"`
      — acceptance: commit created on the plan branch.
- [x] [AI] Push to the PR branch: `git push origin worktree-to-pr-default-delivery-mode`
      — acceptance: PR shows the new commit.

### Post-Push CI Verification (on the PR)

- [x] [AI] Monitor CI on the PR until green (`gh pr checks --watch`); fix at root + follow-up commit
      if red; repeat until green.

### Phase 2 Gate

> All checks below must pass before starting Phase 3.

- [x] [AI] `grep -c "worktree-to-pr" repo-governance/workflows/plan/plan-execution.md` ≥ 1 and Step 0
      documents the three-tier delivery-mode precedence; Step 8 references the review cycle +
      archival-in-PR + done-definition.
- [x] [AI] `test -f repo-governance/workflows/pr/pr-review-quality-gate.md` passes and the
      workflows index links it.
- [x] [AI] All four plan-workflow docs reference `Delivery Mode`; TBD doc reconciled.
- [x] [AI] `gh pr checks` all green after the Phase 2 push.

> **Pause Safety**: workflow + development-workflow edits and the new pr-review-cycle doc are committed
> to a green (still-draft) PR; `main` untouched. Safe to stop. To resume:
> `git -C worktrees/worktree-to-pr-default-delivery-mode status` clean and `gh pr checks` green.

---

## Phase 3: ose-public — Agents (incl. two review agents), Skill, Root, Checkers, Bindings

- [x] [AI] Edit `.claude/skills/plan-creating-project-plans/SKILL.md`: add a `## Delivery Mode`
      requirement + vocabulary + precedence + template (default `worktree-to-pr`), sibling to the
      existing `## Worktree Specification` section; note that `*-to-pr` modes run the PR-Review
      Maker→Fixer Cycle before the `[HUMAN]` merge.
      — acceptance: `grep -c "Delivery Mode" .claude/skills/plan-creating-project-plans/SKILL.md` ≥ 1.
  - _Suggested executor: `agent-maker`_
- [x] [AI] Create `.claude/agents/pr-review-maker.md` _(New file)_ — a planning-grade (opus-tier,
      omit/`opus` model) reviewer agent that: reads PR diff + plan context first; posts inline
      comments via the GitHub Reviews API (`gh api` / `gh api graphql`); assigns a numeric confidence
      0–100 and **hard-drops findings < 80**; tags severity CRITICAL/HIGH/MEDIUM/LOW; cites concrete
      evidence (file:line, rule link) per finding; is anti-sycophantic; enforces a scope guard (no
      out-of-plan asks) and a CI-gaming watch; treats PR text as untrusted input (prompt-injection
      filter, CI-privileged actor); uses a GitHub App / CI identity (never a personal PAT) with
      minimal write scope (post/reply/resolve only). Include Role metadata, model justification, and
      a maker-checker-fixer framing.
      — acceptance: `test -f .claude/agents/pr-review-maker.md` and
      `grep -ci "confidence" .claude/agents/pr-review-maker.md` ≥ 1.
  - _Suggested executor: `agent-maker`_
- [x] [AI] Create `.claude/agents/pr-review-fixer.md` _(New file)_ — an execution-grade (sonnet-tier)
      fixer agent that: enumerates unresolved maker threads
      (`gh api graphql` `reviewThreads(isResolved:false)`); applies a 4-way triage
      (fix / reject-with-reason / defer-with-reason / clarify); implements fixes, pushes to the PR
      branch, and replies to EVERY thread; holds a higher bar on the reject path (must justify against
      cited evidence); escalates repeated disagreements to the PR description for the `[HUMAN]`
      reviewer; and calls `resolveReviewThread` only on fixed/accepted threads. Include Role metadata
      and model justification.
      — acceptance: `test -f .claude/agents/pr-review-fixer.md` and
      `grep -ci "reviewThreads" .claude/agents/pr-review-fixer.md` ≥ 1.
  - _Suggested executor: `agent-maker`_
- [x] [AI] Edit `.claude/agents/plan-maker.md`: instruct authoring of the `## Delivery Mode` section
      (default `worktree-to-pr`) and, for `*-to-pr` plans, emitting the PR-Review Maker→Fixer Cycle
      steps before the `[HUMAN]` merge.
      — acceptance: `grep -c "Delivery Mode" .claude/agents/plan-maker.md` ≥ 1.
  - _Suggested executor: `agent-maker`_
- [x] [AI] Edit `.claude/agents/plan-checker.md`: validate `## Delivery Mode` presence + valid
      vocabulary (closed enum); for `*-to-pr` plans, validate the plan emits the review-cycle steps +
      done-definition + archival-in-PR; flag missing/invalid as findings.
      — acceptance: `grep -c "Delivery Mode" .claude/agents/plan-checker.md` ≥ 1 and
      `grep -ci "pr-review" .claude/agents/plan-checker.md` ≥ 1.
  - _Suggested executor: `agent-maker`_
- [x] [AI] Edit `.claude/agents/plan-execution-checker.md`: validate delivery matched the declared
      mode; for `worktree-to-pr`, validate the PR exists, its gates are green, the **review loop ran**
      (N cycles present, every maker thread answered/resolved), and **archival-in-PR** is present in
      the delivering PR (ose-public).
      — acceptance: `grep -c "Delivery Mode" .claude/agents/plan-execution-checker.md` ≥ 1 and
      `grep -ci "review loop\|reviewThreads\|archival-in-PR" .claude/agents/plan-execution-checker.md` ≥ 1.
  - _Suggested executor: `agent-maker`_
- [x] [AI] Edit `.claude/agents/plan-fixer.md`: scaffold a missing `## Delivery Mode` section and, for
      `*-to-pr` plans, scaffold the missing PR-Review Maker→Fixer Cycle steps.
      — acceptance: `grep -c "Delivery Mode" .claude/agents/plan-fixer.md` ≥ 1.
  - _Suggested executor: `agent-maker`_
- [x] [AI] Update the agent catalog `.claude/agents/README.md` and the `AGENTS.md` AI-Agents section
      to list `pr-review-maker` + `pr-review-fixer` under an appropriate role grouping.
      — acceptance: `grep -c "pr-review-maker" .claude/agents/README.md AGENTS.md` shows both files
      reference the new agents.
- [x] [AI] Edit `AGENTS.md` (Git Workflow section): update the delivery/TBD description to reflect the
      worktree → PR default, name the four modes, and mention the pr-review cycle for `*-to-pr` modes.
      — acceptance: `grep -c "worktree-to-pr" AGENTS.md` ≥ 1.
- [x] [AI] Edit `CLAUDE.md`: align the Claude-specific binding text with the worktree → PR default
      (note `CLAUDE.md` imports `AGENTS.md`).
      — acceptance: delivery description in `CLAUDE.md` is consistent with `AGENTS.md` (no stale
      "direct push to main is the default" wording remains).
- [x] [AI] Re-sync bindings after the `.claude/**` edits: `npm run generate:bindings`
      — acceptance: exits 0 and `git status --porcelain .opencode .amazonq` shows only intended,
      staged regenerated changes (including the two new agents' `.opencode`/`.amazonq` mirrors; no
      unexplained drift).

### Local Quality Gates (Before Push)

- [x] [AI] `npm run lint:md:fix && npm run lint:md` — acceptance: exits 0.
- [x] [AI] Validate bindings sync is clean: `npm run validate:claude && npm run validate:opencode`
      (or the repo's binding-validation targets) — acceptance: exits 0, no sync drift reported (the
      two new agents appear in `.opencode`/`.amazonq`).
- [x] [AI] `npx nx affected -t typecheck lint test:quick specs:behavior:coverage` — acceptance: exits 0.
      **Fix ALL failures, including preexisting.**

### Commit + Push to PR branch

- [x] [AI] Commit thematically (split agent/skill edits from generated bindings if cleaner):
      `git commit -m "docs(agents): add pr-review maker/fixer agents + require Delivery Mode in plan agents/skill + root instructions"`
      then `git commit -m "chore(bindings): re-sync .opencode/.amazonq for delivery-mode + review agents"`
      — acceptance: commits created on the plan branch.
- [x] [AI] Push to the PR branch: `git push origin worktree-to-pr-default-delivery-mode`
      — acceptance: PR shows the new commits.

### Post-Push CI Verification (on the PR)

- [x] [AI] Monitor CI on the PR until green; fix at root + follow-up commit if red; repeat.

### Phase 3 Gate

> All checks below must pass before starting Phase 4.

- [x] [AI] `test -f .claude/agents/pr-review-maker.md` and `test -f .claude/agents/pr-review-fixer.md`
      both pass; both are listed in `.claude/agents/README.md` + `AGENTS.md`.
- [x] [AI] All five `.claude/agents/plan-*.md` + the plan-creating SKILL reference `Delivery Mode`;
      plan-checker + plan-execution-checker reference the review loop + archival-in-PR;
      `AGENTS.md` references `worktree-to-pr`.
- [x] [AI] `npm run generate:bindings` leaves the tree clean (`git status --porcelain .opencode .amazonq`
      empty after staging) and binding validation passes (new agents mirrored).
- [x] [AI] `gh pr checks` all green after the Phase 3 push.

> **Pause Safety**: all ose-public content edits — including the two review agents and checker
> enforcement — are committed to a green (still-draft) PR with synced bindings; `main` untouched. The
> ose-public PR remains open (finalized in Phase 7). Safe to stop. To resume: `gh pr checks` green and
> `git status` clean, then begin Phase 4.

---

## Phase 4: ose-primer — Replicate + Deliver via worktree-to-pr (review loop → [HUMAN] merge)

> Repo root: `~/ose-projects/ose-primer` [Repo-grounded]. Apply the conceptually identical
> change (not necessarily byte-identical — governance prose is not under the rhino-cli byte-identity
> mandate). Use the ose-public PR branch files as the canonical reference. Primer's PR carries **no
> archival-in-PR** (the plan folder lives only in ose-public), so its done-definition = review cycles
>
> - comments answered + gates green.

- [x] [AI] Provision the primer worktree from latest `origin/main` (from the ose-primer root):
      `git -C ~/ose-projects/ose-primer fetch origin && git -C ~/ose-projects/ose-primer worktree add -b worktree-to-pr-default-delivery-mode worktrees/worktree-to-pr-default-delivery-mode origin/main`
      — acceptance: `git -C ~/ose-projects/ose-primer worktree list` shows the path. Done.
- [x] [AI] Initialize toolchain: `npm install && npm run doctor -- --fix` in the ose-primer root
      — acceptance: both exit 0. Done.
- [x] [AI] Open the single draft PR for primer:
      `gh pr create --draft --base main --head worktree-to-pr-default-delivery-mode --title "docs(governance): worktree-to-pr default delivery mode" --body "Parity port of the ose-public delivery-mode + pr-review-cycle change."`
      (run from the primer worktree) — acceptance: `gh pr view --json number` returns a PR number. Done:
      ose-primer PR #3.
- [x] [AI] Apply the identical edits to the primer copies of every file in
      [`tech-docs.md` §Surface Inventory](./tech-docs.md#surface-inventory): the two conventions, the
      four development-workflow docs, the plan workflow docs + the new
      `repo-governance/workflows/pr/pr-review-quality-gate.md`, the five `.claude/agents/plan-*.md` + the two new `pr-review-*.md` agents + the plan-creating SKILL, and `AGENTS.md` + `CLAUDE.md` +
      `.claude/agents/README.md`.
      — acceptance: `grep -rc "worktree-to-pr" repo-governance AGENTS.md .claude` (from primer worktree)
      returns non-zero matches across the same surfaces as ose-public, and both `pr-review-*.md` agents
      exist in the primer `.claude/agents/`. Done: verified both agents present.
  - _Suggested executor: `repo-rules-maker` (conventions/dev-workflow) + `repo-workflow-maker` (workflows) + `agent-maker` (.claude)_
- [x] [AI] Re-sync bindings: `npm run generate:bindings`
      — acceptance: exits 0; `git status --porcelain .opencode .amazonq` shows only intended staged drift. Done.

### Local Quality Gates (Before Push)

- [x] [AI] `npm run lint:md:fix && npm run lint:md` — acceptance: exits 0. Done.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md mermaid validate --changed-only && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md heading-hierarchy validate`
      — acceptance: all exit 0. Done.
- [x] [AI] `npm run validate:claude && npm run validate:opencode` — acceptance: exits 0. Done.
- [x] [AI] `npx nx affected -t typecheck lint test:quick specs:behavior:coverage` — acceptance: exits 0.
      **Fix ALL failures, including preexisting.** Done.

### Commit + Push + CI (on the primer PR)

- [x] [AI] Commit thematically and push to the PR branch:
      `git commit -m "docs(governance): worktree-to-pr default delivery mode + pr-review cycle (parity port)"` then
      `git push origin worktree-to-pr-default-delivery-mode`
      — acceptance: primer PR shows the commit. Done.
- [x] [AI] Monitor CI on the primer PR until green; fix at root + follow-up commit if red; repeat. Done.

### PR-Review Maker→Fixer Cycle (primer PR)

- [x] [AI] Run the **PR-Review Maker→Fixer Cycle** (reusable procedure above) against the primer PR
      with `N=3` sequential cycles. — acceptance: cycle done-definition met (N cycles complete OR early
      zero-findings exit; every maker thread answered/resolved; `gh pr checks` green). No archival-in-PR
      (N/A for primer). Done: 3 cycles run, Cycle 3 caught one LOW link-label mismatch (see
      `learnings.md`).

### Deliver + Cleanup

- [x] [AI] Flip to ready: `gh pr ready`; confirm `gh pr checks` all green and
      `gh pr view --json mergeable` is `MERGEABLE`. — acceptance: PR ready + mergeable + review loop done. Done.
- [x] [HUMAN] Review and click **Merge** on the primer PR (outside the AI done-boundary).
      — handoff: `[AI]` reached the primer done-definition (cycles + comments answered + gates green)
      and marked the PR ready. Resume signal: `gh pr view --json state` returns `MERGED`. Done:
      merged 2026-07-06T13:29:27Z.
- [x] [AI] After merge, remove the primer worktree:
      `git -C ~/ose-projects/ose-primer worktree remove worktrees/worktree-to-pr-default-delivery-mode`
      — acceptance: the path is no longer listed. Done.

### Phase 4 Gate

> All checks below must pass before starting Phase 5.

- [x] [AI] Primer PR `state` is `MERGED`; the four-mode vocabulary + precedence + both `pr-review-*`
      agents are present in the primer surfaces (`grep` confirms parity with ose-public conceptually).
      Verified: PR #3 state MERGED; 22 file matches for `worktree-to-pr`; both `pr-review-*.md` present.
- [x] [AI] The primer review loop ran to its done-definition (cycles complete, all maker threads
      answered) before the `[HUMAN]` merge.
- [x] [AI] Post-merge primer `main-ci` (if any) is green; primer worktree removed. Verified: worktree
      list shows only the primary checkout.

> **Pause Safety**: primer change delivered on primer `main` via merged, fully-reviewed PR; worktree
> cleaned up. The ose-public PR remains open. Safe to stop before starting ose-infra. To resume: begin
> Phase 5.

---

## Phase 5: ose-infra — Replicate + Deliver via worktree-to-pr (review loop → [HUMAN] merge)

> Repo root: `~/ose-projects/ose-infra` [Repo-grounded]. Private repo, outside the parity
> loop, but carries its own copies. Apply the conceptually identical change; confirm the four-mode
> vocabulary + both review agents land intact even if some prose phrasing differs (see `tech-docs.md`
> open question 3). Infra's PR carries **no archival-in-PR** (plan folder lives only in ose-public).

- [x] [AI] Provision the infra worktree from latest `origin/main`:
      `git -C ~/ose-projects/ose-infra fetch origin && git -C ~/ose-projects/ose-infra worktree add -b worktree-to-pr-default-delivery-mode worktrees/worktree-to-pr-default-delivery-mode origin/main`
      — acceptance: `git -C ~/ose-projects/ose-infra worktree list` shows the path. Done.
- [x] [AI] Initialize toolchain: `npm install && npm run doctor -- --fix` in the ose-infra root
      — acceptance: both exit 0. Done.
- [x] [AI] Open the single draft PR for infra:
      `gh pr create --draft --base main --head worktree-to-pr-default-delivery-mode --title "docs(governance): worktree-to-pr default delivery mode" --body "Port of the delivery-mode + pr-review-cycle change to the private infra repo."`
      — acceptance: `gh pr view --json number` returns a PR number. Done: ose-infra PR #6.
- [x] [AI] Apply the identical edits to the infra copies of every file in
      [`tech-docs.md` §Surface Inventory](./tech-docs.md#surface-inventory), including the new
      `repo-governance/workflows/pr/pr-review-quality-gate.md` and the two `pr-review-*.md` agents.
      — acceptance: `grep -rc "worktree-to-pr" repo-governance AGENTS.md .claude` (from infra worktree)
      returns non-zero matches across the same surfaces; both `pr-review-*.md` agents exist. Done.
  - _Suggested executor: `repo-rules-maker` + `repo-workflow-maker` + `agent-maker`_
- [x] [AI] Re-sync bindings: `npm run generate:bindings`
      — acceptance: exits 0; only intended staged drift under `.opencode`/`.amazonq`. Done.

### Local Quality Gates (Before Push)

- [x] [AI] `npm run lint:md:fix && npm run lint:md` — acceptance: exits 0. Done.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md mermaid validate --changed-only && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md heading-hierarchy validate`
      — acceptance: all exit 0. Done.
- [x] [AI] `npm run validate:claude && npm run validate:opencode` — acceptance: exits 0. Done.
- [x] [AI] `npx nx affected -t typecheck lint test:quick specs:behavior:coverage` — acceptance: exits 0.
      **Fix ALL failures, including preexisting.** Done.

### Commit + Push + CI (on the infra PR)

- [x] [AI] Commit thematically and push to the PR branch:
      `git commit -m "docs(governance): worktree-to-pr default delivery mode + pr-review cycle (infra port)"` then
      `git push origin worktree-to-pr-default-delivery-mode`
      — acceptance: infra PR shows the commit. Done (plus a follow-up Cycle-3 fixer commit
      `cfbeda24f93863b9c79f0edd342a60c57690d57c`).
- [x] [AI] Monitor CI on the infra PR until green; fix at root + follow-up commit if red; repeat.
      Done: 19 pass / 0 fail on the final commit.

### PR-Review Maker→Fixer Cycle (infra PR)

- [x] [AI] Run the **PR-Review Maker→Fixer Cycle** (reusable procedure above) against the infra PR with
      `N=3` sequential cycles. — acceptance: cycle done-definition met (N cycles OR early zero-findings
      exit; every maker thread answered/resolved; `gh pr checks` green). No archival-in-PR (N/A).
      Done: 3 cycles run (fix commits `bb8b9ce2`, `12250b2e`; Cycle 3 posted clean then its own LOW
      finding was fixed via `cfbeda24f9`).

### Deliver + Cleanup

- [x] [AI] Flip to ready: `gh pr ready`; confirm `gh pr checks` all green and `mergeable` is `MERGEABLE`.
      — acceptance: PR ready + mergeable + review loop done. Done: PR #6 flipped to ready, `isDraft:
false`.
- [x] [HUMAN] Review and click **Merge** on the infra PR (outside the AI done-boundary).
      — handoff: `[AI]` reached the infra done-definition and marked the PR ready. Resume signal:
      `gh pr view --json state` returns `MERGED`. Done: merged 2026-07-06T13:29:22Z.
- [x] [AI] After merge, remove the infra worktree:
      `git -C ~/ose-projects/ose-infra worktree remove worktrees/worktree-to-pr-default-delivery-mode`
      — acceptance: the path is no longer listed. Done.

### Phase 5 Gate

> All checks below must pass before starting Phase 6.

- [x] [AI] Infra PR `state` is `MERGED`; the four-mode vocabulary + precedence + both `pr-review-*`
      agents present in infra surfaces. Verified: PR #6 state MERGED; 24 file matches for
      `worktree-to-pr`; both `pr-review-*.md` present.
- [x] [AI] The infra review loop ran to its done-definition before the `[HUMAN]` merge.
- [x] [AI] Post-merge infra `main-ci` (if any) is green; infra worktree removed. Verified: post-merge
      `main-ci`/`pr-quality-gate`/`validate-env` all `completed`/`success` on headSha
      `b59f616b56fbd484fb82eb84261d0df69335c877`; worktree list shows only the primary checkout.

> **Pause Safety**: primer + infra changes delivered on their respective `main` via merged,
> fully-reviewed PRs; both sibling worktrees cleaned up. The ose-public PR remains open (finalized in
> Phase 7). Safe to stop. To resume: proceed to Phase 6 (Knowledge Capture).

---

## Phase 6: Knowledge Capture (triage + route learnings)

> The sibling plan `plan-execution-knowledge-capture` executes FIRST and lands the Knowledge Capture
> requirement into the repo before this plan runs. Therefore this plan MUST honor it: triage the
> learnings surfaced during Phases 0–5 and route each through **the Knowledge Capture convention's
> triage rubric**, applying the two safety gates first. This phase runs before the ose-public
> finalization (Phase 7) so any ose-public-bound Knowledge-Capture edits land inside the still-open
> ose-public PR.
>
> **Triage rubric (open-ended, non-exhaustive)**: route each kept learning to the most fitting
> destination named by the convention. Candidate destinations include (illustrative, NOT a fixed
> or exhaustive set): `repo-governance/**`, `docs/**`, `.claude/agents/**`, `.claude/skills/**`,
> `apps/`/`libs/` source code, tests, a post-mortem entry (for failures), a `plans/ideas.md` /
> backlog entry, an inline fix in this plan before archival, cross-session auto-memory, or discard
> (noise / not durable). A learning may legitimately fit a destination not listed here — apply the
> exact rubric and destination names from the Knowledge Capture convention as landed by the sibling
> plan (grep the repo for the convention doc at execution time; do not assume its path or a fixed
> destination count).
>
> **Safety gates (apply BEFORE routing each item)**: (a) **repo-relevance gate** — only capture
> learnings relevant to this repo/estate; drop the rest. (b) **secret/sensitivity gate** — never write
> a system secret or sensitive value into any git-tracked destination (hard iron rule); redact or
> reference an env var instead.

- [x] [AI] Assemble the raw learnings log from Phases 0–5: preexisting failures fixed during baseline
      or gates, any CI-on-PR surprises, per-repo prose-divergence notes (esp. ose-infra), any
      binding-sync drift observed, and any notable pr-review-cycle findings/escalations. — acceptance:
      a bullet list of candidate learnings exists in the execution notes (not yet routed). Done: 6
      entries assembled in `learnings.md`.
- [x] [AI] Apply the **repo-relevance gate** to each candidate — mark keep/drop with a one-line reason.
      — acceptance: every candidate carries a keep/drop decision. Done.
- [x] [AI] Apply the **secret/sensitivity gate** to each kept candidate — confirm no secret/sensitive
      value is carried into any destination; redact or replace with an env-var reference where needed.
      — acceptance: no kept item contains a raw secret; `git diff` of any destination shows no secret.
      Done: no secrets involved in any of the 4 routed entries.
- [x] [AI] Route each kept learning to the most fitting destination per the convention's triage
      rubric (open-ended — do not force-fit into a fixed list). For any ose-public-bound edit, apply it
      inside the still-open ose-public PR branch (it merges in Phase 7); for any backlog/idea item, add
      a `plans/ideas.md` entry (or open a backlog plan) rather than expanding this plan's scope; for a
      sibling-repo-only edit whose PR already merged, open a small follow-up `worktree-to-pr` delivery.
      — acceptance: each kept learning maps to a named destination; ose-public-bound edits are on the
      PR branch; backlog items appear in `plans/ideas.md`. Done: 4 routed to
      `repo-governance/development/agents/{ai-agents.md,subagent-orchestration.md}`; 2 discarded as
      duplicates of already-tracked behavior (see `learnings.md` Summary table).
  - _Suggested executor: `repo-rules-maker` (governance destination) / `agent-maker` (agent-or-skill destination)_

### Phase 6 Gate

> All checks below must pass before starting Phase 7.

- [x] [AI] Every candidate learning has a keep/drop decision and every kept learning has exactly one
      routed destination (no unrouted learnings remain).
- [x] [AI] Both safety gates were applied and no secret/sensitive value was written to any git-tracked
      destination (`git log -p` spot-check on any Knowledge-Capture commit is clean).
- [x] [AI] Any ose-public-bound edits are staged/committed on the ose-public PR branch; any backlog
      items are recorded in `plans/ideas.md`.

> **Pause Safety**: all Phase 0–5 learnings are triaged and routed; ose-public-bound edits sit on the
> still-open ose-public PR branch; no learning is dropped silently and no secret leaked. Safe to stop.
> To resume: proceed to Phase 7 (ose-public finalize).

---

## Phase 7: ose-public — Finalize (KC edits + archival-in-PR + review loop → [HUMAN] merge)

> This is the last phase. The ose-public PR (open since Phase 0) now carries all ose-public content
> edits (Phases 1–3) plus any ose-public-bound Knowledge-Capture edits (Phase 6). Finalize it: commit
> the archival-in-PR move, run the review loop to its done-definition, then hand off to the `[HUMAN]`
> merge **outside** the AI done-boundary.

### Archival-in-PR (committed inside the ose-public PR)

> This plan is docs/governance-only: no UI/API, so no Playwright/curl manual assertions, no `evidence/`
> screenshots, no rule-15/16 tester retests apply. Specs/Gherkin two-path completeness and the
> UI-design-funnel are EXEMPT (see [`prd.md` §Exemption Notes](./prd.md#exemption-notes-read-by-plan-checker)).

- [ ] [AI] Verify ALL delivery checklist items are ticked across Phases 0–6.
- [ ] [AI] Verify the primer + infra PRs are both `MERGED` and the four-mode vocabulary + precedence +
      both `pr-review-*` agents are present and consistent in all three repos
      (`grep` spot-check on `plans.md` + `plan-execution.md` + `AGENTS.md` + `.claude/agents/`).
- [ ] [AI] Commit any ose-public-bound Knowledge-Capture edits from Phase 6 to the PR branch (if not
      already committed): `git commit -m "docs: route Phase 0–5 knowledge-capture learnings into ose-public"`
      — acceptance: PR shows the KC commit (or none if no ose-public-bound learnings).
- [ ] [AI] Perform the archival-in-PR move (committed inside the delivering ose-public PR) using
      today's completion date:
      `git mv plans/in-progress/worktree-to-pr-default-delivery-mode plans/done/YYYY-MM-DD__worktree-to-pr-default-delivery-mode`
      — acceptance: the folder now lives under `plans/done/` on the PR branch.
- [ ] [AI] Update `plans/in-progress/README.md` (remove this plan's entry if present),
      `plans/done/README.md` (add the entry with the completion date), and any other READMEs that
      reference this plan (e.g., `plans/README.md`).
      — acceptance: the three README updates are staged on the PR branch.
- [ ] [AI] Commit the archival on the PR branch:
      `git commit -m "chore(plans): move worktree-to-pr-default-delivery-mode to done"` then
      `git push origin worktree-to-pr-default-delivery-mode`
      — acceptance: the ose-public PR shows the archival commit.

### Local Quality Gates + CI (on the ose-public PR)

- [ ] [AI] `npm run lint:md:fix && npm run lint:md` — acceptance: exits 0.
- [ ] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md mermaid validate --changed-only && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md heading-hierarchy validate`
      — acceptance: all exit 0.
- [ ] [AI] `npm run validate:claude && npm run validate:opencode` — acceptance: exits 0.
- [ ] [AI] `npx nx affected -t typecheck lint test:quick specs:behavior:coverage` — acceptance: exits 0.
      **Fix ALL failures, including preexisting.**
- [ ] [AI] Monitor CI on the ose-public PR until green; fix at root + follow-up commit if red; repeat.

### PR-Review Maker→Fixer Cycle (ose-public PR)

- [ ] [AI] Run the **PR-Review Maker→Fixer Cycle** (reusable procedure above) against the ose-public PR
      with `N=3` sequential cycles. — acceptance: cycle done-definition met — N cycles complete (or
      early zero-findings exit); every maker thread answered/resolved; `gh pr checks` green; and
      **archival-in-PR is present** on the PR branch (ose-public only).

### Deliver + Cleanup

> **Done-boundary**: the AI is DONE when the review-cycle done-definition is met AND archival-in-PR is
> committed AND all gates are green. The `[HUMAN]` merge below is OUTSIDE this boundary — "done" ≠
> "merged".

- [ ] [AI] Confirm the done-definition is met, then flip the PR to ready: `gh pr ready`; confirm
      `gh pr checks` all green and `gh pr view --json mergeable` is `MERGEABLE`.
      — acceptance: PR ready + mergeable + review loop done + archival-in-PR present. **AI DONE here.**
- [ ] [HUMAN] Review the ose-public PR and click **Merge** in GitHub (the irreversible trunk write,
      outside the AI done-boundary). — handoff: `[AI]` reached the full done-definition and marked the
      PR ready. Resume signal: `gh pr view --json state` returns `MERGED`.
- [ ] [AI] After merge, remove the ose-public worktree:
      `git worktree remove worktrees/worktree-to-pr-default-delivery-mode`
      — acceptance: `git worktree list` no longer lists the path.

### Phase 7 Gate

> Final gate. All checks below must pass to consider the plan fully delivered.

- [ ] [AI] `gh pr view --json state` returns `MERGED` for the ose-public PR; post-merge `main-ci`
      (if any) is green (`gh run list --branch main -L 1`).
- [ ] [AI] The archival move is on `main` (`git fetch origin && git ls-tree origin/main plans/done | grep worktree-to-pr-default-delivery-mode`).
- [ ] [AI] All three PRs (ose-public, ose-primer, ose-infra) are `MERGED`; all three worktrees removed.
- [ ] [AI] The ose-public review loop ran to its done-definition (N cycles, every thread answered,
      archival-in-PR present) before the `[HUMAN]` merge.

> **Pause Safety**: all three repos delivered on their respective `main` via merged, fully-reviewed
> PRs; the plan is archived to `plans/done/` on ose-public `main`; all three worktrees cleaned up. The
> plan is complete.

### Note on the upstream dependency

- [ ] [AI] Confirm this plan honored the Knowledge Capture requirement landed by
      `plan-execution-knowledge-capture` (the sibling plan that executes BEFORE this one): Phase 6 ran,
      all Phase 0–5 learnings were triaged and routed through the convention's open-ended triage rubric
      with both safety gates applied. — acceptance: Phase 6 gate is green and no learning was dropped
      silently.
