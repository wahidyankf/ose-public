# Finding: a hard HIPPO shed can leak the E2E PostgreSQL container

## What happened

During the required "green twice consecutively" E2E gate run for Phase 3, the second consecutive
run of `ose-id-be-e2e:test:e2e` was killed by HIPPO mid-run:

```
HIPPO shedding selected service child after swap-critical.
exit=75
```

`hippo status` before and after the shed showed a stable `availableGiB=26.88` (not degraded), and
`ps` showed no runaway process count for this workload — unlike the earlier Turbopack dev-server
incident, this was not caused by the test's own resource use. `sysctl vm.swapusage` at the time
showed `used=7925M/total=9216M` (86%, 1.29GiB free): a host-level swap baseline condition that
predates this test run.

The shed left a container behind: `ose-id-e2e-pg-6331fbdd4133`, surviving because
`PostgresResource.Dispose()` (wired to `[AfterTestRun]`) never ran — a hard process-tree kill
bypasses it. It was removed by its exact name (`docker rm --force --volumes
ose-id-e2e-pg-6331fbdd4133`); no prune or pattern match was used.

## Root cause (generalizable)

HIPPO's shedding reaps the process tree of the child it kills. That correctly cleaned up the
Turbopack incident's ~417 Node workers, because those were child processes. It cannot reach a
`docker run --detach` container, because the container is not a child process of the shedded
`dotnet test` process at kill time — it is a separately-owned OS-level resource, tracked only by
the test's own bookkeeping. Any externally-owned resource a test starts and expects to clean up in
`[AfterTestRun]`/`finally` is exposed to this same gap under a hard shed.

## Fix

`PostgresResource.Start()` now sweeps for stale containers before creating a new one:

```csharp
public static PostgresResource Start(TimeSpan readinessBudget)
{
    RemoveStaleContainers();
    ...
}
```

`RemoveStaleContainers()` lists containers via `docker ps --all --filter
name={NamePrefix}` (`NamePrefix = "ose-id-e2e-pg-"`), re-checks the prefix client-side before
acting (`name.StartsWith(NamePrefix, StringComparison.Ordinal)`), and removes only those exact
matches (`docker rm --force --volumes <names>`). It never prunes and never matches a container this
type did not create — the same ownership discipline `Dispose()` already followed for its own
container.

This closes the leak: a repeated shed can no longer accumulate orphaned containers across runs,
because each new run's `Start()` clears out whatever an earlier shed left behind before it
allocates its own container and port.

## What this is not

This is not a workload-caused resource blowup like the Turbopack incident, so it does not call for
lowering HIPPO caps or an env-var propagation fix. The mitigation is scoped to the actual gap: a
cleanup-ownership seam that a hard shed can bypass, closed with a narrowly-targeted, exact-name-only
sweep in the one resource type that owns an external (non-child-process) OS resource in this test
suite.

## Verification

Both required consecutive E2E runs are captured in this directory
(`e2e-run-1.txt`, `e2e-run-2-fresh-database.txt`), each showing `exit=0`, `11/11` passed, and zero
surviving `ose-id`-prefixed containers immediately after the run.
