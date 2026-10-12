---
description: "Requires approval outside bounded authorized task sync; hook bypass and secret remediation keep separate rules."
when_to_use: "Read this index to find the right Git Push Safety Convention child document."
---

# Git Push Safety Convention

[Authorized task-owned sync](../no-destructive-git-operations/001-authorized-task-branch-sync.md) owns the bounded routine
exception; the approval procedures below apply outside it.

- [Principles and Conventions Implemented](./principles-and-conventions-implemented.md) — The principles and companion conventions the Git Push Safety Convention implements and respects. Use when tracing why force-push and hook-bypass approval requirements exist back to the principles and conventions they respect.
- [Covered Operations](./covered-operations.md) — The table of git push operations that require explicit, per-instance user approval before an agent may run them. Use when deciding whether a specific push command or its aliased/scripted equivalent needs approval before running.
- [Rule](./rule.md) — The core approval rule for force-push and hook-bypass operations, and the separate standing exception for confirmed secret-exposure history remediation. Use when about to run a covered git push operation, or when handling a confirmed secret exposed in committed history.
- [Rationale](./rationale.md) — Why force-push is destructive, why --no-verify is a safety bypass, why approval never carries forward, and the legitimate use cases for these operations. Use when explaining to a user or teammate why this convention requires per-instance approval, or when judging whether a proposed force-push/hook-bypass is a legitimate use case.
- [What Agents Must Do](./what-agents-must-do.md) — The three-step agent procedure — investigate a safe alternative first, present a complete approval prompt, then execute exactly what was approved. Use when an agent is about to propose or execute a force-push or hook-bypass operation.
- [Examples](./examples.md) — One PASS and three FAIL examples of agent behaviour around force-push and --no-verify approval. Use when checking whether a specific agent transcript around a force-push or --no-verify complies with this convention.
- [Scope](./scope.md) — What this convention covers — every AI agent and automation push path — and what it excludes, namely normal non-destructive pushes and git commit --no-verify. Use when determining whether a specific push mechanism or actor falls under this convention.
- [Post-Push Bypass Detection](./post-push-bypass-detection.md) — The post-hoc obligation to read push output for ruleset-bypass language and treat a bypassed required check as a discovered violation. Use immediately after any git push completes, to check whether branch protection was bypassed.
