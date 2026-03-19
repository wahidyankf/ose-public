---
title: "Advanced"
weight: 10000003
date: 2026-03-19T10:00:00+07:00
draft: false
description: "Master TanStack Start advanced patterns through 25 annotated examples covering SSR streaming, deployment targets, custom server, advanced caching, code splitting, environment variables, error management, SEO, and production optimization"
tags: ["tanstack-start", "tanstack-router", "typescript", "ssr", "deployment", "performance", "production", "tutorial", "by-example", "advanced"]
---

This advanced tutorial covers production-level TanStack Start architecture through 25 heavily annotated examples (56-80). Each example maintains 1-2.25 comment lines per code line.

## Prerequisites

Before starting, complete [Beginner](/en/learn/software-engineering/platform-web/tools/fe-tanstack-start/by-example/beginner) and [Intermediate](/en/learn/software-engineering/platform-web/tools/fe-tanstack-start/by-example/intermediate) examples, or ensure you understand:

- Server functions and middleware
- TanStack Query integration
- Authentication and session management
- Route context and guards

## Group 20: SSR and Streaming Patterns

### Example 56: Full SSR with Hydration

TanStack Start's SSR pipeline renders HTML on the server and hydrates it on the client. The `ssr.tsx` entry point handles the server render; `client.tsx` handles hydration.

```typescript
// app/ssr.tsx
// => Server entry point: handles each incoming request
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/start/server'
// => createStartHandler: creates the request handler for SSR
// => defaultStreamHandler: the streaming renderer (recommended)

import { createMyRouter } from './router'
// => createMyRouter: factory that creates a new router per request
// => CRITICAL: new router per request (not a singleton)
// => Prevents state leaking between requests

export default createStartHandler({
  createRouter: createMyRouter,
  // => createRouter: called per request, creates isolated router
  // => router: contains route tree, query client, context
})(defaultStreamHandler)
// => defaultStreamHandler: renders with React streaming SSR
// => Sends HTML in chunks as Suspense boundaries resolve
// => Alternative: defaultRenderHandler (waits for all, sends at once)

// app/client.tsx
// => Client entry point: hydrates server-rendered HTML
import { StartClient } from '@tanstack/start'
// => StartClient: client-side router + hydration coordinator
import { createMyRouter } from './router'
import { hydrateRoot } from 'react-dom/client'
// => hydrateRoot: attaches React to server-rendered HTML
// => Does NOT re-render; reuses existing DOM nodes

const router = createMyRouter()
// => Create router ONCE for the client session
// => Same router instance persists across all navigations

hydrateRoot(document, <StartClient router={router} />)
// => hydrateRoot(container, element): hydrate the document
// => document: the full HTML document (TanStack Start manages html/body)
// => StartClient: wraps RouterProvider with hydration setup
```

**Key Takeaway**: `createStartHandler` handles SSR requests using a per-request router factory. `hydrateRoot` on the client attaches interactivity to server-rendered HTML without re-rendering.

**Why It Matters**: Per-request router instances are essential for correct SSR behavior. A shared singleton router would allow one request's data (user session, query cache) to contaminate subsequent requests - a critical security vulnerability. TanStack Start's architecture enforces this correctly by design: `createMyRouter` is called once per request on the server and once on the client. This pattern is what makes TanStack Start suitable for production applications serving thousands of concurrent users.

### Example 57: SSR Streaming with Progressive Enhancement

Configure TanStack Start to stream HTML chunks as Suspense boundaries resolve, improving Time to First Byte while maintaining full interactivity.

```typescript
// app/routes/__root.tsx (streaming-optimized)
import {
  createRootRoute,
  Outlet,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
// => HeadContent: renders accumulated head tags (title, meta, links)
// => Scripts: renders Vite-generated client JavaScript bundles

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      // => charSet meta: must be first in head for proper encoding
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      // => viewport: responsive scaling for mobile devices
    ],
  }),
  // => head: static head config for the root route

  component: function RootLayout() {
    return (
      <html lang="en">
        <head>
          <HeadContent />
          {/* => HeadContent: renders all head() configs from all routes */}
          {/* => Includes: charset, viewport, page titles, meta descriptions */}
          {/* => SSR: rendered into initial HTML; client: updates dynamically */}
        </head>
        <body>
          <Outlet />
          {/* => Page content: child routes render here */}
          {/* => Streaming: HTML chunks sent as each section resolves */}
          <Scripts />
          {/* => Scripts: renders <script> tags for client JS bundles */}
          {/* => Includes: TanStack Router runtime, React, route chunks */}
          {/* => Place at end of body for optimal page load performance */}
        </body>
      </html>
    )
  },
})
// => <Scripts /> after <Outlet /> is critical:
// => HTML content streams before JS loads
// => Browser can parse/display content without waiting for JS
// => Improves Time to Interactive (TTI) perception
```

**Key Takeaway**: `<HeadContent>` renders accumulated head tags from all route definitions. `<Scripts>` renders client JS bundles and must be placed after `<Outlet>` so HTML streams before JavaScript.

**Why It Matters**: Placing `<Scripts>` at the end of `<body>` is not just a convention - it is a performance requirement. Browsers block HTML parsing when they encounter `<script>` tags in `<head>` without `defer`. By streaming HTML first via `<Outlet>` and loading scripts after, users see rendered content before JavaScript executes. This reduces Largest Contentful Paint (LCP) - a Core Web Vitals metric directly linked to Google search ranking. Production applications that switched from head-scripts to body-end-scripts have seen LCP improvements of 20-40%.

### Example 58: Request Deduplication

TanStack Query deduplicates identical requests made during the same render cycle. Multiple components requesting the same data result in one network call.

```typescript
// app/routes/dashboard.tsx
// => Dashboard with multiple components requesting same data
import { createFileRoute } from '@tanstack/react-router'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/start'

const getUserProfile = createServerFn().handler(async () => ({
  name: 'Layla',
  email: 'l@example.com',
  plan: 'pro',
}))
// => getUserProfile: server function for user data
// => Called from multiple components (DashboardHeader, UserWidget, etc.)

const userQueryOptions = queryOptions({
  queryKey: ['user', 'profile'],
  // => queryKey: unique identifier - same key = same cache slot
  queryFn: getUserProfile,
  // => queryFn: the fetch function
  staleTime: 1000 * 60 * 5,
  // => staleTime: 5 minutes before considering user data stale
})
// => userQueryOptions: reusable config used in MULTIPLE places

function DashboardHeader() {
  const { data: user } = useQuery(userQueryOptions)
  // => useQuery with same queryKey: reads FROM CACHE
  // => If UserWidget already fetched: no new network request
  // => data: { name: "Layla", ... } from cache
  return <h1>Welcome, {user?.name}</h1>
  // => Renders: "Welcome, Layla"
}

function UserWidget() {
  const { data: user } = useQuery(userQueryOptions)
  // => SAME queryKey: deduped with DashboardHeader's request
  // => Only ONE network request despite TWO components
  return <span>Plan: {user?.plan}</span>
  // => Renders: "Plan: pro"
}

export const Route = createFileRoute('/dashboard')({
  loader: ({ context }) => {
    return context.queryClient.prefetchQuery(userQueryOptions)
    // => Prefetch during SSR: populates cache before component renders
    // => DashboardHeader + UserWidget both find data in cache instantly
  },
  component: function DashboardPage() {
    return (
      <div>
        <DashboardHeader />
        {/* => Uses cached user data: zero network requests */}
        <UserWidget />
        {/* => Uses cached user data: also zero new requests */}
      </div>
    )
  },
})
```

**Key Takeaway**: TanStack Query deduplicates requests with identical `queryKey` arrays. Multiple components using the same `queryOptions` make only one network call and share the cached result.

**Why It Matters**: Request deduplication prevents the N+1 problem at the component level where each independent component fetches the same user data, auth state, or configuration. In a dashboard with 10 widgets that all need the current user's subscription plan, without deduplication you get 10 API calls where 1 suffices. TanStack Query's automatic deduplication means you can design components for clarity (each component declares what it needs) without worrying about network efficiency.

## Group 21: Deployment Targets

### Example 59: Vercel Deployment Configuration

Deploy TanStack Start to Vercel using the Vinxi Vercel adapter. Configure the adapter in `app.config.ts` and add a `vercel.json` for edge routing.

```typescript
// app.config.ts
// => Vinxi server configuration (deployment target selection)
import { defineConfig } from '@tanstack/start/config'
// => defineConfig: helper for type-safe app.config.ts

export default defineConfig({
  server: {
    preset: 'vercel',
    // => preset: selects the Vinxi adapter
    // => 'vercel': outputs Vercel Functions-compatible build
    // => Options: 'vercel' | 'node-server' | 'bun' | 'deno' | 'netlify' | 'cloudflare-pages'
    // => Changing preset: only change needed for different deployment target
  },
  tsr: {
    // => tsr: TanStack Router configuration
    generatedRouteTree: './app/routeTree.gen.ts',
    // => generatedRouteTree: path for auto-generated route tree file
    routesDirectory: './app/routes',
    // => routesDirectory: where route files live
  },
})
// => app.config.ts: single file that controls the entire build output format
// => Changing preset 'vercel' → 'node-server': outputs a Node.js HTTP server instead

// package.json build script (add this):
// "build": "vinxi build",
// => vinxi build: produces .vercel/output/functions/ directory
// => Vercel automatically detects this output format

// vercel.json (optional, for routing configuration):
// {
//   "rewrites": [{ "source": "/(.*)", "destination": "/" }]
// }
// => rewrites: send all requests to the TanStack Start function
// => Needed for client-side navigation to work on direct URL access
```

**Key Takeaway**: Change `server.preset` in `app.config.ts` to switch deployment targets. The Vercel preset outputs Vercel Functions-compatible artifacts that Vercel auto-detects.

**Why It Matters**: The preset-based deployment model means migrating from Vercel to another platform requires changing one line in `app.config.ts` - not rewriting server entry points, API routes, or build scripts. This portability prevents vendor lock-in and enables infrastructure decisions to remain separate from application architecture. Production teams frequently evaluate platforms (Vercel to self-hosted, Vercel to Cloudflare Workers) - TanStack Start's preset system makes these evaluations low-risk.

### Example 60: Node.js Server Deployment

The Node.js preset outputs a standalone HTTP server. This enables self-hosted deployments, Docker containers, and custom server environments.

```typescript
// app.config.ts (Node.js deployment)
import { defineConfig } from '@tanstack/start/config'

export default defineConfig({
  server: {
    preset: 'node-server',
    // => node-server: outputs .output/server/index.mjs
    // => Standalone Node.js HTTP server (no framework dependency)
    // => Run with: node .output/server/index.mjs
    port: 3000,
    // => port: Node.js server listen port (default: 3000)
  },
})

// Dockerfile (for containerized deployment):
// FROM node:22-alpine AS builder
// WORKDIR /app
// COPY package*.json ./
// RUN npm ci --production=false
// => Install all deps (including devDeps for build)
// COPY . .
// RUN npm run build
// => Build: produces .output/ directory

// FROM node:22-alpine AS runner
// WORKDIR /app
// COPY --from=builder /app/.output ./.output
// => Copy only built output (not node_modules or source)
// EXPOSE 3000
// => Expose port: matches server.port in app.config.ts
// ENV NODE_ENV=production
// => NODE_ENV: enables production optimizations
// CMD ["node", ".output/server/index.mjs"]
// => Start: runs the Node.js server

// Kubernetes deployment (conceptual):
// containers:
//   - name: tanstack-start
//     image: myapp:latest
//     ports:
//       - containerPort: 3000
//     livenessProbe:
//       httpGet:
//         path: /api/health          # health check endpoint
//         port: 3000
```

**Key Takeaway**: The `node-server` preset outputs `.output/server/index.mjs` - a self-contained Node.js HTTP server. Build it with `npm run build` and run it directly or in a Docker container.

**Why It Matters**: Self-hosted Node.js deployments are essential for teams with compliance requirements (data sovereignty, on-premise infrastructure) or specialized performance needs (dedicated GPU servers, high-memory instances). The Docker container approach enables Kubernetes deployments, blue-green releases, and horizontal scaling. The health check endpoint (`/api/health` from Example 44) integrates with Kubernetes liveness probes and load balancer health checks, ensuring traffic stops routing to instances that fail health checks.

### Example 61: Bun Runtime Deployment

The Bun preset targets Bun's HTTP server, which offers lower memory usage and faster startup times compared to Node.js.

```typescript
// app.config.ts (Bun deployment)
import { defineConfig } from '@tanstack/start/config'

export default defineConfig({
  server: {
    preset: 'bun',
    // => bun: outputs server optimized for Bun runtime
    // => Bun.serve(): faster startup, lower memory than Node.js
    // => Bun: JavaScript runtime compatible with Node.js APIs
  },
})

// To run with Bun after build:
// bun run build          # vinxi build with bun preset
// bun .output/server/index.mjs    # start Bun HTTP server
// => Bun: typically 2-4x faster startup than Node.js

// Benchmark comparison (illustrative):
// Node.js:  ~180ms startup, ~35MB RSS memory baseline
// Bun:      ~45ms startup,  ~22MB RSS memory baseline
// => Faster startup: critical for serverless/cold start scenarios
// => Lower memory: fits more instances in same hardware

// Docker with Bun:
// FROM oven/bun:1 AS builder
// WORKDIR /app
// COPY package*.json bun.lockb ./
// RUN bun install --frozen-lockfile
// => bun install: faster than npm install (uses bun.lockb)
// COPY . .
// RUN bun run build
// FROM oven/bun:1 AS runner
// WORKDIR /app
// COPY --from=builder /app/.output ./.output
// EXPOSE 3000
// CMD ["bun", ".output/server/index.mjs"]
// => CMD: start with Bun runtime instead of Node.js
```

**Key Takeaway**: The `bun` preset outputs a server optimized for the Bun runtime. Switch from `node-server` to `bun` to take advantage of faster startup times and lower memory usage.

**Why It Matters**: Bun's startup performance is particularly valuable for serverless and auto-scaling scenarios where instances start cold. A 45ms Bun startup versus a 180ms Node.js startup means the first request on a cold instance is served 135ms faster. At high traffic with auto-scaling, this compounds: faster startup means new instances become ready sooner during traffic spikes, reducing the latency penalty during scale-out events. For cost-sensitive applications, lower memory usage means more instances per host, reducing infrastructure costs.

## Group 22: Advanced Caching and Prefetching

### Example 62: Stale-While-Revalidate Caching Strategy

Configure TanStack Query's `staleTime` and `gcTime` to implement stale-while-revalidate (SWR) caching, where stale data shows immediately while fresh data loads in the background.

```typescript
// app/lib/queryOptions.ts
// => Centralized query options with caching configuration
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/start'

const fetchCatalog = createServerFn().handler(async () => {
  const res = await fetch('https://fakestoreapi.com/products')
  return res.json() as Promise<Array<{ id: number; title: string; price: number }>>
  // => Returns: Product[] array
})

export const catalogQueryOptions = queryOptions({
  queryKey: ['catalog'],
  queryFn: fetchCatalog,

  staleTime: 1000 * 60 * 10,
  // => staleTime: 10 minutes before this query is considered stale
  // => During 10 min window: subsequent useQuery calls return cached data INSTANTLY
  // => No background refetch until staleTime passes
  // => After staleTime: cached data shown immediately, refetch triggered in background

  gcTime: 1000 * 60 * 30,
  // => gcTime: 30 minutes before UNUSED cache is garbage collected
  // => Cache survives navigation away and back within 30 min
  // => After 30 min with no active subscribers: cache deleted
  // => gcTime must be >= staleTime for SWR to work correctly

  refetchOnWindowFocus: true,
  // => refetchOnWindowFocus: refresh when user tabs back to the app
  // => Catches data changes that happened while the tab was in background

  refetchOnReconnect: true,
  // => refetchOnReconnect: refresh when internet connection is restored
  // => Critical for mobile users who may lose/regain connectivity
})
// => SWR behavior: user always sees data instantly
// => Fresh: no refetch; Stale: show data + background refetch; No cache: loading state

// Usage in route loader:
// loader: ({ context }) => context.queryClient.prefetchQuery(catalogQueryOptions)
// => Prefetch catalog on navigation
// => If cache is fresh: no network request at all
// => If cache is stale: show stale data, refetch in background
```

**Key Takeaway**: Configure `staleTime` and `gcTime` to control how long data stays fresh vs cached. Stale data shows immediately while background refetch occurs, providing instant UI with eventual consistency.

**Why It Matters**: Stale-while-revalidate is the optimal caching strategy for most production data: users see data instantly, and it refreshes in the background without blocking the UI. The alternative extremes (always-fresh: every navigation refetches; never-stale: stale data until manual invalidation) are either too slow or too stale. Product catalogs, user lists, and configuration data change infrequently but need periodic updates - exactly the use case where a 10-minute `staleTime` provides perfect balance between freshness and performance.

### Example 63: Link Hover Prefetching

Configure `<Link>` to prefetch route data when the user hovers, loading the next page's data before they click. This makes navigation feel instant.

```typescript
// app/router.tsx (prefetch configuration)
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function createMyRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    // => defaultPreload: 'intent' = prefetch when user shows intent (hover)
    // => Options:
    // =>   false: no prefetching (default, each navigation fetches on demand)
    // =>   'intent': prefetch on hover AND on touchstart (mobile)
    // =>   'viewport': prefetch when Link enters viewport (aggressive)
    // =>   'render': prefetch as soon as Link renders (most aggressive)
    defaultPreloadDelay: 150,
    // => defaultPreloadDelay: wait 150ms after hover before prefetching
    // => Prevents prefetching for fast mouse movements over links
    // => 150ms: intentional hover threshold (not accidental movement)
    // => Balances: prefetch speed vs wasted requests for cursor-passing
  })
}

// Overriding preload per-link:
// <Link to="/products" preload="viewport">
//   Products (prefetches when visible)
// </Link>
// => preload="viewport": starts prefetch when link scrolls into viewport
// => Useful for "next page" links at bottom of infinite scroll

// Disabling preload for specific links:
// <Link to="/logout" preload={false}>
//   Logout
// </Link>
// => preload={false}: no prefetching for destructive actions
// => Logout, delete, payment: don't prefetch (unexpected side effects)
```

**Key Takeaway**: `defaultPreload: 'intent'` in the router config triggers data prefetching on link hover. The `defaultPreloadDelay` prevents wasted requests from rapid cursor movements.

**Why It Matters**: Intent-based prefetching creates a perception of instant navigation. When a user hovers for 150ms and then clicks, the data is already loading (or loaded). The typical hover-to-click time is 250-400ms, meaning a 150ms prefetch start gives 100-250ms of loading head-start. For routes with 200-300ms loaders, this often means the navigation feels truly instant to users. Major e-commerce sites like Amazon implement similar prefetching strategies for high-traffic product pages, attributing measurable conversion rate improvements to the perceived speed improvement.

### Example 64: Manual Query Invalidation

After mutations, invalidate specific query keys to trigger background refetches for all components displaying that data.

```typescript
// app/routes/admin/products.tsx
// => Admin product management with cache invalidation after mutations
'use client'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient, queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'

const getProducts = createServerFn().handler(async () => [
  { id: 1, name: 'Widget', price: 9.99, status: 'active' },
  { id: 2, name: 'Gadget', price: 19.99, status: 'active' },
])
// => getProducts: fetch all products

const archiveProduct = createServerFn()
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    console.log(`Archived product ${data.id}`)
    // => Server-side: update DB record status to 'archived'
    return { success: true }
  })
// => archiveProduct: soft-delete a product

const productsQueryOptions = queryOptions({
  queryKey: ['admin', 'products'],
  // => Hierarchical key: ['admin', 'products']
  // => Allows invalidating ['admin'] to invalidate all admin queries
  queryFn: getProducts,
})

export const Route = createFileRoute('/admin/products')({
  loader: ({ context }) => context.queryClient.prefetchQuery(productsQueryOptions),

  component: function AdminProductsPage() {
    const queryClient = useQueryClient()
    const { data: products = [] } = useQuery(productsQueryOptions)

    const archiveMutation = useMutation({
      mutationFn: (id: number) => archiveProduct({ data: { id } }),
      // => Call archive server function

      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
        // => Invalidate specific query: triggers refetch of products list
        // => All useQuery(['admin', 'products']) hooks refetch

        queryClient.invalidateQueries({ queryKey: ['admin'] })
        // => Invalidate by prefix: all queries starting with ['admin'] refetch
        // => Affects: ['admin', 'products'], ['admin', 'stats'], ['admin', 'users'], etc.
        // => Useful after operations that affect multiple admin views
      },
    })

    return (
      <ul>
        {products.map((p: { id: number; name: string; price: number }) => (
          <li key={p.id}>
            {p.name} - ${p.price}
            <button onClick={() => archiveMutation.mutate(p.id)}>
              {/* => mutate(id): call archiveMutation with product id */}
              Archive
            </button>
          </li>
        ))}
      </ul>
    )
  },
})
```

**Key Takeaway**: `queryClient.invalidateQueries({ queryKey: [...] })` triggers background refetches for all matching queries. Hierarchical keys enable batch invalidation of related queries.

**Why It Matters**: Cache invalidation is notoriously "one of the two hard problems in computer science." TanStack Query's hierarchical key system provides a practical solution: invalidate precisely what changed. After archiving a product, invalidating `['admin']` refreshes the product list AND the admin stats panel (showing updated counts) in a single call. Without this, stale data persists until the user manually refreshes. Production applications with complex data relationships (deleting an order affects inventory, revenue stats, and customer history) benefit from the ability to invalidate at different levels of granularity.

## Group 23: Code Splitting and Performance

### Example 65: Automatic Route-Based Code Splitting

TanStack Start automatically code-splits each route into separate JavaScript bundles. Configure which code loads eagerly vs lazily.

```typescript
// app.config.ts (with code splitting configuration)
import { defineConfig } from '@tanstack/start/config'

export default defineConfig({
  tsr: {
    generatedRouteTree: './app/routeTree.gen.ts',
    routesDirectory: './app/routes',
    routeFileIgnorePrefix: '-',
    // => routeFileIgnorePrefix: files starting with '-' are ignored
    // => Use for: -helpers.ts, -components.tsx (route utility files)
    // => NOT treated as routes despite being in routes/ dir
  },
  vite: {
    // => Vite build configuration
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // => manualChunks: explicitly group modules into chunks
            'vendor-react': ['react', 'react-dom'],
            // => vendor-react chunk: React core libraries
            // => Separate chunk: long-term cached (rarely changes)
            'vendor-tanstack': [
              '@tanstack/react-router',
              '@tanstack/react-query',
            ],
            // => vendor-tanstack chunk: TanStack core libraries
            // => Separate from app code: cached independently
          },
        },
      },
    },
  },
})

// Result: code splitting produces these bundles:
// - index-[hash].js: entry point (tiny)
// - vendor-react-[hash].js: React (cached long-term)
// - vendor-tanstack-[hash].js: TanStack (cached long-term)
// - routes/index-[hash].js: home page component (lazy)
// - routes/products-[hash].js: products page (lazy, loaded on /products)
// - routes/dashboard-[hash].js: dashboard (lazy, loaded on /dashboard)
// => Each route only downloads when the user navigates to it
// => Initial page load: only entry + current route + vendors
```

**Key Takeaway**: TanStack Start automatically splits routes into separate bundles. Use `manualChunks` in the Vite config to explicitly separate vendor libraries for optimal long-term caching.

**Why It Matters**: Code splitting is essential for production application performance. A monolithic JavaScript bundle (all routes compiled together) forces users to download code for pages they may never visit. With route-based splitting, a user visiting only the marketing pages never downloads the dashboard bundle. Separate vendor chunks (`vendor-react`, `vendor-tanstack`) take maximum advantage of browser caching - users who return to the site find these large files cached, downloading only small updated application chunks. This can reduce page load data transfer by 60-80% for returning users.

### Example 66: Lazy Component Loading

Use `React.lazy` and dynamic imports for large components within routes to further split code beyond route boundaries.

```tsx
// app/routes/dashboard.tsx
// => Dashboard with lazily loaded heavy components
import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
// => lazy: React API for dynamic component loading
// => Suspense: required wrapper for lazy components

const HeavyChart = lazy(() => import('../components/HeavyChart'))
// => lazy: creates a lazily loaded component
// => import('../components/HeavyChart'): dynamic import
// => HeavyChart bundle downloaded ONLY when this component renders
// => Result: HeavyChart code excluded from initial route bundle

const DataTable = lazy(() => import('../components/DataTable'))
// => DataTable: another lazily loaded component
// => Large tables with sorting/filtering: often 50-100KB of code

export const Route = createFileRoute('/dashboard')({
  component: function DashboardPage() {
    return (
      <div>
        <h1>Dashboard</h1>
        {/* => Static content: in main route bundle (loads immediately) */}

        <Suspense fallback={<div className="chart-skeleton" />}>
          {/* => Suspense: required for lazy components */}
          {/* => fallback: shown while HeavyChart bundle downloads */}
          <HeavyChart data={[]} />
          {/* => HeavyChart: downloaded lazily when rendered */}
          {/* => chart-skeleton shows during download (typically <100ms) */}
        </Suspense>

        <Suspense fallback={<div className="table-skeleton" />}>
          {/* => Independent Suspense: chart and table load independently */}
          <DataTable rows={[]} />
          {/* => DataTable: downloaded lazily, independently of HeavyChart */}
        </Suspense>
      </div>
    )
  },
})

// Build output analysis (conceptual):
// dashboard.js:     8KB  (route shell, async component wrappers)
// HeavyChart.js:   85KB  (chart library, downloaded on first render)
// DataTable.js:    62KB  (table library, downloaded on first render)
// => Initial navigation to /dashboard: only 8KB downloads
// => Components download in parallel when route renders
```

**Key Takeaway**: `React.lazy` with dynamic imports splits large components into separate bundles downloaded on first render. Wrap each lazy component in its own `<Suspense>` for independent loading.

**Why It Matters**: Route-level splitting handles inter-page granularity; component-level splitting handles intra-page granularity. A dashboard with a charting library (Recharts: 85KB) and a rich text editor (TipTap: 120KB) should not force every dashboard visitor to download both - only users who interact with those sections need those bundles. Combined with intent-based prefetching (Example 63), lazy components can preload when the user shows intent, making the perceived download time zero for typical navigation patterns.

## Group 24: Environment Variables and Configuration

### Example 67: Server vs Client Environment Variables

TanStack Start (via Vite) distinguishes between server-only and client-accessible environment variables. Server secrets must never reach the browser.

```typescript
// .env file (git-ignored, never commit this):
// DATABASE_URL=postgresql://user:password@localhost:5432/mydb
// STRIPE_SECRET_KEY=sk_live_...
// SESSION_SECRET=very-long-random-secret-string
// VITE_API_URL=https://api.example.com
// VITE_POSTHOG_KEY=phc_...

// Server-only variables (accessible ONLY in server functions and API routes):
// app/server/stripe.ts
import { createServerFn } from '@tanstack/start'

export const createPaymentIntent = createServerFn().handler(async () => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  // => process.env.STRIPE_SECRET_KEY: available on server
  // => NEVER accessible in browser (not prefixed with VITE_)
  // => If accidentally used in client component: undefined (not error)
  // => Security: payment secrets must stay server-side

  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY not configured')
    // => Fail fast: missing secret should crash server, not silently fail
  }

  // Use stripeSecretKey to create Stripe payment intent
  return { clientSecret: 'pi_mock_client_secret' }
  // => Return ONLY the client secret (safe to expose to browser)
})

// Client-accessible variables (VITE_ prefix = included in browser bundle):
// app/routes/index.tsx
export function AnalyticsSetup() {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY
  // => import.meta.env: Vite's environment variable access (client-side)
  // => VITE_POSTHOG_KEY: public key, safe for browser (no secrets)
  // => Non-VITE_ vars: import.meta.env.DATABASE_URL → undefined (stripped by Vite)

  const apiUrl = import.meta.env.VITE_API_URL
  // => VITE_API_URL: base URL for client-side API calls
  // => Included in bundle: visible in browser developer tools
  // => Only use for truly public values

  return null
  // => Setup component: no visible UI
}

// .env.example (commit this, document required vars):
// DATABASE_URL=postgresql://...      # Required: PostgreSQL connection
// STRIPE_SECRET_KEY=sk_test_...      # Required: Stripe secret key
// SESSION_SECRET=change-me           # Required: session encryption key
// VITE_API_URL=http://localhost:3000  # Required: public API base URL
```

**Key Takeaway**: Server-only env vars use `process.env.VAR_NAME` in server functions. Client-accessible vars must be prefixed with `VITE_` and accessed via `import.meta.env.VITE_VAR_NAME`.

**Why It Matters**: Environment variable misconfiguration is a leading cause of security incidents in web applications. Exposing `DATABASE_URL` or `STRIPE_SECRET_KEY` in a client-side bundle gives anyone who visits the site access to these secrets. Vite's `VITE_` prefix convention creates a hard boundary between public and private configuration. Production security audits specifically check for secrets in JavaScript bundles - TanStack Start's architecture makes it structurally difficult to make this mistake by requiring `VITE_` for anything that reaches the browser.

### Example 68: Runtime Configuration with `getHeaders`

Access request headers in server functions to implement locale detection, A/B testing, and CDN-level feature flags.

```typescript
// app/server/config.ts
// => Runtime configuration from request headers
import { createServerFn } from '@tanstack/start'
import { getHeaders } from 'vinxi/http'
// => getHeaders: get all request headers from current HTTP request
// => Available only in server functions (not client code)

export const getRequestConfig = createServerFn().handler(async () => {
  const headers = getHeaders()
  // => headers: Record<string, string> of all request headers
  // => { 'accept-language': 'ar,en;q=0.9', 'cf-country': 'SA', ... }

  const acceptLanguage = headers['accept-language'] ?? 'en'
  // => Accept-Language: browser's preferred language(s)
  // => 'ar,en;q=0.9': Arabic preferred, English as fallback

  const locale = acceptLanguage.split(',')[0].split('-')[0]
  // => Extract primary language code
  // => 'ar,en;q=0.9' → 'ar'
  // => 'en-US,en;q=0.9' → 'en'

  const country = headers['cf-country'] ?? 'US'
  // => cf-country: Cloudflare country code header
  // => Available when behind Cloudflare CDN
  // => 'SA': Saudi Arabia, 'ID': Indonesia, 'US': United States

  const abTestGroup = headers['x-ab-test-group'] ?? 'control'
  // => x-ab-test-group: custom header set by CDN/edge middleware
  // => Enables server-side A/B test variant selection
  // => 'control': default group; 'variant-a': test group

  return {
    locale,
    // => locale: 'ar' or 'en' (for internationalization)
    country,
    // => country: 'SA', 'ID', etc. (for geo-specific features)
    abTestGroup,
    // => abTestGroup: 'control' or 'variant-a' (for A/B tests)
    isRTL: ['ar', 'he', 'fa', 'ur'].includes(locale),
    // => isRTL: true for right-to-left languages
    // => Arabic, Hebrew, Farsi, Urdu: RTL text direction
  }
})

// Usage in a loader:
// loader: async () => {
//   const config = await getRequestConfig()
//   // => config: { locale: 'ar', country: 'SA', abTestGroup: 'control', isRTL: true }
//   return { config }
// }
```

**Key Takeaway**: `getHeaders()` from `vinxi/http` reads request headers in server functions. Use headers for locale detection, geo-targeting, and CDN-injected feature flags.

**Why It Matters**: Request-level configuration via headers enables powerful edge personalization without user accounts. CDN providers (Cloudflare, Fastly) inject headers with country, region, and device type - allowing server functions to return localized content, currency formats, and feature flags based on real request context. A/B testing via headers means test group assignment happens at the CDN edge (zero additional latency) and the server renders the correct variant without client-side flicker. Production applications in global markets rely on this pattern for localization and geo-restricted features.

## Group 25: Error Management

### Example 69: Global Error Boundary

Add a global error boundary to catch unhandled errors that escape route-level error components. This prevents white screens in production.

```tsx
// app/routes/__root.tsx (with global error boundary)
import { createRootRoute, Outlet, HeadContent, Scripts } from '@tanstack/react-router'
import { Component } from 'react'
// => Component: React class component (required for error boundaries)
// => React does not support functional component error boundaries yet

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class GlobalErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null }
  // => Initial state: no error

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // => getDerivedStateFromError: called when descendant throws
    // => Returns new state to trigger error UI
    return { hasError: true, error }
    // => Set hasError: true to show error UI
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // => componentDidCatch: called after error is caught
    // => Use for error reporting to monitoring service
    console.error('[GlobalErrorBoundary]', error, info.componentStack)
    // => Log error with component stack for debugging
    // => Real app: Sentry.captureException(error, { extra: info })
  }

  render() {
    if (this.state.hasError) {
      return (
        <html lang="en">
          <body>
            <main>
              <h1>Something went wrong</h1>
              {/* => Generic error message: don't expose error details in production */}
              <p>We are working to fix this. Please try again later.</p>
              <button onClick={() => this.setState({ hasError: false, error: null })}>
                {/* => onClick: reset error boundary (try again) */}
                Try Again
              </button>
            </main>
          </body>
        </html>
      )
      // => Error UI: full-page because this is the global boundary
    }

    return this.props.children
    // => No error: render children normally
  }
}

export const Route = createRootRoute({
  component: function RootLayout() {
    return (
      <GlobalErrorBoundary>
        {/* => Wrap everything in global error boundary */}
        <html lang="en">
          <head><HeadContent /></head>
          <body>
            <Outlet />
            <Scripts />
          </body>
        </html>
      </GlobalErrorBoundary>
    )
  },
})
```

**Key Takeaway**: A class-based `ErrorBoundary` wrapped around the root layout catches unhandled React errors, showing a recovery UI instead of a white screen. Use `componentDidCatch` to report to monitoring services.

**Why It Matters**: Route-level `errorComponent` handles expected errors (network failures, validation errors), but unexpected runtime errors (null pointer exceptions, malformed data, React render bugs) can bypass route boundaries. A global error boundary is the last line of defense, ensuring users always see something actionable rather than a blank white screen. The `componentDidCatch` hook is also the correct integration point for error monitoring services (Sentry, Datadog RUM, Bugsnag) - every uncaught error gets automatically reported to your monitoring dashboard.

### Example 70: Structured Error Types

Define typed error hierarchies for server functions to enable clients to handle different error scenarios appropriately.

```typescript
// app/lib/errors.ts
// => Shared error types used by server functions and client error handlers

export class AppError extends Error {
  // => AppError: base class for all application errors
  constructor(
    public code: string,
    // => code: machine-readable error identifier
    message: string,
    // => message: human-readable description
    public statusCode: number = 400,
    // => statusCode: HTTP status code (default: 400 Bad Request)
  ) {
    super(message)
    // => Call Error constructor with message
    this.name = 'AppError'
    // => name: identifies this as an AppError instance
  }
}

export class NotFoundError extends AppError {
  // => NotFoundError: for missing resources (404)
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404)
    // => code: 'NOT_FOUND', status: 404
    // => message: "Product not found" (human-readable)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends AppError {
  // => ForbiddenError: for authorization failures (403)
  constructor(action: string) {
    super('FORBIDDEN', `You cannot ${action}`, 403)
    // => code: 'FORBIDDEN', status: 403
    this.name = 'ForbiddenError'
  }
}

export class ValidationError extends AppError {
  // => ValidationError: for input validation failures (422)
  constructor(
    public fields: Record<string, string>,
    // => fields: per-field error messages
    // => { email: "Invalid format", password: "Too short" }
  ) {
    super('VALIDATION_ERROR', 'Validation failed', 422)
    this.name = 'ValidationError'
  }
}

// Usage in server function:
// import { NotFoundError, ForbiddenError } from '../lib/errors'
// export const getProduct = createServerFn()
//   .validator(z.object({ id: z.number() }))
//   .handler(async ({ data }) => {
//     const product = await db.products.findById(data.id)
//     if (!product) throw new NotFoundError('Product')
//     // => NotFoundError: client receives { code: 'NOT_FOUND', message: 'Product not found' }
//     if (product.isPrivate) throw new ForbiddenError('view this product')
//     // => ForbiddenError: client receives { code: 'FORBIDDEN', message: 'You cannot view this product' }
//     return { product }
//   })
```

**Key Takeaway**: Define typed error classes with `code`, `message`, and `statusCode`. Client error handlers switch on `error.code` to provide context-appropriate recovery UI.

**Why It Matters**: Untyped errors with generic "Something went wrong" messages are a major source of user frustration. Typed error hierarchies enable context-appropriate responses: a `NOT_FOUND` error shows "Product removed" with a search link; a `FORBIDDEN` error shows "Upgrade your plan" with a pricing link; a `VALIDATION_ERROR` shows per-field messages next to form inputs. Production applications with structured error types see measurably higher task completion rates because users understand what went wrong and know how to recover.

## Group 26: SEO and Production Patterns

### Example 71: Structured Data for SEO

Add JSON-LD structured data to pages for rich search results (breadcrumbs, product listings, FAQ). Structured data is injected via the route's `head` configuration.

```typescript
// app/routes/products.$productId.tsx (with structured data)
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/$productId')({
  loader: async ({ params }) => {
    const res = await fetch(
      `https://fakestoreapi.com/products/${params.productId}`
    )
    return { product: await res.json() }
    // => product: { title, price, description, image, category }
  },

  head: ({ loaderData }) => {
    // => head: function with access to loaderData
    // => loaderData: the object returned by loader
    const product = loaderData?.product
    if (!product) return {}
    // => Guard: return empty head if loader data not available

    const structuredData = {
      '@context': 'https://schema.org',
      // => @context: Schema.org vocabulary URL (required)
      '@type': 'Product',
      // => @type: Schema.org entity type
      name: product.title,
      // => name: product name for rich results
      description: product.description,
      // => description: used in Google Shopping and search snippets
      image: product.image,
      // => image: product photo for visual search results
      offers: {
        '@type': 'Offer',
        // => offers: pricing information
        price: product.price,
        // => price: numeric price value
        priceCurrency: 'USD',
        // => priceCurrency: ISO 4217 currency code
        availability: 'https://schema.org/InStock',
        // => availability: stock status enum
      },
    }
    // => structuredData: JSON-LD object (serialized to <script> tag)

    return {
      meta: [
        { title: `${product.title} - My Shop` },
        { name: 'description', content: product.description?.slice(0, 155) },
      ],
      // => Standard meta tags (title, description)
      scripts: [
        {
          type: 'application/ld+json',
          // => application/ld+json: MIME type for JSON-LD
          children: JSON.stringify(structuredData),
          // => Renders: <script type="application/ld+json">{ ... }</script>
        },
      ],
      // => scripts: additional <script> tags in <head>
    }
  },

  component: function ProductDetailPage() {
    const { product } = Route.useLoaderData()
    return (
      <div>
        <h1>{product.title}</h1>
        <p>${product.price}</p>
        {/* => Product markup (structured data in head, not body) */}
      </div>
    )
  },
})
```

**Key Takeaway**: Inject JSON-LD structured data via the route's `head` function `scripts` array. Access loader data in `head` to populate structured data with real product information.

**Why It Matters**: JSON-LD structured data unlocks Google's rich results: product listings with price and availability, FAQ accordions, breadcrumb trails, and review stars directly in search results. Studies show rich results increase click-through rates by 20-30% compared to standard blue links. E-commerce sites with proper Product schema appear in Google Shopping feeds at no additional cost. The `head` function with loader data access ensures structured data is in the server-rendered HTML - visible to crawlers without JavaScript execution.

### Example 72: Canonical URLs and Sitemap

Manage canonical URLs to prevent duplicate content penalties and generate dynamic sitemaps for search engine indexing.

```typescript
// app/routes/api/sitemap.xml.ts
// => Dynamic sitemap generator as an API route
import { createAPIFileRoute } from '@tanstack/start/api'

export const APIRoute = createAPIFileRoute('/api/sitemap.xml')({
  GET: async () => {
    const baseUrl = process.env.SITE_URL ?? 'https://myapp.com'
    // => baseUrl: from env var (required for absolute URLs in sitemap)
    // => Google: sitemap URLs must be absolute

    // Fetch dynamic routes (from DB in production):
    const productIds = [1, 2, 3, 4, 5]
    // => productIds: real app → SELECT id FROM products WHERE active = true

    const staticRoutes = ['/', '/about', '/contact', '/products']
    // => staticRoutes: manually listed pages that always exist

    const dynamicRoutes = productIds.map((id) => `/products/${id}`)
    // => dynamicRoutes: one URL per active product
    // => ['/products/1', '/products/2', ...]

    const allRoutes = [...staticRoutes, ...dynamicRoutes]
    // => allRoutes: complete list of indexable URLs

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map((route) => `  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`
    // => sitemap: XML string (template literal)
    // => changefreq: how often content changes (hint for crawlers)
    // => priority: relative importance (0.0-1.0, default 0.5)

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        // => Content-Type: tells Google this is XML (not HTML)
        'Cache-Control': 'public, max-age=86400',
        // => Cache-Control: cache for 24 hours (sitemap doesn't change constantly)
      },
    })
    // => Returns: application/xml sitemap response
    // => Google fetches: GET /api/sitemap.xml → parses XML → discovers all URLs
  },
})
```

**Key Takeaway**: Generate dynamic XML sitemaps as API routes. Include all indexable URLs - both static and data-driven dynamic pages - with `changefreq` and `priority` hints for crawlers.

**Why It Matters**: Sitemaps are a direct communication channel with Google's crawler, ensuring all pages are discovered regardless of whether they are linked from the homepage. Dynamic sitemaps that include database-driven URLs (product pages, blog posts, user profiles) ensure new content is indexed quickly - typically within hours of publishing. Without a sitemap, new pages might not be discovered for weeks. For SEO-dependent businesses (e-commerce, content sites, SaaS with public pages), sitemap freshness directly impacts organic search visibility and revenue.

### Example 73: ISR-Like Pattern with Cache Revalidation

Implement Incremental Static Regeneration-like behavior using TanStack Query's stale-while-revalidate with server-side time-based cache headers.

```typescript
// app/routes/api/blog.$slug.ts
// => Blog post API with ISR-like cache behavior
import { createAPIFileRoute } from '@tanstack/start/api'

const blogPosts: Record<string, { title: string; content: string; updatedAt: string }> = {
  'getting-started': {
    title: 'Getting Started with TanStack Start',
    content: 'TanStack Start is a full-stack React framework...',
    updatedAt: '2026-03-15',
  },
}
// => blogPosts: simulated database (real app: CMS or PostgreSQL)

export const APIRoute = createAPIFileRoute('/api/blog/$slug')({
  GET: async ({ params }) => {
    const post = blogPosts[params.slug]
    // => Look up blog post by URL slug

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
      // => 404: post slug doesn't exist
    }

    return Response.json(post, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        // => s-maxage=3600: CDN caches this response for 1 hour
        // => After 1 hour: CDN considers response stale
        // => stale-while-revalidate=86400: serve stale for up to 24 hours WHILE revalidating
        // => SWR: CDN serves cached response instantly + triggers background refetch
        // => User gets: fast response; CDN gets: fresh content for next request
        // => This mimics Next.js ISR: static-speed with dynamic content

        'Vary': 'Accept-Encoding',
        // => Vary: tells CDN to cache separate versions for different encodings
        // => Accept-Encoding: gzip, br (Brotli)
        // => CDN serves the correct compressed version to each client
      },
    })
    // => 200: post data with cache headers
  },
})
```

**Key Takeaway**: `s-maxage` controls CDN cache duration; `stale-while-revalidate` enables CDNs to serve stale content while refreshing in the background - approximating Next.js ISR behavior.

**Why It Matters**: ISR-like caching delivers the performance of static files with the freshness of dynamic content. Blog posts, product pages, and marketing landing pages change infrequently but need to serve thousands of concurrent users with minimal database load. A 1-hour `s-maxage` means the CDN serves up to 3,600 requests from cache before hitting the server. `stale-while-revalidate` ensures the cache refresh is imperceptible to users - they always get an instant response from the CDN while the fresh version loads in the background. Production content sites use this pattern to reduce origin server load by 95%+.

## Group 27: Performance Monitoring

### Example 74: Performance Monitoring with Web Vitals

Integrate Web Vitals measurement and reporting to track Core Web Vitals (LCP, INP, CLS) in production.

```typescript
// app/lib/vitals.ts
// => Web Vitals measurement and reporting
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals'
// => web-vitals: Google's library for measuring Core Web Vitals
// => npm install web-vitals

interface VitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string
}
// => VitalMetric: typed representation of a Web Vitals measurement

function reportVital(metric: VitalMetric) {
  // => reportVital: sends metrics to analytics endpoint
  // => Called for each measurement as the browser collects it

  const body = JSON.stringify({
    name: metric.name,
    // => name: 'LCP', 'CLS', 'INP', 'FCP', 'TTFB'
    value: Math.round(metric.value),
    // => value: measurement in milliseconds (or score for CLS)
    // => Math.round: reduce data precision (acceptable for analytics)
    rating: metric.rating,
    // => rating: 'good' | 'needs-improvement' | 'poor'
    // => Based on Google's thresholds (LCP: good <2500ms, poor >4000ms)
    page: window.location.pathname,
    // => page: which route the measurement was taken on
    // => Identifies slow pages vs overall performance
  })

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/vitals', body)
    // => sendBeacon: sends data even when page is unloading
    // => Non-blocking: doesn't delay page unload
    // => Preferred over fetch for exit-time reporting
  }
  // => Real app: also send to: Google Analytics 4, Datadog RUM, Sentry
}

export function initWebVitals() {
  // => initWebVitals: call this once in client entry point
  onLCP(reportVital)
  // => LCP: Largest Contentful Paint (loading performance)
  // => Good: <2.5s, Needs Improvement: 2.5-4s, Poor: >4s
  onINP(reportVital)
  // => INP: Interaction to Next Paint (responsiveness)
  // => Replaced FID in March 2024 as Core Web Vital
  onCLS(reportVital)
  // => CLS: Cumulative Layout Shift (visual stability)
  // => Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25
  onFCP(reportVital)
  // => FCP: First Contentful Paint (perceived load speed)
  onTTFB(reportVital)
  // => TTFB: Time to First Byte (server response speed)
}

// Call in app/client.tsx:
// import { initWebVitals } from './lib/vitals'
// initWebVitals()
// hydrateRoot(document, <StartClient router={router} />)
```

**Key Takeaway**: Initialize `web-vitals` measurements in the client entry point. Report via `navigator.sendBeacon` to avoid blocking page unload. Track per-page metrics to identify specific slow routes.

**Why It Matters**: Core Web Vitals are Google's primary ranking signal for page experience, directly affecting search visibility. Without measurement, you cannot know which routes have CLS issues (layout shifts that frustrate users), which have high INP (slow response to clicks), or which have poor LCP (slow main content loading). Per-page tracking identifies specific problematic routes - perhaps only the checkout page has high CLS due to a late-loading banner. Production applications that systematically measure and improve Web Vitals see compounding benefits: better SEO ranking, lower bounce rates, and higher conversion rates.

### Example 75: Bundle Analysis for Production Optimization

Analyze the production bundle to identify large dependencies and code splitting opportunities before deployment.

```typescript
// vite.config.ts or app.config.ts (bundle analyzer integration)
import { defineConfig } from '@tanstack/start/config'
// => Note: bundle analysis is a build-time concern, not runtime

// package.json scripts (add these):
// "build:analyze": "ANALYZE=true vinxi build",
// => Custom env var to trigger analyzer during build

// vite.config.ts (alternative to app.config.ts for Vite plugins):
// import { defineConfig } from 'vite'
// import { visualizer } from 'rollup-plugin-visualizer'
// export default defineConfig({
//   plugins: [
//     process.env.ANALYZE && visualizer({
//       open: true,       // Auto-open browser with visualization
//       gzipSize: true,   // Show gzip-compressed sizes
//       brotliSize: true, // Show brotli-compressed sizes
//       filename: 'dist/stats.html',
//     }),
//   ].filter(Boolean),
// })

// Reading bundle analysis output (illustrative sizes):
// Bundle composition after analysis:
// react + react-dom:     ~45KB gzip   (framework, unchangeable)
// @tanstack/react-router: ~35KB gzip  (routing, essential)
// @tanstack/react-query:  ~13KB gzip  (data, essential)
// moment.js:             ~70KB gzip   (PROBLEM: large date library)
// lodash:                ~25KB gzip   (WARNING: often only 5KB needed)
// recharts:              ~85KB gzip   (chart library: lazy-load candidate)
// => moment.js: replace with date-fns or dayjs (~3KB gzip)
// => lodash: import specific functions (lodash/debounce, not all of lodash)
// => recharts: lazy load with React.lazy (only on pages that use charts)

// Optimization impact:
// Before: 285KB gzip (initial bundle)
// After:  132KB gzip (with moment→dayjs, lazy charts, tree-shaken lodash)
// => 54% reduction in initial download size
// => LCP improvement: ~800ms on 3G connections
```

**Key Takeaway**: Bundle analysis reveals large dependencies and code splitting opportunities. Replace heavy date libraries (moment.js → dayjs), tree-shake utilities (specific lodash imports), and lazy-load visualization libraries.

**Why It Matters**: Bundle size directly determines Time to Interactive on slow connections. A 285KB initial bundle on a 3G connection (1Mbps) takes over 2 seconds to download before parsing begins. Reducing to 132KB halves this, enabling meaningful interaction nearly a second faster. In emerging markets where TanStack Start applications are increasingly deployed, 3G and 4G connections are the norm - bundle optimization is not a premium concern but a baseline requirement for global user reach. Regular bundle analysis (run before every major release) prevents gradual bundle size creep as dependencies are added.

## Group 28: Production Architecture

### Example 76: Request Deduplication with Loader Guards

Prevent redundant data fetching by checking the TanStack Query cache before making server requests in loaders.

```typescript
// app/routes/products.$productId.tsx
// => Smart loader that checks cache before fetching
import { createFileRoute } from '@tanstack/react-router'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'

const getProduct = createServerFn()
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const res = await fetch(`https://fakestoreapi.com/products/${data.id}`)
    if (!res.ok) throw new Error('Product not found')
    return res.json()
  })
// => getProduct: server function to fetch single product

function productQueryOptions(id: number) {
  return queryOptions({
    queryKey: ['products', id],
    // => queryKey: includes product id for per-product cache slots
    // => ['products', 1] and ['products', 2] are separate cache entries
    queryFn: () => getProduct({ data: { id } }),
    // => queryFn: fetch this specific product
    staleTime: 1000 * 60 * 5,
    // => staleTime: 5 minutes per product
  })
}
// => productQueryOptions: factory creates options per product id

export const Route = createFileRoute('/products/$productId')({
  loader: ({ params, context }) => {
    const id = Number(params.productId)
    // => Convert string param to number for server function
    // => params.productId: "42" → id: 42

    const opts = productQueryOptions(id)
    // => Create query options for this specific product

    const cached = context.queryClient.getQueryData(opts.queryKey)
    // => getQueryData: synchronously check cache
    // => cached: product object if in cache, undefined if not

    if (cached) {
      return cached
      // => Cache hit: return immediately (zero network requests)
      // => User navigated from product list where this was prefetched
    }

    return context.queryClient.fetchQuery(opts)
    // => Cache miss: fetch and populate cache
    // => fetchQuery: fetches data, stores in cache, returns result
    // => Component's useQuery will read from this populated cache
  },

  component: function ProductDetailPage() {
    const product = Route.useLoaderData()
    return <h1>{product.title}</h1>
    // => Renders: product title
  },
})
```

**Key Takeaway**: Check `queryClient.getQueryData()` before fetching in loaders. If the cache already has fresh data (from list page prefetch), return it immediately with zero network requests.

**Why It Matters**: The product listing page often prefetches data for visible items using TanStack Query. When a user clicks a product, the detail page loader can find that data already in cache and render instantly - no loading state, no network request. This technique, used by single-page applications with sophisticated caching (Notion, Linear, Figma), creates a native-app navigation feel where every click renders instantly. The fallback to `fetchQuery` ensures correctness for direct URL visits or cache misses.

### Example 77: Middleware Composition

Compose multiple middleware functions for cross-cutting concerns. Order matters - middleware wraps in order from first to last.

```typescript
// app/middleware/index.ts
// => Composed middleware stack for production server functions
import { createMiddleware } from '@tanstack/start'
import { getCookie } from 'vinxi/http'

const timingMiddleware = createMiddleware().server(async ({ next }) => {
  // => timingMiddleware: measures execution time
  const start = performance.now()
  // => performance.now(): high-resolution timestamp

  const result = await next()
  // => Call next middleware/handler

  const duration = performance.now() - start
  // => duration: milliseconds for the entire request

  if (duration > 1000) {
    console.warn(`[SLOW REQUEST] ${duration.toFixed(0)}ms`)
    // => Warn on slow requests (>1000ms threshold)
    // => Monitor for performance regressions
  }

  return result
  // => Return result unchanged
})

const authMiddleware = createMiddleware().server(async ({ next }) => {
  // => authMiddleware: verify authentication
  const session = getCookie('session')
  // => Read session cookie

  if (!session) throw new Error('Unauthorized')
  // => No session: reject request

  return next({ context: { session: JSON.parse(session) } })
  // => Valid session: inject into context, continue
})

const rateLimitMiddleware = createMiddleware().server(async ({ next }) => {
  // => rateLimitMiddleware: prevent abuse (simplified)
  // => Real implementation: Redis-backed sliding window counter

  const isRateLimited = false
  // => Real: check request count for IP/user in last minute
  if (isRateLimited) throw new Error('Rate limit exceeded')
  // => Throw if too many requests

  return next()
  // => Not rate limited: continue
})

// Composed middleware stack for sensitive operations:
export const secureMiddleware = [
  timingMiddleware,
  // => Layer 1: timing (outer wrapper, measures total time)
  rateLimitMiddleware,
  // => Layer 2: rate limiting (before auth, cheaper to reject)
  authMiddleware,
  // => Layer 3: authentication (after rate limit check)
]
// => Usage: createServerFn().middleware(secureMiddleware).handler(...)
// => Order: timing → rate limit → auth → handler → auth → rate limit → timing
// => Each middleware wraps the next (onion model)
```

**Key Takeaway**: Compose middleware arrays in order: outer layers (timing) wrap inner layers (auth). The composition creates an onion model where each layer wraps the next in both directions.

**Why It Matters**: Middleware composition is the foundation of production server architecture. Security-critical operations (payment processing, data export, admin actions) need multiple layers of protection: rate limiting prevents brute force attacks, authentication ensures identity, authorization checks permissions, timing catches performance regressions. Writing these checks inline in every server function is error-prone - a missed rate limit allows abuse, a missed auth check creates a security hole. Composable middleware enables a "secure by construction" approach where applying the right middleware stack is sufficient.

### Example 78: Server Function Error Serialization

TanStack Start serializes errors from server functions and deserializes them on the client. Understand this mechanism for proper error handling.

```typescript
// app/server/payments.ts
// => Payment server function with structured error responses
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'

class PaymentError extends Error {
  constructor(
    public code: 'CARD_DECLINED' | 'INSUFFICIENT_FUNDS' | 'INVALID_CARD',
    message: string,
    public retryable: boolean,
  ) {
    super(message)
    this.name = 'PaymentError'
    // => name: used to identify error type after serialization
  }
}
// => PaymentError: typed payment-specific error

export const processPayment = createServerFn()
  .validator(z.object({ amount: z.number().positive(), cardToken: z.string() }))
  .handler(async ({ data }) => {
    // => Simulate payment processing
    if (data.amount > 10000) {
      throw new PaymentError(
        'CARD_DECLINED',
        'Transaction exceeds single payment limit',
        false,
        // => retryable: false (different card won't help for limit errors)
      )
      // => Thrown PaymentError: serialized and sent to client
    }

    return { transactionId: `txn_${Date.now()}`, status: 'succeeded' }
    // => Success: transaction ID and status
  })

// Client usage with typed error handling:
// try {
//   const result = await processPayment({ data: { amount: 15000, cardToken: 'tok_...' } })
//   console.log('Payment succeeded:', result.transactionId)
// } catch (error) {
//   if (error instanceof Error && error.name === 'PaymentError') {
//     // => error.name: 'PaymentError' (preserved through serialization)
//     const paymentError = error as PaymentError
//     if (paymentError.code === 'CARD_DECLINED') {
//       showError('Your card was declined. Please try a different card.')
//     } else if (!paymentError.retryable) {
//       showError('This error cannot be resolved by retrying.')
//     }
//   }
// }
// => error instanceof PaymentError: may NOT work (serialization changes class chain)
// => error.name === 'PaymentError': DOES work (name is serialized)
// => Best practice: check error.name, not instanceof, across the network boundary
```

**Key Takeaway**: Errors thrown in server functions are serialized and deserialized across the network. Check `error.name` (not `instanceof`) to identify error types on the client, as class instances lose their prototype chain during serialization.

**Why It Matters**: The network boundary between server functions and client code creates a serialization gap that trips up developers expecting `instanceof` checks to work. Understanding that `error.name` is preserved while `instanceof PaymentError` is not prevents silent error handling failures. Payment error handling is especially critical - misclassifying an error (treating a retryable network error as a non-retryable card decline) results in failed transactions and lost revenue. Structured error types with known serialization behavior make this code reliable in production.

### Example 79: Custom Server Configuration

Configure the Vinxi server with custom middleware, CORS headers, and request preprocessing for production requirements.

```typescript
// app.config.ts (advanced server configuration)
import { defineConfig } from '@tanstack/start/config'

export default defineConfig({
  server: {
    preset: 'node-server',
    // => node-server: Node.js deployment target

    routeRules: {
      // => routeRules: per-path server behavior overrides
      '/api/**': {
        cors: true,
        // => cors: enable CORS for all /api/* routes
        // => Allows requests from: any origin (configure origins in production)
        headers: {
          'X-Frame-Options': 'DENY',
          // => X-Frame-Options: prevent clickjacking via iframe embedding
          'X-Content-Type-Options': 'nosniff',
          // => nosniff: prevent MIME type sniffing attacks
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          // => Referrer-Policy: limit referrer header for privacy
        },
      },
      '/assets/**': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          // => immutable: browser never revalidates (content hash guarantees freshness)
          // => max-age=31536000: cache for 1 year (365 days in seconds)
          // => Assets have content-hashed filenames: safe to cache forever
        },
      },
      '/**': {
        headers: {
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          // => HSTS: force HTTPS for 1 year, including all subdomains
          // => Prevents downgrade attacks (HTTP instead of HTTPS)
          'X-XSS-Protection': '1; mode=block',
          // => X-XSS-Protection: legacy XSS filter for older browsers
        },
      },
    },
    // => routeRules: granular per-path configuration
  },
})
```

**Key Takeaway**: Use `routeRules` in `app.config.ts` to set security headers, CORS, and caching behavior at the server level. This centralizes HTTP-level configuration separate from application logic.

**Why It Matters**: Security headers are one of the most cost-effective security measures available - they prevent entire classes of attacks (clickjacking, MIME sniffing, XSS, protocol downgrade) with zero application code changes. Tools like SecurityHeaders.com grade production applications on header completeness; enterprises require security header compliance for SOC 2 and PCI DSS certifications. Centralizing header configuration in `app.config.ts` ensures headers are applied consistently and are not accidentally omitted for new routes.

### Example 80: Production Logging and Observability

Integrate structured logging with request context for production debugging and observability.

```typescript
// app/lib/logger.ts
// => Structured logger with request context support
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  requestId?: string
  // => requestId: correlates all logs from one request
  userId?: number
  // => userId: identifies which user triggered the log
  [key: string]: unknown
  // => Index signature: allows additional context fields
}

export const logger = {
  _log: (level: LogLevel, message: string, context: Record<string, unknown> = {}) => {
    const entry: LogEntry = {
      level,
      // => level: log severity
      message,
      // => message: human-readable log description
      timestamp: new Date().toISOString(),
      // => timestamp: ISO 8601 for chronological sorting
      ...context,
      // => context: additional structured fields
    }

    const output = JSON.stringify(entry)
    // => JSON: structured log format for log aggregation tools
    // => Datadog, Splunk, CloudWatch: parse JSON logs automatically

    if (level === 'error') {
      console.error(output)
      // => console.error: written to stderr (monitored by ops tools)
    } else {
      console.log(output)
      // => console.log: written to stdout (aggregated by log shippers)
    }
  },

  info: (message: string, context?: Record<string, unknown>) =>
    logger._log('info', message, context),
  // => info: routine operational events
  warn: (message: string, context?: Record<string, unknown>) =>
    logger._log('warn', message, context),
  // => warn: unexpected conditions that don't prevent operation
  error: (message: string, context?: Record<string, unknown>) =>
    logger._log('error', message, context),
  // => error: failures that require investigation
}
// => logger: structured JSON logger for production use

// Usage in server functions:
// export const processOrder = createServerFn()
//   .middleware([timingMiddleware])
//   .handler(async ({ context, data }) => {
//     logger.info('Processing order', { orderId: data.orderId, userId: context.session?.userId })
//     // => Logs: {"level":"info","message":"Processing order","orderId":123,"userId":42,"timestamp":"..."}
//     const result = await orderService.process(data.orderId)
//     logger.info('Order processed', { orderId: data.orderId, status: result.status })
//     return result
//   })
```

**Key Takeaway**: Structured JSON logging enables log aggregation tools to parse, filter, and alert on production events. Include `requestId`, `userId`, and relevant context fields for effective debugging.

**Why It Matters**: Plain `console.log` text messages are nearly impossible to analyze at production scale. Structured JSON logs enable powerful queries: "Show all errors for user 42 in the last hour", "What percentage of orders failed with PAYMENT_ERROR yesterday?". Log aggregation platforms (Datadog, Splunk, ELK stack) parse JSON logs automatically, creating dashboards, alerts, and trace visualizations. Adding `requestId` to every log entry enables distributed tracing - linking all events that occurred during a single user request across multiple server functions and services. This is the foundation of production observability.

---

Congratulations on completing all 80 TanStack Start by-example examples. You have covered 95% of TanStack Start's production-relevant features, from basic routing through deployment, performance optimization, and production observability.

Return to [Overview](/en/learn/software-engineering/platform-web/tools/fe-tanstack-start/by-example/overview) for a full coverage summary, or explore specific topic areas by searching the examples.
