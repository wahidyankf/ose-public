// Example 27: Short Circuit Stops the Chain.
// Middleware may answer directly without calling next: the handler never
// runs. This example blocks one path with a guard, serves two requests
// in-process, and prints the 403 that stopped and the 200 that passed.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => No next call means the handler never runs: the chain stops here (co-02).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.Use(
        async (context, next) => // => the guard every request passes (co-02)
        { // => guard block opens
            if (context.Request.Path == "/locked") // => this path stays closed
            { // => block block opens
                context.Response.StatusCode = 403; // => answer directly: no next call
                await context.Response.WriteAsJsonAsync(new { error = "locked" }); // => the fixed refusal (co-05)
                return; // => the chain stops: the handler never runs
            } // => block ends here
            await next(context); // => every other path continues inward
        }
    ); // => guard ends here
    app.MapGet("/locked", () => Results.Ok(new { secret = true })); // => unreachable while guarded (co-01)
    app.MapGet("/open", () => Results.Ok(new { secret = false })); // => the guard lets this through (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints what answered it.
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
await CheckAsync(client, "/locked"); // => Output: GET /locked -> 403 {"error":"locked"}
await CheckAsync(client, "/open"); // => Output: GET /open -> 200 {"secret":false}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
