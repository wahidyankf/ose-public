---
title: "Intermediate Examples"
date: 2026-07-29T00:00:00+07:00
draft: false
weight: 20
---

Examples 29-56 move from a single component to a whole frontend: uncontrolled inputs and the no-switch rule, the client-vs-server cache split (TanStack Query-style caching, invalidation, optimistic updates with rollback), when to reach for a Redux Toolkit store and memoized selectors, a hand-built virtual-DOM diff, reconciliation by element type, fine-grained signals, semantic landmarks, an ARIA tabs widget, roving tabindex and a focus trap, live regions, accessible form validation and error summaries, CSS Modules vs Tailwind vs the specificity model, HTTP caching with stale-while-revalidate, a service worker, and performance budgets with bundle analysis. Every example is a complete, self-contained, originally-authored TypeScript file -- framework and DOM mechanics are modeled in pure TypeScript, so no React, browser, or network install is required. Run each with `npx tsx example.ts`; every printed line below was captured from an actual run.

---

### Example 29: An Uncontrolled Input Reads Its Value via a Ref

_ex-29 &middot; exercises co-25_

An uncontrolled input owns its value in the DOM; React does not pass it a value prop. A ref reads the current value out only when needed, on submit.

> **Note:** "An input like `<input />` is uncontrolled"; a controlled input gets a `value` (or `checked`) prop ([react.dev, <input>](https://react.dev/reference/react-dom/components/input)).

**`learning/code/ex-29-uncontrolled-input/example.ts`**

```typescript
// Example 29: An Uncontrolled Input Reads Its Value via a Ref. (co-25)
//
// The counterpart of Example 28: an UNCONTROLLED input owns its own value in the DOM. React does
// not pass it a `value` prop; instead a ref reads the current value out when needed. The DOM, not
// state, is the source of truth.
//
// Note: "An input like `<input />` is uncontrolled"; a controlled input gets a
// `value` (or `checked`) prop. Source: react.dev, `<input>`
// (https://react.dev/reference/react-dom/components/input).

// A ref is a mutable handle to a DOM node; here it holds the element's current value.
interface Ref<T> {
  // => a ref is just a mutable container React keeps stable across renders
  current: T; // => the value the ref points at right now
}

// An uncontrolled input: React sets NO value; the DOM holds it. The ref reads it on demand.
function makeUncontrolledInput(): { ref: Ref<string>; readValue: () => string } {
  // => the DOM is the source of truth; the ref only OBSERVES it
  const domValue = { current: "" }; // => stands in for the input element's live .value
  return {
    ref: domValue, // => a ref attached to the input (like ref={inputRef})
    readValue: () => domValue.current, // => read the DOM's value when you need it (e.g. on submit)
  };
}

const input = makeUncontrolledInput();
// => the user types directly into the DOM; React does not intercept each keystroke
input.ref.current = "Hello, uncontrolled"; // => simulate the user typing into the DOM input
// => React never knew about each keystroke -- it reads the final value only when asked

console.log("value read via ref:", input.readValue()); // => Output: value read via ref: Hello, uncontrolled
```

**Run**: `npx tsx example.ts`

**Output**:

```text
value read via ref: Hello, uncontrolled
```

**Key takeaway**: In an uncontrolled input the DOM owns the value; a ref observes it on demand.

**Why it matters**: Uncontrolled inputs suit one-shot reads (a form submitted once) where wiring every keystroke through state is overhead. The trade-off is that React does not see each change, so live validation, formatting, or conditional disabling are harder. Pick controlled (Example 28) when you need React to track each value.

**Pitfall**: Because React does not track the value, you cannot easily validate or transform it on each keystroke.

---

### Example 30: An Input Cannot Switch Controlled and Uncontrolled Mid-life

_ex-30 &middot; exercises co-25_

An input that sometimes has a value prop and sometimes does not tries to switch modes during its lifetime. React forbids this and warns.

> **Note:** "An input can't be both controlled and uncontrolled ... [and] cannot switch ... over its lifetime." ([react.dev, <input>](https://react.dev/reference/react-dom/components/input)).

**`learning/code/ex-30-controlled-vs-uncontrolled/example.ts`**

```typescript
// Example 30: An Input Cannot Switch Controlled and Uncontrolled Mid-life. (co-25)
//
// An input that sometimes has a `value` prop and sometimes does not tries to SWITCH modes during
// its lifetime. React forbids this and warns: pick one mode and keep it for the input's whole life.
//
// Note: "An input can't be both controlled and uncontrolled ... [and] cannot switch
// ... over its lifetime." Source: react.dev, `<input>`
// (https://react.dev/reference/react-dom/components/input).

// The warnings React's dev build would emit.
const warnings: string[] = []; // => stands in for the dev-console warning sink
// => a mode switch is a developer bug, caught by the warning rather than a crash

// An input render is either controlled (value present) or uncontrolled (value absent).
function renderInput(value: string | undefined): "controlled" | "uncontrolled" {
  // => the mode is decided by whether `value` is defined on THIS render
  return value === undefined ? "uncontrolled" : "controlled"; // => co-25: the two modes
}

// detectSwitch flags a mode change between two consecutive renders.
function detectSwitch(prev: string, next: string): void {
  // => co-25: switching modes mid-life is the forbidden transition
  if (prev !== next) {
    warnings.push(`Warning: A component is changing ${prev} to ${next}. Inputs should not switch modes.`);
  }
}

// First render: controlled (value = "a"). Second render: uncontrolled (value = undefined).
const mode1 = renderInput("a"); // => controlled
const mode2 = renderInput(undefined); // => uncontrolled -- a forbidden switch
detectSwitch(mode1, mode2); // => the warning fires

console.log("modes:", mode1, "->", mode2); // => Output: modes: controlled -> uncontrolled
console.log("warnings:", warnings); // => Output: the cannot-switch-modes warning
```

**Run**: `npx tsx example.ts`

**Output**:

```text
modes: controlled -> uncontrolled
warnings: [
  'Warning: A component is changing controlled to uncontrolled. Inputs should not switch modes.'
]
```

**Key takeaway**: Pick controlled OR uncontrolled for an input's whole life -- switching modes is a bug React warns about.

**Why it matters**: Switching modes usually comes from a value prop that is sometimes undefined (e.g. an uninitialized field). React's warning points at the exact bug: once an input is controlled it must stay controlled, and vice versa. The fix is to make the value consistently defined (often an empty string, not undefined).

**Pitfall**: A value that starts as undefined then becomes a string is the most common accidental mode switch.

---

### Example 31: A Server Cache Skips the Network on a Cached Read

_ex-31 &middot; exercises co-15_

A server-state cache stores fetch results keyed by a query key. A second read of the same key within the cache window serves the stored data without hitting the network.

**`learning/code/ex-31-server-cache-state/example.ts`**

```typescript
// Example 31: A Server Cache Skips the Network on a Cached Read. (co-15)
//
// A server-state cache (TanStack Query-style) stores the result of a fetch keyed by a query key.
// A second read of the same key within the cache window serves the stored data WITHOUT hitting the
// network -- the defining benefit of separating server cache state from component state.

// Counters track how many real network fetches happened vs. how many reads were served.
let networkFetches = 0; // => increments only on a genuine network round trip
// => reads - networkFetches = cache hits (the proof the cache worked)

// A query cache: query key -> cached data (+ its freshness).
const cache: Map<string, { data: string }> = new Map(); // => keyed by the query key string
// => a Map models the in-memory query cache TanStack Query keeps per key

// fetchUser is the "network" function -- expensive, and what the cache exists to avoid repeating.
function fetchUser(id: string): string {
  // => stands in for an HTTP GET /users/{id}
  networkFetches += 1; // => record a real network call
  return `user-${id}`; // => the fetched data
}

// readQuery returns cached data if present, otherwise fetches and caches (the staleWhileCached rule).
function readQuery(key: string): string {
  // => co-15: a cached key skips the network; a miss populates the cache
  const cached = cache.get(key); // => is this key already in the cache?
  if (cached) return cached.data; // => cache hit -> serve without the network
  const data = fetchUser(key); // => cache miss -> fetch and store
  cache.set(key, { data }); // => populate for next time
  return data; // => the freshly-fetched data
}

readQuery("42"); // => miss -> network fetch (#1)
readQuery("42"); // => HIT -> no network
readQuery("42"); // => HIT -> no network

console.log("reads: 3, network fetches:", networkFetches); // => Output: reads: 3, network fetches: 1
```

**Run**: `npx tsx example.ts`

**Output**:

```text
reads: 3, network fetches: 1
```

**Key takeaway**: A cached query key serves repeat reads from memory, skipping the network entirely.

**Why it matters**: This is the core benefit of separating server cache state from component state (TanStack Query): data that many components need is fetched once and shared, and repeat reads are instant. The cache also drives staleness and refetch (Example 33), turning ad-hoc fetch logic into a declarative data layer.

**Pitfall**: A cache with no staleness policy serves data forever, even after it changes server-side -- set a sensible staleTime.

---

### Example 32: Client UI State Stays Separate from the Server Cache

_ex-32 &middot; exercises co-15_

Client-only UI state (a theme toggle, an expanded panel) and the server cache live in different stores. They update independently -- a theme toggle never triggers a refetch.

**`learning/code/ex-32-client-state-separate/example.ts`**

```typescript
// Example 32: Client UI State Stays Separate from the Server Cache. (co-15)
//
// Client-only UI state (a dark-mode toggle, an expanded-panel flag) and server cache state live in
// DIFFERENT stores. They update independently: toggling the theme never refetches, and a refetch
// never resets the theme. Conflating them is a common source of redundant work and lost UI state.

// Two separate stores: client UI state vs. the server cache.
const clientUi = { theme: "light" as "light" | "dark" }; // => UI-only; never touches the network
// => putting UI state in the server cache would make every theme toggle risk a refetch
const serverCache = { user: "cached-user-42" }; // => server data; refetched independently

// toggleTheme changes ONLY the client UI store -- no refetch, no cache interaction.
function toggleTheme(): void {
  // => co-15: client UI state updates by itself, without involving server state
  clientUi.theme = clientUi.theme === "light" ? "dark" : "light"; // => a pure UI concern
}

// refetchUser changes ONLY the server cache -- the theme is untouched.
function refetchUser(): void {
  // => co-15: a server-state change does not reset client UI state
  serverCache.user = "cached-user-42-refreshed"; // => new server data
}

toggleTheme(); // => UI flips; the cache is unchanged
refetchUser(); // => cache refreshes; the theme is unchanged

console.log("theme after both updates:", clientUi.theme); // => Output: theme after both updates: dark
console.log("user after both updates:", serverCache.user); // => Output: user after both updates: cached-user-42-refreshed
```

**Run**: `npx tsx example.ts`

**Output**:

```text
theme after both updates: dark
user after both updates: cached-user-42-refreshed
```

**Key takeaway**: Keep UI-only state out of the server cache; the two update on completely different schedules.

**Why it matters**: Conflating them causes real bugs: a UI toggle stored in server-cache state may trigger a refetch, or a refetch may reset a UI flag. Keeping client UI state separate (useState, a context, or a UI store) means each changes only for its own reasons. This separation is co-15's central discipline.

**Pitfall**: Storing a filter or selection in the same store as server data couples a refetch to a UI reset.

---

### Example 33: Invalidation Triggers a Stale Query to Refetch

_ex-33 &middot; exercises co-15_

After a mutation, you invalidate the affected query key. The cache marks it stale, and the next observer refetches -- the UI converges on the new server truth.

**`learning/code/ex-33-query-invalidation/example.ts`**

```typescript
// Example 33: Invalidation Triggers a Stale Query to Refetch. (co-15)
//
// After a mutation, you invalidate the affected query key. The cache marks that key STALE, and the
// next time it is observed it refetches -- so the UI converges on the new server truth without
// manual refetch wiring everywhere.

// The cache stores data plus a stale flag per query key.
interface CacheEntry {
  // => the stale flag is what invalidation flips to force a refetch
  data: string; // => the cached value
  isStale: boolean; // => true => a refetch is needed next time this key is observed
}

let networkFetches = 0; // => counts real fetches triggered by invalidation
const cache: Map<string, CacheEntry> = new Map(); // => the query cache, keyed by query key

// primeCache stands in for an initial successful fetch.
cache.set("todos", { data: "[]", isStale: false }); // => fresh after the first fetch
networkFetches = 1; // => that initial fetch

// invalidate marks a key stale WITHOUT fetching -- the refetch happens on next observation.
function invalidate(key: string): void {
  // => co-15: invalidation marks stale; the observer refetches, not the mutator
  const entry = cache.get(key); // => locate the affected key
  if (entry) entry.isStale = true; // => flip stale -- the data is now suspect
}

// observe reads the key, refetching IF it is stale (the convergence mechanism).
function observe(key: string): string {
  // => a stale key refetches on observation; a fresh key serves from cache
  const entry = cache.get(key)!;
  if (entry.isStale) {
    networkFetches += 1; // => the refetch invalidation asked for
    entry.data = '["new-todo"]'; // => the refreshed server data
    entry.isStale = false; // => fresh again
  }
  return entry.data; // => the data the UI now shows
}

observe("todos"); // => fresh -> no refetch
invalidate("todos"); // => a mutation happened -> mark stale
observe("todos"); // => stale -> refetch (#2), UI converges on the new data

console.log("network fetches:", networkFetches); // => Output: network fetches: 2
console.log("todos after invalidation:", observe("todos")); // => Output: todos after invalidation: ["new-todo"]
```

**Run**: `npx tsx example.ts`

**Output**:

```text
network fetches: 2
todos after invalidation: ["new-todo"]
```

**Key takeaway**: A mutation invalidates the key; observers refetch, so the UI converges automatically.

**Why it matters**: Invalidation decouples the mutation from the read: you change data and declare which queries are now suspect, without manually refetching everywhere. Each observer of a stale key refetches on its own, so every component showing that data updates consistently. This is how server-cache state stays correct after writes.

**Pitfall**: Forgetting to invalidate after a mutation leaves the UI showing the stale pre-mutation data.

---

### Example 34: An Optimistic Update Rolls Back on Failure

_ex-34 &middot; exercises co-15_

An optimistic update shows the expected result immediately, before the server confirms. If the mutation fails, the update rolls back to the prior state.

**`learning/code/ex-34-optimistic-update/example.ts`**

```typescript
// Example 34: An Optimistic Update Rolls Back on Failure. (co-15)
//
// An optimistic update shows the EXPECTED result immediately (before the server confirms), so the
// UI feels instant. If the mutation then FAILS, the update rolls back to the prior state. The
// rollback is what makes optimism safe -- the user is never left with a lie.

// A todo list with a function to attempt a server mutation.
interface State {
  // => the list is the canonical server state; optimisticState is the maybe-a-lie UI view
  todos: string[]; // => the confirmed list
}

let state: State = { todos: ["buy milk"] }; // => the initial confirmed state

// commitTodo attempts the mutation; it FAILS when shouldFail is true.
function commitTodo(title: string, shouldFail: boolean): { ok: boolean } {
  // => the real mutation is async and may reject; here it is a synchronous boolean
  if (shouldFail) return { ok: false }; // => simulate a server rejection
  state.todos = [...state.todos, title]; // => confirm the new todo
  return { ok: true }; // => success
}

// optimisticAdd shows the todo immediately, then rolls back if the commit fails.
function optimisticAdd(title: string, shouldFail: boolean): string[] {
  // => co-15: show the expected result first, keep a snapshot to restore on failure
  const snapshot = [...state.todos]; // => the prior confirmed state, for rollback
  const optimisticView = [...snapshot, title]; // => the optimistic UI the user sees NOW
  const result = commitTodo(title, shouldFail); // => attempt the real mutation
  if (!result.ok) state.todos = snapshot; // => ROLLBACK: restore the prior state on failure
  return result.ok ? state.todos : optimisticView; // => report the final confirmed/optimistic view
}

const ok = optimisticAdd("walk dog", false); // => succeeds -> confirmed
const failed = optimisticAdd("fly kite", true); // => fails -> rolled back, not in confirmed list

console.log("after success:", ok); // => Output: after success: [ 'buy milk', 'walk dog' ]
console.log("after failure (rolled back):", state.todos); // => Output: after failure (rolled back): [ 'buy milk', 'walk dog' ]
```

**Run**: `npx tsx example.ts`

**Output**:

```text
after success: [ 'buy milk', 'walk dog' ]
after failure (rolled back): [ 'buy milk', 'walk dog' ]
```

**Key takeaway**: Optimism shows the result now and keeps a snapshot to restore if the server rejects it.

**Why it matters**: Optimistic updates make the UI feel instant for writes that almost always succeed (liking, toggling). The rollback is what makes the optimism honest: the user sees the expected outcome immediately, but is never left with a lie if the server says no. The snapshot-and-restore pattern is the whole safety mechanism.

**Pitfall**: An optimistic update without a rollback path leaves stale local data when the server fails.

---

### Example 35: A Redux Toolkit Slice for Large Shared State

_ex-35 &middot; exercises co-16_

Reach for a global store only when state is large, frequently updated, and shared across many components. A slice bundles the state plus the pure reducers that update it.

**`learning/code/ex-35-when-redux/example.ts`**

```typescript
// Example 35: A Redux Toolkit Slice for Large Shared State. (co-16)
//
// Reach for a global store (Redux Toolkit-style) only when state is LARGE, frequently updated, and
// shared across many components. A slice bundles the state for one domain plus the reducers that
// update it; selectors read derived values without re-running when unrelated state changes.

// A counter slice: state plus reducers plus selectors (the createSlice shape, modeled).
interface CounterState {
  // => the slice owns ONE piece of the global state tree
  value: number; // => the counter value
}

// Actions are discriminated by their `type` string; the reducer narrows on it.
type Action = { type: "counter/increment" } | { type: "counter/setValue"; payload: number };
// => the union + literal `type` is the classic Redux action shape (a discriminated union, co-33)

// reducer is a pure function: (state, action) -> newState. It NEVER mutates in place.
function reducer(state: CounterState, action: Action): CounterState {
  // => co-16: reducers are pure; immutability is what lets subscribers detect changes
  switch (action.type) {
    case "counter/increment":
      return { value: state.value + 1 }; // => new object, not a mutation
    case "counter/setValue":
      return { value: action.payload }; // => new object carrying the new value
  }
}

// selectValue reads a derived value out of the slice (a selector).
function selectValue(state: CounterState): number {
  // => selectors keep the read logic in one place; memoized selectors are Example 36
  return state.value; // => the projected value components subscribe to
}

let store: CounterState = { value: 0 }; // => the initial global state
store = reducer(store, { type: "counter/increment" }); // => dispatch increment
store = reducer(store, { type: "counter/setValue", payload: 42 }); // => dispatch setValue

console.log("selected value:", selectValue(store)); // => Output: selected value: 42
```

**Run**: `npx tsx example.ts`

**Output**:

```text
selected value: 42
```

**Key takeaway**: A Redux-style global store is for large shared frequently-updated state, not for every piece of state.

**Why it matters**: Redux's value is a single, debuggable store with time-travel and predictable pure reducers -- but that machinery is overhead you should not pay for local or server-cached state. The decision in co-16 is when the scale justifies it: many components, frequent updates, complex derived relationships. Most app state is better as component state or a server cache.

**Pitfall**: Reaching for Redux for state that two components share once adds ceremony for no benefit -- start local.

---

### Example 36: A Memoized Derived Selector Recomputes on Input Change Only

_ex-36 &middot; exercises co-19_

A memoized selector derives a value from a state slice and caches it, recomputing only when its input reference changes. Components reading an unchanged selector do not re-render.

**`learning/code/ex-36-derived-selector/example.ts`**

```typescript
// Example 36: A Memoized Derived Selector Recomputes on Input Change Only. (co-19)
//
// A memoized selector derives a value from state and caches it, recomputing only when its INPUT
// slice changes. Components reading a selector that did not change do not re-render -- the whole
// point of memoized selectors in a global store.

let computeCalls = 0; // => counts real recomputations (proof the memo worked)
// => computeCalls staying low while reads repeat is the memoization paying off

// selectVisible derives the count of done items from the todos slice.
function selectVisibleCount(todos: { done: boolean }[]): number {
  // => the derive itself; memoized means this body runs only when todos changes
  computeCalls += 1; // => record a real recomputation
  return todos.filter((t) => t.done).length; // => the derived count
}

// memoize returns a selector that recomputes only when its single argument changes (by reference).
function memoize<I, O>(projector: (input: I) => O): (input: I) => O {
  // => co-19: cache keyed on the last input reference; same reference => same cached output
  let lastInput: I | undefined; // => the previous input reference
  let lastOutput: O | undefined; // => the previous result
  return (input: I) => {
    if (input !== lastInput) {
      // => reference changed -> recompute; same reference -> cache hit
      lastInput = input; // => store the new reference
      lastOutput = projector(input); // => recompute and cache
    }
    return lastOutput as O; // => the cached or freshly-computed result
  };
}

const select = memoize(selectVisibleCount); // => the memoized selector

const todosA = [{ done: true }, { done: false }]; // => reference A
select(todosA); // => compute (#1)
select(todosA); // => SAME reference -> cache hit (#1 still)
select(todosA); // => still same -> cache hit (#1 still)
const todosB = [{ done: true }, { done: true }]; // => a NEW reference (and new values)
select(todosB); // => new reference -> recompute (#2)

console.log("reads: 4, real computations:", computeCalls); // => Output: reads: 4, real computations: 2
console.log("visible count (todosB):", select(todosB)); // => Output: visible count (todosB): 2
```

**Run**: `npx tsx example.ts`

**Output**:

```text
reads: 4, real computations: 2
visible count (todosB): 2
```

**Key takeaway**: A memoized selector recomputes only when its input slice changes (by reference), not on every store update.

**Why it matters**: Memoized selectors are how a global store stays fast as it grows: derived values (filtered lists, counts, aggregates) compute once per input change, and subscribers skip re-render when the derived value is identical. The reference-equality check is the performance contract -- it is why reducers must return new references only when state actually changed.

**Pitfall**: A reducer that returns the same array reference after mutating it defeats selector memoization.

---

### Example 37: Diffing Two Virtual Trees Patches Only the Delta

_ex-37 &middot; exercises co-21_

Re-rendering produces a new virtual tree; the diff finds the minimal set of changes between old and new, and only those patches touch the real DOM.

**`learning/code/ex-37-virtual-dom-diff/example.ts`**

```typescript
// Example 37: Diffing Two Virtual Trees Patches Only the Delta. (co-21)
//
// A virtual DOM is a plain-object description of the real DOM. Re-rendering produces a NEW tree;
// the diff finds the MINIMAL set of changes (the delta) between old and new, and only those are
// applied to the real DOM. This is the O(n) heuristic at the heart of React's reconciliation.

// A virtual node: a tag, some props, and children (text or more vnodes).
interface VNode {
  // => the smallest tree description needed to show a diff
  tag: string; // => the element type
  props: Record<string, string>; // => attributes (class, etc.)
  children: Array<VNode | string>; // => nested nodes or text leaves
}

// Each patch the diff would apply to the real DOM.
type Patch =
  | { kind: "text"; oldText: string; newText: string } // => a text leaf changed
  | { kind: "prop"; name: string; oldVal: string; newVal: string }; // => a prop changed
// => a real reconciler also handles insert/remove/move; these two suffice to show "only the delta"

// diff compares old vs new vnode and returns ONLY the patches that differ.
function diff(oldNode: VNode, newNode: VNode): Patch[] {
  // => co-21: same tag => reuse the node, collect only the changed props/text
  const patches: Patch[] = [];
  for (const key of Object.keys(newNode.props)) {
    // => compare each prop; record only the ones that actually changed
    const oldVal = oldNode.props[key] ?? ""; // => treat missing as empty
    const newVal = newNode.props[key];
    if (oldVal !== newVal) patches.push({ kind: "prop", name: key, oldVal, newVal }); // => a delta
  }
  for (let i = 0; i < newNode.children.length; i++) {
    // => compare children pairwise; record only changed text leaves
    const o = oldNode.children[i];
    const n = newNode.children[i];
    if (typeof o === "string" && typeof n === "string" && o !== n) {
      patches.push({ kind: "text", oldText: o, newText: n }); // => only the changed text
    }
  }
  return patches; // => the minimal delta
}

// Only the class prop and the title text changed between these two renders.
const oldTree: VNode = { tag: "h1", props: { class: "old", id: "h" }, children: ["Hello"] };
const newTree: VNode = { tag: "h1", props: { class: "new", id: "h" }, children: ["World"] };

const patches = diff(oldTree, newTree); // => only 2 patches, not a full rebuild

console.log("patches:", JSON.stringify(patches)); // => Output: patches: [{"kind":"prop",...},{"kind":"text",...}]
console.log("patch count:", patches.length); // => Output: patch count: 2
```

**Run**: `npx tsx example.ts`

**Output**:

```text
patches: [{"kind":"prop","name":"class","oldVal":"old","newVal":"new"},{"kind":"text","oldText":"Hello","newText":"World"}]
patch count: 2
```

**Key takeaway**: The diff emits only the delta -- the real DOM is touched for changed props and text, nothing else.

**Why it matters**: Direct DOM writes are expensive; the virtual DOM batches and minimizes them by computing the smallest change set. This O(n) heuristic (co-21) is what lets you write declarative render code that feels like it rebuilds everything, while only the actual changes reach the DOM. It is the foundation of reconciliation (Examples 38-39) and keys (Examples 26-27).

**Pitfall**: A diff that rebuilds large lists on every render usually means missing or unstable keys, not a slow diff.

---

### Example 38: A Same Type Element Reuses Its DOM Node

_ex-38 &middot; exercises co-20, co-21_

When the element at a position is the same type in both renders, React reuses the existing DOM node and updates only its changed props -- the node's identity is preserved.

**`learning/code/ex-38-reconciliation-same-type/example.ts`**

```typescript
// Example 38: A Same Type Element Reuses Its DOM Node. (co-20, co-21)
//
// During reconciliation, when the element at a given position is the SAME type in both renders
// (e.g. <div> -> <div>), React REUSES the existing DOM node and updates only its changed props/
// children. The node's identity is preserved -- no teardown, no recreation.

// A real DOM node we can ask "is this the SAME object as before?"
interface DomEl {
  // => identity is what "reuse" means: the very same object, mutated in place
  id: number; // => a unique identity we can compare across renders
  tag: string; // => the element type
  className: string; // => a mutable prop
}

let nextId = 1; // => a monotonic id so we can detect whether a node was reused or recreated

// reconcileSameType updates the EXISTING node when the type matches; returns whether it was reused.
function reconcileSameType(existing: DomEl, newTag: string, newClass: string): { reused: boolean; node: DomEl } {
  // => co-20/co-21: same type => reuse; the node keeps its id, only its props change
  if (existing.tag === newTag) {
    existing.className = newClass; // => mutate in place -- the node is reused
    return { reused: true, node: existing }; // => SAME id as before
  }
  return { reused: false, node: { id: nextId++, tag: newTag, className: newClass } }; // => (Example 39's case)
}

const before: DomEl = { id: nextId++, tag: "div", className: "old" }; // => the existing node
const after = reconcileSameType(before, "div", "new"); // => same type -> reuse
// => `after.node` IS `before` (same id, same object) -- only className changed

console.log("reused same node:", after.reused); // => Output: reused same node: true
console.log("same identity (id):", before.id === after.node.id); // => Output: same identity (id): true
```

**Run**: `npx tsx example.ts`

**Output**:

```text
reused same node: true
same identity (id): true
```

**Key takeaway**: Same type at the same position means reuse: the DOM node is updated in place, not recreated.

**Why it matters**: Node reuse is why React feels fast: most renders change a few props, and reusing nodes means no teardown or recreation, just targeted updates. Preserved identity also preserves per-node state (focus, scroll, input) and keeps CSS transitions running. The heuristic assumes same-type-at-same-position is the same element (Example 39 shows what happens when the type changes).

**Pitfall**: If you actually want state to reset, changing the element type or its key forces a rebuild deliberately.

---

### Example 39: A Different Type Element Rebuilds the Subtree

_ex-39 &middot; exercises co-21_

When the element at a position changes type between renders, React tears down the old subtree and builds a fresh one -- the old node's state is lost.

**`learning/code/ex-39-reconciliation-different-type/example.ts`**

```typescript
// Example 39: A Different Type Element Rebuilds the Subtree. (co-21)
//
// When the element at a position CHANGES type between renders (e.g. <div> -> <span>), React treats
// it as a different element: it TEARS DOWN the old subtree (and its state) and builds a fresh one.
// This is why toggling between different component types resets state.

// Each DOM node has an identity and a type; a type change means a full rebuild.
interface DomEl {
  // => id lets us prove the old node was destroyed, not reused
  id: number; // => identity
  tag: string; // => the type that, if changed, triggers a rebuild
  state: string; // => per-node state that is LOST on rebuild
}

let nextId = 1; // => monotonic ids distinguish reused nodes from freshly-built ones

// reconcileDifferentType rebuilds when the type changes; reuses when it does not.
function reconcile(existing: DomEl, newTag: string): { rebuilt: boolean; node: DomEl; oldId: number } {
  // => co-21: different type => destroy the old subtree (state lost) and build a new node
  if (existing.tag !== newTag) {
    const fresh: DomEl = { id: nextId++, tag: newTag, state: "" }; // => a NEW node, EMPTY state
    return { rebuilt: true, node: fresh, oldId: existing.id }; // => old node torn down
  }
  return { rebuilt: false, node: existing, oldId: existing.id }; // => same type -> reuse (Example 38)
}

const before: DomEl = { id: nextId++, tag: "div", state: "user-typed-text" }; // => old node with state
const result = reconcile(before, "span"); // => div -> span: DIFFERENT type -> rebuild

console.log("rebuilt subtree:", result.rebuilt); // => Output: rebuilt subtree: true
console.log("old id destroyed:", result.oldId, "| new id:", result.node.id); // => different ids
console.log("state after rebuild (lost):", JSON.stringify(result.node.state)); // => Output: state after rebuild (lost): ""
```

**Run**: `npx tsx example.ts`

**Output**:

```text
rebuilt subtree: true
old id destroyed: 1 | new id: 2
state after rebuild (lost): ""
```

**Key takeaway**: A type change at a position rebuilds the subtree, destroying the old node and its state.

**Why it matters**: This is the flip side of Example 38: React assumes a different type is a different element, so it does a clean teardown. That is why toggling between different component types resets their state, and why swapping a div for a span discards the div's children. Understanding this lets you control reset behavior deliberately via type (or via keys).

**Pitfall**: Accidentally swapping component types (e.g. a conditional that returns different components) resets state you did not mean to lose.

---

### Example 40: A Signal Re-renders Its Readers on Change

_ex-40 &middot; exercises co-22_

A signal is an object with a .value property. Code that reads .value inside an effect subscribes; setting .value re-runs only those subscribers.

> **Note:** "a signal is an object with a `.value` property ... the signal itself always stays the same." ([Preact Signals](https://preactjs.com/guide/v10/signals/)).

**`learning/code/ex-40-signal-basic/example.ts`**

```typescript
// Example 40: A Signal Re-renders Its Readers on Change. (co-22)
//
// A signal is an object with a `.value` property; the signal itself always stays the same object.
// Code that reads `.value` inside an effect subscribes; setting `.value` re-runs only those
// subscribed effects -- fine-grained reactivity instead of a full component re-render.
//
// Note: "a signal is an object with a `.value` property ... the signal itself always
// stays the same." Source: Preact Signals (https://preactjs.com/guide/v10/signals/).

let activeEffect: (() => void) | null = null; // => the effect currently tracking dependencies

// A Signal tracks who reads it and re-runs them when its value changes.
class Signal<T> {
  // => the subs Set is the dependency graph: who cares when this signal changes
  private val: T; // => the current value
  private readonly subs: Set<() => void> = new Set(); // => subscribed effects
  constructor(val: T) {
    this.val = val; // => the initial value
  }
  get value(): T {
    // => reading .value inside an effect registers that effect as a subscriber
    if (activeEffect) this.subs.add(activeEffect); // => dependency tracking
    return this.val; // => the current value
  }
  set value(next: T) {
    // => setting .value re-runs every subscriber (and only subscribers)
    this.val = next; // => store the new value
    this.subs.forEach((s) => s()); // => co-22: only dependents re-run
  }
}

// effect runs fn once and registers it as a subscriber of any signal it reads.
function effect(fn: () => void): void {
  // => the tracking window: signals read during fn subscribe it
  activeEffect = fn; // => make fn the active tracker
  fn(); // => run once to both read the initial value and subscribe
  activeEffect = null; // => close the tracking window
}

const count = new Signal(0); // => a signal, always the SAME object
const log: number[] = []; // => what the reader printed, each time it re-ran
effect(() => {
  // => this reader subscribed by reading count.value
  log.push(count.value); // => re-runs whenever count.value changes
});

count.value = 1; // => change -> the subscribed effect re-runs (log: [..., 1])
count.value = 2; // => change -> re-runs again (log: [..., 2])

console.log("reader re-ran with values:", log); // => Output: reader re-ran with values: [ 0, 1, 2 ]
```

**Run**: `npx tsx example.ts`

**Output**:

```text
reader re-ran with values: [ 0, 1, 2 ]
```

**Key takeaway**: A signal's readers subscribe automatically; setting .value re-runs only them, not a whole component.

**Why it matters**: Signals are the reactive primitive of fine-grained frameworks (Preact, Solid): instead of re-running an entire component on a state change, only the specific code that read the signal re-executes. The dependency tracking is automatic -- you read .value, and the framework records that you depend on it. This avoids the per-render cost of the virtual DOM entirely.

**Pitfall**: Reading a signal OUTSIDE a tracking context (e.g. in an event handler) does not subscribe, so the read is one-time.

---

### Example 41: A Computed Signal Tracks Its Dependencies

_ex-41 &middot; exercises co-22_

A computed signal derives its value from other signals. It tracks which signals it read and recomputes only when one of those dependencies changes.

> **Note:** "computed signals track which signals are accessed and re-run ... when those signals change." ([Preact Signals](https://preactjs.com/guide/v10/signals/)).

**`learning/code/ex-41-signal-computed/example.ts`**

```typescript
// Example 41: A Computed Signal Tracks Its Dependencies. (co-22)
//
// A computed signal derives its value from other signals. It tracks which signals it read and
// recomputes ONLY when one of those dependencies changes -- not on every signal change anywhere.
//
// Note: "computed signals track which signals are accessed and re-run ... when those
// signals change." Source: Preact Signals (https://preactjs.com/guide/v10/signals/).

let activeEffect: (() => void) | null = null; // => the dependency-tracking context

class Signal<T> {
  private val: T;
  private readonly subs: Set<() => void> = new Set();
  constructor(val: T) {
    this.val = val;
  }
  get value(): T {
    // => a read subscribes the active effect (or computed) to this signal
    if (activeEffect) this.subs.add(activeEffect);
    return this.val;
  }
  set value(next: T) {
    // => a write re-runs subscribers (including the computed's updater)
    this.val = next;
    this.subs.forEach((s) => s());
  }
}

let computeCalls = 0; // => counts real recomputations of the derived value

// computed builds a signal whose value is derived, re-running only when a read dependency changes.
function computed<T>(derive: () => T): { get value(): T } {
  // => the derivation runs once up front, then again only when a dependency changes
  let cached: T; // => the memoized result
  const recompute = () => {
    // => set the tracker so signals read inside derive subscribe recompute
    activeEffect = recompute; // => this computed subscribes to whatever derive reads
    cached = derive(); // => re-derive and cache
    computeCalls += 1; // => record a real recomputation
    activeEffect = null;
  };
  recompute(); // => initial computation (subscribes to dependencies)
  return {
    get value(): T {
      return cached; // => readers get the memoized value
    },
  };
}

const a = new Signal(2); // => dependency
const b = new Signal(3); // => dependency
const sum = computed(() => a.value + b.value); // => derives from a and b (#1)

a.value = 10; // => a changed -> sum recomputes (#2)
b.value = 3; // => b set to SAME value -> sum subscribed to b, so it recomputes (#3)
const unrelated = new Signal(99); // => a signal sum does NOT read
unrelated.value = 100; // => changed, but sum does not depend on it -> NO recompute (#3 still)

console.log("sum value:", sum.value); // => Output: sum value: 13
console.log("real computations:", computeCalls); // => Output: real computations: 3
```

**Run**: `npx tsx example.ts`

**Output**:

```text
sum value: 13
real computations: 3
```

**Key takeaway**: A computed signal recomputes only when a signal it actually read changes -- not on any signal change.

**Why it matters**: Computed signals bring memoization to fine-grained reactivity: the derived value caches, and only the specific dependencies the derivation touched trigger a recompute. A signal the computed never reads cannot trigger it, so unrelated changes are free. This is the signal equivalent of useMemo (Example 24), but automatic.

**Pitfall**: Reading a signal conditionally inside a computed makes its dependency set vary per run -- avoid branching reads.

---

### Example 42: A Signal Updates the DOM Without a Parent Re-render

_ex-42 &middot; exercises co-22_

When a signal changes, only the effect that read it re-runs, updating just the bound DOM. The parent component does not re-render at all -- the fine-grained payoff.

> **Note:** SolidJS "compiles its templates to real DOM nodes ... only the code that depends on it will rerun" (SolidJS README). The exact wording of quotes from the SolidJS docs site has not been independently confirmed; check the linked source before relying on it.

**`learning/code/ex-42-signal-vs-rerender/example.ts`**

```typescript
// Example 42: A Signal Updates the DOM Without a Parent Re-render. (co-22)
//
// The fine-grained payoff: when a signal changes, only the effect that read it re-runs (updating
// just the bound DOM text). The parent COMPONENT does not re-render at all -- unlike React, where a
// state change re-runs the whole component function. This is the core performance claim of
// signal-based frameworks (SolidJS, Preact Signals).
//
// Note: SolidJS "compiles its templates to real DOM nodes ... only the code that
// depends on it will rerun" (SolidJS README). The exact wording of quotes from the SolidJS docs
// site has not been independently confirmed; check the linked source before relying on it.

let activeEffect: (() => void) | null = null;
let parentRenders = 0; // => counts how many times the PARENT component function ran
// => parentRenders staying flat while the bound DOM updates is the fine-grained payoff

class Signal<T> {
  private val: T;
  private readonly subs: Set<() => void> = new Set();
  constructor(val: T) {
    this.val = val;
  }
  get value(): T {
    if (activeEffect) this.subs.add(activeEffect);
    return this.val;
  }
  set value(next: T) {
    this.val = next;
    this.subs.forEach((s) => s()); // => only the bound-DOM effect re-runs
  }
}

// A "bound DOM node" whose text a signal drives directly.
const boundDom = { text: "" }; // => a single DOM text node

// The parent component runs ONCE; it sets up a fine-grained binding, then never re-runs.
function mountParent(count: Signal<number>): void {
  // => co-22: the component body runs once; the binding below is what re-runs on change
  parentRenders += 1; // => this increments only when the parent itself re-renders
  activeEffect = () => {
    // => this effect is the fine-grained binding -- it re-runs, the parent does not
    boundDom.text = `count: ${count.value}`; // => updates ONLY this DOM text
  };
  activeEffect(); // => initial bind (subscribes to count)
  activeEffect = null;
}

const count = new Signal(0); // => the signal the DOM binds to
mountParent(count); // => parent runs once (parentRenders = 1)
count.value = 1; // => DOM updates, parent does NOT re-render
count.value = 2; // => DOM updates again, parent still does NOT re-render

console.log("bound DOM after changes:", boundDom.text); // => Output: bound DOM after changes: count: 2
console.log("parent re-renders:", parentRenders); // => Output: parent re-renders: 1
```

**Run**: `npx tsx example.ts`

**Output**:

```text
bound DOM after changes: count: 2
parent re-renders: 1
```

**Key takeaway**: A signal update re-runs only the bound effect; the parent component function never re-runs.

**Why it matters**: This is the headline performance difference between signal frameworks and React: in React a state change re-runs the whole component (then diffs); with signals, only the one DOM binding that depends on the value re-executes. The parent's render count stays flat, so large, mostly-static trees stay cheap even as small interactive parts update frequently.

**Pitfall**: The no-parent-rerender benefit depends on the compiler binding signals directly to the DOM -- hand-wired effects lose some of it.

---

### Example 43: A Semantic Document Outline of Landmarks

_ex-43 &middot; exercises co-23_

Semantic landmark elements (header, nav, main, article, footer) convey document structure. They map automatically to ARIA landmark roles, feeding the accessibility tree.

**`learning/code/ex-43-semantic-html/example.ts`**

```typescript
// Example 43: A Semantic Document Outline of Landmarks. (co-23)
//
// Semantic landmark elements (header, nav, main, article, section, footer) convey document
// structure that generic divs cannot. They map automatically to ARIA landmark roles, feeding the
// accessibility tree so screen-reader users can jump between regions.

// Each region carries its tag, its implicit ARIA role, and its heading level.
interface Landmark {
  // => the tag NAME decides the implicit role -- no extra ARIA attribute needed
  tag: "header" | "nav" | "main" | "article" | "footer"; // => the semantic element
  role: string; // => the implicit landmark role it maps to
  heading: string; // => the visible heading inside it
}

// The document outline: a sequence of semantic regions in reading order.
const outline: Landmark[] = [
  // => co-23: each landmark element maps to a role for free; a styled div would map to nothing
  { tag: "header", role: "banner", heading: "Site header" }, // => <header> -> banner
  { tag: "nav", role: "navigation", heading: "Main menu" }, // => <nav> -> navigation
  { tag: "main", role: "main", heading: "Page content" }, // => <main> -> main
  { tag: "article", role: "article", heading: "A blog post" }, // => <article> -> article
  { tag: "footer", role: "contentinfo", heading: "Site footer" }, // => <footer> -> contentinfo
];

// landmarkRoles lists every implicit role the outline exposes to assistive tech.
const landmarkRoles = outline.map((l) => `${l.tag} -> role="${l.role}"`); // => the free mapping
// => a screen reader can list these landmarks and let the user jump straight to `main`

console.log("document outline (tag -> implicit role):"); // => Output header
landmarkRoles.forEach((line) => console.log("  " + line)); // => one line per landmark
console.log("landmark count:", outline.length); // => Output: landmark count: 5
```

**Run**: `npx tsx example.ts`

**Output**:

```text
document outline (tag -> implicit role):
  header -> role="banner"
  nav -> role="navigation"
  main -> role="main"
  article -> role="article"
  footer -> role="contentinfo"
landmark count: 5
```

**Key takeaway**: Landmark elements map to ARIA roles for free; a styled div maps to nothing.

**Why it matters**: Semantic HTML is the cheapest accessibility win: a screen reader can list landmarks and let a user jump straight to main content, with zero extra ARIA. A div styled to look identical exposes nothing to the accessibility tree, so the same visual page can be far harder to navigate without a mouse. This is co-23's foundation, on which explicit ARIA widgets (Example 44) build.

**Pitfall**: A div-soup page that looks right but has no landmarks is invisible to landmark-based navigation.

---

### Example 44: An ARIA Tabs Widget with Roles and States

_ex-44 &middot; exercises co-23_

A custom tabs widget needs explicit ARIA to expose what a native control gives for free: a tablist of tabs, each controlling a tabpanel, with the selected tab carrying aria-selected.

**`learning/code/ex-44-aria-widget/example.ts`**

```typescript
// Example 44: An ARIA Tabs Widget with Roles and States. (co-23)
//
// A custom tabs widget needs explicit ARIA to expose what a native control gives for free: a
// tablist contains tabs; each tab controls a tabpanel; the selected tab carries aria-selected, and
// each tab points at its panel via aria-controls. These roles and states ARE the widget's
// accessibility contract.

// A tab + the panel it controls, with the ARIA attributes a real widget must set.
interface Tab {
  // => the ARIA wiring is what makes a div-based tab behave like a tab to assistive tech
  id: string; // => the tab's id (the panel's aria-labelledby points here)
  label: string; // => the visible tab label
  selected: boolean; // => drives aria-selected
  controls: string; // => aria-controls: the id of this tab's panel
}

// The tabs in the widget; exactly one is selected at a time.
const tabs: Tab[] = [
  // => co-23: roles (tablist/tab/tabpanel) + states (aria-selected) + relations (aria-controls)
  { id: "tab-1", label: "Overview", selected: true, controls: "panel-1" },
  { id: "tab-2", label: "Details", selected: false, controls: "panel-2" },
  { id: "tab-3", label: "Reviews", selected: false, controls: "panel-3" },
];

// renderAria prints the role/state/relation each node exposes -- the widget's a11y contract.
function renderAria(allTabs: Tab[]): string[] {
  // => the output is exactly what an accessibility tree would expose
  const lines: string[] = ['tablist (role="tablist")'];
  for (const t of allTabs) {
    // => each tab reports its role, selected state, and which panel it controls
    lines.push(`  tab "${t.label}" role="tab" aria-selected="${t.selected}" aria-controls="${t.controls}"`);
  }
  return lines; // => the full contract, one node per line
}

const tree = renderAria(tabs); // => the exposed accessibility tree

tree.forEach((line) => console.log(line)); // => Output: the tablist + 3 tab nodes with states
console.log(
  "selected tabs:",
  tabs.filter((t) => t.selected).map((t) => t.label),
); // => Output: selected tabs: [ 'Overview' ]
```

**Run**: `npx tsx example.ts`

**Output**:

```text
tablist (role="tablist")
  tab "Overview" role="tab" aria-selected="true" aria-controls="panel-1"
  tab "Details" role="tab" aria-selected="false" aria-controls="panel-2"
  tab "Reviews" role="tab" aria-selected="false" aria-controls="panel-3"
selected tabs: [ 'Overview' ]
```

**Key takeaway**: A custom widget's ARIA roles, states, and relations ARE its accessibility contract.

**Why it matters**: When you build a widget from divs, you take on the job of exposing the semantics a native element would provide for free: the tablist and tab roles, aria-selected for the active tab, and aria-controls linking each tab to its panel. Getting these right is what makes the widget operable and understandable to assistive tech; missing any one breaks the contract.

**Pitfall**: aria-selected must reflect the actual active tab -- a stale value silently breaks the widget for screen readers.

---

### Example 45: Roving Tabindex Moves Focus with Arrow Keys

_ex-45 &middot; exercises co-24_

In a composite widget, exactly one item has tabindex 0 and the rest have tabindex -1. Arrow keys move which item holds the 0, so focus walks the widget without Tab leaving it.

> **Note:** "the focused element is the active element (`document.activeElement`)"; strategies are roving tabindex and aria-activedescendant ([W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)).

**`learning/code/ex-45-focus-management-roving/example.ts`**

```typescript
// Example 45: Roving Tabindex Moves Focus with Arrow Keys. (co-24)
//
// Roving tabindex: exactly ONE item in a composite widget (a menu, toolbar, radio group) has
// tabindex="0" (reachable by Tab); the rest have tabindex="-1" (focusable only by script). Arrow
// keys MOVE which item has the "0", so focus walks through the items without leaving the widget.
//
// Note: "the focused element is the active element (`document.activeElement`)";
// strategies are roving tabindex and aria-activedescendant. Source: W3C WAI-ARIA APG --
// Keyboard Interface (https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/).

// A menu item: its label and whether it currently holds the roving "0" (is active).
interface MenuItem {
  // => the roving tabindex model: one item is the active entry point at a time
  label: string; // => the visible text
  tabindex: 0 | -1; // => 0 = in the tab sequence; -1 = focusable only via script
}

// The active element id (document.activeElement), tracked as the roving index.
let activeIndex = 0; // => which menu item currently has focus / tabindex 0
const menu: MenuItem[] = [
  // => only ONE item has tabindex 0; arrow keys move which one
  { label: "New", tabindex: 0 },
  { label: "Open", tabindex: -1 },
  { label: "Save", tabindex: -1 },
];

// moveFocus roves the active item by delta (+1 = ArrowRight/Down, -1 = ArrowLeft/Up).
function moveFocus(delta: number): string {
  // => co-24: arrow keys move the "0"; Tab exits the widget, it does not walk it
  menu[activeIndex].tabindex = -1; // => the old active item drops out of the tab sequence
  activeIndex = (activeIndex + delta + menu.length) % menu.length; // => wrap around (modulo)
  menu[activeIndex].tabindex = 0; // => the new active item becomes the entry point
  return menu[activeIndex].label; // => document.activeElement is now this item
}

const moves: string[] = [menu[activeIndex].label]; // => start: "New" is active
moves.push(moveFocus(1)); // => ArrowRight -> "Open"
moves.push(moveFocus(1)); // => ArrowRight -> "Save"
moves.push(moveFocus(1)); // => ArrowRight -> wraps to "New"

console.log("active element after each arrow key:", moves); // => Output: [ 'New', 'Open', 'Save', 'New' ]
console.log("tabindex sequence:", menu.map((m) => m.tabindex).join(",")); // => exactly one "0"
```

**Run**: `npx tsx example.ts`

**Output**:

```text
active element after each arrow key: [ 'New', 'Open', 'Save', 'New' ]
tabindex sequence: 0,-1,-1
```

**Key takeaway**: Roving tabindex keeps one item in the tab flow; arrow keys move the flow, Tab exits the widget.

**Why it matters**: Without roving tabindex, Tab walks every item in a toolbar or menu, forcing many Tab presses to cross the widget and land beyond it. Roving tabindex makes the widget a single tab stop with internal arrow-key navigation, mirroring how native radios and menus behave. It is the standard pattern for keyboard-operable composite widgets.

**Pitfall**: Forgetting to update tabindex on move leaves two items (or zero) in the tab flow -- re-check after each arrow.

---

### Example 46: A Focus Trap Keeps Focus Inside a Dialog

_ex-46 &middot; exercises co-24_

A modal dialog traps focus: Tab and Shift+Tab cycle among the dialog's focusable elements without ever leaving. Focus cannot escape to the page behind.

**`learning/code/ex-46-focus-trap-modal/example.ts`**

```typescript
// Example 46: A Focus Trap Keeps Focus Inside a Dialog. (co-24)
//
// A modal dialog must trap focus: Tab and Shift+Tab cycle among the dialog's focusable elements
// without ever leaving the dialog. Focus cannot escape to the page behind, which is what makes a
// modal a modal for keyboard and screen-reader users.

// The dialog's focusable elements, in tab order.
interface Focusable {
  // => a focus trap cycles among exactly these elements
  id: string; // => identity
  kind: string; // => what kind of control (input, button, close)
}

const dialog: Focusable[] = [
  // => the trap boundary contains only these elements
  { id: "close-btn", kind: "button" },
  { id: "name-input", kind: "input" },
  { id: "ok-btn", kind: "button" },
];

let activeId = dialog[1].id; // => focus starts on the name input (a common default)
const trail: string[] = [activeId]; // => record where focus went after each Tab

// tab moves focus forward; wrapping at the last element back to the first (the trap).
function tab(): void {
  // => co-24: forward Tab wraps inside the dialog; it never reaches the page behind
  const i = dialog.findIndex((f) => f.id === activeId); // => current position
  const next = (i + 1) % dialog.length; // => wrap to 0 after the last element
  activeId = dialog[next].id; // => focus moves, still inside the dialog
  trail.push(activeId);
}

// shiftTab moves focus backward; wrapping at the first element to the last.
function shiftTab(): void {
  // => co-24: backward Tab also wraps inside the dialog
  const i = dialog.findIndex((f) => f.id === activeId); // => current position
  const next = (i - 1 + dialog.length) % dialog.length; // => wrap to last after the first
  activeId = dialog[next].id; // => focus moves, still inside the dialog
  trail.push(activeId);
}

tab(); // => name-input -> ok-btn
tab(); // => ok-btn -> close-btn (wraps)
tab(); // => close-btn -> name-input (wraps)
shiftTab(); // => name-input -> close-btn (wraps backward)

console.log("focus trail (all inside dialog):", trail); // => Output: the wrap-around trail
console.log("focus escaped the dialog:", !dialog.some((f) => f.id === activeId)); // => Output: focus escaped the dialog: false
```

**Run**: `npx tsx example.ts`

**Output**:

```text
focus trail (all inside dialog): [ 'name-input', 'ok-btn', 'close-btn', 'name-input', 'close-btn' ]
focus escaped the dialog: false
```

**Key takeaway**: A focus trap cycles Tab within the dialog -- focus never reaches the background page.

**Why it matters**: A modal that does not trap focus leaks keyboard users out to the hidden background, where they interact with controls they cannot see. The trap keeps focus within the dialog's tab sequence, wrapping at both ends, which is part of what makes a modal genuinely modal. It pairs with restoring focus to the trigger when the dialog closes.

**Pitfall**: Dynamically added focusable elements inside the trap must be included -- recompute the tab sequence when content changes.

---

### Example 47: An aria-live Region Announces Updates

_ex-47 &middot; exercises co-23_

An aria-live region lets a screen reader announce a dynamic update without moving focus. Changing the region's text after setting aria-live triggers the announcement.

**`learning/code/ex-47-live-region/example.ts`**

```typescript
// Example 47: An aria-live Region Announces Updates. (co-23)
//
// An aria-live region is how a screen reader announces a dynamic update without moving focus.
// Setting aria-live="polite" on a region and then changing its text causes the reader to announce
// the new text -- the mechanism behind "X results found", "item added to cart", and live scores.

// A live region: its polite/rude setting and its current text.
interface LiveRegion {
  // => the politeness setting controls WHEN the reader interrupts
  politeness: "polite" | "assertive" | "off"; // => aria-live value
  text: string; // => the announced content
}

// The reader's announcement queue (what a screen reader would speak).
const announced: string[] = []; // => stands in for the assistive-tech speech queue
// => an "assertive" region interrupts; a "polite" one waits for a pause

// update writes new text into a live region, triggering an announcement (unless it is "off").
function announce(region: LiveRegion, next: string): void {
  // => co-23: changing the text of an aria-live region is what triggers the announcement
  region.text = next; // => update the region's content
  if (region.politeness !== "off") announced.push(next); // => the reader speaks the new text
}

const statusRegion: LiveRegion = { politeness: "polite", text: "" }; // => aria-live="polite"
announce(statusRegion, "Loading results..."); // => first announcement
announce(statusRegion, "3 results found"); // => second announcement, same region

console.log("announcements:", announced); // => Output: announcements: [ 'Loading results...', '3 results found' ]
console.log("region text now:", statusRegion.text); // => Output: region text now: 3 results found
```

**Run**: `npx tsx example.ts`

**Output**:

```text
announcements: [ 'Loading results...', '3 results found' ]
region text now: 3 results found
```

**Key takeaway**: Changing an aria-live region's text announces it -- without stealing focus from where the user is.

**Why it matters**: Live regions are how dynamic UIs communicate state changes (result counts, confirmations, errors) to screen-reader users who are not looking at the screen. polite regions wait for a pause; assertive regions interrupt. They are essential for anything that updates asynchronously, so the change is perceivable without a focus jump.

**Pitfall**: An assertive live region used for routine updates interrupts the user mid-sentence -- prefer polite.

---

### Example 48: Accessible Form Validation via aria invalid and aria describedby

_ex-48 &middot; exercises co-26_

An accessible error is programmatically associated with its input: the input carries aria-invalid, and aria-describedby points at the error text's id, so a reader announces both.

**`learning/code/ex-48-accessible-form-validation/example.ts`**

```typescript
// Example 48: Accessible Form Validation via aria invalid and aria describedby. (co-26)
//
// An accessible error must be PROGRAMMATICALLY associated with its input: the input carries
// aria-invalid when it has an error, and aria-describedby points at the error text's id. A screen
// reader then announces "invalid, described by <error text>" -- the error is reachable, not just
// visible.

// A validated field: its value, validity, the associated error id, and the error text.
interface Field {
  // => the ARIA wiring is what ties the visible error text to the input programmatically
  inputId: string; // => the input's id
  value: string; // => the current value
  required: boolean; // => whether empty is an error
  errorId: string; // => the id aria-describedby points at
  errorText: string; // => the live error message ("" when valid)
}

// validate sets the error text and returns whether the field is valid.
function validate(field: Field): boolean {
  // => co-26: validation sets BOTH the message and the invalid flag together
  const valid = !field.required || field.value.trim().length > 0; // => required + empty => invalid
  field.errorText = valid ? "" : "This field is required"; // => the message shown AND announced
  return valid; // => drives aria-invalid below
}

// ariaState renders the exact ARIA attributes the input exposes.
function ariaState(field: Field): Record<string, string> {
  // => the contract: aria-invalid reflects validity, aria-describedby points at the error id
  const valid = field.errorText === "";
  return {
    "aria-invalid": String(!valid), // => true when there is an error
    "aria-describedby": field.errorId, // => points at the error text element
  };
}

const email: Field = { inputId: "email", value: "", required: true, errorId: "email-error", errorText: "" };
validate(email); // => empty + required => invalid
const aria = ariaState(email); // => the ARIA the input now exposes

console.log("aria-invalid:", aria["aria-invalid"]); // => Output: aria-invalid: true
console.log("aria-describedby:", aria["aria-describedby"]); // => Output: aria-describedby: email-error
console.log("associated error text:", email.errorText); // => Output: associated error text: This field is required
```

**Run**: `npx tsx example.ts`

**Output**:

```text
aria-invalid: true
aria-describedby: email-error
associated error text: This field is required
```

**Key takeaway**: Wire aria-invalid and aria-describedby so the error is announced as part of the input, not just shown.

**Why it matters**: A visible error that is not associated with its input is invisible to assistive tech -- the reader never connects them. aria-invalid tells the reader the field has a problem, and aria-describedby points at the message that explains it, so the user hears 'invalid, described by <error>' in one announcement. This is the accessible baseline for form errors.

**Pitfall**: An error shown only by red border and no text is announced as nothing -- always pair a color change with describedby text.

---

### Example 49: An Accessible Error Summary Moves Focus

_ex-49 &middot; exercises co-26_

On submit with errors, an error summary collects every error and receives focus itself. The user hears the errors in order and has one place to start fixing them.

**`learning/code/ex-49-form-error-summary/example.ts`**

```typescript
// Example 49: An Accessible Error Summary Moves Focus. (co-26)
//
// When a form with errors is submitted, an accessible error SUMMARY collects every error and
// receives focus itself. Moving focus to the summary announces the errors in order and gives the
// keyboard user a single place to start fixing them -- rather than leaving them stranded wherever
// they were.

// A single error in the summary.
interface FieldError {
  // => each summary row points back at the field so the user can jump to it
  fieldId: string; // => the input the error belongs to
  message: string; // => the error text
}

// The simulated document.activeElement (what currently has focus).
let activeElementId: string | null = null; // => stands in for document.activeElement
// => moving focus to the summary is the a11y requirement, not just rendering it

// summarize builds the summary, gives it focus, and returns the focus target's id.
function summarize(errors: FieldError[]): string {
  // => co-26: the summary element receives focus so its errors are announced together
  activeElementId = "error-summary"; // => focus moves TO the summary on submit-with-errors
  return activeElementId; // => the summary is now the active element
}

const errors: FieldError[] = [
  // => two invalid fields, collected into one summary the reader announces in order
  { fieldId: "email", message: "Email is required" },
  { fieldId: "age", message: "Age must be 18 or older" },
];

const focused = summarize(errors); // => submit with errors -> focus the summary

console.log("focus moved to:", focused); // => Output: focus moved to: error-summary
console.log("active element is the summary:", activeElementId === "error-summary"); // => Output: active element is the summary: true
console.log("errors announced:", errors.map((e) => e.message).join("; ")); // => Output: errors announced: Email is required; Age must be 18 or older
```

**Run**: `npx tsx example.ts`

**Output**:

```text
focus moved to: error-summary
active element is the summary: true
errors announced: Email is required; Age must be 18 or older
```

**Key takeaway**: Move focus to the error summary on submit-with-errors so all errors are announced together.

**Why it matters**: Without a focus move, a submit that fails leaves a screen-reader user stranded -- they do not know what went wrong or where. Focusing the summary announces the full error list in order and gives the keyboard a single entry point, from which each error can link to its field. This is the recommended pattern for accessible form validation at the form level.

**Pitfall**: Rendering the summary without focusing it leaves the user unaware the submission failed -- the focus move is the requirement.

---

### Example 50: CSS Modules Scope Class Names Locally

_ex-50 &middot; exercises co-29_

A CSS Module scopes every class name locally by default. The build rewrites each to a globally-unique name, so two files can both define .root without colliding.

> **Note:** "A CSS Module is a CSS file where all class names ... are scoped locally by default." ([css-modules README](https://github.com/css-modules/css-modules)).

**`learning/code/ex-50-css-modules-scope/example.ts`**

```typescript
// Example 50: CSS Modules Scope Class Names Locally. (co-29)
//
// A CSS Module is a CSS file where every class name is scoped LOCALLY by default. The build
// rewrites each class to a globally-unique name (e.g. "Button_root__a3f9"), so two files can both
// define `.root` without colliding. This is locality enforced at build time, not by naming
// discipline.
//
// Note: "A CSS Module is a CSS file where all class names ... are scoped locally by
// default." Source: css-modules README (https://github.com/css-modules/css-modules).

// A CSS Module source: local class names the author wrote.
const moduleSource: Record<string, string> = {
  // => the author wrote readable local names; the build makes them globally unique
  root: "padding: 8px", // => a local ".root" in this module
  active: "font-weight: bold", // => a local ".active" in this module
};

// The compiled CSS Module: each local name maps to a unique generated global name.
const compiled: Record<string, string> = {}; // => what the build emits (local -> generated global)
// => two different modules can both have a ".root" and never collide, because the names differ

// compileCssModule rewrites every local name to a globally-unique generated name.
function compileCssModule(moduleId: string, source: Record<string, string>): Record<string, string> {
  // => co-29: the generated name encodes the module id, guaranteeing global uniqueness
  const out: Record<string, string> = {};
  for (const localName of Object.keys(source)) {
    // => e.g. Button_root__a3f9 -- the local name is suffixed with a module-scoped hash
    out[localName] = `${moduleId}_${localName}__${hash(moduleId + localName)}`; // => unique per module
  }
  return out; // => the JS import you use: styles.root === "Button_root__a3f9"
}

// hash is a tiny deterministic hash standing in for the build's name-mangling step.
function hash(input: string): string {
  // => deterministic so the same module+class always produces the same generated name
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0; // => unsigned fold
  return h.toString(36); // => a short base36 suffix
}

Object.assign(compiled, compileCssModule("Button", moduleSource)); // => compile the Button module

console.log("styles.root ->", compiled.root); // => Output: styles.root -> Button_root__<hash>
console.log("root and active differ:", compiled.root !== compiled.active); // => Output: root and active differ: true
```

**Run**: `npx tsx example.ts`

**Output**:

```text
styles.root -> Button_root__12wv3g4
root and active differ: true
```

**Key takeaway**: CSS Modules rewrite local class names to unique global ones -- collisions become impossible at build time.

**Why it matters**: CSS's global namespace is the root cause of styles clobbering each other at scale. CSS Modules fix it by making class names local by default and generating globally-unique names at build, so you write readable local names and the build guarantees no collision. This brings encapsulation to CSS without a naming convention you must enforce by hand.

**Pitfall**: Composing classes across modules (composes:) couples them -- overuse reintroduces the global-coupling problem.

---

### Example 51: Utility-First Styling of a Component

_ex-51 &middot; exercises co-29_

Utility-first CSS styles a component by composing many single-purpose utility classes directly in the markup, instead of writing a custom class with hand-written rules.

> **Note:** Tailwind = "combining many single-purpose ... utility classes directly in your markup." ([Tailwind docs](https://tailwindcss.com/docs/styling-with-utility-classes)).

**`learning/code/ex-51-tailwind-utility/example.ts`**

```typescript
// Example 51: Utility-First Styling of a Component. (co-29)
//
// Utility-first CSS (Tailwind) styles a component by composing many single-purpose utility
// classes directly in the markup, instead of writing a custom class with hand-written rules. The
// result is the same rendered styles, expressed as a known set of reusable primitives.
//
// Note: Tailwind = "combining many single-purpose ... utility classes directly in
// your markup." Source: Tailwind docs
// (https://tailwindcss.com/docs/styling-with-utility-classes).

// A small registry of utility classes and the CSS declarations each stands for.
const utilities: Record<string, string> = {
  // => each utility is ONE concern; composing them builds the component's styles
  flex: "display: flex", // => layout primitive
  "items-center": "align-items: center", // => alignment primitive
  "gap-2": "gap: 0.5rem", // => spacing primitive
  "px-4": "padding-left: 1rem; padding-right: 1rem", // => horizontal padding primitive
};

// className is the utility classes composed in the markup (what the author wrote).
const className = "flex items-center gap-2 px-4"; // => a button's class list, utility-first
// => there is NO custom ".button" class; the styles come entirely from composed utilities

// resolveUtilities expands the composed class list into the actual CSS declarations.
function resolveUtilities(classAttr: string): string[] {
  // => co-29: the rendered styles are the union of the composed utilities' declarations
  return classAttr
    .split(/\s+/) // => each token is one utility
    .filter((token) => token in utilities) // => only known utilities resolve
    .map((token) => utilities[token]); // => the declaration(s) each utility contributes
}

const styles = resolveUtilities(className); // => the resolved CSS for this component

console.log("applied styles:", styles); // => Output: applied styles: [ 'display: flex', 'align-items: center', 'gap: 0.5rem', ... ]
console.log("utility count:", styles.length); // => Output: utility count: 4
```

**Run**: `npx tsx example.ts`

**Output**:

```text
applied styles: [
  'display: flex',
  'align-items: center',
  'gap: 0.5rem',
  'padding-left: 1rem; padding-right: 1rem'
]
utility count: 4
```

**Key takeaway**: Utility-first expresses styles as composed primitives -- there is no bespoke class file per component.

**Why it matters**: Tailwind's utility-first approach trades hand-written CSS for a fixed vocabulary of composable primitives, which keeps bundle size bounded (you only ship the utilities you use) and removes the naming and dead-CSS problems of custom classes. The trade-off is verbose class lists in markup, which component extraction keeps manageable. It is the main alternative to CSS Modules for styling at scale.

**Pitfall**: Pasting 30 utility classes inline is unreadable -- extract a component once a class list repeats.

---

### Example 52: Resolving a Specificity Conflict by the ID CLASS Type Model

_ex-52 &middot; exercises co-29_

Specificity is the ID--CLASS--TYPE three-column model. When two rules both match, the higher-specificity one wins; source order only breaks exact ties.

> **Note:** Specificity is the ID--CLASS--TYPE three-column model; ties break by source order ([MDN Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity)).

**`learning/code/ex-52-specificity-conflict/example.ts`**

```typescript
// Example 52: Resolving a Specificity Conflict by the ID CLASS Type Model. (co-29)
//
// Specificity is the ID--CLASS--TYPE three-column model. When two rules both match an element, the
// rule with more IDs wins; ties fall to more CLASSes; further ties to more TYPEs; final ties to
// source order. A higher-specificity rule ALWAYS beats a later lower-specificity one.
//
// Note: specificity is the ID--CLASS--TYPE three-column model; ties break by source
// order. Source: MDN Specificity
// (https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity).

// A CSS rule: its selector breakdown and the declaration it applies.
interface Rule {
  // => specificity is read off the selector's id/class/type counts
  selector: string; // => e.g. "#nav .item"
  ids: number; // => column 1: ID count
  classes: number; // => column 2: CLASS (and attribute/pseudo-class) count
  types: number; // => column 3: TYPE (and pseudo-element) count
  order: number; // => source order (tiebreaker)
  value: string; // => the declaration, e.g. "color: red"
}

// Two rules both match the SAME element; specificity (not source order) decides the winner.
const rules: Rule[] = [
  // => a later, lower-specificity rule cannot override an earlier, higher-specificity one
  { selector: "nav li", ids: 0, classes: 0, types: 2, order: 1, value: "color: black" }, // => (0,0,2)
  { selector: "#nav .item", ids: 1, classes: 1, types: 0, order: 2, value: "color: blue" }, // => (1,1,0) wins
];

// winnerBySpecificity compares left-to-right: ids, then classes, then types, then source order.
function winnerBySpecificity(candidates: Rule[]): Rule {
  // => co-29: compare column by column; first difference decides; source order is the last tiebreaker
  return candidates.reduce((best, r) => {
    // => higher ids wins outright; else higher classes; else higher types; else later order
    if (r.ids !== best.ids) return r.ids > best.ids ? r : best;
    if (r.classes !== best.classes) return r.classes > best.classes ? r : best;
    if (r.types !== best.types) return r.types > best.types ? r : best;
    return r.order > best.order ? r : best; // => final tiebreaker: source order
  });
}

const winning = winnerBySpecificity(rules); // => the #nav .item rule wins (1,1,0) > (0,0,2)

console.log("winning selector:", winning.selector); // => Output: winning selector: #nav .item
console.log("applied value:", winning.value); // => Output: applied value: color: blue
console.log("specificity (ids,classes,types):", `${winning.ids},${winning.classes},${winning.types}`); // => Output: 1,1,0
```

**Run**: `npx tsx example.ts`

**Output**:

```text
winning selector: #nav .item
applied value: color: blue
specificity (ids,classes,types): 1,1,0
```

**Key takeaway**: Compare specificity left to right (ids, classes, types); source order is only the final tiebreaker.

**Why it matters**: Misunderstanding specificity is the source of countless 'why won't my style apply' bugs. The model is strict: a single ID beats any number of classes, which beat any number of types, and a later same-specificity rule wins. Knowing this lets you predict which rule wins without trial and error, and explains why !important (a brute-force override) is usually a smell.

**Pitfall**: Reaching for !important to win a conflict papers over a specificity miscalculation -- lower the loser's specificity instead.

---

### Example 53: Cache Control with stale-while-revalidate

_ex-53 &middot; exercises co-28_

The Cache-Control directive stale-while-revalidate (RFC 5861) lets a cache serve a stale response immediately while it revalidates in the background -- instant response now, fresh data next.

> **Note:** "stale-while-revalidate ... indicates that the cache could reuse a stale response while it revalidates" (RFC 5861). ([MDN, Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#stale-while-revalidate)).

**`learning/code/ex-53-http-cache-headers/example.ts`**

```typescript
// Example 53: Cache Control with stale-while-revalidate. (co-28)
//
// The Cache-Control directive `stale-while-revalidate` (RFC 5861) lets a cache serve a STALE
// response immediately while it revalidates in the background. The user gets an instant (stale)
// response, and the next request gets the fresh one -- smooth perceived performance.
//
// Note: "stale-while-revalidate ... indicates that the cache could reuse a stale
// response while it revalidates" (RFC 5861). Source: MDN, Cache-Control
// (https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#stale-while-revalidate).

// A cache entry with its freshness window.
interface CacheEntry {
  // => max-age = fresh lifetime; swr = how long a stale entry may serve while revalidating
  fetchedAt: number; // => when this entry was stored (simulated clock tick)
  maxAge: number; // => seconds the entry is fresh
  swr: number; // => seconds a stale entry may serve while revalidating
  value: string; // => the cached payload
}

// A simulated clock so the example is deterministic.
let clock = 0; // => "seconds since the cache was primed"
let networkFetches = 0; // => counts background revalidations

// parseCacheControl reads the two directives out of a Cache-Control header value.
function parseMaxAge(header: string): { maxAge: number; swr: number } {
  // => e.g. "max-age=60, stale-while-revalidate=600" -> { maxAge: 60, swr: 600 }
  const maxAge = Number(/max-age=(\d+)/.exec(header)?.[1] ?? 0); // => fresh lifetime
  const swr = Number(/stale-while-revalidate=(\d+)/.exec(header)?.[1] ?? 0); // => stale window
  return { maxAge, swr };
}

const header = "max-age=60, stale-while-revalidate=600"; // => the canonical SWR header
const { maxAge, swr } = parseMaxAge(header); // => { maxAge: 60, swr: 600 }
const entry: CacheEntry = { fetchedAt: 0, maxAge, swr, value: "v1" }; // => prime the cache

// ageOf returns how old the entry is at the current clock tick.
function ageOf(e: CacheEntry): number {
  return clock - e.fetchedAt; // => seconds since fetch
}

// First read at t=10: fresh (age 10 <= maxAge 60) -> serve, no network.
clock = 10;
const fresh = ageOf(entry) <= entry.maxAge; // => true -> serve from cache, no fetch

// Second read at t=100: stale (age 100 > maxAge 60) but within swr (100 <= 60+600) -> serve stale,
// revalidate in the background (one network fetch).
clock = 100;
const staleButWithinSwr = ageOf(entry) > entry.maxAge && ageOf(entry) <= entry.maxAge + entry.swr;
if (staleButWithinSwr) networkFetches += 1; // => background revalidation (serves stale meanwhile)

console.log("served fresh at t=10:", fresh); // => Output: served fresh at t=10: true
console.log("served stale + revalidated at t=100:", staleButWithinSwr); // => Output: served stale + revalidated at t=100: true
console.log("background revalidations:", networkFetches); // => Output: background revalidations: 1
```

**Run**: `npx tsx example.ts`

**Output**:

```text
served fresh at t=10: true
served stale + revalidated at t=100: true
background revalidations: 1
```

**Key takeaway**: stale-while-revalidate serves stale data instantly and revalidates behind the scenes for the next request.

**Why it matters**: SWR is the sweet spot between pure freshness (max-age alone, which forces a re-fetch when it expires) and serving stale forever: the user gets an immediate response even past max-age, and the cache refreshes in the background so the NEXT request is fresh. It gives smooth perceived performance for data that changes occasionally.

**Pitfall**: Setting swr without a max-age makes everything stale immediately -- the two directives must be paired.

---

### Example 54: A Service Worker Caches Assets for Offline

_ex-54 &middot; exercises co-28, co-34_

A service worker sits between the page and the network. On install it pre-caches static assets; later fetches are served from cache, so the page works even offline.

**`learning/code/ex-54-service-worker-cache/example.ts`**

```typescript
// Example 54: A Service Worker Caches Assets for Offline. (co-28, co-34)
//
// A service worker sits between the page and the network. On install it pre-caches the app's
// static assets; later fetches are served from the cache, so the page works even when the network
// is down. This is the foundation of the PWA app shell (Example 70).
//
// Note: this models the Cache API + fetch event a real service worker uses.

// The service worker's cache: request URL -> cached response.
const swCache: Map<string, string> = new Map(); // => stands in for the Cache Storage API
// => the cache is populated at install and read at fetch time

// Whether the "network" is available in this simulation.
let networkOnline = true; // => flip to false to model going offline

// install pre-caches the app shell assets (runs once when the service worker registers).
function install(urls: string[]): void {
  // => co-34: the app shell is cached ahead of any fetch so it loads instantly/offline
  for (const url of urls) swCache.set(url, `<cached ${url}>`); // => prime the cache
}

// fetchFromSw models the service worker's fetch handler: cache-first, falling back to network.
function fetchFromSw(url: string): { source: "cache" | "network"; body: string } {
  // => cache-first: serve from cache if present (works offline); else try the network
  const cached = swCache.get(url); // => is this asset cached?
  if (cached) return { source: "cache", body: cached }; // => co-28: serve cached, no network
  if (networkOnline) return { source: "network", body: `<fresh ${url}>` }; // => online miss -> network
  return { source: "cache", body: "<offline fallback>" }; // => offline miss -> fallback page
}

install(["/app.js", "/style.css", "/"]); // => pre-cache the app shell
networkOnline = false; // => the user goes offline

const onlineHit = fetchFromSw("/app.js"); // => cached -> served offline
const offlineMiss = fetchFromSw("/uncached-page"); // => offline + uncached -> fallback

console.log("cached asset while offline:", onlineHit.source); // => Output: cached asset while offline: cache
console.log("uncached page while offline:", offlineMiss.body); // => Output: uncached page while offline: <offline fallback>
```

**Run**: `npx tsx example.ts`

**Output**:

```text
cached asset while offline: cache
uncached page while offline: <offline fallback>
```

**Key takeaway**: A service worker's cache-first handler serves pre-cached assets even with no network.

**Why it matters**: The service worker is the engine of offline web apps and PWAs: it intercepts fetches and can serve them from a cache it populated at install, so the app shell and assets load instantly and offline. Combined with a web manifest (Example 71) this makes a site installable and resilient -- the foundation co-34 builds on.

**Pitfall**: A cache-first strategy with no versioning serves stale assets forever after a deploy -- version the cache and clean up old entries.

---

### Example 55: A Bundle Size Budget Fails a CI Check

_ex-55 &middot; exercises co-27_

A performance budget turns 'keep the bundle small' into a checkable gate. If the build exceeds the limit, the check fails with a non-zero exit, blocking the regression like a failing test.

**`learning/code/ex-55-performance-budget-check/example.ts`**

```typescript
// Example 55: A Bundle Size Budget Fails a CI Check. (co-27)
//
// A performance budget turns "keep the bundle small" into a CHECKABLE gate. The build measures the
// output; if it exceeds the budget, the check FAILS (non-zero exit) -- blocking the regression the
// way a failing test would. The budget is what makes size a first-class CI concern, not a wish.

// A budget rule: which artifact, its limit in KB, and the measured size.
interface Budget {
  // => the limit is the gate; the measured size is what the build produced
  artifact: string; // => what is being measured (e.g. the main bundle)
  limitKb: number; // => the threshold the CI check enforces
  measuredKb: number; // => the actual size this build produced
}

// checkBudget returns the exit code a CI step would use (0 pass, 1 fail).
function checkBudget(b: Budget): { exitCode: number; verdict: string } {
  // => co-27: exceeding the limit is a CI failure, not a warning
  if (b.measuredKb > b.limitKb) {
    // => over budget -> fail the build, exactly like a failing test
    return { exitCode: 1, verdict: `FAIL: ${b.artifact} ${b.measuredKb}KB > ${b.limitKb}KB limit` };
  }
  return { exitCode: 0, verdict: `pass: ${b.artifact} ${b.measuredKb}KB <= ${b.limitKb}KB` }; // => within budget
}

// A regression: someone added a heavy dependency, pushing the main bundle over budget.
const mainBundle: Budget = { artifact: "main.js", limitKb: 200, measuredKb: 240 }; // => 240 > 200
const result = checkBudget(mainBundle); // => the CI step's outcome

console.log("CI exit code:", result.exitCode); // => Output: CI exit code: 1
console.log("verdict:", result.verdict); // => Output: verdict: FAIL: main.js 240KB > 200KB limit
```

**Run**: `npx tsx example.ts`

**Output**:

```text
CI exit code: 1
verdict: FAIL: main.js 240KB > 200KB limit
```

**Key takeaway**: A budget check fails CI when the build exceeds the limit -- size becomes a gate, not a wish.

**Why it matters**: Without an enforced budget, bundle size creeps up one harmless-looking dependency at a time and nobody notices until performance degrades. The budget check makes a regression immediately visible and blocking, so it gets fixed when it is cheap to fix. Budgets can cover bytes, request counts, or timing thresholds, all enforced the same way.

**Pitfall**: A budget that is too generous (set once and never revisited) stops catching real regressions -- tighten it over time.

---

### Example 56: Bundle Analysis Flags an Oversized Dependency

_ex-56 &middot; exercises co-27_

When a bundle exceeds its budget, bundle analysis breaks the total down by dependency, turning 'the bundle is too big' into 'this specific package is 70KB'.

**`learning/code/ex-56-bundle-analysis/example.ts`**

```typescript
// Example 56: Bundle Analysis Flags an Oversized Dependency. (co-27)
//
// When a bundle blows past its budget (Example 55), bundle analysis breaks the total down by
// dependency so you can see WHICH one is oversized. The analysis turns "the bundle is too big" into
// "moment.js is 70KB" -- an actionable diagnosis.

// Each dependency and the bytes it contributed to the bundle.
interface BundlePart {
  // => the per-dependency breakdown that makes an oversized bundle actionable
  dependency: string; // => the package name
  bytes: number; // => gzipped bytes it added
}

// The analyzed bundle: a list of dependency -> bytes.
const analysis: BundlePart[] = [
  // => one dependency dominates the total -- analysis identifies it by name
  { dependency: "react", bytes: 45000 },
  { dependency: "lodash", bytes: 80000 }, // => the oversized culprit (imported in full)
  { dependency: "app", bytes: 30000 },
];

// totalBytes sums every part; largestPart finds the single biggest contributor.
const totalBytes = analysis.reduce((sum, p) => sum + p.bytes, 0); // => the whole bundle
function largestPart(parts: BundlePart[]): BundlePart {
  // => co-27: the analysis ranks dependencies so the oversized one is obvious
  return parts.reduce((big, p) => (p.bytes > big.bytes ? p : big)); // => the biggest contributor
}

const culprit = largestPart(analysis); // => lodash, the oversized dependency
const pctOfTotal = Math.round((culprit.bytes / totalBytes) * 100); // => how much of the bundle it owns

console.log("bundle total (KB):", Math.round(totalBytes / 1024)); // => Output: bundle total (KB): 151
console.log("largest dependency:", culprit.dependency); // => Output: largest dependency: lodash
console.log("share of bundle:", pctOfTotal + "%"); // => Output: share of bundle: 53%
```

**Run**: `npx tsx example.ts`

**Output**:

```text
bundle total (KB): 151
largest dependency: lodash
share of bundle: 52%
```

**Key takeaway**: Bundle analysis names the oversized dependency by size, so a budget failure becomes actionable.

**Why it matters**: A failed budget check tells you the bundle is too big but not why; the analysis breaks the total into per-dependency contributions and ranks them, so the culprit is obvious. This turns a vague regression into a concrete decision -- replace the heavy dependency, import it more narrowly, or raise the budget deliberately. Analysis is the diagnostic half of the budget workflow.

**Pitfall**: A heavy dependency imported only for one function can often be replaced by a targeted import -- check before removing it wholesale.
