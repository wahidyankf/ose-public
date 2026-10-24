// Example 62: Server Binds a Loopback Port.
// Real serving starts with a listener, and tests take an ephemeral
// loopback port the system chooses. This example serves Kestrel on
// 127.0.0.1 with port zero, exchanges one real HTTP round trip, and prints
// the status with the body: never the port number itself.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with the one route this example serves.
// => UseUrls with port zero asks the OS for a free loopback port (co-08).
// => Never a fixed port: the number comes from the bind, not the code.
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseUrls("http://127.0.0.1:0"); // => loopback, OS-chosen port, never fixed
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/ping", () => Results.Ok(new { pong = true })); // => the route under test (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: start once, round-trip over loopback, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => Kestrel listens on 127.0.0.1 and an ephemeral port
var port = new Uri(app.Urls.First()).Port; // => the OS-chosen port: used, never printed
using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}") }; // => loopback client
using var response = await client.GetAsync("/ping"); // => a real HTTP exchange over a real socket
var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
Console.WriteLine($"GET /ping -> {(int)response.StatusCode} {body}".TrimEnd()); // => Output: GET /ping -> 200 {"pong":true}
await app.StopAsync(); // => stop cleanly: no in-flight request is cut (co-08)
