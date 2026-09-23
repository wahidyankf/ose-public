---
description: The two-part criteria for whether a check belongs in a staged-path registry gate, the qualifying and non-qualifying check lists, resulting Nx target removals, and the public-safety carve-out.
when_to_use: Use when deciding whether a new check belongs in a staged-path registry gate or should instead be a dedicated Nx target or repository-wide gate.
---

# Staged-Path Gate Membership Rule

A staged-path gate is a [`repo-config.yml`](../../../../repo-config.yml) registry gate that declares
a `files` input, bound to the staged index at `pre-commit` (`source: git-index`) and to the pull
request's changed range on the `pull-request` surface (`source: explicit-range`). A check belongs
in a staged-path gate **if and only if** it satisfies **both** criteria:

1. **File-type-based**: selected from the handed paths by extension or name (for example, `*.md`,
   `*.sh`, `*.rs`).
2. **Per-file isolated**: its result does not depend on the content of any other file — it
   runs correctly on only the changed files.

Checks that pass both criteria run cleanly over the staged or changed set and require no project
graph. Everything else belongs in an Nx target (project-scoped) or a repository-wide gate.

## Qualifying Checks

The following checks satisfy both criteria and run as staged-path gates:

- **Formatters** — the one `format-staged` mutation gate: `prettier`, `rustfmt`, `fantomas`,
  `ruff format`, `gofmt`, `csharpier`, `dart format`, `shfmt`, `tofu fmt`, `stylua`,
  `clang-format`, `buildifier`, and — each via a wrapper, because it is invoked from a project root
  rather than on bare file paths — Elixir's formatter and Spotless (`*.java`). See
  [Formatting and File-Type Linting](../nx-targets/formatting-and-file-type-linting.md).
- **File-type linters**: `shellcheck` (shell scripts), `hadolint` (`Dockerfile`/`*.Dockerfile`),
  `actionlint` (`.github/workflows/*.{yml,yaml}`) — see
  [Gated standards](../../quality/cross-language-lint-strictness/gated-standards.md).
- **Per-file markdown validators**: `md mermaid validate` (the `md-mermaid` gate). `markdownlint-cli2`
  and `md heading-hierarchy validate` also qualify; their `markdownlint` and `md-heading-hierarchy`
  gates currently check the whole declared tree on the same surfaces, a correct superset.
- **Gherkin formatting**: deterministic staged-file formatting only; corpus/adapter validation runs
  through affected `test:quick`.

## Non-Qualifying Checks

Checks that fail one or both criteria stay outside staged-path gates:

| Check                             | Fails because                                                                                           | Placement                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `md internal-link validate`       | Not per-file isolated — adding, deleting, or renaming any `.md` file can break links in untouched files | Repo-wide `./rhino` command (no declared gate) |
| `harness adapters generate`       | Not file-type-based — regenerates every adapter from the canonical `.agents/` source                    | Explicit `./rhino` transaction (no gate)       |
| `test:quick`, `typecheck`, `lint` | Not file-type-based — project-scoped compile / test                                                     | Nx target (PR quality gate language jobs)      |

## Consequences for the Nx Target Set

Applying this rule removes several Nx targets from `project.json` files:

- **No per-project `format` or `format:check` Nx target** — formatting runs through the
  `format-staged` gate, not as per-project targets.
- **No `shell:lint`, `dockerfiles:lint`, or `actions:lint` Nx targets** — `shellcheck`,
  `hadolint`, and `actionlint` run as file-scoped registry gates over staged and changed paths.

## Deliberate Carve-Out: the Public-Safety Screen

The public-safety tree screen (`public-safety-tree`) decides what is outbound from the staged tree
itself and takes no `files` input. Even where a path-based check would do, it remains a **separate
registry entry declared first** on `pre-commit`, never folded into `format-staged`, for three
reasons:

1. **Order guarantee**: the screen must run before any formatter rewrites staged content.
2. **Distinct failure semantics**: a public-safety failure is an immediate abort, not a
   "fix and re-stage" lint error. Grouping it with formatters obscures the severity.
3. **Defense-in-depth**: a future formatter change cannot silently weaken the public-safety gate.

This is the single deliberate carve-out from the membership rule.

**Normative source**: the gate registry in [`repo-config.yml`](../../../../repo-config.yml);
the rule's origin is the archived 2026-07 standardization technical record (§5).
