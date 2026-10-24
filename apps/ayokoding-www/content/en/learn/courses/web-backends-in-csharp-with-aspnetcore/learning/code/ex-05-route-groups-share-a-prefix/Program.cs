// Example 5: Route Groups Share a Prefix.
// A route group applies one prefix to many routes, so a version or area
// name is written once instead of on every mapping. This example groups
// two order routes under /v1, serves three requests in-process, and prints
// the prefix each group route observed.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.Routing; // => MapGroup builds the shared prefix (co-11)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => MapGroup writes /v1 once; both routes inherit it (co-11).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    var v1 = app.MapGroup("/v1"); // => one prefix object for the whole area (co-11)
    v1.MapGet("/orders", () => Results.Ok(new { area = "v1", mode = "list" })); // => serves /v1/orders (co-01)
    v1.MapGet("/orders/{id}", (int id) => Results.Ok(new { area = "v1", id })); // => serves /v1/orders/7 (co-03)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints what the handler did.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Nothing here dials a port: there is no network call at all.
static async Task CheckAsync(HttpClient client, string target) // => the path names the request
{ // => check block opens
    using var response = await client.GetAsync(target); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    var line = $"GET {target} -> {(int)response.StatusCode} {body}"; // => status plus body in one line
    Console.WriteLine(line.TrimEnd()); // => TrimEnd keeps empty bodies clean (co-04)
} // => check ends here

// => Top-level entry: build once, check three times, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "/v1/orders"); // => Output: GET /v1/orders -> 200 {"area":"v1","mode":"list"}
await CheckAsync(client, "/v1/orders/7"); // => Output: GET /v1/orders/7 -> 200 {"area":"v1","id":7}
await CheckAsync(client, "/orders"); // => Output: GET /orders -> 404
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
