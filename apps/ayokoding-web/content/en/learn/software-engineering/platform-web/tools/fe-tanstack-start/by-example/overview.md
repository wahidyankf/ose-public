---
title: "Overview"
weight: 10000000
date: 2026-03-19T10:00:00+07:00
draft: false
description: "Learn TanStack Start through 80 heavily annotated code examples achieving 95% framework coverage"
tags: ["tanstack-start", "tanstack-router", "typescript", "fullstack", "by-example", "code-first", "examples"]
---

**Want to learn TanStack Start through code?** This by-example tutorial provides 80 heavily annotated examples covering 95% of TanStack Start + TypeScript. Master file-based routing, server functions, full-stack data patterns, and production deployment through working code rather than lengthy explanations.

**Critical prerequisite**: TanStack Start is built on TanStack Router and React. This guide assumes you understand React fundamentals and basic TypeScript. If you are new to React, complete a React fundamentals tutorial first.

## What Is By-Example Learning?

By-example learning is a **code-first approach** where you learn concepts through annotated, working examples rather than narrative explanations. Each example shows:

1. **Brief explanation** - What the TanStack Start concept is and when to use it
2. **Mermaid diagram** (when appropriate) - Visual representation of complex flows
3. **Heavily annotated code** - Working TypeScript code with 1-2.25 comment lines per code line
4. **Key Takeaway** - 1-2 sentence distillation of the pattern
5. **Why It Matters** - 50-100 words connecting the pattern to production relevance

This approach works best when you already understand React fundamentals and basic web development concepts. You learn TanStack Start's routing, server functions, loaders, and full-stack patterns by studying real code rather than theoretical descriptions.

## What Is TanStack Start?

TanStack Start is a **full-stack React framework built on TanStack Router and Vinxi**. It provides file-based routing, server functions, SSR, and a streaming-first architecture. Key distinctions:

- **Framework, not library**: TanStack Start provides complete application structure including routing, rendering, and server-side data patterns
- **React-based**: All React concepts apply; TanStack Start extends React with production full-stack features
- **Type-safe by design**: End-to-end type safety from route params to server functions
- **Built on TanStack Router**: The most type-safe router in the React ecosystem, now with full-stack capabilities
- **Vinxi-powered**: Uses Vinxi as the underlying build and server toolkit, enabling flexible deployment targets
- **Server Functions**: `createServerFn` enables type-safe server-side logic without manual API routes
- **Streaming-first**: Built-in support for React Suspense and streaming SSR out of the box

## Learning Path

```mermaid
graph TD
  A["Beginner<br/>Core Routing & Loaders<br/>Examples 1-27"] --> B["Intermediate<br/>Server Functions & Auth<br/>Examples 28-55"]
  B --> C["Advanced<br/>SSR, Deployment & Scale<br/>Examples 56-80"]
  D["0%<br/>React + TypeScript<br/>#40;Prerequisite#41;"] -.-> A
  C -.-> E["95%<br/>Framework Mastery"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#DE8F05,stroke:#000,color:#fff
  style C fill:#029E73,stroke:#000,color:#fff
  style D fill:#CC78BC,stroke:#000,color:#fff
  style E fill:#029E73,stroke:#000,color:#fff
```

**Color Legend**: Blue (beginner), Orange (intermediate), Green (advanced/mastery), Purple (prerequisite)

## Coverage Philosophy: 95% Through 80 Examples

The **95% coverage** means you will understand TanStack Start deeply enough to build production applications with confidence. It does not mean you will know every edge case or advanced optimization - those come with experience.

The 80 examples are organized progressively:

- **Beginner (Examples 1-27)**: Foundation concepts - project setup, file-based routing, `createFileRoute`, route params, search params, layout routes, Link component, navigation, loaders (`beforeLoad`/`loader`), pending states, error boundaries, not-found handling, head/meta management, static assets, and CSS/styling
- **Intermediate (Examples 28-55)**: Production patterns - server functions (`createServerFn`), mutations, form handling, authentication, sessions, middleware, data caching via TanStack Query, optimistic updates, parallel data loading, route context, guards/redirects, API routes, WebSocket, testing, and streaming/Suspense
- **Advanced (Examples 56-80)**: Scale and optimization - SSR streaming patterns, deployment targets (Vercel, Node, Bun), custom server, middleware composition, advanced caching, prefetching strategies, code splitting, environment variables, error management, SEO, ISR/SSG-like patterns, production patterns, performance optimization, and monitoring

Together, these examples cover **95% of what you will use** in production TanStack Start applications.

## Annotation Density: 1-2.25 Comments Per Code Line

**Critical**: All examples maintain **1-2.25 comment lines per code line per example** to ensure deep understanding.

**What this means**:

- Simple lines get 1 annotation explaining purpose or result
- Complex lines get 2+ annotations explaining behavior, state changes, and side effects
- Use `// =>` notation to show expected values, outputs, or state changes

**Example**:

```typescript
// app/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'
// => Import createFileRoute factory from TanStack Router
// => This function creates type-safe route definitions

export const Route = createFileRoute('/')({
  // => Defines the root route '/'
  // => Route object exported as named 'Route' (convention required)

  loader: async () => {
    // => loader runs on server before component renders
    // => Can be async, can fetch data, access DB

    const greeting = 'Marhaba, world!'
    // => greeting is "Marhaba, world!" (type: string)

    return { greeting }
    // => Returns plain object to component as loaderData
  },

  component: function IndexPage() {
    // => Component receives loader data via useLoaderData

    const { greeting } = Route.useLoaderData()
    // => Destructures greeting from loader return value
    // => greeting is "Marhaba, world!" (type: string)
    // => Fully type-safe: TypeScript infers from loader return type

    return <h1>{greeting}</h1>
    // => Renders: <h1>Marhaba, world!</h1>
  },
})
```

This density ensures each example is self-contained and fully comprehensible without external documentation.

## Structure of Each Example

All examples follow a consistent five-part format:

```markdown
### Example N: Descriptive Title

2-3 sentence explanation of the TanStack Start concept.

(Optional Mermaid diagram for complex flows)

(Heavily annotated code with 1-2.25 comment lines per code line)

**Key Takeaway**: 1-2 sentence summary.

**Why It Matters**: 50-100 words connecting the pattern to production applications.
```

**Code annotations**:

- `// =>` shows expected output, state changes, or results
- Inline comments explain what each line does
- Variable names are self-documenting
- Type annotations make data flow explicit

## What Is Covered

### Core Routing Concepts

- **File-based routing**: Route files map to URL paths, `createFileRoute` factory
- **Route params**: Dynamic segments `$param`, typed param access
- **Search params**: URL query parameters with validation
- **Layout routes**: Nested layouts with `Outlet`, route grouping
- **Link component**: Type-safe navigation, preloading, active styles
- **Programmatic navigation**: `useNavigate`, `router.navigate`

### Data Loading

- **`loader` function**: Route-level data fetching before render
- **`beforeLoad` function**: Pre-loader guard/redirect logic
- **`useLoaderData`**: Type-safe access to loader return data
- **Pending states**: `pendingComponent`, `pendingMs`, loading UI
- **Error boundaries**: `errorComponent`, error retry, error types
- **Not-found handling**: `notFoundComponent`, `notFound()` throw

### Server Functions

- **`createServerFn`**: Type-safe RPC to server without API routes
- **HTTP methods**: `.validator()`, `.handler()` chaining
- **Mutations**: Server functions with side effects
- **Form handling**: Form submission with server functions
- **Middleware**: `createMiddleware` for cross-cutting server logic

### Full-Stack Patterns

- **Authentication**: Session management, protected routes
- **TanStack Query integration**: Caching, invalidation, optimistic updates
- **Parallel loading**: Multiple loaders composing data
- **Route context**: Shared data/services via `context` option
- **API routes**: HTTP endpoints alongside UI routes

### TypeScript Integration

- **Route type safety**: Inferred param types, loader return types
- **Server function types**: Input/output types flow end-to-end
- **`useParams`**: Typed dynamic param access
- **`useSearch`**: Typed search param access
- **`ValidateSearch`**: Search param validation schemas

### Production & Deployment

- **SSR streaming**: Server-rendered HTML with streaming Suspense
- **Deployment targets**: Vercel, Node.js, Bun, Deno via Vinxi adapters
- **Environment variables**: `process.env` on server, Vite env on client
- **Code splitting**: Automatic route-level splitting
- **Prefetching**: Link hover prefetch, `router.preloadRoute`
- **SEO**: `useHead`, meta tags, canonical links

## What Is NOT Covered

We exclude topics that belong in specialized tutorials:

- **React Fundamentals**: JSX, components, props, state, hooks (see React tutorial)
- **Advanced TypeScript**: Deep TypeScript features unrelated to TanStack Start
- **State Management Libraries**: Redux, Zustand (TanStack Query covers server state)
- **Testing Deep Dives**: Advanced testing strategies (separate testing tutorial)
- **Vinxi Internals**: Build tool details (TanStack Start abstracts this)
- **React Native**: Mobile development (separate tutorial)

## Prerequisites

### Required

- **React fundamentals**: Components, props, state, hooks, JSX
- **JavaScript fundamentals**: ES6+ syntax, async/await, destructuring
- **TypeScript basics**: Basic types, interfaces, generics
- **HTML/CSS**: Basic web fundamentals, DOM concepts
- **Programming experience**: You have built applications before

### Recommended

- **Web APIs**: Fetch API, FormData, browser storage
- **Asynchronous JavaScript**: Promises, async/await patterns
- **Modern tooling**: npm/yarn, command-line basics
- **HTTP basics**: Request methods, status codes, headers

### Not Required

- **TanStack Start experience**: This guide assumes you are new to TanStack Start
- **TanStack Router experience**: We explain router concepts as needed
- **Server-side development**: We teach server concepts as needed

## Getting Started

Before starting the examples, ensure you have basic environment setup:

```bash
npm create tanstack@latest
# Choose: Start, TypeScript, file-based routing
cd my-app
npm install
npm run dev
```

## Ready to Start?

Choose your learning path:

- [Beginner](/en/learn/software-engineering/platform-web/tools/fe-tanstack-start/by-example/beginner) - Start here if new to TanStack Start. Build foundation understanding through core examples covering file-based routing, loaders, error handling, and navigation.
- [Intermediate](/en/learn/software-engineering/platform-web/tools/fe-tanstack-start/by-example/intermediate) - Master production patterns through examples covering server functions, authentication, TanStack Query integration, forms, and middleware.
- [Advanced](/en/learn/software-engineering/platform-web/tools/fe-tanstack-start/by-example/advanced) - Expert mastery through examples covering SSR streaming, deployment targets, performance optimization, and production patterns.

Or jump to specific topics by searching for relevant example keywords (server functions, loaders, authentication, TanStack Query, forms, middleware, streaming, deployment, etc.).
