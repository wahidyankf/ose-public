// Example 59: Task When All Fans Requests Out.
// One test often needs many answers at once: fan the calls out with
// WhenAll, then assert on the collected set. This example fires five
// parallel reads at three routes in-process and prints the sorted status
// line that proves all five landed.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Three routes give the fan-out somewhere to land (co-01, co-09).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/a", () => Results.Ok(new { at = "a" })); // => the first landing route (co-01)
    app.MapGet("/b", () => Results.Ok(new { at = "b" })); // => the second landing route (co-01)
    app.MapGet("/c", () => Results.Ok(new { at = "c" })); // => the third landing route (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: fan five calls out, sort, print, stop.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client, five parallel calls
var targets = new[] { "/a", "/b", "/c", "/a", "/missing" }; // => four hits plus one miss
var tasks = targets.Select(t => client.GetAsync(t)).ToArray(); // => five calls, no awaits yet
var responses = await Task.WhenAll(tasks); // => all five run concurrently (co-07)
var codes = responses.Select(r => (int)r.StatusCode).Order().ToArray(); // => sort so the transcript is stable
Console.WriteLine($"parallel=5 codes={string.Join(",", codes)}"); // => Output: parallel=5 codes=200,200,200,200,404
foreach (var response in responses) // => release every response body
    response.Dispose(); // => one dispose per response
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
