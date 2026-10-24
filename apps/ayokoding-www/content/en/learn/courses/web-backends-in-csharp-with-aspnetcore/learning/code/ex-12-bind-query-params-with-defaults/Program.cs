// Example 12: Bind Query Params with Defaults.
// Optional query values arrive as nullable parameters, and the handler
// supplies the default when the client omits them. This example pages a
// fixed catalog in-process and prints the window each query selected.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Nullable ints model omission; ?? supplies the default page (co-03).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    var catalog = new[] { "a", "b", "c", "d", "e", "f" }; // => fixed data, no database needed
    app.MapGet(
        "/letters",
        (int? page, int? size) => // => both optional: omission binds null (co-03)
        { // => handler block opens
            var take = size ?? 2; // => two at a time unless asked otherwise
            var skip = (page ?? 1) * take - take; // => page one starts at zero
            var window = catalog.Skip(skip).Take(take).ToArray(); // => the slice this query owns
            return Results.Ok(
                new
                {
                    page = page ?? 1,
                    size = take,
                    letters = window,
                }
            ); // => window plus shape (co-04)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the window selected.
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
await CheckAsync(client, "/letters"); // => Output: GET /letters -> 200 {"page":1,"size":2,"letters":["a","b"]}
await CheckAsync(client, "/letters?page=2"); // => Output: GET /letters?page=2 -> 200 {"page":2,"size":2,"letters":["c","d"]}
await CheckAsync(client, "/letters?page=2&size=3"); // => Output: GET /letters?page=2&size=3 -> 200 {"page":2,"size":3,"letters":["d","e","f"]}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
