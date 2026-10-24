module App // => one module owns the whole unit

open System // => String.Join sorts joined output deterministically
open System.Net.Http // => HttpClient drives the service in-process (co-09)
open System.Text // => Encoding names UTF8 for JSON payloads
open System.Threading // => Interlocked and SemaphoreSlim live here (co-07)
open System.Threading.Tasks // => Task.WhenAll fans requests out (co-07)
open Microsoft.AspNetCore.Builder // => WebApplication wires routes to handlers
open Microsoft.AspNetCore.Hosting // => UseTestServer marks the in-memory host
open Microsoft.AspNetCore.Http // => HttpContext carries request and response
open Microsoft.AspNetCore.TestHost // => TestServer serves with no socket (co-09)
open Microsoft.Extensions.DependencyInjection // => AddSingleton registers services (co-06)
open Microsoft.Extensions.Logging // => ClearProviders silences logs (co-13)
open Giraffe // => route, choose, and json live here (co-01)

// => All checks below block on async HTTP with GetAwaiter().GetResult().
// => Main stays synchronous so prints land in request order, and the
// => in-process pipeline answers before the next request leaves.

// => show prints one transcript line with no trailing space.
let show (line: string) = // => every printed line flows through here
    printfn "%s" (line.TrimEnd()) // => TrimEnd keeps empty bodies clean

// => get serves one GET and prints method, path, status, and body.
// => One client drives every check: no per-case construction, no sockets.
let get (client: HttpClient) (path: string) = // => path names the resource
    let resp = client.GetAsync(path).GetAwaiter().GetResult() // => full pipeline runs in-process
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "GET %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line

// => send serves one arbitrary method and prints status with body.
let send (client: HttpClient) (method: string) (path: string) = // => method plus path name the call
    use request = new HttpRequestMessage(HttpMethod(method), path) // => no body on these calls
    use resp = client.SendAsync(request).GetAwaiter().GetResult() // => the pipeline answers in memory
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => empty for HEAD and redirects
    show (sprintf "%s %s -> %d %s" method path (int resp.StatusCode) (body.Trim())) // => one line per call

// => postJson serves one JSON POST and prints status with body.
let postJson (client: HttpClient) (path: string) (payload: string) = // => payload is already JSON text
    use content = new StringContent(payload, Encoding.UTF8, "application/json") // => UTF8 names the charset
    use resp = client.PostAsync(path, content).GetAwaiter().GetResult() // => the handler reads the body
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "POST %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line
// => TourShelf holds the tour's two seeded orders.
type TourShelf() = // => fixed data keeps the tour deterministic (co-06)
    let items = System.Collections.Concurrent.ConcurrentDictionary<int, string>() // => id to item
    do items.TryAdd(1, "book") |> ignore // => first seeded order
    do items.TryAdd(2, "pen") |> ignore // => second seeded order

    member _.List() = // => the listing reads sorted
        items
        |> Seq.map (fun kv -> {| id = kv.Key; item = kv.Value |})
        |> Seq.sortBy (fun o -> o.id)
        |> Seq.toArray

// => NewTourOrder is the typed shape of the created order.
[<CLIMutable>] // => one validated field
type NewTourOrder = { item: string } // => empty items fail validation
// => webApp tours the whole course in five routes.
// => The Location on create points at the fetch: write and read agree.
// => Health beside content proves the stack, not just the probe.
let webApp: HttpHandler = // => list, validated create, typed fetch, health, miss (co-01, co-04, co-09, co-10, co-14, co-15)
    choose
        [
          // => The tour list renders both seeds sorted: fixed data, fixed order.
          // => Sorting before rendering keeps the transcript byte-stable.
          GET
          >=> route "/orders"
          >=> fun next ctx ->
              task {
                  let shelf = ctx.GetService<TourShelf>() // => the seeded shelf serves
                  return! json (shelf.List()) next ctx // => both seeds render sorted
              }
          POST
          >=> route "/orders"
          >=> fun next ctx ->
              task {
                  let! order = ctx.BindJsonAsync<NewTourOrder>() // => the candidate binds typed

                  if System.String.IsNullOrEmpty(order.item) then // => validated before creating
                      return! (setStatusCode 400 >=> json {| error = "item-required" |}) next ctx
                  else // => clean orders point at their address
                      return!
                          (setStatusCode 201
                           >=> setHttpHeader "Location" "/orders/3"
                           >=> json {| id = 3; item = order.item |})
                              next
                              ctx
              }
          // => The typed fetch proves captures plus lookup in one branch.
          // => Seeded ids serve; the rest name their miss with an envelope.
          GET
          >=> routef "/orders/%i" (fun id -> // => typed fetch with a named miss
              fun next ctx ->
                  task {
                      if id = 1 || id = 2 then // => the seeded ids serve
                          return!
                              json
                                  {| id = id
                                     item = (if id = 1 then "book" else "pen") |}
                                  next
                                  ctx
                      else // => unknown ids name their miss
                          return! (setStatusCode 404 >=> json {| error = "order-not-found" |}) next ctx
                  })
          GET >=> route "/healthz" >=> json {| status = "ok" |} // => readiness answers beside content
          setStatusCode 404 >=> json {| error = "not-found" |} ] // => the designed miss closes the tour
// => buildApp wires the service every check in this unit exercises.
let buildApp (args: string[]) = // => args carry no flags in this course
    let builder = WebApplication.CreateBuilder(args) // => defaults plus our overrides
    // => Silenced logs keep stdout to printed lines only: golden transcripts
    // => must never contain framework chatter.
    builder.Logging.ClearProviders() |> ignore // => no log lines: only our prints appear
    // => Giraffe's JSON serializer lives in DI: without AddGiraffe the first
    // => json answer throws MissingDependencyException at runtime.
    builder.Services.AddGiraffe() |> ignore // => Giraffe needs its serializer in DI
    builder.Services.AddSingleton<TourShelf>() |> ignore // => one shelf for the tour
    builder.WebHost.UseTestServer() |> ignore // => in-memory server: no socket, no port
    let app = builder.Build() // => the pipeline with routing and endpoints
    app.UseGiraffe(webApp) |> ignore // => every request flows through webApp
    app // => hand the wired service back to the caller
// => Top-level entry: build once, check, stop cleanly.
[<EntryPoint>] // => the harness runs the compiled assembly
let main args = // => every unit answers zero on success
    let app = buildApp args // => wiring separate from traffic, as always
    // => StartAsync boots the in-memory host: no socket binds, no port opens,
    // => yet every middleware and route runs exactly as in production.
    app.StartAsync().GetAwaiter().GetResult() // => TestServer starts without any socket
    use client = app.GetTestClient() // => client talks to memory, not the network
    get client "/orders" // => the seeded list renders sorted

    use tour =
        new StringContent("""{"item":"ruler"}""", Encoding.UTF8, "application/json") // => a clean tour order

    use made = client.PostAsync("/orders", tour).GetAwaiter().GetResult() // => creation answers 201
    let madeBody = made.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => exact bytes back
    show (sprintf "POST /orders -> %d loc=%s %s" (int made.StatusCode) (string made.Headers.Location) (madeBody.Trim())) // => one line
    get client "/orders/1" // => the known id serves its order
    get client "/healthz" // => readiness answers beside content
    get client "/orders/7" // => the unknown id names its miss
    // => StopAsync drains in-flight requests before releasing the host, so the
    // => checks above always land before the process exits.
    app.StopAsync().GetAwaiter().GetResult() // => stop cleanly: nothing in flight is cut (co-08)
    0 // => zero exit means the transcript matched
