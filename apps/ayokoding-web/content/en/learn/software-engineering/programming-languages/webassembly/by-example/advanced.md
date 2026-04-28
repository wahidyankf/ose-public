---
title: "Advanced"
date: 2026-04-29T00:00:00+07:00
draft: false
weight: 10000003
description: "Examples 58-85: Threads, SIMD, WasmGC, exception handling, Component Model, WASIp3, and production deployment (75-95% coverage)"
tags: ["webassembly", "wasm", "threads", "simd", "wasmgc", "component-model", "wasi", "by-example", "advanced"]
---

## Advanced Level: Threads, SIMD, WasmGC, Component Model, and Production

Examples 58-85 cover the cutting-edge of the WebAssembly 3.0 ecosystem: shared memory and atomic operations, SIMD vector instructions, WasmGC typed references and garbage collection, exception handling, the Component Model with WIT interfaces, WASIp3 async, and production deployment patterns. By example 85, you understand the full breadth of the WebAssembly 3.0 specification.

---

## Example 58: Shared Memory in WAT

Shared memory enables multiple Wasm instances (or a Wasm instance and Web Workers) to share the same backing `SharedArrayBuffer`. In WAT, shared memory is declared with the `shared` keyword. This is the foundation for Wasm threading.

```wat
;; shared-memory.wat — declaring shared memory in WAT
(module
  ;; Declare shared memory: 1 initial page, 1 max page, shared
  ;; 'shared' keyword: backing buffer is SharedArrayBuffer (not ArrayBuffer)
  (memory (export "mem") 1 1 shared)  ;; => initial=1 page (64KiB), max=1, shared=true
                                       ;; => SharedArrayBuffer is required for atomic ops
                                       ;; => non-shared memory panics on atomic operations

  ;; Simple store to shared memory (non-atomic — only safe for single-producer)
  (func (export "write")
    (param $offset i32) (param $value i32)
    local.get $offset    ;; => push byte offset
    local.get $value     ;; => push value to write
    i32.store            ;; => non-atomic 32-bit store (use atomic version in threaded code)
  )

  ;; Simple load from shared memory (non-atomic — only safe for single-consumer)
  (func (export "read")
    (param $offset i32) (result i32)
    local.get $offset    ;; => push byte offset
    i32.load             ;; => non-atomic 32-bit load
                          ;; => reads 4 bytes as little-endian i32
  )
)
```

```javascript
// shared-memory-host.js — instantiating with shared memory
// REQUIRES server to send: Cross-Origin-Opener-Policy: same-origin
//                           Cross-Origin-Embedder-Policy: require-corp
// Without these headers: SharedArrayBuffer is undefined (browser blocks it)

if (typeof SharedArrayBuffer === "undefined") {
  throw new Error("SharedArrayBuffer unavailable: COOP/COEP headers missing");
}

const sharedMem = new WebAssembly.Memory({
  initial: 1,
  maximum: 1,
  shared: true, // => creates SharedArrayBuffer backing
});
// => sharedMem.buffer instanceof SharedArrayBuffer  →  true

const { instance } = await WebAssembly.instantiateStreaming(
  fetch("/wasm/shared-memory.wasm"),
  {}, // => module declares its own shared memory (no import needed here)
);

const mem = instance.exports.mem; // => exports the SharedArrayBuffer-backed memory
```

**Key Takeaway**: Shared memory in WAT uses `(memory initial max shared)`. The JavaScript `WebAssembly.Memory` constructor uses `{ shared: true }` to back with `SharedArrayBuffer`. Both require COOP/COEP HTTP headers.

**Why It Matters**: Shared memory is the prerequisite for all Wasm threading patterns — atomic operations, futex-style synchronization, and parallel computation. Without the COOP/COEP headers, the browser disables `SharedArrayBuffer` entirely (this was a Spectre mitigation introduced in 2018 and remains in effect). Production applications using Wasm threads (Emscripten pthreads, rayon-based parallel Rust) must configure these headers in their web server or CDN. Forgetting them is the single most common reason Wasm threading "works in development but not in production."

---

## Example 59: Atomic Operations in WAT

Atomic operations provide thread-safe access to shared memory. Wasm provides atomic load, store, and read-modify-write (RMW) instructions with a `i32.atomic.*` prefix. These map directly to CPU atomic instructions with appropriate memory ordering.

```wat
;; atomics.wat — atomic memory operations in WAT
(module
  (memory (export "mem") 1 1 shared)  ;; => shared memory required for atomics

  ;; Atomic load: reads an i32 atomically (sequentially consistent)
  (func (export "atomicLoad")
    (param $offset i32) (result i32)
    local.get $offset          ;; => push byte offset (must be 4-byte aligned for i32)
    i32.atomic.load            ;; => sequentially consistent atomic 32-bit load
                                ;; => all threads see a consistent view of this value
  )

  ;; Atomic store: writes an i32 atomically
  (func (export "atomicStore")
    (param $offset i32) (param $value i32)
    local.get $offset          ;; => push byte offset
    local.get $value           ;; => push value
    i32.atomic.store           ;; => sequentially consistent atomic 32-bit store
  )

  ;; Atomic add (read-modify-write): adds to value, returns OLD value
  (func (export "atomicAdd")
    (param $offset i32) (param $delta i32) (result i32)
    local.get $offset          ;; => push byte offset
    local.get $delta           ;; => push amount to add
    i32.atomic.rmw.add         ;; => atomically: old = mem[$offset]; mem[$offset] += delta; return old
                                ;; => returns the VALUE BEFORE the addition
                                ;; => safe for concurrent counter increment across threads
  )

  ;; Atomic compare-and-swap: stores new_val if mem[$offset] == expected
  (func (export "atomicCAS")
    (param $offset i32) (param $expected i32) (param $new_val i32) (result i32)
    local.get $offset          ;; => push byte offset
    local.get $expected        ;; => push expected current value
    local.get $new_val         ;; => push new value to store if expected matches
    i32.atomic.rmw.cmpxchg     ;; => atomically: if mem[$offset] == expected, store new_val
                                ;; => returns the VALUE FOUND (not the new value)
                                ;; => returns expected if swap succeeded, actual if not
  )
)
```

**Key Takeaway**: Wasm atomic instructions (`i32.atomic.load`, `i32.atomic.store`, `i32.atomic.rmw.add`, `i32.atomic.rmw.cmpxchg`) provide sequentially consistent thread-safe memory access. RMW instructions return the old value before the operation.

**Why It Matters**: Atomic operations are the building blocks of all lock-free concurrent data structures: spinlocks, channels, reference counts, work-stealing queues. The `cmpxchg` (compare-and-swap) is the fundamental primitive from which mutexes, semaphores, and condition variables are constructed — it is how Emscripten implements pthreads mutex operations on top of Wasm. Understanding that Wasm atomics map to `LOCK CMPXCHG` on x86 (or `STLXR` on ARM) explains their performance characteristics and why atomic-heavy code should minimize contention on the same cache line.

---

## Example 60: Wasm Futex — memory.atomic.wait and memory.atomic.notify

Futex (fast user-space mutex) primitives enable efficient blocking synchronization in Wasm. `memory.atomic.wait` blocks the current thread until a memory location changes (or timeout). `memory.atomic.notify` wakes threads waiting on a location. Together they implement efficient mutex and condition variable semantics.

```wat
;; futex.wat — memory.atomic.wait and memory.atomic.notify
(module
  (memory (export "mem") 1 1 shared)  ;; => shared memory required

  ;; Wait: block until mem[$addr] != $expected or timeout
  ;; Returns: 0=notified, 1=timed out, 2=$expected value did not match initially
  (func (export "wait")
    (param $addr i32)     ;; => byte address in shared memory (must be 4-byte aligned)
    (param $expected i32) ;; => value to compare against
    (param $timeout_ns i64) ;; => timeout in nanoseconds (-1 = infinite)
    (result i32)            ;; => 0=ok/notified, 1=timed out, 2=value mismatch
    local.get $addr         ;; => push address
    local.get $expected     ;; => push expected value
    local.get $timeout_ns   ;; => push timeout
    memory.atomic.wait32    ;; => atomically: if mem[$addr] == $expected, block thread
                             ;; => returns immediately if mem[$addr] != $expected (result: 2)
                             ;; => blocks until notified (result: 0) or timeout (result: 1)
  )

  ;; Notify: wake up to count threads waiting on $addr
  ;; Returns number of threads woken
  (func (export "notify")
    (param $addr i32)    ;; => byte address threads are waiting on
    (param $count i32)   ;; => max threads to wake (use 0x7FFFFFFF for "all")
    (result i32)          ;; => number of threads actually woken
    local.get $addr       ;; => push address
    local.get $count      ;; => push count
    memory.atomic.notify  ;; => wakes up to $count threads waiting on $addr
                           ;; => returns number actually woken
  )
)
```

```javascript
// futex-usage.js — using futex primitives from JavaScript
// Note: memory.atomic.wait32 BLOCKS the thread
// => NEVER call wait on the main thread (freezes the browser!)
// => ONLY call wait inside a Web Worker

// In a Web Worker:
const control = new Int32Array(sharedMemory.buffer);
const LOCK_OFFSET = 0; // => control[0] is the lock

// Acquire spinlock (try CAS, then wait if failed)
function acquireLock() {
  while (Atomics.compareExchange(control, LOCK_OFFSET, 0, 1) !== 0) {
    // => try to CAS: 0→1 (unlocked→locked)
    // => if returns 0, we got the lock; otherwise wait
    Atomics.wait(control, LOCK_OFFSET, 1); // => wait while lock is held (value=1)
    // => blocks worker thread until notify is called
  }
  // => lock acquired: control[LOCK_OFFSET] === 1
}

function releaseLock() {
  Atomics.store(control, LOCK_OFFSET, 0); // => atomically set to 0 (unlocked)
  Atomics.notify(control, LOCK_OFFSET, 1); // => wake one waiting thread
}
```

**Key Takeaway**: `memory.atomic.wait` blocks the current thread until the memory value changes or timeout expires; `memory.atomic.notify` wakes waiting threads. Use only in Web Workers — calling `wait` on the main browser thread throws a `TypeError`.

**Why It Matters**: The futex primitives are how Emscripten implements `pthread_mutex_lock` — the waiting thread parks itself in the kernel (via `memory.atomic.wait`), consuming no CPU while blocked. Without futex, the only option is a busy-spin loop that consumes 100% of a CPU core while waiting. The restriction against calling `wait` on the main thread is a browser security measure to prevent deadlock from blocking the browser's rendering and event loop — this restriction forces all heavy waiting to happen in workers, which is the architecturally correct pattern anyway.

---

## Example 61: Web Workers and SharedArrayBuffer for Parallel Wasm

The complete pattern for parallel Wasm: shared memory between main thread and multiple workers, each running its own Wasm instance against the same backing buffer, coordinating via atomics.

```javascript
// parallel-wasm.js — complete parallel Wasm with SharedArrayBuffer

// Required HTTP headers for SharedArrayBuffer:
// Cross-Origin-Opener-Policy: same-origin
// Cross-Origin-Embedder-Policy: require-corp
// Configure these in nginx/express/Vercel/Cloudflare Pages header rules

const NUM_WORKERS = navigator.hardwareConcurrency || 4; // => use all CPU cores
const ITEMS_PER_WORKER = 1000;
const totalItems = NUM_WORKERS * ITEMS_PER_WORKER;

// Shared data array (backed by SharedArrayBuffer)
const sharedData = new WebAssembly.Memory({
  initial: Math.ceil((totalItems * 4) / 65536) + 1, // => enough pages for i32 array + control
  maximum: 16,
  shared: true, // => SharedArrayBuffer backing
});

// Initialize data from main thread
const dataView = new Int32Array(sharedData.buffer, 0, totalItems); // => data region
for (let i = 0; i < totalItems; i++) {
  dataView[i] = i; // => fill with 0..totalItems-1
}

// Compile module once, share with all workers
const module = await WebAssembly.compileStreaming(fetch("/wasm/parallel-sum.wasm"));

// Spawn workers, send module + memory
const workers = Array.from({ length: NUM_WORKERS }, (_, id) => {
  const w = new Worker("./parallel-worker.js", { type: "module" });
  w.postMessage({
    module, // => compiled module (structured clone)
    sharedData, // => shared memory (truly shared)
    workerId: id,
    startIndex: id * ITEMS_PER_WORKER,
    count: ITEMS_PER_WORKER,
  });
  return w;
});

// Collect results from all workers
const partialSums = await Promise.all(
  workers.map(
    (w) =>
      new Promise((resolve) => {
        w.onmessage = ({ data }) => resolve(data.partialSum);
      }),
  ),
);
const totalSum = partialSums.reduce((a, b) => a + b, 0);
console.log("Total sum:", totalSum); // => sum of 0..totalItems-1
```

**Key Takeaway**: Parallel Wasm: compile the module once on the main thread, share via `postMessage`; use `WebAssembly.Memory({ shared: true })` for data sharing; each worker instantiates its own instance against the shared memory; coordinate via Atomics.

**Why It Matters**: This pattern achieves true parallelism on multi-core machines — each worker runs on a separate OS thread. A sum over 4 million integers that takes 4ms on a single thread takes ~1ms distributed across 4 workers. For real applications (image convolution, FFT, physics simulation), the speedup is proportional to the number of cores for embarrassingly parallel algorithms. This is the architecture used by Figma's compute-intensive layout engine and WebAssembly-based scientific computing applications.

---

## Example 62: Emscripten pthreads — -pthread Compilation

Emscripten supports POSIX threads (pthreads) by translating `pthread_create` to Web Worker creation and `pthread_mutex_lock` to atomic wait/notify. Compilation requires `-pthread` flag and the correct COOP/COEP headers at runtime.

```c
// parallel.c — pthreads with Emscripten
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>

#define NUM_THREADS 4
#define CHUNK_SIZE 1000000

typedef struct {
    long long* data;    // => pointer to data chunk
    int start;          // => start index
    int end;            // => end index
    long long result;   // => output: partial sum
} ThreadArg;

void* sum_chunk(void* arg) {
    ThreadArg* a = (ThreadArg*)arg;
    long long sum = 0;
    for (int i = a->start; i < a->end; i++) {
        sum += a->data[i];    // => sum this thread's chunk
    }
    a->result = sum;           // => write result to struct (main thread reads this)
    return NULL;
}

int main() {
    long long* data = malloc(NUM_THREADS * CHUNK_SIZE * sizeof(long long));
    for (int i = 0; i < NUM_THREADS * CHUNK_SIZE; i++) {
        data[i] = i;           // => fill with 0..N-1
    }

    pthread_t threads[NUM_THREADS];      // => thread handles
    ThreadArg args[NUM_THREADS];          // => per-thread arguments

    for (int t = 0; t < NUM_THREADS; t++) {
        args[t] = (ThreadArg){ data, t * CHUNK_SIZE, (t+1) * CHUNK_SIZE, 0 };
        pthread_create(&threads[t], NULL, sum_chunk, &args[t]);
        // => emscripten_create_worker behind the scenes
    }

    long long total = 0;
    for (int t = 0; t < NUM_THREADS; t++) {
        pthread_join(threads[t], NULL);  // => wait for each thread to finish
        total += args[t].result;          // => collect partial sums
    }

    printf("Total: %lld\n", total);       // => expected: N*(N-1)/2
    free(data);
    return 0;
}
```

```bash
# Compile with pthreads support
emcc parallel.c -o parallel.js \
  -pthread \
  -s USE_PTHREADS=1 \
  -s PTHREAD_POOL_SIZE=4 \
  -s INITIAL_MEMORY=64MB \
  -s ALLOW_MEMORY_GROWTH=1
# => -pthread: enables POSIX thread support (pthread.h)
# => USE_PTHREADS=1: Emscripten pthreads implementation via Web Workers
# => PTHREAD_POOL_SIZE=4: pre-spawn 4 workers (avoids worker startup latency)

# Server must send COOP/COEP headers:
# Cross-Origin-Opener-Policy: same-origin
# Cross-Origin-Embedder-Policy: require-corp
```

**Key Takeaway**: Emscripten pthreads (`-pthread -s USE_PTHREADS=1`) maps POSIX thread APIs to Web Workers and SharedArrayBuffer atomics. PTHREAD_POOL_SIZE pre-spawns workers to reduce first-use latency. COOP/COEP headers are mandatory.

**Why It Matters**: Emscripten pthreads is the migration path for parallel C/C++ code to the web. A C++ OpenMP-parallel image processing library can be compiled with Emscripten pthreads support (OpenMP maps to pthreads) and run in the browser with near-identical parallelism. Google Maps uses this approach for client-side 3D terrain rendering. The pre-spawn pool (`PTHREAD_POOL_SIZE`) is critical for interactive use — creating a Web Worker has 5-50ms overhead that makes the first parallel call sluggish; pre-spawning hides this cost.

---

## Example 63: Rust Parallel Wasm with wasm-bindgen-rayon

`wasm-bindgen-rayon` adapts Rust's `rayon` parallel iterator library for WebAssembly using Web Workers and SharedArrayBuffer. Write standard `rayon` parallel code in Rust and have it automatically distribute work across browser threads.

```toml
# Cargo.toml — rayon parallel Wasm
[dependencies]
wasm-bindgen = "0.2.120"
rayon = "1.10"               # => data parallelism library
wasm-bindgen-rayon = "1"     # => rayon thread pool backed by Web Workers
```

```rust
// src/lib.rs — parallel processing with rayon in Wasm
use wasm_bindgen::prelude::*;
use rayon::prelude::*;

// Initialize rayon's Web Worker thread pool
// Must be called before any parallel work
#[wasm_bindgen]
pub fn init_thread_pool(num_threads: usize) -> js_sys::Promise {
    wasm_bindgen_rayon::init_thread_pool(num_threads)
    // => creates num_threads Web Workers
    // => each worker loads this same Wasm module
    // => returns Promise that resolves when workers are ready
}

// Parallel sum using rayon: automatically distributes across Web Workers
#[wasm_bindgen]
pub fn parallel_sum(data: &[i64]) -> i64 {
    data.par_iter()              // => rayon parallel iterator (uses Web Workers)
        .copied()                // => i64 Copy semantics
        .sum()                   // => parallel reduce: sum across all workers
                                  // => automatic work splitting and aggregation
}

// Parallel map: apply a function to each element in parallel
#[wasm_bindgen]
pub fn parallel_square(data: &[f64]) -> Vec<f64> {
    data.par_iter()              // => parallel iterator over input slice
        .map(|&x| x * x)        // => each element squared (in parallel)
        .collect()               // => collect results into Vec (serialized back to single thread)
                                  // => Vec returned as JS Uint8Array via wasm-bindgen
}
```

```javascript
// rayon-usage.js — using rayon parallel Wasm
import init, { init_thread_pool, parallel_sum } from "./pkg/wasm_rayon.js";
await init();

const numCores = navigator.hardwareConcurrency; // => 4, 8, 16, etc.
await init_thread_pool(numCores); // => wait for workers to be ready

// Create a large dataset
const data = new BigInt64Array(1_000_000).fill(1n); // => 1M elements, all 1
const sum = parallel_sum(data); // => uses all cores
console.log(sum); // => 1000000n
```

**Key Takeaway**: `wasm-bindgen-rayon` enables Rust's `rayon` parallel iterators in browser Wasm. Call `init_thread_pool(numCores)` once to create Web Workers, then use `.par_iter()` for automatic parallel execution.

**Why It Matters**: Rayon's work-stealing scheduler is one of the most efficient parallel runtime implementations — it automatically balances work across threads with minimal overhead. `wasm-bindgen-rayon` brings this to the browser, enabling Rust code to use the same parallel abstractions in the browser as on the server. A Rust server-side image processing function can use `rayon` for parallelism, compile to `wasm32-wasip1` for server use, and compile to `wasm32-unknown-unknown` with `wasm-bindgen-rayon` for browser use — same code, both parallel.

---

## Example 64: Fixed 128-bit SIMD in WAT

Fixed SIMD (128-bit vectors) is universally available in all modern browsers (Chrome 91+, Firefox 89+, Safari 16.4+). WAT uses `v128` as the vector type with typed operations like `i32x4.add` (4 lanes of 32-bit integers) and `f32x4.mul` (4 lanes of 32-bit floats).

```wat
;; simd-fixed.wat — 128-bit SIMD operations in WAT
(module
  ;; Compute dot product of two 4-element i32 vectors using SIMD
  (func (export "dotProduct4")
    (param $ax i32) (param $ay i32) (param $az i32) (param $aw i32)  ;; => vector A components
    (param $bx i32) (param $by i32) (param $bz i32) (param $bw i32)  ;; => vector B components
    (result i32)
    (local $va v128) (local $vb v128)   ;; => 128-bit vector locals

    ;; Pack 4 i32 scalars into a v128 (i32x4 layout: [ax, ay, az, aw])
    local.get $ax
    local.get $ay
    local.get $az
    local.get $aw
    i32x4.make                ;; => pack 4 i32s into v128: [ax|ay|az|aw]
    local.set $va             ;; => store vector A

    local.get $bx
    local.get $by
    local.get $bz
    local.get $bw
    i32x4.make                ;; => pack 4 i32s into v128: [bx|by|bz|bw]
    local.set $vb             ;; => store vector B

    local.get $va             ;; => push $va
    local.get $vb             ;; => push $vb
    i32x4.mul                 ;; => component-wise multiply: [ax*bx, ay*by, az*bz, aw*bw]
                               ;; => result: one v128 with 4 products

    ;; Extract and sum all 4 lanes (horizontal sum)
    (local $products v128)
    local.tee $products        ;; => tee: store and keep on stack

    i32x4.extract_lane 0      ;; => extract lane 0: ax*bx
    local.get $products
    i32x4.extract_lane 1      ;; => extract lane 1: ay*by
    i32.add                    ;; => ax*bx + ay*by

    local.get $products
    i32x4.extract_lane 2      ;; => extract lane 2: az*bz
    i32.add                    ;; => + az*bz

    local.get $products
    i32x4.extract_lane 3      ;; => extract lane 3: aw*bw
    i32.add                    ;; => + aw*bw
                               ;; => final result: ax*bx + ay*by + az*bz + aw*bw (dot product)
  )

  ;; Add two f32x4 vectors (4 floats at once)
  (func (export "addF32x4")
    (param $a v128) (param $b v128) (result v128)
    local.get $a               ;; => push vector A: [a0, a1, a2, a3]
    local.get $b               ;; => push vector B: [b0, b1, b2, b3]
    f32x4.add                  ;; => component-wise add: [a0+b0, a1+b1, a2+b2, a3+b3]
                               ;; => one v128 instruction does 4 float additions
  )
)
```

**Key Takeaway**: Fixed 128-bit SIMD (`v128` type) performs 4x32-bit or 2x64-bit operations in a single instruction. `i32x4.add`, `f32x4.mul`, `i32x4.extract_lane` are universally available (Safari 16.4+, Chrome 91+, Firefox 89+).

**Why It Matters**: SIMD enables data parallelism at the instruction level — processing 4 floats in the same time as 1. For audio processing (4-sample frames per instruction), image processing (4-pixel RGBA per instruction), and linear algebra (matrix rows as v128), SIMD typically provides 2-4x throughput improvement over scalar code. Since fixed SIMD is universally available, there is no longer a need for SIMD feature detection for production deployments targeting modern browsers — it can be assumed present in any browser shipped after mid-2022.

---

## Example 65: Relaxed SIMD in WAT

Relaxed SIMD extends fixed SIMD with operations that may produce platform-specific results for maximum performance. Operations like fused multiply-add may differ between Intel and ARM processors. Available in Chrome/Firefox/Edge; Safari 2026 status: behind a flag.

```wat
;; relaxed-simd.wat — Relaxed SIMD operations (non-deterministic for max perf)
(module
  ;; Fused multiply-add: a*b+c with platform-specific rounding
  ;; On x86: uses FMA3 instruction (single rounding step)
  ;; On ARM: uses FMLA instruction (single rounding step)
  ;; Result MAY differ by 1 ULP (unit of least precision) between platforms
  (func (export "fmaF32x4")
    (param $a v128) (param $b v128) (param $c v128) (result v128)
    local.get $a               ;; => push vector A: [a0,a1,a2,a3]
    local.get $b               ;; => push vector B: [b0,b1,b2,b3]
    local.get $c               ;; => push vector C: [c0,c1,c2,c3]
    f32x4.relaxed_madd         ;; => relaxed fused multiply-add: a*b+c
                                ;; => non-deterministic rounding: results may differ by platform
                                ;; => FASTER than separate mul+add due to hardware FMA unit
  )

  ;; Relaxed min: returns smaller of two values
  ;; Behavior with NaN is platform-specific (no guaranteed NaN propagation)
  (func (export "relaxedMinF32x4")
    (param $a v128) (param $b v128) (result v128)
    local.get $a
    local.get $b
    f32x4.relaxed_min          ;; => component-wise min, NaN handling: platform-specific
                                ;; => IEEE 754 min would always return NaN if either input is NaN
                                ;; => relaxed min: may return the non-NaN value (faster on some CPUs)
  )
)
```

```javascript
// relaxed-simd-usage.js — detect and conditionally load Relaxed SIMD module
import { relaxedSimd } from "wasm-feature-detect"; // => 1.8.0

const hasRelaxedSimd = await relaxedSimd();
// => true: Chrome/Edge/Firefox (shipped)
// => false: Safari 18.x (behind a flag as of 2026)

if (hasRelaxedSimd) {
  const { instance } = await WebAssembly.instantiateStreaming(fetch("/wasm/relaxed-simd.wasm"), {});
  // => use high-performance non-deterministic operations
} else {
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch("/wasm/fixed-simd.wasm"),
    {}, // => deterministic fallback
  );
}
```

**Key Takeaway**: Relaxed SIMD operations (`f32x4.relaxed_madd`, `f32x4.relaxed_min`) may produce platform-specific results for performance. Always use `wasm-feature-detect`'s `relaxedSimd()` before loading Relaxed SIMD modules — it is not yet available in Safari by default (2026).

**Why It Matters**: Neural network inference is the primary use case for Relaxed SIMD. Matrix multiplication with fused multiply-add is dramatically faster than separate multiply and add: the FMA instruction does `a*b+c` in one hardware operation with a single rounding step, improving both speed and (counterintuitively) numerical accuracy compared to two rounded operations. ONNX Runtime Web, TensorFlow.js, and MediaPipe use Relaxed SIMD for accelerating ML inference in the browser. The non-determinism is acceptable in ML contexts where floating-point reproducibility is not a hard requirement.

---

## Example 66: SIMD with Emscripten — -msimd128 Flag

Emscripten compiles C/C++ SIMD intrinsics (SSE, NEON) to Wasm SIMD, and can auto-vectorize loops with `-msimd128 -O3`. This enables existing SIMD-optimized C code to run in the browser without manual WAT conversion.

```c
// simd-sum.c — SIMD auto-vectorizable loop for Emscripten
#include <stdint.h>
#include <emscripten.h>

// Sum an array of floats — auto-vectorized by Clang with -msimd128 -O3
EMSCRIPTEN_KEEPALIVE
float sum_floats(const float* arr, int len) {
    float sum = 0.0f;
    for (int i = 0; i < len; i++) {
        sum += arr[i];    // => auto-vectorized: processes 4 floats per f32x4.add instruction
                           // => compiler unrolls loop and uses SIMD accumulator
    }
    return sum;
}

// Manual SIMD using wasm_simd128.h intrinsics (explicit control)
#include <wasm_simd128.h>

EMSCRIPTEN_KEEPALIVE
void add_arrays(const float* a, const float* b, float* out, int len) {
    int i = 0;
    // Process 4 floats at a time with SIMD
    for (; i + 4 <= len; i += 4) {
        v128_t va = wasm_v128_load(&a[i]);   // => load 4 floats from a[i..i+3]
        v128_t vb = wasm_v128_load(&b[i]);   // => load 4 floats from b[i..i+3]
        v128_t sum = wasm_f32x4_add(va, vb); // => 4 additions in one instruction
        wasm_v128_store(&out[i], sum);        // => store 4 results to out[i..i+3]
    }
    // Handle remaining elements (tail loop)
    for (; i < len; i++) {
        out[i] = a[i] + b[i];  // => scalar fallback for leftover elements
    }
}
```

```bash
# Compile with SIMD enabled
emcc simd-sum.c -o simd-sum.js \
  -msimd128 \
  -O3 \
  -s EXPORTED_FUNCTIONS='["_sum_floats", "_add_arrays", "_malloc", "_free"]'
# => -msimd128: enable 128-bit Wasm SIMD (target machine flag)
# => -O3: maximum optimization (enables auto-vectorization)
# => compiler will emit f32x4.add, f32x4.load, etc. in the output Wasm
```

**Key Takeaway**: `-msimd128 -O3` enables Emscripten's auto-vectorization and SIMD intrinsics. Use `wasm_simd128.h` for explicit SIMD control; auto-vectorization for simple loops. Wasm SIMD is universally available (Safari 16.4+).

**Why It Matters**: C/C++ codebases often contain handwritten SSE or NEON intrinsics for performance-critical paths. Emscripten translates SSE2 intrinsics to Wasm SIMD, enabling this code to run in the browser without rewriting. OpenCV.js, TensorFlow.js (C++ backend), and media codec libraries (libvpx, libopus) use this approach. The auto-vectorization path means simple loops in legacy code get SIMD for free — no code change required, just recompile with `-msimd128 -O3`.

---

## Example 67: AssemblyScript SIMD with v128 Type

AssemblyScript exposes SIMD operations through the `v128` type and a namespace of intrinsic functions in `simd.ts`. This enables SIMD from TypeScript-syntax code without dropping to WAT.

```typescript
// assembly/simd.ts — SIMD in AssemblyScript
// Compile: npx asc assembly/simd.ts --target release --enable simd --outFile build/simd.wasm

// Sum an f32 array using SIMD (4 elements per instruction)
export function simdSum(ptr: i32, len: i32): f32 {
  let sum = f32x4.splat(0.0); // => v128 with all 4 lanes = 0.0
  // => same as [0.0, 0.0, 0.0, 0.0]

  let i = 0;
  while (i + 4 <= len) {
    const chunk = v128.load(ptr + i * 4); // => load 4 f32s at byte offset ptr+i*4
    sum = f32x4.add(sum, chunk); // => add 4 floats simultaneously
    // => accumulates partial sums in 4 lanes
    i += 4;
  }

  // Horizontal sum of the 4 SIMD lanes
  let total: f32 =
    f32x4.extract_lane(sum, 0) + // => lane 0 partial sum
    f32x4.extract_lane(sum, 1) + // => lane 1 partial sum
    f32x4.extract_lane(sum, 2) + // => lane 2 partial sum
    f32x4.extract_lane(sum, 3); // => lane 3 partial sum

  // Handle remaining elements (tail)
  while (i < len) {
    total += load<f32>(ptr + i * 4); // => scalar load for tail elements
    i++;
  }

  return total; // => sum of all elements
}

// SIMD min/max over two arrays
export function simdMin(ptrA: i32, ptrB: i32, ptrOut: i32, len: i32): void {
  let i = 0;
  while (i + 4 <= len) {
    const a = v128.load(ptrA + i * 4); // => load 4 floats from A
    const b = v128.load(ptrB + i * 4); // => load 4 floats from B
    const min = f32x4.min(a, b); // => component-wise min (IEEE 754 NaN-propagating)
    v128.store(ptrOut + i * 4, min); // => store 4 mins to output
    i += 4;
  }
}
```

```bash
# Compile with SIMD enabled
npx asc assembly/simd.ts \
  --target release \
  --enable simd \
  --outFile build/simd.wasm
# => --enable simd: enables v128 type and f32x4/i32x4 intrinsics
# => produces Wasm binary with SIMD instructions
```

**Key Takeaway**: AssemblyScript SIMD uses `v128.load`, `f32x4.add`, `f32x4.extract_lane`, etc. — explicit SIMD intrinsics with TypeScript syntax. Compile with `--enable simd`.

**Why It Matters**: AssemblyScript SIMD enables writing high-performance numeric code with TypeScript syntax without the Rust learning curve. The `--enable simd` flag exposes the full set of Wasm SIMD intrinsics as AS built-in functions. This is used by AssemblyScript-based audio DSP libraries (real-time filters, synthesizers) and GPU-less ML inference tools that want SIMD acceleration with minimal toolchain complexity.

---

## Example 68: Runtime SIMD Detection and Alternate Module Loading

Even though fixed SIMD is universally available, older embedded browsers (Smart TVs, car infotainment, some kiosk systems) may not support it. The `wasm-feature-detect` library enables serving optimized builds to capable browsers and safe fallbacks to others.

```javascript
// simd-detect.js — detect SIMD and load appropriate module
import { simd, relaxedSimd } from "wasm-feature-detect"; // => version 1.8.0

async function loadBestModule() {
  const [hasSimd, hasRelaxedSimd] = await Promise.all([
    simd(), // => fixed SIMD: Chrome 91+, Firefox 89+, Safari 16.4+
    relaxedSimd(), // => relaxed SIMD: Chrome/Firefox/Edge shipped; Safari: flag
  ]);

  let wasmUrl;
  if (hasRelaxedSimd) {
    wasmUrl = "/wasm/compute-relaxed-simd.wasm"; // => fastest: uses f32x4.relaxed_madd
  } else if (hasSimd) {
    wasmUrl = "/wasm/compute-simd.wasm"; // => fast: uses f32x4.add, i32x4.mul
  } else {
    wasmUrl = "/wasm/compute-scalar.wasm"; // => universal fallback: no SIMD
  }

  const { instance } = await WebAssembly.instantiateStreaming(fetch(wasmUrl), {});
  return instance;
}

const instance = await loadBestModule();

// All three modules export the same function signature
console.log(instance.exports.sumArray(1000)); // => same result, different performance
```

```bash
# Build three variants with different SIMD levels (Rust + wasm-pack example)
RUSTFLAGS="-C target-feature=+simd128,+relaxed-simd" wasm-pack build --target web --release
# => builds with Relaxed SIMD enabled (fastest)

RUSTFLAGS="-C target-feature=+simd128" wasm-pack build --target web --release
# => builds with fixed SIMD only

wasm-pack build --target web --release
# => scalar build (no SIMD target features)
```

**Key Takeaway**: Use `wasm-feature-detect`'s `simd()` and `relaxedSimd()` to detect SIMD capability and serve the best-performing module variant. Build three versions (relaxed SIMD, fixed SIMD, scalar) with `RUSTFLAGS` target feature flags.

**Why It Matters**: Progressive SIMD enhancement follows the same principle as progressive web enhancement: provide the best experience capable devices can handle, with safe fallbacks for everything else. WebGL polyfills use this pattern; Wasm ML inference libraries (onnxruntime-web) ship 3-4 WASM backends (SIMD, non-SIMD, WebGPU delegate, WASM threads) and select at runtime. The `Promise.all([simd(), relaxedSimd()])` pattern does both detections in parallel, avoiding sequential await latency.

---

## Example 69: WasmGC Types in WAT — struct.new and array.new

WasmGC (Garbage Collection) became Baseline on December 11, 2024 (Chrome 119+, Firefox 120+, Safari 18.2+, Edge 119+). It adds GC-managed heap types: `struct` (named fields) and `array` (typed elements), enabling managed languages (Kotlin, Dart, Java) to compile to Wasm without embedding their own GC.

```wat
;; wasmgc-types.wat — struct and array GC heap types (Wasm 3.0)
(module
  ;; Define a struct type with two i32 fields
  (type $Point (struct
    (field $x i32)   ;; => named field $x of type i32
    (field $y i32)   ;; => named field $y of type i32
  ))

  ;; Define an array type of i32 elements
  (type $IntArray (array (mut i32)))  ;; => mutable i32 array (GC-managed)

  ;; Create a Point struct on the GC heap
  (func (export "makePoint")
    (param $x i32) (param $y i32) (result (ref $Point))
    local.get $x              ;; => push x
    local.get $y              ;; => push y
    struct.new $Point         ;; => allocate Point on GC heap with {x, y}
                               ;; => returns typed ref: (ref $Point)
                               ;; => GC owns the allocation; no manual free
  )

  ;; Read x field from a Point
  (func (export "getX")
    (param $p (ref $Point)) (result i32)
    local.get $p              ;; => push Point reference
    struct.get $Point $x      ;; => load field $x from the struct
                               ;; => pushes x value as i32
  )

  ;; Create a GC-managed i32 array of length n
  (func (export "makeArray")
    (param $len i32) (result (ref $IntArray))
    i32.const 0               ;; => default initial value for all elements
    local.get $len            ;; => array length
    array.new $IntArray       ;; => allocate GC array of $len i32s, all initialized to 0
                               ;; => GC manages lifetime; no malloc/free needed
  )

  ;; Set element in GC array
  (func (export "setElement")
    (param $arr (ref $IntArray)) (param $idx i32) (param $val i32)
    local.get $arr            ;; => push array reference
    local.get $idx            ;; => push index
    local.get $val            ;; => push value
    array.set $IntArray       ;; => set arr[$idx] = $val (GC manages memory)
  )
)
```

**Key Takeaway**: WasmGC adds `struct` and `array` heap types managed by the runtime's GC. `struct.new` and `array.new` allocate on the GC heap; `struct.get` and `array.get/set` access fields and elements. No `free` is needed — the GC handles collection.

**Why It Matters**: WasmGC is what makes managed languages viable in WebAssembly without shipping an entire runtime GC in the binary. Before WasmGC, Kotlin/Wasm had to embed a GC in the Wasm binary (~500 KB overhead). With WasmGC, Kotlin/Wasm binaries are much smaller because they use the browser's built-in GC (V8's or SpiderMonkey's). This is a fundamental shift: the browser becomes a polyglot runtime that can run Kotlin, Dart, Java, and OCaml code with native GC integration, not just JavaScript and C/Rust-style manual memory languages.

---

## Example 70: Typed Function References — call_ref and ref.func

Typed function references enable first-class functions in Wasm: storing function pointers in variables, calling them indirectly via `call_ref`, and comparing them. This is more type-safe than the untyped `call_indirect` instruction.

```wat
;; typed-refs.wat — typed function references (Wasm 3.0)
(module
  ;; A function type for int → int transforms
  (type $IntTransform (func (param i32) (result i32)))

  ;; Two concrete transform functions
  (func $double (param $x i32) (result i32)
    local.get $x               ;; => push x
    i32.const 2                ;; => push 2
    i32.mul                    ;; => x * 2
  )

  (func $addTen (param $x i32) (result i32)
    local.get $x               ;; => push x
    i32.const 10               ;; => push 10
    i32.add                    ;; => x + 10
  )

  ;; Apply a typed function reference to a value
  (func (export "applyTransform")
    (param $fn (ref $IntTransform))  ;; => typed function reference parameter
    (param $x i32)
    (result i32)
    local.get $x                     ;; => push the input value
    local.get $fn                    ;; => push the function reference
    call_ref $IntTransform           ;; => call the function via reference (typed call)
                                      ;; => type-checked at validation time (safer than call_indirect)
  )

  ;; Get a typed function reference to $double
  (func (export "getDouble") (result (ref $IntTransform))
    ref.func $double            ;; => push typed reference to $double function
                                 ;; => type: (ref $IntTransform)
  )

  ;; Get a typed function reference to $addTen
  (func (export "getAddTen") (result (ref $IntTransform))
    ref.func $addTen            ;; => push typed reference to $addTen function
  )
)
```

```javascript
// typed-refs-usage.js — using typed function references from JS
const { instance } = await WebAssembly.instantiateStreaming(fetch("/wasm/typed-refs.wasm"), {});
const { applyTransform, getDouble, getAddTen } = instance.exports;

const double = getDouble(); // => Wasm function reference object
const addTen = getAddTen(); // => another function reference object

console.log(applyTransform(double, 5)); // => 10 (5 * 2)
console.log(applyTransform(addTen, 5)); // => 15 (5 + 10)
```

**Key Takeaway**: Typed function references (`(ref $FuncType)`) store callable functions as values. `ref.func $f` creates a reference; `call_ref $type` calls it. References are type-checked at validation time — safer and more expressive than untyped `funcref`.

**Why It Matters**: Typed function references are the building block for higher-order functions, closures (combined with WasmGC structs), and virtual dispatch in compiled object-oriented languages. Kotlin/Wasm uses typed function references for virtual method dispatch — each Kotlin class has a method table of typed function references, and virtual calls use `call_ref` instead of untyped `call_indirect`. This gives the Wasm runtime sufficient type information to generate optimized machine code for virtual dispatch — similar to inline caches in modern JavaScript engines.

---

## Example 71: Kotlin/Wasm and WasmGC in the Browser

Kotlin/Wasm (Kotlin 2.x) uses WasmGC for its object model, enabling Kotlin code to compile to Wasm and run in browsers without a bundled GC. It became production-viable in all major browsers with WasmGC Baseline support (December 11, 2024).

```bash
# Set up a Kotlin/Wasm project using Gradle
# Requires: Kotlin 2.x, Gradle 8+

# Kotlin Gradle build file (build.gradle.kts)
# kotlin("multiplatform") {
#   wasmJs {
#     binaries.executable()
#     browser {}
#   }
# }

# Build Kotlin/Wasm output
./gradlew wasmJsBrowserDistribution
# => produces:
# => build/dist/wasmJs/productionExecutable/
# =>   app.wasm          — Wasm binary using WasmGC types
# =>   app.mjs           — JavaScript module loader
# =>   app.wasm.map      — source map for debugging

# Inspect the Wasm binary
wasm-objdump -x build/dist/.../app.wasm | head -30
# => Section Details:
# => Type[N]: includes struct types (WasmGC struct declarations)
# => Import: Kotlin runtime imports from JS host
# => Export: Kotlin exported declarations
# => Note: binary uses GC types extensively (struct.new, array.new, call_ref)
```

```kotlin
// Main.kt — simple Kotlin/Wasm exported function
import kotlinx.browser.document

@JsExport  // => marks function as exported to JavaScript
fun greetFromKotlin(name: String): String {
    return "Hello, $name! From Kotlin/Wasm!"
    // => String type uses WasmGC string representation
    // => no manual memory management needed
}

fun main() {
    val element = document.getElementById("output")
    element?.textContent = "Kotlin/Wasm is running!"
    // => WasmGC manages the String and element reference lifetimes
}
```

**Key Takeaway**: Kotlin/Wasm uses WasmGC `struct` and `array` types for its object model, making it viable in all major browsers since December 11, 2024. `@JsExport` marks functions for JS use. WasmGC eliminates the need for a bundled GC runtime.

**Why It Matters**: WasmGC support in browsers opens a new era of language diversity on the web. Kotlin/Wasm is the first major managed language to be production-ready in browsers via WasmGC — and Dart 3 (Flutter Web) is following the same path. For Android developers building cross-platform apps, Kotlin Multiplatform Mobile (KMM) with Kotlin/Wasm means sharing business logic between Android, iOS, and web without writing JavaScript or TypeScript. The WasmGC Baseline (Dec 2024) is the inflection point that makes this architecturally sound.

---

## Example 72: Exception Handling in WAT

WebAssembly 3.0 exception handling uses `tag` declarations, `throw`, and `try`/`catch`/`exnref`. Tags are typed markers for exceptions — similar to typed exception classes. This enables zero-overhead exception handling in languages like C++, Rust, and Java compiled to Wasm.

```wat
;; exceptions.wat — Wasm 3.0 exception handling
(module
  ;; Import exception tag from host (JavaScript can create and use tags)
  (import "env" "divisionByZero"
    (tag $divisionByZero (param)))  ;; => tag with no parameters (just a marker)

  ;; Another tag for arithmetic overflow, carries an i32 value
  (tag $overflow (param i32))       ;; => tag that carries an i32 error code

  ;; Export both tags so JS can create and catch matching exceptions
  (export "overflow" (tag $overflow))

  ;; Divide with exception handling
  (func (export "safeDivide")
    (param $a i32) (param $b i32) (result i32)
    local.get $b               ;; => push divisor
    i32.const 0                ;; => push 0
    i32.eq                     ;; => b == 0?
    if
      throw $divisionByZero    ;; => throw exception with $divisionByZero tag
                                ;; => control immediately unwinds to nearest catch
                                ;; => no code after throw executes
    end

    local.get $a               ;; => push dividend
    local.get $b               ;; => push divisor
    i32.div_s                  ;; => signed integer division (traps if b=0 normally)
                                ;; => but we checked above, so b != 0 here
  )

  ;; Demonstrate try/catch
  (func (export "divideWithCatch")
    (param $a i32) (param $b i32) (result i32)
    try (result i32)             ;; => try block that produces one i32 result
      local.get $a
      local.get $b
      call $safeDivide           ;; => may throw $divisionByZero
    catch $divisionByZero        ;; => catch if $divisionByZero is thrown
      i32.const -1               ;; => return -1 as sentinel for "division by zero"
    end                          ;; => end of try/catch
  )
)
```

**Key Takeaway**: Wasm 3.0 exceptions use typed `tag` declarations, `throw $tag value` for raising, and `try`/`catch $tag`/`end` for structured catching. Tags carry typed payload values; unhandled throws propagate to the host (JS) as `WebAssembly.Exception` objects.

**Why It Matters**: Before standardized exception handling, Emscripten and Rust's wasm-bindgen simulated exceptions via setjmp/longjmp — a slow approach that used a per-function overhead even in the no-exception case. Wasm exception handling is zero-overhead in the non-throwing path (like C++ zero-cost exceptions) and enables exceptions to propagate across Wasm function call boundaries naturally. C++ code that uses `try/catch` for resource cleanup (RAII) compiles correctly with `-s DISABLE_EXCEPTION_CATCHING=0` in modern Emscripten, using these native exception instructions.

---

## Example 73: Catching Wasm Exceptions in JavaScript

Wasm exceptions thrown with `throw` propagate to the JavaScript host when uncaught in Wasm. JavaScript uses the `WebAssembly.Tag` and `WebAssembly.Exception` APIs to create, match, and inspect Wasm exceptions.

```javascript
// exception-host.js — Wasm exceptions in JavaScript

// Create a WebAssembly.Tag that matches the Wasm $divisionByZero tag
const divByZeroTag = new WebAssembly.Tag({
  parameters: [], // => tag with no parameters (same signature as $divisionByZero WAT tag)
});

const { instance } = await WebAssembly.instantiateStreaming(fetch("/wasm/exceptions.wasm"), {
  env: {
    divisionByZero: divByZeroTag, // => inject JS tag, matches WAT (import "env" "divisionByZero")
  },
});

// Calling a function that may throw a Wasm exception
try {
  const result = instance.exports.safeDivide(10, 0); // => throws $divisionByZero
  console.log(result); // => never reached
} catch (e) {
  // e is a WebAssembly.Exception (or regular Error if something else went wrong)
  if (e instanceof WebAssembly.Exception) {
    if (e.is(divByZeroTag)) {
      // => is() checks if this exception matches a specific tag
      console.log("Caught Wasm division by zero exception");
      // => e.getArg(divByZeroTag, 0) would get first parameter (none here)
    }
  } else {
    throw e; // => re-throw non-Wasm errors
  }
}

// Using the wrapped catch version from Wasm
const result = instance.exports.divideWithCatch(10, 0);
console.log(result); // => -1 (caught inside Wasm, returns sentinel)

// Throw a Wasm exception FROM JavaScript
const overflowTag = instance.exports.overflow; // => WebAssembly.Tag
// Throw with a payload value
const exc = new WebAssembly.Exception(overflowTag, [42]); // => payload: 42
throw exc; // => JS-originated Wasm exception (can be caught in Wasm try/catch)
```

**Key Takeaway**: `new WebAssembly.Tag({ parameters: [...] })` creates a JS-side tag matching a Wasm tag declaration. `catch` blocks receive `WebAssembly.Exception`; use `.is(tag)` to match and `.getArg(tag, index)` to extract payload values. JS can also throw Wasm exceptions using `new WebAssembly.Exception(tag, [values])`.

**Why It Matters**: The `WebAssembly.Tag` API enables bi-directional exception flow between Wasm and JavaScript — Wasm throws, JS catches and inspects; JS throws Wasm-typed exceptions, Wasm catches them. This is essential for language runtimes compiled to Wasm that use exceptions as their primary control flow mechanism (Java exceptions, C++ exceptions, Python exceptions). Without this, exceptions crossing the Wasm–JS boundary either crash or convert to opaque errors. The tag-matching mechanism is type-safe: only code that has a reference to the `Tag` object can create or match that exception type.

---

## Example 74: JS String Builtins — Zero-Glue String Operations

JS String Builtins (Wasm 3.0) import JavaScript's native string operations directly from the `wasm:js-string` virtual module. This eliminates the pointer+length glue code for string operations, reducing bundle size and improving performance for string-heavy Wasm code.

```wat
;; js-string-builtins.wat — zero-glue JS string operations (Wasm 3.0)
(module
  ;; Import JS string operations from the special "wasm:js-string" virtual module
  (import "wasm:js-string" "length"
    (func $str_length (param externref) (result i32)))
  ;; => externref is a reference to a JS value (here: a JS string)
  ;; => str_length(jsStringRef) returns the .length property

  (import "wasm:js-string" "concat"
    (func $str_concat (param externref externref) (result externref)))
  ;; => concatenates two JS strings, returns a new JS string reference

  (import "wasm:js-string" "fromCharCode"
    (func $from_char_code (param i32) (result externref)))
  ;; => String.fromCharCode(codePoint) — creates a JS string from a char code

  ;; Use the imported string functions
  (func (export "getStringLength")
    (param $s externref) (result i32)
    local.get $s               ;; => push JS string reference
    call $str_length           ;; => calls JS String.prototype.length getter
                                ;; => no ptr+len encoding needed — direct call
  )

  (func (export "joinStrings")
    (param $a externref) (param $b externref) (result externref)
    local.get $a               ;; => push first string reference
    local.get $b               ;; => push second string reference
    call $str_concat           ;; => JS string concatenation
                                ;; => returns new JS string reference
  )
)
```

```javascript
// js-string-builtins-host.js
// Feature: JS String Builtins is available in Chrome 119+, Firefox 120+

const { instance } = await WebAssembly.instantiateStreaming(
  fetch("/wasm/js-string-builtins.wasm"),
  {}, // => no import object needed — "wasm:js-string" is a virtual module
);

// Pass JS strings directly as externref — no encoding to UTF-8 bytes!
const len = instance.exports.getStringLength("Hello, Wasm!");
console.log(len); // => 12

const joined = instance.exports.joinStrings("Hello, ", "WebAssembly!");
console.log(joined); // => "Hello, WebAssembly!" (a real JS string, no decoding needed)
```

**Key Takeaway**: JS String Builtins (`wasm:js-string` imports) expose native JS string operations to Wasm as `externref`-based functions. No UTF-8 encoding/decoding, no pointer+length — JS strings are passed as opaque references and manipulated by JS-native operations.

**Why It Matters**: The traditional ptr+len string convention requires: JS TextEncoder → alloc in Wasm heap → copy → call → TextDecoder → copy back. For a string-heavy Wasm application (text editor engine, search, internationalization), these copies add up to significant overhead. JS String Builtins eliminate them entirely — a Wasm function that calls JavaScript's `String.prototype.indexOf` via the built-in operates directly on the JS string without any intermediate representation. This is particularly important for language runtimes like Kotlin/Wasm and Dart that use strings extensively.

---

## Example 75: Writing a WIT Interface File

WIT (Wasm Interface Types) is the interface definition language for the WebAssembly Component Model. A `.wit` file defines the types, functions, interfaces, and worlds that components expose and consume. `wit-bindgen` v0.57.1 generates language bindings from WIT.

```wit
// calculator.wit — a WIT interface definition for a calculator component
// WIT files describe the API contract between components

package example:calculator@0.1.0;
// => package name: "example", namespace "calculator", version 0.1.0
// => follows semver for API compatibility tracking

// Define a named interface (group of related functions and types)
interface math {
  // A record type: equivalent to a Rust struct or TypeScript object type
  record calculation-result {
    value: f64,           // => computed result
    overflow: bool,       // => true if result overflowed
    error-message: option<string>,  // => Some(msg) if error occurred
  }

  // Variants: sum type (like Rust enum or TypeScript union)
  variant calc-error {
    division-by-zero,     // => no payload
    overflow(f64),        // => payload: the overflowing value
    invalid-input(string),// => payload: error message
  }

  // Function declarations in the interface
  add: func(a: f64, b: f64) -> f64;
  // => takes two f64, returns f64

  safe-divide: func(a: f64, b: f64) -> result<f64, calc-error>;
  // => returns ok(f64) on success, err(calc-error) on failure

  batch-sum: func(values: list<f64>) -> calculation-result;
  // => takes a list of f64, returns a record
}

// World: defines what a component imports and exports
world calculator-world {
  export math;    // => this component EXPORTS the math interface
  // import ...; // => this component would IMPORT other interfaces
}
```

**Key Takeaway**: A `.wit` file defines the Component Model API in an IDL: `interface` groups functions and types; `world` declares what a component exports and imports. Core WIT types: `u32`, `f64`, `string`, `bool`, `list<T>`, `option<T>`, `result<T, E>`, `record`, `variant`.

**Why It Matters**: WIT is the contract language of the Component Model — the WebAssembly equivalent of an OpenAPI spec or a Protobuf schema. When two components are composed (Example 78), their imports and exports must match WIT types exactly. WIT also generates TypeScript types, Rust types, Go types, and more via language-specific backends — enabling type-safe cross-language component composition. As WASI grows as the cloud-edge standard, WIT becomes the universal API contract layer for distributed Wasm systems.

---

## Example 76: Generating Rust Guest Bindings from WIT with wit-bindgen

`wit-bindgen` v0.57.1 (April 17, 2026) generates Rust code from a WIT interface file, providing type-safe bindings for implementing Wasm components as guests. The generated code handles serialization/deserialization of WIT types to/from the Component Model's canonical ABI.

```bash
# Install wit-bindgen CLI
cargo install wit-bindgen-cli      # => installs wit-bindgen 0.57.1

# Generate Rust bindings from WIT
wit-bindgen rust calculator.wit    # => generates src/bindings.rs (or similar)
                                    # => contains:
                                    # => - trait definitions matching WIT interfaces
                                    # => - type definitions for records, variants, etc.
                                    # => - export macros that implement the Component Model ABI

# Or use wit-bindgen as a build dependency (in build.rs):
# wit_bindgen::generate!({
#     world: "calculator-world",
#     path: "wit/calculator.wit",
# });
```

```rust
// src/lib.rs — implementing WIT-generated guest bindings
// Generated bindings provide a trait; we implement it
wit_bindgen::generate!({
    world: "calculator-world",
    path: "wit/calculator.wit",  // => path to the .wit file
});

struct MyCalculator; // => our implementation struct

impl exports::example::calculator::math::Guest for MyCalculator {
    // Implement each function declared in the WIT interface
    fn add(a: f64, b: f64) -> f64 {
        a + b   // => simple addition; WIT-generated code handles ABI
    }

    fn safe_divide(
        a: f64, b: f64
    ) -> Result<f64, exports::example::calculator::math::CalcError> {
        if b == 0.0 {
            Err(exports::example::calculator::math::CalcError::DivisionByZero)
            // => maps to WIT variant division-by-zero
        } else {
            Ok(a / b) // => maps to WIT result ok(f64)
        }
    }

    fn batch_sum(
        values: Vec<f64>
    ) -> exports::example::calculator::math::CalculationResult {
        let sum: f64 = values.iter().sum(); // => sum all values
        let overflow = sum.is_infinite();    // => check for overflow
        exports::example::calculator::math::CalculationResult {
            value: sum,
            overflow,
            error_message: if overflow { Some("overflow".to_string()) } else { None },
        }
    }
}

// Register our implementation — required by wit-bindgen macro
export!(MyCalculator);
```

**Key Takeaway**: `wit-bindgen::generate!({ world: "...", path: "wit/..." })` generates Rust trait definitions from a `.wit` file. Implement the generated trait for your struct and register with `export!(YourStruct)`. WIT types map to Rust types (list→Vec, option→Option, result→Result, record→struct).

**Why It Matters**: `wit-bindgen` eliminates hand-writing serialization glue code for the Component Model's canonical ABI. Without it, implementing a component would require manually encoding every type into the component's linear memory according to a complex binary specification. With it, you write normal Rust structs and functions that match WIT types, and the generated code handles all encoding. This is analogous to how gRPC and Protocol Buffers eliminated hand-written network serialization — `wit-bindgen` does the same for Wasm components.

---

## Example 77: Building a WASIp2 Component with cargo component

`cargo component` is the Cargo subcommand for building WASIp2 components — Wasm binaries that implement a WIT world and use the Component Model's canonical ABI. WASIp2 (released January 25, 2024) is the current stable WASI version using the Component Model.

```bash
# Install cargo-component
cargo install cargo-component       # => installs cargo component subcommand

# Create a new WASIp2 component project
cargo component new --lib calculator-component
cd calculator-component
# => creates:
# =>   src/lib.rs            — guest implementation
# =>   Cargo.toml            — with wit-bindgen dependency
# =>   wit/world.wit         — WIT interface (edit to match your API)

# Edit wit/world.wit to use our calculator.wit interface
# (copy calculator.wit to wit/ directory)

# Build the WASIp2 component
cargo component build --release
# => compiles Rust to wasm32-wasip2 target (NOT wasm32-wasip1)
# => links with wit-bindgen generated bindings
# => produces target/wasm32-wasip2/release/calculator_component.wasm

# Inspect the component
wasm-tools component wit calculator_component.wasm
# => prints the WIT interface embedded in the component binary
# => useful for verifying the component exposes the correct interface

# Validate the component structure
wasm-tools validate calculator_component.wasm
# => validates Component Model ABI compliance
```

```toml
# Cargo.toml for a cargo-component project
[package]
name = "calculator-component"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]  # => C dynamic library (Wasm output)

[dependencies]
wit-bindgen = "0.37"     # => wit-bindgen code generator (version managed by cargo-component)

[package.metadata.component]
package = "example:calculator"  # => component package identifier
```

**Key Takeaway**: `cargo component build` compiles a Rust WASIp2 component targeting `wasm32-wasip2`. The project includes a `wit/` directory with WIT definitions; `cargo-component` handles `wit-bindgen` code generation and component wrapping automatically.

**Why It Matters**: WASIp2 with the Component Model is the future of server-side Wasm. Components are the unit of composition, versioning, and distribution for Wasm on the server — equivalent to npm packages or Docker images but with a standardized binary interface and strong isolation. `cargo-component` is the production tool for Rust developers targeting this ecosystem. Platforms like Cloudflare Workers, Fastly Compute, and Fermyon Spin all support WASIp2 components, making this the standard for edge Wasm deployment.

---

## Example 78: Composing Two Components with wac plug

`wac` (WebAssembly Composition tool) composes multiple Wasm components by connecting their imports and exports. `wac plug` satisfies the imports of one component with the exports of another, producing a new composed component.

```bash
# Install wac
cargo install wac-cli               # => installs wac CLI tool

# Scenario: two components
# calculator-component.wasm: exports math interface
# app-component.wasm:        imports math interface, uses it

# Verify component interfaces
wasm-tools component wit calculator-component.wasm
# => exports: math interface (add, safe-divide, batch-sum)

wasm-tools component wit app-component.wasm
# => imports: math interface (needs add, safe-divide, batch-sum)
# => exports: run function

# Compose: plug calculator into app
wac plug \
  --plug calculator-component.wasm \  # => provider: satisfies imports
  app-component.wasm \                 # => consumer: has unsatisfied math imports
  -o composed.wasm                     # => output: fully composed component

# => wac matches app's math import against calculator's math export
# => creates composed.wasm with no remaining unsatisfied imports (for math)

# Verify the composition
wasm-tools component wit composed.wasm
# => imports: (none — math was satisfied)
# => exports: run (from app-component)

wasm-tools validate composed.wasm    # => validate composed component ABI
```

**Key Takeaway**: `wac plug --plug provider.wasm consumer.wasm -o composed.wasm` satisfies `consumer`'s imports with `provider`'s matching exports. The result is a new component with all matched interfaces internally linked.

**Why It Matters**: Component composition is the Component Model's killer feature for software distribution. Instead of npm packages that are bundles of JavaScript, WIT-described components are language-agnostic binary packages with typed interface contracts. A Go-implemented database client component, a Rust-implemented HTTP library component, and a JavaScript-implemented business logic component can be composed together into a single deployable unit — all type-checked by WIT interfaces, not by convention. This is the vision behind WASI: a polyglot component ecosystem where language boundaries are invisible.

---

## Example 79: Running a Composed Component with Wasmtime

Wasmtime v44.0.0 (April 20, 2026) runs WASIp2 components with `wasmtime serve` and `wasmtime run`. WASIp2 components have richer capability grants than WASIp1 modules.

```bash
# Run a composed WASIp2 component
wasmtime run composed.wasm           # => executes the 'run' export
                                      # => WASIp2: capabilities from --wasi flags

# Run with specific WASIp2 capabilities
wasmtime run \
  --wasi inherit-stdio \             # => inherit host stdin/stdout/stderr
  --wasi inherit-env \               # => inherit host environment variables
  composed.wasm

# Run an HTTP server component (wasmtime serve)
# Requires component exporting wasi:http/incoming-handler
wasmtime serve \
  --addr 0.0.0.0:8080 \             # => bind to port 8080
  http-server.wasm                   # => component implementing wasi:http

# wasmtime run for a WASI CLI component
wasmtime run \
  --dir /data::/data \              # => preopen /data directory
  --env DB_URL=sqlite:///data/db.sqlite \
  database-tool.wasm

# Check Wasmtime version and supported WASI versions
wasmtime --version         # => wasmtime-cli 44.0.0
# Wasmtime v44 supports:
# => WASIp1 (stable, full)
# => WASIp2 (stable, full)
# => WASIp3 (experimental, --wasi preview3)
```

**Key Takeaway**: `wasmtime run` executes WASIp2 components with capability grants via `--wasi` flags. `wasmtime serve` runs HTTP server components implementing `wasi:http`. Wasmtime v44.0.0 supports WASIp1, WASIp2, and experimental WASIp3.

**Why It Matters**: Wasmtime is the reference implementation of the WASI specification — when it passes its test suite, that defines correct behavior. The `wasmtime serve` command is the foundation for Wasmtime-based HTTP platforms: a WASIp2 component implementing `wasi:http/incoming-handler` is a complete HTTP handler with no framework dependency. This is the architectural model for Spin (Fermyon's Wasm framework), Cloudflare Workers with Component Model support, and Fastly Compute. The security boundary is explicit: a component serving HTTP with no `--dir` grant cannot access the filesystem, regardless of what code it contains.

---

## Example 80: JavaScript Component Guest with componentize-js

`componentize-js` (part of the jco toolchain) compiles JavaScript to a WASIp2 Wasm component. This enables JavaScript code to be packaged as a Component Model component, interoperable with Rust/Go/C components via WIT interfaces.

```bash
# Install jco (JavaScript component toolchain)
npm install -g @bytecodealliance/jco   # => jco CLI
npm install @bytecodealliance/componentize-js # => JS to component compiler

# Write JavaScript implementing a WIT world
cat > src/impl.js << 'EOF'
// Implements the WIT interface functions
export function add(a, b) {
    return a + b;  // => implements math.add from WIT
}

export function safeDivide(a, b) {
    if (b === 0) {
        // Return WIT result<f64, calc-error>::err(division-by-zero)
        return { tag: 'err', val: { tag: 'division-by-zero' } };
    }
    return { tag: 'ok', val: a / b }; // => WIT result<f64, calc-error>::ok(a/b)
}
EOF

# Compile JS to a WASIp2 component
npx componentize-js \
  --wit wit/calculator.wit \     # => WIT interface definition
  --world-name calculator-world \# => which world to target
  --out calculator-js.wasm \     # => output component
  src/impl.js                     # => JavaScript source
# => wraps JS in a Wasm+JS bridge
# => produces a Wasm component implementing the WIT world

# Validate the JS component
wasm-tools validate calculator-js.wasm
# => validates Component Model compliance

# Compose the JS component with an app component
wac plug \
  --plug calculator-js.wasm \
  app-component.wasm \
  -o composed-with-js.wasm
# => JS and Rust components composed together — language-agnostic composition
```

**Key Takeaway**: `componentize-js` compiles JavaScript implementing WIT interfaces to a WASIp2 Wasm component. The resulting component is indistinguishable from a Rust or Go component — all that matters is the WIT interface contract.

**Why It Matters**: JavaScript componentization enables the Component Model's language agnosticism to include JS — the world's most widely used language. A team can prototype a component in JavaScript, then port performance-critical parts to Rust while keeping the same WIT interface — the composed system is unaffected by the implementation language change. `jco` is the BytecodeAlliance's tool for JavaScript component tooling, developed alongside the WASI specification. This is early but rapidly maturing — the patterns established by `componentize-js` will define how JavaScript participates in the WASI ecosystem.

---

## Example 81: WASIp3 Async — future<T> and stream<T> in WIT

WASIp3 (released February 2026) adds native async I/O to WASI via `future<T>` and `stream<T>` types in WIT, and corresponding Rust async guest APIs. Wasmtime v44.0.0 supports WASIp3 experimentally.

```wit
// async-service.wit — WASIp3 async types in WIT
package example:async-service@0.1.0;

interface data-service {
  // future<T>: a single async value (like a Promise)
  fetch-data: func(url: string) -> future<result<string, string>>;
  // => caller awaits this future to get the result
  // => future<result<string, string>>: async result that is either ok(string) or err(string)

  // stream<T>: a sequence of async values (like an async iterator or ReadableStream)
  stream-lines: func(url: string) -> stream<string>;
  // => yields lines from the URL one by one as they arrive
  // => consumer iterates the stream asynchronously

  // Async input: accept a stream parameter
  process-stream: func(data: stream<u8>) -> future<u64>;
  // => reads a byte stream (e.g., upload), returns total bytes processed
}

world async-world {
  export data-service;
}
```

```rust
// src/lib.rs — WASIp3 async guest implementation (experimental)
// Requires: cargo-component with --wasi preview3 support
// Wasmtime v44.0.0 experimental support: wasmtime run --wasi preview3

wit_bindgen::generate!({
    world: "async-world",
    path: "wit/async-service.wit",
    async: true,          // => enable async guest support (WASIp3)
});

struct MyService;

#[async_trait::async_trait]  // => async trait implementation
impl exports::example::async_service::data_service::Guest for MyService {
    // async fn: returns a future<result<string, string>>
    async fn fetch_data(url: String) -> Result<String, String> {
        // => wasi:http is used for actual HTTP calls in WASIp3
        // => using std::io here for illustration
        Ok(format!("Data from: {}", url))   // => simulated fetch result
    }

    // Returns a stream<string>: yields items one at a time
    async fn stream_lines(url: String) -> impl Stream<Item = String> {
        // => In real code: fetch URL, split by newlines, yield each line
        futures::stream::iter(vec![
            format!("Line 1 from {}", url),
            format!("Line 2 from {}", url),
        ])
    }
}

export!(MyService);
```

**Key Takeaway**: WASIp3 adds `future<T>` (single async value) and `stream<T>` (sequence of async values) as WIT types. Rust guests use `async fn` in trait implementations. Requires Wasmtime v44.0.0 with experimental `--wasi preview3` flag.

**Why It Matters**: WASIp2 has a fundamental limitation: every operation is synchronous (blocking) from the Wasm component's perspective — async is simulated via poll loops. WASIp3's native async types enable the Wasm runtime to suspend a component while waiting for I/O and run other components in the meantime, achieving true async multiplexing without threads. For server-side Wasm handling thousands of concurrent requests (Cloudflare Workers scale), this is the path to event-loop-driven Wasm that rivals Node.js's async model while maintaining strong isolation guarantees.

---

## Example 82: Memory64 — 64-bit Addressing in WAT

Memory64 enables `i64` addresses for Wasm memory, allowing modules to address up to 16 exabytes theoretically (web-capped at 16 GB). Available in Chrome/Firefox/Edge; Safari is lagging as of 2026.

```wat
;; memory64.wat — Memory64 with i64 addresses (Wasm 3.0)
(module
  ;; Declare 64-bit memory: i64 addresses, 1 initial page, max 256 pages (16 MB)
  (memory i64 1 256)             ;; => i64 addressing: allows >4 GB future growth
                                  ;; => current web cap: 16 GB (browser limit)
                                  ;; => initial: 1 page (65536 bytes)
                                  ;; => max: 256 pages (16 MB)

  (export "memory" (memory 0))   ;; => export memory for JS access

  ;; Memory64 uses i64 for all address instructions
  (func (export "storeI64Addr")
    (param $addr i64) (param $val i32)  ;; => i64 address parameter
    local.get $addr                     ;; => push i64 address
    local.get $val                      ;; => push i32 value
    i32.store                           ;; => store using i64 address (Memory64)
                                         ;; => standard i32.store still stores 4 bytes
                                         ;; => but address arithmetic uses i64
  )

  ;; Load using i64 address
  (func (export "loadI64Addr")
    (param $addr i64) (result i32)
    local.get $addr                     ;; => push i64 address
    i32.load                            ;; => load from i64 address
  )

  ;; Query memory size (returns i64 for Memory64)
  (func (export "memorySize") (result i64)
    memory.size                         ;; => returns page count as i64 for Memory64
  )
)
```

```javascript
// memory64-check.js — detect Memory64 support before using
import { memory64 } from "wasm-feature-detect"; // => version 1.8.0

const hasMemory64 = await memory64();
// => true: Chrome/Firefox/Edge (shipped)
// => false: Safari (lagging as of 2026) — cannot use Memory64 modules

if (!hasMemory64) {
  console.warn("Memory64 not supported — use 32-bit memory module instead");
  // => load fallback module with i32 addressing
}
```

**Key Takeaway**: Memory64 uses `i64` addresses for Wasm memory, enabling theoretical access to 16 EB (web-capped at 16 GB). Declare with `(memory i64 initial max)`. Always detect support with `wasm-feature-detect`'s `memory64()` — Safari does not support Memory64 as of 2026.

**Why It Matters**: The 32-bit address limit of standard Wasm is 4 GB, which is insufficient for workloads like in-browser scientific computing (large simulation state), machine learning model weights (LLaMA models are 7-70 GB), and large dataset processing. Memory64 lifts this limit for capable platforms. The Safari lag means Memory64 is not yet a universally deployable feature — applications targeting all browsers must either provide a 32-bit fallback or restrict Memory64 features to non-Safari users. Database-in-browser applications (WasmSQLite, WasmDuckDB) benefit most from Memory64's extended address range.

---

## Example 83: Multi-Memory Modules — Separate Internal and Shared Memory

Multi-memory (Wasm 3.0) allows a module to declare or import more than one memory. This enables architectural separation: private internal memory for sensitive data, shared public memory for communication, or specialized memory regions for different subsystems.

```wat
;; multi-memory.wat — multiple memories in one module (Wasm 3.0)
(module
  ;; First memory: internal/private heap
  (memory $internal 4)          ;; => 4 pages (256 KiB) internal to this module
                                  ;; => not exported: JS cannot access this

  ;; Second memory: shared communication buffer
  (memory $shared 2)            ;; => 2 pages (128 KiB) communication buffer
  (export "shared" (memory $shared)) ;; => exported: JS reads from/writes to this

  ;; Write to the internal memory (private allocation)
  (func (export "writeInternal")
    (param $val i32)
    i32.const 0                  ;; => offset 0 in internal memory
    local.get $val               ;; => value to store
    i32.store                    ;; => stores to memory 0 ($internal) by default
  )

  ;; Write to the shared memory (explicit memory index)
  (func (export "writeShared")
    (param $offset i32) (param $val i32)
    local.get $offset            ;; => push offset
    local.get $val               ;; => push value
    i32.store (memory $shared)   ;; => explicitly targets $shared memory (memory 1)
                                  ;; => instruction has memory index operand
  )

  ;; Read from internal memory (module-private data)
  (func (export "readInternal") (result i32)
    i32.const 0                  ;; => offset 0
    i32.load                     ;; => loads from $internal (memory 0, default)
  )

  ;; Copy from shared to internal (cross-memory operation)
  (func (export "pullFromShared")
    (param $shared_offset i32) (param $internal_offset i32) (param $len i32)
    ;; memory.copy supports cross-memory copy with memory index operands
    local.get $internal_offset   ;; => destination offset
    local.get $shared_offset     ;; => source offset
    local.get $len               ;; => length in bytes
    memory.copy $internal $shared ;; => copy: from $shared to $internal
  )
)
```

**Key Takeaway**: Multi-memory modules declare multiple `(memory ...)` sections. Instructions target a specific memory with `(memory $name)` operands. Separate memories enable access control (export only the communication memory), performance isolation, and architectural clarity.

**Why It Matters**: Multi-memory enables security-by-isolation within a single Wasm module — the internal memory for cryptographic keys, session tokens, or sensitive computation state is not exportable to JavaScript. Only the communication buffer is exposed. This is a stronger boundary than process-level separation because the runtime enforces it at the instruction level — the module physically cannot expose an internal memory via the export mechanism. Database engines compiled to Wasm benefit from separate memories for their WAL buffer (shared) and internal B-tree storage (private).

---

## Example 84: Deploying WASI Components to Cloudflare Workers and Fastly Compute

Production WASI deployment targets: Cloudflare Workers (WASIp1/WASIp2 via workers-rs), Fastly Compute (WASIp1). Both platforms run Wasm in distributed edge data centers with strong isolation and pay-per-request billing.

```bash
# Cloudflare Workers with Rust (workers-rs crate)
# Install wrangler CLI (Cloudflare's deployment tool)
npm install -g wrangler     # => installs wrangler CLI

# Create a Cloudflare Workers Rust project
cargo install worker-build  # => build tool for workers-rs
wrangler generate my-worker https://github.com/cloudflare/workers-rs/tree/main/worker-template
cd my-worker
```

```toml
# Cargo.toml for Cloudflare Workers
[dependencies]
worker = "0.4"   # => Cloudflare workers-rs bindings
```

```rust
// src/lib.rs — Cloudflare Worker in Rust
use worker::*;

#[event(fetch)]
async fn main(req: Request, env: Env, ctx: Context) -> Result<Response> {
    // => runs on each HTTP request to the worker
    let path = req.path();          // => extract URL path
    let method = req.method();      // => HTTP method (GET, POST, etc.)

    // Access Cloudflare bindings (KV, Durable Objects, etc.)
    let kv = env.kv("MY_KV")?;     // => KV namespace binding

    Response::ok(format!("Path: {}, Method: {:?}", path, method))
    // => returns HTTP 200 with body
}
```

```bash
# Build and deploy
worker-build --release    # => compiles Rust to Wasm (wasm32-unknown-unknown)
wrangler deploy           # => uploads Wasm to Cloudflare edge network
                           # => deploys to 300+ edge locations globally

# Fastly Compute: WASIp1-based edge computing
cargo install fastly-cli  # => Fastly's CLI tool

# Create Fastly Compute project
fastly compute init --language=rust
# => scaffolds Rust project targeting Fastly's WASIp1 environment

fastly compute build      # => builds to wasm32-wasip1 target
fastly compute deploy     # => deploys to Fastly's edge network
```

**Key Takeaway**: Cloudflare Workers supports Rust-compiled Wasm via `workers-rs` (deploy with `wrangler`). Fastly Compute uses WASIp1 modules (deploy with `fastly compute deploy`). Both run Wasm in distributed edge data centers with sub-millisecond cold starts.

**Why It Matters**: Edge Wasm deployment is the production destination for WASI. Cloudflare Workers' Wasm support means a Rust module is deployed globally to 300+ data centers in minutes, with 0ms cold starts (Wasm is pre-compiled on Cloudflare's infrastructure). This is the architecture of Shopify's Oxygen platform (Remix on Cloudflare Workers), Cloudflare's own Zaraz product (JavaScript analytics orchestrator in Wasm), and any performance-sensitive edge API. The combination of Wasm's isolation guarantees and edge deployment's geographic distribution is uniquely powerful for low-latency, high-security API design.

---

## Example 85: ESM Source Phase Imports — import source mod from './mod.wasm'

ESM Source Phase Imports (TC39 Stage 3, Chrome 131+, Deno) enable `import source mod from './mod.wasm'` — a static Wasm module import that is compiled at module parse time and available synchronously as a `WebAssembly.Module` without `fetch` or `await`.

```javascript
// esm-source-phase.js — ESM Source Phase Imports (Chrome 131+, Deno)
// This syntax is TC39 Stage 3 (not yet Stage 4/final)
// Available: Chrome 131+ (shipped), Deno (shipped), Firefox/Safari: pending

// Static import: compiled at module evaluation time, no await needed
import source calculatorMod from "./calculator.wasm";
// => calculatorMod is a WebAssembly.Module (already compiled!)
// => the .wasm file is fetched and compiled during module parse/eval
// => no need for fetch() + instantiateStreaming()

// Instantiate from the pre-compiled module (synchronous module reference)
const { instance: calc } = await WebAssembly.instantiate(
  calculatorMod, // => already a WebAssembly.Module — no re-compilation
  {},
);
console.log(calc.exports.add(3, 4)); // => 7

// Source phase import enables static analysis by bundlers:
// => Webpack/Vite can determine the .wasm dependency at build time
// => Tree-shaking: unused .wasm files not bundled
// => Pre-compilation: bundler can pre-warm the .wasm before it's needed

// Compare to dynamic import (requires await):
// const { default: wasmMod } = await import("./calculator.wasm", { assert: { type: "wasm" } });
// => No standard assert syntax for wasm yet
// => ESM Source Phase is the standardized path

// With Workers (Deno Deploy, Cloudflare Workers Module Syntax):
// Cloudflare Workers already uses a similar pattern:
// import wasm from './binary.wasm';  // => WebAssembly.Module in Workers runtime
// export default { async fetch(req) { ... } }
```

```bash
# Vite: requires explicit Wasm plugin for source phase (experimental 2026)
# Chrome 131+ supports the syntax natively in the browser
# Deno: supports source phase imports for .wasm out of the box

# Test in Deno:
deno run --allow-read esm-source-phase.js
# => Output: 7

# Build with Vite (when plugin support stabilizes):
# vite build --config vite-wasm-source.config.ts
```

**Key Takeaway**: `import source mod from './mod.wasm'` (ESM Source Phase, TC39 Stage 3) imports a `.wasm` file as a pre-compiled `WebAssembly.Module` at module parse time. Available in Chrome 131+ and Deno. Enables static analysis and bundler tree-shaking of Wasm dependencies.

**Why It Matters**: ESM Source Phase Imports are the final piece of seamless Wasm integration into the JavaScript module system. Currently, Wasm loading always requires asynchronous `fetch` + `instantiateStreaming` — an awkward two-step that prevents Wasm from being a first-class module citizen alongside JavaScript. Source Phase Imports treat `.wasm` files like `.js` modules: statically imported, compiled during module loading, and available as a value in module scope. Bundlers can analyze the complete dependency graph (JS + Wasm), tree-shake unused Wasm exports, and pre-compile all Wasm during the build step. This is where the Wasm-in-browsers story reaches its ergonomic conclusion — Wasm becomes just another module format in your project.

---
