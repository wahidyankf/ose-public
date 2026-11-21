module OseBe.Tests.Unit.Tests.WebAppTests

open System.Net
open Xunit
open OseBe.WebApp
open OseBe.Tests.Unit.Steps.BddState

/// Every bounded-context route is composed into `webApp`; a request that
/// matches none of them proves the final `NOT_FOUND` fallback in the real
/// composition root is reachable, rather than dead code.
[<Fact>]
let ``an unmatched path falls through to 404`` () =
    let client = buildClient webApp
    let resp = client.GetAsync("/totally-unmatched-path").Result
    Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode)

// @scenario specs/apps/ose/be/behaviours/db/migrations.feature: Unknown route returns 404 Not Found
[<Fact>]
let ``an unknown api route returns 404 Not Found`` () =
    let client = buildClient webApp
    let resp = client.GetAsync("/api/v1/unknown-route").Result
    let body = resp.Content.ReadAsStringAsync().Result

    Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode)
    Assert.Contains("Not Found", body)
