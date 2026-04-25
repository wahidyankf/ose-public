---
title: "Clojure Concurrency Standards"
description: Authoritative OSE Platform Clojure concurrency standards (atoms, refs, agents, core.async)
category: explanation
subcategory: prog-lang
tags:
  - clojure
  - concurrency
  - atoms
  - refs
  - agents
  - core-async
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Clojure Concurrency Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Clojure fundamentals from [AyoKoding Clojure Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/clojure/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Clojure tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines authoritative concurrency standards for Clojure development in OSE Platform. Clojure's four concurrency primitives (atoms, refs, agents, vars) and core.async channels provide safe concurrency with immutable data at their core.

**Target Audience**: OSE Platform Clojure developers working on concurrent and asynchronous systems

**Scope**: Atoms, refs with STM, agents, dynamic vars with binding, core.async channels, concurrency primitive selection

## Software Engineering Principles

### 1. Immutability Over Mutability

Clojure's persistent data structures enable safe sharing across threads without locks. Immutable values are the foundation of all concurrency primitives:

```clojure
;; CORRECT: Atoms hold immutable values; swap! produces new values atomically
(def zakat-cache (atom {}))

;; Atomic update — the map is immutable; atom provides the thread-safe container
(swap! zakat-cache assoc :customer-123 {:amount 2500M :calculated-at (java.time.Instant/now)})
```

### 2. Explicit Over Implicit

**MUST** choose the correct concurrency primitive explicitly based on coordination needs — never default to atoms for everything.

### 3. Pure Functions Over Side Effects

`swap!` and `alter` apply pure functions to current state. The update function MUST be pure (no side effects):

```clojure
;; CORRECT: Pure update function in swap!
(swap! transaction-state
       (fn [state]
         (update state :count inc))) ;; Pure — no side effects

;; WRONG: Side effects inside swap! (may execute multiple times on CAS retry)
(swap! transaction-state
       (fn [state]
         (save-to-db! (:count state)) ;; Side effect — called multiple times on retry!
         (update state :count inc)))
```

### 4. Automation Over Manual

Clojure's STM (refs + dosync) automates coordination — no manual lock acquisition/release.

### 5. Reproducibility First

Deterministic tests for concurrent code use controlled state and property-based testing.

## Clojure's Four Concurrency Primitives

### Selection Guide

| Primitive | Coordination  | Synchrony    | When to Use                               |
| --------- | ------------- | ------------ | ----------------------------------------- |
| **Atom**  | Uncoordinated | Synchronous  | Single shared value updated independently |
| **Ref**   | Coordinated   | Synchronous  | Multiple values updated together (STM)    |
| **Agent** | Uncoordinated | Asynchronous | Background tasks, I/O, sequential updates |
| **Var**   | Thread-local  | Dynamic      | Thread-local config, test overrides       |

## Atoms — Uncoordinated Synchronous State

**MUST** use atoms for independent shared values that require atomic updates.

```clojure
;; CORRECT: Atom for independent shared cache
(def nisab-cache
  "Cache of current nisab thresholds by currency. Thread-safe via atom."
  (atom {:SAR 5000M
         :USD 1500M
         :MYR 6800M}))

;; CORRECT: swap! with pure update function
(defn update-nisab-threshold!
  "Updates the nisab threshold for a given currency. Thread-safe."
  [currency amount]
  (swap! nisab-cache assoc currency amount))

;; CORRECT: reset! for full replacement
(defn refresh-nisab-cache!
  "Replaces the entire nisab cache with fresh data."
  [new-thresholds]
  (reset! nisab-cache new-thresholds))

;; CORRECT: deref (@ reader macro) for reading
(defn get-nisab-threshold
  "Returns current nisab threshold for currency. Returns nil if not found."
  [currency]
  (get @nisab-cache currency))

;; WRONG: swap! with side effects (side effects may run multiple times on retry)
(swap! nisab-cache
       (fn [cache]
         (notify-threshold-change! currency) ;; Side effect! Wrong here.
         (assoc cache currency amount)))
```

## Refs — Coordinated Synchronous State (STM)

**MUST** use refs with `dosync` when multiple values must be updated atomically together.

```clojure
;; CORRECT: Refs for coordinated state changes (financial transaction integrity)
(def zakat-pool-balance (ref 0M))
(def processed-transactions (ref #{}))
(def total-collections (ref 0M))

(defn process-zakat-payment!
  "Processes a zakat payment atomically: updates balance, records transaction, and total.
  All three refs are updated in a single STM transaction — atomically consistent."
  [transaction-id amount]
  (dosync
   (alter zakat-pool-balance + amount)
   (alter processed-transactions conj transaction-id)
   (alter total-collections + amount)))

;; CORRECT: ref-set for full replacement within dosync
(defn reset-accounting-period!
  "Resets accounting period atomically."
  []
  (dosync
   (ref-set zakat-pool-balance 0M)
   (ref-set processed-transactions #{})
   ;; total-collections is NOT reset — preserved across periods
   ))

;; CORRECT: Reading refs — use deref inside or outside dosync
(defn get-current-balance []
  @zakat-pool-balance)

;; WRONG: Attempting to coordinate refs without dosync
(alter zakat-pool-balance + amount) ;; Throws: Must be called in dosync transaction
```

**Key STM properties**:

- `dosync` blocks are retried automatically on conflict — update functions MUST be pure
- Refs provide snapshot isolation — reads see consistent state within `dosync`
- Prefer refs for financial data where consistency between multiple values is critical

## Agents — Asynchronous Sequential Processing

**MUST** use agents for asynchronous sequential updates and background I/O tasks.

```clojure
;; CORRECT: Agent for async notification processing
(def notification-agent
  "Agent processing zakat payment notifications sequentially."
  (agent {:sent-count 0 :failed-count 0}))

;; CORRECT: send for CPU-bound tasks (uses bounded thread pool)
(defn record-notification-sent!
  "Asynchronously records a successful notification send."
  [recipient]
  (send notification-agent
        (fn [state]
          (update state :sent-count inc))))

;; CORRECT: send-off for I/O-bound tasks (uses unbounded thread pool)
(defn send-zakat-receipt!
  "Asynchronously sends zakat receipt via email (I/O-bound)."
  [agent-state transaction-id recipient-email]
  ;; This function is called by the agent's thread — side effects are safe here
  (try
    (email/send-receipt! recipient-email transaction-id)
    (update agent-state :sent-count inc)
    (catch Exception e
      (log/error e "Failed to send receipt" {:recipient recipient-email})
      (update agent-state :failed-count inc))))

(defn dispatch-zakat-receipt!
  "Dispatches receipt sending to the notification agent."
  [transaction-id recipient-email]
  (send-off notification-agent send-zakat-receipt! transaction-id recipient-email))

;; CORRECT: await to synchronize with agent completion (e.g., in tests)
(defn await-notifications []
  (await notification-agent))

;; CORRECT: Check agent errors
(defn notification-healthy? []
  (nil? (agent-error notification-agent)))
```

## Vars — Dynamic Binding for Thread-Local State

**MUST** use dynamic vars with `binding` for thread-local configuration (especially in tests).

```clojure
;; CORRECT: Dynamic var for thread-local configuration
(def ^:dynamic *zakat-rate*
  "Current zakat rate. Can be overridden in tests via binding."
  0.025M)

(def ^:dynamic *nisab-threshold*
  "Current nisab threshold. Override in tests for deterministic behavior."
  5000M)

(defn calculate-zakat-with-config
  "Calculates zakat using the current dynamic binding values."
  [wealth]
  (if (>= wealth *nisab-threshold*)
    (* wealth *zakat-rate*)
    0M))

;; CORRECT: Temporarily override in tests with binding
(binding [*zakat-rate* 0.025M
          *nisab-threshold* 3000M]
  ;; All calls within this scope see the overridden values
  (calculate-zakat-with-config 5000M))

;; CORRECT: with-redefs for redefining functions in tests (not dynamic vars)
(deftest calculate-zakat-with-mock-nisab-test
  (with-redefs [get-current-nisab (constantly 3000M)]
    (is (= 125M (calculate-zakat-eligible 5000M)))))
```

**Dynamic var naming convention**: MUST surround dynamic var names with `*earmuffs*`.

## core.async — CSP Channel-Based Concurrency

**SHOULD** use core.async for pipeline-based concurrent processing and event-driven workflows.

```clojure
(ns ose.zakat.pipeline
  (:require [clojure.core.async :as async :refer [chan go <! >! put! take! close!]]))

;; CORRECT: Channel-based zakat payment processing pipeline
(defn create-zakat-pipeline
  "Creates a processing pipeline: input-ch -> validate -> calculate -> persist -> output-ch."
  [db]
  (let [raw-ch       (chan 100)        ;; Buffered: accepts 100 items before backpressure
        validated-ch (chan 100)
        result-ch    (chan 100)]

    ;; Validation stage
    (go (loop []
          (when-let [payment (<! raw-ch)]
            (if (valid-payment? payment)
              (>! validated-ch payment)
              (log/warn "Invalid payment dropped" {:payment payment}))
            (recur))))

    ;; Calculation and persistence stage
    (go (loop []
          (when-let [payment (<! validated-ch)]
            (let [amount (calculate-zakat (:wealth payment) (:nisab payment))
                  saved  (save-zakat-transaction! db (assoc payment :amount amount))]
              (>! result-ch saved))
            (recur))))

    {:input raw-ch :output result-ch}))

;; CORRECT: put! for async fire-and-forget puts
(defn submit-payment! [pipeline payment]
  (put! (:input pipeline) payment))

;; CORRECT: close! to signal completion
(defn shutdown-pipeline! [pipeline]
  (close! (:input pipeline)))

;; WRONG: Direct Java threading (avoid — use Clojure primitives)
;; (Thread. (fn [] (process-payment!))) ;; Raw thread — no lifecycle management
```

**core.async channel sizing**:

- Unbuffered (`(chan)`) — both sender and receiver must be ready (strict synchronization)
- Fixed buffer (`(chan n)`) — accepts up to `n` items before backpressure
- Sliding buffer (`(chan (async/sliding-buffer n))`) — drops oldest when full (lossy)
- Dropping buffer (`(chan (async/dropping-buffer n))`) — drops newest when full (lossy)

## Avoid Direct Java Threading

**MUST NOT** use Java threading primitives directly in application code:

```clojure
;; WRONG: Raw Java threads — no lifecycle management, no Clojure integration
(defn bad-background-task []
  (.start (Thread. (fn [] (process-payments!)))))

;; WRONG: Java ExecutorService directly
(def bad-executor (java.util.concurrent.Executors/newFixedThreadPool 4))

;; CORRECT: Use core.async go blocks or agents for async work
(defn background-processing! [payments]
  (async/go
    (doseq [payment payments]
      (process-payment! payment))))
```

**Exception**: When wrapping Java libraries that require thread pool configuration, use agents or wrap with `future` (which uses Clojure's managed thread pool).

## Enforcement

- **Code reviews** - Verify correct primitive chosen (atom vs ref vs agent vs core.async)
- **clj-kondo** - Detects missing `dosync` around `alter`, unbalanced channel operations
- **Testing** - Concurrent code tested with `await` on agents, controlled state setup for atoms

## Related Standards

- [Coding Standards](./coding-standards.md) - `!` suffix for side-effecting mutation functions
- [Performance Standards](./performance-standards.md) - Choosing between concurrency approaches for throughput
- [Error Handling Standards](./error-handling-standards.md) - Agent error handling with `agent-error`

## Related Documentation

**Software Engineering Principles**:

- [Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**Clojure Version**: 1.10+ (baseline), 1.12 (recommended)
