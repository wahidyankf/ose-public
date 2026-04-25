---
title: Next.js TypeScript
description: Comprehensive guide to TypeScript integration in Next.js with type-safe patterns, configuration, and best practices
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - typescript
  - type-safety
  - static-typing
  - configuration
principles:
  - explicit-over-implicit
  - simplicity-over-complexity
created: 2026-01-26
---

# Next.js TypeScript

Next.js provides first-class TypeScript support with automatic type checking, type inference, and comprehensive type definitions. This guide covers TypeScript configuration, type-safe patterns for pages, API routes, Server Components, and advanced typing techniques for production applications.

## 📋 Quick Reference

- [TypeScript Setup](#-typescript-setup) - Configuration and initialization
- [Page Component Types](#-page-component-types) - Type-safe page patterns
- [Layout Component Types](#-layout-component-types) - Type-safe layouts
- [Server Component Types](#-server-component-types) - Async component typing
- [Client Component Types](#-client-component-types) - Client-side typing patterns
- [API Route Types](#-api-route-types) - Type-safe API handlers
- [Server Action Types](#-server-action-types) - Form action typing
- [Middleware Types](#-middleware-types) - Edge middleware typing
- [Data Fetching Types](#-data-fetching-types) - Type-safe data patterns
- [Context and Provider Types](#-context-and-provider-types) - Context API typing
- [Environment Variables](#-environment-variables) - Type-safe env vars
- [Utility Types](#-utility-types) - Helper types for Next.js
- [OSE Platform Examples](#-ose-platform-examples) - Islamic finance type patterns
- [Best Practices](#-best-practices) - Production typing guidelines
- [Related Documentation](#-related-documentation) - Cross-references

## ⚙️ TypeScript Setup

Next.js automatically configures TypeScript when it detects a `tsconfig.json` file.

### Initial Setup

```bash
# Create a new Next.js project with TypeScript
npx create-next-app@latest --typescript

# Or add TypeScript to existing project
npm install --save-dev typescript @types/react @types/node

# Create tsconfig.json
touch tsconfig.json

# Start dev server - Next.js configures TypeScript automatically
npm run dev
```

### tsconfig.json Configuration

```json
{
  "compilerOptions": {
    // Language and environment
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,

    // Type checking
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,

    // Interop
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,

    // Emit
    "noEmit": true,
    "incremental": true,

    // Path aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    },

    // Next.js specific
    "allowJs": true,
    "skipLibCheck": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### next-env.d.ts

Next.js automatically generates this file with TypeScript definitions:

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
```

## 📄 Page Component Types

Type-safe page components with params and searchParams.

### Basic Page Types

```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <div>
      <h1>Home Page</h1>
    </div>
  );
}
```

### Page with Params

```typescript
// app/zakat/[id]/page.tsx
interface PageProps {
  params: {
    id: string;
  };
}

export default function ZakatDetailPage({ params }: PageProps) {
  return (
    <div>
      <h1>Zakat Calculation: {params.id}</h1>
    </div>
  );
}
```

### Page with Search Params

```typescript
// app/search/page.tsx
interface SearchPageProps {
  searchParams: {
    q?: string;
    category?: string;
    page?: string;
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q ?? '';
  const category = searchParams.category ?? 'all';
  const page = parseInt(searchParams.page ?? '1', 10);

  return (
    <div>
      <h1>Search: {query}</h1>
      <p>Category: {category}</p>
      <p>Page: {page}</p>
    </div>
  );
}
```

### Async Server Component Page

```typescript
// app/dashboard/page.tsx
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

interface DashboardPageProps {
  params: Record<string, never>;
  searchParams: {
    view?: 'grid' | 'list';
  };
}

export default async function DashboardPage({
  searchParams
}: DashboardPageProps) {
  const session = await auth();
  const view = searchParams.view ?? 'grid';

  if (!session) {
    return <div>Please log in</div>;
  }

  const calculations = await db.zakatCalculation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1>Dashboard</h1>
      <div className={view === 'grid' ? 'grid' : 'list'}>
        {calculations.map((calc) => (
          <div key={calc.id}>{calc.amount}</div>
        ))}
      </div>
    </div>
  );
}
```

### Dynamic Route with Multiple Params

```typescript
// app/articles/[category]/[slug]/page.tsx
interface ArticlePageProps {
  params: {
    category: string;
    slug: string;
  };
  searchParams: {
    preview?: string;
  };
}

export default async function ArticlePage({
  params,
  searchParams
}: ArticlePageProps) {
  const isPreview = searchParams.preview === 'true';

  const article = await db.article.findUnique({
    where: {
      category: params.category,
      slug: params.slug,
    },
  });

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <article>
      {isPreview && <div>Preview Mode</div>}
      <h1>{article.title}</h1>
      <div>{article.content}</div>
    </article>
  );
}
```

## 🎨 Layout Component Types

Type-safe layout components with children and params.

### Root Layout

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'OSE Platform',
    template: '%s | OSE Platform',
  },
  description: 'Islamic finance platform',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### Nested Layout with Params

```typescript
// app/dashboard/[workspace]/layout.tsx
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: {
    workspace: string;
  };
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const session = await auth();

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const workspace = await db.workspace.findUnique({
    where: {
      slug: params.workspace,
      members: {
        some: { userId: session.user.id },
      },
    },
  });

  if (!workspace) {
    return <div>Workspace not found</div>;
  }

  return (
    <div>
      <nav>
        <h2>{workspace.name}</h2>
      </nav>
      <main>{children}</main>
    </div>
  );
}
```

### Layout with Multiple Slots

```typescript
// app/dashboard/layout.tsx
interface DashboardLayoutProps {
  children: React.ReactNode;
  analytics: React.ReactNode; // @analytics slot
  team: React.ReactNode; // @team slot
}

export default function DashboardLayout({
  children,
  analytics,
  team,
}: DashboardLayoutProps) {
  return (
    <div>
      <div>{children}</div>
      <aside>
        <div>{analytics}</div>
        <div>{team}</div>
      </aside>
    </div>
  );
}
```

## 🖥️ Server Component Types

Type-safe patterns for async Server Components.

### Async Component with Data Fetching

```typescript
// components/ZakatCalculations.tsx
import { db } from '@/lib/db';

interface ZakatCalculation {
  id: string;
  amount: number;
  nisab: number;
  zakatDue: number;
  createdAt: Date;
}

interface ZakatCalculationsProps {
  userId: string;
  limit?: number;
}

export async function ZakatCalculations({
  userId,
  limit = 10,
}: ZakatCalculationsProps) {
  const calculations = await db.zakatCalculation.findMany({
    where: { userId },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h2>Your Zakat Calculations</h2>
      {calculations.map((calc) => (
        <div key={calc.id}>
          <p>Amount: ${calc.amount}</p>
          <p>Zakat Due: ${calc.zakatDue}</p>
          <time>{calc.createdAt.toLocaleDateString()}</time>
        </div>
      ))}
    </div>
  );
}
```

### Generic Server Component

```typescript
// components/DataList.tsx
interface DataListProps<T extends { id: string }> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function DataList<T extends { id: string }>({
  items,
  renderItem,
  emptyMessage = 'No items found',
}: DataListProps<T>) {
  if (items.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// Usage
<DataList
  items={calculations}
  renderItem={(calc) => <div>${calc.amount}</div>}
  emptyMessage="No calculations yet"
/>
```

### Server Component with Error Handling

```typescript
// components/UserProfile.tsx
import { db } from '@/lib/db';

interface UserProfileProps {
  userId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export async function UserProfile({ userId }: UserProfileProps) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return <div>User not found</div>;
    }

    return (
      <div>
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        {user.avatar && <img src={user.avatar} alt={user.name} />}
      </div>
    );
  } catch (error) {
    console.error('Failed to load user:', error);
    return <div>Failed to load user profile</div>;
  }
}
```

## 💻 Client Component Types

Type-safe patterns for Client Components with hooks and events.

### Client Component with State

```typescript
// components/ZakatCalculator.tsx
'use client';

import { useState } from 'react';

interface ZakatResult {
  zakatAmount: number;
  nisabThreshold: number;
  eligibleForZakat: boolean;
}

export function ZakatCalculator() {
  const [wealth, setWealth] = useState<number>(0);
  const [result, setResult] = useState<ZakatResult | null>(null);

  const calculateZakat = () => {
    const nisabThreshold = 5000; // Example threshold
    const zakatRate = 0.025; // 2.5%

    const eligibleForZakat = wealth >= nisabThreshold;
    const zakatAmount = eligibleForZakat ? wealth * zakatRate : 0;

    setResult({
      zakatAmount,
      nisabThreshold,
      eligibleForZakat,
    });
  };

  return (
    <div>
      <input
        type="number"
        value={wealth}
        onChange={(e) => setWealth(parseFloat(e.target.value) || 0)}
        placeholder="Enter your wealth"
      />
      <button onClick={calculateZakat}>Calculate Zakat</button>

      {result && (
        <div>
          {result.eligibleForZakat ? (
            <p>Zakat Due: ${result.zakatAmount.toFixed(2)}</p>
          ) : (
            <p>Below Nisab threshold (${result.nisabThreshold})</p>
          )}
        </div>
      )}
    </div>
  );
}
```

### Form Component with TypeScript

```typescript
// components/MurabahaApplicationForm.tsx
'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';

interface FormData {
  applicantName: string;
  email: string;
  productName: string;
  purchasePrice: number;
  preferredTerm: number;
}

interface FormErrors {
  applicantName?: string;
  email?: string;
  productName?: string;
  purchasePrice?: string;
  preferredTerm?: string;
}

export function MurabahaApplicationForm() {
  const [formData, setFormData] = useState<FormData>({
    applicantName: '',
    email: '',
    productName: '',
    purchasePrice: 0,
    preferredTerm: 12,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'purchasePrice' || name === 'preferredTerm'
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.applicantName.trim()) {
      newErrors.applicantName = 'Name is required';
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    if (formData.purchasePrice <= 0) {
      newErrors.purchasePrice = 'Purchase price must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/murabaha/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Application submitted successfully');
        // Reset form
        setFormData({
          applicantName: '',
          email: '',
          productName: '',
          purchasePrice: 0,
          preferredTerm: 12,
        });
      } else {
        alert('Failed to submit application');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="applicantName">Name</label>
        <input
          id="applicantName"
          name="applicantName"
          type="text"
          value={formData.applicantName}
          onChange={handleChange}
        />
        {errors.applicantName && <span>{errors.applicantName}</span>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <span>{errors.email}</span>}
      </div>

      <div>
        <label htmlFor="productName">Product</label>
        <input
          id="productName"
          name="productName"
          type="text"
          value={formData.productName}
          onChange={handleChange}
        />
        {errors.productName && <span>{errors.productName}</span>}
      </div>

      <div>
        <label htmlFor="purchasePrice">Purchase Price</label>
        <input
          id="purchasePrice"
          name="purchasePrice"
          type="number"
          value={formData.purchasePrice}
          onChange={handleChange}
        />
        {errors.purchasePrice && <span>{errors.purchasePrice}</span>}
      </div>

      <div>
        <label htmlFor="preferredTerm">Term (months)</label>
        <select
          id="preferredTerm"
          name="preferredTerm"
          value={formData.preferredTerm}
          onChange={handleChange}
        >
          <option value={6}>6 months</option>
          <option value={12}>12 months</option>
          <option value={24}>24 months</option>
          <option value={36}>36 months</option>
        </select>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  );
}
```

### Custom Hook with TypeScript

```typescript
// hooks/useZakatCalculation.ts
'use client';

import { useState, useCallback } from 'react';

interface ZakatCalculation {
  wealth: number;
  nisab: number;
  zakatAmount: number;
  eligibleForZakat: boolean;
}

interface UseZakatCalculationReturn {
  calculation: ZakatCalculation | null;
  calculate: (wealth: number, nisab: number) => void;
  reset: () => void;
  isEligible: boolean;
}

export function useZakatCalculation(): UseZakatCalculationReturn {
  const [calculation, setCalculation] = useState<ZakatCalculation | null>(null);

  const calculate = useCallback((wealth: number, nisab: number) => {
    const zakatRate = 0.025; // 2.5%
    const eligibleForZakat = wealth >= nisab;
    const zakatAmount = eligibleForZakat ? wealth * zakatRate : 0;

    setCalculation({
      wealth,
      nisab,
      zakatAmount,
      eligibleForZakat,
    });
  }, []);

  const reset = useCallback(() => {
    setCalculation(null);
  }, []);

  return {
    calculation,
    calculate,
    reset,
    isEligible: calculation?.eligibleForZakat ?? false,
  };
}

// Usage in component
export function ZakatCalculatorWithHook() {
  const { calculation, calculate, reset, isEligible } = useZakatCalculation();

  return (
    <div>
      <button onClick={() => calculate(10000, 5000)}>Calculate</button>
      <button onClick={reset}>Reset</button>
      {calculation && (
        <p>Zakat: ${calculation.zakatAmount}</p>
      )}
    </div>
  );
}
```

## 🔌 API Route Types

Type-safe API route handlers with Next.js types.

### Basic API Route

```typescript
// app/api/zakat/calculate/route.ts
import { NextRequest, NextResponse } from "next/server";

interface CalculateRequestBody {
  wealth: number;
  nisab: number;
}

interface CalculateResponse {
  zakatAmount: number;
  eligibleForZakat: boolean;
  rate: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CalculateRequestBody = await request.json();

    const { wealth, nisab } = body;

    if (typeof wealth !== "number" || typeof nisab !== "number") {
      return NextResponse.json({ error: "Invalid input: wealth and nisab must be numbers" }, { status: 400 });
    }

    if (wealth < 0 || nisab < 0) {
      return NextResponse.json({ error: "Wealth and nisab must be non-negative" }, { status: 400 });
    }

    const zakatRate = 0.025;
    const eligibleForZakat = wealth >= nisab;
    const zakatAmount = eligibleForZakat ? wealth * zakatRate : 0;

    const response: CalculateResponse = {
      zakatAmount,
      eligibleForZakat,
      rate: zakatRate,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Calculation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### API Route with Authentication

```typescript
// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile: UserProfile = {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Dynamic API Route

```typescript
// app/api/calculations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const calculation = await db.zakatCalculation.findUnique({
      where: { id: params.id },
    });

    if (!calculation) {
      return NextResponse.json({ error: "Calculation not found" }, { status: 404 });
    }

    return NextResponse.json(calculation, { status: 200 });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    await db.zakatCalculation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## ⚡ Server Action Types

Type-safe Server Actions for form mutations.

### Basic Server Action

```typescript
// actions/zakat.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface CalculateZakatInput {
  wealth: number;
  nisab: number;
}

interface CalculateZakatResult {
  success: boolean;
  zakatAmount?: number;
  error?: string;
}

export async function calculateZakat(input: CalculateZakatInput): Promise<CalculateZakatResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { wealth, nisab } = input;

    if (wealth < 0 || nisab < 0) {
      return { success: false, error: "Invalid input values" };
    }

    const zakatRate = 0.025;
    const eligibleForZakat = wealth >= nisab;
    const zakatAmount = eligibleForZakat ? wealth * zakatRate : 0;

    // Save to database
    await db.zakatCalculation.create({
      data: {
        userId: session.user.id,
        wealth,
        nisab,
        zakatAmount,
        eligibleForZakat,
      },
    });

    revalidatePath("/dashboard");

    return { success: true, zakatAmount };
  } catch (error) {
    console.error("Zakat calculation error:", error);
    return { success: false, error: "Calculation failed" };
  }
}
```

### FormData Server Action

```typescript
// actions/murabaha.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

interface FormState {
  success: boolean;
  error?: string;
  applicationId?: string;
}

export async function submitMurabahaApplication(prevState: FormState | null, formData: FormData): Promise<FormState> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Extract and validate form data
    const productName = formData.get("productName");
    const purchasePrice = formData.get("purchasePrice");
    const preferredTerm = formData.get("preferredTerm");

    if (typeof productName !== "string" || typeof purchasePrice !== "string" || typeof preferredTerm !== "string") {
      return { success: false, error: "Invalid form data" };
    }

    const price = parseFloat(purchasePrice);
    const term = parseInt(preferredTerm, 10);

    if (isNaN(price) || price <= 0) {
      return { success: false, error: "Invalid purchase price" };
    }

    if (isNaN(term) || term <= 0) {
      return { success: false, error: "Invalid term" };
    }

    // Create application
    const application = await db.murabahaApplication.create({
      data: {
        userId: session.user.id,
        productName,
        purchasePrice: price,
        preferredTerm: term,
        status: "PENDING",
      },
    });

    // Redirect on success
    redirect(`/applications/${application.id}`);
  } catch (error) {
    console.error("Application submission error:", error);
    return { success: false, error: "Submission failed" };
  }
}
```

### Server Action with Zod Validation

```typescript
// actions/waqf.ts
"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const waqfDonationSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  projectId: z.string().uuid("Invalid project ID"),
  recurring: z.boolean().default(false),
  frequency: z.enum(["monthly", "quarterly", "annually"]).optional(),
});

type WaqfDonationInput = z.infer<typeof waqfDonationSchema>;

interface DonationResult {
  success: boolean;
  donationId?: string;
  error?: string;
}

export async function createWaqfDonation(input: WaqfDonationInput): Promise<DonationResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    const validation = waqfDonationSchema.safeParse(input);

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message ?? "Validation failed",
      };
    }

    const data = validation.data;

    // Verify project exists
    const project = await db.waqfProject.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Create donation
    const donation = await db.waqfDonation.create({
      data: {
        userId: session.user.id,
        projectId: data.projectId,
        amount: data.amount,
        recurring: data.recurring,
        frequency: data.frequency,
        status: "PENDING",
      },
    });

    return { success: true, donationId: donation.id };
  } catch (error) {
    console.error("Donation creation error:", error);
    return { success: false, error: "Failed to create donation" };
  }
}
```

## 🛡️ Middleware Types

Type-safe Edge middleware patterns.

### Basic Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Add custom header
  const response = NextResponse.next();
  response.headers.set("x-custom-header", "value");

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### Authentication Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return NextResponse.next();
  }

  // Protected routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/user")) {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);

      const { payload } = await jwtVerify<JWTPayload>(token, secret);

      // Add user info to headers
      const response = NextResponse.next();
      response.headers.set("x-user-id", payload.userId);

      return response;
    } catch (error) {
      console.error("JWT verification failed:", error);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/user/:path*", "/login", "/register"],
};
```

## 📊 Data Fetching Types

Type-safe data fetching patterns.

### Typed Fetch Wrapper

```typescript
// lib/api.ts
interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

interface ApiError {
  message: string;
  status: number;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, ...init } = options;

    let url = `${this.baseUrl}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = {
        message: `HTTP error ${response.status}`,
        status: response.status,
      };
      throw error;
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.fetch<T>(endpoint, { method: "GET", params });
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: "DELETE" });
  }
}

// Usage
const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL!);

interface ZakatCalculation {
  id: string;
  amount: number;
  zakatDue: number;
}

const calculation = await api.get<ZakatCalculation>("/api/calculations/123");
```

### Type-Safe Database Queries

```typescript
// lib/db-types.ts
import { Prisma } from "@prisma/client";

// Type-safe query helpers
export type ZakatCalculationWithUser = Prisma.ZakatCalculationGetPayload<{
  include: { user: true };
}>;

export type ZakatCalculationSelect = Prisma.ZakatCalculationGetPayload<{
  select: {
    id: true;
    amount: true;
    zakatDue: true;
    createdAt: true;
  };
}>;

// Usage in Server Component
async function getCalculationsWithUsers(): Promise<ZakatCalculationWithUser[]> {
  return db.zakatCalculation.findMany({
    include: { user: true },
  });
}
```

## 🌐 Context and Provider Types

Type-safe Context API patterns for Client Components.

### Basic Context

```typescript
// contexts/ThemeContext.tsx
'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
```

### Complex Context with Reducer

```typescript
// contexts/ZakatContext.tsx
'use client';

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from 'react';

interface ZakatCalculation {
  id: string;
  wealth: number;
  nisab: number;
  zakatAmount: number;
  createdAt: Date;
}

interface ZakatState {
  calculations: ZakatCalculation[];
  currentCalculation: ZakatCalculation | null;
  loading: boolean;
  error: string | null;
}

type ZakatAction =
  | { type: 'ADD_CALCULATION'; payload: ZakatCalculation }
  | { type: 'SET_CALCULATIONS'; payload: ZakatCalculation[] }
  | { type: 'SET_CURRENT'; payload: ZakatCalculation | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'REMOVE_CALCULATION'; payload: string };

const initialState: ZakatState = {
  calculations: [],
  currentCalculation: null,
  loading: false,
  error: null,
};

function zakatReducer(state: ZakatState, action: ZakatAction): ZakatState {
  switch (action.type) {
    case 'ADD_CALCULATION':
      return {
        ...state,
        calculations: [action.payload, ...state.calculations],
        error: null,
      };
    case 'SET_CALCULATIONS':
      return { ...state, calculations: action.payload, loading: false };
    case 'SET_CURRENT':
      return { ...state, currentCalculation: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'REMOVE_CALCULATION':
      return {
        ...state,
        calculations: state.calculations.filter((c) => c.id !== action.payload),
      };
    default:
      return state;
  }
}

interface ZakatContextValue {
  state: ZakatState;
  dispatch: Dispatch<ZakatAction>;
}

const ZakatContext = createContext<ZakatContextValue | undefined>(undefined);

export function ZakatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(zakatReducer, initialState);

  return (
    <ZakatContext.Provider value={{ state, dispatch }}>
      {children}
    </ZakatContext.Provider>
  );
}

export function useZakat(): ZakatContextValue {
  const context = useContext(ZakatContext);

  if (context === undefined) {
    throw new Error('useZakat must be used within ZakatProvider');
  }

  return context;
}
```

## 🔐 Environment Variables

Type-safe environment variable management.

### Environment Schema with Zod

```typescript
// lib/env.ts
import { z } from "z od";

const envSchema = z.object({
  // Public variables (NEXT_PUBLIC_ prefix)
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_VERCEL_URL: z.string().optional(),

  // Server-only variables
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().email(),
  SMTP_PASSWORD: z.string().min(1),

  // Optional with defaults
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = validateEnv();
```

### Type-Safe Environment Usage

```typescript
// Usage in Server Components or API routes
import { env } from "@/lib/env";

// TypeScript knows these are strings
const apiUrl = env.NEXT_PUBLIC_API_URL;
const dbUrl = env.DATABASE_URL;

// TypeScript knows this is a number
const smtpPort: number = env.SMTP_PORT;

// TypeScript knows possible values
const nodeEnv: "development" | "test" | "production" = env.NODE_ENV;
```

### next.config.ts Environment Types

```typescript
// next.config.ts
import type { NextConfig } from "next";

const config: NextConfig = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY ?? "default-value",
  },
};

export default config;
```

## 🔧 Utility Types

Helper types for Next.js development.

### Common Utility Types

```typescript
// types/utils.ts

// Extract params type from page props
export type PageParams<T extends string> = {
  params: Record<T, string>;
};

// Extract search params type
export type SearchParams<T extends string> = {
  searchParams: Partial<Record<T, string | string[]>>;
};

// Combine params and search params
export type PageProps<P extends string = never, S extends string = never> = PageParams<P> & SearchParams<S>;

// Example usage
type ArticlePageProps = PageProps<"slug", "preview" | "version">;
// Results in:
// {
//   params: { slug: string };
//   searchParams: { preview?: string; version?: string; };
// }

// Async component return type
export type AsyncComponent<P = object> = (props: P) => Promise<React.ReactElement>;

// Server Action return type
export type ActionResult<T = unknown> = { success: true; data: T } | { success: false; error: string };

// API Response wrapper
export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

// Form state for useFormState
export type FormState<T = unknown> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };
```

### Type Guards

```typescript
// lib/type-guards.ts

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasProperty<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

// Usage in API route
export async function POST(request: NextRequest) {
  const body: unknown = await request.json();

  if (!isObject(body)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!hasProperty(body, "wealth") || !isNumber(body.wealth)) {
    return NextResponse.json({ error: "Invalid wealth" }, { status: 400 });
  }

  // TypeScript now knows body.wealth is a number
  const wealth: number = body.wealth;
}
```

## 🕌 OSE Platform Examples

Real-world TypeScript patterns for Islamic finance features.

### Zakat Domain Types

```typescript
// types/zakat.ts

export enum ZakatAssetType {
  CASH = "CASH",
  GOLD = "GOLD",
  SILVER = "SILVER",
  STOCKS = "STOCKS",
  REAL_ESTATE = "REAL_ESTATE",
  BUSINESS_ASSETS = "BUSINESS_ASSETS",
}

export interface ZakatAsset {
  id: string;
  type: ZakatAssetType;
  description: string;
  value: number;
  marketValue?: number;
  lastUpdated: Date;
}

export interface ZakatCalculationInput {
  assets: ZakatAsset[];
  liabilities: number;
  nisabThreshold: number;
  lunarYear: boolean;
}

export interface ZakatCalculationResult {
  totalAssets: number;
  totalLiabilities: number;
  netWealth: number;
  nisabThreshold: number;
  eligibleForZakat: boolean;
  zakatAmount: number;
  zakatPercentage: number;
  breakdown: {
    assetType: ZakatAssetType;
    value: number;
    zakatDue: number;
  }[];
}

export class ZakatCalculator {
  private static readonly ZAKAT_RATE = 0.025; // 2.5%

  static calculate(input: ZakatCalculationInput): ZakatCalculationResult {
    const totalAssets = input.assets.reduce((sum, asset) => sum + asset.value, 0);
    const netWealth = totalAssets - input.liabilities;
    const eligibleForZakat = netWealth >= input.nisabThreshold;
    const zakatAmount = eligibleForZakat ? netWealth * this.ZAKAT_RATE : 0;

    const breakdown = input.assets.map((asset) => ({
      assetType: asset.type,
      value: asset.value,
      zakatDue: eligibleForZakat ? asset.value * this.ZAKAT_RATE : 0,
    }));

    return {
      totalAssets,
      totalLiabilities: input.liabilities,
      netWealth,
      nisabThreshold: input.nisabThreshold,
      eligibleForZakat,
      zakatAmount,
      zakatPercentage: this.ZAKAT_RATE * 100,
      breakdown,
    };
  }
}
```

### Murabaha Contract Types

```typescript
// types/murabaha.ts

export enum MurabahaStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface MurabahaContract {
  id: string;
  clientId: string;
  productName: string;
  purchasePrice: number; // Cost to institution
  profitMargin: number; // Markup percentage
  sellingPrice: number; // Total amount client pays
  installmentPeriod: number; // Months
  monthlyPayment: number;
  startDate: Date;
  endDate: Date;
  status: MurabahaStatus;
  payments: MurabahaPayment[];
}

export interface MurabahaPayment {
  id: string;
  contractId: string;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  paidDate?: Date;
  status: "PENDING" | "PAID" | "OVERDUE" | "PARTIAL";
}

export interface CreateMurabahaInput {
  clientId: string;
  productName: string;
  purchasePrice: number;
  profitMargin: number;
  installmentPeriod: number;
  startDate: Date;
}

export class MurabahaCalculator {
  static calculateContract(input: CreateMurabahaInput): Omit<MurabahaContract, "id" | "payments"> {
    const profitAmount = input.purchasePrice * (input.profitMargin / 100);
    const sellingPrice = input.purchasePrice + profitAmount;
    const monthlyPayment = sellingPrice / input.installmentPeriod;
    const endDate = new Date(input.startDate);
    endDate.setMonth(endDate.getMonth() + input.installmentPeriod);

    return {
      clientId: input.clientId,
      productName: input.productName,
      purchasePrice: input.purchasePrice,
      profitMargin: input.profitMargin,
      sellingPrice,
      installmentPeriod: input.installmentPeriod,
      monthlyPayment,
      startDate: input.startDate,
      endDate,
      status: MurabahaStatus.DRAFT,
    };
  }

  static generatePaymentSchedule(
    contractId: string,
    startDate: Date,
    monthlyPayment: number,
    periods: number,
  ): Omit<MurabahaPayment, "id">[] {
    const payments: Omit<MurabahaPayment, "id">[] = [];

    for (let i = 0; i < periods; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i + 1);

      payments.push({
        contractId,
        dueDate,
        amount: monthlyPayment,
        paidAmount: 0,
        status: "PENDING",
      });
    }

    return payments;
  }
}
```

### Waqf Donation Types

```typescript
// types/waqf.ts

export enum WaqfProjectCategory {
  EDUCATION = "EDUCATION",
  HEALTHCARE = "HEALTHCARE",
  MOSQUE = "MOSQUE",
  WATER = "WATER",
  ORPHANAGE = "ORPHANAGE",
  GENERAL = "GENERAL",
}

export enum WaqfProjectStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CLOSED = "CLOSED",
}

export interface WaqfProject {
  id: string;
  name: string;
  description: string;
  category: WaqfProjectCategory;
  status: WaqfProjectStatus;
  targetAmount?: number;
  raisedAmount: number;
  donorCount: number;
  startDate: Date;
  endDate?: Date;
  location: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaqfDonation {
  id: string;
  projectId: string;
  donorId: string;
  amount: number;
  recurring: boolean;
  frequency?: "monthly" | "quarterly" | "annually";
  anonymous: boolean;
  donatedAt: Date;
  receiptNumber: string;
}

export interface CreateWaqfDonationInput {
  projectId: string;
  donorId: string;
  amount: number;
  recurring?: boolean;
  frequency?: "monthly" | "quarterly" | "annually";
  anonymous?: boolean;
}

export interface WaqfProjectStats {
  totalDonations: number;
  totalDonors: number;
  averageDonation: number;
  progressPercentage: number;
  remainingAmount: number;
  recentDonations: WaqfDonation[];
}

export class WaqfCalculator {
  static calculateProjectStats(project: WaqfProject, donations: WaqfDonation[]): WaqfProjectStats {
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const uniqueDonors = new Set(donations.map((d) => d.donorId));
    const totalDonors = uniqueDonors.size;
    const averageDonation = totalDonors > 0 ? totalDonations / totalDonors : 0;

    const progressPercentage = project.targetAmount ? (totalDonations / project.targetAmount) * 100 : 0;

    const remainingAmount = project.targetAmount ? Math.max(0, project.targetAmount - totalDonations) : 0;

    const recentDonations = donations.sort((a, b) => b.donatedAt.getTime() - a.donatedAt.getTime()).slice(0, 10);

    return {
      totalDonations,
      totalDonors,
      averageDonation,
      progressPercentage,
      remainingAmount,
      recentDonations,
    };
  }
}
```

## 📚 Best Practices

### 1. Enable Strict Mode

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 2. Use Type Inference

```typescript
// Good - let TypeScript infer
const [count, setCount] = useState(0);

// Unnecessary - TypeScript already knows
const [count, setCount] = useState<number>(0);

// Necessary - TypeScript needs help
const [user, setUser] = useState<User | null>(null);
```

### 3. Avoid `any` Type

```typescript
// Bad
function processData(data: any) {
  return data.value;
}

// Good
function processData(data: unknown) {
  if (isObject(data) && hasProperty(data, "value")) {
    return data.value;
  }
  throw new Error("Invalid data");
}
```

### 4. Use Discriminated Unions

```typescript
// API response types
type ApiResponse<T> = { status: "success"; data: T } | { status: "error"; error: string } | { status: "loading" };

function handleResponse<T>(response: ApiResponse<T>) {
  switch (response.status) {
    case "success":
      // TypeScript knows response.data exists
      return response.data;
    case "error":
      // TypeScript knows response.error exists
      throw new Error(response.error);
    case "loading":
      return null;
  }
}
```

### 5. Validate External Data

```typescript
// Use Zod for runtime validation
import { z } from "zod";

const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
});

async function getUserFromAPI(id: string) {
  const response = await fetch(`/api/users/${id}`);
  const data: unknown = await response.json();

  // Runtime validation
  const user = userSchema.parse(data);

  // TypeScript now knows user matches the schema
  return user;
}
```

### 6. Extract Complex Types

```typescript
// Extract reusable types
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Usage
type UserUpdate = DeepPartial<User>;
```

### 7. Type Component Props Properly

```typescript
// Use interface for component props (better error messages)
interface ButtonProps {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({ variant = "primary", size = "md", children, onClick, disabled = false }: ButtonProps) {
  // Implementation
}
```

## 🔗 Related Documentation

- [Next.js README](./README.md) - Next.js overview and getting started
- [Next.js Server Components](server-components.md) - Async component patterns
- [Next.js API Routes](api-routes.md) - Type-safe API handlers
- [Next.js Configuration](configuration.md) - TypeScript config setup
- [Next.js Data Fetching](data-fetching.md) - Type-safe data patterns
- [React TypeScript](../fe-react/typescript.md) - React-specific typing patterns

---

**Next Steps:**

- Explore [Next.js Server Components](server-components.md) for async typing patterns
- Review [Next.js API Routes](api-routes.md) for type-safe handlers
- Check [Next.js Security](security.md) for validation strategies
- Read [Next.js Testing](testing.md) for type-safe tests
