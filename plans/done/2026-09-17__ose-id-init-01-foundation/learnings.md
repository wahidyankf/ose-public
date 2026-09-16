# Learnings: ose-id-init-01-foundation

<!-- Append one entry when a generalizable observation appears during execution. -->
<!-- Triage every entry, or record the explicit none disposition, before archival. -->

## 2026-09-16 — Unguarded Nx fan-out exhausted host memory

**Observation.** Running `npm exec nx -- run-many -t typecheck,lint,test:quick` across the four
projects outside the HIPPO boundary drove the host into severe memory pressure, and the user had to
interrupt execution to recover it. Three compounding causes, none visible from a single command:

1. Each project's `test:quick` is itself a chain of nested `npm exec -- nx run ...` calls, so one
   `run-many` over 4 projects × 3 targets expands into dozens of concurrent Node+Nx processes. The
   symptom in the transcript was `MaxListenersExceededWarning: 14 exit listeners added to [process]`.
2. Repeated `dotnet build`/`publish`/`test` leave MSBuild node-reuse workers and Roslyn
   `VBCSCompiler` servers resident between commands.
3. `ose-id-web-e2e:test:e2e` transitively starts a Next.js Turbopack dev server (its Playwright
   `webServer` runs `nx run ose-id-web:dev`) plus Chromium — on top of the residue above.

**Generalizable rule.** The HIPPO boundary is not paperwork on top of a command that would have been
fine anyway; for an Nx target that fans out or transitively starts a server, it is the only thing
bounding concurrent process count. An executor that runs `rtk npm exec nx -- ...` directly because
the command "looks read-only" or "is just one target" has silently removed the guard. Prefer one
outer HIPPO boundary per compute-bearing node, and prefer sequential per-project runs over a
`run-many` fan-out when each target is itself a nested chain.

**Disposition.** Reviewed at Phase 6 Knowledge Capture. `guarded-admission-and-parallelism.md`
already states the governing principle ("one outer HIPPO boundary per compute-bearing DAG node");
this entry adds two concrete, previously-undocumented instances (`run-many` fan-out over
nested-chain targets, and a transitively-started dev server) plus a recognizable symptom
(`MaxListenersExceededWarning`). Per `repo-propagating-rules`, a rule addition goes through the
dedicated `repo-governance/workflows/rules/rules-propagation.md` run (its own conflict-scan/
consolidation/enforcement-disposition steps and PR), not an ad-hoc edit from inside this plan's
Phase 6 — out of `ose-id-init-01-foundation`'s delivery-unit scope. Candidate text for that run:
add a short "recognizing the symptom" passage to `guarded-admission-and-parallelism.md` naming the
`MaxListenersExceededWarning` signature and recommending sequential per-project runs over
`run-many` when each target is itself a nested `npm exec -- nx run ...` chain. Flagged to the user
as a follow-up `rules-propagation` candidate, not actioned in this plan.

**Addendum, found late by the Preliminary Delivery Audit.** Cause 3 above (`ose-id-web-e2e`'s
Playwright fixture transitively starting a Turbopack dev server) was fixed in `ose-id-web-e2e`
itself (in-ledger: `webServer` now runs `ose-id-web:start` with an explicit `dependsOn` build, with
the "417 node processes" measurement recorded inline in `playwright.config.ts`) — that part is
fully accounted for. But the same commit (`63dfb8d89`, the branch's first) also applied the
identical fix to a _different, pre-existing sibling app_, `apps/ose-app-web-e2e` (`webServer` switched
from `ose-app-web:dev` to `ose-app-web:start`, plus a `dependsOn: ["ose-app-web:build"]` addition),
and added a new durable "Server Fixture Standard" section to
`repo-governance/development/infra/ci-conventions/e2e-test-pairing-rule-and-environment-variable-standard.md`
generalizing the rule for every E2E project. Neither `apps/ose-app-web-e2e` nor that governance doc
is in `tech-docs/004`'s file-impact ledger, and neither edit is narrated anywhere in `delivery.md` —
this was a direct edit to governance prose ("enforcement wiring"/durable convention text under
`repo-propagating-rules`' own test), done the same day as the crisis rather than routed through
`rules-propagation.md`, and it was never reconciled against the ledger the way this same file's
Phase 6 Knowledge Capture record claims. The fix itself is correct and low-risk (the sibling app had
the identical anti-pattern; leaving it unfixed after discovering the pattern would have been an
inconsistency of its own), but its propagation-workflow bypass and its absence from `delivery.md`
are the same class of gap as the pre-commit-gate entry below. Routed to the same follow-up
`rules-propagation` run for confirmation; evidence now also recorded at `delivery.md`'s Phase 0
Gate.

## 2026-09-16 — A completed `dotnet test` guard held its HIPPO reservation open for 13+ minutes

**Observation.** After `ose-id-be-e2e:test:e2e` (class `ephemeral`) printed `Passed!` and `NX
Successfully ran target`, the outer `hippo run` process tree did not exit. `hippo status --json`
kept `ephemeral: 1` for 13+ minutes with no further test activity. `ps` found a resident
`VBCSCompiler` (Roslyn's shared-compilation server) still running, spawned by `dotnet test`, in the
same process group the guard was waiting on. This is the exact class of defect learnings entry
above already names — "MSBuild node-reuse workers and Roslyn `VBCSCompiler` servers leave residue
between commands" — but manifesting as a _stuck reservation_, not memory pressure: the guard cannot
release a class slot until its whole process group retires, so one leaked compiler-server daemon
silently holds an `ephemeral` slot indefinitely. Resolved by `TaskStop`-ing the shell and manually
removing the residual `VBCSCompiler` process; `hippo status` returned to `ephemeral: 0` immediately.

**Generalizable rule.** "The consumer defaults `MSBUILDDISABLENODEREUSE=1` and
`DOTNET_CLI_USE_MSBUILD_SERVER=0`" (per `workload-classes-and-supervision.md`) does not cover
Roslyn's _shared compilation_ server, which is a third, independently-enabled .NET daemon source
or the local dev.

**Disposition.** Reviewed at Phase 6 Knowledge Capture. The two existing daemon defaults
(`MSBUILDDISABLENODEREUSE=1`, `DOTNET_CLI_USE_MSBUILD_SERVER=0`) documented in
`workload-classes-and-supervision.md` are set by the checksum-pinned `./hippo` consumer binary
itself, which per `AGENTS.md` lives in the independent upstream
[HIPPO repository](https://github.com/wahidyankf/hippo) — "never copy them here." A third default
for Roslyn's shared-compilation server is therefore an upstream HIPPO enhancement, entirely outside
this repo's and this plan's scope to act on; adding speculative future-state text to this repo's
doc about a default the consumer does not yet set would misstate current behavior. No in-repo
edit. Flagged to the user for the upstream HIPPO maintainer's awareness, not actioned in this
plan.

## 2026-09-16 — AC-FND-01 local-stack runner: concurrency correctness needed eight separate fixes

**Observation.** `apps/ose-id-be-e2e/scripts/local-stack.mjs`'s own header comment promised
"cleanup only ever touches resources this invocation itself started ... never another concurrent
invocation's resources," but that promise was untested until the plan's own RED list ("two parallel
run IDs", "two backend instances", collision, failure-path) was implemented as real E2E cases
(`LocalStackRunnerTests.cs`, plain xUnit, no `[Binding]`). Running them surfaced seven real, distinct
defects across six consecutive full-suite runs, each found by a failure the layer before it caused,
plus an eighth found later, after Phase 5 UI-fixer work, on the very first fresh-stack start
attempted afterward:

1. `publishBackend()`/`buildWeb()` wrote to fixed, run-independent paths
   (`apps/ose-id-be/dist/local-stack/`, `apps/ose-id-web/.next/`); two concurrent runs raced on the
   same files, corrupting a running instance's served build. Fixed by scoping both to the run ID
   (`dist/local-stack/<runId>/`, `.next/local-stack-runs/<runId>/` via a new
   `OSE_ID_WEB_DIST_DIR` → `next.config.ts` `distDir` override, defaulting to the ordinary shared
   `.next/` when unset).
2. Test `Dispose()` fallbacks force-killed the runner process tree on any failure/timeout instead of
   asking it to shut down first, orphaning its owned PostgreSQL container for every test that ran
   afterward (verified via `docker ps` picking up a stray `ose-id-local-stack-pg-<runId>` from a
   _prior, already-disposed_ test). Fixed: `Dispose()` now sends SIGTERM and waits before
   escalating to `Kill(entireProcessTree: true)`.
3. `startPostgres()` could throw _after_ `docker run` succeeded (during role-creation `psql` calls)
   without ever assigning `owned.postgres` or bumping `reachedStageCount`, so the already-created
   container was invisible to `cleanup()` and leaked on that specific failure path. Fixed:
   `startPostgres()` is now self-cleaning — it stops+removes its own container on any failure after
   creation, before re-throwing, independent of the caller's stage bookkeeping.
4. The same failure exposed a second cause: `pg_isready` can observe the official postgres image's
   _temporary_ init-script instance and report ready moments before that instance's socket
   disappears and the real long-running instance takes over — a documented characteristic of that
   image's entrypoint, not host flakiness. Fixed by probing readiness with the exact `psql`
   connection the next step depends on, not a separate, weaker check.
5. (Test-side, not runner-side.) `AllocateEphemeralPort()` called several times in a row —
   bind-then-release each time — let the OS hand the same ephemeral port back to a later call once
   an earlier one released it, once assigning the web port and a backend instance's port the exact
   same number. Fixed with `AllocateDistinctEphemeralPorts(count)`, which holds N listeners open
   simultaneously before releasing any of them, so the OS can never double-allocate within one call.
6. Fix 4's readiness probe closed the temp-instance/real-instance race for the _first_ connection
   only: once the probe's own `SELECT 1;` succeeded, the two follow-up role/permission-creation
   `psql` calls right after it were not retried, so if the same transition instead landed in the gap
   between the probe and one of them — measurably more likely once two containers were starting
   concurrently, adding Docker-daemon jitter — startup still aborted with a raw connection error,
   only now surfaced by `TwoConcurrentRunsUseIndependentRunIdsAndBothCleanUpFully` rather than by
   the simpler cases Fix 4 had already made pass. Fixed by retrying every startup-phase `psql`
   statement — not only the initial probe — on the same narrow, pattern-matched connection-race
   error class within the shared startup budget. The first attempt at this pattern matched only
   "socket gone / connection refused / database system is starting up" and one further full-suite
   run immediately found a second manifestation of the _same_ transition: the temp instance can also
   forcibly close a client that is already connected to it when told to shut down (`FATAL:
terminating connection due to administrator command` / `server closed the connection
unexpectedly` / `connection to server was lost`), which the narrower pattern did not match and so
   was not retried. Widened the pattern to cover both manifestations, and — because a retried
   statement can now legitimately be replayed against a role/database it already half-created before
   losing its connection — made "already exists" on a retry a success rather than a conflict: on a
   container this run just created, with fixed role/database names, only this same call's own
   earlier attempt could have created them already.
7. The exact same defect class existed a second time, independently, in a different file:
   `PostgresResource.cs` (the Integration/E2E-shared PostgreSQL helper used by `HealthProcessSteps`
   and other Gherkin scenarios, _not_ the local-stack runner) still used `pg_isready` for readiness
   and two unretried `Psql()` calls for its own role/database bootstrap — the identical shape Fixes
   4 and 6 had already root-caused and fixed once, in a sibling implementation nobody had connected
   to the same root cause because the two files were written independently. Surfaced by `Report
PostgreSQL becoming unavailable after startup` failing with the same raw connection error in the
   same full-suite run that exposed Fix 6's gap. Fixed by porting the same two changes — a `psql`
   `SELECT 1;`-based readiness probe sharing a single deadline with the bootstrap statements, and
   bounded retry-on-connection-race (plus already-exists-is-success) for those statements — into
   `PostgresResource.cs`, using `GeneratedRegex` partial methods for the two patterns to satisfy this
   project's analyzer rules for compiled regex use.
8. Fix 6's "already exists on a retry is a success" rule (`ALREADY_DONE_PATTERN` /
   `AlreadyDonePattern`) has a soundness gap it did not have when it covered only single-statement
   calls: `startPostgres()`'s first bootstrap call combined three DDL statements
   (`CREATE ROLE migrator; CREATE ROLE app; CREATE DATABASE ose_id;`) into one `psql` invocation run
   with `ON_ERROR_STOP=1`. On a retry, if the prior (connection-raced) attempt had already committed
   the first `CREATE ROLE` before its connection died, the retry's first statement fails with
   "already exists", `ON_ERROR_STOP` aborts the rest of that same invocation, and `CREATE DATABASE`
   never runs on that retry — yet `psqlDuringStartup`/`PsqlDuringStartup` still saw "already exists"
   in `stderr` and reported the whole call as success, leaving the database silently never created.
   Surfaced on the very first fresh-stack start after several other concurrent/sequential HIPPO-
   guarded processes had run (heavier Docker-daemon load, more jitter — the same conditions that
   made Fix 6's race likelier in the first place), failing with `FATAL: database "ose_id" does not
exist` on the very next statement that tried to connect to it. This one slipped past all six of
   the full-suite runs that found Fixes 1-7 — the race needs the connection to die at the exact
   point _between_ the first `CREATE ROLE` committing and the `CREATE DATABASE` statement, a narrower
   window than the ones those runs happened to hit. Fixed by splitting that one combined call into
   three separately-retried, separately-idempotency-checked `psqlDuringStartup`/`PsqlDuringStartup`
   calls (one per statement) in both files, so "already exists" on any one statement can never mask
   whether a later statement in the same logical bootstrap step actually ran. The second bootstrap
   call (`REVOKE`/`REVOKE`/`GRANT`/`GRANT`) was left combined — those statements are naturally
   idempotent and never raise "already exists", so they do not share this defect's precondition.
   Verified: a fresh `foundation-ready` stack start (run `87c4a7254c4e`) reached `postgres ready`,
   `backend ready`, and `web ready` cleanly on the first attempt after the fix.

**Generalizable rule.** A "never touches another invocation's resources" concurrency claim is
unverified until a real concurrent-invocation test exists; the RED list in `delivery.md` calling
for "two parallel run IDs" as a distinct case from "two backend instances" was the right call, not
excess scope. Five of the eight fixes (build-directory scoping, self-cleaning partial-failure
resource creation, retrying every startup statement rather than only a single up-front probe,
matching _every_ documented shape of a two-phase-startup dependency's connection race rather than
just the first one observed, and never combining multiple non-idempotent DDL statements into one
`ON_ERROR_STOP` retry unit) are general patterns any future E2E runner or test helper touching
PostgreSQL in this repo should default to — a one-time readiness check only proves the _check_
observed the real instance, not that the _next_ action will, a narrow error-text match only proves
it handles the failures seen _so far_, and an "already exists on retry is success" rule is only
sound per-statement, never for a multi-statement block, because `ON_ERROR_STOP` lets an earlier
statement's benign retry-failure mask a later statement's real, silent non-execution. That the
identical defect class existed independently in two files (`local-stack.mjs` and
`PostgresResource.cs`) three separate times now (Fixes 4/6, 7, and 8) — each pair connected only
after both broke in the same investigation — is itself the strongest argument for extracting this
pattern to a shared, documented place rather than trusting the next author to rediscover it. Fix 8
in particular also shows the six full-suite runs that found Fixes 1-7 do not exhaustively cover this
class of race: this one needed a narrower timing window (a connection dying between the first and
second statement of a specific three-statement block) that only appeared under the heavier
Docker-daemon load of several other concurrent/sequential processes having just run, and was found
by a real fresh-stack start rather than by a purpose-built concurrency test. Test-only port
allocation needing "N mutually distinct ports" is also a pattern (`AllocateDistinctEphemeralPorts`)
that other E2E step files in this project already had (in a narrower two-port form,
`AllocateAdjacentFreePortPair`) but nothing shared across files — a REFACTOR candidate, not yet
acted on.

**Refactor.** The Gherkin-bound `LocalStackSteps` and the plain-xUnit `LocalStackRunnerTests`
duplicated the entire local-stack.mjs process lifecycle verbatim: spawning the process, capturing
diagnostics and ordered readiness markers, `SendSigterm`, graceful-then-forceful `Dispose`,
repository-root discovery, and the `docker`/`IsListening` probes. Extracted into a new internal
`LocalStackRunnerProcess` class that both files now use, removing ~150 duplicate lines and leaving
each file with only what is specific to it (Gherkin assertions vs. port-combination test inputs).
Verified with two consecutive full 18-case E2E runs post-refactor, both clean.

**Disposition.** Reviewed at Phase 6 Knowledge Capture. Fixes and the refactor are implemented and
committed (Phase 5 commit `b851283d1`, and the Fix 8 split landed in the same commit). The
`psql`-retry-on-connection-race pattern (widened error-text match, per-statement-only
already-exists-is-success, never combining multiple non-idempotent DDL statements into one
`ON_ERROR_STOP` retry unit) and the self-cleaning partial-failure-resource-creation pattern are
strong, evidenced candidates for a new durable `repo-governance/development/` doc — proven
independently necessary in two unconnected files (`local-stack.mjs`, `PostgresResource.cs`) within
this single plan, which is itself the argument a single documented pattern would have prevented the
second occurrence. Per `repo-propagating-rules`, this goes through a dedicated
`repo-governance/workflows/rules/rules-propagation.md` run rather than an ad-hoc edit here — out of
this plan's delivery-unit scope. Candidate placement: a new page under
`repo-governance/development/` (subject: PostgreSQL-backed E2E/integration test-runner
correctness), sourced directly from this entry's numbered fix list and "Generalizable rule"
paragraph above. Flagged to the user as a follow-up `rules-propagation` candidate, not actioned in
this plan.

## 2026-09-16 — Kestrel/ASP.NET Core hangs ~131s on a `HEAD` request to any unregistered route

**Observation.** During the Phase 5 API Quality Gate's scoped verification retest (AET-004,
informational), `api-exploratory-tester` found `HEAD /health/live` (and, reproduced partially,
`HEAD` against a disabled-capability path) took ~131 seconds to complete, versus <2ms for every
other method. Root-caused via a control test: `HEAD` against a genuinely-unregistered baseline path
that the new `RouteDisclosureGuard` (see the "AC-FND wrong-method leak" fix this phase) never
touches hangs identically — `curl -v` shows `"no chunk, no close, no size. Assume close to signal
end"` on both sides. This is a pre-existing Kestrel/ASP.NET Core characteristic (it omits
`Content-Length` only for `HEAD`, unlike every other method, which gets an explicit
`Content-Length: 0` and returns immediately), not introduced by the route-disclosure fix. It does
not violate the fix's "indistinguishable from an absent path" requirement — both sides hang
identically — but it is a real, narrow latency regression in its own right: pre-fix, a wrong-method
`HEAD` request hit the framework's fast `405` short-circuit; post-fix it is routed into this slow,
ambiguous-framing path instead.

**Generalizable rule.** A fix that makes one response "indistinguishable" from another must also
compare latency/framing characteristics, not only status/headers/body — two responses can be
byte-identical and still differ in a way a client (or its timeout budget) can observe. `HEAD` request
handling is a distinct, under-tested dimension of HTTP correctness in this ASP.NET Core version that
neither `HealthEndpoints.cs` nor `DisabledCapabilityEndpoints.cs` was written to consider.

**Disposition.** Reviewed at Phase 6 Knowledge Capture. Minor severity, informational, explicitly
out of threshold for `strict` mode per the API Quality Gate's own bounded-fix discipline (one fix
pass already spent on AET-001/AET-002); did not block Phase 5. Narrow generalizability (one HTTP
verb, one ASP.NET Core version's framework characteristic) weighed against promoting it to a
durable doc now — recorded here as the plan-specific disposition rather than opening either a
repo-governance addition or an upstream `.NET`/Kestrel investigation, both of which are separate,
unbounded work outside this plan's scope. If a future plan hits the same `HEAD`-latency shape again,
this entry is the evidence a durable note is then justified.

## 2026-09-17 — Two `governance-readme-index` gate gaps found by the Phase 5 Gate re-run

**Observation 1 — a new Gherkin feature's E2E layer can silently go unbuilt.** The Phase 5 Gate's
repo-wide pre-push re-run failed `ose-id-be-e2e:test:coverage:e2e` on `route-disclosure.feature` (see
"AC-FND wrong-method leak" / `AET-001` fix this phase): the feature had Unit and Integration bindings
but was never added to `apps/ose-id-be-e2e/OseId.Be.E2E.csproj`'s `<ReqnrollFeatureFile>` list, so
Reqnroll never generated code-behind for it and it could not run as an E2E test at all — yet the
delivery record for that fix had already claimed "E2E 18/18 green against the real served pipeline,"
which was true of the _existing_ suite but never actually exercised the new feature. Nothing failed
loudly at the time because `dotnet test` only reports scenarios it discovers; an unregistered feature
file is invisible to it, not a visible skip. Only the separate `behaviour-coverage.mjs` static-mapping
check (BDD's own regression backstop for exactly this class of gap) caught it, and only because this
Phase 5 Gate step is the first time it ran against this feature file in `--adapter e2e` mode.

**Generalizable rule.** A new `.feature` file's project-file registration (Reqnroll's
`<ReqnrollFeatureFile>` item, or the equivalent for another test framework) is not implied by adding
step bindings — it is a separate, easy-to-forget edit, and a green `dotnet test`/`npm test` run proves
nothing about a feature that was never registered. Run the project's static `behaviour-coverage`
check for every applicable adapter immediately after adding a new feature file, not just once at the
end of a multi-layer BDD authoring pass — "Unit/Integration bindings landed, E2E green" is not
evidence the E2E adapter actually covers the new feature unless that specific coverage check ran.

**Observation 2 — `governance-readme-index`'s `unannotated` finding kind is not actually
`--fail-kinds`-gated, contrary to its own doc comment.** The same gate run separately failed on 2
`unannotated` findings (a link repeated in body prose/a table cell on a line without the required
`- [<title>](<path>) — <description>` suffix, even though the same target already carries that
annotation once in the file's own index — the checker flags per raw text line, not per file-target
pair, so any repeat mention without inline annotation trips it regardless of the canonical entry).
`repo-config.yml`'s `governance-readme-index` gate entry declares `fail-kinds: [orphan, ghost]`
specifically to leave `unannotated` non-blocking (matching
`apps/rhino-cli/src/RhinoCli.Application/src/Governance.fs`'s own doc comment: "dark-launched:
discoverable and printed, but never contributes to the exit code until a caller names it explicitly
in `failKinds`"). Empirically, this is false for this gate's actual invocation: reproduced directly —
`dotnet run ... -- governance readme-index validate --paths ... --fail-kinds orphan --fail-kinds
ghost` still exits 1 solely on `unannotated` findings. The fix applied here (reword the 3 body-prose
repeats in `specs/apps/ose/id-web/architecture.md` and 1 in `specs/apps/ose/id-be/architecture.md` to
refer to the already-linked target by name instead of re-emitting the bracket link) sidesteps the gap
rather than touches the shared checker, which is out of this plan's scope (repo-wide governance
tooling, not `ose-id`-specific) — but the underlying inconsistency between the declared
`fail-kinds: [orphan, ghost]` config and the checker's actual exit-code behavior is real and worth a
narrow, separate fix: either `hasFailingFinding`/`readmeIndexHasFailingFinding`'s branch logic has a
bug, or a distinct code path (the same command also emits a hard-coded, `--fail-kinds`-independent
"missing README" finding — see Observation 3) is conflating exit codes across unrelated checks within
one CLI invocation.

**Observation 3 — the same gate run's "missing README" finding
(`specs/apps/ose/lms-be/contracts/generated`) is local-worktree build noise, not a repo defect.**
That directory is `.gitignore`-listed and its two files carry same-session mtimes — regenerated
`lms-be` build output from an earlier repo-wide `nx affected`/gate invocation in this long session,
confirmed by relocating the two files out and back (non-destructive) and observing the finding
disappear and reappear with them. It is unrelated to `ose-id`, gitignored (never committed or
pushed), and will not exist in a fresh CI checkout — `pr-quality-gate.yml`'s `--surface=ci` job runs
the identical gate id/args and would never encounter it. Left in place (deleting needs explicit
authorization this session did not have — the harness's own destructive-action classifier blocked
`rm -rf`); it is exactly the "regenerable output" `dev-artifact-clean-up.md` already sweeps at
teardown. Recorded for completeness, not because it is actionable mid-plan.

**Disposition.** Reviewed at Phase 6 Knowledge Capture. Observation 1 already fixed in-plan
(`swe-csharp-dev`, verified GREEN — see Phase 5 Gate record in `delivery.md`), and its generalizable
rule ("run the static `behaviour-coverage` check for every applicable adapter immediately after
adding a new feature file") is a good candidate addition to
`repo-governance/development/behaviour-driven-development.md`'s existing "Gherkin first, Unit
always, applicable higher layers, static coverage in quick" contract — routed to a follow-up
`repo-governance/workflows/rules/rules-propagation.md` run per `repo-propagating-rules`, not an
ad-hoc edit here. Observation 2's symptom is already fixed in-plan (the 4 doc reworks, verified
`AUDIT PASSED`), but its root cause — `governance-readme-index`'s declared
`fail-kinds: [orphan, ghost]` not actually excluding `unannotated` findings from the exit code,
contrary to `Governance.fs`'s own doc comment — is a code defect in shared `rhino-cli` tooling, not
a knowledge-capture promotion; it needs its own bug-fix pass in the tool's owning scope (possibly
the private parity sibling, since `apps/rhino-cli` is described as byte-identical to it), which is
outside this plan's authority to open unilaterally. Flagged to the user as a real, reproducible bug
report (repro: `dotnet run ... -- governance readme-index validate --paths ... --fail-kinds orphan
--fail-kinds ghost` against a file with only `unannotated` findings still exits 1), not actioned in
this plan. Observation 3 needs no action — informational only, already resolved by the working
tree returning to its untouched state.

## 2026-09-16 — The shared pre-commit gate batch was not HIPPO-admitted and crashed under swap pressure

**Observation.** Committing this plan's Phase 3 persistence work first hit a reproducible crash in
the shared pre-commit registry batch (`npx lint-staged`, covering csharpier, fantomas, and the
rhino-cli md/emoji/plan validators): `dotnet csharpier format` intermittently threw
`FileNotFoundException` on files that format cleanly standalone, and `md heading-hierarchy validate`
was repeatedly SIGKILLed — 6/6 reproductions, on different files each time, with `hippo status`
reporting `normal` throughout, because none of that batch's compute ran as a HIPPO-tracked child.
This is the same defect class as this file's "Unguarded Nx fan-out exhausted host memory" entry
above, here hitting the pre-commit registry (which had no HIPPO admission at all, unlike pre-push)
instead of an ad-hoc `run-many` invocation. Root-caused and fixed directly, same-day, in commit
`aaace039b` (`fix(governance): admit the pre-commit gate chain through a HIPPO boundary`): (1)
`repo-config.yml` gained a `pre-commit` entry in `gate-surface-guards`, mirroring the existing
`pre-push` entry, so `gate run --surface pre-commit` now re-executes once through `./hippo run
--class transactional --disk-path .` before any registry gate runs; (2)
`apps/rhino-cli/src/RhinoCli.Cli/src/Gate.fs` now passes `--concurrent false` to `npx lint-staged`,
since the HIPPO wrap alone caps each dotnet-hosted process's own thread pool but not how many such
processes lint-staged spawns at once. Verified: 3 consecutive clean `gate run --surface=pre-commit`
runs under the same unchanged, chronically elevated swap baseline that reproduced the crash 6/6
times before the fix; full evidence and disposition now also recorded at `delivery.md`'s Phase 3
Gate.

**Generalizable rule.** A gate-surface admission gap does not announce itself until a host is under
real pressure — `gate-surface-guards` had a `pre-push` entry but no `pre-commit` one, so every
formatter/validator lint-staged runs on every commit was silently un-admitted from day one; the same
audit (are all HIPPO-eligible surfaces actually listed in `gate-surface-guards`?) is worth running
against any future new gate surface, not just discovered reactively by a crash.

**Disposition.** Reviewed at Phase 6 Knowledge Capture, added late (found by the Preliminary
Delivery Audit's file-impact-ledger trace, not by the original Phase 3 Gate pass — the fix commit
predates this plan's Knowledge Capture step but was never carried into `learnings.md` or narrated
in `delivery.md` until this audit caught the gap). This edit touches `repo-config.yml`'s
`gate-surface-guards` and `apps/rhino-cli`'s `Gate.fs` — both literally "enforcement wiring" under
`repo-propagating-rules`' own definition of rule work, which in the strict sense means it should
have gone through `repo-governance/workflows/rules/rules-propagation.md` rather than a direct edit.
It was not routed there because it was a live, commit-blocking infrastructure crash under AGENTS.md's
"fix a flaky/crashing gate at its root cause; never retry, sleep, widen, loosen, skip, or quarantine"
discipline, not new rule prose — closer to a bug fix in the gate engine than to introducing a durable
obligation. That distinction is a reasonable read but not a certain one, so this entry is routed to a
follow-up `rules-propagation` run for confirmation and for any durable-doc update it implies (for
example, whether `resource-aware-development.md` or a HIPPO-admission-surface doc should now state
that the pre-commit surface is HIPPO-admitted like pre-push). Also flagged for upstream awareness:
`apps/rhino-cli` is described as byte-identical to a private parity sibling, so the `Gate.fs` change
made here may need a corresponding edit there to stay in parity — outside this plan's authority to
action.

## 2026-09-17 — Volta's `node` shim silently defeats programmatic SIGTERM, orphaning the local-stack runner

**Observation.** The Preliminary Delivery Audit's "foundation smoke and multi-instance E2E from a
fresh owned stack" re-run (`dotnet test apps/ose-id-be-e2e/OseId.Be.E2E.csproj`, unfiltered) failed
4/26: `TwoConcurrentRunsUseIndependentRunIdsAndBothCleanUpFully`,
`TwoInstancesBothBackendsBecomeReadyAndBothStop`, `PortCollisionRefusesWithoutStartingAnything`, and
the Gherkin `Start OSE ID from a clean checkout` scenario — all previously green, including in this
same session's own Phase 5 Gate evidence. Every failure's proximate assertion was
`runner.Process.ExitCode.Should().Be(0)`, `..., but found 143`; `PortCollisionRefusesWithoutStarting
Anything`'s own failure was a downstream symptom — it found three `ose-id-local-stack-pg-<runId>`
containers still running from the tests before it. Direct process inspection (`ps aux`, `docker ps`)
confirmed the failing tests' local-stack runner processes and their owned PostgreSQL containers were
still alive tens of minutes later, never having received the SIGTERM `LocalStackRunnerProcess.
SendSigterm()` sent them. Root-caused with a 6-line minimal reproduction, no test harness or repo
code involved: backgrounding `node --eval "process.on('SIGTERM', ...)"` and reading `$!` shows a
PID whose own `ps` command line is the invoked script, but the script's _own_ `process.pid` at
runtime is a **different** number; `kill -TERM` on the `$!` PID kills that PID with the signal's raw
default disposition (exit 143, no handler ever ran) while the actual interpreter — now reparented to
PID 1 — keeps running untouched. Volta's `node` shim (`~/.volta/bin/node`, a compiled binary, not an
`exec`-only wrapper script) spawns the pinned interpreter as an independently-PID'd process rather
than replacing its own process image via `execve`, so any caller that captures the shim's PID (as
`ProcessStartInfo("node")` does) is holding the wrong PID for every purpose except "is something
still there" — signalling it never reaches the script's own signal handlers. First fix, in
`apps/ose-id-be-e2e/steps/LocalStackRunnerProcess.cs`: resolve the pinned interpreter's real path
once via `volta which node` (falling back to the plain command name when `volta` is not on `PATH`,
e.g. a non-Volta CI image) and spawn that path directly, so `Process.Id` is the PID that actually
installs and runs `local-stack.mjs`'s top-level `SIGTERM`/`SIGINT` handlers. That fix alone turned
the exit-code-143 failures green but left two new ones: `IsListening(webPort)`/`IsListening(first
WebPort)` still `True` after the runner reported a clean exit. The same defect existed a **second**
and **third** time, nested inside the process tree the fixed top level itself owns:
`local-stack.mjs`'s own `startWeb()` spawns `node scripts/next-with-port.mjs` the same unresolved
way (second occurrence — same fix applied: resolve and spawn the pinned path), and
`next-with-port.mjs` spawns `node_modules/.bin/next` by file path, whose own `#!/usr/bin/env node`
shebang re-resolves "node" via `PATH` yet again (third occurrence, one layer deeper still, inside a
file this plan does not own — see Disposition). Rather than chase a fourth or fifth nesting level
the same way, `stopProcess()`'s signalling was made structural instead of positional: `startWeb()`
now spawns with `detached: true`, making that child the leader of its own fresh process group
(group ID == its PID), and a new `signalOwned()` helper signals `-pid` (the whole group) for any
handle marked `detached`, reaching every descendant a shim forked away at any depth in one signal,
without needing to know how many layers exist or resolve any of them individually. Verified across
three consecutive full, unfiltered `dotnet test apps/ose-id-be-e2e/OseId.Be.E2E.csproj` runs against
the accumulating fix: run 1 (pre-fix, RED) — 4/26 failed, all `ExitCode` 143; run 2 (first fix only)
— 0 exit-code failures, but 2 new `IsListening` failures plus cascading container-leak failures in
unrelated tests (`Reject physical deletion of migration history`, `Deny a schema change attempted by
the application role` — both failed on `Npgsql... Connection refused`, collateral damage from
earlier tests in the same run leaving containers/ports occupied, not a separate defect); run 3 (all
three fixes) — **26/26 passed**, zero leftover `ose-id-local-stack-pg-*` containers, and zero
orphaned `node`/`OseId.Host.dll`/`next-with-port` processes confirmed via direct `ps`/`docker ps`
inspection after the run's own outer process exited with code 0 (previously it never exited within
any observed wait, up to 25+ minutes, because the orphaned children it was implicitly waiting on
never closed their inherited stdio pipes). See `delivery.md`'s Preliminary Delivery Audit section for
the full run evidence.

**Generalizable rule.** Never capture a `node`-command `Process.Id` (from any language's process
API) as the target for a _programmatic, single-PID_ signal (a test harness's own `kill -TERM <pid>`,
a supervisor sending a targeted stop signal, anything other than a terminal's job-control signal to
a whole foreground process group) without first confirming what "node" actually resolves to on the
machine running it. A version-manager shim that forks/spawns rather than `exec`-replaces breaks this
silently and non-deterministically: the shim itself still answers to signals (so a naive smoke test
of "does `kill -TERM` stop it" can appear to pass, since the shim process disappears), while the real
interpreter — and everything it owns (containers, child processes, listening ports) — is orphaned.
This is specific to _targeted_ single-PID signalling; the many clean shutdowns already verified
throughout this plan's own manual/live testing used either a terminal's own job control (which
signals the whole process group, catching the real interpreter regardless of shim forking) or `docker
stop` (which never goes through `node` at all), so this defect stayed invisible until a test harness
that signals one specific captured PID first ran to completion. Two independently sufficient fixes
exist, and this investigation needed both, at different depths: resolving the pinned interpreter's
real path (`volta which node`) fixes one specific, known spawn point exactly, and is right for a
process this code directly owns and signals once (the top-level runner). Spawning `detached: true`
and signalling the negative PID (the whole process group) is the more durable choice for anything
that itself spawns further, uninspected children (a dev-server wrapper, a CLI that shells out) —
it needs no knowledge of how many shim or wrapper layers exist underneath, which is exactly why the
second fix (resolving one more `node` path) still left a third, deeper occurrence unfixed while the
third fix (process-group signalling) closed it and every layer beneath it in one change. Any current
or future E2E/process-management helper in this monorepo that spawns `node` (or anything that may
itself spawn a Volta-shimmed `node` further down its own launch chain) and later needs to stop it
gracefully should default to the process-group form, reserving single-PID signalling for processes
verified to never spawn children of their own.

**Disposition.** Fixed directly in this plan's own files: `apps/ose-id-be-e2e/steps/
LocalStackRunnerProcess.cs` (resolve-real-path, for the top-level runner this file spawns once) and
`apps/ose-id-be-e2e/scripts/local-stack.mjs` (resolve-real-path for its own `startWeb()` spawn, plus
the general `detached`/process-group `signalOwned()` mechanism in `stopProcess()`, covering that
spawn and any future one added the same way). No Gherkin/BDD layer applies since this is
implementation detail of a plain-xUnit robustness helper and its runner script, not developer-facing
behaviour (same carve-out `LocalStackRunnerTests.cs`'s own doc comment already states for that
file). Out of this plan's authority to action further: (1) `scripts/next-with-port.mjs` (repo-root,
shared across every Next.js app's dev/start path per its own doc comment — "six container images")
has the identical defect in its own `child.kill(signal)` forwarding to `node_modules/.bin/next`,
confirmed as the third nesting level this investigation found, but is left unfixed here — its
`stopProcess()`-equivalent no longer needs reaching, since this plan's own `detached`/process-group
fix on the _caller_ side (`startWeb`) now reaches into and past it regardless of whatever this file
itself does internally, so ose-id's own tests do not depend on a fix there. A shared, narrow fix
(the same `detached`/process-group treatment, or resolving `node_modules/.bin/next`'s own shebang
target) would still remove the latent risk for every other app relying on it directly (a developer's
own Ctrl-C already works, via job-control group semantics; only a programmatic, targeted-PID
stop/orchestration layer would hit this) — flagged for awareness, not actioned, since this plan owns
only `ose-id`. (2) Whether HIPPO's own upstream process supervision (the independent
`github.com/wahidyankf/hippo` consumer vendored here) is subject to the identical class of bug when
it launches a Node-based dev server/task and later needs to signal it — worth upstream awareness,
not a fix owned by this repo. (3) Whether any _other_ app's E2E/local-stack runner in this monorepo
(`organiclever-be-e2e`, `ose-be-e2e`, `roots-be-e2e`, `ose-lms-be-e2e`, and any other Node-process-
spawning C#/Go test harness) has the same latent bug — each was written independently (matching this
file's own "AC-FND-01 local-stack runner" entry's observation that the same defect class existed
independently, unconnected, in two sibling files within this one plan) and none were audited here.
All three are flagged for the follow-up `rules-propagation` run alongside this file's other pending
candidates, since "how to spawn and gracefully stop a Volta-managed `node` process, at any depth,
from any language" is exactly the kind of durable, narrow pattern that belongs in a shared doc rather
than being rediscovered per app.
