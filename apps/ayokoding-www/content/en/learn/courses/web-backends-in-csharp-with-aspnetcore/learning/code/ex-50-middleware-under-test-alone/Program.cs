// Example 50: Middleware Under Test Alone.
// Middleware deserves its own test: one component, one request, one
// header asserted. This example wraps a bare route with the stamp
// middleware only, serves two requests in-process, and prints the stamp
// the component added plus the body it left untouched.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires one middleware plus one bare route: nothing else.
// => Testing the component alone keeps failures local to it (co-02, co-09).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.Use(
        async (context, next) => // => the component under test (co-02)
        { // => middleware block opens
            context.Response.OnStarting(() => // => stamps go on before the flush
            { // => stamp block opens
                context.Response.Headers.Append("X-Stamp", "middleware-was-here"); // => the fixed stamp
                return Task.CompletedTask; // => the stamp itself is synchronous
            }); // => stamp ends here
            await next(context); // => the bare handler runs inside
        }
    ); // => middleware ends here
    app.MapGet("/bare", () => Results.Ok(new { bare = true })); // => the untouched body (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the stamp with the body.
// => TestServer keeps the whole exchange inside this process (co-09).
// => The stamp proves the component ran; the body proves it did no harm.
static async Task CheckAsync(HttpClient client, string target) // => the path names the request
{ // => check block opens
    using var response = await client.GetAsync(target); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    var stamp = response.Headers.GetValues("X-Stamp").First(); // => the component's stamp
    Console.WriteLine($"GET {target} -> {(int)response.StatusCode} stamp={stamp} {body}".TrimEnd()); // => golden line
} // => check ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "/bare"); // => Output: GET /bare -> 200 stamp=middleware-was-here {"bare":true}
await CheckAsync(client, "/missing"); // => Output: GET /missing -> 404 stamp=middleware-was-here
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
