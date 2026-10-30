# P0 Ubuntu capability and native teardown recheck

## Result

The original rootless capability assertions passed after the separately approved pasta policy
correction. Actual native database stop, container removal, named-volume removal and network
removal each returned **0**. The earlier rootless-network SIGTERM permission error did not recur.
The successful bounded kernel query contained **zero matching AppArmor denials** for the probe.
This is local Ubuntu evidence; it does not supply macOS, CI or whole-plan readiness proof.

## Identity, command and admission

- Worktree base: `71bb3aa5cadc1043e709e6cb13c2e0ffd8f489a7`.
- Actual installed Podman: `5.7.0+ds2-3build1`; rootless mode was true. The explicitly selected
  pipx Compose provider reported `podman-compose 1.6.0`.
- Command: from the execution worktree root, the pinned HIPPO consumer ran the owned diagnostic
  runner with class `service`, resource tier `standard`, and the unchanged approved machine
  configuration. No dependency, runtime, helper-selection or host-policy change was made here.
- HIPPO execution: `development-service-1793056092933-2123436`, admitted and passed; controller
  session `28936` and probe child both exited 0. Execution began at
  `2026-10-26T23:08:12.935238456Z` and finished at `2026-10-26T23:08:28.96980168Z`.
- The existing image was reused with `--pull=never` / Compose `pull_policy: never`:
  `docker.io/library/postgres@sha256:e4cb93687b062cd25a0e8f672d85a7708235009d70d31f8a7698d9370092a9c4`.
  Its inspected config image ID matched
  `ab20e934b27ba3ff927c1b4c9ff8cf6c32f315f743efe68dd3441182a87fb085`.

The local copy preserves the original probe assertions. An isolated observation wrapper invokes
the fixed native Podman binary, preserves its output, and records every native child PID, argument
list and exit. It does not patch Podman or the Compose provider. Fresh unique names were checked
for collisions before any resource creation or cleanup trap became eligible.

## Observed capability checks

| Check                      | Actual result                                                                   |
| -------------------------- | ------------------------------------------------------------------------------- |
| Rootless operation         | `true`                                                                          |
| Keep-id and bind ownership | Container UID:GID and the created host file matched the invoking account        |
| Memory control             | `memory.max=536870912` in both direct and Compose containers                    |
| CPU control                | `cpu.max=50000 100000`, exactly 0.5 CPU, in both containers                     |
| PID control                | `pids.max=128` in both containers                                               |
| No-service isolation       | Retained exited container inspected as `NetworkMode=none`                       |
| Service network            | Actual network inspected as `internal=true` and `dns_enabled=true`              |
| DNS and readiness          | Client resolved service `db`; `pg_isready -h db` reported accepting connections |
| Host ports                 | No published port bindings                                                      |
| Persistent test mount      | Only the fresh run-specific PostgreSQL data volume was selected                 |

The original invocation and resource/security flags were retained. No privileged, rootful,
host-network or capability-addition fallback was introduced. This recheck does not claim an
additional external-reachability or host-loopback penetration test that was not run.

## Native teardown and anonymous-volume correction

The observer retained these native results independently of the provider's ignored return codes:

| Actual resource operation            | Native exit |
| ------------------------------------ | ----------: |
| Keep-id container removal            |           0 |
| Network-none container removal       |           0 |
| Running database stop                |           0 |
| Database container removal           |           0 |
| Named PostgreSQL data-volume removal |           0 |
| Unique internal-network removal      |           0 |

The provider still tried to stop and remove its never-started static `client_1` name; those
returned 125 and 1 respectively. Its actual one-shot client used a different temporary name and
completed successfully. These retained messages do not represent a failed removal of a resource
that existed. Provider `down` itself returned 0; that status alone remains insufficient proof.

Full before/after inventory, rather than labels alone, exposed two new anonymous volumes from
the image's declared volume in the direct bind and network-none containers. The original probe's
plain container removal did not remove them. Their creation events fell inside the two recorded
native run windows and immediately preceded the uniquely labeled container creation events.
Both were absent beforehand and inspected as anonymous, unmounted and unlabeled. The one-shot
client's separate anonymous volume was already removed by its `--rm` lifecycle.

Only the two positively attributed residual volume IDs were removed after fresh metadata checks,
under a separate HIPPO transactional/standard operation, session `16401`, exit 0. Its observed
native `volume rm` exit was also 0. No old or unclassified anonymous volume was removed.

After that correction, the complete resource snapshot exactly matched the pre-probe snapshot:
zero containers, the same one pre-existing network, the same two pre-existing volumes, and an
empty observed invoking-user helper inventory. This means **zero resources attributable to this
recheck**, not an empty global store. The retained older volumes remain an ownership question
for the coordinator's resource ledger; this report does not classify or remove them.

## Confinement and audit evidence

Actual privileged read-only metadata before and after the probe verified `pasta (enforce)` and
the same two approved policy hashes:

- Main profile: `8505084fd57f255af44887f6a7aa8a7646d3ee22ee6a2a33dfebde76b4509823`.
- Local receive-SIGTERM rule: `aaaacd46f6b5f50041c883174bc028fc628ae6d07e60f4e2e0507136977f09d0`.

Podman metadata still selected `rootlessNetworkCmd=pasta`. A live helper snapshot observed
aardvark and conmon, but did not capture a running pasta label. Therefore this report asserts
loaded enforced policy and configured helper selection, not direct observation of a live pasta
process's label. Observed helper identities had retired in the final snapshot.

The native kernel query for `2026-10-26T23:08:16Z` through `23:08:30Z`, session `66165`, returned 0.
Parsing that captured interval found zero AppArmor `DENIED` events involving profile `pasta` or
command `podman`; the parser and package/helper metadata operation, session `45937`, returned 0.
Earlier diagnostic attempts are retained: an unsupported `--kernel` flag failed before querying;
a corrected grep query returned 1 with empty streams. Neither is used as absence proof. The
successful base interval query and explicit parser supply that proof.

## Retained receipts and limits

Raw native-status JSON, complete original-assertion output, service history, policy metadata,
before/live/final snapshots, event attribution, anonymous-volume cleanup, audit interval and
attempt records remain ignored under `local-tmp/swe-debugger/podman-policy-recheck/`.
The final verification, session `8638`, passed ShellCheck, shfmt, Ruff, strict Pyright, exact
before/final snapshot comparison, unchanged policy comparison and native-status predicates.
All command handles are terminal. The earlier failing teardown evidence remains unchanged.
