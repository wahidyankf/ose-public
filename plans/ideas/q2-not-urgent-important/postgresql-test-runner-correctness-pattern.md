# A durable pattern for PostgreSQL-backed test runners

One-line summary: the same PostgreSQL startup-race defect class was root-caused three separate times,
in two files written independently, inside one plan — and nothing in `repo-governance/` holds the
pattern, so the next author gets to rediscover it a fourth time.

> Routed here 2026-09-17 by the Knowledge Capture phase of
> [`ose-id-init-01-foundation`](../../done/2026-09-17__ose-id-init-01-foundation/learnings.md), which
> flagged it as a `rules-propagation` candidate rather than an ad-hoc edit from inside that plan's
> delivery unit.
> Updated 2026-10-14: the `ose-id` product and the two files that showed the pattern were removed from
> this repository. The done plan's learnings entry is now the only source, and this brief reads from it.

## Problem / context

`ose-id-init-01-foundation` needed eight separate concurrency fixes before its local-stack runner was
reliable under repeated real starts and stops. That runner and its tests were removed on 2026-10-14;
the done plan's learnings entry records every fix and its failure sequence. Four of those eight are
not about that runner at all — they are properties of driving a containerized PostgreSQL from a test
harness, and they were each learned the expensive way:

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
in the removed ose-id local-stack runner (a JavaScript script) and in its shared C# PostgreSQL test
helper — two files written separately, by separate passes, that nobody connected until both broke in
the same investigation. The learnings entry names both files. The fourth item above was found not by a
purpose-built concurrency test but by an ordinary fresh-stack start under heavier Docker-daemon load,
after six full-suite runs had already passed.

## Why now

The repository has no PostgreSQL-backed product today, because `ose-id` was removed on 2026-10-14.
The next one is the reason to write this down: the queued
[`ferret-init-02-local-backend`](../../backlog/ferret-init-02-local-backend/README.md) plan adds a
loopback PostgreSQL stack, and a later core banking or ERP delivery would add more. Without a page,
each new PostgreSQL-backed product would rediscover the same race in its own helper. Writing the
pattern down costs one propagation run now; skipping it costs another multi-run investigation each
time. The window is also still good: all four properties have named error text and a recorded failure
sequence in the done plan's learnings, so the page can be sourced from real transcripts rather than
recalled from memory after that history fades. The code itself is gone, so the learnings entry is the
only source.

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
  [rules-propagation](../../../repo-governance/workflows/quality/rules-propagation.md)

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
- A decision on whether the page also points at a shared helper for the next product to adopt, or
  stays a documented pattern only. The two original implementations no longer exist to annotate.

Out of scope:

- Reopening any of the eight fixes. They were merged and verified in the originating plan, and the
  code they fixed has since been removed.
- A generic database-test framework, or extending the pattern to databases this repository does not
  run. PostgreSQL is the only one the originating plan used.
- The test-only port-allocation pattern (`AllocateDistinctEphemeralPorts` versus the narrower
  `AllocateAdjacentFreePortPair`) noted alongside these fixes. It was a real duplication, but it lived
  in one removed project and is not a governance rule.

## Risks & open questions

- **One page or a companion directory?** Four-to-five defaults each needing its observed failure may
  exceed the word budget for a single page under the governance budget rules. (open)
- **Does documenting it change anything?** These are properties a reviewer must actively look for;
  without a check, the page may be read only after the next incident. (open)
- **Ship a shared helper with the page, or document only?** The two originals were one JavaScript file
  and one C# file, so "shared" meant a documented pattern, not shared code — and that is exactly the
  situation that produced the second occurrence. With both removed, the next product's plan decides
  whether it writes the helper once. (open)
- **Over-generalizing from one product.** Every data point comes from a single plan against a single
  service, and that product is now removed. A property that is really about the official postgres
  image's entrypoint should be attributed to that image, not stated as a universal law.

## What success looks like + promotion signal

Success: the next PostgreSQL-backed runner in this repository is written with these defaults already
in place, and a reviewer can cite one page rather than reconstructing the argument from an archived
plan's learnings file. No fourth independent rediscovery of the same race.

**Promotion signal**: promote to a full plan only if the answer to "ship a shared helper" turns out to
be yes, because that is new code with its own test obligations. If the outcome stays documentation,
one `rules-propagation` run is the whole job. A new independent implementation appearing with the same
defect class forces promotion either way.
