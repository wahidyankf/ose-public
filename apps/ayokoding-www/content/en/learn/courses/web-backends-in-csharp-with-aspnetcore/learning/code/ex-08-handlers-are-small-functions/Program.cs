// Example 8: Handlers Are Small Functions.
// A handler stays readable when it takes typed inputs, calls one service,
// and returns one result shape. This example injects a tiny greeter
// service into a two-line handler, serves two requests in-process, and
// prints the greeting each name produced.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddSingleton registers the service (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The greeter is registered once; the handler only calls it (co-06).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<Greeter>(); // => one shared greeter for every request (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/greet/{name}",
        (string name, Greeter greeter) => // => service arrives by type (co-06)
            Results.Ok(new { greeting = greeter.Greet(name) })
    ); // => handler stays two lines (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints what the handler did.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Nothing here dials a port: there is no network call at all.
static async Task CheckAsync(HttpClient client, string target) // => the path names the request
{ // => check block opens
    using var response = await client.GetAsync(target); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET {target} -> {(int)response.StatusCode} {body}"); // => one golden line (co-04)
} // => check ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "/greet/ada"); // => Output: GET /greet/ada -> 200 {"greeting":"hello, ada"}
await CheckAsync(client, "/greet/linus"); // => Output: GET /greet/linus -> 200 {"greeting":"hello, linus"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Greeter is the one service this example teaches: pure logic, no HTTP.
// => Keeping logic outside the handler makes it unit-testable alone (co-06).
// => The handler maps HTTP in and out; the greeter decides the words.
sealed class Greeter // => tiny service with one job
{ // => service block opens
    public string Greet(string name) => $"hello, {name}"; // => pure function: same name, same words
} // => service ends here
