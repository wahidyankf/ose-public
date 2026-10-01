---
title: "Intermediate"
weight: 10000004
date: 2026-05-24T00:00:00+07:00
draft: false
description: "Examples 21–50: Adapter swapping, integration test seam, Anti-Corruption Layer, CQRS command/query split, multi-context wiring, and port evolution in Go and Rust"
tags:
  ["hexagonal-architecture", "ports-and-adapters", "tutorial", "by-example", "procedural", "go", "rust", "intermediate"]
---

Examples 21–50 build on the beginner foundation. The purchasing context gains a second bounded context (supplier), Postgres adapters replace in-memory stubs, an Anti-Corruption Layer translates external supplier DTOs, CQRS splits commands from queries, and the full wiring demonstrates how all pieces compose in `main.go` without a DI framework.

## Section 1: Second Context — Supplier (Examples 21–25)

### Example 21: SupplierRepository output port

A second bounded context introduces its own output port. The interface lives in the `app/` package alongside the supplier service — never in `domain/` and never in an adapter.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package app holds port interfaces for the supplier bounded context.
// Ports are defined here so the domain never depends on infrastructure.
package app

import (
    "context"
    // domain package defines the Supplier aggregate and SupplierID type.
    "procurement/supplier/domain"
)

// SupplierRepository is an output port.
// Any struct that implements these three methods satisfies the interface.
// No 'implements' keyword required — Go structural typing handles dispatch.
type SupplierRepository interface {
    // FindByID retrieves a supplier by its identity.
    // Returns domain.ErrNotFound when the supplier does not exist.
    FindByID(ctx context.Context, id domain.SupplierID) (domain.Supplier, error)

    // Save persists a supplier aggregate (create or update).
    // The adapter decides whether to INSERT or UPDATE.
    Save(ctx context.Context, s domain.Supplier) error

    // FindApproved returns all suppliers whose status is Approved.
    // Used by the purchasing context eligibility guard.
    FindApproved(ctx context.Context) ([]domain.Supplier, error)
}
```

{{< /tab >}}

{{< tab >}}

```rust
// app/mod.rs — supplier bounded-context port definitions.
// Rust traits serve the same role as Go interfaces for port declaration.
use async_trait::async_trait;
use crate::domain::{Supplier, SupplierID, DomainError};

// SupplierRepository is an output port trait.
// #[async_trait] rewrites async fn signatures so they can live on trait objects.
// Send + Sync bounds enable sharing across tokio tasks via Arc<dyn ...>.
#[async_trait]
pub trait SupplierRepository: Send + Sync {
    // find_by_id retrieves a supplier or returns DomainError::NotFound.
    // &self borrow allows shared access — reads do not need exclusive access.
    async fn find_by_id(&self, id: SupplierID) -> Result<Supplier, DomainError>;

    // save persists the aggregate.
    // &self is acceptable because the adapter may hold internal Arc<Mutex<...>>.
    async fn save(&self, supplier: Supplier) -> Result<(), DomainError>;

    // find_approved returns all Approved suppliers.
    // Returns empty Vec when none are approved — callers must handle that case.
    async fn find_approved(&self) -> Result<Vec<Supplier>, DomainError>;
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** Each bounded context defines its own output ports in its own `app/` package; the port shape reflects what the domain needs, not what the database exposes.

**Why it matters:** Keeping supplier ports in `supplier/app/` instead of sharing a monolithic repository prevents the two contexts from coupling. When the supplier schema changes, only the supplier adapter changes — the purchasing domain remains untouched. This boundary is the fundamental promise of hexagonal architecture: the domain dictates the contract, infrastructure fulfils it.

---

### Example 22: Supplier domain aggregate with lifecycle

The `Supplier` aggregate carries a status field that controls which transitions are legal. The domain enforces state machines — no adapter can bypass the lifecycle by writing SQL directly.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package domain holds the Supplier aggregate for the supplier context.
// No framework imports, no database tags, no HTTP concerns.
package domain

import "errors"

// SupplierStatus enumerates legal lifecycle states.
// Using a distinct string type prevents mixing with arbitrary strings.
type SupplierStatus string

const (
    // SupplierPending is the initial state after registration.
    SupplierPending  SupplierStatus = "PENDING"
    // SupplierApproved means the supplier passed compliance review.
    SupplierApproved SupplierStatus = "APPROVED"
    // SupplierRejected is terminal — cannot be reversed.
    SupplierRejected SupplierStatus = "REJECTED"
)

// Supplier is the aggregate root for the supplier context.
type Supplier struct {
    // ID uniquely identifies this supplier across the platform.
    ID     SupplierID
    // Name is the legal trading name, required and non-empty.
    Name   string
    // Status tracks the compliance lifecycle.
    Status SupplierStatus
}

// Approve transitions the supplier from Pending to Approved.
// Returns ErrInvalidTransition when the current state disallows it.
func (s *Supplier) Approve() error {
    if s.Status != SupplierPending {
        // Only Pending suppliers may be approved; Rejected is terminal.
        return ErrInvalidTransition
    }
    // Transition is valid — update the in-memory state.
    s.Status = SupplierApproved
    return nil
}

// Reject transitions the supplier from Pending to Rejected.
// Rejected is a terminal state — calling Reject again returns an error.
func (s *Supplier) Reject() error {
    if s.Status != SupplierPending {
        // Neither Approved nor Rejected may be rejected again.
        return ErrInvalidTransition
    }
    s.Status = SupplierRejected
    return nil
}

// IsApproved is a convenience predicate used by the eligibility guard.
// Callers check this instead of comparing status strings directly.
func (s Supplier) IsApproved() bool {
    // True only when the supplier has passed compliance review.
    return s.Status == SupplierApproved
}

var (
    // ErrInvalidTransition signals an illegal lifecycle change.
    ErrInvalidTransition = errors.New("invalid status transition")
    // ErrNotFound signals that a lookup returned no result.
    ErrNotFound          = errors.New("supplier not found")
)
```

{{< /tab >}}

{{< tab >}}

```rust
// domain/supplier.rs — Supplier aggregate for the supplier context.
// Pure Rust; no database crates, no HTTP crates imported here.

// SupplierStatus models the compliance lifecycle as a Rust enum.
// Rust enums are exhaustively checked — new states cannot be ignored.
#[derive(Debug, Clone, PartialEq)]
pub enum SupplierStatus {
    // Pending is the initial state set at registration time.
    Pending,
    // Approved means compliance review passed; the supplier may receive POs.
    Approved,
    // Rejected is terminal — no further transitions are allowed.
    Rejected,
}

// Supplier is the aggregate root for the supplier bounded context.
#[derive(Debug, Clone)]
pub struct Supplier {
    // id uniquely identifies the supplier across the platform.
    pub id: SupplierID,
    // name is the legal trading name.
    pub name: String,
    // status tracks the compliance lifecycle.
    pub status: SupplierStatus,
}

impl Supplier {
    // approve transitions Pending → Approved.
    // Returns DomainError::InvalidTransition when the state disallows it.
    pub fn approve(&mut self) -> Result<(), DomainError> {
        // Pattern match makes the guard exhaustive and compiler-verified.
        match self.status {
            SupplierStatus::Pending => {
                // Legal transition — update in-memory state.
                self.status = SupplierStatus::Approved;
                Ok(())
            }
            // Any other state (Approved or Rejected) is illegal.
            _ => Err(DomainError::InvalidTransition),
        }
    }

    // reject transitions Pending → Rejected.
    // Rejected is terminal; calling reject on a Rejected supplier errors.
    pub fn reject(&mut self) -> Result<(), DomainError> {
        match self.status {
            SupplierStatus::Pending => {
                // Legal terminal transition — update in-memory state.
                self.status = SupplierStatus::Rejected;
                Ok(())
            }
            _ => Err(DomainError::InvalidTransition),
        }
    }

    // is_approved is a predicate used by the eligibility guard in app layer.
    pub fn is_approved(&self) -> bool {
        // Enum equality check — no string comparison, no magic constants.
        self.status == SupplierStatus::Approved
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The aggregate owns its lifecycle logic; adapters call `Approve()` / `Reject()` and then persist the result — they never write raw status strings to the database without going through the domain.

**Why it matters:** State machine enforcement in the domain prevents data corruption from concurrent adapter calls writing contradictory states. A Postgres adapter cannot set status to `APPROVED` without the domain validating the transition. This is impossible in an anemic domain model where status is just a column value.

---

### Example 23: In-memory SupplierRepository adapter

The in-memory adapter for `SupplierRepository` uses a mutex-protected map. It implements all three port methods and serves as both a test double and a fast-startup alternative to Postgres.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package mem provides in-memory adapters for the supplier context.
// Used in unit tests and in fast-startup environments (no Postgres needed).
package mem

import (
    "context"
    "sync"
    "procurement/supplier/app"
    "procurement/supplier/domain"
)

// SupplierRepo is a thread-safe in-memory implementation of app.SupplierRepository.
// The struct satisfies the interface implicitly — no 'implements' declaration.
type SupplierRepo struct {
    // mu protects the store map from concurrent reads and writes.
    mu    sync.RWMutex
    // store maps SupplierID to its latest aggregate snapshot.
    store map[domain.SupplierID]domain.Supplier
}

// NewSupplierRepo constructs an empty SupplierRepo with an initialised map.
func NewSupplierRepo() *SupplierRepo {
    // Return a pointer so callers share the same store; value copy would lose data.
    return &SupplierRepo{store: make(map[domain.SupplierID]domain.Supplier)}
}

// FindByID looks up a supplier by identity.
// RLock allows concurrent reads without blocking other readers.
func (r *SupplierRepo) FindByID(ctx context.Context, id domain.SupplierID) (domain.Supplier, error) {
    r.mu.RLock()
    defer r.mu.RUnlock()
    // Map lookup: ok is false when the key is absent.
    s, ok := r.store[id]
    if !ok {
        // Return the sentinel error the port contract specifies.
        return domain.Supplier{}, domain.ErrNotFound
    }
    return s, nil
}

// Save writes the supplier aggregate into the in-memory store.
// Lock (not RLock) prevents concurrent writes from interleaving.
func (r *SupplierRepo) Save(ctx context.Context, s domain.Supplier) error {
    r.mu.Lock()
    defer r.mu.Unlock()
    // Overwrite any existing entry — same as an SQL upsert.
    r.store[s.ID] = s
    return nil
}

// FindApproved returns all suppliers with status APPROVED.
// Iterates the entire map; acceptable for tests and low-volume starts.
func (r *SupplierRepo) FindApproved(ctx context.Context) ([]domain.Supplier, error) {
    r.mu.RLock()
    defer r.mu.RUnlock()
    var result []domain.Supplier
    for _, s := range r.store {
        if s.IsApproved() {
            // Append only APPROVED entries to the result slice.
            result = append(result, s)
        }
    }
    // Returning nil slice when empty is idiomatic Go — callers use len().
    return result, nil
}

// Compile-time assertion: *SupplierRepo must satisfy app.SupplierRepository.
// If the interface changes, this line causes a build error before any test runs.
var _ app.SupplierRepository = (*SupplierRepo)(nil)
```

{{< /tab >}}

{{< tab >}}

```rust
// adapter/out/mem/supplier_repo.rs — in-memory SupplierRepository adapter.
use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use crate::app::SupplierRepository;
use crate::domain::{Supplier, SupplierID, DomainError};

// InMemorySupplierRepo holds a mutex-protected map of supplier aggregates.
// Arc makes it cheaply cloneable into multiple services at the composition root.
pub struct InMemorySupplierRepo {
    // Mutex<HashMap> gives exclusive-lock access to the shared store.
    // Arc allows multiple owners without unsafe pointer sharing.
    store: Arc<Mutex<HashMap<SupplierID, Supplier>>>,
}

impl InMemorySupplierRepo {
    // new constructs an empty repo with an initialised HashMap.
    pub fn new() -> Self {
        // Arc::new wraps the Mutex so the struct can be cloned cheaply.
        InMemorySupplierRepo { store: Arc::new(Mutex::new(HashMap::new())) }
    }
}

#[async_trait]
impl SupplierRepository for InMemorySupplierRepo {
    // find_by_id locks the store, looks up the id, returns a clone.
    async fn find_by_id(&self, id: SupplierID) -> Result<Supplier, DomainError> {
        // lock().unwrap() panics only on poisoned mutex (a previous panic in the lock).
        let store = self.store.lock().unwrap();
        // get returns Option<&Supplier>; map clones to avoid holding the lock.
        store.get(&id)
            .cloned()
            .ok_or(DomainError::NotFound)
    }

    // save inserts or replaces the supplier aggregate in the store.
    async fn save(&self, supplier: Supplier) -> Result<(), DomainError> {
        let mut store = self.store.lock().unwrap();
        // HashMap::insert replaces any existing entry with the same key.
        store.insert(supplier.id.clone(), supplier);
        Ok(())
    }

    // find_approved iterates the entire map, returning only APPROVED entries.
    async fn find_approved(&self) -> Result<Vec<Supplier>, DomainError> {
        let store = self.store.lock().unwrap();
        // filter_map: None entries (non-approved) are automatically dropped.
        let approved = store.values()
            .filter(|s| s.is_approved())
            .cloned()
            .collect();
        Ok(approved)
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The in-memory adapter is an _implementation_, not a mock — it stores real state and enforces the same logic paths that a Postgres adapter would, making unit tests faithful proxies for integration behaviour.

**Why it matters:** Developers on teams without a local Postgres instance can run the full service with `DATABASE_URL=""` and get a working in-memory store. CI pipelines that value speed can run unit tests against in-memory adapters and reserve Postgres for integration test targets, cutting fast-feedback loop time dramatically.

---

### Example 24: Dependency rejection — refusing non-APPROVED suppliers

The `IssuePurchaseOrderService` calls `SupplierRepo.FindByID` to check the supplier's eligibility before accepting a PO. The guard lives in the application service, not in the HTTP adapter.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package app holds the IssuePurchaseOrderService for the purchasing context.
// The service orchestrates domain logic and delegates I/O to port implementations.
package app

import (
    "context"
    "errors"
    "procurement/purchasing/domain"
    supplierApp "procurement/supplier/app"
    supplierDomain "procurement/supplier/domain"
)

// ErrSupplierNotApproved is returned when the named supplier is not APPROVED.
// Application-layer error, not a domain error — the domain does not know suppliers.
var ErrSupplierNotApproved = errors.New("supplier is not approved")

// IssuePurchaseOrderService orchestrates PO issuance with supplier eligibility.
type IssuePurchaseOrderService struct {
    // poRepo persists PurchaseOrder aggregates; defined in this package as a port.
    poRepo       PurchaseOrderRepository
    // supplierRepo is a cross-context dependency: the supplier output port.
    supplierRepo supplierApp.SupplierRepository
    // clock provides deterministic time for domain event timestamps.
    clock        Clock
}

// Issue validates supplier eligibility then persists the purchase order.
// Returns ErrSupplierNotApproved when the supplier has not passed compliance.
func (s *IssuePurchaseOrderService) Issue(ctx context.Context, cmd IssueCommand) (domain.PurchaseOrderID, error) {
    // Step 1: fetch supplier — crosses context boundary via output port.
    supplier, err := s.supplierRepo.FindByID(ctx, supplierDomain.SupplierID(cmd.SupplierID))
    if err != nil {
        // FindByID returns ErrNotFound when the supplier does not exist.
        return "", err
    }
    // Step 2: eligibility guard — domain aggregate method, not a raw string compare.
    if !supplier.IsApproved() {
        // Guard rejects early; no PO is created, no ID is allocated.
        return "", ErrSupplierNotApproved
    }
    // Step 3: create the domain aggregate using the current clock time.
    po, err := domain.NewPurchaseOrder(cmd.SupplierID, cmd.Items, s.clock.Now())
    if err != nil {
        return "", err
    }
    // Step 4: persist the new aggregate via the output port.
    if err := s.poRepo.Save(ctx, po); err != nil {
        return "", err
    }
    // Step 5: return the new aggregate identity to the caller (HTTP adapter).
    return po.ID, nil
}
```

{{< /tab >}}

{{< tab >}}

```rust
// app/issue_purchase_order.rs — service with supplier eligibility guard.
use crate::purchasing::app::{PurchaseOrderRepository, Clock, IssueCommand};
use crate::purchasing::domain::{PurchaseOrder, PurchaseOrderID};
use crate::supplier::app::SupplierRepository;
use crate::supplier::domain::SupplierID;

// AppError distinguishes supplier eligibility failures from infrastructure errors.
#[derive(Debug)]
pub enum AppError {
    // SupplierNotApproved means the supplier exists but failed compliance.
    SupplierNotApproved,
    // Infrastructure wraps lower-level errors (DB unreachable, network failure).
    Infrastructure(String),
}

// IssuePurchaseOrderService holds its dependencies behind trait-object ports.
pub struct IssuePurchaseOrderService {
    // Arc<dyn ...> provides shared ownership with dynamic dispatch.
    // The concrete type (Postgres, in-memory) is injected at the composition root.
    po_repo:       std::sync::Arc<dyn PurchaseOrderRepository>,
    supplier_repo: std::sync::Arc<dyn SupplierRepository>,
    clock:         std::sync::Arc<dyn Clock>,
}

impl IssuePurchaseOrderService {
    // issue validates eligibility and persists the purchase order.
    pub async fn issue(&self, cmd: IssueCommand) -> Result<PurchaseOrderID, AppError> {
        // Step 1: fetch supplier via cross-context output port.
        let supplier = self.supplier_repo
            .find_by_id(SupplierID(cmd.supplier_id.clone()))
            .await
            .map_err(|e| AppError::Infrastructure(e.to_string()))?;

        // Step 2: eligibility guard — calls domain method, not raw field access.
        if !supplier.is_approved() {
            // Reject before any PO aggregate is created.
            return Err(AppError::SupplierNotApproved);
        }

        // Step 3: create domain aggregate using the injected clock.
        let now = self.clock.now();
        let po = PurchaseOrder::new(cmd.supplier_id, cmd.items, now)
            .map_err(|e| AppError::Infrastructure(e.to_string()))?;

        // Step 4: persist via output port.
        let id = po.id.clone();
        self.po_repo.save(po).await
            .map_err(|e| AppError::Infrastructure(e.to_string()))?;

        // Step 5: return only the identity — callers do not get the full aggregate.
        Ok(id)
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The eligibility guard belongs in the application layer service — it orchestrates two port calls and enforces a cross-context business rule without leaking supplier logic into the domain or the HTTP adapter.

**Why it matters:** Placing the guard in the HTTP handler creates duplicate validation across every entry point (REST, gRPC, CLI). Placing it in the domain couples the purchasing domain to the supplier domain. The application service is the exactly-right layer — it coordinates without owning domain logic and without duplicating presentation concerns.

---

### Example 25: Unit test for eligibility rejection

A focused unit test verifies that `IssuePurchaseOrderService` rejects a non-approved supplier. No database is required — the in-memory adapters from Examples 13 and 23 provide the test seam.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package app_test exercises IssuePurchaseOrderService eligibility guard.
// No Postgres, no HTTP server, no test framework beyond standard library.
package app_test

import (
    "context"
    "testing"
    "procurement/purchasing/app"
    purchasingMem "procurement/purchasing/adapter/out/mem"
    supplierMem   "procurement/supplier/adapter/out/mem"
    supplierDomain "procurement/supplier/domain"
)

// TestIssue_RejectsNonApprovedSupplier verifies the eligibility guard fires
// when the supplier exists but has not been approved.
func TestIssue_RejectsNonApprovedSupplier(t *testing.T) {
    // Arrange — seed a PENDING supplier in the in-memory adapter.
    supplierRepo := supplierMem.NewSupplierRepo()
    pendingSupplier := supplierDomain.Supplier{
        ID:     "S-001",
        Name:   "ACME Corp",
        // Status is PENDING — not eligible to receive purchase orders.
        Status: supplierDomain.SupplierPending,
    }
    // Save the pending supplier so FindByID will find it.
    _ = supplierRepo.Save(context.Background(), pendingSupplier)

    // Wire the service with in-memory adapters — no composition root needed.
    svc := app.NewIssuePurchaseOrderService(
        purchasingMem.NewPurchaseOrderRepo(),
        supplierRepo,
        app.FixedClock{},
    )

    // Act — attempt to issue a PO against the PENDING supplier.
    _, err := svc.Issue(context.Background(), app.IssueCommand{
        SupplierID: "S-001",
        Items:      []app.LineItem{{SKU: "WIDGET-42", Quantity: 10}},
    })

    // Assert — the service must return ErrSupplierNotApproved, nothing else.
    if err != app.ErrSupplierNotApproved {
        // Fail with a diagnostic message that names both expected and actual errors.
        t.Errorf("expected ErrSupplierNotApproved, got %v", err)
    }
}
```

{{< /tab >}}

{{< tab >}}

```rust
// tests/issue_purchase_order_test.rs — eligibility rejection unit test.
// Uses #[tokio::test] for async test execution; no Postgres dependency.
#[cfg(test)]
mod tests {
    use super::*;
    use crate::purchasing::app::{IssuePurchaseOrderService, IssueCommand, AppError};
    use crate::purchasing::adapter::out::mem::InMemoryPurchaseOrderRepo;
    use crate::supplier::adapter::out::mem::InMemorySupplierRepo;
    use crate::supplier::domain::{Supplier, SupplierID, SupplierStatus};
    use std::sync::Arc;

    // test_issue_rejects_non_approved_supplier verifies the eligibility guard.
    // No database connection — in-memory adapters provide the test seam.
    #[tokio::test]
    async fn test_issue_rejects_non_approved_supplier() {
        // Arrange — create a PENDING supplier in the in-memory adapter.
        let supplier_repo = Arc::new(InMemorySupplierRepo::new());
        let pending = Supplier {
            id: SupplierID("S-001".to_string()),
            name: "ACME Corp".to_string(),
            // Pending status — not eligible to receive purchase orders.
            status: SupplierStatus::Pending,
        };
        // Seed the supplier before wiring the service.
        supplier_repo.save(pending).await.unwrap();

        // Wire — construct the service with Arc-wrapped in-memory adapters.
        let svc = IssuePurchaseOrderService::new(
            Arc::new(InMemoryPurchaseOrderRepo::new()),
            supplier_repo,
            Arc::new(FixedClock::default()),
        );

        // Act — attempt PO issuance against the PENDING supplier.
        let result = svc.issue(IssueCommand {
            supplier_id: "S-001".to_string(),
            items: vec![LineItem { sku: "WIDGET-42".to_string(), quantity: 10 }],
        }).await;

        // Assert — must be SupplierNotApproved, not any other error variant.
        assert!(matches!(result, Err(AppError::SupplierNotApproved)),
            "expected SupplierNotApproved, got {:?}", result);
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The test exercises real application logic using real in-memory adapters — no mocking framework, no reflection, no test-specific subclasses — which means a passing test proves the correct objects collaborate correctly.

**Why it matters:** Tests that use in-memory adapters rather than mocks catch integration mistakes between service and adapter (wrong method signature, missing nil check) that mock-based tests cannot. When a port contract changes, the compile-time check on the in-memory adapter (`var _ app.SupplierRepository = (*SupplierRepo)(nil)`) fails first, making the breakage visible before any test runs.

---

## Section 2: Adapter Swapping (Examples 26–28)

### Example 26: Postgres adapter for PurchaseOrderRepository

The Postgres adapter fulfils the same `PurchaseOrderRepository` port as the in-memory adapter. The service does not change — only the wiring in `main.go` selects which adapter to inject.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package postgres provides a Postgres-backed PurchaseOrderRepository.
// It depends on database/sql and pgx — infrastructure concerns isolated here.
package postgres

import (
    "context"
    "database/sql"
    "procurement/purchasing/app"
    "procurement/purchasing/domain"
)

// PurchaseOrderRepo implements app.PurchaseOrderRepository against Postgres.
// The struct holds a *sql.DB from which it obtains connections per request.
type PurchaseOrderRepo struct {
    // db is the database handle; shared across all requests via connection pool.
    db *sql.DB
}

// NewPurchaseOrderRepo constructs a repo given an open database handle.
// The caller (main.go) owns the DB lifecycle — this repo does not close it.
func NewPurchaseOrderRepo(db *sql.DB) *PurchaseOrderRepo {
    return &PurchaseOrderRepo{db: db}
}

// Save inserts or updates a PurchaseOrder row in the database.
// Uses an upsert so callers do not distinguish create from update.
func (r *PurchaseOrderRepo) Save(ctx context.Context, po domain.PurchaseOrder) error {
    const q = `
        INSERT INTO purchase_orders (id, supplier_id, status, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
            SET status = EXCLUDED.status`
    // QueryContext propagates the request context for cancellation and timeouts.
    _, err := r.db.ExecContext(ctx, q, po.ID, po.SupplierID, string(po.Status), po.CreatedAt)
    // Return the raw database error; the service maps it if needed.
    return err
}

// FindByID retrieves a single purchase order row by primary key.
// Scans the result set into the domain struct; no ORM, no reflection.
func (r *PurchaseOrderRepo) FindByID(ctx context.Context, id domain.PurchaseOrderID) (domain.PurchaseOrder, error) {
    const q = `SELECT id, supplier_id, status, created_at FROM purchase_orders WHERE id = $1`
    row := r.db.QueryRowContext(ctx, q, id)
    var po domain.PurchaseOrder
    var status string
    // Scan maps columns to fields by position; field order must match SELECT list.
    err := row.Scan(&po.ID, &po.SupplierID, &status, &po.CreatedAt)
    if err == sql.ErrNoRows {
        // Translate database absence into the port-contract sentinel error.
        return domain.PurchaseOrder{}, domain.ErrNotFound
    }
    if err != nil {
        return domain.PurchaseOrder{}, err
    }
    // Re-hydrate the typed status from the stored string.
    po.Status = domain.POStatus(status)
    return po, nil
}

// Compile-time assertion: *PurchaseOrderRepo must satisfy app.PurchaseOrderRepository.
var _ app.PurchaseOrderRepository = (*PurchaseOrderRepo)(nil)
```

{{< /tab >}}

{{< tab >}}

```rust
// adapter/out/postgres/purchase_order_repo.rs — Postgres adapter.
// sqlx provides compile-time SQL checking and async query execution.
use async_trait::async_trait;
use sqlx::PgPool;
use crate::purchasing::app::PurchaseOrderRepository;
use crate::purchasing::domain::{PurchaseOrder, PurchaseOrderID, DomainError};

// PostgresPurchaseOrderRepo wraps a sqlx PgPool connection pool.
// PgPool is cheaply cloneable — the pool handles connection management.
pub struct PostgresPurchaseOrderRepo {
    // pool provides async, pooled connections to Postgres.
    pool: PgPool,
}

impl PostgresPurchaseOrderRepo {
    // new constructs the adapter given an already-connected pool.
    // The composition root creates the pool; this adapter only uses it.
    pub fn new(pool: PgPool) -> Self {
        PostgresPurchaseOrderRepo { pool }
    }
}

#[async_trait]
impl PurchaseOrderRepository for PostgresPurchaseOrderRepo {
    // save upserts the purchase order row using sqlx::query!.
    // query! macro verifies SQL syntax at compile time against a live DB.
    async fn save(&self, po: PurchaseOrder) -> Result<(), DomainError> {
        sqlx::query!(
            r#"
            INSERT INTO purchase_orders (id, supplier_id, status, created_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
            "#,
            po.id.0,
            po.supplier_id.0,
            po.status.to_string(),
            po.created_at,
        )
        .execute(&self.pool)
        .await
        // Map sqlx error into the port-contract DomainError variant.
        .map_err(|e| DomainError::Infrastructure(e.to_string()))?;
        Ok(())
    }

    // find_by_id fetches and maps a single row to the domain aggregate.
    async fn find_by_id(&self, id: PurchaseOrderID) -> Result<PurchaseOrder, DomainError> {
        let row = sqlx::query!(
            "SELECT id, supplier_id, status, created_at FROM purchase_orders WHERE id = $1",
            id.0,
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Infrastructure(e.to_string()))?;

        // fetch_optional returns None when no row matches — map to NotFound.
        match row {
            None => Err(DomainError::NotFound),
            Some(r) => Ok(PurchaseOrder {
                id: PurchaseOrderID(r.id),
                supplier_id: r.supplier_id,
                // Parse the stored string back into the typed status enum.
                status: r.status.parse().map_err(|_| DomainError::Infrastructure("bad status".into()))?,
                created_at: r.created_at,
            }),
        }
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The Postgres adapter translates between the relational world (rows, SQL strings) and the domain world (typed aggregates) without the service or domain knowing SQL exists.

**Why it matters:** The translation layer in the adapter isolates schema migrations from service logic. If a column is renamed, only the adapter changes — the domain aggregate, the service, and all tests using in-memory adapters are untouched. This is the testability dividend hexagonal architecture delivers at the cost of writing two adapters instead of one.

---

### Example 27: Environment-based adapter selection

The composition root selects either the in-memory or Postgres adapter at startup time based on an environment variable. The service binary is identical in both cases — only the wiring changes.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// main.go — composition root that selects adapters based on environment.
// No framework, no DI container, no reflection — plain Go constructor calls.
package main

import (
    "database/sql"
    "log"
    "os"
    "procurement/purchasing/adapter/in/http"
    "procurement/purchasing/app"
    purchasingMem  "procurement/purchasing/adapter/out/mem"
    purchasingPG   "procurement/purchasing/adapter/out/postgres"
    _ "github.com/jackc/pgx/v5/stdlib" // Register pgx as a database/sql driver.
)

func main() {
    // Determine adapter choice by checking DATABASE_URL at startup.
    var poRepo app.PurchaseOrderRepository
    dbURL := os.Getenv("DATABASE_URL")
    if dbURL != "" {
        // Postgres path — open connection pool and wrap in the Postgres adapter.
        db, err := sql.Open("pgx", dbURL)
        if err != nil {
            log.Fatalf("cannot open database: %v", err)
        }
        // NewPurchaseOrderRepo wraps the *sql.DB behind the port interface.
        poRepo = purchasingPG.NewPurchaseOrderRepo(db)
        log.Println("using postgres adapter")
    } else {
        // In-memory path — no external dependency needed.
        poRepo = purchasingMem.NewPurchaseOrderRepo()
        log.Println("using in-memory adapter (no DATABASE_URL set)")
    }
    // The service is constructed identically regardless of which adapter was chosen.
    svc := app.NewIssuePurchaseOrderService(poRepo, /* supplierRepo, clock */ nil, nil)
    // Mount HTTP routes — the handler holds the service, not the repository.
    router := http.NewRouter(svc)
    log.Fatal(router.ListenAndServe(":8080"))
}
```

{{< /tab >}}

{{< tab >}}

```rust
// main.rs — adapter selection at startup via environment variable.
use std::env;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    // Read DATABASE_URL from the environment at process startup.
    let db_url = env::var("DATABASE_URL").ok();

    // Build the repository behind the trait-object port interface.
    let po_repo: Arc<dyn purchasing::app::PurchaseOrderRepository> = match db_url {
        Some(url) => {
            // DATABASE_URL is set — connect to Postgres and use the real adapter.
            let pool = sqlx::PgPool::connect(&url).await
                .expect("cannot connect to database");
            // Postgres adapter implements the port trait.
            Arc::new(purchasing::adapter::out::postgres::PostgresPurchaseOrderRepo::new(pool))
        }
        None => {
            // No DATABASE_URL — fall back to in-memory adapter.
            eprintln!("DATABASE_URL not set; using in-memory adapter");
            Arc::new(purchasing::adapter::out::mem::InMemoryPurchaseOrderRepo::new())
        }
    };

    // Construct the service once — it sees only the trait object, not the concrete type.
    let svc = Arc::new(purchasing::app::IssuePurchaseOrderService::new(
        po_repo,
        // supplier_repo and clock are elided here for brevity.
    ));

    // Mount the axum HTTP router with the constructed service.
    let app = purchasing::adapter::in_http::router(svc);
    axum::Server::bind(&"0.0.0.0:8080".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The adapter selection `if/else` is the _only_ place in the codebase that names both the port and the concrete adapter type together — every other file knows only the interface, giving the binary a clean swap with zero service changes.

**Why it matters:** Environment-based selection is the simplest CI/CD adapter swap strategy. The same binary image ships to all environments: `DATABASE_URL=""` in local development, real URL in staging and production. No environment-specific build flags, no separate binaries, no configuration overrides at the service level.

---

### Example 28: Integration test seam with real Postgres

Integration tests use `testcontainers-go` (Go) / `testcontainers` (Rust) to spin up a real Postgres container per test run. Transaction rollback cleanup removes test data without truncating tables.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package postgres_test runs integration tests against a real Postgres container.
// Requires Docker; will be skipped in environments without it.
package postgres_test

import (
    "context"
    "database/sql"
    "testing"
    "github.com/testcontainers/testcontainers-go"
    "github.com/testcontainers/testcontainers-go/modules/postgres"
    purchasingPG "procurement/purchasing/adapter/out/postgres"
    "procurement/purchasing/domain"
)

// TestPurchaseOrderRepo_SaveAndFind is an integration test against a real Postgres.
// Uses testcontainers-go to start a throwaway container per test binary run.
func TestPurchaseOrderRepo_SaveAndFind(t *testing.T) {
    ctx := context.Background()
    // Start a Postgres container — image, database, user, password configured here.
    container, err := postgres.RunContainer(ctx,
        testcontainers.WithImage("postgres:16-alpine"),
        postgres.WithDatabase("procurement"),
        postgres.WithUsername("test"),
        postgres.WithPassword("test"),
    )
    if err != nil {
        t.Fatalf("failed to start container: %v", err)
    }
    // Ensure the container is terminated after the test, even on failure.
    defer container.Terminate(ctx)

    // Obtain the connection string from the running container.
    connStr, _ := container.ConnectionString(ctx, "sslmode=disable")
    db, _ := sql.Open("pgx", connStr)
    // Run schema migrations so the purchase_orders table exists.
    runMigrations(t, db)

    // Begin a transaction — all test writes will be rolled back.
    tx, _ := db.BeginTx(ctx, nil)
    defer tx.Rollback() // Rollback undoes all inserts after the test.

    // Construct the adapter using the transaction as the database handle.
    repo := purchasingPG.NewPurchaseOrderRepo(tx)
    po := domain.PurchaseOrder{ID: "PO-TEST-1", SupplierID: "S-001", Status: domain.PODraft}
    // Save through the adapter — writes go into the transaction, not committed.
    if err := repo.Save(ctx, po); err != nil {
        t.Fatalf("Save failed: %v", err)
    }
    // FindByID reads within the same transaction — uncommitted data is visible.
    found, err := repo.FindByID(ctx, "PO-TEST-1")
    if err != nil {
        t.Fatalf("FindByID failed: %v", err)
    }
    if found.SupplierID != "S-001" {
        t.Errorf("expected supplier S-001, got %v", found.SupplierID)
    }
    // Rollback in defer ensures the purchase_orders table is unchanged after the test.
}
```

{{< /tab >}}

{{< tab >}}

```rust
// tests/postgres_integration_test.rs — real Postgres via testcontainers.
// #[tokio::test] with testcontainers provides Docker-based isolation.
#[cfg(test)]
mod integration {
    use testcontainers::{clients::Cli, images::postgres::Postgres};
    use sqlx::PgPool;
    use crate::purchasing::adapter::out::postgres::PostgresPurchaseOrderRepo;
    use crate::purchasing::domain::{PurchaseOrder, PurchaseOrderID, POStatus};
    use crate::purchasing::app::PurchaseOrderRepository;

    // test_save_and_find_integration verifies the Postgres adapter round-trips an aggregate.
    // Starts a real Postgres container; the container is dropped at end of test scope.
    #[tokio::test]
    async fn test_save_and_find_integration() {
        // Docker client spawns a Postgres container; dropped at end of scope.
        let docker = Cli::default();
        let container = docker.run(Postgres::default());
        // Build the connection URL from the mapped port on localhost.
        let db_url = format!(
            "postgres://postgres:postgres@127.0.0.1:{}/postgres",
            container.get_host_port_ipv4(5432)
        );

        // Connect and run schema migrations before the adapter is constructed.
        let pool = PgPool::connect(&db_url).await.unwrap();
        sqlx::migrate!("./migrations").run(&pool).await.unwrap();

        // Wrap in a transaction for automatic rollback on test completion.
        let mut tx = pool.begin().await.unwrap();
        let repo = PostgresPurchaseOrderRepo::from_transaction(&mut tx);

        // Save a domain aggregate through the Postgres adapter.
        let po = PurchaseOrder {
            id: PurchaseOrderID("PO-TEST-1".to_string()),
            supplier_id: "S-001".to_string(),
            status: POStatus::Draft,
            created_at: chrono::Utc::now(),
        };
        repo.save(po).await.unwrap();

        // Find within the same transaction — uncommitted write is visible.
        let found = repo.find_by_id(PurchaseOrderID("PO-TEST-1".to_string())).await.unwrap();
        // Assert the round-trip preserved the supplier identity.
        assert_eq!(found.supplier_id, "S-001");
        // tx is dropped here — rollback undoes all inserts automatically.
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** Integration tests verify that the SQL in the Postgres adapter is correct _without_ leaving test data behind — the transaction rollback pattern gives real database behaviour at no cleanup cost.

**Why it matters:** An in-memory adapter test can pass while the Postgres adapter has a column-order bug in its `Scan` call. Integration tests catch exactly that class of bug. `testcontainers` removes the shared-database contamination risk by giving each test run an isolated throwaway container, making integration tests safe to run in parallel CI pipelines.

---

## Section 3: Anti-Corruption Layer (Examples 29–32)

### Example 29: ACL — translating external SupplierDTO

An Anti-Corruption Layer (ACL) translator lives in `adapter/out/` and converts an external supplier microservice's JSON DTO into the purchasing context's domain `Supplier` type. The domain never sees the external schema.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package suppliergateway translates external supplier API responses
// into the supplier domain type used by the purchasing context.
// This adapter isolates the domain from the external supplier service's schema.
package suppliergateway

import "procurement/supplier/domain"

// ExternalSupplierDTO represents the JSON shape returned by the supplier microservice.
// Field names match the external API contract; they are not the domain field names.
type ExternalSupplierDTO struct {
    // SupplierCode is the external identifier — not the same as domain.SupplierID format.
    SupplierCode   string `json:"supplier_code"`
    // LegalName differs from the domain's Name field by convention.
    LegalName      string `json:"legal_name"`
    // ApprovalStatus uses the external service's vocabulary ("VETTED", "BLOCKED", etc.).
    ApprovalStatus string `json:"approval_status"`
}

// ToDomain converts an ExternalSupplierDTO into the purchasing context's domain.Supplier.
// This is the ACL translation function — the domain's Supplier never knows about ExternalSupplierDTO.
func (dto ExternalSupplierDTO) ToDomain() domain.Supplier {
    return domain.Supplier{
        // Map external SupplierCode to domain SupplierID with a type cast.
        ID:   domain.SupplierID(dto.SupplierCode),
        // Map legal_name to the domain's Name field.
        Name: dto.LegalName,
        // Translate external vocabulary to domain SupplierStatus values.
        Status: translateStatus(dto.ApprovalStatus),
    }
}

// translateStatus converts external status strings to domain enum values.
// Unknown statuses map to Pending — a conservative safe default.
func translateStatus(external string) domain.SupplierStatus {
    switch external {
    case "VETTED":
        // External VETTED maps to domain Approved.
        return domain.SupplierApproved
    case "BLOCKED", "REJECTED":
        // Both external blocking states map to domain Rejected.
        return domain.SupplierRejected
    default:
        // Unknown or new external statuses default to Pending (safe, not approved).
        return domain.SupplierPending
    }
}
```

{{< /tab >}}

{{< tab >}}

```rust
// adapter/out/supplier_gateway/translator.rs — ACL translation layer.
// Converts the external supplier service DTO to the domain Supplier type.
use serde::Deserialize;
use crate::supplier::domain::{Supplier, SupplierID, SupplierStatus};

// ExternalSupplierDTO models the JSON structure returned by the supplier microservice.
// #[derive(Deserialize)] enables serde to parse JSON directly into this struct.
#[derive(Debug, Deserialize)]
pub struct ExternalSupplierDTO {
    // supplier_code is the external identifier format — differs from domain SupplierID.
    pub supplier_code: String,
    // legal_name matches the external API field naming convention.
    pub legal_name: String,
    // approval_status uses the external service vocabulary, not domain vocabulary.
    pub approval_status: String,
}

impl ExternalSupplierDTO {
    // into_domain translates this external DTO into the domain's Supplier type.
    // Consuming self ensures the DTO cannot be reused after translation.
    pub fn into_domain(self) -> Supplier {
        Supplier {
            // Wrap the external code in the domain's SupplierID newtype.
            id: SupplierID(self.supplier_code),
            // Map field names across the vocabulary boundary.
            name: self.legal_name,
            // Translate external status vocabulary to domain enum variants.
            status: translate_status(&self.approval_status),
        }
    }
}

// translate_status maps external vocabulary to domain SupplierStatus.
// Defaults to Pending for unknown statuses — conservative, not permissive.
fn translate_status(external: &str) -> SupplierStatus {
    match external {
        // VETTED in the external service means compliance-approved in the domain.
        "VETTED" => SupplierStatus::Approved,
        // Both external blocking states map to the domain's Rejected terminal state.
        "BLOCKED" | "REJECTED" => SupplierStatus::Rejected,
        // Anything unknown defaults to Pending — the safe, non-privileged state.
        _ => SupplierStatus::Pending,
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The ACL translator is a pure function — it maps one struct to another with no I/O, making it trivially testable and safe to extend when the external schema changes.

**Why it matters:** Without an ACL, renaming a field in the external supplier API forces a change in the domain aggregate. With the ACL, the change is contained to the translator function. The domain team can evolve their model independently from the external service team's release schedule, which is the correct boundary for independent deployability.

---

### Example 30: EventPublisher output port

`EventPublisher` is an output port in `app/` that decouples the application service from the event bus. An in-memory adapter provides synchronous delivery for tests; a real outbox adapter provides durability for production.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package app defines the EventPublisher output port for the purchasing context.
// The port interface lives here; concrete adapters live in adapter/out/.
package app

import "context"

// DomainEvent carries the type name and payload for a single domain event.
// Using an interface keeps the port generic — callers decide the concrete event type.
type DomainEvent interface {
    // EventType returns a string name used for routing (e.g., "PurchaseOrderIssued").
    EventType() string
}

// EventPublisher is an output port for publishing domain events.
// Implementations include: in-memory (tests), outbox+Postgres, NATS, Kafka.
type EventPublisher interface {
    // Publish delivers a domain event to whatever bus or store backs this port.
    // Callers do not know whether delivery is synchronous or asynchronous.
    Publish(ctx context.Context, event DomainEvent) error
}

// InMemoryEventPublisher collects published events for test inspection.
// No external dependency — useful for verifying that services emit expected events.
type InMemoryEventPublisher struct {
    // Events holds all published events in publication order.
    Events []DomainEvent
}

// Publish appends the event to the in-memory slice.
// Not thread-safe by design — unit tests run sequentially.
func (p *InMemoryEventPublisher) Publish(_ context.Context, event DomainEvent) error {
    // Append to slice; no mutex needed for sequential unit tests.
    p.Events = append(p.Events, event)
    return nil
}

// Compile-time assertion: *InMemoryEventPublisher must satisfy EventPublisher.
var _ EventPublisher = (*InMemoryEventPublisher)(nil)
```

{{< /tab >}}

{{< tab >}}

```rust
// app/event_publisher.rs — EventPublisher output port and in-memory adapter.
use async_trait::async_trait;
use std::sync::{Arc, Mutex};

// DomainEvent is a trait that all domain events implement.
// Any struct with event_type() and as_any() satisfies the trait.
pub trait DomainEvent: Send + Sync {
    // event_type returns a string tag used for routing to subscribers.
    fn event_type(&self) -> &str;
}

// EventPublisher is the output port for publishing domain events.
// Concrete adapters: InMemoryEventPublisher (tests), OutboxPublisher (production).
#[async_trait]
pub trait EventPublisher: Send + Sync {
    // publish delivers the event to the backing bus or store.
    // Async because real adapters write to a database or network.
    async fn publish(&self, event: Box<dyn DomainEvent>) -> Result<(), String>;
}

// InMemoryEventPublisher stores events in a mutex-protected Vec for test inspection.
pub struct InMemoryEventPublisher {
    // events holds published events; Arc<Mutex<...>> allows interior mutability.
    pub events: Arc<Mutex<Vec<Box<dyn DomainEvent>>>>,
}

impl InMemoryEventPublisher {
    // new constructs an empty in-memory publisher.
    pub fn new() -> Self {
        InMemoryEventPublisher { events: Arc::new(Mutex::new(Vec::new())) }
    }
}

#[async_trait]
impl EventPublisher for InMemoryEventPublisher {
    // publish appends the event to the in-memory Vec.
    // Mutex lock ensures serial writes even when tests spawn tasks.
    async fn publish(&self, event: Box<dyn DomainEvent>) -> Result<(), String> {
        self.events.lock().unwrap().push(event);
        Ok(())
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The `EventPublisher` port hides whether events go to an in-memory Vec, a Postgres outbox, or a Kafka topic — the application service calls `Publish` and never needs to know which backend is active.

**Why it matters:** Swapping from an in-memory publisher to an outbox-backed one requires changing only the composition root. Teams can start with `InMemoryEventPublisher` in early development, graduate to the outbox pattern as reliability requirements grow, and never touch the service that publishes events.

---

### Example 31: ApprovalRouterPort — routing POs to approval workflows

A PO with total value above a threshold must route to senior approval. The routing decision belongs to a dedicated output port, not to a conditional in the service.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package app defines the ApprovalRouterPort output port.
// Routing POs to approval workflows is an infrastructure concern — the domain does not own it.
package app

import (
    "context"
    "procurement/purchasing/domain"
)

// ApprovalRouterPort routes a submitted PurchaseOrder to an approval workflow.
// Concrete adapters: InMemoryApprovalRouter (tests), BPMNEngineRouter (production).
type ApprovalRouterPort interface {
    // Route sends the purchase order to the correct approval workflow.
    // Returns the assigned workflow ID for tracking.
    Route(ctx context.Context, po domain.PurchaseOrder) (WorkflowID, error)
}

// WorkflowID identifies an approval workflow instance in the external BPMN engine.
type WorkflowID string

// InMemoryApprovalRouter records which POs were routed and with what workflow ID.
// Used in unit tests to verify that the service calls Route after submission.
type InMemoryApprovalRouter struct {
    // Routed maps PurchaseOrderID to the assigned WorkflowID for test inspection.
    Routed map[domain.PurchaseOrderID]WorkflowID
}

// NewInMemoryApprovalRouter constructs a router with an initialised map.
func NewInMemoryApprovalRouter() *InMemoryApprovalRouter {
    return &InMemoryApprovalRouter{Routed: make(map[domain.PurchaseOrderID]WorkflowID)}
}

// Route records the routing decision and returns a synthetic WorkflowID.
func (r *InMemoryApprovalRouter) Route(_ context.Context, po domain.PurchaseOrder) (WorkflowID, error) {
    // Assign a deterministic workflow ID for test reproducibility.
    wfID := WorkflowID("WF-" + string(po.ID))
    // Record the routing so tests can assert the correct PO was routed.
    r.Routed[po.ID] = wfID
    return wfID, nil
}

// Compile-time assertion: *InMemoryApprovalRouter must satisfy ApprovalRouterPort.
var _ ApprovalRouterPort = (*InMemoryApprovalRouter)(nil)
```

{{< /tab >}}

{{< tab >}}

```rust
// app/approval_router.rs — ApprovalRouterPort output port and stub.
use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use crate::purchasing::domain::{PurchaseOrder, PurchaseOrderID};

// WorkflowID identifies an approval workflow instance in the external engine.
#[derive(Debug, Clone, PartialEq)]
pub struct WorkflowID(pub String);

// ApprovalRouterPort routes submitted POs to approval workflows.
// Adapter implementations: in-memory stub (tests), BPMN engine client (production).
#[async_trait]
pub trait ApprovalRouterPort: Send + Sync {
    // route sends the PO to the correct workflow and returns its ID.
    async fn route(&self, po: &PurchaseOrder) -> Result<WorkflowID, String>;
}

// InMemoryApprovalRouter records routed POs for test assertion.
pub struct InMemoryApprovalRouter {
    // routed maps PurchaseOrderID to WorkflowID for post-act inspection.
    routed: Arc<Mutex<HashMap<PurchaseOrderID, WorkflowID>>>,
}

impl InMemoryApprovalRouter {
    // new constructs a router with an empty record map.
    pub fn new() -> Self {
        InMemoryApprovalRouter { routed: Arc::new(Mutex::new(HashMap::new())) }
    }
}

#[async_trait]
impl ApprovalRouterPort for InMemoryApprovalRouter {
    // route stores the routing decision and returns a synthetic WorkflowID.
    async fn route(&self, po: &PurchaseOrder) -> Result<WorkflowID, String> {
        // Derive a deterministic workflow ID from the PO identity.
        let wf_id = WorkflowID(format!("WF-{}", po.id.0));
        self.routed.lock().unwrap().insert(po.id.clone(), wf_id.clone());
        Ok(wf_id)
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** A dedicated port for approval routing allows the adapter to change (stub → BPMN engine → rules engine) without touching the service that initiates the routing.

**Why it matters:** Approval workflow engines (Camunda, Activiti, cloud Step Functions) each have different APIs. The `ApprovalRouterPort` encapsulates that API behind a two-method interface. Swapping engines means writing a new adapter, not modifying the purchase order service that has already been tested against the in-memory stub.

---

### Example 32: Full intermediate flow diagram — two contexts, four ports

```mermaid
flowchart TD
    accTitle: Example 32: Full intermediate flow diagram — two contexts, four ports
    accDescr: Flowchart with 8 nodes and 14 connections. Nodes: HTTP POST /purchase-orders chi router — primary adapter, IssuePurchaseOrder Service app layer, SupplierRepository. FindByID output port — cross-context, InMemory or Postgres SupplierRepo adapter, PurchaseOrder Repository.Save output port — same context, InMemory or Postgres PORepo adapter, EventPublisher. Publish output port — event bus, InMemory or Outbox EventPublisher adapter. Connections: HTTP POST /purchase-orders chi router — primary adapter to IssuePurchaseOrder Service app layer (IssueCommand DTO), IssuePurchaseOrder Service app layer to SupplierRepository. FindByID output port — cross-context (FindByID(supplier ID)), SupplierRepository. FindByID output port — cross-context to InMemory or Postgres SupplierRepo adapter, InMemory or Postgres SupplierRepo adapter to SupplierRepository. FindByID output port — cross-context (Supplier aggregate), SupplierRepository. FindByID output port — cross-context to IssuePurchaseOrder Service app layer (domain.Supplier), IssuePurchaseOrder Service app layer to PurchaseOrder Repository.Save output port — same context (Save(po)), PurchaseOrder Repository.Save output port — same context to InMemory or Postgres PORepo adapter, InMemory or Postgres PORepo adapter to PurchaseOrder Repository.Save output port — same context (ok), PurchaseOrder Repository.Save output port — same context to IssuePurchaseOrder Service app layer (ok), IssuePurchaseOrder Service app layer to EventPublisher. Publish output port — event bus (Publish(event)), EventPublisher. Publish output port — event bus to InMemory or Outbox EventPublisher adapter, InMemory or Outbox EventPublisher adapter to EventPublisher. Publish output port — event bus (ok), and 2 more.
    A["HTTP POST<br/>/purchase-orders<br/>chi router — primary<br/>adapter"]:::blue
    B["IssuePurchaseOrder<br/>Service<br/>app layer"]:::teal
    C["SupplierRepository.<br/>FindByID<br/>output port —<br/>cross-context"]:::orange
    D["InMemory or Postgres<br/>SupplierRepo adapter"]:::teal
    E["PurchaseOrder<br/>Repository.Save<br/>output port — same<br/>context"]:::orange
    F["InMemory or Postgres<br/>PORepo adapter"]:::teal
    G["EventPublisher.<br/>Publish<br/>output port — event<br/>bus"]:::orange
    H["InMemory or Outbox<br/>EventPublisher<br/>adapter"]:::teal

    A -->|"IssueCommand DTO"| B
    B -->|"FindByID(supplier<br/>ID)"| C
    C --> D
    D -->|"Supplier aggregate"| C
    C -->|"domain.Supplier"| B
    B -->|"Save(po)"| E
    E --> F
    F -->|"ok"| E
    E -->|"ok"| B
    B -->|"Publish(event)"| G
    G --> H
    H -->|"ok"| G
    G -->|"ok"| B
    B -->|"PurchaseOrderID"| A

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

This diagram traces a single HTTP request through the complete intermediate hexagonal wiring: one primary adapter, one application service, three output ports each backed by a swappable adapter pair.

**Key takeaway:** Every arrow that crosses from the blue HTTP adapter into the teal service, or from the service into an orange port, crosses an abstraction boundary — the service never imports HTTP or database packages.

**Why it matters:** The diagram reveals that the service is fully testable at the unit level by replacing all three orange ports with in-memory adapters. No network call, no Docker container. The same diagram shows exactly which adapters to replace for integration testing (swap in-memory with Postgres for E and F) or end-to-end testing (run all three against real infrastructure).

---

## Section 4: Multi-Context Composition Root (Examples 33–35)

### Example 33: Composition root wiring two contexts

`main.go` creates one `EventPublisher` shared between both contexts, wires each context's repository, and passes the purchasing service's supplier dependency to the correct adapter.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// main.go — composition root wiring purchasing and supplier contexts.
// No DI framework: all dependencies are explicit constructor arguments.
package main

import (
    "database/sql"
    "log"
    "os"
    purchasingApp  "procurement/purchasing/app"
    purchasingHTTP "procurement/purchasing/adapter/in/http"
    purchasingPG   "procurement/purchasing/adapter/out/postgres"
    purchasingMem  "procurement/purchasing/adapter/out/mem"
    supplierApp    "procurement/supplier/app"
    supplierPG     "procurement/supplier/adapter/out/postgres"
    supplierMem    "procurement/supplier/adapter/out/mem"
)

func main() {
    dbURL := os.Getenv("DATABASE_URL")
    // shared is the single EventPublisher used by both contexts.
    // One publisher means one place to change when the event bus changes.
    var shared purchasingApp.EventPublisher

    var poRepo    purchasingApp.PurchaseOrderRepository
    var supRepo   supplierApp.SupplierRepository

    if dbURL != "" {
        // Both contexts share the same database handle but use separate adapter instances.
        db, err := sql.Open("pgx", dbURL)
        if err != nil { log.Fatalf("db open: %v", err) }
        // Each adapter wraps the shared *sql.DB; no state is shared between adapters.
        poRepo  = purchasingPG.NewPurchaseOrderRepo(db)
        supRepo = supplierPG.NewSupplierRepo(db)
        // In production, EventPublisher is the outbox adapter writing to the same DB.
        shared = purchasingPG.NewOutboxEventPublisher(db)
    } else {
        // In-memory adapters for local development and unit test binary.
        poRepo  = purchasingMem.NewPurchaseOrderRepo()
        supRepo = supplierMem.NewSupplierRepo()
        // In-memory publisher — collects events for inspection, no external bus.
        shared = &purchasingApp.InMemoryEventPublisher{}
    }

    // Wire the purchasing service with its three dependencies.
    // The service sees only port interfaces — concrete types are invisible.
    purchasingSvc := purchasingApp.NewIssuePurchaseOrderService(poRepo, supRepo, shared)
    // Mount the HTTP router with the service as the only dependency.
    router := purchasingHTTP.NewRouter(purchasingSvc)
    log.Fatal(router.ListenAndServe(":8080"))
}
```

{{< /tab >}}

{{< tab >}}

```rust
// main.rs — multi-context composition root wiring purchasing and supplier.
use std::sync::Arc;
use std::env;

#[tokio::main]
async fn main() {
    let db_url = env::var("DATABASE_URL").ok();

    // Declare trait-object ports; the concrete type is resolved below.
    let po_repo: Arc<dyn purchasing::app::PurchaseOrderRepository>;
    let sup_repo: Arc<dyn supplier::app::SupplierRepository>;
    let publisher: Arc<dyn purchasing::app::EventPublisher>;

    match db_url {
        Some(url) => {
            // One shared pool for both contexts; adapters do not share state.
            let pool = sqlx::PgPool::connect(&url).await
                .expect("cannot connect to Postgres");
            // Clone is cheap for PgPool — it shares the underlying connection pool.
            po_repo   = Arc::new(purchasing::adapter::out::postgres::PostgresPurchaseOrderRepo::new(pool.clone()));
            sup_repo  = Arc::new(supplier::adapter::out::postgres::PostgresSupplierRepo::new(pool.clone()));
            // Outbox publisher writes events atomically with the domain state changes.
            publisher = Arc::new(purchasing::adapter::out::postgres::OutboxEventPublisher::new(pool));
        }
        None => {
            // All-in-memory adapters for local development and unit test binary.
            po_repo   = Arc::new(purchasing::adapter::out::mem::InMemoryPurchaseOrderRepo::new());
            sup_repo  = Arc::new(supplier::adapter::out::mem::InMemorySupplierRepo::new());
            publisher = Arc::new(purchasing::app::InMemoryEventPublisher::new());
        }
    }

    // Construct the service with three explicitly injected dependencies.
    // Arc::clone is cheap — it bumps a reference count, no deep copy.
    let svc = Arc::new(purchasing::app::IssuePurchaseOrderService::new(
        po_repo, sup_repo, publisher,
    ));

    // Mount axum router and serve; svc is passed by Arc clone to each handler.
    let app = purchasing::adapter::in_http::router(svc);
    axum::Server::bind(&"0.0.0.0:8080".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The composition root is the only file that imports concrete adapter types — every other file imports only ports (interfaces/traits), so changing an adapter requires touching exactly one file.

**Why it matters:** In a DI-container-based system, the wiring is distributed across annotations and config files; tracing a dependency requires tool support. In this explicit wiring, a developer can read `main.go` top to bottom and know exactly which concrete type backs every port — a significant debugging and onboarding advantage, especially for teams new to the codebase.

---

### Example 34: Constructor injection depth

Nested constructor calls reveal the full dependency graph at the point of reading `main.go`. No reflection, no runtime container, no annotation scanning.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// explicit_wiring.go — excerpt showing deep constructor injection for the purchasing service.
// Every dependency is visible as a constructor argument; nothing is hidden in a container.
package main

import (
    purchasingApp "procurement/purchasing/app"
    purchasingMem "procurement/purchasing/adapter/out/mem"
    supplierMem   "procurement/supplier/adapter/out/mem"
)

// wirePurchasingService constructs the full service graph without a DI framework.
// Step through this function in a debugger to trace any dependency.
func wirePurchasingService() *purchasingApp.IssuePurchaseOrderService {
    // Level 3 (leaf) — in-memory adapters need no dependencies of their own.
    poRepo      := purchasingMem.NewPurchaseOrderRepo()
    supRepo     := supplierMem.NewSupplierRepo()
    publisher   := &purchasingApp.InMemoryEventPublisher{}
    approvalRtr := purchasingApp.NewInMemoryApprovalRouter()
    clock       := purchasingApp.FixedClock{} // deterministic time for dev/test.

    // Level 2 — the service depends on four port implementations.
    // All four are visible on a single line; a DI container would hide them.
    return purchasingApp.NewIssuePurchaseOrderService(
        poRepo,
        supRepo,
        publisher,
        approvalRtr,
        clock,
    )
}
```

{{< /tab >}}

{{< tab >}}

```rust
// wiring.rs — explicit service construction showing full dependency depth.
// All adapters are constructed before the service that depends on them.
use std::sync::Arc;
use crate::purchasing::app::{
    IssuePurchaseOrderService, InMemoryEventPublisher, FixedClock,
    InMemoryApprovalRouter,
};
use crate::purchasing::adapter::out::mem::InMemoryPurchaseOrderRepo;
use crate::supplier::adapter::out::mem::InMemorySupplierRepo;

// wire_purchasing_service constructs the complete purchasing service graph.
// Returns Arc so the service can be shared across async HTTP handler threads.
pub fn wire_purchasing_service() -> Arc<IssuePurchaseOrderService> {
    // Leaf adapters are constructed first — they have no inward dependencies.
    let po_repo      = Arc::new(InMemoryPurchaseOrderRepo::new());
    let sup_repo     = Arc::new(InMemorySupplierRepo::new());
    let publisher    = Arc::new(InMemoryEventPublisher::new());
    let approval_rtr = Arc::new(InMemoryApprovalRouter::new());
    // FixedClock returns a constant time; replace with SystemClock in production.
    let clock        = Arc::new(FixedClock::default());

    // Construct the service by passing all five dependencies explicitly.
    // A reader can see every dependency by reading this one function.
    Arc::new(IssuePurchaseOrderService::new(
        po_repo,
        sup_repo,
        publisher,
        approval_rtr,
        clock,
    ))
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** Constructor injection with plain function calls is the simplest dependency injection — no magic, fully step-debuggable, and the entire object graph fits on one screen.

**Why it matters:** DI containers in Java-world hide the object graph inside annotations and classpath scanning. When a circular dependency appears or a bean is missing, the error surfaces at runtime (often only in production). With plain constructor calls, a circular dependency is a compile error, a missing dependency is a type error, and the entire graph is readable from `main.go` without a diagram tool.

---

### Example 35: Command DTO at the adapter boundary

The HTTP adapter deserializes JSON into a command DTO, validates it, then passes a clean `IssueCommand` value into the application service. The DTO never enters the domain package.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package http is the primary HTTP adapter for the purchasing context.
// It receives JSON, validates it, and converts to the application command type.
package http

import (
    "encoding/json"
    "net/http"
    "procurement/purchasing/app"
)

// issuePORequest is the JSON body for POST /purchase-orders.
// This struct exists only in the adapter layer — it is not an app or domain type.
type issuePORequest struct {
    // SupplierID is required; empty string is rejected by validate().
    SupplierID string            `json:"supplier_id"`
    // Items is required; empty slice is rejected by validate().
    Items      []lineItemRequest `json:"items"`
}

// lineItemRequest is the JSON line-item shape; maps 1-to-1 with app.LineItem.
type lineItemRequest struct {
    SKU      string `json:"sku"`
    Quantity int    `json:"quantity"`
}

// validate enforces required-field rules before the command enters the service.
// Returns a human-readable error string; never returns a domain error.
func (r issuePORequest) validate() error {
    if r.SupplierID == "" {
        // SupplierID is mandatory — reject early with a clear message.
        return errBadRequest("supplier_id is required")
    }
    if len(r.Items) == 0 {
        // At least one line item is required to issue a purchase order.
        return errBadRequest("items must not be empty")
    }
    return nil
}

// HandleIssuePO is the chi handler for POST /purchase-orders.
func HandleIssuePO(svc app.IssuePurchaseOrderUseCase) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req issuePORequest
        // Decode JSON body into the adapter-local DTO struct.
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "invalid JSON", http.StatusBadRequest)
            return
        }
        // Validate at the adapter boundary before calling the service.
        if err := req.validate(); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        // Convert the DTO to the application command type — no domain import needed.
        cmd := app.IssueCommand{
            SupplierID: req.SupplierID,
            Items:      toAppLineItems(req.Items),
        }
        // Delegate to the application service; the adapter does no business logic.
        id, err := svc.Issue(r.Context(), cmd)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(map[string]string{"id": string(id)})
    }
}
```

{{< /tab >}}

{{< tab >}}

```rust
// adapter/in/http/issue_po_handler.rs — command DTO and handler for axum.
// #[derive(Deserialize, Validate)] handles JSON parsing and input validation.
use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use validator::Validate;
use std::sync::Arc;
use crate::purchasing::app::{IssuePurchaseOrderService, IssueCommand};

// IssuePORequest is the JSON body shape for POST /purchase-orders.
// Lives only in the adapter layer — the app and domain packages never import it.
#[derive(Debug, Deserialize, Validate)]
pub struct IssuePORequest {
    // #[validate(length(min = 1))] rejects empty supplier_id before service is called.
    #[validate(length(min = 1, message = "supplier_id is required"))]
    pub supplier_id: String,
    // #[validate(length(min = 1))] rejects empty items slice before service is called.
    #[validate(length(min = 1, message = "items must not be empty"))]
    pub items: Vec<LineItemRequest>,
}

// LineItemRequest is the JSON shape for a single order line.
#[derive(Debug, Deserialize, Serialize)]
pub struct LineItemRequest {
    pub sku: String,
    pub quantity: u32,
}

// issue_po_handler is the axum handler for POST /purchase-orders.
pub async fn issue_po_handler(
    State(svc): State<Arc<IssuePurchaseOrderService>>,
    Json(req): Json<IssuePORequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), StatusCode> {
    // Validate runs the #[validate(...)] annotations; returns 400 on failure.
    req.validate().map_err(|_| StatusCode::BAD_REQUEST)?;

    // Convert the adapter DTO to the application command type.
    let cmd = IssueCommand {
        supplier_id: req.supplier_id,
        // Map each JSON line item to the app-layer LineItem type.
        items: req.items.into_iter().map(|i| crate::purchasing::app::LineItem {
            sku: i.sku,
            quantity: i.quantity,
        }).collect(),
    };

    // Delegate to the service; the adapter performs no business logic.
    let id = svc.issue(cmd).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "id": id.0 }))))
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The command DTO (adapter layer) and the `IssueCommand` (app layer) are deliberately separate types — the adapter translates between the wire format and the application contract, preventing HTTP concerns from leaking into the service.

**Why it matters:** Keeping JSON field names and HTTP status codes out of the application layer means the service is reusable from a CLI, gRPC, or message queue adapter without any modification. The conversion cost (one struct mapping) is trivial; the decoupling benefit is that each adapter can evolve its wire format independently from the application's command shape.

---

## Section 5: Structural Enforcement and CQRS (Examples 36–43)

### Example 36: Dependency rule enforcement in CI

`go list` can detect illegal cross-package imports by checking that no `domain/` package imports `adapter/` or `app/`. Rust's module visibility (`pub(crate)`, `pub(super)`) enforces the same boundary at compile time.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// dependency_check_test.go — CI guard verifying the dependency rule.
// This test fails the build if any domain package imports an adapter package.
package infra_test

import (
    "os/exec"
    "strings"
    "testing"
)

// TestDomainPackageHasNoAdapterImports uses 'go list' to extract the import graph
// and asserts that domain packages never import adapter packages.
func TestDomainPackageHasNoAdapterImports(t *testing.T) {
    // 'go list -f {{.ImportPath}} {{.Imports}}' prints each package's imports.
    // The './purchasing/domain/...' pattern matches all sub-packages.
    out, err := exec.Command(
        "go", "list", "-f", "{{.ImportPath}} {{.Imports}}",
        "./purchasing/domain/...",
    ).Output()
    if err != nil {
        t.Fatalf("go list failed: %v", err)
    }
    // Scan each line; fail if any domain package imports adapter or app.
    for _, line := range strings.Split(string(out), "\n") {
        if strings.Contains(line, "adapter/") {
            // Found an illegal cross-layer import — print the offending line.
            t.Errorf("domain package imports adapter: %s", line)
        }
        if strings.Contains(line, "/app") {
            // domain must not import app — app may import domain, never the reverse.
            t.Errorf("domain package imports app: %s", line)
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```rust
// In Rust, module visibility prevents violations at compile time.
// The visibility modifiers below enforce the same dependency rule.

// domain/mod.rs — domain types are pub so app can import them.
// But domain never imports crate::app or crate::adapter — compiler enforces this.
pub mod purchase_order;
pub mod supplier;

// app/mod.rs — app is pub(crate) so adapters can import it but external crates cannot.
pub(crate) mod issue_purchase_order;
pub(crate) mod ports;

// adapter/out/mod.rs — adapters are pub(crate) and only import app ports and domain.
// Any attempt to import adapter from domain or app yields a compile error.
pub(crate) mod mem;
pub(crate) mod postgres;

// The illegal import below would cause a compile error:
// In domain/purchase_order.rs:
//   use crate::adapter::out::postgres::PostgresPurchaseOrderRepo; // <- ERROR
// Rust's module system makes this structurally impossible without pub(super) escalation.
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** Go needs an explicit test to enforce the dependency rule because its package system does not have visibility modifiers; Rust enforces the same boundary at compile time via `pub(crate)` and `pub(super)`.

**Why it matters:** Without the CI check, a junior developer can accidentally add an import from `domain/` to `adapter/` and the build still passes. The `go list` test catches it on the next CI run. In Rust, the violation is impossible — the compiler rejects it before any test runs. Both strategies ensure the dependency rule is machine-verified, not just documented.

---

### Example 37: CQRS motivation — separating command and query ports

A single `PurchaseOrderRepository` port with both `Save` and `FindByStatus` conflates write and read concerns. CQRS splits them: the command service uses the write port; the query service uses the read port.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package app shows why splitting command and query ports improves the design.
// Before CQRS: one repository interface for both reads and writes.
package app

// Before — single port mixes command and query responsibilities.
// The command service (Issue) does not need FindByStatus or FindPendingApproval.
// Including those methods forces every command adapter to implement unused methods.
type PurchaseOrderRepositoryBefore interface {
    Save(ctx context.Context, po domain.PurchaseOrder) error
    FindByID(ctx context.Context, id domain.PurchaseOrderID) (domain.PurchaseOrder, error)
    // These two methods are only needed by query services — not by command services.
    FindByStatus(ctx context.Context, status domain.POStatus) ([]domain.PurchaseOrder, error)
    FindPendingApproval(ctx context.Context) ([]domain.PurchaseOrder, error)
}

// After CQRS — two focused ports.
// PurchaseOrderWriter is the command-side port: write-only.
type PurchaseOrderWriter interface {
    Save(ctx context.Context, po domain.PurchaseOrder) error
    FindByID(ctx context.Context, id domain.PurchaseOrderID) (domain.PurchaseOrder, error)
}

// PurchaseOrderReader is the query-side port: read-only, returns read models not aggregates.
type PurchaseOrderReader interface {
    FindByStatus(ctx context.Context, status domain.POStatus, page, pageSize int) ([]PurchaseOrderSummary, error)
    FindPendingApproval(ctx context.Context) ([]PurchaseOrderSummary, error)
}
```

{{< /tab >}}

{{< tab >}}

```rust
// app/ports.rs — CQRS port split illustrated in Rust traits.
// Before CQRS: one fat trait mixing command and query responsibilities.
use async_trait::async_trait;

// PurchaseOrderWriterPort contains only the write-side methods.
// Command services depend on this port; they never call FindByStatus.
#[async_trait]
pub trait PurchaseOrderWriterPort: Send + Sync {
    // save persists a new or updated aggregate; used by command services.
    async fn save(&self, po: crate::domain::PurchaseOrder) -> Result<(), crate::domain::DomainError>;
    // find_by_id retrieves an aggregate for optimistic-lock checks before save.
    async fn find_by_id(&self, id: crate::domain::PurchaseOrderID) -> Result<crate::domain::PurchaseOrder, crate::domain::DomainError>;
}

// PurchaseOrderReaderPort contains only the read-side methods.
// Query services depend on this port; they never call save.
// Read models (PurchaseOrderSummary) replace full aggregates — leaner payloads.
#[async_trait]
pub trait PurchaseOrderReaderPort: Send + Sync {
    // find_by_status returns paginated summaries filtered by status.
    async fn find_by_status(
        &self,
        status: &str,
        page: u32,
        page_size: u32,
    ) -> Result<Vec<crate::app::query::PurchaseOrderSummary>, crate::domain::DomainError>;
    // find_pending_approval returns summaries awaiting reviewer action.
    async fn find_pending_approval(&self) -> Result<Vec<crate::app::query::PurchaseOrderSummary>, crate::domain::DomainError>;
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** CQRS port segregation eliminates unused method obligations — command adapters implement only write methods, read adapters implement only read methods.

**Why it matters:** A fat repository interface forces every adapter to implement methods it never uses. In Go, that means a compile error ("does not implement interface") whenever a query method is added, even for adapters that serve only command services. Segregated ports give each adapter a minimal surface area, which reduces the blast radius of interface changes and makes adapters easier to reason about in isolation.

---

### Example 38: CQRS command service

The command service `Issue` returns only the new `PurchaseOrderID`. It never returns a read model, never fetches a list, and never calls the read port.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package app — command service for the purchasing context.
// IssuePurchaseOrderCommandService handles only the write side.
package app

import (
    "context"
    "procurement/purchasing/domain"
)

// IssuePurchaseOrderCommandService orchestrates PO creation on the write side.
// It depends on PurchaseOrderWriter (not the full Repository) — CQRS segregation.
type IssuePurchaseOrderCommandService struct {
    // writer is the command-side port; does not expose query methods.
    writer   PurchaseOrderWriter
    // supRepo cross-context port for supplier eligibility check.
    supRepo  SupplierRepository
    // clock deterministic time for domain aggregate timestamps.
    clock    Clock
    // publisher sends PurchaseOrderIssued event after successful write.
    publisher EventPublisher
}

// Issue processes the command and returns only the new aggregate identity.
// It does NOT return the full PurchaseOrder — that is the query service's job.
func (s *IssuePurchaseOrderCommandService) Issue(ctx context.Context, cmd IssueCommand) (domain.PurchaseOrderID, error) {
    // Eligibility guard — cross-context call via output port.
    sup, err := s.supRepo.FindByID(ctx, cmd.SupplierID)
    if err != nil || !sup.IsApproved() {
        return "", ErrSupplierNotApproved
    }
    // Create domain aggregate using clock-provided timestamp.
    po, err := domain.NewPurchaseOrder(cmd.SupplierID, cmd.Items, s.clock.Now())
    if err != nil {
        return "", err
    }
    // Persist via write-side port only.
    if err := s.writer.Save(ctx, po); err != nil {
        return "", err
    }
    // Publish domain event; caller does not see the event — only the ID.
    _ = s.publisher.Publish(ctx, domain.PurchaseOrderIssuedEvent{ID: po.ID})
    // Return only the identity — no read model, no full aggregate.
    return po.ID, nil
}
```

{{< /tab >}}

{{< tab >}}

```rust
// app/command/issue_purchase_order.rs — command service, write side only.
use crate::app::ports::{PurchaseOrderWriterPort, SupplierRepository, Clock, EventPublisher};
use crate::domain::{PurchaseOrder, PurchaseOrderID, PurchaseOrderIssuedEvent};

// IssuePurchaseOrderCommandService holds the four write-side dependencies.
pub struct IssuePurchaseOrderCommandService {
    // writer is the CQRS write-side port; no read methods are accessible.
    writer:    std::sync::Arc<dyn PurchaseOrderWriterPort>,
    sup_repo:  std::sync::Arc<dyn SupplierRepository>,
    clock:     std::sync::Arc<dyn Clock>,
    publisher: std::sync::Arc<dyn EventPublisher>,
}

impl IssuePurchaseOrderCommandService {
    // issue processes the command and returns only the new PurchaseOrderID.
    // It never returns a read model — the query service handles that.
    pub async fn issue(&self, cmd: IssueCommand) -> Result<PurchaseOrderID, AppError> {
        // Eligibility guard — cross-context output port call.
        let sup = self.sup_repo
            .find_by_id(cmd.supplier_id.clone())
            .await
            .map_err(|_| AppError::SupplierNotApproved)?;
        if !sup.is_approved() {
            return Err(AppError::SupplierNotApproved);
        }
        // Create domain aggregate with clock timestamp.
        let now = self.clock.now();
        let po = PurchaseOrder::new(cmd.supplier_id, cmd.items, now)
            .map_err(|e| AppError::Infrastructure(e.to_string()))?;
        // Persist via write-side port.
        let id = po.id.clone();
        self.writer.save(po).await
            .map_err(|e| AppError::Infrastructure(e.to_string()))?;
        // Publish event; return value is the identity only, not the full aggregate.
        let _ = self.publisher.publish(Box::new(PurchaseOrderIssuedEvent { id: id.clone() })).await;
        Ok(id)
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The command service's return type (`PurchaseOrderID`) signals its CQRS role — writes produce identities, not read models.

**Why it matters:** Returning the full aggregate from a command service couples the write and read models. When the read model gains display fields (formatted amounts, computed totals, denormalized supplier names), the command service must change even though it performs no reads. Returning only the ID keeps the command service immune to read-model evolution.

---

### Example 39: CQRS query service

The query service `FindPendingApproval` returns read models, not domain aggregates. It depends only on `PurchaseOrderReader` — the write port is invisible to it.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package app — query service for the purchasing context.
// FindPurchaseOrdersQueryService handles only the read side.
package app

import "context"

// FindPurchaseOrdersQueryService serves read-only queries.
// It depends on PurchaseOrderReader (not the full Repository) — CQRS segregation.
type FindPurchaseOrdersQueryService struct {
    // reader is the query-side port; Save and FindByID are not accessible.
    reader PurchaseOrderReader
}

// FindPendingApproval returns read models for POs awaiting reviewer action.
// Returns []PurchaseOrderSummary — not []domain.PurchaseOrder.
// Read models are leaner: no business methods, no lifecycle invariants.
func (s *FindPurchaseOrdersQueryService) FindPendingApproval(ctx context.Context) ([]PurchaseOrderSummary, error) {
    // Delegate entirely to the read-side port; no domain logic applied here.
    return s.reader.FindPendingApproval(ctx)
}

// FindByStatus returns a paginated set of summaries filtered by status.
// Page numbering is 1-based; pageSize is clamped by the adapter if too large.
func (s *FindPurchaseOrdersQueryService) FindByStatus(ctx context.Context, status string, page, pageSize int) ([]PurchaseOrderSummary, error) {
    // Convert the string status to the typed domain enum before calling the port.
    return s.reader.FindByStatus(ctx, domain.POStatus(status), page, pageSize)
}
```

{{< /tab >}}

{{< tab >}}

```rust
// app/query/find_purchase_orders.rs — query service, read side only.
use crate::app::ports::PurchaseOrderReaderPort;
use crate::app::query::PurchaseOrderSummary;

// FindPurchaseOrdersQueryService holds only the read-side port.
// It has no access to PurchaseOrderWriterPort — CQRS segregation enforced at type level.
pub struct FindPurchaseOrdersQueryService {
    // reader exposes only read methods; save and find_by_id do not exist here.
    reader: std::sync::Arc<dyn PurchaseOrderReaderPort>,
}

impl FindPurchaseOrdersQueryService {
    // find_pending_approval delegates to the reader port without domain logic.
    // Returns PurchaseOrderSummary read models, not full domain aggregates.
    pub async fn find_pending_approval(&self) -> Result<Vec<PurchaseOrderSummary>, crate::domain::DomainError> {
        // No business logic in the query service — read models are projections.
        self.reader.find_pending_approval().await
    }

    // find_by_status returns paginated summaries filtered by the given status string.
    pub async fn find_by_status(
        &self,
        status: &str,
        page: u32,
        page_size: u32,
    ) -> Result<Vec<PurchaseOrderSummary>, crate::domain::DomainError> {
        // Pass through to the reader port; pagination is the adapter's responsibility.
        self.reader.find_by_status(status, page, page_size).await
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The query service is a thin orchestrator — it delegates to the reader port without adding business logic, because queries are projections, not decisions.

**Why it matters:** Placing query logic in the same service as command logic creates services that grow unbounded. Every new filter, sort, or projection adds a method. CQRS gives teams a structural rule for when to split: if the operation reads without side effects, it belongs in the query service — full stop.

---

### Example 40: Read-only output port — PurchaseOrderReadRepository

The read-side adapter implements `PurchaseOrderReader` and returns `PurchaseOrderSummary` read models instead of full aggregates. The adapter can be backed by a read replica, a materialized view, or a denormalized table.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package mem provides an in-memory read-side adapter for the purchasing context.
// It implements PurchaseOrderReader returning PurchaseOrderSummary read models.
package mem

import (
    "context"
    "procurement/purchasing/app"
    "procurement/purchasing/domain"
    "sync"
)

// InMemoryPurchaseOrderReader holds summaries projected from saved aggregates.
// In a real system this might tail an event log; here it shares the write store.
type InMemoryPurchaseOrderReader struct {
    mu       sync.RWMutex
    // summaries maps PurchaseOrderID to its read-model projection.
    summaries map[domain.PurchaseOrderID]app.PurchaseOrderSummary
}

// NewInMemoryPurchaseOrderReader constructs a reader with an empty summary store.
func NewInMemoryPurchaseOrderReader() *InMemoryPurchaseOrderReader {
    return &InMemoryPurchaseOrderReader{
        summaries: make(map[domain.PurchaseOrderID]app.PurchaseOrderSummary),
    }
}

// Project updates the read-side store when a new aggregate is saved.
// Called by tests and the in-memory write adapter after each save.
func (r *InMemoryPurchaseOrderReader) Project(po domain.PurchaseOrder) {
    r.mu.Lock()
    defer r.mu.Unlock()
    r.summaries[po.ID] = app.PurchaseOrderSummary{
        ID:         string(po.ID),
        SupplierID: string(po.SupplierID),
        // Status is formatted for display; domain enum is the source of truth.
        Status:     string(po.Status),
    }
}

// FindPendingApproval returns all summaries with PENDING_APPROVAL status.
func (r *InMemoryPurchaseOrderReader) FindPendingApproval(ctx context.Context) ([]app.PurchaseOrderSummary, error) {
    r.mu.RLock()
    defer r.mu.RUnlock()
    var result []app.PurchaseOrderSummary
    for _, s := range r.summaries {
        if s.Status == string(domain.POPendingApproval) {
            result = append(result, s)
        }
    }
    return result, nil
}

// FindByStatus returns summaries filtered by status with simple page/pageSize slicing.
func (r *InMemoryPurchaseOrderReader) FindByStatus(ctx context.Context, status domain.POStatus, page, pageSize int) ([]app.PurchaseOrderSummary, error) {
    r.mu.RLock()
    defer r.mu.RUnlock()
    var all []app.PurchaseOrderSummary
    for _, s := range r.summaries {
        if s.Status == string(status) {
            all = append(all, s)
        }
    }
    // Compute slice bounds for pagination — avoids out-of-bounds panic.
    start := (page - 1) * pageSize
    if start >= len(all) {
        return nil, nil
    }
    end := start + pageSize
    if end > len(all) {
        end = len(all)
    }
    return all[start:end], nil
}

// Compile-time assertion: *InMemoryPurchaseOrderReader must satisfy app.PurchaseOrderReader.
var _ app.PurchaseOrderReader = (*InMemoryPurchaseOrderReader)(nil)
```

{{< /tab >}}

{{< tab >}}

```rust
// adapter/out/mem/purchase_order_reader.rs — in-memory read adapter.
use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use crate::app::ports::PurchaseOrderReaderPort;
use crate::app::query::PurchaseOrderSummary;
use crate::domain::{PurchaseOrder, PurchaseOrderID};

// InMemoryPurchaseOrderReader projects aggregates into read-model summaries.
pub struct InMemoryPurchaseOrderReader {
    // summaries maps PurchaseOrderID to its read-model projection.
    summaries: Arc<Mutex<HashMap<String, PurchaseOrderSummary>>>,
}

impl InMemoryPurchaseOrderReader {
    // new constructs a reader with an empty summary map.
    pub fn new() -> Self {
        InMemoryPurchaseOrderReader { summaries: Arc::new(Mutex::new(HashMap::new())) }
    }

    // project updates the read-side store from a saved aggregate.
    // Called by the write adapter after each successful save.
    pub fn project(&self, po: &PurchaseOrder) {
        let mut store = self.summaries.lock().unwrap();
        store.insert(po.id.0.clone(), PurchaseOrderSummary {
            id: po.id.0.clone(),
            supplier_id: po.supplier_id.clone(),
            // status is a formatted string for display purposes.
            status: format!("{:?}", po.status),
        });
    }
}

#[async_trait]
impl PurchaseOrderReaderPort for InMemoryPurchaseOrderReader {
    // find_pending_approval returns summaries with PENDING_APPROVAL status.
    async fn find_pending_approval(&self) -> Result<Vec<PurchaseOrderSummary>, crate::domain::DomainError> {
        let store = self.summaries.lock().unwrap();
        // Filter by status string; could use an enum in a richer implementation.
        let pending: Vec<_> = store.values()
            .filter(|s| s.status == "PendingApproval")
            .cloned()
            .collect();
        Ok(pending)
    }

    // find_by_status returns paginated summaries filtered by the status string.
    async fn find_by_status(&self, status: &str, page: u32, page_size: u32) -> Result<Vec<PurchaseOrderSummary>, crate::domain::DomainError> {
        let store = self.summaries.lock().unwrap();
        let all: Vec<_> = store.values()
            .filter(|s| s.status == status)
            .cloned()
            .collect();
        // Compute pagination slice bounds; zero-indexed offset from 1-based page.
        let start = ((page - 1) * page_size) as usize;
        let end = (start + page_size as usize).min(all.len());
        Ok(all.get(start..end).unwrap_or(&[]).to_vec())
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The read adapter returns projected read models rather than full aggregates, keeping query responses lean and decoupled from domain logic.

**Why it matters:** Returning full aggregates from query endpoints exposes every domain field, including sensitive lifecycle methods and internal invariants. Read models are shaped for the consumer — API contracts can add display fields, computed properties, or formatted strings without touching the domain aggregate. This is the practical benefit of the CQRS read model pattern.

---

### Example 41: PO summary read model

`PurchaseOrderSummary` is a flat, display-ready struct that lives in `app/query/`. It carries no business methods, no lifecycle invariants, and no validation logic.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package query holds read models for the purchasing context.
// Read models are plain structs shaped for API responses — no business logic.
package query

// PurchaseOrderSummary is a read-model projection of the PurchaseOrder aggregate.
// It lives in app/query/, not in domain/ — consumers shape it, not the domain.
type PurchaseOrderSummary struct {
    // ID is the purchase order identity as a plain string for JSON serialisation.
    ID string `json:"id"`
    // SupplierID identifies the supplier, formatted for display.
    SupplierID string `json:"supplier_id"`
    // SupplierName is a denormalized display field; not in the aggregate.
    // Populated by the read adapter from a JOIN or a separate lookup.
    SupplierName string `json:"supplier_name,omitempty"`
    // Status is a human-readable string derived from the domain enum.
    Status string `json:"status"`
    // TotalAmount is a precomputed display value; the aggregate uses Money.
    TotalAmount string `json:"total_amount"`
    // CreatedAt is an ISO 8601 string for display; the aggregate uses time.Time.
    CreatedAt string `json:"created_at"`
}
// Note: PurchaseOrderSummary has no methods. It is a data bag for the API layer.
// The domain PurchaseOrder has methods (Submit, Approve) that this struct must not copy.
```

{{< /tab >}}

{{< tab >}}

```rust
// app/query/purchase_order_summary.rs — read model struct.
// #[derive(Serialize, Clone)] enables JSON output and cheap cloning for pagination.
use serde::Serialize;

// PurchaseOrderSummary is a flat read model shaped for API responses.
// Lives in app/query/, not in domain/ — no business logic, no lifecycle enforcement.
#[derive(Debug, Clone, Serialize)]
pub struct PurchaseOrderSummary {
    // id is the purchase order identity as a plain String for JSON.
    pub id: String,
    // supplier_id identifies the supplier without a domain newtype wrapper.
    pub supplier_id: String,
    // supplier_name is a denormalized display field; absent in the domain aggregate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub supplier_name: Option<String>,
    // status is a human-readable string, not the typed domain POStatus enum.
    pub status: String,
    // total_amount is a precomputed formatted string (e.g., "USD 1,250.00").
    pub total_amount: String,
    // created_at is ISO 8601 string for display; domain aggregate uses DateTime<Utc>.
    pub created_at: String,
}
// PurchaseOrderSummary intentionally has no methods — it is a serialisation target.
// Domain behaviour (approval, rejection, cancellation) stays in PurchaseOrder aggregate.
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** A read model is a data transfer object shaped by its consumer, not by the domain — it may include denormalized fields, formatted strings, and computed values that would be inappropriate in the domain aggregate.

**Why it matters:** Forcing API consumers to call domain methods to format display fields leaks domain logic into the presentation layer. A dedicated read model allows the domain aggregate to evolve its internal representation (changing `Money` precision, renaming a field) without breaking the API contract. The read model absorbs the breaking change in its projection logic, not in every consumer.

---

### Example 42: Paginated query — FindByStatus

Pagination belongs in the query port and its adapter, not in the service. The service passes `page` and `pageSize` to the reader port and returns the slice as-is.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package app — paginated query use case for the purchasing context.
// FindByStatusQuery carries both filter and pagination parameters.
package app

import "context"

// FindByStatusQuery carries the filter and pagination parameters for a status query.
// A dedicated query struct is cleaner than a long parameter list.
type FindByStatusQuery struct {
    // Status filters POs to a specific lifecycle state.
    Status string
    // Page is 1-based; page 1 returns the first pageSize records.
    Page int
    // PageSize is the maximum number of records per page; clamped by the adapter.
    PageSize int
}

// Page wraps a slice of items with the total count for the client to paginate.
type Page[T any] struct {
    // Items is the current page's slice of read models.
    Items []T
    // Total is the total number of matching records across all pages.
    Total int
}

// FindPurchaseOrdersQueryService — paginated query method.
// FindByStatus returns a Page of PurchaseOrderSummary for the given status and page.
func (s *FindPurchaseOrdersQueryService) FindByStatus(ctx context.Context, q FindByStatusQuery) (Page[PurchaseOrderSummary], error) {
    // Clamp pageSize to prevent enormous result sets from overwhelming the client.
    if q.PageSize <= 0 || q.PageSize > 100 {
        // Default to 20 if the caller provides an invalid page size.
        q.PageSize = 20
    }
    // Delegate to the read port; service does not know whether this is Postgres or memory.
    items, err := s.reader.FindByStatus(ctx, domain.POStatus(q.Status), q.Page, q.PageSize)
    if err != nil {
        return Page[PurchaseOrderSummary]{}, err
    }
    // Fetch the total count for pagination metadata.
    total, err := s.reader.CountByStatus(ctx, domain.POStatus(q.Status))
    if err != nil {
        return Page[PurchaseOrderSummary]{}, err
    }
    return Page[PurchaseOrderSummary]{Items: items, Total: total}, nil
}
```

{{< /tab >}}

{{< tab >}}

```rust
// app/query/find_purchase_orders.rs — paginated query method.
use crate::app::ports::PurchaseOrderReaderPort;
use crate::app::query::{PurchaseOrderSummary, FindByStatusQuery, Page};

impl FindPurchaseOrdersQueryService {
    // find_by_status returns a Page of PurchaseOrderSummary for the given status.
    // Pagination is delegated to the reader port; the service only clamps page_size.
    pub async fn find_by_status(&self, q: FindByStatusQuery) -> Result<Page<PurchaseOrderSummary>, crate::domain::DomainError> {
        // Clamp page_size to prevent runaway queries from overwhelming the database.
        let page_size = if q.page_size == 0 || q.page_size > 100 {
            // Default to 20 items per page when the caller omits or exceeds the limit.
            20
        } else {
            q.page_size
        };
        // Delegate the actual database query to the reader port.
        let items = self.reader
            .find_by_status(&q.status, q.page, page_size)
            .await?;
        // Fetch total count separately; allows the client to render page controls.
        let total = self.reader
            .count_by_status(&q.status)
            .await?;
        // Return items and total wrapped in the Page envelope struct.
        Ok(Page { items, total })
    }
}

// FindByStatusQuery carries filter and pagination parameters.
pub struct FindByStatusQuery {
    // status is the filter value as a string; the adapter converts to enum if needed.
    pub status: String,
    // page is 1-based; the adapter computes the SQL OFFSET from (page-1)*page_size.
    pub page: u32,
    // page_size is the per-page record count; clamped above in the service.
    pub page_size: u32,
}

// Page wraps a slice with the total count for client-side pagination controls.
pub struct Page<T> {
    // items is the current page slice of read models.
    pub items: Vec<T>,
    // total is the full count of matching records across all pages.
    pub total: u64,
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The `Page<T>` envelope communicates total record count alongside the current slice, giving API clients the information they need to render pagination controls without a second request.

**Why it matters:** An API that returns only a slice forces clients to request page after page until an empty page arrives — they can never render a "5 of 47 pages" control. The `Page<T>` pattern is a one-line change to the query service but a significant UX improvement. The service adds pagination clamping as the sole business rule; the adapter handles the SQL `LIMIT`/`OFFSET`.

---

### Example 43: CQRS composition root

Wiring the command service and query service at `main.go` requires two separate service constructions. The shared Postgres pool provides both write and read adapters; in-memory variants serve development.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// main.go — CQRS composition root wiring command and query services separately.
package main

import (
    "database/sql"
    "log"
    "os"
    purchasingApp  "procurement/purchasing/app"
    purchasingHTTP "procurement/purchasing/adapter/in/http"
    purchasingPG   "procurement/purchasing/adapter/out/postgres"
    purchasingMem  "procurement/purchasing/adapter/out/mem"
)

func main() {
    dbURL := os.Getenv("DATABASE_URL")

    var writer    purchasingApp.PurchaseOrderWriter
    var reader    purchasingApp.PurchaseOrderReader
    var publisher purchasingApp.EventPublisher

    if dbURL != "" {
        db, err := sql.Open("pgx", dbURL)
        if err != nil { log.Fatalf("db open: %v", err) }
        // Command-side adapter — wraps *sql.DB behind the write port.
        pgRepo := purchasingPG.NewPurchaseOrderRepo(db)
        writer = pgRepo   // pgRepo implements both writer and reader ports.
        reader = purchasingPG.NewPurchaseOrderReadRepo(db)
        publisher = purchasingPG.NewOutboxEventPublisher(db)
    } else {
        memRepo := purchasingMem.NewPurchaseOrderRepo()
        writer = memRepo
        // In-memory reader shares projection state with the writer via a shared reference.
        memReader := purchasingMem.NewInMemoryPurchaseOrderReader()
        reader    = memReader
        publisher = &purchasingApp.InMemoryEventPublisher{}
    }

    // Command service depends on the write port only.
    cmdSvc := purchasingApp.NewIssuePurchaseOrderCommandService(writer, nil, nil, publisher)
    // Query service depends on the read port only — completely separate.
    qrySvc := purchasingApp.NewFindPurchaseOrdersQueryService(reader)

    // Mount both services on the HTTP router.
    router := purchasingHTTP.NewRouter(cmdSvc, qrySvc)
    log.Fatal(router.ListenAndServe(":8080"))
}
```

{{< /tab >}}

{{< tab >}}

```rust
// main.rs — CQRS composition root for command and query services.
use std::sync::Arc;
use std::env;

#[tokio::main]
async fn main() {
    let db_url = env::var("DATABASE_URL").ok();

    // Declare trait-object ports for command and query sides separately.
    let writer: Arc<dyn purchasing::app::ports::PurchaseOrderWriterPort>;
    let reader: Arc<dyn purchasing::app::ports::PurchaseOrderReaderPort>;
    let publisher: Arc<dyn purchasing::app::ports::EventPublisher>;

    match db_url {
        Some(url) => {
            let pool = sqlx::PgPool::connect(&url).await.expect("cannot connect");
            // Postgres write adapter — handles Save and FindByID.
            writer    = Arc::new(purchasing::adapter::out::postgres::PostgresPurchaseOrderRepo::new(pool.clone()));
            // Postgres read adapter — handles FindByStatus and FindPendingApproval.
            reader    = Arc::new(purchasing::adapter::out::postgres::PostgresPurchaseOrderReadRepo::new(pool.clone()));
            // Outbox publisher writes atomically with the same Postgres pool.
            publisher = Arc::new(purchasing::adapter::out::postgres::OutboxEventPublisher::new(pool));
        }
        None => {
            // In-memory adapters for local development without a database.
            writer    = Arc::new(purchasing::adapter::out::mem::InMemoryPurchaseOrderRepo::new());
            reader    = Arc::new(purchasing::adapter::out::mem::InMemoryPurchaseOrderReader::new());
            publisher = Arc::new(purchasing::app::InMemoryEventPublisher::new());
        }
    }

    // Command service — write side only.
    let cmd_svc = Arc::new(purchasing::app::IssuePurchaseOrderCommandService::new(
        writer, None, None, publisher,
    ));
    // Query service — read side only.
    let qry_svc = Arc::new(purchasing::app::FindPurchaseOrdersQueryService::new(reader));

    // Mount both services on the axum router; each handler depends on its own service.
    let app = purchasing::adapter::in_http::router(cmd_svc, qry_svc);
    axum::Server::bind(&"0.0.0.0:8080".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The CQRS composition root creates two independent services from two independent ports — the wiring makes the read/write split explicit and step-debuggable.

**Why it matters:** In a single-service design, adding a new query method to the repository interface forces all command adapters to implement it. In CQRS, the command adapter (`PurchaseOrderWriter`) is unaffected. The read adapter (`PurchaseOrderReader`) gains the new method in isolation. Composition root separation makes this contractual independence visible and compile-enforced.

---

## Section 6: Port Evolution (Examples 44–50)

### Example 44: Adding a method to a port

When a new business requirement needs a new repository method, the recommended Go pattern embeds the old interface and extends it. Adapters that do not need the new method implement a no-op or a default.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package app — port extension by embedding the old interface.
// Embedding avoids forcing all existing adapters to break at once.
package app

import (
    "context"
    "procurement/purchasing/domain"
)

// PurchaseOrderRepository is the original port with three methods.
type PurchaseOrderRepository interface {
    Save(ctx context.Context, po domain.PurchaseOrder) error
    FindByID(ctx context.Context, id domain.PurchaseOrderID) (domain.PurchaseOrder, error)
    FindByStatus(ctx context.Context, status domain.POStatus) ([]domain.PurchaseOrder, error)
}

// PurchaseOrderRepositoryV2 extends the port by embedding V1 and adding FindBySupplier.
// Adapters that satisfy V1 satisfy V2 only after implementing FindBySupplier.
// This allows gradual migration: update one adapter at a time.
type PurchaseOrderRepositoryV2 interface {
    // Embed the previous interface — all V1 methods are implicitly part of V2.
    PurchaseOrderRepository
    // FindBySupplier is the new method required by the supplier-dashboard feature.
    // Returns all POs for a given supplier regardless of status.
    FindBySupplier(ctx context.Context, id domain.SupplierID) ([]domain.PurchaseOrder, error)
}

// DefaultFindBySupplier provides a fallback implementation for adapters not yet updated.
// Callers that need the real implementation must update their adapter.
func DefaultFindBySupplier(_ context.Context, _ domain.SupplierID) ([]domain.PurchaseOrder, error) {
    // Returns an empty result — safe default until the adapter is upgraded.
    return nil, nil
}
```

{{< /tab >}}

{{< tab >}}

```rust
// app/ports.rs — port extension in Rust via a new trait that embeds the old one.
// Rust does not support trait inheritance in the same way, but supertrait works.
use async_trait::async_trait;

// PurchaseOrderRepositoryPort is the original port (v1).
#[async_trait]
pub trait PurchaseOrderRepositoryPort: Send + Sync {
    async fn save(&self, po: crate::domain::PurchaseOrder) -> Result<(), crate::domain::DomainError>;
    async fn find_by_id(&self, id: crate::domain::PurchaseOrderID) -> Result<crate::domain::PurchaseOrder, crate::domain::DomainError>;
}

// PurchaseOrderRepositoryV2Port extends v1 with a supertrait declaration.
// Any type implementing V2 must also implement V1 (supertrait constraint).
// Adapters that only implement V1 will fail the V2 bound until upgraded.
#[async_trait]
pub trait PurchaseOrderRepositoryV2Port: PurchaseOrderRepositoryPort {
    // find_by_supplier is the new method added for the supplier-dashboard feature.
    // Returns all POs for the given supplier across all statuses.
    async fn find_by_supplier(
        &self,
        supplier_id: &str,
    ) -> Result<Vec<crate::domain::PurchaseOrder>, crate::domain::DomainError>;
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** Embedding the original interface in a V2 interface lets the team introduce new methods without immediately breaking all adapters — each adapter opts in on its own schedule.

**Why it matters:** A naive approach (adding the method to the existing interface) breaks all adapter compile units simultaneously. In a monorepo with many adapters, that means a single PR touches many files. The embedding / supertrait approach lets a team update adapters one at a time, merge incrementally, and keep the build green throughout the migration.

---

### Example 45: Deprecating a port method

When a port method is no longer needed, marking it deprecated in a comment and providing a no-op default adapter implementation gives consumers time to migrate before removal.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package app — deprecating a port method with a no-op default adapter.
// The method stays in the interface during the deprecation window; the adapter no-ops it.
package app

import "context"

// EventPublisherV2 adds PublishBatch and deprecates Publish.
// Callers should migrate to PublishBatch during the deprecation window.
type EventPublisherV2 interface {
    // Publish is DEPRECATED. Use PublishBatch with a single-element slice instead.
    // Will be removed in the next major version after all callers migrate.
    Publish(ctx context.Context, event DomainEvent) error
    // PublishBatch delivers multiple events in a single operation.
    // More efficient than calling Publish in a loop; supports atomic delivery.
    PublishBatch(ctx context.Context, events []DomainEvent) error
}

// NoOpPublish is a default implementation of the deprecated Publish method.
// Adapters can embed this struct to satisfy the interface while migrating.
type NoOpPublish struct{}

// Publish does nothing — callers must migrate to PublishBatch.
// Logs a deprecation warning in development; silent in production.
func (NoOpPublish) Publish(_ context.Context, _ DomainEvent) error {
    // No-op: this method is deprecated; the adapter will remove it after migration.
    return nil
}
```

{{< /tab >}}

{{< tab >}}

```rust
// app/ports.rs — deprecating a port method in Rust with #[deprecated].
use async_trait::async_trait;

// EventPublisherV2Port adds publish_batch and deprecates publish.
#[async_trait]
pub trait EventPublisherV2Port: Send + Sync {
    // publish is deprecated; use publish_batch with a single-element Vec instead.
    // #[deprecated] causes a compiler warning for all callers of this method.
    #[deprecated(since = "2.0.0", note = "use publish_batch instead")]
    async fn publish(&self, event: Box<dyn crate::app::DomainEvent>) -> Result<(), String>;

    // publish_batch delivers multiple events atomically; replaces repeated publish calls.
    async fn publish_batch(&self, events: Vec<Box<dyn crate::app::DomainEvent>>) -> Result<(), String>;
}

// NoOpPublishMixin provides a default no-op publish implementation.
// Adapters include this via delegation; avoids duplicating the no-op in every adapter.
pub struct NoOpPublishMixin;

impl NoOpPublishMixin {
    // publish_noop is the no-op body; adapters call this when implementing the deprecated method.
    pub async fn publish_noop(_event: Box<dyn crate::app::DomainEvent>) -> Result<(), String> {
        // Intentionally does nothing — callers must migrate to publish_batch.
        Ok(())
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** A deprecation comment in the interface and a no-op default implementation give a migration window without breaking existing callers immediately.

**Why it matters:** Hard-removing a port method breaks every adapter in the monorepo simultaneously. The deprecation window approach is a contractual courtesy: all adapters keep compiling, the deprecation notice alerts developers to migrate, and removal happens in a later planned version. This is the standard Go stdlib deprecation pattern applied to internal ports.

---

### Example 46: Port interface segregation — splitting Repository

The large `PurchaseOrderRepository` interface is split into `PurchaseOrderWriter` and `PurchaseOrderReader`. Existing adapters implement both; new dedicated adapters implement only one.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package app — interface segregation: split PurchaseOrderRepository into two.
// Existing adapters satisfy both; new adapters satisfy only the side they need.
package app

import (
    "context"
    "procurement/purchasing/domain"
)

// PurchaseOrderWriter is the command-side segregated port.
// Contains only the methods that modify purchase order state.
type PurchaseOrderWriter interface {
    // Save persists a new or updated aggregate.
    Save(ctx context.Context, po domain.PurchaseOrder) error
    // FindByID retrieves an aggregate for optimistic-lock checks before save.
    FindByID(ctx context.Context, id domain.PurchaseOrderID) (domain.PurchaseOrder, error)
}

// PurchaseOrderReader is the query-side segregated port.
// Contains only the methods that read state without modifying it.
type PurchaseOrderReader interface {
    // FindByStatus returns summaries filtered by the given status.
    FindByStatus(ctx context.Context, status domain.POStatus, page, pageSize int) ([]PurchaseOrderSummary, error)
    // CountByStatus returns the total record count for pagination metadata.
    CountByStatus(ctx context.Context, status domain.POStatus) (int, error)
}

// PurchaseOrderRepository composes both ports for adapters that implement everything.
// The in-memory and Postgres adapters both implement PurchaseOrderRepository.
// Services use the narrower Writer or Reader — not this combined interface.
type PurchaseOrderRepository interface {
    PurchaseOrderWriter
    PurchaseOrderReader
}
```

{{< /tab >}}

{{< tab >}}

```rust
// app/ports.rs — interface segregation in Rust: split repository into writer and reader.
use async_trait::async_trait;
use crate::app::query::PurchaseOrderSummary;
use crate::domain::{PurchaseOrder, PurchaseOrderID};

// PurchaseOrderWriterPort holds only the write-side methods.
// Command services depend on this port; they never see query methods.
#[async_trait]
pub trait PurchaseOrderWriterPort: Send + Sync {
    // save upserts the aggregate into the store.
    async fn save(&self, po: PurchaseOrder) -> Result<(), crate::domain::DomainError>;
    // find_by_id retrieves the current aggregate for optimistic-lock checks.
    async fn find_by_id(&self, id: PurchaseOrderID) -> Result<PurchaseOrder, crate::domain::DomainError>;
}

// PurchaseOrderReaderPort holds only the read-side methods.
// Query services depend on this port; they never see write methods.
#[async_trait]
pub trait PurchaseOrderReaderPort: Send + Sync {
    // find_by_status returns paginated read-model summaries.
    async fn find_by_status(&self, status: &str, page: u32, page_size: u32) -> Result<Vec<PurchaseOrderSummary>, crate::domain::DomainError>;
    // count_by_status returns the total matching count for pagination metadata.
    async fn count_by_status(&self, status: &str) -> Result<u64, crate::domain::DomainError>;
}

// PurchaseOrderRepositoryPort composes both traits for full-featured adapters.
// Adapters that implement all methods satisfy all three traits simultaneously.
pub trait PurchaseOrderRepositoryPort: PurchaseOrderWriterPort + PurchaseOrderReaderPort {}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** Segregated ports let each service declare exactly the capabilities it needs — command services see no query methods, query services see no write methods.

**Why it matters:** Interface segregation is the "I" in SOLID. In Go, a 10-method interface forces every implementer to have 10 methods even if they use only 2. Splitting into focused ports makes each adapter minimal and each service's dependency explicit. When a query method's signature changes, only the read adapter and the query service are affected — the command service and write adapter are untouched.

---

### Example 47: SupplierNotifierPort — notification interface with adapters

A notification port decouples the supplier approval service from email, SMS, and any future notification channel. The no-op adapter serves tests without sending real messages.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package app defines the SupplierNotifierPort for the supplier context.
// Notification channel (email, SMS, push) is an infrastructure concern isolated here.
package app

import (
    "context"
    "procurement/supplier/domain"
)

// SupplierNotifierPort sends notifications to suppliers about status changes.
// Concrete adapters: NoOp (tests), Email, SMS, Push (production).
type SupplierNotifierPort interface {
    // NotifyApproved sends a notification when a supplier is approved.
    // The adapter decides whether to send email, SMS, or both.
    NotifyApproved(ctx context.Context, s domain.Supplier) error
    // NotifyRejected sends a notification when a supplier is rejected.
    // Includes the rejection reason if the adapter supports it.
    NotifyRejected(ctx context.Context, s domain.Supplier, reason string) error
}

// NoOpSupplierNotifier satisfies SupplierNotifierPort without sending real messages.
// Used in unit tests to prevent real notifications during test runs.
type NoOpSupplierNotifier struct{}

// NotifyApproved does nothing — no real notification is sent.
func (NoOpSupplierNotifier) NotifyApproved(_ context.Context, _ domain.Supplier) error {
    return nil // No-op: safe to call in tests without email server.
}

// NotifyRejected does nothing — no real notification is sent.
func (NoOpSupplierNotifier) NotifyRejected(_ context.Context, _ domain.Supplier, _ string) error {
    return nil // No-op: safe to call in tests without SMS gateway.
}

// Compile-time assertion: NoOpSupplierNotifier must satisfy SupplierNotifierPort.
var _ SupplierNotifierPort = NoOpSupplierNotifier{}
```

{{< /tab >}}

{{< tab >}}

```rust
// app/supplier_notifier.rs — SupplierNotifierPort and no-op adapter.
use async_trait::async_trait;
use crate::supplier::domain::Supplier;

// SupplierNotifierPort is an output port for supplier status notifications.
// Adapters: NoOpNotifier (tests), EmailNotifier (production), SmsNotifier (production).
#[async_trait]
pub trait SupplierNotifierPort: Send + Sync {
    // notify_approved sends a notification when a supplier passes compliance.
    async fn notify_approved(&self, supplier: &Supplier) -> Result<(), String>;
    // notify_rejected sends a notification with the rejection reason.
    async fn notify_rejected(&self, supplier: &Supplier, reason: &str) -> Result<(), String>;
}

// NoOpSupplierNotifier satisfies the port without sending any real messages.
// Injected in unit tests to prevent test runs from triggering email or SMS.
pub struct NoOpSupplierNotifier;

#[async_trait]
impl SupplierNotifierPort for NoOpSupplierNotifier {
    // notify_approved does nothing and returns Ok.
    async fn notify_approved(&self, _supplier: &Supplier) -> Result<(), String> {
        // No-op: ensures unit tests never hit an email server.
        Ok(())
    }

    // notify_rejected does nothing and returns Ok.
    async fn notify_rejected(&self, _supplier: &Supplier, _reason: &str) -> Result<(), String> {
        // No-op: ensures unit tests never hit an SMS gateway.
        Ok(())
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The no-op notifier prevents test runs from triggering real notifications while giving the service a fully injected dependency that satisfies the port contract.

**Why it matters:** Without the no-op pattern, test suites either mock the notifier (adding a mocking framework dependency) or hit real notification infrastructure (slow, side-effecting, brittle). The no-op is three lines of code that eliminates both problems. Adding an SMS adapter later requires only a new struct that implements two methods — zero changes to the service or the test suite.

---

### Example 48: EventPublisher decoupling — domain never sees the event bus

The domain publishes a typed event object. The `EventPublisher` adapter wraps the NATS or Kafka client and handles serialisation. The domain imports nothing from the event bus library.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package nats provides an EventPublisher adapter backed by NATS JetStream.
// The domain's PurchaseOrderIssuedEvent is serialised here — not in the domain.
package nats

import (
    "context"
    "encoding/json"
    "fmt"
    natsgo "github.com/nats-io/nats.go"
    "procurement/purchasing/app"
)

// NATSEventPublisher wraps a NATS JetStream connection behind the EventPublisher port.
// The domain package has zero knowledge of NATS — only this adapter imports the client.
type NATSEventPublisher struct {
    // js is the JetStream context used for durable, acknowledged publishing.
    js natsgo.JetStreamContext
}

// NewNATSEventPublisher constructs the adapter given an open JetStream context.
func NewNATSEventPublisher(js natsgo.JetStreamContext) *NATSEventPublisher {
    return &NATSEventPublisher{js: js}
}

// Publish serialises the domain event to JSON and publishes it to NATS JetStream.
// The subject is derived from EventType() — e.g., "PurchaseOrderIssued".
func (p *NATSEventPublisher) Publish(_ context.Context, event app.DomainEvent) error {
    // Serialise the domain event to JSON; domain never knows JSON is used here.
    payload, err := json.Marshal(event)
    if err != nil {
        return fmt.Errorf("serialise event: %w", err)
    }
    // Derive the NATS subject from the event type — routing is adapter responsibility.
    subject := "procurement." + event.EventType()
    // Publish with acknowledgement; JetStream retries on transient network failures.
    _, err = p.js.Publish(subject, payload)
    return err
}

// Compile-time assertion: *NATSEventPublisher must satisfy app.EventPublisher.
var _ app.EventPublisher = (*NATSEventPublisher)(nil)
```

{{< /tab >}}

{{< tab >}}

```rust
// adapter/out/nats/event_publisher.rs — NATS-backed EventPublisher adapter.
// The domain crate imports nothing from async-nats — only this adapter does.
use async_trait::async_trait;
use async_nats::jetstream::Context as JetStreamContext;
use crate::app::EventPublisher;
use crate::app::DomainEvent;

// NatsEventPublisher wraps an async-nats JetStream context.
// Serialisation (JSON) and subject routing live here — not in the domain.
pub struct NatsEventPublisher {
    // js holds the JetStream context for durable event publishing.
    js: JetStreamContext,
}

impl NatsEventPublisher {
    // new constructs the adapter from an existing JetStream context.
    pub fn new(js: JetStreamContext) -> Self {
        NatsEventPublisher { js }
    }
}

#[async_trait]
impl EventPublisher for NatsEventPublisher {
    // publish serialises the event to JSON and publishes to a NATS subject.
    async fn publish(&self, event: Box<dyn DomainEvent>) -> Result<(), String> {
        // Derive the NATS subject from the event's type name — adapter responsibility.
        let subject = format!("procurement.{}", event.event_type());
        // Serialise to JSON bytes; the domain knows nothing about this format choice.
        let payload = serde_json::to_vec(event.as_ref())
            .map_err(|e| format!("serialise error: {}", e))?;
        // Publish with JetStream acknowledgement for at-least-once delivery.
        self.js.publish(subject, payload.into()).await
            .map_err(|e| format!("nats publish error: {}", e))?;
        Ok(())
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** The event bus client library import is confined to the adapter package — swapping from NATS to Kafka means writing a new adapter, not touching the domain or the application service.

**Why it matters:** The domain's `PurchaseOrderIssuedEvent` struct is a plain data object. The JSON serialisation format, the NATS subject naming convention, and the JetStream acknowledgement logic are all adapter decisions. If the team migrates to Kafka, they write `KafkaEventPublisher`, wire it at `main.go`, and retire `NATSEventPublisher`. Zero domain changes, zero service changes, zero test changes.

---

### Example 49: Full intermediate test suite — unit, integration, and coverage map

A complete test suite for the intermediate purchasing service covers three levels: unit (in-memory), integration (real Postgres), and table-driven unit tests using Go's `testing.T`.

{{< tabs items="Go,Rust" >}}

{{< tab >}}

```go
// Package app_test — table-driven unit tests for IssuePurchaseOrderCommandService.
// All tests use in-memory adapters; zero Docker, zero network, zero filesystem.
package app_test

import (
    "context"
    "testing"
    "procurement/purchasing/app"
    purchasingMem "procurement/purchasing/adapter/out/mem"
    supplierMem   "procurement/supplier/adapter/out/mem"
    supplierDomain "procurement/supplier/domain"
)

// issueTestCase describes a single scenario for the table-driven test.
type issueTestCase struct {
    name           string
    supplierStatus supplierDomain.SupplierStatus
    // wantErr is the expected error; nil means the command should succeed.
    wantErr        error
}

// TestIssuePurchaseOrderCommandService_Issue covers the main eligibility paths.
func TestIssuePurchaseOrderCommandService_Issue(t *testing.T) {
    // Table of test cases: one row per eligibility scenario.
    cases := []issueTestCase{
        {name: "approved supplier succeeds", supplierStatus: supplierDomain.SupplierApproved, wantErr: nil},
        {name: "pending supplier rejected",  supplierStatus: supplierDomain.SupplierPending,  wantErr: app.ErrSupplierNotApproved},
        {name: "rejected supplier blocked",  supplierStatus: supplierDomain.SupplierRejected, wantErr: app.ErrSupplierNotApproved},
    }
    for _, tc := range cases {
        // t.Run isolates each case; a failing case does not stop subsequent ones.
        t.Run(tc.name, func(t *testing.T) {
            // Arrange — seed supplier with the test case's status.
            supRepo := supplierMem.NewSupplierRepo()
            _ = supRepo.Save(context.Background(), supplierDomain.Supplier{
                ID:     "S-001",
                Name:   "ACME",
                Status: tc.supplierStatus,
            })
            // Wire service with in-memory adapters for this sub-test.
            svc := app.NewIssuePurchaseOrderCommandService(
                purchasingMem.NewPurchaseOrderRepo(),
                supRepo,
                app.FixedClock{},
                &app.InMemoryEventPublisher{},
            )
            // Act — attempt to issue a PO against the seeded supplier.
            _, err := svc.Issue(context.Background(), app.IssueCommand{
                SupplierID: "S-001",
                Items:      []app.LineItem{{SKU: "X", Quantity: 1}},
            })
            // Assert — compare actual error to expected.
            if err != tc.wantErr {
                t.Errorf("[%s] expected %v, got %v", tc.name, tc.wantErr, err)
            }
        })
    }
}
```

{{< /tab >}}

{{< tab >}}

```rust
// tests/issue_purchase_order_table_test.rs — parameterised tests in Rust.
// Each test case seeds a supplier with a different status and checks the error variant.
#[cfg(test)]
mod tests {
    use crate::purchasing::app::{IssuePurchaseOrderCommandService, IssueCommand, AppError};
    use crate::purchasing::adapter::out::mem::InMemoryPurchaseOrderRepo;
    use crate::supplier::adapter::out::mem::InMemorySupplierRepo;
    use crate::supplier::domain::{Supplier, SupplierID, SupplierStatus};
    use std::sync::Arc;

    // TestCase carries the scenario name, supplier status, and expected error.
    struct TestCase {
        name: &'static str,
        status: SupplierStatus,
        // expected_ok is true when the command should succeed without an error.
        expected_ok: bool,
    }

    // test_issue_purchase_order_cases runs all eligibility scenarios.
    #[tokio::test]
    async fn test_issue_purchase_order_cases() {
        // Define the table of test cases for the three supplier status paths.
        let cases = vec![
            TestCase { name: "approved supplier succeeds", status: SupplierStatus::Approved, expected_ok: true },
            TestCase { name: "pending supplier rejected",  status: SupplierStatus::Pending,  expected_ok: false },
            TestCase { name: "rejected supplier blocked",  status: SupplierStatus::Rejected, expected_ok: false },
        ];
        for tc in cases {
            // Arrange — create a fresh repo for each case to avoid state leakage.
            let sup_repo = Arc::new(InMemorySupplierRepo::new());
            sup_repo.save(Supplier {
                id: SupplierID("S-001".to_string()),
                name: "ACME".to_string(),
                status: tc.status,
            }).await.unwrap();
            // Wire service with in-memory adapters per case.
            let svc = IssuePurchaseOrderCommandService::new(
                Arc::new(InMemoryPurchaseOrderRepo::new()),
                sup_repo,
                Arc::new(crate::purchasing::app::FixedClock::default()),
                Arc::new(crate::purchasing::app::InMemoryEventPublisher::new()),
            );
            // Act — attempt to issue a PO against the seeded supplier.
            let result = svc.issue(IssueCommand {
                supplier_id: "S-001".to_string(),
                items: vec![],
            }).await;
            // Assert — check success/failure matches the expected_ok flag.
            assert_eq!(result.is_ok(), tc.expected_ok,
                "case [{}]: expected ok={}, got {:?}", tc.name, tc.expected_ok, result);
        }
    }
}
```

{{< /tab >}}

{{< /tabs >}}

**Key takeaway:** Table-driven tests express all eligibility paths in a compact data structure, making it easy to add new scenarios without duplicating setup and teardown code.

**Why it matters:** Five separate test functions for five supplier status scenarios each duplicate 15 lines of setup. A table-driven test expresses all five in a 10-row data structure with shared setup. When the `IssueCommand` shape changes, only the shared setup changes — not five separate functions. This scales to 20 scenarios without cognitive overhead.

---

### Example 50: Full intermediate flow recap — CQRS + query facade + notifier

```mermaid
flowchart LR
    accTitle: Example 50: Full intermediate flow recap — CQRS + query facade + notifier
    accDescr: Flowchart with 14 nodes and 14 connections. Nodes: HTTP POST primary adapter, IssuePOCommand Service command side, PurchaseOrderWriter output port, PostgresPurchase OrderRepo write adapter, SupplierRepository output port, PostgresSupplierRepo read adapter, EventPublisher output port, NATSEventPublisher adapter, HTTP GET primary adapter, FindPurchaseOrders QueryService query side, PurchaseOrderReader output port, PostgresPurchase OrderReadRepo read adapter, and 2 more. Connections: HTTP POST primary adapter to IssuePOCommand Service command side (IssueCommand), IssuePOCommand Service command side to PurchaseOrderWriter output port (Save(po)), PurchaseOrderWriter output port to PostgresPurchase OrderRepo write adapter, IssuePOCommand Service command side to SupplierRepository output port (FindByID(supplier ID)), SupplierRepository output port to PostgresSupplierRepo read adapter, IssuePOCommand Service command side to EventPublisher output port (Publish(event)), EventPublisher output port to NATSEventPublisher adapter, IssuePOCommand Service command side to SupplierNotifierPort output port (Notify Approved(supplier)), SupplierNotifierPort output port to EmailNotifier adapter, IssuePOCommand Service command side to HTTP POST primary adapter (PurchaseOrderID), HTTP GET primary adapter to FindPurchaseOrders QueryService query side (FindByStatusQuery), FindPurchaseOrders QueryService query side to PurchaseOrderReader output port (FindBy Status(status,page)), and 2 more.
    A["HTTP POST<br/>primary adapter"]:::blue
    B["IssuePOCommand<br/>Service<br/>command side"]:::teal
    C["PurchaseOrderWriter<br/>output port"]:::orange
    D["PostgresPurchase<br/>OrderRepo<br/>write adapter"]:::teal
    E["SupplierRepository<br/>output port"]:::orange
    F["PostgresSupplierRepo<br/>read adapter"]:::teal
    G["EventPublisher<br/>output port"]:::orange
    H["NATSEventPublisher<br/>adapter"]:::teal

    I["HTTP GET<br/>primary adapter"]:::blue
    J["FindPurchaseOrders<br/>QueryService<br/>query side"]:::teal
    K["PurchaseOrderReader<br/>output port"]:::orange
    L["PostgresPurchase<br/>OrderReadRepo<br/>read adapter"]:::teal

    M["SupplierNotifierPort<br/>output port"]:::orange
    N["EmailNotifier<br/>adapter"]:::teal

    A -->|"IssueCommand"| B
    B -->|"Save(po)"| C
    C --> D
    B -->|"FindByID(supplier<br/>ID)"| E
    E --> F
    B -->|"Publish(event)"| G
    G --> H
    B -->|"Notify<br/>Approved(supplier)"| M
    M --> N
    B -->|"PurchaseOrderID"| A

    I -->|"FindByStatusQuery"| J
    J -->|"FindBy<br/>Status(status,page)"| K
    K --> L
    J -->|"Page[PurchaseOrder<br/>Summary]"| I

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

This diagram shows the complete intermediate wiring: the command path (left) and the query path (right) each pass through their own ports and adapters without sharing any code paths after the composition root.

**Key takeaway:** The CQRS split produces two independent call graphs — command and query — that share only the composition root and the domain types; every port and adapter is independently swappable.

**Why it matters:** The diagram above is the architecture's public contract. Any change that stays within a single adapter (swapping NATS for Kafka in the `EventPublisher` box) is invisible to every other box. Changes that affect a port interface (adding a method to `PurchaseOrderWriter`) are visible in exactly one box and affect only the adapters and services connected to it. This is the structural isolation hexagonal architecture promises and that this tutorial demonstrates through 30 executable examples.

---

## Further Reading

- Alistair Cockburn — [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture) (2005) — canonical original; language-agnostic port and adapter definitions.
- Rob Pike — [Go at Google: Language Design in the Service of Software Engineering](https://go.dev/talks/2012/splash.article) (2012 SPLASH) — structural typing and interface composition rationale.
- Three Dots Labs — [DDD + CQRS + Clean Architecture in Go](https://threedots.tech/post/ddd-cqrs-clean-architecture-combined/) — production-grade Go reference combining hexagonal, DDD, and CQRS.
- Blandy, Orendorff & Tindall — [_Programming Rust_, 3rd ed.](https://www.oreilly.com/library/view/programming-rust-3rd/9781098176228/) — ownership model, trait objects, and `Arc<dyn Trait>` composition patterns.
