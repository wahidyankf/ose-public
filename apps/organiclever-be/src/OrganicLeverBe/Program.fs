module OrganicLeverBe.Program

open System
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.EntityFrameworkCore
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Hosting
open Giraffe
open DbUp
open OrganicLeverBe.Infrastructure.AppDbContext
open OrganicLeverBe.Infrastructure.Repositories.RepositoryTypes
open OrganicLeverBe.Infrastructure.Repositories.EfRepositories
open OrganicLeverBe.Auth.JwtMiddleware
open OrganicLeverBe.Auth.GoogleAuthService

let webApp: HttpHandler =
    choose
        [ subRoute
              "/api/v1"
              (choose
                  [ GET >=> route "/health" >=> Handlers.HealthHandler.check
                    subRoute
                        "/auth"
                        (choose
                            [ POST >=> route "/google" >=> Handlers.AuthHandler.googleLogin
                              POST >=> route "/refresh" >=> Handlers.AuthHandler.refresh
                              GET >=> route "/me" >=> requireAuth >=> Handlers.AuthHandler.me ])
                    POST >=> route "/test/reset-db" >=> Handlers.TestHandler.resetDb
                    POST >=> route "/test/delete-users" >=> Handlers.TestHandler.deleteUsersOnly ])
          RequestErrors.NOT_FOUND "Not Found" ]

let configureApp (app: IApplicationBuilder) =
    app.UseCors(fun policy -> policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader() |> ignore)
    |> ignore

    app.UseGiraffe webApp

let configureServices (services: IServiceCollection) =
    services.AddGiraffe() |> ignore
    services.AddCors() |> ignore

    let connStr = Environment.GetEnvironmentVariable("DATABASE_URL")

    if not (String.IsNullOrEmpty connStr) then
        services.AddDbContext<AppDbContext>(fun opts ->
            opts.UseNpgsql(connStr).UseSnakeCaseNamingConvention() |> ignore)
        |> ignore
    else
        services.AddDbContext<AppDbContext>(fun opts ->
            opts.UseSqlite("DataSource=organiclever.db").UseSnakeCaseNamingConvention()
            |> ignore)
        |> ignore

    // Register repository function records as scoped services (AppDbContext is scoped)
    services.AddScoped<UserRepository>(fun sp ->
        let db = sp.GetRequiredService<AppDbContext>()
        createUserRepo db)
    |> ignore

    services.AddScoped<RefreshTokenRepository>(fun sp ->
        let db = sp.GetRequiredService<AppDbContext>()
        createRefreshTokenRepo db)
    |> ignore

    // Register GoogleAuthService as a singleton
    services.AddSingleton<GoogleAuthService>(fun _ -> createGoogleAuthService false)
    |> ignore

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

    let connStr = Environment.GetEnvironmentVariable("DATABASE_URL")

    if not (String.IsNullOrEmpty connStr) then
        let result =
            DeployChanges.To
                .PostgresqlDatabase(connStr)
                .WithScriptsEmbeddedInAssembly(Reflection.Assembly.GetExecutingAssembly())
                .LogToConsole()
                .Build()
                .PerformUpgrade()

        if not result.Successful then
            failwith (sprintf "Database migration failed: %s" result.Error.Message)
    else
        // No DATABASE_URL — use EF Core EnsureCreated for local/SQLite development
        use scope = host.Services.CreateScope()
        let db = scope.ServiceProvider.GetRequiredService<AppDbContext>()
        db.Database.EnsureCreated() |> ignore

    host.Run()
    0
