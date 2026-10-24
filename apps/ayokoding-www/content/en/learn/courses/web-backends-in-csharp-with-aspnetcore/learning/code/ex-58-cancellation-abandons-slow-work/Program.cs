// Example 58: Cancellation Abandons Slow Work.
// A client that disconnects cancels the request token, and the handler
// should stop working instead of finishing for nobody. This example races
// a slow handler against a pre-cancelled token in-process and prints the
// abandonment the handler reported instead of a result.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The handler watches its CancellationToken and reports giving up (co-07).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/slow",
        async (CancellationToken token) => // => the token cancels with the client (co-07)
        { // => handler block opens
            try // => the work may be abandoned partway
            { // => work block opens
                await Task.Delay(1000, token); // => one second of pretend work
                return Results.Ok(new { done = true }); // => reached only when never cancelled
            } // => work ends here
            catch (OperationCanceledException) // => the client went away first
            { // => cancel block opens
                return Results.Json(new { abandoned = true }, statusCode: 499); // => fixed abandonment mark (co-04)
            } // => cancel ends here
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: run cancelled and patient calls, print both.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
var server = app.GetTestServer(); // => reach the in-memory server directly
using var cancelled = new CancellationTokenSource(); // => the token we control
cancelled.Cancel(); // => cancel before the request even starts
using var gone = new HttpClient(server.CreateHandler()); // => first client: already gone
try // => the cancelled call throws instead of answering
{ // => gone block opens
    using var lost = await gone.GetAsync("http://localhost/slow", cancelled.Token); // => abandoned client side
    Console.WriteLine($"cancelled -> {(int)lost.StatusCode}"); // => never reached: the token fired first
} // => gone ends here
catch (OperationCanceledException) // => the expected abandonment client side
{ // => catch block opens
    Console.WriteLine("cancelled -> client-gave-up"); // => Output: cancelled -> client-gave-up
} // => catch ends here
using var patient = app.GetTestClient(); // => second client: waits the full delay
using var slow = await patient.GetAsync("/slow"); // => no cancellation: runs to completion
Console.WriteLine(
    $"patient -> {(int)slow.StatusCode} {await slow.Content.ReadAsStringAsync()}".TrimEnd()
); // => Output: patient -> 200 {"done":true}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
