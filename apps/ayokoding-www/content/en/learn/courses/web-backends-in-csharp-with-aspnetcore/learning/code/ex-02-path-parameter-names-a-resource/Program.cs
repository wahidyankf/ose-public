// Example 2: Path Parameter Names a Resource.
// A brace segment captures one path part into the handler by name, while
// plain segments match literally. This example registers both shapes side
// by side, serves four requests in-process, and prints the value observed.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The literal route is registered first so it wins over the capture (co-01).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/users/new", () => Results.Ok(new { form = "new" })); // => literal wins over capture (co-01)
    app.MapGet("/users/{id}", (string id) => Results.Ok(new { user = id })); // => brace captures one part (co-03)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints what the handler did.
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
await CheckAsync(client, "GET", "/users/new"); // => Output: GET /users/new -> 200 {"form":"new"}
await CheckAsync(client, "GET", "/users/42"); // => Output: GET /users/42 -> 200 {"user":"42"}
await CheckAsync(client, "GET", "/users/ada"); // => Output: GET /users/ada -> 200 {"user":"ada"}
await CheckAsync(client, "GET", "/teams/42"); // => Output: GET /teams/42 -> 404
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
