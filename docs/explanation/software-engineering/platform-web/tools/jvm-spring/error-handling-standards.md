---
title: Spring Framework Error Handling Standards for OSE Platform
description: Prescriptive error handling requirements for Spring-based Shariah-compliant financial systems
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - ose-platform
  - error-handling
  - financial-systems
  - standards
  - rest-api
  - transactions
principles:
  - explicit-over-implicit
  - reproducibility
created: 2026-02-06
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Spring Framework fundamentals from AyoKoding Spring Learning Path before using these standards.

**This document is OSE Platform-specific**, not a Spring tutorial. We define HOW to apply Spring in THIS codebase, not WHAT Spring is.

**See**: [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md)

# Spring Framework Error Handling Standards for OSE Platform

**OSE-specific prescriptive standards** for error handling in Spring-based Shariah-compliant financial applications. This document defines **mandatory requirements** using RFC 2119 keywords (MUST, SHOULD, MAY).

**Prerequisites**: Understanding of Spring Framework fundamentals from AyoKoding Spring Framework and Java error handling from Java Error Handling Standards.

## Purpose

Error handling in Spring-based OSE Platform services extends Java error handling standards with Spring-specific mechanisms:

- **Spring Exception Hierarchy**: `@ResponseStatus`, `@ExceptionHandler`, `@ControllerAdvice` for HTTP error responses
- **Transaction Rollback Rules**: `@Transactional` configuration for financial atomicity
- **Global Exception Handling**: Centralized error handling across REST APIs
- **Domain vs Infrastructure Separation**: Clear exception boundaries in Spring components
- **Financial Transaction Atomicity**: Ensuring Zakat, donations, and Murabaha operations are atomic

### Custom Exception Hierarchy with Spring Annotations

**REQUIRED**: All REST API exceptions MUST use `@ResponseStatus` for HTTP status mapping.

```java
// Domain exceptions with HTTP status mapping
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class ZakatValidationException extends OseFinancialException {
  public ZakatValidationException(String message, String errorCode) {
    super(message, errorCode);
  }
}

@ResponseStatus(HttpStatus.NOT_FOUND)
public class AccountNotFoundException extends OseFinancialException {
  public AccountNotFoundException(String accountId) {
    super("Account not found: " + accountId, "ACC_NOT_FOUND");
  }
}

@ResponseStatus(HttpStatus.CONFLICT)
public class InsufficientFundsException extends OseFinancialException {
  private final Money requiredAmount;
  private final Money availableAmount;

  public InsufficientFundsException(Money required, Money available) {
    super("Insufficient funds", "TXN_INSUFFICIENT_FUNDS");
    this.requiredAmount = required;
    this.availableAmount = available;
  }

  public Money getRequiredAmount() { return requiredAmount; }
  public Money getAvailableAmount() { return availableAmount; }
}
```

**REQUIRED**: Exception HTTP status mapping:

- **400 Bad Request**: Validation errors (`ZakatValidationException`, `InvalidDonationException`)
- **404 Not Found**: Resource not found (`AccountNotFoundException`, `ContractNotFoundException`)
- **409 Conflict**: Business rule violations (`InsufficientFundsException`, `DuplicateTransactionException`)
- **500 Internal Server Error**: Infrastructure failures (database errors, external service failures)

### Domain Exception vs Infrastructure Exception

**REQUIRED**: Separate domain exceptions from infrastructure exceptions.

```java
// Domain exceptions (business rule violations)
public sealed class ZakatDomainException extends OseFinancialException
  permits ZakatValidationException, ZakatCalculationException, ZakatIneligibleException {

  protected ZakatDomainException(String message, String errorCode) {
    super(message, errorCode);
  }
}

// Infrastructure exceptions (technical failures)
public sealed class ZakatInfrastructureException extends OseFinancialException
  permits ZakatRepositoryException, ZakatEventPublishException {

  protected ZakatInfrastructureException(String message, String errorCode, Throwable cause) {
    super(message, errorCode, cause);
  }
}
```

**REQUIRED**: Domain exceptions MUST NOT leak infrastructure details (no SQL queries, stack traces, file paths in messages).

### Centralized Exception Handler

**REQUIRED**: All Spring REST APIs MUST implement `@ControllerAdvice` for global exception handling.

```java
@ControllerAdvice
@RestController
public class GlobalExceptionHandler {

  private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  // Handle domain validation errors (400 Bad Request)
  @ExceptionHandler(ZakatValidationException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ErrorResponse handleValidationException(
    ZakatValidationException ex,
    WebRequest request
  ) {
    logError(ex, request);
    return new ErrorResponse(
      ex.getErrorCode(),
      "Validation failed: " + sanitizeMessage(ex.getMessage()),
      generateCorrelationId(request)
    );
  }

  // Handle resource not found (404 Not Found)
  @ExceptionHandler(AccountNotFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  public ErrorResponse handleNotFound(
    AccountNotFoundException ex,
    WebRequest request
  ) {
    logError(ex, request);
    return new ErrorResponse(
      ex.getErrorCode(),
      "Resource not found",  // Generic message, no account ID
      generateCorrelationId(request)
    );
  }

  // Handle business rule violations (409 Conflict)
  @ExceptionHandler(InsufficientFundsException.class)
  @ResponseStatus(HttpStatus.CONFLICT)
  public ErrorResponse handleInsufficientFunds(
    InsufficientFundsException ex,
    WebRequest request
  ) {
    logError(ex, request);
    return new ErrorResponse(
      ex.getErrorCode(),
      "Insufficient funds for this transaction",
      generateCorrelationId(request)
    );
  }

  // Handle all other exceptions (500 Internal Server Error)
  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ErrorResponse handleGenericException(
    Exception ex,
    WebRequest request
  ) {
    logger.error("Unhandled exception", ex);  // Full stack trace in logs
    return new ErrorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred",  // REQUIRED: No stack trace in response
      generateCorrelationId(request)
    );
  }

  private void logError(Exception ex, WebRequest request) {
    String correlationId = generateCorrelationId(request);
    logger.error(
      "Error processing request. CorrelationId: {}, ErrorCode: {}, Message: {}",
      correlationId,
      extractErrorCode(ex),
      ex.getMessage(),
      ex  // Full exception with stack trace
    );
  }

  private String extractErrorCode(Exception ex) {
    if (ex instanceof OseFinancialException) {
      return ((OseFinancialException) ex).getErrorCode();
    }
    return "UNKNOWN_ERROR";
  }

  private String sanitizeMessage(String message) {
    // REQUIRED: Remove PII, account numbers, balances
    return message.replaceAll("\\d{10,}", "***");  // Mask account numbers
  }

  private String generateCorrelationId(WebRequest request) {
    return UUID.randomUUID().toString();
  }
}
```

**REQUIRED**: Global exception handler MUST:

- Handle all exception types (domain, infrastructure, generic)
- Map exceptions to appropriate HTTP status codes
- Sanitize error messages (no PII, no sensitive data)
- Log complete error details internally
- Return correlation IDs for support ticket lookup
- NEVER return stack traces to clients

### ErrorResponse Standard Format

**REQUIRED**: All error responses MUST use consistent JSON structure.

```java
public record ErrorResponse(
  String errorCode,      // Machine-readable code (e.g., "ZAK_CALC_ERROR")
  String message,        // Human-readable message (sanitized)
  String correlationId   // For support ticket lookup
) {}

// Example JSON response:
// {
//   "errorCode": "TXN_INSUFFICIENT_FUNDS",
//   "message": "Insufficient funds for this transaction",
//   "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
// }
```

**RECOMMENDED**: Include timestamp and path for additional context:

```java
public record ErrorResponse(
  String errorCode,
  String message,
  String correlationId,
  Instant timestamp,     // When error occurred
  String path            // Request path
) {}
```

### @Transactional Configuration for Financial Operations

**REQUIRED**: All financial operations MUST use `@Transactional` with explicit rollback rules.

```java
@Service
public class ZakatPaymentService {

  private final AccountRepository accountRepository;
  private final ZakatFundRepository zakatFundRepository;
  private final ApplicationEventPublisher eventPublisher;

  // REQUIRED: Explicit rollback rules for checked exceptions
  @Transactional(
    rollbackFor = {ZakatPaymentException.class, AccountException.class},
    noRollbackFor = {ZakatNotificationException.class}  // Non-critical errors
  )
  public ZakatTransaction processZakatPayment(ProcessZakatRequest request)
    throws ZakatPaymentException {

    // 1. Validate eligibility
    Account account = accountRepository.findById(request.accountId())
      .orElseThrow(() -> new AccountNotFoundException(request.accountId()));

    if (!account.isActive()) {
      throw new ZakatPaymentException("Account is not active", "ACC_INACTIVE");
    }

    // 2. Calculate Zakat
    Money zakatAmount = calculateZakat(account);

    if (zakatAmount.isZero()) {
      throw new ZakatPaymentException("Account below Nisab threshold", "ZAK_BELOW_NISAB");
    }

    // 3. Debit account (ATOMIC)
    account.debit(zakatAmount);
    accountRepository.save(account);

    // 4. Credit Zakat fund (ATOMIC)
    zakatFundRepository.creditZakat(zakatAmount);

    // 5. Record transaction
    ZakatTransaction transaction = new ZakatTransaction(
      UUID.randomUUID(),
      account.getId(),
      zakatAmount,
      Instant.now()
    );

    // 6. Publish event (ATOMIC - rollback if event fails)
    eventPublisher.publishEvent(new ZakatPaidEvent(transaction));

    return transaction;
  }

  private Money calculateZakat(Account account) {
    BigDecimal zakatRate = new BigDecimal("0.025");  // 2.5%
    return account.getBalance().multiply(zakatRate);
  }
}
```

**REQUIRED**: Transaction configuration MUST:

- Use `rollbackFor` for ALL checked exceptions that should trigger rollback
- Use `noRollbackFor` for non-critical exceptions (notifications, logging)
- Default isolation level: `ISOLATION_READ_COMMITTED` (can be overridden)
- Default propagation: `PROPAGATION_REQUIRED` (can be overridden)

### Rollback Rules for Different Exception Types

**REQUIRED**: Rollback configuration by exception category:

```java
// Financial transactions - rollback on ALL errors
@Transactional(
  rollbackFor = Exception.class,  // Rollback for all exceptions
  isolation = Isolation.SERIALIZABLE  // Highest isolation for financial integrity
)
public void processMurabahaPayment(MurabahaPayment payment) {
  // Implementation
}

// Data mutations - rollback on domain errors only
@Transactional(
  rollbackFor = {ValidationException.class, BusinessRuleException.class},
  noRollbackFor = {NotificationException.class}
)
public void updateAccountDetails(UpdateAccountRequest request) {
  // Implementation
}

// Read-only operations - no rollback needed
@Transactional(readOnly = true)
public List<ZakatTransaction> getZakatHistory(String accountId) {
  return zakatTransactionRepository.findByAccountId(accountId);
}
```

**PROHIBITED**: Using `@Transactional` without explicit `rollbackFor` for financial operations (defaults only rollback on `RuntimeException`).

### Multi-Step Financial Operations

**REQUIRED**: All multi-step financial operations MUST be atomic.

```java
@Service
public class DonationService {

  private final DonationRepository donationRepository;
  private final AccountRepository accountRepository;
  private final CharityFundRepository charityFundRepository;

  @Transactional(
    rollbackFor = Exception.class,
    isolation = Isolation.SERIALIZABLE
  )
  public DonationReceipt processDonation(CreateDonationRequest request)
    throws DonationException {

    try {
      // Step 1: Validate donor account
      Account donorAccount = accountRepository.findById(request.donorAccountId())
        .orElseThrow(() -> new AccountNotFoundException(request.donorAccountId()));

      // Step 2: Validate donation amount
      if (donorAccount.getBalance().lessThan(request.amount())) {
        throw new InsufficientFundsException(request.amount(), donorAccount.getBalance());
      }

      // Step 3: Create donation record (ATOMIC)
      Donation donation = Donation.create(
        UUID.randomUUID(),
        request.donorAccountId(),
        request.amount(),
        request.charityCategory(),
        Instant.now()
      );
      donationRepository.save(donation);

      // Step 4: Debit donor account (ATOMIC)
      donorAccount.debit(request.amount());
      accountRepository.save(donorAccount);

      // Step 5: Credit charity fund (ATOMIC)
      charityFundRepository.credit(request.charityCategory(), request.amount());

      // Step 6: Generate receipt
      return new DonationReceipt(
        donation.getId(),
        donation.getAmount(),
        donation.getCharityCategory(),
        donation.getDonationDate()
      );

    } catch (Exception ex) {
      // Log complete error details
      logger.error(
        "Donation processing failed. DonorAccountId: {}, Amount: {}",
        request.donorAccountId(),
        request.amount(),
        ex
      );

      // REQUIRED: Transaction automatically rolled back
      throw new DonationException("Donation processing failed", "DON_PROCESSING_FAILED", ex);
    }
  }
}
```

**REQUIRED**: Multi-step financial operations MUST:

- Wrap all steps in single `@Transactional` method
- Use `isolation = Isolation.SERIALIZABLE` for financial integrity
- Rollback entire transaction on ANY error
- Log complete error context (account IDs, amounts, timestamp)
- Return structured error response (no partial state exposed)

### Compensating Transactions

**REQUIRED**: External service calls MUST use compensating transactions (saga pattern).

```java
@Service
public class MurabahaContractService {

  private final ContractRepository contractRepository;
  private final PaymentGatewayClient paymentGatewayClient;
  private final ApplicationEventPublisher eventPublisher;

  @Transactional(rollbackFor = Exception.class)
  public ContractActivationResult activateMurabahaContract(ActivateContractRequest request)
    throws ContractActivationException {

    String paymentId = null;

    try {
      // Step 1: Update contract status (ATOMIC)
      MurabahaContract contract = contractRepository.findById(request.contractId())
        .orElseThrow(() -> new ContractNotFoundException(request.contractId()));

      contract.activate();
      contractRepository.save(contract);

      // Step 2: Charge payment gateway (EXTERNAL - not in transaction)
      paymentId = paymentGatewayClient.chargeInitialPayment(
        contract.getCustomerId(),
        contract.getInitialPayment()
      );

      // Step 3: Record payment reference (ATOMIC)
      contract.recordPayment(paymentId);
      contractRepository.save(contract);

      // Step 4: Publish activation event
      eventPublisher.publishEvent(new ContractActivatedEvent(contract.getId()));

      return new ContractActivationResult(contract.getId(), paymentId);

    } catch (PaymentGatewayException ex) {
      // REQUIRED: Compensating transaction - reverse contract activation
      if (paymentId != null) {
        try {
          paymentGatewayClient.refundPayment(paymentId);
        } catch (Exception refundEx) {
          logger.error("Compensating transaction failed. PaymentId: {}", paymentId, refundEx);
          // Alert operations team for manual intervention
        }
      }

      // REQUIRED: Transaction rolled back
      throw new ContractActivationException(
        "Contract activation failed",
        "CTR_ACTIVATION_FAILED",
        ex
      );
    }
  }
}
```

**REQUIRED**: Compensating transactions MUST:

- Track external operation IDs (payment IDs, reference numbers)
- Implement reverse operations (refunds, cancellations)
- Log compensating transaction failures
- Alert operations team if compensation fails

### Bean Validation Integration

**REQUIRED**: Use Bean Validation annotations with `@Valid` for request validation.

```java
@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatController {

  private final ZakatPaymentService zakatPaymentService;

  @PostMapping("/payments")
  public ResponseEntity<ZakatTransaction> processZakatPayment(
    @Valid @RequestBody ProcessZakatRequest request  // REQUIRED: @Valid triggers validation
  ) throws ZakatPaymentException {

    ZakatTransaction transaction = zakatPaymentService.processZakatPayment(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
  }
}

// Request DTO with validation annotations
public record ProcessZakatRequest(
  @NotNull(message = "Account ID is required")
  String accountId,

  @NotNull(message = "Zakat amount is required")
  @DecimalMin(value = "0.01", message = "Zakat amount must be positive")
  BigDecimal zakatAmount,

  @NotNull(message = "Payment date is required")
  @PastOrPresent(message = "Payment date cannot be in the future")
  LocalDate paymentDate
) {}
```

**REQUIRED**: Handle validation errors with `@ExceptionHandler`:

```java
@ControllerAdvice
public class GlobalExceptionHandler {

  // Handle Bean Validation errors
  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ValidationErrorResponse handleValidationErrors(
    MethodArgumentNotValidException ex
  ) {
    List<FieldError> fieldErrors = ex.getBindingResult().getFieldErrors();

    Map<String, String> errors = fieldErrors.stream()
      .collect(Collectors.toMap(
        FieldError::getField,
        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value"
      ));

    return new ValidationErrorResponse(
      "VALIDATION_ERROR",
      "Request validation failed",
      errors,
      UUID.randomUUID().toString()
    );
  }
}

public record ValidationErrorResponse(
  String errorCode,
  String message,
  Map<String, String> fieldErrors,  // Field -> error message mapping
  String correlationId
) {}

// Example JSON response:
// {
//   "errorCode": "VALIDATION_ERROR",
//   "message": "Request validation failed",
//   "fieldErrors": {
//     "accountId": "Account ID is required",
//     "zakatAmount": "Zakat amount must be positive"
//   },
//   "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
// }
```

### Error Logging with Spring AOP

**REQUIRED**: Use Spring AOP for automatic error audit logging.

```java
@Aspect
@Component
public class FinancialErrorAuditAspect {

  private final AuditLogRepository auditLogRepository;

  @AfterThrowing(
    pointcut = "@within(org.springframework.stereotype.Service) && " +
               "execution(* com.oseplatform..*Service.*(..))",
    throwing = "ex"
  )
  public void logServiceError(JoinPoint joinPoint, Exception ex) {
    String methodName = joinPoint.getSignature().getName();
    String className = joinPoint.getTarget().getClass().getSimpleName();
    Object[] args = joinPoint.getArgs();

    AuditLog auditLog = AuditLog.builder()
      .timestamp(Instant.now())
      .eventType("SERVICE_ERROR")
      .className(className)
      .methodName(methodName)
      .errorCode(extractErrorCode(ex))
      .errorMessage(sanitizeMessage(ex.getMessage()))
      .arguments(sanitizeArguments(args))
      .correlationId(UUID.randomUUID().toString())
      .build();

    auditLogRepository.save(auditLog);
  }

  private String extractErrorCode(Exception ex) {
    if (ex instanceof OseFinancialException) {
      return ((OseFinancialException) ex).getErrorCode();
    }
    return "UNKNOWN_ERROR";
  }

  private String sanitizeMessage(String message) {
    // REQUIRED: Remove PII and sensitive data
    return message.replaceAll("\\d{10,}", "***");
  }

  private String sanitizeArguments(Object[] args) {
    // REQUIRED: Remove sensitive data from arguments
    return Arrays.stream(args)
      .map(arg -> arg.getClass().getSimpleName())
      .collect(Collectors.joining(", "));
  }
}
```

### OSE Platform Standards

- **[Spring API Standards](./api-standards.md)** - REST API error response conventions (this file references the API standards file to be created)
- **[Spring DDD Standards](./ddd-standards.md)** - Domain exception hierarchy patterns (this file references the DDD standards file to be created)

### Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Dependency Injection](./dependency-injection.md)** - Spring IoC container
- **[REST APIs](./rest-apis.md)** - REST API development
- **[Testing](./testing.md)** - Exception testing patterns

### Learning Resources

For learning Spring Framework fundamentals and concepts referenced in these standards, see:

- **[Spring By Example](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/by-example/_index.md)** - Annotated Spring code examples

**Note**: These standards assume you've learned Spring basics from ayokoding-web. We don't re-explain fundamental concepts here.

### Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Explicit Over Implicit](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - `@Transactional(rollbackFor = Exception.class)` makes rollback rules explicit
   - `@ResponseStatus` explicitly maps exceptions to HTTP status codes
   - ErrorResponse with correlation IDs makes error tracking explicit

2. **[Automation Over Manual](../../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - `@ControllerAdvice` automatically handles exceptions across all controllers
   - Spring AOP automatically logs errors without manual try-catch blocks
   - Bean Validation automatically validates requests before method execution

3. **[Reproducibility](../../../../../../governance/principles/software-engineering/reproducibility.md)**
   - Transaction isolation levels guarantee consistent error behavior
   - Correlation IDs enable error reproduction from logs
   - Atomic transactions ensure consistent state on rollback

## Compliance Checklist

Before deploying Spring-based financial services, verify:

- [ ] Custom exception hierarchy with `@ResponseStatus` annotations
- [ ] `@ControllerAdvice` global exception handler implemented
- [ ] All financial operations use `@Transactional` with explicit `rollbackFor`
- [ ] Multi-step financial operations wrapped in single transaction
- [ ] Error responses use consistent ErrorResponse format
- [ ] Error messages sanitized (no PII, no stack traces)
- [ ] Correlation IDs generated for all error responses
- [ ] Bean Validation with `@Valid` for request validation
- [ ] Compensating transactions for external service calls
- [ ] Audit trail logging with Spring AOP

## See Also

**OSE Explanation Foundation**:

- [Java Error Handling](../../../programming-languages/java/error-handling-standards.md) - Java exception baseline
- [Spring Framework Idioms](./idioms.md) - Error patterns
- [Spring Framework Best Practices](./best-practices.md) - Error standards
- [Spring Framework REST APIs](./rest-apis.md) - API error responses

**Spring Boot Extension**:

- [Spring Boot REST APIs](../jvm-spring-boot/rest-apis.md) - Boot error handling

---

**Status**: Mandatory (required for all OSE Platform Spring services)
