---
title: "Git Push Safety Convention"
description: Practice requiring explicit user approval for every use of git push --force, --force-with-lease, or --no-verify, with no exceptions for AI agents or automation
category: explanation
subcategory: development
tags:
  - git
  - workflow
  - safety
  - automation
  - human-approval
created: 2026-03-30
updated: 2026-03-30
---

# Git Push Safety Convention

AI agents and automation must never execute `git push --force`, `git push --force-with-lease`, or `git push --no-verify` without obtaining explicit, fresh user approval every single time. Prior approval for one instance does not carry forward to any subsequent invocation.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md)**: Force-push and hook-bypass operations alter remote history or skip quality gates. The consequences cannot be undone without coordination — they are exactly the kind of irreversible decision that demands human judgment before execution, not autonomous action by a machine.

- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)**: The need to force-push or bypass hooks is almost always a symptom of a deeper problem (diverged history, a failing check, a missing rebase). This convention redirects attention to the root cause rather than normalizing the shortcut as an acceptable routine action.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Implicit permission — "the user approved a force-push earlier, so subsequent ones are also approved" — is the silent assumption this convention forbids. Each instance requires a fresh, visible confirmation so the risk is never hidden.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Code Quality Convention](../quality/code.md)**: The pre-push hook runs `typecheck`, `lint`, and `test:quick` as mandatory quality gates. Using `--no-verify` bypasses these gates and must not be treated as a routine shortcut by agents or automation.

- **[Commit Message Convention](./commit-messages.md)**: Conventional Commits format and the commit-msg hook work together to keep history accurate. Force-pushing rewrites that history; only the user can decide when that trade-off is justified.

## Covered Operations

The following operations require explicit, per-instance user approval:

| Operation | Why it is destructive or safety-bypassing |
| --- | --- |
| `git push --force` | Overwrites the remote branch tip, permanently discarding any remote commits not present locally. Teammates lose pushed work without warning. |
| `git push --force-with-lease` | Safer than `--force` but still rewrites history. The lease check can silently succeed when a teammate's push arrived before the lease was refreshed, making it unreliable as a safety guarantee. |
| `git push --no-verify` | Skips all git hooks on the push side, bypassing `typecheck`, `lint`, and `test:quick` quality gates. Broken code can reach the remote and block CI. |
| Any combination of the above | The risks compound; combined flags require the same explicit approval. |
| Aliased or scripted equivalents | Any shell alias, npm script, Makefile target, or CI step that invokes the above flags is subject to the same rule. The mechanism does not change the requirement. |

## Rule

**AI agents and automation MUST NOT execute any of the covered operations autonomously.**

For every invocation — without exception — the agent must:

1. Stop before executing the command.
2. Describe to the user exactly what the command is, why it is being considered, and what data or history may be affected.
3. Wait for the user to provide explicit confirmation to proceed.
4. Execute the command only after that confirmation is received.

**Prior approval does not carry forward.** If the user approved a `git push --force` five minutes ago, that approval covers only that one execution. The next invocation starts from zero and requires a fresh confirmation.

## Rationale

### Why force-push is destructive

`git push --force` replaces the remote branch tip with the local commit. Any commits that existed on the remote but not locally are discarded. Because git history is shared, this affects every teammate who has already pulled those commits. Recovering discarded commits requires them to use `git reflog` on their own machines — a manual, error-prone process that can result in permanent data loss if it is not performed quickly.

`git push --force-with-lease` adds a lease check against the last-fetched remote tip. This reduces — but does not eliminate — the risk. The lease can silently succeed if the local fetch timestamp is stale or if a teammate pushed between the fetch and the push. From the perspective of safe automation, it remains a history-rewriting operation.

### Why --no-verify is a safety bypass

The pre-push hook exists specifically to prevent broken code from reaching the remote. It runs `typecheck`, `lint`, and `test:quick` for affected projects. Bypassing it with `--no-verify` removes the last automated barrier before CI. If broken code reaches the remote, CI fails for every contributor working from that branch, and reverting the push requires either a fix commit or another force-push. The problem compounds.

### Why no carryover approval

The state of a repository changes between operations. A force-push approved at 09:00 was approved in the context of what existed at 09:00. At 09:15 a teammate may have pushed new commits. Reusing the 09:00 approval at 09:15 would bypass the user's opportunity to reconsider in light of that change.

### Legitimate use cases

Force-push and hook-bypass operations are not always wrong. Common legitimate situations include:

- Cleaning up a local branch before merging (amending commits, squashing, rebasing) when the branch has no other contributors.
- Emergency hotfix where the pre-push hook is malfunctioning and the hook problem is being tracked separately.
- CI automation that explicitly documents the force-push in workflow files and is reviewed as part of code review (for example, the `prod-ayokoding-web` deployment workflow — see [Trunk Based Development Convention](./trunk-based-development.md)).

In every case, the decision requires human judgment about the specific context. An agent cannot reliably determine whether a force-push is safe without that context.

## What Agents Must Do

### Before proposing the operation

Before even surfacing the question to the user, the agent should investigate whether the underlying problem can be solved without a destructive operation:

- **For force-push**: Is there a non-rewriting alternative? Can the commits be reapplied cleanly with `git rebase` without rewriting shared history?
- **For --no-verify**: Is the pre-push hook failure a real code quality problem or a hook infrastructure issue? If it is a real problem, fix the code rather than bypass the gate.

### The approval prompt

When no safe alternative exists, the agent presents a clear, complete description of the operation:

```
I need your explicit approval before running:

  git push --force origin main

What this will do: replace the remote 'main' tip with local commit abc1234.
Remote commits not present locally: def5678 (pushed 12 minutes ago by the CI bot).
Those commits will be unreachable from 'main' after this push.

Do you want to proceed? (yes/no)
```

The prompt must include:

- The exact command as it will be run.
- What remote branch and commits will be affected.
- Any commits that exist on the remote but not locally (if determinable).
- An explicit yes/no question.

### After approval

Execute the command exactly as described. Do not modify the flags or target. If any parameter changes after approval is granted, stop and re-seek approval.

## Examples

### PASS: Correct agent behavior

```
Agent: I need your explicit approval before running:

  git push --force-with-lease origin feature/auth

Reason: the local branch was rebased onto main to resolve a conflict.
Remote tip: abc1234. Local tip after rebase: def5678.
The rebase replaces 3 commits with 3 rewritten equivalents.

Do you want to proceed?

User: yes

Agent: Running git push --force-with-lease origin feature/auth...
```

### FAIL: Incorrect agent behavior — executing without approval

```
Agent: Rebasing is complete. Pushing with --force-with-lease.
[runs git push --force-with-lease without asking]
```

### FAIL: Incorrect agent behavior — reusing prior approval

```
User: [earlier] Yes, go ahead with the force-push.
Agent: [30 minutes later, different situation] Reusing your earlier approval
       to run git push --force again.
```

### FAIL: Incorrect agent behavior — treating --no-verify as routine

```
Agent: The pre-push hook is taking too long. Running with --no-verify
       to skip it and save time.
[runs git push --no-verify without asking]
```

## Scope

This rule applies to:

- All AI agents defined in `.claude/agents/` and `.opencode/agent/`.
- All automation scripts, npm scripts, Makefile targets, and shell helpers in the repository.
- CI workflow steps, unless the workflow file is reviewed through the normal pull-request process and the force-push is explicitly documented in the workflow file itself.

It does not apply to:

- Normal `git push` without destructive flags — agents may run these autonomously.
- `git commit --no-verify` — that is covered separately in the [Code Quality Convention](../quality/code.md) under "Bypassing Hooks".

## Related Documentation

- [Code Quality Convention](../quality/code.md) — Git hooks (Husky, lint-staged, pre-push) that `--no-verify` bypasses.
- [Trunk Based Development Convention](./trunk-based-development.md) — Git workflow and the specific environment branches (`prod-ayokoding-web`, etc.) where CI-managed force-push is explicitly documented.
- [Commit Message Convention](./commit-messages.md) — Conventional Commits format enforced by the commit-msg hook.
- [Reproducible Environments Convention](./reproducible-environments.md) — Why deterministic, consistent operations matter across the team.
