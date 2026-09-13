module OseBe.Tests.Unit.Tests.OpenRouterClientTests

open Xunit
open OseBe.Infrastructure.OpenRouterClient
open OseBe.Infrastructure.OpenRouterConnect

let private readEnvironment (values: Map<string, string>) (name: string) : string =
    values |> Map.tryFind name |> Option.defaultValue null

[<Fact>]
let ``loadConfig falls back to documented defaults when unset`` () =
    let config = loadConfigWith (readEnvironment Map.empty)
    Assert.Equal("", config.ApiKey)
    Assert.Equal(DefaultModel, config.Model)
    Assert.Equal(DefaultBaseUrl, config.BaseUrl)

[<Fact>]
let ``loadConfig returns the configured values when set`` () =
    let values =
        Map.ofList
            [ "OSE_BE_OPENROUTER_API_KEY", "sk-test-key"
              "OSE_BE_OPENROUTER_MODEL", "openrouter/custom-model"
              "OSE_BE_OPENROUTER_BASE_URL", "https://example.invalid/v1" ]

    let config = loadConfigWith (readEnvironment values)
    Assert.Equal("sk-test-key", config.ApiKey)
    Assert.Equal("openrouter/custom-model", config.Model)
    Assert.Equal("https://example.invalid/v1", config.BaseUrl)

[<Fact>]
let ``isConfigured is false when the API key is blank`` () =
    Assert.False(
        isConfigured
            { ApiKey = ""
              Model = DefaultModel
              BaseUrl = DefaultBaseUrl }
    )

[<Fact>]
let ``isConfigured is true when the API key is set`` () =
    Assert.True(
        isConfigured
            { ApiKey = "sk-test-key"
              Model = DefaultModel
              BaseUrl = DefaultBaseUrl }
    )

// complete's live-HTTP branches require a real OpenRouter endpoint and are
// excluded from unit coverage (see OpenRouterConnect.fs); this test proves the
// documented not-configured short-circuit, with no network required.
[<Fact>]
let ``complete returns an error without calling the network when no API key is configured`` () =
    let result =
        complete
            { ApiKey = ""
              Model = DefaultModel
              BaseUrl = DefaultBaseUrl }
            "prompt"
        |> Async.AwaitTask
        |> Async.RunSynchronously

    match result with
    | Error message -> Assert.Contains("not configured", message)
    | Ok _ -> Assert.Fail("expected Error when no API key is configured")
