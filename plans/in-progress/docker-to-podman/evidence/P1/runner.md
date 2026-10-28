# P1 runner GREEN evidence

This file records the GREEN runs, the native Podman proof, and what is still unproved for Phase 1 (AC-04 to
AC-06). It is a sanitized copy of untracked scratch receipts and a raw run log. It states only what those
sources say. The RED runs are in `evidence/P1/runner-red.md`.

Tool versions: Podman 5.7.0, from the preflight receipts. The sources do not state the Go version.

## GREEN results

| #   | Check                                                                                                                    | Outcome                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1   | The focused tests in `runner-red.md` (rows 1 to 9)                                                                       | Each passed after the change. Row 1, 3 and 4 one test each, row 2 four subtests, row 5 two tests              |
| 2   | `go test` of `containerplan`, `adapters/containers`, `adapters/cli`                                                      | Three packages passed, then invalidated by later changes                                                      |
| 3   | Integration tests `TestBuildPreflightPreservesMissingAndUnusableCommand`, `TestRootfulProbeAndBuildRefuseBeforeMutation` | Passed, including the 126 and 127 subcases                                                                    |
| 4   | Preflight status regression cases 125, 126, 127 for the selected executable                                              | Passed                                                                                                        |
| 5   | `TestNativeBuildInstrumentationPreservesOriginalArguments`                                                               | Original arguments preserved after only the two flags are inserted. Explicit pull, push, and login are denied |
| 6   | Formatting and golangci-lint                                                                                             | 0 issues                                                                                                      |
| 7   | nilaway, build, compile-only tests                                                                                       | Passed                                                                                                        |
| 8   | Race-enabled tests over all internal packages                                                                            | Passed. The containers package was rerun under race after the executable change                               |
| 9   | `ayokoding-cli:test:coverage` (four static adapters)                                                                     | Passed: 14 features, 70 expanded scenarios. This is static registration evidence only                         |
| 10  | Final focused lint, fake BDD bindings, denial and selection tests, three preflight integration cases                     | Passed after the stronger exit-125 assertion                                                                  |

The receipts give no exit code and no per-run test count for these runs, except where the table gives one.

## Native Podman proof

`TestNativePodmanCharter` ran once with real rootless Podman under HIPPO (standard tier). It passed in 46.254s.
`TestNativeMissingTagCharter` ran once under HIPPO (light tier). It passed in 0.178s. Raw logs are scratch files and
are not tracked. The proof below is quoted from them.

### Same-store derived and environment images

| Step                    | Observed                                                                                                                                                                                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cached pinned base      | `image inspect --format {{.Id}}` on the digest-pinned `python:3.15` base returned `f6b86d5d4f2dbae7cb5b805d3b086a3a27e313c6cdfe588f15e2ce21cdff3480`                                                                                                                                                                              |
| Derived image build     | `build --pull=never --network=none --layers --format docker ...` ran `FROM` the pinned base and tagged `localhost/ayokoding-toolchain/p1-...`. Image ID in the first run `5b5d4caff1be5a5d397c5e4155028dac385f22cc2200634f9d179e093e62f9fd`, in the second run `f1c98a3bec06c83b41b93337be90a90895be8e484787dbebf9fd61d3e121ebcd` |
| Derived image run       | `run ... --pull never <derived tag>` printed the baked proof value                                                                                                                                                                                                                                                                |
| Environment image build | `FROM` the derived tag (a local reference, no registry copy), tagged `localhost/ayokoding-env/p1-...`. Image ID `01af63543a7b477befda018ab5b43b86b442653b890f9ed8b41cb066941a5b67`                                                                                                                                                |
| Environment image run   | The run printed both baked proof values: the derived one and the environment one                                                                                                                                                                                                                                                  |
| Pull and push           | Both builds used `--pull=never --network=none`. The test denies explicit pull, push, and login                                                                                                                                                                                                                                    |

The original build argv was `build --layers --format docker ...`. The test inserted only `--pull=never` and
`--network=none`. The tag, file, and context arguments matched the original (scratch paths not repeated here).

### Inspect and negative assertions

- `image inspect --format {{.Id}}` was called on the base, the derived image, and the environment image. Each observed
  ID is above.
- `ps -a --filter label=ayokoding.run=<run id> --format {{.Names}}` ran before and after each run. The per-run
  container inventories were empty before and after.
- `image exists <tag>-missing` ran before a run of a missing tag. The run then used `--pull never` and failed.
- `TestNativeMissingTagCharter` requires the native process exit status 125 and logged `raw native podman exit status: 125`.
  No image was built or pulled. The production supervisor reports 125 as run exit data. A run that expects 0 is an
  exit-mismatch finding, not a supervisor status of 125.
- Real provider dispatch passed with the competing provider unused. A real unavailable connection returned 125 with
  no workload started.
- The run argv matched the original exactly. It carried `--network none`, `--read-only`, `--tmpfs /tmp:rw,nosuid,size=512m`,
  `--cap-drop ALL`, `--security-opt no-new-privileges`, `--pids-limit 256`, `--memory 536870912`,
  `--memory-swap 536870912`, `--cpus 0.5`, `--userns=keep-id`, `--user <uid>:<gid>`, and `--pull never`.
  The receipts record this as argv comparison, not as container inspect data. They hold no `container inspect`
  output for resource limits or networks.

### Exact removals and remaining owned resources

| Run                        | Removed by exact name                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| Charter, environment false | The derived image `ayokoding-toolchain/p1-...` (`image rm`)                                       |
| Charter, environment true  | The environment image `ayokoding-env/p1-...`, then the derived image `ayokoding-toolchain/p1-...` |

- After removal, `image exists` returned 1 for all three owned tags.
- The pinned base image and all foreign resources were not removed.
- Owned containers: none remained. The inventories above were empty.
- A separate SIGINT of a full Godog run (about 165s, `signal: interrupt`) is not passing evidence. After it, container
  and network lists filtered by the `ayokoding.run` label returned no resources. No prune and no signal to a foreign
  process was used.
- Owned networks and volumes: the receipts check networks only after the interrupted run. They do not list networks
  after the charter runs.

## Tool-path incident

One `apply_patch` call defaulted to the primary checkout and touched three files under `apps/ayokoding-cli`:
`tests/support/fakecontainer/main.go`, `internal/adapters/cli/build_test.go`, and
`internal/adapters/containers/build_test.go`. The exact patch was reversed at once. The root session confirmed the
primary checkout kept only its earlier unrelated change. Later patches used absolute execution-worktree paths. No
broad revert was used.

## Not proved by these receipts

The Phase 1 runner item and gate need more than this file shows. The receipts say these are not established:

- Full mixed-runtime Godog run, its 99% coverage floor, and the `ayokoding-cli:test:quick` gate.
- Real `ayokoding-cli:test:integration` and `ayokoding-cli:test:e2e` Nx targets under rootless Podman, including
  runner-owned service, lockfile, cancellation, and orphan-cleanup fixtures.
- Native default-runtime course smoke, and Mac Desktop.
- Native same-store and unreachable helpers in the broader BDD suite. They fail on purpose until an approved safe fixture
  and connection route exist.
- Final semantic review.

## Omitted

Host paths in the raw logs, the user and group IDs, the HIPPO machine configuration, and the process group
number are left out. Image IDs and run labels are kept because they are not secrets.
