---
title: "Exception Handling"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 10000032
description: "ServletException try-catch to @ExceptionHandler to @ControllerAdvice progression for production error handling with custom responses and logging"
tags: ["spring", "in-the-field", "production", "exception-handling", "error"]
---

## Why Exception Handling Matters

Production web applications must handle errors gracefully without exposing internal details to clients. Manual exception handling with try-catch blocks requires repetitive error response logic across every endpoint. In production APIs serving millions of requests, Spring's @ExceptionHandler and @ControllerAdvice centralize error handling while providing custom error responses, consistent logging, and proper HTTP status codes—critical for debugging and client experience.

## ServletException Try-Catch Baseline

Manual exception handling requires repetitive try-catch in every servlet method:

```java
import jakarta.servlet.http.*;
import jakarta.servlet.ServletException;
import java.io.IOException;
import java.io.PrintWriter;

// => Zakat servlet: manual exception handling
public class ZakatServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String accountId = request.getParameter("accountId");

        try {
            // => Business logic: may throw exceptions
            ZakatAccount account = zakatService.getAccount(accountId);

            // => Success: return JSON response
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("application/json");
            PrintWriter out = response.getWriter();
            String json = objectMapper.writeValueAsString(account);
            out.print(json);

        } catch (AccountNotFoundException e) {
            // => Manual exception handling: 404 Not Found
            // => Repetitive: must handle in every method
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.setContentType("application/json");
            PrintWriter out = response.getWriter();
            // => Manual error response construction
            out.println("{\"error\": \"Account not found\", \"accountId\": \"" + accountId + "\"}");
            // => Manual logging: must remember in every catch block
            logger.error("Account not found: {}", accountId, e);

        } catch (DatabaseConnectionException e) {
            // => Manual exception handling: 503 Service Unavailable
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            response.setContentType("application/json");
            PrintWriter out = response.getWriter();
            out.println("{\"error\": \"Database unavailable\", \"message\": \"" + e.getMessage() + "\"}");
            logger.error("Database connection failed", e);

        } catch (InsufficientFundsException e) {
            // => Manual exception handling: 400 Bad Request
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json");
            PrintWriter out = response.getWriter();
            out.println("{\"error\": \"Insufficient funds\", \"required\": \"" + e.getRequiredAmount() + "\"}");
            logger.warn("Insufficient funds for account: {}", accountId);

        } catch (Exception e) {
            // => Generic exception handler: 500 Internal Server Error
            // => Catch-all: unexpected exceptions
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.setContentType("application/json");
            PrintWriter out = response.getWriter();
            // => Security: don't expose internal details to client
            out.println("{\"error\": \"Internal server error\"}");
            // => Log full exception with stack trace
            logger.error("Unexpected error processing request", e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        try {
            // => Read request body
            String jsonRequest = readRequestBody(request);
            ZakatCalculationRequest calcRequest = objectMapper.readValue(
                jsonRequest,
                ZakatCalculationRequest.class
            );

            // => Business logic
            BigDecimal zakatAmount = zakatService.calculateAndSave(
                calcRequest.getAccountId(),
                calcRequest.getWealth()
            );

            // => Success response
            response.setStatus(HttpServletResponse.SC_CREATED);
            response.setContentType("application/json");
            PrintWriter out = response.getWriter();
            out.println("{\"zakatAmount\": \"" + zakatAmount + "\"}");

        } catch (JsonProcessingException e) {
            // => JSON parsing error: 400 Bad Request
            // => REPETITIVE: same exception handling in multiple methods
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json");
            PrintWriter out = response.getWriter();
            out.println("{\"error\": \"Invalid JSON format\"}");
            logger.error("JSON parsing failed", e);

        } catch (AccountNotFoundException e) {
            // => DUPLICATED: same exception handling as doGet()
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.setContentType("application/json");
            PrintWriter out = response.getWriter();
            out.println("{\"error\": \"Account not found\"}");
            logger.error("Account not found", e);

        } catch (InsufficientFundsException e) {
            // => DUPLICATED: same exception handling as doGet()
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json");
            PrintWriter out = response.getWriter();
            out.println("{\"error\": \"Insufficient funds\"}");
            logger.warn("Insufficient funds", e);

        } catch (Exception e) {
            // => DUPLICATED: generic catch-all in every method
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.setContentType("application/json");
            PrintWriter out = response.getWriter();
            out.println("{\"error\": \"Internal server error\"}");
            logger.error("Unexpected error", e);
        }
    }
}
```

**Limitations:**

- **Repetitive**: Same try-catch blocks in every servlet method
- **Duplicated logic**: Exception-to-status-code mapping repeated everywhere
- **Inconsistent**: Easy to forget error response format or logging
- **Verbose**: 50+ lines of exception handling per method
- **Manual JSON**: Must construct error JSON manually
- **Coupled**: Exception handling mixed with business logic

## Spring @ExceptionHandler Solution

Spring @ExceptionHandler centralizes error handling per controller:

```java
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// => Controller with exception handling
@RestController
@RequestMapping("/api/zakat")
public class ZakatController {

    private static final Logger logger = LoggerFactory.getLogger(ZakatController.class);
    private final ZakatService zakatService;

    public ZakatController(ZakatService zakatService) {
        this.zakatService = zakatService;
    }

    // => Business method: no try-catch needed
    @GetMapping("/accounts/{accountId}")
    public ZakatAccount getAccount(@PathVariable String accountId) {
        // => No try-catch: exception handler catches exceptions
        // => Throws AccountNotFoundException: caught by @ExceptionHandler
        return zakatService.getAccount(accountId);
    }

    // => POST: no try-catch needed
    @PostMapping("/calculations")
    public ResponseEntity<ZakatCalculationResponse> createCalculation(
            @Valid @RequestBody ZakatCalculationRequest request) {

        // => No try-catch: exceptions caught by handlers
        BigDecimal zakatAmount = zakatService.calculateAndSave(
            request.getAccountId(),
            request.getWealth()
        );

        ZakatCalculationResponse response = new ZakatCalculationResponse(
            request.getAccountId(),
            request.getWealth(),
            zakatAmount
        );

        return ResponseEntity.created(
            URI.create("/api/zakat/accounts/" + request.getAccountId())
        ).body(response);
    }

    // => @ExceptionHandler: handles AccountNotFoundException for this controller
    // => Catches exceptions thrown by controller methods
    @ExceptionHandler(AccountNotFoundException.class)  // => Handles specific exception type
    public ResponseEntity<ErrorResponse> handleAccountNotFound(AccountNotFoundException ex) {
        // => Log exception: error level
        logger.error("Account not found: {}", ex.getAccountId(), ex);

        // => Create error response object
        ErrorResponse error = new ErrorResponse(
            "ACCOUNT_NOT_FOUND",  // => Error code: for client-side handling
            "Account not found: " + ex.getAccountId(),  // => Human-readable message
            ex.getAccountId()  // => Additional context
        );

        // => Return 404 Not Found with error body
        // => Automatic JSON serialization
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(error);
    }

    // => @ExceptionHandler: handles InsufficientFundsException
    @ExceptionHandler(InsufficientFundsException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientFunds(InsufficientFundsException ex) {
        // => Log exception: warning level (business error, not system error)
        logger.warn("Insufficient funds: accountId={}, required={}, available={}",
            ex.getAccountId(), ex.getRequiredAmount(), ex.getAvailableAmount());

        // => Create detailed error response
        ErrorResponse error = new ErrorResponse(
            "INSUFFICIENT_FUNDS",
            "Insufficient funds for this transaction",
            Map.of(
                "accountId", ex.getAccountId(),
                "required", ex.getRequiredAmount(),
                "available", ex.getAvailableAmount()
            )
        );

        // => Return 400 Bad Request
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(error);
    }

    // => @ExceptionHandler: handles validation exceptions
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationError(MethodArgumentNotValidException ex) {
        // => Extract validation errors from BindingResult
        List<String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .toList();

        // => Log validation failure: debug level
        logger.debug("Validation failed: {}", errors);

        ErrorResponse error = new ErrorResponse(
            "VALIDATION_FAILED",
            "Request validation failed",
            errors
        );

        // => Return 400 Bad Request
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(error);
    }

    // => @ExceptionHandler: catch-all for unexpected exceptions
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        // => Log unexpected exception: error level with full stack trace
        logger.error("Unexpected error processing request", ex);

        // => Security: don't expose internal details
        ErrorResponse error = new ErrorResponse(
            "INTERNAL_ERROR",
            "An unexpected error occurred",
            null  // => No details for generic errors
        );

        // => Return 500 Internal Server Error
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(error);
    }
}

// => Error response DTO: consistent error format
// => Automatic JSON serialization
public class ErrorResponse {
    private String code;  // => Error code: ACCOUNT_NOT_FOUND, INSUFFICIENT_FUNDS
    private String message;  // => Human-readable message
    private Object details;  // => Additional context (optional)

    public ErrorResponse(String code, String message, Object details) {
        this.code = code;
        this.message = message;
        this.details = details;
    }

    // => Getters: Jackson uses for JSON serialization
    public String getCode() { return code; }
    public String getMessage() { return message; }
    public Object getDetails() { return details; }
}
```

**Benefits:**

- **Centralized**: Exception handling in one place per controller
- **Reusable**: Same handler for all methods in controller
- **Consistent**: Uniform error response format
- **Clean code**: Business methods free of try-catch blocks
- **Type-safe**: ErrorResponse object instead of manual JSON

## Spring @ControllerAdvice Solution (Global)

@ControllerAdvice centralizes exception handling across ALL controllers:

```java
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.web.context.request.WebRequest;
import java.time.LocalDateTime;

// => @ControllerAdvice: global exception handler for all controllers
// => Handles exceptions from ANY @RestController or @Controller
@ControllerAdvice  // => Global exception handling
@Slf4j  // => Lombok: generates logger field
public class GlobalExceptionHandler {

    // => Handles AccountNotFoundException from any controller
    @ExceptionHandler(AccountNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleAccountNotFound(
            AccountNotFoundException ex,
            WebRequest request) {  // => WebRequest: access to request details

        // => Log with request context
        log.error("Account not found: accountId={}, path={}",
            ex.getAccountId(),
            request.getDescription(false),  // => Request URI
            ex
        );

        // => Create detailed error response
        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())  // => When error occurred
            .status(HttpStatus.NOT_FOUND.value())  // => 404
            .error(HttpStatus.NOT_FOUND.getReasonPhrase())  // => "Not Found"
            .code("ACCOUNT_NOT_FOUND")  // => Application error code
            .message("Account not found: " + ex.getAccountId())
            .path(request.getDescription(false))  // => Request path
            .build();

        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(error);
    }

    // => Handles InsufficientFundsException from any controller
    @ExceptionHandler(InsufficientFundsException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientFunds(
            InsufficientFundsException ex,
            WebRequest request) {

        // => Business error: warn level, not error
        log.warn("Insufficient funds: accountId={}, required={}, available={}",
            ex.getAccountId(), ex.getRequiredAmount(), ex.getAvailableAmount());

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.BAD_REQUEST.value())
            .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
            .code("INSUFFICIENT_FUNDS")
            .message("Insufficient funds for this transaction")
            .details(Map.of(
                "accountId", ex.getAccountId(),
                "required", ex.getRequiredAmount(),
                "available", ex.getAvailableAmount()
            ))
            .path(request.getDescription(false))
            .build();

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(error);
    }

    // => Handles Bean Validation exceptions
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationError(
            MethodArgumentNotValidException ex,
            WebRequest request) {

        // => Extract all field errors
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        // => Log validation failure with field details
        log.debug("Validation failed: {}", fieldErrors);

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.BAD_REQUEST.value())
            .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
            .code("VALIDATION_FAILED")
            .message("Request validation failed")
            .details(fieldErrors)  // => Map of field → error message
            .path(request.getDescription(false))
            .build();

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(error);
    }

    // => Handles database exceptions
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorResponse> handleDatabaseError(
            DataAccessException ex,
            WebRequest request) {

        // => Database error: error level with stack trace
        log.error("Database error: path={}", request.getDescription(false), ex);

        // => Security: don't expose database details
        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.SERVICE_UNAVAILABLE.value())
            .error(HttpStatus.SERVICE_UNAVAILABLE.getReasonPhrase())
            .code("DATABASE_ERROR")
            .message("Database is temporarily unavailable")
            .path(request.getDescription(false))
            .build();

        return ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(error);
    }

    // => Handles authentication/authorization exceptions
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex,
            WebRequest request) {

        // => Security event: warn level
        log.warn("Access denied: path={}, user={}",
            request.getDescription(false),
            request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "anonymous"
        );

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.FORBIDDEN.value())
            .error(HttpStatus.FORBIDDEN.getReasonPhrase())
            .code("ACCESS_DENIED")
            .message("You do not have permission to access this resource")
            .path(request.getDescription(false))
            .build();

        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(error);
    }

    // => Catch-all: handles all unhandled exceptions
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            WebRequest request) {

        // => Unexpected error: error level with full stack trace
        log.error("Unexpected error: path={}", request.getDescription(false), ex);

        // => Security: generic message, no internal details
        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .error(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase())
            .code("INTERNAL_ERROR")
            .message("An unexpected error occurred")
            .path(request.getDescription(false))
            .build();

        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(error);
    }
}

// => Enhanced error response: comprehensive error details
// => Builder pattern: fluent API for error construction
@Data  // => Lombok: generates getters, setters, toString, equals, hashCode
@Builder  // => Lombok: generates builder pattern
public class ErrorResponse {
    private LocalDateTime timestamp;  // => When error occurred
    private int status;  // => HTTP status code (404, 500, etc.)
    private String error;  // => HTTP status reason phrase ("Not Found", "Internal Server Error")
    private String code;  // => Application error code ("ACCOUNT_NOT_FOUND", "INSUFFICIENT_FUNDS")
    private String message;  // => Human-readable error message
    private Object details;  // => Additional context (field errors, business details)
    private String path;  // => Request path that caused error
}
```

**Benefits over @ExceptionHandler:**

- **Global**: Applies to ALL controllers in application
- **Single source of truth**: Exception handling in one file
- **Consistent**: All endpoints return same error format
- **Maintainable**: Add exception handler once, applies everywhere
- **Request context**: Access to WebRequest for path, headers, principal

## Production Patterns

### Custom Business Exceptions

```java
// => Base class: all business exceptions extend this
public abstract class BusinessException extends RuntimeException {
    private final String errorCode;

    public BusinessException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}

// => Account not found exception
public class AccountNotFoundException extends BusinessException {
    private final String accountId;

    public AccountNotFoundException(String accountId) {
        super("ACCOUNT_NOT_FOUND", "Account not found: " + accountId);
        this.accountId = accountId;
    }

    public String getAccountId() { return accountId; }
}

// => Insufficient funds exception with business context
public class InsufficientFundsException extends BusinessException {
    private final String accountId;
    private final BigDecimal requiredAmount;
    private final BigDecimal availableAmount;

    public InsufficientFundsException(String accountId, BigDecimal required, BigDecimal available) {
        super("INSUFFICIENT_FUNDS",
            String.format("Insufficient funds: required=%s, available=%s", required, available));
        this.accountId = accountId;
        this.requiredAmount = required;
        this.availableAmount = available;
    }

    public String getAccountId() { return accountId; }
    public BigDecimal getRequiredAmount() { return requiredAmount; }
    public BigDecimal getAvailableAmount() { return availableAmount; }
}

// => Handler for all business exceptions
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
            BusinessException ex,
            WebRequest request) {

        // => Business exception: info level (expected error)
        log.info("Business exception: code={}, message={}",
            ex.getErrorCode(), ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.BAD_REQUEST.value())
            .code(ex.getErrorCode())  // => Error code from exception
            .message(ex.getMessage())
            .path(request.getDescription(false))
            .build();

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(error);
    }
}
```

### Exception Handling with Metrics

```java
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private final MeterRegistry meterRegistry;  // => Micrometer metrics

    public GlobalExceptionHandler(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @ExceptionHandler(AccountNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleAccountNotFound(
            AccountNotFoundException ex,
            WebRequest request) {

        // => Increment metric: count 404 errors
        meterRegistry.counter("api.errors",
            "type", "AccountNotFoundException",
            "status", "404"
        ).increment();

        log.error("Account not found: accountId={}", ex.getAccountId(), ex);

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.NOT_FOUND.value())
            .code("ACCOUNT_NOT_FOUND")
            .message("Account not found: " + ex.getAccountId())
            .path(request.getDescription(false))
            .build();

        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            WebRequest request) {

        // => Increment metric: count 500 errors
        meterRegistry.counter("api.errors",
            "type", ex.getClass().getSimpleName(),
            "status", "500"
        ).increment();

        log.error("Unexpected error", ex);

        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .code("INTERNAL_ERROR")
            .message("An unexpected error occurred")
            .path(request.getDescription(false))
            .build();

        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(error);
    }
}
```

### Environment-Specific Error Details

```java
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @Value("${app.error.include-stack-trace:false}")
    private boolean includeStackTrace;  // => false in production, true in dev

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            WebRequest request) {

        log.error("Unexpected error", ex);

        ErrorResponse.ErrorResponseBuilder builder = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .code("INTERNAL_ERROR")
            .message("An unexpected error occurred")
            .path(request.getDescription(false));

        // => Include stack trace in development only
        if (includeStackTrace) {
            // => Dev environment: include stack trace for debugging
            builder.details(ExceptionUtils.getStackTrace(ex));
        }
        // => Production: no stack trace (security)

        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(builder.build());
    }
}
```

## Progression Diagram

```mermaid
graph LR
    accTitle: Progression Diagram
    accDescr: Graph with 12 nodes and 9 connections. Nodes: Manual Try-Catch ServletException, Repetitive, Inconsistent, Mixed Concerns, @ExceptionHandler Controller-Level, Per Controller, Clean Methods, ErrorResponse, @ControllerAdvice Global Handlers, All Controllers, Consistency, Observability. Connections: Manual Try-Catch ServletException to Repetitive (50+ Lines/Method), Manual Try-Catch ServletException to Inconsistent (Duplicated Logic), Manual Try-Catch ServletException to Mixed Concerns (Coupled), @ExceptionHandler Controller-Level to Per Controller (Centralized), @ExceptionHandler Controller-Level to Clean Methods (Reusable), @ExceptionHandler Controller-Level to ErrorResponse (Type-Safe), @ControllerAdvice Global Handlers to All Controllers (Global), @ControllerAdvice Global Handlers to Consistency (Single Source), @ControllerAdvice Global Handlers to Observability (Metrics + Logging).
    A[Manual Try-Catch<br/>ServletException] -->|50+ Lines/Method| B[Repetitive]
    A -->|Duplicated Logic| C[Inconsistent]
    A -->|Coupled| D[Mixed Concerns]

    E[@ExceptionHandler<br/>Controller-Level] -->|Centralized| F[Per Controller]
    E -->|Reusable| G[Clean Methods]
    E -->|Type-Safe| H[ErrorResponse]

    I[@ControllerAdvice<br/>Global Handlers] -->|Global| J[All Controllers]
    I -->|Single Source| K[Consistency]
    I -->|Metrics + Logging| L[Observability]

    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    class A pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    class E pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    class I pal-0173B2
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Trade-offs and When to Use

| Approach          | Scope              | Reusability | Consistency | Boilerplate |
| ----------------- | ------------------ | ----------- | ----------- | ----------- |
| Manual Try-Catch  | Method             | None        | Low         | Very High   |
| @ExceptionHandler | Controller         | Medium      | Medium      | Low         |
| @ControllerAdvice | Application-Global | High        | High        | Very Low    |

**When to Use Manual Try-Catch:**

- Learning exception handling fundamentals
- Method-specific exception handling (unusual cases)
- Legacy code without Spring framework

**When to Use @ExceptionHandler:**

- Controller-specific error responses
- Different error formats per controller
- Simple applications with few controllers

**When to Use @ControllerAdvice:**

- Production REST APIs (default choice)
- Microservices with consistent error format
- Applications with multiple controllers
- Centralized logging and metrics
- Global security exception handling

## Best Practices

**1. Use @ControllerAdvice for Global Exception Handling**

Centralize error handling:

```java
@ControllerAdvice
public class GlobalExceptionHandler {
    // All exception handlers in one place
}
```

**2. Create Consistent Error Response Format**

Use ErrorResponse DTO:

```java
@Data
@Builder
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String code;
    private String message;
    private Object details;
    private String path;
}
```

**3. Use Appropriate Log Levels**

Differentiate error severity:

```java
@ExceptionHandler(BusinessException.class)
public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex) {
    log.info("Business exception: {}", ex.getMessage());  // => Info: expected
}

@ExceptionHandler(Exception.class)
public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
    log.error("Unexpected error", ex);  // => Error: unexpected
}
```

**4. Don't Expose Internal Details in Production**

Security first:

```java
@ExceptionHandler(Exception.class)
public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
    // Log full exception
    log.error("Unexpected error", ex);

    // Return generic message (no stack trace)
    ErrorResponse error = new ErrorResponse(
        "INTERNAL_ERROR",
        "An unexpected error occurred",  // => Generic message
        null  // => No internal details
    );

    return ResponseEntity.status(500).body(error);
}
```

**5. Use Custom Business Exceptions**

Type-safe error handling:

```java
public class AccountNotFoundException extends BusinessException {
    private final String accountId;

    public AccountNotFoundException(String accountId) {
        super("ACCOUNT_NOT_FOUND", "Account not found: " + accountId);
        this.accountId = accountId;
    }

    public String getAccountId() { return accountId; }
}
```

## See Also

- [Spring MVC](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/spring-mvc) - MVC exception handling baseline
- [REST APIs](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/rest-apis) - REST API error responses
- [Validation](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/validation) - Validation exception handling
- [Configuration](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/configuration) - Environment-specific error configuration
- Java Exception Handling - Exception handling patterns
