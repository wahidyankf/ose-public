// Example 73: Middleware Shape Compared.
// FastAPI middleware wraps send and receive messages; ASP.NET Core
// middleware wraps a RequestDelegate with before and after legs. Same
// onion, different handle. This example stamps one request both ways
// in-process and prints the nesting plus the Starlette shape it mirrors.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => RequestDelegate plus next is the Starlette send/receive pair (co-16).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.Use(
        async (context, next) => // => the onion layer: before, next, after (co-02)
        { // => middleware block opens
            context.Items["leg"] = "in"; // => the before leg stamps first
            context.Response.OnStarting(() => // => the after leg stamps before the flush
            { // => stamp block opens
                context.Response.Headers.Append("X-Legs", $"{context.Items["leg"]}-out"); // => both legs in one value
                return Task.CompletedTask; // => the stamp itself is synchronous
            }); // => stamp ends here
            await next(context); // => the handler runs between the legs
        }
    ); // => middleware ends here
    app.MapGet("/ping", () => Results.Ok(new { pong = true })); // => the wrapped route (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, check once, name the mirror, stop.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
using var response = await client.GetAsync("/ping"); // => the one wrapped request
var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
var legs = response.Headers.GetValues("X-Legs").First(); // => the middleware's stamp
Console.WriteLine($"GET /ping -> {(int)response.StatusCode} legs={legs} {body}".TrimEnd()); // => Output: GET /ping -> 200 legs=in-out {"pong":true}
Console.WriteLine("fastapi: class StampMiddleware(BaseHTTPMiddleware)"); // => Output: fastapi: class StampMiddleware(BaseHTTPMiddleware)
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
