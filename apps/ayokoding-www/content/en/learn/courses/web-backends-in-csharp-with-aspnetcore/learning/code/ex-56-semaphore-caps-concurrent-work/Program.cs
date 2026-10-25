// Example 56: Semaphore Caps Concurrent Work.
// A semaphore admits only N workers at once: the eleventh waits its turn.
// This example caps a slow resource at two seats, fires five parallel
// reads in-process, and prints the peak occupancy that proves the cap
// held while every read still finished.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddSingleton shares the gate (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The gate is a singleton: every request queues at the same door (co-06).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<Gate>(); // => one gate for the whole service (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/slow",
        async (Gate gate) => // => every request passes the gate (co-07)
        { // => handler block opens
            await gate.EnterAsync(); // => wait for one of the two seats
            try // => the seat is ours: work inside it
            { // => work block opens
                await Task.Delay(20); // => twenty milliseconds of pretend work
                return Results.Ok(new { admitted = true }); // => the fixed answer (co-04)
            } // => work ends here
            finally // => seats release even when handlers throw
            { // => release block opens
                gate.Leave(); // => hand the seat back
            } // => release ends here
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: fire five reads, print the peak and the served.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client, five parallel calls
var tasks = Enumerable.Range(0, 5).Select(_ => client.GetStringAsync("/slow")).ToArray(); // => five reads, no awaits
var bodies = await Task.WhenAll(tasks); // => all five run concurrently (co-07)
var served = bodies.Count(b => b == "{\"admitted\":true}"); // => every read must answer alike
Console.WriteLine($"parallel=5 served={served} peak={Gate.Peak}"); // => Output: parallel=5 served=5 peak=2
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Gate admits two workers at once and records the highest occupancy.
// => SemaphoreSlim is the cap; Interlocked tracks the peak (co-07).
sealed class Gate // => the singleton gate
{ // => gate block opens
    private readonly SemaphoreSlim seats = new(2); // => two workers inside at once
    private int inside; // => current occupancy, mutated atomically
    private static int peak; // => the highest occupancy observed

    public static int Peak => peak; // => the transcript reads the peak here

    public async Task EnterAsync() // => wait for a seat, then count in
    { // => enter block opens
        await seats.WaitAsync(); // => queue here when both seats are taken
        var now = Interlocked.Increment(ref inside); // => count this worker in
        int was; // => the peak loop variable
        do // => raise the peak until it sticks
        { // => peak block opens
            was = peak; // => read the current peak
        } while (now > was && Interlocked.CompareExchange(ref peak, now, was) != was); // => atomic raise
    } // => enter ends here

    public void Leave() // => count out, then free the seat
    { // => leave block opens
        Interlocked.Decrement(ref inside); // => this worker leaves
        seats.Release(); // => the next queued worker enters
    } // => leave ends here
} // => gate ends here
