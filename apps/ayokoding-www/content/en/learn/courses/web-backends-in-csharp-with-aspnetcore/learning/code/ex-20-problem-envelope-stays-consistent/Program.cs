// Example 20: Problem Envelope Stays Consistent.
// Every failure answers in one shape — code, error, and hint — so clients
// parse errors once instead of per route. This example fails two routes on
// purpose in-process and prints the shared envelope both answers used.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => Fail is the one envelope every error in this example wears.
// => A static helper keeps the shape identical on every route (co-05).
// => Fixed strings only: no trace IDs, no timestamps, no drift.
static IResult Fail(int status, string error, string hint) // => status plus two fixed strings
{ // => helper block opens
    var body = new
    {
        code = status,
        error,
        hint,
    }; // => the shared envelope (co-05)
    return status switch // => the status picks the Results helper
    { // => switch block opens
        404 => Results.NotFound(body), // => absence wears the envelope too
        422 => Results.UnprocessableEntity(body), // => semantic failure, same shape
        _ => Results.BadRequest(body), // => every other fault defaults here
    }; // => switch ends here
} // => helper ends here

// => BuildApp wires the service with every route this example serves.
// => Both routes fail through Fail: one shape, two statuses (co-05).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/books/{id:int}", (int id) => Fail(404, "book-not-found", $"no book has id {id}")); // => missing row (co-05)
    app.MapPost("/books", () => Fail(422, "title-is-required", "send a JSON body with a title")); // => bad content
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the envelope observed.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Nothing here dials a port: there is no network call at all.
static async Task CheckAsync(HttpClient client, string method, string target) // => method and path name the request
{ // => check block opens
    using var request = new HttpRequestMessage(new HttpMethod(method), target); // => no bodies in this example
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"{method} {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "GET", "/books/99"); // => Output: GET /books/99 -> 404 {"code":404,"error":"book-not-found","hint":"no book has id 99"}
await CheckAsync(client, "POST", "/books"); // => Output: POST /books -> 422 {"code":422,"error":"title-is-required","hint":"send a JSON body with a title"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
