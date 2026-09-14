---
description: >-
  Freezes the plan-structure validation contract — inputs, rule identifiers, messages, exit classes, the shared fixture
  corpus, and what is deliberately not validated.
when_to_use: >-
  Use before implementing a plan-structure validator, or when checking that two implementations still agree.
---

# Plan Validator Contract

Plan structure is validated by more than one implementation. They are required to accept and reject exactly the same
inputs, with the same rule identifiers, the same messages, and the same exit classes.

That requirement only means something if the contract exists before either implementation does. Written afterwards, a
contract describes whichever one was built first, and the second is then judged against an accident.

The catalog ships no validator. An adopter that checks plan structure builds or chooses the implementations, and each
one conforms to this contract and reports every rule the modules below identify.

## Modules

1. [Inputs and Exit Classes](plan-validator-contract/001-inputs-and-exits.md) — Fixes what a plan-structure validator reads, the diagnostic line format, the sort order, and the four exit classes it may return. Use when implementing a validator's entry point, output, or exit behaviour.
2. [Rule Identifiers and Messages](plan-validator-contract/002-rule-identifiers.md) — Freezes the twenty plan-structure rule identifiers and the exact message each one emits. Use when implementing a rule, matching on a diagnostic, or proposing a new rule.
3. [The Shared Fixture Corpus](plan-validator-contract/003-fixture-corpus.md) — Defines the shared plan-structure fixture corpus, its manifest, its digest, and the rule that every implementation reads the same bytes. Use when running a validator against the corpus, adding a case, or verifying that two implementations agree.
4. [Exclusions](plan-validator-contract/004-exclusions.md) — States what plan-structure validation deliberately does not judge, and why leaving those questions to review is the correct boundary. Use when deciding whether a proposed check belongs in the validator or in review.

## What Freezing Means

A frozen contract may be extended. A new rule gets a new identifier and new fixtures, and the existing ones keep meaning
what they meant.

It may not be quietly redefined. A rule whose meaning changes gets a new identifier, because other tooling, other
implementations, and other repositories match on the old one and will keep matching after its meaning moved.
