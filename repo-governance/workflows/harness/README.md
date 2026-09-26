---
description: Workflows for coding-agent harness compatibility, binding parity, and upstream conformance
when_to_use: Use when routing to a workflow that validates coding-agent bindings or current harness conventions.
---

# Harness Workflows

Use these workflows for periodic or on-demand validation of coding-agent harness adapters,
cross-vendor parity, platform-binding catalog accuracy, and upstream convention drift.

Deterministic pre-commit and pull-request binding checks remain gates rather than workflows. General
repository-rule validation remains under [Rules Workflows](../rules/README.md).

## Available Workflows

- [harness-compatibility-quality-gate](harness-compatibility-quality-gate.md) — Validates internal
  binding parity and external harness-conformance drift, then fixes iteratively until zero
  findings.
