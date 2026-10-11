---
title: "Overview"
date: 2026-07-17T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Python](../just-enough-python/learning/overview.md) -- a
  general "reading code and running experiments" fluency this topic assumes; [Computer Science Foundations](../computer-science-foundations/overview.md) -- number systems, two's
  complement, IEEE-754 floats, endianness, and the stack/heap survey this topic goes on to measure
  and exploit for real.
- **Tools & environment**: a macOS/Linux terminal; a C toolchain (a recent stable `clang`/`gcc`); a
  profiler/`perf`-style tool to measure cache and cycle behavior (Instruments/`dtrace` on macOS,
  `perf` on Linux); optionally a disassembler to read emitted assembly; Neovim/VSCode with the C
  LSP.
- **Assumed knowledge**: reading and running a small program (topic 4); binary/number
  representation and complexity intuition (topic 19); reading a typed script to drive experiments
  (topic 4).

## Why this exists -- the big idea

**The problem before the solution**: reasoning about a flat, uniform memory and a CPU that runs one
instruction at a time stopped predicting performance once caches, pipelines, and virtual memory
arrived -- the same big-O algorithm now runs an order of magnitude apart depending on how it
touches memory. **The one idea worth keeping if you forget everything else**: memory is a hierarchy
and the CPU is fast only when it hits cache -- sequential, cache-friendly access to compact data
beats a "clever" algorithm that chases pointers, because a cache miss costs hundreds of cycles.

**Cross-cutting big ideas, taught here and then reused for the rest of this curriculum**:
`layering-and-leaks` -- this is the layer just under your language -- its cache, page, and
word-size behavior leaks upward as performance you must explain; `abstraction-and-its-cost` -- the
"flat memory, one instruction at a time" abstraction is convenient and wrong, and the cost it hides
is exactly the 100x gap between a cache hit and a cache miss.

This topic teaches the CS:APP "program in the machine's terms" model: the memory hierarchy and
caches, the cost of a cache miss, virtual memory, integer/float representation, endianness, the
instruction-set contract and a little assembly, how pipelining/branch prediction/superscalar
out-of-order execution shape a hot loop, SIMD vectorization, multi-core memory ordering and atomics,
and why data layout dominates performance -- all grounded in 80 small, runnable C programs plus an
intra-topic capstone. Examples are C (with a little assembly to read), where memory layout and
representation are visible rather than hidden.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 80 runnable, heavily annotated C examples across
  Beginner (Examples 1-27: integer/float representation, endianness, struct padding and alignment,
  pointer arithmetic and array layout, the memory-hierarchy latency survey, a real cache-line-size
  probe, and reading emitted assembly), Intermediate (Examples 28-57: measured cache-miss stride
  sweeps, AoS-vs-SoA hot loops, cache blocking, false sharing and its fix, branch prediction,
  pipeline dependency chains and ILP, virtual memory/TLB/page faults, SIMD auto-vectorization and
  intrinsics, atomics and memory ordering), and Advanced (Examples 58-80: an end-to-end
  profile-fix-remeasure workflow, blocked transpose, a SoA+SIMD particle simulation, parallel
  histogram scaling, branch-mispredict cost measurement, NUMA/hugepage stories told honestly on a
  single-package Apple Silicon dev machine, integer-overflow security bugs, Kahan summation, the
  fast-inverse-square-root bit-hack, portable serialization, loop interchange, a roofline-style
  bandwidth-vs-compute comparison, superscalar port contention, and a final mechanical-sympathy
  recap benchmark) -- plus an intra-topic capstone. See
  [learning/beginner.md](./learning/beginner.md), [learning/intermediate.md](./learning/intermediate.md),
  and [learning/advanced.md](./learning/advanced.md) for the full worked examples.

Every example is a complete, self-contained, runnable C11 file colocated under `learning/code/`,
actually compiled and run on this Apple Silicon dev machine (Apple clang, arm64, macOS/Darwin, 128 B
cache line, 64 KiB L1d, 4 MiB L2, 12 logical CPUs) to capture its documented output -- every printed
value, byte pattern, and timing number on this topic's pages is a genuine, captured transcript,
never a fabricated one.

---

Next: [Learning Overview](./learning/overview.md) →
