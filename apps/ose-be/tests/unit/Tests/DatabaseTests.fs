module OseBe.Tests.Unit.Tests.DatabaseTests

open System
open Xunit
open OseBe.Infrastructure.Database
open OseBe.Contexts.Db.Application
open OseBe.Contexts.Db.Infrastructure
open OseBe.Tests.Unit.Steps.BddState

[<Fact>]
let ``requireDatabaseUrlWith returns the configured connection string`` () =
    let value = "Host=fake;Database=ose_be"
    Assert.Equal(value, requireDatabaseUrlWith (fun _ -> value))

[<Fact>]
let ``requireDatabaseUrlWith fails fast when DATABASE_URL is absent`` () =
    let ex =
        Assert.Throws<Exception>(fun () -> requireDatabaseUrlWith (fun _ -> null) |> ignore)

    Assert.Contains("DATABASE_URL", ex.Message)

[<Fact>]
let ``runMigrationsWith invokes the upgrade adapter exactly once`` () =
    let mutable calls = 0
    let mutable observed = ""

    runMigrationsWith
        (fun connection ->
            calls <- calls + 1
            observed <- connection
            Ok())
        "in-memory://ose-be"

    Assert.Equal(1, calls)
    Assert.Equal("in-memory://ose-be", observed)

[<Fact>]
let ``runMigrationsWith fails with the upgrade adapter error`` () =
    let ex =
        Assert.Throws<Exception>(fun () -> runMigrationsWith (fun _ -> Error "broken script") "in-memory")

    Assert.Contains("broken script", ex.Message)

[<Fact>]
let ``migration status transitions from pending to applied`` () =
    let status = newMigrationStatus ()
    Assert.Equal(Pending, status.Get())
    Assert.Equal("pending", stateToString (status.Get()))

    status.MarkApplied()

    Assert.Equal(Applied, status.Get())
    Assert.Equal("applied", stateToString (status.Get()))

[<Fact>]
let ``database status route reports an applied startup migration`` () =
    let client = buildClient (OseBe.Contexts.Db.Api.routes (appliedMigrationStatus ()))
    let response = client.GetAsync("/api/v1/system/status/database").Result
    let body = response.Content.ReadAsStringAsync().Result

    Assert.True(response.IsSuccessStatusCode)
    Assert.Contains("\"migration_state\":\"applied\"", body)

// @scenario specs/apps/ose/be/behaviours/db/migrations.feature: Database status endpoint reports the migration state after startup
[<Fact>]
let ``database status route reports pending until the startup migrations complete`` () =
    let status = newMigrationStatus ()
    let client = buildClient (OseBe.Contexts.Db.Api.routes status)

    let before =
        client.GetAsync("/api/v1/system/status/database").Result.Content.ReadAsStringAsync().Result

    Assert.Contains("\"migration_state\":\"pending\"", before)

    // Mirrors Program.fs startup: the migrations run first, then the status is marked applied.
    runMigrationsWith (fun _ -> Ok()) "in-memory://ose-be"
    status.MarkApplied()

    let after =
        client.GetAsync("/api/v1/system/status/database").Result.Content.ReadAsStringAsync().Result

    Assert.Contains("\"migration_state\":\"applied\"", after)

// @scenario specs/apps/ose/be/behaviours/db/migrations.feature: Backend aborts at startup with a clear error when DATABASE_URL is missing
[<Fact>]
let ``requireDatabaseUrlWith aborts naming DATABASE_URL when it is unset or empty`` () =
    for value in [ null; "" ] do
        let ex =
            Assert.Throws<Exception>(fun () -> requireDatabaseUrlWith (fun _ -> value) |> ignore)

        Assert.Contains("DATABASE_URL", ex.Message)

// @scenario specs/apps/ose/be/behaviours/db/migrations.feature: Backend serves requests after starting against a database with pending migrations
[<Fact>]
let ``the composed routes serve requests once the startup migrations have applied`` () =
    let status = newMigrationStatus ()

    let client =
        buildClient (
            OseBe.WebApp.buildWebAppWithMigrationStatus status (OseBe.Contexts.Messaging.Application.newShared ())
        )

    let before =
        client.GetAsync("/api/v1/system/status/database").Result.Content.ReadAsStringAsync().Result

    Assert.Contains("\"migration_state\":\"pending\"", before)

    // Mirrors Program.fs startup: the migrations run before the HTTP host serves requests.
    runMigrationsWith (fun _ -> Ok()) "in-memory://ose-be"
    status.MarkApplied()

    let health = client.GetAsync("/api/v1/health").Result

    let after =
        client.GetAsync("/api/v1/system/status/database").Result.Content.ReadAsStringAsync().Result

    Assert.Equal(System.Net.HttpStatusCode.OK, health.StatusCode)
    Assert.Contains("\"migration_state\":\"applied\"", after)
