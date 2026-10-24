// Kata 2 starter: convert the blocking call into the async idiom.
// Fix me: the handler below blocks its thread with Wait(). Rewrite it as
// an async handler that awaits the same delay, keeping the answers byte
// identical. The after/ solution shows the converted shape.
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
        (int id) => // => Fix me: make this async and await
        { // => handler block opens
            Task.Delay(10).Wait(); // => blocking wait: holds the thread hostage
            return Results.Ok(new { id, ready = true }); // => the fixed answer
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
await CheckAsync(client, 1); // => the first slow read
await CheckAsync(client, 2); // => the second slow read
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
