// Example 17: Repeated Query Keys Collect a List.
// A query key may appear many times — ?tag=a&tag=b — and the handler reads
// every value as a list, not just the first. This example collects the
// tags in-process and prints the count plus the sorted values observed.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)
using Microsoft.Extensions.Primitives; // => StringValues holds repeated keys (co-03)

// => BuildApp wires the service with every route this example serves.
// => StringValues collects every occurrence of one key in order (co-03).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/search",
        (HttpRequest request) => // => raw query access for repeats (co-03)
        { // => handler block opens
            StringValues tags = request.Query["tag"]; // => every ?tag= value, in order
            var sorted = tags.Order().ToArray(); // => sort so the transcript is stable
            return Results.Ok(new { count = tags.Count, tags = sorted }); // => both size and values (co-04)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the collected values.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Nothing here dials a port: there is no network call at all.
static async Task CheckAsync(HttpClient client, string target) // => the path plus query names the request
{ // => check block opens
    using var response = await client.GetAsync(target); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line (co-04)
} // => check ends here

// => Top-level entry: build once, check three times, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "/search?tag=rust&tag=go&tag=csharp"); // => Output: GET /search?tag=rust&tag=go&tag=csharp -> 200 {"count":3,"tags":["csharp","go","rust"]}
await CheckAsync(client, "/search?tag=go"); // => Output: GET /search?tag=go -> 200 {"count":1,"tags":["go"]}
await CheckAsync(client, "/search"); // => Output: GET /search -> 200 {"count":0,"tags":[]}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
