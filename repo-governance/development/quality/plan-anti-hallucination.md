---
description: Mandatory pre-write verification, repo-grounding, refuse-on-uncertainty, and confidence-labeling rules for plan content authored by AI agents
when_to_use: "Use when an AI agent authors or checks plan content that makes a factual claim."
---

# Plan Anti-Hallucination Convention

This convention mandates pre-write verification, repo-grounding, refuse-on-uncertainty, and confidence labeling for every factual claim in AI-authored plan content.

## Documents

- [Principles/Purpose](./plan-anti-hallucination/principles-implemented-respected-and-purpose.md) — Principles implemented, and why this convention exists. Use to trace this convention's rationale.
- [Scope](./plan-anti-hallucination/scope.md) — Which agents and content this convention covers. Use to check whether this applies to an agent.
- [Hallucination Categories](./plan-anti-hallucination/hallucination-categories-in-plan-context.md) — Categories of hallucination in plan content. Use to classify a suspected hallucination.
- [The Four Confidence Labels](./plan-anti-hallucination/the-four-confidence-labels.md) — The four confidence labels for plan claims. Use when labeling a claim's confidence.
- [Repo-Grounding Rule (HARD)](./plan-anti-hallucination/repo-grounding-rule-hard.md) — The mandatory repo-grounding rule for presence claims. Use when a plan asserts something exists.
- [Absence/Completeness: Zero-Result Evidence (1)](./plan-anti-hallucination/absence-and-completeness-claims-zero-result-search-evidence-checklist.md) — Why absence claims fail differently; the four-point checklist. Use before citing a zero-result search as evidence.
- [Absence/Completeness: Zero-Result Evidence (2)](./plan-anti-hallucination/absence-and-completeness-claims-zero-result-search-evidence-worked-example.md) — A measured example, plus a verification recipe. Use for a worked example before trusting a zero result.
- [Absence/Completeness: Diff Required](./plan-anti-hallucination/absence-and-completeness-claims-completeness-claim-requires-a-diff.md) — A completeness claim needs a diff, not a text search. Use before citing a search as proof a list is complete.
- [Absence/Completeness: Concept Sweep (1)](./plan-anti-hallucination/absence-and-completeness-claims-concept-sweep-why-one-regex-fails.md) — Why one regex is never an acceptance criterion. Use before trusting a single regex sweep as proof.
- [Absence/Completeness: Concept Sweep (2)](./plan-anti-hallucination/absence-and-completeness-claims-concept-sweep-minimum-discipline.md) — The six-point minimum discipline for a concept sweep. Use when designing a concept sweep.
- [Absence/Completeness: Concept Sweep (3)](./plan-anti-hallucination/absence-and-completeness-claims-concept-sweep-edge-cases.md) — Index-staleness and competing-convention edge cases. Use for the index-staleness edge case.
- [Absence/Completeness: Invocation and Capped Query](./plan-anti-hallucination/absence-and-completeness-claims-real-invocation-and-capped-query.md) — Check a validator's real invocation; capped-query undercounts. Use before trusting a validator result or count.
- [Refuse-on-Uncertainty and Web Research](./plan-anti-hallucination/refuse-on-uncertainty-rule-and-web-research-delegation.md) — The refuse-on-uncertainty rule; the web-research threshold. Use when uncertain about a plan claim.
- [Anti-Patterns: AP-1 - AP-4](./plan-anti-hallucination/anti-pattern-catalog-ap-1-through-ap-4.md) — Version/path/target/name fabrication. Use as a checklist for AP-1 - AP-4.
- [Anti-Patterns: AP-5 - AP-8](./plan-anti-hallucination/anti-pattern-catalog-ap-5-through-ap-8.md) — KPI, test name, agent, CLI flag fabrication. Use as a checklist for AP-5 - AP-8.
- [Anti-Patterns: AP-9 - AP-11](./plan-anti-hallucination/anti-pattern-catalog-ap-9-through-ap-11.md) — Behaviour claim, cross-link, absence-search fabrication. Use as a checklist for AP-9 - AP-11.
- [Anti-Patterns: AP-12 - AP-14](./plan-anti-hallucination/anti-pattern-catalog-ap-12-through-ap-14.md) — Completeness, concept-sweep, validator-invocation fabrication. Use as a checklist for AP-12 - AP-14.
- [Delegation and Validation Rituals](./plan-anti-hallucination/specialized-agent-delegation-and-validation-rituals.md) — Delegating to specialized agents; per-agent validation rituals. Use when deciding whether to delegate research.
- [Workflow, Examples, and Validation](./plan-anti-hallucination/workflow-integration-examples-and-validation.md) — Workflow fit, worked examples, and how this is validated. Use for a worked example of this convention.
- [Tools, Automation, and References](./plan-anti-hallucination/tools-and-automation-and-references.md) — Enforcement tooling and related references. Use to locate the automated enforcement.
- [Conventions Implemented/Respected](./plan-anti-hallucination/conventions-implemented-respected.md) — Conventions this convention implements. Use to trace this convention's cross-references.
