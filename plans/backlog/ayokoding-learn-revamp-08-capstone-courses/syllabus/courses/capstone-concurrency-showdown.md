# Capstone · Concurrency Showdown (Capstone, Annotated-Concept)

**Course ID**: `capstone-concurrency-showdown` · **Format**: Capstone (`format: capstone`); teaching
mode: Annotated-Concept, standard sub-mode.

**Scope note**: Solves one bounded work-processing problem twice, with Go channels (CSP) and with
Elixir processes under a supervisor (actors), then compares the two from observed behaviour. It
integrates `csp-style-concurrency` and `actor-model-concurrency` and teaches no new language
features. It excludes distributed actors across machines, consensus (`distributed-systems`), and
operating a service (`capstone-concurrency-and-systems`).

**Short summary**: One contract, two implementations, and a written comparison where every claim
points at something you ran. You finish with a selection rule that names the workload and the failure
shape, not a favourite language.

## Why this exists · the big idea

- **The problem before the solution**: engineers pick a concurrency model by reputation. Without
  running the same contract on both models, "actors are more fault tolerant" and "channels are
  simpler" stay slogans.
- **Keep-this-if-you-forget-everything**: compare models on the same contract and the same injected
  failures, count what you observe, and bind every recommendation to a workload and a failure shape.

## Learning objectives

- Implement bounded fan-out and fan-in in Go with channels, `select`, and `context` cancellation.
- Implement the same contract in Elixir with a coordinator process, worker processes, and a
  supervisor, using a credit protocol for backpressure.
- Express the contract as language-neutral test vectors that both implementations pass.
- Inject the same failures into both (a crashing worker, a poisoned job, cancellation mid-run) and
  describe what each model does.
- Write a comparison on coordination, backpressure, failure, testability, and observability, with a
  selection rule.

## Prerequisites

- **Prior courses (`prerequisites` after the rubric re-run)**: `just-enough-go`,
  `just-enough-elixir`, `csp-style-concurrency`, `actor-model-concurrency`.
- **Edge changes against plan 02's graph**: add `just-enough-go` and `just-enough-elixir` (rule L1:
  every required exercise is written in one of the two languages). The two concurrency courses are
  kept because the written course uses them (channels and worker pools in the Go half, processes and
  supervision in the Elixir half). No edge is removed.
- **Assumed knowledge**: you can run a Go program and an Elixir (`mix`) project.

## Mode and targets

- **Mode**: Annotated-Concept, standard sub-mode. **Reason**: the learning is comparative. Each
  worked example isolates one behaviour in one model, and several are paired so the reader sees both
  side by side; By Example would repeat syntax the two prerequisite courses already teach.
- **Worked examples**: floor 45, band 45–60, five themes of nine; all 45 carry runnable code (Go for
  themes A, D-go, E-go; Elixir for theme B and the Elixir halves of C, D, E).
- **Words**: at least 23,000.
- **Diagrams**: at least one per theme (five or more), including a message-flow diagram per model.
- **Layout**: as the standard capstone layout in
  [tech-docs/002](../../tech-docs/002-capstone-course-contract-and-modes.md#file-layout-per-course); theme
  pages `learning/theme-a-csp-in-go.md` to `learning/theme-e-testing-observing-choosing.md`.
- **Metadata**: `category: computer-science`; `format: capstone`; `description` kept from plan 03
  ("Solve one concurrency problem twice, in Go and in Elixir, and compare the results.");
  `estimatedHours` from the drift test (expected 5–8); no `status`.

## Project brief

**The contract ("Batch").** A coordinator accepts up to N jobs, runs them on a bounded number of
workers, and returns one result per job. Required behaviour:

1. No job is lost or run twice, even when a worker fails.
2. At most K jobs are in flight; producers that outrun workers are slowed or refused (your choice per
   model, documented).
3. A job marked "poison" fails every time; the batch still finishes and reports it.
4. Cancellation stops new work and reports which jobs finished, failed, or were cancelled.
5. Results are reported as a set keyed by job ID, so output never depends on scheduling.

**Deliverables.** A Go implementation, an Elixir implementation, a shared `vectors.json` both pass,
and `comparison.md`.

## Milestones

| #   | Milestone                     | Theme | Checkpoint                                        |
| --- | ----------------------------- | ----- | ------------------------------------------------- |
| M1  | Batch in Go (CSP)             | A     | capstone run `stage-1-go-batch`                   |
| M2  | Batch in Elixir (actors)      | B     | secondary unit `ex-46-capstone-elixir-batch`      |
| M3  | One contract, both pass       | C     | capstone run `stage-3-contract`                   |
| M4  | Same failures, compared       | D     | capstone run `stage-4-failures`                   |
| M5  | Comparison and selection rule | E     | capstone runs `stage-5-comparison-check`, `tests` |

## Acceptance criteria

| ID   | Criterion                                                                                                       | Proof run                                  |
| ---- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| AC-1 | The Go batch passes every vector in `vectors.json`                                                              | `stage-3-contract`                         |
| AC-2 | The Elixir batch passes every vector in `vectors.json` (same SHA-256 of the file is asserted in both)           | `ex-46` unit, run `contract`               |
| AC-3 | With 100 jobs, K = 4, no more than 4 are ever in flight in Go                                                   | `stage-1-go-batch`                         |
| AC-4 | A crashing worker does not lose its job in either model: the job is retried or reported failed, once            | `stage-4-failures`; `ex-46` run `failures` |
| AC-5 | A poison job is reported after the allowed attempts and the batch finishes                                      | `stage-4-failures`; `ex-46` run `failures` |
| AC-6 | Cancelling mid-run leaves no goroutine or process alive and reports finished, failed, and cancelled sets        | `stage-4-failures`; `ex-46` run `failures` |
| AC-7 | `go test -race` passes                                                                                          | `tests`                                    |
| AC-8 | `comparison.md` has the five dimensions, each claim cites a named run output, and the selection rule is a table | `stage-5-comparison-check`                 |

## Rubric

Levels: 0 not yet, 1 partial, 2 meets, 3 strong. A pass needs every criterion at 2 or higher and all
acceptance criteria green.

| Criterion             | 2 — meets                                                   | 3 — strong                                                                      |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Same contract         | Both pass the same vectors                                  | A deliberately unfair variant is shown to pass in one model and fail the vector |
| Failure handling      | Both survive the injected failures with the same final sets | The different recovery paths are explained, including restart limits            |
| Backpressure          | Each model has a stated policy and a test                   | The policies are compared at a producer-to-consumer ratio of 10 to 1            |
| Evidence-based claims | Each comparison claim cites an output                       | A claim that the evidence does not support is withdrawn in writing              |
| Selection rule        | A table maps workload and failure shape to a model          | The table names a case where neither model fits                                 |

**Evidence to keep**: outputs of each run, `vectors.json` and its hash, `comparison.md`.

**Extensions** (not graded): add a third implementation (for example Rust with channels); add
priorities to jobs and see which model needs the larger change.

## Concepts

- **co-01 · channel-rendezvous** — an unbuffered channel hands a value over only when both sides are
  ready.
- **co-02 · bounded-in-flight** — a limit on concurrently running jobs, enforced by a semaphore or by
  credits.
- **co-03 · context-cancellation** — cancellation travels with a context value (Go).
- **co-04 · mailbox** — each process has a private queue of messages (Elixir).
- **co-05 · credit-protocol** — a worker sends credit to the coordinator; the coordinator sends work
  only against credit, which bounds the mailbox.
- **co-06 · supervision** — a supervisor restarts failed children by a stated strategy and limit.
- **co-07 · language-neutral-contract** — behaviour defined by data (vectors) that any language can
  run.
- **co-08 · no-silent-drop** — every accepted job ends in exactly one reported state.
- **co-09 · poison-job** — a job that always fails and must not stop the batch.
- **co-10 · failure-injection-parity** — the same failure applied to both models.
- **co-11 · evidence-bound-comparison** — a claim is allowed only with an observation behind it.

## Worked examples

### Theme A — CSP in Go (`learning/theme-a-csp-in-go.md`)

- **ex-01 · unbuffered-rendezvous** — send and receive on an unbuffered channel — verify the printed
  order. (co-01)
- **ex-02 · buffered-capacity** — a channel of capacity 3 — verify the fourth send would block. (co-01)
- **ex-03 · select-with-virtual-timeout** — `select` with a timeout under `testing/synctest` — verify
  the timeout fires at the stated virtual time. (co-01)
- **ex-04 · fan-out-fan-in** — spread jobs over workers and merge results — verify the sorted result
  list. (co-02)
- **ex-05 · bounded-in-flight** — a semaphore of size K — verify peak in flight equals K. (co-02)
- **ex-06 · cancel-with-context** — cancel a running batch — verify no worker continues. (co-03)
- **ex-07 · close-and-range** — close a results channel and range over it — verify the loop ends.
  (co-01)
- **ex-08 · worker-error-reporting** — send errors on a separate channel — verify one entry per
  failing job. (co-08)
- **ex-09 · race-detector-clean** — run the batch under `-race` — verify exit 0. (co-02)

### Theme B — Actors in Elixir (`learning/theme-b-actors-in-elixir.md`)

- **ex-10 · spawn-and-mailbox** — spawn a process and send it messages — verify the order received
  from one sender. (co-04)
- **ex-11 · selective-receive** — match messages by pattern — verify unmatched messages stay queued.
  (co-04)
- **ex-12 · genserver-call-and-cast** — a counter server — verify call replies and cast effects. (co-04)
- **ex-13 · state-in-a-process** — hold batch state in a server — verify state after a message
  sequence. (co-04)
- **ex-14 · credit-based-mailbox** — workers grant credit; the coordinator sends only against credit —
  verify the mailbox never exceeds K. (co-05)
- **ex-15 · one-for-one-supervisor** — restart only the failed child — verify siblings keep state.
  (co-06)
- **ex-16 · restart-intensity** — a limit of restarts in a period — verify the supervisor gives up at
  the limit. (co-06)
- **ex-17 · monitors-and-links** — detect a worker exit — verify the coordinator learns the exit
  reason. (co-06)
- **ex-18 · task-supervisor-jobs** — run each job as a supervised task — verify failures are isolated.
  (co-06)

### Theme C — One contract, two models (`learning/theme-c-one-contract.md`)

- **ex-19 · vectors-json** — define the contract as data (inputs, injected failures, expected final
  sets) — verify the file's SHA-256, which both languages assert. (co-07)
- **ex-20 · go-contract-runner** — read vectors and run the Go batch — verify each vector passes. (co-07)
- **ex-21 · elixir-contract-runner** — the same in Elixir — verify each vector passes. (co-07)
- **ex-22 · go-coordinator** — the Go coordinator in full — verify the vectors. (co-02, co-08)
- **ex-23 · elixir-coordinator** — the Elixir coordinator in full — verify the vectors. (co-05, co-08)
- **ex-24 · result-set-equality** — compare the two result sets by job ID — verify equality for all
  vectors (the unit holds a recorded copy of the Elixir results, because units cannot read each
  other; the executor confirms the copy is byte-identical to the Elixir unit's expected output). (co-07)
- **ex-25 · no-silent-drop-invariant** — assert every job ends in exactly one state — verify on all
  vectors. (co-08)
- **ex-26 · ordering-guarantees** — what order each model promises (none across jobs, FIFO per
  sender) — verify with a test that does not rely on order. (co-04)
- **ex-27 · idempotent-resubmit** — submit the same job ID twice — verify one result in both
  models. (co-08)

### Theme D — Backpressure and failure (`learning/theme-d-backpressure-and-failure.md`)

- **ex-28 · go-block-or-shed** — block, reject, or drop when full — verify counts per policy. (co-02)
- **ex-29 · elixir-credit-or-drop** — the same policies with credits — verify counts per policy.
  (co-05)
- **ex-30 · fast-producer-simulation** — a seeded, single-threaded simulation of a producer ten times
  faster than the consumer, with a virtual clock — verify the summary line over 64 seeds and that
  queue depth never exceeds its bound in either policy. (co-02, co-05)
- **ex-31 · go-panic-recovered** — recover a worker panic and report it — verify the job is reported
  once. (co-08)
- **ex-32 · elixir-crash-restart** — crash a worker on purpose — verify the supervisor restarts it
  and the job is retried. (co-06)
- **ex-33 · poison-job-isolated** — a job that always fails — verify it is reported after N attempts
  in both models. (co-09)
- **ex-34 · restart-storm** — a worker that fails at start — verify the restart limit stops the storm.
  (co-06)
- **ex-35 · cancel-during-failure** — cancel while a worker is failing — verify one final state per
  job. (co-03, co-08)
- **ex-36 · partial-results-report** — report finished, failed, and cancelled sets — verify the three
  sets are disjoint and cover all jobs. (co-08)

### Theme E — Testing, observing, and choosing (`learning/theme-e-testing-observing-choosing.md`)

- **ex-37 · go-test-strategy** — `-race`, `synctest`, and no sleeps — verify the test passes without
  real waiting. (co-10)
- **ex-38 · exunit-by-messages** — synchronise tests with messages and monitors, not sleeps — verify
  the test passes deterministically. (co-10)
- **ex-39 · trace-counters** — sequence-numbered events in both models — verify the counts. (co-10)
- **ex-40 · queue-depth-signal** — expose queue depth or mailbox size in both — verify the series for
  a fixed workload. (co-10)
- **ex-41 · failure-surface-compared** — list the failure outputs each model produces — verify the
  table against recorded outputs. (co-11)
- **ex-42 · parity-table** — failures injected, outcomes observed, in one table — verify the table
  is generated from run outputs. (co-10, co-11)
- **ex-43 · selection-rule-as-table** — a function from workload and failure shape to a model —
  verify the printed choice for eight cases, including one where neither fits. (co-11)
- **ex-44 · cost-of-ceremony** — count concepts and lines each model needed for the contract — verify
  the counts printed from the reference sources. (co-11)
- **ex-45 · comparison-checklist** — check that `comparison.md` has the five dimensions and that each
  claim cites a run — verify the checker on a good and a bad file. (co-11)

## Drilling

- **Katas** (each has `before/` and `after/`): `kata-01-go-forgot-cancel` (a worker ignores the
  context), `kata-02-go-unbounded-spawn` (one goroutine per job), `kata-03-elixir-blocking-call` (a
  `GenServer.call` that blocks the coordinator), `kata-04-elixir-no-restart` (a worker not under a
  supervisor), `kata-05-unsupported-claim` (a comparison claim with no cited output).
- Other drill sections follow tech-docs/002 counts.

## Code and harness

- **Toolchains**: `go` for the capstone unit and Go examples; `elixir` for Elixir examples. One
  toolchain per unit (plan 05 contract), so the course has two kinds of unit.
- **Capstone unit** (`learning/capstone/code/`): the Go reference with `vectors.json`; runs
  `stage-1-go-batch`, `stage-3-contract`, `stage-4-failures`,
  `stage-5-comparison-check`, `tests`.
- **Elixir reference solution**: because a capstone unit holds one toolchain, the Elixir half lives in
  the example unit `learning/code/ex-46-capstone-elixir-batch/` (a Mix project with runs `contract`,
  `failures`, `tests`). The capstone page anchors to both. See
  [tech-docs/004](../../tech-docs/004-code-harness-and-determinism-design.md#two-language-capstones).
- **Determinism**: results are reported as sets keyed by job ID; Go uses `testing/synctest`; Elixir
  tests synchronise on messages; the fast-producer simulation follows S1–S9 with 64 seeds; the Elixir
  `mix` project uses only the Elixir standard library and OTP, so no dependency is fetched.
- **Cross-language check**: both languages assert the SHA-256 of `vectors.json`. The executor
  confirms with `diff` that the two copies are byte-identical.

## Accuracy notes

- Go channel, `select`, `context`, and `testing/synctest` behaviour: Go documentation and the Go 1.25
  release notes, `https://go.dev/doc/go1.25`, re-checked in Phase 0.
- Elixir `GenServer`, `Supervisor`, restart strategies, and `max_restarts`: Elixir and OTP
  documentation for the versions in the plan 05 catalog, read at authoring time.
- The BEAM mailbox is unbounded by default, so bounding it needs a protocol such as credits: OTP
  documentation, stated as a design fact and shown by ex-14.
- Deterministic-simulation convention: plan 05's determinism design (S1–S9).

## Read more

- **Communicating Sequential Processes** — C. A. R. Hoare (Prentice Hall, 1985; free PDF from the
  author's page). The origin of the channel model.
- **Programming Erlang** — Joe Armstrong (Pragmatic Bookshelf). The actor model with supervision.
- **Designing for Scalability with Erlang/OTP** — Cesarini and Vinoski (O'Reilly). Supervision
  strategies in practice.

## Lineage

This course replaces a 325-word outline. Its five steps became the five milestones; its warning not to
call one model superior became the evidence-bound comparison rule.

## In which paths

- `careers/interview-ready/software-engineer` — extension, "More computer science" (last in the
  phase).
- `careers/immediately-effective/software-engineer` — extension, "More computer science".
- `careers/fundamentally-strong/software-engineer` — extension, "More computer science".
