module App // => STARTER: blocks a thread to wait (the smell)

open System.Net.Http
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open Giraffe

// => webApp sleeps the thread: nothing else runs meanwhile.
let webApp: HttpHandler = // => SMELL: Thread.Sleep holds its thread hostage
    choose
        [ GET
          >=> route "/work"
          >=> fun next ctx ->
              task {
                  System.Threading.Thread.Sleep(10) // => blocks: ten wasted milliseconds
                  return! text "done" next ctx
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
    // => TODO: convert the sleep to Task.Delay and compare thread behavior
    app.StopAsync().GetAwaiter().GetResult()
    0
