// Kata 4 starter: chain authentication and logging middleware.
// Fix me: the logger runs but nothing checks the key. Add an auth layer in
// front that answers 401 without a key, keeping the log line for both
// outcomes. The after/ solution shows the ordered pair.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires logging only: the auth layer is missing.
// => Fix me: add the key check in front, 401 without the key.
// => The shared list is the log: one fixed line per request.
static (WebApplication app, List<string> lines) BuildApp(string[] args) // => wiring plus the log capture
{ // => builder block opens
    var lines = new List<string>(); // => the shared log for this run
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.Use(
        async (context, next) => // => the logging middleware
        { // => middleware block opens
            await next(context); // => let the handler answer first
            lock (lines) // => requests may log from many threads
                lines.Add(
                    $"{context.Request.Method} {context.Request.Path} -> {context.Response.StatusCode}"
                ); // => fixed line
        }
    ); // => middleware ends here
    app.MapGet("/admin", () => Results.Ok(new { area = "admin" })); // => open today: must require the key
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
await CheckAsync(client, null); // => no key: must become a 401
await CheckAsync(client, "admin-1"); // => trusted key: stays a 200 after the fix
foreach (var line in lines.Order()) // => sort so the transcript is stable
    Console.WriteLine($"log {line}"); // => one fixed line per request
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
