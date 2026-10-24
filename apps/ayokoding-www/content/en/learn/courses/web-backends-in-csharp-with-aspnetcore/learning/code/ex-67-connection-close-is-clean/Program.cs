// Example 67: Connection Close Is Clean.
// Every response here closes its own connection: no keep-alive reuse, no
// half-open sockets lingering past the answer. This example serves two
// requests over loopback with explicit close and prints the close marker
// plus the body each answer carried.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)
using Microsoft.Net.Http.Headers; // => HeaderNames names the Connection header (co-04)

// => BuildApp wires the service with every route this example serves.
// => The Connection: close header marks each answer self-contained (co-08).
// => Never a fixed port: the number comes from the bind, not the code.
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseUrls("http://127.0.0.1:0"); // => loopback, OS-chosen port, never fixed
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/bye/{name}",
        (string name, HttpResponse response) => // => the response carries the marker (co-04)
        { // => handler block opens
            response.Headers[HeaderNames.Connection] = "close"; // => this answer closes its socket
            return Results.Ok(new { goodbye = name }); // => the farewell body (co-04)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the close marker found.
// => The handler sets the value; the transcript only names its presence.
static async Task CheckAsync(HttpClient client, string target) // => the path names the request
{ // => check block opens
    using var response = await client.GetAsync(target); // => a real exchange over a real socket
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    var closed = response.Headers.ConnectionClose == true ? "yes" : "no"; // => presence, never timing
    Console.WriteLine(
        $"GET {target} -> {(int)response.StatusCode} close={closed} {body}".TrimEnd()
    ); // => golden line
} // => check ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => Kestrel listens on 127.0.0.1 and an ephemeral port
var port = new Uri(app.Urls.First()).Port; // => the OS-chosen port: used, never printed
using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}") }; // => loopback client
await CheckAsync(client, "/bye/ada"); // => Output: GET /bye/ada -> 200 close=yes {"goodbye":"ada"}
await CheckAsync(client, "/bye/grace"); // => Output: GET /bye/grace -> 200 close=yes {"goodbye":"grace"}
await app.StopAsync(); // => stop cleanly: no in-flight request is cut (co-08)
