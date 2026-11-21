module OrganicleverBe.Tests.Unit.Tests.NatsClientTests

open System
open System.Net
open System.Threading.Tasks
open Xunit
open OrganicleverBe.Contexts.Messaging.Domain
open OrganicleverBe.Contexts.Messaging.Application
open OrganicleverBe.Contexts.Messaging.Api
open OrganicleverBe.Infrastructure.NatsClient
open OrganicleverBe.Infrastructure.NatsConnect
open OrganicleverBe.Tests.Unit.Steps.BddState

// @scenario specs/apps/organiclever/be/behaviours/messaging/nats-config.feature: organiclever-be fails fast when its NATS URL is missing
[<Fact>]
let ``requireNatsUrlWith fails fast when ORGANICLEVER_BE_NATS_URL is unset`` () =
    let ex =
        Assert.Throws<Exception>(fun () -> requireNatsUrlWith (fun _ -> null) |> ignore)

    Assert.Contains("ORGANICLEVER_BE_NATS_URL", ex.Message)

[<Fact>]
let ``requireNatsUrlWith returns the configured URL`` () =
    Assert.Equal("nats://fake", requireNatsUrlWith (fun _ -> "nats://fake"))

// @scenario specs/apps/organiclever/be/behaviours/messaging/live/nats-connect.feature: Backend reports healthy after starting with a reachable NATS server
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

// @scenario specs/apps/organiclever/be/behaviours/messaging/live/nats-connect.feature: Messaging status endpoint reports the failure when NATS is unreachable and the HTTP service still starts
[<Fact>]
let ``a failed NATS connect leaves the status endpoint reporting the failure`` () =
    let connection =
        connectWith
            id
            (fun _ -> Task.FromException(Exception "unavailable"))
            (fun _ -> Task.CompletedTask)
            "nats://fake"
        |> Async.AwaitTask
        |> Async.RunSynchronously

    // Mirrors Program.fs startup: when no connection is made, the failure is recorded on the shared status.
    let status = newShared ()

    if connection.IsNone then
        status.Set(Failed "NATS unavailable at startup")

    let resp =
        (buildClient (routes status)).GetAsync("/api/v1/system/status/messaging").Result

    let body = resp.Content.ReadAsStringAsync().Result

    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)
    Assert.Contains("failed: NATS unavailable at startup", body)
