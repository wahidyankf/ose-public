module OrganicLeverBe.Program

open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Hosting
open Giraffe

let webApp: HttpHandler =
    choose
        [ subRoute "/api/v1" (choose [ GET >=> route "/health" >=> Handlers.HealthHandler.check ])
          RequestErrors.NOT_FOUND "Not Found" ]

let configureApp (app: IApplicationBuilder) =
    app.UseCors(fun policy -> policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader() |> ignore)
    |> ignore

    app.UseGiraffe webApp

let configureServices (services: IServiceCollection) =
    services.AddGiraffe() |> ignore
    services.AddCors() |> ignore

type Marker = class end

[<EntryPoint>]
let main args =
    let host =
        Host
            .CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(fun webHostBuilder ->
                webHostBuilder.Configure(configureApp).ConfigureServices(configureServices).UseUrls("http://+:8202")
                |> ignore)
            .Build()

    host.Run()
    0
