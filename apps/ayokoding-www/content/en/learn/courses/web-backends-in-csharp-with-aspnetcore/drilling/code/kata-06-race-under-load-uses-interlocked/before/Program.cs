// Kata 6 starter: diagnose the concurrency bug under load.
// Fix me: ten parallel visits lose counts because += is not atomic. Run it
// a few times and watch lost drift above zero, then switch the counter to
// Interlocked like Example 55. The after/ solution pins lost at zero.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.DependencyInjection; // => AddSingleton shares the counter
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<HitCounter>(); // => one counter for every visit
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/visit",
        (HitCounter counter) => // => the shared counter arrives by type
            Results.Ok(new { visit = counter.Next() })
    ); // => the racy total, echoed
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: fire ten visits at once, print the loss.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client, ten parallel calls
var tasks = Enumerable.Range(0, 10).Select(_ => client.GetStringAsync("/visit")).ToArray(); // => ten visits, no awaits
await Task.WhenAll(tasks); // => all ten run concurrently
Console.WriteLine($"parallel=10 lost={10 - HitCounter.Seen}"); // => drifts above zero: the bug
await app.StopAsync(); // => stop cleanly: nothing in flight is cut

// => HitCounter hides the bug: read plus add is two steps, not one.
// => Two threads can read the same value before either writes back.
sealed class HitCounter // => the racy singleton
{ // => counter block opens
    private int visits; // => the running total, mutated racily

    public static int Seen => seenCount; // => the calls observed so far
    private static int seenCount; // => the demo observer, shared and atomic

    public int Next() // => Fix me: make the add atomic with Interlocked
    { // => next block opens
        seenCount++; // => observe this call, racily too
        visits++; // => the lost update lives here
        return visits; // => the maybe-duplicate total
    } // => next ends here
} // => counter ends here
