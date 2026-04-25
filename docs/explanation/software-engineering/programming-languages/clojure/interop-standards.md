---
title: "Clojure Java Interop Standards"
description: Authoritative OSE Platform Clojure Java interop standards (JVM integration, type hints, collection conversion, doto macro)
category: explanation
subcategory: prog-lang
tags:
  - clojure
  - java-interop
  - jvm
  - interop-standards
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Clojure Java Interop Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Clojure fundamentals from [AyoKoding Clojure Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/clojure/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Clojure tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines standards for Java interoperability in Clojure development at OSE Platform. Clojure runs on the JVM and provides seamless Java interop — enabling access to the rich Java ecosystem while maintaining Clojure's functional idioms.

**Target Audience**: OSE Platform Clojure developers integrating with Java libraries (JDBC, cryptography, ML)

**Scope**: Java method call syntax, constructors, static methods, type hints to avoid reflection, converting between Java and Clojure collections, importing Java classes, doto macro for builder patterns, functional interfaces in Clojure 1.12

## Software Engineering Principles

### 1. Explicit Over Implicit

**MUST** use explicit type hints at Java interop boundaries to eliminate reflection. Raw Java objects MUST NOT leak into the functional core — wrap them in Clojure data maps at boundaries.

```clojure
;; CORRECT: Wrap Java type in Clojure map at the boundary
(defn parse-instant [^java.time.Instant instant]
  {:instant/epoch-second (.getEpochSecond instant)
   :instant/nano          (.getNano instant)})
```

### 2. Pure Functions Over Side Effects

**MUST** isolate Java interop (which often involves side effects) at the imperative shell. The functional core uses only Clojure data maps and pure functions.

### 3. Immutability Over Mutability

**MUST** convert Java mutable collections to immutable Clojure equivalents immediately after receiving them from Java APIs — never pass Java collections through the functional core.

### 4. Automation Over Manual

**MUST** enable `*warn-on-reflection*` in development to detect reflection automatically. Eastwood automates additional interop checks.

### 5. Reproducibility First

**MUST** pin the JVM version in `.tool-versions` or `.sdkmanrc` — Java behavior varies across JVM versions.

## Java Method Call Syntax

**MUST** use Clojure's dot notation for calling instance methods:

```clojure
;; CORRECT: (.method object args...)
(.toPlainString ^java.math.BigDecimal amount)      ;; Instance method, no args
(.multiply ^java.math.BigDecimal amount rate)      ;; Instance method with arg
(.format (java.text.SimpleDateFormat. "yyyy-MM-dd") date) ;; With constructor

;; CORRECT: (.. object method1 method2) for chained calls
(.. contract (getCustomer) (getId))
;; Equivalent to: (.getId (.getCustomer contract))

;; WRONG: Passing raw Java objects through the functional core
(defn bad-calculate-duration [^java.time.Instant start ^java.time.Instant end]
  (.between java.time.Duration start end)) ;; Raw Java leaks into domain logic
```

## Constructors

**MUST** use `ClassName.` (with dot suffix) to call Java constructors:

```clojure
;; CORRECT: Java constructor with trailing dot
(java.util.Date.)                                   ;; No-arg constructor
(java.math.BigDecimal. "100000")                   ;; String constructor
(java.io.FileOutputStream. "/path/to/file")        ;; Path constructor

;; CORRECT: Import and use short name
(ns ose.zakat.util
  (:import [java.math BigDecimal MathContext RoundingMode]
           [java.time Instant LocalDate]
           [java.util UUID]))

(BigDecimal. "100000")        ;; After import — no full class name needed
(Instant/now)                 ;; Static factory method (preferred over constructor)
(UUID/randomUUID)             ;; Static factory method
(LocalDate/now)               ;; Static factory method

;; PREFERRED: Static factory methods over constructors when available
(java.math.BigDecimal/valueOf 42.5)  ;; Preferred over (BigDecimal. "42.5") where possible
```

## Static Methods

**MUST** use `ClassName/staticMethod` for static methods:

```clojure
;; CORRECT: Static method calls
(java.util.UUID/randomUUID)              ;; UUID.randomUUID()
(java.time.Instant/now)                  ;; Instant.now()
(java.time.LocalDate/parse "2026-03-09") ;; LocalDate.parse(String)
(Math/abs -42.0)                         ;; Math.abs(double)
(System/currentTimeMillis)               ;; System.currentTimeMillis()
(System/getenv "JWT_SECRET_KEY")         ;; System.getenv(String)

;; Clojure 1.12+: Method values as first-class functions
;; String/toUpperCase can be used directly as a function (no lambda wrapper)
(map String/toUpperCase ["hello" "world"])
;; => ("HELLO" "WORLD")

;; Clojure 1.12+: Array class syntax
String/1   ;; Refers to String[] (single-element array class)
```

## Type Hints — Eliminating Reflection

**MUST** add type hints at all Java interop call sites in production code:

```clojure
;; WRONG: Reflection on every call (Clojure must look up method at runtime)
(defn format-amount [amount]
  (.toPlainString amount))

;; CORRECT: Type hint eliminates reflection
(defn format-amount
  "Formats a BigDecimal amount as plain string."
  ^String [^java.math.BigDecimal amount]
  (.toPlainString amount))

;; CORRECT: Primitive hints for numeric operations
(defn count-installments
  ^long [^long total-months ^long frequency-months]
  (quot total-months frequency-months))

;; CORRECT: Enable reflection warnings to find missing hints
(set! *warn-on-reflection* true)
;; Clojure prints warnings for every reflective call during development
```

## Importing Java Classes

**MUST** import Java classes in the `ns` declaration using `:import`:

```clojure
;; CORRECT: Grouped imports by package
(ns ose.zakat.calculator
  (:require [clojure.spec.alpha :as s])
  (:import
   [java.time Instant LocalDate ZoneId]
   [java.math BigDecimal MathContext RoundingMode]
   [java.util UUID]
   [java.io FileInputStream PushbackReader]))

;; After import — use short class names
(defn create-transaction-id [] (str (UUID/randomUUID)))
(defn round-to-currency ^BigDecimal [^BigDecimal amount]
  (.setScale amount 2 RoundingMode/HALF_UP))
```

## Converting Between Java and Clojure Collections

**MUST** convert Java mutable collections to immutable Clojure equivalents immediately at boundaries:

```clojure
;; CORRECT: Convert Java List to Clojure vector immediately
(defn java-list->clj [^java.util.List java-list]
  (into [] java-list))

;; CORRECT: Convert Java Map to Clojure map
(defn java-map->clj [^java.util.Map java-map]
  (into {} (map (fn [[k v]] [(keyword k) v]) java-map)))

;; CORRECT: Convert Clojure sequence to Java List (for Java APIs that require it)
(defn clojure->java-list [coll]
  (java.util.ArrayList. coll))

;; CORRECT: iterator-seq for consuming Java iterators lazily
(defn process-java-iterator [^java.util.Iterator iterator]
  (iterator-seq iterator))

;; CORRECT: bean for converting Java beans to Clojure maps
(defn java-bean->map [bean-obj]
  (into {} (bean bean-obj)))

;; WRONG: Using Java collections inside the functional core
(defn bad-process [^java.util.List items]
  (map some-fn items)) ;; Mutable Java list in functional pipeline — convert first!
```

## Implementing Java Interfaces

**MUST** use `reify` (preferred) for implementing Java interfaces. Use `proxy` only when subclassing a concrete class:

```clojure
;; CORRECT: reify for interfaces (preferred — faster than proxy)
(defn make-runnable [f]
  (reify java.lang.Runnable
    (run [_] (f))))

;; CORRECT: proxy when subclassing a concrete class
(defn make-thread [f]
  (proxy [Thread] []
    (run [] (f))))

;; Clojure 1.12+: Functional interfaces accept Clojure functions directly
;; No reify needed for single-abstract-method (SAM) interfaces
(java.util.Collections/sort
 contracts
 (fn [a b] (.compareTo (:murabaha/profit-margin a)
                       (:murabaha/profit-margin b)))) ;; fn used as Comparator (1.12+)
```

## doto — Java Builder Patterns

**MUST** use `doto` for configuring Java objects with multiple method calls:

```clojure
;; CORRECT: doto for Java builder pattern
(defn build-hikari-config [config]
  (doto (com.zaxxer.hikari.HikariConfig.)
    (.setJdbcUrl (:db-url config))
    (.setUsername (:db-user config))
    (.setPassword (:db-password config))
    (.setMaximumPoolSize (:pool-size config 10))
    (.setConnectionTimeout (:connection-timeout config 30000))
    (.setIdleTimeout (:idle-timeout config 600000))))

;; doto returns the configured object — chain into the constructor
(defn create-connection-pool [config]
  (com.zaxxer.hikari.HikariDataSource. (build-hikari-config config)))

;; WRONG: Repetitive let bindings without doto
(defn bad-build-config [config]
  (let [ds (com.zaxxer.hikari.HikariConfig.)]
    (.setJdbcUrl ds (:db-url config))
    (.setUsername ds (:db-user config))
    ds)) ;; doto is more readable and idiomatic
```

## Exception Handling at Interop Boundaries

**MUST** catch Java exceptions at interop boundaries and convert to `ex-info` with Clojure data:

```clojure
;; CORRECT: Catch specific Java exception, convert to ex-info
(defn parse-amount
  "Parses a string amount to BigDecimal. Throws ex-info on invalid input."
  [^String s]
  (try
    (BigDecimal. s)
    (catch NumberFormatException e
      (throw (ex-info "Invalid amount format"
                      {:error :validation/invalid-amount
                       :input s}
                      e)))))

;; WRONG: Swallow exception or re-throw raw Java exception
(defn bad-parse-amount [s]
  (try
    (BigDecimal. s)
    (catch Exception e e))) ;; Caller gets raw Java exception — no structured data
```

## When to Use Java Interop

**SHOULD** use Java interop to leverage the Java ecosystem for:

- **Database**: `java.sql.*` via next.jdbc
- **Cryptography**: `javax.crypto`, `java.security`
- **Date/Time**: `java.time.*` (prefer over `java.util.Date`)
- **Precision math**: `java.math.BigDecimal` for financial calculations
- **Process management**: `java.lang.ProcessBuilder` (or `clojure.java.process` in 1.12+)

**MUST NOT** use Java interop when Clojure has equivalent functionality:

```clojure
;; WRONG: Java String methods when Clojure string namespace exists
(.toUpperCase "hello")     ;; Use (clojure.string/upper-case "hello")
(.trim "  hello  ")        ;; Use (clojure.string/trim "  hello  ")

;; CORRECT: Prefer Clojure namespaces
(clojure.string/upper-case "hello")
(clojure.string/trim "  hello  ")
```

## Enforcement

| Tool                   | What It Checks                                 |
| ---------------------- | ---------------------------------------------- |
| `*warn-on-reflection*` | Reflection warnings in development builds      |
| `clj-kondo`            | Type hint completeness, import hygiene         |
| Eastwood               | Interop anti-patterns and misuse               |
| Code review            | Raw Java objects in functional core (CRITICAL) |

## Related Standards

- [Code Quality Standards](./code-quality-standards.md) - Reflection warnings as Eastwood checks
- [Performance Standards](./performance-standards.md) - Type hints in performance-critical paths
- [Error Handling Standards](./error-handling-standards.md) - Converting Java exceptions to ex-info
- [Build Configuration](./build-configuration.md) - JVM version pinning in deps.edn

## Related Documentation

**Software Engineering Principles**:

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)

---

**Maintainers**: Platform Documentation Team

**Clojure Version**: 1.10+ (baseline), 1.12 (recommended — functional interface improvements)
