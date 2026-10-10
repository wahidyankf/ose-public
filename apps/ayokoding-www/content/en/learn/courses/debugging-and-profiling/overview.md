---
title: "Overview"
date: 2026-07-15T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Python](../just-enough-python/learning/overview.md) -- every
  script in this topic is fully type-annotated Python, and you should already be comfortable reading
  functions, classes, exceptions, and `list`/`dict` literals the way that primer taught them; [Just Enough Bash](../just-enough-bash/learning/overview.md) -- every example is driven from a
  terminal, and several examples pipe commands, background a process with `&`, or read an exit code
  the way that primer taught; [Software Testing](../software-testing/learning/overview.md) --
  this topic assumes you can already write a failing pytest-style assertion and read a traceback; a
  test tells you **that** something is wrong, this topic is about finding **where** and **why**, then
  measuring whether a fix actually helped.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13.12** (stdlib `pdb`, `cProfile`,
  `pstats`, `tracemalloc`, `threading`, `asyncio`, `sys.monitoring` -- no extra install needed) plus
  **py-spy 0.4.2**, **debugpy 1.8.21**, **line_profiler 5.0.2** (provides `kernprof`), **hypothesis
  6.156.6**, **gprof2dot 2025.4.14**, and **snakeviz 2.2.2** from PyPI; **Python 3.14.3** for the two
  examples that need pdb's 3.14-only remote-attach features; **git 2.39.5+** for the bisection
  examples; **inferno** (`cargo install inferno`) for flame-graph rendering; on Linux, **gdb 17.2+**
  (bundles Python-awareness via `python-gdb.py`) and **perf** (ships with the Linux kernel's
  `linux-tools` package, no separate version) for the native-debugging tier; on macOS, **lldb** (ships
  with Xcode Command Line Tools) plus **cpython_lldb 0.3.3** from PyPI. This topic is explicit,
  throughout, about which native-tooling examples need root privileges
  or a specific OS -- see the Native & Systems tier's opening note for exactly what that means and how
  each such example is still verified honestly in this sandbox.
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
function looks completely different from `cProfile`'s Python-only view versus `perf`'s native-aware
one). `determinism-vs-emergence` -- the hardest bugs are emergent, not local: a data race or an
`asyncio` interleaving bug depends on the interaction between threads or tasks, not on any single
line, so it is only reproducible by controlling that interaction (a forced yield, a seed, a barrier),
never merely by rereading the code closely enough.

This topic covers interactive debugging (breakpoints, watches, stepping, post-mortem, remote/DAP
attach) across both `pdb` and native debuggers, sampling versus instrumenting profilers and how to
read a flame graph, memory profiling with `tracemalloc`, and a systematic bisection-and-minimization
method (`git bisect` plus delta-debugging) for localizing a fault before you ever open a debugger.
Deep CI wiring is out of scope here; this topic's job is the everyday, at-the-keyboard skill of
finding and fixing what a test suite alone didn't catch -- and proving, with a real before/after
measurement, that a fix actually worked.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 80 runnable, heavily annotated examples across Beginner
  (Examples 1-27: `pdb`'s core vocabulary -- breakpoints, stepping, stack inspection, conditional
  breaks, post-mortem debugging, print/logging versus interactive debugging -- plus a first pass
  through `cProfile`, `tracemalloc`, flame-graph reading, and `git bisect`), Intermediate (Examples
  28-49: `py-spy`'s `top`/`record`/`dump`, sorting `pstats` by `tottime` versus `cumtime`,
  line-level profiling with `kernprof`, `tracemalloc` diffing, `debugpy` remote attach, automated
  `git bisect run`, and delta-debugging with a hand-rolled `ddmin` and with Hypothesis's shrinker),
  Advanced (Examples 50-62: `pdb`'s `interact` mode and chained-exception `exceptions` command,
  multi-module log correlation, converting a profile to a flame graph, a genuine threading race and
  an `asyncio` interleaving bug reproduced and fixed, and `multiprocessing` versus `threading` under
  a profiler), and Native & Systems (Examples 63-80: `gdb`/`lldb`/`perf`-level native-aware debugging
  and profiling of the CPython process itself, plus the topic's integrative discipline examples --
  a combined correctness-and-performance bug, the recursive `tottime`-versus-`cumtime` trap, an
  unbounded-cache leak, import-time profiling, lock contention under load, a flame-graph diff, and a
  low-overhead `sys.monitoring` tracer) -- plus a capstone that bisects and minimizes a seeded
  correctness bug, fixes it test-first, then profiles and fixes a seeded performance bug with a
  documented before/after measurement.

Every example is a complete, self-contained runnable file (or command sequence) colocated under
`learning/code/`, actually executed to capture its documented output. Where an example genuinely
needs a privilege or a host this sandbox does not have (root access for `py-spy` on macOS, a Linux
kernel for `perf`, an installed `gdb`), that limitation is stated honestly, backed by the tool's own
documentation, rather than a fabricated transcript standing in for it -- see the Native & Systems
tier's opening note for the full, itemized account.

---

Next: [Learning Overview](./learning/overview.md) →
