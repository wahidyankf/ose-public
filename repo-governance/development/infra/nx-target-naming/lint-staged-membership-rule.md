---
description: The two-part criteria for whether a check belongs in lint-staged, the qualifying and non-qualifying check lists, resulting Nx target removals, and the staged-guard carve-out.
when_to_use: Use when deciding whether a new check belongs in lint-staged or should instead be a dedicated Nx target or hook step.
---

# Lint-Staged Membership Rule

A check belongs in `lint-staged` **if and only if** it satisfies **both** criteria:

1. **File-type-based**: triggered by a path glob (for example, `*.md`, `*.sh`, `*.rs`).
2. **Per-file isolated**: its result does not depend on the content of any other file — it
   runs correctly on only the changed files.

Checks that pass both criteria parallelise cleanly over the staged set and require no project
graph. Everything else belongs in an Nx target (project-scoped) or a dedicated hook step.

## Qualifying Checks

The following checks satisfy both criteria and belong in `lint-staged`:

- **Formatters**: `prettier`, `rustfmt`, `fantomas`, `gofmt`, `ruff format`, `dart format`,
  `cljfmt`, `csharpier`, and — each via a wrapper, because it is invoked from a project root
  rather than on bare file paths — `mix format` and Spotless (`*.java`).
- **File-type linters**: `shellcheck` (`*.sh`), `hadolint` (`Dockerfile`/`*.Dockerfile`),
  `actionlint` (`.github/workflows/*.{yml,yaml}`).
- **Per-file markdown validators**: `markdownlint-cli2`, `md mermaid validate`,
  `md heading-hierarchy validate`.
- **Gherkin formatting**: deterministic staged-file formatting only; corpus/adapter validation runs
  through affected `test:quick`.

## Non-Qualifying Checks

Checks that fail one or both criteria stay outside `lint-staged`:

| Check                             | Fails because                                                                                           | Placement                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `md links validate`               | Not per-file isolated — adding, deleting, or renaming any `.md` file can break links in untouched files | Repo-wide `./rhino` gate (pre-push / PR / main) |
| `harness:bindings-generate`       | Not file-type-based — regenerates all binding trees from the whole `.claude/` tree                      | Dedicated `./rhino` step (pre-commit step 3)    |
| `test:quick`, `typecheck`, `lint` | Not file-type-based — project-scoped compile / test                                                     | Nx target (pre-push onward)                     |

## Consequences for the Nx Target Set

Applying this rule removes several Nx targets from `project.json` files:

- **No per-project `format` or `format:check` Nx target** — formatting runs as lint-staged
  file-type entries, not as per-project targets.
- **No `shell:lint`, `dockerfiles:lint`, or `actions:lint` Nx targets** — `shellcheck`,
  `hadolint`, and `actionlint` run as lint-staged file-type entries.

## Deliberate Carve-Out: `env staged-guard validate`

`env staged-guard validate` satisfies both criteria (file-type-based on `*.env*` globs;
per-file isolated because rejection is decided from the path alone). Despite satisfying the
rule, it remains a **dedicated first pre-commit step** (direct `./rhino`, never a
lint-staged entry) for three reasons:

1. **Order guarantee**: the guard must run before any formatter can stage `.env` file
   contents.
2. **Distinct failure semantics**: a secrets-leak failure is an immediate abort, not a
   "fix and re-stage" lint error. Grouping it with formatters obscures the severity.
3. **Defense-in-depth**: a future lint-staged config change cannot silently weaken the
   secrets gate.

This is the single deliberate carve-out from the membership rule.

**Normative source**:
the archived 2026-07 standardization technical record (§5)
