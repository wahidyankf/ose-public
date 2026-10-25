// Example 63: Stop Async Drains in Flight.
// StopAsync stops accepting new connections but lets in-flight requests
// finish: the drain, not a drop. This example starts a slow request, stops
// the server mid-flight over loopback, and prints the slow answer that
// still completed plus the refusal the stopped server gave the next call.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The slow route holds its request long enough to overlap the stop (co-08).
// => Never a fixed port: the number comes from the bind, not the code.
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseUrls("http://127.0.0.1:0"); // => loopback, OS-chosen port, never fixed
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/slow",
        async () => // => the in-flight request (co-08)
        { // => slow block opens
            await Task.Delay(500); // => half a second of pretend work
            return Results.Ok(new { drained = true }); // => the answer the drain protects (co-04)
        }
    ); // => slow ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: start, overlap a request with the stop, report.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => Kestrel listens on 127.0.0.1 and an ephemeral port
var port = new Uri(app.Urls.First()).Port; // => the OS-chosen port: used, never printed
using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}") }; // => loopback client
var flight = client.GetStringAsync("/slow"); // => the request that overlaps the stop
await Task.Delay(100); // => let the slow request reach the handler first
var stopping = app.StopAsync(); // => stop: drain in flight, refuse the new
await Task.Delay(100); // => let the stop take hold before the next call
string refused; // => the refusal the stopped server gives
try // => the next call must fail: nothing listens now
{ // => try block opens
    using var late = await client.GetAsync("/slow"); // => the call after the stop
    refused = $"status={(int)late.StatusCode}"; // => a status would surprise here
} // => try ends here
catch (HttpRequestException) // => connection refused: the expected refusal
{ // => catch block opens
    refused = "refused"; // => the fixed refusal word
} // => catch ends here
var drained = await flight; // => the slow answer survives the drain
Console.WriteLine($"slow -> {drained}"); // => Output: slow -> {"drained":true}
Console.WriteLine($"late -> {refused}"); // => Output: late -> refused
await stopping; // => the stop itself completes after the drain
