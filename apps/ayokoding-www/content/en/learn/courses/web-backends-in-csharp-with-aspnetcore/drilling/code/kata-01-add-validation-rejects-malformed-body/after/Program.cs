// Kata 1 solution: validate at the boundary, then create.
// The handler checks both rules before storing anything: clean orders earn
// a 201, broken ones earn the named 400. Compare with before/: the route
// is identical, only the guard is new.
using System.Text; // => StringContent carries the JSON body
using System.Text.Json; // => JsonSerializer writes the request body
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapPost(
        "/orders",
        (Order order) => // => body binds into the record
        { // => handler block opens
            if (order.qty <= 0) // => quantities must move at least one unit
                return Results.BadRequest(new { error = "qty-must-be-positive" }); // => 400 names the rule
            if (string.IsNullOrWhiteSpace(order.title)) // => titles must name something
                return Results.BadRequest(new { error = "title-is-required" }); // => 400 names the rule
            return Results.Created($"/orders/{order.id}", order); // => clean input earns a 201
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => PostAsync sends one JSON body and prints what the handler did.
static async Task PostAsync(HttpClient client, Order order) // => the record to send
{ // => post block opens
    var json = JsonSerializer.Serialize(order); // => record becomes a JSON string
    using var body = new StringContent(json, Encoding.UTF8, "application/json"); // => the labeled body
    using var response = await client.PostAsync("/orders", body); // => full pipeline runs, then answers
    var text = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"POST /orders -> {(int)response.StatusCode} {text}".TrimEnd()); // => one golden line
} // => post ends here

// => Top-level entry: build once, check three times, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await PostAsync(client, new Order(1, "dune", 2)); // => Output: POST /orders -> 201 {"id":1,"title":"dune","qty":2}
await PostAsync(client, new Order(2, "hyperion", 0)); // => Output: POST /orders -> 400 {"error":"qty-must-be-positive"}
await PostAsync(client, new Order(3, "", 1)); // => Output: POST /orders -> 400 {"error":"title-is-required"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut

// => Order is the typed boundary of this kata: JSON in, record out.
record Order(int id, string title, int qty); // => the order shape
