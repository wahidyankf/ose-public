// Example 65: Cancellation Token Flows to Handlers.
// A shutdown deadline aborts connections still working past it, and the
// request token fires so handlers abandon instead of finishing for
// nobody. This example gives the server a short deadline, starts a slow
// loopback request, stops past the deadline, and prints the abandonment
// the handler recorded server side.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.Extensions.Hosting; // => HostOptions carries the deadline (co-08)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The deadline aborts the slow request 300ms into the stop (co-08).
// => The events list records what the handler observed, server side.
static WebApplication BuildApp(string[] args, List<string> events) // => the shared server-side log
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseUrls("http://127.0.0.1:0"); // => loopback, OS-chosen port, never fixed
    builder.Services.Configure<HostOptions>(options => // => the shutdown deadline (co-08)
        options.ShutdownTimeout = TimeSpan.FromMilliseconds(300)
    ); // => short on purpose for the demo
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/slow",
        async (CancellationToken token) => // => the token fires at the deadline (co-08)
        { // => handler block opens
            try // => the work may be abandoned partway
            { // => work block opens
                await Task.Delay(5000, token); // => five seconds of pretend work
                events.Add("done"); // => reached only when never cancelled
                return Results.Ok(new { done = true }); // => the answer nobody waits for
            } // => work ends here
            catch (OperationCanceledException) // => the deadline aborted this request
            { // => cancel block opens
                events.Add("abandoned"); // => the server-side record of giving up
                return Results.Json(new { abandoned = true }, statusCode: 499); // => fixed abandonment mark (co-04)
            } // => cancel ends here
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: start, overlap a request with the stop, report.
var events = new List<string>(); // => the shared log the handler appends to
var app = BuildApp(args, events); // => wiring separate from traffic, as always
await app.StartAsync(); // => Kestrel listens on 127.0.0.1 and an ephemeral port
var port = new Uri(app.Urls.First()).Port; // => the OS-chosen port: used, never printed
using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}") }; // => loopback client
var flight = client.GetStringAsync("/slow"); // => the request the deadline will abort
await Task.Delay(200); // => let the slow request reach the handler first
await app.StopAsync(); // => the stop passes the deadline: the token fires
string clientWord; // => the client side always ends the same way here
try // => the aborted connection cannot deliver an answer
{ // => try block opens
    await flight; // => the answer that never arrives
    clientWord = "answered"; // => a surprise: the socket survived
} // => try ends here
catch (Exception) // => refused, reset, or cancelled: all mean cut
{ // => catch block opens
    clientWord = "cut"; // => the fixed client-side word
} // => catch ends here
var settled = DateTime.UtcNow.AddSeconds(5); // => bound the wait for the server-side record
while (events.Count == 0 && DateTime.UtcNow < settled) // => the record lands just after the abort
    await Task.Delay(50); // => poll briefly: never printed, never asserted
Console.WriteLine($"slow -> client={clientWord} server=[{string.Join(",", events)}]"); // => Output: slow -> client=cut server=[abandoned]
