---
title: "Next.js Idioms"
description: Next.js-specific patterns and conventions for building modern full-stack applications
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - idioms
  - patterns
  - app-router
  - server-components
related:
  - ./ex-soen-plwe-tsnext__best-practices.md
  - ./ex-soen-plwe-tsnext__app-router.md
  - ./ex-soen-plwe-tsnext__server-components.md
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
updated: 2026-01-26
---

# Next.js Idioms

## Quick Reference

**Core Patterns**:

- [App Router Conventions](#app-router-conventions) - File-system routing
- [Server Components](#server-components) - Default rendering strategy
- [Client Components](#client-components) - "use client" directive
- [Server Actions](#server-actions) - Type-safe mutations
- [Data Fetching](#data-fetching-patterns) - fetch with caching
- [Metadata API](#metadata-api) - SEO optimization

**Advanced Patterns**:

- [Route Segment Config](#route-segment-config) - Page configuration
- [Parallel Routes](#parallel-routes) - Multiple simultaneous pages
- [Intercepting Routes](#intercepting-routes) - Modal-like experiences
- [Streaming](#streaming-with-suspense) - Progressive rendering
- [Edge Runtime](#edge-vs-nodejs-runtime) - Runtime selection

## Overview

Next.js idioms are framework-specific patterns that leverage Next.js's capabilities for optimal performance, developer experience, and user experience. These patterns are established conventions within the Next.js community and should be followed for consistency across the platform.

This guide focuses on **Next.js 16+ idioms** with the App Router, React Server Components, and TypeScript.

## App Router Conventions

### File-System Routing

Next.js uses file-system based routing where the folder structure determines URL paths.

**Core Files**:

```
app/
├── layout.tsx              # Root layout (required)
├── page.tsx                # Home page (/)
├── loading.tsx             # Loading UI
├── error.tsx               # Error boundary
├── not-found.tsx           # 404 page
├── template.tsx            # Template (resets on navigation)
└── global.css              # Global styles
```

**Nested Routes**:

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # /
├── about/
│   └── page.tsx            # /about
└── blog/
    ├── layout.tsx          # Blog layout
    ├── page.tsx            # /blog
    └── [slug]/
        └── page.tsx        # /blog/[slug]
```

**Route Groups** (organize without affecting URL):

```
app/
├── (marketing)/            # Route group
│   ├── layout.tsx          # Marketing layout
│   ├── page.tsx            # /
│   └── about/
│       └── page.tsx        # /about
└── (platform)/
    ├── layout.tsx          # Platform layout
    └── dashboard/
        └── page.tsx        # /dashboard
```

### Special Files

**page.tsx** - Route UI:

```typescript
// app/zakat/page.tsx
export default function ZakatPage() {
  return <h1>Zakat Calculator</h1>;
}
```

**layout.tsx** - Shared UI that persists across navigation:

```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**loading.tsx** - Loading UI with Suspense:

```typescript
// app/zakat/loading.tsx
export default function Loading() {
  return <div>Loading zakat calculator...</div>;
}
```

**error.tsx** - Error boundary:

```typescript
// app/zakat/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**not-found.tsx** - Custom 404 page:

```typescript
// app/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
    </div>
  );
}
```

## Server Components

Server Components are the **default** in Next.js App Router. They run on the server and send HTML to the client.

### When to Use Server Components

✅ **Use Server Components when:**

- Fetching data from databases or APIs
- Accessing backend resources directly
- Keeping sensitive information on server (API keys, secrets)
- Reducing client bundle size
- SEO is important (pre-rendered HTML)

**Example**:

```typescript
// app/zakat/history/page.tsx (Server Component by default)
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';

export default async function ZakatHistoryPage() {
  // Runs on server - can directly access database
  const session = await auth();
  const calculations = await db.zakatCalculation.findMany({
    where: { userId: session.user.id },
  });

  return (
    <div>
      <h1>Zakat History</h1>
      {calculations.map((calc) => (
        <div key={calc.id}>
          <p>Amount: {calc.zakatAmount}</p>
          <p>Date: {calc.calculatedAt.toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### Server Component Benefits

- **Zero client bundle** - No JavaScript sent to browser
- **Direct backend access** - Database, file system, environment variables
- **Automatic code splitting** - Only needed code is loaded
- **Streaming** - Progressive rendering with Suspense
- **Improved SEO** - HTML pre-rendered on server

## Client Components

Client Components run in the browser and enable interactivity. Use the **"use client"** directive.

### When to Use Client Components

✅ **Use Client Components when:**

- Using browser-only APIs (localStorage, window)
- Using React hooks (useState, useEffect, useReducer)
- Handling user interactions (onClick, onChange)
- Using third-party libraries that depend on browser APIs

**Example**:

```typescript
// features/zakat/components/ZakatForm.tsx
'use client';

import { useState } from 'react';

export function ZakatForm() {
  const [wealth, setWealth] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const zakatAmount = parseFloat(wealth) * 0.025;
    setResult(zakatAmount);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="number" value={wealth} onChange={(e) => setWealth(e.target.value)} />
      <button type="submit">Calculate</button>
      {result && <p>Zakat Amount: {result}</p>}
    </form>
  );
}
```

### Client Component Guidelines

- **Place "use client" at the top** of the file
- **Keep small** - Minimize client bundle
- **Compose with Server Components** - Pass Server Components as children
- **Don't fetch data** unless necessary - Prefer server-side fetching

## Server Actions

Server Actions are asynchronous functions that run on the server, callable from Client Components.

### Defining Server Actions

**In a separate file**:

```typescript
// features/zakat/actions/calculateZakat.ts
"use server";

import { db } from "@/lib/db/client";
import { revalidatePath } from "next/cache";

export async function calculateZakat(formData: FormData) {
  const wealth = parseFloat(formData.get("wealth") as string);
  const nisab = parseFloat(formData.get("nisab") as string);

  // Validation
  if (wealth < 0 || nisab < 0) {
    return { error: "Invalid input" };
  }

  // Calculate
  const eligible = wealth >= nisab;
  const zakatAmount = eligible ? wealth * 0.025 : 0;

  // Save to database
  await db.zakatCalculation.create({
    data: { wealth, nisab, zakatAmount, eligible },
  });

  // Revalidate to show fresh data
  revalidatePath("/zakat/history");

  return { zakatAmount, eligible };
}
```

### Using Server Actions

**In forms** (progressive enhancement):

```typescript
// features/zakat/components/ZakatForm.tsx
'use client';

import { calculateZakat } from '../actions/calculateZakat';
import { useFormState } from 'react-dom';

export function ZakatForm() {
  const [state, formAction] = useFormState(calculateZakat, null);

  return (
    <form action={formAction}>
      <input type="number" name="wealth" required />
      <input type="number" name="nisab" required />
      <button type="submit">Calculate</button>

      {state?.error && <p className="error">{state.error}</p>}
      {state?.zakatAmount && <p>Zakat: {state.zakatAmount}</p>}
    </form>
  );
}
```

**With transitions** (optimistic UI):

```typescript
'use client';

import { useTransition } from 'react';
import { calculateZakat } from '../actions/calculateZakat';

export function ZakatButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await calculateZakat(formData);
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? 'Calculating...' : 'Calculate'}
    </button>
  );
}
```

## Data Fetching Patterns

### Server-Side Data Fetching

Use `fetch` with automatic caching in Server Components:

```typescript
// app/nisab/page.tsx
async function getNisab() {
  const res = await fetch('https://api.example.com/nisab', {
    // Cache for 1 hour
    next: { revalidate: 3600 },
  });
  return res.json();
}

export default async function NisabPage() {
  const nisab = await getNisab();
  return <div>Current Nisab: {nisab.amount}</div>;
}
```

### Parallel Data Fetching

Fetch multiple data sources in parallel:

```typescript
async function getUser() {
  const res = await fetch('/api/user');
  return res.json();
}

async function getCalculations() {
  const res = await fetch('/api/calculations');
  return res.json();
}

export default async function DashboardPage() {
  // Fetch in parallel
  const [user, calculations] = await Promise.all([getUser(), getCalculations()]);

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Calculations: {calculations.length}</p>
    </div>
  );
}
```

### Sequential Data Fetching

When data depends on previous data:

```typescript
export default async function UserCalculationsPage({ params }: { params: { id: string } }) {
  // Fetch user first
  const user = await getUser(params.id);

  // Fetch calculations based on user
  const calculations = await getCalculations(user.id);

  return <div>{/* Render */}</div>;
}
```

## Metadata API

Define metadata for SEO in page or layout components.

### Static Metadata

```typescript
// app/zakat/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zakat Calculator',
  description: 'Calculate your Zakat obligations according to Islamic principles',
  keywords: ['zakat', 'calculator', 'islamic', 'finance'],
  openGraph: {
    title: 'Zakat Calculator',
    description: 'Calculate your Zakat obligations',
    images: ['/og-image.png'],
  },
};

export default function ZakatPage() {
  return <h1>Zakat Calculator</h1>;
}
```

### Dynamic Metadata

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPost(params.slug);
  return <article>{/* Render post */}</article>;
}
```

## Route Segment Config

Configure route behavior with exported constants:

```typescript
// app/api/nisab/route.ts
export const dynamic = "force-dynamic"; // Always fetch fresh
export const revalidate = 3600; // Revalidate every hour
export const runtime = "edge"; // Use Edge runtime

export async function GET() {
  const nisab = await fetchNisab();
  return Response.json(nisab);
}
```

**Configuration Options**:

```typescript
// Static generation (default)
export const dynamic = "auto";
export const dynamicParams = true;
export const revalidate = false;

// Force dynamic (SSR)
export const dynamic = "force-dynamic";

// Incremental Static Regeneration
export const revalidate = 3600; // Seconds

// Static generation with dynamic params
export const dynamicParams = true; // Generate other pages on-demand

// Runtime selection
export const runtime = "nodejs"; // Default
export const runtime = "edge"; // Edge runtime
```

## Parallel Routes

Render multiple pages simultaneously in the same layout using named slots.

**Folder structure**:

```
app/
└── dashboard/
    ├── layout.tsx
    ├── @analytics/
    │   └── page.tsx
    ├── @team/
    │   └── page.tsx
    └── @user/
        └── page.tsx
```

**Layout**:

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  team,
  user,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
  user: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <div className="grid grid-cols-3 gap-4">
        <div>{analytics}</div>
        <div>{team}</div>
        <div>{user}</div>
      </div>
    </div>
  );
}
```

## Intercepting Routes

Create modal-like experiences by intercepting routes.

**Folder structure**:

```
app/
├── photo/
│   └── [id]/
│       └── page.tsx          # /photo/123
└── feed/
    ├── page.tsx              # /feed
    └── (..)photo/
        └── [id]/
            └── page.tsx      # Intercepts /photo/123 when navigating from /feed
```

**Intercepting route**:

```typescript
// app/feed/(..)photo/[id]/page.tsx
import Modal from '@/components/Modal';

export default function PhotoModal({ params }: { params: { id: string } }) {
  return (
    <Modal>
      <img src={`/photos/${params.id}.jpg`} alt="Photo" />
    </Modal>
  );
}
```

## Streaming with Suspense

Stream UI incrementally for faster perceived performance:

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { Analytics } from './Analytics';
import { UserInfo } from './UserInfo';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Fast: Renders immediately */}
      <UserInfo />

      {/* Slow: Streams when ready */}
      <Suspense fallback={<div>Loading analytics...</div>}>
        <Analytics />
      </Suspense>
    </div>
  );
}
```

**Async component**:

```typescript
// app/dashboard/Analytics.tsx
async function getAnalytics() {
  // Slow database query
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return { views: 1000, clicks: 250 };
}

export async function Analytics() {
  const data = await getAnalytics();
  return (
    <div>
      <p>Views: {data.views}</p>
      <p>Clicks: {data.clicks}</p>
    </div>
  );
}
```

## Image Optimization

Use `next/image` for automatic image optimization:

```typescript
import Image from 'next/image';

export function ZakatBanner() {
  return (
    <Image
      src="/zakat-banner.jpg"
      alt="Zakat Calculator Banner"
      width={1200}
      height={600}
      priority // Load immediately
      placeholder="blur" // Blur while loading
      blurDataURL="data:image/jpeg;base64,..." // Low-quality placeholder
    />
  );
}
```

**Responsive images**:

```typescript
<Image
  src="/hero.jpg"
  alt="Hero Image"
  fill // Fill parent container
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  style={{ objectFit: 'cover' }}
/>
```

## Font Optimization

Use `next/font` for automatic font optimization:

```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

**Local fonts**:

```typescript
import localFont from "next/font/local";

const myFont = localFont({
  src: "./my-font.woff2",
  display: "swap",
});
```

## Link Component

Use `Link` for client-side navigation with prefetching:

```typescript
import Link from 'next/link';

export function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/zakat">Zakat</Link>
      <Link href="/donations">Donations</Link>
      <Link
        href="/premium"
        prefetch={false} // Disable prefetch
      >
        Premium
      </Link>
    </nav>
  );
}
```

**Dynamic routes**:

```typescript
<Link href={`/blog/${post.slug}`}>Read More</Link>
```

**With query params**:

```typescript
<Link
  href={{
    pathname: '/search',
    query: { q: 'zakat' },
  }}
>
  Search
</Link>
```

## Edge vs Node.js Runtime

Choose runtime based on requirements:

**Edge Runtime** (fast, limited):

```typescript
// app/api/hello/route.ts
export const runtime = "edge";

export async function GET() {
  return Response.json({ message: "Hello from Edge" });
}
```

**Node.js Runtime** (full Node.js APIs):

```typescript
// app/api/data/route.ts
export const runtime = "nodejs"; // Default

import fs from "fs";

export async function GET() {
  const data = fs.readFileSync("data.json", "utf-8");
  return Response.json(JSON.parse(data));
}
```

## Environment Variables

Access environment variables in Server Components and API routes:

```typescript
// Server Component or API route
const apiKey = process.env.API_KEY;

// Client Component (must be prefixed with NEXT_PUBLIC_)
const publicUrl = process.env.NEXT_PUBLIC_API_URL;
```

**.env.local**:

```bash
# Server-only (not exposed to browser)
DATABASE_URL="postgresql://..."
API_SECRET_KEY="secret"

# Exposed to browser (prefix required)
NEXT_PUBLIC_API_URL="https://api.example.com"
```

## Related Documentation

- **[Next.js Best Practices](ex-soen-plwe-to-fene__best-practices.md)** - Production standards
- **[Next.js Anti-Patterns](ex-soen-plwe-to-fene__anti-patterns.md)** - Common mistakes
- **[App Router](ex-soen-plwe-to-fene__app-router.md)** - Routing architecture
- **[Server Components](ex-soen-plwe-to-fene__server-components.md)** - RSC patterns
- **[Data Fetching](ex-soen-plwe-to-fene__data-fetching.md)** - Data strategies

---

**Last Updated**: 2026-01-26
**Next.js Version**: 14+ (App Router)
