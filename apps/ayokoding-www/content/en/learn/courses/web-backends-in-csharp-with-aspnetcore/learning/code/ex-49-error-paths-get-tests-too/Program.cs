// Example 49: Error Paths Get Tests Too.
// Happy paths are half the contract: validation failures, missing rows,
// and wrong methods need pinned tests as well. This example drives one
// bad body, one missing row, and one wrong method in-process and prints
// the three failures the suite locks in.
using System.Text; // => StringContent carries the JSON body (co-03)
using System.Text.Json; // => JsonSerializer writes the request body (co-15)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Every route can fail: empty title, unknown id, wrong verb (co-05, co-09).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    var store = new Dictionary<int, string> { [1] = "dune" }; // => one seeded row to miss against
    app.MapPost(
        "/books",
        (Book book) => // => the validated create (co-03, co-10)
            string.IsNullOrWhiteSpace(book.title) // => the failure rule
                ? Results.BadRequest(new { error = "title-is-required" }) // => 400: bad body (co-05)
                : Results.Created("/books/2", book)
    ); // => 201: never reached here
    app.MapGet(
        "/books/{id:int}",
        (int id) => // => the lookup (co-03, co-15)
            store.TryGetValue(id, out var title) // => present or not
                ? Results.Ok(new { id, title }) // => present: echo it (co-04)
                : Results.NotFound(new { error = "book-not-found" })
    ); // => 404: missing row (co-05)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request with an optional body and prints it.
// => TestServer keeps the whole exchange inside this process (co-09).
// => The fixed inputs keep every rerun byte-identical.
static async Task CheckAsync(HttpClient client, string method, string target, string? json = null) // => body optional
{ // => check block opens
    using var request = new HttpRequestMessage(new HttpMethod(method), target); // => method plus path first
    if (json is not null) // => only the bad-body check carries one
        request.Content = new StringContent(json, Encoding.UTF8, "application/json"); // => the labeled body (co-03)
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var text = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"{method} {target} -> {(int)response.StatusCode} {text}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, fail three ways, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client for the whole suite
await CheckAsync(client, "POST", "/books", JsonSerializer.Serialize(new Book(""))); // => Output: POST /books -> 400 {"error":"title-is-required"}
await CheckAsync(client, "GET", "/books/99"); // => Output: GET /books/99 -> 404 {"error":"book-not-found"}
await CheckAsync(client, "DELETE", "/books/1"); // => Output: DELETE /books/1 -> 405
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Book is the posted shape: one title, lowercase exact bytes.
record Book(string title); // => the JSON body shape (co-15)
