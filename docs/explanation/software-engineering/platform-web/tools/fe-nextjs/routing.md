---
title: "Next.js Routing"
description: Comprehensive guide to Next.js routing patterns including dynamic routes, route groups, parallel routes, intercepting routes, and navigation
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - routing
  - navigation
  - dynamic-routes
  - app-router
related:
  - ./app-router.md
  - ./middleware.md
  - ./idioms.md
principles:
  - explicit-over-implicit
  - automation-over-manual
created: 2026-01-26
---

# Next.js Routing

## Quick Reference

**Core Routing**:

- [File-System Routing](#file-system-routing) - Directory-based routes
- [Dynamic Routes](#dynamic-routes) - Parameter-based routes
- [Catch-All Routes](#catch-all-routes) - Variable segments
- [Optional Catch-All](#optional-catch-all-routes) - Flexible matching
- [Route Groups](#route-groups) - Organization without URL impact
- [Parallel Routes](#parallel-routes) - Multiple pages simultaneously
- [Intercepting Routes](#intercepting-routes) - Modal-like experiences

**Navigation**:

- [Link Component](#link-component-navigation) - Client-side navigation
- [useRouter Hook](#userouter-hook) - Programmatic navigation
- [Redirects](#redirects-and-rewrites) - Server-side navigation
- [Middleware](#middleware-integration) - Request-time routing

## Overview

Next.js routing is built on **file-system based routing** where the folder structure in the `app/` directory automatically creates URL routes. This declarative approach eliminates manual route configuration while providing powerful features like dynamic routes, nested layouts, and parallel rendering.

**Key Features**:

- **Automatic routing** from folder structure
- **Dynamic routes** with parameters
- **Nested layouts** for shared UI
- **Type-safe routing** with TypeScript
- **Prefetching** for instant navigation
- **Soft navigation** preserving client state

This guide covers Next.js 16+ routing patterns for enterprise applications.

## File-System Routing

### Basic Routes

```
app/
├── page.tsx                # /
├── about/
│   └── page.tsx            # /about
├── blog/
│   ├── page.tsx            # /blog
│   └── authors/
│       └── page.tsx        # /blog/authors
└── contact/
    └── page.tsx            # /contact
```

**Rules**:

- Folders define route segments
- `page.tsx` makes route publicly accessible
- Nested folders create nested routes

### OSE Platform Example

```
app/
├── (marketing)/
│   ├── page.tsx                        # /
│   ├── about/
│   │   └── page.tsx                    # /about
│   └── pricing/
│       └── page.tsx                    # /pricing
├── (platform)/
│   ├── dashboard/
│   │   └── page.tsx                    # /dashboard
│   ├── zakat/
│   │   ├── page.tsx                    # /zakat
│   │   ├── calculate/
│   │   │   └── page.tsx                # /zakat/calculate
│   │   └── history/
│   │       └── page.tsx                # /zakat/history
│   ├── murabaha/
│   │   ├── page.tsx                    # /murabaha
│   │   ├── applications/
│   │   │   ├── page.tsx                # /murabaha/applications
│   │   │   └── [id]/
│   │   │       └── page.tsx            # /murabaha/applications/[id]
│   │   └── new/
│   │       └── page.tsx                # /murabaha/new
│   └── waqf/
│       ├── page.tsx                    # /waqf
│       ├── projects/
│       │   ├── page.tsx                # /waqf/projects
│       │   └── [id]/
│       │       └── page.tsx            # /waqf/projects/[id]
│       └── donate/
│           └── page.tsx                # /waqf/donate
└── api/
    ├── zakat/
    │   └── route.ts                    # /api/zakat
    └── murabaha/
        └── route.ts                    # /api/murabaha
```

## Dynamic Routes

### Single Dynamic Segment

Use square brackets `[param]`:

```
app/
└── blog/
    └── [slug]/
        └── page.tsx        # /blog/[slug]
```

```typescript
// app/blog/[slug]/page.tsx
interface PageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function BlogPostPage({ params, searchParams }: PageProps) {
  // params.slug is the dynamic segment value
  const post = await db.post.findUnique({
    where: { slug: params.slug },
  });

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

### Multiple Dynamic Segments

```
app/
└── shop/
    └── [category]/
        └── [product]/
            └── page.tsx    # /shop/[category]/[product]
```

```typescript
// app/shop/[category]/[product]/page.tsx
interface PageProps {
  params: {
    category: string;
    product: string;
  };
}

export default async function ProductPage({ params }: PageProps) {
  return (
    <div>
      <h1>Category: {params.category}</h1>
      <h2>Product: {params.product}</h2>
    </div>
  );
}
```

### OSE Platform: Murabaha Application

```typescript
// app/(platform)/murabaha/applications/[id]/page.tsx
import { db } from '@/lib/db/client';
import { auth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
  params: { id: string };
}

export default async function MurabahaApplicationPage({ params }: PageProps) {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  const application = await db.murabahaApplication.findUnique({
    where: {
      id: params.id,
      userId: session.user.id, // Security: only show user's own applications
    },
    include: {
      vendor: true,
      installments: {
        orderBy: { dueDate: 'asc' },
      },
    },
  });

  if (!application) {
    notFound();
  }

  return (
    <div>
      <h1>Murabaha Application #{application.applicationNumber}</h1>

      <section>
        <h2>Details</h2>
        <p>Vendor: {application.vendor.name}</p>
        <p>Item: {application.itemDescription}</p>
        <p>Amount: {application.requestedAmount}</p>
        <p>Status: {application.status}</p>
      </section>

      <section>
        <h2>Installment Schedule</h2>
        {application.installments.map((installment) => (
          <div key={installment.id}>
            <p>Due: {installment.dueDate.toLocaleDateString()}</p>
            <p>Amount: {installment.amount}</p>
            <p>Status: {installment.status}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
```

### Generating Static Paths

```typescript
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await db.post.findMany({
    select: { slug: true },
  });

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  // This page will be statically generated for all slugs returned by generateStaticParams
  const post = await db.post.findUnique({
    where: { slug: params.slug },
  });

  return <article>{/* ... */}</article>;
}
```

## Catch-All Routes

### Basic Catch-All

Use `[...param]` to catch all subsequent segments:

```
app/
└── docs/
    └── [...slug]/
        └── page.tsx        # /docs/a, /docs/a/b, /docs/a/b/c
```

```typescript
// app/docs/[...slug]/page.tsx
interface PageProps {
  params: {
    slug: string[]; // Array of segments
  };
}

export default async function DocsPage({ params }: PageProps) {
  // URL: /docs/getting-started/installation
  // params.slug: ['getting-started', 'installation']

  const path = params.slug.join('/');
  const doc = await getDocByPath(path);

  return (
    <article>
      <h1>{doc.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: doc.content }} />
    </article>
  );
}
```

### OSE Platform: Nested Documentation

```typescript
// app/docs/[...slug]/page.tsx
import { getDocumentByPath } from '@/lib/docs';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { slug: string[] };
}

export default async function DocPage({ params }: PageProps) {
  const path = params.slug.join('/');

  const doc = await getDocumentByPath(path);

  if (!doc) {
    notFound();
  }

  return (
    <div>
      <nav className="mb-4">
        <ol className="flex gap-2">
          {params.slug.map((segment, index) => (
            <li key={index}>
              {index > 0 && <span className="mx-2">/</span>}
              <span className="capitalize">{segment}</span>
            </li>
          ))}
        </ol>
      </nav>

      <article>
        <h1>{doc.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: doc.content }} />
      </article>
    </div>
  );
}
```

## Optional Catch-All Routes

Use `[[...param]]` to make the route segment optional:

```
app/
└── shop/
    └── [[...slug]]/
        └── page.tsx        # /shop, /shop/electronics, /shop/electronics/laptops
```

```typescript
// app/shop/[[...slug]]/page.tsx
interface PageProps {
  params: {
    slug?: string[]; // Optional
  };
}

export default async function ShopPage({ params }: PageProps) {
  if (!params.slug) {
    // /shop - Show all categories
    const categories = await db.category.findMany();
    return <div>{/* Render categories */}</div>;
  }

  if (params.slug.length === 1) {
    // /shop/electronics - Show category
    const products = await db.product.findMany({
      where: { category: params.slug[0] },
    });
    return <div>{/* Render products */}</div>;
  }

  // /shop/electronics/laptops/macbook - Show product
  const product = await db.product.findUnique({
    where: { slug: params.slug.join('/') },
  });
  return <div>{/* Render product */}</div>;
}
```

## Route Groups

### Organization with Route Groups

Use `(folder)` syntax - doesn't affect URL:

```
app/
├── (marketing)/
│   ├── layout.tsx
│   ├── page.tsx            # /
│   ├── about/
│   │   └── page.tsx        # /about
│   └── pricing/
│       └── page.tsx        # /pricing
├── (platform)/
│   ├── layout.tsx
│   ├── dashboard/
│   │   └── page.tsx        # /dashboard
│   └── settings/
│       └── page.tsx        # /settings
└── (auth)/
    ├── layout.tsx
    ├── login/
    │   └── page.tsx        # /login
    └── register/
        └── page.tsx        # /register
```

### Different Layouts per Group

```typescript
// app/(marketing)/layout.tsx
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="bg-white border-b">
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/pricing">Pricing</a>
      </nav>
      {children}
      <footer className="bg-gray-100 mt-8 p-4">
        <p>&copy; 2026 OSE Platform</p>
      </footer>
    </div>
  );
}
```

```typescript
// app/(platform)/layout.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white">
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/zakat">Zakat</a>
          <a href="/murabaha">Murabaha</a>
          <a href="/waqf">Waqf</a>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

## Parallel Routes

### Simultaneous Page Rendering

Use `@folder` syntax:

```
app/
└── dashboard/
    ├── layout.tsx
    ├── page.tsx
    ├── @analytics/
    │   └── page.tsx
    └── @team/
        └── page.tsx
```

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div>
      <h1>Dashboard</h1>
      {children}
      <div className="grid grid-cols-2 gap-4 mt-8">
        {analytics}
        {team}
      </div>
    </div>
  );
}
```

### OSE Platform: Dashboard with Parallel Routes

```
app/
└── (platform)/
    └── dashboard/
        ├── layout.tsx
        ├── page.tsx
        ├── @zakatStats/
        │   └── page.tsx
        ├── @murabahaStats/
        │   └── page.tsx
        └── @waqfStats/
            └── page.tsx
```

```typescript
// app/(platform)/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  zakatStats,
  murabahaStats,
  waqfStats,
}: {
  children: React.ReactNode;
  zakatStats: React.ReactNode;
  murabahaStats: React.ReactNode;
  waqfStats: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <div className="grid grid-cols-3 gap-4 mt-8">
        {zakatStats}
        {murabahaStats}
        {waqfStats}
      </div>
    </div>
  );
}
```

```typescript
// app/(platform)/dashboard/@zakatStats/page.tsx
import { db } from '@/lib/db/client';
import { auth } from '@/lib/auth';

export default async function ZakatStats() {
  const session = await auth();

  const stats = await db.zakatCalculation.aggregate({
    where: { userId: session.user.id },
    _sum: { zakatAmount: true },
    _count: true,
  });

  return (
    <div className="border p-4 rounded">
      <h2 className="text-lg font-semibold mb-2">Zakat Statistics</h2>
      <p>Total Calculations: {stats._count}</p>
      <p>Total Zakat: {stats._sum.zakatAmount || 0}</p>
    </div>
  );
}
```

## Intercepting Routes

### Modal-Like Experiences

Use `(.)`, `(..)`, or `(...)` syntax:

```
app/
└── photos/
    ├── page.tsx                # /photos
    ├── [id]/
    │   └── page.tsx            # /photos/[id]
    └── (..)modal/
        └── [id]/
            └── page.tsx        # Intercepts /photos/[id]
```

**Intercepting Levels**:

| Pattern    | Matches       |
| ---------- | ------------- |
| `(.)`      | Same level    |
| `(..)`     | One level up  |
| `(..)(..)` | Two levels up |
| `(...)`    | From root     |

### OSE Platform: Application Modal

```
app/
└── (platform)/
    ├── murabaha/
    │   └── applications/
    │       ├── page.tsx                        # /murabaha/applications
    │       ├── [id]/
    │       │   └── page.tsx                    # /murabaha/applications/[id]
    │       └── (..)(..)@modal/
    │           └── [id]/
    │               └── page.tsx                # Intercepts when soft navigating
    └── @modal/
        └── [id]/
            └── page.tsx
```

```typescript
// app/(platform)/murabaha/applications/(..)(..)@modal/[id]/page.tsx
import { Modal } from '@/components/Modal';
import { db } from '@/lib/db/client';

export default async function ApplicationModal({ params }: { params: { id: string } }) {
  const application = await db.murabahaApplication.findUnique({
    where: { id: params.id },
  });

  return (
    <Modal>
      <h2>Application #{application.applicationNumber}</h2>
      <p>Status: {application.status}</p>
      <p>Amount: {application.requestedAmount}</p>
    </Modal>
  );
}
```

**Behavior**:

- **Soft navigation** (Link click) → Shows modal
- **Hard navigation** (direct URL, refresh) → Shows full page

## Link Component Navigation

### Basic Usage

```typescript
import Link from 'next/link';

export function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/contact">Contact</Link>
    </nav>
  );
}
```

### Dynamic Links

```typescript
import Link from 'next/link';

export function BlogList({ posts }: { posts: Post[] }) {
  return (
    <div>
      {posts.map((post) => (
        <Link key={post.id} href={`/blog/${post.slug}`}>
          {post.title}
        </Link>
      ))}
    </div>
  );
}
```

### With Query Parameters

```typescript
import Link from 'next/link';

export function FilteredLink() {
  return (
    <Link href={{ pathname: '/products', query: { category: 'electronics', sort: 'price' } }}>
      Electronics (sorted by price)
    </Link>
  );
}
```

### Prefetching Control

```typescript
import Link from 'next/link';

export function Links() {
  return (
    <>
      {/* Prefetch on hover (default) */}
      <Link href="/page1">Page 1</Link>

      {/* Disable prefetching */}
      <Link href="/page2" prefetch={false}>
        Page 2
      </Link>

      {/* Force prefetch immediately */}
      <Link href="/page3" prefetch={true}>
        Page 3
      </Link>
    </>
  );
}
```

### OSE Platform Navigation

```typescript
// components/PlatformNav.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function PlatformNav() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/zakat', label: 'Zakat' },
    { href: '/murabaha', label: 'Murabaha' },
    { href: '/waqf', label: 'Waqf' },
  ];

  return (
    <nav className="flex gap-4">
      {links.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={isActive ? 'font-bold text-blue-600' : 'text-gray-600'}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

## useRouter Hook

### Programmatic Navigation

```typescript
'use client';

import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Login logic
    const success = await login();

    if (success) {
      router.push('/dashboard');
    }
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

### Available Methods

```typescript
'use client';

import { useRouter } from 'next/navigation';

export function NavigationExamples() {
  const router = useRouter();

  return (
    <div>
      {/* Navigate to route */}
      <button onClick={() => router.push('/dashboard')}>Go to Dashboard</button>

      {/* Replace current route (no back button) */}
      <button onClick={() => router.replace('/login')}>Replace with Login</button>

      {/* Refresh current route */}
      <button onClick={() => router.refresh()}>Refresh</button>

      {/* Go back */}
      <button onClick={() => router.back()}>Go Back</button>

      {/* Go forward */}
      <button onClick={() => router.forward()}>Go Forward</button>

      {/* Prefetch route */}
      <button onClick={() => router.prefetch('/about')}>Prefetch About</button>
    </div>
  );
}
```

### OSE Platform: Post-Action Navigation

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { submitMurabahaApplication } from '@/features/murabaha/actions';

export function MurabahaApplicationForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await submitMurabahaApplication(formData);

      if (result.success) {
        // Navigate to application detail
        router.push(`/murabaha/applications/${result.applicationId}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  );
}
```

## Redirects and Rewrites

### Server-Side Redirects

```typescript
// app/old-page/page.tsx
import { redirect } from "next/navigation";

export default function OldPage() {
  redirect("/new-page");
}
```

### Conditional Redirects

```typescript
// app/(platform)/admin/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'admin') {
    redirect('/unauthorized');
  }

  return <div>Admin Dashboard</div>;
}
```

### Permanent Redirects

```typescript
// app/blog/page.tsx
import { permanentRedirect } from "next/navigation";

export default function BlogPage() {
  permanentRedirect("/posts");
}
```

### Configuration-Based Redirects

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/old-blog/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      {
        source: "/docs",
        destination: "/docs/getting-started",
        permanent: false,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.example.com/:path*",
      },
    ];
  },
};

export default nextConfig;
```

## Middleware Integration

### Route Protection

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect platform routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/zakat") || pathname.startsWith("/murabaha")) {
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
  matcher: ["/dashboard/:path*", "/zakat/:path*", "/murabaha/:path*", "/waqf/:path*"],
};
```

## Best Practices

### ✅ Do

- **Use Link component** for navigation
- **Use route groups** for organization
- **Use dynamic routes** for parameterized content
- **Implement loading states**
- **Use middleware** for authentication
- **Prefetch** important routes
- **Use TypeScript** for type-safe params

### ❌ Don't

- **Don't use `<a>` tags** for internal navigation
- **Don't skip error boundaries**
- **Don't nest route groups** unnecessarily
- **Don't expose sensitive routes** without auth
- **Don't ignore accessibility** in navigation
- **Don't skip loading states**

## Related Documentation

**Core Next.js**:

- [App Router](app-router.md) - File-system routing fundamentals
- [Middleware](middleware.md) - Request-time routing logic
- [API Routes](api-routes.md) - Backend routing
- [Server Components](server-components.md) - Component-based routing

**Patterns**:

- [Idioms](idioms.md) - Next.js routing patterns
- [Best Practices](best-practices.md) - Production standards

---

**Next.js Version**: 14+ (App Router stable)
