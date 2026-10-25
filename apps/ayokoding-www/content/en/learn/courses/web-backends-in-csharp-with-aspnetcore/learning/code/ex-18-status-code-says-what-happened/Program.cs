// Example 18: Status Code Says What Happened.
// The status code is the headline of every response: 200 reads, 201
// creates, 204 deletes with no body, 400 blames the client. This example
// maps four verbs to four codes in-process and prints the code each earned.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Each Results helper names its code: the code says what happened (co-04).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/items", () => Results.Ok(new { mode = "list" })); // => 200: the read worked (co-04)
    app.MapPost("/items", () => Results.Created("/items/1", new { id = 1 })); // => 201: one row born (co-04)
    app.MapDelete("/items/1", () => Results.NoContent()); // => 204: gone, no body (co-04)
    app.MapGet("/boom", () => Results.BadRequest(new { error = "bad-item" })); // => 400: client fault (co-05)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the code with the body.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Nothing here dials a port: there is no network call at all.
static async Task CheckAsync(HttpClient client, string method, string target) // => method and path name the request
{ // => check block opens
    using var request = new HttpRequestMessage(new HttpMethod(method), target); // => no body anywhere here
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"{method} {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, check four times, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "GET", "/items"); // => Output: GET /items -> 200 {"mode":"list"}
await CheckAsync(client, "POST", "/items"); // => Output: POST /items -> 201 {"id":1}
await CheckAsync(client, "DELETE", "/items/1"); // => Output: DELETE /items/1 -> 204
await CheckAsync(client, "GET", "/boom"); // => Output: GET /boom -> 400 {"error":"bad-item"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
