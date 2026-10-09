# Capstone · Concurrency and Systems (Capstone, Annotated-Concept)

**Course ID**: `capstone-concurrency-and-systems` · **Format**: Capstone (`format: capstone`); teaching
mode: Annotated-Concept, standard sub-mode.

**Scope note**: Integrates `csp-style-concurrency`, `containers-and-orchestration`, and
`site-reliability-engineering` into one small Go service, "Relay", that you build, package, and
operate against a reliability target. It adds no new concurrency or SRE theory. It excludes the actor
model (`capstone-concurrency-showdown`), distributed consensus (`distributed-systems`), and
leadership decisions about the service (`capstone-lead-at-altitude`).

**Short summary**: Build a job service that cannot be overloaded or stopped uncleanly, shrink its hot
path to a fixed-size binary queue, wrap it for a container, and prove with a deterministic simulation
that its page-the-engineer alert fires fast on a real outage and stays silent on a healthy day.

## Why this exists · the big idea

- **The problem before the solution**: engineers learn goroutines, containers, and SLOs as separate
  topics, then meet them together in production. A service without a bound on its queue, a clean
  shutdown path, and an alert tied to user pain fails in ways no single course prepared them for.
- **Keep-this-if-you-forget-everything**: every queue has a bound, every goroutine has an owner that
  can stop it, and an alert should fire on how fast the error budget is burning, not on a cause you
  guessed in advance.

## Learning objectives

- Build a bounded worker pool in Go with backpressure, `context` cancellation, and a graceful
  shutdown that drains in-flight work within a time budget.
- Replace a channel on a hot path with a fixed-slot binary ring buffer, and justify the change with
  allocation counts, not feelings.
- Prepare a service for a container: validated environment configuration, health and readiness
  checks, and a grace-period budget that matches the drain budget.
- Expose the four golden signals (latency, traffic, errors, saturation) and compute an availability
  SLI, an SLO, and an error budget.
- Explain and test multiwindow, multi-burn-rate alerting, and show by simulation that it pages quickly
  on an outage and never on a healthy baseline.

## Prerequisites

- **Prior courses (`prerequisites` after the rubric re-run)**: `just-enough-go`,
  `csp-style-concurrency`, `containers-and-orchestration`, `site-reliability-engineering`.
- **Edge changes against plan 02's graph**: add `just-enough-go` (rule L1: Go is the only code
  medium). The other three edges are kept because the written course uses them (pools and
  cancellation in themes A and B, container readiness in theme D, and SLOs and burn rates in theme
  E). No edge is removed.
- **Assumed knowledge**: reading and running a short Go program; what a container image is;
  what an SLO is at the level of a definition.
- **Not required**: Kubernetes, Prometheus, or any cloud account. No example needs a network.

## Mode and targets

- **Mode**: Annotated-Concept, standard sub-mode. **Reason**: the course integrates ideas the reader
  has already met. A worked example that shows one seam at a time (a drain budget, an allocation
  count, a burn-rate table) fits the mode better than a long by-example syntax tour, and the mode's
  floor of 45 forces the integration to be taught in small, checkable steps. By Example (75–85) would
  re-teach Go syntax; In the Field has no course-level layout.
- **Worked examples**: floor 45, band 45–60, in five themes of nine. All 45 carry runnable Go.
- **Words**: at least 23,000 across the course's markdown pages (derivation in
  [tech-docs/002](../../tech-docs/002-capstone-course-contract-and-modes.md#word-and-hour-targets)).
- **Diagrams**: at least one Mermaid diagram per theme (five or more).
- **Layout**: `overview.md`; `learning/overview.md`; `learning/theme-a-bounded-concurrency.md` to
  `learning/theme-e-golden-signals-and-slos.md`; `learning/capstone/overview.md`;
  `learning/capstone/code/`; `learning/code/ex-NN-<slug>/`; `drilling/overview.md`;
  `drilling/code/kata-NN-<slug>/{before,after}/`.
- **Metadata**: `category: infrastructure-and-operations`; `format: capstone`; `description` kept from
  plan 03 ("Build, package, and operate a concurrent service against a reliability target.");
  `estimatedHours` copied from the drift-test output (expected 5–8); no `status`.

## Project brief

**You are the engineer on call for Relay**, a small job-processing service. Producers submit jobs
(each has an ID and a payload). Workers process them. Your task is to make Relay safe to run:

1. It never accepts more work than it can hold, and tells producers when it is full.
2. It stops cleanly on request: no new jobs, in-flight jobs finish or are cancelled within a budget,
   and no goroutine is left behind.
3. Its hot path uses a fixed-size binary queue that allocates nothing per job.
4. It is ready to run in a container with a read-only root file system and a stated grace period.
5. It reports latency, traffic, errors, and saturation, and it has an availability SLO of 99.9% over
   30 days with a paging alert on burn rate.

Everything runs in-process. Time is virtual where it matters, so the same inputs always give the
same output.

## Milestones

| #   | Milestone                    | Theme | Checkpoint (capstone run)                   |
| --- | ---------------------------- | ----- | ------------------------------------------- |
| M1  | Bounded worker pool          | A     | `stage-1-pool`                              |
| M2  | Clean cancellation and drain | B     | `stage-2-shutdown`                          |
| M3  | Binary hot path              | C     | `stage-3-ring-queue`                        |
| M4  | Ready for a container        | D     | `stage-4-container-readiness`               |
| M5  | Operable: signals, SLO, page | E     | `stage-5-slo-burn` (simulation) and `tests` |

## Acceptance criteria

Each criterion names the run that proves it. A criterion without a green run does not count.

| ID    | Criterion                                                                                                                | Proof run                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| AC-1  | With capacity 8 and 3 workers, 100 submitted jobs produce 100 results in job-ID order, and the peak in-flight count is 3 | `stage-1-pool`                |
| AC-2  | When the intake is full, the chosen policy (reject) returns `ErrFull` and increments the rejected counter                | `stage-1-pool`                |
| AC-3  | A shutdown request stops intake, drains in-flight work within the drain budget, cancels the rest, and reports counts     | `stage-2-shutdown`            |
| AC-4  | After shutdown the goroutine count equals the count before start                                                         | `stage-2-shutdown`            |
| AC-5  | The ring queue handles 10,000 push-pop pairs with zero allocations per operation                                         | `stage-3-ring-queue`          |
| AC-6  | A frame larger than the limit is rejected before any copy                                                                | `stage-3-ring-queue`          |
| AC-7  | Configuration with a missing or out-of-range variable fails at start with a named error                                  | `stage-4-container-readiness` |
| AC-8  | The grace period is at least the drain budget plus a stated margin                                                       | `stage-4-container-readiness` |
| AC-9  | In a healthy 24-hour simulation across all seeds, no alert fires                                                         | `stage-5-slo-burn`            |
| AC-10 | In a simulated outage at 20% errors, the fast-burn page fires within 5 virtual minutes on every seed                     | `stage-5-slo-burn`            |
| AC-11 | `go test -race` passes for every package                                                                                 | `tests`                       |

## Rubric

Levels: 0 not yet, 1 partial, 2 meets, 3 strong. A pass needs every criterion at 2 or higher and all
eleven acceptance criteria green.

| Criterion                | 2 — meets                                                                    | 3 — strong                                                                      |
| ------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Bounded by design        | Every queue and pool has a stated bound and a stated policy when full        | Policies are chosen per producer type and justified in a short decision note    |
| Ownership and shutdown   | Each goroutine has an owner that can stop it; shutdown order is written down | A shutdown trace is saved and each phase has a time budget                      |
| Justified systems choice | The ring queue is justified by allocation counts                             | A table says when the plain channel is the better choice                        |
| Operability              | Four signals are exposed; SLI, SLO, and budget are computed correctly        | Alerts are symptom-based and the cause-based alternative is rejected in writing |
| Simulation honesty       | The simulation uses a fixed seed set and prints failing seeds                | A deliberately weaker single-window alert is shown to flap, with seeds          |
| Explanation              | The write-up (`operations.md`) matches what the runs show                    | A reader who has not seen the code could rerun the stages from it               |

**Evidence to keep**: the output of each stage run, the shutdown trace, the allocation table, the SLO
arithmetic, and the simulation summary line. Keep no secrets; none are needed.

**Extensions** (not graded, not run): replace the in-process producers with an HTTP front end; run the
container for real on your own machine; add a second alert for the slow-burn ticket.

## Concepts

- **co-01 · bounded-queue** — a queue with a fixed capacity and an explicit policy when it is full.
- **co-02 · backpressure** — slowing or refusing producers when consumers cannot keep up.
- **co-03 · goroutine-ownership** — every goroutine has a parent that can cancel it and wait for it.
- **co-04 · context-cancellation** — `context` carries cancellation and deadlines to every layer.
- **co-05 · graceful-shutdown** — stop intake, drain, time out, then force, in that order.
- **co-06 · ring-buffer** — a fixed array used as a circular queue with two indexes.
- **co-07 · allocation-budget** — the hot path allocates a known number of times per operation.
- **co-08 · container-readiness** — configuration, health, readiness, and termination match the
  container's limits.
- **co-09 · golden-signals** — latency, traffic, errors, and saturation.
- **co-10 · sli-slo-budget** — a good-over-total measure, a target, and the failures the target allows.
- **co-11 · burn-rate** — how many times faster than allowed the budget is being spent.
- **co-12 · multiwindow-alert** — a long window to confirm cost and a short window to confirm it is
  still happening.
- **co-13 · deterministic-simulation** — a virtual clock, a seeded generator, and invariants checked
  over a fixed seed set (obligations S1–S9 of the harness).

## Worked examples

All examples are Go and follow the harness rules: no wall clock in output, sorted output, explicit
seeds, results independent of goroutine order.

### Theme A — Bounded concurrency (`learning/theme-a-bounded-concurrency.md`)

- **ex-01 · unbounded-goroutines** — start one goroutine per job for 1,000 jobs — verify the peak
  count printed is 1,000, which is the problem. (co-01)
- **ex-02 · bounded-intake** — a buffered channel of capacity 8 — verify a ninth non-blocking send
  reports "full". (co-01, co-02)
- **ex-03 · fixed-worker-pool** — three workers drain the intake — verify peak concurrency is 3 using
  an atomic gauge. (co-01)
- **ex-04 · results-in-job-order** — collect results out of order and sort by job ID — verify the
  printed order is stable. (co-01)
- **ex-05 · block-reject-or-shed** — three full-queue policies — verify each policy's accepted and
  dropped counts. (co-02)
- **ex-06 · first-error-cancels** — one failing job cancels the rest through a shared context — verify
  later jobs are skipped and the error is reported once. (co-03, co-04)
- **ex-07 · semaphore-from-a-channel** — limit calls to a slow dependency — verify the limit holds.
  (co-02)
- **ex-08 · race-found** — an unsynchronised counter under `go test -race` — verify the run fails (a
  bug demonstration, exit 1). (co-03)
- **ex-09 · race-fixed** — the same counter with a mutex — verify `-race` passes. (co-03)

### Theme B — Cancellation and graceful shutdown (`learning/theme-b-cancellation-and-shutdown.md`)

- **ex-10 · cancel-propagation** — cancel a parent context — verify every child stops. (co-04)
- **ex-11 · deadline-per-job** — a per-job deadline using virtual time (`testing/synctest`) — verify
  the slow job times out at the stated virtual instant. (co-04)
- **ex-12 · drain-or-abort** — two shutdown policies — verify drain finishes all work and abort
  cancels it. (co-05)
- **ex-13 · four-phase-shutdown** — stop intake, drain, time out, force — verify the printed phase
  order and the virtual times. (co-05)
- **ex-14 · idempotent-close** — close twice — verify no panic and one result. (co-05)
- **ex-15 · goroutine-leak-check** — count goroutines before and after — verify equality after
  shutdown. (co-03)
- **ex-16 · shutdown-as-a-channel** — model a termination request as an injected channel (the real
  signal call is shown as an illustration) — verify the pool reacts. (co-05)
- **ex-17 · in-flight-timeout** — a job that ignores cancellation — verify the force phase reports it
  by name. (co-05)
- **ex-18 · shutdown-trace** — record every phase to a trace — verify the trace equals the expected
  file. (co-05)

### Theme C — A bounded binary data path (`learning/theme-c-binary-data-path.md`)

- **ex-19 · fixed-slot-ring** — a ring buffer of 8 slots — verify push, pop, and wrap-around. (co-06)
- **ex-20 · power-of-two-mask** — replace modulo by a mask — verify the indexes match modulo for
  every step. (co-06)
- **ex-21 · length-prefixed-frames** — encode a message as 4 length bytes plus payload — verify the
  bytes. (co-06)
- **ex-22 · decode-with-a-limit** — reject a declared length above the limit before reading — verify
  the error and that nothing was allocated for the payload. (co-06, co-07)
- **ex-23 · zero-allocation-hot-path** — `testing.AllocsPerRun` on push-pop — verify 0. (co-07)
- **ex-24 · struct-layout** — print `Sizeof`, `Alignof`, and `Offsetof` for a slot header — verify a
  reordered struct is smaller. (co-07)
- **ex-25 · preallocated-slot-pool** — reuse payload buffers — verify allocations per operation. (co-07)
- **ex-26 · queue-vs-channel** — compare allocation counts of the ring and a channel — verify the
  stated numbers (counts, never timings). (co-07)
- **ex-27 · when-not-to-build-it** — a decision table over message rate, size, and team skill —
  verify the printed recommendation for six cases. (co-07)

### Theme D — Ready for a container (`learning/theme-d-container-readiness.md`)

- **ex-28 · config-from-environment** — read and validate variables, with a named error per failure —
  verify three bad inputs. (co-08)
- **ex-29 · version-and-build-info** — carry a version string; the linker flag that sets it is an
  illustration — verify the default prints `dev`. (co-08)
- **ex-30 · health-and-readiness** — liveness answers "alive"; readiness answers "can take work" —
  verify readiness turns false while draining. (co-08)
- **ex-31 · multi-stage-dockerfile** — a Dockerfile for a static binary (an illustration; it is not run
  by the harness) — verify the layout against the checklist the code prints. (co-08)
- **ex-32 · non-root-read-only** — which paths the service writes — verify the list is empty, so a
  read-only root file system works. (co-08)
- **ex-33 · memory-and-cpu-settings** — derive `GOMEMLIMIT` and `GOMAXPROCS` from container limits —
  verify the values for three limits. (co-08)
- **ex-34 · grace-period-budget** — termination grace is at least the drain budget plus a margin —
  verify the arithmetic and the failing case. (co-05, co-08)
- **ex-35 · same-workload-locally** — a deterministic load generator replaces a real client — verify
  the printed totals. (co-08)
- **ex-36 · requests-and-limits** — compute resource requests from the pool size — verify the
  numbers. (co-08)

### Theme E — Golden signals, SLO, and burn rate (`learning/theme-e-golden-signals-and-slos.md`)

- **ex-37 · counters-gauges-histograms** — three hand-written metric types — verify updates. (co-09)
- **ex-38 · latency-buckets** — a histogram with fixed buckets and a quantile estimate — verify the
  estimate for a known sample. (co-09)
- **ex-39 · four-signals-from-the-pool** — wire the signals into the pool — verify a known workload
  gives known values. (co-09)
- **ex-40 · text-exposition** — render metrics as text lines — verify the exact text. (co-09)
- **ex-41 · sli-good-over-total** — define "good" for a job — verify the SLI for a log of outcomes.
  (co-10)
- **ex-42 · error-budget-arithmetic** — 99.9% over 30 days — verify 43.2 minutes of allowed
  unavailability. (co-10)
- **ex-43 · burn-rate-table** — burn rate times window equals budget spent — verify 14.4 over 1 hour
  is 2%, 6 over 6 hours is 5%, and 1 over 3 days is 10%. (co-11)
- **ex-44 · multiwindow-evaluator** — fire only when the long and short windows both exceed the
  threshold — verify it clears soon after the error rate falls. (co-12)
- **ex-45 · simulated-outage-pages** — a seeded simulation of a healthy day and an outage — verify the
  summary line `seeds: 64 passed, 0 failed (of 64)`. (co-12, co-13)

## Drilling

All drill sections are in `drilling/overview.md`; the floors come from
[tech-docs/002](../../tech-docs/002-capstone-course-contract-and-modes.md#drilling-targets).

- **Katas** (each has `before/` and `after/`, both harness units; the `before` run expects a
  non-zero exit): `kata-01-leaking-worker` (a goroutine that never stops), `kata-02-send-on-closed`
  (shutdown closes a channel producers still use), `kata-03-unbounded-queue` (a slice that grows
  forever), `kata-04-budget-off-by-ten` (an SLO calculation wrong by a factor of ten),
  `kata-05-flapping-alert` (a single-window alert that flaps; fix with two windows).
- Recall, applied problems, checklist, and why-prompts follow the counts in tech-docs/002.

## Code and harness

- **Toolchain**: `go` (plan 05 catalog; the version is recorded in the evidence at execution). No
  third-party modules, so no lockfile is needed beyond `go.mod`.
- **Units**: 45 example units, 5 kata units, 1 capstone unit (`learning/capstone/code/`), which holds
  the reference solution "Relay" as one Go module with packages `pool`, `ringq`, `frames`, `metrics`,
  `slo`, `sim`, and a small `cmd/relay`.
- **Capstone runs** (`run.yaml`): `stage-1-pool`, `stage-2-shutdown`, `stage-3-ring-queue`,
  `stage-4-container-readiness`, `stage-5-slo-burn` (with `simulation: true`), and `tests`
  (`go test -race -count=1 ./...`, `kind: test`, output ignored because it contains timings).
- **Determinism**: pool results are sorted by job ID; shutdown phases use virtual time from
  `testing/synctest`; the simulation follows S1–S9 with 64 seeds (`range(1, 65)` style), prints
  `failing seed: <n> (<invariant>)` per failure and one summary line, and replays one seed with
  `AYOKODING_SEED`.
- **Illustrations**: the Dockerfile, the linker flag, the `signal.Notify` call, and a Prometheus rule
  are marked `<!-- harness: illustration -->`, each with a sentence saying why it is not run here.
- **Run-time budget**: the whole course's `examples check` should finish in 10 minutes on a CI-class
  machine; the executor records the measured time (see
  [tech-docs/004](../../tech-docs/004-code-harness-and-determinism-design.md#run-time-budget)).

## Accuracy notes

- The error budget for 99.9% over 30 days is 0.1% of 43,200 minutes, which is 43.2 minutes: arithmetic.
- Burn-rate pages at 14.4 (1 hour long window, 5 minute short window, 2% of budget), 6 (6 hours, 30
  minutes, 5%), and a ticket at 1 (3 days, 6 hours, 10%), with the short window one twelfth of the long
  one: Google SRE Workbook, "Alerting on SLOs", `https://sre.google/workbook/alerting-on-slos/`,
  read 2026-10-09.
- `testing/synctest` is generally available from Go 1.25: Go 1.25 release notes,
  `https://go.dev/doc/go1.25`, as cited in plan 05's determinism design, re-checked in Phase 0.
- Deterministic-simulation prior art (FoundationDB, TigerBeetle, sled): plan 05's determinism
  design lists the sources; this course cites them in its References section.
- Container behaviour (`GOMEMLIMIT`, `GOMAXPROCS`, read-only root file system, grace period): the Go
  runtime documentation and the container runtime documentation, accessed at authoring time.

## Read more

- **Site Reliability Engineering Workbook** — Beyer et al. (O'Reilly). The source of the alerting
  tables used here.
- **The Go Programming Language Blog: "Go Concurrency Patterns: Pipelines and cancellation"** — Sameer
  Ajmani. The cancellation pattern in the standard library's terms.
- **TigerBeetle: Safety** — `https://docs.tigerbeetle.com/concepts/safety/`. How seeded simulation
  replays a failure.

## Lineage

This course replaces a 345-word outline whose only code was a single `ctx.Err()` line. Its five
steps became the five milestones; the "justified systems component" became theme C.

## In which paths

- `careers/interview-ready/software-engineer` — extension, "Architecture and distributed systems"
  (last in the phase).
- `careers/immediately-effective/software-engineer` — extension, "Architecture and distributed
  systems".
- `careers/fundamentally-strong/software-engineer` — extension, "Architecture and distributed
  systems".
- Course page link only: `capstone-lead-at-altitude` requires this course.
