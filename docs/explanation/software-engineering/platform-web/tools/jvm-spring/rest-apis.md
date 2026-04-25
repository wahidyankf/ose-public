---
title: Spring Framework REST APIs
description: RESTful services covering @RestController, request validation, DTO pattern, exception handling for REST, ResponseEntity, HATEOAS, content negotiation, API versioning, and Islamic finance examples
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - rest-apis
  - restful
  - http
  - java
  - kotlin
principles:
  - explicit-over-implicit
created: 2026-01-29
---

# Spring Framework REST APIs

**Understanding-oriented documentation** for building RESTful web services with Spring MVC.

## Overview

This document covers RESTful API development with Spring Framework, including request/response handling, validation, error handling, and Islamic finance API examples (Zakat, Murabaha, donations).

**Version**: Spring Framework 6.1+ (Java 17+, Kotlin 1.9+)

## Quick Reference

**Jump to:**

- [@RestController](#restcontroller)
- [Request Validation](#request-validation)
- [DTO Pattern](#dto-pattern)
- [Exception Handling for REST](#exception-handling-for-rest)
- [ResponseEntity](#responseentity)
- [Content Negotiation](#content-negotiation)
- [API Versioning](#api-versioning)

## @RestController

**Java Example** (Zakat Calculation API):

```java
@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatCalculationController {
  private final ZakatCalculationService service;

  public ZakatCalculationController(ZakatCalculationService service) {
    this.service = service;
  }

  @PostMapping("/calculate")
  public ResponseEntity<ZakatCalculationResponse> calculate(
    @RequestBody @Valid CreateZakatCalculationRequest request
  ) {
    ZakatCalculationResponse response = service.calculate(request);
    return ResponseEntity.status(HttpStatus.CREATED)
      .header("X-Resource-Id", response.id())
      .body(response);
  }

  @GetMapping("/{id}")
  public ResponseEntity<ZakatCalculationResponse> getCalculation(@PathVariable String id) {
    return service.findById(id)
      .map(ResponseEntity::ok)
      .orElse(ResponseEntity.notFound().build());
  }

  @GetMapping
  public ResponseEntity<List<ZakatCalculationResponse>> getCalculations(
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
  ) {
    List<ZakatCalculationResponse> calculations = service.findByDateRange(startDate, endDate);
    return ResponseEntity.ok(calculations);
  }
}
```

**Kotlin Example**:

```kotlin
@RestController
@RequestMapping("/api/v1/zakat")
class ZakatCalculationController(private val service: ZakatCalculationService) {

  @PostMapping("/calculate")
  fun calculate(
    @RequestBody @Valid request: CreateZakatCalculationRequest
  ): ResponseEntity<ZakatCalculationResponse> {
    val response = service.calculate(request)
    return ResponseEntity.status(HttpStatus.CREATED)
      .header("X-Resource-Id", response.id)
      .body(response)
  }

  @GetMapping("/{id}")
  fun getCalculation(@PathVariable id: String): ResponseEntity<ZakatCalculationResponse> =
    service.findById(id)
      ?.let { ResponseEntity.ok(it) }
      ?: ResponseEntity.notFound().build()

  @GetMapping
  fun getCalculations(
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?
  ): ResponseEntity<List<ZakatCalculationResponse>> {
    val calculations = service.findByDateRange(startDate, endDate)
    return ResponseEntity.ok(calculations)
  }
}
```

## Request Validation

**Java Example** (Murabaha Contract Request):

```java
public record CreateMurabahaContractRequest(
  @NotNull(message = "Asset cost is required")
  @DecimalMin(value = "1000.0", message = "Asset cost must be at least 1000")
  BigDecimal assetCost,

  @NotNull(message = "Down payment is required")
  @DecimalMin(value = "0.0", message = "Down payment cannot be negative")
  BigDecimal downPayment,

  @NotNull(message = "Profit rate is required")
  @DecimalMin(value = "0.01", message = "Profit rate must be at least 0.01")
  @DecimalMax(value = "0.15", message = "Profit rate cannot exceed 0.15")
  BigDecimal profitRate,

  @NotNull(message = "Term months is required")
  @Min(value = 1, message = "Term must be at least 1 month")
  @Max(value = 360, message = "Term cannot exceed 360 months")
  Integer termMonths
) {
  @AssertTrue(message = "Down payment must be less than asset cost")
  private boolean isDownPaymentValid() {
    return downPayment.compareTo(assetCost) < 0;
  }
}

@RestController
@RequestMapping("/api/v1/contracts")
public class MurabahaContractController {

  @PostMapping
  public ResponseEntity<MurabahaContractResponse> createContract(
    @RequestBody @Valid CreateMurabahaContractRequest request
  ) {
    // Validation automatically applied
    MurabahaContractResponse response = service.createContract(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }
}
```

**Kotlin Example**:

```kotlin
data class CreateMurabahaContractRequest(
  @field:NotNull(message = "Asset cost is required")
  @field:DecimalMin(value = "1000.0", message = "Asset cost must be at least 1000")
  val assetCost: BigDecimal,

  @field:NotNull(message = "Down payment is required")
  @field:DecimalMin(value = "0.0", message = "Down payment cannot be negative")
  val downPayment: BigDecimal,

  @field:NotNull(message = "Profit rate is required")
  @field:DecimalMin(value = "0.01", message = "Profit rate must be at least 0.01")
  @field:DecimalMax(value = "0.15", message = "Profit rate cannot exceed 0.15")
  val profitRate: BigDecimal,

  @field:NotNull(message = "Term months is required")
  @field:Min(value = 1, message = "Term must be at least 1 month")
  @field:Max(value = 360, message = "Term cannot exceed 360 months")
  val termMonths: Int
) {
  @AssertTrue(message = "Down payment must be less than asset cost")
  fun isDownPaymentValid(): Boolean = downPayment < assetCost
}
```

## DTO Pattern

**Java Example** (Donation DTOs):

```java
// Request DTO
public record CreateDonationRequest(
  @NotNull BigDecimal amount,
  @NotNull DonationCategory category,
  @NotBlank String donorId,
  @NotNull LocalDate donationDate
) {}

// Response DTO
public record DonationResponse(
  String id,
  BigDecimal amount,
  DonationCategory category,
  String donorId,
  LocalDate donationDate,
  Instant createdAt
) {}

// Service layer
@Service
public class DonationService {

  public DonationResponse processDonation(CreateDonationRequest request) {
    // Convert request DTO to domain entity
    Donation donation = Donation.create(
      request.amount(),
      request.category(),
      request.donorId(),
      request.donationDate()
    );

    repository.save(donation);

    // Convert domain entity to response DTO
    return toResponse(donation);
  }

  private DonationResponse toResponse(Donation donation) {
    return new DonationResponse(
      donation.getId().getValue(),
      donation.getAmount().getAmount(),
      donation.getCategory(),
      donation.getDonorId(),
      donation.getDonationDate(),
      donation.getCreatedAt()
    );
  }
}
```

**Kotlin Example**:

```kotlin
// Request DTO
data class CreateDonationRequest(
  @field:NotNull val amount: BigDecimal,
  @field:NotNull val category: DonationCategory,
  @field:NotBlank val donorId: String,
  @field:NotNull val donationDate: LocalDate
)

// Response DTO
data class DonationResponse(
  val id: String,
  val amount: BigDecimal,
  val category: DonationCategory,
  val donorId: String,
  val donationDate: LocalDate,
  val createdAt: Instant
)

// Service layer
@Service
class DonationService(private val repository: DonationRepository) {

  fun processDonation(request: CreateDonationRequest): DonationResponse {
    // Convert request DTO to domain entity
    val donation = Donation.create(
      request.amount,
      request.category,
      request.donorId,
      request.donationDate
    )

    repository.save(donation)

    // Convert domain entity to response DTO
    return donation.toResponse()
  }

  private fun Donation.toResponse(): DonationResponse = DonationResponse(
    id.value,
    amount.amount,
    category,
    donorId,
    donationDate,
    createdAt
  )
}
```

## Exception Handling for REST

**Java Example** (Global Exception Handler):

```java
@ControllerAdvice
public class RestExceptionHandler {

  @ExceptionHandler(ZakatCalculationNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleZakatCalculationNotFound(
    ZakatCalculationNotFoundException ex,
    HttpServletRequest request
  ) {
    ErrorResponse error = new ErrorResponse(
      Instant.now(),
      HttpStatus.NOT_FOUND.value(),
      "Zakat Calculation Not Found",
      ex.getMessage(),
      request.getRequestURI()
    );

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ValidationErrorResponse> handleValidationError(
    MethodArgumentNotValidException ex,
    HttpServletRequest request
  ) {
    Map<String, String> fieldErrors = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(error ->
      fieldErrors.put(error.getField(), error.getDefaultMessage())
    );

    ValidationErrorResponse error = new ValidationErrorResponse(
      Instant.now(),
      HttpStatus.BAD_REQUEST.value(),
      "Validation Failed",
      fieldErrors,
      request.getRequestURI()
    );

    return ResponseEntity.badRequest().body(error);
  }

  @ExceptionHandler(ContractValidationException.class)
  public ResponseEntity<ErrorResponse> handleContractValidation(
    ContractValidationException ex,
    HttpServletRequest request
  ) {
    ErrorResponse error = new ErrorResponse(
      Instant.now(),
      HttpStatus.BAD_REQUEST.value(),
      "Contract Validation Failed",
      ex.getMessage(),
      request.getRequestURI(),
      ex.getErrors()
    );

    return ResponseEntity.badRequest().body(error);
  }
}

// Error response DTOs
public record ErrorResponse(
  Instant timestamp,
  int status,
  String error,
  String message,
  String path,
  List<String> validationErrors
) {
  public ErrorResponse(Instant timestamp, int status, String error, String message, String path) {
    this(timestamp, status, error, message, path, List.of());
  }
}

public record ValidationErrorResponse(
  Instant timestamp,
  int status,
  String error,
  Map<String, String> fieldErrors,
  String path
) {}
```

## ResponseEntity

**Java Example** (Status Codes and Headers):

```java
@RestController
@RequestMapping("/api/v1/donations")
public class DonationController {

  @PostMapping
  public ResponseEntity<DonationResponse> createDonation(@RequestBody @Valid CreateDonationRequest request) {
    DonationResponse response = service.processDonation(request);

    // 201 Created with Location header
    URI location = URI.create("/api/v1/donations/" + response.id());
    return ResponseEntity.created(location)
      .header("X-Donation-Receipt", generateReceiptId())
      .body(response);
  }

  @GetMapping("/{id}")
  public ResponseEntity<DonationResponse> getDonation(@PathVariable String id) {
    return service.findById(id)
      .map(donation -> ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS))
        .body(donation))
      .orElse(ResponseEntity.notFound().build());
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteDonation(@PathVariable String id) {
    service.deleteDonation(id);
    return ResponseEntity.noContent().build();  // 204 No Content
  }

  @GetMapping("/export")
  public ResponseEntity<byte[]> exportDonations() {
    byte[] csvData = service.exportToCsv();

    return ResponseEntity.ok()
      .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=donations.csv")
      .contentType(MediaType.parseMediaType("text/csv"))
      .body(csvData);
  }

  private String generateReceiptId() {
    return UUID.randomUUID().toString();
  }
}
```

## Content Negotiation

**Java Example** (JSON and XML):

```java
@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatCalculationController {

  @GetMapping(value = "/{id}", produces = {
    MediaType.APPLICATION_JSON_VALUE,
    MediaType.APPLICATION_XML_VALUE
  })
  public ResponseEntity<ZakatCalculationResponse> getCalculation(@PathVariable String id) {
    // Returns JSON or XML based on Accept header
    return service.findById(id)
      .map(ResponseEntity::ok)
      .orElse(ResponseEntity.notFound().build());
  }
}

// Response DTO with XML annotations
@XmlRootElement(name = "zakatCalculation")
public class ZakatCalculationResponse {
  private String id;
  private BigDecimal wealth;
  private BigDecimal nisab;
  private BigDecimal zakatAmount;
  private boolean eligible;

  // Getters, setters, constructors
}
```

### URI Versioning

**Java Example**:

```java
@RestController
@RequestMapping("/api/v1/donations")
public class DonationControllerV1 {
  // Version 1 API
}

@RestController
@RequestMapping("/api/v2/donations")
public class DonationControllerV2 {
  // Version 2 API with breaking changes
}
```

### Header Versioning

**Java Example**:

```java
@RestController
@RequestMapping("/api/donations")
public class DonationController {

  @GetMapping(headers = "X-API-Version=1")
  public List<DonationResponseV1> getDonationsV1() {
    // Version 1
  }

  @GetMapping(headers = "X-API-Version=2")
  public List<DonationResponseV2> getDonationsV2() {
    // Version 2
  }
}
```

### Zakat Calculator API

**Complete Example**:

```java
@RestController
@RequestMapping("/api/v1/zakat")
@Validated
public class ZakatCalculatorController {
  private final ZakatCalculationService service;

  public ZakatCalculatorController(ZakatCalculationService service) {
    this.service = service;
  }

  @PostMapping("/calculate")
  @ResponseStatus(HttpStatus.CREATED)
  public ZakatCalculationResponse calculateZakat(
    @RequestBody @Valid ZakatCalculationRequest request
  ) {
    return service.calculate(request);
  }

  @GetMapping("/nisab/current")
  public NisabResponse getCurrentNisab(@RequestParam String currency) {
    return service.getCurrentNisab(currency);
  }

  @GetMapping("/calculations/{id}")
  public ResponseEntity<ZakatCalculationResponse> getCalculation(@PathVariable String id) {
    return service.findById(id)
      .map(ResponseEntity::ok)
      .orElse(ResponseEntity.notFound().build());
  }

  @GetMapping("/calculations")
  public PagedResponse<ZakatCalculationResponse> getCalculations(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(required = false) LocalDate startDate,
    @RequestParam(required = false) LocalDate endDate
  ) {
    return service.findCalculations(page, size, startDate, endDate);
  }
}
```

### Core Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Web MVC](web-mvc.md)** - MVC fundamentals
- **[Best Practices](best-practices.md)** - REST API standards

## See Also

**OSE Explanation Foundation**:

- [Java API Design](../../../programming-languages/java/api-standards.md) - Java API baseline
- [Spring Framework Idioms](./idioms.md) - REST patterns
- [Spring Framework Web MVC](./web-mvc.md) - MVC foundation
- [Spring Framework Security](./security.md) - API security

**Hands-on Learning (AyoKoding)**:

- [Spring In-the-Field - API Development](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/in-the-field/rest-apis.md) - Production APIs

**Spring Boot Extension**:

- [Spring Boot REST APIs](../jvm-spring-boot/rest-apis.md) - Auto-configured REST

---

**Spring Framework Version**: 6.1+ (Java 17+, Kotlin 1.9+)
**Maintainers**: Platform Documentation Team
