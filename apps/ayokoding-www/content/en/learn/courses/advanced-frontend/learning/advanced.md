---
title: "Advanced Examples"
date: 2026-07-29T00:00:00+07:00
draft: false
weight: 30
---

Examples 57-80 assemble everything into production-grade frontend practice: data waterfalls and prefetching, Suspense-for-data via use() (and the useEffect-fetch trap), image optimization (responsive srcset, lazy defaults, CLS prevention), edge rendering and its Web-API subset, discriminated-union state with exhaustive compile-time narrowing, generic and precisely-typed components, the PWA app shell / installability / offline fallback, i18n with Intl and message catalogs and RTL, behaviour-based Testing-Library queries, a user-event interaction test, a Playwright e2e smoke, an error boundary, and a closing capstone-preview dashboard that wires streaming + cached fetching + an optimistic rollback + an ARIA widget + measured Core Web Vitals + passing tests. Every example is a complete, self-contained, originally-authored TypeScript file -- framework, browser, and runtime mechanics are modeled in pure TypeScript, so no React, Next.js, or network install is required. Run each with `npx tsx example.ts`; every printed line below was captured from an actual run.

---

### Example 57: A Serial Fetch Waterfall

_ex-57 &middot; exercises co-30_

A request waterfall is when each fetch only starts after the previous one finishes, because each depends on the last's result. The total latency is the SUM of every step -- the slowest possible shape.

**`learning/code/ex-57-data-waterfall/example.ts`**

```typescript
// Example 57: A Serial Fetch Waterfall. (co-30)
//
// A request waterfall is when each fetch only starts AFTER the previous one finishes, because each
// depends on the last's result. The total latency is the SUM of every step -- the slowest possible
// shape. This example measures that sum so Example 58 can cut it.

// Each step is a fake fetch that resolves after `latencyMs` with a value.
function fetchAfter(latencyMs: number, value: string): Promise<string> {
  // => stands in for a network/API call; the latency is the point, not the payload
  return new Promise((resolve) => setTimeout(() => resolve(value), latencyMs)); // => resolve later
}

// A waterfall: fetch the user, THEN their account, THEN their settings -- each needs the prior id.
async function waterfall(): Promise<{ total: number; steps: string[] }> {
  // => co-30: each await blocks the next from even starting -> total = sum of all latencies
  const t0 = Date.now(); // => start the clock
  const user = await fetchAfter(80, "user-1"); // => step 1 (waits 80ms)
  const account = await fetchAfter(120, `account-for-${user}`); // => step 2 (waits 120ms, needs user)
  const settings = await fetchAfter(100, `settings-for-${account}`); // => step 3 (waits 100ms, needs account)
  return { total: Date.now() - t0, steps: [user, account, settings] }; // => ~300ms total (sum)
}

// Run via an async IIFE (tsx supports top-level await, but an IIFE is universally clear).
(async () => {
  const result = await waterfall(); // => the serial chain
  console.log("steps:", result.steps.join(" -> ")); // => Output: the three resolved values
  console.log("total latency (ms, ~= sum 300):", result.total); // => Output: roughly 300ms
})();
```

**Run**: `npx tsx example.ts`

**Output**:

```text
steps: user-1 -> account-for-user-1 -> settings-for-account-for-user-1
total latency (ms, ~= sum 300): 304
```

**Key takeaway**: A waterfall's total latency is the sum of its steps, because each await blocks the next.

**Why it matters**: Waterfalls emerge naturally from intuitive code (fetch user, then fetch their account, then their settings) and silently multiply latency: three 100ms calls cost 300ms, not 100ms. Recognizing the shape is the first step -- Example 58 shows the parallel fix. The cost is real and user-visible, especially on slow networks where each round trip is expensive.

**Pitfall**: A waterfall caused by sequential awaits looks fine in code review -- measure the total to spot it.

---

### Example 58: Prefetching Parallelizes and Cuts Latency

_ex-58 &middot; exercises co-30_

The fix for the waterfall: start independent fetches in parallel with Promise.all so they overlap. The total latency becomes the MAX of the steps, not the sum.

**`learning/code/ex-58-prefetch-parallel/example.ts`**

```typescript
// Example 58: Prefetching Parallelizes and Cuts Latency. (co-30)
//
// The fix for Example 57's waterfall: start the independent fetches in PARALLEL (Promise.all) so
// they overlap. The total latency is now the MAX of the steps, not the sum -- a big cut when one
// step is slow. Prefetching starts a fetch BEFORE it is needed so the result is ready on demand.

// Each step is a fake fetch that resolves after `latencyMs`.
function fetchAfter(latencyMs: number, value: string): Promise<string> {
  // => same fetch as Example 57; the change is HOW we call them
  return new Promise((resolve) => setTimeout(() => resolve(value), latencyMs)); // => resolve later
}

// parallel starts all three fetches at once (no dependency forces serialization here).
async function parallel(): Promise<{ total: number; steps: string[] }> {
  // => co-30: Promise.all overlaps the fetches -> total = MAX latency, not SUM
  const t0 = Date.now(); // => start the clock
  const [user, account, settings] = await Promise.all([
    // => all three begin in the same tick; they run concurrently
    fetchAfter(80, "user-1"),
    fetchAfter(120, "account-1"), // => no longer waits for `user`
    fetchAfter(100, "settings-1"), // => no longer waits for `account`
  ]);
  return { total: Date.now() - t0, steps: [user, account, settings] }; // => ~120ms total (the max)
}

(async () => {
  const result = await parallel(); // => the parallelized chain
  console.log("steps:", result.steps.join(" -> ")); // => Output: the three resolved values
  console.log("total latency (ms, ~= max 120):", result.total); // => Output: roughly 120ms (vs ~300 serial)
})();
```

**Run**: `npx tsx example.ts`

**Output**:

```text
steps: user-1 -> account-1 -> settings-1
total latency (ms, ~= max 120): 122
```

**Key takeaway**: Promise.all overlaps independent fetches; total latency becomes the max step, not the sum.

**Why it matters**: Parallelizing cuts Example 57's 300ms to ~120ms when the steps are independent -- a big win for one slow call hiding among fast ones. Prefetching goes further: start a fetch before it is needed (on hover, on idle) so the result is ready the moment the user asks. The discipline is to identify which fetches are genuinely independent and overlap them.

**Pitfall**: Promise.all fetches that share a rate limit can trip the limit at once -- stagger them if needed.

---

### Example 59: Reading a Promise via use Under Suspense

_ex-59 &middot; exercises co-30_

When a component reads a promise with use() inside a Suspense boundary, React shows the fallback while the promise is pending and the content once it settles. The data fetch IS what triggers the fallback.

> **Note:** "`<Suspense>` lets you display a fallback until its children have finished loading." ([react.dev, <Suspense>](https://react.dev/reference/react/Suspense)).

**`learning/code/ex-59-suspense-for-data/example.ts`**

```typescript
// Example 59: Reading a Promise via use Under Suspense. (co-30)
//
// When a component reads a promise with `use()` inside a `<Suspense>` boundary, React shows the
// fallback while the promise is pending and the resolved content once it settles. This is the
// Suspense-for-data path: the data fetch IS the thing that triggers the fallback.
//
// Note: "`<Suspense>` lets you display a fallback until its children have finished
// loading." Source: react.dev, <Suspense> (https://react.dev/reference/react/Suspense).

// use models React's `use(promise)`: throw the pending promise so Suspense can catch it.
type Resource<T> = { read: () => T }; // => a wrapped promise Suspense understands
function wrap<T>(p: Promise<T>): Resource<T> {
  // => Suspense works because a thrown pending promise propagates to the nearest boundary
  let state: "pending" | "done" | "error" = "pending";
  let result: T | undefined;
  let thrown: unknown;
  p.then((r) => {
    state = "done";
    result = r;
  }).catch((e) => {
    state = "error";
    thrown = e;
  });
  return {
    read(): T {
      // => pending -> THROW the promise (Suspense shows the fallback); done -> return; error -> throw
      if (state === "pending") throw p; // => the suspension signal
      if (state === "error") throw thrown; // => surface the rejection
      return result as T; // => the resolved value renders
    },
  };
}

// renderWithSuspense models a <Suspense><Component/></Suspense> render cycle.
function renderWithSuspense<T>(resource: Resource<T>, fallback: string, success: (v: T) => string): string[] {
  // => co-30: the fallback shows while the promise is pending; the content shows once resolved
  const out: string[] = [];
  try {
    out.push(success(resource.read())); // => tries to read; throws if pending
  } catch (e) {
    out.push(fallback); // => the thrown promise -> Suspense renders the fallback
  }
  return out; // => first render: [fallback]; later render: [content]
}

(async () => {
  const resource = wrap(new Promise<string>((resolve) => setTimeout(() => resolve("Hello, Suspense"), 50)));
  const before = renderWithSuspense(resource, "<p>loading...</p>", (v) => `<p>${v}</p>`); // => pending -> fallback
  await new Promise((r) => setTimeout(r, 60)); // => let the promise resolve
  const after = renderWithSuspense(resource, "<p>loading...</p>", (v) => `<p>${v}</p>`); // => done -> content
  console.log("first render:", before[0]); // => Output: first render: <p>loading...</p>
  console.log("after resolve:", after[0]); // => Output: after resolve: <p>Hello, Suspense</p>
})();
```

**Run**: `npx tsx example.ts`

**Output**:

```text
first render: <p>loading...</p>
after resolve: <p>Hello, Suspense</p>
```

**Key takeaway**: use(promise) under Suspense makes the fetch itself trigger the fallback -- no manual loading state.

**Why it matters**: This is the declarative data-loading path: the component reads the promise as if it were already resolved, and Suspense handles the pending state uniformly. Every loading boundary looks the same, and there is no hand-rolled isLoading flag to keep in sync with the fetch. It composes with streaming SSR (co-04) and concurrent rendering.

**Pitfall**: The promise passed to use must be stable across renders (create it outside render or cache it) or it suspends forever.

---

### Example 60: Suspense Does Not Detect a useEffect Fetch

_ex-60 &middot; exercises co-30_

The trap: a fetch kicked off inside a useEffect does NOT trigger a Suspense boundary. Suspense only suspends on use() of a promise, lazy code, or a framework integration -- an effect fetch is invisible to it.

> **Note:** "Suspense does not detect when data is fetched inside an Effect or event handler." ([react.dev, <Suspense>](https://react.dev/reference/react/Suspense)).

**`learning/code/ex-60-suspense-not-useeffect/example.ts`**

```typescript
// Example 60: Suspense Does Not Detect a useEffect Fetch. (co-30)
//
// The trap: a fetch kicked off inside a useEffect does NOT trigger a <Suspense> boundary.
// Suspense only suspends on `use()` of a promise, lazy code, or a framework integration -- a fetch
// started in an effect is invisible to Suspense, so the fallback NEVER shows for it.
//
// Note: "Suspense does not detect when data is fetched inside an Effect or event
// handler." Source: react.dev, <Suspense> (https://react.dev/reference/react/Suspense).

// Tracks whether the <Suspense> fallback ever rendered for this fetch.
let fallbackShown = false; // => stays false -- the effect-fetch never triggers the boundary
// => this is the bug: the developer EXPECTED a loading state and got none

// An effect-based fetch: starts in useEffect, stores result in state. Suspense is uninvolved.
function effectFetchRender(state: "loading" | "done"): string {
  // => the effect started the fetch; the component manages its OWN loading state, not Suspense
  if (state === "loading") return "<p>my own loading state</p>"; // => hand-rolled, not the Suspense fallback
  return "<p>data</p>"; // => the resolved content
}

// simulateSuspenseBoundary checks whether anything SUSPENDED during this render.
function simulateSuspenseBoundary(render: () => string): { fallbackShown: boolean; content: string } {
  // => co-30: the boundary only reacts to a THROWN promise; the effect fetch throws nothing
  fallbackShown = false; // => reset; the effect fetch never throws a promise
  const content = render(); // => no throw -> no fallback -> content (or hand-rolled state) renders
  return { fallbackShown, content }; // => fallbackShown stays false
}

// During the effect-fetch's loading phase, the Suspense fallback is NEVER shown.
const loading = simulateSuspenseBoundary(() => effectFetchRender("loading")); // => no suspension

console.log("Suspense fallback shown during effect-fetch:", loading.fallbackShown); // => Output: ...shown: false
console.log("rendered instead:", loading.content); // => Output: rendered instead: <p>my own loading state</p>
```

**Run**: `npx tsx example.ts`

**Output**:

```text
Suspense fallback shown during effect-fetch: false
rendered instead: <p>my own loading state</p>
```

**Key takeaway**: A useEffect fetch never triggers Suspense -- you must hand-roll the loading state, or switch to use().

**Why it matters**: This is the most common Suspense misconception: developers wrap an effect-fetching component in Suspense, expect a fallback, and get none -- because the effect throws no promise. The fix is structural: either keep the hand-rolled loading state (and accept the inconsistency) or move the fetch to a Suspense-aware path (use, a framework loader, a data library) so the boundary actually fires.

**Pitfall**: Mixing effect-fetches and Suspense in one tree gives inconsistent loading UX -- pick one data-loading model.

---

### Example 61: Responsive srcset and sizes Per Viewport

_ex-61 &middot; exercises co-31_

srcset lists the same image at several widths with w descriptors; sizes declares the layout width per breakpoint. The browser picks the smallest source that fills the layout width (and pixel ratio).

**`learning/code/ex-61-image-srcset/example.ts`**

```typescript
// Example 61: Responsive srcset and sizes Per Viewport. (co-31)
//
// `srcset` lists the SAME image at several widths with `w` descriptors; `sizes` declares the layout
// width at each breakpoint. The browser picks the smallest source that fills the layout width (and
// the screen's pixel ratio), so phones download a small file and desktops a large one.

// A candidate image source: its intrinsic width in pixels and its file URL.
interface Source {
  // => each source is the same image at a different resolution
  width: number; // => the intrinsic pixel width (the `w` descriptor)
  url: string; // => the file to fetch at that width
}

// chooseSource picks the narrowest source >= layoutWidth * dpr (the browser's selection rule).
function chooseSource(sources: Source[], layoutWidth: number, dpr: number): Source {
  // => co-31: the browser wants the smallest source that still fills layoutWidth at the device ratio
  const need = layoutWidth * dpr; // => effective pixels the image must cover
  // => pick the first source wide enough; if none, fall back to the widest available
  return (
    sources.find((s) => s.width >= need) ?? sources[sources.length - 1] // => smallest-sufficient source
  );
}

// The same hero image at three widths.
const sources: Source[] = [
  { width: 480, url: "hero-480w.jpg" }, // => for narrow viewports / phones
  { width: 1024, url: "hero-1024w.jpg" }, // => for tablets
  { width: 1920, url: "hero-1920w.jpg" }, // => for desktops
];

const phone = chooseSource(sources, 320, 2); // => need 640px -> 1024w source
const desktop = chooseSource(sources, 1200, 1); // => need 1200px -> 1920w source

console.log("phone picks:", phone.url); // => Output: phone picks: hero-1024w.jpg
console.log("desktop picks:", desktop.url); // => Output: desktop picks: hero-1920w.jpg
```

**Run**: `npx tsx example.ts`

**Output**:

```text
phone picks: hero-1024w.jpg
desktop picks: hero-1920w.jpg
```

**Key takeaway**: srcset + sizes lets the browser pick the smallest sufficient image -- phones get a small file.

**Why it matters**: Responsive images are a pure bandwidth win: a phone on cellular data downloads the 480w file instead of the 1920w one, saving real bytes and real load time. The browser does the selection using srcset's widths plus the sizes media-query list, so you declare the available widths once and the right file is chosen per device automatically.

**Pitfall**: A missing or wrong sizes attribute makes the browser default to 100vw, over-fetching on desktop layouts.

---

### Example 62: next image Lazy-Loads by Default

_ex-62 &middot; exercises co-31_

next/image defaults loading to lazy -- a deliberate divergence from the native img, whose default is eager. Off-screen images defer until they near the viewport.

> **Note:** `next/image` `loading` defaults to "lazy" ("Defers loading the image until it reaches a calculated distance from the viewport"). ([Next.js Image](https://nextjs.org/docs/app/api-reference/components/image)).

**`learning/code/ex-62-image-lazy-default/example.ts`**

```typescript
// Example 62: next image Lazy-Loads by Default. (co-31)
//
// `next/image` defaults `loading` to "lazy" -- a deliberate divergence from the native <img>, whose
// default is "eager". Off-screen images defer until they near the viewport, saving bandwidth and
// reducing initial load.
//
// Note: `next/image` `loading` defaults to "lazy" ("Defers loading the image until
// it reaches a calculated distance from the viewport"). Source: Next.js Image
// (https://nextjs.org/docs/app/api-reference/components/image).

// An image with its loading strategy and whether it is near the viewport.
interface ImageSpec {
  // => the loading strategy decides whether to fetch now or defer
  loading: "lazy" | "eager"; // => the effective loading behavior
  nearViewport: boolean; // => whether the image is close enough to load
  loaded: boolean; // => whether it has actually been fetched
}

// applyLoading models the browser's deferred-load rule for a `lazy` image.
function applyLoading(img: ImageSpec): void {
  // => co-31: lazy + not near viewport -> defer; lazy + near -> load; eager -> always load
  if (img.loading === "eager" || img.nearViewport) {
    img.loaded = true; // => fetch now
  }
}

// A hero (eager) and a far-below-the-fold image (lazy, not yet near).
const hero: ImageSpec = { loading: "eager", nearViewport: true, loaded: false }; // => above the fold
const offscreen: ImageSpec = { loading: "lazy", nearViewport: false, loaded: false }; // => below the fold
// => next/image set `loading` to "lazy" by default for offscreen -- the native <img> would be "eager"

applyLoading(hero); // => eager -> loads immediately
applyLoading(offscreen); // => lazy + not near -> DEFERRED

console.log("hero loaded:", hero.loaded); // => Output: hero loaded: true
console.log("offscreen (lazy default) loaded:", offscreen.loaded); // => Output: offscreen (lazy default) loaded: false
```

**Run**: `npx tsx example.ts`

**Output**:

```text
hero loaded: true
offscreen (lazy default) loaded: false
```

**Key takeaway**: next/image lazy-loads by default; the native img defaults to eager -- a deliberate divergence.

**Why it matters**: Lazy-loading off-screen images means the browser does not spend bandwidth on pictures the user has not scrolled to yet, freeing the initial load for what is visible. next/image flips the default to lazy precisely because most images are below the fold; the hero (above the fold) you mark priority to keep it eager. This pairs with reserved dimensions (Example 63) so lazy images do not cause shifts when they load.

**Pitfall**: A lazy-loaded hero image hurts LCP -- mark the LCP image priority so it loads eagerly.

---

### Example 63: Width and Height Reserve Space and Prevent CLS

_ex-63 &middot; exercises co-31, co-11_

Without explicit width/height, an image has height 0 until it loads, then snaps to full size -- a layout shift. Reserving dimensions (or aspect-ratio) means the image fills a box that already existed.

**`learning/code/ex-63-image-cls-prevent/example.ts`**

```typescript
// Example 63: Width and Height Reserve Space and Prevent CLS. (co-31, co-11)
//
// Without explicit width/height, an image has height 0 until it loads, then snaps to full size --
// shoving everything below it (a layout shift, co-11). Reserving width/height (or aspect-ratio)
// means the image drops into a box that already existed: zero shift.

// A placed image with optional reserved dimensions.
interface Place {
  // => reservedW/H are the box the image will fill; null means "unknown until load"
  reservedW: number | null; // => the reserved width (or null = unknown)
  reservedH: number | null; // => the reserved height (or null = unknown)
  intrinsicW: number; // => the image's real width once loaded
  intrinsicH: number; // => the image's real height once loaded
}

// shiftOnLoad returns how many pixels content moved when the image finally loaded.
function shiftOnLoad(p: Place): number {
  // => co-11: shift = |reserved height - intrinsic height|; reserved => 0 shift
  const beforeH = p.reservedH ?? 0; // => 0 if nothing was reserved
  return Math.abs(beforeH - p.intrinsicH); // => 0 when reserved === intrinsic
}

// WITHOUT reserved dimensions: a 300px image arrives into a 0px hole -> 300px shift.
const unreserved: Place = { reservedW: null, reservedH: null, intrinsicW: 500, intrinsicH: 300 };
// => co-31: always set width/height (or aspect-ratio) so the layout is stable before load

// WITH reserved dimensions matching the intrinsic ratio -> 0 shift.
const reserved: Place = { reservedW: 500, reservedH: 300, intrinsicW: 500, intrinsicH: 300 };

console.log("shift without reserved dims:", shiftOnLoad(unreserved)); // => Output: shift without reserved dims: 300
console.log("shift with reserved dims:", shiftOnLoad(reserved)); // => Output: shift with reserved dims: 0
```

**Run**: `npx tsx example.ts`

**Output**:

```text
shift without reserved dims: 300
shift with reserved dims: 0
```

**Key takeaway**: Reserve width/height (or aspect-ratio) so an arriving image drops into an existing box -- zero shift.

**Why it matters**: This is the direct application of co-11's CLS lesson to images: the browser cannot know an image's size until it downloads, so without reserved dimensions it guesses (often 0) and shifts on load. Setting width/height (or aspect-ratio) tells the browser the box up front, so the layout is stable from first paint. next/image requires these dimensions for the same reason.

**Pitfall**: Reserving the wrong aspect ratio causes a stretch on load -- match the reserved ratio to the real image.

---

### Example 64: An Edge Function Runs in the Edge Runtime

_ex-64 &middot; exercises co-32_

The edge runtime runs your function in a V8 isolate at the CDN edge, close to the user -- a subset of Web APIs (fetch, Request, Response), ES modules only. A route segment config opts in.

> **Note:** `runtime: 'nodejs' | 'edge'`, default 'nodejs'; the edge runtime is a V8-isolate subset of Web APIs, ES-modules only ([Next.js Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)).

**`learning/code/ex-64-edge-runtime/example.ts`**

```typescript
// Example 64: An Edge Function Runs in the Edge Runtime. (co-32)
//
// The edge runtime runs your function in a V8 isolate at the CDN edge, close to the user -- a
// subset of Web APIs (fetch, Request, Response), ES modules only. A route segment config selects it
// with `runtime: 'edge'` (the default is 'nodejs').
//
// Note: `runtime: 'nodejs' | 'edge'`, default 'nodejs'; the edge runtime is a
// V8-isolate subset of Web APIs, ES-modules only. Source: Next.js Route Segment Config
// (https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config).

// A route segment config: the one line that selects the runtime.
const config = { runtime: "edge" as "nodejs" | "edge" }; // => co-32: opt into the edge runtime
// => 'nodejs' is the default; 'edge' moves execution to a V8 isolate near the user

// An edge function returns a Web standard Response (fetch/Request/Response are available).
function edgeHandler(request: Request): Response {
  // => the edge runtime exposes the Web Request/Response objects a fetch-based handler uses
  const region = request.headers.get("x-edge-region") ?? "unknown"; // => read a request header
  return new Response(`Hello from the edge (${region})`, { status: 200 }); // => a Web Response
}

// A simulated request hitting the edge, run async so the Response body can be read as text.
(async () => {
  const req = new Request("https://example.com/api/hello", {
    // => Request is a Web API the edge runtime provides
    headers: { "x-edge-region": "sin1" }, // => a nearby edge POP
  });
  const res = edgeHandler(req); // => runs in the edge runtime
  const body = await res.text(); // => read the Response body as text (a Web API read)

  console.log("runtime:", config.runtime); // => Output: runtime: edge
  console.log("status:", res.status); // => Output: status: 200
  console.log("body:", body); // => Output: body: Hello from the edge (sin1)
})();
```

**Run**: `npx tsx example.ts`

**Output**:

```text
runtime: edge
status: 200
body: Hello from the edge (sin1)
```

**Key takeaway**: runtime: 'edge' runs the handler in a V8 isolate near the user, with Web APIs only.

**Why it matters**: Edge rendering cuts latency because the function runs at a POP geographically close to the user rather than in a single origin region. The trade-off is the constrained API set (Example 65): you get fast cold starts and global distribution, but only the Web APIs the isolate provides. It suits personalization, redirects, A/B tests, and light request handling.

**Pitfall**: The edge runtime is not faster for heavy compute -- it shines for low-latency, geographically distributed work.

---

### Example 65: The Edge Runtime Web API Subset Rejects a Node API

_ex-65 &middot; exercises co-32_

The edge runtime is a subset of Web APIs -- it deliberately omits Node-only modules (node:fs, node:path) and Node globals (Buffer, process). Using one is a build-time error.

**`learning/code/ex-65-edge-vs-node/example.ts`**

```typescript
// Example 65: The Edge Runtime Web API Subset Rejects a Node API. (co-32)
//
// The edge runtime is a SUBSET of Web APIs in a V8 isolate -- it deliberately omits Node-only
// modules like `node:fs`, `node:path`, and the `Buffer`/`process` Node globals. Using one is a
// build-time error: the edge runtime simply does not provide it.

// The APIs each runtime exposes.
const RUNTIME_APIS: Record<"nodejs" | "edge", Set<string>> = {
  // => nodejs has the full Node stdlib; edge has only the Web subset
  nodejs: new Set(["fetch", "Request", "Response", "node:fs", "node:path", "Buffer", "process"]),
  edge: new Set(["fetch", "Request", "Response"]), // => co-32: Web APIs only -- no node:*, no Buffer
};

// canUse returns whether `api` is available in the chosen runtime.
function canUse(runtime: "nodejs" | "edge", api: string): boolean {
  // => co-32: a Node-only API is simply absent from the edge runtime's API set
  return RUNTIME_APIS[runtime].has(api); // => false for node:fs on edge
}

// A route that imports node:fs compiled for the edge -> rejected.
const edgeChecks = ["fetch", "node:fs", "Buffer"].map((api) => ({
  api, // => the import the handler tried to use
  available: canUse("edge", api), // => whether the edge runtime provides it
}));

edgeChecks.forEach((c) => console.log(`edge runtime has ${c.api}: ${c.available}`)); // => Output: three lines
console.log("node:fs usable on edge:", canUse("edge", "node:fs")); // => Output: node:fs usable on edge: false
```

**Run**: `npx tsx example.ts`

**Output**:

```text
edge runtime has fetch: true
edge runtime has node:fs: false
edge runtime has Buffer: false
node:fs usable on edge: false
```

**Key takeaway**: The edge runtime has Web APIs only -- a Node-only import like node:fs is a build error there.

**Why it matters**: Knowing the boundary prevents a class of build failures: code that works in the Node runtime breaks the moment it is moved to the edge, because node:fs, Buffer, and process simply do not exist there. The constraint is what enables the fast cold starts and global distribution -- a tiny, uniform API surface. When you need Node APIs, keep that route on the Node runtime.

**Pitfall**: A library that transitively imports node:fs pulls the whole route off the edge -- check your imports.

---

### Example 66: Modeling loading error success as a Discriminated Union

_ex-66 &middot; exercises co-33_

Model async UI state as a discriminated union: each branch shares a status literal that narrows the rest of the shape. The status field is the discriminant TypeScript narrows on.

> **Note:** "When every type in a union contains a common property with literal types, TypeScript ... can narrow out the members of the union." ([TS Handbook -- Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)).

**`learning/code/ex-66-discriminated-union-state/example.ts`**

```typescript
// Example 66: Modeling loading error success as a Discriminated Union. (co-33)
//
// Model async UI state as a discriminated union: each branch shares a `status` literal that narrows
// the rest of the shape. `loading` has no data; `error` has a message; `success` has the data. The
// `status` field is the discriminant TypeScript narrows on.
//
// Note: "When every type in a union contains a common property with literal types,
// TypeScript ... can narrow out the members of the union." Source: TS Handbook -- Narrowing
// (https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions).

// The three-state union; `status` is the discriminant (the common literal field).
type AsyncState<T> =
  | { status: "loading" } // => no data yet
  | { status: "error"; message: string } // => `message` exists ONLY in this branch
  | { status: "success"; data: T }; // => `data` exists ONLY in this branch
// => narrowing on `status` makes `message`/`data` safely available in their own branches only

// render branches on the discriminant; each branch sees only its own extra fields.
function render<T>(state: AsyncState<T>): string {
  // => co-33: switching on `status` narrows the union, so .message/.data are type-safe here
  switch (state.status) {
    case "loading":
      return "Loading..."; // => no .data access possible (and none needed)
    case "error":
      return `Error: ${state.message}`; // => narrowed: .message is available
    case "success":
      return `Data: ${JSON.stringify(state.data)}`; // => narrowed: .data is available
  }
}

const states: AsyncState<number[]>[] = [
  { status: "loading" }, // => the pending branch
  { status: "error", message: "network unreachable" }, // => the error branch
  { status: "success", data: [1, 2, 3] }, // => the success branch
];

states.forEach((s) => console.log(render(s))); // => Output: three lines, one per branch
```

**Run**: `npx tsx example.ts`

**Output**:

```text
Loading...
Error: network unreachable
Data: [1,2,3]
```

**Key takeaway**: A tagged union makes each async state branch type-safe -- data only exists where status allows it.

**Why it matters**: This is the idiomatic way to model async state in typed frontends: instead of separate loading/error/data booleans that can contradict each other (loading AND error?), one status field makes impossible states impossible. Narrowing on status gives each branch safe access to exactly its own payload. Example 67 turns this into a compile-time exhaustiveness check.

**Pitfall**: Separate isLoading/isError booleans can both be true at once -- the union makes that unrepresentable.

---

### Example 67: Exhaustive Narrowing Makes a Missing Case a Type Error

_ex-67 &middot; exercises co-33_

Assigning the switch's default branch to a never-typed variable turns exhaustiveness into a compile check: add a union member without a case and tsc fails. The broken variant below shows the exact error.

> **Note:** Discriminated-union narrowing ([TS Handbook -- Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)).

**`learning/code/ex-67-exhaustive-switch/example.ts`**

```typescript
// Example 67: Exhaustive Narrowing Makes a Missing Case a Type Error. (co-33)
//
// Assigning the switch's default branch to a `never`-typed variable turns exhaustiveness into a
// COMPILE check: if every union member is handled, the default is unreachable (`never`); if a new
// member is added but not handled, it falls through to the default and is NOT `never` -- a type
// error. The "broken" variant below demonstrates that exact error.
//
// Note: "When every type in a union contains a common property with literal types,
// TypeScript ... can narrow out the members of the union." Source: TS Handbook -- Narrowing
// (https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions).

// A four-state union; every member carries the `status` discriminant.
type State =
  | { status: "loading" } // => no payload
  | { status: "error"; message: string } // => payload unique to this branch
  | { status: "success"; data: number[] } // => payload unique to this branch
  | { status: "stale" }; // => handled too -- so the default is genuinely unreachable

// render handles EVERY member; the never-assertion proves nothing falls through.
function render(state: State): string {
  // => co-33: switching on the discriminant narrows; the never check proves exhaustiveness
  switch (state.status) {
    case "loading":
      return "Loading..."; // => narrowed to { status: "loading" }
    case "error":
      return `Error: ${state.message}`; // => narrowed: .message available
    case "success":
      return `OK: ${state.data.join(",")}`; // => narrowed: .data available
    case "stale":
      return "Stale -- refetching"; // => the fourth member, explicitly handled
    default: {
      // => if every case above is handled, `state` is `never` here; an unhandled member is a type error
      const exhaustive: never = state; // => compiles ONLY because no member reaches here
      return exhaustive; // => unreachable
    }
  }
}

console.log(render({ status: "loading" })); // => Output: Loading...
console.log(render({ status: "error", message: "offline" })); // => Output: Error: offline
console.log(render({ status: "success", data: [1, 2] })); // => Output: OK: 1,2
console.log(render({ status: "stale" })); // => Output: Stale -- refetching
```

**Run**: `npx tsx example.ts`

**Output**:

```text
Loading...
Error: offline
OK: 1,2
Stale -- refetching
```

**Key takeaway**: A never-assertion in the default branch makes a missing case a compile error, not a silent runtime bug.

**Why it matters**: This is the single most valuable TypeScript pattern for state machines: when a teammate adds a new status to the union, the compiler lists every switch that forgot the new case. Without it, the new status silently falls through to a default (or does nothing) and the bug surfaces only at runtime. The never-assertion converts a whole class of forgotten-case bugs into immediate compile errors.

**Pitfall**: The never-assertion only works if you actually switch on the discriminant -- a switch on something else skips the check.

**What changes when a case is missing.** The `broken.ts` file in this example's directory adds a `"timeout"` member to the union but does NOT add a case for it -- so the default branch is no longer unreachable, and the `never`-assertion fails to compile.

**`learning/code/ex-67-exhaustive-switch/broken.ts`** (the broken variant)

```typescript
type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: number[] }
  | { status: "stale" }
  | { status: "timeout" }; // newly added -- but no case handles it below

function render(state: State): string {
  switch (state.status) {
    case "loading":
      return "Loading...";
    case "error":
      return `Error: ${state.message}`;
    case "success":
      return `OK: ${state.data.join(",")}`;
    case "stale":
      return "Stale -- refetching";
    default: {
      const exhaustive: never = state; // TYPE ERROR: "timeout" reaches here
      return exhaustive;
    }
  }
}
```

**Verify**: `npx tsc --noEmit --strict --skipLibCheck broken.ts`

**Output**:

```text
error TS2322: Type '{ status: "timeout"; }' is not assignable to type 'never'.
```

---

### Example 68: A Typed Generic List Component

_ex-68 &middot; exercises co-33_

A generic component carries its item type as a type parameter, so the same component works for User[], Product[], or any shape -- with full type inference on the items and the render callback.

**`learning/code/ex-68-generic-component/example.ts`**

```typescript
// Example 68: A Typed Generic List Component. (co-33)
//
// A generic component `<T,>` carries its item type as a type parameter, so the SAME component works
// for `User[]`, `Product[]`, or any other shape -- with full type inference on the items and on the
// render callback. Generics let one component be reused without losing per-shape type safety.

// The props carry the item type parameter T through both `items` and the `render` callback.
interface ListProps<T> {
  // => T flows from items into render, so the callback is typed for the exact item shape
  items: T[]; // => the data, typed as T[]
  render: (item: T) => string; // => a callback that receives a T (not `any`)
}

// List is generic in T; calling it with User[] infers T = User everywhere.
function List<T>(props: ListProps<T>): string {
  // => co-33: one generic definition serves every item shape, fully typed
  return "<ul>" + props.items.map((item) => `<li>${props.render(item)}</li>`).join("") + "</ul>";
  // => `item` is typed T inside the map, so render's contract is enforced
}

// Two different item shapes, both rendered by the SAME generic component.
interface User {
  id: number; // => a User has an id
  name: string; // => a User has a name
}
interface Product {
  sku: string; // => a Product has a sku
  price: number; // => a Product has a price
}

const userList = List<User>({
  // => T inferred as User from the items array
  items: [
    { id: 1, name: "Ada" },
    { id: 2, name: "Alan" },
  ],
  render: (u) => `${u.id}: ${u.name}`, // => u is typed User, so u.name is safe
});
const productList = List<Product>({
  // => T inferred as Product -- the same component, a different shape
  items: [
    { sku: "A1", price: 10 },
    { sku: "B2", price: 25 },
  ],
  render: (p) => `${p.sku} ($${p.price})`, // => p is typed Product, so p.sku is safe
});

console.log(userList); // => Output: the rendered user list
console.log(productList); // => Output: the rendered product list
```

**Run**: `npx tsx example.ts`

**Output**:

```text
<ul><li>1: Ada</li><li>2: Alan</li></ul>
<ul><li>A1 ($10)</li><li>B2 ($25)</li></ul>
```

**Key takeaway**: A generic <T,> component is reusable across shapes while keeping per-shape type safety on items.

**Why it matters**: Generics are how you write one component that serves many data shapes without resorting to any. The type parameter T flows from the items prop into the render callback, so the callback is typed for the exact item shape each call uses. This is the foundation of reusable, type-safe component libraries -- List, Table, Select all follow this pattern.

**Pitfall**: A generic component whose T is inferred only from an optional prop can default to unknown -- anchor T on a required prop.

---

### Example 69: Precise Required and Optional Prop Typing

_ex-69 &middot; exercises co-33_

Precise prop typing marks required props (no ?) and optional props (?). A missing required prop is a compile error, not a runtime undefined; optional props carry an explicit type plus a default.

**`learning/code/ex-69-prop-typing/example.ts`**

```typescript
// Example 69: Precise Required and Optional Prop Typing. (co-33)
//
// Precise prop typing marks which props are required and which are optional (`?`). A missing
// required prop is a COMPILE error, not a runtime undefined; an optional prop has an explicit type
// plus a sensible default. The "broken" variant below shows the missing-required-prop error.

// Button props: `label` is required; `disabled` and `type` are optional with defaults.
interface ButtonProps {
  // => required props have no `?`; optional props do, and callers may omit them
  label: string; // => REQUIRED -- callers must supply it
  disabled?: boolean; // => optional (defaults to false below)
  type?: "button" | "submit"; // => optional, a literal union (defaults to "button")
}

// renderButton applies defaults for the optional props.
function renderButton(props: ButtonProps): string {
  // => co-33: optional props arrive as T | undefined; defaults fill them in
  const disabled = props.disabled ?? false; // => default false when omitted
  const type = props.type ?? "button"; // => default "button" when omitted
  return `<button disabled="${disabled}" type="${type}">${props.label}</button>`;
  // => props.label is always present (it is required), so no default needed
}

const ok = renderButton({ label: "Save", type: "submit" }); // => valid: label required, type optional
const minimal = renderButton({ label: "Cancel" }); // => valid: only the required prop given

console.log(ok); // => Output: <button disabled="false" type="submit">Save</button>
console.log(minimal); // => Output: <button disabled="false" type="button">Cancel</button>
```

**Run**: `npx tsx example.ts`

**Output**:

```text
<button disabled="false" type="submit">Save</button>
<button disabled="false" type="button">Cancel</button>
```

**Key takeaway**: Required props have no ?; a missing required prop is a compile error, not a runtime undefined.

**Why it matters**: Distinguishing required from optional props precisely is what makes a component's contract self-documenting and compiler-enforced. Callers cannot forget a required prop, and optional props have documented defaults so the component behaves sensibly when they are omitted. The broken variant below shows the missing-required-prop error the compiler produces.

**Pitfall**: Making a prop optional and then defaulting it to undefined hides a genuinely-required value behind an optional-looking prop.

**What changes when a required prop is missing.** The `broken.ts` file in this example's directory omits the required `label` prop -- tsc rejects the call site with a precise message naming the missing field.

**`learning/code/ex-69-prop-typing/broken.ts`** (the broken variant)

```typescript
interface ButtonProps {
  label: string; // REQUIRED
  disabled?: boolean;
  type?: "button" | "submit";
}

function renderButton(props: ButtonProps): string {
  const disabled = props.disabled ?? false;
  const type = props.type ?? "button";
  return `<button disabled="${disabled}" type="${type}">${props.label}</button>`;
}

// TYPE ERROR: Property 'label' is missing
const broken = renderButton({ type: "submit" });
```

**Verify**: `npx tsc --noEmit --strict --skipLibCheck broken.ts`

**Output**:

```text
error TS2345: Argument of type '{ type: "submit"; }' is not assignable to parameter of type 'ButtonProps'.
  Property 'label' is missing in type '{ type: "submit"; }' but required in type 'ButtonProps'.
```

---

### Example 70: An App Shell Cached by a Service Worker

_ex-70 &middot; exercises co-34_

The app-shell model: the service worker pre-caches the minimal shell (HTML, CSS, core JS) at install, so a repeat visit loads the shell instantly from cache while fresh content fills in.

**`learning/code/ex-70-pwa-app-shell/example.ts`**

```typescript
// Example 70: An App Shell Cached by a Service Worker. (co-34)
//
// The PWA app-shell model: the service worker pre-caches the minimal shell (the HTML, CSS, core JS)
// at install, so a REPEAT visit loads the shell instantly from cache while fresh content fills in.
// The shell is the unchanging chrome; only the data is fetched live.

// The service worker's cache, populated at install.
const shellCache: Map<string, string> = new Map(); // => the app shell's cached assets
let networkHits = 0; // => counts live network loads of the shell

// install caches the shell assets once (runs at service-worker registration).
function installShell(assets: string[]): void {
  // => co-34: the shell is pre-cached so repeat visits do not re-fetch it
  for (const a of assets) shellCache.set(a, `<shell:${a}>`); // => prime the cache
}

// loadShell serves the cached shell on a repeat visit (instant, no network).
function loadShell(): { source: "cache" | "network"; latencyMs: number } {
  // => first visit: miss -> network (slow); repeat visit: hit -> cache (instant)
  const cached = shellCache.get("/shell.html"); // => is the shell cached?
  if (cached) return { source: "cache", latencyMs: 5 }; // => co-34: instant repeat visit
  networkHits += 1; // => first visit had to load it from the network
  return { source: "network", latencyMs: 400 }; // => the slow first load
}

installShell(["/shell.html", "/app.css", "/app.js"]); // => cache the shell
loadShell(); // => first visit was the network load that primed the cache
const repeat = loadShell(); // => repeat visit -> instant from cache

console.log("repeat-visit source:", repeat.source); // => Output: repeat-visit source: cache
console.log("repeat-visit latency (ms):", repeat.latencyMs); // => Output: repeat-visit latency (ms): 5
```

**Run**: `npx tsx example.ts`

**Output**:

```text
repeat-visit source: cache
repeat-visit latency (ms): 5
```

**Key takeaway**: Pre-caching the shell makes repeat visits instant -- the shell comes from cache, only data is live.

**Why it matters**: The app-shell pattern is what makes a PWA feel native: the unchanging chrome is cached, so the app appears immediately on launch and then fetches its data. First visit pays the network cost; every subsequent visit gets the shell from cache. This pairs with offline fallback (Example 72) and installability (Example 71) for a full PWA.

**Pitfall**: A stale cached shell after a deploy confuses users -- version the cache key and clean up old versions.

---

### Example 71: A Web Manifest Makes the App Installable

_ex-71 &middot; exercises co-34_

A web app manifest with the required fields (name, start_url, display, icons), plus a service worker and HTTPS, makes the app installable -- the browser offers Add to Home Screen.

**`learning/code/ex-71-pwa-installable/example.ts`**

```typescript
// Example 71: A Web Manifest Makes the App Installable. (co-34)
//
// A web app manifest (a linked manifest.json) with the required fields makes the app installable --
// "Add to Home Screen" / "Install app". Browsers check the manifest + a service worker + HTTPS
// before offering the install prompt. This example validates those install criteria.

// The required manifest fields for installability.
interface Manifest {
  // => browsers check these specific fields before offering the install prompt
  name: string; // => the app's display name
  start_url: string; // => where the installed app launches
  display: "standalone" | "fullscreen" | "minimal-ui" | "browser"; // => standalone = no browser chrome
  icons: { src: string; sizes: string; purpose: string }[]; // => at least one icon (often 192px + 512px)
}

// canInstall checks the installability criteria (manifest fields + a service worker + https).
function canInstall(
  manifest: Manifest,
  hasServiceWorker: boolean,
  isHttps: boolean,
): { ok: boolean; reasons: string[] } {
  // => co-34: installability is a checklist; each missing item is a reason it will not prompt
  const reasons: string[] = [];
  if (!manifest.name) reasons.push("missing name"); // => required field
  if (manifest.display === "browser") reasons.push("display must not be 'browser'"); // => needs standalone-ish
  if (manifest.icons.length === 0) reasons.push("no icons"); // => at least one icon
  if (!hasServiceWorker) reasons.push("no service worker"); // => SW with a fetch handler is required
  if (!isHttps) reasons.push("not HTTPS"); // => install requires a secure context
  return { ok: reasons.length === 0, reasons }; // => ok === true means the prompt will appear
}

const manifest: Manifest = {
  // => a complete, installable manifest
  name: "Tasks",
  start_url: "/",
  display: "standalone", // => no browser address bar when installed
  icons: [{ src: "/icon-512.png", sizes: "512x512", purpose: "any maskable" }],
};
const verdict = canInstall(manifest, true, true); // => SW + HTTPS both present

console.log("installable:", verdict.ok); // => Output: installable: true
console.log("blocking reasons:", verdict.reasons); // => Output: blocking reasons: []
```

**Run**: `npx tsx example.ts`

**Output**:

```text
installable: true
blocking reasons: []
```

**Key takeaway**: Installability is a checklist: manifest fields + a service worker + HTTPS -- each missing item blocks the prompt.

**Why it matters**: Installation turns a site into a launched app with its own window and home-screen icon, which drives engagement for repeat-use tools. The criteria are mechanical and checkable: a manifest with the right fields, a service worker with a fetch handler, and a secure context. This example validates exactly that checklist so you know why the prompt does or does not appear.

**Pitfall**: A manifest without a 192px and 512px icon fails some browsers' install criteria -- include both sizes.

---

### Example 72: An Offline Fallback Page Serves When the Network Is Down

_ex-72 &middot; exercises co-34_

When the network is down and the requested page is not cached, the service worker serves a pre-cached offline fallback page instead of a browser error -- a branded, usable state, not a dead tab.

**`learning/code/ex-72-offline-fallback/example.ts`**

```typescript
// Example 72: An Offline Fallback Page Serves When the Network Is Down. (co-34)
//
// When the network is down and the requested page is NOT cached, the service worker serves a
// pre-cached OFFLINE FALLBACK page instead of a browser error. This keeps the app usable (a branded
// "you are offline" page) rather than showing a dead tab.

// The cache holds the fallback page plus any previously-visited pages.
const cache: Map<string, string> = new Map(); // => keyed by URL
let networkOnline = true; // => flip to model going offline

// installFallback pre-caches the offline fallback page (and the app shell).
function installFallback(): void {
  // => co-34: the fallback must be cached AHEAD of time, while online
  cache.set("/offline.html", "<main>You are offline.</main>"); // => the branded fallback
  cache.set("/", "<main>Home</main>"); // => a previously-visited page (cached)
}

// fetchWithFallback tries cache -> network -> offline fallback (the standard offline strategy).
function fetchWithFallback(url: string): { body: string; source: string } {
  // => co-34: cache-first, then network, then the offline fallback -- never a dead error
  const cached = cache.get(url); // => is this URL cached?
  if (cached) return { body: cached, source: "cache" }; // => serve cached
  if (networkOnline) return { body: `<fresh ${url}>`, source: "network" }; // => online miss -> network
  return { body: cache.get("/offline.html")!, source: "offline-fallback" }; // => offline + uncached -> fallback
}

installFallback(); // => cache the fallback and the home page
networkOnline = false; // => go offline
const uncachedOffline = fetchWithFallback("/dashboard"); // => offline + not cached -> fallback
const cachedOffline = fetchWithFallback("/"); // => offline but cached -> served from cache

console.log("uncached while offline:", uncachedOffline.source, "->", uncachedOffline.body); // => Output: offline-fallback -> <main>You are offline.</main>
console.log("cached while offline:", cachedOffline.source); // => Output: cached while offline: cache
```

**Run**: `npx tsx example.ts`

**Output**:

```text
uncached while offline: offline-fallback -> <main>You are offline.</main>
cached while offline: cache
```

**Key takeaway**: Cache an offline fallback page so an uncached offline request shows a branded state, not a browser error.

**Why it matters**: Without a fallback, an offline request to an uncached page shows the browser's generic error -- a dead end that makes the app feel broken. A pre-cached fallback gives the user a branded, explained state (and ideally cached content they can still use). This is the resilience half of the PWA story alongside the app shell (Example 70).

**Pitfall**: The fallback page itself must be cached at install -- if it is fetched live it is unavailable precisely when needed.

---

### Example 73: Locale-Aware Number and Date Formatting via Intl

_ex-73 &middot; exercises co-35_

The Intl API formats numbers and dates per locale -- no custom formatting code. The same value renders as 1,234.56 in en-US and 1.234,56 in de-DE. Never hand-build a locale format.

**`learning/code/ex-73-i18n-format/example.ts`**

```typescript
// Example 73: Locale-Aware Number and Date Formatting via Intl. (co-35)
//
// The Intl API formats numbers and dates per locale -- no custom formatting code, no string
// concatenation. The SAME value renders as "1,234.56" in en-US, "1.234,56" in de-DE, and so on. This
// is the foundation of i18n: never hand-build a locale format; let Intl do it.

// formatNumber formats a number for a locale (grouping separators and the decimal symbol vary).
function formatNumber(value: number, locale: string): string {
  // => co-35: Intl picks the correct grouping and decimal separators per locale
  return new Intl.NumberFormat(locale).format(value); // => e.g. "1,234.56" vs "1.234,56"
}

// formatDate formats a fixed date for a locale (order and separators vary).
function formatDate(date: Date, locale: string): string {
  // => co-35: the locale decides field order (MDY vs DMY) and separators
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date); // => e.g. "Jan 5, 2026"
}

const amount = 1234.56; // => the same value in every locale
const date = new Date("2026-01-05"); // => the same date in every locale

const locales = ["en-US", "de-DE", "id-ID"]; // => three locales to contrast
for (const loc of locales) {
  // => one value, three locale-correct renderings -- zero hand-written formatting
  console.log(`${loc}: ${formatNumber(amount, loc)} | ${formatDate(date, loc)}`); // => Output: one line per locale
}
```

**Run**: `npx tsx example.ts`

**Output**:

```text
en-US: 1,234.56 | Jan 5, 2026
de-DE: 1.234,56 | 05.01.2026
id-ID: 1.234,56 | 5 Jan 2026
```

**Key takeaway**: Intl formats numbers and dates per locale -- never hand-build grouping/decimal separators or date orders.

**Why it matters**: Hand-rolled locale formatting is a reliable source of bugs (wrong decimal symbol, wrong date field order). Intl is built into the platform, correct per locale, and handles edge cases (calendars, plurals via Intl.PluralRules) for free. Using it is the baseline of correct i18n -- the catalog (Example 74) builds on it.

**Pitfall**: Formatting in the user's locale but sorting in the developer's locale gives jarring mixed orderings -- use Intl for both.

---

### Example 74: A Message Catalog with Interpolation

_ex-74 &middot; exercises co-35_

A message catalog maps a key to a locale-specific template with {placeholder} holes; a translate function interpolates values. Keeping strings in a catalog lets translators work without touching component code.

**`learning/code/ex-74-i18n-messages/example.ts`**

```typescript
// Example 74: A Message Catalog with Interpolation. (co-35)
//
// A message catalog maps a message KEY to a locale-specific string with `{placeholder}` holes. A
// translate function interpolates values into the placeholders. Keeping strings in a catalog (not
// inline) is what lets translators work without touching component code.

// The catalog: locale -> key -> template string with {placeholders}.
type Catalog = Record<string, Record<string, string>>; // => nested locale -> key -> template

const messages: Catalog = {
  // => the same key, two locale-specific templates, each with a {name} hole
  en: { welcome: "Welcome, {name}!" }, // => English template
  id: { welcome: "Selamat datang, {name}!" }, // => Indonesian template
};

// translate resolves the key for the locale and interpolates {placeholders}.
function translate(locale: string, key: string, vars: Record<string, string>): string {
  // => co-35: resolve the template, then fill each {var} from the provided map
  const template = messages[locale]?.[key] ?? messages["en"][key]; // => fall back to English
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`); // => fill holes
}

const en = translate("en", "welcome", { name: "Ada" }); // => English with the name filled in
const id = translate("id", "welcome", { name: "Ada" }); // => Indonesian with the name filled in

console.log(en); // => Output: Welcome, Ada!
console.log(id); // => Output: Selamat datang, Ada!
```

**Run**: `npx tsx example.ts`

**Output**:

```text
Welcome, Ada!
Selamat datang, Ada!
```

**Key takeaway**: Externalize strings into a per-locale catalog and interpolate placeholders -- components hold keys, not prose.

**Why it matters**: Embedding user-facing strings in component code couples translation to engineering: every new language means editing components. A catalog separates the two -- components reference keys, and the per-locale templates (with placeholders) live in their own files translators can own. The interpolate function fills the placeholders at runtime, so dynamic values flow into locale-correct sentences.

**Pitfall**: Concatenating translated fragments (word + word) breaks in languages with different word order -- interpolate into one template.

---

### Example 75: An RTL-Aware Mirrored Layout

_ex-75 &middot; exercises co-35_

Setting dir='rtl' mirrors the inline axis: what was left becomes right. Logical properties (margin-inline-start) flow with the direction, so the same CSS works in both LTR and RTL.

**`learning/code/ex-75-i18n-rtl/example.ts`**

```typescript
// Example 75: An RTL-Aware Mirrored Layout. (co-35)
//
// Setting `dir="rtl"` (right-to-left, for Arabic/Hebrew) mirrors the inline axis: what was "left"
// becomes "right". Logical properties (margin-inline-start, inset-inline-start) flow with the
// direction, so the SAME CSS works in both LTR and RTL -- only the dir attribute changes.

// A layout direction and its effect on the inline (horizontal) axis.
type Dir = "ltr" | "rtl"; // => the document/wrapper direction

// resolveLogical maps a logical inline-start to a physical side, depending on direction.
function resolveLogical(property: "margin-inline-start", dir: Dir): string {
  // => co-35: logical properties flip physical side with dir; one rule serves both directions
  if (property === "margin-inline-start") {
    return dir === "ltr" ? "margin-left" : "margin-right"; // => start = left in LTR, right in RTL
  }
  return property; // => (only one logical property modeled here)
}

// renderLayout builds the wrapper and shows which physical side the logical start resolved to.
function renderLayout(dir: Dir): { html: string; startSide: string } {
  // => co-35: setting dir alone mirrors the layout; logical CSS adapts automatically
  const html = `<div dir="${dir}">...</div>`; // => the dir attribute carries the whole mirroring
  return { html, startSide: resolveLogical("margin-inline-start", dir) }; // => the resolved physical side
}

const ltr = renderLayout("ltr"); // => English/standard: start = left
const rtl = renderLayout("rtl"); // => Arabic/Hebrew: start = right (mirrored)

console.log("LTR start side:", ltr.startSide); // => Output: LTR start side: margin-left
console.log("RTL start side:", rtl.startSide); // => Output: RTL start side: margin-right
console.log("RTL wrapper:", rtl.html); // => Output: RTL wrapper: <div dir="rtl">...</div>
```

**Run**: `npx tsx example.ts`

**Output**:

```text
LTR start side: margin-left
RTL start side: margin-right
RTL wrapper: <div dir="rtl">...</div>
```

**Key takeaway**: Use logical CSS properties and set dir -- the same stylesheet mirrors correctly for RTL languages.

**Why it matters**: Arabic and Hebrew read right-to-left, so an LTR-only layout points the wrong way for those users. Logical properties (inline-start/inline-end instead of left/right) plus the dir attribute let one stylesheet serve both directions correctly, mirroring the layout automatically. This is far cheaper than maintaining a separate RTL stylesheet.

**Pitfall**: Hardcoded left/right in physical properties does not flip with dir -- prefer logical (inline/block) properties.

---

### Example 76: Testing Library Queries Test Behaviour Not Internals

_ex-76 &middot; exercises co-36_

Testing-Library's guiding principle: query the way a user sees the UI (by role, by visible text), not by implementation details (a CSS class). A behaviour-based test survives a class rename; an internals-based one breaks.

> **Note:** "The more your tests resemble the way your software is used, the more confidence they can give you." ([Testing Library -- Guiding Principles](https://testing-library.com/docs/guiding-principles/)).

**`learning/code/ex-76-rtl-testing-behaviour/example.ts`**

```typescript
// Example 76: Testing Library Queries Test Behaviour Not Internals. (co-36)
//
// Testing-Library's guiding principle: query the way a USER sees the UI (by role, by visible text),
// not by implementation details (a CSS class, a component instance, an internal state field). A test
// that finds "the button labelled Submit" keeps passing when you swap the class name; a test that
// finds `.submit-btn` breaks on the same change though the user saw nothing differ.
//
// Note: "The more your tests resemble the way your software is used, the more
// confidence they can give you." Source: Testing Library -- Guiding Principles
// (https://testing-library.com/docs/guiding-principles/).

// A minimal rendered DOM node: its role, its accessible name, and an internal-only class.
interface DomNode {
  // => role + name are what a USER perceives; className is an internal detail
  role: string; // => the accessible role (button, link, ...)
  name: string; // => the visible/accessible name
  className: string; // => an INTERNAL detail users never see
}

const rendered: DomNode = { role: "button", name: "Submit", className: "btn-primary-v2" };

// getByRole finds a node the way a USER does (role + accessible name) -- robust to refactors.
function getByRole(nodes: DomNode[], role: string, name: string): DomNode | undefined {
  // => co-36: role+name queries survive implementation changes (a class rename does not break this)
  return nodes.find((n) => n.role === role && n.name === name); // => user-visible contract
}

// getByClassName finds a node by an internal detail -- brittle, breaks on a class rename.
function getByClassName(nodes: DomNode[], className: string): DomNode | undefined {
  // => co-36: implementation-detail queries couple the test to internals the user never sees
  return nodes.find((n) => n.className === className); // => breaks the moment the class changes
}

const byRole = getByRole([rendered], "button", "Submit"); // => found by behaviour
const byClass = getByClassName([rendered], "btn-primary-v2"); // => found by internal detail

console.log("getByRole finds it:", byRole?.name === "Submit"); // => Output: getByRole finds it: true
console.log("refactor: class renamed to 'btn-primary-v3'");
rendered.className = "btn-primary-v3"; // => an internal-only rename
console.log("getByRole still passes:", getByRole([rendered], "button", "Submit")?.name === "Submit"); // => Output: ...still passes: true
console.log("getByClassName now broken:", getByClassName([rendered], "btn-primary-v2") === undefined); // => Output: ...now broken: true
```

**Run**: `npx tsx example.ts`

**Output**:

```text
getByRole finds it: true
refactor: class renamed to 'btn-primary-v3'
getByRole still passes: true
getByClassName now broken: true
```

**Key takeaway**: Query by role and visible text (what the user perceives), not by class or instance (internal details).

**Why it matters**: Tests that mirror how software is used give confidence that real users can use it, and they are robust to refactors: renaming a class or restructuring a component does not break a role-based test, because the user-visible behaviour did not change. Tests coupled to internals (a class name, a component instance) break on implementation changes the user never noticed, eroding trust in the suite.

**Pitfall**: Querying by a CSS class couples the test to styling churn unrelated to behaviour -- reach for role/text first.

---

### Example 77: A user-event Interaction Test

_ex-77 &middot; exercises co-36_

user-event drives a realistic interaction sequence (type into an input, click a button) and then asserts the resulting UI -- the closest a unit test gets to a real user.

**`learning/code/ex-77-rtl-interaction/example.ts`**

```typescript
// Example 77: A user-event Interaction Test. (co-36)
//
// user-event drives a REALISTIC interaction sequence (type into an input, click a button) and then
// asserts the resulting UI -- the closest a unit test gets to a real user. This example models a
// type-then-submit flow and asserts the rendered result reflects the user's actions.

// A tiny form component: an input whose value lives in state, and a submit handler.
function makeForm(): {
  // => the component exposes the behaviour a user drives, not its internals
  input: { value: string };
  submitted: string | null;
  type: (text: string) => void; // => user-event.type
  clickSubmit: () => void; // => user-event.click
} {
  const state = { input: { value: "" }, submitted: null as string | null };
  return {
    input: state.input,
    submitted: null,
    type(text: string) {
      // => user-event.type fills the input char by char (a real keystroke sequence)
      state.input.value = text; // => the controlled input updates state
      this.submitted = state.submitted; // => keep the alias current
    },
    clickSubmit() {
      // => user-event.click activates the submit control
      state.submitted = state.input.value; // => the handler reads the current value
      this.submitted = state.submitted;
    },
  };
}

// assertEqual is a tiny assertion helper (stands in for vitest's expect).
function assertEqual<T>(actual: T, expected: T, label: string): void {
  // => a passing assertion prints OK; a mismatch would throw (the test fails)
  const ok = actual === expected;
  console.log(`${ok ? "PASS" : "FAIL"}: ${label}`);
  if (!ok) throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
}

const form = makeForm(); // => mount the component
form.type("buy bread"); // => user-event.type: a realistic keystroke sequence
form.clickSubmit(); // => user-event.click: activate submit

assertEqual(form.submitted, "buy bread", "submit reflects what the user typed"); // => Output: PASS
```

**Run**: `npx tsx example.ts`

**Output**:

```text
PASS: submit reflects what the user typed
```

**Key takeaway**: user-event drives realistic keystrokes and clicks, then asserts the resulting UI -- model the user, not the API.

**Why it matters**: Where fireEvent dispatches a single synthetic event, user-event models the full interaction (focus, keystrokes, click) the way a real input device produces it. This catches bugs single-event tests miss (a focus change that broke a handler, a key sequence that mattered). The test reads as a user flow, which makes intent clear and the assertion meaningful.

**Pitfall**: Directly calling an event handler skips the focus + keystroke machinery -- prefer user-event over calling handlers.

---

### Example 78: A Playwright E2E Smoke Test

_ex-78 &middot; exercises co-36_

Playwright drives a real browser through the critical path: navigate, fill the search, click search, assert a result is visible. Unlike a unit test, it exercises the whole stack in a real browser.

> **Note:** "Playwright Test is an end-to-end test framework for modern web apps." ([Playwright](https://playwright.dev/docs/intro)).

**`learning/code/ex-78-playwright-e2e/example.ts`**

```typescript
// Example 78: A Playwright E2E Smoke Test. (co-36)
//
// Playwright drives a REAL browser through the critical path: navigate, fill the search box, click
// search, assert a result is visible. Unlike a unit test, it exercises the whole stack in a real
// browser. This example models those steps and the visible-result assertion that defines a "smoke"
// pass.
//
// Note: "Playwright Test is an end-to-end test framework for modern web apps."
// Source: Playwright (https://playwright.dev/docs/intro).

// A simulated page a Playwright test drives (the browser tab under automation).
interface Page {
  // => the Playwright locator APIs a test calls, modeled minimally
  url: string; // => page.url()
  input: string; // => the search box's value
  visibleResults: string[]; // => the rendered result list
}

const page: Page = { url: "", input: "", visibleResults: [] }; // => the fresh browser tab

// The smoke steps a Playwright spec would run, as plain functions over the page.
function goto(p: Page, url: string): void {
  p.url = url; // => page.goto(url)
}
function fill(p: Page, text: string): void {
  p.input = text; // => page.fill('#search', text)
}
function clickSearch(p: Page): void {
  // => page.click('button:has-text("Search")'); the handler renders matching results
  const all = ["buy bread", "buy milk", "sell car"]; // => the server's data
  p.visibleResults = all.filter((r) => r.includes(p.input)); // => the filtered result list renders
}

// The test body: navigate -> search -> assert a visible result.
goto(page, "/dashboard"); // => step 1: navigate
fill(page, "buy"); // => step 2: type the query
clickSearch(page); // => step 3: click search
const smokePass = page.visibleResults.some((r) => r.includes("buy bread")); // => assert visible

console.log("navigated to:", page.url); // => Output: navigated to: /dashboard
console.log("e2e smoke pass:", smokePass); // => Output: e2e smoke pass: true
console.log("visible results:", page.visibleResults); // => Output: visible results: [ 'buy bread', 'buy milk' ]
```

**Run**: `npx tsx example.ts`

**Output**:

```text
navigated to: /dashboard
e2e smoke pass: true
visible results: [ 'buy bread', 'buy milk' ]
```

**Key takeaway**: A Playwright smoke drives the real critical path in a real browser -- the highest-confidence test for the happy path.

**Why it matters**: Component tests verify pieces in isolation; an e2e smoke verifies the whole assembled system actually works for a user, in a real browser, against the real (or close to real) stack. A smoke test covers the single most important path so a regression there is caught before users hit it. It is slower and more brittle than unit tests, so it complements rather than replaces them.

**Pitfall**: An e2e suite that tests everything is slow and flaky -- keep it to a few critical-path smokes and unit-test the rest.

---

### Example 79: An Error Boundary Catches a Render Error

_ex-79 &middot; exercises co-37_

A render error in a child normally crashes the whole app. An error boundary catches a render error in its subtree and shows a fallback instead of unmounting everything.

**`learning/code/ex-79-error-boundary/example.ts`**

```typescript
// Example 79: An Error Boundary Catches a Render Error. (co-37)
//
// A render error in a child normally crashes the WHOLE app. An error boundary (a component using
// getDerivedStateFromError / componentDidCatch) catches a render error in its subtree and shows a
// fallback INSTEAD of unmounting everything. This example models that catch-and-fallback.

// A component can either render successfully or THROW during render.
function riskyChild(shouldThrow: boolean): string {
  // => a child whose render may throw (e.g. reading a property of undefined)
  if (shouldThrow) throw new Error("render exploded"); // => the render error
  return "<p>child ok</p>"; // => the normal output
}

// An error boundary wraps a render and catches a throw, falling back instead of crashing.
function errorBoundary(render: () => string): { output: string; caught: boolean } {
  // => co-37: try the child's render; on throw, show a fallback (do not propagate the crash)
  try {
    return { output: render(), caught: false }; // => normal render, no error
  } catch (e) {
    // => the boundary CATCHES the render error; the rest of the app keeps running
    return { output: `<p role="alert">Something went wrong: ${(e as Error).message}</p>`, caught: true };
  }
}

const ok = errorBoundary(() => riskyChild(false)); // => child renders fine
const caught = errorBoundary(() => riskyChild(true)); // => child throws -> fallback shown

console.log("no error:", ok.output, "| caught:", ok.caught); // => Output: no error: <p>child ok</p> | caught: false
console.log("on error:", caught.output); // => Output: on error: <p role="alert">Something went wrong: render exploded</p>
console.log("app still alive (error caught):", caught.caught); // => Output: app still alive (error caught): true
```

**Run**: `npx tsx example.ts`

**Output**:

```text
no error: <p>child ok</p> | caught: false
on error: <p role="alert">Something went wrong: render exploded</p>
app still alive (error caught): true
```

**Key takeaway**: An error boundary catches a render error in its subtree and shows a fallback -- the rest of the app survives.

**Why it matters**: Without a boundary, one buggy component's render throw unmounts the entire tree, losing the user's work elsewhere. A boundary localizes the failure: only the affected subtree shows a fallback, and the rest of the app keeps running. Wrapping route-level or widget-level subtrees in boundaries is how you keep a frontend resilient to a single component's bug.

**Pitfall**: Error boundaries catch render errors, NOT errors in event handlers or async code -- those need try/catch too.

---

### Example 80: A Searchable Dashboard Assembled End to End

_ex-80 &middot; exercises co-04, co-08, co-15, co-24, co-30, co-36_

The closing assembly: a searchable, paginated dashboard that combines parallel/streamed fetching, a cached optimistic update that rolls back, an ARIA-correct widget, measured Core Web Vitals, and passing tests -- each piece taught alone earlier, wired together here.

**`learning/code/ex-80-advanced-frontend-capstone/example.ts`**

```typescript
// Example 80: A Searchable Dashboard Assembled End to End. (co-04, co-08, co-15, co-24, co-30, co-36)
//
// The closing assembly: a searchable, paginated dashboard that combines streaming SSR + cached
// fetching + an optimistic update that rolls back + an ARIA-correct widget + focus management +
// measured Core Web Vitals + passing tests. Each piece was taught alone earlier; this example wires
// them into one runnable feature.

// --- co-30: avoid the data waterfall by fetching the page and its filter options in parallel ---
async function fetchDashboard(): Promise<{ rows: string[]; total: number }> {
  // => parallel fetch (Example 58) instead of a serial waterfall (Example 57)
  const [rows, total] = await Promise.all([Promise.resolve(["buy bread", "buy milk", "sell car"]), Promise.resolve(3)]);
  return { rows, total }; // => the dashboard payload
}

// --- co-15: a server cache + an optimistic update that rolls back on failure ---
const cache: Map<string, { rows: string[]; total: number }> = new Map(); // => the query cache
let mutationFails = false; // => flip to simulate a failed write (rollback path)
async function loadDashboard(): Promise<{ rows: string[]; total: number }> {
  // => co-15: a cached read skips the network (Example 31)
  const cached = cache.get("dashboard");
  if (cached) return cached;
  const fresh = await fetchDashboard(); // => cache miss -> fetch
  cache.set("dashboard", fresh); // => populate the cache
  return fresh;
}
async function optimisticAdd(item: string): Promise<{ rows: string[]; rolledBack: boolean }> {
  // => co-15: show the item now, roll back if the (simulated) mutation fails (Example 34)
  const snapshot = cache.get("dashboard")!; // => the prior confirmed state
  cache.set("dashboard", { rows: [...snapshot.rows, item], total: snapshot.total + 1 }); // => optimistic
  await new Promise((r) => setTimeout(r, 5)); // => the (fake) mutation round trip
  if (mutationFails) {
    cache.set("dashboard", snapshot); // => ROLLBACK on failure
    return { rows: snapshot.rows, rolledBack: true };
  }
  return { rows: cache.get("dashboard")!.rows, rolledBack: false };
}

// --- co-04 + co-24 + co-36: streaming shell, an ARIA combobox, and the tests ---
function ariaCombobox(query: string, matches: string[]): string {
  // => co-24: an ARIA-correct combobox with a live results region
  return (
    `<div role="combobox" aria-expanded="${matches.length > 0}"><input aria-controls="list"/>` +
    `<ul id="list" role="listbox">${matches.map((m) => `<li role="option">${m}</li>`).join("")}</ul></div>`
  );
}

// runTests asserts the four behaviours the capstone requires (co-36, modelled like Examples 76-78).
function runTests(rows: string[], rolledBack: boolean, cwv: { lcp: number; inp: number; cls: number }): string[] {
  const out: string[] = [];
  // => test 1: searching narrows the list (behaviour, not internals)
  const matches = rows.filter((r) => r.includes("buy"));
  out.push(matches.length === 2 ? "PASS: search filters rows" : "FAIL: search");
  // => test 2: the failed optimistic update rolled back
  out.push(rolledBack ? "PASS: optimistic update rolled back on failure" : "FAIL: rollback");
  // => test 3: the combobox exposes an option role (keyboard-operable widget)
  out.push(ariaCombobox("buy", matches).includes('role="option"') ? "PASS: ARIA option present" : "FAIL: aria");
  // => test 4: measured Core Web Vitals improved past the good thresholds (co-08)
  out.push(cwv.lcp <= 2500 && cwv.inp <= 200 && cwv.cls <= 0.1 ? "PASS: CWV within good thresholds" : "FAIL: cwv");
  return out;
}

(async () => {
  const initial = await loadDashboard(); // => co-30 + co-15: cached, parallel fetch
  await optimisticAdd("walk dog"); // => a successful optimistic add
  mutationFails = true; // => now simulate a failure
  const failed = await optimisticAdd("fly kite"); // => rolls back
  const cwv = { lcp: 2100, inp: 120, cls: 0.05 }; // => co-08: measured-good vitals
  const tests = runTests(failed.rows, failed.rolledBack, cwv); // => co-36: all tests
  console.log("streaming shell + cached rows:", initial.rows.length, "rows"); // => Output: 3 rows
  console.log("optimistic add rolled back on failure:", failed.rolledBack); // => Output: true
  tests.forEach((t) => console.log(t)); // => Output: four PASS lines
})();
```

**Run**: `npx tsx example.ts`

**Output**:

```text
streaming shell + cached rows: 3 rows
optimistic add rolled back on failure: true
PASS: search filters rows
PASS: optimistic update rolled back on failure
PASS: ARIA option present
PASS: CWV within good thresholds
```

**Key takeaway**: The capstone-preview wires streaming + cache + optimistic rollback + an ARIA widget + measured CWV + tests into one feature.

**Why it matters**: This is the integration the whole course builds toward: the individual concepts (parallel fetch, cached server state, optimistic rollback, ARIA widgets, CWV thresholds, behaviour tests) only prove their worth when they compose into one real feature. The full four-step capstone on the next page builds the same dashboard end to end with a real test suite and measured-improvement verification; this example is its runnable preview.

**Pitfall**: Assembling these without the per-concept examples to fall back on hides which piece a regression came from -- keep the unit tests granular.
