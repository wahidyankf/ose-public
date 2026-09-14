/// Public-process proof for the externally observable repo-config path rule.
module RhinoCli.Tests.E2E.Steps.RepoConfigProcessSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/repo-config/data-driven.feature" ]

open System
open System.Diagnostics
open System.IO
open TickSpec
open Xunit

let private repositoryRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

let private executable =
    Path.Combine(repositoryRoot, "apps/rhino-cli/src/dist/rhino-cli-fsharp")

/// `repo-config validate` is a split command that starts `./rhino` at the
/// repository root before its F# remainder; this no-op stand-in lets the
/// scenarios exercise that remainder.
let private stubRhino (root: string) =
    let path = Path.Combine(root, "rhino")
    File.WriteAllText(path, "#!/bin/sh\nexit 0\n")

    File.SetUnixFileMode(path, UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute)

type RepoConfigProcessSteps() =
    let root =
        Path.Combine(Path.GetTempPath(), "rhino-repo-config-e2e-" + Guid.NewGuid().ToString("N"))

    let mutable exitCode = 0
    let mutable output = ""

    do
        Directory.CreateDirectory root |> ignore

        let info =
            ProcessStartInfo(FileName = "git", WorkingDirectory = root, UseShellExecute = false)

        info.ArgumentList.Add "init"
        info.ArgumentList.Add "--quiet"
        use proc = Process.Start info
        proc.WaitForExit()
        Assert.Equal(0, proc.ExitCode)
        stubRhino root

    [<Given>]
    member _.``repo-config.yml declares a doctor .NET SDK path with a leading ./ segment``() =
        File.WriteAllText(
            Path.Combine(root, "repo-config.yml"),
            "doctor:\n  dotnet-global-json: ./tooling/sdk/global.json\n"
        )

    [<When>]
    member _.``repo-config validate runs``() =
        let info =
            ProcessStartInfo(
                FileName = executable,
                WorkingDirectory = root,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            )

        info.ArgumentList.Add "repo-config"
        info.ArgumentList.Add "validate"
        use proc = Process.Start info
        let stdout = proc.StandardOutput.ReadToEnd()
        let stderr = proc.StandardError.ReadToEnd()
        proc.WaitForExit()
        exitCode <- proc.ExitCode
        output <- stdout + stderr

    [<Then>]
    member _.``it rejects the value naming the current-directory component``() =
        Assert.NotEqual(0, exitCode)
        Assert.Contains("current-directory", output)

    [<AfterScenario>]
    member _.Cleanup() =
        if Directory.Exists root then
            Directory.Delete(root, true)

module private FeatureRunner =
    let run () =
        let lines =
            [| "Feature: Repo-specific behaviour is data-driven from repo-config.yml"
               ""
               "Scenario: A leading ./ in a configured path is rejected"
               "  Given repo-config.yml declares a doctor .NET SDK path with a leading ./ segment"
               "  When repo-config validate runs"
               "  Then it rejects the value naming the current-directory component" |]

        let feature =
            StepDefinitions([| typeof<RepoConfigProcessSteps> |]).GenerateFeature("data-driven.feature", lines)

        (Seq.exactlyOne feature.Scenarios).Action.Invoke()

[<Fact>]
let ``A leading ./ in a configured path is rejected`` () = FeatureRunner.run ()
