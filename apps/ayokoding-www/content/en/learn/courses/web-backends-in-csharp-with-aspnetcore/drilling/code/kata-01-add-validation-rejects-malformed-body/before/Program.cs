// Kata 1 starter: add validation that rejects a malformed body.
// Fix me: POST /orders accepts anything right now. Add the two rules from
// Example 10 (qty must be positive, title is required) and print the 201
// plus the two 400s. The after/ solution shows one shape for the fix.
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
            Results.Created($"/orders/{order.id}", order)
    ); // => Fix me: validate first, 400 when broken
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
await PostAsync(client, new Order(1, "dune", 2)); // => clean: earns a 201 after the fix
await PostAsync(client, new Order(2, "hyperion", 0)); // => broken qty: must become a 400
await PostAsync(client, new Order(3, "", 1)); // => broken title: must become a 400
await app.StopAsync(); // => stop cleanly: nothing in flight is cut

// => Order is the typed boundary of this kata: JSON in, record out.
record Order(int id, string title, int qty); // => the order shape
