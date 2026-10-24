// Example 10: Validation Rejects a Bad Body.
// A handler must reject malformed input before business logic runs: check
// the record, and answer 400 with a fixed envelope when it fails. This
// example posts one valid and one invalid order in-process and prints the
// 201 that passed and the 400 that did not.
using System.Text; // => StringContent carries the JSON body (co-03)
using System.Text.Json; // => JsonSerializer writes the request body (co-15)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The handler validates first and only then pretends to store (co-10).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapPost(
        "/orders",
        (Order order) => // => body binds into the record (co-03)
        { // => handler block opens
            if (order.qty <= 0) // => a quantity must move at least one unit (co-10)
                return Results.BadRequest(new { error = "qty-must-be-positive" }); // => 400 names the rule (co-05)
            if (string.IsNullOrWhiteSpace(order.title)) // => a title must name something (co-10)
                return Results.BadRequest(new { error = "title-is-required" }); // => 400 names the rule (co-05)
            return Results.Created($"/orders/{order.id}", order); // => valid input earns a 201 (co-04)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => PostAsync sends one JSON body and prints what the handler did.
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

// => Top-level entry: build once, check three times, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await PostAsync(client, new Order(7, "dune", 2)); // => Output: POST /orders -> 201 {"id":7,"title":"dune","qty":2}
await PostAsync(client, new Order(8, "hyperion", 0)); // => Output: POST /orders -> 400 {"error":"qty-must-be-positive"}
await PostAsync(client, new Order(9, "", 1)); // => Output: POST /orders -> 400 {"error":"title-is-required"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Order is the typed boundary of this example: JSON in, record out.
// => Positional records keep the shape small and the binding obvious (co-15).
// => Lowercase names serialize unchanged, so fences match the bytes exactly.
record Order(int id, string title, int qty); // => the request and response shape
