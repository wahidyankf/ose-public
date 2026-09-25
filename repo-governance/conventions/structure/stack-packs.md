---
description: >-
  Fixes where each stack's standard and skill live, the closed set of stack IDs and kinds, how adapter packs inherit
  their parents, and how an agent resolves a project's packs from the local inventory.
when_to_use: >-
  Use when adding, adopting, or locating a stack standard or skill, recording which stacks a project uses, or writing a
  repository adapter.
---

# Stack Packs

A stack pack is the standard and the skill that together carry one language, framework, infrastructure tool, or tooling
adapter. Fixed paths and a closed set of IDs let a reader or an agent find a stack's rules from its ID alone, and let an
adopter take one pack without the rest.

This convention implements One Source Per Fact,
[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md), and
[Progressive Disclosure](../../principles/content/progressive-disclosure.md).

## Canonical Paths

| Artifact           | Path                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| stack standard     | `repo-governance/development/quality/stacks/<id>-standards.md`                                       |
| stack index        | [`repo-governance/development/quality/stacks/README.md`](../../development/quality/stacks/README.md) |
| skill              | `.agents/skills/<prefix>-<id>/SKILL.md`, with the prefix set by the pack's kind below                |
| generic agents     | `.agents/agents/swe-code-{maker,checker,fixer}.md`                                                   |
| repository adapter | `repo-governance/development/quality/stacks/repository-adapter.md`, in an adopter                    |
| inventory          | the `extensions.software-development` key of the repository configuration file                       |
| human reference    | `docs/reference/software-development.md`, in an adopter with a `docs/` tree                          |

A standard gains a companion `<id>-standards/` directory only when its word budget requires one, named and indexed as
[File Naming](file-naming.md) requires. A standard states only what is specific to its stack and links the shared
standard for everything else.

## Stack IDs and Kinds

The IDs form a closed set. A new stack is added here before its standard or skill is written.

| Kind              | Skill prefix      | IDs                                                                                                                                       |
| ----------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| language          | `programming-`    | `typescript`, `javascript`, `fsharp`, `golang`, `rust`, `elixir`, `csharp`, `java`, `lua`, `python`, `shell`, `clojure`, `dart`, `kotlin` |
| framework         | `framework-`      | `react`, `nextjs`, `spring-boot`, `phoenix-liveview`, `aspnet-core`                                                                       |
| framework adapter | `framework-`      | `giraffe`, `gin`                                                                                                                          |
| infrastructure    | `infrastructure-` | `terraform`, `ansible`                                                                                                                    |
| tooling adapter   | `tooling-`        | `nx`                                                                                                                                      |

Skills sit outside the Capability Naming grammar, which already excludes them; the prefixes are
this catalog's choice. A browser end-to-end suite has no stack ID and uses the `writing-browser-e2e-tests` skill.

## Inheritance

A framework pack builds on the language packs its standard names. An adapter pack inherits its parents and holds only
the boundary-specific rules they do not own:

| Adapter pack | Inherits                                          |
| ------------ | ------------------------------------------------- |
| `giraffe`    | `fsharp` and `aspnet-core`                        |
| `gin`        | `golang`                                          |
| `nx`         | every pack of each project the workspace contains |

An inheriting standard names its parents in its introduction and restates none of their rules. Its skill does the same
for their skills.

## Resolving a Project's Packs

An agent working in a project reads that project's entry in the inventory. For each listed ID it loads the local
`<prefix>-<id>` skill and the local `<id>-standards.md` before its first test. A listed ID with no local copy is
reported, never fetched from the catalog: nothing is read from the catalog at task time.

A pack reaches a repository only by an explicit Adopt Artifact request,
and only for a stack the repository actively authors, as the inventory module defines.

## Modules

1. [Repository Adapter](stack-packs/repository-adapter.md)
2. [Inventory Extension](stack-packs/inventory-extension.md)

## Enforcement

The adopter's metadata, naming, and link gates check each pack's paths and frontmatter. The configuration validator
covers the inventory's namespace and mapping shape; its contents are unenforced by decision, as the inventory module
explains. Review applies the closed ID set, inheritance without restatement, and the resolution rule.
