module OseBe.Tests.Integration.Tests.NatsConfigIntegrationTests

open System
open Xunit
open OseBe.Infrastructure.NatsClient

// @scenario specs/apps/ose/be/behaviours/messaging/nats-config.feature: ose-be fails fast when its NATS URL is missing
[<Fact>]
let ``real process environment reports a missing OSE_BE_NATS_URL clearly`` () =
    let previous = Environment.GetEnvironmentVariable("OSE_BE_NATS_URL")

    try
        Environment.SetEnvironmentVariable("OSE_BE_NATS_URL", null)
        let ex = Assert.Throws<Exception>(fun () -> requireNatsUrl () |> ignore)
        Assert.Contains("OSE_BE_NATS_URL", ex.Message)
    finally
        Environment.SetEnvironmentVariable("OSE_BE_NATS_URL", previous)
