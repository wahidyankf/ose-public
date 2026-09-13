---
title: "TypeScript Documentation Index"
description: TypeScript guide for OSE Platform
category: explanation
subcategory: prog-lang
tags:
  - typescript
  - javascript
  - nodejs
  - documentation-index
principles:
  - documentation-first
  - explicit-over-implicit
created: 2026-01-24
---

# TypeScript Documentation

Use this reference when you are working in a TypeScript application or library in OSE Platform. It explains the repository-specific standards that make a change easier to review and safer to evolve; it is not a replacement for learning TypeScript fundamentals.

## Quick Reference

- [Overview](#overview)
- [Software Engineering Principles](#software-engineering-principles)
- [TypeScript Version Strategy](#typescript-version-strategy)
- [Documentation Structure](#documentation-structure)
- [TypeScript in the Platform](#typescript-in-the-platform)
- [Reproducible TypeScript Development](#reproducible-typescript-development)
- [Cross-Language Comparisons](#cross-language-comparisons)
- [Learning Paths](#learning-paths)
- [Code Examples](#code-examples-from-platform)
- [Tools & Ecosystem](#tools-and-ecosystem)
- [Resources](#resources-and-references)

## Overview

TypeScript is used across OSE Platform web applications and supporting libraries. Its type system and tooling help teams express product rules clearly and refactor with confidence.

### Why TypeScript?

- **Type Safety**: Catch errors at compile time, preventing runtime failures in financial calculations
- **Domain Modeling**: Express complex business rules (Murabaha contracts, Zakat calculations) as types
- **Refactoring Confidence**: Types enable safe refactoring across large codebases
- **Tooling**: Excellent IDE support with autocomplete, inline documentation, and error detection
- **Ecosystem**: Vast npm ecosystem with TypeScript support for frameworks and libraries
- **Developer Experience**: IntelliSense, type inference, and compile-time validation accelerate development

## Before You Start

These are **OSE Platform-specific style guides**, not a first lesson in TypeScript. If types, modules, and async code are new to you, start with the learning materials below; otherwise, jump to the standard that matches your change.

**You MUST understand TypeScript fundamentals before using these standards:**

- **[TypeScript Learning Path](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/typescript/_index.md)** - Complete 0-95% language coverage
- **[TypeScript By Example](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/typescript/by-example/_index.md)** - 75-85 annotated code examples (beginner → advanced)
- **[TypeScript In Practice](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/typescript/in-the-field/_index.md)** - Production patterns and design approaches
- **[TypeScript Release Highlights](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/typescript/release-highlights/)** - TypeScript 4.x-5.x LTS feature guides

**What this documentation covers**: OSE Platform naming conventions, framework choices, repository-specific patterns, how to apply TypeScript knowledge in THIS codebase.

**What this documentation does NOT cover**: TypeScript syntax, language fundamentals, generic patterns (those are in ayokoding-www).

**See**: [Programming Language Documentation Separation Convention](../../../../../repo-governance/conventions/structure/programming-language-docs-separation.md) for content separation rules.

## Coding Standards

**This documentation is the authoritative reference** for TypeScript coding standards in the open-sharia-enterprise platform.

All TypeScript code MUST follow the standards documented here:

1. **[Idioms](idioms.md) — TypeScript-specific patterns and conventions**
2. **[Best Practices](best-practices.md) — Clean code standards**
3. **[Anti-Patterns](anti-patterns.md) — Common mistakes to avoid**

**For Agents**: Reference this documentation when writing TypeScript code. The `swe-programming-typescript` skill provides quick access to these standards.

### Quick Standards Reference

- **Naming Conventions**: See [Best Practices - Code Organization](best-practices.md#code-organization) — naming, organization, and coding standards
- **Error Handling**: See [Error Handling](error-handling.md) — error handling patterns for robust TypeScript applications
- **Type Safety**: See [Type Safety](type-safety.md) — leveraging TypeScript's type system for safer financial code
- **Testing Standards**: See [Test-Driven Development](test-driven-development.md) — TDD practices and testing frameworks for TypeScript
- **Security Practices**: See [Security](security.md) — defense-in-depth security for TypeScript applications

**Related**: [Functional Programming](../../../../../repo-governance/development/pattern/functional-programming.md) - Cross-language FP principles

## Software Engineering Principles

TypeScript development in this platform follows the software engineering principles from [repo-governance/principles/software-engineering/](../../../../../repo-governance/principles/software-engineering/README.md):

1. **[Automation Over Manual](../../../../../repo-governance/principles/software-engineering/automation-over-manual.md)** - TypeScript automates through ESLint, Prettier, Husky hooks, automated testing with Jest/Vitest, and CI/CD pipelines
2. **[Explicit Over Implicit](../../../../../repo-governance/principles/software-engineering/explicit-over-implicit.md)** - TypeScript enforces through explicit typing, no `any` types, explicit error handling with Result pattern, clear function signatures
3. **[Immutability Over Mutability](../../../../../repo-governance/principles/software-engineering/immutability.md)** - TypeScript encourages immutable patterns through `readonly`, `const`, frozen objects, and functional programming patterns
4. **[Pure Functions Over Side Effects](../../../../../repo-governance/principles/software-engineering/pure-functions.md)** - TypeScript supports through first-class functions, arrow functions, functional core/imperative shell architecture
5. **[Reproducibility First](../../../../../repo-governance/principles/software-engineering/reproducibility.md)** - TypeScript enables through Volta pinning, package-lock.json, strict tsconfig, deterministic builds

**See Also**: [Functional Programming](functional-programming.md) — pure functions patterns, [Best Practices](best-practices.md) — explicit coding standards, [Type Safety](type-safety.md) — immutable type patterns.

## TypeScript Version Strategy

```mermaid
timeline
    title TypeScript Version Timeline (2023-2025)
    2023-03 : TypeScript 5.0 ⭐
            : ECMAScript Decorators
            : Const Type Parameters
            : Enum Union Support
    2024-03 : TypeScript 5.4
            : NoInfer Utility Type
            : Closure Narrowing Preserved
            : Object.groupBy / Map.groupBy
    2024-09 : TypeScript 5.6
            : Iterator Helper Methods
            : Improved Nullish Checks
            : Disallowed Truthy Checks
    2024-11 : TypeScript 5.9 ✅
            : Path Rewriting
            : Relative Type Checking
            : Never-Initializing Checks
```

**Platform Strategy**: TypeScript 5.0+ (baseline) → TypeScript 5.4+ (milestone) → TypeScript 5.6+ (stable) → TypeScript 5.9.3+ (latest)

### Current Baseline: TypeScript 5.0+ (Decorators Era)

**Platform Standard**: TypeScript 5.0 is the minimum required version for all TypeScript projects in the platform.

**Rationale**:

- ECMAScript Stage 3 decorators for metadata and dependency injection
- Const type parameters preserve literal types in generic functions
- Enum members as union types for better discriminated unions
- Foundation for modern TypeScript patterns (2023-2026)

### Recommended Version: TypeScript 5.4+ (Inference Control)

**Migration Path**: Projects are encouraged to use TypeScript 5.4+ for enhanced features:

- `NoInfer` utility type prevents unwanted type inference
- Preserved type narrowing in closures eliminates redundant checks
- Native `Object.groupBy` and `Map.groupBy` support
- Improved control flow analysis for complex conditionals

### Current Stable: TypeScript 5.6+ (Strictness & Standards)

**Features**:

- Iterator helper methods (map, filter, take, drop, flatMap)
- Improved truthiness and nullish narrowing
- Disallowed nonsensical comparisons
- Region-priority resolution in Intl APIs

### Latest Release: TypeScript 5.9 (Monorepo Optimization)

**Released**: November 2024 (version 5.9.3 as of January 24, 2026)

**Major Features**:

- Path rewriting for relative imports (`--rewriteRelativeImportExtensions`)
- Relative type checking mode for faster incremental builds
- Never-initializing function checks catch initialization bugs
- Automatic ancestor `tsconfig.json` search

**Development Features**:

- Enhanced path completion for relative imports
- Improved error messages with actionable suggestions
- Better JSDoc support for type inference

**See**: [TypeScript Release Highlights](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/typescript/release-highlights/) on ayokoding-www — TypeScript 5.x version feature guides.

### Version References

- [TypeScript 5.0](release-5-0.md) — platform baseline
- [TypeScript 5.4](release-5-4.md) — inference-control milestone
- [TypeScript 5.6](release-5-6.md) — strictness milestone
- [TypeScript 5.9](release-5-9.md) — documented strategy target

## Documentation Structure

### Foundation

| Document                                                               | Description                  | Lines | Topics                                 |
| ---------------------------------------------------------------------- | ---------------------------- | ----- | -------------------------------------- |
| [Best Practices](best-practices.md) — Core principles and patterns     | Core principles and patterns | 1,800 | Clarity, SRP, Immutability, Testing    |
| [Idioms](idioms.md) — TypeScript-specific patterns                     | TypeScript-specific patterns | 1,152 | Type guards, Utility types, Generics   |
| [Type Safety](type-safety.md) — Advanced type patterns                 | Advanced type patterns       | 763   | Branded types, Discriminated unions    |
| [Error Handling](error-handling.md) — Result/Either patterns           | Result/Either patterns       | 591   | Custom errors, Async errors            |
| [Interfaces & Types](interfaces-and-types.md) — Type system deep dive  | Type system deep dive        | 303   | Interfaces, Generics, Mapped types     |
| [Functional Programming](functional-programming.md) — FP in TypeScript | FP in TypeScript             | 187   | Pure functions, Composition, Monads    |
| [Concurrency](concurrency-and-parallelism.md) — Async patterns         | Async patterns               | 169   | Promises, Web Workers, AbortController |
| [Modules](modules-and-dependencies.md) — Module systems                | Module systems               | 159   | ESM, npm/pnpm/bun, Monorepos           |

### Advanced Topics

| Document                                                          | Description             | Lines | Topics                                      |
| ----------------------------------------------------------------- | ----------------------- | ----- | ------------------------------------------- |
| [Domain-Driven Design](domain-driven-design.md) — DDD patterns    | DDD patterns            | 2,200 | Entities, Value Objects, Aggregates, Events |
| [Web Services](web-services.md) — API development                 | API development         | 2,000 | Express, Fastify, NestJS, tRPC, Hono        |
| [Security](security.md) — Security best practices                 | Security best practices | 1,900 | XSS, Injection, Auth, OWASP Top 10          |
| [Performance](performance.md) — Optimization                      | Optimization            | 1,800 | Profiling, Caching, Database, Async         |
| [Memory Management](memory-management.md) — V8 GC & Memory        | V8 GC & Memory          | 1,600 | Heap, GC, Leaks, Streaming                  |
| [Finite State Machines](finite-state-machine.md) — State patterns | State patterns          | 1,600 | FSM, XState, Payment flows                  |
| [Anti-Patterns](anti-patterns.md) — Common mistakes               | Common mistakes         | 1,800 | Type safety, Error handling, Design         |

### Testing & Quality

| Document                                                                                     | Description         | Lines | Topics                               |
| -------------------------------------------------------------------------------------------- | ------------------- | ----- | ------------------------------------ |
| [Testing](testing.md) — Testing foundations                                                  | Testing foundations | N/A   | Testing pyramid, test types, tooling |
| [Test-Driven Development](test-driven-development.md) — TDD practices                        | TDD practices       | 1,800 | Jest, Vitest, Property testing       |
| [Behaviour-Driven Development](behaviour-driven-development.md) — canonical Gherkin adapters | BDD with Gherkin    | 1,500 | Vitest Cucumber, Playwright BDD, E2E |
| [Linting & Formatting](linting-and-formatting.md) — Code quality                             | Code quality        | 1,400 | ESLint 9.x/10.x, Prettier, Hooks     |

## TypeScript in the Platform

### Primary Use Cases

**Web Applications**:

- React single-page applications with Next.js
- Server-side rendered applications for performance
- Progressive web apps (PWAs) for offline support
- Admin dashboards and internal tools

**Backend Services**:

- RESTful APIs with Express, Fastify, or Hono
- GraphQL APIs with Apollo Server
- tRPC endpoints for end-to-end type safety
- Microservices with NestJS framework

**CLI Tools**:

- rhino-cli for repository management and hygiene
- Build tools and code generators
- Database migration scripts

**Libraries & Packages**:

- Shared utilities in monorepo libs/ directory
- Domain logic packages for reuse across apps
- Type definitions for platform-specific types
- Testing utilities and mocks

### Framework Stack

**Backend Frameworks**:

**Express** (5.2.1 / 4.x) - Minimalist, flexible:

```typescript
import express from "express";

const app = express();

app.get("/zakat/:wealth", (req, res) => {
  const wealth = parseFloat(req.params.wealth);
  const zakat = wealth >= 5000 ? wealth * 0.025 : 0;
  res.json({ wealth, zakat });
});

app.listen(3000);
```

**Fastify** (5.x) - High-performance, schema-based:

```typescript
import Fastify from "fastify";

const fastify = Fastify();

fastify.get<{ Params: { wealth: string } }>("/zakat/:wealth", async (request) => {
  const wealth = parseFloat(request.params.wealth);
  return { wealth, zakat: wealth >= 5000 ? wealth * 0.025 : 0 };
});

fastify.listen({ port: 3000 });
```

**NestJS** (11.x) - Enterprise, dependency injection:

```typescript
import { Controller, Get, Param } from "@nestjs/common";
import { ZakatService } from "./zakat.service";

@Controller("zakat")
export class ZakatController {
  constructor(private readonly zakatService: ZakatService) {}

  @Get(":wealth")
  calculate(@Param("wealth") wealth: string) {
    return this.zakatService.calculate(parseFloat(wealth));
  }
}
```

**tRPC** (11.x) - Type-safe, no codegen:

```typescript
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

const appRouter = t.router({
  zakat: t.procedure
    .input((val: unknown) => {
      if (typeof val === "number") return val;
      throw new Error("Input must be number");
    })
    .query(({ input }) => ({
      wealth: input,
      zakat: input >= 5000 ? input * 0.025 : 0,
    })),
});

// Client automatically knows types!
```

**Hono** (4.x) - Edge computing, ultra-fast:

```typescript
import { Hono } from "hono";

const app = new Hono();

app.get("/zakat/:wealth", (c) => {
  const wealth = parseFloat(c.req.param("wealth"));
  return c.json({ wealth, zakat: wealth >= 5000 ? wealth * 0.025 : 0 });
});

export default app;
```

**Testing Frameworks**:

**Jest** (30.2.0) - Mature, feature-rich:

```typescript
describe("ZakatCalculator", () => {
  it("calculates 2.5% for wealth above nisab", () => {
    expect(calculateZakat(10000, 5000)).toBe(250);
  });

  it("returns 0 for wealth below nisab", () => {
    expect(calculateZakat(3000, 5000)).toBe(0);
  });
});
```

**Vitest** (4.0.18) - Fast, Vite-powered:

```typescript
import { describe, it, expect } from "vitest";

describe("ZakatCalculator", () => {
  it("handles edge cases", () => {
    expect(calculateZakat(5000, 5000)).toBe(125); // Exactly at nisab
    expect(calculateZakat(0, 5000)).toBe(0);
  });
});
```

**Playwright** (1.57.0) - E2E testing:

```typescript
import { test, expect } from "@playwright/test";

test("donation form submits successfully", async ({ page }) => {
  await page.goto("/donate");
  await page.fill('[name="amount"]', "1000");
  await page.click('button[type="submit"]');
  await expect(page.locator(".success-message")).toBeVisible();
});
```

### Architectural Patterns

**Hexagonal Architecture** (Ports and Adapters):

```typescript
// Domain core (pure TypeScript, no frameworks)
interface ZakatPort {
  calculate(wealth: number): Result<number, Error>;
}

class ZakatCalculator implements ZakatPort {
  calculate(wealth: number): Result<number, Error> {
    if (wealth < 0) return err(new Error("Wealth cannot be negative"));
    const nisab = 5000;
    const amount = wealth >= nisab ? wealth * 0.025 : 0;
    return ok(amount);
  }
}

// Infrastructure adapter (HTTP)
class ZakatHttpAdapter {
  constructor(private calculator: ZakatPort) {}

  async handle(request: Request): Promise<Response> {
    const { wealth } = await request.json();
    const result = this.calculator.calculate(wealth);

    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ zakat: result.value }), {
      status: 200,
    });
  }
}
```

**Functional Core, Imperative Shell**:

```typescript
// Functional core (pure functions, no side effects)
function calculateZakat(wealth: number, nisab: number): number {
  return wealth >= nisab ? wealth * 0.025 : 0;
}

function validateWealth(wealth: number): Result<number, Error> {
  if (wealth < 0) return err(new Error("Wealth cannot be negative"));
  if (!Number.isFinite(wealth)) return err(new Error("Wealth must be finite"));
  return ok(wealth);
}

// Imperative shell (side effects at boundaries)
async function processZakatRequest(request: Request): Promise<Response> {
  const { wealth, nisab = 5000 } = await request.json();

  const validatedWealth = validateWealth(wealth);
  if (!validatedWealth.ok) {
    return new Response(JSON.stringify({ error: validatedWealth.error.message }), {
      status: 400,
    });
  }

  const zakat = calculateZakat(validatedWealth.value, nisab);

  await saveToDatabase({ wealth, nisab, zakat }); // Side effect

  return new Response(JSON.stringify({ zakat }), { status: 200 });
}
```

**Event-Driven Architecture**:

```typescript
// Domain events
interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly eventType: string;
}

interface ZakatCalculatedEvent extends DomainEvent {
  readonly eventType: "ZakatCalculated";
  readonly donorId: string;
  readonly wealth: number;
  readonly zakatAmount: number;
}

// Event bus
class EventBus {
  private handlers = new Map<string, Array<(event: DomainEvent) => void>>();

  subscribe(eventType: string, handler: (event: DomainEvent) => void): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  publish(event: DomainEvent): void {
    const handlers = this.handlers.get(event.eventType) || [];
    handlers.forEach((handler) => handler(event));
  }
}

// Usage
const eventBus = new EventBus();

eventBus.subscribe("ZakatCalculated", (event) => {
  console.log("Zakat calculated:", event);
  // Send notification, update analytics, etc.
});

const event: ZakatCalculatedEvent = {
  eventId: crypto.randomUUID(),
  occurredAt: new Date(),
  eventType: "ZakatCalculated",
  donorId: "donor-123",
  wealth: 10000,
  zakatAmount: 250,
};

eventBus.publish(event);
```

### Real-World OSE Platform Examples

**Example 1: Zakat Calculation Service**:

```typescript
// Domain model
interface Money {
  readonly amount: number;
  readonly currency: string;
}

interface ZakatCalculationInput {
  wealth: Money;
  nisab: Money;
  rate: number;
}

interface ZakatCalculationResult {
  eligible: boolean;
  zakatAmount: Money;
  remainingWealth: Money;
}

// Pure function
function calculateZakat(input: ZakatCalculationInput): Result<ZakatCalculationResult, Error> {
  if (input.wealth.currency !== input.nisab.currency) {
    return err(new Error("Currency mismatch"));
  }

  const eligible = input.wealth.amount >= input.nisab.amount;
  const zakatAmount: Money = eligible
    ? { amount: input.wealth.amount * input.rate, currency: input.wealth.currency }
    : { amount: 0, currency: input.wealth.currency };

  const remainingWealth: Money = {
    amount: input.wealth.amount - zakatAmount.amount,
    currency: input.wealth.currency,
  };

  return ok({ eligible, zakatAmount, remainingWealth });
}

// API endpoint (Express)
app.post("/api/zakat/calculate", async (req, res) => {
  const result = calculateZakat({
    wealth: req.body.wealth,
    nisab: req.body.nisab,
    rate: 0.025,
  });

  if (!result.ok) {
    res.status(400).json({ error: result.error.message });
    return;
  }

  res.json(result.value);
});
```

**Example 2: Murabaha Contract State Machine**:

```typescript
// States
type MurabahaState = "draft" | "pending-approval" | "approved" | "active" | "completed" | "cancelled";

// Events
type MurabahaEvent =
  | { type: "submit" }
  | { type: "approve" }
  | { type: "reject" }
  | { type: "activate" }
  | { type: "complete" }
  | { type: "cancel" };

// State machine
class MurabahaContract {
  private state: MurabahaState = "draft";

  transition(event: MurabahaEvent): Result<MurabahaState, Error> {
    const nextState = this.getNextState(event);

    if (!nextState.ok) {
      return err(nextState.error);
    }

    this.state = nextState.value;
    return ok(this.state);
  }

  private getNextState(event: MurabahaEvent): Result<MurabahaState, Error> {
    switch (this.state) {
      case "draft":
        return event.type === "submit" ? ok("pending-approval") : err(new Error("Invalid transition"));
      case "pending-approval":
        return event.type === "approve"
          ? ok("approved")
          : event.type === "reject"
            ? ok("draft")
            : err(new Error("Invalid transition"));
      case "approved":
        return event.type === "activate" ? ok("active") : err(new Error("Invalid transition"));
      case "active":
        return event.type === "complete"
          ? ok("completed")
          : event.type === "cancel"
            ? ok("cancelled")
            : err(new Error("Invalid transition"));
      default:
        return err(new Error("Invalid state"));
    }
  }
}
```

**Example 3: Donation Campaign with NestJS**:

```typescript
// Module (NestJS)
@Module({
  imports: [TypeOrmModule.forFeature([Campaign, Donation])],
  controllers: [CampaignController],
  providers: [CampaignService],
})
export class CampaignModule {}

// Service
@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepo: Repository<Campaign>,
    @InjectRepository(Donation)
    private donationRepo: Repository<Donation>,
  ) {}

  async createCampaign(dto: CreateCampaignDto): Promise<Campaign> {
    const campaign = this.campaignRepo.create(dto);
    return this.campaignRepo.save(campaign);
  }

  async donate(campaignId: string, amount: number, donorId: string): Promise<Donation> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    const donation = this.donationRepo.create({
      campaign,
      amount,
      donorId,
      createdAt: new Date(),
    });

    return this.donationRepo.save(donation);
  }
}

// Controller
@Controller("campaigns")
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.campaignService.createCampaign(dto);
  }

  @Post(":id/donate")
  donate(@Param("id") id: string, @Body() dto: DonateDto) {
    return this.campaignService.donate(id, dto.amount, dto.donorId);
  }
}
```

### Integration with Nx Monorepo

**Project Structure**:

```
apps/
├── ose-www/         # Next.js 16 content platform (TypeScript, tRPC)
├── ayokoding-www/            # Next.js 16 fullstack content platform (TypeScript, tRPC)
├── organiclever-www/         # Next.js 16 landing website
└── rhino-cli/                # F# CLI tool (repository management)

libs/
├── ts-ui/                   # Shared TypeScript UI components
├── web-ui/                  # Shared web UI components
└── web-ui-token/            # Design tokens for web UI
```

**Import Pattern**:

```typescript
// Apps import from libs
import { Logger } from "@open-sharia-enterprise/ts-logger";
import { ConfigService } from "@open-sharia-enterprise/ts-config";
import { ZakatCalculator } from "@open-sharia-enterprise/ts-zakat-calculator";

// Libs can import other libs (no circular dependencies)
// ts-zakat-calculator imports ts-logger
import { Logger } from "@open-sharia-enterprise/ts-logger";

class ZakatCalculator {
  private logger = new Logger("ZakatCalculator");

  calculate(wealth: number): number {
    this.logger.debug(`Calculating zakat for wealth: ${wealth}`);
    return wealth >= 5000 ? wealth * 0.025 : 0;
  }
}
```

**Nx Commands**:

```bash
# Build specific library
./hippo run --class ephemeral --disk-path . -- npm exec nx -- build ts-zakat-calculator

# Run fast quality gate (pre-push standard)
./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ts-zakat-calculator:test:quick

# Run isolated unit tests
./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ts-zakat-calculator:test:unit

# Lint specific library
./hippo run --class ephemeral --disk-path . -- npm exec nx -- lint ts-zakat-calculator

# Build only affected projects (after git changes)
./hippo run --class transactional --disk-path . -- npm exec nx -- affected -t build

# Run quality gate for affected projects
./hippo run --class transactional --disk-path . -- npm exec nx -- affected -t test:quick

# Visualize dependency graph
./hippo run --class service --disk-path . -- npm exec nx -- graph
```

**See**: [Nx Target Standards](../../../../../repo-governance/development/infra/nx-targets.md) for canonical target names.

## Reproducible TypeScript Development

### Version Management with Volta

**Volta** is the recommended tool for pinning Node.js and npm versions across the team.

**Setup Volta**:

```bash
# Install Volta
curl https://get.volta.sh | bash

# Pin Node.js version for project
volta pin node@24.16.0

# Pin npm version
volta pin npm@11.11.0
```

**package.json configuration** (automatically added by Volta):

```json
{
  "volta": {
    "node": "24.16.0",
    "npm": "11.11.0"
  }
}
```

**Benefits**:

- **Team Consistency**: All developers use same Node.js/npm versions
- **Automatic Switching**: Volta switches versions when entering project directory
- **CI/CD Alignment**: Use same versions in continuous integration
- **No Manual Management**: No need to manually install/switch Node versions

### package-lock.json Importance

**Why package-lock.json matters**:

```json
{
  "name": "ose-platform",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "node_modules/typescript": {
      "version": "5.9.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz",
      "integrity": "sha512-..."
    }
  }
}
```

**Critical for reproducibility**:

- **Exact Versions**: Locks exact versions of all dependencies and transitive dependencies
- **Integrity Checks**: SHA-512 hashes verify package contents haven't changed
- **Deterministic Installs**: `npm ci` installs exact versions from lock file
- **Security**: Prevents supply chain attacks through version pinning
- **Team Alignment**: All developers install identical dependency tree

**Best practices**:

```bash
# Always commit package-lock.json
git add package-lock.json
git commit -m "chore: update dependencies"

# Use npm ci in CI/CD (not npm install)
npm ci  # Clean install from lock file

# Update lock file when adding dependencies
npm install new-package
git add package.json package-lock.json
git commit -m "feat: add new-package dependency"
```

### Docker Development Containers

**Dockerfile for reproducible development**:

```dockerfile
FROM node:24.16.0-alpine

# Install system dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with exact versions
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

**docker-compose.yml for local development**:

```yaml
version: "3.8"

services:
  app:
    build: .
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD:-postgres}@db:5432/ose_platform

  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=ose_platform
    ports:
      - "5432:5432"
```

### Environment Reproducibility

**Create .env.example** (committed to repository):

```bash
# Node.js Environment
NODE_ENV=development

# Database
DATABASE_URL=postgresql://localhost:5432/ose_platform
DATABASE_POOL_SIZE=10

# Redis
REDIS_URL=redis://localhost:6379

# API Keys (use placeholder values)
API_KEY_PLACEHOLDER=your-api-key-here
JWT_SECRET_PLACEHOLDER=your-jwt-secret-here

# Feature Flags
ENABLE_ZAKAT_CALCULATOR=true
ENABLE_MURABAHA_CONTRACTS=true
```

**Setup script** (setup.sh):

```bash
#!/bin/bash
set -e

echo "🔧 Setting up OSE Platform development environment..."

# Check Node.js version
REQUIRED_NODE_VERSION="24.16.0"
CURRENT_NODE_VERSION=$(node -v | cut -d'v' -f2)

if [ "$CURRENT_NODE_VERSION" != "$REQUIRED_NODE_VERSION" ]; then
  echo "❌ Node.js version mismatch!"
  echo "   Required: $REQUIRED_NODE_VERSION"
  echo "   Current: $CURRENT_NODE_VERSION"
  echo "   Install Volta and run: volta pin node@$REQUIRED_NODE_VERSION"
  exit 1
fi

# Copy .env.example if .env doesn't exist
if [ ! -f .env ]; then
  echo "📋 Copying .env.example to .env..."
  cp .env.example .env
  echo "⚠️  Please update .env with your actual values"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Run database migrations
echo "🗄️  Running database migrations..."
npm run migrate

echo "✅ Setup complete! Run 'npm run dev' to start development server."
```

### Strict tsconfig.json

**Recommended tsconfig.json for reproducibility**:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "esnext",
    "lib": ["ES2024", "DOM"],
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

**Strict mode benefits**:

- **noUncheckedIndexedAccess**: Prevents `undefined` access bugs with array/object indexing
- **exactOptionalPropertyTypes**: Distinguishes between `undefined` and missing properties
- **noImplicitReturns**: Ensures all code paths return values
- **noUnusedLocals/Parameters**: Catches dead code

### CI/CD Configuration

**GitHub Actions workflow** (.github/workflows/ci.yml):

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "24.16.0"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm run test:ci

      - name: Build
        run: npm run build
```

**See**: [Reproducibility First principle](../../../../../repo-governance/principles/software-engineering/reproducibility.md)

## Cross-Language Comparisons

### TypeScript vs Golang

**Type Systems**:

| Feature           | TypeScript                            | Golang                            |
| ----------------- | ------------------------------------- | --------------------------------- |
| Type Safety       | Compile-time only (erased at runtime) | Compile-time + runtime            |
| Structural Typing | ✅ Full support (duck typing)         | ❌ Nominal typing                 |
| Generics          | ✅ Full support (TS 2.1+)             | ✅ Limited support (Go 1.18+)     |
| Union Types       | ✅ Native (type \| type)              | ❌ Interface{} or code generation |
| Null Safety       | ✅ strictNullChecks                   | ❌ nil can be any pointer         |
| Type Inference    | ✅ Sophisticated                      | ✅ Basic                          |

**Example - Sum Type**:

```typescript
// TypeScript: Native union types
type PaymentMethod =
  | { type: "card"; cardNumber: string }
  | { type: "bank"; accountNumber: string }
  | { type: "cash"; amount: number };

function processPayment(method: PaymentMethod): string {
  switch (method.type) {
    case "card":
      return `Processing card: ${method.cardNumber}`;
    case "bank":
      return `Processing bank: ${method.accountNumber}`;
    case "cash":
      return `Processing cash: ${method.amount}`;
  }
}
```

```go
// Golang: Requires interface + type assertions
type PaymentMethod interface {
    Process() string
}

type CardPayment struct {
    CardNumber string
}

func (c CardPayment) Process() string {
    return fmt.Sprintf("Processing card: %s", c.CardNumber)
}

type BankPayment struct {
    AccountNumber string
}

func (b BankPayment) Process() string {
    return fmt.Sprintf("Processing bank: %s", b.AccountNumber)
}
```

**Concurrency Models**:

| Feature               | TypeScript                      | Golang               |
| --------------------- | ------------------------------- | -------------------- |
| Concurrency Primitive | Promises, async/await           | Goroutines, channels |
| Threads               | Single-threaded (event loop)    | M:N threading model  |
| Shared Memory         | ✅ (requires synchronization)   | ✅ (mutex-based)     |
| Message Passing       | ❌ (can simulate with queues)   | ✅ Native (channels) |
| CPU-Bound Tasks       | ❌ Limited (use Worker Threads) | ✅ Excellent         |

**Example - Concurrent Processing**:

```typescript
// TypeScript: Promise.all for concurrency
async function processTransactions(transactions: Transaction[]): Promise<Result[]> {
  const promises = transactions.map((tx) => processTransaction(tx));
  return Promise.all(promises);
}
```

```go
// Golang: Goroutines + channels
func processTransactions(transactions []Transaction) []Result {
    results := make(chan Result, len(transactions))
    var wg sync.WaitGroup

    for _, tx := range transactions {
        wg.Add(1)
        go func(t Transaction) {
            defer wg.Done()
            results <- processTransaction(t)
        }(tx)
    }

    go func() {
        wg.Wait()
        close(results)
    }()

    var output []Result
    for result := range results {
        output = append(output, result)
    }
    return output
}
```

**When to Choose**:

- **TypeScript**: Web applications, full-stack JavaScript, rapid prototyping, extensive npm ecosystem
- **Golang**: CLI tools, high-concurrency services, system programming, microservices

### TypeScript vs Rust

**Type System and Safety**:

| Feature            | TypeScript                        | Rust                                   |
| ------------------ | --------------------------------- | -------------------------------------- |
| Type System        | Structural, compile-time          | Nominal, compile-time                  |
| Null Safety        | `strictNullChecks` (opt-in)       | ✅ `Option<T>` enforced by compiler    |
| Memory Safety      | GC (V8)                           | ✅ Ownership/borrow checker, no GC     |
| Error Handling     | `try/catch` or union types        | ✅ `Result<T, E>` enforced by compiler |
| Generics           | ✅ Variance annotations (TS 4.7+) | ✅ Monomorphised, zero-cost            |
| Concurrency Safety | Single-threaded event loop        | ✅ Send/Sync enforced at compile time  |

**Example - Error Handling**:

```typescript
// TypeScript: tRPC handler calculating zakat obligation
import { z } from "zod";

const zakatInput = z.object({ wealth: z.number(), nisab: z.number() });

function calculateZakat(input: z.infer<typeof zakatInput>): number {
  if (input.wealth < input.nisab) return 0;
  return input.wealth * 0.025;
}
```

```rust
// Rust: CLI validation with compile-time Result propagation (organiclever-be style)
use std::fmt;

#[derive(Debug)]
enum ZakatError {
    NegativeWealth(f64),
    InvalidNisab(f64),
}

impl fmt::Display for ZakatError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ZakatError::NegativeWealth(w) => write!(f, "wealth cannot be negative: {w}"),
            ZakatError::InvalidNisab(n) => write!(f, "nisab must be positive: {n}"),
        }
    }
}

fn calculate_zakat(wealth: f64, nisab: f64) -> Result<f64, ZakatError> {
    if wealth < 0.0 { return Err(ZakatError::NegativeWealth(wealth)); }
    if nisab <= 0.0 { return Err(ZakatError::InvalidNisab(nisab)); }
    Ok(if wealth >= nisab { wealth * 0.025 } else { 0.0 })
}
```

**Performance and Runtime**:

| Aspect              | TypeScript (Node.js)           | Rust                                 |
| ------------------- | ------------------------------ | ------------------------------------ |
| Startup Time        | Moderate (V8 JIT warm-up)      | Near-instant (no runtime)            |
| Memory Usage        | Higher (V8 heap + GC pressure) | Minimal (stack/heap, manual control) |
| Throughput          | Good (I/O-bound async)         | Excellent (CPU-bound + async)        |
| Binary Distribution | Requires Node.js runtime       | ✅ Single static binary              |
| Build Tooling       | Fast (esbuild, swc, Vite)      | Cargo (incremental, parallel)        |
| Ecosystem           | npm (huge, web-centric)        | crates.io (growing, systems-centric) |

**OSE Platform Usage**:

- **TypeScript**: `ose-www`, `ayokoding-www`, `organiclever-www`, `ose-app-web` — all web frontends and tRPC backends
- **F#**: `organiclever-be` (REST API), `ose-be` (REST API), `rhino-cli` (repo management), `crane-cli` (PDF pipeline)

**When to Choose**:

- **TypeScript**: Web frontends, Node.js tRPC backends, rapid iteration, npm ecosystem integration
- **Rust**: CLI tools requiring single-binary distribution, performance-critical backend services, memory-constrained environments

### TypeScript vs F\#

**Type System Philosophies**:

| Feature              | TypeScript                      | F#                                     |
| -------------------- | ------------------------------- | -------------------------------------- |
| Type System          | Structural, OOP-first           | Nominal, functional-first              |
| Null Safety          | `strictNullChecks` (opt-in)     | ✅ `Option<'T>` enforced by compiler   |
| Discriminated Unions | Union types (`A \| B`)          | ✅ First-class `type DU = A \| B of T` |
| Pattern Matching     | Limited (`switch`, type guards) | ✅ Exhaustive `match` expressions      |
| Immutability         | Opt-in (`readonly`, `const`)    | ✅ Immutable by default (`let`)        |
| Side Effects         | Unrestricted                    | Tracked via computation expressions    |

**Example - Domain Modelling**:

```typescript
// TypeScript: murabaha transaction modelled with discriminated union
type MurabahaStatus =
  | { kind: "pending"; requestedAt: Date }
  | { kind: "approved"; profitRate: number; approvedAt: Date }
  | { kind: "rejected"; reason: string };

function describeStatus(status: MurabahaStatus): string {
  switch (status.kind) {
    case "pending":
      return `Pending since ${status.requestedAt.toISOString()}`;
    case "approved":
      return `Approved at ${(status.profitRate * 100).toFixed(2)}% profit`;
    case "rejected":
      return `Rejected: ${status.reason}`;
  }
}
```

```fsharp
// F#: same domain model — crane-cli style, exhaustive match enforced at compile time
type MurabahaStatus =
    | Pending of RequestedAt: DateTimeOffset
    | Approved of ProfitRate: decimal * ApprovedAt: DateTimeOffset
    | Rejected of Reason: string

let describeStatus status =
    match status with
    | Pending requestedAt -> $"Pending since {requestedAt:O}"
    | Approved (profitRate, _) -> $"Approved at {profitRate * 100m:F2}%% profit"
    | Rejected reason -> $"Rejected: {reason}"
// Compiler error if a case is missing — no runtime surprises
```

**Ecosystem and Tooling**:

| Aspect           | TypeScript                     | F#                                         |
| ---------------- | ------------------------------ | ------------------------------------------ |
| Runtime          | Node.js / browser (V8)         | .NET 8+ (CoreCLR)                          |
| Package Manager  | npm (huge, web-centric)        | NuGet (.NET ecosystem)                     |
| Build Tooling    | esbuild, swc, Vite (very fast) | `dotnet build` (incremental)               |
| Interop          | JavaScript (native)            | C# / .NET (first-class)                    |
| Functional Style | Optional (lodash, fp-ts)       | ✅ Built-in (pipelines, computation exprs) |
| Learning Curve   | Moderate (JS + types)          | Steeper (FP paradigm shift)                |

**OSE Platform Usage**:

- **TypeScript**: All web apps and tRPC backends — web-first, npm ecosystem integration
- **F#**: `crane-cli` — PDF-to-Markdown pipeline; hexagonal ports-and-adapters architecture where exhaustive pattern matching and discriminated unions model pipeline stages cleanly

**When to Choose**:

- **TypeScript**: Web frontends, Node.js backends, tRPC APIs, teams with JavaScript background
- **F#**: Data transformation pipelines, document processing, domain-rich backends where exhaustive modelling of states matters and .NET interop is available

### TypeScript vs C\#

**Language Characteristics**:

| Feature          | TypeScript                       | C#                                         |
| ---------------- | -------------------------------- | ------------------------------------------ |
| Type System      | Structural, gradual              | Nominal, static                            |
| Null Safety      | `strictNullChecks` (opt-in)      | ✅ Nullable reference types (C# 8+)        |
| Runtime          | Node.js / browser (V8)           | .NET 8+ (CoreCLR)                          |
| Async Model      | `Promise` / `async-await`        | `Task<T>` / `async-await` (same concept)   |
| OOP Support      | ✅ Classes, interfaces, generics | ✅ Full OOP (classes, records, interfaces) |
| Functional Style | Optional (fp-ts, native methods) | Partial (LINQ, records, pattern matching)  |
| Interop          | JavaScript (native)              | F# / .NET (first-class, same CLR)          |

**Example - Donation Processing**:

```typescript
// TypeScript: tRPC mutation for donation submission
import { z } from "zod";
import { publicProcedure } from "../trpc";

const donationSchema = z.object({
  campaignId: z.string().uuid(),
  amount: z.number().positive(),
  donorName: z.string().min(1),
});

export const submitDonation = publicProcedure.input(donationSchema).mutation(async ({ input, ctx }) => {
  const donation = await ctx.db.donation.create({ data: input });
  return { id: donation.id, status: "received" };
});
```

```csharp
// C#: ASP.NET Core minimal API endpoint for the same operation
// Typical in .NET interop scenarios or enterprise backend integration
app.MapPost("/donations", async (DonationRequest req, AppDbContext db) =>
{
    if (req.Amount <= 0)
        return Results.BadRequest("Amount must be positive");

    var donation = new Donation
    {
        CampaignId = req.CampaignId,
        Amount = req.Amount,
        DonorName = req.DonorName,
        ReceivedAt = DateTimeOffset.UtcNow,
    };

    db.Donations.Add(donation);
    await db.SaveChangesAsync();
    return Results.Ok(new { donation.Id, Status = "received" });
});

record DonationRequest(Guid CampaignId, decimal Amount, string DonorName);
```

**Ecosystem and Deployment**:

| Aspect          | TypeScript                     | C#                                        |
| --------------- | ------------------------------ | ----------------------------------------- |
| Package Manager | npm (huge ecosystem)           | NuGet (.NET ecosystem)                    |
| Deploy Target   | Vercel, Node.js, edge runtimes | Azure, AWS, Kubernetes, IIS               |
| Startup Time    | Fast (V8 JIT)                  | Moderate (CLR warm-up, improving in .NET) |
| Tooling         | VSCode, esbuild, swc           | Visual Studio, Rider, `dotnet` CLI        |
| Enterprise Fit  | Modern web stacks              | Legacy enterprise and .NET shops          |

**OSE Platform Usage**:

- **TypeScript**: All web frontends and tRPC backends — the primary application language for web-facing surfaces
- **C# / .NET**: Dotnet interop layer when integrating with existing enterprise .NET systems; shares the CLR with `crane-cli`'s F# runtime, enabling smooth library sharing across the .NET stack

**When to Choose**:

- **TypeScript**: Web frontends, Node.js tRPC APIs, Vercel-hosted applications, npm ecosystem integration
- **C#**: Enterprise .NET backend integration, existing ASP.NET Core services, scenarios where the full .NET SDK is already in the stack via F# tooling

### Decision Matrix

**Choose TypeScript when**:

- Building web frontends (React, Next.js)
- Full-stack JavaScript development (Node.js + browser)
- Authoring tRPC APIs for OSE Platform web apps
- Rapid development with npm ecosystem
- Type safety without runtime overhead

**Choose Golang when**:

- Building CLI tools and system utilities
- High-concurrency backend services
- Microservices with low memory footprint
- Simple deployment (single binary)

**Choose Rust when**:

- Building performance-critical CLI tools (`rhino-cli`, `crane-cli`)
- Single-binary distribution with no runtime dependency
- Systems-level code where zero-cost abstractions are required

**Choose F# when**:

- Building REST API backends where functional-first design and domain modelling matter (`organiclever-be`, `ose-be`)
- Building document-processing or data-transformation pipelines (`crane-cli`)
- Domain modelling that benefits from exhaustive discriminated unions and pattern matching
- Functional-first design within the .NET ecosystem
- Interop with C# libraries is needed alongside a functional style

**Choose C# when**:

- Integrating with existing enterprise .NET services
- Building ASP.NET Core endpoints that share CLR with F# components
- The team's existing codebase is .NET-first and TypeScript adoption is not yet feasible

## Learning Paths

### Beginner Path

New to TypeScript? Start here:

1. [Best Practices](best-practices.md) — Core principles
2. [Interfaces & Types](interfaces-and-types.md) — Type basics
3. [Error Handling](error-handling.md) — Result pattern
4. [Idioms](idioms.md) — TypeScript patterns
5. [Modules](modules-and-dependencies.md) — Module systems
6. [Test-Driven Development](test-driven-development.md) — Testing basics
7. [Linting & Formatting](linting-and-formatting.md) — Code quality

### Intermediate Path

Comfortable with TypeScript? Level up:

1. [Type Safety](type-safety.md) — Advanced types
2. [Functional Programming](functional-programming.md) — FP patterns
3. [Concurrency](concurrency-and-parallelism.md) — Async patterns
4. [Domain-Driven Design](domain-driven-design.md) — DDD patterns
5. [Web Services](web-services.md) — API development
6. [Performance](performance.md) — Optimization
7. [Behaviour-Driven Development](behaviour-driven-development.md) — BDD
8. [Anti-Patterns](anti-patterns.md) — Avoid mistakes

### Advanced Path

Master-level TypeScript development:

1. [Security](security.md) — Security hardening
2. [Memory Management](memory-management.md) — V8 internals
3. [Finite State Machines](finite-state-machine.md) — Complex state
4. Version-specific docs (5.0, 5.4, 5.6, 5.9) - Latest features
5. Templates - Production patterns

## Code Examples from Platform

All examples use OSE Platform domain: donations, Zakat calculation, Murabaha contracts, campaign management.

### Money Value Object

```typescript
interface Money {
  readonly amount: number;
  readonly currency: string;
}

function createMoney(amount: number, currency: string): Result<Money, Error> {
  if (amount < 0) return err(new Error("Amount cannot be negative"));
  if (!["USD", "EUR", "SAR"].includes(currency)) {
    return err(new Error("Invalid currency"));
  }
  return ok(Object.freeze({ amount, currency }));
}
```

### Zakat Calculation

```typescript
function calculateZakat(wealth: number, nisab: number): number {
  if (wealth < nisab || wealth <= 0) return 0;
  return wealth * 0.025; // 2.5% for standard Zakat
}
```

### Donation Processing with Result Pattern

```typescript
async function processDonation(data: DonationInput): Promise<Result<Donation, Error>> {
  const validation = validateDonation(data);
  if (!validation.ok) return err(validation.error);

  const donation = await saveDonation(validation.value);
  if (!donation.ok) return err(donation.error);

  return ok(donation.value);
}
```

## Tools and Ecosystem

### Core Tools (Latest Versions)

- **TypeScript**: 5.9.3 (latest stable)
- **Node.js**: 24.16.0 LTS (Volta managed)
- **npm**: 11.11.0

### Package Managers

- **npm**: 11.11.0 (default)
- **pnpm**: 10.28.1 (fast, disk-efficient)
- **bun**: 1.3.6 (ultra-fast)

### Testing

- **Jest**: 30.2.0 (mature, feature-rich)
- **Vitest**: 4.0.18 (fast, Vite-powered)
- **@amiceli/vitest-cucumber**: 6.3.0 (canonical Gherkin Unit bindings)
- **playwright-bdd**: 8.5.1 (canonical Gherkin E2E bindings)
- **Playwright**: 1.57.0 (E2E, component testing)
- **fast-check**: 3.x (property-based testing)

### Code Quality

- **ESLint**: 9.39.0 / 10.0.0 (flat config)
- **Prettier**: 3.8.0 (formatting)
- **Husky**: 9.x (Git hooks)
- **lint-staged**: 15.x (pre-commit)

### Web Frameworks

- **Express**: 5.2.1 / 4.x (minimalist)
- **Fastify**: 5.x (high-performance)
- **NestJS**: 11.x (enterprise)
- **tRPC**: 11.x (type-safe APIs)
- **Hono**: 4.x (edge computing)

### Monorepo

- **Nx**: 22.5.2 (build system)
- **pnpm workspaces**: Package management

## Resources and References

### Official Documentation

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/overview.html)
- [Node.js Documentation](https://nodejs.org/docs/)

### OSE Platform Conventions

- [File Naming Convention](../../../../../repo-governance/conventions/structure/file-naming.md)
- [Diátaxis Framework](../../../../../repo-governance/conventions/structure/diataxis-framework.md)
- [Functional Programming Principle](../../../../../repo-governance/development/pattern/functional-programming.md)
- [Reproducibility Principle](../../../../../repo-governance/principles/software-engineering/reproducibility.md)

### Related Stack Documentation

- [Rust Documentation](../rust/README.md)
- [F# Documentation](../f-sharp/README.md)
- [C# Documentation](../c-sharp/README.md)
- [TypeScript Documentation Templates](./templates/README.md) — Reusable templates for TypeScript development patterns in OSE Platform
- [TypeScript Anti-Patterns](./anti-patterns.md) — Common TypeScript mistakes and how to avoid them
- [TypeScript Behaviour-Driven Development](./behaviour-driven-development.md) — Canonical Gherkin with Vitest Cucumber Unit bindings and Playwright BDD E2E bindings
- [TypeScript Best Practices](./best-practices.md) — Modern TypeScript coding standards and proven approaches (TypeScript 5.0+)
- [TypeScript Concurrency and Parallelism](./concurrency-and-parallelism.md) — Asynchronous and concurrent programming patterns in TypeScript
- [TypeScript Domain-Driven Design](./domain-driven-design.md) — Domain-Driven Design patterns and practices in TypeScript
- [TypeScript Error Handling](./error-handling.md) — Error handling patterns for robust TypeScript applications
- [TypeScript Finite State Machines](./finite-state-machine.md) — Implementing finite state machines in TypeScript
- [TypeScript Functional Programming](./functional-programming.md) — Functional programming patterns and practices in TypeScript
- [TypeScript Idioms](./idioms.md) — TypeScript-specific patterns and conventions for writing idiomatic code
- [TypeScript Interfaces and Types](./interfaces-and-types.md) — Deep dive into TypeScript's interface and type system
- [TypeScript Linting and Formatting](./linting-and-formatting.md) — Code quality with ESLint and Prettier for TypeScript
- [TypeScript Memory Management](./memory-management.md) — Memory management and garbage collection in TypeScript/Node.js
- [TypeScript Modules and Dependencies](./modules-and-dependencies.md) — Module systems and dependency management in TypeScript
- [TypeScript Performance](./performance.md) — Performance optimization and profiling for TypeScript applications
- [TypeScript Security](./security.md) — Defense-in-depth security for TypeScript applications including input validation, authentication, authorization, secure communication, and data protection for financial applications
- [TypeScript Test-Driven Development](./test-driven-development.md) — TDD practices and testing frameworks for TypeScript
- [TypeScript Testing](./testing.md) — OSE Platform TypeScript testing standards — Unit scenarios with Vitest, `@amiceli/vitest-cucumber`, and doubles such as MSW; zero-network local-resource Integration; E2E with `playwright-bdd` and Playwright
- [TypeScript Type Safety](./type-safety.md) — Leveraging TypeScript's type system for safer financial code
- [TypeScript Web Services](./web-services.md) — Building web services and APIs with TypeScript frameworks

---

**TypeScript Version**: 5.0+ (baseline), 5.4+ (milestone), 5.6+ (stable), 5.9.3+ (latest stable)
**Documentation**: Core files and version-specific files organized by category
**Maintainers**: OSE Documentation Team

## TypeScript Type System

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#0173B2','primaryTextColor':'#fff','primaryBorderColor':'#0173B2','lineColor':'#DE8F05','secondaryColor':'#029E73','tertiaryColor':'#CC78BC','fontSize':'16px'}}}%%
flowchart LR
    A[TypeScript Types] --> B[Primitive Types]
    A --> C[Object Types]
    A --> D[Advanced Types]
    A --> E[Utility Types]

    B --> B1[string number<br/>boolean]
    B --> B2[null undefined]
    B --> B3[symbol bigint]

    C --> C1[interface<br/>type alias]
    C --> C2[class<br/>constructor]
    C --> C3[array tuple]

    D --> D1[Union<br/>Type | Type]
    D --> D2[Intersection<br/>Type & Type]
    D --> D3[Conditional<br/>T extends U]
    D --> D4[Mapped Types<br/>Keyof In]

    E --> E1[Partial Required]
    E --> E2[Pick Omit]
    E --> E3[Record Exclude]

    C1 --> F[Zakat Interface]
    D1 --> G[Amount Union]
    E1 --> H[Optional Fields]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
    style D fill:#CC78BC,color:#fff
    style E fill:#0173B2,color:#fff
    style F fill:#029E73,color:#fff
```

## Compilation Process

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#0173B2','primaryTextColor':'#000','primaryBorderColor':'#0173B2','lineColor':'#DE8F05','secondaryColor':'#029E73','tertiaryColor':'#CC78BC','fontSize':'16px'}}}%%
flowchart TD
    A[.ts Files] --> B[TypeScript Compiler<br/>tsc]
    B --> C[Type Checking]
    C --> D{Types Valid?}

    D -->|No| E[Compilation Error]
    D -->|Yes| F[Type Erasure]

    F --> G[JS Generation]
    G --> H{Target}

    H -->|ES5| I[ES5 JavaScript]
    H -->|ES2020| J[ES2020 JavaScript]
    H -->|ESNext| K[ESNext JavaScript]

    I --> L[.js Files]
    J --> L
    K --> L

    L --> M[Runtime Execution]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
    style G fill:#CC78BC,color:#fff
```
