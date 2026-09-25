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

Most delivery work follows a maker, checker, fixer loop: a maker produces an artifact, the matching checker audits it,
and the matching fixer applies validated findings. Deployers and the PR-review pipeline are single-purpose instead.

## Directory Map

## AyoKoding-Web Content

Create, validate, fix, and deploy ayokoding-web tutorial and content surfaces.

- [apps-ayokoding-www-annotated-concept-checker](apps-ayokoding-www-annotated-concept-checker.md) — audits Annotated-concept tutorials
- [apps-ayokoding-www-annotated-concept-fixer](apps-ayokoding-www-annotated-concept-fixer.md) — repairs Annotated-concept findings
- [apps-ayokoding-www-annotated-concept-maker](apps-ayokoding-www-annotated-concept-maker.md) — writes Annotated-concept tutorials
- [apps-ayokoding-www-by-example-checker](apps-ayokoding-www-by-example-checker.md) — audits By Example tutorials
- [apps-ayokoding-www-by-example-fixer](apps-ayokoding-www-by-example-fixer.md) — repairs By Example findings
- [apps-ayokoding-www-by-example-maker](apps-ayokoding-www-by-example-maker.md) — writes By Example tutorials
- [apps-ayokoding-www-deployer](apps-ayokoding-www-deployer.md) — deploys ayokoding-web to production
- [apps-ayokoding-www-facts-checker](apps-ayokoding-www-facts-checker.md) — verifies factual claims on the web
- [apps-ayokoding-www-facts-fixer](apps-ayokoding-www-facts-fixer.md) — repairs factual findings
- [apps-ayokoding-www-general-checker](apps-ayokoding-www-general-checker.md) — audits general content quality
- [apps-ayokoding-www-general-fixer](apps-ayokoding-www-general-fixer.md) — repairs general content findings
- [apps-ayokoding-www-general-maker](apps-ayokoding-www-general-maker.md) — writes general content
- [apps-ayokoding-www-in-the-field-checker](apps-ayokoding-www-in-the-field-checker.md) — audits In-the-Field guides
- [apps-ayokoding-www-in-the-field-fixer](apps-ayokoding-www-in-the-field-fixer.md) — repairs In-the-Field findings
- [apps-ayokoding-www-in-the-field-maker](apps-ayokoding-www-in-the-field-maker.md) — writes In-the-Field guides
- [apps-ayokoding-www-link-checker](apps-ayokoding-www-link-checker.md) — audits content links
- [apps-ayokoding-www-link-fixer](apps-ayokoding-www-link-fixer.md) — repairs link findings
- [apps-ayokoding-www-primer-checker](apps-ayokoding-www-primer-checker.md) — audits Primer tutorials
- [apps-ayokoding-www-primer-fixer](apps-ayokoding-www-primer-fixer.md) — repairs Primer findings
- [apps-ayokoding-www-primer-maker](apps-ayokoding-www-primer-maker.md) — writes Primer tutorials

## App Deployers

Push each app to its staging or production environment branch after validation.

- [apps-organiclever-app-web-deployer](apps-organiclever-app-web-deployer.md) — deploys the OrganicLever app group to staging
- [apps-organiclever-www-deployer](apps-organiclever-www-deployer.md) — deploys organiclever-www to production
- [apps-ose-app-web-deployer](apps-ose-app-web-deployer.md) — deploys the OSE Application app group to staging
- [apps-ose-www-deployer](apps-ose-www-deployer.md) — deploys ose-web to production
- [apps-web-ui-storybook-deployer](apps-web-ui-storybook-deployer.md) — publishes the web-ui Storybook

## OSE-Web Content

Create, check, and fix ose-web content-layer content.

- [apps-ose-www-content-checker](apps-ose-www-content-checker.md) — audits ose-web content
- [apps-ose-www-content-fixer](apps-ose-www-content-fixer.md) — repairs ose-web content findings
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
- [plan-execution-checker](plan-execution-checker.md) — audits finished plan execution before archival
- [plan-maker](plan-maker.md) — authors a formal plan through both decision gates

## PR Review

The PR-review pipeline: risk-tier scout, nine discipline specialists, a synthesis coordinator, and a fixer.

- [pr-review-architecture-maker](pr-review-architecture-maker.md) — reviews architecture
- [pr-review-docs-maker](pr-review-docs-maker.md) — reviews documentation quality
- [pr-review-fixer](pr-review-fixer.md) — resolves synthesis review threads
- [pr-review-governance-maker](pr-review-governance-maker.md) — reviews governance conformance
- [pr-review-instruction-maker](pr-review-instruction-maker.md) — reviews instruction decay
- [pr-review-integrity-maker](pr-review-integrity-maker.md) — reviews test integrity
- [pr-review-logic-maker](pr-review-logic-maker.md) — reviews business logic
- [pr-review-performance-maker](pr-review-performance-maker.md) — reviews performance
- [pr-review-scout-maker](pr-review-scout-maker.md) — pins the head and routes specialists
- [pr-review-security-maker](pr-review-security-maker.md) — reviews security and leaks
- [pr-review-synthesis-maker](pr-review-synthesis-maker.md) — posts the one consolidated review
- [pr-review-types-maker](pr-review-types-maker.md) — reviews type soundness

## README Tooling

Create, check, and fix README.md content quality.

- [readme-checker](readme-checker.md) — audits README quality
- [readme-fixer](readme-fixer.md) — repairs README findings
- [readme-maker](readme-maker.md) — writes README content

## Repo Governance

Rules and workflow governance, harness-compatibility parity, and plan Phase 0 setup.

- [harness-compatibility-checker](harness-compatibility-checker.md) — audits harness parity and upstream drift
- [harness-compatibility-fixer](harness-compatibility-fixer.md) — repairs harness-compatibility findings
- [repo-setup-manager](repo-setup-manager.md) — runs plan Phase 0 setup and baselines
- [repo-workflow-checker](repo-workflow-checker.md) — audits workflow documentation
- [repo-workflow-fixer](repo-workflow-fixer.md) — repairs workflow findings
- [repo-workflow-maker](repo-workflow-maker.md) — writes workflow documentation
- [rules-checker](rules-checker.md) — audits repository-wide rule consistency
- [rules-maker](rules-maker.md) — writes repository rules and conventions

## Specs

Create and validate specs/ Gherkin feature areas and structure.

- [specs-checker](specs-checker.md) — audits listed spec folders
- [specs-fixer](specs-fixer.md) — repairs spec findings
- [specs-maker](specs-maker.md) — scaffolds spec areas

## SWE Language Dev

Language-specific development agents plus UI and code-quality checkers and fixers.

- [swe-code-checker](swe-code-checker.md) — audits project coding standards
- [swe-csharp-dev](swe-csharp-dev.md) — implements C# code
- [swe-e2e-dev](swe-e2e-dev.md) — implements Playwright end-to-end tests
- [swe-java-dev](swe-java-dev.md) — implements Java code
- [swe-rust-dev](swe-rust-dev.md) — implements Rust code
- [swe-typescript-dev](swe-typescript-dev.md) — implements TypeScript code
- [swe-ui-checker](swe-ui-checker.md) — audits UI components
- [swe-ui-fixer](swe-ui-fixer.md) — repairs UI findings
- [swe-ui-maker](swe-ui-maker.md) — builds shared UI components

## Web

Live-site testers and the web-researcher fact-finding agent.

- [web-design-tester](web-design-tester.md) — evaluates live-site design
- [web-exploratory-tester](web-exploratory-tester.md) — explores a live site for edge cases
- [web-researcher](web-researcher.md) — researches cited facts on the web
- [web-usability-tester](web-usability-tester.md) — evaluates first-time usability
