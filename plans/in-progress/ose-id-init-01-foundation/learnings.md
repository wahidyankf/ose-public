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

## 2026-09-16 — AC-FND-01 local-stack runner: concurrency correctness needed seven separate fixes

**Observation.** `apps/ose-id-be-e2e/scripts/local-stack.mjs`'s own header comment promised
"cleanup only ever touches resources this invocation itself started ... never another concurrent
invocation's resources," but that promise was untested until the plan's own RED list ("two parallel
run IDs", "two backend instances", collision, failure-path) was implemented as real E2E cases
(`LocalStackRunnerTests.cs`, plain xUnit, no `[Binding]`). Running them surfaced seven real, distinct
defects across six consecutive full-suite runs, each found by a failure the layer before it caused:

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

**Generalizable rule.** A "never touches another invocation's resources" concurrency claim is
unverified until a real concurrent-invocation test exists; the RED list in `delivery.md` calling
for "two parallel run IDs" as a distinct case from "two backend instances" was the right call, not
excess scope. Four of the seven fixes (build-directory scoping, self-cleaning partial-failure
resource creation, retrying every startup statement rather than only a single up-front probe, and
matching _every_ documented shape of a two-phase-startup dependency's connection race rather than
just the first one observed) are general patterns any future E2E runner or test helper touching
PostgreSQL in this repo should default to — a one-time readiness check only proves the _check_
observed the real instance, not that the _next_ action will, and a narrow error-text match only
proves it handles the failures seen _so far_. That the identical defect existed independently in two
files (`local-stack.mjs` and `PostgresResource.cs`) that nobody had connected until both broke in the
same run is itself the strongest argument for extracting this pattern to a shared, documented place
rather than trusting the next author to rediscover it. Test-only port allocation needing "N mutually
distinct ports" is also a pattern (`AllocateDistinctEphemeralPorts`) that other E2E step files in
this project already had (in a narrower two-port form, `AllocateAdjacentFreePortPair`) but nothing
shared across files — a REFACTOR candidate, not yet acted on.

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
