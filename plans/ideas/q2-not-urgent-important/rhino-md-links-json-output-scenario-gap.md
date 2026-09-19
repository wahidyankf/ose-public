# Restore the JSON-Output BDD Scenario for `md links validate`

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: the retired `ayokoding-cli`/`ose-cli` link checkers each carried a
`Scenario: JSON output produces structured results`; `rhino-cli`'s successor feature has no
equivalent, even though the JSON-output behaviour itself is live and unit-tested.

> Idea, added 2026-08-18, filed from the `repo-clean-up` plan's `README.md` § Resolved Decisions.
> That plan retired the historical `specs/apps/{ayokoding,ose}/behavior/*-cli/gherkin/links/links-check.feature`
> on the grounds that `md links validate` already carries equivalent spec coverage at repository
> scope — true for every deleted scenario except this one.

## Problem / context

The deleted feature files each carried:

`Scenario: JSON output produces structured results`.

The successor specification in the upstream Rhino repository,
has 10 scenarios covering valid links, broken links, external URLs, `--staged-only`, `--exclude`,
repo-wide scan, and anchor cases — none of them exercises `--output json` / `-o json`.

The behaviour is not missing from the product, only from the BDD spec: JSON output is implemented
in the F# `Rhino.Application` and `Rhino.Cli` projects and covered by Unit tests. So there is no live defect — a
release-blocking gap in JSON-output correctness would already be caught by the unit tests — but the
BDD layer's promise of full behavioural coverage for this command is not actually kept.

## Why now

Not urgent: nothing is broken, and the gap was caught and named during `repo-clean-up`'s own review
cycle rather than discovered later by a consumer of `-o json` output. But it should not sit
unfiled, because the next person auditing `docs-validate-links.feature` against the deleted
`links-check.feature` scenarios would otherwise have to re-derive this exact comparison.

## Prior art / precedents

- [`repo-clean-up`](../../done/2026-08-18__repo-clean-up/README.md) — the plan that retired the CLI
  Gherkin trees and left this one scenario gap, deliberately, per its own scope boundary.
- `apps/rhino-cli/parity-manifest.sha256` — the constraint that makes this non-trivial (see below).

## Proposed direction (sketch)

Add one scenario to `docs-validate-links.feature` exercising `--output json`/`-o json` against a
small fixture, asserting the structured shape (`total_files`, `total_links`, findings array) the
unit tests already assert internally. Wire step definitions reusing the existing JSON-parsing
helpers already used elsewhere in the `rhino-cli` Gherkin suite, if any exist; otherwise add a
minimal one.

## Rough scope & non-goals

In scope: one additional untagged scenario in `docs-validate-links.feature`, mandatory in-process
Unit proof, the applicable real-filesystem Integration adapter, public-process E2E proof, and the
resulting parity-manifest update.

Out of scope: any change to the command's actual JSON schema or behaviour; broader BDD coverage
audits of other `rhino-cli` subcommands.

## Risks & open questions

**The constraint that makes this non-trivial**: `docs-validate-links.feature` is line 571 of
`apps/rhino-cli/parity-manifest.sha256`. Any edit to it opens a byte-identity parity obligation
across `ose-public` and the private sibling — the same class of obligation `repo-clean-up` ruled out of
scope for `apps/rhino-cli/**` generally (`README.md` § Out of scope,
`delivery.md:140`). Executing this idea means either:

- accepting the three-repo propagation as part of the work (the honest, larger option), or
- finding some other way to add coverage that does not touch the parity-pinned file (unclear one
  exists, since the feature file itself is what is under-covered).

- Is a dedicated JSON-output scenario worth a three-repo propagation for a behaviour already
  covered by unit tests? (open — this is really a coverage-philosophy question: does BDD coverage
  need to duplicate unit coverage, or is unit coverage sufficient for machine-readable-output
  correctness specifically?)

## What success looks like + promotion signal

Success: `docs-validate-links.feature` carries a scenario for `-o json`, `apps/rhino-cli`'s
`test:coverage` static aggregate covers every applicable adapter, and the parity manifest is back in sync across all three
repos. Ready to promote once someone is willing to own the three-repo propagation in the same PR —
this is a small idea gated entirely by that one logistics question, not by design uncertainty.
