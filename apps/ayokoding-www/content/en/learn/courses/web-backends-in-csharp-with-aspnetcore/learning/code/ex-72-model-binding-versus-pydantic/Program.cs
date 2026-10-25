// Example 72: Model Binding Versus Pydantic.
// Pydantic models validate by construction; C# records plus validation
// attributes do the same job at the boundary. This example binds a member
// through attributes in-process, rejects the bad email, and prints the 201
// plus the 400 — the same pair a BaseModel would produce.
using System.ComponentModel.DataAnnotations; // => attributes declare the rules (co-10)
using System.Text; // => StringContent carries the JSON body (co-03)
using System.Text.Json; // => JsonSerializer writes the request body (co-15)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Attributes on the record replace the Pydantic model field rules (co-16).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapPost(
        "/members",
        (Member member) => // => body binds into the record (co-03, co-15)
        { // => handler block opens
            var failures = new List<ValidationResult>(); // => every broken rule lands here
            var valid = Validator.TryValidateObject(
                member, // => attributes do the checking (co-10)
                new ValidationContext(member),
                failures,
                true
            ); // => true validates every property
            if (!valid) // => at least one rule broke
                return Results.BadRequest(new { error = "invalid-member" }); // => 400: like a 422 in FastAPI (co-05)
            return Results.Created($"/members/{member.id}", member); // => clean members earn a 201 (co-04)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => PostAsync sends one JSON body and prints what the boundary decided.
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

// => Top-level entry: build once, check twice, name the mirror, stop.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await PostAsync(client, new Member(1, "ada@example.com")); // => Output: POST /members -> 201 {"id":1,"email":"ada@example.com"}
await PostAsync(client, new Member(2, "not-an-email")); // => Output: POST /members -> 400 {"error":"invalid-member"}
Console.WriteLine("fastapi: class Member(BaseModel) with EmailStr"); // => Output: fastapi: class Member(BaseModel) with EmailStr
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Member declares its own shape: EmailAddress plays the EmailStr role.
// => One attribute, one rule, enforced before the handler runs (co-10, co-15).
record Member(int id, [EmailAddress] string email); // => the request and response shape
