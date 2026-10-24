// Example 14: Read Headers into the Handler.
// Headers carry cross-cutting context — request IDs, client names, feature
// flags — that the path and body should not repeat. This example reads one
// header with a fallback default, serves two requests in-process, and
// prints the value each request carried.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Headers arrive as strings; the handler supplies the default (co-03).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/who",
        (HttpRequest request) => // => HttpRequest exposes every header (co-03)
        { // => handler block opens
            var caller = request.Headers.TryGetValue("X-Caller", out var value) // => look for the header first
                ? value.ToString() // => present: use what the client sent
                : "anonymous"; // => absent: fall back to the default
            return Results.Ok(new { caller }); // => the observed identity, echoed (co-04)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request with an optional header and prints it.
// => TestServer keeps the whole exchange inside this process (co-09).
// => The fixed header values keep every rerun byte-identical.
static async Task CheckAsync(HttpClient client, string? caller) // => null means send no header
{ // => check block opens
    using var request = new HttpRequestMessage(HttpMethod.Get, "/who"); // => target never changes here
    if (caller is not null) // => only the second check carries identity
        request.Headers.Add("X-Caller", caller); // => headers ride outside the path (co-03)
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    var tag = caller ?? "(none)"; // => name the header value for the transcript
    Console.WriteLine($"GET /who [{tag}] -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "checkout"); // => Output: GET /who [checkout] -> 200 {"caller":"checkout"}
await CheckAsync(client, null); // => Output: GET /who [(none)] -> 200 {"caller":"anonymous"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
