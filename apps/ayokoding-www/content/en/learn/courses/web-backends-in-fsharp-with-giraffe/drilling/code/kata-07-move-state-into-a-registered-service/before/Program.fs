module App // => STARTER: greeting lives in a module mutable (the smell)

open System.Net.Http
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open Giraffe

// => greeting is module state: untestable, unswappable, global.
let mutable greeting = "served-hi" // => SMELL: every test shares this cell

// => webApp reads the global instead of a service.
let webApp: HttpHandler =
    choose
        [ route "/hi"
          >=> fun next ctx ->
              task {
                  return! text greeting next ctx // => the global answers
              }
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
    // => TODO: move the greeting into a registered singleton service
    app.StopAsync().GetAwaiter().GetResult()
    0
