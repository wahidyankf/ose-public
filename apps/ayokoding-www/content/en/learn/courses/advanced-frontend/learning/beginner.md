---
title: "Beginner Examples"
date: 2026-07-29T00:00:00+07:00
draft: false
weight: 10
---

Examples 1-28 cover the vocabulary every later example builds on: the four rendering strategies (CSR, SSR, SSG, streaming), hydration and its mismatch warning, islands and React Server Components, the Core Web Vitals triad (LCP, INP, CLS) with their current 2026 thresholds, the critical rendering path, code splitting and tree shaking, the Rules of Hooks, the useEffect semantics (after paint, cleanup, deps), useMemo/useCallback, reconciliation and keys, and the controlled-input rule. Every example is a complete, self-contained, originally-authored TypeScript file using only the standard library -- no React, Next.js, or browser install is required, because the framework and DOM mechanics are modeled in pure TypeScript. Run each with `npx tsx example.ts`; every printed line below was captured from an actual run of the file shown, not hand-traced.

---

### Example 1: Client Side Rendering Boots an Empty Shell

_ex-01 &middot; exercises co-01_

Client-side rendering ships an empty HTML shell and fills it by booting a JavaScript bundle. Before that bundle runs, the page has no content at all.

**`learning/code/ex-01-csr-render/example.ts`**

```typescript
// Example 1: Client Side Rendering Boots an Empty Shell. (co-01)
//
// CSR: the server ships an EMPTY shell and the browser boots a JS bundle that fills it.
// This is the opposite of SSR (Example 2): before JS runs there is NOTHING to read, so the
// pre-JS DOM is blank -- a crawler or a no-JS user sees an empty page.

// The "server" ships this exact HTML body: a root div with no children at all.
const SHELL_HTML = `<div id="root"></div>`; // => co-01: the empty shell, pre-JS
// => SHELL_HTML contains zero text content; only the JS bundle can ever fill it

// A minimal DOM model -- enough to represent "a node that may or may not exist yet".
interface DomNode {
  // => a real DOM element has many fields; this model keeps only what proves the point
  tag: string; // => the element type (h1, p, ...)
  text: string; // => the rendered text content
}

// readDom reports a node's text, or "<empty>" when nothing has rendered yet.
function readDom(node: DomNode | null): string {
  // => the union `DomNode | null` is exactly "a node that may not exist yet"
  return node ? node.text : "<empty>"; // => null -> the blank shell
}

// A client renderer boots the bundle and produces the first real content.
function clientRender(): DomNode {
  // => stands in for React mounting <h1>Hello, CSR</h1> into #root
  return { tag: "h1", text: "Hello, CSR" }; // => content exists ONLY after this runs
}

// --- The CSR lifecycle, in order ---
const shell = null; // => before JS: the root has no DOM node -- the blank shell
console.log("pre-JS DOM:", readDom(shell)); // => Output: pre-JS DOM: <empty>
const mounted = clientRender(); // => JS boots; the bundle fills the shell
console.log("post-render DOM:", readDom(mounted)); // => Output: post-render DOM: Hello, CSR
```

**Run**: `npx tsx example.ts`

**Output**:

```text
pre-JS DOM: <empty>
post-render DOM: Hello, CSR
```

**Key takeaway**: Under CSR the pre-JS DOM is blank -- content exists only after the bundle executes.

**Why it matters**: CSR trades first-paint speed and crawlability for a simpler deploy story (static files plus an API). The empty shell is the defining cost: a no-JS visitor or a crawler sees nothing until the bundle boots. Every later rendering strategy (Examples 2-4) is a response to exactly this blank-shell problem.

**Pitfall**: Measuring LCP on a CSR page really measures bundle download + execute time, not server speed.

---

### Example 2: Server Side Rendering Returns Complete HTML

_ex-02 &middot; exercises co-02_

Server-side rendering produces fully-formed HTML per request. The content is in the response body before any JavaScript runs, so the page is readable and indexable immediately.

**`learning/code/ex-02-ssr-render/example.ts`**

```typescript
// Example 2: Server Side Rendering Returns Complete HTML. (co-02)
//
// SSR: the server returns FULLY-FORMED HTML per request -- the content exists before any JS
// runs. Contrast Example 1's empty shell: here the response body already contains the content,
// so the page is readable (and indexes) immediately.

// The smallest component model: a tag plus the text it wraps.
interface Component {
  // => only the two fields the HTML-string claim actually depends on
  tag: string; // => the element type
  text: string; // => the wrapped text content
}

// renderToString turns a component into its HTML string WITH content baked in.
function renderToString(c: Component): string {
  // => the server-side equivalent of React's renderToString -- markup, not a data object
  return `<${c.tag}>${c.text}</${c.tag}>`; // => angle brackets => a real HTML string
}

// Each request calls renderToString and gets COMPLETE HTML back.
const first = renderToString({ tag: "h1", text: "Hello, SSR" }); // => request 1's body
const second = renderToString({ tag: "h1", text: "Hello, SSR" }); // => request 2's body
// => SSR produces the identical complete HTML on every request -- it is not cached at build (that is Example 3)

// Pre-JS, the content is ALREADY present in the string -- the key difference from CSR.
console.log("SSR HTML (pre-JS):", first); // => Output: SSR HTML (pre-JS): <h1>Hello, SSR</h1>
console.log("identical per request:", first === second); // => Output: identical per request: true
```

**Run**: `npx tsx example.ts`

**Output**:

```text
SSR HTML (pre-JS): <h1>Hello, SSR</h1>
identical per request: true
```

**Key takeaway**: SSR bakes content into the HTML string -- the browser receives it already rendered.

**Why it matters**: SSR fixes CSR's blank shell: the user sees real content on the first paint and search engines can index it without executing JS. The cost is server work on every request (Example 3's SSG avoids that by baking once at build time). This is the per-request variant; streaming (Example 4) makes it incremental.

**Pitfall**: SSR does not make the page interactive on its own -- you still need hydration (Example 5) to attach event handlers.

---

### Example 3: Static Site Generation Pre-renders at Build Time

_ex-03 &middot; exercises co-03_

Static site generation renders pages to HTML files at build time. Every visitor gets the same bytes, because nothing renders per request.

**`learning/code/ex-03-ssg-build/example.ts`**

```typescript
// Example 3: Static Site Generation Pre-renders at Build Time. (co-03)
//
// SSG: pages are pre-rendered to static HTML at BUILD time, then served as plain files. Unlike
// SSR (Example 2, per-request) this HTML is identical for every visitor because it was baked once.

// A build step writes each page's HTML to a file once, ahead of any request.
const builtFiles: Map<string, string> = new Map(); // => the "build output" directory
// => a Map models the dist/ folder: filename -> static HTML contents

// buildPage renders one page to a static file at build time (runs ONCE, not per request).
function buildPage(path: string, content: string): void {
  // => at build time the content is fixed; the file will never change until the next build
  builtFiles.set(path, `<main>${content}</main>`); // => co-03: static HTML, baked once
}

buildPage("/about", "About us"); // => baked into /about.html at build time
// => every future request for /about serves the SAME bytes -- no rendering happens per request

// Two "requests" at runtime both read the identical pre-built file.
const requestA = builtFiles.get("/about"); // => runtime: just a file read
const requestB = builtFiles.get("/about"); // => runtime: the same file read

console.log("served HTML:", requestA); // => Output: served HTML: <main>About us</main>
console.log("static (byte-identical):", requestA === requestB); // => Output: static (byte-identical): true
```

**Run**: `npx tsx example.ts`

**Output**:

```text
served HTML: <main>About us</main>
static (byte-identical): true
```

**Key takeaway**: SSG bakes HTML once at build time; serving it is just a file read.

**Why it matters**: SSG is the cheapest, fastest, most cacheable strategy -- a CDN can serve the static files forever. It fits content that does not change per user (marketing pages, docs, blogs). The trade-off is freshness: changing content needs a rebuild or incremental regeneration, unlike SSR which always reflects current data.

**Pitfall**: If the data changes between builds the page is stale until the next build -- pick SSR or ISR for time-sensitive content.

---

### Example 4: Streaming SSR Sends a Suspense Fallback First

_ex-04 &middot; exercises co-04_

Streaming SSR sends HTML in chunks. A Suspense fallback goes out immediately, then the real content streams in once its async data resolves -- the browser can paint before the slow part is ready.

**`learning/code/ex-04-streaming-ssr-suspense/example.ts`**

```typescript
// Example 4: Streaming SSR Sends a Suspense Fallback First. (co-04)
//
// Streaming SSR sends HTML in CHUNKS: a <Suspense> fallback goes out immediately, then the real
// content streams in once the async work resolves. The browser can paint the fallback before the
// slow data is ready -- the opposite of waiting for the whole page to finish server-side.

// Each chunk the server flushes down the wire, in arrival order.
const wire: string[] = []; // => the byte stream the browser receives, chunk by chunk
// => pushing in order models TCP streaming: the browser renders each chunk as it arrives

// A Suspense boundary ships its fallback IMMEDIATELY, then its children once they resolve.
function renderStreaming(fallback: string, slow: () => string): void {
  wire.push(`<!-- shell -->`); // => the page shell streams first
  wire.push(fallback); // => co-04: the fallback goes out before the slow data is ready
  // => the browser can paint the fallback now; it does NOT block on `slow()`
  wire.push(slow()); // => the resolved real content streams in later, replacing the fallback
}

// slowData models an async data fetch that is not ready for a while.
function slowData(): string {
  // => standing in for a database/API call; the point is it is NOT available up front
  return `<p>real content</p>`; // => the eventual payload
}

renderStreaming(`<p>loading...</p>`, slowData); // => fallback then content

// The wire shows the fallback BEFORE the resolved content -- the whole point of streaming.
console.log("chunks in arrival order:"); // => Output header
wire.forEach((chunk, i) => console.log(`  [${i}] ${chunk}`)); // => one line per chunk, in order
```

**Run**: `npx tsx example.ts`

**Output**:

```text
chunks in arrival order:
  [0] <!-- shell -->
  [1] <p>loading...</p>
  [2] <p>real content</p>
```

**Key takeaway**: Streaming ships a fallback first, then the resolved content later -- no waiting on the slowest data.

**Why it matters**: Without streaming, one slow data fetch blocks the entire page's first byte. With streaming, the shell and the fast parts paint immediately and only the genuinely-slow region waits behind its fallback. This is how SSR stays responsive when a page has one expensive component among many cheap ones.

**Pitfall**: A fallback that looks nothing like the resolved content causes a jarring reflow when it swaps in.

---

### Example 5: Hydration Attaches React to Server HTML

_ex-05 &middot; exercises co-05_

Hydration attaches event handling to the server's existing HTML instead of re-rendering it. After hydration the same DOM nodes become interactive.

> **Note:** `hydrateRoot` lets you display React components inside a browser DOM node whose HTML content was previously generated by `react-dom/server` ([react.dev, hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)).

**`learning/code/ex-05-hydration-attach/example.ts`**

```typescript
// Example 5: Hydration Attaches React to Server HTML. (co-05)
//
// Hydration: the server already sent fully-formed HTML (Example 2); hydrateRoot ATTACHES React's
// event handling to that existing HTML instead of re-rendering it from scratch. After hydration,
// the same DOM nodes become interactive.
//
// Note: "`hydrateRoot` lets you display React components inside a browser DOM node
// whose HTML content was previously generated by `react-dom/server`."
// Source: react.dev, hydrateRoot (https://react.dev/reference/react-dom/client/hydrateRoot).

// The server's pre-rendered HTML already has the button in the DOM.
const serverHtml = `<button id="b">count: 0</button>`; // => exists before hydration
// => a user could already READ this; they just cannot CLICK it to update until hydration attaches the handler

// A minimal in-memory DOM node with an attachable click handler.
interface DomEl {
  // => enough of a DOM node to model "attach a handler to existing markup"
  html: string; // => the markup the server sent
  handler: (() => void) | null; // => null = not yet interactive (pre-hydration)
}

const button: DomEl = { html: serverHtml, handler: null }; // => pre-hydration: handler is null
// => handler === null means clicks do nothing yet -- the DOM is present but inert

// hydrateRoot attaches the event handlers to the EXISTING server HTML (no re-render).
function hydrateRoot(el: DomEl, onEvent: () => void): void {
  // => co-05: attach, do not recreate -- the server's <button> is reused
  el.handler = onEvent; // => now the same node is interactive
}

let count = 0; // => the component state
// => the click handler updates state and (in a real app) re-renders; here it mutates count

console.log("pre-hydration:", button.html, "| interactive:", button.handler !== null); // => BEFORE attach: interactive is false
hydrateRoot(button, () => {
  // => this closure is the React click handler, now wired to the existing button
  count += 1; // => a click increments the count
  button.html = `<button id="b">count: ${count}</button>`; // => reflect the new state in the DOM
});

button.handler!(); // => simulate a user click AFTER hydration
button.handler!(); // => a second click
console.log("post-hydration:", button.html); // => Output: post-hydration: <button id="b">count: 2</button>
```

**Run**: `npx tsx example.ts`

**Output**:

```text
pre-hydration: <button id="b">count: 0</button> | interactive: false
post-hydration: <button id="b">count: 2</button>
```

**Key takeaway**: hydrateRoot attaches handlers to the existing server HTML -- it reuses, not recreates.

**Why it matters**: Hydration is what turns a server-rendered page from readable into interactive. The server HTML is already there (Example 2); hydration's job is to wire React's event system to those nodes so clicks and input work, without throwing away and rebuilding the DOM the user can already see.

**Pitfall**: Hydration still ships the component JS to the client -- it is not free, so large apps hydrate selectively.

---

### Example 6: A Hydration Mismatch Warns and Recovers

_ex-06 &middot; exercises co-05_

A hydration mismatch happens when the server and the client render different content for the same node. React warns and then recovers by re-rendering the client tree.

**`learning/code/ex-06-hydration-mismatch/example.ts`**

```typescript
// Example 6: A Hydration Mismatch Warns and Recovers. (co-05)
//
// A hydration mismatch happens when the server and the client render DIFFERENT content for the
// same node. React warns (it cannot safely reconcile the difference) and then recovers by
// re-rendering the client tree. The classic cause: reading something client-only (e.g. the current
// time, or `window`) during render.

// The collected console warnings -- a real React build would log these to the browser console.
const warnings: string[] = []; // => stands in for the dev-console warning sink
// => pushing a string here models React's "Warning: Text content did not match" output

// The server renders a fixed value; the client reads a different (client-only) value.
const serverText = "count: 0"; // => the server's deterministic render
// => the server has no access to client-only state, so it renders a fixed value

// During hydration the client renders based on client-only state -> a different value.
function clientRender(): string {
  // => reading `Math.random()` / `Date.now()` / `window` here is the classic mismatch cause
  const clientOnlyState = 1; // => a value the server could NOT have known
  return `count: ${clientOnlyState}`; // => differs from serverText -> mismatch
}

// hydrateRoot compares server vs client text; a difference is reported then recovered.
function hydrateRoot(serverValue: string, clientValue: string): string {
  // => co-05: React compares the existing server HTML against the client's first render
  if (serverValue !== clientValue) {
    // => the mismatch is a bug to fix, not a crash: warn, then discard the server HTML
    warnings.push(`Warning: Text content did not match. Server: "${serverValue}" Client: "${clientValue}"`);
  }
  return clientValue; // => recovery: React re-renders from the client tree
}

const rendered = hydrateRoot(serverText, clientRender()); // => mismatch detected
// => the warning fires AND the client value wins -- both happen on the same hydration pass

console.log("warnings:", warnings); // => Output: the mismatch warning string
console.log("recovered DOM:", rendered); // => Output: recovered DOM: count: 1
```

**Run**: `npx tsx example.ts`

**Output**:

```text
warnings: [
  'Warning: Text content did not match. Server: "count: 0" Client: "count: 1"'
]
recovered DOM: count: 1
```

**Key takeaway**: A server/client content difference warns and recovers -- the client render wins.

**Why it matters**: The classic mismatch cause is reading client-only state (the current time, window dimensions, Math.random) during render, so the server and client produce different output. The warning is a real bug to fix, not a crash: React discards the mismatched server HTML and re-renders from the client, but that recovery costs a wasted render you should eliminate.

**Pitfall**: Reading Date.now() or window at module/render time is the most common mismatch source -- push it into an effect.

---

### Example 7: An Islands Page Ships JS Only to the Island

_ex-07 &middot; exercises co-06_

Islands architecture ships a mostly-static page with a few small hydrated islands of interactivity. Only the islands contribute any JavaScript bytes.

> **Note:** islands means "rendering the majority of your page to fast, static HTML with smaller 'islands' of JavaScript ... when interactivity ... is needed." ([Astro Docs -- Islands](https://docs.astro.build/en/concepts/islands/)).

**`learning/code/ex-07-islands-astro/example.ts`**

```typescript
// Example 7: An Islands Page Ships JS Only to the Island. (co-06)
//
// Islands architecture: most of the page is static HTML with ZERO JavaScript; only small
// "islands" of interactivity ship any JS at all. The result: a page that is mostly static (fast,
// cacheable) plus a few hydrated widgets.
//
// Note: islands means "rendering the majority of your page to fast, static HTML with
// smaller 'islands' of JavaScript ... when interactivity ... is needed." Source: Astro Docs --
// Islands (https://docs.astro.build/en/concepts/islands/).

// Each region of the page is either static (no JS) or an island (ships JS).
interface Region {
  // => the only thing that varies between a static region and an island is jsBytes
  name: string; // => the region's label
  jsBytes: number; // => 0 = static HTML; >0 = an interactive island that ships JS
}

const page: Region[] = [
  // => a mostly-static page: the header, hero, and footer need no JS at all
  { name: "header", jsBytes: 0 }, // => static
  { name: "hero", jsBytes: 0 }, // => static
  { name: "counter-island", jsBytes: 2048 }, // => co-06: the ONE interactive island
  { name: "footer", jsBytes: 0 }, // => static
];

// Total JS shipped is the SUM of only the islands' bytes (static regions contribute zero).
const totalJs = page.reduce((sum, r) => sum + r.jsBytes, 0); // => only the island counts
// => a comparable CSR page would ship JS for the WHOLE page, not just one island

const islands = page.filter((r) => r.jsBytes > 0).map((r) => r.name); // => which regions shipped JS

console.log("JS shipped (bytes):", totalJs); // => Output: JS shipped (bytes): 2048
console.log("hydrated islands:", islands); // => Output: hydrated islands: [ 'counter-island' ]
```

**Run**: `npx tsx example.ts`

**Output**:

```text
JS shipped (bytes): 2048
hydrated islands: [ 'counter-island' ]
```

**Key takeaway**: Most of an islands page is static HTML; JS ships only to the interactive islands.

**Why it matters**: Islands (popularized by Astro) get CSR's interactivity where you need it without paying its whole-page JS cost. A page that is 95% static content plus one interactive widget ships JS for just that widget, keeping the bundle small and the page fast and cacheable -- the best of SSG and CSR combined.

**Pitfall**: Two islands that need to share state cannot do so cheaply -- you may end up pulling them into one bigger island.

---

### Example 8: The use client Directive Marks the Module Tree Boundary

_ex-08 &middot; exercises co-07_

In React Server Components, 'use client' marks the boundary between server and client code on the module dependency tree -- not the render tree.

> **Note:** 'use client' must be at the very beginning of a file, above any imports; it defines the boundary between server and client code on the module dependency tree, not the render tree ([react.dev, 'use client'](https://react.dev/reference/rsc/use-client)).

**`learning/code/ex-08-use-client-boundary/example.ts`**

```typescript
// Example 8: The use client Directive Marks the Module Tree Boundary. (co-07)
//
// In React Server Components, 'use client' marks the boundary between server and client code on
// the MODULE DEPENDENCY TREE -- not the render tree. A client component can still render a server
// component through its `children` prop (passed from a server parent), because `children` is not
// an import across the boundary.
//
// Note: "'use client' ... must be at the very beginning of a file, above any
// imports; it defines the boundary between server and client code on the module dependency tree,
// not the render tree." Source: react.dev, 'use client'
// (https://react.dev/reference/rsc/use-client).

// A module is tagged by which side of the boundary it lives on.
type Side = "server" | "client"; // => the two sides of the module boundary
// => the boundary is about IMPORTS, not about which components render inside which

interface Module {
  // => each source file is one module, with a side and the modules it imports
  name: string; // => the module's id
  side: Side; // => server (default) or client (after 'use client')
  imports: string[]; // => modules this file statically imports across the boundary
}

// Server component imports the client component -> the client module crosses into client-land.
const serverModule: Module = {
  // => a server component: no 'use client' directive, so side is server by default
  name: "Page", // => the top-level server component
  side: "server", // => co-07: server components are the default
  imports: ["Counter"], // => it imports the client component -> the boundary is HERE
};

const clientModule: Module = {
  // => 'use client' at the top of this file marks everything it imports as client code
  name: "Counter", // => the interactive client component
  side: "client", // => co-07: 'use client' put this module on the client side of the tree
  imports: [], // => client modules cannot import server components directly...
};

// ...but a client component CAN render a server component via `children` (no import needed).
function serverRendersClientChild(): boolean {
  // => children is passed AS A PROP from the server parent, not imported by the client child
  return true; // => the render-tree composition is allowed even though imports are one-way
}

console.log("boundary module (client):", clientModule.name); // => Output: boundary module (client): Counter
console.log("server imports client:", serverModule.imports); // => Output: server imports client: [ 'Counter' ]
console.log("client renders server via children:", serverRendersClientChild()); // => Output: client renders server via children: true
```

**Run**: `npx tsx example.ts`

**Output**:

```text
boundary module (client): Counter
server imports client: [ 'Counter' ]
client renders server via children: true
```

**Key takeaway**: 'use client' is a MODULE-IMPORT boundary, not a render-tree boundary; children can still cross it.

**Why it matters**: The boundary being about imports means a client component can still render a server component through its children prop (passed from a server parent), because children is composition, not an import. This is the subtle rule that lets you keep most of a tree server-rendered while punching a small interactive hole through it.

**Pitfall**: Importing a server component directly into a client component pulls it across the boundary -- pass it as children instead.

---

### Example 9: A Server Component Ships No Client JS

_ex-09 &middot; exercises co-07_

A server component (the default, with no 'use client') renders to HTML on the server and ships zero client JavaScript for itself.

**`learning/code/ex-09-server-component-default/example.ts`**

```typescript
// Example 9: A Server Component Ships No Client JS. (co-07)
//
// A server component (the DEFAULT -- no 'use client') renders to HTML on the server and ships NO
// client JavaScript for itself. Its output is plain markup; the browser never receives a JS bundle
// for it. This is the complement of Example 8's client boundary.

// A component is either server (no JS) or client (ships JS).
interface Ship {
  // => the only fact that matters here: how many JS bytes this component adds to the client bundle
  component: string; // => the component's name
  clientJsBytes: number; // => 0 for a server component; >0 for a client component
}

// A server component renders to an HTML string and contributes ZERO client bytes.
function serverComponent(): { html: string; ship: Ship } {
  // => the render runs on the server; nothing about it is sent as executable JS
  return {
    html: `<nav><a href="/">Home</a></nav>`, // => pure markup in the response
    ship: { component: "Nav", clientJsBytes: 0 }, // => co-07: no client JS for a server component
  };
}

const result = serverComponent(); // => the server renders Nav to HTML
// => the browser receives the <nav> markup but no Nav.js bundle -- it is inert, fast, cacheable

console.log("server HTML:", result.html); // => Output: server HTML: <nav><a href="/">Home</a></nav>
console.log("client JS shipped:", result.ship.clientJsBytes, "bytes"); // => Output: client JS shipped: 0 bytes
```

**Run**: `npx tsx example.ts`

**Output**:

```text
server HTML: <nav><a href="/">Home</a></nav>
client JS shipped: 0 bytes
```

**Key takeaway**: Server components render on the server and contribute no JS to the client bundle.

**Why it matters**: Server components are the complement of Example 8's boundary: the bulk of a tree can stay server-side, reading databases and files directly, while shipping only markup. The browser never receives a JS bundle for them, so they are inert, fast, and cacheable. This is how a large app keeps its client bundle small.

**Pitfall**: Server components cannot use hooks or browser APIs -- once you need interactivity you cross into a client component.

---

### Example 10: Measuring LCP and Finding the LCP Element

_ex-10 &middot; exercises co-08, co-09_

Largest Contentful Paint measures loading: the time of the largest text block or image to paint. You measure it to find which element is the bottleneck.

**`learning/code/ex-10-lcp-measure/example.ts`**

```typescript
// Example 10: Measuring LCP and Finding the LCP Element. (co-08, co-09)
//
// Largest Contentful Paint (LCP) measures loading: the time of the largest text block or image
// that paints. The "LCP element" is whichever element won that race. Good <= 2.5 s; poor > 4.0 s,
// at the 75th percentile over a rolling 28-day CrUX window.
//
// Note: LCP good <= 2.5 s / poor > 4.0 s, at the 75th percentile. Source:
// web.dev, LCP (https://web.dev/articles/lcp).

// Each "paint entry" the browser would report: an element and when it painted (ms).
interface PaintEntry {
  // => stands in for the PerformanceObserver `largest-contentful-paint` entries
  element: string; // => a CSS-like selector naming what painted
  time: number; // => milliseconds from navigation start to the paint
}

// The raw paint entries this simulated page produced, in arrival order.
const entries: PaintEntry[] = [
  // => small elements paint early; the hero image is largest but arrives latest
  { element: "span.badge", time: 400 }, // => a small badge paints first
  { element: "h1.title", time: 900 }, // => the title paints next
  { element: "img.hero", time: 2600 }, // => the hero image is largest and slowest -> it is the LCP
];

// computeLCP returns the entry with the LARGEST paint time -- the last big thing to paint.
function computeLCP(all: PaintEntry[]): PaintEntry {
  // => LCP is defined as the maximum render time of the largest contentful element
  return all.reduce((max, e) => (e.time > max.time ? e : max)); // => pick the latest-painting entry
}

const lcp = computeLCP(entries); // => the hero image wins the LCP race
const verdict = lcp.time <= 2500 ? "good" : lcp.time > 4000 ? "poor" : "needs improvement"; // => the web.dev bands

console.log("LCP element:", lcp.element); // => Output: LCP element: img.hero
console.log("LCP time (ms):", lcp.time); // => Output: LCP time (ms): 2600
console.log("rating:", verdict); // => Output: rating: needs improvement
```

**Run**: `npx tsx example.ts`

**Output**:

```text
LCP element: img.hero
LCP time (ms): 2600
rating: needs improvement
```

**Key takeaway**: LCP is the latest-painting large element; fixing LCP means optimizing that specific element.

**Why it matters**: LCP tells you not just how fast the page is but WHY -- the reported element is the one to optimize (usually the hero image or a large font). Until you know which element is the LCP, you are guessing. Good LCP is at or below 2.5 s at the 75th percentile.

**Pitfall**: A slow hero image is the most common LCP culprit -- preload it and reserve its dimensions (Example 63).

---

### Example 11: Measuring INP on an Interaction

_ex-11 &middot; exercises co-08, co-10_

Interaction to Next Paint measures responsiveness: the latency from a user input to the next painted frame. A page's INP is its worst interaction.

> **Note:** INP replaced FID as a stable Core Web Vital on March 12, 2024 ([web.dev](https://web.dev/blog/inp-cwv-launch)).

**`learning/code/ex-11-inp-measure/example.ts`**

```typescript
// Example 11: Measuring INP on an Interaction. (co-08, co-10)
//
// Interaction to Next Paint (INP) measures RESPONSIVENESS: the latency from a user input (click,
// keypress) to the next painted frame. Good <= 200 ms; poor > 500 ms, at the 75th percentile.
//
// Note: INP good <= 200 ms / poor > 500 ms. INP replaced FID as a stable Core Web
// Vital on March 12, 2024. Source: web.dev, INP (https://web.dev/articles/inp).

// An interaction's latency is the sum of its processing + presentation delay + (input) delay.
interface Interaction {
  // => INP breaks latency into parts; the sum is what the user feels
  name: string; // => a label for the interaction (e.g. "click toggle")
  inputDelay: number; // => ms the main thread was busy before the event handler ran
  processing: number; // => ms the handler itself took
  presentationDelay: number; // => ms until the next frame painted
}

// The interactions observed during a page's life.
const interactions: Interaction[] = [
  // => a tight button click (fast) and a heavy sort (slow) -- INP is the WORST of them
  { name: "click toggle", inputDelay: 40, processing: 60, presentationDelay: 50 }, // => 150 ms total
  { name: "click sort", inputDelay: 180, processing: 220, presentationDelay: 120 }, // => 520 ms total
];

// inpOf sums the three parts; the page's INP is the WORST (max) interaction latency.
function inpOf(i: Interaction): number {
  // => all three phases happen between the input and the next paint, so they all count
  return i.inputDelay + i.processing + i.presentationDelay; // => the felt latency
}

const pageInp = Math.max(...interactions.map(inpOf)); // => INP = the worst interaction
const worst = interactions.find((i) => inpOf(i) === pageInp)!; // => which interaction was worst
const verdict = pageInp <= 200 ? "good" : pageInp > 500 ? "poor" : "needs improvement"; // => the web.dev bands

console.log("page INP (ms):", pageInp); // => Output: page INP (ms): 520
console.log("worst interaction:", worst.name); // => Output: worst interaction: click sort
console.log("rating:", verdict); // => Output: rating: poor
```

**Run**: `npx tsx example.ts`

**Output**:

```text
page INP (ms): 520
worst interaction: click sort
rating: poor
```

**Key takeaway**: INP is the worst input-to-paint latency across all interactions -- find that one interaction.

**Why it matters**: INP replaced FID in March 2024 because FID only measured the FIRST interaction's delay, missing jank on later clicks. INP's worst-of-all-interactions definition catches the heavy sort or the slow filter that FID ignored. Good INP is at or below 200 ms.

**Pitfall**: A long main-thread task right when the user clicks inflates input delay -- break it up or defer it.

---

### Example 12: Reserving Space Removes a Layout Shift

_ex-12 &middot; exercises co-08, co-11_

Cumulative Layout Shift measures visual stability. A late-loading image with no reserved space shoves content down when it arrives; reserving its dimensions up front makes the shift zero.

**`learning/code/ex-12-cls-fix/example.ts`**

```typescript
// Example 12: Reserving Space Removes a Layout Shift. (co-08, co-11)
//
// Cumulative Layout Shift (CLS) measures visual stability: how much visible content jumps around.
// A late-loading image with NO reserved space pushes everything down when it arrives -- a shift.
// Reserving its width+height up front means the image drops into a hole that already existed: zero
// shift. Good CLS <= 0.1; poor > 0.25.
//
// Note: CLS = the largest burst of layout-shift scores over the page lifecycle; good
// <= 0.1 / poor > 0.25. Source: web.dev, CLS (https://web.dev/articles/cls).

// A "shift score" = (impact fraction) * (distance fraction); stable layout => 0.
function shiftScore(moved: number, viewport: number): number {
  // => the standard CLS formula uses how far content moved over how much viewport it affected
  return moved / viewport; // => simplified: distance fraction alone, enough to show the effect
}

// WITHOUT reserved space: a 300px-tall image arrives late and shoves content down 300px.
const shiftWithoutSpace = shiftScore(300, 1000); // => 0.30 -- "poor" by the web.dev threshold
// => the reader was reading text that suddenly jumped; that jank is exactly what CLS penalizes

// WITH reserved space: the 300px hole existed from the first paint, so the image adds 0 movement.
const shiftWithSpace = shiftScore(0, 1000); // => 0.00 -- the image fills a pre-existing gap
// => reserving width/height (or aspect-ratio) up front is the single most effective CLS fix

console.log("CLS without reserved space:", shiftWithoutSpace.toFixed(2)); // => Output: CLS without reserved space: 0.30
console.log("CLS with reserved space:", shiftWithSpace.toFixed(2)); // => Output: CLS with reserved space: 0.00
```

**Run**: `npx tsx example.ts`

**Output**:

```text
CLS without reserved space: 0.30
CLS with reserved space: 0.00
```

**Key takeaway**: Reserve width and height up front so late content drops into a hole that already existed.

**Why it matters**: CLS quantifies the jank of content jumping under the user's eye -- the ad that pushes the button, the image that shoves the text. The fix is almost always to reserve the box (width/height or aspect-ratio) so the layout never changes when the content arrives. Good CLS is at or below 0.1.

**Pitfall**: Fonts swapping in cause layout shifts too -- use font-display: optional or size-adjust to reserve the metrics.

---

### Example 13: The Core Web Vitals Good and Poor Thresholds

_ex-13 &middot; exercises co-08_

The Core Web Vitals triad is LCP (loading), INP (responsiveness), and CLS (visual stability). This is the current 2026 triad -- INP, not the retired FID.

> **Note:** INP replaced FID on March 12, 2024 ([web.dev, INP CWV launch](https://web.dev/blog/inp-cwv-launch)). LCP/INP/CLS thresholds from web.dev.

**`learning/code/ex-13-cwv-thresholds-table/example.ts`**

```typescript
// Example 13: The Core Web Vitals Good and Poor Thresholds. (co-08)
//
// The Core Web Vitals triad is LCP (loading), INP (responsiveness), and CLS (visual stability).
// INP REPLACED FID as a stable Core Web Vital on March 12, 2024 -- this table is the current
// (2026) triad, not the older LCP/FID/CLS set. All thresholds are at the 75th percentile over a
// rolling 28-day CrUX window.
//
// Note: INP replaced FID on March 12, 2024
// (https://web.dev/blog/inp-cwv-launch). LCP/INP/CLS thresholds from web.dev.

// Each vital has a name, a unit, and the good / poor band boundaries.
interface Vital {
  // => the three numbers that define a vital's good-vs-poor rating
  name: string; // => the vital's acronym
  unit: string; // => the measurement unit
  good: number; // => at or below this is "good"
  poor: number; // => above this is "poor"
}

const VITALS: Vital[] = [
  // => co-08: the current triad -- note INP, not the retired FID
  { name: "LCP", unit: "ms", good: 2500, poor: 4000 }, // => loading
  { name: "INP", unit: "ms", good: 200, poor: 500 }, // => responsiveness (replaced FID)
  { name: "CLS", unit: "score", good: 0.1, poor: 0.25 }, // => visual stability (unitless score)
];

// rating classifies a measured value into the good / needs-improvement / poor band.
function rating(v: Vital, measured: number): string {
  // => the bands are: <= good -> good, > poor -> poor, in between -> needs improvement
  if (measured <= v.good) return "good"; // => meets the target
  if (measured > v.poor) return "poor"; // => failing
  return "needs improvement"; // => the middle band
}

console.log("Vital | good | poor | unit");
for (const v of VITALS) {
  // => print the threshold table exactly as web.dev states it
  console.log(`${v.name} | <= ${v.good} | > ${v.poor} | ${v.unit}`); // => one row per vital
}

// Sanity-check the classifier against the capstone's measured triad (Example 80).
console.log("a 220ms INP is rated:", rating(VITALS[1], 220)); // => Output: a 220ms INP is rated: needs improvement
```

**Run**: `npx tsx example.ts`

**Output**:

```text
Vital | good | poor | unit
LCP | <= 2500 | > 4000 | ms
INP | <= 200 | > 500 | ms
CLS | <= 0.1 | > 0.25 | score
a 220ms INP is rated: needs improvement
```

**Key takeaway**: The triad is LCP/INP/CLS; INP replaced FID, so any older FID material is out of date.

**Why it matters**: Memorizing the exact good/poor bands lets you read a Lighthouse or CrUX report without ambiguity: each vital is good at-or-below its threshold and poor above its ceiling, at the 75th percentile over 28 days. The INP-not-FID detail is the single most important currency update in this table.

**Pitfall**: Older blog posts and libraries still reference FID -- treat any FID guidance as stale.

---

### Example 14: Render Blocking CSS Delays First Paint

_ex-14 &middot; exercises co-12_

CSS is a render-blocking resource: the browser will not paint until the CSSOM is built. A large external stylesheet delays first paint by its full download+parse time.

> **Note:** "CSS is treated as a render-blocking resource ... the browser won't render any content until the CSSOM is constructed"; "both the DOM and the CSSOM are required to construct the render tree." ([web.dev, render-blocking CSS](https://web.dev/articles/critical-rendering-path/render-blocking-css)).

**`learning/code/ex-14-render-blocking-css/example.ts`**

```typescript
// Example 14: Render Blocking CSS Delays First Paint. (co-12)
//
// CSS is a RENDER-BLOCKING resource: the browser will not paint ANY content until the CSSOM is
// built. Both the DOM AND the CSSOM are required to construct the render tree, so a large
// blocking stylesheet delays first paint by however long it takes to download and parse.
//
// Note: "CSS is treated as a render-blocking resource ... the browser won't render
// any content until the CSSOM is constructed"; "both the DOM and the CSSOM are required to
// construct the render tree." Source: web.dev, render-blocking CSS
// (https://web.dev/articles/critical-rendering-path/render-blocking-css).

// A timeline is a sequence of (event, time-in-ms) pairs the browser would log.
interface Step {
  // => each milestone in the critical rendering path
  event: string; // => what happened
  time: number; // => when, in ms from navigation start
}

// WITHOUT inlining: a 200ms external stylesheet blocks first paint until it finishes.
const externalCss: Step[] = [
  // => the browser cannot build the render tree until the CSSOM is ready
  { event: "HTML parsed", time: 50 }, // => DOM ready
  { event: "CSSOM ready (external)", time: 250 }, // => render tree CANNOT be built until now
  { event: "first paint", time: 260 }, // => co-12: paint is gated on the CSSOM
];

// firstPaintAfter returns the time of the first paint step in a timeline.
function firstPaintAfter(timeline: Step[]): number {
  // => find the "first paint" milestone the browser reports
  return timeline.find((s) => s.event.includes("first paint"))!.time; // => the gating effect, measured
}

console.log("first paint with blocking external CSS (ms):", firstPaintAfter(externalCss)); // => Output: 260
```

**Run**: `npx tsx example.ts`

**Output**:

```text
first paint with blocking external CSS (ms): 260
```

**Key takeaway**: First paint is gated on the CSSOM -- a blocking stylesheet pushes paint back by its load time.

**Why it matters**: Both the DOM and the CSSOM are required to build the render tree, so CSS on the critical path blocks all painting until it is ready. This is why the size and number of render-blocking stylesheets directly controls first paint, and why Example 15's inlining helps.

**Pitfall**: CSS imported by CSS, or chained @import, serializes the blocking chain and multiplies the delay.

---

### Example 15: Inlining Critical CSS Speeds First Paint

_ex-15 &middot; exercises co-12_

Inlining the critical, above-the-fold CSS removes the separate network round trip for it. First paint no longer waits on an external stylesheet to download.

**`learning/code/ex-15-critical-css-inline/example.ts`**

```typescript
// Example 14 showed render-blocking external CSS delays first paint; Example 15 inlines the
// CRITICAL (above-the-fold) CSS so first paint no longer waits on a separate network request for
// it. The non-critical CSS can load asynchronously afterwards. (co-12)

// Each milestone in the rendering timeline (ms from navigation start).
interface Step {
  // => reuse the same timeline shape as Example 14 to make the delta obvious
  event: string;
  time: number;
}

// WITH inlined critical CSS: the CSSOM is ready the instant the HTML is parsed -- no extra wait.
const inlinedCss: Step[] = [
  // => the critical CSS travels INSIDE the HTML, so there is no second network round trip
  { event: "HTML parsed (critical CSS inlined)", time: 50 }, // => DOM + CSSOM ready together
  { event: "first paint", time: 60 }, // => co-12: paint can happen immediately -- no CSSOM wait
];

// firstPaintAfter returns the time of the first paint milestone.
function firstPaintAfter(timeline: Step[]): number {
  // => locate the first-paint entry
  return timeline.find((s) => s.event.includes("first paint"))!.time; // => the measured first paint
}

const firstPaintInlined = firstPaintAfter(inlinedCss); // => 60 ms
const firstPaintExternal = 260; // => Example 14's blocking-external-CSS baseline

console.log("first paint with inlined critical CSS (ms):", firstPaintInlined); // => Output: 60
console.log("saved vs external CSS (ms):", firstPaintExternal - firstPaintInlined); // => Output: 200
```

**Run**: `npx tsx example.ts`

**Output**:

```text
first paint with inlined critical CSS (ms): 60
saved vs external CSS (ms): 200
```

**Key takeaway**: Inline above-the-fold CSS so first paint does not wait on a blocking stylesheet request.

**Why it matters**: This is the direct remedy for Example 14's blocking delay: the critical CSS travels inside the HTML, so the CSSOM is ready the moment the HTML is parsed. The remaining, non-critical CSS loads asynchronously afterwards. The result is a measurable first-paint improvement with no change to the final styled page.

**Pitfall**: Inlining too much CSS bloats every HTML response and defeats the cache -- inline only the critical slice.

---

### Example 16: React lazy and Suspense Load a Chunk on Demand

_ex-16 &middot; exercises co-13_

React.lazy plus a Suspense wrapper defer a component into a separate chunk that loads the first time the component renders. The main bundle stays small.

> **Note:** React.lazy(load) must be called at the top level and needs a <Suspense> wrapper ([react.dev, lazy](https://react.dev/reference/react/lazy)).

**`learning/code/ex-16-code-split-dynamic/example.ts`**

```typescript
// Example 16: React lazy and Suspense Load a Chunk on Demand. (co-13)
//
// `React.lazy(load)` + a `<Suspense>` wrapper defer a component's code into a SEPARATE chunk that
// loads only when the component is first rendered. The main bundle stays small; the heavy
// component is fetched on demand.
//
// Note: `React.lazy(load)` must be called at the top level and needs a `<Suspense>`
// wrapper. Source: react.dev, lazy (https://react.dev/reference/react/lazy).

// Each "chunk" is a named unit of code the bundler emits.
interface Chunk {
  // => the main chunk loads eagerly; lazy chunks load on first render
  name: string; // => the chunk id
  loadedAtRender: number | null; // => null = not yet loaded; N = the render on which it loaded
}

// A registry of chunks and when each one was actually fetched.
const chunks: Chunk[] = [
  // => the main chunk loads on render 0 (initial); the HeavyComponent chunk is NOT loaded yet
  { name: "main", loadedAtRender: 0 }, // => eagerly loaded up front
  { name: "HeavyComponent.lazy", loadedAtRender: null }, // => deferred -- not in the initial bundle
];

// lazy() returns a wrapper whose chunk is fetched the FIRST time it renders, under Suspense.
function makeLazy(chunkName: string): { render: (renderNumber: number) => string } {
  // => co-13: the dynamic import fires on first render, not on module load
  return {
    render(renderNumber: number) {
      const chunk = chunks.find((c) => c.name === chunkName)!; // => locate this lazy chunk
      if (chunk.loadedAtRender === null) chunk.loadedAtRender = renderNumber; // => first render -> fetch
      // => under <Suspense> a fallback shows while the chunk resolves, then the component renders
      return `<Suspense><HeavyComponent/></Suspense>`; // => the lazily-loaded output
    },
  };
}

const LazyHeavy = makeLazy("HeavyComponent.lazy"); // => declared at the top level (per the rule)
// => before render 3 the HeavyComponent is never rendered, so its chunk is NOT fetched yet
LazyHeavy.render(3); // => render 3: HeavyComponent is FIRST rendered -> its chunk loads NOW

const loadedChunkNames = chunks.filter((c) => c.loadedAtRender !== null).map((c) => c.name);
const heavyChunk = chunks.find((c) => c.name === "HeavyComponent.lazy")!; // => when did it load?

console.log("chunks loaded:", loadedChunkNames); // => Output: chunks loaded: [ 'main', 'HeavyComponent.lazy' ]
console.log("HeavyComponent chunk loaded on render:", heavyChunk.loadedAtRender); // => Output: 3
```

**Run**: `npx tsx example.ts`

**Output**:

```text
chunks loaded: [ 'main', 'HeavyComponent.lazy' ]
HeavyComponent chunk loaded on render: 3
```

**Key takeaway**: A lazy component's chunk loads on first render, not on initial bundle load.

**Why it matters**: Code splitting turns one giant bundle into many smaller ones loaded on demand. A heavy component used on only one route never enters the initial download, so the first paint gets faster and that component pays its cost only when actually needed. Suspense provides the fallback while the chunk resolves.

**Pitfall**: React.lazy must be called at the top level, never inside a conditional -- and the chunk needs a Suspense boundary.

---

### Example 17: Route Based Code Splitting

_ex-17 &middot; exercises co-13_

Splitting per route puts each route's components in their own chunk. A visitor on the home page never downloads the dashboard's code, and re-visiting a route reuses its cached chunk.

**`learning/code/ex-17-route-based-splitting/example.ts`**

```typescript
// Example 17: Route Based Code Splitting. (co-13)
//
// Split bundles per ROUTE: each route's components live in their own chunk, loaded only when the
// user navigates to that route. A visitor on the home page never downloads the dashboard's code,
// and vice versa. This is Example 16's lazy-load idea applied at the route level.

// Each route maps to the chunk that owns its components.
const routeChunks: Record<string, string> = {
  // => a record keyed by path; the value is the chunk name that route needs
  "/": "home.chunk", // => the home route's code
  "/dashboard": "dashboard.chunk", // => the dashboard route's code (heavy, charts)
  "/settings": "settings.chunk", // => the settings route's code
};

// loaded tracks which chunks have actually been fetched (a Set of chunk names).
const loaded = new Set<string>(); // => starts empty; nothing is loaded until a route is visited
// => a Set models "the browser's cache of already-fetched chunks"

// navigateTo models a route change: the route's chunk is fetched on first visit.
function navigateTo(path: string): string {
  // => co-13: the route's chunk loads on demand, the first time the route is entered
  const chunk = routeChunks[path]; // => the chunk this route owns
  if (!loaded.has(chunk)) loaded.add(chunk); // => first visit -> fetch the chunk
  return chunk; // => the chunk now resident for this route
}

// A user session: home -> dashboard -> settings -> dashboard again.
navigateTo("/"); // => loads home.chunk
navigateTo("/dashboard"); // => loads dashboard.chunk (heavy charts)
navigateTo("/settings"); // => loads settings.chunk
navigateTo("/dashboard"); // => already loaded -- no second fetch

console.log("chunks loaded after the session:", Array.from(loaded)); // => three chunks, dashboard not re-fetched
console.log("dashboard chunk in cache:", loaded.has("dashboard.chunk")); // => Output: dashboard chunk in cache: true
```

**Run**: `npx tsx example.ts`

**Output**:

```text
chunks loaded after the session: [ 'home.chunk', 'dashboard.chunk', 'settings.chunk' ]
dashboard chunk in cache: true
```

**Key takeaway**: Each route owns a chunk; chunks load on first visit and are cached for re-visits.

**Why it matters**: Route-based splitting is the highest-leverage application of Example 16's mechanism: routes are natural split points, and users rarely visit all of them. The home page stays light even as the app grows, because the dashboard, settings, and reports code live in separate chunks fetched only on navigation.

**Pitfall**: A shared mega-bundle library used by every route can defeat route splitting -- hoist shared deps into a vendor chunk.

---

### Example 18: Tree Shaking Drops an Unused Export

_ex-18 &middot; exercises co-14_

Tree shaking eliminates dead code through static ES-module analysis: an export nothing imports is dropped from the bundle entirely.

> **Note:** tree shaking = "the removal of dead code" via ES-module static analysis ([MDN](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)).

**`learning/code/ex-18-tree-shaking/example.ts`**

```typescript
// Example 18: Tree Shaking Drops an Unused Export. (co-14)
//
// Tree shaking = dead-code elimination through static ES-module analysis. If a module exports a
// function nothing imports, the bundler drops it from the output. This ONLY works because ES
// modules are statically analyzable -- imports/exports are known at build time, not runtime.
//
// Note: tree shaking = "the removal of dead code" via ES-module static analysis.
// Source: MDN (https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking).

// A source module and the names it exports / that are imported elsewhere.
interface ModuleShape {
  // => the two facts tree shaking needs: what is exported, what is actually used
  exports: string[]; // => every name this module makes available
  used: string[]; // => the names some other module actually imports
}

const mathModule: ModuleShape = {
  // => a module that exports two functions, but the app only uses one of them
  exports: ["add", "unusedLegacyPower"], // => both are exported
  used: ["add"], // => only `add` is imported anywhere in the app
};

// treeShake returns the exports that SURVIVE: those that are both exported AND used.
function treeShake(m: ModuleShape): string[] {
  // => co-14: a statically-unreferenced export is dropped as dead code
  return m.exports.filter((name) => m.used.includes(name)); // => keep only the used exports
}

const kept = treeShake(mathModule); // => `add` survives; `unusedLegacyPower` is shaken out
const dropped = mathModule.exports.filter((name) => !kept.includes(name)); // => what got removed

console.log("exports kept in bundle:", kept); // => Output: exports kept in bundle: [ 'add' ]
console.log("dead code dropped:", dropped); // => Output: dead code dropped: [ 'unusedLegacyPower' ]
```

**Run**: `npx tsx example.ts`

**Output**:

```text
exports kept in bundle: [ 'add' ]
dead code dropped: [ 'unusedLegacyPower' ]
```

**Key takeaway**: Statically-unreferenced exports are shaken out -- unused code never reaches the bundle.

**Why it matters**: Tree shaking only works because ES module imports and exports are known at build time, not runtime. This lets the bundler prove an export is unused and drop it, keeping the bundle lean as a codebase grows. It is the reason preferring named ES-module exports over side-effectful CommonJS keeps frontend bundles small.

**Pitfall**: A module with top-level side effects cannot be safely shaken -- keep modules pure.

---

### Example 19: A Conditional Hook Violates the Rules of Hooks

_ex-19 &middot; exercises co-17_

The Rules of Hooks forbid calling hooks inside conditions, loops, or nested functions. A conditional hook breaks the call-order indexing React depends on.

> **Note:** The two rules are verbatim from [react.dev, Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks). The call-order-indexed-per-fiber explanation of WHY is community/Fiber knowledge; it has not been independently confirmed in the official React docs, so check the linked source before relying on it.

**`learning/code/ex-19-rules-of-hooks-violation/example.ts`**

```typescript
// Example 19: A Conditional Hook Violates the Rules of Hooks. (co-17)
//
// The Rules of Hooks: (1) only call Hooks at the TOP LEVEL (not in loops, conditions, nested
// functions, or after an early return); (2) only call Hooks from React function components or
// custom Hooks. A hook called inside a condition breaks the call-order indexing React relies on.
//
// Note: the two rules are verbatim from react.dev, Rules of Hooks
// (https://react.dev/reference/rules/rules-of-hooks). The call-order-indexed-per-fiber
// explanation of WHY is community/Fiber knowledge; it has not been independently
// confirmed in the official React docs, so check the linked source before relying on it.

// Each hook call site, in source order, with whether it sits inside a conditional.
interface HookCall {
  // => a lint record of one hook invocation in the component body
  name: string; // => which hook (useState, useEffect, ...)
  inConditional: boolean; // => true if nested inside an `if`/loop/early-return
}

// A component that conditionally calls a hook (the textbook violation).
const calls: HookCall[] = [
  // => the first useState runs unconditionally; the second is INSIDE an `if (x)`, breaking order
  { name: "useState", inConditional: false }, // => slot 0 -- always called
  { name: "useState", inConditional: true }, // => slot 1 -- ONLY called when the condition holds
];

// lintHooks flags any hook call that is NOT at the top level -- a violation of rule (1).
function lintHooks(hooks: HookCall[]): string[] {
  // => co-17 rule (1): hooks must not be conditional; the linter enforces this statically
  return hooks
    .filter((h) => h.inConditional) // => a conditional hook is the violation
    .map((h) => `error: ${h.name} is called conditionally -- react-hooks/rules-of-hooks`);
}

const violations = lintHooks(calls); // => the linter catches the conditional useState
// => without this rule the slot index would misalign across renders and silently corrupt state

console.log("violations:", violations); // => Output: the rules-of-hooks error
console.log("passes lint:", violations.length === 0); // => Output: passes lint: false
```

**Run**: `npx tsx example.ts`

**Output**:

```text
violations: [
  'error: useState is called conditionally -- react-hooks/rules-of-hooks'
]
passes lint: false
```

**Key takeaway**: Hooks must be called at the top level only -- the linter statically enforces both rules.

**Why it matters**: React identifies hooks by their call order within a component, so a hook that sometimes runs and sometimes does not shifts every later hook's index and silently corrupts state. The linter catches this statically so the runtime never has to. The two rules are: top-level only, and only inside components or custom hooks.

**Pitfall**: Disabling the react-hooks/rules-of-hooks lint rule removes the only thing protecting the call-order invariant.

---

### Example 20: useState Re-renders on Change

_ex-20 &middot; exercises co-17_

A component holds state in a useState cell. Calling the setter changes the state and triggers a re-render, so the UI always reflects the current value.

**`learning/code/ex-20-usestate-basic/example.ts`**

```typescript
// Example 20: useState Re-renders on Change. (co-17)
//
// A component holds state in a useState cell; calling the setter changes the state and triggers a
// re-render, so the UI always reflects the current state. The UI is a FUNCTION of state: change
// the state, and the next render derives the new DOM from it.

// A render log records what the UI showed after each render.
const ui: string[] = []; // => each entry is one rendered frame
// => the log proves the UI only changes as a consequence of a state change + re-render

// makeCounter is one component instance with a single state cell.
function makeCounter(): { render: () => void; setCount: (n: number) => void } {
  // => the component's state lives in `count`, closed over by both render and setCount
  let count = 0; // => co-17: the useState cell's current value
  function render(): void {
    // => the UI is derived FROM state; it never holds a value state does not also hold
    ui.push(`count: ${count}`); // => this render's frame
  }
  function setCount(next: number): void {
    // => co-17: setting state schedules a re-render
    count = next; // => state changes first...
    render(); // => ...then the re-render reflects the new state
  }
  return { render, setCount };
}

const counter = makeCounter(); // => one independent component instance
counter.render(); // => initial render
counter.setCount(1); // => state change -> re-render
counter.setCount(2); // => another state change -> another re-render

console.log("rendered frames:", ui); // => Output: rendered frames: [ 'count: 0', 'count: 1', 'count: 2' ]
```

**Run**: `npx tsx example.ts`

**Output**:

```text
rendered frames: [ 'count: 0', 'count: 1', 'count: 2' ]
```

**Key takeaway**: State change then re-render is the only path a UI update takes -- the UI is a function of state.

**Why it matters**: useState is the atom of React interactivity: a value plus a setter that, when called, schedules a fresh render deriving the new DOM from the new state. Because the UI is always derived from state, it can never drift from the data that produced it. Every later hooks example builds on this state-then-render cycle.

**Pitfall**: Calling the setter with the same value React already has still re-renders unless the value is Object.is-equal.

---

### Example 21: useEffect Runs After the Browser Paints

_ex-21 &middot; exercises co-18_

An effect runs at the end of a commit, after the screen has painted. So the browser shows the new frame first, and the effect fires afterwards.

> **Note:** "Effects run at the end of a commit after the screen updates." ([react.dev, useEffect](https://react.dev/reference/react/useEffect)).

**`learning/code/ex-21-useeffect-after-paint/example.ts`**

```typescript
// Example 21: useEffect Runs After the Browser Paints. (co-18)
//
// An effect does NOT run during render -- it runs at the END of a commit, AFTER the screen has
// painted. So the browser shows the new frame first, then the effect fires. This is why effects
// are the right place to sync with something external (a subscription, the document title) without
// blocking paint.
//
// Note: "Effects run at the end of a commit after the screen updates." Source:
// react.dev, Synchronizing with Effects / useEffect
// (https://react.dev/reference/react/useEffect).

// The ordered log of WHAT happened and WHEN during one render commit.
const trace: string[] = []; // => entries are pushed in execution order
// => the ORDER in this array proves: paint happens BEFORE the effect

// renderComponent models a single commit: render -> paint -> effect (in that order).
function renderComponent(): void {
  // => render phase: produce the new DOM description
  trace.push("render"); // => the component function runs
  // => paint phase: the browser paints the new frame to the screen
  trace.push("paint"); // => co-18: the screen updates BEFORE the effect
  // => commit phase: now (and only now) the effect runs
  trace.push("effect"); // => the useEffect setup fires last
}

renderComponent(); // => one full commit

// The effect appears AFTER paint -- the defining ordering of useEffect.
console.log(trace.join(" -> ")); // => Output: render -> paint -> effect
```

**Run**: `npx tsx example.ts`

**Output**:

```text
render -> paint -> effect
```

**Key takeaway**: The order is render, then paint, then effect -- effects never block paint.

**Why it matters**: Because effects run after paint, they are safe for syncing with external systems (a subscription, the document title, analytics) without delaying the visible update. Putting expensive non-visual work in an effect keeps the paint fast; the effect catches up afterwards. This ordering is the whole reason effects exist separately from render.

**Pitfall**: Work that BLOCKS the correct visual state belongs in render or an event handler, not an effect.

---

### Example 22: useEffect Cleanup Runs Before Re-run and Unmount

_ex-22 &middot; exercises co-18_

When an effect re-runs or the component unmounts, React runs the previous effect's cleanup first, with the old values, before running the new setup.

> **Note:** "React will first run the cleanup ... with the old values, and then run your setup ... with the new values." ([react.dev, useEffect](https://react.dev/reference/react/useEffect)).

**`learning/code/ex-22-useeffect-cleanup/example.ts`**

```typescript
// Example 22: useEffect Cleanup Runs Before Re-run and Unmount. (co-18)
//
// When an effect re-runs (because its deps changed) or the component unmounts, React runs the
// PREVIOUS effect's cleanup FIRST, with the OLD values, before running the new setup with the new
// values. Cleanup is where you tear down what setup built (remove a listener, clear a timer).
//
// Note: "React will first run the cleanup ... with the old values, and then run
// your setup ... with the new values." Source: react.dev, useEffect
// (https://react.dev/reference/react/useEffect).

// The trace of setup/cleanup events, in the order React fires them.
const trace: string[] = []; // => pushes mirror React's actual commit-time ordering
// => the ordering here IS the guarantee: cleanup-before-setup on every re-run

// makeEffect returns a pair React would call: setup and the cleanup it returned.
function makeEffect(id: number): { setup: () => void; cleanup: () => void } {
  // => each effect instance owns one resource (here: a slot in the trace)
  return {
    setup: () => trace.push(`setup #${id}`), // => subscribe / start something
    cleanup: () => trace.push(`cleanup #${id}`), // => unsubscribe / stop that same thing
  };
}

// commitReRun models a dep change: run OLD cleanup, then NEW setup (in that order).
function commitReRun(prev: { cleanup: () => void }, next: { setup: () => void }): void {
  // => co-18: the previous effect's cleanup runs FIRST, with the old values
  prev.cleanup(); // => tear down what the old effect built
  // => ...and only then does the new effect's setup run, with the new values
  next.setup(); // => build the new thing
}

const first = makeEffect(1); // => the initial effect
first.setup(); // => mount: setup runs once
const second = makeEffect(2); // => the effect for the next render (deps changed)
commitReRun(first, second); // => re-run: cleanup #1 THEN setup #2
second.cleanup(); // => unmount: the final cleanup

console.log(trace.join(" -> ")); // => Output: setup #1 -> cleanup #1 -> setup #2 -> cleanup #2
```

**Run**: `npx tsx example.ts`

**Output**:

```text
setup #1 -> cleanup #1 -> setup #2 -> cleanup #2
```

**Key takeaway**: On every re-run the old cleanup fires before the new setup -- always teardown then setup.

**Why it matters**: Cleanup is what keeps effects from leaking: each setup that subscribed or started something must return a cleanup that unsubscribes or stops it. React guarantees the ordering (old cleanup, then new setup) so the resource is never double-registered. Forgetting cleanup is the classic source of stale-listener and memory-leak bugs.

**Pitfall**: A missing cleanup on a subscription leaks a listener that keeps firing long after the component is gone.

---

### Example 23: The Dependency Array Gates Effect Re-runs

_ex-23 &middot; exercises co-18_

The dependency array decides when an effect re-runs. Deps are compared with Object.is, so a fresh object each render is treated as changed even when value-equal.

> **Note:** Dependencies are compared with Object.is; no array runs every commit, [] runs on mount only ([react.dev, useEffect](https://react.dev/reference/react/useEffect)).

**`learning/code/ex-23-useeffect-deps/example.ts`**

```typescript
// Example 23: The Dependency Array Gates Effect Re-runs. (co-18)
//
// The dependency array decides when an effect re-runs. Deps are compared with `Object.is` (so a
// fresh object/array each render is treated as DIFFERENT even if equal-by-value). No array => runs
// every commit; `[]` => mount only; `[a, b]` => runs when a or b changes.
//
// Note: dependencies are compared with `Object.is`; no array => every commit,
// `[]` => mount only. Source: react.dev, useEffect (https://react.dev/reference/react/useEffect).

// depsChanged returns true if any dependency differs from the previous render, by Object.is.
function depsChanged(prev: unknown[], next: unknown[]): boolean {
  // => co-18: Object.is is the comparison -- distinct references are different even if equal-by-value
  return next.some((value, i) => !Object.is(value, prev[i])); // => NaN vs NaN is Object.is-equal
}

// A render log: how many times the effect actually ran.
const effectRuns: number[] = []; // => each entry is one effect execution
// => the count here is the observable proof of what the deps array allowed through

// runEffect models an effect with an explicit deps array across a sequence of renders.
function runEffect(prevDeps: unknown[] | null, deps: unknown[] | null): boolean {
  // => null deps = "every commit"; [] = "mount only"; [a,b] = "when a or b changes"
  if (prevDeps === null || deps === null) return true; // => no array -> run every time
  if (deps.length === 0 && prevDeps.length === 0) return prevDeps === null; // => [] runs only on mount
  return depsChanged(prevDeps, deps); // => [a,b] -> run only when Object.is sees a change
}

// A sequence of renders with their dep values: [filter] across renders 1..4.
const renders: unknown[][] = [["ab"], ["ab"], ["abc"], ["abc"]]; // => value changes on render 3 only
let prev: unknown[] | null = null; // => null before the first render
for (const deps of renders) {
  // => mount: prev is null -> run; then prev = deps for the next comparison
  if (runEffect(prev, deps)) effectRuns.push(renders.indexOf(deps) + 1);
  prev = deps; // => carry the deps forward to compare against next render
}

console.log("effect ran on renders:", effectRuns); // => Output: mounts on 1, re-runs on 3 (value changed)
```

**Run**: `npx tsx example.ts`

**Output**:

```text
effect ran on renders: [ 1, 3 ]
```

**Key takeaway**: No array runs every commit; an empty array runs on mount only; listed deps run on Object.is change.

**Why it matters**: The deps array is how you tell React when the effect's inputs actually changed. The Object.is comparison means passing a freshly-allocated object or array every render defeats the optimization -- React sees a new reference and re-runs. Understanding this is the key to effects that do not fire too often or too rarely.

**Pitfall**: Lying in the deps array (omitting a used value) is the most common effect bug -- the linter exists to stop it.

---

### Example 24: useMemo Caches an Expensive Calculation

_ex-24 &middot; exercises co-19_

useMemo caches a calculation's result between renders, recomputing only when its dependencies change. Renders with unchanged inputs get a cheap cache hit.

> **Note:** "`useMemo` ... lets you cache the result of a calculation between re-renders." ([react.dev, useMemo](https://react.dev/reference/react/useMemo)).

**`learning/code/ex-24-usememo-cache/example.ts`**

```typescript
// Example 24: useMemo Caches an Expensive Calculation. (co-19)
//
// `useMemo` caches the RESULT of a calculation between re-renders, recomputing only when its deps
// change. This turns an O(n) recomputation-every-render into a cheap cache hit on renders where
// the inputs did not change.
//
// Note: "`useMemo` ... lets you cache the result of a calculation between
// re-renders." Source: react.dev, useMemo (https://react.dev/reference/react/useMemo).

// Counters track how many times the expensive fn actually ran vs. how many renders happened.
let computeCalls = 0; // => increments only on a REAL recomputation
// => renderCount - computeCalls = the number of cache hits (proof the cache worked)

// expensiveSum is the kind of costly fn you would NOT want to re-run every render.
function expensiveSum(a: number, b: number): number {
  // => stand-in for any heavy derive; the point is it should not run unless a/b changed
  computeCalls += 1; // => record that a real computation happened
  return a + b; // => the (cheap here, expensive in reality) result
}

// useMemo caches the result, keyed on the deps array (compared by Object.is per element).
function useMemo<T>(factory: () => T, deps: unknown[], prev: { deps: unknown[]; value: T } | null): T {
  // => co-19: recompute only when a dep changed by Object.is
  const changed = prev === null || deps.some((d, i) => !Object.is(d, prev.deps[i])); // => cache miss?
  if (changed) return { deps, value: factory() }.value; // => recompute and store
  return prev!.value; // => cache hit: return the stored value, factory NOT called
}

// We model useMemo returning the cached value by keeping a small holder outside the call.
let cache: { deps: unknown[]; value: number } | null = null;
function render(a: number, b: number): number {
  // => each call is one render; useMemo decides whether to recompute
  const value = useMemo(() => expensiveSum(a, b), [a, b], cache); // => deps = [a, b]
  cache = { deps: [a, b], value }; // => store for next render's comparison
  return value; // => the rendered derived value
}

render(2, 3); // => mount: computes (computeCalls=1)
render(2, 3); // => deps unchanged -> CACHE HIT (computeCalls still 1)
render(2, 3); // => still unchanged -> another cache hit (computeCalls still 1)
render(4, 3); // => dep a changed -> recompute (computeCalls=2)

console.log("renders: 4, real computations:", computeCalls); // => Output: renders: 4, real computations: 2
```

**Run**: `npx tsx example.ts`

**Output**:

```text
renders: 4, real computations: 2
```

**Key takeaway**: useMemo recomputes only on dep change -- unchanged renders reuse the cached result.

**Why it matters**: useMemo turns an expensive derive that would run every render into one that runs only when its inputs change. It is a performance tool, not a correctness one: React may still discard the cache under memory pressure, so the factory must be pure. Reach for it when profiling shows a real repeat cost, not preemptively.

**Pitfall**: useMemo is not free -- the cache itself costs memory and a deps check; only memoize genuinely expensive work.

---

### Example 25: useCallback Returns a Stable Function Reference

_ex-25 &middot; exercises co-19_

useCallback is the function form of useMemo: it returns the same function reference across renders when its deps are unchanged. That stability matters for memoized children.

**`learning/code/ex-25-usecallback-stable/example.ts`**

```typescript
// Example 25: useCallback Returns a Stable Function Reference. (co-19)
//
// `useCallback` is the function-specialized form of useMemo: it returns the SAME function reference
// across renders when its deps are unchanged. This matters when the function is passed to a child
// that is memoized -- a new reference each render would defeat the child's memo and force a
// re-render.

// Counters for renders of the parent and the (memoized) child.
let parentRenders = 0; // => the parent re-renders whenever its state changes
let childRenders = 0; // => the child should NOT re-render if its props (the callback) are stable
// => if the callback were recreated each render, childRenders would track parentRenders

// useCallback returns a stable reference when deps are unchanged (Object.is per element).
function useCallback<T extends (...args: never[]) => unknown>(
  fn: T,
  deps: unknown[],
  prev: { deps: unknown[]; fn: T } | null,
): T {
  // => co-19: the function is the cached value; reuse it when deps are Object.is-equal
  const changed = prev === null || deps.some((d, i) => !Object.is(d, prev.deps[i]));
  return changed ? fn : prev!.fn; // => same reference on a cache hit
}

let stable: { deps: unknown[]; fn: () => void } | null = null;
const childCallbackRefs: (() => void)[] = []; // => the callback reference passed to the child each render

function parentRender(filterValue: string): void {
  // => the parent re-renders on every state change (here: filterValue)
  parentRenders += 1; // => count this parent render
  const handler = useCallback(() => console.log(filterValue), [filterValue], stable); // => deps=[filter]
  stable = { deps: [filterValue], fn: handler }; // => store for next comparison
  // => a memoized child only re-renders if the callback REFERENCE changed
  const last = childCallbackRefs[childCallbackRefs.length - 1];
  if (last !== handler) {
    // => new reference -> child must re-render (the only reason it ever would here)
    childRenders += 1;
    childCallbackRefs.push(handler);
  }
}

parentRender("a"); // => mount: new ref -> child renders
parentRender("a"); // => dep unchanged -> SAME ref -> child does NOT re-render
parentRender("a"); // => still unchanged -> child still skipped
parentRender("b"); // => dep changed -> new ref -> child renders again

console.log("parent renders:", parentRenders, "| child renders:", childRenders); // => Output: parent: 4 | child: 2
```

**Run**: `npx tsx example.ts`

**Output**:

```text
parent renders: 4 | child renders: 2
```

**Key takeaway**: useCallback keeps a function referentially stable across renders when its deps are unchanged.

**Why it matters**: A new function reference each render defeats a child's memoization -- the child sees a 'changed' prop and re-renders uselessly. useCallback preserves the reference so the memoized child can skip. Like useMemo it is a targeted optimization, not a default wrapper for every function.

**Pitfall**: Wrapping every function in useCallback adds overhead for no gain -- use it only for props passed to memoized children.

---

### Example 26: Stable Keys Preserve List Item Identity on Reorder

_ex-26 &middot; exercises co-20_

React identifies list items by tree position plus their key. A stable key (an id) lets React reuse the same DOM node -- and its local state -- when the list reorders.

> **Note:** "unstable keys (like those produced by Math.random()) will cause many ... DOM nodes to be unnecessarily recreated." ([Reconciliation, legacy.reactjs.org](https://legacy.reactjs.org/docs/reconciliation.html)).

**`learning/code/ex-26-keys-list/example.ts`**

```typescript
// Example 26: Stable Keys Preserve List Item Identity on Reorder. (co-20)
//
// React identifies list items by their TREE POSITION plus their key. A STABLE key (an id) lets
// React keep the same DOM node -- and its local state -- when the list reorders. Reorder with
// stable keys: the node moves, its input state moves with it.
//
// Note: "unstable keys (like those produced by Math.random()) will cause many ...
// DOM nodes to be unnecessarily recreated." Source: Reconciliation (legacy.reactjs.org)
// (https://legacy.reactjs.org/docs/reconciliation.html).

// A list item is an id plus any per-item state (here: an input's draft text).
interface Item {
  // => the id is the STABLE key; draft is per-item state that must follow the item on reorder
  id: string; // => the stable key
  draft: string; // => local state tied to THIS item, not to this position
}

// The DOM "node" for each item, keyed by the item's key. React reuses a node when its key matches.
const nodes: Map<string, { draft: string }> = new Map(); // => keyed by id, persists across renders
// => a Map keyed by id models React's keyed-children reconciliation table

// reconcile updates the rendered list, REUSING existing nodes when a key is already present.
function reconcile(items: Item[]): string[] {
  // => co-20: a matching key means "reuse this node, keep its state" -- no recreation
  return items.map((item) => {
    // => if the key exists, the node (and its draft) is reused; otherwise a new node is created
    if (!nodes.has(item.id)) nodes.set(item.id, { draft: item.draft }); // => first sight -> create
    return `${item.id}=${nodes.get(item.id)!.draft}`; // => report key + the node's preserved draft
  });
}

// Initial list; the user typed "hello" into item "b"'s input (its draft).
nodes.set("a", { draft: "" });
nodes.set("b", { draft: "hello" }); // => draft lives with key "b", not with position 1
nodes.set("c", { draft: "" });

// Reorder: b moves to the FRONT. With stable keys, b's draft ("hello") moves with it.
const reordered: Item[] = [
  { id: "b", draft: "" }, // => same key "b" -> node reused -> draft "hello" preserved
  { id: "a", draft: "" },
  { id: "c", draft: "" },
];

console.log("after reorder:", reconcile(reordered)); // => Output: b's "hello" moved to position 0
```

**Run**: `npx tsx example.ts`

**Output**:

```text
after reorder: [ 'b=hello', 'a=', 'c=' ]
```

**Key takeaway**: A stable key means a reordered item keeps its DOM node and its local state.

**Why it matters**: Keys are how React matches last render's items to this render's items. A stable, unique key tells React 'this is the same item, just moved,' so it reuses the node (and any input state inside it) instead of rebuilding. This is why lists of inputs need real ids as keys, never array indices, when items can reorder.

**Pitfall**: Using the array index as the key breaks exactly when items reorder -- the state follows the position, not the item.

---

### Example 27: Random Keys Recreate DOM and Lose State

_ex-27 &middot; exercises co-20_

The negative case of Example 26: keys from Math.random() are new every render, so React treats each item as brand-new, destroys the old node, and loses its state.

**`learning/code/ex-27-keys-unstable-bug/example.ts`**

```typescript
// Example 27: Random Keys Recreate DOM and Lose State. (co-20)
//
// The NEGATIVE counterpart of Example 26: when keys come from `Math.random()` (or any per-render
// value), every key is NEW on every render. React treats each as a different item, DESTROYS the
// old node, and creates a new one -- so any per-item state (an input's draft, focus) is lost.
//
// Note: "unstable keys (like those produced by Math.random()) will cause many ...
// DOM nodes to be unnecessarily recreated." Source: Reconciliation (legacy.reactjs.org)
// (https://legacy.reactjs.org/docs/reconciliation.html).

// Each node is keyed by whatever key the render assigned it.
const nodes: Map<string, { draft: string }> = new Map(); // => the DOM table keyed by item key
// => a key present last render but absent this render means that node was DESTROYED
let recreations = 0; // => count of nodes destroyed+recreated because their key changed

// A keyed list item; the key is generated PER RENDER here (the bug).
interface Item {
  // => note: the key is NOT the id -- it is a throwaway random string
  key: string; // => regenerated every render -> unstable
  label: string; // => the item's content
}

// reconcileWithKeys treats a missing key as a brand-new item -> destroy old, create new.
function reconcileWithKeys(items: Item[]): void {
  // => co-20: a key that was not present last render forces a node recreation
  const seen = new Set<string>();
  for (const item of items) {
    // => every random key is "new" relative to the previous render's random keys
    if (!nodes.has(item.key)) {
      recreations += 1; // => the old node (different random key) is gone -> state lost
      nodes.set(item.key, { draft: "" }); // => a fresh node with EMPTY draft
    }
    seen.add(item.key);
  }
}

// Two renders of the SAME two items, but each render mints fresh random keys.
function randomKey(): string {
  return Math.random().toString(36).slice(2); // => a DIFFERENT string every call -> unstable
}

const render1: Item[] = [
  { key: randomKey(), label: "a" },
  { key: randomKey(), label: "b" },
];
nodes.set(render1[0].key, { draft: "typed text" }); // => user typed into item a's input

const render2: Item[] = [
  { key: randomKey(), label: "a" }, // => NEW random key -> not the same node as render1
  { key: randomKey(), label: "b" },
];
reconcileWithKeys(render2); // => both keys are new -> both nodes recreated -> drafts LOST

console.log("nodes recreated (state lost):", recreations); // => Output: nodes recreated (state lost): 2
```

**Run**: `npx tsx example.ts`

**Output**:

```text
nodes recreated (state lost): 2
```

**Key takeaway**: A new key every render recreates every node -- per-item state (input drafts, focus) is lost.

**Why it matters**: Unstable keys are the same bug as no keys: React cannot tell this render's item is the same as last render's, so it throws the old DOM away and builds fresh. Any state held in that node (typed text, focus, scroll) vanishes. Stable keys are not a stylistic preference; they are what makes list state survive updates.

**Pitfall**: Generating keys from an incrementing counter at render time is just as unstable as Math.random() -- derive keys from the data.

---

### Example 28: A Controlled Input Owns Its Value in State

_ex-28 &middot; exercises co-25_

A controlled input gets its value from state and writes changes back through onChange. React is the single source of truth, so the input never holds a value state does not also hold.

> **Note:** "An input can't be both controlled and uncontrolled ... [and] cannot switch ... over its lifetime." ([react.dev, <input>](https://react.dev/reference/react-dom/components/input)).

**`learning/code/ex-28-controlled-input/example.ts`**

```typescript
// Example 28: A Controlled Input Owns Its Value in State. (co-25)
//
// A CONTROLLED input gets its `value` from state and writes changes back via `onChange` -- React
// is the single source of truth, and the input never holds a value the state does not also know
// about. (Example 29 shows the uncontrolled opposite; Example 30 shows you cannot switch.)
//
// Note: a controlled input gets a `value` (or `checked`) prop; "An input can't be
// both controlled and uncontrolled ... [and] cannot switch ... over its lifetime." Source:
// react.dev, `<input>` (https://react.dev/reference/react-dom/components/input).

// A minimal controlled input: its value is always whatever `state.value` says.
interface ControlledInput {
  // => value is DERIVED from state; onChange WRITES to state -- one-way both ways
  getValue: () => string; // => value comes FROM state
  onChange: (next: string) => void; // => change goes TO state
}

// makeControlledInput wires value+onChange to a single state cell (React owns the value).
function makeControlledInput(): ControlledInput {
  // => the state cell is the single source of truth for what the input shows
  const state = { value: "" }; // => co-25: state, not the DOM, owns the value
  return {
    getValue: () => state.value, // => the input renders state.value
    onChange: (next: string) => {
      // => every keystroke writes to state, which re-renders the new value
      state.value = next; // => the input can NEVER show a value state does not hold
    },
  };
}

const input = makeControlledInput(); // => one controlled input instance
// => React owns the value: the only way the value changes is through onChange -> state
input.onChange("H"); // => keystroke -> state
input.onChange("He"); // => keystroke -> state
input.onChange("Hel"); // => each render reads state.value back into the input
input.onChange("Hello");

console.log("controlled value:", input.getValue()); // => Output: controlled value: Hello
```

**Run**: `npx tsx example.ts`

**Output**:

```text
controlled value: Hello
```

**Key takeaway**: In a controlled input, state owns the value -- the input renders it and onChange updates it.

**Why it matters**: Making state the single source of truth means the input can never disagree with your data model: every keystroke flows through state, and every render reads state back out. This is what makes features like validation, formatting, and conditional disabling straightforward -- you transform the value in one place.

**Pitfall**: Both setting value AND leaving onChange unset makes the input read-only -- a controlled input must wire both.
