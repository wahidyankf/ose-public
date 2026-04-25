---
title: Next.js Functional Programming
description: Comprehensive guide to functional programming in Next.js with immutability, pure functions, composition, and FP patterns for React Server Components
category: explanation
subcategory: platform-web
tags:
  - nextjs
  - functional-programming
  - immutability
  - pure-functions
  - composition
  - fp
principles:
  - simplicity-over-complexity
  - explicit-over-implicit
created: 2026-01-26
---

# Next.js Functional Programming

Functional Programming (FP) emphasizes immutability, pure functions, and composition. This guide covers FP principles and patterns for Next.js applications including immutable data structures, higher-order functions, function composition, and FP with React Server Components.

## 📋 Quick Reference

- [FP Principles](#-fp-principles) - Core functional programming concepts
- [Immutability](#-immutability) - Immutable data patterns
- [Pure Functions](#-pure-functions) - Side-effect-free functions
- [Function Composition](#-function-composition) - Combining functions
- [Higher-Order Functions](#-higher-order-functions) - Functions as values
- [Declarative Patterns](#-declarative-patterns) - Declarative vs imperative
- [Error Handling](#-error-handling) - FP error patterns
- [Async FP](#-async-fp) - Functional async patterns
- [React Server Components](#-react-server-components) - FP with RSC
- [State Management](#-state-management) - Functional state patterns
- [OSE Platform Examples](#-ose-platform-examples) - Islamic finance FP patterns
- [Best Practices](#-best-practices) - Production FP guidelines
- [Related Documentation](#-related-documentation) - Cross-references

## 📚 FP Principles

Core principles of functional programming.

### Immutability

Data cannot be modified after creation. Instead, create new data with changes.

```typescript
// BAD - Mutation
const user = { name: "John", age: 30 };
user.age = 31; // Mutates original object

// GOOD - Immutability
const user = { name: "John", age: 30 };
const updatedUser = { ...user, age: 31 }; // New object
```

### Pure Functions

Functions that always return the same output for the same input without side effects.

```typescript
// PURE - No side effects, predictable
function calculateZakat(wealth: number, nisab: number): number {
  if (wealth < nisab) return 0;
  return wealth * 0.025;
}

// IMPURE - Side effects (console.log, database access)
function calculateZakatImpure(wealth: number, nisab: number): number {
  console.log("Calculating zakat"); // Side effect
  db.log.create({ wealth, nisab }); // Side effect
  return wealth * 0.025;
}
```

### First-Class Functions

Functions are values that can be passed as arguments, returned from functions, and assigned to variables.

```typescript
// Functions as values
const add = (a: number, b: number) => a + b;
const multiply = (a: number, b: number) => a * b;

// Functions as arguments
function applyOperation(a: number, b: number, operation: (x: number, y: number) => number): number {
  return operation(a, b);
}

applyOperation(5, 3, add); // 8
applyOperation(5, 3, multiply); // 15
```

### Composition

Combining simple functions to build complex functionality.

```typescript
const add5 = (x: number) => x + 5;
const multiply2 = (x: number) => x * 2;

// Composition
const add5ThenMultiply2 = (x: number) => multiply2(add5(x));

add5ThenMultiply2(10); // (10 + 5) * 2 = 30
```

## 🔒 Immutability

Immutable data structures prevent unintended mutations.

### Immutable Objects

```typescript
// Shallow copy with spread
interface User {
  id: string;
  name: string;
  age: number;
}

const user: User = { id: "1", name: "John", age: 30 };

// Update single property
const updatedUser = { ...user, age: 31 };

// Update multiple properties
const fullyUpdatedUser = { ...user, name: "Jane", age: 25 };
```

### Immutable Arrays

```typescript
const numbers = [1, 2, 3, 4, 5];

// Add element (immutable)
const withSix = [...numbers, 6]; // [1, 2, 3, 4, 5, 6]

// Remove element (immutable)
const withoutThree = numbers.filter((n) => n !== 3); // [1, 2, 4, 5]

// Update element (immutable)
const doubledThird = numbers.map((n, i) => (i === 2 ? n * 2 : n)); // [1, 2, 6, 4, 5]

// Insert at index (immutable)
const insertedAtTwo = [...numbers.slice(0, 2), 99, ...numbers.slice(2)];
// [1, 2, 99, 3, 4, 5]
```

### Deep Immutability

```typescript
interface ZakatCalculation {
  id: string;
  userId: string;
  assets: Array<{
    id: string;
    type: string;
    value: number;
  }>;
  calculatedAmount: number;
}

const calculation: ZakatCalculation = {
  id: "1",
  userId: "user1",
  assets: [
    { id: "a1", type: "CASH", value: 10000 },
    { id: "a2", type: "GOLD", value: 5000 },
  ],
  calculatedAmount: 375,
};

// Update nested property immutably
const updatedCalculation: ZakatCalculation = {
  ...calculation,
  assets: calculation.assets.map((asset) => (asset.id === "a1" ? { ...asset, value: 12000 } : asset)),
  calculatedAmount: 425,
};
```

### Immutability with TypeScript

```typescript
// Make properties readonly
interface ReadonlyUser {
  readonly id: string;
  readonly name: string;
  readonly age: number;
}

const user: ReadonlyUser = { id: "1", name: "John", age: 30 };
// user.age = 31; // Error: Cannot assign to 'age' because it is a read-only property

// Readonly arrays
const numbers: readonly number[] = [1, 2, 3];
// numbers.push(4); // Error: Property 'push' does not exist on type 'readonly number[]'

// Readonly utility type
interface MutableUser {
  id: string;
  name: string;
  age: number;
}

const immutableUser: Readonly<MutableUser> = { id: "1", name: "John", age: 30 };
// immutableUser.age = 31; // Error: Cannot assign to 'age' because it is a read-only property
```

## ✨ Pure Functions

Functions without side effects for predictable behavior.

### Identifying Pure vs Impure

```typescript
// PURE: Deterministic, no side effects
function calculateZakat(wealth: number, nisab: number): number {
  if (wealth < nisab) return 0;
  return wealth * 0.025;
}

// IMPURE: Side effects (console.log)
function calculateZakatWithLog(wealth: number, nisab: number): number {
  console.log(`Calculating zakat for wealth: ${wealth}`);
  return wealth < nisab ? 0 : wealth * 0.025;
}

// IMPURE: Depends on external state
let zakatRate = 0.025;
function calculateZakatImpure(wealth: number, nisab: number): number {
  return wealth < nisab ? 0 : wealth * zakatRate;
}

// PURE: All dependencies passed as arguments
function calculateZakatPure(wealth: number, nisab: number, rate: number): number {
  return wealth < nisab ? 0 : wealth * rate;
}
```

### Benefits of Pure Functions

```typescript
// Easy to test
describe("calculateZakat", () => {
  it("returns 0 when wealth below nisab", () => {
    expect(calculateZakat(4000, 5000)).toBe(0);
  });

  it("calculates 2.5% when wealth above nisab", () => {
    expect(calculateZakat(10000, 5000)).toBe(250);
  });
});

// Easy to reason about
const result1 = calculateZakat(10000, 5000); // Always 250
const result2 = calculateZakat(10000, 5000); // Always 250

// Can be memoized
const memoizedCalculateZakat = memoize(calculateZakat);
```

### Functional Core, Imperative Shell

Separate pure business logic from side effects.

```typescript
// FUNCTIONAL CORE: Pure business logic
function calculateMurabahaTerms(purchasePrice: number, profitMargin: number, installmentPeriod: number) {
  const profitAmount = purchasePrice * (profitMargin / 100);
  const sellingPrice = purchasePrice + profitAmount;
  const monthlyPayment = sellingPrice / installmentPeriod;

  return {
    sellingPrice,
    profitAmount,
    monthlyPayment,
    totalCost: sellingPrice,
  };
}

// IMPERATIVE SHELL: Side effects at boundaries
async function createMurabahaContract(
  clientId: string,
  productName: string,
  purchasePrice: number,
  profitMargin: number,
  installmentPeriod: number,
) {
  // Pure calculation
  const terms = calculateMurabahaTerms(purchasePrice, profitMargin, installmentPeriod);

  // Side effects
  const contract = await db.murabahaContract.create({
    data: {
      clientId,
      productName,
      purchasePrice,
      profitMargin,
      ...terms,
    },
  });

  await sendNotification(clientId, "Contract created");

  return contract;
}
```

## 🔗 Function Composition

Building complex functionality from simple functions.

### Basic Composition

```typescript
// Compose two functions
function compose<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C {
  return (a) => f(g(a));
}

// Usage
const add5 = (x: number) => x + 5;
const multiply2 = (x: number) => x * 2;

const add5ThenMultiply2 = compose(multiply2, add5);

add5ThenMultiply2(10); // (10 + 5) * 2 = 30
```

### Pipe Function

```typescript
// Pipe functions left-to-right (more readable)
function pipe<A, B, C>(f: (a: A) => B, g: (b: B) => C): (a: A) => C {
  return (a) => g(f(a));
}

// Multiple function pipe
function pipeN<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg) => fns.reduce((result, fn) => fn(result), arg);
}

// Usage
const add5 = (x: number) => x + 5;
const multiply2 = (x: number) => x * 2;
const subtract3 = (x: number) => x - 3;

const transform = pipeN(add5, multiply2, subtract3);

transform(10); // ((10 + 5) * 2) - 3 = 27
```

### Real-World Composition

```typescript
// Zakat calculation pipeline
interface Asset {
  type: string;
  value: number;
  marketValue?: number;
}

const getEffectiveValue = (asset: Asset) => asset.marketValue ?? asset.value;

const sumAssetValues = (assets: Asset[]) => assets.map(getEffectiveValue).reduce((sum, value) => sum + value, 0);

const subtractLiabilities = (liabilities: number) => (totalAssets: number) => totalAssets - liabilities;

const checkEligibility = (nisab: number) => (netWealth: number) => ({
  netWealth,
  eligible: netWealth >= nisab,
});

const calculateZakatAmount = (result: { netWealth: number; eligible: boolean }) => ({
  ...result,
  zakatAmount: result.eligible ? result.netWealth * 0.025 : 0,
});

// Compose the pipeline
function calculateZakatPipeline(assets: Asset[], liabilities: number, nisab: number) {
  return pipeN(sumAssetValues, subtractLiabilities(liabilities), checkEligibility(nisab), calculateZakatAmount)(assets);
}
```

## 🎯 Higher-Order Functions

Functions that take or return other functions.

### Map, Filter, Reduce

```typescript
const numbers = [1, 2, 3, 4, 5];

// Map: Transform each element
const doubled = numbers.map((n) => n * 2); // [2, 4, 6, 8, 10]

// Filter: Select elements
const evens = numbers.filter((n) => n % 2 === 0); // [2, 4]

// Reduce: Accumulate to single value
const sum = numbers.reduce((acc, n) => acc + n, 0); // 15

// Chaining
const result = numbers
  .filter((n) => n % 2 === 0) // [2, 4]
  .map((n) => n * 3) // [6, 12]
  .reduce((acc, n) => acc + n, 0); // 18
```

### Custom Higher-Order Functions

```typescript
// Memoization
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  }) as T;
}

// Usage
const expensiveCalculation = (n: number) => {
  console.log("Computing...");
  return n * n;
};

const memoized = memoize(expensiveCalculation);

memoized(5); // Logs "Computing...", returns 25
memoized(5); // Returns 25 (cached, no log)
```

### Currying

```typescript
// Currying: Transform multi-argument function into sequence of single-argument functions
function curry<A, B, C>(fn: (a: A, b: B) => C): (a: A) => (b: B) => C {
  return (a) => (b) => fn(a, b);
}

// Usage
const add = (a: number, b: number) => a + b;
const curriedAdd = curry(add);

const add5 = curriedAdd(5);

add5(10); // 15
add5(20); // 25

// Partial application with currying
const multiply = (a: number) => (b: number) => a * b;

const double = multiply(2);
const triple = multiply(3);

double(10); // 20
triple(10); // 30
```

## 📝 Declarative Patterns

Express _what_ to do, not _how_ to do it.

### Imperative vs Declarative

```typescript
// IMPERATIVE: How to do it
function getTotalZakatImperative(calculations: Array<{ amount: number }>) {
  let total = 0;

  for (let i = 0; i < calculations.length; i++) {
    total += calculations[i].amount;
  }

  return total;
}

// DECLARATIVE: What to do
function getTotalZakatDeclarative(calculations: Array<{ amount: number }>) {
  return calculations.reduce((sum, calc) => sum + calc.amount, 0);
}

// Even more declarative with extracted function
const sum = (nums: number[]) => nums.reduce((a, b) => a + b, 0);
const getAmounts = (calculations: Array<{ amount: number }>) => calculations.map((c) => c.amount);

const getTotalZakat = (calculations: Array<{ amount: number }>) => sum(getAmounts(calculations));
```

### Declarative Data Transformation

```typescript
interface RawCalculation {
  id: string;
  userId: string;
  wealth: number;
  nisab: number;
  createdAt: Date;
}

interface CalculationSummary {
  id: string;
  zakatAmount: number;
  eligible: boolean;
  month: string;
}

// Declarative transformation pipeline
const toSummary = (calc: RawCalculation): CalculationSummary => ({
  id: calc.id,
  zakatAmount: calc.wealth >= calc.nisab ? calc.wealth * 0.025 : 0,
  eligible: calc.wealth >= calc.nisab,
  month: calc.createdAt.toISOString().slice(0, 7),
});

const filterByYear = (year: number) => (calc: RawCalculation) => calc.createdAt.getFullYear() === year;

const sortByDate = (a: RawCalculation, b: RawCalculation) => b.createdAt.getTime() - a.createdAt.getTime();

// Usage
function getYearSummaries(calculations: RawCalculation[], year: number): CalculationSummary[] {
  return calculations.filter(filterByYear(year)).sort(sortByDate).map(toSummary);
}
```

## ❌ Error Handling

Functional error handling without exceptions.

### Result Type (Either/Result Pattern)

```typescript
// Result type for functional error handling
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// Pure function returning Result
function calculateZakatResult(wealth: number, nisab: number): Result<number, string> {
  if (wealth < 0) {
    return { success: false, error: "Wealth cannot be negative" };
  }

  if (nisab < 0) {
    return { success: false, error: "Nisab cannot be negative" };
  }

  const zakatAmount = wealth >= nisab ? wealth * 0.025 : 0;

  return { success: true, data: zakatAmount };
}

// Usage
const result = calculateZakatResult(10000, 5000);

if (result.success) {
  console.log(`Zakat: $${result.data}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

### Option/Maybe Type

```typescript
// Option type for nullable values
type Option<T> = { some: true; value: T } | { some: false };

const Some = <T>(value: T): Option<T> => ({ some: true, value });
const None = <T>(): Option<T> => ({ some: false });

// Helper functions
const isSome = <T>(option: Option<T>): option is { some: true; value: T } => option.some;

const map = <T, U>(option: Option<T>, fn: (value: T) => U): Option<U> => {
  if (isSome(option)) {
    return Some(fn(option.value));
  }

  return None();
};

const getOrElse = <T>(option: Option<T>, defaultValue: T): T => {
  if (isSome(option)) {
    return option.value;
  }

  return defaultValue;
};

// Usage
function findCalculation(id: string): Option<{ id: string; amount: number }> {
  const calculation = { id, amount: 250 }; // Simulated lookup

  if (calculation) {
    return Some(calculation);
  }

  return None();
}

const calculation = findCalculation("123");
const amount = getOrElse(
  map(calculation, (c) => c.amount),
  0,
);
```

## ⏳ Async FP

Functional patterns for asynchronous operations.

### Promise Composition

```typescript
// Compose async functions
const fetchUser = async (userId: string) => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
};

const fetchCalculations = async (userId: string) => {
  const response = await fetch(`/api/calculations?userId=${userId}`);
  return response.json();
};

const getTotalZakat = (calculations: Array<{ amount: number }>) =>
  calculations.reduce((sum, calc) => sum + calc.amount, 0);

// Compose with async
async function getUserZakatTotal(userId: string): Promise<number> {
  const calculations = await fetchCalculations(userId);
  return getTotalZakat(calculations);
}
```

### Async Result Pattern

```typescript
type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

async function calculateZakatAsync(userId: string): AsyncResult<number, string> {
  try {
    const response = await fetch(`/api/wealth/${userId}`);

    if (!response.ok) {
      return { success: false, error: "Failed to fetch wealth data" };
    }

    const { wealth, nisab } = await response.json();

    return calculateZakatResult(wealth, nisab);
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}

// Usage
const result = await calculateZakatAsync("user123");

if (result.success) {
  console.log(`Zakat: $${result.data}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

## ⚛️ React Server Components

Functional patterns with RSC.

### Pure Server Components

```typescript
// Pure Server Component
interface ZakatDashboardProps {
  userId: string;
}

async function ZakatDashboard({ userId }: ZakatDashboardProps) {
  const calculations = await getCalculations(userId);
  const totalZakat = getTotalZakat(calculations);

  return (
    <div>
      <h1>Zakat Dashboard</h1>
      <p>Total Zakat: ${totalZakat}</p>
      <CalculationList calculations={calculations} />
    </div>
  );
}

// Pure data fetching
async function getCalculations(userId: string) {
  const calculations = await db.zakatCalculation.findMany({
    where: { userId },
  });

  return calculations;
}

// Pure calculation
function getTotalZakat(calculations: Array<{ amount: number }>) {
  return calculations.reduce((sum, calc) => sum + calc.amount, 0);
}
```

### Functional Data Transformation

```typescript
// Transform data functionally before rendering
interface Calculation {
  id: string;
  wealth: number;
  nisab: number;
  createdAt: Date;
}

interface CalculationViewModel {
  id: string;
  zakatAmount: number;
  status: 'eligible' | 'not-eligible';
  date: string;
}

const toViewModel = (calc: Calculation): CalculationViewModel => ({
  id: calc.id,
  zakatAmount: calc.wealth >= calc.nisab ? calc.wealth * 0.025 : 0,
  status: calc.wealth >= calc.nisab ? 'eligible' : 'not-eligible',
  date: calc.createdAt.toLocaleDateString(),
});

async function CalculationList({ userId }: { userId: string }) {
  const calculations = await getCalculations(userId);
  const viewModels = calculations.map(toViewModel);

  return (
    <ul>
      {viewModels.map((vm) => (
        <li key={vm.id}>
          {vm.date}: ${vm.zakatAmount} ({vm.status})
        </li>
      ))}
    </ul>
  );
}
```

## 🏪 State Management

Functional state management patterns.

### Immutable State Updates

```typescript
'use client';

import { useState } from 'react';

interface Asset {
  id: string;
  type: string;
  value: number;
}

export function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>([]);

  // Add asset immutably
  const addAsset = (asset: Asset) => {
    setAssets((prev) => [...prev, asset]);
  };

  // Update asset immutably
  const updateAsset = (id: string, value: number) => {
    setAssets((prev) =>
      prev.map((asset) => (asset.id === id ? { ...asset, value } : asset))
    );
  };

  // Remove asset immutably
  const removeAsset = (id: string) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
  };

  return <div>{/* Render assets */}</div>;
}
```

### Reducer Pattern

```typescript
'use client';

import { useReducer } from 'react';

interface Asset {
  id: string;
  type: string;
  value: number;
}

type Action =
  | { type: 'ADD_ASSET'; payload: Asset }
  | { type: 'UPDATE_ASSET'; payload: { id: string; value: number } }
  | { type: 'REMOVE_ASSET'; payload: string }
  | { type: 'RESET' };

interface State {
  assets: Asset[];
}

// Pure reducer function
function assetsReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_ASSET':
      return { assets: [...state.assets, action.payload] };

    case 'UPDATE_ASSET':
      return {
        assets: state.assets.map((asset) =>
          asset.id === action.payload.id
            ? { ...asset, value: action.payload.value }
            : asset
        ),
      };

    case 'REMOVE_ASSET':
      return {
        assets: state.assets.filter((asset) => asset.id !== action.payload),
      };

    case 'RESET':
      return { assets: [] };

    default:
      return state;
  }
}

export function AssetManagerWithReducer() {
  const [state, dispatch] = useReducer(assetsReducer, { assets: [] });

  return (
    <div>
      <button onClick={() => dispatch({ type: 'RESET' })}>Reset</button>
      {/* Render assets */}
    </div>
  );
}
```

## 🕌 OSE Platform Examples

Functional programming for Islamic finance features.

### Zakat Calculation Pipeline

```typescript
// Pure functions for zakat calculation
interface Asset {
  type: string;
  value: number;
  marketValue?: number;
}

interface ZakatResult {
  totalAssets: number;
  liabilities: number;
  netWealth: number;
  nisabThreshold: number;
  eligible: boolean;
  zakatAmount: number;
}

// Individual pure functions
const getEffectiveValue = (asset: Asset) => asset.marketValue ?? asset.value;

const sumValues = (values: number[]) => values.reduce((sum, v) => sum + v, 0);

const calculateNetWealth = (totalAssets: number, liabilities: number) => totalAssets - liabilities;

const checkEligibility = (netWealth: number, nisab: number) => netWealth >= nisab;

const calculateZakatAmount = (netWealth: number, eligible: boolean) => (eligible ? netWealth * 0.025 : 0);

// Compose into calculation pipeline
function calculateZakat(assets: Asset[], liabilities: number, nisabThreshold: number): ZakatResult {
  const totalAssets = sumValues(assets.map(getEffectiveValue));
  const netWealth = calculateNetWealth(totalAssets, liabilities);
  const eligible = checkEligibility(netWealth, nisabThreshold);
  const zakatAmount = calculateZakatAmount(netWealth, eligible);

  return {
    totalAssets,
    liabilities,
    netWealth,
    nisabThreshold,
    eligible,
    zakatAmount,
  };
}
```

### Murabaha Contract Calculation

```typescript
// Pure Murabaha calculation functions
interface MurabahaTerms {
  purchasePrice: number;
  profitMargin: number;
  installmentPeriod: number;
}

interface MurabahaCalculation {
  purchasePrice: number;
  profitAmount: number;
  sellingPrice: number;
  monthlyPayment: number;
  totalCost: number;
}

const calculateProfit = (price: number, margin: number) => price * (margin / 100);

const calculateSellingPrice = (price: number, profit: number) => price + profit;

const calculateMonthlyPayment = (total: number, months: number) => total / months;

// Compose calculation
function calculateMurabahaTerms(terms: MurabahaTerms): MurabahaCalculation {
  const { purchasePrice, profitMargin, installmentPeriod } = terms;

  const profitAmount = calculateProfit(purchasePrice, profitMargin);
  const sellingPrice = calculateSellingPrice(purchasePrice, profitAmount);
  const monthlyPayment = calculateMonthlyPayment(sellingPrice, installmentPeriod);

  return {
    purchasePrice,
    profitAmount,
    sellingPrice,
    monthlyPayment,
    totalCost: sellingPrice,
  };
}
```

## 📚 Best Practices

### 1. Prefer Pure Functions

```typescript
// GOOD - Pure function
function calculateTotal(items: Array<{ price: number }>) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// BAD - Impure function
let total = 0;
function addToTotal(item: { price: number }) {
  total += item.price; // Mutates external state
}
```

### 2. Use Immutability

```typescript
// GOOD - Immutable update
const updatedUser = { ...user, age: user.age + 1 };

// BAD - Mutation
user.age++;
```

### 3. Compose Small Functions

```typescript
// GOOD - Composable
const add5 = (x: number) => x + 5;
const multiply2 = (x: number) => x * 2;
const transform = pipe(add5, multiply2);

// BAD - Monolithic
const transformBad = (x: number) => (x + 5) * 2;
```

### 4. Avoid Side Effects in Core Logic

```typescript
// GOOD - Pure core, side effects at edges
function calculateZakat(wealth: number, nisab: number): number {
  return wealth >= nisab ? wealth * 0.025 : 0;
}

async function saveZakatCalculation(userId: string, wealth: number) {
  const zakatAmount = calculateZakat(wealth, 5000);
  await db.calculation.create({ userId, zakatAmount }); // Side effect at edge
}

// BAD - Side effects in core logic
function calculateZakatBad(wealth: number, nisab: number): number {
  const result = wealth >= nisab ? wealth * 0.025 : 0;
  db.log.create({ wealth, result }); // Side effect in pure logic
  return result;
}
```

## 🔗 Related Documentation

- [Next.js README](./README.md) - Next.js overview
- [Next.js TypeScript](typescript.md) - Type-safe FP
- [Next.js Testing](testing.md) - Testing pure functions

---

**Next Steps:**

- Explore [Next.js TypeScript](typescript.md) for type-safe functional code
- Review [Next.js Domain-Driven Design](domain-driven-design.md) for FP with DDD
- Check [Next.js Testing](testing.md) for testing pure functions
