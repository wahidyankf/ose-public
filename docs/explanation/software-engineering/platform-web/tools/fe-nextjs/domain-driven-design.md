---
title: Next.js Domain-Driven Design
description: Comprehensive guide to implementing Domain-Driven Design (DDD) in Next.js applications with bounded contexts, aggregates, entities, value objects, and layered architecture
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - domain-driven-design
  - ddd
  - architecture
  - bounded-context
  - aggregates
  - entities
  - value-objects
principles:
  - simplicity-over-complexity
  - explicit-over-implicit
  - separation-of-concerns
created: 2026-01-26
---

# Next.js Domain-Driven Design

Domain-Driven Design (DDD) is an approach to software development that focuses on modeling complex business domains. This guide covers implementing DDD patterns in Next.js including bounded contexts, aggregates, entities, value objects, and layered architecture for enterprise applications.

## 📋 Quick Reference

- [DDD Fundamentals](#-ddd-fundamentals) - Core concepts and principles
- [Bounded Contexts](#-bounded-contexts) - Domain boundaries
- [Entities](#-entities) - Identity-based objects
- [Value Objects](#-value-objects) - Immutable attribute containers
- [Aggregates](#-aggregates) - Consistency boundaries
- [Domain Events](#-domain-events) - Business state changes
- [Repositories](#-repositories) - Aggregate persistence
- [Domain Services](#-domain-services) - Business logic without natural home
- [Application Services](#-application-services) - Use case orchestration
- [Layered Architecture](#-layered-architecture) - Separation of concerns
- [Next.js Integration](#-nextjs-integration) - DDD with App Router
- [OSE Platform Example](#-ose-platform-example) - Islamic finance DDD implementation
- [Best Practices](#-best-practices) - Production DDD guidelines
- [Related Documentation](#-related-documentation) - Cross-references

## 📚 DDD Fundamentals

Domain-Driven Design focuses on creating software that reflects the business domain with a ubiquitous language shared between developers and domain experts.

### Core Principles

**Ubiquitous Language**: Shared vocabulary between developers and domain experts used consistently in code, conversations, and documentation.

**Bounded Context**: Explicit boundary within which a domain model is defined and applicable. Different contexts can have different models for the same concept.

**Context Mapping**: Defining relationships and integration patterns between bounded contexts.

**Strategic Design**: High-level patterns for organizing large systems (bounded contexts, context maps, core domain identification).

**Tactical Design**: Low-level patterns for implementing domain models (entities, value objects, aggregates, domain events, repositories).

### Building Blocks

```typescript
// Domain concepts hierarchy
Domain
├── Bounded Contexts (e.g., Zakat Context, Murabaha Context)
│   ├── Aggregates (consistency boundaries)
│   │   ├── Entities (identity-based)
│   │   └── Value Objects (immutable attributes)
│   ├── Domain Events (state changes)
│   ├── Domain Services (business logic)
│   └── Repositories (persistence)
```

## 🎯 Bounded Contexts

Bounded contexts define explicit boundaries where a domain model applies.

### Identifying Bounded Contexts

```typescript
// lib/domain/contexts.ts

// Zakat Context - Zakat calculation and payment
export namespace ZakatContext {
  // Domain model specific to Zakat
  // "Asset" here means wealth subject to zakat
}

// Murabaha Context - Islamic financing contracts
export namespace MurabahaContext {
  // Domain model specific to Murabaha
  // "Asset" here means financed item
}

// User Context - User management and authentication
export namespace UserContext {
  // Domain model specific to users
}

// Same word, different meanings in different contexts
```

### Context Structure

```typescript
// lib/domain/zakat/
zakat/
├── aggregates/          # Aggregate roots
│   ├── ZakatCalculation.ts
│   └── ZakatPayment.ts
├── entities/            # Entities
│   ├── Asset.ts
│   └── Liability.ts
├── value-objects/       # Value Objects
│   ├── Money.ts
│   ├── NisabThreshold.ts
│   └── ZakatRate.ts
├── events/              # Domain Events
│   ├── ZakatCalculated.ts
│   └── ZakatPaid.ts
├── services/            # Domain Services
│   └── ZakatCalculationService.ts
└── repositories/        # Repository interfaces
    └── ZakatCalculationRepository.ts
```

## 🆔 Entities

Entities have unique identity that persists over time, even when attributes change.

### Entity Base Class

```typescript
// lib/domain/common/Entity.ts
export abstract class Entity<T> {
  protected readonly _id: T;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: T, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  get id(): T {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  public equals(entity: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return this._id === entity._id;
  }
}
```

### Concrete Entity

```typescript
// lib/domain/zakat/entities/Asset.ts
import { Entity } from "@/lib/domain/common/Entity";
import { Money } from "../value-objects/Money";

export enum AssetType {
  CASH = "CASH",
  GOLD = "GOLD",
  SILVER = "SILVER",
  STOCKS = "STOCKS",
  REAL_ESTATE = "REAL_ESTATE",
}

export interface AssetProps {
  type: AssetType;
  description: string;
  value: Money;
  marketValue?: Money;
}

export class Asset extends Entity<string> {
  private _type: AssetType;
  private _description: string;
  private _value: Money;
  private _marketValue?: Money;

  constructor(id: string, props: AssetProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this._type = props.type;
    this._description = props.description;
    this._value = props.value;
    this._marketValue = props.marketValue;
  }

  get type(): AssetType {
    return this._type;
  }

  get description(): string {
    return this._description;
  }

  get value(): Money {
    return this._value;
  }

  get marketValue(): Money | undefined {
    return this._marketValue;
  }

  public updateValue(newValue: Money): void {
    this._value = newValue;
    this.touch();
  }

  public updateMarketValue(marketValue: Money): void {
    this._marketValue = marketValue;
    this.touch();
  }

  public getEffectiveValue(): Money {
    return this._marketValue ?? this._value;
  }
}
```

## 💎 Value Objects

Value Objects are immutable and defined by their attributes, not identity.

### Value Object Base

```typescript
// lib/domain/common/ValueObject.ts
export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this._value = Object.freeze(value);
  }

  get value(): T {
    return this._value;
  }

  public equals(vo: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }

    return JSON.stringify(this._value) === JSON.stringify(vo._value);
  }
}
```

### Money Value Object

```typescript
// lib/domain/zakat/value-objects/Money.ts
import { ValueObject } from "@/lib/domain/common/ValueObject";

interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    if (props.amount < 0) {
      throw new Error("Money amount cannot be negative");
    }

    if (!props.currency || props.currency.length !== 3) {
      throw new Error("Currency must be 3-letter ISO code");
    }

    super(props);
  }

  public static create(amount: number, currency: string): Money {
    return new Money({ amount, currency });
  }

  get amount(): number {
    return this._value.amount;
  }

  get currency(): string {
    return this._value.currency;
  }

  public add(money: Money): Money {
    if (this.currency !== money.currency) {
      throw new Error("Cannot add money with different currencies");
    }

    return Money.create(this.amount + money.amount, this.currency);
  }

  public subtract(money: Money): Money {
    if (this.currency !== money.currency) {
      throw new Error("Cannot subtract money with different currencies");
    }

    const result = this.amount - money.amount;

    if (result < 0) {
      throw new Error("Subtraction would result in negative amount");
    }

    return Money.create(result, this.currency);
  }

  public multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error("Cannot multiply by negative factor");
    }

    return Money.create(this.amount * factor, this.currency);
  }

  public isGreaterThan(money: Money): boolean {
    if (this.currency !== money.currency) {
      throw new Error("Cannot compare money with different currencies");
    }

    return this.amount > money.amount;
  }

  public isGreaterThanOrEqual(money: Money): boolean {
    if (this.currency !== money.currency) {
      throw new Error("Cannot compare money with different currencies");
    }

    return this.amount >= money.amount;
  }

  public toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}
```

### Zakat Rate Value Object

```typescript
// lib/domain/zakat/value-objects/ZakatRate.ts
import { ValueObject } from "@/lib/domain/common/ValueObject";

export class ZakatRate extends ValueObject<number> {
  private static readonly STANDARD_RATE = 0.025; // 2.5%

  private constructor(rate: number) {
    if (rate < 0 || rate > 1) {
      throw new Error("Zakat rate must be between 0 and 1");
    }

    super(rate);
  }

  public static standard(): ZakatRate {
    return new ZakatRate(ZakatRate.STANDARD_RATE);
  }

  public static custom(rate: number): ZakatRate {
    return new ZakatRate(rate);
  }

  get percentage(): number {
    return this._value * 100;
  }

  public apply(amount: Money): Money {
    return amount.multiply(this._value);
  }
}
```

## 🎲 Aggregates

Aggregates are clusters of domain objects treated as a single unit with a root entity.

### Zakat Calculation Aggregate

```typescript
// lib/domain/zakat/aggregates/ZakatCalculation.ts
import { Entity } from "@/lib/domain/common/Entity";
import { Asset } from "../entities/Asset";
import { Money } from "../value-objects/Money";
import { NisabThreshold } from "../value-objects/NisabThreshold";
import { ZakatRate } from "../value-objects/ZakatRate";
import { ZakatCalculated } from "../events/ZakatCalculated";

export enum CalculationStatus {
  DRAFT = "DRAFT",
  CALCULATED = "CALCULATED",
  PAID = "PAID",
}

export class ZakatCalculation extends Entity<string> {
  private _userId: string;
  private _assets: Asset[];
  private _liabilities: Money;
  private _nisabThreshold: NisabThreshold;
  private _zakatRate: ZakatRate;
  private _status: CalculationStatus;
  private _calculatedAmount?: Money;
  private _domainEvents: any[];

  constructor(id: string, userId: string, nisabThreshold: NisabThreshold, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this._userId = userId;
    this._assets = [];
    this._liabilities = Money.create(0, "USD");
    this._nisabThreshold = nisabThreshold;
    this._zakatRate = ZakatRate.standard();
    this._status = CalculationStatus.DRAFT;
    this._domainEvents = [];
  }

  get userId(): string {
    return this._userId;
  }

  get assets(): readonly Asset[] {
    return Object.freeze([...this._assets]);
  }

  get liabilities(): Money {
    return this._liabilities;
  }

  get status(): CalculationStatus {
    return this._status;
  }

  get calculatedAmount(): Money | undefined {
    return this._calculatedAmount;
  }

  get domainEvents(): readonly any[] {
    return Object.freeze([...this._domainEvents]);
  }

  public addAsset(asset: Asset): void {
    if (this._status !== CalculationStatus.DRAFT) {
      throw new Error("Cannot modify calculation after it is calculated");
    }

    this._assets.push(asset);
    this.touch();
  }

  public removeAsset(assetId: string): void {
    if (this._status !== CalculationStatus.DRAFT) {
      throw new Error("Cannot modify calculation after it is calculated");
    }

    this._assets = this._assets.filter((asset) => asset.id !== assetId);
    this.touch();
  }

  public setLiabilities(liabilities: Money): void {
    if (this._status !== CalculationStatus.DRAFT) {
      throw new Error("Cannot modify calculation after it is calculated");
    }

    this._liabilities = liabilities;
    this.touch();
  }

  public calculate(): void {
    if (this._status !== CalculationStatus.DRAFT) {
      throw new Error("Calculation already performed");
    }

    // Calculate total assets
    const totalAssets = this._assets.reduce((sum, asset) => sum.add(asset.getEffectiveValue()), Money.create(0, "USD"));

    // Calculate net wealth
    const netWealth = totalAssets.subtract(this._liabilities);

    // Check if eligible for zakat
    if (netWealth.isGreaterThanOrEqual(this._nisabThreshold.threshold)) {
      this._calculatedAmount = this._zakatRate.apply(netWealth);
    } else {
      this._calculatedAmount = Money.create(0, "USD");
    }

    this._status = CalculationStatus.CALCULATED;
    this.touch();

    // Raise domain event
    this._domainEvents.push(new ZakatCalculated(this.id, this._userId, netWealth, this._calculatedAmount, new Date()));
  }

  public markAsPaid(): void {
    if (this._status !== CalculationStatus.CALCULATED) {
      throw new Error("Can only mark calculated zakat as paid");
    }

    if (!this._calculatedAmount || this._calculatedAmount.amount === 0) {
      throw new Error("Cannot mark zero zakat as paid");
    }

    this._status = CalculationStatus.PAID;
    this.touch();
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
```

## 📡 Domain Events

Domain events represent significant business occurrences.

### Domain Event Base

```typescript
// lib/domain/common/DomainEvent.ts
export interface DomainEvent {
  occurredOn: Date;
  aggregateId: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredOn: Date;
  public readonly aggregateId: string;

  constructor(aggregateId: string, occurredOn?: Date) {
    this.aggregateId = aggregateId;
    this.occurredOn = occurredOn || new Date();
  }
}
```

### Zakat Calculated Event

```typescript
// lib/domain/zakat/events/ZakatCalculated.ts
import { BaseDomainEvent } from "@/lib/domain/common/DomainEvent";
import { Money } from "../value-objects/Money";

export class ZakatCalculated extends BaseDomainEvent {
  public readonly userId: string;
  public readonly netWealth: Money;
  public readonly zakatAmount: Money;

  constructor(calculationId: string, userId: string, netWealth: Money, zakatAmount: Money, occurredOn?: Date) {
    super(calculationId, occurredOn);
    this.userId = userId;
    this.netWealth = netWealth;
    this.zakatAmount = zakatAmount;
  }
}
```

### Event Handler

```typescript
// lib/application/zakat/handlers/ZakatCalculatedHandler.ts
import { ZakatCalculated } from "@/lib/domain/zakat/events/ZakatCalculated";
import { db } from "@/lib/db";

export class ZakatCalculatedHandler {
  async handle(event: ZakatCalculated): Promise<void> {
    // Send notification to user
    await this.sendNotification(event);

    // Update analytics
    await this.updateAnalytics(event);

    // Log event
    await db.zakatEventLog.create({
      data: {
        eventType: "ZAKAT_CALCULATED",
        calculationId: event.aggregateId,
        userId: event.userId,
        zakatAmount: event.zakatAmount.amount,
        occurredOn: event.occurredOn,
      },
    });
  }

  private async sendNotification(event: ZakatCalculated): Promise<void> {
    // Implementation
  }

  private async updateAnalytics(event: ZakatCalculated): Promise<void> {
    // Implementation
  }
}
```

## 🗄️ Repositories

Repositories provide abstraction for aggregate persistence.

### Repository Interface

```typescript
// lib/domain/zakat/repositories/ZakatCalculationRepository.ts
import { ZakatCalculation } from "../aggregates/ZakatCalculation";

export interface ZakatCalculationRepository {
  save(calculation: ZakatCalculation): Promise<void>;
  findById(id: string): Promise<ZakatCalculation | null>;
  findByUserId(userId: string): Promise<ZakatCalculation[]>;
  delete(id: string): Promise<void>;
}
```

### Repository Implementation

```typescript
// lib/infrastructure/repositories/PrismaZakatCalculationRepository.ts
import { ZakatCalculationRepository } from "@/lib/domain/zakat/repositories/ZakatCalculationRepository";
import { ZakatCalculation, CalculationStatus } from "@/lib/domain/zakat/aggregates/ZakatCalculation";
import { Asset, AssetType } from "@/lib/domain/zakat/entities/Asset";
import { Money } from "@/lib/domain/zakat/value-objects/Money";
import { NisabThreshold } from "@/lib/domain/zakat/value-objects/NisabThreshold";
import { db } from "@/lib/db";

export class PrismaZakatCalculationRepository implements ZakatCalculationRepository {
  async save(calculation: ZakatCalculation): Promise<void> {
    // Map domain model to persistence model
    await db.zakatCalculation.upsert({
      where: { id: calculation.id },
      create: {
        id: calculation.id,
        userId: calculation.userId,
        status: calculation.status,
        calculatedAmount: calculation.calculatedAmount?.amount,
        createdAt: calculation.createdAt,
        updatedAt: calculation.updatedAt,
        assets: {
          create: calculation.assets.map((asset) => ({
            id: asset.id,
            type: asset.type,
            description: asset.description,
            value: asset.value.amount,
            marketValue: asset.marketValue?.amount,
          })),
        },
      },
      update: {
        status: calculation.status,
        calculatedAmount: calculation.calculatedAmount?.amount,
        updatedAt: calculation.updatedAt,
      },
    });

    // Dispatch domain events
    for (const event of calculation.domainEvents) {
      await this.dispatchEvent(event);
    }

    calculation.clearEvents();
  }

  async findById(id: string): Promise<ZakatCalculation | null> {
    const record = await db.zakatCalculation.findUnique({
      where: { id },
      include: { assets: true },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async findByUserId(userId: string): Promise<ZakatCalculation[]> {
    const records = await db.zakatCalculation.findMany({
      where: { userId },
      include: { assets: true },
    });

    return records.map((record) => this.toDomain(record));
  }

  async delete(id: string): Promise<void> {
    await db.zakatCalculation.delete({ where: { id } });
  }

  private toDomain(record: any): ZakatCalculation {
    const nisabThreshold = NisabThreshold.create(Money.create(5000, "USD"));

    const calculation = new ZakatCalculation(
      record.id,
      record.userId,
      nisabThreshold,
      record.createdAt,
      record.updatedAt,
    );

    // Reconstruct assets
    for (const assetRecord of record.assets) {
      const asset = new Asset(
        assetRecord.id,
        {
          type: assetRecord.type as AssetType,
          description: assetRecord.description,
          value: Money.create(assetRecord.value, "USD"),
          marketValue: assetRecord.marketValue ? Money.create(assetRecord.marketValue, "USD") : undefined,
        },
        assetRecord.createdAt,
        assetRecord.updatedAt,
      );

      calculation.addAsset(asset);
    }

    return calculation;
  }

  private async dispatchEvent(event: any): Promise<void> {
    // Implementation: publish to event bus
  }
}
```

## 🔧 Domain Services

Domain services contain business logic that doesn't naturally belong to an entity or value object.

### Zakat Calculation Service

```typescript
// lib/domain/zakat/services/ZakatCalculationService.ts
import { ZakatCalculation } from "../aggregates/ZakatCalculation";
import { Asset } from "../entities/Asset";
import { Money } from "../value-objects/Money";
import { NisabThreshold } from "../value-objects/NisabThreshold";

export class ZakatCalculationService {
  calculateNisabThreshold(goldPricePerGram: Money): NisabThreshold {
    // Nisab = 85 grams of gold
    const goldGrams = 85;
    const nisabAmount = goldPricePerGram.multiply(goldGrams);

    return NisabThreshold.create(nisabAmount);
  }

  isAssetEligibleForZakat(asset: Asset, holdingPeriod: number): boolean {
    // Must hold asset for at least one lunar year (354 days)
    const MIN_HOLDING_PERIOD = 354;

    return holdingPeriod >= MIN_HOLDING_PERIOD;
  }

  adjustForLunarYear(gregorianAmount: Money): Money {
    // Lunar year is ~354 days vs Gregorian 365 days
    const ratio = 354 / 365;
    return gregorianAmount.multiply(ratio);
  }
}
```

## 🎯 Application Services

Application services orchestrate use cases and coordinate domain objects.

### Calculate Zakat Use Case

```typescript
// lib/application/zakat/use-cases/CalculateZakatUseCase.ts
import { ZakatCalculationRepository } from "@/lib/domain/zakat/repositories/ZakatCalculationRepository";
import { ZakatCalculation } from "@/lib/domain/zakat/aggregates/ZakatCalculation";
import { Asset, AssetType } from "@/lib/domain/zakat/entities/Asset";
import { Money } from "@/lib/domain/zakat/value-objects/Money";
import { NisabThreshold } from "@/lib/domain/zakat/value-objects/NisabThreshold";
import { ZakatCalculationService } from "@/lib/domain/zakat/services/ZakatCalculationService";

interface CalculateZakatRequest {
  userId: string;
  assets: {
    type: AssetType;
    description: string;
    value: number;
    marketValue?: number;
  }[];
  liabilities: number;
  currency: string;
}

interface CalculateZakatResponse {
  calculationId: string;
  zakatAmount: number;
  netWealth: number;
  eligible: boolean;
}

export class CalculateZakatUseCase {
  constructor(
    private readonly repository: ZakatCalculationRepository,
    private readonly domainService: ZakatCalculationService,
  ) {}

  async execute(request: CalculateZakatRequest): Promise<CalculateZakatResponse> {
    // Get current nisab threshold
    const goldPrice = Money.create(60, request.currency); // Example: $60/gram
    const nisabThreshold = this.domainService.calculateNisabThreshold(goldPrice);

    // Create aggregate
    const calculation = new ZakatCalculation(this.generateId(), request.userId, nisabThreshold);

    // Add assets
    for (const assetData of request.assets) {
      const asset = new Asset(this.generateId(), {
        type: assetData.type,
        description: assetData.description,
        value: Money.create(assetData.value, request.currency),
        marketValue: assetData.marketValue ? Money.create(assetData.marketValue, request.currency) : undefined,
      });

      calculation.addAsset(asset);
    }

    // Set liabilities
    calculation.setLiabilities(Money.create(request.liabilities, request.currency));

    // Perform calculation
    calculation.calculate();

    // Persist
    await this.repository.save(calculation);

    // Return result
    return {
      calculationId: calculation.id,
      zakatAmount: calculation.calculatedAmount?.amount ?? 0,
      netWealth:
        calculation.assets.reduce((sum, asset) => sum + asset.getEffectiveValue().amount, 0) - request.liabilities,
      eligible: (calculation.calculatedAmount?.amount ?? 0) > 0,
    };
  }

  private generateId(): string {
    return crypto.randomUUID();
  }
}
```

## 🏗️ Layered Architecture

Organize code into layers with clear dependencies.

### Architecture Layers

```
┌─────────────────────────────────────────┐
│     Presentation Layer (Next.js)        │
│  - Pages/Routes (app/)                  │
│  - React Components (components/)       │
│  - Server Actions                       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Application Layer                   │
│  - Use Cases (application/use-cases/)   │
│  - DTOs (application/dtos/)             │
│  - Application Services                 │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Domain Layer                        │
│  - Aggregates (domain/aggregates/)      │
│  - Entities (domain/entities/)          │
│  - Value Objects (domain/value-objects/)│
│  - Domain Events (domain/events/)       │
│  - Domain Services (domain/services/)   │
│  - Repository Interfaces                │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Infrastructure Layer                │
│  - Repositories (infrastructure/repos/) │
│  - External Services                    │
│  - Database (Prisma)                    │
│  - Event Bus                            │
└─────────────────────────────────────────┘
```

### Dependency Rule

**Dependencies point inward**: Outer layers can depend on inner layers, but inner layers cannot depend on outer layers. Domain layer is the innermost and has no dependencies on outer layers.

## ⚛️ Next.js Integration

Integrate DDD with Next.js App Router.

### Server Action with Use Case

```typescript
// actions/zakat/calculate.ts
"use server";

import { auth } from "@/lib/auth";
import { CalculateZakatUseCase } from "@/lib/application/zakat/use-cases/CalculateZakatUseCase";
import { PrismaZakatCalculationRepository } from "@/lib/infrastructure/repositories/PrismaZakatCalculationRepository";
import { ZakatCalculationService } from "@/lib/domain/zakat/services/ZakatCalculationService";
import { AssetType } from "@/lib/domain/zakat/entities/Asset";

export async function calculateZakat(formData: FormData) {
  const session = await auth();

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Parse form data
  const assets = JSON.parse(formData.get("assets") as string);
  const liabilities = parseFloat(formData.get("liabilities") as string);

  // Execute use case
  const repository = new PrismaZakatCalculationRepository();
  const domainService = new ZakatCalculationService();
  const useCase = new CalculateZakatUseCase(repository, domainService);

  const result = await useCase.execute({
    userId: session.user.id,
    assets: assets.map((asset: any) => ({
      type: asset.type as AssetType,
      description: asset.description,
      value: asset.value,
      marketValue: asset.marketValue,
    })),
    liabilities,
    currency: "USD",
  });

  return {
    success: true,
    data: result,
  };
}
```

### Page Component

```typescript
// app/zakat/calculate/page.tsx
import { ZakatCalculatorForm } from '@/components/zakat/ZakatCalculatorForm';

export default function CalculateZakatPage() {
  return (
    <main>
      <h1>Calculate Zakat</h1>
      <ZakatCalculatorForm />
    </main>
  );
}
```

## 🕌 OSE Platform Example

Complete DDD implementation for Murabaha financing.

### Murabaha Aggregate

```typescript
// lib/domain/murabaha/aggregates/MurabahaContract.ts
import { Entity } from "@/lib/domain/common/Entity";
import { Money } from "@/lib/domain/zakat/value-objects/Money";
import { MurabahaPayment } from "../entities/MurabahaPayment";
import { ContractCreated } from "../events/ContractCreated";

export enum ContractStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  DEFAULTED = "DEFAULTED",
}

export class MurabahaContract extends Entity<string> {
  private _clientId: string;
  private _productName: string;
  private _purchasePrice: Money;
  private _profitMargin: number;
  private _sellingPrice: Money;
  private _installmentPeriod: number;
  private _monthlyPayment: Money;
  private _payments: MurabahaPayment[];
  private _status: ContractStatus;
  private _domainEvents: any[];

  constructor(
    id: string,
    clientId: string,
    productName: string,
    purchasePrice: Money,
    profitMargin: number,
    installmentPeriod: number,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);

    this._clientId = clientId;
    this._productName = productName;
    this._purchasePrice = purchasePrice;
    this._profitMargin = profitMargin;
    this._installmentPeriod = installmentPeriod;

    // Calculate selling price
    const profitAmount = purchasePrice.multiply(profitMargin / 100);
    this._sellingPrice = purchasePrice.add(profitAmount);

    // Calculate monthly payment
    this._monthlyPayment = Money.create(this._sellingPrice.amount / installmentPeriod, purchasePrice.currency);

    this._payments = [];
    this._status = ContractStatus.DRAFT;
    this._domainEvents = [];
  }

  get clientId(): string {
    return this._clientId;
  }

  get status(): ContractStatus {
    return this._status;
  }

  get payments(): readonly MurabahaPayment[] {
    return Object.freeze([...this._payments]);
  }

  public activate(): void {
    if (this._status !== ContractStatus.DRAFT) {
      throw new Error("Only draft contracts can be activated");
    }

    this._status = ContractStatus.ACTIVE;
    this.generatePaymentSchedule();
    this.touch();

    this._domainEvents.push(new ContractCreated(this.id, this._clientId, this._sellingPrice, new Date()));
  }

  public recordPayment(paymentId: string, amount: Money): void {
    if (this._status !== ContractStatus.ACTIVE) {
      throw new Error("Can only record payments for active contracts");
    }

    const payment = this._payments.find((p) => p.id === paymentId);

    if (!payment) {
      throw new Error("Payment not found");
    }

    payment.recordPayment(amount);
    this.touch();

    // Check if contract is completed
    if (this.isFullyPaid()) {
      this._status = ContractStatus.COMPLETED;
    }
  }

  private generatePaymentSchedule(): void {
    const startDate = new Date();

    for (let i = 0; i < this._installmentPeriod; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i + 1);

      const payment = new MurabahaPayment(crypto.randomUUID(), this.id, this._monthlyPayment, dueDate);

      this._payments.push(payment);
    }
  }

  private isFullyPaid(): boolean {
    return this._payments.every((p) => p.isPaid());
  }

  get domainEvents(): readonly any[] {
    return Object.freeze([...this._domainEvents]);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
```

## 📚 Best Practices

### 1. Use Ubiquitous Language

```typescript
// GOOD - Domain language
class ZakatCalculation {
  private nisabThreshold: NisabThreshold;
  private zakatableWealth: Money;

  calculate(): Money {
    // Implementation using domain terms
  }
}

// BAD - Technical language
class CalculationModel {
  private threshold: number;
  private totalAmount: number;

  compute(): number {
    // Implementation with generic terms
  }
}
```

### 2. Keep Aggregates Small

```typescript
// GOOD - Small, focused aggregate
class ZakatCalculation {
  private assets: Asset[]; // Related entities
  // Only what needs to be consistent
}

// BAD - Large aggregate with unrelated concerns
class ZakatCalculation {
  private assets: Asset[];
  private user: User; // Should reference by ID, not include
  private notifications: Notification[]; // Separate concern
  private auditLog: AuditEntry[]; // Separate concern
}
```

### 3. Protect Invariants

```typescript
// GOOD - Business rules enforced
class MurabahaContract {
  private profitMargin: number;

  constructor(profitMargin: number) {
    if (profitMargin < 0 || profitMargin > 50) {
      throw new Error("Profit margin must be between 0% and 50%");
    }

    this.profitMargin = profitMargin;
  }
}
```

### 4. Use Domain Events

```typescript
// GOOD - Raise events for significant business occurrences
class ZakatCalculation {
  calculate(): void {
    // Perform calculation
    this._status = CalculationStatus.CALCULATED;

    // Raise domain event
    this._domainEvents.push(new ZakatCalculated(this.id, this.userId, this.calculatedAmount));
  }
}
```

## 🔗 Related Documentation

- [Next.js README](./README.md) - Next.js overview
- [Next.js TypeScript](typescript.md) - Type-safe DDD implementation
- [Next.js Testing](testing.md) - Testing domain logic

---

**Next Steps:**

- Explore [Next.js TypeScript](typescript.md) for type-safe domain models
- Review [Functional Programming](functional-programming.md) for immutable patterns
- Check [Next.js Testing](testing.md) for domain testing strategies
