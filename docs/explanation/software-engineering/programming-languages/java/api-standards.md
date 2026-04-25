---
title: Java API Standards for OSE Platform
description: Prescriptive API design requirements for Shariah-compliant financial systems
category: explanation
subcategory: prog-lang
tags:
  - java
  - ose-platform
  - rest-api
  - graphql
  - grpc
  - api-design
  - standards
principles:
  - explicit-over-implicit
  - simplicity-over-complexity
created: 2026-02-03
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Java fundamentals from [AyoKoding Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Java tutorial. We define HOW to apply Java in THIS codebase, not WHAT Java is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

# Java API Standards for OSE Platform

**OSE-specific prescriptive standards** for API design in Shariah-compliant financial applications. This document defines **mandatory requirements** using RFC 2119 keywords (MUST, SHOULD, MAY).

**Prerequisites**: Understanding of REST, GraphQL, and gRPC fundamentals from [AyoKoding Java Web Services](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md).

## Purpose

API standards in OSE Platform ensure:

- **Consistency**: Uniform API patterns across all services
- **Developer Experience**: Intuitive, predictable APIs
- **Interoperability**: Seamless integration between microservices
- **Versioning**: Backward-compatible evolution
- **Security**: Consistent authentication and authorization

### URL Structure

**REQUIRED**: All REST APIs MUST follow hierarchical resource-based URL patterns.

**Pattern**: `/api/{version}/{resource}/{resource-id}/{sub-resource}`

**Examples**:

```
✅ GET    /api/v1/accounts/12345                    # Get account
✅ GET    /api/v1/accounts/12345/transactions       # Get account transactions
✅ POST   /api/v1/donations                         # Create donation
✅ PUT    /api/v1/accounts/12345/balance            # Update account balance
✅ DELETE /api/v1/notifications/67890                # Delete notification

❌ GET    /api/getAccount?id=12345                  # Verb in URL
❌ POST   /api/accounts/create                      # Action in URL
❌ GET    /api/account-transactions/12345           # Non-hierarchical
```

**REQUIRED**: URLs MUST:

- Use plural nouns for collections (`/accounts`, `/donations`)
- Use kebab-case for multi-word resources (`/zakat-payments`)
- Avoid verbs (use HTTP methods instead)
- Be hierarchical (parent/child relationships)
- Include API version prefix (`/api/v1/`)

### HTTP Method Standards

**REQUIRED**: HTTP methods MUST follow RESTful semantics.

| Method | Usage                     | Idempotent | Safe   | Example                               |
| ------ | ------------------------- | ---------- | ------ | ------------------------------------- |
| GET    | Retrieve resources        | ✅ Yes     | ✅ Yes | `GET /api/v1/accounts/12345`          |
| POST   | Create resources          | ❌ No      | ❌ No  | `POST /api/v1/donations`              |
| PUT    | Update (replace) resource | ✅ Yes     | ❌ No  | `PUT /api/v1/accounts/12345`          |
| PATCH  | Partial update            | ❌ No      | ❌ No  | `PATCH /api/v1/accounts/12345/status` |
| DELETE | Remove resources          | ✅ Yes     | ❌ No  | `DELETE /api/v1/notifications/67890`  |

**REQUIRED**: Financial operations MUST use POST (not idempotent):

```java
// CORRECT: POST for financial transaction (not idempotent without token)
@PostMapping("/api/v1/zakat-payments")
public ResponseEntity<ZakatPaymentResponse> processZakatPayment(
 @RequestBody ZakatPaymentRequest request,
 @RequestHeader("Idempotency-Key") String idempotencyKey  // REQUIRED
) {
 // Implementation with idempotency token
}
```

**PROHIBITED**: Using GET for state-changing operations (breaks REST semantics).

### HTTP Status Code Standards

**REQUIRED**: APIs MUST return appropriate HTTP status codes.

**Success Codes**:

- **200 OK**: Successful GET, PUT, PATCH (returns resource)
- **201 Created**: Successful POST (returns created resource + Location header)
- **204 No Content**: Successful DELETE (no response body)

**Client Error Codes**:

- **400 Bad Request**: Validation errors, malformed request
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Valid token but insufficient permissions
- **404 Not Found**: Resource does not exist
- **409 Conflict**: Duplicate resource, concurrent modification
- **422 Unprocessable Entity**: Business logic validation failure
- **429 Too Many Requests**: Rate limit exceeded

**Server Error Codes**:

- **500 Internal Server Error**: Unexpected server error
- **503 Service Unavailable**: Service temporarily down (maintenance, overload)

```java
// REQUIRED: Return appropriate status codes
@PostMapping("/api/v1/donations")
public ResponseEntity<DonationResponse> createDonation(
 @Valid @RequestBody DonationRequest request
) {
 Result<Donation, DonationError> result = donationService.create(request);

 return result.match(
  donation -> ResponseEntity
   .status(HttpStatus.CREATED)
   .header("Location", "/api/v1/donations/" + donation.id())
   .body(toResponse(donation)),
  error -> switch (error.type()) {
   case VALIDATION_ERROR -> ResponseEntity
    .status(HttpStatus.BAD_REQUEST)
    .body(toErrorResponse(error));
   case INSUFFICIENT_FUNDS -> ResponseEntity
    .status(HttpStatus.UNPROCESSABLE_ENTITY)
    .body(toErrorResponse(error));
   case DUPLICATE_DONATION -> ResponseEntity
    .status(HttpStatus.CONFLICT)
    .body(toErrorResponse(error));
   default -> ResponseEntity
    .status(HttpStatus.INTERNAL_SERVER_ERROR)
    .body(toErrorResponse(error));
  }
 );
}
```

### Error Response Format

**REQUIRED**: All error responses MUST follow standard format.

```java
// REQUIRED: Standard error response structure
public record ErrorResponse(
 String errorCode,       // REQUIRED: Machine-readable code (e.g., "INSUFFICIENT_FUNDS")
 String message,         // REQUIRED: Human-readable message
 List<FieldError> errors, // OPTIONAL: Field-level validation errors
 String correlationId,   // REQUIRED: For support ticket lookup
 Instant timestamp       // REQUIRED: Error occurrence time
) {}

public record FieldError(
 String field,           // REQUIRED: Field name (e.g., "amount")
 String message,         // REQUIRED: Validation error (e.g., "Must be positive")
 Object rejectedValue    // OPTIONAL: Invalid value (sanitized)
) {}
```

**Example**:

```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "Invalid donation request",
  "errors": [
    {
      "field": "amount",
      "message": "Must be positive",
      "rejectedValue": -100
    },
    {
      "field": "donorId",
      "message": "Required",
      "rejectedValue": null
    }
  ],
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-03T10:30:00Z"
}
```

**PROHIBITED**: Exposing stack traces, SQL queries, or PII in error responses.

### URL Versioning

**REQUIRED**: All APIs MUST include version in URL path.

```
✅ /api/v1/accounts/12345
✅ /api/v2/donations
❌ /api/accounts/12345  (no version)
```

**REQUIRED**: Version format MUST be `v{major-version}` (e.g., `v1`, `v2`).

**PROHIBITED**: Minor/patch versions in URL (e.g., `/api/v1.2.3/`).

### Breaking vs Non-Breaking Changes

**REQUIRED**: Breaking changes MUST increment major version.

**Breaking changes**:

- Removing endpoints or fields
- Changing field types (string → number)
- Changing required/optional status
- Renaming fields or endpoints
- Changing HTTP status codes

**Non-breaking changes** (safe in same version):

- Adding new endpoints
- Adding optional fields
- Adding new error codes
- Improving performance

```java
// CORRECT: Maintain backward compatibility within v1
@GetMapping("/api/v1/accounts/{id}")
public AccountResponse getAccount(@PathVariable String id) {
 return AccountResponse.builder()
  .accountId(id)
  .balance(getBalance(id))
  .createdAt(getCreatedAt(id))
  .zakatStatus(getZakatStatus(id))  // NEW: Non-breaking addition
  .build();
}
```

### Deprecation Policy

**REQUIRED**: Deprecated APIs MUST be supported for minimum 12 months.

```java
// REQUIRED: Mark deprecated endpoints with @Deprecated and response header
@Deprecated
@GetMapping("/api/v1/donations/legacy")
public ResponseEntity<DonationResponse> getLegacyDonations() {
 return ResponseEntity
  .ok()
  .header("Deprecation", "true")
  .header("Sunset", "2027-02-03T00:00:00Z")  // REQUIRED: Removal date
  .header("Link", "</api/v2/donations>; rel=\"successor-version\"")
  .body(getDonations());
}
```

**REQUIRED**: Deprecation warnings MUST:

- Be documented in API documentation
- Include sunset date (removal date)
- Provide migration path to new version
- Log usage for monitoring adoption

### Cursor-Based Pagination

**REQUIRED**: All list endpoints MUST implement cursor-based pagination.

```java
// REQUIRED: Cursor-based pagination
@GetMapping("/api/v1/donations")
public PaginatedResponse<Donation> getDonations(
 @RequestParam(required = false) String cursor,
 @RequestParam(defaultValue = "50") @Max(100) int pageSize
) {
 // REQUIRED: Validate page size
 if (pageSize > 100) {
  throw new InvalidParameterException("Max page size: 100");
 }

 // REQUIRED: Use cursor for consistent pagination
 Instant cursorTimestamp = cursor != null
  ? Instant.parse(cursor)
  : Instant.now();

 List<Donation> donations = donationRepository
  .findDonationsAfter(cursorTimestamp, pageSize + 1);

 // REQUIRED: Determine if more results exist
 boolean hasNext = donations.size() > pageSize;
 List<Donation> pageData = hasNext
  ? donations.subList(0, pageSize)
  : donations;

 // REQUIRED: Return next cursor for client
 String nextCursor = hasNext
  ? pageData.get(pageSize - 1).createdAt().toString()
  : null;

 return PaginatedResponse.<Donation>builder()
  .data(pageData)
  .nextCursor(nextCursor)
  .pageSize(pageSize)
  .build();
}
```

**REQUIRED**: Pagination response format:

```json
{
  "data": [
    /* Array of resources */
  ],
  "nextCursor": "2026-02-03T10:30:00Z", // Opaque cursor for next page
  "pageSize": 50
}
```

**PROHIBITED**: Offset-based pagination for large datasets (inconsistent results).

### Idempotency Keys

**REQUIRED**: All state-changing financial operations MUST support idempotency keys.

```java
// REQUIRED: Idempotency key for financial transactions
@PostMapping("/api/v1/zakat-payments")
public ResponseEntity<ZakatPaymentResponse> processZakatPayment(
 @Valid @RequestBody ZakatPaymentRequest request,
 @RequestHeader("Idempotency-Key") @NotBlank String idempotencyKey
) {
 // REQUIRED: Check for duplicate request
 Optional<ZakatPayment> existing = paymentRepository
  .findByIdempotencyKey(idempotencyKey);

 if (existing.isPresent()) {
  // REQUIRED: Return cached response (not reprocess)
  return ResponseEntity.ok(toResponse(existing.get()));
 }

 // REQUIRED: Process payment and store idempotency key
 ZakatPayment payment = paymentService.process(request, idempotencyKey);
 return ResponseEntity
  .status(HttpStatus.CREATED)
  .body(toResponse(payment));
}
```

**REQUIRED**: Idempotency MUST:

- Use `Idempotency-Key` HTTP header (UUID v4)
- Store key with request/response for 24 hours
- Return cached response for duplicate keys
- Return 409 Conflict if key exists with different request body

### Schema Design

**REQUIRED**: GraphQL schemas MUST follow OSE naming conventions.

```graphql
# REQUIRED: Domain-driven schema design
type Donation {
  id: ID!
  donorId: ID!
  amount: Money! # REQUIRED: Use custom scalars for domain types
  currencyCode: String!
  status: DonationStatus!
  createdAt: DateTime! # REQUIRED: Use DateTime scalar (not String)
  processedAt: DateTime
}

# REQUIRED: Custom scalar for Money type
scalar Money
scalar DateTime

enum DonationStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}

# REQUIRED: Pagination with Relay-style connections
type DonationConnection {
  edges: [DonationEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type DonationEdge {
  node: Donation!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

**REQUIRED**: GraphQL queries MUST:

- Use Relay-style pagination (connections)
- Define custom scalars for domain types (Money, DateTime)
- Use enums for finite value sets
- Provide non-null constraints where appropriate

### N+1 Query Prevention

**REQUIRED**: GraphQL resolvers MUST use DataLoader to prevent N+1 queries.

```java
// REQUIRED: DataLoader for batch loading
@Component
public class DonorDataLoader implements DataLoader<String, Donor> {

 private final DonorRepository donorRepository;

 @Override
 public CompletableFuture<List<Donor>> load(List<String> donorIds) {
  // REQUIRED: Batch load in single query
  return CompletableFuture.supplyAsync(() ->
   donorRepository.findAllByIdIn(donorIds)
  );
 }
}

// REQUIRED: Use DataLoader in resolver
@DgsData(parentType = "Donation", field = "donor")
public CompletableFuture<Donor> donor(
 DgsDataFetchingEnvironment env,
 DataLoader<String, Donor> donorDataLoader
) {
 Donation donation = env.getSource();
 return donorDataLoader.load(donation.donorId());
}
```

### Service Definition

**REQUIRED**: gRPC services MUST define clear, versioned proto files.

```protobuf
// REQUIRED: Proto3 syntax
syntax = "proto3";

package com.wahidyankf.ose.donation.v1;

option java_package = "com.wahidyankf.ose.donation.v1";
option java_multiple_files = true;

// REQUIRED: Versioned service
service DonationService {
 // REQUIRED: Unary RPC for single operations
 rpc CreateDonation(CreateDonationRequest) returns (CreateDonationResponse);

 // REQUIRED: Server streaming for large result sets
 rpc ListDonations(ListDonationsRequest) returns (stream Donation);

 // REQUIRED: Bidirectional streaming for real-time updates
 rpc TrackDonationStatus(stream DonationStatusRequest)
  returns (stream DonationStatusResponse);
}

message CreateDonationRequest {
 string donor_id = 1;
 Money amount = 2;
 string currency_code = 3;
}

message CreateDonationResponse {
 string donation_id = 1;
 DonationStatus status = 2;
}

// REQUIRED: Reusable message for Money type
message Money {
 string value = 1;  // REQUIRED: String to avoid floating-point precision issues
 string currency_code = 2;
}
```

**REQUIRED**: gRPC services MUST:

- Use proto3 syntax
- Version package names (`.v1`, `.v2`)
- Use appropriate RPC types (unary, server streaming, client streaming, bidirectional)
- Define reusable message types for domain concepts

### OpenAPI Requirements

**REQUIRED**: All REST APIs MUST provide OpenAPI 3.0 specification.

```java
// REQUIRED: OpenAPI configuration
@Configuration
public class OpenApiConfig {

 @Bean
 public OpenAPI oseOpenAPI() {
  return new OpenAPI()
   .info(new Info()
    .title("OSE Platform Donation API")
    .version("v1")
    .description("API for managing donations and Zakat payments")
    .contact(new Contact()
     .name("OSE Platform Team")
     .email("api-support@oseplatform.com")
    )
   )
   .servers(List.of(
    new Server()
     .url("https://api.oseplatform.com")
     .description("Production"),
    new Server()
     .url("https://staging.api.oseplatform.com")
     .description("Staging")
   ))
   .components(new Components()
    .addSecuritySchemes("bearer-jwt", new SecurityScheme()
     .type(SecurityScheme.Type.HTTP)
     .scheme("bearer")
     .bearerFormat("JWT")
    )
   )
   .security(List.of(
    new SecurityRequirement().addList("bearer-jwt")
   ));
 }
}
```

**REQUIRED**: OpenAPI documentation MUST include:

- API title, version, description
- Server URLs (production, staging)
- Authentication schemes (JWT, OAuth2)
- Example requests and responses
- Error codes and descriptions

### OSE Platform Standards

- [Security Standards](./security-standards.md) - API authentication and authorization
- [Error Handling Standards](./error-handling-standards.md) - Error response formats
- [Performance Standards](./performance-standards.md) - API performance requirements

### Learning Resources

For learning Java fundamentals and concepts referenced in these standards, see:

- **[Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md)** - Complete Java learning journey
- **[Java By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/_index.md)** - 157+ annotated code examples
  - **[Advanced Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/advanced.md)** - REST APIs, GraphQL, gRPC, API versioning, pagination, error handling
- **[Java In Practice](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/in-the-field/_index.md)** - API design patterns and best practices
- **[Java Release Highlights](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/release-highlights/_index.md)** - Java 17, 21, and 25 LTS features

**Note**: These standards assume you've learned Java basics from ayokoding-web. We don't re-explain fundamental concepts here.

### Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - URL versioning makes API version explicit (`/api/v1/accounts`)
   - Idempotency-Key header makes idempotency requirement explicit
   - OpenAPI specification explicitly documents all endpoints, parameters, and responses
   - HTTP status codes explicitly communicate result type (201 Created, 400 Bad Request, etc.)
   - RESTful URLs use simple resource hierarchy (`/accounts/{id}/transactions`)
   - Cursor-based pagination eliminates offset complexity
   - Standard error response format simplifies client error handling

2. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - OpenAPI spec auto-generated from annotations (no manual documentation)
   - GraphQL DataLoader automatically batches queries (prevents N+1)
   - Rate limiting automatically rejects excessive requests

## Compliance Checklist

Before deploying APIs, verify:

- [ ] URL structure follows resource hierarchy
- [ ] HTTP methods match REST semantics
- [ ] Appropriate HTTP status codes used
- [ ] Standard error response format implemented
- [ ] API version included in URL path
- [ ] Cursor-based pagination implemented
- [ ] Idempotency keys supported for financial operations
- [ ] GraphQL DataLoader prevents N+1 queries
- [ ] gRPC proto files versioned
- [ ] OpenAPI specification published
- [ ] API documentation complete

---

## Related Documentation

**Security**:

- [Security Standards](./security-standards.md) - OAuth2, JWT validation, rate limiting, and API authentication

**Error Responses**:

- [Error Handling Standards](./error-handling-standards.md) - HTTP error response format, status codes, and error message structure

**Testing**:

- [Testing Standards](./testing-standards.md) - API contract testing, REST API testing patterns, and integration tests

**Status**: Active (mandatory for all OSE Platform APIs)
