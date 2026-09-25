---
description: Cross-references to related conventions, implementing agents, in-FP-by-example overview pages, and repository architecture documents.
when_to_use: Use when looking up related conventions, the agents implementing this convention, or the overview pages that use FP-variant examples.
---

# References

**Related Conventions:**

- [By-Example Tutorial Convention](../../tutorials/swe-by-example.md) — primary authority for five-part example structure, annotation density (1.0–2.25 ratio), and coverage progression. This convention is a specialisation of that standard for FP-variant multi-language content.
- [Content Quality Principles](../quality.md) — universal markdown quality standards (active voice, heading nesting, accessibility) that apply to all content including FP-variant by-example pages.
- [Why It Matters Content Convention](../why-it-matters-content.md) — prohibits fabricated scenarios and unsourced claims in `**Why It Matters**:` sections; applies to both tabs in FP-variant examples.
- [Programming Language Content Standard](../../tutorials/programming-language-content.md) — Full Set Tutorial Package architecture; FP-variant by-example is Component 3 (code-first priority track).
- [Programming Language Documentation Separation](../../structure/programming-language-docs-separation.md) — scope boundary between ayokoding-www tutorial content and docs/explanation/ language reference material.

**Agents:**

- [`apps-ayokoding-www-by-example-maker`](../../../../.agents/agents/apps-ayokoding-www-by-example-maker.md) — creates FP-variant by-example content following this convention
- [`apps-ayokoding-www-by-example-checker`](../../../../.agents/agents/apps-ayokoding-www-by-example-checker.md) — validates compliance
- [`apps-ayokoding-www-by-example-fixer`](../../../../.agents/agents/apps-ayokoding-www-by-example-fixer.md) — fixes violations

**In-FP-by-example overview pages:**

- [Architecture by-example: FP overview](../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/software-architecture/patterns-and-principles/in-fp-by-example/overview.md)
- [DDD: FP by-example overview](../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/software-architecture/domain-driven-design-ddd/in-fp-by-example/overview.md)
- [Hexagonal Architecture: FP by-example overview](../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/software-architecture/hexagonal-architecture/in-fp-by-example/overview.md)
- [FSM: FP by-example overview](../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/software-architecture/finite-state-machine-fsm/in-fp-by-example/overview.md)

**Repository Architecture:**

- [Repository Governance Architecture](../../../repository-governance-architecture.md) — six-layer hierarchy. This convention is Layer 2 (Conventions), governing Layer 4 agents (`apps-ayokoding-www-by-example-*`) consumed at runtime by Layer 5 workflows (ayokoding-web by-example quality gate).
- [Diátaxis Framework](../../structure/diataxis-framework.md) — FP-variant by-example tutorials are the Tutorial quadrant of Diátaxis (learning-oriented, hands-on, step-by-step).
