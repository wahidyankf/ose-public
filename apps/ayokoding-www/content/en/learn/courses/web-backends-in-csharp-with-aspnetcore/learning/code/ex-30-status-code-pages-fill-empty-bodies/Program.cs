// Example 30: Status Code Pages Fill Empty Bodies.
// Some failures produce empty bodies — a bare 404 from routing — and the
// status-code-pages middleware fills them with the service envelope. This
// example re-executes misses through one JSON writer in-process and prints
// the envelope the empty 404 became.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => UseStatusCodePages re-runs empty answers through the writer (co-05).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.UseStatusCodePages(async context => // => the filler for empty bodies (co-05)
    { // => filler block opens
        var response = context.HttpContext.Response; // => the empty answer to fill
        response.ContentType = "application/json"; // => the envelope is always JSON
        await response.WriteAsJsonAsync(new { error = $"status-{response.StatusCode}" }); // => fixed envelope
    }); // => filler ends here
    app.MapGet("/hello", () => Results.Ok(new { message = "hello" })); // => the one known route (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the code with the body.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Nothing here dials a port: there is no network call at all.
static async Task CheckAsync(HttpClient client, string target) // => the path names the request
{ // => check block opens
    using var response = await client.GetAsync(target); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line (co-04)
} // => check ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "/hello"); // => Output: GET /hello -> 200 {"message":"hello"}
await CheckAsync(client, "/missing"); // => Output: GET /missing -> 404 {"error":"status-404"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
