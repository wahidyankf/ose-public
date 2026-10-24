// Example 40: Keyed Services Pick an Implementation.
// Two implementations of one contract — cash and card — register under
// different keys, and the handler picks by key at request time. This
// example charges both tills in-process and prints the receipt each key
// produced.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers (co-01)
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory (co-09)
using Microsoft.Extensions.DependencyInjection; // => AddKeyedSingleton picks by key (co-06)
using Microsoft.Extensions.Logging; // => ClearProviders silences logs (co-13)

// => BuildApp wires the service with every route this example serves.
// => Each till registers under its own string key (co-06).
// => Returning the app lets each check serve requests in-process (co-09).
static WebApplication BuildApp(string[] args) // => args carry no flags in this course
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddKeyedSingleton<ITill, CashTill>("cash"); // => the cash implementation (co-06)
    builder.Services.AddKeyedSingleton<ITill, CardTill>("card"); // => the card implementation (co-06)
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/pay/{method}",
        (
            string method,
            [FromKeyedServices("cash")] ITill cash, // => cash by key
            [FromKeyedServices("card")] ITill card
        ) => // => card by key
        { // => pay block opens
            var till = method == "cash" ? cash : card; // => the request picks the till
            return Results.Ok(new { method, receipt = till.Receipt(5000) }); // => the fixed receipt (co-04)
        }
    ); // => pay ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the receipt observed.
// => TestServer keeps the whole exchange inside this process (co-09).
// => Nothing here dials a port: there is no network call at all.
static async Task CheckAsync(HttpClient client, string target) // => the path names the request
{ // => check block opens
    using var response = await client.GetAsync(target); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line (co-04)
} // => check ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, "/pay/cash"); // => Output: GET /pay/cash -> 200 {"method":"cash","receipt":"CASH-5000"}
await CheckAsync(client, "/pay/card"); // => Output: GET /pay/card -> 200 {"method":"card","receipt":"CARD-5000"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut (co-08)

// => ITill is the one contract with two keyed implementations.
// => Keys choose the implementation; the handler never news one up (co-06).
interface ITill // => the payment contract
{ // => contract block opens
    string Receipt(int amount); // => one fixed receipt per amount
} // => contract ends here

// => CashTill stamps cash receipts: the "cash" key resolves here.
sealed class CashTill : ITill // => the cash implementation
{ // => cash block opens
    public string Receipt(int amount) => $"CASH-{amount}"; // => the cash stamp
} // => cash ends here

// => CardTill stamps card receipts: the "card" key resolves here.
sealed class CardTill : ITill // => the card implementation
{ // => card block opens
    public string Receipt(int amount) => $"CARD-{amount}"; // => the card stamp
} // => card ends here
