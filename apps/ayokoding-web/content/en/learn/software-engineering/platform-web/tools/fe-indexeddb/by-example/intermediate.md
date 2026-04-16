---
title: "Intermediate"
weight: 10000002
date: 2026-04-15T00:00:00+07:00
draft: false
description: "Master IndexedDB production patterns through 27 annotated examples covering promise wrapping, the idb library, migrations, service workers, Blob storage, pagination, quotas, and backup"
tags: ["indexeddb", "browser-storage", "frontend", "web-api", "tutorial", "by-example", "intermediate"]
---

This intermediate tutorial covers production IndexedDB patterns through 27 heavily annotated examples. You will learn promise wrapping, schema migrations across multiple versions, concurrent write strategies, service-worker integration, Blob and File storage, cursor-based pagination, storage quotas, and backup/restore. The `idb` library (by Jake Archibald) is introduced as a thin promise wrapper where raw events become unwieldy. Each example maintains 1-2.25 comment lines per code line.

## Prerequisites

Before starting, complete the [Beginner tutorial](./beginner.md) to understand:

- Raw IndexedDB API (`indexedDB.open`, `IDBDatabase`, `IDBTransaction`)
- Object stores, indexes, transactions, and cursors
- Event-driven request/response model
- Structured clone storage and common errors

## Group 1: Promise Wrapping the Raw API

### Example 29: A Minimal Request-to-Promise Helper

Most IndexedDB pain comes from mixing event-driven calls with modern `async`/`await`. A single helper function that wraps any `IDBRequest` in a `Promise` removes that friction.

```javascript
// => Converts IDBRequest events into a Promise
function requestToPromise(request) {
  // => request is IDBRequest-like (has onsuccess/onerror)
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    // => Resolve with result once it's available
    request.onerror = () => reject(request.error);
    // => Reject with DOMException on failure
  });
}

// => Usage: wrap store.get in a promise
async function demo(db) {
  const tx = db.transaction("kv", "readonly");
  // => Get store handle
  const store = tx.objectStore("kv");
  // => Wrap the request — await returns the value directly
  const value = await requestToPromise(store.get("key1"));
  // => No nested callbacks; linear flow
  console.log("Got:", value);
  // => Output depends on stored data
}
```

**Key Takeaway**: A 5-line `requestToPromise` helper turns any single IndexedDB call into an awaitable expression, unlocking `async`/`await` throughout your code.

**Why It Matters**: Writing this helper once is the smallest possible investment that pays for itself instantly. Complex transaction logic becomes linear `async` functions, error handling uses try/catch, and composability with `Promise.all` becomes trivial. Many teams never reach for a wrapper library because this tiny helper plus careful transaction awareness covers 90% of their needs.

---

### Example 30: Promise-Wrapped Transaction Completion

Beyond per-request promises, you also need a promise for the whole transaction so you can `await` its commit. Combine the two helpers for clean code.

```javascript
// => Wrap request (per-operation)
const reqP = (r) =>
  // => r is any IDBRequest-like object with onsuccess/onerror
  new Promise((ok, err) => {
    r.onsuccess = () => ok(r.result);
    // => Resolve with the request's result value
    r.onerror = () => err(r.error);
    // => Reject with the DOMException on failure
  });

// => Wrap transaction completion (per-unit-of-work)
const txP = (tx) =>
  // => tx is IDBTransaction — resolves on commit, rejects on abort/error
  new Promise((ok, err) => {
    tx.oncomplete = () => ok();
    // => oncomplete fires after all requests commit
    tx.onerror = () => err(tx.error);
    // => Request error bubbles up to tx.error
    tx.onabort = () => err(tx.error || new Error("aborted"));
    // => Explicit aborts also count as failures
  });

// => Combined usage — clean async transaction
async function saveUser(db, user) {
  // => db is IDBDatabase; user is the object to persist
  const tx = db.transaction("users", "readwrite");
  // => Open readwrite transaction scoped to "users"
  const store = tx.objectStore("users");
  // => store is IDBObjectStore for "users" in this transaction
  // => Issue request and immediately await commit
  store.put(user);
  // => store.put returns IDBRequest; ignore it, let tx commit
  await txP(tx);
  // => Resolves once write is durable
  console.log("User saved");
  // => Output: User saved
}
```

**Key Takeaway**: Wrap transactions (not just requests) in promises; awaiting `oncomplete` guarantees the write is durable before your next line runs.

**Why It Matters**: Awaiting the request completes when the individual operation finishes, but the transaction may not have committed yet. Awaiting the transaction guarantees durability — essential before telling the user "saved" or before making a dependent network call. This distinction trips up many developers; always ask yourself "do I need the value, or do I need the commit?" and pick the right await.

---

### Example 31: Parallel Reads in One Transaction

Inside a single transaction, multiple requests proceed in parallel. `Promise.all` over wrapped requests expresses this natively and avoids sequential awaits.

```javascript
async function fetchMany(db, ids) {
  // => db is IDBDatabase; ids is an array of primary keys to fetch
  // => Open readonly transaction once
  const tx = db.transaction("items", "readonly");
  // => One transaction for all reads — amortizes lock/setup overhead
  const store = tx.objectStore("items");
  // => store is IDBObjectStore for "items" in this transaction

  // => Fire all reads in parallel (browser executes them concurrently)
  const promises = ids.map((id) => reqP(store.get(id)));
  // => reqP (from previous example) wraps each IDBRequest
  // => All requests are issued synchronously before any await

  // => Wait for all to resolve in parallel
  const values = await Promise.all(promises);
  // => values is array aligned with ids input
  // => Each element is the record for that id (or undefined)

  await txP(tx);
  // => Tx auto-commits once all requests done
  return values;
  // => Caller receives all fetched records in one array
}

// => Usage
const items = await fetchMany(db, [1, 2, 3, 4, 5]);
// => Opens one transaction, fires 5 reads, awaits all
console.log("Fetched", items.length, "items");
// => Output: Fetched 5 items
```

**Key Takeaway**: Issue multiple IndexedDB requests synchronously inside one transaction, then `Promise.all` them — the browser schedules them concurrently for you.

**Why It Matters**: Opening one transaction for five reads is dramatically faster than opening five transactions. Each transaction has setup/teardown overhead and acquires a lock; batching reduces that cost to a single overhead hit. `Promise.all` over wrapped requests expresses batched reads idiomatically without fighting the auto-commit rule — all requests are issued synchronously, then you await their results.

---

### Example 32: Why Not Core Features — Introducing the `idb` Library

Hand-written promise wrappers work, but repetitive wrapping for every store operation becomes noisy. The `idb` library (by Jake Archibald) provides a complete, tiny (≈1 KB) promise wrapper over the raw API.

**Install**:

```bash
npm install idb
```

**Why Not Core Features**: The raw API (used in Examples 29-31) remains fine for small apps. For medium-to-large apps where transaction management appears in dozens of files, `idb` removes boilerplate without hiding the underlying model — every raw concept (transactions, stores, cursors) maps 1:1 to an `idb` method. Reach for `idb` when your wrapper helpers grow beyond a few lines.

```javascript
// => Import the openDB helper
import { openDB } from "idb";
// => idb is a ~1 KB wrapper — no runtime dependencies beyond IndexedDB

// => Open database; upgrade callback receives IDBPDatabase (promise version)
const db = await openDB("tasks", 1, {
  // => upgrade runs inside a versionchange transaction (like onupgradeneeded)
  upgrade(db, oldVersion, newVersion, tx) {
    // => db is a promise-flavored wrapper around IDBDatabase
    // => oldVersion is the current stored version; newVersion is target
    db.createObjectStore("tasks", { keyPath: "id" });
    // => Synchronous API — no event handlers
    // => Store created; id property is the primary key
  },
});
// => db is IDBPDatabase (promise-wrapped IDBDatabase) ready for use

// => Direct read — no transaction ceremony for simple cases
const task = await db.get("tasks", 1);
// => idb creates an implicit readonly transaction
console.log(task);
// => Output: the task with id=1 (or undefined)
// => undefined if no record exists yet for id=1

// => Direct write — idb creates an implicit readwrite transaction
await db.put("tasks", { id: 1, title: "Buy bread", done: false });
// => Returns when the transaction commits
// => idb opens transaction, writes, commits — one await does all

// => For multi-step work, open an explicit transaction
const tx = db.transaction("tasks", "readwrite");
// => tx is IDBPTransaction — promise-wrapped IDBTransaction
await tx.store.put({ id: 2, title: "Study" });
// => tx.store is IDBPObjectStore for the first listed store
await tx.store.put({ id: 3, title: "Sleep" });
// => Both puts share the same transaction
await tx.done;
// => tx.done is a Promise that resolves on oncomplete
// => Awaiting tx.done guarantees both writes are durable

db.close();
// => Release the DB handle when done
```

**Key Takeaway**: The `idb` library wraps every raw IndexedDB method in promises with a tiny (~1 KB) footprint, keeping the mental model identical while eliminating boilerplate.

**Why It Matters**: `idb` is the de facto standard promise wrapper — used inside Google's Workbox, countless PWAs, and many framework adapters. Because its API mirrors the raw API closely, everything you learned in Beginner still applies; you just write `await db.get(...)` instead of wiring up `onsuccess`. From here onward, examples use `idb` when the raw API would make the code noisy, and return to raw when a subtle concept needs to be visible.

---

## Group 2: Schema Migrations

### Example 33: Version-by-Version Migration

When schema changes over time, the `upgrade` callback must handle every intermediate version. A `switch` on `oldVersion` with fall-through produces idempotent, ordered migrations.

```mermaid
graph LR
  A["v0<br/>(new install)"] --> B["v1<br/>users store"]
  B --> C["v2<br/>+ email index"]
  C --> D["v3<br/>+ posts store"]

  style A fill:#CC78BC,stroke:#000000,stroke-width:2px,color:#fff
  style B fill:#0173B2,stroke:#000000,stroke-width:2px,color:#fff
  style C fill:#DE8F05,stroke:#000000,stroke-width:2px,color:#fff
  style D fill:#029E73,stroke:#000000,stroke-width:2px,color:#fff
```

```javascript
import { openDB } from "idb";
// => Using idb for cleaner syntax; migration logic is the same as raw API

// => Current schema is at version 3
const db = await openDB("app", 3, {
  upgrade(db, oldVersion, newVersion, tx) {
    // => switch without break: fall through all versions from oldVersion+1
    // => oldVersion is stored version (0 = new install); newVersion is 3
    switch (oldVersion) {
      case 0: {
        // => Fresh install — create initial store
        const users = db.createObjectStore("users", { keyPath: "id" });
        // => users store created at v1; data persists through all upgrades
        // => (fall through to case 1)
      }
      // falls through
      case 1: {
        // => Add email index introduced in v2
        const users = tx.objectStore("users");
        // => During upgrade, use tx.objectStore (not db.transaction)
        // => tx is the versionchange transaction — already in progress
        users.createIndex("by_email", "email");
        // => Index added to existing store; prior records are auto-indexed
        // => (fall through to case 2)
      }
      // falls through
      case 2: {
        // => Add posts store introduced in v3
        db.createObjectStore("posts", { keyPath: "id" });
        // => No fall-through needed for last case
        // => v3 schema: users + by_email index + posts store
      }
    }
  },
});
// => Every user — fresh, v1, or v2 — ends up with the same v3 schema
db.close();
// => Close the connection when done
```

**Key Takeaway**: Use a fall-through `switch(oldVersion)` so every migration step runs exactly once regardless of which version the user is currently on.

**Why It Matters**: Long-lived apps accumulate schema changes across releases. Some users visit weekly and get every version; others return after months and skip several versions. The fall-through pattern handles both uniformly — the browser starts your upgrade at whatever version it has stored and walks forward until it reaches the target. Missing a `break` that you wanted, or writing a migration that assumes a specific start version, are the two classic migration bugs this pattern avoids.

---

### Example 34: Data Migration Inside `upgrade`

When a migration must transform existing data (not just schema), open a cursor inside the `upgrade` callback and mutate records in place.

```javascript
import { openDB } from "idb";
// => idb for cleaner async syntax; raw cursor API works identically

const db = await openDB("customers", 2, {
  upgrade(db, oldVersion, newVersion, tx) {
    // => oldVersion is the stored version; newVersion is 2
    if (oldVersion < 1) {
      // => Fresh install: create initial store
      db.createObjectStore("customers", { keyPath: "id" });
      // => "customers" store created with inline "id" key
    }
    if (oldVersion < 2) {
      // => v2 splits full_name into first_name and last_name
      const store = tx.objectStore("customers");
      // => Reuse the versionchange transaction — cannot open new ones during upgrade
      // => Open cursor inside the upgrade transaction
      const cursorReq = store.openCursor();
      // => Returns IDBRequest; addEventListener("success") or onsuccess both work
      cursorReq.addEventListener("success", (e) => {
        // => Fires per record during the migration
        const cursor = e.target.result;
        // => cursor is IDBCursorWithValue or null when done
        if (cursor) {
          const value = cursor.value;
          // => value is the current record object
          // => Parse legacy full_name field
          const parts = (value.full_name || "").split(" ");
          // => Split by first space: ["First", "Last..."]
          value.first_name = parts[0] || "";
          // => Preserve empty string if no name at all
          value.last_name = parts.slice(1).join(" ");
          // => Remainder after first word becomes last_name
          // => Drop the old field to save space
          delete value.full_name;
          // => full_name removed; replaced by first_name + last_name
          // => Write transformed value back at the same key
          cursor.update(value);
          // => Atomic in-place update within the versionchange tx
          cursor.continue();
          // => Advance to next record
        }
      });
    }
  },
});
// => After upgrade, every customer record has new fields
db.close();
// => Schema migration complete; connection closed
```

**Key Takeaway**: Cursor-based transforms inside `upgrade` migrate existing records in place; the upgrade transaction is long-lived enough to walk the entire store.

**Why It Matters**: Unlike regular transactions, the versionchange transaction is specifically designed to be long-running — it holds a lock on the entire database and cannot be auto-committed mid-migration. This makes it safe to walk massive stores record-by-record. Keep migrations deterministic: if the same record is reshaped twice, the second run should be a no-op. Check for the old field's presence before transforming.

---

### Example 35: Deleting Stores and Indexes During Upgrade

`deleteObjectStore` and `deleteIndex` permanently remove schema elements. Useful for dropping features, renaming, or cleaning up after migrations.

```javascript
import { openDB } from "idb";
// => Using idb; same deleteObjectStore/deleteIndex methods as raw API

const db = await openDB("cleanup", 5, {
  upgrade(db, oldVersion) {
    // => oldVersion is the stored version; target is 5
    // => Pretend earlier versions created these
    if (oldVersion < 4) {
      // => Only delete if user is upgrading from before v4
      // => Legacy "temp_cache" store no longer needed at v5
      if (db.objectStoreNames.contains("temp_cache")) {
        // => Guard: check existence before deleting (idempotent)
        db.deleteObjectStore("temp_cache");
        // => Data is gone forever — deletion is irreversible
        // => All records and indexes in "temp_cache" are removed
      }
    }
    if (oldVersion < 5) {
      // => Only drop index when upgrading from before v5
      // => Drop an obsolete index without dropping the whole store
      const store = db.transaction.objectStore("orders");
      // => Access "orders" via the versionchange tx (not db.transaction)
      if (store.indexNames.contains("by_legacy_code")) {
        // => Guard: check existence before deleting (idempotent)
        store.deleteIndex("by_legacy_code");
        // => Records still present; only the index is removed
        // => Store data is unaffected; just the lookup structure is gone
      }
    }
  },
});
db.close();
// => All schema cleanup complete; connection closed
```

**Key Takeaway**: Use `deleteObjectStore` and `deleteIndex` inside `upgrade` to drop obsolete schema elements; always check for existence first to keep migrations idempotent.

**Why It Matters**: Schemas grow over time, and removing unused stores or indexes reduces storage overhead and migration complexity for future versions. The existence check protects against re-running a migration after a user cleared their data and re-installed. Combine with `oldVersion` guards so you never delete a store that a user needs at their current version.

---

## Group 3: Concurrent Writes and Consistency

### Example 36: Serializing Writes Across Unrelated Calls

When multiple code paths might write the same record, serialize them through a shared queue to prevent lost updates. The queue ensures at most one transaction is open at a time.

```javascript
// => Global write queue (one per DB connection)
let writeQueue = Promise.resolve();
// => Start as a resolved promise — first write proceeds immediately

async function queuedWrite(fn) {
  // => Chain fn onto the queue; return its result
  const next = writeQueue.then(() => fn());
  // => Ignore fn's error in queue chain — subsequent writes still proceed
  // => next is a Promise that resolves when fn() completes
  writeQueue = next.catch(() => {});
  // => Update queue tail to the settled version of next
  // => catch swallows fn errors so the queue keeps draining
  return next;
  // => Caller awaits this to get fn's return value or error
}

// => Usage: two concurrent writes that would otherwise race
async function increment(db, key) {
  // => db is IDBDatabase; key is the counter name
  const tx = db.transaction("counters", "readwrite");
  // => Readwrite tx needed for read-modify-write
  const store = tx.objectStore("counters");
  // => store is IDBObjectStore for "counters"
  const current = (await reqP(store.get(key))) || { id: key, count: 0 };
  // => Fetch existing counter or start at 0 if not found
  current.count += 1;
  // => Increment the counter value in memory
  // => Read-modify-write cycle
  store.put(current);
  // => Write the incremented counter back
  await txP(tx);
  // => Wait for the transaction to commit before resolving
}

// => These two calls would race if not queued
await Promise.all([
  queuedWrite(() => increment(db, "hits")),
  // => First increment queued — runs immediately
  queuedWrite(() => increment(db, "hits")),
  // => Second increment queued — waits for first to finish
]);
// => Queue ensures they run sequentially; final count is 2 (not 1)
console.log("Done");
// => Output: Done
```

**Key Takeaway**: Serialize read-modify-write operations through a shared promise queue to prevent race conditions IndexedDB transactions cannot prevent by themselves.

**Why It Matters**: IndexedDB transactions are ACID within their scope, but a read-modify-write pattern spans two transactions if you read first to decide what to write. The queue pattern gives you application-level serialization without upgrading to a `readwrite` transaction for every read. Use it for counters, atomic appends, and any case where you read from one transaction and write from another based on that read.

---

### Example 37: Optimistic Concurrency with Version Fields

Attach a `version` number to each record; on update, check it matches the version you read. If not, another writer changed the record — retry.

```javascript
async function updateWithRetry(db, id, mutator) {
  // => db is IDBDatabase; id is record key; mutator transforms the record
  for (let attempt = 0; attempt < 5; attempt++) {
    // => Up to 5 retries on conflict; throw after exhausting
    // => Read current state and its version
    const txR = db.transaction("docs", "readonly");
    // => Readonly tx to read current state
    const current = await reqP(txR.objectStore("docs").get(id));
    // => current is the record with its current version number
    await txP(txR);
    // => Wait for readonly tx to complete before proceeding

    // => Build updated record with incremented version
    const updated = mutator(current);
    // => mutator is a user-supplied transform function
    updated.version = current.version + 1;
    // => Increment version to signal this record changed

    // => Attempt write, but only if version hasn't changed
    const txW = db.transaction("docs", "readwrite");
    // => Readwrite tx to check-and-write atomically
    const store = txW.objectStore("docs");
    // => store is IDBObjectStore for "docs" in the write tx
    const latest = await reqP(store.get(id));
    // => Re-read inside the write tx to detect concurrent changes
    if (latest.version !== current.version) {
      // => Another writer won — abort and retry
      txW.abort();
      // => Discard this attempt's transaction
      continue;
      // => Loop back and start fresh with a new read
    }
    // => Version still matches — our update is safe
    store.put(updated);
    // => Write the updated record with the new version
    await txP(txW);
    // => Wait for write tx to commit
    // => Success
    return updated;
    // => Return the committed update
  }
  throw new Error("Too many conflicts");
  // => Five consecutive conflicts indicate a pathological race
}

// => Usage
const result = await updateWithRetry(db, "doc1", (d) => ({
  ...d,
  // => Spread existing fields and override title
  title: "New",
}));
console.log("Saved v" + result.version);
// => Output: Saved v2 (or higher after retries)
```

**Key Takeaway**: An explicit `version` field on each record lets you detect concurrent modifications across transactions and retry with fresh data.

**Why It Matters**: Optimistic concurrency is the standard pattern for last-writer-wins-avoidance in multi-tab apps and offline-first sync. Instead of locking records (which IndexedDB doesn't support across transactions), you version them and check at commit time. This scales naturally to distributed sync: the same version numbers that resolve local tab conflicts also let a server detect which writes are newer.

---

## Group 4: Service Workers and Background Context

### Example 38: IndexedDB Inside a Service Worker

Service workers can read and write IndexedDB, enabling background sync, push notification persistence, and offline caching. The API is identical — only the global context changes.

```javascript
// service-worker.js
// => Imports can't be top-level in classic service workers; use importScripts
importScripts("https://unpkg.com/idb@8/build/umd.js");
// => Loads idb as a UMD module; available as window.idb in SW scope

self.addEventListener("fetch", (event) => {
  // => Intercept every fetch request in this SW's scope
  event.respondWith(
    (async () => {
      // => Open DB from service worker scope
      const db = await idb.openDB("cache", 1, {
        upgrade(db) {
          // => Create response cache store keyed by URL
          db.createObjectStore("responses", { keyPath: "url" });
          // => url is both the key and the store's keyPath
        },
      });
      const url = event.request.url;
      // => Full URL of the intercepted request

      // => Try cache first
      const cached = await db.get("responses", url);
      // => Look up stored response by URL key
      if (cached) {
        // => Return stored Response body
        return new Response(cached.body, { headers: cached.headers });
        // => Reconstructed Response from stored body + headers
      }

      // => Network fallback
      const resp = await fetch(event.request);
      // => Forward to network when not in cache
      const body = await resp.clone().text();
      // => Clone before reading — original resp still usable for return
      // => Persist for next time
      await db.put("responses", {
        url,
        body,
        // => headers serialized as plain object (Headers is not cloneable)
        headers: Object.fromEntries(resp.headers),
      });
      return resp;
      // => Return the original network response to the page
    })(),
  );
});
```

**Key Takeaway**: Service workers have full IndexedDB access with identical API; use it for persistent cache, background sync state, and offline-ready data.

**Why It Matters**: Service workers are the foundation of every PWA's offline capability. Because they share the same origin database as the page, you can write from the page and read from the service worker (or vice versa) without serialization. This enables powerful patterns: the page writes a "pending upload" record, the service worker watches for connectivity and flushes it, the page then reads the result — all through IndexedDB. Browser/tab separation is invisible to your data layer.

---

### Example 39: Broadcasting Database Changes Across Tabs

When one tab writes, others need to know. `BroadcastChannel` complements IndexedDB by delivering change notifications to every same-origin context.

```javascript
// => Create named channel (shared across tabs for this origin)
const channel = new BroadcastChannel("db-updates");
// => All tabs/SWs with same name and origin share this channel

async function addTodo(db, todo) {
  // => db is IDBDatabase (idb-wrapped); todo is the new record
  // => Write to IndexedDB normally
  await db.put("todos", todo);
  // => Write is committed; now notify other tabs
  // => Notify all other tabs/service workers
  channel.postMessage({ type: "todo-added", id: todo.id });
  // => postMessage is fire-and-forget; no await needed
  // => Other tabs receive this message asynchronously
}

// => In another tab, listen for updates
channel.addEventListener("message", async (event) => {
  // => event.data is the object passed to postMessage
  if (event.data.type === "todo-added") {
    // => Re-read the fresh record from our own DB connection
    const fresh = await db.get("todos", event.data.id);
    // => Reading from our own DB handle — reflects the committed write
    // => Update local UI state
    render(fresh);
    // => render() refreshes the UI with the new todo
  }
});
```

**Key Takeaway**: Pair IndexedDB writes with `BroadcastChannel` messages so other tabs can react to changes without polling.

**Why It Matters**: IndexedDB does not have built-in change notifications — your tab sees its own writes, but other open tabs hold their own DB handles with potentially stale reads. `BroadcastChannel` is the standard pairing: write to disk, broadcast a pointer. Listeners re-read on receipt, keeping every tab in sync. For small apps this replaces a custom pub/sub layer entirely.

---

## Group 5: Binary Data

### Example 40: Storing Blobs Directly

IndexedDB stores `Blob` and `File` objects natively via structured clone — no base64 encoding needed. This is crucial for image caches, downloaded attachments, and offline media.

```javascript
import { openDB } from "idb";
// => Using idb for cleaner async syntax

const db = await openDB("media", 1, {
  upgrade(db) {
    // => Schema: "files" store keyed by filename
    db.createObjectStore("files", { keyPath: "name" });
    // => name is the primary key — filename string
  },
});
// => db is IDBPDatabase ready for Blob storage

// => Fetch an image as Blob
const resp = await fetch("/logo.png");
// => HTTP GET to fetch the image
const blob = await resp.blob();
// => blob is Blob with type "image/png"
// => Blob is a binary container — no text encoding needed

// => Store Blob directly — no serialization
await db.put("files", {
  name: "logo.png",
  blob,
  // => Blob stored natively via structured clone
  size: blob.size,
  // => size in bytes for metadata queries
});
// => Browser writes binary data efficiently

// => Read back — still a Blob
const record = await db.get("files", "logo.png");
// => Retrieve the stored file record by name key
console.log(record.blob instanceof Blob);
// => Output: true
// => Blob survived round-trip — no base64 decoding needed

// => Create an object URL to display the image
const url = URL.createObjectURL(record.blob);
// => url is a blob: URL usable in <img src>
document.querySelector("img#logo").src = url;
// => Image displayed directly from IndexedDB without network
// => Remember to URL.revokeObjectURL(url) when done
db.close();
// => Close the DB handle when done
```

**Key Takeaway**: Store `Blob` and `File` objects directly in IndexedDB — no base64 overhead, no decoding on read.

**Why It Matters**: For offline-first apps handling user-uploaded files or cached media, direct Blob storage is essential. Base64 encoding (historically required for LocalStorage) inflates data by 33% and requires expensive decoding to display. IndexedDB's structured clone keeps binary in its native form, so a 10 MB image is 10 MB on disk and instantly usable with `URL.createObjectURL`.

---

### Example 41: Storing File Uploads for Retry

Keep user-uploaded files in IndexedDB until a successful server upload. Works through network outages and page reloads.

```javascript
import { openDB } from "idb";
// => Using idb for concise async API

const db = await openDB("uploads", 1, {
  upgrade(db) {
    // => Schema: pending uploads store with auto-generated ids
    db.createObjectStore("pending", { keyPath: "id", autoIncrement: true });
    // => autoIncrement generates sequential ids; keyPath writes id into the record
  },
});
// => db is IDBPDatabase ready for file queuing

// => On user file selection, persist immediately
async function queueUpload(file) {
  // => file is a File object from <input type="file"> or drag-and-drop
  // => Store File object (which extends Blob) with metadata
  const id = await db.add("pending", {
    file,
    // => File object stored natively — no base64 encoding
    name: file.name,
    // => Original filename for FormData reconstruction
    type: file.type,
    // => MIME type for Content-Type header
    size: file.size,
    // => Size in bytes for progress tracking
    createdAt: Date.now(),
    // => Timestamp for retry ordering
  });
  console.log("Queued upload id", id);
  // => id is the auto-generated integer key
  // => Even if user closes tab now, file is safely stored
  return id;
  // => Return id so caller can track this upload
}

// => Flush queue when online
async function flush() {
  const pending = await db.getAll("pending");
  // => Load all pending uploads from the queue
  for (const record of pending) {
    // => Process uploads in insertion order
    try {
      const fd = new FormData();
      // => FormData for multipart file upload
      fd.append("file", record.file, record.name);
      // => Attach the stored File with its original name
      // => Send to server
      await fetch("/api/upload", { method: "POST", body: fd });
      // => Upload succeeded; remove from queue
      // => Remove from queue on success
      await db.delete("pending", record.id);
      // => Deletion by auto-generated id key
    } catch (err) {
      console.warn("Retry later:", err);
      // => Keep in queue — will retry next flush
      // => Break or continue — depends on whether ordering matters
    }
  }
}

window.addEventListener("online", flush);
// => Automatically flush when connectivity returns
// => Also call flush() on app boot to handle restarts mid-upload
```

**Key Takeaway**: Persist user files to IndexedDB before attempting network upload, then flush the queue on success or when connectivity returns.

**Why It Matters**: Mobile users face intermittent connectivity constantly. An upload that "succeeded" in-memory but failed to send disappears when the tab closes, losing user work. Persistent queues solve this: once the Blob is in IndexedDB, it survives offline periods, tab crashes, and reboots. Pair with the service worker's Background Sync API for automatic retry without the page open.

---

## Group 6: Pagination and Large Datasets

### Example 42: Cursor-Based Pagination

For large stores, load one page at a time. Remember the last key seen to resume where you stopped, avoiding offset-based pagination pitfalls.

```javascript
import { openDB } from "idb";
// => Using idb for async cursor API

async function getPage(db, startAfterKey, pageSize) {
  // => db is IDBPDatabase; startAfterKey is null for first page
  const tx = db.transaction("messages", "readonly");
  // => Readonly tx — pagination never writes
  const store = tx.objectStore("messages");
  // => store is IDBPObjectStore for "messages"

  // => Build range starting AFTER the last key we saw
  const range = startAfterKey ? IDBKeyRange.lowerBound(startAfterKey, true) : null;
  // => true makes the lower bound exclusive — don't re-include last key
  // => null range = start from the beginning (first page)

  const results = [];
  // => Accumulate up to pageSize records
  let cursor = await store.openCursor(range);
  // => idb returns null when done, or the cursor on match
  while (cursor && results.length < pageSize) {
    // => Collect up to pageSize records
    results.push(cursor.value);
    // => Each cursor.value is a full message record
    cursor = await cursor.continue();
    // => continue() returns a promise for the next cursor step (idb-specific)
    // => Returns null when range is exhausted
  }
  await tx.done;
  // => Wait for transaction to complete

  // => Return page + cursor for the next call
  return {
    items: results,
    // => items is the array of records for this page
    nextKey: results.length === pageSize ? results[results.length - 1].id : null,
    // => Null nextKey means no more data
    // => Non-null nextKey is the id to pass as startAfterKey next time
  };
}

// => Usage
let page = await getPage(db, null, 20);
// => First page, no startAfterKey
console.log("Page 1:", page.items.length);
// => Output: Page 1: 20 (or fewer if store has <20 records)
if (page.nextKey) {
  page = await getPage(db, page.nextKey, 20);
  // => Next page starting after the last id we saw
  console.log("Page 2:", page.items.length);
  // => Output: Page 2: up to 20 records
}
```

**Key Takeaway**: Cursor-based pagination uses the last key seen as a resume token — faster than offset pagination and immune to pages shifting when new records are inserted.

**Why It Matters**: Offset pagination (`skip N, take M`) is slow and fragile: each new record inserted at the top of the store shifts every page. Keyset pagination is the standard fix — you remember the last record's key and ask for everything strictly greater. IndexedDB's ranged cursors implement keyset pagination natively and efficiently, making it the right choice for any non-trivial list UI.

---

### Example 43: Streaming Large Results to a UI

Instead of loading all records before rendering, stream results into the DOM as the cursor yields them. Users see first results instantly.

```javascript
async function renderStream(db, container) {
  // => db is IDBPDatabase; container is a DOM element to append rows to
  container.textContent = "";
  // => Clear previous content before streaming new results
  // => Start cursor iteration
  const tx = db.transaction("messages", "readonly");
  // => Readonly tx for streaming — cursor never writes
  let cursor = await tx.objectStore("messages").openCursor();
  // => cursor is IDBPCursorWithValue or null when done (idb-specific)

  while (cursor) {
    // => Loop continues as long as cursor points to a record
    // => Append one row at a time as records arrive
    const row = document.createElement("div");
    // => Create DOM element for this message
    row.textContent = cursor.value.text;
    // => Set text from the current record
    container.appendChild(row);
    // => Appended immediately — user sees row before next record loads
    // => Browser can paint between iterations — no layout stall

    // => Yield occasionally to allow rendering
    if (cursor.value.id % 50 === 0) {
      // => Every 50 records, yield control to the browser
      await new Promise((r) => requestAnimationFrame(r));
      // => Break up long synchronous iteration
      // => requestAnimationFrame fires just before the next repaint
    }
    cursor = await cursor.continue();
    // => Advance to next record; returns null at end of store
  }
  await tx.done;
  // => Transaction completes after all records are processed
  console.log("Streaming complete");
  // => Output: Streaming complete
}
```

**Key Takeaway**: Render results as the cursor yields them instead of after `getAll()` completes — first paint happens immediately, even for very large datasets.

**Why It Matters**: Perceived performance matters more than total time. Loading 10,000 messages with `getAll()` before rendering shows a blank screen for a second or two; streaming the same data appends rows in real time and the user sees results almost instantly. Pair with virtual scrolling for massive lists and your app feels instant regardless of data size.

---

## Group 7: Quotas, Persistence, and Storage API

### Example 44: Estimating Storage Usage

`navigator.storage.estimate()` returns the current usage and quota. Use it to warn users before hitting limits or to trigger cleanup.

```javascript
// => Estimate returns { usage, quota } in bytes
const estimate = await navigator.storage.estimate();
// => usage: bytes currently used by this origin
// => quota: bytes available before QuotaExceededError
// => Both values are approximate — browsers may round or cap them

console.log(`Using ${(estimate.usage / 1_000_000).toFixed(1)} MB`);
// => Output: Using 3.2 MB (example)
// => Divide by 1_000_000 to convert bytes to megabytes
console.log(`Quota ${(estimate.quota / 1_000_000_000).toFixed(1)} GB`);
// => Output: Quota 12.5 GB (browser-dependent)
// => Chrome ~60% of free disk; Firefox ~10%; Safari ~1 GB

const ratio = estimate.usage / estimate.quota;
// => ratio is a decimal: 0.8 = 80% of quota used
if (ratio > 0.8) {
  // => Threshold at 80% — adjust based on your app's cleanup cost
  console.warn("Approaching quota — consider cleanup");
  // => Trigger cache eviction or prompt user
  // => At 0.85, begin eviction; at 0.95, prompt user
}
```

**Key Takeaway**: `navigator.storage.estimate()` returns `{ usage, quota }` so you can detect and react to low storage before `QuotaExceededError` strikes.

**Why It Matters**: Quotas vary wildly: Chrome gives ~60% of free disk space; Firefox gives ~10% of disk; Safari is ~1 GB per origin for non-PWA contexts. Running out of space mid-transaction aborts it and loses user work. Proactive monitoring — warning above 70%, evicting caches above 85%, prompting above 95% — keeps your app healthy across browsers. Storage estimation is cheap and should run on every app boot.

---

### Example 45: Requesting Persistent Storage

Persistent storage opts out of automatic eviction under storage pressure. Without it, browsers may clear IndexedDB data to free space.

```javascript
// => Request persistence — returns boolean indicating granted status
const granted = await navigator.storage.persist();
// => Some browsers prompt the user; others auto-grant based on engagement
// => Chrome auto-grants for installed PWAs and bookmarked origins

if (granted) {
  // => Storage is protected from automatic eviction
  console.log("Storage is persistent — immune to eviction");
  // => Output: Storage is persistent — immune to eviction
} else {
  // => Storage may be cleared when disk space is low
  console.log("Best-effort storage — may be cleared under pressure");
  // => Output: Best-effort storage — may be cleared under pressure
  // => Consider degraded-mode UI that warns users to backup data
}

// => Check status without requesting (no prompt)
const isPersisted = await navigator.storage.persisted();
// => Returns boolean without triggering any permission prompt
console.log("Currently persistent:", isPersisted);
// => Output: Currently persistent: true or false
// => Use this on boot to decide whether to show a "protect my data" button
```

**Key Takeaway**: Call `navigator.storage.persist()` to request protection from eviction; `navigator.storage.persisted()` checks the current state without prompting.

**Why It Matters**: For PWAs and offline-first apps, eviction means silent data loss. A user who made 50 annotations offline loses them when the browser decides to free space. Persistent storage, once granted, guarantees your data survives until the user explicitly clears it. Browsers grant it liberally to installed PWAs, bookmarked sites, and highly-engaged origins; call it early and handle both outcomes gracefully.

---

### Example 46: Gracefully Handling `QuotaExceededError`

Even with persistence, writes can fail if the total system disk is full. A robust write path detects quota errors and falls back to eviction or user notification.

```javascript
async function safeWrite(db, store, record) {
  // => db is IDBPDatabase; store is the store name; record is the value
  try {
    await db.put(store, record);
    // => Happy path — write succeeded
    return { ok: true };
    // => Caller can check { ok: true } to know write completed
  } catch (err) {
    if (err.name === "QuotaExceededError") {
      // => Storage full — trigger cleanup
      console.warn("Quota hit; running cleanup");
      await evictOldRecords(db);
      // => Free up space before retrying
      // => Retry once after cleanup
      try {
        await db.put(store, record);
        // => Second attempt after eviction
        return { ok: true, cleaned: true };
        // => Caller knows eviction was needed
      } catch {
        // => Still failing — surface to user
        return { ok: false, reason: "storage-full" };
        // => User must manually free space or accept data loss
      }
    }
    throw err;
    // => Propagate other errors unchanged
    // => ConstraintError, NotReadableError, etc. bubble to caller
  }
}

async function evictOldRecords(db) {
  // => Example: delete entries older than 30 days
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  // => 30 days in milliseconds; createdAt older than this is evictable
  const tx = db.transaction("cache", "readwrite");
  // => Readwrite tx required for cursor.delete()
  let cursor = await tx.objectStore("cache").openCursor();
  // => Iterate all cache entries to find stale ones
  while (cursor) {
    if (cursor.value.createdAt < cutoff) {
      // => Record is older than the 30-day threshold
      cursor.delete();
      // => Free space by removing stale cache entries
      // => Deletion is queued; committed when tx commits
    }
    cursor = await cursor.continue();
    // => Advance regardless of whether we deleted
  }
  await tx.done;
  // => Wait for all deletions to commit
}
```

**Key Takeaway**: Catch `QuotaExceededError`, run targeted eviction, then retry once — degrade gracefully to user notification if recovery fails.

**Why It Matters**: A naive write that throws on quota loses user data and produces cryptic errors. The resilient pattern is: detect the specific error, free space intelligently (oldest entries, least-used items, low-priority caches), retry, and only surface failure to the user if recovery doesn't help. Pair this with `navigator.storage.estimate()` monitoring to evict proactively before hitting the limit.

---

## Group 8: Backup, Restore, and Debugging

### Example 47: Exporting a Database to JSON

Enumerate every object store, dump contents to a plain object, and serialize with `JSON.stringify`. Works for most non-binary data.

```javascript
async function exportDB(db) {
  // => db is IDBPDatabase; iterates all stores and serializes to JSON
  const backup = { version: db.version, stores: {} };
  // => Include DB version so import can recreate at the right version

  // => Iterate every store in the DB
  for (const storeName of db.objectStoreNames) {
    // => db.objectStoreNames is DOMStringList — iterable
    const tx = db.transaction(storeName, "readonly");
    // => One readonly tx per store — avoids holding a multi-store lock
    // => Read all records at once (caveat: memory)
    backup.stores[storeName] = await tx.objectStore(storeName).getAll();
    // => getAll() returns all records as an array
    await tx.done;
    // => Wait for this store's tx to complete before moving to next
  }

  // => Serialize to JSON string (loses Blobs, Dates, Sets — see Example 48)
  return JSON.stringify(backup);
  // => Returns a string; caller decides whether to download or upload
}

// => Usage: download as file
const json = await exportDB(db);
// => json is the full database serialized as a JSON string
const blob = new Blob([json], { type: "application/json" });
// => Wrap in Blob for download
const a = document.createElement("a");
// => Create invisible anchor element to trigger download
a.href = URL.createObjectURL(blob);
// => Create a blob: URL for the JSON data
a.download = "backup.json";
// => Set the filename that the browser will use
a.click();
// => User gets a backup.json download
// => Call URL.revokeObjectURL(a.href) after the click to free memory
```

**Key Takeaway**: Dumping each object store via `getAll` and serializing with `JSON.stringify` produces a portable backup for data without binary content.

**Why It Matters**: User-initiated export is a key feature for productivity apps, note-takers, and any tool where data ownership matters. JSON is the obvious format: human-readable, easy to diff, and interoperable. Just remember what JSON loses (Dates become strings, Sets become arrays, Blobs fail outright) and document those limitations or use structured formats (Example 48) for data with binary.

---

### Example 48: Importing Backup with Type Reconstruction

JSON import must reconstruct lost types. Store a manifest describing which fields are Dates, Sets, etc., and rehydrate them on import.

```javascript
async function importDB(db, jsonText) {
  // => db is IDBPDatabase; jsonText is the JSON backup string
  const backup = JSON.parse(jsonText);
  // => backup is { version, stores: { storeName: [...records] } }

  for (const [storeName, records] of Object.entries(backup.stores)) {
    // => Iterate each store in the backup
    const tx = db.transaction(storeName, "readwrite");
    // => Readwrite tx — we'll clear and repopulate
    const store = tx.objectStore(storeName);
    // => store is IDBPObjectStore for this tx
    // => Clear existing data before importing
    await store.clear();
    // => Reset store to empty before importing — prevents duplicate key errors

    for (const record of records) {
      // => Iterate each record from the backup array
      // => Reconstruct known Date fields by convention
      if (record.createdAt) record.createdAt = new Date(record.createdAt);
      // => JSON.parse gives strings like "2026-01-01T00:00:00.000Z"; convert to Date
      if (record.updatedAt) record.updatedAt = new Date(record.updatedAt);
      // => Same pattern for any date field
      // => Reconstruct Sets stored as arrays
      if (Array.isArray(record.tags_set)) {
        // => JSON serialized Set as array; restore it as Set
        record.tags_set = new Set(record.tags_set);
        // => Now a proper Set again — queries and iteration work correctly
      }
      await store.put(record);
      // => Write reconstructed record back to the store
    }
    await tx.done;
    // => Wait for this store's tx to commit before next store
  }
  console.log("Import complete");
  // => Output: Import complete
}
```

**Key Takeaway**: Reconstruct Date and Set instances during import using field-name conventions or an explicit schema — JSON round-trip silently loses rich types.

**Why It Matters**: A backup that round-trips incorrectly is worse than no backup at all — users trust it to restore their data faithfully. Treat import/export as a schema migration: document which fields are rich types, convert on boundaries, and test with real data. Consider adding a schema version to the backup so future imports can detect and migrate older formats.

---

### Example 49: Inspecting IndexedDB in DevTools

Chrome and Edge expose IndexedDB under Application > Storage > IndexedDB. You can read values, delete records, and clear stores without writing code — invaluable during development.

```javascript
// => Code to set up visible data in DevTools
import { openDB } from "idb";
// => openDB is the idb wrapper — returns IDBPDatabase
const db = await openDB("devtools-demo", 1, {
  // => upgrade runs when version bumps (first open = version 0 → 1)
  upgrade(db) {
    // => db is IDBPDatabase inside upgrade; create the object store
    const store = db.createObjectStore("contacts", { keyPath: "id" });
    // => keyPath: "id" means records are keyed by their .id property
    // => Create indexes so DevTools shows index views too
    store.createIndex("by_name", "name");
    // => by_name index — DevTools will list it under the store
  },
});

// => Write some records — put replaces any existing entry with same key
await db.put("contacts", { id: 1, name: "Aisha", email: "a@x.com" });
// => Record 1 stored with id=1
await db.put("contacts", { id: 2, name: "Budi", email: "b@x.com" });
// => Record 2 stored with id=2

// => Open DevTools > Application > IndexedDB > devtools-demo > contacts
// => You should see two records with all fields
// => Right-click to delete, or use the trash icon to clear the store
// => Firefox: Storage tab > Indexed DB (similar UI)
// => Edits you make in DevTools persist — useful for manual testing

console.log("Open DevTools to inspect");
// => Output: Open DevTools to inspect
// => After running this code, switch to the DevTools panel to explore
db.close();
// => Release connection so other tabs can open new versions
// => Closing also helps DevTools show the freshest state
```

**Key Takeaway**: DevTools (Application tab in Chrome/Edge, Storage tab in Firefox) exposes IndexedDB contents for inspection, editing, and deletion without writing code.

**Why It Matters**: Skilled DevTools use cuts debugging time dramatically. Seeing the actual stored values — rather than re-querying through your API — reveals bugs like stale writes, unexpected types, and missing indexes instantly. During development, it also lets you simulate edge cases: delete a record to test missing-data paths, corrupt a field to test parsing resilience, or clear the store to reset state.

---

## Group 9: Advanced Querying Patterns

### Example 50: Index-Only Queries with `openKeyCursor`

When you only need keys — for existence checks, pagination bookmarks, or ordered IDs — `openKeyCursor` skips value deserialization entirely.

```javascript
import { openDB } from "idb";
// => Open (or create) the "products" database at version 1
const db = await openDB("products", 1, {
  upgrade(db) {
    // => Create "products" object store keyed by .id
    const store = db.createObjectStore("products", { keyPath: "id" });
    // => Index on "category" for fast category lookups
    store.createIndex("by_category", "category");
  },
});
// => Seed three products — two books, one pen
await db.put("products", { id: 1, category: "book", title: "Atlas" });
// => id=1, category="book"
await db.put("products", { id: 2, category: "book", title: "Meditations" });
// => id=2, category="book"
await db.put("products", { id: 3, category: "pen", title: "Rollerball" });
// => id=3, category="pen" — will be excluded from our query

// => openKeyCursor iterates keys without loading values
const tx = db.transaction("products", "readonly");
// => Readonly tx — no modifications needed
const index = tx.objectStore("products").index("by_category");
// => Use the by_category index to restrict scan to "book" entries

const ids = [];
// => IDBKeyRange.only("book") — only entries where category === "book"
let cursor = await index.openKeyCursor(IDBKeyRange.only("book"));
// => openKeyCursor returns keys only — no record values deserialized
while (cursor) {
  // => cursor.primaryKey is the store's primary key (id)
  // => cursor.key is the indexed value (category here — always "book")
  ids.push(cursor.primaryKey);
  // => Collect the primary key (id) without loading the full record
  cursor = await cursor.continue();
  // => Advance to next matching entry in the index
}
await tx.done;
// => Transaction committed automatically — all reads succeeded

console.log("Book IDs:", ids);
// => Output: Book IDs: [ 1, 2 ]
db.close();
// => Release connection handle
```

**Key Takeaway**: `openKeyCursor` yields keys without deserializing values — use it whenever you only need to know "which records match" not "what they contain."

**Why It Matters**: Deserializing large records has measurable cost. If you only need IDs for later lookup, a pagination marker, or an existence check, `openKeyCursor` skips that work entirely and runs noticeably faster on stores with heavy values (Blobs, large objects). It is a zero-risk optimization whenever values are not immediately needed.

---

### Example 51: Full-Store Scans with Early Exit

Cursors let you stop iterating at any time. Return without calling `continue()` to end the scan — saves time and resources.

```javascript
// => findFirstMatching returns the first record satisfying predicate
async function findFirstMatching(db, predicate) {
  // => Open readonly tx on "events" — no writes needed
  const tx = db.transaction("events", "readonly");
  // => openCursor with no args iterates in primary-key order
  let cursor = await tx.objectStore("events").openCursor();

  while (cursor) {
    // => Check if this record matches the caller's condition
    if (predicate(cursor.value)) {
      // => Found a match — stop without calling continue
      const match = cursor.value;
      // => Capture value before transaction commits or closes
      // => Transaction auto-commits once we leave the loop
      return match;
      // => Returning here exits the loop — no more records read
    }
    cursor = await cursor.continue();
    // => No match — advance to next record in key order
  }
  // => Exhausted all records without a match
  await tx.done;
  // => Explicitly await done only in the no-match path
  return null;
  // => Signal caller: no record found
}

// => Usage: find first event of a given type
const event = await findFirstMatching(db, (e) => e.type === "error");
// => predicate receives each cursor.value; stops at first match
console.log(event ? "Found" : "None");
// => Output: Found or None
```

**Key Takeaway**: Early-exit cursor loops let you scan up to a match and then stop — ideal for "find first" queries where exhaustive iteration would waste work.

**Why It Matters**: Pretty much every language's standard library has `find`, `some`, or `first` — IndexedDB's equivalent is early-exit cursor iteration. Without this pattern, developers reach for `getAll` plus Array.find, loading the entire store into memory. Early exit keeps resource use proportional to how close the match is to the start of the scan.

---

### Example 52: Composite Queries with Multiple Indexes

When a query needs to filter on multiple dimensions, combine a range query on an index with in-loop predicates on other fields.

```javascript
import { openDB } from "idb";
// => Open/create "sales" DB at version 1
const db = await openDB("sales", 1, {
  upgrade(db) {
    // => Create "orders" store keyed by .id
    const store = db.createObjectStore("orders", { keyPath: "id" });
    // => Index on "date" string (ISO 8601 sorts lexicographically = chronologically)
    store.createIndex("by_date", "date");
  },
});
// => Seed ...
// => (populate with sample orders before querying)

// => "Find all high-value orders in Q1 2026"
async function query(db) {
  // => Readonly tx — we only read, never write
  const tx = db.transaction("orders", "readonly");
  // => Access the by_date index to use key ranges on date
  const index = tx.objectStore("orders").index("by_date");

  // => Range on indexed field (cheap, uses B-tree)
  // => IDBKeyRange.bound(lower, upper) — inclusive on both ends by default
  const range = IDBKeyRange.bound("2026-01-01", "2026-03-31");
  // => Only orders dated 2026-01-01 through 2026-03-31 will be visited
  const results = [];
  // => Accumulate matching records here
  let cursor = await index.openCursor(range);
  // => openCursor with range — only entries inside the range are visited

  while (cursor) {
    // => In-loop predicate on non-indexed field
    if (cursor.value.total > 1000) {
      // => Only add orders meeting both date AND value criteria
      results.push(cursor.value);
      // => cursor.value is the full order record
    }
    cursor = await cursor.continue();
    // => Advance to next order in date order
  }
  await tx.done;
  // => Transaction committed — all reads complete
  return results;
  // => Array of orders: date in Q1 2026 AND total > 1000
  // => Length varies based on how many orders pass both filters
}
```

**Key Takeaway**: Use the most selective index for the cursor range, then filter further with predicates inside the loop — effective for composite queries without compound indexes.

**Why It Matters**: IndexedDB does not support multi-index queries natively. The pragmatic pattern is: pick the index that narrows results most (typically date or status), scan that range, and filter the rest in-memory inside the cursor loop. When the secondary filters become slow, promote them to a compound index (see Beginner Example 12). Start simple; index only when profiling demands it.

---

## Group 10: Testing and Tooling

### Example 53: Why Not Core Features — Testing with `fake-indexeddb`

Unit tests in Node.js do not have a real IndexedDB. `fake-indexeddb` is an in-memory implementation that runs the full API without a browser.

**Install**:

```bash
npm install --save-dev fake-indexeddb
```

**Why Not Core Features**: Jest and Vitest run in Node, where `indexedDB` is undefined. Mocking every call by hand is tedious and diverges from real behavior. `fake-indexeddb` provides a spec-compliant implementation so tests exercise your actual data-layer code. Use it for unit and integration tests; keep Playwright/Cypress for real-browser checks.

```javascript
// test-setup.js (loaded by your test runner)
import "fake-indexeddb/auto";
// => Auto-installs global indexedDB and IDBKeyRange
// => fake-indexeddb replaces the browser global — no other config needed

// users.test.js
import { openDB } from "idb";
// => idb works transparently on top of fake-indexeddb
import { describe, test, expect } from "vitest";
// => Vitest runs in Node — no browser context available

describe("user repository", () => {
  test("stores and retrieves a user", async () => {
    // => Each test can use a unique DB name for isolation
    // => Math.random ensures no two tests share the same in-memory DB
    const db = await openDB("users-test-" + Math.random(), 1, {
      upgrade(db) {
        // => Create "users" store keyed by .id
        db.createObjectStore("users", { keyPath: "id" });
      },
    });

    await db.put("users", { id: 1, name: "Aisha" });
    // => Write record — stored in fake-indexeddb's in-memory map
    const user = await db.get("users", 1);
    // => Read back the same record by primary key

    expect(user.name).toBe("Aisha");
    // => Assertion runs in-memory — no browser needed
    // => Behavior matches Chrome/Firefox IndexedDB spec closely
    db.close();
    // => Release the in-memory DB handle
  });
});
```

**Key Takeaway**: `fake-indexeddb` replaces the browser's IndexedDB with a Node-compatible implementation, letting unit tests exercise real data-layer code without a browser.

**Why It Matters**: Fast tests are good tests. A Jest/Vitest suite running `fake-indexeddb` finishes in milliseconds per test, encouraging thorough coverage of migrations, error paths, and edge cases. Because `fake-indexeddb` targets the W3C spec, behavior matches Chrome/Firefox/Safari closely enough that catches here catch real bugs. Reserve real-browser tests for integration-level confirmation.

---

### Example 54: Seeding Test Databases

Write helpers that construct a fully-populated test DB from fixture data. Each test gets a clean state without shared global mutation.

```javascript
import { openDB, deleteDB } from "idb";
// => deleteDB removes an existing database completely — clean slate

// => Factory creates a fresh DB per test
async function createTestDB(name, fixtures = {}) {
  // => Ensure any previous copy is gone — prevents state leakage between tests
  await deleteDB(name);
  // => deleteDB is a no-op if the DB doesn't exist yet — safe to call always

  const db = await openDB(name, 1, {
    upgrade(db) {
      // => Define schema fresh each time — mirrors production schema
      const users = db.createObjectStore("users", { keyPath: "id" });
      // => keyPath: "id" — records keyed by their .id property
      users.createIndex("by_email", "email");
      // => by_email index enables email-based lookups in tests
      db.createObjectStore("posts", { keyPath: "id" });
      // => posts store — separate from users store
    },
  });

  // => Seed any fixtures provided by the caller
  for (const [storeName, records] of Object.entries(fixtures)) {
    // => Iterate each store name and its array of records
    const tx = db.transaction(storeName, "readwrite");
    // => Readwrite tx for this store only
    for (const r of records) await tx.store.put(r);
    // => Write each fixture record — put handles both insert and update
    await tx.done;
    // => Commit this store's seed data before moving to next store
  }

  return db;
  // => Caller gets a populated IDBPDatabase ready for assertions
  // => db is open — caller must close it after the test
}

// => Usage in a test
const db = await createTestDB("test-1", {
  users: [{ id: 1, email: "a@x.com" }],
  // => One user seeded with known email
  posts: [{ id: 1, authorId: 1, title: "Hello" }],
  // => One post seeded with known authorId and title
});
// => DB now has a known, predictable state
// => Test can assert against id=1 user and post without guessing
```

**Key Takeaway**: Build a test-DB factory that deletes, creates, and seeds in one call — every test starts from a known, repeatable state.

**Why It Matters**: Test isolation is the difference between flaky and reliable suites. Sharing a single in-memory DB across tests leaks state; creating fresh DBs per test keeps each assertion independent. Pair this factory with `fake-indexeddb` and your tests run in milliseconds with zero cross-contamination. The exact same pattern works in real browser integration tests — just swap the base name to avoid clobbering developer data.

---

### Example 55: Benchmarking Operations

Measure actual performance with `performance.now` to identify slow queries. Even inside IndexedDB, some patterns are orders of magnitude faster than others.

```javascript
// => bench wraps any async operation with performance.now timing
async function bench(label, fn) {
  // => Record start time with sub-millisecond precision
  const start = performance.now();
  await fn();
  // => fn() is the operation under test — awaited to completion
  // => Difference in ms (with sub-millisecond precision)
  const ms = performance.now() - start;
  // => ms = elapsed wall-clock time for the awaited operation
  console.log(`${label}: ${ms.toFixed(2)} ms`);
  // => Print two decimal places — e.g., "getAll: 83.40 ms"
}

// => Seed 10k records for benchmarking
const seedTx = db.transaction("items", "readwrite");
// => Readwrite tx — needed to insert records
for (let i = 0; i < 10_000; i++) {
  // => Queue all 10k puts without awaiting — IDB batches them
  seedTx.store.put({ id: i, name: "item " + i });
  // => Each put is a request; not awaited here so they pipeline
}
await seedTx.done;
// => All 10k records committed atomically

// => Benchmark three common patterns
await bench("getAll", async () => {
  await db.getAll("items");
  // => Loads ALL 10k records into a single JS array
});
// => Output: getAll: ~80 ms (example)
// => Fast because one request returns all records in one round-trip

await bench("cursor", async () => {
  const tx = db.transaction("items", "readonly");
  // => Readonly tx — we only read
  let cursor = await tx.store.openCursor();
  // => openCursor positions at first record
  while (cursor) cursor = await cursor.continue();
  // => Each continue() is a separate IDB round-trip — 10k round-trips
  await tx.done;
  // => Transaction committed after all records visited
});
// => Output: cursor: ~120 ms (example — one round-trip per record)
// => Slower because each record = one IDB event cycle

await bench("getAllKeys", async () => {
  await db.getAllKeys("items");
  // => Returns only primary keys — no value deserialization
});
// => Output: getAllKeys: ~30 ms (no value deserialization)
// => Fastest pattern when you only need to know which keys exist
```

**Key Takeaway**: `performance.now()` is the standard browser benchmarking tool; use it to compare patterns like `getAll` vs `cursor` vs `getAllKeys` on real data sizes.

**Why It Matters**: Intuition about "which is faster" is unreliable — actual numbers depend on record count, value size, and browser implementation. A 10-line benchmark reveals that `getAllKeys` is typically 3-5x faster than `getAll` and `cursor` iteration is slower than both for full scans (but necessary for memory-bounded use). Measure before optimizing, and re-measure when data sizes change.

---

## Summary

You have learned production IndexedDB patterns:

- **Promise wrapping** single requests and whole transactions
- **The `idb` library** for tiny, spec-faithful promise API
- **Migrations** using fall-through switches and in-upgrade data transforms
- **Concurrent writes** via shared queues and optimistic version fields
- **Service workers** with identical IndexedDB API and `BroadcastChannel` sync
- **Binary data** (`Blob`, `File`) stored natively for offline uploads
- **Pagination** using keyset cursors instead of offsets
- **Quotas** with `storage.estimate()`, `storage.persist()`, and graceful fallback
- **Backup/restore** via JSON export with type reconstruction
- **Testing** with `fake-indexeddb` and seeded test factories
- **Benchmarking** to compare patterns empirically

Next, the Advanced tutorial introduces Dexie.js, live queries, multi-device sync patterns, conflict resolution, and deep performance optimization.
