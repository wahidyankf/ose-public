module OseBe.Tests.Unit.Tests.InternalPolicyTests

open System.Net
open Xunit
open OseBe.Contexts.InternalPolicy.Application
open OseBe.Contexts.InternalPolicy.Domain
open OseBe.Contexts.InternalPolicy.Api
open OseBe.Tests.Unit.Steps.BddState

[<Fact>]
let ``internal-policy reports ready to accept internal policy documents`` () =
    let readiness = initializeContext ()
    Assert.Equal(ContextReadiness.Ready, readiness.State)
    Assert.Contains("internal policy", readiness.Capability)

// @scenario specs/apps/ose/be/behaviours/internal-policy/internal-policy.feature: GET /api/v1/internal-policy/status reports the context ready
[<Fact>]
let ``internal-policy status endpoint reports the context readiness`` () =
    let client = buildClient routes
    let resp = client.GetAsync("/api/v1/internal-policy/status").Result
    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("Ready", body)
    Assert.Contains("internal policy", body)
