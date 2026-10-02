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

The canonical file is the one a human edits. `./rhino harness adapters generate` renders a route for every agent into
`.claude/agents/<name>.md`, and for the three plan agents into `.codex/agents/` and `.opencode/agents/`. Do not treat an
adapter as a second source of instructions, and never hand-edit one.

Most delivery work follows a maker, checker, fixer loop. For a gate family the read-only `<family>-checker` writes a
frozen ledger and the `<family>-fixer` executes `<family>-propagation`, the sole writer, per the
[Quality Gate Contract](../../repo-governance/development/workflow/quality-gate-contract.md). Deployers are
single-purpose instead.

## Directory Map

## AyoKoding-Web Content

Create, link-check, and deploy ayokoding-web content; the content and tutorial gates judge it (see Quality Gates).

- [apps-ayokoding-www-annotated-concept-maker](apps-ayokoding-www-annotated-concept-maker.md) — writes Annotated-concept tutorials
- [apps-ayokoding-www-by-example-maker](apps-ayokoding-www-by-example-maker.md) — writes By Example tutorials
- [apps-ayokoding-www-deployer](apps-ayokoding-www-deployer.md) — deploys ayokoding-web to production
- [apps-ayokoding-www-general-maker](apps-ayokoding-www-general-maker.md) — writes general content
- [apps-ayokoding-www-in-the-field-maker](apps-ayokoding-www-in-the-field-maker.md) — writes In-the-Field guides
- [apps-ayokoding-www-link-checker](apps-ayokoding-www-link-checker.md) — audits content links
- [apps-ayokoding-www-link-fixer](apps-ayokoding-www-link-fixer.md) — repairs link findings
- [apps-ayokoding-www-primer-maker](apps-ayokoding-www-primer-maker.md) — writes Primer tutorials

## App Deployers

Push each app to its staging or production environment branch after validation.

- [apps-organiclever-app-web-deployer](apps-organiclever-app-web-deployer.md) — deploys the OrganicLever app group to staging
- [apps-organiclever-www-deployer](apps-organiclever-www-deployer.md) — deploys organiclever-www to production
- [apps-ose-app-web-deployer](apps-ose-app-web-deployer.md) — deploys the OSE Application app group to staging
- [apps-ose-www-deployer](apps-ose-www-deployer.md) — deploys ose-web to production
- [apps-web-ui-storybook-deployer](apps-web-ui-storybook-deployer.md) — publishes the web-ui Storybook

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

Cross-cutting agents scoped to no single app: agent scaffolding, API testing, CI standards, and social posts.

- [agent-maker](agent-maker.md) — scaffolds new agents
- [api-exploratory-tester](api-exploratory-tester.md) — tests live APIs against their contracts
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

The pr-review gate: a scout, nine lens checkers, the coordinating checker, and the fixer.

- [pr-review-architecture-checker](pr-review-architecture-checker.md) — reviews architecture
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

Content, tutorial, and running-surface gate pairs; each fixer executes its family's propagation.

- [api-http-checker](api-http-checker.md) — audits a running HTTP API
- [api-http-fixer](api-http-fixer.md) — executes API HTTP Propagation
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
- [ui-web-checker](ui-web-checker.md) — audits a running web UI
- [ui-web-fixer](ui-web-fixer.md) — executes UI Web Propagation

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

Generic code maker, checker, and fixer that load each project's stack packs, plus the UI trio.

- [swe-code-checker](swe-code-checker.md) — audits code against the adopted standards
- [swe-code-fixer](swe-code-fixer.md) — applies confirmed code checker findings
- [swe-code-maker](swe-code-maker.md) — implements code test-first under the adopted standards
- [swe-ui-checker](swe-ui-checker.md) — audits UI components
- [swe-ui-fixer](swe-ui-fixer.md) — repairs UI findings
- [swe-ui-maker](swe-ui-maker.md) — builds shared UI components

## Web

Live-site testers and the web-researcher fact-finding agent.

- [web-design-tester](web-design-tester.md) — evaluates live-site design
- [web-exploratory-tester](web-exploratory-tester.md) — explores a live site for edge cases
- [web-researcher](web-researcher.md) — researches cited facts on the web
- [web-usability-tester](web-usability-tester.md) — evaluates first-time usability
