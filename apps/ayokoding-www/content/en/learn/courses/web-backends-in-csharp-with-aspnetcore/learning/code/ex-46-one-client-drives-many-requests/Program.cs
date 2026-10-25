// Example 46: One Client Drives Many Requests.
// A single test client walks the whole user journey — create, read, list —
// so one program proves the routes agree with each other. This example
// drives three requests with one client in-process and prints the journey
// the three answers tell.
using System.Text; // => StringContent carries the JSON body (co-03)
using System.Text.Json; // => JsonSerializer writes the request body (co-15)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The store is shared: the journey only works if writes persist (co-09).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    var shelf = new List<string> { "dune" }; // => one seeded title to list
    app.MapGet("/shelf", () => Results.Ok(new { books = shelf.ToArray() })); // => the list leg (co-01)
    app.MapPost(
        "/shelf",
        (Book book) => // => the create leg (co-03)
        { // => create block opens
            shelf.Add(book.title); // => the write later legs observe
            return Results.Created("/shelf", book); // => 201: the journey continues (co-04)
        }
    ); // => create ends here
    app.MapGet("/shelf/count", () => Results.Ok(new { count = shelf.Count })); // => the count leg (co-01)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: one client walks create, count, and list in order.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client for the whole journey
using var firstList = await client.GetAsync("/shelf"); // => leg one: the seeded list
Console.WriteLine(
    $"GET /shelf -> {(int)firstList.StatusCode} {await firstList.Content.ReadAsStringAsync()}".TrimEnd()
); // => Output: GET /shelf -> 200 {"books":["dune"]}
var json = JsonSerializer.Serialize(new Book("hyperion")); // => the book to add
using var body = new StringContent(json, Encoding.UTF8, "application/json"); // => the labeled body (co-03)
using var created = await client.PostAsync("/shelf", body); // => leg two: add one title
Console.WriteLine(
    $"POST /shelf -> {(int)created.StatusCode} {await created.Content.ReadAsStringAsync()}".TrimEnd()
); // => Output: POST /shelf -> 201 {"title":"hyperion"}
using var counted = await client.GetAsync("/shelf/count"); // => leg three: prove it stuck
Console.WriteLine(
    $"GET /shelf/count -> {(int)counted.StatusCode} {await counted.Content.ReadAsStringAsync()}".TrimEnd()
); // => Output: GET /shelf/count -> 200 {"count":2}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Book is the create shape: one title, lowercase exact bytes.
record Book(string title); // => the JSON body shape (co-15)
