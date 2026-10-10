---
title: "Overview"
date: 2026-07-29T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Frontend Essentials](../frontend-essentials/learning/overview.md) -- the
  component model (state, props, one-way data flow, keyed lists), controlled validated forms, basic
  ARIA and keyboard patterns, and discriminated-union UI state. Every example here assumes you can
  already build a typed component and read a `tsc` error; [Just Enough TypeScript](../just-enough-typescript/learning/overview.md) -- generics, unions, and narrowing, the
  raw material co-33 turns into typed components; and [Software Testing](../software-testing/learning/overview.md) -- Testing-Library component tests and the shape
  of an e2e smoke, which Examples 76-78 and the capstone build directly on.
- **Tools & environment**: a macOS/Linux terminal; **Node.js** + npm; **TypeScript** (`tsc` 5.8) and
  **tsx** to run each worked example from the CLI. No running dev server, browser, or installed
  framework is required to run any single example -- React, the browser DOM, and framework mechanics
  (RSC, SSR, signals, service workers) are modeled in pure TypeScript so every "Output" block is a
  real captured run, exactly the way the prerequisite topic modeled the component model in vanilla
  JS. The capstone additionally uses **Vitest** + **`@testing-library/dom`**.
- **Assumed knowledge**: building a typed component with state + an accessible form (topic 14);
  running a component test from the CLI (topic 15); reading a TypeScript union and a generic
  signature (topic 13).

## Why this exists -- the big idea

**The problem before the solution**: a UI that renders correctly can still fail its users -- slow to
paint, janky to interact, inaccessible to a screen reader, and impossible to reason about once state
sprawls across a dozen components. **The one idea worth keeping if you forget everything else**: the
frontend's hard problems are state and time -- derive the UI from a single source of state, push data
fetching and caching to well-defined edges, and _measure_ performance instead of guessing at it.

**Cross-cutting big ideas, taught here and carried through every tier**: `taming-state` --
state-at-scale is the central difficulty of a real frontend, and the client-vs-server cache split
(co-15) plus the global-store decision (co-16) are both state-taming moves; `consistency-latency-
throughput` -- Core Web Vitals (co-08) and the rendering-strategy choice (co-01 through co-07) are
latency/throughput trade-offs wearing a frontend vocabulary.

> **Scope guard -- advanced frontend vs. the essentials that already work vs. the backend behind it.**
> [Frontend Essentials](../frontend-essentials/learning/overview.md) owns the **mechanics of a
> single component and an accessible form**: state, props, one-way data flow, the controlled-input
> rule, basic ARIA, and a typed component. This course assumes that mechanical layer already works
> and owns a different, larger question: what happens once there are _many_ components, _real_
> performance budgets, _server_ state to cache and invalidate, and genuinely hard accessibility
> widgets to build -- and how the rendering strategy and the state architecture decide whether the
> result is fast and maintainable or slow and tangled. `backend-essentials` and `backend-at-scale`
> own the server that a server-rendered page (co-02, co-04, co-07) or a cached fetch (co-15, co-28)
> talks to; this course treats that server as a boundary it sends requests _across_, not something it
> implements. `software-testing` (topic 15) owns testing fundamentals; this course's Examples 76-78
> reuse Testing-Library and Playwright specifically against frontend behaviour, not testing theory.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 80 runnable, heavily annotated worked examples across
  Beginner (Examples 1-28: the four rendering strategies CSR/SSR/SSG/streaming, hydration and the
  mismatch warning, islands and React Server Components, the Core Web Vitals triad LCP/INP/CLS with
  their 2026 thresholds, the critical rendering path, code splitting and tree shaking, the Rules of
  Hooks, `useEffect` semantics with cleanup and deps, `useMemo`/`useCallback`, reconciliation and
  keys, and the controlled-input rule), Intermediate (Examples 29-56: uncontrolled inputs and the
  no-switch rule, client-vs-server cache state with invalidation and optimistic updates, when to
  reach for Redux, derived selectors, a hand-built virtual DOM diff, reconciliation by element type,
  signals with fine-grained updates, semantic landmarks, an ARIA tabs widget, roving tabindex and a
  focus trap, live regions, accessible form validation and error summaries, CSS Modules vs Tailwind
  vs specificity, HTTP caching with `stale-while-revalidate`, a service worker, and performance
  budgets with bundle analysis), and Advanced (Examples 57-80: data waterfalls and prefetching,
  Suspense-for-data via `use()` versus the `useEffect`-fetch trap, image optimization, edge rendering
  and its Web-API subset, discriminated-union state with exhaustive narrowing, generic and precisely-
  typed components, the PWA app shell and installability, i18n with `Intl` and RTL, Testing-Library
  behaviour tests, a Playwright e2e smoke, an error boundary, and a closing capstone-preview assembly
  of a searchable, paginated dashboard) -- plus a four-step capstone that builds that dashboard with
  SSR/streaming, cached fetching, an optimistic update that rolls back, an ARIA-correct widget, and
  component + e2e tests.
- **Drilling** -- the spaced-repetition companion: drills across all 37 concepts, applied problems,
  self-contained TypeScript katas, an evaluation checklist, and prompts that connect the drills to
  the capstone.

**A note on how this course verifies its own claims**: every worked example is GENUINELY EXECUTED
TypeScript (`npx tsx example.ts`, or `tsc --noEmit --strict` for the pure type-checking ones), not
hand-traced. React's, the browser's, and the framework's real-world mechanics are modeled in
pure TypeScript rather than depending on a live React/Next.js/Astro install, so every printed
"Output" block is a real captured run, never a fabricated transcript.

## Accuracy notes

> Verified in the pre-authoring `web-researcher` sweep (DD-28) and the DD-35 primary-source pass
> (2026-07-12). Every volatile, version-pinned, or calendar-dependent fact below is flagged or dated
> here rather than stated unqualified in the stable spine above; any `[Unverified]` item stays
> flagged.

- **Core Web Vitals** -- **INP replaced FID** as a stable Core Web Vital on **March 12, 2024**
  ([web.dev, INP CWV launch](https://web.dev/blog/inp-cwv-launch)). **LCP**: good ≤ 2.5 s / poor >
  4.0 s; **INP**: good ≤ 200 ms / poor > 500 ms; **CLS**: good ≤ 0.1 / poor > 0.25 -- all at the 75th
  percentile over a rolling 28-day CrUX window. Sources: [LCP](https://web.dev/articles/lcp),
  [INP](https://web.dev/articles/inp), [CLS](https://web.dev/articles/cls) (all fetched, verbatim
  thresholds). CLS is "the largest burst of layout shift scores ... during the entire lifecycle of a
  page."
- **React Server Components** -- `'use client'` "must be at the very beginning of a file, above any
  imports"; it "defines the boundary between server and client code on the module dependency tree,
  **not** the render tree." Source: [react.dev, 'use client'](https://react.dev/reference/rsc/use-client)
  (fetched, verbatim).
- **Hydration** -- "`hydrateRoot` lets you display React components inside a browser DOM node whose
  HTML content was previously generated by `react-dom/server`." Source:
  [react.dev, hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot) (fetched).
- **Islands architecture** -- "rendering the majority of your page to fast, static HTML with smaller
  'islands' of JavaScript ... when interactivity ... is needed." Source:
  [Astro Docs -- Islands](https://docs.astro.build/en/concepts/islands/) (fetched). "Progressive
  hydration" is an ecosystem pattern name, not a spec term -- `[Unverified]` (no standards body
  defines it; it remains a community/framework term, taught as such).
- **Critical rendering path** -- "CSS is treated as a render-blocking resource ... the browser won't
  render any ... content until the CSSOM is constructed"; "both the DOM and the CSSOM are required to
  construct the render tree." Source:
  [web.dev -- render-blocking CSS](https://web.dev/articles/critical-rendering-path/render-blocking-css)
  (fetched).
- **Code splitting / tree shaking** -- `React.lazy(load)` is top-level and needs a `<Suspense>`
  wrapper ([react.dev, lazy](https://react.dev/reference/react/lazy)); tree shaking = "the removal of
  dead code" via ES-module static analysis
  ([MDN](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)).
- **Rules of Hooks** -- (1) only call Hooks at the top level (not in loops/conditions/nested
  functions/after an early return); (2) only call them from React function components or custom Hooks.
  Source: [react.dev, Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) (fetched,
  verbatim). The _why_ (call-order-indexed per-fiber state) is community/Fiber knowledge,
  `[Unverified]` as an official-docs quote.
- **useEffect / useMemo / useCallback** -- "Effects run at the end of a commit after the screen
  updates"; cleanup runs with old values before setup runs with new values; dependencies compared
  with `Object.is` ([react.dev, useEffect](https://react.dev/reference/react/useEffect)). "`useMemo`
  ... lets you cache the result of a calculation between re-renders"
  ([react.dev, useMemo](https://react.dev/reference/react/useMemo)).
- **Reconciliation & keys** -- "React implements a heuristic O(n) algorithm"; "unstable keys (like
  those produced by `Math.random()`) will cause many ... DOM nodes to be unnecessarily recreated."
  Source: [Reconciliation (legacy.reactjs.org)](https://legacy.reactjs.org/docs/reconciliation.html)
  (the frozen legacy page, still the only official algorithm explainer).
- **Signals** -- "a signal is an object with a `.value` property ... the signal itself always stays
  the same" ([Preact Signals](https://preactjs.com/guide/v10/signals/), fetched). SolidJS fine-grained
  reactivity is corroborated in the [solidjs/solid README](https://github.com/solidjs/solid);
  `docs.solidjs.com` stayed Cloudflare-blocked (403), so verbatim SolidJS docs quotes remain
  `[Unverified]` by direct primary fetch.
- **WCAG 2.2** -- a **W3C Recommendation on October 5, 2023**, adding **9 new Success Criteria** vs
  2.1. Sources: [W3C WAI news](https://www.w3.org/WAI/news/2023-10-05/wcag22rec/),
  [What's New in 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) (fetched).
- **Focus management** -- "the focused element is the active element (`document.activeElement`)";
  strategies are **roving tabindex** and **`aria-activedescendant`**. Source:
  [W3C WAI-ARIA APG -- Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
  (fetched).
- **Controlled vs uncontrolled inputs** -- "An input can't be both controlled and uncontrolled ...
  [and] cannot switch ... over its lifetime." Source:
  [react.dev, `<input>`](https://react.dev/reference/react-dom/components/input) (fetched, verbatim).
- **HTTP caching / SWR** -- "stale-while-revalidate ... indicates that the cache could reuse a stale
  response while it revalidates" (RFC 5861). Source:
  [MDN -- Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#stale-while-revalidate)
  (fetched).
- **CSS at scale** -- "A CSS Module is a CSS file where all class names ... are scoped locally by
  default" ([css-modules README](https://github.com/css-modules/css-modules)); specificity is the
  **ID--CLASS--TYPE** three-column model ([MDN Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity)).
- **Data fetching / Suspense** -- "**Suspense does not detect when data is fetched inside an Effect or
  event handler**" -- only `use()` of a promise, lazy code, and framework integrations trigger it.
  Sources: [react.dev, `<Suspense>`](https://react.dev/reference/react/Suspense) (fetched).
- **Image optimization** -- `next/image` `alt` is **required since v13.0.0**; `loading` **defaults to
  `"lazy"`**. Source: [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image)
  (fetched).
- **Edge runtime** -- `runtime: 'nodejs' | 'edge'`, default `'nodejs'`; the edge runtime is a V8-
  isolate subset of Web APIs, ES-modules only. Source:
  [Next.js Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
  (fetched).
- **TypeScript in frontend** -- a discriminated union: "When every type in a union contains a common
  property with literal types, TypeScript ... can narrow out the members of the union." Source:
  [TS Handbook -- Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
  (fetched, verbatim).
- **Testing** -- "The more your tests resemble the way your software is used, the more confidence they
  can give you" ([Testing Library -- Guiding Principles](https://testing-library.com/docs/guiding-principles/));
  "Playwright Test is an end-to-end test framework for modern web apps"
  ([Playwright](https://playwright.dev/docs/intro)) (both fetched).

---

Next: [Learning Overview](./learning/overview.md) →
