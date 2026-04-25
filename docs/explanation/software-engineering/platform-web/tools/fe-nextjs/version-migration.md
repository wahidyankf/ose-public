---
title: Next.js Version Migration
description: Comprehensive guide to migrating Next.js applications from Pages Router to App Router, upgrading Next.js versions (13→14→15), React migrations, breaking changes, and migration strategies
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - migration
  - version-upgrade
  - pages-router
  - app-router
  - breaking-changes
  - codemods
principles:
  - explicit-over-implicit
  - simplicity-over-complexity
created: 2026-01-26
---

# Next.js Version Migration

Migrating Next.js applications requires careful planning whether upgrading versions or transitioning from Pages Router to App Router. This guide covers comprehensive migration strategies, breaking changes, codemods, and step-by-step processes for Next.js 13→14→15 and React version upgrades.

## 📋 Quick Reference

- [Pages Router to App Router](#-pages-router-to-app-router) - Complete migration guide
- [Next.js 13 to 14](#-nextjs-13-to-14) - Version upgrade guide
- [Next.js 16 to 15](#-nextjs-14-to-15) - Latest version migration
- [React 18 to 19](#-react-18-to-19) - React version upgrade
- [Breaking Changes](#-breaking-changes) - Version-specific breaking changes
- [Codemods](#-codemods) - Automated migration tools
- [Migration Strategies](#-migration-strategies) - Incremental vs full migration
- [Testing Migration](#-testing-migration) - Validation strategies
- [Common Issues](#-common-issues) - Troubleshooting guide
- [OSE Platform Migration](#-ose-platform-migration) - Real-world example
- [Migration Checklist](#-migration-checklist) - Pre/post-migration verification
- [Related Documentation](#-related-documentation) - Cross-references

## 🔄 Pages Router to App Router

The most significant migration is from Pages Router (Next.js 12 and earlier paradigm) to App Router (Next.js 13+ paradigm).

### Key Differences

**Pages Router (Old)**:

- File-system routing with `pages/` directory
- `getServerSideProps`, `getStaticProps` for data fetching
- `_app.js`, `_document.js` for customization
- Client-side rendering by default
- API routes in `pages/api/`

**App Router (New)**:

- File-system routing with `app/` directory
- React Server Components with async/await
- `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`
- Server-side rendering by default
- Route handlers in `app/api/*/route.ts`

### Migration Strategy Options

**Option 1: Incremental Migration (Recommended)**

Migrate routes gradually while keeping both routers:

```
project/
├── app/          # New App Router routes
│   └── dashboard/
│       └── page.tsx
├── pages/        # Existing Pages Router routes
│   ├── index.tsx
│   └── about.tsx
└── next.config.ts
```

**Option 2: Full Migration**

Migrate entire application at once (higher risk, faster completion).

### Step-by-Step Incremental Migration

#### Step 1: Setup App Router Alongside Pages Router

```bash
# Create app directory
mkdir app

# Create root layout
touch app/layout.tsx
```

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

#### Step 2: Migrate Simple Page

**Before (Pages Router)**:

```typescript
// pages/about.tsx
import { GetServerSideProps } from 'next';

interface AboutProps {
  data: string;
}

export default function AboutPage({ data }: AboutProps) {
  return (
    <div>
      <h1>About Us</h1>
      <p>{data}</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const data = 'About content';

  return { props: { data } };
};
```

**After (App Router)**:

```typescript
// app/about/page.tsx
export default async function AboutPage() {
  const data = 'About content';

  return (
    <div>
      <h1>About Us</h1>
      <p>{data}</p>
    </div>
  );
}
```

#### Step 3: Migrate Data Fetching

**Pages Router `getServerSideProps`**:

```typescript
// pages/dashboard.tsx
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params;

  const data = await fetch(`https://api.example.com/data/${id}`);
  const json = await data.json();

  return { props: { data: json } };
};
```

**App Router equivalent**:

```typescript
// app/dashboard/[id]/page.tsx
async function getData(id: string) {
  const res = await fetch(`https://api.example.com/data/${id}`, {
    cache: 'no-store', // Equivalent to getServerSideProps
  });

  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }

  return res.json();
}

export default async function DashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getData(params.id);

  return <div>{/* Render data */}</div>;
}
```

**Pages Router `getStaticProps`**:

```typescript
// pages/blog/[slug].tsx
export const getStaticProps: GetStaticProps = async (context) => {
  const { slug } = context.params;

  const post = await fetchPost(slug);

  return { props: { post }, revalidate: 3600 };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await fetchAllPosts();

  return {
    paths: posts.map((post) => ({ params: { slug: post.slug } })),
    fallback: "blocking",
  };
};
```

**App Router equivalent**:

```typescript
// app/blog/[slug]/page.tsx
export const revalidate = 3600; // ISR revalidation

export async function generateStaticParams() {
  const posts = await fetchAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await fetchPost(params.slug);

  return <article>{/* Render post */}</article>;
}
```

#### Step 4: Migrate Layouts

**Pages Router `_app.tsx`**:

```typescript
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <nav>{/* Global navigation */}</nav>
      <Component {...pageProps} />
      <footer>{/* Global footer */}</footer>
    </SessionProvider>
  );
}
```

**App Router `layout.tsx`**:

```typescript
// app/layout.tsx
import { SessionProvider } from '@/components/SessionProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <nav>{/* Global navigation */}</nav>
          {children}
          <footer>{/* Global footer */}</footer>
        </SessionProvider>
      </body>
    </html>
  );
}
```

#### Step 5: Migrate API Routes

**Pages Router**:

```typescript
// pages/api/zakat/calculate.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { wealth, nisab } = req.body;

  const zakatAmount = wealth >= nisab ? wealth * 0.025 : 0;

  res.status(200).json({ zakatAmount });
}
```

**App Router**:

```typescript
// app/api/zakat/calculate/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { wealth, nisab } = await request.json();

  const zakatAmount = wealth >= nisab ? wealth * 0.025 : 0;

  return NextResponse.json({ zakatAmount }, { status: 200 });
}
```

#### Step 6: Migrate Client Components

**Pages Router** (all components are client by default):

```typescript
// components/Counter.tsx
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

**App Router** (add `'use client'` directive):

```typescript
// components/Counter.tsx
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

#### Step 7: Migrate Head Tags

**Pages Router**:

```typescript
// pages/about.tsx
import Head from 'next/head';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us - OSE Platform</title>
        <meta name="description" content="Learn about OSE Platform" />
      </Head>
      <div>{/* Content */}</div>
    </>
  );
}
```

**App Router**:

```typescript
// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - OSE Platform',
  description: 'Learn about OSE Platform',
};

export default function AboutPage() {
  return <div>{/* Content */}</div>;
}
```

### Migration Compatibility Table

| Feature             | Pages Router           | App Router                  |
| ------------------- | ---------------------- | --------------------------- |
| Data Fetching (SSR) | `getServerSideProps`   | `async` components, `fetch` |
| Data Fetching (SSG) | `getStaticProps`       | `generateStaticParams`      |
| Dynamic Paths       | `getStaticPaths`       | `generateStaticParams`      |
| API Routes          | `pages/api/*.ts`       | `app/api/*/route.ts`        |
| Custom App          | `_app.tsx`             | `layout.tsx`                |
| Custom Document     | `_document.tsx`        | `layout.tsx` with `<html>`  |
| Head Tags           | `<Head>` component     | `metadata` export           |
| Middleware          | `middleware.ts` (same) | `middleware.ts` (same)      |
| Loading States      | Manual implementation  | `loading.tsx`               |
| Error Handling      | `_error.tsx`           | `error.tsx`                 |
| Not Found           | `404.tsx`              | `not-found.tsx`             |
| Route Groups        | N/A                    | `(group-name)` folders      |
| Parallel Routes     | N/A                    | `@slot` folders             |
| Intercepting Routes | N/A                    | `(..)folder` syntax         |
| Client Components   | Default                | Explicit `'use client'`     |
| Server Components   | N/A                    | Default (async/await)       |
| Streaming           | Manual                 | Built-in with Suspense      |

## ⬆️ Next.js 13 to 14

Next.js 16 introduced performance improvements and stability enhancements.

### Breaking Changes (Next.js 13→14)

**1. Minimum React Version**

- **Before**: React 18.2.0
- **After**: React 18.3.0

```bash
npm install react@^18.3.0 react-dom@^18.3.0
```

**2. Image Component Changes**

- `next/legacy/image` removed (use `next/image`)
- Improved image optimization

**3. TypeScript Version**

- Minimum TypeScript 5.0

```bash
npm install -D typescript@^5.0.0
```

### Migration Steps (Next.js 13→14)

#### Step 1: Update Dependencies

```bash
npm install next@14 react@^18.3.0 react-dom@^18.3.0
npm install -D typescript@^5.0.0
```

#### Step 2: Update next.config.js

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable Turbopack (opt-in)
  experimental: {
    turbo: {
      // Turbopack configuration
    },
  },
};

module.exports = nextConfig;
```

#### Step 3: Run Codemod (if needed)

```bash
npx @next/codemod@latest upgrade
```

#### Step 4: Test Application

```bash
npm run dev
npm run build
npm run start
```

### New Features in Next.js 16

**Turbopack (Beta)**:

```bash
# Development with Turbopack
next dev --turbo
```

**Partial Prerendering (Experimental)**:

```typescript
// next.config.ts
const config: NextConfig = {
  experimental: {
    ppr: true, // Partial Prerendering
  },
};
```

**Server Actions Stable**:

```typescript
// actions/zakat.ts
"use server";

export async function calculateZakat(formData: FormData) {
  // Server Action is now stable in Next.js 16
}
```

## ⬆️ Next.js 16 to 15

Next.js 15 brings React 19 support and enhanced stability.

### Breaking Changes (Next.js 16→15)

**1. React 19 Required**

- **Before**: React 18.3.0
- **After**: React 19.0.0 (RC)

```bash
npm install react@rc react-dom@rc
```

**2. Minimum Node.js Version**

- **Before**: Node.js 18.17+
- **After**: Node.js 20.0+

**3. fetch Caching Behavior**

- **Before**: `fetch` cached by default
- **After**: `fetch` NOT cached by default (opt-in caching)

```typescript
// Next.js 16 (cached by default)
const data = await fetch("https://api.example.com/data");

// Next.js 15 (NOT cached by default)
const data = await fetch("https://api.example.com/data", {
  cache: "force-cache", // Explicit caching required
});
```

**4. Route Handlers Behavior**

- GET route handlers no longer cached by default
- Must explicitly opt-in to caching

```typescript
// app/api/data/route.ts
export const dynamic = "force-static"; // Explicit static generation

export async function GET() {
  const data = await fetchData();
  return Response.json(data);
}
```

### Migration Steps (Next.js 16→15)

#### Step 1: Update Node.js

```bash
# Check Node.js version
node --version

# Should be 20.0.0 or higher
```

#### Step 2: Update Dependencies

```bash
npm install next@15 react@rc react-dom@rc
```

#### Step 3: Update Caching Behavior

Add explicit caching where needed:

```typescript
// Before (Next.js 16 - cached by default)
const data = await fetch("https://api.example.com/data");

// After (Next.js 15 - explicit caching)
const data = await fetch("https://api.example.com/data", {
  cache: "force-cache",
  next: { revalidate: 3600 },
});
```

#### Step 4: Update Route Handlers

```typescript
// app/api/zakat/calculations/route.ts

// Opt-in to static generation
export const dynamic = "force-static";

// Or opt-in to caching with revalidation
export const revalidate = 3600;

export async function GET() {
  const calculations = await db.zakatCalculation.findMany();
  return Response.json(calculations);
}
```

#### Step 5: Run Codemod

```bash
npx @next/codemod@15 upgrade
```

#### Step 6: Test Thoroughly

```bash
npm run dev
npm run build
npm run start

# Run test suite
npm test
```

### New Features in Next.js 15

**Enhanced Turbopack**:

```bash
# Turbopack is more stable
next dev --turbo
```

**React 19 Features**:

- React Compiler (experimental)
- Enhanced Server Components
- Improved streaming

**Partial Prerendering (Stable)**:

```typescript
// next.config.ts
const config: NextConfig = {
  experimental: {
    ppr: true, // Now more stable
  },
};
```

## ⚛️ React 18 to 19

React 19 brings significant improvements to Server Components and concurrent rendering.

### Breaking Changes (React 18→19)

**1. useFormState Renamed**

```typescript
// React 18
import { useFormState } from "react-dom";

// React 19
import { useActionState } from "react";
```

**2. ref as Prop**

```typescript
// React 18
const MyComponent = forwardRef((props, ref) => {
  return <div ref={ref}>{props.children}</div>;
});

// React 19 (ref is now a regular prop)
const MyComponent = ({ ref, children }) => {
  return <div ref={ref}>{children}</div>;
};
```

**3. Context as Provider**

```typescript
// React 18
<MyContext.Provider value={value}>
  {children}
</MyContext.Provider>

// React 19 (still works, but can use Context directly)
<MyContext value={value}>
  {children}
</MyContext>
```

### Migration Steps (React 18→19)

#### Step 1: Update Dependencies

```bash
npm install react@rc react-dom@rc
npm install -D @types/react@rc @types/react-dom@rc
```

#### Step 2: Update useFormState Usage

```typescript
// Before
import { useFormState } from "react-dom";

export function MyForm() {
  const [state, formAction] = useFormState(submitAction, initialState);
  // ...
}

// After
import { useActionState } from "react";

export function MyForm() {
  const [state, formAction] = useActionState(submitAction, initialState);
  // ...
}
```

#### Step 3: Update forwardRef

```typescript
// Before (React 18)
import { forwardRef } from 'react';

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// After (React 19)
interface InputProps {
  ref?: React.Ref<HTMLInputElement>;
  // other props
}

const Input = ({ ref, ...props }: InputProps) => {
  return <input ref={ref} {...props} />;
};
```

#### Step 4: Test Application

```bash
npm run dev
npm run build
npm test
```

## 🔧 Codemods

Automated migration tools provided by Next.js.

### Available Codemods

**1. App Router Migration**

```bash
# Migrate from Pages Router to App Router
npx @next/codemod@latest app-router-migration
```

**2. New Link Component**

```bash
# Remove <a> child from <Link>
npx @next/codemod@latest new-link
```

**3. Next Image Imports**

```bash
# Migrate to next/image from next/legacy/image
npx @next/codemod@latest next-image-to-legacy-image
```

**4. Next Image Experimental**

```bash
# Migrate to experimental next/image
npx @next/codemod@latest next-image-experimental
```

### Running Codemods

```bash
# General syntax
npx @next/codemod@latest [codemod-name] [path]

# Example: Run on specific directory
npx @next/codemod@latest app-router-migration ./pages

# Example: Run on entire project
npx @next/codemod@latest new-link .
```

### Custom Codemods with jscodeshift

```javascript
// custom-codemod.js
module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Find and replace patterns
  root
    .find(j.ImportDeclaration, {
      source: { value: "old-package" },
    })
    .forEach((path) => {
      path.node.source.value = "new-package";
    });

  return root.toSource();
};
```

```bash
# Run custom codemod
npx jscodeshift -t custom-codemod.js src/
```

## 📊 Migration Strategies

### Strategy 1: Incremental Migration (Low Risk)

**Best for**: Large applications, production systems

**Steps**:

1. Setup App Router alongside Pages Router
2. Migrate one route at a time
3. Test thoroughly after each migration
4. Monitor production metrics
5. Complete migration over weeks/months

**Pros**: Low risk, continuous deployment, gradual learning
**Cons**: Longer timeline, maintaining two systems

### Strategy 2: Feature-First Migration (Balanced)

**Best for**: Medium applications, new feature development

**Steps**:

1. Migrate by feature area (e.g., all auth routes)
2. Complete one feature area before next
3. Deploy each feature area independently

**Pros**: Organized, feature-focused, manageable scope
**Cons**: Some features may span multiple areas

### Strategy 3: Full Migration (High Risk)

**Best for**: Small applications, greenfield rewrites

**Steps**:

1. Create feature branch
2. Migrate entire application
3. Thorough testing
4. Single deployment

**Pros**: Fast completion, clean cutover
**Cons**: High risk, long feature branch, deployment risk

## 🧪 Testing Migration

### Automated Testing

```typescript
// __tests__/migration.test.tsx
import { render, screen } from "@testing-library/react";
import ZakatPage from "@/app/zakat/page";

describe("Migrated Zakat Page", () => {
  it("renders correctly", async () => {
    render(await ZakatPage());
    expect(screen.getByText(/zakat calculator/i)).toBeInTheDocument();
  });

  it("fetches data correctly", async () => {
    const page = await ZakatPage();
    // Verify data fetching works
  });
});
```

### Manual Testing Checklist

- [ ] All routes accessible
- [ ] Data fetching works correctly
- [ ] Authentication/authorization functional
- [ ] Forms submit correctly
- [ ] Client interactions work (buttons, inputs)
- [ ] Images load properly
- [ ] SEO metadata correct
- [ ] Performance metrics acceptable
- [ ] No console errors
- [ ] Mobile responsiveness maintained

### Performance Comparison

```bash
# Before migration
npm run build
# Note: Build time, bundle size, page load times

# After migration
npm run build
# Compare: Build time, bundle size, page load times
```

Use Lighthouse for before/after comparison:

```bash
npx lighthouse https://your-site.com --view
```

## ⚠️ Common Issues

### Issue 1: "use client" Directive Missing

**Error**: `You're importing a component that needs useState. It only works in a Client Component...`

**Solution**: Add `'use client'` directive:

```typescript
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  // ...
}
```

### Issue 2: Async Server Component

**Error**: `async/await is not yet supported in Client Components`

**Solution**: Remove `'use client'` or make component non-async:

```typescript
// WRONG
'use client';

export default async function Page() {
  const data = await fetch('...');
  return <div>{data}</div>;
}

// RIGHT (Server Component)
export default async function Page() {
  const data = await fetch('...');
  return <div>{data}</div>;
}
```

### Issue 3: Metadata in Client Component

**Error**: `Metadata cannot be exported from a Client Component`

**Solution**: Move metadata to parent Server Component:

```typescript
// app/zakat/layout.tsx (Server Component)
export const metadata = {
  title: 'Zakat Calculator',
};

export default function Layout({ children }) {
  return <div>{children}</div>;
}

// app/zakat/page.tsx (can be Client Component)
'use client';

export default function ZakatPage() {
  // Client Component without metadata
}
```

### Issue 4: Dynamic Import Issues

**Error**: Module not found after migration

**Solution**: Update import paths:

```typescript
// Before (Pages Router)
import dynamic from "next/dynamic";

const Calculator = dynamic(() => import("../components/Calculator"));

// After (App Router)
import dynamic from "next/dynamic";

const Calculator = dynamic(() => import("@/components/Calculator"));
```

### Issue 5: Environment Variables

**Error**: `process.env.NEXT_PUBLIC_* is undefined`

**Solution**: Verify environment variables loaded:

```typescript
// app/config.ts
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
};

// Ensure .env.local exists and contains:
// NEXT_PUBLIC_API_URL=https://api.example.com
```

### Issue 6: Cookies/Headers in Client Component

**Error**: `cookies() can only be used in Server Components`

**Solution**: Move to Server Component or use cookies via route handler:

```typescript
// Server Component (correct)
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token");
  // ...
}

// Or: Client Component fetching from API route
("use client");

export default function Page() {
  useEffect(() => {
    fetch("/api/auth/token").then(/* ... */);
  }, []);
}
```

## 🕌 OSE Platform Migration

Real-world migration example for Islamic finance platform.

### Migration Plan

**Phase 1: Setup (Week 1)**

- Create `app/` directory
- Setup root layout with authentication provider
- Migrate homepage

**Phase 2: Core Features (Weeks 2-4)**

- Migrate Zakat Calculator routes
- Migrate Murabaha application routes
- Migrate Waqf donation routes

**Phase 3: Authentication (Week 5)**

- Migrate login/register pages
- Migrate dashboard
- Migrate user profile

**Phase 4: Admin (Week 6)**

- Migrate admin dashboard
- Migrate user management
- Migrate reporting

**Phase 5: API Routes (Week 7)**

- Migrate API routes to route handlers
- Update client-side fetch calls

**Phase 6: Cleanup (Week 8)**

- Remove `pages/` directory
- Remove deprecated dependencies
- Performance optimization

### Example: Zakat Calculator Migration

**Before (Pages Router)**:

```typescript
// pages/zakat/calculate.tsx
import { GetServerSideProps } from 'next';
import { ZakatCalculatorForm } from '@/components/ZakatCalculatorForm';

interface Props {
  nisabThreshold: number;
}

export default function CalculatePage({ nisabThreshold }: Props) {
  return (
    <div>
      <h1>Zakat Calculator</h1>
      <ZakatCalculatorForm nisabThreshold={nisabThreshold} />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const nisabThreshold = await fetchNisabThreshold();

  return { props: { nisabThreshold } };
};
```

**After (App Router)**:

```typescript
// app/zakat/calculate/page.tsx
import { ZakatCalculatorForm } from '@/components/ZakatCalculatorForm';

async function getNisabThreshold() {
  // Server-side data fetching
  const nisabThreshold = await fetchNisabThreshold();
  return nisabThreshold;
}

export default async function CalculatePage() {
  const nisabThreshold = await getNisabThreshold();

  return (
    <div>
      <h1>Zakat Calculator</h1>
      <ZakatCalculatorForm nisabThreshold={nisabThreshold} />
    </div>
  );
}
```

## ✅ Migration Checklist

### Pre-Migration

- [ ] Review breaking changes for target version
- [ ] Backup codebase (Git commit/branch)
- [ ] Document current application behavior
- [ ] Setup staging environment for testing
- [ ] Notify team of migration timeline
- [ ] Plan rollback strategy

### During Migration

- [ ] Update dependencies
- [ ] Run codemods
- [ ] Migrate one route/feature at a time
- [ ] Test each migration thoroughly
- [ ] Update documentation
- [ ] Monitor for console warnings/errors
- [ ] Fix TypeScript errors
- [ ] Update tests

### Post-Migration

- [ ] Run full test suite
- [ ] Performance testing (Lighthouse)
- [ ] Security audit
- [ ] Accessibility audit (axe)
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Load testing
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Production deployment
- [ ] Monitor production metrics
- [ ] Document migration learnings

## 🔗 Related Documentation

- [Next.js README](./README.md) - Next.js overview
- [Next.js App Router](app-router.md) - App Router features
- [Next.js Server Components](server-components.md) - RSC patterns
- [Next.js Configuration](configuration.md) - Configuration updates
- [Next.js Testing](testing.md) - Testing migrated code

---

**Next Steps:**

- Review [Next.js App Router](app-router.md) for App Router features
- Check [Next.js Server Components](server-components.md) for RSC patterns
- Read [Next.js Configuration](configuration.md) for config updates
- Explore [Next.js Testing](testing.md) for migration testing
