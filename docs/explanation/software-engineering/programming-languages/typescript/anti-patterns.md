---
title: "TypeScript Anti-Patterns"
description: Common TypeScript mistakes and how to avoid them
category: explanation
subcategory: prog-lang
tags:
  - typescript
  - anti-patterns
  - code-smell
  - best-practices
related:
  - ./best-practices.md
  - ./type-safety.md
  - ./error-handling.md
principles:
  - explicit-over-implicit
  - simplicity-over-complexity
---

# TypeScript Anti-Patterns

## Quick Reference

### Type Safety & Design

- [Type Safety Anti-Patterns](#type-safety-anti-patterns) - Using `any`, type assertions, assertion overuse
- [Domain Modeling Anti-Patterns](#domain-modeling-anti-patterns) - Primitive obsession, anemic models
- [API Design Anti-Patterns](#api-design-anti-patterns) - Inconsistent interfaces, callback hell

### Error Handling & Async

- [Error Handling Anti-Patterns](#error-handling-anti-patterns) - Throwing strings, ignored errors, no error types
- [Async/Promise Anti-Patterns](#asyncpromise-anti-patterns) - Floating promises, promise constructor anti-pattern, parallel/sequential confusion

### Performance & Security

- [Performance Anti-Patterns](#performance-anti-patterns) - Unnecessary re-renders, inefficient loops, memory leaks
- [Security Anti-Patterns](#security-anti-patterns) - XSS vulnerabilities, SQL injection, hardcoded secrets

### Testing & Components

- [Testing Anti-Patterns](#testing-anti-patterns) - Testing implementation, shared state, async timing
- [React/Component Anti-Patterns](#reactcomponent-anti-patterns) - Prop drilling, derived state, key anti-patterns

### Code Organization

- [Module/Import Anti-Patterns](#moduleimport-anti-patterns) - Circular dependencies, barrel file abuse
- [Design Anti-Patterns](#design-anti-patterns) - God objects, premature abstraction

### Navigation

- [Anti-Patterns Summary](#anti-patterns-summary) - Complete checklist
- [Recognition and Prevention](#recognition-and-prevention) - How to identify and avoid
- [Related Documentation](#related-documentation) - Best practices and guides

## Overview

Anti-patterns are common solutions that appear beneficial but lead to problematic code. This guide covers TypeScript anti-patterns in financial applications and their recommended alternatives.

## Type Safety Anti-Patterns

### Type Assertion Decision Tree

When should you use type assertions vs validation? This decision tree helps you choose the right approach.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Start["Data Source"]:::blue
    Internal{"Internal<br/>source?"}:::orange
    TrustSource{"Can trust<br/>structure?"}:::orange
    TypeOnly{"Type-only<br/>change?"}:::orange
    UseAssertion["Use Type Assertion<br/>#40;as#41;"]:::teal
    UseValidation["Use Runtime Validation<br/>#40;Zod/io-ts#41;"]:::purple
    TypeGuard["Use Type Guard<br/>#40;type predicate#41;"]:::brown

    Start --> Internal
    Internal -->|Yes| TrustSource
    Internal -->|No| UseValidation
    TrustSource -->|Yes| TypeOnly
    TrustSource -->|No| UseValidation
    TypeOnly -->|Yes| UseAssertion
    TypeOnly -->|No| TypeGuard

    Note1["External data ALWAYS<br/>requires validation"]
    Note2["Type assertions bypass<br/>runtime checks"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

### Using `any`

#### The `any` Escape Hatch Consequences

Using `any` creates a ripple effect of type safety erosion throughout your codebase.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Input["User Input<br/>#40;any#41;"]:::blue
    ProcessA["processDonation#40;data: any#41;"]:::orange
    ProcessB["calculateFee#40;amount: any#41;"]:::orange
    ProcessC["formatCurrency#40;value: any#41;"]:::orange
    Error["Runtime Error<br/>Uncaught TypeError"]:::purple
    SafeInput["Validated Input<br/>#40;Donation#41;"]:::teal
    SafeA["processDonation#40;data: Donation#41;"]:::teal
    SafeB["calculateFee#40;amount: number#41;"]:::teal
    SafeC["formatCurrency#40;value: number#41;"]:::teal
    CompileError["Compile-time Error<br/>Type mismatch caught"]:::brown

    subgraph Unsafe["Type Safety Erosion with any"]
        Input --> ProcessA
        ProcessA --> ProcessB
        ProcessB --> ProcessC
        ProcessC --> Error
    end

    subgraph Safe["Type Safety Preserved"]
        SafeInput --> SafeA
        SafeA --> SafeB
        SafeB --> SafeC
        SafeC -.-> CompileError
    end

    Note1["any spreads through<br/>entire call chain"]
    Note2["Errors caught at<br/>compile time"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```typescript
// ❌ ANTI-PATTERN: Defeats TypeScript's purpose
function processDonation(data: any) {
  return data.amount * 0.025; // No type safety
}

// ✅ SOLUTION: Use proper types
interface Donation {
  donationId: string;
  amount: number;
  currency: string;
}

function processDonationSafe(data: Donation): number {
  return data.amount * 0.025;
}
```

### Type Assertions Instead of Validation

```typescript
// ❌ ANTI-PATTERN: Assumes type without validation
const donation = JSON.parse(input) as Donation;

// ✅ SOLUTION: Validate runtime data
import { z } from "zod";

const donationSchema = z.object({
  donationId: z.string(),
  amount: z.number().positive(),
  currency: z.string(),
});

const donation = donationSchema.parse(JSON.parse(input));
```

### Double Type Assertions

#### Description

Double type assertions (`value as unknown as TargetType`) bypass TypeScript's type safety entirely, allowing conversion between completely unrelated types.

#### Why It's Problematic

- Completely defeats TypeScript's type checking
- Creates false sense of security
- Can cause runtime errors that TypeScript should prevent
- Indicates design problems in type hierarchy
- Makes refactoring dangerous
- In financial code, can lead to catastrophic type mismatches (e.g., treating amount as string)

#### Anti-Pattern Example (FAIL)

```typescript
// ❌ ANTI-PATTERN: Double assertions bypass all safety

interface Donation {
  id: string;
  amount: number;
  currency: string;
}

interface MurabahaContract {
  contractId: string;
  costPrice: number;
  profitMargin: number;
}

// Completely unrelated types forced together
function convertDonationToContract(donation: Donation): MurabahaContract {
  // ❌ Double assertion - TypeScript won't complain!
  return donation as unknown as MurabahaContract;
  // Runtime: { id: "DON-001", amount: 1000, currency: "SAR" }
  // Expected: { contractId: string, costPrice: number, profitMargin: number }
  // Result: contract.contractId is undefined!
}

// Converting primitive to complex type
function processAmount(amount: string): void {
  // ❌ Forcing string to number through double assertion
  const numericAmount = amount as unknown as number;
  const zakat = numericAmount * 0.025; // NaN at runtime!
}

// Forcing incompatible array types
function processDonations(donations: string[]): void {
  // ❌ Treating array of strings as array of objects
  const donationObjects = donations as unknown as Donation[];

  donationObjects.forEach((d) => {
    console.log(d.amount); // undefined for each string!
  });
}

// Bypassing readonly constraints
interface ReadonlyDonation {
  readonly id: string;
  readonly amount: number;
}

function mutateDonation(donation: ReadonlyDonation): void {
  // ❌ Removing readonly through double assertion
  const mutable = donation as unknown as Donation;
  mutable.amount = 5000; // Violates readonly contract!
}
```

#### Correct Approach (PASS)

```typescript
// ✅ SOLUTION: Proper type conversions and validation

interface Donation {
  id: string;
  amount: number;
  currency: string;
}

interface MurabahaContract {
  contractId: string;
  costPrice: number;
  profitMargin: number;
}

// ✅ Explicit conversion function
function convertDonationToContract(donation: Donation, profitMargin: number): MurabahaContract {
  return {
    contractId: `CON-${donation.id}`,
    costPrice: donation.amount,
    profitMargin,
  };
}

// ✅ Parse string to number safely
function processAmount(amount: string): void {
  const numericAmount = parseFloat(amount);

  if (isNaN(numericAmount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  const zakat = numericAmount * 0.025;
  console.log(`Zakat: ${zakat}`);
}

// ✅ Validate and parse array data
import { z } from "zod";

const donationSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
});

function processDonations(data: unknown): void {
  // Validate runtime data
  const donationArray = z.array(donationSchema).parse(data);

  donationArray.forEach((d) => {
    console.log(d.amount); // Type-safe access
  });
}

// ✅ Create new mutable copy instead of violating readonly
interface ReadonlyDonation {
  readonly id: string;
  readonly amount: number;
}

function updateDonationAmount(donation: ReadonlyDonation, newAmount: number): ReadonlyDonation {
  // Create new object instead of mutating
  return {
    ...donation,
    amount: newAmount,
  };
}

// ✅ When type assertion IS necessary, use type guards
function isDonation(value: unknown): value is Donation {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as Record<string, unknown>).id === "string" &&
    "amount" in value &&
    typeof (value as Record<string, unknown>).amount === "number" &&
    "currency" in value &&
    typeof (value as Record<string, unknown>).currency === "string"
  );
}

function processPossibleDonation(data: unknown): void {
  if (isDonation(data)) {
    // Type narrowed to Donation
    console.log(data.amount);
  } else {
    throw new Error("Invalid donation data");
  }
}
```

#### Detection

- **ESLint**: `@typescript-eslint/consistent-type-assertions`, `@typescript-eslint/no-unsafe-assignment`
- **Code review**: Search for `as unknown as` pattern
- **TypeScript compiler**: Enable `strict` mode catches many cases
- **Runtime errors**: Unexpected undefined or type mismatch errors

#### Islamic Finance Impact

In Zakat calculation systems, double assertions cause:

- **Type confusion**: Amount treated as string, causing "NaN" Zakat calculations
- **Data corruption**: Donation objects converted to contracts without proper mapping
- **Runtime crashes**: Accessing properties that don't exist on mis-typed objects
- **Audit failures**: Transaction logs showing invalid data types

## Domain Modeling Anti-Patterns

### Primitive Obsession in Financial Domains

#### Description

Using primitive types (string, number) instead of creating domain-specific value objects for financial concepts like Money, DonationId, or Nisab threshold.

#### Why It's Problematic

- Loses domain semantics and type safety
- Easy to mix up similar primitives (e.g., amount and fee)
- No validation at type level
- Can't attach domain behavior to primitives
- Makes code less self-documenting
- In financial code, can cause calculation errors (mixing currencies, negative amounts)

#### Anti-Pattern Example (FAIL)

```typescript
// ❌ ANTI-PATTERN: Primitive obsession

// Using primitives for everything
function processDonation(
  donationId: string,
  donorId: string,
  amount: number,
  currency: string,
  category: string,
): void {
  // Problems:
  // 1. Easy to swap donationId and donorId (both strings)
  // 2. No validation that amount is positive
  // 3. No validation that currency is valid (USD, SAR, EUR)
  // 4. No validation that category is valid (zakat, sadaqah, waqf)
  // 5. Can't attach domain behavior (e.g., currency conversion)

  console.log(`Processing donation ${donationId} from ${donorId}`);
  console.log(`Amount: ${amount} ${currency}`);
  console.log(`Category: ${category}`);
}

// Caller can easily make mistakes
processDonation(
  "DNR-12345", // ❌ Swapped donorId and donationId!
  "DON-67890",
  -1000, // ❌ Negative amount!
  "INVALID", // ❌ Invalid currency!
  "random", // ❌ Invalid category!
);

// Calculations with primitives
function calculateZakat(wealth: number, goldPrice: number, gramWeight: number): number {
  // ❌ What units? SAR? USD? grams? ounces?
  // No type safety to prevent mixing units
  const nisab = goldPrice * gramWeight;
  return wealth >= nisab ? wealth * 0.025 : 0;
}

// Easy to make unit mistakes
const zakat = calculateZakat(
  100000, // Wealth in SAR
  250, // Gold price in USD per ounce (❌ wrong currency!)
  85, // Grams (❌ mixed with ounces!)
);

// String-based identifiers
function findDonation(donationId: string): Donation | null {
  // ❌ Can pass ANY string, including empty string or wrong format
  return database.get(donationId);
}

const donation = findDonation(""); // ❌ Empty string accepted!
const donation2 = findDonation("not-a-valid-id"); // ❌ Invalid format accepted!
```

#### Correct Approach (PASS)

```typescript
// ✅ SOLUTION: Domain-specific value objects with branded types

// Branded type for type-safe IDs
type Brand<K, T> = K & { __brand: T };

type DonationId = Brand<string, "DonationId">;
type DonorId = Brand<string, "DonorId">;

function createDonationId(id: string): DonationId {
  if (!id.match(/^DON-\d{10}$/)) {
    throw new Error(`Invalid donation ID format: ${id}`);
  }
  return id as DonationId;
}

function createDonorId(id: string): DonorId {
  if (!id.match(/^DNR-\d{10}$/)) {
    throw new Error(`Invalid donor ID format: ${id}`);
  }
  return id as DonorId;
}

// Money value object
class Money {
  private constructor(
    private readonly _amount: number,
    private readonly _currency: Currency,
  ) {
    if (_amount < 0) {
      throw new Error("Amount cannot be negative");
    }
  }

  static create(amount: number, currency: Currency): Money {
    return new Money(amount, currency);
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): Currency {
    return this._currency;
  }

  add(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot add different currencies: ${this._currency} and ${other._currency}`);
    }
    return new Money(this._amount + other._amount, this._currency);
  }

  multiply(multiplier: number): Money {
    return new Money(this._amount * multiplier, this._currency);
  }

  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  toString(): string {
    return `${this._amount} ${this._currency}`;
  }
}

// Currency enum
enum Currency {
  SAR = "SAR",
  USD = "USD",
  EUR = "EUR",
}

// Donation category with exhaustive type checking
type DonationCategory = "zakat" | "sadaqah" | "waqf";

function isDonationCategory(value: string): value is DonationCategory {
  return ["zakat", "sadaqah", "waqf"].includes(value);
}

// Domain object using value objects
interface Donation {
  id: DonationId;
  donorId: DonorId;
  amount: Money;
  category: DonationCategory;
  createdAt: Date;
}

function processDonation(donation: Donation): void {
  // ✅ Type-safe: Can't swap IDs
  // ✅ Amount is always valid (validated in Money constructor)
  // ✅ Currency is always valid (enum)
  // ✅ Category is always valid (union type)

  console.log(`Processing donation ${donation.id} from ${donation.donorId}`);
  console.log(`Amount: ${donation.amount.toString()}`);
  console.log(`Category: ${donation.category}`);
}

// Nisab threshold value object with units
class NisabThreshold {
  private constructor(
    private readonly goldPricePerGram: Money,
    private readonly gramsOfGold: number,
  ) {
    if (gramsOfGold <= 0) {
      throw new Error("Grams of gold must be positive");
    }
  }

  static create(goldPricePerGram: Money, gramsOfGold: number): NisabThreshold {
    return new NisabThreshold(goldPricePerGram, gramsOfGold);
  }

  getThresholdAmount(): Money {
    return this.goldPricePerGram.multiply(this.gramsOfGold);
  }

  isWealthAboveNisab(wealth: Money): boolean {
    const threshold = this.getThresholdAmount();
    if (wealth.currency !== threshold.currency) {
      throw new Error("Wealth and threshold must be in same currency");
    }
    return wealth.amount >= threshold.amount;
  }
}

// Using value objects
const goldPrice = Money.create(250, Currency.SAR); // 250 SAR per gram
const nisab = NisabThreshold.create(goldPrice, 85); // 85 grams of gold
const wealth = Money.create(100000, Currency.SAR);

if (nisab.isWealthAboveNisab(wealth)) {
  const zakatAmount = wealth.multiply(0.025);
  console.log(`Zakat due: ${zakatAmount.toString()}`);
}

// ✅ Type system prevents errors
const usdWealth = Money.create(100000, Currency.USD);
// nisab.isWealthAboveNisab(usdWealth); // ✅ Throws error: different currencies!

// ✅ Can't create invalid donations
try {
  const invalidDonation: Donation = {
    id: createDonationId("DON-1234567890"),
    donorId: createDonorId("DNR-0987654321"),
    amount: Money.create(-1000, Currency.SAR), // ✅ Throws error!
    category: "zakat",
    createdAt: new Date(),
  };
} catch (error) {
  console.error("Prevented invalid donation:", error.message);
}
```

#### Detection

- **Code review**: Functions with many primitive parameters (4+)
- **Domain modeling**: Identify concepts that deserve value objects
- **Bug patterns**: Frequent validation errors or wrong parameter order
- **ESLint**: Custom rules for parameter count, naming conventions

#### Islamic Finance Impact

In Murabaha contract systems, primitive obsession causes:

- **Currency mixing**: Cost price in USD, profit in SAR (incorrect calculations)
- **Negative prices**: No validation prevents negative cost or profit
- **ID confusion**: Contract IDs swapped with customer IDs
- **Unit errors**: Interest rate as percentage vs decimal (15 vs 0.15)

### Anemic Domain Models

#### Description

Domain objects that only contain data with no behavior, pushing all logic into service layers. Violates object-oriented principles and domain-driven design.

#### Why It's Problematic

- Scatters domain logic across multiple services
- Makes code harder to maintain and understand
- Violates encapsulation and Single Responsibility Principle
- Harder to enforce domain invariants
- Duplicates validation logic across services
- In financial apps, makes business rules harder to audit and verify

#### Anti-Pattern Example (FAIL)

```typescript
// ❌ ANTI-PATTERN: Anemic domain model

// Domain object with only getters/setters (no behavior)
class Donation {
  constructor(
    public id: string,
    public donorId: string,
    public amount: number,
    public currency: string,
    public status: "pending" | "processing" | "completed" | "failed",
    public createdAt: Date,
  ) {}

  // Only getters and setters, no domain behavior
  getId(): string {
    return this.id;
  }

  getAmount(): number {
    return this.amount;
  }

  getStatus(): string {
    return this.status;
  }

  setStatus(status: "pending" | "processing" | "completed" | "failed"): void {
    this.status = status; // ❌ No validation!
  }
}

// All logic in service layer
class DonationService {
  // ❌ Domain logic scattered across service methods

  canProcess(donation: Donation): boolean {
    // ❌ This is domain knowledge that should be in Donation class
    return donation.getAmount() > 0 && donation.getStatus() === "pending";
  }

  process(donation: Donation): void {
    if (!this.canProcess(donation)) {
      throw new Error("Cannot process donation");
    }

    // ❌ Direct state mutation without invariants
    donation.setStatus("processing");

    // Business logic here...

    donation.setStatus("completed");
  }

  calculateZakat(donation: Donation, nisabThreshold: number): number {
    // ❌ Zakat calculation logic separated from Donation domain
    if (donation.getAmount() >= nisabThreshold) {
      return donation.getAmount() * 0.025;
    }
    return 0;
  }

  refund(donation: Donation): void {
    // ❌ No validation of valid state transitions
    donation.setStatus("failed");
    // What if donation was already completed? No check!
  }
}

// Anemic Murabaha contract
class MurabahaContract {
  constructor(
    public contractId: string,
    public costPrice: number,
    public profitMargin: number,
    public status: string,
  ) {}

  // Only data, no behavior
}

class MurabahaService {
  calculateSellingPrice(contract: MurabahaContract): number {
    // ❌ Calculation logic should be in MurabahaContract
    return contract.costPrice * (1 + contract.profitMargin);
  }

  approve(contract: MurabahaContract): void {
    // ❌ State transition logic scattered
    contract.status = "approved";
  }
}
```

#### Correct Approach (PASS)

```typescript
// ✅ SOLUTION: Rich domain model with encapsulated behavior

type DonationStatus = "pending" | "processing" | "completed" | "failed";

class Donation {
  private constructor(
    private readonly id: string,
    private readonly donorId: string,
    private readonly amount: Money,
    private status: DonationStatus,
    private readonly createdAt: Date,
  ) {}

  static create(id: string, donorId: string, amount: Money): Donation {
    // ✅ Validation in constructor
    if (!id.match(/^DON-\d{10}$/)) {
      throw new Error("Invalid donation ID format");
    }
    if (!donorId.match(/^DNR-\d{10}$/)) {
      throw new Error("Invalid donor ID format");
    }

    return new Donation(id, donorId, amount, "pending", new Date());
  }

  // ✅ Domain behavior: Can this donation be processed?
  canProcess(): boolean {
    return this.status === "pending" && this.amount.amount > 0;
  }

  // ✅ Domain behavior: Process donation with state validation
  process(): void {
    if (!this.canProcess()) {
      throw new Error(`Cannot process donation in status: ${this.status}`);
    }

    this.status = "processing";
  }

  // ✅ Domain behavior: Complete donation with state validation
  complete(): void {
    if (this.status !== "processing") {
      throw new Error(`Cannot complete donation in status: ${this.status}`);
    }

    this.status = "completed";
  }

  // ✅ Domain behavior: Fail donation with state validation
  fail(): void {
    if (this.status === "completed") {
      throw new Error("Cannot fail a completed donation");
    }

    this.status = "failed";
  }

  // ✅ Domain behavior: Calculate Zakat for this donation
  calculateZakat(nisabThreshold: Money): Money {
    if (this.amount.currency !== nisabThreshold.currency) {
      throw new Error("Amount and threshold must be in same currency");
    }

    if (this.amount.amount >= nisabThreshold.amount) {
      return this.amount.multiply(0.025);
    }

    return Money.create(0, this.amount.currency);
  }

  // Getters (read-only access)
  getId(): string {
    return this.id;
  }

  getDonorId(): string {
    return this.donorId;
  }

  getAmount(): Money {
    return this.amount;
  }

  getStatus(): DonationStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}

// Service layer becomes thin orchestration
class DonationService {
  constructor(private readonly repository: DonationRepository) {}

  async processDonation(donationId: string): Promise<void> {
    const donation = await this.repository.findById(donationId);

    if (!donation) {
      throw new Error("Donation not found");
    }

    // ✅ Domain object handles validation and state transitions
    donation.process();
    await this.repository.save(donation);

    // External side effects (email, notifications)
    await this.sendConfirmationEmail(donation);

    donation.complete();
    await this.repository.save(donation);
  }

  private async sendConfirmationEmail(donation: Donation): Promise<void> {
    // Infrastructure concern, not domain logic
  }
}

// Rich Murabaha contract domain model
class MurabahaContract {
  private constructor(
    private readonly contractId: string,
    private readonly costPrice: Money,
    private readonly profitMargin: number,
    private status: "pending" | "approved" | "active" | "completed",
  ) {
    if (profitMargin < 0 || profitMargin > 1) {
      throw new Error("Profit margin must be between 0 and 1");
    }
  }

  static create(contractId: string, costPrice: Money, profitMargin: number): MurabahaContract {
    return new MurabahaContract(contractId, costPrice, profitMargin, "pending");
  }

  // ✅ Domain behavior: Calculate selling price
  calculateSellingPrice(): Money {
    return this.costPrice.multiply(1 + this.profitMargin);
  }

  // ✅ Domain behavior: Approve contract with validation
  approve(): void {
    if (this.status !== "pending") {
      throw new Error(`Cannot approve contract in status: ${this.status}`);
    }
    this.status = "approved";
  }

  // ✅ Domain behavior: Activate contract
  activate(): void {
    if (this.status !== "approved") {
      throw new Error(`Cannot activate contract in status: ${this.status}`);
    }
    this.status = "active";
  }

  // ✅ Domain behavior: Check if contract is profitable
  isProfitable(): boolean {
    return this.profitMargin > 0;
  }

  // Getters
  getContractId(): string {
    return this.contractId;
  }

  getCostPrice(): Money {
    return this.costPrice;
  }

  getProfitMargin(): number {
    return this.profitMargin;
  }

  getStatus(): string {
    return this.status;
  }
}
```

#### Detection

- **Code review**: Domain objects with only getters/setters
- **Service layer**: Services with many methods manipulating domain objects
- **Duplicate logic**: Same validation or calculation in multiple places
- **State bugs**: Invalid state transitions allowed

#### Islamic Finance Impact

In Waqf endowment systems, anemic models cause:

- **Invalid state transitions**: Endowments distributed before approval
- **Business rule violations**: Zakat calculated incorrectly due to scattered logic
- **Audit failures**: Domain rules not enforced at domain level
- **Compliance issues**: Shariah rules not encapsulated in domain objects

### Non-Null Assertions

```typescript
// ❌ ANTI-PATTERN: Assumes value exists
function getDonorName(donorId: string): string {
  const donor = findDonor(donorId);
  return donor!.name; // Dangerous!
}

// ✅ SOLUTION: Handle null explicitly
function getDonorNameSafe(donorId: string): string | null {
  const donor = findDonor(donorId);
  return donor ? donor.name : null;
}

// ✅ BETTER: Use Result pattern
function getDonorNameResult(donorId: string): Result<string, Error> {
  const donor = findDonor(donorId);
  if (!donor) {
    return err(new Error("Donor not found"));
  }
  return ok(donor.name);
}
```

### Overly Broad Types

```typescript
// ❌ ANTI-PATTERN: Too permissive
interface DonationFilters {
  [key: string]: any;
}

// ✅ SOLUTION: Explicit properties
interface DonationFilters {
  category?: "zakat" | "sadaqah" | "waqf";
  minAmount?: number;
  maxAmount?: number;
  donorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
```

## Error Handling Anti-Patterns

### Error Handling Decision Flow

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% All colors are color-blind friendly and meet WCAG AA contrast standards

graph TD
    A["Error Occurs"]:::blue --> B{"Can You<br/>Recover?"}:::orange

    B -->|"Yes"| C["Handle Gracefully<br/>(retry, default value)"]:::teal
    B -->|"No"| D{"Need to Add<br/>Context?"}:::orange

    D -->|"Yes"| E["Wrap Error<br/>(custom error class)"]:::purple
    D -->|"No"| F["Propagate<br/>(throw/return error)"]:::brown

    C --> G{"Log?"}:::orange
    E --> G
    F --> G

    G -->|"Yes"| H["Log with Context<br/>(userId, timestamp)"]:::teal
    G -->|"No"| I["Return to Caller"]:::teal

    H --> I

    Note["❌ NEVER:<br/>Silent failures,<br/>Generic messages,<br/>Excessive try-catch"]

    classDef blue fill:#0173B2,stroke:#000,color:#fff
    classDef orange fill:#DE8F05,stroke:#000,color:#000
    classDef teal fill:#029E73,stroke:#000,color:#fff
    classDef purple fill:#CC78BC,stroke:#000,color:#000
    classDef brown fill:#CA9161,stroke:#000,color:#000
```

**Key Principles**:

- **Never swallow errors**: Always log or propagate
- **Add context when wrapping**: Create custom error classes with details
- **Use Result types**: Explicit `Result<T, E>` better than throw/catch
- **Log at boundaries**: Not every function needs try-catch

### Silent Failures

```typescript
// ❌ ANTI-PATTERN: Swallow errors
async function saveDonation(donation: Donation) {
  try {
    await db.save(donation);
  } catch (error) {
    // Silent failure
  }
}

// ✅ SOLUTION: Handle or propagate errors
async function saveDonationSafe(donation: Donation): Promise<Result<void, Error>> {
  try {
    await db.save(donation);
    return ok(undefined);
  } catch (error) {
    return err(error as Error);
  }
}
```

### Generic Error Messages

```typescript
// ❌ ANTI-PATTERN: Uninformative errors
throw new Error("Something went wrong");

// ✅ SOLUTION: Specific error messages
class DonationValidationError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(`Invalid ${field}: ${message}`);
    this.name = "DonationValidationError";
  }
}

if (donation.amount <= 0) {
  throw new DonationValidationError("amount", "Must be positive");
}
```

### Try-Catch Everywhere

```typescript
// ❌ ANTI-PATTERN: Defensive try-catch
function calculateZakat(wealth: number): number {
  try {
    try {
      try {
        if (wealth < 0) throw new Error("Negative wealth");
        return wealth * 0.025;
      } catch (e1) {
        throw e1;
      }
    } catch (e2) {
      throw e2;
    }
  } catch (e3) {
    throw e3;
  }
}

// ✅ SOLUTION: Single try-catch at boundary
function calculateZakatSafe(wealth: number): number {
  if (wealth < 0) {
    throw new Error("Wealth cannot be negative");
  }
  return wealth * 0.025;
}

// Call site handles errors
try {
  const zakat = calculateZakatSafe(wealth);
} catch (error) {
  handleError(error);
}
```

## Async/Promise Anti-Patterns

### Promise Constructor Anti-Pattern

#### Description

Wrapping already-thenable values (Promises, async functions) in `new Promise()` is unnecessary and creates extra overhead. This is called the "Promise constructor anti-pattern" or "explicit Promise construction anti-pattern."

#### Why It's Problematic

- Adds unnecessary promise wrapping layer
- Makes error handling more complex
- Can swallow errors if reject is not called properly
- Indicates misunderstanding of Promises
- Creates callback hell within Promises
- In financial transactions, can mask errors and cause silent failures

#### Anti-Pattern Example (FAIL)

```typescript
// ❌ ANTI-PATTERN: Wrapping Promise in Promise constructor

// Unnecessary wrapping of async function
function getDonation(id: string): Promise<Donation> {
  return new Promise((resolve, reject) => {
    fetchDonation(id) // Already returns Promise!
      .then((donation) => resolve(donation))
      .catch((error) => reject(error));
  });
}

// Unnecessary wrapping of Promise-returning function
function calculateZakat(wealth: number): Promise<number> {
  return new Promise((resolve, reject) => {
    getGoldPrice() // Returns Promise<number>
      .then((goldPrice) => {
        const nisab = goldPrice * 85; // 85 grams of gold
        if (wealth >= nisab) {
          resolve(wealth * 0.025);
        } else {
          resolve(0);
        }
      })
      .catch((error) => reject(error));
  });
}

// Wrapping async operations unnecessarily
function processMurabahaContract(contractId: string): Promise<Contract> {
  return new Promise(async (resolve, reject) => {
    // ❌ async executor is anti-pattern!
    try {
      const contract = await fetchContract(contractId);
      const validated = await validateContract(contract);
      const approved = await approveContract(validated);
      resolve(approved);
    } catch (error) {
      reject(error);
    }
  });
}

// Creating Promise for sync operations (sometimes valid, but usually not needed)
function validateDonationAmount(amount: number): Promise<boolean> {
  return new Promise((resolve) => {
    // Sync validation wrapped in Promise
    if (amount > 0 && amount <= 1000000) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}
```

#### Correct Approach (PASS)

```typescript
// ✅ SOLUTION: Return Promises directly

// Just return the Promise
function getDonation(id: string): Promise<Donation> {
  return fetchDonation(id);
}

// Chain operations without wrapping
function calculateZakat(wealth: number): Promise<number> {
  return getGoldPrice().then((goldPrice) => {
    const nisab = goldPrice * 85;
    return wealth >= nisab ? wealth * 0.025 : 0;
  });
}

// Use async/await directly
async function processMurabahaContract(contractId: string): Promise<Contract> {
  const contract = await fetchContract(contractId);
  const validated = await validateContract(contract);
  const approved = await approveContract(validated);
  return approved; // Returns Promise automatically
}

// Keep sync functions synchronous
function validateDonationAmount(amount: number): boolean {
  return amount > 0 && amount <= 1000000;
}

// ✅ When Promise constructor IS appropriate:
// Converting callback-based APIs to Promises

function legacyDonationFetch(id: string, callback: (err: Error | null, data?: Donation) => void): void {
  // Old callback-based API
}

function getDonationFromLegacy(id: string): Promise<Donation> {
  // ✅ Appropriate use: Converting callbacks to Promises
  return new Promise((resolve, reject) => {
    legacyDonationFetch(id, (err, data) => {
      if (err) {
        reject(err);
      } else if (data) {
        resolve(data);
      } else {
        reject(new Error("No data returned"));
      }
    });
  });
}

// ✅ Wrapping EventEmitter patterns
import { EventEmitter } from "events";

function waitForDonationConfirmation(emitter: EventEmitter, donationId: string): Promise<void> {
  // ✅ Appropriate: Converting events to Promise
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Confirmation timeout"));
    }, 30000);

    emitter.once("confirmed", (id) => {
      if (id === donationId) {
        clearTimeout(timeout);
        resolve();
      }
    });

    emitter.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}
```

#### Detection

- **ESLint**: `no-async-promise-executor`, `no-return-await`
- **Code review**: Look for `new Promise()` wrapping async functions
- **TypeScript**: Return type analysis shows Promise<Promise<T>>

#### Islamic Finance Impact

In Murabaha approval workflows, Promise constructor anti-pattern causes:

- **Error masking**: Approval errors not properly propagated
- **Callback hell**: Nested Promises within Promise constructors
- **Performance overhead**: Extra promise layers slow down transaction processing
- **Audit failures**: Errors swallowed in wrapped Promises

### Unhandled Promise Rejections

#### Description

Not handling Promise rejections leads to silent failures, unhandled rejection warnings, and in Node.js 15+, process termination.

#### Why It's Problematic

- Silent failures in production
- Node.js process can crash (since v15)
- Makes debugging extremely difficult
- Violates error handling best practices
- In financial apps, can cause lost transactions and data corruption

#### Anti-Pattern Example (FAIL)

```typescript
// ❌ ANTI-PATTERN: Unhandled rejections

// Fire-and-forget with no error handling
async function processDonation(donation: Donation) {
  saveDonation(donation); // ❌ Promise returned but not awaited or caught
  console.log("Donation processing started");
}

// Async function called without await or catch
function handleDonationRequest(req: Request, res: Response) {
  processDonationWorkflow(req.body); // ❌ Unhandled Promise!
  res.json({ message: "Processing started" });
}

// Promise chain without catch
function calculateAndSaveZakat(wealth: number) {
  getGoldPrice()
    .then((goldPrice) => {
      const nisab = goldPrice * 85;
      if (wealth >= nisab) {
        return wealth * 0.025;
      }
      return 0;
    })
    .then((zakatAmount) => {
      return saveZakatCalculation({ wealth, zakatAmount });
    });
  // ❌ No .catch() - errors will be unhandled!
}

// Partial error handling
async function processMurabahaContract(contractId: string) {
  try {
    const contract = await fetchContract(contractId);
    const validated = validateContract(contract); // ❌ If validateContract is async, this Promise is unhandled!

    // Some async operation without await
    notifyCustomer(contract.customerId); // ❌ Unhandled Promise!

    return contract;
  } catch (error) {
    console.error("Error processing contract:", error);
  }
}
```

#### Correct Approach (PASS)

```typescript
// ✅ SOLUTION: Always handle Promise rejections

// Await and handle errors
async function processDonation(donation: Donation): Promise<void> {
  try {
    await saveDonation(donation);
    console.log("Donation saved successfully");
  } catch (error) {
    console.error("Failed to save donation:", error);
    throw error; // Re-throw or handle appropriately
  }
}

// Handle async functions called from sync context
function handleDonationRequest(req: Request, res: Response) {
  processDonationWorkflow(req.body)
    .then(() => {
      res.json({ message: "Processing completed" });
    })
    .catch((error) => {
      console.error("Processing failed:", error);
      res.status(500).json({ error: "Processing failed" });
    });
}

// Add catch to Promise chains
function calculateAndSaveZakat(wealth: number): Promise<void> {
  return getGoldPrice()
    .then((goldPrice) => {
      const nisab = goldPrice * 85;
      return wealth >= nisab ? wealth * 0.025 : 0;
    })
    .then((zakatAmount) => {
      return saveZakatCalculation({ wealth, zakatAmount });
    })
    .catch((error) => {
      console.error("Failed to calculate and save Zakat:", error);
      throw error;
    });
}

// Complete error handling
async function processMurabahaContract(contractId: string): Promise<Contract> {
  try {
    const contract = await fetchContract(contractId);
    const validated = await validateContract(contract); // ✅ Await async function

    // ✅ Await notification or handle error explicitly
    try {
      await notifyCustomer(contract.customerId);
    } catch (notificationError) {
      // Log but don't fail the whole operation
      console.error("Failed to notify customer:", notificationError);
    }

    return validated;
  } catch (error) {
    console.error("Error processing contract:", error);
    throw error;
  }
}

// ✅ Global unhandled rejection handler (Node.js safety net)
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Application specific logging, throwing an error, or other logic here
  process.exit(1); // Exit process to avoid undefined state
});

// ✅ Use Result pattern for better error handling
import { Result, ok, err } from "neverthrow";

async function calculateZakatSafe(wealth: number): Promise<Result<number, Error>> {
  try {
    const goldPrice = await getGoldPrice();
    const nisab = goldPrice * 85;
    const zakatAmount = wealth >= nisab ? wealth * 0.025 : 0;
    return ok(zakatAmount);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
```

#### Detection

- **Node.js warnings**: "UnhandledPromiseRejectionWarning" in console
- **ESLint**: `@typescript-eslint/no-floating-promises`, `@typescript-eslint/no-misused-promises`
- **Testing**: Unit tests timing out or showing unexpected failures
- **Production monitoring**: Process crashes with "unhandledRejection" errors

#### Islamic Finance Impact

In Zakat distribution systems, unhandled rejections cause:

- **Lost distributions**: Beneficiaries not receiving funds due to silent errors
- **Incomplete transactions**: Zakat calculated but not saved
- **Audit trail gaps**: Transactions partially completed without error logs
- **Process crashes**: Node.js terminating mid-distribution

### Race Conditions in Async Code

#### Description

Race conditions occur when the order of async operations is not controlled, leading to unpredictable results based on timing.

#### Why It's Problematic

- Unpredictable behavior
- Intermittent bugs that are hard to reproduce
- Data corruption from concurrent writes
- Incorrect state updates
- In financial systems, can cause double-spending, incorrect balances, or lost transactions

#### Anti-Pattern Example (FAIL)

```typescript
// ❌ ANTI-PATTERN: Race conditions in donation processing

class DonationAccount {
  private balance: number = 0;

  // ❌ Race condition: Concurrent deposits
  async deposit(amount: number): Promise<void> {
    const currentBalance = this.balance; // Read
    await simulateNetworkDelay(); // Simulate async operation
    this.balance = currentBalance + amount; // Write
    // If two deposits happen concurrently, one can overwrite the other!
  }

  // ❌ Race condition: Check-then-act pattern
  async withdraw(amount: number): Promise<void> {
    if (this.balance >= amount) {
      // Check
      await simulateNetworkDelay();
      this.balance -= amount; // Act
      // Race: Balance could have changed between check and act!
    } else {
      throw new Error("Insufficient funds");
    }
  }

  getBalance(): number {
    return this.balance;
  }
}

// Example race condition
const account = new DonationAccount();

// Both deposits execute concurrently
Promise.all([
  account.deposit(1000), // Reads balance: 0, sets to: 1000
  account.deposit(500), // Reads balance: 0, sets to: 500
]);

// Expected balance: 1500
// Actual balance: 500 (last write wins!)

// ❌ Race condition in Zakat calculation updates
let nisabThreshold = 85000;

async function updateNisabThreshold(): Promise<void> {
  const goldPrice = await fetchGoldPrice(); // Async fetch
  nisabThreshold = goldPrice * 85; // Update global state
}

async function calculateZakat(wealth: number): Promise<number> {
  // ❌ nisabThreshold might be updated mid-calculation!
  const threshold = nisabThreshold;
  await someAsyncOperation();
  return wealth >= threshold ? wealth * 0.025 : 0;
  // threshold might be stale now if updateNisabThreshold() ran
}

// Both functions running concurrently cause race
Promise.all([updateNisabThreshold(), calculateZakat(100000)]);
```

#### Correct Approach (PASS)

```typescript
// ✅ SOLUTION: Proper synchronization and atomic operations

class DonationAccount {
  private balance: number = 0;
  private operationQueue: Promise<void> = Promise.resolve();

  // ✅ Serialize operations with queue
  async deposit(amount: number): Promise<void> {
    this.operationQueue = this.operationQueue.then(async () => {
      const currentBalance = this.balance;
      await simulateNetworkDelay();
      this.balance = currentBalance + amount;
    });
    return this.operationQueue;
  }

  async withdraw(amount: number): Promise<void> {
    this.operationQueue = this.operationQueue.then(async () => {
      if (this.balance >= amount) {
        await simulateNetworkDelay();
        this.balance -= amount;
      } else {
        throw new Error("Insufficient funds");
      }
    });
    return this.operationQueue;
  }

  getBalance(): number {
    return this.balance;
  }
}

// ✅ Using mutex/semaphore pattern
import { Mutex } from "async-mutex";

class DonationAccountMutex {
  private balance: number = 0;
  private mutex = new Mutex();

  async deposit(amount: number): Promise<void> {
    const release = await this.mutex.acquire(); // Acquire lock
    try {
      const currentBalance = this.balance;
      await simulateNetworkDelay();
      this.balance = currentBalance + amount;
    } finally {
      release(); // Always release lock
    }
  }

  async withdraw(amount: number): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      if (this.balance >= amount) {
        await simulateNetworkDelay();
        this.balance -= amount;
      } else {
        throw new Error("Insufficient funds");
      }
    } finally {
      release();
    }
  }

  getBalance(): number {
    return this.balance;
  }
}

// ✅ Atomic operations with version checking (optimistic locking)
interface DonationAccountState {
  balance: number;
  version: number;
}

class DonationAccountOptimistic {
  private state: DonationAccountState = { balance: 0, version: 0 };

  async deposit(amount: number): Promise<void> {
    let success = false;
    while (!success) {
      const currentState = { ...this.state };
      const newBalance = currentState.balance + amount;
      const newVersion = currentState.version + 1;

      await simulateNetworkDelay();

      // Check version hasn't changed
      if (this.state.version === currentState.version) {
        this.state = { balance: newBalance, version: newVersion };
        success = true;
      }
      // Retry if version changed (another operation happened)
    }
  }

  getBalance(): number {
    return this.state.balance;
  }
}

// ✅ Immutable state updates
class ZakatCalculator {
  async calculateZakat(wealth: number): Promise<number> {
    // Fetch threshold at calculation time (no shared state)
    const goldPrice = await fetchGoldPrice();
    const nisabThreshold = goldPrice * 85;

    return wealth >= nisabThreshold ? wealth * 0.025 : 0;
  }
}

// ✅ Database-level atomic operations
async function transferDonation(fromAccount: string, toAccount: string, amount: number): Promise<void> {
  // Use database transaction for atomicity
  await db.transaction(async (tx) => {
    const fromBalance = await tx.query("SELECT balance FROM accounts WHERE id = $1 FOR UPDATE", [fromAccount]);

    if (fromBalance.rows[0].balance < amount) {
      throw new Error("Insufficient funds");
    }

    await tx.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [amount, fromAccount]);
    await tx.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [amount, toAccount]);
  });
}
```

#### Detection

- **Testing**: Race conditions often appear as intermittent test failures
- **Code review**: Look for shared mutable state with async operations
- **Static analysis**: Tools like ThreadSanitizer (for lower-level languages)
- **Manual inspection**: Check-then-act patterns, concurrent reads/writes

#### Islamic Finance Impact

In Waqf endowment management, race conditions cause:

- **Double allocation**: Same funds allocated to multiple beneficiaries
- **Lost donations**: Concurrent deposits overwriting each other
- **Incorrect balances**: Withdrawal happening after balance check but before deduction
- **Audit failures**: Transaction history missing concurrent operations

### Unnecessary Await

```typescript
// ❌ ANTI-PATTERN: Unnecessary await
async function getDonation(id: string) {
  return await fetchDonation(id);
}

// ✅ SOLUTION: Return promise directly
async function getDonationBetter(id: string) {
  return fetchDonation(id);
}

// Only await when you need the value
async function processDonation(id: string) {
  const donation = await fetchDonation(id);
  const validated = validateDonation(donation);
  return validated;
}
```

### Sequential Instead of Parallel

```typescript
// ❌ ANTI-PATTERN: Sequential when independent
async function getDashboardData() {
  const donations = await fetchDonations();
  const donors = await fetchDonors();
  const campaigns = await fetchCampaigns();
  return { donations, donors, campaigns };
}

// ✅ SOLUTION: Parallel execution
async function getDashboardDataParallel() {
  const [donations, donors, campaigns] = await Promise.all([fetchDonations(), fetchDonors(), fetchCampaigns()]);
  return { donations, donors, campaigns };
}
```

### Async Function Not Awaited

```typescript
// ❌ ANTI-PATTERN: Fire and forget
function processDonations() {
  saveDonations(); // Returns unhandled promise
  console.log("Done"); // Logs before save completes
}

// ✅ SOLUTION: Await async functions
async function processDonationsSafe() {
  await saveDonations();
  console.log("Done");
}

// OR: Handle promise explicitly
function processDonationsExplicit() {
  saveDonations()
    .then(() => console.log("Done"))
    .catch(handleError);
}
```

### Callback Hell

#### Promise Pattern Comparison

Compare different async patterns from worst to best for handling donation processing.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant App
    participant Fetch as fetchDonation
    participant Validate as validateDonation
    participant Save as saveDonation

    Note over App,Save: Anti-Pattern: Callback Hell #40;Nested#41;
    App->>Fetch: fetchDonation#40;id, callback#41;
    Fetch-->>App: callback#40;err1, donation#41;
    App->>Validate: validateDonation#40;donation, callback#41;
    Validate-->>App: callback#40;err2, valid#41;
    App->>Save: saveDonation#40;valid, callback#41;
    Save-->>App: callback#40;err3, saved#41;
    Note right of App: Deeply nested<br/>Error handling scattered

    Note over App,Save: Better: Promise Chaining
    App->>Fetch: fetchDonation#40;id#41;.then#40;#41;
    Fetch-->>App: Promise#60;Donation#62;
    App->>Validate: validateDonation#40;donation#41;.then#40;#41;
    Validate-->>App: Promise#60;ValidDonation#62;
    App->>Save: saveDonation#40;valid#41;.then#40;#41;
    Save-->>App: Promise#60;SavedDonation#62;
    Note right of App: Flatter structure<br/>.catch#40;#41; handles errors

    Note over App,Save: Best: Async/Await
    App->>Fetch: await fetchDonation#40;id#41;
    Fetch-->>App: Donation
    App->>Validate: await validateDonation#40;donation#41;
    Validate-->>App: ValidDonation
    App->>Save: await saveDonation#40;valid#41;
    Save-->>App: SavedDonation
    Note right of App: Sequential code<br/>try/catch for errors
```

```typescript
// ❌ ANTI-PATTERN: Nested callbacks
function processDonation(id: string, callback: (err: Error | null, result?: any) => void) {
  fetchDonation(id, (err1, donation) => {
    if (err1) return callback(err1);

    validateDonation(donation, (err2, valid) => {
      if (err2) return callback(err2);

      saveDonation(valid, (err3, saved) => {
        if (err3) return callback(err3);
        callback(null, saved);
      });
    });
  });
}

// ✅ SOLUTION: Use async/await
async function processDonationAsync(id: string) {
  const donation = await fetchDonation(id);
  const valid = await validateDonation(donation);
  const saved = await saveDonation(valid);
  return saved;
}
```

## Performance Anti-Patterns

### Mutable State Management Problems

Shared mutable state creates conflicts and unpredictable behavior in concurrent operations.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
stateDiagram-v2
    [*] --> Clean: Initial State
    Clean --> Modified1: User A modifies
    Clean --> Modified2: User B modifies
    Modified1 --> Conflict: User B overwrites
    Modified2 --> Conflict: User A overwrites
    Conflict --> DataLoss: Lost updates
    Conflict --> InconsistentState: Partial writes
    DataLoss --> [*]: Error state
    InconsistentState --> [*]: Error state

    Clean --> Immutable: Use immutable data
    Immutable --> NewState1: User A creates new
    Immutable --> NewState2: User B creates new
    NewState1 --> Merged: Merge strategies
    NewState2 --> Merged: Conflict resolution
    Merged --> [*]: Consistent state

    note right of Conflict
        Shared mutable state
        causes race conditions
        and data corruption
    end note

    note right of Immutable
        Immutable data prevents
        conflicts through
        copy-on-write
    end note
```

### String Concatenation in Loops

```typescript
// ❌ ANTI-PATTERN: Repeated string concatenation
let report = "";
for (const donation of donations) {
  report += `${donation.id}: ${donation.amount}\n`;
}

// ✅ SOLUTION: Array join
const lines = donations.map((d) => `${d.id}: ${d.amount}`);
const report = lines.join("\n");
```

### Unnecessary Object Creation

```typescript
// ❌ ANTI-PATTERN: Creates object every iteration
function filterDonations(donations: Donation[]) {
  return donations.filter((d) => {
    const minAmount = 100; // Created every iteration
    return d.amount >= minAmount;
  });
}

// ✅ SOLUTION: Hoist constants
function filterDonationsBetter(donations: Donation[]) {
  const minAmount = 100; // Created once
  return donations.filter((d) => d.amount >= minAmount);
}
```

### Not Using Memoization

```typescript
// ❌ ANTI-PATTERN: Recalculate expensive operations
class DonationStats {
  constructor(private donations: Donation[]) {}

  getTotal(): number {
    return this.donations.reduce((sum, d) => sum + d.amount, 0);
  }

  getAverage(): number {
    return this.getTotal() / this.donations.length; // Recalculates total
  }
}

// ✅ SOLUTION: Memoize expensive calculations
class DonationStatsMemo {
  private _total: number | null = null;

  constructor(private donations: Donation[]) {}

  getTotal(): number {
    if (this._total === null) {
      this._total = this.donations.reduce((sum, d) => sum + d.amount, 0);
    }
    return this._total;
  }

  getAverage(): number {
    return this.getTotal() / this.donations.length; // Uses cached total
  }
}
```

### Loading Everything at Once

```typescript
// ❌ ANTI-PATTERN: Load all data
async function processDonations() {
  const allDonations = await fetchAllDonations(); // Could be millions

  for (const donation of allDonations) {
    await process(donation);
  }
}

// ✅ SOLUTION: Paginate
async function processDonationsPaginated() {
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const donations = await fetchDonations(page, pageSize);
    if (donations.length === 0) break;

    for (const donation of donations) {
      await process(donation);
    }

    page++;
  }
}
```

## Design Anti-Patterns

### Over-Abstraction Detection

Abstraction is powerful but can be harmful when overdone. This flowchart helps detect over-abstraction.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Start["Adding Abstraction"]:::blue
    Q1{"More than<br/>2 use cases?"}:::orange
    Q2{"Reduces<br/>duplication?"}:::orange
    Q3{"Simplifies<br/>code?"}:::orange
    Q4{"Easy to<br/>understand?"}:::orange

    KeepSimple["Keep It Simple<br/>No abstraction needed"]:::teal
    GoodAbstraction["Good Abstraction<br/>Proceed"]:::teal
    Refactor["Refactor<br/>Simplify abstraction"]:::brown
    OverAbstraction["Over-Abstraction<br/>Harmful complexity"]:::purple

    Start --> Q1
    Q1 -->|No| KeepSimple
    Q1 -->|Yes| Q2
    Q2 -->|No| KeepSimple
    Q2 -->|Yes| Q3
    Q3 -->|No| Refactor
    Q3 -->|Yes| Q4
    Q4 -->|No| Refactor
    Q4 -->|Yes| GoodAbstraction

    Warning["Warning Signs:<br/>- Generic names #40;Manager, Handler#41;<br/>- Many type parameters;<br/>- Callback inception;<br/>- Harder to read than duplicate code"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

### God Object

```typescript
// ❌ ANTI-PATTERN: One object does everything
class DonationManager {
  createDonation() {}
  validateDonation() {}
  processDonation() {}
  sendEmail() {}
  generateReceipt() {}
  updateStats() {}
  logActivity() {}
  checkFraud() {}
}

// ✅ SOLUTION: Single Responsibility
class DonationService {
  create(data: DonationInput): Promise<Donation> {}
  validate(donation: Donation): ValidationResult {}
}

class EmailService {
  sendReceipt(donation: Donation): Promise<void> {}
}

class ReceiptGenerator {
  generate(donation: Donation): Promise<Buffer> {}
}

class DonationAnalytics {
  updateStats(donation: Donation): Promise<void> {}
}
```

### Primitive Obsession

```typescript
// ❌ ANTI-PATTERN: Using primitives
function processDonation(donationId: string, donorId: string, amount: number, currency: string) {
  // Easy to mix up parameters
}

processDonation("DON-123", "DNR-456", 1000, "USD");
processDonation("DNR-456", "DON-123", 1000, "USD"); // Bug!

// ✅ SOLUTION: Value objects
type DonationId = string & { __brand: "DonationId" };
type DonorId = string & { __brand: "DonorId" };

interface Money {
  amount: number;
  currency: string;
}

function processDonationSafe(donationId: DonationId, donorId: DonorId, payment: Money) {
  // Type-safe
}
```

### Shotgun Surgery

```typescript
// ❌ ANTI-PATTERN: Change requires modifying many files
// donation-service.ts
const FEE_PERCENTAGE = 0.03;

// payment-processor.ts
const FEE_PERCENTAGE = 0.03;

// receipt-generator.ts
const FEE_PERCENTAGE = 0.03;

// ✅ SOLUTION: Centralize configuration
// config.ts
export const DONATION_CONFIG = {
  feePercentage: 0.03,
  minimumAmount: 10,
  maximumAmount: 100000,
} as const;

// All files import from config
import { DONATION_CONFIG } from "./config";
```

### Spaghetti Code

```typescript
// ❌ ANTI-PATTERN: Complex control flow
function processDonation(donation: any) {
  if (donation.amount > 0) {
    if (donation.currency === "USD") {
      if (donation.category === "zakat") {
        if (donation.amount >= 100) {
          // nested logic
          if (donation.donor.verified) {
            // more nesting
          } else {
            // and more
          }
        }
      }
    }
  }
}

// ✅ SOLUTION: Early returns and extraction
function processDonationClear(donation: Donation): Result<void, Error> {
  if (donation.amount <= 0) {
    return err(new Error("Invalid amount"));
  }

  if (donation.currency !== "USD") {
    return err(new Error("Invalid currency"));
  }

  if (!validateCategory(donation.category)) {
    return err(new Error("Invalid category"));
  }

  if (donation.amount < MINIMUM_AMOUNT) {
    return err(new Error("Amount below minimum"));
  }

  return processVerifiedDonation(donation);
}

function processVerifiedDonation(donation: Donation): Result<void, Error> {
  if (!donation.donor.verified) {
    return err(new Error("Donor not verified"));
  }

  // Process donation
  return ok(undefined);
}
```

## Security Anti-Patterns

### Storing Secrets in Code

```typescript
// ❌ ANTI-PATTERN: Hardcoded secrets
const API_KEY = "sk-1234567890abcdef";
const DATABASE_URL = "postgresql://user:password@localhost/db";

// ✅ SOLUTION: Environment variables
const API_KEY = process.env.API_KEY!;
const DATABASE_URL = process.env.DATABASE_URL!;

// Validate at startup
if (!API_KEY || !DATABASE_URL) {
  throw new Error("Missing required environment variables");
}
```

### SQL Injection Risk

```typescript
// ❌ ANTI-PATTERN: String concatenation
async function getDonations(donorId: string) {
  const query = `SELECT * FROM donations WHERE donor_id = '${donorId}'`;
  return db.query(query);
}

// ✅ SOLUTION: Parameterized queries
async function getDonationsSafe(donorId: string) {
  const query = "SELECT * FROM donations WHERE donor_id = $1";
  return db.query(query, [donorId]);
}
```

### Exposing Sensitive Data

```typescript
// ❌ ANTI-PATTERN: Return sensitive data
app.get("/api/users/:id", async (req, res) => {
  const user = await db.findUser(req.params.id);
  res.json(user); // Includes password hash, email, etc.
});

// ✅ SOLUTION: DTO pattern
interface UserDTO {
  id: string;
  name: string;
  publicProfile: string;
}

function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    name: user.name,
    publicProfile: user.publicProfile,
  };
}

app.get("/api/users/:id", async (req, res) => {
  const user = await db.findUser(req.params.id);
  res.json(toUserDTO(user));
});
```

### Not Validating Input

```typescript
// ❌ ANTI-PATTERN: Trust user input
app.post("/api/donations", async (req, res) => {
  const donation = await createDonation(req.body);
  res.json(donation);
});

// ✅ SOLUTION: Validate all input
const donationSchema = z.object({
  donorId: z.string().regex(/^DNR-\d{10}$/),
  amount: z.number().positive().max(1000000),
  currency: z.enum(["USD", "EUR", "SAR"]),
  category: z.enum(["zakat", "sadaqah", "waqf"]),
});

app.post("/api/donations", async (req, res) => {
  try {
    const data = donationSchema.parse(req.body);
    const donation = await createDonation(data);
    res.json(donation);
  } catch (error) {
    res.status(400).json({ error: "Invalid input" });
  }
});
```

## Testing Anti-Patterns

### Testing Implementation Details

```typescript
// ❌ ANTI-PATTERN: Test private methods
class ZakatCalculator {
  private calculateNisab(wealth: number): boolean {
    return wealth >= 3000;
  }

  calculate(wealth: number): number {
    if (this.calculateNisab(wealth)) {
      return wealth * 0.025;
    }
    return 0;
  }
}

// Testing private method
test("calculateNisab", () => {
  const calc = new ZakatCalculator();
  expect((calc as any).calculateNisab(5000)).toBe(true);
});

// ✅ SOLUTION: Test public interface
test("calculate zakat for wealth above nisab", () => {
  const calc = new ZakatCalculator();
  expect(calc.calculate(5000)).toBe(125);
});

test("calculate zakat for wealth below nisab", () => {
  const calc = new ZakatCalculator();
  expect(calc.calculate(2000)).toBe(0);
});
```

### Not Testing Edge Cases

```typescript
// ❌ ANTI-PATTERN: Only happy path
test("create donation", () => {
  const donation = createDonation({
    donorId: "DNR-1234567890",
    amount: 1000,
    currency: "USD",
    category: "zakat",
  });

  expect(donation).toBeDefined();
});

// ✅ SOLUTION: Test edge cases
describe("createDonation", () => {
  it("creates valid donation", () => {
    const donation = createDonation(validInput);
    expect(donation).toBeDefined();
  });

  it("rejects negative amount", () => {
    expect(() => createDonation({ ...validInput, amount: -100 })).toThrow();
  });

  it("rejects invalid currency", () => {
    expect(() => createDonation({ ...validInput, currency: "XYZ" })).toThrow();
  });

  it("rejects zero amount", () => {
    expect(() => createDonation({ ...validInput, amount: 0 })).toThrow();
  });

  it("rejects amount exceeding limit", () => {
    expect(() => createDonation({ ...validInput, amount: 10000000 })).toThrow();
  });
});
```

### Mocking Everything

```typescript
// ❌ ANTI-PATTERN: Over-mocking
test("process donation", async () => {
  const mockValidate = jest.fn().mockReturnValue(true);
  const mockSave = jest.fn().mockResolvedValue({ id: "123" });
  const mockEmail = jest.fn().mockResolvedValue(true);

  // Test doesn't verify actual logic
});

// ✅ SOLUTION: Mock external dependencies only
test("process donation", async () => {
  // Mock external services
  const mockEmailService = {
    send: jest.fn().mockResolvedValue(true),
  };

  // Use real validation logic
  const donation = await processDonation(validInput, mockEmailService);

  expect(donation).toBeDefined();
  expect(mockEmailService.send).toHaveBeenCalledWith(donation);
});
```

## React/Component Anti-Patterns

### Prop Drilling

#### Description

Prop drilling occurs when you pass props through many levels of components that don't use them, just to reach a deeply nested component. This creates tight coupling and makes refactoring difficult.

#### Why It's Problematic

- Creates unnecessary dependencies between unrelated components
- Makes components harder to reuse and test
- Increases maintenance burden when prop types change
- Violates component encapsulation
- Makes code harder to understand and navigate
- In Islamic finance applications, can lead to sensitive data exposure across component boundaries

#### Anti-Pattern Example (FAIL)

```typescript
// ❌ ANTI-PATTERN: Prop drilling through multiple levels
interface DonationDashboardProps {
  userId: string;
  userName: string;
  userRole: "donor" | "admin" | "beneficiary";
}

// Top-level component
function DonationDashboard({ userId, userName, userRole }: DonationDashboardProps) {
  return (
    <div>
      <Header userId={userId} userName={userName} userRole={userRole} />
      <MainContent userId={userId} userName={userName} userRole={userRole} />
      <Footer userId={userId} userName={userName} />
    </div>
  );
}

// Intermediate component - doesn't use props, just passes them
function Header({ userId, userName, userRole }: DonationDashboardProps) {
  return (
    <header>
      <Navigation userId={userId} userName={userName} userRole={userRole} />
    </header>
  );
}

// Another intermediate component
function Navigation({ userId, userName, userRole }: DonationDashboardProps) {
  return (
    <nav>
      <UserMenu userId={userId} userName={userName} userRole={userRole} />
    </nav>
  );
}

// Finally uses the props at the deeply nested level
function UserMenu({ userId, userName, userRole }: DonationDashboardProps) {
  return (
    <div>
      <p>Welcome {userName}</p>
      <p>ID: {userId}</p>
      {userRole === "admin" && <AdminControls />}
    </div>
  );
}

// MainContent also drills props to ZakatCalculator
function MainContent({ userId, userName, userRole }: DonationDashboardProps) {
  return (
    <div>
      <DonationList userId={userId} />
      <ZakatCalculator userId={userId} userName={userName} />
    </div>
  );
}

function DonationList({ userId }: { userId: string }) {
  // Uses userId
  return <div>Donations for {userId}</div>;
}

function ZakatCalculator({ userId, userName }: { userId: string; userName: string }) {
  // Uses userId and userName
  return (
    <div>
      Zakat calculator for {userName} (ID: {userId})
    </div>
  );
}
```

#### Correct Approach (PASS)

```typescript
// ✅ SOLUTION: Use React Context API to avoid prop drilling
import { createContext, useContext, ReactNode } from "react";

// Create context for user data
interface UserContextData {
  userId: string;
  userName: string;
  userRole: "donor" | "admin" | "beneficiary";
}

const UserContext = createContext<UserContextData | undefined>(undefined);

// Provider component
interface UserProviderProps {
  children: ReactNode;
  value: UserContextData;
}

function UserProvider({ children, value }: UserProviderProps) {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook for consuming context
function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}

// Top-level component - no prop drilling
function DonationDashboard({ userId, userName, userRole }: DonationDashboardProps) {
  return (
    <UserProvider value={{ userId, userName, userRole }}>
      <div>
        <Header />
        <MainContent />
        <Footer />
      </div>
    </UserProvider>
  );
}

// Intermediate components don't need props
function Header() {
  return (
    <header>
      <Navigation />
    </header>
  );
}

function Navigation() {
  return (
    <nav>
      <UserMenu />
    </nav>
  );
}

// Leaf component accesses context directly
function UserMenu() {
  const { userId, userName, userRole } = useUser();

  return (
    <div>
      <p>Welcome {userName}</p>
      <p>ID: {userId}</p>
      {userRole === "admin" && <AdminControls />}
    </div>
  );
}

// Other components also access context without prop drilling
function MainContent() {
  return (
    <div>
      <DonationList />
      <ZakatCalculator />
    </div>
  );
}

function DonationList() {
  const { userId } = useUser();
  return <div>Donations for {userId}</div>;
}

function ZakatCalculator() {
  const { userId, userName } = useUser();
  return (
    <div>
      Zakat calculator for {userName} (ID: {userId})
    </div>
  );
}
```

#### Detection

- **Manual inspection**: Look for props passed through 3+ component levels
- **ESLint rules**: `react/jsx-no-constructed-context-values`, `react/forbid-prop-types`
- **Code review**: Check if intermediate components just pass props without using them
- **TypeScript**: Watch for repeated interface definitions across components

#### Islamic Finance Impact

In Zakat or Murabaha applications, prop drilling can lead to:

- Sensitive user data exposed across many component boundaries
- Audit trail difficulties (harder to track where data is accessed)
- Compliance violations (data should only flow to components that need it)
- Security risks (more places where data can leak or be mishandled)

### Hook Dependency Array Mistakes

#### Description

The `useEffect` dependency array tells React when to re-run effects. Incorrect dependencies cause stale data, infinite loops, or missing updates.

#### Why It's Problematic

- Stale closures access outdated values
- Infinite re-render loops crash the application
- Missing dependencies cause bugs that are hard to debug
- Effects run more often than necessary, harming performance
- In financial calculations, stale data leads to incorrect monetary amounts

#### Anti-Pattern Example (FAIL)

```typescript
// ❌ ANTI-PATTERN: Missing dependencies causes stale data
import { useState, useEffect } from "react";

interface Money {
  amount: number;
  currency: string;
}

function ZakatCalculator() {
  const [wealth, setWealth] = useState<Money>({ amount: 100000, currency: "SAR" });
  const [nisabThreshold, setNisabThreshold] = useState(85000);
  const [zakatAmount, setZakatAmount] = useState<Money | null>(null);

  // Problem 1: Missing dependencies - nisabThreshold changes won't trigger recalculation
  useEffect(() => {
    if (wealth.amount >= nisabThreshold) {
      setZakatAmount({
        amount: wealth.amount * 0.025,
        currency: wealth.currency,
      });
    } else {
      setZakatAmount(null);
    }
  }, [wealth]); // Missing nisabThreshold!

  // Problem 2: Empty dependency array - never updates
  const [goldPrice, setGoldPrice] = useState(0);

  useEffect(() => {
    // Fetches gold price once but never updates when goldPrice state changes
    async function fetchGoldPrice() {
      const response = await fetch("/api/gold-price");
      const data = await response.json();
      setGoldPrice(data.price);
    }
    fetchGoldPrice();
  }, []); // Should include dependencies if fetching based on state

  // Problem 3: Unnecessary dependency causes infinite loop
  const [totalDonations, setTotalDonations] = useState(0);
  const [donationCount, setDonationCount] = useState(0);

  useEffect(() => {
    // Infinite loop: setDonationCount triggers effect which calls setDonationCount again
    const count = Math.floor(totalDonations / 1000);
    setDonationCount(count);
  }, [totalDonations, donationCount]); // donationCount shouldn't be here!

  return (
    <div>
      <p>Wealth: {wealth.amount} {wealth.currency}</p>
      <p>Nisab Threshold: {nisabThreshold}</p>
      <p>Zakat Due: {zakatAmount ? `${zakatAmount.amount} ${zakatAmount.currency}` : "Below nisab"}</p>
      <button onClick={() => setNisabThreshold(90000)}>Update Nisab</button>
      <button onClick={() => setWealth({ amount: 150000, currency: "SAR" })}>Update Wealth</button>
    </div>
  );
}
```

#### Correct Approach (PASS)

```typescript
// ✅ SOLUTION: Correct dependency arrays and effect patterns
import { useState, useEffect, useCallback } from "react";

interface Money {
  amount: number;
  currency: string;
}

function ZakatCalculator() {
  const [wealth, setWealth] = useState<Money>({ amount: 100000, currency: "SAR" });
  const [nisabThreshold, setNisabThreshold] = useState(85000);
  const [zakatAmount, setZakatAmount] = useState<Money | null>(null);

  // ✅ Include ALL dependencies that are used inside the effect
  useEffect(() => {
    if (wealth.amount >= nisabThreshold) {
      setZakatAmount({
        amount: wealth.amount * 0.025,
        currency: wealth.currency,
      });
    } else {
      setZakatAmount(null);
    }
  }, [wealth, nisabThreshold]); // Both dependencies included

  // ✅ Use useCallback for functions used in effects
  const fetchGoldPrice = useCallback(async () => {
    const response = await fetch("/api/gold-price");
    const data = await response.json();
    return data.price;
  }, []); // No dependencies if API endpoint doesn't change

  const [goldPrice, setGoldPrice] = useState(0);

  useEffect(() => {
    fetchGoldPrice().then(setGoldPrice);
  }, [fetchGoldPrice]); // Include function dependency

  // ✅ Avoid derived state in useEffect - calculate during render instead
  const [totalDonations, setTotalDonations] = useState(0);

  // Derived value - no state needed, no effect needed
  const donationCount = Math.floor(totalDonations / 1000);

  // ✅ Alternative: Use useMemo for expensive calculations
  import { useMemo } from "react";

  const expensiveCalculation = useMemo(() => {
    // Only recalculates when totalDonations changes
    console.log("Calculating donation statistics...");
    return {
      count: Math.floor(totalDonations / 1000),
      average: totalDonations / 1000,
      formatted: `${totalDonations.toLocaleString()} SAR`,
    };
  }, [totalDonations]);

  return (
    <div>
      <p>Wealth: {wealth.amount} {wealth.currency}</p>
      <p>Nisab Threshold: {nisabThreshold}</p>
      <p>Zakat Due: {zakatAmount ? `${zakatAmount.amount} ${zakatAmount.currency}` : "Below nisab"}</p>
      <p>Gold Price: {goldPrice} SAR/gram</p>
      <p>Donation Count: {donationCount}</p>
      <p>Statistics: {expensiveCalculation.formatted}</p>
      <button onClick={() => setNisabThreshold(90000)}>Update Nisab</button>
      <button onClick={() => setWealth({ amount: 150000, currency: "SAR" })}>Update Wealth</button>
      <button onClick={() => setTotalDonations((prev) => prev + 5000)}>Add Donation</button>
    </div>
  );
}
```

#### Detection

- **ESLint**: `react-hooks/exhaustive-deps` rule (REQUIRED in all React projects)
- **React DevTools**: Warnings in console about missing dependencies
- **Testing**: Unit tests failing intermittently or showing stale data
- **Performance profiling**: Components re-rendering more than expected

#### Islamic Finance Impact

In Zakat or Murabaha calculations, dependency array mistakes can cause:

- **Incorrect Zakat amounts**: Stale nisab threshold leads to wrong calculations
- **Audit trail failures**: Missing updates mean transaction history is incomplete
- **Compliance violations**: Calculations not reflecting current market rates
- **Financial loss**: Users overpaying or underpaying Zakat

### Missing useEffect Cleanup

#### Description

`useEffect` can return a cleanup function that runs when the component unmounts or before the effect re-runs. Forgetting cleanup causes memory leaks, event listener accumulation, and subscription leaks.

#### Why It's Problematic

- Memory leaks from abandoned subscriptions
- Multiple event listeners registered on the same element
- Ongoing network requests for unmounted components
- Race conditions when async operations complete after unmounting
- In real-time Murabaha pricing, can cause incorrect price updates

#### Anti-Pattern Example (FAIL)

```typescript
// ❌ ANTI-PATTERN: No cleanup for subscriptions and timers
import { useState, useEffect } from "react";

interface MurabahaContract {
  contractId: string;
  costPrice: number;
  profitMargin: number;
  sellingPrice: number;
  status: "pending" | "active" | "completed";
}

function MurabahaPriceMonitor({ contractId }: { contractId: string }) {
  const [contract, setContract] = useState<MurabahaContract | null>(null);
  const [livePrice, setLivePrice] = useState(0);

  // Problem 1: WebSocket connection never closed
  useEffect(() => {
    const ws = new WebSocket(`wss://api.example.com/murabaha/${contractId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLivePrice(data.currentPrice);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // ❌ No cleanup! WebSocket stays open even after unmount
  }, [contractId]);

  // Problem 2: Interval timer never cleared
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Fetch updated contract status every 5 seconds
      fetch(`/api/contracts/${contractId}`)
        .then((res) => res.json())
        .then((data) => setContract(data));
    }, 5000);

    // ❌ No cleanup! Interval keeps running after unmount
  }, [contractId]);

  // Problem 3: Event listener never removed
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("User switched tab - pause updates");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ❌ No cleanup! Listener accumulates on every render
  }, [contractId]);

  // Problem 4: Async race condition - setState after unmount
  useEffect(() => {
    async function loadContract() {
      const response = await fetch(`/api/contracts/${contractId}`);
      const data = await response.json();

      // ❌ If component unmounts during fetch, this causes:
      // "Warning: Can't perform a React state update on an unmounted component"
      setContract(data);
    }

    loadContract();
  }, [contractId]);

  if (!contract) return <div>Loading...</div>;

  return (
    <div>
      <h3>Murabaha Contract {contract.contractId}</h3>
      <p>Cost Price: {contract.costPrice} SAR</p>
      <p>Selling Price: {contract.sellingPrice} SAR</p>
      <p>Live Market Price: {livePrice} SAR</p>
      <p>Status: {contract.status}</p>
    </div>
  );
}
```

#### Correct Approach (PASS)

```typescript
// ✅ SOLUTION: Proper cleanup for all side effects
import { useState, useEffect, useRef } from "react";

interface MurabahaContract {
  contractId: string;
  costPrice: number;
  profitMargin: number;
  sellingPrice: number;
  status: "pending" | "active" | "completed";
}

function MurabahaPriceMonitor({ contractId }: { contractId: string }) {
  const [contract, setContract] = useState<MurabahaContract | null>(null);
  const [livePrice, setLivePrice] = useState(0);

  // ✅ Cleanup 1: Close WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(`wss://api.example.com/murabaha/${contractId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLivePrice(data.currentPrice);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // ✅ Return cleanup function
    return () => {
      console.log("Closing WebSocket connection");
      ws.close();
    };
  }, [contractId]);

  // ✅ Cleanup 2: Clear interval timer
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch(`/api/contracts/${contractId}`)
        .then((res) => res.json())
        .then((data) => setContract(data))
        .catch((error) => console.error("Failed to fetch contract:", error));
    }, 5000);

    // ✅ Return cleanup function that clears interval
    return () => {
      console.log("Clearing interval");
      clearInterval(intervalId);
    };
  }, [contractId]);

  // ✅ Cleanup 3: Remove event listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("User switched tab - pause updates");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ✅ Return cleanup function that removes listener
    return () => {
      console.log("Removing event listener");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [contractId]);

  // ✅ Cleanup 4: Prevent setState on unmounted component
  useEffect(() => {
    // Use a flag to track if component is still mounted
    let isMounted = true;

    async function loadContract() {
      try {
        const response = await fetch(`/api/contracts/${contractId}`);
        const data = await response.json();

        // ✅ Only update state if component is still mounted
        if (isMounted) {
          setContract(data);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to load contract:", error);
        }
      }
    }

    loadContract();

    // ✅ Cleanup sets flag to false
    return () => {
      isMounted = false;
    };
  }, [contractId]);

  // ✅ Alternative: Use AbortController for fetch (modern approach)
  useEffect(() => {
    const abortController = new AbortController();

    async function loadContract() {
      try {
        const response = await fetch(`/api/contracts/${contractId}`, {
          signal: abortController.signal,
        });
        const data = await response.json();
        setContract(data);
      } catch (error) {
        // AbortError is expected when cleanup runs
        if (error.name !== "AbortError") {
          console.error("Failed to load contract:", error);
        }
      }
    }

    loadContract();

    // ✅ Cleanup aborts the fetch request
    return () => {
      abortController.abort();
    };
  }, [contractId]);

  if (!contract) return <div>Loading...</div>;

  return (
    <div>
      <h3>Murabaha Contract {contract.contractId}</h3>
      <p>Cost Price: {contract.costPrice} SAR</p>
      <p>Selling Price: {contract.sellingPrice} SAR</p>
      <p>Live Market Price: {livePrice} SAR</p>
      <p>Status: {contract.status}</p>
    </div>
  );
}
```

#### Detection

- **Browser DevTools**: Network tab shows ongoing requests after component unmount
- **Console warnings**: "Can't perform a React state update on an unmounted component"
- **Memory profiler**: Memory usage increases over time
- **Event listener count**: Check `getEventListeners(window)` in console

#### Islamic Finance Impact

In Murabaha contract monitoring, missing cleanup can cause:

- **Incorrect pricing**: Multiple WebSocket connections sending conflicting prices
- **Resource exhaustion**: Hundreds of abandoned connections to pricing API
- **Audit failures**: Transaction logs showing updates for closed contracts
- **Compliance violations**: Contracts showing stale data after being finalized

### Mutable State Updates

#### Description

Directly mutating state instead of creating new objects breaks React's change detection and causes UI not to update.

#### Why It's Problematic

- React won't detect changes and won't re-render
- Can cause subtle bugs that are hard to debug
- Violates immutability principle
- Makes time-travel debugging impossible
- In financial applications, leads to incorrect displayed values

#### Anti-Pattern Example (FAIL)

```typescript
// ❌ ANTI-PATTERN: Direct state mutation
import { useState } from "react";

interface Donation {
  id: string;
  amount: number;
  currency: string;
  category: "zakat" | "sadaqah" | "waqf";
  status: "pending" | "processing" | "completed";
}

function DonationManager() {
  const [donations, setDonations] = useState<Donation[]>([
    { id: "DON-001", amount: 1000, currency: "SAR", category: "zakat", status: "pending" },
    { id: "DON-002", amount: 500, currency: "SAR", category: "sadaqah", status: "pending" },
  ]);

  // ❌ Problem 1: Directly mutating array
  const addDonation = (donation: Donation) => {
    donations.push(donation); // Direct mutation!
    setDonations(donations); // React won't detect change because array reference is the same
  };

  // ❌ Problem 2: Mutating nested object
  const updateDonationStatus = (id: string, status: Donation["status"]) => {
    const donation = donations.find((d) => d.id === id);
    if (donation) {
      donation.status = status; // Direct mutation!
      setDonations(donations); // React won't detect change
    }
  };

  // ❌ Problem 3: Mutating while mapping
  const increaseAllAmounts = (increaseBy: number) => {
    donations.forEach((d) => {
      d.amount += increaseBy; // Direct mutation!
    });
    setDonations(donations); // React won't detect change
  };

  // ❌ Problem 4: Sorting mutates original array
  const sortByAmount = () => {
    donations.sort((a, b) => b.amount - a.amount); // Direct mutation!
    setDonations(donations); // React won't detect change
  };

  return (
    <div>
      <h2>Donations</h2>
      <ul>
        {donations.map((donation) => (
          <li key={donation.id}>
            {donation.id}: {donation.amount} {donation.currency} - {donation.status}
            <button onClick={() => updateDonationStatus(donation.id, "completed")}>
              Complete
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() =>
          addDonation({
            id: `DON-${String(donations.length + 1).padStart(3, "0")}`,
            amount: 750,
            currency: "SAR",
            category: "waqf",
            status: "pending",
          })
        }
      >
        Add Donation
      </button>
      <button onClick={() => increaseAllAmounts(100)}>Increase All by 100</button>
      <button onClick={sortByAmount}>Sort by Amount</button>
    </div>
  );
}
```

#### Correct Approach (PASS)

```typescript
// ✅ SOLUTION: Immutable state updates
import { useState } from "react";

interface Donation {
  id: string;
  amount: number;
  currency: string;
  category: "zakat" | "sadaqah" | "waqf";
  status: "pending" | "processing" | "completed";
}

function DonationManager() {
  const [donations, setDonations] = useState<Donation[]>([
    { id: "DON-001", amount: 1000, currency: "SAR", category: "zakat", status: "pending" },
    { id: "DON-002", amount: 500, currency: "SAR", category: "sadaqah", status: "pending" },
  ]);

  // ✅ Create new array with spread operator
  const addDonation = (donation: Donation) => {
    setDonations([...donations, donation]); // New array reference
  };

  // ✅ Map to new array with updated object
  const updateDonationStatus = (id: string, status: Donation["status"]) => {
    setDonations(
      donations.map((d) =>
        d.id === id
          ? { ...d, status } // New object with updated status
          : d // Keep unchanged
      )
    );
  };

  // ✅ Map to new array with updated amounts
  const increaseAllAmounts = (increaseBy: number) => {
    setDonations(
      donations.map((d) => ({
        ...d,
        amount: d.amount + increaseBy, // New object with updated amount
      }))
    );
  };

  // ✅ Create new array before sorting
  const sortByAmount = () => {
    const sorted = [...donations].sort((a, b) => b.amount - a.amount);
    setDonations(sorted); // New sorted array
  };

  // ✅ Using functional setState for updates based on previous state
  const addDonationSafe = (donation: Donation) => {
    setDonations((prevDonations) => [...prevDonations, donation]);
  };

  // ✅ Complex update using Immer library for deeply nested structures
  import { useImmer } from "use-immer";

  // Alternative with Immer (for complex nested state)
  const [donationsImmer, setDonationsImmer] = useImmer<Donation[]>([]);

  const updateWithImmer = (id: string, status: Donation["status"]) => {
    setDonationsImmer((draft) => {
      const donation = draft.find((d) => d.id === id);
      if (donation) {
        // Immer allows "mutation" of draft, produces new immutable state
        donation.status = status;
      }
    });
  };

  return (
    <div>
      <h2>Donations</h2>
      <ul>
        {donations.map((donation) => (
          <li key={donation.id}>
            {donation.id}: {donation.amount} {donation.currency} - {donation.status}
            <button onClick={() => updateDonationStatus(donation.id, "completed")}>
              Complete
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() =>
          addDonation({
            id: `DON-${String(donations.length + 1).padStart(3, "0")}`,
            amount: 750,
            currency: "SAR",
            category: "waqf",
            status: "pending",
          })
        }
      >
        Add Donation
      </button>
      <button onClick={() => increaseAllAmounts(100)}>Increase All by 100</button>
      <button onClick={sortByAmount}>Sort by Amount</button>
    </div>
  );
}
```

#### Detection

- **ESLint**: `react/no-direct-mutation-state` (class components), custom rules for functional components
- **Testing**: UI not updating after state changes
- **React DevTools**: State shows old value even after "update"
- **Code review**: Look for assignment operators (`=`, `+=`, `push`, `splice`, `sort`) on state

#### Islamic Finance Impact

In Zakat or Waqf donation management, mutable state causes:

- **UI showing stale donation amounts**: Users see incorrect totals
- **Failed transactions**: Status changes not reflected, causing duplicate processing
- **Audit trail corruption**: State mutations not logged properly
- **Compliance violations**: Incorrect Zakat calculations due to stale nisab values

## Module/Import Anti-Patterns

### Circular Dependencies

#### Description

Circular dependencies occur when Module A imports Module B, and Module B imports Module A (directly or indirectly). This creates initialization order problems and runtime errors.

#### Why It's Problematic

- Leads to undefined imports at runtime
- Makes code harder to understand and maintain
- Indicates poor separation of concerns
- Can cause module initialization failures
- Breaks tree-shaking and code splitting
- In financial applications, can cause incorrect calculation order

#### Anti-Pattern Example (FAIL)

```typescript
// ❌ ANTI-PATTERN: Circular dependency between donation and donor modules

// File: donation.ts
import { Donor } from "./donor"; // Imports Donor

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  donor: Donor; // References Donor
}

export function createDonation(donorId: string, amount: number): Donation {
  // getDonor is undefined here due to circular dependency!
  const donor = getDonor(donorId);

  return {
    id: generateId(),
    amount,
    currency: "SAR",
    donor,
  };
}

// File: donor.ts
import { Donation, createDonation } from "./donation"; // Imports Donation - CIRCULAR!

export interface Donor {
  id: string;
  name: string;
  totalDonations: number;
  donations: Donation[]; // References Donation
}

export function getDonor(id: string): Donor {
  return {
    id,
    name: "Sample Donor",
    totalDonations: 0,
    donations: [],
  };
}

export function addDonationToDonor(donorId: string, amount: number): Donor {
  // createDonation might be undefined due to circular dependency!
  const donation = createDonation(donorId, amount);
  const donor = getDonor(donorId);

  return {
    ...donor,
    donations: [...donor.donations, donation],
    totalDonations: donor.totalDonations + amount,
  };
}

// File: index.ts
import { addDonationToDonor } from "./donor";

// ❌ Runtime error: Cannot read property 'createDonation' of undefined
const result = addDonationToDonor("DNR-001", 1000);
```

#### Correct Approach (PASS)

```typescript
// ✅ SOLUTION 1: Extract shared types to separate file

// File: types.ts (shared types only, no implementation)
export interface Donation {
  id: string;
  amount: number;
  currency: string;
  donorId: string; // Reference by ID instead of object
}

export interface Donor {
  id: string;
  name: string;
  totalDonations: number;
}

// File: donation.ts (no circular dependency)
import { Donation } from "./types";

export function createDonation(donorId: string, amount: number): Donation {
  return {
    id: generateDonationId(),
    amount,
    currency: "SAR",
    donorId,
  };
}

export function getDonationsByDonor(donorId: string): Donation[] {
  // Fetch from database
  return [];
}

// File: donor.ts (no circular dependency)
import { Donor } from "./types";
import { getDonationsByDonor } from "./donation"; // Safe import

export function getDonor(id: string): Donor {
  const donations = getDonationsByDonor(id);
  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

  return {
    id,
    name: "Sample Donor",
    totalDonations,
  };
}

export function addDonationToDonor(donorId: string, amount: number): Donor {
  const donation = createDonation(donorId, amount);
  // Save donation to database
  return getDonor(donorId); // Returns updated donor
}

// ✅ SOLUTION 2: Dependency Injection to break circular dependency

// File: donation-service.ts
import { Donation } from "./types";

export class DonationService {
  createDonation(donorId: string, amount: number): Donation {
    return {
      id: generateDonationId(),
      amount,
      currency: "SAR",
      donorId,
    };
  }

  getDonationsByDonor(donorId: string): Donation[] {
    return [];
  }
}

// File: donor-service.ts
import { Donor } from "./types";
import { DonationService } from "./donation-service"; // One-way dependency

export class DonorService {
  constructor(private donationService: DonationService) {}

  getDonor(id: string): Donor {
    const donations = this.donationService.getDonationsByDonor(id);
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

    return {
      id,
      name: "Sample Donor",
      totalDonations,
    };
  }

  addDonationToDonor(donorId: string, amount: number): Donor {
    const donation = this.donationService.createDonation(donorId, amount);
    // Save donation
    return this.getDonor(donorId);
  }
}

// File: index.ts
const donationService = new DonationService();
const donorService = new DonorService(donationService);

const result = donorService.addDonationToDonor("DNR-001", 1000);
```

#### Detection

- **Build tools**: Webpack, Rollup, or Vite warnings about circular dependencies
- **ESLint**: `import/no-cycle` rule
- **madge**: Visualize module dependencies: `npx madge --circular --extensions ts ./src`
- **Runtime errors**: "undefined is not a function" or "Cannot read property of undefined"

#### Islamic Finance Impact

In Zakat calculation systems, circular dependencies can cause:

- **Initialization order bugs**: Nisab threshold calculator not initialized before Zakat calculator
- **Incorrect calculations**: Functions called before their dependencies are loaded
- **Audit failures**: Transaction logging happens before transaction processing
- **Compliance violations**: Shariah validation rules loaded in wrong order

### Side Effects in Module Imports

#### Description

Importing a module executes code with side effects (modifying global state, making network requests, etc.) immediately when imported.

#### Why It's Problematic

- Makes testing difficult (side effects run during import)
- Slows down application startup
- Can cause race conditions
- Makes code less predictable
- Breaks tree-shaking
- In financial apps, can trigger unauthorized transactions during import

#### Anti-Pattern Example (FAIL)

```typescript
// ❌ ANTI-PATTERN: Side effects at module level

// File: config.ts
console.log("Initializing configuration..."); // Side effect!

// Side effect: Fetches config immediately on import
const response = await fetch("/api/config"); // Side effect!
export const config = await response.json();

// Side effect: Modifies global state
window.APP_CONFIG = config; // Side effect!

// File: zakat-calculator.ts
// Side effect: Starts polling immediately on import
const nisabPrice = await fetch("/api/nisab-price").then((r) => r.json());

setInterval(() => {
  // Side effect: Polling starts on import!
  fetch("/api/nisab-price")
    .then((r) => r.json())
    .then((price) => {
      nisabPrice = price;
    });
}, 60000);

export function calculateZakat(wealth: number): number {
  if (wealth >= nisabPrice.threshold) {
    return wealth * 0.025;
  }
  return 0;
}

// File: audit-logger.ts
// Side effect: Creates database connection on import
import { createConnection } from "./database";

const connection = createConnection(); // Side effect!

export function logTransaction(transaction: Transaction) {
  connection.insert("transactions", transaction);
}

// File: index.ts
// ❌ All side effects run immediately when importing!
import { config } from "./config"; // Fetches config, modifies window
import { calculateZakat } from "./zakat-calculator"; // Starts polling
import { logTransaction } from "./audit-logger"; // Creates DB connection

// Even if we don't use these imports, side effects already happened!
```

#### Correct Approach (PASS)

```typescript
// ✅ SOLUTION: Lazy initialization with explicit setup functions

// File: config.ts
let cachedConfig: Config | null = null;

export async function initializeConfig(): Promise<Config> {
  if (cachedConfig) return cachedConfig;

  console.log("Initializing configuration...");
  const response = await fetch("/api/config");
  cachedConfig = await response.json();

  return cachedConfig;
}

export function getConfig(): Config {
  if (!cachedConfig) {
    throw new Error("Config not initialized. Call initializeConfig() first.");
  }
  return cachedConfig;
}

// File: zakat-calculator.ts
interface NisabPrice {
  threshold: number;
  currency: string;
  lastUpdated: Date;
}

class ZakatCalculator {
  private nisabPrice: NisabPrice | null = null;
  private pollInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    this.nisabPrice = await this.fetchNisabPrice();
    this.startPolling();
  }

  private async fetchNisabPrice(): Promise<NisabPrice> {
    const response = await fetch("/api/nisab-price");
    return response.json();
  }

  private startPolling(): void {
    this.pollInterval = setInterval(async () => {
      this.nisabPrice = await this.fetchNisabPrice();
    }, 60000);
  }

  calculateZakat(wealth: number): number {
    if (!this.nisabPrice) {
      throw new Error("ZakatCalculator not initialized. Call initialize() first.");
    }

    if (wealth >= this.nisabPrice.threshold) {
      return wealth * 0.025;
    }
    return 0;
  }

  cleanup(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

export const zakatCalculator = new ZakatCalculator();

// File: audit-logger.ts
import { createConnection, Connection } from "./database";

class AuditLogger {
  private connection: Connection | null = null;

  async initialize(): Promise<void> {
    if (!this.connection) {
      this.connection = await createConnection();
    }
  }

  logTransaction(transaction: Transaction): void {
    if (!this.connection) {
      throw new Error("AuditLogger not initialized. Call initialize() first.");
    }
    this.connection.insert("transactions", transaction);
  }

  async cleanup(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}

export const auditLogger = new AuditLogger();

// File: index.ts
import { initializeConfig, getConfig } from "./config";
import { zakatCalculator } from "./zakat-calculator";
import { auditLogger } from "./audit-logger";

// ✅ Explicit initialization
async function main() {
  // Initialize in correct order
  await initializeConfig();
  await zakatCalculator.initialize();
  await auditLogger.initialize();

  // Now safe to use
  const config = getConfig();
  const zakat = zakatCalculator.calculateZakat(100000);
  auditLogger.logTransaction({ amount: zakat, type: "zakat" });

  // Cleanup on shutdown
  process.on("SIGTERM", async () => {
    zakatCalculator.cleanup();
    await auditLogger.cleanup();
    process.exit(0);
  });
}

main().catch(console.error);
```

#### Detection

- **Testing**: Unit tests failing due to side effects running during import
- **Code review**: Look for top-level `await`, `fetch`, `setInterval`, etc.
- **ESLint**: Custom rules to detect top-level side effects
- **Performance profiling**: Slow application startup

#### Islamic Finance Impact

In Murabaha contract systems, side effect imports can cause:

- **Unauthorized transactions**: Contract creation triggered during module load
- **Race conditions**: Pricing fetched before authentication
- **Resource leaks**: Database connections created but never closed
- **Audit failures**: Transactions logged before validation

### Barrel Export Abuse

#### Description

Barrel files (index.ts) re-export everything from a directory. Overusing them creates large import graphs and breaks tree-shaking.

#### Why It's Problematic

- Increases bundle size (imports more than needed)
- Slows down build times
- Makes imports less explicit
- Can create circular dependencies
- Breaks tree-shaking in some bundlers
- Makes refactoring harder (unclear what's actually used)

#### Anti-Pattern Example (FAIL)

```typescript
// ❌ ANTI-PATTERN: Barrel export everything

// File: src/domain/zakat/index.ts
export * from "./calculator";
export * from "./validator";
export * from "./nisab-threshold";
export * from "./asset-types";
export * from "./distribution-rules";
export * from "./reporting";
export * from "./historical-data";
export * from "./compliance-checker";
// ... 20+ more exports

// File: src/domain/donations/index.ts
export * from "./donation";
export * from "./donor";
export * from "./campaign";
export * from "./receipt";
export * from "./analytics";
export * from "./fraud-detection";
export * from "./notification";
// ... 30+ more exports

// File: src/domain/index.ts
export * from "./zakat"; // Re-exports everything from zakat
export * from "./donations"; // Re-exports everything from donations
export * from "./murabaha";
export * from "./waqf";
export * from "./qard-hasan";
// ... more domain exports

// File: src/components/ZakatForm.tsx
// ❌ Imports EVERYTHING from entire domain module graph!
import { ZakatCalculator } from "@/domain";

// This single import pulls in:
// - All zakat modules (50+ functions)
// - All donation modules (100+ functions)
// - All other domain modules
// Even though we only need ZakatCalculator!
```

#### Correct Approach (PASS)

```typescript
// ✅ SOLUTION: Explicit exports and direct imports

// File: src/domain/zakat/index.ts
// Only export public API, not internal implementation
export { ZakatCalculator } from "./calculator";
export { validateZakatEligibility } from "./validator";
export { getNisabThreshold } from "./nisab-threshold";
export type { ZakatAsset, ZakatCalculation, NisabThreshold } from "./types";

// Don't export internal utilities
// - ./internal-helpers.ts (not exported)
// - ./calculation-cache.ts (not exported)
// - ./historical-data.ts (not exported unless needed externally)

// File: src/domain/donations/index.ts
export { createDonation, updateDonation } from "./donation";
export { getDonor, createDonor } from "./donor";
export type { Donation, Donor, DonationFilters } from "./types";

// File: src/domain/index.ts
// Don't re-export everything - be selective
export { ZakatCalculator, getNisabThreshold } from "./zakat";
export { createDonation, getDonor } from "./donations";
export type { ZakatCalculation, Donation, Donor } from "./zakat";

// OR: Don't use domain-level barrel at all
// Force consumers to import from specific modules

// File: src/components/ZakatForm.tsx
// ✅ BEST: Direct import from specific module
import { ZakatCalculator } from "@/domain/zakat/calculator";
import type { ZakatCalculation } from "@/domain/zakat/types";

// ✅ GOOD: Import from module-level barrel
import { ZakatCalculator } from "@/domain/zakat";

// ❌ AVOID: Import from root barrel (pulls in too much)
// import { ZakatCalculator } from "@/domain";

// ✅ Use named imports to aid tree-shaking
import { ZakatCalculator, getNisabThreshold } from "@/domain/zakat";

// ❌ Avoid namespace imports (harder to tree-shake)
import * as Zakat from "@/domain/zakat";
```

#### Detection

- **Bundle analyzer**: `webpack-bundle-analyzer`, `rollup-plugin-visualizer`
- **Build output**: Check bundle sizes for unexpected large modules
- **ESLint**: `import/no-internal-modules` (configure to enforce import levels)
- **Code review**: Look for `export *` patterns

#### Islamic Finance Impact

In enterprise Shariah compliance systems, barrel export abuse causes:

- **Large bundle sizes**: Mobile Zakat calculator loads entire compliance framework
- **Slow load times**: Users wait for megabytes of unused code
- **Security risks**: Internal utility functions exposed accidentally
- **Maintenance burden**: Unclear what code is actually used vs dead code

## API Design Anti-Patterns

### Boolean Parameters

#### Description

Using boolean parameters makes function calls unclear at the call site. Readers can't tell what `true` or `false` means without checking the function definition.

#### Why It's Problematic

- Unclear intent at call site
- Easy to pass arguments in wrong order
- Hard to extend (adding more booleans becomes unmaintainable)
- Violates self-documenting code principle
- In financial code, can cause incorrect transaction processing

#### Anti-Pattern Example (FAIL)

```typescript
// ❌ ANTI-PATTERN: Boolean parameters are unclear

// Function definition
function processDonation(
  amount: number,
  includeFee: boolean,
  sendReceipt: boolean,
  notifyDonor: boolean,
  isRecurring: boolean,
): void {
  // Implementation
}

// Call site - what do these booleans mean?
processDonation(1000, true, false, true, false); // ❌ Unclear!
processDonation(500, false, true, false, true); // ❌ What does this do?

// Easy to make mistakes
processDonation(750, true, true, false, false); // ❌ Is fee included? Will receipt be sent?

// File: murabaha-contract.ts
function createMurabahaContract(
  costPrice: number,
  profitMargin: number,
  validateShariah: boolean,
  requireApproval: boolean,
  autoActivate: boolean,
): MurabahaContract {
  // Implementation
}

// ❌ Unclear call
const contract = createMurabahaContract(10000, 0.15, true, false, true);
// What does true, false, true mean?
```

#### Correct Approach (PASS)

```typescript
// ✅ SOLUTION 1: Use options object with named properties

interface DonationOptions {
  includeFee: boolean;
  sendReceipt: boolean;
  notifyDonor: boolean;
  isRecurring: boolean;
}

function processDonation(amount: number, options: DonationOptions): void {
  if (options.includeFee) {
    // Add fee
  }
  if (options.sendReceipt) {
    // Send receipt
  }
  // Implementation
}

// ✅ Clear call site
processDonation(1000, {
  includeFee: true,
  sendReceipt: false,
  notifyDonor: true,
  isRecurring: false,
});

// ✅ SOLUTION 2: Use enums for related options

enum DonationProcessingMode {
  Standard = "STANDARD",
  WithFee = "WITH_FEE",
  Recurring = "RECURRING",
}

enum NotificationPreference {
  None = "NONE",
  EmailOnly = "EMAIL_ONLY",
  EmailAndSMS = "EMAIL_AND_SMS",
}

function processDonation(amount: number, mode: DonationProcessingMode, notification: NotificationPreference): void {
  // Implementation
}

// ✅ Self-documenting call
processDonation(1000, DonationProcessingMode.WithFee, NotificationPreference.EmailOnly);

// ✅ SOLUTION 3: Use builder pattern for complex configurations

class DonationBuilder {
  private amount: number = 0;
  private includeFee: boolean = false;
  private sendReceipt: boolean = false;
  private notifyDonor: boolean = false;
  private isRecurring: boolean = false;

  withAmount(amount: number): this {
    this.amount = amount;
    return this;
  }

  withFee(): this {
    this.includeFee = true;
    return this;
  }

  withReceipt(): this {
    this.sendReceipt = true;
    return this;
  }

  withNotification(): this {
    this.notifyDonor = true;
    return this;
  }

  asRecurring(): this {
    this.isRecurring = true;
    return this;
  }

  build(): Donation {
    return {
      amount: this.amount,
      includeFee: this.includeFee,
      sendReceipt: this.sendReceipt,
      notifyDonor: this.notifyDonor,
      isRecurring: this.isRecurring,
    };
  }
}

// ✅ Fluent, self-documenting API
const donation = new DonationBuilder().withAmount(1000).withFee().withNotification().build();

// File: murabaha-contract.ts
interface MurabahaContractOptions {
  validateShariah: boolean;
  requireApproval: boolean;
  autoActivate: boolean;
}

function createMurabahaContract(
  costPrice: number,
  profitMargin: number,
  options: MurabahaContractOptions,
): MurabahaContract {
  // Implementation
}

// ✅ Clear call
const contract = createMurabahaContract(10000, 0.15, {
  validateShariah: true,
  requireApproval: false,
  autoActivate: true,
});
```

#### Detection

- **ESLint**: Custom rule to detect multiple boolean parameters
- **Code review**: Functions with 2+ boolean parameters
- **TypeScript**: Use `@typescript-eslint/naming-convention` to enforce naming

#### Islamic Finance Impact

In Zakat distribution systems, boolean parameters can cause:

- **Wrong distribution mode**: `distributeZakat(amount, true, false)` - is this by category or by beneficiary?
- **Incorrect validation**: `validateDonation(data, true)` - Shariah check or fraud check?
- **Audit failures**: Unclear what processing options were used
- **Compliance violations**: Auto-activation enabled when manual approval required

## Anti-Patterns Summary

### Critical Anti-Patterns (Fix Immediately)

These anti-patterns cause severe bugs, security issues, or financial errors:

1. **Type Safety Violations**
   - Using `any` type extensively
   - Double type assertions (`as unknown as`)
   - Type assertions without validation on external data
   - Missing runtime validation (Zod, io-ts)

2. **Async/Promise Issues**
   - Unhandled Promise rejections
   - Race conditions in concurrent operations
   - Promise constructor anti-pattern
   - Missing cleanup in useEffect (React)

3. **Security Vulnerabilities**
   - Hardcoded secrets in code
   - SQL injection via string concatenation
   - Exposing sensitive data in API responses
   - Missing input validation

4. **State Management Bugs**
   - Direct mutation of React state
   - Missing dependency arrays in useEffect
   - Mutable static state
   - Race conditions in shared state updates

### High-Priority Anti-Patterns (Fix Soon)

These anti-patterns cause maintenance burden and subtle bugs:

1. **Domain Modeling Issues**
   - Primitive obsession (using strings/numbers instead of value objects)
   - Anemic domain models (logic in services, not domain objects)
   - Missing branded types for IDs
   - No validation in value object constructors

2. **Module Organization**
   - Circular dependencies
   - Side effects in module imports
   - Barrel export abuse (index.ts re-exporting everything)
   - Deep imports violating encapsulation

3. **API Design Problems**
   - Boolean parameters (unclear intent)
   - Overly broad types (accepting `any` or `unknown`)
   - Mutable API responses
   - Inconsistent naming conventions

4. **Testing Issues**
   - Testing implementation details (private methods)
   - Not testing edge cases
   - Over-mocking (mocking everything instead of just external dependencies)
   - Non-deterministic tests

### Medium-Priority Anti-Patterns (Technical Debt)

These anti-patterns reduce code quality but don't cause immediate bugs:

1. **Performance Issues**
   - String concatenation in loops
   - Unnecessary object creation
   - Not using memoization for expensive calculations
   - Loading all data at once (no pagination)

2. **Design Issues**
   - God Object (one class doing everything)
   - Shotgun surgery (change requires editing many files)
   - Spaghetti code (complex nested control flow)
   - Over-abstraction

3. **React/Component Issues**
   - Prop drilling (passing props through many levels)
   - Key prop anti-patterns in lists
   - Missing error boundaries
   - Unnecessary re-renders

4. **Error Handling**
   - Silent failures (swallowing errors)
   - Generic error messages
   - Try-catch everywhere (defensive programming)
   - Throwing strings instead of Error objects

## Recognition and Prevention

### Detection Strategies

#### Static Analysis Tools

**ESLint Rules (Required)**:

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "react-hooks/exhaustive-deps": "error",
    "react-hooks/rules-of-hooks": "error",
    "import/no-cycle": "error"
  }
}
```

**TypeScript Compiler Options (Required)**:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### Runtime Detection

**Validation Libraries**:

- **Zod**: Runtime schema validation with TypeScript inference
- **io-ts**: Runtime type checking with functional programming style
- **class-validator**: Decorator-based validation for classes
- **Yup**: Schema validation for forms and data structures

**Example with Zod**:

```typescript
import { z } from "zod";

const donationSchema = z.object({
  id: z.string().regex(/^DON-\d{10}$/),
  amount: z.number().positive().max(1000000),
  currency: z.enum(["SAR", "USD", "EUR"]),
  category: z.enum(["zakat", "sadaqah", "waqf"]),
});

type Donation = z.infer<typeof donationSchema>;

function processDonation(data: unknown): void {
  // Throws if invalid
  const donation = donationSchema.parse(data);

  // Now type-safe
  console.log(donation.amount);
}
```

#### Testing Detection

**Unit Tests**:

- Test edge cases (negative numbers, zero, null, undefined)
- Test error conditions (invalid input, network failures)
- Test state transitions (pending → processing → completed)
- Test concurrent operations (race conditions)

**Integration Tests**:

- Test full workflows (donation → validation → processing → confirmation)
- Test external dependencies (API calls, database operations)
- Test error recovery (retry logic, fallback mechanisms)

**Example Test**:

```typescript
import { describe, it, expect } from "vitest";

describe("Donation Processing", () => {
  it("rejects negative amounts", () => {
    expect(() => createDonation({ amount: -100, currency: "SAR" })).toThrow("Amount cannot be negative");
  });

  it("rejects zero amounts", () => {
    expect(() => createDonation({ amount: 0, currency: "SAR" })).toThrow("Amount must be positive");
  });

  it("rejects invalid currency", () => {
    expect(() => createDonation({ amount: 1000, currency: "INVALID" })).toThrow("Invalid currency");
  });

  it("processes valid donation", async () => {
    const donation = createDonation({ amount: 1000, currency: "SAR" });
    await processDonation(donation);
    expect(donation.status).toBe("completed");
  });
});
```

### Prevention Strategies

#### Code Review Checklist

**Type Safety**:

- [ ] No `any` types (exceptions documented)
- [ ] No double assertions (`as unknown as`)
- [ ] External data validated with Zod/io-ts
- [ ] Branded types used for IDs
- [ ] Value objects used for Money, Nisab, etc.

**Async/Promises**:

- [ ] All Promises have `.catch()` or `try/catch`
- [ ] No unhandled rejections
- [ ] Cleanup functions in all `useEffect` hooks
- [ ] No race conditions in concurrent operations
- [ ] AbortController used for cancellable fetches

**React/Components**:

- [ ] No prop drilling (use Context API)
- [ ] Correct dependency arrays in `useEffect`
- [ ] No direct state mutation
- [ ] Keys used correctly in lists
- [ ] Error boundaries for error handling

**Module Organization**:

- [ ] No circular dependencies
- [ ] No side effects at module level
- [ ] Explicit imports (not barrel imports for everything)
- [ ] Clear separation of concerns

**Domain Modeling**:

- [ ] Rich domain models (behavior + data)
- [ ] Value objects for domain concepts
- [ ] Validation in constructors
- [ ] Immutable data structures
- [ ] Clear state transition rules

#### Architecture Patterns

**Use Result Pattern for Error Handling**:

```typescript
import { Result, ok, err } from "neverthrow";

async function processDonation(data: unknown): Promise<Result<Donation, Error>> {
  const validationResult = donationSchema.safeParse(data);

  if (!validationResult.success) {
    return err(new Error("Validation failed"));
  }

  try {
    const donation = await saveDonation(validationResult.data);
    return ok(donation);
  } catch (error) {
    return err(error as Error);
  }
}

// Caller handles Result
const result = await processDonation(data);

if (result.isOk()) {
  console.log("Success:", result.value);
} else {
  console.error("Error:", result.error);
}
```

**Use Builder Pattern for Complex Objects**:

```typescript
class DonationBuilder {
  private donation: Partial<Donation> = {};

  withId(id: string): this {
    this.donation.id = id;
    return this;
  }

  withAmount(amount: number, currency: string): this {
    this.donation.amount = Money.create(amount, currency);
    return this;
  }

  withCategory(category: DonationCategory): this {
    this.donation.category = category;
    return this;
  }

  build(): Donation {
    if (!this.donation.id || !this.donation.amount || !this.donation.category) {
      throw new Error("Missing required fields");
    }

    return this.donation as Donation;
  }
}

// Usage
const donation = new DonationBuilder().withId("DON-0000000001").withAmount(1000, "SAR").withCategory("zakat").build();
```

**Use Factory Functions for Complex Construction**:

```typescript
function createDonation(params: {
  donorId: string;
  amount: number;
  currency: string;
  category: DonationCategory;
}): Result<Donation, Error> {
  // Validation
  if (params.amount <= 0) {
    return err(new Error("Amount must be positive"));
  }

  if (!params.donorId.match(/^DNR-\d{10}$/)) {
    return err(new Error("Invalid donor ID format"));
  }

  // Construction
  const donation: Donation = {
    id: generateDonationId(),
    donorId: params.donorId,
    amount: Money.create(params.amount, params.currency),
    category: params.category,
    status: "pending",
    createdAt: new Date(),
  };

  return ok(donation);
}
```

### Training and Culture

**Knowledge Sharing**:

- Regular code reviews focusing on anti-patterns
- Brown bag sessions on TypeScript best practices
- Pair programming to transfer knowledge
- Documentation of common mistakes and fixes

**Onboarding**:

- New developers review this anti-patterns guide
- Assign mentor for first few pull requests
- Provide examples of good and bad code
- Run static analysis tools during onboarding

**Continuous Improvement**:

- Track anti-patterns found in code reviews
- Update ESLint rules based on recurring issues
- Add new anti-patterns to this guide as discovered
- Refactor legacy code to fix known anti-patterns

## Related Documentation

- **[TypeScript Best Practices](best-practices.md)** - Recommended patterns
- **[TypeScript Type Safety](type-safety.md)** - Type patterns
- **[TypeScript Error Handling](error-handling.md)** - Error patterns

---

**TypeScript Version**: 5.0+ (baseline), 5.4+ (milestone), 5.6+ (stable), 5.9.3+ (latest stable)
**Maintainers**: OSE Documentation Team
