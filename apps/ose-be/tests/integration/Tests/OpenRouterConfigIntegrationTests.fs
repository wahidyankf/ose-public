module OseBe.Tests.Integration.Tests.OpenRouterConfigIntegrationTests

open System
open Xunit
open OseBe.Infrastructure.OpenRouterClient

let private withOpenRouterEnv (body: unit -> unit) =
    let names =
        [ "OSE_BE_OPENROUTER_API_KEY"
          "OSE_BE_OPENROUTER_MODEL"
          "OSE_BE_OPENROUTER_BASE_URL" ]

    let previous =
        names |> List.map (fun name -> name, Environment.GetEnvironmentVariable name)

    try
        names |> List.iter (fun name -> Environment.SetEnvironmentVariable(name, null))
        body ()
    finally
        previous
        |> List.iter (fun (name, value) -> Environment.SetEnvironmentVariable(name, value))

[<Fact>]
let ``real environment adapter loads configured OpenRouter values`` () =
    withOpenRouterEnv (fun () ->
        Environment.SetEnvironmentVariable("OSE_BE_OPENROUTER_API_KEY", "sk-integration")
        Environment.SetEnvironmentVariable("OSE_BE_OPENROUTER_MODEL", "openrouter/integration")
        Environment.SetEnvironmentVariable("OSE_BE_OPENROUTER_BASE_URL", "https://example.invalid/v1")

        let config = loadConfig ()

        Assert.Equal("sk-integration", config.ApiKey)
        Assert.Equal("openrouter/integration", config.Model)
        Assert.Equal("https://example.invalid/v1", config.BaseUrl))

// @scenario specs/apps/ose/be/behaviours/ai-orchestration/ai-orchestration.feature: OpenRouter settings fall back to their defaults when unset
[<Fact>]
let ``real environment adapter falls back to the documented defaults when unset`` () =
    withOpenRouterEnv (fun () ->
        let config = loadConfig ()

        Assert.Equal("", config.ApiKey)
        Assert.Equal("openrouter/auto", config.Model)
        Assert.Equal("https://openrouter.ai/api/v1", config.BaseUrl)
        Assert.False(isConfigured config))
