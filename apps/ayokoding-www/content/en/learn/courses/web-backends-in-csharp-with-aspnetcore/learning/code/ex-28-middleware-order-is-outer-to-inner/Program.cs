// Example 28: Middleware Order Is Outer to Inner.
// Registration order is execution order: the first middleware wraps the
// second on the way in and unwraps it on the way out. This example stacks
// two stamping middlewares, serves one request in-process, and prints the
// nesting the order produced.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => First registered runs first in and last out: onion order (co-02).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.Use(
        async (context, next) => // => outer layer: registered first (co-02)
        { // => outer block opens
            context.Items["order"] = "outer-in"; // => outer stamps the way in
            await next(context); // => dive one layer deeper
            context.Items["order"] += ",outer-out"; // => outer stamps the way out
        }
    ); // => outer ends here
    app.Use(
        async (context, next) => // => inner layer: registered second (co-02)
        { // => inner block opens
            context.Items["order"] += ",inner-in"; // => inner stamps the way in
            await next(context); // => reach the handler at the center
            context.Items["order"] += ",inner-out"; // => inner stamps the way out
        }
    ); // => inner ends here
    app.MapGet(
        "/nest",
        (HttpContext context) => // => the center of the onion (co-01)
            Results.Ok(new { order = context.Items["order"] })
    ); // => the recorded nesting (co-04)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, check once, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
using var response = await client.GetAsync("/nest"); // => the one nested request
var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
Console.WriteLine($"GET /nest -> {(int)response.StatusCode} {body}".TrimEnd()); // => Output: GET /nest -> 200 {"order":"outer-in,inner-in,inner-out,outer-out"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
