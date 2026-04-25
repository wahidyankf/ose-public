---
title: "Next.js Anti-Patterns"
description: Common mistakes and problematic patterns to avoid in Next.js development
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - anti-patterns
  - mistakes
  - pitfalls
related:
  - ./idioms.md
  - ./best-practices.md
principles:
  - explicit-over-implicit
  - immutability
---

# Next.js Anti-Patterns

## Quick Reference

**Component Patterns**:

- [Unnecessary Client Components](#unnecessary-client-components) - Overusing "use client"
- [Fetching in Client Components](#fetching-data-in-client-components) - Wrong data fetching location
- [Missing Error Boundaries](#missing-error-handling) - No error handling

**Performance**:

- [No Loading States](#missing-loading-states) - Poor UX
- [Improper Caching](#improper-caching-strategies) - Cache misuse
- [Unoptimized Images](#unoptimized-images) - Not using next/image

**Architecture**:

- [Props Drilling](#props-drilling-in-app-router) - Passing too many props
- [API Routes for Simple Data](#using-api-routes-unnecessarily) - Extra network hop

## Overview

Next.js anti-patterns are common mistakes that lead to poor performance, maintainability issues, and suboptimal user experience. Understanding and avoiding these patterns is crucial for building high-quality Next.js applications.

## Unnecessary Client Components

### ❌ Problem

Marking components as "use client" when they don't need interactivity.

```typescript
// ❌ BAD: Unnecessary Client Component
'use client';

export function UserProfile({ user }: { user: User }) {
  // No state, no effects, no browser APIs - doesn't need to be client!
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### ✅ Solution

Keep it as a Server Component (default):

```typescript
// ✅ GOOD: Server Component (default)
export function UserProfile({ user }: { user: User }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

**Impact**: Smaller bundle, faster load times, better SEO.

## Fetching Data in Client Components

### ❌ Problem

Fetching data in Client Components when server-side fetching is possible.

```typescript
// ❌ BAD: Client-side fetching
'use client';

export function ZakatHistory() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/zakat/history')
      .then(r => r.json())
      .then(setData);
  }, []);

  return <div>{data.map(item => <div key={item.id}>{item.amount}</div>)}</div>;
}
```

### ✅ Solution

Fetch in Server Component:

```typescript
// ✅ GOOD: Server-side fetching
export default async function ZakatHistoryPage() {
  // Fetch directly in Server Component
  const data = await db.zakatCalculation.findMany();

  return <ZakatHistoryList data={data} />;
}
```

**Impact**: Faster initial load, no loading spinner, better SEO.

## Missing Error Handling

### ❌ Problem

No error boundaries or try-catch blocks.

```typescript
// ❌ BAD: No error handling
export default async function Page() {
  const data = await fetchData(); // What if this fails?
  return <div>{data.name}</div>;
}
```

### ✅ Solution

Add error.tsx and try-catch:

```typescript
// app/error.tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// Page with try-catch
export default async function Page() {
  try {
    const data = await fetchData();
    return <div>{data.name}</div>;
  } catch (error) {
    return <div>Failed to load data</div>;
  }
}
```

## Missing Loading States

### ❌ Problem

No loading indicators while fetching data.

```typescript
// ❌ BAD: No loading state
export default async function Page() {
  const data = await fetchSlowData(); // Takes 3 seconds
  return <div>{data.name}</div>;
}
```

### ✅ Solution

Add loading.tsx or use Suspense:

```typescript
// app/loading.tsx
export default function Loading() {
  return <Skeleton />;
}

// Or use Suspense for granular loading
export default function Page() {
  return (
    <div>
      <Suspense fallback={<Skeleton />}>
        <SlowDataComponent />
      </Suspense>
    </div>
  );
}
```

## Improper Caching Strategies

### ❌ Problem

Not configuring cache appropriately.

```typescript
// ❌ BAD: Using default cache for dynamic data
const data = await fetch("https://api.example.com/live-prices");
// Will cache indefinitely!
```

### ✅ Solution

Configure caching appropriately:

```typescript
// ✅ GOOD: No cache for live data
const data = await fetch("https://api.example.com/live-prices", {
  cache: "no-store",
});

// ✅ GOOD: Revalidate hourly for semi-static data
const data = await fetch("https://api.example.com/nisab", {
  next: { revalidate: 3600 },
});
```

## Unoptimized Images

### ❌ Problem

Using regular `<img>` tags instead of next/image.

```typescript
// ❌ BAD: Unoptimized image
export function Banner() {
  return <img src="/banner.jpg" alt="Banner" />;
}
```

### ✅ Solution

Use next/image:

```typescript
// ✅ GOOD: Optimized image
import Image from 'next/image';

export function Banner() {
  return (
    <Image
      src="/banner.jpg"
      alt="Banner"
      width={1200}
      height={600}
      priority
    />
  );
}
```

## Props Drilling in App Router

### ❌ Problem

Passing props through multiple layout levels.

```typescript
// ❌ BAD: Props drilling
export default function RootLayout({ children, user }) {
  return <MainLayout user={user}>{children}</MainLayout>;
}

export function MainLayout({ children, user }) {
  return <Sidebar user={user}>{children}</Sidebar>;
}
```

### ✅ Solution

Use React Context or fetch data where needed:

```typescript
// ✅ GOOD: Context for shared data
export function Providers({ children }) {
  return <UserProvider>{children}</UserProvider>;
}

// Or fetch in each component that needs it (Server Components)
export async function Sidebar() {
  const user = await getUser();
  return <div>{user.name}</div>;
}
```

## Using API Routes Unnecessarily

### ❌ Problem

Creating API routes when Server Components can fetch directly.

```typescript
// ❌ BAD: Unnecessary API route
// app/api/zakat/route.ts
export async function GET() {
  const data = await db.zakatCalculation.findMany();
  return Response.json(data);
}

// Client Component fetching from API
("use client");
export function ZakatList() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch("/api/zakat")
      .then((r) => r.json())
      .then(setData);
  }, []);
}
```

### ✅ Solution

Fetch directly in Server Component:

```typescript
// ✅ GOOD: Direct database access
export default async function ZakatPage() {
  const data = await db.zakatCalculation.findMany();
  return <ZakatList data={data} />;
}
```

**Note**: API routes are still needed for webhooks, third-party integrations, or client-side mutations.

## Related Documentation

- **[Next.js Idioms](idioms.md)** - Correct patterns
- **[Next.js Best Practices](best-practices.md)** - Production standards
- **[Performance](performance.md)** - Optimization guide
- **[Server Components](server-components.md)** - RSC patterns

---

**Next.js Version**: 14+ (App Router)
