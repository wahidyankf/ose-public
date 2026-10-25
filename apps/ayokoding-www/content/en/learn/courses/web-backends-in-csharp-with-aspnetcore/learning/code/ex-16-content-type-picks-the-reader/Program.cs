// Example 16: Content Type Picks the Reader.
// The same path can accept JSON or plain text: the Content-Type header
// chooses the reader. This example posts both shapes to one note route
// in-process and prints the stored text each content type produced.
using System.Text; // => StringContent carries each body shape (co-03)
using System.Text.Json; // => JsonSerializer writes the JSON variant (co-15)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The handler branches on Content-Type, then stores plain text (co-12).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapPost(
        "/notes",
        async (HttpRequest request) => // => raw request: we choose the reader (co-12)
        { // => handler block opens
            string text; // => every branch produces plain text
            if (request.ContentType?.StartsWith("application/json") == true) // => JSON branch first
            { // => json block opens
                var note = await request.ReadFromJsonAsync<Note>(); // => framework parses the JSON (co-03)
                text = note?.text ?? ""; // => missing body reads as empty
            } // => json block ends here
            else // => every other content type reads as text
            { // => text block opens
                using var reader = new StreamReader(request.Body); // => raw bytes become characters
                text = await reader.ReadToEndAsync(); // => the whole plain body
            } // => text block ends here
            return Results.Created("/notes/1", new { note = text.Trim() }); // => both shapes land as text (co-04)
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => PostAsync sends one body with its content type and prints the result.
// => TestServer keeps the whole exchange inside this process (co-09).
// => The fixed bodies keep every rerun byte-identical.
static async Task PostAsync(HttpClient client, string body, string mediaType) // => body bytes plus their label
{ // => post block opens
    using var content = new StringContent(body, Encoding.UTF8, mediaType); // => the labeled body (co-12)
    using var response = await client.PostAsync("/notes", content); // => full pipeline runs, then answers
    var text = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"POST /notes [{mediaType}] -> {(int)response.StatusCode} {text}".TrimEnd()); // => one golden line
} // => post ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await PostAsync(client, JsonSerializer.Serialize(new Note("ship it")), "application/json"); // => Output: POST /notes [application/json] -> 201 {"note":"ship it"}
await PostAsync(client, "ship it", "text/plain"); // => Output: POST /notes [text/plain] -> 201 {"note":"ship it"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Note is the JSON shape: one text field, lowercase, exact bytes.
record Note(string text); // => the JSON request shape (co-15)
