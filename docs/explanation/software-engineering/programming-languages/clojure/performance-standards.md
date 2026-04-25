---
title: "Clojure Performance Standards"
description: Authoritative OSE Platform Clojure performance standards (lazy sequences, transducers, type hints, criterium benchmarking)
category: explanation
subcategory: prog-lang
tags:
  - clojure
  - performance
  - profiling
  - benchmarks
  - lazy-sequences
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Clojure Performance Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Clojure fundamentals from [AyoKoding Clojure Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/clojure/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Clojure tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines performance standards for Clojure development in OSE Platform. Follow the "make it work → make it right → make it fast" workflow — optimize only after profiling reveals a bottleneck.

**Target Audience**: OSE Platform Clojure developers optimizing data pipelines and financial calculations

**Scope**: Lazy sequences vs eager evaluation, transducers for collection processing, type hints for reflection elimination, criterium benchmarking, VisualVM/YourKit profiling, memoize for pure functions

## Software Engineering Principles

### 1. Automation Over Manual

**MUST** use `criterium` for automated, statistically rigorous benchmarking — not manual timing with `System/currentTimeMillis`:

```clojure
;; CORRECT: criterium for automated benchmarking
(require '[criterium.core :refer [quick-bench bench]])
(quick-bench (calculate-zakat 100000M 5000M))
```

### 2. Explicit Over Implicit

**MUST** use explicit type hints (not reflection) for performance-critical Java interop paths.

### 3. Immutability Over Mutability

Clojure's persistent data structures use structural sharing — immutability is efficient, not costly.

### 4. Pure Functions Over Side Effects

`memoize` works correctly only with pure functions — identical inputs always produce identical outputs.

### 5. Reproducibility First

Benchmark results MUST be reproducible. Run `criterium bench` in a stable JVM state (after JIT warmup) for consistent measurements.

## Lazy Sequences vs Eager Evaluation

**MUST** understand when to use lazy vs eager processing:

### Lazy Sequences — Memory-Efficient Processing

Use lazy sequences when processing potentially large or infinite collections:

```clojure
;; CORRECT: Lazy processing of large transaction history
(defn find-large-zakat-transactions
  "Lazily finds zakat transactions above threshold. Memory-efficient for large datasets."
  [transaction-seq threshold]
  (->> transaction-seq
       (filter #(>= (:zakat/amount-paid %) threshold))
       (map :zakat/transaction-id)))
;; Note: no computation happens until the result is consumed

;; CORRECT: take limits lazy computation
(take 10 (find-large-zakat-transactions all-transactions 10000M))

;; CORRECT: Infinite lazy sequence for recurring schedules
(defn zakat-due-dates
  "Generates infinite lazy sequence of annual zakat due dates from a start date."
  [start-date]
  (iterate #(.plusYears % 1) start-date))

(take 5 (zakat-due-dates (java.time.LocalDate/now)))
```

### Forcing Eager Evaluation

**MUST** force evaluation with `doall` or `into` when you need all results in memory or when side effects must complete:

```clojure
;; CORRECT: doall forces full lazy sequence realization
(defn process-all-zakat-payments!
  "Forces realization of all payments — needed when side effects must complete."
  [payments db]
  (doall (map #(save-zakat-transaction! db %) payments)))

;; CORRECT: into eagerly realizes into a specific collection type
(defn collect-transaction-ids
  "Eagerly collects all transaction IDs into a vector."
  [transactions]
  (into [] (map :zakat/transaction-id) transactions))
```

**MUST NOT** hold onto the head of a lazy sequence when processing large datasets (causes memory leaks):

```clojure
;; WRONG: Holds head — all items remain in memory
(let [all-transactions (fetch-all-transactions db)] ;; Lazy seq
  (count all-transactions)       ;; Forces realization
  (first all-transactions))      ;; Holds head — all in memory

;; CORRECT: Process without holding head
(let [count (count (fetch-all-transactions db))]
  count) ;; all-transactions goes out of scope
```

## Transducers — Composable, Efficient Transformations

**SHOULD** use transducers for reusable collection processing that avoids intermediate collection creation.

```clojure
;; CORRECT: Transducer composition for zakat payment processing
(def zakat-summary-xf
  "Reusable transducer: filters paid transactions above threshold, extracts amounts."
  (comp
   (filter #(= :paid (:zakat/status %)))
   (filter #(>= (:zakat/amount-paid %) 1000M))
   (map :zakat/amount-paid)))

;; Apply the same transducer to different contexts — no intermediate collections
(into [] zakat-summary-xf transactions)                  ;; to vector
(transduce zakat-summary-xf + 0M transactions)           ;; reduce to sum
(sequence zakat-summary-xf transactions)                  ;; to lazy seq
(async/chan 100 zakat-summary-xf)                        ;; to core.async channel

;; COMPARE: Without transducers — creates two intermediate collections
(->> transactions
     (filter #(= :paid (:zakat/status %)))   ;; intermediate seq 1
     (filter #(>= (:zakat/amount-paid %) 1000M)) ;; intermediate seq 2
     (map :zakat/amount-paid))               ;; intermediate seq 3
```

**When to use transducers**:

- Processing large collections where intermediate allocations matter
- Reusing the same transformation across `into`/`transduce`/`sequence`/`core.async`
- Composing multiple map/filter steps into a single pass

## Avoiding Reflection with Type Hints

**MUST** add type hints to eliminate reflection in performance-critical Java interop paths:

```clojure
;; WRONG: Reflection on every call (slow path)
(defn format-decimal-amount [amount]
  (.toPlainString amount)) ;; Reflection: JVM must look up method at runtime

;; CORRECT: Type hint eliminates reflection (fast path)
(defn format-decimal-amount
  "Formats a BigDecimal amount as plain string (no scientific notation)."
  ^String [^java.math.BigDecimal amount]
  (.toPlainString amount))

;; CORRECT: Type hints in let bindings for intermediate values
(defn calculate-zakat-percentage
  ^java.math.BigDecimal [^java.math.BigDecimal wealth ^java.math.BigDecimal rate]
  (.multiply wealth rate))

;; CORRECT: Primitive type hints for numeric operations
(defn sum-installments
  "Sums integer installment counts — uses primitive long arithmetic."
  ^long [^long count ^long duration]
  (* count duration))
```

**Detecting reflection**:

```clojure
;; CORRECT: Enable reflection warnings during development
(set! *warn-on-reflection* true)
;; Clojure will print warnings for every reflective call
```

## criterium — Benchmarking

**MUST** use `criterium` for performance measurements — it handles JVM warmup and provides statistical analysis.

```clojure
(require '[criterium.core :refer [quick-bench bench with-progress-reporting]])

;; CORRECT: quick-bench for fast iterative development (fewer iterations)
(quick-bench
 (calculate-zakat 100000M 5000M))
;; Output: Evaluation count: 6 in 6 samples of 1 calls.
;;         Execution time mean: 1.2 µs

;; CORRECT: bench for rigorous production measurements
(with-progress-reporting
  (bench
   (->> transactions
        (filter #(= :paid (:zakat/status %)))
        (map :zakat/amount-paid)
        (reduce + 0M))))

;; CORRECT: Compare transducer vs threading macro performance
(quick-bench
 (transduce zakat-summary-xf + 0M large-transactions))

(quick-bench
 (->> large-transactions
      (filter #(= :paid (:zakat/status %)))
      (map :zakat/amount-paid)
      (reduce + 0M)))
```

## JVM Profiling — VisualVM and YourKit

**SHOULD** use VisualVM (free) or YourKit (commercial) for profiling production performance issues:

```bash
# CORRECT: Start JVM with profiling agents for VisualVM
clojure -J-Xmx512m -J-verbose:gc -M:dev

# CORRECT: Connect VisualVM to running nREPL process
# 1. Start REPL: clojure -M:dev
# 2. Open VisualVM
# 3. Connect to process by PID or JMX port
```

**What to profile**:

- CPU hotspots (methods consuming >5% CPU)
- Heap allocation rate (excessive GC pressure)
- Thread contention (lock wait time for concurrent code)

## memoize — Caching Pure Functions

**MUST** use `memoize` only for pure functions (same input always produces same output):

```clojure
;; CORRECT: memoize for expensive pure calculation
(def calculate-nisab-threshold
  "Memoized nisab threshold lookup — pure function, safe to cache."
  (memoize
   (fn [gold-price-per-gram grams-required]
     (* (bigdec gold-price-per-gram) (bigdec grams-required)))))

;; After first call, subsequent calls with same args return cached result
(calculate-nisab-threshold 75.0 85.0) ;; Computes and caches
(calculate-nisab-threshold 75.0 85.0) ;; Returns cached result

;; WRONG: memoize on impure function (time-dependent)
(def get-current-nisab
  (memoize (fn [] (fetch-nisab-from-db!)))) ;; Wrong! Returns stale data after first call
```

**For time-bounded caches**, use `core.cache` or `core.memoize` with TTL:

```clojure
;; CORRECT: core.memoize with TTL for time-bounded caching
(require '[clojure.core.memoize :as memo])

(def get-nisab-with-ttl
  (memo/ttl
   (fn [currency] (fetch-nisab-from-db! currency))
   :ttl/threshold (* 60 60 1000))) ;; 1 hour TTL in milliseconds
```

## Enforcement

- **Eastwood** - Detects reflection in Java interop
- **`*warn-on-reflection*`** - Clojure runtime warns on reflection in development
- **criterium benchmarks** - Required for performance PRs (include benchmark results in PR description)
- **Code reviews** - Reviewers verify type hints added before hot-path code is merged

## Related Standards

- [Concurrency Standards](./concurrency-standards.md) - Transducers in core.async pipelines
- [Functional Programming Standards](./functional-programming-standards.md) - Transducers and higher-order function composition

## Related Documentation

**Software Engineering Principles**:

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**Clojure Version**: 1.10+ (baseline), 1.12 (recommended)
