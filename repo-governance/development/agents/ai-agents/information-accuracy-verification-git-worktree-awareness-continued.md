---
description: "Continues Git Worktree Awareness with the default-push-behaviour rule, a worked example, and the consequence of violating the rules."
when_to_use: Use when an agent running inside a worktree needs to know its default push/PR behaviour or wants a worked pass/fail path example.
---

# Information Accuracy and Verification — Git Worktree Awareness: Default Push Behaviour and Example

1. **Default push behaviour applies in worktrees — `worktree-to-pr` is the default; direct push is the explicit selection** — Running inside a `.claude/worktrees/` path (or any other `git worktree add` target) resolves, absent an explicit override, to the repo-wide default delivery mode: `worktree-to-pr` — a short-lived plan branch pushed to a draft PR opened against `main`. Direct push to `origin main` (the `worktree-to-origin-main` mode) applies only when explicitly selected via an invocation argument or a plan's `## Delivery Mode` field — never inferred from execution context. By default the agent pushes to a feature branch and opens a draft PR (`gh pr create --draft --base main ...`); the [PR Merge Protocol](../../workflow/pr-merge-protocol.md) preconditions gate the merge once the draft is flipped to ready-for-review. See the [Default Push and Worktree Execution](../../workflow/trunk-based-development/default-push-and-worktree-execution.md#default-push-and-worktree-execution) section of the Trunk Based Development Convention and the [Plans Organization Convention — Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode) for the full three-tier precedence (invocation argument > plan field > default).

**Example**:

```markdown
<!-- PASS: Relative path — resolves correctly in any worktree -->

Read: repo-governance/development/agents/ai-agents.md

<!-- FAIL: Hardcoded main-checkout path — reads stale content when run in a worktree -->

Read: /Users/<name>/ose-projects/ose-public/repo-governance/development/agents/ai-agents.md
```

**Consequence of violation**: A checker agent reads a file from the main checkout after a fixer has already corrected it in the active worktree. The checker reports the issue as "not fixed" because it compared against stale content, producing a false negative and blocking the workflow.
