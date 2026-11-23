module OseBe.Tests.Unit.Tests.MessagingTests

open System.Net
open System.Threading.Tasks
open Xunit
open OseBe.Contexts.Messaging.Domain
open OseBe.Contexts.Messaging.Application
open OseBe.Contexts.Messaging.Api
open OseBe.Tests.Unit.Steps.BddState

[<Fact>]
let ``a fresh shared status reports pending`` () =
    let status = newShared ()
    Assert.Equal(Pending, status.Get())

[<Fact>]
let ``outcomeToString renders the pending outcome`` () =
    Assert.Equal("pending", outcomeToString Pending)

[<Fact>]
let ``outcomeToString renders the delivered-and-acked outcome`` () =
    Assert.Equal("delivered_and_acked", outcomeToString DeliveredAndAcked)

[<Fact>]
let ``outcomeToString renders a failed outcome with its reason`` () =
    Assert.Equal("failed: NATS unavailable at startup", outcomeToString (Failed "NATS unavailable at startup"))

[<Fact>]
let ``messaging status endpoint reports pending before the demo runs`` () =
    let client = buildClient (routes (newShared ()))
    let resp = client.GetAsync("/api/v1/system/status/messaging").Result
    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("pending", body)

[<Fact>]
let ``messaging status endpoint reports the demo outcome once it is set`` () =
    let status = newShared ()
    status.Set(DeliveredAndAcked)
    let client = buildClient (routes status)
    let resp = client.GetAsync("/api/v1/system/status/messaging").Result
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("delivered_and_acked", body)

[<Fact>]
let ``runDemoWith publishes receives and acknowledges through injected ports`` () =
    let calls = ResizeArray<string>()

    let ports: OseBe.Contexts.Messaging.Infrastructure.JetStreamDemoPorts =
        { EnsureStream =
            fun () ->
                calls.Add("stream")
                Task.CompletedTask
          EnsureConsumer =
            fun () ->
                calls.Add("consumer")
                Task.CompletedTask
          Publish =
            fun () ->
                calls.Add("publish")
                Task.CompletedTask
          ReceiveAndAcknowledge =
            fun () ->
                calls.Add("receive-and-ack")
                Task.FromResult true }

    let result =
        OseBe.Contexts.Messaging.Infrastructure.runDemoWith ports
        |> Async.AwaitTask
        |> Async.RunSynchronously

    Assert.Equal(DeliveredAndAcked, result)
    Assert.Equal<string list>([ "stream"; "consumer"; "publish"; "receive-and-ack" ], List.ofSeq calls)

// @scenario specs/apps/ose/be/behaviours/messaging/live/jetstream-demo.feature: Messaging status endpoint reports the startup demo message delivered and acked
[<Fact>]
let ``the startup demo outcome is reported as delivered and acked on the status endpoint`` () =
    let ports: OseBe.Contexts.Messaging.Infrastructure.JetStreamDemoPorts =
        { EnsureStream = fun () -> Task.CompletedTask
          EnsureConsumer = fun () -> Task.CompletedTask
          Publish = fun () -> Task.CompletedTask
          ReceiveAndAcknowledge = fun () -> Task.FromResult true }

    let outcome =
        OseBe.Contexts.Messaging.Infrastructure.runDemoWith ports
        |> Async.AwaitTask
        |> Async.RunSynchronously

    let status = newShared ()
    status.Set outcome
    let client = buildClient (routes status)
    let body = client.GetStringAsync("/api/v1/system/status/messaging").Result

    Assert.Contains("delivered_and_acked", body)
