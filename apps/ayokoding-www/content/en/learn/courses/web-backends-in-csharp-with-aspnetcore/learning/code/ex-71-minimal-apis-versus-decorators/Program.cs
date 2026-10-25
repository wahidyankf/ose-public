// Example 71: Minimal APIs Versus Decorators.
// FastAPI maps routes with decorators over functions; ASP.NET Core maps
// them with builder calls over lambdas. Same contract — method plus path
// picks a handler — different spelling. This example registers the FastAPI
// shape (GET /items, POST /items) in minimal-API spelling in-process and
// prints the answers plus the FastAPI lines they mirror.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => MapGet and MapPost are the minimal-API spelling of decorators (co-16).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/items", () => Results.Ok(new { mode = "list" })); // => mirrors @app.get("/items") (co-01, co-16)
    app.MapPost("/items", () => Results.Created("/items/1", new { id = 1 })); // => mirrors @app.post (co-04, co-16)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the code with the body.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Nothing here dials a port: there is no network call at all.
static async Task CheckAsync(HttpClient client, string method, string target) // => method and path name the request
{ // => check block opens
    using var request = new HttpRequestMessage(new HttpMethod(method), target); // => no bodies in this example
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"{method} {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, check twice, name the mirror, stop.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "GET", "/items"); // => Output: GET /items -> 200 {"mode":"list"}
await CheckAsync(client, "POST", "/items"); // => Output: POST /items -> 201 {"id":1}
Console.WriteLine("fastapi: @app.get(\"/items\") and @app.post(\"/items\")"); // => Output: fastapi: @app.get("/items") and @app.post("/items")
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
