// Example 36: Scoped Gives One Per Request.
// A scoped service is built fresh for every request and shared within it,
// so per-request baggage — a request ID, a unit of work — rides along
// without leaking into the next call. This example mints one fixed ID per
// request, serves two requests in-process, and prints the distinct IDs.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddScoped registers the service (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => AddScoped builds one ticket per request, never shared across (co-06).
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

// => CheckAsync serves one request and prints the ticket observed.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Sequential checks mint T-1 then T-2: deterministic by order.
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
await CheckAsync(client, "/ticket"); // => Output: GET /ticket -> 200 {"ticket":"T-1"}
await CheckAsync(client, "/ticket"); // => Output: GET /ticket -> 200 {"ticket":"T-2"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => RequestTicket is the per-request baggage: minted once, used once.
// => A shared counter behind a scoped type keeps IDs ordered (co-06, co-07).
// => Static state here only sequences the demo; real baggage is per scope.
sealed class RequestTicket // => the scoped service
{ // => ticket block opens
    private static int issued; // => the demo sequencer, shared and atomic

    public string Name { get; } = $"T-{Interlocked.Increment(ref issued)}"; // => minted at construction
} // => ticket ends here
