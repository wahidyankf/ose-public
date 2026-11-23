module OrganicleverBe.Tests.Unit.Tests.HealthHandlerTests

open System.Net
open Xunit
open OrganicleverBe.WebApp
open OrganicleverBe.Tests.Unit.Steps.BddState

[<Fact>]
let ``health handler returns 200`` () =
    let client = buildClient webApp
    let resp = client.GetAsync("/health").Result
    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)

// @scenario specs/apps/organiclever/be/behaviours/health/health-check.feature: Anonymous health check reports ok without component details
[<Fact>]
let ``health handler returns JSON status ok`` () =
    let client = buildClient webApp
    let resp = client.GetAsync("/health").Result
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("\"status\"", body)
    Assert.Contains("ok", body)
    Assert.Equal("application/json", resp.Content.Headers.ContentType.MediaType)

// @scenario specs/apps/organiclever/be/behaviours/health/health-check.feature: Anonymous health check reports ok without component details
[<Fact>]
let ``health handler does not expose component details`` () =
    let client = buildClient webApp
    let resp = client.GetAsync("/health").Result
    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.DoesNotContain("database", body)
    Assert.DoesNotContain("components", body)
