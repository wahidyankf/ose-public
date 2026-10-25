// Example 53: Parallel Requests Share Nothing.
// Ten requests at once must not see each other's state: no static
// scratch, no shared builder, one scope per call. This example fires ten
// parallel reads in-process, collects the distinct values, and prints the
// count that proves the ten calls stayed independent.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddScoped gives one per request (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The ticket is scoped: parallel requests each mint their own (co-06, co-09).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddScoped<RequestTicket>(); // => one ticket per request scope (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/ticket",
        (RequestTicket ticket) => // => the request's own ticket (co-06)
            Results.Ok(new { ticket = ticket.Name })
    ); // => the per-request value, echoed (co-04)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: fire ten reads at once, prove they stayed separate.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client, ten parallel calls
var tasks = Enumerable.Range(0, 10).Select(_ => client.GetStringAsync("/ticket")).ToArray(); // => ten reads, no awaits yet
var bodies = await Task.WhenAll(tasks); // => all ten run concurrently (co-07)
var distinct = bodies.Distinct().Order().ToArray(); // => sort so the transcript is stable
Console.WriteLine($"parallel=10 distinct={distinct.Length}"); // => Output: parallel=10 distinct=10
Console.WriteLine($"first={distinct.First()} last={distinct.Last()}"); // => Output: first={"ticket":"T-1"} last={"ticket":"T-9"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => RequestTicket mints one name per scope: parallel scopes never share.
// => Static sequencing only orders the demo output (co-06, co-07).
sealed class RequestTicket // => the scoped service
{ // => ticket block opens
    private static int issued; // => the demo sequencer, shared and atomic

    public string Name { get; } = $"T-{Interlocked.Increment(ref issued)}"; // => minted at construction
} // => ticket ends here
