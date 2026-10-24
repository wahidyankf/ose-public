// Example 11: Validation Attributes Name the Rules.
// Data annotations declare the rules on the record itself, so the handler
// reads them instead of hard-coding each check. This example validates one
// valid and two invalid members in-process and prints which rule each broke.
using System.ComponentModel.DataAnnotations; // => attributes and Validator live here (co-10)
using System.Text; // => StringContent carries the JSON body (co-03)
using System.Text.Json; // => JsonSerializer writes the request body (co-15)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Validator reads the attributes; the handler only maps failures (co-10).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapPost(
        "/members",
        (Member member) => // => body binds into the record (co-03)
        { // => handler block opens
            var failures = new List<ValidationResult>(); // => every broken rule lands here
            var valid = Validator.TryValidateObject(
                member, // => attributes do the checking (co-10)
                new ValidationContext(member),
                failures,
                true
            ); // => true validates every property
            if (!valid) // => at least one rule broke
                return Results.BadRequest(
                    new
                    {
                        error = "invalid-member", // => one envelope for all breaks (co-05)
                        fields = failures.Select(f => f.MemberNames.First()).Order().ToArray(),
                    }
                ); // => sorted field names
            return Results.Created($"/members/{member.id}", member); // => valid input earns a 201 (co-04)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => PostAsync sends one JSON body and prints what the handler did.
// => TestServer keeps the whole exchange inside this process (co-09).
// => The fixed bodies keep every rerun byte-identical.
static async Task PostAsync(HttpClient client, Member member) // => the record to serialize and send
{ // => post block opens
    var json = JsonSerializer.Serialize(member); // => record becomes a JSON string
    using var body = new StringContent(json, Encoding.UTF8, "application/json"); // => body names its type (co-03)
    using var response = await client.PostAsync("/members", body); // => full pipeline runs, then answers
    var text = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"POST /members -> {(int)response.StatusCode} {text}".TrimEnd()); // => one golden line (co-04)
} // => post ends here

// => Top-level entry: build once, check three times, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await PostAsync(client, new Member(1, "ada@example.com", 34)); // => Output: POST /members -> 201 {"id":1,"email":"ada@example.com","age":34}
await PostAsync(client, new Member(2, "not-an-email", 34)); // => Output: POST /members -> 400 {"error":"invalid-member","fields":["email"]}
await PostAsync(client, new Member(3, "grace@example.com", 12)); // => Output: POST /members -> 400 {"error":"invalid-member","fields":["age"]}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Member declares its own rules: email shape plus an age window.
// => Attributes travel with the type, so every handler reuses them (co-10, co-15).
// => Lowercase names serialize unchanged, so fences match the bytes exactly.
record Member( // => the request and response shape
    int id, // => identity, never validated here
    [EmailAddress] string email, // => must look like name@domain (co-10)
    [Range(13, 120)] int age
); // => must sit inside the service window (co-10)
