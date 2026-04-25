---
title: "Clojure Functional Programming Standards"
description: Authoritative OSE Platform Clojure functional programming standards (transducers, macros, higher-order functions)
category: explanation
subcategory: prog-lang
tags:
  - clojure
  - functional-programming
  - transducers
  - macros
  - higher-order-functions
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Clojure Functional Programming Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Clojure fundamentals from [AyoKoding Clojure Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/clojure/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Clojure tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines functional programming standards for Clojure development in OSE Platform. Clojure is a functional language — these are not optional patterns but the idiomatic way to write Clojure code.

**Target Audience**: OSE Platform Clojure developers implementing data pipelines, financial calculations, and rule engines

**Scope**: map/filter/reduce idioms, transducers, threading macros, partial and comp, higher-order functions (apply/juxt/fnil/constantly), avoiding mutation, macros for DSLs

## Software Engineering Principles

### 1. Pure Functions Over Side Effects

Clojure's functional core is built on pure functions. MUST compose pure functions — not mutate state:

```clojure
;; CORRECT: Pure function composition
(def calculate-zakat (comp #(* % 0.025M) max-with-zero))
```

### 2. Immutability Over Mutability

Clojure's `map`, `filter`, `reduce` return new collections — the original is never modified.

### 3. Explicit Over Implicit

Threading macros (`->`, `->>`) make transformation pipelines explicit and readable — not hidden inside nested calls.

### 4. Automation Over Manual

Transducers automate efficient multi-step collection processing without intermediate allocations.

### 5. Reproducibility First

Pure functional pipelines are deterministic — same input always produces same output.

## Core Functional Idioms: map, filter, reduce

**MUST** use `map`/`filter`/`reduce`/`into` as the primary collection processing idioms:

```clojure
;; CORRECT: map, filter, reduce for zakat payment processing
(defn summarize-zakat-payments
  "Returns total zakat collected from paid transactions above a minimum amount."
  [transactions min-amount]
  (->> transactions
       (filter #(= :paid (:zakat/status %)))         ;; Keep only paid
       (filter #(>= (:zakat/amount-paid %) min-amount)) ;; Above minimum
       (map :zakat/amount-paid)                       ;; Extract amounts
       (reduce + 0M)))                                ;; Sum all

;; CORRECT: into for efficient collection building
(defn index-by-customer
  "Indexes transactions by customer ID. Returns map of customer-id -> [transactions]."
  [transactions]
  (reduce (fn [acc tx]
            (update acc (:zakat/customer-id tx) (fnil conj []) tx))
          {}
          transactions))

;; CORRECT: group-by for categorization
(defn group-by-status
  "Groups transactions by their status keyword."
  [transactions]
  (group-by :zakat/status transactions))
```

## Transducers — Efficient Composable Transformations

**SHOULD** use transducers when the same transformation is applied in multiple contexts (vector, lazy seq, core.async channel) or when intermediate collections are a performance concern.

```clojure
;; CORRECT: Define reusable transducer
(def paid-zakat-xf
  "Transducer: filters paid transactions and extracts amounts."
  (comp
   (filter #(= :paid (:zakat/status %)))
   (map :zakat/amount-paid)))

;; Apply the same transducer in different contexts — no code duplication
(into [] paid-zakat-xf transactions)                   ;; Collect to vector
(transduce paid-zakat-xf + 0M transactions)            ;; Sum (reduce)
(sequence paid-zakat-xf transactions)                  ;; Lazy sequence
(async/chan 100 paid-zakat-xf)                         ;; core.async channel filter

;; CORRECT: Transducer with custom accumulator
(defn summarize-by-currency
  "Returns per-currency totals using a single-pass transducer."
  [transactions]
  (transduce
   (filter #(= :paid (:zakat/status %)))
   (fn
     ([] {})                                          ;; init: empty map
     ([acc tx]                                        ;; step: accumulate
      (update acc (:zakat/currency tx) (fnil + 0M) (:zakat/amount-paid tx)))
     ([acc] acc))                                     ;; completion
   {}
   transactions))
```

## Threading Macros — Readable Pipelines

**MUST** use threading macros for all multi-step transformation pipelines:

```clojure
;; CORRECT: -> for single value through transformations (value is first arg)
(defn enrich-contract
  "Enriches a Murabaha contract with calculated fields."
  [contract]
  (-> contract
      (validate-murabaha-contract)                         ;; Returns contract or throws
      (assoc :murabaha/total-price
             (+ (:murabaha/cost-price contract)
                (:murabaha/profit-margin contract)))
      (assoc :murabaha/monthly-installment
             (/ (+ (:murabaha/cost-price contract)
                   (:murabaha/profit-margin contract))
                (:murabaha/installment-count contract)))
      (assoc :murabaha/enriched-at (java.time.Instant/now))))

;; CORRECT: ->> for collection processing (value is last arg)
(defn get-customer-zakat-history
  "Returns sorted paid zakat history for a customer."
  [transactions customer-id]
  (->> transactions
       (filter #(= customer-id (:zakat/customer-id %)))
       (filter #(= :paid (:zakat/status %)))
       (sort-by :zakat/paid-at)
       (map #(select-keys % [:zakat/transaction-id :zakat/amount-paid :zakat/paid-at]))))

;; CORRECT: as-> when the threading position varies
(defn process-contract-batch
  "Processes a batch with mixed threading positions."
  [contracts config]
  (as-> contracts $
    (map #(enrich-contract %) $)
    (filter #(sharia-compliant? %) $)
    (take (:batch/max-size config) $)
    (mapv #(save-contract! (:db config) %) $)))
```

## partial and comp — Function Composition

**SHOULD** use `partial` and `comp` for building specialized functions from general ones:

```clojure
;; CORRECT: partial for specializing functions
(defn calculate-zakat-for-currency
  [currency wealth nisab]
  (let [rate (get-zakat-rate currency)]
    (if (>= wealth nisab) (* wealth rate) 0M)))

;; Specialize for SAR currency
(def calculate-sar-zakat
  (partial calculate-zakat-for-currency :SAR))

;; CORRECT: comp for building transformation pipelines as functions
(defn zakat-report-pipeline [nisab]
  (comp
   (partial filter #(= :paid (:zakat/status %)))
   (partial filter #(>= (:zakat/wealth %) nisab))
   (partial map #(select-keys % [:zakat/customer-id :zakat/amount-paid]))))

;; Usage
(def sar-paid-report (zakat-report-pipeline 5000M))
(sar-paid-report transactions)
```

## Higher-Order Functions

### apply — Calling Functions with Argument Lists

```clojure
;; CORRECT: apply for calling variadic functions with a collection
(defn max-zakat-amount [amounts]
  (apply max amounts)) ;; Equivalent to (max amount1 amount2 amount3 ...)

;; CORRECT: apply with str for building strings from collections
(defn build-transaction-ref [parts]
  (apply str parts)) ;; (str "ZAKAT" "-" "2026" "-" "001") => "ZAKAT-2026-001"
```

### juxt — Applying Multiple Functions

```clojure
;; CORRECT: juxt for extracting multiple fields simultaneously
(def extract-zakat-summary
  "Returns [customer-id amount-paid status] from a transaction."
  (juxt :zakat/customer-id :zakat/amount-paid :zakat/status))

(extract-zakat-summary {:zakat/customer-id "cust-1" :zakat/amount-paid 2500M :zakat/status :paid})
;; => ["cust-1" 2500M :paid]

;; CORRECT: juxt for sorting by multiple keys
(sort-by (juxt :zakat/status :zakat/paid-at) transactions)
```

### fnil — Nil-Safe Function Calls

```clojure
;; CORRECT: fnil for handling nil values with default
(defn count-transactions-by-status
  "Counts transactions by status, starting from zero for each status."
  [transactions]
  (reduce (fn [acc tx]
            (update acc (:zakat/status tx) (fnil inc 0))) ;; nil -> 0 before inc
          {}
          transactions))
;; => {:paid 15 :pending 3 :cancelled 1}
```

### constantly — Ignoring Arguments

```clojure
;; CORRECT: constantly for replacing a function with a fixed value (testing, stubs)
(def always-eligible? (constantly true))

;; CORRECT: constantly in with-redefs for testing
(deftest calculate-zakat-when-always-eligible
  (with-redefs [valid-nisab? (constantly true)]
    (is (pos? (calculate-zakat 1000M 99999M)))))
```

## Avoiding Mutation — Prefer Immutable Operations

**MUST** use immutable collection operations — never mutate Clojure data structures:

```clojure
;; CORRECT: assoc/dissoc/update produce new maps
(defn approve-contract
  "Returns a new contract map with approved status — original unchanged."
  [contract approver-id]
  (-> contract
      (assoc :murabaha/status :approved
             :murabaha/approved-by approver-id
             :murabaha/approved-at (java.time.Instant/now))
      (dissoc :murabaha/pending-review-notes)))

;; CORRECT: conj adds to a new collection
(defn add-transaction [history transaction]
  (conj history transaction)) ;; history unchanged; returns new vector

;; WRONG: mutation via Java interop on Clojure data
;; (do (.put some-clojure-map :key :value) some-clojure-map) ;; Persistent maps are immutable!

;; WRONG: using an atom where a pure function suffices
(def state (atom []))
(swap! state conj transaction) ;; Unnecessary — just pass the new vector as return value
```

## Macros — Use Sparingly for DSLs

**MAY** use `defmacro` to eliminate boilerplate and create domain-specific languages. Macros are powerful — use them only when a function cannot achieve the same result.

```clojure
;; CORRECT: Macro for Sharia contract validation DSL
(defmacro validate-sharia-contract
  "Macro that evaluates conditions and throws ex-info if any fail.
  Each condition is a vector of [predicate-expr error-keyword message]."
  [contract & conditions]
  `(do
     ~@(map (fn [[pred error-key msg]]
              `(when-not ~pred
                 (throw (ex-info ~msg
                                 {:error ~error-key
                                  :contract ~contract}))))
            conditions)
     ~contract))

;; Usage — reads like a specification
(validate-sharia-contract contract
  [(pos? (:murabaha/cost-price contract))
   :murabaha/invalid-cost-price
   "Cost price must be positive"]
  [(pos? (:murabaha/profit-margin contract))
   :murabaha/invalid-profit-margin
   "Profit margin must be positive"]
  [(pos? (:murabaha/installment-count contract))
   :murabaha/invalid-installments
   "Installment count must be positive"])

;; WRONG: Macro where a function would work just as well
;; Functions can take functions as arguments — use higher-order functions instead of macros for behavior parameterization
```

**Rules for macros**:

- MUST document what the macro expands to with `macroexpand-1` example in docstring
- MUST NOT use macros when a higher-order function can achieve the same goal
- SHOULD prefer `defmacro` over reader macros (`#_`, `'`, `` ` ``, `~`)
- MUST test macro expansion in addition to macro behavior

## Enforcement

- **clj-kondo** - Detects unused functions, arity mismatches in higher-order usage
- **Eastwood** - Detects suspicious use of `def` inside functions (use `let` instead)
- **Code reviews** - Reviewers verify threading macros used for pipelines, mutation avoided, macros justified

## Related Standards

- [Coding Standards](./coding-standards.md) - Threading macros as the primary pipeline idiom
- [Performance Standards](./performance-standards.md) - Transducers for efficient processing
- [Concurrency Standards](./concurrency-standards.md) - core.async channels with transducers

## Related Documentation

**Software Engineering Principles**:

- [Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Functional Programming](../../../../../governance/development/pattern/functional-programming.md)

---

**Maintainers**: Platform Documentation Team

**Clojure Version**: 1.10+ (baseline), 1.12 (recommended)
