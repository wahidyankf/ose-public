---
title: "Intermediate"
date: 2026-04-29T00:00:00+07:00
draft: false
weight: 10000002
description: "Master Workbox 7.4.0, @serwist/next for Next.js, push notifications, IndexedDB, Screen Wake Lock, File System Access, and advanced manifest fields through 29 annotated examples"
tags:
  ["pwa", "progressive-web-apps", "workbox", "serwist", "push-notifications", "indexeddb", "by-example", "intermediate"]
---

This intermediate tutorial builds on service worker fundamentals through 29 heavily annotated examples covering Workbox 7.4.0, Next.js PWA integration with @serwist/next, push notifications, IndexedDB, and modern browser APIs. Each example maintains 1-2.25 comment lines per code line.

## Prerequisites

Before starting, ensure you have completed or understand:

- Web app manifest basics (Examples 1-5)
- Service worker lifecycle (Examples 6-9)
- Caching strategies (Examples 11-15)
- Install prompts (Examples 21-23)

## Group 6: Workbox 7.4.0

## Example 29: Workbox 7.4.0 Setup — workbox-webpack-plugin and workbox-build

Workbox is Google's production-grade library for service workers. Version 7.4.0 is the current stable release. It provides tested, configurable implementations of caching strategies, precaching, and routing.

**Code**:

```bash
# Install Workbox for webpack-based apps (React, Vue, vanilla)
npm install workbox-webpack-plugin --save-dev
# => workbox-webpack-plugin v7.4.0 integrates with webpack build

# Install Workbox for build tool integration (Vite, Rollup, CLI)
npm install workbox-build --save-dev
# => workbox-build v7.4.0 provides generateSW and injectManifest modes

# Install Workbox runtime libraries for use inside the service worker
npm install workbox-routing workbox-strategies workbox-precaching workbox-expiration
# => workbox-routing: registerRoute() and route matching
# => workbox-strategies: CacheFirst, NetworkFirst, StaleWhileRevalidate classes
# => workbox-precaching: precacheAndRoute() for build asset precaching
# => workbox-expiration: ExpirationPlugin for TTL and max-entry limits
```

**webpack.config.js** — using the webpack plugin:

```javascript
// webpack.config.js
const { GenerateSW } = require("workbox-webpack-plugin");
// => GenerateSW mode: Workbox generates the entire sw.js file automatically
// => Alternative: InjectManifest mode (Example 30) lets you write custom sw.js

module.exports = {
  // ... other webpack config
  plugins: [
    new GenerateSW({
      // => swDest: output path for generated service worker file
      swDest: "sw.js",
      // => clientsClaim: calls clients.claim() in activate (immediate control)
      clientsClaim: true,
      // => skipWaiting: calls skipWaiting() in install (skip waiting phase)
      skipWaiting: true,
      // => runtimeCaching: additional runtime caching rules beyond precache
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com/,
          // => Matches Google Fonts CSS requests
          handler: "StaleWhileRevalidate",
          // => Serve from cache instantly, refresh in background
          options: {
            cacheName: "google-fonts-stylesheets",
          },
        },
      ],
    }),
  ],
};
```

**Key Takeaway**: `GenerateSW` mode auto-generates a complete service worker. `InjectManifest` mode (next example) gives you a custom sw.js template when you need non-standard behavior.

**Why It Matters**: Hand-writing production service workers is error-prone — cache management, strategy logic, and precache manifest generation all have subtle edge cases. Workbox encodes best practices from the Chrome team into tested, maintained code. Using Workbox 7.4.0 instead of older `next-pwa` or `@ducanh2912/next-pwa` packages ensures you benefit from the latest security patches and API support.

---

## Example 30: Workbox precacheAndRoute — Precaching Build Assets Automatically

`precacheAndRoute` takes the Workbox precache manifest (generated at build time) and caches every asset with content-hash URLs. On subsequent loads, cached assets serve instantly.

**Code**:

```javascript
// sw.js — custom service worker using Workbox InjectManifest mode

import { precacheAndRoute } from "workbox-precaching";
// => precacheAndRoute: the core Workbox function combining precache + routing

// => __WB_MANIFEST is replaced at build time by workbox-build/workbox-webpack-plugin
// => It expands to an array of { url, revision } objects for every build asset
// => Example: [{ url: "/app.js", revision: "abc123" }, { url: "/styles.css", revision: "def456" }]
precacheAndRoute(self.__WB_MANIFEST);
// => Registers all build assets in the "workbox-precache-v2" cache
// => Sets up fetch routes to serve precached assets from cache first
// => Handles cache busting via revision hashes — new deployment = new revision = new fetch

// => Self-check: verify precaching is active
self.addEventListener("install", (event) => {
  console.log("Workbox precache manifest installed");
  // => Output confirms __WB_MANIFEST was processed
  // => All assets in the manifest are now fetched and stored in cache
});

// => precacheAndRoute also sets up a default fetch handler for precached URLs
// => Requests for /app.js serve from cache immediately (Cache First for precached assets)
// => Requests for unknown URLs fall through to the next registered route or network
```

**Key Takeaway**: `precacheAndRoute(self.__WB_MANIFEST)` handles the entire precache workflow — fetching assets during install, serving them from cache on fetch, and managing revisions for cache busting. The `__WB_MANIFEST` placeholder is injected by the build tool.

**Why It Matters**: Manual precaching (writing URL arrays by hand as in Example 8) breaks whenever a filename changes. Build tools generate content-hash filenames for cache busting. `precacheAndRoute` with `__WB_MANIFEST` automatically stays in sync with the build output — zero maintenance required. This is the production-standard approach for any webpack, Vite, or Rollup app.

---

## Example 31: Workbox Route Registration — registerRoute with URL Patterns

`registerRoute` registers a caching handler for requests matching a URL pattern or custom matcher function. Multiple routes can be registered with different strategies.

**Code**:

```javascript
// sw.js

import { registerRoute } from "workbox-routing";
// => registerRoute: associates a URL matcher with a caching strategy
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
// => Strategy classes from workbox-strategies

// => Route 1: Images — Cache First (images rarely change)
registerRoute(
  // => Matcher: a function receiving { url, request, event }
  ({ request }) => request.destination === "image",
  // => request.destination: "image" matches <img>, CSS background-image, etc.
  new CacheFirst({
    cacheName: "images-cache",
    // => All image responses stored in "images-cache"
  }),
);
// => Images now served from cache on second+ visit — no network request

// => Route 2: API responses — Network First (freshness matters)
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  // => Matches any URL starting with /api/
  new NetworkFirst({
    cacheName: "api-cache",
    // => Fallback cache when network fails
    networkTimeoutSeconds: 3,
    // => If network takes >3s, serve from cache immediately
  }),
);
// => API requests try network, fall back to cache if slow or offline

// => Route 3: Google Fonts — Stale While Revalidate
registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  // => Matches all requests to fonts.googleapis.com
  new StaleWhileRevalidate({
    cacheName: "google-fonts",
  }),
);
// => Font CSS served from cache instantly, updated in background

// => Route 4: Navigation requests (HTML) — Network First
registerRoute(
  ({ request }) => request.mode === "navigate",
  // => request.mode === "navigate" matches browser navigation (address bar, links)
  new NetworkFirst({
    cacheName: "pages-cache",
    plugins: [],
  }),
);
```

**Key Takeaway**: `registerRoute(matcher, strategy)` pairs a URL pattern or function with a Workbox strategy. Matchers can check URL properties, request destination, or request mode — use whichever gives the most precise match for your use case.

**Why It Matters**: Different resource types need different caching strategies. Mixing strategies in a single route handler creates unmaintainable code. Workbox's route registration system keeps each strategy's logic isolated and composable. The `request.destination` API cleanly separates resource types (image, script, style, font) without brittle URL matching.

---

## Example 32: Workbox CacheFirst with ExpirationPlugin — TTL and Max Entries

`ExpirationPlugin` adds time-to-live (TTL) and maximum entry count limits to any Workbox cache. Without it, caches grow unboundedly and serve stale assets indefinitely.

**Code**:

```javascript
// sw.js

import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
// => ExpirationPlugin: adds TTL and max-entry enforcement to a cache

registerRoute(
  ({ request }) => request.destination === "image",
  // => Apply to all image requests
  new CacheFirst({
    cacheName: "images-cache-v1",
    plugins: [
      new ExpirationPlugin({
        // => maxEntries: maximum number of items to keep in this cache
        // => When limit reached, oldest entries are evicted (LRU policy)
        maxEntries: 60,
        // => Cache holds at most 60 images; 61st evicts the oldest

        // => maxAgeSeconds: maximum age of a cached entry in seconds
        // => 30 days in seconds: 30 * 24 * 60 * 60 = 2592000
        maxAgeSeconds: 30 * 24 * 60 * 60,
        // => Images older than 30 days are evicted on next access

        // => purgeOnQuotaError: automatically clear this cache if storage quota exceeded
        purgeOnQuotaError: true,
        // => Prevents storage quota errors from crashing the SW
      }),
    ],
  }),
);

// => Font cache with strict limits
registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  // => Google Fonts binary assets (woff2, woff files)
  new CacheFirst({
    cacheName: "font-assets",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        // => 30 fonts maximum — enough for most apps
        maxAgeSeconds: 365 * 24 * 60 * 60,
        // => 1 year TTL — fonts never change at the same URL (versioned by Google)
      }),
    ],
  }),
);
```

**Key Takeaway**: Always attach `ExpirationPlugin` to CacheFirst routes to prevent unbounded cache growth. Set `maxEntries` based on how many unique URLs you expect, and `maxAgeSeconds` based on how often the content changes.

**Why It Matters**: A CacheFirst strategy without expiration fills the browser's storage quota over time, eventually triggering automatic eviction of ALL caches — including your carefully pre-cached app shell. `ExpirationPlugin` applies a disciplined eviction policy that keeps caches small and current without manual intervention.

---

## Example 33: Workbox NetworkFirst with Timeout — Serve Stale if Network Too Slow

`networkTimeoutSeconds` in `NetworkFirst` caps how long Workbox waits for a network response before serving the cached version. This prevents slow network connections from blocking UI rendering.

**Code**:

```javascript
// sw.js

import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

registerRoute(
  ({ request }) => request.mode === "navigate",
  // => Apply to HTML navigation requests
  new NetworkFirst({
    cacheName: "pages-cache",

    // => networkTimeoutSeconds: seconds to wait for network before falling back to cache
    // => If network responds in <3s: serve fresh response and update cache
    // => If network takes >3s: serve from cache immediately, network response discarded
    networkTimeoutSeconds: 3,
    // => 3 seconds balances freshness with responsiveness

    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        // => At most 30 cached pages
        maxAgeSeconds: 24 * 60 * 60,
        // => Pages expire after 24 hours
      }),
    ],
  }),
);

// => API responses with aggressive timeout
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/dashboard"),
  // => Dashboard API: time-sensitive, show stale data if network is slow
  new NetworkFirst({
    cacheName: "dashboard-api",
    networkTimeoutSeconds: 2,
    // => Show last-known dashboard data if API takes more than 2s
    // => User sees real data faster; cache updates silently in background
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 5 * 60,
        // => Dashboard data: 5-minute TTL (data changes frequently)
      }),
    ],
  }),
);
```

**Key Takeaway**: `networkTimeoutSeconds` turns `NetworkFirst` into a "race" between network speed and cache freshness. Set the timeout based on what feels instant for your users — typically 2-4 seconds for navigation, shorter for API calls.

**Why It Matters**: A NetworkFirst strategy without a timeout blocks rendering until the network responds — potentially 10+ seconds on a slow connection. A 3-second timeout means users never wait more than 3 seconds for a cached page to appear. This dramatically improves perceived performance on 3G connections without sacrificing freshness when the network is fast.

---

## Example 34: Workbox StaleWhileRevalidate for API Responses with NetworkOnly Fallback

`StaleWhileRevalidate` delivers the best of cache speed and network freshness. Pair it with a `NetworkOnly` route for endpoints that must never be served from cache.

**Code**:

```javascript
// sw.js

import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate, NetworkOnly } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// => Route 1: Article content — StaleWhileRevalidate
// => Articles change infrequently; instant response + background refresh is ideal
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/articles"),
  // => Matches /api/articles, /api/articles/123, /api/articles?page=2
  new StaleWhileRevalidate({
    cacheName: "articles-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        // => Cache up to 100 articles
        maxAgeSeconds: 7 * 24 * 60 * 60,
        // => Articles expire after 7 days
      }),
    ],
  }),
);
// => User sees cached article instantly; cache updated after network responds

// => Route 2: Mutation endpoints — NetworkOnly (never cache POST/PUT/DELETE)
registerRoute(
  ({ request, url }) => request.method !== "GET" && url.pathname.startsWith("/api/"),
  // => Matches all non-GET API requests
  new NetworkOnly(),
  // => All POSTs go directly to network — never read from or write to cache
);
// => Form submissions, data creation, deletions: always reach the server

// => Route 3: Real-time prices — NetworkOnly
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/prices"),
  // => Prices change every second — cache would be immediately stale
  new NetworkOnly(),
  // => Price requests bypass cache entirely
);
```

**Key Takeaway**: Use `StaleWhileRevalidate` for read-heavy content that tolerates brief staleness, and `NetworkOnly` for mutation endpoints and real-time data where caching would be incorrect.

**Why It Matters**: Applying `StaleWhileRevalidate` to mutation endpoints is a critical bug — a cached POST response would appear to succeed while the actual request was never sent. Separating read (SWR) and write (NetworkOnly) routes by HTTP method ensures data integrity. This is the pattern underlying most production PWA API integrations.

---

## Example 35: Workbox BroadcastUpdatePlugin — Notify Clients When Cache Updates

`BroadcastUpdatePlugin` fires a `BroadcastChannel` message to all open tabs when a `StaleWhileRevalidate` route updates its cache. Use it to notify the UI that fresher data is available.

**Code**:

```javascript
// sw.js

import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";
import { BroadcastUpdatePlugin } from "workbox-broadcast-update";
// => BroadcastUpdatePlugin: sends postMessage to clients when cache updates

registerRoute(
  ({ url }) => url.pathname.startsWith("/api/articles"),
  new StaleWhileRevalidate({
    cacheName: "articles-cache",
    plugins: [
      new BroadcastUpdatePlugin({
        // => channelName: BroadcastChannel name clients listen on
        channelName: "workbox-updates",
        // => headersToCheck: which response headers determine if content changed
        headersToCheck: ["content-type", "etag", "last-modified"],
        // => If ETag or Last-Modified changes between cached and fresh response,
        // => a message is broadcast on "workbox-updates" channel
      }),
    ],
  }),
);
```

In the main app JavaScript:

```javascript
// app.js — listen for cache update notifications from the service worker

// => Open a BroadcastChannel matching the plugin's channelName
const updateChannel = new BroadcastChannel("workbox-updates");
// => updateChannel listens for messages from ANY context with same channel name

updateChannel.addEventListener("message", (event) => {
  // => event.data contains the update metadata
  const { type, payload } = event.data;
  // => type: "CACHE_UPDATED" (from BroadcastUpdatePlugin)
  // => payload: { cacheName, updatedURL }

  if (type === "CACHE_UPDATED") {
    const { updatedURL } = payload;
    // => updatedURL: "/api/articles?page=1" — the URL whose cache was refreshed

    console.log(`Cache updated for: ${updatedURL}`);
    // => Output: "Cache updated for: /api/articles?page=1"

    // => Notify the user that fresher data is available
    showUpdateNotification(`New content available — refresh to see updates`);
    // => Or: automatically re-fetch and re-render the updated data
  }
});

function showUpdateNotification(message) {
  const toast = document.createElement("div");
  toast.className = "update-toast";
  toast.textContent = message;
  // => Toast notification appears in bottom corner of screen
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
  // => Auto-dismiss after 4 seconds
}
```

**Key Takeaway**: `BroadcastUpdatePlugin` automatically compares cached and fresh responses by their headers and broadcasts a message on a named channel when content changes. The main thread listens on the same channel to prompt UI updates.

**Why It Matters**: Without update notifications, users staring at cached content never know when fresher data is available unless they manually refresh. `BroadcastUpdatePlugin` implements the update notification pattern cleanly — no polling, no complex message passing, no manual response comparison. It is the standard production solution for "show stale, notify when fresh" UX.

---

## Example 36: @serwist/next Setup — Modern Next.js PWA Integration

`@serwist/next` is the current standard for adding PWA support to Next.js applications. It replaces the deprecated `next-pwa` and `@ducanh2912/next-pwa` packages. Always use `@serwist/next` for new Next.js projects.

**Code**:

```bash
# Install @serwist/next — the modern PWA solution for Next.js
npm install @serwist/next
# => @serwist/next wraps Next.js config and generates the service worker

# Also install serwist for use inside the service worker file
npm install serwist
# => serwist: the core library (runtime strategies, precaching, routing)

# IMPORTANT: Do NOT install these deprecated packages:
# npm install next-pwa          <- DEPRECATED, unmaintained
# npm install @ducanh2912/next-pwa  <- DEPRECATED as of 2024
```

**next.config.mjs**:

```javascript
// next.config.mjs
import withSerwist from "@serwist/next";
// => withSerwist: HOC that wraps Next.js config with service worker generation

// => Configure @serwist/next options
const withSerwistConfig = withSerwist({
  // => swSrc: path to your custom service worker source file
  // => This file is compiled and placed at swDest
  swSrc: "src/sw.ts",
  // => swSrc must exist — create it in the next example

  // => swDest: output path for the compiled service worker
  // => Must be inside the public/ directory to be served at the root URL
  swDest: "public/sw.js",
  // => Service worker will be accessible at /sw.js

  // => disable: set true to completely disable SW in development
  // => Prevents service worker caching from interfering with hot reload
  disable: process.env.NODE_ENV === "development",
  // => SW disabled in dev, enabled in production
});

// => Apply withSerwist to your Next.js config
const nextConfig = {
  reactStrictMode: true,
  // => Add other Next.js config options here
};

export default withSerwistConfig(nextConfig);
// => Next.js build now generates public/sw.js from src/sw.ts
```

**Key Takeaway**: Wrap your `next.config.mjs` export with `withSerwist({ swSrc, swDest })` to enable PWA support. Set `disable: process.env.NODE_ENV === 'development'` to prevent service worker interference during development.

**Why It Matters**: `@serwist/next` is the officially recommended replacement for the deprecated `next-pwa` and `@ducanh2912/next-pwa` packages. These older packages have unresolved security issues and are no longer maintained. Migrating to `@serwist/next` provides access to the latest Workbox features, TypeScript support, and Next.js App Router compatibility.

---

## Example 37: @serwist/next — swSrc/swDest Config and TypeScript Service Worker

The `swSrc` service worker file is a TypeScript file that imports from the `serwist` package. It handles precaching, routing, and any custom logic for your Next.js PWA.

**Code**:

```typescript
// src/sw.ts — TypeScript service worker for @serwist/next

import { defaultCache } from "@serwist/next/worker";
// => defaultCache: pre-built routing rules for Next.js (JS chunks, static assets, images)

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
// => TypeScript types for type-safe service worker code

import { Serwist } from "serwist";
// => Serwist: the main class combining precaching, routing, and lifecycle management

// => Declare the global type for __WB_MANIFEST
// => TypeScript needs this declaration because __WB_MANIFEST is injected at build time
declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[];
    // => __SW_MANIFEST: array of { url, revision } objects from @serwist/next build
  }
}

// => Self refers to the ServiceWorkerGlobalScope (the SW's global context)
declare const self: ServiceWorkerGlobalScope;

// => Create the Serwist instance with configuration
const serwist = new Serwist({
  // => precacheEntries: the build-time manifest injected by @serwist/next
  precacheEntries: self.__SW_MANIFEST,
  // => All Next.js build assets (JS chunks, CSS, images) are precached

  // => skipWaiting: activate immediately when a new SW version is installed
  skipWaiting: true,

  // => clientsClaim: control all open tabs immediately on activation
  clientsClaim: true,

  // => navigationPreload: fetch HTML from network while SW boots (reduces latency)
  navigationPreload: true,
  // => See Example 67 for detailed navigationPreload explanation

  // => runtimeCaching: additional runtime strategies from @serwist/next defaults
  runtimeCaching: defaultCache,
  // => defaultCache includes: Next.js image optimization, Google Fonts, etc.
});

// => Add the Serwist event listeners (install, activate, fetch)
serwist.addEventListeners();
// => Single call registers all lifecycle and fetch handlers
// => Equivalent to manually adding install/activate/fetch event listeners
```

**Key Takeaway**: The TypeScript service worker imports `Serwist` from `serwist`, passes `self.__SW_MANIFEST` for precaching, and calls `serwist.addEventListeners()` to register all lifecycle handlers in one call.

**Why It Matters**: TypeScript in service workers catches errors at compile time — wrong API names, incorrect configuration shapes, missing required fields. The `defaultCache` from `@serwist/next/worker` encodes Next.js-specific caching rules (static assets, image optimization routes, API routes) that would take hours to configure correctly by hand. This pattern is the standard `@serwist/next` setup for production Next.js PWAs.

---

## Example 38: Workbox BackgroundSyncPlugin for Failed POST Requests

`BackgroundSyncPlugin` queues failed POST requests and retries them when connectivity is restored using the Background Sync API. **Important: Background Sync is Chromium-only (Chrome 61+, Edge). It is NOT supported in Firefox or Safari.**

**Code**:

```javascript
// sw.js

import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";
// => BackgroundSyncPlugin: queues failed requests for retry via Background Sync API
// => BROWSER SUPPORT: Chrome 61+, Edge — NOT available in Firefox or Safari

// => Create the BackgroundSyncPlugin
const bgSyncPlugin = new BackgroundSyncPlugin("form-submissions-queue", {
  // => First argument: sync tag name — identifies this queue
  // => "form-submissions-queue" used for analytics and debugging

  maxRetentionTime: 24 * 60,
  // => maxRetentionTime: how long (in minutes) to keep failed requests
  // => 24 hours: requests older than 24h are discarded without retry
  // => Prevents stale mutations from replaying days after the fact
});

// => Register the route that uses BackgroundSyncPlugin
registerRoute(
  // => Match POST requests to the form submission endpoint
  ({ url, request }) => request.method === "POST" && url.pathname === "/api/submit-form",
  new NetworkOnly({
    // => NetworkOnly: always try the network first
    plugins: [bgSyncPlugin],
    // => If network fails, BackgroundSyncPlugin queues the request
    // => When connectivity restores, the request is retried automatically
  }),
  "POST",
  // => Third argument to registerRoute: HTTP method (required for non-GET routes)
);

// => Fallback for browsers without Background Sync (Firefox, Safari)
// => These browsers must handle offline form submission differently
// => Example 39 shows the manual fallback pattern
```

**Key Takeaway**: `BackgroundSyncPlugin` automatically queues and retries failed POST requests in Chromium browsers. Always document that this feature requires Chrome or Edge, and implement a manual offline queue fallback for Firefox and Safari users.

**Why It Matters**: Form data submitted offline disappears silently without Background Sync. A user who fills out an order form with no network connectivity and hits submit should have their request queued and delivered when they come back online — not lost with no feedback. Background Sync makes this automatic in Chrome and Edge. For cross-browser support, the manual sync pattern (Example 39) is required.

---

## Example 39: Manual Background Sync — registration.sync.register and the sync Event

For complete browser coverage, implement a manual sync pattern using `registration.sync.register()` in the foreground and a `sync` event handler in the service worker. **Note: The Background Sync API is Chromium-only. This example shows the correct usage; add a navigator.onLine fallback for Firefox/Safari.**

**Code**:

```javascript
// app.js — main thread, queues sync requests

async function submitFormWithSync(formData) {
  // => Store form data in IndexedDB so the SW can access it after page close
  // => (Use idb library from Example 45 for real implementation)
  const db = await openDatabase();
  await db.put("pending-submissions", {
    id: Date.now(),
    // => Use timestamp as unique ID for this submission
    data: formData,
    createdAt: new Date().toISOString(),
    // => Track when request was created for maxRetentionTime logic
  });
  // => Data saved — now register a sync tag

  const registration = await navigator.serviceWorker.ready;
  // => navigator.serviceWorker.ready: resolves to active ServiceWorkerRegistration

  // => Check Background Sync support (Chromium-only)
  if ("sync" in registration) {
    // => registration.sync.register() schedules a sync event in the SW
    // => Tag name identifies which data to sync — SW reads this tag name
    await registration.sync.register("submit-pending-forms");
    // => Browser will fire 'sync' event in SW when network is available
    // => Even if the page is closed, the SW receives this event
    console.log("Background sync registered: submit-pending-forms");
  } else {
    // => Firefox/Safari fallback: try to submit immediately if online
    if (navigator.onLine) {
      await submitDirectly(formData);
      // => Attempt direct submission — works if online
    } else {
      // => Notify user their submission is queued (manual retry on online event)
      console.log("Offline and Background Sync not supported — queued locally");
    }
  }
}
```

Service worker sync handler:

```javascript
// sw.js

self.addEventListener("sync", (event) => {
  // => event.tag: the string passed to registration.sync.register()
  console.log("SW: sync event, tag:", event.tag);
  // => Output: "SW: sync event, tag: submit-pending-forms"

  if (event.tag === "submit-pending-forms") {
    // => event.waitUntil() keeps SW alive until all submissions are sent
    event.waitUntil(
      (async () => {
        // => Read pending submissions from IndexedDB
        const db = await openDatabase();
        const pending = await db.getAll("pending-submissions");
        // => pending: array of { id, data, createdAt } objects

        for (const submission of pending) {
          try {
            await fetch("/api/submit-form", {
              method: "POST",
              body: JSON.stringify(submission.data),
              headers: { "Content-Type": "application/json" },
            });
            // => Successful submission — remove from IndexedDB
            await db.delete("pending-submissions", submission.id);
            console.log("Synced submission:", submission.id);
          } catch {
            // => Still offline — sync will retry automatically (Chromium)
            throw new Error("Sync failed — will retry");
            // => Throwing causes the browser to schedule another sync attempt
          }
        }
      })(),
    );
  }
});
```

**Key Takeaway**: The sync pattern requires two parts: `registration.sync.register('tag')` in the main thread (after storing data) and `self.addEventListener('sync', handler)` in the service worker. Always check `'sync' in registration` and implement a navigator.onLine fallback for Firefox/Safari.

**Why It Matters**: The Background Sync API survives page closure — the OS wakes the service worker when connectivity is restored even if the browser tab is closed. This is fundamentally different from `window.addEventListener('online', ...)` which only fires while the tab is open. The combination of IndexedDB for storage and Background Sync for delivery is the production pattern for offline-first data submission.

---

## Group 7: Push Notifications

## Example 40: Push Notifications — VAPID Key Generation and pushManager.subscribe

Web Push uses VAPID (Voluntary Application Server Identification) keys to authenticate the push server. The browser subscribes using these keys and returns a subscription object that the server uses to send push messages.

**Code**:

```bash
# Generate VAPID keys using the web-push CLI
npm install -g web-push
# => Installs web-push globally for key generation

web-push generate-vapid-keys
# => Output:
# => Public Key: BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
# => Private Key: UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls
# => Keep the Private Key SECRET — never expose in client-side code
# => Public Key: safe to embed in JavaScript served to the browser
```

Subscription in the browser:

```javascript
// app.js — subscribe the user to push notifications

const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69y..."; // => Your actual public key

async function subscribeToPush() {
  // => Get the active service worker registration
  const registration = await navigator.serviceWorker.ready;
  // => registration: ServiceWorkerRegistration — must be active before subscribing

  // => Convert VAPID public key from base64url to Uint8Array
  const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  // => applicationServerKey: Uint8Array — browser requires this format

  // => pushManager.subscribe() requests push permission and creates subscription
  const subscription = await registration.pushManager.subscribe({
    // => userVisibleOnly: MUST be true — browser requires all pushes show notifications
    userVisibleOnly: true,
    // => Silent push (userVisibleOnly: false) is not permitted in browsers
    applicationServerKey,
    // => Server must sign push messages with the corresponding private VAPID key
  });
  // => subscription: PushSubscription object containing endpoint + keys

  console.log("Push subscription:", JSON.stringify(subscription));
  // => Output: { endpoint: "https://fcm.googleapis.com/fcm/send/...", keys: {...} }

  // => Send subscription to your backend for storage
  await fetch("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
    headers: { "Content-Type": "application/json" },
    // => Server stores subscription to send push messages later
  });

  return subscription;
}

// => Helper: convert base64url string to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  // => Convert base64url to standard base64
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  // => Returns binary-encoded key as Uint8Array
}
```

**Key Takeaway**: Generate VAPID keys once with `web-push generate-vapid-keys`. The public key goes in the browser, the private key stays on the server. Subscribe with `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` and send the resulting subscription object to your server.

**Why It Matters**: VAPID authentication prevents third parties from sending push messages to your subscribers. Without it, any server could abuse your users' push subscriptions. The `userVisibleOnly: true` requirement ensures every push message results in a visible notification — browsers block silent pushes to protect user privacy.

---

## Example 41: Receiving Push Events — Displaying Notifications in the Service Worker

The `push` event fires in the service worker when the browser receives a push message from the server. The service worker reads the payload and calls `showNotification()`.

**Code**:

```javascript
// sw.js

// => 'push' event fires when the browser receives a server push message
// => The SW handles this even when all tabs are closed (OS wakes the SW)
self.addEventListener("push", (event) => {
  console.log("SW: push event received");

  // => event.data: PushMessageData object containing the push payload
  // => If no payload was sent, event.data is null
  const payload = event.data ? event.data.json() : {};
  // => payload: parsed JSON object from the push message
  // => Example: { title: "New message", body: "You have 3 unread messages" }

  const title = payload.title || "Notification";
  // => title: notification title shown in OS notification center
  const options = {
    body: payload.body || "",
    // => body: notification body text shown below the title
    icon: payload.icon || "/icons/icon-192.png",
    // => icon: app icon shown in the notification (192px recommended)
    badge: payload.badge || "/icons/badge-72.png",
    // => badge: small monochrome icon shown in status bar (Android)
    data: payload.data || {},
    // => data: custom data passed to notificationclick handler (Example 43)
    tag: payload.tag || "default",
    // => tag: notifications with same tag replace each other (prevents spam)
    requireInteraction: payload.requireInteraction || false,
    // => requireInteraction: notification stays until user dismisses it (desktop)
  };

  // => event.waitUntil() keeps SW alive until notification is shown
  // => showNotification() is async — SW must not terminate before it resolves
  event.waitUntil(
    self.registration.showNotification(title, options),
    // => OS notification displayed with title and options
  );
});
```

**Key Takeaway**: The `push` event fires in the service worker. Parse `event.data.json()` for the payload and call `self.registration.showNotification(title, options)` inside `event.waitUntil()` to keep the SW alive until the notification is displayed.

**Why It Matters**: Push notifications are the primary re-engagement mechanism for PWAs. The service worker handles push even when no tabs are open — this is what makes push feel like native app notifications. The `tag` option prevents notification flooding: sending multiple updates with the same tag replaces the previous notification rather than stacking them in the notification center.

---

## Example 42: Push Notification Actions — Action Buttons in Notifications

Notification actions add interactive buttons to notifications. Users can perform quick actions without opening the app.

**Code**:

```javascript
// sw.js

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};

  event.waitUntil(
    self.registration.showNotification(payload.title || "New Order", {
      body: payload.body || "Your order #1234 is ready for pickup.",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      data: { orderId: payload.orderId },
      // => data.orderId passed to notificationclick handler to identify the order

      // => actions: array of action buttons shown in the notification
      // => Maximum actions: 2 on Android, more on desktop (browser-dependent)
      actions: [
        {
          action: "view-order",
          // => action: string identifier used in notificationclick handler
          title: "View Order",
          // => title: button label text shown to user
          icon: "/icons/action-view.png",
          // => icon: small icon displayed next to action button (optional)
        },
        {
          action: "dismiss",
          // => action: "dismiss" is a conventional name for cancel/close action
          title: "Dismiss",
          icon: "/icons/action-dismiss.png",
        },
      ],

      // => vibrate: vibration pattern in ms [vibrate, pause, vibrate]
      vibrate: [200, 100, 200],
      // => Vibrates 200ms, pauses 100ms, vibrates 200ms (Android only)

      // => renotify: vibrate/sound again even if notification with same tag exists
      renotify: true,
      // => true: user gets new vibration even if previous same-tag notification exists
    }),
  );
});
```

**Key Takeaway**: The `actions` array in notification options adds up to 2 interactive buttons on Android. Each action has an `action` identifier string used in the `notificationclick` handler (next example) to determine which button was pressed.

**Why It Matters**: Notification actions reduce friction for common responses. "Mark as read," "Reply," or "View Order" buttons let users handle notifications without opening the full app. Studies show notification actions increase engagement rates by 40-60% compared to tap-only notifications. The pattern is essential for messaging apps, e-commerce order tracking, and any notification requiring a binary choice.

---

## Example 43: notificationclick Handler — Focus Existing Window or Open New One

The `notificationclick` event fires in the service worker when the user taps a notification or an action button. The handler focuses an existing window or opens a new one.

**Code**:

```javascript
// sw.js

self.addEventListener("notificationclick", (event) => {
  // => Close the notification immediately when user clicks it
  event.notification.close();
  // => Dismissed from OS notification center

  // => event.action: the action identifier clicked
  // => "" (empty string) means the notification body was clicked (not an action button)
  const action = event.action;
  // => action: "view-order", "dismiss", or "" (body click)

  // => event.notification.data: the data object from showNotification options
  const { orderId } = event.notification.data;
  // => orderId: "1234" — identifies which order this notification was about

  if (action === "dismiss") {
    // => User tapped Dismiss — close the notification (already done) and stop
    return; // => No further action needed
  }

  // => Determine the URL to open/focus
  const targetUrl =
    action === "view-order"
      ? `/orders/${orderId}` // => Navigate to the specific order page
      : "/"; // => Body click: navigate to home page

  event.waitUntil(
    (async () => {
      // => Check for existing open windows controlled by this SW
      const allClients = await clients.matchAll({
        type: "window",
        // => type: "window" matches browser tabs (not workers)
        includeUncontrolled: true,
        // => includeUncontrolled: include tabs not yet controlled by this SW
      });
      // => allClients: array of WindowClient objects for each open tab

      // => Find an existing tab showing a page from our origin
      const existingClient = allClients.find(
        (client) => client.url.includes(self.location.origin),
        // => Look for any tab on the same origin (e.g., app.example.com)
      );

      if (existingClient) {
        // => Focus the existing tab and navigate it to the target URL
        await existingClient.focus();
        // => Brings the existing tab to the foreground
        await existingClient.navigate(targetUrl);
        // => Navigates the tab to the order page
      } else {
        // => No existing tab — open a new window
        await clients.openWindow(targetUrl);
        // => Opens a new browser tab/window with the target URL
      }
    })(),
  );
});
```

**Key Takeaway**: In `notificationclick`, close the notification, read `event.action` to determine which button was pressed, check for existing windows with `clients.matchAll()`, and either focus an existing tab or open a new one.

**Why It Matters**: Opening a new window every time a notification is clicked is poor UX — users end up with dozens of duplicate tabs. Reusing existing windows maintains the app's session state and feels native. The pattern of checking `clients.matchAll()` before `clients.openWindow()` is the production standard for notification click handlers.

---

## Example 44: Web Push Server with the web-push npm Package

The server-side component uses the `web-push` npm package to send push messages to subscribers using VAPID authentication.

**Code**:

```javascript
// server.js — Node.js push notification server (Express example)

const webPush = require("web-push");
// => web-push: Node.js library for sending Web Push Protocol messages

// => Configure VAPID details — use keys from Example 40
webPush.setVapidDetails(
  "mailto:admin@example.com",
  // => Subject: your email or URL — required for VAPID, used by push services to contact you
  process.env.VAPID_PUBLIC_KEY,
  // => Public key: loaded from environment variable (never hardcode)
  process.env.VAPID_PRIVATE_KEY,
  // => Private key: MUST be secret — loaded from environment variable
);

// => In-memory subscription store (use a database in production)
const subscriptions = new Map();
// => Map<userId, PushSubscription> — store in PostgreSQL/MongoDB in production

// => Endpoint to receive subscription from the browser (Example 40)
app.post("/api/push/subscribe", async (req, res) => {
  const subscription = req.body;
  // => subscription: { endpoint, keys: { p256dh, auth } } from pushManager.subscribe()

  const userId = req.session?.userId || "anonymous";
  subscriptions.set(userId, subscription);
  // => Store subscription keyed by user ID for targeted push

  res.status(201).json({ success: true });
  // => 201 Created: subscription saved
});

// => Send push notification to a specific user
async function sendPushNotification(userId, payload) {
  const subscription = subscriptions.get(userId);
  // => Retrieve subscription from database

  if (!subscription) {
    console.log(`No subscription for user ${userId}`);
    return; // => User not subscribed — skip
  }

  try {
    await webPush.sendNotification(
      subscription,
      // => subscription: the PushSubscription object saved from the browser
      JSON.stringify(payload),
      // => payload: stringified JSON — parsed by event.data.json() in SW (Example 41)
      {
        TTL: 3600,
        // => TTL: time-to-live in seconds (1 hour)
        // => If user is offline, push service holds the message for 1 hour
        // => After TTL, undelivered messages are discarded
      },
    );
    console.log(`Push sent to user ${userId}`);
    // => Push message delivered to the push service (FCM, Mozilla Push, etc.)
  } catch (error) {
    if (error.statusCode === 410) {
      // => 410 Gone: subscription is no longer valid (user unsubscribed or browser cleared)
      subscriptions.delete(userId);
      // => Remove invalid subscription from database
      console.log(`Subscription expired for user ${userId} — removed`);
    } else {
      console.error("Push send failed:", error);
    }
  }
}

// => Trigger push: send order notification to all subscribed users
app.post("/api/orders/:id/notify", async (req, res) => {
  const orderId = req.params.id;
  // => orderId: the order to notify about

  await sendPushNotification(req.session.userId, {
    title: "Order Ready",
    body: `Your order #${orderId} is ready for pickup.`,
    icon: "/icons/icon-192.png",
    orderId,
    // => Passed through to notificationclick handler via event.notification.data
  });

  res.json({ sent: true });
});
```

**Key Takeaway**: Configure `web-push` with `setVapidDetails()`, store browser subscriptions in a database, and send messages with `sendPush.sendNotification(subscription, payload)`. Handle 410 errors by removing expired subscriptions.

**Why It Matters**: The web-push server is where push campaigns, transactional notifications, and real-time alerts originate. Handling 410 status codes (expired subscriptions) is critical for maintaining a clean subscriber list — dead subscriptions accumulate rapidly and waste resources. VAPID key rotation is a periodic security task that requires coordinated client and server updates.

---

## Group 8: IndexedDB and Sync

## Example 45: IndexedDB with idb v8 — openDB, Store Definitions, Transactions

The `idb` library provides a promise-based wrapper around the raw IndexedDB API. It eliminates callback-heavy boilerplate and works naturally with async/await.

**Code**:

```javascript
// db.js — IndexedDB setup using idb v8

import { openDB } from "idb";
// => openDB: idb v8's main function for opening/creating an IndexedDB database

// => Open or create the database
const dbPromise = openDB("my-app-db", 1, {
  // => First argument: database name
  // => Second argument: version number (increment to trigger upgrade)
  // => Third argument: upgrade callback object

  upgrade(db) {
    // => upgrade() called when database is created or version changes
    // => db: IDBDatabase object for creating stores and indexes

    // => Create an object store for tasks
    if (!db.objectStoreNames.contains("tasks")) {
      // => Check before creating to avoid errors on re-runs
      const taskStore = db.createObjectStore("tasks", {
        keyPath: "id",
        // => keyPath: field used as the primary key
        autoIncrement: true,
        // => autoIncrement: browser generates unique numeric IDs
      });

      // => Create an index for querying tasks by status
      taskStore.createIndex("by-status", "status");
      // => Index name: "by-status", indexed field: "status"
      // => Allows: db.getAllFromIndex('tasks', 'by-status', 'pending')
    }

    // => Create a store for sync queue (offline mutations)
    if (!db.objectStoreNames.contains("sync-queue")) {
      db.createObjectStore("sync-queue", {
        keyPath: "id",
        autoIncrement: true,
      });
    }
  },
});

// => Helper functions wrapping the database promise

export async function addTask(task) {
  const db = await dbPromise;
  // => db: resolved IDBDatabase instance
  const id = await db.add("tasks", task);
  // => db.add('tasks', task): inserts task into the 'tasks' store
  // => Returns the auto-generated id: e.g., 1, 2, 3
  console.log("Task added with id:", id);
  return id;
}

export async function getTasksByStatus(status) {
  const db = await dbPromise;
  return db.getAllFromIndex("tasks", "by-status", status);
  // => getAllFromIndex: fetches all records matching the index value
  // => Returns: [{ id: 1, title: "Buy groceries", status: "pending" }, ...]
}

export async function updateTask(id, changes) {
  const db = await dbPromise;
  const existing = await db.get("tasks", id);
  // => db.get('tasks', id): fetches task by primary key
  const updated = { ...existing, ...changes };
  // => Merge existing fields with changes
  await db.put("tasks", updated);
  // => db.put: inserts or replaces the record with the same key
}
```

**Key Takeaway**: `openDB(name, version, { upgrade })` creates/opens the database and handles schema migrations in the `upgrade` callback. Use `db.add()`, `db.get()`, `db.put()`, and `db.getAllFromIndex()` for CRUD operations.

**Why It Matters**: IndexedDB is the only browser storage suitable for large, structured, offline-first data. LocalStorage is synchronous, limited to 5MB, and only stores strings. IndexedDB is asynchronous, can store gigabytes, supports complex queries via indexes, and is accessible from both the main thread and service workers. The `idb` library makes it practical — raw IndexedDB's callback API is notoriously verbose.

---

## Example 46: Syncing IndexedDB Data to the Server in a Background Sync Handler

The Background Sync handler reads pending items from IndexedDB and submits them to the server. Successfully synced items are removed from the queue.

**Code**:

```javascript
// sw.js

import { openDB } from "idb";
// => idb accessible in service workers — same API as in the main thread

async function getSyncQueue() {
  const db = await openDB("my-app-db", 1);
  // => Open same database as main thread (shared storage, different thread)
  return db.getAll("sync-queue");
  // => Returns all pending items: [{ id: 1, type: "addTask", data: {...} }, ...]
}

async function removeFromSyncQueue(id) {
  const db = await openDB("my-app-db", 1);
  await db.delete("sync-queue", id);
  // => Removes successfully synced item by its primary key
}

self.addEventListener("sync", (event) => {
  // => Chromium-only: Firefox and Safari do not support Background Sync
  if (event.tag !== "sync-tasks") return;
  // => Only handle our specific sync tag

  event.waitUntil(
    (async () => {
      const pendingItems = await getSyncQueue();
      // => pendingItems: all queued offline mutations

      for (const item of pendingItems) {
        try {
          // => Submit each pending item to the server
          const response = await fetch(`/api/${item.type}`, {
            method: "POST",
            body: JSON.stringify(item.data),
            headers: { "Content-Type": "application/json" },
          });

          if (response.ok) {
            // => Server accepted the data — remove from sync queue
            await removeFromSyncQueue(item.id);
            console.log("Synced item:", item.id, item.type);
          } else {
            // => Server returned error (validation failure, auth, etc.)
            // => Do NOT remove from queue — keep for manual retry
            console.error("Server rejected sync item:", item.id, response.status);
          }
        } catch (networkError) {
          // => Network still unavailable — throw to signal retry needed
          throw networkError;
          // => Browser will schedule another sync attempt (Chromium behavior)
        }
      }

      console.log("Background sync complete — all items processed");
    })(),
  );
});
```

**Key Takeaway**: In the sync handler, read pending items from IndexedDB, attempt server submission for each, and delete only successfully synced items. Throw on network failure to signal the browser to retry the sync.

**Why It Matters**: The delete-on-success pattern is critical for data integrity. Deleting before confirmation risks data loss if the server returns an error after deletion. Keeping items on server error enables manual retry UX. This pattern matches how email clients handle sent-message queues — draft persists until server confirms receipt.

---

## Group 9: Modern Browser APIs

## Example 47: Screen Wake Lock API — Prevent Screen Sleep During Active Tasks

The Screen Wake Lock API prevents the device screen from dimming or locking during user-critical activities like navigation, video playback, or form filling. It is Baseline 2025 — supported in all major browsers (Chrome, Firefox, Safari, Edge).

**Code**:

```javascript
// app.js

let wakeLock = null;
// => wakeLock: WakeLockSentinel object when active, null when released

async function requestWakeLock() {
  // => Feature detect: Screen Wake Lock is Baseline 2025 (all major browsers)
  // => But still check — older browser versions may not support it
  if (!("wakeLock" in navigator)) {
    console.log("Screen Wake Lock API not supported in this browser version");
    return; // => Degrade gracefully — screen may sleep during task
  }

  try {
    // => navigator.wakeLock.request('screen') acquires a screen wake lock
    // => 'screen' is the only supported type (CPU/system are not available)
    wakeLock = await navigator.wakeLock.request("screen");
    // => wakeLock: WakeLockSentinel — a handle to release the lock later

    console.log("Wake lock acquired — screen will not sleep");
    // => Device screen stays on as long as lock is held

    // => Listen for the lock being released (page hidden, user manually locks)
    wakeLock.addEventListener("release", () => {
      console.log("Wake lock released");
      // => Lock released — screen may now sleep
      wakeLock = null;
      // => Clear reference so re-acquisition can be triggered
    });

    // => Update UI to show that wake lock is active
    document.getElementById("wake-lock-status")?.setAttribute("data-active", "true");
  } catch (error) {
    // => DOMException: NotAllowedError — page not visible or permission denied
    // => DOMException: NotSupportedError — type not supported
    console.error("Wake lock request failed:", error.name, error.message);
  }
}

async function releaseWakeLock() {
  if (wakeLock !== null) {
    await wakeLock.release();
    // => Explicitly releases the wake lock
    // => Screen can now sleep according to device power settings
    wakeLock = null;
    console.log("Wake lock manually released");
  }
}

// => Control buttons in UI
document.getElementById("start-task-btn")?.addEventListener("click", requestWakeLock);
// => Acquire wake lock when task starts
document.getElementById("end-task-btn")?.addEventListener("click", releaseWakeLock);
// => Release when task ends
```

**Key Takeaway**: `navigator.wakeLock.request('screen')` returns a `WakeLockSentinel`. Release it explicitly with `.release()` when the task ends, and handle the `release` event for automatic releases (page hidden).

**Why It Matters**: Screen sleep during navigation, form filling, or recipe reading is a severe UX problem. Users lose progress when the screen sleeps and the OS reclaims focus. Screen Wake Lock is the W3C-standardized solution — now available in all major browsers as Baseline 2025. Unlike older solutions (video loops, canvas animation), Wake Lock carries no performance overhead and cleanly communicates intent to the OS.

---

## Example 48: Wake Lock Management — Release on visibilitychange, Re-acquire When Visible

Wake locks are automatically released when the page becomes hidden (user switches apps or tabs). Re-acquire the lock when the page becomes visible again for continuous active task support.

**Code**:

```javascript
// app.js (continues from Example 47)

let wakeLock = null;
let wakeTaskActive = false;
// => wakeTaskActive: tracks whether the user's task needs wake lock
// => Separate from wakeLock to handle visibility-based re-acquisition

async function requestWakeLockForTask() {
  wakeTaskActive = true;
  // => Mark task as active — triggers re-acquisition on visibility restore
  await acquireWakeLock();
}

async function acquireWakeLock() {
  if (!("wakeLock" in navigator)) return;
  // => Browser doesn't support Wake Lock — skip silently

  try {
    wakeLock = await navigator.wakeLock.request("screen");
    console.log("Wake lock acquired");
    // => Screen stays on

    wakeLock.addEventListener("release", () => {
      // => OS or browser released the lock (page hidden, device screen off)
      console.log("Wake lock released by browser/OS");
      wakeLock = null;
      // => Do not re-acquire here — visibilitychange handles re-acquisition
    });
  } catch (error) {
    console.error("Wake lock failed:", error);
  }
}

// => Listen for page visibility changes
document.addEventListener("visibilitychange", async () => {
  // => document.visibilityState: "visible" or "hidden"
  if (document.visibilityState === "hidden") {
    // => Page is hidden (tab switch, app switch, screen lock)
    // => Wake lock is automatically released by the browser
    // => No action needed — wakeLock.release event handles cleanup
    console.log("Page hidden — wake lock auto-released");
  } else if (document.visibilityState === "visible" && wakeTaskActive) {
    // => Page is visible again AND user's task is still ongoing
    // => Re-acquire the wake lock since it was released while hidden
    console.log("Page visible again — re-acquiring wake lock");
    await acquireWakeLock();
    // => Screen will not sleep again while task is active
  }
});

async function endTask() {
  wakeTaskActive = false;
  // => Mark task as ended — prevents re-acquisition on next visibility change
  if (wakeLock !== null) {
    await wakeLock.release();
    wakeLock = null;
  }
  console.log("Task ended — wake lock released");
}
```

**Key Takeaway**: Track whether a task is active with a boolean flag (`wakeTaskActive`). In the `visibilitychange` handler, re-acquire the wake lock when the page becomes visible again — but only if the task is still ongoing.

**Why It Matters**: Failing to re-acquire the wake lock after page visibility change means the screen sleeps the first time the user checks a message or switches apps, breaking the continuous task experience. The `visibilitychange` pattern is the standard, spec-recommended approach for wake lock lifecycle management. Always use a flag separate from the wake lock reference to track task state — the lock reference being null is not sufficient because it could be null from either explicit release or visibility-change release.

---

## Example 49: File System Access API — showOpenFilePicker and Reading Files

The File System Access API provides native-quality file open dialogs and direct file access. It requires user gesture and is supported in Chrome/Edge; Firefox has experimental support; Safari has limited support.

**Code**:

```javascript
// app.js

async function openTextFile() {
  // => Feature detect: File System Access API not universally supported
  if (!("showOpenFilePicker" in window)) {
    // => Fallback: use traditional <input type="file"> element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.md";
    input.click();
    // => Shows file picker dialog via input element (works in all browsers)
    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      readFileContents(file);
    });
    return;
  }

  try {
    // => showOpenFilePicker() opens the native OS file picker dialog
    // => Must be called from a user gesture (button click, key press)
    // => Returns an array of FileSystemFileHandle objects
    const [fileHandle] = await window.showOpenFilePicker({
      // => types: filter files by MIME type and extension
      types: [
        {
          description: "Text Files",
          // => description: shown in the file picker type filter dropdown
          accept: {
            "text/plain": [".txt"],
            // => MIME type: [".extension"] — filters visible files
            "text/markdown": [".md"],
          },
        },
      ],
      // => multiple: false means only one file can be selected (default)
      multiple: false,
      // => excludeAcceptAllOption: true hides the "All Files" filter option
      excludeAcceptAllOption: false,
    });
    // => fileHandle: FileSystemFileHandle for the selected file

    // => Get the actual File object from the handle
    const file = await fileHandle.getFile();
    // => file: File object (extends Blob) with name, size, type, lastModified

    console.log("Opened file:", file.name, `(${file.size} bytes)`);
    // => Output: "Opened file: document.txt (2048 bytes)"

    // => Read the file contents as text
    const contents = await file.text();
    // => contents: full text of the file as a string

    // => Display contents in the editor
    document.getElementById("editor").textContent = contents;
    // => File contents rendered in editor area
  } catch (error) {
    if (error.name === "AbortError") {
      // => User cancelled the file picker dialog
      console.log("File selection cancelled");
    } else {
      console.error("File open failed:", error);
    }
  }
}
```

**Key Takeaway**: `window.showOpenFilePicker()` returns `FileSystemFileHandle[]`. Call `fileHandle.getFile()` to get the `File` object, then read it with `.text()`, `.arrayBuffer()`, or `.stream()`. Always check for `AbortError` when the user cancels.

**Why It Matters**: The traditional `<input type="file">` approach provides a one-way read of file contents — there's no way to write changes back to the same file without another Save As dialog. The File System Access API enables native-quality document editors in the browser: open a file, edit it, save it back to the same location. This is the foundational capability for desktop-quality PWA productivity apps.

---

## Example 50: Writing Files with File System Access API — showSaveFilePicker and createWritable

`showSaveFilePicker` opens a Save As dialog and returns a writable file handle. Combined with `createWritable()`, it enables in-place file saving — the core of any document editor PWA.

**Code**:

```javascript
// app.js (continues from Example 49)

async function saveFileAs(content) {
  // => Feature detect
  if (!("showSaveFilePicker" in window)) {
    // => Fallback: create a Blob and trigger download
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.txt";
    a.click();
    // => Triggers browser download dialog
    URL.revokeObjectURL(url);
    // => Clean up object URL to prevent memory leak
    return;
  }

  try {
    // => showSaveFilePicker() opens the native Save As dialog
    // => Returns a FileSystemFileHandle for the chosen save location
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: "document.txt",
      // => suggestedName: pre-filled filename in the save dialog
      types: [
        {
          description: "Text Files",
          accept: { "text/plain": [".txt"] },
        },
      ],
    });
    // => fileHandle: FileSystemFileHandle — represents the target save location
    // => File may or may not already exist at this path

    // => createWritable() opens a writable stream to the file
    const writable = await fileHandle.createWritable();
    // => writable: FileSystemWritableFileStream (extends WritableStream)

    // => write() sends content to the file
    await writable.write(content);
    // => content written to the file on disk (not yet committed)

    // => close() flushes and commits the write — file is saved at this point
    await writable.close();
    // => File is now saved to disk at the user-chosen location

    console.log("File saved successfully:", fileHandle.name);
    // => Output: "File saved successfully: document.txt"
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Save cancelled by user");
    } else {
      console.error("File save failed:", error);
    }
  }
}
```

**Key Takeaway**: `showSaveFilePicker()` returns a `FileSystemFileHandle`. Call `fileHandle.createWritable()` to open a writable stream, write with `writable.write(content)`, and commit with `writable.close()`. The write is not finalized until `close()` is called.

**Why It Matters**: The two-step write/close pattern prevents partial writes — if the process crashes during writing, the original file is not corrupted because the write goes to a temporary stream that only replaces the file on `close()`. This transactional behavior is what makes the File System Access API safe for production document editors that must not lose user data.

---

## Group 10: Advanced Manifest Fields

## Example 51: App Shortcuts in the Manifest

App shortcuts create contextual quick-action entries in the app's right-click menu on desktop and long-press menu on Android. They provide instant access to common app destinations.

**Code**:

```json
{
  "name": "My Productivity App",
  "short_name": "ProdApp",
  "start_url": "/",
  "display": "standalone",
  "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" }],
  "shortcuts": [
    {
      "name": "New Task",
      "short_name": "Task",
      "description": "Create a new task immediately",
      "url": "/tasks/new",
      "icons": [
        {
          "src": "/icons/shortcut-new-task.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Today's Schedule",
      "short_name": "Schedule",
      "description": "View today's task schedule",
      "url": "/schedule/today",
      "icons": [
        {
          "src": "/icons/shortcut-schedule.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Settings",
      "short_name": "Settings",
      "url": "/settings"
    }
  ]
}
```

**Key Takeaway**: The `shortcuts` array in the manifest defines up to 4 quick-access links shown in the OS context menu for the installed PWA. Each shortcut needs `name` and `url`; `icons` and `description` enhance the experience.

**Why It Matters**: App shortcuts reduce the steps required to reach common features from 3-4 taps (open app → navigate → find feature) to 1-2 taps (long press icon → tap shortcut). On Android, this matches the UX pattern of native app shortcuts. On Windows, shortcuts appear in the taskbar context menu for pinned PWAs. They are a low-cost, high-impact feature for power users.

---

## Example 52: Protocol Handlers in the Manifest

Protocol handlers let a PWA register as the default handler for custom URL schemes (like `mailto:` for email or `web+yourscheme:`). When the user clicks a link with your protocol, the OS opens your PWA.

**Code**:

```json
{
  "name": "My App",
  "short_name": "MyApp",
  "start_url": "/",
  "display": "standalone",
  "protocol_handlers": [
    {
      "protocol": "web+myapp",
      "url": "/handle?url=%s"
    },
    {
      "protocol": "mailto",
      "url": "/compose?to=%s"
    }
  ]
}
```

Handling the protocol in JavaScript:

```javascript
// app.js — read the protocol payload from the URL

window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  // => Parse query parameters from the URL the manifest mapped the protocol to

  const handledUrl = params.get("url");
  // => handledUrl: the full original URL that triggered the protocol handler
  // => e.g., clicking web+myapp://document/123 → /handle?url=web%2Bmyapp%3A%2F%2Fdocument%2F123

  if (handledUrl) {
    const decoded = decodeURIComponent(handledUrl);
    // => decoded: "web+myapp://document/123"
    console.log("Handling protocol URL:", decoded);
    // => Route to the appropriate feature based on the URL path
    routeProtocolUrl(decoded);
  }
});

function routeProtocolUrl(url) {
  const parsed = new URL(url);
  // => parsed.protocol: "web+myapp:"
  // => parsed.hostname: "document"
  // => parsed.pathname: "/123"
  if (parsed.hostname === "document") {
    navigateTo(`/documents/${parsed.pathname.slice(1)}`);
    // => Open document 123 in the editor
  }
}
```

**Key Takeaway**: The `protocol_handlers` manifest field registers the PWA as the OS handler for specified URL schemes. The `%s` placeholder in `url` is replaced with the encoded protocol URL when activated.

**Why It Matters**: Protocol handlers enable deep integration with the OS link ecosystem. Email clients use `mailto:`, calendar apps use `webcal:`, and custom apps can define `web+yourscheme:` for inter-app linking. This lets other apps, documents, and websites link directly into specific features of your PWA — a level of integration previously only possible with native apps.

---

## Example 53: File Handlers in the Manifest

File handlers let a PWA register as the default app for opening specific file types. When a user double-clicks a file in the file manager, the OS opens your PWA with the file.

**Code**:

```json
{
  "name": "My Text Editor",
  "short_name": "TextEdit",
  "start_url": "/",
  "display": "standalone",
  "file_handlers": [
    {
      "action": "/open-file",
      "accept": {
        "text/plain": [".txt"],
        "text/markdown": [".md", ".markdown"],
        "application/json": [".json"]
      },
      "icons": [
        {
          "src": "/icons/file-handler-icon.png",
          "sizes": "144x144",
          "type": "image/png"
        }
      ],
      "launch_type": "single-client"
    }
  ]
}
```

Reading the launched file in JavaScript:

```javascript
// app.js — handle files launched via the file handler

// => launchQueue is available when the app is launched from a file association
if ("launchQueue" in window) {
  window.launchQueue.setConsumer(async (launchParams) => {
    // => setConsumer: called when the app receives a file launch
    // => launchParams.files: array of FileSystemFileHandle objects

    if (!launchParams.files.length) return;
    // => No files: app launched normally, not via file handler

    for (const fileHandle of launchParams.files) {
      // => fileHandle: FileSystemFileHandle — same as from showOpenFilePicker()
      const file = await fileHandle.getFile();
      // => file: File object — read contents as in Example 49

      const content = await file.text();
      // => content: full text of the launched file

      console.log(`Opened file via file handler: ${file.name}`);
      // => Output: "Opened file via file handler: readme.md"

      // => Open the file in the editor
      document.getElementById("editor").textContent = content;
    }
  });
}
```

**Key Takeaway**: The `file_handlers` manifest field registers file type associations with the OS. JavaScript reads launched files via `window.launchQueue.setConsumer()`, which receives `FileSystemFileHandle` objects.

**Why It Matters**: File handler registration is the feature that makes a PWA feel like a true native app. When "Open with" dialogs include your PWA alongside native apps, users stop distinguishing between web and native. Productivity apps (editors, viewers, converters) benefit most — they become first-class citizens in the OS file ecosystem without App Store distribution.

---

## Example 54: Share Target API — Receiving Shared Content in a PWA

The Share Target API lets a PWA appear in the OS share sheet as a destination. When a user shares from another app, the browser opens the PWA with the shared data.

**Code**:

```json
{
  "name": "My App",
  "short_name": "MyApp",
  "start_url": "/",
  "display": "standalone",
  "share_target": {
    "action": "/share-receiver",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "files",
          "accept": ["image/*", "text/*"]
        }
      ]
    }
  }
}
```

Receiving the share on the server (Next.js API route):

```javascript
// pages/api/share-receiver.js (or app/api/share-receiver/route.js)

export async function POST(request) {
  // => Incoming POST from the share target: multipart/form-data
  const formData = await request.formData();
  // => formData: FormData object with the shared fields

  const title = formData.get("title") || "";
  // => title: page title or app-provided title from the sharer
  const text = formData.get("text") || "";
  // => text: text content being shared
  const url = formData.get("url") || "";
  // => url: URL being shared (e.g., from a browser share)
  const files = formData.getAll("files");
  // => files: array of File objects if files were shared

  console.log("Received share:", { title, text, url, files: files.length });
  // => Output: "Received share: { title: 'Article Title', text: '', url: 'https://...' }"

  // => Process the shared data: save to database, create a new note, etc.
  // => Then redirect to the relevant page in the app
  return Response.redirect("/notes/new?shared=true", 303);
  // => 303 See Other: redirect after POST (PRG pattern)
}
```

**Key Takeaway**: The `share_target` manifest field registers the PWA in the OS share sheet. Shared data arrives as a POST `multipart/form-data` request to the `action` URL. Read it with `request.formData()` on the server.

**Why It Matters**: The Share Target API turns your PWA into a destination for cross-app sharing — the same system behavior that lets you share a photo to WhatsApp or a link to Twitter. Without it, users must manually copy-paste content into your app. With it, your PWA appears alongside native apps in the share sheet on Android, creating a seamless integration that drives usage from other apps.

---

## Example 55: Badging API — setAppBadge and clearAppBadge

The Badging API displays a numeric badge on the PWA's icon in the taskbar or app shelf, similar to the unread count badge on native email or messaging apps. Supported in Chrome and Edge; limited in Firefox.

**Code**:

```javascript
// app.js

// => Feature detect: Badging API supported in Chrome/Edge, not Firefox
if ("setAppBadge" in navigator) {
  console.log("Badging API supported");
  // => Badge can be set programmatically
} else {
  console.log("Badging API not supported — badge will not appear");
  // => Degrade gracefully — app works without badge
}

async function updateBadge(unreadCount) {
  if (!("setAppBadge" in navigator)) return;
  // => Skip if not supported

  if (unreadCount === 0) {
    // => No unread items — remove the badge entirely
    await navigator.clearAppBadge();
    // => Badge removed from app icon in taskbar/dock
    console.log("Badge cleared");
  } else {
    // => Show the unread count as a numeric badge
    await navigator.setAppBadge(unreadCount);
    // => Badge displays the number on the app icon
    // => unreadCount: 5 → shows "5" badge on the icon
    // => unreadCount: 150 → Chrome may show "99+" to avoid overflow
    console.log(`Badge set to ${unreadCount}`);
  }
}

// => Update badge when new messages arrive (via WebSocket, polling, or push)
function onNewMessagesReceived(messages) {
  const unread = messages.filter((m) => !m.read).length;
  // => Count unread messages
  updateBadge(unread);
  // => Badge immediately reflects the new count
}

// => Clear badge when user views their messages
function onMessagesViewed() {
  updateBadge(0);
  // => Badge cleared — user has seen all messages
}

// => Also update badge in the service worker via push notification
// sw.js (separate context)
self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {};
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title, { body: payload.body }),
      // => Show notification AND update badge atomically
      navigator.setAppBadge(payload.unreadCount ?? 1),
      // => Badge updated in SW context (supported in Chrome/Edge)
    ]),
  );
});
```

**Key Takeaway**: Use `navigator.setAppBadge(count)` to show a numeric badge and `navigator.clearAppBadge()` to remove it. Feature-detect before calling and degrade gracefully on unsupported browsers.

**Why It Matters**: The badge is one of the most immediately visible differences between a native app and a web app on the home screen. Unread count badges drive re-engagement — users who see a "3" badge on a messaging app open it. The Badging API brings this re-engagement mechanism to installed PWAs without requiring a push notification, making it appropriate for scenarios where notifications would be intrusive but a visual cue is helpful.

---

## Example 56: Periodic Background Sync — Registering Scheduled Background Updates

Periodic Background Sync lets the browser wake the service worker on a schedule (e.g., every few hours) to refresh content. **Browser support: Chromium-only (Chrome, Edge). Not supported in Firefox or Safari.**

**Code**:

```javascript
// app.js — register periodic sync in the main thread

async function registerPeriodicSync() {
  // => Feature detect: Periodic Background Sync is Chromium-only
  const registration = await navigator.serviceWorker.ready;

  if (!("periodicSync" in registration)) {
    console.log("Periodic Background Sync not supported — Chromium-only feature");
    // => Firefox and Safari fall back to polling when page is open
    startFallbackPolling();
    // => Poll every 30 minutes while tab is active (much less powerful)
    return;
  }

  // => Check permission before registering
  const status = await navigator.permissions.query({
    name: "periodic-background-sync",
    // => Permission name for Periodic Background Sync
  });
  // => status.state: "granted", "denied", or "prompt"

  if (status.state !== "granted") {
    console.log("Periodic Background Sync permission:", status.state);
    // => Chrome grants this automatically for installed PWAs with high engagement
    // => Not granted: use fallback polling
    return;
  }

  // => Register the periodic sync tag
  await registration.periodicSync.register("refresh-news-feed", {
    // => tag: identifies this sync — multiple tags can be registered
    minInterval: 60 * 60 * 1000,
    // => minInterval: minimum interval in milliseconds between syncs
    // => 3600000 ms = 1 hour — browser may run it less frequently
    // => Browser decides actual interval based on battery, usage, engagement
  });

  console.log("Periodic sync registered: refresh-news-feed (min 1 hour)");
  // => Browser will run the 'periodicsync' event at most once per hour
}

function startFallbackPolling() {
  // => Fallback for Firefox/Safari: poll only while tab is open
  setInterval(
    async () => {
      if (navigator.onLine) {
        await refreshNewsFeed();
      }
    },
    30 * 60 * 1000,
  );
  // => Poll every 30 minutes when online — far less reliable than periodic sync
}
```

Service worker periodic sync handler:

```javascript
// sw.js

self.addEventListener("periodicsync", (event) => {
  // => periodicsync fires when the browser runs the scheduled sync
  // => event.tag: identifies which periodic sync triggered this event
  console.log("SW: periodicsync event, tag:", event.tag);

  if (event.tag === "refresh-news-feed") {
    event.waitUntil(
      (async () => {
        // => Fetch fresh news from the API
        const response = await fetch("/api/news-feed");
        const news = await response.json();
        // => news: latest articles array

        // => Cache the fresh news in IndexedDB for offline reading
        const db = await openDatabase();
        await db.put("cached-news", { id: "latest", articles: news, fetchedAt: Date.now() });
        console.log("News feed refreshed:", news.length, "articles cached");
      })(),
    );
  }
});
```

**Key Takeaway**: Register periodic syncs with `registration.periodicSync.register(tag, { minInterval })` and handle the `periodicsync` event in the service worker. Always check `'periodicSync' in registration` and provide a polling fallback for Firefox and Safari.

**Why It Matters**: Periodic Background Sync enables content freshness without requiring the user to have the app open. News readers, weather apps, and sports score apps can pre-fetch content while the device is charging and on Wi-Fi, so the user opens a fully populated app. The browser's intelligence — respecting battery, connectivity, and engagement signals — makes this more efficient than any polling approach.

---

## Example 57: Screenshots in the Manifest — App Store Quality Listings

The `screenshots` manifest field provides app store-quality screenshots shown when the browser displays the app install dialog. High-quality screenshots improve install conversion rates.

**Code**:

```json
{
  "name": "My Productivity App",
  "short_name": "ProdApp",
  "start_url": "/",
  "display": "standalone",
  "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" }],
  "screenshots": [
    {
      "src": "/screenshots/mobile-home.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Home screen with today's tasks and schedule overview"
    },
    {
      "src": "/screenshots/mobile-task.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Task detail view with rich text editor and attachments"
    },
    {
      "src": "/screenshots/desktop-dashboard.png",
      "sizes": "1280x800",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Desktop dashboard with multi-column task management view"
    },
    {
      "src": "/screenshots/desktop-calendar.png",
      "sizes": "1280x800",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Calendar view showing weekly schedule with task integration"
    }
  ]
}
```

**Key Takeaway**: Provide `screenshots` with both `narrow` (mobile, < 1280px wide) and `wide` (desktop) `form_factor` values. Chrome's enhanced install dialog shows these screenshots to help users understand the app before installing.

**Why It Matters**: Chrome's "Richer PWA Install UI" — triggered when screenshots are present — shows an app-store-style dialog with screenshot previews and the app description. Apps with screenshots see 20-30% higher install rates than those without, because users can see what they're installing before committing. The `label` field is also used as alt text for accessibility, making the screenshots useful for screen reader users evaluating the install.
