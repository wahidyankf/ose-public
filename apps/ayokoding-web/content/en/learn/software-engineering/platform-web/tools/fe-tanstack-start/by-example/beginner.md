---
title: "Beginner"
weight: 10000001
date: 2026-03-19T10:00:00+07:00
draft: false
description: "Master fundamental TanStack Start concepts through 27 annotated examples covering project setup, file-based routing, loaders, error handling, navigation, and styling"
tags: ["tanstack-start", "tanstack-router", "typescript", "file-based-routing", "loaders", "tutorial", "by-example", "beginner"]
---

This beginner tutorial covers fundamental TanStack Start + TypeScript concepts through 27 heavily annotated examples. Each example maintains 1-2.25 comment lines per code line to ensure deep understanding.

## Prerequisites

Before starting, ensure you understand:

- React fundamentals (components, props, state, hooks, JSX)
- TypeScript basics (types, interfaces, generics)
- JavaScript async/await patterns
- Basic web concepts (HTTP, forms, navigation)

## Group 1: Project Setup

### Example 1: Creating a TanStack Start Project

TanStack Start projects are scaffolded with the `create-tanstack` CLI, which sets up a Vinxi-powered dev server, TanStack Router with file-based routing, and TypeScript configuration in one command.

```bash
# Create a new TanStack Start project
npm create tanstack@latest
# => Prompts: project name, framework (Start), TypeScript, file-based routing
# => Creates: package.json, tsconfig.json, app/ directory, vite config

cd my-tanstack-app
# => Move into the new project directory

npm install
# => Installs: @tanstack/start, @tanstack/react-router, vinxi, react, react-dom
# => Creates: node_modules/, package-lock.json

npm run dev
# => Starts Vinxi dev server on http://localhost:3000
# => Watches for file changes with hot module replacement (HMR)
# => Both client and server code reload on change
```

**Key Takeaway**: `npm create tanstack@latest` bootstraps the full project including TypeScript, file-based routing, and a Vinxi dev server ready to run.

**Why It Matters**: TanStack Start's CLI scaffolding establishes the correct project structure from the start. Unlike manually wiring up Vite, React, and a router, the scaffold pre-configures Vinxi adapters, route generation, and TypeScript path aliases. Production teams rely on this consistent structure across repositories. The generated `app.config.ts` controls which Vinxi adapter handles your deployment target - a decision that shapes the entire build pipeline.

### Example 2: Project File Structure

A scaffolded TanStack Start project follows a predictable layout where the `app/routes/` directory drives URL routing and `app/` contains shared infrastructure.

```
my-tanstack-app/
├── app/
│   ├── routes/
│   │   ├── __root.tsx        # Root layout route (wraps all pages)
│   │   └── index.tsx         # Route for URL: /
│   ├── client.tsx            # Client-side entry point
│   ├── router.tsx            # Router instance creation
│   └── ssr.tsx               # Server-side entry point
├── app.config.ts             # Vinxi server/adapter config
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

```typescript
// app/router.tsx
// => Creates the TanStack Router instance for the application
// => Imported by both client.tsx and ssr.tsx
import { createRouter } from '@tanstack/react-router'
// => createRouter: factory function for the router instance
import { routeTree } from './routeTree.gen'
// => routeTree.gen.ts: AUTO-GENERATED file from route files
// => Never edit manually - regenerated on dev server start

export function createMyRouter() {
  // => Factory function pattern: called separately per request (SSR) and once (client)
  return createRouter({
    routeTree,
    // => Pass the generated route tree (all routes registered)
    defaultPreload: 'intent',
    // => 'intent': preload route data when user hovers a Link
    // => Options: false | 'intent' | 'viewport' | 'render'
  })
}
// => Returns configured Router instance
// => Router handles URL matching, data loading, rendering
```

**Key Takeaway**: The `app/routes/` directory drives URL routing. `routeTree.gen.ts` is auto-generated and must never be edited manually.

**Why It Matters**: Understanding the project layout prevents confusion about where to add features. The separation between `app.config.ts` (server/build config) and `app/router.tsx` (runtime routing) mirrors the split between infrastructure and application concerns. When deploying to different targets (Vercel vs Node.js), only `app.config.ts` changes - all route files remain identical.

### Example 3: Root Layout Route

The `__root.tsx` file defines the root layout that wraps every page in the application. It sets up global HTML structure, providers, and the `<Outlet />` where child routes render.

```tsx
// app/routes/__root.tsx
// => Double underscore prefix: TanStack Router convention for root/layout routes
// => This file wraps ALL routes in the application
import { createRootRoute, Outlet } from '@tanstack/react-router'
// => createRootRoute: specialized factory for the root route
// => Outlet: renders the matched child route component

import { TanStackRouterDevtools } from '@tanstack/router-devtools'
// => Optional devtools overlay for route inspection during development
// => Shows current route, params, search, loader data

export const Route = createRootRoute({
  // => Must export as 'Route' (convention enforced by code generation)
  component: function RootLayout() {
    // => Renders for every URL in the application
    // => Wraps all page components

    return (
      <html lang="en">
        {/* => HTML lang attribute: accessibility + SEO */}
        <head>
          {/* => <head> managed here or via useHead/HeadContent */}
          <meta charSet="utf-8" />
          {/* => UTF-8 encoding for international characters */}
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {/* => Responsive viewport meta: essential for mobile */}
          <title>My TanStack App</title>
          {/* => Default title (child routes can override via useHead) */}
        </head>
        <body>
          {/* => body element for all page content */}
          <Outlet />
          {/* => CRITICAL: renders matched child route */}
          {/* => Without Outlet, child routes render nothing */}
          <TanStackRouterDevtools />
          {/* => Devtools: only visible in development */}
          {/* => Remove or wrap in process.env check for production */}
        </body>
      </html>
    )
  },
})
```

**Key Takeaway**: `__root.tsx` with `createRootRoute` is the single entry point for the entire application's layout. The `<Outlet />` renders whichever child route matches the current URL.

**Why It Matters**: The root route is where you place application-wide providers (React Query, auth context, toast notifications), global styles, and the base HTML structure. Getting this right early prevents widespread refactoring later. In SSR mode, TanStack Start's `<html>` management ensures head tags are correctly streamed to the client before the body, which is essential for proper browser parsing and SEO crawler behavior.

## Group 2: File-Based Routing

### Example 4: Defining a Route with `createFileRoute`

Every route file exports a `Route` constant created with `createFileRoute`. The path string you pass must exactly match the file's location in the routes directory.

```typescript
// app/routes/index.tsx
// => File path: app/routes/index.tsx → URL path: /
// => 'index' maps to the root path of its directory
import { createFileRoute } from '@tanstack/react-router'
// => createFileRoute: factory function tied to a specific path
// => Takes the route path as a string argument

export const Route = createFileRoute('/')({
  // => '/' = root path of the application
  // => MUST match the file's location in routes/
  // => Code generation validates this at build time

  component: function HomePage() {
    // => component: the React component rendered at this route
    // => Named function preferred for React DevTools readability

    return (
      <main>
        {/* => <main> semantic HTML landmark for primary content */}
        <h1>Welcome to TanStack Start</h1>
        {/* => Static heading rendered on server */}
        <p>A full-stack React framework built for scale.</p>
        {/* => Descriptive paragraph */}
      </main>
    )
  },
})
// => Route object contains: path, component, loader, beforeLoad, etc.
// => Registered in routeTree.gen.ts automatically by dev server
```

**Key Takeaway**: Every route file exports `Route = createFileRoute('/path')({...})`. The path string must match the file's location in `app/routes/`.

**Why It Matters**: File-based routing eliminates the manual routing registry found in older React apps. Adding a new page is as simple as adding a file. The code generator validates that path strings match file locations, catching typos before they reach production. This convention makes large codebases navigable - any developer can find the code for `/dashboard/settings` by looking at `app/routes/dashboard/settings.tsx`.

### Example 5: Route with a Loader

The `loader` function runs on the server before the component renders, fetching data that the component receives via `useLoaderData`. The loader's return type is fully inferred by TypeScript.

```typescript
// app/routes/products.tsx
// => File path: app/routes/products.tsx → URL path: /products
import { createFileRoute } from '@tanstack/react-router'

type Product = {
  id: number
  name: string
  price: number
}
// => Define product shape for type safety
// => TypeScript will infer this through the entire data flow

export const Route = createFileRoute('/products')({
  loader: async () => {
    // => loader: async function that fetches data before render
    // => Runs on SERVER during SSR, on CLIENT during navigation
    // => Return value becomes the component's loaderData

    const response = await fetch('https://fakestoreapi.com/products?limit=5')
    // => fetch() standard browser API + Node.js compatible
    // => limit=5: request only 5 products
    // => response is Response object (status 200, body: JSON)

    const products: Product[] = await response.json()
    // => Parse JSON body into typed Product array
    // => products is Product[] (5 items)
    // => products[0]: { id: 1, name: "...", price: 29.95 }

    return { products }
    // => Return object is loaderData
    // => TypeScript infers: { products: Product[] }
  },

  component: function ProductsPage() {
    const { products } = Route.useLoaderData()
    // => useLoaderData: hook to access loader return value
    // => Route.useLoaderData() is TYPED: returns { products: Product[] }
    // => No manual type annotation needed here

    return (
      <ul>
        {products.map((product) => (
          // => map: transform each Product to JSX list item
          <li key={product.id}>
            {/* => key: product.id (unique number) for React reconciliation */}
            {product.name} - ${product.price}
            {/* => Renders: "Fjallraven - Foldsack Backpack - $109.95" */}
          </li>
        ))}
      </ul>
    )
  },
})
```

**Key Takeaway**: The `loader` function fetches data before rendering and returns it typed. The component accesses it via `Route.useLoaderData()` with full TypeScript inference.

**Why It Matters**: Loaders solve the "loading spinner hell" problem where components show skeleton states because data fetches happen after render. By resolving data before the component mounts, TanStack Start renders complete HTML on the server and avoids client-side loading flicker. Production applications that serve dashboards, product listings, or user profiles benefit enormously from this approach - Google's Core Web Vitals scores improve because users see real content faster.

### Example 6: Dynamic Route Params

Dynamic route segments are prefixed with `$` in the filename. TanStack Router infers the param names and makes them available as fully typed values through `useParams`.

```typescript
// app/routes/products.$productId.tsx
// => File naming: $ prefix = dynamic segment
// => URL pattern: /products/123, /products/abc-widget, /products/42
// => $productId captures whatever value appears at that position

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/$productId')({
  // => '/products/$productId': route path with dynamic segment
  // => $productId: named param captured from URL

  loader: async ({ params }) => {
    // => params: object with dynamic segment values
    // => params.productId: string from URL (e.g., "42")
    // => TypeScript INFERS params type as { productId: string }

    const response = await fetch(
      `https://fakestoreapi.com/products/${params.productId}`
    )
    // => Template literal: interpolates productId into URL
    // => Fetches: https://fakestoreapi.com/products/42

    if (!response.ok) {
      // => response.ok: true if status 200-299, false otherwise
      throw new Error(`Product not found: ${params.productId}`)
      // => Thrown errors are caught by errorComponent
    }

    const product = await response.json()
    // => product: single product object
    // => { id: 42, title: "...", price: 9.99, category: "..." }

    return { product }
    // => Returns { product: any } (TypeScript infers from fetch)
  },

  component: function ProductDetailPage() {
    const { product } = Route.useLoaderData()
    // => Access fetched product data
    const { productId } = Route.useParams()
    // => useParams: typed access to URL params
    // => productId: "42" (type: string, inferred from route definition)

    return (
      <div>
        <p>Product ID: {productId}</p>
        {/* => Renders: "Product ID: 42" */}
        <h1>{product.title}</h1>
        {/* => Renders the product's title */}
        <p>${product.price}</p>
        {/* => Renders: "$9.99" */}
      </div>
    )
  },
})
```

**Key Takeaway**: Files named `route.$param.tsx` create dynamic route segments. TypeScript infers param types from the route definition - no manual typing needed.

**Why It Matters**: Type-safe route params prevent a class of runtime bugs where param names are mistyped. In Next.js or React Router, typos in `params.productID` vs `params.productId` are caught only at runtime. TanStack Router catches these at compile time, making large codebases with hundreds of dynamic routes significantly safer to refactor. Production e-commerce, CMS, and SaaS applications with entity detail pages rely on this guarantee.

### Example 7: Search Parameters

Search parameters (URL query strings like `?page=2&filter=active`) are type-safe in TanStack Router through the `validateSearch` option, which defines the expected shape and defaults.

```typescript
// app/routes/users.tsx
// => File path → URL: /users
// => Will handle: /users?page=1&role=admin
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
// => zod: schema validation library (type: external dep, add to package.json)
// => npm install zod

const searchSchema = z.object({
  // => Define expected search params shape
  page: z.number().int().positive().default(1),
  // => page: positive integer, defaults to 1
  // => /users → page is 1; /users?page=3 → page is 3
  role: z.enum(['admin', 'user', 'moderator']).optional(),
  // => role: one of three values, optional (can be absent)
  // => /users → role is undefined; /users?role=admin → role is "admin"
})

export const Route = createFileRoute('/users')({
  validateSearch: searchSchema,
  // => validateSearch: zod schema (or function) that parses + validates URL search
  // => Raw URL string params → validated TypeScript object
  // => Invalid params are replaced with defaults or cause redirect

  component: function UsersPage() {
    const { page, role } = Route.useSearch()
    // => useSearch: typed hook that returns validated search params
    // => page: number (not string! zod coerced it)
    // => role: "admin" | "user" | "moderator" | undefined

    return (
      <div>
        <p>Page: {page}</p>
        {/* => Renders: "Page: 1" (or whatever page param is) */}
        <p>Role filter: {role ?? 'all'}</p>
        {/* => Nullish coalescing: role or "all" if undefined */}
        {/* => Renders: "Role filter: admin" or "Role filter: all" */}
      </div>
    )
  },
})
```

**Key Takeaway**: `validateSearch` with a zod schema transforms raw URL strings into typed, validated TypeScript objects. The component receives typed values, not raw strings.

**Why It Matters**: Search params are user-controlled input and frequently mishandled. Without validation, a URL like `?page=abc` passes the string "abc" to your code expecting a number, causing silent bugs or crashes. Validated search params are also shareable state - users can bookmark a filtered/paginated view and return to the exact same application state. This is critical for admin dashboards, data tables, and search pages in production applications.

## Group 3: Layout Routes

### Example 8: Nested Layout with Outlet

Layout routes wrap multiple child routes with shared UI (navigation bars, sidebars, headers). Create them by adding an `_layout.tsx` file or a directory with an `index.tsx`.

```tsx
// app/routes/dashboard.tsx
// => File: dashboard.tsx without a component acts as a layout
// => OR: dashboard/_layout.tsx (recommended for clarity)
// => Child routes: dashboard/overview.tsx, dashboard/settings.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: function DashboardLayout() {
    // => This component wraps ALL /dashboard/* routes
    // => Renders once, child route renders inside <Outlet />

    return (
      <div className="dashboard-container">
        {/* => Outer wrapper with CSS class for layout styling */}

        <aside className="sidebar">
          {/* => Sidebar: rendered for every dashboard sub-page */}
          {/* => Does NOT re-mount when navigating between sub-pages */}
          <nav>
            <ul>
              <li>Overview</li>
              {/* => Navigation items (will use Link in Example 13) */}
              <li>Settings</li>
              <li>Reports</li>
            </ul>
          </nav>
        </aside>

        <main className="content-area">
          {/* => Main content area where child routes render */}
          <Outlet />
          {/* => CRITICAL: renders the matched child route */}
          {/* => /dashboard/overview → renders DashboardOverviewPage */}
          {/* => /dashboard/settings → renders DashboardSettingsPage */}
          {/* => /dashboard (exact) → renders dashboard/index.tsx */}
        </main>
      </div>
    )
  },
})
```

```typescript
// app/routes/dashboard/overview.tsx
// => Child route: renders INSIDE DashboardLayout's <Outlet />
// => URL: /dashboard/overview
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/overview')({
  component: function OverviewPage() {
    return <h1>Dashboard Overview</h1>
    // => Renders inside DashboardLayout's <Outlet />
    // => Sidebar persists; only this content swaps
  },
})
```

**Key Takeaway**: Layout routes wrap child routes with shared UI. The child component renders inside `<Outlet />` without re-mounting the layout on navigation.

**Why It Matters**: Layout routes with persistent `<Outlet />` enable shell-based navigation UX where sidebars, navigation bars, and headers do not re-render on route changes. This avoids jarring layout shifts and preserves scroll positions in sidebars. In production SaaS applications and admin panels, a stable layout while only the content area changes creates a native-app feeling. This pattern also enables scroll position preservation in sidebar navigation - a detail that users notice immediately.

### Example 9: Pathless Layout Groups

TanStack Router supports pathless layout groups (directories prefixed with `_`) that add layout UI without affecting the URL path. Child routes inside `_auth/` have URLs without the `_auth` prefix.

```tsx
// app/routes/_authenticated.tsx
// => Underscore prefix: PATHLESS layout route
// => Does NOT add "/authenticated" to the URL
// => Children: _authenticated/dashboard.tsx → URL: /dashboard
// =>           _authenticated/profile.tsx  → URL: /profile
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  // => Path '/_authenticated': pathless group marker
  // => Route exists for layout/guard purposes only
  beforeLoad: ({ context }) => {
    // => beforeLoad: runs before loader and component
    // => context: router context (set in router.tsx)
    // => context.auth: hypothetical auth service

    if (!context.auth?.isAuthenticated) {
      // => If user is not authenticated
      throw redirect({ to: '/login' })
      // => Redirect to /login route
      // => throw: stops execution, redirect happens immediately
      // => redirect() creates a redirect response object
    }
    // => If authenticated: continues to loader and component
  },
  component: function AuthenticatedLayout() {
    return (
      <div>
        <header>
          {/* => Header present on all authenticated pages */}
          <span>Logged in as: User</span>
        </header>
        <Outlet />
        {/* => Child routes render here */}
        {/* => /dashboard renders DashboardPage inside this layout */}
      </div>
    )
  },
})
```

**Key Takeaway**: Pathless layout groups (`_name.tsx`) add shared UI and logic without adding a URL segment. Children get layouts and guards without URL nesting.

**Why It Matters**: Pathless groups are the idiomatic way to share auth guards and layout shells across related routes without polluting URLs. In production applications, grouping all authenticated routes under `_authenticated.tsx` means a single `beforeLoad` check protects every page. Adding a new protected route is automatic - no forgetting to add an auth guard. This architectural pattern scales elegantly from five to five hundred protected routes.

## Group 4: Navigation

### Example 10: The Link Component

The `<Link>` component from TanStack Router renders type-safe anchor tags. TypeScript enforces that the `to` prop references a real route, preventing broken links at compile time.

```tsx
// app/routes/index.tsx (extended)
// => Adding navigation links to the home page
import { createFileRoute, Link } from '@tanstack/react-router'
// => Link: TanStack Router's navigation component
// => Renders <a> tag with enhanced routing capabilities

export const Route = createFileRoute('/')({
  component: function HomePage() {
    return (
      <nav>
        <Link to="/">
          {/* => to="/": navigates to root route */}
          {/* => TypeScript validates '/' is a registered route */}
          {/* => Clicking does client-side navigation (no page reload) */}
          Home
        </Link>

        <Link to="/products">
          {/* => to="/products": typed route path */}
          {/* => Typo like to="/produts" would be a TypeScript ERROR */}
          Products
        </Link>

        <Link
          to="/products/$productId"
          params={{ productId: '42' }}
          // => params: required for dynamic routes
          // => productId must be provided (TypeScript enforces this)
          // => Generates href: /products/42
        >
          Product 42
        </Link>

        <Link
          to="/users"
          search={{ page: 1, role: 'admin' }}
          // => search: typed search params for the target route
          // => Must match the target route's validateSearch schema
          // => Generates href: /users?page=1&role=admin
        >
          Admins
        </Link>

        <Link
          to="/products"
          activeProps={{ className: 'active' }}
          // => activeProps: applied when this route is active
          // => className: adds CSS class when /products is current URL
        >
          Active-styled Products
        </Link>
      </nav>
    )
  },
})
```

**Key Takeaway**: `<Link to="...">` provides fully type-safe navigation. TypeScript verifies that the `to` prop, `params`, and `search` match a real registered route.

**Why It Matters**: Broken internal links are a common source of 404 errors in production applications, especially during refactors. TanStack Router's type-safe `Link` component turns URL mismatches into compile-time errors. When you rename a route from `/products` to `/shop`, TypeScript immediately shows every `<Link to="/products">` that needs updating. Production applications with hundreds of navigation links benefit enormously from this safety net.

### Example 11: Programmatic Navigation with `useNavigate`

Use `useNavigate` when navigation must happen imperatively (after a form submission, API call, or conditional logic) rather than declaratively through a `<Link>` component.

```typescript
// app/routes/login.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
// => useNavigate: hook returning a navigate function
// => navigate() triggers client-side navigation programmatically

export const Route = createFileRoute('/login')({
  component: function LoginPage() {
    const navigate = useNavigate()
    // => navigate: function to trigger navigation imperatively
    // => navigate({ to: '/dashboard' }) navigates to /dashboard
    // => Type-safe: same types as <Link to="...">

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
      // => handleLogin: form submit handler
      // => e: form event with input values

      e.preventDefault()
      // => Prevent default form submission (page reload)

      const formData = new FormData(e.currentTarget)
      // => Extract form data from the form element
      const email = formData.get('email') as string
      // => Get 'email' field value (type assertion: string)

      // Simulate auth (real auth covered in intermediate examples)
      const isAuthenticated = email.includes('@')
      // => Simple validation: email must contain '@'
      // => isAuthenticated: boolean

      if (isAuthenticated) {
        await navigate({ to: '/dashboard' })
        // => navigate(): returns Promise, await optional
        // => Navigates to /dashboard after successful login
        // => Client-side navigation: no page reload
      } else {
        await navigate({ to: '/login', search: { error: 'invalid' } })
        // => Navigate back to login with error search param
        // => URL becomes: /login?error=invalid
      }
    }

    return (
      <form onSubmit={handleLogin}>
        <input name="email" type="email" placeholder="Email" />
        {/* => name="email": matches formData.get('email') */}
        <button type="submit">Login</button>
      </form>
    )
  },
})
```

**Key Takeaway**: `useNavigate` returns a type-safe `navigate` function for imperative navigation. Use it when navigation depends on async operations or conditions.

**Why It Matters**: Programmatic navigation is essential for post-submission flows, authentication redirects, and wizard-style multi-step forms. The type safety of `useNavigate` extends to dynamic navigation - even when the target route is determined at runtime, TypeScript validates the `to`, `params`, and `search` values. This prevents common bugs like missing required params for dynamic routes that are only discovered at runtime in production.

### Example 12: Active Link Styling

TanStack Router's `<Link>` provides `activeProps` and `inactiveProps` for styling the currently active navigation item, with control over exact matching.

```tsx
// app/components/NavBar.tsx
// => Reusable navigation bar component
import { Link } from '@tanstack/react-router'
// => Link: from TanStack Router (not react-router-dom)

export function NavBar() {
  return (
    <nav style={{ display: 'flex', gap: '1rem' }}>
      {/* => Flex layout for horizontal navigation */}

      <Link
        to="/"
        activeOptions={{ exact: true }}
        // => exact: true → only active when URL is EXACTLY '/'
        // => Without exact: '/' would match ALL routes (is prefix of everything)
        activeProps={{
          style: { fontWeight: 'bold', color: '#0173B2' },
          // => Active style: bold blue text
          // => color: '#0173B2' (TanStack blue, accessible)
          'aria-current': 'page',
          // => Accessibility: screen readers announce current page
        }}
        inactiveProps={{
          style: { color: '#333' },
          // => Inactive style: dark gray text
        }}
      >
        Home
      </Link>

      <Link
        to="/products"
        // => activeOptions.exact defaults to false
        // => Active when URL starts with /products
        // => Matches: /products, /products/42, /products/new
        activeProps={{ style: { fontWeight: 'bold', textDecoration: 'underline' } }}
      >
        Products
      </Link>

      <Link
        to="/dashboard"
        activeProps={{ className: 'nav-active' }}
        // => Use className for CSS class-based styling
        // => Combines with existing className if present
      >
        Dashboard
      </Link>
    </nav>
  )
}
// => NavBar renders navigation with automatic active state styling
// => No manual URL comparison needed
```

**Key Takeaway**: `activeProps` and `inactiveProps` on `<Link>` automatically apply styles when the route is active. Use `activeOptions={{ exact: true }}` to prevent the root route from always being active.

**Why It Matters**: Manually tracking the active navigation item requires listening to route changes and comparing URLs - error-prone boilerplate that every team reimplements differently. TanStack Router's built-in active link detection handles nested routes correctly: `/products` stays active when viewing `/products/42`, which is the expected UX behavior. The `aria-current="page"` integration enables screen readers to announce which navigation item is active, meeting WCAG 2.1 navigation requirements.

## Group 5: Loaders and Data Fetching

### Example 13: `beforeLoad` for Redirects and Context

The `beforeLoad` function runs before the `loader`. It is the right place for authentication guards, permission checks, and injecting data into the route context.

```typescript
// app/routes/admin.tsx
// => Protected admin route - requires authentication
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context, location }) => {
    // => beforeLoad: async function, runs before loader
    // => context: router-level context (set in router creation)
    // => location: current URL information

    const user = await context.auth.getCurrentUser()
    // => context.auth: auth service injected at router level
    // => getCurrentUser(): async, returns user or null

    if (!user) {
      // => user is null: not authenticated
      throw redirect({
        to: '/login',
        // => Redirect target: /login route
        search: { redirect: location.href },
        // => Pass current URL as redirect param
        // => After login, can redirect back: /login?redirect=/admin
      })
      // => throw redirect: stops route loading, triggers navigation
    }

    if (user.role !== 'admin') {
      // => User is authenticated but lacks admin role
      throw redirect({ to: '/dashboard' })
      // => Redirect to dashboard (not login, they're logged in)
    }

    return { user }
    // => Return data from beforeLoad to be available in context
    // => loader can access this via context.user
  },

  loader: ({ context }) => {
    // => loader: runs after beforeLoad succeeds
    // => context now includes { user } from beforeLoad return
    const { user } = context as { user: { name: string; role: string } }
    // => Access user injected by beforeLoad

    return { adminName: user.name }
    // => Return loader data for component
  },

  component: function AdminPage() {
    const { adminName } = Route.useLoaderData()
    // => Access loader data (not beforeLoad data directly)
    return <h1>Admin Panel - Welcome, {adminName}</h1>
    // => Renders: "Admin Panel - Welcome, Alice"
  },
})
```

**Key Takeaway**: `beforeLoad` runs before `loader` and is the right place for guards, authentication checks, and context injection. Throwing `redirect()` stops loading and navigates the user.

**Why It Matters**: Separating authentication logic from data fetching keeps routes clean and composable. `beforeLoad` centralizes the "is this user allowed here?" question, while `loader` focuses on "what data does this page need?". In layout routes, a single `beforeLoad` guard in a parent route protects all child routes simultaneously. This is more maintainable than per-component auth checks that are easy to forget when adding new pages.

### Example 14: Parallel Data Loading

When a route needs data from multiple independent sources, load them in parallel with `Promise.all` inside the loader to minimize total wait time.

```typescript
// app/routes/dashboard/overview.tsx
// => Dashboard overview that needs user data AND stats simultaneously
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/overview')({
  loader: async () => {
    // => loader: single async function for all route data
    // => Run independent fetches in PARALLEL for performance

    const [userResult, statsResult] = await Promise.all([
      // => Promise.all: runs both fetches SIMULTANEOUSLY
      // => Total time = max(userFetchTime, statsFetchTime)
      // => Sequential would be: userFetchTime + statsFetchTime

      fetch('/api/user/profile').then((r) => r.json()),
      // => Fetch 1: user profile data
      // => Resolves to: { name: "Fatima", email: "..." }

      fetch('/api/dashboard/stats').then((r) => r.json()),
      // => Fetch 2: dashboard statistics
      // => Resolves to: { totalUsers: 1420, revenue: 84200 }
    ])
    // => userResult: profile object; statsResult: stats object

    return {
      user: userResult,
      // => user: { name: "Fatima", email: "f@example.com" }
      stats: statsResult,
      // => stats: { totalUsers: 1420, revenue: 84200 }
    }
    // => Both loaded before component renders
    // => No sequential loading waterfalls
  },

  component: function DashboardOverviewPage() {
    const { user, stats } = Route.useLoaderData()
    // => Destructure both data sets from loader

    return (
      <div>
        <h1>Welcome, {user.name}</h1>
        {/* => Renders: "Welcome, Fatima" */}
        <p>Total Users: {stats.totalUsers}</p>
        {/* => Renders: "Total Users: 1420" */}
        <p>Revenue: ${stats.revenue}</p>
        {/* => Renders: "Revenue: $84200" */}
      </div>
    )
  },
})
```

**Key Takeaway**: Use `Promise.all` inside `loader` to fetch independent data sources simultaneously. This reduces total load time from the sum to the maximum of individual fetch times.

**Why It Matters**: Parallel loading is critical for dashboard pages that aggregate data from multiple microservices or database queries. A page that shows user info (150ms), activity feed (200ms), and metrics (180ms) takes 530ms sequentially but only 200ms in parallel. At production scale with real users, this translates directly to Largest Contentful Paint scores and user satisfaction. TanStack Start's loader pattern makes parallel loading the natural choice rather than an optimization.

### Example 15: Pending State with `pendingComponent`

The `pendingComponent` option renders a loading UI when the loader takes longer than `pendingMs` milliseconds. This prevents jarring transitions without showing a spinner for fast loads.

```tsx
// app/routes/reports.tsx
// => Reports page that fetches large datasets (slow loader)
import { createFileRoute } from '@tanstack/react-router'

function ReportsLoading() {
  // => Separate named component for loading state
  // => Renders while loader is in progress
  return (
    <div>
      <div className="skeleton" style={{ height: '2rem', width: '50%' }} />
      {/* => Skeleton placeholder for heading */}
      <div className="skeleton" style={{ height: '8rem', width: '100%' }} />
      {/* => Skeleton placeholder for table */}
      <p>Loading reports...</p>
      {/* => Text fallback for accessibility */}
    </div>
  )
  // => Skeleton UI: better UX than blank page or spinner
}

export const Route = createFileRoute('/reports')({
  pendingMs: 300,
  // => pendingMs: show pendingComponent after 300ms
  // => Prevents "flash of loading" for fast loaders (<300ms)
  // => If loader resolves in 200ms: no loading UI shown at all
  // => If loader takes 500ms: loading UI shown after 300ms

  pendingComponent: ReportsLoading,
  // => pendingComponent: component to show during long loads
  // => Shown after pendingMs delay passes

  loader: async () => {
    // => Simulate slow data fetch
    await new Promise((resolve) => setTimeout(resolve, 600))
    // => 600ms delay: loader takes longer than pendingMs (300ms)
    // => ReportsLoading WILL be shown (600 > 300)

    return {
      reports: [
        { id: 1, title: 'Q1 Revenue', date: '2026-01-01' },
        { id: 2, title: 'Q2 Projections', date: '2026-04-01' },
      ],
    }
    // => reports: array of report objects
  },

  component: function ReportsPage() {
    const { reports } = Route.useLoaderData()
    // => reports is available (loading is complete)

    return (
      <ul>
        {reports.map((r) => (
          <li key={r.id}>{r.title}</li>
          // => Renders each report title
          // => "Q1 Revenue", "Q2 Projections"
        ))}
      </ul>
    )
  },
})
```

**Key Takeaway**: `pendingMs` sets a delay before showing `pendingComponent`. Loaders faster than `pendingMs` show no loading UI, preventing flicker for fast connections.

**Why It Matters**: Showing a loading spinner for a 50ms load creates an unnecessary flash that makes the app feel slow. The `pendingMs` threshold intelligently delays the loading UI, showing it only when the load actually takes noticeable time. This technique, used by Google's own navigation systems, creates a perception of speed on fast connections while gracefully handling slow ones. Production applications that vary between fast cached responses and slow database queries benefit most from this adaptive approach.

## Group 6: Error Handling

### Example 16: Route Error Boundary

Each route can define an `errorComponent` that renders when the loader or component throws an error. This scopes error display to the affected route without crashing the entire page.

```tsx
// app/routes/products.$productId.tsx (updated)
// => Add error handling to the dynamic product route
import { createFileRoute, ErrorComponent } from '@tanstack/react-router'
// => ErrorComponent: default TanStack error display (use as base or replace)

function ProductError({ error }: { error: Error }) {
  // => Custom error component for product route
  // => error: the Error object thrown by loader or component
  return (
    <div role="alert">
      {/* => role="alert": ARIA role for screen readers */}
      {/* => Screen readers announce this immediately */}
      <h2>Product Not Found</h2>
      {/* => User-friendly heading (not raw error message) */}
      <p>{error.message}</p>
      {/* => error.message: the thrown error's message string */}
      {/* => Example: "Product not found: 9999" */}
      <button onClick={() => window.location.reload()}>
        {/* => onClick: reload page to retry */}
        Try Again
      </button>
    </div>
  )
}

export const Route = createFileRoute('/products/$productId')({
  errorComponent: ProductError,
  // => errorComponent: renders when loader or component throws
  // => Receives: { error: Error, reset: () => void }
  // => Scoped to THIS route only: rest of the app still works

  loader: async ({ params }) => {
    const response = await fetch(
      `https://fakestoreapi.com/products/${params.productId}`
    )
    // => Fetch product data

    if (!response.ok) {
      throw new Error(`Product not found: ${params.productId}`)
      // => Throwing here triggers errorComponent
      // => ProductError renders with this error
    }

    return { product: await response.json() }
    // => Returns product on success
  },

  component: function ProductDetailPage() {
    const { product } = Route.useLoaderData()
    return <h1>{product.title}</h1>
    // => Renders product title (only reached if loader succeeded)
  },
})
```

**Key Takeaway**: `errorComponent` catches errors thrown by the loader and component. It renders in-place, preserving the rest of the layout and navigation.

**Why It Matters**: Route-scoped error boundaries prevent a single failing API call from crashing the entire application. In production dashboards, a widget that fails to load should show its own error state while the rest of the dashboard remains functional. TanStack Router's `errorComponent` provides this automatically at the route level without requiring manual `try/catch` in every component. Combined with the `reset` prop, users can retry without a full page reload, keeping their session intact.

### Example 17: Not-Found Handling with `notFoundComponent`

TanStack Router distinguishes between data-not-found (a specific product doesn't exist) and route-not-found (no route matches the URL). The `notFoundComponent` handles route-level 404s.

```tsx
// app/routes/__root.tsx (updated to add global not-found)
// => Global 404 page for unmatched routes
import { createRootRoute, Outlet, notFound } from '@tanstack/react-router'
// => notFound: function to throw a not-found response from a loader

function GlobalNotFound() {
  // => Global 404 component: renders when no route matches the URL
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      {/* => Standard 404 message */}
      <p>The page you requested does not exist.</p>
      {/* => Helpful message */}
    </div>
  )
}

export const Route = createRootRoute({
  notFoundComponent: GlobalNotFound,
  // => notFoundComponent: global fallback for unmatched URLs
  // => Renders for: /this-route-does-not-exist, /missing/page

  component: function RootLayout() {
    return (
      <html lang="en">
        <head><meta charSet="utf-8" /></head>
        <body>
          <Outlet />
          {/* => Matched routes render here */}
          {/* => When no route matches: notFoundComponent renders */}
        </body>
      </html>
    )
  },
})

// In a loader (separate file: app/routes/products.$productId.tsx):
// => Throw notFound() for data-level 404 (product exists as route, data doesn't)
// loader: async ({ params }) => {
//   const product = await db.products.findById(params.productId)
//   if (!product) {
//     throw notFound()
//     // => notFound(): throws special not-found response
//     // => Triggers notFoundComponent instead of errorComponent
//   }
//   return { product }
// }
```

**Key Takeaway**: `notFoundComponent` on the root route handles unmatched URLs. Use `throw notFound()` in loaders when data is missing to trigger the not-found UI instead of an error.

**Why It Matters**: Distinguishing between "route doesn't exist" and "data doesn't exist" enables appropriate user experiences. A missing product (`throw notFound()`) should show "Product Not Found" with a search suggestion, while a typo in the URL (`/produts`) should show a generic 404. Search engines also treat these differently - a 404 status code for non-existent routes is important for SEO hygiene, preventing index bloat from crawled error pages. TanStack Start's SSR mode correctly sends 404 HTTP status codes for not-found routes.

### Example 18: Error Reset and Retry

The `errorComponent` receives a `reset` function that retries the route's loader. This enables "Try Again" buttons without a full page reload.

```tsx
// app/routes/feed.tsx
// => Live feed route with retry capability
import { createFileRoute } from '@tanstack/react-router'

interface FeedErrorProps {
  error: Error
  reset: () => void
  // => reset: function to retry the route (re-runs loader)
}

function FeedError({ error, reset }: FeedErrorProps) {
  // => Custom error component with retry button
  return (
    <div role="alert">
      <h2>Failed to Load Feed</h2>
      {/* => User-friendly error heading */}
      <p>Error: {error.message}</p>
      {/* => Show error detail (consider hiding in production) */}
      <button
        onClick={reset}
        // => reset: re-runs the route loader
        // => If loader succeeds on retry: normal component renders
        // => If loader fails again: errorComponent shows again
      >
        Retry
      </button>
      {/* => User can retry without losing navigation state */}
    </div>
  )
}

export const Route = createFileRoute('/feed')({
  errorComponent: FeedError,
  // => FeedError receives { error, reset }

  loader: async () => {
    const response = await fetch('/api/feed/latest')
    // => Fetch latest feed items

    if (!response.ok) {
      throw new Error(`Feed unavailable: ${response.status}`)
      // => Error with HTTP status code for debugging
    }

    return { items: await response.json() }
    // => items: array of feed items
  },

  component: function FeedPage() {
    const { items } = Route.useLoaderData()
    return (
      <ul>
        {items.map((item: { id: number; text: string }) => (
          <li key={item.id}>{item.text}</li>
          // => Render each feed item
        ))}
      </ul>
    )
  },
})
```

**Key Takeaway**: The `reset` function in `errorComponent` retries the route loader. Users can recover from transient errors without a full page reload.

**Why It Matters**: Network failures are inevitable in production. Without a retry mechanism, users must refresh the entire page - losing form state, scroll position, and navigation context. The `reset` function from TanStack Router provides a targeted retry that re-runs only the failing loader, keeping the rest of the application intact. This is particularly valuable for real-time feeds, live dashboards, and mobile users on unreliable networks where transient failures are common.

## Group 7: Head and Meta Management

### Example 19: Managing the `<head>` with `useHead`

TanStack Start integrates with `@unhead/react` for managing document head tags (title, meta, link) from any component, with automatic deduplication and SSR support.

```tsx
// app/routes/products.$productId.tsx (updated)
// => Add SEO meta tags for product pages
import { createFileRoute } from '@tanstack/react-router'
import { useHead } from '@unhead/react'
// => useHead: hook for setting document head from components
// => Works in SSR: head tags rendered in initial HTML
// => npm install @unhead/react (check TanStack Start docs for version)

export const Route = createFileRoute('/products/$productId')({
  loader: async ({ params }) => {
    const response = await fetch(
      `https://fakestoreapi.com/products/${params.productId}`
    )
    // => Fetch product data
    return { product: await response.json() }
    // => product: { title, description, price, image }
  },

  component: function ProductDetailPage() {
    const { product } = Route.useLoaderData()
    // => product: { title: "Fjallraven Backpack", description: "...", ... }

    useHead({
      title: `${product.title} - My Shop`,
      // => title: sets <title> in <head>
      // => SSR renders: <title>Fjallraven Backpack - My Shop</title>
      // => Client: updates document.title on navigation

      meta: [
        {
          name: 'description',
          content: product.description?.slice(0, 155),
          // => SEO meta description: max 155 chars for Google snippet
          // => slice(0, 155): truncate long descriptions
        },
        {
          property: 'og:title',
          content: product.title,
          // => Open Graph title: used by social media previews
          // => Twitter, Facebook, LinkedIn read this
        },
        {
          property: 'og:image',
          content: product.image,
          // => Open Graph image: product photo in social previews
        },
      ],
      // => meta: array of meta tag objects
      // => Each object maps to one <meta> tag
    })
    // => useHead: sets all head tags when component mounts/updates

    return (
      <div>
        <h1>{product.title}</h1>
        {/* => Product title heading */}
        <p>${product.price}</p>
        {/* => Product price */}
      </div>
    )
  },
})
```

**Key Takeaway**: `useHead` from `@unhead/react` sets document head tags including title and meta from any component. Tags are rendered in SSR HTML and updated on client navigation.

**Why It Matters**: SEO requires accurate title and meta tags for every page, including dynamically generated product, article, and profile pages. Using `useHead` in TanStack Start ensures these tags are present in the server-rendered HTML that search engine crawlers see - not just client-side updates that crawlers may miss. Open Graph tags directly impact click-through rates from social media; a product image appearing in a shared link can double engagement. Getting head management right from the start prevents costly SEO retrofits.

### Example 20: Static `head` Option in Route Definition

For routes with static (non-data-dependent) head configuration, define it in the route's `head` option. This runs on the server before the component and avoids the useHead hook.

```typescript
// app/routes/about.tsx
// => About page with static SEO metadata
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  head: () => ({
    // => head: function returning HeadConfig object
    // => Runs before component, results included in SSR HTML
    // => Use for static metadata that doesn't depend on loader data

    meta: [
      {
        title: 'About Us - My TanStack App',
        // => title: sets the <title> element
      },
      {
        name: 'description',
        content:
          'Learn about our team and mission to build great software with TanStack Start.',
        // => Meta description for search engine snippets
        // => 160 chars or less for Google display
      },
      {
        name: 'robots',
        content: 'index, follow',
        // => robots: tell search engines to index and follow links
        // => Default behavior, but explicit is better
      },
    ],
    // => meta: array of meta configurations
    // => Each rendered as <meta> tag in <head>

    links: [
      {
        rel: 'canonical',
        href: 'https://myapp.com/about',
        // => canonical: tells search engines this is the authoritative URL
        // => Prevents duplicate content issues from query strings
      },
    ],
    // => links: array of <link> elements in <head>
  }),

  component: function AboutPage() {
    return (
      <main>
        <h1>About Us</h1>
        {/* => Head is configured in route, not in component */}
        {/* => Component focuses on content, not meta concerns */}
        <p>We build software for the future.</p>
      </main>
    )
  },
})
```

**Key Takeaway**: The `head` option in route definitions provides static SEO configuration separate from the component. It runs on the server and includes output in SSR HTML.

**Why It Matters**: Separating metadata from component logic follows the single responsibility principle. Routes own their SEO configuration just as they own their data fetching. Static `head` configurations are also easier to audit - you can grep all route files for `head:` to review every page's SEO setup. For marketing teams managing large content sites, this predictable structure makes it feasible to conduct SEO audits without deep React expertise.

## Group 8: Static Assets and Styling

### Example 21: Importing CSS Modules

CSS Modules provide scoped styling in TanStack Start through Vite's built-in support. Importing a `.module.css` file returns an object of hashed class names.

```tsx
// app/components/Button.module.css (create this file)
// .button {
//   background-color: #0173B2;
//   color: white;
//   padding: 0.5rem 1rem;
//   border: none;
//   border-radius: 4px;
//   cursor: pointer;
// }
// .button:hover {
//   background-color: #005A8C;
// }
// .secondary {
//   background-color: #DE8F05;
// }

// app/components/Button.tsx
// => Reusable button component with CSS Module scoping
import styles from './Button.module.css'
// => Vite transforms Button.module.css into a JS object
// => styles.button: "Button_button__h3kR2" (hashed, unique class name)
// => styles.secondary: "Button_secondary__9pLm1"
// => Hashing prevents class name collisions across components

interface ButtonProps {
  children: React.ReactNode
  // => children: any React renderable content (text, elements)
  variant?: 'primary' | 'secondary'
  // => variant: optional style variant (defaults to primary)
  onClick?: () => void
  // => onClick: optional click handler
}

export function Button({ children, variant = 'primary', onClick }: ButtonProps) {
  // => Button: reusable styled button component
  // => variant defaults to 'primary' if not provided

  const className = variant === 'secondary'
    ? `${styles.button} ${styles.secondary}`
    // => Combine base button class with secondary modifier
    // => Output: "Button_button__h3kR2 Button_secondary__9pLm1"
    : styles.button
    // => Primary: just the base button class
    // => Output: "Button_button__h3kR2"

  return (
    <button className={className} onClick={onClick}>
      {/* => className: scoped CSS class names from CSS Modules */}
      {children}
      {/* => children: button label text or content */}
    </button>
  )
}
```

**Key Takeaway**: CSS Modules (`*.module.css`) provide automatically scoped styling. Import the file and use property access to get hashed class names that never conflict across components.

**Why It Matters**: Global CSS class name collisions are a notorious source of styling bugs in large React applications. CSS Modules eliminate this by generating unique class names at build time. TanStack Start (via Vite) supports CSS Modules natively without configuration. As applications grow to hundreds of components, scoped styles keep refactoring safe - changing styles in `Button.module.css` only affects `Button.tsx`, never accidentally changing other components that happen to use similar class names.

### Example 22: Global CSS and CSS Variables

Global styles and CSS custom properties (variables) provide application-wide design tokens. Import them in the root layout to apply universally.

```tsx
// app/styles/global.css (create this file)
// :root {
//   --color-primary: #0173B2;
//   --color-secondary: #DE8F05;
//   --color-success: #029E73;
//   --color-text: #1a1a1a;
//   --color-background: #ffffff;
//   --font-size-base: 16px;
//   --spacing-unit: 0.5rem;
// }
// * {
//   box-sizing: border-box;
//   margin: 0;
//   padding: 0;
// }
// body {
//   font-family: system-ui, -apple-system, sans-serif;
//   font-size: var(--font-size-base);
//   color: var(--color-text);
//   background-color: var(--color-background);
// }

// app/routes/__root.tsx (updated with global CSS)
import { createRootRoute, Outlet } from '@tanstack/react-router'
import '../styles/global.css'
// => Import global CSS at root level
// => Vite processes and includes in the build
// => CSS injected via <link> tag in production (not inline)
// => global.css loaded for EVERY page in the application

export const Route = createRootRoute({
  component: function RootLayout() {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          {/* => HeadContent component (from unhead) injects meta tags */}
        </head>
        <body>
          <Outlet />
          {/* => Body uses styles from global.css */}
          {/* => CSS variables available throughout the app */}
        </body>
      </html>
    )
  },
})

// Usage in any component:
// <div style={{ color: 'var(--color-primary)' }}>
//   Using CSS variable: renders as #0173B2
// </div>
// => CSS variables provide runtime theming capability
// => Change :root variables for dark mode or brand themes
```

**Key Takeaway**: Import global CSS in `__root.tsx` to apply styles to the entire application. CSS custom properties in `:root` provide theme tokens accessible anywhere via `var(--name)`.

**Why It Matters**: CSS custom properties (variables) are the foundation of maintainable design systems. Defining colors, spacing, and typography as `:root` variables means changing the primary color in one place updates every button, link, and heading across the application. For TanStack Start specifically, CSS variables work seamlessly with SSR because they are part of the static stylesheet, not dynamic JavaScript. This enables dark mode and white-labeling without JavaScript-dependent theme management.

### Example 23: Static Asset Imports

Files in the `public/` directory are served as-is at the root URL. Import images and other assets directly in TypeScript for Vite to handle hashing and optimization.

```tsx
// public/logo.svg: placed in public/ for direct URL access
// app/assets/hero-image.png: placed in app/assets/ for import

// app/components/Header.tsx
// => Application header with logo and hero image
import heroImage from '../assets/hero-image.png'
// => Vite processes the import
// => heroImage: URL string like "/assets/hero-image-B3kR2.png"
// => Vite adds content hash for cache busting (B3kR2 part)
// => Image is copied to dist/assets/ on build

export function Header() {
  return (
    <header>
      <img
        src="/logo.svg"
        // => Public folder files: served at root URL directly
        // => /logo.svg: no hashing, URL never changes
        // => Use public/ for files that must have stable URLs
        // => (favicon.ico, robots.txt, etc.)
        alt="Company Logo"
        // => alt text: required for accessibility (WCAG 2.1)
        // => Screen readers announce: "Company Logo"
        width={120}
        height={40}
        // => width/height: prevent layout shift (CLS metric)
      />

      <img
        src={heroImage}
        // => Imported asset: URL includes content hash
        // => Browsers cache aggressively (hash changes when file changes)
        // => Better for performance than /public/ assets
        alt="Abstract background representing modern software architecture"
        // => Descriptive alt text: explains meaning, not appearance
        loading="lazy"
        // => lazy: defer loading until near viewport
        // => Improves initial page load performance (LCP metric)
      />
    </header>
  )
}
```

**Key Takeaway**: Files in `public/` are served at static URLs; imported assets in `app/` get content-hashed URLs for aggressive caching. Both patterns are supported out of the box.

**Why It Matters**: Content-hashed asset URLs enable production deployments with long cache lifetimes (1 year or more) without cache invalidation problems. When an image changes, Vite generates a new hash, new URL, and browsers download the fresh version automatically. This is one of the most impactful performance optimizations - returning users load cached assets instead of downloading them again. Public folder files are better for assets that must have predictable URLs (sitemaps, web manifest, verification files).

## Group 9: Advanced Beginner Patterns

### Example 24: Route Groups for Organization

TanStack Router supports grouping routes in directories for organizational purposes. Route groups do not affect the URL path.

```
app/routes/
├── (marketing)/
│   ├── index.tsx        # URL: /
│   ├── about.tsx        # URL: /about
│   └── pricing.tsx      # URL: /pricing
├── (app)/
│   ├── dashboard.tsx    # URL: /dashboard
│   └── profile.tsx      # URL: /profile
└── _authenticated.tsx   # Pathless layout (see Example 9)
```

```typescript
// app/routes/(marketing)/pricing.tsx
// => Parentheses: route group folder - does NOT affect URL
// => URL: /pricing (NOT /(marketing)/pricing)
// => Purely organizational: teams can own separate route groups
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pricing')({
  // => Path is '/pricing', NOT '/(marketing)/pricing'
  // => The (marketing) folder is invisible to the router
  // => Code generation strips parentheses from paths

  component: function PricingPage() {
    return (
      <main>
        <h1>Pricing</h1>
        {/* => Marketing pricing page */}
        <p>Simple, transparent pricing.</p>
        {/* => Content organized with (marketing) team's files */}
        {/* => Route group aids code ownership without URL pollution */}
      </main>
    )
  },
})
// => Route registered as '/pricing' in routeTree.gen.ts
// => Other routes in (marketing)/ also resolve without the group name
```

**Key Takeaway**: Parentheses `(groupName)` in route directory names create organizational groups that do not appear in the URL. Use them to organize routes by feature or team without changing URL structure.

**Why It Matters**: As applications grow, the `routes/` directory becomes unwieldy without organization. Route groups enable teams to own their routes in subdirectories while maintaining clean, user-facing URLs. A marketing team owns `(marketing)/`, a product team owns `(app)/`, and an API team owns `(api)/` - without any URL collisions or prefix pollution. This organizational pattern is essential for monorepo teams working on the same TanStack Start application.

### Example 25: Catch-All Routes

Catch-all routes use `$` or `$.tsx` to match multiple URL segments. They are useful for implementing wildcard redirects, 404 pages, or CMS content serving.

```typescript
// app/routes/$.tsx
// => $ alone (or $.tsx): matches any URL not matched by other routes
// => This is the catch-all: runs for /anything/not/found
// => Must be at the routes root for global catch-all
// => Or at /docs/$.tsx to catch all /docs/** routes

import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  // => '/$': the catch-all route path
  // => matches: /foo, /foo/bar, /a/b/c/d (all unmatched paths)

  loader: ({ params }) => {
    // => params._splat: the matched path segments
    // => For URL /docs/api/routes: params._splat is "docs/api/routes"
    // => For URL /missing-page: params._splat is "missing-page"

    const requestedPath = params['*']
    // => params['*']: the wildcard segments joined with '/'
    // => Could also be accessed as params._splat in some versions
    console.log('Unmatched path:', requestedPath)
    // => Log for analytics/monitoring: track 404 patterns

    throw notFound()
    // => Throw notFound() to trigger notFoundComponent
    // => Results in 404 HTTP status in SSR mode
  },

  component: function CatchAllPage() {
    // => Only renders if notFound() is NOT thrown (custom handling)
    return <p>Catch-all component (customize for your use case)</p>
    // => For global 404, prefer using notFoundComponent on __root.tsx
  },
})
// => Catch-all: last resort for any URL that doesn't match
// => Use for: analytics logging, legacy URL redirects, CMS slug matching
```

**Key Takeaway**: The `$.tsx` catch-all route matches any unregistered URL. Throw `notFound()` in its loader to send proper 404 responses, or handle the path for redirect logic.

**Why It Matters**: Catch-all routes are essential for content-heavy applications that serve URLs stored in a database (CMS content, user-generated pages, marketing landing pages). A headless CMS integration uses `$.tsx` to look up the requested path in a content database and either render the matching content or throw `notFound()`. Proper 404 handling with correct HTTP status codes prevents search engines from indexing broken links and keeps server logs clean for real error monitoring.

### Example 26: Scroll Restoration

TanStack Router provides scroll restoration that returns users to their previous scroll position when navigating back. Configure it once in the root layout.

```tsx
// app/routes/__root.tsx (updated)
// => Add scroll restoration to the root layout
import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router'
// => ScrollRestoration: component that manages scroll position
// => Saves scroll position when navigating away
// => Restores scroll position when navigating back

export const Route = createRootRoute({
  component: function RootLayout() {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
        </head>
        <body>
          <Outlet />
          {/* => Page content renders here */}

          <ScrollRestoration
            getKey={(location) => {
              // => getKey: function that determines the scroll key
              // => location: current location object
              // => location.pathname: the URL path

              return location.pathname
              // => Use pathname as scroll key
              // => Unique scroll position per URL
              // => Navigating to /products then back restores scroll
            }}
          />
          {/* => ScrollRestoration: no visible UI, manages behavior */}
          {/* => Place after <Outlet /> so it runs after render */}
        </body>
      </html>
    )
  },
})
// => Scroll restoration active: browser scroll position saved/restored
// => Works for: back button navigation, router.navigate({ history: 'push' })
// => Does NOT restore for: full page reloads (expected browser behavior)
```

**Key Takeaway**: `<ScrollRestoration>` placed in the root layout automatically saves and restores scroll positions on back navigation. Configure `getKey` to control the restoration scope.

**Why It Matters**: Scroll restoration is a fundamental UX expectation that users notice when it is missing. Without it, navigating back from a product detail page dumps users at the top of a long product list, forcing them to re-find their position. This is a major source of user frustration in e-commerce and content-heavy applications. The `getKey` function enables fine-grained control - you might want different scroll positions for the same route accessed with different search params (page 1 vs page 3 of a list).

### Example 27: Route Params in the `<Link>` Component

Type-safe links to dynamic routes require both `to` and `params`. TypeScript enforces that all required params are provided, preventing broken links at compile time.

```tsx
// app/routes/dashboard.tsx
// => Dashboard page with links to user profiles and product detail pages
import { createFileRoute, Link } from '@tanstack/react-router'

interface User {
  id: number
  name: string
}

interface Product {
  id: number
  title: string
}

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const users: User[] = [
      { id: 1, name: 'Amara' },
      { id: 2, name: 'Bilal' },
      // => Sample users (real app: fetch from API/DB)
    ]
    const products: Product[] = [
      { id: 101, title: 'Widget A' },
      { id: 102, title: 'Gadget B' },
      // => Sample products
    ]
    return { users, products }
    // => Returns both arrays for the component
  },

  component: function DashboardPage() {
    const { users, products } = Route.useLoaderData()
    // => Destructure users and products from loader data

    return (
      <div>
        <section>
          <h2>Users</h2>
          {users.map((user) => (
            <Link
              key={user.id}
              to="/users/$userId"
              // => to: dynamic route path with param placeholder
              params={{ userId: String(user.id) }}
              // => params: REQUIRED for dynamic routes (TypeScript enforces this)
              // => userId: String(1) → "1" (params are strings in URLs)
              // => Omitting params is a TypeScript ERROR
            >
              {user.name}
              {/* => Link text: "Amara", "Bilal" */}
            </Link>
          ))}
        </section>

        <section>
          <h2>Products</h2>
          {products.map((product) => (
            <Link
              key={product.id}
              to="/products/$productId"
              params={{ productId: String(product.id) }}
              // => productId: "101", "102"
              // => Generates hrefs: /products/101, /products/102
            >
              {product.title}
              {/* => Link text: "Widget A", "Gadget B" */}
            </Link>
          ))}
        </section>
      </div>
    )
  },
})
```

**Key Takeaway**: Dynamic route `<Link>` components require both `to` and `params` props. TypeScript validates that all required params for the target route are provided.

**Why It Matters**: In complex applications with dozens of dynamic routes, generating correct links is error-prone without type safety. TanStack Router's compile-time validation of `params` catches missing or misnamed parameters before they reach production. When a route is refactored from `/users/$userId` to `/members/$memberId`, TypeScript immediately shows every `<Link>` that needs updating. This transforms a potentially silent production bug (broken links) into a build-time error that is caught in the development workflow.

---

Congratulations on completing the beginner examples. You now understand TanStack Start's core routing model, file-based route definitions, loaders, error handling, navigation, head management, and styling.

Continue to [Intermediate](/en/learn/software-engineering/platform-web/tools/fe-tanstack-start/by-example/intermediate) to learn server functions, authentication, TanStack Query integration, and production data patterns.
