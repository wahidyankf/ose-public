// Example 9: Bind JSON into a Typed Record.
// A JSON body becomes a C# record when the handler names the record type:
// the framework reads the body and builds the value. This example posts an
// order as JSON, serves it in-process, and prints the typed fields echoed.
using System.Text; // => StringContent carries the JSON body (co-03)
using System.Text.Json; // => JsonSerializer writes the request body (co-15)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Naming Order in the signature binds the JSON body to it (co-15).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapPost(
        "/orders",
        (Order order) => // => body binds into the record (co-03, co-15)
            Results.Created($"/orders/{order.id}", order)
    ); // => 201 plus the typed echo (co-04)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => PostAsync sends one JSON body and prints what the handler did.
// => TestServer keeps the whole exchange inside this process (co-09).
// => The fixed body keeps every rerun byte-identical.
static async Task PostAsync(HttpClient client, Order order) // => the record to serialize and send
{ // => post block opens
    var json = JsonSerializer.Serialize(order); // => record becomes a JSON string
    using var body = new StringContent(json, Encoding.UTF8, "application/json"); // => body names its type (co-03)
    using var response = await client.PostAsync("/orders", body); // => full pipeline runs, then answers
    var text = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    var line = $"POST /orders -> {(int)response.StatusCode} {text}"; // => status plus body in one line
    Console.WriteLine(line.TrimEnd()); // => TrimEnd keeps empty bodies clean (co-04)
} // => post ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await PostAsync(client, new Order(7, "dune", 2)); // => Output: POST /orders -> 201 {"id":7,"title":"dune","qty":2}
await PostAsync(client, new Order(8, "hyperion", 1)); // => Output: POST /orders -> 201 {"id":8,"title":"hyperion","qty":1}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Order is the typed boundary of this example: JSON in, record out.
// => Positional records keep the shape small and the binding obvious (co-15).
// => Lowercase names serialize unchanged, so fences match the bytes exactly.
record Order(int id, string title, int qty); // => the request and response shape
