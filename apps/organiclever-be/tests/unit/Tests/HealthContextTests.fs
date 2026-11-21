module OrganicleverBe.Tests.Unit.Tests.HealthContextTests

open System.Net
open Xunit
open OrganicleverBe.Contexts.Health.Application
open OrganicleverBe.Contexts.Health.Api
open OrganicleverBe.Tests.Unit.Steps.BddState

[<Fact>]
let ``the health context declares it has no infrastructure dependencies`` () =
    Assert.False(OrganicleverBe.Contexts.Health.Infrastructure.hasInfrastructureDependencies)

[<Fact>]
let ``getHealth reports healthy`` () =
    let status = getHealth ()
    Assert.Equal("ok", status.Status)

// @scenario specs/apps/organiclever/be/behaviours/health/health-check.feature: GET /api/v1/health reports the service as ok
[<Fact>]
let ``health context route returns 200 JSON`` () =
    let client = buildClient routes
    let resp = client.GetAsync("/api/v1/health").Result
    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("\"status\"", body)
    Assert.Contains("ok", body)
