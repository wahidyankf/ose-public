// Example 78: Concurrency Model Compared.
// FastAPI leans on asyncio event loops; ASP.NET Core leans on the thread
// pool plus async handlers that yield while waiting. Same result — many
// requests share few threads — different scheduler. This example fans ten
// parallel reads at one atomic counter in-process and prints the total
// that proves all ten landed plus the asyncio line it mirrors.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddSingleton shares the counter (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => async handlers yield; Interlocked keeps the shared total exact (co-07).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<HitCounter>(); // => one counter for every visit (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/visit",
        async (HitCounter counter) => // => async: the thread yields on await (co-07)
        { // => handler block opens
            await Task.Delay(10); // => ten milliseconds of pretend wait, thread free
            return Results.Ok(new { visit = counter.Next() }); // => the atomic total, echoed (co-04)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: fan ten visits out, print the loss count, stop.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client, ten parallel calls
var tasks = Enumerable.Range(0, 10).Select(_ => client.GetStringAsync("/visit")).ToArray(); // => ten visits, no awaits
await Task.WhenAll(tasks); // => all ten run concurrently (co-07)
Console.WriteLine($"parallel=10 lost={10 - HitCounter.Seen}"); // => Output: parallel=10 lost=0
Console.WriteLine("fastapi: async def visit() awaits the same way"); // => Output: fastapi: async def visit() awaits the same way
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => HitCounter is the shared state: atomic increments, exact totals.
// => Seen counts every Next call so the transcript can prove zero loss.
sealed class HitCounter // => the singleton service
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
