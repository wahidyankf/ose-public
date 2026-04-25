---
title: "Clojure Code Quality Standards"
description: Authoritative OSE Platform Clojure code quality standards (clj-kondo, cljfmt, Eastwood)
category: explanation
subcategory: prog-lang
tags:
  - clojure
  - code-quality
  - clj-kondo
  - cljfmt
  - eastwood
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Clojure Code Quality Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Clojure fundamentals from [AyoKoding Clojure Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/clojure/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Clojure tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines the mandatory code quality toolchain for Clojure development in OSE Platform. All tools run automatically in pre-commit hooks and CI/CD — manual code quality checks are insufficient.

**Target Audience**: OSE Platform Clojure developers, DevOps engineers, automated quality tools

**Scope**: clj-kondo configuration, cljfmt formatting rules, Eastwood additional linting, reflection warnings, namespace aliases, code hygiene rules

## Software Engineering Principles

### 1. Automation Over Manual

**MUST** run all quality tools automatically in pre-commit hooks and CI/CD:

```bash
# CORRECT: Pre-commit hook runs both linter and formatter check
clj-kondo --lint src test
cljfmt check src test
```

**MUST NOT** rely on manual code review to catch linting and formatting issues.

### 2. Explicit Over Implicit

**MUST** make clj-kondo and cljfmt configuration explicit in committed files:

```
.clj-kondo/config.edn   ;; Explicit linting configuration
.cljfmt.edn             ;; Explicit formatting configuration
```

### 3. Immutability Over Mutability

clj-kondo detects unintentional mutation patterns and alerts developers to unexpected side effects.

### 4. Pure Functions Over Side Effects

Eastwood catches functions that silently ignore return values, which often indicates missing pure function composition.

### 5. Reproducibility First

**MUST** pin exact versions of all quality tools in `deps.edn` for reproducible quality gate results across environments.

## clj-kondo — Mandatory Static Analysis

**MUST** configure clj-kondo in `.clj-kondo/config.edn` at the project root.

### Minimal Required Configuration

```clojure
;; CORRECT: .clj-kondo/config.edn
{:linters
 {:unused-namespace {:level :error}
  :unused-referred-var {:level :error}
  :redundant-do {:level :warning}
  :redundant-let {:level :warning}
  :unused-binding {:level :warning}
  :unresolved-symbol {:level :error}
  :missing-docstring {:level :warning
                      :exclude-regex ".*-test$"} ;; Don't require docstrings in test namespaces
  :warn-on-reflection {:level :warning}}

 :output
 {:format :text}

 :config-paths [".clj-kondo"]}
```

### Custom Lint Rules for OSE Platform

```clojure
;; CORRECT: Extended config for OSE Platform conventions
{:linters
 {:unused-namespace {:level :error}
  :unused-referred-var {:level :error}
  :unused-binding {:level :warning}
  :unresolved-symbol {:level :error}
  :missing-docstring {:level :warning
                      :exclude-regex ".*-test$"}

  ;; Detect side-effecting functions called without !
  :clojure-lsp/unused-public-var {:level :warning}}

 ;; Suppress false positives for Midje and test.check macros
 :lint-as {midje.sweet/fact clojure.core/comment
           midje.sweet/facts clojure.core/comment}

 ;; Enforce consistent namespace aliases
 :namespace-aliases
 {:clojure.string str
  :clojure.spec.alpha s
  :next.jdbc jdbc
  :next.jdbc.sql sql
  :ring.util.response response
  :reitit.core r
  :integrant.core ig}}
```

### Running clj-kondo

```bash
# CORRECT: Lint source and test directories
clj-kondo --lint src test

# CORRECT: Lint a specific file
clj-kondo --lint src/ose/zakat/calculator.clj

# CORRECT: Generate cache for library analysis (run once after adding deps)
clj-kondo --copy-configs --dependencies --lint "$(clojure -Spath)"
```

**MUST** run `clj-kondo --copy-configs --dependencies` when adding new library dependencies to enable library-aware linting.

## cljfmt — Mandatory Formatting

**MUST** configure cljfmt in `.cljfmt.edn` at the project root.

### Required cljfmt Configuration

```clojure
;; CORRECT: .cljfmt.edn
{:indents
 {;; Threading macros — body at 2 spaces
  -> [[:inner 0]]
  ->> [[:inner 0]]
  as-> [[:inner 0]]

  ;; Test macros
  deftest [[:inner 0]]
  testing [[:inner 0]]
  fact [[:inner 0]]
  facts [[:inner 0]]

  ;; Lifecycle macros
  defstate [[:inner 0]]}

 :remove-surrounding-whitespace? true
 :remove-trailing-whitespace? true
 :insert-missing-whitespace? true
 :align-associative? false} ;; Avoid alignment — too noisy in diffs
```

### Running cljfmt

```bash
# CORRECT: Check formatting without modifying files (CI/CD gate)
cljfmt check

# CORRECT: Fix formatting in place (pre-commit hook)
cljfmt fix

# CORRECT: Check specific paths
cljfmt check src test
```

**MUST** run `cljfmt fix` in the pre-commit hook (not just `check`) to auto-correct formatting:

```bash
# CORRECT: .git/hooks/pre-commit
#!/bin/bash
set -e
clj-kondo --lint src test
cljfmt fix
git add -u  ;; Stage auto-fixed formatting changes
```

### Formatting Rules

**MUST NOT** use alignment in map literals (creates noisy diffs):

```clojure
;; CORRECT: No alignment
{:zakat/contract-id "tx-001"
 :zakat/payer-id "cust-123"
 :zakat/amount 2500M
 :zakat/status :pending}

;; WRONG: Aligned values (diff-noisy, cljfmt will reformat)
{:zakat/contract-id  "tx-001"
 :zakat/payer-id     "cust-123"
 :zakat/amount       2500M
 :zakat/status       :pending}
```

**MUST** use 2-space indentation for function body:

```clojure
;; CORRECT: 2-space indentation
(defn calculate-zakat
  [wealth nisab]
  (if (>= wealth nisab)
    (* wealth 0.025M)
    0M))

;; WRONG: Non-standard indentation
(defn calculate-zakat
      [wealth nisab]
      (if (>= wealth nisab)
            (* wealth 0.025M)
            0M))
```

## Eastwood — Additional Linting

**SHOULD** use Eastwood for catching reflection warnings and additional code smells.

```clojure
;; CORRECT: deps.edn alias for Eastwood
{:aliases
 {:eastwood
  {:extra-deps {jonase/eastwood {:mvn/version "1.4.3"}}
   :main-opts ["-m" "eastwood.lint" "{:source-paths [\"src\"]}"]}}
```

### Key Eastwood Checks

Eastwood catches issues clj-kondo does not:

- **`:unused-ret-vals`** - Functions whose return values are silently ignored (often a bug)
- **`:reflection`** - Java interop calls without type hints causing runtime reflection
- **`:deprecations`** - Use of deprecated Clojure functions
- **`:bad-arglists`** - Incorrect arity metadata on functions
- **`:constant-test`** - Conditions that always evaluate to the same value

```bash
# CORRECT: Run Eastwood
clojure -M:eastwood
```

## Reflection Warnings

**MUST** enable `*warn-on-reflection*` in development namespaces to detect unintentional reflection:

```clojure
;; CORRECT: Enable reflection warnings in development
(ns ose.dev
  (:require [clojure.repl :refer :all]))

(set! *warn-on-reflection* true)

;; CORRECT: Type hints to eliminate reflection
(defn format-amount
  "Formats a BigDecimal amount as string."
  ^String [^java.math.BigDecimal amount]
  (.toPlainString amount))

;; WRONG: No type hint — causes reflection
(defn bad-format-amount [amount]
  (.toPlainString amount)) ;; Warning: Reflection call to java.lang.Object.toPlainString
```

**MUST** resolve all reflection warnings in production code before merge.

## No Unused Vars

**MUST NOT** leave unused vars in production code:

```clojure
;; WRONG: Unused var (clj-kondo will flag at :error level)
(defn unused-helper [x] (* x 2)) ;; Never called anywhere

;; CORRECT: Remove unused vars, or mark intentionally unused with ^:private
(defn ^:private internal-helper [x] (* x 2)) ;; Suppress if truly needed but not public
```

## No Commented-Out Code

**MUST NOT** leave commented-out production code in committed files:

```clojure
;; WRONG: Commented-out code in production namespace
(defn calculate-zakat [wealth nisab]
  ;; (println "debug" wealth nisab) ;; Old debug statement — remove!
  ;; (let [old-rate 0.02M] ...) ;; Old implementation — remove!
  (if (>= wealth nisab)
    (* wealth 0.025M)
    0M))

;; CORRECT: Use (comment) for exploratory REPL code only
(comment
  ;; This is exploratory REPL code — acceptable in source files
  (calculate-zakat 100000M 5000M)
  ;; => 2500M
  )
```

**Exception**: `(comment ...)` blocks for REPL exploration are acceptable and SHOULD be preserved for developer productivity.

## Enforcement

These standards are enforced through:

- **clj-kondo** - Runs in pre-commit hook and CI/CD (blocks on error)
- **cljfmt** - Auto-fixes in pre-commit hook, checks in CI/CD
- **Eastwood** - Runs in CI/CD (warnings tracked, errors block)
- **Code reviews** - Reviewers verify no reflection warnings in production code

**CI/CD Quality Gate**:

```bash
# CORRECT: CI/CD pipeline steps
clojure -P                          ;; Download all dependencies
clj-kondo --lint src test           ;; Static analysis (fail on errors)
cljfmt check                        ;; Formatting (fail if not formatted)
clojure -M:eastwood                 ;; Additional linting
clojure -M:test                     ;; Run tests
clojure -M:coverage --fail-threshold 95  ;; Coverage gate
```

## Related Standards

- [Coding Standards](./coding-standards.md) - Naming conventions enforced by clj-kondo
- [Build Configuration](./build-configuration.md) - deps.edn aliases for quality tools
- [Testing Standards](./testing-standards.md) - Coverage requirements

## Related Documentation

**Software Engineering Principles**:

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**Clojure Version**: 1.10+ (baseline), 1.12 (recommended)
