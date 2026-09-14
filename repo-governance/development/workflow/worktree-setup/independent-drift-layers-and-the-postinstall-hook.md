---
description: The two independent worktree drift layers and why guarded dependency synchronization plus transactional Doctor convergence are both required.
when_to_use: Use when explaining why the guarded install and transactional Doctor convergence are independently required, not either alone.
---

# Independent Drift Layers and the `postinstall` Hook

## Two Independent Layers of Drift

A new worktree can hit two independent kinds of toolchain drift, and a single command does not cover both:

1. **Node/Nx dependency drift** — handled by the checksum-pinned HIPPO-guarded `npm install`. `node_modules/` is not tracked by git, so it is not automatically synchronized between worktrees.
2. **Polyglot native toolchain drift** — handled by the transactionally dispatched `npm run doctor -- --fix`. The monorepo spans native toolchains beyond Node — Rust, .NET/F#, and the shell/Terraform/container linters (see [Native-First Toolchain Management](../native-first-toolchain.md)); a session needs any of them to be correct the moment the pre-push hook (`./rhino gate run --surface pre-push`) fans out its affected-projects gates, including `nx affected -t test:quick`.

Skipping either step leaves the other layer vulnerable. Doing only the guarded install handles `node_modules/` but leaves native toolchain drift undetected; doing only transactional Doctor convergence can leave the Nx workspace operating against a stale `node_modules/`.

## The `postinstall` Hook Silently Tolerates Drift

`package.json` defines a `postinstall` hook that runs `npm run doctor || true`. The `|| true` is deliberate — it prevents the guarded install from failing when the polyglot toolchain is drifted, which keeps dependency synchronization usable. But the consequence is that **the guarded install can complete "successfully" while the polyglot toolchain is actually broken**. A human developer or AI agent then tries to run a Rust, .NET, or TypeScript task in the new worktree and hits cryptic errors that aren't traceable to a missing or drifted toolchain.

The explicit, transactionally dispatched `npm run doctor -- --fix` call is the only mechanism that forces active convergence at the moment the worktree session begins.
