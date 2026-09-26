---
description: Operational notes on lifecycle delegation, retained parity, external research, idempotence, and bounds.
when_to_use: Use when clarifying how this workflow relates to the `harness-adapters` binding gate or when Phase 1 actually runs.
---

# Notes

- **Filtered Phase 0 always runs**: unregistered semantic parity runs regardless of `scope`;
  exact delegated predicates use lifecycle evidence and are never rerun here.
- **On-demand for Phase 1**: Phase 1 (external drift) does not run automatically on every
  push — schedule it periodically or trigger it when upstream harness changes are announced.
- **Lifecycle guards are separate**: registered binding/vendor/ownership/catalog/duplication
  predicates report `verified` or `pending` through their evidence ledger.
- **Idempotent**: Safe to run multiple times without breaking working state.
- **Observable**: Generates audit reports for every iteration in `local-tmp/harness-compat/`.
- **Bounded**: `max-iterations` prevents runaway execution.
