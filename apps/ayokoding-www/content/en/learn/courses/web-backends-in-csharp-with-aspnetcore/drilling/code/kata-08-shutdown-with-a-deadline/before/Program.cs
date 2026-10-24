// Kata 8 starter: stop on a deadline.
// Fix me: the stop below waits out the whole slow request, so deploys hang
// behind one dependency. Configure a 300ms ShutdownTimeout like Example 68
// and print the bounded stop. The after/ solution shows the deadline.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.Extensions.Hosting; // => HostOptions carries the deadline
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
// => Fix me: the deadline configuration is missing here.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseUrls("http://127.0.0.1:0"); // => loopback, OS-chosen port, never fixed
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/slow",
        async (CancellationToken token) => // => the token fires at the deadline
        { // => handler block opens
            try // => the work may be cut partway
            { // => work block opens
                await Task.Delay(5000, token); // => five seconds of pretend work
                return Results.Ok(new { done = true }); // => reached only when never cut
            } // => work ends here
            catch (OperationCanceledException) // => the deadline cut this request
            { // => cancel block opens
                return Results.Json(new { cut = true }, statusCode: 499); // => fixed cut mark
            } // => cancel ends here
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: start, overlap a request with the stop, report.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => Kestrel listens on 127.0.0.1 and an ephemeral port
var port = new Uri(app.Urls.First()).Port; // => the OS-chosen port: used, never printed
using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}") }; // => loopback client
var flight = client.GetStringAsync("/slow"); // => the request the deadline will cut
await Task.Delay(200); // => let the slow request reach the handler first
await app.StopAsync(); // => Fix me: unbounded today, bounded after the fix
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
Console.WriteLine($"stop -> bounded client={clientWord}"); // => the bounded stop, after the fix
