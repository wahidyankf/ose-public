# A durable pattern for PostgreSQL-backed test runners

One-line summary: the same PostgreSQL startup-race defect class was root-caused three separate times,
in two files written independently, inside one plan — and nothing in `repo-governance/` holds the
pattern, so the next author gets to rediscover it a fourth time.

> Routed here 2026-09-17 by the Knowledge Capture phase of
> [`ose-id-init-01-foundation`](../../done/2026-09-17__ose-id-init-01-foundation/learnings.md), which
> flagged it as a `rules-propagation` candidate rather than an ad-hoc edit from inside that plan's
> delivery unit.

## Problem / context

`ose-id-init-01-foundation` needed eight separate concurrency fixes before its local-stack runner was
reliable under repeated real starts and stops. Four of those eight are not about that runner at all —
they are properties of driving a containerized PostgreSQL from a test harness, and they were each
learned the expensive way:

- **A one-time readiness probe proves only that the probe saw a ready instance.** `pg_isready` can
  observe the official postgres image's temporary init-script instance and report ready moments
  before that instance's socket disappears and the real long-running instance takes over. This is a
  documented characteristic of that image's entrypoint, not host flakiness. The fix is to probe with
  the exact connection the next step depends on.
- **Probing is not enough either; every startup statement needs the retry.** Once the probe's own
  `SELECT 1;` succeeded, the two follow-up role-creation `psql` calls were unretried, so the same
  transition landing in the gap between them still aborted startup — more likely, measurably, once
  two containers started concurrently.
- **A narrow error-text match only handles the failures seen so far.** The first retry pattern
  matched "socket gone / connection refused / database system is starting up"; the very next
  full-suite run found the same transition's other manifestation, where the temp instance forcibly
  closes an already-connected client (`FATAL: terminating connection due to administrator command`).
- **"Already exists on a retry is success" is sound per statement and unsound per block.** One `psql`
  invocation combined `CREATE ROLE`, `CREATE ROLE`, and `CREATE DATABASE` under `ON_ERROR_STOP=1`. On
  a retry after a raced connection, the first statement's benign "already exists" aborted the
  invocation before `CREATE DATABASE` ran — while the caller read "already exists" in stderr and
  reported the whole call successful. The database was then silently never created.

The decisive evidence is not any one of these. It is that the identical class existed independently
in `apps/ose-id-be-e2e/scripts/local-stack.mjs` and in `apps/ose-id-be-e2e/steps/PostgresResource.cs`
— two files written separately, by separate passes, that nobody connected until both broke in the
same investigation. The fourth item above was found not by a purpose-built concurrency test but by an
ordinary fresh-stack start under heavier Docker-daemon load, after six full-suite runs had already
passed.

## Why now

The repository now has exactly one PostgreSQL-backed product (`ose-id`), and its backlog holds eight
further OSE ID plans that will add tenancy, sessions, and federation — each one a fresh opportunity
to write a third helper with the same shape. Writing the pattern down costs one propagation run now;
skipping it costs another multi-run investigation each time a new helper appears. The window is
also unusually good: all four properties are freshly evidenced with named error text, named files,
and a recorded failure sequence, so the document can be sourced from real transcripts rather than
recalled from memory later.

## Prior art / precedents

- **The originating learnings entry** — the numbered eight-fix list and its "Generalizable rule"
  paragraph are the direct source text for the proposed page.
  [learnings](../../done/2026-09-17__ose-id-init-01-foundation/learnings.md)
- **Integration test target contract** — defines the layer boundary that decides which of these
  properties belong to Integration helpers and which to E2E ones.
  [mandatory-targets-integration-tests](../../../repo-governance/development/infra/nx-targets/mandatory-targets-integration-tests.md)
- **Flaky tests are defects** — the rule that forbids the cheap alternatives (retry the test, sleep,
  widen, skip) and therefore forces root-cause patterns like these.
  [flaky-tests-are-defects](../../../repo-governance/development/workflow/test-driven-development/flaky-tests-are-defects.md)
- **Trustworthy measurement** — the practice behind "a readiness check that passed proves the check
  passed, not that the next action will succeed".
  [trustworthy-measurement](../../../repo-governance/development/practice/trustworthy-measurement.md)
- **Rules propagation workflow** — the required route for a new durable page under
  `repo-governance/development/`.
  [rules-propagation](../../../repo-governance/workflows/rules/rules-propagation.md)

## Proposed direction (sketch)

Add one durable page under `repo-governance/development/` whose subject is correctness for tests and
runners that own a real PostgreSQL. Four defaults, each stated as a falsifiable requirement with the
observed failure that motivates it: probe readiness through the connection the next step actually
uses; retry every startup-phase statement, not just the probe; match every documented manifestation
of the dependency's two-phase-startup race, not only the first one observed; and never combine
non-idempotent DDL statements into one `ON_ERROR_STOP` retry unit, because per-statement
idempotency-on-retry is the only sound form. A fifth, adjacent default is worth considering in the
same page: a resource creator must clean up its own partially-created resource on any failure after
creation, independent of the caller's stage bookkeeping.

The propagation run decides the page's exact home in the `development/` tree and its enforcement
disposition. A plausible disposition is documented-only at first, since the properties are shapes a
reviewer can check but a linter cannot.

## Rough scope & non-goals

In scope:

- One new page capturing the four (or five) defaults, sourced from the recorded fixes.
- A conflict scan against the BDD contract, the Integration target contract, and the flaky-tests rule.
- A decision on whether the two existing implementations are refactored toward a shared helper or
  simply annotated as the reference implementations.

Out of scope:

- Reopening any of the eight fixes. They are merged, verified, and not up for re-litigation here.
- A generic database-test framework, or extending the pattern to databases this repository does not
  run. PostgreSQL is the only one in the tree.
- The test-only port-allocation pattern (`AllocateDistinctEphemeralPorts` versus the narrower
  `AllocateAdjacentFreePortPair`) noted alongside these fixes. It is a real duplication, but it is a
  refactor candidate in one project, not a governance rule.

## Risks & open questions

- **One page or a companion directory?** Four-to-five defaults each needing its observed failure may
  exceed the word budget for a single page under the governance budget rules. (open)
- **Does documenting it change anything?** These are properties a reviewer must actively look for;
  without a check, the page may be read only after the next incident. (open)
- **Extract a shared helper, or document and leave two implementations?** One is JavaScript and one is
  C#, so "shared" means a documented pattern, not shared code — but that is exactly the situation
  that produced the second occurrence. (open)
- **Over-generalizing from one product.** Every data point comes from a single plan against a single
  service. A property that is really about the official postgres image's entrypoint should be
  attributed to that image, not stated as a universal law.

## What success looks like + promotion signal

Success: the next PostgreSQL-backed runner in this repository is written with these defaults already
in place, and a reviewer can cite one page rather than reconstructing the argument from an archived
plan's learnings file. No fourth independent rediscovery of the same race.

**Promotion signal**: promote to a full plan only if the answer to "extract a shared helper" turns out
to be yes, because that is a code change across two languages with its own test obligations. If the
outcome stays documentation, one `rules-propagation` run is the whole job. A third independent
implementation appearing with the same defect class forces promotion either way.
