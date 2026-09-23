---
description: Uniform warning-and-above lint threshold across every language and artifact type in this repository.
when_to_use: Use when adding, changing, or auditing a lint gate, or checking which tool and threshold gate a given artifact type.
---

# Cross-Language Lint Strictness

This repository enforces a **uniform strictness threshold across every language
and artifact type it ships**: a linter finding at the **warning-and-above** level
fails the build, in both CI and local git hooks. This page indexes the
cross-language lint gates and the policy that binds them.

## Documents

- [Policy](./cross-language-lint-strictness/policy.md) — The warning-and-above threshold, two enforcement points, toolchain convergence and its exemptions, clean-then-gate rollout, and documented-waivers-only rule for every cross-language lint gate. Use when adding a new lint gate, deciding its failure threshold, declaring a gate's binary under toolchains, or documenting a lint-rule waiver.
- [Gated standards](./cross-language-lint-strictness/gated-standards.md) — The table of every currently-gated artifact type, its tool, threshold/config, and enforcement point, plus the lint tools that currently have no gate. Use when checking which tool and CI job gate a given artifact type (Markdown, formatting, F#), or whether shell, Dockerfile, or GitHub Actions YAML lint is gated.

**See also**: [markdown.md](../quality/markdown.md), [repository-validation.md](../quality/repository-validation.md).

## Principles Implemented/Respected

- [Automation Over Manual](../../principles/software-engineering/automation-over-manual.md) — lint
  policy is enforced by hooks and CI rather than reviewer memory.
- [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) — every
  artifact type uses a declared warning-and-above threshold.
- [Reproducibility](../../principles/software-engineering/reproducibility.md) — local and CI lint
  behaviour use the same checked-in tool configuration.

## Conventions Implemented/Respected

- [Indentation](../../conventions/formatting/indentation.md) and
  [Markdown Formatting](markdown.md) supply formatting rules that their language-appropriate
  deterministic gates enforce.

## Configuration files

`.shellcheckrc` and `.hadolint.yaml` are retained for a re-admitted gate; neither tool is gated
today (see [Gated standards](./cross-language-lint-strictness/gated-standards.md)).

- `.shellcheckrc` — `shell=bash`, `external-sources=true`; no repo-wide disables.
- `.hadolint.yaml` — `failure-threshold: warning`; `trustedRegistries`
  (`docker.io`, `mcr.microsoft.com`, `ghcr.io`); `ignored: [DL3008, DL3018]`
  (OS-package version-pinning is brittle — reproducibility comes from the pinned
  base-image tag, not per-package pins).
- `.config/dotnet-tools.json` — pins `fantomas`, `dotnet-fsharplint`, `fsharp-analyzers`, and
  `csharpier` for `dotnet tool restore`.

## Rationale and history

The strictness set was equalized across the sibling repositories in the
2026-06-12 `lint-safety-parity` effort.
The full decision log — including which rules are fixed vs. waived and why — lives
in [Lint & Safety Parity — Decisions](../../../docs/explanation/lint-safety-parity-decisions.md).

**See also**: [markdown.md](./markdown.md),
[repository-validation.md](./repository-validation.md).
