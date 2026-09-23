---
description: Practice for initializing dependencies, hooks, and the polyglot toolchain in each new worktree's root immediately after creation
when_to_use: Use immediately after creating a git worktree, before Git mutations or Nx commands in it.
---

# Worktree Toolchain Initialization

After creating a git worktree, initialize dependencies, Git hooks, and the polyglot
toolchain from the **root directory of that worktree** with a mandatory two-step sequence:

1. Run `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install` at that worktree root.
   Besides dependencies, `prepare` activates Husky hooks.
2. Run `rtk npm run doctor` at the same worktree root. It is a read-only
   `./rhino toolchain validate` that carries its own HIPPO guard; never wrap it or pass it arguments.
   Only when it reports a missing or drifted toolchain, run
   `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino toolchain provision --apply`,
   then `rtk npm run doctor` again.

Both steps are required. The first makes that checkout's hooks and Node/Nx dependencies usable;
the second proves the declared native toolchains are present and provisions them only on reported
drift. The retired `npm run doctor -- --fix` form now exits 2.

In a repository without npm, use its declared root bootstrap only when it installs local
dependencies and Git hooks; never invent or infer an equivalent command.

## Contents

- [Principles and Conventions Implemented](./worktree-setup/principles-and-conventions-implemented.md) — Why this practice exists.
- [The Rule](./worktree-setup/the-rule.md) — The exact two-step command sequence and its drift-only provisioning branch.
- [Independent Drift Layers and the `postinstall` Hook](./worktree-setup/independent-drift-layers-and-the-postinstall-hook.md) — Why both steps are independently required.
- [Dependency Isolation, Language Breadth, and Idempotency](./worktree-setup/dependency-isolation-language-breadth-and-idempotency.md) — Why every new worktree needs the init.
- [What Goes Wrong Without Both Steps](./worktree-setup/what-goes-wrong-and-nx-node-modules-dependency.md) — Build/test/lint/cache failure modes.
- [Per-Project Dependency Restoration](./worktree-setup/per-project-dependency-restoration.md) — The F#/.NET `dotnet restore` gap.
- [Per-Project Generated Sources](./worktree-setup/per-project-generated-sources.md) — The gitignored-codegen gap that surfaces as a broken import.
- [Sibling-Repo Relative Paths From Inside a Worktree](./worktree-setup/sibling-repo-relative-paths.md) — Correct path nesting in multi-repo plans.
- [Absolute Source Paths in Delivery-Checklist Commands](./worktree-setup/absolute-source-paths-in-delivery-checklist-commands.md) — Worktree copy vs. stale primary-checkout path.
- [When This Applies](./worktree-setup/when-this-applies.md) — The five triggering conditions.
- [Step-by-Step Procedure](./worktree-setup/step-by-step-procedure.md) — The five numbered steps.
- [Notes for AI Agents](./worktree-setup/notes-for-ai-agents.md) — The MUST-run-both-steps rule for agents.

## Related Documentation

- [Worktree Path Convention](../../conventions/structure/worktree-path.md) - Repo-root `worktrees/<name>/` override and the WorktreeCreate hook
- [Reproducible Environments](../workflow/reproducible-environments.md) - Volta pinning and lockfile management
- [Native-First Toolchain Management](../workflow/native-first-toolchain.md) - Native package managers and `./rhino toolchain validate`
- [AI Agents Convention](../agents/ai-agents.md) - Git Worktree Awareness rules for agents
- [Trunk Based Development](../workflow/trunk-based-development/default-push-and-worktree-execution.md#default-push-and-worktree-execution) - The repo-wide default delivery mode is `worktree-to-pr`
- [Git Push Default Convention](../workflow/git-push-default.md) - The PR-branch-as-default push target
- [Nx Targets](../infra/nx-targets.md) - Canonical Nx target names and caching rules
