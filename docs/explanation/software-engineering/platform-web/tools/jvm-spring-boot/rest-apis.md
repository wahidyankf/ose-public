---
title: Spring Boot REST APIs
description: Comprehensive guide to building production-ready RESTful APIs with Spring Boot covering controllers, validation, exception handling, and HTTP semantics
category: explanation
subcategory: platform-web
tags:
  - spring-boot
  - rest-api
  - rest-controller
  - controllers
  - validation
  - http
  - exception-handling
  - api-versioning
principles:
  - explicit-over-implicit
  - simplicity-over-complexity
  - consistency
created: 2026-01-26
related:
  - ./best-practices.md
  - ./security.md
  - ./data-access.md
  - ./anti-patterns.md
---

# Spring Boot REST APIs

Building production-ready RESTful APIs requires proper controller design, request validation, exception handling, and adherence to HTTP semantics. This guide covers comprehensive REST API patterns using Spring Boot.

## 📋 Quick Reference

- [Controllers](#-controllers) - @RestController and request mapping
- [Request/Response DTOs](#-requestresponse-dtos) - Data transfer objects
- [Validation](#-validation) - Request validation patterns
- [Exception Handling](#-exception-handling) - Global error handling
- [HTTP Semantics](#-http-semantics) - Status codes and methods
- [API Versioning](#-api-versioning) - URI-based versioning
- [Pagination](#-pagination) - Page and sort parameters
- [Filtering and Searching](#-filtering-and-searching) - Query parameters
- [CORS Configuration](#-cors-configuration) - Cross-origin requests
- [Content Negotiation](#-content-negotiation) - JSON, XML responses
- [OSE Platform Examples](#-ose-platform-examples) - Islamic finance APIs
- [Best Practices](#-best-practices) - Production guidelines
- [Related Documentation](#-related-documentation) - Cross-references

### Request Pipeline Architecture

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% All colors are color-blind friendly and meet WCAG AA contrast standards

graph TD
    A[HTTP Request] --> B[DispatcherServlet]
    B --> C[Filter Chain]
    C --> D{CORS?}
    D -->|Preflight| E[CORS Filter]
    D -->|No| F[Security Filter]
    E --> F

    F --> G{Authenticated?}
    G -->|No| H[401 Unauthorized]
    G -->|Yes| I[Handler Mapping]

    I --> J{Route Found?}
    J -->|No| K[404 Not Found]
    J -->|Yes| L[Controller Method]

    L --> M{@Valid Present?}
    M -->|Yes| N[Validate DTO]
    M -->|No| O[Execute Method]

    N --> P{Valid?}
    P -->|No| Q[MethodArgumentNotValidException]
    P -->|Yes| O

    O --> R[Service Layer]
    R --> S[(Database)]
    S --> T{Result?}
    T -->|Success| U[Map to Response DTO]
    T -->|Error| V[Business Exception]

    U --> W[HTTP 200/201]
    V --> X[ExceptionHandler]

    X --> Y{Exception Type?}
    Y -->|Validation| Z[422 Unprocessable]
    Y -->|Not Found| AA[404 Not Found]
    Y -->|Other| AB[500 Server Error]

    Q --> X

    Z --> AC[Error Response JSON]
    AA --> AC
    AB --> AC
    W --> AD[Success Response JSON]

    AC --> AE[HTTP Response]
    AD --> AE
    H --> AE
    K --> AE

    style A fill:#0173B2,color:#fff
    style L fill:#029E73,color:#fff
    style R fill:#CC78BC,color:#fff
    style S fill:#DE8F05,color:#fff
    style X fill:#029E73,color:#fff
    style AE fill:#0173B2,color:#fff
```

**Pipeline Stages**:

1. **Entry** (blue): HTTP request arrives at DispatcherServlet
2. **Filters**: CORS → Security → Custom filters
3. **Authentication**: JWT/OAuth2 validation
4. **Routing**: Handler mapping finds controller method
5. **Validation**: `@Valid` triggers Bean Validation
6. **Controller** (teal): @RestController method executes
7. **Service** (purple): Business logic layer
8. **Database** (orange): JPA repositories and queries
9. **Exception Handling** (teal): @RestControllerAdvice catches exceptions
10. **Response** (blue): JSON serialization and HTTP status

**Key Components**:

- **DispatcherServlet**: Central request dispatcher
- **HandlerMapping**: Maps URLs to controller methods
- **HandlerAdapter**: Invokes controller methods
- **MessageConverter**: Serializes responses to JSON
- **ExceptionHandler**: Centralized error handling

## 🎮 Controllers

Spring Boot controllers handle HTTP requests and return responses.

### Basic REST Controller

```java
// ZakatCalculationController.java
package com.oseplatform.zakat.controller;

import com.oseplatform.zakat.dto.*;
import com.oseplatform.zakat.service.ZakatCalculationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatCalculationController {

    private final ZakatCalculationService service;

    public ZakatCalculationController(ZakatCalculationService service) {
        this.service = service;
    }

    // POST - Create new resource
    @PostMapping("/calculations")
    public ResponseEntity<ZakatCalculationResponse> createCalculation(
        @Valid @RequestBody ZakatCalculationRequest request
    ) {
        ZakatCalculationResponse response = service.createCalculation(request);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(response.getId())
            .toUri();

        return ResponseEntity.created(location).body(response);
    }

    // GET - Retrieve single resource
    @GetMapping("/calculations/{id}")
    public ResponseEntity<ZakatCalculationResponse> getCalculation(@PathVariable String id) {
        return service.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // GET - List resources
    @GetMapping("/calculations")
    public ResponseEntity<List<ZakatCalculationResponse>> listCalculations(
        @RequestParam String userId
    ) {
        List<ZakatCalculationResponse> calculations = service.findByUserId(userId);
        return ResponseEntity.ok(calculations);
    }

    // PUT - Update entire resource
    @PutMapping("/calculations/{id}")
    public ResponseEntity<ZakatCalculationResponse> updateCalculation(
        @PathVariable String id,
        @Valid @RequestBody ZakatCalculationRequest request
    ) {
        ZakatCalculationResponse response = service.updateCalculation(id, request);
        return ResponseEntity.ok(response);
    }

    // PATCH - Partial update
    @PatchMapping("/calculations/{id}")
    public ResponseEntity<ZakatCalculationResponse> patchCalculation(
        @PathVariable String id,
        @Valid @RequestBody ZakatCalculationPatchRequest request
    ) {
        ZakatCalculationResponse response = service.patchCalculation(id, request);
        return ResponseEntity.ok(response);
    }

    // DELETE - Remove resource
    @DeleteMapping("/calculations/{id}")
    public ResponseEntity<Void> deleteCalculation(@PathVariable String id) {
        service.deleteCalculation(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Request Mapping Variants

```java
// Multiple HTTP methods on same path
@RequestMapping(
    value = "/calculations/{id}",
    method = {RequestMethod.GET, RequestMethod.HEAD}
)
public ResponseEntity<ZakatCalculationResponse> getOrHeadCalculation(@PathVariable String id) {
    return service.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
}

// Consumes specific content type
@PostMapping(
    value = "/calculations",
    consumes = "application/json"
)
public ResponseEntity<ZakatCalculationResponse> createCalculationJson(
    @RequestBody ZakatCalculationRequest request
) {
    // Handle JSON request
    return ResponseEntity.ok(service.createCalculation(request));
}

// Produces specific content type
@GetMapping(
    value = "/calculations/{id}",
    produces = "application/json"
)
public ResponseEntity<ZakatCalculationResponse> getCalculationJson(@PathVariable String id) {
    // Return JSON response
    return service.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
}

// Path variables with regex patterns
@GetMapping("/calculations/{id:[0-9a-f-]{36}}")
public ResponseEntity<ZakatCalculationResponse> getCalculationWithUuid(
    @PathVariable String id
) {
    // Only matches UUID format
    return service.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
}
```

### Request Parameters

```java
// Single required parameter
@GetMapping("/calculations")
public ResponseEntity<List<ZakatCalculationResponse>> listByUser(
    @RequestParam String userId
) {
    return ResponseEntity.ok(service.findByUserId(userId));
}

// Optional parameter with default
@GetMapping("/calculations")
public ResponseEntity<List<ZakatCalculationResponse>> listWithEligibility(
    @RequestParam String userId,
    @RequestParam(required = false, defaultValue = "true") Boolean eligible
) {
    return ResponseEntity.ok(service.findByUserIdAndEligible(userId, eligible));
}

// Multiple parameters
@GetMapping("/calculations/search")
public ResponseEntity<List<ZakatCalculationResponse>> search(
    @RequestParam String userId,
    @RequestParam(required = false) Integer year,
    @RequestParam(required = false) String currency
) {
    return ResponseEntity.ok(service.search(userId, year, currency));
}

// List parameter
@GetMapping("/calculations/bulk")
public ResponseEntity<List<ZakatCalculationResponse>> getBulk(
    @RequestParam List<String> ids
) {
    return ResponseEntity.ok(service.findByIds(ids));
}
```

### Request Headers

```java
// Access request headers
@GetMapping("/calculations/{id}")
public ResponseEntity<ZakatCalculationResponse> getWithHeaders(
    @PathVariable String id,
    @RequestHeader("Accept-Language") String language,
    @RequestHeader(value = "X-Request-ID", required = false) String requestId
) {
    ZakatCalculationResponse response = service.findById(id, language)
        .orElseThrow(() -> new CalculationNotFoundException(id));

    return ResponseEntity.ok()
        .header("X-Request-ID", requestId)
        .body(response);
}

// Get all headers
@GetMapping("/calculations/{id}")
public ResponseEntity<ZakatCalculationResponse> getWithAllHeaders(
    @PathVariable String id,
    @RequestHeader Map<String, String> headers
) {
    // Access any header via headers.get("Header-Name")
    return service.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
}
```

## 📦 Request/Response DTOs

Data Transfer Objects separate API contract from domain model.

### Request DTO

```java
// ZakatCalculationRequest.java
package com.oseplatform.zakat.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class ZakatCalculationRequest {

    @NotBlank(message = "User ID is required")
    @Size(min = 36, max = 36, message = "Invalid user ID format")
    private String userId;

    @NotNull(message = "Wealth amount is required")
    @Positive(message = "Wealth must be positive")
    @DecimalMax(value = "1000000000", message = "Wealth exceeds maximum")
    private BigDecimal wealth;

    @NotNull(message = "Nisab threshold is required")
    @Positive(message = "Nisab must be positive")
    @DecimalMax(value = "1000000", message = "Nisab exceeds maximum")
    private BigDecimal nisab;

    @NotNull(message = "Currency is required")
    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency must be 3-letter ISO code")
    private String currency;

    // Getters and setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public BigDecimal getWealth() { return wealth; }
    public void setWealth(BigDecimal wealth) { this.wealth = wealth; }

    public BigDecimal getNisab() { return nisab; }
    public void setNisab(BigDecimal nisab) { this.nisab = nisab; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}
```

### Response DTO

```java
// ZakatCalculationResponse.java
package com.oseplatform.zakat.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;

public class ZakatCalculationResponse {

    private String id;
    private String userId;
    private BigDecimal wealth;
    private BigDecimal nisab;
    private BigDecimal zakatAmount;
    private Boolean eligible;
    private String currency;
    private LocalDate calculationDate;
    private Instant createdAt;
    private Instant updatedAt;

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public BigDecimal getWealth() { return wealth; }
    public void setWealth(BigDecimal wealth) { this.wealth = wealth; }

    public BigDecimal getNisab() { return nisab; }
    public void setNisab(BigDecimal nisab) { this.nisab = nisab; }

    public BigDecimal getZakatAmount() { return zakatAmount; }
    public void setZakatAmount(BigDecimal zakatAmount) { this.zakatAmount = zakatAmount; }

    public Boolean getEligible() { return eligible; }
    public void setEligible(Boolean eligible) { this.eligible = eligible; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public LocalDate getCalculationDate() { return calculationDate; }
    public void setCalculationDate(LocalDate calculationDate) { this.calculationDate = calculationDate; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
```

### DTO Mapping with MapStruct

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct-processor</artifactId>
    <version>1.5.5.Final</version>
    <scope>provided</scope>
</dependency>
```

```java
// ZakatCalculationMapper.java
package com.oseplatform.zakat.mapper;

import com.oseplatform.zakat.dto.ZakatCalculationRequest;
import com.oseplatform.zakat.dto.ZakatCalculationResponse;
import com.oseplatform.zakat.entity.ZakatCalculation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ZakatCalculationMapper {

    ZakatCalculation toEntity(ZakatCalculationRequest request);

    ZakatCalculationResponse toResponse(ZakatCalculation entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntity(ZakatCalculationRequest request, @MappingTarget ZakatCalculation entity);
}
```

## ✅ Validation

Server-side validation ensures data integrity.

### Bean Validation

```java
// Controller with validation
@RestController
@RequestMapping("/api/v1/murabaha")
@Validated
public class MurabahaApplicationController {

    private final MurabahaApplicationService service;

    @PostMapping("/applications")
    public ResponseEntity<MurabahaApplicationResponse> createApplication(
        @Valid @RequestBody MurabahaApplicationRequest request
    ) {
        // Validation happens before method execution
        MurabahaApplicationResponse response = service.createApplication(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
```

```java
// Request DTO with validation
public class MurabahaApplicationRequest {

    @NotBlank(message = "Product name is required")
    @Size(min = 3, max = 100, message = "Product name must be 3-100 characters")
    private String productName;

    @NotNull(message = "Purchase price is required")
    @Positive(message = "Purchase price must be positive")
    @DecimalMax(value = "10000000", message = "Purchase price exceeds maximum")
    private BigDecimal purchasePrice;

    @NotNull(message = "Down payment is required")
    @PositiveOrZero(message = "Down payment must be zero or positive")
    private BigDecimal downPayment;

    @NotNull(message = "Term is required")
    @Min(value = 6, message = "Minimum term is 6 months")
    @Max(value = 60, message = "Maximum term is 60 months")
    private Integer termMonths;

    // Getters and setters
}
```

### Path Variable Validation

```java
// Validate path variables
@GetMapping("/calculations/{id}")
public ResponseEntity<ZakatCalculationResponse> getCalculation(
    @PathVariable
    @Pattern(regexp = "^[0-9a-f-]{36}$", message = "Invalid UUID format")
    String id
) {
    return service.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
}
```

### Request Parameter Validation

```java
// Validate request parameters
@GetMapping("/calculations")
public ResponseEntity<List<ZakatCalculationResponse>> listCalculations(
    @RequestParam
    @NotBlank(message = "User ID is required")
    String userId,

    @RequestParam(required = false)
    @Min(value = 2000, message = "Year must be 2000 or later")
    @Max(value = 2100, message = "Year must be 2100 or earlier")
    Integer year
) {
    return ResponseEntity.ok(service.findByUserIdAndYear(userId, year));
}
```

### Custom Validation

```java
// Custom constraint annotation
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = MurabahaApplicationValidator.class)
@Documented
public @interface ValidMurabahaApplication {
    String message() default "Invalid Murabaha application";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// Validator implementation
public class MurabahaApplicationValidator
    implements ConstraintValidator<ValidMurabahaApplication, MurabahaApplicationRequest> {

    @Override
    public boolean isValid(MurabahaApplicationRequest request, ConstraintValidatorContext context) {
        if (request.getPurchasePrice() == null || request.getDownPayment() == null) {
            return true; // Let @NotNull handle null checks
        }

        // Down payment cannot exceed purchase price
        if (request.getDownPayment().compareTo(request.getPurchasePrice()) > 0) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Down payment cannot exceed purchase price"
            ).addPropertyNode("downPayment").addConstraintViolation();
            return false;
        }

        return true;
    }
}

// Apply custom validation
@ValidMurabahaApplication
public class MurabahaApplicationRequest {
    // Fields...
}
```

## ⚠️ Exception Handling

Global exception handling provides consistent error responses.

### Global Exception Handler

```java
// GlobalExceptionHandler.java
package com.oseplatform.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Handle validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
        MethodArgumentNotValidException ex,
        WebRequest request
    ) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ErrorResponse response = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation failed",
            errors,
            request.getDescription(false),
            Instant.now()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // Handle resource not found
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
        ResourceNotFoundException ex,
        WebRequest request
    ) {
        ErrorResponse response = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            null,
            request.getDescription(false),
            Instant.now()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // Handle business logic errors
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
        BusinessException ex,
        WebRequest request
    ) {
        ErrorResponse response = new ErrorResponse(
            HttpStatus.UNPROCESSABLE_ENTITY.value(),
            ex.getMessage(),
            null,
            request.getDescription(false),
            Instant.now()
        );

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
    }

    // Handle unauthorized access
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedException(
        UnauthorizedException ex,
        WebRequest request
    ) {
        ErrorResponse response = new ErrorResponse(
            HttpStatus.UNAUTHORIZED.value(),
            ex.getMessage(),
            null,
            request.getDescription(false),
            Instant.now()
        );

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    // Handle generic exceptions
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
        Exception ex,
        WebRequest request
    ) {
        ErrorResponse response = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An unexpected error occurred",
            null,
            request.getDescription(false),
            Instant.now()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
```

### Error Response DTO

```java
// ErrorResponse.java
package com.oseplatform.exception;

import java.time.Instant;
import java.util.Map;

public class ErrorResponse {

    private int status;
    private String message;
    private Map<String, String> errors;
    private String path;
    private Instant timestamp;

    public ErrorResponse(
        int status,
        String message,
        Map<String, String> errors,
        String path,
        Instant timestamp
    ) {
        this.status = status;
        this.message = message;
        this.errors = errors;
        this.path = path;
        this.timestamp = timestamp;
    }

    // Getters and setters
    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Map<String, String> getErrors() { return errors; }
    public void setErrors(Map<String, String> errors) { this.errors = errors; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
```

### Custom Exceptions

```java
// ResourceNotFoundException.java
package com.oseplatform.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }
}

// BusinessException.java
package com.oseplatform.exception;

public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }
}

// UnauthorizedException.java
package com.oseplatform.exception;

public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
```

## 🌐 HTTP Semantics

Proper HTTP methods and status codes ensure RESTful API design.

### HTTP Methods

```java
// GET - Retrieve resources (idempotent, safe)
@GetMapping("/calculations/{id}")
public ResponseEntity<ZakatCalculationResponse> get(@PathVariable String id) {
    return service.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
}

// POST - Create new resource (not idempotent)
@PostMapping("/calculations")
public ResponseEntity<ZakatCalculationResponse> create(
    @Valid @RequestBody ZakatCalculationRequest request
) {
    ZakatCalculationResponse response = service.create(request);

    URI location = ServletUriComponentsBuilder
        .fromCurrentRequest()
        .path("/{id}")
        .buildAndExpand(response.getId())
        .toUri();

    return ResponseEntity.created(location).body(response);
}

// PUT - Replace entire resource (idempotent)
@PutMapping("/calculations/{id}")
public ResponseEntity<ZakatCalculationResponse> replace(
    @PathVariable String id,
    @Valid @RequestBody ZakatCalculationRequest request
) {
    ZakatCalculationResponse response = service.replace(id, request);
    return ResponseEntity.ok(response);
}

// PATCH - Partial update (not necessarily idempotent)
@PatchMapping("/calculations/{id}")
public ResponseEntity<ZakatCalculationResponse> patch(
    @PathVariable String id,
    @Valid @RequestBody ZakatCalculationPatchRequest request
) {
    ZakatCalculationResponse response = service.patch(id, request);
    return ResponseEntity.ok(response);
}

// DELETE - Remove resource (idempotent)
@DeleteMapping("/calculations/{id}")
public ResponseEntity<Void> delete(@PathVariable String id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
}

// HEAD - Same as GET but no body (idempotent, safe)
@RequestMapping(value = "/calculations/{id}", method = RequestMethod.HEAD)
public ResponseEntity<Void> head(@PathVariable String id) {
    boolean exists = service.exists(id);
    return exists ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
}

// OPTIONS - Describe communication options (idempotent, safe)
@RequestMapping(value = "/calculations", method = RequestMethod.OPTIONS)
public ResponseEntity<Void> options() {
    return ResponseEntity.ok()
        .allow(HttpMethod.GET, HttpMethod.POST, HttpMethod.OPTIONS)
        .build();
}
```

### HTTP Status Codes

```java
// 200 OK - Successful GET, PUT, PATCH
@GetMapping("/calculations/{id}")
public ResponseEntity<ZakatCalculationResponse> get(@PathVariable String id) {
    ZakatCalculationResponse response = service.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("ZakatCalculation", "id", id));
    return ResponseEntity.ok(response); // 200
}

// 201 Created - Successful POST
@PostMapping("/calculations")
public ResponseEntity<ZakatCalculationResponse> create(
    @Valid @RequestBody ZakatCalculationRequest request
) {
    ZakatCalculationResponse response = service.create(request);

    URI location = ServletUriComponentsBuilder
        .fromCurrentRequest()
        .path("/{id}")
        .buildAndExpand(response.getId())
        .toUri();

    return ResponseEntity.created(location).body(response); // 201
}

// 204 No Content - Successful DELETE
@DeleteMapping("/calculations/{id}")
public ResponseEntity<Void> delete(@PathVariable String id) {
    service.delete(id);
    return ResponseEntity.noContent().build(); // 204
}

// 400 Bad Request - Validation errors
// Handled by GlobalExceptionHandler

// 401 Unauthorized - Authentication required
// Handled by Spring Security

// 403 Forbidden - Insufficient permissions
// Handled by Spring Security

// 404 Not Found - Resource doesn't exist
@GetMapping("/calculations/{id}")
public ResponseEntity<ZakatCalculationResponse> get(@PathVariable String id) {
    return service.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build()); // 404
}

// 409 Conflict - Resource conflict
@PostMapping("/calculations")
public ResponseEntity<ZakatCalculationResponse> create(
    @Valid @RequestBody ZakatCalculationRequest request
) {
    if (service.existsByUserIdAndDate(request.getUserId(), LocalDate.now())) {
        return ResponseEntity.status(HttpStatus.CONFLICT).build(); // 409
    }

    ZakatCalculationResponse response = service.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}

// 422 Unprocessable Entity - Business logic error
// Handled by GlobalExceptionHandler for BusinessException

// 500 Internal Server Error - Unexpected errors
// Handled by GlobalExceptionHandler
```

## 🔢 API Versioning

URI-based versioning provides clear API evolution.

### URI Versioning

```java
// Version 1 API
@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatCalculationControllerV1 {

    @PostMapping("/calculations")
    public ResponseEntity<ZakatCalculationResponseV1> create(
        @Valid @RequestBody ZakatCalculationRequestV1 request
    ) {
        // V1 implementation
        return ResponseEntity.ok(service.createV1(request));
    }
}

// Version 2 API with enhanced features
@RestController
@RequestMapping("/api/v2/zakat")
public class ZakatCalculationControllerV2 {

    @PostMapping("/calculations")
    public ResponseEntity<ZakatCalculationResponseV2> create(
        @Valid @RequestBody ZakatCalculationRequestV2 request
    ) {
        // V2 implementation with new fields
        return ResponseEntity.ok(service.createV2(request));
    }
}
```

### Deprecation Headers

```java
// Mark deprecated endpoints
@GetMapping("/calculations/{id}")
@Deprecated
public ResponseEntity<ZakatCalculationResponse> getDeprecated(@PathVariable String id) {
    ZakatCalculationResponse response = service.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("ZakatCalculation", "id", id));

    return ResponseEntity.ok()
        .header("Deprecation", "true")
        .header("Sunset", "2026-12-31T23:59:59Z")
        .header("Link", "</api/v2/zakat/calculations>; rel=\"successor-version\"")
        .body(response);
}
```

## 📄 Pagination

Pageable responses for large datasets.

### Pagination with Spring Data

```java
// Controller with pagination
@GetMapping("/calculations")
public ResponseEntity<Page<ZakatCalculationResponse>> list(
    @RequestParam String userId,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(defaultValue = "calculationDate,desc") String[] sort
) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(parseSortOrders(sort)));
    Page<ZakatCalculationResponse> calculations = service.findByUserId(userId, pageable);
    return ResponseEntity.ok(calculations);
}

private Sort.Order[] parseSortOrders(String[] sort) {
    return Arrays.stream(sort)
        .map(s -> {
            String[] parts = s.split(",");
            String property = parts[0];
            Sort.Direction direction = parts.length > 1 && parts[1].equalsIgnoreCase("desc")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
            return new Sort.Order(direction, property);
        })
        .toArray(Sort.Order[]::new);
}
```

### Custom Page Response

```java
// PageResponse.java
package com.oseplatform.common.dto;

import java.util.List;

public class PageResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;

    public PageResponse(Page<T> page) {
        this.content = page.getContent();
        this.page = page.getNumber();
        this.size = page.getSize();
        this.totalElements = page.getTotalElements();
        this.totalPages = page.getTotalPages();
        this.first = page.isFirst();
        this.last = page.isLast();
    }

    // Getters and setters
    public List<T> getContent() { return content; }
    public int getPage() { return page; }
    public int getSize() { return size; }
    public long getTotalElements() { return totalElements; }
    public int getTotalPages() { return totalPages; }
    public boolean isFirst() { return first; }
    public boolean isLast() { return last; }
}
```

## 🔍 Filtering and Searching

Query parameters for flexible data retrieval.

### Simple Filtering

```java
// Filter by multiple criteria
@GetMapping("/calculations/search")
public ResponseEntity<List<ZakatCalculationResponse>> search(
    @RequestParam String userId,
    @RequestParam(required = false) Boolean eligible,
    @RequestParam(required = false) String currency,
    @RequestParam(required = false) Integer year
) {
    ZakatCalculationSearchCriteria criteria = new ZakatCalculationSearchCriteria(
        userId, eligible, currency, year
    );

    List<ZakatCalculationResponse> results = service.search(criteria);
    return ResponseEntity.ok(results);
}
```

### Specification Pattern

```java
// ZakatCalculationSpecification.java
package com.oseplatform.zakat.specification;

import com.oseplatform.zakat.entity.ZakatCalculation;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ZakatCalculationSpecification {

    public static Specification<ZakatCalculation> hasUserId(String userId) {
        return (root, query, cb) -> cb.equal(root.get("userId"), userId);
    }

    public static Specification<ZakatCalculation> isEligible(Boolean eligible) {
        return (root, query, cb) -> eligible == null ? null : cb.equal(root.get("eligible"), eligible);
    }

    public static Specification<ZakatCalculation> hasCurrency(String currency) {
        return (root, query, cb) -> currency == null ? null : cb.equal(root.get("currency"), currency);
    }

    public static Specification<ZakatCalculation> calculatedInYear(Integer year) {
        return (root, query, cb) -> {
            if (year == null) return null;

            LocalDate start = LocalDate.of(year, 1, 1);
            LocalDate end = LocalDate.of(year, 12, 31);

            return cb.between(root.get("calculationDate"), start, end);
        };
    }

    public static Specification<ZakatCalculation> wealthGreaterThan(BigDecimal minWealth) {
        return (root, query, cb) -> minWealth == null ? null : cb.greaterThan(root.get("wealth"), minWealth);
    }
}
```

```java
// Repository with Specification support
public interface ZakatCalculationRepository
    extends JpaRepository<ZakatCalculation, String>, JpaSpecificationExecutor<ZakatCalculation> {
}

// Service using specifications
@Service
public class ZakatCalculationService {

    private final ZakatCalculationRepository repository;

    public List<ZakatCalculationResponse> search(ZakatCalculationSearchCriteria criteria) {
        Specification<ZakatCalculation> spec = Specification
            .where(ZakatCalculationSpecification.hasUserId(criteria.getUserId()))
            .and(ZakatCalculationSpecification.isEligible(criteria.getEligible()))
            .and(ZakatCalculationSpecification.hasCurrency(criteria.getCurrency()))
            .and(ZakatCalculationSpecification.calculatedInYear(criteria.getYear()));

        return repository.findAll(spec).stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());
    }
}
```

## 🔐 CORS Configuration

Cross-Origin Resource Sharing allows browser requests from different origins.

### Global CORS Configuration

```java
// CorsConfig.java
package com.oseplatform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Allow credentials
        config.setAllowCredentials(true);

        // Allow specific origins
        config.addAllowedOrigin("https://app.oseplatform.com");
        config.addAllowedOrigin("https://admin.oseplatform.com");

        // Allow all headers
        config.addAllowedHeader("*");

        // Allow specific methods
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("PATCH");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("OPTIONS");

        // Expose specific headers to client
        config.addExposedHeader("Authorization");
        config.addExposedHeader("X-Request-ID");

        // Cache preflight response for 1 hour
        config.setMaxAge(3600L);

        source.registerCorsConfiguration("/api/**", config);

        return new CorsFilter(source);
    }
}
```

### Controller-Level CORS

```java
// CORS on specific controller
@RestController
@RequestMapping("/api/v1/zakat")
@CrossOrigin(
    origins = "https://app.oseplatform.com",
    methods = {RequestMethod.GET, RequestMethod.POST},
    maxAge = 3600
)
public class ZakatCalculationController {
    // Controller methods...
}

// CORS on specific method
@GetMapping("/calculations/{id}")
@CrossOrigin(origins = "https://external.example.com")
public ResponseEntity<ZakatCalculationResponse> get(@PathVariable String id) {
    return service.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
}
```

## 📝 Content Negotiation

Support multiple response formats (JSON, XML).

### JSON (Default)

```java
// JSON response (default)
@GetMapping(value = "/calculations/{id}", produces = "application/json")
public ResponseEntity<ZakatCalculationResponse> getJson(@PathVariable String id) {
    return service.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
}
```

### XML Support

```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.fasterxml.jackson.dataformat</groupId>
    <artifactId>jackson-dataformat-xml</artifactId>
</dependency>
```

```java
// XML response
@GetMapping(value = "/calculations/{id}", produces = "application/xml")
public ResponseEntity<ZakatCalculationResponse> getXml(@PathVariable String id) {
    return service.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
}

// Support both JSON and XML
@GetMapping(
    value = "/calculations/{id}",
    produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE}
)
public ResponseEntity<ZakatCalculationResponse> get(@PathVariable String id) {
    // Returns JSON or XML based on Accept header
    return service.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
}
```

## 💼 OSE Platform Examples

Complete REST API patterns for Islamic finance operations.

### Zakat Calculation API

```java
// Complete Zakat API controller
@RestController
@RequestMapping("/api/v1/zakat")
@Validated
public class ZakatCalculationController {

    private final ZakatCalculationService service;

    public ZakatCalculationController(ZakatCalculationService service) {
        this.service = service;
    }

    // Create new calculation
    @PostMapping("/calculations")
    public ResponseEntity<ZakatCalculationResponse> create(
        @Valid @RequestBody ZakatCalculationRequest request
    ) {
        ZakatCalculationResponse response = service.create(request);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(response.getId())
            .toUri();

        return ResponseEntity.created(location).body(response);
    }

    // Get calculation by ID
    @GetMapping("/calculations/{id}")
    public ResponseEntity<ZakatCalculationResponse> getById(@PathVariable String id) {
        return service.findById(id)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new ResourceNotFoundException("ZakatCalculation", "id", id));
    }

    // List user's calculations with pagination
    @GetMapping("/calculations")
    public ResponseEntity<Page<ZakatCalculationResponse>> list(
        @RequestParam String userId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("calculationDate").descending());
        Page<ZakatCalculationResponse> calculations = service.findByUserId(userId, pageable);
        return ResponseEntity.ok(calculations);
    }

    // Search calculations
    @GetMapping("/calculations/search")
    public ResponseEntity<List<ZakatCalculationResponse>> search(
        @RequestParam String userId,
        @RequestParam(required = false) Boolean eligible,
        @RequestParam(required = false) Integer year
    ) {
        List<ZakatCalculationResponse> results = service.search(userId, eligible, year);
        return ResponseEntity.ok(results);
    }

    // Get annual summary
    @GetMapping("/calculations/summary/{year}")
    public ResponseEntity<ZakatAnnualSummaryResponse> getAnnualSummary(
        @RequestParam String userId,
        @PathVariable Integer year
    ) {
        ZakatAnnualSummaryResponse summary = service.getAnnualSummary(userId, year);
        return ResponseEntity.ok(summary);
    }

    // Delete calculation
    @DeleteMapping("/calculations/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Murabaha Application API

```java
// Complete Murabaha API controller
@RestController
@RequestMapping("/api/v1/murabaha")
@Validated
public class MurabahaApplicationController {

    private final MurabahaApplicationService service;

    public MurabahaApplicationController(MurabahaApplicationService service) {
        this.service = service;
    }

    // Submit application
    @PostMapping("/applications")
    public ResponseEntity<MurabahaApplicationResponse> submit(
        @Valid @RequestBody MurabahaApplicationRequest request
    ) {
        MurabahaApplicationResponse response = service.submitApplication(request);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(response.getId())
            .toUri();

        return ResponseEntity.created(location).body(response);
    }

    // Get application with installments
    @GetMapping("/applications/{id}")
    public ResponseEntity<MurabahaApplicationDetailResponse> getById(@PathVariable String id) {
        MurabahaApplicationDetailResponse response = service.findByIdWithInstallments(id);
        return ResponseEntity.ok(response);
    }

    // List user's applications
    @GetMapping("/applications")
    public ResponseEntity<Page<MurabahaApplicationResponse>> list(
        @RequestParam String userId,
        @RequestParam(required = false) String status,
        Pageable pageable
    ) {
        Page<MurabahaApplicationResponse> applications = service.findByUserIdAndStatus(userId, status, pageable);
        return ResponseEntity.ok(applications);
    }

    // Update application status (admin only)
    @PatchMapping("/applications/{id}/status")
    public ResponseEntity<MurabahaApplicationResponse> updateStatus(
        @PathVariable String id,
        @Valid @RequestBody StatusUpdateRequest request
    ) {
        MurabahaApplicationResponse response = service.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(response);
    }

    // Mark installment as paid
    @PostMapping("/applications/{id}/installments/{installmentId}/pay")
    public ResponseEntity<InstallmentResponse> markInstallmentPaid(
        @PathVariable String id,
        @PathVariable String installmentId
    ) {
        InstallmentResponse response = service.markInstallmentPaid(installmentId);
        return ResponseEntity.ok(response);
    }

    // Get payment schedule
    @GetMapping("/applications/{id}/schedule")
    public ResponseEntity<List<InstallmentResponse>> getPaymentSchedule(@PathVariable String id) {
        List<InstallmentResponse> schedule = service.getPaymentSchedule(id);
        return ResponseEntity.ok(schedule);
    }
}
```

### Waqf Project API

```java
// Complete Waqf API controller
@RestController
@RequestMapping("/api/v1/waqf")
@Validated
public class WaqfProjectController {

    private final WaqfProjectService service;

    public WaqfProjectController(WaqfProjectService service) {
        this.service = service;
    }

    // Create project (admin only)
    @PostMapping("/projects")
    public ResponseEntity<WaqfProjectResponse> create(
        @Valid @RequestBody WaqfProjectRequest request
    ) {
        WaqfProjectResponse response = service.createProject(request);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(response.getId())
            .toUri();

        return ResponseEntity.created(location).body(response);
    }

    // Get project details
    @GetMapping("/projects/{id}")
    public ResponseEntity<WaqfProjectDetailResponse> getById(@PathVariable String id) {
        WaqfProjectDetailResponse response = service.findByIdWithDetails(id);
        return ResponseEntity.ok(response);
    }

    // List active projects with pagination
    @GetMapping("/projects")
    public ResponseEntity<Page<WaqfProjectResponse>> list(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String category,
        Pageable pageable
    ) {
        Page<WaqfProjectResponse> projects = service.findByStatusAndCategory(status, category, pageable);
        return ResponseEntity.ok(projects);
    }

    // Get projects needing funding
    @GetMapping("/projects/funding-needed")
    public ResponseEntity<List<WaqfProjectResponse>> getProjectsNeedingFunding(
        @RequestParam(defaultValue = "10") int limit
    ) {
        List<WaqfProjectResponse> projects = service.findProjectsNeedingFunding(limit);
        return ResponseEntity.ok(projects);
    }

    // Submit donation
    @PostMapping("/projects/{id}/donate")
    public ResponseEntity<DonationResponse> donate(
        @PathVariable String id,
        @Valid @RequestBody DonationRequest request
    ) {
        DonationResponse response = service.processDonation(id, request);
        return ResponseEntity.ok(response);
    }

    // Get donation history
    @GetMapping("/donations")
    public ResponseEntity<Page<DonationResponse>> getDonationHistory(
        @RequestParam String userId,
        Pageable pageable
    ) {
        Page<DonationResponse> donations = service.findDonationsByUser(userId, pageable);
        return ResponseEntity.ok(donations);
    }

    // Get project statistics
    @GetMapping("/projects/{id}/stats")
    public ResponseEntity<WaqfProjectStatsResponse> getStatistics(@PathVariable String id) {
        WaqfProjectStatsResponse stats = service.getProjectStatistics(id);
        return ResponseEntity.ok(stats);
    }
}
```

## ✅ Best Practices

Production guidelines for REST API design.

### API Design Best Practices

- **Use nouns for resources** - `/api/v1/zakat/calculations` not `/api/v1/calculate-zakat`
- **Use HTTP methods correctly** - GET for retrieval, POST for creation, PUT for replacement, PATCH for updates
- **Return appropriate status codes** - 200 for success, 201 for creation, 404 for not found
- **Use plural nouns** - `/calculations` not `/calculation`
- **Nest resources logically** - `/applications/{id}/installments` for sub-resources
- **Version your API** - `/api/v1/` for clear versioning

### DTO Best Practices

- **Separate request/response DTOs** - Different validation for input vs output
- **Don't expose entities** - Use DTOs to decouple API from domain model
- **Use validation annotations** - Validate at API boundary
- **Immutable DTOs** - Consider using records for DTOs
- **Map entities to DTOs** - Use MapStruct or manual mapping

### Validation Best Practices

- **Validate at controller layer** - Use `@Valid` on request bodies
- **Provide clear error messages** - Meaningful validation messages
- **Custom validators for complex rules** - Business logic validation
- **Validate path variables** - Don't assume valid input
- **Return 400 for validation errors** - Proper HTTP status

### Exception Handling Best Practices

- **Global exception handler** - Consistent error responses
- **Custom exceptions** - Domain-specific exceptions
- **Don't leak implementation details** - Generic messages for security
- **Include timestamp and path** - Help debugging
- **Log exceptions** - Monitor and track errors

### Performance Best Practices

- **Use pagination** - Limit response size
- **Enable compression** - Reduce bandwidth
- **Cache responses** - Use ETag and Cache-Control headers
- **Optimize queries** - Prevent N+1 problems
- **Use projections** - Return only needed fields

## 🔗 Related Documentation

- [Spring Boot Best Practices](best-practices.md) - Production standards and patterns
- [Spring Boot Security](security.md) - API security patterns
- [Spring Boot Data Access](data-access.md) - Repository integration
- [Spring Boot Anti-Patterns](anti-patterns.md) - Common API mistakes

---

**Next Steps:**

- Review [Testing](testing.md) for API testing patterns
- Explore [Observability](observability.md) for API monitoring
- Check [Performance](performance.md) for optimization

## See Also

**OSE Explanation Foundation**:

- [Spring Framework REST APIs](../jvm-spring/rest-apis.md) - Manual Spring REST
- [Java API Design](../../../programming-languages/java/api-standards.md) - Java API baseline
- [Spring Boot Idioms](./idioms.md) - REST patterns
- [Spring Boot Security](./security.md) - API security
