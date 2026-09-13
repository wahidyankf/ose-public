# `@covers` Marker Adoption — ose-infra

Command run: `git grep -l "@covers " -- apps libs` from `~/ose-projects/ose-infra`.

## Raw grep result (8 files)

```text
apps/rhino-cli/src/application/behavior_coverage/mod.rs
apps/rhino-cli/src/application/behavior_coverage/types.rs
apps/rhino-cli/src/application/behavior_coverage/validator.rs
apps/rhino-cli/src/application/domain_coverage/mod.rs
apps/rhino-cli/src/application/mod.rs
apps/rhino-cli/src/cli.rs
apps/rhino-cli/src/commands/specs_coverage.rs
apps/rhino-cli/tests/specs_tree.rs
```

**Total: 8 files, all inside `apps/rhino-cli`.** No file under any other project (`coralpolyp-be`,
`coralpolyp-be-e2e`, `coralpolyp-fe`, `coralpolyp-fe-e2e`, `coralpolyp-contracts`, `ts-ui`,
`ts-ui-tokens`, or any `libs/*`) matches.

## Filtering to genuine markers

The raw `"@covers "` grep over-counts: most hits are doc-comments/prose that mention the `@covers`
convention (e.g. `//! Per-level @covers behavior coverage engine.`), not actual
`// @covers <spec-path>:<scenario-title>` markers. Filtering to the real marker shape
(`// @covers specs/...`) via `git grep -n "// @covers specs/" -- apps libs` gives **15 genuine
markers across 4 files**:

| File                                                            | Genuine `@covers` markers | Grouped by project |
| --------------------------------------------------------------- | ------------------------- | ------------------ |
| `apps/rhino-cli/src/application/behavior_coverage/mod.rs`       | 6                         | rhino-cli          |
| `apps/rhino-cli/src/application/behavior_coverage/validator.rs` | 6                         | rhino-cli          |
| `apps/rhino-cli/src/application/domain_coverage/mod.rs`         | 2                         | rhino-cli          |
| `apps/rhino-cli/src/commands/specs_coverage.rs`                 | 1                         | rhino-cli          |

All 15 genuine markers reference only two spec files:
`specs/apps/rhino/behavior/rhino-cli/gherkin/specs/behavior-coverage.feature` and
`specs/apps/rhino/behavior/rhino-cli/gherkin/specs/domain-coverage.feature` — i.e., rhino-cli's own
meta-specs about its coverage-checking tool. `apps/rhino-cli/tests/specs_tree.rs` and
`apps/rhino-cli/src/application/behavior_coverage/types.rs`/`src/application/mod.rs`/`src/cli.rs`
appear in the raw grep only via doc-comments/step-text prose, not real markers.

## Adoption by project (all 8 registered `coverage.projects`)

| Project                | `@covers` markers     | Adoption     |
| ---------------------- | --------------------- | ------------ |
| `rhino-cli`            | 15 (self-referential) | Sole adopter |
| `coralpolyp-contracts` | 0                     | None         |
| `coralpolyp-be`        | 0                     | None         |
| `coralpolyp-be-e2e`    | 0                     | None         |
| `coralpolyp-fe`        | 0                     | None         |
| `coralpolyp-fe-e2e`    | 0                     | None         |
| `ts-ui-tokens`         | 0                     | None         |
| `ts-ui`                | 0                     | None         |

## Key finding

The `@covers <spec-path>:<scenario-title>` marker convention has **zero adoption outside rhino-cli
itself**, and even within rhino-cli it is used only to cover rhino-cli's own two meta-spec feature
files (`behavior-coverage.feature`, `domain-coverage.feature`) — i.e., it is currently a
self-referential bootstrap/dogfooding mechanism, not a pattern in production use by any of the other
7 registered projects. Generalizing this pattern repo-wide (this plan's goal) starts from a **zero
baseline** everywhere except rhino-cli's own tests. See `04-vacuity-infra.md` for the related finding
that the live CLI command real projects invoke (`specs behavior-coverage validate`) does not even
call the `@covers`-marker engine (`application::behavior_coverage::validator::validate`) — that
engine is wired up only inside rhino-cli's own test suite, not the shipped command path.
