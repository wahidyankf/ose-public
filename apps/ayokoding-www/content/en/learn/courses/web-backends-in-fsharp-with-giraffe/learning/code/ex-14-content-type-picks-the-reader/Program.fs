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
// => NewOrder is the typed shape of the request body (co-15).
[<CLIMutable>] // => CLIMutable lets the binder set each field
type NewOrder = // => one record owns the whole contract
    { item: string // => what the client wants to order
      qty: int } // => how many the client wants
// => webApp picks its reader from the request content type.
// => Content-Type names the body shape; the match arms name the readers.
// => Prefix matching tolerates charset suffixes clients love to append.
let webApp: HttpHandler = // => one path, two body shapes (co-12)
    choose
        [ POST
          >=> route "/ingest"
          >=> fun next ctx ->
              task {
                  match ctx.Request.ContentType with // => the header names the shape
                  | null -> return! (setStatusCode 415 >=> text "missing-content-type") next ctx
                  | ct when ct.StartsWith("application/json") -> // => JSON readers bind records
                      let! order = ctx.BindJsonAsync<NewOrder>() // => same record as Example 9
                      return! json {| item = order.item; qty = order.qty |} next ctx
                  | ct when ct.StartsWith("application/x-www-form-urlencoded") -> // => form readers read pairs
                      let! form = ctx.Request.ReadFormAsync() // => the pair reader
                      return! json {| name = form.["name"].ToString() |} next ctx
                  | _ -> return! (setStatusCode 415 >=> text "unsupported-media-type") next ctx // => anything else fails
              }
          // => The offer route negotiates the way out: Accept names the format.
          // => Absent means JSON; text/csv switches the representation.
          GET
          >=> route "/offer"
          >=> fun next ctx ->
              task {
                  let accept = defaultArg (ctx.TryGetRequestHeader "Accept") "application/json" // => absent means JSON

                  if accept.Contains("text/csv") then // => the client names its format
                      return! (setHttpHeader "Content-Type" "text/csv" >=> text "id,qty\n9,2") next ctx // => the CSV representation
                  else // => JSON is the default representation
                      return! json {| id = 9; qty = 2 |} next ctx // => the JSON representation
              }
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
    postJson client "/ingest" """{"item":"book","qty":2}""" // => JSON takes the record reader
    use ingestForm = new FormUrlEncodedContent(dict [ ("name", "ada") ]) // => form-shaped body
    use ingestResp = client.PostAsync("/ingest", ingestForm).GetAwaiter().GetResult() // => form takes the pair reader
    let ingestBody = ingestResp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => exact bytes back
    show (sprintf "POST /ingest form -> %d %s" (int ingestResp.StatusCode) (ingestBody.Trim())) // => one line
    use plain = new StringContent("hi", Encoding.UTF8, "text/plain") // => a shape nobody reads
    use plainResp = client.PostAsync("/ingest", plain).GetAwaiter().GetResult() // => the fallback answers
    let plainBody = plainResp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => exact bytes back
    show (sprintf "POST /ingest text -> %d %s" (int plainResp.StatusCode) (plainBody.Trim())) // => one line
    get client "/offer" // => the default representation is JSON
    use csvReq = new HttpRequestMessage(HttpMethod("GET"), "/offer") // => a second request names its format
    csvReq.Headers.Add("Accept", "text/csv") // => the client asks for CSV
    use csvResp = client.SendAsync(csvReq).GetAwaiter().GetResult() // => the route negotiates
    let csvBody = csvResp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => exact bytes back
    show (sprintf "GET /offer + accept csv -> %d %s" (int csvResp.StatusCode) (csvBody.Trim())) // => one line
    // => StopAsync drains in-flight requests before releasing the host, so the
    // => checks above always land before the process exits.
    app.StopAsync().GetAwaiter().GetResult() // => stop cleanly: nothing in flight is cut (co-08)
    0 // => zero exit means the transcript matched
