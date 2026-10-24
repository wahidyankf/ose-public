// Kata 7 solution: one envelope for every failure.
// The Fail helper wraps each failure in the same shape: code plus error
// plus hint. Compare with before/: the routes are identical, only the
// failure answers changed, and clients parse one shape now.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => Fail is the one envelope every failure in this kata wears.
static IResult Fail(int status, string error, string hint) // => status plus two fixed strings
{ // => helper block opens
    var body = new
    {
        code = status,
        error,
        hint,
    }; // => the shared envelope
    return status switch // => the status picks the Results helper
    { // => switch block opens
        404 => Results.NotFound(body), // => absence wears the envelope too
        _ => Results.BadRequest(body), // => every other fault defaults here
    }; // => switch ends here
} // => helper ends here

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/books/{id:int}",
        (int id) => // => the lookup route
            id == 1
                ? Results.Ok(new { id, title = "dune" })
                : Fail(404, "book-not-found", "check the id and retry")
    );
    app.MapPost("/books", () => Fail(400, "title-is-required", "send a JSON body with a title")); // => the bad body
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the code with the body.
static async Task CheckAsync(HttpClient client, string method, string target) // => method plus path
{ // => check block opens
    using var request = new HttpRequestMessage(new HttpMethod(method), target); // => no bodies in this kata
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"{method} {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, fail twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client for the whole suite
await CheckAsync(client, "GET", "/books/99"); // => Output: GET /books/99 -> 404 {"code":404,"error":"book-not-found","hint":"check the id and retry"}
await CheckAsync(client, "POST", "/books"); // => Output: POST /books -> 400 {"code":400,"error":"title-is-required","hint":"send a JSON body with a title"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
