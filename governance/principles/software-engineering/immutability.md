---
title: "Immutability Over Mutability"
description: Prefer immutable data structures over mutable state for safer, more predictable code
category: explanation
subcategory: principles
tags:
  - principles
  - functional-programming
  - immutability
  - data-structures
  - concurrency
created: 2025-12-28
updated: 2025-12-28
---

# Immutability Over Mutability

**Prefer immutable data structures** over mutable state. Favor creating new values instead of modifying existing ones. Immutability makes code safer, more predictable, and easier to reason about.

## Vision Supported

This principle serves the [Open Sharia Enterprise Vision](../../vision/open-sharia-enterprise.md) of democratizing Shariah-compliant enterprise by making concurrent Islamic business systems safer and more accessible.

**How this principle serves the vision:**

- **Safer Concurrent Systems**: Islamic finance often involves parallel processing (multiple transactions, concurrent calculations). Immutable data eliminates race conditions, making it safer for developers of all skill levels to build reliable concurrent systems
- **Predictable Shariah Logic**: When calculating Zakat, profit-sharing ratios, or Murabaha markups, immutable values ensure calculations produce the same result every time. No unexpected state changes can violate Shariah compliance
- **Easier Auditing**: Immutable transaction records create clear audit trails. Each state change produces a new value, making it easy to verify Shariah compliance at every step
- **Lower Barrier to Entry**: Developers don't need deep expertise in concurrent programming or state management. Immutability eliminates entire categories of bugs, making Islamic enterprise development accessible to more contributors
- **Global Collaboration**: With contributors across timezones working on shared codebases, immutable data prevents action-at-a-distance bugs where one developer's changes unexpectedly affect another's code

**Vision alignment**: Open-source thrives when code is predictable and safe to modify. Immutability democratizes parallel programming - essential for scalable Islamic enterprise systems serving global communities.

## What

**Immutability** means:

- Data cannot be changed after creation
- Modifications create new values instead of altering existing ones
- Original values remain unchanged
- State changes are explicit (new variables, new objects)
- Data flow is unidirectional and traceable

**Mutability** means:

- Data can be changed in place
- Modifications alter existing values
- Original values are lost
- State changes are implicit (same variable, different value)
- Data flow is bidirectional and harder to trace

## Why

### Benefits of Immutability

1. **Predictability**: Same input always produces same output, no hidden state changes
2. **Concurrency Safety**: No race conditions when multiple threads access immutable data
3. **Easier Debugging**: State doesn't change unexpectedly, simpler to trace bugs
4. **Time Travel**: Previous states are preserved, enabling undo/replay functionality
5. **Simpler Reasoning**: Don't need to track when/where/how data might change
6. **Caching Friendly**: Immutable values can be safely cached and reused

### Problems with Mutability

1. **Race Conditions**: Multiple threads modifying same data leads to unpredictable results
2. **Action at a Distance**: Changing data in one place affects code far away
3. **Hard to Debug**: State changes throughout execution, difficult to track down bugs
4. **Lost History**: Previous states overwritten, can't trace how we got to current state
5. **Coupling**: Code becomes tightly coupled through shared mutable state
6. **Unexpected Side Effects**: Functions may modify inputs, breaking assumptions

### When to Use Immutability

**Use immutability when**:

- PASS: Building concurrent or parallel systems
- PASS: Implementing business logic with multiple calculations
- PASS: Creating audit trails or event logs
- PASS: Handling user input or external data
- PASS: Working with complex state management

**Mutability acceptable when**:

- Performance profiling shows immutability is bottleneck (rare)
- Building performance-critical inner loops (games, video processing)
- Interfacing with mutable libraries (use at boundaries only)
- Managing large datasets where copying is prohibitive

## How It Applies

### Immutable Variables (const)

**Context**: Variable declarations in TypeScript/JavaScript.

PASS: **Immutable (Preferred)**:

```typescript
const user = { name: "Ahmad", balance: 1000 };
// user = { ... }  // FAIL: Error: Cannot reassign const

// Create new object instead of modifying
const updatedUser = { ...user, balance: 1200 };
// Original user unchanged: { name: "Ahmad", balance: 1000 }
// New value: { name: "Ahmad", balance: 1200 }
```

**Why this works**: `const` prevents reassignment. Spread operator creates new object. Original data preserved.

FAIL: **Mutable (Avoid)**:

```typescript
let user = { name: "Ahmad", balance: 1000 };
user.balance = 1200; // Mutates original object
// Original value lost, can't trace history
```

**Why this fails**: Mutable state. Previous balance lost. No audit trail of changes.

### Immutable Array Operations

**Context**: Working with arrays.

PASS: **Immutable (Preferred)**:

```typescript
const transactions = [
  { id: 1, amount: 100 },
  { id: 2, amount: 200 },
];

// Add item: Create new array
const withNewTransaction = [...transactions, { id: 3, amount: 300 }];

// Remove item: Create new array
const withoutFirst = transactions.slice(1);

// Update item: Create new array
const updated = transactions.map((tx) => (tx.id === 2 ? { ...tx, amount: 250 } : tx));

// Original unchanged
console.log(transactions); // Still [{id:1, amount:100}, {id:2, amount:200}]
```

**Why this works**: Each operation creates new array. Original preserved. Clear data lineage.

FAIL: **Mutable (Avoid)**:

```typescript
const transactions = [
  { id: 1, amount: 100 },
  { id: 2, amount: 200 },
];

transactions.push({ id: 3, amount: 300 }); // Mutates array
transactions.shift(); // Mutates array
transactions[0].amount = 250; // Mutates object in array

// Original data lost, no history
```

**Why this fails**: Array and objects mutated. History lost. Concurrent access unsafe.

### Immutable Object Updates

**Context**: Updating nested objects.

PASS: **Immutable (Preferred)**:

```typescript
interface Account {
  id: string;
  holder: { name: string; email: string };
  balance: number;
}

const account: Account = {
  id: "ACC001",
  holder: { name: "Ahmad", email: "ahmad@example.com" },
  balance: 1000,
};

// Update nested property immutably
const updatedAccount = {
  ...account,
  holder: {
    ...account.holder,
    email: "ahmad.new@example.com",
  },
};

// Original unchanged
console.log(account.holder.email); // "ahmad@example.com"
console.log(updatedAccount.holder.email); // "ahmad.new@example.com"
```

**Why this works**: Nested spread creates new objects at each level. Original preserved.

FAIL: **Mutable (Avoid)**:

```typescript
const account = {
  id: "ACC001",
  holder: { name: "Ahmad", email: "ahmad@example.com" },
  balance: 1000,
};

account.holder.email = "ahmad.new@example.com"; // Mutates nested object
// Original email lost, no audit trail
```

**Why this fails**: Mutation makes it impossible to trace what the email was before change.

### Using Immer for Complex Updates

**Context**: Deep nested structures are cumbersome with spread operators.

PASS: **Immutable with Immer (Preferred for complex structures)**:

```typescript
import { produce } from "immer";

const state = {
  users: [
    { id: 1, profile: { name: "Ahmad", settings: { theme: "dark" } } },
    { id: 2, profile: { name: "Fatima", settings: { theme: "light" } } },
  ],
};

// Immer allows "mutation" syntax but produces immutable result
const newState = produce(state, (draft) => {
  draft.users[0].profile.settings.theme = "light";
});

// Original unchanged
console.log(state.users[0].profile.settings.theme); // "dark"
console.log(newState.users[0].profile.settings.theme); // "light"
```

**Why this works**: Immer uses structural sharing. Looks like mutation but produces immutable result efficiently.

### Frozen Objects for True Immutability

**Context**: Preventing accidental mutations at runtime.

PASS: **Deeply Frozen (Maximum Safety)**:

```typescript
const transaction = Object.freeze({
  id: "TX001",
  amount: 1000,
  items: Object.freeze([Object.freeze({ name: "Item 1", price: 500 }), Object.freeze({ name: "Item 2", price: 500 })]),
});

// All mutation attempts fail in strict mode
transaction.amount = 2000; // Error in strict mode
transaction.items.push({ name: "Item 3", price: 100 }); // Error
transaction.items[0].price = 600; // Error
```

**Why this works**: `Object.freeze()` makes objects truly immutable at runtime. TypeScript enforces at compile time.

## Anti-Patterns

### Mutating Function Arguments

FAIL: **Problem**: Function modifies input data.

```typescript
// FAIL: Mutates input array
function addTransaction(transactions, newTx) {
  transactions.push(newTx); // MUTATES INPUT
  return transactions;
}

const myTransactions = [{ id: 1, amount: 100 }];
addTransaction(myTransactions, { id: 2, amount: 200 });
// myTransactions is now modified - side effect!
```

**Why it's bad**: Caller's data changed unexpectedly. Breaks assumptions. Hard to debug.

PASS: **Solution**:

```typescript
function addTransaction(transactions, newTx) {
  return [...transactions, newTx]; // Returns new array
}

const myTransactions = [{ id: 1, amount: 100 }];
const updated = addTransaction(myTransactions, { id: 2, amount: 200 });
// myTransactions unchanged, updated is new array
```

### Shared Mutable State

FAIL: **Problem**: Multiple parts of code share and mutate same object.

```typescript
// FAIL: Shared mutable state
const appState = { currentUser: null, balance: 0 };

function login(user) {
  appState.currentUser = user; // MUTATES SHARED STATE
}

function updateBalance(amount) {
  appState.balance += amount; // MUTATES SHARED STATE
}

// Different parts of app mutate appState - hard to track changes
```

**Why it's bad**: Changes happen anywhere in codebase. Difficult to trace bugs. Race conditions in concurrent code.

PASS: **Solution**:

```typescript
interface AppState {
  currentUser: User | null;
  balance: number;
}

function login(state: AppState, user: User): AppState {
  return { ...state, currentUser: user };
}

function updateBalance(state: AppState, amount: number): AppState {
  return { ...state, balance: state.balance + amount };
}

// Each function returns new state, original unchanged
```

### Hidden Mutations in Methods

FAIL: **Problem**: Class methods mutate internal state.

```typescript
// FAIL: Mutable class
class ShoppingCart {
  private items = [];

  addItem(item) {
    this.items.push(item); // MUTATES INTERNAL STATE
  }

  removeItem(itemId) {
    this.items = this.items.filter((i) => i.id !== itemId); // MUTATES
  }
}

const cart = new ShoppingCart();
cart.addItem({ id: 1, name: "Book" });
// cart state changed - no history, can't undo
```

**Why it's bad**: State changes invisible to caller. Can't track history. Concurrent access unsafe.

PASS: **Solution** (Functional approach):

```typescript
interface ShoppingCart {
  items: readonly Item[];
}

function addItem(cart: ShoppingCart, item: Item): ShoppingCart {
  return { items: [...cart.items, item] };
}

function removeItem(cart: ShoppingCart, itemId: string): ShoppingCart {
  return { items: cart.items.filter((i) => i.id !== itemId) };
}

let cart: ShoppingCart = { items: [] };
cart = addItem(cart, { id: 1, name: "Book" });
// Each operation creates new cart, history preserved
```

## PASS: Best Practices

### 1. Use const by Default

**Always start with const**:

```typescript
PASS: const user = { name: "Ahmad" };
let user = { name: "Ahmad" }; // Only if you MUST reassign
FAIL: var user = { name: "Ahmad" }; // Never use var
```

### 2. Use Immutable Array Methods

**Prefer map/filter/reduce over loops**:

```typescript
// PASS: Immutable transformations
const doubled = numbers.map((n) => n * 2);
const evens = numbers.filter((n) => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);

// FAIL: Avoid mutation in loops
const doubled = [];
for (let i = 0; i < numbers.length; i++) {
  doubled.push(numbers[i] * 2); // Creates and mutates array
}
```

### 3. Use Spread Operator for Shallow Copies

**Copy objects and arrays**:

```typescript
// PASS: Objects
const updated = { ...original, field: newValue };

// PASS: Arrays
const newArray = [...oldArray, newItem];
const merged = [...array1, ...array2];
```

### 4. Use Immer for Deep Nested Updates

**Complex state updates**:

```typescript
import { produce } from "immer";

// PASS: Complex update with Immer
const newState = produce(state, (draft) => {
  draft.users[userId].profile.settings.theme = "dark";
  draft.users[userId].lastUpdated = Date.now();
});
```

### 5. Make Immutability Explicit with Types

**Use readonly modifiers**:

```typescript
interface Transaction {
  readonly id: string;
  readonly amount: number;
  readonly timestamp: number;
}

type ReadonlyArray<T> = readonly T[];

// Compile-time enforcement of immutability
```

### 6. Return New Values from Functions

**Never mutate, always return**:

```typescript
// PASS: Pure function returning new value
function calculateZakat(wealth: number): number {
  return wealth * 0.025;
}

// PASS: Returns new object
function applyDiscount(order: Order, discount: number): Order {
  return {
    ...order,
    total: order.total * (1 - discount),
  };
}
```

## Islamic Finance Example

**Scenario**: Calculating Murabaha (cost-plus financing) profit distribution.

FAIL: **Mutable approach** (avoid):

```typescript
let contract = {
  cost: 100000,
  markup: 0,
  total: 100000,
  payments: [],
};

function applyMarkup(rate) {
  contract.markup = contract.cost * rate; // MUTATES
  contract.total = contract.cost + contract.markup; // MUTATES
}

function addPayment(amount) {
  contract.payments.push({ amount, date: Date.now() }); // MUTATES
}

applyMarkup(0.1);
addPayment(11000);
// Original contract state lost, can't audit calculation
```

PASS: **Immutable approach** (preferred):

```typescript
interface MurabahaContract {
  readonly cost: number;
  readonly markup: number;
  readonly total: number;
  readonly payments: readonly Payment[];
}

function applyMarkup(contract: MurabahaContract, rate: number): MurabahaContract {
  const markup = contract.cost * rate;
  return {
    ...contract,
    markup,
    total: contract.cost + markup,
  };
}

function addPayment(contract: MurabahaContract, payment: Payment): MurabahaContract {
  return {
    ...contract,
    payments: [...contract.payments, payment],
  };
}

// Clear audit trail
let contract: MurabahaContract = {
  cost: 100000,
  markup: 0,
  total: 100000,
  payments: [],
};
const withMarkup = applyMarkup(contract, 0.1);
const withPayment = addPayment(withMarkup, { amount: 11000, date: Date.now() });

// Each step preserved for Shariah audit
console.log("Original:", contract); // { cost: 100000, markup: 0, ... }
console.log("With markup:", withMarkup); // { cost: 100000, markup: 10000, ... }
console.log("With payment:", withPayment); // Full history
```

**Why immutability matters for Shariah compliance**:

- **Audit trail**: Each calculation step preserved for verification
- **Transparency**: Can verify markup calculation didn't violate riba (usury) rules
- **Reproducibility**: Same inputs always produce same outputs
- **Trust**: Islamic scholars can audit the entire calculation chain

## Relationship to Other Principles

- [Pure Functions Over Side Effects](./pure-functions.md) - Pure functions naturally use immutable data
- [Explicit Over Implicit](./explicit-over-implicit.md) - Immutability makes state changes explicit
- [Simplicity Over Complexity](../general/simplicity-over-complexity.md) - Immutability simplifies reasoning

## Related Conventions

- [Functional Programming Practices](../../development/pattern/functional-programming.md) - Implementation patterns for immutability
- [Code Quality Convention](../../development/quality/code.md) - Automated enforcement
- [Implementation Workflow](../../development/workflow/implementation.md) - When to introduce immutability

## References

**Functional Programming**:

- [Immutable.js](https://immutable-js.com/) - Persistent immutable data structures for JavaScript
- [Immer](https://immerjs.github.io/immer/) - Create next immutable state by mutating current one
- [fp-ts](https://gcanti.github.io/fp-ts/) - Functional programming library for TypeScript

**Immutability in Practice**:

- [Eric Elliott on Immutability](https://medium.com/javascript-scene/the-dao-of-immutability-9f91a70c88cd)
- [Redux Immutability Guide](https://redux.js.org/usage/structuring-reducers/immutable-update-patterns)
- [Clojure Rationale](https://clojure.org/about/rationale) - Language built on immutability

**Islamic Finance Context**:

- [Shariah Audit Requirements](https://www.ifsb.org/) - Islamic Financial Services Board standards
- [Transparency in Islamic Finance](https://www.aaoifi.com/) - AAOIFI governance standards

---

**Last Updated**: 2025-12-28
