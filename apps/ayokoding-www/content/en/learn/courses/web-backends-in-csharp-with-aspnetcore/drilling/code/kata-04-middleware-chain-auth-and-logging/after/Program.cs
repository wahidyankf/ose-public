// Kata 4 solution: auth in front, logging outside.
// The auth layer registers after the logger, so the logger wraps the auth:
// every request logs, only trusted ones reach the handler. Compare with
// before/: one Use call is new, and the order is the whole lesson.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires logging outside and auth inside: order matters.
// => The shared list is the log: one fixed line per request.
static (WebApplication app, List<string> lines) BuildApp(string[] args) // => wiring plus the log capture
{ // => builder block opens
    var lines = new List<string>(); // => the shared log for this run
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.Use(
        async (context, next) => // => the logging middleware: outermost
        { // => middleware block opens
            await next(context); // => auth and handler run inside
            lock (lines) // => requests may log from many threads
                lines.Add(
                    $"{context.Request.Method} {context.Request.Path} -> {context.Response.StatusCode}"
                ); // => fixed line
        }
    ); // => middleware ends here
    app.Use(
        async (context, next) => // => the auth middleware: inside the logger
        { // => auth block opens
            if (context.Request.Headers["X-Key"].ToString() != "admin-1") // => the one trusted key
            { // => block block opens
                context.Response.StatusCode = 401; // => answer directly: no next call
                await context.Response.WriteAsJsonAsync(new { error = "unauthorized" }); // => the fixed refusal
                return; // => the chain stops: the handler never runs
            } // => block ends here
            await next(context); // => trusted: continue inward
        }
    ); // => auth ends here
    app.MapGet("/admin", () => Results.Ok(new { area = "admin" })); // => reachable only with the key
    return (app, lines); // => hand both back to the caller
} // => builder ends here

// => CheckAsync serves one request with an optional key.
static async Task CheckAsync(HttpClient client, string? key) // => null means send no key
{ // => check block opens
    using var request = new HttpRequestMessage(HttpMethod.Get, "/admin"); // => target never changes here
    if (key is not null) // => only trusted checks carry the key
        request.Headers.Add("X-Key", key); // => the credential rides a header
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine(
        $"GET /admin [{key ?? "(none)"}] -> {(int)response.StatusCode} {body}".TrimEnd()
    ); // => golden line
} // => check ends here

// => Top-level entry: build once, check twice, print the log, stop.
var (app, lines) = BuildApp(args); // => wiring plus capture, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, null); // => Output: GET /admin [(none)] -> 401 {"error":"unauthorized"}
await CheckAsync(client, "admin-1"); // => Output: GET /admin [admin-1] -> 200 {"area":"admin"}
foreach (var line in lines.Order()) // => sort so the transcript is stable
    Console.WriteLine($"log {line}"); // => Output lines: log GET /admin -> 200, then log GET /admin -> 401
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
