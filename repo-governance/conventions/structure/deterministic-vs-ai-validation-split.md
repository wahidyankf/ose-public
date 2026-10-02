---
description: Repository governance validation runs in two layers — a deterministic preflight that executes mechanical checks in milliseconds, and an AI checker that handles judgement-based categories. This convention defines which layer owns which category and the contract between them.
when_to_use: Use when deciding whether a new or existing governance validation rule belongs in the deterministic preflight or the AI checker.
---

# Deterministic vs AI Validation Split Convention

Repository governance validation runs in two complementary layers:

1. **Deterministic preflight** — a CLI orchestrator that enumerates every category whose rules can be encoded as exact predicates (file names, frontmatter shape, license presence, verbatim duplication, etc.). The preflight emits a JSON envelope with a fixed schema, runs in milliseconds, and caches via the build system.
2. **AI checker** — an agent that handles only the residual categories requiring semantic judgement (paraphrased duplication, terminology alignment, contradictions, principle-appropriateness).

This convention defines which categories live in which layer, the JSON envelope contract between them, and the rule for adding new categories.

## Principles Implemented/Respected

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)** — Each category lives in exactly one layer; no overlap, no ambiguity about who owns it.
- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)** — The split is documented in a table; the JSON envelope contract is versioned; the skip-set is explicit in the AI checker.
- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)** — Deterministic categories run on every iteration with no human or AI intervention.
- **[Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md)** — AI tokens are reserved for the work that genuinely requires judgement; mechanical work runs deterministically.
- **[Reproducibility First](../../principles/software-engineering/reproducibility.md)** — Same input → same JSON output, byte-for-byte. Verified by a 10-run determinism gate.

## Children

- [The Split](./deterministic-vs-ai-validation-split/the-split.md) — the table mapping each validation category to its owning layer and rationale.
- [JSON Envelope Contract](./deterministic-vs-ai-validation-split/json-envelope-contract.md) — the canonical JSON shape, key order, and byte-determinism guarantees.
- [Handoff to the AI Checker](./deterministic-vs-ai-validation-split/handoff-to-the-ai-checker.md) — how the AI checker consumes the preflight's JSON and skips redundant work.
- [Adding a New Validation Category](./deterministic-vs-ai-validation-split/adding-a-new-validation-category.md) — the decision tree and per-layer implementation contracts.
- [Refactoring to Deterministic, and Out of Scope](./deterministic-vs-ai-validation-split/refactoring-and-out-of-scope.md) — triggers for moving an AI category to deterministic, and what this convention does not define.

## Conventions Implemented/Respected

- **[File Naming Convention](../structure/file-naming.md)** — This file uses lowercase-kebab-case.
- **[Governance Vendor-Independence Convention](../structure/governance-vendor-independence.md)** — All prose here is vendor-neutral; the deterministic preflight and AI checker are described by role, not by vendor product name.
- **[Plans Organization Convention](../structure/plans.md)** — Additions to the split land via a plan in `plans/in-progress/` that updates this convention as part of its Phase 7 deliverable.

## Related

- [Repository Rules Quality Gate Workflow](../../workflows/quality/rules-quality-gate.md) — the workflow that orchestrates preflight + AI checker.
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) — three-stage validation flow that this split sits inside.
