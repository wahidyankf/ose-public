// Example 29: Exception Handler Turns Throws into 500.
// An unhandled throw must never escape as an empty connection: the
// exception-handler middleware converts it into a fixed 500 envelope.
// This example throws on one route in-process and prints the 500 plus the
// 200 the healthy route kept serving.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.Diagnostics; // => IExceptionHandlerPathFeature names the throw (co-05)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => UseExceptionHandler catches throws from every route below it (co-02, co-05).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.UseExceptionHandler("/error"); // => throws reroute here with their feature (co-05)
    app.MapGet(
        "/error",
        (HttpContext context) => // => the single failure route
        { // => error block opens
            var feature = context.Features.Get<IExceptionHandlerPathFeature>(); // => the captured throw lives here
            var where = feature?.Path.ToString() ?? "(unknown)"; // => which route threw, fixed string
            return Results.Json(new { error = "boom", path = where }, statusCode: 500); // => fixed 500 envelope (co-05)
        }
    ); // => error ends here
    app.MapGet("/fail", Fail); // => the route that throws
    app.MapGet("/fine", () => Results.Ok(new { fine = true })); // => the route that never throws (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Fail is the throwing handler: a named method keeps MapGet readable.
// => A method group binds the route-handler overload without ambiguity.
static IResult Fail() => throw new InvalidOperationException("demo throw"); // => the throw the handler converts

// => CheckAsync serves one request and prints the code with the body.
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
await CheckAsync(client, "/fail"); // => Output: GET /fail -> 500 {"error":"boom","path":"/fail"}
await CheckAsync(client, "/fine"); // => Output: GET /fine -> 200 {"fine":true}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
