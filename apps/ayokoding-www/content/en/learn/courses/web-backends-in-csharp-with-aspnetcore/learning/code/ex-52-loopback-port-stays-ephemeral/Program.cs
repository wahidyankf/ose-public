// Example 52: Loopback Port Stays Ephemeral.
// Some behaviors need a real listener: shutdown, connection draining,
// port binding itself. The harness rule is strict — loopback only, and the
// port is chosen at bind time, never written in code. This example starts
// Kestrel on 127.0.0.1 with port zero, reads the assigned port back from
// the server, and prints everything except the port number.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
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

// => Top-level entry: start once, prove the round trip, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => Kestrel listens on 127.0.0.1 and an ephemeral port
var port = new Uri(app.Urls.First()).Port; // => the OS-chosen port: used, never printed
var host = new Uri(app.Urls.First()).Host; // => the bind address, for the transcript
Console.WriteLine($"listening on {host} port=(ephemeral)"); // => Output: listening on 127.0.0.1 port=(ephemeral)
using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}") }; // => loopback client
using var first = await client.GetAsync("/ping"); // => a real HTTP exchange over a real socket
Console.WriteLine(
    $"GET /ping -> {(int)first.StatusCode} {await first.Content.ReadAsStringAsync()}".TrimEnd()
); // => Output: GET /ping -> 200 {"pong":true}
using var second = await client.GetAsync("/missing"); // => the miss over the same socket
Console.WriteLine($"GET /missing -> {(int)second.StatusCode}".TrimEnd()); // => Output: GET /missing -> 404
await app.StopAsync(); // => stop cleanly: no in-flight request is cut (co-08)
