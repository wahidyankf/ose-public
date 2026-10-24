// Kata 7 starter: wrap failures in the service error envelope.
// Fix me: misses answer bare 404s with empty bodies, so clients parse two
// shapes. Add the shared Fail helper from Example 20 and route every
// failure through it. The after/ solution shows one envelope everywhere.
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
        "/books/{id:int}",
        (int id) => // => Fix me: failures must wear the envelope
            id == 1 ? Results.Ok(new { id, title = "dune" }) : Results.NotFound()
    ); // => bare 404: two shapes
    app.MapPost("/books", () => Results.BadRequest()); // => bare 400: two shapes
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the code with the body.
static async Task CheckAsync(HttpClient client, string method, string target) // => method plus path
{ // => check block opens
    using var request = new HttpRequestMessage(new HttpMethod(method), target); // => no bodies in this kata
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"{method} {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, fail twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client for the whole suite
await CheckAsync(client, "GET", "/books/99"); // => empty 404 today: must wear the envelope
await CheckAsync(client, "POST", "/books"); // => empty 400 today: must wear the envelope
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
