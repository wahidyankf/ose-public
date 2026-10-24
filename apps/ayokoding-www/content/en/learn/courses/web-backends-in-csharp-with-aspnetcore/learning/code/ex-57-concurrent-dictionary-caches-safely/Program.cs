// Example 57: Concurrent Dictionary Caches Safely.
// A cache fills once per key even when ten requests race for it: the
// dictionary's atomic factory runs a single time per missing key. This
// example races five parallel reads for one cold key in-process and prints
// the build count that proves the value was computed exactly once.
using System.Collections.Concurrent; // => ConcurrentDictionary is the safe cache (co-07)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddSingleton shares the cache (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The cache is a singleton: every request races on the same keys (co-06).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<FactCache>(); // => one cache for the whole service (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/fact/{key}",
        (string key, FactCache cache) => // => the key names the cached fact (co-03)
            Results.Ok(new { key, fact = cache.Get(key) })
    ); // => computed once, read always (co-04)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: race five reads, print builds and answers.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client, five parallel calls
var tasks = Enumerable.Range(0, 5).Select(_ => client.GetStringAsync("/fact/honey")).ToArray(); // => one cold key
var bodies = await Task.WhenAll(tasks); // => all five race concurrently (co-07)
var same = bodies.Distinct().Count() == 1 ? "yes" : "no"; // => every race must read alike
Console.WriteLine($"parallel=5 builds={FactCache.Builds} same={same}"); // => Output: parallel=5 builds=1 same=yes
Console.WriteLine($"sample={bodies[0]}"); // => Output: sample={"key":"honey","fact":"fact-for-honey"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => FactCache computes each key once, no matter how many racers arrive.
// => Lazy inside GetOrAdd runs the factory exactly once per key (co-07).
// => A bare factory could run several times: only one value would win.
sealed class FactCache // => the singleton cache
{ // => cache block opens
    private readonly ConcurrentDictionary<string, Lazy<string>> facts = new(); // => the safe store
    private static int builds; // => factory calls observed, atomic

    public static int Builds => builds; // => the transcript reads the count here

    public string Get(string key) =>
        facts
            .GetOrAdd(
                key,
                k => new Lazy<string>(() => // => one lazy per key
                { // => factory block opens
                    Interlocked.Increment(ref builds); // => observe this single build
                    return $"fact-for-{k}"; // => the deterministic fact
                })
            )
            .Value; // => first reader builds, the rest wait and share
} // => cache ends here
