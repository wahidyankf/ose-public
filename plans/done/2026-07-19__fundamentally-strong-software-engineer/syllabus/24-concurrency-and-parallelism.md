# 24 · Concurrency & Parallelism (By Example, Python)

**prd row**: Pass 2 · Depth, Design & Craft · By Example · Python · Learn 124 / Drill 224 · Nvim-ready Yes ·
VSCode-ready Yes. ([prd canonical table](../prd.md#the-94-topics--canonical-table-spiral-order-identical-in-both-tracks))

**Scope note**: the **core concurrency model** every engineer needs — threads vs processes vs async,
synchronization, races and deadlocks, message passing, and parallel decomposition — in Python, including
the GIL and free-threaded CPython. The two alternative styles get their own Pass-4 topics:
CSP → [`65-csp-style-concurrency`](./65-csp-style-concurrency.md) (Go) and the actor model →
[`67-actor-model-concurrency`](./67-actor-model-concurrency.md) (Elixir). Those three are integrated in
the `capstone-concurrency-showdown` inter-topic capstone.

## Why this exists · the big idea

- **The problem before the solution**: one thing at a time is simple but slow and unresponsive; the moment
  two things run at once, shared state corrupts and bugs stop being reproducible.
- **Keep-this-if-you-forget-everything**: don't share mutable state; when you must, protect it — almost
  every concurrency bug is a shared-state bug wearing a costume.
- **Big ideas touched**: `taming-state` (the whole discipline is containing state two things can touch),
  `determinism-vs-emergence` (interleavings turn deterministic code into emergent, order-dependent behavior).

## Prerequisites

- **Prior topics**: [topic 4 Just Enough Python](./04-just-enough-python.md);
  [topic 7 Data Structures & Algorithms Essentials](./07-data-structures-and-algorithms-essentials.md)
  (queues, the producer/consumer shape); [topic 23 Functional Programming](./23-functional-programming.md)
  for the "reduce shared mutable state" mindset.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.x** with `threading`, `multiprocessing`,
  `asyncio`, `concurrent.futures` (stdlib); optionally the free-threaded `3.14t` build for the GIL demo.
- **Assumed knowledge**: writing Python functions and loops; running a script from the CLI; the idea that
  two things running at once can interfere.

## Accuracy notes (web-verified)

> Verified in the pre-authoring `web-researcher` sweep (#48, DD-28).

- 2026-07-12 — verified: free-threaded CPython is real and correctly pinned — PEP 703 (no-GIL design,
  accepted Oct 2023) + PEP 779 ("supported status" criteria, accepted). As of **Python 3.14** the
  free-threaded build is officially **supported** (Phase II), **not yet the default** (Phase III pending).
  Binaries ship as `python3.14t` / `3.14.0t` (ABI tag `cp314t`; macOS opt-in checkbox, Windows
  `py install 3.14t`). Single-threaded overhead ≈5–10% depending on platform — cite if the body quantifies
  it. `asyncio` / `concurrent.futures` APIs current. (peps.python.org/pep-0779 / docs.python.org /
  py-free-threading.github.io)
- 2026-07-12 — DD-35 primary-source pass for the reactive-streams rung (co-29..co-33): Reactive Streams
  spec's four interfaces + JDK adoption as `java.util.concurrent.Flow` (Since 9) verified against
  reactive-streams.org + the JDK `Flow` javadoc; Observable push-vs-pull + hot/cold + marble diagrams
  against reactivex.io; RxJava's `BackpressureStrategy` (BUFFER/DROP/LATEST/ERROR/MISSING) + the
  `request(n)` reactive-pull model against the RxJava 3 source + Backpressure wiki; Reactor `Flux`/`Mono`
  against projectreactor.io; the Manifesto's four traits against reactivemanifesto.org. `[Needs Verification]`
  at authoring time: the FRP-vs-Rx (discrete-event) distinction is cross-confirmed via secondary sources
  (Wikipedia + Staltz) — cite Elliott & Hudak, "Functional Reactive Animation" (ICFP '97) directly for a
  hard primary source.

## Concepts

<!-- co-NN · concept enumeration (DD-34): every concept this topic teaches, 1:1-mirrored to a delivery.md checkbox. Floor ≥ 10 (By-Example subject). Each example below cites the co-NN it exercises. -->

- **co-01 · concurrency-vs-parallelism** — concurrency is dealing with many things by interleaving; parallelism is doing many at once on multiple cores.
- **co-02 · processes-vs-threads** — processes have isolated address spaces; threads share one, which is both cheaper and more dangerous.
- **co-03 · the-gil** — CPython's global interpreter lock serializes bytecode so only one thread runs Python at a time.
- **co-04 · free-threaded-cpython** — the PEP 703/779 no-GIL build (`python3.14t`, supported since 3.14) enables true thread parallelism.
- **co-05 · io-bound-vs-cpu-bound** — the workload class decides the tool: threads/async win I/O, processes win CPU.
- **co-06 · thread-creation-and-join** — spawn a `threading.Thread`, `start()` it, `join()` to wait for completion.
- **co-07 · shared-mutable-state-hazard** — two threads touching one mutable variable is the root of nearly every concurrency bug.
- **co-08 · race-condition** — a result that depends on the nondeterministic interleaving of operations.
- **co-09 · data-race-vs-race-condition** — a data race is unsynchronized concurrent access; a race condition is the broader ordering bug.
- **co-10 · atomicity** — an operation that completes indivisibly; `x += 1` is a non-atomic load-modify-store.
- **co-11 · locks-and-mutexes** — a `threading.Lock` making a critical section mutually exclusive.
- **co-12 · reentrant-locks** — a `threading.RLock` the owning thread can re-acquire without self-deadlock.
- **co-13 · semaphores** — a counter permitting at most N concurrent holders of a resource.
- **co-14 · condition-variables** — `wait`/`notify` coordination of threads around a shared predicate.
- **co-15 · events-and-barriers** — a `threading.Event` one-shot signal and a `Barrier` N-way rendezvous.
- **co-16 · deadlock** — a cyclic wait where each thread holds what another needs (the four Coffman conditions).
- **co-17 · livelock-and-starvation** — threads active yet making no progress, or one thread perpetually denied its turn.
- **co-18 · lock-ordering-discipline** — acquiring locks in one global order to break the circular-wait condition.
- **co-19 · memory-visibility** — one thread's writes may not be observed by another without synchronization.
- **co-20 · message-passing-over-shared-state** — "communicate by sharing queues, not by sharing memory".
- **co-21 · thread-safe-queues** — `queue.Queue` as a synchronized hand-off channel between threads.
- **co-22 · producer-consumer-pattern** — decoupling producers from consumers through a bounded buffer.
- **co-23 · thread-pools** — `concurrent.futures.ThreadPoolExecutor` reusing a fixed set of worker threads.
- **co-24 · process-pools** — `ProcessPoolExecutor` running work in separate processes to sidestep the GIL.
- **co-25 · futures-and-async-results** — a `Future` is a placeholder for a result not yet computed.
- **co-26 · async-await-and-the-event-loop** — `asyncio` single-threaded cooperative concurrency driven by an event loop.
- **co-27 · cooperative-vs-preemptive-scheduling** — `await` yields voluntarily; OS threads are preempted involuntarily.
- **co-28 · parallel-decomposition-and-amdahls-law** — splitting map-reduce work across workers; speedup is bounded by the serial fraction.
- **co-29 · reactive-streams-and-backpressure** — the Reactive Streams spec governs async stream exchange across a boundary with non-blocking backpressure via four interfaces (Publisher/Subscriber/Subscription/Processor), adopted into the JDK as `java.util.concurrent.Flow` (Java 9).
- **co-30 · observables-and-operators** — a ReactiveX `Observable` is a _push_ producer (`onNext`/`onError`/`onCompleted`) — the dual of a pull `Iterable` — composed by chainable operators (map/filter/take), with marble diagrams visualizing emissions over time.
- **co-31 · hot-vs-cold-streams** — a _cold_ Observable emits only on subscription so every subscriber sees the whole sequence; a _hot_ Observable emits regardless of subscribers, so late subscribers miss earlier items.
- **co-32 · backpressure-strategies** — when a producer outpaces its consumer the stream applies buffer / drop / latest / error; the _reactive-pull_ model inverts push by having the subscriber `request(n)` its demand so the source emits only what was asked for.
- **co-33 · reactive-manifesto-vs-frp** — the Reactive Manifesto (responsive / resilient / elastic / message-driven) is a manifesto, not a spec; Rx-style reactive streams are discrete-event, distinct from original FRP's continuous-time _behaviors_ + discrete _events_ (Elliott & Hudak, 1997).

## Forward pointers

- The two alternative concurrency styles get their own Pass-4 topics: CSP style
  ([`csp-style-concurrency`](./65-csp-style-concurrency.md), Go) and the actor model
  ([`actor-model-concurrency`](./67-actor-model-concurrency.md), Elixir); all three meet in the
  `capstone-concurrency-showdown` inter-topic capstone.

## Worked examples

Colocated under `concurrency-and-parallelism/learning/code/`; each runnable and reproducible (DD-20/DD-30).
Contiguous `ex-01..ex-87`. Every example cites the `co-NN` it exercises; every concept above is exercised
by ≥1 example.

### Beginner

- **ex-01 · concurrency-vs-parallelism-illustration** — two interleaved coroutines vs two processes on two cores — verify interleaving vs simultaneous execution. (co-01)
- **ex-02 · process-vs-thread-address-space** — a global changed in a thread is visible; in a child process it is not — verify the isolation. (co-02)
- **ex-03 · gil-serializes-cpu-threads** — two CPU-bound threads run no faster than one — verify wall-time ≈ serial. (co-03, co-05)
- **ex-04 · free-threaded-build-check** — `sys._is_gil_enabled()` on `python3.14t` — verify the GIL is reported disabled on the t-build. (co-04)
- **ex-05 · io-bound-threads-help** — two `time.sleep`/network threads overlap — verify wall-time < the serial sum. (co-05, co-06)
- **ex-06 · first-thread-start-join** — spawn one `threading.Thread`, `start()` + `join()` — verify the worker ran. (co-06)
- **ex-07 · many-threads-join-all** — start N threads and join them all — verify every one completed. (co-06)
- **ex-08 · shared-counter-no-lock** — two threads `+= 1` a million times each — verify the total is wrong (lost updates). (co-07, co-08)
- **ex-09 · plus-equals-not-atomic** — `dis` on `x += 1` shows LOAD/ADD/STORE — verify three bytecodes, not one. (co-10)
- **ex-10 · race-nondeterministic-output** — run the racing counter repeatedly — verify different totals across runs. (co-08)
- **ex-11 · lock-fixes-counter** — wrap the increment in a `threading.Lock` — verify the total is exactly right. (co-11, co-08)
- **ex-12 · lock-context-manager** — `with lock:` vs manual acquire/release — verify equivalence and release-on-exception. (co-11)
- **ex-13 · rlock-reentrant** — an `RLock` re-acquired by the same thread — verify no self-deadlock. (co-12)
- **ex-14 · plain-lock-self-deadlocks** — the same thread acquiring a plain `Lock` twice hangs — verify it blocks (with a timeout). (co-11, co-12)
- **ex-15 · semaphore-limits-concurrency** — a `Semaphore(2)` around a resource — verify at most 2 in the section at once. (co-13)
- **ex-16 · bounded-semaphore-guard** — a `BoundedSemaphore` raises on over-release — verify `ValueError`. (co-13)
- **ex-17 · event-signal** — one thread waits on `threading.Event`, another `set()`s it — verify the waiter proceeds. (co-15)
- **ex-18 · barrier-rendezvous** — N threads meet at a `Barrier` — verify none passes until all arrive. (co-15)
- **ex-19 · condition-wait-notify** — a consumer waits on a `Condition`, the producer `notify()`s — verify the consumer wakes. (co-14)
- **ex-20 · queue-put-get** — a `queue.Queue` passes items between two threads — verify FIFO delivery. (co-21, co-20)
- **ex-21 · producer-consumer-basic** — one producer, one consumer over a `Queue` — verify all items consumed. (co-22, co-21)
- **ex-22 · queue-sentinel-shutdown** — a `None` sentinel stops the consumer — verify clean termination. (co-22)
- **ex-23 · threadpool-map** — `ThreadPoolExecutor.map` over I/O tasks — verify all results returned in order. (co-23, co-05)
- **ex-24 · threadpool-submit-future** — `submit` returns a `Future`, `.result()` blocks — verify the value. (co-23, co-25)
- **ex-25 · processpool-cpu** — a `ProcessPoolExecutor` over a CPU task beats threads — verify faster wall-time. (co-24, co-03)
- **ex-26 · future-done-callback** — `add_done_callback` fires on completion — verify the callback ran. (co-25)
- **ex-27 · asyncio-hello** — `async def` + `asyncio.run` — verify a coroutine runs to completion. (co-26)
- **ex-28 · asyncio-gather-sleep** — `asyncio.gather` over `asyncio.sleep` tasks — verify concurrent overlap. (co-26, co-05)

### Intermediate

- **ex-29 · deadlock-two-locks** — two threads grab locks A,B in opposite order — verify the reproduced hang. (co-16)
- **ex-30 · deadlock-fix-lock-ordering** — impose a global lock order — verify no hang. (co-18, co-16)
- **ex-31 · deadlock-fix-timeout** — `acquire(timeout=...)` + back-off — verify progress instead of a hang. (co-16, co-11)
- **ex-32 · livelock-demo** — two threads politely yielding to each other forever — verify no progress. (co-17)
- **ex-33 · starvation-demo** — a producer starved by greedy consumers — verify it rarely runs. (co-17)
- **ex-34 · coffman-conditions** — annotate a deadlock against the four conditions — verify breaking one prevents it. (co-16)
- **ex-35 · memory-visibility-flag** — a busy-wait on an unsynchronized flag — verify a lock/Event fixes visibility. (co-19)
- **ex-36 · atomic-via-lock** — make read-modify-write atomic with a lock — verify no lost updates under load. (co-10, co-11)
- **ex-37 · data-race-vs-logic-race** — contrast an unsynchronized-access bug with an ordering bug — verify each fails differently. (co-09, co-08)
- **ex-38 · bounded-queue-backpressure** — a `Queue(maxsize=N)` blocks a fast producer — verify the producer waits. (co-22, co-21)
- **ex-39 · multi-producer-multi-consumer** — several producers/consumers over one queue — verify the totals balance. (co-22)
- **ex-40 · queue-task-done-join** — `task_done`/`join` to await a drain — verify the main thread waits for completion. (co-21, co-22)
- **ex-41 · condition-bounded-buffer** — a hand-built bounded buffer with a `Condition` — verify wait/notify correctness. (co-14, co-22)
- **ex-42 · threadpool-as-completed** — `as_completed` yields results as they finish — verify out-of-order arrival. (co-23, co-25)
- **ex-43 · threadpool-exception-propagates** — a worker raises; `.result()` re-raises — verify the exception surfaces. (co-23, co-25)
- **ex-44 · processpool-map-chunksize** — `ProcessPoolExecutor.map` with a `chunksize` — verify the correct aggregate. (co-24)
- **ex-45 · process-shared-state-fails** — a global mutated in a child process is unseen by the parent — verify the isolation. (co-02)
- **ex-46 · multiprocessing-queue-ipc** — a `multiprocessing.Queue` between processes — verify cross-process delivery. (co-20, co-02)
- **ex-47 · multiprocessing-value-lock** — a shared `Value` with a lock across processes — verify the correct total. (co-24, co-11)
- **ex-48 · pool-vs-serial-io** — time a thread pool vs serial on I/O — verify the pool wins. (co-23, co-05)
- **ex-49 · pool-vs-serial-cpu-threads** — threads don't help CPU work under the GIL — verify time ≈ serial. (co-03, co-05)
- **ex-50 · asyncio-tasks-create** — `asyncio.create_task` schedules concurrently — verify overlap vs sequential await. (co-26)
- **ex-51 · asyncio-timeout** — `asyncio.timeout`/`wait_for` cancels a slow coroutine — verify `TimeoutError`. (co-26)
- **ex-52 · asyncio-queue-producer-consumer** — an `asyncio.Queue` pipeline — verify all items consumed cooperatively. (co-26, co-22)
- **ex-53 · asyncio-semaphore-rate-limit** — an `asyncio.Semaphore` caps in-flight requests — verify ≤N concurrent. (co-26, co-13)
- **ex-54 · cooperative-blocking-hazard** — a blocking `time.sleep` in a coroutine stalls the loop — verify starvation, fix with `asyncio.sleep`. (co-27, co-26)
- **ex-55 · run-in-executor** — offload blocking work via `loop.run_in_executor` — verify the loop stays responsive. (co-27, co-23)
- **ex-56 · amdahl-speedup-estimate** — compute Amdahl's bound for a serial fraction — verify measured ≈ the predicted ceiling. (co-28)
- **ex-57 · map-reduce-decomposition** — split a sum across workers then combine — verify the combined result matches serial. (co-28, co-24)

### Advanced

- **ex-58 · free-threaded-parallel-cpu** — the same CPU task on `3.14t` scales across cores — verify near-linear speedup vs the GIL build. (co-04, co-03)
- **ex-59 · gil-vs-nogil-benchmark** — benchmark identical threaded CPU code on both builds — verify only the t-build parallelizes. (co-04, co-05)
- **ex-60 · thread-safe-singleton-double-checked** — a lazily-initialized singleton with double-checked locking — verify one instance under contention. (co-11, co-08)
- **ex-61 · reader-writer-lock** — a hand-built RW lock allowing many readers or one writer — verify the invariant. (co-13, co-11)
- **ex-62 · deadlock-detector-wait-for-graph** — detect a cycle in a wait-for graph — verify the cycle is found. (co-16, co-18)
- **ex-63 · lock-free-counter-via-queue** — replace a locked counter with a single-owner queue — verify correctness without a lock. (co-20, co-21)
- **ex-64 · thread-local-storage** — `local` from `threading` per-thread state — verify no cross-thread bleed. (co-07, co-19)
- **ex-65 · future-cancellation** — cancel a pending `Future` before it runs — verify it never executes. (co-25, co-23)
- **ex-66 · timeout-on-gather** — `asyncio.wait` with a timeout over many tasks — verify the pending set is returned. (co-26)
- **ex-67 · async-cancellation-cleanup** — cancel a task, handle `CancelledError`, run cleanup — verify resources released. (co-26, co-27)
- **ex-68 · async-taskgroup-vs-gather** — `asyncio.TaskGroup` structured concurrency vs `gather` — verify one failure cancels siblings. (co-26)
- **ex-69 · concurrent-fetch-aggregate-async** — fetch many URLs with `gather` + a semaphore — verify aggregate correct, ≤N concurrent. (co-26, co-13)
- **ex-70 · pipeline-three-stages** — a three-stage queue pipeline (read→transform→write) — verify throughput and ordering. (co-22, co-21)
- **ex-71 · work-stealing-intuition** — a two-worker deque work-stealing sketch — verify load balances. (co-28)
- **ex-72 · process-pool-shared-memory** — `multiprocessing.shared_memory` for a large array — verify no copy, correct result. (co-24, co-19)
- **ex-73 · async-to-thread** — `asyncio.to_thread` for a blocking call — verify the loop stays responsive. (co-27, co-23)
- **ex-74 · condition-predicate-loop** — `while not predicate: cond.wait()` guards spurious wakeups — verify correctness. (co-14)
- **ex-75 · barrier-parallel-phases** — a `Barrier` synchronizes phased parallel computation — verify phase ordering. (co-15, co-28)
- **ex-76 · benchmark-io-three-ways** — serial vs threads vs asyncio on I/O — verify both concurrent forms beat serial. (co-05, co-26, co-23)
- **ex-77 · benchmark-cpu-three-ways** — serial vs threads vs processes on CPU — verify only processes beat serial (GIL build). (co-05, co-24, co-03)
- **ex-78 · graceful-shutdown-signal** — a signal-driven pool drain with sentinels — verify all in-flight work completes. (co-22, co-23)
- **ex-79 · deadlock-free-dining-philosophers** — dining philosophers with lock ordering — verify no deadlock, all eat. (co-16, co-18)
- **ex-80 · race-detector-stress-test** — a stress harness surfacing a rare race — verify it fails pre-fix, passes post-lock. (co-08, co-11)
- **ex-81 · capstone-preview-concurrent-processor** — a mini fetch-and-aggregate three ways with a timing harness — verify all match serial + the expected speedup pattern. (co-01, co-23, co-24, co-26)

### Reactive streams

- **ex-82 · observable-map-filter-rxpy** — build an `Observable` from a range with `reactivex` (RxPY), chain `map` + `filter` operators, and subscribe an observer printing `on_next`/`on_completed` — verify only the transformed, matching items reach the observer. (co-30)
- **ex-83 · hot-vs-cold-subscription** — a cold Observable replayed in full to a late subscriber vs a hot `Subject` that drops pre-subscription emissions — verify the late subscriber sees every item (cold) but only later items (hot). (co-31)
- **ex-84 · backpressure-buffer-vs-latest** — a fast producer + slow consumer under `buffer` vs `latest` — verify buffer preserves all items (at bounded memory cost) while latest retains only the most recent. (co-32)
- **ex-85 · reactive-pull-request-n** — a subscriber signalling demand via `request(n)` so the producer emits at most `n` items — verify no item is emitted beyond outstanding demand. (co-29, co-32)
- **ex-86 · flow-publisher-subscriber-contract** — a typed `java.util.concurrent.Flow`-style contract in Python (`Publisher`/`Subscriber`/`Subscription`): `on_subscribe` → `request` → `on_next` → `on_complete` — verify the subscription's demand accounting drives emission. (co-29)
- **ex-87 · marble-diagram-operator-annotate** — an annotated marble diagram of a `merge` + `map` + `debounce` pipeline mapping input streams to output emissions over time — verify each operator's effect on timing and values is labelled. (co-30, co-33)

## Capstone spec — intra-topic (subject → full runnable)

- **Goal**: build a concurrent work processor (e.g. a URL/file fetch-and-aggregate pipeline) three ways —
  thread pool, `asyncio`, and process pool — measure them against a serial baseline on I/O-bound and
  CPU-bound workloads, and demonstrate a race + its synchronized fix and a deadlock + its resolution.
- **Concepts exercised**: [ ] thread pool (co-23) [ ] `asyncio` event loop (co-26) [ ] process pool / GIL
  sidestep (co-24, co-03) [ ] a race condition + lock fix (co-08, co-11) [ ] a reproduced-and-resolved
  deadlock (co-16, co-18) [ ] I/O-bound vs CPU-bound routing (co-05) [ ] Amdahl's-law reasoning on the
  measured speedups (co-28).
- **Ordered steps**:
  1. `.../learning/capstone/code/serial.py` — the serial baseline + a timing harness. Verify it produces
     the correct aggregate and a baseline time.
  2. `pool_threads.py` + `async_run.py` — thread-pool and `asyncio` versions for the I/O-bound workload.
     Verify each matches the baseline result and is faster on I/O.
  3. `pool_process.py` — process-pool version for the CPU-bound workload. Verify it beats threads on CPU
     work and explain why (GIL).
  4. `race_demo.py` — a shared-counter race, then the lock fix; a deadlock, then its resolution. Verify the
     unsafe version is observably wrong and the fixed version is correct/terminating.
- **Acceptance criteria**: all variants produce the identical correct aggregate; measured speedups match
  the expected pattern (async/threads win I/O, processes win CPU); the race and deadlock are demonstrably
  fixed; speedups are explained with Amdahl's-law intuition.
- **Done bar**: runnable end-to-end + web-verified.

## Read more

**Books**

- **The Art of Multiprocessor Programming** — Maurice Herlihy & Nir Shavit (2008; revised ed. 2012). The standard graduate text on concurrent data structures, synchronization, and memory models.
- **Java Concurrency in Practice** — Brian Goetz, Tim Peierls, Joshua Bloch, Joseph Bowbeer, David Holmes, Doug Lea (2006). Canonical practitioner's guide to safe concurrent programming and the Java Memory Model.
- **Seven Concurrency Models in Seven Weeks** — Paul Butcher (2014). Practical survey of threads, actors, CSP, STM, and dataflow concurrency models.

**Papers & articles**

- **Is Parallel Programming Hard, And, If So, What Can You Do About It?** — Paul E. McKenney (continually updated). Free, encyclopedic handbook of parallel-programming techniques from a Linux kernel maintainer. <https://mirrors.edge.kernel.org/pub/linux/kernel/people/paulmck/perfbook/perfbook.html>
- **Time, Clocks, and the Ordering of Events in a Distributed System** — Leslie Lamport (1978). Founding paper of logical clocks and the happens-before relation underpinning distributed concurrency. <https://dl.acm.org/doi/10.1145/359545.359563>
- **The Problem with Threads** — Edward A. Lee (2006). Influential argument that nondeterministic thread interleaving is the wrong default concurrency model. <https://www2.eecs.berkeley.edu/Pubs/TechRpts/2006/EECS-2006-1.pdf>

---

← Previous: [23 · Functional Programming](./23-functional-programming.md) · Next: [25 · Advanced Algorithms](./25-advanced-algorithms.md) →
