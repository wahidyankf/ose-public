module OrganicLeverBe.Tests.Integration.Steps.CommonSteps

open System.Text.Json
open TickSpec
open Xunit
open OrganicLeverBe.Tests.State

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

let private opts = JsonSerializerOptions(PropertyNameCaseInsensitive = true)

let internal getJsonProp (json: string) (prop: string) =
    try
        let doc = JsonDocument.Parse(json)
        let el = doc.RootElement.GetProperty(prop)
        Some el
    with _ ->
        None

let internal getStringProp (json: string) (prop: string) =
    try
        let doc = JsonDocument.Parse(json)
        let el = doc.RootElement.GetProperty(prop)
        Some(el.GetString())
    with _ ->
        None

/// Helper to apply a direct service result to StepState.
let internal applyResult (status: int) (body: string) (state: StepState) : StepState =
    { state with
        Response = Some { Status = status; Body = body }
        ResponseBody = Some body }

// ─────────────────────────────────────────────────────────────────────────────
// Shared background steps
// ─────────────────────────────────────────────────────────────────────────────

[<Given>]
let ``the API is running`` (state: StepState) = state

[<Then>]
let ``the response status code should be (\d+)`` (code: int) (state: StepState) =
    let actual = state.Response.Value.Status
    Assert.Equal(code, actual)
    state

// ─────────────────────────────────────────────────────────────────────────────
// Response body assertion steps
// ─────────────────────────────────────────────────────────────────────────────

[<Then>]
let ``the response body should contain "(.+)" equal to "(.+)"`` (field: string) (expected: string) (state: StepState) =
    let body = state.ResponseBody.Value
    let actual = getStringProp body field
    Assert.True(actual.IsSome, $"Field '{field}' not found in response: {body}")
    Assert.Equal(expected, actual.Value)
    state

[<Then>]
let ``the response body should contain a non-null "(.+)" field`` (field: string) (state: StepState) =
    let body = state.ResponseBody.Value
    let el = getJsonProp body field
    Assert.True(el.IsSome, $"Field '{field}' not found in response: {body}")
    let v = el.Value
    let isNull = v.ValueKind = JsonValueKind.Null
    Assert.False(isNull, $"Field '{field}' is null in response: {body}")
    state

[<Then>]
let ``the response body should contain a new "(.+)"`` (field: string) (state: StepState) =
    let body = state.ResponseBody.Value
    let el = getJsonProp body field
    Assert.True(el.IsSome, $"Field '{field}' not found in response: {body}")
    let v = el.Value
    let isNull = v.ValueKind = JsonValueKind.Null
    Assert.False(isNull, $"Field '{field}' is null in response: {body}")
    state

[<Then>]
let ``the response body should contain an error message about (.+)`` (_topic: string) (state: StepState) =
    let body = state.ResponseBody.Value
    Assert.True(body.Length > 0, $"Response body should not be empty: {body}")
    state
