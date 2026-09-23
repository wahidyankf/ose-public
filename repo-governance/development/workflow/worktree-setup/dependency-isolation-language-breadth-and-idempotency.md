---
description: Why node_modules is not shared across worktrees, why worktrees routinely need many language toolchains, and why read-only Doctor validation is cheap to run unconditionally.
when_to_use: Use when explaining why every new worktree needs the two-step init regardless of stated task scope.
---

# Dependency Isolation, Language Breadth, and Idempotency

## Dependency Isolation in Git Worktrees

Git worktrees share the `.git` directory but each worktree has its own working tree — its own copies of tracked files. `node_modules/` is not tracked by git, so it is not automatically synchronized between worktrees.

When the Nx workspace resolves dependencies, it reads from `node_modules/` relative to the workspace root. If `package-lock.json` was updated in a worktree that is not the root, the root `node_modules/` becomes stale. Nx commands in any worktree then operate against dependency versions that do not match the lockfile.

## Worktrees Routinely Touch Many Languages

AI agents working on worktrees routinely touch apps across many languages: `ose-be` and `organiclever-be` (F#/Giraffe), `crane-cli` (F#), `ferret-cli` (Python), `roots-be` (Go), TypeScript frontends, and more. The probability that a new worktree session will need a toolchain that has drifted is high, and the cost of discovering the drift mid-task — through an obscure Gradle, Go, or `dotnet` error — is much higher than the cost of running `npm run doctor` deliberately upfront.

Even worktree sessions whose stated intent is "I'm just editing docs" should run the full two-step init, because the pre-push hook runs `./rhino gate run --surface pre-push`, whose registry gates (including `nx affected -t test:quick`) can fan out to arbitrary language tasks depending on what the doc change touches.

## Doctor Validation Is Read-Only and Fast When Healthy

`npm run doctor` only probes the toolchains `repo-config.yml` declares; it never installs anything, so running it on a healthy machine changes nothing. Provisioning runs only when that probe reports drift, and per [Native-First Toolchain Management](../native-first-toolchain.md) the native package managers behind it (`brew`, `volta`, `asdf`, `pyenv`, `cargo install`, `rustup`, etc.) are idempotent. The cost of validating when creating every worktree is very low; the cost of skipping it and hitting drift later is high.
