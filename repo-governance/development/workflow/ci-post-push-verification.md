---
description: After pushing app or library code, manually trigger all related GitHub CI workflows and verify they pass before considering the work complete.
when_to_use: Use immediately after pushing app or lib code, to confirm CI actually passes rather than assuming the pre-push hook was sufficient.
---

# CI Post-Push Verification Convention

After pushing app or library code, you MUST manually trigger all related GitHub CI workflows and verify they pass before declaring the work done. **This obligation is delivery-mode-independent**: it applies to a push to a PR branch under the default `worktree-to-pr` exactly as it applies to a push to `origin main` under the direct-push modes. Under `worktree-to-pr` it is what makes the PR green, which merge precondition (a) requires. A green pre-push hook is a necessary condition, not a sufficient one — it cannot run integration tests, end-to-end tests, or deployment workflows.

## Contents

- [Principles and Conventions Implemented](./ci-post-push-verification/principles-and-conventions-implemented.md) — The principles and companion conventions this practice respects.
- [The Rule and Workflow Mapping](./ci-post-push-verification/the-rule-and-workflow-mapping.md) — The four required steps, and which workflow file covers each app.
- [Monitoring and Commands](./ci-post-push-verification/monitoring-and-commands.md) — Rate-limit-safe polling and the reference `gh` command set.
- [Scope and Pre-Push Hook Coverage](./ci-post-push-verification/scope-and-pre-push-hook-coverage.md) — When this convention applies/doesn't, and what the pre-push hook already covers.
- [Agent Responsibilities and Forbidden Actions](./ci-post-push-verification/agent-responsibilities-and-forbidden-actions.md) — Who owes verification, and which shortcuts are forbidden.
- [Examples](./ci-post-push-verification/examples.md) — Worked pass/fail examples, including fixing a failure found during verification.

## Related Documentation

- [CI Monitoring Convention](../workflow/ci-monitoring.md) — Safe monitoring mechanics: one scheduled status read every 2 minutes, never `gh run watch`, trigger discipline, and rate-limit recovery.
- [CI Blocker Resolution Convention](../quality/ci-blocker-resolution.md) — How to investigate and fix CI failures found during verification.
- [Trunk Based Development Convention](../workflow/trunk-based-development.md) — Why `main` must remain releasable at all times.
- [Git Push Default Convention](../workflow/git-push-default.md) — Default push behaviour (a PR branch under the default `worktree-to-pr`; direct to `origin main` under the explicitly-selected direct-push modes, which have no PR buffer).
- [Code Quality Convention](../quality/code.md) — Quality gates, including the pre-push leak scan, that this convention extends.
