---
title: Spring Framework API Standards for OSE Platform
description: Prescriptive REST API design requirements for Spring-based Shariah-compliant financial systems
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - ose-platform
  - rest-api
  - spring-mvc
  - hateoas
  - validation
  - standards
principles:
  - explicit-over-implicit
  - simplicity-over-complexity
created: 2026-02-06
updated: 2026-02-06
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Spring Framework fundamentals from AyoKoding Spring Learning Path before using these standards.

**This document is OSE Platform-specific**, not a Spring tutorial. We define HOW to apply Spring in THIS codebase, not WHAT Spring is.

**See**: [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md)

# Spring Framework API Standards for OSE Platform

**OSE-specific prescriptive standards** for REST API design in Spring-based Shariah-compliant financial applications. This document defines **mandatory requirements** using RFC 2119 keywords (MUST, SHOULD, MAY).

**Prerequisites**: Understanding of Spring Framework fundamentals from AyoKoding Spring Framework and HTTP/REST API principles.

## Purpose

REST API design in Spring-based OSE Platform services enables:

- **RESTful Resource Design**: Standard HTTP methods and status codes for financial operations
- **Content Negotiation**: JSON/XML support for diverse client requirements
- **Request Validation**: Bean Validation for request integrity
- **HATEOAS**: Hypermedia links for API discoverability
- **Pagination/Filtering**: Efficient data retrieval for large datasets
- **API Versioning**: Backward compatibility for evolving APIs

### @RestController Standards

**REQUIRED**: All REST API controllers MUST use `@RestController` annotation.

```java
@RestController
@RequestMapping("/api/v1/zakat")
@Validated  // REQUIRED: Enable method-level validation
public class ZakatController {

  private static final Logger logger = LoggerFactory.getLogger(ZakatController.class);

  private final ZakatCalculationService zakatCalculationService;
  private final ZakatPaymentService zakatPaymentService;

  public ZakatController(
    ZakatCalculationService zakatCalculationService,
    ZakatPaymentService zakatPaymentService
  ) {
    this.zakatCalculationService = zakatCalculationService;
    this.zakatPaymentService = zakatPaymentService;
  }

  // POST /api/v1/zakat/calculations
  @PostMapping("/calculations")
  public ResponseEntity<ZakatCalculationResponse> calculateZakat(
    @Valid @RequestBody CalculateZakatRequest request
  ) {
    logger.info("Calculating Zakat for account: {}", request.accountId());

    ZakatResult result = zakatCalculationService.calculate(request.accountId());

    ZakatCalculationResponse response = new ZakatCalculationResponse(
      result.accountId(),
      result.wealth(),
      result.nisab(),
      result.zakatAmount(),
      result.calculationDate()
    );

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  // GET /api/v1/zakat/calculations/{calculationId}
  @GetMapping("/calculations/{calculationId}")
  public ResponseEntity<ZakatCalculationResponse> getCalculation(
    @PathVariable String calculationId
  ) {
    logger.info("Retrieving Zakat calculation: {}", calculationId);

    ZakatResult result = zakatCalculationService.getById(calculationId);

    ZakatCalculationResponse response = new ZakatCalculationResponse(
      result.accountId(),
      result.wealth(),
      result.nisab(),
      result.zakatAmount(),
      result.calculationDate()
    );

    return ResponseEntity.ok(response);
  }

  // POST /api/v1/zakat/payments
  @PostMapping("/payments")
  public ResponseEntity<ZakatPaymentResponse> processPayment(
    @Valid @RequestBody ProcessZakatPaymentRequest request
  ) throws ZakatPaymentException {
    logger.info("Processing Zakat payment for account: {}", request.accountId());

    ZakatTransaction transaction = zakatPaymentService.processPayment(request);

    ZakatPaymentResponse response = new ZakatPaymentResponse(
      transaction.transactionId(),
      transaction.accountId(),
      transaction.amount(),
      transaction.paymentDate(),
      transaction.status()
    );

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }
}
```

**REQUIRED**: REST controllers MUST:

- Use `@RestController` (combines `@Controller` + `@ResponseBody`)
- Use `@RequestMapping` for base path with API version (`/api/v1/...`)
- Use `@Validated` for method-level validation
- Inject services via constructor injection
- Return `ResponseEntity<T>` for explicit HTTP status control
- Log all operations for audit trails

### Standard HTTP Method Mapping

**REQUIRED**: Use standard HTTP methods for resource operations.

```java
@RestController
@RequestMapping("/api/v1/donations")
public class DonationController {

  private final DonationService donationService;

  // CREATE - POST
  @PostMapping
  public ResponseEntity<DonationResponse> createDonation(
    @Valid @RequestBody CreateDonationRequest request
  ) throws DonationException {
    Donation donation = donationService.create(request);
    DonationResponse response = toResponse(donation);

    // REQUIRED: 201 Created with Location header
    URI location = URI.create("/api/v1/donations/" + donation.getId());
    return ResponseEntity.created(location).body(response);
  }

  // READ (single) - GET
  @GetMapping("/{donationId}")
  public ResponseEntity<DonationResponse> getDonation(
    @PathVariable String donationId
  ) {
    Donation donation = donationService.getById(donationId);
    DonationResponse response = toResponse(donation);

    // REQUIRED: 200 OK
    return ResponseEntity.ok(response);
  }

  // READ (collection) - GET
  @GetMapping
  public ResponseEntity<Page<DonationResponse>> getAllDonations(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(required = false) String donorId
  ) {
    PageRequest pageRequest = PageRequest.of(page, size);
    Page<Donation> donations = donationService.findAll(donorId, pageRequest);

    Page<DonationResponse> response = donations.map(this::toResponse);

    // REQUIRED: 200 OK
    return ResponseEntity.ok(response);
  }

  // UPDATE (full) - PUT
  @PutMapping("/{donationId}")
  public ResponseEntity<DonationResponse> updateDonation(
    @PathVariable String donationId,
    @Valid @RequestBody UpdateDonationRequest request
  ) throws DonationException {
    Donation donation = donationService.update(donationId, request);
    DonationResponse response = toResponse(donation);

    // REQUIRED: 200 OK
    return ResponseEntity.ok(response);
  }

  // UPDATE (partial) - PATCH
  @PatchMapping("/{donationId}")
  public ResponseEntity<DonationResponse> partialUpdateDonation(
    @PathVariable String donationId,
    @Valid @RequestBody PatchDonationRequest request
  ) throws DonationException {
    Donation donation = donationService.partialUpdate(donationId, request);
    DonationResponse response = toResponse(donation);

    // REQUIRED: 200 OK
    return ResponseEntity.ok(response);
  }

  // DELETE - DELETE
  @DeleteMapping("/{donationId}")
  public ResponseEntity<Void> deleteDonation(
    @PathVariable String donationId
  ) throws DonationException {
    donationService.delete(donationId);

    // REQUIRED: 204 No Content
    return ResponseEntity.noContent().build();
  }

  private DonationResponse toResponse(Donation donation) {
    return new DonationResponse(
      donation.getId().getValue(),
      donation.getAmount(),
      donation.getCharityCategory(),
      donation.getDonorId(),
      donation.getDonationDate()
    );
  }
}
```

**REQUIRED**: HTTP method mapping:

- **POST**: Create new resources (201 Created + Location header)
- **GET**: Retrieve resources (200 OK)
- **PUT**: Full resource update (200 OK)
- **PATCH**: Partial resource update (200 OK)
- **DELETE**: Delete resources (204 No Content)

### Standard Status Code Usage

**REQUIRED**: Use appropriate HTTP status codes for all responses.

```java
@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

  private final AccountService accountService;

  // 200 OK - Successful GET
  @GetMapping("/{accountId}")
  public ResponseEntity<AccountResponse> getAccount(
    @PathVariable String accountId
  ) {
    Account account = accountService.getById(accountId);
    return ResponseEntity.ok(toResponse(account));  // 200 OK
  }

  // 201 Created - Successful POST
  @PostMapping
  public ResponseEntity<AccountResponse> createAccount(
    @Valid @RequestBody CreateAccountRequest request
  ) throws AccountException {
    Account account = accountService.create(request);
    URI location = URI.create("/api/v1/accounts/" + account.getId());

    return ResponseEntity
      .created(location)  // 201 Created
      .body(toResponse(account));
  }

  // 204 No Content - Successful DELETE
  @DeleteMapping("/{accountId}")
  public ResponseEntity<Void> deleteAccount(
    @PathVariable String accountId
  ) throws AccountException {
    accountService.delete(accountId);
    return ResponseEntity.noContent().build();  // 204 No Content
  }

  // 400 Bad Request - Validation error (handled by @ControllerAdvice)
  // 404 Not Found - Resource not found (handled by @ControllerAdvice)
  // 409 Conflict - Business rule violation (handled by @ControllerAdvice)
  // 500 Internal Server Error - Unexpected error (handled by @ControllerAdvice)

  private AccountResponse toResponse(Account account) {
    return new AccountResponse(
      account.getId().getValue(),
      account.getBalance(),
      account.getCurrency(),
      account.getStatus()
    );
  }
}
```

**REQUIRED**: HTTP status code usage:

- **200 OK**: Successful GET, PUT, PATCH
- **201 Created**: Successful POST with Location header
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Validation errors, malformed requests
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Authenticated but not authorized
- **404 Not Found**: Resource not found
- **409 Conflict**: Business rule violations (insufficient funds, duplicate transactions)
- **500 Internal Server Error**: Unexpected server errors

### JSON and XML Support

**REQUIRED**: Support JSON content negotiation. XML is optional.

```java
@RestController
@RequestMapping("/api/v1/murabaha")
public class MurabahaContractController {

  private final MurabahaContractService contractService;

  // REQUIRED: Default to JSON, support XML if needed
  @GetMapping(
    value = "/{contractId}",
    produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE}
  )
  public ResponseEntity<MurabahaContractResponse> getContract(
    @PathVariable String contractId
  ) {
    MurabahaContract contract = contractService.getById(contractId);
    MurabahaContractResponse response = toResponse(contract);

    return ResponseEntity.ok(response);
  }

  @PostMapping(
    consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE},
    produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE}
  )
  public ResponseEntity<MurabahaContractResponse> createContract(
    @Valid @RequestBody CreateMurabahaContractRequest request
  ) throws MurabahaException {
    MurabahaContract contract = contractService.create(request);
    MurabahaContractResponse response = toResponse(contract);

    URI location = URI.create("/api/v1/murabaha/" + contract.getId());
    return ResponseEntity.created(location).body(response);
  }

  private MurabahaContractResponse toResponse(MurabahaContract contract) {
    return new MurabahaContractResponse(
      contract.getId().getValue(),
      contract.getCustomerId(),
      contract.getPrincipal(),
      contract.getProfitRate(),
      contract.getTotalAmount(),
      contract.getStatus()
    );
  }
}
```

**REQUIRED**: Content negotiation MUST:

- Default to JSON (`application/json`)
- Use `produces` and `consumes` annotations explicitly
- Support XML only if client requirements demand it

### Validation Annotations

**REQUIRED**: Use Bean Validation annotations for all request DTOs.

```java
// REQUIRED: Validation annotations on request DTOs
public record CreateDonationRequest(
  @NotNull(message = "Donor ID is required")
  String donorId,

  @NotNull(message = "Amount is required")
  @DecimalMin(value = "0.01", message = "Amount must be positive")
  BigDecimal amount,

  @NotNull(message = "Currency is required")
  @Size(min = 3, max = 3, message = "Currency must be 3 characters (ISO 4217)")
  String currency,

  @NotNull(message = "Charity category is required")
  @Pattern(
    regexp = "EDUCATION|HEALTHCARE|POVERTY_RELIEF|DISASTER_RELIEF",
    message = "Invalid charity category"
  )
  String charityCategory,

  @NotNull(message = "Donation date is required")
  @PastOrPresent(message = "Donation date cannot be in the future")
  LocalDate donationDate
) {}
```

**REQUIRED**: Validation annotations MUST:

- Use `@NotNull` for required fields
- Use `@DecimalMin`/`@DecimalMax` for numeric constraints
- Use `@Size` for string length constraints
- Use `@Pattern` for regex validation
- Use `@PastOrPresent`/`@FutureOrPresent` for date constraints
- Provide clear error messages

### Custom Validation

**REQUIRED**: Create custom validators for complex business rules.

```java
// Custom annotation
@Target({ElementType.TYPE, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = SufficientFundsValidator.class)
public @interface SufficientFunds {
  String message() default "Insufficient funds for this transaction";
  Class<?>[] groups() default {};
  Class<? extends Payload>[] payload() default {};
}

// Custom validator
public class SufficientFundsValidator
  implements ConstraintValidator<SufficientFunds, ProcessZakatPaymentRequest> {

  private final AccountRepository accountRepository;

  public SufficientFundsValidator(AccountRepository accountRepository) {
    this.accountRepository = accountRepository;
  }

  @Override
  public boolean isValid(
    ProcessZakatPaymentRequest request,
    ConstraintValidatorContext context
  ) {
    if (request == null || request.accountId() == null || request.amount() == null) {
      return true;  // Let @NotNull handle null checks
    }

    Account account = accountRepository.findById(request.accountId())
      .orElse(null);

    if (account == null) {
      return true;  // Let business logic handle missing account
    }

    return account.getBalance().greaterThanOrEqual(Money.of(request.amount()));
  }
}

// Apply custom validation
@SufficientFunds  // REQUIRED: Custom validation at class level
public record ProcessZakatPaymentRequest(
  @NotNull(message = "Account ID is required")
  String accountId,

  @NotNull(message = "Amount is required")
  @DecimalMin(value = "0.01", message = "Amount must be positive")
  BigDecimal amount,

  @NotNull(message = "Currency is required")
  String currency
) {}
```

### Hypermedia Links

**RECOMMENDED**: Implement HATEOAS for API discoverability.

```java
@RestController
@RequestMapping("/api/v1/donations")
public class DonationController {

  private final DonationService donationService;

  @GetMapping("/{donationId}")
  public ResponseEntity<EntityModel<DonationResponse>> getDonation(
    @PathVariable String donationId
  ) {
    Donation donation = donationService.getById(donationId);
    DonationResponse response = toResponse(donation);

    // RECOMMENDED: Add HATEOAS links
    EntityModel<DonationResponse> resource = EntityModel.of(response);

    // Self link
    resource.add(linkTo(methodOn(DonationController.class)
      .getDonation(donationId))
      .withSelfRel());

    // Related links
    resource.add(linkTo(methodOn(DonationController.class)
      .getAllDonations(0, 20, donation.getDonorId()))
      .withRel("all-donations"));

    resource.add(linkTo(methodOn(DonorController.class)
      .getDonor(donation.getDonorId()))
      .withRel("donor"));

    return ResponseEntity.ok(resource);
  }
}

// Example JSON response with HATEOAS:
// {
//   "id": "don-12345",
//   "amount": 100.00,
//   "charityCategory": "EDUCATION",
//   "donorId": "donor-67890",
//   "donationDate": "2026-02-06",
//   "_links": {
//     "self": {
//       "href": "http://localhost:8080/api/v1/donations/don-12345"
//     },
//     "all-donations": {
//       "href": "http://localhost:8080/api/v1/donations?donorId=donor-67890"
//     },
//     "donor": {
//       "href": "http://localhost:8080/api/v1/donors/donor-67890"
//     }
//   }
// }
```

### Pagination Standards

**REQUIRED**: Implement pagination for all collection endpoints.

```java
@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

  private final TransactionService transactionService;

  @GetMapping
  public ResponseEntity<Page<TransactionResponse>> getTransactions(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(defaultValue = "transactionDate,desc") String[] sort,
    @RequestParam(required = false) String accountId,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
  ) {
    // REQUIRED: Validate page size (prevent excessive data retrieval)
    if (size > 100) {
      throw new IllegalArgumentException("Page size cannot exceed 100");
    }

    // REQUIRED: Build sort from string array (e.g., ["transactionDate,desc", "amount,asc"])
    List<Sort.Order> orders = Arrays.stream(sort)
      .map(s -> {
        String[] parts = s.split(",");
        String property = parts[0];
        Sort.Direction direction = parts.length > 1 && parts[1].equalsIgnoreCase("desc")
          ? Sort.Direction.DESC
          : Sort.Direction.ASC;
        return new Sort.Order(direction, property);
      })
      .toList();

    PageRequest pageRequest = PageRequest.of(page, size, Sort.by(orders));

    // Filter by criteria
    TransactionFilter filter = new TransactionFilter(accountId, startDate, endDate);
    Page<Transaction> transactions = transactionService.findAll(filter, pageRequest);

    Page<TransactionResponse> response = transactions.map(this::toResponse);

    return ResponseEntity.ok(response);
  }

  private TransactionResponse toResponse(Transaction transaction) {
    return new TransactionResponse(
      transaction.getId().getValue(),
      transaction.getAccountId(),
      transaction.getAmount(),
      transaction.getType(),
      transaction.getTransactionDate()
    );
  }
}

// Example pagination response:
// {
//   "content": [
//     { "id": "txn-1", "amount": 100.00, ... },
//     { "id": "txn-2", "amount": 200.00, ... }
//   ],
//   "pageable": {
//     "pageNumber": 0,
//     "pageSize": 20,
//     "sort": { "sorted": true, "unsorted": false }
//   },
//   "totalPages": 5,
//   "totalElements": 100,
//   "last": false,
//   "first": true
// }
```

**REQUIRED**: Pagination MUST:

- Use `page` and `size` query parameters (0-indexed pages)
- Limit maximum page size (100 items max)
- Use `sort` parameter with format `property,direction` (e.g., `transactionDate,desc`)
- Return Spring `Page<T>` with metadata (totalPages, totalElements, etc.)

### Filtering Standards

**REQUIRED**: Use query parameters for filtering.

```java
@RestController
@RequestMapping("/api/v1/zakat/calculations")
public class ZakatCalculationController {

  private final ZakatCalculationService calculationService;

  @GetMapping
  public ResponseEntity<Page<ZakatCalculationResponse>> getCalculations(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(required = false) String accountId,
    @RequestParam(required = false) @DecimalMin("0") BigDecimal minAmount,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate calculationDate
  ) {
    PageRequest pageRequest = PageRequest.of(page, size);

    ZakatCalculationFilter filter = ZakatCalculationFilter.builder()
      .accountId(accountId)
      .minAmount(minAmount != null ? Money.of(minAmount) : null)
      .calculationDate(calculationDate)
      .build();

    Page<ZakatCalculation> calculations = calculationService.findAll(filter, pageRequest);
    Page<ZakatCalculationResponse> response = calculations.map(this::toResponse);

    return ResponseEntity.ok(response);
  }

  private ZakatCalculationResponse toResponse(ZakatCalculation calculation) {
    return new ZakatCalculationResponse(
      calculation.getId().getValue(),
      calculation.getAccountId(),
      calculation.getWealth(),
      calculation.getNisab(),
      calculation.getZakatAmount(),
      calculation.getCalculationDate()
    );
  }
}
```

### URI Versioning

**REQUIRED**: Use URI-based API versioning.

```java
// Version 1
@RestController
@RequestMapping("/api/v1/donations")
public class DonationControllerV1 {
  // V1 implementation
}

// Version 2 (with breaking changes)
@RestController
@RequestMapping("/api/v2/donations")
public class DonationControllerV2 {
  // V2 implementation with new fields, different response format
}
```

**REQUIRED**: API versioning MUST:

- Use URI path versioning (`/api/v1/`, `/api/v2/`)
- Maintain backward compatibility within major version
- Document breaking changes in release notes

### OSE Platform Standards

- **[Spring Error Handling Standards](./ex-soen-plwe-to-jvsp__error-handling-standards.md)** - Error response format
- **[Spring DDD Standards](./ex-soen-plwe-to-jvsp__ddd-standards.md)** - Domain model to DTO conversion (this file references the DDD standards file to be created)

### Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[REST APIs](./ex-soen-plwe-to-jvsp__rest-apis.md)** - REST API development guide
- **[Web MVC](./ex-soen-plwe-to-jvsp__web-mvc.md)** - Spring MVC patterns

### Learning Resources

For learning Spring Framework fundamentals and concepts referenced in these standards, see:

- **[Spring By Example](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/by-example/_index.md)** - Annotated Spring code examples

**Note**: These standards assume you've learned Spring basics from ayokoding-web. We don't re-explain fundamental concepts here.

### Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Explicit Over Implicit](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - HTTP status codes explicitly communicate operation results
   - `@Valid` explicitly triggers validation
   - `ResponseEntity<T>` makes HTTP response structure explicit

2. **[Simplicity Over Complexity](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - Standard HTTP methods reduce cognitive load
   - Consistent pagination parameters (`page`, `size`, `sort`)
   - URI-based versioning is simpler than header-based

3. **[Automation Over Manual](../../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - Bean Validation automatically validates requests
   - `@ControllerAdvice` automatically handles errors
   - Spring Data pagination automatically generates metadata

## Compliance Checklist

Before deploying Spring REST APIs, verify:

- [ ] All controllers use `@RestController`
- [ ] All request DTOs use Bean Validation annotations
- [ ] All collection endpoints support pagination
- [ ] Maximum page size enforced (100 items)
- [ ] Filtering uses query parameters (not path variables)
- [ ] Sorting supports multiple fields with direction
- [ ] HTTP methods follow REST conventions (POST=Create, GET=Read, etc.)
- [ ] HTTP status codes follow standards (200, 201, 204, 400, 404, 409, 500)
- [ ] Content negotiation defaults to JSON
- [ ] API versioning uses URI path (`/api/v1/`)

## See Also

**OSE Explanation Foundation**:

- [Java API Design](../../../programming-languages/java/ex-soen-prla-ja__api-standards.md) - Java API baseline
- [Spring Framework Idioms](./ex-soen-plwe-to-jvsp__idioms.md) - API patterns
- [Spring Framework REST APIs](./ex-soen-plwe-to-jvsp__rest-apis.md) - REST implementation
- [Spring Framework Security](./ex-soen-plwe-to-jvsp__security.md) - API security

**Spring Boot Extension**:

- [Spring Boot REST APIs](../jvm-spring-boot/ex-soen-plwe-to-jvspbo__rest-apis.md) - Boot API patterns

---

**Last Updated**: 2026-02-06

**Status**: Mandatory (required for all OSE Platform Spring REST APIs)
