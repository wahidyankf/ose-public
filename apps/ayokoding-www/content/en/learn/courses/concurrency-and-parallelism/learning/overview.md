---
title: "Overview"
date: 2026-07-17T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [4 · Just Enough Python](../../just-enough-python/learning/overview.md) -- every
  script in this topic is fully type-annotated Python, and you should already be comfortable reading
  functions, classes, exceptions, context managers, and `dict`/`list` literals the way that primer
  taught them; [7 · Data Structures & Algorithms Essentials](../../data-structures-and-algorithms-essentials/learning/overview.md)
  -- this topic leans on the queue and deque shapes you already built there for the producer/consumer
  and work-stealing examples; [22 · Programming Paradigms](../../programming-paradigms/learning/overview.md)
  -- the "reduce shared mutable state" mindset that topic introduced through the functional lens is the
  same discipline this topic applies under real concurrent execution, where an unprotected mutable
  variable is not just harder to reason about, it is actively unsafe.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13.12** (stdlib `threading`,
  `multiprocessing`, `asyncio`, `concurrent.futures`, `queue`, `dis`, `sys` -- no third-party packages
  for examples 1-81); **`reactivex` 4.1.0** (RxPY) for the two Observable-based reactive-streams
  examples (82-83) -- installed only into `learning/code/ex-82-observable-map-filter-rxpy/` and
  `learning/code/ex-83-hot-vs-cold-subscription/` via a per-example `requirements.txt`, since every
  other example in this topic is pure stdlib; **pytest 9.1.1** to run each example's test file;
  **pyright** in `--strict` mode (`pyrightconfig.json` at the topic root) -- every `example.py` and
  `test_example.py` in this topic passes `pyright --strict` with zero errors. Optionally, a
  free-threaded `python3.14t` build (PEP 703/779) to see examples 4, 58, and 59 exercise true
  thread-level parallelism instead of the GIL-serialized behavior the standard build shows -- **not**
  required, since every free-threading example branches on `sys._is_gil_enabled()` and is genuinely
  correct on whichever interpreter actually runs it.
- **Assumed knowledge**: writing Python functions, classes, and loops; running a script from the CLI;
  reading a stack trace; the general idea that two things running "at once" can interfere with each
  other, even without prior hands-on concurrency experience.

## Why this exists -- the big idea

**The problem before the solution**: one thing at a time is simple but slow and unresponsive -- the
moment two things run at once, shared state corrupts and bugs stop being reproducible. **The one idea
worth keeping if you forget everything else**: don't share mutable state; when you must, protect it --
almost every concurrency bug in this topic, from a lost counter update to a five-way dining-philosophers
deadlock, is a shared-state bug wearing a different costume.

**Cross-cutting big ideas, taught here and then reused for the rest of this topic**: `taming-state` --
the whole discipline of concurrent programming is containing the state two things can touch, whether
through a lock, a single owner, or a message-passing queue. `determinism-vs-emergence` -- interleavings
turn deterministic single-threaded code into emergent, order-dependent behavior, which is exactly why a
race condition can pass every test run in isolation and still fail unpredictably under load (see the
stress-harness example, ex-80). This topic covers the **core concurrency model** every engineer needs --
threads vs processes vs async, synchronization, races and deadlocks, message passing, and parallel
decomposition -- in Python, including the GIL and free-threaded CPython, and closes with a six-example
reactive-streams sub-group (Observables, hot/cold subscriptions, backpressure, and reactive pull) that
applies the same shared-state and flow-control discipline to a push-based, operator-composed stream
model.

## Install and run your first example

Confirm the toolchain this topic's Beginner tier needs is installed:

```text
$ python3 --version
Python 3.13.12
$ python3 -c "import threading, multiprocessing, asyncio, concurrent.futures, queue; print('stdlib concurrency primitives OK')"
stdlib concurrency primitives OK
$ python3 -m pytest --version
pytest 9.1.1
```

Every example is a complete, self-contained runnable file colocated under `learning/code/ex-NN-slug/`,
paired with its own `test_example.py`, and both files are actually executed to capture the documented
output -- never a fabricated transcript. Run any example directly:

```text
cd learning/code/ex-01-concurrency-vs-parallelism-illustration
python3 example.py
pytest -q
```

Two examples (82 and 83) need one extra package -- install it inside that example's own directory only:

```text
cd learning/code/ex-82-observable-map-filter-rxpy
pip install -r requirements.txt   # reactivex==4.1.0
```

**A note on free-threaded CPython**: examples 4, 58, and 59 discuss and exercise the free-threaded
(`python3.14t`) build. PEP 779 made free-threading officially **supported** as of Python 3.14, but on
macOS the installer's free-threaded option is still literally labeled **"[experimental]"** in the
`python.org` installer UI -- supported by the PEP, but the platform installer's own copy has not yet
caught up. All three examples are written to branch on `sys._is_gil_enabled()`, so they run correctly
and honestly on whichever interpreter actually executes them, standard or free-threaded.

## How this topic's examples are organized

- **[Beginner](./beginner.md)** (Examples 1-28) -- concurrency vs. parallelism, processes vs. threads,
  the GIL, `threading.Thread` start/join, the shared-counter race and its `Lock` fix, `RLock`,
  `Semaphore`, `Event`, `Barrier`, `Condition`, `queue.Queue`, a basic producer/consumer pipeline,
  `ThreadPoolExecutor`, `ProcessPoolExecutor`, `Future`, and your first `asyncio` coroutine and
  `gather`.
- **[Intermediate](./intermediate.md)** (Examples 29-57) -- a reproduced two-lock deadlock and two
  different fixes (lock ordering, timeout), livelock, starvation, the four Coffman conditions, memory
  visibility, data races vs. logic races, bounded-queue backpressure, multi-producer/multi-consumer
  queues, a hand-built `Condition`-based bounded buffer, `as_completed`, exception propagation through
  a `Future`, `multiprocessing` IPC (`Queue`, `Value`), pool-vs-serial benchmarks for I/O and CPU work,
  `asyncio.create_task`/`timeout`/`Queue`/`Semaphore`, the cooperative-blocking hazard, offloading
  blocking calls with `run_in_executor`, Amdahl's Law, and a map-reduce decomposition.
- **[Advanced](./advanced.md)** (Examples 58-87) -- free-threaded CPython actually scaling CPU-bound
  threads, double-checked locking, a hand-built reader-writer lock, deadlock detection via a wait-for
  graph, a lock-free single-owner-queue counter, `local()` from `threading`, `Future`/`Task` cancellation,
  `asyncio.wait`, `TaskGroup`, a rate-limited concurrent fetch-and-aggregate, a three-stage pipeline,
  work-stealing, `multiprocessing.shared_memory`, `asyncio.to_thread`, the spurious-wakeup guard,
  phased-computation barriers, three-way I/O and CPU benchmarks, graceful shutdown, deadlock-free dining
  philosophers, a race-detecting stress harness, a capstone-preview benchmark, and a self-contained
  **reactive-streams sub-group** (Examples 82-87): an `Observable` with `map`/`filter` via `reactivex`
  (RxPY), hot vs. cold subscriptions, hand-rolled backpressure (buffer vs. latest -- RxPY 4.1.0 ships no
  built-in backpressure operators), reactive pull via `request(n)`, a hand-rolled
  `java.util.concurrent.Flow`-style contract, and an annotated marble diagram of a `merge` + `map` +
  `debounce` pipeline.

## The 33 concepts this topic covers

- **co-01 · Concurrency vs. parallelism** -- concurrency is dealing with many things by interleaving;
  parallelism is doing many at once on multiple cores. Examples 1, 81.
- **co-02 · Processes vs. threads** -- processes have isolated address spaces; threads share one, which
  is both cheaper and more dangerous. Examples 2, 45, 46.
- **co-03 · The GIL** -- CPython's global interpreter lock serializes bytecode so only one thread runs
  Python at a time. Examples 3, 25, 49, 58, 77.
- **co-04 · Free-threaded CPython** -- the PEP 703/779 no-GIL build (`python3.14t`, supported since
  3.14) enables true thread parallelism. Examples 4, 58, 59.
- **co-05 · I/O-bound vs. CPU-bound** -- the workload class decides the tool: threads/async win I/O,
  processes win CPU. Examples 3, 5, 23, 28, 48, 49, 59, 76, 77.
- **co-06 · Thread creation and join** -- spawn a `threading.Thread`, `start()` it, `join()` to wait for
  completion. Examples 5, 6, 7.
- **co-07 · Shared-mutable-state hazard** -- two threads touching one mutable variable is the root of
  nearly every concurrency bug. Examples 8, 64.
- **co-08 · Race condition** -- a result that depends on the nondeterministic interleaving of
  operations. Examples 8, 10, 11, 37, 60, 80.
- **co-09 · Data race vs. race condition** -- a data race is unsynchronized concurrent access; a race
  condition is the broader ordering bug. Example 37.
- **co-10 · Atomicity** -- an operation that completes indivisibly; `x += 1` is a non-atomic
  load-modify-store. Examples 9, 36.
- **co-11 · Locks and mutexes** -- a `threading.Lock` making a critical section mutually exclusive.
  Examples 11, 12, 14, 31, 36, 47, 60, 61, 80.
- **co-12 · Reentrant locks** -- a `threading.RLock` the owning thread can re-acquire without
  self-deadlock. Examples 13, 14.
- **co-13 · Semaphores** -- a counter permitting at most N concurrent holders of a resource. Examples
  15, 16, 53, 61, 69.
- **co-14 · Condition variables** -- `wait`/`notify` coordination of threads around a shared predicate.
  Examples 19, 41, 74.
- **co-15 · Events and barriers** -- a `threading.Event` one-shot signal and a `Barrier` N-way
  rendezvous. Examples 17, 18, 75.
- **co-16 · Deadlock** -- a cyclic wait where each thread holds what another needs (the four Coffman
  conditions). Examples 29, 30, 31, 34, 62, 79.
- **co-17 · Livelock and starvation** -- threads active yet making no progress, or one thread
  perpetually denied its turn. Examples 32, 33.
- **co-18 · Lock-ordering discipline** -- acquiring locks in one global order to break the
  circular-wait condition. Examples 30, 62, 79.
- **co-19 · Memory visibility** -- one thread's writes may not be observed by another without
  synchronization. Examples 35, 64, 72.
- **co-20 · Message passing over shared state** -- "communicate by sharing queues, not by sharing
  memory". Examples 20, 46, 63.
- **co-21 · Thread-safe queues** -- `queue.Queue` as a synchronized hand-off channel between threads.
  Examples 20, 21, 38, 40, 63, 70.
- **co-22 · Producer-consumer pattern** -- decoupling producers from consumers through a bounded
  buffer. Examples 21, 22, 38, 39, 40, 41, 52, 70, 78.
- **co-23 · Thread pools** -- `concurrent.futures.ThreadPoolExecutor` reusing a fixed set of worker
  threads. Examples 23, 24, 42, 43, 48, 55, 65, 73, 76, 78, 81.
- **co-24 · Process pools** -- `ProcessPoolExecutor` running work in separate processes to sidestep the
  GIL. Examples 25, 44, 47, 57, 72, 77, 81.
- **co-25 · Futures and async results** -- a `Future` is a placeholder for a result not yet computed.
  Examples 24, 26, 42, 43, 65.
- **co-26 · Async/await and the event loop** -- `asyncio` single-threaded cooperative concurrency
  driven by an event loop. Examples 27, 28, 50, 51, 52, 53, 54, 66, 67, 68, 69, 76, 81.
- **co-27 · Cooperative vs. preemptive scheduling** -- `await` yields voluntarily; OS threads are
  preempted involuntarily. Examples 54, 55, 67, 73.
- **co-28 · Parallel decomposition and Amdahl's Law** -- splitting map-reduce work across workers;
  speedup is bounded by the serial fraction. Examples 56, 57, 71, 75.
- **co-29 · Reactive streams and backpressure** -- the Reactive Streams spec governs async stream
  exchange across a boundary with non-blocking backpressure via four interfaces
  (Publisher/Subscriber/Subscription/Processor), adopted into the JDK as `java.util.concurrent.Flow`
  (Java 9). Examples 85, 86.
- **co-30 · Observables and operators** -- a ReactiveX `Observable` is a _push_ producer
  (`onNext`/`onError`/`onCompleted`) -- the dual of a pull `Iterable` -- composed by chainable
  operators (`map`/`filter`/`take`), with marble diagrams visualizing emissions over time. Examples 82, 87.
- **co-31 · Hot vs. cold streams** -- a _cold_ Observable emits only on subscription so every
  subscriber sees the whole sequence; a _hot_ Observable emits regardless of subscribers, so late
  subscribers miss earlier items. Example 83.
- **co-32 · Backpressure strategies** -- when a producer outpaces its consumer the stream applies
  buffer / drop / latest / error; the _reactive-pull_ model inverts push by having the subscriber
  `request(n)` its demand so the source emits only what was asked for. Examples 84, 85.
- **co-33 · Reactive Manifesto vs. FRP** -- the Reactive Manifesto (responsive / resilient / elastic /
  message-driven) is a manifesto, not a spec; Rx-style reactive streams are discrete-event, distinct
  from original FRP's continuous-time _behaviors_ + discrete _events_ (Elliott & Hudak, 1997). Example 87.

## Examples by Level

### Beginner (Examples 1-28)

- [Example 1: Concurrency vs. Parallelism, Illustrated](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-1-concurrency-vs-parallelism-illustrated)
- [Example 2: Process vs. Thread Address Space](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-2-process-vs-thread-address-space)
- [Example 3: The GIL Serializes CPU-Bound Threads](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-3-the-gil-serializes-cpu-bound-threads)
- [Example 4: Detecting a Free-Threaded (No-GIL) Build](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-4-detecting-a-free-threaded-no-gil-build)
- [Example 5: I/O-Bound Threads Actually Help](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-5-io-bound-threads-actually-help)
- [Example 6: Your First Thread -- start() and join()](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-6-your-first-thread----start-and-join)
- [Example 7: Starting Many Threads and Joining Them All](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-7-starting-many-threads-and-joining-them-all)
- [Example 8: A Shared Counter Without a Lock Loses Updates](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-8-a-shared-counter-without-a-lock-loses-updates)
- [Example 9: `x += 1` Is Not One Atomic Step -- Proof via `dis`](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-9-x--1-is-not-one-atomic-step----proof-via-dis)
- [Example 10: A Race's Output Is Nondeterministic Across Runs](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-10-a-races-output-is-nondeterministic-across-runs)
- [Example 11: A `Lock` Fixes the Racing Counter](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-11-a-lock-fixes-the-racing-counter)
- [Example 12: `with lock:` vs Manual acquire()/release()](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-12-with-lock-vs-manual-acquirerelease)
- [Example 13: `RLock` Lets the Owning Thread Re-Acquire](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-13-rlock-lets-the-owning-thread-re-acquire)
- [Example 14: A Plain `Lock` Self-Deadlocks on Re-Acquire](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-14-a-plain-lock-self-deadlocks-on-re-acquire)
- [Example 15: A `Semaphore(2)` Limits Concurrent Access](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-15-a-semaphore2-limits-concurrent-access)
- [Example 16: `BoundedSemaphore` Catches an Over-Release Bug](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-16-boundedsemaphore-catches-an-over-release-bug)
- [Example 17: A `threading.Event` Signal](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-17-a-threadingevent-signal)
- [Example 18: A `Barrier` Rendezvous Point](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-18-a-barrier-rendezvous-point)
- [Example 19: `Condition` -- wait() and notify()](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-19-condition----wait-and-notify)
- [Example 20: `queue.Queue` -- put() and get() Between Threads](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-20-queuequeue----put-and-get-between-threads)
- [Example 21: A Basic Producer/Consumer Pipeline](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-21-a-basic-producerconsumer-pipeline)
- [Example 22: A `None` Sentinel Cleanly Shuts Down a Consumer](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-22-a-none-sentinel-cleanly-shuts-down-a-consumer)
- [Example 23: `ThreadPoolExecutor.map` Over I/O Tasks](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-23-threadpoolexecutormap-over-io-tasks)
- [Example 24: `submit()` Returns a `Future`; `.result()` Blocks](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-24-submit-returns-a-future-result-blocks)
- [Example 25: `ProcessPoolExecutor` Beats Threads on CPU Work](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-25-processpoolexecutor-beats-threads-on-cpu-work)
- [Example 26: `add_done_callback` Fires on Completion](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-26-add_done_callback-fires-on-completion)
- [Example 27: Your First Coroutine -- `async def` and `asyncio.run`](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-27-your-first-coroutine----async-def-and-asynciorun)
- [Example 28: `asyncio.gather` Runs `asyncio.sleep` Tasks Concurrently](/en/c/learn/courses/concurrency-and-parallelism/learning/beginner#example-28-asynciogather-runs-asynciosleep-tasks-concurrently)

### Intermediate (Examples 29-57)

- [Example 29: Two Threads, Two Locks, Opposite Order -- A Reproduced Deadlock](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-29-two-threads-two-locks-opposite-order----a-reproduced-deadlock)
- [Example 30: A Global Lock Order Fixes the Deadlock](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-30-a-global-lock-order-fixes-the-deadlock)
- [Example 31: `acquire(timeout=...)` + Back-Off Fixes a Deadlock Differently](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-31-acquiretimeout--back-off-fixes-a-deadlock-differently)
- [Example 32: Livelock -- Both Threads Active, Neither Makes Progress](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-32-livelock----both-threads-active-neither-makes-progress)
- [Example 33: A Producer Starved by Greedy Consumers](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-33-a-producer-starved-by-greedy-consumers)
- [Example 34: The Four Coffman Conditions -- Present in ex-29, Broken in ex-30](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-34-the-four-coffman-conditions----present-in-ex-29-broken-in-ex-30)
- [Example 35: Memory Visibility -- Why a Busy-Wait Flag Is Fragile, Even When It "Works"](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-35-memory-visibility----why-a-busy-wait-flag-is-fragile-even-when-it-works)
- [Example 36: Any Read-Modify-Write Needs a Lock, Not Just `+= 1`](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-36-any-read-modify-write-needs-a-lock-not-just--1)
- [Example 37: A Data Race and a Logic Race Fail in DIFFERENT Ways](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-37-a-data-race-and-a-logic-race-fail-in-different-ways)
- [Example 38: A Bounded Queue Applies Backpressure to a Fast Producer](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-38-a-bounded-queue-applies-backpressure-to-a-fast-producer)
- [Example 39: Several Producers and Several Consumers, One Shared Queue](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-39-several-producers-and-several-consumers-one-shared-queue)
- [Example 40: `task_done()` + `Queue.join()` -- Waiting for a Full Drain](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-40-task_done--queuejoin----waiting-for-a-full-drain)
- [Example 41: A Hand-Built Bounded Buffer, Using `Condition` Directly](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-41-a-hand-built-bounded-buffer-using-condition-directly)
- [Example 42: `as_completed` Yields Results in FINISH Order, Not Submit Order](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-42-as_completed-yields-results-in-finish-order-not-submit-order)
- [Example 43: A Worker's Exception Is Stored, Then RE-RAISED by `.result()`](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-43-a-workers-exception-is-stored-then-re-raised-by-result)
- [Example 44: `ProcessPoolExecutor.map` With a `chunksize` -- Same Result, Less IPC Overhead](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-44-processpoolexecutormap-with-a-chunksize----same-result-less-ipc-overhead)
- [Example 45: A Global Mutated in a Child Process Is Invisible to the Parent](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-45-a-global-mutated-in-a-child-process-is-invisible-to-the-parent)
- [Example 46: `multiprocessing.Queue` -- the Cross-Process Delivery Channel](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-46-multiprocessingqueue----the-cross-process-delivery-channel)
- [Example 47: A Shared `multiprocessing.Value`, Protected by ITS OWN Built-In Lock](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-47-a-shared-multiprocessingvalue-protected-by-its-own-built-in-lock)
- [Example 48: A Thread Pool Beats Serial Execution on I/O-Bound Work](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-48-a-thread-pool-beats-serial-execution-on-io-bound-work)
- [Example 49: Threads Do NOT Speed Up CPU-Bound Work -- the GIL Serializes Them](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-49-threads-do-not-speed-up-cpu-bound-work----the-gil-serializes-them)
- [Example 50: `asyncio.create_task` Schedules Work CONCURRENTLY, Not Sequentially](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-50-asynciocreate_task-schedules-work-concurrently-not-sequentially)
- [Example 51: `asyncio.timeout` Cancels a Coroutine That Runs Too Long](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-51-asynciotimeout-cancels-a-coroutine-that-runs-too-long)
- [Example 52: An `asyncio.Queue` Pipeline -- Cooperative Producer/Consumer](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-52-an-asyncioqueue-pipeline----cooperative-producerconsumer)
- [Example 53: `asyncio.Semaphore` Caps How Many Coroutines Run "In Flight" at Once](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-53-asynciosemaphore-caps-how-many-coroutines-run-in-flight-at-once)
- [Example 54: A Blocking `time.sleep` Inside a Coroutine Freezes the ENTIRE Event Loop](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-54-a-blocking-timesleep-inside-a-coroutine-freezes-the-entire-event-loop)
- [Example 55: `loop.run_in_executor` -- Offloading a TRULY Blocking Call Off the Event Loop](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-55-looprun_in_executor----offloading-a-truly-blocking-call-off-the-event-loop)
- [Example 56: Amdahl's Law -- the Theoretical CEILING on Parallel Speedup](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-56-amdahls-law----the-theoretical-ceiling-on-parallel-speedup)
- [Example 57: Map-Reduce -- Split the Work, Combine the Partial Results](/en/c/learn/courses/concurrency-and-parallelism/learning/intermediate#example-57-map-reduce----split-the-work-combine-the-partial-results)

### Advanced (Examples 58-87)

- [Example 58: On a Free-Threaded Build, CPU-Bound Threads Actually Scale](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-58-on-a-free-threaded-build-cpu-bound-threads-actually-scale)
- [Example 59: Benchmarking IDENTICAL Threaded Code -- GIL Build vs `python3.14t`](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-59-benchmarking-identical-threaded-code----gil-build-vs-python314t)
- [Example 60: Double-Checked Locking -- A Lazily-Built Singleton, Safe Under Contention](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-60-double-checked-locking----a-lazily-built-singleton-safe-under-contention)
- [Example 61: A Hand-Built Reader-Writer Lock -- Many Readers, OR One Writer](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-61-a-hand-built-reader-writer-lock----many-readers-or-one-writer)
- [Example 62: Detecting a Deadlock -- Finding a Cycle in a Wait-For Graph](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-62-detecting-a-deadlock----finding-a-cycle-in-a-wait-for-graph)
- [Example 63: A "Lock-Free" Counter -- via a Single-Owner Queue, Not a Lock](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-63-a-lock-free-counter----via-a-single-owner-queue-not-a-lock)
- [Example 64: `local()` from `threading` -- Per-Thread State That Never Bleeds Across Threads](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-64-local-from-threading----per-thread-state-that-never-bleeds-across-threads)
- [Example 65: Cancelling a PENDING `Future` -- Before It Ever Starts](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-65-cancelling-a-pending-future----before-it-ever-starts)
- [Example 66: `asyncio.wait(..., timeout=...)` -- Returns BOTH the Done AND the Pending Sets](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-66-asynciowait-timeout----returns-both-the-done-and-the-pending-sets)
- [Example 67: Cancelling a Task -- Catching `CancelledError` to Run Cleanup](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-67-cancelling-a-task----catching-cancellederror-to-run-cleanup)
- [Example 68: `asyncio.TaskGroup` -- One Failure Cancels ALL Its Siblings](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-68-asynciotaskgroup----one-failure-cancels-all-its-siblings)
- [Example 69: Fetch Many "URLs" Concurrently, Rate-Limited, Then Aggregate](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-69-fetch-many-urls-concurrently-rate-limited-then-aggregate)
- [Example 70: A Three-Stage Pipeline -- Read -> Transform -> Write, via Two Queues](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-70-a-three-stage-pipeline----read---transform---write-via-two-queues)
- [Example 71: Work-Stealing -- an Idle Worker Steals From an Overloaded Peer's Deque](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-71-work-stealing----an-idle-worker-steals-from-an-overloaded-peers-deque)
- [Example 72: `multiprocessing.shared_memory` -- Genuine No-Copy Cross-Process Access](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-72-multiprocessingshared_memory----genuine-no-copy-cross-process-access)
- [Example 73: `asyncio.to_thread` -- the High-Level Shortcut for Offloading Blocking Calls](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-73-asyncioto_thread----the-high-level-shortcut-for-offloading-blocking-calls)
- [Example 74: `while not predicate: cond.wait()` -- Guarding Against a Spurious/Early Wakeup](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-74-while-not-predicate-condwait----guarding-against-a-spuriousearly-wakeup)
- [Example 75: A `Barrier` Synchronizes Phased Parallel Computation](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-75-a-barrier-synchronizes-phased-parallel-computation)
- [Example 76: I/O-Bound Work, Benchmarked Three Ways -- Serial vs Threads vs `asyncio`](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-76-io-bound-work-benchmarked-three-ways----serial-vs-threads-vs-asyncio)
- [Example 77: CPU-Bound Work, Benchmarked Three Ways -- Only Processes Actually Win](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-77-cpu-bound-work-benchmarked-three-ways----only-processes-actually-win)
- [Example 78: Graceful Shutdown -- Draining In-Flight Work Before a Worker Pool Exits](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-78-graceful-shutdown----draining-in-flight-work-before-a-worker-pool-exits)
- [Example 79: Dining Philosophers -- Deadlock-Free, via a Global Fork-Acquisition Order](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-79-dining-philosophers----deadlock-free-via-a-global-fork-acquisition-order)
- [Example 80: A Stress Harness -- Repeated Trials Surface an Intermittent Race](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-80-a-stress-harness----repeated-trials-surface-an-intermittent-race)
- [Example 81: Capstone Preview -- Fetch-and-Aggregate, Three Ways, One Timing Harness](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-81-capstone-preview----fetch-and-aggregate-three-ways-one-timing-harness)
- [Example 82: An `Observable`, `map`, and `filter` -- Reactive Streams via `reactivex` (RxPY)](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-82-an-observable-map-and-filter----reactive-streams-via-reactivex-rxpy)
- [Example 83: Cold Observables Replay in Full; Hot Subjects Drop What Already Happened](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-83-cold-observables-replay-in-full-hot-subjects-drop-what-already-happened)
- [Example 84: Backpressure Strategies -- Buffer-All vs Keep-Latest (Hand-Rolled)](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-84-backpressure-strategies----buffer-all-vs-keep-latest-hand-rolled)
- [Example 85: Reactive Pull -- a Subscriber's request(n) Bounds How Much the Producer Emits](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-85-reactive-pull----a-subscribers-requestn-bounds-how-much-the-producer-emits)
- [Example 86: A java.util.concurrent.Flow-Style Contract, Hand-Rolled in Python](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-86-a-javautilconcurrentflow-style-contract-hand-rolled-in-python)
- [Example 87: An Annotated Marble Diagram for merge -> map -> debounce](/en/c/learn/courses/concurrency-and-parallelism/learning/advanced#example-87-an-annotated-marble-diagram-for-merge---map---debounce)

---

← Previous: [23 · Functional Programming Drilling](../../functional-programming/drilling/overview.md) &middot; Next: [Beginner Examples](./beginner.md) →
