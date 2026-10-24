module App // => STARTER: misses answer as bare text (the smell)

open System.Net.Http
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open Giraffe

// => webApp misses in a different shape than it hits.
let webApp: HttpHandler = // => SMELL: text misses break JSON clients
    choose
        [ GET >=> route "/a" >=> text "a"
          setStatusCode 404 >=> text "Not Found" ] // => bare text: unparseable by contract

// => buildApp wires the service the checks exercise.
let buildApp (args: string[]) =
    let builder = WebApplication.CreateBuilder(args)
    builder.Logging.ClearProviders() |> ignore
    builder.Services.AddGiraffe() |> ignore
    builder.WebHost.UseTestServer() |> ignore
    let app = builder.Build()
    app.UseGiraffe(webApp) |> ignore
    app

[<EntryPoint>]
let main args =
    let app = buildApp args
    app.StartAsync().GetAwaiter().GetResult()
    use client = app.GetTestClient()
    // => TODO: serve the miss as a JSON envelope with an error name
    app.StopAsync().GetAwaiter().GetResult()
    0
