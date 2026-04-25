---
title: "Clojure Coding Standards"
description: Authoritative OSE Platform Clojure coding standards (naming conventions, namespace organization, REPL-driven development, threading macros)
category: explanation
subcategory: prog-lang
tags:
  - clojure
  - coding-standards
  - idioms
  - s-expressions
  - pure-functions
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Clojure Coding Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Clojure fundamentals from [AyoKoding Clojure Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/clojure/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Clojure tutorial. We define HOW to apply Clojure in THIS codebase, not WHAT Clojure is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative coding standards** for Clojure development in the OSE Platform. These prescriptive rules MUST be followed across all Clojure projects to ensure consistency, maintainability, and alignment with platform architecture.

**Target Audience**: OSE Platform Clojure developers, technical reviewers, automated code quality tools

**Scope**: OSE Platform naming conventions, namespace organization, REPL-driven development workflow, threading macros, destructuring patterns, docstring requirements

## Software Engineering Principles

These standards enforce the software engineering principles from `governance/principles/software-engineering/`:

### 1. Automation Over Manual

**Principle**: Automate repetitive tasks with tools, scripts, and CI/CD to reduce human error and increase consistency.

**How Clojure Implements**:

- `cljfmt` for automated formatting (enforced in pre-commit hooks)
- `clj-kondo` for automated linting
- `cloverage` for automated coverage measurement
- `tools.build` for automated artifact creation
- Babashka scripts for task automation

**PASS Example** (Automated Zakat Calculation Validation):

```clojure
;; CORRECT: bb.edn - Automated build and quality tasks
{:tasks
 {:requires ([babashka.fs :as fs])
  lint {:doc "Run clj-kondo linter"
        :task (shell "clj-kondo --lint src test")}
  fmt {:doc "Check cljfmt formatting"
       :task (shell "cljfmt check")}
  fmt-fix {:doc "Fix cljfmt formatting"
           :task (shell "cljfmt fix")}
  test {:doc "Run all tests with coverage"
        :task (shell "clojure -M:test:coverage")}
  ci {:doc "Full CI quality gate"
      :depends [lint fmt test]}}}

;; CORRECT: Automated zakat calculation test
(ns ose.zakat.calculator-test
  (:require [clojure.test :refer [deftest testing is]]
            [ose.zakat.calculator :refer [calculate-zakat]]))

(deftest calculate-zakat-test
  (testing "wealth above nisab returns 2.5%"
    (is (= 2500M (calculate-zakat 100000M 5000M))))
  (testing "wealth below nisab returns zero"
    (is (= 0M (calculate-zakat 3000M 5000M)))))
```

**See**: [Automation Over Manual Principle](../../../../../governance/principles/software-engineering/automation-over-manual.md)

### 2. Explicit Over Implicit

**Principle**: Choose explicit composition and configuration over magic and hidden behavior.

**How Clojure Implements**:

- Namespaced keywords (`:zakat/amount`, `:contract/type`) make domain concepts explicit
- Explicit `require` with aliases (no implicit namespace resolution)
- `ex-info` with structured data maps for explicit error context
- `s/def` specs as explicit domain contracts
- Explicit system configuration with Integrant EDN files

**PASS Example** (Explicit Murabaha Contract):

```clojure
;; CORRECT: Explicit namespaced keywords and spec-driven validation
(ns ose.murabaha.contract
  (:require [clojure.spec.alpha :as s]))

(s/def :murabaha/contract-id string?)
(s/def :murabaha/customer-id string?)
(s/def :murabaha/cost-price (s/and decimal? pos?))
(s/def :murabaha/profit-margin (s/and decimal? pos?))
(s/def :murabaha/installment-count (s/and int? pos?))

(s/def :murabaha/contract
  (s/keys :req [:murabaha/contract-id
                :murabaha/customer-id
                :murabaha/cost-price
                :murabaha/profit-margin
                :murabaha/installment-count]))

(defn create-murabaha-contract
  "Creates an immutable Murabaha contract map.
  Returns the contract map or throws ex-info on validation failure."
  [customer-id cost-price profit-margin installment-count]
  (let [contract {:murabaha/contract-id (str (java.util.UUID/randomUUID))
                  :murabaha/customer-id customer-id
                  :murabaha/cost-price cost-price
                  :murabaha/profit-margin profit-margin
                  :murabaha/installment-count installment-count}]
    (when-not (s/valid? :murabaha/contract contract)
      (throw (ex-info "Invalid Murabaha contract"
                      {:error :validation/failed
                       :spec-errors (s/explain-data :murabaha/contract contract)})))
    contract))

;; WRONG: Unnamespaced keys, no validation
(defn bad-create-contract [cid cost profit inst]
  {:id cid :cost cost :profit profit :inst inst}) ;; No spec, no validation
```

**See**: [Explicit Over Implicit Principle](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

### 3. Immutability Over Mutability

**Principle**: Prefer immutable data structures to prevent unintended state changes.

**How Clojure Implements**:

- Persistent data structures are immutable BY DEFAULT (lists, vectors, maps, sets)
- `assoc`/`dissoc`/`update`/`merge` produce NEW maps — never mutate
- Atoms/refs/agents for intentional shared mutable state only
- `conj`/`into` produce new collections
- Clojure's STM (refs + dosync) for coordinated state changes

**PASS Example** (Immutable Zakat Transaction):

```clojure
;; CORRECT: Immutable data transformation — assoc produces a new map
(defn record-zakat-payment
  "Records a zakat payment. Returns a new transaction map — original unchanged."
  [transaction amount-paid]
  (assoc transaction
         :zakat/amount-paid amount-paid
         :zakat/paid-at (java.time.Instant/now)
         :zakat/status :paid))

(def pending-transaction
  {:zakat/transaction-id "tx-001"
   :zakat/payer-id "customer-123"
   :zakat/amount-due 2500M
   :zakat/status :pending})

;; pending-transaction is unchanged; paid-transaction is a new map
(def paid-transaction (record-zakat-payment pending-transaction 2500M))

;; WRONG: Mutation via Java interop (avoid)
;; (def state (java.util.HashMap.))
;; (.put state :zakat/amount 2500M) ;; Mutates! Avoid.
```

**See**: [Immutability Principle](../../../../../governance/principles/software-engineering/immutability.md)

### 4. Pure Functions Over Side Effects

**Principle**: Prefer pure functions that are deterministic and side-effect-free.

**How Clojure Implements**:

- Pure domain functions (no I/O, no state mutation)
- Side-effecting functions use `!` suffix (`save-transaction!`, `send-notification!`)
- Functional core/imperative shell architecture
- REPL testability of pure functions without mocking

**PASS Example** (Pure Zakat Calculation):

```clojure
;; CORRECT: Pure function — same inputs always return same output
(defn calculate-zakat
  "Calculates zakat amount for given wealth and nisab threshold.
  Returns BigDecimal zakat amount (zero if wealth is below nisab)."
  [wealth nisab]
  (if (>= wealth nisab)
    (* wealth 0.025M)
    0M))

;; Side-effecting function explicitly marked with !
(defn save-zakat-transaction!
  "Persists a zakat transaction to the database. Returns the saved record."
  [db transaction]
  (jdbc/insert! db :zakat_transactions transaction))

;; WRONG: Mixed pure logic with side effects
(defn bad-calculate-and-save [db wealth nisab]
  (let [amount (* wealth 0.025M)] ;; calculation
    (jdbc/insert! db :zakat_transactions {:amount amount}) ;; side effect mixed in!
    amount))
```

**See**: [Pure Functions Principle](../../../../../governance/principles/software-engineering/pure-functions.md)

### 5. Reproducibility First

**Principle**: Ensure builds, tests, and deployments are reproducible across environments and time.

**How Clojure Implements**:

- `deps.edn` with exact Maven version coordinates
- JVM version pinned via `.tool-versions` or `.sdkmanrc`
- `tools.build` for deterministic JAR/uberjar creation
- CI/CD downloads all dependencies via `clojure -P` before build

**PASS Example** (Reproducible Environment):

```clojure
;; CORRECT: deps.edn with exact versions
{:paths ["src" "resources"]
 :deps {org.clojure/clojure {:mvn/version "1.12.0"}
        ring/ring-core {:mvn/version "1.12.2"}
        metosin/reitit {:mvn/version "0.7.2"}
        com.github.seancorfield/next.jdbc {:mvn/version "1.3.939"}
        integrant/integrant {:mvn/version "0.13.1"}}
 :aliases
 {:dev {:extra-paths ["dev" "test"]
        :extra-deps {nrepl/nrepl {:mvn/version "1.3.1"}
                     cider/cider-nrepl {:mvn/version "0.50.2"}}}
  :test {:extra-paths ["test"]
         :extra-deps {lambdaisland/kaocha {:mvn/version "1.91.1392"}}}
  :coverage {:extra-deps {cloverage/cloverage {:mvn/version "1.2.4"}}}}}
```

**See**: [Reproducibility Principle](../../../../../governance/principles/software-engineering/reproducibility.md)

## Naming Conventions

### Functions and Vars

**MUST** use kebab-case for all function and var names:

```clojure
;; CORRECT: kebab-case
(defn calculate-zakat [wealth nisab] ...)
(defn validate-nisab-threshold [amount] ...)
(def default-zakat-rate 0.025M)

;; WRONG: camelCase or snake_case
(defn calculateZakat [wealth nisab] ...) ;; camelCase — not idiomatic Clojure
(defn calculate_zakat [wealth nisab] ...) ;; snake_case — not idiomatic Clojure
```

**MUST** use `?` suffix for predicate functions (functions returning boolean):

```clojure
;; CORRECT: ? suffix for predicates
(defn valid-nisab? [amount] (and (decimal? amount) (pos? amount)))
(defn paid? [transaction] (= :paid (:zakat/status transaction)))
(defn sharia-compliant? [contract] ...)

;; WRONG: no ? suffix for predicates
(defn is-valid-nisab [amount] ...) ;; Java-style naming
(defn check-paid [transaction] ...) ;; Unclear boolean intent
```

**MUST** use `!` suffix for side-effecting functions:

```clojure
;; CORRECT: ! suffix for side effects
(defn save-transaction! [db tx] ...)
(defn send-zakat-notification! [notifier transaction] ...)
(defn reset-contract-state! [state-atom] (reset! state-atom {}))

;; WRONG: no ! suffix for side effects
(defn save-transaction [db tx] ...) ;; Side effect without ! is misleading
```

### Protocols and Records

**MUST** use PascalCase for protocol and record names:

```clojure
;; CORRECT: PascalCase for protocols and records
(defprotocol ZakatCalculator
  (calculate [this wealth nisab])
  (validate-eligibility [this customer]))

(defrecord MurabahaContract [contract-id customer-id cost-price profit-margin])

;; WRONG: kebab-case for protocols/records
(defprotocol zakat-calculator ...) ;; Wrong — use PascalCase
```

### Constants

**MUST** use ALL-CAPS with hyphens for constants (not underscores — Clojure uses hyphens):

```clojure
;; CORRECT: ALL-CAPS with hyphens
(def MAX-NISAB-GOLD 85.0)
(def DEFAULT-ZAKAT-RATE 0.025M)
(def MURABAHA-MIN-PROFIT-MARGIN 0.01M)

;; WRONG: other casing for constants
(def maxNisabGold 85.0) ;; camelCase
(def max_nisab_gold 85.0) ;; snake_case (Java convention)
```

### Namespaces

**MUST** mirror directory structure in namespace names:

```clojure
;; CORRECT: namespace mirrors src/ose/zakat/calculator.clj
(ns ose.zakat.calculator
  (:require [clojure.spec.alpha :as s]
            [next.jdbc :as jdbc]
            [clojure.string :as str]))

;; CORRECT: namespace mirrors src/ose/murabaha/contract.clj
(ns ose.murabaha.contract
  (:require [ose.zakat.calculator :as zakat]
            [clojure.spec.alpha :as s]))
```

**MUST** use conventional aliases for common namespaces:

```clojure
;; CORRECT: Conventional namespace aliases
(:require [clojure.string :as str]
          [clojure.spec.alpha :as s]
          [next.jdbc :as jdbc]
          [next.jdbc.sql :as sql]
          [ring.util.response :as response]
          [reitit.core :as r]
          [integrant.core :as ig]
          [clojure.java.io :as io])

;; WRONG: Non-conventional or single-letter aliases (except well-known ones)
(:require [clojure.string :as string]  ;; Use str, not string
          [clojure.spec.alpha :as spec] ;; Use s, not spec
          [next.jdbc :as db])           ;; Use jdbc, not db
```

## Namespace Organization

**MUST** organize `ns` declaration in this order:

1. `ns` symbol and docstring
2. `:require` (other Clojure namespaces)
3. `:import` (Java classes)

```clojure
;; CORRECT: Proper ns organization
(ns ose.zakat.service
  "Zakat calculation service for OSE Platform."
  (:require [clojure.spec.alpha :as s]
            [clojure.string :as str]
            [next.jdbc :as jdbc]
            [ose.zakat.calculator :as calculator]
            [ose.zakat.repository :as repo])
  (:import [java.time Instant]
           [java.util UUID]))
```

**MUST** use docstrings on all public vars and functions:

```clojure
;; CORRECT: Docstring on public function
(defn calculate-zakat
  "Calculates the zakat due for a given wealth amount.

  Args:
    wealth - BigDecimal total wealth in same currency as nisab
    nisab  - BigDecimal minimum threshold for zakat obligation

  Returns BigDecimal zakat amount (0 if below nisab threshold)."
  [wealth nisab]
  (if (>= wealth nisab)
    (* wealth 0.025M)
    0M))

;; WRONG: No docstring on public function
(defn calculate-zakat [wealth nisab]
  (if (>= wealth nisab) (* wealth 0.025M) 0M))
```

## REPL-Driven Development

**MUST** design code for REPL interactivity:

```clojure
;; CORRECT: Functions designed for REPL exploration
;; Each function is pure and can be called independently at the REPL

(comment
  ;; REPL development session — wrapped in (comment) so it does not execute
  (require '[ose.zakat.calculator :as calc] :reload)

  ;; Test the pure function directly
  (calc/calculate-zakat 100000M 5000M)
  ;; => 2500M

  (calc/valid-nisab? 5000M)
  ;; => true

  ;; Build up complex scenarios incrementally
  (let [wealth 50000M
        nisab  5000M]
    {:zakat (calc/calculate-zakat wealth nisab)
     :eligible? (calc/valid-nisab? nisab)}))
```

**MUST** wrap exploratory REPL code in `(comment ...)` blocks — never leave top-level REPL calls in production code.

## Threading Macros

**MUST** use threading macros for data transformation pipelines:

```clojure
;; CORRECT: -> for single-value threading (method chain style)
(defn process-contract
  "Processes a Murabaha contract through validation and enrichment pipeline."
  [raw-contract]
  (-> raw-contract
      (validate-contract-fields)
      (enrich-with-customer-data)
      (calculate-total-price)
      (assign-contract-id)))

;; CORRECT: ->> for collection threading (last arg position)
(defn summarize-zakat-payments
  "Summarizes zakat payments for a given period."
  [transactions min-amount]
  (->> transactions
       (filter #(= :paid (:zakat/status %)))
       (filter #(>= (:zakat/amount-paid %) min-amount))
       (map :zakat/amount-paid)
       (reduce + 0M)))

;; WRONG: Deeply nested function calls without threading
(defn bad-process-contract [raw-contract]
  (assign-contract-id
   (calculate-total-price
    (enrich-with-customer-data
     (validate-contract-fields raw-contract))))) ;; Unreadable nesting
```

## Destructuring

**MUST** use destructuring in function arguments and `let` bindings for clarity:

```clojure
;; CORRECT: Map destructuring in function args
(defn format-contract-summary
  "Formats a contract summary string from a Murabaha contract map."
  [{:murabaha/keys [contract-id customer-id cost-price profit-margin]}]
  (format "Contract %s for customer %s: cost=%s profit=%s"
          contract-id customer-id cost-price profit-margin))

;; CORRECT: Sequential destructuring
(defn calculate-installment
  "Calculates monthly installment from [total-price months] vector."
  [[total-price months]]
  (/ total-price months))

;; CORRECT: Nested destructuring with :as for retaining whole value
(defn validate-and-process
  [{:keys [wealth nisab] :as calculation-request}]
  (when-not (valid-nisab? nisab)
    (throw (ex-info "Invalid nisab" {:request calculation-request})))
  (calculate-zakat wealth nisab))
```

## Avoiding Side Effects in Core Functions

**MUST** separate pure domain logic from I/O and side effects:

```clojure
;; CORRECT: Functional core — pure domain functions
(ns ose.zakat.domain)

(defn calculate-zakat [wealth nisab]
  (if (>= wealth nisab) (* wealth 0.025M) 0M))

(defn build-transaction [payer-id wealth zakat-amount]
  {:zakat/transaction-id (str (UUID/randomUUID))
   :zakat/payer-id payer-id
   :zakat/wealth wealth
   :zakat/amount-due zakat-amount
   :zakat/status :pending})

;; CORRECT: Imperative shell — side effects at the boundary
(ns ose.zakat.service
  (:require [ose.zakat.domain :as domain]
            [ose.zakat.repository :as repo]))

(defn process-zakat-payment!
  "Orchestrates zakat payment: pure calculation + side-effecting persistence."
  [db payer-id wealth nisab]
  (let [amount      (domain/calculate-zakat wealth nisab)
        transaction (domain/build-transaction payer-id wealth amount)]
    (repo/save-transaction! db transaction)  ;; Side effect isolated here
    transaction))
```

## Enforcement

These standards are enforced through:

- **cljfmt** - Auto-formats code (enforced in pre-commit hooks)
- **clj-kondo** - Detects namespace issues, unused vars, arity errors
- **Eastwood** - Detects reflection warnings and code smells
- **Code reviews** - Human verification of naming and structure compliance

**Pre-commit checklist**:

- [ ] All function names use kebab-case
- [ ] Predicates end with `?`
- [ ] Side-effecting functions end with `!`
- [ ] Protocols and records use PascalCase
- [ ] Constants use ALL-CAPS with hyphens
- [ ] All public functions have docstrings
- [ ] Namespace mirrors directory structure
- [ ] Conventional aliases used in `require`
- [ ] Threading macros used for pipelines (not deep nesting)
- [ ] Pure functions separated from side effects
- [ ] REPL exploratory code wrapped in `(comment)`

## Related Standards

- [Testing Standards](./testing-standards.md) - Testing patterns using these naming conventions
- [Code Quality Standards](./code-quality-standards.md) - Tool configuration enforcing these rules
- [Functional Programming Standards](./functional-programming-standards.md) - Advanced FP patterns building on these idioms
- [DDD Standards](./ddd-standards.md) - Domain modeling with namespaced keywords

## Related Documentation

**Software Engineering Principles**:

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**Clojure Version**: 1.10+ (baseline), 1.11 (recommended), 1.12 (latest)
