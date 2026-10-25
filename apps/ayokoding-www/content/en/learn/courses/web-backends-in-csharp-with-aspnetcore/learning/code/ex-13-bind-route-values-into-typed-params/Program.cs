// Example 13: Bind Route Values into Typed Params.
// A route segment can bind straight into an int, a guid, or any parsable
// type: a mismatch never reaches the handler. This example registers an
// int and a guid route, serves three requests in-process, and prints the
// typed values plus the 404 a bad segment earns.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Typed segments parse before the handler runs; failures fall to 404 (co-03).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/tickets/{id:int}",
        (int id) => // => digits only: the type is the guard (co-03, co-15)
            Results.Ok(new { ticket = id })
    ); // => the parsed integer, echoed (co-04)
    app.MapGet(
        "/refs/{key:guid}",
        (Guid key) => // => guid shape enforced by routing (co-03, co-15)
            Results.Ok(new { reference = key })
    ); // => the parsed guid, echoed (co-04)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the typed value observed.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Nothing here dials a port: there is no network call at all.
static async Task CheckAsync(HttpClient client, string target) // => the path names the request
{ // => check block opens
    using var response = await client.GetAsync(target); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line (co-04)
} // => check ends here

// => Top-level entry: build once, check three times, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "/tickets/42"); // => Output: GET /tickets/42 -> 200 {"ticket":42}
await CheckAsync(client, "/tickets/abc"); // => Output: GET /tickets/abc -> 404
await CheckAsync(client, "/refs/3fa85f64-5717-4562-b3fc-2c963f66afa6"); // => Output: GET /refs/3fa85f64-5717-4562-b3fc-2c963f66afa6 -> 200 {"reference":"3fa85f64-5717-4562-b3fc-2c963f66afa6"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
