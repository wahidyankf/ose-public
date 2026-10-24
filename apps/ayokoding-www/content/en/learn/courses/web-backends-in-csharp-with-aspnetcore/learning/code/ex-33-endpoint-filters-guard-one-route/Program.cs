// Example 33: Endpoint Filters Guard One Route.
// An endpoint filter guards a single route instead of the whole pipeline:
// validation or auth that lives next to its handler. This example guards
// one admin route with a key filter, serves three requests in-process, and
// prints the 401, the 200, and the 404 the public route never filters.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Only /admin carries the filter: /public answers everyone (co-02).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/admin", () => Results.Ok(new { area = "admin" })) // => the guarded route (co-06)
        .AddEndpointFilter(
            async (context, next) => // => filter runs on this route only (co-02)
            { // => filter block opens
                var key = context.HttpContext.Request.Headers["X-Key"].ToString(); // => the credential (co-03)
                if (key != "admin-1") // => the one key this example trusts
                    return Results.Unauthorized(); // => 401: no key, no handler run
                return await next(context); // => trusted: run the handler
            }
        ); // => filter ends here
    app.MapGet("/public", () => Results.Ok(new { area = "public" })); // => open to everyone (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request with an optional key and prints out.
// => TestServer keeps the whole exchange inside this process (co-09).
// => The fixed keys keep every rerun byte-identical.
static async Task CheckAsync(HttpClient client, string target, string? key) // => null means send no key
{ // => check block opens
    using var request = new HttpRequestMessage(HttpMethod.Get, target); // => target names the request
    if (key is not null) // => only trusted checks carry the key
        request.Headers.Add("X-Key", key); // => the credential rides a header (co-03)
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    var tag = key ?? "(none)"; // => name the credential for the transcript
    Console.WriteLine($"GET {target} [{tag}] -> {(int)response.StatusCode} {body}".TrimEnd()); // => golden line (co-04)
} // => check ends here

// => Top-level entry: build once, check three times, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "/admin", null); // => Output: GET /admin [(none)] -> 401
await CheckAsync(client, "/admin", "admin-1"); // => Output: GET /admin [admin-1] -> 200 {"area":"admin"}
await CheckAsync(client, "/public", null); // => Output: GET /public [(none)] -> 200 {"area":"public"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
