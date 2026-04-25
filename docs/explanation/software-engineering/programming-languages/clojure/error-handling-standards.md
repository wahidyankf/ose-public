---
title: "Clojure Error Handling Standards"
description: Authoritative OSE Platform Clojure error handling standards (ex-info, structured errors, try/catch, Result maps)
category: explanation
subcategory: prog-lang
tags:
  - clojure
  - error-handling
  - ex-info
  - conditions
  - try-catch
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Clojure Error Handling Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Clojure fundamentals from [AyoKoding Clojure Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/clojure/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Clojure tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines authoritative error handling standards for Clojure development in OSE Platform. Clojure's `ex-info` with structured data maps provides richer error context than plain Java exceptions.

**Target Audience**: OSE Platform Clojure developers, technical reviewers

**Scope**: ex-info structured errors, try/catch/finally, Java interop exception handling, Result-like patterns, error data conventions

## Software Engineering Principles

### 1. Explicit Over Implicit

**MUST** use `ex-info` with explicit structured data maps — never use `(throw (Exception. "message"))` without context:

```clojure
;; CORRECT: Explicit structured error with data map
(throw (ex-info "Zakat calculation failed"
                {:error :zakat/calculation-error
                 :wealth wealth
                 :nisab nisab
                 :reason :invalid-input}))

;; WRONG: Raw exception with no structured data
(throw (Exception. "Calculation failed")) ;; No context for callers
```

### 2. Pure Functions Over Side Effects

Domain validation functions return data describing invalid state — they do not throw. Only service-layer orchestration throws `ex-info`:

```clojure
;; CORRECT: Pure validation returns error data, not exceptions
(defn validate-zakat-input [wealth nisab]
  (cond
    (not (decimal? wealth)) {:error :invalid-wealth :value wealth}
    (not (pos? nisab))      {:error :invalid-nisab :value nisab}
    :else                   nil)) ;; nil = valid

;; CORRECT: Service layer throws based on validation result
(defn calculate-zakat! [wealth nisab]
  (when-let [err (validate-zakat-input wealth nisab)]
    (throw (ex-info "Invalid zakat input" err)))
  (domain/calculate-zakat wealth nisab))
```

### 3. Immutability Over Mutability

Error data maps are immutable. `ex-data` returns the original data map — callers cannot mutate it.

### 4. Explicit Over Implicit (error keywords)

**MUST** use namespaced keywords for `:error` values to prevent collisions across domains:

```clojure
;; CORRECT: Namespaced error keywords
{:error :zakat/invalid-wealth}
{:error :murabaha/invalid-profit-margin}
{:error :validation/missing-required-field}

;; WRONG: Unnamespaced error keywords
{:error :invalid-wealth}    ;; Which domain? Could collide
{:error :error}             ;; Useless
```

### 5. Automation Over Manual

Error handling is validated automatically via clj-kondo (unused catch bindings, empty catch blocks).

## ex-info — Structured Exceptions

**MUST** use `ex-info` for all application-level exceptions in OSE Platform.

### Creating ex-info

```clojure
;; CORRECT: Full ex-info with structured data
(defn validate-murabaha-contract
  "Validates Murabaha contract fields. Throws ex-info on invalid input."
  [{:murabaha/keys [cost-price profit-margin installment-count] :as contract}]
  (cond
    (not (pos? cost-price))
    (throw (ex-info "Murabaha contract cost price must be positive"
                    {:error :murabaha/invalid-cost-price
                     :value cost-price
                     :contract-id (:murabaha/contract-id contract)}))

    (not (pos? profit-margin))
    (throw (ex-info "Murabaha contract profit margin must be positive"
                    {:error :murabaha/invalid-profit-margin
                     :value profit-margin
                     :contract-id (:murabaha/contract-id contract)}))

    (not (pos? installment-count))
    (throw (ex-info "Murabaha installment count must be a positive integer"
                    {:error :murabaha/invalid-installment-count
                     :value installment-count
                     :contract-id (:murabaha/contract-id contract)}))))
```

### Catching ex-info and Extracting Data

```clojure
;; CORRECT: Catch ex-info, extract structured data with ex-data
(defn process-murabaha-contract! [db raw-contract]
  (try
    (validate-murabaha-contract raw-contract)
    (repo/save-contract! db raw-contract)
    (catch clojure.lang.ExceptionInfo e
      (let [{:keys [error contract-id]} (ex-data e)]
        (log/error "Contract validation failed"
                   {:error error
                    :contract-id contract-id
                    :message (ex-message e)})
        ;; Re-throw with additional context
        (throw (ex-info "Failed to process Murabaha contract"
                        {:error :murabaha/processing-failed
                         :cause error
                         :contract-id contract-id}
                        e))))  ;; Pass original as cause
    (catch Exception e
      (throw (ex-info "Unexpected database error"
                      {:error :infrastructure/database-error
                       :operation :save-contract}
                      e)))))
```

**MUST** pass the original exception as the third argument to `ex-info` when re-throwing to preserve the full cause chain.

## try/catch/finally

**MUST** use try/catch for operations that can fail with Java exceptions (I/O, database, HTTP):

```clojure
;; CORRECT: try/catch with resource cleanup in finally
(defn read-zakat-config
  "Reads zakat configuration from file. Returns config map or throws ex-info."
  [config-path]
  (let [reader (atom nil)]
    (try
      (reset! reader (clojure.java.io/reader config-path))
      (clojure.edn/read (java.io.PushbackReader. @reader))
      (catch java.io.FileNotFoundException e
        (throw (ex-info "Zakat config file not found"
                        {:error :config/file-not-found
                         :path config-path}
                        e)))
      (catch Exception e
        (throw (ex-info "Failed to read zakat config"
                        {:error :config/read-failed
                         :path config-path}
                        e)))
      (finally
        (when @reader
          (.close @reader))))))

;; PREFERRED: Use with-open for auto-closing resources
(defn read-zakat-config-preferred
  "Reads zakat configuration from file using with-open for safe resource management."
  [config-path]
  (try
    (with-open [reader (clojure.java.io/reader config-path)]
      (clojure.edn/read (java.io.PushbackReader. reader)))
    (catch java.io.FileNotFoundException e
      (throw (ex-info "Zakat config file not found"
                      {:error :config/file-not-found
                       :path config-path}
                      e)))))
```

### Catching Specific Exception Types

**MUST** catch the most specific exception type available:

```clojure
;; CORRECT: Specific exception types
(try
  (jdbc/execute! db sql-params)
  (catch org.postgresql.util.PSQLException e
    (if (= "23505" (.getSQLState e)) ;; Unique constraint violation
      (throw (ex-info "Duplicate contract ID"
                      {:error :murabaha/duplicate-contract}
                      e))
      (throw (ex-info "Database error"
                      {:error :infrastructure/db-error}
                      e))))
  (catch java.sql.SQLException e
    (throw (ex-info "SQL error"
                    {:error :infrastructure/sql-error}
                    e))))

;; WRONG: Catching all exceptions too broadly
(try
  (jdbc/execute! db sql-params)
  (catch Exception e ;; Too broad — hides programming errors
    (log/error e "Something went wrong")))
```

## Result-Like Pattern

**SHOULD** use Result-like maps for domain functions where failure is expected and normal (not exceptional):

```clojure
;; CORRECT: Result map pattern for expected failures
(defn calculate-zakat-eligible
  "Returns {:ok amount} or {:error reason} — never throws."
  [wealth nisab]
  (cond
    (not (decimal? wealth)) {:error :invalid-wealth :value wealth}
    (not (pos? nisab))      {:error :invalid-nisab :value nisab}
    (< wealth nisab)        {:ok 0M}
    :else                   {:ok (* wealth 0.025M)}))

;; CORRECT: Caller handles both cases
(let [result (calculate-zakat-eligible wealth nisab)]
  (if (:ok result)
    (process-payment! db (:ok result))
    (log/warn "Zakat calculation not eligible" {:reason (:error result)})))

;; WRONG: Throwing exceptions for expected domain outcomes
(defn bad-calculate-zakat [wealth nisab]
  (when (< wealth nisab)
    (throw (ex-info "Wealth below nisab" {}))) ;; This is normal, not exceptional
  (* wealth 0.025M))
```

**Use exceptions (ex-info) for**:

- Programming errors (wrong input types, contract violations)
- Infrastructure failures (database, network, file system)
- Unexpected states that indicate bugs

**Use Result maps for**:

- Expected domain outcomes (eligibility checks, validation results)
- Operations where failure is a valid business outcome

## Never Use Raw Exception Construction

**MUST NOT** construct raw Java exceptions directly:

```clojure
;; WRONG: Raw Java exception — no structured data
(throw (Exception. "Zakat calculation failed"))
(throw (RuntimeException. "Invalid nisab"))
(throw (IllegalArgumentException. "Wealth must be positive"))

;; CORRECT: Always use ex-info with data map
(throw (ex-info "Zakat calculation failed"
                {:error :zakat/calculation-error
                 :wealth wealth
                 :nisab nisab}))
```

**Exception**: When wrapping an existing Java exception to add context, `ex-info` with the original as the cause is correct:

```clojure
;; CORRECT: Wrapping Java exception with ex-info and cause chain
(catch java.io.IOException e
  (throw (ex-info "Failed to read transaction file"
                  {:error :io/read-failed :path file-path}
                  e)))  ;; Original IOException preserved as cause
```

## Enforcement

- **clj-kondo** - Detects empty catch blocks and unused exception bindings
- **Eastwood** - Detects broad catch patterns and suspicious exception handling
- **Code reviews** - Verify ex-info used (not raw exceptions), structured data present, cause chains preserved

## Related Standards

- [Coding Standards](./coding-standards.md) - Side-effecting functions with `!` that may throw
- [API Standards](./api-standards.md) - Converting ex-info to HTTP error responses
- [Security Standards](./security-standards.md) - Not leaking sensitive data in error messages

## Related Documentation

**Software Engineering Principles**:

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**Clojure Version**: 1.10+ (baseline), 1.12 (recommended)
