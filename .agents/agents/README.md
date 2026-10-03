---
description: >-
  Indexes this repository's canonical agent definitions, each declaring what it needs and what it must not do before a
  harness adapter routes to it.
when_to_use: >-
  Use when locating a canonical agent definition or deciding what a new one must declare.
---

# Canonical Agents

Agent definitions in their canonical, harness-neutral form, one Markdown file per agent, flat in this directory. Each
declares a `tier` and what it needs from a closed vocabulary in fixed order — `repository-read`, `repository-write`,
`shell`, `network`, `subagent` — records what it must not do under `constraints`, and lists the skills it preloads.

Humans edit only the canonical file. `./rhino harness adapters generate` renders every agent's routes into
`.claude/agents/`, `.codex/agents/`, and `.opencode/agents/`; never hand-edit one.

For a gate family the read-only `<family>-checker` writes a frozen ledger and the `<family>-fixer` executes
`<family>-propagation`, the sole writer, per the
[Quality Gate Contract](../../repo-governance/development/workflow/quality-gate-contract.md).

## Directory Map

## AyoKoding-Web Content

Create and link-check ayokoding-web content; the content and tutorial gates judge it.

- [apps-ayokoding-www-annotated-concept-maker](apps-ayokoding-www-annotated-concept-maker.md) — writes Annotated-concept tutorials
- [apps-ayokoding-www-by-example-maker](apps-ayokoding-www-by-example-maker.md) — writes By Example tutorials
- [apps-ayokoding-www-general-maker](apps-ayokoding-www-general-maker.md) — writes general content
- [apps-ayokoding-www-in-the-field-maker](apps-ayokoding-www-in-the-field-maker.md) — writes In-the-Field guides
- [apps-ayokoding-www-link-checker](apps-ayokoding-www-link-checker.md) — audits content links
- [apps-ayokoding-www-link-fixer](apps-ayokoding-www-link-fixer.md) — repairs link findings
- [apps-ayokoding-www-primer-maker](apps-ayokoding-www-primer-maker.md) — writes Primer tutorials

## OSE-Web Content

Create ose-web content-layer content; the content gate judges it.

- [apps-ose-www-content-maker](apps-ose-www-content-maker.md) — writes ose-web content

## Docs

Create, check, fix, and manage documentation, tutorials, and file organization under docs/.

- [docs-checker](docs-checker.md) — audits documentation accuracy
- [docs-file-manager](docs-file-manager.md) — renames, moves, and deletes docs/ files
- [docs-fixer](docs-fixer.md) — repairs documentation accuracy findings
- [docs-link-checker](docs-link-checker.md) — audits documentation links
- [docs-maker](docs-maker.md) — writes documentation
- [docs-software-engineering-separation-checker](docs-software-engineering-separation-checker.md) — audits style-guide and tutorial separation
- [docs-software-engineering-separation-fixer](docs-software-engineering-separation-fixer.md) — repairs separation findings
- [docs-tutorial-checker](docs-tutorial-checker.md) — audits tutorial pedagogy
- [docs-tutorial-fixer](docs-tutorial-fixer.md) — repairs tutorial findings
- [docs-tutorial-maker](docs-tutorial-maker.md) — writes tutorials

## General

Cross-cutting agents scoped to no single app: agent scaffolding, CI standards, and social posts.

- [agent-maker](agent-maker.md) — scaffolds new agents
- [ci-checker](ci-checker.md) — audits CI and Nx target standards
- [ci-fixer](ci-fixer.md) — repairs CI findings
- [social-linkedin-post-maker](social-linkedin-post-maker.md) — writes LinkedIn posts

## PDF to Markdown

Convert PDF sources to verbatim Markdown and validate or fix the conversion.

- [pdf-to-md-checker](pdf-to-md-checker.md) — audits conversion fidelity
- [pdf-to-md-fixer](pdf-to-md-fixer.md) — repairs conversion findings
- [pdf-to-md-maker](pdf-to-md-maker.md) — converts a PDF to Markdown

## Plan

Create, check, and validate the execution of project plans.

- [plan-checker](plan-checker.md) — audits a plan draft against the plan specification
- [plan-fixer](plan-fixer.md) — executes Plan Propagation
- [plan-execution-checker](plan-execution-checker.md) — audits finished plan execution before archival
- [plan-maker](plan-maker.md) — authors a formal plan through both decision gates

## PR Review

The pr-review gate: a scout, eight lens checkers plus `swe-architect`, the coordinating checker, and the fixer.

- [pr-review-checker](pr-review-checker.md) — coordinates one pass and publishes the review
- [pr-review-docs-checker](pr-review-docs-checker.md) — reviews documentation quality
- [pr-review-fixer](pr-review-fixer.md) — executes PR Review Propagation
- [pr-review-governance-checker](pr-review-governance-checker.md) — reviews governance conformance
- [pr-review-instruction-checker](pr-review-instruction-checker.md) — reviews instruction currency
- [pr-review-integrity-checker](pr-review-integrity-checker.md) — reviews test integrity
- [pr-review-logic-checker](pr-review-logic-checker.md) — reviews correctness
- [pr-review-performance-checker](pr-review-performance-checker.md) — reviews performance
- [pr-review-scout](pr-review-scout.md) — chooses the risk tier and lenses
- [pr-review-security-checker](pr-review-security-checker.md) — reviews security and leaks
- [pr-review-types-checker](pr-review-types-checker.md) — reviews type soundness

## Quality Gates

Content and tutorial gate pairs; each fixer executes its family's propagation. The ui-web and api-http gates use SWE
testers and `swe-developer`.

- [content-checker](content-checker.md) — audits published content against its product adapter
- [content-fixer](content-fixer.md) — executes Content Propagation
- [tutorial-annotated-concept-checker](tutorial-annotated-concept-checker.md) — audits Annotated-concept tutorials
- [tutorial-annotated-concept-fixer](tutorial-annotated-concept-fixer.md) — repairs Annotated-concept findings
- [tutorial-by-example-checker](tutorial-by-example-checker.md) — audits By Example tutorials
- [tutorial-by-example-fixer](tutorial-by-example-fixer.md) — repairs By Example findings
- [tutorial-in-the-field-checker](tutorial-in-the-field-checker.md) — audits In-the-Field guides
- [tutorial-in-the-field-fixer](tutorial-in-the-field-fixer.md) — repairs In-the-Field findings
- [tutorial-primer-checker](tutorial-primer-checker.md) — audits Primer tutorials
- [tutorial-primer-fixer](tutorial-primer-fixer.md) — repairs Primer findings

## README Tooling

Create, check, and fix README.md content quality.

- [readme-checker](readme-checker.md) — audits README quality
- [readme-fixer](readme-fixer.md) — repairs README findings
- [readme-maker](readme-maker.md) — writes README content

## Repo Governance

Rules and workflow governance, harness-compatibility parity, and plan Phase 0 setup.

- [harness-checker](harness-checker.md) — audits harness parity and upstream drift
- [harness-fixer](harness-fixer.md) — executes Harness Propagation
- [repo-setup-manager](repo-setup-manager.md) — runs plan Phase 0 setup and baselines
- [repo-workflow-checker](repo-workflow-checker.md) — audits workflow documentation
- [repo-workflow-fixer](repo-workflow-fixer.md) — repairs workflow findings
- [repo-workflow-maker](repo-workflow-maker.md) — writes workflow documentation
- [rules-checker](rules-checker.md) — audits repository-wide rule consistency
- [rules-fixer](rules-fixer.md) — executes Rules Propagation
- [rules-maker](rules-maker.md) — writes repository rules and conventions

## Specs

Create and validate specs/ Gherkin feature areas and structure.

- [specs-checker](specs-checker.md) — audits listed spec folders
- [specs-fixer](specs-fixer.md) — repairs spec findings
- [specs-maker](specs-maker.md) — scaffolds spec areas

## SWE

The software-engineering family; writers and judges stay apart.

- [swe-api-tester](swe-api-tester.md) — judges a running API
- [swe-architect](swe-architect.md) — designs boundaries; architecture lens
- [swe-debugger](swe-debugger.md) — resolves failing checks
- [swe-developer](swe-developer.md) — builds test-first; applies findings
- [swe-orchestrator](swe-orchestrator.md) — dispatches the family toward a goal
- [swe-releaser](swe-releaser.md) — deploys and repins
- [swe-reviewer](swe-reviewer.md) — audits code against the standards
- [swe-usability-tester](swe-usability-tester.md) — evaluates first use
- [swe-web-tester](swe-web-tester.md) — judges a running web interface

## Web

The web-researcher fact-finding agent.

- [web-researcher](web-researcher.md) — researches cited facts on the web

## Old-to-New Map

Each agent the swe family replaced, and where its work went. A reader holding an old name finds its replacement here.

| Replaced agent                    | New agent              | Mode or charter   |
| --------------------------------- | ---------------------- | ----------------- |
| `swe-code-maker`                  | `swe-developer`        | build             |
| `swe-ui-maker`                    | `swe-developer`        | build (UI skills) |
| `swe-code-fixer`, `swe-ui-fixer`  | `swe-developer`        | apply findings    |
| `ui-web-fixer`, `api-http-fixer`  | `swe-developer`        | apply findings    |
| `bugs-solver`                     | `swe-debugger`         | —                 |
| `swe-code-checker`                | `swe-reviewer`         | code              |
| `swe-ui-checker`                  | `swe-reviewer`         | interface         |
| `gherkin-implementation-reviewer` | `swe-reviewer`         | scenario trace    |
| `ui-web-checker`                  | `swe-web-tester`       | spec              |
| `web-design-tester`               | `swe-web-tester`       | design            |
| `web-exploratory-tester`          | `swe-web-tester`       | exploratory       |
| `web-usability-tester`            | `swe-usability-tester` | —                 |
| `api-http-checker`                | `swe-api-tester`       | contract          |
| `api-exploratory-tester`          | `swe-api-tester`       | exploratory       |
| `pr-review-architecture-checker`  | `swe-architect`        | lens              |
| `apps-*-deployer` (per app)       | `swe-releaser`         | deploy            |
