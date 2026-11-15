---
description: Choose the option that most helps the end user or consumer be correct, even when it is longer
when_to_use: Use when deciding between a terse surface and a descriptive one, or when reviewing errors, names, and defaults for silent misuse.
---

# Consumer Correctness First

When options differ, choose the one that **most helps the end user or consumer be correct**:
descriptive errors that name the cause and the fix, exact names that match across surfaces, and
no silent behavior. A terse or ambiguous surface that lets misuse pass quietly is the wrong
choice even when it is shorter.

## Followed and Violated

**Followed**: an error message names what went wrong and what to do next; a name means the same
thing in every surface that carries it; an invalid input fails loudly at the point of misuse.

**Violated**: a terse code or message leaves the consumer guessing at the cause; two surfaces use
different names for the same thing; a bad input is silently accepted, defaulted, or ignored.

- [Vision Supported](./consumer-correctness-first/vision-supported.md) — How this principle serves the Open Sharia Enterprise Vision. Use when explaining why a descriptive-surface change matters to the project's mission.
- [What](./consumer-correctness-first/what.md) — Defines consumer correctness and its three demands: descriptive errors, exact names, no silent behavior. Use for a quick working definition before applying the principle.
- [Why](./consumer-correctness-first/why.md) — Why ambiguity becomes misuse and incidents, and why descriptive surfaces fail loudly at the point of error. Use when justifying a longer or stricter surface in a design discussion or code review.
- [How It Applies](./consumer-correctness-first/how-it-applies.md) — Consumer-correctness examples for error messages, naming, and defaults. Use when reviewing an error message, a public name, or a default value.
- [Anti-Patterns](./consumer-correctness-first/anti-patterns.md) — Four consumer-hostile anti-patterns and why each is bad. Use when reviewing a surface that hides the cause, renames across boundaries, or stays silent.
- [PASS: Best Practices](./consumer-correctness-first/pass-best-practices.md) — Five best practices for consumer-correct surfaces. Use when designing a new API, CLI flag, error, or configuration value.
- [Examples from This Repository](./consumer-correctness-first/examples-from-this-repository.md) — This repository's concrete consumer-correct surfaces. Use to find an existing descriptive surface to reuse or extend.
- [References](./consumer-correctness-first/references.md) — External references on error design and naming. Use when seeking further reading behind a claim in this document.

## Related Conventions

- [Code Quality Convention](../../development/quality/code.md) - Explicit failures over silent ones
- [File Naming Convention](../../conventions/structure/file-naming.md) - Exact names that match across surfaces

## Relationship to Other Principles

- [Explicit Over Implicit](./explicit-over-implicit.md) - Descriptive surfaces make behaviour explicit
- [Simplicity Over Complexity](../general/simplicity-over-complexity.md) - Descriptive wins over terse when the two conflict; simplicity never means silence
- [Accessibility First](../content/accessibility-first.md) - Descriptive errors keep every consumer informed

## Enforcement

**Enforcement: unenforced by decision**, because no deterministic check can judge whether a
message names its cause and fix or whether two names mean the same thing. Reviewers apply it at
review time; conventions that operationalize parts of it carry their own gates.
