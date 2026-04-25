---
title: "Clojure Testing Standards"
description: Authoritative OSE Platform Clojure testing standards (clojure.test, Midje, test.check, cloverage)
category: explanation
subcategory: prog-lang
tags:
  - clojure
  - testing-standards
  - clojure-test
  - midje
  - test-check
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Clojure Testing Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Clojure fundamentals from [AyoKoding Clojure Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/clojure/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Clojure tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines authoritative testing standards for Clojure development in OSE Platform. Because Clojure encourages pure functions by default, testing is exceptionally straightforward — pure functions require no mocking and can be tested in isolation at the REPL.

**Target Audience**: OSE Platform Clojure developers, QA engineers, automated quality tools

**Scope**: clojure.test structure, Midje BDD-style assertions, test.check property-based testing, cloverage coverage requirements, REPL-based test workflows

## Software Engineering Principles

### 1. Automation Over Manual

Automated test execution with `cloverage` enforces >=95% coverage in CI/CD.

**PASS Example**:

```clojure
;; CORRECT: Automated test suite with coverage
;; deps.edn alias for running coverage
;; {:aliases {:coverage {:extra-deps {cloverage/cloverage {:mvn/version "1.2.4"}}
;;                       :main-opts ["-m" "cloverage.coverage" "--src-ns-path" "src" "test"]}}}

;; Run: clojure -M:coverage --fail-threshold 95
```

### 2. Pure Functions Over Side Effects

Clojure's pure functions require no mocking — test them directly.

**PASS Example**:

```clojure
;; CORRECT: Pure function tested with no mocking required
(deftest calculate-zakat-test
  (testing "wealth above nisab returns 2.5%"
    (is (= 2500M (calculate-zakat 100000M 5000M))))
  (testing "wealth below nisab returns zero"
    (is (= 0M (calculate-zakat 3000M 5000M)))))
```

### 3. Explicit Over Implicit

Test names explicitly describe behavior. Test data uses namespaced keywords for clarity.

### 4. Immutability Over Mutability

Immutable test fixtures — tests never share mutable state. Each `deftest` is independent.

### 5. Reproducibility First

Tests are deterministic. Property-based tests use fixed seeds for reproducible failure investigation.

## clojure.test — Primary Testing Framework

**MUST** use `clojure.test` as the primary testing framework for all Clojure projects.

### deftest and testing

```clojure
(ns ose.zakat.calculator-test
  (:require [clojure.test :refer [deftest testing is are]]
            [ose.zakat.calculator :as calc]))

;; CORRECT: deftest wraps a test group; testing provides context
(deftest calculate-zakat-wealth-scenarios
  (testing "wealth above nisab threshold"
    (is (= 2500M (calc/calculate-zakat 100000M 5000M))
        "2.5% of 100000 is 2500"))

  (testing "wealth exactly at nisab threshold"
    (is (= 125M (calc/calculate-zakat 5000M 5000M))
        "2.5% of 5000 is 125"))

  (testing "wealth below nisab threshold"
    (is (= 0M (calc/calculate-zakat 3000M 5000M))
        "No zakat when below nisab")))

(deftest validate-nisab-scenarios
  (testing "valid positive nisab"
    (is (calc/valid-nisab? 5000M)))
  (testing "zero is not valid nisab"
    (is (not (calc/valid-nisab? 0M))))
  (testing "negative is not valid nisab"
    (is (not (calc/valid-nisab? -100M)))))
```

### are — Table-Driven Tests

**SHOULD** use `are` for table-driven test cases with multiple inputs:

```clojure
;; CORRECT: are macro for concise table-driven tests
(deftest calculate-zakat-table-test
  (are [wealth nisab expected]
       (= expected (calc/calculate-zakat wealth nisab))
    ;; wealth    nisab   expected
    100000M  5000M   2500M   ;; 2.5% of 100000
    50000M   5000M   1250M   ;; 2.5% of 50000
    5000M    5000M   125M    ;; exactly at threshold
    4999M    5000M   0M      ;; just below threshold
    0M       5000M   0M))    ;; zero wealth
```

### Testing Exception Behavior

```clojure
;; CORRECT: Testing that ex-info is thrown with correct data
(deftest invalid-contract-throws-test
  (testing "invalid customer-id throws ex-info"
    (is (thrown-with-msg?
         clojure.lang.ExceptionInfo
         #"Invalid Murabaha contract"
         (create-murabaha-contract nil 50000M 5000M 12))))

  (testing "ex-data contains spec errors"
    (try
      (create-murabaha-contract "" 50000M 5000M 12)
      (catch clojure.lang.ExceptionInfo e
        (is (contains? (ex-data e) :spec-errors))
        (is (= :validation/failed (:error (ex-data e))))))))
```

### Test Organization

**MUST** organize tests mirroring the source namespace structure:

```
src/ose/zakat/calculator.clj
test/ose/zakat/calculator_test.clj   ;; _test suffix, not -test

src/ose/murabaha/contract.clj
test/ose/murabaha/contract_test.clj
```

**MUST** define one `deftest` per logical behavior (not one per function):

```clojure
;; CORRECT: One deftest per behavior
(deftest zakat-calculation-below-nisab-returns-zero ...)
(deftest zakat-calculation-above-nisab-returns-2-point-5-percent ...)

;; WRONG: One deftest for everything (too broad)
(deftest everything-test ...)
```

## Midje — BDD-Style Assertions

**MAY** use Midje for BDD-style `fact`/`facts` on complex business rule documentation.

```clojure
(ns ose.zakat.calculator-midje-test
  (:require [midje.sweet :refer :all]
            [ose.zakat.calculator :as calc]))

;; CORRECT: Midje fact for business rule documentation
(fact "Zakat is calculated as 2.5% of wealth above nisab"
  (calc/calculate-zakat 100000M 5000M) => 2500M
  (calc/calculate-zakat 50000M 5000M) => 1250M)

(fact "No zakat is due when wealth is below nisab"
  (calc/calculate-zakat 3000M 5000M) => 0M
  (calc/calculate-zakat 0M 5000M) => 0M)

(facts "about Murabaha contract creation"
  (fact "creates contract with generated ID"
    (let [contract (create-murabaha-contract "cust-1" 50000M 5000M 12)]
      (:murabaha/customer-id contract) => "cust-1"
      (:murabaha/cost-price contract) => 50000M))
  (fact "throws on nil customer-id"
    (create-murabaha-contract nil 50000M 5000M 12) => (throws clojure.lang.ExceptionInfo)))
```

## test.check — Property-Based Testing

**SHOULD** use `test.check` for property-based testing of domain invariants.

```clojure
(ns ose.zakat.calculator-prop-test
  (:require [clojure.test :refer [deftest is]]
            [clojure.test.check :as tc]
            [clojure.test.check.generators :as gen]
            [clojure.test.check.properties :as prop]
            [ose.zakat.calculator :as calc]))

;; CORRECT: Property — zakat is always non-negative
(def zakat-non-negative-prop
  (prop/for-all [wealth (gen/fmap #(bigdec (Math/abs %)) gen/large-integer)
                 nisab  (gen/fmap #(bigdec (inc (Math/abs %))) gen/large-integer)]
    (>= (calc/calculate-zakat wealth nisab) 0M)))

(deftest zakat-non-negative-property
  (let [result (tc/quick-check 1000 zakat-non-negative-prop)]
    (is (:pass? result) (str "Failed: " result))))

;; CORRECT: Property — zakat never exceeds wealth
(def zakat-does-not-exceed-wealth-prop
  (prop/for-all [wealth (gen/fmap #(bigdec (inc (Math/abs %))) gen/large-integer)
                 nisab  (gen/fmap #(bigdec (inc (Math/abs %))) gen/large-integer)]
    (<= (calc/calculate-zakat wealth nisab) wealth)))

(deftest zakat-does-not-exceed-wealth
  (let [result (tc/quick-check 1000 zakat-does-not-exceed-wealth-prop)]
    (is (:pass? result) (str "Failed: " result))))

;; CORRECT: defspec shorthand (test.check integration with clojure.test)
(require '[clojure.test.check.clojure-test :refer [defspec]])

(defspec zakat-rate-is-exactly-2-point-5-percent 500
  (prop/for-all [wealth (gen/fmap #(bigdec (* 1000 (inc (Math/abs %)))) gen/small-integer)
                 nisab  (gen/return 5000M)]
    (let [zakat (calc/calculate-zakat wealth nisab)]
      (= zakat (* wealth 0.025M)))))
```

## REPL-Based Test Running

**MUST** run tests via REPL during development:

```clojure
;; CORRECT: REPL test workflow
(comment
  ;; Run a single test namespace
  (require '[clojure.test :as t])
  (t/run-tests 'ose.zakat.calculator-test)

  ;; Run all tests in project
  (t/run-all-tests)

  ;; Run a specific deftest by name
  (t/test-var #'ose.zakat.calculator-test/calculate-zakat-wealth-scenarios)

  ;; Run with kaocha (recommended test runner)
  ;; From shell: clojure -M:test --reporter kaocha.report/documentation
  )
```

**SHOULD** use kaocha as the test runner for structured output and watch mode:

```clojure
;; CORRECT: tests.edn for kaocha configuration
{:kaocha/tests [{:kaocha.testable/id :unit
                 :kaocha.testable/type :kaocha.type/clojure.test
                 :kaocha/source-paths ["src"]
                 :kaocha/test-paths ["test"]
                 :kaocha/ns-patterns [".*-test$"]}]}
```

## Coverage with cloverage

**MUST** achieve >=95% line coverage for domain logic:

```clojure
;; CORRECT: Coverage measurement with cloverage
;; Run: clojure -M:coverage --src-ns-path src --fail-threshold 95 --output target/coverage

;; deps.edn alias
{:aliases
 {:coverage
  {:extra-deps {cloverage/cloverage {:mvn/version "1.2.4"}}
   :main-opts ["-m" "cloverage.coverage"
               "--src-ns-path" "src"
               "--test-ns-path" "test"
               "--fail-threshold" "95"
               "--output" "target/coverage"]}}}
```

**Coverage exclusions** — use `#_` reader macro or `^:no-cover` metadata only for:

- Namespace declarations (`ns` forms)
- Side-effecting I/O functions with external dependencies (database, HTTP)
- `(comment ...)` blocks (already excluded by cloverage)

## Related Standards

- [Coding Standards](./coding-standards.md) - Naming conventions for test namespaces
- [Code Quality Standards](./code-quality-standards.md) - clj-kondo rules for test code
- [Build Configuration](./build-configuration.md) - deps.edn aliases for test execution

## Related Documentation

**Software Engineering Principles**:

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**Clojure Version**: 1.10+ (baseline), 1.12 (recommended)
