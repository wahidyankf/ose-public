// Example 3: Query String Filters a List.
// A query string carries optional filters outside the path, and the
// handler reads them as typed parameters with defaults. This example
// registers one search route, serves three filtered requests in-process,
// and prints the slice each filter selected.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Optional query parameters arrive as nullable types with defaults (co-03).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    var catalog = new[] { "dune", "hyperion", "foundation" }; // => fixed data, no database needed
    app.MapGet(
        "/books",
        (string? prefix) => // => missing prefix binds null (co-03)
        { // => handler block opens
            var picked = catalog.Where(t => prefix is null || t.StartsWith(prefix)).ToArray(); // => filter or take all
            return Results.Ok(new { books = picked, count = picked.Length }); // => both slice and size (co-04)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints what the handler did.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Nothing here dials a port: there is no network call at all.
static async Task CheckAsync(HttpClient client, string target) // => the path plus query names the request
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
await CheckAsync(client, "/books"); // => Output: GET /books -> 200 {"books":["dune","hyperion","foundation"],"count":3}
await CheckAsync(client, "/books?prefix=h"); // => Output: GET /books?prefix=h -> 200 {"books":["hyperion"],"count":1}
await CheckAsync(client, "/books?prefix=z"); // => Output: GET /books?prefix=z -> 200 {"books":[],"count":0}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
