---
title: Next.js Framework
description: React meta-framework for production-ready web applications with server-side rendering, static generation, and full-stack capabilities
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - react
  - typescript
  - ssr
  - ssg
  - framework
  - full-stack
  - index
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-01-26
updated: 2026-01-26
---

# Next.js Framework

**Understanding-oriented documentation** for Next.js framework in the open-sharia-enterprise platform.

## Overview

Next.js is a React meta-framework that provides a production-ready foundation for building modern web applications. It combines React's component model with server-side rendering, static site generation, API routes, and optimized performance features out of the box.

This documentation covers Next.js 16+ with the App Router, TypeScript 5+, and React Server Components, focusing on full-stack application development for enterprise-grade financial systems.

## Framework Standards

**This documentation is the authoritative reference** for Next.js usage standards in the open-sharia-enterprise platform.

All Next.js applications MUST follow the patterns and practices documented here:

1. **[Idioms](ex-soen-plwe-to-fene__idioms.md)** - Next.js-specific patterns
2. **[Best Practices](ex-soen-plwe-to-fene__best-practices.md)** - Framework standards
3. **[Anti-Patterns](ex-soen-plwe-to-fene__anti-patterns.md)** - Common mistakes
4. **[App Router](ex-soen-plwe-to-fene__app-router.md)** - App Router architecture
5. **[Server Components](ex-soen-plwe-to-fene__server-components.md)** - Server Components patterns

**For Agents**: Reference this documentation when building Next.js applications.

**Language Standards**: Also follow [TypeScript](../../../programming-languages/typescript/README.md) and [React](../fe-react/README.md) standards.

### Quick Standards Reference

- **Project Structure**: See [Architecture Integration](#architecture-integration)
- **Routing**: See [Routing](ex-soen-plwe-to-fene__routing.md)
- **Data Fetching**: See [Data Fetching](ex-soen-plwe-to-fene__data-fetching.md)
- **Testing**: See [Testing](ex-soen-plwe-to-fene__testing.md)
- **Performance**: See [Performance](ex-soen-plwe-to-fene__performance.md)

## Software Engineering Principles

Next.js usage in this platform follows the the software engineering principles from [governance/principles/software-engineering/](../../../../../../governance/principles/software-engineering/README.md):

1. **[Automation Over Manual](../../../../../../governance/principles/software-engineering/automation-over-manual.md)** - Next.js automates through Fast Refresh, automatic code splitting, image optimization, font optimization
2. **[Explicit Over Implicit](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)** - Next.js enforces through file-system routing, explicit data fetching, clear rendering strategies
3. **[Immutability Over Mutability](../../../../../../governance/principles/software-engineering/immutability.md)** - Use immutable state updates, Server Components (read-only), pure server functions
4. **[Pure Functions Over Side Effects](../../../../../../governance/principles/software-engineering/pure-functions.md)** - Server Components are pure, Server Actions handle side effects, functional core patterns
5. **[Reproducibility First](../../../../../../governance/principles/software-engineering/reproducibility.md)** - Next.js enables through Volta pinning, package-lock.json, consistent builds, predictable caching

**See Also**: [Functional Programming](ex-soen-plwe-to-fene__functional-programming.md) for FP patterns with Next.js.

## Quick Reference

**Jump to:**

- [Overview](#overview) - Next.js in the platform
- [Software Engineering Principles](#software-engineering-principles) - the core principles
- [Next.js Version Strategy](#nextjs-version-strategy) - Version management
- [Documentation Structure](#documentation-structure) - Guide to documentation files
- [Key Capabilities](#key-capabilities) - Framework features
- [Use Cases](#use-cases) - When to use Next.js
- [Architecture Integration](#architecture-integration) - App Router, DDD, RSC
- [Development Workflow](#development-workflow) - Setup, configuration, testing
- [Learning Path](#learning-path) - Recommended reading order
- [Code Examples from Platform](#code-examples-from-platform) - Real implementations
- [Integration with Other Documentation](#integration-with-other-documentation) - Cross-references
- [Next.js Ecosystem](#nextjs-ecosystem) - Libraries and integrations
- [Tools and Development Environment](#tools-and-development-environment) - Build tools, IDEs
- [Resources and References](#resources-and-references) - External resources
- [Related Documentation](#related-documentation) - Cross-references

**Core Documentation:**

- [Idioms](ex-soen-plwe-to-fene__idioms.md) - Next.js patterns (App Router, Server Components, Server Actions)
- [Best Practices](ex-soen-plwe-to-fene__best-practices.md) - Framework coding standards
- [Anti-Patterns](ex-soen-plwe-to-fene__anti-patterns.md) - Common Next.js mistakes
- [App Router](ex-soen-plwe-to-fene__app-router.md) - File-system routing, layouts, loading states
- [Routing](ex-soen-plwe-to-fene__routing.md) - Dynamic routes, route groups, parallel routes
- [Server Components](ex-soen-plwe-to-fene__server-components.md) - RSC patterns, composition, streaming
- [Data Fetching](ex-soen-plwe-to-fene__data-fetching.md) - Server-side fetching, caching, revalidation
- [Rendering](ex-soen-plwe-to-fene__rendering.md) - SSR, SSG, ISR, CSR strategies
- [API Routes](ex-soen-plwe-to-fene__api-routes.md) - Route handlers, API design
- [Middleware](ex-soen-plwe-to-fene__middleware.md) - Edge middleware, request modification
- [Performance](ex-soen-plwe-to-fene__performance.md) - Optimization strategies
- [Testing](ex-soen-plwe-to-fene__testing.md) - Testing Next.js applications
- [Deployment](ex-soen-plwe-to-fene__deployment.md) - Vercel, self-hosting, Docker
- [Configuration](ex-soen-plwe-to-fene__configuration.md) - next.config.js, environment variables
- [Styling](ex-soen-plwe-to-fene__styling.md) - CSS Modules, Tailwind, CSS-in-JS
- [TypeScript](ex-soen-plwe-to-fene__typescript.md) - TypeScript integration
- [Security](ex-soen-plwe-to-fene__security.md) - Security best practices
- [Accessibility](ex-soen-plwe-to-fene__accessibility.md) - WCAG compliance
- [Domain-Driven Design](ex-soen-plwe-to-fene__domain-driven-design.md) - DDD with Next.js
- [Functional Programming](ex-soen-plwe-to-fene__functional-programming.md) - FP patterns
- [Version Migration](ex-soen-plwe-to-fene__version-migration.md) - Upgrading Next.js

## Next.js Version Strategy

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% All colors are color-blind friendly and meet WCAG AA contrast standards

timeline
    title Next.js Version Timeline (2020-2026)
    2020-10 : Next.js 10 : Automatic Image Optimization : Internationalization
    2021-06 : Next.js 11 : Webpack 5 default : Script Optimization
    2022-10 : Next.js 13 : App Router (beta) : Turbopack (alpha) : React Server Components
    2023-05 : Next.js 13.4 : App Router stable : Server Actions (alpha)
    2024-05 : Next.js 16 : Turbopack improvements : Server Actions stable : Partial Prerendering (preview)
    2024-10 : Next.js 15 : React 19 support : Async Request APIs : Enhanced caching
    2025-Q2 : Next.js 15.1+ : Turbopack stable : PPR stable : Performance improvements
    2026-02 : Next.js 16 : React 19 support : Major framework upgrade
```

**Platform Strategy**: Next.js 16 (current)

### Current Version: Next.js 16

**Platform Standard**: Next.js 16 is the target version for all Next.js projects.

**Rationale**:

- Stable App Router with React Server Components
- Server Actions for mutations (stable)
- Turbopack for faster development builds
- Partial Prerendering (preview feature)
- Enhanced image and font optimization
- Improved TypeScript support
- Better developer experience with Fast Refresh

**Key Features**:

- App Router - File-system based routing with layouts
- React Server Components - Zero-bundle server components
- Server Actions - Progressive enhancement for forms
- Streaming - Incremental content loading
- Parallel Routes - Multiple pages in same layout
- Intercepting Routes - Modal-like experiences
- Route Groups - Organize without affecting URL
- TypeScript Plugin - Better type checking and autocomplete

### Next.js 15 (Adopted via Next.js 16 Migration)

**Released**: October 2024

The platform migrated directly to Next.js 16 in 2026-02, incorporating all Next.js 15
features in a single upgrade step. Next.js 15 features are therefore fully available:

- React 19 support
- Async Request APIs (`cookies()`, `headers()`, `params`, `searchParams`)
- Turbopack Dev (stable)
- Enhanced caching control
- Partial Prerendering (stable)
- Improved error handling
- Better instrumentation

## Documentation Structure

### [Next.js Idioms](ex-soen-plwe-to-fene__idioms.md)

Framework-specific patterns for writing idiomatic Next.js applications.

**Covers**:

- App Router file conventions (page, layout, loading, error)
- React Server Components patterns
- Server Actions for mutations
- Route segment configuration (dynamic, generateStaticParams)
- Metadata API for SEO
- Image and Font optimization
- Link component for navigation
- Script component for third-party scripts
- Streaming with Suspense
- Edge and Node.js runtimes

### [Next.js Best Practices](ex-soen-plwe-to-fene__best-practices.md)

Proven approaches for building production-ready Next.js applications.

**Covers**:

- Project structure and organization
- App Router architecture patterns
- Server vs Client Component decisions
- Data fetching strategies (server-side, client-side)
- Caching and revalidation patterns
- Error handling and error boundaries
- Loading states and skeletons
- Form handling with Server Actions
- SEO optimization with Metadata API
- Performance best practices
- Security considerations (CSRF, XSS)
- Deployment strategies

### [Next.js Anti-Patterns](ex-soen-plwe-to-fene__anti-patterns.md)

Common mistakes and problematic patterns to avoid.

**Covers**:

- Using Client Components unnecessarily
- Fetching data in Client Components when server-side is better
- Missing loading and error states
- Improper caching strategies
- Over-fetching data from databases
- Not using Server Actions for mutations
- Ignoring parallel data fetching opportunities
- Incorrect use of dynamic vs static rendering
- Missing metadata for SEO
- Performance anti-patterns (unoptimized images, blocking resources)

### Documentation Organization

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% All colors are color-blind friendly and meet WCAG AA contrast standards

flowchart TD
    A["Next.js Documentation"]:::blue
    B["Core Patterns"]:::teal
    C["Architecture"]:::teal
    D["Advanced Topics"]:::purple
    E["Integration"]:::orange
    F["Templates"]:::purple

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F

    B --> B1["Idioms"]
    B --> B2["Best Practices"]
    B --> B3["Anti-Patterns"]

    C --> C1["App Router"]
    C --> C2["Server Components"]
    C --> C3["Routing"]
    C --> C4["Data Fetching"]

    D --> D1["Rendering"]
    D --> D2["API Routes"]
    D --> D3["Middleware"]
    D --> D4["Performance"]

    E --> E1["Testing"]
    E --> E2["Deployment"]
    E --> E3["TypeScript"]
    E --> E4["Styling"]

    F --> F1["Page Template"]
    F --> F2["Layout Template"]
    F --> F3["API Route Template"]
    F --> F4["Server Action Template"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
```

### Specialized Topics

Deep-dive documentation on critical Next.js areas:

#### [Next.js App Router](ex-soen-plwe-to-fene__app-router.md)

Comprehensive guide to the App Router architecture.

**Covers**:

- File-system based routing conventions
- Layouts and nested layouts
- Pages and route segments
- Loading UI with loading.tsx
- Error handling with error.tsx
- Not Found pages with not-found.tsx
- Route groups with (folder) syntax
- Private folders with \_folder syntax
- Parallel routes with @folder syntax
- Intercepting routes with (.)folder syntax
- Dynamic routes with [param] syntax
- Catch-all routes with [...param] syntax
- Template vs Layout differences
- Route segment configuration

#### [Next.js Routing](ex-soen-plwe-to-fene__routing.md)

Comprehensive guide to routing patterns and navigation.

**Covers**:

- Dynamic routes and route parameters
- Route groups for organization
- Parallel routes for simultaneous rendering
- Intercepting routes for modals
- Navigation with Link component
- Programmatic navigation with useRouter
- Middleware for route protection
- Redirects and rewrites
- Route handlers for API endpoints
- generateStaticParams for static generation
- Route segment config (dynamic, revalidate)
- TypeScript types for params and searchParams

#### [Next.js Server Components](ex-soen-plwe-to-fene__server-components.md)

Comprehensive guide to React Server Components in Next.js.

**Covers**:

- Server Components fundamentals
- Server vs Client Component decisions
- "use client" directive placement
- Server-only code patterns
- Composing Server and Client Components
- Passing props from Server to Client Components
- Server Component patterns (data fetching, security)
- Streaming with Suspense
- Server Component limitations
- Context providers in App Router
- Third-party library integration
- Server Actions integration

#### [Next.js Data Fetching](ex-soen-plwe-to-fene__data-fetching.md)

Comprehensive guide to data fetching strategies.

**Covers**:

- Server-side data fetching with async/await
- fetch API with automatic caching
- Cache and revalidation strategies
- Parallel data fetching
- Sequential data fetching
- Streaming with Suspense and Server Components
- Client-side data fetching (SWR, React Query)
- Server Actions for mutations
- Form handling with useFormState
- Optimistic updates with useOptimistic
- Data fetching in Server Components vs Route Handlers
- Database access patterns (direct queries, ORMs)

#### [Next.js Rendering](ex-soen-plwe-to-fene__rendering.md)

Comprehensive guide to rendering strategies.

**Covers**:

- Static rendering (SSG) - Default behavior
- Dynamic rendering (SSR) - With dynamic functions
- Streaming - Progressive rendering
- Partial Prerendering (PPR) - Static + Dynamic
- Client-side rendering - Use Client hydration
- Incremental Static Regeneration (ISR) - Revalidation
- On-demand revalidation - revalidatePath, revalidateTag
- Route segment configuration (dynamic, revalidate)
- generateStaticParams for static paths
- Force dynamic with unstable_noStore
- Runtime configuration (edge, nodejs)

#### [Next.js API Routes](ex-soen-plwe-to-fene__api-routes.md)

Comprehensive guide to API routes and route handlers.

**Covers**:

- Route Handlers (GET, POST, PUT, DELETE, PATCH)
- Request and Response objects
- Route parameters and search params
- Request body parsing (JSON, FormData)
- Response types (JSON, streaming, redirects)
- Error handling in route handlers
- CORS configuration
- Authentication and authorization
- Rate limiting patterns
- Edge vs Node.js runtime
- Webhooks handling
- File uploads
- API versioning strategies

#### [Next.js Middleware](ex-soen-plwe-to-fene__middleware.md)

Comprehensive guide to Edge middleware.

**Covers**:

- Middleware fundamentals and execution
- Request and response modification
- Redirects and rewrites in middleware
- Setting headers and cookies
- Authentication in middleware
- Geolocation and A/B testing
- Bot detection and rate limiting
- Middleware configuration (matcher)
- NextResponse API
- Edge runtime limitations
- Middleware performance considerations
- Chaining middleware logic

#### [Next.js Performance](ex-soen-plwe-to-fene__performance.md)

Comprehensive guide to performance optimization.

**Covers**:

- Image optimization with next/image
- Font optimization with next/font
- Script optimization with next/script
- Code splitting and lazy loading
- Bundle analysis and optimization
- Static vs dynamic rendering decisions
- Caching strategies (full route cache, data cache, router cache)
- Streaming and Suspense boundaries
- Parallel data fetching
- Prefetching with Link component
- Web Vitals monitoring
- Performance profiling
- Edge vs Node.js runtime decisions

#### [Next.js Testing](ex-soen-plwe-to-fene__testing.md)

Comprehensive guide to testing Next.js applications.

**Covers**:

- Unit testing components (Vitest, Jest)
- Testing Server Components
- Testing Client Components
- Testing Server Actions
- Integration testing with React Testing Library
- E2E testing with Playwright
- Testing API routes
- Testing middleware
- Mock data and MSW (Mock Service Worker)
- Testing redirects and rewrites
- Testing metadata generation
- Testing with different rendering strategies

#### [Next.js Deployment](ex-soen-plwe-to-fene__deployment.md)

Comprehensive guide to deployment strategies.

**Covers**:

- Vercel deployment (recommended)
- Self-hosting with Node.js server
- Docker containerization
- Static export limitations
- Environment variables configuration
- Build optimization
- CDN and caching strategies
- Incremental Static Regeneration in production
- Monitoring and observability
- Performance monitoring (Vercel Analytics, Web Vitals)
- Error tracking (Sentry integration)
- CI/CD integration

#### [Next.js Configuration](ex-soen-plwe-to-fene__configuration.md)

Comprehensive guide to Next.js configuration.

**Covers**:

- next.config.js options
- Environment variables (.env files)
- TypeScript configuration (next.config.ts)
- Custom Webpack configuration
- Turbopack configuration
- Image domains and remotePatterns
- Redirects and rewrites configuration
- Headers configuration
- Internationalization (i18n) setup
- Experimental features configuration
- Runtime configuration
- Output configuration (standalone, export)

#### [Next.js Styling](ex-soen-plwe-to-fene__styling.md)

Comprehensive guide to styling approaches.

**Covers**:

- CSS Modules (recommended for scoped styles)
- Global CSS and CSS imports
- Tailwind CSS integration
- CSS-in-JS solutions (styled-components, Emotion)
- Sass/SCSS configuration
- PostCSS configuration
- Font optimization with next/font
- Dark mode implementation
- CSS variables for theming
- Responsive design patterns
- Animation and transitions
- Styling Server vs Client Components

#### [Next.js TypeScript](ex-soen-plwe-to-fene__typescript.md)

Comprehensive guide to TypeScript integration.

**Covers**:

- TypeScript configuration for Next.js
- Typing page components and layouts
- Typing route params and search params
- Typing Server Actions
- Typing API routes
- Typing middleware
- Typing metadata and generateMetadata
- next.config.ts vs next.config.js
- TypeScript Plugin features
- Type-safe environment variables
- Typing external libraries
- Common TypeScript patterns in Next.js

#### [Next.js Security](ex-soen-plwe-to-fene__security.md)

Comprehensive guide to security best practices.

**Covers**:

- Server Actions security (CSRF protection)
- API route authentication and authorization
- Environment variables and secrets management
- XSS prevention in Server and Client Components
- SQL injection prevention
- CORS configuration
- Content Security Policy (CSP)
- Secure headers configuration
- Authentication patterns (NextAuth.js)
- Rate limiting and abuse prevention
- Input validation and sanitization
- OWASP Top 10 for Next.js applications

#### [Next.js Accessibility](ex-soen-plwe-to-fene__accessibility.md)

Comprehensive guide to accessibility.

**Covers**:

- Semantic HTML in Server Components
- ARIA attributes and roles
- Keyboard navigation
- Focus management with useRef
- Screen reader support
- next/image alt text requirements
- Form accessibility
- Error message accessibility
- Loading state accessibility
- Route transition announcements
- WCAG AA compliance checklist
- Testing accessibility (axe, Lighthouse)

#### [Next.js Domain-Driven Design](ex-soen-plwe-to-fene__domain-driven-design.md)

Comprehensive guide to DDD patterns with Next.js.

**Covers**:

- Feature-based folder structure
- Bounded contexts organization
- Domain models with TypeScript
- Server Actions as application services
- Server Components for read models
- Route handlers for external APIs
- Aggregates and entities in Server Components
- Repository pattern with Server Actions
- Domain events handling
- CQRS patterns with Next.js
- Financial examples: Zakat, Murabaha, Waqf features

#### [Next.js Functional Programming](ex-soen-plwe-to-fene__functional-programming.md)

Comprehensive guide to FP patterns.

**Covers**:

- Pure Server Components
- Immutable data patterns
- Server Actions as functional side effects
- Function composition in utilities
- Type-safe error handling (Result types)
- Functional form handling
- Stream processing patterns
- Composable data transformations
- Functional testing strategies
- FP libraries integration (fp-ts, Effect)

#### [Next.js Version Migration](ex-soen-plwe-to-fene__version-migration.md)

Comprehensive guide to upgrading Next.js versions.

**Covers**:

- Next.js 13 to 14 migration
- Pages Router to App Router migration (codemods)
- React Server Components adoption
- Server Actions migration from API routes
- Metadata API migration
- Image Component updates
- Link Component changes
- Font optimization migration
- Breaking changes and deprecations
- Step-by-step migration strategy

## Key Capabilities

### Full-Stack Framework

Next.js provides complete application infrastructure:

- **File-System Routing** - Intuitive routing based on folder structure
- **React Server Components** - Zero-bundle server-rendered components
- **Server Actions** - Type-safe server functions for mutations
- **API Routes** - Build APIs alongside frontend
- **Middleware** - Edge functions for request modification
- **Built-in Optimization** - Images, fonts, scripts automatically optimized

### Rendering Strategies

Flexible rendering for optimal performance:

- **Static Generation (SSG)** - Pre-render at build time (default)
- **Server-Side Rendering (SSR)** - Render on each request
- **Incremental Static Regeneration (ISR)** - Update static pages after build
- **Streaming** - Progressive server rendering with Suspense
- **Partial Prerendering (PPR)** - Mix static and dynamic in one route
- **Client-Side Rendering (CSR)** - React hydration for interactivity

### Built-in Optimizations

Production-ready out of the box:

- **Automatic Code Splitting** - Per-route code bundles
- **Image Optimization** - Responsive images with lazy loading
- **Font Optimization** - Self-hosted fonts with zero layout shift
- **Script Optimization** - Control third-party script loading
- **Route Prefetching** - Prefetch pages on Link hover/viewport
- **Fast Refresh** - Instant feedback during development

### Developer Experience

Excellent development workflow:

- **TypeScript First** - Built-in TypeScript support
- **ESLint Integration** - Opinionated linting rules
- **Fast Refresh** - Instant updates without losing state
- **Error Overlay** - Clear error messages in development
- **Turbopack** - Fast development builds (Next.js 16+)
- **Vercel Deployment** - One-click deployment

## Use Cases

**Use Next.js when you need:**

✅ Full-stack React applications with backend capabilities
✅ SEO-critical content (blogs, marketing sites, e-commerce)
✅ Server-side rendering for dynamic content
✅ Static site generation with dynamic capabilities (ISR)
✅ API routes without separate backend
✅ Optimized performance (images, fonts, code splitting)
✅ Type-safe full-stack development with TypeScript
✅ Edge computing with middleware
✅ Streaming and progressive rendering
✅ Modern development experience with Fast Refresh

**Consider alternatives when:**

❌ Building a pure SPA without SEO needs - use Vite + React
❌ Backend-heavy application - use Spring Boot, Phoenix
❌ Real-time collaboration features - consider Phoenix LiveView
❌ Extreme customization of build process - use custom Webpack setup
❌ Static-only site with no dynamic features - use Astro or Hugo

## Architecture Integration

### Next.js Project Structure

Feature-based organization aligned with Next.js App Router:

```
apps/oseplatform-web-nextjs/
├── src/
│   ├── app/                        # App Router (file-system routing)
│   │   ├── (marketing)/           # Route group (doesn't affect URL)
│   │   │   ├── page.tsx           # / route
│   │   │   └── about/
│   │   │       └── page.tsx       # /about route
│   │   ├── (platform)/            # Platform route group
│   │   │   ├── layout.tsx         # Platform-wide layout
│   │   │   ├── zakat/             # Zakat feature
│   │   │   │   ├── page.tsx       # /zakat
│   │   │   │   ├── calculate/
│   │   │   │   │   ├── page.tsx   # /zakat/calculate
│   │   │   │   │   └── loading.tsx
│   │   │   │   └── history/
│   │   │   │       └── page.tsx   # /zakat/history
│   │   │   ├── donations/
│   │   │   └── loans/
│   │   ├── api/                   # API routes
│   │   │   ├── zakat/
│   │   │   │   └── route.ts       # /api/zakat
│   │   │   └── health/
│   │   │       └── route.ts       # /api/health
│   │   ├── layout.tsx             # Root layout
│   │   ├── error.tsx              # Error boundary
│   │   ├── loading.tsx            # Loading UI
│   │   └── not-found.tsx          # 404 page
│   ├── features/                  # Feature modules
│   │   ├── zakat/
│   │   │   ├── components/        # Client Components
│   │   │   │   ├── ZakatForm.tsx
│   │   │   │   └── ZakatResult.tsx
│   │   │   ├── actions/           # Server Actions
│   │   │   │   └── calculateZakat.ts
│   │   │   ├── api/               # API clients (if needed)
│   │   │   ├── types/
│   │   │   │   └── zakat.types.ts
│   │   │   └── utils/
│   │   │       └── zakatRules.ts
│   │   ├── donations/
│   │   └── loans/
│   ├── components/                # Shared components
│   │   ├── ui/                    # UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   └── providers/             # Context providers
│   │       └── ThemeProvider.tsx
│   ├── lib/                       # Utilities and services
│   │   ├── db/                    # Database client
│   │   │   ├── client.ts
│   │   │   └── schema/
│   │   ├── auth/                  # Authentication
│   │   ├── utils/
│   │   └── constants.ts
│   └── middleware.ts              # Edge middleware
├── public/                        # Static assets
│   ├── images/
│   └── fonts/
├── .env.local                     # Local environment variables
├── .env.example                   # Environment template
├── next.config.ts                 # Next.js configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.ts             # Tailwind CSS config
└── package.json                   # Dependencies
```

### Server Components Architecture

Next.js App Router uses React Server Components by default:

**Server Component** (default, no "use client"):

```typescript
// app/(platform)/zakat/page.tsx
import { calculateZakatEligibility } from '@/features/zakat/utils/zakatRules';
import { ZakatForm } from '@/features/zakat/components/ZakatForm';
import { db } from '@/lib/db/client';

interface PageProps {
  searchParams: { wealth?: string; nisab?: string };
}

// Server Component - runs on server, zero client bundle
export default async function ZakatCalculatorPage({ searchParams }: PageProps) {
  // Can directly access database, environment variables, file system
  const nisabThreshold = await db.nisab.findFirst({
    orderBy: { date: 'desc' },
  });

  // Can perform calculations on server
  const wealth = searchParams.wealth ? parseFloat(searchParams.wealth) : 0;
  const eligibility = calculateZakatEligibility(wealth, nisabThreshold.amount);

  return (
    <div>
      <h1>Zakat Calculator</h1>
      <ZakatForm defaultNisab={nisabThreshold.amount} />
      {eligibility && (
        <div>
          <p>Wealth: {wealth}</p>
          <p>Nisab: {nisabThreshold.amount}</p>
          <p>Eligible: {eligibility.isEligible ? 'Yes' : 'No'}</p>
          {eligibility.isEligible && <p>Zakat Amount: {eligibility.zakatAmount}</p>}
        </div>
      )}
    </div>
  );
}
```

**Client Component** (interactive, with "use client"):

```typescript
// features/zakat/components/ZakatForm.tsx
'use client';

import { useState } from 'react';
import { calculateZakat } from '@/features/zakat/actions/calculateZakat';
import { useFormState } from 'react-dom';

interface ZakatFormProps {
  defaultNisab: number;
}

// Client Component - runs in browser, interactive
export function ZakatForm({ defaultNisab }: ZakatFormProps) {
  const [wealth, setWealth] = useState('');
  const [state, formAction] = useFormState(calculateZakat, null);

  return (
    <form action={formAction}>
      <label>
        Your Wealth:
        <input
          type="number"
          name="wealth"
          value={wealth}
          onChange={(e) => setWealth(e.target.value)}
          required
        />
      </label>

      <input type="hidden" name="nisab" value={defaultNisab} />

      <button type="submit">Calculate Zakat</button>

      {state?.error && <p className="error">{state.error}</p>}
      {state?.result && (
        <div className="result">
          <p>Zakat Amount: {state.result.zakatAmount}</p>
          <p>Eligible: {state.result.eligible ? 'Yes' : 'No'}</p>
        </div>
      )}
    </form>
  );
}
```

**Server Action** (mutations):

```typescript
// features/zakat/actions/calculateZakat.ts
"use server";

import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface CalculationResult {
  zakatAmount: number;
  eligible: boolean;
}

interface FormState {
  result?: CalculationResult;
  error?: string;
}

export async function calculateZakat(prevState: FormState | null, formData: FormData): Promise<FormState> {
  // Server Actions run on server, have access to backend resources
  const session = await auth();
  if (!session) {
    return { error: "Unauthorized" };
  }

  const wealth = parseFloat(formData.get("wealth") as string);
  const nisab = parseFloat(formData.get("nisab") as string);

  // Validation
  if (wealth < 0 || nisab < 0) {
    return { error: "Wealth and nisab must be positive numbers" };
  }

  // Business logic
  const eligible = wealth >= nisab;
  const zakatAmount = eligible ? wealth * 0.025 : 0;

  // Save to database
  await db.zakatCalculation.create({
    data: {
      userId: session.user.id,
      wealth,
      nisab,
      zakatAmount,
      eligible,
      calculatedAt: new Date(),
    },
  });

  // Revalidate the history page to show new calculation
  revalidatePath("/zakat/history");

  return {
    result: { zakatAmount, eligible },
  };
}
```

### Domain-Driven Design with Next.js

Organize features by bounded context:

**Value Objects**:

```typescript
// features/zakat/types/zakat.types.ts
export interface Money {
  readonly amount: number;
  readonly currency: string;
}

export interface NisabThreshold {
  readonly goldGrams: number;
  readonly silverGrams: number;
  readonly equivalentMoney: Money;
  readonly effectiveDate: Date;
}

export interface ZakatCalculation {
  readonly id: string;
  readonly userId: string;
  readonly wealth: Money;
  readonly nisab: NisabThreshold;
  readonly zakatAmount: Money;
  readonly eligible: boolean;
  readonly calculatedAt: Date;
  readonly hijriDate: string;
}
```

**Domain Services** (pure functions):

```typescript
// features/zakat/utils/zakatRules.ts
import type { Money, NisabThreshold } from "../types/zakat.types";

const ZAKAT_RATE = 0.025; // 2.5%

export function calculateZakatEligibility(wealth: number, nisab: number): { isEligible: boolean; zakatAmount: number } {
  const isEligible = wealth >= nisab;
  const zakatAmount = isEligible ? wealth * ZAKAT_RATE : 0;
  return { isEligible, zakatAmount };
}

export function calculateNisabFromGold(goldPricePerGram: number): number {
  const NISAB_GOLD_GRAMS = 85;
  return goldPricePerGram * NISAB_GOLD_GRAMS;
}

export function calculateNisabFromSilver(silverPricePerGram: number): number {
  const NISAB_SILVER_GRAMS = 595;
  return silverPricePerGram * NISAB_SILVER_GRAMS;
}

export function isWealthAboveNisab(wealth: Money, nisab: NisabThreshold): boolean {
  if (wealth.currency !== nisab.equivalentMoney.currency) {
    throw new Error("Currency mismatch");
  }
  return wealth.amount >= nisab.equivalentMoney.amount;
}
```

## Development Workflow

### Project Setup

**Create new Next.js application:**

```bash
# Using create-next-app
npx create-next-app@latest ose-platform-nextjs \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# Or in Nx workspace (future)
nx generate @nx/next:application ose-platform-nextjs

# Install dependencies
cd ose-platform-nextjs
npm install

# Start development server
npm run dev
```

### Configuration

**next.config.ts**:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict mode for better error detection
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    domains: ["example.com"],
    formats: ["image/avif", "image/webp"],
  },

  // Internationalization (if needed)
  // i18n: {
  //   locales: ['en', 'id'],
  //   defaultLocale: 'en',
  // },

  // Environment variables available in browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/old-route",
        destination: "/new-route",
        permanent: true,
      },
    ];
  },

  // Headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },

  // Experimental features
  experimental: {
    // typedRoutes: true,
    // ppr: true, // Partial Prerendering
  },
};

export default nextConfig;
```

**Environment Variables** (.env.local):

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ose_platform"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# API Keys (never commit actual keys!)
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
GOLD_API_KEY="your-gold-api-key"

# Feature Flags
NEXT_PUBLIC_ENABLE_BETA_FEATURES="false"
```

### Testing Strategy

**1. Component Tests** (Vitest + React Testing Library):

```typescript
// features/zakat/components/ZakatForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ZakatForm } from './ZakatForm';

describe('ZakatForm', () => {
  it('renders form fields', () => {
    render(<ZakatForm defaultNisab={5000} />);

    expect(screen.getByLabelText(/your wealth/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /calculate/i })).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<ZakatForm defaultNisab={5000} />);

    const wealthInput = screen.getByLabelText(/your wealth/i);
    await user.type(wealthInput, '10000');

    const submitButton = screen.getByRole('button', { name: /calculate/i });
    await user.click(submitButton);

    // Form submission is tested through integration tests
  });
});
```

**2. Server Action Tests**:

```typescript
// features/zakat/actions/calculateZakat.test.ts
import { calculateZakat } from "./calculateZakat";

// Mock dependencies
jest.mock("@/lib/db/client");
jest.mock("@/lib/auth");

describe("calculateZakat", () => {
  it("calculates zakat for eligible wealth", async () => {
    const formData = new FormData();
    formData.append("wealth", "10000");
    formData.append("nisab", "5000");

    const result = await calculateZakat(null, formData);

    expect(result.result?.zakatAmount).toBe(250);
    expect(result.result?.eligible).toBe(true);
  });

  it("returns error for negative wealth", async () => {
    const formData = new FormData();
    formData.append("wealth", "-100");
    formData.append("nisab", "5000");

    const result = await calculateZakat(null, formData);

    expect(result.error).toBeTruthy();
  });
});
```

**3. E2E Tests** (Playwright):

```typescript
// e2e/zakat-calculator.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Zakat Calculator", () => {
  test("completes zakat calculation flow", async ({ page }) => {
    await page.goto("/zakat/calculate");

    // Fill form
    await page.fill('input[name="wealth"]', "10000");

    // Submit
    await page.click('button:has-text("Calculate Zakat")');

    // Verify result
    await expect(page.locator("text=Zakat Amount: 250")).toBeVisible();
    await expect(page.locator("text=Eligible: Yes")).toBeVisible();
  });
});
```

## Learning Path

### 1. Start with Idioms

Read [Next.js Idioms](ex-soen-plwe-to-fene__idioms.md) to understand framework patterns:

- App Router conventions
- Server Components vs Client Components
- Server Actions
- File-based routing
- Metadata API

### 2. Apply Best Practices

Read [Next.js Best Practices](ex-soen-plwe-to-fene__best-practices.md) for production standards:

- Project structure
- Rendering strategies
- Data fetching patterns
- Caching and revalidation
- Performance optimization

### 3. Avoid Anti-Patterns

Read [Next.js Anti-Patterns](ex-soen-plwe-to-fene__anti-patterns.md) to prevent mistakes:

- Unnecessary Client Components
- Improper data fetching
- Missing error handling
- Poor caching strategies

### 4. Master Core Features

Read architecture documentation:

- [App Router](ex-soen-plwe-to-fene__app-router.md)
- [Server Components](ex-soen-plwe-to-fene__server-components.md)
- [Data Fetching](ex-soen-plwe-to-fene__data-fetching.md)
- [Rendering](ex-soen-plwe-to-fene__rendering.md)

### 5. Integrate with DDD

Read complementary documentation:

- [Domain-Driven Design](ex-soen-plwe-to-fene__domain-driven-design.md)
- [Functional Programming](ex-soen-plwe-to-fene__functional-programming.md)
- [TypeScript DDD Patterns](../../../programming-languages/typescript/ex-soen-prla-ty__domain-driven-design.md)

## Code Examples from Platform

### Server Component with Data Fetching

```typescript
// app/(platform)/zakat/history/page.tsx
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { redirect } from 'next/navigation';
import { ZakatHistoryList } from '@/features/zakat/components/ZakatHistoryList';

export default async function ZakatHistoryPage() {
  // Authentication check
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  // Fetch data directly in Server Component
  const calculations = await db.zakatCalculation.findMany({
    where: { userId: session.user.id },
    orderBy: { calculatedAt: 'desc' },
    take: 10,
  });

  return (
    <div>
      <h1>Zakat Calculation History</h1>
      <ZakatHistoryList calculations={calculations} />
    </div>
  );
}
```

### API Route Handler

```typescript
// app/api/nisab/current/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export const dynamic = "force-dynamic"; // Always fetch fresh data

export async function GET() {
  try {
    const nisab = await db.nisab.findFirst({
      orderBy: { effectiveDate: "desc" },
    });

    if (!nisab) {
      return NextResponse.json({ error: "Nisab threshold not found" }, { status: 404 });
    }

    return NextResponse.json({
      goldGrams: nisab.goldGrams,
      silverGrams: nisab.silverGrams,
      equivalentAmount: nisab.equivalentAmount,
      currency: nisab.currency,
      effectiveDate: nisab.effectiveDate,
    });
  } catch (error) {
    console.error("Error fetching nisab:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Middleware for Authentication

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  if (pathname.startsWith("/zakat") || pathname.startsWith("/donations")) {
    const session = await auth();

    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/zakat/:path*", "/donations/:path*"],
};
```

## Integration with Other Documentation

### TypeScript and React Standards

- **[TypeScript](../../../programming-languages/typescript/README.md)** - Core TypeScript documentation
- **[TypeScript Idioms](../../../programming-languages/typescript/ex-soen-prla-ty__idioms.md)** - Modern TypeScript patterns
- **[React](../fe-react/README.md)** - React framework documentation
- **[React Best Practices](../fe-react/ex-soen-plwe-to-fere__best-practices.md)** - React standards

### Architecture Patterns

- **[Domain-Driven Design](../../../architecture/domain-driven-design-ddd/README.md)** - DDD tactical patterns
- **[C4 Architecture Model](../../../architecture/c4-architecture-model/README.md)** - System documentation

### Development Practices

- **[Test-Driven Development](../../../development/test-driven-development-tdd/README.md)** - TDD workflows
- **[Functional Programming](../../../../../../governance/development/pattern/functional-programming.md)** - FP principles

### Code Quality

- **[Code Quality Standards](../../../../../../governance/development/quality/code.md)** - Quality requirements
- **[Implementation Workflow](../../../../../../governance/development/workflow/implementation.md)** - Development process

## Next.js Ecosystem

### Core Next.js

- **Next.js Framework** - React meta-framework
- **Turbopack** - Fast bundler (Rust-based)
- **SWC** - Fast compiler (Rust-based)
- **next/image** - Image optimization
- **next/font** - Font optimization
- **next/script** - Script optimization

### Data Fetching

- **Built-in fetch** - Extended with caching
- **TanStack Query** - Client-side data fetching
- **SWR** - Vercel's data fetching library
- **Apollo Client** - GraphQL integration

### Database & ORM

- **Prisma** - TypeScript-first ORM (recommended)
- **Drizzle** - TypeScript ORM alternative
- **Supabase** - PostgreSQL + auth + real-time
- **PlanetScale** - MySQL platform

### Authentication

- **NextAuth.js** - Authentication for Next.js (recommended)
- **Clerk** - Authentication platform
- **Auth0** - Identity platform
- **Supabase Auth** - Built-in authentication

### Styling

- **Tailwind CSS** - Utility-first CSS (recommended)
- **shadcn/ui** - Reusable components
- **CSS Modules** - Built-in scoped CSS
- **styled-components** - CSS-in-JS

### Forms

- **React Hook Form** - Performance-focused forms
- **Zod** - Schema validation
- **Server Actions** - Built-in form handling

### Deployment

- **Vercel** - Next.js creators, optimal deployment (recommended)
- **Netlify** - Alternative deployment
- **AWS Amplify** - AWS deployment
- **Self-hosted** - Docker, Node.js server

## Tools and Development Environment

### Build Tools

Next.js includes all build tooling:

- Turbopack (Next.js 16+) for development
- Webpack for production builds
- SWC for fast compilation
- Built-in code splitting
- Automatic polyfills

### Development Environment

**VS Code** (Recommended):

Extensions:

- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prisma (if using Prisma)
- Pretty TypeScript Errors
- Error Lens

**WebStorm**:

- Built-in Next.js support
- Excellent TypeScript integration

### Code Quality

**ESLint** (built-in):

```javascript
// .eslintrc.json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    // Custom rules
  }
}
```

**Prettier**:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Reproducible Development

**Version Management** (package.json):

```json
{
  "volta": {
    "node": "24.13.1",
    "npm": "11.10.1"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

**Docker Development**:

```dockerfile
FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Development
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "dev"]

# Production build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

## Resources and References

### Official Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn Course](https://nextjs.org/learn)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)
- [Next.js Blog](https://nextjs.org/blog)

### Best Practices

- [Next.js Patterns](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching)

### Migration Guides

- [Pages to App Router Migration](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [Codemods for Migration](https://nextjs.org/docs/app/building-your-application/upgrading/codemods)

## Related Documentation

### Core Next.js Documentation

- **[Next.js Idioms](ex-soen-plwe-to-fene__idioms.md)** - Framework patterns
- **[Next.js Best Practices](ex-soen-plwe-to-fene__best-practices.md)** - Production standards
- **[Next.js Anti-Patterns](ex-soen-plwe-to-fene__anti-patterns.md)** - Common mistakes

### Architecture Documentation

- **[App Router](ex-soen-plwe-to-fene__app-router.md)** - Routing architecture
- **[Server Components](ex-soen-plwe-to-fene__server-components.md)** - RSC patterns
- **[Data Fetching](ex-soen-plwe-to-fene__data-fetching.md)** - Data strategies
- **[Rendering](ex-soen-plwe-to-fene__rendering.md)** - Rendering modes

### Advanced Topics

- **[Performance](ex-soen-plwe-to-fene__performance.md)** - Optimization
- **[Testing](ex-soen-plwe-to-fene__testing.md)** - Testing strategies
- **[Security](ex-soen-plwe-to-fene__security.md)** - Security practices
- **[Deployment](ex-soen-plwe-to-fene__deployment.md)** - Deployment patterns

### Integration Documentation

- **[Domain-Driven Design](ex-soen-plwe-to-fene__domain-driven-design.md)** - DDD with Next.js
- **[Functional Programming](ex-soen-plwe-to-fene__functional-programming.md)** - FP patterns
- **[Version Migration](ex-soen-plwe-to-fene__version-migration.md)** - Upgrading

### Platform Documentation

- **[Libraries and Frameworks Index](../README.md)** - Parent frameworks documentation
- **[React Framework](../fe-react/README.md)** - React standards
- **[TypeScript Programming Language](../../../programming-languages/typescript/README.md)** - TypeScript standards
- **[Software Design Index](../../README.md)** - Software documentation root

---

**Last Updated**: 2026-02-25
**Next.js Version**: 16 (React 19+, TypeScript 5+)
**Maintainers**: Platform Documentation Team
