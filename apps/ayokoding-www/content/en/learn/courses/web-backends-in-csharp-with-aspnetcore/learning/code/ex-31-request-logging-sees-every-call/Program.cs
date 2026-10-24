// Example 31: Request Logging Sees Every Call.
// Structured logs record one line per request — method, path, and status —
// as machine-readable facts, not prose. This example captures the log
// lines in-process with a fixed sink and prints the two lines two requests
// produced, proving the middleware saw both.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires logging middleware plus two routes into one service.
// => The middleware logs after next: method, path, and status (co-02, co-13).
// => The sink is returned so the transcript below can print it.
static (WebApplication app, MemorySink sink) BuildApp(string[] args) // => wiring plus the log capture
{ // => builder block opens
    var sink = new MemorySink(); // => the fixed destination for this run
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => only our sink receives lines
    builder.Logging.AddProvider(sink); // => the capture point for every line
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.Use(
        async (context, next) => // => the logging middleware (co-02)
        { // => middleware block opens
            await next(context); // => let the handler answer first
            var logger = context
                .RequestServices.GetRequiredService<ILoggerFactory>() // => the factory serves loggers
                .CreateLogger("requests"); // => one category for request lines
            logger.LogInformation(
                "{Method} {Path} -> {Status}", // => fixed template, fixed values (co-13)
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode
            ); // => the three facts
        }
    ); // => middleware ends here
    app.MapGet("/a", () => Results.Ok(new { at = "a" })); // => the first logged route (co-01)
    app.MapGet("/b", () => Results.Ok(new { at = "b" })); // => the second logged route (co-01)
    return (app, sink); // => hand both back to the caller
} // => builder ends here

// => Top-level entry: build once, check twice, print the log, stop.
var (app, sink) = BuildApp(args); // => wiring plus capture, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
using var first = await client.GetAsync("/a"); // => the first logged request
using var second = await client.GetAsync("/b"); // => the second logged request
foreach (var line in sink.Lines.Order()) // => sort so the transcript is stable
    Console.WriteLine($"log {line}"); // => one fixed line per request, see below

// => Output line 1: log GET /a -> 200
// => Output line 2: log GET /b -> 200
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => MemorySink keeps every log line in a fixed list: no files, no time.
// => A custom provider proves logging without any nondeterminism (co-13).
// => The list doubles as the transcript this example prints.
sealed class MemorySink : ILoggerProvider // => the fixed log destination
{ // => sink block opens
    public List<string> Lines { get; } = []; // => one entry per request line

    public ILogger CreateLogger(string name) => new Writer(this, name); // => the category travels along

    public void Dispose() { } // => nothing to release

    // => Writer formats one request line per scope the middleware opens.
    // => Message plus scope only: no timestamp ever reaches the list (co-13).
    sealed class Writer(MemorySink sink, string category) : ILogger // => the per-category writer
    { // => writer block opens
        public IDisposable? BeginScope<TState>(TState state)
            where TState : notnull => null; // => scopes unused here

        public bool IsEnabled(LogLevel level) => true; // => every level is welcome

        public void Log<TState>(
            LogLevel level,
            EventId id,
            TState state, // => the one log entry point
            Exception? error,
            Func<TState, Exception?, string> format
        ) // => format renders the message
        { // => log block opens
            if (category != "requests") // => framework chatter never reaches the list
                return; // => only our middleware's lines count
            lock (sink.Lines) // => requests may log from many threads
                sink.Lines.Add(format(state, error)); // => the fixed line, nothing else
        } // => log ends here
    } // => writer ends here
} // => sink ends here
