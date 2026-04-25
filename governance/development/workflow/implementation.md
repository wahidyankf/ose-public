---
title: "Implementation Workflow"
description: Three-stage development workflow - make it work, make it right, make it fast
category: explanation
subcategory: development
tags:
  - development
  - workflow
  - implementation
  - optimization
  - refactoring
  - surgical-changes
  - goal-driven
  - test-driven
created: 2025-12-15
---

# Implementation Workflow

**Make it work, make it right, make it fast** - a three-stage development workflow that prioritizes functionality first, quality second, and optimization last (only when proven necessary).

## Workflow Overview

The implementation workflow follows three sequential stages:

1. **Make it work** - Get functionality working with the simplest solution
2. **Make it right** - Refactor for readability, maintainability, and clean code
3. **Make it fast** - Optimize performance ONLY if proven necessary by measurements

**Key principle**: Each stage is complete before moving to the next. Don't skip stages or combine them.

Additionally, this workflow includes two cross-cutting practices:

- **Surgical Changes** - Touch only what you must when editing existing code
- **Goal-Driven Execution** - Define success criteria, loop until verified

## Principles Implemented/Respected

This workflow respects three core principles:

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)** - Start with the simplest solution that works
- **[YAGNI (You Aren't Gonna Need It)](../../principles/general/simplicity-over-complexity.md#kiss-and-yagni-principles)** - Don't optimize prematurely
- **[Progressive Disclosure](../../principles/content/progressive-disclosure.md)** - Layer refinement gradually

## Conventions Implemented/Respected

**REQUIRED SECTION**: All development practice documents MUST include this section to ensure traceability from practices to documentation standards.

This practice implements/respects the following conventions:

- **[Code Quality Convention](../quality/code.md)**: The "make it right" stage applies code quality standards (Prettier formatting, linting) before the "make it fast" stage to ensure clean code before optimization.

- **[Content Quality Principles](../../conventions/writing/quality.md)**: Implementation workflow follows the same progressive layering philosophy - start simple (work), add structure and clarity (right), then refine performance (fast).

### Benefits of This Workflow

1. **Faster to Working Software**: Focus on functionality first gets you to a working state quickly
2. **Prevents Over-Engineering**: Avoid building unnecessary abstractions or optimizations
3. **Clearer Thinking**: Separating concerns (work vs right vs fast) reduces cognitive load
4. **Data-Driven Optimization**: Only optimize based on actual measurements, not guesses
5. **Better Code Quality**: Clean code before optimization prevents optimization of bad code

### Problems with Premature Optimization

1. **Wasted Effort**: Optimizing code that doesn't need to be fast
2. **Complex Code**: Optimized code is often harder to understand and maintain
3. **Wrong Optimizations**: Optimizing the wrong parts (not the bottleneck)
4. **Delayed Delivery**: Time spent optimizing instead of delivering features
5. **Technical Debt**: Rushing quality to add optimization creates maintainability issues

### The Famous Quote

> "Premature optimization is the root of all evil (or at least most of it) in programming."
> — Donald Knuth, "The Art of Computer Programming"

## How It Applies

### Stage 1: Make It Work

**Goal**: Get functionality working with the simplest possible solution.

**What to do**:

- Write the most straightforward code that solves the problem
- Don't worry about performance, elegance, or abstractions yet
- Focus on passing tests and meeting requirements
- Hard-code values if it helps you move faster
- Copy-paste code if it gets you to working faster

**What NOT to do**:

- FAIL: Don't create abstractions or design patterns yet
- FAIL: Don't optimize for performance
- FAIL: Don't worry about code duplication
- FAIL: Don't refactor while implementing

**Example**:

```typescript
// PASS: MAKE IT WORK - Simple, straightforward implementation
function calculateOrderTotal(items: any[]) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total = total + items[i].price * items[i].quantity;
  }
  return total;
}

// FAIL: DON'T DO THIS YET - Premature abstraction
class OrderCalculator {
  private strategy: PricingStrategy;
  constructor(strategy: PricingStrategy) {
    this.strategy = strategy;
  }
  calculate(items: OrderItem[]): Money {
    return this.strategy.computeTotal(items);
  }
}
```

**When you're done**: Functionality works, tests pass, requirements met.

### Stage 2: Make It Right

**Goal**: Refactor code for readability, maintainability, and clean code principles.

**What to do**:

- Extract repeated code into functions (Rule of Three)
- Use meaningful variable and function names
- Apply clean code principles (small functions, single responsibility)
- Add proper error handling
- Improve type safety
- Write comprehensive tests
- Add documentation where needed

**What NOT to do**:

- FAIL: Don't optimize for performance yet
- FAIL: Don't add features not in requirements
- FAIL: Don't change functionality (keep tests green)

**Example**:

```typescript
// PASS: MAKE IT RIGHT - Clean, readable, maintainable
interface OrderItem {
  price: number;
  quantity: number;
}

function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + calculateItemTotal(item), 0);
}

function calculateItemTotal(item: OrderItem): number {
  return item.price * item.quantity;
}

// Tests remain green - functionality unchanged
```

**When you're done**: Code is clean, readable, well-tested, maintainable.

### Stage 3: Make It Fast (If Needed)

**Goal**: Optimize performance ONLY if measurements show it's necessary.

**Critical requirement**: **MEASURE FIRST**. Never optimize without profiling.

**What to do**:

1. **Profile the code** - Use profiling tools to find actual bottlenecks
2. **Measure baseline** - Record current performance metrics
3. **Identify bottleneck** - Find the slowest part (often 10% of code = 90% of time)
4. **Optimize bottleneck** - Apply targeted optimizations
5. **Measure improvement** - Verify optimization actually helped
6. **Keep tests green** - Ensure functionality didn't break

**What NOT to do**:

- FAIL: Don't optimize without profiling data
- FAIL: Don't optimize everything - only bottlenecks
- FAIL: Don't sacrifice readability unless necessary
- FAIL: Don't guess which parts are slow

**Example**:

```typescript
// Stage 2: Clean code
function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + calculateItemTotal(item), 0);
}

// Stage 3: Optimize ONLY if profiling shows this is a bottleneck
// AND measurements show significant performance impact
function calculateOrderTotalOptimized(items: OrderItem[]): number {
  // Optimized version with memoization, caching, or algorithmic improvement
  // ONLY if measurements prove it's needed
  const cached = orderCache.get(items);
  if (cached) return cached;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  orderCache.set(items, total);
  return total;
}

// Document WHY optimization was needed:
// Profiling showed 80% of checkout time spent in calculateOrderTotal
// Baseline: 1000ms for 10,000 items
// After optimization: 50ms for 10,000 items (20x improvement)
```

**When you're done**: Performance meets requirements, code still clean, optimizations justified by data.

## Surgical Changes

### Principle: Touch Only What You Must

When editing existing code, practice surgical precision. Clean up only your own mess.

**Core Rules**:

1. **Don't "improve" adjacent code**
   - No fixing nearby formatting
   - No refactoring unrelated code
   - No updating comments you didn't change
   - No type annotation additions to unchanged code

2. **Don't refactor things that aren't broken**
   - If it works and isn't part of your task, leave it
   - "While I'm here" is a red flag
   - Separate refactoring from feature work

3. **Match existing style, even if you'd do it differently**
   - Use tabs if the file uses tabs
   - Follow existing naming conventions
   - Match indentation patterns
   - Consistency > your preferences

4. **Dead code handling**
   - If you notice unrelated dead code, mention it - don't delete it
   - Only remove what YOUR changes made unused
   - Don't remove pre-existing dead code unless asked

**The Test**: Every changed line should trace directly to the user's request.

### Application Examples

#### Example 1: Bug Fix in Payment Module

**FAIL - Scope creep**:

```typescript
function processPayment(amount: number, userId: string) {
-  const fee = calculateFee(amount)  // Fixed typo in function name
+  const fee = calculateFee(amount)
-  const total = amount + fee         // Reformatted this line
+  const total = amount + fee
-  // TODO: Add validation             // Removed unrelated TODO
-  const user = getUser(userId)        // Refactored to use new helper
+  const user = await getUserById(userId)
  return chargeCard(user, total)
}

// Added new helper function (scope creep)
+async function getUserById(id: string) {
+  return await db.users.findOne({ id })
+}
```

**PASS - Surgical change**:

```typescript
function processPayment(amount: number, userId: string) {
-  const fee = calculateFee(amount)  // Fixed the actual bug only
+  const fee = calculateFee(amount)
  const total = amount + fee
  // TODO: Add validation             // Left unrelated TODO
  const user = getUser(userId)        // Left existing code alone
  return chargeCard(user, total)
}
```

#### Example 2: Adding Validation

**FAIL - While I'm here syndrome**:

```typescript
function createUser(email: string, name: string) {
+  // Added validation (requested)
+  if (!email || !email.includes('@')) {
+    throw new Error('Invalid email')
+  }
-  // Create user                      // "Improved" comment
+  // Creates a new user in the database
-  const user = { email, name }        // "Improved" structure
+  const user = {
+    email: email.toLowerCase(),       // Added normalization (not asked)
+    name: name.trim(),                // Added trimming (not asked)
+    createdAt: new Date(),            // Added timestamp (not asked)
+  }
-  return db.save(user)                // Refactored to async/await
+  return await db.users.insert(user)
}
```

**PASS - Only what was asked**:

```typescript
function createUser(email: string, name: string) {
+  // Added validation (requested)
+  if (!email || !email.includes('@')) {
+    throw new Error('Invalid email')
+  }
  // Create user                       // Left existing comment
  const user = { email, name }         // Left existing structure
  return db.save(user)                 // Left existing implementation
}
```

### When YOUR Changes Create Orphans

**Do remove**:

- Imports that YOUR changes made unused
- Variables that YOUR changes made unused
- Functions that YOUR changes made unused

**Don't remove**:

- Pre-existing dead code
- Imports used elsewhere (verify with Grep)
- Code that might be used by other modules

#### Example: Import Cleanup

**PASS - Clean up your own mess**:

```typescript
-import { oldFormatter, calculateTotal } from './utils'  // Removed oldFormatter (you stopped using it)
+import { calculateTotal } from './utils'

function processOrder(items: Item[]) {
-  const formatted = oldFormatter(items)  // You removed this line
-  return calculateTotal(formatted)
+  return calculateTotal(items)          // You changed to this
}

// Note: calculateTotal is still used, so import stays
```

**FAIL - Removing unrelated dead code**:

```typescript
-import { oldFormatter, calculateTotal, unusedHelper } from './utils'
+import { calculateTotal } from './utils'

// Removed unusedHelper from import even though YOUR changes didn't affect it
// Don't do this - mention it instead
```

### Surgical Changes Checklist

Before committing:

- [ ] Every changed line traces to the user's request
- [ ] No "improvements" to adjacent code
- [ ] No refactoring of unrelated code
- [ ] Existing style matched consistently
- [ ] Only orphans created BY YOUR changes were removed
- [ ] Pre-existing errors were fixed at root cause (see [Proactive Preexisting Error Resolution](../practice/proactive-preexisting-error-resolution.md)), or if scope is too large, a follow-up plan was created in `plans/in-progress/` and execution has begun

### Relationship to Principles

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Minimal changes reduce complexity
- **[Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md)**: Explicit scope boundaries prevent scope creep
- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Clear traceability from request to change

### For AI Agents

Agents must practice surgical precision by:

1. **Scoping changes** to exactly what was requested
2. **Avoiding refactoring** unrelated code
3. **Matching existing patterns** rather than imposing preferences
4. **Fixing preexisting errors at root cause** — not ignoring them, not patching around them, not mentioning without action. See [Proactive Preexisting Error Resolution](../practice/proactive-preexisting-error-resolution.md) for scope judgment and full requirements.
5. **Cleaning up only** what their changes made unused

This practice is especially important in large codebases where unintended changes can introduce bugs or merge conflicts.

## Goal-Driven Execution

### Principle: Define Success Criteria, Loop Until Verified

Transform every task into verifiable goals with clear success criteria.

**Core Process**:

1. **Define the goal** with measurable success criteria
2. **Execute** the implementation
3. **Verify** against success criteria
4. **Loop** until verification passes

### Transforming Tasks into Verifiable Goals

**Pattern**: `[Task]` → `[Verifiable Goal with Test]`

#### Example Transformations

**Task: "Add validation"**

```
❌ Weak: "Add validation" (what counts as success?)
✅ Strong: "Write tests for invalid inputs (empty string, null, malformed), then make them pass"
```

**Task: "Fix the bug"**

```
❌ Weak: "Fix the bug" (how do you know it's fixed?)
✅ Strong: "Write a test that reproduces the bug, verify it fails, then make it pass"
```

**Task: "Refactor X"**

```
❌ Weak: "Refactor X" (how do you verify it's safe?)
✅ Strong: "Ensure all tests pass before refactoring, refactor, ensure all tests still pass"
```

**Task: "Optimize performance"**

```
❌ Weak: "Make it faster" (faster by how much?)
✅ Strong: "Measure current performance, optimize, measure again, verify ≥20% improvement"
```

### Multi-Step Task Planning

For complex tasks, state a brief plan with verification steps.

**Format**:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

#### Example: Adding Authentication

**Plan**:

```
1. Add login endpoint → verify: curl returns 200 for valid credentials, 401 for invalid
2. Add JWT generation → verify: token decodes correctly and contains user ID
3. Add auth middleware → verify: protected routes reject requests without valid token
4. Add logout endpoint → verify: invalidated tokens are rejected
```

Each step has a clear, testable verification criterion.

### Strong vs Weak Success Criteria

| Weak (requires clarification) | Strong (enables independent work)                                              |
| ----------------------------- | ------------------------------------------------------------------------------ |
| "Make it work"                | "All tests pass and API returns expected JSON"                                 |
| "Add error handling"          | "Invalid input returns 400 with error message, network errors retry 3x"        |
| "Improve UX"                  | "Form validation shows errors on blur, submit disabled until valid"            |
| "Update docs"                 | "README has install steps, example usage, and API reference"                   |
| "Deploy"                      | "Application accessible at URL, health check returns 200, logs show no errors" |

**Key difference**: Strong criteria let you verify success independently. Weak criteria require asking "Is this what you meant?"

### Verification-First Development (Test-Driven)

**Pattern**:

1. **Write the test first** (defines success)
2. **Run the test** (verify it fails)
3. **Implement** (make it pass)
4. **Run the test again** (verify it passes)
5. **Refactor** if needed (verify tests still pass)

#### Example: Adding Email Validation

**Step 1: Write the test**

```typescript
describe("validateEmail", () => {
  it("accepts valid email", () => {
    expect(validateEmail("user@example.com")).toBe(true);
  });

  it("rejects email without @", () => {
    expect(validateEmail("userexample.com")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validateEmail("")).toBe(false);
  });
});
```

**Step 2: Run test (expect failure)**

```bash
$ npm test
FAIL: validateEmail is not defined
```

**Step 3: Implement**

```typescript
function validateEmail(email: string): boolean {
  return email.includes("@") && email.length > 0;
}
```

**Step 4: Run test again (expect success)**

```bash
$ npm test
PASS: All tests passed
```

**Step 5: Refactor (if needed)**

```typescript
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Verify tests still pass
$ npm test
PASS: All tests passed
```

### Loop Until Verified

**Anti-pattern (no verification)**:

```
1. Implement feature
2. Assume it works
3. Move on
4. Bug reports later
```

**Goal-driven pattern (continuous verification)**:

```
1. Define success criteria
2. Implement
3. Verify against criteria
4. If verification fails → fix and repeat step 3
5. If verification passes → done
```

### Application Examples

#### Example 1: API Endpoint Addition

**Goal**: Add `/users/{id}` endpoint

**Success Criteria**:

- Returns 200 with user JSON for valid ID
- Returns 404 for non-existent ID
- Returns 400 for invalid ID format

**Execution**:

```bash
# Step 1: Write tests
$ cat > test/api/users.test.ts

# Step 2: Run tests (expect failures)
$ npm test
FAIL: 3 tests (endpoint not implemented)

# Step 3: Implement endpoint
$ # ... code changes ...

# Step 4: Run tests again
$ npm test
FAIL: 1 test (404 case not handling correctly)

# Step 5: Fix and verify
$ # ... fix 404 handling ...
$ npm test
PASS: All tests passed ✓

# Step 6: Manual verification
$ curl http://localhost:3000/users/123
{"id": 123, "name": "John"} ✓
```

#### Example 2: Bug Fix

**Goal**: Fix "cart total incorrect when discount applied"

**Success Criteria**:

- Test reproduces the bug (fails initially)
- Fix makes test pass
- All existing tests still pass

**Execution**:

```bash
# Step 1: Write test that reproduces bug
describe('Cart total with discount', () => {
  it('applies 10% discount correctly', () => {
    const cart = { items: [{ price: 100 }], discount: 0.1 }
    expect(calculateTotal(cart)).toBe(90) // Currently fails: returns 100
  })
})

# Step 2: Verify test fails (confirms bug exists)
$ npm test
FAIL: expected 90, got 100 ✓ (bug confirmed)

# Step 3: Fix the bug
function calculateTotal(cart) {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price, 0)
-  return subtotal
+  return subtotal * (1 - cart.discount)
}

# Step 4: Verify test passes
$ npm test
PASS: applies 10% discount correctly ✓

# Step 5: Verify no regressions
$ npm test
PASS: All 47 tests passed ✓
```

### Goal-Driven Execution Checklist

Before starting any task:

- [ ] Success criteria defined and measurable
- [ ] Verification method identified (test, manual check, measurement)
- [ ] Multi-step tasks broken into verified stages
- [ ] Each stage has clear pass/fail criteria

During execution:

- [ ] Write tests before implementation (when applicable)
- [ ] Verify at each step
- [ ] Loop until verification passes
- [ ] Don't move to next step until current step verified

### Relationship to Principles

- **[Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md)**: Clear goals prevent confusion and rework
- **[Reproducibility](../../principles/software-engineering/reproducibility.md)**: Automated tests ensure reproducible verification
- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Automated tests > manual verification

### For AI Agents

Agents must practice goal-driven execution by:

1. **Transforming tasks** into verifiable goals with clear success criteria
2. **Writing tests first** when implementing features or fixing bugs
3. **Stating brief plans** for multi-step tasks with verification steps
4. **Verifying continuously** rather than assuming success
5. **Looping until verified** rather than moving on prematurely

This practice enables agents to work more independently by having clear, objective measures of success rather than needing constant clarification on "is this right?"

## Anti-Patterns

### Premature Optimization

FAIL: **Problem**: Optimizing before making it work or right.

```typescript
// FAIL: Stage 1: DON'T DO THIS - Premature optimization
function calculateOrderTotal(items: OrderItem[]): number {
  // Trying to optimize in Stage 1 (Make It Work)
  const cache = new WeakMap();
  const memoized = items.map((item) => {
    if (cache.has(item)) return cache.get(item);
    const result = item.price * item.quantity;
    cache.set(item, result);
    return result;
  });
  return memoized.reduce((a, b) => a + b, 0);
}
```

**Why it's bad**: Code is complex before it even works. Optimization might be in wrong place.

### Skipping "Make It Right"

FAIL: **Problem**: Optimizing messy code.

```typescript
// FAIL: Skipped Stage 2 - Went from "working" to "optimized" with ugly code
function calcOrdTot(itms) {
  let t = 0,
    i = 0,
    l = itms.length;
  for (; i < l; ++i) t += itms[i].p * itms[i].q;
  return t;
}
```

**Why it's bad**: Optimized but unmaintainable. Hard to modify or debug later.

### Optimizing Everything

FAIL: **Problem**: Optimizing code that doesn't need it.

```typescript
// FAIL: Optimizing a function that runs once per page load
function getAppTitle(): string {
  // Unnecessary memoization for function called once
  if (this.cachedTitle) return this.cachedTitle;
  this.cachedTitle = "Open Sharia Enterprise";
  return this.cachedTitle;
}
```

**Why it's bad**: Wasted effort. Adds complexity with no benefit.

### Optimization Without Measurement

FAIL: **Problem**: Guessing which parts are slow.

```typescript
// FAIL: "I think this is slow" - NO PROFILING DATA
// Developer spends 2 days optimizing this function
// Profiler shows it takes 0.1% of total execution time
```

**Why it's bad**: Optimizing the wrong thing. Real bottleneck remains unoptimized.

## Best Practices

### 1. Always Start Simple

**First implementation should be the simplest**:

```typescript
// PASS: Stage 1: Simple and obvious
function isValidEmail(email: string): boolean {
  return email.includes("@") && email.includes(".");
}

// Later Stage 2: Make it right (proper validation)
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Only if Stage 3 needed: Optimize (cache regex, use faster library)
```

### 2. Write Tests Before Refactoring

**Ensure tests pass before "Make It Right"**:

```typescript
// PASS: Tests lock in behavior before refactoring
describe("calculateOrderTotal", () => {
  it("calculates total for multiple items", () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 },
    ];
    expect(calculateOrderTotal(items)).toBe(35);
  });
});

// Now safe to refactor - tests will catch breakage
```

### 3. Profile Before Optimizing

**Always measure, never guess**:

```bash
# PASS: Profile first
npm run profile

# Output shows:
# calculateOrderTotal: 850ms (85% of total time) ← THIS is the bottleneck
# formatCurrency: 50ms (5% of total time)
# Other functions: 100ms (10% of total time)

# Optimize calculateOrderTotal, not formatCurrency
```

### 4. Document Optimization Decisions

**Explain WHY optimization was needed**:

```typescript
/**
 * Optimized version of calculateOrderTotal
 *
 * Profiling data (2025-12-15):
 * - Baseline: 850ms for 10,000 items (85% of checkout time)
 * - Bottleneck: Repeated item.price * item.quantity calculations
 * - Solution: Memoize item totals
 * - Result: 45ms for 10,000 items (95% improvement)
 */
function calculateOrderTotalOptimized(items: OrderItem[]): number {
  // ... optimized implementation
}
```

### 5. Keep Optimization Localized

**Optimize the bottleneck, keep rest of code clean**:

```typescript
// PASS: Most code remains clean and readable
function processOrder(order: Order) {
  validateOrder(order); // Clean code
  applyDiscounts(order); // Clean code
  const total = calculateOrderTotalOptimized(order.items); // ONLY this optimized
  chargeCustomer(order.customer, total); // Clean code
}
```

### 6. Re-measure After Optimization

**Verify optimization actually helped**:

```typescript
// PASS: Before optimization
console.time("calculateOrderTotal");
const total = calculateOrderTotal(items);
console.timeEnd("calculateOrderTotal");
// calculateOrderTotal: 850ms

// After optimization
console.time("calculateOrderTotal");
const total = calculateOrderTotalOptimized(items);
console.timeEnd("calculateOrderTotal");
// calculateOrderTotal: 45ms ← Verified 95% improvement
```

## When to Apply

### Apply This Workflow For

**New feature development**:

```
1. Make it work: Get feature functioning
2. Make it right: Clean up code, add tests
3. Make it fast: Optimize ONLY if performance requirements not met
```

**Bug fixes**:

```
1. Make it work: Fix the bug with simplest solution
2. Make it right: Refactor to prevent similar bugs
3. Make it fast: Usually not needed for bug fixes
```

**Refactoring**:

```
1. Already works: Start at Stage 2
2. Make it right: Improve structure and readability
3. Make it fast: Only if measurements show need
```

### Exceptions to the Workflow

**Security fixes**: Priority is "make it secure" (right), not "make it work"

```typescript
// Security fix: Correctness > Speed
function sanitizeInput(input: string): string {
  // Make it RIGHT first (secure), not just working
  return DOMPurify.sanitize(input, { SAFE_FOR_TEMPLATES: true });
}
```

**Production hotfixes**: Sometimes "make it work" is enough (fix immediately, refactor later)

```typescript
// Hotfix: Stop the bleeding first
function emergencyFix() {
  // Stage 1: Make it work (deploy immediately)
  if (data === null) return []; // Quick fix

  // Stage 2: Create ticket to "make it right" later
  // TODO: Refactor data handling (Ticket #123)
}
```

**Performance-critical code**: May need optimization from start (e.g., game engines, real-time systems)

```typescript
// Real-time video processing: Performance is a requirement
function processVideoFrame(frame: Frame): ProcessedFrame {
  // Even Stage 1 must consider performance
  // But still: work → right → fast
}
```

## References

**Software Engineering Principles**:

- [The Art of Computer Programming](https://en.wikipedia.org/wiki/The_Art_of_Computer_Programming) - Donald Knuth (premature optimization quote)
- [Refactoring: Improving the Design of Existing Code](https://martinfowler.com/books/refactoring.html) - Martin Fowler
- [Clean Code](https://www.oreilly.com/library/view/clean-code-a/9780136083238/) - Robert C. Martin

**Make It Work, Make It Right, Make It Fast**:

- [Kent Beck on Twitter](https://twitter.com/kentbeck) - Original "make it work, make it right, make it fast" attribution
- [Extreme Programming Explained](https://www.oreilly.com/library/view/extreme-programming-explained/0201616416/) - Kent Beck

**Performance Optimization**:

- [High Performance Browser Networking](https://hpbn.co/) - Ilya Grigorik
- [JavaScript Performance](https://developer.mozilla.org/en-US/docs/Web/Performance) - MDN Web Docs
- [Web Performance Optimization](https://web.dev/fast/) - Google Web Fundamentals

## Related Documentation

- [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md) - Start simple principle
- [Root Cause Orientation](../../principles/general/root-cause-orientation.md) - Surgical changes implement the minimal impact practice from this principle
- [Code Quality Convention](../quality/code.md) - Automated quality checks
- [Trunk Based Development](./trunk-based-development.md) - Git workflow
- [Acceptance Criteria Convention](../infra/acceptance-criteria.md) - Defining "works" in Stage 1
- [Agent Workflow Orchestration](../agents/agent-workflow-orchestration.md) - How agents apply this workflow in multi-step task execution
