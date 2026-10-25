// Example 39: Options Pattern Carries Settings.
// Settings belong in one bound object — not scattered GetValue calls — so
// the shape is validated once at startup. This example binds shop settings
// from memory, serves one request in-process, and prints the bound values
// the handler observed.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => Configure and Options live here (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)
using Microsoft.Extensions.Options; // => IOptions reads the bound settings (co-06)

// => BuildApp wires the service with every route this example serves.
// => Configure binds the section once; handlers read IOptions (co-06).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.Configure<ShopSettings>(s => // => the one place settings are set (co-06)
    { // => settings block opens
        s.Name = "corner-shop"; // => fixed name for the transcript
        s.MaxItems = 50; // => fixed cap for the transcript
    }); // => settings end here
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/settings",
        (IOptions<ShopSettings> options) => // => bound settings arrive by type (co-06)
            Results.Ok(new { shop = options.Value.Name, max = options.Value.MaxItems })
    ); // => the observed values
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, check once, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
using var response = await client.GetAsync("/settings"); // => the one settings request
var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
Console.WriteLine($"GET /settings -> {(int)response.StatusCode} {body}".TrimEnd()); // => Output: GET /settings -> 200 {"shop":"corner-shop","max":50}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => ShopSettings is the bound shape: one class per settings area.
// => Properties carry defaults; Configure overrides them in one place (co-06).
sealed class ShopSettings // => the settings object
{ // => settings block opens
    public string Name { get; set; } = "unnamed"; // => default until configured
    public int MaxItems { get; set; } = 10; // => default until configured
} // => settings end here
