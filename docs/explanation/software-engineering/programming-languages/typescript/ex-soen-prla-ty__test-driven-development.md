---
title: "TypeScript Test-Driven Development"
description: TDD practices and testing frameworks for TypeScript
category: explanation
subcategory: prog-lang
tags:
  - typescript
  - tdd
  - testing
  - jest
  - vitest
  - unit-testing
  - integration-testing
related:
  - ./ex-soen-prla-ty__best-practices.md
  - ./ex-soen-prla-ty__behaviour-driven-development.md
principles:
  - automation-over-manual
  - explicit-over-implicit
updated: 2025-01-23
---

# TypeScript Test-Driven Development

**Quick Reference**: [Overview](#overview) | [Jest](#jest-30x) | [Vitest](#vitest-4x) | [Unit Testing](#unit-testing-patterns) | [Integration Testing](#integration-testing) | [Property-Based Testing](#property-based-testing) | [Mocking](#mocking-strategies) | [Coverage](#test-coverage) | [Related Documentation](#related-documentation)

## Overview

Test-Driven Development (TDD) follows Red-Green-Refactor cycle: write failing test, make it pass, refactor code. TypeScript's type system enhances TDD by catching errors at compile time.

### TDD Principles

- **Red-Green-Refactor**: Fail → Pass → Improve
- **Test First**: Write test before implementation
- **Small Steps**: One test at a time
- **Fast Feedback**: Tests run quickly
- **High Coverage**: Aim for >85% code coverage

### TDD Red-Green-Refactor

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Gray #808080
graph TD
    A["Red Phase<br/>Write Failing Test"]:::orange
    B["Test Fails<br/>Expected Error"]:::gray
    C["Green Phase<br/>Minimal Implementation"]:::teal
    D["Test Passes<br/>Feature Works"]:::teal
    E["Refactor Phase<br/>Clean Code"]:::purple
    F{"Tests<br/>Pass?"}:::orange
    G["Commit<br/>CI/CD Pipeline"]:::blue
    H["Fix Code<br/>Restore Green"]:::orange

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F -->|Yes| G
    F -->|No| H
    H --> E
    G --> A

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef gray fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

### Test Pyramid

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Gray #808080
graph TB
    A["E2E Tests<br/>Playwright, Full Flows<br/>Slow, Few"]:::orange
    B["Integration Tests<br/>Mocked I/O — MSW + in-memory<br/>Medium Speed"]:::purple
    C["Unit Tests<br/>Functions + Classes<br/>Fast, Many"]:::teal

    A --> B
    B --> C

    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

### Jest Execution Flow

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Gray #808080
graph TD
    A["jest Command<br/>Test Discovery"]:::blue
    B["Collect Tests<br/>*.test.ts files"]:::purple
    C["Setup beforeEach<br/>Test Fixtures"]:::gray
    D["Run Test Cases<br/>Execute Assertions"]:::orange
    E{"Assertions<br/>Pass?"}:::orange
    F["Teardown afterEach<br/>Cleanup"]:::gray
    G["Report Success"]:::teal
    H["Report Failure"]:::orange
    I["Coverage Report<br/>--coverage flag"]:::purple

    A --> B
    B --> C
    C --> D
    D --> E
    E -->|Yes| F
    E -->|No| H
    F --> G
    G --> I
    H --> I

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef gray fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

### Financial Domain Testing

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Gray #808080
graph TD
    A["Zakat Calculator<br/>Business Logic"]:::blue
    B["Unit Test<br/>calculate#40;#41; method"]:::teal
    C["Edge Cases<br/>Nisab Boundary"]:::purple
    D["Property Test<br/>fast-check"]:::purple
    E["Integration Test<br/>Database Persistence"]:::orange
    F["Type Safety<br/>Money Type Validation"]:::teal
    G["Compliance<br/>2.5% Rate Check"]:::teal

    A --> B
    A --> C
    A --> D
    A --> E
    B --> F
    C --> F
    D --> F
    E --> G

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

## Jest 30.x

### Setup

```typescript
// jest.config.ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/*.test.ts"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;
```

### Basic Tests

```typescript
// zakat-calculator.test.ts
import { ZakatCalculator } from "./zakat-calculator";

describe("ZakatCalculator", () => {
  let calculator: ZakatCalculator;

  beforeEach(() => {
    calculator = new ZakatCalculator();
  });

  describe("calculate", () => {
    it("calculates 2.5% for wealth above nisab", () => {
      const result = calculator.calculate({
        wealth: 100000,
        nisab: 3000,
      });

      expect(result).toBe(2500);
    });

    it("returns zero for wealth below nisab", () => {
      const result = calculator.calculate({
        wealth: 2000,
        nisab: 3000,
      });

      expect(result).toBe(0);
    });

    it("returns zero for negative wealth", () => {
      const result = calculator.calculate({
        wealth: -1000,
        nisab: 3000,
      });

      expect(result).toBe(0);
    });

    it("handles exact nisab threshold", () => {
      const result = calculator.calculate({
        wealth: 3000,
        nisab: 3000,
      });

      expect(result).toBe(75);
    });
  });
});

// Implementation
export class ZakatCalculator {
  calculate(params: { wealth: number; nisab: number }): number {
    if (params.wealth < params.nisab || params.wealth <= 0) {
      return 0;
    }
    return params.wealth * 0.025;
  }
}
```

### Async Testing

```typescript
import { DonationService } from "./donation-service";

describe("DonationService", () => {
  let service: DonationService;

  beforeEach(() => {
    service = new DonationService();
  });

  it("creates donation successfully", async () => {
    const donation = await service.create({
      donorId: "DNR-1234567890",
      amount: 1000,
      currency: "USD",
      category: "zakat",
    });

    expect(donation).toHaveProperty("donationId");
    expect(donation.amount).toBe(1000);
    expect(donation.status).toBe("pending");
  });

  it("rejects invalid donation", async () => {
    await expect(
      service.create({
        donorId: "INVALID",
        amount: -100,
        currency: "USD",
        category: "zakat",
      }),
    ).rejects.toThrow("Invalid donation data");
  });
});
```

## Vitest 4.x

### Setup

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**"],
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

### Basic Tests with Vitest

```typescript
// donation.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { Donation } from "./donation";

describe("Donation", () => {
  let donation: Donation;

  beforeEach(() => {
    donation = Donation.create({
      donationId: "DON-123",
      donorId: "DNR-456",
      amount: 1000,
      currency: "USD",
      category: "zakat",
    });
  });

  it("creates valid donation", () => {
    expect(donation.donationId).toBe("DON-123");
    expect(donation.amount).toBe(1000);
    expect(donation.status).toBe("pending");
  });

  it("processes donation", () => {
    donation.process();
    expect(donation.status).toBe("completed");
    expect(donation.processedAt).toBeInstanceOf(Date);
  });

  it("prevents double processing", () => {
    donation.process();
    expect(() => donation.process()).toThrow("Donation already processed");
  });
});
```

## Unit Testing Patterns

### Testing Value Objects

```typescript
import { Money } from "./money";

describe("Money", () => {
  describe("create", () => {
    it("creates valid money", () => {
      const result = Money.create(1000, "USD");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.amount).toBe(1000);
        expect(result.value.currency).toBe("USD");
      }
    });

    it("rejects negative amount", () => {
      const result = Money.create(-100, "USD");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("negative");
      }
    });

    it("rejects invalid currency", () => {
      const result = Money.create(1000, "XYZ");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("Invalid currency");
      }
    });
  });

  describe("add", () => {
    it("adds money with same currency", () => {
      const a = Money.create(100, "USD").value;
      const b = Money.create(200, "USD").value;

      const result = a.add(b);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.amount).toBe(300);
      }
    });

    it("rejects different currencies", () => {
      const a = Money.create(100, "USD").value;
      const b = Money.create(200, "EUR").value;

      const result = a.add(b);

      expect(result.ok).toBe(false);
    });
  });

  describe("equals", () => {
    it("compares money correctly", () => {
      const a = Money.create(100, "USD").value;
      const b = Money.create(100, "USD").value;
      const c = Money.create(200, "USD").value;

      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
    });
  });
});
```

### Testing Entities

```typescript
import { Donor } from "./donor";

describe("Donor", () => {
  it("creates donor with valid data", () => {
    const result = Donor.create({
      donorId: "DNR-1234567890",
      name: "Ahmad Ibrahim",
      email: EmailAddress.create("ahmad@example.com").value,
    });

    expect(result.ok).toBe(true);
  });

  it("records donation", () => {
    const donor = Donor.create(validData).value;
    const donation = Money.create(1000, "USD").value;

    const result = donor.recordDonation(donation);

    expect(result.ok).toBe(true);
    expect(donor.totalDonated.amount).toBe(1000);
  });

  it("accumulates multiple donations", () => {
    const donor = Donor.create(validData).value;

    donor.recordDonation(Money.create(1000, "USD").value);
    donor.recordDonation(Money.create(500, "USD").value);

    expect(donor.totalDonated.amount).toBe(1500);
  });
});
```

## Integration Testing

**REQUIRED**: Integration tests MUST mock all external I/O. No real database, no real network.

**See**: [Integration Testing Standards](../../development/test-driven-development-tdd/ex-soen-de-tedrdetd__integration-testing-standards.md) for full patterns.

### In-Memory Repository Integration

Use in-memory repository implementations — never a real database or ORM connection.

```typescript
// In-memory repository (no Prisma, no real DB)
class InMemoryDonationRepository implements DonationRepository {
  private store = new Map<string, Donation>();

  async save(donation: Donation): Promise<void> {
    this.store.set(donation.id, donation);
  }

  async findById(id: string): Promise<Donation | null> {
    return this.store.get(id) ?? null;
  }

  async findByDonor(donorId: string): Promise<Donation[]> {
    return Array.from(this.store.values()).filter((d) => d.donorId === donorId);
  }
}

describe("DonationService Integration", () => {
  let repository: InMemoryDonationRepository;
  let service: DonationService;

  beforeEach(() => {
    repository = new InMemoryDonationRepository(); // ✅ fresh in-memory state per test
    service = new DonationService(repository);
  });

  it("saves and retrieves donation", async () => {
    const donationId = await service.create({
      donorId: "DNR-1234567890",
      amount: 1000,
      currency: "USD",
      category: "zakat",
    });

    const retrieved = await repository.findById(donationId);

    expect(retrieved).toBeDefined();
    expect(retrieved!.amount).toBe(1000);
  });

  it("finds donations by donor", async () => {
    const donorId = "DNR-1234567890";

    await service.create({ donorId, amount: 500, currency: "USD", category: "zakat" });
    await service.create({ donorId, amount: 1000, currency: "USD", category: "sadaqah" });

    const donations = await repository.findByDonor(donorId);

    expect(donations).toHaveLength(2);
  });
});
```

### API Route Integration Testing with MSW

For Next.js API routes or Express handlers, test them with the real handler code but mock
all outbound HTTP using MSW. Never call a real external service.

````typescript
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// MSW server — intercepts all outbound HTTP from the handler under test
const server = setupServer(
  http.post("https://payment.gateway.com/charge", () =>
    HttpResponse.json({ status: "approved", transactionId: "TXN-123" }),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Donation API route", () => {
  it("creates donation with valid data", async () => {
    const request = new Request("http://localhost/api/donations", {
      method: "POST",
      body: JSON.stringify({ donorId: "DNR-1234567890", amount: 1000, currency: "USD" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request); // ✅ real handler, MSW-mocked payment gateway

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty("donationId");
  });

  it("rejects invalid data", async () => {
    const request = new Request("http://localhost/api/donations", {
      method: "POST",
      body: JSON.stringify({ donorId: "INVALID", amount: -100 }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request); // ✅ validation tested without real HTTP

    expect(response.status).toBe(400);
  });
})

## Property-Based Testing

### With fast-check

```typescript
import * as fc from "fast-check";
import { Money } from "./money";

describe("Money properties", () => {
  it("adding zero returns same value", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000000 }), fc.constantFrom("USD", "EUR", "SAR"), (amount, currency) => {
        const money = Money.create(amount, currency).value;
        const zero = Money.create(0, currency).value;
        const result = money.add(zero).value;

        expect(result.equals(money)).toBe(true);
      }),
    );
  });

  it("addition is commutative", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 1, max: 100000 }),
        fc.constantFrom("USD", "EUR", "SAR"),
        (a, b, currency) => {
          const moneyA = Money.create(a, currency).value;
          const moneyB = Money.create(b, currency).value;

          const ab = moneyA.add(moneyB).value;
          const ba = moneyB.add(moneyA).value;

          expect(ab.equals(ba)).toBe(true);
        },
      ),
    );
  });

  it("multiplication is distributive", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 2, max: 10 }),
        fc.constantFrom("USD", "EUR", "SAR"),
        (a, b, factor, currency) => {
          const moneyA = Money.create(a, currency).value;
          const moneyB = Money.create(b, currency).value;

          const sum = moneyA.add(moneyB).value;
          const multipliedSum = sum.multiply(factor).value;

          const multipliedA = moneyA.multiply(factor).value;
          const multipliedB = moneyB.multiply(factor).value;
          const sumOfMultiplied = multipliedA.add(multipliedB).value;

          expect(Math.abs(multipliedSum.amount - sumOfMultiplied.amount)).toBeLessThan(0.01);
        },
      ),
    );
  });
});
````

## Mocking Strategies

### Mock External Services

```typescript
import { DonationService } from "./donation-service";
import { EmailService } from "./email-service";

describe("DonationService with mocks", () => {
  it("sends email after creating donation", async () => {
    const mockEmailService = {
      send: jest.fn().mockResolvedValue(true),
    } as unknown as EmailService;

    const service = new DonationService(mockEmailService);

    await service.create({
      donorId: "DNR-1234567890",
      amount: 1000,
      currency: "USD",
      category: "zakat",
    });

    expect(mockEmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.any(String),
        subject: "Donation Confirmation",
      }),
    );
  });
});
```

### Spy on Methods

```typescript
import { DonationAnalytics } from "./analytics";

describe("DonationAnalytics", () => {
  it("tracks donation creation", () => {
    const analytics = new DonationAnalytics();
    const trackSpy = jest.spyOn(analytics, "track");

    analytics.recordDonation({
      donationId: "DON-123",
      amount: 1000,
      category: "zakat",
    });

    expect(trackSpy).toHaveBeenCalledWith("donation_created", {
      donationId: "DON-123",
      amount: 1000,
      category: "zakat",
    });
  });
});
```

## Test Coverage

### Running Coverage

```bash
# Jest
npm test -- --coverage

# Vitest
npx vitest --coverage
```

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**", "**/dist/**", "**/*.config.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      all: true,
    },
  },
});
```

## TDD Checklist

### Red Phase (Write Failing Test)

- [ ] Test written before implementation
- [ ] Test fails for the right reason (expected error message)
- [ ] Test is focused and tests one behavior
- [ ] Test has clear, descriptive name (describe/it blocks)
- [ ] Assertions use appropriate matchers (toBe, toEqual, toThrow)

### Green Phase (Make Test Pass)

- [ ] Simplest implementation that makes test pass
- [ ] No premature optimization
- [ ] All tests still passing (npm test)
- [ ] Code follows TypeScript idioms (type safety, readonly)
- [ ] Type definitions complete and accurate

### Refactor Phase

- [ ] Code is clean and maintainable
- [ ] No duplication (DRY principle)
- [ ] All tests still passing after refactoring
- [ ] Test coverage maintained or improved (--coverage)
- [ ] JSDoc comments added for public APIs

### Test Quality

- [ ] Tests are independent (no shared mutable state)
- [ ] Tests are repeatable (deterministic, no randomness)
- [ ] Tests are fast (< 100ms for unit tests)
- [ ] Test setup/teardown properly managed (beforeEach/afterEach)
- [ ] Mock/stub dependencies using jest.fn() or vitest mocks

### Jest/Vitest Best Practices

- [ ] describe blocks group related tests logically
- [ ] beforeEach used for test setup
- [ ] Async tests use async/await (not callbacks)
- [ ] Proper matchers for async code (resolves, rejects)
- [ ] Snapshot tests only for appropriate use cases

### Financial Domain Testing

- [ ] Zakat calculations tested with edge cases (nisab threshold, exact boundary)
- [ ] Decimal precision tested (no floating point errors, use Money type)
- [ ] Murabaha contract validation tested (profit margins, down payments)
- [ ] Audit trail creation verified in tests
- [ ] Currency handling tested (Money.create with currency validation)

## Related Documentation

- **[TypeScript Best Practices](ex-soen-prla-ty__best-practices.md)** - Coding standards
- **[TypeScript BDD](ex-soen-prla-ty__behaviour-driven-development.md)** - BDD patterns

---

**Last Updated**: 2025-01-23
**TypeScript Version**: 5.0+ (baseline), 5.4+ (milestone), 5.6+ (stable), 5.9.3+ (latest stable)
**Testing Frameworks**: Jest 30.2.0, Vitest 4.0.18, fast-check 3.x
**Maintainers**: OSE Documentation Team
