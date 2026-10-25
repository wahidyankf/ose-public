// Example 7: Redirect Moves a Client.
// A redirect answers with a location instead of a body: the client replays
// the request at the new address. This example registers one redirect,
// follows it with a manual client that never auto-follows, and prints both
// legs so the move itself is visible.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => MapGet on the old path answers 302 with the new location (co-04).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/old", () => Results.Redirect("/new")); // => 302 plus a Location header (co-04)
    app.MapGet("/new", () => Results.Ok(new { message = "new home" })); // => the landing route (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, walk both legs, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
var server = app.GetTestServer(); // => reach the in-memory server directly
using var client = new HttpClient(server.CreateHandler()) // => manual handler: never auto-follows
{ // => client options open
    BaseAddress = new Uri("http://localhost"), // => TestServer answers any host name
}; // => client options end here
using var first = await client.GetAsync("/old"); // => the redirect leg itself
var location = first.Headers.Location?.ToString() ?? "(none)"; // => where the server points next
Console.WriteLine($"GET /old -> {(int)first.StatusCode} location={location}"); // => Output: GET /old -> 302 location=/new
using var second = await client.GetAsync(location); // => the client replays at the new address
var body = await second.Content.ReadAsStringAsync(); // => the landing body bytes
Console.WriteLine($"GET {location} -> {(int)second.StatusCode} {body}"); // => Output: GET /new -> 200 {"message":"new home"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
