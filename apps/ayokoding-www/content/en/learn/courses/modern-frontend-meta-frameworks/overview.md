---
title: "Overview"
date: 2026-10-25T00:00:00+07:00
draft: false
weight: 1
---

NusaMart is fictional, and so is every price on its shelves: three goods, a product list, a detail page, and a cart that must survive double clicks. The shop runs twice in this course — once in the Next.js dialect, once in the TanStack Start dialect — because the question is never which framework is better. The question is where each page's code runs, and both frameworks answer it with the same mechanism wearing different filenames.

A meta-framework decides where your code runs (server or browser) and when. That sentence carries the whole course: file-based routing makes the decision visible in the project tree, server rendering and loaders put data in the first HTML, actions own mutations from client components, caching and streaming spend rendering work once, and typed routes move broken links to compile time. Learn the decision and the spellings become translation.

## Why this exists -- the big idea

**The problem before the solution**: `advanced-frontend` mentions Next.js only in passing and never teaches TanStack Start; nobody teaches file-based routing, server rendering, and data loading as a dedicated, compared subject. Shops get built on folklore — cargo-culted `use client` directives, string links that rot, caches nobody can explain. **Keep this if you forget everything else**: decide, per page, what must run on the server and what can run in the browser, and let the framework's routing convention make that decision visible.

## What you will be able to do

After this course you can build file-based routes with layouts and nested routes in both frameworks; load data on the server before a page renders, and explain when that beats client-side fetching; choose between server-rendered, statically generated, and client-rendered pages for a given use case; handle a server action or mutation safely from a client component; and compare Next.js's and TanStack Start's routing and data-loading conventions on the same example app.

## How this course is organized

[Learning](/en/learn/courses/modern-frontend-meta-frameworks/learning/overview) holds 48 worked examples in nine themes: [Theme A](/en/learn/courses/modern-frontend-meta-frameworks/learning/theme-a-file-based-routing) (Examples 1-5) turns files into URLs, [Theme B](/en/learn/courses/modern-frontend-meta-frameworks/learning/theme-b-nested-layouts) (Examples 6-10) nests shared shells, [Theme C](/en/learn/courses/modern-frontend-meta-frameworks/learning/theme-c-server-rendering) (Examples 11-15) renders on the server, [Theme D](/en/learn/courses/modern-frontend-meta-frameworks/learning/theme-d-static-generation) (Examples 16-21) builds once and replays, [Theme E](/en/learn/courses/modern-frontend-meta-frameworks/learning/theme-e-server-data-loading) (Examples 22-27) loads before rendering, [Theme F](/en/learn/courses/modern-frontend-meta-frameworks/learning/theme-f-server-actions-and-mutations) (Examples 28-33) mutates safely, [Theme G](/en/learn/courses/modern-frontend-meta-frameworks/learning/theme-g-caching-and-streaming) (Examples 34-38) replays and streams, [Theme H](/en/learn/courses/modern-frontend-meta-frameworks/learning/theme-h-type-safe-routing) (Examples 39-43) types the URL surface, and [Theme I](/en/learn/courses/modern-frontend-meta-frameworks/learning/theme-i-framework-comparison-and-trade-offs) (Examples 44-48) compares and chooses. The [capstone](/en/learn/courses/modern-frontend-meta-frameworks/learning/capstone/overview) builds the same catalog app twice with a comparison report, and [drilling](/en/learn/courses/modern-frontend-meta-frameworks/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: just-enough-typescript for the TypeScript every example runs in, frontend-essentials for components and hooks, and advanced-frontend for the rendering vocabulary this course compares as a dedicated subject. Assumed knowledge: basic React component and hook concepts.

## About the examples

Every runnable example executes on Node with the pinned TypeScript toolchain (Node 24, TypeScript 7.0.2, standard library only): route tables, layout composition, loaders, actions, caches, and typed builders as small, deterministic TypeScript programs. The nine theme anchors go one step further — each serves its models over loopback and reads them back with plain `fetch`, so server behavior is verified against a running server with no browser and no deployed URL. No network beyond loopback happens, no clock is read, no random value appears; NusaMart and every product are fictional and labelled as such.

## References

- Next.js documentation, App Router: project structure and file conventions, server and client components, data fetching, and caching. Read and re-verified at writing time; accessed 2026-10-25. Routing and data-loading conventions change between major versions, so the docs as of this date are the authority behind every Next.js spelling in this course.
- TanStack Start documentation and TanStack Router routing guides: file-based routing, route tree generation, loaders, and server functions. Read and re-verified at writing time; accessed 2026-10-25. The `$param` and `$` splat spellings, `__root.tsx`, and loader-before-render semantics in this course follow the docs as of this date.
- The pinned Node/TypeScript toolchain versions are the source of truth for any version-specific API.
- Legacy material this course migrates and re-verifies: `fe-nextjs` and `fe-tanstack-start` legacy pages — accessed 2026-10-25; every fact mined from those pages was re-checked against the framework docs above on the same date rather than copied as already correct.
