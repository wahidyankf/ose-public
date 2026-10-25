// Example 34: Global Error Envelope for Clients.
// The last middleware in the chain should be the first registered: a
// catch-all that turns any throw into the service envelope. This example
// throws on one route, serves two requests in-process, and prints the 500
// envelope plus the untouched 200.
using System.Text.Json; // => envelope written as fixed JSON (co-05)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The catch-all is registered first, so it wraps everything (co-02, co-05).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.Use(
        async (context, next) => // => the global envelope: outermost layer (co-02)
        { // => envelope block opens
            try // => everything inside may throw
            { // => try block opens
                await next(context); // => run the whole inner pipeline
            } // => try ends here
            catch (Exception ex) // => any throw lands here, typed or not
            { // => catch block opens
                context.Response.StatusCode = 500; // => the code every throw earns
                context.Response.ContentType = "application/json"; // => the envelope is always JSON
                var envelope = new { error = "internal", detail = ex.Message }; // => fixed shape, real message (co-05)
                await context.Response.WriteAsync(JsonSerializer.Serialize(envelope)); // => bytes out, once
            } // => catch ends here
        }
    ); // => envelope ends here
    app.MapGet("/fail", Fail); // => the route that throws
    app.MapGet("/fine", () => Results.Ok(new { fine = true })); // => the route that never throws (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Fail is the throwing handler: a named method keeps MapGet readable.
// => A method group binds the route-handler overload without ambiguity.
static IResult Fail() => throw new InvalidOperationException("disk full"); // => the throw the envelope converts

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
await CheckAsync(client, "/fail"); // => Output: GET /fail -> 500 {"error":"internal","detail":"disk full"}
await CheckAsync(client, "/fine"); // => Output: GET /fine -> 200 {"fine":true}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
