module OseBe.Tests.Unit.Tests.RegulatorySourceTests

open System.Net
open Xunit
open OseBe.Contexts.RegulatorySource.Application
open OseBe.Contexts.RegulatorySource.Domain
open OseBe.Contexts.RegulatorySource.Api
open OseBe.Tests.Unit.Steps.BddState

[<Fact>]
let ``regulatory-source reports ready to accept regulatory documents`` () =
    let readiness = initializeContext ()
    Assert.Equal(ContextReadiness.Ready, readiness.State)
    Assert.Contains("regulatory", readiness.Capability)

// @scenario specs/apps/ose/be/behaviours/regulatory-source/regulatory-source.feature: GET /api/v1/regulatory-source/status reports the context ready
[<Fact>]
let ``regulatory-source status endpoint reports the context readiness`` () =
    let client = buildClient routes
    let resp = client.GetAsync("/api/v1/regulatory-source/status").Result
    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("Ready", body)
    Assert.Contains("regulatory", body)
