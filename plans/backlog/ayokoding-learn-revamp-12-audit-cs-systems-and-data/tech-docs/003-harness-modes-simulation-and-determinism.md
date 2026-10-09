# 003 — Harness Modes, Simulation, and Determinism

The 34 courses of this plan teach time, networks, machines, databases, and distributed failure. Those are the
subjects that a deterministic, offline, unprivileged sandbox finds hardest. This page says how each course
meets the harness anyway: which mode it runs in, how a simulation is written, how a database or a graph or a
document store becomes a service, what a networking or hardware example may and may not do, and which rules keep
the output byte-identical on the double run.

The contract is plan 05's `ayokoding.run/v1` (`run.yaml`), its anchor grammar, its double run, its services,
its static mode, and its simulation convention S1 to S9. This page applies them and does not restate them. Where
the merged names differ from the names used here, Phase 0 records the merged names.

## What the Sandbox Gives, in Short

Each run starts a container with `--network none` (or an internal network when services are declared), a
read-only root, a tmpfs `/tmp`, all capabilities dropped, `no-new-privileges`, 256 processes, `HOME=/tmp/home`,
`TZ=UTC`, `LANG=C.UTF-8`, `SOURCE_DATE_EPOCH=0`, and `PYTHONHASHSEED=0`. The whole code root is copied to
`/work`. Files that sit directly under a code root are shared and are read as `../<name>`; a code root has no
sub-folders. Every run executes twice, the second time with half the CPU quota, and the two outputs must match
byte for byte. A run that exceeds its `timeout` (default 60 s, at most 600 s) fails.

Three of these facts shape this plan more than the rest:

- **Half the CPU quota on the second run** means any output that depends on the number of processors differs
  between the executions and fails (rule AU1, below).
- **No capabilities and the default seccomp profile** mean the operating-system courses cannot use `mount`,
  `unshare`, or `ptrace` for real.
- **No network** means the networking courses cannot reach a real host, and the database courses reach a
  database only as a declared service.

## Harness Modes in This Plan

Every course has a harness mode, chosen from the families that plan 05 allows, and the choice is decision D3. The
mode is part of the brief, and a maker may not change it. A course stays in **real mode** wherever the code can
run; a unit is a **model** only where the lesson teaches a mechanism the sandbox cannot host (and then the
lesson says so, rule TC1 of plan 11); a unit is **static** only for Windows code.

| Harness mode                                   | Courses | Which                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real mode                                      | 15      | `advanced-algorithms`, `computer-science-foundations`, `data-structures-and-algorithms-essentials`, `functional-programming`, `object-oriented-design-and-patterns`, `object-oriented-programming-essentials`, `programming-paradigms`, `modern-system-programming`, `system-programming`, `build-your-own-orm-and-query-builder`, `search-and-information-retrieval`, `sql-essentials`, `capstone-solid-core`, `domain-driven-design`, `software-architecture` |
| Real mode with the simulation convention       | 9       | `actor-model-concurrency`, `concurrency-and-parallelism`, `csp-style-concurrency`, `build-your-own-database`, `data-engineering`, `database-internals-and-storage-engines`, `build-your-own-raft`, `distributed-systems`, `event-driven-architecture`                                                                                                                                                                                                           |
| Real mode with a PostgreSQL service            | 2       | `advanced-sql-and-query-performance`, `data-access-orms-and-query-builders`                                                                                                                                                                                                                                                                                                                                                                                     |
| Real mode with a Neo4j service                 | 1       | `graph-databases` (with the `neo4j-gds` and `gremlin` images)                                                                                                                                                                                                                                                                                                                                                                                                   |
| Real mode with services and models             | 1       | `nosql-databases`                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Real mode on loopback with fixtures and models | 2       | `networking-essentials`, `advanced-networking`                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Real mode with deterministic models            | 2       | `computer-architecture`, `system-design`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Real mode in a Linux container                 | 1       | `linux-os`                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Static mode, reason `windows`                  | 1       | `windows-os`                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

The nine rows add up to 34. `software-architecture` is listed under plain real mode because only about six of its 52
units use the simulation convention; in all, 15 courses use the convention for
some or all of their units (the table under "Simulation Convention" lists them). The per-course assignment, with
toolchain ids and services:

| Course                                      | Teaching mode                               | Harness mode                                                                 | Toolchain ids                | Services                                                          |
| ------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------- |
| `actor-model-concurrency`                   | By Example                                  | Real mode with the simulation convention for interleaving                    | `elixir`                     | none                                                              |
| `advanced-algorithms`                       | By Example                                  | Real mode                                                                    | `python`                     | none                                                              |
| `computer-science-foundations`              | Annotated Concept                           | Real mode                                                                    | `python`                     | none                                                              |
| `concurrency-and-parallelism`               | By Example                                  | Real mode with the simulation convention                                     | `python`                     | none                                                              |
| `csp-style-concurrency`                     | By Example                                  | Real mode with `testing/synctest` virtual time and the simulation convention | `go`                         | none                                                              |
| `data-structures-and-algorithms-essentials` | By Example                                  | Real mode                                                                    | `python`                     | none                                                              |
| `functional-programming`                    | By Example                                  | Real mode                                                                    | `python`                     | none                                                              |
| `object-oriented-design-and-patterns`       | By Example                                  | Real mode                                                                    | `python`                     | none                                                              |
| `object-oriented-programming-essentials`    | By Example                                  | Real mode                                                                    | `python`                     | none                                                              |
| `programming-paradigms`                     | By Example                                  | Real mode                                                                    | `python`                     | none                                                              |
| `advanced-networking`                       | Annotated Concept                           | Real mode on loopback with fixtures and models                               | `python`, `shell`            | none                                                              |
| `computer-architecture`                     | By Example                                  | Real mode with deterministic models                                          | `gcc`, `python`              | none                                                              |
| `linux-os`                                  | By Example                                  | Real mode in a Linux container                                               | `gcc`, `shell`               | none                                                              |
| `modern-system-programming`                 | By Example                                  | Real mode                                                                    | `rust`                       | none                                                              |
| `networking-essentials`                     | By Example                                  | Real mode on loopback with fixtures and models                               | `python`, `shell`            | none                                                              |
| `system-programming`                        | By Example                                  | Real mode                                                                    | `gcc`, `shell`               | none                                                              |
| `windows-os`                                | By Example                                  | Static mode, reason `windows`                                                | `windows-static`             | none                                                              |
| `advanced-sql-and-query-performance`        | By Example                                  | Real mode with a PostgreSQL service                                          | `psql`, `python`             | `postgres`                                                        |
| `build-your-own-database`                   | By Example                                  | Real mode with crash-injection simulation                                    | `python`                     | none                                                              |
| `build-your-own-orm-and-query-builder`      | By Example                                  | Real mode                                                                    | `python`                     | none                                                              |
| `data-access-orms-and-query-builders`       | By Example                                  | Real mode with a PostgreSQL service                                          | `python`                     | `postgres`                                                        |
| `data-engineering`                          | Annotated Concept                           | Real mode with the simulation convention for streaming                       | `python`                     | none                                                              |
| `database-internals-and-storage-engines`    | By Example                                  | Real mode with the simulation convention                                     | `python`                     | none                                                              |
| `graph-databases`                           | By Example                                  | Real mode with a Neo4j service                                               | `python`, `shell`, `gremlin` | `neo4j`, `neo4j-gds`                                              |
| `nosql-databases`                           | By Example                                  | Real mode with services and models (decision D4)                             | `python`, `shell`            | `valkey`, `mongodb`, `cassandra`, `dynamodb-local`, `timescaledb` |
| `search-and-information-retrieval`          | By Example                                  | Real mode                                                                    | `python`                     | none                                                              |
| `sql-essentials`                            | By Example                                  | Real mode                                                                    | `shell`, `python`            | none                                                              |
| `build-your-own-raft`                       | By Example                                  | Real mode with the simulation convention (all units)                         | `go`                         | none                                                              |
| `capstone-solid-core`                       | Capstone (Annotated Concept, standard mode) | Real mode                                                                    | `python`, `shell`            | none                                                              |
| `distributed-systems`                       | By Example                                  | Real mode with the simulation convention (all units)                         | `python`                     | none                                                              |
| `domain-driven-design`                      | By Example                                  | Real mode                                                                    | `python`                     | none                                                              |
| `event-driven-architecture`                 | By Example                                  | Real mode with the simulation convention                                     | `python`                     | none                                                              |
| `software-architecture`                     | Annotated Concept                           | Real mode                                                                    | `python`                     | none                                                              |
| `system-design`                             | Annotated Concept                           | Real mode with deterministic load models                                     | `python`                     | none                                                              |

## Simulation Convention

Plan 05's convention applies to any example whose behaviour depends on time, message delivery, failure, or
interleaving. In this plan 15 courses use it: concurrency, CSP, actors, Raft, distributed systems,
event-driven architecture, database internals, build-your-own-database, networking essentials, advanced
networking, computer architecture, NoSQL replication, data-engineering streams, software-architecture
partitions, and system-design load models. The nine obligations are applied as follows.

| #   | Obligation (plan 05)        | How the courses of this plan apply it                                                                                                                                                                                        |
| --- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Single-threaded event loop  | One loop per unit, written in the unit's own language; nodes are objects in the loop, not threads. Real-thread examples of the concurrency course are separate units and are not simulations                                 |
| S2  | Virtual clock               | An integer advanced by the event queue; sleeping schedules an event. Go timer units may use a `testing/synctest` bubble in a test unit (see Go, below)                                                                       |
| S3  | One seeded generator        | A SplitMix64 written in a shared kit file; no library generator, so the sequence never depends on a version                                                                                                                  |
| S4  | Pure state machines         | Raft, Paxos, two-phase commit, brokers, caches, and TCP endpoints are `step(state, message) -> (state, messages)`                                                                                                            |
| S5  | Invariants after every step | The invariants in each brief (safety properties, conservation laws, delivery guarantees), checked by the loop after each delivered event                                                                                     |
| S6  | At least 32 seeds           | Seeds 1 to 64 in every unit that injects faults; the Raft and database capstones use 64 seeds of 5 nodes with crash and partition schedules                                                                                  |
| S7  | Output contract             | `failing seed: <n> (<invariant>)` per failing seed, then exactly one last line `seeds: <passed> passed, <failed> failed (of <total>)`; exit 0 when no seed fails                                                             |
| S8  | Replay                      | `AYOKODING_SEED=<n>` runs one seed and prints a step trace; the lesson shows the command                                                                                                                                     |
| S9  | Bug demonstrations          | A unit may show a broken protocol (split brain, stale read below quorum, a lost update, 2PC blocking); its `run.yaml` expects exit 1 and an expected file that lists the failing seeds, and its `invariant` sentence says so |

**The shared kit.** Each simulation course keeps one kit file directly under `learning/code/` (for example
`sim_kit.py` for Python, `kit.go` for Go, `kit.exs` for Elixir) holding the SplitMix64 generator, the virtual
clock, and the event queue. Units read it as `../sim_kit.py`. The way a unit loads a shared file depends on the
language (`PYTHONPATH=..` in `env` for Python, `go run main.go ../kit.go`, `elixir -r ../kit.exs main.exs`);
each loading form is proved in the Phase 1 spike for its toolchain. The kit is teaching code that belongs to the
course (decision 37), never to `ayokoding-cli`, and a lesson that uses it shows the kit's file once and then
refers to it.

**Invariants and seeds per course** (abridged; the full lists are in the briefs):

| Course                                   | Units that use the convention                                                                                                                                                                                                                                                                                                    | Invariants (abridged)                                                                                                                                                                                                                                                                                                                                                                                             | Seeds                                                                                                                                                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actor-model-concurrency`                | Mailbox ordering, scheduling fairness, supervisor restart intensity, link and monitor delivery (about 12 of 78) run a pure Elixir scheduler model with a seeded SplitMix64 choice of the next process and a virtual clock. The other units are linear message exchanges on the real BEAM.                                        | Messages from one sender to one receiver arrive in send order.; No message is duplicated, and a lost message is recorded as dropped.; A supervisor that sees more than max_restarts failures within max_seconds terminates and escalates.; A link delivers the exit signal to each linked process exactly once; a monitor delivers one DOWN message.                                                              | 1 to 64.                                                                                                                                                                                                                                     |
| `concurrency-and-parallelism`            | The race, deadlock, starvation, bounded-buffer, reader-writer, semaphore, and cancellation examples (about 14 of 87) run on a cooperative scheduler model inside the unit, with a virtual clock and a seeded SplitMix64 choice of the next runnable task.                                                                        | Mutual exclusion: at most one task is inside a critical section.; Lock-guarded counters equal the number of increments; the unguarded version loses updates on at least one seed (a demonstrated bug, expected exit 1 for that named run).; A deadlock is reported if and only if the wait-for graph has a cycle.; A bounded buffer never exceeds its capacity and never underflows; every produced item is cons… | 1 to 64.                                                                                                                                                                                                                                     |
| `csp-style-concurrency`                  | Timer, timeout, ticker, backoff, and rate-limit examples (about 12 of 78) run in a `testing/synctest` bubble with a virtual clock; fairness and fan-in order examples (about 8) run a seeded scheduler model.                                                                                                                    | Every value sent on a channel is received exactly once and none after close.; A bounded worker pool never runs more than N workers at once.; After cancellation every goroutine the example started has returned (no leak at the end of the bubble).; A closed channel is closed exactly once.                                                                                                                    | 1 to 64 for the scheduler-model units.                                                                                                                                                                                                       |
| `advanced-networking`                    | TCP flow control, congestion control, QUIC loss recovery, and the WireGuard handshake state (about 10 of 62) run on a virtual network model.                                                                                                                                                                                     | A TCP receiver's advertised window never exceeds its free buffer; the sender never has more than the window in flight.; Under seeded loss the delivered byte stream equals the sent stream.; A congestion window follows the stated increase and decrease rule at every step.                                                                                                                                     | 1 to 64.                                                                                                                                                                                                                                     |
| `computer-architecture`                  | Cache-miss sweeps, branch prediction, pipeline hazards, TLB behaviour, and false sharing (about 30 of 80) run on a software model of the hardware effect (a set-associative cache simulator, a two-bit predictor, a pipeline hazard counter) fed by seeded or fixed traces.                                                      | hits + misses equals accesses for every trace.; For an LRU cache of capacity C, a repeated sweep over at most C blocks has zero misses after the first pass (stack property).; Doubling associativity at equal capacity never raises the miss count of a fixed trace under LRU.; A saturating two-bit predictor mispredicts at most twice per loop exit pattern.; The same seed gives the same trace and the sam… | 1 to 64 for generated traces.                                                                                                                                                                                                                |
| `networking-essentials`                  | Packet loss, retransmission, window growth, and DNS cache expiry (about 12 of 82) run on a virtual network model with a virtual clock and seeded loss.                                                                                                                                                                           | The byte stream a receiver delivers equals the byte stream the sender sent, in order, under any seeded loss, duplication, or reordering of segments.; Sequence numbers never decrease for new data; the congestion window is never below one segment.; A DNS answer is served from cache until its TTL on the virtual clock elapses and never afterwards.                                                         | 1 to 64.                                                                                                                                                                                                                                     |
| `build-your-own-database`                | Every WAL, recovery, and B-tree unit (about 40 of 78) runs the engine on an in-memory page file and a log file under `/tmp`, with a crash injected after each log record (exhaustively for short logs, seeded for long ones).                                                                                                    | Prefix consistency: after recovery from a crash at any log position, the database equals the state after some prefix of the committed transactions in commit order.; Durability: every transaction whose commit record is durable survives; no uncommitted effect survives.; Recovery is idempotent.; B-tree: keys sorted, equal leaf depth, minimum fill, and the tree's key set equals a reference dictionary … | 1 to 64 for workloads.                                                                                                                                                                                                                       |
| `data-engineering`                       | Late data, watermarks, and replay examples (about 8 of 52) run a stream model over a virtual event-time clock with seeded arrival order.                                                                                                                                                                                         | Rerunning an idempotent step on the same input leaves the target identical.; A watermark never moves backwards; a record is either processed once or counted in the late-data output once.; After replay from the log, the derived state equals the state built live.                                                                                                                                             | 1 to 64.                                                                                                                                                                                                                                     |
| `database-internals-and-storage-engines` | Crash and recovery, group commit, lock schedules, and anomaly examples (about 20 of 80) run a storage model with a crash injected at a chosen or seeded step, files in `/tmp`, and a virtual clock.                                                                                                                              | Durability: every transaction acknowledged before the crash is present after recovery, for every injected crash point.; Atomicity: no effect of an unacknowledged transaction is present after recovery.; Recovery is idempotent: running it twice gives the same state as running it once.; B-tree: keys stay sorted, all leaves are at one depth, and no node is below minimum fill after seeded insert and de… | 1 to 64 for workloads; crash points are enumerated exhaustively for the short logs.                                                                                                                                                          |
| `nosql-databases`                        | LSM write path, leaderless and leader-follower replication, quorum math, vector clocks, CRDTs, and failover (about 18 of 91) run in-process models with a virtual clock and seeded faults.                                                                                                                                       | A read of an LSM store returns the newest write for every key, before and after compaction; tombstones hide older values until compacted away.; With R + W > N a quorum read observes the latest acknowledged quorum write.; CRDT merges are commutative, associative, and idempotent; replicas that exchange all updates converge to equal state.; Last-writer-wins resolves a conflict to the same winner on e… | 1 to 64.                                                                                                                                                                                                                                     |
| `build-your-own-raft`                    | Every election, replication, and failure unit runs the Raft core (`Step(message) -> messages`, no goroutines, no sockets) inside a cluster simulator with a virtual clock and seeded faults (drop, delay, duplicate, partition, crash and restart). The early units (types, terms, timers) are plain functions.                  | Election safety: at most one leader is elected in a given term.; Leader append-only: a leader never overwrites or deletes entries in its own log.; Log matching: if two logs hold an entry with the same index and term, the logs are identical up to that index.; Leader completeness: an entry committed in a term is present in the logs of leaders of all later terms.; State-machine safety: no two nodes a… | 1 to 64 per unit that injects faults; the capstone runs 64 seeds of 5 nodes with crash and partition schedules. A bug demonstration (committing an old-term entry by counting replicas, the figure 8 case) expects exit 1 on its named seed. |
| `distributed-systems`                    | About 70 of the 85 units run a cluster model: a single-threaded event loop, a virtual clock, one seeded SplitMix64 generator for delay, loss, duplication, reordering, and crash choices, pure node state machines, and invariants checked after every step. The remaining units are pure functions (clocks, quorum arithmetic). | Lamport: if a happened before b then L(a) < L(b); vector clocks order two events as concurrent if and only if neither vector dominates.; Quorums: with R + W > N every read quorum intersects every write quorum.; Convergence: replicas that deliver all updates reach equal state (CRDT merge laws).; Agreement: no two nodes decide different values (Paxos, Raft, two-phase commit's atomicity).; Election s… | 1 to 64 (the convention's floor is 32). Demonstrated bugs (split brain, stale read below quorum, FLP non-termination, 2PC blocking) name a failing seed and expect exit 1 on that run only.                                                  |
| `event-driven-architecture`              | About 50 of the 80 units (delivery semantics, partitions and consumer groups, outbox, saga, retry and dead-letter, replay) run a broker model with a virtual clock and seeded delivery faults (drop, duplicate, reorder, consumer crash before and after acknowledgement).                                                       | At-least-once delivery loses no event; at-most-once duplicates none; an idempotent consumer's final state equals the exactly-once result.; Within a partition key, events are consumed in publish order; each partition has one active consumer in a group; offsets never move backwards.; Outbox: every committed event is published at least once and no event is published without its commit.; Saga: after a… | 1 to 64.                                                                                                                                                                                                                                     |
| `software-architecture`                  | The partition-behaviour and consistency examples (about 6 of 52) run a small replica model.                                                                                                                                                                                                                                      | A write acknowledged by the majority is visible to every later majority read (when the model claims strong consistency).; During a partition the minority side either refuses writes (CP) or accepts writes that the merge later reports as conflicts (AP); never both silently.; Replaying the same seed gives the same history.                                                                                 | 1 to 64 (the convention's floor is 32).                                                                                                                                                                                                      |
| `system-design`                          | Load-balancing policies, cache hit ratios, token buckets, consistent hashing, and queue back-pressure (about 12 of 53) run models driven by a seeded load generator and a virtual clock.                                                                                                                                         | A token bucket never admits more than its burst plus rate times elapsed virtual time.; Adding a node to a consistent-hash ring moves at most about K/N keys (within the stated bound) and never moves keys between two old nodes.; A queue is stable (length bounded) when arrival rate is below service rate and grows without bound otherwise, over the run.; A cache's hit ratio is between 0 and 1 and equal… | 1 to 64.                                                                                                                                                                                                                                     |

**What the simulation proves, and what it does not.** A simulation proves that the model keeps its invariants
under the seeded faults it tries, for the seeds it runs. It does not prove that a real system does. A lesson that
uses a model says so in one plain sentence beside the fence, and does not call the model the real system (rule
TC1, which plan 11 created and this plan applies). A counter-example is the worked bug: a unit may break the
protocol on purpose so that a named seed fails, and the lesson shows `AYOKODING_SEED=<n>` replaying it.

**Real-thread units stay deterministic by construction.** The concurrency course teaches threads, locks, and
`asyncio`. Its real-thread examples never depend on scheduling order: they synchronise with `Event`, `Barrier`,
and queues, join their threads, and sort their results before printing. Their ordering claims are shown by
simulation units (a cooperative scheduler model), not by hoping the OS schedules the same way twice. A real-thread
unit that cannot be made order-independent is rewritten as a model.

**Language notes.**

| Language | Approach in this plan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python   | A hand-written loop and generator in the kit. No third-party simulation library. `PYTHONHASHSEED=0` is set by the harness, but units sort sets and dictionaries anyway, because the lesson teaches the habit                                                                                                                                                                                                                                                                                                                                          |
| Go       | A hand-written loop for network and fault models. Virtual time in tests uses `testing/synctest` (generally available since Go 1.25), which needs a `*testing.T`, so such units are `kind: test` runs with `stdout: ignore` and an invariant sentence, beside a printing `main` that uses the kit's virtual clock. `GOMAXPROCS`, `GOCACHE=/tmp/gocache`, and `GOFLAGS=-buildvcs=false` are set in `env`. Since Go 1.25 the default `GOMAXPROCS` follows the container CPU quota, so it must be pinned or the half-quota second run would differ (SP10) |
| Elixir   | A pure scheduler model with a seeded choice of the next process for interleaving units; linear message exchanges run on the real BEAM and synchronise by messages. `ERL_FLAGS` pins the scheduler count (SP6). Mix projects use the standard library and OTP only, so nothing is fetched                                                                                                                                                                                                                                                              |
| C        | Models of hardware effects (caches, predictors, pipelines) are C or Python programs fed by seeded or fixed traces; no unit reads a cycle counter or a clock                                                                                                                                                                                                                                                                                                                                                                                           |
| Rust     | Thread examples join and sort; `BTreeMap` replaces `HashMap` iteration; `rustc --color never` pins diagnostics to the catalog's Rust 1.99.0                                                                                                                                                                                                                                                                                                                                                                                                           |

## Service-Backed Units

Plan 05's service contract: a unit declares `services` in its `run.yaml`; the harness creates an internal Docker
network, starts each service detached with a network alias equal to its id and a tmpfs data folder, polls the
service's `ready` argv every 500 ms until it succeeds or `readyTimeout` elapses (an environment error,
`ayokoding.env.service-not-ready`, exit 124), runs the unit on the same network, and removes everything on every
path. A service therefore starts fresh for every unit run, and the double run starts it twice. That is also the
main CI cost of these courses.

Four courses are service-backed, and together they are 41 percent of the plan's CI load:

| Course                                | Services                                                          | Shard-minutes per full run | Share of the 34-course load (percent) |
| ------------------------------------- | ----------------------------------------------------------------- | -------------------------- | ------------------------------------- |
| `graph-databases`                     | `neo4j`, `neo4j-gds`                                              | 85.8                       | 18                                    |
| `nosql-databases`                     | `valkey`, `mongodb`, `cassandra`, `dynamodb-local`, `timescaledb` | 44.0                       | 9                                     |
| `advanced-sql-and-query-performance`  | `postgres`                                                        | 32.9                       | 7                                     |
| `data-access-orms-and-query-builders` | `postgres`                                                        | 29.1                       | 6                                     |
| All service-backed courses            |                                                                   | 191.8                      | 41                                    |

### PostgreSQL (`advanced-sql-and-query-performance`, `data-access-orms-and-query-builders`)

- **Image.** The `postgres` catalog entry (PostgreSQL 18.6, `postgres:18` pinned by digest). The SQL course uses
  plan 06's `psql` toolchain (`psql -X -v ON_ERROR_STOP=1 -f main.sql`), which reuses the service image's client;
  the ORM course uses Python with the course lock.
- **Authentication.** Trust authentication on the internal network, host alias `postgres`; a unit connects as a
  fixed user with no password (`PG_HOST=postgres` in `env`). No secret exists.
- **Isolation.** Each unit creates its own schema (`CREATE SCHEMA ex_NN`) and drops it at the end. Because the
  service is fresh per run, the schema is for the reader, who runs the SQL on a long-lived database.
- **Fixed data.** Rows come from `generate_series` and integer formulas, never from `random()`; times are literals;
  keys are explicit integers; sequence values are never printed.
- **Deterministic plans.** `ANALYZE` runs before a query whose plan is printed, `EXPLAIN (COSTS OFF)` is the default
  form, analyzed plans use `TIMING OFF, SUMMARY OFF` and remove buffer counts that depend on cache state, and
  every row-returning query has an `ORDER BY` (with `COLLATE "C"` on text). A recorded plan is valid for the pinned
  image digest only, and the lesson says so.
- **Two-session examples** (locks, deadlocks, isolation levels) use `dblink` or a scripted two-session sequence, with
  `NOWAIT`, `SKIP LOCKED`, and a short `deadlock_timeout` instead of waiting. `\timing` prints its on/off state,
  never a duration.
- **`pg_stat_statements`** (example 82 of the SQL course) needs a server start option (`shared_preload_libraries`),
  decision D5. SP5 finds the mechanism: (a) a `services` `args` field, if the merged run contract has one, passes
  the start option to the same image; (b) otherwise example 82 is a labelled illustration within the course's budget
  of 3 fences, and the lesson says why it is not run. A separate `postgres-pgss` catalog entry for one unit fails the
  value test of the toolchain budget rule and is not added. Neither form is a toolchain addition.

### Neo4j and the Graph Course (`graph-databases`)

- **Image.** The `neo4j` catalog entry (2026.09.0 Community, Cypher 25, pinned by digest), authentication disabled
  (`NEO4J_AUTH=none`), Bolt on the alias `neo4j`; `cypher-shell` from the same image runs `.cypher` units.
- **Graph Data Science units** need the plugin. The plan adds a derived image `neo4j-gds` (decision D6): the same
  Neo4j digest plus the GDS plugin jar, downloaded with a SHA-256 check, with procedures allowed for `gds.*`. GDS
  Community Edition limits concurrency, and the units set `concurrency: 1` and an explicit `randomSeed` so the
  double run matches. SP3 proves it.
- **Gremlin units** (7 Groovy files) need a JVM and Apache TinkerPop's console. The plan adds a derived `gremlin`
  image on the same Temurin base as the `java` and `kotlin` entries, with the console zip checked by SHA-256, and
  runs `gremlin.sh` against an in-memory TinkerGraph. No server is needed. The image is independent of plan 09's
  `java` jar recipe ([004](./004-toolchain-additions-and-ci-budget.md#what-plan-09-changes-and-probe-p9)). SP4
  proves it.
- **Fixed data.** Each unit builds its graph from `CREATE` statements with explicit ids in properties and prints
  properties ordered by `ORDER BY`; it never prints `elementId()` or an internal id. The 5 relational-contrast
  SQL units run through Python's `sqlite3` module and need no extra image. RDF and SPARQL units use a
  hash-locked `rdflib`.

### Document, Key-Value, Wide-Column, Time-Series, and Columnar Stores (`nosql-databases`)

The course teaches six store families. Decision D4 gives five of them a service with an **admission rule** and a
model as the fallback; the sixth, columnar, runs on DuckDB in process.

| Store family          | Service id       | Image (pinned by digest after SP2)       | Client                         | Code units that name it today |
| --------------------- | ---------------- | ---------------------------------------- | ------------------------------ | ----------------------------- |
| Key-value             | `valkey`         | The Valkey image (BSD, Redis-compatible) | `redis` (Python), `valkey-cli` | 12 (19 name Redis)            |
| Document              | `mongodb`        | The MongoDB image                        | `pymongo`, `mongosh`           | 31                            |
| Wide-column           | `cassandra`      | The Apache Cassandra image               | `cassandra-driver`, `cqlsh`    | 22                            |
| Key-value, serverless | `dynamodb-local` | The DynamoDB Local image                 | `boto3` with a local endpoint  | 12                            |
| Time-series           | `timescaledb`    | The TimescaleDB image (PostgreSQL)       | `psycopg`                      | 6                             |
| Columnar              | none             | DuckDB in process, from the course lock  | `duckdb`, `pyarrow`            | 4 import DuckDB               |

DuckDB runs in process from the course lock and is not a service. The course also teaches mechanisms that no
service shows well (LSM write paths, quorums, vector clocks, CRDTs, failover); about 18 of its 91 units are
in-process models with a virtual clock and seeded faults, and they would be models even if every store were
available.

**Admission rule (rule AU2).** A service is added to the catalog only if all five hold; the Phase 1 spike SP2 tests
each store against them:

1. **Pinned.** An official or vendor image, referenced by digest, with the digest recorded.
2. **No secret.** It starts with authentication off or trust, with no key, token, or password.
3. **Ready in time.** The `ready` argv succeeds inside a `readyTimeout` of at most 60 seconds on the measured
   CI runner class, within the memory limit the `resources` field allows.
4. **Deterministic.** The course's fixed data gives byte-identical output on the double run, with the unit's own
   key prefix, database, keyspace, or table.
5. **Fits the CI ladder.** Its per-unit start cost keeps the longest shard at or below 75 percent of the timeout
   that applies ([004](./004-toolchain-additions-and-ci-budget.md#the-ci-budget)).

A store that fails a test is not added. Its units become in-process models of the mechanism the lesson teaches,
labelled as models in one plain sentence (TC1), and the real command is shown as an illustration only if the lesson
says it is not run here. The budget for such illustrations in this course is 6 fences. Cassandra is the likeliest
to fail (start time and memory). A failed store changes the lesson text for its units and nothing else; it is not
BLOCKED, and the ledger records the fallback.

**Data and isolation rules for every store.** Each unit uses its own key prefix, database, keyspace, or table.
Fixed documents and rows. No time-to-live race: expiry is shown with a short fixed TTL only in a lesson about
expiry, and then through a model clock, not through sleeping. Results are sorted client-side before printing.
Server-generated ids, timestamps, and node names never reach an expected file.

## Networking Courses (D7)

`networking-essentials` and `advanced-networking` teach DNS, TCP, HTTP, TLS, proxies, and overlays, and today
the baseline scan finds 73 network uses in `networking-essentials` and 26 in `advanced-networking`. Of the units,
38 and 26 are `command.sh` files that record a shell command run against a real host (`curl`, `dig`, `traceroute`,
`tcpdump`, `wg`), and many of the Python files open a socket or an HTTP client to a real name. Under `--network none` none of that can run.
Decision D7 gives every such unit one of three forms and keeps the unit's concept.

1. **Loopback pair.** A server and a client in one container on `127.0.0.1`. The port is chosen by the test
   (`bind` to port 0) and never printed. TLS 1.3 examples use a throwaway key made inside the unit; the output
   carries protocol facts only (version, cipher suite name, ALPN, the order of handshake messages) and never key
   bytes, serial numbers, or dates. SP7 verifies that loopback works under `--network none`, that the image has
   what TLS needs, and whether the key is made at run time or kept as a documented test-only key pair.
2. **Fixture.** A captured trace, a DNS response in wire format, or a handshake transcript stored as a fixture
   file next to the unit and parsed by a program. The lesson says the capture is a fixture and where it came from;
   the program's output is the compared result.
3. **Model.** A virtual network with a virtual clock and seeded loss, duplication, and reordering, for TCP
   retransmission, window growth, congestion control, QUIC loss recovery, DNS cache expiry, and the WireGuard
   handshake state. These follow the simulation convention.

**Rule AU3, offline network examples.** An example never talks to a real host. Every address and name in an
expected file is a documentation value: `example.com` and its subdomains, `192.0.2.0/24`, `198.51.100.0/24`,
`203.0.113.0/24` (RFC 5737), and `2001:db8::/32` (RFC 3849), or `127.0.0.1` and `::1` for the loopback pair. A port
appears in output only when the unit chose it as a constant on both ends. The rule is checked by a deterministic
search for IPv4 addresses and host names in the course's expected files before the Content Quality Gate, with each
hit read, and it is judged by the gate. It is the same discipline as plan 09's SEC1 for security courses, which does
not bind these two courses.

The recorded `output.txt` files that the two courses hold today came from real hosts. They are never used as
expected files unless the new unit reproduces them. The lesson that shows a trace labels it with its origin.

## Hardware Course (D8)

`computer-architecture` teaches caches, branch prediction, pipelines, and memory by timing C programs: the baseline
scan finds 48 clock reads and 13 unseeded random uses in its 80 examples, and the lessons quote the results. Timing is exactly what the harness
forbids and exactly what the sandbox cannot reproduce. Decision D8 turns each timing example into one of two things:

- **A model with a count.** A set-associative cache simulator, a two-bit predictor, a pipeline hazard counter, and a
  TLB model, fed by a fixed or seeded trace, print hits, misses, mispredictions, and stall cycles. The invariants
  (hits plus misses equal accesses; an LRU cache of capacity C has no misses on a repeated sweep over at most C
  blocks; doubling associativity at equal capacity never raises the misses of a fixed trace) are checked after every
  access and make the model a simulation unit.
- **An explained measurement.** Where the lesson is about a real-hardware effect, the text explains it with the model
  unit proving the logic and says plainly that the figure is typical, not measured here. A real `rdtsc` or
  `clock_gettime` figure never reaches an expected file.

A unit that remains real prints sizes, offsets, alignments, and bit patterns, which are deterministic. No unit prints
the host's cache size, core count, or CPU model, and no unit reads `sysconf(_SC_NPROCESSORS_ONLN)`.

**Rule AU1, output independent of the CPU count.** Because the second execution runs with half the CPU quota, no
value derived from the processor count, the cache hierarchy, or the scheduler may reach output or control flow.
That covers `os.cpu_count()`, `nproc`, `runtime.NumCPU()`, `GOMAXPROCS` defaults, `std::thread::available_parallelism`,
the Erlang scheduler count, DuckDB's thread count, `sysconf`, and pool sizes taken from any of them. Pass explicit
values (a fixed pool size, `GOMAXPROCS=2` in `env`, `ERL_FLAGS` with fixed schedulers, `PRAGMA threads=1`). The
double run catches most violations by construction; the Content Quality Gate reads for the rest. SP6 proves the
pinned values for Go, Elixir, Rust, DuckDB, and Python pools.

## Operating-System Courses

`linux-os` and `system-programming` are C courses, `modern-system-programming` is Rust, and `windows-os` is
Windows. Their units run without privilege.

- **Compile and run.** `gcc -std=c23 -Wall -Wextra -Werror -o /tmp/main main.c`, then the binary, as two commands
  of one run (or a `shell` unit); gcc is the catalog's 16.2. A unit is one directory with one or two source files.
- **No privilege.** The sandbox drops all capabilities and applies the default seccomp profile. Calls that need
  privilege (`mount`, `unshare`, `ptrace` of another process, raw sockets) are demonstrated as the refusal: the
  program prints the `errno` name (`EPERM`) and the lesson states the sandbox limit. The code is still real and still
  runs; it shows what an unprivileged process sees.
- **No process identifiers.** Programs print relationships ("the child's parent id equals the parent's id"), sorted
  names, and `errno` names. Process ids, inode numbers, times, and the host kernel version never reach an expected
  file. `/proc/self` is read for structure, not for numbers. Signals are raised with `raise` or `kill` to self and
  handled before the next line, with no sleeps.
- **Sanitizers.** `system-programming` builds with `-fsanitize=address,undefined` where SP8 shows the catalog image
  supports it, with `ASAN_OPTIONS=detect_leaks=0` because leak detection needs `ptrace`. A deliberate-bug unit
  expects the sanitizer's exit status, ignores stderr with an invariant sentence (the report holds process ids and
  addresses), and the lesson shows the report as a labelled recorded sample.
- **Rust.** `modern-system-programming` uses `rustc --edition 2024 --color never` for single files and a
  `Cargo.lock`-free build for the capstone, so no run downloads a crate (SP9). Compile-error examples are `kind: check`
  runs with a non-zero expected exit and the diagnostic in the expected stderr, recorded by the maker after reading it,
  and pinned to Rust 1.99.0.

## Windows (Static Mode)

The sources of `windows-os` cannot run in a Linux container. Plan 05's decision D12 extends static mode to Windows,
reason `windows`. The `windows-static` validator compiles Win32 C with `x86_64-w64-mingw32-gcc -fsyntax-only` against
the mingw-w64 headers and parses PowerShell with the PowerShell parser; `dotnet build
-p:EnableWindowsTargeting=true` covers any .NET project. The run proves that the code is well formed against the
Windows API declarations. It does not prove what the code prints on Windows, and no lesson presents a static run as
proof of runtime behaviour.

A lesson that shows an `**Output**` block says the block is a recorded sample from a named Windows build and date,
and the sample is kept in a file that the static run does not compare (SP11 finds the form the merged contract
allows: an `expected/` file the static run ignores, or a labelled illustration fence). The eight katas are static
`before` and `after` units: the `before` is a compile error or a parse error with the expected diagnostic, and the
`after` compiles. The illustration budget is 0 because every unit compiles or parses.

## Python Courses and Locks

Twenty-seven courses use the `python` toolchain, and 16 of them (counting the capstone) import third-party packages. Every such package is
hash-locked in the course (`requirements.in` and `requirements.lock` under the code root, generated with `UV-LOCK`,
plan 05's recipe); no run installs anything, and the environment image is built once per distinct lock. SP1 checks
that every package has a wheel for Python 3.14 on the architectures the CI runners and developer machines use, and
whether one lock covers both. Packages and the number of files that import them:

| Course                                      | Packages and the number of files that import them                                                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `advanced-algorithms`                       | `pytest` (3)                                                                                                                                    |
| `concurrency-and-parallelism`               | `pytest` (3), `reactivex` (2)                                                                                                                   |
| `data-structures-and-algorithms-essentials` | `pytest` (1)                                                                                                                                    |
| `functional-programming`                    | `hypothesis` (1)                                                                                                                                |
| `object-oriented-design-and-patterns`       | `pytest` (17)                                                                                                                                   |
| `object-oriented-programming-essentials`    | `pytest` (17)                                                                                                                                   |
| `programming-paradigms`                     | `pytest` (3)                                                                                                                                    |
| `advanced-sql-and-query-performance`        | `psycopg[binary]` (22), `psycopg-pool` (1)                                                                                                      |
| `build-your-own-orm-and-query-builder`      | `pytest` (3)                                                                                                                                    |
| `data-access-orms-and-query-builders`       | `sqlalchemy` (76), `psycopg[binary]` (15), `alembic` (10), `pypika` (10), `peewee` (2)                                                          |
| `data-engineering`                          | `duckdb` (28), `pandas` (1)                                                                                                                     |
| `database-internals-and-storage-engines`    | `pytest` (6)                                                                                                                                    |
| `graph-databases`                           | `neo4j` (14), `rdflib` (5)                                                                                                                      |
| `nosql-databases`                           | `pymongo` (28), `cassandra-driver` (15), `redis` (9), `boto3` (9), `psycopg[binary]` (6), `duckdb` (4), `pyarrow` (2)                           |
| `sql-essentials`                            | `pytest` (3)                                                                                                                                    |
| `capstone-solid-core`                       | `fastapi`, `pydantic`, `starlette`, `argon2-cffi`, `pytest`, `hypothesis`, `shellcheck-py`, `shfmt-py`, `actionlint-py` (SP13 confirms the set) |

`pytest` runs as a `kind: test` run with `stdout: ignore`, because the runner prints timings; the same unit has a
printing `main` where the lesson shows a result. A package that has no wheel is replaced by a standard-library
construct if the lesson allows it, and otherwise the unit is rewritten (the fallback is in the SP1 entry).

## Determinism Rules for These Courses

Plan 05's six rules (no clock reads that reach output or control flow, explicit seeds, no network except declared
services, no thread-order output, no hash-map order, no timing in compared streams) apply to every unit. The rules
below are the additions this plan needs, by family.

| Family              | Rule                                                                                                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Algorithms and OO   | Cost claims are operation counts the run reproduces, never measured times. Object identity and default `repr` addresses are never printed; use explicit `__repr__` text. Sets and dictionaries are sorted before printing   |
| Threads and asyncio | `Event`, `Barrier`, queues, joined results, sorted output; pool sizes are explicit; the free-threaded build example prints the GIL state of the catalog's default build and says so                                         |
| SQL on SQLite       | `ORDER BY` on every query; `datetime('now')` and `random()` never reach output; the SQLite version is printed once by a single unit and the lesson states that value                                                        |
| SQL on PostgreSQL   | As above under "PostgreSQL"                                                                                                                                                                                                 |
| Graph and NoSQL     | Ordered results; no internal ids, server timestamps, or node names; fixed TTLs through a model clock                                                                                                                        |
| Storage engines     | Files under `/tmp` with fixed names inside the unit; `fsync` is called, and the lesson says it proves write ordering in the model and not device durability; checksums use `zlib.crc32`; compressed bytes are never printed |
| Streams and brokers | Virtual event-time clock; seeded arrival order; backoff on the virtual clock, never `time.sleep`                                                                                                                            |
| Networking          | As under "Networking Courses"                                                                                                                                                                                               |
| Hardware            | As under "Hardware Course"                                                                                                                                                                                                  |
| Systems in C        | As under "Operating-System Courses"                                                                                                                                                                                         |
| Estimation          | Latency and throughput figures come from a stated table with a source and a date, labelled constructed or real, never from a measurement                                                                                    |

**Hidden-randomness traps.** A hash-map iteration order, an unseeded generator, a process id, a memory address, a
temporary path, and a CPU count are the six that slip through. The double run catches most of them; the checkers'
code review looks for the rest, and the harness's own claim is limited to what it enforces.

## Illustration Policy and Budgets

`<!-- harness: illustration -->` is for code that is not meant to run as shown: a real-hardware measurement command,
a vendor command-line tool the sandbox does not host, a `tcpdump` on a real interface, or a store whose service
failed the admission test. Each illustration is followed by a sentence saying why it is not run. A maker never marks
a runnable block as an illustration to pass `EX-SYNC` (plan 05's M11), and the gates judge the count (the coverage
report counts illustrations per course). The budgets in the briefs are: 0 fences for `windows-os`, 6 for
`nosql-databases`, and 3 for every other course.

## References

- Plan 05's `run.yaml` contract, runner catalog, service contract, determinism and CI designs (merged before this
  plan).
- Go 1.25 release notes for `testing/synctest` and the container-aware `GOMAXPROCS`: <https://go.dev/doc/go1.25>,
  cited in plan 05 and re-checked in SP10.
- RFC 5737 (IPv4 documentation blocks): <https://www.rfc-editor.org/rfc/rfc5737>. RFC 3849 (IPv6 documentation
  prefix): <https://www.rfc-editor.org/rfc/rfc3849>. Phase 7 re-reads both before AU3 is written into the reference module.
- FoundationDB simulation testing, TigerBeetle's VOPR, and the sled simulation guide, as listed in plan 05's prior
  art for the simulation convention.
