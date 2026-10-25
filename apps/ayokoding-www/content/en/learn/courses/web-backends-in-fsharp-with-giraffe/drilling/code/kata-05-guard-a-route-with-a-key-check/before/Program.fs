module App // => STARTER: the admin route stands open (the smell)

open System.Net.Http
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open Giraffe

// => webApp guards nothing: every route answers everyone.
let webApp: HttpHandler = // => SMELL: /admin serves strangers like friends
    choose
        [ route "/open" >=> text "everyone"
          route "/admin" >=> text "holders" // => unguarded: no check anywhere
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
    // => TODO: wrap /admin in a key-checking wrapper and prove 403s
    app.StopAsync().GetAwaiter().GetResult()
    0
