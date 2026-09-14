---
description: The four gating surfaces that run specs validation, the LLM-driven semantic-validation layer, the deterministic-vs-LLM reasoning split, the manual review checklist, and related-convention links
when_to_use: Read this when checking which CI surfaces gate specs/ changes, what specs-checker validates semantically, or doing a manual review pass on a specs/ change.
---

# Pre-Push/CI Gating, LLM Semantic Validation, Deterministic Offload, Manual Checklist, and Related Documentation

## Pre-push + CI gating surfaces

Specs structure validation remains registry-declared. Per-project BDD coverage runs through every
affected `test:quick`; repeated primary keywords are valid for a continuous journey.

- `.husky/pre-push` — `./rhino gate run --surface pre-push` hands the surface to the registry, which
  reads them
- `.github/workflows/pr-quality-gate.yml` — the `specs-structure` job in `quality-gate.needs:`
- `_reusable-www-test-local-deploy.yml` and `_reusable-app-test-local-deploy-stag.yml` — the
  `specs-gate` job in `deploy.needs:`, called by the www and app cron deploys

The retired Rhino testing-contract and keyword-cardinality commands are not part of this structural
gate. Semantic binding substance belongs to the Gherkin implementation review.

## LLM Semantic Validation (specs-checker)

`specs-checker` validates categories that require semantic judgment: narrative coherence, terminology drift, C4 diagram consistency, cross-folder contradictions, and PM-readability compliance. See [Specs Validation Workflow](../../../workflows/specs/specs-quality-gate.md).

## Deterministic Offload

The reasoning split between deterministic and LLM checks follows the principle that counting, path comparison, and file-system walking belong in Rust/deterministic tooling, not in LLM context. Categories tagged `[Deterministic]` in `specs-checker` shell out to `rhino-cli`; categories tagged `[LLM]` keep LLM-driven reasoning.

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
- [Specs Validation Workflow](../../../workflows/specs/specs-quality-gate.md) — iterative validation workflow
