// Example 21: Headers Shape Caching.
// Cache headers tell the client how long an answer stays fresh: max-age
// for shared freshness and ETag for conditional revalidation. This example
// serves one versioned fact in-process and prints the headers each answer
// carried, then the 304 the matching ETag earned.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The ETag is a fixed version string: no hashing, no drift (co-04).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/fact",
        (HttpRequest request) => // => raw request: conditional headers live here (co-03)
        { // => handler block opens
            const string etag = "\"v3\""; // => the fixed version of this fact
            if (request.Headers.IfNoneMatch.ToString() == etag) // => client already holds v3
                return Results.StatusCode(304); // => 304: nothing new to send (co-04)
            ResponseCache(etag); // => stamp freshness on the way out
            return Results.Ok(new { fact = "honey never spoils" }); // => the versioned fact (co-04)

            // => ResponseCache writes both caching headers in one place.
            // => A local function keeps the handler body honest (co-01).
            void ResponseCache(string tag) // => the tag to stamp outward
            { // => stamp block opens
                request.HttpContext.Response.Headers.CacheControl = "public, max-age=60"; // => fresh for one minute
                request.HttpContext.Response.Headers.ETag = tag; // => revalidate against this version
            } // => stamp ends here
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request with an optional ETag and prints out.
// => Only fixed header values travel: no dates, no server stamps.
// => The transcript proves caching without printing a single timestamp.
static async Task CheckAsync(HttpClient client, string? etag) // => null means a first-time visit
{ // => check block opens
    using var request = new HttpRequestMessage(HttpMethod.Get, "/fact"); // => target never changes here
    if (etag is not null) // => the second visit revalidates
        request.Headers.TryAddWithoutValidation("If-None-Match", etag); // => the version we already hold
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    var cache = response.Headers.CacheControl?.ToString() ?? "(none)"; // => freshness, fixed string
    var tag = response.Headers.ETag?.Tag ?? "(none)"; // => version stamp, fixed string
    Console.WriteLine(
        $"GET /fact [{etag ?? "(none)"}] -> {(int)response.StatusCode} cache={cache} etag={tag} {body}".TrimEnd()
    ); // => golden line
} // => check ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, null); // => Output: GET /fact [(none)] -> 200 cache=public, max-age=60 etag="v3" {"fact":"honey never spoils"}
await CheckAsync(client, "\"v3\""); // => Output: GET /fact ["v3"] -> 304 cache=(none) etag=(none)
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
