---
description: Quality standards and evidence practices for trustworthy repository changes
when_to_use: Use to decide what evidence, test, or validation a change needs before it can be trusted.
---

# Quality Development

Use this section to decide what evidence a change needs before it can be trusted. It connects
local checks, tests, and captured results to the quality of the product readers and users
experience.

## Scope

**Belongs here:** code quality automation, validation methodologies, criticality/confidence
level systems, content preservation, quality gate standards.

**Does not belong:** why quality matters (a principle), specific validation implementations
(agents/), content writing standards (conventions/).

## Documents

- [Code Quality Convention](./code.md) — Code quality tools (Prettier, Husky, the Rhino gate registry, and an on-demand Commitlint config) and git hooks. Use when configuring, debugging, or bypassing a code-quality git hook or formatter.
- [Markdown Quality Standards](./markdown.md) — Automated markdown linting and formatting standards using Prettier and markdownlint-cli2. Use when checking markdown linting/formatting config, fixing a violation, or troubleshooting a gate.
- [Stack Standards](./stacks/README.md) — The adopted language, framework, and tooling standards and the repository adapter that records their decisions. Use when writing or reviewing code in a stack this repository builds with.
- [Testing Standards](./testing/README.md) — Language-neutral testing standards shared by every stack. Use when judging whether coverage measures meaningful behaviour.
- [Type and Boundary Safety](./code/type-and-boundary-safety.md) — The strongest practical checker, rare type escapes, and outside input validated on arrival. Use when code parses outside input or weakens a type.
- [Shell Scripts](./code/shell-scripts.md) — One declared interpreter in strict mode, the executable bit, comments, and parsed JSON. Use when writing or reviewing a shell script.
- [Cross-Language Lint Strictness](./cross-language-lint-strictness.md) — Uniform warning-and-above lint threshold across every language and artifact type. Use when adding, changing, or auditing a lint gate.
- [Behaviour-Driven Development](../behaviour-driven-development.md) — Defines mandatory Unit proof, boundary-applicable Integration/E2E, static coverage, and exemptions. Use when scoping, writing, or reviewing automated behaviour proof.
- [Unit, Integration, and E2E Testing Standard](./three-level-testing-standard.md) — Compatibility entry point for older three-level-testing references; delegates to the canonical BDD standard.
- [Content Preservation Convention](./content-preservation.md) — Principles and processes for preserving knowledge when condensing files. Use when condensing a file or extracting duplicated content.
- [Criticality Levels Convention](./criticality-levels.md) — Universal criticality level system for categorizing validation findings. Use when a checker or fixer agent needs to classify a finding.
- [Fixer Confidence Levels Convention](./fixer-confidence-levels.md) — Universal confidence level system for fixer agents to assess and apply fixes. Use when a fixer agent needs to assess confidence before applying a fix.
- [Repository Validation Methodology Convention](./repository-validation.md) — Standard validation methods and patterns for repository consistency checking. Use when writing or debugging a repository-wide validation check.
- [No Machine-Specific Information in Commits](./no-machine-specific-commits.md) — Prohibits absolute local paths, usernames, IPs, and environment-specific config in committed code. Use when writing or fixing a commit with a machine-specific value.
- [Specs-Application Sync Convention](./specs-application-sync.md) — Bidirectional sync requirement between specs/ and application code in apps/ and libs/. Use when a code change might require a matching specs/ update, or vice versa.
- [Manual Behavioural Verification Convention](./manual-behavioural-verification.md) — Requires real-browser UI proof, `rtk curl` HTTP proof, or protocol-native non-HTTP wire proof. Use after implementing a UI or API change, before declaring it done.
- [Evidence Capture Convention](./evidence-capture.md) — Standards for capturing testing evidence (screenshots, curl output, logs) in plan folders and delivery.md. Use when capturing, naming, or referencing testing evidence.
- [Feature Change Completeness Convention](./feature-change-completeness.md) — Requires related specs, contracts, tests, and docs to update with any feature change. Use when landing a feature change and deciding what else it must update.
- [CI Blocker Resolution Convention](./ci-blocker-resolution.md) — Preexisting CI blockers are investigated at the root cause and fixed, never bypassed. Use when a CI check fails and you need to resolve it without bypassing the gate.
- [Plan Anti-Hallucination Convention](./plan-anti-hallucination.md) — Pre-write verification, repo-grounding, refuse-on-uncertainty, and confidence-labeling for plan content. Use when an AI agent authors or checks a plan claim.
- [User-Facing Delivery Hardening Convention](./user-facing-delivery-hardening.md) — Sixteen rules so design-parity and behavioural defects cannot ship past green gates. Use when planning, executing, or archiving a user-facing feature plan.
- [Regression Test Mandate](./regression-test-mandate.md) — Every bug fix must land with a reproducing test in the same commit/PR. Use when landing a bug fix and deciding what test it must include.
- [Live-Tester Systematic Coverage](./live-tester-systematic-coverage.md) — Enumerate-not-sample forcing-functions for the live-site testers and web-ux-test-fixing-planning. Use when a live-site tester needs to enumerate coverage instead of sampling it.
- [Git Fixture Isolation Convention](./git-fixture-isolation.md) — Defense-in-depth mandate for any test/fixture that shells out to git to build throwaway repos. Use when writing or reviewing such a fixture.
- [Knowledge Capture Convention](./knowledge-capture.md) — Standards for capturing generalizable learnings during plan execution and routing them safely. Use when a plan surfaces a generalizable learning to capture or route.
- [PR Reviewer-Discipline Convention](./pr-review-disciplines.md) — Defines the nine PR-review specialist disciplines and the boundary tie-breaker rule. Use when a PR-review specialist needs its owned scope, or a finding needs disposition.
- [Anti-Patterns in Quality Development](./anti-patterns.md) — Catalog of eleven common quality-development anti-patterns. Use when reviewing a change for a common quality anti-pattern.
- [Best Practices for Quality Development](./best-practices.md) — Catalog of ten actionable best practices for code quality and validation. Use when looking for a proven practice to apply.

## Related Documentation

- [Development Index](../README.md) — All development practices.
- [Nx Target Standards](../infra/nx-targets.md) — How test:unit/integration/e2e map to Nx targets.
- [Automation Over Manual Principle](../../principles/software-engineering/automation-over-manual.md) — Why automated quality matters.
- [Maker-Checker-Fixer Pattern](../pattern/maker-checker-fixer.md) — Quality workflow pattern.
- [Repository Architecture](../../repository-governance-architecture.md) — Six-layer governance model.
