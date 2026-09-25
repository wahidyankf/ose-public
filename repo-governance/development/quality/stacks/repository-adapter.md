---
description: >-
  Records which stack packs this repository adopted, the decisions their standards leave open, and every deviation.
when_to_use: >-
  Use when working in a project here, adopting or retiring a stack pack, or changing a recorded stack decision.
---

# Repository Adapter

This document owns the `extensions.software-development` inventory in
[`repo-config.yml`](../../../../repo-config.yml). Its shape and activity rule come from
[Inventory Extension](../../../conventions/structure/stack-packs/inventory-extension.md); its sections come from
[Repository Adapter](../../../conventions/structure/stack-packs/repository-adapter.md). It holds only repository-wide
decisions and deviations. Commands, test levels, and omitted targets live in each project README.

## Adopted Packs

| Pack          | Status  | Reason                                                                                                                                                                   |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `typescript`  | adapted | the [TypeScript style guide](../../../../docs/explanation/software-engineering/programming-languages/typescript/README.md) wins where stricter                           |
| `javascript`  | adapted | `scripts/*.mjs` carry no type-check gate yet; see [Adopter Decisions](repository-adapter/adopter-decisions.md)                                                           |
| `fsharp`      | adapted | the [F# style guide](../../../../docs/explanation/software-engineering/programming-languages/f-sharp/README.md) wins where stricter; F# is the default for a new backend |
| `csharp`      | adapted | the [C# style guide](../../../../docs/explanation/software-engineering/programming-languages/c-sharp/README.md) wins where stricter                                      |
| `java`        | adapted | confined to `ose-lms-be`; the [Java style guide](../../../../docs/explanation/software-engineering/programming-languages/java/README.md) wins where stricter             |
| `golang`      | adopted | as written                                                                                                                                                               |
| `python`      | adopted | as written                                                                                                                                                               |
| `shell`       | adapted | Script-Subject Unit Proof replaces a coverage floor for scripts                                                                                                          |
| `react`       | adopted | as written                                                                                                                                                               |
| `nextjs`      | adopted | as written                                                                                                                                                               |
| `aspnet-core` | adopted | as written                                                                                                                                                               |
| `giraffe`     | adopted | as written                                                                                                                                                               |
| `gin`         | adopted | as written                                                                                                                                                               |
| `spring-boot` | adopted | as written; confined to `ose-lms-be` with `java`                                                                                                                         |
| `nx`          | adopted | as written                                                                                                                                                               |

No other pack is active. Rust was retired with its agent and skill; its style guide under
[Programming Languages](../../../../docs/explanation/software-engineering/programming-languages/README.md) remains local
reference only.

## Local Paths

Five adopted catalog modules sit at a local path that differs from their catalog path. Each is a reference module, not
a step in an ordered sequence, so [Ordinal Filename Prefixes](../../../conventions/structure/ordinal-filename-prefixes.md)
gives it a plain name and its parent index carries the order. Every other adopted artifact keeps its catalog path.

| Local path                                                                                    | Catalog path                                                                                      |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `repo-governance/conventions/structure/stack-packs/repository-adapter.md`                     | `repo-governance/conventions/structure/stack-packs/001-repository-adapter.md`                     |
| `repo-governance/conventions/structure/stack-packs/inventory-extension.md`                    | `repo-governance/conventions/structure/stack-packs/002-inventory-extension.md`                    |
| `repo-governance/development/quality/stacks/csharp-standards/domain-types-and-tests.md`       | `repo-governance/development/quality/stacks/csharp-standards/001-domain-types-and-tests.md`       |
| `repo-governance/development/quality/stacks/react-standards/library-decisions.md`             | `repo-governance/development/quality/stacks/react-standards/001-library-decisions.md`             |
| `repo-governance/development/quality/stacks/nextjs-standards/version-hosting-and-examples.md` | `repo-governance/development/quality/stacks/nextjs-standards/001-version-hosting-and-examples.md` |

## Details

- [Adopter Decisions](repository-adapter/adopter-decisions.md) — Every choice an adopted standard leaves open, plus the
  local rules that are stronger than the catalog.
- [Project Applicability](repository-adapter/project-applicability.md) — One link per inventory project, inline facts
  for projects without a README, and the manifests that declare each version.
