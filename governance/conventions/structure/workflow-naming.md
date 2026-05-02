---
title: "Workflow Naming Convention"
description: Single rule for workflow filename structure under governance/workflows
category: explanation
subcategory: conventions
tags:
  - workflows
  - naming
  - conventions
created: 2026-04-17
---

# Workflow Naming Convention

Workflows under `governance/workflows/` follow a **single filename rule with no exceptions**, except for reference documentation under `governance/workflows/meta/` (which describes the workflow system rather than being a workflow).

## Why This Rule Exists

A uniform, exception-free naming rule gives the repository three concrete guarantees that loose naming cannot:

- **Enforceable by checker**: A single regex suffix check (`-(quality-gate|execution|setup)$`) decides conformance. No per-workflow judgement, no grandfathered `-validation` holdovers, no "this one is special" carve-outs. `repo-rules-checker` can audit the entire workflow tree in one pass and produce a deterministic result.
- **Zero-exception discipline**: Exceptions erode conventions. Once one workflow is allowed a bespoke suffix, reviewers lose the ability to reject the next one on principle alone. Holding every workflow to the same structure keeps the rule teachable in one sentence and cheap to enforce forever.
- **Semantic clarity**: The suffix immediately communicates the workflow's execution model. A reader sees `*-quality-gate` and knows to expect an iterative maker → checker → fixer loop terminating on zero findings; `*-execution` is a single forward procedure; `*-setup` provisions once and exits. No body scan required.

## The Rule

Every workflow filename (basename without the `.md` extension) MUST match the structure:

```text
<scope>(-<qualifier>)*-<type>
```

Token definitions:

- **`<scope>`** — Exactly one token from the [Scope Vocabulary](#scope-vocabulary) below, matching the parent directory under `governance/workflows/`. Appears first.
- **`<qualifier>`** — Zero or more lowercase kebab tokens narrowing the scope. Each qualifier is a single hyphen-separated word or a compound kebab phrase (e.g., `rules`, `by-example`, `software-engineering-separation`). Qualifiers stack in order from broadest to narrowest.
- **`<type>`** — Exactly one token from the [Type Vocabulary](#type-vocabulary) below. Names the execution model. Appears last.

**No exceptions** (except `meta/` reference docs, below). Every workflow has exactly one scope (first) and exactly one type (last); everything between is qualifier. Filenames that cannot be parsed against this structure are governance violations regardless of history.

Additional filename rules inherit from the [File Naming Convention](./file-naming.md).

## Scope Vocabulary

Workflow scope MUST match its parent directory under `governance/workflows/`. Current scopes:

- **`ayokoding-web`** — Workflows scoped to the AyoKoding Web application (content quality gates).
- **`ci`** — Workflows that diagnose, validate, or repair continuous-integration pipelines.
- **`docs`** — Workflows scoped to the `docs/` tree (Diátaxis content, link integrity, software-engineering separation).
- **`infra`** — Workflows that provision development environments or infrastructure resources.
- **`plan`** — Workflows in the plan lifecycle (authoring quality gate, plan execution).
- **`repo`** — Repository-wide governance workflows (conventions, workflows, cross-reference integrity). Aligned with agent scope `repo` (both use `repo`, not `repository`).
- **`specs`** — Workflows scoped to the `specs/` tree (Gherkin features, OpenAPI contracts, C4 diagrams).
- **`ui`** — Workflows scoped to UI component quality (tokens, accessibility, responsive design).

New scope tokens MUST be added to this vocabulary first before any workflow is named against them.

## Type Vocabulary

Exactly one of the following tokens MUST appear as the last token of every workflow filename:

| Type           | Semantics                                                                                                                        | Example workflows                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `quality-gate` | Iterative maker → checker → fixer loop that terminates on a zero-finding condition (usually two consecutive clean audits)        | `ci-quality-gate`, `plan-quality-gate`, `specs-quality-gate` |
| `execution`    | Executes a defined procedure or plan against inputs; no iterative fix loop; success is defined by the procedure completing       | `plan-execution`                                             |
| `setup`        | One-time environment, tooling, or resource provisioning; idempotent on re-run but not iterative in the maker/checker/fixer sense | `development-environment-setup`                              |

No other type suffixes are permitted. Introducing a new type requires amending this table first.

## Meta reference exception

Files under `governance/workflows/meta/` are **reference documentation about the workflow system itself** (e.g., `execution-modes.md`, `workflow-identifier.md`). They describe how workflows are identified, how they are executed, and which patterns govern them. They are not workflows and therefore are exempt from the type-suffix rule.

This is the **only** exception. Every other file under `governance/workflows/` that is not a `README.md` index MUST conform to the rule.

## Applies To

This convention applies to:

- **All `.md` files under `governance/workflows/**/\*.md`\*\* except:
  - `governance/workflows/README.md` and any per-scope `governance/workflows/<scope>/README.md` index files.
  - Everything under `governance/workflows/meta/` (reference material).

## Enforcement

`repo-rules-checker` MUST run the following audit command as part of every governance pass:

```bash
find governance/workflows -name '*.md' -not -name 'README.md' -not -path '*/meta/*' \
  | sed 's|.*/||; s|\.md$||' \
  | grep -vE -- '-(quality-gate|execution|setup)$'
```

Any non-empty output is a governance violation. Each line printed is a workflow filename whose suffix does not match the Type Vocabulary; each such file MUST be renamed to a compliant name before the checker can pass.

The `rhino-cli workflows validate-naming` subcommand wraps this check plus a frontmatter `name:` field consistency check and is wired into Husky pre-push and the CI quality gate.

## Examples

Current workflows, grouped by type, all conforming to the rule:

- **`quality-gate`** — `plan-quality-gate` (scope `plan`, type `quality-gate`), `repo-rules-quality-gate` (scope `repo`, qualifier `rules`, type `quality-gate`), `specs-quality-gate` (scope `specs`, type `quality-gate`), `docs-quality-gate` (scope `docs`, type `quality-gate`), `ci-quality-gate` (scope `ci`, type `quality-gate`), `ui-quality-gate` (scope `ui`, type `quality-gate`), `ayokoding-web-by-example-quality-gate` (scope `ayokoding-web`, qualifier `by-example`, type `quality-gate`)
- **`execution`** — `plan-execution` (scope `plan`, type `execution`)
- **`setup`** — `development-environment-setup` (scope `infra`, qualifiers `development-environment`, type `setup`)

## Related

- [`governance/workflows/README.md`](../../workflows/README.md) — Operational catalog of workflows.
- [Agent Naming Convention](./agent-naming.md) — Sibling rule governing `.claude/agents/*.md` and `.opencode/agents/*.md` filenames. Uses aligned scope vocabulary (`repo`, not `repository`).
- [File Naming Convention](./file-naming.md) — Sibling filename rule for non-workflow files.

## Principles Implemented/Respected

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)** — The scope and type of every workflow are explicit in its filename; no convention-by-tribal-knowledge.
- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)** — One rule, one type list, one regex. One documented exception (meta).
- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)** — A single-line `find | grep` decides conformance, enabling mechanical enforcement by `repo-rules-checker` and `rhino-cli workflows validate-naming`.
