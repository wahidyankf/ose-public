---
title: "Overview"
date: 2026-07-17T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Python](../../just-enough-python/learning/overview.md) -- a
  general "reading code and running experiments" fluency this topic assumes; [Computer Science Foundations](../../computer-science-foundations/overview.md) -- number systems, two's
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

## Confirm your toolchain

Every example in this topic is a self-contained C11 file, compiled directly with no build system:

```text
$ clang --version
Apple clang version 17.0.0 (clang-1700.0.13.5)
Target: arm64-apple-darwin24.5.0
$ sysctl -n hw.cachelinesize hw.l1dcachesize hw.l2cachesize hw.ncpu
128
65536
4194304
12
```

Every example is a complete, self-contained, runnable C11 file colocated under `learning/code/`,
actually compiled and run on this Apple Silicon dev machine to capture its documented output --
every printed value, byte pattern, and timing number on this topic's pages is a genuine, captured
transcript, never a fabricated one. Where an example's natural tool is Linux-only (`perf`,
`numactl`, hugepages), the Linux mechanism is named honestly in prose and the actual runnable
verification on this machine uses the macOS equivalent (Instruments/`dtrace`) or a wall-clock-timing
proxy consistent with this topic's own measurement methodology -- never a fabricated hardware-
counter reading.

## How this topic's examples are organized

- **[Beginner](./beginner.md)** (Examples 1-27) -- two's-complement integer bytes and signed vs.
  unsigned printing, signed-overflow wraparound (and the unsigned-underflow loop bug it causes),
  IEEE-754 float bits and the `0.1+0.2 != 0.3` comparison hazard, endianness detection and
  `htonl`/`ntohl` round-tripping, struct padding/alignment/packing, pointer arithmetic and
  row-major array layout, the memory-hierarchy latency survey, a real runtime cache-line-size probe
  (128 B on this machine, not the common 64 B), sequential-vs-random and small-vs-large working-set
  timing, and reading emitted assembly (including a genuine RISC-V vs. x86 ISA comparison).
- **[Intermediate](./intermediate.md)** (Examples 28-57) -- a cache-miss stride sweep, matrix
  traversal order and AoS-vs-SoA hot loops, working-set cache cliffs, cache-blocked matrix multiply,
  false sharing and its cache-line-padding fix, prefetch hints, branch-predictable-vs-random data,
  branchless arithmetic, pipeline dependency chains, loop unrolling and multi-accumulator ILP, TLB
  pressure, page faults via `mmap`, virtual addresses, write-heavy cost, cache-associativity
  conflict strides, SIMD auto-vectorization and hand-written NEON intrinsics, aligned allocation,
  atomic vs. non-atomic increments, memory-barrier ordering, compiler strength reduction
  (div-to-shift), hot/cold struct splitting, and a cache-miss-count and CPI/IPC measurement pair.
- **[Advanced](./advanced.md)** (Examples 58-80) -- an end-to-end profile-fix-remeasure workflow, a
  blocked matrix transpose, a struct-of-arrays-plus-SIMD particle simulation, parallel histogram
  scaling (shared vs. per-thread bins), measured branch-mispredict cost and a lookup-table cure,
  NUMA and hugepage stories told honestly on a single-package, non-hugepage Apple Silicon dev
  machine, an integer-overflow allocation security bug and its checked-multiply fix, Kahan
  summation, the fast-inverse-square-root bit-hack, portable byte-order-explicit serialization,
  loop interchange, a roofline-style bandwidth-vs-compute comparison, a tuned prefetch distance, a
  Mermaid pipeline-hazard diagram cross-checked against a real measured stall, superscalar
  execution-port contention, atomic-vs-mutex throughput, a cache-friendly open-addressing hash map,
  a vectorized byte search, a profile-guided layout decision record, and a final benchmark harness
  asserting cache-friendly beats cache-hostile across every kernel in this topic at once.
- **[Capstone](./capstone/explanation.md)** -- a sensor-averaging kernel: an int/float
  representation and endianness-hazard toolkit (`repr.c`), the same averaging kernel built
  cache-hostile as array-of-structs (`cache.c`) and then restructured cache-friendly as
  struct-of-arrays (`cache_soa.c`), with a written explanation tying the ~3-4x measured, reproducible
  speedup to the memory hierarchy.

## The 25 concepts this topic covers

- **co-01 · Memory hierarchy** -- registers -> L1/L2/L3 cache -> DRAM -> disk, each level trading
  capacity for a latency gap of roughly an order of magnitude.
- **co-02 · Cache lines and blocks** -- memory moves between levels in fixed-size lines (typically
  64 B; 128 B on Apple Silicon), so touching one byte pulls in its neighbors.
- **co-03 · Spatial locality** -- accessing memory addresses near recently-used ones is fast because
  they already share a cached line.
- **co-04 · Temporal locality** -- re-accessing the same address soon is fast because it is still
  resident in a cache level.
- **co-05 · Cache-miss cost** -- a miss that must fetch from a lower level costs tens-to-hundreds of
  cycles, dwarfing the arithmetic it feeds.
- **co-06 · Cache associativity** -- direct-mapped/set-associative/fully-associative placement
  decides which lines evict each other; power-of-two strides cause conflict misses.
- **co-07 · Write policies** -- write-through vs. write-back and write-allocate govern when a store
  reaches the next level and what a write costs.
- **co-08 · Virtual memory and pages** -- each process sees a private virtual address space mapped
  to physical RAM in fixed-size pages by the MMU.
- **co-09 · TLB** -- the translation-lookaside buffer caches recent virtual-to-physical page
  translations; a TLB miss adds a page-table walk.
- **co-10 · Page faults and swapping** -- touching an unmapped/paged-out page traps to the OS,
  which maps or swaps it in -- a minor fault is cheap, a major (disk) fault is not.
- **co-11 · Two's-complement integers** -- signed integers in C use two's complement; the same bits
  read as signed or unsigned give different values.
- **co-12 · Integer overflow and wraparound** -- unsigned overflow wraps modulo 2ⁿ (defined); signed
  overflow is undefined behavior in C -- a real correctness/security hazard.
- **co-13 · IEEE-754 in C** -- `float`/`double` are sign/exponent/mantissa bit layouts; rounding
  error is structural, not a bug.
- **co-14 · Float-comparison hazards** -- exact `==` on floats is unreliable; compare within an
  epsilon and beware precision loss when magnitudes differ.
- **co-15 · Endianness** -- byte order (little- vs. big-endian) differs across machines and the
  wire; `htonl`/`ntohl` convert for portable serialization.
- **co-16 · Struct padding and alignment** -- the compiler pads struct fields to their alignment, so
  field order changes `sizeof` and misaligned access is slow or faulting.
- **co-17 · Data layout: AoS vs. SoA** -- array-of-structs vs. struct-of-arrays decides how a hot
  loop strides memory; layout beats micro-tuning.
- **co-18 · Instruction-set architecture** -- the ISA (x86 / ARM / RISC-V) is the hardware/software
  contract; RISC vs. CISC is a design-philosophy split.
- **co-19 · Assembly basics** -- registers, load/store, and reading emitted assembly reveal what the
  CPU actually does with your C.
- **co-20 · Pipelining** -- the CPU overlaps fetch/decode/execute/memory/writeback stages; data and
  control hazards force stalls.
- **co-21 · Branch prediction** -- the CPU guesses branch outcomes; a mispredict flushes the
  pipeline (tens of cycles), so predictable or branchless code wins.
- **co-22 · Superscalar and out-of-order** -- modern cores issue several instructions per cycle and
  execute out of order (speculatively), exploiting instruction-level parallelism.
- **co-23 · SIMD vectorization** -- SIMD units (SSE/AVX/NEON) apply one operation to a vector of
  values, the data-parallel path to throughput.
- **co-24 · Memory ordering and atomics** -- cache coherence, atomic operations, and memory barriers
  make multi-core shared memory correct; false sharing silently kills scaling.
- **co-25 · Mechanical sympathy and profiling** -- measure, don't guess: a profiler (`perf` on
  Linux, Instruments/`dtrace` on macOS) is the arbiter of every performance claim.

## Examples by Level

### Beginner (Examples 1–27)

- [Example 1: Print Int Bytes](/en/c/learn/courses/computer-architecture/learning/beginner#example-1-print-int-bytes)
- [Example 2: Hex-Dump Value](/en/c/learn/courses/computer-architecture/learning/beginner#example-2-hex-dump-value)
- [Example 3: Signed vs Unsigned Print](/en/c/learn/courses/computer-architecture/learning/beginner#example-3-signed-vs-unsigned-print)
- [Example 4: Signed Overflow Wrap](/en/c/learn/courses/computer-architecture/learning/beginner#example-4-signed-overflow-wrap)
- [Example 5: Unsigned Wraparound](/en/c/learn/courses/computer-architecture/learning/beginner#example-5-unsigned-wraparound)
- [Example 6: Unsigned Underflow Loop Bug](/en/c/learn/courses/computer-architecture/learning/beginner#example-6-unsigned-underflow-loop-bug)
- [Example 7: Float Bits Inspect](/en/c/learn/courses/computer-architecture/learning/beginner#example-7-float-bits-inspect)
- [Example 8: Float Not Equal](/en/c/learn/courses/computer-architecture/learning/beginner#example-8-float-not-equal)
- [Example 9: Float Epsilon Compare](/en/c/learn/courses/computer-architecture/learning/beginner#example-9-float-epsilon-compare)
- [Example 10: Float Precision Loss](/en/c/learn/courses/computer-architecture/learning/beginner#example-10-float-precision-loss)
- [Example 11: Endianness Detect](/en/c/learn/courses/computer-architecture/learning/beginner#example-11-endianness-detect)
- [Example 12: htonl Roundtrip](/en/c/learn/courses/computer-architecture/learning/beginner#example-12-htonl-roundtrip)
- [Example 13: Manual Byteswap](/en/c/learn/courses/computer-architecture/learning/beginner#example-13-manual-byteswap)
- [Example 14: Struct Sizeof Padding](/en/c/learn/courses/computer-architecture/learning/beginner#example-14-struct-sizeof-padding)
- [Example 15: Struct Reorder Shrink](/en/c/learn/courses/computer-architecture/learning/beginner#example-15-struct-reorder-shrink)
- [Example 16: Packed Struct](/en/c/learn/courses/computer-architecture/learning/beginner#example-16-packed-struct)
- [Example 17: Alignof Types](/en/c/learn/courses/computer-architecture/learning/beginner#example-17-alignof-types)
- [Example 18: Misaligned Access Cost](/en/c/learn/courses/computer-architecture/learning/beginner#example-18-misaligned-access-cost)
- [Example 19: Pointer Arithmetic Stride](/en/c/learn/courses/computer-architecture/learning/beginner#example-19-pointer-arithmetic-stride)
- [Example 20: Array Row-Major Layout](/en/c/learn/courses/computer-architecture/learning/beginner#example-20-array-row-major-layout)
- [Example 21: Latency Hierarchy Table](/en/c/learn/courses/computer-architecture/learning/beginner#example-21-latency-hierarchy-table)
- [Example 22: Cache Line Size Probe](/en/c/learn/courses/computer-architecture/learning/beginner#example-22-cache-line-size-probe)
- [Example 23: Sequential vs Random Sum](/en/c/learn/courses/computer-architecture/learning/beginner#example-23-sequential-vs-random-sum)
- [Example 24: Temporal Locality Working Set](/en/c/learn/courses/computer-architecture/learning/beginner#example-24-temporal-locality-working-set)
- [Example 25: Read Disassembly](/en/c/learn/courses/computer-architecture/learning/beginner#example-25-read-disassembly)
- [Example 26: Registers in Asm](/en/c/learn/courses/computer-architecture/learning/beginner#example-26-registers-in-asm)
- [Example 27: ISA Compare -- RISC-V vs x86](/en/c/learn/courses/computer-architecture/learning/beginner#example-27-isa-compare----risc-v-vs-x86)

### Intermediate (Examples 28–57)

- [Example 28: Cache-Miss Stride Sweep](/en/c/learn/courses/computer-architecture/learning/intermediate#example-28-cache-miss-stride-sweep)
- [Example 29: Matrix Traversal: `[i][j]` vs `[j][i]`](/en/c/learn/courses/computer-architecture/learning/intermediate#example-29-matrix-traversal-ij-vs-ji)
- [Example 30: AoS vs SoA Hot Loop](/en/c/learn/courses/computer-architecture/learning/intermediate#example-30-aos-vs-soa-hot-loop)
- [Example 31: Working-Set Cache Cliffs](/en/c/learn/courses/computer-architecture/learning/intermediate#example-31-working-set-cache-cliffs)
- [Example 32: Cache-Blocking Matrix Multiply](/en/c/learn/courses/computer-architecture/learning/intermediate#example-32-cache-blocking-matrix-multiply)
- [Example 33: False Sharing Between Threads](/en/c/learn/courses/computer-architecture/learning/intermediate#example-33-false-sharing-between-threads)
- [Example 34: Padding Fixes False Sharing](/en/c/learn/courses/computer-architecture/learning/intermediate#example-34-padding-fixes-false-sharing)
- [Example 35: Prefetch Hint, Honestly Measured](/en/c/learn/courses/computer-architecture/learning/intermediate#example-35-prefetch-hint-honestly-measured)
- [Example 36: Branch Prediction: Sorted vs Shuffled](/en/c/learn/courses/computer-architecture/learning/intermediate#example-36-branch-prediction-sorted-vs-shuffled)
- [Example 37: Branchless Max Avoids Mispredicts](/en/c/learn/courses/computer-architecture/learning/intermediate#example-37-branchless-max-avoids-mispredicts)
- [Example 38: Pipeline Dependency Chains](/en/c/learn/courses/computer-architecture/learning/intermediate#example-38-pipeline-dependency-chains)
- [Example 39: Loop Unrolling for Throughput](/en/c/learn/courses/computer-architecture/learning/intermediate#example-39-loop-unrolling-for-throughput)
- [Example 40: ILP via Multiple Accumulators](/en/c/learn/courses/computer-architecture/learning/intermediate#example-40-ilp-via-multiple-accumulators)
- [Example 41: TLB Pressure from Random Pages](/en/c/learn/courses/computer-architecture/learning/intermediate#example-41-tlb-pressure-from-random-pages)
- [Example 42: Page Faults via mmap](/en/c/learn/courses/computer-architecture/learning/intermediate#example-42-page-faults-via-mmap)
- [Example 43: Virtual Addresses Across Processes](/en/c/learn/courses/computer-architecture/learning/intermediate#example-43-virtual-addresses-across-processes)
- [Example 44: Cache-vs-DRAM Latency Gap](/en/c/learn/courses/computer-architecture/learning/intermediate#example-44-cache-vs-dram-latency-gap)
- [Example 45: Write Traffic Costs More Than Reads](/en/c/learn/courses/computer-architecture/learning/intermediate#example-45-write-traffic-costs-more-than-reads)
- [Example 46: Cache-Associativity Conflict Stride](/en/c/learn/courses/computer-architecture/learning/intermediate#example-46-cache-associativity-conflict-stride)
- [Example 47: SIMD Auto-Vectorization: -O0 vs -O3](/en/c/learn/courses/computer-architecture/learning/intermediate#example-47-simd-auto-vectorization--o0-vs--o3)
- [Example 48: Hand-Written NEON Intrinsics](/en/c/learn/courses/computer-architecture/learning/intermediate#example-48-hand-written-neon-intrinsics)
- [Example 49: SIMD Dot Product with NEON](/en/c/learn/courses/computer-architecture/learning/intermediate#example-49-simd-dot-product-with-neon)
- [Example 50: Aligned Allocation for SIMD](/en/c/learn/courses/computer-architecture/learning/intermediate#example-50-aligned-allocation-for-simd)
- [Example 51: Atomic Increment Under Contention](/en/c/learn/courses/computer-architecture/learning/intermediate#example-51-atomic-increment-under-contention)
- [Example 52: Non-Atomic Race Loses Updates](/en/c/learn/courses/computer-architecture/learning/intermediate#example-52-non-atomic-race-loses-updates)
- [Example 53: Memory-Barrier Ordering](/en/c/learn/courses/computer-architecture/learning/intermediate#example-53-memory-barrier-ordering)
- [Example 54: Signed Division vs Arithmetic Shift](/en/c/learn/courses/computer-architecture/learning/intermediate#example-54-signed-division-vs-arithmetic-shift)
- [Example 55: Hot/Cold Struct Field Splitting](/en/c/learn/courses/computer-architecture/learning/intermediate#example-55-hotcold-struct-field-splitting)
- [Example 56: Diagnosing and Fixing a Layout-Caused Slowdown](/en/c/learn/courses/computer-architecture/learning/intermediate#example-56-diagnosing-and-fixing-a-layout-caused-slowdown)
- [Example 57: CPI/IPC: Dependent Chain vs Independent Accumulators](/en/c/learn/courses/computer-architecture/learning/intermediate#example-57-cpiipc-dependent-chain-vs-independent-accumulators)

### Advanced (Examples 58–80)

- [Example 58: Optimize a Kernel End to End](/en/c/learn/courses/computer-architecture/learning/advanced#example-58-optimize-a-kernel-end-to-end)
- [Example 59: Blocked Transpose](/en/c/learn/courses/computer-architecture/learning/advanced#example-59-blocked-transpose)
- [Example 60: Particle Simulation -- AoS vs SoA+SIMD](/en/c/learn/courses/computer-architecture/learning/advanced#example-60-particle-simulation----aos-vs-soasimd)
- [Example 61: Parallel Histogram -- Shared vs Per-Thread Bins](/en/c/learn/courses/computer-architecture/learning/advanced#example-61-parallel-histogram----shared-vs-per-thread-bins)
- [Example 62: Measuring a Branch Mispredict's Cost](/en/c/learn/courses/computer-architecture/learning/advanced#example-62-measuring-a-branch-mispredicts-cost)
- [Example 63: Branch to Lookup Table](/en/c/learn/courses/computer-architecture/learning/advanced#example-63-branch-to-lookup-table)
- [Example 64: NUMA-Local vs NUMA-Remote Allocation](/en/c/learn/courses/computer-architecture/learning/advanced#example-64-numa-local-vs-numa-remote-allocation)
- [Example 65: Huge Pages and TLB Pressure](/en/c/learn/courses/computer-architecture/learning/advanced#example-65-huge-pages-and-tlb-pressure)
- [Example 66: An Integer-Overflow Allocation Bug](/en/c/learn/courses/computer-architecture/learning/advanced#example-66-an-integer-overflow-allocation-bug)
- [Example 67: Kahan Summation](/en/c/learn/courses/computer-architecture/learning/advanced#example-67-kahan-summation)
- [Example 68: Fast Inverse Square Root's Bit-Hack](/en/c/learn/courses/computer-architecture/learning/advanced#example-68-fast-inverse-square-roots-bit-hack)
- [Example 69: Portable, Byte-Order-Explicit Serialization](/en/c/learn/courses/computer-architecture/learning/advanced#example-69-portable-byte-order-explicit-serialization)
- [Example 70: SoA Enables Vectorization](/en/c/learn/courses/computer-architecture/learning/advanced#example-70-soa-enables-vectorization)
- [Example 71: Loop Interchange for Locality](/en/c/learn/courses/computer-architecture/learning/advanced#example-71-loop-interchange-for-locality)
- [Example 72: Roofline -- Bandwidth-Bound vs Compute-Bound](/en/c/learn/courses/computer-architecture/learning/advanced#example-72-roofline----bandwidth-bound-vs-compute-bound)
- [Example 73: Tuning Prefetch Distance](/en/c/learn/courses/computer-architecture/learning/advanced#example-73-tuning-prefetch-distance)
- [Example 74: A Pipeline Load-Use Hazard, Diagrammed](/en/c/learn/courses/computer-architecture/learning/advanced#example-74-a-pipeline-load-use-hazard-diagrammed)
- [Example 75: Superscalar Execution-Port Contention](/en/c/learn/courses/computer-architecture/learning/advanced#example-75-superscalar-execution-port-contention)
- [Example 76: Atomic vs Mutex Throughput](/en/c/learn/courses/computer-architecture/learning/advanced#example-76-atomic-vs-mutex-throughput)
- [Example 77: A Cache-Friendly Hash Map](/en/c/learn/courses/computer-architecture/learning/advanced#example-77-a-cache-friendly-hash-map)
- [Example 78: Vectorized Byte Search](/en/c/learn/courses/computer-architecture/learning/advanced#example-78-vectorized-byte-search)
- [Example 79: A Profile-Guided Layout Decision Record](/en/c/learn/courses/computer-architecture/learning/advanced#example-79-a-profile-guided-layout-decision-record)
- [Example 80: Mechanical Sympathy Recap](/en/c/learn/courses/computer-architecture/learning/advanced#example-80-mechanical-sympathy-recap)

---

← Previous: [Overview](../overview.md) &middot; Next: [Beginner Examples](./beginner.md) →
