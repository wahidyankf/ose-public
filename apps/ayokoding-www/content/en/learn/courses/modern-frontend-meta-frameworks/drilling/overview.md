---
title: "Overview"
date: 2026-10-25T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Modern Frontend Meta-Frameworks course: recall first, then applied judgment, then hands-on katas, then a self-check checklist, then elaborative-interrogation prompts that ask _why_, not just _what_. Every answer is hidden in a `<details>` block; try each item yourself before opening it.

Every kata below is self-contained and deterministic — fixed fictional data only, no network, no clock reads, and no dependency on this course's own worked-example or capstone code. NusaMart and every product below are fictional.

Work each section in order and do not skip ahead. Read a recall question, answer aloud before opening its details block, and mark any hesitation as a re-read flag for the matching theme. Solve applied problems on paper or in a scratch file before reading their expected lines; the expected text confirms direction, not digits, so a different route to the same verdict still counts. Run every kata starter, watch it fail or print the wrong value, then fix it before comparing with the solution: the repair motion is the skill, not the final file. Score the checklist honestly at the end, and revisit any unchecked line in its theme before calling the course done.

## Recall Q&A

Twenty-four short-answer questions, at least one per concept (`co-01` through `co-16`). Answer from memory, then check.

**Q1 (co-01 -- what file-based routing is).** What decides the URL of a page in a meta-framework, and what marks a dynamic segment in each dialect?

<details>
<summary>Answer</summary>

The file's position in the project decides the URL: each route file owns one URL shape. Next.js marks a dynamic segment with square brackets (`app/products/[id]/page.tsx`); TanStack Start marks it with a dollar prefix (`routes/products/$productId.tsx`). Static segments match literally; marked segments match any single piece.

</details>

**Q2 (co-02 -- what a nested layout is).** What does a layout wrap, what fills its hole, and in which order do nested layouts render?

<details>
<summary>Answer</summary>

A layout wraps a route and its children: the root shell wraps section shells, which wrap pages. The hole is `children` in Next.js and `<Outlet />` in TanStack Start. Nested layouts render outside-in — root first, section next, page last — and each parent wraps exactly what its child returns.

</details>

**Q3 (co-03 -- what server rendering buys).** What arrives in the first HTML of a server-rendered page that a client-rendered shell lacks, and why does it matter?

<details>
<summary>Answer</summary>

The content itself arrives in the first HTML: data resolves before render, so names and prices are already in the bytes. A client shell arrives empty and fills in after its fetch. First-paint content matters for bounce rates, crawlers, and slow networks — anyone who cannot or will not run the JavaScript still reads the page.

</details>

**Q4 (co-04 -- what static generation costs).** What must exist before a static detail page can build, and what happens to products added after the build?

<details>
<summary>Answer</summary>

The full id list must exist at build time: one enumerated params object in, one HTML file per id out. Products added after the build have no page until something covers them — a rebuild, a blocking fallback that waits, a shell-swap fallback, or an honest 404. The enumeration is load-bearing, not configuration.

</details>

**Q5 (co-05 -- when client rendering fits).** Name the page traits that point at client rendering rather than server or static rendering.

<details>
<summary>Answer</summary>

Personal per-visitor data plus live, ticking updates — dashboards, trackers, carts — point at client rendering, because no shared cache can serve them and no build can precompute them. Public, stable, or crawlable pages point away from it. The chooser rule: personal and live means the browser; everything else probably does not.

</details>

**Q6 (co-06 -- the loader contract).** What are a loader's inputs and outputs, and what are its two named failure modes?

<details>
<summary>Answer</summary>

Inputs: the route params only. Output: exactly the data the page needs, resolved before render. Failure modes: a missing segment and an unknown id — named separately because they route to different fixes. Constraining input to params keeps every loader a pure function of the URL, which is what makes caching and static generation possible downstream.

</details>

**Q7 (co-07 -- what a server action owns).** Who may mutate the cart, who may only propose, and what does the reply carry?

<details>
<summary>Answer</summary>

Only the server action mutates: it validates the intent, changes the server-owned cart, and replies with the new count and total. The client component only proposes — it posts intent and renders the reply. Invalid intent changes nothing and returns a named error. Client-computed totals are how shops get defrauded; server-owned carts close that hole.

</details>

**Q8 (co-08 -- what streaming changes).** What does a streamed page deliver that a blocked page does not, and in what order?

<details>
<summary>Answer</summary>

Usable pieces before the whole: the shell first, fast sections next, slow sections last, each chunk valid HTML on arrival. A blocked page delivers one late blob. The order is a contract — shell, then sections slowest-last — so the stream reads as deliberate pace. Suspense boundaries give each slow section its own clock inside the shared page.

</details>

**Q9 (co-09 -- rest capture shape).** What does a catch-all route capture, what type is the capture, and what does the bare path capture?

<details>
<summary>Answer</summary>

It captures the rest of the URL below its prefix as an array of segments — possibly empty. Next.js spells it `[...slug]`, TanStack Start spells it a bare `$` splat read from `_splat`. The bare path captures an empty array, so every consumer must handle the empty case. One segment is a string; the rest is an array; confusing them breaks consumers.

</details>

**Q10 (co-10 -- what a tag retires).** What groups saved pages for retirement, and what exactly does invalidating one tag drop?

<details>
<summary>Answer</summary>

Cache tags group saved pages by the data they show: every page carrying the tag drops when the tag invalidates, and pages without it survive. A price change invalidates the `prices` tag and retires exactly the shelf and detail pages — not the story page, not everything. Tags turn "which pages showed this" from a search into a lookup.

</details>

**Q11 (co-11 -- the hydration comparison).** What two strings does hydration compare, what happens when they differ, and what is the most common cause?

<details>
<summary>Answer</summary>

The server HTML string and the client's first render string. Identical strings hydrate silently; different strings warn and the client string wins as the repaired truth. The most common cause is formatting computed independently on each side — locales, separators, timestamps. The fix is one shared formatter, never two matching ones.

</details>

**Q12 (co-12 -- per-segment slots).** What renders while a section loads, what renders when it throws, and what keeps rendering either way?

<details>
<summary>Answer</summary>

A skeleton while it loads (`loading.tsx`, `pendingComponent`) and a fallback when it throws (`error.tsx`, `errorComponent`) — one pair per segment, named in each dialect's vocabulary. Sibling sections keep rendering either way: a slow reviews widget never delays the title, and a failed shelf never blanks the header. Resilience is per segment, not per page.

</details>

**Q13 (co-13 -- what the route table types).** What does the route table declare, and what two failures does the typed link builder prevent?

<details>
<summary>Answer</summary>

Every legal path and the param names each one declares. The builder then accepts only table keys with their required params, so unknown paths and missing params fail `tsc` instead of failing a visitor. Renaming a segment without updating readers becomes a compile error at the exact line, and the loopback proof shows checked links also resolve.

</details>

**Q14 (co-14 -- what the export writes).** What does a static export produce per route, what repeats the list for crawlers, and what breaks when they drift?

<details>
<summary>Answer</summary>

One HTML file per route, plus a sitemap repeating the same list in XML so crawlers find every exported page. When they drift, pages exist that crawlers cannot find or the sitemap advertises pages that do not exist. Both artifacts must derive from one route enumeration: same list, two formats, no drift allowed.

</details>

**Q15 (co-15 -- agreement versus spelling).** Where do Next.js and TanStack Start agree, and what do their differences amount to?

<details>
<summary>Answer</summary>

They agree on mechanisms — shells nest, loaders precede renders, actions own mutations, routes type-check, targets deploy to node or static — and differ on spellings: filenames, segment sigils, slot names. Five of the eight convention-matrix rows agree; the three that differ are file names and markers only. Learn mechanisms once, translate spellings per project.

</details>

**Q16 (co-16 -- the enhancement guarantee).** What keeps working when JavaScript fails, and what does each ladder rung add?

<details>
<summary>Answer</summary>

Readable content, reachable links, and posting forms keep working: HTML, navigation, and plain form posts need no JavaScript. Each rung adds capability without removing the rung below, and the top rung — no-reload islands — degrades to forms instead of breaking. Build the no-JS shop first and failure removes delight, never function.

</details>

**Q17 (co-01 -- depth rule).** Why must a URL pattern and a URL agree on depth, and which routing bug does this explain?

<details>
<summary>Answer</summary>

A dynamic marker matches exactly one segment, so a pattern and a URL match only at equal depth: `/products/:id` accepts `/products/teh-002` and rejects `/products`. Most routing bugs are depth bugs — a link one segment too many, a pattern one level too shallow. Count segments before blaming the framework.

</details>

**Q18 (co-03 -- the fetch test).** How do you honestly verify a page is server-rendered, and what would falsify the claim?

<details>
<summary>Answer</summary>

Fetch it and search the bytes: content in the first HTML confirms the claim, exactly the anchor's `paints-kopi` check. A shell with a spinner falsifies it — the page is client-rendered whatever the config says. Tooling debates are secondary to that one check; make the server say what it did and read the reply.

</details>

**Q19 (co-06 -- parallel rule).** When may loader reads run in parallel, what do they cost together, and what breaks the rule?

<details>
<summary>Answer</summary>

Reads that do not depend on each other launch together and cost the slowest, never the sum — 50 ticks, not 100, for the product, stock, and reviews reads. A read that needs another read's result breaks the rule and must wait. Audit every loader for accidental sequences: waterfalls are the quiet performance killer in server components.

</details>

**Q20 (co-07 -- the replay rule).** What does an idempotency key buy, where is it generated, and what does a replay return?

<details>
<summary>Answer</summary>

Exactly-once effect under retries: the first request under a key mutates and records its reply; replays return the recorded reply and mutate nothing. The key travels with the intent — per form, per click-session — generated by the client, honored by the server. Networks retry and visitors double-click; the key makes both safe instead of scary.

</details>

**Q21 (co-10 -- the staleness budget).** What does a revalidation limit encode, and who should set it?

<details>
<summary>Answer</summary>

How wrong the page may be, in time: a 60-tick shelf can show a stale price for 60 ticks, by design. The business sets it from the cost of staleness — prices deserve short limits, help articles long ones — never from a desire for a round number. Replay while young, rebuild once past the limit, reset the baseline.

</details>

**Q22 (co-13 -- search param distrust).** Why are search params parsed at the boundary, and what three things does the parser do?

<details>
<summary>Answer</summary>

Because every param arrives as an untrusted string or not at all: page `two` is not 2. The parser applies defaults for missing params, clamps ranges for present ones, and collects every violation before the page decides anything. Parsed once into a trusted shape, the page never defends itself with scattered conversions.

</details>

**Q23 (co-04 -- fallback honesty).** Which fallback admits the page does not exist, and when is that the right answer?

<details>
<summary>Answer</summary>

The `false` shape 404s unbuilt URLs, and it is right exactly when unbuilt means nonexistent — retired products, invented slugs. Blocking waits for launches where completeness matters; shell-swap serves catalogs where speed matters; 404 tells the truth when there is nothing to show. "Use the default" is how launch days break.

</details>

**Q24 (co-15 -- the measured comparison).** How do you settle a claim that the frameworks behave differently, and what did the measured comparison find?

<details>
<summary>Answer</summary>

Run one request script against both servers and line the pairs up: same input, both sides, compared output. The course's script found five agreements from five steps — list, detail, mutation, refusal, cart report all identical after the dialect tag. Disagreement after that procedure means a real difference worth knowing; before it, only an anecdote.

</details>

## Applied problems

Eight situations from a real shop. State the verdict first, then the reason in one or two sentences. Expected lines confirm direction, not digits.

**P1 (rendering mode: marketing story).** The about page changes twice a year, must be crawlable, and carries no personal data. Which mode, and why?

Expected: static. Fixed public content with no personal data builds once and replays free; crawling sees complete HTML with no JavaScript needed.

**P2 (rendering mode: flash-sale shelf).** The sale shelf changes prices every few minutes during the event and every visitor sees the same prices. Which mode, and why?

Expected: server rendering with short revalidation. Shared but fast-moving data needs fresh HTML per window without paying a full render per request; the revalidation limit encodes how stale a price may be.

**P3 (rendering mode: order tracker).** The tracker shows one visitor's parcels updating every few seconds. Which mode, and why?

Expected: client rendering. Personal plus live data cannot be shared or precomputed; the browser owns the ticking state while the shell can still serve instantly.

**P4 (caching strategy).** The catalog is read thousands of times per write: prices change weekly, stock changes hourly. Design the tag and limit scheme.

Expected: one shared page cache tagged `prices` and `stock` per page, invalidated on each write to that topic; a long revalidation limit bounded by the hourly stock cost. Reads replay almost always; writes retire exactly their blast radius.

**P5 (hydration mismatch).** Production logs show hydration warnings on the detail page every midnight, and the price format differs between server and client strings. Diagnose and fix.

Expected: the midnight data refresh recomputes a formatted price with a different rule per side — likely a locale or separator default. Share one formatter between server and client so both strings derive from one rule; the warnings stop because the strings agree.

**P6 (layout for dashboard and settings).** The account area needs a sidebar on every page except the public help pages, and help articles live at any depth. Sketch the route and layout shape in both dialects.

Expected: a route group (Next.js `(account)`, Start pathless `_account`) owning the sidebar layout with no URL segment, plus a catch-all (`[...slug]`, `$` splat) under help capturing the rest as an array. Grouping hides organization; the splat absorbs depth.

**P7 (action error UX).** The buy action can fail three ways: unknown product, bad quantity, out of stock. What does the visitor see for each, and where is each decided?

Expected: three named fallbacks — unknown product suggests the shelf, bad quantity re-marks the field, out of stock offers alternatives — all decided in the action and rendered by the nearest error boundary. The page never blanks; every refusal names a next step.

**P8 (framework pick).** A content-heavy marketing site with a small store must choose a dialect. The team knows file-based routing but has shipped neither framework. What decides, using this course's evidence?

Expected: the convention matrix — mechanisms agree, spellings differ — so the pick rests on hiring, hosting, and existing code, not capability. Prototype the shelf and detail in both (the capstone script pattern), compare the transcripts, and choose the spelling the team reads faster.

## Code katas

Each kata lives under `drilling/code/kata-NN-<slug>/` with a `before/kata.ts` starter, an `after/kata.ts` solution, and a `run.yaml` that runs the solution. Work the starter first with the lesson examples closed, then compare against the solution and re-run to verify. The repair motion is the skill: a kata only counts when you have watched the starter fail, fixed it yourself, and seen the harness agree.

- Kata 01, convert a client-rendered page to server-rendered. **`drilling/code/kata-01-client-to-server-rendering/after/kata.ts`**: resolve the rows before render so the first HTML names a product. The starter ships the empty shell; move the data read above the render. Solution prints the full shelf and `paints-kopi=true`.
- Kata 02, add a type-safe dynamic route parameter. **`drilling/code/kata-02-typed-dynamic-route-param/after/kata.ts`**: route the detail link through the route table so a wrong path fails `tsc`. The starter concatenates strings; replace it with `buildPath` over the table. Solution prints both checked links.
- Kata 03, add a server action with proper error handling. **`drilling/code/kata-03-server-action-error-handling/after/kata.ts`**: validate id, quantity, and stock before mutating, returning named errors. The starter mutates blindly and corrupts unknown ids; guard every rule first. Solution buys once, then names both failures.
- Kata 04, cache a frequently read, rarely written page. **`drilling/code/kata-04-stale-while-revalidate-cache/after/kata.ts`**: replay the saved shelf inside the 60-tick limit and rebuild once past it. The starter re-renders every visit; add the age check and baseline reset. Solution renders twice across three visits at ticks 10, 20, and 90.
- Kata 05, diagnose a hydration mismatch. **`drilling/code/kata-05-hydration-mismatch-diagnosis/after/kata.ts`**: share one price formatter between server and client so hydration goes silent. The starter formats each side alone; extract the shared rule. Solution prints identical strings and `silent: true`.

### Kata 01 solution: server-rendered shelf

**After** (`drilling/code/kata-01-client-to-server-rendering/after/kata.ts`)

```typescript
// Kata 01 solution: render the shelf on the server.
// => NusaMart is fictional; every product and price here is fixed.
// => The loader resolves before render, so the first HTML already carries
// => the rows: the same fix Example 11 demonstrates on both frameworks.
const ROWS = ["Kopi Toraja 250g 68000", "Teh Melati 100g 32000"]; // => fixed rows
function serverShelf(): string {
  // => server render
  return "<ul><li>" + ROWS.join("</li><li>") + "</li></ul>"; // => rows inside first HTML
} // => end of serverShelf
const html = serverShelf(); // => render before sending
console.log("first paint: " + html); // => Output HTML with rows inside
console.log("paints-kopi=" + html.includes("Kopi")); // => Output true
export {}; // => module scope keeps these names local
```

**Output** (`drilling/code/kata-01-client-to-server-rendering/expected/main.stdout.txt`):

```text
first paint: <ul><li>Kopi Toraja 250g 68000</li><li>Teh Melati 100g 32000</li></ul>
paints-kopi=true
```

### Kata 02 solution: typed detail links

**After** (`drilling/code/kata-02-typed-dynamic-route-param/after/kata.ts`)

```typescript
// Kata 02 solution: a detail link the compiler checks.
// => NusaMart is fictional; every product id here is fixed.
// => The route table is a type: buildPath only accepts its keys, so a
// => misspelled path or a missing id breaks the build, never a visitor.
const ROUTES = { "/": [], "/products": [], "/products/:id": ["id"] } as const; // => fixed table
type RoutePath = keyof typeof ROUTES; // => the legal path union
function buildPath(path: RoutePath, params: Record<string, string> = {}): string {
  // => typed link builder
  let built: string = path; // => the growing URL
  for (const [key, value] of Object.entries(params)) {
    // => every supplied param
    built = built.replace(":" + key, value); // => fill its hole
  } // => end of the param loop
  return built; // => the finished URL
} // => end of buildPath
console.log("link: " + buildPath("/products/:id", { id: "kopi-001" })); // => Output the checked link
console.log("link: " + buildPath("/products/:id", { id: "teh-002" })); // => Output the checked link
export {}; // => module scope keeps these names local
```

**Output** (`drilling/code/kata-02-typed-dynamic-route-param/expected/main.stdout.txt`):

```text
link: /products/kopi-001
link: /products/teh-002
```

### Kata 03 solution: guarded buying action

**After** (`drilling/code/kata-03-server-action-error-handling/after/kata.ts`)

```typescript
// Kata 03 solution: an action that validates, then mutates, then reports.
// => NusaMart is fictional; every product and quantity here is fixed.
// => Every rule is checked before any mutation: unknown ids and bad
// => quantities return named errors, and stock can never go negative.
const STOCK: Record<string, number> = { "kopi-001": 2 }; // => fictional stock
type ActionError = { code: "unknown" | "bad-qty" | "out-of-stock"; detail: string }; // => error shape
function buy(id: string, qty: number): string {
  // => guarded action
  if (STOCK[id] === undefined) {
    // => unknown product
    const err: ActionError = { code: "unknown", detail: id }; // => named error
    return "error [" + err.code + "]: " + err.detail; // => no mutation
  } // => end of the unknown branch
  if (!Number.isInteger(qty) || qty < 1) {
    // => bad quantity
    const err: ActionError = { code: "bad-qty", detail: "qty " + qty }; // => named error
    return "error [" + err.code + "]: " + err.detail; // => no mutation
  } // => end of the quantity branch
  if (qty > STOCK[id]) {
    // => not enough stock
    const err: ActionError = { code: "out-of-stock", detail: id + " has " + STOCK[id] }; // => named error
    return "error [" + err.code + "]: " + err.detail; // => no mutation
  } // => end of the stock branch
  STOCK[id] -= qty; // => the single mutation, after every check
  return "bought " + qty + " x " + id; // => success reply
} // => end of buy
console.log(buy("kopi-001", 1)); // => Output bought 1 x kopi-001
console.log(buy("susu-009", 3)); // => Output error unknown
console.log(buy("kopi-001", 5)); // => Output error out-of-stock
export {}; // => module scope keeps these names local
```

**Output** (`drilling/code/kata-03-server-action-error-handling/expected/main.stdout.txt`):

```text
bought 1 x kopi-001
error [unknown]: susu-009
error [out-of-stock]: kopi-001 has 1
```

### Kata 04 solution: revalidating shelf

**After** (`drilling/code/kata-04-stale-while-revalidate-cache/after/kata.ts`)

```typescript
// Kata 04 solution: a shelf that replays while fresh and rebuilds stale.
// => NusaMart is fictional; every row and tick here is fixed.
// => The saved HTML serves every visit inside the 60-tick limit; the first
// => visit past the limit rebuilds once and resets the baseline.
let saved = ""; // => the cached shelf HTML
let builtAt = 0; // => the build tick
let renders = 0; // => render counter
const LIMIT = 60; // => revalidate interval in ticks
function shelf(now: number): string {
  // => cached shelf
  if (saved !== "" && now - builtAt <= LIMIT) {
    // => fresh cache
    return saved + " renders=" + renders; // => replay, no render
  } // => end of the fresh branch
  renders += 1; // => count the rebuild
  saved = "<ul><li>Kopi Toraja 250g</li></ul>"; // => rebuild the HTML
  builtAt = now; // => reset the baseline
  return saved + " renders=" + renders; // => fresh page
} // => end of shelf
console.log("t10: " + shelf(10)); // => Output replay-free first build, renders=1
console.log("t20: " + shelf(20)); // => Output replay, renders still 1
console.log("t90: " + shelf(90)); // => Output rebuild, renders=2
export {}; // => module scope keeps these names local
```

**Output** (`drilling/code/kata-04-stale-while-revalidate-cache/expected/main.stdout.txt`):

```text
t10: <ul><li>Kopi Toraja 250g</li></ul> renders=1
t20: <ul><li>Kopi Toraja 250g</li></ul> renders=1
t90: <ul><li>Kopi Toraja 250g</li></ul> renders=2
```

### Kata 05 solution: shared formatter

**After** (`drilling/code/kata-05-hydration-mismatch-diagnosis/after/kata.ts`)

```typescript
// Kata 05 solution: one shared formatter, silent hydration.
// => NusaMart is fictional; the price here is fixed.
// => The mismatch was never about data: both sides knew 68000, but each
// => formatted it alone. One shared formatter makes both strings equal.
function formatPrice(value: number): string {
  // => the single formatter
  return "<p>" + value.toLocaleString("en-US") + "</p>"; // => shared rule
} // => end of formatPrice
const serverHtml = formatPrice(68000); // => server uses the shared rule
const clientHtml = formatPrice(68000); // => client uses the shared rule
console.log("server: " + serverHtml); // => Output the server string
console.log("client: " + clientHtml); // => Output the identical string
console.log("silent: " + (serverHtml === clientHtml)); // => Output true
export {}; // => module scope keeps these names local
```

**Output** (`drilling/code/kata-05-hydration-mismatch-diagnosis/expected/main.stdout.txt`):

```text
server: <p>68,000</p>
client: <p>68,000</p>
silent: true
```

## Self-check checklist

Twenty-four "I can ..." items, at least one per concept. Check honestly; revisit any unchecked line in its theme.

- I can draw the file-to-URL mapping for a new route in both dialects (co-01).
- I can nest a section layout under a root layout and predict the render order (co-02).
- I can prove a page is server-rendered by fetching it and searching the bytes (co-03).
- I can enumerate the build list a static section needs and name what late arrivals do (co-04).
- I can place a new page in server, static, or client rendering and defend the choice (co-05).
- I can write a loader that takes params, returns one row, and names both failures (co-06).
- I can write a server action that validates, mutates, and replies with count and total (co-07).
- I can split a slow section into deferred chunks with a readable shell first (co-08).
- I can capture a rest-of-path URL as an array on both sides including the empty case (co-09).
- I can tag cached pages and retire exactly one topic on write (co-10).
- I can trace a hydration warning to its formatting split and share the rule (co-11).
- I can give a slow section a skeleton and a fragile section a fallback (co-12).
- I can add a route to the table and let the compiler list every link to fix (co-13).
- I can derive the export file list and the sitemap from one enumeration (co-14).
- I can run one request script against both dialects and read the paired verdict (co-15).
- I can order a page's needs into the enhancement ladder with the no-JS base first (co-16).
- I can explain a depth mismatch from a URL and its pattern (co-01).
- I can choose parallel over sequential loader reads and price the saving (co-06).
- I can make a repeated submit idempotent with a keyed first reply (co-07).
- I can set a revalidation limit from the business cost of staleness (co-10).
- I can reject an outside URL with a named reason at the guard (co-13).
- I can refuse an unknown id in the loader before any HTML flows (co-12).
- I can compare the dialects' spellings without confusing them with capabilities (co-15).
- I can keep a page readable with JavaScript disabled and enhance from there (co-16).

## Elaborative interrogation & self-explanation

Six why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer. Argue before reading.

**E1 (loader before render versus fetch after paint).** Why load on the server before rendering instead of fetching in the browser after paint, and when is the rejected alternative actually right?

Model answer: loading before render puts data in the first HTML, so crawlers, slow networks, and no-JS visitors all read content immediately, and error states resolve before paint. Fetch-after-paint is right when the data is personal and live — trackers, carts — because no shared cache can serve it and the browser must own the ticking state anyway. The rule is placement by audience: shared and stable loads on the server, personal and live loads in the browser.

**E2 (actions versus client-side mutation with an API call).** Why mutate through a server action instead of calling a JSON API from the client, and what does the rejected alternative lose?

Model answer: the action colocates validation, mutation, and error shape with the route that needs them, inherits the framework's error boundaries and revalidation, and keeps secrets and prices off the client. A hand-rolled API call re-implements validation, error mapping, and cache retirement per endpoint, and every rule enforced only in the browser is a suggestion. Use the action where the framework owns the page; reserve raw API calls for genuinely external consumers.

**E3 (typed links versus string links).** Why route every link through the type table instead of concatenating strings, and what breaks first without it?

Model answer: string links rot silently — routes rename, params change, and each hardcoded href becomes a 404 discovered by a visitor. The table turns every rename into compiler-listed fixes at exact lines. What breaks first without it is the long tail: old emails, bookmarks, and pasted links, which is why the runtime guard in Example 41 pairs with the builder rather than replacing it. Types cover links you write; the guard covers links the world writes.

**E4 (revalidation versus full static plus rebuild).** Why revalidate on an interval instead of rebuilding the whole site on every change, and when is the full rebuild right?

Model answer: revalidation bounds staleness per page instead of paying a full build per edit — prices refresh in minutes while help articles sit untouched, and visitors never wait for a deploy. The full rebuild is right when changes are rare and global: a twice-yearly story refresh, a rebrand. Revalidation wins exactly when write frequency differs per topic; tags plus limits price each topic separately instead of coupling them.

**E5 (streaming versus blocking on the slowest query).** Why stream sections progressively instead of awaiting everything before the first byte, and what does streaming cost?

Model answer: streaming trades one late complete page for an instant shell plus late sections, and visitors feel first paint far more than completion. Blocking couples the whole page to its slowest query — one flaky widget delays everything. The cost is complexity of order: chunks must arrive slowest-last, boundaries must isolate failures, and the shell alone must read complete. Pay it per slow section, never per page.

**E6 (two dialects versus one blessed framework).** Why teach both Next.js and TanStack Start instead of blessing one, and what would a single-framework course lose?

Model answer: the measured comparison shows behavior agreeing step for step — mechanisms transfer, only spellings differ — so teaching one would teach habits disguised as laws. Two dialects force the separation: loaders precede renders everywhere, actions own mutations everywhere, and the matrix names which rows are universal. A single-framework course produces developers who know a tool; this course aims at developers who know the placement decision and can carry it anywhere.
