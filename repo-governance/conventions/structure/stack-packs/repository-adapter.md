---
description: >-
  Defines the repository adapter: the one local document recording which stack packs a repository adopted, its
  repository-wide decisions and deviations, and links to the project READMEs that hold per-project facts.
when_to_use: >-
  Use when adopting a stack pack, recording an adopter decision a stack standard asks for, or writing or reviewing a
  repository adapter.
---

# Repository Adapter

An adopter keeps one repository adapter at `repo-governance/development/quality/stacks/repository-adapter.md`. It holds
what the catalog cannot know: which packs this repository took, how it adapted them, and the choices their standards
leave open.

## What It Holds, and What It Links

The adapter holds only repository-wide decisions and deviations. Per-project facts already have an owner:
[Project READMEs](../app-readme-vs-specs.md) state each project's stack, commands, and test levels, and
[Test Boundaries and Gates](../../../development/behaviour-driven-development.md) places every omitted
target and its reason there. The adapter links each project README instead of copying those facts. A project without a
README carries them inline in the adapter until it gains one.

It records no command, threshold, or tool version the project README or a manifest already states. A version is named by
the manifest or toolchain file that declares it, never repeated.

The adapter is the named owner of the inventory, and links back to the repository configuration file that holds it, as
[Inventory Extension](inventory-extension.md) requires.

## Template

```markdown
---
description: >-
  Records which stack packs this repository adopted, the decisions their standards leave open, and every deviation.
when_to_use: >-
  Use when working in a project here, adopting or retiring a stack pack, or changing a recorded stack decision.
---

# Repository Adapter

This document owns the `extensions.software-development` inventory in the repository configuration file.

## Adopted Packs

| Pack   | Status                                  | Reason                  |
| ------ | --------------------------------------- | ----------------------- |
| `<id>` | adopted / adapted / not applicable here | required unless adopted |

## Adopter Decisions

| Source standard or skill | Decision   | Choice   | Reason   |
| ------------------------ | ---------- | -------- | -------- |
| `<id>-standards.md`      | <decision> | <option> | <reason> |

## Project Applicability

- [<project-id>](<project-root>/README.md)

## Version Sources

- `<id>`: `<manifest-or-toolchain-file>`
```

## Sections

- **Adopted Packs.** Each pack carries exactly one status: adopted as written, adapted with its reason, or not
  applicable with its reason. A pack the inventory lists but this table omits is an unknown state, and a finding.
- **Adopter Decisions.** Every Adopter Decision row of each adopted standard and skill, plus the coverage-floor and
  task-runner choices that
  [Layers and Adapters](../../../development/behaviour-driven-development.md)
  and Test Boundaries and Gates ask a repository to record. A stronger local rule, such as a higher coverage floor or a
  language confined to one project, is recorded here as a deviation with its reason, and adoption never loosens it.
- **Project Applicability.** One link per project README. Applicable test layers, useful coverage, and each
  not-applicable boundary with its technical reason live in that README, never as a target that does nothing.
- **Version Sources.** Manifest and toolchain file paths only.

## Size

In an adopter the adapter falls under `repo-governance/`, so it carries governance frontmatter and the word budget. A
repository with many projects or decisions splits it into `repository-adapter/` modules as
[File Naming](../file-naming.md) requires.
