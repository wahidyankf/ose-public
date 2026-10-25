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
// => ShopStore owns the review service's words.
type ShopStore() = // => one store feeds both routes (co-06)
    member _.Hello = "hello" // => the open greeting
    member _.Secret = "s3cr3t-hi" // => the guarded greeting

// => shopLog records every request line the review sees.
let shopLog = System.Collections.Generic.List<string>() // => arrival order, no timings
// => shopLogCall observes and shopGate guards.
let shopLogCall: HttpHandler = // => observation first, decision second (co-02)
    fun next ctx ->
        task {
            shopLog.Add(
                ctx.Request.Method
                + " "
                + ctx.Request.Path.ToString()
                + ctx.Request.QueryString.ToString()
            ) // => full line with query

            return! next ctx // => logging changes nothing
        }

// => shopGate keeps strangers off the admin branch.
let shopGate: HttpHandler = // => the review's one credential check (co-02)
    fun next ctx ->
        task {
            match ctx.TryGetQueryStringValue "key" with // => the review key decides
            | Some "s3cr3t" -> return! next ctx // => holders continue
            | _ -> return! (setStatusCode 403 >=> text "forbidden") next ctx // => strangers stop
        }

// => webApp reviews the level: store-fed routes behind logging and a guard.
// => Observation wraps everything; the guard wraps one branch only.
// => The log line carries the query string so the admin calls differ.
let webApp: HttpHandler = // => every intermediate skill appears once
    shopLogCall
    >=> choose
            [ // => everything is observed
              route "/hello"
              >=> fun next ctx -> // => the open route reads the store
                  task {
                      let store = ctx.GetService<ShopStore>() // => injected greeting
                      return! text store.Hello next ctx
                  }
              shopGate
              >=> route "/admin"
              >=> fun next ctx -> // => the guarded route reads the store too
                  task {
                      let store = ctx.GetService<ShopStore>() // => same store, guarded branch
                      return! text store.Secret next ctx
                  }
              setStatusCode 404 >=> text "Not Found" ] // => misses are logged like hits
// => buildApp wires the service every check in this unit exercises.
let buildApp (args: string[]) = // => args carry no flags in this course
    let builder = WebApplication.CreateBuilder(args) // => defaults plus our overrides
    // => Silenced logs keep stdout to printed lines only: golden transcripts
    // => must never contain framework chatter.
    builder.Logging.ClearProviders() |> ignore // => no log lines: only our prints appear
    // => Giraffe's JSON serializer lives in DI: without AddGiraffe the first
    // => json answer throws MissingDependencyException at runtime.
    builder.Services.AddGiraffe() |> ignore // => Giraffe needs its serializer in DI
    builder.Services.AddSingleton<ShopStore>() |> ignore // => the store outlives every request
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
    get client "/hello" // => the store-fed greeting
    get client "/admin" // => the guard stops strangers
    get client "/admin?key=s3cr3t" // => the key admits holders
    show (sprintf "log=%s" (System.String.Join(";", shopLog))) // => three lines in arrival order
    // => StopAsync drains in-flight requests before releasing the host, so the
    // => checks above always land before the process exits.
    app.StopAsync().GetAwaiter().GetResult() // => stop cleanly: nothing in flight is cut (co-08)
    0 // => zero exit means the transcript matched
