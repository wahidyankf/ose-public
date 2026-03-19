---
title: "Beginner"
weight: 10000001
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Master fundamental ASP.NET Core 8 concepts through 27 annotated examples covering minimal APIs, routing, model binding, validation, middleware, error handling, logging, configuration, and dependency injection"
tags:
  [
    "aspnetcore",
    "csharp",
    "dotnet",
    "web-framework",
    "tutorial",
    "by-example",
    "beginner",
    "minimal-apis",
    "routing",
    "middleware",
    "configuration",
    "dependency-injection",
  ]
---

## Group 1: Minimal API Basics

### Example 1: Hello World Minimal API

ASP.NET Core minimal APIs let you define HTTP endpoints with just a few lines of code directly in `Program.cs`. The `WebApplication.CreateBuilder` bootstraps the host, and `MapGet` registers a GET route handler.

```mermaid
%% ASP.NET Core request pipeline for minimal API
graph TD
    A["HTTP Request<br/>GET /"] --> B["Kestrel Server<br/>Receives connection"]
    B --> C["Middleware Pipeline<br/>Processing chain"]
    C --> D["Route Matching<br/>MapGet /"]
    D --> E["Route Handler<br/>Lambda function"]
    E --> F["HTTP Response<br/>200 OK"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
    style F fill:#0173B2,stroke:#000,color:#fff
```

```csharp
// Program.cs - The entry point for every ASP.NET Core application
// WebApplicationBuilder wires up hosting, DI container, and configuration
var builder = WebApplication.CreateBuilder(args);
// => builder holds services (DI), configuration, and host settings
// => args allows passing CLI arguments like --urls http://localhost:5001

// Build the WebApplication from the configured builder
var app = builder.Build();
// => app is the running web application
// => middleware and routes are registered on app before app.Run()

// MapGet registers a handler for HTTP GET requests at the "/" path
app.MapGet("/", () => "Hello, ASP.NET Core 8!");
// => Handler is a lambda; return value becomes the response body
// => string return => 200 OK with Content-Type: text/plain
// => No explicit routing config needed; minimal APIs handle it inline

// Run starts the HTTP server and blocks until app shuts down
app.Run();
// => Default port is 5000 (HTTP) and 5001 (HTTPS)
// => Set via ASPNETCORE_URLS or launchSettings.json
// => Graceful shutdown on SIGTERM/Ctrl+C
```

**Key Takeaway**: A minimal ASP.NET Core API needs only three statements: create builder, map routes, run. The framework handles hosting, routing, and serialization without ceremony.

**Why It Matters**: Minimal APIs eliminate the controller and startup class boilerplate that existed in earlier ASP.NET Core versions, making small services and microservices dramatically simpler to write and maintain. The concise syntax reduces cognitive overhead, and the compiled lambda approach is as fast as the traditional controller pattern. Production microservices and Azure Functions patterns both benefit from this low-ceremony style.

---

### Example 2: Multiple HTTP Verb Handlers

ASP.NET Core's minimal APIs expose methods for every standard HTTP verb. Each handler is a separate lambda registered at the same or different paths, mapping directly to REST semantics.

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// MapGet handles HTTP GET - safe and idempotent reads
app.MapGet("/items", () =>
{
    // => Returns a list - convention: collection endpoint returns array
    return new[] { "item1", "item2", "item3" };
    // => Framework auto-serializes arrays to JSON
    // => Response: 200 OK, Content-Type: application/json
});

// MapPost handles HTTP POST - creates a new resource
app.MapPost("/items", (string name) =>
{
    // => name is bound from the request body (JSON string)
    // => Simple types bind directly; complex types bind from JSON object
    Console.WriteLine($"Creating item: {name}");
    // => Output: Creating item: widget
    return Results.Created($"/items/{name}", new { Name = name });
    // => Results.Created returns 201 Created with Location header
    // => Location: /items/widget
});

// MapPut handles HTTP PUT - full replacement of a resource
app.MapPut("/items/{id}", (int id, string name) =>
{
    // => id comes from route segment {id}
    // => name comes from request body
    return Results.Ok(new { Id = id, Name = name });
    // => Results.Ok returns 200 OK with JSON body
});

// MapDelete handles HTTP DELETE - removes a resource
app.MapDelete("/items/{id}", (int id) =>
{
    // => id bound from route segment
    Console.WriteLine($"Deleting item {id}");
    // => Output: Deleting item 42
    return Results.NoContent();
    // => Results.NoContent returns 204 No Content
    // => DELETE success convention: no body, 204 status
});

// MapPatch handles HTTP PATCH - partial update
app.MapPatch("/items/{id}", (int id) =>
    Results.Ok($"Patched item {id}"));
// => Concise single-expression form; arrow syntax available in .NET 8

app.Run();
```

**Key Takeaway**: Each HTTP verb has a dedicated `Map*` method. Use `Results.*` factory methods to return specific HTTP status codes and bodies rather than returning raw values when you need control over the response.

**Why It Matters**: Correct HTTP verb semantics are foundational to RESTful API design. Clients and intermediaries (proxies, CDNs, browsers) use verb semantics to make decisions: GET requests can be safely retried and cached; DELETE requests signal idempotent removal. Using the right verb and status code makes your API predictable for consuming teams and enables correct behavior of HTTP infrastructure like caching layers and load balancers.

---

### Example 3: Path Parameters

Route parameters are captured from URL segments using `{paramName}` syntax. ASP.NET Core automatically converts them to the declared parameter type, returning 400 Bad Request for type mismatches.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Simple string path parameter - no conversion needed
app.MapGet("/users/{username}", (string username) =>
{
    // => username is bound from the URL segment
    // => GET /users/alice => username is "alice"
    return $"User profile: {username}";
    // => Response: "User profile: alice"
});

// Integer path parameter - framework converts string segment to int
app.MapGet("/products/{id:int}", (int id) =>
{
    // => :int is a route constraint - only matches when segment is an integer
    // => GET /products/42 => id is 42 (int)
    // => GET /products/abc => 404 Not Found (constraint fails, no match)
    return Results.Ok(new { ProductId = id, Name = $"Product {id}" });
    // => Response: {"productId":42,"name":"Product 42"}
});

// Multiple path parameters in one route
app.MapGet("/orgs/{orgId:int}/repos/{repoName}", (int orgId, string repoName) =>
{
    // => Both parameters bound from their respective segments
    // => GET /orgs/7/repos/my-project => orgId=7, repoName="my-project"
    return Results.Ok(new
    {
        OrgId = orgId,         // => 7
        RepoName = repoName    // => "my-project"
    });
});

// Optional path parameter using route constraints
app.MapGet("/archive/{year:int}/{month:int?}", (int year, int? month) =>
{
    // => month is optional; ? in constraint and int? in parameter
    // => GET /archive/2024 => year=2024, month=null
    // => GET /archive/2024/3 => year=2024, month=3
    var label = month.HasValue ? $"{year}/{month}" : $"{year}";
    // => label is "2024/3" or "2024"
    return $"Archive for: {label}";
});

app.Run();
```

**Key Takeaway**: Route constraints (`:int`, `:guid`, `:datetime`) enforce type matching at the routing level, returning 404 when constraints fail rather than binding errors. Use nullable types (`int?`) for optional segments.

**Why It Matters**: Route constraints provide a first line of defense against invalid inputs, preventing nonsensical requests from reaching your handler logic. When you declare `{id:int}`, a request for `/products/abc` returns 404 without executing any handler code, reducing attack surface and eliminating boilerplate type-check code. This design keeps handlers focused on business logic rather than input validation.

---

### Example 4: Query String Parameters

Query string parameters are automatically bound from URL query strings to handler method parameters. They are optional by default; declare them as nullable to handle their absence explicitly.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Simple query string binding - ?page=2&size=10
app.MapGet("/posts", (int page = 1, int pageSize = 20) =>
{
    // => Default values make parameters optional
    // => GET /posts => page=1, pageSize=20 (defaults)
    // => GET /posts?page=3&pageSize=5 => page=3, pageSize=5
    var skip = (page - 1) * pageSize;
    // => skip = (3-1)*5 = 10
    return Results.Ok(new
    {
        Page = page,         // => 3
        PageSize = pageSize, // => 5
        Skip = skip          // => 10
    });
});

// Nullable query parameters - explicitly handle missing values
app.MapGet("/search", (string? query, string? category) =>
{
    // => Both are optional; null when not provided
    // => GET /search => query=null, category=null
    // => GET /search?query=dotnet => query="dotnet", category=null
    if (query is null && category is null)
        return Results.BadRequest("Provide query or category");
    // => Returns 400 if neither parameter provided

    return Results.Ok(new { Query = query, Category = category });
    // => Response: {"query":"dotnet","category":null}
});

// Multiple values for same key - array binding
app.MapGet("/filter", (int[] ids) =>
{
    // => GET /filter?ids=1&ids=2&ids=3 => ids=[1,2,3]
    // => Array binding collects all values for the same key name
    return Results.Ok(new { Ids = ids, Count = ids.Length });
    // => Response: {"ids":[1,2,3],"count":3}
});

app.Run();
```

**Key Takeaway**: Query parameters bind by name match. Use default values for optional pagination params, nullable types for truly optional filters, and array types for multi-value parameters.

**Why It Matters**: Clean query parameter handling eliminates tedious `HttpContext.Request.Query["key"]` boilerplate that plagued earlier .NET web APIs. The declarative binding approach documents the API's expected inputs at the method signature level, making the contract visible without needing to read the implementation. Tools like Swagger/OpenAPI can reflect this metadata to generate accurate client SDKs automatically.

---

### Example 5: JSON Request Body Deserialization

When a client sends a JSON body, ASP.NET Core deserializes it into the declared parameter type. The framework uses `System.Text.Json` by default - fast, allocation-friendly, and attribute-configurable.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Record type for request - immutable, concise value object
record CreateProductRequest(string Name, decimal Price, int Stock);
// => record generates constructor, properties, Equals, GetHashCode
// => Immutable by default - ideal for request DTOs

// MapPost with record binding from JSON body
app.MapPost("/products", (CreateProductRequest request) =>
{
    // => JSON body: {"name":"Widget","price":9.99,"stock":100}
    // => Framework deserializes body to CreateProductRequest
    // => request.Name = "Widget"
    // => request.Price = 9.99M (decimal)
    // => request.Stock = 100
    Console.WriteLine($"Creating: {request.Name} at {request.Price:C}");
    // => Output: Creating: Widget at $9.99

    var id = Guid.NewGuid();
    // => id is a new GUID like 3fa85f64-5717-4562-b3fc-2c963f66afa6
    return Results.Created($"/products/{id}", new
    {
        Id = id,
        request.Name,   // => C# shorthand for Name = request.Name
        request.Price,
        request.Stock
    });
    // => Response: 201 Created
    // => Body: {"id":"3fa8...","name":"Widget","price":9.99,"stock":100}
});

// Nested objects bind recursively
record Address(string Street, string City, string PostalCode);
record CreateOrderRequest(string CustomerId, Address ShippingAddress, decimal Total);

app.MapPost("/orders", (CreateOrderRequest order) =>
{
    // => JSON: {"customerId":"c1","shippingAddress":{"street":"123 Main","city":"Portland","postalCode":"97201"},"total":49.99}
    // => order.ShippingAddress.City is "Portland"
    return Results.Ok(new { order.CustomerId, order.ShippingAddress.City });
    // => Response: {"customerId":"c1","city":"Portland"}
});

app.Run();
```

**Key Takeaway**: Declare a record or class as a handler parameter and the framework automatically deserializes JSON request bodies. Use C# record types for clean, immutable request DTOs with minimal boilerplate.

**Why It Matters**: Automatic deserialization eliminates the error-prone manual parsing of `Request.Body` streams. By declaring the expected shape as a typed parameter, you get free documentation (Swagger reads this), compile-time safety (typos become compiler errors), and consistent behavior across all endpoints. Records are particularly valuable for request DTOs because their immutability prevents accidental mutation of parsed input data during request processing.

---

### Example 6: JSON Response Serialization

ASP.NET Core serializes return values to JSON automatically. You control camelCase vs PascalCase, null handling, and custom converters through `JsonSerializerOptions` or attributes.

```csharp
var builder = WebApplication.CreateBuilder(args);

// Configure JSON serialization options globally
builder.Services.ConfigureHttpJsonOptions(options =>
{
    // => JsonSerializerOptions controls all JSON serialization
    options.SerializerOptions.PropertyNamingPolicy = null;
    // => null = PascalCase (default in .NET 8 minimal APIs)
    // => JsonNamingPolicy.CamelCase = camelCase (common for REST APIs)
    options.SerializerOptions.WriteIndented = false;
    // => false = compact JSON (production default - smaller payload)
    // => true = indented JSON (useful for debugging)
    options.SerializerOptions.DefaultIgnoreCondition =
        System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    // => WhenWritingNull omits null properties from JSON output
    // => Cleaner API responses - no "foo": null noise
});

var app = builder.Build();

// Return an anonymous object - serialized to JSON automatically
app.MapGet("/product", () =>
{
    return new
    {
        Id = 1,
        Name = "Widget",
        Description = (string?)null,  // => omitted from response (WhenWritingNull)
        Price = 9.99,
        InStock = true
    };
    // => Response: {"Id":1,"Name":"Widget","Price":9.99,"InStock":true}
    // => Description omitted because it is null and WhenWritingNull is set
});

// TypedResults for compile-time checked response types
app.MapGet("/typed", () =>
{
    var product = new { Id = 42, Name = "Gadget" };
    return TypedResults.Ok(product);
    // => TypedResults.Ok is generic - enables OpenAPI response type inference
    // => Results.Ok is untyped - loses type info for Swagger
});

app.Run();
```

**Key Takeaway**: Configure `JsonSerializerOptions` once via `ConfigureHttpJsonOptions` and it applies to all minimal API endpoints. Use `TypedResults` instead of `Results` when you want OpenAPI to infer response schemas automatically.

**Why It Matters**: Consistent JSON serialization configuration prevents subtle contract breaks where some endpoints return camelCase and others PascalCase. Centralizing the configuration means you change one setting to update all endpoints. The `WhenWritingNull` option keeps response payloads lean, which matters at scale where millions of null fields add measurable bandwidth and parsing overhead for clients.

---

### Example 7: Typed Results and Status Codes

`TypedResults` provides a type-safe way to return specific HTTP status codes. Using typed results enables compile-time response type checking and automatic OpenAPI schema generation.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

record Product(int Id, string Name, decimal Price);

// A handler returning different result types based on outcome
app.MapGet("/products/{id:int}", (int id) =>
{
    // Simulate a product lookup
    if (id <= 0)
        return Results.BadRequest("Product ID must be positive");
    // => Returns 400 Bad Request with plain text body

    if (id > 1000)
        return Results.NotFound(new { Message = $"Product {id} not found" });
    // => Returns 404 Not Found with JSON body

    var product = new Product(id, $"Product {id}", id * 9.99m);
    // => product is Product { Id=42, Name="Product 42", Price=418.58 }
    return Results.Ok(product);
    // => Returns 200 OK with JSON-serialized Product
});

// TypedResults.Created with explicit location and body
app.MapPost("/products", (Product product) =>
{
    // => In production, save to DB and get assigned ID
    var created = product with { Id = 99 };
    // => with expression creates a copy with Id changed to 99
    // => created is Product { Id=99, Name=product.Name, Price=product.Price }
    return TypedResults.Created($"/products/{created.Id}", created);
    // => 201 Created
    // => Location: /products/99
    // => Body: {"id":99,"name":"...","price":...}
});

// Returning various informational results
app.MapGet("/redirect", () =>
    Results.Redirect("https://example.com", permanent: false));
// => 302 Found (temporary redirect)
// => permanent: true would return 301 Moved Permanently

app.MapDelete("/products/{id:int}", (int id) =>
    Results.NoContent());
// => 204 No Content - standard response for successful DELETE

app.Run();
```

**Key Takeaway**: `Results.*` factory methods map semantic HTTP outcomes to correct status codes. Returning `Results.NotFound()` is clearer than remembering that "not found" means status code 404.

**Why It Matters**: Using semantic result methods rather than raw integers prevents accidental misuse of status codes - a common source of API contract bugs. When a developer returns `Results.NotFound()` vs `Results.BadRequest()`, the intent is clear in code review and the correct HTTP semantics are guaranteed. This becomes critical when building APIs consumed by many clients where incorrect status codes cause entire categories of clients to behave incorrectly.

---

## Group 2: Routing and Parameter Binding

### Example 8: Route Constraints and Patterns

Route constraints restrict which URL segments match a route. They act as a validation layer at the routing level, preventing invalid requests from reaching handlers.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// :int - matches integers only
app.MapGet("/users/{id:int}", (int id) =>
    $"User {id}");
// => GET /users/42 => "User 42"
// => GET /users/abc => 404 (constraint fails, route not matched)

// :guid - matches GUID format
app.MapGet("/sessions/{sessionId:guid}", (Guid sessionId) =>
    $"Session {sessionId}");
// => GET /sessions/3fa85f64-5717-4562-b3fc-2c963f66afa6 => matched
// => GET /sessions/not-a-guid => 404

// :minlength and :maxlength - string length constraints
app.MapGet("/codes/{code:minlength(4):maxlength(8)}", (string code) =>
    $"Code: {code}");
// => GET /codes/ABC => 404 (too short, min 4)
// => GET /codes/ABCD1234 => "Code: ABCD1234"
// => GET /codes/TOOLONGCODE => 404 (too long, max 8)

// :min and :max - numeric range constraints
app.MapGet("/pages/{page:int:min(1)}", (int page) =>
    $"Page {page}");
// => GET /pages/0 => 404 (min constraint: must be >= 1)
// => GET /pages/1 => "Page 1"

// :alpha - matches alphabetic characters only
app.MapGet("/categories/{name:alpha}", (string name) =>
    $"Category: {name}");
// => GET /categories/electronics => "Category: electronics"
// => GET /categories/cat123 => 404 (contains digits)

// :regex - custom pattern matching
app.MapGet("/products/{sku:regex(^[A-Z]{{2}}-\\d{{4}}$)}", (string sku) =>
    $"Product SKU: {sku}");
// => {{}} escapes braces in format strings within route templates
// => Pattern: two uppercase letters, hyphen, four digits
// => GET /products/AB-1234 => "Product SKU: AB-1234"
// => GET /products/abc => 404

app.Run();
```

**Key Takeaway**: Chain multiple constraints with `:` to compose validations (`:int:min(1):max(100)`). Route constraints run at the routing stage before your handler receives the request.

**Why It Matters**: Route constraints provide free input validation for URL parameters, keeping this concern at the infrastructure layer where it belongs. A handler that receives an `int id` from `{id:int}` can trust it is a valid integer without checking. This separation prevents handlers from containing URL parsing logic, and it makes routing behavior predictable and self-documenting in the route template itself.

---

### Example 9: Model Binding from Multiple Sources

ASP.NET Core can bind parameters from route segments, query strings, request headers, and request bodies simultaneously. The `[From*]` attributes explicitly declare the binding source.

```csharp
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

record UpdateRequest(string Name, decimal Price);

// Binding from multiple sources in one handler
app.MapPut("/orgs/{orgId:int}/products/{productId:int}", (
    [FromRoute] int orgId,          // => From URL: /orgs/5/products/42
    [FromRoute] int productId,       // => From URL segment
    [FromQuery] bool notify = false, // => From ?notify=true query param
    [FromHeader(Name = "X-API-Version")] string? apiVersion = null,
    // => From request header X-API-Version: 2
    [FromBody] UpdateRequest body    // => From JSON request body
) =>
{
    // => orgId = 5 (route)
    // => productId = 42 (route)
    // => notify = true (query: ?notify=true)
    // => apiVersion = "2" (header)
    // => body.Name = "New Name" (JSON body)
    return Results.Ok(new
    {
        OrgId = orgId,
        ProductId = productId,
        Notify = notify,
        ApiVersion = apiVersion,
        body.Name,
        body.Price
    });
});

// AsParameters for binding a class from multiple sources
// Useful for grouping related parameters
record ProductFilter
{
    [FromQuery] public string? Name { get; init; }       // => ?name=widget
    [FromQuery] public decimal? MinPrice { get; init; }  // => ?minPrice=10
    [FromQuery] public int Page { get; init; } = 1;      // => ?page=2, default 1
};

app.MapGet("/products", ([AsParameters] ProductFilter filter) =>
{
    // => [AsParameters] tells framework to bind each property individually
    // => filter.Name = "widget" (from ?name=widget)
    // => filter.MinPrice = 10.0 (from ?minPrice=10)
    // => filter.Page = 2 (from ?page=2)
    return Results.Ok(filter);
});

app.Run();
```

**Key Takeaway**: Use `[From*]` attributes to be explicit about parameter sources. Use `[AsParameters]` to group related query or route parameters into a single record type, improving readability.

**Why It Matters**: Explicit binding sources make API contracts self-documenting and prevent binding ambiguity bugs. Without `[FromBody]`, the framework might try to bind a complex type from the query string, producing confusing 400 errors. `[AsParameters]` is especially valuable for search endpoints with many query parameters - grouping them into a filter record type makes the handler signature readable and allows sharing filter logic across endpoints.

---

### Example 10: Header and Cookie Binding

Request headers and cookies carry authentication tokens, versioning information, and client preferences. ASP.NET Core binds them as first-class parameters alongside route and query values.

```csharp
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Binding from HTTP request headers
app.MapGet("/api/data", (
    [FromHeader(Name = "Authorization")] string? authorization,
    // => Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    [FromHeader(Name = "Accept-Language")] string acceptLanguage = "en-US",
    // => Accept-Language: fr-FR,fr;q=0.9,en;q=0.8
    // => Default "en-US" used when header is absent
    [FromHeader(Name = "X-Request-Id")] string? requestId = null
    // => X-Request-Id: abc-123 (custom correlation ID from client)
) =>
{
    // => authorization = "Bearer eyJhb..." (or null if missing)
    // => acceptLanguage = "fr-FR,fr;q=0.9,en;q=0.8"
    // => requestId = "abc-123" (or null)

    // Log correlation ID for distributed tracing
    Console.WriteLine($"Processing request: {requestId ?? "no-id"}");
    // => Output: Processing request: abc-123

    return Results.Ok(new
    {
        Language = acceptLanguage,
        HasAuth = authorization is not null,
        RequestId = requestId
    });
});

// Accessing cookies via HttpContext (no [FromCookie] in minimal APIs)
app.MapGet("/preferences", (HttpContext context) =>
{
    // => HttpContext is special - always injected directly, no attribute needed
    var theme = context.Request.Cookies["theme"] ?? "light";
    // => theme is "dark" if cookie exists, otherwise "light"
    var sessionToken = context.Request.Cookies[".AspNetCore.Session"];
    // => .AspNetCore.Session is the default session cookie name
    // => sessionToken contains encrypted session identifier

    return Results.Ok(new { Theme = theme, HasSession = sessionToken is not null });
    // => Response: {"theme":"dark","hasSession":true}
});

app.Run();
```

**Key Takeaway**: Use `[FromHeader(Name = "Header-Name")]` to bind HTTP headers as typed parameters. Access cookies through `HttpContext.Request.Cookies` since there is no `[FromCookie]` attribute in minimal APIs.

**Why It Matters**: Explicit header binding makes API requirements visible in the method signature rather than buried in implementation code. This is critical for API gateway compatibility - when a gateway injects correlation IDs, API versions, or tenant identifiers as headers, declaring them as parameters ensures they appear in OpenAPI documentation and enables integration tests to set them explicitly, preventing silent failures when headers are missing.

---

## Group 3: Middleware Pipeline

### Example 11: Built-in Middleware

ASP.NET Core ships with essential middleware for HTTPS, static files, routing, and security. The order you register middleware matters - requests flow through in registration order, responses flow back in reverse.

```mermaid
%% Middleware pipeline - request flows down, response flows up
graph TD
    A["Incoming Request"] --> B["UseHttpsRedirection<br/>HTTP => HTTPS"]
    B --> C["UseStaticFiles<br/>Serve wwwroot"]
    C --> D["UseRouting<br/>Match endpoints"]
    D --> E["UseAuthentication<br/>Validate identity"]
    E --> F["UseAuthorization<br/>Check permissions"]
    F --> G["MapGet / MapPost<br/>Route handlers"]
    G --> H["Response flows back<br/>through pipeline"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#fff
    style F fill:#CC78BC,stroke:#000,color:#fff
    style G fill:#029E73,stroke:#000,color:#fff
    style H fill:#0173B2,stroke:#000,color:#fff
```

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// HTTPS redirection - redirects HTTP requests to HTTPS
app.UseHttpsRedirection();
// => HTTP GET http://example.com/api => 301 to https://example.com/api
// => Only active in non-development environments by default

// Static file serving - serves files from wwwroot/ folder
app.UseStaticFiles();
// => GET /index.html => serves wwwroot/index.html
// => GET /css/style.css => serves wwwroot/css/style.css
// => No handler needed; terminates pipeline if file found

// Routing middleware - enables endpoint routing
app.UseRouting();
// => Parses URL and selects matching endpoint
// => Must come before UseAuthentication, UseAuthorization

// Authentication middleware - populates HttpContext.User
app.UseAuthentication();
// => Reads JWT from Authorization header or cookie
// => Sets HttpContext.User with claims if token valid
// => Must come BEFORE UseAuthorization

// Authorization middleware - enforces [Authorize] policies
app.UseAuthorization();
// => Checks HttpContext.User against endpoint requirements
// => Returns 401 if unauthenticated, 403 if unauthorized
// => Must come AFTER UseAuthentication

// Request handler registered after middleware pipeline
app.MapGet("/", () => "Pipeline complete");
// => Only reached if all middleware above passes the request through

app.Run();
```

**Key Takeaway**: Middleware order is critical. Authentication must precede authorization, and routing must precede both. Incorrect order causes subtle security holes or runtime exceptions that are hard to diagnose.

**Why It Matters**: The middleware pipeline is the single most important architectural concept in ASP.NET Core. Getting the order wrong can create security vulnerabilities: placing `UseAuthorization` before `UseAuthentication` means authorization decisions are made without a populated user identity. Understanding the pipeline enables you to add cross-cutting concerns like logging, rate limiting, and CORS in the correct position, ensuring every request passes through every necessary check.

---

### Example 12: Custom Middleware with RequestDelegate

Custom middleware wraps the request pipeline to add cross-cutting concerns like logging, timing, correlation IDs, and request validation. The middleware pattern uses `RequestDelegate next` to forward requests.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Inline middleware using Use() - has access to next delegate
app.Use(async (context, next) =>
{
    // BEFORE: Code here runs before the rest of the pipeline
    var correlationId = context.Request.Headers["X-Correlation-Id"]
        .FirstOrDefault() ?? Guid.NewGuid().ToString();
    // => Extract existing ID or generate new one
    // => correlationId = "abc-123" or "3fa85f64-5717-..."

    context.Response.Headers["X-Correlation-Id"] = correlationId;
    // => Add correlation ID to response so clients can trace requests

    var stopwatch = System.Diagnostics.Stopwatch.StartNew();
    // => Start timing before calling next middleware

    await next(context);
    // => Calls the next middleware in the pipeline
    // => After this line, response has been generated

    // AFTER: Code here runs after inner pipeline completes
    stopwatch.Stop();
    // => Measure total request duration
    Console.WriteLine($"[{context.Request.Method}] {context.Request.Path} => {context.Response.StatusCode} ({stopwatch.ElapsedMilliseconds}ms)");
    // => Output: [GET] /products/42 => 200 (5ms)
});

// Run middleware - terminal middleware that does NOT call next
app.Run(async (context) =>
{
    // => Run() is for terminal middleware - handles request without forwarding
    // => Unlike Use(), there is no next to call
    await context.Response.WriteAsync("Hello from terminal middleware");
    // => Writes directly to response body
});

// Note: MapGet etc. are preferred over app.Run for normal route handling
// app.Run() as terminal middleware is rarely used in production code

app.Run(); // Starts the web server
```

**Key Takeaway**: Use `app.Use(async (context, next) => ...)` to wrap the pipeline - run code before `await next(context)` processes the request, and after it processes the response. `app.Run()` creates terminal middleware that does not forward.

**Why It Matters**: Custom middleware is the correct place for cross-cutting concerns that every request needs. Request timing, correlation ID injection, request logging, and exception handling all belong in middleware rather than in individual handlers. This prevents duplicated logic across hundreds of endpoints and ensures consistent behavior even when new endpoints are added. Production systems depend on this pattern for observability and debugging distributed systems.

---

### Example 13: Static Files Configuration

The static files middleware serves files from the `wwwroot` directory. You can configure caching, serve files from custom directories, and restrict access to specific file types.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Basic static file serving from wwwroot/
app.UseStaticFiles();
// => Files in wwwroot/ are served at their relative path
// => wwwroot/images/logo.png => GET /images/logo.png
// => Default cache headers: no explicit caching

// Static files with cache headers for performance
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // => Called before each static file response is sent
        // => ctx.File is the physical file being served
        // => ctx.Context is the HttpContext
        const int durationInSeconds = 60 * 60 * 24 * 365; // 1 year
        ctx.Context.Response.Headers["Cache-Control"] =
            $"public,max-age={durationInSeconds}";
        // => Cache-Control: public,max-age=31536000
        // => Browsers cache this file for up to 1 year
        // => Use with content-hashed filenames for cache busting
    }
});

// Serve files from a non-wwwroot directory
var provider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
    Path.Combine(builder.Environment.ContentRootPath, "uploads"));
// => ContentRootPath is the application root (where .csproj lives)
// => Serves from /uploads/ directory in project root

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = provider,
    RequestPath = "/files"
    // => Files in uploads/ served under /files/ URL prefix
    // => uploads/report.pdf => GET /files/report.pdf
});

// Default files - serve index.html for directory requests
app.UseDefaultFiles();
// => GET / => tries to serve wwwroot/index.html
// => Must be called BEFORE UseStaticFiles to take effect
app.UseStaticFiles(); // serves the default file found above

app.Run();
```

**Key Takeaway**: Call `UseDefaultFiles()` before `UseStaticFiles()` to enable serving `index.html` for directory requests. Configure `OnPrepareResponse` for cache headers on static assets.

**Why It Matters**: Proper static file caching is one of the highest-impact performance optimizations available. Serving CSS, JavaScript, and images with long-lived `Cache-Control` headers eliminates unnecessary round trips for returning visitors. The pattern of content-hashed filenames plus one-year cache headers is the foundation of modern CDN strategies, and ASP.NET Core's static files middleware makes this straightforward without requiring a separate CDN or reverse proxy for static content.

---

### Example 14: Exception Handling Middleware

Unhandled exceptions need centralized handling to return consistent error responses. ASP.NET Core provides `UseExceptionHandler` for production and `UseDeveloperExceptionPage` for development.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Development: show detailed exception page
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    // => Shows full stack trace, request details, and exception info
    // => NEVER enable in production - leaks internal implementation
}
else
{
    // Production: generic error handling
    app.UseExceptionHandler(exceptionApp =>
    {
        exceptionApp.Run(async context =>
        {
            // => This nested app handles the re-executed error request
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            // => Always set content type explicitly in error handlers

            var exception = context.Features
                .Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
            // => IExceptionHandlerFeature holds the original exception

            if (exception is not null)
            {
                Console.WriteLine($"Unhandled exception: {exception.Error.Message}");
                // => Log the actual error internally
                // => Never expose exception details to clients
            }

            await context.Response.WriteAsJsonAsync(new
            {
                Error = "An internal server error occurred.",
                TraceId = context.TraceIdentifier
                // => TraceIdentifier enables correlation with internal logs
                // => Clients can report this ID when filing bug reports
            });
            // => Response: {"error":"An internal server error occurred.","traceId":"..."}
        });
    });
}

// A route that throws to demonstrate error handling
app.MapGet("/boom", () =>
{
    throw new InvalidOperationException("Something went very wrong");
    // => This exception is caught by UseExceptionHandler
    // => Returns 500 with JSON error body (in production)
    // => Returns developer exception page (in development)
});

app.Run();
```

**Key Takeaway**: Always configure `UseExceptionHandler` for production to return JSON error responses without leaking stack traces. Use `UseDeveloperExceptionPage` only in development environments.

**Why It Matters**: Uncaught exceptions that reach the client as HTML error pages or raw exception messages are a major security and usability problem. Security researchers use leaked stack traces to map your application's internal structure. Clients receiving HTML when they expect JSON break in unpredictable ways. Centralized exception handling ensures every error, regardless of where it originates, produces a consistent, safe response format that clients can handle programmatically.

---

## Group 4: Error Handling and Logging

### Example 15: Built-in Logging with ILogger

ASP.NET Core provides a structured logging abstraction through `ILogger<T>`. The built-in providers write to console, debug, and event log. Log levels filter what gets recorded in each environment.

```csharp
var builder = WebApplication.CreateBuilder(args);

// Configure minimum log levels per category
builder.Logging.SetMinimumLevel(LogLevel.Information);
// => LogLevel hierarchy: Trace < Debug < Information < Warning < Error < Critical
// => Information level discards Trace and Debug messages
// => Production typically uses Warning or Error to reduce noise

builder.Logging.AddConsole();
// => Console provider already added by default
// => Explicit here for clarity

var app = builder.Build();

// ILogger injected into minimal API handlers
app.MapGet("/orders/{id:int}", (int id, ILogger<Program> logger) =>
{
    // => ILogger<T> - T is the category (used to filter logs)
    // => ILogger<Program> category shows as "Program" in log output

    logger.LogInformation("Retrieving order {OrderId}", id);
    // => Structured log: message template with named parameter
    // => Log: info: Program[0] Retrieving order 42
    // => {OrderId} is a named placeholder - value stored separately
    // => Enables filtering and querying by OrderId in log aggregators

    if (id <= 0)
    {
        logger.LogWarning("Invalid order ID {OrderId} requested", id);
        // => Warning level - important enough to investigate
        return Results.BadRequest("Order ID must be positive");
    }

    // Simulate order not found
    if (id > 500)
    {
        logger.LogError("Order {OrderId} not found in database", id);
        // => Error level - something went wrong, needs attention
        return Results.NotFound();
    }

    logger.LogDebug("Order {OrderId} retrieved successfully, cost {Cost:C}", id, id * 9.99m);
    // => Debug level - verbose; only logged when debug level enabled
    // => Format specifier :C formats as currency in log output

    return Results.Ok(new { Id = id, Status = "Processed" });
});

app.Run();
```

**Key Takeaway**: Use structured logging with named parameters (`{OrderId}`) rather than string interpolation. Structured parameters enable filtering and aggregation in tools like Elasticsearch, Splunk, and Application Insights.

**Why It Matters**: Structured logging transforms logs from text strings into queryable data. When an incident occurs, the difference between `$"Order {id} failed"` and `LogError("Order {OrderId} failed", id)` is the difference between grepping through gigabytes of text and executing a targeted query like `SELECT * FROM logs WHERE OrderId = 42`. This capability is foundational to production incident response, and the performance benefit of structured logging (no string allocation when log level is filtered) is significant at scale.

---

### Example 16: Problem Details for API Error Responses

RFC 9457 Problem Details is the standard JSON error format for HTTP APIs. ASP.NET Core 8 provides built-in `ProblemDetails` support that standardizes error responses across your API.

```csharp
var builder = WebApplication.CreateBuilder(args);

// Register ProblemDetails service for standardized error responses
builder.Services.AddProblemDetails();
// => Enables ProblemDetailsFactory in DI container
// => Configures automatic problem details for validation errors

var app = builder.Build();

// UseExceptionHandler with problem details
app.UseExceptionHandler();
// => When AddProblemDetails is registered, UseExceptionHandler
// => automatically returns RFC 9457 problem details JSON

app.UseStatusCodePages();
// => Converts bare 404/405/etc. responses to problem details
// => Without this, 404 returns empty body

// Manual problem details response
app.MapGet("/products/{id:int}", (int id) =>
{
    if (id <= 0)
    {
        return Results.Problem(
            title: "Invalid product ID",
            detail: $"Product ID must be positive, received: {id}",
            statusCode: 400,
            type: "https://example.com/problems/invalid-id"
            // => type is a URI identifying the problem category
            // => Clients use type to programmatically identify error class
        );
        // => Response: {
        // =>   "type": "https://example.com/problems/invalid-id",
        // =>   "title": "Invalid product ID",
        // =>   "status": 400,
        // =>   "detail": "Product ID must be positive, received: -1"
        // => }
    }

    if (id > 1000)
        return Results.Problem(
            title: "Product not found",
            detail: $"No product exists with ID {id}",
            statusCode: 404
        );
    // => status: 404, title: "Product not found"

    return Results.Ok(new { Id = id, Name = $"Product {id}" });
});

app.Run();
```

**Key Takeaway**: `Results.Problem()` returns RFC 9457 compliant error responses. Register `AddProblemDetails()` to automatically convert unhandled exceptions and 4xx/5xx responses to standardized JSON.

**Why It Matters**: Consistent error formats are essential for API consumers to build reliable error handling. Without a standard like Problem Details, every team invents their own error format, forcing client developers to write custom error parsing for each API they consume. Problem Details is supported by popular HTTP client libraries and API testing tools, making error handling interoperable and reducing the integration burden on consuming teams.

---

## Group 5: Configuration and Environments

### Example 17: Configuration System

ASP.NET Core's configuration system reads from multiple sources in order. Later sources override earlier ones, enabling environment-specific overrides without code changes.

```mermaid
%% Configuration source precedence
graph TD
    A["appsettings.json<br/>Base configuration"] --> E["Merged<br/>Configuration"]
    B["appsettings.{env}.json<br/>Environment override"] --> E
    C["Environment Variables<br/>Deployment override"] --> E
    D["Command Line Args<br/>Launch override"] --> E
    E --> F["IConfiguration<br/>Injected into services"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
    style F fill:#0173B2,stroke:#000,color:#fff
```

```csharp
// appsettings.json
// {
//   "Database": {
//     "ConnectionString": "Server=localhost;Database=mydb;",
//     "MaxConnections": 10
//   },
//   "Features": {
//     "EnableNewUI": false
//   },
//   "ApiKey": "dev-key-not-secret"
// }

var builder = WebApplication.CreateBuilder(args);
// => CreateBuilder automatically adds:
// => 1. appsettings.json
// => 2. appsettings.{Environment}.json (e.g., appsettings.Production.json)
// => 3. Environment variables
// => 4. Command line arguments
// => Later sources override earlier ones

var app = builder.Build();

// Access configuration values
app.MapGet("/config", (IConfiguration config) =>
{
    // => IConfiguration injected from DI container
    var connString = config["Database:ConnectionString"];
    // => ":" is the separator for nested keys
    // => connString = "Server=localhost;Database=mydb;"

    var maxConns = config.GetValue<int>("Database:MaxConnections");
    // => GetValue<T> converts to typed value
    // => maxConns = 10 (int)

    var enableNewUI = config.GetValue<bool>("Features:EnableNewUI", defaultValue: false);
    // => defaultValue used when key is missing
    // => enableNewUI = false

    // Section-based access
    var dbSection = config.GetSection("Database");
    // => dbSection is a nested IConfiguration for the "Database" key
    var connFromSection = dbSection["ConnectionString"];
    // => connFromSection = "Server=localhost;Database=mydb;"

    return Results.Ok(new { MaxConnections = maxConns, NewUI = enableNewUI });
    // => {"maxConnections":10,"newUI":false}
});

app.Run();
```

**Key Takeaway**: Use `config.GetValue<T>()` for typed access and provide defaults for optional settings. The `:` separator navigates nested JSON objects in the flat key hierarchy.

**Why It Matters**: The layered configuration system is what makes ASP.NET Core applications deployable across multiple environments without code changes. The same binary runs in development with local database settings, in staging with test database credentials, and in production with secrets from a vault - all through configuration layering. This principle, combined with environment variables for secrets, enables the 12-factor app methodology that modern cloud deployments depend on.

---

### Example 18: Strongly Typed Options Pattern

The Options pattern binds configuration sections to typed C# classes, providing type safety, validation, and IntelliSense for configuration values throughout your application.

```csharp
// Define options class - encapsulates a configuration section
public class DatabaseOptions
{
    public const string SectionName = "Database"; // => convention: define section name as constant
    public string ConnectionString { get; init; } = string.Empty;
    // => init allows setting in object initializer but not after
    public int MaxConnections { get; init; } = 10;
    // => Default value of 10 used when key is absent
    public TimeSpan CommandTimeout { get; init; } = TimeSpan.FromSeconds(30);
    // => TimeSpan.FromSeconds(30) as default timeout
}

var builder = WebApplication.CreateBuilder(args);

// Bind configuration section to options class
builder.Services.Configure<DatabaseOptions>(
    builder.Configuration.GetSection(DatabaseOptions.SectionName));
// => Reads "Database" section from appsettings.json
// => Binds to DatabaseOptions properties by name
// => Registers IOptions<DatabaseOptions> in DI container

var app = builder.Build();

// Inject IOptions<T> into handlers
app.MapGet("/db-status", (IOptions<DatabaseOptions> dbOptions) =>
{
    // => IOptions<T>.Value provides the bound configuration object
    var options = dbOptions.Value;
    // => options.ConnectionString = "Server=localhost;Database=mydb;"
    // => options.MaxConnections = 10
    // => options.CommandTimeout = 00:00:30 (TimeSpan)
    return Results.Ok(new
    {
        options.MaxConnections,
        Timeout = options.CommandTimeout.TotalSeconds,
        HasConnectionString = !string.IsNullOrEmpty(options.ConnectionString)
    });
    // => {"maxConnections":10,"timeout":30.0,"hasConnectionString":true}
});

// IOptionsMonitor<T> for hot-reload (changes without restart)
app.MapGet("/live-config", (IOptionsMonitor<DatabaseOptions> monitor) =>
{
    var options = monitor.CurrentValue;
    // => CurrentValue reads latest configuration every time
    // => Useful for feature flags that change without restart
    return Results.Ok(new { options.MaxConnections });
});

app.Run();
```

**Key Takeaway**: Bind configuration to typed classes with `Configure<T>()` and inject `IOptions<T>`. Prefer `IOptionsMonitor<T>` when you need live configuration updates without restarting the application.

**Why It Matters**: The Options pattern eliminates stringly-typed configuration access scattered throughout the codebase. When a configuration key is renamed, the compiler catches every usage because they reference a C# property, not a string key. Options classes also serve as documentation - the `DatabaseOptions` class makes clear exactly what the Database configuration section supports, with types and defaults. Validation via `IValidateOptions<T>` can reject invalid configurations at startup, failing fast rather than discovering misconfiguration at runtime.

---

### Example 19: Environment-Based Configuration

ASP.NET Core supports three built-in environments (Development, Staging, Production) and custom environments. Environment affects logging level, error verbosity, and feature availability.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Check current environment
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
// => Environment: Development (set via ASPNETCORE_ENVIRONMENT)
// => or: Production, Staging, or any custom name

// Environment-specific middleware
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    // => Detailed exception pages only in development
    Console.WriteLine("Developer mode: detailed errors enabled");
}

if (app.Environment.IsProduction())
{
    app.UseHsts();
    // => HTTP Strict Transport Security - production only
    // => Tells browsers to always use HTTPS for this domain
    // => 30-day max-age by default
}

if (app.Environment.IsStaging())
{
    // Staging-specific behavior
    Console.WriteLine("Staging: smoke tests enabled");
}

// Custom environment check
if (app.Environment.IsEnvironment("QualityAssurance"))
{
    // => IsEnvironment() for custom environment names
    Console.WriteLine("QA environment detected");
}

// Environment in configuration
app.MapGet("/info", (IWebHostEnvironment env, IConfiguration config) =>
{
    // => IWebHostEnvironment provides environment and path info
    // => IConfiguration provides all config values
    return Results.Ok(new
    {
        Environment = env.EnvironmentName,      // => "Development"
        ContentRoot = env.ContentRootPath,      // => "/home/app" or "C:\\app"
        WebRoot = env.WebRootPath,              // => Path to wwwroot/
        AppName = env.ApplicationName           // => "MyApp"
    });
});

app.Run();
```

**Key Takeaway**: Use `app.Environment.IsDevelopment()`, `IsProduction()`, and `IsStaging()` to conditionally configure middleware and services. Set `ASPNETCORE_ENVIRONMENT` in deployment scripts to control behavior.

**Why It Matters**: Environment-aware configuration is the clean way to handle the reality that an application behaves differently in development versus production. Enabling developer exception pages in production is a security vulnerability; disabling HTTPS in production is a compliance failure. By encoding these decisions as environment checks rather than hard-coded flags, you create a single codebase that safely runs in any environment without modification, which is essential for CD pipelines that deploy the same artifact to multiple stages.

---

## Group 6: Dependency Injection Basics

### Example 20: Service Registration and Injection

ASP.NET Core has a built-in DI container. Services are registered in the builder's service collection and resolved automatically into handler parameters and constructors.

```csharp
// Define a service interface and implementation
public interface IGreetingService
{
    string Greet(string name);
}

public class GreetingService : IGreetingService
{
    private readonly ILogger<GreetingService> _logger;

    // Constructor injection - DI resolves ILogger automatically
    public GreetingService(ILogger<GreetingService> logger)
    {
        _logger = logger;
        // => logger is ILogger<GreetingService> from DI container
    }

    public string Greet(string name)
    {
        _logger.LogInformation("Greeting {Name}", name);
        // => Logs: Greeting Alice
        return $"Hello, {name}! Welcome to ASP.NET Core.";
        // => Returns "Hello, Alice! Welcome to ASP.NET Core."
    }
}

var builder = WebApplication.CreateBuilder(args);

// Register service - three lifetime options
builder.Services.AddScoped<IGreetingService, GreetingService>();
// => Scoped: one instance per HTTP request
// => Use for services that hold request-specific state
// => Most common lifetime for business logic services

// AddTransient: new instance every time it is resolved
// builder.Services.AddTransient<IGreetingService, GreetingService>();
// => Use for lightweight, stateless services

// AddSingleton: one instance for the application lifetime
// builder.Services.AddSingleton<IGreetingService, GreetingService>();
// => Use for expensive-to-create, thread-safe services (caches, clients)

var app = builder.Build();

// IGreetingService injected directly into minimal API handler
app.MapGet("/greet/{name}", (string name, IGreetingService greetingService) =>
{
    // => greetingService is resolved from DI container
    // => Same instance used for entire request (Scoped)
    var greeting = greetingService.Greet(name);
    // => greeting = "Hello, Alice! Welcome to ASP.NET Core."
    return Results.Ok(greeting);
});

app.Run();
```

**Key Takeaway**: Register services with `AddScoped`, `AddTransient`, or `AddSingleton` based on their required lifetime. Inject them as handler parameters in minimal APIs or via constructor injection in classes.

**Why It Matters**: Dependency injection is the foundation of testable, maintainable ASP.NET Core applications. By depending on `IGreetingService` rather than `GreetingService`, handlers are decoupled from implementation details. This enables unit testing by substituting mock implementations, A/B testing by swapping implementations via configuration, and scalability through appropriate lifetime management. Without DI, testing ASP.NET Core handlers requires spinning up the full web server, making tests slow and fragile.

---

### Example 21: Service Lifetimes in Practice

Understanding the three DI lifetimes prevents subtle bugs from sharing state incorrectly or creating expensive objects unnecessarily. Each lifetime serves distinct use cases.

```csharp
// Transient: new instance every resolution
public class TransientCounter
{
    private static int _created = 0;
    public int Id { get; } = ++_created;
    // => Each new instance gets next sequential ID
    // => Demonstrates new instances are created each time
}

// Scoped: same instance within one HTTP request
public class ScopedRequestContext
{
    public Guid RequestId { get; } = Guid.NewGuid();
    // => RequestId stays the same within one request
    // => Changes for each new HTTP request
}

// Singleton: same instance for application lifetime
public class ApplicationCounter
{
    private int _count = 0;
    public int Increment() => ++_count;
    // => Count persists across all requests
    // => Thread-safe increment required in real code (Interlocked.Increment)
}

var builder = WebApplication.CreateBuilder(args);

// Register with appropriate lifetimes
builder.Services.AddTransient<TransientCounter>();
// => New TransientCounter every injection

builder.Services.AddScoped<ScopedRequestContext>();
// => Same ScopedRequestContext within one HTTP request

builder.Services.AddSingleton<ApplicationCounter>();
// => One ApplicationCounter for the application lifetime

var app = builder.Build();

app.MapGet("/lifetimes", (
    TransientCounter t1,
    TransientCounter t2,          // => DIFFERENT instance from t1
    ScopedRequestContext scoped1,
    ScopedRequestContext scoped2, // => SAME instance as scoped1
    ApplicationCounter singleton  // => SAME instance every request
) =>
{
    return Results.Ok(new
    {
        Transient1Id = t1.Id,     // => 1 (first created this request)
        Transient2Id = t2.Id,     // => 2 (new instance, different ID)
        ScopedId1 = scoped1.RequestId.ToString()[..8],
        ScopedId2 = scoped2.RequestId.ToString()[..8],
        // => ScopedId1 == ScopedId2 (same instance within request)
        TotalRequests = singleton.Increment()
        // => Increments global counter - persists between requests
    });
});

app.Run();
```

**Key Takeaway**: Transient creates new instances every time; Scoped shares one instance per HTTP request; Singleton shares one instance across all requests. Injecting a Scoped service into a Singleton causes a captive dependency bug.

**Why It Matters**: Incorrect lifetime registration is one of the most common ASP.NET Core bugs and can cause subtle data leaks. Registering a database context (Scoped) as Singleton causes the same DbContext to be shared across concurrent requests - leading to threading exceptions or stale data. Registering a transient service that opens a database connection causes connection pool exhaustion. Choosing the correct lifetime prevents these issues and expresses clear intent about how shared state is managed in your application.

---

### Example 22: Registering Framework Services

Many ASP.NET Core features require explicit service registration. Controllers, OpenAPI, authentication, and database access are all registered via extension methods on `IServiceCollection`.

```csharp
var builder = WebApplication.CreateBuilder(args);

// Controllers (MVC-style) - for complex APIs
builder.Services.AddControllers();
// => Registers controller action routing, model binding, and validation
// => Required if using [ApiController] classes instead of minimal APIs
// => Adds JsonOptions for controller responses

// OpenAPI / Swagger documentation
builder.Services.AddEndpointsApiExplorer();
// => Discovers minimal API endpoints for OpenAPI generation
// => Not needed for controllers (they use ApiExplorer directly)

builder.Services.AddSwaggerGen();
// => Generates OpenAPI spec from endpoint metadata
// => Enables Swagger UI for API exploration

// Memory cache
builder.Services.AddMemoryCache();
// => Registers IMemoryCache singleton
// => In-process cache, not distributed

// HTTP client factory
builder.Services.AddHttpClient();
// => Registers IHttpClientFactory singleton
// => Manages HttpClient lifetimes to prevent socket exhaustion

// Response compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    // => Compresses HTTPS responses (disabled by default for security)
    // => Evaluate BREACH attack risk before enabling
});

var app = builder.Build();

// Enable registered middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    // => Serves OpenAPI spec at /swagger/v1/swagger.json
    app.UseSwaggerUI();
    // => Serves Swagger UI at /swagger (browser-friendly)
}

app.UseResponseCompression();
// => Compresses responses using gzip/brotli when client accepts it

app.MapControllers();
// => Maps controller routes - required when using AddControllers()

app.MapGet("/", () => "Services registered and active");

app.Run();
```

**Key Takeaway**: Services must be registered before they can be injected. Register framework features using the `Add*` extension methods in the builder phase, then enable corresponding middleware with `Use*` in the app phase.

**Why It Matters**: The separation between service registration (builder phase) and middleware configuration (app phase) reflects the two-phase lifecycle of an ASP.NET Core application. Understanding this distinction prevents the common mistake of calling `UseSwagger()` without `AddSwaggerGen()`, which causes a runtime exception that is often confusing to diagnose. The registration phase also gives you a single place to audit what capabilities your application depends on.

---

## Group 7: Response Types and Content Negotiation

### Example 23: Content Negotiation

Content negotiation allows clients to request specific response formats using the `Accept` header. ASP.NET Core handles JSON by default, but you can add XML and custom formatters.

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add controllers with XML support for content negotiation
builder.Services.AddControllers(options =>
{
    options.RespectBrowserAcceptHeader = true;
    // => When true, serves HTML to browsers that accept it (not common for APIs)
    // => Default false: always returns JSON regardless of Accept header

    options.ReturnHttpNotAcceptable = true;
    // => Return 406 Not Acceptable if requested format not supported
    // => Default false: falls back to default formatter (JSON)
})
.AddXmlDataContractSerializerFormatters();
// => Adds XML support for requests/responses with Content-Type: application/xml
// => Accept: application/xml => XML response
// => Accept: application/json => JSON response (default)

var app = builder.Build();
app.MapControllers();
app.Run();

// Controller class (in separate file)
// [ApiController]
// [Route("api/[controller]")]
// public class ProductsController : ControllerBase
// {
//     [HttpGet("{id}")]
//     public ActionResult<Product> GetProduct(int id)
//     {
//         // => Client sends Accept: application/xml => XML response
//         // => Client sends Accept: application/json => JSON response
//         // => No Accept header => JSON (default)
//         return new Product { Id = id, Name = "Widget" };
//     }
// }

// Explicit content type in minimal APIs
var app2 = WebApplication.Create();
app2.MapGet("/xml", () =>
{
    var xml = "<product><id>1</id><name>Widget</name></product>";
    return Results.Content(xml, "application/xml");
    // => Results.Content sets body and Content-Type explicitly
    // => Response: 200 OK, Content-Type: application/xml
});

app2.MapGet("/csv", () =>
{
    var csv = "Id,Name,Price\n1,Widget,9.99\n2,Gadget,19.99";
    return Results.Content(csv, "text/csv");
    // => Returns CSV with correct Content-Type
    // => Browsers will prompt download, HTTP clients parse as text
});
```

**Key Takeaway**: Controllers support automatic content negotiation via `Accept` headers. Minimal APIs use `Results.Content()` for explicit content types when you need formats other than JSON.

**Why It Matters**: Content negotiation is essential for APIs that serve multiple client types. An API might serve JSON to JavaScript frontends and XML to legacy enterprise systems consuming the same endpoints. Rather than building separate endpoints for each format, content negotiation lets one endpoint serve all consumers in their preferred format. This reduces API surface area, keeps routing clean, and ensures business logic is not duplicated across format-specific endpoints.

---

### Example 24: Streaming Responses

For large datasets or real-time data, streaming avoids loading all data into memory before sending. ASP.NET Core supports both synchronous and asynchronous response streaming.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Stream a large response using IAsyncEnumerable
app.MapGet("/events/stream", async (HttpContext context) =>
{
    context.Response.Headers["Content-Type"] = "text/event-stream";
    // => Server-Sent Events content type
    // => Clients use EventSource API to receive streamed updates
    context.Response.Headers["Cache-Control"] = "no-cache";
    // => Prevent caching of stream responses

    for (int i = 1; i <= 5; i++)
    {
        await context.Response.WriteAsync($"data: Event {i}\n\n");
        // => SSE format: "data: " prefix, double newline to signal event end
        // => Client EventSource fires an event for each chunk
        await context.Response.Body.FlushAsync();
        // => FlushAsync sends buffered data to client immediately
        await Task.Delay(1000);
        // => Simulates 1 second between events
    }
    // => Client receives 5 events, one per second
});

// Streaming JSON array with IAsyncEnumerable
app.MapGet("/products/large", async IAsyncEnumerable<object> (CancellationToken ct) =>
{
    // => IAsyncEnumerable return type tells ASP.NET Core to stream JSON array
    // => Framework writes "[" then each item as it becomes available
    for (int i = 1; i <= 1000 && !ct.IsCancellationRequested; i++)
    {
        await Task.Delay(10, ct);
        // => Simulate async DB fetch per item
        yield return new { Id = i, Name = $"Product {i}" };
        // => yield return sends each item to the stream
        // => Memory footprint: O(1) per item, not O(n) for all items
    }
    // => Response: [{...},{...},...] streamed progressively
});

app.Run();
```

**Key Takeaway**: Return `IAsyncEnumerable<T>` for streaming JSON arrays. Use `context.Response.WriteAsync` with `FlushAsync` for custom streaming protocols like Server-Sent Events.

**Why It Matters**: Streaming is the correct solution for large datasets that would otherwise exhaust server memory or cause client timeouts. A report endpoint that loads 100,000 rows before responding fails under memory pressure and client timeout constraints. Streaming via `IAsyncEnumerable` uses constant memory regardless of dataset size - the server fetches one page from the database, sends it, then fetches the next, creating backpressure that prevents memory exhaustion even under load.

---

### Example 25: File Responses

ASP.NET Core provides file-serving results for serving documents, downloads, and generated files. These handle range requests, ETags, and content disposition automatically.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Serve a physical file from disk
app.MapGet("/download/report", () =>
{
    var path = Path.Combine("Reports", "annual-report.pdf");
    // => Relative to ContentRootPath (project root)
    return Results.File(
        path,
        contentType: "application/pdf",
        fileDownloadName: "annual-report-2024.pdf"
        // => Content-Disposition: attachment; filename="annual-report-2024.pdf"
        // => fileDownloadName triggers browser download dialog
    );
    // => Response: 200 OK with PDF binary body
});

// Serve a file as inline (display in browser, not download)
app.MapGet("/view/image", () =>
{
    var path = "wwwroot/images/banner.jpg";
    return Results.File(path, "image/jpeg");
    // => No fileDownloadName => Content-Disposition: inline
    // => Browser displays image instead of downloading
});

// Serve dynamically generated file content from byte array
app.MapGet("/generate/csv", () =>
{
    var csv = "Id,Name,Price\n1,Widget,9.99\n2,Gadget,19.99";
    var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
    // => Convert string to byte array for file response
    return Results.File(
        bytes,
        contentType: "text/csv",
        fileDownloadName: "products.csv"
    );
    // => Response: CSV file download
    // => bytes array served without writing to disk first
});

// Serve a stream (useful for reading from storage/S3)
app.MapGet("/stream/file", async () =>
{
    // Simulate reading from cloud storage
    var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("File content here"));
    // => In production: use Azure Blob Storage SDK stream
    return Results.Stream(
        stream,
        contentType: "application/octet-stream",
        fileDownloadName: "data.bin",
        enableRangeProcessing: true
        // => enableRangeProcessing supports HTTP range requests
        // => Enables resumable downloads for large files
    );
});

app.Run();
```

**Key Takeaway**: Use `Results.File()` for physical files and byte arrays, `Results.Stream()` for stream-based content. Set `enableRangeProcessing: true` for large files to support resumable downloads.

**Why It Matters**: Proper file serving with range request support is critical for user experience with large downloads. Without range support, a failed download of a 500MB file requires the user to start over from byte zero. With `enableRangeProcessing`, HTTP clients retry from the last byte received. This matters for production systems serving large exports, video content, or binary packages where network interruptions are common and re-downloading gigabytes is unacceptable.

---

## Group 8: Validation

### Example 26: Data Annotation Validation

ASP.NET Core supports validation through data annotations on model classes and the `IValidatableObject` interface. Add `AddValidation()` to minimal APIs or use `[ApiController]` for automatic validation.

```csharp
using System.ComponentModel.DataAnnotations;

// Request DTO with validation annotations
public record CreateUserRequest
{
    [Required(ErrorMessage = "Username is required")]
    // => [Required] fails if null or empty string
    [StringLength(50, MinimumLength = 3,
        ErrorMessage = "Username must be 3-50 characters")]
    // => [StringLength] validates length range
    public string Username { get; init; } = "";

    [Required]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    // => [EmailAddress] validates email pattern
    public string Email { get; init; } = "";

    [Required]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*\d).{8,}$",
        ErrorMessage = "Password must be 8+ chars with uppercase and digit")]
    // => [RegularExpression] applies custom regex pattern
    public string Password { get; init; } = "";

    [Range(18, 120, ErrorMessage = "Age must be 18-120")]
    // => [Range] for numeric ranges
    public int Age { get; init; }

    [Url(ErrorMessage = "Website must be a valid URL")]
    // => [Url] validates URL format
    public string? Website { get; init; }
}

var builder = WebApplication.CreateBuilder(args);

// For minimal APIs, register validation service
builder.Services.AddValidation();
// => Automatically validates parameters with data annotations
// => Returns 400 with validation errors if validation fails

var app = builder.Build();

app.MapPost("/users", (CreateUserRequest request) =>
{
    // => If AddValidation() registered, framework validates before reaching here
    // => Invalid: 400 Bad Request with errors like:
    // => {"errors":{"Username":["Username must be 3-50 characters"]}}

    // Manual validation without AddValidation() service
    var context = new ValidationContext(request);
    var results = new List<ValidationResult>();
    bool isValid = Validator.TryValidateObject(request, context, results, validateAllProperties: true);
    // => isValid = false if any annotation fails
    // => results contains all validation errors

    if (!isValid)
        return Results.ValidationProblem(
            results.ToDictionary(r => r.MemberNames.First(), r => new[] { r.ErrorMessage! }));
    // => Returns 400 with RFC 9457 validation problem details

    return Results.Created("/users/1", new { Id = 1, request.Username, request.Email });
});

app.Run();
```

**Key Takeaway**: Annotate DTOs with `[Required]`, `[StringLength]`, `[Range]`, and `[EmailAddress]` for declarative validation. Call `builder.Services.AddValidation()` to enable automatic validation in minimal APIs.

**Why It Matters**: Input validation is the first line of defense against malformed data reaching business logic or the database. Data annotations keep validation rules co-located with the data structure they protect, making it obvious what constraints apply without reading handler code. When a field constraint changes (minimum password length increases), you update one attribute in one place rather than hunting through handler implementations. This is especially valuable in APIs consumed by external clients where input variability is high.

---

### Example 27: FluentValidation Integration

FluentValidation provides a powerful, readable validation library that separates validation logic from data models. It supports complex cross-field rules and async validation.

```csharp
// Install: dotnet add package FluentValidation.AspNetCore

using FluentValidation;

// Request record - no annotations, validation is external
public record CreateProductRequest(
    string Name,
    decimal Price,
    int Stock,
    string? CategoryCode
);

// Validator class - separated from request, testable independently
public class CreateProductValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductValidator()
    {
        // RuleFor chains validation rules for each property
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required")
            // => NotEmpty fails if null, empty, or whitespace
            .Length(2, 100).WithMessage("Name must be 2-100 characters")
            // => Length validates min and max simultaneously
            .Matches(@"^[a-zA-Z0-9 \-]+$").WithMessage("Name contains invalid characters");
            // => Matches applies a regex; fails if pattern does not match

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be positive")
            // => GreaterThan is clearer than Range(0.01, decimal.MaxValue)
            .LessThanOrEqualTo(99999.99m).WithMessage("Price exceeds maximum");
            // => LessThanOrEqualTo for upper bound

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0).WithMessage("Stock cannot be negative");

        // Conditional rule - CategoryCode required when Stock > 100
        RuleFor(x => x.CategoryCode)
            .NotEmpty().WithMessage("Category required for high-stock products")
            .When(x => x.Stock > 100);
        // => When() applies rule only when condition is true
        // => Cross-field validation without IValidatableObject
    }
}

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddValidatorsFromAssemblyContaining<CreateProductValidator>();
// => Scans assembly for AbstractValidator<T> implementations
// => Registers all validators in DI container

var app = builder.Build();

app.MapPost("/products", async (CreateProductRequest request,
    IValidator<CreateProductRequest> validator) =>
{
    var result = await validator.ValidateAsync(request);
    // => ValidateAsync supports async rules (e.g., DB uniqueness checks)
    // => result.IsValid = false if any rule fails
    // => result.Errors contains all failures

    if (!result.IsValid)
    {
        var errors = result.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
        // => Errors grouped by property name
        // => {"Name":["Product name is required"],"Price":["Price must be positive"]}
        return Results.ValidationProblem(errors);
        // => 400 Bad Request with validation problem details
    }

    return Results.Created("/products/1", new { Id = 1, request.Name, request.Price });
});

app.Run();
```

**Key Takeaway**: FluentValidation separates validation rules from model classes, enabling complex cross-field rules with readable English-like syntax. Register validators with `AddValidatorsFromAssemblyContaining<T>()` for auto-discovery.

**Why It Matters**: As validation rules grow in complexity, data annotation attributes become unwieldy. A product with 15 fields requiring cross-field validations, async uniqueness checks, and conditional rules is impossible to express cleanly with attributes. FluentValidation keeps these rules organized in dedicated classes that are independently unit-testable. This matters in production systems where validation is business-critical: you can test every edge case of a validator in isolation without spinning up the web server, giving you confidence in the validation logic that guards your data integrity.

---
