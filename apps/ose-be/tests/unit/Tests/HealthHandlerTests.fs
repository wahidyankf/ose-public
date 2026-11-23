module OseBe.Tests.Unit.Tests.HealthHandlerTests

open System.Net
open Xunit
open OseBe.Contexts.Health.Application
open OseBe.WebApp
open OseBe.Tests.Unit.Steps.BddState

[<Fact>]
let ``get health returns healthy status`` () =
    let status = getHealth ()
    Assert.Equal("healthy", status.Status)

// @scenario specs/apps/ose/be/behaviours/health/health.feature: Health endpoint returns 200
[<Fact>]
let ``health route returns 200`` () =
    let client = buildClient webApp
    let resp = client.GetAsync("/api/v1/health").Result
    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)

// @scenario specs/apps/ose/be/behaviours/health/health.feature: Health endpoint returns 200
[<Fact>]
let ``health route returns JSON status healthy`` () =
    let client = buildClient webApp
    let resp = client.GetAsync("/api/v1/health").Result
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("\"status\"", body)
    Assert.Contains("healthy", body)
    Assert.Equal("application/json", resp.Content.Headers.ContentType.MediaType)

[<Fact>]
let ``the health context declares it has no infrastructure dependencies`` () =
    Assert.False(OseBe.Contexts.Health.Infrastructure.hasInfrastructureDependencies ())
