---
title: "Next.js Testing"
description: Comprehensive guide to testing Next.js applications including component testing with React Testing Library, Server Component testing, Server Action testing, E2E with Playwright, and integration testing
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - testing
  - vitest
  - playwright
  - react-testing-library
  - e2e
  - integration-testing
related:
  - ./server-components.md
  - ./api-routes.md
  - ./data-fetching.md
principles:
  - explicit-over-implicit
  - automation-over-manual
  - reproducibility
created: 2026-01-26
---

# Next.js Testing

## Quick Reference

**Testing Types**:

- [Component Testing](#component-testing) - React Testing Library + Vitest
- [Server Component Testing](#server-component-testing) - Testing RSC
- [Server Action Testing](#server-action-testing) - Testing mutations
- [API Route Testing](#api-route-testing) - Testing route handlers
- [E2E Testing](#e2e-testing-with-playwright) - Playwright automation

**Setup & Configuration**:

- [Test Setup](#test-setup) - Vitest configuration
- [Mocking](#mocking-strategies) - Database, API, modules
- [Test Utilities](#test-utilities) - Custom render, helpers

## Overview

**Testing Next.js applications** requires understanding the different rendering strategies (Server Components, Client Components, Server Actions) and choosing appropriate testing approaches for each. This guide covers modern testing patterns for Next.js 16+ with the App Router.

**Testing Philosophy**:

- **Test behavior, not implementation** - Focus on what users see and do
- **Integration over unit** - Test component interactions
- **Server Components as units** - They're pure functions
- **E2E for critical flows** - User journeys through the app
- **Mock external dependencies** - Databases, APIs, third-party services

This guide covers Next.js 16+ testing strategies for enterprise applications.

## Test Setup

### Install Dependencies

```bash
# Testing libraries
npm install --save-dev vitest @vitejs/plugin-react
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
npm install --save-dev @playwright/test

# MSW for API mocking
npm install --save-dev msw
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

```typescript
// vitest.setup.ts
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Component Testing

### Client Component Testing

```typescript
// features/zakat/components/ZakatForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ZakatForm } from './ZakatForm';

describe('ZakatForm', () => {
  it('renders form fields', () => {
    render(<ZakatForm defaultNisab={5000} />);

    expect(screen.getByLabelText(/your wealth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nisab threshold/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /calculate/i })).toBeInTheDocument();
  });

  it('displays nisab threshold hint', () => {
    render(<ZakatForm defaultNisab={5000} />);

    expect(screen.getByText(/current nisab based on gold price/i)).toBeInTheDocument();
  });

  it('validates wealth input', async () => {
    const user = userEvent.setup();
    render(<ZakatForm defaultNisab={5000} />);

    const wealthInput = screen.getByLabelText(/your wealth/i);
    const submitButton = screen.getByRole('button', { name: /calculate/i });

    // Try to submit empty form
    await user.click(submitButton);

    // Form should not submit (native HTML5 validation)
    expect(wealthInput).toBeInvalid();
  });

  it('calculates zakat for eligible wealth', async () => {
    const user = userEvent.setup();
    render(<ZakatForm defaultNisab={5000} />);

    // Fill form
    await user.type(screen.getByLabelText(/your wealth/i), '10000');

    // Submit
    await user.click(screen.getByRole('button', { name: /calculate/i }));

    // Note: Actual calculation happens in Server Action
    // This test verifies form submission triggers the action
  });
});
```

### Component with Props

```typescript
// components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick handler', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant styles', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);

    expect(container.firstChild).toHaveClass('bg-red-600');
  });
});
```

### Custom Render Function

```typescript
// test/utils/customRender.tsx
import { render } from '@testing-library/react';
import { ReactElement } from 'react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export function renderWithProviders(ui: ReactElement) {
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider>
        {children}
      </ThemeProvider>
    ),
  });
}
```

```typescript
// Usage
import { renderWithProviders } from '@/test/utils/customRender';

describe('ThemedComponent', () => {
  it('uses theme context', () => {
    renderWithProviders(<ThemedComponent />);
    // assertions
  });
});
```

## Server Component Testing

### Testing Pure Server Components

```typescript
// features/zakat/components/ZakatHistoryList.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ZakatHistoryList } from "./ZakatHistoryList";

// Mock database
vi.mock("@/lib/db/client", () => ({
  db: {
    zakatCalculation: {
      findMany: vi.fn(),
    },
  },
}));

describe("ZakatHistoryList Server Component", () => {
  it("renders list of calculations", async () => {
    const mockCalculations = [
      {
        id: "1",
        wealth: 10000,
        nisab: 5000,
        zakatAmount: 250,
        eligible: true,
        calculatedAt: new Date("2026-01-01"),
      },
      {
        id: "2",
        wealth: 8000,
        nisab: 5000,
        zakatAmount: 200,
        eligible: true,
        calculatedAt: new Date("2026-01-15"),
      },
    ];

    const { db } = await import("@/lib/db/client");
    vi.mocked(db.zakatCalculation.findMany).mockResolvedValue(mockCalculations);

    // Server Components are async
    const component = await ZakatHistoryList({ userId: "user-1" });
    render(component);

    expect(screen.getByText("Wealth: 10000")).toBeInTheDocument();
    expect(screen.getByText("Zakat: 250")).toBeInTheDocument();
    expect(screen.getByText("Wealth: 8000")).toBeInTheDocument();
    expect(screen.getByText("Zakat: 200")).toBeInTheDocument();
  });

  it("displays empty state when no calculations", async () => {
    const { db } = await import("@/lib/db/client");
    vi.mocked(db.zakatCalculation.findMany).mockResolvedValue([]);

    const component = await ZakatHistoryList({ userId: "user-1" });
    render(component);

    expect(screen.getByText(/no calculations found/i)).toBeInTheDocument();
  });
});
```

## Server Action Testing

### Testing Mutations

```typescript
// features/zakat/actions/calculateZakat.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateZakat } from "./calculateZakat";

// Mock dependencies
vi.mock("@/lib/db/client");
vi.mock("@/lib/auth");
vi.mock("next/cache");

describe("calculateZakat Server Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates zakat for eligible wealth", async () => {
    // Mock authentication
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", name: "John Doe", role: "user" },
    } as any);

    // Mock database
    const { db } = await import("@/lib/db/client");
    vi.mocked(db.zakatCalculation.create).mockResolvedValue({
      id: "calc-1",
      wealth: 10000,
      nisab: 5000,
      zakatAmount: 250,
      eligible: true,
    } as any);

    // Create FormData
    const formData = new FormData();
    formData.append("wealth", "10000");
    formData.append("nisab", "5000");

    // Execute action
    const result = await calculateZakat(null, formData);

    expect(result).toEqual({
      result: {
        zakatAmount: 250,
        eligible: true,
        calculationId: "calc-1",
      },
    });

    expect(db.zakatCalculation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        wealth: 10000,
        nisab: 5000,
        zakatAmount: 250,
        eligible: true,
      }),
    });
  });

  it("returns error for unauthenticated user", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue(null);

    const formData = new FormData();
    formData.append("wealth", "10000");
    formData.append("nisab", "5000");

    const result = await calculateZakat(null, formData);

    expect(result).toEqual({
      error: "Unauthorized. Please log in.",
    });
  });

  it("validates input and returns error for negative values", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", name: "John Doe" },
    } as any);

    const formData = new FormData();
    formData.append("wealth", "-100");
    formData.append("nisab", "5000");

    const result = await calculateZakat(null, formData);

    expect(result).toEqual({
      error: expect.stringContaining("must be positive"),
    });
  });

  it("revalidates paths after successful calculation", async () => {
    const { auth } = await import("@/lib/auth");
    const { revalidatePath } = await import("next/cache");

    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", name: "John Doe" },
    } as any);

    const { db } = await import("@/lib/db/client");
    vi.mocked(db.zakatCalculation.create).mockResolvedValue({
      id: "calc-1",
    } as any);

    const formData = new FormData();
    formData.append("wealth", "10000");
    formData.append("nisab", "5000");

    await calculateZakat(null, formData);

    expect(revalidatePath).toHaveBeenCalledWith("/zakat/history");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});
```

## API Route Testing

### Testing Route Handlers

```typescript
// app/api/zakat/calculations/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth");
vi.mock("@/lib/db/client");

describe("GET /api/zakat/calculations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns calculations for authenticated user", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as any);

    const { db } = await import("@/lib/db/client");
    vi.mocked(db.zakatCalculation.findMany).mockResolvedValue([{ id: "1", wealth: 10000, zakatAmount: 250 }] as any);

    vi.mocked(db.zakatCalculation.count).mockResolvedValue(1);

    const request = new NextRequest("http://localhost:3000/api/zakat/calculations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
  });

  it("returns 401 for unauthenticated user", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/zakat/calculations");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("respects pagination parameters", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as any);

    const { db } = await import("@/lib/db/client");
    vi.mocked(db.zakatCalculation.findMany).mockResolvedValue([]);
    vi.mocked(db.zakatCalculation.count).mockResolvedValue(50);

    const request = new NextRequest("http://localhost:3000/api/zakat/calculations?limit=20&offset=10");
    await GET(request);

    expect(db.zakatCalculation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 20,
        skip: 10,
      }),
    );
  });
});

describe("POST /api/zakat/calculations", () => {
  it("creates calculation for authenticated user", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as any);

    const { db } = await import("@/lib/db/client");
    vi.mocked(db.zakatCalculation.create).mockResolvedValue({
      id: "calc-1",
      wealth: 10000,
      zakatAmount: 250,
    } as any);

    const request = new NextRequest("http://localhost:3000/api/zakat/calculations", {
      method: "POST",
      body: JSON.stringify({
        wealth: 10000,
        nisab: 5000,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.zakatAmount).toBe(250);
  });

  it("validates input and returns 400 for invalid data", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1" },
    } as any);

    const request = new NextRequest("http://localhost:3000/api/zakat/calculations", {
      method: "POST",
      body: JSON.stringify({
        wealth: -100, // Invalid
        nisab: 5000,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });
});
```

## E2E Testing with Playwright

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Example

```typescript
// e2e/zakat-calculation.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Zakat Calculation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Login
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL("/dashboard");
  });

  test("completes zakat calculation successfully", async ({ page }) => {
    // Navigate to zakat calculator
    await page.click('a[href="/zakat/calculate"]');
    await expect(page).toHaveURL("/zakat/calculate");

    // Verify page loaded
    await expect(page.locator("h1")).toContainText("Calculate Your Zakat");

    // Fill form
    await page.fill('input[name="wealth"]', "10000");

    // Verify nisab is pre-filled
    const nisabValue = await page.inputValue('input[name="nisab"]');
    expect(parseFloat(nisabValue)).toBeGreaterThan(0);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for result
    await page.waitForSelector("text=Calculation Complete");

    // Verify result
    await expect(page.locator("text=Zakat Amount")).toBeVisible();
    await expect(page.locator("text=250")).toBeVisible();

    // Navigate to history
    await page.click('a[href="/zakat/history"]');
    await expect(page).toHaveURL("/zakat/history");

    // Verify calculation appears in history
    await expect(page.locator("text=Wealth: 10000")).toBeVisible();
    await expect(page.locator("text=Zakat: 250")).toBeVisible();
  });

  test("validates empty wealth input", async ({ page }) => {
    await page.goto("/zakat/calculate");

    // Try to submit without filling wealth
    await page.click('button[type="submit"]');

    // Verify HTML5 validation prevents submission
    const wealthInput = page.locator('input[name="wealth"]');
    const isInvalid = await wealthInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test("handles not eligible case", async ({ page }) => {
    await page.goto("/zakat/calculate");

    // Fill with wealth below nisab
    await page.fill('input[name="wealth"]', "1000");

    // Submit
    await page.click('button[type="submit"]');

    // Verify not eligible message
    await expect(page.locator("text=not yet eligible")).toBeVisible();
  });
});
```

### E2E with API Mocking

```typescript
// e2e/murabaha-application.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Murabaha Application", () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: "auth-token",
        value: "mock-jwt-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Mock API responses
    await page.route("**/api/murabaha/applications", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [
            {
              id: "app-1",
              applicationNumber: "MUR-001",
              status: "pending",
              requestedAmount: 50000,
              vendor: { name: "Electronics Store" },
            },
          ],
        }),
      });
    });
  });

  test("displays murabaha applications", async ({ page }) => {
    await page.goto("/murabaha/applications");

    await expect(page.locator("text=MUR-001")).toBeVisible();
    await expect(page.locator("text=Electronics Store")).toBeVisible();
    await expect(page.locator("text=$50000")).toBeVisible();
  });
});
```

## Mocking Strategies

### Database Mocking

```typescript
// test/mocks/db.ts
import { vi } from "vitest";

export const mockDb = {
  zakatCalculation: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    aggregate: vi.fn(),
    count: vi.fn(),
  },
  murabahaApplication: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  waqfDonation: {
    findMany: vi.fn(),
    create: vi.fn(),
    aggregate: vi.fn(),
  },
};

// Setup mock
vi.mock("@/lib/db/client", () => ({
  db: mockDb,
}));
```

### API Mocking with MSW

```typescript
// test/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/nisab/current", () => {
    return HttpResponse.json({
      amount: 5000,
      currency: "USD",
      goldPrice: 58.82,
      lastUpdated: new Date().toISOString(),
    });
  }),

  http.post("/api/zakat/calculations", async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json(
      {
        id: "calc-1",
        wealth: body.wealth,
        zakatAmount: body.wealth * 0.025,
        eligible: body.wealth >= body.nisab,
      },
      { status: 201 },
    );
  }),
];
```

```typescript
// test/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

```typescript
// vitest.setup.ts
import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./test/mocks/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Test Utilities

### Custom Matchers

```typescript
// test/utils/matchers.ts
import { expect } from "vitest";

expect.extend({
  toBeZakatEligible(received: { wealth: number; nisab: number }) {
    const pass = received.wealth >= received.nisab;

    return {
      pass,
      message: () =>
        pass
          ? `expected wealth ${received.wealth} not to meet nisab ${received.nisab}`
          : `expected wealth ${received.wealth} to meet nisab ${received.nisab}`,
    };
  },
});
```

### Test Factories

```typescript
// test/factories/zakat.ts
export function createMockZakatCalculation(overrides = {}) {
  return {
    id: "calc-1",
    userId: "user-1",
    wealth: 10000,
    nisab: 5000,
    zakatAmount: 250,
    eligible: true,
    calculatedAt: new Date(),
    ...overrides,
  };
}

export function createMockUser(overrides = {}) {
  return {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    ...overrides,
  };
}
```

## Best Practices

### ✅ Do

- **Test user behavior** not implementation
- **Use semantic queries** (`getByRole`, `getByLabelText`)
- **Mock external dependencies** (database, APIs)
- **Test error states** and edge cases
- **Use E2E** for critical user flows
- **Test accessibility** with axe
- **Keep tests focused** - one concept per test
- **Use factories** for test data

### ❌ Don't

- **Don't test implementation details**
- **Don't shallow render** (test integration)
- **Don't skip error cases**
- **Don't test third-party libraries**
- **Don't write flaky tests**
- **Don't skip async/await**
- **Don't mock everything**

## Test Coverage

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "test/", "**/*.test.{ts,tsx}", "**/*.config.{ts,js}"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

## Related Documentation

**Core Next.js**:

- [Server Components](server-components.md) - Testing RSC
- [API Routes](api-routes.md) - Testing route handlers
- [Data Fetching](data-fetching.md) - Testing data patterns

**Development**:

- [Best Practices](best-practices.md) - Testing standards
- [TypeScript](typescript.md) - Type-safe testing

---

**Next.js Version**: 14+ (Vitest, Playwright, React Testing Library)
