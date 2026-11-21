module OseBe.Tests.Unit.Tests.GapAnalysisTests

open System.Net
open Xunit
open OseBe.Contexts.GapAnalysis.Application
open OseBe.Contexts.GapAnalysis.Domain
open OseBe.Contexts.GapAnalysis.Api
open OseBe.Contexts.GapAnalysis.Infrastructure
open OseBe.Tests.Unit.Steps.BddState

[<Fact>]
let ``gap-analysis reports ready to compare regulatory and policy documents`` () =
    let readiness = initializeContext ()
    Assert.Equal(ContextReadiness.Ready, readiness.State)
    Assert.Contains("compare", readiness.Capability)

// @scenario specs/apps/ose/be/behaviours/gap-analysis/gap-analysis.feature: GET /api/v1/gap-analysis/status reports the context ready
[<Fact>]
let ``gap-analysis status endpoint reports the context readiness`` () =
    let client = buildClient routes
    let resp = client.GetAsync("/api/v1/gap-analysis/status").Result
    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("Ready", body)
    Assert.Contains("compare", body)

// isLlmConfigured and compareWithLlm read the ambient OSE_BE_OPENROUTER_API_KEY,
// which the test process never sets (see apps/ose-be/.env.example, which
// defaults it to blank); OpenRouterClientTests.fs owns direct mutation of that
// variable, so this asserts the same not-configured behaviour without touching
// process-wide environment state itself.
[<Fact>]
let ``gap-analysis reports the LLM integration is not configured by default`` () = Assert.False(isLlmConfigured ())

[<Fact>]
let ``compareWithLlm returns an error when no OpenRouter API key is configured`` () =
    let result = compareWithLlm "prompt" |> Async.AwaitTask |> Async.RunSynchronously

    match result with
    | Error message -> Assert.Contains("not configured", message)
    | Ok _ -> Assert.Fail("expected Error when no API key is configured")
