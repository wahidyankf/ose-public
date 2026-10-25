# ExBdd Behaviours

These scenarios describe the planned local import's public testing capabilities. Bindings are
not implemented yet. Every scenario requires Unit proof and applicable local Integration proof.
The scenario-level E2E exemptions name native test proof because the engine has no public system
journey.

## Domains

- [Compilation](./compilation/README.md) — recursive discovery, backgrounds, outlines, structured
  arguments, and configurable ExUnit case templates.
- [Matching and runtime](./matching/README.md) — expressions, regular expressions, context flow,
  errors, and scenario isolation.
- [Static verification](./verification/README.md) — empty corpora, journey structure, exact
  binding completeness, and verification without executing steps.
- [Provenance](./provenance/README.md) — the pinned import, notices, local changes, and separation
  of retained engine fixtures from consumer scenarios.
