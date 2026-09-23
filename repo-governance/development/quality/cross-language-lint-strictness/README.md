---
description: "Uniform warning-and-above lint threshold across every language and artifact type in this repository."
when_to_use: "Read this index to find the right Cross-Language Lint Strictness child document."
---

# Cross-Language Lint Strictness

- [Policy](./policy.md) — The warning-and-above threshold, two enforcement points, toolchain convergence and its exemptions, clean-then-gate rollout, and documented-waivers-only rule for every cross-language lint gate. Use when adding a new lint gate, deciding its failure threshold, declaring a gate's binary under toolchains, or documenting a lint-rule waiver.
- [Gated standards](./gated-standards.md) — The table of every currently-gated artifact type, its tool, threshold/config, and enforcement point, plus the lint tools that currently have no gate. Use when checking which tool and CI job gate a given artifact type (Markdown, formatting, F#), or whether shell, Dockerfile, or GitHub Actions YAML lint is gated.
