// Example 74: DI Container Versus Depends.
// FastAPI resolves Depends per request from a call graph; ASP.NET Core
// resolves lifetimes from a container built once at startup. Same idea —
// declare what you need, get it per request — different machinery. This
// example injects a scoped ticket twice in-process and prints the two
// distinct tickets plus the Depends line they mirror.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddScoped is the container entry (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The container builds the scope; the handler only names its need (co-06).
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
        (RequestTicket ticket) => // => Depends(get_ticket) in FastAPI spelling (co-06, co-16)
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

// => Top-level entry: build once, check twice, name the mirror, stop.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "/ticket"); // => Output: GET /ticket -> 200 {"ticket":"T-1"}
await CheckAsync(client, "/ticket"); // => Output: GET /ticket -> 200 {"ticket":"T-2"}
Console.WriteLine("fastapi: ticket: str = Depends(get_ticket)"); // => Output: fastapi: ticket: str = Depends(get_ticket)
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => RequestTicket is the per-request value the container mints per scope.
// => Static sequencing only orders the demo transcript (co-06, co-16).
sealed class RequestTicket // => the scoped service
{ // => ticket block opens
    private static int issued; // => the demo sequencer, shared and atomic

    public string Name { get; } = $"T-{Interlocked.Increment(ref issued)}"; // => minted at construction
} // => ticket ends here
