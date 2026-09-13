---
title: "Best Practices"
date: 2025-12-12T00:00:00+07:00
draft: false
description: Proven approaches and modern Java coding standards for maintainable, reliable software
weight: 10000007
tags: ["java", "best-practices", "clean-code", "solid-principles", "code-quality"]
---

## Understanding Best Practices

Best practices represent proven approaches to common programming challenges, distilled from years of collective experience. Unlike anti-patterns which demonstrate what to avoid, best practices guide you toward robust, maintainable solutions.

**Why follow best practices:**

- **Predictability**: Code behavior becomes easier to reason about
- **Maintainability**: Changes require less effort and introduce fewer bugs
- **Collaboration**: Teams share common vocabulary and expectations
- **Quality**: Fewer defects reach production environments

This guide presents Java best practices organized by category, explaining their rationale and demonstrating applications.

## Core Development Principles

### Code Clarity Over Cleverness

Write code optimizing for human comprehension rather than minimal line count. Clear code enables thorough review and reduces debugging time.

**Key insight**: Code is read far more often than written. Optimizing for readability pays dividends throughout software lifecycle.

**Comparison:**

| Approach   | Characteristics                                         | Impact                                   |
| ---------- | ------------------------------------------------------- | ---------------------------------------- |
| **Clear**  | Explicit variable names, simple logic flow              | Easy to understand, maintain, debug      |
| **Clever** | Abbreviated names, nested ternaries, complex one-liners | Saves lines but costs comprehension time |

**Before (clever but unclear):**

```java
public boolean check(Money w, Money n) {
// => Abbreviated method and parameter names
// => Method name "check" doesn't explain purpose
// => Parameters w/n cryptic - what do they represent?
    return w.compareTo(n) >= 0;
// => Logic unclear without context
// => What are we checking? Why >= 0?
}
// => Clever: short code, hard to understand
// => Saves typing but costs comprehension
```

**After (clear and explicit):**

```java
public boolean isEligibleForProcessing(Money wealth, Money threshold) {
// => Descriptive method name documents purpose
// => "isEligibleForProcessing" explains business logic
// => Parameters named after domain concepts (wealth, threshold)
    return wealth.isGreaterThanOrEqualTo(threshold);
// => Fluent API method reads like natural language
// => Business rule self-documenting: wealth >= threshold
// => No comments needed - code tells the story
}
// => Clear: explicit names, readable logic
// => Takes more space but saves understanding time
```

### Single Responsibility Principle

Each method and class should have one clearly defined purpose. This makes code easier to test, modify, and reuse.

**Recognition signals:**

- Methods exceed 20 lines
- Classes handle multiple unrelated concerns
- Method names contain "and" or "or"
- Difficulty naming methods concisely

**Before (mixed responsibilities):**

```java
public class PaymentService {
// => Class mixing calculation and persistence
// => Violates Single Responsibility Principle
    public Money processAndSave(Money amount) {
// => Method name with "And" indicates multiple responsibilities
// => Warning sign: method doing too much
        Money fee = amount.multiply(new BigDecimal("0.025"));
// => Business logic: calculate 2.5% fee
        // Database code mixed with calculation
        saveToDatabase(fee);
// => Persistence logic in same method
// => Tight coupling: can't calculate without DB
// => Hard to test: needs database for unit tests
        return fee;
// => Returns calculation result after saving
    }
}
// => Problem: two reasons to change (fee formula OR persistence)
// => Testing requires database mock
// => Can't reuse calculation logic independently
```

**After (separated concerns):**

```java
public class FeeCalculator {
// => Single responsibility: fee calculation only
// => Pure business logic, no side effects
    public Money calculateFee(Money amount) {
// => Focused method: one clear purpose
        return amount.multiply(new BigDecimal("0.025"));
// => Fee calculation logic isolated
// => Easy to test: no dependencies
// => Reusable across different contexts
    }
}
// => Benefits: testable without mocks, reusable, focused

public class PaymentRepository {
// => Single responsibility: persistence only
// => Infrastructure concern separated from business logic
    public void savePaymentRecord(PaymentRecord record) {
        // Persistence logic only
// => Database operations isolated here
// => Can swap persistence implementation without affecting calculation
// => Testable with in-memory or mock repository
    }
}
// => Benefits: separation of concerns, testability, flexibility
// => Compose these classes to achieve "processAndSave" behavior
```

### Fail Fast and Explicitly

Validate inputs early and throw meaningful exceptions. Don't let invalid data propagate through the system.

**Benefits:**

- Problems detected at source rather than far downstream
- Error messages provide actionable context
- Debugging time reduced significantly
- System state remains consistent

**Before (no validation):**

```java
public Contract createContract(Money price, String customerId) {
// => No validation: accepts any input
// => Null price crashes later in calculation logic
// => Negative price creates invalid business state
    return new Contract(price, customerId); // What if price is null or negative?
// => Problem propagates: invalid contract created
// => Debugging difficult: error far from source
// => No indication of what went wrong
}
// => Fails late: errors surface downstream
// => Debugging nightmare: root cause unclear
```

**After (early validation):**

```java
public Contract createContract(Money price, String customerId) {
// => Validation at entry point (fail fast)
    if (price == null || price.isNegative()) {
// => Guard clause: check price validity first
// => Null check prevents NullPointerException
// => isNegative() enforces business rule
        throw new IllegalArgumentException("Price must be a positive amount");
// => Explicit exception with actionable message
// => Caller knows exactly what went wrong
// => IllegalArgumentException: standard for bad input
    }
    if (customerId == null || customerId.isBlank()) {
// => Second guard clause: validate customer ID
// => isBlank() catches null, empty, whitespace-only
        throw new IllegalArgumentException("Customer ID is required");
// => Clear message: identifies missing field
// => Early detection before Contract construction
    }

    return new Contract(price, customerId);
// => Only reached with valid inputs
// => Contract constructor can trust parameters
// => No defensive code needed inside Contract
}
// => Benefits: errors detected immediately, clear messages
// => Debugging easy: stack trace points to source
// => System state remains consistent (no invalid contracts)
```

### Embrace Immutability

Prefer immutable objects, especially for value objects and domain entities. Use `final` fields and return new instances rather than modifying existing ones.

**Why immutability matters:**

- Thread-safe by default (no synchronization needed)
- Prevents accidental modification bugs
- Enables safe sharing across system components
- Simplifies reasoning about code behavior

**Before (mutable object):**

```java
public class Money {
// => Mutable value object (anti-pattern)
    private BigDecimal amount;
// => Mutable field: can be changed after construction
    private Currency currency;
// => Both fields modifiable

    public void setAmount(BigDecimal amount) {
// => Setter allows mutation
        this.amount = amount; // Dangerous mutation
// => Changes object state after creation
// => Problems: thread safety, aliasing bugs
// => Multiple references see different values
    }
}
// => Risks: race conditions, unexpected behavior
// => Thread-unsafe: needs synchronization
// => Aliasing bugs: shared references modified
```

**After (immutable object):**

```java
public final class Money {
// => final class: cannot be extended (immutability contract protected)
    private final BigDecimal amount;
// => final field: assigned once in constructor, never changes
    private final Currency currency;
// => final field: immutable after construction

    public Money(BigDecimal amount, Currency currency) {
// => Constructor: only place fields are set
        this.amount = amount;
// => Assign amount once
        this.currency = currency;
// => Assign currency once
// => No setters: fields never change after this
    }

    public Money add(Money other) {
// => Operation returns NEW Money instance
// => Doesn't modify current object
        validateSameCurrency(other);
// => Guard: validate before calculation
        return new Money(this.amount.add(other.amount), this.currency);
// => Create new Money with sum
// => Original Money unchanged
// => Functional approach: transform, don't mutate
    }

    // Getters only, no setters
// => Read-only access to fields
    public BigDecimal getAmount() {
        return amount;
// => Safe to return BigDecimal (also immutable)
    }
}
// => Benefits: thread-safe, no defensive copies needed
// => Can be safely shared across threads
// => No synchronization required
```

### Composition Over Inheritance

Use composition and delegation instead of extending classes. This provides greater flexibility and reduces coupling.

**When composition excels:**

- Behavior combinations vary independently
- Multiple inheritance would be useful (Java doesn't support)
- Avoiding fragile base class problems
- Runtime behavior changes needed

**Before (inheritance hierarchy):**

```java
public abstract class Product { }
// => Base abstract class (inheritance root)
public abstract class PricedProduct extends Product { }
// => Intermediate abstraction: all products with prices
// => Problem: rigid hierarchy (Standard/Premium must extend this)
public class StandardProduct extends PricedProduct { }
// => Concrete standard product (inherits hierarchy)
public class PremiumProduct extends PricedProduct { }
// => Concrete premium product (inherits hierarchy)
// => Issues: tight coupling, inflexible, hard to change behavior
// => What if product needs different pricing at runtime?
```

**After (composition with strategies):**

```java
public interface PricingStrategy {
// => Strategy pattern: define pricing behavior interface
    Money calculatePrice(Money basePrice);
// => Contract: all strategies implement this method
}

public class StandardPricing implements PricingStrategy {
// => Concrete strategy: standard pricing (no markup)
    public Money calculatePrice(Money basePrice) {
        return basePrice;
// => No transformation: return base price as-is
    }
}

public class PremiumPricing implements PricingStrategy {
// => Concrete strategy: premium pricing (with multiplier)
    private final BigDecimal multiplier;
// => Immutable multiplier (e.g., 1.5 for 50% markup)

    public PremiumPricing(BigDecimal multiplier) {
// => Constructor: configure strategy behavior
        this.multiplier = multiplier;
// => Set markup multiplier (1.2, 1.5, etc.)
    }

    public Money calculatePrice(Money basePrice) {
// => Apply premium pricing calculation
        return basePrice.multiply(multiplier);
// => Multiply base price by configured multiplier
// => Returns new Money (immutable)
    }
}

public class Product {
// => Product uses composition: HAS-A pricing strategy
    private final PricingStrategy pricingStrategy;
// => Composed strategy (dependency injection)
// => Can swap strategy at runtime (flexible)

    public Product(PricingStrategy pricingStrategy) {
// => Constructor injection: configure behavior
        this.pricingStrategy = pricingStrategy;
// => Accepts any PricingStrategy implementation
    }

    public Money getPrice(Money basePrice) {
// => Delegate pricing calculation to strategy
        return pricingStrategy.calculatePrice(basePrice);
// => Composition: Product doesn't know HOW to price
// => Strategy encapsulates pricing logic
    }
}
// => Benefits: flexible, testable, runtime behavior changes
// => Open/Closed: add new strategies without modifying Product
```

## Code Organization

### Keep Methods Small (10-20 Lines)

Methods should do one thing well. Aim for 10-20 lines per method. Extract helper methods when exceeding this range.

**Benefits of small methods:**

- Easier to understand at a glance
- Simpler to test in isolation
- More reusable across codebase
- Better names (focused purpose)

**Before (long method):**

```java
public Contract generate(Request request) {
// => Long method: 20+ lines doing multiple things
    if (request == null) throw new IllegalArgumentException("Request cannot be null");
// => Validation logic mixed with business logic
    if (request.getPrice().isNegativeOrZero()) throw new IllegalArgumentException("Price must be positive");
// => More validation (should be extracted)

    Money total = request.getPrice().add(request.getFee()).add(request.getTax());
// => Calculation logic (different responsibility)

    List<Payment> payments = new ArrayList<>();
// => Schedule generation logic starts here
    Money installment = total.divide(
// => Calculate per-installment amount
        BigDecimal.valueOf(request.getTermMonths()),
// => Divide total by term length
        RoundingMode.HALF_UP
// => Rounding strategy for division
    );
    LocalDate paymentDate = LocalDate.now();
// => Start date for schedule

    for (int i = 0; i < request.getTermMonths(); i++) {
// => Generate payment schedule (loop logic)
        paymentDate = paymentDate.plusMonths(1);
// => Increment date by one month
        payments.add(new Payment(installment, paymentDate));
// => Create and add payment
    }

    return new Contract(total, new Schedule(payments), request.getCustomerId());
// => Final construction (assembly logic)
}
// => Problems: hard to test, understand, modify
// => Multiple responsibilities in one method
```

**After (extracted methods):**

```java
public Contract generate(Request request) {
// => Main method: orchestrates workflow (6 lines)
// => Clear sequence of steps at high level
    validateRequest(request);
// => Step 1: Validate inputs (extracted)
    Money totalCost = calculateTotalCost(request);
// => Step 2: Calculate total (extracted)
    PaymentSchedule schedule = generatePaymentSchedule(request, totalCost);
// => Step 3: Generate schedule (extracted)

    return new Contract(totalCost, schedule, request.getCustomerId());
// => Step 4: Assemble result
}
// => Benefits: readable, testable steps, single responsibility

private void validateRequest(Request request) {
// => Extracted validation: one clear purpose
    if (request == null) {
// => Null check first
        throw new IllegalArgumentException("Request cannot be null");
    }
    if (request.getPrice().isNegativeOrZero()) {
// => Business rule validation
        throw new IllegalArgumentException("Price must be positive");
    }
}
// => Testable in isolation: unit test validation logic alone

private Money calculateTotalCost(Request request) {
// => Extracted calculation: clear name, focused logic
    return request.getPrice()
        .add(request.getFee())
// => Add fee to price
        .add(request.getTax());
// => Add tax to result
// => Fluent chaining: readable calculation
}
// => Pure function: no side effects, easy to test

private PaymentSchedule generatePaymentSchedule(Request request, Money totalCost) {
// => Extracted schedule generation: delegates to generator
    return scheduleGenerator.generate(
// => Composition: use dedicated schedule generator
        totalCost,
// => Total amount to divide into payments
        request.getTermMonths(),
// => Number of payment installments
        request.getPaymentFrequency()
// => Frequency: monthly, quarterly, etc.
    );
}
// => Delegation: schedule logic encapsulated elsewhere
// => Benefits: reusable, testable, focused methods
```

### Use Intention-Revealing Names

Choose names that clearly express purpose. Include units in variable names when appropriate.

**Naming guidelines:**

| Element   | Convention          | Example                                 |
| --------- | ------------------- | --------------------------------------- |
| Classes   | Noun or noun phrase | `PaymentCalculator`, `UserRepository`   |
| Methods   | Verb or verb phrase | `calculateTotal()`, `findUserById()`    |
| Booleans  | Question form       | `isValid()`, `hasPermission()`          |
| Constants | ALL_CAPS_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT_MS` |

**Before (unclear names):**

```java
public class Calculator {
// => Generic name: Calculator for what?
    private static final BigDecimal RATE = new BigDecimal("0.025");
// => RATE: what kind of rate? Interest? Fee? Tax?

    public Money calc(Money w, int d) {
// => Abbreviated names: w (wealth?), d (days?), calc (calculate what?)
        if (d < 365) {
// => Magic number 365: why this threshold?
            throw new IllegalArgumentException("Invalid days");
// => Vague message: why invalid? What's the rule?
        }
        return w.multiply(RATE);
// => Logic unclear: multiplying by rate for what purpose?
    }
}
// => Problems: purpose unclear, hard to understand context
```

**After (clear names):**

```java
public class AnnualFeeCalculator {
// => Specific name: clearly calculates annual fees
    private static final BigDecimal ANNUAL_FEE_RATE = new BigDecimal("0.025");
// => Explicit constant: ANNUAL_FEE_RATE (2.5% annual fee)
// => Self-documenting: reader knows this is for annual fees

    public Money calculateAnnualFee(Money balance, int daysHeld) {
// => Descriptive method name: calculateAnnualFee (clear purpose)
// => Parameters named after domain concepts: balance, daysHeld
        if (daysHeld < 365) {
// => 365 in context: days in year (still could be constant)
            throw new IllegalArgumentException(
                "Balance must be held for at least 365 days"
// => Explicit error message: explains business rule
// => User understands WHY validation failed
            );
        }
        return balance.multiply(ANNUAL_FEE_RATE);
// => Clear calculation: balance × annual fee rate
// => Self-documenting code: no comments needed
    }
}
// => Benefits: purpose clear, easy to understand and maintain
```

### Organize Code by Feature, Not Layer

Structure packages around business capabilities rather than technical layers (controllers, services, repositories).

**Benefits:**

- All related code in one location
- Easier to locate feature-specific logic
- Natural module boundaries for refactoring
- Domain concepts remain visible

**Before (layer-based structure):**

```
com.example.controllers
├── PaymentController.java
├── UserController.java
└── OrderController.java

com.example.services
├── PaymentService.java
├── UserService.java
└── OrderService.java

com.example.repositories
├── PaymentRepository.java
├── UserRepository.java
└── OrderRepository.java
```

**After (feature-based structure):**

```
com.example.payment
├── PaymentController.java
├── PaymentService.java
├── PaymentRepository.java
└── Payment.java

com.example.user
├── UserController.java
├── UserService.java
├── UserRepository.java
└── User.java

com.example.order
├── OrderController.java
├── OrderService.java
├── OrderRepository.java
└── Order.java
```

## Modern Java Features

### Use Switch Expressions (Java 14+)

Replace chains of if-else statements with switch expressions for cleaner, more maintainable code.

**Advantages:**

- Compiler enforces exhaustiveness
- Returns values directly (no mutation needed)
- Clearer intent than if-else chains
- Less repetitive code

**Before (if-else chain):**

```java
public Duration calculateDuration(Frequency frequency, int count) {
// => Calculate duration based on frequency and count
    Duration duration;
// => Mutable variable: reassigned in each branch
    if (frequency == Frequency.DAILY) {
// => First condition check
        duration = Duration.ofDays(count);
// => Daily: count days directly
    } else if (frequency == Frequency.WEEKLY) {
        duration = Duration.ofWeeks(count);
// => Weekly: count weeks
    } else if (frequency == Frequency.MONTHLY) {
        duration = Duration.ofDays(count * 30);
// => Monthly: approximate 30 days per month
    } else if (frequency == Frequency.QUARTERLY) {
        duration = Duration.ofDays(count * 90);
// => Quarterly: 90 days (3 months)
    } else if (frequency == Frequency.ANNUALLY) {
        duration = Duration.ofDays(count * 365);
// => Annually: 365 days per year
    } else {
        throw new IllegalArgumentException("Unknown frequency: " + frequency);
// => Fallback: throw exception for unknown frequency
    }
    return duration;
// => Return computed duration
}
// => Problems: verbose, mutable variable, easy to miss case
```

**After (switch expression):**

```java
public Duration calculateDuration(Frequency frequency, int count) {
// => Modern switch expression (Java 14+)
    return switch (frequency) {
// => Switch expression returns value directly (no mutation)
// => Exhaustiveness checked by compiler (all enum cases required)
        case DAILY -> Duration.ofDays(count);
// => Arrow syntax: concise, no break needed
// => Directly maps DAILY to days calculation
        case WEEKLY -> Duration.ofWeeks(count);
// => Each case is independent expression
        case MONTHLY -> Duration.ofDays(count * 30);
// => Approximate 30 days per month
        case QUARTERLY -> Duration.ofDays(count * 90);
// => 90 days for quarter (3 months)
        case ANNUALLY -> Duration.ofDays(count * 365);
// => 365 days per year
    };
// => No default needed: enum exhaustiveness enforced
// => Compiler error if new frequency added without case
}
// => Benefits: concise, safe (no forgotten cases), immutable
```

### Use Records for Simple Data Carriers (Java 14+)

Records automate boilerplate for simple data carriers (constructor, getters, equals, hashCode, toString).

**When to use records:**

- Simple data transfer objects
- Value objects (immutable by nature)
- Configuration holders
- Return types bundling multiple values

**Before (manual boilerplate):**

```java
public class Money {
// => Traditional class: manual boilerplate (40+ lines)
    private final BigDecimal amount;
// => Immutable field
    private final Currency currency;
// => Immutable field

    public Money(BigDecimal amount, Currency currency) {
// => Constructor: manual field assignment
        this.amount = amount;
        this.currency = currency;
    }

    public BigDecimal getAmount() { return amount; }
// => Getter method (boilerplate)
    public Currency getCurrency() { return currency; }
// => Another getter method

    @Override
    public boolean equals(Object o) {
// => equals() method: 8 lines of boilerplate
        if (this == o) return true;
// => Reference equality check
        if (o == null || getClass() != o.getClass()) return false;
// => Type checking
        Money money = (Money) o;
// => Cast to compare fields
        return Objects.equals(amount, money.amount) &&
               Objects.equals(currency, money.currency);
// => Field-by-field comparison
    }

    @Override
    public int hashCode() {
// => hashCode() method: boilerplate
        return Objects.hash(amount, currency);
// => Hash based on fields
    }

    @Override
    public String toString() {
// => toString() method: formatting boilerplate
        return "Money{amount=" + amount + ", currency=" + currency + "}";
// => String representation
    }
}
// => Problem: 40+ lines for simple data carrier
// => Error-prone: easy to forget updating equals/hashCode
```

**After (record):**

```java
public record Money(BigDecimal amount, Currency currency) {
// => Record declaration: replaces 40+ lines with 1 line
// => Compiler auto-generates constructor, getters, equals, hashCode, toString
// => Immutable by default: all fields final
// => Accessor methods: amount(), currency() (not getAmount())

    // Can add custom validation
    public Money {
// => Compact constructor: no parameter list (auto-provided)
// => Runs before field initialization
        if (amount == null) {
// => Validation: check amount not null
            throw new IllegalArgumentException("Amount cannot be null");
// => Fail fast: validation at construction time
        }
        if (currency == null) {
// => Validation: check currency not null
            throw new IllegalArgumentException("Currency cannot be null");
        }
    }
// => Fields automatically assigned after validation passes
}
// => Benefits: 12 lines vs 40+, less error-prone, immutable
// => Compiler maintains equals/hashCode consistency
```

### Use Optional for Potentially Absent Values

Use `Optional<T>` instead of returning null to make absence explicit and prevent NullPointerException.

**Benefits:**

- Explicit in method signature (caller knows to check)
- Compiler enforces handling of absence
- Functional operations (map, filter, orElse)
- Self-documenting code

**Before (null return):**

```java
public User findUserById(String userId) {
// => Method may or may not find user
    // May return null
// => Return type doesn't indicate possibility of absence
    return database.query(userId);
// => Database query might return null
// => Caller must know to check (not enforced)
}

// Caller must remember to check
// => Easy to forget null check (runtime NPE risk)
User user = service.findUserById("123");
// => Might be null, but type doesn't indicate this
if (user != null) {
// => Manual null check required
// => Easily forgotten (no compiler help)
    processUser(user);
// => Only process if not null
}
// => Problem: absence not explicit, easy to forget check
```

**After (Optional):**

```java
public Optional<User> findUserById(String userId) {
// => Return type explicitly indicates possible absence
// => Optional<User>: compiler enforces handling
    return Optional.ofNullable(database.query(userId));
// => Wrap potentially null value in Optional
// => ofNullable: handles null gracefully (returns empty Optional)
}

// Explicit handling required
// => Functional approach: no null checks
service.findUserById("123")
// => Returns Optional<User>
    .ifPresent(this::processUser);
// => Only executes if User present
// => Method reference: clean syntax
// => No NPE risk: Optional handles absence

// Or with default
User user = service.findUserById("123")
// => Returns Optional<User>
    .orElse(User.guest());
// => Provide default value if absent
// => orElse: fallback to guest user
// => Always returns User (never null)

// Or throw exception
User user = service.findUserById("123")
// => Returns Optional<User>
    .orElseThrow(() -> new UserNotFoundException("123"));
// => Convert absence to exception
// => orElseThrow: explicit failure handling
// => Supplier lambda: create exception on demand
```

## Exception Handling

### Handle Exceptions Meaningfully

Never use empty catch blocks. Log exceptions with context, rethrow when appropriate, and provide actionable error messages.

**Exception handling principles:**

- **Catch specific exceptions**: Never use `catch (Exception e)`
- **Log with context**: Include IDs, request details, timestamps
- **Wrap in domain exceptions**: Convert technical to business exceptions
- **Never silent**: Always log or rethrow

**Before (poor exception handling):**

```java
public Contract createContract(Request request) {
// => Anti-pattern: swallows exceptions and returns null
    try {
        validateRequest(request);
// => Validates request but exception handling below hides failures
        return repository.save(contract);
// => Database save operation with no error visibility
    } catch (Exception e) {
// => Catches ALL exceptions including RuntimeException
// => Silent failure: no logging, no rethrowing, no user feedback
        // Silent failure
    }
    return null;
// => Null return: caller cannot distinguish success from failure
// => Forces null checks throughout codebase
}
```

**After (meaningful handling):**

```java
public class ContractService {
    private static final Logger logger = LoggerFactory.getLogger(ContractService.class);
// => SLF4J logger: abstraction over logging frameworks (Logback, Log4j2)
// => Static: one logger instance per class, minimal memory overhead

    public Contract createContract(Request request) {
        try {
            validateRequest(request);
// => Fail-fast validation: throws IllegalArgumentException on invalid input
            Contract contract = contractGenerator.generate(request);
// => Business logic: generates contract from validated request
            return repository.save(contract);
// => Persistence: may throw DataAccessException on database errors

        } catch (IllegalArgumentException e) {
// => Catches validation failures: specific exception type
            logger.warn("Invalid contract request: customerId={}, error={}",
                request.getCustomerId(), e.getMessage());
// => WARN level: expected error, not system failure
// => Structured logging: customerId for traceability, error message for details
            throw new ContractValidationException(
                "Cannot create contract: " + e.getMessage(), e);
// => Wraps in domain exception: exposes business error to caller
// => Preserves original exception: maintains stack trace for debugging

        } catch (DataAccessException e) {
// => Catches persistence failures: Spring's database exception hierarchy
            logger.error("Database error creating contract: customerId={}",
                request.getCustomerId(), e);
// => ERROR level: unexpected system failure requiring investigation
// => Context preservation: logs customer ID for incident correlation
            throw new ContractServiceException(
                "Failed to save contract. Please try again.", e);
// => User-friendly message: hides technical details, suggests retry
// => Wraps exception: converts infrastructure to business layer exception
        }
    }
}
```

### Use Try-With-Resources for Resource Management

Always use try-with-resources for resources implementing `AutoCloseable` to ensure proper cleanup.

**Why it matters:**

- Guarantees resource closure even with exceptions
- Cleaner code (no manual finally blocks)
- Handles suppressed exceptions correctly
- Prevents resource leaks

**Before (manual management):**

```java
public void writeReport(String filePath, List<Record> records) throws IOException {
// => Manual resource management: error-prone pattern
    BufferedWriter writer = null;
// => Initialize to null: allows finally block to check if resource opened
    try {
        writer = Files.newBufferedWriter(Paths.get(filePath));
// => Opens file: may throw IOException if path invalid or permissions insufficient
        writer.write("Report Header");
// => Writes data: may throw IOException on disk full or I/O errors
        // ... write records
    } finally {
// => Finally block: always executes, even if exception thrown
        if (writer != null) {
// => Null check required: resource may not have been created
            writer.close(); // May throw, hiding original exception
// => Close may throw IOException: suppresses original exception from try block
// => Resource leak risk: if close() throws, cleanup incomplete
        }
    }
}
```

**After (try-with-resources):**

```java
public void writeReport(String filePath, List<Record> records) throws IOException {
// => Throws IOException: lets caller handle I/O failures
    try (BufferedWriter writer = Files.newBufferedWriter(
// => Try-with-resources: automatic close() call guaranteed
// => Resource declaration: BufferedWriter implements AutoCloseable
            Paths.get(filePath),
// => Path conversion: string to Path object for NIO operations
            StandardCharsets.UTF_8)) {
// => Explicit charset: prevents platform-dependent encoding issues
// => UTF-8: universal charset supporting all Unicode characters

        writer.write("Report - " + LocalDate.now());
// => Writes header with current date: ISO-8601 format (YYYY-MM-DD)
        writer.newLine();
// => Platform-independent line separator: \n (Unix) or \r\n (Windows)

        for (Record record : records) {
// => Enhanced for-loop: simple iteration over collection
            writer.write(record.toString());
// => Writes record data: uses Record's toString() implementation
            writer.newLine();
// => Each record on new line: human-readable format
        }

        // Writer automatically closed, even if exception occurs
// => Automatic cleanup: close() called when try block exits
// => Exception safety: if write fails, writer still closed properly
// => Suppressed exceptions: close() exceptions added to original exception
    }
}
```

## Collections and Iteration

### Choose Collections Over Arrays

Use `ArrayList`, `HashSet`, `HashMap` instead of arrays for flexibility, type safety, and rich API support.

**Collections advantages:**

- Dynamic sizing (no fixed capacity)
- Type-safe generics
- Rich API (filter, map, sort, etc.)
- Better integration with Java ecosystem

**Before (arrays):**

```java
public Distribution[] distributeAmount(Money total, Beneficiary[] beneficiaries) {
// => Array parameters: fixed size, no type safety for empty arrays
    if (beneficiaries.length == 0) {
// => Length field: arrays use field, not method like collections
        throw new IllegalArgumentException("Empty array");
// => Manual validation: no built-in isEmpty() method
    }

    Money perBeneficiary = total.divide(
// => Divides total equally among beneficiaries
        BigDecimal.valueOf(beneficiaries.length),
// => Converts int to BigDecimal: required for precise division
        RoundingMode.HALF_UP
// => Rounding mode: rounds 0.5 up (e.g., 2.5 → 3), financial standard
    );

    Distribution[] distributions = new Distribution[beneficiaries.length];
// => Fixed-size array: must know length at creation time
    for (int i = 0; i < beneficiaries.length; i++) {
// => Index-based loop: verbose, error-prone (off-by-one risks)
        distributions[i] = new Distribution(
// => Manual index assignment: must track index variable
            beneficiaries[i].getId(),
// => Array element access: bracket notation with index
            perBeneficiary
        );
    }
    return distributions;
// => Returns array: caller must handle fixed-size structure
}
```

**After (collections):**

```java
public List<Distribution> distributeAmount(Money total, List<Beneficiary> beneficiaries) {
// => Collection parameter: dynamic size, rich API, type-safe generics
    if (beneficiaries.isEmpty()) {
// => isEmpty() method: clearer intent than size() == 0
        throw new IllegalArgumentException("Beneficiary list cannot be empty");
// => Descriptive message: explains business constraint
    }

    Money perBeneficiary = total.divide(
// => Divides total: calculates per-beneficiary amount
        BigDecimal.valueOf(beneficiaries.size()),
// => size() method: returns element count as int
        RoundingMode.HALF_UP
// => HALF_UP rounding: 0.5 rounds up, financial standard for fairness
    );

    return beneficiaries.stream()
// => Stream API: functional transformation pipeline
        .map(beneficiary -> new Distribution(
// => map operation: transforms each Beneficiary to Distribution
// => Lambda expression: concise function syntax
            beneficiary.getId(),
// => Extracts beneficiary ID: unique identifier for distribution
            perBeneficiary
// => Same amount per beneficiary: equal distribution calculated above
        ))
        .collect(Collectors.toList());
// => Terminal operation: collects stream elements into ArrayList
// => Returns List<Distribution>: collection with all distributions
}
```

### Use Lambdas for Functional Interfaces

Replace anonymous inner classes with lambda expressions for cleaner, more readable code.

**Lambda advantages:**

- Concise syntax
- Better readability
- Encourage functional style
- Easier to test

**Before (anonymous classes):**

```java
public List<User> findEligibleUsers(List<User> allUsers, Money threshold) {
// => Filters users by balance threshold using anonymous class (verbose)
    return allUsers.stream()
// => Creates sequential stream from list for functional operations
        .filter(new Predicate<User>() {
// => Anonymous inner class: implements Predicate<User> functional interface
// => Verbose syntax: requires explicit type declaration and method signature
            @Override
// => Overrides abstract test() method from Predicate interface
            public boolean test(User user) {
// => test() method: receives User, returns boolean for filtering decision
                return user.getBalance().isGreaterThanOrEqualTo(threshold);
// => Business logic: checks if user balance meets minimum threshold
            }
        })
        .collect(Collectors.toList());
// => Terminal operation: collects filtered users into ArrayList
}
```

**After (lambdas):**

```java
public List<User> findEligibleUsers(List<User> allUsers, Money threshold) {
// => Filters users using lambda expressions: concise functional style
    return allUsers.stream()
// => Stream creation: enables functional operations on collection
        .filter(user -> user.getBalance().isGreaterThanOrEqualTo(threshold))
// => Lambda filter: user -> boolean expression (no explicit Predicate type)
// => Arrow syntax: parameter -> body (single parameter, no parentheses needed)
        .filter(User::isActive)
// => Method reference: equivalent to user -> user.isActive()
// => Chained filter: combines multiple predicates for readability
        .collect(Collectors.toList());
// => Collects results: creates ArrayList with filtered users
}

public Money calculateTotalBalance(List<User> users) {
// => Calculates sum of all user balances using stream reduction
    return users.stream()
// => Stream over users: prepares for transformation and aggregation
        .map(User::getBalance)
// => Method reference: extracts balance from each user
// => Equivalent to: user -> user.getBalance()
// => Transforms Stream<User> to Stream<Money>
        .reduce(Money.ZERO, Money::add);
// => Terminal operation: combines all Money objects into single total
// => Money.ZERO: identity value (sum starts at 0)
// => Money::add: method reference to binary operator (sum accumulation)
// => Returns single Money: total of all user balances
}
```

### Loop Efficiently with Streams

Use enhanced for-loops for simple iteration and streams for transformations, filtering, and aggregations.

**When to use each:**

| Pattern           | Best For                                   | Example Use Case          |
| ----------------- | ------------------------------------------ | ------------------------- |
| Enhanced for-loop | Simple iteration with side effects         | Sending notifications     |
| Stream            | Transformation, filtering, aggregation     | Data processing pipelines |
| Parallel stream   | CPU-intensive operations on large datasets | Batch calculations        |

**Enhanced for-loop (simple iteration):**

```java
public void notifyAllUsers(List<User> users, String message) {
// => Simple iteration with side effects: enhanced for-loop more readable than stream
    for (User user : users) {
// => Enhanced for-loop: iterates each User in collection
// => No index variable: cleaner than traditional for(int i=0; i<size; i++)
        notificationService.send(user.getEmail(), message);
// => Side effect: sends notification (external system interaction)
// => Email extraction: gets user email for notification delivery
// => No return value: forEach operation, not transformation
    }
}
```

**Stream (transformation and filtering):**

```java
public List<Payment> getOverduePayments(List<Payment> allPayments) {
// => Filters, sorts, and returns overdue unpaid payments using stream pipeline
    LocalDate today = LocalDate.now();
// => Current date: reference point for overdue calculation
// => LocalDate: date without time zone (ISO-8601 calendar)

    return allPayments.stream()
// => Stream pipeline: multiple intermediate operations before terminal collection
        .filter(payment -> payment.getDueDate().isBefore(today))
// => First filter: keeps payments with due date before today
// => Lambda predicate: payment -> boolean expression
        .filter(payment -> !payment.isPaid())
// => Second filter: excludes paid payments
// => Chained filters: each narrows result set (overdue AND unpaid)
        .sorted(Comparator.comparing(Payment::getDueDate))
// => Sorting: orders by due date ascending (oldest first)
// => Comparator.comparing(): creates comparator from key extractor
// => Payment::getDueDate: method reference extracting comparison key
        .collect(Collectors.toList());
// => Terminal operation: materializes stream into ArrayList
// => Returns List<Payment>: overdue unpaid payments sorted by due date
}
```

## Control Flow Simplification

### Simplify Nested Conditionals with Guard Clauses

Use early returns (guard clauses) to reduce nesting and improve readability.

**Benefits:**

- Reduces cognitive load
- Flattens code structure
- Makes happy path obvious
- Easier to add new validations

**Before (deep nesting):**

```java
public Money calculateFee(User user, Money threshold) {
// => Nested conditionals: hard to follow, high cyclomatic complexity
    if (user != null) {
// => Null check: first validation but buried in nesting
        if (user.isActive()) {
// => Active check: second level nesting
            Money balance = user.getBalance();
// => Balance extraction: third level indentation
            if (balance.isGreaterThanOrEqualTo(threshold)) {
// => Threshold check: fourth level nesting
                if (user.hasDebt()) {
// => Debt check: fifth level nesting (arrow anti-pattern)
                    balance = balance.subtract(user.getDebt());
// => Mutates balance variable: reduces clarity
                    if (balance.isGreaterThanOrEqualTo(threshold)) {
// => Re-check threshold after debt subtraction: sixth level nesting
                        return balance.multiply(new BigDecimal("0.025"));
// => Fee calculation: 2.5% of balance after debt
                    } else {
                        return Money.ZERO;
// => Below threshold after debt: no fee
                    }
                } else {
                    return balance.multiply(new BigDecimal("0.025"));
// => No debt case: duplicate fee calculation logic
                }
            } else {
                return Money.ZERO;
// => Below threshold: no fee
            }
        } else {
            return Money.ZERO;
// => Inactive user: no fee
        }
    } else {
        throw new IllegalArgumentException("User cannot be null");
// => Null validation at bottom: should be at top
    }
}
```

**After (guard clauses):**

```java
public Money calculateFee(User user, Money threshold) {
// => Guard clauses: flat structure, early returns, clear happy path
    if (user == null) {
// => Guard clause 1: fail-fast null validation at top
        throw new IllegalArgumentException("User cannot be null");
// => Throws immediately: no nesting needed for remaining logic
    }

    if (!user.isActive()) {
// => Guard clause 2: early return for inactive users
        return Money.ZERO;
// => Exits early: remaining code only executes for active users
    }

    Money balance = user.getBalance();
// => Balance extraction: executed only for active users
    if (balance.isLessThan(threshold)) {
// => Guard clause 3: early return when balance below threshold
        return Money.ZERO;
// => No fee calculation needed: exits early
    }

    if (user.hasDebt()) {
// => Debt check: only executed if balance >= threshold
        balance = balance.subtract(user.getDebt());
// => Debt deduction: adjusts balance for fee calculation
        if (balance.isLessThan(threshold)) {
// => Re-check threshold: after debt subtraction
            return Money.ZERO;
// => Early return: no fee if balance drops below threshold
        }
    }

    return balance.multiply(new BigDecimal("0.025"));
// => Happy path at bottom: clear fee calculation (2.5%)
// => Single calculation: no duplication, all guards passed
}
```

## Immutability Patterns

### Use Final Fields for Immutability

Declare fields as `final` whenever possible to prevent accidental modification and clearly communicate immutability.

**Final field benefits:**

- Compiler enforces initialization
- Thread-safe (no synchronization needed)
- Clear intent (immutable design)
- Easier reasoning about state

**Example:**

```java
public final class Money {
// => final class: cannot be subclassed (protects immutability contract)
    private final BigDecimal amount;
// => final field: assigned once in constructor, never changes
// => BigDecimal: immutable arbitrary-precision decimal (no floating-point errors)
    private final Currency currency;
// => final field: immutable currency (prevents currency mismatches)

    public Money(BigDecimal amount, Currency currency) {
// => Constructor: only way to set final fields
        if (amount == null) {
// => Null validation: prevents NullPointerException in operations
            throw new IllegalArgumentException("Amount cannot be null");
// => Fail-fast: rejects invalid state at construction time
        }
        if (currency == null) {
// => Currency validation: ensures all Money objects have valid currency
            throw new IllegalArgumentException("Currency cannot be null");
        }

        this.amount = amount;
// => Final field assignment: only allowed in constructor
        this.currency = currency;
// => One-time initialization: guarantees immutability
    }

    public Money add(Money other) {
// => Returns new Money: does not modify this object (immutability)
        validateSameCurrency(other);
// => Validation: prevents adding amounts with different currencies
        return new Money(this.amount.add(other.amount), this.currency);
// => Creates new instance: original objects unchanged
// => BigDecimal.add(): immutable operation, returns new BigDecimal
    }

    public Money multiply(BigDecimal multiplier) {
// => Multiplication: returns new Money, preserves original
        return new Money(this.amount.multiply(multiplier), this.currency);
// => New instance: currency preserved, amount scaled
// => BigDecimal.multiply(): precise multiplication without rounding errors
    }

    // Getters only, no setters
// => No setters: enforces immutability at API level
    public BigDecimal getAmount() {
// => Returns immutable BigDecimal: safe to expose
        return amount;
// => Direct return: BigDecimal itself immutable, no defensive copy needed
    }

    public Currency getCurrency() {
// => Currency enum/class: typically immutable in Java
        return currency;
// => Safe exposure: Currency instances are immutable
    }
}
```

### Implement Defensive Copying

When accepting or returning mutable objects, create copies to prevent external modification.

**When defensive copying needed:**

- Constructor parameters (mutable collections, dates)
- Getter methods returning mutable fields
- Maintaining class invariants
- Security-sensitive data

**Before (exposed mutable state):**

```java
public class Account {
// => Account class: intended to be immutable but has vulnerability
    private final List<Transaction> transactions;
// => final field: reference immutable, but List content is mutable
// => Aliasing problem: external code holds reference to same list

    public Account(List<Transaction> transactions) {
// => Constructor accepts mutable list: exposes internal state
        this.transactions = transactions; // Caller can modify
// => Direct assignment: caller can modify list after construction
// => Breaks immutability: Account state can change externally
// => Example: caller.add(newTransaction) affects Account internals
    }

    public List<Transaction> getTransactions() {
// => Getter returns mutable list reference: breaks encapsulation
        return transactions; // Caller can modify
// => Returns internal reference: allows external modification
// => Caller can: clear(), add(), remove() affecting Account state
// => Violates immutability contract: external code controls internal data
    }
}
```

**After (defensive copying):**

```java
public class Account {
// => Account with defensive copying: protects internal state
    private final List<Transaction> transactions;
// => final reference: points to internal copy, never reassigned

    public Account(List<Transaction> transactions) {
// => Constructor receives list: potentially from untrusted source
        this.transactions = new ArrayList<>(transactions); // Copy
// => Defensive copy: creates new ArrayList with copied elements
// => Prevents external modification: caller's changes don't affect Account
// => Shallow copy: Transaction objects shared (ok if Transaction immutable)
    }

    public List<Transaction> getTransactions() {
// => Returns transactions: could expose internal state without copying
        return new ArrayList<>(transactions); // Return copy
// => Defensive copy on return: caller gets independent list
// => Caller modifications isolated: add/remove/clear don't affect Account
// => Performance trade-off: copies on every call, safe but potentially slow
    }

    // Or return unmodifiable view
    public List<Transaction> getTransactionsView() {
// => Alternative approach: unmodifiable wrapper instead of copy
        return Collections.unmodifiableList(transactions);
// => Unmodifiable wrapper: read-only view of internal list
// => Throws UnsupportedOperationException: if caller tries add/remove/clear
// => Zero-copy: no ArrayList creation, better performance
// => Still safe: caller cannot modify Account's internal state
    }
}
```

## Dependency Management

### Use Dependency Injection

Use dependency injection instead of creating dependencies internally or using static access.

**Dependency injection benefits:**

- Testability (inject mocks/stubs)
- Flexibility (swap implementations)
- Explicit dependencies (visible in constructor)
- Loose coupling

**Before (hard-coded dependencies):**

```java
public class PaymentService {
// => Service with static dependencies: hard to test, tightly coupled
    public void processPayment(String userId, Money amount) {
// => Processes payment: but uses global static dependencies
        Money fee = FeeCalculator.calculate(amount); // Static dependency
// => Static method call: cannot mock FeeCalculator in tests
// => Global state: all instances use same calculator implementation
// => Testing issues: cannot inject fake calculator for unit tests
        DatabaseHelper.save(new PaymentRecord(userId, fee)); // Hidden coupling
// => Static helper: hidden dependency not visible in constructor
// => Tight coupling: cannot swap database implementation
// => Hard to test: requires real database or complex static mocking
        NotificationManager.notify(userId, fee); // Hard to test
// => Static notification: cannot verify notifications in tests
// => Cannot inject mock: stuck with real notification manager
    }
}
```

**After (dependency injection):**

```java
public class PaymentService {
// => Service with dependency injection: testable, flexible, explicit
    private final FeeCalculator calculator;
// => final field: dependency injected once in constructor
    private final PaymentRepository repository;
// => Repository dependency: explicit, visible in constructor signature
    private final NotificationService notificationService;
// => Service dependency: can be mocked for testing

    public PaymentService(
// => Constructor injection: all dependencies passed explicitly
            FeeCalculator calculator,
// => Interface dependency: allows swapping implementations
            PaymentRepository repository,
// => Explicit parameter: caller knows all dependencies
            NotificationService notificationService) {
// => Dependencies visible: no hidden static calls
        this.calculator = calculator;
// => Assigns to final field: guarantees immutability
        this.repository = repository;
        this.notificationService = notificationService;
// => Constructor completes initialization: object fully configured
    }

    public void processPayment(String userId, Money amount) {
// => Uses injected dependencies: testable, no static calls
        Money fee = calculator.calculate(amount);
// => Calls injected calculator: can be mocked in tests
// => Interface method: implementation determined by caller
        repository.save(new PaymentRecord(userId, fee));
// => Uses injected repository: can inject in-memory test repository
// => Decoupled from database: tests don't need real database
        notificationService.notifyUser(userId, fee);
// => Injected service: can inject mock to verify notification sent
// => Testable: verify interactions without real notification system
    }
}
```

### Separate Configuration from Code

Externalize configuration to properties files, environment variables, or configuration services.

**Configuration separation benefits:**

- Environment-specific settings (dev, staging, prod)
- No recompilation for config changes
- Centralized configuration management
- Security (credentials outside code)

**Before (hardcoded config):**

```java
public class DatabaseConnector {
// => Hardcoded configuration: inflexible, insecure, environment-locked
    private static final String DB_URL = "jdbc:postgresql:mydb";
// => Hardcoded URL: cannot change between dev/staging/prod without recompilation
// => localhost hardcoded (the short form defaults to localhost:5432): won't work in containerized/cloud environments
    private static final String DB_USER = "admin";
// => Hardcoded username: same credentials for all environments (unsafe)
    private static final String DB_PASS = "password123"; // Security risk!
// => CRITICAL SECURITY ISSUE: password in source code
// => Version control risk: password committed to git history
// => No rotation: changing password requires code change and redeployment

    public Connection connect() {
// => Creates database connection using hardcoded credentials
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
// => DriverManager: legacy JDBC connection method
// => Cannot configure: retry logic, connection pooling, timeouts
    }
}
```

**After (externalized config):**

```java
// application.properties
database.url=jdbc:postgresql://${DB_HOST:localhost}:5432/mydb
// => Default URL: localhost for local development
database.user=${DB_USER}
// => Environment variable placeholder: reads from system environment
// => ${DB_USER}: Spring resolves at runtime from environment
database.password=${DB_PASSWORD}
// => Credentials from environment: never committed to source control
// => 12-factor app pattern: configuration in environment variables

// Configuration class
@Configuration
// => Spring configuration class: defines beans for dependency injection
public class DatabaseConfig {
// => Centralizes database configuration: single source of truth
    @Value("${database.url}")
// => @Value annotation: injects property value at runtime
// => ${database.url}: reads from application.properties or environment override
    private String dbUrl;
// => Field injection: Spring populates after construction

    @Value("${database.user}")
// => Resolves ${DB_USER} from environment variable
    private String dbUser;
// => Runtime resolution: different values per environment

    @Value("${database.password}")
// => Password from environment: secure, never in code
    private String dbPassword;
// => Credentials isolation: can be different per deployment

    @Bean
// => @Bean: factory method for Spring-managed DataSource instance
    public DataSource dataSource() {
// => Creates connection pool: not raw DriverManager connections
        return DataSourceBuilder.create()
// => Builder pattern: fluent API for DataSource configuration
            .url(dbUrl)
// => Uses injected URL: environment-specific value
            .username(dbUser)
// => Environment-specific username: dev/staging/prod can differ
            .password(dbPassword)
// => Secure password: from environment, not source code
            .build();
// => Creates HikariCP DataSource: production-ready connection pooling
    }
}
```

## Testing Best Practices

### Write Comprehensive, Well-Named Tests

Tests should document expected behavior through descriptive names and comprehensive coverage.

**Test naming patterns:**

- `should[ExpectedBehavior]When[Condition]`
- `[MethodName]_[Scenario]_[ExpectedResult]`
- Given-When-Then structure in test body

**Example:**

```java
public class MoneyCalculatorTest {
// => JUnit 5 test class: tests MoneyCalculator behavior

    private MoneyCalculator calculator;
// => System under test: initialized before each test

    @BeforeEach
// => @BeforeEach: runs before each @Test method (JUnit 5)
    void setUp() {
// => Setup method: initializes fresh calculator for each test (test isolation)
        calculator = new MoneyCalculator();
// => Fresh instance: prevents test interdependence
    }

    @Test
// => @Test annotation: marks method as test case
    void shouldCalculateFeeAt2Point5PercentForEligibleAmount() {
// => Test name: describes expected behavior in readable sentence
// => Naming pattern: should[ExpectedBehavior]When[Condition]
        // Given
// => Given section: test preconditions and input data
        Money amount = Money.ofUSD(new BigDecimal("100000"));
// => Test data: eligible amount (100,000 USD)
        Money expectedFee = Money.ofUSD(new BigDecimal("2500"));
// => Expected result: 2.5% fee (2,500 USD)

        // When
// => When section: action under test
        Money actualFee = calculator.calculateFee(amount);
// => Calls method: calculates fee from amount

        // Then
// => Then section: assertions verifying expected outcome
        assertEquals(expectedFee, actualFee);
// => Assertion: verifies calculated fee matches expected (2.5%)
    }

    @Test
    void shouldReturnZeroWhenAmountBelowThreshold() {
// => Edge case test: verifies threshold boundary behavior
        // Given
        Money belowThreshold = Money.ofUSD(new BigDecimal("100"));
// => Below minimum: amount under threshold (100 USD)
        Money threshold = Money.ofUSD(new BigDecimal("1000"));
// => Threshold: minimum amount for fee calculation (1,000 USD)

        // When
        Money fee = calculator.calculateFee(belowThreshold, threshold);
// => Calculates fee: with explicit threshold parameter

        // Then
        assertEquals(Money.ZERO_USD, fee);
// => Verifies zero fee: below threshold should not incur fee
    }

    @Test
    void shouldThrowExceptionWhenAmountIsNull() {
// => Negative test: verifies proper null handling
        // When/Then
// => Combined When/Then: exception expected immediately
        assertThrows(
// => assertThrows: verifies exception type thrown
            IllegalArgumentException.class,
// => Expected exception: specific type for null validation
            () -> calculator.calculateFee(null)
// => Lambda: deferred execution to capture exception
        );
    }

    @Test
    void shouldThrowExceptionWithDescriptiveMessageWhenAmountIsNegative() {
// => Negative test: validates rejection of invalid input
        // Given
        Money negativeAmount = Money.ofUSD(new BigDecimal("-100"));
// => Invalid input: negative amount (should be rejected)

        // When/Then
        IllegalArgumentException exception = assertThrows(
// => Captures exception: allows message verification
            IllegalArgumentException.class,
            () -> calculator.calculateFee(negativeAmount)
// => Triggers exception: negative amount should fail validation
        );

        assertTrue(exception.getMessage().contains("Amount cannot be negative"));
// => Verifies message: ensures descriptive error message for users
    }
}
```

## Logging Best Practices

### Use Proper Logging Levels

Choose appropriate logging levels (TRACE, DEBUG, INFO, WARN, ERROR) and include contextual information.

**Logging level guidelines:**

| Level | Purpose                                    | Example Use Case                       |
| ----- | ------------------------------------------ | -------------------------------------- |
| ERROR | System errors requiring attention          | Database connection failures           |
| WARN  | Unexpected but handled situations          | Validation failures, retries           |
| INFO  | Significant business events                | User registration, payment processing  |
| DEBUG | Detailed diagnostic information            | Method parameters, intermediate values |
| TRACE | Very detailed debugging (usually disabled) | Loop iterations, fine-grained flow     |

**Example:**

```java
public class PaymentService {
// => Service with comprehensive logging at appropriate levels
    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);
// => SLF4J logger: static final, one instance per class
// => LoggerFactory.getLogger(): creates logger with class name

    public Payment createPayment(PaymentRequest request) {
// => Creates payment: logs at multiple levels for observability
        logger.info("Creating payment for customer: {}",
            request.getCustomerId());
// => INFO level: significant business event (payment creation initiated)
// => Placeholder {}: SLF4J parameterized logging (efficient, no string concatenation)
// => customerId: correlation identifier for tracing

        logger.debug("Payment details - Amount: {}, Currency: {}",
            request.getAmount(),
            request.getCurrency());
// => DEBUG level: detailed diagnostic information (disabled in production)
// => Multiple placeholders: logs amount and currency for debugging
// => Only evaluated if DEBUG enabled: minimal production overhead

        try {
            validateRequest(request);
// => Validation: throws IllegalArgumentException on invalid input

            Payment payment = paymentProcessor.process(request);
// => Processing: core business logic
            Payment savedPayment = repository.save(payment);
// => Persistence: may throw DataAccessException

            logger.info("Successfully created payment: paymentId={}, customerId={}",
                savedPayment.getId(),
                savedPayment.getCustomerId());
// => INFO level: successful business event completion
// => paymentId + customerId: enables correlation and audit trails

            return savedPayment;

        } catch (IllegalArgumentException e) {
// => Validation failure: expected error condition
            logger.warn("Invalid payment request: customerId={}, reason={}",
                request.getCustomerId(),
                e.getMessage());
// => WARN level: expected error, not system failure
// => Logs context: customer ID and reason for debugging
            throw new PaymentValidationException(
                "Cannot create payment: " + e.getMessage(), e);
// => Wraps exception: converts to domain exception

        } catch (DataAccessException e) {
// => Database error: infrastructure failure
            logger.error("Database error while creating payment: customerId={}",
                request.getCustomerId(), e);
// => ERROR level: system error requiring investigation
// => Includes exception: logs full stack trace for debugging
// => e parameter: SLF4J logs exception separately with stack trace
            throw new PaymentServiceException(
                "Failed to save payment. Please try again.", e);
// => User-friendly message: hides technical details from caller

        } catch (Exception e) {
// => Catch-all: unexpected errors not handled above
            logger.error("Unexpected error creating payment: customerId={}",
                request.getCustomerId(), e);
// => ERROR level: truly unexpected, needs investigation
// => Logs exception: captures stack trace for post-mortem analysis
            throw new PaymentServiceException(
                "An unexpected error occurred. Please contact support.", e);
// => Generic message: directs user to support for unknown errors
        }
    }
}
```

## Input Validation

### Validate Input at Boundaries

Validate all external inputs (API requests, user input, external service responses) at system boundaries.

**Validation strategies:**

- Bean Validation annotations (@NotNull, @Positive, @Size)
- Custom validators for complex business rules
- Early validation (fail fast)
- Meaningful error messages

**Example:**

```java
// Request DTO with validation annotations
public class PaymentRequest {
// => Data Transfer Object: carries data across system boundaries
// => Bean Validation: declarative validation using annotations

    @NotBlank(message = "Customer ID is required")
// => @NotBlank: validates not null, not empty, and not whitespace-only
// => Custom message: returned in validation error response
    private String customerId;

    @NotNull(message = "Amount is required")
// => @NotNull: validates field is not null
    @Positive(message = "Amount must be positive")
// => @Positive: validates BigDecimal > 0 (rejects zero and negatives)
    private BigDecimal amount;

    @NotNull(message = "Currency is required")
    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency must be valid 3-letter ISO code")
// => @Pattern: validates against regex (ISO 4217: USD, EUR, IDR)
// => Regex: exactly 3 uppercase letters (A-Z)
    private String currency;

    @NotNull(message = "Payment date is required")
    @FutureOrPresent(message = "Payment date cannot be in the past")
// => @FutureOrPresent: validates date is today or future (rejects historical dates)
    private LocalDate paymentDate;

    // Getters and setters
}

// Controller with validation
@RestController
// => @RestController: combines @Controller + @ResponseBody (auto JSON serialization)
@RequestMapping("/api/v1/payments")
// => Base path: all endpoints prefixed with /api/v1/payments
public class PaymentController {
// => REST controller: exposes payment operations via HTTP
    private final PaymentService service;
// => Injected service: business logic layer

    @PostMapping
// => @PostMapping: handles HTTP POST to /api/v1/payments
    public ResponseEntity<PaymentResponse> createPayment(
// => ResponseEntity: allows custom HTTP status and headers
            @Valid @RequestBody PaymentRequest request) {
// => @Valid: triggers Bean Validation on PaymentRequest
// => @RequestBody: deserializes JSON to PaymentRequest object
// => Validation runs before method: throws MethodArgumentNotValidException if fails

        Payment payment = service.createPayment(request.toDomain());
// => Delegates to service: controller doesn't contain business logic
// => toDomain(): converts DTO to domain model

        return ResponseEntity
            .status(HttpStatus.CREATED)
// => HTTP 201 CREATED: resource successfully created
            .body(PaymentResponse.from(payment));
// => Response body: serialized to JSON, returned to client
    }
}

// Custom validator for complex rules
@Constraint(validatedBy = ValidPaymentRequestValidator.class)
// => @Constraint: marks annotation as validation constraint
// => validatedBy: specifies validator implementation class
@Target({ElementType.TYPE})
// => @Target: annotation can be applied to classes (not fields/methods)
@Retention(RetentionPolicy.RUNTIME)
// => @Retention: annotation available at runtime via reflection
public @interface ValidPaymentRequest {
// => Custom annotation: for complex cross-field validation
    String message() default "Invalid payment request";
// => Default message: used if validator returns false
    Class<?>[] groups() default {};
// => Validation groups: allows conditional validation
    Class<? extends Payload>[] payload() default {};
// => Payload: metadata for validation clients (rarely used)
}

public class ValidPaymentRequestValidator
        implements ConstraintValidator<ValidPaymentRequest, PaymentRequest> {
// => ConstraintValidator interface: implements custom validation logic
// => First type parameter: annotation type (ValidPaymentRequest)
// => Second type parameter: validated type (PaymentRequest)

    @Override
    public boolean isValid(
// => isValid method: returns true if valid, false if invalid
            PaymentRequest request,
// => Object to validate: null handling required
            ConstraintValidatorContext context) {
// => Context: allows custom violation messages

        if (request == null) {
// => Null check: null typically handled by @NotNull, but defensive
            return false;
        }

        // Business rule: Amount must not exceed daily limit
        if (request.getAmount().compareTo(new BigDecimal("10000")) > 0) {
// => Business validation: cross-cutting rule not expressible with standard annotations
// => compareTo() > 0: amount exceeds 10,000 limit
            context.disableDefaultConstraintViolation();
// => Disables default message: allows custom violation message
            context.buildConstraintViolationWithTemplate(
                "Amount cannot exceed daily limit of 10,000")
// => Custom message: more specific than annotation default
                .addPropertyNode("amount")
// => Associates with field: error appears with amount field in response
                .addConstraintViolation();
// => Registers violation: adds to validation error list
            return false;
// => Invalid: validation fails
        }

        return true;
// => Valid: all business rules passed
    }
}
```

## Type Selection

### Use Appropriate Data Types

Choose data types that accurately represent domain concepts.

**Type selection guidelines:**

| Domain Concept   | Recommended Type           | Avoid                            |
| ---------------- | -------------------------- | -------------------------------- |
| Money amounts    | `BigDecimal`               | `double`, `float`                |
| Dates            | `LocalDate`                | `java.util.Date`, `long`         |
| Timestamps       | `Instant`, `ZonedDateTime` | `long`, `java.util.Date`         |
| Fixed value sets | `enum`                     | `String`, `int`                  |
| Whole numbers    | `int`, `long`              | `BigInteger` (unless very large) |
| Optional values  | `Optional<T>`              | `null`                           |

**Example:**

```java
public class Transaction {
// => Domain model: uses appropriate types for each concept
    private final String transactionId;
// => String ID: typically UUID or generated identifier
    private final String customerId;
// => Customer reference: foreign key as string
    private final BigDecimal amount;           // BigDecimal for precise money
// => BigDecimal: arbitrary-precision decimal, no floating-point errors
// => Essential for money: 0.1 + 0.2 = 0.3 exactly (not 0.30000000000000004)
    private final Currency currency;            // Proper currency type
// => java.util.Currency: type-safe, validates ISO 4217 codes
// => Better than String: prevents invalid currencies like "XYZ"
    private final LocalDate transactionDate;   // LocalDate for dates
// => LocalDate: date without time or timezone (2024-01-15)
// => Avoids legacy java.util.Date: no timezone confusion
    private final Instant timestamp;           // Instant for UTC timestamps
// => Instant: point in time on UTC timeline (2024-01-15T10:30:00Z)
// => For audit trails: records precise moment transaction occurred
    private final TransactionStatus status;    // Enum for fixed set
// => Enum: type-safe, compile-time checked, autocomplete support
// => Better than String: prevents typos like "COMPELTED"
    private final TransactionType type;        // Enum for fixed set
// => Enum: limits values to defined set (DEPOSIT, WITHDRAWAL, etc.)

    // Constructor, methods
}

public enum TransactionStatus {
// => Transaction lifecycle states: models state machine
    PENDING,
// => Initial state: transaction created but not processed
    PROCESSING,
// => In-flight: transaction being processed
    COMPLETED,
// => Success: transaction successfully finished
    FAILED,
// => Error: transaction failed, may need retry
    CANCELLED
// => Aborted: transaction cancelled by user or system
}

public enum TransactionType {
// => Transaction categories: classifies transaction purpose
    DEPOSIT,
// => Money in: adds funds to account
    WITHDRAWAL,
// => Money out: removes funds from account
    TRANSFER,
// => Move money: between accounts
    FEE
// => Service charge: bank/platform fee deduction
}
```

## Access Control

### Use Appropriate Access Modifiers

Apply the principle of least privilege to class members.

**Access modifier guidelines:**

| Modifier          | Visibility           | When to Use                                 |
| ----------------- | -------------------- | ------------------------------------------- |
| `private`         | Class only           | Default for fields, internal helper methods |
| `package-private` | Package              | Package-internal APIs                       |
| `protected`       | Package + subclasses | Designed for inheritance                    |
| `public`          | Everywhere           | Public APIs, designed for external use      |

**Example:**

```java
public class Account {
// => Account aggregate: demonstrates proper access control
    // Private fields (encapsulation)
    private final String accountId;
// => private final: cannot be accessed or modified outside class
// => Encapsulation: hides internal identifier
    private final String customerId;
// => private final: immutable customer reference
    private Money balance;
// => private mutable: balance changes but controlled through methods only
// => No setter: modifications only through deposit/withdraw methods

    // Public constructor (external creation)
    public Account(String accountId, String customerId, Money initialBalance) {
// => public: allows external code to create instances
// => Constructor injection: all required data provided at creation
        this.accountId = accountId;
        this.customerId = customerId;
        this.balance = initialBalance;
// => Initialization: sets all fields during construction
    }

    // Public methods (external API)
    public void deposit(Money amount) {
// => public: external API for depositing money
// => Command method: changes state, returns void
        validatePositiveAmount(amount);
// => Calls private method: validation encapsulated
        this.balance = this.balance.add(amount);
// => Immutable operation: creates new Money, assigns to balance
        recordTransaction(TransactionType.DEPOSIT, amount);
// => Calls private method: audit trail encapsulated
    }

    public Money getBalance() {
// => public: allows external code to query balance
// => Query method: returns value, no side effects
        return balance;
// => Safe return: Money is immutable, no defensive copy needed
    }

    // Private helper methods (internal only)
    private void validatePositiveAmount(Money amount) {
// => private: implementation detail, not part of public API
// => Encapsulation: validation logic hidden from callers
        if (amount.isNegativeOrZero()) {
// => Business rule check: enforces positive amounts
            throw new IllegalArgumentException("Amount must be positive");
// => Fail-fast: rejects invalid input immediately
        }
    }

    private void recordTransaction(TransactionType type, Money amount) {
// => private: internal audit logging, not exposed to clients
// => Side effect method: records transaction for audit trail
        // Internal transaction recording logic
    }

    // Package-private for testing
    void resetBalance() {
// => Package-private (no modifier): accessible in same package
// => Test hook: allows test classes to reset state
// => Not public: prevents production code from resetting balance
        this.balance = Money.ZERO;
// => Resets to zero: useful for test setup/teardown
    }
}
```

## Summary

Best practices emerge from collective experience addressing common challenges. Key themes:

**Clarity and Simplicity**:

- Write clear code over clever code
- Keep methods small and focused
- Use intention-revealing names

**Immutability and Safety**:

- Prefer immutable objects
- Use final fields
- Implement defensive copying

**Modern Java Features**:

- Switch expressions for decision logic
- Records for simple data carriers
- Optional for potentially absent values
- Streams for data transformation

**Robust Error Handling**:

- Validate at boundaries
- Fail fast with meaningful exceptions
- Use try-with-resources
- Log with appropriate levels and context

**Maintainable Design**:

- Composition over inheritance
- Dependency injection
- Separate configuration from code
- Organize by feature, not layer

**Quality Assurance**:

- Comprehensive, well-named tests
- Appropriate data types
- Proper access modifiers
- Defensive programming

Applying these practices systematically leads to codebases that are easier to understand, modify, and maintain over their lifetime.
