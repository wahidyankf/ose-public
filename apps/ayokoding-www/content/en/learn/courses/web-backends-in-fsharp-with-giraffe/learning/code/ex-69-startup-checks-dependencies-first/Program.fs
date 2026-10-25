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
// => SeedStore holds the seed the startup check requires.
type SeedStore() = // => the dependency the host verifies before serving (co-08, co-06)
    let items = System.Collections.Concurrent.ConcurrentDictionary<string, string>() // => the seeded map
    do items.TryAdd("seed", "seed-value") |> ignore // => the seed every check relies on
    member _.Has(key: string) = items.ContainsKey(key) // => the startup question

    member _.Get(key: string) = // => the serving answer
        match items.TryGetValue(key) with
        | true, value -> Some value // => present carries the value
        | _ -> None // => absent carries nothing

// => checkDeps fails startup fast when the seed is missing.
// => The gate doubles as the /deps probe: one function guards both.
// => Resolve the served instance, never a copy, or the gate lies.
let checkDeps (store: SeedStore) = // => the startup gate in one function
    if store.Has("seed") then // => the seed the service needs
        "deps-ok" // => verified: the host may start
    else // => missing seed means misconfiguration
        failwith "missing seed" // => fail before serving a single request
// => webApp serves the dependency the startup verified.
let webApp: HttpHandler = // => verified at startup, served at runtime
    choose
        [ GET
          >=> route "/deps"
          >=> fun next ctx ->
              task {
                  let store = ctx.GetService<SeedStore>() // => the verified store
                  return! text (checkDeps store) next ctx // => the gate doubles as the probe
              }
          GET
          >=> routef "/items/%s" (fun key -> // => the seeded item serves typed
              fun next ctx ->
                  task {
                      let store = ctx.GetService<SeedStore>() // => the same verified store

                      match store.Get(key) with // => lookup, not exception
                      | Some value -> return! json {| k = key; v = value |} next ctx
                      | None -> return! (setStatusCode 404 >=> json {| error = "item-not-found" |}) next ctx
                  })
          setStatusCode 404 >=> text "Not Found" ] // => other paths miss
// => buildApp wires the service every check in this unit exercises.
let buildApp (args: string[]) = // => args carry no flags in this course
    let builder = WebApplication.CreateBuilder(args) // => defaults plus our overrides
    // => Silenced logs keep stdout to printed lines only: golden transcripts
    // => must never contain framework chatter.
    builder.Logging.ClearProviders() |> ignore // => no log lines: only our prints appear
    // => Giraffe's JSON serializer lives in DI: without AddGiraffe the first
    // => json answer throws MissingDependencyException at runtime.
    builder.Services.AddGiraffe() |> ignore // => Giraffe needs its serializer in DI
    builder.Services.AddSingleton<SeedStore>() |> ignore // => the store the startup verifies
    builder.WebHost.UseTestServer() |> ignore // => in-memory server: no socket, no port
    let app = builder.Build() // => the pipeline with routing and endpoints
    let seedStore = app.Services.GetService<SeedStore>() // => resolve for the startup check
    checkDeps seedStore |> ignore // => throw before StartAsync when misconfigured
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
    get client "/deps" // => the startup gate answers through the route
    get client "/items/seed" // => the verified seed serves its value
    // => StopAsync drains in-flight requests before releasing the host, so the
    // => checks above always land before the process exits.
    app.StopAsync().GetAwaiter().GetResult() // => stop cleanly: nothing in flight is cut (co-08)
    0 // => zero exit means the transcript matched
