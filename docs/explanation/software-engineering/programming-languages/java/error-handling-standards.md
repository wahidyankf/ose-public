---
title: Java Error Handling Standards for OSE Platform
description: Prescriptive error handling requirements for Shariah-compliant financial systems
category: explanation
subcategory: prog-lang
tags:
  - java
  - ose-platform
  - error-handling
  - financial-systems
  - standards
principles:
  - explicit-over-implicit
  - reproducibility
created: 2026-02-03
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Java fundamentals from [AyoKoding Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Java tutorial. We define HOW to apply Java in THIS codebase, not WHAT Java is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

# Java Error Handling Standards for OSE Platform

**OSE-specific prescriptive standards** for error handling in Shariah-compliant financial applications. This document defines **mandatory requirements** using RFC 2119 keywords (MUST, SHOULD, MAY).

**Prerequisites**: Understanding of Java exception handling fundamentals from [AyoKoding Java Error Handling](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md).

## Purpose

Error handling in OSE Platform serves critical functions beyond typical application development:

- **Financial Integrity**: Preventing partial transactions that violate Islamic finance principles
- **Audit Compliance**: Complete error trails for regulatory review
- **Shariah Compliance**: Ensuring Zakat calculations, Murabaha contracts, and donation processing are atomic and correct
- **System Reliability**: Preventing cascading failures in critical financial operations

### Custom Exception Requirements

**REQUIRED**: All OSE Platform services MUST implement a domain-specific sealed exception hierarchy.

```java
// Root exception - sealed to control permitted subtypes
public sealed class OseFinancialException extends Exception
 permits ValidationException, TransactionException, ComplianceException {

 private final String errorCode;  // REQUIRED for error mapping
 private final Instant timestamp; // REQUIRED for audit trails

 protected OseFinancialException(String message, String errorCode) {
  super(message);
  this.errorCode = errorCode;
  this.timestamp = Instant.now();
 }

 public String errorCode() { return errorCode; }
 public Instant timestamp() { return timestamp; }
}
```

**REQUIRED**: All custom exceptions MUST:

- Include structured error codes (format: `DOMAIN_ERROR_TYPE`, e.g., `ZAK_CALC_ERROR`, `TXN_ROLLBACK_FAILED`)
- Capture timestamp at creation for audit trails
- Use sealed types to enable exhaustive pattern matching
- Provide secure error messages (see [Security Standards](#security-standards))

**RECOMMENDED**: Group exceptions by domain (Zakat, Transactions, Compliance) not by technical category.

### Checked vs Unchecked Guidelines for OSE

**REQUIRED**: Use **checked exceptions** for:

- Financial transaction failures (debit/credit operations)
- Shariah compliance violations (interest calculation detected, prohibited transaction types)
- External service failures (payment gateway, regulatory reporting)
- Data validation failures (negative Zakat amount, invalid account state)

**REQUIRED**: Use **unchecked exceptions** (RuntimeException) for:

- Programming errors (invalid Zakat rate constant, null pointer violations)
- Configuration errors (missing required properties)
- System-level failures that cannot be recovered (database connection pool exhausted)

### Financial Transaction Error Handling

**CRITICAL**: All financial transactions MUST be atomic (all-or-nothing) with proper rollback on errors.

**WRONG** - Silent failure creates financial inconsistency:

```java
// BAD: Partial transaction possible
public void processZakatPayment(Account account) {
 try {
  BigDecimal zakat = calculateZakat(account);
  deductFromAccount(account, zakat);
  creditToZakatFund(zakat);  // If this fails, money is lost!
 } catch (Exception e) {
  // Silently swallowed - audit trail lost!
 }
}
```

**CORRECT** - Explicit error handling with atomic transactions:

```java
// GOOD: Atomic transaction with explicit error handling
public Result<ZakatTransaction, ZakatError> processZakatPayment(Account account) {
 return validate(account)
  .flatMap(this::calculateZakat)
  .flatMap(zakat -> executeAtomicTransfer(account, zakat))
  .onFailure(error -> {
   logAuditTrail(account, error);  // REQUIRED
   rollbackPartialTransaction(account);  // REQUIRED
  });
}

private Result<ZakatTransaction, ZakatError> executeAtomicTransfer(
 Account account,
 Money zakat
) {
 return transactionManager.executeAtomic(() -> {
  deductFromAccount(account, zakat);
  creditToZakatFund(zakat);
  return new ZakatTransaction(account.id(), zakat, Instant.now());
 }).mapError(ex -> new ZakatError.TransferFailed(ex.getMessage()));
}
```

**REQUIRED**: All financial operations MUST:

- Use Result/Either types for explicit error representation (see [Functional Error Handling](#functional-error-handling))
- Execute within atomic transaction boundaries
- Log complete audit trails on failure (account ID, amount, timestamp, error details)
- Rollback partial state changes on any error
- Return structured error types (not generic exceptions)

### Rollback Requirements

**REQUIRED**: Transaction rollback MUST:

- Revert all database changes (account balances, transaction records)
- Clear in-memory state (caches, session data)
- Trigger compensating actions for external services (reverse payment gateway charges)
- Log rollback event with complete context for audit trail

**RECOMMENDED**: Implement idempotency tokens to prevent duplicate transactions after rollback.

### Error Logging Standards

**REQUIRED**: All errors in financial operations MUST be logged with:

- Timestamp (ISO 8601 format with timezone)
- User ID or session ID (for accountability)
- Operation type (e.g., "ZAKAT_PAYMENT", "MURABAHA_CONTRACT")
- Error code and message
- Affected entities (account IDs, transaction IDs)
- Request correlation ID (for distributed tracing)

```java
// REQUIRED audit trail format
public void logFinancialError(FinancialOperation operation, Throwable error) {
 AuditLog.error()
  .timestamp(Instant.now())
  .userId(operation.userId())
  .operationType(operation.type())
  .errorCode(extractErrorCode(error))
  .errorMessage(sanitizeErrorMessage(error))  // REQUIRED: No PII in logs
  .affectedEntities(operation.entityIds())
  .correlationId(operation.correlationId())
  .write();
}
```

**REQUIRED**: Audit logs MUST be:

- Written synchronously (not deferred) for financial operations
- Stored in append-only audit database (tamper-proof)
- Retained for minimum 7 years (regulatory compliance)
- Accessible for audit queries with sub-second response time

**PROHIBITED**: Logging sensitive data in error messages (see [Security Standards](#security-standards)).

### Retry Policies for External Services

**REQUIRED**: Idempotent operations (queries, immutable writes) MUST implement exponential backoff retry.

```java
// REQUIRED: Exponential backoff with jitter for payment gateway
@Retry(
 maxAttempts = 3,
 backoff = @Backoff(
  delay = 1000,      // 1 second initial delay
  multiplier = 2,    // Double each retry
  maxDelay = 10000   // Cap at 10 seconds
 ),
 retryOn = {PaymentGatewayTimeoutException.class, NetworkException.class},
 noRetryOn = {InvalidAccountException.class}  // Don't retry validation errors
)
public Result<PaymentConfirmation, PaymentError> processExternalPayment(Payment payment) {
 // Implementation
}
```

**REQUIRED**: Retry configuration MUST:

- Define explicit retry-able exceptions (transient failures only)
- Exclude non-retryable exceptions (validation errors, authentication failures)
- Use jitter (randomization) to prevent thundering herd
- Implement circuit breaker for persistent failures (see [Circuit Breaker Standards](#circuit-breaker-standards))

**PROHIBITED**: Retrying non-idempotent operations (debits, credits) without idempotency tokens.

### Circuit Breaker Standards

**REQUIRED**: All external service integrations MUST implement circuit breaker pattern.

```java
// REQUIRED: Circuit breaker for payment gateway
@CircuitBreaker(
 name = "paymentGateway",
 failureRateThreshold = 50,        // Open circuit at 50% failure rate
 waitDurationInOpenState = 60000,  // Wait 60 seconds before retry
 slidingWindowSize = 100,          // Evaluate last 100 calls
 minimumNumberOfCalls = 10         // Minimum calls before evaluation
)
public Result<PaymentConfirmation, PaymentError> callPaymentGateway(Payment payment) {
 // Implementation
}
```

**REQUIRED**: Circuit breaker MUST:

- Fail fast when circuit is OPEN (don't wait for timeouts)
- Return fallback response with appropriate error code
- Log circuit state transitions (CLOSED → OPEN → HALF_OPEN)
- Alert operations team when circuit opens

**RECOMMENDED**: Configure separate circuit breakers per external dependency (payment gateway, regulatory reporting, notification service).

### Result Type Requirements

**REQUIRED**: Financial domain operations MUST return Result/Either types instead of throwing exceptions.

```java
// REQUIRED: Explicit Result type for all financial operations
public sealed interface Result<T, E extends Throwable> {
 record Success<T, E extends Throwable>(T value) implements Result<T, E> {}
 record Failure<T, E extends Throwable>(E error) implements Result<T, E> {}

 // REQUIRED: Provide map, flatMap, onSuccess, onFailure
 <U> Result<U, E> map(Function<T, U> mapper);
 <U> Result<U, E> flatMap(Function<T, Result<U, E>> mapper);
 Result<T, E> onSuccess(Consumer<T> action);
 Result<T, E> onFailure(Consumer<E> action);
}
```

**REQUIRED**: Result types MUST:

- Use sealed interfaces for exhaustive pattern matching
- Provide monadic operations (map, flatMap) for composition
- Support side effects (onSuccess, onFailure) for logging/auditing
- Clearly distinguish success and failure in type system

**RECOMMENDED**: Use Vavr or similar library for production-grade Result/Either types.

### Error Accumulation

**REQUIRED**: Validation errors MUST be accumulated (not fail-fast) for user experience.

```java
// REQUIRED: Accumulate all validation errors
public Either<List<ValidationError>, ValidatedZakatPayment> validateZakatPayment(
 ZakatPaymentRequest request
) {
 List<ValidationError> errors = new ArrayList<>();

 if (request.amount().compareTo(BigDecimal.ZERO) <= 0) {
  errors.add(new ValidationError("amount", "Must be positive"));
 }
 if (request.zakatRate().compareTo(new BigDecimal("0.025")) != 0) {
  errors.add(new ValidationError("zakatRate", "Must be 2.5%"));
 }
 if (request.accountId() == null) {
  errors.add(new ValidationError("accountId", "Required"));
 }

 return errors.isEmpty()
  ? Either.right(new ValidatedZakatPayment(request))
  : Either.left(errors);
}
```

**REQUIRED**: Validation MUST return all errors simultaneously (not stop at first error).

**PROHIBITED**: Throwing exceptions for validation failures (use Either/Result instead).

### Error Message Sanitization

**CRITICAL**: Error messages exposed to clients MUST NOT contain:

- PII (personal identifiable information): names, emails, addresses
- Financial data: account numbers, balances, transaction amounts
- System internals: database queries, stack traces, file paths
- Security tokens: API keys, session IDs, authentication tokens

**REQUIRED**: Use error codes for client communication:

```java
// GOOD: Expose error codes, not sensitive details
public record ErrorResponse(
 String errorCode,      // e.g., "TXN_INSUFFICIENT_FUNDS"
 String userMessage,    // e.g., "Insufficient funds for this transaction"
 String correlationId   // For support ticket lookup
) {}

// BAD: Exposing sensitive data
public record ErrorResponse(
 String errorMessage  // "Account 1234567890 has balance $100, cannot debit $500"
) {}
```

**REQUIRED**: Separate client-facing messages from internal logs:

- **Client**: Error code + generic message
- **Internal logs**: Full details (account IDs, amounts, stack traces)

### Stack Trace Handling

**REQUIRED**: Production environments MUST sanitize stack traces before sending to clients.

```java
// REQUIRED: Strip stack traces in production
public ErrorResponse toErrorResponse(Throwable error) {
 return new ErrorResponse(
  extractErrorCode(error),
  getSafeUserMessage(error),
  generateCorrelationId()
  // NO stack trace in response
 );
}
```

**REQUIRED**: Log full stack traces internally for debugging.

**PROHIBITED**: Returning stack traces in API responses (security vulnerability).

### Error Scenario Coverage

**REQUIRED**: Unit tests MUST cover:

- Happy path (successful execution)
- Expected error cases (validation failures, insufficient funds)
- Edge cases (zero amounts, boundary values)
- Concurrent modification scenarios
- External service failures (mock payment gateway errors)

**REQUIRED**: Integration tests MUST verify:

- Transaction rollback on errors
- Audit trail completeness
- Circuit breaker behavior
- Retry policy correctness
- Error message sanitization

### Property-Based Testing

**RECOMMENDED**: Use property-based testing for financial calculations:

```java
// RECOMMENDED: Property-based test for Zakat calculation
@Property
void zakatCalculationShouldBeIdempotent(
 @ForAll @Positive BigDecimal wealth
) {
 var result1 = calculateZakat(wealth);
 var result2 = calculateZakat(wealth);
 assertThat(result1).isEqualTo(result2);  // Same input = same output
}

@Property
void zakatShouldBeTwoPointFivePercent(
 @ForAll @Positive BigDecimal wealth
) {
 var expectedZakat = wealth.multiply(new BigDecimal("0.025"));
 var actualZakat = calculateZakat(wealth);
 assertThat(actualZakat).isEqualByComparingTo(expectedZakat);
}
```

### OSE Platform Standards

- [API Standards](./api-standards.md) - REST API error responses
- [Security Standards](./security-standards.md) - Security error handling
- [Concurrency Standards](./concurrency-standards.md) - Thread-safe error propagation

### Learning Resources

For learning Java fundamentals and concepts referenced in these standards, see:

- **[Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md)** - Complete Java learning journey
- **[Java By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/_index.md)** - 157+ annotated code examples
  - **[Intermediate Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/intermediate.md)** - Exception handling, try-catch-finally, custom exceptions
  - **[Advanced Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/advanced.md)** - Result types, functional error handling, resilience patterns
- **[Java In Practice](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/in-the-field/_index.md)** - Error handling patterns and best practices
- **[Java Release Highlights](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/release-highlights/_index.md)** - Java 17, 21, and 25 LTS features

**Note**: These standards assume you've learned Java basics from ayokoding-web. We don't re-explain fundamental concepts here.

### Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - Result/Either types make errors explicit in method signatures (`Result<T, E>` forces callers to handle errors)
   - Sealed exception hierarchies enable exhaustive pattern matching (compiler verifies all error types handled)
   - Structured error codes (`ZAK_CALC_ERROR`) make errors machine-readable

2. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - Circuit breakers automatically fail-fast when external services are down
   - Retry policies with exponential backoff automatically retry transient failures
   - Audit logging automatically captures all error events

3. **[Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)**
   - Deterministic error handling (same input always produces same error)
   - Idempotency tokens prevent duplicate transactions after rollback
   - Atomic transactions guarantee consistent state (all-or-nothing)

## Compliance Checklist

Before deploying financial services, verify:

- [ ] Custom sealed exception hierarchy defined
- [ ] All financial operations return Result/Either types
- [ ] Transaction atomicity guaranteed with rollback
- [ ] Audit trails logged for all errors
- [ ] Retry policies configured for external services
- [ ] Circuit breakers implemented for all integrations
- [ ] Error messages sanitized (no PII, no stack traces)
- [ ] Validation errors accumulated (not fail-fast)
- [ ] Property-based tests for financial calculations
- [ ] Integration tests verify rollback and audit trails

---

## Related Documentation

**Domain Errors**:

- [DDD Standards](./ddd-standards.md) - Domain exception hierarchy and aggregate validation errors

**Security**:

- [Security Standards](./security-standards.md) - Secure error messages and PII protection in error responses

**API Responses**:

- [API Standards](./api-standards.md) - HTTP error response format and status codes

**Testing**:

- [Testing Standards](./testing-standards.md) - Exception testing patterns with AssertJ and JUnit 6

**Status**: Active (mandatory for all OSE Platform Java services)
