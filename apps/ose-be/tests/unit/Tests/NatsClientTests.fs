module OseBe.Tests.Unit.Tests.NatsClientTests

open System
open System.Net
open System.Threading.Tasks
open Xunit
open OseBe.Contexts.Messaging.Domain
open OseBe.Infrastructure.NatsClient
open OseBe.Infrastructure.NatsConnect
open OseBe.Tests.Unit.Steps.BddState

// @scenario specs/apps/ose/be/behaviours/messaging/nats-config.feature: ose-be fails fast when its NATS URL is missing
[<Fact>]
let ``requireNatsUrlWith fails fast when OSE_BE_NATS_URL is unset`` () =
    let ex =
        Assert.Throws<Exception>(fun () -> requireNatsUrlWith (fun _ -> null) |> ignore)

    Assert.Contains("OSE_BE_NATS_URL", ex.Message)

[<Fact>]
let ``requireNatsUrlWith returns the configured URL`` () =
    Assert.Equal("nats://fake", requireNatsUrlWith (fun _ -> "nats://fake"))

[<Fact>]
let ``connectWith returns a connected instance without touching a network`` () =
    let mutable connected = false

    let result =
        connectWith
            id
            (fun _ ->
                connected <- true
                Task.CompletedTask)
            (fun _ -> Task.CompletedTask)
            "nats://fake"
        |> Async.AwaitTask
        |> Async.RunSynchronously

    Assert.True(connected)
    Assert.Equal(Some "nats://fake", result)

[<Fact>]
let ``connectWith disposes and returns None when connection fails`` () =
    let mutable disposed = false

    let result =
        connectWith
            id
            (fun _ -> Task.FromException(Exception "unavailable"))
            (fun _ ->
                disposed <- true
                Task.CompletedTask)
            "nats://fake"
        |> Async.AwaitTask
        |> Async.RunSynchronously

    Assert.True(disposed)
    Assert.True(result.IsNone)

// @scenario specs/apps/ose/be/behaviours/messaging/live/nats-connect.feature: Backend reports healthy after starting with a reachable NATS server
[<Fact>]
let ``a reachable NATS startup leaves the backend reporting healthy`` () =
    let connection =
        connectWith id (fun _ -> Task.CompletedTask) (fun _ -> Task.CompletedTask) "nats://fake"
        |> Async.AwaitTask
        |> Async.RunSynchronously

    Assert.True(connection.IsSome)
    let response = (buildClient OseBe.WebApp.webApp).GetAsync("/api/v1/health").Result
    Assert.Equal(HttpStatusCode.OK, response.StatusCode)

// @scenario specs/apps/ose/be/behaviours/messaging/live/nats-connect.feature: Messaging status endpoint reports the failure when NATS is unreachable and the HTTP service still starts
[<Fact>]
let ``an unreachable NATS startup leaves the messaging status reporting the failure while health stays healthy`` () =
    let connection =
        connectWith
            id
            (fun _ -> Task.FromException(Exception "unavailable"))
            (fun _ -> Task.CompletedTask)
            "nats://fake"
        |> Async.AwaitTask
        |> Async.RunSynchronously

    // Mirrors Program.fs startup: when no connection is made, the failure is recorded on the shared status.
    let status = OseBe.Contexts.Messaging.Application.newShared ()

    if connection.IsNone then
        status.Set(Failed "NATS unavailable at startup")

    let client = buildClient (OseBe.WebApp.buildWebApp status)
    let messaging = client.GetAsync("/api/v1/system/status/messaging").Result
    let body = messaging.Content.ReadAsStringAsync().Result
    let health = client.GetAsync("/api/v1/health").Result

    Assert.Equal(HttpStatusCode.OK, messaging.StatusCode)
    Assert.Contains("failed: NATS unavailable at startup", body)
    Assert.Equal(HttpStatusCode.OK, health.StatusCode)
