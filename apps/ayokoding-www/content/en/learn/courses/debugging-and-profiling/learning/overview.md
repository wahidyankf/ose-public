---
title: "Overview"
date: 2026-07-15T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Python](../../just-enough-python/learning/overview.md) -- every
  script in this topic is fully type-annotated Python, and you should already be comfortable reading
  functions, classes, exceptions, and `list`/`dict` literals the way that primer taught them; [Just Enough Bash](../../just-enough-bash/learning/overview.md) -- every example is driven from a
  terminal, and several examples pipe commands, background a process with `&`, or read an exit code
  the way that primer taught; [Software Testing](../../software-testing/learning/overview.md) --
  this topic assumes you can already write a failing pytest-style assertion and read a traceback; a
  test tells you **that** something is wrong, this topic is about finding **where** and **why**, then
  measuring whether a fix actually helped.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13.12** (stdlib `pdb`, `cProfile`,
  `pstats`, `tracemalloc`, `threading`, `asyncio`, `sys.monitoring` -- no extra install needed) plus
  **py-spy 0.4.2**, **debugpy 1.8.21**, **line_profiler 5.0.2** (provides `kernprof`), **hypothesis
  6.156.6**, **gprof2dot 2025.4.14**, and **snakeviz 2.2.2** from PyPI; **Python 3.14.3** for the two
  examples that need pdb's 3.14-only remote-attach and `set_trace_async` features; **git 2.39.5+** for
  the bisection examples; **inferno** (`cargo install inferno`) for flame-graph rendering; on Linux,
  **gdb 17.2+** (bundles Python-awareness via `python-gdb.py`) and **perf** (ships with the Linux
  kernel's `linux-tools` package) for the native-debugging tier; on macOS, **lldb** (ships with Xcode
  Command Line Tools) plus **cpython_lldb 0.3.3** from PyPI.
- **Assumed knowledge**: reading and writing typed Python functions and classes; running a program
  and reading its exit code from a Bash terminal; writing a plain `assert`-based test. No prior
  debugging or profiling background is required -- this topic is where that background starts.

## Why this exists -- the big idea

**The problem before the solution**: a failing test tells you something is wrong but not where or
why; `print`-driven guessing scales poorly as a codebase grows, and optimizing by hunch tunes the
wrong 90% of the code while the real bottleneck sits untouched, unmeasured. **The one idea worth
keeping if you forget everything else**: debugging is a search -- form a falsifiable hypothesis,
change exactly one thing, observe, and halve the remaining search space; performance work is
measure-first, because the hot spot is almost never where you would have guessed by reading the code.

**Cross-cutting big ideas, taught here and then reused for the rest of this topic**:
`layering-and-leaks` -- a bug or a hot spot usually lives at a seam between layers (your code, the
runtime, the OS, the CPU cache), and a profiler or a native-aware debugger is how you see through
that layer instead of guessing at it (the Native & Systems tier makes this literal: the same slow
function looks completely different from `cProfile`'s Python-only view versus a native-aware view).
`determinism-vs-emergence` -- the hardest bugs are emergent, not local: a data race or an `asyncio`
interleaving bug depends on the interaction between threads or tasks, not on any single line, so it
is only reproducible by controlling that interaction (a forced yield, a seed, a barrier), never
merely by rereading the code closely enough.

## Install and run your first example

Confirm the core toolchain this topic's Beginner tier uses is installed:

```text
$ python3 --version
Python 3.13.12
$ python3 -m pdb --help > /dev/null && echo "pdb OK"
pdb OK
$ python3 -c "import cProfile, pstats, tracemalloc; print('stdlib profiling OK')"
stdlib profiling OK
$ git --version
git version 2.39.5
```

Install the packages the Intermediate/Advanced/Native & Systems tiers need with one `pip` command
(ideally into a virtual environment):

```text
pip install py-spy==0.4.2 debugpy==1.8.21 line_profiler==5.0.2 hypothesis==6.156.6 \
  gprof2dot==2025.4.14 snakeviz==2.2.2
```

**A note on versions**: this topic's examples were authored and verified against these exact tool
versions, in this sandbox, on 2026-07-15. `pdb`, `cProfile`, `tracemalloc`, and `git bisect` are
stdlib/core-tool features that have been stable for many releases; the two examples that need Python
3.14's remote-attach (`python -m pdb -p <pid>`) and `pdb.set_trace_async()` are called out explicitly
where they appear.

Every example is a complete, self-contained runnable file (or command sequence) colocated under
`learning/code/`, actually executed to capture its documented output. Where an example genuinely
needs a privilege or a host this sandbox does not have (root access for `py-spy` on macOS, a Linux
kernel for `perf`, macOS Developer Mode for `lldb` attach), that limitation is stated honestly, backed
by the tool's own error message or documentation, rather than a fabricated transcript standing in for
it -- see the [Native & Systems tier](./native-and-systems.md)'s opening note for the full, itemized
account of every such limitation and its real, disclosed substitute.

## How this topic's examples are organized

- **[Beginner](./beginner.md)** (Examples 1-27) -- `pdb`'s core vocabulary: breakpoints, stepping,
  the call stack, conditional breaks, `display`, post-mortem debugging, `print`/logging versus
  interactive debugging, plus a first pass through `cProfile`, `tracemalloc`, flame-graph reading, and
  `git bisect` by hand.
- **[Intermediate](./intermediate.md)** (Examples 28-49) -- `py-spy`'s `top`/`record`/`dump` (and the
  honest substitute used where root access is unavailable), sorting `pstats` by `tottime` versus
  `cumtime`, line-level profiling with `kernprof`, `tracemalloc` diffing, `debugpy`/DAP remote attach,
  automated `git bisect run`, and delta-debugging with a hand-rolled `ddmin` and with Hypothesis's
  shrinker.
- **[Advanced](./advanced.md)** (Examples 50-62) -- `pdb`'s `interact` mode and chained-exception
  `exceptions` command, multi-module log correlation, converting a profile to a flame graph via
  `gprof2dot`, a real Neovim DAP session, a documented before/after `cProfile` measurement, a genuine
  threading race reproduced and fixed, an `asyncio` interleaving bug, `pdb.set_trace_async()`,
  `multiprocessing` versus `threading` under load, automated bisection of a performance regression,
  and delta-debugging a 10,000-line crash.
- **[Native & Systems](./native-and-systems.md)** (Examples 63-80) -- `gdb`/`lldb`/`perf`-level
  native-aware debugging and profiling of the CPython process itself (with every host limitation
  disclosed honestly), plus the topic's integrative discipline examples: a combined
  correctness-and-performance bug, the recursive `tottime`-versus-`cumtime` trap, an unbounded-cache
  leak, import-time profiling, lock contention under load, a flame-graph diff, deterministic seeding
  for a flaky bug, bisecting with a flaky-test guard, and a low-overhead `sys.monitoring` tracer.
- **[Capstone](./capstone/overview.md)** -- one repository carrying both a seeded correctness bug and
  a seeded performance bug, resolved end to end: bisect and minimize the failing input, fix it with a
  debugger-guided, test-first change, then profile (two independent ways), fix, and measure the hot
  path with zero regressions.

## The 23 concepts this topic covers

- **co-01 · Interactive breakpoints and stepping** -- pausing execution at a chosen line and driving
  it forward with step-into / step-over / step-out, versus letting it run to completion. Examples
  1-3, 14, 25-26, 39, 54, 59.
- **co-02 · Conditional and watch breakpoints** -- halting only when a predicate holds (`i == 47`,
  `id(obj) == ...`) or a value changes, instead of stopping on every hit. Examples 8-11, 38-39.
- **co-03 · Call-stack, frame, and variable inspection** -- reading the stack, moving between frames,
  and printing or mutating locals at a paused point to test a hypothesis. Examples 4-7, 25, 32, 50-51, 64.
- **co-04 · Post-mortem debugging** -- entering a debugger on an already-thrown, uncaught exception
  (`pdb.pm()`, `python -m pdb`) to inspect the failing frame without a rerun. Examples 15-16, 42, 51,
  66, 72.
- **co-05 · Print/logging versus interactive debugging** -- when `print`/`logging` beats a breakpoint
  (long-lived processes, production, timing) and when it does not (one-off, deep state). Examples
  12-13, 52.
- **co-06 · Remote and DAP debugging** -- attaching a debugger to an already-running process over the
  Debug Adapter Protocol (`debugpy`, editor DAP) or `pdb -p <pid>`. Examples 40-42, 54, 59.
- **co-07 · Scientific-method debugging loop** -- expected-vs-actual, one falsifiable hypothesis, one
  change, observe, repeat -- debugging as controlled experiment, not guessing. Examples 7, 23, 50, 78.
- **co-08 · Bisection search as a general strategy** -- halving the search space (commits, input, code
  region) to localize a fault in logarithmic rather than linear steps. Examples 22, 24, 43.
- **co-09 · `git bisect`, manual** -- driving `git bisect start`/`good`/`bad` by hand to name the
  commit that introduced a regression. Examples 22, 72.
- **co-10 · `git bisect`, automated** -- `git bisect run <script>` with a pass/fail (or 125-skip) exit
  code so the whole search runs unattended. Examples 43-44, 61, 72, 79.
- **co-11 · Delta-debugging input minimization** -- shrinking a failing input to a 1-minimal
  reproducer (hand-rolled `ddmin`, Hypothesis shrinking) so every remaining piece is necessary.
  Examples 24, 45-47, 62.
- **co-12 · Sampling versus instrumenting profilers** -- periodic stack sampling (low overhead,
  statistical) versus per-call instrumentation (exact counts, high overhead), and when each is right.
  Examples 28-29.
- **co-13 · CPU profiling with `cProfile`** -- the stdlib instrumenting profiler: running it from the
  CLI or programmatically and reading its `pstats` table. Examples 17-18, 28, 33, 35, 53, 55, 70,
  72-73, 75.
- **co-14 · CPU profiling with `py-spy`** -- a sampling profiler that attaches to a live PID with no
  code changes (`top`, `record`, `dump`, `--native`) -- and the honest, disclosed substitute
  (`mini_sampler.py`, built from `sys._current_frames()`) used wherever root access is unavailable.
  Examples 28-32, 60, 71.
- **co-15 · Wall-clock versus CPU time** -- distinguishing elapsed time (`perf_counter`) from on-CPU
  time (`process_time`); I/O-bound versus CPU-bound diagnosis. Examples 19, 60, 76.
- **co-16 · `tottime` versus `cumtime`** -- a function's own time versus time including callees, and
  which one to optimize (many-cheap leaf versus one-expensive parent). Examples 18, 33, 73.
- **co-17 · Memory profiling with `tracemalloc`** -- snapshotting allocations, diffing two snapshots to
  find a leak, and widening the traceback (`nframe`) to split allocation sites. Examples 20, 36-37, 74.
- **co-18 · Line-level profiling** -- attributing cost to individual source lines (`line_profiler`'s
  `@profile` plus `kernprof`), one resolution finer than function-level. Examples 34-35.
- **co-19 · Flame-graph reading** -- width = total time in a call subtree, height = stack depth;
  finding the widest frame (the hot spot), not the tallest stack. Examples 21, 30-31, 53, 68-69, 71, 77.
- **co-20 · Race and heisenbug reproduction** -- forcing nondeterministic concurrency bugs to
  reproduce reliably (forced yields, seeds, barriers) before attempting a fix. Examples 56-58, 76,
  78-79.
- **co-21 · Load-representative versus toy profiling** -- profiling at realistic scale and
  concurrency, because the hot spot at 100 items or a single call differs from production. Examples
  48-49, 60, 76.
- **co-22 · Native-layer costs and native debugging** -- seeing costs the interpreter hides:
  `gdb`/`lldb` Python-aware backtraces, `perf` with Python perf-maps, `py-spy --native`, core dumps.
  Examples 63-68, 70-71, 75, 80.
- **co-23 · Before/after measurement discipline** -- proving a fix with a repeated, documented
  measurement, and confirming zero regressions. Examples 27, 55, 57, 72, 74-75, 77, 80.

## Examples by Level

### Beginner (Examples 1–27)

- [Example 1: First Breakpoint with breakpoint()](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-1-first-breakpoint-with-breakpoint)
- [Example 2: Step Into vs. Step Over](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-2-step-into-vs-step-over)
- [Example 3: Step Out of a Deep Call](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-3-step-out-of-a-deep-call)
- [Example 4: Reading the Call Stack with w](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-4-reading-the-call-stack-with-w)
- [Example 5: Navigating Frames with up/down](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-5-navigating-frames-with-updown)
- [Example 6: Inspecting Locals with p and pp](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-6-inspecting-locals-with-p-and-pp)
- [Example 7: Mutating a Variable to Confirm a Hypothesis](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-7-mutating-a-variable-to-confirm-a-hypothesis)
- [Example 8: Conditional Breakpoint in a Loop](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-8-conditional-breakpoint-in-a-loop)
- [Example 9: The condition Command on an Existing Breakpoint](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-9-the-condition-command-on-an-existing-breakpoint)
- [Example 10: Watching a Variable with display](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-10-watching-a-variable-with-display)
- [Example 11: The display In-Place-Mutation Caveat](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-11-the-display-in-place-mutation-caveat)
- [Example 12: Print-Debugging a One-Off Script](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-12-print-debugging-a-one-off-script)
- [Example 13: logging vs. print in a Long-Lived Process](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-13-logging-vs-print-in-a-long-lived-process)
- [Example 14: The breakpoint() Builtin and PYTHONBREAKPOINT](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-14-the-breakpoint-builtin-and-pythonbreakpoint)
- [Example 15: First Post-Mortem with python -m pdb](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-15-first-post-mortem-with-python--m-pdb)
- [Example 16: pdb.pm() in a REPL Session](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-16-pdbpm-in-a-repl-session)
- [Example 17: First cProfile Run from the Command Line](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-17-first-cprofile-run-from-the-command-line)
- [Example 18: cProfile Programmatic API with pstats](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-18-cprofile-programmatic-api-with-pstats)
- [Example 19: Wall Time vs. CPU Time](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-19-wall-time-vs-cpu-time)
- [Example 20: First tracemalloc Snapshot](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-20-first-tracemalloc-snapshot)
- [Example 21: Reading a Pregenerated Flame Graph](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-21-reading-a-pregenerated-flame-graph)
- [Example 22: git bisect by Hand](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-22-git-bisect-by-hand)
- [Example 23: Rubber-Duck Hypothesis Writing](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-23-rubber-duck-hypothesis-writing)
- [Example 24: Minimizing a Failing Input by Hand](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-24-minimizing-a-failing-input-by-hand)
- [Example 25: Sticky Mode and the list Command](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-25-sticky-mode-and-the-list-command)
- [Example 26: tbreak: a One-Shot Breakpoint](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-26-tbreak-a-one-shot-breakpoint)
- [Example 27: Before/After Timing a One-Line Fix](/en/c/learn/courses/debugging-and-profiling/learning/beginner#example-27-beforeafter-timing-a-one-line-fix)

### Intermediate (Examples 28–49)

- [Example 28: Profiling Two Ways -- Sampling and Instrumenting](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-28-profiling-two-ways----sampling-and-instrumenting)
- [Example 29: py-spy top on a Live Process](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-29-py-spy-top-on-a-live-process)
- [Example 30: A Flame Graph from a Sampling Profiler](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-30-a-flame-graph-from-a-sampling-profiler)
- [Example 31: A Speedscope Export](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-31-a-speedscope-export)
- [Example 32: py-spy dump on a Hung Process](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-32-py-spy-dump-on-a-hung-process)
- [Example 33: Sorting pstats -- tottime vs. cumtime](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-33-sorting-pstats----tottime-vs-cumtime)
- [Example 34: Line-Level Profiling with kernprof](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-34-line-level-profiling-with-kernprof)
- [Example 35: Line Profiler vs. Function-Level Profiler](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-35-line-profiler-vs-function-level-profiler)
- [Example 36: A tracemalloc Snapshot Diff for a Leak](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-36-a-tracemalloc-snapshot-diff-for-a-leak)
- [Example 37: Widening the tracemalloc Traceback with nframe](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-37-widening-the-tracemalloc-traceback-with-nframe)
- [Example 38: Conditional Breakpoint on Object Identity](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-38-conditional-breakpoint-on-object-identity)
- [Example 39: commands Attached to a Breakpoint](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-39-commands-attached-to-a-breakpoint)
- [Example 40: debugpy Attach to a Running Server](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-40-debugpy-attach-to-a-running-server)
- [Example 41: debugpy wait_for_client vs. Attach Later](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-41-debugpy-wait_for_client-vs-attach-later)
- [Example 42: pdb Remote Attach by PID (3.14+)](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-42-pdb-remote-attach-by-pid-314)
- [Example 43: git bisect run, Automated](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-43-git-bisect-run-automated)
- [Example 44: git bisect run with a Skip (Exit 125)](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-44-git-bisect-run-with-a-skip-exit-125)
- [Example 45: Delta-Debugging a JSON Payload](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-45-delta-debugging-a-json-payload)
- [Example 46: Delta-Debugging a Long String](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-46-delta-debugging-a-long-string)
- [Example 47: Hypothesis Shrinking as Delta-Debugging](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-47-hypothesis-shrinking-as-delta-debugging)
- [Example 48: Profiling Toy vs. Realistic Input](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-48-profiling-toy-vs-realistic-input)
- [Example 49: Profiling Under Concurrent Load](/en/c/learn/courses/debugging-and-profiling/learning/intermediate#example-49-profiling-under-concurrent-load)

### Advanced (Examples 50–62)

- [Example 50: pdb's interact Mode](/en/c/learn/courses/debugging-and-profiling/learning/advanced#example-50-pdbs-interact-mode)
- [Example 51: pdb's exceptions Command, Chained](/en/c/learn/courses/debugging-and-profiling/learning/advanced#example-51-pdbs-exceptions-command-chained)
- [Example 52: A Multi-Module Logging Bug](/en/c/learn/courses/debugging-and-profiling/learning/advanced#example-52-a-multi-module-logging-bug)
- [Example 53: cProfile to a Flame Graph, Cross-Checked](/en/c/learn/courses/debugging-and-profiling/learning/advanced#example-53-cprofile-to-a-flame-graph-cross-checked)
- [Example 54: A Real Neovim DAP Breakpoint](/en/c/learn/courses/debugging-and-profiling/learning/advanced#example-54-a-real-neovim-dap-breakpoint)
- [Example 55: Before/After with cProfile](/en/c/learn/courses/debugging-and-profiling/learning/advanced#example-55-beforeafter-with-cprofile)
- [Example 56: Reproducing a Threading Race](/en/c/learn/courses/debugging-and-profiling/learning/advanced#example-56-reproducing-a-threading-race)
- [Example 57: Fixing the Race with a Lock](/en/c/learn/courses/debugging-and-profiling/learning/advanced#example-57-fixing-the-race-with-a-lock)
- [Example 58: An asyncio Interleaving Bug](/en/c/learn/courses/debugging-and-profiling/learning/advanced#example-58-an-asyncio-interleaving-bug)
- [Example 59: pdb.set_trace_async() (3.14+)](/en/c/learn/courses/debugging-and-profiling/learning/advanced#example-59-pdbset_trace_async-314)
- [Example 60: multiprocessing vs. threading Under Load](/en/c/learn/courses/debugging-and-profiling/learning/advanced#example-60-multiprocessing-vs-threading-under-load)
- [Example 61: git bisect run for a Performance Regression](/en/c/learn/courses/debugging-and-profiling/learning/advanced#example-61-git-bisect-run-for-a-performance-regression)
- [Example 62: Delta-Debugging a 10,000-Line Crash](/en/c/learn/courses/debugging-and-profiling/learning/advanced#example-62-delta-debugging-a-10000-line-crash)

### Native & Systems (Examples 63–80)

- [Example 63: gdb Attach to CPython -- a Real Limitation](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-63-gdb-attach-to-cpython----a-real-limitation)
- [Example 64: py-locals/py-print -- Still Gated by gdb](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-64-py-localspy-print----still-gated-by-gdb)
- [Example 65: lldb with cpython_lldb -- a Real Limitation](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-65-lldb-with-cpython_lldb----a-real-limitation)
- [Example 66: lldb Post-Mortem -- a Real Substitute](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-66-lldb-post-mortem----a-real-substitute)
- [Example 67: perf record with Python perf Support](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-67-perf-record-with-python-perf-support)
- [Example 68: perf script to flamegraph.pl](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-68-perf-script-to-flamegraphpl)
- [Example 69: perf script to inferno](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-69-perf-script-to-inferno)
- [Example 70: Native Cost Hidden from cProfile](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-70-native-cost-hidden-from-cprofile)
- [Example 71: py-spy --native -- a Real Limitation](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-71-py-spy---native----a-real-limitation)
- [Example 72: One Repo, Two Bugs -- Correctness and Performance](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-72-one-repo-two-bugs----correctness-and-performance)
- [Example 73: The Recursive tottime vs. cumtime Trap](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-73-the-recursive-tottime-vs-cumtime-trap)
- [Example 74: A Cache That Never Evicts](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-74-a-cache-that-never-evicts)
- [Example 75: Import-Time Startup Profiling](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-75-import-time-startup-profiling)
- [Example 76: Lock Contention Under Load](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-76-lock-contention-under-load)
- [Example 77: A Flame-Graph Diff, Before/After](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-77-a-flame-graph-diff-beforeafter)
- [Example 78: Deterministic Seeding for a Flaky Bug](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-78-deterministic-seeding-for-a-flaky-bug)
- [Example 79: Bisecting with a Flaky-Test Guard](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-79-bisecting-with-a-flaky-test-guard)
- [Example 80: A Low-Overhead Tracer with sys.monitoring](/en/c/learn/courses/debugging-and-profiling/learning/native-and-systems#example-80-a-low-overhead-tracer-with-sysmonitoring)

---

← Previous: [Overview](../overview.md) · Next: [Beginner Examples](./beginner.md) →
