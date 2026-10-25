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
// => oops53 names the review's deliberate throw.
let oops53 (exn: exn) (_: Microsoft.Extensions.Logging.ILogger) : HttpHandler = // => the review's failure branch (co-05)
    setStatusCode 500 >=> text "oops" // => fixed body keeps the review stable

// => NewItem53 is the typed shape of the created item.
[<CLIMutable>] // => one required field
type NewItem53 = { name: string } // => empty names fail validation

// => ItemShelf53 keeps the review's two seeded items.
type ItemShelf53() = // => fixed data keeps the review deterministic (co-06)
    let items = System.Collections.Concurrent.ConcurrentDictionary<int, string>() // => id to name
    do items.TryAdd(1, "book") |> ignore // => first seeded item
    do items.TryAdd(2, "pen") |> ignore // => second seeded item

    member _.List() = // => the listing reads everything back sorted
        items
        |> Seq.map (fun kv -> {| id = kv.Key; name = kv.Value |})
        |> Seq.sortBy (fun i -> i.id)
        |> Seq.toArray
// => webApp reviews testing habits: list, validated create, miss, throw.
// => Sorted seeds keep the listing deterministic against map ordering.
// => The throw route proves error paths get checks too, not just sunshine.
let webApp: HttpHandler = // => every check drives the service, never a socket (co-09)
    choose
        [ GET
          >=> route "/items"
          >=> fun next ctx ->
              task {
                  let shelf = ctx.GetService<ItemShelf53>() // => the seeded shelf
                  return! json (shelf.List()) next ctx // => both seeds render sorted
              }
          POST
          >=> route "/items"
          >=> fun next ctx ->
              task {
                  let! item = ctx.BindJsonAsync<NewItem53>() // => the candidate binds typed

                  if System.String.IsNullOrEmpty(item.name) then // => validated create (co-10)
                      return! (setStatusCode 400 >=> json {| error = "name-required" |}) next ctx
                  else // => the review accepts only named items
                      return! (setStatusCode 201 >=> json {| id = 3; name = item.name |}) next ctx
              }
          route "/boom" >=> fun _ _ -> failwith "bang" // => error paths get checks too (co-05)
          setStatusCode 404 >=> json {| error = "missing" |} ] // => misses carry the envelope
// => buildApp wires the service every check in this unit exercises.
let buildApp (args: string[]) = // => args carry no flags in this course
    let builder = WebApplication.CreateBuilder(args) // => defaults plus our overrides
    // => Silenced logs keep stdout to printed lines only: golden transcripts
    // => must never contain framework chatter.
    builder.Logging.ClearProviders() |> ignore // => no log lines: only our prints appear
    // => Giraffe's JSON serializer lives in DI: without AddGiraffe the first
    // => json answer throws MissingDependencyException at runtime.
    builder.Services.AddGiraffe() |> ignore // => Giraffe needs its serializer in DI
    builder.Services.AddSingleton<ItemShelf53>() |> ignore // => one shelf for the review
    builder.WebHost.UseTestServer() |> ignore // => in-memory server: no socket, no port
    let app = builder.Build() // => the pipeline with routing and endpoints
    app.UseGiraffeErrorHandler(oops53) |> ignore // => the thrown path lands here
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
    get client "/items" // => the seeded list renders sorted
    postJson client "/items" """{"name":"ruler"}""" // => a named item creates
    postJson client "/items" "{}" // => the unnamed item fails validation
    get client "/boom" // => the thrown path answers its fixed 500
    // => StopAsync drains in-flight requests before releasing the host, so the
    // => checks above always land before the process exits.
    app.StopAsync().GetAwaiter().GetResult() // => stop cleanly: nothing in flight is cut (co-08)
    0 // => zero exit means the transcript matched
