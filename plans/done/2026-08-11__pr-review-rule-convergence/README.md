# PR Review Rule Convergence

## Status

Completed — public PR #171, private direct delivery, Primer PRs #35 and #36, and the public archival
delivery were executed entirely by AI. The terminal worktree cleanup follows the archival PR merge.

## Context

The current PR Review Maker→Fixer Cycle is a fixed three-pass gate for every `*-to-pr` delivery,
including prose-only and plan-only pull requests. Its exit and merge rules are duplicated across the
workflow, merge protocol, plan convention, root instructions, and agent guidance. That broad default
adds review work where the repository's deterministic PR quality gate is sufficient, while it does not
create a structured learning loop when a code review takes many passes to converge.

This plan replaces that shape with a diff-classified policy. A PR touching executable behavior gets a
strict, sequential review loop of up to seven cycles and may exit as soon as no Medium, High, or
Critical code finding remains. Other PRs merge after `.github/workflows/pr-quality-gate.yml` succeeds.
The same decision rule applies whether work came from a plan or an ad-hoc task.

## Scope

### In scope

- Define a behavior-based executable-artifact classifier for PR review eligibility.
- Update every canonical OSE-public rule that currently mandates a fixed PR-review cycle or broader
  merge condition.
- Retrofit every related, forward-looking plan in `plans/backlog/` and `plans/in-progress/` so its
  delivery instructions use this policy rather than embedding the retired fixed-cycle rule.
- Require cycle-six-and-later non-convergence learning capture and maintain non-blocking Low findings
  as deduplicated entries in `plans/ideas/`.
- Define secret-leak containment, full affected-ref rewrite, compromised-PR replacement, and provider
  purge-request handling without recording secret values.
- Propagate patient runner-contention handling: keep the active goal, investigate contention, and poll
  at the documented cadence rather than cancelling work because CI is queued or stalled.
- Propagate direct post-completion cleanup across all in-scope repositories: remove each exact plan
  worktree immediately after its final delivery is complete, while preserving the root checkout.
- Propagate governance and agent guidance to the private sibling immediately after the public source change
  merges, then deliver the same applicable policy changes to `ose-primer` through its own companion PR.
- Regenerate bindings from the canonical `.claude/` source and validate the generated surfaces.

### Out of scope

- Changing the implementation of `.github/workflows/pr-quality-gate.yml` beyond verifying it.
- Treating documentation, plan, governance, agent, or skill prose as specialized-review-eligible by
  itself.
- Rewriting historical execution records or completed plans merely to make their already-executed
  delivery claims look current.
- Altering application behavior, adding a new issue tracker, or exposing a secret in a plan, log,
  commit, review, or PR description.
- Claiming that a history rewrite removes data from third-party clones, forks, caches, or notifications.

## Resolved Design Decisions

1. Review eligibility is behavior-based: a tracked artifact is eligible when it can build, test,
   deploy, provision, validate, or change runtime/CI behavior. This includes `apps/`, `libs/`,
   `scripts/`, `infra/`, workflows, and equivalent executable configuration.
2. Eligible PRs run sequential cycles with a maximum of seven and stop after the first completed
   cycle with no unresolved code-related Medium, High, or Critical finding.
3. Low code findings are consolidated, dispositioned, and captured in a deduplicated `plans/ideas/`
   two-pager; they neither extend the cycle nor block merge.
4. A seventh-cycle PR still cannot merge with a code-related Medium, High, or Critical finding.
5. A non-eligible PR does not run the specialist cycle; it needs a passing `pr-quality-gate.yml`
   workflow before merge, subject to universal secret handling.
6. A confirmed secret leak triggers standing authorization to contain and rotate it, rewrite every
   reachable affected ref, delete the contaminated branch, replace any contaminated PR, and request
   provider cache/purge support. The result cannot erase independent external copies.
7. `ose-public` remains canonical. Its governance PR merges first; a prepared, passing the private sibling
   companion is merged immediately afterward, with any temporary skew recorded. This plan then
   delivers the applicable same-policy OSE Primer companion; it is no longer deferred from this work.
8. The policy reclassifies every still-open PR at its next review or merge action; no legacy opt-in
   route remains.
9. Plan-backed cycle-six-and-later work records sanitized evidence in both its `learnings.md` and a
   deduplicated idea; ad-hoc work records the reusable learning directly in `plans/ideas/`.
10. Public/private parity uses an explicit manifest of portable canonical governance, agent, skill, and
    related-rule files that must be byte-identical. Documented private-only operational files remain
    outside the manifest.
11. Runner contention is an expected operational condition: the active goal remains active while the
    agent investigates and waits at the documented cadence; it is never cancelled solely for a queued
    or stalled runner.
12. **One-plan OSE-private exception:** this plan's private changes use a worktree but commit and push
    directly to `origin/main`, with no private PR or PR-quality wait. This user-authorized exception
    applies to no other repository, workflow, or future plan.
13. The concurrent OSE-private PR-quality remediation is outside this plan's ledger. It is never edited
    or awaited; this plan uses its own worktree based on `origin/main`.
14. After all plan delivery units in a repository have completed, the executor immediately removes the
    exact worktree used by this plan. The root checkout is never a cleanup target and remains available
    for final `origin/main` synchronization.
15. Every delivery, validation, merge, reconciliation, archival, and cleanup task in this plan is
    executed by `[AI]`; it declares no human approval, review, or manual-check gate.

## Plan Documents

- [Business requirements](./brd.md)
- [Product requirements](./prd.md)
- [Technical design](./tech-docs.md)
- [Delivery checklist](./delivery.md)
- [Learnings](./learnings.md)
