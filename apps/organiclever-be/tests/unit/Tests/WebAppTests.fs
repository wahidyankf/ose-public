module OrganicleverBe.Tests.Unit.Tests.WebAppTests

open System.Net
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.EntityFrameworkCore
open Microsoft.Extensions.DependencyInjection
open Giraffe
open Xunit
open OrganicleverBe.Infrastructure.AppDbContext
open OrganicleverBe.WebApp
open OrganicleverBe.Contexts.Messaging.Application

/// Builds a test client for the real `buildWebApp` composition root, with an
/// `AppDbContext` registered against an unreachable connection string. The
/// journal routing surface (`journalRoutes` in WebApp.fs) resolves and builds
/// its repository from DI on every request it sees — including a request no
/// journal route ultimately matches — so a request that falls through to the
/// final 404 still exercises that composition-root wiring without needing a
/// live PostgreSQL connection.
let private buildFullClient () : System.Net.Http.HttpClient =
    let builder =
        WebHostBuilder()
            .ConfigureServices(fun services ->
                services.AddGiraffe() |> ignore

                services.AddDbContext<AppDbContext>(fun opts ->
                    opts
                        .UseNpgsql("Host=127.0.0.1;Port=1;Database=organiclever_be_unit_test;Username=x")
                        .UseSnakeCaseNamingConvention()
                    |> ignore)
                |> ignore)
            .Configure(fun app -> app.UseGiraffe(buildWebApp (newShared ())))

    let server = new TestServer(builder)
    server.CreateClient()

[<Fact>]
let ``an unmatched path resolves the journal repository from DI and falls through to 404`` () =
    let client = buildFullClient ()
    let resp = client.GetAsync("/totally-unmatched-path").Result
    Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode)
