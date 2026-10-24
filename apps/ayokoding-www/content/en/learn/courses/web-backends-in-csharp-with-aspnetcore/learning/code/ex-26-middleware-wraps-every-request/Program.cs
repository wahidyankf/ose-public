// Example 26: Middleware Wraps Every Request.
// Middleware runs before and after the handler, so one component can time,
// tag, or log every route. This example wraps a single route with a marker
// middleware, serves two requests in-process, and prints the order the
// three stages ran in.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Use runs on every request: before the handler, then after (co-02).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.Use(
        async (context, next) => // => one middleware around everything (co-02)
        { // => middleware block opens
            context.Items["trace"] = "before"; // => stamp the way in
            context.Response.OnStarting(() => // => headers must be set before the flush
            { // => stamp block opens
                context.Response.Headers.Append(
                    "X-Trace", // => stamp the way out
                    $"{context.Items["trace"]}-after"
                ); // => both legs in one value
                return Task.CompletedTask; // => the stamp itself is synchronous
            }); // => stamp ends here
            await next(context); // => hand control to the handler
        }
    ); // => middleware ends here
    app.MapGet("/ping", () => Results.Ok(new { pong = true })); // => the wrapped route (co-01)
    app.MapGet("/pong", () => Results.Ok(new { ping = true })); // => wrapped too: every route (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the trace header observed.
// => TestServer keeps the whole exchange inside this process (co-09).
// => The header proves the middleware ran on both legs of each request.
static async Task CheckAsync(HttpClient client, string target) // => the path names the request
{ // => check block opens
    using var response = await client.GetAsync(target); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    var trace = response.Headers.GetValues("X-Trace").First(); // => the middleware's stamp
    Console.WriteLine($"GET {target} -> {(int)response.StatusCode} trace={trace} {body}".TrimEnd()); // => golden line
} // => check ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "/ping"); // => Output: GET /ping -> 200 trace=before-after {"pong":true}
await CheckAsync(client, "/pong"); // => Output: GET /pong -> 200 trace=before-after {"ping":true}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
