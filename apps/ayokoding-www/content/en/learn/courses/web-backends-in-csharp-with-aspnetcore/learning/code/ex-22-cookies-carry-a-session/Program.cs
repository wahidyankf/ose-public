// Example 22: Cookies Carry a Session.
// A cookie stores the session on the client: the login route sets it and
// the profile route reads it back. This example walks both legs in-process
// with manual cookie handling — no container, no magic — and prints the
// Set-Cookie value plus the profile each cookie earned.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Cookies are just headers: one route writes, one route reads (co-04).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapPost(
        "/login",
        (HttpResponse response) => // => response writes the cookie outward (co-04)
        { // => login block opens
            response.Cookies.Append("session", "ada-42"); // => fixed session value, no expiry stamp
            return Results.Ok(new { logged = "ada" }); // => the login receipt (co-04)
        }
    ); // => login ends here
    app.MapGet(
        "/profile",
        (HttpRequest request) => // => request carries the cookie back (co-03)
        { // => profile block opens
            var session = request.Cookies.TryGetValue("session", out var value) // => look for our cookie
                ? value // => present: the session travels back
                : "(none)"; // => absent: the client never logged in
            return Results.Ok(new { session }); // => the observed session, echoed (co-04)
        }
    ); // => profile ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, walk login then profile, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
using var login = await client.PostAsync("/login", null); // => no body: the route needs none
var setCookie = string.Join(";", login.Headers.GetValues("Set-Cookie")); // => the raw cookie line
var session = setCookie.Split(";")[0].Split("=")[1]; // => peel the value off the attributes
var loginBody = await login.Content.ReadAsStringAsync(); // => the login receipt bytes
Console.WriteLine($"POST /login -> {(int)login.StatusCode} {loginBody}".TrimEnd()); // => Output: POST /login -> 200 {"logged":"ada"}
Console.WriteLine($"cookie session={session}"); // => Output: cookie session=ada-42
using var profileRequest = new HttpRequestMessage(HttpMethod.Get, "/profile"); // => second leg carries it back
profileRequest.Headers.Add("Cookie", $"session={session}"); // => manual jar: one header line (co-03)
using var profile = await client.SendAsync(profileRequest); // => full pipeline runs, then answers
var profileBody = await profile.Content.ReadAsStringAsync(); // => the profile bytes
Console.WriteLine($"GET /profile -> {(int)profile.StatusCode} {profileBody}".TrimEnd()); // => Output: GET /profile -> 200 {"session":"ada-42"}
using var bare = await client.GetAsync("/profile"); // => no cookie at all this time
var bareBody = await bare.Content.ReadAsStringAsync(); // => the stranger's answer bytes
Console.WriteLine($"GET /profile -> {(int)bare.StatusCode} {bareBody}".TrimEnd()); // => Output: GET /profile -> 200 {"session":"(none)"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)
