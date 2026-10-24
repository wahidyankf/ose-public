// Example 25: Beginner Orders Service.
// The beginner layer ends where real services begin: grouped routes, typed
// bodies, validation, and a health check in one small program. This review
// wires an orders area under /v1, serves five checks in-process, and prints
// the status each contract earned.
using System.Text; // => StringContent carries the JSON body (co-03)
using System.Text.Json; // => JsonSerializer writes the request body (co-15)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.Routing; // => MapGroup shares the /v1 prefix (co-11)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the review service: group, orders, validation, health.
// => Every beginner concept appears once, composed instead of isolated.
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/health", () => Results.Ok(new { status = "ok" })); // => the readiness probe (co-14)
    var v1 = app.MapGroup("/v1"); // => one prefix for the whole area (co-11)
    var store = new Dictionary<int, string> { [1] = "dune" }; // => fixed rows, no database
    v1.MapGet("/orders", () => Results.Ok(store.Select(p => new { id = p.Key, title = p.Value }))); // => 200 list (co-04)
    v1.MapGet(
        "/orders/{id:int}",
        (int id) => // => typed segment: digits only (co-03, co-15)
            store.TryGetValue(id, out var title) // => look the row up
                ? Results.Ok(new { id, title }) // => present: echo it
                : Results.NotFound(new { error = "order-not-found" })
    ); // => absent: say so (co-05)
    v1.MapPost(
        "/orders",
        (Order order) => // => JSON binds into the record (co-03)
        { // => create block opens
            if (order.qty <= 0) // => reject before storing anything (co-10)
                return Results.BadRequest(new { error = "qty-must-be-positive" }); // => 400 names the rule (co-05)
            store[order.id] = order.title; // => the write later reads observe
            return Results.Created($"/v1/orders/{order.id}", order); // => 201 plus Location (co-04)
        }
    ); // => create ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the code with the body.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Nothing here dials a port: there is no network call at all.
static async Task CheckAsync(HttpClient client, string method, string target, string? json = null) // => optional body
{ // => check block opens
    using var request = new HttpRequestMessage(new HttpMethod(method), target); // => method plus path
    if (json is not null) // => only the create check carries a body
        request.Content = new StringContent(json, Encoding.UTF8, "application/json"); // => the labeled body (co-03)
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"{method} {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, check five times, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "GET", "/health"); // => Output: GET /health -> 200 {"status":"ok"}
await CheckAsync(client, "GET", "/v1/orders"); // => Output: GET /v1/orders -> 200 [{"id":1,"title":"dune"}]
await CheckAsync(client, "GET", "/v1/orders/9"); // => Output: GET /v1/orders/9 -> 404 {"error":"order-not-found"}
await CheckAsync(
    client,
    "POST",
    "/v1/orders",
    JsonSerializer.Serialize(new Order(2, "hyperion", 0))
); // => Output: POST /v1/orders -> 400 {"error":"qty-must-be-positive"}
await CheckAsync(
    client,
    "POST",
    "/v1/orders",
    JsonSerializer.Serialize(new Order(2, "hyperion", 3))
); // => Output: POST /v1/orders -> 201 {"id":2,"title":"hyperion","qty":3}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Order is the typed boundary of this review: JSON in, record out.
record Order(int id, string title, int qty); // => the order shape, lowercase exact bytes (co-15)
