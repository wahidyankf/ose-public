// Example 76: Validation Pipeline Compared.
// FastAPI validates inside the Pydantic model before the handler runs;
// here the handler calls the validator before the store. Same pipeline —
// parse, validate, then create — different plumbing. This example posts
// one clean and one empty order in-process and prints the 201 plus the
// 400 the pipeline produced.
using System.Text; // => StringContent carries the JSON body (co-03)
using System.Text.Json; // => JsonSerializer writes the request body (co-15)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddSingleton registers the validator (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The validator injects; the handler only maps its verdict (co-06, co-10).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<OrderValidator>(); // => one rulebook for every request (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapPost(
        "/orders",
        (Order order, OrderValidator validator) => // => body plus rulebook (co-03, co-06)
        { // => handler block opens
            var verdict = validator.Check(order); // => validate before creating, like Pydantic (co-10, co-16)
            if (verdict is not null) // => a verdict means rejection
                return Results.BadRequest(new { error = verdict }); // => 400 names the rule (co-05)
            return Results.Created($"/orders/{order.id}", order); // => clean orders earn a 201 (co-04)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => PostAsync sends one JSON body and prints what the pipeline decided.
// => TestServer keeps the whole exchange inside this process (co-09).
// => The fixed bodies keep every rerun byte-identical.
static async Task PostAsync(HttpClient client, Order order) // => the record to serialize and send
{ // => post block opens
    var json = JsonSerializer.Serialize(order); // => record becomes a JSON string
    using var body = new StringContent(json, Encoding.UTF8, "application/json"); // => body names its type (co-03)
    using var response = await client.PostAsync("/orders", body); // => full pipeline runs, then answers
    var text = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"POST /orders -> {(int)response.StatusCode} {text}".TrimEnd()); // => one golden line (co-04)
} // => post ends here

// => Top-level entry: build once, check twice, name the mirror, stop.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await PostAsync(client, new Order(1, "dune", 2)); // => Output: POST /orders -> 201 {"id":1,"title":"dune","qty":2}
await PostAsync(client, new Order(2, "", 1)); // => Output: POST /orders -> 400 {"error":"title-is-required"}
Console.WriteLine("fastapi: order: Order validates before the handler"); // => Output: fastapi: order: Order validates before the handler
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => OrderValidator is the injected rulebook: two rules, one verdict each.
// => Handlers stay thin because rules live here, tested once (co-06, co-10).
sealed class OrderValidator // => the validation service
{ // => validator block opens
    public string? Check(Order order) // => null means clean: create it
    { // => check block opens
        if (order.qty <= 0) // => quantities must move at least one unit
            return "qty-must-be-positive"; // => the quantity verdict
        if (string.IsNullOrWhiteSpace(order.title)) // => titles must name something
            return "title-is-required"; // => the title verdict
        return null; // => clean: the handler creates
    } // => check ends here
} // => validator ends here

// => Order is the typed boundary of this example: JSON in, record out.
record Order(int id, string title, int qty); // => the order shape, lowercase exact bytes (co-15)
