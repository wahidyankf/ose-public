// Example 61: Output Cache Answers Repeats Fast.
// The output cache stores a GET answer and replays it without running the
// handler, so hot rows cost one execution. This example reads one counted
// row three times in-process and prints the single execution the three
// identical answers shared.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.OutputCaching; // => the cache middleware lives here (co-07)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddOutputCache registers the store (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => CacheOutput replays the answer; the counter proves one execution (co-07).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddOutputCache(); // => the in-memory answer store (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.UseOutputCache(); // => the replaying middleware, before routing (co-02)
    var executions = 0; // => handler runs observed, shared by closure
    app.MapGet(
            "/hot",
            () => // => the cached route (co-07)
            { // => handler block opens
                executions++; // => count this execution exactly once
                return Results.Ok(new { fact = "honey never spoils" }); // => the fixed answer (co-04)
            }
        )
        .CacheOutput(); // => cache this route's answers
    app.MapGet("/executions", () => Results.Ok(new { executions })); // => the proof route (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: read the hot row three times, print the proof.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
using var first = await client.GetAsync("/hot"); // => leg one: executes and stores
Console.WriteLine(
    $"GET /hot -> {(int)first.StatusCode} {await first.Content.ReadAsStringAsync()}".TrimEnd()
); // => Output: GET /hot -> 200 {"fact":"honey never spoils"}
using var second = await client.GetAsync("/hot"); // => leg two: replayed, no execution
Console.WriteLine(
    $"GET /hot -> {(int)second.StatusCode} {await second.Content.ReadAsStringAsync()}".TrimEnd()
); // => Output: GET /hot -> 200 {"fact":"honey never spoils"}
using var proof = await client.GetAsync("/executions"); // => leg three: how many executions?
Console.WriteLine(
    $"GET /executions -> {(int)proof.StatusCode} {await proof.Content.ReadAsStringAsync()}".TrimEnd()
); // => Output: GET /executions -> 200 {"executions":1}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
