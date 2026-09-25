---
description: >-
  Defines the software-development inventory extension: each project's path, kind, and stack IDs, its visible owner,
  what the payload may never hold, when a stack counts as active, and when discovery is re-run.
when_to_use: >-
  Use when recording or changing which stacks a project uses, adding or moving a project, or reviewing the inventory in
  the repository configuration file.
---

# Inventory Extension

The inventory tells a reader and an agent which packs apply to each project. It is informational data an adopter keeps
in the `extensions` group of its repository configuration file, never a second place
for commands or policy.

## Shape

```yaml
extensions:
  # Owner: repo-governance/development/quality/stacks/repository-adapter.md
  software-development:
    projects:
      <stable-project-id>:
        path: <repository-relative-path>
        kind: app | library | script | infrastructure | tooling
        stacks: [<canonical-stack-id>]
```

| Kind             | Meaning                                                       |
| ---------------- | ------------------------------------------------------------- |
| `app`            | deployable service, site, CLI, desktop, or mobile application |
| `library`        | reusable authored package consumed by another project         |
| `script`         | maintained automation with a stable repository role           |
| `infrastructure` | declared infrastructure or host configuration                 |
| `tooling`        | repository build, validation, generation, or orchestration    |

`stacks` values come only from the closed ID set in [Stack Packs](../stack-packs.md). Parents are listed explicitly
beside the adapter pack that inherits them, for example `stacks: [fsharp, aspnet-core, giraffe]`, so a reader never has
to resolve inheritance to know what loads. A dedicated end-to-end project lists its runner's stacks only where they
change how its tests are written.

## A Visible Owner

Top-Level Schema requires every extension to name an owner. The
owner is the adopter's repository adapter: a YAML comment above the key names it, and the adapter links back to the
configuration file. The marker stays a comment so the payload's shape is the same in every adopter.

The payload holds no commands, thresholds, hosts, credentials, digests, versions, or catalog pins. Each of those has an
owner elsewhere, and an extension may not conceal one.

## When a Stack Is Active

A stack is active when tracked, authored source or project configuration uses it for a current application, library,
script, infrastructure surface, or repository tool. None of these activates a stack:

- generated output, vendored dependencies, caches, or a lockfile alone;
- fixtures that exist only to test parsing another language;
- plans, evidence, archived or decommissioned trees, or a content-example corpus;
- documentation that mentions a language without tracked source using it; or
- an installed runtime the repository does not author against.

## Re-Run Discovery on a Trigger

Discovery runs again when a project is added or deleted, a stack is adopted or retired, a source root moves, or the
adopted pack selection changes. An ordinary source edit changes nothing here.

## Validation

The configuration validator an adopter pins covers the namespace name and the mapping shape wherever it validates the
whole file, and treats an extension's contents as opaque. The contents are unenforced by decision: the inventory is
informational, and review checks each entry against the project it names.
