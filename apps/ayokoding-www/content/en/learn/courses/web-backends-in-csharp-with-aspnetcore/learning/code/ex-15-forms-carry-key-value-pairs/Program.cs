// Example 15: Forms Carry Key Value Pairs.
// HTML forms post url-encoded pairs, not JSON, and the handler reads them
// with ReadFormAsync into a typed record. This example posts one login
// form in-process twice — once complete, once missing the password — and
// prints the 200 that passed and the 400 that did not.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => ReadFormAsync parses the pairs; the handler maps them by name (co-03).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapPost(
        "/login",
        async (HttpRequest request) => // => forms arrive as the raw request (co-03)
        { // => handler block opens
            var form = await request.ReadFormAsync(); // => pairs parsed by key name
            var login = new Login(form["username"].ToString(), form["password"].ToString()); // => typed at the edge (co-15)
            if (
                string.IsNullOrWhiteSpace(login.username)
                || string.IsNullOrWhiteSpace(login.password)
            ) // => both required
                return Results.BadRequest(new { error = "username-and-password-required" }); // => 400 names the rule
            return Results.Ok(new { user = login.username }); // => the authenticated name, echoed (co-04)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => PostFormAsync sends one url-encoded form and prints the outcome.
// => TestServer keeps the whole exchange inside this process (co-09).
// => The fixed pairs keep every rerun byte-identical.
static async Task PostFormAsync(HttpClient client, IEnumerable<KeyValuePair<string, string>> pairs) // => the form fields
{ // => post block opens
    using var body = new FormUrlEncodedContent(pairs); // => the form content type, set automatically
    using var response = await client.PostAsync("/login", body); // => full pipeline runs, then answers
    var text = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"POST /login -> {(int)response.StatusCode} {text}".TrimEnd()); // => one golden line (co-04)
} // => post ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await PostFormAsync(client, [new("username", "ada"), new("password", "secret")]); // => Output: POST /login -> 200 {"user":"ada"}
await PostFormAsync(client, [new("username", "ada")]); // => Output: POST /login -> 400 {"error":"username-and-password-required"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Login is the typed boundary of this example: pairs in, record out.
// => Lowercase names serialize unchanged, so fences match the bytes exactly.
record Login(string username, string password); // => the form shape, typed (co-15)
