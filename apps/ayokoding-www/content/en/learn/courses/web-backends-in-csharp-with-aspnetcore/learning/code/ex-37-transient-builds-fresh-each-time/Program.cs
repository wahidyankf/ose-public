// Example 37: Transient Builds Fresh Each Time.
// A transient service is built anew at every injection point, so nothing
// is shared — not even within one request. This example injects two
// builders into one handler in-process and prints the two distinct stamps
// that prove each injection built its own instance.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddTransient registers the service (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => AddTransient builds at every injection point, never reused (co-06).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddTransient<StampBuilder>(); // => fresh build at every injection (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/stamps",
        (StampBuilder first, StampBuilder second) => // => two injections, two builds (co-06)
            Results.Ok(new { first = first.Stamp, second = second.Stamp })
    ); // => the distinct stamps (co-04)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, check once, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
using var response = await client.GetAsync("/stamps"); // => the one double-injection request
var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
Console.WriteLine($"GET /stamps -> {(int)response.StatusCode} {body}".TrimEnd()); // => Output: GET /stamps -> 200 {"first":"S-1","second":"S-2"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => StampBuilder mints one stamp per construction: never shared.
// => A shared sequencer keeps the stamps ordered for the transcript (co-07).
// => Two injections in one request still build twice: that is transient.
sealed class StampBuilder // => the transient service
{ // => builder block opens
    private static int minted; // => the demo sequencer, shared and atomic

    public string Stamp { get; } = $"S-{Interlocked.Increment(ref minted)}"; // => minted at construction
} // => builder ends here
