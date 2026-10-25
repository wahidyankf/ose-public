module App // => STARTER: a new route with no checks (the smell)

open System.Net.Http
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open Giraffe

// => webApp serves the new route nobody drives.
let webApp: HttpHandler = // => SMELL: /new exists but no check requests it
    choose
        [ GET >=> route "/new" >=> text "brand-new" // => untested: does it even serve?
          GET >=> route "/old" >=> text "kept"
          setStatusCode 404 >=> text "Not Found" ]

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
    // => TODO: write a three-row table driving /new, /old, and /nope
    app.StopAsync().GetAwaiter().GetResult()
    0
