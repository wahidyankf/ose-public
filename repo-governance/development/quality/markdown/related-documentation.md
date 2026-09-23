---
description: "Cross-references to the conventions markdown quality tooling enforces."
when_to_use: "Use when you need the rationale behind a specific markdown quality rule."
---

# Related Documentation

- [Content Quality Convention](../../../conventions/writing/quality.md) — heading hierarchy
  enforcement (prose allowlist + gate locations)
- [Indentation Convention](../../../conventions/formatting/indentation.md)
- [Linking Convention](../../../conventions/formatting/linking.md) — anchor (`#fragment`)
  rules and link-path validation via `./rhino md internal-link validate`
- [Diagram and Schema Convention](../../../conventions/formatting/diagrams.md) — Mermaid
  validation gate location (pre-commit + CI; not pre-push)
- [Repository Validation Methodology Convention](.././repository-validation.md) — canonical
  reference for all three Markdown Quality Gates (mermaid:validation, links:validation,
  headings:hierarchy-validation), their commands, exclusions, and gate locations (per-file
  validators run via lint-staged; the repo-wide `md-links` gate runs in `pr-quality-gate.yml`)
- [Code Quality Convention](.././code.md)
