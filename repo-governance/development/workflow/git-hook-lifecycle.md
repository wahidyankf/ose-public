---
description: Registry-backed lifecycle for the three Husky hook shims and their CI relationship
when_to_use: Use when a Husky hook is failing, when adding or changing a pre-commit/pre-push/commit-msg gate, or when you need to know how local hooks relate to CI checks.
---

# Git Hook Lifecycle

The three Husky files are thin shims. The gate registry in
[`repo-config.yml`](../../../repo-config.yml) is the normative source for their commands, scope, order, and CI
relationship. Do not copy a command list into a hook or this document.

## Discover the current gate set

Use the registry projection for the repository and surface being inspected:

```sh
./rhino gate list
./rhino gate validate
```

`gate validate` checks each gate's lifecycle membership and the pull-request composition. The legacy `lint-staged`
block was retired on 2026-09-19.

## Hook shims

| Git event      | Shim                | Delegation                                                  |
| -------------- | ------------------- | ----------------------------------------------------------- |
| Commit message | `.husky/commit-msg` | `./rhino gate run --surface commit-msg --message-file "$1"` |
| Before commit  | `.husky/pre-commit` | `./rhino gate run --surface pre-commit`                     |
| Before push    | `.husky/pre-push`   | `./rhino gate run --surface pre-push --push-updates-stdin`  |

Each shim runs its one command inside a `./hippo run` boundary. The shims hold no checks: every check is an ordinary
registry entry. Each local surface holds only the entries its allowed list names (`pre-commit`: `format-staged`;
`commit-msg`: `commit-message`; `pre-push`: `public-safety-range`), and every other entry runs at the `pull-request`
surface.

The dispatcher runs each declared gate in registry order and stops at the first failure. A hook failure aborts its
Git operation; fix the reported gate and retry.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
flowchart LR
    accTitle: Hook shims
    accDescr: git commit leads to commit-msg shim; git commit leads to pre-commit shim; git push leads to pre-push shim; commit-msg shim leads to registry gates; pre-commit shim leads to registry gates; and 2 more links.
    Commit["git commit"] --> Message["commit-msg shim"]
    Commit --> PreCommit["pre-commit shim"]
    Push["git push"] --> PrePush["pre-push shim"]
    Message --> Registry["registry gates"]
    PreCommit --> Registry
    PrePush --> Registry
    Registry --> CI["PR quality gate"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef tone fill:#029E73,stroke:#000000,color:#000000
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    class Commit,Push blue
    class Registry tone
    class CI orange
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Staged paths and formatting

A gate with a `files` input receives paths, not the whole tree. `pre-commit` binds the staged index
(`source: git-index`), and the `pull-request` surface binds the changed range (`source: explicit-range`). Each
command selects the file types it owns, so one declaration serves both surfaces.

Formatting is one `mutation` gate, `format-staged`, which calls `scripts/format-staged` to pick each path's formatter
by extension. Its `mutation` block declares both modes: locally (`local: apply-index`) Rhino applies the formatted
bytes to the index; on the pull-request surface (`ci: verify-clean`) it replays the formatter and fails if any byte
would change. CI never commits formatter fixes.

## CI relationship

Pre-commit runs only the staged formatter, and pre-push runs only the leak scan over the pushed range. The
`pr-quality-gate.yml` workflow, on every pull request, runs the `pull-request` surface in its `Repository policy`
job through `./rhino gate run --surface pull-request --base <sha> --head <sha>`, and runs affected `typecheck`,
`lint`, and `test:quick` in its language-detected jobs. Neither a hook nor the PR gate may invoke Integration or E2E
runtime directly or transitively; scheduled/manual full-quality workflows own complete Integration and E2E execution.

## Bypass policy

Skipping hooks with `--no-verify` needs explicit authorization that names the bypass for that one operation, as
[Git Push Safety](git-push-safety.md) requires, except the
[worktree-to-PR pre-authorization](git-push-safety/rule.md#worktree-to-pr-pre-authorization) on a task-owned
`worktree-to-pr` branch. A request to commit or push never implies it, and there is no emergency or
CI-blocker-investigation exception. A bypass does not remove the CI gate, and it must never be used to avoid fixing a
registry, generated-artifact, or hook conformance failure.

See [SDLC Gate Standard](../../../docs/reference/sdlc-gate-standard.md) for the governing rule and
[CI blocker resolution](../quality/ci-blocker-resolution.md) for investigation procedure.

## Principles Implemented/Respected

- [Automation Over Manual](../../principles/software-engineering/automation-over-manual.md) — hooks
  and CI run the declared checks automatically.
- [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) — the
  registry owns gate IDs, ordering, scope, and lifecycle surfaces.
- [Reproducibility](../../principles/software-engineering/reproducibility.md) — local and CI
  projections derive from the same declaration.

## Conventions Implemented/Respected

- [Specs Directory Structure](../../conventions/structure/specs-directory-structure.md) — no declared
  gate runs a specs validator; structure is review-owned, and Gherkin coverage runs in the PR
  workflow's `test:quick`.
- [Governance Word Budget](../../conventions/structure/governance-word-budget.md) — its validator is
  the `word-budget` gate on the pull-request surface.
