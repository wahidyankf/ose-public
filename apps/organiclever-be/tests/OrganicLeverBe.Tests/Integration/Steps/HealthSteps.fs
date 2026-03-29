module OrganicLeverBe.Tests.Integration.Steps.HealthSteps

open System.Text.Json
open TickSpec
open Xunit
open OrganicLeverBe.Tests.State
open OrganicLeverBe.Tests.Integration.Steps.CommonSteps

let private doHealthRequest (state: StepState) =
    let response =
        state.HttpClient.GetAsync("/api/v1/health")
        |> Async.AwaitTask
        |> Async.RunSynchronously

    let body =
        response.Content.ReadAsStringAsync()
        |> Async.AwaitTask
        |> Async.RunSynchronously

    let status = int response.StatusCode
    applyResult status body state

[<When>]
let ``an operations engineer sends GET /health`` (state: StepState) = doHealthRequest state

[<When>]
let ``an unauthenticated engineer sends GET /health`` (state: StepState) = doHealthRequest state

[<Then>]
let ``the health status should be "(.+)"`` (status: string) (state: StepState) =
    let doc = JsonDocument.Parse(state.ResponseBody.Value)
    let actual = doc.RootElement.GetProperty("status").GetString()
    Assert.Equal(status, actual)
    state

[<Then>]
let ``the response should not include detailed component health information`` (state: StepState) =
    let doc = JsonDocument.Parse(state.ResponseBody.Value)
    let mutable hasComponents = false

    for prop in doc.RootElement.EnumerateObject() do
        if prop.Name = "components" || prop.Name = "details" then
            hasComponents <- true

    Assert.False(hasComponents, "Response should not include component details")
    state
