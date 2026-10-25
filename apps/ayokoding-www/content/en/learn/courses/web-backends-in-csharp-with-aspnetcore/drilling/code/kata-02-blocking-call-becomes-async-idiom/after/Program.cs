// Kata 2 solution: await instead of Wait.
// The handler is async now: it yields the thread during the delay instead
// of holding it. Same answers, freed thread. Compare with before/: the
// route is identical, only the waiting idiom changed.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/slow/{id:int}",
        async (int id) => // => async handler: awaits without blocking
        { // => handler block opens
            await Task.Delay(10); // => the thread serves others during the wait
            return Results.Ok(new { id, ready = true }); // => the fixed answer, unchanged
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the answer observed.
static async Task CheckAsync(HttpClient client, int id) // => the slow resource to read
{ // => check block opens
    using var response = await client.GetAsync($"/slow/{id}"); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET /slow/{id} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, read twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, 1); // => Output: GET /slow/1 -> 200 {"id":1,"ready":true}
await CheckAsync(client, 2); // => Output: GET /slow/2 -> 200 {"id":2,"ready":true}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
