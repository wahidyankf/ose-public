---
title: "Clojure API Standards"
description: Authoritative OSE Platform Clojure API standards (Ring handlers, Reitit routing, middleware, REST conventions)
category: explanation
subcategory: prog-lang
tags:
  - clojure
  - api-standards
  - ring
  - reitit
  - compojure
  - rest
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Clojure API Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Clojure fundamentals from [AyoKoding Clojure Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/clojure/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Clojure tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines authoritative API standards for Clojure web service development in OSE Platform using Ring, Reitit, and related libraries.

**Target Audience**: OSE Platform Clojure developers building REST APIs and web services

**Scope**: Ring request/response maps, Reitit data-driven routing, Compojure macro routing, middleware composition, content negotiation with muuntaja, HTTP response helpers, JSON serialization with Cheshire, REST conventions

## Software Engineering Principles

### 1. Pure Functions Over Side Effects

**MUST** implement Ring handlers as pure functions: they receive a request map and return a response map — no global state, no hidden I/O:

```clojure
;; CORRECT: Pure Ring handler function
(defn get-zakat-calculation
  "Pure Ring handler — takes request map, returns response map."
  [{:keys [params]}]
  (let [wealth (bigdec (:wealth params))
        result (domain/calculate-zakat wealth nisab/current)]
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body (json/generate-string {:zakat_amount result})}))
```

### 2. Explicit Over Implicit

**MUST** use Reitit's data-driven routing — routes are plain Clojure vectors (data), not DSL macros:

```clojure
;; CORRECT: Reitit data-driven routes (explicit, inspectable)
["/api/zakat"
 ["" {:get  get-all-zakat-summary
      :post create-zakat-payment!}]
 ["/:id" {:get    get-zakat-payment
          :delete delete-zakat-payment!}]]
```

### 3. Immutability Over Mutability

Ring request and response maps are immutable. Middleware wraps handlers by returning new maps — never mutates the request in-place.

### 4. Automation Over Manual

**MUST** use muuntaja for automated content negotiation — not manual `Content-Type` header parsing.

### 5. Reproducibility First

**MUST** pin exact versions of Ring, Reitit, and muuntaja in `deps.edn`.

## Ring — HTTP Abstraction

**MUST** build all HTTP services on Ring's request/response map abstraction.

### Request Map Structure

```clojure
;; CORRECT: Ring request map (provided by Ring server adapters)
{:server-port    8080
 :server-name    "localhost"
 :remote-addr    "127.0.0.1"
 :uri            "/api/zakat/calculate"
 :query-string   "currency=SAR"
 :scheme         :http
 :request-method :post
 :headers        {"content-type" "application/json"
                  "authorization" "Bearer eyJ..."}
 :body           #object[java.io.InputStream]
 ;; Injected by middleware
 :params         {:wealth "100000" :currency "SAR"} ;; wrap-params
 :body-params    {:customer_id "cust-123"}          ;; wrap-json-body or muuntaja
 :session        {:user-id "user-456"}}             ;; wrap-session
```

### Response Map Structure

```clojure
;; CORRECT: Ring response maps returned by handlers
{:status  200
 :headers {"Content-Type" "application/json; charset=utf-8"}
 :body    "{\"zakat_amount\": 2500}"}

;; CORRECT: Using ring.util.response helpers
(require '[ring.util.response :as response])

(response/response {:zakat_amount 2500M})          ;; 200 OK
(response/created "/api/zakat/tx-001" {:id "tx-001"}) ;; 201 Created
(response/not-found {:error "Transaction not found"})  ;; 404 Not Found
(response/bad-request {:error "Invalid wealth amount"}) ;; 400 Bad Request
(-> (response/response {:message "Updated"})
    (response/status 204))                         ;; 204 No Content
```

## Reitit — Data-Driven Routing (Preferred)

**MUST** use Reitit for new projects. Routes are plain data — inspectable, composable, and validated.

```clojure
(ns ose.api.routes
  (:require [reitit.ring :as ring]
            [reitit.coercion.spec :as rcs]
            [reitit.ring.coercion :as rrc]
            [reitit.ring.middleware.muuntaja :as muuntaja]
            [reitit.ring.middleware.parameters :refer [parameters-middleware]]
            [muuntaja.core :as m]
            [ose.api.handlers.zakat :as zakat-handler]
            [ose.api.handlers.murabaha :as murabaha-handler]))

;; CORRECT: Data-driven Reitit route structure
(def routes
  ["/api"
   ["/zakat"
    ["" {:name    ::zakat-list
         :summary "Zakat payment collection"
         :get     {:handler    zakat-handler/list-payments
                   :parameters {:query {:currency string?}}}
         :post    {:handler    zakat-handler/create-payment!
                   :parameters {:body {:customer-id string?
                                       :wealth      decimal?
                                       :currency    keyword?}}}}]
    ["/:id" {:name    ::zakat-item
             :summary "Individual zakat payment"
             :get     {:handler    zakat-handler/get-payment
                       :parameters {:path {:id string?}}}
             :delete  {:handler    zakat-handler/delete-payment!
                       :parameters {:path {:id string?}}}}]]
   ["/murabaha"
    ["" {:post {:handler    murabaha-handler/create-contract!
                :parameters {:body {:customer-id string?
                                    :cost-price  decimal?
                                    :profit-margin decimal?}}}}]]])

;; CORRECT: Ring router with middleware
(def app
  (ring/ring-handler
   (ring/router
    routes
    {:data {:muuntaja   m/instance
            :coercion   rcs/coercion
            :middleware [muuntaja/format-middleware  ;; Content negotiation
                         rrc/coerce-exceptions-middleware
                         rrc/coerce-request-middleware
                         rrc/coerce-response-middleware
                         parameters-middleware]}})
   (ring/create-default-handler
    {:not-found          (constantly {:status 404 :body {:error "Not found"}})
     :method-not-allowed (constantly {:status 405 :body {:error "Method not allowed"}})
     :not-acceptable     (constantly {:status 406 :body {:error "Not acceptable"}})})))
```

## Compojure — Macro-Based Routing (Legacy)

**MAY** use Compojure for legacy projects or simpler routing needs.

```clojure
(ns ose.api.compojure-routes
  (:require [compojure.core :refer [defroutes GET POST DELETE routes]]
            [compojure.route :as route]
            [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
            [ring.util.response :as response]))

;; CORRECT: Compojure defroutes
(defroutes zakat-routes
  (GET  "/api/zakat"     req (zakat-handler/list-payments req))
  (POST "/api/zakat"     req (zakat-handler/create-payment! req))
  (GET  "/api/zakat/:id" [id :as req] (zakat-handler/get-payment id req))
  (DELETE "/api/zakat/:id" [id :as req] (zakat-handler/delete-payment! id req)))

(defroutes murabaha-routes
  (POST "/api/murabaha" req (murabaha-handler/create-contract! req)))

(def app-routes
  (routes zakat-routes murabaha-routes (route/not-found {:error "Not found"})))
```

## Middleware Composition

**MUST** compose middleware using threading macro `->`:

```clojure
(ns ose.api.app
  (:require [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
            [ring.middleware.params :refer [wrap-params]]
            [ring.middleware.keyword-params :refer [wrap-keyword-params]]
            [ring.middleware.anti-forgery :refer [wrap-anti-forgery]]
            [ring.middleware.session :refer [wrap-session]]
            [ose.api.middleware.auth :refer [wrap-jwt-auth]]
            [ose.api.middleware.logging :refer [wrap-request-logging]]
            [ose.api.middleware.errors :refer [wrap-error-handling]]))

;; CORRECT: Middleware stack using ->
;; Note: middleware wraps from outside in — listed outer to inner
(defn wrap-app [handler]
  (-> handler
      wrap-request-logging    ;; Outermost: log all requests
      wrap-error-handling     ;; Convert ex-info to HTTP errors
      wrap-jwt-auth           ;; Authentication
      (wrap-json-body {:keywords? true}) ;; Parse JSON body
      wrap-keyword-params     ;; Keywordize params
      wrap-params             ;; Parse query/form params
      wrap-session))          ;; Session management

;; CORRECT: Custom error-handling middleware
(defn wrap-error-handling [handler]
  (fn [request]
    (try
      (handler request)
      (catch clojure.lang.ExceptionInfo e
        (let [{:keys [error]} (ex-data e)]
          (case error
            :validation/invalid-request {:status 400 :body {:error (ex-message e)}}
            :auth/unauthorized          {:status 401 :body {:error "Unauthorized"}}
            :domain/not-found           {:status 404 :body {:error "Not found"}}
            {:status 500 :body {:error "Internal server error"}})))
      (catch Exception e
        (log/error e "Unhandled exception")
        {:status 500 :body {:error "Internal server error"}}))))
```

## Content Negotiation with muuntaja

**SHOULD** use muuntaja for automatic content negotiation (JSON, EDN, Transit):

```clojure
;; CORRECT: muuntaja configured for JSON and EDN
(require '[muuntaja.core :as m])

(def muuntaja-instance
  (m/create
   (-> m/default-options
       (assoc-in [:formats "application/json" :encoder-opts]
                 {:date-format "yyyy-MM-dd'T'HH:mm:ss.SSSZ"})
       (assoc-in [:formats "application/edn"] m/default-options))))

;; With muuntaja middleware in Reitit, handlers receive parsed :body-params
(defn create-zakat-payment!
  [{:keys [body-params]}] ;; body-params auto-parsed by muuntaja
  (let [{:keys [customer-id wealth currency]} body-params]
    ...))
```

## JSON Serialization with Cheshire

**SHOULD** use Cheshire for JSON when muuntaja is not used:

```clojure
(require '[cheshire.core :as json])

;; CORRECT: Serialize to JSON
(defn json-response [status body]
  {:status  status
   :headers {"Content-Type" "application/json; charset=utf-8"}
   :body    (json/generate-string body {:date-format "yyyy-MM-dd'T'HH:mm:ssZ"})})

;; CORRECT: Parse JSON with keyword keys
(defn parse-request-body [body]
  (json/parse-string (slurp body) true)) ;; true = keyword keys

;; CORRECT: Serialize BigDecimal as string (not float — precision matters for finance)
(json/generate-string
 {:zakat-amount 2500M}
 {:bigdec-as-string true}) ;; "2500" not 2500.0
```

## HTTP Response Conventions

**MUST** follow these HTTP status code conventions:

```clojure
;; CORRECT: Status code conventions for OSE Platform APIs
(require '[ring.util.response :as response])

;; 200 OK — successful GET, PUT, PATCH
(response/response {:zakat-amount 2500M})

;; 201 Created — successful POST that creates a resource
(-> (response/created (str "/api/zakat/" tx-id) {:transaction-id tx-id})
    (response/content-type "application/json"))

;; 204 No Content — successful DELETE or action with no response body
(-> (response/response nil)
    (response/status 204))

;; 400 Bad Request — validation failures
{:status 400
 :body   {:error "Invalid wealth amount"
          :field :wealth
          :value -100}}

;; 401 Unauthorized — missing or invalid authentication
{:status 401
 :body   {:error "Authentication required"}}

;; 403 Forbidden — authenticated but not authorized
{:status 403
 :body   {:error "Insufficient permissions for this Murabaha contract"}}

;; 404 Not Found
{:status 404
 :body   {:error "Zakat transaction not found"
          :transaction-id "tx-999"}}

;; 409 Conflict — duplicate resource or state conflict
{:status 409
 :body   {:error "Zakat transaction already processed"}}

;; 422 Unprocessable Entity — semantically invalid request
{:status 422
 :body   {:error "Wealth below nisab threshold — no zakat due"}}

;; 500 Internal Server Error — unexpected failures
{:status 500
 :body   {:error "Internal server error"}}
```

## REST Conventions

**MUST** follow REST conventions for OSE Platform APIs:

- **Nouns in URLs, not verbs**: `/api/zakat` not `/api/calculate-zakat`
- **Plural resource names**: `/api/zakat-payments` not `/api/zakat-payment`
- **Kebab-case URL paths**: `/api/murabaha-contracts` not `/api/MurabahaContracts`
- **Kebab-case JSON response keys**: `{"zakat-amount": 2500}` — consistent with Clojure naming
- **Idempotent PUT**: Full resource replacement
- **Idempotent PATCH**: Partial resource update
- **Idempotent DELETE**: Safe to call multiple times

## Enforcement

- **Reitit coercion** - Validates request parameters automatically at route level
- **muuntaja** - Validates content-type and accepts headers automatically
- **Code reviews** - Verify HTTP status codes, response body structure, middleware order
- **clj-kondo** - Detects arity errors in handler function signatures

## Related Standards

- [Security Standards](./security-standards.md) - CSRF middleware placement, JWT authentication
- [Error Handling Standards](./error-handling-standards.md) - Converting ex-info to HTTP responses
- [Testing Standards](./testing-standards.md) - Testing Ring handlers without HTTP

## Related Documentation

**Software Engineering Principles**:

- [Pure Functions Over Side Effects](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

---

**Maintainers**: Platform Documentation Team

**Clojure Version**: 1.10+ (baseline), 1.12 (recommended)
