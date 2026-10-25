// Kata 6 solution: atomic increments, zero loss.
// Interlocked makes the read-add-write indivisible: ten parallel visits
// produce exactly ten. Compare with before/: the route is identical, only
// the two increments changed, and lost pins at zero every run.
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
    ); // => the atomic total, echoed
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: fire ten visits at once, print the loss.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client, ten parallel calls
var tasks = Enumerable.Range(0, 10).Select(_ => client.GetStringAsync("/visit")).ToArray(); // => ten visits, no awaits
await Task.WhenAll(tasks); // => all ten run concurrently
Console.WriteLine($"parallel=10 lost={10 - HitCounter.Seen}"); // => Output: parallel=10 lost=0
await app.StopAsync(); // => stop cleanly: nothing in flight is cut

// => HitCounter is the fixed state: atomic increments, exact totals.
sealed class HitCounter // => the fixed singleton
{ // => counter block opens
    private int visits; // => the running total, mutated atomically

    public static int Seen => seenCount; // => the calls observed so far
    private static int seenCount; // => the demo observer, shared and atomic

    public int Next() // => atomic add-and-read
    { // => next block opens
        Interlocked.Increment(ref seenCount); // => observe this call first
        return Interlocked.Increment(ref visits); // => then advance the total
    } // => next ends here
} // => counter ends here
