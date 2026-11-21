module OseBe.Tests.Unit.Tests.EnvTierTests

open System.Collections.Generic
open Xunit
open FsharpEnvLoader.EnvTier
open OseBe.Contexts.Config.Infrastructure

[<Fact>]
let ``loadEnvTierWith probes the ose-be composition root before cwd`` () =
    let probes = ResizeArray<string>()
    let environment = Dictionary<string, string>()
    environment["APP_ENV"] <- "test"

    let ports: EnvTierPorts =
        { GetEnvironmentVariable =
            fun key ->
                if environment.ContainsKey key then
                    environment[key]
                else
                    null
          SetEnvironmentVariable = fun key value -> environment[key] <- value
          FileExists =
            fun path ->
                probes.Add(path.Replace('\\', '/'))
                false
          ReadLines = fun _ -> Seq.empty
          CombinePath = fun directory fileName -> $"{directory.Replace('\\', '/')}/{fileName}" }

    loadEnvTierWith ports

    Assert.Equal<string list>([ "apps/ose-be/.env.test"; "./.env.test" ], List.ofSeq probes)

[<Fact>]
let ``loadEnvTierWith applies the first matching composition-root file`` () =
    let environment = Dictionary<string, string>()
    environment["APP_ENV"] <- "local"

    let ports: EnvTierPorts =
        { GetEnvironmentVariable =
            fun key ->
                if environment.ContainsKey key then
                    environment[key]
                else
                    null
          SetEnvironmentVariable = fun key value -> environment[key] <- value
          FileExists = fun path -> path.Replace('\\', '/') = "apps/ose-be/.env.local"
          ReadLines = fun _ -> seq { "SOURCE=ose-be" }
          CombinePath = fun directory fileName -> $"{directory.Replace('\\', '/')}/{fileName}" }

    loadEnvTierWith ports

    Assert.Equal("ose-be", environment["SOURCE"])

[<Fact>]
let ``loadEnvTierWith keeps a process environment value over the tier file value`` () =
    let environment = Dictionary<string, string>()
    environment["APP_ENV"] <- "local"
    environment["VALUE"] <- "process-value"

    let ports: EnvTierPorts =
        { GetEnvironmentVariable =
            fun key ->
                if environment.ContainsKey key then
                    environment[key]
                else
                    null
          SetEnvironmentVariable = fun key value -> environment[key] <- value
          FileExists = fun path -> path.Replace('\\', '/') = "apps/ose-be/.env.local"
          ReadLines = fun _ -> seq { "VALUE=file-value" }
          CombinePath = fun directory fileName -> $"{directory.Replace('\\', '/')}/{fileName}" }

    loadEnvTierWith ports

    Assert.Equal("process-value", environment["VALUE"])

[<Fact>]
let ``loadEnvTierWith tolerates a missing tier file`` () =
    let environment = Dictionary<string, string>()
    environment["APP_ENV"] <- "test"
    environment["EXISTING"] <- "preserved"
    let reads = ResizeArray<string>()

    let ports: EnvTierPorts =
        { GetEnvironmentVariable =
            fun key ->
                if environment.ContainsKey key then
                    environment[key]
                else
                    null
          SetEnvironmentVariable = fun key value -> environment[key] <- value
          FileExists = fun _ -> false
          ReadLines =
            fun path ->
                reads.Add path
                Seq.empty
          CombinePath = fun directory fileName -> $"{directory.Replace('\\', '/')}/{fileName}" }

    loadEnvTierWith ports

    Assert.Equal("preserved", environment["EXISTING"])
    Assert.Empty(reads)
