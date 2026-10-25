// Example 4: Method and Path Pick the Handler.
// The same path can serve different methods, and the same method can serve
// many paths: the pair chooses the handler. This example registers GET and
// POST on one path plus a second GET path, serves four requests in-process,
// and prints which handler each pair reached.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Two methods share one path; the method breaks the tie (co-01).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/orders", () => Results.Ok(new { mode = "list" })); // => GET reads the collection (co-01)
    app.MapPost("/orders", () => Results.Ok(new { mode = "create" })); // => POST writes one row (co-01)
    app.MapGet("/orders/{id}", (int id) => Results.Ok(new { mode = "one", id })); // => GET reads one row (co-03)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints which handler answered.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Nothing here dials a port: there is no network call at all.
static async Task CheckAsync(HttpClient client, string method, string target) // => method and path name the request
{ // => check block opens
    using var request = new HttpRequestMessage(new HttpMethod(method), target); // => no body: GET carries none
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    var line = $"{method} {target} -> {(int)response.StatusCode} {body}"; // => status plus body in one line
    Console.WriteLine(line.TrimEnd()); // => TrimEnd keeps empty bodies clean (co-04)
} // => check ends here

// => Top-level entry: build once, check four times, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "GET", "/orders"); // => Output: GET /orders -> 200 {"mode":"list"}
await CheckAsync(client, "POST", "/orders"); // => Output: POST /orders -> 200 {"mode":"create"}
await CheckAsync(client, "GET", "/orders/7"); // => Output: GET /orders/7 -> 200 {"mode":"one","id":7}
await CheckAsync(client, "DELETE", "/orders"); // => Output: DELETE /orders -> 405
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
