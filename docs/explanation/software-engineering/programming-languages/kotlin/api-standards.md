---
title: "Kotlin API Standards"
description: Authoritative OSE Platform Kotlin API standards (Ktor routing DSL, content negotiation, REST conventions)
category: explanation
subcategory: prog-lang
tags:
  - kotlin
  - api-standards
  - ktor
  - rest
  - http
  - content-negotiation
  - authentication
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Kotlin API Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Kotlin fundamentals from [AyoKoding Kotlin Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/kotlin/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Kotlin tutorial. We define HOW to build APIs in THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative API standards** for Kotlin development in the OSE Platform. It covers Ktor routing DSL, `call.respond`/`call.receive` patterns, content negotiation, StatusPages for error handling, authentication plugins, REST conventions, pagination, and request/response data classes.

**Target Audience**: OSE Platform Kotlin developers, API designers, technical reviewers

**Scope**: Ktor 3.x API patterns, REST conventions, HTTP status codes, request/response modeling, error responses

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Content Negotiation):

```kotlin
// CORRECT: Plugin handles serialization automatically
fun Application.configureContentNegotiation() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = false
            isLenient = false
            ignoreUnknownKeys = false  // Strict - fails on unknown fields
            encodeDefaults = true
        })
    }
}
// No manual JSON serialization/deserialization needed in route handlers
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit HTTP Status Codes):

```kotlin
// CORRECT: Explicit status in every response
get("/zakat/{payerId}") {
    val payerId = call.parameters["payerId"]
        ?: return@get call.respond(HttpStatusCode.BadRequest, ErrorResponse("Missing payerId"))

    zakatService.findObligation(payerId).fold(
        onSuccess = { call.respond(HttpStatusCode.OK, it.toResponse()) },
        onFailure = { error ->
            when (error) {
                is ZakatPayerNotFoundException -> call.respond(HttpStatusCode.NotFound, error.toResponse())
                is ZakatDomainError -> call.respond(HttpStatusCode.UnprocessableEntity, error.toResponse())
                else -> call.respond(HttpStatusCode.InternalServerError, ErrorResponse("Internal error"))
            }
        },
    )
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Request/Response Classes):

```kotlin
// CORRECT: Data classes are immutable by default
@Serializable
data class ZakatObligationResponse(
    val payerId: String,
    val totalWealth: BigDecimal,
    val zakatAmount: BigDecimal,
    val nisabThreshold: BigDecimal,
    val obligationStatus: String,
    val calculatedAt: String,  // ISO-8601 string for JSON serialization
)

// WRONG: Mutable response class
class ZakatObligationResponse {
    var payerId: String = ""  // Mutable - can be modified after construction
    var zakatAmount: BigDecimal = BigDecimal.ZERO
}
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure Mapping Functions):

```kotlin
// Pure mapping from domain object to response DTO
fun ZakatObligation.toResponse(): ZakatObligationResponse =
    ZakatObligationResponse(
        payerId = this.payerId,
        totalWealth = this.totalWealth,
        zakatAmount = this.zakatAmount,
        nisabThreshold = this.nisabThreshold,
        obligationStatus = when (this) {
            is ZakatObligation.Obligated -> "OBLIGATED"
            is ZakatObligation.NotObligated -> "NOT_OBLIGATED"
        },
        calculatedAt = this.calculatedAt.toString(),
    )
```

### 5. Reproducibility First

**PASS Example** (Consistent API Versioning):

```kotlin
// Versioned routing - stable API structure across deployments
fun Application.configureRouting(
    zakatService: ZakatService,
    murabahaService: MurabahaService,
) {
    routing {
        route("/api/v1") {
            zakatRoutes(zakatService)
            murabahaRoutes(murabahaService)
        }
    }
}
```

## Ktor Application Setup

### Application Configuration

**MUST** configure Ktor with all required plugins before routing.

```kotlin
// Application.kt - Entry point
fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0") {
        configureContentNegotiation()
        configureSecurity(jwtConfig)
        configureStatusPages()
        configureRouting(zakatService, murabahaService)
    }.start(wait = true)
}

// Or via HOCON configuration (preferred for production)
fun main() = io.ktor.server.netty.EngineMain.main(args)

fun Application.module() {
    configureContentNegotiation()
    configureSecurity(environment.config)
    configureStatusPages()
    configureRouting()
}
```

## Routing DSL

### Route Organization

**MUST** organize routes by domain in separate extension functions.

```kotlin
// ZakatRoutes.kt - Domain-specific route file
fun Route.zakatRoutes(service: ZakatService) {
    route("/zakat") {
        get("/obligations/{payerId}") {
            val payerId = call.parameters["payerId"]
                ?: return@get call.respond(HttpStatusCode.BadRequest, errorOf("Missing payerId"))

            service.getObligation(payerId).respond(call)
        }

        post("/payments") {
            val request = call.receive<ZakatPaymentRequest>()
            service.processPayment(request).respond(call)
        }

        get("/history/{payerId}") {
            val payerId = call.parameters["payerId"]
                ?: return@get call.respond(HttpStatusCode.BadRequest, errorOf("Missing payerId"))
            val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
            val pageSize = call.request.queryParameters["pageSize"]?.toIntOrNull() ?: 20

            service.getHistory(payerId, page, pageSize).respond(call)
        }
    }
}

// MurabahaRoutes.kt - Separate file for Murabaha domain
fun Route.murabahaRoutes(service: MurabahaService) {
    route("/murabaha") {
        post("/contracts") {
            val request = call.receive<CreateMurabahaContractRequest>()
            service.createContract(request).respond(call)
        }
    }
}
```

### Request Handling

**MUST** use `call.receive<T>()` for request body deserialization.

**MUST** validate required path parameters with early return.

```kotlin
// CORRECT: Explicit parameter extraction with early return
get("/zakat/obligations/{payerId}") {
    val payerId = call.parameters["payerId"]
        ?: return@get call.respond(HttpStatusCode.BadRequest, errorOf("payerId is required"))

    val includeHistory = call.request.queryParameters["includeHistory"]?.toBoolean() ?: false

    zakatService.getObligation(payerId, includeHistory)
        .fold(
            onSuccess = { call.respond(HttpStatusCode.OK, it.toResponse()) },
            onFailure = { call.respond(HttpStatusCode.NotFound, errorOf("Payer not found")) },
        )
}

// CORRECT: Request body deserialization
post("/murabaha/contracts") {
    val request = runCatching { call.receive<CreateMurabahaContractRequest>() }
        .getOrElse { return@post call.respond(HttpStatusCode.BadRequest, errorOf("Invalid request body")) }

    murabahaService.createContract(request)
        .fold(
            onSuccess = { call.respond(HttpStatusCode.Created, it.toResponse()) },
            onFailure = { call.respond(HttpStatusCode.UnprocessableEntity, it.toErrorResponse()) },
        )
}
```

## StatusPages for Error Handling

**MUST** configure StatusPages plugin for centralized error handling.

```kotlin
// ErrorHandling.kt
fun Application.configureStatusPages() {
    install(StatusPages) {
        exception<ContentTransformationException> { call, _ ->
            call.respond(HttpStatusCode.BadRequest, errorOf("Invalid request format"))
        }

        exception<AuthenticationException> { call, _ ->
            call.respond(HttpStatusCode.Unauthorized, errorOf("Authentication required"))
        }

        exception<AuthorizationException> { call, _ ->
            call.respond(HttpStatusCode.Forbidden, errorOf("Insufficient permissions"))
        }

        exception<OsePlatformException> { call, e ->
            val statusCode = when {
                e.errorCode.startsWith("ZAKAT_00") -> HttpStatusCode.NotFound
                e.errorCode.startsWith("MURABAHA_00") -> HttpStatusCode.UnprocessableEntity
                else -> HttpStatusCode.InternalServerError
            }
            call.respond(statusCode, ApiErrorResponse(code = e.errorCode, message = e.message ?: "Error"))
        }

        exception<Exception> { call, e ->
            call.application.log.error("Unhandled exception", e)
            call.respond(HttpStatusCode.InternalServerError, errorOf("Internal server error"))
        }
    }
}
```

## Content Negotiation

**MUST** use `kotlinx.serialization` for JSON (not Gson or Jackson in Ktor projects).

```kotlin
// ContentNegotiation.kt
fun Application.configureContentNegotiation() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = false           // Compact JSON in production
            isLenient = false             // Strict parsing
            ignoreUnknownKeys = false     // Fail on unknown fields (security)
            encodeDefaults = true         // Include null fields explicitly
            serializersModule = SerializersModule {
                contextual(BigDecimal::class, BigDecimalSerializer)
                contextual(Instant::class, InstantSerializer)
            }
        })
    }
}

// BigDecimalSerializer.kt - Custom serializer for financial amounts
object BigDecimalSerializer : KSerializer<BigDecimal> {
    override val descriptor = PrimitiveSerialDescriptor("BigDecimal", PrimitiveKind.STRING)
    override fun serialize(encoder: Encoder, value: BigDecimal) =
        encoder.encodeString(value.toPlainString())
    override fun deserialize(decoder: Decoder) =
        BigDecimal(decoder.decodeString())
}
```

## REST Conventions

### HTTP Method and Status Code Mapping

**MUST** follow standard HTTP semantics.

| Operation           | Method | Success Status | Example Path                      |
| ------------------- | ------ | -------------- | --------------------------------- |
| List resources      | GET    | 200            | `/zakat/obligations`              |
| Get single resource | GET    | 200, 404       | `/zakat/obligations/{id}`         |
| Create resource     | POST   | 201            | `/zakat/payments`                 |
| Update resource     | PUT    | 200            | `/murabaha/contracts/{id}`        |
| Partial update      | PATCH  | 200            | `/murabaha/contracts/{id}/status` |
| Delete resource     | DELETE | 204            | `/murabaha/contracts/{id}`        |

### Pagination

**MUST** use cursor-based or offset pagination for list endpoints.

```kotlin
// Request: GET /zakat/payments?page=2&pageSize=20
@Serializable
data class PaginatedResponse<T>(
    val data: List<T>,
    val page: Int,
    val pageSize: Int,
    val totalCount: Long,
    val totalPages: Int,
    val hasNext: Boolean,
    val hasPrevious: Boolean,
)

// Service builds paginated response
fun ZakatService.getPaymentHistory(
    payerId: String,
    page: Int,
    pageSize: Int,
): Result<PaginatedResponse<ZakatPaymentResponse>> = runCatching {
    val offset = (page - 1) * pageSize
    val payments = repository.findByPayerId(payerId, offset, pageSize)
    val total = repository.countByPayerId(payerId)

    PaginatedResponse(
        data = payments.map { it.toResponse() },
        page = page,
        pageSize = pageSize,
        totalCount = total,
        totalPages = ceil(total.toDouble() / pageSize).toInt(),
        hasNext = page * pageSize < total,
        hasPrevious = page > 1,
    )
}
```

## Standard Error Response Format

**MUST** use a consistent error response structure across all endpoints.

```kotlin
@Serializable
data class ApiErrorResponse(
    val code: String,       // Machine-readable error code (e.g., "ZAKAT_001")
    val message: String,    // Human-readable description
    val timestamp: String = Instant.now().toString(),
    val details: List<FieldError> = emptyList(),
)

@Serializable
data class FieldError(
    val field: String,
    val message: String,
    val rejectedValue: String? = null,
)

fun errorOf(message: String, code: String = "GENERAL_ERROR") =
    ApiErrorResponse(code = code, message = message)
```

## Enforcement

- **Ktor content negotiation** - Automatic serialization/deserialization validation at runtime
- **StatusPages** - Centralized error handling prevents inconsistent error responses
- **Code reviews** - Verify explicit status codes, consistent error format, pagination
- **Integration tests** - Ktor test engine validates route behavior end-to-end

**Pre-commit checklist**:

- [ ] All routes return explicit `HttpStatusCode`
- [ ] Error responses use `ApiErrorResponse` format
- [ ] List endpoints implement pagination
- [ ] Request bodies validated with `runCatching { call.receive<T>() }`
- [ ] StatusPages handles all exception types
- [ ] No business logic in route handlers (delegated to services)

## Related Standards

- [Security Standards](./security-standards.md) - JWT authentication in Ktor
- [Error Handling Standards](./error-handling-standards.md) - Domain error mapping to HTTP
- [Framework Integration](./framework-integration.md) - Full Ktor application setup

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)

---

**Maintainers**: Platform Documentation Team

**Kotlin Version**: 2.1 | Framework: Ktor 3.x | Serialization: kotlinx.serialization 1.8.0
