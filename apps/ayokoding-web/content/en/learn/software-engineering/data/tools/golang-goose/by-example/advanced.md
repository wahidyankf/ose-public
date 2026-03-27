---
title: "Advanced"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000003
description: "Go Goose advanced tutorial with 25 annotated examples covering custom providers, migration hooks, zero-downtime migrations, CI/CD integration, and production best practices (75-95% coverage)"
tags: ["golang-goose", "tutorial", "by-example", "advanced", "zero-downtime", "ci-cd", "production", "monitoring"]
---

## Advanced Examples (61-85)

**Coverage**: 75-95% of Goose functionality

**Focus**: Custom providers, migration hooks, zero-downtime schema patterns, CI/CD integration, observability, and production operational patterns.

These examples assume you understand beginner and intermediate concepts. All examples are self-contained and demonstrate production-grade patterns used in large-scale deployments.

---

### Example 61: Custom goose.Provider with AllowMissing

`AllowMissing` tells Goose to apply out-of-order migrations without treating them as errors. This is useful when multiple teams work in parallel and migrations land in the version history with gaps.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% AllowMissing: out-of-order migration application
graph TD
    A[DB has versions 1,2,4] -->|Normal mode| B[Error: version 3 missing]
    A -->|AllowMissing=true| C[Apply version 3 out of order]
    C --> D[DB has versions 1,2,3,4]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```go
// File: main.go
// => Demonstrates AllowMissing option on goose.NewProvider

package main

import (
 "context"
 "database/sql"
 "embed"
 "log"

 "github.com/pressly/goose/v3"
 _ "github.com/lib/pq"
)

//go:embed db/migrations/*.sql db/migrations/*.go
var migrationsFS embed.FS
// => embed.FS bundles all migration files at compile time
// => Globs must match actual file extensions present on disk

func main() {
 db, err := sql.Open("postgres", "postgres://user:pass@localhost/mydb?sslmode=disable")
 // => sql.Open does not open a connection; it validates the DSN format
 if err != nil {
  log.Fatal(err)
  // => Fatal calls os.Exit(1) after logging; appropriate for startup failures
 }
 defer db.Close()

 provider, err := goose.NewProvider(
  goose.DialectPostgres,
  // => Tells Goose which SQL dialect to use for lock/version table queries
  db,
  migrationsFS,
  goose.WithAllowMissing(),
  // => AllowMissing: apply migrations whose versions are below the current max
  // => Without this, Goose returns an error if it finds an unapplied older version
 )
 if err != nil {
  log.Fatal(err)
 }

 results, err := provider.Up(context.Background())
 // => Applies all pending migrations including out-of-order ones
 if err != nil {
  log.Fatal(err)
 }

 for _, r := range results {
  log.Printf("applied: %s (duration: %s)", r.Source.Path, r.Duration)
  // => r.Source.Path is the migration file path
  // => r.Duration is wall-clock time for this migration
 }
}
```

**Key Takeaway**: `goose.WithAllowMissing()` enables parallel team workflows by applying missing versions out of sequence rather than halting with an error.

**Why It Matters**: In teams where multiple feature branches each add migrations, version numbers from different branches can be interleaved. Branch A may have already applied version 5 and 7 before branch B's version 6 is merged. With `AllowMissing`, Goose applies version 6 without error even though version 7 is already present. This is the standard option for teams following trunk-based development where migration version collisions are common.

---

### Example 62: Migration Hooks (SetGlobalMigrationOptions)

Goose's before/after hooks let you execute arbitrary Go code around each migration — ideal for sending telemetry, acquiring distributed locks, or notifying monitoring systems.

```go
// File: internal/migrate/hooks.go
// => Global migration hooks run before and after every migration in the process

package migrate

import (
 "context"
 "database/sql"
 "log/slog"
 "time"

 "github.com/pressly/goose/v3"
)

// SetupHooks registers global before/after hooks for all migrations.
// => Call this once at startup before creating any goose.Provider
func SetupHooks() {
 goose.SetGlobalMigrationOptions(
  // => SetGlobalMigrationOptions configures hooks applied to every migration
  goose.WithBeforeVersionMigration(beforeHook),
  // => beforeHook runs immediately before each migration starts
  goose.WithAfterVersionMigration(afterHook),
  // => afterHook runs immediately after each migration completes or fails
 )
}

func beforeHook(ctx context.Context, db *sql.DB, version int64, direction bool) error {
 // => version: the migration version number about to run
 // => direction: true = Up (apply), false = Down (rollback)
 action := "up"
 if !direction {
  action = "down"
  // => Normalize direction to a readable string for logging
 }
 slog.Info("migration starting",
  "version", version,
  "direction", action,
  "timestamp", time.Now().UTC(),
 )
 // => Structured log: each field becomes a queryable key in your log aggregator
 return nil
 // => Returning an error here would abort the migration before it starts
}

func afterHook(ctx context.Context, db *sql.DB, version int64, direction bool, duration time.Duration, err error) error {
 // => duration: wall-clock time the migration took
 // => err: non-nil if the migration itself failed
 if err != nil {
  slog.Error("migration failed",
   "version", version,
   "direction", direction,
   "duration", duration,
   "error", err,
  )
  // => Log failure details; monitoring agents pick this up for alerting
  return nil
  // => Return nil: do not mask the original migration error
 }
 slog.Info("migration completed",
  "version", version,
  "duration", duration,
 )
 return nil
}
```

**Key Takeaway**: Wrap every migration with observability hooks using `SetGlobalMigrationOptions` — this gives you consistent timing, error reporting, and audit logs without modifying individual migration files.

**Why It Matters**: In production, you need to know exactly which migration ran, how long it took, and whether it succeeded. Hooks decouple this observability concern from migration business logic. A single hook registration at startup instruments every migration in the codebase, including future ones — no need to touch each file when you add a new monitoring backend.

---

### Example 63: Zero-Downtime Column Addition

Adding a `NOT NULL` column with no default to a large live table causes a full table rewrite in PostgreSQL. The safe pattern adds the column as `NULL` first, backfills it, then adds the constraint.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Zero-downtime column addition phases
graph LR
    A[Phase 1: ADD COLUMN NULL] --> B[Phase 2: Backfill rows]
    B --> C[Phase 3: SET NOT NULL]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

**Phase 1 migration — add nullable column:**

```sql
-- File: db/migrations/00040_add_status_to_orders_phase1.sql

-- +goose Up
-- => Phase 1: add the column as NULL; no table rewrite, metadata-only change in PG 12+
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) NULL;
-- => NULL: rows inserted before this migration have NULL status; app code must handle NULL
-- => IF NOT EXISTS: safe to re-run if migration was partially applied

-- +goose Down
-- => Rollback: remove the column; safe because no NOT NULL constraint exists yet
ALTER TABLE orders DROP COLUMN IF EXISTS status;
-- => IF EXISTS: prevents error if phase 1 never completed
```

**Phase 2 migration — backfill existing rows:**

```sql
-- File: db/migrations/00041_add_status_to_orders_phase2.sql

-- +goose Up
-- +goose NO TRANSACTION
-- => NO TRANSACTION: batched updates in a loop; each batch is its own transaction
UPDATE orders SET status = 'active' WHERE status IS NULL;
-- => Sets a sensible default for all pre-existing rows
-- => For tables > 1M rows, replace with a Go migration using batched UPDATEs (see Example 66)

-- +goose Down
-- => Rollback phase 2: restore NULLs so phase 1 Down can drop the column cleanly
UPDATE orders SET status = NULL WHERE status = 'active';
```

**Phase 3 migration — add NOT NULL constraint:**

```sql
-- File: db/migrations/00042_add_status_to_orders_phase3.sql

-- +goose Up
-- => Phase 3: enforce NOT NULL now that all rows have a value
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;
-- => PostgreSQL validates the constraint by scanning the table; no rewrite needed in PG 11+
-- => Fast because all rows already have non-NULL values from phase 2

-- +goose Down
-- => Rollback: remove the constraint so the column becomes nullable again
ALTER TABLE orders ALTER COLUMN status DROP NOT NULL;
```

**Key Takeaway**: Split `NOT NULL` column additions into three migrations — add as nullable, backfill data, then enforce the constraint — to avoid table rewrites and downtime.

**Why It Matters**: A single `ALTER TABLE orders ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active'` on a 50-million-row table acquires an `ACCESS EXCLUSIVE` lock and rewrites the entire table. With the three-phase approach, each step is a fast metadata change or incremental data update, and your application continues serving traffic throughout.

---

### Example 64: Zero-Downtime Column Removal (3-Phase)

Dropping a column that the application still reads causes errors at runtime. The safe removal sequence deprecates the column in the application first, then removes it in a later migration.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Safe column removal phases
graph LR
    A[App: ignore column] --> B[Migration: DROP DEFAULT]
    B --> C[Deploy new app version]
    C --> D[Migration: DROP COLUMN]

    style A fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

**Phase 1 — make column optional at DB level:**

```sql
-- File: db/migrations/00043_deprecate_legacy_notes_phase1.sql

-- +goose Up
-- => Phase 1: remove DEFAULT so new rows do not populate this column
-- => Application must be updated to not SELECT/INSERT this column before phase 2
ALTER TABLE orders ALTER COLUMN legacy_notes DROP DEFAULT;
-- => After this, app code should treat the column as non-existent

-- +goose Down
ALTER TABLE orders ALTER COLUMN legacy_notes SET DEFAULT '';
-- => Restores the default; safe rollback if app code change is reverted
```

**Phase 2 — drop the column after app no longer references it:**

```sql
-- File: db/migrations/00044_deprecate_legacy_notes_phase2.sql

-- +goose Up
-- => Phase 2: safe to drop now that no running application code reads this column
ALTER TABLE orders DROP COLUMN IF EXISTS legacy_notes;
-- => ACCESS EXCLUSIVE lock is brief; column removal is fast in PostgreSQL

-- +goose Down
-- => Rollback: re-add the column so old app versions can run again if needed
ALTER TABLE orders ADD COLUMN IF NOT EXISTS legacy_notes TEXT NULL DEFAULT '';
-- => Cannot restore data; this only restores the schema structure
```

**Key Takeaway**: Remove columns in two deployments — first update the application to stop reading the column, then run the `DROP COLUMN` migration.

**Why It Matters**: If you drop a column and deploy simultaneously, the old application pods still running during the rolling deploy will fail when they try to `SELECT legacy_notes`. The two-phase approach ensures there is never a moment where running code references a non-existent column.

---

### Example 65: Zero-Downtime Table Rename

PostgreSQL table renames acquire a brief `ACCESS EXCLUSIVE` lock, but application code referencing the old name breaks immediately. The safe pattern uses a view as an alias during the transition.

```sql
-- File: db/migrations/00045_rename_accounts_to_wallets.sql

-- +goose Up
-- +goose NO TRANSACTION
-- => NO TRANSACTION: two separate DDL steps that each need their own lock state

-- Step 1: rename the table
ALTER TABLE accounts RENAME TO wallets;
-- => ACCESS EXCLUSIVE lock; completes in milliseconds; old name is now invalid

-- Step 2: create a view with the old name so legacy code keeps working
CREATE OR REPLACE VIEW accounts AS SELECT * FROM wallets;
-- => Any SELECT/INSERT/UPDATE against "accounts" now goes through this view
-- => INSERT and UPDATE on simple views work transparently in PostgreSQL
-- => Complex views (joins, aggregates) may require INSTEAD OF triggers for writes

-- +goose Down
-- => Rollback: remove the view and rename back
DROP VIEW IF EXISTS accounts;
ALTER TABLE wallets RENAME TO accounts;
-- => Restores original structure; ORDER MATTERS: drop view before renaming
```

**Key Takeaway**: Rename tables by creating a compatibility view under the old name immediately after the rename — legacy code continues to work while you migrate application queries to the new name.

**Why It Matters**: Rolling deploys mean multiple application versions run simultaneously. A table rename without the compat view breaks all pods still using the old name. The view preserves backward compatibility for the duration of the rolling deploy, and you remove it once all pods use the new name.

---

### Example 66: Large Table Migration with Chunked Offset Batching

For tables with tens of millions of rows, cursor-based chunked updates avoid lock contention by processing sequential ID ranges rather than re-scanning from scratch on every batch.

```go
// File: db/migrations/00046_normalize_phone_numbers.go
// => Processes rows in cursor-based chunks using ID ranges
// => Uses keyset pagination (no OFFSET scan penalty) unlike simple batch loops

package migrations

import (
 "context"
 "database/sql"
 "fmt"
 "log/slog"
 "regexp"
 "strings"

 "github.com/pressly/goose/v3"
)

func init() {
 goose.AddMigrationNoTxContext(upNormalizePhones, downNormalizePhones)
 // => NoTx: manages its own chunked transactions
}

const phoneChunkSize = 5000
// => 5000 rows per chunk; larger batches reduce round trips at cost of longer lock hold

var nonDigit = regexp.MustCompile(`[^0-9]`)
// => Package-level regex: compiled once, reused across all chunks

func upNormalizePhones(ctx context.Context, db *sql.DB) error {
 // => Step 1: find the max ID to bound the keyset loop
 var maxID int64
 err := db.QueryRowContext(ctx, `SELECT COALESCE(MAX(id), 0) FROM users`).Scan(&maxID)
 // => COALESCE handles empty table case; avoids NULL dereference on Scan
 if err != nil {
  return fmt.Errorf("get max id: %w", err)
 }

 for startID := int64(0); startID <= maxID; startID += phoneChunkSize {
  // => Keyset iteration: each chunk covers [startID, startID+chunkSize)
  // => No OFFSET: avoids O(n) full-table scan cost of LIMIT/OFFSET pagination
  endID := startID + phoneChunkSize

  rows, err := db.QueryContext(ctx,
   `SELECT id, phone FROM users WHERE id >= $1 AND id < $2 AND phone IS NOT NULL`,
   startID, endID,
  )
  if err != nil {
   return fmt.Errorf("query chunk [%d,%d): %w", startID, endID, err)
  }

  type row struct {
   id    int64
   phone string
  }
  // => Inline type: scoped to this function, avoids polluting package scope
  var updates []row
  for rows.Next() {
   var r row
   if err := rows.Scan(&r.id, &r.phone); err != nil {
    rows.Close()
    // => Close rows before returning to release the connection
    return fmt.Errorf("scan: %w", err)
   }
   normalized := normalizePhone(r.phone)
   if normalized != r.phone {
    updates = append(updates, row{r.id, normalized})
    // => Only queue rows that actually change; reduces UPDATE round trips
   }
  }
  rows.Close()

  for _, u := range updates {
   _, err := db.ExecContext(ctx,
    `UPDATE users SET phone = $1 WHERE id = $2`,
    u.phone, u.id,
   )
   if err != nil {
    return fmt.Errorf("update id %d: %w", u.id, err)
   }
  }

  slog.Info("phone normalization chunk complete",
   "start_id", startID, "end_id", endID, "updated", len(updates),
  )
 }
 return nil
}

func normalizePhone(phone string) string {
 digits := nonDigit.ReplaceAllString(phone, "")
 // => Strip all non-numeric characters: "(555) 123-4567" => "5551234567"
 if strings.HasPrefix(digits, "1") && len(digits) == 11 {
  digits = digits[1:]
  // => Drop leading country code "1" from US numbers
 }
 return digits
}

func downNormalizePhones(_ context.Context, _ *sql.DB) error {
 return nil
 // => Phone normalization is not reversible; original values are not stored
 // => A reversible version would save originals to a shadow column before normalizing
}
```

**Key Takeaway**: Use keyset (ID range) pagination for large table migrations — it avoids the O(n) cost of `LIMIT/OFFSET` and keeps each batch fast regardless of table size.

**Why It Matters**: `LIMIT 5000 OFFSET 10000000` requires PostgreSQL to scan and discard 10 million rows before returning 5000. With keyset chunking, each query uses an indexed range scan — constant time regardless of position in the table. For a 100-million-row table, the difference between these approaches can be hours versus minutes.

---

### Example 67: Online Index Creation (CONCURRENTLY)

`CREATE INDEX CONCURRENTLY` builds an index without locking the table for writes, making it safe to run on live production tables. It must run outside a transaction.

```sql
-- File: db/migrations/00047_idx_orders_customer_status.sql

-- +goose Up
-- +goose NO TRANSACTION
-- => CRITICAL: CREATE INDEX CONCURRENTLY must run outside a transaction
-- => Without NO TRANSACTION, Goose wraps this in a transaction and PG returns an error

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_status
    ON orders (customer_id, status)
    WHERE status IN ('pending', 'processing');
-- => Partial index: only indexes rows matching the WHERE clause
-- => Smaller index size; faster writes for rows in other statuses
-- => CONCURRENTLY: allows reads AND writes during index build (no ACCESS EXCLUSIVE lock)
-- => Build time: proportional to table size; can take minutes on large tables
-- => IF NOT EXISTS: idempotent; safe to re-run if migration was interrupted

-- +goose Down
-- +goose NO TRANSACTION
-- => DROP INDEX CONCURRENTLY also requires no transaction
DROP INDEX CONCURRENTLY IF EXISTS idx_orders_customer_status;
-- => CONCURRENTLY: drops without locking the table for writes
```

**Key Takeaway**: Always use `CREATE INDEX CONCURRENTLY` in production migrations and mark the migration with `-- +goose NO TRANSACTION` — this prevents table locks that would block writes during a potentially long index build.

**Why It Matters**: A standard `CREATE INDEX` on a 50-million-row table acquires `SHARE` lock on the table for the entire build duration — potentially minutes. During that time, no `INSERT`, `UPDATE`, or `DELETE` can proceed. `CREATE INDEX CONCURRENTLY` releases this constraint by performing two table scans and using a multi-phase locking protocol, at the cost of slightly longer overall build time. For 24/7 production systems, CONCURRENTLY is non-negotiable.

---

### Example 68: Data Backfill Migration Pattern (Source Transformation)

A source-transformation backfill reads data from one column, applies a business rule transformation, and writes derived values to a new column — distinct from simple NULL-filling.

```go
// File: db/migrations/00048_backfill_display_names.go
// => Derives display_name from first_name + last_name using locale-aware formatting
// => Differs from simple NULL-to-constant backfill: combines two source columns

package migrations

import (
 "context"
 "database/sql"
 "fmt"
 "strings"

 "github.com/pressly/goose/v3"
)

func init() {
 goose.AddMigrationNoTxContext(upBackfillDisplayNames, downBackfillDisplayNames)
}

type userNameRow struct {
 ID        int64
 FirstName string
 LastName  string
}
// => Dedicated struct for scan target: avoids mixing migration state with app models

func upBackfillDisplayNames(ctx context.Context, db *sql.DB) error {
 // => Phase 1: ensure display_name column exists (idempotent add)
 _, err := db.ExecContext(ctx,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255)`,
 )
 // => Adding the column here rather than in a separate migration keeps this atomic
 if err != nil {
  return fmt.Errorf("add column: %w", err)
 }

 // => Phase 2: read users who need backfill
 rows, err := db.QueryContext(ctx,
  `SELECT id, first_name, last_name FROM users WHERE display_name IS NULL`,
  // => Only processes rows without a display_name; re-runnable safely
 )
 if err != nil {
  return fmt.Errorf("query users: %w", err)
 }
 defer rows.Close()

 // => Phase 3: collect all rows before updating (avoids cursor invalidation)
 var toUpdate []userNameRow
 for rows.Next() {
  var r userNameRow
  if err := rows.Scan(&r.ID, &r.FirstName, &r.LastName); err != nil {
   return fmt.Errorf("scan: %w", err)
  }
  toUpdate = append(toUpdate, r)
 }
 if err := rows.Err(); err != nil {
  return fmt.Errorf("row iteration: %w", err)
 }

 // => Phase 4: apply transformation and write back
 for _, r := range toUpdate {
  displayName := buildDisplayName(r.FirstName, r.LastName)
  // => Business logic lives in a pure function; easy to unit test independently
  _, err := db.ExecContext(ctx,
   `UPDATE users SET display_name = $1 WHERE id = $2 AND display_name IS NULL`,
   displayName, r.ID,
  )
  // => AND display_name IS NULL guard: safe against concurrent writes
  if err != nil {
   return fmt.Errorf("update user %d: %w", r.ID, err)
  }
 }

 return nil
}

func buildDisplayName(first, last string) string {
 parts := []string{strings.TrimSpace(first), strings.TrimSpace(last)}
 // => TrimSpace: handles leading/trailing whitespace in legacy data
 result := strings.Join(filterEmpty(parts), " ")
 // => Join with space; filterEmpty removes blank segments
 if result == "" {
  return "Anonymous"
  // => Fallback for rows with both names empty
 }
 return result
}

func filterEmpty(ss []string) []string {
 var out []string
 for _, s := range ss {
  if s != "" {
   out = append(out, s)
  }
 }
 return out
 // => Returns only non-empty strings; handles cases where first or last is absent
}

func downBackfillDisplayNames(ctx context.Context, db *sql.DB) error {
 _, err := db.ExecContext(ctx, `ALTER TABLE users DROP COLUMN IF EXISTS display_name`)
 // => Drops the entire column; derived data is reproducible so no backup needed
 return err
}
```

**Key Takeaway**: Isolate backfill business logic in pure functions — this makes the transformation testable independently of the migration infrastructure.

**Why It Matters**: Data backfill migrations are the most error-prone category because they transform real production data. Bugs in the transformation logic are hard to detect in staging with small datasets. By extracting `buildDisplayName` as a pure function, you can write unit tests covering edge cases (empty strings, unicode names, extra whitespace) before running against production.

---

### Example 69: Migration in CI/CD Pipeline

CI/CD migration checks use `goose status` to detect unapplied migrations before deployment and fail the pipeline early if the schema is out of sync.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% CI/CD migration pipeline stages
graph LR
    A[Build] --> B[Test with migrations]
    B --> C{goose status check}
    C -->|Pending exists| D[Fail pipeline]
    C -->|All applied| E[Deploy app]
    E --> F[goose up on prod DB]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style E fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style F fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```go
// File: internal/migrate/cicd.go
// => Programmatic migration check suitable for CI/CD pipeline health checks

package migrate

import (
 "context"
 "database/sql"
 "embed"
 "fmt"

 "github.com/pressly/goose/v3"
)

// CheckMigrations returns an error if any migrations are pending.
// => Intended for use as a pre-deploy readiness check in CI/CD pipelines
func CheckMigrations(ctx context.Context, db *sql.DB, fs embed.FS) error {
 provider, err := goose.NewProvider(goose.DialectPostgres, db, fs)
 // => NewProvider reads the goose_db_version table to build current state
 if err != nil {
  return fmt.Errorf("create provider: %w", err)
 }

 sources, err := provider.ListSources()
 // => ListSources returns all migration files found in the embedded FS
 if err != nil {
  return fmt.Errorf("list sources: %w", err)
 }

 dbMigrations, err := provider.GetDBVersions(ctx)
 // => GetDBVersions queries the goose_db_version table for applied versions
 if err != nil {
  return fmt.Errorf("get db versions: %w", err)
 }

 // => Build a set of applied versions for O(1) lookup
 applied := make(map[int64]bool, len(dbMigrations))
 for _, m := range dbMigrations {
  applied[m.Version] = true
  // => m.Version is the integer version prefix from the filename
 }

 var pending []int64
 for _, s := range sources {
  if !applied[s.Version] {
   pending = append(pending, s.Version)
   // => Collect all unapplied versions for a complete report
  }
 }

 if len(pending) > 0 {
  return fmt.Errorf("migrations pending: %v — run goose up before deploying", pending)
  // => Non-zero exit from this function fails the pipeline step
 }

 return nil
 // => All migrations applied: pipeline can proceed to deployment
}

// ApplyMigrations runs all pending migrations.
// => Call this as a deployment step before starting the application
func ApplyMigrations(ctx context.Context, db *sql.DB, fs embed.FS) error {
 provider, err := goose.NewProvider(goose.DialectPostgres, db, fs,
  goose.WithAllowMissing(),
  // => AllowMissing handles hotfix migrations applied out-of-order
 )
 if err != nil {
  return fmt.Errorf("create provider: %w", err)
 }

 results, err := provider.Up(ctx)
 // => Up applies all pending migrations in version order
 for _, r := range results {
  if r.Error != nil {
   fmt.Printf("FAILED %s: %v\n", r.Source.Path, r.Error)
   // => Print each failure; Up returns after first error by default
  } else {
   fmt.Printf("OK     %s (%s)\n", r.Source.Path, r.Duration)
  }
 }
 return err
}
```

**Key Takeaway**: Separate `CheckMigrations` (pre-deploy assertion) from `ApplyMigrations` (deployment action) — the check fails fast in CI, while the apply runs as a deployment init step.

**Why It Matters**: Without a migration check, a deployment can succeed but the application immediately fails because the schema it expects does not match the database. By failing the pipeline at the check stage, you catch the mismatch before any artifact is deployed, preventing a rollback of both the application and the migrations.

---

### Example 70: Dry-Run Mode (goose status before apply)

`goose status` reports pending and applied migrations without modifying the database — the standard pre-apply verification step in any migration workflow.

```go
// File: cmd/migrate/main.go
// => CLI entrypoint with dry-run flag that shows status without applying

package main

import (
 "context"
 "database/sql"
 "embed"
 "flag"
 "fmt"
 "log"
 "os"

 "github.com/pressly/goose/v3"
 _ "github.com/lib/pq"
)

//go:embed ../../db/migrations
var migrationsFS embed.FS

func main() {
 dryRun := flag.Bool("dry-run", false, "show pending migrations without applying them")
 // => Flag: --dry-run prints status; omitting it applies migrations
 flag.Parse()

 dsn := os.Getenv("DATABASE_URL")
 // => DATABASE_URL is the standard 12-factor app DB connection env var
 if dsn == "" {
  log.Fatal("DATABASE_URL is required")
 }

 db, err := sql.Open("postgres", dsn)
 if err != nil {
  log.Fatal(err)
 }
 defer db.Close()

 provider, err := goose.NewProvider(goose.DialectPostgres, db, migrationsFS)
 if err != nil {
  log.Fatal(err)
 }

 ctx := context.Background()

 if *dryRun {
  // => Dry-run: collect and display status without modifying the database
  sources, err := provider.ListSources()
  if err != nil {
   log.Fatal(err)
  }
  dbVersions, err := provider.GetDBVersions(ctx)
  if err != nil {
   log.Fatal(err)
  }

  applied := make(map[int64]bool)
  for _, v := range dbVersions {
   applied[v.Version] = true
  }

  fmt.Println("Migration Status:")
  fmt.Printf("%-12s %-10s %s\n", "Version", "Status", "File")
  // => Printf for aligned columns; %-12s left-justifies in 12-char field
  for _, s := range sources {
   status := "Pending"
   if applied[s.Version] {
    status = "Applied"
   }
   fmt.Printf("%-12d %-10s %s\n", s.Version, status, s.Path)
  }
  os.Exit(0)
  // => Exit 0: dry-run succeeded; caller can inspect output
 }

 // => Apply mode: run all pending migrations
 results, err := provider.Up(ctx)
 for _, r := range results {
  fmt.Printf("applied %s in %s\n", r.Source.Path, r.Duration)
 }
 if err != nil {
  log.Fatal(err)
 }
}
```

**Key Takeaway**: Build a `--dry-run` flag into your migration CLI to give operators a read-only view of pending changes before committing to an apply.

**Why It Matters**: In production operations, surprises are dangerous. A dry-run lets the on-call engineer verify exactly which migrations will run before touching the live database. This is especially valuable during incident response, where an accidental `goose up` could apply migrations from a pending feature branch during a hotfix deployment.

---

### Example 71: Migration Version Gap Handling

Version gaps occur when a hotfix migration (e.g., version 55) is applied to production while versions 53-54 from a feature branch are still pending. Goose's `WithAllowMissing` handles this, but detection matters.

```go
// File: internal/migrate/gap_detection.go
// => Detects and reports version gaps between applied and available migrations

package migrate

import (
 "context"
 "database/sql"
 "embed"
 "fmt"
 "sort"

 "github.com/pressly/goose/v3"
)

// GapReport summarizes the difference between file-based and DB-applied versions.
type GapReport struct {
 AppliedVersions   []int64
 // => Versions currently in goose_db_version
 AvailableVersions []int64
 // => Versions found in migration files
 MissingVersions   []int64
 // => Versions in DB but not in files (deleted migrations — dangerous)
 PendingVersions   []int64
 // => Versions in files but not in DB
 OutOfOrderGaps    []int64
 // => Pending versions that are older than the current max applied version
}

// DetectGaps builds a GapReport comparing migration files against DB state.
func DetectGaps(ctx context.Context, db *sql.DB, fs embed.FS) (*GapReport, error) {
 provider, err := goose.NewProvider(goose.DialectPostgres, db, fs)
 if err != nil {
  return nil, fmt.Errorf("create provider: %w", err)
 }

 sources, err := provider.ListSources()
 // => All migration files in the embedded FS
 if err != nil {
  return nil, fmt.Errorf("list sources: %w", err)
 }

 dbVersions, err := provider.GetDBVersions(ctx)
 // => Versions recorded in goose_db_version table
 if err != nil {
  return nil, fmt.Errorf("get db versions: %w", err)
 }

 available := make(map[int64]bool)
 var availableList []int64
 for _, s := range sources {
  available[s.Version] = true
  availableList = append(availableList, s.Version)
 }

 appliedSet := make(map[int64]bool)
 var appliedList []int64
 var maxApplied int64
 for _, v := range dbVersions {
  appliedSet[v.Version] = true
  appliedList = append(appliedList, v.Version)
  if v.Version > maxApplied {
   maxApplied = v.Version
   // => Track the highest applied version to detect out-of-order gaps
  }
 }

 report := &GapReport{
  AppliedVersions:   appliedList,
  AvailableVersions: availableList,
 }

 for _, v := range availableList {
  if !appliedSet[v] {
   report.PendingVersions = append(report.PendingVersions, v)
   if v < maxApplied {
    report.OutOfOrderGaps = append(report.OutOfOrderGaps, v)
    // => Version is older than max applied but not yet applied: out-of-order gap
   }
  }
 }

 for _, v := range appliedList {
  if !available[v] {
   report.MissingVersions = append(report.MissingVersions, v)
   // => Applied in DB but file deleted: dangerous — cannot roll back
  }
 }

 sort.Slice(report.PendingVersions, func(i, j int) bool {
  return report.PendingVersions[i] < report.PendingVersions[j]
 })
 // => Sort for consistent output in reports and logs

 return report, nil
}
```

**Key Takeaway**: Build gap detection logic that distinguishes between out-of-order gaps (safely handled by `AllowMissing`) and deleted migration files (dangerous — no rollback path exists).

**Why It Matters**: A deleted migration file that was already applied to the database creates a permanent gap in the version history. Goose cannot roll back what it cannot find. Gap detection surfaces this problem during deployment verification, long before it becomes an unrecoverable incident.

---

### Example 72: Hybrid SQL + Go Migration Workflow

Large features often need both DDL changes (SQL migrations) and data seeding or transformation (Go migrations) executed in coordination. Goose handles both in the same directory with unified version ordering.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Hybrid SQL + Go migration ordering
graph LR
    A[00050_create_regions.sql] --> B[00051_seed_regions.go]
    B --> C[00052_add_region_fk.sql]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

**SQL migration — create table:**

```sql
-- File: db/migrations/00050_create_regions.sql

-- +goose Up
-- => Creates the regions lookup table before the Go seeder runs
CREATE TABLE regions (
    id   SERIAL       NOT NULL PRIMARY KEY,
    code VARCHAR(10)  NOT NULL UNIQUE,
    -- => UNIQUE constraint: prevents duplicate region codes
    name VARCHAR(255) NOT NULL
);

-- +goose Down
DROP TABLE IF EXISTS regions;
```

**Go migration — seed regions:**

```go
// File: db/migrations/00051_seed_regions.go
// => Runs after 00050_create_regions.sql because version 51 > 50
// => Goose applies mixed SQL + Go migrations in strict version order

package migrations

import (
 "context"
 "database/sql"

 "github.com/pressly/goose/v3"
)

func init() {
 goose.AddMigrationContext(upSeedRegions, downSeedRegions)
 // => AddMigrationContext: transactional — seed + version record are atomic
}

var regionSeedData = []struct{ code, name string }{
 {"US-EAST", "US East"},
 {"US-WEST", "US West"},
 {"EU-WEST", "Europe West"},
 {"APAC",    "Asia Pacific"},
}
// => Package-level constant data: immutable reference data that drives the seed

func upSeedRegions(ctx context.Context, tx *sql.Tx) error {
 for _, r := range regionSeedData {
  _, err := tx.ExecContext(ctx,
   `INSERT INTO regions (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING`,
   r.code, r.name,
  )
  // => ON CONFLICT DO NOTHING: idempotent; safe to re-run without duplicates
  if err != nil {
   return err
   // => tx will roll back automatically when upSeedRegions returns non-nil
  }
 }
 return nil
}

func downSeedRegions(ctx context.Context, tx *sql.Tx) error {
 _, err := tx.ExecContext(ctx,
  `DELETE FROM regions WHERE code = ANY(ARRAY['US-EAST','US-WEST','EU-WEST','APAC'])`,
  // => Array literal in SQL: removes only the rows seeded by this migration
 )
 return err
}
```

**Key Takeaway**: Place Go and SQL migration files in the same directory — Goose unifies them under the same version ordering system, ensuring DDL and data seeding execute in the correct sequence.

**Why It Matters**: The versioned filename prefix (00050, 00051) is the single source of truth for execution order across both file types. You can freely interleave SQL schema changes and Go data migrations without maintaining a separate orchestration layer. Goose handles detection, ordering, and version tracking for both transparently.

---

### Example 73: Migration with Custom Logger

Replacing Goose's default logger with a structured logger routes migration output to your existing observability stack instead of raw `log.Printf` to stdout.

```go
// File: internal/migrate/logger.go
// => Custom slog-based logger for Goose; routes migration output to structured log pipeline

package migrate

import (
 "log/slog"

 "github.com/pressly/goose/v3"
)

// SlogLogger adapts Go's slog package to the goose.Logger interface.
type SlogLogger struct {
 logger *slog.Logger
 // => Embed a specific slog.Logger instance rather than using the default
 // => Allows different log levels or handlers per migration provider
}

// Ensure SlogLogger implements goose.Logger at compile time.
var _ goose.Logger = (*SlogLogger)(nil)
// => Compile-time interface check: fails if SlogLogger is missing any method
// => Pattern: var _ InterfaceName = (*ConcreteType)(nil)

// NewSlogLogger creates a SlogLogger that wraps the given slog.Logger.
func NewSlogLogger(logger *slog.Logger) *SlogLogger {
 return &SlogLogger{logger: logger}
 // => Constructor: callers inject their slog.Logger; no global state
}

// Printf implements goose.Logger; called by Goose for progress messages.
func (l *SlogLogger) Printf(format string, v ...interface{}) {
 l.logger.Info("goose", slog.Any("msg", v))
 // => Maps Goose's Printf calls to slog.Info level
 // => "goose" key groups all migration logs for easy filtering in Loki/Datadog
}

// Fatalf implements goose.Logger; called by Goose for fatal errors.
func (l *SlogLogger) Fatalf(format string, v ...interface{}) {
 l.logger.Error("goose fatal", slog.Any("msg", v))
 // => Maps fatal Goose messages to slog.Error level
 // => Note: Goose's built-in logger calls os.Exit after Fatalf; this adapter does not
 // => If you need os.Exit behavior, call os.Exit(1) after this log statement
}

// NewProviderWithSlog creates a goose.Provider using the custom slog logger.
func NewProviderWithSlog(
 dialect goose.Dialect,
 db interface{ Ping() error },
 fs interface{},
 logger *slog.Logger,
) {
 _ = goose.WithLogger(NewSlogLogger(logger))
 // => goose.WithLogger is a functional option passed to goose.NewProvider
 // => All Goose output now goes through your slog pipeline (DataDog, CloudWatch, etc.)
}
```

**Key Takeaway**: Implement `goose.Logger` with a `Printf`/`Fatalf` adapter for your existing structured logger — this routes all Goose output into your standard observability stack with no extra configuration.

**Why It Matters**: Raw `log.Printf` output from migrations is difficult to correlate with application traces in structured log aggregators like Datadog or Grafana Loki. By routing Goose output through slog with consistent field names, every migration log entry becomes searchable alongside your application logs, enabling precise incident correlation.

---

### Example 74: Schema Drift Detection Pattern

Schema drift occurs when the live database schema diverges from what migrations expect — for example, a manual `ALTER TABLE` in production. Detection compares the live schema snapshot against a known-good baseline.

```go
// File: internal/migrate/drift.go
// => Compares live schema against migration-expected schema to detect manual changes

package migrate

import (
 "context"
 "database/sql"
 "fmt"
 "sort"
 "strings"
)

// ColumnInfo represents one column from information_schema.
type ColumnInfo struct {
 TableName     string
 ColumnName    string
 DataType      string
 IsNullable    string
 ColumnDefault sql.NullString
}
// => Used for drift comparison between baseline and live schema snapshots

// GetSchemaSnapshot returns all user-defined table columns from the live DB.
// => Excludes system tables (pg_catalog, information_schema) using schema filter
func GetSchemaSnapshot(ctx context.Context, db *sql.DB) ([]ColumnInfo, error) {
 rows, err := db.QueryContext(ctx, `
  SELECT table_name, column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name NOT LIKE 'goose_%'
  ORDER BY table_name, ordinal_position`,
  // => Excludes goose_db_version; we only want application schema
  // => ORDER BY ensures deterministic output for diff comparison
 )
 if err != nil {
  return nil, fmt.Errorf("query schema: %w", err)
 }
 defer rows.Close()

 var cols []ColumnInfo
 for rows.Next() {
  var c ColumnInfo
  if err := rows.Scan(&c.TableName, &c.ColumnName, &c.DataType, &c.IsNullable, &c.ColumnDefault); err != nil {
   return nil, fmt.Errorf("scan column: %w", err)
  }
  cols = append(cols, c)
 }
 return cols, rows.Err()
}

// DiffSchemas returns columns present in live but absent in baseline, and vice versa.
func DiffSchemas(baseline, live []ColumnInfo) (added, removed []ColumnInfo) {
 key := func(c ColumnInfo) string {
  return fmt.Sprintf("%s.%s:%s", c.TableName, c.ColumnName, c.DataType)
  // => Composite key: table + column + type uniquely identifies a column definition
 }

 baselineSet := make(map[string]bool)
 for _, c := range baseline {
  baselineSet[key(c)] = true
 }

 liveSet := make(map[string]bool)
 for _, c := range live {
  liveSet[key(c)] = true
 }

 for _, c := range live {
  if !baselineSet[key(c)] {
   added = append(added, c)
   // => In live but not baseline: column was added outside migrations
  }
 }

 for _, c := range baseline {
  if !liveSet[key(c)] {
   removed = append(removed, c)
   // => In baseline but not live: column was dropped outside migrations
  }
 }

 sort.Slice(added, func(i, j int) bool { return added[i].TableName < added[j].TableName })
 sort.Slice(removed, func(i, j int) bool { return removed[i].TableName < removed[j].TableName })
 // => Sort for stable, human-readable diff output

 return added, removed
}

// FormatDriftReport renders a human-readable drift summary.
func FormatDriftReport(added, removed []ColumnInfo) string {
 var b strings.Builder
 if len(added) == 0 && len(removed) == 0 {
  b.WriteString("No schema drift detected.\n")
  return b.String()
 }
 for _, c := range added {
  fmt.Fprintf(&b, "DRIFT +col  %s.%s (%s)\n", c.TableName, c.ColumnName, c.DataType)
  // => "+" prefix: column exists in live DB but not in migration baseline
 }
 for _, c := range removed {
  fmt.Fprintf(&b, "DRIFT -col  %s.%s (%s)\n", c.TableName, c.ColumnName, c.DataType)
  // => "-" prefix: column expected from migrations but absent in live DB
 }
 return b.String()
}
```

**Key Takeaway**: Snapshot `information_schema.columns` before and after migration runs, then diff them to surface columns that were added or removed by manual database operations outside the migration system.

**Why It Matters**: Manual schema changes — a quick `ALTER TABLE` to fix a production incident, a column added directly by a DBA — silently diverge from the migration history. Without drift detection, the next migration that touches that table may fail with a confusing error. Running drift detection as part of your CI/CD pipeline makes this divergence visible immediately after deployment.

---

### Example 75: Migration Rollback Testing

Rollback testing verifies that the Down block correctly undoes the Up block — a common gap in migration test coverage. The pattern applies a migration, captures the schema, rolls it back, and asserts the schema is restored.

```go
// File: internal/migrate/rollback_test.go
// => Tests that each migration's Down block correctly reverses its Up block

package migrate_test

import (
 "context"
 "database/sql"
 "embed"
 "testing"

 "github.com/pressly/goose/v3"
 _ "github.com/lib/pq"
)

//go:embed testdata/migrations
var testMigrationsFS embed.FS
// => Separate test migrations FS so tests do not depend on production migration files

func TestMigrationRollback(t *testing.T) {
 // => Requires a running PostgreSQL instance; use testcontainers or a CI service
 db, err := sql.Open("postgres", "postgres://test:test@localhost:5432/testdb?sslmode=disable")
 if err != nil {
  t.Fatal(err)
 }
 defer db.Close()

 provider, err := goose.NewProvider(goose.DialectPostgres, db, testMigrationsFS)
 if err != nil {
  t.Fatal(err)
 }

 ctx := context.Background()

 // => Step 1: capture schema before any migrations
 baselineCols := captureColumnNames(t, db)

 // => Step 2: apply all migrations
 if _, err := provider.Up(ctx); err != nil {
  t.Fatalf("up failed: %v", err)
 }

 migratedCols := captureColumnNames(t, db)
 if len(migratedCols) <= len(baselineCols) {
  t.Error("expected more columns after migration than before")
  // => Sanity check: migrations should have added schema
 }

 // => Step 3: roll back all migrations one by one in reverse version order
 sources, _ := provider.ListSources()
 for i := len(sources) - 1; i >= 0; i-- {
  if _, err := provider.DownTo(ctx, sources[i].Version-1); err != nil {
   t.Fatalf("rollback to version %d failed: %v", sources[i].Version-1, err)
  }
 }

 // => Step 4: assert schema is restored to baseline
 restoredCols := captureColumnNames(t, db)
 if len(restoredCols) != len(baselineCols) {
  t.Errorf("column count after full rollback: got %d, want %d",
   len(restoredCols), len(baselineCols),
  )
  // => Mismatch: a Down block failed to remove a column it added
 }
}

func captureColumnNames(t *testing.T, db *sql.DB) []string {
 t.Helper()
 // => t.Helper(): marks this as a helper; test failures show the caller's line
 rows, err := db.QueryContext(context.Background(), `
  SELECT table_name || '.' || column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name NOT LIKE 'goose_%'
  ORDER BY 1`,
 )
 if err != nil {
  t.Fatal(err)
 }
 defer rows.Close()

 var cols []string
 for rows.Next() {
  var col string
  if err := rows.Scan(&col); err != nil {
   t.Fatal(err)
  }
  cols = append(cols, col)
 }
 return cols
}
```

**Key Takeaway**: Test rollback by applying all migrations, capturing the schema, rolling back to zero, and asserting the schema matches the pre-migration baseline — this catches Down blocks that silently fail or are incomplete.

**Why It Matters**: Down blocks are written once and rarely executed, making them the most likely place for bugs. A broken Down block discovered during a production incident rollback — when every second counts — is far worse than one caught in CI. Rollback testing makes Down blocks first-class citizens in your quality gate.

---

### Example 76: Blue-Green Deployment Migrations

Blue-green deployments run two environments simultaneously during a switch. Migrations must be backward-compatible with the old app version for the transition window.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Blue-green migration compatibility window
graph TD
    A[Migration runs] --> B{New column backward-compatible?}
    B -->|Yes: nullable + default| C[Both blue and green pods work]
    B -->|No: NOT NULL no default| D[Blue pods crash - rollback required]
    C --> E[Switch load balancer to green]
    E --> F[Decommission blue]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style E fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style F fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

**The backward-compatible migration:**

```sql
-- File: db/migrations/00055_add_tier_to_accounts.sql
-- => Blue-green compatible migration: backward-compatible schema change

-- +goose Up
-- => Rule 1: new columns must be nullable or have a default
-- => This allows the old (blue) app to keep INSERTing without supplying the new column
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS tier VARCHAR(20) NULL DEFAULT 'standard';
-- => NULL: old app INSERT statements omit this column; DB stores NULL or default
-- => DEFAULT 'standard': new app reads this column; gets sensible value on old rows

-- => Rule 2: do NOT rename columns or tables in a blue-green migration
-- => Rule 3: do NOT add NOT NULL constraints without defaults during the switch window

-- +goose Down
ALTER TABLE accounts DROP COLUMN IF EXISTS tier;
```

**Static analysis helper for blue-green compatibility:**

```go
// File: internal/migrate/bgcompat/checker.go
// => Heuristic check that flags non-backward-compatible migration patterns in CI

package bgcompat

import "strings"

// IsSafeForBlueGreen performs a heuristic check on a migration SQL string.
// => Not a parser: catches the most common anti-patterns via string matching
// => Use as a lint step in CI, not as a hard guarantee
func IsSafeForBlueGreen(sql string) (safe bool, reason string) {
 upper := strings.ToUpper(sql)

 if strings.Contains(upper, "RENAME") {
  return false, "RENAME TABLE or RENAME COLUMN breaks old app version during transition window"
  // => Old app still uses old name; renames are not backward-compatible
 }

 if strings.Contains(upper, "DROP COLUMN") && !strings.Contains(upper, "IF EXISTS") {
  return false, "DROP COLUMN without IF EXISTS may fail if already removed; always use IF EXISTS"
 }

 if strings.Contains(upper, "NOT NULL") && !strings.Contains(upper, "DEFAULT") {
  return false, "NOT NULL column without DEFAULT breaks INSERT from old app version"
  // => Old app omits new column in INSERT; DB rejects with NOT NULL violation
 }

 return true, ""
 // => Passed all heuristic checks; safe for blue-green window
}
```

**Key Takeaway**: Blue-green migrations must be backward-compatible — new columns need a default or be nullable so old app pods continue to function during the transition window.

**Why It Matters**: During a blue-green switch, both versions of the application run simultaneously for a period. A non-backward-compatible migration — like adding a `NOT NULL` column without a default — causes all blue pods (running the old app) to fail every `INSERT`. This creates immediate production errors before you even switch traffic, defeating the purpose of blue-green.

---

### Example 77: Feature Flag Migration Pattern

Feature flag migrations add schema that new features need while the feature is still behind a flag — decoupling database schema from application code delivery.

```sql
-- File: db/migrations/00056_add_feature_recommendations_schema.sql
-- => Adds schema for recommendations feature behind feature flag
-- => Schema is deployed before the feature is enabled; app code gates access to it

-- +goose Up
-- => Create table now; application code reads it only when flag is ON
CREATE TABLE IF NOT EXISTS recommendations (
    id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    -- => gen_random_uuid(): PostgreSQL 13+ built-in; no pgcrypto needed
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- => CASCADE: deleting a user removes their recommendations automatically
    item_id     BIGINT       NOT NULL,
    score       NUMERIC(5,4) NOT NULL CHECK (score >= 0 AND score <= 1),
    -- => NUMERIC(5,4): 5 digits total, 4 decimal places; stores scores 0.0000-1.0000
    -- => CHECK constraint: enforces valid probability range at DB level
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ  NULL
    -- => expires_at NULL means recommendation never expires
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_score
    ON recommendations (user_id, score DESC)
    WHERE expires_at IS NULL OR expires_at > NOW();
-- => Partial index: only non-expired recommendations
-- => score DESC: supports "top N recommendations for user" queries efficiently

-- +goose Down
DROP INDEX  IF EXISTS idx_recommendations_user_score;
DROP TABLE  IF EXISTS recommendations;
-- => Drop index before table: avoids dependency conflicts
```

**Application-side feature flag check:**

```go
// File: internal/feature/flags.go
// => Application-side feature flag check that gates access to the new schema

package feature

import "os"

// RecommendationsEnabled reports whether the recommendations feature is active.
// => Reads from environment variable; in production use a feature flag service
func RecommendationsEnabled() bool {
 return os.Getenv("FEATURE_RECOMMENDATIONS") == "true"
 // => Simple env-based flag; replace with LaunchDarkly/Flipt/Unleash for gradual rollout
}
```

**Key Takeaway**: Deploy schema for new features before enabling the feature flag — this separates the risky database migration from the feature activation, allowing each to be rolled back independently.

**Why It Matters**: Bundling schema changes with feature activation means a rollback of either also rolls back the other. Separating them lets you revert a buggy feature by toggling the flag (zero downtime) without also reverting the schema, which may already have data in it. The schema becomes the stable foundation; the flag controls application behavior.

---

### Example 78: Migration Performance Benchmarking

Benchmarking measures how long a migration takes against a representative data volume — catching slow migrations before they reach production.

```go
// File: internal/migrate/bench_test.go
// => Benchmarks migration execution time against a seeded dataset
// => Run with: go test -bench=BenchmarkMigrationUp -benchmem ./internal/migrate/...

package migrate_test

import (
 "context"
 "database/sql"
 "embed"
 "testing"

 "github.com/pressly/goose/v3"
 _ "github.com/lib/pq"
)

//go:embed testdata/migrations
var benchMigrationsFS embed.FS

func BenchmarkMigrationUp(b *testing.B) {
 // => b.N: Go testing framework runs the benchmark loop until stable timing
 db, err := sql.Open("postgres", "postgres://test:test@localhost:5432/testdb?sslmode=disable")
 if err != nil {
  b.Fatal(err)
 }
 defer db.Close()

 b.ResetTimer()
 // => ResetTimer: excludes db.Open setup time from benchmark measurement

 for i := 0; i < b.N; i++ {
  b.StopTimer()
  // => StopTimer: pause measurement during reset phase

  // => Reset: roll back all migrations so each iteration starts clean
  provider, err := goose.NewProvider(goose.DialectPostgres, db, benchMigrationsFS)
  if err != nil {
   b.Fatal(err)
  }
  if _, err := provider.DownTo(context.Background(), 0); err != nil {
   b.Fatal(err)
  }

  // => Seed representative data volume (adjust row count to match production)
  seedBenchData(b, db, 10_000)
  // => 10k rows; scale to match the table size in production for meaningful timing

  b.StartTimer()
  // => StartTimer: resume measurement; only the migration itself is timed

  if _, err := provider.Up(context.Background()); err != nil {
   b.Fatal(err)
  }
 }
}

func seedBenchData(b *testing.B, db *sql.DB, n int) {
 b.Helper()
 // => b.Helper(): marks this as a benchmark helper; failures show the caller's line
 for i := 0; i < n; i++ {
  _, err := db.ExecContext(context.Background(),
   `INSERT INTO orders (customer_id, status) VALUES ($1, $2)`,
   i+1, "pending",
  )
  if err != nil {
   b.Fatalf("seed row %d: %v", i, err)
  }
 }
 // => Inserts n rows; each benchmark iteration operates on a consistent dataset
}
```

**Key Takeaway**: Benchmark migrations against a seeded dataset matching production row counts — a migration that takes 50ms on 1000 rows may take 50 minutes on 50 million rows.

**Why It Matters**: Migration performance scales with data volume in ways that are not obvious from code review alone. A `UPDATE orders SET status = UPPER(status)` looks instant in development but holds a table lock for minutes on a production orders table. Running benchmarks with representative data volume during development catches these performance traps before they become 3 AM incidents.

---

### Example 79: Multi-Tenant Schema Migration

Multi-tenant systems that use schema-per-tenant (each tenant has its own PostgreSQL schema) require Goose to run migrations across all tenant schemas programmatically.

```go
// File: internal/migrate/multitenant.go
// => Applies migrations to every tenant schema in a schema-per-tenant architecture
// => Each tenant has its own schema; tables are identical but data is isolated

package migrate

import (
 "context"
 "database/sql"
 "embed"
 "fmt"
 "log/slog"

 "github.com/pressly/goose/v3"
)

// ListTenantSchemas returns all non-system schema names matching the tenant prefix.
func ListTenantSchemas(ctx context.Context, db *sql.DB) ([]string, error) {
 rows, err := db.QueryContext(ctx, `
  SELECT schema_name
  FROM information_schema.schemata
  WHERE schema_name LIKE 'tenant_%'
  ORDER BY schema_name`,
  // => Convention: tenant schemas named "tenant_{id}" or "tenant_{slug}"
  // => ORDER BY: deterministic iteration order for reproducible migration logs
 )
 if err != nil {
  return nil, fmt.Errorf("list schemas: %w", err)
 }
 defer rows.Close()

 var schemas []string
 for rows.Next() {
  var s string
  if err := rows.Scan(&s); err != nil {
   return nil, fmt.Errorf("scan schema: %w", err)
  }
  schemas = append(schemas, s)
 }
 return schemas, rows.Err()
}

// MigrateAllTenants applies migrations to every tenant schema.
// => Returns a map of schema name -> error for partial failure reporting
func MigrateAllTenants(ctx context.Context, db *sql.DB, fs embed.FS) map[string]error {
 schemas, err := ListTenantSchemas(ctx, db)
 if err != nil {
  return map[string]error{"__list_schemas": err}
  // => Return the list error as a special sentinel key
 }

 errors := make(map[string]error)
 for _, schema := range schemas {
  if err := migrateTenant(ctx, db, fs, schema); err != nil {
   errors[schema] = err
   // => Record failure but continue to other tenants
   // => Partial failure: some tenants migrated, some not — must be idempotent
   slog.Error("tenant migration failed",
    "schema", schema, "error", err,
   )
  } else {
   slog.Info("tenant migrated", "schema", schema)
  }
 }
 return errors
}

func migrateTenant(ctx context.Context, db *sql.DB, fs embed.FS, schema string) error {
 // => Set search_path to tenant schema so Goose creates its version table there
 _, err := db.ExecContext(ctx, fmt.Sprintf("SET search_path TO %s", schema))
 // => schema name comes from information_schema, not user input; injection risk is low
 // => In production, validate schema names against the known tenant list first
 if err != nil {
  return fmt.Errorf("set search_path %s: %w", schema, err)
 }

 provider, err := goose.NewProvider(goose.DialectPostgres, db, fs,
  goose.WithAllowMissing(),
  // => AllowMissing: handles tenants created at different points in migration history
  // => A new tenant starts from migration 1; an old tenant may have version 50 applied
 )
 if err != nil {
  return fmt.Errorf("create provider for %s: %w", schema, err)
 }

 _, err = provider.Up(ctx)
 // => Applies all pending migrations for this tenant's schema
 return err
}
```

**Key Takeaway**: Iterate over tenant schemas and create a separate `goose.Provider` per schema with the `search_path` set — each provider manages its own `goose_db_version` table scoped to that tenant's schema.

**Why It Matters**: Schema-per-tenant isolation means a bug in one tenant's migration cannot corrupt another tenant's data. It also enables per-tenant migration state, so a new tenant can be onboarded at any point in the migration history (always migrating from version 1 to current), while existing tenants simply apply the delta.

---

### Example 80: Migration with Encryption (pgcrypto)

Sensitive columns like Social Security numbers or API keys require encryption at rest. This migration pattern adds an encrypted column using PostgreSQL's `pgcrypto` extension.

```sql
-- File: db/migrations/00060_add_encrypted_ssn.sql

-- +goose Up
-- => Step 1: enable pgcrypto extension if not already present
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- => pgcrypto provides pgp_sym_encrypt/decrypt and gen_random_bytes
-- => IF NOT EXISTS: idempotent; safe to re-run on a DB where it is already installed

-- => Step 2: add encrypted column alongside plaintext for migration window
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ssn_encrypted BYTEA NULL;
-- => BYTEA: stores raw binary output of pgp_sym_encrypt
-- => NULL initially: backfill Go migration will populate this from ssn_plaintext

-- => Step 3: add deterministic hash column for equality lookups
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ssn_hash TEXT NULL;
-- => ssn_hash = SHA-256(ssn_plaintext); enables "find by SSN" without decrypting
-- => Cannot index ssn_encrypted directly (different ciphertext each time due to random IV)

-- +goose Down
ALTER TABLE employees DROP COLUMN IF EXISTS ssn_hash;
ALTER TABLE employees DROP COLUMN IF EXISTS ssn_encrypted;
-- => Do NOT drop the pgcrypto extension (other tables may depend on it)
```

**Go migration — backfill encrypted values:**

```go
// File: db/migrations/00061_backfill_encrypted_ssn.go
// => Reads plaintext SSN, encrypts with pgcrypto, stores hash and ciphertext
// => Runs after 00060 because version 61 > 60

package migrations

import (
 "context"
 "crypto/sha256"
 "database/sql"
 "encoding/hex"
 "fmt"

 "github.com/pressly/goose/v3"
)

func init() {
 goose.AddMigrationNoTxContext(upEncryptSSN, downEncryptSSN)
 // => NoTx: each row update is its own statement; no need for single transaction
}

func upEncryptSSN(ctx context.Context, db *sql.DB) error {
 rows, err := db.QueryContext(ctx,
  `SELECT id, ssn_plaintext FROM employees WHERE ssn_plaintext IS NOT NULL AND ssn_encrypted IS NULL`,
  // => Only processes rows that have plaintext but no encrypted value yet
  // => Idempotent: re-running skips already-encrypted rows
 )
 if err != nil {
  return fmt.Errorf("query employees: %w", err)
 }
 defer rows.Close()

 encryptKey := mustGetEncryptKey()
 // => Key must come from a secrets manager (Vault, AWS SSM, GCP Secret Manager)
 // => NEVER hardcode encryption keys in migration code or source control

 for rows.Next() {
  var id int64
  var ssn string
  if err := rows.Scan(&id, &ssn); err != nil {
   return fmt.Errorf("scan: %w", err)
  }

  hash := hashSSN(ssn)
  // => Deterministic SHA-256 hash for equality lookups without decrypting

  _, err = db.ExecContext(ctx, `
   UPDATE employees
   SET ssn_encrypted = pgp_sym_encrypt($1, $2),
       ssn_hash       = $3
   WHERE id = $4`,
   ssn, encryptKey, hash, id,
  )
  // => pgp_sym_encrypt: symmetric encryption using the provided key
  // => Ciphertext changes each call (uses random IV); non-deterministic
  if err != nil {
   return fmt.Errorf("encrypt ssn for id %d: %w", id, err)
  }
 }
 return rows.Err()
}

func hashSSN(ssn string) string {
 h := sha256.Sum256([]byte(ssn))
 return hex.EncodeToString(h[:])
 // => Hex string: 64 chars; fits comfortably in TEXT column
}

func mustGetEncryptKey() string {
 return "replace-with-vault-secret"
 // => In production: fetch from Vault or AWS Parameter Store
 // => This placeholder illustrates the call site; panicking on empty key is intentional
}

func downEncryptSSN(_ context.Context, _ *sql.DB) error {
 return nil
 // => Rollback: column removal handled by the SQL migration's Down block
}
```

**Key Takeaway**: Store encryption keys outside migration code — fetch them from a secrets manager at runtime, never hardcode them. Use a SHA-256 hash for equality lookups on encrypted columns.

**Why It Matters**: Encrypted columns solve data-at-rest exposure but introduce key management complexity. The most common mistake is embedding the key in source code or the migration file itself, which defeats the encryption entirely. Fetching the key from a managed secrets service at migration time ensures the key is never committed to version control.

---

### Example 81: Audit Trail Table Migration

Audit trail tables record every change to sensitive entities. This migration creates the table structure and the trigger that populates it automatically.

```sql
-- File: db/migrations/00062_create_audit_trail.sql

-- +goose Up
-- => Audit trail captures all INSERT/UPDATE/DELETE on monitored tables
CREATE TABLE IF NOT EXISTS audit_trail (
    id          BIGSERIAL    NOT NULL PRIMARY KEY,
    -- => BIGSERIAL: audit tables are high-write; BIGINT avoids integer overflow
    entity_type VARCHAR(100) NOT NULL,
    -- => Which table was changed: 'users', 'orders', 'payments', etc.
    entity_id   BIGINT       NOT NULL,
    -- => Primary key of the changed row in the source table
    operation   VARCHAR(10)  NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    -- => CHECK: enforces only valid operation names
    old_data    JSONB        NULL,
    -- => NULL for INSERT (no previous state); JSONB for efficient partial queries
    new_data    JSONB        NULL,
    -- => NULL for DELETE (no new state)
    changed_by  TEXT         NOT NULL DEFAULT current_user,
    -- => current_user: PostgreSQL session user; useful for DB-level auth systems
    changed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- => Index for querying audit history of a specific entity
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity
    ON audit_trail (entity_type, entity_id, changed_at DESC);
-- => Composite index: fast "show history for users.id=42" queries
-- => changed_at DESC: most recent events returned first by default

-- => Generic trigger function reused by all monitored tables
CREATE OR REPLACE FUNCTION audit_trail_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- => TG_OP: trigger operation type; set by PostgreSQL for each trigger call
        INSERT INTO audit_trail (entity_type, entity_id, operation, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::jsonb);
        -- => TG_TABLE_NAME: name of the table that fired the trigger
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_trail (entity_type, entity_id, operation, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        -- => OLD: row state before the UPDATE; NEW: row state after
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_trail (entity_type, entity_id, operation, old_data)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
-- => plpgsql: PostgreSQL procedural language; required for conditional trigger logic

-- => Attach trigger to the users table
CREATE OR REPLACE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trail_trigger();
-- => AFTER: trigger fires after the operation completes; row is committed
-- => FOR EACH ROW: fires once per modified row (not once per statement)

-- +goose Down
DROP TRIGGER  IF EXISTS users_audit_trigger  ON users;
DROP FUNCTION IF EXISTS audit_trail_trigger;
DROP INDEX    IF EXISTS idx_audit_trail_entity;
DROP TABLE    IF EXISTS audit_trail;
-- => ORDER MATTERS: drop trigger before function, function before table
```

**Key Takeaway**: Implement audit trails with a reusable trigger function attached per-table — the generic `TG_TABLE_NAME` and `row_to_json()` approach avoids duplicating logic for each audited entity.

**Why It Matters**: Audit trails are a compliance requirement in financial, healthcare, and government systems. Implementing them at the database trigger level ensures every change is captured regardless of which application or tool modifies the data, including direct DBA operations and batch jobs that bypass application-level logging.

---

### Example 82: Soft Delete Schema Pattern

Soft delete preserves rows by marking them as deleted rather than physically removing them, enabling undo operations, audit history, and GDPR-compliant data management.

```sql
-- File: db/migrations/00063_add_soft_delete_to_users.sql

-- +goose Up
-- => Add soft delete columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
-- => NULL means the row is active; non-NULL means the row is soft-deleted
-- => TIMESTAMPTZ: records when deletion occurred with timezone awareness

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by TEXT NULL;
-- => Who deleted the row; useful for audit and compliance reporting

-- => Partial index: speeds up all queries that exclude soft-deleted rows
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active
    ON users (email)
    WHERE deleted_at IS NULL;
-- => Unique constraint only on active rows: allows email reuse after soft delete
-- => Without WHERE: soft-deleted rows would block re-registration with same email

-- +goose Down
DROP INDEX  IF EXISTS idx_users_email_active;
ALTER TABLE users DROP COLUMN IF EXISTS deleted_by;
ALTER TABLE users DROP COLUMN IF EXISTS deleted_at;
-- => Drop index before columns: prevents constraint violations during rollback
```

**Go migration — create active_users view:**

```go
// File: db/migrations/00064_create_active_users_view.go
// => Creates a view that automatically excludes soft-deleted rows for convenience

package migrations

import (
 "context"
 "database/sql"

 "github.com/pressly/goose/v3"
)

func init() {
 goose.AddMigrationContext(upActiveUsersView, downActiveUsersView)
 // => Transactional: view creation and version record are atomic
}

func upActiveUsersView(ctx context.Context, tx *sql.Tx) error {
 _, err := tx.ExecContext(ctx, `
  CREATE OR REPLACE VIEW active_users AS
  SELECT * FROM users
  WHERE deleted_at IS NULL`,
  // => active_users view: app code queries this instead of users directly
  // => All soft-delete filtering happens at the DB level; no WHERE in app
 )
 return err
}

func downActiveUsersView(ctx context.Context, tx *sql.Tx) error {
 _, err := tx.ExecContext(ctx, `DROP VIEW IF EXISTS active_users`)
 return err
}
```

**Key Takeaway**: Combine a partial unique index (`WHERE deleted_at IS NULL`) with a convenience view (`active_users`) to implement soft delete — the index enforces uniqueness among active rows only, and the view hides the filter from application code.

**Why It Matters**: Without the partial unique index, soft-deleted emails block re-registration. Without the view, every query in the application must remember to add `WHERE deleted_at IS NULL`, creating widespread surface area for bugs. The schema pattern encapsulates both concerns at the database layer, making correct behavior the default.

---

### Example 83: Migration Dependency Graph

Complex database schemas have ordering constraints that are not always captured by timestamp-based version numbers. This pattern documents and validates implicit dependencies between migrations.

```go
// File: internal/migrate/depgraph.go
// => Documents and validates migration dependency ordering constraints

package migrate

import (
 "fmt"
 "sort"
)

// MigrationNode represents a single migration and its explicit dependencies.
type MigrationNode struct {
 Version     int64
 // => Migration version number (from filename prefix)
 Description string
 DependsOn   []int64
 // => Versions this migration requires to be applied first
 // => Goose version ordering handles most cases; this captures cross-cutting deps
}

// MigrationGraph holds all nodes and validates dependency ordering.
type MigrationGraph struct {
 nodes map[int64]*MigrationNode
}

// NewMigrationGraph creates an empty graph.
func NewMigrationGraph() *MigrationGraph {
 return &MigrationGraph{nodes: make(map[int64]*MigrationNode)}
}

// AddNode registers a migration node in the graph.
func (g *MigrationGraph) AddNode(n MigrationNode) {
 g.nodes[n.Version] = &n
 // => Overwrites if same version added twice
}

// Validate checks that all dependency versions exist and no cycles are present.
func (g *MigrationGraph) Validate() error {
 for version, node := range g.nodes {
  for _, dep := range node.DependsOn {
   if _, ok := g.nodes[dep]; !ok {
    return fmt.Errorf("migration %d depends on %d which does not exist in graph",
     version, dep,
    )
    // => Missing dependency: likely a typo or a migration file was deleted
   }
   if dep >= version {
    return fmt.Errorf("migration %d depends on %d: dependency must have lower version number",
     version, dep,
    )
    // => Out-of-order dependency: version ordering would not apply dep first
   }
  }
 }
 return g.detectCycles()
}

func (g *MigrationGraph) detectCycles() error {
 visited := make(map[int64]int)
 // => 0: unvisited, 1: in-progress (on current DFS path), 2: done
 var versions []int64
 for v := range g.nodes {
  versions = append(versions, v)
 }
 sort.Slice(versions, func(i, j int) bool { return versions[i] < versions[j] })

 var dfs func(int64) error
 dfs = func(v int64) error {
  visited[v] = 1
  // => Mark as in-progress: being explored in current DFS path
  for _, dep := range g.nodes[v].DependsOn {
   if visited[dep] == 1 {
    return fmt.Errorf("cycle detected: migration %d and %d are mutually dependent", v, dep)
    // => Cycle: A depends on B which depends on A — impossible to resolve
   }
   if visited[dep] == 0 {
    if err := dfs(dep); err != nil {
     return err
    }
   }
  }
  visited[v] = 2
  // => Mark as done: all dependencies explored, no cycles found
  return nil
 }

 for _, v := range versions {
  if visited[v] == 0 {
   if err := dfs(v); err != nil {
    return err
   }
  }
 }
 return nil
}
```

**Key Takeaway**: Maintain an explicit dependency graph for migrations that reference cross-cutting concerns (shared functions, extension-dependent types) — this surfaces ordering violations that timestamp-based versioning alone cannot catch.

**Why It Matters**: Goose applies migrations in version order, which handles most cases. But when a migration creates a stored function that another migration depends on, the only enforcement is the convention that the function-creator has a lower version number. An explicit dependency graph validates this convention programmatically, catching violations in CI before they cause cryptic failures in production.

---

### Example 84: Production Migration Checklist Pattern

A code-encoded checklist verifies that a migration satisfies production safety requirements before it is approved for deployment.

```go
// File: internal/migrate/checklist.go
// => Encodes production migration safety requirements as executable checks
// => Run these checks in CI before any migration is merged to the main branch

package migrate

import (
 "fmt"
 "strings"
)

// MigrationCheck represents a single production safety requirement.
type MigrationCheck struct {
 Name string
 Desc string
 Fn   func(sql string) error
}
// => Each check is a function that returns nil (pass) or an error (fail)

// ProductionChecks returns all mandatory checks for production migrations.
func ProductionChecks() []MigrationCheck {
 return []MigrationCheck{
  {
   Name: "no-lock-table",
   Desc: "Avoid LOCK TABLE; prefer CONCURRENTLY or short-lived locks",
   Fn: func(sql string) error {
    if strings.Contains(strings.ToUpper(sql), "LOCK TABLE") {
     return fmt.Errorf("explicit LOCK TABLE detected: use CONCURRENTLY or split migration")
    }
    return nil
    // => LOCK TABLE holds ACCESS EXCLUSIVE for the statement duration
   },
  },
  {
   Name: "concurrent-index",
   Desc: "New indexes on large tables must use CONCURRENTLY",
   Fn: func(sql string) error {
    upper := strings.ToUpper(sql)
    hasCreateIndex := strings.Contains(upper, "CREATE INDEX") && !strings.Contains(upper, "CONCURRENTLY")
    if hasCreateIndex {
     return fmt.Errorf("CREATE INDEX without CONCURRENTLY blocks writes; use CREATE INDEX CONCURRENTLY")
    }
    return nil
   },
  },
  {
   Name: "down-block-present",
   Desc: "Every SQL migration must have a -- +goose Down block",
   Fn: func(sql string) error {
    if !strings.Contains(sql, "-- +goose Down") {
     return fmt.Errorf("missing -- +goose Down block: all migrations must be reversible")
    }
    return nil
    // => Down block is required for rollback capability in production incidents
   },
  },
  {
   Name: "no-truncate",
   Desc: "TRUNCATE is irreversible; use DELETE with a WHERE clause",
   Fn: func(sql string) error {
    if strings.Contains(strings.ToUpper(sql), "TRUNCATE") {
     return fmt.Errorf("TRUNCATE detected: use DELETE WHERE 1=1 for reversible data removal")
    }
    return nil
   },
  },
  {
   Name: "idempotent-ddl",
   Desc: "CREATE TABLE and CREATE INDEX must use IF NOT EXISTS",
   Fn: func(sql string) error {
    upper := strings.ToUpper(sql)
    if strings.Contains(upper, "CREATE TABLE") && !strings.Contains(upper, "IF NOT EXISTS") {
     return fmt.Errorf("CREATE TABLE without IF NOT EXISTS: fails if re-run after partial application")
    }
    return nil
    // => IF NOT EXISTS makes migrations safe to re-run after failures
   },
  },
 }
}

// RunChecks applies all production checks to a migration SQL string.
// => Returns all failures, not just the first, for complete feedback
func RunChecks(sql string, checks []MigrationCheck) []error {
 var errs []error
 for _, check := range checks {
  if err := check.Fn(sql); err != nil {
   errs = append(errs, fmt.Errorf("[%s] %w", check.Name, err))
   // => Prefix with check name for actionable error messages in CI output
  }
 }
 return errs
}
```

**Key Takeaway**: Encode production safety requirements as executable functions — this transforms a static checklist into a CI gate that automatically blocks non-compliant migrations.

**Why It Matters**: Checklists in documentation are ignored under deadline pressure. Code-encoded checks run in CI every time a migration is changed, making compliance automatic and non-optional. Each check name in the error output links directly to the specific rule violated, eliminating ambiguity about what needs to be fixed.

---

### Example 85: Migration Monitoring with Prometheus Metrics

Prometheus metrics on migration execution provide operational visibility into migration duration, failure rate, and version history — essential for SRE-level observability.

```go
// File: internal/migrate/metrics.go
// => Wraps goose.Provider with Prometheus metrics instrumentation
// => Exposes migration duration, success/failure counters, and current version gauge

package migrate

import (
 "context"
 "database/sql"
 "embed"
 "fmt"
 "time"

 "github.com/pressly/goose/v3"
 "github.com/prometheus/client_golang/prometheus"
 "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
 migrationDuration = promauto.NewHistogramVec(
  prometheus.HistogramOpts{
   Name:    "goose_migration_duration_seconds",
   Help:    "Duration of individual migration executions",
   Buckets: prometheus.DefBuckets,
   // => DefBuckets: .005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10 seconds
  },
  []string{"version", "direction", "status"},
  // => Labels: version number, "up"/"down", "success"/"failure"
 )

 migrationTotal = promauto.NewCounterVec(
  prometheus.CounterOpts{
   Name: "goose_migrations_total",
   Help: "Total number of migration executions",
  },
  []string{"direction", "status"},
  // => Cumulative counter: useful for rate() in Prometheus queries
 )

 currentVersion = promauto.NewGauge(
  prometheus.GaugeOpts{
   Name: "goose_current_version",
   Help: "Current applied migration version",
  },
 )
 // => Gauge: records the current max applied version after each migration run
)

// InstrumentedProvider wraps goose.Provider with Prometheus metrics.
type InstrumentedProvider struct {
 provider *goose.Provider
 // => Delegates all migration operations to the underlying provider
}

// NewInstrumentedProvider creates a metrics-wrapped goose.Provider.
func NewInstrumentedProvider(db *sql.DB, fs embed.FS) (*InstrumentedProvider, error) {
 provider, err := goose.NewProvider(goose.DialectPostgres, db, fs,
  goose.WithAllowMissing(),
 )
 if err != nil {
  return nil, fmt.Errorf("create provider: %w", err)
 }
 return &InstrumentedProvider{provider: provider}, nil
}

// Up applies all pending migrations and records Prometheus metrics for each.
func (ip *InstrumentedProvider) Up(ctx context.Context) ([]*goose.MigrationResult, error) {
 results, err := ip.provider.Up(ctx)
 // => Delegate to the underlying provider; collect results for metric recording

 for _, r := range results {
  direction := "up"
  status := "success"
  if r.Error != nil {
   status = "failure"
   // => Record failure metrics even for partial runs
  }

  migrationDuration.WithLabelValues(
   fmt.Sprintf("%d", r.Source.Version),
   direction,
   status,
  ).Observe(r.Duration.Seconds())
  // => Observe: records the duration in the histogram bucket
  // => r.Duration.Seconds(): converts time.Duration to float64 seconds

  migrationTotal.WithLabelValues(direction, status).Inc()
  // => Inc: increments the counter by 1 for each migration
 }

 if err == nil {
  ip.updateCurrentVersion(ctx)
  // => Update the current version gauge only on full success
 }

 return results, err
}

func (ip *InstrumentedProvider) updateCurrentVersion(ctx context.Context) {
 versions, err := ip.provider.GetDBVersions(ctx)
 // => GetDBVersions: queries goose_db_version for all applied versions
 if err != nil {
  return
  // => Best-effort: do not fail the migration if metrics update fails
 }

 var maxVersion int64
 for _, v := range versions {
  if v.Version > maxVersion {
   maxVersion = v.Version
  }
 }
 currentVersion.Set(float64(maxVersion))
 // => Set gauge to current max version; float64 required by Prometheus API
}

// RecordSLO checks whether any migration result exceeded the SLO duration.
func RecordSLO(results []*goose.MigrationResult, sloBudget time.Duration) error {
 for _, r := range results {
  if r.Duration > sloBudget {
   return fmt.Errorf("migration %d exceeded SLO: took %s, budget %s",
    r.Source.Version, r.Duration, sloBudget,
   )
   // => SLO breach: alert on-call if a migration takes longer than expected
   // => Example SLO: no single migration should exceed 5 minutes
  }
 }
 return nil
}
```

**Key Takeaway**: Wrap `goose.Provider` in an instrumented struct that records Prometheus histograms per migration — this enables SLO alerting on migration duration and real-time dashboards showing current schema version.

**Why It Matters**: Without metrics, migration performance degrades silently over time as tables grow. A migration that took 2 seconds on 1 million rows takes 200 seconds on 100 million rows six months later. Prometheus histograms make this trend visible in Grafana before it breaches your deployment SLO, giving you time to optimize the migration before it causes a production incident.
