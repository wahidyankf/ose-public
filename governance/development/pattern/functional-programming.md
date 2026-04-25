---
title: Functional Programming Practices
description: Guidelines for applying functional programming principles in TypeScript/JavaScript
category: explanation
subcategory: development
tags:
  - development
  - functional-programming
  - immutability
  - pure-functions
  - typescript
created: 2025-12-28
---

# Functional Programming Practices

Guidelines for applying functional programming principles in TypeScript/JavaScript code. This practice defines HOW to write functional code that implements the principles of immutability and pure functions.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Immutability Over Mutability](../../principles/software-engineering/immutability.md)**: All data transformations create new values instead of modifying existing ones. Use `const`, spread operators, and immutable array methods to prevent state mutations.

- **[Pure Functions Over Side Effects](../../principles/software-engineering/pure-functions.md)**: Business logic implemented as pure, deterministic functions. Side effects (I/O, logging, state changes) isolated at system boundaries using Functional Core, Imperative Shell pattern.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: All function dependencies passed as explicit arguments. No hidden dependencies on global state or implicit context.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Functional programming simplifies reasoning by eliminating mutable state and side effects. Prefer composition of simple pure functions over complex class hierarchies.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Code Quality Convention](../quality/code.md)**: Prettier formats functional code consistently. ESLint can enforce functional patterns (prefer-const, no-mutation rules).

- **[Implementation Workflow](../workflow/implementation.md)**: Functional patterns introduced in "Make it Right" stage after functionality works. Start simple, refactor to functional style, then optimize if needed.

## Overview

Functional programming in TypeScript/JavaScript emphasizes:

- **Immutable data**: Prefer `const`, spread operators, and immutable methods
- **Pure functions**: Deterministic functions without side effects
- **Function composition**: Build complex behavior from simple functions
- **Functional Core, Imperative Shell**: Pure logic in core, side effects at boundaries

This approach makes code more predictable, testable, and maintainable - especially important for Shariah-compliant business logic that must be verifiable and auditable.

## Immutability Patterns

### Use const by Default

**Prefer const over let, never use var**:

```typescript
// PASS: Prefer const
const user = { name: "Ahmad", balance: 1000 };

// Use let only when reassignment necessary
let counter = 0;
counter += 1;

// FAIL: Never use var
var oldStyle = "bad"; // Don't do this
```

### Immutable Object Updates

**Use spread operator for shallow updates**:

```typescript
// PASS: Spread operator - creates new object
const user = { name: "Ahmad", email: "old@example.com", balance: 1000 };
const updatedUser = { ...user, email: "new@example.com" };

// PASS: Nested updates with multiple spreads
const account = {
  id: "ACC001",
  holder: { name: "Ahmad", email: "ahmad@example.com" },
  balance: 1000,
};

const updatedAccount = {
  ...account,
  holder: {
    ...account.holder,
    email: "ahmad.new@example.com",
  },
};

// FAIL: Mutation - avoid
user.email = "new@example.com"; // Mutates original
```

### Immutable Array Operations

**Use immutable array methods**:

```typescript
const numbers = [1, 2, 3, 4, 5];

// PASS: Immutable operations - return new arrays
const doubled = numbers.map((n) => n * 2);
const evens = numbers.filter((n) => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);
const first3 = numbers.slice(0, 3);
const withSix = [...numbers, 6];

// FAIL: Mutable operations - avoid
numbers.push(6); // Mutates
numbers.pop(); // Mutates
numbers.splice(0, 1); // Mutates
numbers.sort(); // Mutates
```

### Using Immer for Complex Updates

**Deep nested updates with Immer**:

```typescript
import { produce } from "immer";

interface State {
  users: Array<{
    id: string;
    profile: {
      name: string;
      settings: {
        theme: string;
        notifications: boolean;
      };
    };
  }>;
}

const state: State = {
  users: [
    {
      id: "1",
      profile: {
        name: "Ahmad",
        settings: { theme: "dark", notifications: true },
      },
    },
  ],
};

// PASS: Immer - write like mutation, get immutability
const newState = produce(state, (draft) => {
  draft.users[0].profile.settings.theme = "light";
});

// Original unchanged, newState has update
```

### Object.freeze for Runtime Immutability

**Prevent mutations at runtime**:

```typescript
interface Config {
  apiUrl: string;
  timeout: number;
}

const config: Readonly<Config> = Object.freeze({
  apiUrl: "https://api.example.com",
  timeout: 5000,
});

// FAIL: Mutation fails in strict mode
config.timeout = 10000; // Error in strict mode

// PASS: Create new object instead
const updatedConfig = { ...config, timeout: 10000 };
```

## Pure Function Patterns

### Basic Pure Functions

**All inputs as arguments, no side effects**:

```typescript
// PASS: Pure - deterministic, no side effects
function calculateZakat(wealth: number, nisab: number): number {
  if (wealth < nisab) {
    return 0;
  }
  return wealth * 0.025;
}

// FAIL: Impure - depends on global, has side effect
let totalZakat = 0;
function calculateZakat(wealth: number): number {
  const zakat = wealth * 0.025;
  totalZakat += zakat; // Side effect
  return zakat;
}
```

### Pure Data Transformations

**Transform data without mutations**:

```typescript
interface Transaction {
  readonly id: string;
  readonly amount: number;
  readonly timestamp: number;
}

// PASS: Pure transformation
function addTimestamp(transaction: Omit<Transaction, "timestamp">): Transaction {
  return {
    ...transaction,
    timestamp: Date.now(),
  };
}

// PASS: Pure filtering
function filterLargeTransactions(transactions: readonly Transaction[], threshold: number): readonly Transaction[] {
  return transactions.filter((tx) => tx.amount > threshold);
}

// PASS: Pure mapping
function convertToUSD(transactions: readonly Transaction[], exchangeRate: number): readonly Transaction[] {
  return transactions.map((tx) => ({
    ...tx,
    amount: tx.amount / exchangeRate,
  }));
}
```

### Functional Core, Imperative Shell

**Separate pure logic from side effects**:

```typescript
// FUNCTIONAL CORE: Pure business logic
interface Order {
  readonly items: readonly Item[];
  readonly discount: number;
}

function calculateSubtotal(items: readonly Item[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function applyDiscount(subtotal: number, discount: number): number {
  return subtotal * (1 - discount);
}

function calculateTotal(order: Order): number {
  const subtotal = calculateSubtotal(order.items);
  return applyDiscount(subtotal, order.discount);
}

// IMPERATIVE SHELL: Side effects at boundaries
async function processOrder(order: Order): Promise<void> {
  // Pure calculation
  const total = calculateTotal(order);

  // Side effects at boundary
  await database.orders.insert({ ...order, total });
  await paymentGateway.charge(order.customerId, total);
  await emailService.sendConfirmation(order.customerEmail, total);
}
```

## Function Composition

### Pipe Pattern

**Compose functions left-to-right**:

```typescript
const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T =>
    fns.reduce((acc, fn) => fn(acc), value);

// Pure functions
const trim = (s: string) => s.trim();
const lowercase = (s: string) => s.toLowerCase();
const removeSpaces = (s: string) => s.replace(/\s+/g, "");

// Compose into pipeline
const normalize = pipe(trim, lowercase, removeSpaces);

normalize("  Hello World  "); // "helloworld"
```

### Compose Pattern

**Compose functions right-to-left**:

```typescript
const compose =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T =>
    fns.reduceRight((acc, fn) => fn(acc), value);

// Same functions as pipe example
const normalize = compose(removeSpaces, lowercase, trim);

normalize("  Hello World  "); // "helloworld"
// Executes: removeSpaces(lowercase(trim(input)))
```

### Higher-Order Functions

**Functions that return functions**:

```typescript
// Higher-order function
function multiplyBy(factor: number): (n: number) => number {
  return (n: number) => n * factor;
}

const double = multiplyBy(2);
const triple = multiplyBy(3);

double(5); // 10
triple(5); // 15

// Practical example: Discount calculator
function createDiscountCalculator(rate: number): (price: number) => number {
  return (price: number) => price * (1 - rate);
}

const apply10Percent = createDiscountCalculator(0.1);
const apply25Percent = createDiscountCalculator(0.25);

apply10Percent(100); // 90
apply25Percent(100); // 75
```

## Avoiding Common Pitfalls

### Don't Mutate Function Arguments

FAIL: **Bad**:

```typescript
function addTransaction(transactions: Transaction[], newTx: Transaction) {
  transactions.push(newTx); // Mutates input
  return transactions;
}
```

PASS: **Good**:

```typescript
function addTransaction(transactions: readonly Transaction[], newTx: Transaction): readonly Transaction[] {
  return [...transactions, newTx];
}
```

### Avoid Class-Based OOP with Mutable State

FAIL: **Bad**:

```typescript
class ShoppingCart {
  private items: Item[] = [];

  addItem(item: Item): void {
    this.items.push(item); // Mutable state
  }

  removeItem(id: string): void {
    this.items = this.items.filter((i) => i.id !== id); // Mutates
  }
}
```

PASS: **Good**:

```typescript
interface ShoppingCart {
  readonly items: readonly Item[];
}

function addItem(cart: ShoppingCart, item: Item): ShoppingCart {
  return { items: [...cart.items, item] };
}

function removeItem(cart: ShoppingCart, id: string): ShoppingCart {
  return { items: cart.items.filter((i) => i.id !== id) };
}
```

### Keep Functions Pure, Move Side Effects to Edges

FAIL: **Bad**:

```typescript
function saveUser(user: User): void {
  // Validation mixed with I/O
  if (!user.email.includes("@")) {
    throw new Error("Invalid email");
  }
  database.users.insert(user); // Side effect
}
```

PASS: **Good**:

```typescript
// Pure validation
function isValidEmail(email: string): boolean {
  return email.includes("@") && email.includes(".");
}

function validateUser(user: User): ValidationResult {
  const errors: string[] = [];
  if (!isValidEmail(user.email)) {
    errors.push("Invalid email");
  }
  return { valid: errors.length === 0, errors };
}

// Imperative shell
async function saveUser(user: User): Promise<void> {
  const validation = validateUser(user); // Pure
  if (!validation.valid) {
    throw new Error(validation.errors.join(", "));
  }
  await database.users.insert(user); // Side effect at boundary
}
```

## TypeScript-Specific Patterns

### Readonly Types

**Use TypeScript's readonly modifiers**:

```typescript
// Readonly object properties
interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

// Readonly arrays
type ReadonlyNumbers = readonly number[];

// Deep readonly with utility type
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

interface Config {
  database: {
    host: string;
    port: number;
  };
}

type FrozenConfig = DeepReadonly<Config>;
```

### Branded Types for Type Safety

**Create distinct types even with same underlying type**:

```typescript
// Branded types
type SAR = number & { readonly __brand: "SAR" };
type USD = number & { readonly __brand: "USD" };

function toSAR(amount: number): SAR {
  return amount as SAR;
}

function toUSD(amount: number): USD {
  return amount as USD;
}

function convertSARtoUSD(sar: SAR, rate: number): USD {
  return toUSD(sar / rate);
}

// PASS: Type-safe
const sar = toSAR(1000);
const usd = convertSARtoUSD(sar, 3.75);

// FAIL: Compile error - can't pass USD where SAR expected
// convertSARtoUSD(usd, 3.75);
```

### Discriminated Unions for State Modeling

**Model states explicitly**:

```typescript
type PaymentState =
  | { type: "pending"; orderId: string }
  | { type: "processing"; orderId: string; transactionId: string }
  | { type: "completed"; orderId: string; transactionId: string; receiptId: string }
  | { type: "failed"; orderId: string; error: string };

function getPaymentStatus(state: PaymentState): string {
  switch (state.type) {
    case "pending":
      return "Payment is pending";
    case "processing":
      return `Processing transaction ${state.transactionId}`;
    case "completed":
      return `Payment completed. Receipt: ${state.receiptId}`;
    case "failed":
      return `Payment failed: ${state.error}`;
  }
}
```

## Islamic Finance Example

**Mudharabah Profit Distribution**:

```typescript
// Types
interface Partner {
  readonly name: string;
  readonly ratio: number;
}

interface Investment {
  readonly principal: number;
  readonly returns: number;
}

interface Distribution {
  readonly partner: string;
  readonly share: number;
}

interface DistributionResult {
  readonly distributions: readonly Distribution[];
  readonly total: number;
  readonly verified: boolean;
}

// FUNCTIONAL CORE: Pure business logic

function validateRatios(partners: readonly Partner[]): boolean {
  const sum = partners.reduce((acc, p) => acc + p.ratio, 0);
  return Math.abs(sum - 1.0) < 0.0001; // Account for floating point
}

function distributeProfits(investment: Investment, partners: readonly Partner[]): readonly Distribution[] {
  return partners.map((partner) => ({
    partner: partner.name,
    share: investment.returns * partner.ratio,
  }));
}

function verifyDistribution(distributions: readonly Distribution[], expectedTotal: number): boolean {
  const actualTotal = distributions.reduce((sum, d) => sum + d.share, 0);
  return Math.abs(actualTotal - expectedTotal) < 0.01;
}

function calculateDistribution(investment: Investment, partners: readonly Partner[]): DistributionResult {
  if (!validateRatios(partners)) {
    throw new Error("Partner ratios must sum to 1.0");
  }

  const distributions = distributeProfits(investment, partners);
  const verified = verifyDistribution(distributions, investment.returns);

  return {
    distributions,
    total: investment.returns,
    verified,
  };
}

// IMPERATIVE SHELL: Side effects at boundaries

async function processMudharabahDistribution(investmentId: string, partners: readonly Partner[]): Promise<void> {
  // Load data (side effect)
  const investment = await database.investments.findById(investmentId);

  // Pure calculation
  const result = calculateDistribution(investment, partners);

  if (!result.verified) {
    throw new Error("Distribution verification failed");
  }

  // Save results (side effects)
  await database.distributions.insertMany(result.distributions);
  await auditLog.record({
    type: "mudharabah_distribution",
    investmentId,
    total: result.total,
    timestamp: Date.now(),
  });

  // Notify partners (side effect)
  for (const dist of result.distributions) {
    await notificationService.send(dist.partner, {
      message: `Your profit share: ${dist.share}`,
    });
  }
}
```

**Why functional approach matters**:

- **Testable**: Business logic tested without database/notification mocks
- **Auditable**: Pure functions make Shariah compliance verification straightforward
- **Composable**: Can combine distribution logic with other calculations
- **Predictable**: Same inputs always produce same outputs

## When to Use Classes

**Classes acceptable for**:

- Data containers without behavior (DTOs)
- Framework requirements (React components, NestJS services)
- Interface boundaries (dependency injection)

**Prefer functions for**:

- Business logic
- Data transformations
- Calculations
- Validation

```typescript
// PASS: Class as data container (acceptable)
class CreateUserDTO {
  readonly name: string;
  readonly email: string;
  readonly password: string;

  constructor(name: string, email: string, password: string) {
    this.name = name;
    this.email = email;
    this.password = password;
  }
}

// PASS: Functions for business logic (preferred)
function validateUser(dto: CreateUserDTO): ValidationResult {
  // Pure validation
}

function hashPassword(password: string): string {
  // Pure transformation
}
```

## Testing Functional Code

**Pure functions are trivial to test**:

```typescript
describe("calculateZakat", () => {
  it("calculates 2.5% for wealth above nisab", () => {
    expect(calculateZakat(10000, 5000)).toBe(250);
  });

  it("returns 0 for wealth below nisab", () => {
    expect(calculateZakat(3000, 5000)).toBe(0);
  });

  it("handles edge case at nisab threshold", () => {
    expect(calculateZakat(5000, 5000)).toBe(125);
  });

  // No mocking, no setup, just inputs and outputs
});
```

## Functional Programming Libraries

**Recommended libraries**:

- **[Immer](https://immerjs.github.io/immer/)**: Immutable updates with mutation-like syntax
- **[Ramda](https://ramdajs.com/)**: Functional programming utilities
- **[fp-ts](https://gcanti.github.io/fp-ts/)**: Typed functional programming for TypeScript
- **[ts-pattern](https://github.com/gvergnaud/ts-pattern)**: Pattern matching for TypeScript

**Use sparingly**: Don't introduce unless clear benefit. Functional patterns often possible with vanilla JavaScript/TypeScript.

## Migration Strategy

**Introducing functional patterns to existing codebase**:

1. **Start with new code**: Write new features functionally
2. **Refactor incrementally**: Convert functions to pure when touching them
3. **Core logic first**: Convert business logic before infrastructure
4. **Test coverage**: Ensure tests before refactoring
5. **Document decisions**: Note why certain code remains imperative

## Related Documentation

- [Immutability Over Mutability](../../principles/software-engineering/immutability.md) - WHY immutability matters
- [Pure Functions Over Side Effects](../../principles/software-engineering/pure-functions.md) - WHY pure functions matter
- [Implementation Workflow](../workflow/implementation.md) - WHEN to apply functional patterns
- [Code Quality Convention](../quality/code.md) - Automated enforcement

## References

**Books**:

- [Functional-Light JavaScript](https://github.com/getify/Functional-Light-JS) - Kyle Simpson
- [Professor Frisby's Mostly Adequate Guide to Functional Programming](https://mostly-adequate.gitbook.io/mostly-adequate-guide/)

**Articles**:

- [Eric Elliott on Functional Programming](https://medium.com/javascript-scene/master-the-javascript-interview-what-is-functional-programming-7f218c68b3a0)
- [Functional Core, Imperative Shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell)

**TypeScript-Specific**:

- [fp-ts Documentation](https://gcanti.github.io/fp-ts/)
- [TypeScript Handbook - Advanced Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
