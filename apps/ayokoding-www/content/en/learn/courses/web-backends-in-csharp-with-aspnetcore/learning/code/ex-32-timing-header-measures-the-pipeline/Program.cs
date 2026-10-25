// Example 32: Timing Header Measures the Pipeline.
// A middleware can stamp how the request travelled — here a presence flag
// plus the handler's own fixed cost label, never a wall-clock reading.
// This example serves one timed route in-process and prints the headers
// that prove the middleware measured the trip without leaking time.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The header carries a fixed cost label: presence, never duration (co-02).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.Use(
        async (context, next) => // => the measuring middleware (co-02)
        { // => middleware block opens
            context.Response.OnStarting(() => // => headers must be set before the flush
            { // => stamp block opens
                context.Response.Headers.Append("X-Measured", "yes"); // => presence proves it ran
                return Task.CompletedTask; // => the stamp itself is synchronous
            }); // => stamp ends here
            await next(context); // => let the handler answer first
        }
    ); // => middleware ends here
    app.MapGet(
        "/work",
        async () => // => the handler reports its own fixed cost (co-01)
        { // => handler block opens
            await Task.Delay(1); // => one millisecond of pretend work, never printed
            return Results.Ok(new { cost = "fixed", unit = "test-only" }); // => labels, not timings (co-13)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, check once, print the proof, stop.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
using var response = await client.GetAsync("/work"); // => the one measured request
var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
var measured = response.Headers.GetValues("X-Measured").First(); // => the middleware's stamp
Console.WriteLine($"GET /work -> {(int)response.StatusCode} measured={measured} {body}".TrimEnd()); // => Output: GET /work -> 200 measured=yes {"cost":"fixed","unit":"test-only"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
