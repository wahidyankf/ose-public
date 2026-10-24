// Example 23: File Download Names Itself.
// A download is a body plus a filename: Content-Disposition tells the
// client what to save it as. This example serves one fixed report both as
// JSON and as an attachment in-process and prints the disposition plus the
// bytes each shape delivered.
using System.Text; // => Encoding turns the report into bytes (co-04)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Results.File sets the disposition: attachment names the file (co-04).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/report", () => Results.Ok(new { title = "weekly", rows = 42 })); // => the JSON shape (co-04)
    app.MapGet(
        "/report.csv",
        () => // => the same fact as a file
        { // => file block opens
            var csv = "title,rows\nweekly,42\n"; // => fixed bytes: the whole report
            var bytes = Encoding.UTF8.GetBytes(csv); // => text becomes bytes once
            return Results.File(bytes, "text/csv", "weekly.csv"); // => attachment with a name (co-04)
        }
    ); // => file ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the download details.
// => TestServer keeps the whole exchange inside this process (co-09).
// => The disposition header names the file; the body stays byte-identical.
static async Task CheckAsync(HttpClient client, string target) // => the path names the request
{ // => check block opens
    using var response = await client.GetAsync(target); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    var flat = body.Replace("\n", "\\n"); // => newlines become visible escapes
    var media = response.Content.Headers.ContentType?.MediaType ?? "(none)"; // => the served shape
    var name =
        response.Content.Headers.ContentDisposition?.FileNameStar // => the RFC filename first
        ?? response.Content.Headers.ContentDisposition?.FileName?.Trim('"') // => else the plain filename
        ?? "(inline)"; // => no disposition: shown in place
    Console.WriteLine(
        $"GET {target} -> {(int)response.StatusCode} {media} file={name} {flat}".TrimEnd()
    ); // => golden line
} // => check ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "/report"); // => Output: GET /report -> 200 application/json file=(inline) {"title":"weekly","rows":42}
await CheckAsync(client, "/report.csv"); // => Output: GET /report.csv -> 200 text/csv file=weekly.csv title,rows\nweekly,42\n
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
