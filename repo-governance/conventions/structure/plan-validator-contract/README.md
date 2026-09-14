---
description: >-
  Indexes the ordered modules holding the frozen plan-structure validation contract.
when_to_use: >-
  Use to locate the module covering inputs, rules, fixtures, or exclusions.
---

# Plan Validator Contract Modules

Read in order. Together these hold the contract the [Plan Validator Contract](../plan-validator-contract.md) entrypoint
indexes.

## Directory Map

- [001 Inputs and Exit Classes](001-inputs-and-exits.md) — Fixes what a plan-structure validator reads, the diagnostic line format, the sort order, and the four exit classes it may return. Use when implementing a validator's entry point, output, or exit behaviour.
- [002 Rule Identifiers and Messages](002-rule-identifiers.md) — Freezes the twenty plan-structure rule identifiers and the exact message each one emits. Use when implementing a rule, matching on a diagnostic, or proposing a new rule.
- [003 The Shared Fixture Corpus](003-fixture-corpus.md) — Defines the shared plan-structure fixture corpus, its manifest, its digest, and the rule that every implementation reads the same bytes. Use when running a validator against the corpus, adding a case, or verifying that two implementations agree.
- [004 Exclusions](004-exclusions.md) — States what plan-structure validation deliberately does not judge, and why leaving those questions to review is the correct boundary. Use when deciding whether a proposed check belongs in the validator or in review.
