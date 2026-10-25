// Example 35: Singleton Holds Shared State.
// A singleton is built once and shared by every request, so it owns the
// service's memory: counters, caches, registries. This example counts
// visits with one singleton hit counter, serves two requests in-process,
// and prints the running total each visit observed.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddSingleton registers the service (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => AddSingleton builds the counter once for the whole process (co-06).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<HitCounter>(); // => one counter shared by all requests (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/visit",
        (HitCounter counter) => // => the shared counter arrives by type (co-06)
            Results.Ok(new { visit = counter.Next() })
    ); // => the running total, echoed (co-04)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the visit number observed.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Sequential checks keep the totals 1 then 2: deterministic by order.
static async Task CheckAsync(HttpClient client, string target) // => the path names the request
{ // => check block opens
    using var response = await client.GetAsync(target); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line (co-04)
} // => check ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "/visit"); // => Output: GET /visit -> 200 {"visit":1}
await CheckAsync(client, "/visit"); // => Output: GET /visit -> 200 {"visit":2}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => HitCounter is the shared state: one instance, many requests.
// => Interlocked keeps parallel visits from losing counts (co-07).
// => The handler stays thin: it only reads the next number.
sealed class HitCounter // => the singleton service
{ // => counter block opens
    private int visits; // => the running total, mutated atomically

    public int Next() => Interlocked.Increment(ref visits); // => atomic add-and-read
} // => counter ends here
