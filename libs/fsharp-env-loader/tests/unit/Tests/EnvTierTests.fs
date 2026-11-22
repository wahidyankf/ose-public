module FsharpEnvLoader.Tests.Unit.Tests.EnvTierTests

open Xunit
open FsharpEnvLoader.EnvTier

[<Fact>]
let ``resolveTierWith defaults to local without APP_ENV`` () =
    Assert.Equal("local", resolveTierWith (fun _ -> null))

[<Fact>]
let ``resolveTierWith preserves a selected tier`` () =
    Assert.Equal("stag", resolveTierWith (fun key -> if key = "APP_ENV" then "stag" else null))

[<Fact>]
let ``loadEnvTierFromWith uses injected environment and filesystem ports`` () =
    let mutable environment = Map.ofList [ "APP_ENV", "test" ]
    let mutable reads: string list = []

    let ports =
        { GetEnvironmentVariable = fun key -> environment |> Map.tryFind key |> Option.defaultValue null
          SetEnvironmentVariable = fun key value -> environment <- environment.Add(key, value)
          FileExists = fun path -> path = "root/.env.test"
          ReadLines =
            fun path ->
                reads <- path :: reads
                seq { "VALUE=from-file" }
          CombinePath = fun directory fileName -> $"{directory}/{fileName}" }

    loadEnvTierFromWith ports [ "root" ]

    Assert.Equal("from-file", environment["VALUE"])
    Assert.Equal<string list>([ "root/.env.test" ], reads)

[<Fact>]
let ``resolveTier always names a usable tier`` () =
    // The tier comes from the real process environment, which this test
    // never touches: whatever APP_ENV holds (or its absence), the loader
    // contract resolves a non-empty tier, defaulting to "local".
    Assert.False(System.String.IsNullOrEmpty(resolveTier ()))

[<Fact>]
let ``loadEnvTierFrom does nothing when no tier file exists`` () =
    // Rule 4 through the real entry point: a search with no tier file on
    // disk is not an error. The directory never exists, so the check
    // performs no write and changes no state.
    loadEnvTierFrom [ "fsharp-env-loader-no-such-dir" ]

[<Fact>]
let ``loadEnvTierFromWith preserves an existing environment value`` () =
    let mutable environment = Map.ofList [ "APP_ENV", "test"; "VALUE", "from-process" ]

    let ports =
        { GetEnvironmentVariable = fun key -> environment |> Map.tryFind key |> Option.defaultValue null
          SetEnvironmentVariable = fun key value -> environment <- environment.Add(key, value)
          FileExists = fun _ -> true
          ReadLines = fun _ -> seq { "VALUE=from-file" }
          CombinePath = fun directory fileName -> $"{directory}/{fileName}" }

    loadEnvTierFromWith ports [ "root" ]

    Assert.Equal("from-process", environment["VALUE"])
