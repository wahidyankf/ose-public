// Example 47: Assert Status and Body Together.
// A good test pins both the code and the bytes: the status proves the
// decision, the body proves the content. This example checks one route
// three ways in-process and prints the assertion each check performed.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Two routes give the status check and the body check each a target (co-09).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/book/1", () => Results.Ok(new { id = 1, title = "dune" })); // => the asserted row (co-01)
    app.MapGet("/book/9", () => Results.NotFound(new { error = "book-not-found" })); // => the asserted miss (co-05)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => AssertAsync serves one request and prints the pinned outcome.
// => PASS means status and body both matched the fixed expectation (co-09).
// => The expectation is written out: the test documents itself.
static async Task AssertAsync(HttpClient client, string target, int want, string wantBody) // => path plus expectation
{ // => assert block opens
    using var response = await client.GetAsync(target); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    var verdict = (int)response.StatusCode == want && body == wantBody ? "PASS" : "FAIL"; // => both must match
    Console.WriteLine($"{verdict} GET {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => the pinned line
} // => assert ends here

// => Top-level entry: build once, assert twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await AssertAsync(client, "/book/1", 200, "{\"id\":1,\"title\":\"dune\"}"); // => Output: PASS GET /book/1 -> 200 {"id":1,"title":"dune"}
await AssertAsync(client, "/book/9", 404, "{\"error\":\"book-not-found\"}"); // => Output: PASS GET /book/9 -> 404 {"error":"book-not-found"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
