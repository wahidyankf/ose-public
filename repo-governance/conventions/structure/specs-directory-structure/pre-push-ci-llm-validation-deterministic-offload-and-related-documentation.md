---
description: The gating surfaces for specs validation, the LLM-driven semantic-validation layer, the deterministic-vs-LLM reasoning split, the manual review checklist, and related-convention links
when_to_use: Read this when checking which CI surfaces gate specs/ changes, what specs-checker validates semantically, or doing a manual review pass on a specs/ change.
---

# Pre-Push/CI Gating, LLM Semantic Validation, Deterministic Offload, Manual Checklist, and Related Documentation

## Pre-push + CI gating surfaces

No hook or gate validates a specs tree's layout. Per-project BDD coverage runs through every affected
`test:quick`; repeated primary keywords are valid for a continuous journey.

- `.husky/pre-push` — `./rhino gate run --surface pre-push` runs only its registry-declared gates
  (public safety and environment policy) and no specs validation
- `.github/workflows/pr-quality-gate.yml` — the language jobs run affected `test:quick`, which includes
  each owner's `test:coverage:behaviour`
- `_reusable-www-test-local-deploy.yml` and `_reusable-app-test-local-deploy-stag.yml` — the
  `specs-coverage` job runs the static `test:coverage` targets and remains in deployment prerequisites,
  called by the www and app cron deploys

The retired Rhino testing-contract, keyword-cardinality, and structural-validation commands are not
part of the active lifecycle. Semantic binding substance belongs to the Gherkin implementation review.

## LLM Semantic Validation (specs-checker)

`specs-checker` validates categories that require semantic judgment: narrative coherence, terminology drift, C4 diagram consistency, cross-folder contradictions, and PM-readability compliance. See [Specs Validation Workflow](../../../workflows/quality/specs-quality-gate.md).

## Deterministic Offload

The reasoning split between deterministic and LLM checks follows the principle that counting, path comparison, and file-system walking belong in deterministic tooling, not in LLM context. Where a deterministic check exists (`test:coverage:behaviour` for the Gherkin corpus, `./rhino md internal-link validate` for links), `specs-checker` carries its result; where none exists, as for tree layout and README counts, `specs-checker` judges the property itself.

## Manual Verification Checklist

When reviewing changes to the `specs/` directory, verify:

- [ ] Every deployed surface has a logical owner corpus at the product root
- [ ] No flat-root artifacts remain (`be/`, `web/`, `cli/`, `c4/`, `contracts/` at root)
- [ ] BE, web, and CLI specs use domain subdirectories (never flat under `gherkin/`)
- [ ] Lib specs use package subdirectories under `gherkin/`
- [ ] `README.md` index files exist at every directory level
- [ ] New projects include only the folders their surface profile needs
- [ ] Entry listing in a corpus README follows canonical order: `architecture.md`, `contracts/`, `behaviours/`

## Related Documentation

- [App README vs Specs Convention](../app-readme-vs-specs.md) — combined convention: content split rule, PM-readability contract, BDD/Contracts adoption
- [Specs-Application Sync Convention](../../../development/quality/specs-application-sync.md) — bidirectional sync between specs and application code
- [Behaviour-Driven Development](../../../development/behaviour-driven-development.md) — canonical corpus, adapters, coverage, and exemptions
- [Behaviour-Driven Development](../../../development/behaviour-driven-development.md) — mandatory Unit proof and boundary-applicable Integration/E2E testing
- [Acceptance Criteria Convention](../../../development/infra/acceptance-criteria.md) — Gherkin writing standards for feature files
- [File Naming Convention](../file-naming.md) — general file naming patterns
- [Plans Organization Convention](../plans.md) — similar convention for plans/ directory structure
- [Specs Validation Workflow](../../../workflows/quality/specs-quality-gate.md) — iterative validation workflow
