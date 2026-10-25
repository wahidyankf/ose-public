// Example 19: JSON Keys Follow a Contract.
// Clients break when key names drift, so the service fixes its casing and
// naming once: camelCase keys from PascalCase records. This example serves
// one contract both exactly and loosely, and prints how the Accept header
// picks the detailed or the summary shape.
using System.Text.Json; // => camelCase policy shapes the contract (co-04)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The Accept header picks the shape: verbose JSON or a short summary (co-12).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    var policy = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }; // => one casing rule
    app.MapGet(
        "/book",
        (HttpRequest request) => // => raw request: read the Accept header (co-12)
        { // => handler block opens
            var book = new Book("Dune", "Frank Herbert", 1965); // => PascalCase record, fixed data
            if (request.Headers.Accept.ToString().Contains("text/csv")) // => the client asked for summary text
                return Results.Text($"{book.Title},{book.Year}"); // => one line: title plus year (co-04)
            return Results.Json(book, policy); // => camelCase JSON: the exact contract (co-04)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request with an Accept header and prints it.
// => TestServer keeps the whole exchange inside this process (co-09).
// => The fixed header values keep every rerun byte-identical.
static async Task CheckAsync(HttpClient client, string accept) // => the shape the client asks for
{ // => check block opens
    using var request = new HttpRequestMessage(HttpMethod.Get, "/book"); // => target never changes here
    request.Headers.Add("Accept", accept); // => negotiation rides on this header (co-12)
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    var media = response.Content.Headers.ContentType?.MediaType ?? "(none)"; // => the shape actually served
    Console.WriteLine(
        $"GET /book [{accept}] -> {(int)response.StatusCode} {media} {body}".TrimEnd()
    ); // => golden line
} // => check ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "application/json"); // => Output: GET /book [application/json] -> 200 application/json {"title":"Dune","author":"Frank Herbert","year":1965}
await CheckAsync(client, "text/csv"); // => Output: GET /book [text/csv] -> 200 text/plain Dune,1965
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Book is the PascalCase source of the contract: casing fixed in one place.
// => The serializer policy turns Title into title for every response (co-15).
// => One policy object means the contract cannot drift per handler.
record Book(string Title, string Author, int Year); // => the domain shape, camelCased on the wire
