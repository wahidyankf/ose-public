# P0 macOS rootless Podman capability evidence

## Status

**PASS — selected Desktop macOS P0 capability proof.** The reviewed v3 workflow completed through
one unchanged target-native HIPPO transactional/standard boundary: outer handle 13990 and inner
probe both exited 0. All ownership, read-only mount/rootfs, cgroup, network-none, internal DNS,
PostgreSQL readiness, provider/Unix store and no-host-port assertions passed. Exact native
cleanup returned 0 and the complete before/after inventories matched, including VM helpers.
No pod was created; the pinned public fixture image was already cached and remains retained.

Desktop client and server report Podman 6.1.4; the server is rootless on linux/arm64, with
podman-compose 1.6.0 selected explicitly.
Generated VM identity metadata was verified before named transport; no key contents were read.
Earlier failed/deferred packets, the v2 exit-1 cleanup defect and its separately reviewed
empty-pod recovery remain historical evidence below. No app stop, VM restart, global policy,
connection default or UID/GID mapping change was used to pass.

**Laptop boot recovery remains unresolved.** Its existing Machine entered guest emergency mode after Ignition
failed. An independently reviewed, identity-guarded cancellation has now retired that stuck start
and its VM child. The Machine is stopped with its disk present; the guest boot defect remains
unresolved. No container workload or inventory ran there.

## Successful Desktop v3 run

The actual native event window was 2026-10-27 06:00:07–06:00:30 UTC. All 124 observed native
events were retained; critical run/create/start/exec/stop/remove calls had no nonzero results.
The explicit provider argument `--in-pod=false` applies only to this synthetic probe invocation.
The database created through Compose had the same ID through the independent Unix endpoint.

| Check                                        | Actual result                                                  |
| -------------------------------------------- | -------------------------------------------------------------- |
| Container and host-visible bind ownership    | UID:GID 501:20, unchanged plain keep-id                        |
| Representative direct and database memory    | 536870912 bytes                                                |
| Representative direct and database CPU       | cpu.max 50000 100000, exactly 0.5 CPU                          |
| Representative direct and database PID limit | 128                                                            |
| Read-only bind and root filesystem           | Read succeeded, write refused, effective flags passed          |
| No-service networking                        | Effective network mode none                                    |
| Service network and DNS                      | internal=true, dns_enabled=true, database name resolved        |
| PostgreSQL and host ports                    | 17.11 ready; no host port bindings                             |
| Cleanup and preservation                     | All exact native teardown exits 0; complete inventory equality |

Before and after: zero containers, zero pods, zero volumes, the same one pre-existing network,
the same cached image `sha256:9355df27b2506973cfc421408623435f15298511c2cdadc502b7aa580efe611f`,
and unchanged native gvproxy/krunkit identities. The v3 main SHA-256 is
`506d95f8e4c06ab45b96a09b6406b77621c36e9abf121429d3ef1257ba31f0d3`.
The complete terminal and native receipts are retained privately at
`local-tmp/swe-debugger/mac-runtime-recovery/desktop-actual-p0-v3-pass-receipt.md`.
Historical run 82696 remains exit 1; its exact empty-pod cleanup 28227 remains a separate exit 0.
No tool handle or task-owned container, pod, network or volume remains live. The home bind does not
establish the later runner's actual native temporary-parent mount; that P1 proof remains separate.

## Desktop setup and machine metadata

The setup inventory records Podman CLI 6.1.4 and receipt `com.redhat.podman` version 6.1.4. A
target-native HIPPO light invocation confirmed the provider path and `podman-compose 1.6.0` after
setting `PATH=/opt/podman/bin:$HOME/.local/bin:$PATH` for that invocation. The provider check
reported Podman 6.1.4 and exited 0.

A separate target-native HIPPO light metadata packet reported one Machine with literal
`State="running"` and a live user-owned Unix socket. Its output filter supplied defaults for
`Running` and `Rootful`; `Running=false` and `Rootful="unknown"` are not observations of those
fields. The exact-field query that followed was deferred by HIPPO with capacity status 124 before
its payload started. That deferral is not evidence of a Podman Machine failure. A later native API
query confirmed the explicit socket and rootless mode. No Machine was initialized, started,
restarted, or stopped by these observations.

Desktop admission has varied between normal status and memory warnings. A fresh native status at
02:14:03 UTC was normal with zero owners and waiters. The first new read-only packet stopped at
its own metadata precondition: native inspect emitted one Machine tuple plus an empty line, while
the diagnostic expected exactly one physical line. No connection selection or native key handling
was reached. The corrected diagnostic ignores only empty lines and still rejects multiple Machine
tuples; HIPPO deferred it before payload with capacity status124. This is separate from a Podman
failure. The unchanged native machine profile remains the admission boundary.

A bounded, read-only resource recovery diagnostic at 03:11:19 UTC found a fresh HIPPO sample
with macOS memory pressure level 2, `memory-warning`, and admission decision `wait`. Native
`sysctl kern.memorystatus_vm_pressure_level` independently returned 2 at 03:11:36 UTC. HIPPO
reported 32 GiB physical memory, an 8 GiB available estimate, a 4 GiB reserve, and zero active
owners, waiters or allocated resources. Native `memory_pressure -Q` reported 25% free; `vm_stat`
reported about 16.19 GiB wired and 7.18 GiB occupied by the compressor. Swap usage was about
4.13 GiB of 5 GiB. This supports current host memory pressure rather than a stale sample or
an outstanding HIPPO allocation; it does not establish a sampler defect.

Bounded process metadata showed multiple user-owned coding tools, browser processes, a native
virtualization process, Docker's backend and the existing Podman backend. The largest individual
RSS was about 776 MiB. Process RSS does not attribute the much larger wired-memory total to a
particular VM or application. No process was closed or signalled. Recovery may require the user
to close confirmed idle applications or intentionally quit an unused VM application after checking
its active work. These recovery/status observations used the explicit unguarded status exception;
Podman workload verification still requires native HIPPO admission.

A subsequent resource recovery read at 03:17:49 UTC found Docker Desktop was not idle: its
explicit local Unix API reported 12 containers, including 10 running and none paused. Build-cache
metadata reported 16 records with none marked in use, but this does not establish absence of all
build activity. An idle-only Desktop shutdown proposal therefore fails its precondition. Native
CLI help confirmed the normal Desktop stop command is available; it was not executed. No other
application or VM was stopped, and no container names, environment values or labels were exposed.

Fresh status at 03:58:22 UTC was normal/run with storage unblocked, one active HIPPO owner
and zero waiters. A fresh explicit Docker API count was 9 total containers, 7 running. This
operator performed no app stop or container mutation. A separately reviewed stop helper was
copied and byte-verified only; it was not invoked. Its earlier approved-state count differs from
the refreshed private baseline and would refuse. No owner stop authorization was inferred.
Subsequent Podman work still requires actual native admission; the earlier memory-warning
state is historical rather than the latest observed condition.

The subsequent read-only packet exited 0 through the unchanged target-native HIPPO
ephemeral/light boundary. HIPPO itself admitted the child under stable macOS warning pressure
with concurrency 1; this was native admission without a bypass or policy edit. Its saved
admitted status measured 04:03:26 UTC and recorded the light owner alongside a foreign standard
owner. The profile file SHA-256 matched its earlier value. Native machine and connection
queries returned 0. Selection required the single running rootless Machine's actual SSH port,
remote username, rootless socket URI and matching generated VM identity metadata. The identity
was a regular file owned by the current user, with no symlink components. Its path and contents
are excluded from output.

Named and explicit Unix info calls returned 0 and agreed on rootless mode, guest hostname and
graph root. The server reports 6.1.4 on linux/arm64 with cgroup v2 and cpu/io/memory/pids
controllers. Explicit parent connection selection plus invocation-scoped CONTAINER_CONNECTION
and provider path reported Podman 6.1.4 and podman-compose 1.6.0. All ten before-inventory calls
returned 0; endpoint inventories matched for containers 0, pods 0, networks 1, volumes 0 and
images 0. These observations establish transport/client selection, not provider-created resource
placement or workload capability.

## Laptop existing Machine

Fresh target-native HIPPO light metadata found exactly one existing `podman-machine-default` in
`stopped` state, with literal `Rootful=false`, SSH port 56555, and its Podman Unix socket path. The
named `podman-machine-default` connection uses that same port and the rootless user socket; the
separate root connection was not used. A Machine already existed, so no initialization or
recreation was attempted. Its container-store contents remain unverified.

Per the plan's service/standard start step, the user-authorized command started this existing
Machine. Its outer terminal handle was not retained, so its exit code is unknown. Recovery metadata
at 01:49:26 UTC showed the machine state `running` but the original target HIPPO service owner
still active. Its task-local stdout contained only `Starting machine "podman-machine-default"`;
stderr was empty; rootless API and before-inventory files did not exist.

Filtered native inspect reports `Created=2026-10-27T08:06:56.453477+07:00`,
`LastUp=0001-01-01T00:00:00Z`, `UserModeNetworking=true`, 4 CPUs / 2 GiB memory / 100 GiB disk,
and no usable provider/image-path values from that projection. The machine was previously stopped and had
no successful last-up timestamp, so the current boot is its first observed start attempt. The
running `krunkit` child is consistent with the default libkrun provider; inspect did not provide a
provider value. Podman 6.1.4 lists libkrun as macOS default in its [machine provider
table](https://github.com/podman-container-tools/podman/blob/v6.1.4/docs/source/markdown/podman-machine.1.md).

Podman 6.1.4 source identifies the host-created ready listener and serial guest log as
`$TMPDIR/podman/podman-machine-default.sock` and
`$TMPDIR/podman/podman-machine-default.log`. The listener exists, but the guest did not connect;
filtered systemd events show `ignition-files.service` exited with status `1/FAILURE` and
`coreos-ignition-unique-boot.service` was stopped after that failure. Ignition then printed its
generic configuration-validity/spec-version message and entered emergency mode. This identifies
the failed service and exit status but not the subordinate failing resource. The retained sanitized receipt is
`local-tmp/podman-personal-machines/mac-laptop-capability/start-recovery.md`. The output included
embedded systemd unit text, which is not reproduced here. No console input, stop, restart, reset,
config change, or key read was performed. See [Podman 6.1.4 Apple Machine startup](https://raw.githubusercontent.com/containers/podman/v6.1.4/pkg/machine/apple/apple.go),
[libkrun VM startup](https://raw.githubusercontent.com/containers/podman/v6.1.4/pkg/machine/libkrun/stubber.go),
[Machine socket configuration](https://raw.githubusercontent.com/containers/podman/v6.1.4/pkg/machine/apple/vfkit.go),
and [Darwin runtime paths](https://raw.githubusercontent.com/containers/podman/v6.1.4/pkg/machine/env/dir_darwin.go).

A later bounded serial-log diagnostic identified the subordinate failure: Ignition2.27.0's files
stage could not create the configured guest user. Native `useradd` exited10 with `cannot lock
/etc/group; try again later`. An earlier root-filesystem check also reported that `/dev/vda4`
was not yet available, exited8 and was ignored by systemd. Those are observed events; their
causal relationship is unproven. No lock deletion, guest filesystem change, new boot or config
read was used to diagnose them. The guest boot defect remains unresolved after cancellation.

## Historical transport failure and probe design

The explicit Unix API packet confirmed client/server Podman 6.1.4 and rootless mode. The same packet
passed the socket URI to `podman compose version`, but Podman exited 125 with `get machine
connection URI: could not find a matching machine for connection "unix://..."`. Under `set -e`, it
stopped before inventory or image-presence checks. The sanitized command and result are retained in
the ignored Desktop capability task receipt `explicit-unix-provider-failure-20261027T0140Z.md`.
The subsequent read-only before-inventory packet was deferred by HIPPO before payload; its command
and response are in `before-inventory-capacity-deferred-20261027T0142Z.md`. Do not infer inventory,
workload, or cleanup results from either receipt.

The later native packet established the verified named Machine connection, matching Unix
endpoint and before inventory. The successful v3 workload proof then reused the Ubuntu probe's
assertions for keep-id bind ownership, cgroup-v2 memory/CPU/PID limits, `network=none`,
internal-network DNS, PostgreSQL health, explicit Compose provider selection, and actual teardown.
If provider transport cannot be supported safely, report the unresolved acceptance proof instead
of changing global connection settings or substituting ambient routing.

Pinned Podman 6.1.4 source review found that Compose with Machine mode enabled maps the explicitly
selected SSH connection's port to its existing Machine and passes that Machine's API socket to the
provider. Therefore a reviewed candidate is an explicit named connection matched to the single
running Machine, after confirming it returns `rootless=true`; a default or guessed connection is
not acceptable. The filtered Machine port and connection URI query at 01:44 UTC was deferred;
the later native packet now establishes that metadata match. The rootless native SSH key is
used only by Podman's named-connection transport under the user's authorization; its contents and
identity path are excluded from output. The inspected source is [Podman 6.1.4 Compose command](https://github.com/podman-container-tools/podman/blob/v6.1.4/cmd/podman/compose.go#L892-L1019),
[Machine socket mapping](https://github.com/podman-container-tools/podman/blob/v6.1.4/cmd/podman/compose_machine.go#L249-L266),
and [connection selection](https://github.com/podman-container-tools/podman/blob/v6.1.4/cmd/podman/root.go#L1973-L2012).

The external podman-compose1.6.0 provider does not forward the parent's `--connection` argument
to its native Podman children. The invocation must also set `CONTAINER_CONNECTION` to the same
verified name and clear conflicting `DOCKER_HOST`, `CONTAINER_HOST` and `CONTAINER_SSHKEY`.
Identity-path metadata must establish that the selected entry uses Podman's generated VM identity;
no identity file contents are inspected or hashed. The named and Unix native engine observations
must agree, and a later uniquely owned provider resource must be inspectable through that same
Unix engine. Client version output alone is insufficient. See the pinned
[provider subprocess implementation](https://github.com/containers/podman-compose/blob/v1.6.0/podman_compose.py#L1781-L1798)
and [Podman connection environment handling](https://github.com/podman-container-tools/podman/blob/v6.1.4/cmd/podman/root.go#L2074-L2107).

The Laptop cancellation gate passed11 isolated fake guard cases plus native Bash3.2 syntax,
ShellCheck and formatter checks, followed by independent static review with zero findings. Those
fixtures performed no actual signal or VM operation and provide no container capability proof.
After coordinator GO, the exact reviewed script verified its byte hash and fresh native UID,
PID/parent/start-time/executable, HIPPO-owner/profile and Machine predicates. It sent one SIGINT
only to the positively owned Podman starter at02:46:09 UTC; command and HIPPO exited0.

The separate postcheck at02:48:28–30 UTC exited0. It found zero active/waiting/service owners,
no matching original service identity, and none of the original HIPPO/shell/Podman/krunkit PIDs.
The Machine reports stopped and Rootful=false; the guest SSH port has no listener. Native stdout
reports termination and completed rollback; stderr is empty. The ready socket and gvproxy PID
file are absent. The VM disk, Ignition file and machine config/lock remain present. No earlier
inode/byte snapshot was captured, so this establishes presence and source-supported absence of
disk-deletion callbacks, not byte identity. The original start's lost outer exit remains unknown.
No direct child signal, second start, reset, recreation, disk read/deletion or global change ran.

Preserve the existing Machine and every pre-existing resource. Pull only the public pinned fixture
image if it is absent, with a task-owned empty auth file. Remove only resources created by this
run after verifying their unique task labels and names. Leave the image cache intact. Record exact
native cleanup statuses and prove the final resource inventory matches the initial one apart from
an intentionally retained public fixture image.

## Deferred attempt and limits

The 2026-10-27 01:31 exact-field metadata query was rejected before payload startup with HIPPO
`capacity-deferred` (SSH 124). Its retained terminal is
`local-tmp/plan/docker-to-podman/mac-installed-verification/20261027T0131Z/desktop-machine-inspect-details-terminal.txt`.
The subsequent target-native 01:35 status reading is metadata only. The 01:40 packet establishes
explicit-endpoint API reachability and rootless mode, but not inventory or workload capability.
The earlier read-only Desktop inventory and filtered machine/connection packets were deferred;
the later admitted native packet passed both transport checks and before inventory. Laptop's
failed guest start was gracefully cancelled and its Machine is
stopped; its rootless API, provider, inventory, mount, cgroup, DNS, health and workload teardown
have not been tested.
The successful v3 run now completes Desktop provider-created resource placement and workload
capability proof; Laptop workload proof remains unavailable. Public OCI metadata established that
the earlier Ubuntu fixture is an AMD64 leaf. The same immutable official build index also
contains an ARM64/v8 leaf, retaining the PostgreSQL release and variant. The prepared probe pins
ARM leaf `sha256:a717692f944862397bd102c6abee9b3f7927adbf7ee5f3a93e50b65aea0c5396`
and exact config/image ID
`sha256:9355df27b2506973cfc421408623435f15298511c2cdadc502b7aa580efe611f`.
No config/layer bytes were fetched for that metadata research. The subsequent authorized
workflow pulled the exact ARM fixture with an empty owned auth file; its native digest, image
ID, architecture and OS assertions passed. The fixture image is intentionally retained.
See the [official PostgreSQL image tags](https://hub.docker.com/_/postgres/tags).

The repaired v2 probe retains the original UID/GID, bind, cgroup, network-none, internal DNS,
PostgreSQL health and native teardown assertions. Independent review found a lexical identity
prefix could admit parent traversal; v2 now rejects dot/parent components and verifies physical
containment under the generated identity directory without reading its contents. Review also
found provider down could sweep unrelated project-labeled networks or volumes. V2 removes
that operation and uses only exact names with positive owner/run checks and native teardown.
Unknown foreign project-labeled objects remain untouched; changed final inventories fail proof.

Native receipt 35713 exited 0 with all nine frozen source checksums, Bash 3.2, 16 identity/route
cases, 14 routing/ownership/collision cases and two tests of the actual cleanup function: 32
cases total. Syntax, ShellCheck, formatting and Python compilation pass; strict Cloud Python
checks also pass for unchanged Python source. These fakes made no engine API or container calls.
The representative cgroup value assertions cover direct bind and database containers; they do
not claim every helper has those limits. The actual runner's native temp-parent mount remains
separate later proof; the P0 home-directory bind does not establish it.

The actual v2 workflow was independently approved and admitted through native HIPPO
transactional/standard at 05:17:36 UTC; its outer handle 82696 ended 1. Plain keep-id retained
container UID/GID 501:20 and the host-visible file owner 501:20. Direct and Compose database
cgroup files reported 536870912 bytes, cpu.max 50000 100000 and 128 PIDs. The read-only mount
refused a write, network-none was inspected, internal DNS resolved the database and pg_isready
succeeded. The provider-created database ID matched the independent Unix engine, PostgreSQL
reported 17.11, the expected named data volume matched and no host port bindings existed.

All exact container, network and volume teardown returned 0. Final containers/volumes were
empty, the original network and native gvproxy/krunkit identities matched, and only the pinned
image was retained. Pods changed from zero to one: provider defaults created an empty,
infra-less project pod without owner labels. This caused the final preservation assertion to
fail. Read-only diagnosis through both verified engines confirmed the exact created pod was
empty. Raw optional fields were omitted by native serialization; explicit typed accessors
positively established empty membership and no infra container, without inventing raw nulls.
After independent review and root GO, exact full-ID pod removal without force returned 0 in
28227 and restored the original inventories with the pinned image retained. The original 82696
exit 1 was preserved. Separately reviewed invocation-scoped --in-pod=false and a fresh run ID
then produced the successful full v3 run above. No mapping change, app stop, VM restart or
broad provider down was used.
