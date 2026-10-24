// Example 48: Post Then Get Proves State.
// The strongest test writes through one route and reads through another:
// only shared state passes. This example posts a note, reads it back, and
// lists the store in-process, printing the three legs that prove the write
// survived the round trip.
using System.Text; // => StringContent carries the JSON body (co-03)
using System.Text.Json; // => JsonSerializer writes the request body (co-15)
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The store outlives each request: POST writes, GETs prove (co-09).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    var notes = new Dictionary<int, string>(); // => the shared state under test
    app.MapPost(
        "/notes",
        (Note note) => // => the write leg (co-03)
        { // => write block opens
            notes[note.id] = note.text; // => store the text by id
            return Results.Created($"/notes/{note.id}", note); // => 201 plus Location (co-04)
        }
    ); // => write ends here
    app.MapGet(
        "/notes/{id:int}",
        (int id) => // => the read leg (co-03)
            notes.TryGetValue(id, out var text) // => look the note up
                ? Results.Ok(new { id, text }) // => present: prove it survived
                : Results.NotFound(new { error = "note-not-found" })
    ); // => absent: say so (co-05)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: post once, read twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client for the whole proof
var json = JsonSerializer.Serialize(new Note(1, "ship it")); // => the note to store
using var body = new StringContent(json, Encoding.UTF8, "application/json"); // => the labeled body (co-03)
using var created = await client.PostAsync("/notes", body); // => leg one: write it
Console.WriteLine(
    $"POST /notes -> {(int)created.StatusCode} {await created.Content.ReadAsStringAsync()}".TrimEnd()
); // => Output: POST /notes -> 201 {"id":1,"text":"ship it"}
using var read = await client.GetAsync("/notes/1"); // => leg two: read it back
Console.WriteLine(
    $"GET /notes/1 -> {(int)read.StatusCode} {await read.Content.ReadAsStringAsync()}".TrimEnd()
); // => Output: GET /notes/1 -> 200 {"id":1,"text":"ship it"}
using var missed = await client.GetAsync("/notes/2"); // => leg three: prove absence too
Console.WriteLine(
    $"GET /notes/2 -> {(int)missed.StatusCode} {await missed.Content.ReadAsStringAsync()}".TrimEnd()
); // => Output: GET /notes/2 -> 404 {"error":"note-not-found"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => Note is the stored shape: id plus text, lowercase exact bytes.
record Note(int id, string text); // => the JSON body shape (co-15)
