// Example 54: Async Handlers Free the Thread.
// An async handler awaits slow work without holding its thread, so one
// thread serves many waiting requests. This example awaits a fixed delay
// on three sequential reads in-process and prints the three answers plus
// the fact that the delay never leaked into the output.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => async plus await yields the thread while the delay runs (co-07).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/slow/{id:int}",
        async (int id) => // => async handler: awaits without blocking (co-07)
        { // => handler block opens
            await Task.Delay(10); // => ten milliseconds of pretend work, never printed
            return Results.Ok(new { id, ready = true }); // => the fixed answer after the wait (co-04)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the answer observed.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Nothing here dials a port: there is no network call at all.
static async Task CheckAsync(HttpClient client, int id) // => the slow resource to read
{ // => check block opens
    using var response = await client.GetAsync($"/slow/{id}"); // => awaits the handler's own await
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET /slow/{id} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line (co-04)
} // => check ends here

// => Top-level entry: build once, read three slow rows, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, 1); // => Output: GET /slow/1 -> 200 {"id":1,"ready":true}
await CheckAsync(client, 2); // => Output: GET /slow/2 -> 200 {"id":2,"ready":true}
await CheckAsync(client, 3); // => Output: GET /slow/3 -> 200 {"id":3,"ready":true}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
