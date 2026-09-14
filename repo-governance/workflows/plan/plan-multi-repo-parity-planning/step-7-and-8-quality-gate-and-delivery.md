---
description: Runs plan-quality-gate per plan to a PASS verdict, then delivers per the selected mode and reports the deviation count summary.
when_to_use: Use when gating and delivering the authored plans, or reporting the run's final outcomes.
---

# Step 7 — Quality Gate (Per Plan, Nested Workflow)

Run [plan-quality-gate](../plan-quality-gate.md) for each created plan in its own repo. This step is
one of that gate's three named pre-authorizations.

**Workflow**: `plan/plan-quality-gate`

- **Args**: `plan-path: <plan-folder-path>, checkpoint: pre-execution`
- **Output**: `verdict`, `ledger`
- **Run**: one gate per plan, up to `max-concurrency` gates in parallel

The gate takes no mode: it has no severity threshold, and every admitted ledger row must be closed.
Each plan must return `PASS`.

**On any `BLOCKED_*` verdict**: read the returned ledger. There is no separate fixer agent to re-run — the
gate repairs its own ledger inside its bounded cycles, so a `BLOCKED_NON_CONVERGENT` result means
the plan needs an external decision, not another gate pass. Surface it to the invoker as a blocking
issue and do not deliver that plan. Re-invoke the gate only after the named external change lands.

**Success criteria**: Every plan in the parity set returns `PASS`.

## Step 8 — Delivery and Finalization (Per Mode)

### Part A — Delivery

Commit and deliver per the selected mode.

**Commit guidance** (per [Commit Messages Convention](../../../development/workflow/commit-messages.md)):
Use Conventional Commits format. After authorization, apply the thematic boundary test: keep a
plan and required rationale together when they complete one purpose; split only independently
reviewable/revertible concerns. Never commit secrets or bypass hooks.

Examples:

```
chore(plans): add <objective-slug> parity plan (ose-public)
docs(explanation): add <objective-slug> parity decisions rationale
```

**Per mode**:

- `main-to-origin-main`: Push each repo's commits to `origin main` directly. Not available for any
  bare repo in the set (verify with `git worktree list`, never assume from a fixed repo list) — a
  bare repo has no primary checkout to push from directly; those targets deliver via
  `worktree-to-origin-main` instead.
- `worktree-to-origin-main`: Push each repo's worktree commits to `origin main`. Remove worktrees
  after delivery only through the full
  [Worktree and Artifact Cleanup](../../../development/workflow/worktree-and-artifact-cleanup.md)
  gate: resolve the exact recorded identity, prove every unit delivered plus clean/idle and
  no-unpushed state, preserve diagnostic evidence, purge only plan-local regenerable output, apply
  the bare-repository remote-branch order exception when needed, bring down dev container stacks
  this session started, remove the exact worktree non-force, clean eligible plan-created branches,
  then run `git worktree prune`. Retain and
  escalate on ambiguous or failed proof; never remove on `partial` or `fail` and never prune shared
  state.
- `worktree-to-pr` (default): Push branch `plan/<objective-slug>` to each repo. Create or update a
  draft PR per repo via `gh pr create --draft` (skip creation if a PR for that branch already
  exists).

**Success criteria**: All commits land at the intended targets; hooks pass; no secrets committed.

**On push failure**: Surface the error. Do not retry automatically — conflicts require invoker
resolution.

### Part B — Finalization

Report outcomes.

**Output**:

- `plans-created`: One path per target repo
- `gate-results`: plan-quality-gate verdict per plan (PASS / BLOCKED\_\*)
- `delivery-refs`: Commit SHAs pushed to `origin main` (main modes) or PR URLs (worktree-to-pr)
- Deviation count summary: "N deliberate deviations recorded; 0 silent deviations"
- Parity identity assertion: actual worktree basename and corresponding branch per repository match
  the common record, with every `not applicable` entry justified by mode or repo-only scope

The deviation count is the key quality signal: every difference is deliberate, none silent.
