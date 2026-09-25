---
description: What this convention covers — every AI agent and automation push path — and what it excludes, namely normal non-destructive pushes and git commit --no-verify.
when_to_use: Use when determining whether a specific push mechanism or actor falls under this convention.
---

# Scope

This rule applies to:

- All AI agents defined in `.agents/agents/` and routed through `.claude/agents/`, `.codex/agents/`, and `.opencode/agents/`.
- All automation scripts, npm scripts, Makefile targets, and shell helpers in the repository.
- CI workflow steps, unless the workflow file is reviewed through the normal pull-request process and the force-push is explicitly documented in the workflow file itself.
- Every delivery mode's push target: PR branches under `worktree-to-pr`/`main-to-pr`, and `origin main` under `worktree-to-origin-main`/`main-to-origin-main`.

It does not apply to:

- Normal `git push` without destructive flags to a ref the agent has no reason to believe is
  protected — agents may run these autonomously, subject to the
  [Post-Push Bypass Detection](./post-push-bypass-detection.md#post-push-bypass-detection) obligation.
- `git commit --no-verify` — that is covered separately in the [Code Quality Convention](../../quality/code.md) under "Bypassing Hooks".
