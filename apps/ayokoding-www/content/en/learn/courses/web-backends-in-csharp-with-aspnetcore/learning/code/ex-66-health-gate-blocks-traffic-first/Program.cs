// Example 66: Health Gate Blocks Traffic First.
// Load balancers read one endpoint to decide routing: healthy serves,
// draining refuses. This example flips a drain flag mid-run over loopback
// and prints the 200 from before the flip plus the 503 from after it.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The health route reads the flag; the flag flips without a restart (co-14).
// => Never a fixed port: the number comes from the bind, not the code.
static WebApplication BuildApp(string[] args, DrainFlag flag) // => the shared drain switch
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseUrls("http://127.0.0.1:0"); // => loopback, OS-chosen port, never fixed
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/health",
        () =>
            flag.Draining // => the readiness probe (co-14)
                ? Results.Json(new { status = "draining" }, statusCode: 503) // => 503: send no new traffic
                : Results.Ok(new { status = "ok" })
    ); // => 200: ready for traffic
    app.MapGet("/orders", () => Results.Ok(new { mode = "list" })); // => the traffic route (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves the health probe and prints the readiness seen.
// => The flag decides the code: ready before the flip, draining after.
static async Task CheckAsync(HttpClient client) // => the probe needs no arguments
{ // => check block opens
    using var response = await client.GetAsync("/health"); // => the balancer's question
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET /health -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line (co-14)
} // => check ends here

// => Top-level entry: probe ready, flip the flag, probe draining, stop.
var flag = new DrainFlag(); // => the shared switch, closed at first
var app = BuildApp(args, flag); // => wiring separate from traffic, as always
await app.StartAsync(); // => Kestrel listens on 127.0.0.1 and an ephemeral port
var port = new Uri(app.Urls.First()).Port; // => the OS-chosen port: used, never printed
using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}") }; // => loopback client
await CheckAsync(client); // => Output: GET /health -> 200 {"status":"ok"}
flag.Draining = true; // => the flip: traffic must stop arriving now
await CheckAsync(client); // => Output: GET /health -> 503 {"status":"draining"}
await app.StopAsync(); // => stop cleanly: no in-flight request is cut (co-08)

// => DrainFlag is the shared switch: false serves, true sheds.
// => Volatile keeps the flip visible across threads without a lock.
sealed class DrainFlag // => the readiness switch
{ // => flag block opens
    public volatile bool Draining; // => flipped once, read per probe
} // => flag ends here
