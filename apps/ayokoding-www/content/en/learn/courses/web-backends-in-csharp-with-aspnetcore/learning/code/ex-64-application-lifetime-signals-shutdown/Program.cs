// Example 64: Application Lifetime Signals Shutdown.
// IHostApplicationLifetime exposes three events — started, stopping,
// stopped — and services hook them to open and close resources in order.
// This example records the event sequence over loopback and prints the
// order the three signals fired in.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.Extensions.Hosting; // => the lifetime events live here (co-08)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The events record themselves into one shared list (co-08).
// => Never a fixed port: the number comes from the bind, not the code.
static WebApplication BuildApp(string[] args, List<string> events) // => the shared event log
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseUrls("http://127.0.0.1:0"); // => loopback, OS-chosen port, never fixed
    var app = builder.Build(); // => the pipeline with routing and endpoints
    var life = app.Services.GetRequiredService<IHostApplicationLifetime>(); // => the three signals (co-08)
    life.ApplicationStarted.Register(() => events.Add("started")); // => serving begins here
    life.ApplicationStopping.Register(() => events.Add("stopping")); // => drain begins here
    life.ApplicationStopped.Register(() => events.Add("stopped")); // => process may exit here
    app.MapGet("/ping", () => Results.Ok(new { pong = true })); // => the route under test (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: start, ping, stop, print the signal order.
var events = new List<string>(); // => the shared log every signal appends to
var app = BuildApp(args, events); // => wiring separate from traffic, as always
await app.StartAsync(); // => Kestrel listens: the started signal fires
var port = new Uri(app.Urls.First()).Port; // => the OS-chosen port: used, never printed
using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}") }; // => loopback client
using var response = await client.GetAsync("/ping"); // => one request while serving
await app.StopAsync(); // => stopping then stopped fire around the drain
Console.WriteLine($"GET /ping -> {(int)response.StatusCode}"); // => Output: GET /ping -> 200
Console.WriteLine($"events={string.Join(",", events)}"); // => Output: events=started,stopping,stopped
