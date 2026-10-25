// Kata 5 starter: split the handler from its dependency.
// Fix me: the handler below news up its own Greeter, so no test can swap
// it. Register the greeter in the container and inject it, keeping the
// answers byte identical. The after/ solution shows the split.
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
        "/greet/{name}",
        (string name) => // => Fix me: inject Greeter instead of newing it
            Results.Ok(new { greeting = new Greeter().Greet(name) })
    ); // => hidden construction: untestable
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
foreach (var name in new[] { "ada", "linus" }) // => the two greeted names
{ // => check block opens
    using var response = await client.GetAsync($"/greet/{name}"); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET /greet/{name} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here
await app.StopAsync(); // => stop cleanly: nothing in flight is cut

// => Greeter is the logic the handler hides today: construction inside.
// => After the split it injects, and tests can swap it.
sealed class Greeter // => the hidden dependency
{ // => greeter block opens
    public string Greet(string name) => $"hello, {name}"; // => pure function: same name, same words
} // => greeter ends here
