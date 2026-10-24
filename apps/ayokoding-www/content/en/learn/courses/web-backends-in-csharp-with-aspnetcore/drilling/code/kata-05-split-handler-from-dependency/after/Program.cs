// Kata 5 solution: the container builds, the handler only calls.
// Registration moves construction out of the handler: tests can swap the
// greeter without touching the route. Compare with before/: the answers
// are byte identical, only the construction moved.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.DependencyInjection; // => AddSingleton registers the service
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<Greeter>(); // => one shared greeter: built once, injected twice
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/greet/{name}",
        (string name, Greeter greeter) => // => the greeter arrives by type
            Results.Ok(new { greeting = greeter.Greet(name) })
    ); // => the handler only calls it
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

// => Output: GET /greet/ada -> 200 {"greeting":"hello, ada"}
// => Output: GET /greet/linus -> 200 {"greeting":"hello, linus"}

// => Greeter is the injected logic: pure function, swappable in tests.
sealed class Greeter // => the shared dependency
{ // => greeter block opens
    public string Greet(string name) => $"hello, {name}"; // => pure function: same name, same words
} // => greeter ends here
