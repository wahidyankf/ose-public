---
description: Requires explicit user approval for every git push --force, --force-with-lease, or --no-verify — no exceptions for AI agents or automation.
when_to_use: Use before git push --force, --force-with-lease, or --no-verify, or when auditing for a branch-protection bypass.
---

# Git Push Safety Convention

AI agents and automation must never execute `git push --force`, `git push --force-with-lease`, or
`git push --no-verify` without obtaining explicit, fresh user approval every single time. Prior
approval for one instance does not carry forward to any subsequent invocation. The sole standing
exception is a confirmed secret-exposure incident handled end-to-end under
[the secret history-remediation procedure](../../conventions/security/secrets-and-env-standards/secret-exposure-history-remediation.md#secret-exposure-history-remediation): there, a lease-protected force-push is required to remove
contaminated reachable history rather than a convenience rewrite.

These rules apply identically regardless of the active delivery mode (see the
[Plans Organization Convention — Delivery Mode](../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode)):
a force-push or hook-bypass on a `worktree-to-pr` plan branch requires the same explicit, per-instance
approval as one on `origin main` under `worktree-to-origin-main` or `main-to-origin-main`. The
integration target changes what the approval prompt describes (a PR branch tip vs. the `main` tip); it
does not change whether approval is required.

## Contents

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
