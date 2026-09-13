# `@covers` Marker Adoption — ose-public

Command run: `git grep -l "@covers " -- apps libs` from `~/ose-projects/ose-public`
(2026-07-04).

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

**Total: 8 files, all inside `apps/rhino-cli`.** No file under any other project (`ose-be`, `ose-app-web`,
`ose-www`, `ose-cli`, `organiclever-be`, `organiclever-app-web`, `organiclever-www`, `ayokoding-www`,
`ayokoding-cli`, `wahidyankf-www`, `crane-cli`, or any `libs/*`) matches. This **confirms** the prior
finding stated in the task brief exactly: 8 files, all under `apps/rhino-cli/`, 0 elsewhere.

## Filtering to genuine markers

The raw `"@covers "` grep over-counts: several hits are doc-comments/prose that mention the `@covers`
convention (e.g. `//! Per-level @covers behavior coverage engine.` in `mod.rs`, or step-text
prose in `specs_tree.rs`/`types.rs` describing the marker format), not actual
`// @covers <spec-path>:<scenario-title>` markers. Filtering to the real marker shape via
`git grep -n "// @covers specs/" -- apps libs` gives **15 genuine markers across 4 files**:

| File                                                            | Genuine `@covers` markers | Project     |
| --------------------------------------------------------------- | ------------------------- | ----------- |
| `apps/rhino-cli/src/application/behavior_coverage/mod.rs`       | 6                         | `rhino-cli` |
| `apps/rhino-cli/src/application/behavior_coverage/validator.rs` | 6                         | `rhino-cli` |
| `apps/rhino-cli/src/application/domain_coverage/mod.rs`         | 2                         | `rhino-cli` |
| `apps/rhino-cli/src/commands/specs_coverage.rs`                 | 1                         | `rhino-cli` |

All 15 genuine markers reference only two spec files:
`specs/apps/rhino/behavior/rhino-cli/gherkin/specs/behavior-coverage.feature` and
`specs/apps/rhino/behavior/rhino-cli/gherkin/specs/domain-coverage.feature` — i.e., rhino-cli's own
meta-specs about its coverage-checking tool. `apps/rhino-cli/tests/specs_tree.rs` and
`apps/rhino-cli/src/application/behavior_coverage/types.rs`/`src/application/mod.rs`/`src/cli.rs`
appear in the raw 8-file grep only via doc-comments/step-text prose, not real markers (verified by
inspecting each: `types.rs` and `mod.rs` (application) only have module doc-comments describing the
convention; `cli.rs` references `@covers` inside a Rust doc-comment on a test name; `specs_tree.rs`
uses `@covers` only inside a Gherkin step-text string it asserts against, not as a source-code marker
on itself).

## Adoption by project (all 26 registered `coverage.projects`)

| Project                                    | `@covers` markers     | Adoption     |
| ------------------------------------------ | --------------------- | ------------ |
| `rhino-cli`                                | 15 (self-referential) | Sole adopter |
| `ose-be` / `ose-be-e2e`                    | 0                     | None         |
| `ose-app-web` / `-e2e`                     | 0                     | None         |
| `ose-www` / `-be-e2e` / `-fe-e2e`          | 0                     | None         |
| `ose-cli`                                  | 0                     | None         |
| `organiclever-be` / `-e2e`                 | 0                     | None         |
| `organiclever-app-web` / `-e2e`            | 0                     | None         |
| `organiclever-www` / `-be-e2e` / `-fe-e2e` | 0                     | None         |
| `ayokoding-www` / `-be-e2e` / `-fe-e2e`    | 0                     | None         |
| `ayokoding-cli`                            | 0                     | None         |
| `wahidyankf-www` / `-fe-e2e`               | 0                     | None         |
| `crane-cli`                                | 0                     | None         |
| `rust-commons`                             | 0                     | None         |
| `web-ui`                                   | 0                     | None         |
| `fsharp-crane-core`                        | 0                     | None         |

## Related finding: even rhino-cli's own genuine markers are not exercised by the shipped CLI path

Tracing the 4 files carrying genuine markers: `apps/rhino-cli/src/application/behavior_coverage/{mod.rs,
validator.rs}` implement the `@covers`/level-tag validation _engine_ itself
(`application::behavior_coverage::validator::validate()`), and their `@covers` markers are
**self-referential** — they document which Gherkin scenario each of the engine's own Rust unit tests
covers. Searching `apps/rhino-cli/src/commands/` (the actual CLI command dispatch layer) for
`behavior_coverage` returns **only** `specs_coverage.rs`'s 1 marker (also self-referential, covering
its own doc-comment). The engine's `validate()` function is called **only** from its own `#[cfg(test)]`
module — grepping `behavior_coverage::validate` outside `apps/rhino-cli/src/application/behavior_coverage/`
returns zero call sites. See `04-vacuity-public.md` for the full trace: the live `specs
behavior-coverage validate` CLI command (wired to every project's `specs:behavior:coverage` Nx target)
dispatches to a **different**, older engine (`commands::specs_coverage::run` → step-text coverage
checking), not to `application::behavior_coverage::validator::validate`.

This is not an inference — rhino-cli's own test source says so explicitly. `apps/rhino-cli/tests/specs_tree.rs:6-16`
(one of the 18 cucumber-rs binaries covering `gherkin/specs/behavior-coverage.feature`) states in its
module doc-comment:

> `behavior-coverage.feature` / `domain-coverage.feature`: the per-level `@covers` engine at
> `application::behavior_coverage::validator::validate` (plus `application::domain_coverage`'s
> allowlist gate). The live CLI verb `specs behavior-coverage validate`
> (`commands::specs_coverage::run`) is a _different_ thing — Gherkin-step-vs-test-implementation gap
> checking, not `@covers` level-tag validation. **The real `@covers` engine is dead/unwired CLI
> code** (its own `mod.rs` doc comments already carry `@covers` markers naming these exact scenario
> titles), so ... these scenarios call the internal engine in-process instead of inventing a CLI verb
> that would collide with the real (differently-scoped) `specs behavior-coverage validate` command.

## Key finding

The `@covers <spec-path>:<scenario-title>` marker convention has **zero adoption outside rhino-cli
itself**, and even within rhino-cli it covers only rhino-cli's own two meta-spec feature files
(`behavior-coverage.feature`, `domain-coverage.feature`) — i.e., it is currently a self-referential
bootstrap/dogfooding mechanism, not a pattern in production use by any of the other 25 registered
projects. Generalizing this pattern repo-wide (this plan's goal) starts from a **zero baseline**
everywhere except rhino-cli's own tests, and the underlying validation engine the markers are meant to
feed is not wired into the live CLI command path at all yet — it is presently dead code from the
shipped command's perspective, exercised only by rhino-cli's own cucumber suite
(`tests/specs_tree.rs`, one of the 18 cucumber-rs binaries covered in `03-skip-inventory-public.md`).
