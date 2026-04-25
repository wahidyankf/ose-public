---
title: "Clojure DDD Standards"
description: Authoritative OSE Platform Clojure Domain-Driven Design standards (records, protocols, multimethods, specs as invariants)
category: explanation
subcategory: prog-lang
tags:
  - clojure
  - ddd
  - domain-driven-design
  - records
  - protocols
  - multimethods
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Clojure DDD Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Clojure fundamentals from [AyoKoding Clojure Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/clojure/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Clojure tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines Clojure's data-driven approach to Domain-Driven Design (DDD) in OSE Platform. Clojure DDD differs fundamentally from OOP DDD: domain concepts are expressed as immutable data maps rather than classes, and behavior is attached via protocols and multimethods rather than methods.

**Target Audience**: OSE Platform Clojure developers modeling Sharia-compliant financial domains

**Scope**: Plain maps as value objects, records for performance-critical types, protocols for polymorphism, multimethods for open dispatch, Clojure specs as domain invariants, namespaced keywords for domain concepts

## Software Engineering Principles

### 1. Immutability Over Mutability

Clojure maps are the natural value object — immutable by default. Domain entities are transformed (not mutated) through `assoc`/`dissoc`/`update`.

### 2. Pure Functions Over Side Effects

Domain logic (zakat rules, Murabaha pricing) is expressed as pure functions on data maps — no methods with side effects.

### 3. Explicit Over Implicit

**MUST** use namespaced keywords (`:zakat/amount`, `:murabaha/profit-margin`) to make domain concepts explicit and prevent naming collisions across bounded contexts.

### 4. Automation Over Manual

**MUST** use `clojure.spec.alpha` to automate domain invariant validation — not hand-coded nil checks.

### 5. Reproducibility First

Data-driven domain models serialize trivially to EDN/JSON — domain state is reproducible across environments.

## Plain Maps as Value Objects

**MUST** use plain Clojure maps as the primary representation for domain value objects. No classes needed.

```clojure
;; CORRECT: Zakat calculation request as a plain map
(def zakat-request
  {:zakat/customer-id "cust-123"
   :zakat/wealth      100000M
   :zakat/currency    :SAR
   :zakat/nisab       5000M})

;; CORRECT: Domain operations as pure functions on maps
(defn apply-zakat-rate
  "Applies the zakat rate to produce a calculated result map."
  [{:zakat/keys [wealth nisab] :as request}]
  (assoc request
         :zakat/amount-due (* wealth 0.025M)
         :zakat/eligible? (>= wealth nisab)
         :zakat/calculated-at (java.time.Instant/now)))

;; CORRECT: Transform maps — never mutate
(defn mark-paid
  "Returns a new transaction map with paid status — original unchanged."
  [transaction paid-at]
  (-> transaction
      (assoc :zakat/status :paid
             :zakat/paid-at paid-at)
      (dissoc :zakat/payment-reference))) ;; Remove pending reference

;; WRONG: Java-style class hierarchy for value objects
;; (defclass ZakatRequest [customer-id wealth currency]) ;; Not Clojure
```

## Records — Performance-Critical Types

**SHOULD** use `defrecord` for domain types where map protocol performance matters (large volumes, hot paths):

```clojure
;; CORRECT: defrecord for performance-critical domain types
(defrecord MurabahaContract
  [contract-id
   customer-id
   cost-price
   profit-margin
   installment-count
   created-at])

;; Factory function (preferred over direct record construction)
(defn make-murabaha-contract
  "Creates a validated MurabahaContract record."
  [customer-id cost-price profit-margin installment-count]
  (let [contract (->MurabahaContract
                  (str (java.util.UUID/randomUUID))
                  customer-id
                  cost-price
                  profit-margin
                  installment-count
                  (java.time.Instant/now))]
    (when-not (valid-murabaha-contract? contract)
      (throw (ex-info "Invalid Murabaha contract"
                      {:error :murabaha/invalid-contract
                       :contract contract})))
    contract))

;; CORRECT: Records support map operations (assoc returns new map, not record)
(def original-contract (make-murabaha-contract "cust-1" 50000M 5000M 12))
(def updated-contract (assoc original-contract :profit-margin 6000M))
;; updated-contract is a plain map — use map->MurabahaContract to keep record type

;; CORRECT: Convert back to record
(def updated-record (map->MurabahaContract (assoc original-contract :profit-margin 6000M)))
```

**Use records when**:

- Implementing Java interfaces (`:implements` in record definition)
- Field access performance is measurable bottleneck in hot path
- Type-based dispatch with `instance?` is needed

**Use plain maps when**:

- Flexibility and ad-hoc field addition is needed
- REPL exploration and prototyping
- Most domain operations (maps are idiomatic Clojure)

## Protocols — Polymorphism

**SHOULD** use `defprotocol` for polymorphic domain operations across different contract types:

```clojure
;; CORRECT: Protocol defines the domain interface
(defprotocol IslamicFinanceContract
  "Protocol for Sharia-compliant financial contracts."
  (total-obligation [this]
    "Returns the total financial obligation of the contract as BigDecimal.")
  (monthly-payment [this]
    "Returns the monthly payment amount as BigDecimal.")
  (sharia-compliant? [this]
    "Returns true if the contract satisfies Sharia requirements."))

;; CORRECT: extend-protocol to implement for existing types
(extend-protocol IslamicFinanceContract

  MurabahaContract
  (total-obligation [contract]
    (+ (:cost-price contract) (:profit-margin contract)))
  (monthly-payment [contract]
    (/ (total-obligation contract) (:installment-count contract)))
  (sharia-compliant? [contract]
    ;; Murabaha: profit must be fixed at outset, not interest
    (and (pos? (:profit-margin contract))
         (pos? (:installment-count contract))))

  ;; Ijarah (lease) contract
  clojure.lang.PersistentHashMap
  (total-obligation [contract]
    (* (:ijarah/monthly-rent contract) (:ijarah/duration-months contract)))
  (monthly-payment [contract]
    (:ijarah/monthly-rent contract))
  (sharia-compliant? [contract]
    ;; Ijarah: lessor must own the asset
    (boolean (:ijarah/asset-ownership-verified? contract))))

;; CORRECT: Polymorphic dispatch through protocol
(defn calculate-total-obligation [contract]
  (total-obligation contract)) ;; Works for MurabahaContract, Ijarah maps, etc.
```

## Multimethods — Open Dispatch

**SHOULD** use `defmulti`/`defmethod` for open-ended dispatch (adding new cases without modifying existing code):

```clojure
;; CORRECT: defmulti for Zakat calculation dispatch by asset type
(defmulti calculate-zakat-by-asset-type
  "Calculates zakat for different asset types.
  Dispatches on :zakat/asset-type keyword."
  :zakat/asset-type)

;; CORRECT: defmethod for each asset type
(defmethod calculate-zakat-by-asset-type :cash
  [{:zakat/keys [wealth nisab]}]
  ;; Cash: 2.5% if above nisab
  (if (>= wealth nisab)
    (* wealth 0.025M)
    0M))

(defmethod calculate-zakat-by-asset-type :gold
  [{:zakat/keys [weight-grams gold-price-per-gram nisab-grams]}]
  ;; Gold: zakat on weight above nisab
  (let [total-value (* weight-grams gold-price-per-gram)
        nisab-value (* nisab-grams gold-price-per-gram)]
    (if (>= weight-grams nisab-grams)
      (* total-value 0.025M)
      0M)))

(defmethod calculate-zakat-by-asset-type :livestock
  [{:zakat/keys [animal-type count]}]
  ;; Livestock: complex tiered calculation based on count and type
  (calculate-livestock-zakat animal-type count))

;; CORRECT: Default method for unknown asset types
(defmethod calculate-zakat-by-asset-type :default
  [{:zakat/keys [asset-type]}]
  (throw (ex-info "Unknown asset type for zakat calculation"
                  {:error :zakat/unknown-asset-type
                   :asset-type asset-type})))

;; CORRECT: Dispatch — Clojure finds the correct method automatically
(calculate-zakat-by-asset-type
 {:zakat/asset-type :cash
  :zakat/wealth 100000M
  :zakat/nisab 5000M})
;; => 2500M
```

## Clojure Specs as Domain Invariants

**MUST** use `clojure.spec.alpha` to define domain invariants — specs replace class-level validation logic:

```clojure
(ns ose.zakat.domain.specs
  (:require [clojure.spec.alpha :as s]))

;; CORRECT: Specs as domain invariants
(s/def :zakat/customer-id
  (s/and string? #(re-matches #"[a-zA-Z0-9\-]{8,36}" %)))

(s/def :zakat/wealth
  (s/and decimal?
         #(>= % 0M)))

(s/def :zakat/nisab
  (s/and decimal? pos?))

(s/def :zakat/asset-type
  #{:cash :gold :silver :livestock :trade-goods})

(s/def :zakat/status
  #{:pending :processing :paid :cancelled})

;; CORRECT: Compound specs for aggregate domain objects
(s/def :zakat/payment-request
  (s/keys :req [:zakat/customer-id
                :zakat/wealth
                :zakat/nisab
                :zakat/asset-type]
          :opt [:zakat/currency
                :zakat/notes]))

(s/def :zakat/transaction
  (s/keys :req [:zakat/transaction-id
                :zakat/customer-id
                :zakat/wealth
                :zakat/amount-due
                :zakat/status
                :zakat/created-at]))

;; CORRECT: Using specs for validation at domain boundaries
(defn create-zakat-payment-request
  "Creates a validated Zakat payment request. Throws on invalid data."
  [customer-id wealth nisab asset-type]
  (let [request {:zakat/customer-id customer-id
                 :zakat/wealth wealth
                 :zakat/nisab nisab
                 :zakat/asset-type asset-type}]
    (when-not (s/valid? :zakat/payment-request request)
      (throw (ex-info "Invalid zakat payment request"
                      {:error :validation/invalid-request
                       :problems (s/explain-data :zakat/payment-request request)})))
    request))
```

## Namespaced Keywords for Domain Concepts

**MUST** use namespaced keywords to represent domain concepts from different bounded contexts:

```clojure
;; CORRECT: Namespaced keywords separate bounded contexts
{;; Zakat bounded context
 :zakat/transaction-id   "tx-001"
 :zakat/wealth           100000M
 :zakat/amount-due       2500M
 :zakat/status           :paid

 ;; Murabaha bounded context
 :murabaha/contract-id   "mc-001"
 :murabaha/cost-price    50000M
 :murabaha/profit-margin 5000M

 ;; Customer bounded context
 :customer/id            "cust-123"
 :customer/name          "Ahmad bin Abdullah"

 ;; Infrastructure context (database IDs, timestamps)
 :db/id                  42
 :db/created-at          (java.time.Instant/now)}

;; WRONG: Unnamespaced keywords — collisions between contexts
{:id         "tx-001"   ;; Which domain's ID?
 :amount     2500M      ;; Amount of what?
 :status     :paid}     ;; Paid what?
```

## Aggregate Boundaries

**MUST** define aggregate roots as the entry point for domain operations — no direct access to internal entities:

```clojure
;; CORRECT: ZakatAggregate as the root — all operations go through it
(ns ose.zakat.aggregate)

(defn create-zakat-aggregate
  "Creates a new Zakat aggregate with a payment request."
  [payment-request]
  {:zakat.aggregate/id         (str (java.util.UUID/randomUUID))
   :zakat.aggregate/request    payment-request
   :zakat.aggregate/payments   []
   :zakat.aggregate/status     :open
   :zakat.aggregate/version    0})

(defn add-payment-to-aggregate
  "Adds a payment to the aggregate. Returns updated aggregate — immutable."
  [aggregate payment]
  (-> aggregate
      (update :zakat.aggregate/payments conj payment)
      (assoc :zakat.aggregate/status (if (fully-paid? aggregate payment) :closed :open))
      (update :zakat.aggregate/version inc)))

;; CORRECT: Repository saves and loads the full aggregate
(defn save-aggregate! [db aggregate]
  (repo/upsert! db :zakat_aggregates aggregate))
```

## Enforcement

- **clj-kondo** - Detects undefined specs and incorrect `s/keys` usage
- **clojure.spec** - Validates domain data at runtime when `s/check-asserts` is enabled
- **Code reviews** - Reviewers verify namespaced keywords, protocol usage, aggregate boundaries
- **Testing** - `s/generate` generates valid test data from specs automatically

## Related Standards

- [Coding Standards](./coding-standards.md) - Namespaced keyword naming conventions
- [Testing Standards](./testing-standards.md) - Using `s/generate` for property-based test data
- [Error Handling Standards](./error-handling-standards.md) - `s/explain-data` in ex-info for spec failures

## Related Documentation

**Software Engineering Principles**:

- [Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

---

**Maintainers**: Platform Documentation Team

**Clojure Version**: 1.10+ (baseline), 1.12 (recommended)
