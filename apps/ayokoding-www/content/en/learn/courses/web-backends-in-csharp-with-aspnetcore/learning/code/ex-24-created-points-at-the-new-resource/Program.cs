// Example 24: Created Points at the New Resource.
// A successful POST answers 201 with a Location header naming the new
// row, so the client never guesses the URL. This example creates one
// member in-process and prints the status, the location, and the echo the
// follow-up GET at that location returned.
using System.Text; // => StringContent carries the JSON body (co-03)
using System.Text.Json; // => JsonSerializer writes the request body (co-15)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The store is a fixed dictionary: self-contained, no database (co-09).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    var store = new Dictionary<int, string> { [1] = "ada" }; // => one seeded row to read back
    app.MapPost(
        "/members",
        (Member member) => // => body binds into the record (co-03)
        { // => create block opens
            store[member.id] = member.name; // => the write the GET below reads
            return Results.Created($"/members/{member.id}", member); // => 201 plus Location (co-04)
        }
    ); // => create ends here
    app.MapGet(
        "/members/{id:int}",
        (int id) => // => the location the 201 named (co-03)
            store.TryGetValue(id, out var name) // => look the row up by id
                ? Results.Ok(new { id, name }) // => present: echo it back
                : Results.NotFound(new { error = "member-not-found" })
    ); // => absent: say so (co-05)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: create once, follow the Location, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
var json = JsonSerializer.Serialize(new Member(2, "grace")); // => the row to create
using var body = new StringContent(json, Encoding.UTF8, "application/json"); // => the labeled body (co-03)
using var created = await client.PostAsync("/members", body); // => the creating request
var echo = await created.Content.ReadAsStringAsync(); // => the 201 body bytes
var location = created.Headers.Location?.ToString() ?? "(none)"; // => the address the server assigned
Console.WriteLine(
    $"POST /members -> {(int)created.StatusCode} location={location} {echo}".TrimEnd()
); // => Output: POST /members -> 201 location=/members/2 {"id":2,"name":"grace"}
using var fetched = await client.GetAsync(location); // => follow the Location exactly once
var seen = await fetched.Content.ReadAsStringAsync(); // => the follow-up body bytes
Console.WriteLine($"GET {location} -> {(int)fetched.StatusCode} {seen}".TrimEnd()); // => Output: GET /members/2 -> 200 {"id":2,"name":"grace"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Member is the typed boundary of this example: JSON in, record out.
record Member(int id, string name); // => the member shape, lowercase exact bytes (co-15)
