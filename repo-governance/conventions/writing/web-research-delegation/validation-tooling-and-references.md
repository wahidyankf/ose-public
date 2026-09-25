---
description: How compliance with this convention is validated and the agents, skills, and workflows that reference it
when_to_use: Read this when auditing an agent for Web Research Delegation compliance or tracing which tools enforce this convention.
---

# Validation, Tooling, and References

## Validation

To validate an agent complies with this convention:

1. **Does the agent have `WebSearch` or `WebFetch` in its `tools:` list?** If no, this convention does not apply.
2. **Is there a short Web Research Delegation block citing this convention?** If no, the agent is non-compliant.
3. **Does the block state the threshold (2+ searches or 3+ fetches per claim) or cite the convention in which it lives?** If no, the agent is non-compliant.
4. **If the agent claims an exception, is the exception one of the three enumerated above, and is it named explicitly?** If no, the exception is not documented and the agent is non-compliant.

`rules-checker` enforces these four checks as part of its agent-frontmatter and agent-body audit.

## Tools and Automation

- **`web-researcher`** — the default research primitive. Read-only delegated agent that returns cited, confidence-tagged findings without bloating the caller's context.
- **`rules-checker`** — validates agent compliance with this convention as part of routine governance audits.
- **`rules-propagation`** — applies fixes to non-compliant agents (adds Web Research Delegation block, cites convention).
- **Skill: `docs-validating-factual-accuracy`** — the factual-validation methodology that calls this convention as the authoritative source of the delegation rule.

## References

**Related Conventions:**

- [Factual Validation Convention](../factual-validation.md) — methodology and confidence classification that `web-researcher` output maps to
- [Content Quality Principles](../quality.md) — universal markdown standards every agent-written finding must satisfy
- [Convention Writing Convention](../conventions.md) — meta-convention this document follows

**Agents:**

- [`web-researcher`](../../../../.agents/agents/web-researcher.md) — the default research primitive
- `docs-checker`, `docs-tutorial-checker`, `apps-ayokoding-www-facts-checker`, `plan-checker` — validation agents that delegate to `web-researcher` above the threshold
- `docs-maker`, `docs-tutorial-maker`, `plan-maker` — authoring agents that commission research before writing
- `docs-fixer`, `apps-ayokoding-www-facts-fixer` — fixer agents invoking Exception 2 (same-context re-validation)
- `docs-link-checker`, `apps-ayokoding-www-link-checker`, `apps-ayokoding-www-link-fixer` — link-reachability agents invoking Exception 3

**Agent skills:**

- [`docs-validating-factual-accuracy`](../../../../.agents/skills/docs-validating-factual-accuracy/SKILL.md) — factual-validation methodology
- [`docs-applying-content-quality`](../../../../.agents/skills/docs-applying-content-quality/SKILL.md) — universal content-quality standards

**Workflows:**

- [Plan Quality Gate](../../../workflows/plan/plan-quality-gate.md)
- [Documentation Quality Gate](../../../workflows/docs/docs-quality-gate.md)
- [AyoKoding General Quality Gate](../../../workflows/ayokoding-web/ayokoding-web-general-quality-gate.md)
- [AyoKoding By-Example Quality Gate](../../../workflows/ayokoding-web/ayokoding-web-swe-by-example-quality-gate.md)
- [AyoKoding In-the-Field Quality Gate](../../../workflows/ayokoding-web/ayokoding-web-in-the-field-quality-gate.md)

**Repository Architecture:**

- [Repository Governance Architecture](../../../repository-governance-architecture.md) — six-layer hierarchy. This convention is Layer 2, governing behaviour of Layer 4 agents consumed at runtime by Layer 5 workflows.
