// Example 38: Lifetimes Compose Safely.
// The container enforces the layering: singletons may not depend on
// scoped services, because the scope outlives the request. This example
// composes all three lifetimes legally in-process and prints who built
// whom, proving the graph resolved without a captive dependency.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => the three lifetime registrations (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Singleton holds config, scoped holds the ticket, transient formats (co-06).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<ShopConfig>(); // => one config for the process (co-06)
    builder.Services.AddScoped<TicketMaker>(); // => one maker per request (co-06)
    builder.Services.AddTransient<TicketPrinter>(); // => fresh printer per injection (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/compose",
        (TicketMaker maker, TicketPrinter printer) => // => scoped plus transient (co-06)
        { // => compose block opens
            var ticket = maker.Make(); // => mint once: made and printed share it
            return Results.Ok(new { made = ticket, printed = printer.Print(ticket) }); // => the composed proof (co-04)
        }
    ); // => compose ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, check once, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
using var response = await client.GetAsync("/compose"); // => the one composed request
var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
Console.WriteLine($"GET /compose -> {(int)response.StatusCode} {body}".TrimEnd()); // => Output: GET /compose -> 200 {"made":"shop-T-1","printed":"[shop-T-1]"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => ShopConfig is the long-lived root: name the shop once, share forever.
// => Singletons hold values, never scoped services: the layering rule (co-06).
sealed class ShopConfig // => the singleton root
{ // => config block opens
    public string Shop => "shop"; // => the fixed shop name
} // => config ends here

// => TicketMaker is scoped: one per request, built over the singleton.
// => Depending upward (scoped on singleton) is always legal (co-06).
sealed class TicketMaker(ShopConfig config) // => the singleton arrives by constructor
{ // => maker block opens
    private static int issued; // => the demo sequencer, shared and atomic

    public string Make() => $"{config.Shop}-T-{Interlocked.Increment(ref issued)}"; // => shop plus sequence
} // => maker ends here

// => TicketPrinter is transient: fresh per injection, stateless formatting.
// => Depending on nothing keeps it usable from any lifetime (co-06).
sealed class TicketPrinter // => the transient leaf
{ // => printer block opens
    public string Print(string ticket) => $"[{ticket}]"; // => brackets mark the print
} // => printer ends here
