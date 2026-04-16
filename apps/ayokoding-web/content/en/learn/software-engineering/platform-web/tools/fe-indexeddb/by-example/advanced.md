---
title: "Advanced"
weight: 10000003
date: 2026-04-15T00:00:00+07:00
draft: false
description: "Master expert IndexedDB through 25 annotated examples covering Dexie.js, live queries, multi-device sync, conflict resolution, performance, security, and comparison with Cache API and OPFS"
tags: ["indexeddb", "browser-storage", "frontend", "web-api", "tutorial", "by-example", "advanced"]
---

This advanced tutorial covers expert IndexedDB patterns through 25 heavily annotated examples. You will learn Dexie.js (a full-featured ORM built on IndexedDB), Dexie's live queries for reactive UIs, multi-device sync with conflict resolution, security considerations, deep performance tuning, and comparisons with adjacent browser storage APIs (Cache API, OPFS, LocalStorage). Each example maintains 1-2.25 comment lines per code line.

## Prerequisites

Before starting, complete both previous tutorials:

- [Beginner](./beginner.md) — Raw IndexedDB API
- [Intermediate](./intermediate.md) — `idb` library, migrations, service workers, quotas

## Group 1: Dexie.js — The Full ORM

### Example 56: Why Not Core Features — Introducing Dexie.js

`idb` is a thin promise wrapper; Dexie.js is a higher-level ORM with chainable queries, typed schemas, hooks, and reactive live queries. Trade size for ergonomics when your data layer grows complex.

**Install**:

```bash
npm install dexie
```

**Why Not Core Features**: Raw IndexedDB and `idb` both require you to build the query logic, migration engine, and change-tracking yourself. Dexie bundles all three: `where('age').between(18, 65).and(u => u.active).toArray()` replaces dozens of cursor lines. Dexie adds ~25 KB gzipped but pays for itself quickly in large apps; the earlier raw-API and `idb` examples remain the right choice for small apps or when bundle size is critical.

```javascript
import Dexie from "dexie";
// => Dexie is the ORM class — extend it to define your schema

// => Declare typed subclass with stores and version
class AppDB extends Dexie {
  constructor() {
    super("DexieDemo");
    // => super("DexieDemo") sets the IndexedDB database name
    // => Version 1 schema: indexes declared in a string syntax
    this.version(1).stores({
      users: "++id, name, email",
      // => ++id: auto-increment primary key
      // => name, email: indexed fields (for where() queries)
      // => Fields not listed here are stored but not indexed
      posts: "++id, userId, createdAt",
      // => userId and createdAt are indexed for fast joins/sort
      // => createdAt index allows orderBy("createdAt") queries
    });
  }
}

const db = new AppDB();
// => Dexie opens the DB lazily on first operation
// => No await needed here — first .add/.get/etc. triggers open

// => Insert a user — await returns the generated id
const userId = await db.users.add({ name: "Aisha", email: "a@x.com" });
// => .add() inserts and returns the auto-incremented primary key
console.log("Created id:", userId);
// => Output: Created id: 1

// => Chainable query API
const adults = await db.users
  .where("name")
  // => where() references an indexed field for fast B-tree lookup
  .startsWith("A")
  // => Range query on "name" index — matches "Aisha", "Ahmad", etc.
  .toArray();
// => toArray() executes the query and returns an array of records
console.log(adults.length);
// => Output: 1
```

**Key Takeaway**: Dexie.js wraps IndexedDB with a chainable query builder, declarative schema, and transaction manager — a dramatic productivity boost for complex data layers.

**Why It Matters**: Teams shipping PWAs with dozens of object stores find hand-written IndexedDB code unmanageable. Dexie's schema DSL, fluent queries, and integrated hooks eliminate most of the boilerplate. Many large projects — from note-takers to CRMs to email clients — use Dexie as their durable client store. The trade-off is clear: heavier bundle, less direct control, but radically simpler application code.

---

### Example 57: Dexie Transactions and Hooks

Dexie's `transaction()` scope runs your function inside a multi-store transaction automatically. Hooks (`creating`, `updating`, `deleting`) fire for audit, validation, and cascading logic.

```javascript
import Dexie from "dexie";
// => Dexie is the base class for all schema definitions

const db = new Dexie("HooksDemo");
// => "HooksDemo" is the IndexedDB database name
db.version(1).stores({
  orders: "++id, customerId, total",
  // => ++id auto-increment; customerId and total indexed
  audit: "++id, event, at",
  // => audit is an append-only log; event and at are indexed
});

// => Install a creating hook that logs every new order
db.orders.hook("creating", (primKey, obj, tx) => {
  // => primKey: the key that will be assigned (may be undefined for auto-increment)
  // => obj: the record being inserted (mutable — you can modify it here)
  // => tx: the current IDB transaction
  // => Runs inside the caller's transaction
  // => Append audit row in the SAME tx for atomicity
  db.audit.add({ event: "order-created", at: Date.now() });
  // => This add runs in the same transaction as the triggering order insert
});

// => Transaction spanning multiple stores — Dexie creates the tx
await db.transaction("rw", db.orders, db.audit, async () => {
  // => "rw" = readwrite; pass store references to scope the transaction
  await db.orders.add({ customerId: 1, total: 99 });
  // => Hook fires synchronously and adds to audit store
  await db.orders.add({ customerId: 2, total: 150 });
  // => Second insert also triggers the hook — audit gets a second entry
});
// => Transaction commits atomically — both orders and both audit entries saved together

const auditCount = await db.audit.count();
// => Count all rows in the audit store
console.log("Audit entries:", auditCount);
// => Output: Audit entries: 2
```

**Key Takeaway**: `db.transaction('rw', ...stores, async () => {})` creates a multi-store transaction; hooks let you inject validation or audit logic without touching each call site.

**Why It Matters**: Hooks are where Dexie shines for business-logic-heavy apps. Audit trails, soft-delete timestamps, denormalized counters, and cross-store invariants all slot in once and apply everywhere. Because hooks run inside the caller's transaction, the audit write is atomic with the primary write — a guarantee impossible with after-the-fact listeners. In a large codebase, this enforces rules you would otherwise need code review to maintain.

---

### Example 58: Dexie `liveQuery` for Reactive UIs

`liveQuery` wraps a query in an Observable that re-emits when underlying data changes. Plug into React/Svelte/Vue for automatic UI updates.

```mermaid
graph LR
  A["User write"] --> B["Dexie transaction"]
  B -->|"commit<br/>broadcast"| C["liveQuery observers"]
  C --> D["UI re-render"]

  style A fill:#CC78BC,stroke:#000000,stroke-width:2px,color:#fff
  style B fill:#0173B2,stroke:#000000,stroke-width:2px,color:#fff
  style C fill:#DE8F05,stroke:#000000,stroke-width:2px,color:#fff
  style D fill:#029E73,stroke:#000000,stroke-width:2px,color:#fff
```

```javascript
import Dexie, { liveQuery } from "dexie";
// => liveQuery is Dexie's reactive query primitive

const db = new Dexie("Live");
// => "Live" is the IndexedDB database name
db.version(1).stores({ todos: "++id, done, createdAt" });
// => done and createdAt are indexed — liveQuery can filter/sort on them

// => liveQuery takes a function returning the query result
const observable = liveQuery(() => db.todos.where("done").equals(0).toArray());
// => The function is re-run whenever any write touches the "todos" store
// => .equals(0) matches falsy (0/false) done values
// => Returns an Observable (RxJS-compatible subscribe interface)

// => Subscribe to updates — fires immediately AND on any change
const sub = observable.subscribe({
  next: (todos) => console.log("Active todos:", todos.length),
  // => next fires on initial load and after every write affecting query
  // => todos is always the current full result set — not a delta
  error: (err) => console.error(err),
  // => error fires if the query function throws
});

// => Cause a change — observer fires automatically
await db.todos.add({ title: "Walk", done: 0, createdAt: Date.now() });
// => Next tick: "Active todos: 1"
// => liveQuery detected a write to "todos" and re-ran the query
await db.todos.add({ title: "Read", done: 0, createdAt: Date.now() });
// => "Active todos: 2"

// => Mark done — liveQuery reruns and reports new count
await db.todos.where("title").equals("Walk").modify({ done: 1 });
// => modify() updates matching records in place
// => liveQuery re-runs, Walk is now done=1, filtered out
// => "Active todos: 1"

sub.unsubscribe();
// => Stop listening when component unmounts
// => Prevents memory leaks from dangling subscriptions
```

**Key Takeaway**: `liveQuery(() => query)` returns an Observable that re-runs whenever its store is mutated, enabling reactive UIs without hand-rolled change listeners.

**Why It Matters**: Before `liveQuery`, reactive IndexedDB UIs required stitching `BroadcastChannel`, manual re-fetching, and per-query cache invalidation. `liveQuery` turns a local database into a streaming source that integrates with modern reactive frameworks directly — React's `useSyncExternalStore`, Svelte stores, Vue refs. The abstraction is so natural that Dexie-backed apps often feel as live as websocket-driven ones, with zero network involved.

---

### Example 59: Dexie Migrations Across Versions

Dexie chains `.version(n).stores(...).upgrade(tx => ...)` calls, running each transform once when the user crosses that version.

```javascript
import Dexie from "dexie";
// => Dexie manages migration chains; each version builds on the previous

const db = new Dexie("MigrationDemo");
// => Declare all versions before opening — Dexie picks up where stored version left off

// => Version 1: initial schema
db.version(1).stores({
  users: "++id, name",
  // => ++id auto-increment primary key; name is indexed
});

// => Version 2: add email index
db.version(2).stores({
  users: "++id, name, email",
  // => Adding ", email" adds a new index; no upgrade function needed
  // => Dexie infers the diff and calls createIndex("email", "email") internally
});

// => Version 3: split name into firstName/lastName + data transform
db.version(3)
  .stores({
    users: "++id, firstName, lastName, email",
    // => Remove "name" index by omitting it; add two new ones
    // => Omitting "name" calls deleteIndex("name") automatically
  })
  .upgrade(async (tx) => {
    // => Upgrade function runs once when crossing from v<3 to v3
    // => tx is a Dexie transaction — full read/write access to all stores
    return (
      tx
        .table("users")
        // => Access the users table inside the transaction
        .toCollection()
        // => Get all records as a modifiable collection
        .modify((user) => {
          // => Called per record — mutate in place; changes are saved automatically
          const parts = (user.name || "").split(" ");
          // => Split "Aisha Rahman" into ["Aisha", "Rahman"]
          user.firstName = parts[0] || "";
          // => firstName = "Aisha"
          user.lastName = parts.slice(1).join(" ");
          // => lastName = "Rahman" (handles multi-word last names)
          delete user.name;
          // => Remove the old "name" field — no longer indexed
        })
    );
  });

// => Open DB — Dexie applies every pending migration in order
await db.open();
// => Runs v1→v2→v3 upgrade chain if user is on v1; or v2→v3 if on v2
console.log("Migrated to v" + db.verno);
// => Output: Migrated to v3
// => db.verno reflects the version Dexie just set
```

**Key Takeaway**: Dexie chains `version().stores().upgrade()` declaratively; the library figures out which migrations to run based on the stored version.

**Why It Matters**: Dexie's migration model is arguably the cleanest in the browser-storage world. Each version is declared once, with schema diffs inferred from the string DSL. Upgrade functions are pure transforms — easy to test in isolation with `fake-indexeddb`. Compared to hand-written `switch(oldVersion)` blocks, Dexie's declarative style is safer and more readable, especially as the number of versions grows into double digits over years of development.

---

### Example 60: Dexie Bulk Operations

`bulkAdd`, `bulkPut`, `bulkDelete` execute thousands of writes in a single transaction, much faster than per-item calls.

```javascript
import Dexie from "dexie";
// => Dexie's bulk methods batch all requests in a single transaction
const db = new Dexie("Bulk");
// => "Bulk" is the IndexedDB database name
db.version(1).stores({ items: "++id, sku" });
// => ++id auto-increment; sku indexed for fast lookups

// => Generate 10,000 records
const records = Array.from({ length: 10_000 }, (_, i) => ({
  sku: "SKU-" + i,
  // => Unique SKU per record
  price: Math.random() * 100,
  // => Random price 0–100
}));

// => Single-transaction bulk insert
const t0 = performance.now();
// => Start timer before the operation
await db.items.bulkAdd(records);
// => One implicit transaction for all 10k records
// => Requests issued synchronously without awaiting each — browser batches them
console.log(`bulkAdd: ${(performance.now() - t0).toFixed(0)} ms`);
// => Output: bulkAdd: ~150 ms (varies by device)

// => Contrast with one-by-one in same tx
await db.items.clear();
// => Reset store before second benchmark
const t1 = performance.now();
// => Start timer for comparison run
await db.transaction("rw", db.items, async () => {
  // => Explicit rw tx wrapping the loop
  for (const r of records) await db.items.add(r);
  // => Still one transaction, but each .add awaits individually
  // => Each await yields to the microtask queue — sequential not pipelined
});
console.log(`per-item: ${(performance.now() - t1).toFixed(0)} ms`);
// => Output: per-item: ~800 ms (5x slower even in same tx)
// => Lesson: use bulkAdd/bulkPut for batch imports — never await per-record
```

**Key Takeaway**: `bulkAdd`/`bulkPut` issue requests synchronously without awaiting each — dramatically faster than looping with `await` per record.

**Why It Matters**: The hidden cost of `await` inside loops is microtask-queue thrashing — each `await` yields to the event loop and the transaction risks auto-committing. Bulk methods issue all requests synchronously into one transaction and let the browser batch work internally. For imports, migrations, and initial seeding of large datasets, bulk operations are the difference between a snappy startup and a frozen tab.

---

## Group 2: Sync and Conflict Resolution

### Example 61: Pushing Local Changes to a Server

Maintain a pending-changes queue; drain it when online. Use timestamps or monotonic IDs to order changes.

```javascript
// => recordChange appends a pending mutation to the changes queue
async function recordChange(db, type, payload) {
  await db.add("changes", {
    type,
    // => "create" | "update" | "delete"
    payload,
    // => The full record (create/update) or id (delete)
    createdAt: Date.now(),
    // => Monotonic timestamp — used to preserve causal ordering
    status: "pending",
    // => "pending" → "sent" after successful server acknowledgment
  });
}

// => syncPush drains the pending queue to the server
async function syncPush(db) {
  // => Select pending changes in order — oldest first to preserve causality
  const pending = await db.changes.where("status").equals("pending").sortBy("createdAt");
  // => sortBy returns an array sorted ascending by createdAt

  for (const change of pending) {
    try {
      // => Send to server — server is authoritative for conflict resolution
      const resp = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(change),
        // => Serialize the full change object for the server
      });
      if (!resp.ok) throw new Error("server-rejected");
      // => Non-2xx means server rejected; leave as pending for retry

      // => Mark sent on success
      await db.changes.update(change.id, { status: "sent" });
      // => Update only the status field — preserves rest of the record
    } catch (err) {
      // => Leave as pending; retry on next drain
      console.warn("Sync failed, will retry:", err);
      break;
      // => Stop draining to preserve ordering
      // => Do not skip ahead — later changes depend on earlier ones
    }
  }
}

window.addEventListener("online", () => syncPush(db));
// => Automatically retry sync whenever the browser detects connectivity
```

**Key Takeaway**: A "changes" queue keyed by monotonic timestamp lets you apply local writes immediately and flush them to the server in order when connectivity returns.

**Why It Matters**: Offline-first apps need to accept user edits without network round-trips, then push them later without losing order. The pending queue pattern is the canonical solution — it decouples the UI from the network, lets the server be authoritative for conflicts, and gives users a predictable experience regardless of connectivity. Always drain in creation order to preserve causal dependencies (creates before updates before deletes).

---

### Example 62: Pulling Server Changes into Local DB

Track the last-seen server timestamp; poll for changes since that point, then apply them locally inside a transaction.

```javascript
// => syncPull fetches server changes and applies them atomically
async function syncPull(db) {
  // => Remember the last sync cursor (server timestamp)
  const state = await db.meta.get("sync-state");
  // => db.meta is a key-value store for sync state
  const since = state?.lastSync || 0;
  // => 0 means first sync — fetch everything from the beginning

  // => Ask server for anything changed after "since"
  const resp = await fetch(`/api/sync?since=${since}`);
  // => Server returns only records updated after lastSync
  const { changes, serverTime } = await resp.json();
  // => changes: array of { id, type, payload, updatedAt }
  // => serverTime: server's current timestamp — becomes the new cursor

  // => Apply atomically inside a transaction
  await db.transaction("rw", db.items, db.meta, async () => {
    // => Both items and meta stores scoped for readwrite
    for (const change of changes) {
      // => Process each incoming change in received order
      if (change.type === "delete") {
        await db.items.delete(change.id);
        // => Remove the record — gone on server means gone locally
      } else {
        // => upsert with put for idempotency
        await db.items.put(change.payload);
        // => put() inserts if new, replaces if existing — safe to re-apply
      }
    }
    // => Advance the sync cursor only after all changes applied
    await db.meta.put({ key: "sync-state", lastSync: serverTime });
    // => Atomically update cursor — crash before this means retry on next boot
  });
  // => Transaction commits: all changes AND new cursor saved together

  console.log("Pulled", changes.length, "changes");
  // => Output: Pulled N changes
}
```

**Key Takeaway**: Pull-based sync uses a monotonically advancing server timestamp; apply all changes and cursor update atomically so a mid-sync crash leaves the DB consistent.

**Why It Matters**: Atomicity between "apply changes" and "record new cursor" is critical. If you apply changes and crash before updating the cursor, the next sync reapplies the same changes (idempotency via `put` saves you). If you update the cursor and crash before applying changes, you skip them forever — a data loss bug. The single transaction guarantees either-both-or-neither, a guarantee foundational to reliable sync.

---

### Example 63: Last-Writer-Wins Conflict Resolution

When client and server edit the same record, pick the one with the later timestamp. Simple, clear, and adequate for most user-facing fields.

```javascript
// => mergeRecord resolves a conflict between local and remote versions of a record
async function mergeRecord(db, local, remote) {
  // => Compare timestamps — last writer wins
  if (remote.updatedAt > local.updatedAt) {
    // => Server is newer — overwrite local
    await db.items.put(remote);
    // => put() replaces the local copy with the remote version
    return "took-remote";
    // => Signal to caller: remote version was chosen
  }
  if (local.updatedAt > remote.updatedAt) {
    // => Local is newer — we'll push on next sync
    // => No write needed — local copy is already correct
    return "kept-local";
    // => Signal to caller: local version was kept
  }
  // => Tie — either choice is fine; stable rule is "keep local"
  // => Consistent tie-breaking prevents oscillation between clients
  return "tie-kept-local";
  // => Signal to caller: timestamps equal, kept local copy
}

// => Example merge
const local = { id: 1, title: "A", updatedAt: 1000 };
// => local was edited at t=1000
const remote = { id: 1, title: "B", updatedAt: 2000 };
// => remote was edited at t=2000 — server has newer version
const outcome = await mergeRecord(db, local, remote);
// => remote.updatedAt (2000) > local.updatedAt (1000) → took-remote
console.log(outcome);
// => Output: took-remote
```

**Key Takeaway**: Last-writer-wins (LWW) resolves conflicts by timestamp comparison — simple, deterministic, and sufficient for most UI fields where "latest edit wins" matches user expectations.

**Why It Matters**: LWW is the most common conflict strategy for good reason — users rarely notice or care about sub-second ordering differences. The risks (lost edits when two people type simultaneously) are acceptable for many domains. For stronger guarantees, escalate to CRDTs or operational transforms, but start with LWW; most conflicts never happen because most users edit different records.

---

### Example 64: Field-Level Merging

For collaborative documents, merge field-by-field instead of whole-record: preserve local changes to fields not touched by the remote update.

```javascript
// => mergeFields performs a three-way field-level merge
// => base: the common ancestor (last synced version both sides started from)
// => local: current local version; remote: incoming server version
function mergeFields(local, remote, base) {
  const result = {};
  // => Union of all fields across both versions
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  // => Ensures fields added by either side are considered

  for (const key of keys) {
    // => Compare each field independently
    const localVal = local[key];
    // => What local changed this field to (or base value if unchanged)
    const remoteVal = remote[key];
    // => What remote changed this field to (or base value if unchanged)
    const baseVal = base?.[key];
    // => What the field was before either side edited

    if (localVal === remoteVal) {
      // => Both sides agree — trivial
      result[key] = localVal;
      // => Same value from both — no conflict
    } else if (localVal === baseVal) {
      // => Local unchanged — take remote
      result[key] = remoteVal;
      // => Only remote changed this field — accept it
    } else if (remoteVal === baseVal) {
      // => Remote unchanged — take local
      result[key] = localVal;
      // => Only local changed this field — keep it
    } else {
      // => Both changed — real conflict; fall back to LWW on timestamp
      result[key] = remote.updatedAt > local.updatedAt ? remoteVal : localVal;
      // => Last-writer-wins resolves true conflicts per field
    }
  }
  return result;
  // => Merged record combining non-conflicting edits from both sides
}

// => Usage: 3-way merge requires keeping the base version
const base = { id: 1, title: "Draft", body: "v1" };
// => base: last version both clients saw before diverging
const local = { id: 1, title: "Final", body: "v1", updatedAt: 3000 };
// => local changed title "Draft"→"Final"; body unchanged
const remote = { id: 1, title: "Draft", body: "v2", updatedAt: 2000 };
// => remote changed body "v1"→"v2"; title unchanged
const merged = mergeFields(local, remote, base);
// => title: local changed, remote didn't → keep local "Final"
// => body: remote changed, local didn't → take remote "v2"
console.log(merged);
// => Output: { id: 1, title: 'Final', body: 'v2' }
```

**Key Takeaway**: Three-way merging compares local, remote, and base to keep non-conflicting edits from both sides; fall back to LWW only for fields truly in conflict.

**Why It Matters**: Whole-record LWW loses work when two users edit different fields of the same document. Field-level merging preserves both edits as long as they don't touch the same field. Storing the "base" version (the common ancestor) costs double the storage per record but unlocks much richer collaboration. This is the building block for Google-Docs-style simultaneous editing over IndexedDB + sync.

---

### Example 65: Using CRDTs for Automatic Merging

Conflict-free replicated data types (CRDTs) merge deterministically without conflict resolution logic. Libraries like Yjs persist state trees directly in IndexedDB.

```javascript
import * as Y from "yjs";
// => Y is the Yjs CRDT library — provides shared data types (Map, Array, Text)
import { IndexeddbPersistence } from "y-indexeddb";
// => IndexeddbPersistence auto-saves and auto-loads Yjs state from IndexedDB

// => Create a Yjs document (the CRDT)
const ydoc = new Y.Doc();
// => ydoc is the root of the shared document — a container for typed state
// => Shared Map type inside the doc
const todos = ydoc.getMap("todos");
// => getMap("todos") returns the shared YMap named "todos"
// => All peers using this name on the same doc share this map

// => Persist the doc to IndexedDB automatically
const persistence = new IndexeddbPersistence("todos-doc", ydoc);
// => Opens "todos-doc" database, sets up listeners
// => Loads existing Yjs state from IDB and pushes future changes back

// => Wait for existing data to load from IDB
await persistence.whenSynced;
// => whenSynced resolves once the full document state is restored from IDB
// => After this point, todos reflects all previously stored changes

// => Make changes — CRDT tracks them as delta-encoded operations
todos.set("task-1", { title: "Buy bread", done: false });
// => YMap.set() records this as a CRDT operation with a logical clock
todos.set("task-2", { title: "Read book", done: true });
// => Second set — also recorded as a delta operation

// => Another device/tab editing concurrently?
// => Their edits and ours merge deterministically via CRDT rules
// => Regardless of order received, all peers converge to same state
// => No "last writer wins" needed — CRDTs are always mergeable

const count = todos.size;
// => todos.size is the number of entries in the shared YMap
console.log("Todos:", count);
// => Output: Todos: 2
```

**Key Takeaway**: CRDTs like Yjs persist to IndexedDB and merge concurrent edits from multiple peers deterministically — no conflict resolution code required.

**Why It Matters**: CRDTs are the gold standard for real-time collaborative apps. They guarantee eventual consistency across peers without a central coordinator and handle offline edits trivially. Yjs + y-indexeddb gives you a document model that persists locally, syncs over any transport (WebSocket, WebRTC), and resolves conflicts by mathematical guarantee. This replaces hundreds of lines of custom merge logic — at the cost of learning the CRDT model and paying its encoding overhead.

---

## Group 3: Performance Deep Dive

### Example 66: Minimizing Transaction Scope

Keep transactions narrow in both stores and duration. Broad scope blocks other readers/writers and wastes browser bookkeeping.

```javascript
// => ANTI-PATTERN: broad scope even though most stores aren't touched
async function badVersion(db, id) {
  const tx = db.transaction(["users", "posts", "comments", "likes"], "readwrite");
  // => All 4 stores locked for readwrite
  // => Any concurrent tx touching posts, comments, or likes must WAIT
  const user = await tx.objectStore("users").get(id);
  // => Only "users" is actually read — other stores locked for nothing
  await tx.done;
  return user;
}

// => BETTER: scope exactly what you need
async function goodVersion(db, id) {
  const tx = db.transaction("users", "readonly");
  // => One store, readonly — can run concurrently with other reads
  // => Readonly txs on the same store can overlap with each other
  const user = await tx.objectStore("users").get(id);
  // => Same read, but transaction lifecycle is minimal
  await tx.done;
  return user;
}

// => Multiple readonly transactions can run in parallel
const [u1, u2, u3] = await Promise.all([
  goodVersion(db, 1),
  // => Transaction 1 — readonly, "users" only
  goodVersion(db, 2),
  // => Transaction 2 — concurrent with Transaction 1
  goodVersion(db, 3),
  // => Transaction 3 — all three run simultaneously
]);
// => All three execute concurrently
// => IDB allows overlapping readonly txs on the same store
```

**Key Takeaway**: Scope transactions to the minimum set of stores and the narrowest mode — `readonly` when possible, one store when possible.

**Why It Matters**: Broad-scope readwrite transactions serialize every other transaction touching the same stores. On a busy page (live dashboard, multiple open components), this serialization becomes the performance bottleneck even though per-operation costs look fine. Profiling IndexedDB-heavy apps reveals that fixing transaction scope often yields more speedup than any other optimization.

---

### Example 67: Batching Writes in a Single Transaction

Instead of opening a transaction per write, batch related writes into one transaction. Dramatically reduces overhead.

```javascript
// => ANTI-PATTERN: 1000 transactions for 1000 writes
async function slowInsert(db, records) {
  for (const r of records) {
    await db.put("items", r);
    // => Each .put creates its own implicit transaction
    // => = 1000 transaction open/close cycles — expensive
  }
}

// => BETTER: 1 transaction for 1000 writes
async function fastInsert(db, records) {
  await db.transaction("rw", db.items, async () => {
    // => Open one tx; all writes inside share it
    // => Lock acquired once; all 1000 writes share that lock
    for (const r of records) {
      await db.items.put(r);
      // => Each write returns quickly; tx commits once at end
      // => Faster than slowInsert even with await per record
    }
  });
  // => One transaction commit for all records — 1 disk fsync
}

// => BEST: bulkPut (if Dexie) or idb's sync request issuance
// => See Example 60 for bulkPut
// => bulkPut fires all requests without awaiting each — true pipelining
```

**Key Takeaway**: One transaction for many related writes is 5-10x faster than per-write transactions — always batch.

**Why It Matters**: Transaction setup involves a round-trip to the browser's storage thread, lock acquisition, and bookkeeping. Amortizing that overhead across 100 writes instead of paying per write is free performance. This applies equally to raw API, `idb`, and Dexie. When ingesting lots of data (seed files, sync results, import), always wrap the loop in a single transaction.

---

### Example 68: Index Selectivity and Query Planning

Queries are only fast if the index returns few rows. High-cardinality (selective) indexes are ideal; low-cardinality indexes force full scans anyway.

```javascript
// => Two fields to index on — illustrating high vs low selectivity
const users = [
  { id: 1, status: "active", email: "a@x.com" },
  { id: 2, status: "active", email: "b@x.com" },
  { id: 3, status: "inactive", email: "c@x.com" },
  // => 10,000 more users, 95% status="active"
  // => status has very few distinct values — low cardinality
];

// => LOW selectivity: indexing "status" helps little
// => A query for status=active returns 9500 rows — nearly full scan
await db.users.where("status").equals("active").toArray();
// => Index lookup barely faster than full scan
// => Browser must still load and deserialize 9500 records

// => HIGH selectivity: indexing "email" (unique) helps hugely
// => Query for a specific email returns exactly 1 row
await db.users.where("email").equals("a@x.com").first();
// => Constant-time lookup; index is ideal here
// => B-tree lookup returns one record regardless of total store size

// => Compound index boosts selectivity of low-cardinality fields
// => Example: "status + createdAt" — even with common status, narrow time range selective
await db.users
  .where("[status+createdAt]")
  .between(
    ["active", last24h],
    // => Lower bound: active users from 24h ago
    ["active", now],
    // => Upper bound: active users up to now
  )
  .toArray();
// => Range lookup on date restricts to recent active users
// => Compound key [status+createdAt] narrows far more than status alone
```

**Key Takeaway**: Index selectivity (distinct values / total rows) drives speed — index high-cardinality fields directly; combine low-cardinality fields into compound indexes.

**Why It Matters**: Teams often "index everything" and are surprised when queries are slow. Indexes have cost (storage, slower writes) and benefit (fast lookups), and that trade-off is only worth it when the index actually narrows results. Measuring selectivity (`COUNT DISTINCT / COUNT *`) guides the decision. Compound indexes rescue low-selectivity single fields by pairing them with selective ones.

---

### Example 69: Avoiding Large Value Deserialization

If you store large values (Blobs, big arrays) but often only need small metadata, split into two stores — one for metadata, one for payloads.

```javascript
import Dexie from "dexie";
// => Dexie ORM — used here for clean multi-store tx syntax
const db = new Dexie("SplitStorage");
// => "SplitStorage" is the IDB database name
db.version(1).stores({
  // => Metadata store — small, fast to enumerate
  files_meta: "id, name, size, createdAt",
  // => id is primary key (string UUID); name, size, createdAt indexed
  // => Payload store — large, only loaded when needed
  files_blob: "id",
  // => id is primary key; blob not indexed — just stored
});

async function saveFile(file) {
  // => file is a File or Blob object from a file input
  const id = crypto.randomUUID();
  // => Generate a unique ID to link meta and blob records
  await db.transaction("rw", db.files_meta, db.files_blob, async () => {
    // => Both stores in one transaction — atomically save meta + blob
    // => Two inserts, one transaction
    await db.files_meta.add({
      id,
      // => Same UUID in both stores — joins them logically
      name: file.name,
      // => Original filename for display
      size: file.size,
      // => Size in bytes — useful for quota checks
      createdAt: Date.now(),
      // => Timestamp for sorting and eviction decisions
    });
    await db.files_blob.add({ id, blob: file });
    // => Blob stored separately; loaded only on demand
    // => file (Blob/File) is serialized via structured clone
  });
  return id;
  // => Caller gets the UUID to reference this file later
}

// => List files without loading any Blobs
const metaList = await db.files_meta.toArray();
// => Only the metadata store is read — no Blob deserialization
console.log(metaList.length, "files (no payloads loaded)");
// => Even with thousands of 10 MB files, this is fast

// => Load one payload only when the user opens it
async function openFile(id) {
  const { blob } = await db.files_blob.get(id);
  // => Fetch the Blob by its UUID — triggers full deserialization
  return URL.createObjectURL(blob);
  // => Create an object URL for use in <img src> or <a href>
}
```

**Key Takeaway**: Split large payloads from queryable metadata into separate object stores — keep listing and searching fast while deferring payload loads.

**Why It Matters**: Loading 100 records with embedded 5 MB Blobs means 500 MB of memory — which crashes mobile browsers. Metadata/payload splitting is the classic fix: metadata is cheap to enumerate, and payloads load only on demand. This pattern appears in every production offline-capable app (email clients, note-takers, media libraries) because it scales linearly where embedding does not.

---

### Example 70: Avoiding Structured Clone Cost

Every `put` runs structured clone on the value — expensive for deeply nested objects. For hot paths, simplify the stored shape.

```javascript
// => Slow: deeply nested object with Maps, Sets, mixed types
const complex = {
  user: { id: 1, name: "Aisha" },
  // => Nested object — structured clone recurses into this
  tags: new Set(["blog", "tips"]),
  // => Set is cloneable but slower than plain array
  created: new Date(),
  // => Date is cloneable but slower than Number
  metadata: new Map([
    ["views", 42],
    // => Map entries are deeply cloned — expensive
    ["likes", 10],
  ]),
};
await db.items.put(complex);
// => Structured clone walks every nested field — ~5x overhead
// => Profiling shows Map/Set/Date serialization costs stack up quickly

// => Faster: flatten to plain object
const flat = {
  userId: 1,
  // => Scalar — fastest to clone
  userName: "Aisha",
  // => String scalar — no deep traversal
  tags: ["blog", "tips"],
  // => Plain array faster to clone than Set
  createdAt: Date.now(),
  // => Number faster to clone than Date
  views: 42,
  // => Scalar number — trivially cloned
  likes: 10,
};
await db.items.put(flat);
// => Faster write; slightly harder to use but queries are faster too
// => Trade-off: lose native Set/Map/Date in exchange for clone speed
```

**Key Takeaway**: Structured clone has per-field overhead — flatter, simpler object shapes write and read faster than deeply nested ones with `Set`/`Map`/`Date`.

**Why It Matters**: For most apps, the ergonomic value of nested types outweighs the speed cost. For hot-path writes (logging, analytics, bulk imports), the cost is measurable and cumulative. Profile first: if writes are slow and values are deeply nested, flattening can cut write time in half. Balance against the loss of native `Date`/`Set` semantics — often worth it at scale.

---

## Group 4: Security and Privacy

### Example 71: Origin Isolation

IndexedDB data is isolated per origin (protocol + host + port). Cross-origin scripts cannot read your database, but same-origin iframes can.

```javascript
// => At https://app.example.com/
await db.put("private", "secret", "user-token");
// => Stored in origin "https://app.example.com"
// => origin = scheme (https) + host (app.example.com) + port (443 implicit)

// => At https://other.example.com/ (different subdomain)
// => CANNOT read the data — different origin
// => Even with CORS, IndexedDB is origin-scoped not CORS-scoped
// => CORS enables cross-origin fetch — not cross-origin storage access

// => At https://app.example.com:8080/ (different port)
// => ALSO different origin; cannot read
// => Port 443 != port 8080 even with same host and scheme

// => Be careful with same-origin iframes:
// => <iframe src="/ad.html"> loaded from SAME origin can read everything
// => Same-origin iframe shares full IndexedDB access — no restrictions
// => Never embed untrusted code at the same origin
// => Use <iframe sandbox> or separate subdomain for user-supplied content
// => sandbox without allow-same-origin gives iframe a unique opaque origin
```

**Key Takeaway**: IndexedDB isolates by origin (scheme + host + port); same-origin contexts share data fully, so never co-host untrusted code.

**Why It Matters**: The same-origin model is both the strongest security boundary and the largest footgun. If you host user-generated content at your main domain, any malicious content can read your entire IndexedDB. Best practice: serve user content from a sandbox subdomain or `<iframe sandbox>` without `allow-same-origin`. For static assets, origin isolation is fine; for dynamic user HTML, never.

---

### Example 72: Encrypting Sensitive Data at Rest

IndexedDB stores data unencrypted on disk. For truly sensitive material, encrypt before writing using Web Crypto API.

```javascript
// => Derive a key from a user passphrase
async function deriveKey(passphrase, salt) {
  // => Step 1: import raw passphrase bytes as PBKDF2 key material
  const material = await crypto.subtle.importKey(
    "raw",
    // => raw format — just the bytes, no key wrapping
    new TextEncoder().encode(passphrase),
    // => Encode passphrase string to Uint8Array
    "PBKDF2",
    // => PBKDF2 algorithm — designed for key derivation from passwords
    false,
    // => extractable: false — key cannot be exported from the crypto subsystem
    ["deriveKey"],
    // => Usage: only allowed to derive keys from this material
  );
  // => Step 2: derive a 256-bit AES-GCM key via PBKDF2
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    // => 100k iterations makes brute-force expensive
    material,
    // => Base material from step 1
    { name: "AES-GCM", length: 256 },
    // => Derive a 256-bit AES-GCM key
    false,
    // => Non-extractable — cannot be read back from memory
    ["encrypt", "decrypt"],
    // => This key is allowed to encrypt and decrypt
  );
}

async function encryptAndStore(db, key, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  // => Random IV per record — required for AES-GCM
  // => Reusing an IV with the same key breaks AES-GCM security
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    // => Include the IV in the encryption params
    key,
    // => key is the CryptoKey from deriveKey()
    new TextEncoder().encode(plaintext),
    // => Encode plaintext string to Uint8Array for encryption
  );
  // => Store iv + ciphertext together; key stays in memory
  await db.secrets.put({ id: "token", iv, ciphertext });
  // => iv and ciphertext are ArrayBuffers — structured-clone compatible
}

async function loadAndDecrypt(db, key) {
  const record = await db.secrets.get("token");
  // => Retrieve the stored { id, iv, ciphertext } record
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: record.iv },
    // => Must use the same IV that was used during encryption
    key,
    // => key must be the same CryptoKey derived from the same passphrase
    record.ciphertext,
    // => The encrypted bytes stored in IDB
  );
  return new TextDecoder().decode(decrypted);
  // => Decode the decrypted ArrayBuffer back to a string
}
```

**Key Takeaway**: Encrypt sensitive values with Web Crypto before storing in IndexedDB; a random IV per record is mandatory for AES-GCM correctness.

**Why It Matters**: IndexedDB data on disk is readable by anyone with filesystem access — malware, other users on the machine, forensic tools. Encryption at rest turns a stolen laptop into a non-event for your app's data. Derive keys from user passphrases (never store them) and consider re-prompting on resume. Combine with persistent storage to resist eviction and with origin isolation to resist in-browser attacks.

---

### Example 73: Clearing Data on Logout

On logout, delete the relevant databases explicitly. Default browser clearing is not triggered; your app must opt-in.

```javascript
// => logout() removes all user-specific IndexedDB data
async function logout() {
  // => Close any open connections first — deleteDatabase is blocked otherwise
  if (window._appDB) {
    // => _appDB is the global handle stored on app init
    window._appDB.close();
    // => Closing the connection allows deleteDatabase to proceed
    window._appDB = null;
    // => Clear the reference so subsequent code doesn't use a closed DB
  }

  // => Delete every user-specific DB
  const dbsToDelete = ["user-profile", "user-cache", "user-history"];
  // => List all DBs that contain user data — update this list when adding new DBs
  for (const name of dbsToDelete) {
    // => Wrap in Promise because deleteDatabase uses legacy event model
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(name);
      // => deleteDatabase() returns an IDBOpenDBRequest
      req.onsuccess = resolve;
      // => DB was deleted — continue to next one
      req.onblocked = () => {
        // => Other tab has it open — we can't delete until they close
        alert("Close other tabs to complete logout.");
        // => Block notifies us but doesn't reject — deletion will complete when tabs close
      };
      req.onerror = resolve;
      // => Resolve on error too so logout doesn't hang
      // => Error typically means DB didn't exist — safe to ignore
    });
  }

  // => Redirect to login page
  location.href = "/login";
  // => Hard navigation clears all in-memory state
}
```

**Key Takeaway**: Explicitly `deleteDatabase` on logout and handle the `onblocked` event for other open tabs; the browser will not clear your data automatically.

**Why It Matters**: Shared-computer scenarios (library, internet cafe, family laptop) make logout-clear mandatory. A user who logs out but whose IndexedDB data persists is a privacy failure. The `onblocked` handler is particularly important — without it, a second tab blocks the delete silently and the next user sees the previous user's data. Always handle blocked deletes with a clear user prompt.

---

## Group 5: Comparisons

### Example 74: IndexedDB vs LocalStorage

LocalStorage is synchronous, string-only, ~5 MB limit; IndexedDB is async, structured, multi-GB. Pick the right tool per use case.

```javascript
// => LocalStorage: synchronous, strings only, small
localStorage.setItem("theme", "dark");
// => setItem is synchronous — blocks main thread briefly
const theme = localStorage.getItem("theme");
// => getItem is also synchronous — returns null if key missing
// => theme is "dark"
// => Up to ~5 MB per origin; everything serialized to strings
// => Blocks main thread — avoid in hot paths
// => Also: no indexes, no transactions, no complex types

// => IndexedDB: async, rich types, huge
import { openDB } from "idb";
const db = await openDB("prefs", 1, {
  upgrade(db) {
    db.createObjectStore("kv");
    // => Simple key-value store — no keyPath (external key provided on put)
  },
});
await db.put("kv", { mode: "dark", font: 16 }, "ui");
// => Third arg is the external key "ui" — stored at kv["ui"]
// => Value is a typed object — no JSON.stringify needed
const prefs = await db.get("kv", "ui");
// => Retrieves { mode: "dark", font: 16 } as a typed object
// => prefs.mode === "dark", prefs.font === 16
// => Up to GBs, typed, non-blocking
// => Runs on background thread — does not block main thread at all

// => Simple rule:
// => Tiny strings (preferences, feature flags): LocalStorage is fine
// => Anything else: IndexedDB
// => If you hit a LocalStorage limit, migrate to IndexedDB (see Example 77)
```

**Key Takeaway**: LocalStorage for tiny synchronous key/value strings; IndexedDB for structured data, binary payloads, and anything beyond trivial size.

**Why It Matters**: LocalStorage has one remaining niche: simple, frequently-read, small string values (active theme, feature flags, session flags) where the synchronous API is convenient. For everything else, IndexedDB is strictly better — larger, typed, non-blocking, indexed. Developers sometimes over-use LocalStorage out of habit; reviewing the choice per feature often reveals better fits for IndexedDB.

---

### Example 75: IndexedDB vs Cache API

Cache API stores `Request`/`Response` pairs; IndexedDB stores arbitrary structured data. They are complementary, not competitors.

```javascript
// => Cache API: ideal for HTTP response caching
const cache = await caches.open("v1");
// => caches.open returns a named Cache object
// => Cache a fetch response
await cache.put("/api/logo.png", await fetch("/api/logo.png"));
// => cache.put stores the fetch Response under its Request key
// => Retrieve for offline use
const cached = await cache.match("/api/logo.png");
// => cache.match looks up a cached Response by URL
// => cached is a Response (not a Blob — can be piped or parsed)
// => Use cached.blob() or cached.arrayBuffer() to extract data

// => IndexedDB: ideal for structured app data
import { openDB } from "idb";
const db = await openDB("app", 1, {
  upgrade(db) {
    db.createObjectStore("todos", { keyPath: "id" });
    // => keyPath: "id" — records keyed by their .id property
  },
});
await db.put("todos", { id: 1, title: "Buy bread", done: false });
// => todos are queryable, indexable, structured
// => You can do where("done").equals(false) — impossible with Cache API

// => Use them TOGETHER in a service worker:
// => Cache API for static assets and API responses
// => IndexedDB for user-generated data and offline queue
// => Each handles what it's designed for — minimal overlap
```

**Key Takeaway**: Cache API handles Request/Response pairs efficiently; IndexedDB handles structured queryable data — modern PWAs use both.

**Why It Matters**: Trying to force IndexedDB to cache HTTP responses means serializing every response, losing streaming benefits, and reimplementing cache-control logic. Trying to force Cache API to hold structured app data means abusing Request/Response as a generic container. Using each for its intended purpose keeps both layers simple and efficient.

---

### Example 76: IndexedDB vs OPFS (Origin Private File System)

OPFS is a newer API optimized for large files with random read/write access — ideal for SQLite-in-browser, video editing buffers, and scratch data. IndexedDB remains best for structured records.

```javascript
// => IndexedDB: records with indexes
import { openDB } from "idb";
const db = await openDB("docs", 1, {
  upgrade(db) {
    db.createObjectStore("files", { keyPath: "name" });
    // => keyPath: "name" — files keyed by filename string
  },
});
await db.put("files", { name: "report.pdf", blob: myBlob });
// => Whole-Blob read/write; no random access
// => Reading this record deserializes the entire Blob into memory

// => OPFS: random-access files (like a real filesystem)
const root = await navigator.storage.getDirectory();
// => root is FileSystemDirectoryHandle for origin-private files
// => OPFS files are in a sandboxed filesystem — not accessible via DevTools File tab
const fileHandle = await root.getFileHandle("report.pdf", { create: true });
// => create: true creates the file if it doesn't exist
// => Acquire a writable stream
const writable = await fileHandle.createWritable();
// => createWritable() opens a write stream — similar to fs.createWriteStream in Node
await writable.write({ type: "write", position: 1024, data: chunk });
// => Write at offset 1024 — random access, no full-file rewrite
// => This is impossible with IndexedDB — it always rewrites the whole value
await writable.close();
// => Must close writable before reading or before the next write session

// => Simple rule:
// => Structured queryable records: IndexedDB
// => Large files with random access: OPFS
// => Many small records that read as a whole: IndexedDB
// => Memory-mapped database files (sql.js, DuckDB): OPFS
```

**Key Takeaway**: OPFS is a filesystem; IndexedDB is a database. Use OPFS when you need random-access file I/O (SQLite, media editing); use IndexedDB for queryable records.

**Why It Matters**: OPFS unlocks use cases IndexedDB cannot do well — running SQLite entirely in the browser via sql.js, video editors streaming gigabytes, and any app that wants to embed a full database format. IndexedDB remains the correct choice for object stores, indexes, and typical app data. Many modern PWAs use both: OPFS for a bundled SQLite and IndexedDB for user settings and sync queues.

---

### Example 77: Migrating from LocalStorage to IndexedDB

When an app outgrows LocalStorage, migrate existing data on first load. Detect, copy, then clear to free the 5 MB budget.

```javascript
import { openDB } from "idb";
// => idb wraps IndexedDB — used as the migration target

async function migrateFromLocalStorage() {
  // => Check for LocalStorage keys we want to migrate
  const keys = ["theme", "user-settings", "draft-1", "draft-2"];
  // => List all keys that should move to IndexedDB
  const present = keys.filter((k) => localStorage.getItem(k) !== null);
  // => present: only keys that actually exist in LocalStorage
  if (present.length === 0) return;
  // => Nothing to migrate; previous run already cleared them
  // => Idempotent: safe to call on every boot

  const db = await openDB("prefs", 1, {
    upgrade(db) {
      db.createObjectStore("settings");
      // => Simple kv store — external key, accepts any value type
    },
  });

  const tx = db.transaction("settings", "readwrite");
  // => One transaction for all migrated keys — atomic
  for (const key of present) {
    const raw = localStorage.getItem(key);
    // => raw is always a string — LocalStorage stores only strings
    try {
      const parsed = JSON.parse(raw);
      // => Attempt to restore original type via JSON.parse
      await tx.store.put(parsed, key);
      // => Store as typed value — object, number, array etc.
    } catch {
      // => Store raw string if it wasn't JSON
      await tx.store.put(raw, key);
      // => Fallback: store as the raw string
    }
  }
  await tx.done;
  // => All keys committed to IndexedDB atomically

  // => Only clear LocalStorage after successful migration
  for (const key of present) localStorage.removeItem(key);
  // => Remove each migrated key — prevents re-migration on next boot
  console.log("Migrated", present.length, "keys to IndexedDB");
  // => Output: Migrated N keys to IndexedDB
  db.close();
  // => Release connection after migration is done
}

// => Run on app boot
await migrateFromLocalStorage();
// => First boot: migrates; subsequent boots: no-ops (present.length === 0)
```

**Key Takeaway**: Migrate LocalStorage to IndexedDB on first load — copy first, clear only after successful commit, and guard with presence checks for idempotency.

**Why It Matters**: Hitting LocalStorage's ~5 MB limit is a common trigger for rewriting storage. Doing the migration gracefully preserves user data that otherwise would be lost. The idempotent copy-then-clear pattern handles partial failures: a crash mid-migration leaves LocalStorage intact, so the next boot retries. Once migrated, the app can scale to IndexedDB's multi-GB budget without rewrite.

---

## Group 6: Advanced Patterns

### Example 78: Change Data Capture for Analytics

Record every mutation into an analytics store, enabling playback, debugging, and offline event streams.

```javascript
import Dexie from "dexie";
// => Dexie's hook system enables CDC without modifying call sites

const db = new Dexie("App");
// => App database — has both domain data and change log
db.version(1).stores({
  items: "++id, name",
  // => Domain store — items being tracked
  // => Analytics store: append-only change log
  changes: "++seq, table, op, at",
  // => ++seq: auto-increment sequence number for ordering
  // => table, op, at: indexed — allows querying by table name, operation, or time
});

// => Use Dexie hooks to emit changes automatically
db.items.hook("creating", (pk, obj, tx) => {
  // => Fires before each insert — pk is the about-to-be-assigned key
  db.changes.add({ table: "items", op: "create", payload: obj, at: Date.now() });
  // => Log create event atomically with the insert
});
db.items.hook("updating", (mods, pk, obj, tx) => {
  // => mods: { fieldName: newValue } delta object; pk: primary key
  db.changes.add({ table: "items", op: "update", id: pk, mods, at: Date.now() });
  // => Log update event with the field-level diff
});
db.items.hook("deleting", (pk, obj, tx) => {
  // => obj: the record being deleted; pk: its primary key
  db.changes.add({ table: "items", op: "delete", id: pk, at: Date.now() });
  // => Log delete event with the key of the removed record
});

// => Normal operations now emit changes automatically
await db.items.add({ name: "Apple" });
// => Triggers "creating" hook → 1 change logged
await db.items.update(1, { name: "Banana" });
// => Triggers "updating" hook → 2 changes logged
await db.items.delete(1);
// => Triggers "deleting" hook → 3 changes logged

const log = await db.changes.toArray();
// => Retrieve all logged changes — can filter by table, op, or time range
console.log(log.length, "events captured");
// => Output: 3 events captured
```

**Key Takeaway**: Dexie hooks turn every write into a structured change event — enabling audit logs, analytics pipelines, and offline event streams without touching call sites.

**Why It Matters**: Change Data Capture (CDC) is a staple of server-side data engineering and equally valuable in the browser. With every mutation logged, you can replay state for debugging, measure feature use without additional instrumentation, sync changes upstream batched by timestamp, and recover from user mistakes with undo/redo. The hook-based implementation keeps business code oblivious — analytics becomes a cross-cutting concern, not a per-feature chore.

---

### Example 79: Background Sync with Service Workers

Combine IndexedDB with the Background Sync API so the service worker flushes queued writes even after the tab closes.

```javascript
// page.js — user queues changes
import { openDB } from "idb";
// => idb used in page context — service worker also imports it
const db = await openDB("sync", 1, {
  upgrade(db) {
    db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
    // => autoIncrement: true — each message gets a unique sequential id
  },
});

async function sendMessage(msg) {
  await db.add("outbox", { msg, createdAt: Date.now() });
  // => Persist first — survives tab close
  // => If the page closes before SW fires, the message stays in the outbox
  const reg = await navigator.serviceWorker.ready;
  // => Wait for SW to be active and controlling the page
  await reg.sync.register("flush-outbox");
  // => Tells the browser to wake the SW when online
  // => Browser may defer until next wifi connection — works even after tab closes
}

// service-worker.js — flushes queued writes
self.addEventListener("sync", (event) => {
  // => SW receives this event when browser determines it has connectivity
  if (event.tag === "flush-outbox") {
    // => Match the tag registered by reg.sync.register
    event.waitUntil(flushOutbox());
    // => Keeps SW alive until promise resolves
    // => If flushOutbox() rejects, browser will retry later
  }
});

async function flushOutbox() {
  const db = await openDB("sync", 1);
  // => Service worker opens its own connection to the same "sync" database
  const messages = await db.getAll("outbox");
  // => Load all pending messages
  for (const m of messages) {
    const resp = await fetch("/api/send", { method: "POST", body: m.msg });
    // => Send each message to the server
    if (resp.ok) await db.delete("outbox", m.id);
    // => Remove from queue on success; retry next sync otherwise
    // => If resp is not ok, message stays in outbox for next sync event
  }
  db.close();
  // => Release connection after flush is complete
}
```

**Key Takeaway**: Background Sync + IndexedDB flushes queued writes when the tab is closed — the canonical pattern for reliable "send later" UX.

**Why It Matters**: "Send later" semantics (posts, comments, file uploads) should not depend on the user keeping the tab open. Persisting to IndexedDB guarantees durability across sessions, and Background Sync tells the browser "wake me when you can reach the network, regardless of tab state." Together they deliver genuinely reliable offline-first behavior — a user hits send on the subway, closes the tab, and the message transmits when they reach WiFi an hour later.

---

### Example 80: Production-Ready Offline-First Stack

Combine everything: Dexie for ORM, liveQuery for reactive UI, Background Sync for resilient push, CRDT for merge-safe collaboration.

```javascript
import Dexie, { liveQuery } from "dexie";
// => Dexie: ORM and reactive queries
import * as Y from "yjs";
// => Yjs: CRDT document library for collaborative content
import { IndexeddbPersistence } from "y-indexeddb";
// => y-indexeddb: auto-persists Yjs state to IndexedDB

// => App DB for structured data
const db = new Dexie("ProdApp");
// => "ProdApp" is the IndexedDB database name
db.version(1).stores({
  users: "++id, email",
  // => users keyed by auto-increment id; email indexed
  posts: "++id, userId, createdAt",
  // => posts keyed by id; userId and createdAt indexed for queries
  outbox: "++id, kind, at",
  // => outbox for durable server-push queue; kind and at indexed
});

// => Separate Yjs doc for collaborative content
const ydoc = new Y.Doc();
// => ydoc is the CRDT document root
const notes = ydoc.getMap("notes");
// => notes is the shared YMap named "notes" inside ydoc
new IndexeddbPersistence("prod-app-notes", ydoc);
// => Persistence resumes on every load; no explicit sync code needed
// => Internally stores Yjs update ops in an IDB database named "prod-app-notes"

// => Reactive UI subscription
const activePosts$ = liveQuery(() => db.posts.orderBy("createdAt").reverse().limit(20).toArray());
// => Re-runs whenever posts store is written — UI always shows latest 20
// => Component subscribes in React/Svelte/Vue via framework bindings

// => Queue writes to outbox, register Background Sync
async function createPost(userId, body) {
  const id = await db.posts.add({
    userId,
    body,
    // => body is the post text
    createdAt: Date.now(),
    // => Timestamp used for orderBy and cleanup
    pending: true,
    // => pending: true until server confirms receipt
  });
  // => Local post appears instantly via liveQuery
  // => User sees it immediately even before server sync
  await db.outbox.add({ kind: "create-post", id, at: Date.now() });
  // => Queue for durable server push
  const reg = await navigator.serviceWorker.ready;
  // => Ensure SW is active before registering sync
  await reg.sync.register("flush");
  // => SW flushes outbox when online (code not shown)
  return id;
  // => Caller gets the local post id for optimistic UI updates
}

// => Quota monitoring
setInterval(async () => {
  const { usage, quota } = await navigator.storage.estimate();
  // => usage: bytes used; quota: browser-allowed max
  if (usage / quota > 0.85) {
    // => At 85% usage — evict old posts before hitting quota
    // => Trigger cleanup of old cached posts
    await db.posts
      .where("createdAt")
      .below(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .delete();
    // => Delete posts older than 90 days — reclaims storage
  }
}, 60_000);
// => Check quota every 60 seconds — keeps eviction proactive

console.log("Offline-first stack online");
// => Output: Offline-first stack online
```

**Key Takeaway**: A production offline-first stack layers Dexie (ORM), liveQuery (reactive UI), Yjs (CRDT collaboration), Background Sync (reliable push), and quota monitoring (health) — each piece solves a real problem and composes cleanly.

**Why It Matters**: This final example shows the end state every offline-capable app should aspire to. User actions are immediate (local-first writes, live-query UI), durable (IndexedDB persistence), eventually consistent (CRDT merge + server sync), and resilient (Background Sync on reconnect, quota-aware cleanup). Each layer is independently well-understood; together they produce experiences indistinguishable from native desktop apps — built entirely with standard web APIs.

---

## Summary

You have mastered advanced IndexedDB:

- **Dexie.js** with typed schemas, chainable queries, hooks, and bulk operations
- **liveQuery** for reactive UIs that update on every mutation
- **Sync patterns** including push queues, pull-with-cursor, LWW, field merge, and CRDTs
- **Performance tuning** with scope narrowing, write batching, index selectivity, payload splitting
- **Security** via origin isolation, at-rest encryption, and explicit logout-clear
- **API comparisons** with LocalStorage, Cache API, and OPFS
- **Change Data Capture** for audit trails and analytics
- **Background Sync** for resilient offline push
- **Production stacks** combining Dexie + liveQuery + Yjs + Background Sync

Congratulations — you now have 95% coverage of IndexedDB. The remaining 5% is deep browser-specific quirks and cutting-edge specifications (WebNN integration, Storage Buckets) best learned through direct experience with real production apps.
