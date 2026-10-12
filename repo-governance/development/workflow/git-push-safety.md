---
description: Requires approval outside bounded authorized task sync; hook bypass and secret remediation keep separate rules.
when_to_use: Use before git push --force, --force-with-lease, or --no-verify, or when auditing for a branch-protection bypass.
---

# Git Push Safety Convention

AI agents and automation must never execute `git push --force`, `git push --force-with-lease`, or
`git push --no-verify` without explicit, fresh per-instance approval outside
[authorized task-owned sync](no-destructive-git-operations/001-authorized-task-branch-sync.md). A single-action grant
never carries forward; the same ongoing task retains its bounded delivery authority. Hook bypass remains separate.
The independent standing
exception is a confirmed secret-exposure incident handled end-to-end under
[the secret history-remediation procedure](../../conventions/security/secrets-and-env-standards/secret-exposure-history-remediation.md#secret-exposure-history-remediation): there, a lease-protected force-push is required to remove
contaminated reachable history rather than a convenience rewrite.

These rules apply identically regardless of the active delivery mode (see the
[Plans Organization Convention — Delivery Mode](../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode)):
a delivery mode chooses the route and grants no authority. Routine owned task-branch sync follows its bounded
contract; direct-main and environment targets do not gain that exception. Hook bypass always remains outside it.
The independent secret-incident procedure grants only its existing remediation operations.

## Contents

- [Authorized Task Branch Sync](no-destructive-git-operations/001-authorized-task-branch-sync.md) — the bounded routine exception.

- [Principles and Conventions Implemented](./git-push-safety/principles-and-conventions-implemented.md) — Why this rule exists.
- [Covered Operations](./git-push-safety/covered-operations.md) — The operations requiring per-instance approval.
- [Rule](./git-push-safety/rule.md) — The core approval procedure and the secret-exposure exception.
- [Rationale](./git-push-safety/rationale.md) — Why each operation is destructive and when it is legitimate.
- [What Agents Must Do](./git-push-safety/what-agents-must-do.md) — Investigate, prompt, then execute.
- [Examples](./git-push-safety/examples.md) — PASS and FAIL agent transcripts.
- [Scope](./git-push-safety/scope.md) — What is and is not covered.
- [Post-Push Bypass Detection](./git-push-safety/post-push-bypass-detection.md) — The post-hoc check for a bypassed branch-protection rule.

## Related Documentation

- [No Destructive Git Operations Convention](../workflow/no-destructive-git-operations.md) — The
  local-side companion covering hard reset, recursive clean, and forced worktree removal.
- [Code Quality Convention](../quality/code.md) — Git hooks that `--no-verify` bypasses.
- [Trunk Based Development Convention](../workflow/trunk-based-development.md) — CI-managed
  force-push in environment branches.
- [Commit Message Convention](../workflow/commit-messages.md) — Conventional Commits format, checked by review.
- [Reproducible Environments Convention](../workflow/reproducible-environments.md) — Deterministic operations across the team.
- [Git Push Default Convention](../workflow/git-push-default.md) — The default integration target this convention complements.
