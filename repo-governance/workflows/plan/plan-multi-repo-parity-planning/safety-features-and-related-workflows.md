---
description: Lists the workflow's safety guarantees (worktree isolation, gate-before-delivery, hook compliance, secrets rule) and links to related workflows.
when_to_use: Use when verifying what protections this workflow provides, or navigating to a related workflow.
---

# Safety Features

**Worktree isolation** (default mode): plan authoring happens in a dedicated worktree per repo,
keeping `main` clean until delivery. The worktree is provisioned fresh and initialized with the
full two-step toolchain sequence (guarded `npm install` + read-only `npm run doctor`, provisioning
only on reported drift) per the
[Worktree Toolchain Initialization](../../../development/workflow/worktree-setup.md)
practice.

**Gate-before-delivery**: No plan is pushed until plan-quality-gate returns `PASS`. An
un-gated plan is a blocked delivery, not an exception.

**No implementation**: This workflow is type `planning`. It produces plans, not code, not
config changes. Execution of the objective happens downstream via the
[plan-execution workflow](../plan-execution.md) after the plans are established.

**Hook compliance**: Every delivery commit passes pre-commit and pre-push hooks of the target
repo. No hook bypassing; no `--no-verify`.

**Secrets rule**: The
[No Secrets in Git convention](../../../conventions/security/no-secrets-in-committed-files.md) applies in full.
No system secret (key, password, API token, connection string) enters any plan file.

**PR mode for review**: When the invoker wants formal review of plans before they go active,
select `worktree-to-pr`. The PRs remain in draft until the invoker promotes them.

## Related Workflows

- [Plan Quality Gate](../plan-quality-gate.md) — nested workflow called in Step 7 for each plan
- [Plan Planning](../plan-planning.md) — single-repo sibling; this workflow
  is its multi-repo analogue (one plan per repo, one grill session across all repos)
- [Plan Execution](../plan-execution.md) — downstream workflow that executes the plans this
  workflow creates; runs after plans are established and promoted to `in-progress/`
- [Delivering the Parity Plans](./delivering-the-parity-plans.md) — carries the gated plans on to
  plan-execution for every resulting plan in the same run
- [PR Leak Review](../../pr/pr-leak-review.md) — runs once against the exact current head during
  each repo's execution phase when its authored plan resolves to a `*-to-pr` delivery mode
- [PR Review Cycle](../../pr/pr-review-cycle.md) — runs only when the user explicitly requests the
  optional iterative semantic review
