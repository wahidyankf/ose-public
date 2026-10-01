---
title: "REST Apis"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 10000031
description: "Manual REST with HttpServletResponse to @RestController to content negotiation to HATEOAS progression for production API development"
tags: ["spring", "in-the-field", "production", "rest", "api"]
---

## Why REST APIs Matter

RESTful APIs enable client-server communication through standardized HTTP methods and JSON/XML representations. Manual REST implementation with servlets requires explicit JSON serialization, content-type handling, and status code management. In production API services handling millions of requests daily, Spring's @RestController eliminates boilerplate while providing content negotiation, automatic serialization, and HATEOAS support for hypermedia-driven APIs.

## Manual REST with HttpServletResponse Baseline

Manual REST API requires explicit JSON handling and HTTP semantics:

```java
import jakarta.servlet.http.*;
import java.io.IOException;
import java.io.PrintWriter;
import com.fasterxml.jackson.databind.ObjectMapper;

// => Zakat API servlet: manual JSON REST implementation
public class ZakatApiServlet extends HttpServlet {

    private final ObjectMapper objectMapper = new ObjectMapper();
    // => ObjectMapper: Jackson JSON serializer/deserializer
    private final ZakatService zakatService;

    // => GET: retrieve zakat calculation
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // => Extract path parameter manually: /api/zakat/accounts/ACC123
        String pathInfo = request.getPathInfo();  // => "/accounts/ACC123"
        // => Manual path parsing: split and extract ID
        if (pathInfo == null || !pathInfo.startsWith("/accounts/")) {
            // => Manual error response: 404 Not Found
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.setContentType("application/json");
            PrintWriter out = response.getWriter();
            // => Manual JSON construction: error-prone, no type safety
            out.println("{\"error\": \"Resource not found\"}");
            return;
        }

        String accountId = pathInfo.substring("/accounts/".length());

        try {
            // => Business logic: retrieve account
            ZakatAccount account = zakatService.getAccount(accountId);

            // => Manual JSON serialization: ObjectMapper converts object to JSON
            String jsonResponse = objectMapper.writeValueAsString(account);

            // => Manual response configuration: status, content-type, body
            response.setStatus(HttpServletResponse.SC_OK);  // => 200 OK
            response.setContentType("application/json; charset=UTF-8");  // => Content-Type header
            PrintWriter out = response.getWriter();
            out.print(jsonResponse);  // => JSON body

        } catch (AccountNotFoundException e) {
            // => Manual exception to HTTP status mapping
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);  // => 404 Not Found
            response.setContentType("application/json");
            PrintWriter out = response.getWriter();
            // => Manual error object construction
            out.println("{\"error\": \"Account not found: " + accountId + "\"}");
        }
    }

    // => POST: create zakat record
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // => Manual request body reading: InputStream to String
        StringBuilder jsonBuilder = new StringBuilder();
        String line;
        // => Read entire request body
        while ((line = request.getReader().readLine()) != null) {
            jsonBuilder.append(line);
        }
        String jsonRequest = jsonBuilder.toString();

        try {
            // => Manual JSON deserialization: String to object
            ZakatCalculationRequest calcRequest = objectMapper.readValue(
                jsonRequest,
                ZakatCalculationRequest.class
            );

            // => Manual validation: check required fields
            if (calcRequest.getAccountId() == null || calcRequest.getAccountId().isEmpty()) {
                // => Validation error: 400 Bad Request
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.setContentType("application/json");
                PrintWriter out = response.getWriter();
                out.println("{\"error\": \"Missing required field: accountId\"}");
                return;
            }

            if (calcRequest.getWealth() == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.setContentType("application/json");
                PrintWriter out = response.getWriter();
                out.println("{\"error\": \"Missing required field: wealth\"}");
                return;
            }

            // => Business logic: calculate and save
            BigDecimal zakatAmount = zakatService.calculateAndSave(
                calcRequest.getAccountId(),
                calcRequest.getWealth()
            );

            // => Create response object
            ZakatCalculationResponse calcResponse = new ZakatCalculationResponse(
                calcRequest.getAccountId(),
                calcRequest.getWealth(),
                zakatAmount
            );

            // => Manual JSON serialization
            String jsonResponse = objectMapper.writeValueAsString(calcResponse);

            // => Manual response: 201 Created with Location header
            response.setStatus(HttpServletResponse.SC_CREATED);  // => 201 Created
            // => Location header: URL of created resource
            response.setHeader("Location", "/api/zakat/accounts/" + calcRequest.getAccountId());
            response.setContentType("application/json; charset=UTF-8");
            PrintWriter out = response.getWriter();
            out.print(jsonResponse);

        } catch (IOException e) {
            // => JSON parsing error: 400 Bad Request
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json");
            PrintWriter out = response.getWriter();
            out.println("{\"error\": \"Invalid JSON format\"}");
        }
    }

    // => PUT: update zakat record
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // => Extract ID from path
        String pathInfo = request.getPathInfo();
        if (pathInfo == null || !pathInfo.startsWith("/accounts/")) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.setContentType("application/json");
            response.getWriter().println("{\"error\": \"Resource not found\"}");
            return;
        }

        String accountId = pathInfo.substring("/accounts/".length());

        // => Read and parse request body
        StringBuilder jsonBuilder = new StringBuilder();
        String line;
        while ((line = request.getReader().readLine()) != null) {
            jsonBuilder.append(line);
        }

        try {
            ZakatUpdateRequest updateRequest = objectMapper.readValue(
                jsonBuilder.toString(),
                ZakatUpdateRequest.class
            );

            // => Business logic: update
            zakatService.updateAccount(accountId, updateRequest.getWealth());

            // => Manual response: 204 No Content
            response.setStatus(HttpServletResponse.SC_NO_CONTENT);  // => 204 No Content
            // => No body for 204 response

        } catch (IOException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json");
            response.getWriter().println("{\"error\": \"Invalid JSON format\"}");
        }
    }

    // => DELETE: remove zakat record
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // => Extract ID from path
        String pathInfo = request.getPathInfo();
        if (pathInfo == null || !pathInfo.startsWith("/accounts/")) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.setContentType("application/json");
            response.getWriter().println("{\"error\": \"Resource not found\"}");
            return;
        }

        String accountId = pathInfo.substring("/accounts/".length());

        try {
            // => Business logic: delete
            zakatService.deleteAccount(accountId);

            // => Manual response: 204 No Content
            response.setStatus(HttpServletResponse.SC_NO_CONTENT);

        } catch (AccountNotFoundException e) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.setContentType("application/json");
            response.getWriter().println("{\"error\": \"Account not found: " + accountId + "\"}");
        }
    }
}
```

**Limitations:**

- **Boilerplate**: 80+ lines for CRUD operations
- **Manual JSON handling**: Explicit serialization/deserialization
- **No content negotiation**: Hardcoded application/json
- **Manual status codes**: Must set status for every response
- **Path parsing**: Manual extraction of path variables
- **No validation framework**: Manual field checking

## Spring @RestController Solution

Spring @RestController eliminates JSON boilerplate and automates HTTP semantics:

```java
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import jakarta.validation.Valid;

// => @RestController: combines @Controller + @ResponseBody
// => All methods return JSON (not view names)
@RestController  // => Automatic JSON serialization for all methods
@RequestMapping("/api/zakat")  // => Base path: /api/zakat
public class ZakatRestController {

    private final ZakatService zakatService;

    public ZakatRestController(ZakatService zakatService) {
        this.zakatService = zakatService;
    }

    // => GET: retrieve account
    @GetMapping("/accounts/{accountId}")  // => GET /api/zakat/accounts/ACC123
    // => @PathVariable: extracts {accountId} from URL path
    public ZakatAccount getAccount(@PathVariable String accountId) {
        // => Business logic: retrieve account
        ZakatAccount account = zakatService.getAccount(accountId);
        // => Return object: Spring automatically serializes to JSON
        // => Content-Type: application/json (automatic)
        // => HTTP status: 200 OK (automatic)
        return account;
    }

    // => POST: create zakat calculation
    @PostMapping("/calculations")  // => POST /api/zakat/calculations
    // => @Valid: triggers Bean Validation before method execution
    // => @RequestBody: deserializes JSON request body to object
    public ResponseEntity<ZakatCalculationResponse> createCalculation(
            @Valid @RequestBody ZakatCalculationRequest request) {

        // => Business logic: calculate and save
        BigDecimal zakatAmount = zakatService.calculateAndSave(
            request.getAccountId(),
            request.getWealth()
        );

        // => Create response object
        ZakatCalculationResponse response = new ZakatCalculationResponse(
            request.getAccountId(),
            request.getWealth(),
            zakatAmount
        );

        // => ResponseEntity: full control over HTTP response
        // => created(): returns 201 Created with Location header
        // => URI: location of created resource
        return ResponseEntity
            .created(URI.create("/api/zakat/accounts/" + request.getAccountId()))
            // => body(): response body (serialized to JSON)
            .body(response);
    }

    // => PUT: update account
    @PutMapping("/accounts/{accountId}")  // => PUT /api/zakat/accounts/ACC123
    public ResponseEntity<Void> updateAccount(
            @PathVariable String accountId,
            @Valid @RequestBody ZakatUpdateRequest request) {

        // => Business logic: update
        zakatService.updateAccount(accountId, request.getWealth());

        // => ResponseEntity<Void>: no response body
        // => noContent(): returns 204 No Content
        return ResponseEntity.noContent().build();
    }

    // => DELETE: remove account
    @DeleteMapping("/accounts/{accountId}")  // => DELETE /api/zakat/accounts/ACC123
    public ResponseEntity<Void> deleteAccount(@PathVariable String accountId) {
        // => Business logic: delete
        zakatService.deleteAccount(accountId);

        // => noContent(): 204 No Content
        return ResponseEntity.noContent().build();
    }

    // => GET with query parameters: filter accounts
    @GetMapping("/accounts")  // => GET /api/zakat/accounts?minWealth=5000
    public List<ZakatAccount> getAccounts(
            // => @RequestParam: extracts query parameter
            // => required=false: optional parameter
            // => defaultValue: used if parameter missing
            @RequestParam(required = false, defaultValue = "0") BigDecimal minWealth) {

        // => Business logic: filter by minimum wealth
        List<ZakatAccount> accounts = zakatService.getAccountsAboveThreshold(minWealth);
        // => Automatic JSON array serialization
        return accounts;
    }

    // => POST with custom status code
    @PostMapping("/accounts")
    @ResponseStatus(HttpStatus.CREATED)  // => 201 Created (automatic)
    public ZakatAccount createAccount(@Valid @RequestBody CreateAccountRequest request) {
        // => Business logic: create account
        ZakatAccount account = zakatService.createAccount(request);
        // => Return object: 201 Created with JSON body
        return account;
    }
}

// => Request DTO: automatic JSON deserialization
// => Bean Validation annotations: automatic validation
public class ZakatCalculationRequest {

    // => @NotBlank: must not be null, empty, or whitespace
    @NotBlank(message = "Account ID is required")
    private String accountId;

    // => @NotNull: must not be null
    // => @DecimalMin: must be >= 0
    @NotNull(message = "Wealth is required")
    @DecimalMin(value = "0", message = "Wealth must be non-negative")
    private BigDecimal wealth;

    // => Getters/setters: Jackson uses for JSON binding
    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public BigDecimal getWealth() { return wealth; }
    public void setWealth(BigDecimal wealth) { this.wealth = wealth; }
}

// => Response DTO: automatic JSON serialization
public class ZakatCalculationResponse {
    private String accountId;
    private BigDecimal wealth;
    private BigDecimal zakatAmount;

    public ZakatCalculationResponse(String accountId, BigDecimal wealth, BigDecimal zakatAmount) {
        this.accountId = accountId;
        this.wealth = wealth;
        this.zakatAmount = zakatAmount;
    }

    // => Getters: Jackson uses for JSON serialization
    public String getAccountId() { return accountId; }
    public BigDecimal getWealth() { return wealth; }
    public BigDecimal getZakatAmount() { return zakatAmount; }
}
```

**Benefits:**

- **85% less code**: 10 lines per endpoint vs 80+ lines
- **Automatic JSON**: No manual ObjectMapper calls
- **Type-safe deserialization**: @RequestBody maps JSON to objects
- **HTTP semantics**: ResponseEntity provides status code control
- **Path variables**: @PathVariable extracts URL parameters
- **Validation**: @Valid triggers Bean Validation automatically

## Content Negotiation and Media Types

Support multiple response formats based on Accept header:

```java
@RestController
@RequestMapping("/api/zakat")
public class ZakatContentNegotiationController {

    private final ZakatService zakatService;

    // => produces: specifies supported response media types
    // => Client sends Accept header: application/json or application/xml
    @GetMapping(value = "/accounts/{accountId}",
                produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE})
    // => Content negotiation: returns JSON or XML based on Accept header
    public ZakatAccount getAccount(@PathVariable String accountId) {
        // => Business logic
        ZakatAccount account = zakatService.getAccount(accountId);

        // => Spring selects serialization format based on Accept header
        // => Accept: application/json → JSON serialization
        // => Accept: application/xml → XML serialization
        return account;
    }

    // => consumes: specifies accepted request media types
    // => Client sends Content-Type header: application/json or application/xml
    @PostMapping(value = "/calculations",
                 consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE},
                 produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE})
    // => Accepts JSON or XML request, returns JSON or XML response
    public ResponseEntity<ZakatCalculationResponse> createCalculation(
            @Valid @RequestBody ZakatCalculationRequest request) {

        // => Business logic
        BigDecimal zakatAmount = zakatService.calculateAndSave(
            request.getAccountId(),
            request.getWealth()
        );

        ZakatCalculationResponse response = new ZakatCalculationResponse(
            request.getAccountId(),
            request.getWealth(),
            zakatAmount
        );

        // => Response format matches Accept header
        return ResponseEntity.created(
            URI.create("/api/zakat/accounts/" + request.getAccountId())
        ).body(response);
    }

    // => Custom media type: application/vnd.zakat.v1+json
    // => Versioned API: v1 vs v2 via media type
    @GetMapping(value = "/accounts/{accountId}",
                produces = "application/vnd.zakat.v1+json")
    public ZakatAccountV1 getAccountV1(@PathVariable String accountId) {
        // => Version 1 representation
        return zakatService.getAccountV1(accountId);
    }

    @GetMapping(value = "/accounts/{accountId}",
                produces = "application/vnd.zakat.v2+json")
    public ZakatAccountV2 getAccountV2(@PathVariable String accountId) {
        // => Version 2 representation: different fields/structure
        return zakatService.getAccountV2(accountId);
    }
}
```

## HATEOAS for Hypermedia-Driven APIs

Add hypermedia links to responses for discoverable APIs:

```java
import org.springframework.hateoas.*;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

// => HATEOAS controller: hypermedia-driven REST API
@RestController
@RequestMapping("/api/zakat")
public class ZakatHateoasController {

    private final ZakatService zakatService;

    // => GET account with hypermedia links
    @GetMapping("/accounts/{accountId}")
    public EntityModel<ZakatAccount> getAccount(@PathVariable String accountId) {
        // => Business logic
        ZakatAccount account = zakatService.getAccount(accountId);

        // => EntityModel: wraps resource with links
        // => linkTo(): creates link to controller method
        // => methodOn(): type-safe method reference
        return EntityModel.of(account,
            // => self: link to this resource
            linkTo(methodOn(ZakatHateoasController.class).getAccount(accountId))
                .withSelfRel(),
            // => calculate: link to calculate zakat for this account
            linkTo(methodOn(ZakatHateoasController.class).calculateZakat(accountId))
                .withRel("calculate"),
            // => history: link to account transaction history
            linkTo(methodOn(ZakatHateoasController.class).getHistory(accountId))
                .withRel("history")
        );
    }

    // => GET all accounts with pagination links
    @GetMapping("/accounts")
    public CollectionModel<EntityModel<ZakatAccount>> getAccounts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // => Business logic: paginated results
        List<ZakatAccount> accounts = zakatService.getAccounts(page, size);

        // => Convert each account to EntityModel with self link
        List<EntityModel<ZakatAccount>> accountModels = accounts.stream()
            .map(account -> EntityModel.of(account,
                linkTo(methodOn(ZakatHateoasController.class).getAccount(account.getAccountId()))
                    .withSelfRel()
            ))
            .toList();

        // => CollectionModel: wraps collection with links
        return CollectionModel.of(accountModels,
            // => self: current page
            linkTo(methodOn(ZakatHateoasController.class).getAccounts(page, size))
                .withSelfRel(),
            // => next: next page
            linkTo(methodOn(ZakatHateoasController.class).getAccounts(page + 1, size))
                .withRel("next"),
            // => prev: previous page (if not first page)
            linkTo(methodOn(ZakatHateoasController.class).getAccounts(Math.max(0, page - 1), size))
                .withRel("prev")
        );
    }

    // => POST with hypermedia response
    @PostMapping("/calculations")
    public ResponseEntity<EntityModel<ZakatCalculationResponse>> createCalculation(
            @Valid @RequestBody ZakatCalculationRequest request) {

        // => Business logic
        BigDecimal zakatAmount = zakatService.calculateAndSave(
            request.getAccountId(),
            request.getWealth()
        );

        ZakatCalculationResponse response = new ZakatCalculationResponse(
            request.getAccountId(),
            request.getWealth(),
            zakatAmount
        );

        // => Add hypermedia links
        EntityModel<ZakatCalculationResponse> model = EntityModel.of(response,
            // => self: link to account
            linkTo(methodOn(ZakatHateoasController.class).getAccount(request.getAccountId()))
                .withSelfRel(),
            // => pay: link to payment endpoint
            linkTo(methodOn(ZakatHateoasController.class).payZakat(request.getAccountId()))
                .withRel("pay")
        );

        // => 201 Created with Location header and hypermedia links
        return ResponseEntity
            .created(URI.create("/api/zakat/accounts/" + request.getAccountId()))
            .body(model);
    }

    // => Helper methods (not shown for brevity)
    public ZakatCalculationResponse calculateZakat(String accountId) { return null; }
    public List<ZakatTransaction> getHistory(String accountId) { return null; }
    public ResponseEntity<Void> payZakat(String accountId) { return null; }
}
```

## Production Patterns

### API Versioning with URL Path

```java
// => Version 1 API
@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatControllerV1 {

    @GetMapping("/accounts/{accountId}")
    public ZakatAccountV1 getAccount(@PathVariable String accountId) {
        // => Version 1 representation
        return zakatService.getAccountV1(accountId);
    }
}

// => Version 2 API: breaking changes
@RestController
@RequestMapping("/api/v2/zakat")
public class ZakatControllerV2 {

    @GetMapping("/accounts/{accountId}")
    public ZakatAccountV2 getAccount(@PathVariable String accountId) {
        // => Version 2 representation: different field names
        return zakatService.getAccountV2(accountId);
    }
}
```

### Request/Response Logging

```java
@RestController
@RequestMapping("/api/zakat")
@Slf4j  // => Lombok: generates logger field
public class ZakatLoggingController {

    private final ZakatService zakatService;

    @PostMapping("/calculations")
    public ResponseEntity<ZakatCalculationResponse> createCalculation(
            @Valid @RequestBody ZakatCalculationRequest request) {

        // => Log incoming request: info level
        log.info("Received zakat calculation request: accountId={}, wealth={}",
            request.getAccountId(), request.getWealth());

        try {
            // => Business logic
            BigDecimal zakatAmount = zakatService.calculateAndSave(
                request.getAccountId(),
                request.getWealth()
            );

            ZakatCalculationResponse response = new ZakatCalculationResponse(
                request.getAccountId(),
                request.getWealth(),
                zakatAmount
            );

            // => Log successful response: debug level
            log.debug("Zakat calculation successful: accountId={}, zakatAmount={}",
                request.getAccountId(), zakatAmount);

            return ResponseEntity.created(
                URI.create("/api/zakat/accounts/" + request.getAccountId())
            ).body(response);

        } catch (Exception e) {
            // => Log error: error level with exception
            log.error("Zakat calculation failed: accountId={}", request.getAccountId(), e);
            throw e;
        }
    }
}
```

### Rate Limiting with Interceptor

```java
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final Map<String, Integer> requestCounts = new ConcurrentHashMap<>();
    private final int MAX_REQUESTS_PER_MINUTE = 100;

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws Exception {

        // => Extract client identifier: IP address or API key
        String clientId = request.getRemoteAddr();

        // => Get current request count for client
        int count = requestCounts.getOrDefault(clientId, 0);

        // => Check rate limit
        if (count >= MAX_REQUESTS_PER_MINUTE) {
            // => Rate limit exceeded: 429 Too Many Requests
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\": \"Rate limit exceeded\"}");
            return false;  // => Stop processing
        }

        // => Increment request count
        requestCounts.put(clientId, count + 1);
        return true;
    }
}

// => Configuration: register interceptor
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private RateLimitInterceptor rateLimitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor)
            .addPathPatterns("/api/**");  // => Apply to all API endpoints
    }
}
```

## Progression Diagram

```mermaid
graph LR
    accTitle: Progression Diagram
    accDescr: Graph with 12 nodes and 9 connections. Nodes: Manual Servlet REST ObjectMapper + HttpServletResponse, Manual JSON, Boilerplate, JSON Only, @RestController Automatic Serialization, Automatic JSON, HTTP Semantics, Type-Safe, Advanced REST HATEOAS + Negotiation, Hypermedia Links, XML/JSON, API Evolution. Connections: Manual Servlet REST ObjectMapper + HttpServletResponse to Manual JSON (80+ Lines), Manual Servlet REST ObjectMapper + HttpServletResponse to Boilerplate (Manual Status Codes), Manual Servlet REST ObjectMapper + HttpServletResponse to JSON Only (No Content Negotiation), @RestController Automatic Serialization to Automatic JSON (10 Lines), @RestController Automatic Serialization to HTTP Semantics (ResponseEntity), @RestController Automatic Serialization to Type-Safe (@RequestBody/ @ResponseBody), Advanced REST HATEOAS + Negotiation to Hypermedia Links (EntityModel), Advanced REST HATEOAS + Negotiation to XML/JSON (produces/consumes), Advanced REST HATEOAS + Negotiation to API Evolution (Versioning).
    A[Manual Servlet REST<br/>ObjectMapper +<br/>HttpServletResponse] -->|80+ Lines| B[Manual JSON]
    A -->|Manual Status Codes| C[Boilerplate]
    A -->|No Content<br/>Negotiation| D[JSON Only]

    E[@RestController<br/>Automatic<br/>Serialization] -->|10 Lines| F[Automatic JSON]
    E -->|ResponseEntity| G[HTTP Semantics]
    E -->|@RequestBody/<br/>@ResponseBody| H[Type-Safe]

    I[Advanced REST<br/>HATEOAS +<br/>Negotiation] -->|EntityModel| J[Hypermedia Links]
    I -->|produces/consumes| K[XML/JSON]
    I -->|Versioning| L[API Evolution]

    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    class A pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    class E pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    class I pal-0173B2
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Trade-offs and When to Use

| Approach                  | Boilerplate | Serialization | HTTP Control | Hypermedia | Learning Curve |
| ------------------------- | ----------- | ------------- | ------------ | ---------- | -------------- |
| Manual Servlet REST       | Very High   | Manual        | Full         | None       | Medium         |
| @RestController           | Low         | Automatic     | High         | None       | Low            |
| @RestController + HATEOAS | Medium      | Automatic     | High         | Full       | High           |

**When to Use Manual Servlet REST:**

- Learning REST fundamentals
- Legacy integration (no Spring available)
- Performance-critical single endpoint
- Custom JSON processing (non-standard formats)

**When to Use @RestController:**

- Production REST APIs (default choice)
- JSON/XML API services
- CRUD operations on resources
- Microservices communication
- Mobile/SPA backends

**When to Use @RestController + HATEOAS:**

- Discoverable APIs (clients navigate via links)
- Complex resource relationships
- API evolution with minimal client changes
- RESTful maturity level 3 (Richardson Maturity Model)

## Best Practices

**1. Use ResponseEntity for Full HTTP Control**

Control status codes and headers explicitly:

```java
@PostMapping("/calculations")
public ResponseEntity<ZakatCalculationResponse> create(@Valid @RequestBody ZakatCalculationRequest request) {
    ZakatCalculationResponse response = zakatService.calculate(request);
    return ResponseEntity.created(URI.create("/api/zakat/accounts/" + request.getAccountId()))
        .header("X-Request-Id", UUID.randomUUID().toString())
        .body(response);
}
```

**2. Validate Request Bodies with Bean Validation**

Use @Valid with @RequestBody:

```java
@PostMapping("/calculations")
public ResponseEntity<ZakatCalculationResponse> create(@Valid @RequestBody ZakatCalculationRequest request) {
    // Validation errors trigger automatic 400 Bad Request
}
```

**3. Use Proper HTTP Status Codes**

RESTful semantics:

```java
@PostMapping("/accounts")  // => 201 Created
@ResponseStatus(HttpStatus.CREATED)
public ZakatAccount create(@Valid @RequestBody CreateAccountRequest request) { }

@PutMapping("/accounts/{id}")  // => 204 No Content
public ResponseEntity<Void> update(@PathVariable String id, @Valid @RequestBody UpdateRequest request) {
    return ResponseEntity.noContent().build();
}

@DeleteMapping("/accounts/{id}")  // => 204 No Content
public ResponseEntity<Void> delete(@PathVariable String id) {
    return ResponseEntity.noContent().build();
}
```

**4. Use Content Negotiation for Multiple Formats**

Support JSON and XML:

```java
@GetMapping(value = "/accounts/{id}",
            produces = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE})
public ZakatAccount getAccount(@PathVariable String id) {
    // Returns JSON or XML based on Accept header
}
```

**5. Add Hypermedia Links for Discoverability**

Use HATEOAS for navigable APIs:

```java
@GetMapping("/accounts/{id}")
public EntityModel<ZakatAccount> getAccount(@PathVariable String id) {
    ZakatAccount account = zakatService.getAccount(id);
    return EntityModel.of(account,
        linkTo(methodOn(ZakatController.class).getAccount(id)).withSelfRel(),
        linkTo(methodOn(ZakatController.class).calculateZakat(id)).withRel("calculate")
    );
}
```

## See Also

- [Spring MVC](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/spring-mvc) - MVC baseline for HTML views
- [Exception Handling](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/exception-handling) - @RestControllerAdvice for API errors
- [Validation](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/validation) - Bean Validation for request objects
- [Configuration](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/configuration) - WebMvcConfigurer for REST setup
- Java HTTP Clients - Consuming REST APIs
