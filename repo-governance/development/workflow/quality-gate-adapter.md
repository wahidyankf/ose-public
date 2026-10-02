---
description: >-
  Records how this repository adopted the shared quality gate catalog: its gate families and subjects, callers, entry and
  exit tools, local skill names, catalog owners it lacks, and the agents it kept or retired.
when_to_use: >-
  Use when running or changing a quality gate here, when a copied gate cites a rule this repository lacks, or when
  re-adopting a catalog revision.
---

# Quality Gate Adapter

This repository follows the [Quality Gate Contract](./quality-gate-contract.md) and
[Sole-Writer Propagation](./sole-writer-propagation.md). Each family's gate and propagation live in
[`workflows/quality/`](../../workflows/quality/README.md); its checker and fixer live in `.agents/agents/`. The gates are
copies of a shared catalog revision, and every adopting commit names it in an `OSE-Rules-Commit:` trailer. Product rules
live in [Gate Adapters](../quality/gate-adapters/README.md), never in a gate.

## Families and Subjects

`repo-config.yml` declares sixteen families under `policies.governance.quality-gates`, with `mode: normal` and
`max-cycles: 3` as defaults:

- **Catalog families:** `plan`, `docs`, `rules`, `harness`, `ci`, `pr-review`, `specs`, `ui-web`, `api-http`,
  `content`, `pdf-to-md`, and the four tutorial kinds, `tutorial-by-example`, `tutorial-in-the-field`,
  `tutorial-primer`, and `tutorial-annotated-concept`.
- **Local family:** `docs-software-engineering-separation`, whose default subject is
  `docs/explanation/software-engineering`.
- **Content subjects:** `apps/ayokoding-www/content` by default and `apps/ose-www/content` when named, each judged
  through its product adapter.

## Callers

A gate runs only when its caller names it. The plan gate runs from Planning, Parity Planning, UX Review Fix Planning,
Dependency Bump Planning, and Multi-Plans Execution. The UI web and API HTTP gates run as the surface-conditional
tester gates of Planning and Plan Execution. The pr-review gate runs from [PR Review](../../workflows/quality/pr-review.md);
every other gate runs on explicit request.

## Entry and Exit Tools

`./rhino gate run --surface pre-commit` and `--surface pull-request` run the declared tools that each gate's
Deterministic Boundary names: formatting, `markdownlint`, front matter, heading hierarchy, Markdown naming, both Mermaid
validators, harness adapters, governance vendor independence, public safety, and this contract's own
`governance-quality-gates` check. Affected Nx `build`, `test:quick`, and `lint` targets run under HIPPO. No gate here
checks internal links or word budgets, so both stay judgeable.

## Local Skill Names

A copied agent preloads the local skill that holds the catalog skill's procedure. The main mappings are
`applying-content-quality` to `docs-applying-content-quality`, `validating-governance-rules` to
`rules-validating-governance`, `checking-harness-compatibility` to `harness-compatibility-protocol`,
`validating-specification-structure` to `specs-validating-structure`, `applying-ci-standards` to `ci-standards`,
`synthesizing-review-findings` to `pr-review-synthesis-coordination`, `producing-review-findings` to
`pr-review-specialist-protocol`, `classifying-review-scope` to `pr-review-scout-classification`, and
`resolving-review-threads` to `pr-review-fixer-resolution`. Generic skills take the `docs-` or `repo-` prefix.

`pr-review-logic-checker` drops `validating-specifications`, which has no local holder; its specification questions stay
with the specs gate.

## Owners This Repository Lacks

A copied gate's link to a catalog rule with no local holder was removed, keeping the rule's name as plain text:
bounded convergence, evidence over assertion, one source per fact, test data isolation, release cut, harness parity
verification, exploratory usability review, architecture specifications, and the Rust standards. The gate's own text
states what it needs from each. Red, green, refactor resolves to
[Test-Driven Development](./test-driven-development.md).

## Local Rules Kept

- [PR Review Disciplines](../quality/pr-review-disciplines.md) keeps this repository's scope guard, restatement by
  value, the code-related test, and the sibling handoff record, which the catalog pr-review gate does not carry.
- Where an earlier fixer used a different threshold from its gate, the gate's value wins, and the product adapter
  states it.

## Agents

- **Retired:** the `apps-ayokoding-www-general-*` and `-facts-*` pairs and the `apps-ose-www-content-*` pair fold into
  `content-checker` and `content-fixer`; the per-kind AyoKoding pairs fold into `tutorial-<kind>-checker` and
  `-fixer`; `harness-compatibility-*` becomes `harness-*`; and the `pr-review-*-maker` agents become the lens
  checkers, `pr-review-scout`, and `pr-review-checker`.
- **Kept:** the `docs-tutorial-*` trio for tutorials under `docs/`, the AyoKoding link checker and fixer, every maker,
  and the deployers.
- **Added:** `plan-fixer`, `rules-fixer`, and the `ui-web`, `api-http`, `content`, `pdf-to-md`, and tutorial pairs.

## Related Documentation

- [Quality Gate Contract](./quality-gate-contract.md) — the shared gate shape.
- [Quality Workflows](../../workflows/quality/README.md) — every gate and propagation here.
- [Gate Adapters](../quality/gate-adapters/README.md) — product rules the generic gates read.
