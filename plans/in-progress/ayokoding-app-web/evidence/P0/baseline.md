# Old-App Baseline Evidence

## Scope and safe preflight

- Revision under test: `bafba8b77f634cca89a5967f142767b81d743248` (`origin/main`).
- The old app's quick target is sequential: typecheck, lint, unit, then static coverage. Its integration target depends on `build`, which first runs `generate-indexes` and `generate-search-data`, followed by Next build. The index generator can write tracked `content/**/_index.md`; therefore `ayokoding-www:validate-indexes` was run first under HIPPO `ephemeral/standard`. It exited 0 and reported no stale index files.
- `generate-search-data` writes `apps/ayokoding-www/generated/search-data.json`; Next build writes `apps/ayokoding-www/.next/`. These are build outputs. The integration caller uses an in-process caller over `FileSystemContentRepository`; it opens no listener. FE and BE E2E configs both use port 3101, but no E2E server was started during this action.

## Quick target

Command at the worktree root, with the approved HIPPO host policy, task TMPDIR, and corrected tool PATH/DOTNET_ROOT:

```bash
rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ayokoding-www:test:quick
```

Result: exit 1 after 548.09 seconds.

| Target                        | Result                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `ayokoding-www:typecheck`     | Passed.                                                                           |
| `ayokoding-www:lint`          | Passed; emitted warning-level findings under content code-example files.          |
| `ayokoding-www:test:unit`     | Failed due one Vitest fork error: 246/247 files passed, 3,970/4,177 tests passed. |
| `ayokoding-www:test:coverage` | Not reached by the sequential quick target.                                       |

Vitest reported one unhandled worker error and timed out terminating the worker for `apps/ayokoding-www/tests/unit/fe-steps/cost-of-living-calculator.steps.tsx`. That worker hit a Node V8 heap out-of-memory failure near 2.0 GiB after about 496 seconds. The command-level environment had Node `v24.16.0`, no `NODE_OPTIONS`, and a default V8 heap limit of 2,240 MiB. The test file's existing comment documents repeated rendering of roughly 90+ city/role rows in the min-role calculator scenarios under coverage. This identifies the observed per-process exhaustion; the assigned swe-debugger is investigating its root cause. No heap limit, worker count, target, or test was changed, and the suite was not retried.

The test process emitted an aggregate line-coverage figure of 99.09%, but the worker failure invalidates the run as a passing gate. No product assertion failure was reported before the worker failure.

## Integration target state

An Integration invocation was requested but cancelled immediately on the root's hold before build or test execution:

```bash
rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ayokoding-www:test:integration
```

Its brief startup showed only the two declared build dependencies beginning; no integration tests or Next build ran. The command exited 130 on cancellation and is not an Integration result. The preceding index validation passed; after cancellation, `git diff -- apps/ayokoding-www/content` was empty. No shared content was changed and no listener was opened.

## Sanitized raw output

An ignored terminal excerpt is stored at `local-tmp/plan/ayokoding-app-web/quick-baseline-excerpt.log`. It records the OOM message, worker termination, and Vitest counts; the interactive terminal output itself was truncated by the execution tool, so the excerpt is explicitly partial.

## Follow-up after calculator worker repair

The calculator worker issue was repaired by the separately assigned debugger in three test-only files. The original failing quick run above is retained as history. A subsequent full quick run (HIPPO session `41660`) exited 0: all 248 test files and 4,180 tests passed, with 99.54% line coverage against the 99% floor. The static behavior-coverage targets for Unit, Integration, and E2E also passed, covering 63 features and 487 expanded scenarios. An independent code review of the three-file repair across ten reviewed files returned zero findings. Full output and the repair/review records are in ignored working evidence at `local-tmp/swe-debugger/calculator-full-quick.log`, `local-tmp/swe-debugger/calculator-oom.md`, and `local-tmp/swe-reviewer/calculator-lifecycle-review.md`.

## Integration retry after repair: storage-blocked before tests

The same guarded Integration command was run once after the quick baseline passed:

```bash
rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ayokoding-www:test:integration
```

The build dependencies completed: search data generated 2,329 documents (4.1 MB), the Next.js build compiled and typechecked, and all 3,278 static pages were generated. Before any Vitest output or Integration test counts appeared, the Nx process entered disk wait while finalizing the build/cache outputs. HIPPO terminated the selected ephemeral child with exit 124 and reported `hippo.limit.storage-blocked` after a disk warning. Therefore this attempt provides no Integration test result. It was not retried, and no disk floor, test, target, or output cleanup was changed as part of this baseline action. After termination, the owned process tree was reaped, no listener was open on port 3101, and `git diff -- apps/ayokoding-www/content` was empty. A post-stop filesystem check showed 17 GB free; HIPPO reported 16.07 GiB free. Resource/cache growth diagnosis is assigned to the root coordinator's debugger.

## Subsequent repairs and remaining gates

Storage diagnosis identified an unpublished partial Nx cache copy duplicating the completed
build output. After verifying ownership, byte identity, and absence of open file descriptors,
the debugger removed only that partial cache copy, reclaiming approximately 12.64 GB. The
subsequent cache-free Integration invocation (session `69157`) exited 124 under HIPPO
memory-pressure enforcement during static generation, before any Integration tests ran. Both process
trees were reaped. Resource floors and the full build dependency graph remain unchanged.

A reviewed local build-worker setting now permits an explicit one-worker build while preserving
the existing two-worker default and hosted behavior. Its assertion-based RED was 34/39 passing;
the final focused GREEN was 45/45. Independent review accepted the implementation and the
override/CI/VERCEL cache inputs. The original Integration target still requires a complete
cache-free run with one worker; focused build-worker proof does not close that gate.

The calculator semantic repairs subsequently exposed twelve test failures and one unhandled
transport error in the complete focused Unit file (session `30090`, 515/527 passing). Diagnosis
distinguished fixture, selector, exact floating-point, timer-driver, and transport-fixture errors
from a missing visible Lifestyle expense row. The latter received component regression RED
(15/17) and GREEN (17/17) before full confirmation. The complete corrected calculator Unit file
then passed 527/527 with zero errors (session `19942`, 260.95 seconds). These are focused runtime
results; the current full quick target, browser E2E proof, independent delta review, and complete
Integration target remain pending.
