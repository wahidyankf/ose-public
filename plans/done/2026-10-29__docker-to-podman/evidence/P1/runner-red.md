# P1 runner RED evidence

This file records the failing runs that came before the Go runner changes for Phase 1 (AC-04 to AC-06). It is a
sanitized copy of untracked scratch receipts and states only what they say. The receipts give no exit code for
these Go test runs, so the table shows outcome text only.

Command shape: `./hippo run --class ephemeral --resource-tier standard --disk-path . -- go test <package> -run <Test> -count=1`,
run from `apps/ayokoding-cli`.

## Not counted as RED

- A first compile in the system temporary directory failed on a disk quota before any assertion ran. Later runs used a
  task-owned temporary directory on the worktree filesystem.
- A direct binding test first failed on an undefined step. That is a missing step, not a behavior RED.
- `TestPodmanAdapterSelection` first failed to compile. After a seam was added, its RED was a real assertion
  (see row 8).

## RED table

| #   | Test                                                       | Package                         | RED outcome (assertion failures)                                                                                        |
| --- | ---------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | `TestPodmanLocalReferencesAndIdentity`                     | `internal/domain/containerplan` | Default runtime was still `docker`. Local image classified wrongly. keep-id and `--pull never` missing.                 |
| 2   | `TestProbeRequiresRootlessInfo`                            | `internal/adapters/containers`  | Four subtests failed. The probe ran `version` instead of `info`. Rootful, missing, and malformed answers were accepted. |
| 3   | `TestPodmanNativeBuildAndLocalEnvironmentFrom`             | `internal/domain/containerplan` | Three assertions failed. Buildx was used, and a local `FROM` kept a digest.                                             |
| 4   | `TestBuildRejectsRootfulBeforeContextOrWorkload`           | `internal/adapters/containers`  | A rootful engine returned nil instead of an error.                                                                      |
| 5   | `TestRunEnvPreflightFailurePreservesStatus`                | `internal/application`          | Status was 0 instead of 125.                                                                                            |
| 6   | `TestFakeStoreRejectsMissingLocalImage`                    | `tests/bdd`                     | A missing local image ran instead of failing.                                                                           |
| 7   | `TestBuildProbeUsesThePlannedExecutable`                   | Not stated                      | Preflight used the ambient override while build used the configured executable.                                         |
| 8   | `TestPodmanAdapterSelection`                               | Not stated                      | After the selection seam existed: an assertion showed E2E selected the fake runtime.                                    |
| 9   | `TestNativeBuildInstrumentationPreservesOriginalArguments` | Not stated                      | The two offline build flags were missing from the instrumented argv.                                                    |

Rows 1 to 4 match the Phase 1 RED item: default `podman`, native build argv without Buildx, keep-id and local-only
image handling, and rootful refusal.

## Gaps

- The receipts do not record the RED run of `ayokoding-cli:test:unit` as one Nx target. The REDs above are
  focused `go test` runs.
- No exit code, test count, or timing is stated for any RED run above.
- The receipts do not say which Docker-specific exemption reasons were revalidated.
