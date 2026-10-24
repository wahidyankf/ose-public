// Kata 3 starter: write an in-process test for the new route.
// Fix me: /refund exists but the suite never calls it. Add two checks — a
// known id refunds, an unknown id 404s — and print both lines. The after/
// solution shows the extended suite.
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
    app.MapGet("/orders/1", () => Results.Ok(new { id = 1, title = "dune" })); // => the tested route
    app.MapPost("/refund/1", () => Results.Ok(new { refunded = 1 })); // => Fix me: no test calls this route
    app.MapPost("/refund/9", () => Results.NotFound(new { error = "order-not-found" })); // => Fix me: nor this one
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, check once, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
using var response = await client.GetAsync("/orders/1"); // => the only tested call
var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
Console.WriteLine($"GET /orders/1 -> {(int)response.StatusCode} {body}".TrimEnd()); // => the only golden line
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
