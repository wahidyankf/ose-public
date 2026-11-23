module OseBe.Tests.Unit.Tests.AiOrchestrationTests

open System.Net
open Xunit
open OseBe.Contexts.AiOrchestration.Application
open OseBe.Contexts.AiOrchestration.Domain
open OseBe.Contexts.AiOrchestration.Api
open OseBe.Contexts.AiOrchestration.Infrastructure
open OseBe.Tests.Unit.Steps.BddState

[<Fact>]
let ``ai-orchestration reports ready to wrap LLM calls via OpenRouter`` () =
    let readiness = initializeContext ()
    Assert.Equal(ContextReadiness.Ready, readiness.State)
    Assert.Contains("OpenRouter", readiness.Capability)

// @scenario specs/apps/ose/be/behaviours/ai-orchestration/ai-orchestration.feature: GET /api/v1/ai-orchestration/status reports the context ready
[<Fact>]
let ``ai-orchestration status endpoint reports the context readiness`` () =
    let client = buildClient routes
    let resp = client.GetAsync("/api/v1/ai-orchestration/status").Result
    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("Ready", body)
    Assert.Contains("OpenRouter", body)

// isLlmConfigured and completion read the ambient OSE_BE_OPENROUTER_API_KEY,
// which the test process never sets (see apps/ose-be/.env.example, which
// defaults it to blank); OpenRouterClientTests.fs owns direct mutation of that
// variable, so this asserts the same not-configured behaviour without touching
// process-wide environment state itself.
[<Fact>]
let ``ai-orchestration reports the LLM integration is not configured by default`` () = Assert.False(isLlmConfigured ())

[<Fact>]
let ``completion returns an error when no OpenRouter API key is configured`` () =
    let result = completion "prompt" |> Async.AwaitTask |> Async.RunSynchronously

    match result with
    | Error message -> Assert.Contains("not configured", message)
    | Ok _ -> Assert.Fail("expected Error when no API key is configured")
