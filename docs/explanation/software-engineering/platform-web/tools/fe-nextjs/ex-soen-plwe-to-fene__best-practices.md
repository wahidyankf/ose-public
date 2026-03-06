---
title: "Next.js Best Practices"
description: Production-ready Next.js development standards for building maintainable, performant full-stack applications
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - best-practices
  - standards
  - typescript
  - production
related:
  - ./ex-soen-plwe-tsnext__idioms.md
  - ./ex-soen-plwe-tsnext__anti-patterns.md
  - ./ex-soen-plwe-tsnext__app-router.md
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
  - automation-over-manual
updated: 2026-01-26
---

# Next.js Best Practices

## Quick Reference

**Core Standards**:

- [Project Structure](#project-structure) - Feature-based organization
- [Server vs Client Components](#server-vs-client-components) - Component decisions
- [Data Fetching](#data-fetching-strategies) - Server-side patterns
- [Caching](#caching-and-revalidation) - Performance optimization
- [Error Handling](#error-handling) - Robust error management

**Code Quality**:

- [TypeScript](#typescript-integration) - Type safety
- [Performance](#performance-optimization) - Optimization strategies
- [Security](#security-practices) - Security best practices
- [Testing](#testing-strategies) - Comprehensive testing
- [Accessibility](#accessibility-standards) - WCAG compliance

## Overview

Next.js best practices provide proven approaches for building production-ready full-stack applications. These standards ensure optimal performance, maintainability, and user experience across the open-sharia-enterprise platform.

This guide focuses on **Next.js 16+ best practices** with App Router, Server Components, and TypeScript.

## Project Structure

### Feature-Based Organization

Organize by domain/feature for better cohesion and scalability:

```
apps/ose-platform-nextjs/
├── src/
│   ├── app/                        # App Router
│   │   ├── (marketing)/           # Route group
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── about/
│   │   │       └── page.tsx
│   │   ├── (platform)/
│   │   │   ├── layout.tsx
│   │   │   └── zakat/
│   │   │       ├── page.tsx
│   │   │       ├── calculate/
│   │   │       └── history/
│   │   ├── api/
│   │   │   └── nisab/
│   │   │       └── route.ts
│   │   └── layout.tsx
│   ├── features/                  # Feature modules
│   │   ├── zakat/
│   │   │   ├── components/       # Client Components
│   │   │   ├── actions/          # Server Actions
│   │   │   ├── types/
│   │   │   └── utils/
│   │   └── donations/
│   ├── components/                # Shared UI
│   │   ├── ui/                   # Primitives
│   │   └── providers/            # Context providers
│   ├── lib/                      # Utilities
│   │   ├── db/
│   │   ├── auth/
│   │   └── utils/
│   └── middleware.ts
├── public/
├── .env.local
└── next.config.ts
```

**Benefits**:

- Clear boundaries between features
- Easy to scale and maintain
- Reusable shared components
- Domain-driven organization

## Server vs Client Components

### Default to Server Components

✅ **Use Server Components (default) for:**

- Data fetching from databases
- Accessing backend resources
- SEO-critical content
- Reducing client bundle size

✅ **Use Client Components for:**

- Interactivity (useState, useEffect)
- Browser APIs (localStorage, window)
- Event handlers (onClick, onChange)
- Third-party libraries requiring browser

**Example Decision Tree**:

```typescript
// ✅ Server Component - Fetch data, no interactivity
export default async function ZakatHistoryPage() {
  const calculations = await db.zakatCalculation.findMany();
  return <ZakatHistoryList data={calculations} />;
}

// ✅ Client Component - Interactive form
'use client';
export function ZakatForm() {
  const [wealth, setWealth] = useState('');
  return <form>{/* Interactive UI */}</form>;
}
```

### Composition Pattern

Pass Server Components as children to Client Components:

```typescript
// ✅ GOOD: Server Component as children
'use client';
export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState();
  return <div>{children}</div>;
}

// Server Component
<ClientWrapper>
  <ServerDataComponent />
</ClientWrapper>

// ❌ BAD: Importing Server Component in Client Component
'use client';
import { ServerDataComponent } from './ServerDataComponent';
// This won't work as expected!
```

## Data Fetching Strategies

### Fetch on Server

Always prefer server-side data fetching:

```typescript
// ✅ GOOD: Server Component with direct database access
export default async function Page() {
  const data = await db.query();
  return <div>{data.name}</div>;
}

// ❌ BAD: Client-side fetching (unless necessary)
'use client';
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData);
  }, []);
  return <div>{data?.name}</div>;
}
```

### Parallel Data Fetching

Fetch independent data in parallel:

```typescript
export default async function DashboardPage() {
  // ✅ GOOD: Parallel fetching
  const [user, stats, notifications] = await Promise.all([
    getUser(),
    getStats(),
    getNotifications(),
  ]);

  return <Dashboard user={user} stats={stats} notifications={notifications} />;
}
```

### Sequential When Dependent

```typescript
export default async function ProfilePage({ params }: { params: { id: string } }) {
  // Fetch user first
  const user = await getUser(params.id);

  // Fetch user-specific data
  const posts = await getUserPosts(user.id);

  return <Profile user={user} posts={posts} />;
}
```

## Caching and Revalidation

### fetch() with Caching

```typescript
// Static (cached indefinitely)
const data = await fetch("https://api.example.com/data");

// Revalidate every hour
const data = await fetch("https://api.example.com/data", {
  next: { revalidate: 3600 },
});

// No caching (always fresh)
const data = await fetch("https://api.example.com/data", {
  cache: "no-store",
});

// Tag-based revalidation
const data = await fetch("https://api.example.com/data", {
  next: { tags: ["zakat"] },
});
```

### On-Demand Revalidation

```typescript
// Server Action
"use server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function updateZakat() {
  await db.zakat.update(/*...*/);

  // Revalidate specific path
  revalidatePath("/zakat/history");

  // Revalidate all paths with tag
  revalidateTag("zakat");
}
```

## Error Handling

### Error Boundaries

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

### Global Error Handling

```typescript
// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
```

### Try-Catch in Server Components

```typescript
export default async function Page() {
  try {
    const data = await fetchData();
    return <div>{data.name}</div>;
  } catch (error) {
    return <div>Error loading data</div>;
  }
}
```

## Loading States

### loading.tsx

```typescript
// app/zakat/loading.tsx
export default function Loading() {
  return <ZakatSkeleton />;
}
```

### Streaming with Suspense

```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}
```

## TypeScript Integration

### Typed Route Params

```typescript
interface PageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  return <div>Post: {params.slug}</div>;
}
```

### Typed Server Actions

```typescript
"use server";

interface FormState {
  message?: string;
  errors?: Record<string, string[]>;
}

export async function submitForm(prevState: FormState | null, formData: FormData): Promise<FormState> {
  // Type-safe form handling
  const wealth = formData.get("wealth") as string;

  if (!wealth) {
    return { errors: { wealth: ["Required"] } };
  }

  return { message: "Success" };
}
```

## Performance Optimization

### Image Optimization

```typescript
import Image from 'next/image';

export function HeroImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      width={1200}
      height={600}
      priority // Load immediately
      quality={90}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

### Font Optimization

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### Code Splitting

```typescript
import dynamic from 'next/dynamic';

// Dynamic import with loading state
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // Disable SSR for this component
});
```

## Security Practices

### Environment Variables

```typescript
// ✅ GOOD: Server-only variables
const dbUrl = process.env.DATABASE_URL; // Server only

// ✅ GOOD: Public variables (browser-accessible)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ❌ BAD: Exposing secrets to client
const secret = process.env.API_SECRET; // In Client Component
```

### Input Validation

```typescript
"use server";

import { z } from "zod";

const schema = z.object({
  wealth: z.number().positive(),
  nisab: z.number().positive(),
});

export async function calculateZakat(formData: FormData) {
  const parsed = schema.safeParse({
    wealth: Number(formData.get("wealth")),
    nisab: Number(formData.get("nisab")),
  });

  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  // Process validated data
  const { wealth, nisab } = parsed.data;
}
```

### CSRF Protection

Server Actions have built-in CSRF protection, no additional configuration needed.

## Testing Strategies

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import ZakatForm from './ZakatForm';

describe('ZakatForm', () => {
  it('renders form fields', () => {
    render(<ZakatForm />);
    expect(screen.getByLabelText(/wealth/i)).toBeInTheDocument();
  });
});
```

### Server Action Testing

```typescript
import { calculateZakat } from "./actions";

describe("calculateZakat", () => {
  it("calculates correctly", async () => {
    const formData = new FormData();
    formData.set("wealth", "10000");
    formData.set("nisab", "5000");

    const result = await calculateZakat(null, formData);
    expect(result.zakatAmount).toBe(250);
  });
});
```

### E2E Testing

```typescript
import { test, expect } from "@playwright/test";

test("zakat calculation flow", async ({ page }) => {
  await page.goto("/zakat/calculate");
  await page.fill('[name="wealth"]', "10000");
  await page.click('button:has-text("Calculate")');
  await expect(page.locator("text=250")).toBeVisible();
});
```

## Accessibility Standards

### Semantic HTML

```typescript
export function ZakatCard() {
  return (
    <article>
      <header>
        <h2>Zakat Calculation</h2>
      </header>
      <main>
        <p>Amount: 250</p>
      </main>
    </article>
  );
}
```

### ARIA Labels

```typescript
<button aria-label="Calculate Zakat" onClick={handleClick}>
  <CalculatorIcon />
</button>
```

### Keyboard Navigation

```typescript
'use client';

export function Modal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return <div role="dialog" aria-modal="true">{/* Content */}</div>;
}
```

## Related Documentation

- **[Next.js Idioms](ex-soen-plwe-to-fene__idioms.md)** - Framework patterns
- **[Next.js Anti-Patterns](ex-soen-plwe-to-fene__anti-patterns.md)** - Common mistakes
- **[App Router](ex-soen-plwe-to-fene__app-router.md)** - Routing architecture
- **[Server Components](ex-soen-plwe-to-fene__server-components.md)** - RSC patterns
- **[Performance](ex-soen-plwe-to-fene__performance.md)** - Optimization guide
- **[Testing](ex-soen-plwe-to-fene__testing.md)** - Testing strategies
- **[Security](ex-soen-plwe-to-fene__security.md)** - Security practices

---

**Last Updated**: 2026-01-26
**Next.js Version**: 14+ (App Router)
