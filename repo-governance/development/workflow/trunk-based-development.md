---
description: Git workflow using Trunk Based Development (TBD) for continuous integration and rapid delivery
when_to_use: Use when deciding how a change reaches main, choosing a delivery mode, or checking whether a branch/workflow shape is TBD-compliant.
---

# Trunk Based Development Convention

<!--
  MAINTENANCE NOTE: Master reference for TBD workflow
  This is duplicated (intentionally) in multiple files for different audiences:
  1. repo-governance/development/workflow/trunk-based-development.md (this file - comprehensive reference)
  2. AGENTS.md (summary for AI agents)
  3. .claude/agents/plan/plan-maker.md (context for plan creation — hand-authored source;
     registry-declared generated agent mirrors under .opencode/ and .codex/ are never hand-edited)
  4. repo-governance/workflows/plan/plan-execution.md (context for plan execution — orchestrated by the calling context)
  5. .agents/skills/repo-practicing-trunk-based-development/SKILL.md (operator-facing invocable
     entry point)
  6. .agents/skills/plan-creating-project-plans/SKILL.md (plan-authoring skill's own Delivery Mode
     summary)
  7. .agents/skills/plan-grooming-idea-briefs/SKILL.md (plan-ideas-grooming workflow's invocable
     entry point)
  Skill sources remain in .agents/skills/: OpenCode reads them natively, while the binding
  generator mirrors them to non-vendored paths under .agents/skills/ for Codex. Never hand-edit a
  generated mirror; registry-declared vendored plugin subtrees remain hand-maintained.
  When updating, synchronize all seven locations.
-->

This document defines the **Trunk Based Development (TBD)** workflow used in the open-sharia-enterprise project. TBD is a branching strategy where developers commit directly to a single branch (the trunk), enabling continuous integration, rapid feedback, and simplified collaboration.

## Contents

- [Principles and Conventions Implemented](./trunk-based-development/principles-and-conventions-implemented.md) — Why TBD is used here.
- [What is Trunk Based Development?](./trunk-based-development/what-is-trunk-based-development.md) — Definition and core characteristics.
- [Short-Lived Branch-via-PR Flavor, and Why We Use TBD](./trunk-based-development/short-lived-branch-via-pr-flavor-and-why-we-use-tbd.md) — Why a PR branch doesn't contradict TBD.
- [Default Branch and Working on Main Directly](./trunk-based-development/default-branch-and-working-on-main-directly.md) — No develop/release/hotfix branches.
- [Short-Lived Branches (the Default Shape)](./trunk-based-development/short-lived-branches-the-default-shape.md) — worktree-to-pr workflow and lifespan rules.
- [Feature Flags for Incomplete Work](./trunk-based-development/feature-flags-for-incomplete-work.md) — Boolean, environment, and user-based flags.
- [Continuous Integration and Small, Incremental Changes](./trunk-based-development/continuous-integration-and-small-incremental-changes.md) — Pre-push checklist and small commits.
- [Default Push and Worktree Execution](./trunk-based-development/default-push-and-worktree-execution.md) — Overview of the four delivery modes.
- [Default Delivery Mode: `worktree-to-pr`](./trunk-based-development/default-delivery-mode-worktree-to-pr.md) — Work location, target, merge authority.
- [Why Draft, and Direct-Push Modes](./trunk-based-development/why-draft-and-direct-push-modes.md) — Draft rationale; the two direct-push modes' scope.
- [Mode Selection and Decision Table](./trunk-based-development/mode-selection-and-decision-table.md) — Resolving the active mode.
- [Key Principle](./trunk-based-development/key-principle.md) — The three-tier precedence.
- [When Branches Are Appropriate](./trunk-based-development/when-branches-are-appropriate.md) — Review, spikes, contributors, compliance, deployment.
- [What NOT to Do](./trunk-based-development/what-not-to-do.md) — Anti-pattern table.
- [Plans Declare a Delivery Mode](./trunk-based-development/plans-declare-a-delivery-mode.md) — Default assumption and worked example.
- [When Plans Override the Default Mode](./trunk-based-development/when-plans-override-the-default-mode.md) — The three override reasons.
- [TBD Benefits for This Project](./trunk-based-development/tbd-benefits-for-this-project.md) — Solo/small team, scaling, deployment.
- [Migration from Feature Branches](./trunk-based-development/migration-from-feature-branches.md) — Mindset shifts and transition steps.

## Related Practices

TBD works best combined with CI and Feature Flags (above), Automated Testing, and Small Commits
([Conventional Commits](../workflow/commit-messages.md)). See also:

- [PR Merge Protocol](../workflow/pr-merge-protocol.md) — merge preconditions and the done-boundary.
- [Git Push Default Convention](../workflow/git-push-default.md) — PR-branch-as-default push target.
- [CI Post-Push Verification](../workflow/ci-post-push-verification.md) — verification after every push.
- [Worktree Toolchain Initialization](../workflow/worktree-setup.md) — two-step init after worktree creation.

## References and Further Reading

- **[TrunkBasedDevelopment.com](https://trunkbaseddevelopment.com/)** - Official TBD resource
- **Conventional Commits**: [Commit Message Convention](../workflow/commit-messages.md)
- **Development Practices**: [Development Index](../README.md)
