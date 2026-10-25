// Capstone: Order-Tracking HTTP Service.
// Five routes, one store, validation at the boundary, one error envelope,
// and a health probe: the whole course composed into a service a team
// would recognize. The in-process suite walks creation, reads, deletion,
// and every failure, printing the contract each leg earned.
using System.Text; // => StringContent carries the JSON bodies (co-03)
using System.Text.Json; // => JsonSerializer writes the request bodies (co-15)
using Microsoft.AspNetCore.Builder; // => WebApplication wires the service (co-01)
using Microsoft.AspNetCore.Routing; // => MapGroup shares the /v1 prefix (co-11)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddSingleton shares the store (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => Fail is the one envelope every failure in this service wears.
// => code plus error plus hint: the course shape, fixed always (co-05).
static IResult Fail(int status, string error, string hint) // => status plus two fixed strings
{ // => helper block opens
    var body = new
    {
        code = status,
        error,
        hint,
    }; // => the shared envelope (co-05)
    return status switch // => the status picks the Results helper
    { // => switch block opens
        404 => Results.NotFound(body), // => absence wears the envelope too
        _ => Results.BadRequest(body), // => every other fault defaults here
    }; // => switch ends here
} // => helper ends here

// => Validate is the boundary rulebook: null means clean, string means reject.
// => One function, every rule, tested through the same suite (co-10).
static string? Validate(Order order) // => the order to judge
{ // => validate block opens
    if (string.IsNullOrWhiteSpace(order.title)) // => titles must name something
        return "title-is-required"; // => the title verdict
    if (order.qty <= 0) // => quantities must move at least one unit
        return "qty-must-be-positive"; // => the quantity verdict
    return null; // => clean: the service creates
} // => validate ends here

// => BuildApp wires the capstone service: health, group, orders, errors.
// => Every course idea appears once, composed instead of isolated.
// => Returning the app lets the suite serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<OrderStore>(); // => one store shared by all routes (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/health", () => Results.Ok(new { status = "ok" })); // => the readiness probe (co-14)
    var v1 = app.MapGroup("/v1"); // => one prefix for the whole area (co-11)
    v1.MapGet(
        "/orders",
        (OrderStore store) => // => the list route (co-01, co-06)
            Results.Ok(
                store
                    .All()
                    .Select(p => new
                    {
                        id = p.Key,
                        title = p.Value.title,
                        qty = p.Value.qty,
                    })
            )
    ); // => every row
    v1.MapGet(
        "/orders/{id:int}",
        (int id, OrderStore store) => // => the read route (co-03, co-15)
            store.Find(id) is { } row // => present or not
                ? Results.Ok(
                    new
                    {
                        id,
                        title = row.title,
                        qty = row.qty,
                    }
                ) // => present: echo the row (co-04)
                : Fail(404, "order-not-found", $"no order has id {id}")
    ); // => absent: the envelope (co-05)
    v1.MapPost(
        "/orders",
        (Order order, OrderStore store) => // => the create route (co-03, co-06)
        { // => create block opens
            var verdict = Validate(order); // => validate before storing anything (co-10)
            if (verdict is not null) // => a verdict means rejection
                return Fail(
                    400,
                    verdict,
                    verdict == "title-is-required" // => the envelope names the rule (co-05)
                        ? "send a JSON body with a title"
                        : "send a quantity of at least one"
                ); // => the hint per rule
            store.Save(order); // => the write later reads observe
            return Results.Created($"/v1/orders/{order.id}", order); // => 201 plus Location (co-04)
        }
    ); // => create ends here
    v1.MapDelete(
        "/orders/{id:int}",
        (int id, OrderStore store) => // => the delete route (co-03, co-06)
            store.Remove(id) // => true when a row was there
                ? Results.NoContent() // => 204: gone, no body (co-04)
                : Fail(404, "order-not-found", $"no order has id {id}")
    ); // => absent: the envelope (co-05)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request with an optional body and prints it.
// => TestServer keeps the whole exchange inside this process (co-09).
// => The fixed inputs keep every rerun byte-identical.
static async Task CheckAsync(HttpClient client, string method, string target, string? json = null) // => optional body
{ // => check block opens
    using var request = new HttpRequestMessage(new HttpMethod(method), target); // => method plus path first
    if (json is not null) // => only the create checks carry one
        request.Content = new StringContent(json, Encoding.UTF8, "application/json"); // => the labeled body (co-03)
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var text = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"{method} {target} -> {(int)response.StatusCode} {text}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: one client walks the whole service, then stops.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client for the whole suite
await CheckAsync(client, "GET", "/health"); // => Output: GET /health -> 200 {"status":"ok"}
await CheckAsync(client, "GET", "/v1/orders"); // => Output: GET /v1/orders -> 200 []
await CheckAsync(client, "POST", "/v1/orders", JsonSerializer.Serialize(new Order(1, "dune", 2))); // => Output: POST /v1/orders -> 201 {"id":1,"title":"dune","qty":2}
await CheckAsync(
    client,
    "POST",
    "/v1/orders",
    JsonSerializer.Serialize(new Order(2, "hyperion", 1))
); // => Output: POST /v1/orders -> 201 {"id":2,"title":"hyperion","qty":1}
await CheckAsync(client, "POST", "/v1/orders", JsonSerializer.Serialize(new Order(3, "", 1))); // => Output: POST /v1/orders -> 400 {"code":400,"error":"title-is-required","hint":"send a JSON body with a title"}
await CheckAsync(
    client,
    "POST",
    "/v1/orders",
    JsonSerializer.Serialize(new Order(4, "foundation", 0))
); // => Output: POST /v1/orders -> 400 {"code":400,"error":"qty-must-be-positive","hint":"send a quantity of at least one"}
await CheckAsync(client, "GET", "/v1/orders/1"); // => Output: GET /v1/orders/1 -> 200 {"id":1,"title":"dune","qty":2}
await CheckAsync(client, "GET", "/v1/orders/9"); // => Output: GET /v1/orders/9 -> 404 {"code":404,"error":"order-not-found","hint":"no order has id 9"}
await CheckAsync(client, "DELETE", "/v1/orders/1"); // => Output: DELETE /v1/orders/1 -> 204
await CheckAsync(client, "DELETE", "/v1/orders/1"); // => Output: DELETE /v1/orders/1 -> 404 {"code":404,"error":"order-not-found","hint":"no order has id 1"}
await CheckAsync(client, "GET", "/v1/orders"); // => Output: GET /v1/orders -> 200 [{"id":2,"title":"hyperion","qty":1}]
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Order is the typed boundary of this service: JSON in, record out.
record Order(int id, string title, int qty); // => the order shape, lowercase exact bytes (co-15)

// => OrderStore is the injected repository: empty at start, filled by the suite.
// => Every row the transcript shows arrived through the create route.
sealed class OrderStore // => the singleton repository
{ // => store block opens
    private readonly Dictionary<int, (string title, int qty)> rows = []; // => the empty map, filled by POSTs

    public IEnumerable<KeyValuePair<int, (string title, int qty)>> All() =>
        rows.OrderBy(p => p.Key); // => sorted list

    public (string title, int qty)? Find(int id) => rows.TryGetValue(id, out var row) ? row : null; // => null absent

    public void Save(Order order) => rows[order.id] = (order.title, order.qty); // => upsert by id

    public bool Remove(int id) => rows.Remove(id); // => true when a row was there
} // => store ends here
