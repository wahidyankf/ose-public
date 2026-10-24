// Example 43: From Services Injects into Handlers.
// A handler signature mixes HTTP and services: the id binds from the
// route while the repository injects from the container. This example
// looks two members up by id in-process and prints the row each lookup
// returned.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddSingleton registers the repository (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Route values and services share one signature: binding plus (co-06).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<MemberStore>(); // => one store shared by all requests (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/members/{id:int}",
        (int id, MemberStore store) => // => int from route, store injected (co-01, co-06)
            store.Find(id) is { } name // => the lookup: present or not
                ? Results.Ok(new { id, name }) // => present: echo the row (co-04)
                : Results.NotFound(new { error = "member-not-found" })
    ); // => absent: say so (co-05)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the row observed.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Nothing here dials a port: there is no network call at all.
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
await CheckAsync(client, "/members/1"); // => Output: GET /members/1 -> 200 {"id":1,"name":"ada"}
await CheckAsync(client, "/members/9"); // => Output: GET /members/9 -> 404 {"error":"member-not-found"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => MemberStore is the injected repository: fixed rows, lookup by id.
// => Two rows give the present case and the absent case each a check.
sealed class MemberStore // => the singleton repository
{ // => store block opens
    private readonly Dictionary<int, string> rows = new() // => the fixed data, seeded once
    { // => rows block opens
        [1] = "ada", // => the row the first check reads
        [2] = "grace", // => the row no check reads, proving scope
    }; // => rows end here

    public string? Find(int id) => rows.TryGetValue(id, out var name) ? name : null; // => null means absent
} // => store ends here
