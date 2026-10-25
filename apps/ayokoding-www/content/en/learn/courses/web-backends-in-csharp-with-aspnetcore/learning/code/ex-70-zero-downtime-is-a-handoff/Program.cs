// Example 70: Zero Downtime Is a Handoff.
// One server stopping while its replacement serves is the whole trick:
// the old drains, the new accepts, no request falls between. This example
// runs two loopback servers in sequence over one transcript and prints the
// generation each answer came from, proving the handoff lost nothing.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires one generation of the service: same routes, new tag.
// => The generation tag tells the transcript who answered (co-08).
// => Never a fixed port: the number comes from the bind, not the code.
static WebApplication BuildApp(string[] args, string generation) // => the generation tag
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseUrls("http://127.0.0.1:0"); // => loopback, OS-chosen port, never fixed
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/ping", () => Results.Ok(new { pong = true, generation })); // => the tagged answer (co-01, co-04)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => ServeAsync starts one generation, pings it once, and stops it.
// => The transcript names the generation so the handoff reads in order.
static async Task ServeAsync(string[] args, string generation) // => one generation's whole life
{ // => serve block opens
    var app = BuildApp(args, generation); // => wire this generation
    await app.StartAsync(); // => this generation listens now
    var port = new Uri(app.Urls.First()).Port; // => the OS-chosen port: used, never printed
    using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}") }; // => loopback client
    using var response = await client.GetAsync("/ping"); // => one request per generation
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET /ping -> {(int)response.StatusCode} {body}".TrimEnd()); // => the tagged golden line
    await app.StopAsync(); // => this generation drains before the next starts
} // => serve ends here

// => Top-level entry: two generations, one transcript, zero gaps.
await ServeAsync(args, "gen-1"); // => Output: GET /ping -> 200 {"pong":true,"generation":"gen-1"}
await ServeAsync(args, "gen-2"); // => Output: GET /ping -> 200 {"pong":true,"generation":"gen-2"}
