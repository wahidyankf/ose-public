---
description: The principles the worktree toolchain initialization practice respects, and its lack of a direct Layer 2 convention.
when_to_use: Use when tracing why the two-step worktree init exists back to the principles it respects.
---

# Principles and Conventions Implemented

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Reproducibility First](../../../principles/software-engineering/reproducibility.md)**: Every worktree operates with a consistent, verified toolchain state. Running the checksum-pinned HIPPO-guarded `npm install` and then the read-only `npm run doctor` at its root, provisioning only on reported drift, aligns that worktree's hooks, `node_modules/`, lockfile, and native toolchain.

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: The toolchain init is an explicit, required two-step action rather than an assumed side effect of worktree creation. The `postinstall` hook in `package.json` does run `npm run doctor || true`, but the trailing `|| true` deliberately swallows doctor failures so the guarded install can complete even when the polyglot toolchain is broken. That tolerance is the right default for installation, but it means the explicit `npm run doctor` invocation is the only thing that guarantees drift is seen, and provisioning follows only when it reports drift. Developers and agents must perform the second step deliberately.

- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**: Codifying a two-step rule enables automated agents and tooling to apply it consistently, reducing the chance of cryptic build, test, or lint failures caused by missing, stale, or drifted dependencies and toolchains.

- **[Root Cause Orientation](../../../principles/general/root-cause-orientation.md)**: Addressing toolchain drift proactively at worktree-entry time is a root-cause fix. Discovering a missing or drifted language toolchain mid-task — through a cryptic Gradle, Cargo, mix, or dotnet error — is a symptom; the root cause is that the worktree's session started work without converging the toolchain first.

## Conventions Implemented/Respected

This practice does not directly implement Layer 2 documentation conventions. The operational context for this practice is governed by development practices referenced in the Related Documentation section.
