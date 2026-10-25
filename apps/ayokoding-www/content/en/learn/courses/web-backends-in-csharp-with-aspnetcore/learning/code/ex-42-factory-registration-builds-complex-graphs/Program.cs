// Example 42: Factory Registration Builds Complex Graphs.
// Some services need logic to build — read two settings, pick a mode — so
// the registration is a factory lambda, not a bare type. This example
// builds one report formatter from settings in-process and prints the
// formatted line the factory produced.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => the factory registration lives here (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The factory reads the provider, decides, and builds: logic at (co-06).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton(new ReportConfig("weekly", 42)); // => the fixed inputs to the factory
    builder.Services.AddSingleton<IFormatter>(provider => // => build logic runs once here (co-06)
    { // => factory block opens
        var config = provider.GetRequiredService<ReportConfig>(); // => read the inputs first
        return config.Rows > 100 // => big reports earn the long formatter
            ? new LongFormatter(config) // => the wide shape
            : new ShortFormatter(config); // => the narrow shape wins here
    }); // => factory ends here
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/report",
        (IFormatter formatter) => // => the factory product arrives ready (co-06)
            Results.Ok(new { report = formatter.Format() })
    ); // => the formatted line (co-04)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, check once, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
using var response = await client.GetAsync("/report"); // => the one report request
var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
Console.WriteLine($"GET /report -> {(int)response.StatusCode} {body}".TrimEnd()); // => Output: GET /report -> 200 {"report":"weekly:42"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => ReportConfig carries the factory inputs: name plus row count.
record ReportConfig(string Title, int Rows); // => the fixed inputs (co-06)

// => IFormatter is the one contract with two shapes: short and long.
interface IFormatter // => the formatting contract
{ // => contract block opens
    string Format(); // => one fixed line per formatter
} // => contract ends here

// => ShortFormatter wins for small reports: title, colon, count.
sealed class ShortFormatter(ReportConfig config) : IFormatter // => the narrow shape
{ // => short block opens
    public string Format() => $"{config.Title}:{config.Rows}"; // => the narrow line
} // => short ends here

// => LongFormatter serves big reports: padded for wide terminals.
sealed class LongFormatter(ReportConfig config) : IFormatter // => the wide shape
{ // => long block opens
    public string Format() => $"{config.Title} ({config.Rows} rows)"; // => the wide line
} // => long ends here
