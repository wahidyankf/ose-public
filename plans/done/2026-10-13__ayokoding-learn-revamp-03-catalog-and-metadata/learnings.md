<!-- Knowledge Capture running log — append entries during execution. -->
<!-- Triage every entry (or record the explicit "none" escape) before archival. -->

# Learnings: ayokoding-learn-revamp-03-catalog-and-metadata

## L1 — Rebuild the app cache-free before fixture E2E (routed inline)

Static pages bake manifest/content data at build time, and the Nx build cache key is
environment-blind: a cached `ayokoding-www:build` from a non-fixture run baked real
manifests into the E2E pages, failing two specs that the API (runtime env) answered
correctly. Rebuilt with `--skip-nx-cache` under the fixture env; both specs passed.

- Litmus: kept — the fe-e2e README runbook now states the rebuild, catching it next time.
- Secret gate: no secret content.
- Relevance: public repo practice, routes here.
- Terminal: routed inline to `apps/ayokoding-www-fe-e2e/README.md`.

## L2 — Exempt scenarios carry no bindings in the exempt adapter (routed inline)

An `@integration-exempt` scenario's steps left bindings in the integration file, failing
static `test:coverage:integration` with unused-binding errors, while deleting the blocks
broke runtime `describeFeature` (ScenarioNotCalledError). Fix both sides: no bindings for
exempt scenarios in the exempt adapter's files, plus `excludeTags` in `describeFeature`.

- Litmus: kept — the coverage-exemptions doc now states the rule, catching it next time.
- Secret gate: no secret content.
- Relevance: public repo practice, routes here.
- Terminal: routed inline to
  `repo-governance/development/behaviour-driven-development/coverage-exemptions-and-execution.md`.

## L3 — Ignored generated search-data.json trips the emoji gate (discarded)

The ignored `apps/ayokoding-www/generated/search-data.json` regenerates with emoji from
course body text during local runs and fails repo-wide pre-commit emoji validation; moved
aside per commit. Discarded: no durable surface in this plan's scope catches it
automatically (hook rescoping belongs to a separate delivery).

## L4 — Never repeat an unverifiable rule citation (discarded)

`verification-notes` cited a "decision 29 / rule 35" that does not exist in the
repository; corrected to the true reason (no screenshot tooling). Discarded: a
one-instance authoring correction, not a durable rule — no surface change catches it
automatically.

## Follow-ups reported without plan authorization

- `ayokoding-cli courses estimate` subcommand (plan 05): recorded in
  `tech-docs/README.md` under out-of-scope follow-ups; no `plans/ideas/` two-pager
  created (not literally authorized).
- Missing `course-paths` row in `specs/apps/ayokoding/www/architecture.md` components
  table: predates this plan; reported, not fixed.
- Plan-02 "plans 02 and 03 may land in either order" text: searched the archived plan-02
  folder; no such text found — nothing to report.
