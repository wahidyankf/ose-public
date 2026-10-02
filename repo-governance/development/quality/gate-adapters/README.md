---
description: >-
  Indexes the product adapters that hold the rules, thresholds, and tools generic quality gates read for this
  repository's published content and conversions.
when_to_use: >-
  Use when a content, tutorial, or PDF-to-Markdown quality gate needs a product rule, or when adding a product that a
  generic gate must judge.
---

# Gate Adapters

A generic quality gate states what any repository judges; an adapter states what only one product here decides. Each
adapter names the paths it covers and the gate families it configures, per the
[Quality Gate Contract](../../workflow/quality-gate-contract.md).

## Directory Map

- [AyoKoding WWW Gate Adapter](ayokoding-www.md) — content and tutorial rules for `apps/ayokoding-www/content/`.
- [AyoKoding Tutorial Kinds](ayokoding-www/tutorial-kinds.md) — the per-kind tutorial thresholds and layouts.
- [OSE WWW Gate Adapter](ose-www.md) — content rules for `apps/ose-www/content/`.
- [PDF to Markdown Gate Adapter](pdf-to-md.md) — the conversion check tools, OCR thresholds, and markers.
