---
title: "Clojure Security Standards"
description: Authoritative OSE Platform Clojure security standards (input validation, encryption, parameterized queries)
category: explanation
subcategory: prog-lang
tags:
  - clojure
  - security
  - input-validation
  - encryption
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Clojure Security Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Clojure fundamentals from [AyoKoding Clojure Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/clojure/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Clojure tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines mandatory security standards for Clojure development in OSE Platform. Financial systems handling Sharia-compliant transactions require rigorous input validation, parameterized queries, and proper secret management.

**Target Audience**: OSE Platform Clojure developers building user-facing services and financial APIs

**Scope**: Input validation with clojure.spec, eval prohibition, parameterized queries with next.jdbc, Ring CSRF protection, buddy authentication/encryption, secret management, sensitive data logging prevention

## Software Engineering Principles

### 1. Explicit Over Implicit

**MUST** declare all input validation rules explicitly as `s/def` specs before processing any user input.

### 2. Automation Over Manual

**MUST** run security-oriented linting (`clj-kondo`, `Eastwood`) automatically in CI/CD — manual security reviews alone are insufficient.

### 3. Immutability Over Mutability

Immutable data structures prevent TOCTOU (time-of-check/time-of-use) vulnerabilities — validated data cannot be mutated between validation and use.

### 4. Pure Functions Over Side Effects

Pure validation functions (using `s/valid?`) are independently testable and cannot have hidden security side effects.

### 5. Reproducibility First

**MUST** pin exact versions of all security-relevant dependencies (`buddy-auth`, `buddy-hashers`) — avoid LATEST ranges.

## Input Validation with clojure.spec

**MUST** validate all user inputs at system boundaries using `clojure.spec.alpha` before processing.

### Defining Domain Specs

```clojure
(ns ose.zakat.specs
  (:require [clojure.spec.alpha :as s]))

;; CORRECT: Explicit specs for all domain input fields
(s/def :zakat/customer-id
  (s/and string?
         #(re-matches #"[a-zA-Z0-9\-]{8,36}" %)))

(s/def :zakat/wealth
  (s/and decimal?
         #(>= % 0M)
         #(<= % 1000000000M))) ;; Reasonable maximum for sanity check

(s/def :zakat/currency
  #{:SAR :USD :MYR :IDR}) ;; Enumerated allowed values only

(s/def :zakat/payment-request
  (s/keys :req [:zakat/customer-id
                :zakat/wealth
                :zakat/currency]))

;; CORRECT: Validation at API boundary
(defn validate-payment-request!
  "Validates incoming zakat payment request. Throws ex-info on invalid input."
  [request]
  (when-not (s/valid? :zakat/payment-request request)
    (throw (ex-info "Invalid zakat payment request"
                    {:error :validation/invalid-request
                     :spec-errors (s/explain-data :zakat/payment-request request)}))))

;; WRONG: No input validation before processing
(defn bad-process-payment! [db request]
  (jdbc/execute! db ["INSERT INTO zakat_transactions ..." (:wealth request)])) ;; Unvalidated!
```

### Validating External Configuration

```clojure
;; CORRECT: Validate configuration at startup
(s/def :config/db-host string?)
(s/def :config/db-port (s/int-in 1024 65536))
(s/def :config/db-name string?)

(s/def :config/database
  (s/keys :req [:config/db-host :config/db-port :config/db-name]))

(defn validate-config! [config]
  (when-not (s/valid? :config/database config)
    (throw (ex-info "Invalid database configuration"
                    {:error :config/invalid
                     :problems (s/explain-data :config/database config)}))))
```

## Never Evaluate User Input

**MUST NEVER** use `eval` on user-supplied input:

```clojure
;; WRONG: eval on user input — remote code execution vulnerability
(defn bad-calculate [expression]
  (eval (read-string expression))) ;; CRITICAL: User controls arbitrary Clojure evaluation

;; WRONG: read-string on untrusted input (edn/read-string is safer)
(defn bad-parse [user-data]
  (read-string user-data)) ;; read-string allows tagged literals and arbitrary objects

;; CORRECT: Use edn/read-string for safe data parsing (no code execution)
(defn parse-safe-data [user-data]
  (clojure.edn/read-string {:readers {}} user-data)) ;; No custom readers

;; CORRECT: Parse only known fields via spec validation
(defn parse-payment-amount [raw-amount]
  (let [amount (bigdec raw-amount)] ;; Convert to BigDecimal — no eval
    (when-not (s/valid? :zakat/wealth amount)
      (throw (ex-info "Invalid payment amount" {:error :validation/invalid-amount})))
    amount))
```

## Parameterized Queries with next.jdbc

**MUST** use parameterized queries for all database operations — never build SQL strings with string concatenation.

```clojure
(ns ose.zakat.repository
  (:require [next.jdbc :as jdbc]
            [next.jdbc.sql :as sql]))

;; CORRECT: Parameterized query — user input in vector, never in SQL string
(defn find-transactions-by-customer
  "Finds zakat transactions for a customer. Uses parameterized query."
  [db customer-id]
  (jdbc/execute! db
                 ["SELECT * FROM zakat_transactions WHERE customer_id = ? AND status = 'paid'"
                  customer-id])) ;; ? placeholder, value passed separately

;; CORRECT: next.jdbc/sql/get-by-id for simple lookups
(defn get-transaction-by-id [db transaction-id]
  (sql/get-by-id db :zakat_transactions transaction-id :zakat/transaction-id {}))

;; CORRECT: next.jdbc/sql/insert! with map (auto-parameterized)
(defn save-transaction! [db transaction]
  (sql/insert! db :zakat_transactions
               {:customer_id (:zakat/customer-id transaction)
                :amount (:zakat/amount transaction)
                :status "pending"}))

;; WRONG: String concatenation — SQL injection vulnerability
(defn bad-find-transactions [db customer-id]
  (jdbc/execute! db
                 [(str "SELECT * FROM zakat_transactions WHERE customer_id = '"
                       customer-id "'")])) ;; SQL injection: customer-id = "'; DROP TABLE--"
```

## ring.middleware.anti-forgery — CSRF Protection

**MUST** enable CSRF protection for all state-changing web endpoints:

```clojure
(ns ose.api.middleware
  (:require [ring.middleware.anti-forgery :refer [wrap-anti-forgery]]
            [ring.middleware.params :refer [wrap-params]]
            [ring.middleware.session :refer [wrap-session]]))

;; CORRECT: CSRF middleware applied to all routes
(defn wrap-app [handler]
  (-> handler
      wrap-anti-forgery          ;; CSRF token validation (MUST be before session)
      wrap-session               ;; Session management
      wrap-params))              ;; Parameter parsing

;; CORRECT: For API-only endpoints using JWT, use header-based CSRF
;; (JWT in Authorization header is CSRF-safe — browsers don't auto-send custom headers)
(defn wrap-api-security [handler]
  (-> handler
      (wrap-authentication backend) ;; buddy-auth JWT validation
      wrap-params))
```

## buddy — Authentication and Encryption

**MUST** use the `buddy` library for authentication, JWT, and password hashing.

### Password Hashing with buddy-hashers

```clojure
(ns ose.auth.passwords
  (:require [buddy.hashers :as hashers]))

;; CORRECT: Hash password with bcrypt (buddy default — cost factor adjustable)
(defn hash-password
  "Hashes a plain-text password using bcrypt. Returns hashed string for storage."
  [plain-password]
  (hashers/derive plain-password {:alg :bcrypt+sha512}))

;; CORRECT: Verify password against stored hash
(defn verify-password
  "Verifies a plain-text password against a stored bcrypt hash."
  [plain-password stored-hash]
  (:valid (hashers/verify plain-password stored-hash)))

;; WRONG: Plain text password storage
(defn bad-save-user! [db username password]
  (sql/insert! db :users {:username username :password password})) ;; Never store plain text

;; WRONG: MD5 or SHA1 for passwords
(defn bad-hash-password [password]
  (let [digest (java.security.MessageDigest/getInstance "MD5")]
    (.digest digest (.getBytes password)))) ;; MD5 is broken for passwords
```

### JWT with buddy-auth

```clojure
(ns ose.auth.tokens
  (:require [buddy.sign.jwt :as jwt]
            [buddy.core.keys :as keys]))

(def ^:private secret-key
  "JWT signing key loaded from environment variable — never hardcoded."
  (delay (System/getenv "JWT_SECRET_KEY")))

;; CORRECT: Sign JWT token with HS256
(defn create-auth-token
  "Creates a signed JWT token for an authenticated user."
  [user-id roles]
  (jwt/sign {:sub user-id
             :roles roles
             :iat (java.time.Instant/now)
             :exp (java.time.Instant/ofEpochSecond
                   (+ (quot (System/currentTimeMillis) 1000) 3600))} ;; 1 hour TTL
            @secret-key
            {:alg :hs256}))

;; CORRECT: Verify and decode JWT token
(defn verify-auth-token
  "Verifies JWT token signature and returns claims map, or nil if invalid."
  [token]
  (try
    (jwt/unsign token @secret-key {:alg :hs256})
    (catch Exception _
      nil)))

;; WRONG: Hardcoded secrets
(def bad-secret "my-secret-key") ;; Never hardcode secrets in source code
```

## Never Log Sensitive Data

**MUST NOT** log passwords, tokens, account numbers, or PII:

```clojure
;; WRONG: Logging sensitive fields
(defn bad-process-payment! [db request]
  (log/info "Processing payment" {:request request}) ;; request may contain sensitive data
  ...)

;; CORRECT: Log only safe identifiers, never sensitive values
(defn process-payment! [db request]
  (log/info "Processing payment"
            {:customer-id (:zakat/customer-id request)
             :currency (:zakat/currency request)})
  ;; Wealth amount logged only at DEBUG level, never in production
  (log/debug "Payment details" {:amount (:zakat/wealth request)})
  ...)

;; CORRECT: Mask sensitive fields before logging
(defn mask-sensitive [request]
  (-> request
      (dissoc :password :token :account-number)
      (update :zakat/wealth #(when % "***"))))
```

## Secrets via Environment Variables

**MUST** load all secrets from environment variables — never commit secrets to source code:

```clojure
;; CORRECT: Secrets from environment variables
(def db-config
  {:db-host (or (System/getenv "DB_HOST") "localhost")
   :db-port (Integer/parseInt (or (System/getenv "DB_PORT") "5432"))
   :db-user (System/getenv "DB_USER")         ;; No default — must be set
   :db-password (System/getenv "DB_PASSWORD")}) ;; No default — must be set

;; CORRECT: Fail fast if required secrets are missing
(defn validate-secrets! []
  (when-not (System/getenv "JWT_SECRET_KEY")
    (throw (ex-info "JWT_SECRET_KEY environment variable not set"
                    {:error :config/missing-secret}))))

;; WRONG: Hardcoded secrets
(def bad-config {:db-password "admin123"}) ;; Never hardcode secrets
```

## Enforcement

- **clj-kondo** - Detects `eval` calls (configurable as error-level)
- **Code reviews** - Reviewers verify parameterized queries, no hardcoded secrets, sensitive fields not logged
- **CI/CD** - Secrets scanner (e.g., truffleHog, GitGuardian) on all commits

## Related Standards

- [API Standards](./api-standards.md) - CSRF middleware placement in Ring stack
- [Error Handling Standards](./error-handling-standards.md) - Not leaking sensitive data in ex-info messages
- [Build Configuration](./build-configuration.md) - Environment variable management in deps.edn

## Related Documentation

**Software Engineering Principles**:

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)

---

**Maintainers**: Platform Documentation Team

**Clojure Version**: 1.10+ (baseline), 1.12 (recommended)
