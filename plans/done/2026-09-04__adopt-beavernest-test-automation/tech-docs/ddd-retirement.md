# DDD Engineering-Surface Retirement

## Resolved Scope

[Judgment call] As explicitly directed by the user, retire DDD testing and documentation on engineering surfaces until OSE has
a more mature concept. Preserve production domain code and AyoKoding educational content.

Every DDD-specific artifact below `specs/**` in `ose-public` or the private sibling is deleted. No DDD
specification is retained, migrated to the new logical corpus, or classified as a useful exception.

## Delete or Remove

### Specification artifacts

- `specs/apps/organiclever/ddd/**`
- `specs/apps/ose/ddd/**`
- Rhino DDD behavior features and their README/index entries under both repositories'
  `specs/apps/rhino/cli/behaviors/ddd/**`
- Rhino `specs/domain-coverage.feature` and its index entry
- DDD-specific cross-links and normative sections in active OSE/OrganicLever specs
- Any other DDD-specific directory, feature, vocabulary artifact, index, or diagram discovered
  anywhere below either repository's `specs/**`, regardless of whether it was previously optional

### Tooling and tests

- Rhino DDD and glossary application modules, dispatch branches, formatters, configuration types,
  and compile entries that exist only for bounded-context/glossary/domain coverage
- `DddSteps.fs`, `GlossarySteps.fs`, domain-coverage bindings, focused unit tests, and fixtures
- `repo-config.yml` `specs.ddd-areas` and `specs.domain-areas`
- `specs:domain:coverage` targets and their `test:specs` dependencies in `organiclever-be` and
  `ose-be`
- DDD-specific adoption findings in specs checker/maker/fixer skills and agent instructions

### Current engineering guidance

- Prescriptive DDD adoption tables, validators, directory requirements, and current links in
  `repo-governance/conventions/structure/specs-directory-structure/**`,
  `repo-governance/conventions/structure/app-readme-vs-specs/**`, and related READMEs
- DDD-specific backend-pattern guidance where it asserts a current OSE contract rather than a
  generic architecture concept
- Developer docs that present the retired registries or validators as active

## Preserve

- Production source under `apps/**`, including existing `domain/`, `contexts/`, or feature names.
- Product behavior, database contracts, API contracts, and non-DDD Gherkin outside deleted DDD
  specification artifacts.
- C4 diagrams and application architecture docs after removing only stale DDD links/assertions.
- Generic hexagonal, functional-core/imperative-shell, OpenAPI, testing, and architecture guidance
  that remains true without an OSE DDD enforcement contract.
- All DDD educational material under `apps/ayokoding-www/content/**`.
- `plans/done/**` as immutable historical records; current docs may label them historical when linked.

## Boundary Test

Before deleting any path containing `ddd`, classify it:

1. **Anything DDD-specific under `specs/**`\*\* → delete; no retention classification is allowed.
2. **Engineering enforcement or current normative documentation outside specs** → delete/rewrite.
3. **Production implementation** → preserve.
4. **Educational content outside specs** → preserve.
5. **Archived plan/history** → preserve.
6. **Generic third-party terminology or example outside specs** → preserve unless it claims current
   OSE adoption.

An unclassified match blocks the DDD-retirement PR.

## Verification

- In each repository, `rtk rg -n 'ddd|DDD' specs` returns no DDD-specific artifact; any incidental
  non-DDD lexical match must be demonstrated rather than retained by default.
- Repository-wide `rtk rg -n 'ddd|DDD|specs:domain:coverage|ddd-areas|domain-areas'` returns only classified
  preserved matches or explicit historical/revisit notes.
- `rtk nx show projects --with-target specs:domain:coverage` returns none.
- Rhino command help and generated behavior indexes contain no retired command.
- All non-DDD Gherkin cardinality and specs coverage gates pass.
- Internal link and README completeness validation reports no new orphan.
- A diff audit confirms no production source or AyoKoding educational file was deleted or rewritten.

## Rollback and Recovery

[Judgment call] DDD retirement lands as its own delivery unit. If deletion breaks a non-DDD contract,
revert that unit, restore links/targets together, and correct the dependency before retrying. Do not
partially restore commands without their specs/tests/docs because that recreates false support.

No persisted data changes, so data-loss recovery is not applicable.

## Re-Adoption Trigger

DDD can return only through a new literally authorized plan grounded in an approved concept/ADR that
defines:

- the problem DDD solves in OSE;
- bounded-context and ubiquitous-language semantics;
- application/library adoption profiles and non-goals;
- ownership and source-of-truth rules;
- migration from current production structure;
- testable deterministic enforcement; and
- rollback/recovery when the model proves wrong.

The new plan must compare fresh alternatives; it must not treat this retirement or its authoring
history as a solution alternative.
