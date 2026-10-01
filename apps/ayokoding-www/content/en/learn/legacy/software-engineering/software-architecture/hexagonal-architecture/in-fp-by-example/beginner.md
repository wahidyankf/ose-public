---
title: "Beginner"
date: 2026-05-15T00:00:00+07:00
draft: false
weight: 10000003
description: "Examples 1-25: The three zones, ports as function types, adapters as function modules, the dependency rule, and the full flow from HTTP to domain to repository — using procurement-platform-be as the running domain in F# (canonical), Clojure, TypeScript, and Haskell"
tags:
  [
    "hexagonal-architecture",
    "ports-and-adapters",
    "f#",
    "clojure",
    "typescript",
    "haskell",
    "functional-programming",
    "domain-isolation",
    "by-example",
    "beginner",
  ]
---

This beginner-level section introduces Hexagonal Architecture (Ports and Adapters) through 25 progressive examples grounded in functional programming. The central thesis — that the **domain must be isolated from all infrastructure concerns** via a clean dependency rule — applies identically across functional languages. Examples are shown in F# (canonical for this track), with Clojure, TypeScript, and Haskell variants. All examples use the `purchasing` bounded context of `procurement-platform-be`: employees draft `PurchaseOrder` records, submit them for approval, and receive confirmations when orders are issued to suppliers.

## The Three Zones (Examples 1–7)

### Example 1: The Hexagon Metaphor — Three Zones as Namespaces / Modules

Hexagonal Architecture divides a system into three zones. The **Domain** zone holds pure business logic with no external dependencies. The **Application** zone orchestrates domain functions and defines ports. The **Adapters** zone wires the outside world (HTTP, database, CLI) to those ports. Module namespaces and file-level declarations are the natural mechanism for enforcing these zone boundaries across functional languages.

```mermaid
graph TD
    accTitle: Example 1: The Hexagon Metaphor — Three Zones as Namespaces / Modules
    accDescr: Graph with 5 nodes and 4 connections. Nodes: HttpAdapter open Microsoft.AspNetCore, PostgresAdapter open Npgsql, PurchaseOrderService open Domain only, Ports (function type aliases), Domain.fs no external imports. Connections: HttpAdapter open Microsoft.AspNetCore to Ports (function type aliases), PostgresAdapter open Npgsql to Ports (function type aliases), Ports (function type aliases) to PurchaseOrderService open Domain only, PurchaseOrderService open Domain only to Domain.fs no external imports.
    subgraph Adapters["Adapters Zone<br/>(outer)"]
        HTTP["HttpAdapter<br/>open<br/>Microsoft.AspNetCore"]
        DB["PostgresAdapter<br/>open Npgsql"]
    end
    subgraph Application["Application Zone<br/>(middle)"]
        SVC["PurchaseOrderService<br/>open Domain only"]
        PORT["Ports (function type<br/>aliases)"]
    end
    subgraph Domain["Domain Zone (inner)"]
        DOM["Domain.fs<br/>no external imports"]
    end

    HTTP --> PORT
    DB --> PORT
    PORT --> SVC
    SVC --> DOM

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Domain pal-0173B2
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Application pal-029E73
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class Adapters pal-DE8F05
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── file: Domain.fs ──────────────────────────────────────────────────────
// The Domain zone has ZERO imports from any external library.
// No Npgsql, no ASP.NET, no JSON serialiser — only F# standard library.
// This is the innermost zone: pure business logic, always testable in isolation.

module ProcurementPlatform.Domain

// All types here reference only F# primitives and other domain types.
type PurchaseOrderId = string
// => Simple alias — zero runtime cost, maximum documentation value

type SupplierId = string
// => Distinct from PurchaseOrderId — documents the domain vocabulary

type PurchaseOrder = {
    // => The aggregate root of the purchasing context
    Id: PurchaseOrderId
    // => Unique identifier in format po_<uuid>
    SupplierId: SupplierId
    // => Identifies the supplier this PO is addressed to
    TotalAmount: decimal
    // => Sum of all line item values; drives approval-level routing
    Status: string
    // => Current state in the PO lifecycle: Draft, AwaitingApproval, Approved, etc.
}

// ── file: Application.fs ─────────────────────────────────────────────────
// Application zone imports only the Domain module — no infrastructure.

module ProcurementPlatform.Application
// open ProcurementPlatform.Domain   ← only this open statement is permitted here

// ── file: Adapters/PostgresAdapter.fs ────────────────────────────────────
// Adapters zone imports Application zone plus infrastructure libraries.

module ProcurementPlatform.Adapters.PostgresAdapter
// open ProcurementPlatform.Application   ← permitted: adapters depend on application
// open Npgsql                            ← permitted: adapters can open infra libraries

// ── ANTI-PATTERN: what NOT to do ─────────────────────────────────────────
// open Npgsql  ← inside Domain.fs — THIS IS WRONG
// Domain importing an infrastructure library violates the dependency rule.
// The domain would become untestable without a real database.
// => If you see an infrastructure import inside Domain.fs, it is a zone violation.

printfn "Three zones defined — dependency rule enforced by module namespaces"
// => Output: Three zones defined — dependency rule enforced by module namespaces
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── file: domain/purchase_order.clj ──────────────────────────────────────
;; The Domain zone contains ZERO requires from any infrastructure namespace.
;; No jdbc, no http-kit, no ring — only clojure.core and other domain namespaces.
;; [F#: module ProcurementPlatform.Domain — Clojure uses ns declarations to delimit zones]

(ns procurement-platform.domain.purchase-order)
;; => The ns declaration is the zone marker: no :require of infra namespaces here
;; => Clojure enforces zone separation via ns isolation, not compilation order

;; Domain entities are plain maps — no defrecord required for value semantics.
;; [F#: type alias PurchaseOrderId = string — Clojure uses qualified keywords instead]
;; ::purchase-order/id, ::purchase-order/supplier-id, ::purchase-order/total-amount
;; => Namespaced keywords encode the domain vocabulary without wrapper types

(defn make-purchase-order
  ;; Constructor function — produces a validated map representing the aggregate root
  [id supplier-id total-amount status]
  ;; => All fields are positional; the map is the aggregate; no class hierarchy
  {:procurement-platform.domain.purchase-order/id           id
   ;; => Namespaced key distinguishes PO id from other string ids in merged maps
   :procurement-platform.domain.purchase-order/supplier-id  supplier-id
   ;; => Identifies the supplier this PO is addressed to
   :procurement-platform.domain.purchase-order/total-amount total-amount
   ;; => Sum of all line item values; drives approval-level routing
   :procurement-platform.domain.purchase-order/status       status})
   ;; => Current state: :draft, :awaiting-approval, :approved, etc.

;; ── file: application/ports.clj ──────────────────────────────────────────
;; Application zone requires only domain namespaces — no infrastructure.
(ns procurement-platform.application.ports
  (:require [procurement-platform.domain.purchase-order]))
;; => :require of domain ns is permitted; :require of jdbc is NOT

;; ── file: adapters/postgres_adapter.clj ──────────────────────────────────
;; Adapters zone requires application and infrastructure namespaces.
(ns procurement-platform.adapters.postgres-adapter
  (:require [procurement-platform.application.ports]
            ;; => permitted: adapter depends on application zone
            [next.jdbc]))
            ;; => permitted: adapters may require infrastructure libraries

;; ── ANTI-PATTERN: what NOT to do ─────────────────────────────────────────
;; (ns procurement-platform.domain.purchase-order
;;   (:require [next.jdbc]))  ← WRONG: domain requiring infrastructure
;; => Effect: domain becomes untestable without a real Postgres connection
;; => Any :require of jdbc, http-kit, or ring inside a domain ns is a zone violation

(println "Three zones defined — dependency rule enforced by ns declarations")
;; => Output: Three zones defined — dependency rule enforced by ns declarations
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── file: domain.ts ──────────────────────────────────────────────────────
// The Domain zone has ZERO imports from any infrastructure library.
// No pg, no express, no axios — only TypeScript built-ins and domain types.
// This is the innermost zone: pure business logic, always testable in isolation.

// Branded types enforce identity discipline at compile time.
type PurchaseOrderId = string & { readonly _brand: "PurchaseOrderId" };
// => Branded string — prevents passing a SupplierId where a PurchaseOrderId is expected

type SupplierId = string & { readonly _brand: "SupplierId" };
// => Distinct brand from PurchaseOrderId — documents the domain vocabulary

type PurchaseOrderStatus = "Draft" | "AwaitingApproval" | "Approved" | "Issued";
// => Literal union — exhaustive status set; compiler rejects unknown strings

interface PurchaseOrder {
  // => The aggregate root of the purchasing context
  readonly id: PurchaseOrderId;
  // => Unique identifier in format po_<uuid>
  readonly supplierId: SupplierId;
  // => Identifies the supplier this PO is addressed to
  readonly totalAmount: number;
  // => Sum of all line item values; drives approval-level routing
  readonly status: PurchaseOrderStatus;
  // => Current state in the PO lifecycle
}

// ── file: application/ports.ts ────────────────────────────────────────────
// Application zone imports only domain types — no infrastructure.
// import type { PurchaseOrder } from "../domain";  ← only this import permitted

// ── file: adapters/postgresAdapter.ts ─────────────────────────────────────
// Adapters zone imports application zone plus infrastructure libraries.
// import { PurchaseOrderRepo } from "../application/ports";  ← permitted
// import { Pool } from "pg";                                 ← permitted

// ── ANTI-PATTERN: what NOT to do ─────────────────────────────────────────
// import { Pool } from "pg"  ← inside domain.ts — THIS IS WRONG
// Domain importing an infrastructure library violates the dependency rule.
// The domain would become untestable without a real database.
// => If you see an infrastructure import inside domain.ts, it is a zone violation.

console.log("Three zones defined — dependency rule enforced by module imports");
// => Output: Three zones defined — dependency rule enforced by module imports
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── file: Procurement/Domain.hs ──────────────────────────────────────────
-- The Domain zone imports ZERO infrastructure modules.
-- No postgresql-simple, no servant, no aeson — only base + Text.
-- This is the innermost zone: pure business logic, always testable in isolation.
-- [F#: module ProcurementPlatform.Domain — Haskell uses module declarations]

module Procurement.Domain where
-- => The module declaration is the zone marker: no import of infra modules here

import Data.Text (Text)
-- => Text is from the text package — part of the Haskell platform, not infrastructure

-- All types reference only Haskell prelude types and other domain types.
newtype PurchaseOrderId = PurchaseOrderId Text
-- => newtype wraps Text — zero runtime cost, prevents mixing with other IDs
-- => [F#: type alias = string — Haskell uses newtype for nominal typing]

newtype SupplierId = SupplierId Text
-- => Distinct newtype from PurchaseOrderId — compiler rejects accidental swaps

data PurchaseOrder = PurchaseOrder
  -- => The aggregate root of the purchasing context
  { poId         :: PurchaseOrderId
  -- => Unique identifier in format po_<uuid>
  , poSupplier   :: SupplierId
  -- => Identifies the supplier this PO is addressed to
  , poTotal      :: Double
  -- => Sum of all line item values; drives approval-level routing
  , poStatus     :: Text
  -- => Current state: Draft, AwaitingApproval, Approved, etc.
  } deriving (Show, Eq)

-- ── file: Procurement/Application.hs ─────────────────────────────────────
-- Application zone imports only the Domain module — no infrastructure.

-- module Procurement.Application where
-- import Procurement.Domain   -- ← only this import is permitted here

-- ── file: Procurement/Adapters/Postgres.hs ───────────────────────────────
-- Adapters zone imports Application zone plus infrastructure libraries.

-- module Procurement.Adapters.Postgres where
-- import Procurement.Application                  -- ← permitted: adapters depend on application
-- import Database.PostgreSQL.Simple               -- ← permitted: adapters can import infra libs

-- ── ANTI-PATTERN: what NOT to do ─────────────────────────────────────────
-- import Database.PostgreSQL.Simple  ← inside Procurement.Domain — THIS IS WRONG
-- Domain importing an infrastructure library violates the dependency rule.
-- The domain would become untestable without a real database.
-- => Any infra import inside Procurement.Domain.* modules is a zone violation.

main :: IO ()
main = putStrLn "Three zones defined — dependency rule enforced by module imports"
-- => Output: Three zones defined — dependency rule enforced by module imports
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: The three zones (Domain, Application, Adapters) map directly to module namespaces, and the dependency rule — inner zones never import outer zones — is a simple constraint on import or require statements. Every functional language shown here enforces this boundary through its module system: compilation order, namespace declarations, import paths, or linting rules.

**Why It Matters**: In most codebases, business logic quietly accumulates database calls, HTTP client calls, and configuration reads until nothing can be tested without spinning up real infrastructure. Hexagonal Architecture prevents this by making the zone boundary a module-level convention. When a developer attempts to import an infrastructure library inside a domain module, a code review catches it immediately because the convention is documented in the file structure itself. This single rule is responsible for the testability and evolvability of the entire system.

---

### Example 2: Domain Isolation — A Pure Domain Function with No Infrastructure Imports

A pure domain function accepts only domain types and returns a `Result`. It has no `open` statements for external libraries. It cannot call a database, make an HTTP request, or read a file. This purity is not a limitation — it is what makes the function instantly testable and independently deployable.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── CORRECT: pure domain function ────────────────────────────────────────
// Zero open statements for any library — only F# language constructs.
// This function can be tested by calling it directly with no setup.

type PurchaseOrderId = string
// => Single-field alias — distinguishes PO identity from other strings

type Money = { Amount: decimal; Currency: string }
// => Value object: amount must be >= 0, currency must be 3-letter ISO code

type DraftPurchaseOrder = {
    // => Raw input arriving from the outside world; nothing validated yet
    Id: string
    // => Raw string — may be blank, may not follow po_<uuid> format
    SupplierId: string
    // => Raw supplier identifier — not yet verified
    TotalAmount: decimal
    // => Raw amount — may be negative or zero
}

type DomainError =
    // => Named errors — not generic exceptions
    | BlankOrderId
    // => The PO ID was empty or whitespace
    | BlankSupplierId
    // => The supplier ID was empty or whitespace
    | NonPositiveAmount of decimal
    // => Total amount was zero or negative — domain rule violation

let validateDraftPO (input: DraftPurchaseOrder) : Result<DraftPurchaseOrder, DomainError> =
    // => Input: raw DTO from the outside world
    // => Output: Ok DraftPurchaseOrder if all rules pass, Error DomainError if any fail
    if System.String.IsNullOrWhiteSpace(input.Id) then
        // => Guard 1: the PO ID must be non-blank
        Error BlankOrderId
        // => Returns named error — the caller knows exactly what went wrong
    elif System.String.IsNullOrWhiteSpace(input.SupplierId) then
        // => Guard 2: the supplier ID must be non-blank
        Error BlankSupplierId
        // => Named error for blank supplier ID
    elif input.TotalAmount <= 0m then
        // => Guard 3: total amount must be positive — domain rule
        Error (NonPositiveAmount input.TotalAmount)
        // => Carries the actual invalid value for diagnostics
    else
        Ok input
        // => All guards passed — returns the validated draft PO

// Testing the pure function — no database, no HTTP, no setup
let result = validateDraftPO { Id = "po_abc-123"; SupplierId = "sup_xyz-456"; TotalAmount = 500m }
// => All three guards pass; TotalAmount 500m > 0
// => result : Result<DraftPurchaseOrder, DomainError> = Ok { Id = "po_abc-123"; ... }

match result with
| Ok po   -> printfn "Valid PO: %s" po.Id
// => po.Id = "po_abc-123" — unwrapped from Ok
| Error e -> printfn "Error: %A" e
// => Not reached — input was valid
// => Output: Valid PO: po_abc-123
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── CORRECT: pure domain function ────────────────────────────────────────
;; Zero requires from any infrastructure namespace — only clojure.core.
;; This function can be tested by calling it directly with no setup.
;; [F#: discriminated union DomainError — Clojure returns tagged error maps instead]

(ns procurement-platform.domain.purchase-order)

;; Domain errors as data — maps with a :error/kind key for dispatch
;; [F#: type DomainError = BlankOrderId | BlankSupplierId | NonPositiveAmount of decimal]
;; => Clojure's data-orientation: errors are plain maps, not closed union types
;; => The :error/kind key plays the same role as the DU tag

(defn blank-or-nil?
  ;; Predicate: true when s is nil, empty string, or whitespace-only
  [s]
  (or (nil? s) (clojure.string/blank? s)))
  ;; => Used as a guard in validate-draft-po below

(defn validate-draft-po
  ;; Pure validation function — no I/O, no side effects, no setup required.
  ;; [F#: Result<DraftPurchaseOrder, DomainError> — Clojure returns {:ok ...} or {:error ...}]
  ;; => Input: raw map from any delivery mechanism (HTTP body, CLI args, test literal)
  ;; => Output: map with :ok key on success, :error key on failure
  [{:keys [id supplier-id total-amount] :as draft}]
  (cond
    (blank-or-nil? id)
    ;; => Guard 1: the PO id must be non-blank
    {:error {:error/kind :blank-order-id}}
    ;; => Returns tagged error map — caller pattern-matches on :error/kind

    (blank-or-nil? supplier-id)
    ;; => Guard 2: the supplier id must be non-blank
    {:error {:error/kind :blank-supplier-id}}

    (<= total-amount 0)
    ;; => Guard 3: total amount must be positive — domain rule
    {:error {:error/kind :non-positive-amount :amount total-amount}}
    ;; => Carries the invalid value for diagnostics, just like F# NonPositiveAmount of decimal

    :else
    {:ok draft}))
    ;; => All guards passed — returns the original draft map wrapped in :ok

;; Testing the pure function — no database, no HTTP, no setup
(def result
  (validate-draft-po {:id "po_abc-123" :supplier-id "sup_xyz-456" :total-amount 500}))
;; => All three guards pass; :total-amount 500 > 0
;; => result = {:ok {:id "po_abc-123" :supplier-id "sup_xyz-456" :total-amount 500}}

(if (:ok result)
  (println "Valid PO:" (get-in result [:ok :id]))
  ;; => Extracts :id from the nested :ok map
  (println "Error:" (:error result)))
;; => Not reached — input was valid
;; => Output: Valid PO: po_abc-123
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── CORRECT: pure domain function ────────────────────────────────────────
// Zero imports from any library — only TypeScript language constructs.
// This function can be tested by calling it directly with no setup.

type PurchaseOrderId = string & { readonly _brand: "PurchaseOrderId" };
// => Branded string — distinguishes PO identity from other strings

// Branded money type — amount must be >= 0, currency ISO 3-letter
type Money = { readonly amount: number; readonly currency: string };
// => Value object: branded to prevent using arbitrary numbers as money

// Tagged union for domain errors — compiler-enforced exhaustive matching
type DomainError =
  | { readonly kind: "BlankOrderId" }
  // => The PO ID was empty or whitespace
  | { readonly kind: "BlankSupplierId" }
  // => The supplier ID was empty or whitespace
  | { readonly kind: "NonPositiveAmount"; readonly value: number };
// => Total amount was zero or negative — domain rule violation

interface DraftPurchaseOrder {
  // => Raw input arriving from the outside world; nothing validated yet
  readonly id: string;
  // => Raw string — may be blank, may not follow po_<uuid> format
  readonly supplierId: string;
  // => Raw supplier identifier — not yet verified
  readonly totalAmount: number;
  // => Raw amount — may be negative or zero
}

// Result<T, E> — FP-style tagged union for success or failure
type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
// => Avoids exceptions as control flow; callers must handle both cases

const ok = <T>(value: T): Result => ({ ok: true, value });
// => Constructor helper for success case
const err = <E>(error: E): Result => ({ ok: false, error });
// => Constructor helper for failure case

const validateDraftPO = (input: DraftPurchaseOrder): Result => {
  // => Input: raw DTO from the outside world
  // => Output: ok DraftPurchaseOrder if all rules pass, error DomainError if any fail
  if (!input.id || input.id.trim() === "") {
    // => Guard 1: the PO ID must be non-blank
    return err({ kind: "BlankOrderId" });
    // => Returns named error — the caller knows exactly what went wrong
  }
  if (!input.supplierId || input.supplierId.trim() === "") {
    // => Guard 2: the supplier ID must be non-blank
    return err({ kind: "BlankSupplierId" });
    // => Named error for blank supplier ID
  }
  if (input.totalAmount <= 0) {
    // => Guard 3: total amount must be positive — domain rule
    return err({ kind: "NonPositiveAmount", value: input.totalAmount });
    // => Carries the actual invalid value for diagnostics
  }
  return ok(input);
  // => All guards passed — returns the validated draft PO
};

// Testing the pure function — no database, no HTTP, no setup
const result = validateDraftPO({ id: "po_abc-123", supplierId: "sup_xyz-456", totalAmount: 500 });
// => All three guards pass; totalAmount 500 > 0
// => result: Result<DraftPurchaseOrder, DomainError> = { ok: true, value: { id: "po_abc-123", ... } }

if (result.ok) {
  console.log("Valid PO:", result.value.id);
  // => result.value.id = "po_abc-123" — unwrapped from ok
} else {
  console.log("Error:", result.error);
  // => Not reached — input was valid
}
// => Output: Valid PO: po_abc-123
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── CORRECT: pure domain function ────────────────────────────────────────
-- Zero imports from any infrastructure library — only base + Text.
-- This function can be tested by calling it directly with no setup.
-- [F#: discriminated union DomainError — Haskell uses sum types via data]

module Procurement.Domain.Validate where

import Data.Text (Text)
import qualified Data.Text as T
-- => qualified import keeps the namespace clean; T.null and T.strip below

data Money = Money { amount :: Double, currency :: Text } deriving (Show, Eq)
-- => Value object: amount must be >= 0, currency must be 3-letter ISO code

data DraftPurchaseOrder = DraftPurchaseOrder
  -- => Raw input arriving from the outside world; nothing validated yet
  { draftId      :: Text
  -- => Raw string — may be blank, may not follow po_<uuid> format
  , draftSupp    :: Text
  -- => Raw supplier identifier — not yet verified
  , draftAmount  :: Double
  -- => Raw amount — may be negative or zero
  } deriving (Show, Eq)

data DomainError
  -- => Named errors as a sum type — not exceptions, not strings
  = BlankOrderId
  -- => The PO ID was empty or whitespace
  | BlankSupplierId
  -- => The supplier ID was empty or whitespace
  | NonPositiveAmount Double
  -- => Total amount was zero or negative; carries the invalid value
  deriving (Show, Eq)

isBlank :: Text -> Bool
-- => Predicate: True for empty or whitespace-only text
isBlank t = T.null (T.strip t)
-- => T.strip drops surrounding whitespace; T.null checks for empty

validateDraftPO :: DraftPurchaseOrder -> Either DomainError DraftPurchaseOrder
-- => Input: raw DTO from the outside world
-- => Output: Right DraftPurchaseOrder if rules pass, Left DomainError otherwise
-- => Either is Haskell's idiomatic Result type — Left = error, Right = ok
validateDraftPO input
  | isBlank (draftId input)    = Left BlankOrderId
  -- => Guard 1: the PO ID must be non-blank
  | isBlank (draftSupp input)  = Left BlankSupplierId
  -- => Guard 2: the supplier ID must be non-blank
  | draftAmount input <= 0     = Left (NonPositiveAmount (draftAmount input))
  -- => Guard 3: amount must be positive; carry the invalid value
  | otherwise                  = Right input
  -- => All guards passed — returns the validated draft PO

-- Testing the pure function — no database, no HTTP, no setup
main :: IO ()
main = do
  let result = validateDraftPO (DraftPurchaseOrder "po_abc-123" "sup_xyz-456" 500)
  -- => All three guards pass; draftAmount 500 > 0
  -- => result :: Either DomainError DraftPurchaseOrder = Right (DraftPurchaseOrder "po_abc-123" ...)
  case result of
    Right po -> putStrLn ("Valid PO: " <> T.unpack (draftId po))
    -- => draftId po = "po_abc-123" — unwrapped from Right
    Left  e  -> putStrLn ("Error: " <> show e)
    -- => Not reached — input was valid
  -- => Output: Valid PO: po_abc-123
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: A pure domain function with no infrastructure imports is the most testable unit of code in the system — calling it requires nothing but the runtime and domain types, regardless of whether that runtime is F#, Clojure, or a TypeScript Node process.

**Why It Matters**: Teams that embed database calls directly in domain functions often discover this when they try to write unit tests. The setup cost (spinning up databases, seeding data, managing transactions) discourages testing, leading to under-tested business logic. Pure domain functions have zero setup cost: pass in data, receive a `Result`. This is the direct payoff of the domain isolation rule, and it compounds across every domain function in the system.

---

### Example 3: Input Port as a Function Type Alias

An **input port** is the entry point into the application. Any adapter (HTTP handler, CLI parser, message consumer) that wants to trigger the `SubmitPurchaseOrder` workflow calls through this port. In functional languages, an input port is expressed as a function type — a named type alias or type synonym describing the exact shape a caller must satisfy, with no interface, no abstract class, and no inheritance required.

```mermaid
graph LR
    accTitle: Example 3: Input Port as a Function Type Alias
    accDescr: Graph with 5 nodes and 4 connections. Nodes: HTTP Adapter POST /purchase-orders, CLI Adapter ./submit-po, Test xUnit / Expecto, SubmitPurchaseOrder UseCase function type alias, submitPurchaseOrder (implementation). Connections: HTTP Adapter POST /purchase-orders to SubmitPurchaseOrder UseCase function type alias (calls port), CLI Adapter ./submit-po to SubmitPurchaseOrder UseCase function type alias (calls port), Test xUnit / Expecto to SubmitPurchaseOrder UseCase function type alias (calls port), SubmitPurchaseOrder UseCase function type alias to submitPurchaseOrder (implementation) (satisfied by).
    HTTP["HTTP Adapter<br/>POST<br/>/purchase-orders"]
    CLI["CLI Adapter<br/>./submit-po"]
    TEST["Test<br/>xUnit / Expecto"]
    PORT["SubmitPurchaseOrder<br/>UseCase<br/>function type alias"]
    SVC["submitPurchaseOrder<br/>(implementation)"]

    HTTP -- "calls port" --> PORT
    CLI  -- "calls port" --> PORT
    TEST -- "calls port" --> PORT
    PORT -- "satisfied by" --> SVC

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class PORT pal-0173B2
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class SVC pal-029E73
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class HTTP pal-DE8F05
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class CLI pal-CA9161
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class TEST pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// Input port: the complete contract for submitting a purchase order.
// A type alias for a function — not an interface, not a class hierarchy.

type DraftPurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal }
// => Raw input from any delivery mechanism — nothing validated yet

type SubmittedPurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal; Status: string }
// => Represents a PO in AwaitingApproval state — validated and persisted

type SubmissionError =
    | ValidationError of string
    // => Domain rule violated — caller should fix the request
    | RepositoryError of string
    // => Infrastructure failure — caller may retry

// Input port type alias — the complete contract in one line
type SubmitPurchaseOrderUseCase =
    DraftPurchaseOrder -> Async<Result<SubmittedPurchaseOrder, SubmissionError>>
// => Input:  raw, unvalidated PO DTO from any delivery mechanism
// => Output: Ok SubmittedPurchaseOrder on success, or SubmissionError on failure
// => The async wrapper acknowledges that persistence is effectful

// Any function with this signature satisfies the port — no inheritance needed
let submitPurchaseOrder : SubmitPurchaseOrderUseCase =
    // => This is ONE implementation of the port — tests can supply a different one
    fun draft ->
        async {
            // Simplified: validation + stubbed persistence
            if System.String.IsNullOrWhiteSpace(draft.Id) then
                return Error (ValidationError "PO Id must not be blank")
            // => Domain rule enforced before any I/O
            else
                let submitted = { Id = draft.Id; SupplierId = draft.SupplierId
                                  TotalAmount = draft.TotalAmount; Status = "AwaitingApproval" }
                // => State transition: Draft -> AwaitingApproval
                return Ok submitted
                // => Happy path — PO is now awaiting manager approval
        }

// The HTTP adapter holds the injected port — it never names the implementation
// let handler (useCase: SubmitPurchaseOrderUseCase) (dto: HttpDto) = ...
// => useCase is the port; the implementation is wired at the composition root
```

{{< /tab >}}

{{< tab >}}

```clojure
;; Input port: the complete contract for submitting a purchase order.
;; A plain function var — not a protocol, not a defrecord hierarchy.
;; [F#: type alias SubmitPurchaseOrderUseCase = DraftPurchaseOrder -> Async<Result<...>>]
;; => Clojure expresses ports as functions that accept and return plain maps
;; => The "contract" is documented by the function spec, not a type alias

(ns procurement-platform.application.ports.submit-purchase-order)

;; Clojure port contract documented via function spec (closest native to F# type alias)
;; [F#: type SubmissionError = ValidationError of string | RepositoryError of string]
;; => Clojure represents errors as maps with a :error/kind key — open, not exhaustive
;; => {:error/kind :validation-error :message "..."} or {:error/kind :repository-error}

(defn submit-purchase-order
  ;; Default (real) implementation of the input port.
  ;; Any function accepting a draft map and returning a result map satisfies the port.
  ;; => Callers depend on this function's shape — not on the implementation namespace
  [draft]
  ;; => draft is a plain map: {:id "..." :supplier-id "..." :total-amount 500}
  (if (clojure.string/blank? (:id draft))
    ;; => Guard: the PO id must be non-blank — domain rule enforced before any I/O
    {:error {:error/kind :validation-error :message "PO id must not be blank"}}
    ;; => Returns error map — caller checks :error key, not an exception

    (let [submitted (assoc draft :status :awaiting-approval)]
      ;; => State transition: draft map gains :status — no new type required
      ;; => assoc returns a NEW map — original draft is unchanged (immutability)
      {:ok submitted})))
      ;; => Happy path — map wrapped in :ok for uniform result shape

;; The HTTP adapter receives the port function as a parameter — never names the impl ns
;; (defn handler [submit-po-fn http-request] ...)
;; => submit-po-fn is the injected port var; the implementation is wired at composition root
;; => Any function of the same shape (draft -> result-map) is a valid substitute
```

{{< /tab >}}

{{< tab >}}

```typescript
// Input port: the complete contract for submitting a purchase order.
// A function-type alias — not a class, not an interface hierarchy.

interface DraftPurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
}
// => Raw input from any delivery mechanism — nothing validated yet

interface SubmittedPurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Represents a PO in AwaitingApproval state — validated and persisted

type SubmissionError =
  | { readonly kind: "ValidationError"; readonly message: string }
  // => Domain rule violated — caller should fix the request
  | { readonly kind: "RepositoryError"; readonly message: string };
// => Infrastructure failure — caller may retry

// Result type for FP-style error handling — no throw
type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
// => Exhaustive — callers must handle both branches

// Input port type alias — the complete contract in one line
type SubmitPurchaseOrderUseCase = (draft: DraftPurchaseOrder) => Promise;
// => Input:  raw, unvalidated PO DTO from any delivery mechanism
// => Output: ok SubmittedPurchaseOrder on success, or SubmissionError on failure
// => Promise acknowledges that persistence is effectful (async I/O)

// Any function with this signature satisfies the port — no inheritance needed
const submitPurchaseOrder: SubmitPurchaseOrderUseCase = async (draft) => {
  // => This is ONE implementation of the port — tests can supply a different one
  if (!draft.id || draft.id.trim() === "") {
    return { ok: false, error: { kind: "ValidationError", message: "PO Id must not be blank" } };
    // => Domain rule enforced before any I/O
  }
  const submitted: SubmittedPurchaseOrder = {
    id: draft.id,
    supplierId: draft.supplierId,
    totalAmount: draft.totalAmount,
    status: "AwaitingApproval",
    // => State transition: Draft -> AwaitingApproval
  };
  return { ok: true, value: submitted };
  // => Happy path — PO is now awaiting manager approval
};

// The HTTP adapter holds the injected port — it never names the implementation
// const handler = (useCase: SubmitPurchaseOrderUseCase) => (dto: HttpDto) => ...
// => useCase is the port; the implementation is wired at the composition root
```

{{< /tab >}}

{{< tab >}}

```haskell
-- Input port: the complete contract for submitting a purchase order.
-- A type alias for a function — not a class, not a typeclass hierarchy.
-- [F#: type SubmitPurchaseOrderUseCase = ... -> Async<Result<...>> — Haskell uses IO]

module Procurement.Application.SubmitPO where

import Data.Text (Text)
import qualified Data.Text as T

data DraftPurchaseOrder = DraftPurchaseOrder
  { draftId    :: Text
  , draftSupp  :: Text
  , draftTotal :: Double
  } deriving (Show, Eq)
-- => Raw input from any delivery mechanism — nothing validated yet

data SubmittedPurchaseOrder = SubmittedPurchaseOrder
  { spoId     :: Text
  , spoSupp   :: Text
  , spoTotal  :: Double
  , spoStatus :: Text
  } deriving (Show, Eq)
-- => Represents a PO in AwaitingApproval state — validated and persisted

data SubmissionError
  = ValidationError Text
  -- => Domain rule violated — caller should fix the request
  | RepositoryError Text
  -- => Infrastructure failure — caller may retry
  deriving (Show, Eq)

-- Input port type alias — the complete contract in one line
-- => Input:  raw, unvalidated PO DTO from any delivery mechanism
-- => Output: Right SubmittedPurchaseOrder on success, or Left SubmissionError on failure
-- => IO acknowledges that persistence is effectful
type SubmitPurchaseOrderUseCase =
  DraftPurchaseOrder -> IO (Either SubmissionError SubmittedPurchaseOrder)

-- Any function with this signature satisfies the port — no instance declaration needed
submitPurchaseOrder :: SubmitPurchaseOrderUseCase
-- => This is ONE implementation of the port — tests can supply a different one
submitPurchaseOrder draft
  | T.null (T.strip (draftId draft)) =
      pure (Left (ValidationError "PO Id must not be blank"))
      -- => Domain rule enforced before any I/O
  | otherwise =
      pure (Right (SubmittedPurchaseOrder
        (draftId draft) (draftSupp draft) (draftTotal draft) "AwaitingApproval"))
      -- => State transition: Draft -> AwaitingApproval

-- The HTTP adapter holds the injected port — it never names the implementation
-- handler :: SubmitPurchaseOrderUseCase -> HttpDto -> IO HttpResponse
-- => useCase is the port; the implementation is wired at the composition root
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: An input port expressed as a function type alias gives every adapter (HTTP, CLI, test) a single, compiler-checked contract without requiring a base class or interface hierarchy.

**Why It Matters**: Traditional layered architectures expose the `OrderService` class directly to controllers, creating invisible coupling between the HTTP layer and the service implementation. A function type alias breaks this coupling: the HTTP adapter depends on the type `SubmitPurchaseOrderUseCase`, not on any specific module. Swapping the implementation (for testing, A/B deployment, or a complete rewrite) requires changing exactly one line in the composition root. No mocking framework, no DI container — just pass a different function.

---

### Example 4: Output Port as a Record Type — `PurchaseOrderRepository`

An **output port** is a record of functions that the application layer calls but never implements. The record type is the contract; record literals in the adapters zone are the implementations. The `PurchaseOrderRepository` port appears identically in every example that uses it.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── Domain types ──────────────────────────────────────────────────────────
type PurchaseOrderId = string
// => Alias for the PO primary key — format po_<uuid>

type PurchaseOrder = {
    // => Aggregate root of the purchasing context
    Id         : PurchaseOrderId
    SupplierId : string
    TotalAmount: decimal
    Status     : string
}

// ── Infrastructure error type ─────────────────────────────────────────────
type RepoError = DatabaseError of string | ConnectionTimeout
// => Named error cases — DatabaseError carries the message; ConnectionTimeout signals retry

// ── Output port: the canonical PurchaseOrderRepository definition ─────────
// This record type is THE port contract. Every adapter must provide a value
// of this type. No adapter name, no SQL, no Npgsql — just function signatures.
type PurchaseOrderRepository = {
    save: PurchaseOrder -> Async<Result<unit, RepoError>>
    // => Persist a PO — upsert semantics recommended
    // => Async because disk/network I/O is involved
    // => Result<unit, RepoError> because the database can fail with named cases
    load: PurchaseOrderId -> Async<Result<PurchaseOrder option, RepoError>>
    // => Load a PO by its ID
    // => Returns None when the PO does not exist (not an error)
    // => Returns Error RepoError on infrastructure failure
}
// => This exact record type signature is used in every example that touches the repository port

// ── Demonstration: the port is just a type ───────────────────────────────
// The application service accepts this record — it never names an implementation.
let exampleService (repo: PurchaseOrderRepository) (id: PurchaseOrderId) =
    // => repo is the injected port — could be Postgres, in-memory, or a spy
    async {
        let! result = repo.load id
        // => Calls the port — no knowledge of what is behind the boundary
        return result
        // => Propagates the Result to the caller unchanged
    }

printfn "PurchaseOrderRepository port defined — zero adapter knowledge in application layer"
// => Output: PurchaseOrderRepository port defined — zero adapter knowledge in application layer
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── Output port: PurchaseOrderRepository as a protocol ────────────────────
;; [F#: record-of-functions type PurchaseOrderRepository — Clojure uses a protocol]
;; => defprotocol is Clojure's idiomatic open-dispatch mechanism for polymorphism
;; => Any type that extends the protocol satisfies the port — no class hierarchy needed

(ns procurement-platform.application.ports.repository)

;; Clojure protocol = F# record-of-functions (closest native equivalent)
;; => Each method signature documents one operation the port must support
(defprotocol PurchaseOrderRepository
  (save-po [repo purchase-order]
    ;; Persist a PO — upsert semantics recommended.
    ;; => Returns a result map: {:ok nil} on success, {:error {:error/kind :db-error}} on failure
    ;; => Async callers use core.async; sync callers receive the result directly
    "Persist a purchase order; returns {:ok nil} or {:error ...}")
  (load-po [repo purchase-order-id]
    ;; Load a PO by its id.
    ;; => Returns {:ok po-map} when found, {:ok nil} when not found, {:error ...} on failure
    ;; => nil inside :ok signals absence — not an error, just a missing record
    "Load a purchase order by id; returns {:ok po-map}, {:ok nil}, or {:error ...}"))
;; => Protocol methods are the port contract — no SQL, no jdbc here

;; ── Demonstration: the application service calls the protocol ─────────────
(defn example-service
  ;; Application service accepts any value implementing PurchaseOrderRepository.
  ;; [F#: repo: PurchaseOrderRepository — same injection pattern, no named implementation]
  ;; => repo could be a PostgresRepository, an InMemoryRepository, or a test spy
  [repo id]
  (load-po repo id))
  ;; => Calls the protocol method — no knowledge of the concrete implementation
  ;; => The composition root decides which implementation satisfies the protocol

(println "PurchaseOrderRepository port defined — zero adapter knowledge in application layer")
;; => Output: PurchaseOrderRepository port defined — zero adapter knowledge in application layer
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── Domain types ──────────────────────────────────────────────────────────
type POId = string & { readonly _brand: "POId" };
// => Branded alias for the PO primary key — format po_<uuid>

interface PurchaseOrder {
  // => Aggregate root of the purchasing context
  readonly id: POId;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}

// ── Infrastructure error type ─────────────────────────────────────────────
type RepoError =
  | { readonly kind: "DatabaseError"; readonly message: string }
  // => Named error — DatabaseError carries the message
  | { readonly kind: "ConnectionTimeout" };
// => ConnectionTimeout signals a retry opportunity

// ── Result type ───────────────────────────────────────────────────────────
type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
// => FP-style tagged union — avoids exceptions as control flow

// ── Output port: the canonical PurchaseOrderRepository definition ─────────
// This type alias is THE port contract. Every adapter must satisfy it.
// No adapter name, no SQL, no pg — just function signatures.
type PurchaseOrderRepo = {
  readonly save: (po: PurchaseOrder) => Promise;
  // => Persist a PO — upsert semantics recommended
  // => Promise because disk/network I/O is involved
  // => Result<void, RepoError> because the database can fail with named cases
  readonly findById: (id: POId) => Promise;
  // => Load a PO by its ID
  // => Returns null when the PO does not exist (not an error)
  // => Returns error RepoError on infrastructure failure
};
// => This exact type alias is used in every example that touches the repository port

// ── Demonstration: the port is just a type ────────────────────────────────
// The application service accepts this type — it never names an implementation.
const exampleService =
  (repo: PurchaseOrderRepo) =>
  async (id: POId): Promise => {
    // => repo is the injected port — could be Postgres, in-memory, or a spy
    return repo.findById(id);
    // => Calls the port — no knowledge of what is behind the boundary
  };

console.log("PurchaseOrderRepo port defined — zero adapter knowledge in application layer");
// => Output: PurchaseOrderRepo port defined — zero adapter knowledge in application layer
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── Domain types ──────────────────────────────────────────────────────────
-- [F#: type alias PurchaseOrderId = string — Haskell uses newtype for nominal typing]
module Procurement.Application.Repo where

import Data.Text (Text)

newtype PurchaseOrderId = PurchaseOrderId Text deriving (Show, Eq)
-- => Newtype alias for the PO primary key — format po_<uuid>

data PurchaseOrder = PurchaseOrder
  -- => Aggregate root of the purchasing context
  { poId       :: PurchaseOrderId
  , poSupplier :: Text
  , poTotal    :: Double
  , poStatus   :: Text
  } deriving (Show, Eq)

-- ── Infrastructure error type ─────────────────────────────────────────────
data RepoError
  = DatabaseError Text
  -- => Named error — DatabaseError carries the message
  | ConnectionTimeout
  -- => Signals a retry opportunity
  deriving (Show, Eq)

-- ── Output port: the canonical PurchaseOrderRepository definition ─────────
-- This record-of-functions IS the port contract. Every adapter must build
-- a value of this type. No adapter name, no SQL, no postgresql-simple here.
-- [F#: record type with save/load — Haskell records the same shape]
data PurchaseOrderRepository = PurchaseOrderRepository
  { savePO :: PurchaseOrder -> IO (Either RepoError ())
  -- => Persist a PO — upsert semantics recommended
  -- => IO because disk/network I/O is involved
  -- => Either RepoError () because the database can fail with named cases
  , loadPO :: PurchaseOrderId -> IO (Either RepoError (Maybe PurchaseOrder))
  -- => Load a PO by its ID
  -- => Returns Nothing when the PO does not exist (not an error)
  -- => Returns Left RepoError on infrastructure failure
  }
-- => This exact record signature is used in every example that touches this port

-- ── Demonstration: the port is just a record-of-functions ────────────────
exampleService :: PurchaseOrderRepository -> PurchaseOrderId
               -> IO (Either RepoError (Maybe PurchaseOrder))
-- => repo is the injected port — could be Postgres, in-memory, or a spy
exampleService repo poid = loadPO repo poid
  -- => Calls the port — no knowledge of what is behind the boundary

main :: IO ()
main = putStrLn "PurchaseOrderRepository port defined — zero adapter knowledge in application layer"
-- => Output: PurchaseOrderRepository port defined — zero adapter knowledge in application layer
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: The `PurchaseOrderRepository` record type is the complete port contract — any record literal that provides matching `save` and `load` functions satisfies it, regardless of the underlying storage mechanism.

**Why It Matters**: When application services depend on a record-of-functions type rather than a concrete module, the adapter can be swapped without modifying a single line of application or domain code. The same `exampleService` function runs correctly against a PostgreSQL adapter in production, a Dictionary adapter in unit tests, and a WireMock adapter in integration tests. The port boundary is the wall that keeps business logic testable and infrastructure replaceable.

---

### Example 5: The `Clock` Output Port — Injecting Time

The `Clock` port makes the current timestamp injectable. Without it, `System.DateTimeOffset.UtcNow` would be hard-coded in application services, making time-dependent domain rules (approval deadlines, order expiry) non-deterministic in tests.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── Clock port ────────────────────────────────────────────────────────────
// A synchronous function — reading the clock has no failure mode.
// No async wrapper, no Result — clocks do not throw recoverable errors.
type Clock = unit -> System.DateTimeOffset
// => Returns the current timestamp as seen by the application layer
// => Synchronous: no await, no async { } block required at call site

// ── Domain type that depends on time ─────────────────────────────────────
type PurchaseOrder = {
    Id         : string
    TotalAmount: decimal
    SubmittedAt: System.DateTimeOffset
    // => Timestamp is part of the domain aggregate — used for approval SLA tracking
}

// ── Application service using the Clock port ──────────────────────────────
// The service is parameterised by the clock — never calls UtcNow directly.
let submitPO (clock: Clock) (id: string) (amount: decimal) : PurchaseOrder =
    // => clock is the injected Clock port — synchronous, pure from caller's view
    let now = clock ()
    // => Delegates timestamp resolution to the injected adapter
    { Id = id; TotalAmount = amount; SubmittedAt = now }
    // => PO timestamp is now deterministic in tests

// ── System clock adapter (production) ────────────────────────────────────
let systemClock : Clock = fun () -> System.DateTimeOffset.UtcNow
// => Production adapter: reads the real wall-clock
// => Non-deterministic — different call, different timestamp

// ── Fixed clock adapter (tests) ───────────────────────────────────────────
let fixedClock : Clock =
    // => Test adapter: always returns the same timestamp
    // => Every test assertion can use this literal value
    fun () -> System.DateTimeOffset(2026, 1, 15, 9, 0, 0, System.TimeSpan.Zero)

// ── Demonstration ─────────────────────────────────────────────────────────
let testPO = submitPO fixedClock "po_test-001" 2500m
// => Uses fixed clock — deterministic
printfn "Submitted at: %A" testPO.SubmittedAt
// => Output: Submitted at: 2026-01-15 09:00:00 +00:00  (exact, always the same)

let prodPO = submitPO systemClock "po_prod-001" 2500m
// => Uses system clock — non-deterministic (different run = different value)
printfn "Submitted at: %A" prodPO.SubmittedAt
// => Output: Submitted at: <current UTC time>  (varies by run)
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── Clock port ────────────────────────────────────────────────────────────
;; A zero-argument function — reading the clock has no failure mode.
;; [F#: type Clock = unit -> System.DateTimeOffset — Clojure uses a plain fn var]
;; => No protocol needed: a function that takes no args and returns an instant is the port
;; => Injected as a function parameter — the composition root decides which adapter to wire

(ns procurement-platform.application.ports.clock)

;; ── Application service using the Clock port ──────────────────────────────
;; The service accepts clock-fn as a parameter — never calls java.time.Instant/now directly.
(defn submit-po
  ;; clock-fn is the injected Clock port — a zero-arg function returning an instant.
  ;; [F#: submitPO (clock: Clock) — identical injection pattern, just function passing]
  [clock-fn id amount]
  {:id           id
   ;; => PO id — passed through unchanged
   :total-amount amount
   ;; => Total amount — passed through unchanged
   :submitted-at (clock-fn)})
   ;; => Delegates timestamp resolution to the injected clock function
   ;; => Returns a plain map — no record type required

;; ── System clock adapter (production) ────────────────────────────────────
(def system-clock
  ;; Production adapter: reads the real wall-clock via Java interop.
  ;; => Non-deterministic — different call, different instant
  #(java.time.Instant/now))
  ;; => #() is Clojure's anonymous function shorthand; % would be the arg if there were one

;; ── Fixed clock adapter (tests) ───────────────────────────────────────────
(def fixed-clock
  ;; Test adapter: always returns the same instant.
  ;; => Every test assertion can use this literal value — deterministic by construction
  (let [fixed-instant (java.time.Instant/parse "2026-01-15T09:00:00Z")]
    ;; => Parse once, close over the value — the fn always returns this instant
    (fn [] fixed-instant)))

;; ── Demonstration ─────────────────────────────────────────────────────────
(def test-po (submit-po fixed-clock "po_test-001" 2500))
;; => Uses fixed clock — deterministic across all test runs
(println "Submitted at:" (:submitted-at test-po))
;; => Output: Submitted at: 2026-01-15T09:00:00Z  (exact, always the same)

(def prod-po (submit-po system-clock "po_prod-001" 2500))
;; => Uses system clock — non-deterministic (different run = different instant)
(println "Submitted at:" (:submitted-at prod-po))
;; => Output: Submitted at: <current UTC instant>  (varies by run)
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── Clock port ────────────────────────────────────────────────────────────
// A synchronous function — reading the clock has no failure mode.
// No Promise wrapper, no Result — clocks do not throw recoverable errors.
type Clock = () => Date;
// => Returns the current timestamp as seen by the application layer
// => Synchronous: no await required at call site

// ── Domain type that depends on time ─────────────────────────────────────
interface PurchaseOrder {
  readonly id: string;
  readonly totalAmount: number;
  readonly submittedAt: Date;
  // => Timestamp is part of the domain aggregate — used for approval SLA tracking
}

// ── Application service using the Clock port ──────────────────────────────
// The service is parameterised by the clock — never calls new Date() directly.
const submitPO =
  (clock: Clock) =>
  (id: string, amount: number): PurchaseOrder => {
    // => clock is the injected Clock port — synchronous, pure from caller's view
    const now = clock();
    // => Delegates timestamp resolution to the injected adapter
    return { id, totalAmount: amount, submittedAt: now };
    // => PO timestamp is now deterministic in tests
  };

// ── System clock adapter (production) ────────────────────────────────────
const systemClock: Clock = () => new Date();
// => Production adapter: reads the real wall-clock
// => Non-deterministic — different call, different timestamp

// ── Fixed clock adapter (tests) ───────────────────────────────────────────
const fixedClock: Clock = () => new Date("2026-01-15T09:00:00Z");
// => Test adapter: always returns the same Date
// => Every test assertion can use this literal value

// ── Demonstration ─────────────────────────────────────────────────────────
const testPO = submitPO(fixedClock)("po_test-001", 2500);
// => Uses fixed clock — deterministic
console.log("Submitted at:", testPO.submittedAt.toISOString());
// => Output: Submitted at: 2026-01-15T09:00:00.000Z  (exact, always the same)

const prodPO = submitPO(systemClock)("po_prod-001", 2500);
// => Uses system clock — non-deterministic (different run = different value)
console.log("Submitted at:", prodPO.submittedAt.toISOString());
// => Output: Submitted at: <current UTC time>  (varies by run)
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── Clock port ────────────────────────────────────────────────────────────
-- An IO action — reading the clock has no failure mode but is effectful.
-- [F#: type Clock = unit -> System.DateTimeOffset — Haskell uses IO UTCTime]

module Procurement.Application.Clock where

import Data.Time (UTCTime, getCurrentTime)
import Data.Time.Format.ISO8601 (iso8601ParseM)
-- => UTCTime is the standard timestamp type from the time package

-- Clock port as an IO action — no async wrapper, no Either; clocks do not fail
type Clock = IO UTCTime
-- => Returns the current timestamp as seen by the application layer
-- => IO acknowledges that reading the clock is observable but never fails

-- ── Domain type that depends on time ─────────────────────────────────────
data PurchaseOrder = PurchaseOrder
  { poId          :: String
  , poTotal       :: Double
  , poSubmittedAt :: UTCTime
  -- => Timestamp is part of the domain aggregate — used for approval SLA tracking
  } deriving (Show)

-- ── Application service using the Clock port ──────────────────────────────
-- The service is parameterised by the clock — never calls getCurrentTime directly.
submitPO :: Clock -> String -> Double -> IO PurchaseOrder
submitPO clock poid amount = do
  -- => clock is the injected Clock port — IO action returning the current time
  now <- clock
  -- => Delegates timestamp resolution to the injected adapter
  pure (PurchaseOrder poid amount now)
  -- => PO timestamp is now deterministic in tests

-- ── System clock adapter (production) ────────────────────────────────────
systemClock :: Clock
systemClock = getCurrentTime
-- => Production adapter: reads the real wall-clock via Data.Time.getCurrentTime
-- => Non-deterministic — different call, different timestamp

-- ── Fixed clock adapter (tests) ───────────────────────────────────────────
fixedClock :: Clock
fixedClock = case iso8601ParseM "2026-01-15T09:00:00Z" of
  -- => Test adapter: always returns the same timestamp
  Just t  -> pure t
  Nothing -> error "unreachable: literal ISO8601 string"
  -- => iso8601ParseM is total but returns Maybe; literal is always parseable

-- ── Demonstration ─────────────────────────────────────────────────────────
main :: IO ()
main = do
  testPO <- submitPO fixedClock "po_test-001" 2500
  -- => Uses fixed clock — deterministic
  putStrLn ("Submitted at: " <> show (poSubmittedAt testPO))
  -- => Output: Submitted at: 2026-01-15 09:00:00 UTC  (exact, always the same)

  prodPO <- submitPO systemClock "po_prod-001" 2500
  -- => Uses system clock — non-deterministic (different run = different value)
  putStrLn ("Submitted at: " <> show (poSubmittedAt prodPO))
  -- => Output: Submitted at: <current UTC time>  (varies by run)
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: A `Clock` port that returns a `DateTimeOffset` makes time a dependency like any other — injectable, swappable, and deterministic in tests.

**Why It Matters**: Time-dependent business rules are among the hardest to test without a clock port. Approval SLAs, order expiry windows, and payment scheduling deadlines all require specific timestamps to trigger. Without an injectable clock, tests either manipulate system time globally (fragile, OS-dependent) or skip the time-sensitive paths entirely. The `Clock` port costs one function type alias and one record field; the payoff is complete determinism for any time-sensitive domain rule.

---

### Example 6: The Dependency Rule — Direction of Imports

The dependency rule states that the direction of source-code imports must always point inward: adapters import the application zone, the application zone imports the domain zone, and the domain zone imports nothing outside itself. Violating this rule is the single most common hexagonal architecture mistake.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── CORRECT dependency directions ────────────────────────────────────────

// Domain.fs — zero external imports
module ProcurementPlatform.Domain

type PurchaseOrder = { Id: string; TotalAmount: decimal; Status: string }
// => Domain type — defined without knowledge of any infrastructure
type DomainError = InvalidAmount of decimal | BlankId
// => Named errors — no exception types, no HTTP status codes here

// Application.fs — imports Domain only
module ProcurementPlatform.Application
// open ProcurementPlatform.Domain  ← CORRECT: imports inner zone

type PurchaseOrderRepository = {
    // => Port defined in Application — depends on Domain types only
    save: PurchaseOrder -> Async<Result<unit, string>>
    load: string        -> Async<Result<PurchaseOrder option, string>>
}
// => Application knows Domain; Application does NOT know Adapters

// Adapters/PostgresAdapter.fs — imports Application (and transitively Domain)
module ProcurementPlatform.Adapters.PostgresAdapter
// open ProcurementPlatform.Application  ← CORRECT: imports middle zone
// open Npgsql                           ← CORRECT: adapters may import infrastructure

// ── WRONG dependency directions ───────────────────────────────────────────
// These are the mistakes the dependency rule prevents.

// MISTAKE 1: Domain importing infrastructure
// module ProcurementPlatform.Domain
// open Npgsql  ← WRONG: domain cannot import Npgsql
// => Effect: domain is now untestable without a real Postgres connection

// MISTAKE 2: Application importing an adapter
// module ProcurementPlatform.Application
// open ProcurementPlatform.Adapters.PostgresAdapter  ← WRONG
// => Effect: swapping the adapter requires changing the application layer

// MISTAKE 3: Domain importing application
// module ProcurementPlatform.Domain
// open ProcurementPlatform.Application  ← WRONG
// => Effect: circular dependency; domain becomes aware of ports it should not know about

printfn "Dependency rule: Domain ← Application ← Adapters (arrows = allowed imports)"
// => Output: Dependency rule: Domain ← Application ← Adapters (arrows = allowed imports)
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── CORRECT dependency directions ────────────────────────────────────────
;; [F#: module ordering enforces the dependency rule at compile time]
;; => Clojure uses ns :require declarations to express the same rule
;; => The rule is: domain ns requires nothing; application requires domain; adapters require both

;; ── domain/purchase_order.clj — zero infrastructure requires ──────────────
(ns procurement-platform.domain.purchase-order)
;; => No :require of any infrastructure library — pure domain ns

(defn make-po [id total-amount status]
  ;; Domain constructor — returns a plain map, no external dependency needed
  {:id id :total-amount total-amount :status status})
;; => Domain type — defined without knowledge of any infrastructure

;; ── application/ports.clj — requires domain only ─────────────────────────
(ns procurement-platform.application.ports
  (:require [procurement-platform.domain.purchase-order :as po]))
;; => :require of domain ns is CORRECT — application knows domain
;; => No :require of any adapter ns here — application does NOT know adapters

(defprotocol PurchaseOrderRepository
  ;; Port defined in application — depends on domain types only
  (save-po [repo purchase-order] "Persist a PO; returns {:ok nil} or {:error ...}")
  (load-po [repo id]             "Load a PO; returns {:ok po-map}, {:ok nil}, or {:error ...}"))
;; => Application knows domain; Application does NOT know adapters

;; ── adapters/postgres_adapter.clj — requires application and infrastructure ──
(ns procurement-platform.adapters.postgres-adapter
  (:require [procurement-platform.application.ports :as ports]
            ;; => :require of application ns is CORRECT — adapter depends on application
            [next.jdbc :as jdbc]))
            ;; => :require of jdbc is CORRECT — adapters may require infrastructure libraries

;; ── WRONG dependency directions ───────────────────────────────────────────
;; These are the mistakes the dependency rule prevents.

;; MISTAKE 1: Domain requiring infrastructure
;; (ns procurement-platform.domain.purchase-order
;;   (:require [next.jdbc]))  ← WRONG: domain cannot require jdbc
;; => Effect: domain is now untestable without a real Postgres connection

;; MISTAKE 2: Application requiring an adapter
;; (ns procurement-platform.application.ports
;;   (:require [procurement-platform.adapters.postgres-adapter]))  ← WRONG
;; => Effect: swapping the adapter requires changing the application layer

;; MISTAKE 3: Domain requiring application
;; (ns procurement-platform.domain.purchase-order
;;   (:require [procurement-platform.application.ports]))  ← WRONG
;; => Effect: circular dependency; domain becomes aware of ports it should not know about

(println "Dependency rule: Domain ← Application ← Adapters (arrows = allowed requires)")
;; => Output: Dependency rule: Domain ← Application ← Adapters (arrows = allowed requires)
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── CORRECT dependency directions ────────────────────────────────────────

// domain.ts — zero external imports
// import { Pool } from "pg"  ← WRONG: domain cannot import pg
type PurchaseOrder = { readonly id: string; readonly totalAmount: number; readonly status: string };
// => Domain type — defined without knowledge of any infrastructure
type DomainError = { readonly kind: "InvalidAmount"; readonly amount: number } | { readonly kind: "BlankId" };
// => Named errors — no exception types, no HTTP status codes here

// application/ports.ts — imports domain only
// import type { PurchaseOrder, DomainError } from "../domain"  ← CORRECT

type PurchaseOrderRepo = {
  // => Port defined in application — depends on domain types only
  readonly save: (po: PurchaseOrder) => Promise;
  readonly findById: (id: string) => Promise;
};
// => Application knows domain; application does NOT know adapters

// adapters/postgresRepo.ts — imports application (and transitively domain)
// import type { PurchaseOrderRepo } from "../application/ports"  ← CORRECT
// import { Pool } from "pg"                                       ← CORRECT: adapters may import infrastructure

// ── WRONG dependency directions ───────────────────────────────────────────
// These are the mistakes the dependency rule prevents.

// MISTAKE 1: Domain importing infrastructure
// import { Pool } from "pg"  ← inside domain.ts — WRONG
// => Effect: domain is now untestable without a real Postgres connection

// MISTAKE 2: Application importing an adapter
// import { PostgresRepo } from "../adapters/postgresRepo"  ← inside application — WRONG
// => Effect: swapping the adapter requires changing the application layer

// MISTAKE 3: Domain importing application
// import type { PurchaseOrderRepo } from "../application/ports"  ← inside domain.ts — WRONG
// => Effect: circular dependency; domain becomes aware of ports it should not know about

console.log("Dependency rule: Domain <- Application <- Adapters (arrows = allowed imports)");
// => Output: Dependency rule: Domain <- Application <- Adapters (arrows = allowed imports)
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── CORRECT dependency directions ────────────────────────────────────────
-- [F#: module ordering enforces dependency rule — Haskell uses import directives]

-- Procurement/Domain.hs — zero external imports beyond base + Text
module Procurement.Domain where

import Data.Text (Text)

data PurchaseOrder = PurchaseOrder
  { poId :: Text, poTotal :: Double, poStatus :: Text }
  deriving (Show, Eq)
-- => Domain type — defined without knowledge of any infrastructure

data DomainError = InvalidAmount Double | BlankId deriving (Show, Eq)
-- => Named errors — no exception types, no HTTP status codes here

-- Procurement/Application.hs — imports Domain only
-- module Procurement.Application where
-- import Procurement.Domain   -- ← CORRECT: imports inner zone

data PurchaseOrderRepository = PurchaseOrderRepository
  -- => Port defined in Application — depends on Domain types only
  { savePO :: PurchaseOrder -> IO (Either Text ())
  , loadPO :: Text          -> IO (Either Text (Maybe PurchaseOrder))
  }
-- => Application knows Domain; Application does NOT know Adapters

-- Procurement/Adapters/Postgres.hs — imports Application (and transitively Domain)
-- module Procurement.Adapters.Postgres where
-- import Procurement.Application                  -- ← CORRECT: imports middle zone
-- import Database.PostgreSQL.Simple               -- ← CORRECT: adapters may import infra

-- ── WRONG dependency directions ───────────────────────────────────────────
-- These are the mistakes the dependency rule prevents.

-- MISTAKE 1: Domain importing infrastructure
-- module Procurement.Domain where
-- import Database.PostgreSQL.Simple  ← WRONG: domain cannot import infra
-- => Effect: domain is now untestable without a real Postgres connection

-- MISTAKE 2: Application importing an adapter
-- module Procurement.Application where
-- import Procurement.Adapters.Postgres  ← WRONG
-- => Effect: swapping the adapter requires changing the application layer

-- MISTAKE 3: Domain importing application
-- module Procurement.Domain where
-- import Procurement.Application  ← WRONG
-- => Effect: circular dependency; domain becomes aware of ports it should not know

main :: IO ()
main = putStrLn "Dependency rule: Domain <- Application <- Adapters (arrows = allowed imports)"
-- => Output: Dependency rule: Domain <- Application <- Adapters (arrows = allowed imports)
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: The dependency rule — imports only point inward — is a structural constraint, not a framework feature. Every functional language shown here enforces it differently: through compilation order, namespace require topology, import linting rules, or module path conventions. The mechanism varies; the invariant is the same.

**Why It Matters**: The dependency rule is not a guideline — it is the architectural invariant that makes the whole pattern work. When it is violated, the domain becomes coupled to infrastructure (untestable), adapters become coupled to each other (unswappable), and the application service becomes coupled to specific adapter implementations (fragile). Compiled functional languages with strict module or file ordering can surface many violations at compile time: when a module in the domain zone attempts to import from the adapter zone, the compiler rejects it before any code runs. This automatic enforcement is the strongest guard the pattern can provide.

---

### Example 7: Zone Boundaries as File Organisation

Hexagonal Architecture's zone boundaries should be visible in the file system. The module namespace convention maps directly to folder structure, making zone violations easy to detect in a code review without reading any code.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── File system layout ────────────────────────────────────────────────────
// ProcurementPlatform/
// ├── Domain/
// │   └── PurchaseOrder.fs          ← inner zone: no external dependencies
// ├── Application/
// │   ├── Ports.fs                  ← port type aliases: PurchaseOrderRepository, Clock
// │   └── PurchaseOrderService.fs   ← orchestration: calls domain + ports
// └── Adapters/
//     ├── PostgresPurchaseOrderRepository.fs  ← output port implementation
//     ├── InMemoryPurchaseOrderRepository.fs  ← test adapter
//     ├── HttpController.fs                   ← primary (driving) adapter
//     └── Composition.fs                      ← wires adapters to ports

// ── Domain/PurchaseOrder.fs ───────────────────────────────────────────────
module ProcurementPlatform.Domain.PurchaseOrder

type PurchaseOrderId = string
// => Thin alias — prevents mixing PO IDs with other string identifiers

type PurchaseOrder = {
    // => Aggregate root of the purchasing context — lives only in this module
    Id         : PurchaseOrderId
    SupplierId : string
    TotalAmount: decimal
    Status     : string
}

// ── Application/Ports.fs ─────────────────────────────────────────────────
module ProcurementPlatform.Application.Ports

// open ProcurementPlatform.Domain.PurchaseOrder  ← only domain types imported

type PurchaseOrderRepository = {
    // => Port definition — ONLY in the application zone
    save : PurchaseOrder -> Async<Result<unit, string>>
    load : PurchaseOrderId -> Async<Result<PurchaseOrder option, string>>
}
// => Adapters implement this; the application service consumes it

type Clock = unit -> System.DateTimeOffset
// => Time port — all ports live alongside each other in Ports.fs

// ── Adapters/Composition.fs ───────────────────────────────────────────────
// The composition root is the ONLY file that knows about all adapters.
// module ProcurementPlatform.Adapters.Composition
// open ProcurementPlatform.Application.Ports
// open ProcurementPlatform.Adapters.PostgresPurchaseOrderRepository
// open ProcurementPlatform.Adapters.HttpController

printfn "File layout enforces zone boundaries — violations are visible at a glance"
// => Output: File layout enforces zone boundaries — violations are visible at a glance
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── File system layout ────────────────────────────────────────────────────
;; procurement_platform/
;; ├── domain/
;; │   └── purchase_order.clj        ← inner zone: no :require of infrastructure
;; ├── application/
;; │   ├── ports.clj                 ← protocol definitions: PurchaseOrderRepository, clock-fn
;; │   └── purchase_order_service.clj ← orchestration: calls domain + protocols
;; └── adapters/
;;     ├── postgres_purchase_order_repository.clj  ← output port implementation
;;     ├── in_memory_purchase_order_repository.clj ← test adapter
;;     ├── http_handler.clj                        ← primary (driving) adapter
;;     └── composition.clj                         ← wires adapters to protocols
;; [F#: ProcurementPlatform/ namespace mirrors folder structure]
;; => Clojure ns names match file paths — the same zone layout applies

;; ── domain/purchase_order.clj ─────────────────────────────────────────────
(ns procurement-platform.domain.purchase-order)
;; => No :require of any infrastructure namespace — inner zone purity

(defn make-purchase-order
  ;; Aggregate root constructor — returns a plain map, no framework dependency
  [id supplier-id total-amount status]
  {:id id :supplier-id supplier-id :total-amount total-amount :status status})
;; => Aggregate root lives only in this namespace

;; ── application/ports.clj ────────────────────────────────────────────────
(ns procurement-platform.application.ports
  (:require [procurement-platform.domain.purchase-order]))
;; => :require of domain ns ONLY — no adapter namespaces here

(defprotocol PurchaseOrderRepository
  ;; Port definition — ONLY in the application zone
  (save-po [repo po]  "Persist a PO; returns {:ok nil} or {:error ...}")
  (load-po [repo id]  "Load a PO; returns {:ok po-map}, {:ok nil}, or {:error ...}"))
;; => Adapters implement this protocol; the application service consumes it

;; clock-fn port: any zero-arg fn returning an instant satisfies the clock port
;; => All ports live alongside each other in ports.clj — same as Ports.fs

;; ── adapters/composition.clj ─────────────────────────────────────────────
;; The composition root is the ONLY namespace that knows about all adapters.
;; (ns procurement-platform.adapters.composition
;;   (:require [procurement-platform.application.ports]
;;             [procurement-platform.adapters.postgres-purchase-order-repository]
;;             [procurement-platform.adapters.http-handler]))
;; => Composition ns wires concrete adapter impls to the protocol definitions

(println "File layout enforces zone boundaries — violations are visible at a glance")
;; => Output: File layout enforces zone boundaries — violations are visible at a glance
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── File system layout ────────────────────────────────────────────────────
// procurement-platform/
// ├── domain/
// │   └── purchaseOrder.ts          ← inner zone: no external imports
// ├── application/
// │   ├── ports.ts                  ← port type aliases: PurchaseOrderRepo, Clock
// │   └── purchaseOrderService.ts   ← orchestration: calls domain + ports
// └── adapters/
//     ├── postgresPurchaseOrderRepo.ts  ← output port implementation
//     ├── inMemoryPurchaseOrderRepo.ts  ← test adapter
//     ├── httpController.ts             ← primary (driving) adapter
//     └── composition.ts               ← wires adapters to port types

// ── domain/purchaseOrder.ts ───────────────────────────────────────────────
// No import from "pg", "express", or any infrastructure library here

type POId = string & { readonly _brand: "POId" };
// => Branded alias — prevents mixing PO IDs with other string identifiers

interface PurchaseOrder {
  // => Aggregate root of the purchasing context — lives only in this module
  readonly id: POId;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}

// ── application/ports.ts ─────────────────────────────────────────────────
// import type { PurchaseOrder, POId } from "../domain/purchaseOrder"
// ← only domain types imported

type PurchaseOrderRepo = {
  // => Port definition — ONLY in the application zone
  readonly save: (po: PurchaseOrder) => Promise;
  readonly findById: (id: POId) => Promise;
};
// => Adapters implement this; the application service consumes it

type Clock = () => Date;
// => Time port — all ports live alongside each other in ports.ts

// ── adapters/composition.ts ───────────────────────────────────────────────
// The composition root is the ONLY file that knows about all adapters.
// import { buildPostgresRepo } from "./postgresPurchaseOrderRepo"
// import { createHttpRouter }  from "./httpController"
// import type { PurchaseOrderRepo, Clock } from "../application/ports"

console.log("File layout enforces zone boundaries — violations are visible at a glance");
// => Output: File layout enforces zone boundaries — violations are visible at a glance
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── File system layout ────────────────────────────────────────────────────
-- src/
-- ├── Procurement/
-- │   ├── Domain/
-- │   │   └── PurchaseOrder.hs         ← inner zone: no infra imports
-- │   ├── Application/
-- │   │   ├── Ports.hs                 ← port records: PurchaseOrderRepository, Clock
-- │   │   └── SubmitPO.hs              ← orchestration: domain + ports
-- │   └── Adapters/
-- │       ├── PostgresRepo.hs          ← output port implementation
-- │       ├── InMemoryRepo.hs          ← test adapter
-- │       ├── HttpHandler.hs           ← primary (driving) adapter
-- │       └── Composition.hs           ← wires adapters to ports
-- [F#: ProcurementPlatform.* namespaces — Haskell module path mirrors folder path]

-- ── Procurement/Domain/PurchaseOrder.hs ───────────────────────────────────
module Procurement.Domain.PurchaseOrder where

import Data.Text (Text)

newtype PurchaseOrderId = PurchaseOrderId Text deriving (Show, Eq)
-- => Thin newtype — prevents mixing PO IDs with other text identifiers

data PurchaseOrder = PurchaseOrder
  -- => Aggregate root of the purchasing context — lives only in this module
  { poId       :: PurchaseOrderId
  , poSupplier :: Text
  , poTotal    :: Double
  , poStatus   :: Text
  } deriving (Show, Eq)

-- ── Procurement/Application/Ports.hs ─────────────────────────────────────
-- module Procurement.Application.Ports where
-- import Procurement.Domain.PurchaseOrder  ← only domain types imported

-- data PurchaseOrderRepository = PurchaseOrderRepository
--   { savePO :: PurchaseOrder -> IO (Either Text ())
--   , loadPO :: PurchaseOrderId -> IO (Either Text (Maybe PurchaseOrder))
--   }
-- => Port definition — ONLY in the application zone

-- type Clock = IO UTCTime
-- => Time port — all ports live alongside each other in Ports.hs

-- ── Procurement/Adapters/Composition.hs ──────────────────────────────────
-- The composition root is the ONLY module that knows about all adapters.
-- module Procurement.Adapters.Composition where
-- import Procurement.Application.Ports
-- import Procurement.Adapters.PostgresRepo
-- import Procurement.Adapters.HttpHandler

main :: IO ()
main = putStrLn "File layout enforces zone boundaries — violations are visible at a glance"
-- => Output: File layout enforces zone boundaries — violations are visible at a glance
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: Mapping the three zones directly to three top-level folders makes every dependency rule violation visible as a misplaced file, before any code is read.

**Why It Matters**: Architecture rules enforced only in developers' heads erode under deadline pressure. A folder structure that mirrors the zone model gives every contributor an immediate visual signal when something is misplaced. In code reviews, a file in `Domain/` that imports `Npgsql` is caught by the reviewer before the diff is even read. This is the power of making architecture visible through file organisation: enforcement shifts from human discipline to spatial recognition.

---

## Ports as Function Types (Examples 8–14)

### Example 8: Output Port — The `PurchaseOrderRepository` Record Type

The `PurchaseOrderRepository` port is the canonical output port for the `purchasing` context. It appears identically in every beginner example that persists or retrieves a `PurchaseOrder`. Here the focus is on understanding WHY the record-of-functions shape is the right abstraction.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── The canonical PurchaseOrderRepository port ────────────────────────────
// This definition is IDENTICAL in every example that uses this port.
// Never rename fields, never change signatures — the contract is the port.
type PurchaseOrderId = string
// => PO primary key — format po_<uuid>; alias prevents stringly-typed confusion

type PurchaseOrder = {
    // => Aggregate root — the only type the repository cares about
    Id         : PurchaseOrderId
    SupplierId : string
    TotalAmount: decimal
    Status     : string
}

// [Clojure: tagged error maps {:type :db-error :msg ...} — open dispatch; no compile-time exhaustiveness]
type RepoError = DatabaseError of string | ConnectionTimeout
// => Infrastructure errors — named so callers can respond appropriately
// => DatabaseError carries the message; ConnectionTimeout signals a retry opportunity

// [Clojure: defprotocol PurchaseOrderRepository — dynamic dispatch; any reify satisfies the port]
type PurchaseOrderRepository = {
    // => The complete output port — two operations, two function signatures
    save: PurchaseOrder -> Async<Result<unit, RepoError>>
    // => save: persist the aggregate; returns unit on success (the PO is the input)
    // => Async because disk write is I/O-bound
    // => Result because the database can fail (constraint, connection, timeout)
    load: PurchaseOrderId -> Async<Result<PurchaseOrder option, RepoError>>
    // => load: retrieve by identity; returns None when not found (not an error)
    // => option distinguishes "not found" from "infrastructure failure"
}
// => Any record literal with these two fields satisfies the PurchaseOrderRepository type

// ── How the application service depends on the port ───────────────────────
let loadAndInspect (repo: PurchaseOrderRepository) (id: PurchaseOrderId) =
    // => repo is the port — injected by the composition root
    async {
        let! result = repo.load id
        // => Delegates to whichever adapter was injected — no SQL in this function
        return
            match result with
            | Ok (Some po) -> sprintf "Found PO %s in status %s" po.Id po.Status
            // => PO found — return a summary string
            | Ok None      -> sprintf "PO %s not found" id
            // => Not found — explicit, not an error
            | Error (DatabaseError msg)  -> sprintf "DB error: %s" msg
            // => Infrastructure failure — propagate with context
            | Error ConnectionTimeout    -> "Timeout — retry later"
            // => Timeout — signal to the caller that a retry is safe
    }

printfn "PurchaseOrderRepository port declared — adapters implement; application layer consumes"
// => Output: PurchaseOrderRepository port declared — adapters implement; application layer consumes
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── The canonical purchase-order-repository port ──────────────────────────
;; This protocol is IDENTICAL in every example that uses this port.
;; Never rename methods, never change arities — the contract is the protocol.
;; [F#: record-of-functions type alias — compiler checks all fields are provided]

(ns procurement-platform.application.ports
  (:require [procurement-platform.domain.purchase-order :as po]))
;; => All port definitions live in this namespace — same as Ports.fs in F#

;; ── Domain type: plain map with namespaced keywords ───────────────────────
;; [F#: record type PurchaseOrder — compiler-checked field names and types]
;; Clojure uses plain maps; namespaced keywords prevent key collisions
;; Example: {:procurement/id "po_001" :procurement/supplier-id "sup_001" ...}

(defprotocol PurchaseOrderRepository
  ;; => The complete output port — two operations, two method signatures
  ;; [F#: record type with save and load function fields]
  (save-po [repo po]
    "Persist a PO map; returns {:ok nil} or {:error {:type :db-error :msg ...}}")
  ;; => save-po: persist the aggregate map; {:ok nil} on success
  ;; => Async via core.async or futures when calling real infrastructure
  (load-po [repo po-id]
    "Load a PO by id; returns {:ok po-map}, {:ok nil} if not found, or {:error ...}"))
;; => load-po: retrieve by identity; {:ok nil} for not-found (not an error)
;; => Any reify or record that implements both methods satisfies this protocol

;; ── Error representation — tagged map ────────────────────────────────────
;; [F#: discriminated union RepoError — compiler-enforced exhaustive matching]
;; Clojure represents errors as plain maps with a :type dispatch key
(def db-error
  ;; Constructor helper — builds a database-error map
  (fn [msg] {:type :db-error :msg msg}))
;; => {:type :db-error :msg "..."} — readable in REPL, no class hierarchy needed

(def connection-timeout
  ;; Constructor helper — builds a timeout-error map
  {:type :connection-timeout})
;; => {:type :connection-timeout} — dispatch on :type in the application layer

;; ── How the application service depends on the port ───────────────────────
(defn load-and-inspect
  ;; repo satisfies PurchaseOrderRepository — injected by the composition root
  [repo po-id]
  (let [result (load-po repo po-id)]
    ;; => Delegates to whichever adapter was injected — no SQL in this function
    (cond
      (= (:ok result) nil)
      ;; => Not found — {:ok nil} is explicit absence, not an error
      (str "PO " po-id " not found")

      (:ok result)
      ;; => PO found — extract the map and format a summary string
      (let [po (:ok result)]
        (str "Found PO " (:id po) " in status " (:status po)))

      (= (:type (:error result)) :db-error)
      ;; => Infrastructure failure — propagate with context
      (str "DB error: " (get-in result [:error :msg]))

      (= (:type (:error result)) :connection-timeout)
      ;; => Timeout — signal to the caller that a retry is safe
      "Timeout — retry later")))

(println "PurchaseOrderRepository protocol declared — adapters implement; application layer consumes")
;; => Output: PurchaseOrderRepository protocol declared — adapters implement; application layer consumes
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── The canonical PurchaseOrderRepo port ──────────────────────────────────
// This type is IDENTICAL in every example that uses this port.
// Never rename fields, never change signatures — the contract is the port.
type POId = string & { readonly _brand: "POId" };
// => PO primary key — format po_<uuid>; branded to prevent stringly-typed confusion

interface PurchaseOrder {
  // => Aggregate root — the only type the repository cares about
  readonly id: POId;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}

type RepoError =
  | { readonly kind: "DatabaseError"; readonly message: string }
  // => Infrastructure errors — named so callers can respond appropriately
  | { readonly kind: "ConnectionTimeout" };
// => ConnectionTimeout signals a retry opportunity

type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
// => FP-style tagged union — callers must handle both branches

// Port as a type alias for an object of function types
type PurchaseOrderRepo = {
  // => The complete output port — two operations, two function signatures
  readonly save: (po: PurchaseOrder) => Promise;
  // => save: persist the aggregate; returns void on success
  // => Promise because disk write is I/O-bound
  // => Result because the database can fail (constraint, connection, timeout)
  readonly findById: (id: POId) => Promise;
  // => findById: retrieve by identity; returns null when not found (not an error)
  // => null distinguishes "not found" from "infrastructure failure"
};
// => Any object satisfying this shape is a valid PurchaseOrderRepo adapter

// ── How the application service depends on the port ───────────────────────
const loadAndInspect =
  (repo: PurchaseOrderRepo) =>
  async (id: POId): Promise => {
    // => repo is the port — injected by the composition root
    const result = await repo.findById(id);
    // => Delegates to whichever adapter was injected — no SQL in this function
    if (!result.ok) {
      if (result.error.kind === "DatabaseError") return `DB error: ${result.error.message}`;
      // => Infrastructure failure — propagate with context
      return "Timeout — retry later";
      // => Timeout — signal to the caller that a retry is safe
    }
    if (result.value === null) return `PO ${id} not found`;
    // => Not found — explicit, not an error
    return `Found PO ${result.value.id} in status ${result.value.status}`;
    // => PO found — return a summary string
  };

console.log("PurchaseOrderRepo port declared — adapters implement; application layer consumes");
// => Output: PurchaseOrderRepo port declared — adapters implement; application layer consumes
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── The canonical PurchaseOrderRepository port ────────────────────────────
-- This record-of-functions is IDENTICAL in every example using this port.
-- Never rename fields, never change signatures — the contract is the port.
-- [F#: record-of-functions with save/load — Haskell uses the same pattern]

module Procurement.Application.Ports where

import Data.Text (Text)

newtype PurchaseOrderId = PurchaseOrderId Text deriving (Show, Eq)
-- => PO primary key — format po_<uuid>; newtype prevents stringly-typed confusion

data PurchaseOrder = PurchaseOrder
  -- => Aggregate root — the only type the repository cares about
  { poId       :: PurchaseOrderId
  , poSupplier :: Text
  , poTotal    :: Double
  , poStatus   :: Text
  } deriving (Show, Eq)

data RepoError
  = DatabaseError Text
  -- => Infrastructure errors — named so callers can respond appropriately
  -- => DatabaseError carries the message
  | ConnectionTimeout
  -- => ConnectionTimeout signals a retry opportunity
  deriving (Show, Eq)

-- Port as a record of IO actions returning Either RepoError ...
data PurchaseOrderRepository = PurchaseOrderRepository
  -- => The complete output port — two operations, two function fields
  { savePO :: PurchaseOrder -> IO (Either RepoError ())
  -- => save: persist the aggregate; returns () on success
  -- => IO because disk write is I/O-bound
  -- => Either because the database can fail (constraint, connection, timeout)
  , loadPO :: PurchaseOrderId -> IO (Either RepoError (Maybe PurchaseOrder))
  -- => load: retrieve by identity; returns Nothing when not found (not an error)
  -- => Maybe distinguishes "not found" from "infrastructure failure"
  }
-- => Any record value of this type is a valid PurchaseOrderRepository adapter

-- ── How the application service depends on the port ───────────────────────
loadAndInspect :: PurchaseOrderRepository -> PurchaseOrderId -> IO Text
-- => repo is the port — injected by the composition root
loadAndInspect repo poid = do
  result <- loadPO repo poid
  -- => Delegates to whichever adapter was injected — no SQL in this function
  pure $ case result of
    Right (Just po)            -> "Found PO in status " <> poStatus po
    -- => PO found — return a summary string
    Right Nothing              -> "PO not found"
    -- => Not found — explicit, not an error
    Left  (DatabaseError msg)  -> "DB error: " <> msg
    -- => Infrastructure failure — propagate with context
    Left  ConnectionTimeout    -> "Timeout — retry later"
    -- => Timeout — signal to the caller that a retry is safe

main :: IO ()
main = putStrLn "PurchaseOrderRepository port declared — adapters implement; application layer consumes"
-- => Output: PurchaseOrderRepository port declared — adapters implement; application layer consumes
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: The port contract makes substitution explicit — any implementation satisfying the required operations substitutes without changing the application service. Whether represented as a record of functions, a protocol, or a structural type alias, the application service depends only on the abstraction, never on the concrete implementation.

**Why It Matters**: A port expressed as a record of functions or a protocol gives a functional codebase the same substitutability that OOP languages get from interfaces, without requiring inheritance or virtual dispatch. The concrete mechanism varies — a record type checked structurally at compile time, a protocol dispatched dynamically at runtime, a typed object literal verified by the compiler — but all ensure that the port definition is the single source of truth for the boundary contract. Any adapter that provides the required operations is a valid substitution.

---

### Example 9: Output Port — Minimal vs Full Signatures

Port signatures should be minimal: only the parameters the application service needs. Extra parameters are adapter concerns. This example shows the difference between a minimal port and an over-specified one.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── OVER-SPECIFIED port (wrong) ───────────────────────────────────────────
// The save function carries database-specific parameters.
// The application service must now know connection strings and transaction handles.
type OverSpecifiedRepository = {
    save: string -> System.Data.IDbTransaction -> PurchaseOrder -> Async<Result<unit, string>>
    // => WRONG: connectionString and IDbTransaction are adapter concerns
    // => Application layer now knows about databases — zone violation
}
// => The application layer is now coupled to SQL-specific infrastructure

// ── MINIMAL port (correct) ────────────────────────────────────────────────
// Connection management is the adapter's responsibility — not visible here.
type PurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal; Status: string }
// => Domain type — no infrastructure fields

// [Clojure: {:type :db-error ...} or {:type :connection-timeout} maps — open; no exhaustiveness check]
type RepoError = DatabaseError of string | ConnectionTimeout
// => Named error DU — canonical error type for all PurchaseOrderRepository ports

// [Clojure: defprotocol PurchaseOrderRepository — reify provides the implementation at construction]
type PurchaseOrderRepository = {
    // => Minimal: the application service needs exactly these two operations
    save: PurchaseOrder -> Async<Result<unit, RepoError>>
    // => CORRECT: no connection string, no transaction — adapter manages those internally
    load: string        -> Async<Result<PurchaseOrder option, RepoError>>
    // => CORRECT: only the identity is needed — the adapter knows where to look
}
// => The connection string is a constructor parameter of the adapter, not a port parameter

// ── Adapter: the connection string is captured at construction time ────────
let buildPostgresRepo (connectionString: string) : PurchaseOrderRepository = {
    // => connectionString is closed over — not visible to the application layer
    save = fun po -> async {
        // open Npgsql — this is where infrastructure lives
        printfn "[PG] INSERT INTO purchase_orders VALUES (%s, %.2f)" po.Id po.TotalAmount
        // => Real: execute INSERT with Npgsql — connectionString is in scope via closure
        return Ok ()
        // => Returns unit on success — the PO identity is already in the input
    }
    load = fun id -> async {
        printfn "[PG] SELECT * FROM purchase_orders WHERE id = %s" id
        // => Real: execute SELECT with Npgsql; return None if no rows
        return Ok None
        // => Simplified: always returns None; real adapter queries Postgres
    }
}

printfn "Minimal port: connection management is the adapter's responsibility, not the port's"
// => Output: Minimal port: connection management is the adapter's responsibility, not the port's
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── OVER-SPECIFIED protocol (wrong) ──────────────────────────────────────
;; The save method carries database-specific parameters.
;; The application service must now know connection maps and transaction objects.
;; [F#: over-specified record type — IDbTransaction leaks infrastructure into the port]
(defprotocol OverSpecifiedRepository
  (save-po-bad [repo connection-map tx po]
    "WRONG: connection-map and tx are adapter concerns — zone violation"))
;; => Application layer now knows about database internals — dependency rule broken

;; ── MINIMAL protocol (correct) ───────────────────────────────────────────
;; Connection management is the adapter's responsibility — not visible at the port.
;; [F#: minimal PurchaseOrderRepository record type]

(defprotocol PurchaseOrderRepository
  ;; => Minimal: the application service needs exactly these two operations
  (save-po [repo po]
    "Persist a PO map; returns {:ok nil} or {:error {:type ... :msg ...}}")
  ;; => CORRECT: no connection map, no transaction — adapter manages those internally
  (load-po [repo po-id]
    "Load a PO by id; returns {:ok po-map}, {:ok nil}, or {:error ...}"))
;; => CORRECT: only the identity is needed — the adapter knows where to look
;; => The datasource config is a constructor argument of the adapter, not a port arg

;; ── Adapter: the datasource is captured at construction time ──────────────
;; [F#: let buildPostgresRepo (connectionString: string) — closed over via closure]
(defn build-postgres-repo
  ;; datasource-config is closed over — not visible to the application layer
  [datasource-config]
  (reify PurchaseOrderRepository
    (save-po [_ po]
      ;; datasource-config is in scope via closure — adapter concern, not port concern
      (println "[PG] INSERT INTO purchase_orders VALUES" (:id po) (:total-amount po))
      ;; => Real: execute INSERT via next.jdbc — datasource-config used here only
      {:ok nil})
    ;; => Returns {:ok nil} on success — the PO identity is already in the input map
    (load-po [_ po-id]
      (println "[PG] SELECT * FROM purchase_orders WHERE id =" po-id)
      ;; => Real: execute SELECT via next.jdbc; return {:ok nil} if no rows
      {:ok nil})))
;; => Simplified: always returns {:ok nil}; real adapter queries Postgres

(println "Minimal protocol: connection management is the adapter's responsibility, not the port's")
;; => Output: Minimal protocol: connection management is the adapter's responsibility, not the port's
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── OVER-SPECIFIED port (wrong) ───────────────────────────────────────────
// The save function carries database-specific parameters.
// The application service must now know connection pools and transaction handles.
type OverSpecifiedRepo = {
  save: (connectionString: string, txHandle: unknown, po: unknown) => Promise;
  // => WRONG: connectionString and txHandle are adapter concerns
  // => Application layer now knows about databases — zone violation
};
// => The application layer is now coupled to SQL-specific infrastructure

// ── MINIMAL port (correct) ────────────────────────────────────────────────
// Connection management is the adapter's responsibility — not visible here.
interface PurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Domain type — no infrastructure fields

type RepoError = { readonly kind: "DatabaseError"; readonly message: string } | { readonly kind: "ConnectionTimeout" };
// => Named error type — canonical for all PurchaseOrderRepo ports

type PurchaseOrderRepo = {
  // => Minimal: the application service needs exactly these two operations
  readonly save: (po: PurchaseOrder) => Promise;
  // => CORRECT: no connection string, no transaction — adapter manages those internally
  readonly findById: (id: string) => Promise;
  // => CORRECT: only the identity is needed — the adapter knows where to look
};
// => The connection string is a constructor parameter of the adapter, not a port parameter

// ── Adapter: the connection string is captured at construction time ────────
const buildPostgresRepo = (connectionString: string): PurchaseOrderRepo => ({
  // => connectionString is closed over — not visible to the application layer
  save: async (po) => {
    // pg Pool and INSERT logic lives here — connectionString in scope via closure
    console.log(`[PG] INSERT INTO purchase_orders VALUES (${po.id}, ${po.totalAmount})`);
    // => Real: execute INSERT with pg Pool — connectionString is in scope
    return { ok: true };
    // => Returns void equivalent on success — the PO identity is already in the input
  },
  findById: async (id) => {
    console.log(`[PG] SELECT * FROM purchase_orders WHERE id = ${id}`);
    // => Real: execute SELECT with pg Pool; return null if no rows
    return { ok: true, value: null };
    // => Simplified: always returns null; real adapter queries Postgres
  },
});

console.log("Minimal port: connection management is the adapter's responsibility, not the port's");
// => Output: Minimal port: connection management is the adapter's responsibility, not the port's
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── OVER-SPECIFIED port (wrong) ───────────────────────────────────────────
-- The save function carries database-specific parameters.
-- The application service must now know connection strings and transaction handles.
-- data OverSpecifiedRepository = OverSpecifiedRepository
--   { saveBad :: Text -> SomeTxHandle -> PurchaseOrder -> IO (Either Text ()) }
-- => WRONG: connection string and tx handle are adapter concerns
-- => Application layer now knows about databases — zone violation
-- [F#: same anti-pattern — Haskell shows it via commented type declaration]

module Procurement.Application.PortMinimal where

import Data.Text (Text)
import qualified Data.Text as T

-- ── MINIMAL port (correct) ────────────────────────────────────────────────
-- Connection management is the adapter's responsibility — not visible here.
data PurchaseOrder = PurchaseOrder { poId :: Text, poTotal :: Double } deriving (Show)
-- => Domain type — no infrastructure fields

data RepoError = DatabaseError Text | ConnectionTimeout deriving (Show)
-- => Named errors — canonical for all PurchaseOrderRepository ports

data PurchaseOrderRepository = PurchaseOrderRepository
  -- => Minimal: the application service needs exactly these two operations
  { savePO :: PurchaseOrder -> IO (Either RepoError ())
  -- => CORRECT: no connection string, no tx — adapter manages those internally
  , loadPO :: Text -> IO (Either RepoError (Maybe PurchaseOrder))
  -- => CORRECT: only the identity is needed — the adapter knows where to look
  }
-- => The connection string is closed over by the adapter, not on the port signature

-- ── Adapter: the connection string is captured at construction time ────────
buildPostgresRepo :: Text -> PurchaseOrderRepository
-- => connStr is closed over — not visible to the application layer
buildPostgresRepo connStr = PurchaseOrderRepository
  { savePO = \po -> do
      -- import Database.PostgreSQL.Simple — this is where infra lives
      putStrLn ("[PG] INSERT INTO purchase_orders id=" <> T.unpack (poId po))
      -- => Real: execute INSERT with postgresql-simple; connStr in scope via closure
      _ <- pure connStr  -- closure use marker for the reader
      pure (Right ())
      -- => Returns () on success — the PO identity is already in the input
  , loadPO = \i -> do
      putStrLn ("[PG] SELECT * FROM purchase_orders WHERE id = " <> T.unpack i)
      -- => Real: execute SELECT; return Nothing if no rows
      pure (Right Nothing)
      -- => Simplified: always returns Nothing; real adapter queries Postgres
  }

main :: IO ()
main = putStrLn "Minimal port: connection management is the adapter's responsibility, not the port's"
-- => Output: Minimal port: connection management is the adapter's responsibility, not the port's
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: Port signatures must contain only the domain concepts the application service needs — infrastructure parameters like connection strings belong inside the adapter, captured in a closure.

**Why It Matters**: Over-specified ports are a subtle but costly mistake. Once connection management parameters appear in the port signature, every test must supply them, and every application service must thread them through its logic. The port is no longer an abstraction — it is a thin wrapper around the infrastructure. Closures solve this cleanly in both F# and Clojure: the adapter captures the connection details at construction time, and the port signature remains infrastructure-free forever.

---

### Example 10: Output Port — Async vs Sync Signatures

Ports that perform I/O use `Async<Result<_,_>>`. Ports that are logically instantaneous (clock, ID generation) use synchronous signatures. Mixing these up leads to unnecessary async overhead or missed error-handling.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── Rule: I/O-bound ports return Async<Result<_,_>> ──────────────────────
// The database can fail and the call is I/O-bound — both reasons for async+Result.
type PurchaseOrder = { Id: string; TotalAmount: decimal; Status: string }
// => Domain aggregate — same type referenced by both ports below

// [Clojure: defprotocol with save-po/load-po returning {:ok ...}/{:error ...} maps — futures for async]
type PurchaseOrderRepository = {
    save: PurchaseOrder -> Async<Result<unit, string>>
    // => CORRECT: async because disk write; Result because write can fail
    load: string        -> Async<Result<PurchaseOrder option, string>>
    // => CORRECT: async because network read; Result because read can fail
}

// ── Rule: logically-instantaneous ports return the value directly ──────────
// The clock never fails and the call is CPU-bound — neither reason for async+Result.
// [Clojure: (fn [] (java.time.Instant/now)) — same zero-arg fn shape, no async wrapper]
type Clock = unit -> System.DateTimeOffset
// => CORRECT: no async (no I/O); no Result (no failure mode for reading time)
// => Simplifies every call site: let now = clock ()  — no let!, no match

// [Clojure: (fn [] (str (java.util.UUID/randomUUID))) — same zero-arg fn shape]
type IdGenerator = unit -> string
// => CORRECT: generating a UUID is synchronous and infallible
// => Wrapping it in Async<Result<_,_>> would be purely ceremonial overhead

// ── WRONG: over-wrapping the clock ───────────────────────────────────────
// type BadClock = unit -> Async<Result<System.DateTimeOffset, string>>
// => This forces every call site to do: let! now = clock ()
// => and then: match now with Ok t -> ... | Error _ -> ...
// => Both are meaningless ceremony — the clock cannot fail

// ── Demonstration: call-site simplicity ──────────────────────────────────
let buildPO (clock: Clock) (gen: IdGenerator) (supplierId: string) (amount: decimal) =
    // => Both synchronous ports: no async, no Result at call site
    let id  = gen ()
    // => id : string — immediate UUID, no await needed
    let now = clock ()
    // => now : DateTimeOffset — immediate timestamp, no await needed
    { Id = sprintf "po_%s" id; TotalAmount = amount; Status = "Draft" }
    // => PO constructed synchronously — supplierId and timestamp available instantly

printfn "Sync ports for instantaneous operations; Async<Result<_,_>> for I/O-bound ports"
// => Output: Sync ports for instantaneous operations; Async<Result<_,_>> for I/O-bound ports
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── Rule: I/O-bound ports use futures or core.async channels ─────────────
;; The database can fail and the call is I/O-bound — both reasons for async+result map.
;; [F#: Async<Result<_,_>> — computation expressions compose the two concerns]
;; Clojure separates concerns: futures for async execution, {:ok ...}/{:error ...} for errors

(defprotocol PurchaseOrderRepository
  (save-po [repo po]
    "Persist a PO; returns {:ok nil} or {:error {:type ... :msg ...}}")
  ;; => CORRECT: real impl returns a future<{:ok nil}> for async execution
  ;; => {:error ...} map for database failures — adapter's responsibility to produce
  (load-po [repo po-id]
    "Load a PO; returns {:ok po-map}, {:ok nil}, or {:error ...}"))
;; => CORRECT: real impl wraps in future; {:ok nil} for not-found is explicit absence

;; ── Rule: logically-instantaneous ports are plain zero-arg functions ───────
;; The clock never fails and the call is CPU-bound — no async, no error map needed.
;; [F#: type Clock = unit -> System.DateTimeOffset — same shape, synchronous]
(def clock-port
  ;; A zero-arg function returning an instant — satisfies the clock port contract
  (fn [] (java.time.Instant/now)))
;; => CORRECT: no future, no {:ok ...} wrapper — call site reads: (clock-port)

;; [F#: type IdGenerator = unit -> string — same shape]
(def id-generator-port
  ;; A zero-arg function returning a UUID string — synchronous and infallible
  (fn [] (str (java.util.UUID/randomUUID))))
;; => CORRECT: generating a UUID is synchronous and infallible
;; => Wrapping in future and {:ok ...} would be purely ceremonial overhead

;; ── WRONG: over-wrapping the clock ───────────────────────────────────────
;; (def bad-clock (fn [] (future {:ok (java.time.Instant/now)})))
;; => This forces every call site to do: @(bad-clock) then (:ok result)
;; => Both are meaningless ceremony — the clock cannot fail and is not I/O-bound

;; ── Demonstration: call-site simplicity ──────────────────────────────────
(defn build-po
  ;; clock-fn and id-fn are synchronous port functions — no deref, no error check
  [clock-fn id-fn supplier-id amount]
  (let [id  (id-fn)
        ;; => id: string — immediate UUID, no deref needed
        now (clock-fn)]
        ;; => now: Instant — immediate timestamp, no deref needed
    {:id (str "po_" id) :total-amount amount :status "Draft"}))
    ;; => PO constructed synchronously — supplier-id and timestamp available instantly

(println "Sync ports for instantaneous ops; future+result-map for I/O-bound ports")
;; => Output: Sync ports for instantaneous ops; future+result-map for I/O-bound ports
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── Rule: I/O-bound ports return Promise<Result<_,_>> ───────────────────
// The database can fail and the call is I/O-bound — both reasons for async+Result.
interface PurchaseOrder {
  readonly id: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Domain aggregate — same type referenced by both ports below

type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
// => FP-style tagged union — callers must handle both branches

type PurchaseOrderRepo = {
  save: (po: PurchaseOrder) => Promise;
  // => CORRECT: Promise because disk write is I/O; Result because write can fail
  findById: (id: string) => Promise;
  // => CORRECT: Promise because network read; Result because read can fail
};

// ── Rule: logically-instantaneous ports return the value directly ──────────
// The clock never fails and the call is CPU-bound — neither reason for Promise+Result.
type Clock = () => Date;
// => CORRECT: no Promise (no I/O); no Result (no failure mode for reading time)
// => Simplifies every call site: const now = clock()  — no await, no match

type IdGenerator = () => string;
// => CORRECT: generating a UUID is synchronous and infallible
// => Wrapping in Promise<Result<_,_>> would be purely ceremonial overhead

// ── WRONG: over-wrapping the clock ───────────────────────────────────────
// type BadClock = () => Promise<Result<Date, string>>
// => This forces every call site to: const now = await clock(); then check ok
// => Both are meaningless ceremony — the clock cannot fail

// ── Demonstration: call-site simplicity ──────────────────────────────────
const buildPO =
  (clock: Clock, gen: IdGenerator) =>
  (supplierId: string, amount: number): PurchaseOrder => {
    // => Both synchronous ports: no await, no Result at call site
    const id = gen();
    // => id: string — immediate UUID, no await needed
    const now = clock();
    // => now: Date — immediate timestamp, no await needed
    return { id: `po_${id}`, totalAmount: amount, status: "Draft" };
    // => PO constructed synchronously — timestamp available as now
  };

console.log("Sync ports for instantaneous operations; Promise<Result<_,_>> for I/O-bound ports");
// => Output: Sync ports for instantaneous operations; Promise<Result<_,_>> for I/O-bound ports
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── Rule: I/O-bound ports return IO (Either e a) ─────────────────────────
-- The database can fail and the call is I/O-bound — both reasons for IO+Either.
-- [F#: Async<Result<_,_>> — Haskell uses IO (Either e a) for the same shape]

module Procurement.Application.PortShape where

import Data.Text (Text)
import Data.Time (UTCTime, getCurrentTime)
import Data.UUID (UUID)
import qualified Data.UUID.V4 as UUIDv4

data PurchaseOrder = PurchaseOrder { poId :: Text, poTotal :: Double, poStatus :: Text }
-- => Domain aggregate — same type referenced by both ports below

data PurchaseOrderRepository = PurchaseOrderRepository
  { savePO :: PurchaseOrder -> IO (Either Text ())
  -- => CORRECT: IO because disk write; Either because write can fail
  , loadPO :: Text          -> IO (Either Text (Maybe PurchaseOrder))
  -- => CORRECT: IO because network read; Either because read can fail
  }

-- ── Rule: logically-instantaneous ports use plain IO actions ──────────────
-- The clock never fails — no Either wrapper needed.
-- [F#: type Clock = unit -> System.DateTimeOffset — Haskell uses IO UTCTime]
type Clock = IO UTCTime
-- => CORRECT: IO (effects), no Either (clocks do not fail)
-- => Simplifies every call site: now <- clock  — no case-on-Either

-- [F#: type IdGenerator = unit -> string — Haskell uses IO UUID]
type IdGenerator = IO UUID
-- => CORRECT: generating a UUID is effectful but infallible
-- => Wrapping in Either would be purely ceremonial overhead

-- ── WRONG: over-wrapping the clock ───────────────────────────────────────
-- type BadClock = IO (Either Text UTCTime)
-- => This forces every call site to: result <- clock; case result of ...
-- => Both are meaningless ceremony — the clock cannot fail

-- ── Demonstration: call-site simplicity ──────────────────────────────────
buildPO :: Clock -> IdGenerator -> Text -> Double -> IO PurchaseOrder
-- => Both effectful but infallible ports: no Either at call site
buildPO clock gen _supplier amount = do
  uid <- gen
  -- => uid :: UUID — immediate UUID, no Either to unpack
  now <- clock
  -- => now :: UTCTime — immediate timestamp, no Either to unpack
  let _ = now
  pure (PurchaseOrder ("po_" <> (Data.Text.pack (show uid))) amount "Draft")
  -- => PO constructed; supplier and timestamp available without Either-handling

main :: IO ()
main = putStrLn "Sync ports for instantaneous operations; IO (Either e a) for I/O-bound ports"
-- => Output: Sync ports for instantaneous operations; IO (Either e a) for I/O-bound ports
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: Match the port signature to the failure and timing characteristics of the operation — synchronous for infallible in-process operations, async with error representation for I/O-bound fallible operations.

**Why It Matters**: Unnecessary async wrappers on synchronous ports add cognitive overhead at every call site and spread noise through application services. The reverse mistake — a synchronous signature on a database port — blocks the thread and kills throughput. The discipline of choosing the correct signature type at port definition time pays dividends every time the port is called in application services and tests.

---

### Example 11: Output Port — Error Type Design

The error type in a port's `Result` should be a discriminated union specific to that port, not a generic `exn` or `string`. Named error cases allow the application service to respond to different failures differently.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── GENERIC error (wrong) ─────────────────────────────────────────────────
// type BadRepository = { save: PurchaseOrder -> Async<Result<unit, exn>> }
// => exn leaks exception semantics into the functional type system
// => The caller cannot distinguish a timeout from a constraint violation

// ── STRING error (also wrong) ─────────────────────────────────────────────
// type BadRepository = { save: PurchaseOrder -> Async<Result<unit, string>> }
// => Better than exn, but still untyped — the caller must parse the string to branch
// => A typo in the error string is a runtime bug, not a compile error

// ── NAMED DU error (correct) ──────────────────────────────────────────────
// Domain error: named cases the application layer can match on exhaustively.
type PurchaseOrder = { Id: string; TotalAmount: decimal; Status: string }
// => Aggregate root — used in the port signatures below

// [Clojure: tagged error maps {:type :dup-key} {:type :timeout} — open extension; dispatch on :type key]
type RepoError =
    // => Discriminated union: each case is a distinct failure mode
    | DuplicateKey of string
    // => PO with this ID already exists — caller should not retry with same ID
    | ConnectionTimeout
    // => Database unreachable — caller may retry after a delay
    | ConstraintViolation of string
    // => Schema constraint failed — caller should inspect the PO for data errors
    | UnexpectedError of string
    // => Catch-all for unexpected failures — carry message for diagnostics

// [Clojure: defprotocol PurchaseOrderRepository — same two operations, error as map]
type PurchaseOrderRepository = {
    // => Port with named error type — exhaustive matching at application layer
    save: PurchaseOrder -> Async<Result<unit, RepoError>>
    load: string        -> Async<Result<PurchaseOrder option, RepoError>>
}

// ── Application service: branch on error case ────────────────────────────
let handleSaveError (repo: PurchaseOrderRepository) (po: PurchaseOrder) =
    async {
        let! result = repo.save po
        // => Delegates to the injected adapter
        return
            match result with
            | Ok ()                          -> "Saved successfully"
            // => Happy path
            | Error (DuplicateKey id)        -> sprintf "PO %s already exists" id
            // => Idempotency: PO already saved — not necessarily an error
            | Error ConnectionTimeout        -> "Retry after delay — DB unreachable"
            // => Transient failure: safe to retry
            | Error (ConstraintViolation msg)-> sprintf "Data error: %s" msg
            // => Permanent failure: the PO data has a problem
            | Error (UnexpectedError msg)    -> sprintf "Unexpected: %s" msg
            // => Catch-all: surface for diagnostics
    }

printfn "Named RepoError DU: exhaustive matching; no string parsing; compile-time completeness"
// => Output: Named RepoError DU: exhaustive matching; no string parsing; compile-time completeness
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── GENERIC error (wrong) ────────────────────────────────────────────────
;; Returning a raw Exception object leaks JVM exception semantics into functional code.
;; (save-po repo po) => {:error #<Exception ...>}
;; => The caller cannot distinguish a timeout from a constraint violation
;; => Inspecting a Java exception object is fragile and non-REPL-friendly

;; ── STRING error (also wrong) ────────────────────────────────────────────
;; (save-po repo po) => {:error "duplicate key violation on po_001"}
;; => Better than exception, but still untyped — caller must parse the string to branch
;; => A typo in the error string is a runtime bug, not a data-shape error

;; ── NAMED ERROR MAP (correct) ────────────────────────────────────────────
;; Clojure represents typed errors as maps with a :type dispatch key.
;; [F#: discriminated union RepoError — compiler-enforced exhaustive matching]
;; Clojure's approach is open (new :type values need no schema change) and REPL-friendly.

(defprotocol PurchaseOrderRepository
  ;; => Port with named error maps — dispatch on :type at application layer
  (save-po [repo po]
    "Persist a PO; returns {:ok nil} or {:error {:type :dup-key|:timeout|:constraint|:unexpected ...}}")
  (load-po [repo po-id]
    "Load a PO; returns {:ok po-map}, {:ok nil}, or {:error {:type ...}}"))

;; Error constructor helpers — each returns a map with a :type key
(defn dup-key-error [po-id]
  ;; PO with this ID already exists — caller should not retry with same ID
  {:type :dup-key :po-id po-id})
;; => {:type :dup-key :po-id "po_001"} — readable in REPL

(def connection-timeout-error
  ;; Database unreachable — caller may retry after a delay
  {:type :connection-timeout})
;; => {:type :connection-timeout}

(defn constraint-error [msg]
  ;; Schema constraint failed — caller should inspect the PO for data errors
  {:type :constraint :msg msg})
;; => {:type :constraint :msg "..."}

(defn unexpected-error [msg]
  ;; Catch-all for unexpected failures — carry message for diagnostics
  {:type :unexpected :msg msg})
;; => {:type :unexpected :msg "..."}

;; ── Application service: branch on :type ─────────────────────────────────
(defn handle-save-error
  ;; repo satisfies PurchaseOrderRepository — injected by the composition root
  [repo po]
  (let [result (save-po repo po)]
    ;; => Delegates to the injected adapter
    (cond
      (:ok result)
      ;; => Happy path — {:ok nil} means saved
      "Saved successfully"

      (= :dup-key (get-in result [:error :type]))
      ;; => Idempotency: PO already saved — not necessarily an error
      (str "PO " (get-in result [:error :po-id]) " already exists")

      (= :connection-timeout (get-in result [:error :type]))
      ;; => Transient failure: safe to retry
      "Retry after delay — DB unreachable"

      (= :constraint (get-in result [:error :type]))
      ;; => Permanent failure: the PO data has a problem
      (str "Data error: " (get-in result [:error :msg]))

      :else
      ;; => Catch-all: surface for diagnostics
      (str "Unexpected: " (get-in result [:error :msg])))))

(println "Named error maps: dispatch on :type; no string parsing; open extension")
;; => Output: Named error maps: dispatch on :type; no string parsing; open extension
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── GENERIC error (wrong) ─────────────────────────────────────────────────
// type BadRepo = { save: (po: unknown) => Promise<Result<void, Error>> }
// => Error leaks exception semantics into the functional type system
// => The caller cannot distinguish a timeout from a constraint violation

// ── STRING error (also wrong) ─────────────────────────────────────────────
// type BadRepo = { save: (po: unknown) => Promise<Result<void, string>> }
// => Better than Error, but still untyped — the caller must parse the string to branch
// => A typo in the error string is a runtime bug, not a compile error

// ── NAMED tagged-union error (correct) ────────────────────────────────────
interface PurchaseOrder {
  readonly id: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Aggregate root — used in the port signatures below

type RepoError =
  // => Tagged union: each case is a distinct failure mode
  | { readonly kind: "DuplicateKey"; readonly id: string }
  // => PO with this ID already exists — caller should not retry with same ID
  | { readonly kind: "ConnectionTimeout" }
  // => Database unreachable — caller may retry after a delay
  | { readonly kind: "ConstraintViolation"; readonly message: string }
  // => Schema constraint failed — caller should inspect the PO for data errors
  | { readonly kind: "UnexpectedError"; readonly message: string };
// => Catch-all for unexpected failures — carry message for diagnostics

type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
// => FP-style tagged union — exhaustive matching enforced by TypeScript

type PurchaseOrderRepo = {
  // => Port with named error type — exhaustive matching at application layer
  readonly save: (po: PurchaseOrder) => Promise;
  readonly findById: (id: string) => Promise;
};

// ── Application service: branch on error case ─────────────────────────────
const handleSaveError =
  (repo: PurchaseOrderRepo) =>
  async (po: PurchaseOrder): Promise => {
    const result = await repo.save(po);
    // => Delegates to the injected adapter
    if (result.ok) return "Saved successfully";
    // => Happy path
    switch (result.error.kind) {
      case "DuplicateKey":
        return `PO ${result.error.id} already exists`;
      // => Idempotency: PO already saved — not necessarily an error
      case "ConnectionTimeout":
        return "Retry after delay — DB unreachable";
      // => Transient failure: safe to retry
      case "ConstraintViolation":
        return `Data error: ${result.error.message}`;
      // => Permanent failure: the PO data has a problem
      case "UnexpectedError":
        return `Unexpected: ${result.error.message}`;
      // => Catch-all: surface for diagnostics
    }
  };

console.log("Named RepoError union: exhaustive matching; no string parsing; compile-time completeness");
// => Output: Named RepoError union: exhaustive matching; no string parsing; compile-time completeness
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── GENERIC error (wrong) ─────────────────────────────────────────────────
-- data BadRepository = BadRepository
--   { saveBad :: PurchaseOrder -> IO (Either SomeException ()) }
-- => SomeException leaks exception semantics into the typed system
-- => The caller cannot distinguish a timeout from a constraint violation

-- ── STRING error (also wrong) ─────────────────────────────────────────────
-- data BadRepository = BadRepository
--   { saveBad :: PurchaseOrder -> IO (Either Text ()) }
-- => Better than SomeException, but still untyped — caller must parse to branch
-- => A typo in the error message string is a runtime bug

module Procurement.Application.RepoErr where

import Data.Text (Text)

data PurchaseOrder = PurchaseOrder { poId :: Text, poTotal :: Double, poStatus :: Text }
-- => Aggregate root — used in the port signatures below

-- ── NAMED sum type (correct) ──────────────────────────────────────────────
-- [F#: discriminated union RepoError — Haskell sum type via data]
data RepoError
  -- => Sum type: each case is a distinct failure mode
  = DuplicateKey Text
  -- => PO with this ID already exists — caller should not retry with same ID
  | ConnectionTimeout
  -- => Database unreachable — caller may retry after a delay
  | ConstraintViolation Text
  -- => Schema constraint failed — caller should inspect the PO for data errors
  | UnexpectedError Text
  -- => Catch-all for unexpected failures — carry message for diagnostics
  deriving (Show, Eq)

data PurchaseOrderRepository = PurchaseOrderRepository
  -- => Port with named error type — exhaustive matching at application layer
  { savePO :: PurchaseOrder -> IO (Either RepoError ())
  , loadPO :: Text -> IO (Either RepoError (Maybe PurchaseOrder))
  }

-- ── Application service: branch on error case ────────────────────────────
handleSaveError :: PurchaseOrderRepository -> PurchaseOrder -> IO Text
handleSaveError repo po = do
  result <- savePO repo po
  -- => Delegates to the injected adapter
  pure $ case result of
    Right ()                       -> "Saved successfully"
    -- => Happy path
    Left  (DuplicateKey i)         -> "PO " <> i <> " already exists"
    -- => Idempotency: PO already saved — not necessarily an error
    Left  ConnectionTimeout        -> "Retry after delay — DB unreachable"
    -- => Transient failure: safe to retry
    Left  (ConstraintViolation m)  -> "Data error: " <> m
    -- => Permanent failure: the PO data has a problem
    Left  (UnexpectedError m)      -> "Unexpected: " <> m
    -- => Catch-all: surface for diagnostics

main :: IO ()
main = putStrLn "Named RepoError sum type: exhaustive matching; no string parsing; compile-time completeness"
-- => Output: Named RepoError sum type: exhaustive matching; no string parsing; compile-time completeness
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: Using a typed error representation at the port boundary makes all failure modes explicit, enabling the application service to respond differently to transient vs permanent failures. Every functional language shown here expresses port errors as a closed set of named variants — whether as a discriminated union, a sum type, or a tagged data map — so the service never receives an untyped exception from infrastructure.

**Why It Matters**: Generic exception or string error types force callers to parse error messages or catch exception types by name — fragile, untestable, and undiscoverable. A named set of error variants makes every failure case an explicit, documented contract: adding a new variant immediately surfaces every call site that has not yet handled it, whether the enforcement comes from a compiler exhaustiveness check or a discipline of pattern-matching on a dispatch key. For a `PurchaseOrderRepository`, the distinction between a transient timeout (safe to retry) and a duplicate-key violation (idempotency check required) directly affects business behaviour and must be expressed at the data level.

---

### Example 12: Input Port — Receiving from HTTP vs CLI vs Message Bus

The same input port type alias is satisfied by three different adapters: an HTTP handler, a CLI parser, and an event consumer. Each adapter translates its delivery-mechanism-specific input into the domain type, then calls the same port.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── Shared domain and port types ──────────────────────────────────────────
type DraftPurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal }
// => Raw input from any delivery mechanism
type SubmittedPO = { Id: string; Status: string }
// => Simplified output confirming submission

// [Clojure: {:type :validation :msg ...} or {:type :repo-error :msg ...} maps — open dispatch]
type SubmissionError = ValidationError of string | RepositoryError of string
// => Named errors — each delivery mechanism maps these to its own response format

// [Clojure: plain fn [draft-po] -> {:ok ...} | {:error ...} — dynamic dispatch, no type alias]
type SubmitPurchaseOrderUseCase =
    DraftPurchaseOrder -> Async<Result<SubmittedPO, SubmissionError>>
// => Input port: identical for all three adapters below

// ── Adapter 1: HTTP ───────────────────────────────────────────────────────
// The HTTP adapter receives a JSON body, maps it to the domain type, calls the port.
type HttpPoDto = { po_id: string; supplier_id: string; total_amount: float }
// => JSON shape — snake_case, float amounts (JSON limitation)

let httpAdapter (useCase: SubmitPurchaseOrderUseCase) (dto: HttpPoDto) =
    // => dto: parsed from JSON request body by the framework (ASP.NET / Giraffe)
    async {
        let draft = { Id = dto.po_id; SupplierId = dto.supplier_id
                      TotalAmount = decimal dto.total_amount }
        // => Translate: HTTP DTO → domain input type (float → decimal, snake_case → PascalCase)
        let! result = useCase draft
        // => Delegate to the port — the adapter does no business logic
        return
            match result with
            | Ok po                       -> sprintf "201 Created: %s" po.Id
            | Error (ValidationError msg) -> sprintf "422: %s" msg
            | Error (RepositoryError msg) -> sprintf "503: %s" msg
    }

// ── Adapter 2: CLI ────────────────────────────────────────────────────────
// The CLI adapter parses command-line arguments, maps to domain type, calls the port.
let cliAdapter (useCase: SubmitPurchaseOrderUseCase) (args: string array) =
    // => args: command-line arguments ["--id"; "po_001"; "--supplier"; "sup_001"; "--amount"; "1000"]
    async {
        // Simplified arg parsing — real adapter uses Argu or CommandLineParser
        let draft = { Id = args.[1]; SupplierId = args.[3]; TotalAmount = decimal args.[5] }
        // => Translate: argv → domain input type
        let! result = useCase draft
        // => Same port call — CLI and HTTP are interchangeable from the use case's view
        return
            match result with
            | Ok po                       -> printfn "PO submitted: %s" po.Id
            | Error (ValidationError msg) -> printfn "Validation error: %s" msg
            | Error (RepositoryError msg) -> printfn "Repository error: %s" msg
    }

// ── Adapter 3: Event consumer ─────────────────────────────────────────────
// The event consumer receives a Kafka message body, maps to domain type, calls the port.
type KafkaMessage = { Key: string; Payload: string }
// => Raw Kafka message — key is the PO ID, payload is a JSON string

let eventConsumerAdapter (useCase: SubmitPurchaseOrderUseCase) (msg: KafkaMessage) =
    // => msg: deserialized Kafka message from the consumer loop
    async {
        // Simplified: real adapter deserialises JSON payload with System.Text.Json
        let draft = { Id = msg.Key; SupplierId = "sup_from_payload"; TotalAmount = 750m }
        // => Translate: Kafka message → domain input type
        let! result = useCase draft
        // => Same port call — the use case is delivery-mechanism-agnostic
        return
            match result with
            | Ok _  -> printfn "PO consumed from Kafka: %s" msg.Key
            | Error e -> printfn "Consumer error: %A" e
    }

printfn "One input port type — three adapters, zero changes to the application service"
// => Output: One input port type — three adapters, zero changes to the application service
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── Shared domain and port function ──────────────────────────────────────
;; The input port is a plain function var — any fn matching the arity satisfies it.
;; [F#: type alias SubmitPurchaseOrderUseCase — a named function type]
;; Clojure uses dynamic dispatch: any fn [draft-po] -> result-map satisfies the port.

(defn submit-purchase-order-use-case
  ;; Canonical input port — receives a draft PO map, returns {:ok po} or {:error ...}
  [draft-po]
  ;; => Placeholder — composition root injects the real application service fn
  (if (empty? (:id draft-po))
    {:error {:type :validation :msg "PO id must not be blank"}}
    ;; => Validation failure: {:error {:type :validation :msg "..."}}
    {:ok {:id (:id draft-po) :status "AwaitingApproval"}}))
    ;; => Success: {:ok {:id "po_001" :status "AwaitingApproval"}}

;; ── Adapter 1: HTTP ───────────────────────────────────────────────────────
;; The HTTP adapter receives a parsed JSON map, translates to domain map, calls port fn.
;; [F#: httpAdapter receives HttpPoDto — compiler-checked field names]
(defn http-adapter
  ;; use-case-fn: the input port function — injected by the composition root
  [use-case-fn http-body]
  ;; http-body: {:po_id "po_001" :supplier_id "sup_001" :total_amount 500.0}
  (let [draft-po {:id           (:po_id http-body)
                  ;; => Translate snake_case JSON key to domain keyword
                  :supplier-id  (:supplier_id http-body)
                  ;; => Translate: HTTP DTO key → domain keyword
                  :total-amount (bigdec (:total_amount http-body))}
                  ;; => Translate: double → BigDecimal for monetary precision
        result   (use-case-fn draft-po)]
        ;; => Delegate to the port fn — no business logic in the adapter
    (cond
      (:ok result)    (str "201 Created: " (get-in result [:ok :id]))
      ;; => Happy path: return 201 with PO id
      (= :validation (get-in result [:error :type]))
      (str "422: " (get-in result [:error :msg]))
      ;; => Validation failure: 422 with the validation message
      :else           (str "503: " (get-in result [:error :msg])))))
      ;; => Infrastructure failure: 503

;; ── Adapter 2: CLI ────────────────────────────────────────────────────────
;; The CLI adapter parses command-line args, translates to domain map, calls port fn.
(defn cli-adapter
  ;; use-case-fn: same port function — CLI and HTTP share the same use-case fn
  [use-case-fn args]
  ;; args: ["--id" "po_001" "--supplier" "sup_001" "--amount" "1000"]
  (let [draft-po {:id          (nth args 1)
                  ;; => Parse positional args — real adapter uses tools.cli
                  :supplier-id (nth args 3)
                  :total-amount (bigdec (nth args 5))}
        result   (use-case-fn draft-po)]
        ;; => Same port call — CLI and HTTP are interchangeable from the use case's view
    (cond
      (:ok result)                                   (println "PO submitted:" (get-in result [:ok :id]))
      ;; => Print success message to stdout
      (= :validation (get-in result [:error :type])) (println "Validation error:" (get-in result [:error :msg]))
      :else                                          (println "Repository error:" (get-in result [:error :msg])))))
      ;; => Print error message to stdout — CLI maps errors to exit codes in real usage

;; ── Adapter 3: Event consumer ─────────────────────────────────────────────
;; The event consumer receives a Kafka message map, translates to domain map, calls port fn.
(defn event-consumer-adapter
  ;; use-case-fn: same port function — Kafka consumer and HTTP share the same fn
  [use-case-fn kafka-msg]
  ;; kafka-msg: {:key "po_001" :payload "{...json...}"}
  (let [draft-po {:id          (:key kafka-msg)
                  ;; => Kafka message key is the PO ID
                  :supplier-id "sup_from_payload"
                  ;; => Real: parse :payload JSON with cheshire/jsonista
                  :total-amount (bigdec 750)}
        result   (use-case-fn draft-po)]
        ;; => Same port call — the use case is delivery-mechanism-agnostic
    (if (:ok result)
      (println "PO consumed from Kafka:" (:key kafka-msg))
      ;; => Acknowledge offset only after successful processing
      (println "Consumer error:" (:error result)))))
      ;; => Dead-letter-queue or retry logic in the real consumer

(println "One input port fn — three adapters, zero changes to the application service")
;; => Output: One input port fn — three adapters, zero changes to the application service
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── Shared domain and port types ──────────────────────────────────────────
interface DraftPurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
}
// => Raw input from any delivery mechanism

interface SubmittedPO {
  readonly id: string;
  readonly status: string;
}
// => Simplified output confirming submission

type SubmissionError =
  | { readonly kind: "ValidationError"; readonly message: string }
  // => Named errors — each delivery mechanism maps these to its own response format
  | { readonly kind: "RepositoryError"; readonly message: string };

type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
// => FP-style tagged union — identical for all three adapters below

// Input port type alias — identical for all three adapters below
type SubmitPurchaseOrderUseCase = (draft: DraftPurchaseOrder) => Promise;
// => Input port: identical for all three adapters below

// ── Adapter 1: HTTP ───────────────────────────────────────────────────────
interface HttpPoDto {
  readonly po_id: string;
  readonly supplier_id: string;
  readonly total_amount: number;
}
// => JSON shape — snake_case, number amounts (JSON spec)

const httpAdapter =
  (useCase: SubmitPurchaseOrderUseCase) =>
  async (dto: HttpPoDto): Promise => {
    // => dto: parsed from JSON request body by the framework (Express / Fastify)
    const draft: DraftPurchaseOrder = { id: dto.po_id, supplierId: dto.supplier_id, totalAmount: dto.total_amount };
    // => Translate: HTTP DTO → domain input type (snake_case → camelCase)
    const result = await useCase(draft);
    // => Delegate to the port — the adapter does no business logic
    if (result.ok) return `201 Created: ${result.value.id}`;
    if (result.error.kind === "ValidationError") return `422: ${result.error.message}`;
    return `503: ${result.error.message}`;
  };

// ── Adapter 2: CLI ────────────────────────────────────────────────────────
const cliAdapter =
  (useCase: SubmitPurchaseOrderUseCase) =>
  async (args: string[]): Promise => {
    // => args: command-line arguments ["--id", "po_001", "--supplier", "sup_001", "--amount", "1000"]
    const draft: DraftPurchaseOrder = { id: args[1], supplierId: args[3], totalAmount: parseFloat(args[5]) };
    // => Translate: argv → domain input type
    const result = await useCase(draft);
    // => Same port call — CLI and HTTP are interchangeable from the use case's view
    if (result.ok) console.log(`PO submitted: ${result.value.id}`);
    else console.log(`Error: ${result.error.message}`);
  };

// ── Adapter 3: Event consumer ─────────────────────────────────────────────
interface KafkaMessage {
  readonly key: string;
  readonly payload: string;
}
// => Raw Kafka message — key is the PO ID, payload is a JSON string

const eventConsumerAdapter =
  (useCase: SubmitPurchaseOrderUseCase) =>
  async (msg: KafkaMessage): Promise => {
    // => msg: deserialized Kafka message from the consumer loop
    const draft: DraftPurchaseOrder = { id: msg.key, supplierId: "sup_from_payload", totalAmount: 750 };
    // => Translate: Kafka message → domain input type
    const result = await useCase(draft);
    // => Same port call — the use case is delivery-mechanism-agnostic
    if (result.ok) console.log(`PO consumed from Kafka: ${msg.key}`);
    else console.log(`Consumer error: ${result.error.message}`);
  };

console.log("One input port type — three adapters, zero changes to the application service");
// => Output: One input port type — three adapters, zero changes to the application service
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── Shared domain and port types ──────────────────────────────────────────
-- [F#: type alias for input port — Haskell uses a type synonym for the function shape]

module Procurement.Application.SubmitInPort where

import Data.Text (Text)
import qualified Data.Text as T

data DraftPurchaseOrder = DraftPurchaseOrder
  { dpoId :: Text, dpoSupp :: Text, dpoTotal :: Double } deriving (Show)
-- => Raw input from any delivery mechanism

data SubmittedPO = SubmittedPO { spoId :: Text, spoStatus :: Text } deriving (Show)
-- => Simplified output confirming submission

data SubmissionError
  = ValidationError Text
  | RepositoryError Text
  deriving (Show)
-- => Named errors — each delivery mechanism maps these to its own response format

type SubmitPurchaseOrderUseCase =
  DraftPurchaseOrder -> IO (Either SubmissionError SubmittedPO)
-- => Input port: identical for all three adapters below

-- ── Adapter 1: HTTP ───────────────────────────────────────────────────────
-- The HTTP adapter receives a parsed JSON record, maps it to the domain type.
data HttpPoDto = HttpPoDto { hPoId :: Text, hSupp :: Text, hTotal :: Double }
-- => JSON shape modelled with vendor-style field names (snake_case in real JSON)

httpAdapter :: SubmitPurchaseOrderUseCase -> HttpPoDto -> IO Text
httpAdapter useCase dto = do
  -- => dto: parsed from JSON request body by the framework (Servant / WAI)
  let draft = DraftPurchaseOrder (hPoId dto) (hSupp dto) (hTotal dto)
  -- => Translate: HTTP DTO → domain input type
  result <- useCase draft
  -- => Delegate to the port — the adapter does no business logic
  pure $ case result of
    Right po                       -> "201 Created: " <> spoId po
    Left  (ValidationError msg)    -> "422: " <> msg
    Left  (RepositoryError msg)    -> "503: " <> msg

-- ── Adapter 2: CLI ────────────────────────────────────────────────────────
-- The CLI adapter parses command-line arguments, maps to the domain type.
cliAdapter :: SubmitPurchaseOrderUseCase -> [Text] -> IO ()
cliAdapter useCase args = do
  -- => args: e.g. ["--id", "po_001", "--supplier", "sup_001", "--amount", "1000"]
  let draft = DraftPurchaseOrder (args !! 1) (args !! 3) (read (T.unpack (args !! 5)))
  -- => Translate: argv → domain input type
  result <- useCase draft
  -- => Same port call — CLI and HTTP are interchangeable from the use case's view
  case result of
    Right po                    -> putStrLn ("PO submitted: " <> T.unpack (spoId po))
    Left  (ValidationError m)   -> putStrLn ("Validation error: " <> T.unpack m)
    Left  (RepositoryError m)   -> putStrLn ("Repository error: " <> T.unpack m)

-- ── Adapter 3: Event consumer ─────────────────────────────────────────────
data KafkaMessage = KafkaMessage { kKey :: Text, kPayload :: Text }
-- => Raw Kafka message — key is the PO ID, payload is a JSON string

eventConsumerAdapter :: SubmitPurchaseOrderUseCase -> KafkaMessage -> IO ()
eventConsumerAdapter useCase msg = do
  -- => msg: deserialized Kafka message from the consumer loop
  let draft = DraftPurchaseOrder (kKey msg) "sup_from_payload" 750
  -- => Translate: Kafka message → domain input type
  result <- useCase draft
  -- => Same port call — the use case is delivery-mechanism-agnostic
  case result of
    Right _ -> putStrLn ("PO consumed from Kafka: " <> T.unpack (kKey msg))
    Left  e -> putStrLn ("Consumer error: " <> show e)

main :: IO ()
main = putStrLn "One input port type — three adapters, zero changes to the application service"
-- => Output: One input port type — three adapters, zero changes to the application service
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: The input port decouples the application service from its delivery mechanism — HTTP, CLI, and Kafka consumers all call the same function without the service knowing which adapter is in use.

**Why It Matters**: When delivery mechanisms (REST to gRPC migration, CLI to event-driven) evolve, only the adapter changes. The application service, domain functions, and repository adapters remain untouched. This is the primary reason hexagonal architecture is sometimes called "delivery-mechanism agnostic" — the input port is the insulating layer that makes delivery mechanism changes non-events.

---

### Example 13: Composing Multiple Output Ports

An application service often needs more than one output port. Composing them as separate parameters (or as fields in a ports record) keeps each port independently testable and swappable.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
open System

// ── Port types ─────────────────────────────────────────────────────────────
type PurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal; Status: string }
// => Aggregate root — used across multiple ports

// [Clojure: {:type :db-error :msg ...} or {:type :connection-timeout} maps — open; no exhaustiveness]
type RepoError = DatabaseError of string | ConnectionTimeout
// => Named error DU — canonical error type for PurchaseOrderRepository

// [Clojure: defprotocol PurchaseOrderRepository — two methods; any reify satisfies it]
type PurchaseOrderRepository = {
    save: PurchaseOrder -> Async<Result<unit, RepoError>>
    load: string        -> Async<Result<PurchaseOrder option, RepoError>>
}
// => Persistence port — same canonical definition

// [Clojure: (fn [] (java.time.Instant/now)) — zero-arg fn; no protocol needed for one operation]
type Clock = unit -> DateTimeOffset
// => Time port — synchronous, infallible

// ── Application service with two output ports ─────────────────────────────
// Parameters: ports first, then domain inputs — idiomatic partial application
let submitPurchaseOrder
    (repo  : PurchaseOrderRepository)
    // => First output port: persistence
    (clock : Clock)
    // => Second output port: time
    (draft : { Id: string; SupplierId: string; TotalAmount: decimal }) =
    // => Domain input: the draft PO from the adapter
    async {
        // Validation — pure, no ports used
        if String.IsNullOrWhiteSpace(draft.Id) then
            return Error "PO Id must not be blank"
        // => Domain rule enforced before any I/O
        else

        // Clock port — synchronous call
        let submittedAt = clock ()
        // => Timestamp from the injected clock — deterministic in tests

        // Build the persisted PO
        let po = { Id = draft.Id; SupplierId = draft.SupplierId
                   TotalAmount = draft.TotalAmount; Status = "AwaitingApproval" }
        // => State: Draft → AwaitingApproval after valid submission

        // Repository port — async I/O call
        let! saveResult = repo.save po
        // => Persist the PO — Postgres in production, Dictionary in tests
        match saveResult with
        | Error e -> return Error (sprintf "Save failed: %A" e)
        // => Propagate named RepoError to the caller
        | Ok () ->
        printfn "[%A] PO %s submitted for approval" submittedAt po.Id
        // => Log: real adapter would use Serilog or OpenTelemetry
        return Ok po
        // => Return the submitted PO to the HTTP adapter
    }

printfn "Two output ports — independently swappable — compose in application service parameters"
// => Output: Two output ports — independently swappable — compose in application service parameters
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── Port protocols ───────────────────────────────────────────────────────
;; [F#: record types PurchaseOrderRepository and Clock — compiler-checked fields]
;; Clojure defines each port as a protocol; the application service receives them as args.

(defprotocol PurchaseOrderRepository
  ;; Persistence port — same canonical definition as in previous examples
  (save-po [repo po]   "Persist; returns {:ok nil} or {:error {:type ...}}")
  (load-po [repo po-id] "Load; returns {:ok po-map}, {:ok nil}, or {:error ...}"))
;; => Any reify implementing both methods satisfies PurchaseOrderRepository

;; Clock port: a zero-arg fn returning an instant — synchronous, infallible
;; [F#: type Clock = unit -> DateTimeOffset — same shape]
;; Represented as a plain function, not a protocol, because it has one operation

;; ── Application service with two output ports ─────────────────────────────
;; Parameters: ports first, then domain inputs — idiomatic partial application via fn
(defn submit-purchase-order
  ;; repo satisfies PurchaseOrderRepository — first output port: persistence
  ;; clock-fn is a zero-arg fn returning an instant — second output port: time
  [repo clock-fn draft-po]
  ;; draft-po: {:id "po_001" :supplier-id "sup_001" :total-amount 500M}
  (if (empty? (:id draft-po))
    {:error {:type :validation :msg "PO id must not be blank"}}
    ;; => Domain rule enforced before any I/O — pure check, no ports used

    (let [submitted-at (clock-fn)
          ;; => Timestamp from the injected clock fn — deterministic in tests
          po           (assoc draft-po :status "AwaitingApproval")]
          ;; => State: Draft -> AwaitingApproval after valid submission
      (let [save-result (save-po repo po)]
        ;; => Persist the PO — Postgres adapter in production, atom-backed in tests
        (if (:ok save-result)
          (do
            (println "[" submitted-at "] PO" (:id po) "submitted for approval")
            ;; => Log: real adapter would use timbre or tools.logging
            {:ok po})
            ;; => Return the submitted PO to the HTTP adapter
          {:error {:type :save-failed :cause (:error save-result)}})))))
          ;; => Propagate named error map to the caller

(println "Two output ports — independently swappable — compose in application service parameters")
;; => Output: Two output ports — independently swappable — compose in application service parameters
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── Port types ────────────────────────────────────────────────────────────
interface PurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Aggregate root — used across multiple ports

type RepoError = { readonly kind: "DatabaseError"; readonly message: string } | { readonly kind: "ConnectionTimeout" };
// => Named error type — canonical for PurchaseOrderRepo

type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
// => FP-style tagged union

type PurchaseOrderRepo = {
  readonly save: (po: PurchaseOrder) => Promise;
  readonly findById: (id: string) => Promise;
};
// => Persistence port — same canonical definition

type Clock = () => Date;
// => Time port — synchronous, infallible

// ── Application service with two output ports ──────────────────────────────
// Parameters: ports first, then domain inputs — enables partial application
const submitPurchaseOrder =
  (repo: PurchaseOrderRepo, clock: Clock) =>
  async (draft: { id: string; supplierId: string; totalAmount: number }): Promise => {
    // => Validation — pure, no ports used
    if (!draft.id || draft.id.trim() === "") return { ok: false, error: "PO Id must not be blank" };
    // => Domain rule enforced before any I/O

    // Clock port — synchronous call
    const submittedAt = clock();
    // => Timestamp from the injected clock — deterministic in tests

    // Build the persisted PO
    const po: PurchaseOrder = {
      id: draft.id,
      supplierId: draft.supplierId,
      totalAmount: draft.totalAmount,
      status: "AwaitingApproval",
    };
    // => State: Draft → AwaitingApproval after valid submission

    // Repository port — async I/O call
    const saveResult = await repo.save(po);
    // => Persist the PO — Postgres in production, Map in tests
    if (!saveResult.ok) return { ok: false, error: `Save failed: ${saveResult.error.kind}` };
    // => Propagate named RepoError to the caller
    console.log(`[${submittedAt.toISOString()}] PO ${po.id} submitted for approval`);
    // => Log: real adapter would use a structured logger
    return { ok: true, value: po };
    // => Return the submitted PO to the HTTP adapter
  };

console.log("Two output ports — independently swappable — compose in application service parameters");
// => Output: Two output ports — independently swappable — compose in application service parameters
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── Port types ─────────────────────────────────────────────────────────────
-- [F#: record types for two ports — Haskell uses two record types or a ports record]

module Procurement.Application.Compose where

import Data.Text (Text)
import Data.Time (UTCTime)

data PurchaseOrder = PurchaseOrder
  { poId :: Text, poSupplier :: Text, poTotal :: Double, poStatus :: Text }
  deriving (Show)
-- => Aggregate root — used across multiple ports

data RepoError = DatabaseError Text | ConnectionTimeout deriving (Show)
-- => Named error sum type — canonical error type for PurchaseOrderRepository

data PurchaseOrderRepository = PurchaseOrderRepository
  { savePO :: PurchaseOrder -> IO (Either RepoError ())
  , loadPO :: Text          -> IO (Either RepoError (Maybe PurchaseOrder))
  }
-- => Persistence port — same canonical definition

type Clock = IO UTCTime
-- => Time port — IO action returning UTCTime; no Either (clocks do not fail)

data Draft = Draft { dId :: Text, dSupp :: Text, dTotal :: Double }

-- ── Application service with two output ports ─────────────────────────────
-- Parameters: ports first, then domain inputs — idiomatic partial application
submitPurchaseOrder
  :: PurchaseOrderRepository  -- => First output port: persistence
  -> Clock                    -- => Second output port: time
  -> Draft                    -- => Domain input: the draft PO from the adapter
  -> IO (Either Text PurchaseOrder)
submitPurchaseOrder repo clock draft
  | dId draft == "" =
      pure (Left "PO Id must not be blank")
      -- => Domain rule enforced before any I/O
  | otherwise = do
      -- Clock port — IO action
      submittedAt <- clock
      -- => Timestamp from the injected clock — deterministic in tests
      let po = PurchaseOrder (dId draft) (dSupp draft) (dTotal draft) "AwaitingApproval"
      -- => State: Draft -> AwaitingApproval after valid submission
      -- Repository port — IO call
      saveResult <- savePO repo po
      -- => Persist the PO — Postgres in production, in-memory in tests
      case saveResult of
        Left e  -> pure (Left ("Save failed: " <> Data.Text.pack (show e)))
        -- => Propagate named RepoError to the caller
        Right () -> do
          putStrLn ("[" <> show submittedAt <> "] PO " <> Data.Text.unpack (dId draft) <> " submitted for approval")
          -- => Log: real adapter would use a structured logger (katip / co-log)
          pure (Right po)
          -- => Return the submitted PO to the HTTP adapter

main :: IO ()
main = putStrLn "Two output ports — independently swappable — compose in application service parameters"
-- => Output: Two output ports — independently swappable — compose in application service parameters
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: Multiple output ports are composed as separate function parameters — each independently injectable and independently testable. This pattern holds identically in F#, Clojure, and TypeScript; the language does not affect the composability principle.

**Why It Matters**: When all output ports are composed in one function signature, each port can be independently stubbed in tests. Replacing `repo` with an in-memory stub tests persistence logic; replacing `clock-fn` with a fixed time tests time-sensitive business rules; replacing neither tests the full production wiring. This granular control is unavailable when ports are grouped into a god-record without thinking about which service actually needs which port.

---

### Example 14: Port as a Named Record vs Curried Parameters

Two syntactic styles for injecting ports: a named record (`Ports` record) vs individual curried parameters. Each has trade-offs. Both are valid; the record style scales better to many ports.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
open System

// ── Shared types ──────────────────────────────────────────────────────────
type PurchaseOrder = { Id: string; TotalAmount: decimal; Status: string }
// => Aggregate root shared by both port styles

// [Clojure: defprotocol PurchaseOrderRepository — two methods; reify provides the impl]
type PurchaseOrderRepository = {
    save: PurchaseOrder -> Async<Result<unit, string>>
    load: string        -> Async<Result<PurchaseOrder option, string>>
}
// => Canonical repository port — same signature in both styles

// [Clojure: (fn [] (java.time.Instant/now)) — plain zero-arg fn var; no type alias needed]
type Clock = unit -> DateTimeOffset
// => Time port — synchronous

// ── Style A: curried parameters ────────────────────────────────────────────
// Individual port parameters — readable for services with 1-3 ports.
// [Clojure: (defn submit-po-individual [repo clock-fn po-id amount] ...) — same parameter ordering]
let submitPO_Curried (repo: PurchaseOrderRepository) (clock: Clock) (id: string) (amount: decimal) =
    // => Each port is a separate parameter — explicit at every call site
    async {
        let now = clock ()
        // => Clock port called with no argument
        let po  = { Id = id; TotalAmount = amount; Status = "AwaitingApproval" }
        // => Draft PO constructed before persistence
        let! _  = repo.save po
        // => Repository port called; result ignored for brevity
        return sprintf "Submitted at %A" now
        // => Returns confirmation with timestamp
    }

// Partial application: bake ports in, expose domain parameters
let productionSubmit = submitPO_Curried postgresRepo systemClock
// => productionSubmit : string -> decimal -> Async<string>
// => "ports baked in" — callers only see the domain parameters

// ── Style B: ports record ─────────────────────────────────────────────────
// Bundle ports into a named record — preferred for services with 4+ ports.
// [Clojure: {:repo postgres-repo :clock-fn system-clock} plain map — no defrecord; destructured in fn args]
type PurchasingPorts = {
    Repo  : PurchaseOrderRepository
    // => Repository port field
    Clock : Clock
    // => Clock port field
}
// => Adding a new port: add one field here, one parameter in the application service

let submitPO_Record (ports: PurchasingPorts) (id: string) (amount: decimal) =
    // => Single ports record — all dependencies in one value
    async {
        let now = ports.Clock ()
        // => Access clock via record field — named, self-documenting
        let po  = { Id = id; TotalAmount = amount; Status = "AwaitingApproval" }
        // => Construct the PO before persisting
        let! _  = ports.Repo.save po
        // => Access repository via record field
        return sprintf "Submitted at %A" now
        // => Returns confirmation with timestamp
    }

// In tests: replace any field independently
// let testPorts = { Repo = inMemRepo; Clock = fixedClock }
// => Replace Repo with an in-memory stub; keep Clock as fixed time

and postgresRepo : PurchaseOrderRepository = {
    save = fun po -> async { printfn "[PG] Saving %s" po.Id; return Ok () }
    // => Stub standing in for a real Postgres adapter
    load = fun id -> async { return Ok None }
    // => Stub: always returns None
}
and systemClock : Clock = fun () -> DateTimeOffset.UtcNow
// => Production clock: non-deterministic system time

printfn "Both styles valid — curried for few ports, record for many ports"
// => Output: Both styles valid — curried for few ports, record for many ports
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── Shared types ─────────────────────────────────────────────────────────
;; [F#: record type PurchaseOrder — named fields, compiler-checked]
;; Clojure uses plain maps throughout — no separate type declaration needed.

(defprotocol PurchaseOrderRepository
  ;; Canonical repository protocol — same in both styles
  (save-po [repo po]    "Persist; returns {:ok nil} or {:error ...}")
  (load-po [repo po-id] "Load; returns {:ok po-map}, {:ok nil}, or {:error ...}"))
;; => clock-port: any zero-arg fn returning an instant — synchronous

;; ── Style A: individual fn parameters ────────────────────────────────────
;; Individual port parameters — idiomatic for services with 1-3 ports.
;; [F#: curried parameters — partial application produces a specialised fn]
(defn submit-po-individual
  ;; repo satisfies PurchaseOrderRepository — first port parameter
  ;; clock-fn is a zero-arg fn returning an instant — second port parameter
  [repo clock-fn po-id amount]
  ;; => Each port is a separate parameter — explicit at every call site
  (let [now (clock-fn)
        ;; => Clock fn called with no argument — deterministic in tests
        po  {:id po-id :total-amount amount :status "AwaitingApproval"}]
        ;; => Draft PO map constructed before persistence
    (save-po repo po)
    ;; => Repository protocol called; result ignored for brevity
    (str "Submitted at " now)))
    ;; => Returns confirmation string with timestamp

;; Partial application via partial — bake ports in, expose domain parameters
(def production-submit
  ;; [F#: let productionSubmit = submitPO_Curried postgresRepo systemClock]
  (partial submit-po-individual postgres-repo system-clock))
;; => production-submit: fn [po-id amount] -> string
;; => "ports baked in" — callers only see the domain parameters

;; ── Style B: ports map ───────────────────────────────────────────────────
;; Bundle ports into a plain map — preferred for services with 4+ ports.
;; [F#: named record PurchasingPorts — compiler-checked field names]
;; Clojure uses a plain map with keyword keys; no defrecord needed.

;; Example ports map (constructed at composition root):
;; {:repo postgres-repo :clock-fn system-clock}
;; => Adding a new port: add one key here, one destructuring binding in the service fn

(defn submit-po-ports-map
  ;; Single ports map — all dependencies in one value
  ;; [F#: (ports: PurchasingPorts) — one record parameter]
  [{:keys [repo clock-fn]} po-id amount]
  ;; => Destructure the ports map to extract repo and clock-fn
  (let [now (clock-fn)
        ;; => Access clock via destructured key — named, self-documenting
        po  {:id po-id :total-amount amount :status "AwaitingApproval"}]
        ;; => Construct the PO map before persisting
    (save-po repo po)
    ;; => Access repository via destructured key
    (str "Submitted at " now)))
    ;; => Returns confirmation string with timestamp

;; In tests: replace any key independently
;; (submit-po-ports-map {:repo in-mem-repo :clock-fn fixed-clock} "po_001" 500M)
;; => Replace :repo with an atom-backed stub; keep :clock-fn as fixed time

(def postgres-repo
  ;; Stub standing in for a real Postgres adapter — satisfies PurchaseOrderRepository
  (reify PurchaseOrderRepository
    (save-po [_ po] (println "[PG] Saving" (:id po)) {:ok nil})
    ;; => Returns {:ok nil} on success
    (load-po [_ _]  {:ok nil})))
    ;; => Stub: always returns {:ok nil}

(def system-clock
  ;; Production clock: non-deterministic system time
  (fn [] (java.time.Instant/now)))
;; => Replace with (fn [] fixed-instant) in tests for determinism

(println "Both styles valid — individual params for few ports, map for many ports")
;; => Output: Both styles valid — individual params for few ports, map for many ports
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── Shared types ──────────────────────────────────────────────────────────
interface PurchaseOrder {
  readonly id: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Aggregate root shared by both port styles

type PurchaseOrderRepo = {
  readonly save: (po: PurchaseOrder) => Promise;
  readonly findById: (id: string) => Promise;
};
// => Canonical repository port — same signature in both styles

type Clock = () => Date;
// => Time port — synchronous

// ── Style A: individual function parameters ────────────────────────────────
// Individual port parameters — readable for services with 1-3 ports.
const submitPO_Individual =
  (repo: PurchaseOrderRepo, clock: Clock) =>
  async (id: string, amount: number): Promise => {
    // => Each port is a separate parameter — explicit at every call site
    const now = clock();
    // => Clock port called synchronously
    const po: PurchaseOrder = { id, totalAmount: amount, status: "AwaitingApproval" };
    // => Draft PO constructed before persistence
    await repo.save(po);
    // => Repository port called; result ignored for brevity
    return `Submitted at ${now.toISOString()}`;
    // => Returns confirmation with timestamp
  };

// Closure: bake ports in, expose domain parameters
const submitWithTestPorts = submitPO_Individual(
  {
    save: async (po) => {
      console.log(`[MemDB] Saving ${po.id}`);
      return { ok: true };
    },
    // => Stub standing in for a real Postgres adapter
    findById: async () => ({ ok: true, value: null }),
  },
  () => new Date("2026-01-15T09:00:00Z"),
);
// => submitWithTestPorts: (id: string, amount: number) => Promise<string>
// => "ports baked in" — callers only see the domain parameters

// ── Style B: ports record ─────────────────────────────────────────────────
// Bundle ports into a named record — preferred for services with 4+ ports.
interface PurchasingPorts {
  readonly repo: PurchaseOrderRepo;
  // => Repository port field
  readonly clock: Clock;
  // => Clock port field
}
// => Adding a new port: add one field here, one parameter in the application service

const submitPO_Record =
  (ports: PurchasingPorts) =>
  async (id: string, amount: number): Promise => {
    // => Single ports record — all dependencies in one value
    const now = ports.clock();
    // => Access clock via record field — named, self-documenting
    const po: PurchaseOrder = { id, totalAmount: amount, status: "AwaitingApproval" };
    // => Construct the PO before persisting
    await ports.repo.save(po);
    // => Access repository via record field
    return `Submitted at ${now.toISOString()}`;
    // => Returns confirmation with timestamp
  };

// In tests: replace any field independently
// const testPorts: PurchasingPorts = { repo: inMemRepo, clock: fixedClock }
// => Replace repo with an in-memory stub; keep clock as fixed time

console.log("Both styles valid — individual params for few ports, record for many ports");
// => Output: Both styles valid — individual params for few ports, record for many ports
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── Shared types ──────────────────────────────────────────────────────────
-- [F#: PurchasingPorts named record — Haskell uses a record with field accessors]

module Procurement.Application.PortStyles where

import Data.Text (Text)
import Data.Time (UTCTime, getCurrentTime)

data PurchaseOrder = PurchaseOrder { poId :: Text, poTotal :: Double, poStatus :: Text }
  deriving (Show)
-- => Aggregate root shared by both port styles

data PurchaseOrderRepository = PurchaseOrderRepository
  { savePO :: PurchaseOrder -> IO (Either Text ())
  , loadPO :: Text          -> IO (Either Text (Maybe PurchaseOrder))
  }
-- => Canonical repository port — same signature in both styles

type Clock = IO UTCTime
-- => Time port — IO action; no Either (clocks do not fail)

-- ── Style A: curried parameters ────────────────────────────────────────────
-- Individual port parameters — readable for services with 1-3 ports.
submitPOCurried :: PurchaseOrderRepository -> Clock -> Text -> Double -> IO Text
-- => Each port is a separate parameter — explicit at every call site
submitPOCurried repo clock i amount = do
  now <- clock
  -- => Clock port called as IO action
  let po = PurchaseOrder i amount "AwaitingApproval"
  -- => Draft PO constructed before persistence
  _ <- savePO repo po
  -- => Repository port called; result ignored for brevity
  pure ("Submitted at " <> Data.Text.pack (show now))
  -- => Returns confirmation with timestamp

-- Partial application: bake ports in, expose domain parameters
productionSubmit :: Text -> Double -> IO Text
productionSubmit = submitPOCurried postgresRepo systemClock
-- => productionSubmit :: Text -> Double -> IO Text
-- => "ports baked in" — callers only see the domain parameters

-- ── Style B: ports record ─────────────────────────────────────────────────
-- Bundle ports into a named record — preferred for services with 4+ ports.
data PurchasingPorts = PurchasingPorts
  { ppRepo  :: PurchaseOrderRepository
  -- => Repository port field
  , ppClock :: Clock
  -- => Clock port field
  }
-- => Adding a new port: add one field here, one accessor where needed

submitPORecord :: PurchasingPorts -> Text -> Double -> IO Text
submitPORecord ports i amount = do
  -- => Single ports record — all dependencies in one value
  now <- ppClock ports
  -- => Access clock via record accessor — named, self-documenting
  let po = PurchaseOrder i amount "AwaitingApproval"
  -- => Construct the PO before persisting
  _ <- savePO (ppRepo ports) po
  -- => Access repository via record accessor
  pure ("Submitted at " <> Data.Text.pack (show now))
  -- => Returns confirmation with timestamp

-- In tests: replace any field independently using record-update syntax
-- testPorts = PurchasingPorts { ppRepo = inMemRepo, ppClock = fixedClock }
-- => Replace ppRepo with an in-memory stub; keep ppClock as fixed time

postgresRepo :: PurchaseOrderRepository
postgresRepo = PurchaseOrderRepository
  { savePO = \po -> do putStrLn ("[PG] Saving " <> Data.Text.unpack (poId po)); pure (Right ())
  , loadPO = \_  -> pure (Right Nothing)
  }
-- => Stub standing in for a real Postgres adapter

systemClock :: Clock
systemClock = getCurrentTime
-- => Production clock: non-deterministic system time

main :: IO ()
main = putStrLn "Both styles valid — curried for few ports, record for many ports"
-- => Output: Both styles valid — curried for few ports, record for many ports
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: Individual parameters work well for 1–3 ports; a named ports record or map scales better when the application service depends on 4 or more ports. Grouping ports into a single named structure — a record, a map, or a typed object — reduces the number of function parameters to one while keeping each port addressable by name.

**Why It Matters**: Individual parameters are explicit at call sites, making dependencies visible. But when services grow to 6-8 ports, 8-parameter function signatures become unwieldy and hard to partially apply. A ports record or map solves this: one parameter, all ports, each addressable by name. The choice is a local style decision — the important invariant is that adapters remain injectable regardless of the syntax used.

---

## Adapters as Function Implementations (Examples 15–20)

### Example 15: In-Memory Adapter — Satisfying `PurchaseOrderRepository`

The in-memory adapter is the simplest possible implementation of `PurchaseOrderRepository`. It stores `PurchaseOrder` values in a `Dictionary`, returns them on `load`, and is the default test adapter for all unit and integration tests.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
open System.Collections.Generic

// ── Shared types ──────────────────────────────────────────────────────────
type PurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal; Status: string }
// => Aggregate root — the type the repository stores and retrieves

type RepoError = DatabaseError of string | ConnectionTimeout
// => Named error cases — in-memory adapter never produces ConnectionTimeout
// => but must satisfy the same error type as the Postgres adapter

type PurchaseOrderRepository = {
    save: PurchaseOrder -> Async<Result<unit, RepoError>>
    load: string        -> Async<Result<PurchaseOrder option, RepoError>>
}
// => Canonical port — the in-memory adapter satisfies this type exactly

// ── In-memory adapter ─────────────────────────────────────────────────────
// buildInMemoryRepo: factory function; each call creates an isolated store.
// Isolation matters: two tests sharing a store would pollute each other's state.
let buildInMemoryRepo () : PurchaseOrderRepository =
    // => Returns a new PurchaseOrderRepository record on each call
    let store = Dictionary<string, PurchaseOrder>()
    // => The Dictionary is closed over — visible only inside this record literal
    {
        save = fun po ->
            // => po : PurchaseOrder — the aggregate to persist
            async {
                store.[po.Id] <- po
                // => Dictionary write — no SQL, no network, no disk
                return Ok ()
                // => Always succeeds — in-memory never produces ConnectionTimeout
            }
        load = fun id ->
            // => id : string — the PO ID to look up
            async {
                match store.TryGetValue(id) with
                | true,  po -> return Ok (Some po)
                // => Found: return the PurchaseOrder wrapped in Some
                | false, _  -> return Ok None
                // => Not found: return None — not an error, just absence
            }
    }

// ── Demonstration ──────────────────────────────────────────────────────────
let repo1 = buildInMemoryRepo ()
// => repo1 : PurchaseOrderRepository — empty store; independent of repo2
let repo2 = buildInMemoryRepo ()
// => repo2 : PurchaseOrderRepository — separate empty store

let testPO = { Id = "po_test-001"; SupplierId = "sup_acme-1"; TotalAmount = 1500m; Status = "Draft" }
// => A sample PurchaseOrder for demonstration

let saveResult = repo1.save testPO |> Async.RunSynchronously
// => saveResult : Result<unit, RepoError> = Ok ()
printfn "Save: %A" saveResult
// => Output: Save: Ok ()

let loadResult = repo1.load "po_test-001" |> Async.RunSynchronously
// => loadResult : Result<PurchaseOrder option, RepoError> = Ok (Some { Id = "po_test-001"; ... })
printfn "Load: %A" loadResult
// => Output: Load: Ok (Some { Id = "po_test-001"; SupplierId = "sup_acme-1"; TotalAmount = 1500M; Status = "Draft" })

let missResult = repo2.load "po_test-001" |> Async.RunSynchronously
// => missResult : Result<PurchaseOrder option, RepoError> = Ok None
// => repo2 is a separate store — the save to repo1 did not affect it
printfn "Load (different store): %A" missResult
// => Output: Load (different store): Ok None
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── Shared domain entity and error vocabulary ─────────────────────────────
;; [F#: record type PurchaseOrder — Clojure uses a plain map; no schema required here]
;; purchase-order maps carry :id, :supplier-id, :total-amount, :status keys

;; [F#: discriminated union RepoError — Clojure uses namespaced keyword tags in error maps]
;; {:error/type :db-error :error/message "..."} or {:error/type :connection-timeout}
;; Both approaches give callers a typed dispatch point; Clojure's is open-by-default

;; ── In-memory adapter — built with a closure over an atom ────────────────
;; [F#: Dictionary closed over by a record-of-functions — Clojure uses atom for safe mutation]
;; atom provides coordinated swap/reset in a single thread; no locking required
(defn build-in-memory-repo []
  ;; Factory function — each call creates an isolated store, preventing test pollution
  (let [store (atom {})]
    ;; store is a Clojure atom holding a map of id -> purchase-order
    ;; => Each call to build-in-memory-repo produces a fresh, independent atom
    {:save (fn [po]
             ;; po — purchase-order map with :id, :supplier-id, :total-amount, :status
             (swap! store assoc (:id po) po)
             ;; => swap! atomically updates the store — no SQL, no network, no disk
             ;; => assoc returns a new map; atom holds the updated version
             {:ok true})
     ;; => Always succeeds — in-memory never produces :connection-timeout
     :load (fn [id]
             ;; id — string key to look up in the atom
             (let [po (get @store id)]
               ;; @store dereferences the atom to get the current map snapshot
               (if po
                 {:ok true :value po}
                 ;; => Found: wrap in success envelope with the purchase-order map
                 {:ok true :value nil})))}))
                 ;; => Not found: nil value — absence is not an error

;; ── Demonstration ──────────────────────────────────────────────────────────
(def repo1 (build-in-memory-repo))
;; => repo1 — independent store backed by its own atom
(def repo2 (build-in-memory-repo))
;; => repo2 — separate atom, completely isolated from repo1

(def test-po {:id "po_test-001" :supplier-id "sup_acme-1" :total-amount 1500M :status "Draft"})
;; => sample purchase-order map for the demonstration

(def save-result ((:save repo1) test-po))
;; => Calls the :save function from repo1's protocol map
;; => save-result = {:ok true}
(println "Save:" save-result)
;; => Output: Save: {:ok true}

(def load-result ((:load repo1) "po_test-001"))
;; => Looks up the PO saved above in repo1's atom
;; => load-result = {:ok true :value {:id "po_test-001" :supplier-id "sup_acme-1" ...}}
(println "Load:" load-result)
;; => Output: Load: {:ok true, :value {:id "po_test-001", :supplier-id "sup_acme-1", ...}}

(def miss-result ((:load repo2) "po_test-001"))
;; => repo2 has its own empty atom — the save to repo1 never touched it
;; => miss-result = {:ok true :value nil}
(println "Load (different store):" miss-result)
;; => Output: Load (different store): {:ok true, :value nil}
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── Shared types ──────────────────────────────────────────────────────────
interface PurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Aggregate root — the type the repository stores and retrieves

type RepoError = { readonly kind: "DatabaseError"; readonly message: string } | { readonly kind: "ConnectionTimeout" };
// => Named error cases — in-memory adapter never produces ConnectionTimeout
// => but must satisfy the same error type as the Postgres adapter

type PurchaseOrderRepo = {
  readonly save: (po: PurchaseOrder) => Promise;
  readonly findById: (id: string) => Promise;
};
// => Canonical port — the in-memory adapter satisfies this type exactly

// ── In-memory adapter ─────────────────────────────────────────────────────
// buildInMemoryRepo: factory function; each call creates an isolated store.
// Isolation matters: two tests sharing a store would pollute each other's state.
const buildInMemoryRepo = (): PurchaseOrderRepo => {
  // => Returns a new PurchaseOrderRepo object on each call
  const store = new Map<string, PurchaseOrder>();
  // => The Map is closed over — visible only inside this factory scope
  return {
    save: async (po) => {
      // => po: PurchaseOrder — the aggregate to persist
      store.set(po.id, po);
      // => Map write — no SQL, no network, no disk
      return { ok: true };
      // => Always succeeds — in-memory never produces ConnectionTimeout
    },
    findById: async (id) => {
      const po = store.get(id);
      // => Map read — O(1), deterministic
      return po !== undefined ? { ok: true, value: po } : { ok: true, value: null };
      // => Found: return the PurchaseOrder; not found: return null — not an error
    },
  };
};

// ── Demonstration ──────────────────────────────────────────────────────────
const repo1 = buildInMemoryRepo();
// => repo1: PurchaseOrderRepo — empty store; independent of repo2
const repo2 = buildInMemoryRepo();
// => repo2: PurchaseOrderRepo — separate empty store

const testPO: PurchaseOrder = { id: "po_test-001", supplierId: "sup_acme-1", totalAmount: 1500, status: "Draft" };
// => A sample PurchaseOrder for demonstration

const saveResult = await repo1.save(testPO);
// => saveResult: { ok: true }
console.log("Save:", saveResult);
// => Output: Save: { ok: true }

const loadResult = await repo1.findById("po_test-001");
// => loadResult: { ok: true, value: { id: "po_test-001", ... } }
console.log("Load:", loadResult);
// => Output: Load: { ok: true, value: { id: 'po_test-001', supplierId: 'sup_acme-1', totalAmount: 1500, status: 'Draft' } }

const missResult = await repo2.findById("po_test-001");
// => missResult: { ok: true, value: null }
// => repo2 is a separate store — the save to repo1 did not affect it
console.log("Load (different store):", missResult);
// => Output: Load (different store): { ok: true, value: null }
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── Shared types ──────────────────────────────────────────────────────────
-- [F#: Dictionary closed over by a record-of-functions — Haskell uses IORef + Map]

module Procurement.Adapters.InMemory where

import Data.Text (Text)
import qualified Data.Map.Strict as Map
import Data.Map.Strict (Map)
import Data.IORef (IORef, newIORef, atomicModifyIORef', readIORef)

data PurchaseOrder = PurchaseOrder
  { poId :: Text, poSupplier :: Text, poTotal :: Double, poStatus :: Text }
  deriving (Show, Eq)
-- => Aggregate root — the type the repository stores and retrieves

data RepoError = DatabaseError Text | ConnectionTimeout deriving (Show, Eq)
-- => Named error sum type — in-memory never produces ConnectionTimeout

data PurchaseOrderRepository = PurchaseOrderRepository
  { savePO :: PurchaseOrder -> IO (Either RepoError ())
  , loadPO :: Text          -> IO (Either RepoError (Maybe PurchaseOrder))
  }
-- => Canonical port — the in-memory adapter satisfies this type exactly

-- ── In-memory adapter ─────────────────────────────────────────────────────
-- buildInMemoryRepo: factory; each call creates an isolated store via IORef.
buildInMemoryRepo :: IO PurchaseOrderRepository
buildInMemoryRepo = do
  -- => Returns a new PurchaseOrderRepository value on each call
  store <- newIORef (Map.empty :: Map Text PurchaseOrder)
  -- => Fresh IORef per call — closed over by the record fields below
  pure PurchaseOrderRepository
    { savePO = \po -> do
        -- => po :: PurchaseOrder — the aggregate to persist
        atomicModifyIORef' store (\m -> (Map.insert (poId po) po m, ()))
        -- => Atomic write — no SQL, no network, no disk
        pure (Right ())
        -- => Always succeeds — in-memory never produces ConnectionTimeout
    , loadPO = \i -> do
        -- => i :: Text — the PO ID to look up
        m <- readIORef store
        pure (Right (Map.lookup i m))
        -- => Found: Just po; not found: Nothing — both are Right (no error)
    }

-- ── Demonstration ──────────────────────────────────────────────────────────
main :: IO ()
main = do
  repo1 <- buildInMemoryRepo
  -- => repo1 — empty store; independent of repo2
  repo2 <- buildInMemoryRepo
  -- => repo2 — separate empty store

  let testPO = PurchaseOrder "po_test-001" "sup_acme-1" 1500 "Draft"
  -- => A sample PurchaseOrder for demonstration

  saveResult <- savePO repo1 testPO
  -- => saveResult :: Either RepoError () = Right ()
  putStrLn ("Save: " <> show saveResult)
  -- => Output: Save: Right ()

  loadResult <- loadPO repo1 "po_test-001"
  -- => loadResult :: Either RepoError (Maybe PurchaseOrder) = Right (Just ...)
  putStrLn ("Load: " <> show loadResult)
  -- => Output: Load: Right (Just (PurchaseOrder {poId = "po_test-001", ...}))

  missResult <- loadPO repo2 "po_test-001"
  -- => missResult = Right Nothing — repo2 is independent of repo1
  putStrLn ("Load (different store): " <> show missResult)
  -- => Output: Load (different store): Right Nothing
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: The in-memory adapter satisfies `PurchaseOrderRepository` exactly — same type, same error cases, isolated store per test — making unit tests fast, deterministic, and infrastructure-free.

**Why It Matters**: A well-designed in-memory adapter enables tests that run in milliseconds with zero infrastructure dependencies. Every application service test uses the in-memory adapter by default; only adapter tests (verifying SQL correctness) use real Postgres. The factory function pattern (`buildInMemoryRepo ()`) ensures store isolation between tests, eliminating state pollution between test cases. This is the foundational pattern that makes hexagonal architecture's testing benefits concrete.

---

### Example 16: Primary Adapter — HTTP Handler as a Function

The HTTP handler is the primary (driving) adapter. It receives an HTTP request, translates it to a domain input type, calls the input port, and maps the result to an HTTP response. It contains zero business logic.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── Domain and port types ──────────────────────────────────────────────────
type DraftPurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal }
// => Domain input type — validated by the application service

type SubmittedPO = { Id: string; Status: string }
// => Domain output type — returned by the application service on success

type SubmissionError = ValidationError of string | RepositoryError of string
// => Named errors — each maps to a different HTTP status code

type SubmitPurchaseOrderUseCase =
    DraftPurchaseOrder -> Async<Result<SubmittedPO, SubmissionError>>
// => Input port — the HTTP adapter calls this; never implements it

// ── HTTP DTO (adapter zone only) ──────────────────────────────────────────
type HttpSubmitPoRequest  = { po_id: string; supplier_id: string; total_amount: float }
// => JSON request body shape — snake_case per REST convention, float per JSON spec
type HttpSubmitPoResponse = { po_id: string; status: string }
// => JSON response body — minimal confirmation

// ── Inbound translation: HTTP DTO → domain input ─────────────────────────
let toDomainInput (req: HttpSubmitPoRequest) : DraftPurchaseOrder =
    // => Pure mapping: JSON DTO → domain type; no validation logic here
    { Id          = req.po_id
      SupplierId  = req.supplier_id
      TotalAmount = decimal req.total_amount }
// => float → decimal conversion; naming convention alignment

// ── Outbound translation: domain output → HTTP response ──────────────────
let toHttpResponse (submitted: SubmittedPO) : HttpSubmitPoResponse =
    // => Pure mapping: domain type → JSON DTO; no business logic here
    { po_id = submitted.Id; status = submitted.Status }
// => PascalCase domain → snake_case JSON

// ── HTTP handler — the primary adapter ────────────────────────────────────
let httpHandler (useCase: SubmitPurchaseOrderUseCase) (req: HttpSubmitPoRequest) =
    // => useCase: injected input port — the handler never names the implementation
    // => req: JSON body parsed by the framework (Giraffe / ASP.NET minimal API)
    async {
        let domainInput = toDomainInput req
        // => Translate: HTTP DTO → domain input type (adapter responsibility)
        let! result = useCase domainInput
        // => Call the input port — all business logic lives here, not in the handler
        return
            match result with
            | Ok submitted ->
                let response = toHttpResponse submitted
                // => Translate: domain output → JSON response DTO
                sprintf "201 Created: %A" response
                // => Real Giraffe: json response |> setStatusCode 201
            | Error (ValidationError msg) ->
                sprintf "422 Unprocessable: %s" msg
                // => Domain validation error → HTTP 422
            | Error (RepositoryError msg) ->
                sprintf "503 Service Unavailable: %s" msg
                // => Infrastructure failure → HTTP 503
    }

// ── Demonstration ──────────────────────────────────────────────────────────
let stubUseCase : SubmitPurchaseOrderUseCase =
    // => Stub implementation — satisfies the port type alias for demonstration
    fun draft -> async { return Ok { Id = draft.Id; Status = "AwaitingApproval" } }

let request = { po_id = "po_001"; supplier_id = "sup_001"; total_amount = 2000.0 }
// => Sample HTTP request body

let response = httpHandler stubUseCase request |> Async.RunSynchronously
// => response : string = "201 Created: { po_id = \"po_001\"; status = \"AwaitingApproval\" }"
printfn "%s" response
// => Output: 201 Created: { po_id = "po_001"; status = "AwaitingApproval" }
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── Domain entity shapes (adapter zone — Clojure uses plain maps throughout) ──
;; [F#: record DraftPurchaseOrder — Clojure represents domain input as a plain map]
;; Draft maps carry :id, :supplier-id, :total-amount keys — no schema enforcement here

;; [F#: discriminated union SubmissionError — Clojure uses namespaced keyword tags in error maps]
;; {:error/type :validation-error :error/message "..."} dispatches cleanly via keyword

;; [F#: type alias SubmitPurchaseOrderUseCase — Clojure passes the function directly; no alias needed]
;; The input port is simply a function stored in the adapter map under :submit-use-case

;; ── HTTP DTO (adapter zone only) ─────────────────────────────────────────
;; HTTP request body arrives as a Clojure map — ring/compojure parses JSON automatically
;; keys are snake_case strings from JSON; adapter translates to domain keywords

;; ── Inbound translation: HTTP map → domain input map ────────────────────
(defn to-domain-input [req]
  ;; Pure transformation: HTTP DTO map → domain map; no validation logic here
  {:id          (:po_id req)
   ;; => snake_case HTTP key mapped to domain keyword
   :supplier-id (:supplier_id req)
   ;; => underscore → hyphen convention alignment
   :total-amount (bigdec (:total_amount req))})
   ;; => float from JSON coerced to BigDecimal for monetary precision

;; ── Outbound translation: domain output map → HTTP response map ──────────
(defn to-http-response [submitted]
  ;; Pure mapping: domain map → HTTP response DTO; no business logic here
  {:po_id  (:id submitted)
   ;; => domain keyword back to snake_case for JSON serialisation
   :status (:status submitted)})
   ;; => status string passes through unchanged

;; ── HTTP handler — the primary adapter ───────────────────────────────────
;; [F#: async computation expression — Clojure uses direct function calls; ring handlers are synchronous by default]
(defn http-handler [use-case req]
  ;; use-case — injected input port function; handler never names the implementation
  ;; req — HTTP request map parsed by the ring middleware stack
  (let [domain-input (to-domain-input req)
        ;; => Translate: HTTP DTO → domain input map (adapter responsibility)
        result (use-case domain-input)]
        ;; => Call the input port — all business logic lives in use-case, not here
    (condp = (:error/type result)
      nil
      ;; => No error key means success — extract and translate the value
      (let [response (to-http-response (:value result))]
        ;; => Translate: domain output → HTTP response DTO
        {:status 201 :body response})
        ;; => 201 Created with the translated response
      :validation-error
      {:status 422 :body {:error (:error/message result)}}
      ;; => Domain validation error → HTTP 422
      :repository-error
      {:status 503 :body {:error (:error/message result)}})))
      ;; => Infrastructure failure → HTTP 503

;; ── Demonstration ─────────────────────────────────────────────────────────
(defn stub-use-case [draft]
  ;; Stub implementation — satisfies the port contract for demonstration
  {:value {:id (:id draft) :status "AwaitingApproval"}})
  ;; => Returns a success envelope matching the port's expected output shape

(def request {:po_id "po_001" :supplier_id "sup_001" :total_amount 2000.0})
;; => Sample HTTP request map (as ring would parse it from JSON)

(def response (http-handler stub-use-case request))
;; => Runs the full adapter chain: translate → delegate → translate back
(println "Response:" response)
;; => Output: Response: {:status 201, :body {:po_id "po_001", :status "AwaitingApproval"}}
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── Domain and port types ──────────────────────────────────────────────────
interface DraftPurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
}
// => Domain input type — validated by the application service

interface SubmittedPO {
  readonly id: string;
  readonly status: string;
}
// => Domain output type — returned by the application service on success

type SubmissionError =
  | { readonly kind: "ValidationError"; readonly message: string }
  // => Named errors — each maps to a different HTTP status code
  | { readonly kind: "RepositoryError"; readonly message: string };

type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
// => FP-style tagged union — identical result shape for all ports

type SubmitPurchaseOrderUseCase = (draft: DraftPurchaseOrder) => Promise;
// => Input port — the HTTP adapter calls this; never implements it

// ── HTTP DTO (adapter zone only) ──────────────────────────────────────────
interface HttpSubmitPoRequest {
  readonly po_id: string;
  readonly supplier_id: string;
  readonly total_amount: number;
}
// => JSON request body shape — snake_case per REST convention
interface HttpSubmitPoResponse {
  readonly po_id: string;
  readonly status: string;
}
// => JSON response body — minimal confirmation

// ── Inbound translation: HTTP DTO → domain input ─────────────────────────
const toDomainInput = (req: HttpSubmitPoRequest): DraftPurchaseOrder => ({
  // => Pure mapping: JSON DTO → domain type; no validation logic here
  id: req.po_id,
  supplierId: req.supplier_id,
  totalAmount: req.total_amount,
  // => snake_case → camelCase naming convention alignment
});

// ── Outbound translation: domain output → HTTP response ──────────────────
const toHttpResponse = (submitted: SubmittedPO): HttpSubmitPoResponse => ({
  // => Pure mapping: domain type → JSON DTO; no business logic here
  po_id: submitted.id,
  status: submitted.status,
  // => camelCase domain → snake_case JSON
});

// ── HTTP handler — the primary adapter ────────────────────────────────────
const httpHandler =
  (useCase: SubmitPurchaseOrderUseCase) =>
  async (req: HttpSubmitPoRequest): Promise => {
    // => useCase: injected input port — the handler never names the implementation
    // => req: JSON body parsed by the framework (Express / Fastify)
    const domainInput = toDomainInput(req);
    // => Translate: HTTP DTO → domain input type (adapter responsibility)
    const result = await useCase(domainInput);
    // => Call the input port — all business logic lives here, not in the handler
    if (result.ok) {
      const response = toHttpResponse(result.value);
      // => Translate: domain output → JSON response DTO
      return `201 Created: ${JSON.stringify(response)}`;
      // => Real Express: res.status(201).json(response)
    }
    if (result.error.kind === "ValidationError") return `422 Unprocessable: ${result.error.message}`;
    // => Domain validation error → HTTP 422
    return `503 Service Unavailable: ${result.error.message}`;
    // => Infrastructure failure → HTTP 503
  };

// ── Demonstration ──────────────────────────────────────────────────────────
const stubUseCase: SubmitPurchaseOrderUseCase = async (draft) => ({
  ok: true,
  value: { id: draft.id, status: "AwaitingApproval" },
  // => Stub implementation — satisfies the port type alias for demonstration
});

const request: HttpSubmitPoRequest = { po_id: "po_001", supplier_id: "sup_001", total_amount: 2000 };
// => Sample HTTP request body

const response = await httpHandler(stubUseCase)(request);
// => response: string = '201 Created: {"po_id":"po_001","status":"AwaitingApproval"}'
console.log(response);
// => Output: 201 Created: {"po_id":"po_001","status":"AwaitingApproval"}
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── Domain and port types ──────────────────────────────────────────────────
-- [F#: HttpSubmitPoRequest record — Haskell uses a record with vendor field names]

module Procurement.Adapters.HttpHandler where

import Data.Text (Text)

data DraftPurchaseOrder = DraftPurchaseOrder
  { dpoId :: Text, dpoSupp :: Text, dpoTotal :: Double } deriving (Show)
-- => Domain input type — validated by the application service

data SubmittedPO = SubmittedPO { spoId :: Text, spoStatus :: Text } deriving (Show)
-- => Domain output type — returned by the application service on success

data SubmissionError
  = ValidationError Text
  | RepositoryError Text
  deriving (Show)
-- => Named errors — each maps to a different HTTP status code

type SubmitPurchaseOrderUseCase =
  DraftPurchaseOrder -> IO (Either SubmissionError SubmittedPO)
-- => Input port — the HTTP adapter calls this; never implements it

-- ── HTTP DTO (adapter zone only) ──────────────────────────────────────────
data HttpSubmitPoRequest = HttpSubmitPoRequest
  { reqPoId :: Text, reqSupplierId :: Text, reqTotalAmount :: Double }
-- => JSON request body shape — adapter-zone field names

data HttpSubmitPoResponse = HttpSubmitPoResponse
  { respPoId :: Text, respStatus :: Text } deriving (Show)
-- => JSON response body — minimal confirmation

-- ── Inbound translation: HTTP DTO → domain input ─────────────────────────
toDomainInput :: HttpSubmitPoRequest -> DraftPurchaseOrder
-- => Pure mapping: HTTP record → domain record; no validation logic here
toDomainInput req = DraftPurchaseOrder
  { dpoId    = reqPoId req
  , dpoSupp  = reqSupplierId req
  , dpoTotal = reqTotalAmount req
  }
-- => Field rename + identity coercion; pure function, no IO

-- ── Outbound translation: domain output → HTTP response ──────────────────
toHttpResponse :: SubmittedPO -> HttpSubmitPoResponse
-- => Pure mapping: domain record → HTTP response record
toHttpResponse s = HttpSubmitPoResponse { respPoId = spoId s, respStatus = spoStatus s }

-- ── HTTP handler — the primary adapter ────────────────────────────────────
httpHandler :: SubmitPurchaseOrderUseCase -> HttpSubmitPoRequest -> IO Text
-- => useCase: injected input port — the handler never names the implementation
httpHandler useCase req = do
  let domainInput = toDomainInput req
  -- => Translate: HTTP DTO → domain input type (adapter responsibility)
  result <- useCase domainInput
  -- => Call the input port — all business logic lives here, not in the handler
  pure $ case result of
    Right submitted ->
      let r = toHttpResponse submitted
       in "201 Created: " <> respPoId r <> " status=" <> respStatus r
      -- => Real WAI/Servant: respond with JSON body and 201 status
    Left (ValidationError m) -> "422 Unprocessable: " <> m
    -- => Domain validation error → HTTP 422
    Left (RepositoryError m) -> "503 Service Unavailable: " <> m
    -- => Infrastructure failure → HTTP 503

-- ── Demonstration ──────────────────────────────────────────────────────────
stubUseCase :: SubmitPurchaseOrderUseCase
stubUseCase draft = pure (Right (SubmittedPO (dpoId draft) "AwaitingApproval"))
-- => Stub implementation — satisfies the port type alias for demonstration

main :: IO ()
main = do
  let req = HttpSubmitPoRequest "po_001" "sup_001" 2000
  -- => Sample HTTP request body
  response <- httpHandler stubUseCase req
  -- => response :: Text = "201 Created: po_001 status=AwaitingApproval"
  putStrLn (Data.Text.unpack response)
  -- => Output: 201 Created: po_001 status=AwaitingApproval
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: The HTTP handler is a thin translation layer — it maps HTTP DTOs to domain types and back, delegates all logic to the input port, and never contains business rules.

**Why It Matters**: HTTP handlers that contain business logic are untestable without an HTTP server, slow to run in CI, and resist change when the business logic evolves. A handler that does only translation and delegation is testable by passing a stub use case, runs in microseconds, and is unaffected by changes to domain logic. The pattern is the same for all primary adapters: translate, delegate, translate back.

---

### Example 17: The Composition Root — Wiring Adapters to Ports

The composition root is the single place where adapters are named and connected to ports. Every other module sees only the port type — only the composition root sees the adapter implementations.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
open System
open System.Collections.Generic

// ── All shared types ───────────────────────────────────────────────────────
type PurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal; Status: string }
// => Aggregate root — used across domain, application, and adapters

type RepoError = DatabaseError of string | ConnectionTimeout
// => Named error DU — the port's failure vocabulary

type PurchaseOrderRepository = {
    // => Canonical port — same definition throughout all examples
    save: PurchaseOrder -> Async<Result<unit, RepoError>>
    load: string        -> Async<Result<PurchaseOrder option, RepoError>>
}

type Clock = unit -> DateTimeOffset
// => Time port — synchronous, infallible

type DraftPurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal }
// => Raw input from the HTTP layer — not yet validated

// ── Application service (application zone) ────────────────────────────────
// The application service knows only about port types — not adapter names.
let submitPurchaseOrder (repo: PurchaseOrderRepository) (clock: Clock) (draft: DraftPurchaseOrder) =
    // => Parameterised by ports — injected at the composition root
    async {
        if String.IsNullOrWhiteSpace(draft.Id) then
            return Error "PO Id must not be blank"
        // => Domain rule: invalid ID rejected before any I/O
        else
        let now = clock ()
        // => Timestamp from the injected Clock port
        let po = { Id = draft.Id; SupplierId = draft.SupplierId
                   TotalAmount = draft.TotalAmount; Status = "AwaitingApproval" }
        // => State: Draft → AwaitingApproval
        let! saveResult = repo.save po
        // => Port call: persist via injected adapter
        return
            match saveResult with
            | Ok ()    -> Ok po
            | Error e  -> Error (sprintf "Save failed: %A" e)
    }

// ── Adapter implementations (adapters zone) ───────────────────────────────
// In-memory adapter — used in tests
let buildInMemoryRepo () : PurchaseOrderRepository =
    let store = Dictionary<string, PurchaseOrder>()
    // => Isolated dictionary per call — each test gets its own store
    { save = fun po -> async { store.[po.Id] <- po; return Ok () }
      load = fun id -> async {
          match store.TryGetValue(id) with
          | true, po -> return Ok (Some po)
          | _        -> return Ok None } }

// System clock adapter — used in production
let systemClock : Clock = fun () -> DateTimeOffset.UtcNow
// => Reads the real wall clock — non-deterministic

// Fixed clock adapter — used in tests
let fixedClock : Clock = fun () -> DateTimeOffset(2026, 1, 15, 9, 0, 0, TimeSpan.Zero)
// => Always returns the same timestamp — deterministic

// ── Composition root — the ONLY place that names adapters ─────────────────
// Production wiring:
let productionSubmit = submitPurchaseOrder (buildInMemoryRepo ()) systemClock
// => productionSubmit : DraftPurchaseOrder -> Async<Result<PurchaseOrder, string>>
// => In real code: replace buildInMemoryRepo() with buildPostgresRepo connectionString

// Test wiring:
let testSubmit = submitPurchaseOrder (buildInMemoryRepo ()) fixedClock
// => testSubmit : DraftPurchaseOrder -> Async<Result<PurchaseOrder, string>>
// => Identical type; only the injected adapters differ

// ── Demonstration ──────────────────────────────────────────────────────────
let draft = { Id = "po_001"; SupplierId = "sup_acme-1"; TotalAmount = 5000m }
// => Sample draft PO from the HTTP adapter

let result = testSubmit draft |> Async.RunSynchronously
// => Uses in-memory adapter and fixed clock — fully deterministic
printfn "Test result: %A" result
// => Output: Test result: Ok { Id = "po_001"; SupplierId = "sup_acme-1"; TotalAmount = 5000M; Status = "AwaitingApproval" }
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── All shared domain and port concepts ──────────────────────────────────
;; [F#: record PurchaseOrder — Clojure uses a plain map; keys are domain keywords]
;; purchase-order maps carry :id, :supplier-id, :total-amount, :status keys

;; [F#: discriminated union RepoError — Clojure tags error maps with :error/type keyword]
;; {:error/type :db-error :error/message "..."} or {:error/type :connection-timeout}

;; [F#: record-of-functions PurchaseOrderRepository — Clojure represents the port as a map of fns]
;; The protocol map {:save fn :load fn} is the idiomatic Clojure port shape

;; [F#: type alias Clock = unit -> DateTimeOffset — Clojure uses a zero-arg function directly]
;; No type alias needed; the convention is documented and enforced by usage

;; ── Application service (application zone) ────────────────────────────────
;; [F#: partial application bakes in ports — Clojure closes over them via let + partial]
(defn submit-purchase-order [repo clock draft]
  ;; repo — port map {:save fn :load fn}; clock — zero-arg fn returning an instant
  ;; draft — map with :id :supplier-id :total-amount from the HTTP adapter
  (when (clojure.string/blank? (:id draft))
    (throw (ex-info "PO Id must not be blank" {:error/type :validation-error})))
  ;; => Domain rule: blank ID rejected before any I/O — same guard as F# version
  (let [now (clock)
        ;; => Timestamp from the injected clock function
        po (assoc draft :status "AwaitingApproval")
        ;; => assoc returns a new map — immutable update; Draft → AwaitingApproval
        save-result ((:save repo) po)]
        ;; => Port call: persist via injected adapter function
    (if (:ok save-result)
      {:ok true :value po}
      ;; => Success: return the saved purchase-order map
      {:error/type :repo-error :error/message (str "Save failed: " (:error/message save-result))})))
      ;; => Failure: propagate the error envelope from the adapter

;; ── Adapter implementations (adapters zone) ───────────────────────────────
;; In-memory adapter — used in tests
(defn build-in-memory-repo []
  ;; Each call returns an isolated protocol map backed by a fresh atom
  (let [store (atom {})]
    ;; => Isolated atom per call — two test repos never share state
    {:save (fn [po]
             (swap! store assoc (:id po) po)
             ;; => Atomically inserts the PO map under its :id key
             {:ok true})
     ;; => Always succeeds — no infrastructure to fail
     :load (fn [id]
             {:ok true :value (get @store id)})}))
             ;; => get returns nil when missing — absence is not an error

;; System clock adapter — used in production
(def system-clock #(java.time.Instant/now))
;; => Reads the real wall clock — non-deterministic; wrap in #() to defer evaluation

;; Fixed clock adapter — used in tests
(def fixed-clock (constantly (java.time.Instant/parse "2026-01-15T09:00:00Z")))
;; => constantly returns a function that always produces the same value — deterministic
;; => [F#: fun () -> DateTimeOffset(2026,1,15,...) — Clojure uses constantly for the same idiom]

;; ── Composition root — the ONLY place that names adapters ─────────────────
;; Production wiring:
(def production-submit
  (partial submit-purchase-order (build-in-memory-repo) system-clock))
;; => production-submit — function awaiting only the draft map
;; => In real code: replace build-in-memory-repo with build-postgres-repo

;; Test wiring:
(def test-submit
  (partial submit-purchase-order (build-in-memory-repo) fixed-clock))
;; => test-submit — identical arity to production-submit; only adapters differ
;; => partial is the Clojure equivalent of F# partial application for DI

;; ── Demonstration ─────────────────────────────────────────────────────────
(def draft {:id "po_001" :supplier-id "sup_acme-1" :total-amount 5000M})
;; => Sample draft PO arriving from the HTTP adapter

(def result (test-submit draft))
;; => Uses in-memory adapter and fixed clock — fully deterministic
(println "Test result:" result)
;; => Output: Test result: {:ok true, :value {:id "po_001", :supplier-id "sup_acme-1", :total-amount 5000M, :status "AwaitingApproval"}}
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── All shared types ───────────────────────────────────────────────────────
interface PurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Aggregate root — used across domain, application, and adapters

type RepoError = { readonly kind: "DatabaseError"; readonly message: string } | { readonly kind: "ConnectionTimeout" };
// => Named error — the port's failure vocabulary

type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
// => FP-style tagged union — used by all port return types

type PurchaseOrderRepo = {
  readonly save: (po: PurchaseOrder) => Promise;
  readonly findById: (id: string) => Promise;
};
// => Canonical port — same definition throughout all examples

type Clock = () => Date;
// => Time port — synchronous, infallible

interface DraftPurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
}
// => Raw input from the HTTP layer — not yet validated

// ── Application service (application zone) ────────────────────────────────
const submitPurchaseOrder =
  (repo: PurchaseOrderRepo, clock: Clock) =>
  async (draft: DraftPurchaseOrder): Promise => {
    if (!draft.id || draft.id.trim() === "") return { ok: false, error: "PO Id must not be blank" };
    // => Domain rule: invalid ID rejected before any I/O
    const now = clock();
    // => Timestamp from the injected Clock port
    const po: PurchaseOrder = {
      id: draft.id,
      supplierId: draft.supplierId,
      totalAmount: draft.totalAmount,
      status: "AwaitingApproval",
    };
    // => State: Draft → AwaitingApproval
    const saveResult = await repo.save(po);
    // => Port call: persist via injected adapter
    if (!saveResult.ok) return { ok: false, error: `Save failed: ${saveResult.error.kind}` };
    return { ok: true, value: po };
  };

// ── Adapter implementations (adapters zone) ───────────────────────────────
const buildInMemoryRepo = (): PurchaseOrderRepo => {
  const store = new Map<string, PurchaseOrder>();
  // => Isolated Map per call — each test gets its own store
  return {
    save: async (po) => {
      store.set(po.id, po);
      return { ok: true };
    },
    findById: async (id) => {
      const po = store.get(id);
      return { ok: true, value: po ?? null };
    },
  };
};

const systemClock: Clock = () => new Date();
// => Reads the real wall clock — non-deterministic

const fixedClock: Clock = () => new Date("2026-01-15T09:00:00Z");
// => Always returns the same timestamp — deterministic

// ── Composition root — the ONLY place that names adapters ─────────────────
const productionSubmit = submitPurchaseOrder(buildInMemoryRepo(), systemClock);
// => productionSubmit: (draft: DraftPurchaseOrder) => Promise<Result<PurchaseOrder, string>>
// => In real code: replace buildInMemoryRepo() with buildPostgresRepo(connectionString)

const testSubmit = submitPurchaseOrder(buildInMemoryRepo(), fixedClock);
// => testSubmit: identical type; only the injected adapters differ

// ── Demonstration ──────────────────────────────────────────────────────────
const draft: DraftPurchaseOrder = { id: "po_001", supplierId: "sup_acme-1", totalAmount: 5000 };
// => Sample draft PO from the HTTP adapter

const result = await testSubmit(draft);
// => Uses in-memory adapter and fixed clock — fully deterministic
console.log("Test result:", result);
// => Output: Test result: { ok: true, value: { id: 'po_001', supplierId: 'sup_acme-1', totalAmount: 5000, status: 'AwaitingApproval' } }
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── All shared types ───────────────────────────────────────────────────────
-- [F#: composition root with partial application — Haskell uses higher-order functions]

module Procurement.Adapters.Composition where

import Data.Text (Text)
import qualified Data.Text as T
import Data.Time (UTCTime)
import Data.Time.Format.ISO8601 (iso8601ParseM)
import qualified Data.Map.Strict as Map
import Data.IORef (newIORef, atomicModifyIORef', readIORef)

data PurchaseOrder = PurchaseOrder
  { poId :: Text, poSupplier :: Text, poTotal :: Double, poStatus :: Text }
  deriving (Show)

data RepoError = DatabaseError Text | ConnectionTimeout deriving (Show)

data PurchaseOrderRepository = PurchaseOrderRepository
  { savePO :: PurchaseOrder -> IO (Either RepoError ())
  , loadPO :: Text          -> IO (Either RepoError (Maybe PurchaseOrder))
  }
-- => Canonical port — same definition throughout all examples

type Clock = IO UTCTime
-- => Time port — IO action; no Either (clocks do not fail)

data Draft = Draft { dId :: Text, dSupp :: Text, dTotal :: Double }
-- => Raw input from the HTTP layer — not yet validated

-- ── Application service (application zone) ────────────────────────────────
-- The application service knows only port types — not adapter names.
submitPurchaseOrder
  :: PurchaseOrderRepository -> Clock -> Draft -> IO (Either Text PurchaseOrder)
submitPurchaseOrder repo clock draft
  | T.null (T.strip (dId draft)) = pure (Left "PO Id must not be blank")
  -- => Domain rule: invalid ID rejected before any I/O
  | otherwise = do
      now <- clock
      -- => Timestamp from the injected Clock port
      let _ = now
      let po = PurchaseOrder (dId draft) (dSupp draft) (dTotal draft) "AwaitingApproval"
      -- => State: Draft -> AwaitingApproval
      saveResult <- savePO repo po
      -- => Port call: persist via injected adapter
      pure $ case saveResult of
        Right () -> Right po
        Left  e  -> Left ("Save failed: " <> T.pack (show e))

-- ── Adapter implementations (adapters zone) ───────────────────────────────
-- In-memory adapter — used in tests
buildInMemoryRepo :: IO PurchaseOrderRepository
buildInMemoryRepo = do
  store <- newIORef Map.empty
  -- => Isolated IORef per call — each test gets its own store
  pure PurchaseOrderRepository
    { savePO = \po -> do
        atomicModifyIORef' store (\m -> (Map.insert (poId po) po m, ()))
        pure (Right ())
    , loadPO = \i -> do
        m <- readIORef store
        pure (Right (Map.lookup i m))
    }

-- Fixed clock adapter — used in tests
fixedClock :: Clock
fixedClock = case iso8601ParseM "2026-01-15T09:00:00Z" of
  Just t  -> pure t
  Nothing -> error "unreachable: literal"
-- => Always returns the same timestamp — deterministic

-- ── Composition root — the ONLY place that names adapters ─────────────────
-- Test wiring:
buildTestSubmit :: IO (Draft -> IO (Either Text PurchaseOrder))
buildTestSubmit = do
  repo <- buildInMemoryRepo
  -- => One-line swap: replace with real Postgres builder in production
  pure (submitPurchaseOrder repo fixedClock)
-- => Returns a function awaiting only the draft — ports baked in

-- ── Demonstration ──────────────────────────────────────────────────────────
main :: IO ()
main = do
  testSubmit <- buildTestSubmit
  let draft = Draft "po_001" "sup_acme-1" 5000
  -- => Sample draft PO from the HTTP adapter
  result <- testSubmit draft
  -- => Uses in-memory adapter and fixed clock — fully deterministic
  putStrLn ("Test result: " <> show result)
  -- => Output: Test result: Right (PurchaseOrder {poId = "po_001", ..., poStatus = "AwaitingApproval"})
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: The composition root is the single file that knows adapter names — every other module sees only port types, making adapter swaps a one-line change in one file.

**Why It Matters**: When adapter names are scattered across application services (via direct import or open statements), swapping an adapter requires finding and modifying every file that references it. The composition root pattern centralises this knowledge: one file, one change. In production services using this pattern, the composition root is the startup entry point — it wires all adapters at startup and passes them through the call chain via partial application or function parameters.

---

### Example 18: Spy Adapter — Verifying Port Calls in Tests

A spy adapter records the calls made to it, enabling tests to assert not only the return value but also the exact sequence and arguments of port calls.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
open System.Collections.Generic

// ── Port types ─────────────────────────────────────────────────────────────
type PurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal; Status: string }
// => Aggregate root — the type saved and loaded via the port

type PurchaseOrderRepository = {
    save: PurchaseOrder -> Async<Result<unit, string>>
    load: string        -> Async<Result<PurchaseOrder option, string>>
}
// => Canonical port — spy adapter must satisfy this exact type

// ── Spy adapter ────────────────────────────────────────────────────────────
// The spy records every call for test assertions.
type RepositorySpy = {
    Repo      : PurchaseOrderRepository
    // => The spy exposes the port — application service receives this field
    SavedPos  : ResizeArray<PurchaseOrder>
    // => Accumulates every PO passed to save — assert on this in tests
    LoadedIds : ResizeArray<string>
    // => Accumulates every ID passed to load — assert call order
}

let buildRepositorySpy () : RepositorySpy =
    // => Factory: each call creates an isolated spy with empty call records
    let savedPos  = ResizeArray<PurchaseOrder>()
    let loadedIds = ResizeArray<string>()
    // => Closed over by the functions below — visible only in this scope
    { Repo = {
          save = fun po ->
              async {
                  savedPos.Add(po)
                  // => Record the call argument BEFORE returning
                  return Ok ()
                  // => Always succeeds — spy never simulates failure unless needed
              }
          load = fun id ->
              async {
                  loadedIds.Add(id)
                  // => Record the ID looked up
                  return Ok None
                  // => Returns None by default — override in specific tests
              }
      }
      SavedPos  = savedPos
      LoadedIds = loadedIds }

// ── Application service under test ────────────────────────────────────────
let submitAndSave (repo: PurchaseOrderRepository) (id: string) (supplierId: string) (amount: decimal) =
    // => Application service: validates, builds PO, calls save
    async {
        if System.String.IsNullOrWhiteSpace(id) then return Error "blank id"
        // => Validation before any I/O
        else
        let po = { Id = id; SupplierId = supplierId; TotalAmount = amount; Status = "AwaitingApproval" }
        // => Build the PO aggregate
        let! saveResult = repo.save po
        // => Port call — spy records this
        return saveResult |> Result.map (fun () -> po)
        // => Return the PO on success
    }

// ── Test assertions using the spy ─────────────────────────────────────────
let spy = buildRepositorySpy ()
// => Fresh spy — empty call records

let result = submitAndSave spy.Repo "po_spy-001" "sup_001" 800m |> Async.RunSynchronously
// => Runs the application service with the spy adapter

printfn "Result: %A" result
// => Output: Result: Ok { Id = "po_spy-001"; SupplierId = "sup_001"; TotalAmount = 800M; Status = "AwaitingApproval" }

printfn "save called %d time(s)" spy.SavedPos.Count
// => Output: save called 1 time(s)
printfn "Saved PO id: %s" spy.SavedPos.[0].Id
// => Output: Saved PO id: po_spy-001
printfn "load called %d time(s)" spy.LoadedIds.Count
// => Output: load called 0 time(s)  (submitAndSave does not call load)
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── Port shape (Clojure protocol map) ────────────────────────────────────
;; [F#: record-of-functions PurchaseOrderRepository — Clojure uses a map of functions]
;; {:save fn :load fn} is the idiomatic Clojure port shape used throughout these examples

;; ── Spy adapter — closure over atoms for call recording ──────────────────
;; [F#: ResizeArray closed over by record fields — Clojure uses atoms holding vectors]
;; Atoms let tests read the accumulated call log after the service call completes
(defn build-repository-spy []
  ;; Factory: each call creates an isolated spy with empty call-record atoms
  (let [saved-pos  (atom [])
        ;; => atom holding a vector of every PO map passed to :save
        loaded-ids (atom [])]
        ;; => atom holding a vector of every id string passed to :load
    {:repo {:save (fn [po]
                    (swap! saved-pos conj po)
                    ;; => conj appends the PO to the vector — records the argument
                    {:ok true})
                    ;; => Always succeeds — spy never simulates failure unless needed
            :load (fn [id]
                    (swap! loaded-ids conj id)
                    ;; => conj appends the id string to the loaded-ids vector
                    {:ok true :value nil})}
                    ;; => Returns nil by default — override in tests that need a value
     :saved-pos  saved-pos
     ;; => Expose the atom so tests can deref and assert on call arguments
     :loaded-ids loaded-ids}))
     ;; => Expose the atom so tests can assert on load call count and arguments

;; ── Application service under test ────────────────────────────────────────
(defn submit-and-save [repo id supplier-id amount]
  ;; Application service: validates, builds PO map, calls :save port
  (when (clojure.string/blank? id)
    (throw (ex-info "blank id" {:error/type :validation-error})))
  ;; => Validation runs before any port call — same guard as F# version
  (let [po {:id id :supplier-id supplier-id :total-amount amount :status "AwaitingApproval"}
        ;; => Build the purchase-order map — immutable, no mutation
        save-result ((:save repo) po)]
        ;; => Port call — spy records this argument via swap!
    (if (:ok save-result)
      {:ok true :value po}
      ;; => Return the PO map on success
      {:error/type :repo-error})))
      ;; => Propagate failure on error (not reached with spy's always-ok adapter)

;; ── Test assertions using the spy ─────────────────────────────────────────
(def spy (build-repository-spy))
;; => Fresh spy — empty call-record atoms

(def result (submit-and-save (:repo spy) "po_spy-001" "sup_001" 800M))
;; => Runs the application service with the spy's port map

(println "Result:" result)
;; => Output: Result: {:ok true, :value {:id "po_spy-001", :supplier-id "sup_001", :total-amount 800M, :status "AwaitingApproval"}}

(println "save called" (count @(:saved-pos spy)) "time(s)")
;; => @(:saved-pos spy) dereferences the atom; count measures accumulated calls
;; => Output: save called 1 time(s)

(println "Saved PO id:" (:id (first @(:saved-pos spy))))
;; => first retrieves the first recorded PO map; :id extracts its identifier
;; => Output: Saved PO id: po_spy-001

(println "load called" (count @(:loaded-ids spy)) "time(s)")
;; => submit-and-save never calls :load; the atom remains empty
;; => Output: load called 0 time(s)
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── Port types ─────────────────────────────────────────────────────────────
interface PurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Aggregate root — the type saved and loaded via the port

type PurchaseOrderRepo = {
  readonly save: (po: PurchaseOrder) => Promise;
  readonly findById: (id: string) => Promise;
};
// => Canonical port — spy adapter must satisfy this exact type

// ── Spy adapter ────────────────────────────────────────────────────────────
interface RepositorySpy {
  readonly repo: PurchaseOrderRepo;
  // => The spy exposes the port — application service receives this field
  readonly savedPos: PurchaseOrder[];
  // => Accumulates every PO passed to save — assert on this in tests
  readonly loadedIds: string[];
  // => Accumulates every ID passed to findById — assert call order
}

const buildRepositorySpy = (): RepositorySpy => {
  // => Factory: each call creates an isolated spy with empty call records
  const savedPos: PurchaseOrder[] = [];
  const loadedIds: string[] = [];
  // => Closed over by the functions below — visible only in this scope
  return {
    repo: {
      save: async (po) => {
        savedPos.push(po);
        // => Record the call argument BEFORE returning
        return { ok: true };
        // => Always succeeds — spy never simulates failure unless needed
      },
      findById: async (id) => {
        loadedIds.push(id);
        // => Record the ID looked up
        return { ok: true, value: null };
        // => Returns null by default — override in specific tests
      },
    },
    savedPos,
    loadedIds,
  };
};

// ── Application service under test ────────────────────────────────────────
const submitAndSave =
  (repo: PurchaseOrderRepo) =>
  async (id: string, supplierId: string, amount: number): Promise => {
    // => Application service: validates, builds PO, calls save
    if (!id || id.trim() === "") return { ok: false, error: "blank id" };
    // => Validation before any I/O
    const po: PurchaseOrder = { id, supplierId, totalAmount: amount, status: "AwaitingApproval" };
    // => Build the PO aggregate
    const saveResult = await repo.save(po);
    // => Port call — spy records this
    if (!saveResult.ok) return { ok: false, error: saveResult.error };
    return { ok: true, value: po };
    // => Return the PO on success
  };

// ── Test assertions using the spy ─────────────────────────────────────────
const spy = buildRepositorySpy();
// => Fresh spy — empty call records

const result = await submitAndSave(spy.repo)("po_spy-001", "sup_001", 800);
// => Runs the application service with the spy adapter

console.log("Result:", result);
// => Output: Result: { ok: true, value: { id: 'po_spy-001', supplierId: 'sup_001', totalAmount: 800, status: 'AwaitingApproval' } }

console.log(`save called ${spy.savedPos.length} time(s)`);
// => Output: save called 1 time(s)
console.log("Saved PO id:", spy.savedPos[0].id);
// => Output: Saved PO id: po_spy-001
console.log(`findById called ${spy.loadedIds.length} time(s)`);
// => Output: findById called 0 time(s)  (submitAndSave does not call findById)
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── Port types ─────────────────────────────────────────────────────────────
-- [F#: ResizeArray closed over by record fields — Haskell uses IORef [a] or IORef Vector]

module Procurement.Adapters.Spy where

import Data.Text (Text)
import qualified Data.Text as T
import Data.IORef (IORef, newIORef, atomicModifyIORef', readIORef)

data PurchaseOrder = PurchaseOrder
  { poId :: Text, poSupplier :: Text, poTotal :: Double, poStatus :: Text }
  deriving (Show)
-- => Aggregate root — the type saved and loaded via the port

data PurchaseOrderRepository = PurchaseOrderRepository
  { savePO :: PurchaseOrder -> IO (Either Text ())
  , loadPO :: Text          -> IO (Either Text (Maybe PurchaseOrder))
  }
-- => Canonical port — spy adapter must satisfy this exact type

-- ── Spy adapter ────────────────────────────────────────────────────────────
data RepositorySpy = RepositorySpy
  { spyRepo      :: PurchaseOrderRepository
  -- => The spy exposes the port — application service receives this field
  , spySaved     :: IORef [PurchaseOrder]
  -- => Accumulates every PO passed to save — assert on this in tests
  , spyLoaded    :: IORef [Text]
  -- => Accumulates every ID passed to load — assert call order
  }

buildRepositorySpy :: IO RepositorySpy
buildRepositorySpy = do
  -- => Factory: each call creates an isolated spy with empty IORefs
  saved  <- newIORef []
  loaded <- newIORef []
  -- => Closed over by the functions below — visible only in this scope
  pure RepositorySpy
    { spyRepo = PurchaseOrderRepository
        { savePO = \po -> do
            atomicModifyIORef' saved (\xs -> (xs ++ [po], ()))
            -- => Record the call argument BEFORE returning
            pure (Right ())
            -- => Always succeeds — spy never simulates failure unless needed
        , loadPO = \i -> do
            atomicModifyIORef' loaded (\xs -> (xs ++ [i], ()))
            -- => Record the ID looked up
            pure (Right Nothing)
            -- => Returns Nothing by default — override in specific tests
        }
    , spySaved  = saved
    , spyLoaded = loaded
    }

-- ── Application service under test ────────────────────────────────────────
submitAndSave :: PurchaseOrderRepository -> Text -> Text -> Double
              -> IO (Either Text PurchaseOrder)
submitAndSave repo i supp amount
  | T.null (T.strip i) = pure (Left "blank id")
  -- => Validation before any I/O
  | otherwise = do
      let po = PurchaseOrder i supp amount "AwaitingApproval"
      -- => Build the PO aggregate
      saveResult <- savePO repo po
      -- => Port call — spy records this
      pure (fmap (const po) saveResult)
      -- => Return the PO on success

-- ── Test assertions using the spy ─────────────────────────────────────────
main :: IO ()
main = do
  spy <- buildRepositorySpy
  -- => Fresh spy — empty call records

  result <- submitAndSave (spyRepo spy) "po_spy-001" "sup_001" 800
  -- => Runs the application service with the spy adapter
  putStrLn ("Result: " <> show result)
  -- => Output: Result: Right (PurchaseOrder {poId = "po_spy-001", ...})

  savedList <- readIORef (spySaved spy)
  putStrLn ("save called " <> show (length savedList) <> " time(s)")
  -- => Output: save called 1 time(s)
  putStrLn ("Saved PO id: " <> T.unpack (poId (head savedList)))
  -- => Output: Saved PO id: po_spy-001
  loadedList <- readIORef (spyLoaded spy)
  putStrLn ("load called " <> show (length loadedList) <> " time(s)")
  -- => Output: load called 0 time(s)  (submitAndSave does not call load)
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: A spy adapter records port calls for test assertions, enabling verification that the application service invokes ports with the correct arguments in the correct order.

**Why It Matters**: Return-value-only assertions miss a class of bugs where the application service skips a port call entirely (for example, saving without notifying, or notifying without saving). Spy adapters make call-sequence verification as easy as reading a list. In procurement workflows where the sequence of side effects (save → notify → publish) determines business correctness, spy adapters are the primary tool for verifying that the sequence contract is honoured.

---

### Example 19: Failing Adapter — Testing Error Paths

A failing adapter always returns `Error`, enabling tests to verify that the application service handles infrastructure failures correctly and propagates errors to the caller.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── Port types ─────────────────────────────────────────────────────────────
type PurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal; Status: string }
// => Aggregate root

type RepoError = DatabaseError of string | ConnectionTimeout
// => Named error cases the application service must handle

type PurchaseOrderRepository = {
    save: PurchaseOrder -> Async<Result<unit, RepoError>>
    load: string        -> Async<Result<PurchaseOrder option, RepoError>>
}
// => Canonical port — same definition throughout all examples

// ── Failing adapter — always returns Error ────────────────────────────────
let alwaysFailRepo (errorCase: RepoError) : PurchaseOrderRepository = {
    // => Parameterised by the error to return — different tests use different errors
    save = fun _po ->
        async { return Error errorCase }
        // => Always fails — never persists anything
    load = fun _id ->
        async { return Error errorCase }
        // => Always fails — never returns data
}

// ── Application service under test ────────────────────────────────────────
let submitPOWithErrorHandling (repo: PurchaseOrderRepository) (id: string) (amount: decimal) =
    // => Application service: must gracefully handle repository failure
    async {
        if System.String.IsNullOrWhiteSpace(id) then
            return Error "Validation: blank PO Id"
        // => Validation runs before any I/O — no port call on invalid input
        else
        let po = { Id = id; SupplierId = "sup_001"; TotalAmount = amount; Status = "AwaitingApproval" }
        // => PO ready for persistence
        let! saveResult = repo.save po
        // => Port call — failing adapter returns Error here
        return
            match saveResult with
            | Ok ()                          -> Ok (sprintf "Saved: %s" po.Id)
            // => Happy path — not reached with failing adapter
            | Error (DatabaseError msg)      -> Error (sprintf "DB error: %s" msg)
            // => Permanent failure: surface for the HTTP adapter to return 500
            | Error ConnectionTimeout        -> Error "Timeout: retry later"
            // => Transient failure: surface for the HTTP adapter to return 503
    }

// ── Test: database error path ──────────────────────────────────────────────
let dbErrorRepo = alwaysFailRepo (DatabaseError "constraint violation on purchase_orders")
// => Adapter that always returns a DatabaseError
let dbErrorResult = submitPOWithErrorHandling dbErrorRepo "po_001" 1000m |> Async.RunSynchronously
// => Application service receives Error (DatabaseError ...)
printfn "DB error result: %A" dbErrorResult
// => Output: DB error result: Error "DB error: constraint violation on purchase_orders"

// ── Test: timeout path ────────────────────────────────────────────────────
let timeoutRepo = alwaysFailRepo ConnectionTimeout
// => Adapter that always returns a ConnectionTimeout
let timeoutResult = submitPOWithErrorHandling timeoutRepo "po_002" 500m |> Async.RunSynchronously
// => Application service receives Error ConnectionTimeout
printfn "Timeout result: %A" timeoutResult
// => Output: Timeout result: Error "Timeout: retry later"
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── Port shape ───────────────────────────────────────────────────────────
;; [F#: discriminated union RepoError with DatabaseError/ConnectionTimeout cases]
;; Clojure represents error variants as namespaced keyword tags in error maps
;; {:error/type :db-error :error/message "..."} or {:error/type :connection-timeout}
;; [F#: record-of-functions PurchaseOrderRepository — Clojure uses a plain map of fns]

;; ── Failing adapter — always returns an error map ─────────────────────────
;; [F#: parameterised by a RepoError DU case — Clojure parameterises by an error map]
(defn always-fail-repo [error-map]
  ;; error-map — the specific error envelope to return on every call
  ;; e.g. {:error/type :db-error :error/message "constraint violation"}
  {:save (fn [_po]
           error-map)
           ;; => Always returns the configured error — never persists anything
   :load (fn [_id]
           error-map)})
           ;; => Always returns the configured error — never returns data

;; ── Application service under test ────────────────────────────────────────
(defn submit-po-with-error-handling [repo id amount]
  ;; Application service: must gracefully handle repository failure variants
  (when (clojure.string/blank? id)
    (throw (ex-info "Validation: blank PO Id" {:error/type :validation-error})))
  ;; => Validation runs before any port call — same guard as F# version
  (let [po {:id id :supplier-id "sup_001" :total-amount amount :status "AwaitingApproval"}
        ;; => PO map built before any I/O
        save-result ((:save repo) po)]
        ;; => Port call — failing adapter returns the configured error map here
    (condp = (:error/type save-result)
      nil
      {:ok true :value (str "Saved: " (:id po))}
      ;; => Happy path: no :error/type means success
      :db-error
      {:error/type :repo-error :error/message (str "DB error: " (:error/message save-result))}
      ;; => Permanent failure: surface for the HTTP adapter to return 500
      :connection-timeout
      {:error/type :repo-error :error/message "Timeout: retry later"})))
      ;; => Transient failure: surface for the HTTP adapter to return 503

;; ── Test: database error path ─────────────────────────────────────────────
(def db-error-repo
  (always-fail-repo {:error/type :db-error
                     :error/message "constraint violation on purchase_orders"}))
;; => Adapter configured to always return a :db-error envelope

(def db-error-result (submit-po-with-error-handling db-error-repo "po_001" 1000M))
;; => Application service receives the :db-error envelope from the adapter
(println "DB error result:" db-error-result)
;; => Output: DB error result: {:error/type :repo-error, :error/message "DB error: constraint violation on purchase_orders"}

;; ── Test: timeout path ────────────────────────────────────────────────────
(def timeout-repo
  (always-fail-repo {:error/type :connection-timeout}))
;; => Adapter configured to always return a :connection-timeout envelope

(def timeout-result (submit-po-with-error-handling timeout-repo "po_002" 500M))
;; => Application service receives the :connection-timeout envelope
(println "Timeout result:" timeout-result)
;; => Output: Timeout result: {:error/type :repo-error, :error/message "Timeout: retry later"}
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── Port types ─────────────────────────────────────────────────────────────
interface PurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Aggregate root

type RepoError =
  | { readonly kind: "DatabaseError"; readonly message: string }
  // => Named error cases the application service must handle
  | { readonly kind: "ConnectionTimeout" };

type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
// => FP-style tagged union

type PurchaseOrderRepo = {
  readonly save: (po: PurchaseOrder) => Promise;
  readonly findById: (id: string) => Promise;
};
// => Canonical port — same definition throughout all examples

// ── Failing adapter — always returns error ────────────────────────────────
const alwaysFailRepo = (errorCase: RepoError): PurchaseOrderRepo => ({
  // => Parameterised by the error to return — different tests use different errors
  save: async (_po) => ({ ok: false, error: errorCase }),
  // => Always fails — never persists anything
  findById: async (_id) => ({ ok: false, error: errorCase }),
  // => Always fails — never returns data
});

// ── Application service under test ────────────────────────────────────────
const submitPOWithErrorHandling =
  (repo: PurchaseOrderRepo) =>
  async (id: string, amount: number): Promise => {
    // => Application service: must gracefully handle repository failure
    if (!id || id.trim() === "") return { ok: false, error: "Validation: blank PO Id" };
    // => Validation runs before any I/O — no port call on invalid input
    const po: PurchaseOrder = { id, supplierId: "sup_001", totalAmount: amount, status: "AwaitingApproval" };
    // => PO ready for persistence
    const saveResult = await repo.save(po);
    // => Port call — failing adapter returns error here
    if (saveResult.ok) return { ok: true, value: `Saved: ${po.id}` };
    // => Happy path — not reached with failing adapter
    if (saveResult.error.kind === "DatabaseError") return { ok: false, error: `DB error: ${saveResult.error.message}` };
    // => Permanent failure: surface for the HTTP adapter to return 500
    return { ok: false, error: "Timeout: retry later" };
    // => Transient failure: surface for the HTTP adapter to return 503
  };

// ── Test: database error path ──────────────────────────────────────────────
const dbErrorRepo = alwaysFailRepo({ kind: "DatabaseError", message: "constraint violation on purchase_orders" });
// => Adapter that always returns a DatabaseError
const dbErrorResult = await submitPOWithErrorHandling(dbErrorRepo)("po_001", 1000);
// => Application service receives error { kind: "DatabaseError", ... }
console.log("DB error result:", dbErrorResult);
// => Output: DB error result: { ok: false, error: 'DB error: constraint violation on purchase_orders' }

// ── Test: timeout path ────────────────────────────────────────────────────
const timeoutRepo = alwaysFailRepo({ kind: "ConnectionTimeout" });
// => Adapter that always returns a ConnectionTimeout
const timeoutResult = await submitPOWithErrorHandling(timeoutRepo)("po_002", 500);
// => Application service receives error { kind: "ConnectionTimeout" }
console.log("Timeout result:", timeoutResult);
// => Output: Timeout result: { ok: false, error: 'Timeout: retry later' }
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── Port types ─────────────────────────────────────────────────────────────
-- [F#: parameterised failing adapter — Haskell uses a builder closing over RepoError]

module Procurement.Adapters.Failing where

import Data.Text (Text)
import qualified Data.Text as T

data PurchaseOrder = PurchaseOrder
  { poId :: Text, poSupplier :: Text, poTotal :: Double, poStatus :: Text }
  deriving (Show)
-- => Aggregate root

data RepoError
  = DatabaseError Text
  | ConnectionTimeout
  deriving (Show, Eq)
-- => Named error cases the application service must handle

data PurchaseOrderRepository = PurchaseOrderRepository
  { savePO :: PurchaseOrder -> IO (Either RepoError ())
  , loadPO :: Text          -> IO (Either RepoError (Maybe PurchaseOrder))
  }
-- => Canonical port — same definition throughout all examples

-- ── Failing adapter — always returns Left ─────────────────────────────────
alwaysFailRepo :: RepoError -> PurchaseOrderRepository
-- => Parameterised by the error to return — different tests use different errors
alwaysFailRepo e = PurchaseOrderRepository
  { savePO = \_  -> pure (Left e)
  -- => Always fails — never persists anything
  , loadPO = \_  -> pure (Left e)
  -- => Always fails — never returns data
  }

-- ── Application service under test ────────────────────────────────────────
submitPOWithErrorHandling
  :: PurchaseOrderRepository -> Text -> Double -> IO (Either Text Text)
submitPOWithErrorHandling repo i amount
  | T.null (T.strip i) = pure (Left "Validation: blank PO Id")
  -- => Validation runs before any I/O — no port call on invalid input
  | otherwise = do
      let po = PurchaseOrder i "sup_001" amount "AwaitingApproval"
      -- => PO ready for persistence
      saveResult <- savePO repo po
      -- => Port call — failing adapter returns Left here
      pure $ case saveResult of
        Right ()                        -> Right ("Saved: " <> poId po)
        -- => Happy path — not reached with failing adapter
        Left (DatabaseError msg)        -> Left ("DB error: " <> msg)
        -- => Permanent failure: surface for the HTTP adapter to return 500
        Left ConnectionTimeout          -> Left "Timeout: retry later"
        -- => Transient failure: surface for the HTTP adapter to return 503

-- ── Test: database error path ──────────────────────────────────────────────
main :: IO ()
main = do
  let dbErrorRepo = alwaysFailRepo (DatabaseError "constraint violation on purchase_orders")
  -- => Adapter that always returns a DatabaseError
  dbErrorResult <- submitPOWithErrorHandling dbErrorRepo "po_001" 1000
  -- => Application service receives Left (DatabaseError ...)
  putStrLn ("DB error result: " <> show dbErrorResult)
  -- => Output: DB error result: Left "DB error: constraint violation on purchase_orders"

  -- ── Test: timeout path ──────────────────────────────────────────────────
  let timeoutRepo = alwaysFailRepo ConnectionTimeout
  -- => Adapter that always returns ConnectionTimeout
  timeoutResult <- submitPOWithErrorHandling timeoutRepo "po_002" 500
  -- => Application service receives Left ConnectionTimeout
  putStrLn ("Timeout result: " <> show timeoutResult)
  -- => Output: Timeout result: Left "Timeout: retry later"
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: Failing adapters enable targeted testing of every error branch in the application service without modifying any production code or spinning up infrastructure.

**Why It Matters**: Error paths in application services are the most under-tested code in most systems. Spinning up a real Postgres instance and manually inducing failures is fragile and slow. A failing adapter is a two-line record literal that produces a specific error case on demand. Every named error case in `RepoError` should have a corresponding failing adapter test, verifying that the application service handles it correctly. This discipline ensures that infrastructure failures produce the correct HTTP status codes and user-facing messages.

---

### Example 20: Partial Application as Dependency Injection

Partial application is a native mechanism in functional languages for baking dependencies into a function. It eliminates the need for DI containers, reflection, and registration boilerplate while producing the same substitutability as constructor injection in OOP.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
open System

// ── Port types ─────────────────────────────────────────────────────────────
type PurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal; Status: string }
// => Aggregate root — used across all adapter and application types

type PurchaseOrderRepository = {
    save: PurchaseOrder -> Async<Result<unit, string>>
    load: string        -> Async<Result<PurchaseOrder option, string>>
}
// => Canonical port — satisfied by any record with matching save/load fields

type Clock = unit -> DateTimeOffset
// => Time port — synchronous

// ── Application service: ports as first parameters ────────────────────────
// Convention: ports come before domain inputs — enables partial application.
let submitPurchaseOrder
    (repo  : PurchaseOrderRepository)
    // => Repo port: first parameter → can be baked in
    (clock : Clock)
    // => Clock port: second parameter → can be baked in
    (id    : string)
    // => Domain input: PO identifier — provided at runtime by the HTTP adapter
    (amount: decimal) =
    // => Domain input: amount — provided at runtime
    async {
        let now = clock ()
        // => Timestamp from the baked-in clock adapter
        let po = { Id = id; SupplierId = "sup_001"; TotalAmount = amount
                   Status = "AwaitingApproval" }
        // => Build PO aggregate with the runtime domain inputs
        let! _ = repo.save po
        // => Persist via the baked-in repository adapter
        return Ok (sprintf "PO %s submitted at %A" id now)
        // => Return confirmation to the HTTP adapter
    }

// ── In-memory adapters for demonstration ──────────────────────────────────
let inMemRepo : PurchaseOrderRepository = {
    save = fun po -> async { printfn "[MemDB] Saving %s" po.Id; return Ok () }
    // => In-memory: prints to demonstrate the call without real infrastructure
    load = fun id -> async { return Ok None }
    // => In-memory: always returns None for this demonstration
}
let fixedClock : Clock = fun () -> DateTimeOffset(2026, 1, 15, 9, 0, 0, TimeSpan.Zero)
// => Fixed time — deterministic in tests

// ── Partial application: bake in the ports ────────────────────────────────
let submitWithTestPorts = submitPurchaseOrder inMemRepo fixedClock
// => submitWithTestPorts : string -> decimal -> Async<Result<string, exn>>
// => The port parameters are baked in; only domain inputs remain
// => This is DI without a container — just function application

// ── Call site: only domain inputs needed ──────────────────────────────────
let result = submitWithTestPorts "po_001" 3500m |> Async.RunSynchronously
// => Calls submitPurchaseOrder with inMemRepo, fixedClock, "po_001", 3500m
// => submitWithTestPorts is a first-class function — passable, storable, composable
printfn "Result: %A" result
// => Output: [MemDB] Saving po_001
// => Output: Result: Ok "PO po_001 submitted at 2026-01-15 09:00:00 +00:00"

// ── Swap to production ports — one line change ────────────────────────────
// let submitWithProductionPorts = submitPurchaseOrder postgresRepo systemClock
// => One-line swap: different adapters, same application service function
// => No DI container to configure, no XML or attributes to update
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── Port shapes ──────────────────────────────────────────────────────────
;; [F#: record PurchaseOrderRepository — Clojure uses a plain map of functions]
;; [F#: type alias Clock = unit -> DateTimeOffset — Clojure passes the fn directly]
;; No type aliases needed; convention is enforced by the call sites that use them

;; ── Application service: ports as first args — enables partial application ──
;; [F#: partial application via currying — Clojure achieves the same with partial]
;; Convention: port args precede domain inputs so partial can bake them in
(defn submit-purchase-order [repo clock id amount]
  ;; repo — port map {:save fn :load fn}; clock — zero-arg fn returning an instant
  ;; id, amount — domain inputs provided at runtime by the HTTP adapter
  (let [now (clock)
        ;; => Timestamp from the baked-in clock function
        po {:id id :supplier-id "sup_001" :total-amount amount :status "AwaitingApproval"}
        ;; => Build purchase-order map with the runtime domain inputs
        _ ((:save repo) po)]
        ;; => Persist via the baked-in repository adapter
    {:ok true :value (str "PO " id " submitted at " now)}))
    ;; => Return confirmation string wrapped in a success envelope

;; ── In-memory adapters for demonstration ─────────────────────────────────
(def in-mem-repo
  {:save (fn [po]
           (println "[MemDB] Saving" (:id po))
           ;; => Prints to demonstrate the call without real infrastructure
           {:ok true})
   :load (fn [_id]
           {:ok true :value nil})})
           ;; => Always returns nil — no real storage in this demo

(def fixed-clock
  (constantly (java.time.Instant/parse "2026-01-15T09:00:00Z")))
;; => constantly returns a function that always produces the same instant
;; => [F#: fun () -> DateTimeOffset(2026,1,15,...) — constantly is the Clojure equivalent]

;; ── Partial application: bake in the ports ────────────────────────────────
;; [F#: let submitWithTestPorts = submitPurchaseOrder inMemRepo fixedClock]
;; Clojure uses partial to bake the first N args into a new function
(def submit-with-test-ports
  (partial submit-purchase-order in-mem-repo fixed-clock))
;; => submit-with-test-ports — a new fn waiting only for id and amount
;; => The port args are baked in; only domain inputs remain — DI without a container

;; ── Call site: only domain inputs needed ──────────────────────────────────
(def result (submit-with-test-ports "po_001" 3500M))
;; => Calls submit-purchase-order with in-mem-repo, fixed-clock, "po_001", 3500M
;; => submit-with-test-ports is a first-class value — passable and storable
(println "Result:" result)
;; => Output: [MemDB] Saving po_001
;; => Output: Result: {:ok true, :value "PO po_001 submitted at 2026-01-15T09:00:00Z"}

;; ── Swap to production ports — one line change ────────────────────────────
;; (def submit-with-production-ports (partial submit-purchase-order postgres-repo system-clock))
;; => One-line swap: different adapters, same application service function
;; => No DI container to register, no XML or annotations to update
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── Port types ─────────────────────────────────────────────────────────────
interface PurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Aggregate root — used across all adapter and application types

type PurchaseOrderRepo = {
  readonly save: (po: PurchaseOrder) => Promise;
  readonly findById: (id: string) => Promise;
};
// => Canonical port — satisfied by any object with matching save/findById fields

type Clock = () => Date;
// => Time port — synchronous

// ── Application service: ports as constructor parameters ──────────────────
// Convention: ports provided at construction time — enables dependency injection.
const buildSubmitPurchaseOrder =
  (repo: PurchaseOrderRepo, clock: Clock) =>
  async (id: string, amount: number): Promise => {
    const now = clock();
    // => Timestamp from the injected clock adapter
    const po: PurchaseOrder = { id, supplierId: "sup_001", totalAmount: amount, status: "AwaitingApproval" };
    // => Build PO aggregate with the runtime domain inputs
    const saveResult = await repo.save(po);
    if (!saveResult.ok) return { ok: false, error: saveResult.error };
    return { ok: true, value: `PO ${id} submitted at ${now.toISOString()}` };
    // => Return confirmation to the HTTP adapter
  };

// ── In-memory adapters for demonstration ──────────────────────────────────
const inMemRepo: PurchaseOrderRepo = {
  save: async (po) => {
    console.log(`[MemDB] Saving ${po.id}`);
    return { ok: true };
  },
  // => In-memory: prints to demonstrate the call without real infrastructure
  findById: async () => ({ ok: true, value: null }),
  // => In-memory: always returns null for this demonstration
};
const testFixedClock: Clock = () => new Date("2026-01-15T09:00:00Z");
// => Fixed time — deterministic in tests

// ── Closure: bake in the ports ────────────────────────────────────────────
const submitWithTestPorts = buildSubmitPurchaseOrder(inMemRepo, testFixedClock);
// => submitWithTestPorts: (id: string, amount: number) => Promise<...>
// => The port parameters are baked in; only domain inputs remain
// => This is DI without a container — just function closure

// ── Call site: only domain inputs needed ──────────────────────────────────
const paResult = await submitWithTestPorts("po_001", 3500);
// => Calls buildSubmitPurchaseOrder with inMemRepo, testFixedClock, "po_001", 3500
console.log("Result:", paResult);
// => Output: [MemDB] Saving po_001
// => Output: Result: { ok: true, value: 'PO po_001 submitted at 2026-01-15T09:00:00.000Z' }

// ── Swap to production ports — one line change ────────────────────────────
// const submitWithProductionPorts = buildSubmitPurchaseOrder(postgresRepo, systemClock)
// => One-line swap: different adapters, same application service function
// => No DI container to configure, no decorators or metadata to update
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── Port types ─────────────────────────────────────────────────────────────
-- [F#: partial application produces a curried function — Haskell has currying by default]

module Procurement.Application.PartialApp where

import Data.Text (Text)
import qualified Data.Text as T
import Data.Time (UTCTime)
import Data.Time.Format.ISO8601 (iso8601ParseM)

data PurchaseOrder = PurchaseOrder
  { poId :: Text, poSupplier :: Text, poTotal :: Double, poStatus :: Text }
  deriving (Show)
-- => Aggregate root — used across all adapter and application types

data PurchaseOrderRepository = PurchaseOrderRepository
  { savePO :: PurchaseOrder -> IO (Either Text ())
  , loadPO :: Text          -> IO (Either Text (Maybe PurchaseOrder))
  }
-- => Canonical port — satisfied by any record-of-functions

type Clock = IO UTCTime
-- => Time port — IO action; no Either (clocks do not fail)

-- ── Application service: ports as first parameters ────────────────────────
-- Convention: ports come before domain inputs — enables curried partial application.
submitPurchaseOrder
  :: PurchaseOrderRepository  -- => First port parameter
  -> Clock                    -- => Second port parameter
  -> Text                     -- => Domain input: PO identifier
  -> Double                   -- => Domain input: amount
  -> IO (Either Text Text)
submitPurchaseOrder repo clock i amount = do
  now <- clock
  -- => Timestamp from the baked-in clock adapter
  let _ = now
  let po = PurchaseOrder i "sup_001" amount "AwaitingApproval"
  -- => Build PO aggregate with the runtime domain inputs
  _ <- savePO repo po
  -- => Persist via the baked-in repository adapter
  pure (Right ("PO " <> i <> " submitted at " <> T.pack (show now)))
  -- => Return confirmation to the HTTP adapter

-- ── In-memory adapters for demonstration ──────────────────────────────────
inMemRepo :: PurchaseOrderRepository
inMemRepo = PurchaseOrderRepository
  { savePO = \po -> do
      putStrLn ("[MemDB] Saving " <> T.unpack (poId po))
      -- => In-memory: prints to demonstrate the call without real infrastructure
      pure (Right ())
  , loadPO = \_ -> pure (Right Nothing)
  -- => In-memory: always returns Nothing for this demonstration
  }

fixedClock :: Clock
fixedClock = case iso8601ParseM "2026-01-15T09:00:00Z" of
  Just t  -> pure t
  Nothing -> error "unreachable"
-- => Fixed time — deterministic in tests

-- ── Partial application: bake in the ports ────────────────────────────────
submitWithTestPorts :: Text -> Double -> IO (Either Text Text)
submitWithTestPorts = submitPurchaseOrder inMemRepo fixedClock
-- => submitWithTestPorts :: Text -> Double -> IO (Either Text Text)
-- => The port parameters are baked in; only domain inputs remain
-- => This is DI without a container — just function application

-- ── Call site: only domain inputs needed ──────────────────────────────────
main :: IO ()
main = do
  result <- submitWithTestPorts "po_001" 3500
  -- => Calls submitPurchaseOrder with inMemRepo, fixedClock, "po_001", 3500
  -- => submitWithTestPorts is a first-class function — passable, storable, composable
  putStrLn ("Result: " <> show result)
  -- => Output: [MemDB] Saving po_001
  -- => Output: Result: Right "PO po_001 submitted at 2026-01-15 09:00:00 UTC"

-- ── Swap to production ports — one line change ────────────────────────────
-- submitWithProductionPorts = submitPurchaseOrder postgresRepo systemClock
-- => One-line swap: different adapters, same application service function
-- => No DI container to configure, no metadata to update
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: Partial application bakes port adapters into application service functions, producing a DI-injected use case function without a container, reflection, or registration boilerplate.

**Why It Matters**: DI containers in OOP languages require registration, reflection, and sometimes XML configuration to achieve what partial application does in one line across functional languages. Partially applied functions are first-class values: they can be passed as arguments, stored in records, composed with other functions, and tested by passing different adapters. The composition root becomes a sequence of partial application or function-wrapping expressions — readable, refactorable, and statically verified at every step.

---

## The Full Hexagonal Flow (Examples 21–25)

### Example 21: Domain Function vs Application Service vs Adapter — Three Responsibilities

Three distinct responsibilities live in three distinct code zones. Domain functions are pure; application services orchestrate ports; adapters translate between delivery mechanisms and domain types.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
open System

// ── ZONE 1: Domain — pure functions, no I/O ────────────────────────────────
module Domain =
    type PurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal; Status: string }
    // => Domain type: defined without knowledge of any infrastructure
    type ApprovalLevel = L1 | L2 | L3
    // => Derived from PO total — L1 ≤ $1k, L2 ≤ $10k, L3 > $10k

    let determineApprovalLevel (total: decimal) : ApprovalLevel =
        // => Pure function: no I/O, no side effects, always deterministic
        if total <= 1000m then L1
        // => L1: low-value POs — immediate manager approval
        elif total <= 10000m then L2
        // => L2: mid-value POs — department head approval
        else L3
        // => L3: high-value POs — CFO or executive approval

    let validate (id: string) (supplierId: string) (amount: decimal) =
        // => Pure validation: domain rules only, no infrastructure
        if String.IsNullOrWhiteSpace(id)         then Error "Blank PO Id"
        elif String.IsNullOrWhiteSpace(supplierId) then Error "Blank SupplierId"
        elif amount <= 0m                          then Error "Amount must be positive"
        else Ok { Id = id; SupplierId = supplierId; TotalAmount = amount; Status = "Draft" }
        // => Returns validated PO or named error — no async, no I/O

// ── ZONE 2: Application — orchestration only ──────────────────────────────
module Application =
    open Domain
    type PurchaseOrderRepository = {
        save: PurchaseOrder -> Async<Result<unit, string>>
        load: string        -> Async<Result<PurchaseOrder option, string>>
    }
    // => Output port: application layer defines, adapters implement

    let submitPO (repo: PurchaseOrderRepository) (id: string) (supplierId: string) (amount: decimal) =
        // => Application service: calls domain functions + output ports; no HTTP knowledge
        async {
            match validate id supplierId amount with
            | Error msg -> return Error msg
            // => Domain validation failed — short-circuit before I/O
            | Ok po ->
            let level = determineApprovalLevel po.TotalAmount
            // => Pure domain function: determines which manager must approve
            let awaitingPO = { po with Status = sprintf "AwaitingApproval-%A" level }
            // => State transition: Draft → AwaitingApproval-L1/L2/L3
            let! saveResult = repo.save awaitingPO
            // => Output port call: persist the PO
            return saveResult |> Result.map (fun () -> awaitingPO)
            // => Return the saved PO or infrastructure error
        }

// ── ZONE 3: Adapters — translation only ───────────────────────────────────
module Adapters =
    open Application
    type HttpDto = { po_id: string; supplier_id: string; total_amount: float }
    // => JSON request body shape — adapter zone only; never leaks into domain

    let inMemRepo : PurchaseOrderRepository = {
        // => In-memory adapter satisfying the output port
        save = fun po -> async { printfn "[Mem] Saved %s as %s" po.Id po.Status; return Ok () }
        load = fun id -> async { return Ok None }
    }

    let handleHttpRequest (submit: string -> string -> decimal -> Async<Result<Domain.PurchaseOrder, string>>)
                          (dto: HttpDto) =
        // => Thin HTTP handler: translate, delegate, respond
        async {
            let! result = submit dto.po_id dto.supplier_id (decimal dto.total_amount)
            // => Delegate to the injected application service (partially applied)
            return
                match result with
                | Ok po   -> sprintf "201 Created: %s in %s" po.Id po.Status
                | Error e -> sprintf "422 Unprocessable: %s" e
        }

// ── Composition root: wire everything together ────────────────────────────
let submitService = Application.submitPO Adapters.inMemRepo
// => submitService : string -> string -> decimal -> Async<Result<PurchaseOrder, string>>
// => Port baked in — domain inputs remain

let request = { Adapters.po_id = "po_001"; supplier_id = "sup_acme"; total_amount = 5500.0 }
// => Sample HTTP request body
let response = Adapters.handleHttpRequest submitService request |> Async.RunSynchronously
// => Runs the full flow: HTTP → Application → Domain → In-memory adapter → HTTP
printfn "%s" response
// => Output: [Mem] Saved po_001 as AwaitingApproval-L2
// => Output: 201 Created: po_001 in AwaitingApproval-L2
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── ZONE 1: Domain namespace — pure functions, no I/O ────────────────────
;; [F#: module Domain — Clojure uses ns declarations to delimit zones; no imports of infra here]
(ns procurement-platform.domain.purchase-order)

;; [F#: discriminated union ApprovalLevel — Clojure uses keyword constants; no type tag]
;; :l1 :l2 :l3 are self-documenting; dispatch via cond is open to extension
(defn determine-approval-level [total]
  ;; Pure function: no I/O, no side effects, always deterministic
  (cond
    (<= total 1000M) :l1
    ;; => :l1 — low-value POs; immediate manager approval
    (<= total 10000M) :l2
    ;; => :l2 — mid-value POs; department head approval
    :else :l3))
    ;; => :l3 — high-value POs; CFO or executive approval

(defn validate-po [id supplier-id amount]
  ;; Pure validation: domain rules only — no infrastructure
  (cond
    (clojure.string/blank? id)          {:error/type :validation-error :error/message "Blank PO Id"}
    ;; => Blank id rejected — same guard as F# version
    (clojure.string/blank? supplier-id) {:error/type :validation-error :error/message "Blank SupplierId"}
    ;; => Blank supplier-id rejected
    (<= amount 0M)                      {:error/type :validation-error :error/message "Amount must be positive"}
    ;; => Non-positive amount rejected
    :else {:ok true :value {:id id :supplier-id supplier-id :total-amount amount :status "Draft"}}))
    ;; => All rules pass: return a validated draft purchase-order map

;; ── ZONE 2: Application namespace — orchestration only ────────────────────
;; [F#: module Application with record-of-functions port — Clojure uses ns + protocol map]
(ns procurement-platform.application.submit-po
  (:require [procurement-platform.domain.purchase-order :as domain]))
;; => Only the domain namespace is required here — no infrastructure

(defn submit-po [repo id supplier-id amount]
  ;; repo — protocol map {:save fn :load fn}; domain inputs follow
  (let [validation (domain/validate-po id supplier-id amount)]
    (if (:error/type validation)
      validation
      ;; => Domain validation failed — short-circuit before any port call
      (let [po          (:value validation)
            level       (domain/determine-approval-level (:total-amount po))
            ;; => Pure domain function: determines which manager must approve
            awaiting-po (assoc po :status (str "AwaitingApproval-" (name level)))
            ;; => State transition: Draft → AwaitingApproval-l1/l2/l3 via assoc
            save-result ((:save repo) awaiting-po)]
            ;; => Output port call: persist the PO via the injected adapter
        (if (:ok save-result)
          {:ok true :value awaiting-po}
          ;; => Return the saved PO map on success
          save-result)))))
          ;; => Propagate the error envelope from the adapter

;; ── ZONE 3: Adapters namespace — translation only ────────────────────────
;; [F#: module Adapters with HttpDto record — Clojure uses plain maps; no DTO type needed]
(ns procurement-platform.adapters.http
  (:require [procurement-platform.application.submit-po :as app]))
;; => Only the application namespace required — no domain import crosses zone boundary

(def in-mem-repo
  ;; In-memory adapter satisfying the output port protocol map
  {:save (fn [po]
           (println "[Mem] Saved" (:id po) "as" (:status po))
           ;; => Prints to show the call without real infrastructure
           {:ok true})
   :load (fn [_id]
           {:ok true :value nil})})
           ;; => Always returns nil — no real persistence in this demo

(defn handle-http-request [submit dto]
  ;; submit — partially applied application service function
  ;; dto — HTTP request map with :po_id :supplier_id :total_amount keys
  (let [result (submit (:po_id dto) (:supplier_id dto) (bigdec (:total_amount dto)))]
    ;; => Translate: DTO keys → domain args, then delegate to the application service
    (if (:ok result)
      (str "201 Created: " (get-in result [:value :id]) " in " (get-in result [:value :status]))
      ;; => Translate: domain output → HTTP response string
      (str "422 Unprocessable: " (:error/message result)))))
      ;; => Translate: domain error → HTTP error string

;; ── Composition root: wire everything together ────────────────────────────
(def submit-service
  (partial app/submit-po in-mem-repo))
;; => submit-service — application service with the port baked in via partial
;; => Remaining args: id, supplier-id, amount — provided by the HTTP adapter at runtime

(def request {:po_id "po_001" :supplier_id "sup_acme" :total_amount 5500.0})
;; => Sample HTTP request map

(def response (handle-http-request submit-service request))
;; => Runs the full flow: HTTP adapter → Application service → Domain fns → In-mem adapter → HTTP
(println response)
;; => Output: [Mem] Saved po_001 as AwaitingApproval-l3
;; => Output: 201 Created: po_001 in AwaitingApproval-l3
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── ZONE 1: Domain — pure functions, no I/O ────────────────────────────────
// domain/purchaseOrder.ts — zero external imports

type ApprovalLevel = "L1" | "L2" | "L3";
// => Literal union derived from PO total — L1 ≤ $1k, L2 ≤ $10k, L3 > $10k

interface PurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Domain type: defined without knowledge of any infrastructure

type ValidationResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: string };
// => FP-style tagged union for domain validation — no throw

const determineApprovalLevel = (total: number): ApprovalLevel => {
  // => Pure function: no I/O, no side effects, always deterministic
  if (total <= 1000) return "L1";
  // => L1: manager approval threshold
  if (total <= 10000) return "L2";
  // => L2: department head approval threshold
  return "L3";
  // => L3: CFO approval — required for high-value POs
};

const validateDraft = (id: string, supplierId: string, amount: number): ValidationResult => {
  // => Pure validation: domain rules only, no infrastructure
  if (!id || id.trim() === "") return { ok: false, error: "Blank PO Id" };
  if (!supplierId || supplierId.trim() === "") return { ok: false, error: "Blank SupplierId" };
  if (amount <= 0) return { ok: false, error: "Amount must be positive" };
  return { ok: true, value: { id, supplierId, totalAmount: amount, status: "Draft" } };
  // => Returns validated PO or named error — no async, no I/O
};

// ── ZONE 2: Application — orchestration only ─────────────────────────────
// application/ports.ts — import from domain only

type PurchaseOrderRepo = {
  readonly save: (po: PurchaseOrder) => Promise;
  readonly findById: (id: string) => Promise;
};
// => Output port: application layer defines, adapters implement

const buildSubmitPO =
  (repo: PurchaseOrderRepo) =>
  async (id: string, supplierId: string, amount: number): Promise => {
    // => Application service: calls domain functions + output ports; no HTTP knowledge
    const validation = validateDraft(id, supplierId, amount);
    if (!validation.ok) return validation;
    // => Domain validation failed — short-circuit before I/O
    const level = determineApprovalLevel(validation.value.totalAmount);
    // => Pure domain function: determines which manager must approve
    const awaitingPO: PurchaseOrder = { ...validation.value, status: `AwaitingApproval-${level}` };
    // => State transition: Draft → AwaitingApproval-L1/L2/L3
    const saveResult = await repo.save(awaitingPO);
    // => Output port call: persist the PO
    if (!saveResult.ok) return saveResult;
    return { ok: true, value: awaitingPO };
    // => Return the saved PO or infrastructure error
  };

// ── ZONE 3: Adapters — translation only ───────────────────────────────────
// adapters/httpHandler.ts — imports application zone only

interface HttpDto {
  readonly po_id: string;
  readonly supplier_id: string;
  readonly total_amount: number;
}
// => JSON request body shape — adapter zone only; never leaks into domain

const inMemRepo: PurchaseOrderRepo = {
  save: async (po) => {
    console.log(`[Mem] Saved ${po.id} as ${po.status}`);
    return { ok: true };
  },
  findById: async () => ({ ok: true, value: null }),
  // => In-memory adapter satisfying the output port
};

const handleHttpRequest =
  (submit: (id: string, supplierId: string, amount: number) => Promise) =>
  async (dto: HttpDto): Promise => {
    // => Thin HTTP handler: translate, delegate, respond
    const result = await submit(dto.po_id, dto.supplier_id, dto.total_amount);
    // => Delegate to the injected application service
    if (result.ok) return `201 Created: ${result.value.id} in ${result.value.status}`;
    return `422 Unprocessable: ${result.error}`;
  };

// ── Composition root: wire everything together ────────────────────────────
const submitService = buildSubmitPO(inMemRepo);
// => submitService: (id, supplierId, amount) => Promise<...>
// => Port baked in — domain inputs remain

const z1request: HttpDto = { po_id: "po_001", supplier_id: "sup_acme", total_amount: 5500 };
// => Sample HTTP request body
const z1response = await handleHttpRequest(submitService)(z1request);
// => Runs the full flow: HTTP → Application → Domain → In-memory adapter → HTTP
console.log(z1response);
// => Output: [Mem] Saved po_001 as AwaitingApproval-L2
// => Output: 201 Created: po_001 in AwaitingApproval-L2
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── ZONE 1: Domain — pure functions, no I/O ────────────────────────────────
-- [F#: module Domain — Haskell uses module declarations; only base imports]

module Procurement.ThreeZones where

import Data.Text (Text)
import qualified Data.Text as T

data ApprovalLevel = L1 | L2 | L3 deriving (Show, Eq)
-- => Derived from PO total — L1 ≤ $1k, L2 ≤ $10k, L3 > $10k

data PurchaseOrder = PurchaseOrder
  { poId :: Text, poSupplier :: Text, poTotal :: Double, poStatus :: Text }
  deriving (Show)
-- => Domain type: defined without knowledge of any infrastructure

determineApprovalLevel :: Double -> ApprovalLevel
-- => Pure function: no I/O, no side effects, always deterministic
determineApprovalLevel total
  | total <= 1000  = L1
  -- => L1: low-value POs — immediate manager approval
  | total <= 10000 = L2
  -- => L2: mid-value POs — department head approval
  | otherwise      = L3
  -- => L3: high-value POs — CFO or executive approval

validatePO :: Text -> Text -> Double -> Either Text PurchaseOrder
-- => Pure validation: domain rules only, no infrastructure
validatePO i supp amount
  | T.null (T.strip i)    = Left "Blank PO Id"
  | T.null (T.strip supp) = Left "Blank SupplierId"
  | amount <= 0           = Left "Amount must be positive"
  | otherwise             = Right (PurchaseOrder i supp amount "Draft")
  -- => Returns validated PO or named error — no IO, no Either e ()

-- ── ZONE 2: Application — orchestration only ──────────────────────────────
data PurchaseOrderRepository = PurchaseOrderRepository
  { savePO :: PurchaseOrder -> IO (Either Text ())
  , loadPO :: Text          -> IO (Either Text (Maybe PurchaseOrder))
  }
-- => Output port: application layer defines, adapters implement

submitPO :: PurchaseOrderRepository -> Text -> Text -> Double
         -> IO (Either Text PurchaseOrder)
-- => Application service: calls domain functions + output ports; no HTTP knowledge
submitPO repo i supp amount =
  case validatePO i supp amount of
    Left msg -> pure (Left msg)
    -- => Domain validation failed — short-circuit before I/O
    Right po -> do
      let level = determineApprovalLevel (poTotal po)
      -- => Pure domain function: determines which manager must approve
      let awaitingPO = po { poStatus = "AwaitingApproval-" <> T.pack (show level) }
      -- => State transition: Draft → AwaitingApproval-L1/L2/L3
      saveResult <- savePO repo awaitingPO
      -- => Output port call: persist the PO
      pure $ case saveResult of
        Right () -> Right awaitingPO
        Left  e  -> Left e

-- ── ZONE 3: Adapters — translation only ───────────────────────────────────
data HttpDto = HttpDto { hPoId :: Text, hSupp :: Text, hTotal :: Double }
-- => JSON request body shape — adapter zone only; never leaks into domain

inMemRepo :: PurchaseOrderRepository
inMemRepo = PurchaseOrderRepository
  { savePO = \po -> do
      putStrLn ("[Mem] Saved " <> T.unpack (poId po) <> " as " <> T.unpack (poStatus po))
      pure (Right ())
  , loadPO = \_ -> pure (Right Nothing)
  }
-- => In-memory adapter satisfying the output port

handleHttpRequest
  :: (Text -> Text -> Double -> IO (Either Text PurchaseOrder))
  -> HttpDto -> IO Text
handleHttpRequest submit dto = do
  -- => Thin HTTP handler: translate, delegate, respond
  result <- submit (hPoId dto) (hSupp dto) (hTotal dto)
  -- => Delegate to the injected application service (partially applied)
  pure $ case result of
    Right po -> "201 Created: " <> poId po <> " in " <> poStatus po
    Left  e  -> "422 Unprocessable: " <> e

-- ── Composition root: wire everything together ────────────────────────────
main :: IO ()
main = do
  let submitService = submitPO inMemRepo
  -- => submitService :: Text -> Text -> Double -> IO (Either Text PurchaseOrder)
  -- => Port baked in via partial application — domain inputs remain
  let request = HttpDto "po_001" "sup_acme" 5500
  -- => Sample HTTP request body
  response <- handleHttpRequest submitService request
  -- => Runs the full flow: HTTP → Application → Domain → In-memory adapter → HTTP
  putStrLn (T.unpack response)
  -- => Output: [Mem] Saved po_001 as AwaitingApproval-L2
  -- => Output: 201 Created: po_001 in AwaitingApproval-L2
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: Domain functions are pure, application services orchestrate ports, and adapters translate — three distinct responsibilities in three distinct zones, each independently testable.

**Why It Matters**: Mixing these three responsibilities is the most common cause of untestable code. A domain function that calls `repo.save` inside a pricing calculation cannot be tested without infrastructure. An HTTP handler that contains approval-level logic cannot be tested without an HTTP server. The zone model enforces separation: each responsibility lives in exactly one zone, and each zone is independently testable at its natural boundary.

---

### Example 22: Testing the Domain Without Infrastructure

Pure domain functions can be tested without any ports, adapters, or infrastructure. This is the fastest and most reliable test tier.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── Domain types and pure functions ────────────────────────────────────────
type ApprovalLevel = L1 | L2 | L3
// => Derived from PO total threshold — L1 ≤ $1k, L2 ≤ $10k, L3 > $10k

type PurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal; Status: string }
// => Aggregate root — domain type with no infrastructure dependencies

type ValidationError = BlankId | BlankSupplierId | NonPositiveAmount of decimal
// => Named domain errors — not strings, not exceptions

let determineApprovalLevel (total: decimal) : ApprovalLevel =
    // => Pure function: receives decimal, returns named DU case
    // => No I/O, no async — can be called billions of times with zero infrastructure
    if total <= 1000m then L1
    elif total <= 10000m then L2
    else L3

let validatePO (id: string) (supplierId: string) (amount: decimal) : Result<PurchaseOrder, ValidationError> =
    // => Pure validation: checks domain rules, returns Result
    if System.String.IsNullOrWhiteSpace(id)          then Error BlankId
    elif System.String.IsNullOrWhiteSpace(supplierId) then Error BlankSupplierId
    elif amount <= 0m                                 then Error (NonPositiveAmount amount)
    else Ok { Id = id; SupplierId = supplierId; TotalAmount = amount; Status = "Draft" }

// ── Domain tests — zero infrastructure ────────────────────────────────────
// These are the fastest tests in the system: no async, no setup, no teardown.

// Test 1: L1 approval for low-value PO
let level1 = determineApprovalLevel 999m
// => level1 : ApprovalLevel = L1  (999m ≤ 1000m threshold)
printfn "999m → %A (expected L1)" level1
// => Output: 999m → L1 (expected L1)

// Test 2: boundary — exactly at L2 threshold
let level2 = determineApprovalLevel 1000m
// => level2 : ApprovalLevel = L1  (1000m ≤ 1000m: at boundary, still L1)
printfn "1000m → %A (expected L1 at boundary)" level2
// => Output: 1000m → L1 (expected L1 at boundary)

// Test 3: just over L1 threshold
let level2b = determineApprovalLevel 1001m
// => level2b : ApprovalLevel = L2  (1001m > 1000m)
printfn "1001m → %A (expected L2)" level2b
// => Output: 1001m → L2 (expected L2)

// Test 4: L3 for high-value PO
let level3 = determineApprovalLevel 15000m
// => level3 : ApprovalLevel = L3  (15000m > 10000m)
printfn "15000m → %A (expected L3)" level3
// => Output: 15000m → L3 (expected L3)

// Test 5: validation — blank PO ID
let blankId = validatePO "" "sup_001" 500m
// => blankId : Result<PurchaseOrder, ValidationError> = Error BlankId
printfn "Blank id: %A" blankId
// => Output: Blank id: Error BlankId

// Test 6: validation — non-positive amount
let zeroAmount = validatePO "po_001" "sup_001" 0m
// => zeroAmount : Result<PurchaseOrder, ValidationError> = Error (NonPositiveAmount 0M)
printfn "Zero amount: %A" zeroAmount
// => Output: Zero amount: Error (NonPositiveAmount 0M)

// Test 7: valid PO passes all guards
let valid = validatePO "po_001" "sup_001" 7500m
// => valid : Result<PurchaseOrder, ValidationError> = Ok { Id = "po_001"; ... }
printfn "Valid PO: %A" valid
// => Output: Valid PO: Ok { Id = "po_001"; SupplierId = "sup_001"; TotalAmount = 7500M; Status = "Draft" }
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── Domain data and pure functions ─────────────────────────────────────────
;; [F#: discriminated union ApprovalLevel — compiler-enforced exhaustiveness]
;; Clojure represents approval levels as keywords; no type declaration needed.
;; The domain rule (which keyword applies) lives in the pure function below.

(defn determine-approval-level
  ;; Pure function: receives an amount, returns a keyword naming the approval tier
  ;; [F#: returns named DU case L1/L2/L3 — same semantics, no runtime type tag]
  [total]
  (cond
    (<= total 1000) :l1
    ;; => :l1 — manager approval; amounts up to $1,000
    (<= total 10000) :l2
    ;; => :l2 — department-head approval; amounts $1,001–$10,000
    :else :l3))
    ;; => :l3 — CFO approval; amounts above $10,000

(defn validate-po
  ;; Pure validation: checks domain rules, returns a tagged result map
  ;; [F#: returns Result<PurchaseOrder, ValidationError> — compile-time error union]
  ;; Clojure convention: {:ok true :value ...} or {:ok false :error ...}
  [id supplier-id amount]
  (cond
    (clojure.string/blank? id)
    ;; => id is nil or whitespace — domain rule: PO id must be present
    {:ok false :error :blank-id}
    (clojure.string/blank? supplier-id)
    ;; => supplier-id missing — domain rule: supplier must be specified
    {:ok false :error :blank-supplier-id}
    (<= amount 0)
    ;; => amount is zero or negative — domain rule: PO must have positive value
    {:ok false :error {:type :non-positive-amount :amount amount}}
    :else
    ;; => All rules passed — build the domain entity map
    {:ok true
     :value {:id id :supplier-id supplier-id :total-amount amount :status "Draft"}}))
    ;; => Clojure entity is a plain map; no class instantiation required

;; ── Domain tests — zero infrastructure ─────────────────────────────────────
;; These are plain function calls — no test runner, no setup, no teardown.

;; Test 1: L1 approval for low-value PO
(def level1 (determine-approval-level 999))
;; => level1 = :l1  (999 ≤ 1000 threshold)
(println "999 →" level1 "(expected :l1)")
;; => Output: 999 → :l1 (expected :l1)

;; Test 2: boundary — exactly at L1 threshold
(def level2 (determine-approval-level 1000))
;; => level2 = :l1  (1000 ≤ 1000: at boundary, still :l1)
(println "1000 →" level2 "(expected :l1 at boundary)")
;; => Output: 1000 → :l1 (expected :l1 at boundary)

;; Test 3: just over L1 threshold
(def level2b (determine-approval-level 1001))
;; => level2b = :l2  (1001 > 1000)
(println "1001 →" level2b "(expected :l2)")
;; => Output: 1001 → :l2 (expected :l2)

;; Test 4: L3 for high-value PO
(def level3 (determine-approval-level 15000))
;; => level3 = :l3  (15000 > 10000)
(println "15000 →" level3 "(expected :l3)")
;; => Output: 15000 → :l3 (expected :l3)

;; Test 5: validation — blank PO ID
(def blank-id-result (validate-po "" "sup_001" 500))
;; => blank-id-result = {:ok false, :error :blank-id}
(println "Blank id:" blank-id-result)
;; => Output: Blank id: {:ok false, :error :blank-id}

;; Test 6: validation — non-positive amount
(def zero-amount-result (validate-po "po_001" "sup_001" 0))
;; => zero-amount-result = {:ok false, :error {:type :non-positive-amount, :amount 0}}
(println "Zero amount:" zero-amount-result)
;; => Output: Zero amount: {:ok false, :error {:type :non-positive-amount, :amount 0}}

;; Test 7: valid PO passes all guards
(def valid-result (validate-po "po_001" "sup_001" 7500))
;; => valid-result = {:ok true, :value {:id "po_001", :supplier-id "sup_001", ...}}
(println "Valid PO:" valid-result)
;; => Output: Valid PO: {:ok true, :value {:id "po_001", :supplier-id "sup_001", :total-amount 7500, :status "Draft"}}
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── Domain types and pure functions ──────────────────────────────────────
type ApprovalLevel = "L1" | "L2" | "L3";
// => Literal union derived from PO total — L1 ≤ $1k, L2 ≤ $10k, L3 > $10k

interface PurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Aggregate root — domain type with no infrastructure dependencies

type ValidationError =
  | { readonly kind: "BlankId" }
  | { readonly kind: "BlankSupplierId" }
  | { readonly kind: "NonPositiveAmount"; readonly value: number };
// => Named domain errors — not strings, not exceptions

type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
// => FP-style tagged union — callers must handle both branches

const determineApprovalLevel = (total: number): ApprovalLevel => {
  // => Pure function: receives number, returns literal union member
  // => No I/O, no async — can be called millions of times with zero infrastructure
  if (total <= 1000) return "L1";
  if (total <= 10000) return "L2";
  return "L3";
};

const validatePO = (id: string, supplierId: string, amount: number): Result => {
  // => Pure validation: checks domain rules, returns Result
  if (!id || id.trim() === "") return { ok: false, error: { kind: "BlankId" } };
  if (!supplierId || supplierId.trim() === "") return { ok: false, error: { kind: "BlankSupplierId" } };
  if (amount <= 0) return { ok: false, error: { kind: "NonPositiveAmount", value: amount } };
  return { ok: true, value: { id, supplierId, totalAmount: amount, status: "Draft" } };
};

// ── Domain tests — zero infrastructure ────────────────────────────────────
// These are the fastest tests in the system: no async, no setup, no teardown.

const level1 = determineApprovalLevel(999);
// => level1: ApprovalLevel = "L1"  (999 ≤ 1000 threshold)
console.log(`999 → ${level1} (expected L1)`);
// => Output: 999 → L1 (expected L1)

const level2 = determineApprovalLevel(1000);
// => level2: ApprovalLevel = "L1"  (1000 ≤ 1000: at boundary, still L1)
console.log(`1000 → ${level2} (expected L1 at boundary)`);
// => Output: 1000 → L1 (expected L1 at boundary)

const level2b = determineApprovalLevel(1001);
// => level2b: ApprovalLevel = "L2"  (1001 > 1000)
console.log(`1001 → ${level2b} (expected L2)`);
// => Output: 1001 → L2 (expected L2)

const level3 = determineApprovalLevel(15000);
// => level3: ApprovalLevel = "L3"  (15000 > 10000)
console.log(`15000 → ${level3} (expected L3)`);
// => Output: 15000 → L3 (expected L3)

const blankId = validatePO("", "sup_001", 500);
// => blankId: Result = { ok: false, error: { kind: "BlankId" } }
console.log("Blank id:", blankId);
// => Output: Blank id: { ok: false, error: { kind: 'BlankId' } }

const zeroAmount = validatePO("po_001", "sup_001", 0);
// => zeroAmount: Result = { ok: false, error: { kind: "NonPositiveAmount", value: 0 } }
console.log("Zero amount:", zeroAmount);
// => Output: Zero amount: { ok: false, error: { kind: 'NonPositiveAmount', value: 0 } }

const valid = validatePO("po_001", "sup_001", 7500);
// => valid: Result = { ok: true, value: { id: "po_001", ... } }
console.log("Valid PO:", valid);
// => Output: Valid PO: { ok: true, value: { id: 'po_001', supplierId: 'sup_001', totalAmount: 7500, status: 'Draft' } }
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── Domain types and pure functions ────────────────────────────────────────
-- [F#: discriminated union ApprovalLevel — Haskell uses sum type via data]
-- [F#: Result<PurchaseOrder, ValidationError> — Haskell uses Either]

module Procurement.Domain.Tests where

import Data.Text (Text)
import qualified Data.Text as T

data ApprovalLevel = L1 | L2 | L3 deriving (Show, Eq)
-- => Derived from PO total threshold — L1 ≤ $1k, L2 ≤ $10k, L3 > $10k

data PurchaseOrder = PurchaseOrder
  { poId :: Text, poSupplier :: Text, poTotal :: Double, poStatus :: Text }
  deriving (Show, Eq)
-- => Aggregate root — domain type with no infrastructure dependencies

data ValidationError
  = BlankId
  | BlankSupplierId
  | NonPositiveAmount Double
  deriving (Show, Eq)
-- => Named domain errors — not strings, not exceptions

determineApprovalLevel :: Double -> ApprovalLevel
-- => Pure function: receives Double, returns sum-type constructor
-- => No IO, no Either — can be called billions of times with zero infrastructure
determineApprovalLevel total
  | total <= 1000  = L1
  | total <= 10000 = L2
  | otherwise      = L3

validatePO :: Text -> Text -> Double -> Either ValidationError PurchaseOrder
-- => Pure validation: checks domain rules, returns Either
validatePO i supp amount
  | T.null (T.strip i)    = Left BlankId
  | T.null (T.strip supp) = Left BlankSupplierId
  | amount <= 0           = Left (NonPositiveAmount amount)
  | otherwise             = Right (PurchaseOrder i supp amount "Draft")

-- ── Domain tests — zero infrastructure ────────────────────────────────────
-- These are the fastest tests in the system: no IO, no setup, no teardown.
-- Real Haskell would use Hspec/HUnit — these are plain expressions.

main :: IO ()
main = do
  -- Test 1: L1 approval for low-value PO
  let level1 = determineApprovalLevel 999
  -- => level1 :: ApprovalLevel = L1  (999 ≤ 1000 threshold)
  putStrLn ("999 -> " <> show level1 <> " (expected L1)")
  -- => Output: 999 -> L1 (expected L1)

  -- Test 2: boundary — exactly at L1 threshold
  let level2 = determineApprovalLevel 1000
  -- => level2 :: ApprovalLevel = L1  (1000 ≤ 1000: at boundary, still L1)
  putStrLn ("1000 -> " <> show level2 <> " (expected L1 at boundary)")
  -- => Output: 1000 -> L1 (expected L1 at boundary)

  -- Test 3: just over L1 threshold
  let level2b = determineApprovalLevel 1001
  -- => level2b :: ApprovalLevel = L2  (1001 > 1000)
  putStrLn ("1001 -> " <> show level2b <> " (expected L2)")
  -- => Output: 1001 -> L2 (expected L2)

  -- Test 4: L3 for high-value PO
  let level3 = determineApprovalLevel 15000
  -- => level3 :: ApprovalLevel = L3  (15000 > 10000)
  putStrLn ("15000 -> " <> show level3 <> " (expected L3)")
  -- => Output: 15000 -> L3 (expected L3)

  -- Test 5: validation — blank PO ID
  let blankIdResult = validatePO "" "sup_001" 500
  -- => blankIdResult :: Either ValidationError PurchaseOrder = Left BlankId
  putStrLn ("Blank id: " <> show blankIdResult)
  -- => Output: Blank id: Left BlankId

  -- Test 6: validation — non-positive amount
  let zeroAmount = validatePO "po_001" "sup_001" 0
  -- => zeroAmount = Left (NonPositiveAmount 0.0)
  putStrLn ("Zero amount: " <> show zeroAmount)
  -- => Output: Zero amount: Left (NonPositiveAmount 0.0)

  -- Test 7: valid PO passes all guards
  let valid = validatePO "po_001" "sup_001" 7500
  -- => valid = Right (PurchaseOrder { poId = "po_001", ..., poStatus = "Draft" })
  putStrLn ("Valid PO: " <> show valid)
  -- => Output: Valid PO: Right (PurchaseOrder {poId = "po_001", ...})
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: Pure domain functions are tested by direct invocation with no setup — the fastest and most reliable test tier, covering all boundary conditions and error cases without infrastructure.

**Why It Matters**: Domain tests run in nanoseconds and have zero flakiness. They can cover every boundary condition (at threshold, above threshold, below threshold) without spinning up a database, without managing transactions, and without worrying about test data isolation. The approval-level function alone has at least six boundary conditions worth testing. If each required a real database, the test suite would be orders of magnitude slower. Pure domain functions make boundary-condition testing the cheapest investment in the codebase.

---

### Example 23: Testing the Application Service with In-Memory Adapters

Application service tests inject in-memory adapters to verify orchestration without infrastructure. They run in milliseconds and can run in parallel with zero contention.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
open System
open System.Collections.Generic

// ── Shared types ───────────────────────────────────────────────────────────
type PurchaseOrder = { Id: string; SupplierId: string; TotalAmount: decimal; Status: string }
// => Aggregate root — same type across domain, application, and adapter layers

type PurchaseOrderRepository = {
    save: PurchaseOrder -> Async<Result<unit, string>>
    load: string        -> Async<Result<PurchaseOrder option, string>>
}
// => Canonical port — in-memory adapter satisfies this type

type Clock = unit -> DateTimeOffset
// => Time port — fixed in tests for deterministic assertions

// ── Application service under test ────────────────────────────────────────
let submitPO (repo: PurchaseOrderRepository) (clock: Clock)
             (id: string) (supplierId: string) (amount: decimal) =
    // => Application service: parameterised by ports — injectable in all environments
    async {
        if String.IsNullOrWhiteSpace(id)          then return Error "Blank PO Id"
        elif String.IsNullOrWhiteSpace(supplierId) then return Error "Blank SupplierId"
        elif amount <= 0m                          then return Error "Non-positive amount"
        else
        let level = if amount <= 1000m then "L1" elif amount <= 10000m then "L2" else "L3"
        // => Pure domain logic: approval level derived from amount
        let submittedAt = clock ()
        // => Timestamp from injected Clock port — fixed in tests
        let po = { Id = id; SupplierId = supplierId; TotalAmount = amount
                   Status = sprintf "AwaitingApproval-%s" level }
        // => State: Draft → AwaitingApproval-{level}
        let! saveResult = repo.save po
        // => Output port call: persist via injected adapter
        return saveResult |> Result.map (fun () -> (po, submittedAt))
        // => Return the saved PO and timestamp for caller inspection
    }

// ── In-memory adapters ─────────────────────────────────────────────────────
let buildTestRepo () =
    // => Isolated spy: records saves, returns expected data on load
    let saved = ResizeArray<PurchaseOrder>()
    let repo : PurchaseOrderRepository = {
        save = fun po -> async { saved.Add(po); return Ok () }
        // => Record the saved PO for assertion
        load = fun id -> async { return Ok (saved |> Seq.tryFind (fun po -> po.Id = id)) }
        // => Find in the accumulated saves — simulates SELECT query
    }
    repo, saved
    // => Returns both the port and the spy list for assertions

let fixedClock : Clock = fun () -> DateTimeOffset(2026, 1, 15, 9, 0, 0, TimeSpan.Zero)
// => Always returns the same timestamp — assert on this literal value in tests

// ── Test 1: valid L2 PO ────────────────────────────────────────────────────
let repo1, saved1 = buildTestRepo ()
// => Fresh isolated repo — not shared with Test 2
let result1 = submitPO repo1 fixedClock "po_001" "sup_001" 5000m |> Async.RunSynchronously
// => 5000m → L2 approval level
printfn "Test 1 result: %A" result1
// => Output: Test 1 result: Ok ({ Id = "po_001"; ...; Status = "AwaitingApproval-L2" }, 2026-01-15 ...)
printfn "Test 1 saved count: %d" saved1.Count
// => Output: Test 1 saved count: 1
printfn "Test 1 saved status: %s" saved1.[0].Status
// => Output: Test 1 saved status: AwaitingApproval-L2

// ── Test 2: validation failure — no save ──────────────────────────────────
let repo2, saved2 = buildTestRepo ()
// => Fresh isolated repo — Test 1 state not visible here
let result2 = submitPO repo2 fixedClock "" "sup_001" 500m |> Async.RunSynchronously
// => Blank PO Id — validation fails before any port call
printfn "Test 2 result: %A" result2
// => Output: Test 2 result: Error "Blank PO Id"
printfn "Test 2 saved count: %d" saved2.Count
// => Output: Test 2 saved count: 0  (validation failed before repo.save was called)
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── Shared domain data definitions ─────────────────────────────────────────
;; [F#: record types PurchaseOrder, PurchaseOrderRepository — compile-time typed fields]
;; Clojure uses plain maps for entities and maps-of-functions for ports.
;; No class declarations needed; the shape is documented in comments.

;; ── Application service under test ──────────────────────────────────────────
(defn submit-po
  ;; Application service: receives port maps as dependencies (higher-order injection)
  ;; [F#: parameterised by PurchaseOrderRepository and Clock record types]
  ;; Clojure uses maps whose values are functions — same concept, no type annotation
  [repo clock id supplier-id amount]
  (cond
    (clojure.string/blank? id)
    ;; => Validation failed: blank PO id — short-circuit before any port call
    {:ok false :error "Blank PO Id"}
    (clojure.string/blank? supplier-id)
    ;; => Validation failed: blank supplier — short-circuit before any port call
    {:ok false :error "Blank SupplierId"}
    (<= amount 0)
    ;; => Validation failed: non-positive amount
    {:ok false :error "Non-positive amount"}
    :else
    (let [level (cond (<= amount 1000) "L1" (<= amount 10000) "L2" :else "L3")
          ;; => Pure domain logic: derive approval tier from amount
          submitted-at ((:clock clock))
          ;; => Call the injected Clock port function — fixed value in tests
          po {:id id :supplier-id supplier-id :total-amount amount
              :status (str "AwaitingApproval-" level)}]
          ;; => Build the domain entity map; status carries the approval tier
      (let [save-result ((:save repo) po)]
        ;; => Call the injected save port function — in-memory adapter in tests
        (if (:ok save-result)
          {:ok true :value [po submitted-at]}
          ;; => Return the saved entity and timestamp for caller assertion
          save-result)))))
          ;; => Propagate the adapter error unchanged

;; ── In-memory adapters ───────────────────────────────────────────────────────
(defn build-test-repo
  ;; Returns a repo port map backed by an atom — isolated per test, not shared
  ;; [F#: buildTestRepo returns PurchaseOrderRepository + ResizeArray spy]
  ;; Clojure uses an atom for the mutable spy list — thread-safe, REPL-inspectable
  []
  (let [saved (atom [])]
    ;; => atom wraps an empty vector; swap! appends without mutation of the vector
    {:save (fn [po]
             (swap! saved conj po)
             ;; => Record the saved entity for post-call assertion
             {:ok true})
             ;; => Successful save always returns {:ok true} in this stub
     :load (fn [id]
             {:ok true
              :value (first (filter #(= (:id %) id) @saved))})
             ;; => Scan the accumulated saves — simulates a SELECT WHERE id = ?
     :spy saved}))
     ;; => Expose the atom so tests can dereference it for assertions

(defn fixed-clock
  ;; Returns a Clock port map whose :clock fn always returns the same timestamp
  ;; [F#: fixedClock : Clock = fun () -> DateTimeOffset(2026, 1, 15, ...)]
  []
  {:clock (fn [] "2026-01-15T09:00:00Z")})
  ;; => Always returns the same ISO string — deterministic test assertions

;; ── Test 1: valid L2 PO ──────────────────────────────────────────────────────
(def repo1 (build-test-repo))
;; => Fresh isolated repo — atom inside is empty; not shared with test 2
(def result1 (submit-po repo1 (fixed-clock) "po_001" "sup_001" 5000))
;; => 5000 → L2 approval level; save port called once
(println "Test 1 result:" result1)
;; => Output: Test 1 result: {:ok true, :value [{:id "po_001", ..., :status "AwaitingApproval-L2"} "2026-01-15T09:00:00Z"]}
(println "Test 1 saved count:" (count @(:spy repo1)))
;; => Output: Test 1 saved count: 1
(println "Test 1 saved status:" (:status (first @(:spy repo1))))
;; => Output: Test 1 saved status: AwaitingApproval-L2

;; ── Test 2: validation failure — no save ────────────────────────────────────
(def repo2 (build-test-repo))
;; => Fresh isolated repo — test 1 state not visible here
(def result2 (submit-po repo2 (fixed-clock) "" "sup_001" 500))
;; => Blank PO id — validation fails before the save port is ever called
(println "Test 2 result:" result2)
;; => Output: Test 2 result: {:ok false, :error "Blank PO Id"}
(println "Test 2 saved count:" (count @(:spy repo2)))
;; => Output: Test 2 saved count: 0  (save port was not called)
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── Shared types ───────────────────────────────────────────────────────────
interface PurchaseOrder {
  readonly id: string;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Aggregate root — same type across domain, application, and adapter layers

type PurchaseOrderRepo = {
  readonly save: (po: PurchaseOrder) => Promise;
  readonly findById: (id: string) => Promise;
};
// => Canonical port — in-memory adapter satisfies this type

type Clock = () => Date;
// => Time port — fixed in tests for deterministic assertions

// ── Application service under test ────────────────────────────────────────
const submitPO =
  (repo: PurchaseOrderRepo, clock: Clock) =>
  async (id: string, supplierId: string, amount: number): Promise => {
    // => Application service: parameterised by ports — injectable in all environments
    if (!id || id.trim() === "") return { ok: false, error: "Blank PO Id" };
    if (!supplierId || supplierId.trim() === "") return { ok: false, error: "Blank SupplierId" };
    if (amount <= 0) return { ok: false, error: "Non-positive amount" };
    const level = amount <= 1000 ? "L1" : amount <= 10000 ? "L2" : "L3";
    // => Pure domain logic: approval level derived from amount
    const submittedAt = clock();
    // => Timestamp from injected Clock port — fixed in tests
    const po: PurchaseOrder = { id, supplierId, totalAmount: amount, status: `AwaitingApproval-${level}` };
    // => State: Draft → AwaitingApproval-{level}
    const saveResult = await repo.save(po);
    // => Output port call: persist via injected adapter
    if (!saveResult.ok) return { ok: false, error: saveResult.error };
    return { ok: true, value: [po, submittedAt] };
    // => Return the saved PO and timestamp for caller inspection
  };

// ── In-memory adapters ─────────────────────────────────────────────────────
const buildTestRepo = () => {
  // => Isolated spy: records saves, returns expected data on findById
  const saved: PurchaseOrder[] = [];
  const repo: PurchaseOrderRepo = {
    save: async (po) => {
      saved.push(po);
      return { ok: true };
    },
    // => Record the saved PO for assertion
    findById: async (id) => ({ ok: true, value: saved.find((po) => po.id === id) ?? null }),
    // => Find in the accumulated saves — simulates SELECT query
  };
  return { repo, saved };
  // => Returns both the port and the spy array for assertions
};

const testFixedClock22: Clock = () => new Date("2026-01-15T09:00:00Z");
// => Always returns the same timestamp — assert on this literal value in tests

// ── Test 1: valid L2 PO ────────────────────────────────────────────────────
const { repo: repo1, saved: saved1 } = buildTestRepo();
// => Fresh isolated repo — not shared with Test 2
const result1 = await submitPO(repo1, testFixedClock22)("po_001", "sup_001", 5000);
// => 5000 → L2 approval level
console.log("Test 1 result:", result1);
// => Output: Test 1 result: { ok: true, value: [{ id: 'po_001', ..., status: 'AwaitingApproval-L2' }, 2026-01-15T09:00:00.000Z] }
console.log("Test 1 saved count:", saved1.length);
// => Output: Test 1 saved count: 1
console.log("Test 1 saved status:", saved1[0].status);
// => Output: Test 1 saved status: AwaitingApproval-L2

// ── Test 2: validation failure — no save ──────────────────────────────────
const { repo: repo2, saved: saved2 } = buildTestRepo();
// => Fresh isolated repo — Test 1 state not visible here
const result2 = await submitPO(repo2, testFixedClock22)("", "sup_001", 500);
// => Blank PO Id — validation fails before any port call
console.log("Test 2 result:", result2);
// => Output: Test 2 result: { ok: false, error: 'Blank PO Id' }
console.log("Test 2 saved count:", saved2.length);
// => Output: Test 2 saved count: 0  (validation failed before repo.save was called)
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── Shared types ───────────────────────────────────────────────────────────
-- [F#: ResizeArray spy — Haskell uses IORef [a] for the same purpose]

module Procurement.Application.Tests where

import Data.Text (Text)
import qualified Data.Text as T
import Data.Time (UTCTime)
import Data.Time.Format.ISO8601 (iso8601ParseM)
import Data.IORef (IORef, newIORef, atomicModifyIORef', readIORef)

data PurchaseOrder = PurchaseOrder
  { poId :: Text, poSupplier :: Text, poTotal :: Double, poStatus :: Text }
  deriving (Show, Eq)
-- => Aggregate root — same type across domain, application, and adapter layers

data PurchaseOrderRepository = PurchaseOrderRepository
  { savePO :: PurchaseOrder -> IO (Either Text ())
  , loadPO :: Text          -> IO (Either Text (Maybe PurchaseOrder))
  }
-- => Canonical port — in-memory adapter satisfies this type

type Clock = IO UTCTime
-- => Time port — fixed in tests for deterministic assertions

-- ── Application service under test ────────────────────────────────────────
submitPO :: PurchaseOrderRepository -> Clock
         -> Text -> Text -> Double
         -> IO (Either Text (PurchaseOrder, UTCTime))
submitPO repo clock i supp amount
  | T.null (T.strip i)    = pure (Left "Blank PO Id")
  | T.null (T.strip supp) = pure (Left "Blank SupplierId")
  | amount <= 0           = pure (Left "Non-positive amount")
  | otherwise = do
      let level = if amount <= 1000 then "L1"
                  else if amount <= 10000 then "L2" else "L3"
      -- => Pure domain logic: approval level derived from amount
      submittedAt <- clock
      -- => Timestamp from injected Clock port — fixed in tests
      let po = PurchaseOrder i supp amount ("AwaitingApproval-" <> level)
      -- => State: Draft → AwaitingApproval-{level}
      saveResult <- savePO repo po
      -- => Output port call: persist via injected adapter
      pure $ case saveResult of
        Right () -> Right (po, submittedAt)
        Left  e  -> Left e

-- ── In-memory adapters ─────────────────────────────────────────────────────
buildTestRepo :: IO (PurchaseOrderRepository, IORef [PurchaseOrder])
buildTestRepo = do
  -- => Isolated spy: records saves, returns Nothing on load (or override)
  saved <- newIORef []
  let repo = PurchaseOrderRepository
        { savePO = \po -> do
            atomicModifyIORef' saved (\xs -> (xs ++ [po], ()))
            -- => Record the saved PO for assertion
            pure (Right ())
        , loadPO = \i -> do
            xs <- readIORef saved
            pure (Right (lookupBy (\p -> poId p == i) xs))
            -- => Find in the accumulated saves — simulates SELECT query
        }
  pure (repo, saved)
  -- => Returns both the port and the spy ref for assertions
  where
    lookupBy _ []     = Nothing
    lookupBy p (x:xs) = if p x then Just x else lookupBy p xs

fixedClock :: Clock
fixedClock = case iso8601ParseM "2026-01-15T09:00:00Z" of
  Just t  -> pure t
  Nothing -> error "unreachable"
-- => Always returns the same timestamp — assert on this literal value in tests

-- ── Test 1: valid L2 PO ────────────────────────────────────────────────────
main :: IO ()
main = do
  (repo1, saved1) <- buildTestRepo
  -- => Fresh isolated repo — not shared with Test 2
  result1 <- submitPO repo1 fixedClock "po_001" "sup_001" 5000
  -- => 5000 → L2 approval level
  putStrLn ("Test 1 result: " <> show result1)
  -- => Output: Test 1 result: Right (PurchaseOrder {..., poStatus = "AwaitingApproval-L2"}, 2026-01-15 09:00:00 UTC)
  xs1 <- readIORef saved1
  putStrLn ("Test 1 saved count: " <> show (length xs1))
  -- => Output: Test 1 saved count: 1
  case xs1 of
    (p:_) -> putStrLn ("Test 1 saved status: " <> T.unpack (poStatus p))
    -- => Output: Test 1 saved status: AwaitingApproval-L2
    []    -> putStrLn "no saves"

  -- ── Test 2: validation failure — no save ──────────────────────────────
  (repo2, saved2) <- buildTestRepo
  -- => Fresh isolated repo — Test 1 state not visible here
  result2 <- submitPO repo2 fixedClock "" "sup_001" 500
  -- => Blank PO Id — validation fails before any port call
  putStrLn ("Test 2 result: " <> show result2)
  -- => Output: Test 2 result: Left "Blank PO Id"
  xs2 <- readIORef saved2
  putStrLn ("Test 2 saved count: " <> show (length xs2))
  -- => Output: Test 2 saved count: 0  (validation failed before save was called)
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: Application service tests use in-memory adapters to verify orchestration — which ports are called, with which arguments, in which order — without spinning up any infrastructure.

**Why It Matters**: Application service tests occupy the middle tier: faster than E2E tests, more comprehensive than domain tests. They verify that validation gates work before port calls, that domain logic computes the correct approval level, and that the result is correctly propagated. In-memory adapters with recording (spy pattern) enable assertions on the exact side effects: the test asserts not only the return value but also that exactly one PO was saved with the correct status. This tier is usually the highest-value testing investment in a hexagonal architecture codebase.

---

### Example 24: The Anti-Corruption Layer — Translating External DTOs

The anti-corruption layer (ACL) is a translation function in the adapter zone that converts external API responses into domain types. It prevents vendor-specific naming, types, and error codes from leaking into the domain.

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
// ── External supplier API response (adapter zone only) ────────────────────
// This type models EXACTLY what a hypothetical external supplier portal returns.
// It uses their naming conventions and types — not the domain's.
type SupplierAcknowledgementApiResponse = {
    // => External API shape — fields named by the supplier's engineering team
    reference_no   : string
    // => Their name for what we call PurchaseOrderId
    acknowledged_at: string
    // => ISO8601 string — not DateTimeOffset
    status_code    : int
    // => 200 = acknowledged, 404 = unknown PO, 500 = system error
    error_message  : string option
    // => Non-None on failure — sometimes "" even on success
}

// ── Domain types (domain zone) ────────────────────────────────────────────
type PurchaseOrderId = string
// => Our identifier — format po_<uuid>
type AcknowledgementResult =
    | Acknowledged of { PoId: PurchaseOrderId; AcknowledgedAt: System.DateTimeOffset }
    // => Supplier confirmed receipt of the PO
    | UnknownPO of PurchaseOrderId
    // => Supplier has no record of this PO
    | SupplierSystemError of string
    // => Supplier's system is unavailable — caller may retry

// ── Anti-corruption layer: translate external response → domain type ───────
// Lives in the adapter zone — never in the application or domain zones.
let toAcknowledgementResult
    (poId: PurchaseOrderId)
    (resp: SupplierAcknowledgementApiResponse)
    : AcknowledgementResult =
    // => Translates the external API shape into domain vocabulary
    match resp.status_code with
    | 200 ->
        let acknowledgedAt =
            match System.DateTimeOffset.TryParse(resp.acknowledged_at) with
            | true, dt -> dt
            // => Parse succeeded — use the supplier's timestamp
            | false, _ -> System.DateTimeOffset.UtcNow
            // => Parse failed (malformed timestamp) — fall back to current time
        Acknowledged { PoId = poId; AcknowledgedAt = acknowledgedAt }
        // => Map 200 + timestamp → domain Acknowledged case
    | 404 ->
        UnknownPO poId
        // => Map 404 → domain UnknownPO case; suppress vendor error_message
    | code ->
        let msg = resp.error_message |> Option.defaultValue (sprintf "HTTP %d" code)
        // => Extract message or construct a generic one from the status code
        SupplierSystemError msg
        // => Map all other codes → domain SupplierSystemError case

// ── Demonstration ──────────────────────────────────────────────────────────
let successResp = { reference_no = "po_001"; acknowledged_at = "2026-01-15T09:00:00Z"
                    status_code = 200; error_message = None }
// => Simulates a successful supplier acknowledgement response

let successDomain = toAcknowledgementResult "po_001" successResp
// => successDomain : AcknowledgementResult = Acknowledged { PoId = "po_001"; AcknowledgedAt = ... }
printfn "Success: %A" successDomain
// => Output: Success: Acknowledged { PoId = "po_001"; AcknowledgedAt = 2026-01-15 09:00:00 +00:00 }

let unknownResp = { reference_no = "po_999"; acknowledged_at = ""
                    status_code = 404; error_message = Some "Not found" }
// => Simulates a 404 response for an unknown PO
let unknownDomain = toAcknowledgementResult "po_999" unknownResp
// => unknownDomain : AcknowledgementResult = UnknownPO "po_999"
printfn "Unknown: %A" unknownDomain
// => Output: Unknown: UnknownPO "po_999"
```

{{< /tab >}}

{{< tab >}}

```clojure
;; ── External supplier API response (adapter zone only) ───────────────────
;; [F#: record type SupplierAcknowledgementApiResponse — named, statically typed fields]
;; Clojure models the external response as a plain map using the vendor's key names.
;; No type declaration: the shape is documented here and enforced by the ACL function.

;; A sample external API response map — vendor naming conventions, not domain conventions:
;; {:reference_no "po_001"        ;; => their name for our PurchaseOrderId
;;  :acknowledged_at "2026-01-15T09:00:00Z"  ;; => ISO8601 string, not a date object
;;  :status_code 200              ;; => 200=acknowledged, 404=unknown, 500=system error
;;  :error_message nil}           ;; => non-nil on failure; sometimes "" even on success

;; ── Domain result shapes (domain zone) ─────────────────────────────────────
;; [F#: discriminated union AcknowledgementResult with three cases]
;; Clojure represents domain results as maps with a :type dispatch key.
;; ; [F#: DU — exhaustive compile-time check; Clojure: open map dispatch at runtime]

;; ── Anti-corruption layer: translate external map → domain result map ───────
;; Lives in the adapter namespace — never required from domain or application namespaces.
(defn to-acknowledgement-result
  ;; Translates the external vendor API map into domain vocabulary
  ;; [F#: returns typed AcknowledgementResult DU case — compiler validates exhaustiveness]
  ;; Clojure returns a tagged map; cond covers all known status-code cases
  [po-id resp]
  (cond
    (= (:status_code resp) 200)
    ;; => HTTP 200: supplier confirmed receipt — build the domain Acknowledged map
    (let [acknowledged-at (or (:acknowledged_at resp) "unknown")]
      ;; => Use the vendor's timestamp string; fall back to "unknown" if blank
      {:type :acknowledged
       :po-id po-id
       :acknowledged-at acknowledged-at})
      ;; => Domain map: :type keyword identifies the variant (replaces DU case tag)

    (= (:status_code resp) 404)
    ;; => HTTP 404: supplier has no record of this PO
    {:type :unknown-po :po-id po-id}
    ;; => Suppress vendor :error_message; domain caller gets a clean domain term

    :else
    ;; => All other status codes: supplier system error — caller may retry
    (let [msg (or (:error_message resp)
                  (str "HTTP " (:status_code resp)))]
      ;; => Extract message or construct a generic one from the status code
      {:type :supplier-system-error :message msg})))
      ;; => [F#: SupplierSystemError of string — same semantics, no type wrapper]

;; ── Demonstration ──────────────────────────────────────────────────────────
(def success-resp
  ;; Simulates a successful supplier acknowledgement response map
  {:reference_no "po_001"
   :acknowledged_at "2026-01-15T09:00:00Z"
   :status_code 200
   :error_message nil})
;; => Vendor shape: snake_case keys, integer status, ISO string timestamp

(def success-domain (to-acknowledgement-result "po_001" success-resp))
;; => success-domain = {:type :acknowledged, :po-id "po_001", :acknowledged-at "2026-01-15T09:00:00Z"}
(println "Success:" success-domain)
;; => Output: Success: {:type :acknowledged, :po-id "po_001", :acknowledged-at "2026-01-15T09:00:00Z"}

(def unknown-resp
  ;; Simulates a 404 response for a PO the supplier does not recognise
  {:reference_no "po_999"
   :acknowledged_at ""
   :status_code 404
   :error_message "Not found"})
;; => Vendor 404 — their error_message is suppressed by the ACL

(def unknown-domain (to-acknowledgement-result "po_999" unknown-resp))
;; => unknown-domain = {:type :unknown-po, :po-id "po_999"}
(println "Unknown:" unknown-domain)
;; => Output: Unknown: {:type :unknown-po, :po-id "po_999"}
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── External supplier API response (adapter zone only) ─────────────────────
// This interface models EXACTLY what a hypothetical external supplier portal returns.
// It uses their naming conventions and types — not the domain's.
interface SupplierAcknowledgementApiResponse {
  // => External API shape — fields named by the supplier's engineering team
  readonly reference_no: string;
  // => Their name for what we call PurchaseOrderId
  readonly acknowledged_at: string;
  // => ISO8601 string — not Date
  readonly status_code: number;
  // => 200 = acknowledged, 404 = unknown PO, 500 = system error
  readonly error_message: string | null;
  // => Non-null on failure — sometimes "" even on success
}

// ── Domain types (domain zone) ─────────────────────────────────────────────
type POId = string & { readonly _brand: "POId" };
// => Our identifier — format po_<uuid>

type AcknowledgementResult =
  | { readonly kind: "Acknowledged"; readonly poId: POId; readonly acknowledgedAt: string }
  // => Supplier confirmed receipt of the PO
  | { readonly kind: "UnknownPO"; readonly poId: POId }
  // => Supplier has no record of this PO
  | { readonly kind: "SupplierSystemError"; readonly message: string };
// => Supplier's system is unavailable — caller may retry

// ── Anti-corruption layer: translate external response → domain type ───────
// Lives in the adapter zone — never in the application or domain zones.
const toAcknowledgementResult = (poId: POId, resp: SupplierAcknowledgementApiResponse): AcknowledgementResult => {
  // => Translates the external API shape into domain vocabulary
  if (resp.status_code === 200) {
    const acknowledgedAt = resp.acknowledged_at || new Date().toISOString();
    // => Use supplier's timestamp; fall back to current time if blank
    return { kind: "Acknowledged", poId, acknowledgedAt };
    // => Map 200 + timestamp → domain Acknowledged case
  }
  if (resp.status_code === 404) {
    return { kind: "UnknownPO", poId };
    // => Map 404 → domain UnknownPO case; suppress vendor error_message
  }
  const msg = resp.error_message || `HTTP ${resp.status_code}`;
  // => Extract message or construct a generic one from the status code
  return { kind: "SupplierSystemError", message: msg };
  // => Map all other codes → domain SupplierSystemError case
};

// ── Demonstration ──────────────────────────────────────────────────────────
const successResp: SupplierAcknowledgementApiResponse = {
  reference_no: "po_001",
  acknowledged_at: "2026-01-15T09:00:00Z",
  status_code: 200,
  error_message: null,
  // => Simulates a successful supplier acknowledgement response
};

const successDomain = toAcknowledgementResult("po_001" as POId, successResp);
// => successDomain: AcknowledgementResult = { kind: "Acknowledged", poId: "po_001", acknowledgedAt: "2026-01-15T09:00:00Z" }
console.log("Success:", successDomain);
// => Output: Success: { kind: 'Acknowledged', poId: 'po_001', acknowledgedAt: '2026-01-15T09:00:00Z' }

const unknownResp: SupplierAcknowledgementApiResponse = {
  reference_no: "po_999",
  acknowledged_at: "",
  status_code: 404,
  error_message: "Not found",
  // => Simulates a 404 response for an unknown PO
};
const unknownDomain = toAcknowledgementResult("po_999" as POId, unknownResp);
// => unknownDomain: AcknowledgementResult = { kind: "UnknownPO", poId: "po_999" }
console.log("Unknown:", unknownDomain);
// => Output: Unknown: { kind: 'UnknownPO', poId: 'po_999' }
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── External supplier API response (adapter zone only) ────────────────────
-- [F#: SupplierAcknowledgementApiResponse record — Haskell uses a record with vendor fields]

module Procurement.Adapters.SupplierACL where

import Data.Text (Text)
import Data.Time (UTCTime, getCurrentTime)
import Data.Time.Format.ISO8601 (iso8601ParseM)

data SupplierAckApiResponse = SupplierAckApiResponse
  -- => External API shape — fields named by the supplier's engineering team
  { srReferenceNo    :: Text
  -- => Their name for what we call PurchaseOrderId
  , srAcknowledgedAt :: Text
  -- => ISO8601 string — not UTCTime
  , srStatusCode     :: Int
  -- => 200 = acknowledged, 404 = unknown PO, 500 = system error
  , srErrorMessage   :: Maybe Text
  -- => Just on failure; sometimes Nothing or Just "" even on success
  }

-- ── Domain types (domain zone) ────────────────────────────────────────────
newtype PurchaseOrderId = PurchaseOrderId Text deriving (Show, Eq)
-- => Our identifier — format po_<uuid>

data AcknowledgementResult
  = Acknowledged PurchaseOrderId UTCTime
  -- => Supplier confirmed receipt of the PO
  | UnknownPO PurchaseOrderId
  -- => Supplier has no record of this PO
  | SupplierSystemError Text
  -- => Supplier's system is unavailable — caller may retry
  deriving (Show)

-- ── Anti-corruption layer: translate external response → domain type ───────
-- Lives in the adapter zone — never in the application or domain zones.
toAcknowledgementResult :: PurchaseOrderId -> SupplierAckApiResponse
                        -> IO AcknowledgementResult
-- => IO because timestamp parsing fallback may call getCurrentTime
toAcknowledgementResult poid resp = case srStatusCode resp of
  200 -> do
    parsed <- case iso8601ParseM (Data.Text.unpack (srAcknowledgedAt resp)) of
      Just t  -> pure t
      -- => Parse succeeded — use the supplier's timestamp
      Nothing -> getCurrentTime
      -- => Parse failed (malformed timestamp) — fall back to current time
    pure (Acknowledged poid parsed)
    -- => Map 200 + timestamp → domain Acknowledged case
  404 ->
    pure (UnknownPO poid)
    -- => Map 404 → domain UnknownPO case; suppress vendor error_message
  code ->
    let msg = case srErrorMessage resp of
                Just m  -> m
                Nothing -> "HTTP " <> Data.Text.pack (show code)
        -- => Extract message or construct a generic one from the status code
    in pure (SupplierSystemError msg)
    -- => Map all other codes → domain SupplierSystemError case

-- ── Demonstration ──────────────────────────────────────────────────────────
main :: IO ()
main = do
  let successResp = SupplierAckApiResponse
        { srReferenceNo    = "po_001"
        , srAcknowledgedAt = "2026-01-15T09:00:00Z"
        , srStatusCode     = 200
        , srErrorMessage   = Nothing
        }
  -- => Simulates a successful supplier acknowledgement response
  successDomain <- toAcknowledgementResult (PurchaseOrderId "po_001") successResp
  -- => successDomain :: AcknowledgementResult = Acknowledged (PurchaseOrderId "po_001") ...
  putStrLn ("Success: " <> show successDomain)
  -- => Output: Success: Acknowledged (PurchaseOrderId "po_001") 2026-01-15 09:00:00 UTC

  let unknownResp = SupplierAckApiResponse
        { srReferenceNo    = "po_999"
        , srAcknowledgedAt = ""
        , srStatusCode     = 404
        , srErrorMessage   = Just "Not found"
        }
  -- => Simulates a 404 response for an unknown PO
  unknownDomain <- toAcknowledgementResult (PurchaseOrderId "po_999") unknownResp
  -- => unknownDomain :: AcknowledgementResult = UnknownPO (PurchaseOrderId "po_999")
  putStrLn ("Unknown: " <> show unknownDomain)
  -- => Output: Unknown: UnknownPO (PurchaseOrderId "po_999")
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: The anti-corruption layer translates external API responses into clean domain types inside the adapter, shielding the domain from vendor naming conventions and error codes.

**Why It Matters**: Without an ACL, external API quirks (integer status codes, string timestamps, mixed naming conventions) leak into domain types. When the supplier changes their API (new status codes, renamed fields), the change propagates through the entire codebase. With an ACL, the change is isolated to the translation function in the adapter. The domain and application service are unaffected. In procurement systems that integrate with multiple supplier portals — each with different API conventions — the ACL pattern is not optional; it is the only way to keep the domain model coherent.

---

### Example 25: Full Hexagonal Flow — HTTP to Domain to Repository to Response

This example combines all concepts into one end-to-end flow within the `purchasing` bounded context: HTTP adapter receives a request, calls the `SubmitPurchaseOrderUseCase` input port, the application service calls pure domain functions and output ports, and the result flows back to an HTTP response.

```mermaid
graph TD
    accTitle: Example 25: Full Hexagonal Flow — HTTP to Domain to Repository to Response
    accDescr: Graph with 9 nodes and 8 connections. Nodes: HTTP POST /purchase-orders HttpPoDto, HTTP Adapter toDomainInput, SubmitPurchaseOrder UseCase (input port), validatePO domain fn — pure, determineApproval Level domain fn — pure, PORepository.save output port, Clock output port, HTTP Adapter toHttpResponse, HTTP 201 HttpPoResponse. Connections: HTTP POST /purchase-orders HttpPoDto to HTTP Adapter toDomainInput, HTTP Adapter toDomainInput to SubmitPurchaseOrder UseCase (input port) (DraftPO), SubmitPurchaseOrder UseCase (input port) to validatePO domain fn — pure, validatePO domain fn — pure to determineApproval Level domain fn — pure (ValidatedPO), determineApproval Level domain fn — pure to PORepository.save output port (ApprovalLevel), Clock output port to PORepository.save output port (DateTimeOffset), PORepository.save output port to HTTP Adapter toHttpResponse (Ok ()), HTTP Adapter toHttpResponse to HTTP 201 HttpPoResponse.
    REQ["HTTP POST<br/>/purchase-orders<br/>HttpPoDto"]
    PARSE["HTTP Adapter<br/>toDomainInput"]
    UC["SubmitPurchaseOrder<br/>UseCase<br/>(input port)"]
    VAL["validatePO<br/>domain fn — pure"]
    LVL["determineApproval<br/>Level<br/>domain fn — pure"]
    SAVE["PORepository.save<br/>output port"]
    CLK["Clock<br/>output port"]
    MAP["HTTP Adapter<br/>toHttpResponse"]
    RESP["HTTP 201<br/>HttpPoResponse"]

    REQ --> PARSE
    PARSE -- "DraftPO" --> UC
    UC --> VAL
    VAL -- "ValidatedPO" --> LVL
    LVL -- "ApprovalLevel" --> SAVE
    CLK -- "DateTimeOffset" --> SAVE
    SAVE -- "Ok ()" --> MAP
    MAP --> RESP

    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class REQ pal-DE8F05
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PARSE pal-CA9161
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class UC pal-0173B2
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class VAL pal-029E73
    class LVL pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class SAVE pal-CC78BC
    class CLK pal-CC78BC
    class MAP pal-CA9161
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class RESP pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

{{< tabs items="F#,Clojure,TypeScript,Haskell" >}}

{{< tab >}}

```fsharp
open System
open System.Collections.Generic

// ── ZONE 1: Domain (innermost — no external imports) ──────────────────────
// Domain types and pure functions. No Npgsql, no ASP.NET, no JSON.
module Domain

type PurchaseOrderId = string
// => PO primary key — format po_<uuid>

type DraftPurchaseOrder = { Id: PurchaseOrderId; SupplierId: string; TotalAmount: decimal }
// => Raw input from any delivery mechanism — nothing validated yet

type PurchaseOrder = { Id: PurchaseOrderId; SupplierId: string
                       TotalAmount: decimal; Status: string }
// => Aggregate after validation — carries the approval-level status

type ApprovalLevel = L1 | L2 | L3
// => Derived from PO total: L1 ≤ $1k, L2 ≤ $10k, L3 > $10k

type SubmissionError = ValidationError of string | RepositoryError of string
// => All named failure modes — exhaustively matched at adapter boundaries

// Pure domain functions — no async, no I/O, no effects
let determineApprovalLevel (total: decimal) =
    if total <= 1000m then L1
    // => L1: manager approval threshold
    elif total <= 10000m then L2
    // => L2: department head approval threshold
    else L3
    // => L3: CFO / executive approval threshold — required for high-value POs

let validateDraft (input: DraftPurchaseOrder) : Result<DraftPurchaseOrder, SubmissionError> =
    if String.IsNullOrWhiteSpace(input.Id)          then Error (ValidationError "PO Id blank")
    // => Domain rule: blank PO ID is not permitted
    elif String.IsNullOrWhiteSpace(input.SupplierId) then Error (ValidationError "SupplierId blank")
    // => Domain rule: supplier must be specified
    elif input.TotalAmount <= 0m then Error (ValidationError "TotalAmount must be positive")
    // => Domain rule: PO must have positive value
    else Ok input
    // => All rules passed — return the validated draft
```

```fsharp
// ── ZONE 2: Application (middle — imports Domain only) ────────────────────
// Port type aliases and application service orchestration.
// open Domain   ← the only open statement in this zone

type PurchaseOrderRepository = {
    // => Canonical output port — identical signature across all examples
    save: PurchaseOrder -> Async<Result<unit, SubmissionError>>
    load: PurchaseOrderId -> Async<Result<PurchaseOrder option, SubmissionError>>
}
// => Adapters implement this; the application service calls it

type Clock = unit -> DateTimeOffset
// => Time port — synchronous, infallible

type SubmitPurchaseOrderUseCase =
    DraftPurchaseOrder -> Async<Result<PurchaseOrder, SubmissionError>>
// => Input port: the complete contract for the SubmitPurchaseOrder workflow

// Application service: orchestrates domain calls and port calls
let buildSubmitPO (repo: PurchaseOrderRepository) (clock: Clock) : SubmitPurchaseOrderUseCase =
    // => Partial application: bake the output ports in, return the input port function
    fun input ->
        // => input : DraftPurchaseOrder — the single entry point for the workflow
        async {
            // Step 1: pure domain validation — no I/O
            match validateDraft input with
            | Error e -> return Error e
            // => Validation failed — short-circuit before any port calls
            | Ok draft ->
            // Step 2: pure domain logic — approval level
            let level = determineApprovalLevel draft.TotalAmount
            // => Approval level derived from total — pure, instant, no I/O
            let now = clock ()
            // => Timestamp from the Clock port — deterministic in tests
            let po = { Id = draft.Id; SupplierId = draft.SupplierId
                       TotalAmount = draft.TotalAmount
                       Status = sprintf "AwaitingApproval-%A" level }
            // => State transition: Draft → AwaitingApproval-{L1|L2|L3}
            // Step 3: output port — save to repository (effectful)
            let! saveResult = repo.save po
            // => Calls the injected adapter — could be Postgres or in-memory
            return saveResult |> Result.map (fun () -> po)
            // => Return the saved PO or the infrastructure error
        }
```

```fsharp
// ── ZONE 3: Adapters (outer — imports Application and infrastructure libs) ─
// HTTP adapter, repository adapter — all in the adapters zone.
// open Application; open Npgsql; open Microsoft.AspNetCore.Http

// ── DTO types (adapter zone — JSON shape) ─────────────────────────────────
type HttpPoDto     = { po_id: string; supplier_id: string; total_amount: float }
// => Mirrors the JSON request body — snake_case, float amounts (JSON spec)
type HttpPoResponse = { po_id: string; status: string }
// => JSON response shape — confirms the submitted PO and its approval status

// Inbound translation: DTO → domain input type
let toDomainInput (dto: HttpPoDto) : DraftPurchaseOrder =
    { Id = dto.po_id; SupplierId = dto.supplier_id; TotalAmount = decimal dto.total_amount }
// => Field name alignment + float → decimal type conversion
// => toDomainInput : HttpPoDto -> DraftPurchaseOrder — pure mapping, no side effects

// Outbound translation: domain PO → response DTO
let toHttpResponse (po: PurchaseOrder) : HttpPoResponse =
    { po_id = po.Id; status = po.Status }
// => PascalCase domain → snake_case JSON; decimal → float already done for JSON

// HTTP handler: thin adapter — translate, delegate, map
let httpHandler (useCase: SubmitPurchaseOrderUseCase) (dto: HttpPoDto) =
    // => useCase: the input port injected from the composition root
    // => dto: the parsed JSON body (deserialization is the framework's job)
    async {
        let input  = toDomainInput dto
        // => Translate HTTP DTO to domain input type (adapter responsibility)
        let! result = useCase input
        // => Call the input port — application service handles all logic
        return
            match result with
            | Ok po ->
                let response = toHttpResponse po
                // => Translate each domain PO to a response DTO
                sprintf "201 Created: %A" response
                // => Real adapter would serialize to JSON and return IActionResult 201
            | Error (ValidationError msg) ->
                sprintf "422 Unprocessable: %s" msg
                // => Domain validation error → HTTP 422
            | Error (RepositoryError msg) ->
                sprintf "503 Service Unavailable: %s" msg
                // => Repository failure → HTTP 503

    }

// ── Composition root: wire adapters to ports ──────────────────────────────
let store = Dictionary<string, PurchaseOrder>()
// => In-memory store (simulates Postgres for this demonstration)

let inMemRepo : PurchaseOrderRepository = {
    // => Satisfies PurchaseOrderRepository port — Dictionary operations simulate SQL
    save = fun po ->
        async { store.[po.Id] <- po; return Ok () }
    // => Repository adapter: writes to the Dictionary store
    load = fun id ->
        async {
            match store.TryGetValue(id) with
            | true, po -> return Ok (Some po)
            | _        -> return Ok None }
    // => Repository adapter: reads from the Dictionary store
}
let fixedClock : Clock = fun () -> DateTimeOffset(2026, 1, 15, 9, 0, 0, TimeSpan.Zero)
// => Fixed clock adapter: deterministic timestamp for this demonstration

let productionUseCase : SubmitPurchaseOrderUseCase = buildSubmitPO inMemRepo fixedClock
// => Input port function: ports baked in via partial application

// ── Full flow demonstration ────────────────────────────────────────────────
let request = { po_id = "po_full-001"; supplier_id = "sup_acme-1"; total_amount = 7500.0 }
// => Sample HTTP request body — $7,500 PO → L2 approval required

let response = httpHandler productionUseCase request |> Async.RunSynchronously
// => Runs the full hexagonal flow: HTTP → Application → Domain → Repository → HTTP
printfn "%s" response
// => Output: 201 Created: { po_id = "po_full-001"; status = "AwaitingApproval-L2" }

// Verify the PO was persisted in the in-memory store
printfn "Stored POs: %d" store.Count
// => Output: Stored POs: 1
printfn "Stored status: %s" store.["po_full-001"].Status
// => Output: Stored status: AwaitingApproval-L2
```

{{< /tab >}}

{{< tab >}}

**Zone 1 — Domain (pure functions, no infrastructure imports):**

```clojure
;; ── ZONE 1: Domain namespace — no infrastructure requires ───────────────────
;; [F#: module Domain — zero external imports; only F# core]
;; Clojure: a plain namespace with no :require of Ring, JDBC, or any I/O lib.

(ns procurement.domain)

;; Domain pure functions — no I/O, no atoms, no side effects

(defn determine-approval-level
  ;; Pure function: amount → keyword naming the approval tier
  ;; [F#: returns DU case L1/L2/L3 — exhaustive at compile time]
  ;; Clojure: returns a keyword; cond covers all cases
  [total]
  (cond
    (<= total 1000) :l1
    ;; => :l1 — manager tier; POs up to $1,000
    (<= total 10000) :l2
    ;; => :l2 — department head tier; POs $1,001–$10,000
    :else :l3))
    ;; => :l3 — CFO tier; high-value POs above $10,000

(defn validate-draft
  ;; Pure validation: draft map → {:ok true :value ...} or {:ok false :error ...}
  ;; [F#: returns Result<DraftPurchaseOrder, SubmissionError> — typed error union]
  ;; Clojure uses a tagged result map; cond mirrors the F# guard chain
  [input]
  (cond
    (clojure.string/blank? (:id input))
    ;; => Domain rule: blank PO id is not permitted
    {:ok false :error {:type :validation-error :message "PO Id blank"}}
    (clojure.string/blank? (:supplier-id input))
    ;; => Domain rule: supplier must be specified
    {:ok false :error {:type :validation-error :message "SupplierId blank"}}
    (<= (:total-amount input) 0)
    ;; => Domain rule: PO must have a positive monetary value
    {:ok false :error {:type :validation-error :message "TotalAmount must be positive"}}
    :else
    ;; => All rules passed — return the validated draft input unchanged
    {:ok true :value input}))
```

**Zone 2 — Application (orchestrates domain + ports, no infrastructure):**

```clojure
;; ── ZONE 2: Application namespace — requires domain only ────────────────────
;; [F#: open Domain — the only open in this zone]
;; Clojure: :require procurement.domain; no Ring, no JDBC

(ns procurement.application
  (:require [procurement.domain :as domain]))

;; Port contracts are documented as maps-of-functions — no defprotocol needed here.
;; [F#: PurchaseOrderRepository record type — named, statically typed port]
;; Port shape: {:save (fn [po] ...) :load (fn [id] ...)}
;; [F#: Clock = unit -> DateTimeOffset — synchronous, infallible time port]
;; Port shape: {:clock (fn [] ...)}

(defn build-submit-po
  ;; Higher-order function: receives port maps, returns the use-case function
  ;; [F#: buildSubmitPO — partial application bakes ports into the returned fn]
  ;; Clojure: closing over repo and clock in the returned fn is the equivalent
  [repo clock]
  (fn [input]
    ;; => input: draft map {:id ... :supplier-id ... :total-amount ...}
    (let [validation (domain/validate-draft input)]
      ;; => Step 1: pure domain validation — no I/O occurs here
      (if-not (:ok validation)
        validation
        ;; => Validation failed — return error map, no port called
        (let [draft (:value validation)
              level (domain/determine-approval-level (:total-amount draft))
              ;; => Step 2: pure domain logic — approval tier derived from amount
              now ((:clock clock))
              ;; => Step 3: Clock port call — fixed value in tests
              po (assoc draft
                        :status (str "AwaitingApproval-" (name level))
                        :submitted-at now)]
              ;; => State transition: draft → AwaitingApproval-{l1|l2|l3}
          (let [save-result ((:save repo) po)]
            ;; => Step 4: Repository port call — persists the PO via the injected adapter
            (if (:ok save-result)
              {:ok true :value po}
              ;; => Return the saved entity on success
              save-result)))))))
              ;; => Propagate repository error unchanged
```

**Zone 3 — Adapters (HTTP translation + repository + composition root):**

```clojure
;; ── ZONE 3: Adapters namespace — requires application and infrastructure ────
;; [F#: open Application; open Npgsql; open Microsoft.AspNetCore.Http]
;; Clojure: :require procurement.application plus Ring/JDBC libs in real code

(ns procurement.adapters
  (:require [procurement.application :as app]))

;; ── DTO → domain input translation (inbound ACL) ───────────────────────────
(defn to-domain-input
  ;; Translates the HTTP request map to a domain draft map
  ;; [F#: toDomainInput — pure mapping, no side effects]
  ;; Clojure: keyword rename + type coercion in a single map literal
  [dto]
  {:id (:po_id dto)
   ;; => snake_case HTTP key → kebab-case domain key
   :supplier-id (:supplier_id dto)
   ;; => Rename to domain vocabulary
   :total-amount (double (:total_amount dto))})
   ;; => Preserve numeric value; domain uses double here for simplicity

;; ── Domain PO → HTTP response translation (outbound ACL) ───────────────────
(defn to-http-response
  ;; Translates the domain PO map to the HTTP response DTO map
  ;; [F#: toHttpResponse — PascalCase domain → snake_case JSON]
  [po]
  {:po_id (:id po) :status (:status po)})
  ;; => Only expose the fields the HTTP client needs; strip internal fields

;; ── HTTP handler: thin adapter — translate, delegate, map ──────────────────
(defn http-handler
  ;; Thin adapter: translate DTO → call use-case → map result → HTTP response string
  ;; [F#: httpHandler — same three-step pattern: toDomainInput, useCase, match result]
  [use-case dto]
  (let [input (to-domain-input dto)
        ;; => Translate HTTP DTO to domain input (adapter responsibility)
        result (use-case input)]
        ;; => Call the input port — application service handles all domain logic
    (if (:ok result)
      (let [response (to-http-response (:value result))]
        ;; => Translate domain PO to response DTO
        (str "201 Created: " response))
        ;; => Real adapter would return a Ring response map with JSON body
      (let [err (:error result)]
        (cond
          (= :validation-error (:type err))
          (str "422 Unprocessable: " (:message err))
          ;; => Domain validation error → HTTP 422
          :else
          (str "503 Service Unavailable: " (:message err)))))))
          ;; => Repository / infrastructure error → HTTP 503

;; ── Composition root: wire adapters to ports ────────────────────────────────
(def store (atom {}))
;; => In-memory store backed by an atom — simulates Postgres for this demonstration

(def in-mem-repo
  ;; Satisfies the repository port contract — atom operations simulate SQL
  ;; [F#: inMemRepo : PurchaseOrderRepository — Dictionary simulates Postgres]
  {:save (fn [po]
           (swap! store assoc (:id po) po)
           ;; => Upsert: associate the PO id with the PO map in the atom
           {:ok true})
           ;; => Always returns success in this in-memory stub
   :load (fn [id]
           {:ok true :value (get @store id)})})
           ;; => Dereference atom and look up by id — returns nil if not found

(def fixed-clock
  ;; Fixed clock port: always returns the same timestamp for deterministic demos
  ;; [F#: fixedClock : Clock = fun () -> DateTimeOffset(2026, 1, 15, ...)]
  {:clock (fn [] "2026-01-15T09:00:00Z")})

(def production-use-case
  ;; Input port function with ports baked in via closure
  ;; [F#: buildSubmitPO inMemRepo fixedClock — partial application]
  (app/build-submit-po in-mem-repo fixed-clock))

;; ── Full flow demonstration ──────────────────────────────────────────────────
(def request
  ;; Sample HTTP request body map — $7,500 PO → :l2 approval required
  {:po_id "po_full-001" :supplier_id "sup_acme-1" :total_amount 7500.0})

(def response (http-handler production-use-case request))
;; => Runs the full hexagonal flow: HTTP adapter → use-case → domain → repo → HTTP
(println response)
;; => Output: 201 Created: {:po_id "po_full-001", :status "AwaitingApproval-l2"}

;; Verify the PO was persisted in the in-memory atom store
(println "Stored POs:" (count @store))
;; => Output: Stored POs: 1
(println "Stored status:" (:status (get @store "po_full-001")))
;; => Output: Stored status: AwaitingApproval-l2
```

{{< /tab >}}

{{< tab >}}

```typescript
// ── ZONE 1: Domain (innermost — no external imports) ──────────────────────
// domain types and pure functions — no pg, no express, no axios.

type POId = string & { readonly _brand: "POId" };
// => PO primary key — branded to prevent stringly-typed confusion

interface DraftPurchaseOrder {
  readonly id: POId;
  readonly supplierId: string;
  readonly totalAmount: number;
}
// => Raw input from any delivery mechanism — nothing validated yet

interface PurchaseOrder {
  readonly id: POId;
  readonly supplierId: string;
  readonly totalAmount: number;
  readonly status: string;
}
// => Aggregate after validation — carries the approval-level status

type ApprovalLevel = "L1" | "L2" | "L3";
// => Derived from PO total: L1 ≤ $1k, L2 ≤ $10k, L3 > $10k

type SubmissionError =
  | { readonly kind: "ValidationError"; readonly message: string }
  | { readonly kind: "RepositoryError"; readonly message: string };
// => All named failure modes — exhaustively matched at adapter boundaries

type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
// => FP-style tagged union — used across all three zones

const determineApprovalLevel = (total: number): ApprovalLevel => {
  if (total <= 1000) return "L1";
  if (total <= 10000) return "L2";
  return "L3";
};

const validateDraft = (input: DraftPurchaseOrder): Result => {
  if (!input.id || (input.id as string).trim() === "")
    return { ok: false, error: { kind: "ValidationError", message: "PO Id blank" } };
  if (!input.supplierId || input.supplierId.trim() === "")
    return { ok: false, error: { kind: "ValidationError", message: "SupplierId blank" } };
  if (input.totalAmount <= 0)
    return { ok: false, error: { kind: "ValidationError", message: "TotalAmount must be positive" } };
  return { ok: true, value: input };
};

// ── ZONE 2: Application (middle — imports domain only) ─────────────────────
// port type aliases and application service orchestration.

type PurchaseOrderRepo = {
  readonly save: (po: PurchaseOrder) => Promise;
  readonly findById: (id: POId) => Promise;
};
// => Adapters implement this; the application service calls it

type Clock = () => Date;
// => Time port — synchronous, infallible

type SubmitPurchaseOrderUseCase = (draft: DraftPurchaseOrder) => Promise;
// => Input port: the complete contract for the SubmitPurchaseOrder workflow

const buildSubmitPurchaseOrder =
  (repo: PurchaseOrderRepo, clock: Clock): SubmitPurchaseOrderUseCase =>
  async (input: DraftPurchaseOrder): Promise => {
    const validation = validateDraft(input);
    if (!validation.ok) return validation;
    // => Validation failed — short-circuit before any port calls
    const level = determineApprovalLevel(validation.value.totalAmount);
    // => Approval level derived from total — pure, instant, no I/O
    const now = clock();
    // => Timestamp from the Clock port — deterministic in tests
    const po: PurchaseOrder = { ...validation.value, status: `AwaitingApproval-${level}` };
    // => State transition: Draft → AwaitingApproval-{L1|L2|L3}
    const saveResult = await repo.save(po);
    // => Calls the injected adapter — could be Postgres or in-memory
    if (!saveResult.ok) return saveResult;
    return { ok: true, value: po };
    // => Return the saved PO or the infrastructure error
  };

// ── ZONE 3: Adapters (outer — imports application and infrastructure libs) ─
// HTTP adapter, repository adapter — all in the adapters zone.

interface HttpPoDto {
  readonly po_id: string;
  readonly supplier_id: string;
  readonly total_amount: number;
}
// => Mirrors the JSON request body — snake_case
interface HttpPoResponse {
  readonly po_id: string;
  readonly status: string;
}
// => JSON response shape — confirms the submitted PO and its approval status

const toDomainInput = (dto: HttpPoDto): DraftPurchaseOrder => ({
  id: dto.po_id as POId,
  supplierId: dto.supplier_id,
  totalAmount: dto.total_amount,
  // => snake_case → camelCase + type coercion
});

const toHttpResponse = (po: PurchaseOrder): HttpPoResponse => ({
  po_id: po.id,
  status: po.status,
  // => camelCase domain → snake_case JSON
});

const httpHandlerFull =
  (useCase: SubmitPurchaseOrderUseCase) =>
  async (dto: HttpPoDto): Promise => {
    const input = toDomainInput(dto);
    // => Translate HTTP DTO to domain input type
    const result = await useCase(input);
    // => Call the input port — application service handles all logic
    if (result.ok) {
      const response = toHttpResponse(result.value);
      return `201 Created: ${JSON.stringify(response)}`;
      // => Real Express: res.status(201).json(response)
    }
    if (result.error.kind === "ValidationError") return `422 Unprocessable: ${result.error.message}`;
    return `503 Service Unavailable: ${result.error.message}`;
  };

// ── Composition root: wire adapters to ports ──────────────────────────────
const store25 = new Map<string, PurchaseOrder>();
// => In-memory store (simulates Postgres for this demonstration)

const inMemRepo25: PurchaseOrderRepo = {
  save: async (po) => {
    store25.set(po.id, po);
    return { ok: true, value: undefined };
  },
  findById: async (id) => {
    const po = store25.get(id);
    return { ok: true, value: po ?? null };
  },
};
const fixedClock25: Clock = () => new Date("2026-01-15T09:00:00Z");
// => Fixed clock adapter: deterministic timestamp for this demonstration

const productionUseCase25: SubmitPurchaseOrderUseCase = buildSubmitPurchaseOrder(inMemRepo25, fixedClock25);
// => Input port function: ports baked in via closure

// ── Full flow demonstration ────────────────────────────────────────────────
const request25: HttpPoDto = { po_id: "po_full-001", supplier_id: "sup_acme-1", total_amount: 7500 };
// => Sample HTTP request body — $7,500 PO → L2 approval required

const response25 = await httpHandlerFull(productionUseCase25)(request25);
// => Runs the full hexagonal flow: HTTP → Application → Domain → Repository → HTTP
console.log(response25);
// => Output: 201 Created: {"po_id":"po_full-001","status":"AwaitingApproval-L2"}

console.log("Stored POs:", store25.size);
// => Output: Stored POs: 1
console.log("Stored status:", store25.get("po_full-001")?.status);
// => Output: Stored status: AwaitingApproval-L2
```

{{< /tab >}}

{{< tab >}}

```haskell
-- ── ZONE 1: Domain (innermost — no external imports) ──────────────────────
-- [F#: three modules separated by zone — Haskell uses three modules with strict imports]

module Procurement.FullFlow where

import Data.Text (Text)
import qualified Data.Text as T
import Data.Time (UTCTime)
import Data.Time.Format.ISO8601 (iso8601ParseM)
import qualified Data.Map.Strict as Map
import Data.IORef (IORef, newIORef, atomicModifyIORef', readIORef)

newtype PurchaseOrderId = PurchaseOrderId Text deriving (Show, Eq, Ord)
-- => PO primary key — newtype prevents stringly-typed confusion

data DraftPurchaseOrder = DraftPurchaseOrder
  { dpoId :: PurchaseOrderId, dpoSupp :: Text, dpoTotal :: Double }
  deriving (Show)
-- => Raw input from any delivery mechanism — nothing validated yet

data PurchaseOrder = PurchaseOrder
  { poId :: PurchaseOrderId, poSupp :: Text, poTotal :: Double, poStatus :: Text }
  deriving (Show, Eq)
-- => Aggregate after validation — carries the approval-level status

data ApprovalLevel = L1 | L2 | L3 deriving (Show, Eq)
-- => Derived from PO total: L1 ≤ $1k, L2 ≤ $10k, L3 > $10k

data SubmissionError
  = ValidationError Text
  | RepositoryError Text
  deriving (Show)
-- => All named failure modes — exhaustively matched at adapter boundaries

determineApprovalLevel :: Double -> ApprovalLevel
determineApprovalLevel total
  | total <= 1000  = L1
  | total <= 10000 = L2
  | otherwise      = L3

validateDraft :: DraftPurchaseOrder -> Either SubmissionError DraftPurchaseOrder
validateDraft input
  | let PurchaseOrderId t = dpoId input, T.null (T.strip t) =
      Left (ValidationError "PO Id blank")
  | T.null (T.strip (dpoSupp input)) =
      Left (ValidationError "SupplierId blank")
  | dpoTotal input <= 0 =
      Left (ValidationError "TotalAmount must be positive")
  | otherwise = Right input
  -- => Returns validated draft or named error — no IO

-- ── ZONE 2: Application (middle — imports Domain only) ────────────────────
data PurchaseOrderRepository = PurchaseOrderRepository
  -- => Canonical output port — identical signature across all examples
  { savePO :: PurchaseOrder -> IO (Either SubmissionError ())
  , loadPO :: PurchaseOrderId -> IO (Either SubmissionError (Maybe PurchaseOrder))
  }
-- => Adapters implement this; the application service calls it

type Clock = IO UTCTime
-- => Time port — IO action; no Either (clocks do not fail)

type SubmitPurchaseOrderUseCase =
  DraftPurchaseOrder -> IO (Either SubmissionError PurchaseOrder)
-- => Input port: the complete contract for the SubmitPurchaseOrder workflow

buildSubmitPO :: PurchaseOrderRepository -> Clock -> SubmitPurchaseOrderUseCase
-- => Partial application: bake the output ports in, return the input port function
buildSubmitPO repo clock = \input ->
  case validateDraft input of
    Left e -> pure (Left e)
    -- => Validation failed — short-circuit before any port calls
    Right draft -> do
      let level = determineApprovalLevel (dpoTotal draft)
      -- => Approval level derived from total — pure, instant, no IO
      now <- clock
      -- => Timestamp from the Clock port — deterministic in tests
      let _ = now
      let po = PurchaseOrder
            { poId     = dpoId draft
            , poSupp   = dpoSupp draft
            , poTotal  = dpoTotal draft
            , poStatus = "AwaitingApproval-" <> T.pack (show level)
            }
      -- => State transition: Draft → AwaitingApproval-{L1|L2|L3}
      saveResult <- savePO repo po
      -- => Calls the injected adapter — could be Postgres or in-memory
      pure (fmap (const po) saveResult)
      -- => Return the saved PO or the infrastructure error

-- ── ZONE 3: Adapters (outer — imports Application and infrastructure libs) ─
data HttpPoDto = HttpPoDto { hPoId :: Text, hSupp :: Text, hTotal :: Double }
-- => Mirrors the JSON request body
data HttpPoResponse = HttpPoResponse { rPoId :: Text, rStatus :: Text } deriving (Show)
-- => JSON response shape

toDomainInput :: HttpPoDto -> DraftPurchaseOrder
toDomainInput dto = DraftPurchaseOrder (PurchaseOrderId (hPoId dto)) (hSupp dto) (hTotal dto)
-- => Field rename + newtype wrap — pure mapping, no side effects

toHttpResponse :: PurchaseOrder -> HttpPoResponse
toHttpResponse po = let PurchaseOrderId t = poId po
                    in HttpPoResponse t (poStatus po)
-- => Unwrap newtype + extract status; pure mapping

httpHandler :: SubmitPurchaseOrderUseCase -> HttpPoDto -> IO Text
httpHandler useCase dto = do
  let input = toDomainInput dto
  -- => Translate HTTP DTO to domain input type
  result <- useCase input
  -- => Call the input port — application service handles all logic
  pure $ case result of
    Right po ->
      let r = toHttpResponse po
       in "201 Created: " <> rPoId r <> " status=" <> rStatus r
    Left (ValidationError m) -> "422 Unprocessable: " <> m
    Left (RepositoryError m) -> "503 Service Unavailable: " <> m

-- ── Composition root: wire adapters to ports ──────────────────────────────
buildInMemRepo :: IO (PurchaseOrderRepository, IORef (Map.Map PurchaseOrderId PurchaseOrder))
buildInMemRepo = do
  store <- newIORef Map.empty
  -- => In-memory store backed by an IORef + Map; simulates Postgres
  let repo = PurchaseOrderRepository
        { savePO = \po -> do
            atomicModifyIORef' store (\m -> (Map.insert (poId po) po m, ()))
            pure (Right ())
        , loadPO = \i -> do
            m <- readIORef store
            pure (Right (Map.lookup i m))
        }
  pure (repo, store)

fixedClock :: Clock
fixedClock = case iso8601ParseM "2026-01-15T09:00:00Z" of
  Just t  -> pure t
  Nothing -> error "unreachable"
-- => Fixed clock adapter: deterministic timestamp for this demonstration

-- ── Full flow demonstration ────────────────────────────────────────────────
main :: IO ()
main = do
  (inMemRepo, store) <- buildInMemRepo
  let productionUseCase = buildSubmitPO inMemRepo fixedClock
  -- => Input port function: ports baked in via partial application

  let request = HttpPoDto "po_full-001" "sup_acme-1" 7500
  -- => Sample HTTP request body — $7,500 PO → L2 approval required
  response <- httpHandler productionUseCase request
  -- => Runs the full hexagonal flow: HTTP → Application → Domain → Repository → HTTP
  putStrLn (T.unpack response)
  -- => Output: 201 Created: po_full-001 status=AwaitingApproval-L2

  -- Verify the PO was persisted in the in-memory store
  m <- readIORef store
  putStrLn ("Stored POs: " <> show (Map.size m))
  -- => Output: Stored POs: 1
  case Map.lookup (PurchaseOrderId "po_full-001") m of
    Just po -> putStrLn ("Stored status: " <> T.unpack (poStatus po))
    -- => Output: Stored status: AwaitingApproval-L2
    Nothing -> putStrLn "missing"
```

{{< /tab >}}

{{< /tabs >}}

**Key Takeaway**: The full hexagonal flow — HTTP adapter → input port → application service → domain functions → output port → repository adapter → response — demonstrates that each zone's responsibilities are cleanly separated and independently swappable.

**Why It Matters**: This end-to-end example is the template for every feature in the procurement platform. A new workflow (approve PO, issue PO, cancel PO) follows the identical structure: define domain functions, define port type aliases, implement the application service via partial application, write an HTTP adapter, and wire everything in the composition root. The pattern scales uniformly: the first feature and the hundredth feature have the same structure, making the codebase predictable and navigable for any developer who understands one workflow.
