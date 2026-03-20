module DemoBeFsgi.Program

open System
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.EntityFrameworkCore
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Hosting
open Giraffe
open DemoBeFsgi.Infrastructure.AppDbContext
open DemoBeFsgi.Auth.JwtMiddleware
open DemoBeFsgi.Auth.AdminMiddleware

let healthHandler: HttpHandler = fun next ctx -> json {| status = "UP" |} next ctx

// Test-only handler: promotes a user to admin role by username (URL path param).
// Used by HandlerCoverageTests and Gherkin step definitions unconditionally.
let setAdminRoleForUser (username: string) : HttpHandler =
    fun next ctx ->
        task {
            let db = ctx.GetService<AppDbContext>()

            let! user = db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Username = username)

            if obj.ReferenceEquals(user, null) then
                ctx.Response.StatusCode <- 404
                return! json {| error = "Not Found" |} earlyReturn ctx
            else
                let updated = { user with Role = "ADMIN" }
                db.Users.Update(updated) |> ignore
                let! _ = db.SaveChangesAsync()
                return! json {| message = "Role set to admin" |} next ctx
        }

let webApp: HttpHandler =
    choose
        [ GET >=> route "/health" >=> healthHandler
          POST >=> routef "/test/set-admin-role/%s" setAdminRoleForUser
          POST >=> route "/api/v1/test/reset-db" >=> Handlers.TestHandler.resetDb
          POST
          >=> route "/api/v1/test/promote-admin"
          >=> Handlers.TestHandler.promoteAdmin
          GET >=> route "/.well-known/jwks.json" >=> Handlers.TokenHandler.jwks
          subRoute
              "/api/v1"
              (choose
                  [ subRoute
                        "/auth"
                        (choose
                            [ POST >=> route "/register" >=> Handlers.AuthHandler.register
                              POST >=> route "/login" >=> Handlers.AuthHandler.login
                              POST >=> route "/refresh" >=> Handlers.AuthHandler.refresh
                              POST >=> route "/logout" >=> Handlers.AuthHandler.logout
                              POST >=> route "/logout-all" >=> requireAuth >=> Handlers.AuthHandler.logoutAll ])
                    subRoute
                        "/users"
                        (requireAuth
                         >=> choose
                                 [ GET >=> route "/me" >=> Handlers.UserHandler.getProfile
                                   PATCH >=> route "/me" >=> Handlers.UserHandler.updateProfile
                                   POST >=> route "/me/password" >=> Handlers.UserHandler.changePassword
                                   POST >=> route "/me/deactivate" >=> Handlers.UserHandler.deactivate ])
                    subRoute
                        "/admin"
                        (requireAuth
                         >=> requireAdmin
                         >=> choose
                                 [ GET >=> route "/users" >=> Handlers.AdminHandler.listUsers
                                   POST >=> routef "/users/%O/disable" Handlers.AdminHandler.disableUser
                                   POST >=> routef "/users/%O/enable" Handlers.AdminHandler.enableUser
                                   POST >=> routef "/users/%O/unlock" Handlers.AdminHandler.unlockUser
                                   POST
                                   >=> routef "/users/%O/force-password-reset" Handlers.AdminHandler.forcePasswordReset ])
                    subRoute
                        "/expenses"
                        (requireAuth
                         >=> choose
                                 [ POST >=> route "" >=> Handlers.ExpenseHandler.create
                                   GET >=> route "" >=> Handlers.ExpenseHandler.list
                                   GET >=> route "/summary" >=> Handlers.ExpenseHandler.summary
                                   GET >=> routef "/%O" Handlers.ExpenseHandler.getById
                                   PUT >=> routef "/%O" Handlers.ExpenseHandler.update
                                   DELETE >=> routef "/%O" Handlers.ExpenseHandler.delete
                                   POST >=> routef "/%O/attachments" Handlers.AttachmentHandler.upload
                                   GET >=> routef "/%O/attachments" Handlers.AttachmentHandler.list
                                   DELETE >=> routef "/%O/attachments/%O" Handlers.AttachmentHandler.delete ])
                    subRoute
                        "/tokens"
                        (requireAuth
                         >=> choose [ GET >=> route "/claims" >=> Handlers.TokenHandler.claims ])
                    subRoute
                        "/reports"
                        (requireAuth
                         >=> choose [ GET >=> route "/pl" >=> Handlers.ReportHandler.profitAndLoss ]) ])
          RequestErrors.NOT_FOUND "Not Found" ]

let configureApp (app: IApplicationBuilder) = app.UseGiraffe webApp

let configureServices (services: IServiceCollection) =
    services.AddGiraffe() |> ignore

    let connStr = Environment.GetEnvironmentVariable("DATABASE_URL")

    if not (String.IsNullOrEmpty connStr) then
        services.AddDbContext<AppDbContext>(fun opts ->
            opts.UseNpgsql(connStr).UseSnakeCaseNamingConvention() |> ignore)
        |> ignore
    else
        services.AddDbContext<AppDbContext>(fun opts ->
            opts.UseSqlite("DataSource=demo.db").UseSnakeCaseNamingConvention() |> ignore)
        |> ignore

type Marker = class end

[<EntryPoint>]
let main args =
    let host =
        Host
            .CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(fun webHostBuilder ->
                webHostBuilder.Configure(configureApp).ConfigureServices(configureServices).UseUrls("http://+:8201")
                |> ignore)
            .Build()

    use scope = host.Services.CreateScope()

    let db = scope.ServiceProvider.GetRequiredService<AppDbContext>()

    db.Database.EnsureCreated() |> ignore

    host.Run()
    0
