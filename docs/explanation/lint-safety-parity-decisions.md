---
title: Lint & Safety Parity — Decisions (2026-06-12)
description: >-
  Explanation of every ose-public dimension in the 2026-06-12 cross-repo
  lint-safety-parity effort: the cross-language strictness gates added
  (hadolint, shellcheck, actionlint, F# TreatWarningsAsErrors + G-Research
  analyzers), the dead-config removal, the documented reference and deferral
  decisions, and the exemption philosophy.
category: explanation
tags:
  - lint-safety-parity
  - multi-repo
  - governance
  - decision-log
created: 2026-06-12
---

# Lint & Safety Parity — Decisions (2026-06-12)

This document records the ose-public decisions in the cross-repo
`lint-safety-parity` effort (2026-06-12). The effort brings linting strictness
and unsafe-code posture to an **equal** standard across the sibling
repositories — ose-public (this repo) and the private sibling — so the shared
scaffolding layer stops drifting. The full per-row deviation matrix lives in the
plan's
`tech-docs.md`.

Sibling plan:

- The private sibling: `plans/in-progress/lint-safety-parity/` (private repo) — covers
  D1 + D1b, D6/D7/D8, D9 (Terraform + Ansible + yamllint), D10.

## Background

The sibling repositories share a governance and CI-harness layer originally
authored in ose-public. Over time each repo grew lint gates independently, so the
**set** of enforced linters diverged: one repo gated shell scripts, another
gated Dockerfiles, none gated GitHub Actions workflows uniformly, and ose-public's
F# strictness posture lagged the analyzer-backed standard this effort adopts (D2
below). It closes those gaps by adding the missing gates and raising F# to that
standard.

Every new gate follows the same **clean-then-gate** discipline expressed as a
TDD-shaped cycle: RED is "the gate fails on the existing violation backlog",
GREEN is cleaning the backlog, and REFACTOR/flip is wiring the gate ON in both CI
(`pr-quality-gate.yml`) and the local Husky hooks. This prevents the first CI or
hook run from breaking on a pre-existing backlog. Each new linter gates at the
**warning-and-above** threshold in both CI and local hooks, matching how
markdown/prettier are already gated.

## Dimension-by-Dimension Decisions

### D10 — Remove dead `.golangci.yml`

**Decision**: Delete the root `.golangci.yml`.

**Rationale**: ose-public has **zero `go.mod` files** — Go was fully removed when
the last Go CLIs were ported to Rust. No
`project.json` lint target invokes `golangci-lint run`, and the `setup-golang`
composite action installs the binary only for the `oapi-codegen` toolchain, never
to lint. The config was dead. The `golangci-lint` references that remain are in
ayokoding-www **educational content** and a few stale READMEs — preexisting
doc-drift, out of this dimension's scope.

### D7 — Shell lint (shellcheck)

**Decision**: Gate all 14 tracked `.sh` files at `--severity=warning` in CI
(new always-run `shell` job), in `.husky/pre-commit` (staged scripts), and add
`shellcheck` to the retired in-tree Rhino doctor converger. Add a root `.shellcheckrc`
(`shell=bash`, `external-sources=true`).

**Rationale**: Shell scripts are not Nx-tagged projects, so the gate runs on every
PR like the Prettier `format` job rather than via language detection. The tracked
script set was already clean at the warning threshold, so no cleanup was needed —
the gate locks in the existing quality. No repo-wide rule disables were required.

### D6 — Dockerfile lint (hadolint)

**Decision**: Gate all 17 Dockerfiles (10 under `apps/*` + 7 under `infra/dev/**`)
at `--failure-threshold warning` in CI (new `dockerfile` job), pre-commit, and
doctor. Add a root `.hadolint.yaml`.

**Why `infra/dev/**` is included\*\*: the plan left dev Dockerfiles to the
executor's discretion; gating them is strictly more hygienic and they only needed
the same shared config.

**Cleanup vs. ignore split**: the structural rule **DL3003** (`cd` →
`WORKDIR`) was **fixed** in all four flagged Dockerfiles. The version-pinning
rules **DL3008** (apt) and **DL3018** (apk) were **ignored** in `.hadolint.yaml`
with documented rationale: pinning exact OS-package versions makes images brittle
because upstream Debian/Ubuntu/Alpine repositories drop old versions, breaking
`docker build` on a cache miss; reproducibility comes from the pinned base-image
tag instead. `trustedRegistries` lists `docker.io`, `mcr.microsoft.com` (for the
former PDF-pipeline backend's .NET base images, which were present at the time of this decision),
and `ghcr.io`.

### D8 — GitHub Actions lint (actionlint)

**Decision**: Gate all 22 workflow files with `actionlint` in CI (new `actions`
job), pre-commit, and doctor.

**Cleanup**: `actionlint` runs an embedded `shellcheck` over every `run:` block.
All findings were **fixed** rather than suppressed where reasonable: SC2034 unused
variables (including removing a dead `for job` loop in the `quality-gate`
aggregator, whose real check is `contains(needs.*.result, 'failure')`); SC2129
grouped `GITHUB_OUTPUT` redirects; and `for _` for throwaway loop counters. The
single SC2163 case (`export "$line"` over `KEY=value` pairs) carries an inline
`# shellcheck disable` with rationale because the export is intentional. No
`.github/actionlint.yaml` was needed — ose-public CI runs entirely on
GitHub-hosted `ubuntu-latest` with no self-hosted runner labels to declare.

### D2 — F# strict stack (largest dimension)

**Decision**: Raise ose-public's F# projects to the analyzer-backed strict
standard: `TreatWarningsAsErrors` on all 8 `.fsproj`, pinned
`G-Research.FSharp.Analyzers` (0.22.0) + `FSharp.Analyzers.Build` (0.5.0) on the
three source projects with 13 `GRA-*` rules `--treat-as-error`, and the existing
`fantomas --check` format gate retained. A new `.config/dotnet-tools.json` pins
`fantomas`, `dotnet-fsharplint`, and `fsharp-analyzers`; each source `lint` target
now runs the analyzers alongside fantomas and fsharplint.

**Source needed no cleanup**: all three source projects already built with zero
warnings under `TreatWarningsAsErrors` + `--warnon:1182` and produced zero
analyzer findings. The effort was config wiring, not code change.

**Test-project suppressions**: the five test projects receive
`--nowarn:3261 --nowarn:3264` (F# nullness-interop noise on `box`-ed test data,
matching that standard). The former PDF-pipeline backend's **unit** test
project additionally suppressed **FS0044** because its BDD harness deliberately
used the deprecated-but-standard Giraffe in-process `WebHostBuilder`/`TestServer`
pattern; rewriting it to `WebApplicationBuilder` would have added risk for no
functional gain. The former PDF-pipeline backend's **integration** project did not
use that pattern, so it did **not** carry the `FS0044` suppression — an unused
suppression would itself violate clean-then-gate minimalism. (That backend has
since been removed from the repository; these suppressions are recorded here for
historical completeness.)

**One point goes further than that standard**: it applies `TreatWarningsAsErrors`
to source projects only; this plan's gate requires it on all 8 `.fsproj`, so test
projects carry it too (with the narrow nowarn flags above).

## Reference and Deferral Decisions

### D1 / D1b — Rust `forbid(unsafe_code)` + `[lints]` standard (reference, not executed)

ose-public's retained Rust crates are the **reference standard** the siblings align to, so
D1/D1b are documented here rather than executed.

### D3 (C#) / D4 (Python) / D9 (Terraform + Ansible/YAML) — not applicable

ose-public has no C#, no Python, and no IaC (`.tf`/ansible). These dimensions are
executed only in the sibling repos that contain those languages.

### D5 — TypeScript DDD import-boundaries (deferred)

D5 was **dropped** from this whole effort and deferred to a future dedicated plan:
it is too language-divergent to land safely alongside the cross-language lint
gates, and DDD boundary enforcement deserves its own design pass.

## Exemption Philosophy

DDD boundary enforcement, when it lands, will target **business-domain backends
only**. Demo apps, content sites, and frontend apps are exempt: their value is
illustrative or presentational, and imposing domain-layering rules on them would
add ceremony without protecting a real domain model. The same spirit governs the
lint suppressions above — a rule is waived only where applying it would reduce
clarity or reproducibility for no real safety gain, and every waiver is documented
inline at the point of suppression.

## Related

- Plan: `plans/done/2026-06-12__lint-safety-parity/`
- Convention: [Cross-Language Lint Strictness](../../repo-governance/development/quality/cross-language-lint-strictness.md)
- Sibling precedent: [Gherkin Step-Keyword Cardinality — Parity Decisions](./gherkin-step-keyword-cardinality-parity-decisions.md)
