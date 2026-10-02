---
name: docs-validating-factual-accuracy
description: Universal methodology for verifying factual correctness in documentation using WebSearch and WebFetch tools. Covers command syntax verification, version checking, code example validation, API correctness, confidence classification system ([Verified], [Error], [Outdated], [Unverified]), source prioritization, and update frequency rules. Essential for maintaining factual accuracy in technical documentation and educational content
---

# Factual Validation Methodology Skill

## Purpose

This Skill provides a universal methodology for verifying factual correctness in technical documentation, educational content, and code examples using WebSearch and WebFetch tools.

**When to use this Skill:**

- Verifying command syntax and flags
- Checking version numbers and compatibility
- Validating code examples compile/run correctly
- Confirming API methods and signatures
- Verifying external claims and references
- Classifying confidence levels for documentation
- Maintaining factual accuracy in tutorials

## Core Concepts

### What is Factual Validation?

**Factual validation** is the systematic process of verifying objective, verifiable claims in documentation against authoritative sources using web search and retrieval tools.

**Validates**:

- Command syntax (bash, npm, git commands)
- Software version numbers
- API method names and signatures
- Code example correctness
- Configuration file formats
- Library/package availability
- External factual claims

**Does NOT validate**:

- Subjective quality assessments
- Narrative flow or writing style
- Architectural decisions or opinions
- Future predictions or speculation

### The Four Confidence Classifications

See [The Four Confidence Classifications](./reference/confidence-classifications.md) for the full
`[Verified]` / `[Error]` / `[Outdated]` / `[Unverified]` definitions with examples of each.

## Validation Workflow

See [Step-by-Step Validation Workflow](./reference/validation-workflow.md) for the six-step
process from identifying claims through documenting a finding, with a worked npm-flag example.

## Source Prioritization

See [Source Prioritization](./reference/source-prioritization.md) for the four-tier source
hierarchy — official documentation, package registries, official release notes, and
well-maintained community sources — with examples and when to use each.

## Common Validation Patterns

See [Common Validation Patterns](./reference/common-validation-patterns.md) for four worked
patterns: command syntax, version number, code example, and API method validation.

## Update Frequency Rules and Metadata

See [Update Frequency Rules and Metadata Storage](./reference/update-frequency-and-metadata.md)
for the mandatory and optional re-validation triggers and the `external-links-status.yaml`
metadata format.

## Integration with Checker Agents

See [Integration with Checker Agents](./reference/checker-integration.md) for the dual-label
pattern (verification + criticality), confidence assessment levels, the three agents that
implement this methodology, and when to delegate research to `web-researcher`.

## Common Mistakes and Best Practices

See [Common Mistakes and Best Practices](./reference/mistakes-and-best-practices.md) for the five
most common validation mistakes, the pre-publish validation checklist, the batch validation
workflow, and the WebSearch/WebFetch tool usage pattern.

## Reference Documentation

**Primary Convention**: [Factual Validation Convention](../../../repo-governance/conventions/writing/factual-validation.md)

**Related Conventions**: [Content Quality Principles](../../../repo-governance/conventions/writing/quality.md), [Criticality Levels](../../../repo-governance/development/quality/criticality-levels.md), [Timestamp Format](../../../repo-governance/conventions/formatting/timestamp.md)

**Related Skills**: `repo-assessing-criticality-confidence` - dual-label system and priority matrix

**Related Agents**: `docs-checker`, `docs-tutorial-checker`, `content-checker`

---

This Skill packages critical factual validation methodology for maintaining accuracy in technical documentation. For comprehensive details, consult the primary convention document.
