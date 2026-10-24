// Kata 3 solution: the new route earns its own tests.
// The suite grows with the service: every new route arrives with checks
// that pin its status and body. Compare with before/: the service is
// identical, only the suite grew two legs.
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
    app.MapGet("/orders/1", () => Results.Ok(new { id = 1, title = "dune" })); // => the old route
    app.MapPost("/refund/1", () => Results.Ok(new { refunded = 1 })); // => the new route, now tested
    app.MapPost("/refund/9", () => Results.NotFound(new { error = "order-not-found" })); // => the new miss, tested
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the code with the body.
static async Task CheckAsync(HttpClient client, string method, string target) // => method plus path
{ // => check block opens
    using var request = new HttpRequestMessage(new HttpMethod(method), target); // => no bodies in this kata
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"{method} {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, check three times, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client for the whole suite
await CheckAsync(client, "GET", "/orders/1"); // => Output: GET /orders/1 -> 200 {"id":1,"title":"dune"}
await CheckAsync(client, "POST", "/refund/1"); // => Output: POST /refund/1 -> 200 {"refunded":1}
await CheckAsync(client, "POST", "/refund/9"); // => Output: POST /refund/9 -> 404 {"error":"order-not-found"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
