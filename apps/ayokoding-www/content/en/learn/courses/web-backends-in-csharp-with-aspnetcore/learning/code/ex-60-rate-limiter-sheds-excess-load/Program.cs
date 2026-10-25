// Example 60: Rate Limiter Sheds Excess Load.
// A fixed-window limiter admits two requests per window and answers 429
// to the rest, so one client cannot starve the others. This example fires
// four immediate requests at one limited route in-process and prints the
// two 200s plus the two 429s the window produced.
using System.Threading.RateLimiting; // => FixedWindowLimiter shapes the window (co-07)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.RateLimiting; // => the limiter middleware lives here (co-07)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddRateLimiter configures the policy (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Two permits per minute-long window: the test never waits it out (co-07).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddRateLimiter(options => // => the one policy this example teaches (co-07)
    { // => options block opens
        options.RejectionStatusCode = 429; // => shed load with 429, the standard code
        options.AddFixedWindowLimiter(
            "two",
            window => // => the named policy
            { // => window block opens
                window.PermitLimit = 2; // => two admissions per window
                window.Window = TimeSpan.FromMinutes(1); // => windows far outlast the test
            }
        ); // => window ends here
    }); // => options end here
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.UseRateLimiter(); // => the shedding middleware, before routing (co-02)
    app.MapGet("/tight", () => Results.Ok(new { admitted = true })).RequireRateLimiting("two"); // => limited (co-01)
    app.MapGet("/loose", () => Results.Ok(new { admitted = true })); // => never limited (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the code with the body.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Sequential calls fill the window two at a time: deterministic order.
static async Task CheckAsync(HttpClient client, string target) // => the path names the request
{ // => check block opens
    using var response = await client.GetAsync(target); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line (co-04)
} // => check ends here

// => Top-level entry: build once, spend the window, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "/tight"); // => Output: GET /tight -> 200 {"admitted":true}
await CheckAsync(client, "/tight"); // => Output: GET /tight -> 200 {"admitted":true}
await CheckAsync(client, "/tight"); // => Output: GET /tight -> 429
await CheckAsync(client, "/tight"); // => Output: GET /tight -> 429
await CheckAsync(client, "/loose"); // => Output: GET /loose -> 200 {"admitted":true}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
