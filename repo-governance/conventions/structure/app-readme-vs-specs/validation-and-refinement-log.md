---
description: The review-owned structural and semantic checks that enforce this convention, the forbidden-heading audit, and the history of refinements to the convention itself.
when_to_use: Use when checking how this convention is enforced, or reviewing the history of changes to its rules.
---

# Validation and Refinement Log

## Validation

`rules-checker` and `specs-checker` enforce this convention by review. No declared gate or pinned RHINO command checks the structural rows below; `test:coverage:behaviour` checks only the Gherkin corpus, and `specs-checker` judges the rest per the [Specs Quality Gate](../../../workflows/quality/specs-quality-gate.md).

### Structural checks (specs-checker, review-owned)

| Check                                             | Checked by      | Finding level |
| ------------------------------------------------- | --------------- | ------------- |
| README line-count cap exceeded                    | `specs-checker` | HIGH          |
| Spec tree top-level folder names wrong            | `specs-checker` | HIGH          |
| README count claims differ from actual file count | `specs-checker` | HIGH/MEDIUM   |
| BDD/DDD/Contracts adoption gap                    | `specs-checker` | HIGH/MEDIUM   |

### LLM semantic checks (specs-checker)

| Check                                                                       | Finding level |
| --------------------------------------------------------------------------- | ------------- |
| Spec file missing required header block (audience + plain-language summary) | HIGH          |
| Section opens with mechanism rather than intent                             | MEDIUM        |
| Niche term used without gloss on first occurrence                           | MEDIUM        |
| Mainstream SWE term glossed unnecessarily                                   | LOW           |
| Code block missing one-sentence introduction                                | LOW           |

### Forbidden content audit (rules-checker)

`rules-checker` scans app READMEs for forbidden headings:

- `## Routes`, `## Screens`, `## API`, `## Endpoints` → HIGH (Category B content in README)
- `## Architecture` with more than 10 lines of content → HIGH (move to `components/*/architecture.md`)
- `## Bounded Context`, `## Design System` → HIGH

A README exceeding its line-count cap is a HIGH finding regardless of content.

## Refinement log

| Date       | Entry                                                                                                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-09 | CLI DDD adoption deferred; revisit if a CLI grows past ~10 commands or shows aggregate-shaped state.                                                                                                                                                                          |
| 2026-05-23 | CLI-flat exception retired. All CLI surfaces now use domain subdirs (same rule as BE and web). `ose-app` added to the `AppsWithDDD` allowlist.                                                                                                                                |
| 2026-06-11 | Flat `<surface>` slugs renamed to `<product>-<surface>` compound form (e.g., `be/` → `organiclever-be/`, `cli/` → `Rhino/`). `build-tools` renamed to `ayokoding-build-tools` (kept active). `ose-app` + `ose-platform` merged into `ose` family; allowlist updated to `ose`. |
