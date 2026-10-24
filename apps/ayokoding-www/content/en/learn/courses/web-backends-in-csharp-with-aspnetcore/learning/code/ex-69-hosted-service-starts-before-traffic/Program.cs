// Example 69: Hosted Service Starts Before Traffic.
// Background workers start with the host and stop with it: warm the cache
// before the first request lands. This example warms one fact in a hosted
// service, serves it over loopback, and prints the warmed value that proves
// startup ran before traffic.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.Extensions.DependencyInjection; // => AddHostedService registers the worker (co-06)
using Microsoft.Extensions.Hosting; // => BackgroundService is the worker base (co-08)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The warmer runs at startup; the handler only reads its result (co-08).
// => Never a fixed port: the number comes from the bind, not the code.
static WebApplication BuildApp(string[] args, WarmStore store) // => the shared warmed fact
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseUrls("http://127.0.0.1:0"); // => loopback, OS-chosen port, never fixed
    builder.Services.AddSingleton(store); // => the store both sides share (co-06)
    builder.Services.AddHostedService<Warmer>(); // => the startup worker (co-08)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/fact",
        (WarmStore warmed) => // => the handler reads the warmed fact (co-01)
            Results.Ok(new { fact = warmed.Fact })
    ); // => the warmed value, echoed (co-04)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: start, read the warmed fact, stop cleanly.
var store = new WarmStore(); // => the shared store, cold at first
var app = BuildApp(args, store); // => wiring separate from traffic, as always
await app.StartAsync(); // => the warmer runs before traffic lands
var port = new Uri(app.Urls.First()).Port; // => the OS-chosen port: used, never printed
using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}") }; // => loopback client
var settled = DateTime.UtcNow.AddSeconds(5); // => bound the wait for the warm fact
while (store.Fact == "(cold)" && DateTime.UtcNow < settled) // => the warmer lands just after start
    await Task.Delay(50); // => poll briefly: never printed, never asserted
using var response = await client.GetAsync("/fact"); // => the first traffic after startup
var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
Console.WriteLine($"GET /fact -> {(int)response.StatusCode} {body}".TrimEnd()); // => Output: GET /fact -> 200 {"fact":"honey never spoils"}
await app.StopAsync(); // => stop cleanly: no in-flight request is cut (co-08)

// => WarmStore holds the one fact the worker warms before traffic.
// => Volatile keeps the warmed value visible across threads.
sealed class WarmStore // => the shared store
{ // => store block opens
    public volatile string Fact = "(cold)"; // => cold until the warmer runs
} // => store ends here

// => Warmer is the startup worker: one fact, warmed once, then done.
// => StartAsync runs before the server accepts traffic (co-08).
sealed class Warmer(WarmStore store) : BackgroundService // => the hosted worker
{ // => warmer block opens
    protected override Task ExecuteAsync(CancellationToken stoppingToken) // => the startup work
    { // => execute block opens
        store.Fact = "honey never spoils"; // => the warmed fact, fixed forever
        return Task.CompletedTask; // => work done: the service idles from here
    } // => execute ends here
} // => warmer ends here
