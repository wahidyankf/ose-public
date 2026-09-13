---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

This page is the active-recall companion to the Concurrency & Parallelism learning track: five fixed
drills that force retrieval instead of passive re-reading. Work through them in order -- short-answer
recall first, then scenario judgment, then hands-on repetition, then a checklist to confirm real
automaticity, and finally why/why-not prompts that test whether you can explain the reasoning, not just
execute the syntax. Every answer is hidden in a `<details>` block; try each item yourself, out loud or on
paper, before opening it. Together, the five drills below touch every one of this topic's 33 concepts and
cite specific examples spanning all 87 worked examples in the Beginner, Intermediate, and Advanced tiers,
plus the capstone. Every code kata below genuinely exercises real `threading`, `multiprocessing`, or
`asyncio` machinery -- none is a mocked stand-in -- and each one was actually run repeatedly during
authoring to confirm its captured output is stable across runs, not a one-off lucky timing.

## Recall Q&A

Thirty-three short-answer questions, one per concept (`co-01` through `co-33`). Answer from memory, then
check.

**Q1 (co-01 -- concurrency-vs-parallelism).** A teammate says "we parallelized the login flow by using
`asyncio` on a single OS thread." Is that an accurate use of the word "parallelized"?

<details>
<summary>Answer</summary>

No -- `asyncio` on one OS thread is concurrency (dealing with many things by interleaving), not
parallelism (doing many things at once on multiple cores). A single thread can only ever run one
instruction at a time, no matter how many coroutines it juggles; true parallelism requires more than one
thread or process actually executing simultaneously (Example 1 illustrates the two side by side; Example
81 contrasts a thread-pool/`asyncio` fetch against a genuinely parallel process-pool aggregate).

</details>

**Q2 (co-02 -- processes-vs-threads).** Why are threads described as "cheaper and more dangerous" than
processes, specifically?

<details>
<summary>Answer</summary>

Threads share ONE process's address space, so spawning a thread is cheap (no memory copy, no separate
interpreter) but also dangerous: any thread can directly read or write another thread's data with zero
isolation, which is exactly what makes unsynchronized shared mutation possible. Processes have isolated
address spaces -- safer by construction, since one process's corruption or crash cannot directly touch
another's memory -- but every spawn and every cross-process communication costs real copying/IPC overhead
(Example 2 contrasts the two directly; Examples 45-46 show a global mutated in a child process being
invisible to the parent, precisely because of that isolation).

</details>

**Q3 (co-03 -- the-gil).** A CPU-bound function is wrapped in 4 threads on a standard CPython build, but
wall-clock time barely improves over running it serially. Why?

<details>
<summary>Answer</summary>

CPython's Global Interpreter Lock allows only ONE thread to execute Python bytecode at any instant,
regardless of how many CPU cores are available -- CPU-bound threaded work serializes onto effectively one
core, so wall time approaches (or, with switching overhead, slightly exceeds) the single-threaded time
(Example 3 demonstrates the serialization directly; Examples 25, 49, 58, and 77 each measure this same
ceiling from a different angle).

</details>

**Q4 (co-04 -- free-threaded-cpython).** What does the PEP 703/779 no-GIL build change about Q3's answer,
and since which Python version has it been officially supported?

<details>
<summary>Answer</summary>

A free-threaded (`python3.14t`) build removes the GIL entirely, so CPU-bound threads can genuinely
execute Python bytecode simultaneously across multiple cores -- officially supported since Python 3.14
per PEP 779, though it remains an opt-in build variant, and platform installers (macOS's, notably) may
still label the option "experimental" in their own UI even though the PEP itself calls it supported
(Example 4 detects which build is running; Examples 58-59 measure real CPU-bound speedup on it).

</details>

**Q5 (co-05 -- io-bound-vs-cpu-bound).** You need to speed up both a network-fetch step and a
data-compression step in the same Python pipeline. Which concurrency tool fits each, and why the
difference?

<details>
<summary>Answer</summary>

The fetch step is I/O-bound -- it spends nearly all its time WAITING (on the network), and a waiting
thread releases the GIL, so threads or `asyncio` overlap the waits efficiently. The compression step is
CPU-bound -- it spends its time actually COMPUTING, so only separate processes (each with its own
interpreter and its own GIL) genuinely parallelize it; threads would just serialize on the GIL the same
way Q3 describes (Examples 3, 5, 23, 28, 48, 49, 59, 76, and 77 each classify a workload this way before
choosing a tool).

</details>

**Q6 (co-06 -- thread-creation-and-join).** What does `start()` do versus what does `join()` do on a
`threading.Thread`?

<details>
<summary>Answer</summary>

`start()` schedules the thread's target function to begin running CONCURRENTLY and returns immediately --
it does not wait for the target to finish. `join()` blocks the CALLING thread until the target thread's
function has actually returned. Forgetting `join()` means the caller can proceed (or the whole program
can exit) before spawned threads finish their work (Examples 5-7 build up from one thread to several,
each explicitly joined).

</details>

**Q7 (co-07 -- shared-mutable-state-hazard).** Why is "two threads touching one mutable variable" called
the ROOT of nearly every concurrency bug in this topic, rather than just one bug among many?

<details>
<summary>Answer</summary>

Nearly every failure mode this topic covers -- races, deadlocks, visibility surprises -- only exists
BECAUSE some piece of mutable state is reachable and writable from more than one thread at the same time.
If no state were ever shared and mutable simultaneously, none of locks, semaphores, or conditions would
be necessary at all -- they all exist specifically to manage this one hazard (Example 8's shared counter;
Example 64's `local()` fix (from `threading`) removes the hazard by giving each thread its OWN, unshared copy).

</details>

**Q8 (co-08 -- race-condition).** Define a race condition precisely -- what has to be true about a
program's "result" and its "interleaving"?

<details>
<summary>Answer</summary>

A race condition is a bug where the OUTCOME of a program depends on the particular, nondeterministic
order in which concurrent operations happen to interleave -- the exact same code, run with the exact same
inputs, can produce different results on different runs, because the operating system's scheduler
decides the interleaving, not the program (Examples 8, 10, 11, and 37 reproduce one directly; Example 60
shows a subtler one inside lazy singleton construction; Example 80's stress harness exists because a
single passing run proves nothing about race-freedom).

</details>

**Q9 (co-09 -- data-race-vs-race-condition).** Are "data race" and "race condition" two names for the
same bug?

<details>
<summary>Answer</summary>

No. A data race is the narrower, mechanically-checkable case: unsynchronized concurrent access to the
SAME memory location where at least one access is a write. A race condition is the broader, semantic
category -- any bug where output depends on interleaving timing, which can happen even WITHOUT a data
race, e.g. two properly-locked operations still running in an unintended overall order for the business
logic they implement (Example 37 deliberately shows the two failing in DIFFERENT observable ways).

</details>

**Q10 (co-10 -- atomicity).** Why is `x += 1` not "one operation" from the interpreter's point of view,
even though it reads like a single line?

<details>
<summary>Answer</summary>

`x += 1` is really three separate steps -- read the current value of `x`, compute `x + 1`, write the
result back -- and CPython performs no magic to make those three steps indivisible as a group. Another
thread can interleave between any of them, so its own read can see a stale value and its own write can
silently be overwritten, losing an update (Example 9 proves this via `dis` bytecode inspection; Example 36
generalizes the point to ANY read-modify-write, not just `+=`).

</details>

**Q11 (co-11 -- locks-and-mutexes).** What does a `threading.Lock` guarantee about the code inside a
`with lock:` block?

<details>
<summary>Answer</summary>

A Lock guarantees mutual exclusion: at most ONE thread can be executing inside that block at any given
instant. Any other thread attempting to acquire the same lock BLOCKS until the current holder releases
it, which eliminates interleaving inside that specific critical section entirely (Examples 11-12 fix a
racing counter with one; Examples 14, 31, 36, 47, 60, 61, and 80 each apply the same guarantee to a
different scenario).

</details>

**Q12 (co-12 -- reentrant-locks).** Why does a plain `Lock` self-deadlock if the SAME thread tries to
acquire it twice, and what does `RLock` change?

<details>
<summary>Answer</summary>

A plain Lock tracks only "held or not held," never WHO holds it -- so a second `acquire()` call from the
SAME thread that already holds it blocks waiting for a `release()` that same thread would have to perform
first, which can never happen because that thread is itself blocked. An `RLock` tracks the owning thread
plus a re-entry count, letting that SAME thread re-acquire it without blocking, as long as it eventually
calls `release()` once per `acquire()` (Example 13 shows the RLock working; Example 14 shows the plain
Lock deadlocking on the identical re-acquire attempt).

</details>

**Q13 (co-13 -- semaphores).** How does `Semaphore(2)` differ from a `Lock` in what it permits?

<details>
<summary>Answer</summary>

A Lock permits exactly one holder at a time. A `Semaphore(N)` permits up to N CONCURRENT holders --
`acquire()` decrements an internal counter (blocking once it reaches zero) and `release()` increments it
back, letting up to N callers hold the semaphore simultaneously instead of just one, useful for capping
concurrent access to a resource pool sized N (Examples 15-16 build and then stress-test the bound;
Examples 53, 61, and 69 apply it to a rate-limited or reader-writer scenario).

</details>

**Q14 (co-14 -- condition-variables).** What two things does a `Condition` combine, and what problem does
that combination solve?

<details>
<summary>Answer</summary>

A `Condition` pairs a lock WITH a wait/notify mechanism: a thread inside `with cond:` can call
`cond.wait()` to atomically release the lock and block, until another thread changes some shared state and
calls `cond.notify()`/`notify_all()`, at which point the waiter automatically re-acquires the lock before
proceeding. This solves "block until a specific condition becomes true" without a wasteful busy-loop that
burns CPU checking a flag repeatedly (Example 19's basic wait/notify; Example 41's hand-built bounded
buffer; Example 74's `while` guard against a spurious/early wakeup).

</details>

**Q15 (co-15 -- events-and-barriers).** What's the difference in intent between `threading.Event` and
`threading.Barrier`?

<details>
<summary>Answer</summary>

An `Event` is a one-shot broadcast signal -- any number of waiters unblock once `set()` is called, and it
stays set (any FUTURE waiter also passes through immediately) until explicitly `clear()`ed. A `Barrier` is
a rendezvous point for a FIXED number of parties -- every participant blocks at `wait()` until exactly N
have arrived, then all N are released together at once, and the barrier automatically resets for reuse on
the next round (Example 17's one-shot Event signal; Example 18's rendezvous; Example 75's `Barrier`
synchronizing phased parallel computation across multiple rounds).

</details>

**Q16 (co-16 -- deadlock).** Name the four Coffman conditions, and state which one lock-ordering
discipline (co-18) removes.

<details>
<summary>Answer</summary>

Mutual exclusion (a resource can only be held by one thread at a time), hold-and-wait (a thread holds one
resource while waiting for another), no preemption (a resource cannot be forcibly taken away from its
holder), and circular wait (a cycle of threads, each waiting on a resource the next one in the cycle
holds). All four must hold simultaneously for a deadlock to occur; lock-ordering discipline specifically
removes circular wait, the only one of the four that's usually practical to eliminate outright (Examples
29, 31, and 34 reproduce and analyze a real deadlock; Examples 62 and 79 apply the same diagnosis to a
wait-for graph and dining philosophers).

</details>

**Q17 (co-17 -- livelock-and-starvation).** How does livelock differ from a plain deadlock, and how does
starvation differ from both?

<details>
<summary>Answer</summary>

In deadlock, every involved thread is BLOCKED and makes zero progress. In livelock, threads stay ACTIVE
(never blocked) but keep changing state in RESPONSE to each other without either one ever making real
progress -- like two people repeatedly stepping the same direction to avoid colliding in a hallway.
Starvation is different again: one SPECIFIC thread is perpetually denied the resource it needs while OTHER
threads make progress just fine, no mutual back-and-forth required (Example 32 reproduces livelock;
Example 33 reproduces a producer starved by greedy consumers).

</details>

**Q18 (co-18 -- lock-ordering-discipline).** Why does "acquire locks in one global order" specifically
target the circular-wait Coffman condition and not the other three?

<details>
<summary>Answer</summary>

If every thread that needs multiple locks always acquires them in the SAME globally-agreed order, a cycle
(thread A waiting for a lock thread B holds, while B waits for a lock A holds) can never form -- whichever
thread reaches the shared FIRST lock in that order simply proceeds and eventually releases both. This
doesn't remove mutual exclusion (locks still exclude), hold-and-wait (a thread can still hold one while
waiting for the next), or no-preemption (locks still can't be forcibly taken) -- it specifically makes the
circular-wait SHAPE impossible to construct in the first place (Example 30 fixes Example 29's deadlock
this exact way; Examples 62 and 79 apply the same fix elsewhere).

</details>

**Q19 (co-19 -- memory-visibility).** Why can one thread's write be invisible to another thread even when
nothing looks obviously wrong in the code?

<details>
<summary>Answer</summary>

Without synchronization, there is no language-level GUARANTEE about when (or, in a stricter memory model,
whether) one thread's write becomes visible to another thread's read -- a read could observe a stale
cached view. In practice, CPython's GIL makes many such cases "just happen to work" as a side effect of
byte-code-granularity switching, which is exactly why relying on it is fragile: it's an implementation
coincidence, not a portable guarantee any other Python implementation (or a future free-threaded build) is
obligated to preserve (Example 35's busy-wait flag "works" yet is flagged as fragile for this reason;
Examples 64 and 72 explore adjacent visibility/isolation boundaries).

</details>

**Q20 (co-20 -- message-passing-over-shared-state).** What does "communicate by sharing queues, not by
sharing memory" actually change about how bugs manifest?

<details>
<summary>Answer</summary>

Instead of multiple threads reading and writing the SAME mutable variable (needing a lock around every
single access to stay safe), each thread privately owns its own state and hands DATA to others through a
thread-safe channel -- there is no shared mutable location left to race on at all, because ownership of
each piece of data transfers explicitly through the channel rather than being simultaneously accessible to
everyone (Example 20's `put()`/`get()` handoff; Examples 46 and 63 apply the same idea across a process
boundary and via a single-owner queue standing in for a lock-free counter).

</details>

**Q21 (co-21 -- thread-safe-queues).** What does `queue.Queue` provide internally that makes it safe to
`put()`/`get()` from multiple threads with no additional external lock?

<details>
<summary>Answer</summary>

`queue.Queue` wraps its own internal deque with its own `Lock`/`Condition` machinery -- every `put()` and
`get()` call is ALREADY synchronized inside the queue's own implementation, so callers never need to wrap
queue operations in their own extra lock; the queue itself is the synchronization boundary (Example 20's
basic hand-off; Examples 38 and 40 exercise backpressure and `task_done()`/`join()`; Examples 63 and 70
build a lock-free counter and a multi-stage pipeline on top of this same guarantee).

</details>

**Q22 (co-22 -- producer-consumer-pattern).** What specific problem does a BOUNDED buffer solve that an
unbounded one doesn't?

<details>
<summary>Answer</summary>

An unbounded buffer lets a fast producer pile up an unlimited number of unconsumed items in memory if
consumers can't keep pace, risking unbounded memory growth. A bounded buffer applies BACKPRESSURE: `put()`
blocks once the buffer reaches its maximum size, forcing the producer to slow down to match the
consumer's actual processing rate, rather than racing ahead indefinitely (Example 38 applies backpressure
to a fast producer directly; Examples 21-22, 39-41, 52, 70, and 78 build progressively richer
producer/consumer pipelines on the same bounded-buffer idea).

</details>

**Q23 (co-23 -- thread-pools).** What specifically does a `ThreadPoolExecutor` save you from doing by
hand?

<details>
<summary>Answer</summary>

Manually creating a fresh `Thread` object for every unit of work, individually tracking each one to
`join()` it, and managing an unbounded, potentially huge number of concurrently-live threads. A pool
creates a FIXED number of long-lived worker threads up front and hands them a shared queue of work,
bounding concurrency AND reusing threads across many tasks instead of paying creation/teardown cost per
task (Examples 23-24 submit work and collect a `Future`; Examples 42-43, 48, 55, 65, 73, 76, 78, and 81
apply pools to progressively more realistic scenarios).

</details>

**Q24 (co-24 -- process-pools).** Given Q3/Q5's answers, when would you reach for `ProcessPoolExecutor`
over `ThreadPoolExecutor`?

<details>
<summary>Answer</summary>

Whenever the work is genuinely CPU-bound -- threads in a `ThreadPoolExecutor` still serialize on the GIL
for CPU-heavy work (Q3), so a `ProcessPoolExecutor`, where each worker is a fully separate interpreter
with its OWN GIL, is the tool that actually uses multiple cores in parallel (Example 25 beats threads on
CPU work directly; Examples 44, 47, 57, 72, 77, and 81 each apply process pools to a CPU-bound or
IPC-heavy workload).

</details>

**Q25 (co-25 -- futures-and-async-results).** What does a `Future` represent, concretely, at the moment
`submit()` returns?

<details>
<summary>Answer</summary>

A `Future` is a placeholder object standing in for a result that may not exist YET -- calling `.result()`
on it blocks until the underlying work actually completes (or re-raises whatever exception that work
raised), while the `Future` object itself can be inspected, have a callback attached with
`add_done_callback`, or be cancelled (only while genuinely still pending) without ever blocking (Example
24 submits and blocks on `.result()`; Example 26 attaches a completion callback; Examples 42-43 and 65
explore completion ordering, exception propagation, and cancellation).

</details>

**Q26 (co-26 -- async-await-and-the-event-loop).** What actually drives an `async def` coroutine forward
-- what makes it "run" at all?

<details>
<summary>Answer</summary>

A coroutine object by itself does nothing until something drives it. The `asyncio` EVENT LOOP repeatedly
resumes each scheduled coroutine from exactly where it last `await`ed, running everything on a SINGLE OS
thread by cooperatively switching between coroutines at each `await` point -- nothing runs "in the
background" independent of the loop actively servicing it (Example 27's first coroutine; Example 28's
`gather`; Examples 50-54, 66-69, 76, and 81 build up realistic concurrent-coroutine scenarios).

</details>

**Q27 (co-27 -- cooperative-vs-preemptive-scheduling).** Why can `await` be trusted to yield control, but
an OS thread scheduler cannot be trusted to leave a thread running until it explicitly yields?

<details>
<summary>Answer</summary>

`await` is a voluntary, explicit yield point that the coroutine's OWN code chooses -- control only passes
back to the event loop exactly there, nowhere else. OS thread preemption is involuntary: the scheduler can
interrupt a running thread at essentially any instruction boundary to give another thread a turn, which is
precisely why threaded code needs locks even around operations that "look" instantaneous, while a single
coroutine's code between two `await` points is guaranteed to run without another coroutine interleaving
into it (Example 54's blocking-call hazard shows what breaks when a coroutine forgets to actually yield;
Examples 55, 67, and 73 apply the cooperative model correctly).

</details>

**Q28 (co-28 -- parallel-decomposition-and-amdahls-law).** A program is measured as 80% parallelizable.
Does adding more and more cores eventually make it arbitrarily fast?

<details>
<summary>Answer</summary>

No -- Amdahl's Law caps the maximum possible speedup at `1 / (serial fraction)`, so with a 20% serial
portion, the theoretical CEILING is `1 / 0.2 = 5x`, no matter how many cores are thrown at the remaining
80%. The parallel portion can, in principle, be sped up arbitrarily as workers increase; the serial
portion is always paid in full, on every run, regardless of core count (Example 56 computes the ceiling
directly; Example 57's map-reduce decomposition and Example 75's phased barrier both respect this same
ceiling in practice).

</details>

**Q29 (co-29 -- reactive-streams-and-backpressure).** What specific problem does the Reactive Streams
spec's four-interface design (Publisher/Subscriber/Subscription/Processor) solve that a plain
callback-based push API does not?

<details>
<summary>Answer</summary>

A plain push API gives a slow subscriber no way to tell a fast publisher "slow down" -- values just arrive
as fast as the publisher produces them. The Reactive Streams spec adds `Subscription.request(n)`
specifically so a subscriber can bound how much a publisher is allowed to push at once, making non-blocking
backpressure a first-class, contractually-enforced part of the API rather than something bolted on
afterward with an ad-hoc buffer (Example 85 exercises reactive pull directly; Example 86 hand-rolls the
same four-interface contract the JDK adopted as `java.util.concurrent.Flow`).

</details>

**Q30 (co-30 -- observables-and-operators).** How is an `Observable` the "dual" of an `Iterable`, and what
does chaining operators like `map`/`filter` actually build?

<details>
<summary>Answer</summary>

An `Iterable` is PULLED -- its consumer actively calls `next()` to ask for the next value, on the
consumer's own schedule. An `Observable` is PUSHED -- its producer calls `onNext`/`onError`/`onCompleted`
on its subscriber whenever it has something, on the PRODUCER's own schedule, without ever being asked.
Chaining `map`/`filter` builds a NEW `Observable` that wraps the source, transforming or filtering each
pushed value before re-pushing it downstream, composing an entire transformation pipeline declaratively
(Example 82 builds and subscribes to exactly this kind of pipeline; Example 87's marble diagram visualizes
several chained operators over time).

</details>

**Q31 (co-31 -- hot-vs-cold-streams).** A subscriber attaches to an `Observable` several seconds "late."
Under what condition does it still see everything, and under what condition does it miss the earlier
items?

<details>
<summary>Answer</summary>

A COLD `Observable` only starts producing values once something subscribes to it, so a late subscriber
still gets the WHOLE sequence, replayed from the start on its own independent timeline. A HOT `Observable`
(backed by a `Subject`) emits on its own schedule regardless of whether anyone is subscribed, so a late
subscriber simply MISSES whatever already happened before it subscribed -- there is no replay (Example 83
runs both scenarios side by side against the identical sequence, so the difference is directly
observable).

</details>

**Q32 (co-32 -- backpressure-strategies).** Contrast a "buffer" backpressure strategy with reactive PULL
(`request(n)`) as two different answers to "producer is faster than consumer."

<details>
<summary>Answer</summary>

Buffer (or drop, or keep-latest, or error) are all REACTIVE fixes applied AFTER the mismatch already
exists -- the stream decides what to do with excess items once they've already been produced faster than
they're consumed. Reactive pull inverts the relationship at its root: the SUBSCRIBER states its own
current demand up front via `request(n)`, and the producer is contractually bound to emit no more than
that amount -- the mismatch is prevented at the source rather than patched after the fact (Example 84
hand-rolls buffer-all vs. keep-latest, since RxPY 4.1.0 ships no built-in backpressure operators; Example
85 shows the pull-based alternative).

</details>

**Q33 (co-33 -- reactive-manifesto-vs-frp).** Are "reactive programming" (Rx-style) and "Functional
Reactive Programming" (original FRP) the same idea under two names?

<details>
<summary>Answer</summary>

No. The Reactive Manifesto (responsive / resilient / elastic / message-driven) is an ARCHITECTURAL set of
system-design goals, not a programming model by itself, and Rx-style reactive streams model DISCRETE
events over time (a series of `onNext` calls). Original FRP (Elliott & Hudak, 1997) is a distinct, older
idea built on CONTINUOUS-time `behaviors` (values that conceptually exist at every instant) plus discrete
`events` -- genuinely different semantics that happen to share the word "reactive" (Example 87's marble
diagram is explicitly discrete-event, in the Rx sense, not continuous-time FRP).

</details>

## Applied problems

Twelve scenarios spanning beginner through reactive-streams material. Each describes a realistic
engineering situation without naming the specific concept -- decide what applies and why, then check your
reasoning against the worked solution. Every scenario below is invented for this drill and does not reuse
any function, fixture, or domain from the 87 worked examples.

**AP1.** A team wraps a CPU-bound image-resizing function in a `ThreadPoolExecutor(max_workers=8)`,
expecting roughly an 8x speedup on their 8-core machine. Measured speedup is barely 1.1x. Diagnose, and
name the fix.

<details>
<summary>Worked solution</summary>

Image resizing is CPU-bound work, and CPython's GIL (co-03) serializes Python bytecode execution across
threads regardless of thread count or core count -- 8 threads doing CPU-bound work still run one at a
time, with some added context-switch overhead, explaining the near-1x result. Because the workload is
CPU-bound rather than I/O-bound (co-05), the fix is `ProcessPoolExecutor` (co-24) instead of
`ThreadPoolExecutor` -- separate processes each get their own interpreter and their own GIL, genuinely
using multiple cores.

</details>

**AP2.** A checkout system decrements `inventory["widget"] -= 1` from multiple concurrent checkout
threads with no lock around it. Under real traffic, the system occasionally sells more items than were
ever in stock. Diagnose the exact mechanism, and name the minimal fix.

<details>
<summary>Answer</summary>

`inventory["widget"] -= 1` is a read-modify-write, not one atomic step (co-10) -- two threads can both
read the SAME pre-decrement value, both compute "one less," and both write back the same result, silently
losing one decrement (co-08, a classic race condition). The minimal fix is wrapping the decrement in a
`threading.Lock` (co-11) so the whole read-modify-write happens as one uninterruptible step.

</details>

**AP3.** A "billing" thread always locks `customer_record` then `warehouse_record`; a "shipping" thread
always locks `warehouse_record` then `customer_record`. Under load, the whole system occasionally freezes
entirely and never recovers on its own. Diagnose, and name the general-purpose fix (not "just don't run
them at the same time").

<details>
<summary>Answer</summary>

This is a deadlock (co-16): billing holds `customer_record` while waiting for `warehouse_record`, and
shipping holds `warehouse_record` while waiting for `customer_record` -- a circular wait, one of the four
Coffman conditions, and once both threads are in this state neither can ever proceed on its own. The
general-purpose fix is lock-ordering discipline (co-18): have BOTH code paths always acquire the two locks
in the SAME agreed-upon global order (e.g., always `customer_record` before `warehouse_record`), which
makes the circular-wait shape structurally impossible to construct.

</details>

**AP4.** An external-API rate limiter uses `threading.Semaphore(5)`. A bug in an exception-handling path
causes `release()` to fire twice for a single `acquire()` under certain error conditions. Months later,
monitoring shows more than 5 concurrent calls to the external API in flight at once, even though nobody
changed the `Semaphore(5)` line. What's the underlying issue, and what single-word swap would have caught
the double-release the moment it first happened?

<details>
<summary>Answer</summary>

A plain `Semaphore` (co-13) has no memory of how many permits it started with -- an extra `release()`
simply increments the internal counter past its intended ceiling with no error, silently growing the
effective concurrency limit over time as the bug keeps firing. Swapping `Semaphore` for `BoundedSemaphore`
(same interface, same co-13 concept) would have raised a `ValueError` on the very first accidental double
`release()`, surfacing the bug immediately instead of letting it quietly erode the rate limit.

</details>

**AP5.** A worker thread runs `while not ready: pass` (a tight busy-wait, no sleep, no lock, no
`Condition`) waiting for another thread to set `ready = True`. It has "worked fine" in every test run on
the engineer's laptop. A reviewer is still uncomfortable approving it. What's the actual risk, given that
it currently works, and what's the correct primitive to use instead?

<details>
<summary>Answer</summary>

CPython's GIL happens to make many such busy-wait flags "just work" as an implementation coincidence
(co-19) -- there is no LANGUAGE-level guarantee that one thread's write to `ready` is visible to another
thread's read at any particular time, so this code's correctness is riding on an unspecified
implementation detail, not a portable guarantee (and busy-waiting also burns a full CPU core doing
nothing useful the whole time it spins). The correct primitive is a `threading.Event` (co-15) or
`Condition` (co-14): both provide an explicit, guaranteed wake-up mechanism instead of relying on a
polling loop and an unwritten assumption about visibility.

</details>

**AP6.** A background thread appends items to a plain in-memory `list` acting as a hand-rolled queue,
while a separate consumer thread repeatedly calls `list.pop(0)` from the front, with no `queue.Queue` and
no lock anywhere. The app occasionally crashes with an `IndexError` from `pop(0)` racing against an
in-progress `append`. What's the general lesson, distinct from "just add a lock here"?

<details>
<summary>Answer</summary>

This is exactly the shared-mutable-state hazard (co-07) `queue.Queue` (co-21) exists to solve: a hand-rolled
list used as a cross-thread hand-off channel has NONE of the internal locking a real thread-safe queue
provides, so `append` and `pop(0)` can interleave unsafely, as this crash demonstrates. The deeper lesson
(co-20) is "communicate by sharing queues, not by sharing memory" -- reach for the stdlib's already-safe
`queue.Queue` for cross-thread hand-off instead of hand-rolling a shared mutable list and then bolting a
lock onto it after the fact.

</details>

**AP7.** Code fetches 50 URLs via `ThreadPoolExecutor`, calling `pool.submit(fetch, url)` in a loop for
each URL but never capturing or later inspecting any of the returned `Future` objects. Weeks later, the
team discovers one URL's fetch had been silently failing with a `ConnectionError` on every single run, and
nobody had ever noticed. What's the fix, and why does the original code hide the failure so completely?

<details>
<summary>Answer</summary>

A `Future` (co-25) stores whatever exception its worker raised, but that exception is only ever RE-RAISED
when something actually calls `.result()` on that specific `Future` -- if the `Future` is discarded
unread, the stored exception is simply never surfaced anywhere, silently swallowed. The fix is to keep a
reference to every submitted `Future` (a list works) and call `.result()` on each one (co-23), letting any
worker exception propagate to the caller where it can be logged, retried, or handled.

</details>

**AP8.** An `asyncio`-based scraping script defines `async def fetch_page(url)` that internally calls a
SYNCHRONOUS `requests.get(url)` (not an async HTTP client), and this coroutine is one of many passed to
`asyncio.gather(...)`. The team expected all fetches to overlap concurrently but observes them completing
one at a time, each taking the full network round-trip before the next even starts. Diagnose.

<details>
<summary>Answer</summary>

`requests.get(url)` is a genuinely BLOCKING call -- it never `await`s anything, so it never yields control
back to the event loop (co-27); the coroutine holds the single OS thread the whole loop runs on for the
entire duration of the network call. Every other coroutine `gather`ed alongside it is starved until it
finishes, which is why the fetches run sequentially instead of overlapping -- the fix is either an async
HTTP client (one that actually `await`s its I/O) or offloading the blocking call via `run_in_executor`/
`asyncio.to_thread` (co-26).

</details>

**AP9.** A CPU-bound `ProcessPoolExecutor` aggregation job measures 10s with 1 worker and 4.5s with 4
workers -- not the naively-expected ~2.5s from "4x more workers." A teammate says "the pool must be
broken; 4 workers should give something closer to 4x." Are they right?

<details>
<summary>Answer</summary>

Not necessarily -- Amdahl's Law (co-28) caps the maximum possible speedup at `1 / (serial fraction)` of
the workload, regardless of worker count. If, say, 25% of this job's work is inherently serial (some setup
or final combine step that can't be split across workers), the theoretical ceiling with ANY number of
workers is `1 / 0.25 = 4x`, and 10s / 4.5s ≈ 2.2x sitting below even that ceiling is plausibly explained
by real per-worker overhead on top of an already-capped theoretical maximum -- "the pool is broken" is one
possible explanation, but "the workload's own serial fraction already limits the ceiling" needs to be
ruled out first, by measuring that serial fraction directly, before assuming a pool bug.

</details>

**AP10.** A real-time dashboard subscribes to a `Subject`-based price-ticker `Observable` roughly 30
seconds after the application starts. The team is confused why the chart is missing the first 30 seconds
of ticks, even though the `Observable` never raised an error and the subscription itself succeeded
cleanly. Diagnose.

<details>
<summary>Answer</summary>

A `Subject` is a HOT `Observable` (co-31): it emits ticks on its own schedule the moment they're produced,
regardless of whether anyone is subscribed yet, and it does NOT replay past emissions to a late
subscriber. The dashboard genuinely subscribed successfully -- it simply missed the 30 seconds of ticks
that were emitted before its subscription existed, which is expected hot-stream behavior, not a bug; if
replay-from-start were the actual requirement, a COLD `Observable` (or a `ReplaySubject`-style variant)
would be the correct choice instead.

</details>

**AP11.** A team's custom streaming library pushes values to subscribers as fast as they're produced, with
no way for a subscriber to say "send me fewer per second." Slow subscribers occasionally run out of memory
buffering values they can't process fast enough. A junior engineer proposes "just make the internal buffer
bigger." Why is that not the same class of fix as adding Reactive-Streams-style `request(n)`?

<details>
<summary>Answer</summary>

A bigger buffer (co-32) is still a REACTIVE patch applied after the mismatch exists -- it delays the
out-of-memory failure but doesn't remove the root cause, since a sufficiently slow subscriber or
sufficiently long-running stream will eventually exhaust any fixed buffer size, however large. Reactive
pull (co-29, co-32) removes the mismatch at its SOURCE: the subscriber explicitly states its own current
demand via `request(n)`, and the producer is contractually bound never to exceed it, so no buffer of any
size is ever asked to hold more than the subscriber has already said it can handle.

</details>

**AP12.** An engineer says "our real-time trading dashboard's update stream and Functional Reactive
Programming (FRP) are basically the same thing, since both get called 'reactive.'" A senior reviewer
disagrees. What's the actual distinction being missed?

<details>
<summary>Answer</summary>

Sharing the word "reactive" doesn't mean sharing a semantic model (co-33): the dashboard's Rx-style update
stream models DISCRETE events over time (a series of individual pushed values, each an `onNext` call).
Original Functional Reactive Programming (Elliott & Hudak, 1997) is built on CONTINUOUS-time `behaviors`
-- values that conceptually exist and can be sampled at every instant, not just at discrete emission
points -- plus separate discrete `events`. The dashboard's stream is genuinely the former, not the latter;
conflating the two obscures a real semantic difference, not just a naming coincidence.

</details>

## Code katas

Ten hands-on repetition drills. Each is a before/after `.py` script colocated under `drilling/code/`.
Every "before" script is a real, runnable Python program that misapplies the concept being drilled -- run
it yourself, diagnose the bug from the observed behavior, fix it from memory, then compare your fix
against the "after" script and the model solution before checking your work against the
actually-executed output shown. Every kata script, both before and after, is fully type-annotated,
`pyright --strict` clean, and was run repeatedly during authoring (including the timing-sensitive ones) to
confirm the captured output is genuinely stable, not a one-off lucky run.

### Kata 1 -- race condition: a shared counter loses updates with no lock

_relates to co-08, co-10, co-11, Example 8, Example 11_

**Task.** `tally_visits(4)` should return exactly `4 * VISITS_PER_WORKER` -- every worker's every
increment counted. The version below is broken: each worker does an unsynchronized read-modify-write on
the SAME shared `stats["count"]`, so increments get lost under real interleaving.

**Before** (`drilling/code/kata-01-race-condition-lock-fix/before/kata.py`)

```python
"""Kata 1 (before): a shared page-visit counter loses updates with no lock."""

import threading
import time

VISITS_PER_WORKER = 3_000  # => high enough to reliably widen the race window every run


def record_visits(stats: dict[str, int]) -> None:
    for _ in range(VISITS_PER_WORKER):
        current = stats["count"]  # SMELL: read-modify-write with NO lock around it
        time.sleep(0)  # => yields the GIL right between the read and the write
        stats["count"] = current + 1  # BUG: writes back a possibly-stale `current`


def tally_visits(worker_count: int) -> int:
    stats: dict[str, int] = {"count": 0}
    workers = [threading.Thread(target=record_visits, args=(stats,)) for _ in range(worker_count)]
    for w in workers:
        w.start()  # => all workers now interleave reads/writes to stats["count"] with no coordination
    for w in workers:
        w.join()  # => blocks until every worker's record_visits() call returns
    return stats["count"]


expected = 4 * VISITS_PER_WORKER  # => what the total WOULD be if every increment were counted
actual = tally_visits(4)  # => what the total ACTUALLY is after the unsynchronized race
print(f"expected={expected} actual={actual}")
assert actual < expected  # => confirms at least one increment was lost to the unsynchronized race
print("kata OK (bug reproduced)")
```

**Observed (buggy) output** (captured by actually running the script above):

```text
expected=12000 actual=3007
kata OK (bug reproduced)
```

**After** (`drilling/code/kata-01-race-condition-lock-fix/after/kata.py`)

```python
"""Kata 1 (after): a threading.Lock makes the read-modify-write atomic -- no visit is ever lost."""

import threading

VISITS_PER_WORKER = 3_000  # => same workload as the before/ version, for a fair before/after comparison


def record_visits(stats: dict[str, int], guard: threading.Lock) -> None:
    for _ in range(VISITS_PER_WORKER):
        with guard:  # => acquires guard, runs the block, ALWAYS releases -- even if an exception fires
            stats["count"] += 1  # => the whole read-modify-write now happens as ONE atomic step


def tally_visits(worker_count: int) -> int:
    stats: dict[str, int] = {"count": 0}
    guard = threading.Lock()  # => one lock shared by every worker, protecting stats["count"]
    workers = [threading.Thread(target=record_visits, args=(stats, guard)) for _ in range(worker_count)]
    for w in workers:
        w.start()  # => workers now serialize on `guard` for each individual increment
    for w in workers:
        w.join()
    return stats["count"]


expected = 4 * VISITS_PER_WORKER
actual = tally_visits(4)
print(f"expected={expected} actual={actual}")
assert actual == expected  # => every increment survived -- the lock removed the lost-update window
print("kata OK (fix verified)")
```

<details>
<summary>Model solution</summary>

**Root cause**: `current = stats["count"]` followed by `stats["count"] = current + 1` is a
read-modify-write split across two lines with an explicit `time.sleep(0)` yield in between -- another
worker can read the SAME `current` value before the first worker writes its result back, so both workers'
increments collapse into one. Wrapping the entire read-modify-write in `with guard:` makes it a single
atomic step no other worker can interleave into.

**Run**: `python3 kata.py`

**Output** (this exact count varies slightly run to run because of scheduler timing, but `actual` is
always strictly less than `expected` in the before/ version, and always exactly equal in the after/
version):

```text
expected=12000 actual=12000
kata OK (fix verified)
```

</details>

### Kata 2 -- deadlock: two workers grab a printer and a scanner lock in opposite order

_relates to co-16, co-18, Example 29, Example 30_

**Task.** Two office workers each need BOTH a `printer` lock and a `scanner` lock to finish their task.
The version below is broken: one worker grabs `printer` then `scanner`; the other grabs `scanner` then
`printer` -- the opposite order -- and a `Barrier` forces both to hold their first lock before either
attempts the second, making the resulting deadlock happen on every single run.

**Before** (`drilling/code/kata-02-deadlock-lock-ordering/before/kata.py`)

```python
"""Kata 2 (before): two office workers grab a printer and a scanner lock in OPPOSITE order -- deadlock."""

import threading


def worker_prints_then_scans(printer: threading.Lock, scanner: threading.Lock, both_ready: threading.Barrier) -> None:
    with printer:  # => grabs printer FIRST
        both_ready.wait()  # => rendezvous: waits until the other worker ALSO holds its first lock
        with scanner:  # => wants scanner -- but the other worker already holds it (deadlock)
            pass  # => never reached if the deadlock occurs


def worker_scans_then_prints(printer: threading.Lock, scanner: threading.Lock, both_ready: threading.Barrier) -> None:
    with scanner:  # => grabs scanner FIRST -- the OPPOSITE order from worker_prints_then_scans
        both_ready.wait()  # => rendezvous: waits until the other worker ALSO holds its first lock
        with printer:  # => wants printer -- but the other worker already holds it (deadlock)
            pass  # => never reached if the deadlock occurs


def reproduce_deadlock() -> tuple[bool, bool]:  # => returns (worker_a_still_hung, worker_b_still_hung)
    printer = threading.Lock()  # => shared resource A
    scanner = threading.Lock()  # => shared resource B
    rendezvous = threading.Barrier(2)  # => forces BOTH workers to hold their first lock before either tries the second
    w_a = threading.Thread(target=worker_prints_then_scans, args=(printer, scanner, rendezvous), daemon=True)
    w_b = threading.Thread(target=worker_scans_then_prints, args=(printer, scanner, rendezvous), daemon=True)
    # => daemon=True: these threads may hang FOREVER -- daemon prevents them blocking process exit
    w_a.start()
    w_b.start()
    w_a.join(timeout=0.5)  # => bounded wait -- a genuine deadlock means this NEVER returns early
    w_b.join(timeout=0.5)  # => bounded wait -- same for worker_b
    return w_a.is_alive(), w_b.is_alive()  # => True, True means both are still stuck -- deadlocked


if __name__ == "__main__":
    a_hung, b_hung = reproduce_deadlock()
    print(f"a_hung={a_hung} b_hung={b_hung}")
    # => Each worker holds ONE lock the other needs, and neither can proceed until it gets the
    # => other's lock -- a textbook circular wait. The Barrier guarantees BOTH workers hold their
    # => first lock before either attempts the second, making the deadlock deterministic every run.
    assert a_hung is True  # => confirms worker_a never got past its second `with scanner:`
    assert b_hung is True  # => confirms worker_b never got past its second `with printer:`
    print("kata OK (bug reproduced)")
```

**Observed (buggy) output** (captured by actually running the script above):

```text
a_hung=True b_hung=True
kata OK (bug reproduced)
```

**After** (`drilling/code/kata-02-deadlock-lock-ordering/after/kata.py`)

```python
"""Kata 2 (after): a single GLOBAL lock-acquisition order breaks the circular wait -- no deadlock."""

import threading

# => Fix: BOTH workers now agree to always acquire `printer` before `scanner`, regardless of which
# => task they are performing -- this ONE global order makes a circular wait structurally impossible.
# => (No Barrier is needed here, unlike the before/ version: with a shared first lock, at most ONE
# => worker can ever be mid-acquisition at a time, so there is no "both hold their first lock
# => simultaneously" state left to force -- the fix removes the deadlock at the STRUCTURAL level,
# => not merely by winning a timing race.)


def worker_prints_then_scans(printer: threading.Lock, scanner: threading.Lock) -> None:
    with printer:  # => grabs printer FIRST, same as before
        with scanner:  # => grabs scanner second -- always reachable, printer is never held by scanner-first code
            pass


def worker_scans_then_prints(printer: threading.Lock, scanner: threading.Lock) -> None:
    with printer:  # => FIX: also grabs printer first -- the SAME global order as worker_prints_then_scans
        with scanner:  # => grabs scanner second, matching the agreed-upon order
            pass


def run_without_deadlock() -> tuple[bool, bool]:  # => returns (worker_a_still_hung, worker_b_still_hung)
    printer = threading.Lock()
    scanner = threading.Lock()
    w_a = threading.Thread(target=worker_prints_then_scans, args=(printer, scanner), daemon=True)
    w_b = threading.Thread(target=worker_scans_then_prints, args=(printer, scanner), daemon=True)
    w_a.start()
    w_b.start()
    w_a.join(timeout=0.5)  # => with the fix, both workers finish well inside this bound
    w_b.join(timeout=0.5)
    return w_a.is_alive(), w_b.is_alive()  # => False, False means both finished -- no deadlock


if __name__ == "__main__":
    a_hung, b_hung = run_without_deadlock()
    print(f"a_hung={a_hung} b_hung={b_hung}")
    # => Whichever worker grabs `printer` first simply runs to completion (grabs scanner, releases
    # => both) before the other worker's own `printer` acquisition can even succeed -- the circular
    # => wait Coffman condition can never arise once every path agrees on ONE lock-acquisition order.
    assert a_hung is False  # => confirms worker_a finished and released both locks
    assert b_hung is False  # => confirms worker_b finished and released both locks
    print("kata OK (fix verified)")
```

<details>
<summary>Model solution</summary>

**Root cause**: the two workers acquire `printer` and `scanner` in OPPOSITE orders, and the `Barrier`
forces both to hold their own first lock before either attempts the second -- a textbook circular wait,
one of the four Coffman conditions, reproduced deterministically every run. Making BOTH workers agree to
acquire `printer` before `scanner` removes the circular-wait shape entirely: with a shared first lock, only
one worker can ever be mid-acquisition at a time, so there is no longer a "both hold their first lock at
once" state for a cycle to form around -- which is also why the fix drops the `Barrier` rather than
keeping it: forcing that state is now structurally impossible, not merely unnecessary.

**Run**: `python3 kata.py`

**Output**:

```text
a_hung=False b_hung=False
kata OK (fix verified)
```

</details>

### Kata 3 -- semaphores: a plain Semaphore silently accepts an extra release()

_relates to co-13, Example 15, Example 16_

**Task.** A 2-connection pool should never let more than 2 callers hold a "connection" at once. The
version below is broken: an accidental extra `release()` call (e.g. from a buggy exception-handling path)
silently grows the pool's permit count past its real capacity, with no error raised anywhere.

**Before** (`drilling/code/kata-03-boundedsemaphore-over-release/before/kata.py`)

```python
"""Kata 3 (before): a plain Semaphore silently accepts an extra release() -- no bug is ever flagged."""

import threading

# => A pool of 2 database connections -- at most 2 callers should ever hold one at a time.
pool = threading.Semaphore(2)  # SMELL: a plain Semaphore, not a BoundedSemaphore


def borrow_connection() -> None:
    pool.acquire()  # => takes one permit -- count drops by 1


def return_connection() -> None:
    pool.release()  # => gives one permit back -- count rises by 1, with NO upper-bound check


borrow_connection()  # => count: 2 -> 1
return_connection()  # => count: 1 -> 2 (correct return)
return_connection()  # BUG: an accidental SECOND release() with no matching acquire() -- count: 2 -> 3
print("both extra release() calls succeeded with no error")

# => The pool's internal permit count is now 3, one MORE than the 2 real connections that exist --
# => a third, and even a fourth, caller can now acquire() a "connection" that was never actually
# => returned to the pool, silently exceeding the pool's real capacity.
first = pool.acquire(blocking=False)  # => succeeds -- count: 3 -> 2
second = pool.acquire(blocking=False)  # => succeeds -- count: 2 -> 1
third = pool.acquire(blocking=False)  # BUG: ALSO succeeds -- there should only be 2 real connections
print(f"first={first} second={second} third={third}")
assert third is True  # => confirms the pool over-granted a THIRD permit that should not exist
print("kata OK (bug reproduced)")
```

**Observed (buggy) output** (captured by actually running the script above):

```text
both extra release() calls succeeded with no error
first=True second=True third=True
kata OK (bug reproduced)
```

**After** (`drilling/code/kata-03-boundedsemaphore-over-release/after/kata.py`)

```python
"""Kata 3 (after): a BoundedSemaphore raises immediately on an extra release() -- the bug is caught."""

import threading

# => The SAME 2-connection pool, now using BoundedSemaphore -- FIX: it tracks the INITIAL count and
# => refuses any release() that would push the permit count above it.
pool = threading.BoundedSemaphore(2)


def borrow_connection() -> None:
    pool.acquire()


def return_connection() -> None:
    pool.release()


borrow_connection()  # => count: 2 -> 1
return_connection()  # => count: 1 -> 2 (correct return)
try:
    return_connection()  # => an accidental SECOND release() -- BoundedSemaphore refuses it
except ValueError as exc:
    print(f"blocked: {exc}")  # => Output: blocked: Semaphore released too many times
else:
    raise AssertionError("expected the extra release() to raise ValueError")

# => The pool's permit count is still correctly 2 -- exactly matching the 2 real connections.
first = pool.acquire(blocking=False)  # => succeeds -- count: 2 -> 1
second = pool.acquire(blocking=False)  # => succeeds -- count: 1 -> 0
third = pool.acquire(blocking=False)  # => correctly FAILS -- no third real connection exists
print(f"first={first} second={second} third={third}")
assert third is False  # => confirms the pool never over-grants beyond its real capacity
print("kata OK (fix verified)")
```

<details>
<summary>Model solution</summary>

**Root cause**: a plain `Semaphore` tracks only its CURRENT permit count, with no memory of the count it
started with -- an extra `release()` simply increments the counter with no upper bound, silently growing
the effective pool size. `BoundedSemaphore` (same interface, same underlying idea) remembers its INITIAL
count and raises `ValueError` the instant a `release()` would push the count above it, catching the bug
the moment it happens instead of letting it silently corrupt the pool's real capacity.

**Run**: `python3 kata.py`

**Output**:

```text
blocked: Semaphore released too many times
first=True second=True third=False
kata OK (fix verified)
```

</details>

### Kata 4 -- condition variables: an `if` guard proceeds on the first, partial notify

_relates to co-14, Example 19, Example 74_

**Task.** A baker should only start baking once BOTH the oven is preheated AND the dough is ready. The
version below is broken: it checks the predicate with `if`, so an early notify (signaling only that the
oven is ready) wakes the baker prematurely, and the `if` never re-checks before proceeding.

**Before** (`drilling/code/kata-04-condition-spurious-wakeup/before/kata.py`)

```python
"""Kata 4 (before): an `if` guard proceeds on the FIRST notify, even before the real predicate is true."""

import threading
import time

state = {"oven_preheated": False, "dough_ready": False}
cond = threading.Condition()


def baker_waits_for_both(log: list[str]) -> None:
    with cond:
        if not (state["oven_preheated"] and state["dough_ready"]):  # SMELL: `if`, checked only ONCE
            cond.wait()  # => wakes on ANY notify_all(), not specifically "both conditions are true"
        # BUG: proceeds here even if only ONE of the two conditions actually became true
        log.append(f"baking: oven={state['oven_preheated']} dough={state['dough_ready']}")


def controller_signals_progress() -> None:
    with cond:
        state["oven_preheated"] = True  # => only the OVEN is ready so far -- dough is NOT
        cond.notify_all()  # => wakes the waiter EARLY, before the real predicate holds


log: list[str] = []
waiter = threading.Thread(target=baker_waits_for_both, args=(log,))
waiter.start()
time.sleep(0.05)  # => gives the waiter time to reach cond.wait() before the controller signals
controller_signals_progress()  # => a legitimate partial-progress notify -- NOT the full predicate
waiter.join(timeout=1.0)
print(log)
assert log == ["baking: oven=True dough=False"]  # => confirms the baker started with the dough NOT ready
print("kata OK (bug reproduced)")
```

**Observed (buggy) output** (captured by actually running the script above):

```text
['baking: oven=True dough=False']
kata OK (bug reproduced)
```

**After** (`drilling/code/kata-04-condition-spurious-wakeup/after/kata.py`)

```python
"""Kata 4 (after): a `while` guard keeps waiting until BOTH conditions are actually true."""

import threading
import time

state = {"oven_preheated": False, "dough_ready": False}
cond = threading.Condition()


def baker_waits_for_both(log: list[str]) -> None:
    with cond:
        while not (state["oven_preheated"] and state["dough_ready"]):  # FIX: `while`, RE-checked on every wake
            cond.wait()  # => on an early/partial notify, the predicate is still False, so it waits AGAIN
        log.append(f"baking: oven={state['oven_preheated']} dough={state['dough_ready']}")


def controller_signals_progress() -> None:
    with cond:
        state["oven_preheated"] = True  # => step 1: only the oven becomes ready
        cond.notify_all()  # => an early notify -- the `while` guard correctly ignores it and re-waits
    time.sleep(0.05)  # => gives the baker time to re-check and go back to cond.wait()
    with cond:
        state["dough_ready"] = True  # => step 2: NOW the real predicate becomes true
        cond.notify_all()  # => this notify actually satisfies the `while` condition


log: list[str] = []
waiter = threading.Thread(target=baker_waits_for_both, args=(log,))
waiter.start()
time.sleep(0.05)  # => gives the waiter time to reach cond.wait() before the controller signals
controller_signals_progress()
waiter.join(timeout=1.0)
print(log)
assert log == ["baking: oven=True dough=True"]  # => confirms baking only started once BOTH were ready
print("kata OK (fix verified)")
```

<details>
<summary>Model solution</summary>

**Root cause**: `cond.wait()` returns on ANY `notify`/`notify_all()` call -- it makes no promise that the
FULL predicate the waiter actually cares about is now true, only that SOMETHING changed. Checking the
predicate with `if` (once) instead of `while` (re-checked every time `wait()` returns) lets the waiter
proceed on a partial, early notify. Swapping to `while` makes the waiter go straight back to `cond.wait()`
whenever it wakes up and the real predicate still isn't satisfied.

**Run**: `python3 kata.py`

**Output**:

```text
['baking: oven=True dough=True']
kata OK (fix verified)
```

</details>

### Kata 5 -- thread pools: a worker's exception is silently swallowed with no `.result()` call

_relates to co-23, co-25, Example 24, Example 43_

**Task.** A submitted job that raises should have its exception surfaced to the caller, not disappear
silently. The version below is broken: it submits a job that will raise `ValueError`, but never calls
`.result()` on the returned `Future`, so the exception is stored and discarded when the pool shuts down.

**Before** (`drilling/code/kata-05-threadpool-exception-swallowed/before/kata.py`)

```python
"""Kata 5 (before): a worker's exception is silently swallowed because .result() is never called."""

from concurrent.futures import ThreadPoolExecutor


def parse_amount(raw: str) -> float:
    return float(raw)  # BUG-ADJACENT: raises ValueError on "n/a" -- nothing here catches it


with ThreadPoolExecutor(max_workers=2) as pool:
    future = pool.submit(parse_amount, "n/a")  # SMELL: the future is submitted but never inspected
    print("submitted the parse job")
    # BUG: the function body never calls future.result(), so the ValueError raised inside
    # parse_amount() is stored on the Future object and silently DISCARDED when the pool shuts down.
print("pool closed -- did anything go wrong? no exception was ever raised here")
print("kata OK (bug reproduced: the ValueError never surfaced anywhere)")
```

**Observed (buggy) output** (captured by actually running the script above):

```text
submitted the parse job
pool closed -- did anything go wrong? no exception was ever raised here
kata OK (bug reproduced: the ValueError never surfaced anywhere)
```

**After** (`drilling/code/kata-05-threadpool-exception-swallowed/after/kata.py`)

```python
"""Kata 5 (after): calling .result() RE-RAISES the worker's stored exception -- nothing is lost."""

from concurrent.futures import ThreadPoolExecutor


def parse_amount(raw: str) -> float:
    return float(raw)  # still raises ValueError on "n/a" -- that part of the bug is unrelated to the fix


with ThreadPoolExecutor(max_workers=2) as pool:
    future = pool.submit(parse_amount, "n/a")
    print("submitted the parse job")
    try:
        future.result()  # FIX: .result() re-raises whatever the worker itself raised
    except ValueError as exc:
        print(f"caught: {exc}")  # => Output: caught: could not convert string to float: 'n/a'
    else:
        raise AssertionError("expected future.result() to re-raise ValueError")
print("kata OK (fix verified: the ValueError was caught exactly where the caller expects it)")
```

<details>
<summary>Model solution</summary>

**Root cause**: a `Future`'s stored exception is only ever raised at the moment something calls
`.result()` on THAT specific `Future` -- if nothing ever does, the exception simply never surfaces
anywhere, no matter how the pool itself is shut down. Capturing the `Future` and calling `.result()`
(inside a `try`/`except` when a failure is expected/handled) is the only way to actually observe a worker's
exception.

**Run**: `python3 kata.py`

**Output**:

```text
submitted the parse job
caught: could not convert string to float: 'n/a'
kata OK (fix verified: the ValueError was caught exactly where the caller expects it)
```

</details>

### Kata 6 -- asyncio: a blocking `time.sleep()` inside a coroutine freezes the entire event loop

_relates to co-26, co-27, Example 54, Example 55_

**Task.** Two coroutines, one long-running and one short, are `gather`ed together and should overlap so
the short one finishes first. The version below is broken: the long-running coroutine uses a BLOCKING
`time.sleep()` instead of `await asyncio.sleep()`, so it never yields, starving the short coroutine
entirely.

**Before** (`drilling/code/kata-06-blocking-sleep-freezes-event-loop/before/kata.py`)

```python
"""Kata 6 (before): a blocking time.sleep() inside one coroutine freezes the ENTIRE event loop."""

import asyncio
import time


async def slow_report(log: list[str]) -> None:
    log.append("report: started")
    time.sleep(0.3)  # SMELL: BLOCKING sleep -- holds the entire OS thread, not just this coroutine
    log.append("report: finished")


async def quick_ping(log: list[str]) -> None:
    log.append("ping: started")
    await asyncio.sleep(0.05)  # => a genuinely cooperative sleep -- SHOULD finish long before the report
    log.append("ping: finished")


async def main() -> list[str]:
    log: list[str] = []
    await asyncio.gather(slow_report(log), quick_ping(log))  # => scheduled to run "concurrently"
    return log


result = asyncio.run(main())
print(result)
# BUG: slow_report() never hits an `await` between its two log lines, so once its task starts
# running it holds the ONE OS thread the event loop runs on for the FULL 0.3s -- quick_ping()'s
# task cannot even START until slow_report() finishes completely, even though quick_ping() only
# needs 0.05s. "ping: started" ends up AFTER "report: finished", not overlapped as intended.
assert result == ["report: started", "report: finished", "ping: started", "ping: finished"]
print("kata OK (bug reproduced: the faster coroutine never got a chance to overlap)")
```

**Observed (buggy) output** (captured by actually running the script above):

```text
['report: started', 'report: finished', 'ping: started', 'ping: finished']
kata OK (bug reproduced: the faster coroutine never got a chance to overlap)
```

**After** (`drilling/code/kata-06-blocking-sleep-freezes-event-loop/after/kata.py`)

```python
"""Kata 6 (after): asyncio.sleep() yields control -- the quick coroutine now overlaps and finishes first."""

import asyncio


async def slow_report(log: list[str]) -> None:
    log.append("report: started")
    await asyncio.sleep(0.3)  # FIX: a COOPERATIVE sleep -- suspends only THIS coroutine
    log.append("report: finished")


async def quick_ping(log: list[str]) -> None:
    log.append("ping: started")
    await asyncio.sleep(0.05)  # => the event loop is free to run this while slow_report is suspended
    log.append("ping: finished")


async def main() -> list[str]:
    log: list[str] = []
    await asyncio.gather(slow_report(log), quick_ping(log))
    return log


result = asyncio.run(main())
print(result)
# FIX: both coroutines start immediately (neither blocks the OS thread), and since quick_ping's
# 0.05s await is far shorter than slow_report's 0.3s await, quick_ping finishes FIRST -- true
# cooperative overlap, exactly what asyncio.gather is supposed to provide.
assert result == ["report: started", "ping: started", "ping: finished", "report: finished"]
print("kata OK (fix verified: the faster coroutine finished first, as intended)")
```

<details>
<summary>Model solution</summary>

**Root cause**: `time.sleep()` is a real, OS-level blocking call -- it does not `await` anything, so the
coroutine running it never yields control back to the event loop, and the loop's single OS thread is
unavailable to run ANY other coroutine for the whole duration. `await asyncio.sleep()` is the cooperative
equivalent: it suspends only the calling coroutine and returns the OS thread to the event loop, which is
then free to run `quick_ping` in the meantime.

**Run**: `python3 kata.py`

**Output**:

```text
['report: started', 'ping: started', 'ping: finished', 'report: finished']
kata OK (fix verified: the faster coroutine finished first, as intended)
```

</details>

### Kata 7 -- queues: forgetting task_done() makes Queue.join() hang forever

_relates to co-21, co-22, Example 20, Example 40_

**Task.** After a consumer drains every item from a `queue.Queue`, `q.join()` should return promptly.
The version below is broken: the consumer pulls every item with `get_nowait()` but never calls
`task_done()`, so the queue's internal "unfinished tasks" counter never reaches zero and `join()` blocks
forever.

**Before** (`drilling/code/kata-07-queue-join-missing-task-done/before/kata.py`)

```python
"""Kata 7 (before): draining a Queue without calling task_done() makes Queue.join() hang FOREVER."""

import queue
import threading


def drain_without_marking_done(q: "queue.Queue[int]") -> None:
    while True:
        try:
            q.get_nowait()  # => pulls each item out of the queue...
            # BUG: ...but never calls q.task_done() -- the queue's internal "unfinished tasks"
            # counter is never decremented, even though every item has genuinely been consumed.
        except queue.Empty:
            break


def demonstrate_hang() -> bool:  # => returns True if Queue.join() is STILL blocked after a bounded wait
    q: "queue.Queue[int]" = queue.Queue()
    for i in range(5):
        q.put(i)  # => unfinished_tasks: 0 -> 5
    drain_without_marking_done(q)  # => all 5 items are physically gone, but unfinished_tasks is STILL 5
    joiner = threading.Thread(target=q.join, daemon=True)  # => queue.Queue.join() has NO timeout parameter --
    joiner.start()  # => run it on a daemon thread so a genuine hang can't block this script forever
    joiner.join(timeout=0.5)  # => bounded wait ON the wrapper thread, not on q.join() itself
    return joiner.is_alive()  # => True means q.join() never returned -- still hung


if __name__ == "__main__":
    hung = demonstrate_hang()
    print(f"hung={hung}")
    # => q.join() blocks until unfinished_tasks reaches 0, which only happens via task_done() calls
    # => matching every put() -- draining items with get_nowait() alone never touches that counter.
    assert hung is True  # => confirms q.join() is still blocked, even though the queue is empty
    print("kata OK (bug reproduced)")
```

**Observed (buggy) output** (captured by actually running the script above):

```text
hung=True
kata OK (bug reproduced)
```

**After** (`drilling/code/kata-07-queue-join-missing-task-done/after/kata.py`)

```python
"""Kata 7 (after): calling task_done() for every item makes Queue.join() return promptly."""

import queue
import threading


def drain_and_mark_done(q: "queue.Queue[int]") -> None:
    while True:
        try:
            q.get_nowait()
            q.task_done()  # FIX: decrements unfinished_tasks -- matches this get_nowait() to its put()
        except queue.Empty:
            break


def demonstrate_no_hang() -> bool:  # => returns True if Queue.join() is STILL blocked after a bounded wait
    q: "queue.Queue[int]" = queue.Queue()
    for i in range(5):
        q.put(i)  # => unfinished_tasks: 0 -> 5
    drain_and_mark_done(q)  # => unfinished_tasks correctly reaches 0 -- 5 task_done() calls, one per put()
    joiner = threading.Thread(target=q.join, daemon=True)
    joiner.start()
    joiner.join(timeout=0.5)  # => with the fix, this returns well inside the 0.5s bound
    return joiner.is_alive()  # => False means q.join() already returned -- no hang


if __name__ == "__main__":
    hung = demonstrate_no_hang()
    print(f"hung={hung}")
    # => Every get_nowait() is now paired with a task_done(), so unfinished_tasks correctly reaches 0
    # => and the underlying `Condition` inside Queue wakes up any thread blocked in join().
    assert hung is False  # => confirms q.join() returned promptly once every item was marked done
    print("kata OK (fix verified)")
```

<details>
<summary>Model solution</summary>

**Root cause**: `queue.Queue` tracks an internal "unfinished tasks" counter, incremented once per `put()`
and decremented only by a matching `task_done()` -- `join()` blocks until that counter reaches zero.
Draining items with `get_nowait()` removes them from the queue's internal deque but never touches that
counter, so `join()` waits forever even though the queue is genuinely empty. The kata demonstrates the
hang safely by running `q.join()` on a `daemon=True` wrapper thread and applying `join(timeout=...)` to
THAT wrapper thread instead (since `Queue.join()` itself accepts no timeout), the same bounded-detection
trick used to reproduce Kata 2's deadlock without hanging the drill itself.

**Run**: `python3 kata.py`

**Output**:

```text
hung=False
kata OK (fix verified)
```

</details>

### Kata 8 -- multiprocessing: a global mutated in a child process never reaches the parent

_relates to co-02, co-20, Example 45, Example 46_

**Task.** A module-level counter "bumped" inside a child process should be visible to the parent once the
child exits, if the parent is reading the truly shared value. The version below is broken: it uses a plain
module-level `int`, which is silently copied (not shared) into the child process's own address space.

**Before** (`drilling/code/kata-08-child-process-global-mutation-invisible/before/kata.py`)

```python
"""Kata 8 (before): a plain module-level counter, "mutated" in a child PROCESS, never changes for the parent."""

from __future__ import annotations

import multiprocessing as mp

counter = 0  # SMELL: an ordinary module-level int -- NOT a multiprocessing-aware shared value


def bump_in_child() -> None:
    global counter
    counter += 1  # BUG: mutates the CHILD process's own PRIVATE copy of `counter`, not the parent's
    print(f"inside child: counter={counter}")  # => Output (from the child): inside child: counter=1


if __name__ == "__main__":
    print(f"before: counter={counter}")  # => Output: before: counter=0
    p = mp.Process(target=bump_in_child)
    p.start()  # => forks/spawns a whole SEPARATE process, with its OWN copy of every global variable
    p.join()  # => waits for the child process to fully exit
    print(f"after: counter={counter}")  # BUG: still counter=0 in the PARENT -- the child's write never crossed over
    # => Each process has its own address space -- there is no shared memory here at all, so a plain
    # => module-level int can only ever be "mutated" inside whichever process runs that line.
    assert counter == 0  # => confirms the parent's own copy of `counter` was never touched
    print("kata OK (bug reproduced)")
```

**Observed (buggy) output** (captured by actually running the script above):

```text
before: counter=0
inside child: counter=1
after: counter=0
kata OK (bug reproduced)
```

**After** (`drilling/code/kata-08-child-process-global-mutation-invisible/after/kata.py`)

```python
"""Kata 8 (after): multiprocessing.Value is genuinely SHARED across the process boundary."""

from __future__ import annotations

import multiprocessing as mp
from multiprocessing.sharedctypes import Synchronized


def bump_in_child(shared_counter: "Synchronized[int]") -> None:
    with shared_counter.get_lock():  # FIX: the built-in lock makes the read-modify-write atomic too
        shared_counter.value += 1  # => mutates SHARED memory, backed by the OS, visible to BOTH processes
    print(f"inside child: counter={shared_counter.value}")  # => Output (from the child): inside child: counter=1


if __name__ == "__main__":
    shared_counter = mp.Value("i", 0)  # FIX: an actual shared-memory int, not a plain module global
    print(f"before: counter={shared_counter.value}")  # => Output: before: counter=0
    p = mp.Process(target=bump_in_child, args=(shared_counter,))
    p.start()
    p.join()
    print(f"after: counter={shared_counter.value}")  # => now correctly reflects the child's own update
    assert shared_counter.value == 1  # => confirms the parent NOW sees the child process's mutation
    print("kata OK (fix verified)")
```

<details>
<summary>Model solution</summary>

**Root cause**: `multiprocessing.Process` runs the child in a genuinely SEPARATE address space -- every
module-level variable the child process sees is its OWN private copy (created at process start), not a
reference into the parent's memory, so mutating it inside the child has no way to reach the parent at all.
`multiprocessing.Value("i", 0)` allocates the integer in OS-backed SHARED memory instead, so both the
parent and every child process that receives the same `Value` object are genuinely reading and writing the
SAME underlying memory -- and `get_lock()` protects the read-modify-write the same way a `threading.Lock`
would within one process.

**Run**: `python3 kata.py`

**Output**:

```text
before: counter=0
inside child: counter=1
after: counter=1
kata OK (fix verified)
```

</details>

### Kata 9 -- futures: cancel() silently fails on an ALREADY-RUNNING Future

_relates to co-25, Example 24, Example 65_

**Task.** Calling `.cancel()` on a `Future` should only be trusted once its return value is actually
checked. The version below is broken: it calls `.cancel()` on a `Future` that has ALREADY started running
and assumes it worked, with no check of the (correctly `False`) return value.

**Before** (`drilling/code/kata-09-future-cancel-pending-vs-running/before/kata.py`)

```python
"""Kata 9 (before): calling cancel() on an ALREADY-RUNNING Future silently fails -- the caller never notices."""

import threading
import time
from concurrent.futures import ThreadPoolExecutor, Future


def slow_job(started: threading.Event) -> str:
    started.set()  # => signals the main thread that this job has genuinely started running
    time.sleep(0.2)  # => simulates real work in progress -- NOT cancellable mid-flight by Future.cancel()
    return "done"


started = threading.Event()
with ThreadPoolExecutor(max_workers=1) as pool:  # => max_workers=1 -- the job starts running IMMEDIATELY
    future: Future[str] = pool.submit(slow_job, started)
    started.wait(timeout=1.0)  # => blocks until slow_job() has ACTUALLY started (not just been submitted)
    # SMELL: cancel() is called with no check of its return value, assuming it always "worked"
    cancelled = future.cancel()  # BUG: a RUNNING future cannot be cancelled -- this returns False
    print(f"cancelled={cancelled}")
    result = future.result()  # => the job runs to completion regardless -- "done", not a CancelledError
    print(f"result={result}")

assert cancelled is False  # => confirms cancel() silently failed on an already-running future
assert result == "done"  # => confirms the job ran to completion anyway, unaffected by the cancel() call
print("kata OK (bug reproduced)")
```

**Observed (buggy) output** (captured by actually running the script above):

```text
cancelled=False
result=done
kata OK (bug reproduced)
```

**After** (`drilling/code/kata-09-future-cancel-pending-vs-running/after/kata.py`)

```python
"""Kata 9 (after): cancel() a genuinely PENDING (not-yet-started) Future -- and always check the return value."""

import threading
import time
from concurrent.futures import ThreadPoolExecutor, Future


def slow_job(started: threading.Event) -> str:
    started.set()
    time.sleep(0.2)
    return "done"


def queued_job() -> str:
    return "should never run"  # => only reachable if the cancel() below fails


started = threading.Event()
with ThreadPoolExecutor(max_workers=1) as pool:  # => FIX: only ONE worker -- job_a occupies it immediately
    job_a: Future[str] = pool.submit(slow_job, started)  # => starts running right away, occupying the sole worker
    started.wait(timeout=1.0)  # => confirms job_a has genuinely started
    job_b: Future[str] = pool.submit(queued_job)  # FIX: job_b is now genuinely PENDING -- the worker is busy
    cancelled = job_b.cancel()  # => job_b never started, so cancel() succeeds
    print(f"cancelled={cancelled}")
    if not cancelled:  # FIX: the caller now actually CHECKS the return value, instead of assuming success
        job_b.result()  # => only reached if cancellation genuinely failed
    job_a.result()  # => job_a still runs to completion -- it was never a cancellation candidate

assert cancelled is True  # => confirms job_b, still pending, was successfully cancelled
assert job_b.cancelled() is True  # => the Future itself confirms its own cancelled state
print("kata OK (fix verified)")
```

<details>
<summary>Model solution</summary>

**Root cause**: `Future.cancel()` can only succeed on a `Future` that is still PENDING -- once a worker has
actually started executing it, `cancel()` has nothing left to prevent, so it correctly returns `False`
without raising anything, which is exactly why the "before" version's unchecked assumption is dangerous.
The fix has two parts: structurally, arrange for the `Future` being cancelled to genuinely still be
pending (here, by using `max_workers=1` so a second submitted job is forced to queue behind the first);
and defensively, always check `cancel()`'s boolean return value rather than assuming success.

**Run**: `python3 kata.py`

**Output**:

```text
cancelled=True
kata OK (fix verified)
```

</details>

### Kata 10 -- shared state: one dict lets a fast worker's write bleed into a slow worker's read

_relates to co-07, co-19, Example 8, Example 64_

**Task.** Each worker's "current request ID" should stay private to that worker. The version below is
broken: a single shared `dict` stands in for "the current request," so a fast worker's write can silently
overwrite a slow worker's value before the slow worker ever reads it back.

**Before** (`drilling/code/kata-10-thread-local-state-bleed/before/kata.py`)

```python
"""Kata 10 (before): a single shared dict lets one worker's "current request" bleed into another's."""

import threading
import time

request_context: dict[str, str] = {}  # SMELL: ONE shared dict for "the current request", used by every thread


def handle_request(worker_name: str, request_id: str, delay_before_read: float, observed: dict[str, str]) -> None:
    request_context["request_id"] = request_id  # BUG: overwrites the SAME shared key every worker touches
    time.sleep(delay_before_read)  # => simulates request-handling work happening before the read below
    observed[worker_name] = request_context["request_id"]  # => reads back whatever is CURRENTLY there


observed: dict[str, str] = {}
# => worker_slow sets its ID, THEN sleeps -- worker_fast sets ITS OWN id and finishes reading first,
# => overwriting the shared key while worker_slow is still asleep, before worker_slow ever reads back.
worker_slow = threading.Thread(target=handle_request, args=("worker_slow", "REQ-A", 0.15, observed))
worker_fast = threading.Thread(target=handle_request, args=("worker_fast", "REQ-B", 0.0, observed))
worker_slow.start()
time.sleep(0.02)  # => lets worker_slow set REQ-A into the shared dict before worker_fast starts
worker_fast.start()
worker_slow.join()
worker_fast.join()
print(observed)
# => worker_slow ASKED for "REQ-A" but, because worker_fast overwrote the ONE shared key while
# => worker_slow was still asleep, worker_slow's own read-back sees "REQ-B" instead -- state bled
# => across threads through the single shared dict.
assert observed["worker_slow"] == "REQ-B"  # => confirms the WRONG, bled-over value was observed
assert observed["worker_fast"] == "REQ-B"  # => worker_fast correctly sees its own id
print("kata OK (bug reproduced)")
```

**Observed (buggy) output** (captured by actually running the script above):

```text
{'worker_fast': 'REQ-B', 'worker_slow': 'REQ-B'}
kata OK (bug reproduced)
```

**After** (`drilling/code/kata-10-thread-local-state-bleed/after/kata.py`)

```python
"""Kata 10 (after): local() from threading gives each thread its OWN private "current request" slot."""

import threading
import time
from threading import local

request_context = local()  # FIX: each thread gets its own independent attribute namespace


def handle_request(worker_name: str, request_id: str, delay_before_read: float, observed: dict[str, str]) -> None:
    request_context.request_id = request_id  # => sets THIS thread's own slot -- other threads are untouched
    time.sleep(delay_before_read)
    observed[worker_name] = request_context.request_id  # => always reads back THIS thread's own value


observed: dict[str, str] = {}
worker_slow = threading.Thread(target=handle_request, args=("worker_slow", "REQ-A", 0.15, observed))
worker_fast = threading.Thread(target=handle_request, args=("worker_fast", "REQ-B", 0.0, observed))
worker_slow.start()
time.sleep(0.02)  # => same choreography as the before/ version, on purpose -- the FIX is in the data, not the timing
worker_fast.start()
worker_slow.join()
worker_fast.join()
print(observed)
# => Even though worker_fast runs and finishes entirely while worker_slow is still asleep,
# => `request_context` is a SEPARATE namespace per thread -- worker_fast's write to its own slot
# => cannot possibly touch worker_slow's slot, no matter how the two threads interleave.
assert observed["worker_slow"] == "REQ-A"  # => correctly sees its OWN id, unaffected by worker_fast
assert observed["worker_fast"] == "REQ-B"  # => correctly sees its own id too
print("kata OK (fix verified)")
```

<details>
<summary>Model solution</summary>

**Root cause**: a single module-level `dict` used as "the current request" has exactly ONE `request_id`
key, shared by every thread that touches it -- whichever thread writes LAST wins, regardless of which
thread "logically" owns that write, so a fast worker's write can silently clobber a slow worker's value
before the slow worker ever reads it back. `local()` from `threading` gives each thread its OWN, separate
attribute namespace under the hood -- `request_context.request_id` resolves to a DIFFERENT underlying
storage location per thread, so no thread's write can ever be visible to, or overwritten by, another
thread's write to "the same-looking" attribute.

**Run**: `python3 kata.py`

**Output**:

```text
{'worker_fast': 'REQ-B', 'worker_slow': 'REQ-A'}
kata OK (fix verified)
```

</details>

## Self-check checklist

Confirm each item without checking the learning track first. If you hesitate, that concept needs another
pass.

**Foundations: concurrency, parallelism, processes, threads, the GIL**

- [ ] I can explain the difference between concurrency (interleaving) and parallelism (simultaneous
      execution on multiple cores), and give an example of each. (co-01)
- [ ] I can explain why threads are cheaper to spawn than processes but also more dangerous, in terms of
      address-space sharing. (co-02)
- [ ] I can explain why 4 threads doing CPU-bound work on standard CPython barely beat 1 thread, citing
      the GIL specifically. (co-03)
- [ ] I can state which Python version officially supports a no-GIL build, and name the two PEPs involved.
      (co-04)
- [ ] I can classify a given workload as I/O-bound or CPU-bound and pick threads/asyncio vs. processes
      accordingly. (co-05)

**Thread basics: creation, races, atomicity, locks, semaphores, conditions, events**

- [ ] I can explain the difference between `start()` and `join()` on a `Thread`. (co-06)
- [ ] I can identify shared mutable state as the root cause underlying nearly every bug in this topic.
      (co-07)
- [ ] I can define a race condition precisely: output depends on nondeterministic interleaving. (co-08)
- [ ] I can distinguish a data race (unsynchronized memory access) from the broader race-condition
      category, and give an example of a race condition WITHOUT a data race. (co-09)
- [ ] I can explain why `x += 1` is three separate steps, not one atomic operation. (co-10)
- [ ] I can wrap a critical section in a `threading.Lock` and explain the mutual-exclusion guarantee it
      provides. (co-11)
- [ ] I can explain why a plain `Lock` self-deadlocks on re-acquisition by the same thread, and how
      `RLock` avoids it. (co-12)
- [ ] I can use a `Semaphore(N)` to cap concurrent access to a pool of N resources. (co-13)
- [ ] I can use a `Condition` to wait for a predicate and wake other threads with `notify`/`notify_all`.
      (co-14)
- [ ] I can distinguish `Event` (one-shot broadcast) from `Barrier` (fixed-N rendezvous) by their intent.
      (co-15)

**Deadlock, livelock, starvation, visibility**

- [ ] I can name the four Coffman conditions and identify which one a given fix removes. (co-16)
- [ ] I can distinguish deadlock (blocked, no progress), livelock (active, no progress), and starvation
      (one thread perpetually denied) from each other. (co-17)
- [ ] I can apply a global lock-acquisition order to prevent a circular-wait deadlock. (co-18)
- [ ] I can explain why an unsynchronized flag "working" on CPython today doesn't make it a portable
      guarantee. (co-19)

**Message passing, queues, pools, futures**

- [ ] I can explain "communicate by sharing queues, not by sharing memory" and what problem it removes.
      (co-20)
- [ ] I can explain what internal locking `queue.Queue` already provides, with no external lock needed.
      (co-21)
- [ ] I can explain why a BOUNDED buffer applies backpressure that an unbounded one doesn't. (co-22)
- [ ] I can reach for `ThreadPoolExecutor` instead of manually managing individual `Thread` objects. (co-23)
- [ ] I can reach for `ProcessPoolExecutor` instead of `ThreadPoolExecutor` for CPU-bound work. (co-24)
- [ ] I can call `.result()` on a `Future` and explain what happens if the underlying work raised.
      (co-25)

**Async/await and cooperative scheduling**

- [ ] I can explain what actually drives an `async def` coroutine forward (the event loop resuming it at
      each `await`). (co-26)
- [ ] I can explain why `await` is a trustworthy voluntary yield point but OS thread preemption is not.
      (co-27)

**Parallel decomposition**

- [ ] I can compute Amdahl's Law's theoretical speedup ceiling given a workload's serial fraction. (co-28)

**Reactive streams**

- [ ] I can explain what `Subscription.request(n)` adds over a plain callback-based push API. (co-29)
- [ ] I can explain why an `Observable` is described as the "dual" of an `Iterable` (push vs. pull).
      (co-30)
- [ ] I can predict whether a late subscriber to a given `Observable` sees the full sequence or misses
      earlier items, based on hot vs. cold. (co-31)
- [ ] I can contrast a reactive (buffer/drop/latest) backpressure strategy with reactive pull
      (`request(n)`) as prevention vs. patching. (co-32)
- [ ] I can explain why Rx-style reactive streams and original Functional Reactive Programming are
      distinct models despite sharing the word "reactive." (co-33)

## Elaborative interrogation & self-explanation

Eight why/why-not prompts. Answer in your own words before checking -- the goal is explaining the
reasoning, not reciting a definition.

**W1.** Why does this topic insist "don't share mutable state; when you must, protect it" as the ONE idea
to keep, rather than presenting locks, message-passing, and `asyncio` as three unrelated toolkits?

<details>
<summary>Answer</summary>

`taming-state` is the cross-cutting idea this topic returns to constantly: locks (co-11-14),
message-passing (co-20-22), and `asyncio`'s single-thread cooperative model (co-26-27) are three DIFFERENT
strategies for the SAME underlying problem -- containing what mutable state two things can touch at once
-- not three unrelated toolkits to memorize separately. Recognizing "this is `taming-state` again, applied
a different way" is what lets a developer transfer intuition to a fourth, unfamiliar concurrency tool
later, instead of starting from zero each time.

</details>

**W2.** Why is `determinism-vs-emergence` named as a cross-cutting idea rather than treated as specific to
race conditions (co-08) alone?

<details>
<summary>Answer</summary>

Determinism loss shows up under different names throughout this topic: memory visibility (co-19) is
fragile precisely because CPython's usual determinism is an implementation coincidence, not a guarantee;
livelock (co-17) is threads staying "active" while making emergent, non-progressing behavior instead of
deterministic forward progress; the stress-harness example (ex-80) needs MANY repeated trials specifically
because a single passing run proves nothing about race-freedom -- concurrent code's correctness cannot be
verified the same way sequential code's can, by running it once and reading the output.

</details>

**W3.** Why does Kata 2's fix drop the `Barrier` entirely instead of just swapping which lock each worker
grabs first while KEEPING the same forced-rendezvous choreography?

<details>
<summary>Answer</summary>

The `Barrier` in the "before" kata specifically forces BOTH workers to be holding their OWN first lock
simultaneously before either attempts the second -- that state is only reachable when the two workers'
first locks are genuinely DIFFERENT resources. Once both workers agree to acquire the SAME lock first (the
fix), only one worker can ever be mid-acquisition at any instant, so trying to force "both hold their
first lock at once" via a `Barrier` would create a brand NEW, self-inflicted deadlock: the second worker
could never even reach the barrier, since it would be blocked acquiring the very lock the first worker is
holding through its own barrier wait. The fix's guarantee is structural, not timing-dependent, and is
actively incompatible with that forcing mechanism.

</details>

**W4.** Why is co-04 (free-threaded CPython) taught as a new, opt-in CAPABILITY rather than "the GIL is
simply gone in Python 3.14 now"?

<details>
<summary>Answer</summary>

PEP 779 makes free-threading officially SUPPORTED starting in 3.14, but it ships as an opt-in BUILD
variant (`python3.14t`), not the default interpreter most installations run -- the standard GIL build
remains the default, and even platform installers (macOS's, specifically) still label the free-threaded
option "experimental" in their own UI despite the PEP's own supported status. This topic's examples branch
on `sys._is_gil_enabled()` at runtime precisely so they stay correct on WHICHEVER interpreter actually
executes them, rather than assuming a single, universally-available build.

</details>

**W5.** Why does the topic separate "data race" (co-09) from the broader "race condition" (co-08) as two
distinct concepts, rather than treating them as synonyms?

<details>
<summary>Answer</summary>

A data race is the narrower, mechanically-checkable case: unsynchronized concurrent access to the same
memory location where at least one access is a write. A race condition is the wider, SEMANTIC category --
any bug where output depends on interleaving timing, which can occur even when every individual memory
access is correctly locked, e.g. two properly-synchronized operations still running in an unintended
overall order for the business logic they're meant to implement. Example 37 exists specifically to show
these failing in DIFFERENT observable ways -- conflating the two terms would hide a genuinely wider bug
category behind the narrower, more mechanically obvious one.

</details>

**W6.** Why does co-30 describe an `Observable` as the "dual" of an `Iterable` rather than just "another
way to loop over data"?

<details>
<summary>Answer</summary>

The push/pull inversion IS the entire reason `Observable` exists as its own abstraction, not an
incidental detail of it: an `Iterable`'s consumer actively PULLS ("give me your next value, right now")
on the consumer's own schedule, while an `Observable`'s producer actively PUSHES ("here's a value,
whenever I have one") on the PRODUCER's own schedule. That inversion is exactly what makes `Observable`
suited to inherently producer-driven sources -- user clicks, sensor readings, price ticks -- that a
pull-based `Iterable` cannot represent at all, since there's no way to "pull" an event that hasn't
happened yet.

</details>

**W7.** Why does this topic teach the reactive-streams sub-group (co-29 to co-33) as a SEPARATE final
block, rather than interleaving `reactivex` examples throughout the threads/`asyncio` material earlier in
the topic?

<details>
<summary>Answer</summary>

Reactive streams apply the SAME shared-state and flow-control discipline this topic already builds
(co-07's shared-mutable-state hazard, co-22's backpressure) but wrapped in a genuinely different execution
and composition model -- push-based, operator-composed, delivered via a third-party library (`reactivex`)
rather than the stdlib every other example in this topic uses. Grouping it at the end lets a reader master
the CORE concurrency model on solid, dependency-free stdlib ground first, then transfer that same
discipline onto an unfamiliar API shape and a new third-party dependency, instead of learning both a new
concept and a new library's installation/API surface at the same time throughout.

</details>

**W8.** Why does co-28 (Amdahl's Law) matter as a NAMED, quantified concept, rather than just "add more
workers until it's fast enough"?

<details>
<summary>Answer</summary>

Amdahl's Law gives a concrete, falsifiable CEILING derived from a workload's own serial fraction --
without naming it, a team burning effort tuning worker-pool sizes has no way to distinguish a fixable
inefficiency from an ALREADY near-optimal result given how much of the work is inherently serial (AP9's
exact scenario: 4 workers landing at 2.2x, not 4x, might simply be close to a workload's own 4x ceiling,
not a broken pool). Naming and computing the law turns "just add more workers" from a hopeful guess into
a measurable, boundable prediction a team can check their actual results against.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) &middot; Next: [25 · Advanced Algorithms](../../advanced-algorithms/learning/overview.md) →
