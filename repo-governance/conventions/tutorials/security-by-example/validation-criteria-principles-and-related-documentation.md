---
description: The validation checklist for security by-example content, the content principles it implements, and links to related conventions.
when_to_use: Use when validating a finished security by-example page before publishing or tracing which principles and conventions it must satisfy.
---

# Validation Criteria, Principles, and Related Documentation

## Validation Criteria

Extend the [SWE By-Example validation checklist](../swe-by-example/frontmatter-requirements-and-quality-checklist.md#quality-checklist) with:

- [ ] Lab environment clearly stated at example start
- [ ] All commands shown (no hidden prerequisite steps)
- [ ] Fictional IP ranges used (10.x, 192.168.x, RFC 5737)
- [ ] Red Team level pages open with ethical use notice
- [ ] Beginner level uses only built-in OS tools (no specialized installs)
- [ ] Intermediate/Advanced introductions of specialized tools include install command
- [ ] Annotations explain security implication, not just output field name
- [ ] MITRE ATT&CK technique referenced where applicable

## Principles Implemented/Respected

- **[Progressive Disclosure](../../../principles/content/progressive-disclosure.md)** — Coverage
  levels (Beginner/Intermediate/Advanced) layer complexity progressively; beginners use only
  built-in OS tools while advanced examples introduce full-ecosystem tooling.
- **[Accessibility First](../../../principles/content/accessibility-first.md)** — Color-blind
  friendly Mermaid palette (Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown
  #CA9161) required for all diagrams; WCAG AA compliance throughout.
- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**
  — Each example must specify lab environment, prerequisites, and all commands explicitly; no
  hidden steps or "run the previous setup" cross-references permitted.

## Related Documentation

- [SWE By-Example Tutorial Convention](../swe-by-example.md) — base convention this extends
- [Scenario By-Example Tutorial Convention](../scenario-by-example.md) — for CISO/governance content
- [General Tutorial Convention](../general.md) — base tutorial standards
- [Diagrams Convention](../../formatting/diagrams.md) — Mermaid diagram standards
