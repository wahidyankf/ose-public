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

**Disposition.** Pending triage at Phase 6 Knowledge Capture. Candidate durable owner:
`repo-governance/development/practice/resource-aware-development/guarded-admission-and-parallelism.md`
(the nested-chain multiplier and the transitive-server case are both concrete instances of the
"one outer HIPPO boundary per compute-bearing DAG node" rule it already states).

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

**Disposition.** Pending triage at Phase 6 Knowledge Capture. Likely belongs beside the existing
MSBuild-daemon defaults in `workload-classes-and-supervision.md` and/or the checksum-pinned `hippo`
consumer itself (upstream, not this repo) as a third default to disable
(`DOTNET_CLI_UseSharedCompilation=false` / `/p:UseSharedCompilation=false`).

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

**Disposition.** Pending triage at Phase 6 Knowledge Capture. Fixes and the refactor are implemented
in this worktree, uncommitted pending the Phase 4 Gate; the `psql`-retry-on-connection-race pattern
(including the widened error-text match and the already-exists-is-success rule) and the
self-cleaning partial-failure-creation pattern are strong candidates for
`repo-governance/development/` given they were independently needed in two unconnected files in the
same plan — a single documented pattern would have prevented the second occurrence entirely.

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

**Disposition.** Pending triage at Phase 6 Knowledge Capture. Minor severity, informational,
explicitly out of threshold for `strict` mode per the API Quality Gate's own bounded-fix discipline
(one fix pass already spent on AET-001/AET-002); not blocking Phase 5. Candidate owner: either a
`repo-governance/development/` note about `HEAD`-request latency being a distinct ASP.NET Core
testing dimension, or an upstream `.NET`/Kestrel issue if reproducible outside this repo — worth a
quick check of whether a newer Kestrel/.NET version already fixes this before writing a
repository-level workaround.

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

**Disposition.** Observation 1 already fixed in-plan (`swe-csharp-dev`, verified GREEN — see Phase 5
Gate record in `delivery.md`) and Observation 2's symptom already fixed in-plan (the 4 doc reworks,
verified `AUDIT PASSED`); both this entry's generalizable rules and Observation 2's underlying
checker-logic inconsistency are candidates for Phase 6 Knowledge Capture triage, since the checker
itself is shared, repo-wide `rhino-cli` tooling outside `ose-id-init-01-foundation`'s scope to modify
unilaterally. Observation 3 needs no action — informational only.
