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
// => MiniOrder is the review service's typed order (co-15).
[<CLIMutable>] // => the record binds and renders
type MiniOrder =
    { id: int // => server-assigned on creation
      item: string // => client-supplied, validated
      qty: int } // => client-supplied, positive only

// => The review service keeps two fixed orders in memory.
let miniCatalog = // => fixed data keeps the review deterministic
    Map.ofList
        [ (1, { id = 1; item = "book"; qty = 2 })
          (2, { id = 2; item = "pen"; qty = 5 }) ]
// => webApp reviews the level: list, validated create, fetch, miss.
// => New pieces are deliberately absent: a review rearranges, never teaches.
// => Each branch below maps to one cluster the level already covered.
let webApp: HttpHandler = // => every beginner skill appears once (co-01 to co-05, co-10, co-15)
    choose
        [
          // => The list sorts by id before rendering: map order never leaks.
          // => Deterministic transcripts need one order that never changes.
          GET
          >=> route "/orders"
          >=> json (miniCatalog.Values |> Seq.sortBy (fun o -> o.id) |> Seq.toArray)
          POST
          >=> route "/orders"
          >=> fun next ctx ->
              task {
                  let! order = ctx.BindJsonAsync<MiniOrder>() // => typed bind (co-03, co-15)

                  if System.String.IsNullOrEmpty(order.item) || order.qty <= 0 then // => validated create (co-10)
                      return! (setStatusCode 400 >=> json {| error = "bad-order" |}) next ctx
                  else // => the review accepts only clean orders
                      return!
                          (setStatusCode 201
                           >=> setHttpHeader "Location" "/orders/3"
                           >=> json
                                   {| id = 3
                                      item = order.item
                                      qty = order.qty |})
                              next
                              ctx
              }
          GET
          >=> routef "/orders/%i" (fun id -> // => typed fetch (co-01)
              fun next ctx ->
                  task {
                      match Map.tryFind id miniCatalog with // => lookup, not exception (co-05)
                      | Some order -> return! json order next ctx
                      | None -> return! (setStatusCode 404 >=> json {| error = "order-not-found" |}) next ctx
                  })
          setStatusCode 404 >=> json {| error = "not-found" |} ] // => designed miss (co-04)
// => buildApp wires the service every check in this unit exercises.
let buildApp (args: string[]) = // => args carry no flags in this course
    let builder = WebApplication.CreateBuilder(args) // => defaults plus our overrides
    // => Silenced logs keep stdout to printed lines only: golden transcripts
    // => must never contain framework chatter.
    builder.Logging.ClearProviders() |> ignore // => no log lines: only our prints appear
    // => Giraffe's JSON serializer lives in DI: without AddGiraffe the first
    // => json answer throws MissingDependencyException at runtime.
    builder.Services.AddGiraffe() |> ignore // => Giraffe needs its serializer in DI
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
    get client "/orders" // => the fixed list, id-sorted

    use fresh =
        new StringContent("""{"id":0,"item":"ruler","qty":1}""", Encoding.UTF8, "application/json") // => a clean order

    use made = client.PostAsync("/orders", fresh).GetAwaiter().GetResult() // => creation answers 201
    let madeBody = made.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => exact bytes back
    show (sprintf "POST /orders -> %d loc=%s %s" (int made.StatusCode) (string made.Headers.Location) (madeBody.Trim())) // => one line
    get client "/orders/1" // => the known id serves its order
    get client "/orders/7" // => the unknown id names its miss
    // => StopAsync drains in-flight requests before releasing the host, so the
    // => checks above always land before the process exits.
    app.StopAsync().GetAwaiter().GetResult() // => stop cleanly: nothing in flight is cut (co-08)
    0 // => zero exit means the transcript matched
