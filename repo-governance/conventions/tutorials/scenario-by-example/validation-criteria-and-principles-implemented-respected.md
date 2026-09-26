---
description: The scenario by-example validation checklist and the content/software-engineering principles it implements.
when_to_use: Use when reviewing a scenario by-example example for compliance or when you need the rationale behind this convention's design.
---

# Validation Criteria and Principles Implemented/Respected

## Validation Criteria

Extend the
[SWE By-Example validation checklist](../swe-by-example/frontmatter-requirements-and-quality-checklist.md#quality-checklist)
with:

- [ ] Organizational scenario clearly stated (company type, size, decision-maker role)
- [ ] Fictional but plausible organization names and values used
- [ ] Annotations explain reasoning/trade-off, not just field names
- [ ] Every substantive document line is annotated
- [ ] Frameworks introduced after the underlying concept (frameworks-last)
- [ ] No executable code required — scenario fully standalone
- [ ] Decision or artifact is complete (no "see Example N for the template" cross-references)
- [ ] Dollar amounts, risk scores, and dates are realistic for the stated organization size

## Principles Implemented/Respected

- **[Progressive Disclosure](../../../principles/content/progressive-disclosure.md)** — Coverage
  levels (Beginner/Intermediate/Advanced) layer complexity progressively; readers start with simple
  single-factor decisions and advance to complex multi-stakeholder scenarios.
- **[Accessibility First](../../../principles/content/accessibility-first.md)** — Color-blind
  friendly Mermaid palette (Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown
  #CA9161) required for all diagrams; WCAG AA compliance throughout.
- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**
  — Each example must be fully self-contained with complete organizational context, explicit
  scenario framing, and all annotations inline; no "see Example N" cross-references permitted.
