---
title: "Agent Naming Convention"
description: Single rule for agent filename structure across .claude/agents and .opencode/agent
category: explanation
subcategory: conventions
tags:
  - agents
  - naming
  - conventions
created: 2026-04-17
---

# Agent Naming Convention

Agents in this repository follow a **single filename rule with no exceptions**. The rule covers every agent file in `.claude/agents/` and its auto-generated mirror in `.opencode/agents/`.

## Why This Rule Exists

A uniform, exception-free naming rule gives the repository three concrete guarantees that loose naming cannot:

- **Enforceable by checker**: A single regex suffix check (`-(maker|checker|fixer|dev|deployer|manager)$`) decides conformance. No per-agent judgement, no grandfathered legacy names, no "this one is special" carve-outs. `repo-rules-checker` can audit the entire population in one pass and produce a deterministic result.
- **Zero-exception discipline**: Exceptions erode conventions. Once one agent is allowed a bespoke suffix, reviewers lose the ability to reject the next one on principle alone. Holding every agent to the same structure keeps the rule teachable in one sentence and cheap to enforce forever.
- **Harness parity**: Claude Code reads `.claude/agents/*.md` and OpenCode reads `.opencode/agents/*.md`. The sync pipeline assumes a filename-for-filename mirror between the two directories. Drift in either direction — a rename in one tree but not the other, a `.claude/` agent with no `.opencode/` twin — breaks cross-harness invocation silently. A shared naming rule makes the mirror check a trivial set-difference.

## The Rule

Every agent filename (basename without the `.md` extension) MUST match the structure:

```text
<scope>(-<qualifier>)*-<role>
```

Token definitions:

- **`<scope>`** — Exactly one token from the [Scope Vocabulary](#scope-vocabulary) below. Names the domain or subsystem the agent operates in. Appears first.
- **`<qualifier>`** — Zero or more lowercase kebab tokens narrowing the scope. Each qualifier is a single hyphen-separated word or a compound kebab phrase (e.g., `ayokoding-web`, `by-example`, `file`). Qualifiers stack in order from broadest to narrowest. Each qualifier token must be `[a-z0-9]+` and separated from its neighbours by single hyphens.
- **`<role>`** — Exactly one token from the [Role Vocabulary](#role-vocabulary) below. Names the functional responsibility. Appears last.

**No exceptions.** Every agent has exactly one scope (first) and exactly one role (last); everything between is qualifier. Filenames that cannot be parsed against this structure are governance violations regardless of history, context, or convenience.

Additional filename rules inherit from the [File Naming Convention](./file-naming.md): lowercase ASCII, digits and hyphens only, single `.md` extension, no leading or trailing hyphens, case-insensitively unique within the directory.

## Scope Vocabulary

Exactly one of the following tokens MUST appear as the first token of every agent filename:

- **`agent`** — Meta-agents that operate on other agents (create, validate, refactor agent definitions themselves).
- **`apps`** — Agents scoped to a specific deployable application under `apps/` (web content authoring, app-specific checking, deployers).
- **`ci`** — Agents that diagnose, validate, or repair continuous-integration pipelines and their failures.
- **`docs`** — Agents scoped to the `docs/` tree (Diátaxis content, link integrity, software-engineering separation).
- **`plan`** — Agents in the plan lifecycle (authoring, checking, executing, validating execution, fixing plans).
- **`readme`** — Agents that create, validate, or repair README files across the repository.
- **`repo`** — Repository-wide governance agents (conventions, workflows, cross-reference integrity).
- **`social`** — Agents that produce social-media artifacts (LinkedIn posts, monthly updates).
- **`specs`** — Agents scoped to the `specs/` tree (Gherkin features, OpenAPI contracts, C4 diagrams).
- **`swe`** — Software-engineering agents that write or validate production code, grouped by language or test framework.
- **`web`** — Agents that perform public-web research and fact-gathering.

New scope tokens MUST be added to this vocabulary first before any agent is named against them.

## Role Vocabulary

Exactly one of the following tokens MUST appear as the last token of every agent filename:

| Role       | Semantics                                                   | Example agents                                               |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| `maker`    | Produces a content or research artifact                     | `docs-maker`, `web-research-maker`                           |
| `checker`  | Validates an artifact against standards                     | `plan-checker`, `plan-execution-checker`, `swe-code-checker` |
| `fixer`    | Applies validated checker findings                          | `plan-fixer`, `swe-ui-fixer`                                 |
| `dev`      | Writes code in a language or test framework                 | `swe-rust-dev`, `swe-e2e-dev`                                |
| `deployer` | Deploys an application to an environment                    | `apps-ayokoding-web-deployer`                                |
| `manager`  | Performs file or resource operations (rename, move, delete) | `docs-file-manager`                                          |

No other role suffixes are permitted. Introducing a new role requires amending this table first.

## Applies To

This convention applies to both:

- **`.claude/agents/*.md`** — Source of truth. All agent definitions authored here.
- **`.opencode/agents/*.md`** — Generated mirror. Produced by the sync pipeline from `.claude/agents/`.

Filenames MUST be identical pair-for-pair between the two directories. Every `.claude/agents/<name>.md` has exactly one corresponding `.opencode/agents/<name>.md`, and vice versa. Any asymmetry (orphan file in either tree, rename in one tree but not the other) is a governance violation.

## Enforcement

`repo-rules-checker` MUST run the following audit command as part of every governance pass:

```bash
ls .claude/agents/*.md \
  | sed 's|.*/||; s|\.md$||' \
  | grep -vE -- '-(maker|checker|fixer|dev|deployer|manager)$' \
  | grep -v '^README$'
```

Any non-empty output is a governance violation. Every line printed is an agent filename whose suffix does not match the Role Vocabulary; each such file MUST be renamed to a compliant name before the checker can pass. The same command SHOULD be run against `.opencode/agents/*.md` to detect mirror drift.

## Examples

Current agents, grouped by role, all conforming to the rule:

- **`maker`** — `docs-maker` (scope `docs`, no qualifier, role `maker`), `web-research-maker` (scope `web`, qualifier `research`, role `maker`), `apps-ayokoding-web-by-example-maker` (scope `apps`, qualifiers `ayokoding-web-by-example`, role `maker`)
- **`checker`** — `plan-checker` (scope `plan`, role `checker`), `plan-execution-checker` (scope `plan`, qualifier `execution`, role `checker`), `swe-code-checker` (scope `swe`, qualifier `code`, role `checker`)
- **`fixer`** — `plan-fixer` (scope `plan`, role `fixer`), `swe-ui-fixer` (scope `swe`, qualifier `ui`, role `fixer`)
- **`dev`** — `swe-rust-dev` (scope `swe`, qualifier `rust`, role `dev`), `swe-e2e-dev` (scope `swe`, qualifier `e2e`, role `dev`)
- **`deployer`** — `apps-ayokoding-web-deployer` (scope `apps`, qualifiers `ayokoding-web`, role `deployer`)
- **`manager`** — `docs-file-manager` (scope `docs`, qualifier `file`, role `manager`)

## Related

- [`.claude/agents/README.md`](../../../.claude/agents/README.md) — Operational catalog of agents (source of truth).
- [`.opencode/agents/README.md`](../../../.opencode/agents/README.md) — Operational catalog of agents (generated mirror).
- [File Naming Convention](./file-naming.md) — Sibling filename rule for non-agent files in `docs/`, `governance/`, and plans.

## Principles Implemented/Respected

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)** — The scope and role of every agent are explicit in its filename; no convention-by-tribal-knowledge.
- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)** — One rule, one suffix list, one regex. No exceptions to memorize.
- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)** — A single-line `grep` decides conformance, enabling mechanical enforcement by `repo-rules-checker`.
