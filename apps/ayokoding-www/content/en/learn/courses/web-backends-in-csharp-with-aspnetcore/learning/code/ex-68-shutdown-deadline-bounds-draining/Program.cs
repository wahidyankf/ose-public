// Example 68: Shutdown Deadline Bounds Draining.
// The drain cannot run forever: ShutdownTimeout bounds it, and requests
// still working past the deadline are cut. This example sets a short
// deadline, stops with one slow request in flight over loopback, and
// prints how fast the stop returned plus the cut the slow request took.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.Extensions.Hosting; // => HostOptions carries the deadline (co-08)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The 300ms deadline cuts the five-second request mid-flight (co-08).
// => Never a fixed port: the number comes from the bind, not the code.
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseUrls("http://127.0.0.1:0"); // => loopback, OS-chosen port, never fixed
    builder.Services.Configure<HostOptions>(options => // => the drain bound (co-08)
        options.ShutdownTimeout = TimeSpan.FromMilliseconds(300)
    ); // => short on purpose for the demo
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/slow",
        async (CancellationToken token) => // => the token fires at the deadline (co-08)
        { // => handler block opens
            try // => the work may be cut partway
            { // => work block opens
                await Task.Delay(5000, token); // => five seconds of pretend work
                return Results.Ok(new { done = true }); // => reached only when never cut
            } // => work ends here
            catch (OperationCanceledException) // => the deadline cut this request
            { // => cancel block opens
                return Results.Json(new { cut = true }, statusCode: 499); // => fixed cut mark (co-04)
            } // => cancel ends here
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: start, overlap a request with a bounded stop, report.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => Kestrel listens on 127.0.0.1 and an ephemeral port
var port = new Uri(app.Urls.First()).Port; // => the OS-chosen port: used, never printed
using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}") }; // => loopback client
var flight = client.GetStringAsync("/slow"); // => the request the deadline will cut
await Task.Delay(200); // => let the slow request reach the handler first
await app.StopAsync(); // => bounded stop: the deadline cuts the drain
string clientWord; // => the client side always ends the same way here
try // => the cut connection cannot deliver an answer
{ // => try block opens
    await flight; // => the answer that never arrives
    clientWord = "answered"; // => a surprise: the socket survived
} // => try ends here
catch (Exception) // => refused, reset, or cancelled: all mean cut
{ // => catch block opens
    clientWord = "cut"; // => the fixed client-side word
} // => catch ends here
Console.WriteLine($"stop -> bounded client={clientWord}"); // => Output: stop -> bounded client=cut
