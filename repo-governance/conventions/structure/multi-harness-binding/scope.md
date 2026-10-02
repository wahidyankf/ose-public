---
description: The exact list of what the multi-harness binding convention governs and what it explicitly does not — instruction content, catalog entries, and the compatibility-audit workflow.
when_to_use: Read this to check whether a specific binding question (for example, AGENTS.md content itself, or the compatibility-audit workflow) is covered by this convention or by a sibling document.
---

# Multi-Harness Binding: Scope

What this convention covers and what it deliberately leaves to other documents. Part of the
[Multi-Harness Binding Convention](../multi-harness-binding.md).

## What This Convention Covers

- The canonical root instruction file (`AGENTS.md`) and its role as the single source of instruction
  content.
- The two binding tiers and when each applies.
- The no-shadowing rule for harness-specific files ranked above `AGENTS.md`.
- The mechanical-generation requirement for binding files that must exist.
- The deterministic parity guard and how it differs from the periodic compatibility-audit workflow.
- The harness-neutral npm script naming pattern for scripts that produce or validate binding artifacts.
- The catalog requirement for every committed binding directory.

## What This Convention Does NOT Cover

- The content of `AGENTS.md` itself (see `AGENTS.md` directly).
- Which vendor terms are forbidden in governance prose (see
  [Governance Vendor-Independence Convention](../governance-vendor-independence.md)).
- The platform-bindings catalog entries themselves (see
  [docs/reference/platform-bindings.md](../../../../docs/reference/platform-bindings.md)).
- The periodic compatibility-audit workflow that detects external upstream drift (see
  [harness-quality-gate.md](../../../workflows/quality/harness-quality-gate.md)).
