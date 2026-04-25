---
title: "Git Push Default Convention"
description: Default git push behavior — direct push to origin main with no PR unless explicitly instructed by user prompt or plan document. Covers linear history requirement and proactive preexisting compliance. Governs plan-maker, plan-checker, plan-fixer, and the plan-execution workflow behavior.
category: explanation
subcategory: development
tags:
  - git
  - workflow
  - push
  - trunk-based-development
  - ai-agents
created: 2026-04-25
---

# Git Push Default Convention

The default git push behavior is a direct push to `origin main` with no pull request. A pull request is created only when the user's prompt or the plan document explicitly requests one. This applies to all contexts: general work, plan creation, plan checking, plan fixing, and plan execution.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Direct push to `main` is the simplest possible workflow. Inserting an unsolicited PR step adds coordination overhead, review delays, and cognitive load without any corresponding benefit when the user's intent is a direct commit.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: The default must be stated, not assumed. "PR unless told otherwise" inverts the explicit intent of Trunk Based Development. Making direct-push the stated default — and PR creation opt-in — keeps the rule legible and verifiable.

- **[Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md)**: Before opening a PR, an agent must confirm it was asked to do so. Acting on an assumed preference for PRs — without evidence in the prompt or plan — is a failure of deliberate problem-solving.

- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)**: When preexisting plan violations of this convention surface during work, fixing them immediately is the root-cause-oriented choice. Deferring known violations accumulates governance debt.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Trunk Based Development Convention](./trunk-based-development.md)**: TBD establishes `main` as the trunk and direct commits as the default workflow. This convention makes the PR-opt-in rule explicit for AI agents.

- **[Plans Organization Convention](../../conventions/structure/plans.md)**: Plan documents must not include PR creation steps in delivery checklists unless the plan spec or user prompt explicitly requires it. This convention governs how agents read and execute delivery checklists.

- **[Proactive Preexisting Error Resolution](../practice/proactive-preexisting-error-resolution.md)**: When a preexisting violation of this convention surfaces during work — such as an existing delivery checklist with an unsolicited PR step — fix it immediately. This convention operationalizes that practice for git-push violations.

## Scope

### What This Convention Covers

- Default push behavior for all commits in this repository.
- Linear history maintenance before every push.
- Agent behavior in all plan contexts: `plan-maker`, `plan-checker`, `plan-fixer`, and the plan-execution workflow.
- Delivery checklist authoring — plan documents must not include unsolicited PR steps.
- Retroactive compliance — preexisting violations fixed when encountered.

### What This Convention Does NOT Cover

- Force-push and `--no-verify` safety rules: governed by the [Git Push Safety Convention](./git-push-safety.md).
- PR merge approval when a PR is opened: governed by the [PR Merge Protocol Convention](./pr-merge-protocol.md).

## Standards

### Standard 1: Default Push Is Direct to main

When committing and pushing changes, use `git push origin main` without creating a branch or pull request.

```bash
# Default workflow — no PR, no branch
git add <files>
git commit -m "feat(scope): description"
git push origin main
```

This is the correct behavior in all of the following situations:

- General development work.
- Plan creation, plan quality-gate runs, and plan archival.
- Governance convention and workflow authoring.
- Agent definition updates under `.claude/agents/`.
- Any other change not explicitly requested as a PR.

### Standard 2: PR Is Opt-In, Not Opt-Out

A pull request is created only when the user's prompt or the plan document contains an explicit instruction to do so. Absent that explicit instruction, the agent pushes directly to `main`.

Phrases that constitute explicit PR instructions:

- "create a PR", "open a PR", "open a pull request", "submit a PR"
- "make a pull request", "raise a PR"
- An explicit `- [ ] Create PR` or `- [ ] Open PR` step in the plan's delivery checklist

No other signals constitute an implicit instruction to create a PR. The agent must not infer a PR intent from:

- The size or risk of the change.
- A desire for "safety" or "review".
- Past sessions in which PRs were created.

### Standard 3: Plans Must Not Include Unsolicited PR Steps

When `plan-maker` authors a delivery checklist, it must not include a `- [ ] Create PR` step or any equivalent unless one of these conditions holds:

1. The user's original prompt explicitly requested a PR.
2. The plan's `prd.md` or `README.md` explicitly states that a PR is required.

`plan-checker` must flag any delivery checklist that contains a PR step without satisfying condition 1 or 2. `plan-fixer` must remove such steps.

The plan-execution workflow must not spontaneously open a PR during delivery unless the active checklist contains an explicit PR step that satisfies the above conditions.

### Standard 4: Maintain Linear History Before Pushing

Before pushing, ensure the local branch has a linear history with respect to `origin/main`. If the remote has moved forward since the last pull, rebase rather than merge:

```bash
# If remote has new commits since last pull, rebase first
git pull --rebase origin main
# Then push
git push origin main
```

Never create merge commits when pushing to `main`. A merge commit in the history violates this standard. If a merge commit appears locally, squash or rebase it before pushing.

### Standard 5: Proactively Fix Preexisting Violations

When working on plans or performing any task that involves reading delivery checklists, and you encounter an existing checklist with an unsolicited PR step, remove that step as part of your current work. Do not defer it.

This applies Standard 4 of [Proactive Preexisting Error Resolution](../practice/proactive-preexisting-error-resolution.md) to this convention specifically: an unsolicited PR step in a plan you touch is an error to fix now, not flag for later.

**Scope of "fix now"**: remove the unsolicited PR step from the checklist and, if the plan is in `plans/in-progress/`, note the fix in the same commit message. If the plan is in `plans/done/` (archived), leave it — historical records are read-only.

## Examples

### PASS: Correct behavior — direct push without PR

```
Plan executor: Committing governance convention.

  git add governance/development/workflow/git-push-default.md
  git commit -m "feat(governance): add git push default convention"
  git push origin main

Done. Convention is now on main.
```

### FAIL: Incorrect behavior — unsolicited PR creation

```
Plan executor: Committing governance convention.

  git add governance/development/workflow/git-push-default.md
  git push origin feature/git-push-default

Creating pull request...
  gh pr create --draft --base main --title "feat(governance): add git push default convention"

PR opened: #42
```

No PR was requested. This is wrong.

### PASS: Correct behavior when PR is explicitly requested

User prompt: "Create a convention for X and open a PR for review."

```
Plan executor: Committing convention and opening PR as requested.

  git checkout -b feature/convention-x
  git add governance/development/workflow/convention-x.md
  git commit -m "feat(governance): add convention x"
  git push origin feature/convention-x
  gh pr create --draft --base main --title "feat(governance): add convention x"

Draft PR opened as requested.
```

### FAIL: Incorrect plan-maker behavior — inserting PR step without instruction

User prompt: "Plan a governance update for Y."

```markdown
<!-- In delivery.md — WRONG -->

- [ ] Create convention file
- [ ] Update README index
- [ ] git add and commit
- [ ] Create PR for review ← unsolicited; must be removed
```

`plan-checker` must flag this step. `plan-fixer` must remove it.

### PASS: Correct linear history before push

```bash
# Remote moved forward — rebase first
git pull --rebase origin main
git push origin main
```

### FAIL: Merge commit created on push

```bash
# Wrong — creates merge commit
git pull origin main       # produces merge commit
git push origin main       # pushes linear-history violation
```

Use `--rebase` instead.

### PASS: Proactive fix of preexisting violation

While executing Plan A, the plan-execution workflow reads `plans/in-progress/2026-03-01__feature-x/delivery.md` and finds:

```markdown
- [x] Implement feature
- [ ] Create PR ← unsolicited, no PR instruction in plan or prompt
```

Correct behavior: remove `- [ ] Create PR` inline, include in the same commit as the plan work.

## Agent Responsibilities

| Agent                   | Responsibility                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `plan-maker`            | Must not insert PR steps in delivery checklists unless explicitly instructed.                                          |
| `plan-checker`          | Must flag unsolicited PR steps in delivery checklists as a HIGH finding.                                               |
| `plan-fixer`            | Must remove unsolicited PR steps from delivery checklists.                                                             |
| plan-execution workflow | Must push directly to `main`; must rebase to maintain linear history; must fix preexisting unsolicited PR steps found. |

## Related Documentation

- [Trunk Based Development Convention](./trunk-based-development.md) — Git workflow establishing `main` as the trunk and direct commits as the default.
- [Git Push Safety Convention](./git-push-safety.md) — Approval rules for force-push and `--no-verify`.
- [PR Merge Protocol Convention](./pr-merge-protocol.md) — Approval rules when a PR is opened (applies in the opt-in PR case).
- [Proactive Preexisting Error Resolution](../practice/proactive-preexisting-error-resolution.md) — Practice governing proactive fixes of discovered violations.
- [Plans Organization Convention](../../conventions/structure/plans.md) — Delivery checklist authoring standards.
