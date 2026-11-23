module OseBe.Tests.Unit.Steps.LiveMessagingSteps

open System
open System.Net
open System.Threading.Tasks
open TickSpec
open Xunit
open OseBe.Contexts.Messaging.Domain
open OseBe.Contexts.Messaging.Application
open OseBe.Tests.Unit.Steps.BddState

let private natsUrl = "nats://fake"
let mutable private connectFails = false
let mutable private connection: string option = None
let mutable private messagingStatus: SharedMessagingStatus = newShared ()

let private demoPorts: OseBe.Contexts.Messaging.Infrastructure.JetStreamDemoPorts =
    { EnsureStream = fun () -> Task.CompletedTask
      EnsureConsumer = fun () -> Task.CompletedTask
      Publish = fun () -> Task.CompletedTask
      ReceiveAndAcknowledge = fun () -> Task.FromResult true }

[<Given>]
let ``OSE_BE_NATS_URL points to a running NATS server with JetStream enabled`` () =
    connectFails <- false
    connection <- None
    messagingStatus <- newShared ()

[<Given>]
let ``OSE_BE_NATS_URL points to a NATS server that is not reachable`` () =
    connectFails <- true
    connection <- None
    messagingStatus <- newShared ()

[<Given>]
let ``NATS JetStream is running and ose-be is stopped`` () =
    connectFails <- false
    connection <- None
    messagingStatus <- newShared ()

[<When>]
let ``ose-be starts up`` () =
    connection <-
        OseBe.Infrastructure.NatsConnect.connectWith
            id
            (fun _ ->
                if connectFails then
                    Task.FromException(Exception "unavailable")
                else
                    Task.CompletedTask)
            (fun _ -> Task.CompletedTask)
            natsUrl
        |> Async.AwaitTask
        |> Async.RunSynchronously

    // Mirrors Program.fs startup: the demo runs only over a connection; otherwise the failure is recorded.
    match connection with
    | Some _ ->
        let outcome =
            OseBe.Contexts.Messaging.Infrastructure.runDemoWith demoPorts
            |> Async.AwaitTask
            |> Async.RunSynchronously

        messagingStatus.Set outcome
    | None -> messagingStatus.Set(Failed "NATS unavailable at startup")

[<Then>]
let ``the backend reports healthy after connecting`` () =
    Assert.True(connection.IsSome)
    let client = buildClient OseBe.WebApp.webApp
    let response = client.GetAsync("/api/v1/health").Result
    Assert.Equal(HttpStatusCode.OK, response.StatusCode)

[<Then>]
let ``the messaging status surface reports the demo delivered and acked`` () =
    let client = buildClient (OseBe.Contexts.Messaging.Api.routes messagingStatus)
    let body = client.GetStringAsync("/api/v1/system/status/messaging").Result
    Assert.Contains("delivered_and_acked", body)

[<Then>]
let ``the messaging status endpoint reports the failure`` () =
    let client = buildClient (OseBe.Contexts.Messaging.Api.routes messagingStatus)
    let body = client.GetStringAsync("/api/v1/system/status/messaging").Result
    Assert.Contains("failed: NATS unavailable at startup", body)

[<Then>]
let ``the health endpoint still reports healthy`` () =
    let client = buildClient OseBe.WebApp.webApp
    let response = client.GetAsync("/api/v1/health").Result
    Assert.Equal(HttpStatusCode.OK, response.StatusCode)
