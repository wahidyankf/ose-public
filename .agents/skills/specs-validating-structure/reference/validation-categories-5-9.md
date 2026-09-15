# Validation Categories 5-9: Diagrams, References, Alignment, Tree Shape, Adoption

## Category 5: C4 Diagram Consistency [LLM]

C4 diagrams live in `system-context/context.md`, `containers/container.md`,
`components/be/component-be.md`, `components/web/component-web.md`. **HIGH**: README lists
diagram files that don't exist; diagram references undefined actors/containers/components.
**MEDIUM**: diagram doesn't use the color-blind-friendly palette (Blue #0173B2, Orange #DE8F05,
Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080); actor names inconsistent across
context/container/component levels. **LOW**: no `classDef` styling.

## Category 6: Cross-Reference Semantics [LLM]

Assess whether references are conceptually appropriate and current. If `md-links` is delegated,
do not resolve paths/fragments or infer broken-link findings. Without delegation, use `rhino-cli md
links validate`; do not substitute LLM path arithmetic.

## Category 7: Spec-to-Implementation Alignment [LLM]

**HIGH**: spec README references an implementation absent from `apps/`. **MEDIUM**: spec area has
no consuming implementation (acceptable for new areas). **LOW**: implementation exists but spec
area doesn't mention it.

Canonical Feature, Rule, Background, Scenario, Scenario Outline, Examples, step, comment, and tag
content must use the owning app/lib's durable domain language. A plan slug, plan number, phase,
delivery-unit name, or plan acceptance-criterion identifier in canonical Gherkin is **HIGH**: report
the exact feature/scenario and require the plan metadata to move to its external traceability map.

## Category 8: Spec Tree Shape Compliance [Deterministic via rhino-cli]

Outside delegated quality-gate runs, shell out to `rhino-cli specs structure validate <app>`, parse
JSONL. **HIGH**: top-level folder isn't
one of the five canonical folders; a flat-root artifact exists (`be/`, `web/`, `cli/`, `c4/`,
`contracts/` at app root); a BE/web/CLI feature file sits directly under
`behaviour/<surface>/gherkin/` without a domain subdirectory (all surfaces require domain subdirs —
`behaviour/<surface>/gherkin/<domain>/<feature>.feature`); a lib feature file sits directly under
`gherkin/` without a package subdirectory. **MEDIUM**: domain subdirectory not kebab-case. **LOW**:
domain subdirectory contains only one feature file named differently than the directory.

## Category 9: Adoption Gaps (BDD/Contracts) [Deterministic via rhino-cli]

Outside delegated quality-gate runs, use `rhino-cli specs structure validate <app>` for structural
adoption evidence, then apply narrative judgment per
[App README vs Specs Convention](../../../../repo-governance/conventions/structure/app-readme-vs-specs.md)
Standard 6:

| Surface profile | BDD required   | Contracts required       |
| --------------- | -------------- | ------------------------ |
| Full-stack      | HIGH if absent | HIGH if REST API exposed |
| Web-only        | HIGH if absent | NOT APPLICABLE           |
| CLI / Multi-CLI | HIGH if absent | NOT APPLICABLE           |

**HIGH**: full-stack/web-only app has no Gherkin specs at all; full-stack app exposes a REST API
but has no `containers/contracts/openapi.yaml`. **MEDIUM**: missing API contracts after one
rollout cycle for a REST-exposing full-stack app.

Adoption-gap findings are always `[Adoption Gap]`-tagged and route to **Requires Review** in the
fixer (never auto-fix) — adoption decisions require explicit justification.
