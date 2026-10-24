module App // => STARTER: echoes without validating (the smell)

open System.Net.Http
open System.Text
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open Giraffe

// => KataVal is the value the kata validates.
[<CLIMutable>]
type KataVal = { v: string }

// => webApp trusts the client: no validation anywhere.
let webApp: HttpHandler = // => SMELL: the echo never judges
    choose
        [ POST
          >=> route "/v"
          >=> fun next ctx ->
              task {
                  let! value = ctx.BindJsonAsync<KataVal>() // => binds, never validates
                  return! json {| v = value.v |} next ctx // => nulls echo as nulls
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
    // => TODO: post {} and watch null echo back with 200
    app.StopAsync().GetAwaiter().GetResult()
    0
