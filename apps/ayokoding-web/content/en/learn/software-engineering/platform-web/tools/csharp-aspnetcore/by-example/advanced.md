---
title: "Advanced"
weight: 10000003
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Master advanced ASP.NET Core 8 patterns through 25 annotated examples covering custom middleware, output caching, response compression, gRPC, OpenTelemetry, metrics, Kestrel configuration, Docker deployment, API versioning, global error handling, and custom DI scopes"
tags:
  [
    "aspnetcore",
    "csharp",
    "dotnet",
    "web-framework",
    "tutorial",
    "by-example",
    "advanced",
    "grpc",
    "opentelemetry",
    "kestrel",
    "docker",
    "api-versioning",
    "output-caching",
  ]
---

## Group 22: Advanced Middleware

### Example 56: Custom Middleware Class

Extracting middleware into a dedicated class with injected dependencies is cleaner than inline lambdas for complex cross-cutting concerns. The class pattern enables dependency injection and unit testing.

```csharp
using Microsoft.Extensions.Options;

// Options for the middleware
public class RequestThrottleOptions
{
    public int MaxRequestsPerSecond { get; set; } = 100;
    public bool LogThrottledRequests { get; set; } = true;
}

// Middleware class - not a filter, not a policy - pure pipeline component
public class RequestThrottleMiddleware
{
    private readonly RequestDelegate _next;
    // => _next is the next middleware in the pipeline
    private readonly RequestThrottleOptions _options;
    private readonly ILogger<RequestThrottleMiddleware> _logger;
    // => Services injected via constructor (all Singleton or Transient)

    private int _requestCount = 0;
    private DateTime _windowStart = DateTime.UtcNow;
    // => In production: use proper rate limiting (Semaphore, Redis, etc.)

    public RequestThrottleMiddleware(
        RequestDelegate next,
        IOptions<RequestThrottleOptions> options,
        ILogger<RequestThrottleMiddleware> logger)
    {
        _next = next;
        _options = options.Value;
        _logger = logger;
        // => Middleware constructors receive Singleton-lifetime services
        // => Do NOT inject Scoped services here (captive dependency)
    }

    // InvokeAsync is the required method - called for every request
    public async Task InvokeAsync(HttpContext context)
    {
        // => InvokeAsync called for each request passing through
        // => Can inject Scoped services as method parameters (safe)
        var now = DateTime.UtcNow;

        if ((now - _windowStart).TotalSeconds >= 1)
        {
            Interlocked.Exchange(ref _requestCount, 0);
            // => Interlocked: thread-safe counter reset
            _windowStart = now;
        }

        var count = Interlocked.Increment(ref _requestCount);
        // => Atomic increment; count is the value after increment

        if (count > _options.MaxRequestsPerSecond)
        {
            if (_options.LogThrottledRequests)
                _logger.LogWarning("Request throttled: {Count} req/s exceeds {Max}",
                    count, _options.MaxRequestsPerSecond);
            context.Response.StatusCode = 429;
            // => 429 Too Many Requests
            await context.Response.WriteAsync("Rate limit exceeded");
            return;
            // => return without calling _next: short-circuit the pipeline
        }

        await _next(context);
        // => Call next middleware: request continues through pipeline
    }
}

// Extension method for clean registration
public static class RequestThrottleExtensions
{
    public static IApplicationBuilder UseRequestThrottle(this IApplicationBuilder app)
        => app.UseMiddleware<RequestThrottleMiddleware>();
    // => Extension method hides UseMiddleware<T>() call
    // => app.UseRequestThrottle() reads naturally in Program.cs
}

var builder = WebApplication.CreateBuilder(args);
builder.Services.Configure<RequestThrottleOptions>(options =>
{
    options.MaxRequestsPerSecond = 50;
    // => Override default 100 to 50 req/s
});

var app = builder.Build();
app.UseRequestThrottle();
// => Registers custom middleware via extension method
app.MapGet("/", () => "OK");
app.Run();
```

**Key Takeaway**: Create middleware classes with `RequestDelegate _next` and `InvokeAsync(HttpContext)`. Write extension methods (`UseMyMiddleware()`) for clean registration. Inject Singleton services via constructor; inject Scoped services via `InvokeAsync` parameters.

**Why It Matters**: Production-grade middleware needs unit testing, configuration injection, and clear separation of concerns that inline lambdas cannot provide cleanly. A middleware class for request signing verification, for example, needs injected key stores, testable `InvokeAsync` logic, and configuration for allowed algorithms. The class pattern makes this straightforward while the extension method convention keeps `Program.cs` readable. The `InvokeAsync` parameter injection pattern for Scoped services is the correct way to access per-request state from a pipeline component that lives as a Singleton.

---

### Example 57: Exception Handling Middleware Pattern

A global exception handling middleware catches all unhandled exceptions across the entire pipeline and returns consistent error responses regardless of where the exception originated.

```csharp
using System.Net;
using System.Text.Json;

// Custom exception types for semantic error categorization
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) {}
}

public class ValidationException : Exception
{
    public Dictionary<string, string[]> Errors { get; }
    public ValidationException(Dictionary<string, string[]> errors) : base("Validation failed")
    {
        Errors = errors;
    }
}

public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message) {}
}

// Exception handling middleware
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
            // => Let request proceed through pipeline normally
        }
        catch (NotFoundException ex)
        {
            await WriteErrorResponse(context, HttpStatusCode.NotFound, ex.Message);
            // => Domain not-found exceptions => 404 Not Found
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/problem+json";
            var problem = new
            {
                Type = "https://tools.ietf.org/html/rfc9457#section-3.1",
                Title = "Validation Error",
                Status = 400,
                Errors = ex.Errors
                // => ex.Errors = {"Name":["Name is required"],"Price":["Must be positive"]}
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
        }
        catch (ForbiddenException ex)
        {
            await WriteErrorResponse(context, HttpStatusCode.Forbidden, ex.Message);
            // => Domain forbidden exceptions => 403 Forbidden
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception for {Method} {Path}",
                context.Request.Method, context.Request.Path);
            // => Log full exception with context
            await WriteErrorResponse(context, HttpStatusCode.InternalServerError,
                "An unexpected error occurred");
            // => Generic message hides implementation details from clients
        }
    }

    private static async Task WriteErrorResponse(HttpContext context, HttpStatusCode status, string message)
    {
        context.Response.StatusCode = (int)status;
        context.Response.ContentType = "application/problem+json";
        var body = JsonSerializer.Serialize(new
        {
            Type = $"https://httpstatuses.io/{(int)status}",
            Title = status.ToString(),
            Status = (int)status,
            Detail = message
        });
        await context.Response.WriteAsync(body);
    }
}

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Register FIRST - catches exceptions from all subsequent middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.MapGet("/products/{id:int}", (int id) =>
{
    if (id > 100)
        throw new NotFoundException($"Product {id} does not exist");
    // => Exception propagates up to ExceptionHandlingMiddleware
    // => Returns 404 {"type":"...","title":"NotFound","status":404,"detail":"Product..."}
    return Results.Ok(new { Id = id });
});

app.Run();
```

**Key Takeaway**: Place the exception handling middleware first (before all others) so it wraps the entire pipeline. Map domain exception types to HTTP status codes centrally rather than in individual handlers.

**Why It Matters**: Domain exception types like `NotFoundException` carry semantic intent that is lost when handler code manually checks for null and returns `Results.NotFound()`. Service layer code can throw `NotFoundException` without knowing anything about HTTP, keeping the business logic clean. The exception middleware bridges the domain and HTTP layers by mapping exception types to status codes in one place. This enables service code to be tested independently of HTTP concerns and ensures that adding a new endpoint automatically gets the same exception-to-status-code mapping as all existing endpoints.

---

## Group 23: Performance Optimization

### Example 58: Output Caching

Output caching stores complete HTTP responses in memory or Redis and serves them without executing handlers for repeated identical requests. More powerful than response caching headers.

```csharp
// Install: dotnet add package Microsoft.AspNetCore.OutputCaching
using Microsoft.AspNetCore.OutputCaching;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOutputCache(options =>
{
    // Default policy - applies to endpoints with .CacheOutput() and no policy name
    options.AddBasePolicy(policy =>
        policy.Expire(TimeSpan.FromMinutes(5)));
    // => Default: cache all responses for 5 minutes

    // Named policy for product catalog (cache longer, tag for invalidation)
    options.AddPolicy("ProductsCatalog", policy =>
        policy.Expire(TimeSpan.FromMinutes(30))
              .Tag("products")
              // => Tag enables targeted cache invalidation
              .SetVaryByQuery("category", "page", "pageSize"));
              // => Create separate cache entry for each query parameter combination
              // => GET /products?category=electronics and ?category=books are cached separately
});

var app = builder.Build();
app.UseOutputCache();
// => UseOutputCache must be added before endpoints that use caching

// Cache individual endpoint response
app.MapGet("/products", (string? category) =>
    Results.Ok(new[] { new { Id = 1, Name = "Widget", Category = category } }))
    .CacheOutput("ProductsCatalog");
// => Response cached per "ProductsCatalog" policy
// => First request: handler executes, response stored in cache
// => Subsequent requests (same query params): cached response returned instantly

// Cache with custom duration override
app.MapGet("/hot-deals", () =>
    Results.Ok(new { Deals = new[] { "50% off Widget" } }))
    .CacheOutput(policy => policy.Expire(TimeSpan.FromSeconds(30)));
// => Inline policy: cache hot deals for only 30 seconds (changes frequently)

// Endpoint that invalidates cached entries
app.MapPost("/products", async (object product, IOutputCacheStore cacheStore, CancellationToken ct) =>
{
    // Simulate saving product to database
    await Task.Delay(10, ct);

    await cacheStore.EvictByTagAsync("products", ct);
    // => Evict ALL cached responses tagged "products"
    // => Next request to /products fetches fresh data from handler
    // => Without this: stale cache serves old product list after creation

    return Results.Created("/products/1", product);
});

// No caching for frequently changing data
app.MapGet("/prices/live", () =>
    Results.Ok(new { Price = Random.Shared.NextDouble() * 100 }))
    .CacheOutput(policy => policy.NoCache());
// => NoCache: bypass output cache entirely for this endpoint

app.Run();
```

**Key Takeaway**: Use `CacheOutput()` with named policies for consistent caching behavior. Tag cached responses with `Tag()` to enable selective invalidation via `IOutputCacheStore.EvictByTagAsync()` when underlying data changes.

**Why It Matters**: Output caching operates at a layer below your application code - cached responses are served before the route handler, middleware (except output cache), and authorization run. This makes it dramatically faster than application-level caching and reduces CPU usage for serialization and business logic execution. Tag-based invalidation solves the consistency challenge: when a product is updated, you evict all "products"-tagged cache entries, ensuring clients never receive stale data beyond the invalidation latency. This pattern enables aggressive caching of expensive catalog queries while maintaining correctness.

---

### Example 59: Response Compression

Response compression reduces bandwidth by compressing HTTP responses with gzip or Brotli. Essential for JSON APIs serving large datasets or clients on slow connections.

```csharp
using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    // => Compress HTTPS responses (disabled by default due to CRIME/BREACH attacks)
    // => Evaluate BREACH risk before enabling; mitigate with per-request tokens

    options.Providers.Add<BrotliCompressionProvider>();
    // => Brotli: better compression ratio than gzip (10-20% smaller)
    // => Supported by all modern browsers (Chrome, Firefox, Safari, Edge)

    options.Providers.Add<GzipCompressionProvider>();
    // => Gzip: universal support including legacy clients
    // => Framework picks Brotli if client accepts it, falls back to Gzip

    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "application/json",
        // => Add JSON to compressed types (default includes text/html, text/css, etc.)
        "application/xml",
        "text/csv"
    });
    // => Only compress specified MIME types; binary types (images, video) already compressed
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
    // => CompressionLevel.Fastest: minimum compression, fastest CPU
    // => CompressionLevel.Optimal: balanced (default)
    // => CompressionLevel.SmallestSize: maximum compression, slowest CPU
    // => For JSON APIs: Fastest is usually best (CPU is cheaper than bandwidth)
});

builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

var app = builder.Build();

app.UseResponseCompression();
// => Must be added BEFORE endpoints that return compressible responses
// => And BEFORE UseStaticFiles if serving text assets

app.MapGet("/large-dataset", () =>
{
    // Generate a large JSON response to demonstrate compression
    var data = Enumerable.Range(1, 1000)
        .Select(i => new { Id = i, Name = $"Item {i}", Description = $"Description for item {i}" });
    // => ~70KB uncompressed JSON
    // => ~10KB with Brotli compression (~85% reduction)
    return Results.Ok(data);
});
// => Client sends Accept-Encoding: br, gzip => Framework chooses Brotli
// => Response includes Content-Encoding: br header
// => Without compression: 70KB transfer
// => With Brotli: ~10KB transfer

app.Run();
```

**Key Takeaway**: Register both `BrotliCompressionProvider` and `GzipCompressionProvider`. The framework automatically selects the best format based on the client's `Accept-Encoding` header. Set `CompressionLevel.Fastest` for CPU-sensitive production systems.

**Why It Matters**: Response compression is one of the simplest performance improvements with the highest impact on perceived API speed. A 70KB JSON response compressed to 10KB loads 7x faster on a 1Mbps connection. For APIs serving mobile clients or clients in regions with limited bandwidth, compression is the difference between acceptable and unusable latency. Brotli compression achieves 15-25% better ratios than gzip for typical JSON payloads while adding negligible CPU overhead at `Fastest` compression level on modern hardware.

---

### Example 60: gRPC Service Definition

gRPC uses Protocol Buffers for efficient binary serialization and HTTP/2 for transport, enabling high-throughput, strongly-typed service communication between microservices.

```csharp
// Install: dotnet add package Grpc.AspNetCore

// greet.proto (placed in Protos/ folder):
// syntax = "proto3";
// option csharp_namespace = "MyApp";
// package greet;
//
// service Greeter {
//   rpc SayHello (HelloRequest) returns (HelloReply);
//   rpc SayHelloStream (HelloRequest) returns (stream HelloReply);
// }
//
// message HelloRequest {
//   string name = 1;
// }
//
// message HelloReply {
//   string message = 1;
// }

// Add to .csproj:
// <ItemGroup>
//   <Protobuf Include="Protos\greet.proto" GrpcServices="Server" />
// </ItemGroup>

using Grpc.Core;

// Generated base class from .proto file
// public class GreeterService : Greeter.GreeterBase
// {
//     private readonly ILogger<GreeterService> _logger;
//
//     public GreeterService(ILogger<GreeterService> logger)
//     {
//         _logger = logger;
//     }
//
//     // Unary RPC - one request, one response
//     public override Task<HelloReply> SayHello(HelloRequest request, ServerCallContext context)
//     {
//         // => request.Name from protobuf message
//         _logger.LogInformation("Greeting {Name}", request.Name);
//         return Task.FromResult(new HelloReply
//         {
//             Message = $"Hello, {request.Name}!"
//             // => Protobuf serializes this to binary (not JSON)
//             // => Typically 3-5x smaller than equivalent JSON
//         });
//     }
//
//     // Server-streaming RPC - one request, multiple responses
//     public override async Task SayHelloStream(
//         HelloRequest request,
//         IServerStreamWriter<HelloReply> responseStream,
//         ServerCallContext context)
//     {
//         // => IServerStreamWriter sends multiple responses
//         for (int i = 1; i <= 5; i++)
//         {
//             if (context.CancellationToken.IsCancellationRequested)
//                 break;
//             // => Check cancellation in streaming loops
//
//             await responseStream.WriteAsync(new HelloReply
//             {
//                 Message = $"Hello {request.Name}! (message {i})"
//             });
//             // => Each WriteAsync sends one streaming response
//             await Task.Delay(500, context.CancellationToken);
//             // => Simulate work between messages
//         }
//     }
// }

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddGrpc(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    // => Detailed errors include exception messages in gRPC status
    // => Disable in production to avoid leaking internals
    options.MaxReceiveMessageSize = 4 * 1024 * 1024; // 4MB
    // => Maximum incoming message size
    options.MaxSendMessageSize = null;
    // => No limit on outgoing message size (null = unlimited)
});

var app = builder.Build();
// app.MapGrpcService<GreeterService>();
// => Registers gRPC service at /greet.Greeter/SayHello
// => Clients use generated gRPC stubs to call this endpoint

// gRPC reflection for development tooling (grpcurl, Postman)
// app.MapGrpcReflectionService();
// => Enables runtime service discovery for gRPC tools

app.Run();
```

**Key Takeaway**: Define services in `.proto` files, implement the generated base class, and register with `MapGrpcService<T>()`. gRPC requires HTTP/2 and generates both server and client code from the same schema.

**Why It Matters**: gRPC enables service-to-service communication at significantly higher throughput than REST/JSON. Protobuf binary serialization is 3-5x more compact than JSON, reducing bandwidth costs and deserialization CPU time. Strongly-typed contracts from `.proto` files prevent the integration mismatches common with REST APIs where client and server evolve independently. Server streaming enables efficient data pipelines where the server pushes results incrementally rather than buffering a complete response. For high-frequency microservice communication (thousands of calls per second), these advantages compound significantly.

---

## Group 24: Observability

### Example 61: OpenTelemetry Tracing

OpenTelemetry provides vendor-neutral distributed tracing that tracks requests across service boundaries. Essential for understanding latency and failures in microservice architectures.

```csharp
// Install: dotnet add package OpenTelemetry.Extensions.Hosting
// Install: dotnet add package OpenTelemetry.Instrumentation.AspNetCore
// Install: dotnet add package OpenTelemetry.Instrumentation.Http
// Install: dotnet add package OpenTelemetry.Exporter.Console (dev) or Otlp (prod)

using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using System.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

// Configure OpenTelemetry tracing
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource =>
        resource.AddService(
            serviceName: "products-api",
            // => serviceName appears in trace visualization tools
            serviceVersion: "1.0.0"))
            // => serviceVersion helps correlate traces with deployments
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation(options =>
            {
                options.RecordException = true;
                // => Record exceptions as trace events with full stack trace
                options.EnrichWithHttpRequest = (activity, request) =>
                {
                    activity.SetTag("http.client_ip", request.HttpContext.Connection.RemoteIpAddress?.ToString());
                    // => Add custom tag to every HTTP request span
                };
            })
            // => Automatically creates spans for every HTTP request
            .AddHttpClientInstrumentation()
            // => Creates spans for outgoing HTTP requests (HttpClient)
            .AddEntityFrameworkCoreInstrumentation(options =>
            {
                options.SetDbStatementForText = true;
                // => Include SQL query text in database spans
                // => Disable in production if queries contain sensitive data
            })
            // => Creates spans for every EF Core database operation
            .AddConsoleExporter();
            // => Export traces to console (development)
            // => In production: .AddOtlpExporter() to send to Jaeger, Tempo, etc.
    });

var app = builder.Build();

// Custom trace spans within handlers
app.MapGet("/products/{id:int}", async (int id) =>
{
    using var activity = Activity.Current;
    // => Activity.Current is the current span created by AddAspNetCoreInstrumentation

    activity?.SetTag("product.id", id);
    // => Add custom tag to the HTTP request span
    // => Appears in trace viewer as product.id: 42

    // Simulate business logic
    using var dbActivity = new ActivitySource("products-api").StartActivity("database.lookup");
    // => Create a child span for the database operation
    dbActivity?.SetTag("db.query", $"SELECT * FROM Products WHERE Id = {id}");
    await Task.Delay(10); // Simulate DB query
    dbActivity?.Stop();
    // => Stop records the span duration in the trace

    return Results.Ok(new { Id = id, Name = $"Product {id}" });
});

app.Run();
```

**Key Takeaway**: Register `AddAspNetCoreInstrumentation()`, `AddHttpClientInstrumentation()`, and `AddEntityFrameworkCoreInstrumentation()` to automatically trace requests, outgoing HTTP calls, and database queries. Add custom spans for business logic segments.

**Why It Matters**: Distributed tracing is the primary tool for diagnosing latency problems in microservice architectures. When a request through a chain of 5 services takes 2 seconds instead of 200ms, tracing shows exactly which service span accounts for the latency - the database query, the external HTTP call, or the serialization. Without tracing, diagnosing these issues requires correlation of logs across multiple services by hand, which is impractical at scale. OpenTelemetry's vendor-neutral format means you can switch from Jaeger to Grafana Tempo to Honeycomb without changing application code.

---

### Example 62: Custom Metrics with System.Diagnostics.Metrics

.NET 8 includes a built-in metrics API (`System.Diagnostics.Metrics`) that integrates with OpenTelemetry for exporting to Prometheus, Grafana, and cloud monitoring platforms.

```csharp
// Install: dotnet add package OpenTelemetry.Instrumentation.Runtime
// Install: dotnet add package OpenTelemetry.Exporter.Prometheus.AspNetCore

using System.Diagnostics.Metrics;
using OpenTelemetry.Metrics;

// Service with custom business metrics
public class OrderMetrics : IDisposable
{
    private readonly Meter _meter;
    private readonly Counter<long> _ordersCreated;
    // => Counter: monotonically increasing count (orders placed, errors, etc.)
    private readonly Histogram<double> _orderProcessingDuration;
    // => Histogram: distribution of values (latency, order value, etc.)
    private readonly ObservableGauge<int> _pendingOrders;
    // => ObservableGauge: snapshot of current state (queue depth, connections, etc.)

    private int _pendingOrderCount = 0;

    public OrderMetrics()
    {
        _meter = new Meter("MyApp.Orders", "1.0.0");
        // => Meter identifies the instrumentation library
        // => Name conventionally: "CompanyName.ServiceName.ComponentName"

        _ordersCreated = _meter.CreateCounter<long>(
            "orders.created",
            unit: "{orders}",
            // => Unit uses UCUM notation: {orders} is a custom unit
            description: "Total number of orders created");
        // => Metric name: orders.created; appears in Prometheus as orders_created_total

        _orderProcessingDuration = _meter.CreateHistogram<double>(
            "orders.processing_duration",
            unit: "ms",
            description: "Duration of order processing in milliseconds");
        // => Histogram generates: _count, _sum, _bucket metrics in Prometheus

        _pendingOrders = _meter.CreateObservableGauge<int>(
            "orders.pending",
            () => _pendingOrderCount,
            // => Callback called when metrics are collected (pull-based)
            unit: "{orders}",
            description: "Current number of pending orders");
    }

    public void RecordOrderCreated(string region, string tier)
    {
        _ordersCreated.Add(1,
            new KeyValuePair<string, object?>("region", region),
            // => Tag dimensions for filtering/grouping in dashboards
            new KeyValuePair<string, object?>("tier", tier));
        // => Recorded as: orders.created{region="us-east",tier="premium"}++
        Interlocked.Increment(ref _pendingOrderCount);
    }

    public void RecordProcessingComplete(double durationMs)
    {
        _orderProcessingDuration.Record(durationMs);
        // => Adds value to histogram distribution
        Interlocked.Decrement(ref _pendingOrderCount);
    }

    public void Dispose() => _meter.Dispose();
}

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<OrderMetrics>();
// => Singleton: metrics state shared across all requests

builder.Services.AddOpenTelemetry()
    .WithMetrics(metrics =>
    {
        metrics
            .AddMeter("MyApp.Orders")
            // => Register custom meter to collect its metrics
            .AddAspNetCoreInstrumentation()
            // => HTTP request rate, latency, error rate
            .AddRuntimeInstrumentation()
            // => .NET runtime: GC pauses, thread pool, heap size
            .AddPrometheusExporter();
            // => Expose metrics at /metrics in Prometheus format
    });

var app = builder.Build();
app.MapPrometheusScrapingEndpoint();
// => Prometheus endpoint at /metrics
// => Prometheus server scrapes this every 15-60 seconds

app.MapPost("/orders", async (OrderMetrics metrics) =>
{
    var sw = System.Diagnostics.Stopwatch.StartNew();
    metrics.RecordOrderCreated("us-east", "premium");
    // => Counter incremented with dimension tags

    await Task.Delay(Random.Shared.Next(10, 100)); // Simulate processing

    sw.Stop();
    metrics.RecordProcessingComplete(sw.Elapsed.TotalMilliseconds);
    // => Histogram records actual processing duration

    return Results.Created("/orders/1", new { Id = 1 });
});

app.Run();
```

**Key Takeaway**: Use `Meter.CreateCounter`, `CreateHistogram`, and `CreateObservableGauge` for business metrics. Add dimension tags with `KeyValuePair` to enable per-dimension filtering in Prometheus/Grafana dashboards.

**Why It Matters**: Business metrics are the foundation of SLO (Service Level Objective) monitoring and alerting. You cannot alert on "order processing latency is above 500ms" without a histogram metric tracking that latency. Dimension tags enable queries like "show me error rate broken down by region" - essential for identifying that an outage affects only European customers. The difference between a team that catches degradation in p99 latency before users notice and one that learns about it from customer complaints is almost always whether they have invested in application-level metrics with meaningful dimension tags.

---

## Group 25: Production Configuration

### Example 63: Kestrel Server Configuration

Kestrel is ASP.NET Core's built-in web server. Configure it for production-grade performance: connection limits, HTTPS certificates, and protocol selection.

```csharp
using Microsoft.AspNetCore.Server.Kestrel.Core;
using System.Security.Authentication;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel with production settings
builder.WebHost.ConfigureKestrel((context, options) =>
{
    // Limits to prevent resource exhaustion
    options.Limits.MaxConcurrentConnections = 1000;
    // => Maximum simultaneous connections; null = unlimited
    // => Set to prevent connection pool exhaustion under attack
    options.Limits.MaxConcurrentUpgradedConnections = 100;
    // => WebSocket connections are "upgraded"; track separately
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10MB
    // => Maximum request body size; override per-endpoint for file upload
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);
    // => Maximum time to receive request headers; prevents Slowloris attacks
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
    // => How long to keep idle connection alive
    // => Balance: longer = more memory, shorter = more reconnections

    // HTTP/1.1 endpoint on port 5000
    options.ListenAnyIP(5000, listenOptions =>
    {
        listenOptions.Protocols = HttpProtocols.Http1AndHttp2;
        // => Accept both HTTP/1.1 (REST clients) and HTTP/2 (gRPC clients)
        // => HTTP/2 without TLS requires special client configuration
    });

    // HTTPS endpoint on port 5001 with TLS configuration
    options.ListenAnyIP(5001, listenOptions =>
    {
        listenOptions.UseHttps(httpsOptions =>
        {
            httpsOptions.SslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13;
            // => Only TLS 1.2 and 1.3; disables older insecure versions
            httpsOptions.ServerCertificateSelector = (context, hostName) =>
            {
                // => SNI-based certificate selection (Server Name Indication)
                // => Different certificate per domain on same IP/port
                if (hostName == "api.myapp.com")
                    return LoadCertificate("api.myapp.com.pfx");
                return LoadCertificate("default.pfx");
            };
        });
        listenOptions.Protocols = HttpProtocols.Http1AndHttp2AndHttp3;
        // => HTTP/3 (QUIC) on HTTPS endpoint for latest clients
    });
});

System.Security.Cryptography.X509Certificates.X509Certificate2 LoadCertificate(string name)
{
    // In production: load from Azure Key Vault, AWS Certificate Manager, etc.
    return new System.Security.Cryptography.X509Certificates.X509Certificate2(name, "password");
}

var app = builder.Build();
app.MapGet("/", () => "Kestrel production configuration active");
app.Run();
```

**Key Takeaway**: Configure Kestrel with connection limits, timeouts, and explicit TLS settings for production. Use `HttpProtocols.Http1AndHttp2AndHttp3` on HTTPS endpoints to support the broadest client range including HTTP/3 early adopters.

**Why It Matters**: Default Kestrel settings are optimized for development, not production. Without connection limits, a connection-exhaustion attack or sudden traffic spike can cause the server to accept connections faster than it can process them, leading to memory pressure and eventual OOM crashes. Explicit TLS protocol restriction (TLS 1.2+ only) is required by PCI-DSS and SOC2 compliance, and disabling TLS 1.0/1.1 is a standard security hardening step. HTTP/3 support with QUIC protocol provides significantly better performance for clients on lossy networks like mobile, reducing API latency without any code changes in handlers.

---

### Example 64: Docker Containerization

Containerizing ASP.NET Core applications creates reproducible, isolated deployments. The multi-stage Dockerfile pattern produces minimal, secure images by separating build and runtime concerns.

```dockerfile
# Dockerfile - multi-stage build for ASP.NET Core 8

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
# => SDK image includes build tools, compilers, and CLI
# => Only used during build; NOT included in final image

WORKDIR /src
# => Set working directory in container

# Copy project files first to cache NuGet restore
COPY ["MyApp.csproj", "."]
# => Copy only .csproj to leverage Docker layer caching
# => If .csproj unchanged, dotnet restore is cached
RUN dotnet restore "MyApp.csproj"
# => Restore NuGet packages; cached if .csproj unchanged

# Copy source code and build
COPY . .
# => Copy all source files
RUN dotnet build "MyApp.csproj" -c Release -o /app/build
# => -c Release: optimize for production (no debug symbols, trim IL)
# => -o /app/build: output directory

# Stage 2: Publish (trim and optimize)
FROM build AS publish
RUN dotnet publish "MyApp.csproj" -c Release -o /app/publish \
    --no-restore \
    /p:UseAppHost=false
# => dotnet publish: creates deployable output
# => --no-restore: skip restore (already done in build stage)
# => UseAppHost=false: don't create OS-specific executable (use dotnet command)

# Stage 3: Runtime (minimal production image)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
# => aspnet image: .NET runtime only (not SDK)
# => Much smaller than SDK image (~200MB vs ~700MB)
# => Does not include build tools, compiler, or CLI

WORKDIR /app

# Security: run as non-root user
USER app
# => Switch to non-root user before copying files
# => app user pre-created in aspnet base image with restricted permissions

COPY --from=publish /app/publish .
# => Copy published output from publish stage
# => Only application files; build tools excluded from final image

# Expose port for documentation (does not publish port)
EXPOSE 8080
# => EXPOSE documents the intended port; actual port binding happens at docker run

# Health check for container orchestrators
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health/live || exit 1
# => Docker/Kubernetes uses this to detect unhealthy containers
# => --start-period=5s: give app time to start before checking

ENTRYPOINT ["dotnet", "MyApp.dll"]
# => Start the ASP.NET Core application
# => dotnet MyApp.dll uses the runtime from aspnet base image
```

```csharp
// Program.cs - Configure for containerized deployment
var builder = WebApplication.CreateBuilder(args);

// Configure port from environment (12-factor app pattern)
builder.WebHost.UseUrls(
    Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://+:8080");
// => ASPNETCORE_URLS env var overrides default port
// => http://+:8080 means listen on all interfaces, port 8080
// => Kubernetes sets this via container env vars

var app = builder.Build();
app.MapHealthChecks("/health/live");
app.MapGet("/", () => "Container running");
app.Run();
```

**Key Takeaway**: Multi-stage Dockerfiles separate build (SDK image) from runtime (aspnet image) for minimal, secure production containers. Run as non-root `app` user and configure ports via environment variables for orchestrator compatibility.

**Why It Matters**: Multi-stage builds are the mandatory pattern for production .NET containers. A single-stage build using the SDK image produces a ~700MB container filled with build tools, NuGet CLI, and debug symbols that have no place in production. The multi-stage approach produces a ~200MB runtime image with only the deployed application. Running as non-root is a container security requirement in most enterprise environments and a Kubernetes best practice - if the application is compromised, the attacker gets limited filesystem access. The Docker `HEALTHCHECK` enables orchestrators to route traffic away from unhealthy instances during startup and degradation events.

---

### Example 65: API Versioning

API versioning allows evolving your API contract without breaking existing clients. ASP.NET Core's API versioning library supports URL segment, query string, and header-based versioning.

```csharp
// Install: dotnet add package Asp.Versioning.Http (for minimal APIs)
// Install: dotnet add package Asp.Versioning.Mvc (for controllers)

using Asp.Versioning;
using Asp.Versioning.Builder;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    // => Default version when client does not specify: v1.0
    options.AssumeDefaultVersionWhenUnspecified = true;
    // => Unversioned requests get the default version (backward compatible)
    options.ReportApiVersions = true;
    // => Add api-supported-versions and api-deprecated-versions headers to every response
    // => Clients can discover available versions from response headers
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        // => /api/v1/products - URL segment versioning (most visible)
        new QueryStringApiVersionReader("api-version"),
        // => /api/products?api-version=1.0 - query string versioning
        new HeaderApiVersionReader("X-API-Version")
        // => X-API-Version: 1.0 header versioning
        // => Combine: tries all three; first match wins
    );
});

var app = builder.Build();
var apiGroup = app.NewApiVersionSet()
    .HasApiVersion(new ApiVersion(1, 0))
    // => Declare that version 1.0 exists
    .HasApiVersion(new ApiVersion(2, 0))
    // => Declare that version 2.0 exists
    .HasDeprecatedApiVersion(new ApiVersion(0, 9))
    // => Version 0.9 is deprecated (still works, triggers warning header)
    .ReportApiVersions()
    .Build();

// Version 1 endpoint
var v1 = app.MapGroup("/api/v{version:apiVersion}/products")
    .WithApiVersionSet(apiGroup)
    .MapToApiVersion(new ApiVersion(1, 0));
// => This group handles requests for version 1.0

v1.MapGet("/", () =>
{
    return Results.Ok(new[] { new { Id = 1, Name = "Widget" } });
    // => V1 response: basic product fields
    // => GET /api/v1/products
});

// Version 2 endpoint - richer response
var v2 = app.MapGroup("/api/v{version:apiVersion}/products")
    .WithApiVersionSet(apiGroup)
    .MapToApiVersion(new ApiVersion(2, 0));
// => This group handles requests for version 2.0

v2.MapGet("/", () =>
{
    return Results.Ok(new[] { new
    {
        Id = 1,
        Name = "Widget",
        Sku = "WDG-001",
        // => V2 adds SKU and category (new in v2)
        Category = "Electronics"
    }});
    // => GET /api/v2/products - extended response
});

app.Run();
```

**Key Takeaway**: Use `AddApiVersioning()` with combined version readers to support multiple versioning strategies simultaneously. Use `MapToApiVersion()` to route requests to the correct handler version.

**Why It Matters**: API versioning is essential for any API with external consumers. Without versioning, adding a new required field to a response breaks clients that do not expect it; removing a field breaks clients that depend on it. Versioning allows you to evolve the API (add features in v2, remove deprecated fields in v3) while existing clients continue using v1 undisturbed. The `ReportApiVersions` option is particularly valuable because it tells clients which versions are available and which are deprecated, enabling clients to proactively upgrade before deprecations become removals.

---

### Example 66: Global Error Handling with IProblemDetailsService

`IProblemDetailsService` provides a unified way to produce RFC 9457 Problem Details responses across the entire application, including unhandled exceptions, validation failures, and explicit error returns.

```csharp
using Microsoft.AspNetCore.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails(options =>
{
    // Customize problem details for specific exception types
    options.CustomizeProblemDetails = ctx =>
    {
        // Add request correlation ID to all problem details responses
        ctx.ProblemDetails.Extensions["traceId"] = ctx.HttpContext.TraceIdentifier;
        // => traceId in every error response for support correlation

        ctx.ProblemDetails.Extensions["requestPath"] = ctx.HttpContext.Request.Path.Value;
        // => Include request path for easier log correlation

        // Add more context for 500 errors in development
        if (ctx.Exception is not null && ctx.HttpContext.RequestServices
            .GetRequiredService<IWebHostEnvironment>().IsDevelopment())
        {
            ctx.ProblemDetails.Extensions["exceptionType"] = ctx.Exception.GetType().Name;
            // => exceptionType: "InvalidOperationException" (development only)
            ctx.ProblemDetails.Extensions["exceptionMessage"] = ctx.Exception.Message;
            // => exceptionMessage: "..." (development only - never in production)
        }
    };
});

var app = builder.Build();

// UseExceptionHandler with problem details integration
app.UseExceptionHandler();
// => When AddProblemDetails registered, UseExceptionHandler produces problem JSON
// => All unhandled exceptions => RFC 9457 problem details response

app.UseStatusCodePages();
// => 404 for unknown routes, 405 Method Not Allowed => problem details JSON

app.MapGet("/products/{id:int}", (int id, IProblemDetailsService problemDetailsService, HttpContext context) =>
{
    if (id <= 0)
    {
        // Explicit problem details with custom type
        context.Response.StatusCode = 400;
        return problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = new Microsoft.AspNetCore.Mvc.ProblemDetails
            {
                Type = "https://api.example.com/problems/invalid-id",
                Title = "Invalid Product ID",
                Status = 400,
                Detail = $"Product ID must be positive, got: {id}"
            }
        }).AsTask().ContinueWith(_ => Results.Empty);
        // => Returns problem details JSON with custom type URI
    }

    if (id > 1000)
        throw new InvalidOperationException("Database connection failed");
    // => Unhandled exception => UseExceptionHandler catches
    // => Returns 500 problem details JSON with traceId

    return Task.FromResult(Results.Ok(new { Id = id }));
});

app.Run();
```

**Key Takeaway**: Register `AddProblemDetails()` and customize via `CustomizeProblemDetails` to add correlation IDs and environment-specific debugging information. All error responses (exceptions, 404s, explicit errors) automatically use RFC 9457 format.

**Why It Matters**: Consistent error formatting across an entire API platform is a quality-of-life feature that has significant impact on integration speed. When every error from every endpoint (routing errors, validation errors, business logic errors, unhandled exceptions) returns the same Problem Details structure with the same fields, client developers write one error handler that works for all scenarios. The `traceId` field in every error response is particularly valuable for support workflows: a user reports "I got error XYZ at 10:43am" and the support team queries the logging system for that traceId to find the exact exception, stack trace, and request context in seconds.

---

## Group 26: Advanced DI and Scoping

### Example 67: Factory Pattern and Keyed Services

.NET 8 introduces keyed services, allowing multiple implementations of the same interface to be registered and resolved by key. Essential for strategy pattern and multi-tenant scenarios.

```csharp
var builder = WebApplication.CreateBuilder(args);

// Define interface and multiple implementations
public interface IPaymentProcessor
{
    Task<string> ProcessAsync(decimal amount);
}

public class StripePaymentProcessor : IPaymentProcessor
{
    public async Task<string> ProcessAsync(decimal amount)
    {
        await Task.Delay(50); // Simulate API call
        return $"Stripe: processed ${amount:F2}";
        // => Returns Stripe transaction ID format
    }
}

public class PayPalPaymentProcessor : IPaymentProcessor
{
    public async Task<string> ProcessAsync(decimal amount)
    {
        await Task.Delay(75); // Simulate API call
        return $"PayPal: processed ${amount:F2}";
        // => Returns PayPal transaction reference format
    }
}

// Register keyed services - .NET 8 feature
builder.Services.AddKeyedScoped<IPaymentProcessor, StripePaymentProcessor>("stripe");
// => "stripe" is the service key - used to resolve specific implementation
builder.Services.AddKeyedScoped<IPaymentProcessor, PayPalPaymentProcessor>("paypal");
// => "paypal" key resolves PayPalPaymentProcessor

var app = builder.Build();

// Resolve keyed service in minimal API
app.MapPost("/payments/{provider}", async (
    string provider,
    PaymentRequest request,
    [FromKeyedServices("stripe")] IPaymentProcessor stripeProcessor,
    // => [FromKeyedServices] resolves the implementation with key "stripe"
    IServiceProvider serviceProvider) =>
{
    IPaymentProcessor processor;

    if (provider == "stripe")
        processor = stripeProcessor;
    else if (provider == "paypal")
        processor = serviceProvider.GetRequiredKeyedService<IPaymentProcessor>("paypal");
        // => GetRequiredKeyedService<T>(key) resolves keyed service dynamically
    else
        return Results.BadRequest($"Unknown payment provider: {provider}");

    var result = await processor.ProcessAsync(request.Amount);
    // => Delegates to the correct payment implementation
    return Results.Ok(new { Provider = provider, Result = result });
});

record PaymentRequest(decimal Amount);
app.Run();
```

**Key Takeaway**: Use `AddKeyedScoped<TService, TImpl>(key)` to register named service implementations. Resolve them with `[FromKeyedServices(key)]` in parameters or `GetRequiredKeyedService<T>(key)` for dynamic resolution.

**Why It Matters**: Keyed services solve the "named service" problem that previously required factory patterns, dictionaries, or naming conventions. In multi-tenant systems where different tenants use different implementations (different payment processors, different email providers, different storage backends), keyed services enable clean dependency injection without if/switch statements scattered throughout the codebase. The key is resolved at composition time when known, or dynamically when the selection depends on runtime data, covering both patterns with a consistent API.

---

### Example 68: IDisposable Services and Resource Management

Properly implementing `IDisposable` in services and ensuring they are disposed by the DI container prevents resource leaks (file handles, database connections, HTTP clients).

```csharp
// Service that manages an expensive, disposable resource
public class ReportGeneratorService : IDisposable, IAsyncDisposable
{
    private readonly ILogger<ReportGeneratorService> _logger;
    private bool _disposed = false;
    // => Track disposal state to prevent use-after-dispose

    // Expensive resource that must be released
    private readonly System.IO.MemoryStream _buffer;

    public ReportGeneratorService(ILogger<ReportGeneratorService> logger)
    {
        _logger = logger;
        _buffer = new System.IO.MemoryStream(capacity: 1024 * 1024); // 1MB buffer
        // => Allocate 1MB buffer on construction
        // => Must release this when service is done
        _logger.LogInformation("ReportGeneratorService created with 1MB buffer");
    }

    public async Task<byte[]> GenerateReportAsync(string reportType)
    {
        ObjectDisposedException.ThrowIf(_disposed, nameof(ReportGeneratorService));
        // => Guard against use after disposal
        // => ObjectDisposedException is the correct exception for this scenario

        _buffer.SetLength(0); // Reset buffer for new report
        // => Reuse buffer instead of allocating new one per report

        var reportData = System.Text.Encoding.UTF8.GetBytes($"Report: {reportType}\nGenerated: {DateTime.UtcNow}");
        await _buffer.WriteAsync(reportData);
        // => Write report content to buffer

        return _buffer.ToArray();
        // => Return buffer contents as byte array
    }

    // Synchronous disposal
    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
        // => Tell GC not to call finalizer (already cleaned up)
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _buffer.Dispose();
                // => Release managed resource (MemoryStream)
                _logger.LogInformation("ReportGeneratorService disposed");
            }
            _disposed = true;
        }
    }

    // Async disposal (preferred for async cleanup)
    public async ValueTask DisposeAsync()
    {
        await _buffer.DisposeAsync();
        // => DisposeAsync for async resource cleanup (flush, close)
        GC.SuppressFinalize(this);
    }
}

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<ReportGeneratorService>();
// => Scoped: created per request, DISPOSED at end of request automatically
// => DI container calls Dispose()/DisposeAsync() when scope ends

var app = builder.Build();

app.MapGet("/reports/{type}", async (string type, ReportGeneratorService generator) =>
{
    var bytes = await generator.GenerateReportAsync(type);
    // => Generator Dispose() called by DI container when request ends
    // => 1MB buffer released back to memory pool
    return Results.File(bytes, "application/pdf", $"{type}-report.pdf");
});

app.Run();
```

**Key Takeaway**: Implement `IAsyncDisposable` alongside `IDisposable` for services with async cleanup. Scoped services are automatically disposed by the DI container when the request scope ends.

**Why It Matters**: Resource leaks are one of the most insidious production bugs - they are invisible until the application runs out of file handles, database connections, or memory. ASP.NET Core's DI container automatically disposes `IDisposable` services at scope boundaries, but this only works if your services correctly implement the disposal pattern. Forgetting to dispose `HttpClient` instances (outside of `IHttpClientFactory`) is the classic example that causes socket exhaustion after thousands of requests. Understanding the disposal lifecycle enables writing services that are both correct and efficient in long-running production scenarios.

---

## Group 27: Production Patterns

### Example 69: Graceful Shutdown

Graceful shutdown allows in-flight requests to complete before the process terminates, preventing data loss and client errors during deployments and scaling events.

```csharp
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Configure graceful shutdown timeout
builder.Host.ConfigureHostOptions(options =>
{
    options.ShutdownTimeout = TimeSpan.FromSeconds(30);
    // => Wait up to 30 seconds for active requests to complete
    // => Default is 5 seconds; increase for slow operations (DB transactions, file uploads)
    // => After timeout: force shutdown regardless of active requests
});

var app = builder.Build();

// Access application lifetime events
var lifetime = app.Lifetime;
// => IHostApplicationLifetime provides shutdown notification

lifetime.ApplicationStarted.Register(() =>
    app.Logger.LogInformation("Application started at {Time}", DateTime.UtcNow));
// => Fires when application is fully started and accepting requests

lifetime.ApplicationStopping.Register(() =>
    app.Logger.LogInformation("Application stopping - draining requests"));
// => Fires when SIGTERM received; requests still processing
// => Register cleanup logic here: stop accepting new work, drain queues

lifetime.ApplicationStopped.Register(() =>
    app.Logger.LogInformation("Application stopped at {Time}", DateTime.UtcNow));
// => Fires when all cleanup complete; no more requests

// Long-running endpoint that demonstrates graceful shutdown
app.MapPost("/process", async (HttpContext context) =>
{
    using var cts = CancellationTokenSource.CreateLinkedTokenSource(
        context.RequestAborted);
    // => context.RequestAborted fires when client disconnects
    // => CreateLinkedTokenSource also fires on shutdown

    try
    {
        // Simulate a database transaction that should not be interrupted
        app.Logger.LogInformation("Processing started");
        await Task.Delay(TimeSpan.FromSeconds(5), cts.Token);
        // => 5-second operation; cancelled if shutdown occurs during this
        app.Logger.LogInformation("Processing completed");
        return Results.Ok("Processed");
    }
    catch (OperationCanceledException)
    {
        app.Logger.LogWarning("Processing cancelled due to shutdown");
        return Results.StatusCode(503);
        // => 503 Service Unavailable: request was in progress during shutdown
        // => Client can retry after deployment completes
    }
});

app.Run();
// => On SIGTERM (Kubernetes scale-down or pod eviction):
// => 1. ApplicationStopping fires immediately
// => 2. Kestrel stops accepting new connections
// => 3. Waits up to ShutdownTimeout for active requests
// => 4. ApplicationStopped fires
// => 5. Process exits with code 0
```

**Key Takeaway**: Set `ShutdownTimeout` to cover your longest request duration. Use `lifetime.ApplicationStopping` for cleanup logic. Pass `context.RequestAborted` to long-running async operations to enable cooperative cancellation during shutdown.

**Why It Matters**: Without graceful shutdown, a Kubernetes rolling deployment that terminates a pod mid-request produces 500 errors or timeout errors for clients whose requests were in flight. This creates visible error spikes in dashboards during every deployment. Graceful shutdown with a 30-second timeout means the rolling deployment waits for active requests to complete before terminating the old pod, making deployments invisible to end users. This is the difference between "deployments are scary events" and "deployments are boring events" - a key marker of deployment maturity in production systems.

---

### Example 70: Minimal API Endpoint Filters

Endpoint filters provide a composable way to add cross-cutting concerns to specific minimal API endpoints without the ceremony of middleware for the entire pipeline.

```csharp
// Endpoint filter for request idempotency enforcement
public class IdempotencyFilter : IEndpointFilter
{
    private static readonly HashSet<string> ProcessedKeys = new();
    // => In production: use Redis to share across instances and persist

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var httpContext = context.HttpContext;

        // Check for idempotency key header
        var idempotencyKey = httpContext.Request.Headers["Idempotency-Key"].FirstOrDefault();
        // => Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
        // => Clients send unique key per logical operation

        if (idempotencyKey is null)
            return await next(context);
        // => No key provided: process normally (not enforcing idempotency)

        if (ProcessedKeys.Contains(idempotencyKey))
        {
            // Already processed: return cached response
            httpContext.Response.StatusCode = 200;
            httpContext.Response.Headers["X-Idempotent-Replayed"] = "true";
            // => Header signals to client this is a replayed response
            return Results.Ok(new { Message = "Already processed", Key = idempotencyKey });
            // => Return same logical result without re-processing
        }

        // Process the request
        var result = await next(context);
        // => Execute the actual route handler

        // Mark as processed
        ProcessedKeys.Add(idempotencyKey);
        // => In production: store in Redis with expiration (e.g., 24 hours)

        return result;
    }
}

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Apply idempotency filter to payment endpoint
app.MapPost("/payments", (PaymentRequest req) =>
    Results.Created("/payments/1", new { Id = 1, req.Amount }))
    .AddEndpointFilter<IdempotencyFilter>();
// => AddEndpointFilter<T> adds filter to this specific endpoint
// => First POST with key => processes and records key
// => Second POST with same key => returns cached 200 without processing

// Chain multiple filters (executed in registration order)
app.MapPost("/orders", (object order) =>
    Results.Created("/orders/1", order))
    .AddEndpointFilter<IdempotencyFilter>()
    .AddEndpointFilter(async (context, next) =>
    {
        // Inline filter: add processing timestamp to response
        var result = await next(context);
        context.HttpContext.Response.Headers["X-Processed-At"] =
            DateTime.UtcNow.ToString("O");
        // => ISO 8601 timestamp on every response
        return result;
    });

record PaymentRequest(decimal Amount, string Currency);
app.Run();
```

**Key Takeaway**: Implement `IEndpointFilter` for reusable, composable per-endpoint concerns. Register with `.AddEndpointFilter<T>()`. Filters run in chain order: outer filters wrap inner ones, just like middleware.

**Why It Matters**: Idempotency is critical for financial and mutation operations. Network failures cause clients to retry requests; without idempotency, a payment might be processed twice for a single user action. Endpoint filters make idempotency enforcement opt-in at the endpoint level rather than requiring every handler to check idempotency keys manually. This composable approach enables building a library of reusable filters (idempotency, audit logging, SLA timing, tenant isolation) that individual API designers apply to their endpoints without implementing the logic themselves.

---

### Example 71: Minimal API Source Generation with Slim Builder

ASP.NET Core 8 introduces source-generated registration for trim-friendly deployments. Use `CreateSlimBuilder` to eliminate unused framework features and reduce startup time.

```csharp
// WebApplication.CreateSlimBuilder - minimal feature set for microservices
// Use when targeting AOT (Ahead-of-Time) compilation or minimal containers

var builder = WebApplication.CreateSlimBuilder(args);
// => CreateSlimBuilder omits features not needed for minimal API servers:
// => - No IIS integration (IISIntegration removed)
// => - No HTTPS certificate development tool
// => - No UseStaticFiles (add explicitly if needed)
// => - Registers minimal set of middleware
// => Results in smaller publish size and faster startup

// Configure JSON for AOT-compatible serialization
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonSerializerContext.Default);
    // => AOT requires explicit type info; TypeInfoResolverChain provides it
    // => AppJsonSerializerContext.Default is source-generated (see below)
});

var app = builder.Build();

app.MapGet("/products", () => new[] { new Product(1, "Widget"), new Product(2, "Gadget") });
// => Returns JSON; serialized via source-generated serializer (AOT compatible)

app.MapPost("/products", (Product product) =>
{
    // => Product deserialized from JSON request body
    // => Source-generated deserializer: no runtime reflection
    return Results.Created($"/products/{product.Id}", product);
});

app.Run();

// Source-generated JSON serializer context
[System.Text.Json.Serialization.JsonSerializable(typeof(Product))]
[System.Text.Json.Serialization.JsonSerializable(typeof(Product[]))]
// => [JsonSerializable] registers types for AOT-compatible code generation
// => Compiler generates serialization/deserialization code at build time
// => Eliminates System.Text.Json reflection at runtime
internal partial class AppJsonSerializerContext : System.Text.Json.Serialization.JsonSerializerContext {}

record Product(int Id, string Name);
```

**Key Takeaway**: Use `CreateSlimBuilder` with source-generated `JsonSerializerContext` for AOT-compiled deployments. Add `[JsonSerializable(typeof(T))]` for every type used in requests and responses.

**Why It Matters**: AOT compilation with `CreateSlimBuilder` and source-generated serializers enables deploying ASP.NET Core as a self-contained native executable without the .NET runtime installed. This produces startup times under 10ms versus 500ms+ for JIT-compiled apps - critical for serverless and Azure Container Apps scenarios where cold start latency directly impacts request latency. The elimination of reflection also prevents runtime serialization surprises where a type is not serializable due to missing constructors, catching these issues at build time instead of in production.

---

### Example 72: Hybrid Cache (Multi-Level Caching)

.NET 9's HybridCache combines L1 in-memory and L2 distributed cache for optimal performance. It solves the stampede problem and simplifies cache patterns without manual two-level logic.

```csharp
// Install: dotnet add package Microsoft.Extensions.Caching.Hybrid

using Microsoft.Extensions.Caching.Hybrid;

var builder = WebApplication.CreateBuilder(args);

// Register HybridCache (requires .NET 9 / Microsoft.Extensions.Caching.Hybrid)
builder.Services.AddHybridCache(options =>
{
    options.MaximumPayloadBytes = 1024 * 1024; // 1MB max per entry
    // => Entries larger than this are not cached
    options.MaximumKeyLength = 512;
    // => Maximum cache key string length
    options.DefaultEntryOptions = new HybridCacheEntryOptions
    {
        Expiration = TimeSpan.FromMinutes(5),
        // => L2 (distributed) cache expiration
        LocalCacheExpiration = TimeSpan.FromMinutes(1)
        // => L1 (in-memory) cache expiration; shorter than L2
        // => L1 hit: sub-millisecond, no serialization
        // => L2 hit: Redis fetch + deserialization, few milliseconds
        // => Cache miss: handler executes, result stored in both L1 and L2
    };
});

// Also register distributed cache (Redis) for L2
builder.Services.AddStackExchangeRedisCache(options =>
    options.Configuration = builder.Configuration.GetConnectionString("Redis"));

var app = builder.Build();

app.MapGet("/products/{id:int}", async (int id, HybridCache cache, CancellationToken ct) =>
{
    var product = await cache.GetOrCreateAsync(
        key: $"product:{id}",
        // => Cache key; L1 checked first, then L2, then factory
        factory: async (key, ct) =>
        {
            // => Factory only called on cache miss (both L1 and L2)
            // => StampedeProtection: factory called ONCE even under concurrent misses
            // => All concurrent requests for same key wait for single factory execution
            await Task.Delay(100, ct); // Simulate DB query
            return new ProductDto(id, $"Product {id}", id * 9.99m);
            // => Result stored in both L1 (1 min) and L2 Redis (5 min)
        },
        cancellationToken: ct);

    return Results.Ok(product);
    // => Response time:
    // => L1 hit: < 1ms (in-process memory)
    // => L2 hit: 2-5ms (Redis fetch)
    // => Cache miss: 100ms+ (factory execution)
});

// Invalidate from both L1 and L2
app.MapDelete("/products/{id:int}/cache", async (int id, HybridCache cache, CancellationToken ct) =>
{
    await cache.RemoveAsync($"product:{id}", ct);
    // => RemoveAsync evicts from both L1 and L2 simultaneously
    return Results.NoContent();
});

record ProductDto(int Id, string Name, decimal Price);
app.Run();
```

**Key Takeaway**: `HybridCache.GetOrCreateAsync` checks L1 (in-memory), then L2 (Redis), then calls the factory only on a full cache miss. Stampede protection ensures the factory runs once regardless of concurrent requests.

**Why It Matters**: The two-level cache pattern was previously implemented manually with `IMemoryCache` wrapping `IDistributedCache`, requiring boilerplate code for each cached entity. `HybridCache` provides this pattern built-in with critical improvements: the stampede protection prevents the thundering herd problem that plagues naive implementations, and the unified `RemoveAsync` invalidates both levels atomically. For high-traffic APIs where cache misses are expensive, the combination of sub-millisecond L1 hits and distributed L2 consistency achieves both performance and correctness that neither cache type alone can provide.

---

### Example 73: Request Pipeline Diagnostics

ASP.NET Core's `IHttpLoggingInterceptor` and `HttpLoggingFields` provide fine-grained control over what gets logged from HTTP requests and responses, essential for debugging without logging sensitive data.

```csharp
using Microsoft.AspNetCore.HttpLogging;

var builder = WebApplication.CreateBuilder(args);

// Configure HTTP request/response logging
builder.Services.AddHttpLogging(logging =>
{
    logging.LoggingFields = HttpLoggingFields.All;
    // => HttpLoggingFields.All: logs method, path, headers, status, duration
    // => Use specific flags in production to avoid logging sensitive data:
    // => HttpLoggingFields.RequestMethod | HttpLoggingFields.RequestPath | HttpLoggingFields.Duration

    logging.RequestHeaders.Add("X-Correlation-Id");
    // => Include specific custom headers in logs
    logging.ResponseHeaders.Add("Content-Type");
    // => Log Content-Type in responses

    logging.RequestBodyLogLimit = 4096; // 4KB
    // => Maximum bytes of request body to log (avoid logging huge uploads)
    logging.ResponseBodyLogLimit = 4096;
    // => Maximum bytes of response body to log

    logging.CombineLogs = true;
    // => Combine request + response into single log entry
    // => Easier to correlate request and response in log viewer
});

// Customize logging per route to exclude sensitive paths
builder.Services.AddHttpLoggingInterceptor<SensitivePathInterceptor>();

var app = builder.Build();
app.UseHttpLogging();
// => Must be added before endpoints to capture request information

app.MapGet("/api/products", () => new[] { new { Id = 1 } });
// => Logged: GET /api/products 200 5ms

app.MapPost("/auth/login", () => Results.Ok("token"));
// => SensitivePathInterceptor suppresses body logging for this path

app.Run();

// Custom interceptor to suppress logging for sensitive endpoints
public class SensitivePathInterceptor : IHttpLoggingInterceptor
{
    public ValueTask OnRequestAsync(HttpLoggingInterceptorContext logContext)
    {
        // => Called before request is logged
        if (logContext.HttpContext.Request.Path.StartsWithSegments("/auth"))
        {
            logContext.Disable(HttpLoggingFields.RequestBody);
            // => Do not log request body for /auth paths (contains passwords)
        }
        return ValueTask.CompletedTask;
    }

    public ValueTask OnResponseAsync(HttpLoggingInterceptorContext logContext)
    {
        // => Called before response is logged
        if (logContext.HttpContext.Request.Path.StartsWithSegments("/auth"))
        {
            logContext.Disable(HttpLoggingFields.ResponseBody);
            // => Do not log response body for /auth (contains tokens)
        }
        return ValueTask.CompletedTask;
    }
}
```

**Key Takeaway**: Use `AddHttpLogging()` with specific `HttpLoggingFields` flags and `IHttpLoggingInterceptor` to suppress sensitive data (passwords, tokens) from logs while maintaining full observability for non-sensitive endpoints.

**Why It Matters**: Logging HTTP request and response bodies is essential for debugging API issues, but naive full logging creates compliance violations when bodies contain passwords, PII, or payment card numbers. The interceptor pattern enables a nuanced approach: log everything for most endpoints, suppress bodies for authentication endpoints, mask specific headers containing API keys. This precision is required in environments with GDPR, HIPAA, or PCI compliance requirements where audit logs must not contain certain categories of data, and where the penalty for logging a password is greater than the debugging benefit.

---

### Example 74: Connection Resiliency with Polly

Polly provides resilience policies (retry, circuit breaker, timeout, fallback) for HTTP client calls and database connections. Essential for microservice architectures where transient failures are normal.

```csharp
// Install: dotnet add package Microsoft.Extensions.Http.Resilience

using Microsoft.Extensions.Http.Resilience;

var builder = WebApplication.CreateBuilder(args);

// Configure resilient HTTP client for external API calls
builder.Services.AddHttpClient("ExternalApi", client =>
{
    client.BaseAddress = new Uri("https://api.external.com");
    // => Base address for all requests from this named client
    client.Timeout = TimeSpan.FromSeconds(30);
    // => Overall timeout including retries
})
.AddStandardResilienceHandler(options =>
{
    // Standard resilience pipeline: retry + circuit breaker + timeout
    options.Retry.MaxRetryAttempts = 3;
    // => Retry failed requests up to 3 times
    options.Retry.Delay = TimeSpan.FromMilliseconds(200);
    // => Initial retry delay; doubled with jitter on each attempt
    options.Retry.BackoffType = Polly.DelayBackoffType.Exponential;
    // => Exponential backoff: 200ms, 400ms, 800ms between retries
    // => Prevents thundering herd when downstream is overloaded

    options.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(60);
    // => Evaluate failure rate over 60-second window
    options.CircuitBreaker.FailureRatio = 0.5;
    // => Open circuit when >50% of requests fail in sampling window
    options.CircuitBreaker.MinimumThroughput = 10;
    // => Minimum requests before circuit breaker evaluates failure rate
    // => Prevents false positives on low traffic

    options.AttemptTimeout.Timeout = TimeSpan.FromSeconds(5);
    // => Individual attempt timeout (before retry); 5s per try
});

var app = builder.Build();

app.MapGet("/weather", async (IHttpClientFactory httpClientFactory) =>
{
    var client = httpClientFactory.CreateClient("ExternalApi");
    // => Creates HttpClient with resilience pipeline from registration

    try
    {
        var response = await client.GetAsync("/weather/current");
        // => On network failure: retries up to 3 times with backoff
        // => If circuit open: fails immediately with BrokenCircuitException
        response.EnsureSuccessStatusCode();
        var weather = await response.Content.ReadAsStringAsync();
        return Results.Ok(weather);
    }
    catch (Polly.CircuitBreaker.BrokenCircuitException)
    {
        // => Circuit is open: external API is unhealthy
        return Results.StatusCode(503);
        // => 503 Service Unavailable: dependency is down
        // => Client should retry after some time
    }
});

app.Run();
```

**Key Takeaway**: Use `AddStandardResilienceHandler()` for batteries-included retry, circuit breaker, and timeout policies. The circuit breaker prevents retry storms by stopping calls to consistently failing services.

**Why It Matters**: In microservice architectures, transient failures (brief network blips, momentary overloads) are expected rather than exceptional. Without retry policies, every transient failure surfaces as a user-visible error. Without circuit breakers, retrying against a failing service amplifies load during recovery, turning a partial outage into a complete one. The circuit breaker is particularly critical: once it opens (failure rate too high), it fails fast without sending traffic to the overloaded service, allowing that service to recover. This pattern is the difference between a cascading failure (entire system down) and a graceful degradation (one service unhealthy, others unaffected).

---

### Example 75: Structured Logging with Serilog

Serilog extends ASP.NET Core's logging infrastructure with enrichers, sinks, and structured output. It enables sending logs to multiple destinations with different formats.

```csharp
// Install: dotnet add package Serilog.AspNetCore
// Install: dotnet add package Serilog.Sinks.Console
// Install: dotnet add package Serilog.Sinks.File
// Install: dotnet add package Serilog.Enrichers.Environment

using Serilog;
using Serilog.Events;

// Configure Serilog before building the host
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    // => Global minimum log level
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    // => Override: only log Warning+ from Microsoft namespace
    // => Reduces noisy framework logs in production
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Information)
    // => But keep EF Core at Information to see SQL queries
    .Enrich.FromLogContext()
    // => FromLogContext: adds properties pushed with LogContext.PushProperty()
    .Enrich.WithMachineName()
    // => Adds MachineName property to every log event
    // => Essential for identifying which server produced a log in distributed systems
    .Enrich.WithEnvironmentName()
    // => Adds EnvironmentName (Development/Production) to every event
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    // => Console output with custom template
    .WriteTo.File(
        "logs/app-.log",
        rollingInterval: RollingInterval.Day,
        // => New file each day: logs/app-20240315.log
        retainedFileCountLimit: 7,
        // => Keep 7 days of log files; older files deleted automatically
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{Properties:j}{NewLine}{Exception}")
    // => JSON properties appended to each file log line
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();
// => Replace default ILogger with Serilog implementation

var app = builder.Build();

// Request logging middleware from Serilog
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    // => Custom format for request log messages
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"]);
        // => Enrich request log with additional properties
    };
});

app.MapGet("/api/data", (ILogger<Program> logger) =>
{
    using (LogContext.PushProperty("OperationId", Guid.NewGuid().ToString("N")))
    {
        // => LogContext.PushProperty adds property to all logs within this using block
        logger.LogInformation("Processing data request with {OperationId}");
        // => Log: Processing data request with OperationId=abc123
        // => OperationId automatically removed from context when block exits
    }
    return Results.Ok(new { Data = "structured and enriched" });
});

app.Run();
```

**Key Takeaway**: Configure Serilog with enrichers (`WithMachineName`, `FromLogContext`), multiple sinks (Console, File, cloud), and `MinimumLevel.Override` to reduce framework noise. Use `LogContext.PushProperty()` for operation-scoped context enrichment.

**Why It Matters**: Serilog's structured output transforms logs from text strings into queryable JSON events. In Elasticsearch or Splunk, you can query `MachineName: web-01 AND RequestPath: /payments AND StatusCode: 500` to find all payment failures on a specific server in seconds. Without structure, this requires regex-based text searching that is slow and error-prone. The `Override` configuration for Microsoft framework logs is essential in production: without it, every EF Core query and every request generates verbose debug output that floods log storage and obscures application-level events.

---

### Example 76: Advanced Authorization with Resource-Based Authorization

Resource-based authorization makes access control decisions based on the specific resource being accessed, enabling "is this user allowed to edit THIS post?" rather than "is this user an editor?"

```csharp
using Microsoft.AspNetCore.Authorization;

// Resource whose access we are controlling
public class Document
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string OwnerId { get; set; } = "";
    // => OwnerId is the user ID of the document creator
    public bool IsPublic { get; set; }
}

// Operations that can be performed on a document
public static class DocumentOperations
{
    public static readonly OperationAuthorizationRequirement Read =
        new() { Name = "Read" };
    public static readonly OperationAuthorizationRequirement Edit =
        new() { Name = "Edit" };
    public static readonly OperationAuthorizationRequirement Delete =
        new() { Name = "Delete" };
    // => OperationAuthorizationRequirement: named requirement for specific action
}

// Authorization handler that checks user against document
public class DocumentAuthorizationHandler :
    AuthorizationHandler<OperationAuthorizationRequirement, Document>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        OperationAuthorizationRequirement requirement,
        Document resource)
    {
        var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        // => userId from JWT claim

        if (requirement.Name == "Read")
        {
            // Anyone can read public documents; owners can read their own
            if (resource.IsPublic || resource.OwnerId == userId)
                context.Succeed(requirement);
            // => context.Succeed marks this requirement as satisfied
        }
        else if (requirement.Name is "Edit" or "Delete")
        {
            // Only owners can edit or delete
            if (resource.OwnerId == userId)
                context.Succeed(requirement);
            // => Returns 403 Forbidden if not the owner

            // Admins can edit/delete any document
            if (context.User.IsInRole("admin"))
                context.Succeed(requirement);
        }

        return Task.CompletedTask;
        // => No Succeed call = requirement not met = 403 Forbidden
    }
}

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddAuthorizationBuilder();
builder.Services.AddSingleton<IAuthorizationHandler, DocumentAuthorizationHandler>();
// => Register handler as Singleton (no request-scoped dependencies)
builder.Services.AddAuthentication().AddJwtBearer(_ => { });

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/documents/{id:int}", async (
    int id,
    IAuthorizationService authService,
    ClaimsPrincipal user) =>
{
    // Simulate loading document from database
    var document = new Document { Id = id, Title = "My Doc", OwnerId = "user-123", IsPublic = false };

    var result = await authService.AuthorizeAsync(user, document, DocumentOperations.Read);
    // => authService.AuthorizeAsync checks policies and handlers against the specific resource
    // => result.Succeeded = true if DocumentAuthorizationHandler called context.Succeed()
    if (!result.Succeeded)
        return Results.Forbid();
    // => Results.Forbid() returns 403 Forbidden

    return Results.Ok(document);
})
.RequireAuthorization();
// => RequireAuthorization ensures user is authenticated
// => Resource-based check happens explicitly in handler via authService.AuthorizeAsync

app.Run();
```

**Key Takeaway**: Use `IAuthorizationService.AuthorizeAsync(user, resource, operation)` for resource-based access control. Implement `AuthorizationHandler<TRequirement, TResource>` to evaluate permissions against the specific resource instance.

**Why It Matters**: Role-based authorization (`[Authorize(Roles = "editor")]`) cannot express "allow access only to the user who created this document." Resource-based authorization bridges this gap by providing the actual database entity to the authorization handler, enabling ownership checks, sharing permissions, and team-based access that are common in real applications. Without this pattern, access control logic ends up scattered in service layer code as ad-hoc null checks, making it impossible to audit all authorization logic in one place or reuse it across different operations on the same resource.

---

### Example 77: Request Decompression

Clients can compress request bodies to reduce upload bandwidth. ASP.NET Core 7+ includes built-in request decompression middleware.

```csharp
var builder = WebApplication.CreateBuilder(args);

// Enable request decompression - decompress incoming compressed request bodies
builder.Services.AddRequestDecompression(options =>
{
    // Gzip and Brotli are registered by default
    // options.DecompressionProviders.Add(new CustomDecompressionProvider());
    // => Add custom decompression for non-standard encodings
});

var app = builder.Build();
app.UseRequestDecompression();
// => Decompress request bodies with Content-Encoding: gzip or br
// => Handler receives decompressed data; compression is transparent

app.MapPost("/bulk-import", (BulkImportRequest request) =>
{
    // => Client sends: POST /bulk-import with Content-Encoding: gzip
    // => Body is compressed JSON (~70% smaller for large datasets)
    // => UseRequestDecompression inflates before reaching this handler
    // => Handler sees normal JSON as if no compression was used

    Console.WriteLine($"Received {request.Items.Length} items");
    // => request.Items is the decompressed array of items
    return Results.Accepted(value: new { Received = request.Items.Length });
    // => 202 Accepted: bulk import will be processed asynchronously
});

// Demonstrate: how a client would send compressed request
// using System.IO.Compression;
// var json = JsonSerializer.Serialize(largeData);
// var bytes = Encoding.UTF8.GetBytes(json);
// using var ms = new MemoryStream();
// using var gz = new GZipStream(ms, CompressionMode.Compress);
// gz.Write(bytes);
// gz.Close();
// request.Content = new ByteArrayContent(ms.ToArray());
// request.Content.Headers.ContentEncoding.Add("gzip");
// => Client compresses body and sets Content-Encoding: gzip header

record BulkImportRequest(string[] Items);
app.Run();
```

**Key Takeaway**: Register `AddRequestDecompression()` and call `UseRequestDecompression()` to transparently support compressed POST and PUT bodies with `Content-Encoding: gzip` or `Content-Encoding: br`.

**Why It Matters**: Request compression is the client-to-server equivalent of response compression. For bulk data import operations where clients send thousands of records in a single request, gzip compression typically achieves 70-90% size reduction for JSON payloads. This transforms a 10MB bulk import into a 1-3MB network transfer, reducing upload time and bandwidth costs. The middleware approach makes this transparent to handler code, so adding compression support to existing bulk endpoints requires adding two lines to `Program.cs` rather than modifying every import handler to detect and decompress the body.

---

### Example 78: Minimal API Route Handlers as Classes

Organizing minimal API handlers into classes instead of inline lambdas enables better testability, shared dependencies, and cleaner code organization for large APIs.

```csharp
// Handler class for product endpoints
public class ProductHandlers
{
    private readonly IProductRepository _repository;
    private readonly ILogger<ProductHandlers> _logger;

    public ProductHandlers(IProductRepository repository, ILogger<ProductHandlers> logger)
    {
        _repository = repository;
        _logger = logger;
        // => Constructor injection works in handler classes
        // => Dependencies resolved by DI when handler instance is created
    }

    // Handler methods - must be callable by the framework
    public async Task<IResult> GetAll(int page = 1, int pageSize = 20)
    {
        // => Method signature matches what MapGet expects
        // => Parameters bound from query string (no [FromQuery] needed)
        var products = await _repository.GetPageAsync(page, pageSize);
        // => Use injected repository instead of inline DB calls
        _logger.LogInformation("Retrieved page {Page} with {Count} products", page, products.Count);
        return TypedResults.Ok(products);
    }

    public async Task<IResult> GetById(int id)
    {
        var product = await _repository.FindAsync(id);
        // => product is null if not found
        return product is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(product);
    }

    public async Task<IResult> Create(CreateProductDto dto)
    {
        var product = await _repository.CreateAsync(dto);
        return TypedResults.Created($"/products/{product.Id}", product);
    }
}

// Register handler class and map routes
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<ProductHandlers>();
// => Scoped: new instance per request; dependencies also scoped
builder.Services.AddScoped<IProductRepository, InMemoryProductRepository>();

var app = builder.Build();

// Map using handler class methods
var group = app.MapGroup("/products").WithTags("Products");

group.MapGet("/", async (ProductHandlers handlers, int page = 1) =>
    await handlers.GetAll(page));
// => Handlers resolved from DI, method called with bound parameters

group.MapGet("/{id:int}", async (int id, ProductHandlers handlers) =>
    await handlers.GetById(id));

group.MapPost("/", async (CreateProductDto dto, ProductHandlers handlers) =>
    await handlers.Create(dto));

app.Run();

// Supporting types
public interface IProductRepository
{
    Task<List<ProductDto>> GetPageAsync(int page, int pageSize);
    Task<ProductDto?> FindAsync(int id);
    Task<ProductDto> CreateAsync(CreateProductDto dto);
}

public class InMemoryProductRepository : IProductRepository
{
    private readonly List<ProductDto> _products = new()
    {
        new(1, "Widget", 9.99m),
        new(2, "Gadget", 19.99m)
    };

    public Task<List<ProductDto>> GetPageAsync(int page, int pageSize)
        => Task.FromResult(_products.Skip((page - 1) * pageSize).Take(pageSize).ToList());

    public Task<ProductDto?> FindAsync(int id)
        => Task.FromResult(_products.FirstOrDefault(p => p.Id == id));

    public Task<ProductDto> CreateAsync(CreateProductDto dto)
    {
        var product = new ProductDto(_products.Count + 1, dto.Name, dto.Price);
        _products.Add(product);
        return Task.FromResult(product);
    }
}

record ProductDto(int Id, string Name, decimal Price);
record CreateProductDto(string Name, decimal Price);
```

**Key Takeaway**: Inject dependencies into handler classes via constructor injection. Register handler classes as Scoped in DI and reference their methods in `MapGet`/`MapPost` lambdas.

**Why It Matters**: As minimal API files grow to hundreds of endpoints, inline lambda handlers with captured dependencies become difficult to test and maintain. Handler classes bring the testability benefits of controllers (mock the repository, unit test the handler) to minimal APIs without the convention overhead of `[ApiController]` and `[Route]` attributes. Teams that adopt this pattern find they can write unit tests for handlers by instantiating the class with mock dependencies, without needing `WebApplicationFactory` or HTTP client infrastructure, reducing test execution time significantly.

---

### Example 79: SignalR with Typed Hubs

Typed hubs use interfaces to define the methods clients implement, providing compile-time safety for server-to-client calls and enabling IDE refactoring support.

```csharp
using Microsoft.AspNetCore.SignalR;

// Interface defining methods the client must implement
// Server calls these methods on connected clients
public interface IChatClient
{
    Task ReceiveMessage(string user, string message, DateTime timestamp);
    // => Client JavaScript: connection.on("ReceiveMessage", (user, msg, time) => ...)
    Task UserJoined(string username, int totalUsers);
    Task UserLeft(string username, int totalUsers);
}

// Typed hub: Hub<IChatClient> - server methods are type-checked
public class TypedChatHub : Hub<IChatClient>
{
    private static readonly Dictionary<string, string> UserConnections = new();
    // => In production: use IDistributedCache for multi-server support

    public async Task Join(string username)
    {
        // => Client calls: await connection.invoke("Join", "alice")
        UserConnections[Context.ConnectionId] = username;
        // => Map connection ID to display name

        await Groups.AddToGroupAsync(Context.ConnectionId, "general");
        // => Add to "general" channel

        await Clients.All.UserJoined(username, UserConnections.Count);
        // => Clients.All.UserJoined is TYPED: compiler checks method signature
        // => Must match IChatClient.UserJoined(string, int) exactly
        // => Without typed hubs: Clients.All.SendAsync("UserJoined", username, count) - untyped string
    }

    public async Task SendMessage(string message)
    {
        // => Client calls: await connection.invoke("SendMessage", "Hello everyone!")
        var username = UserConnections.GetValueOrDefault(Context.ConnectionId, "Unknown");
        // => Look up display name from connection ID

        await Clients.All.ReceiveMessage(username, message, DateTime.UtcNow);
        // => TYPED: compiler enforces (string, string, DateTime) signature
        // => IDE refactoring renames "ReceiveMessage" everywhere safely
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (UserConnections.TryGetValue(Context.ConnectionId, out var username))
        {
            UserConnections.Remove(Context.ConnectionId);
            await Clients.Others.UserLeft(username, UserConnections.Count);
            // => Notify remaining users of departure
        }
        await base.OnDisconnectedAsync(exception);
    }
}

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSignalR();

var app = builder.Build();
app.MapHub<TypedChatHub>("/hubs/chat");
// => WebSocket endpoint: clients connect to /hubs/chat

app.Run();
```

**Key Takeaway**: `Hub<TClientInterface>` provides compile-time checking for all `Clients.All.*`, `Clients.Group(name).*`, and `Clients.Client(id).*` calls. The interface documents the contract clients must implement.

**Why It Matters**: Non-typed SignalR hubs use `SendAsync("MethodName", args)` where the method name is a string. Renaming a client method requires manually updating every `SendAsync` call - a refactoring nightmare in large applications with dozens of hub methods. Typed hubs transform this into a compile-time-checked interface: renaming `ReceiveMessage` in the interface triggers compiler errors at every call site, making refactoring safe. The interface also serves as the documentation for JavaScript/TypeScript client developers who need to know exactly what methods to implement and what parameters they receive.

---

### Example 80: Application Startup Validation

Validate critical configuration and dependencies at startup rather than discovering failures at runtime under production load. Fail fast with descriptive error messages.

```csharp
using Microsoft.Extensions.Options;

// Options class with validation annotations
public class JwtOptions
{
    public const string Section = "Jwt";

    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.MinLength(32, ErrorMessage = "JWT key must be at least 32 characters")]
    public string SecretKey { get; init; } = "";
    // => [Required] + [MinLength] validated at startup

    [System.ComponentModel.DataAnnotations.Required]
    public string Issuer { get; init; } = "";

    [System.ComponentModel.DataAnnotations.Range(1, 1440)]
    public int ExpiryMinutes { get; init; } = 60;
    // => [Range] validates minutes is between 1 and 1440 (24 hours max)
}

// Custom startup validation service
public class StartupValidationService : IHostedService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<StartupValidationService> _logger;

    public StartupValidationService(IServiceProvider services, ILogger<StartupValidationService> logger)
    {
        _services = services;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Running startup validation checks...");
        var errors = new List<string>();

        // Check database connectivity
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetService<AppDbContext>();
        if (db is not null)
        {
            try
            {
                await db.Database.CanConnectAsync(cancellationToken);
                // => CanConnectAsync returns true if database is reachable
                _logger.LogInformation("Database connectivity: OK");
            }
            catch (Exception ex)
            {
                errors.Add($"Database unreachable: {ex.Message}");
                // => Add to errors list instead of throwing immediately
                // => Collect ALL errors before reporting
            }
        }

        // Check required external configuration
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var externalApiUrl = config["ExternalApi:BaseUrl"];
        if (string.IsNullOrEmpty(externalApiUrl))
            errors.Add("ExternalApi:BaseUrl configuration is missing");
        // => Fail fast if required configuration is absent

        if (errors.Count > 0)
        {
            foreach (var error in errors)
                _logger.LogCritical("Startup validation failed: {Error}", error);
            // => Log all errors at Critical level
            throw new InvalidOperationException(
                $"Startup validation failed with {errors.Count} error(s). Check logs for details.");
            // => Throw terminates the application before accepting traffic
            // => Better than discovering missing config on first request
        }

        _logger.LogInformation("Startup validation passed - application ready");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

var builder = WebApplication.CreateBuilder(args);

// Validate options at startup with AddOptionsWithValidateOnStart
builder.Services
    .AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.Section))
    .ValidateDataAnnotations()
    // => Validates [Required], [MinLength], [Range] annotations
    .ValidateOnStart();
    // => Fails at application startup if validation fails
    // => Without ValidateOnStart: fails on first IOptions<JwtOptions> access (runtime)

builder.Services.AddHostedService<StartupValidationService>();
// => Startup validation runs before accepting HTTP traffic
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseInMemoryDatabase("startup"));

var app = builder.Build();
app.MapGet("/", () => "Application validated and running");
app.Run();
```

**Key Takeaway**: Use `.ValidateDataAnnotations().ValidateOnStart()` for options classes to fail at startup rather than at runtime. Implement `IHostedService.StartAsync()` for custom startup checks (database connectivity, external services).

**Why It Matters**: The alternative to startup validation is runtime failure: an application that starts successfully but throws exceptions on the first real request because a required configuration key is missing. Startup validation ensures the application either starts correctly or fails immediately with a descriptive error message. In Kubernetes, startup validation failure triggers pod restart and fires alerts, which is the correct behavior - an operator can see "JWT key too short" in the pod logs and fix the configuration before the service accepts any traffic, rather than discovering the problem from user reports after the deployment appears successful.

---
