---
title: Worktree Toolchain Initialization
description: Practice for initializing the full polyglot toolchain (npm install + doctor --fix) in the root repository worktree after creating or entering a git worktree
category: explanation
subcategory: development
tags:
  - development
  - git
  - worktree
  - npm
  - nx
  - dependencies
  - toolchain
  - doctor
created: 2026-03-28
---

# Worktree Toolchain Initialization

After creating or entering a git worktree in this repository, always initialize the full polyglot toolchain in the **root repository worktree** with a mandatory two-step sequence:

1. Run `npm install` in the root repository worktree.
2. Run `npm run doctor -- --fix` in the root repository worktree.

Both steps are required. The first ensures the Nx workspace and its Node/TypeScript dependencies remain functional; the second actively converges the 18+ polyglot toolchains (Go, Java, Rust, Elixir, Python, .NET, Dart, Clojure, Kotlin, C#, Node) managed by `rhino-cli doctor` so that any language task the worktree's work touches resolves against a healthy toolchain.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Reproducibility First](../../principles/software-engineering/reproducibility.md)**: Every worktree operates with a consistent, verified toolchain state across all 11 languages. Running both `npm install` and `npm run doctor -- --fix` eliminates divergence between the root worktree's `node_modules/`, the current `package-lock.json`, and the installed native toolchain — making builds deterministic regardless of which worktree is active.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: The toolchain init is an explicit, required two-step action rather than an assumed side effect of worktree creation. The `postinstall` hook in `package.json` does run `npm run doctor || true`, but the trailing `|| true` deliberately swallows doctor failures so `npm install` can complete even when the polyglot toolchain is broken. That tolerance is the right default for `npm install`, but it means the explicit `npm run doctor -- --fix` invocation is the only thing that guarantees convergence. Developers and agents must perform the second step deliberately.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Codifying a two-step rule enables automated agents and tooling to apply it consistently, reducing the chance of cryptic build, test, or lint failures caused by missing, stale, or drifted dependencies and toolchains.

- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)**: Addressing toolchain drift proactively at worktree-entry time is a root-cause fix. Discovering a missing or drifted language toolchain mid-task — through a cryptic Gradle, Cargo, mix, or dotnet error — is a symptom; the root cause is that the worktree's session started work without converging the toolchain first.

## Conventions Implemented/Respected

This practice does not directly implement Layer 2 documentation conventions. The operational context for this practice is governed by development practices referenced in the Related Documentation section.

## The Rule

**After every `git worktree add`, `EnterWorktree` invocation, or any other entry into a worktree session (human or agent), run BOTH of the following in the root repository worktree, in order:**

```bash
# Run these in the ROOT repository worktree path, not the new worktree.
cd /path/to/root/open-sharia-enterprise

# Step 1: Node/Nx workspace dependencies (node_modules/)
npm install

# Step 2: Full polyglot toolchain convergence (Go, Java, Rust, Elixir, Python,
# .NET, Dart, Clojure, Kotlin, C#, Node — all languages managed by rhino-cli)
npm run doctor -- --fix
```

The root worktree is the primary checkout of the repository — the directory that contains the canonical `node_modules/` used by Nx across all worktrees. Replace `/path/to/root/open-sharia-enterprise` with the actual absolute path to the root checkout on the current machine.

**Order matters.** Run `npm install` first, because `rhino-cli doctor` itself is a Go binary built and invoked through the Node tooling; the doctor script may need a freshly synchronized `node_modules/` to run correctly. Run `npm run doctor -- --fix` second to actively converge the native toolchain.

**Use `--fix`, not plain `doctor`.** Plain `npm run doctor` only detects drift and requires a second human action. `npm run doctor -- --fix` actively converges to the declared toolchain state in a single step. If a human wants a preview of what would change first, use `npm run doctor -- --fix --dry-run`.

## Why This Is Necessary

### Two Independent Layers of Drift

A new or newly-entered worktree session can hit two independent kinds of toolchain drift, and a single command does not cover both:

1. **Node/Nx dependency drift** — handled by `npm install`. `node_modules/` is not tracked by git, so it is not automatically synchronized between worktrees.
2. **Polyglot native toolchain drift** — handled by `npm run doctor -- --fix`. The monorepo spans 18+ toolchains across 11 languages (see [Native-First Toolchain Management](./native-first-toolchain.md)); a session needs any of them to be correct the moment the pre-push hook fans out `nx affected -t typecheck lint test:quick spec-coverage`.

Skipping either step leaves the other layer vulnerable. Doing only `npm install` handles `node_modules/` but leaves native toolchain drift undetected; doing only `npm run doctor -- --fix` converges the native toolchain but can leave the Nx workspace operating against a stale `node_modules/`.

### The `postinstall` Hook Silently Tolerates Drift

`package.json` defines a `postinstall` hook that runs `npm run doctor || true`. The `|| true` is deliberate — it prevents `npm install` from failing when the polyglot toolchain is drifted, which is the right default for `npm install` to remain usable as a dependency-sync command. But the consequence is that **`npm install` can complete "successfully" while the polyglot toolchain is actually broken**. A human developer or AI agent then tries to run a Go, Java, Rust, Elixir, Python, .NET, Dart, Clojure, Kotlin, or C# task in the new worktree and hits cryptic errors that aren't traceable to a missing or drifted toolchain.

The explicit `npm run doctor -- --fix` call is the only mechanism that forces active convergence at the moment the worktree session begins.

### Dependency Isolation in Git Worktrees

Git worktrees share the `.git` directory but each worktree has its own working tree — its own copies of tracked files. `node_modules/` is not tracked by git, so it is not automatically synchronized between worktrees.

When the Nx workspace resolves dependencies, it reads from `node_modules/` relative to the workspace root. If `package-lock.json` was updated in a worktree that is not the root, the root `node_modules/` becomes stale. Nx commands in any worktree then operate against dependency versions that do not match the lockfile.

### Worktrees Routinely Touch Many Languages

AI agents working on worktrees routinely touch apps across many languages: `organiclever-be` in F#, `rhino-cli` and other Go CLIs, TypeScript frontends, and more. The probability that a new worktree session will need a toolchain that has drifted is high, and the cost of discovering the drift mid-task — through an obscure Gradle, Cargo, `mix`, or `dotnet` error — is much higher than the cost of running `npm run doctor -- --fix` deliberately upfront.

Even worktree sessions whose stated intent is "I'm just editing docs" should run the full two-step init, because the pre-push hook runs `nx affected -t typecheck lint test:quick spec-coverage` which can fan out to arbitrary language tasks depending on what the doc change touches.

### `doctor --fix` Is Idempotent and Fast When Healthy

Per [Native-First Toolchain Management](./native-first-toolchain.md), every package manager backing `doctor --fix` (`brew`, `volta`, `asdf`, `pyenv`, `cargo install`, `rustup`, etc.) is idempotent. When the toolchain is already healthy, `doctor --fix` is a no-op pass; when it has drifted, it actively converges. The cost of running it unconditionally on every worktree entry is very low; the cost of skipping it and hitting drift later is high.

### What Goes Wrong Without Both Steps

Without running both steps after worktree creation or entry, these failures can occur:

- **Build failures**: A dependency that a new worktree's code requires may be absent or at the wrong version, or a native compiler (javac, rustc, ghc, `dotnet`) may be missing entirely.
- **Test failures**: Test runners (Vitest, Jest, Playwright, Gradle, Cargo, Mix, pytest, `dotnet test`, Godog) may resolve the wrong module versions or fail to launch at all.
- **Lint failures**: Linters may behave differently when versions mismatch, or may not be installed at all for the language a new file uses.
- **Nx cache invalidation**: Nx computes cache keys based on inputs including resolved module versions. A stale `node_modules/` causes cache misses or incorrect cache hits.
- **Cryptic errors**: Dependency and toolchain mismatches often surface as obscure runtime errors rather than clear "missing module" or "missing tool" messages, making them harder to diagnose.

### Nx Workspace Dependency on `node_modules` State

Nx task caching, project graph resolution, and executor plugins all depend on a consistent `node_modules/` state in the workspace root. When `node_modules/` diverges from `package-lock.json`, the entire workspace behaves unpredictably — not just the files that changed.

## When This Applies

Run both steps in the root worktree after any of the following:

1. Running `git worktree add` to create a new worktree.
2. Using the `EnterWorktree` tool in the coding agent, which creates a worktree automatically.
3. An AI agent with `isolation: "worktree"` spawning a new worktree for isolated work.
4. A human `cd`-ing into an existing worktree to continue or resume work in a new session.
5. Any other mechanism that creates or re-enters a worktree in this repository.

The rule is **triggered by execution mode, not by intent**. Even "small" or "docs-only" worktree entries go through the two-step init. This step applies to both human developers and AI agents operating in this repository.

## Step-by-Step Procedure

1. Create or enter the worktree using your preferred method:

   ```bash
   git worktree add worktrees/my-feature-branch my-feature-branch
   ```

   This repo overrides the Claude Code default worktree path — worktrees land at repo-root `worktrees/<name>/`, not `.claude/worktrees/<name>/`. See [worktree-path.md](../../conventions/structure/worktree-path.md) for the convention and the WorktreeCreate hook that enforces it.

2. Identify the root repository worktree path. This is the directory containing the canonical checkout — typically the parent of `worktrees/`.

3. Run `npm install` in the root worktree:

   ```bash
   cd /path/to/root/open-sharia-enterprise
   npm install
   ```

4. Run `npm run doctor -- --fix` in the root worktree:

   ```bash
   npm run doctor -- --fix
   ```

   This command is idempotent — when the toolchain is already healthy it is a no-op pass; when drifted it actively converges. To preview changes without applying them, use `npm run doctor -- --fix --dry-run`.

5. Confirm both steps completed without errors before running any Nx commands in the new worktree.

## Notes for AI Agents

Agents that create or enter worktrees via `git worktree add`, the `EnterWorktree` tool, or an `isolation: "worktree"` configuration MUST run BOTH `npm install` AND `npm run doctor -- --fix` in the root repository worktree as immediate follow-up steps, in that order. Doing only one of the two steps is not sufficient and is treated as a rule violation.

The root worktree path is available from the environment context or can be confirmed with `git worktree list`. See the [Git Worktree Awareness](../agents/ai-agents.md#git-worktree-awareness) section of the AI Agents Convention for the full set of rules governing agent behavior in worktrees.

## Related Documentation

- [Worktree Path Convention](../../conventions/structure/worktree-path.md) - Repo-root `worktrees/<name>/` override and the WorktreeCreate hook that enforces it
- [Reproducible Environments](./reproducible-environments.md) - Practices for consistent development environments, including Volta pinning and lockfile management
- [Native-First Toolchain Management](./native-first-toolchain.md) - Architectural decision to use native package managers and `rhino-cli doctor` for toolchain management across 11 languages
- [AI Agents Convention](../agents/ai-agents.md) - Git Worktree Awareness rules for agents operating across worktrees
- [Trunk Based Development](./trunk-based-development.md) - Git workflow for this repository; the default is direct push to `main` regardless of execution context. See the [Default Push and Worktree Execution](./trunk-based-development.md#default-push-and-worktree-execution) section for the decision table on when a draft PR is used instead.
- [Nx Targets](../infra/nx-targets.md) - Canonical Nx target names and caching rules that depend on a consistent dependency state
