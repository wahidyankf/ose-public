---
description: The decision tree for choosing a new validation category's owning layer, plus the implementation contracts for deterministic and AI-checker owners.
when_to_use: Use when introducing a new governance validation rule and deciding which layer should own it.
---

# Adding a New Validation Category

When you identify a new governance rule, choose its owner using this decision tree:

1. **Can the rule be encoded as an exact predicate** (regex, file-existence check, field-equality test, exact-substring match, hash comparison)? If yes, owner is **Deterministic**.
2. **Does evaluating the rule require reading a passage and judging whether it satisfies a semantic property** (consistency with a principle, equivalence of meaning, quality of voice, accuracy against ground truth)? If yes, owner is **AI checker**.
3. **If both**: split the rule into two — a deterministic sub-rule that catches mechanical violations and an AI sub-rule for the judgement portion. Never give the same rule to both layers; the duplication wastes tokens and creates ambiguity about who reports a finding first.

## Deterministic owner — implementation contract

A new deterministic category MUST:

- Have a dedicated subcommand under the CLI orchestrator (e.g., `repo-governance <category-name>`).
- Emit findings in the canonical envelope shape with a stable composite key.
- Have ≥99% Unit line coverage on the implementation files.
- Have a Gherkin feature file in the upstream RHINO repository's specification corpus with both happy-path and failure-path scenarios.
- Have unit tests (mocked I/O) AND integration tests against real temporary-directory fixtures.
- Be byte-deterministic given a fixed clock.

## AI-checker owner — implementation contract

A new AI-only category MUST:

- Land as a new validation step or sub-step in the AI checker agent file.
- Define what makes a finding (the predicate the agent applies).
- Declare its criticality level (CRITICAL / HIGH / MEDIUM / LOW).
- Reference any source-of-truth principle or convention it enforces.
- NOT overlap with a deterministic category — if a deterministic check exists for the same rule, this convention REQUIRES the AI category to delegate to the deterministic finding rather than re-evaluating.
