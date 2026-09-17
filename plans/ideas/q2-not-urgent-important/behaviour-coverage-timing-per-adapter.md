# Say when the static behaviour-coverage check must run

One-line summary: a new `.feature` file that was never registered in its test project ran zero E2E
scenarios while `dotnet test` reported the suite green — and the BDD contract says the static coverage
check belongs in `test:quick` without saying it must also run the moment a feature file is added.

> Routed here 2026-09-17 by the Knowledge Capture phase of
> [`ose-id-init-01-foundation`](../../done/2026-09-17__ose-id-init-01-foundation/learnings.md), which
> flagged it as a `rules-propagation` candidate rather than an ad-hoc edit from inside that plan's
> delivery unit.

## Problem / context

`route-disclosure.feature` was authored with Unit and Integration bindings and was never added to
`apps/ose-id-be-e2e/OseId.Be.E2E.csproj`'s `<ReqnrollFeatureFile>` list. Reqnroll therefore generated
no code-behind for it, and it could not run as an E2E test at all. Nothing failed loudly: `dotnet test`
reports only the scenarios it discovers, and an unregistered feature file is invisible to it rather
than a visible skip. The delivery record for the fix had already recorded "E2E 18/18 green against the
real served pipeline" — true of the existing suite, and entirely uninformative about the new feature.

The gap was caught by the separate static `behaviour-coverage` mapping check, which exists for exactly
this class. It caught it only at a Phase 5 Gate repo-wide pre-push re-run — the first time that check
had ever been run against this feature file in `--adapter e2e` mode, days after the feature landed.

The underlying shape generalizes past Reqnroll. Registering a feature file in its test project is a
separate edit from adding step bindings, in every framework that requires registration at all, and
nothing about writing good bindings implies it. The
[BDD contract](../../../repo-governance/development/behaviour-driven-development.md) already requires
"Gherkin first, Unit always, applicable higher layers, static coverage in quick" — a correct set of
requirements that places the coverage check at a point in time (a `test:quick` run) rather than at an
event (a feature file being added), which is what makes a multi-day window of false confidence
possible.

## Why now

This did not cost a defect in production, but it cost something worse for an evidence-driven
repository: a delivery record that stated a coverage claim which was false at the time it was written
and would have stayed false without a lucky gate ordering. The repository is adding BDD surfaces
quickly — four new projects in the originating plan alone, across two test frameworks (Reqnroll and
Playwright-BDD) with different registration mechanics — so the population of chances to repeat this is
growing. The fix is a sentence in an existing contract, not a build.

## Prior art / precedents

- **Behaviour-Driven Development contract** — the rule this brief proposes sharpening; already
  mandates the static check, does not say when.
  [behaviour-driven-development](../../../repo-governance/development/behaviour-driven-development.md)
- **Feature-change completeness** — the existing anti-hollow-spec machinery, and the nearest precedent
  for "a spec that exists but proves nothing".
  [feature-change-completeness](../../../repo-governance/development/quality/feature-change-completeness.md)
- **Trustworthy measurement, Rule 5** — probes and scans must assert their reach; a green suite that
  never discovered the file under test is that rule's exact failure mode.
  [rule-5](../../../repo-governance/development/practice/trustworthy-measurement/rule-5-probes-and-scans-must-assert-their-reach.md)
- **`vitest-glob-coverage-guard`** — the same silent-zero-execution class from the test-discovery
  angle in TypeScript; a guard for one may inform the other.
  [brief](./vitest-glob-coverage-guard.md)
- **Rules propagation workflow** — the required route for sharpening a contract in
  `repo-governance/development/`.
  [rules-propagation](../../../repo-governance/workflows/rules/rules-propagation.md)

## Proposed direction (sketch)

Run a `rules-propagation` pass that adds an event-triggered clause to the BDD contract: after adding a
new `.feature` file, run the project's static `behaviour-coverage` check for every adapter that file
is applicable to, before claiming any layer covers it — and state plainly that a green
`dotnet test`/`npm test` run is not evidence about a feature the runner never discovered. The clause
should name feature-file registration (Reqnroll's `<ReqnrollFeatureFile>` item, or the equivalent) as
a separate edit that step bindings do not imply.

The propagation run records the enforcement disposition. Documented-only is the cheap answer; the
stronger one is to make the registration gap fail at the point of the edit rather than at the next
`test:quick`, which is a tooling change and therefore a different size of work.

## Rough scope & non-goals

In scope:

- The clause added to `repo-governance/development/behaviour-driven-development.md` through the
  propagation workflow.
- A conflict scan against the CI/Nx-target surfaces that also describe when `test:coverage:*` runs, so
  the new clause does not contradict them.
- A decision on whether the clause names Reqnroll specifically or stays framework-neutral with
  Reqnroll as the worked example.

Out of scope:

- The `ose-id-be-e2e` registration itself, which was fixed and verified in the originating plan.
- Building the stronger enforcement (a check that fails on an unregistered feature file at edit time).
  That is a real candidate, but it is a tooling change with its own scenario coverage and belongs in a
  promoted plan, not in this clause.
- The unrelated `governance-readme-index` `--fail-kinds` defect recorded in the same learnings entry.
  That is a shared `rhino-cli` code bug in a different owning scope and needs its own bug-fix pass.

## Risks & open questions

- **Framework-neutral or worked example?** A neutral clause ages better but gives a reader less to act
  on; naming Reqnroll is actionable today and stale the moment a third framework arrives. (open)
- **Does an event-triggered rule survive contact with real authoring?** A multi-layer BDD pass adds
  several feature files in one sitting; "run the check after adding a feature file" may be read as
  once at the end, which is precisely the reading that failed here. (open)
- **Is documentation the right instrument at all?** The check already exists and already catches this;
  only its timing was wrong. That argues for automation over prose. (open)
- **Cross-repo reach.** The private parity sibling carries the same BDD contract, so the propagation
  pass decides whether the clause is one repo's or both.

## What success looks like + promotion signal

Success: no delivery record again claims a layer covers a feature the runner never discovered, because
the contract tells an author to prove discovery at the moment the feature file lands rather than
whenever the next `test:quick` happens to run.

**Promotion signal**: promote to a full plan only if the enforcement question resolves toward tooling —
a check that fails on an unregistered feature file needs its own design, scenario coverage, and
cross-framework handling. If the outcome stays a contract clause, one `rules-propagation` run finishes
it. A second instance of a feature file silently running zero scenarios forces promotion regardless.
