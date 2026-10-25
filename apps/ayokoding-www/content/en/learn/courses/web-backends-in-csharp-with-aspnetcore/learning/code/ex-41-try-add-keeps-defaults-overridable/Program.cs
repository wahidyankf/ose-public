// Example 41: Try Add Keeps Defaults Overridable.
// Libraries register defaults with TryAdd: first registration wins, so the
// application overrides without fighting. This example registers a sender
// twice in-process and prints which one survived, proving the default lost
// to the override exactly once.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => TryAdd keeps the first registration (co-06)
using Microsoft.Extensions.DependencyInjection.Extensions; // => TryAdd lives in this namespace (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => The library default registers first; the app override must not (co-06).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<ISender, LibrarySender>(); // => the library default, first (co-06)
    builder.Services.TryAddSingleton<ISender, AppSender>(); // => skipped: one already exists (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/send",
        (ISender sender) => // => whichever registration won (co-06)
            Results.Ok(new { sent = sender.Send() })
    ); // => the surviving sender speaks (co-04)
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, check once, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
using var response = await client.GetAsync("/send"); // => the one sender request
var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
Console.WriteLine($"GET /send -> {(int)response.StatusCode} {body}".TrimEnd()); // => Output: GET /send -> 200 {"sent":"library"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => ISender is the one contract with a default and an override.
// => First registration wins under TryAdd: the override never lands (co-06).
interface ISender // => the sending contract
{ // => contract block opens
    string Send(); // => one fixed word per sender
} // => contract ends here

// => LibrarySender is the default: registered first, so it serves.
sealed class LibrarySender : ISender // => the library default
{ // => library block opens
    public string Send() => "library"; // => the default word
} // => library ends here

// => AppSender is the override that never lands: TryAdd skips it.
// => Swap the two registrations and this word would win instead.
sealed class AppSender : ISender // => the skipped override
{ // => app block opens
    public string Send() => "app"; // => the word that never prints
} // => app ends here
