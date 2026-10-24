// Example 51: Test Services Replace the Real Ones.
// Tests swap slow or flaky dependencies for fakes at the container level:
// same handler, different clock. This example builds the service twice —
// once with the real clock, once with a fixed one — and prints the hour
// each configuration observed.
using System.Text.Json; // => JsonDocument parses the real hour (co-04)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => the swap point lives here (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with a swappable clock behind it.
// => useFake decides which clock the container holds (co-06, co-09).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args, bool useFake) // => the swap switch
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    if (useFake) // => the test configuration
        builder.Services.AddSingleton<IClock, FixedClock>(); // => fixed hour, forever (co-09)
    else // => the production configuration
        builder.Services.AddSingleton<IClock, WallClock>(); // => the real hour, right now (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/hour",
        (IClock clock) => // => the handler never knows which clock (co-06)
            Results.Ok(new { hour = clock.Hour() })
    ); // => the observed hour, echoed (co-04)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckRealAsync proves the real clock serves a sane hour, not its value.
// => Printing the value would vary by run: print the range check instead.
// => Reruns stay byte-identical because only the verdict is printed.
static async Task CheckRealAsync(WebApplication app) // => the production configuration
{ // => real block opens
    await app.StartAsync(); // => start the real configuration's server
    using var client = app.GetTestClient(); // => client talks to memory, not the network
    using var response = await client.GetAsync("/hour"); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the served hour bytes
    var hour = JsonDocument.Parse(body).RootElement.GetProperty("hour").GetInt32(); // => parse, never print
    var sane = hour >= 0 && hour <= 23 ? "yes" : "no"; // => the range every real hour satisfies
    Console.WriteLine($"[real] GET /hour -> {(int)response.StatusCode} sane={sane}"); // => Output: [real] GET /hour -> 200 sane=yes
    await app.StopAsync(); // => stop this configuration cleanly
} // => real ends here

// => CheckFakeAsync pins the fake's exact bytes: the suite can assert on it.
// => The fake never varies, so the full body prints byte-identically (co-09).
// => Nothing here dials a port: there is no network call at all.
static async Task CheckFakeAsync(WebApplication app) // => the test configuration
{ // => fake block opens
    await app.StartAsync(); // => start the fake configuration's server
    using var client = app.GetTestClient(); // => client talks to memory, not the network
    using var response = await client.GetAsync("/hour"); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    var verdict = body == "{\"hour\":9}" ? "PASS" : "FAIL"; // => the fake's line must match exactly
    Console.WriteLine($"{verdict} [fake] GET /hour -> {(int)response.StatusCode} {body}".TrimEnd()); // => golden line
    await app.StopAsync(); // => stop this configuration cleanly
} // => fake ends here

// => Top-level entry: real configuration first, then the fixed fake.
await CheckRealAsync(BuildApp(args, false)); // => production clock: sane, never pinned
await CheckFakeAsync(BuildApp(args, true)); // => Output: PASS [fake] GET /hour -> 200 {"hour":9}

// => IClock is the seam: one method, two implementations.
// => Handlers depend on the seam, so tests swap it freely (co-06, co-09).
interface IClock // => the clock contract
{ // => contract block opens
    int Hour(); // => the current hour, however defined
} // => contract ends here

// => WallClock reads the real hour: production truth, test pain.
sealed class WallClock : IClock // => the real implementation
{ // => wall block opens
    public int Hour() => DateTime.UtcNow.Hour; // => varies by run: never pinned
} // => wall ends here

// => FixedClock always says nine: the test double that pins time.
// => Deterministic by construction: the suite can assert on it.
sealed class FixedClock : IClock // => the fake implementation
{ // => fixed block opens
    public int Hour() => 9; // => always nine, every run
} // => fixed ends here
