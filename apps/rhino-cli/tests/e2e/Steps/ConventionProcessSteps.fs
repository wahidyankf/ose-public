module RhinoCli.Tests.E2E.Steps.ConventionProcessSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/convention/convention-audit.feature"
      "specs/apps/rhino/cli/behaviours/convention/repo-governance-license-audit.feature" ]

open System
open System.Diagnostics
open System.IO
open TickSpec
open Xunit

let private repositoryRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

let private executable =
    Path.Combine(repositoryRoot, "apps/rhino-cli/src/dist/rhino-cli-fsharp")

/// A delegated command starts `./rhino` in the temp repository; this no-op
/// stand-in keeps the remaining convention scenarios independent of RHINO.
let private stubRhino (root: string) =
    let path = Path.Combine(root, "rhino")
    File.WriteAllText(path, "#!/bin/sh\nexit 0\n")

    File.SetUnixFileMode(
        path,
        UnixFileMode.UserRead
        ||| UnixFileMode.UserWrite
        ||| UnixFileMode.UserExecute
        ||| UnixFileMode.GroupRead
        ||| UnixFileMode.GroupExecute
        ||| UnixFileMode.OtherRead
        ||| UnixFileMode.OtherExecute
    )

let private initialize root =
    Directory.CreateDirectory root |> ignore

    let info =
        ProcessStartInfo(FileName = "git", WorkingDirectory = root, UseShellExecute = false)

    info.ArgumentList.Add("init")
    info.ArgumentList.Add("--quiet")
    use commandProcess = Process.Start info
    commandProcess.WaitForExit()
    Assert.Equal(0, commandProcess.ExitCode)
    stubRhino root

let private invoke root arguments =
    let info =
        ProcessStartInfo(
            FileName = executable,
            WorkingDirectory = root,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        )

    arguments |> List.iter info.ArgumentList.Add
    use commandProcess = Process.Start info
    let stdout = commandProcess.StandardOutput.ReadToEnd()
    let stderr = commandProcess.StandardError.ReadToEnd()
    commandProcess.WaitForExit()
    commandProcess.ExitCode, stdout + stderr

type ConventionProcessSteps() =
    let root =
        Path.Combine(Path.GetTempPath(), "rhino-convention-e2e-" + Guid.NewGuid().ToString("N"))

    let mutable target = "."
    let mutable exitCode = 0
    let mutable output = ""

    do initialize root

    let write (relative: string) (content: string) =
        let path = Path.Combine(root, relative)
        Directory.CreateDirectory(Path.GetDirectoryName(path)) |> ignore
        File.WriteAllText(path, content)

    let run (arguments: string list) =
        let code, text = invoke root arguments
        exitCode <- code
        output <- text

    let missing (directory: string) =
        Directory.CreateDirectory(Path.Combine(root, directory)) |> ignore

    [<Given>]
    member _.``a repository where every required directory has a matching MIT LICENSE file``() =
        write "apps/foo/LICENSE" "MIT License\n"
        write "libs/bar/LICENSE" "MIT License\n"
        write "specs/LICENSE" "MIT License\n"

    [<Given>]
    member _.``a repository where one app directory is missing its LICENSE file``() = missing "apps/foo"

    [<Given>]
    member _.``a repository where one lib directory is missing its LICENSE file``() = missing "libs/bar"

    [<Given>]
    member _.``a repository where a LICENSING-NOTICE.md table row claims a license that disagrees with the on-disk LICENSE file``
        ()
        =
        write "apps/foo/LICENSE" "MIT License\n"
        write "LICENSING-NOTICE.md" "| Path | License |\n| --- | --- |\n| apps/foo | Apache-2.0 |\n"

    [<When>]
    member _.``the developer runs convention license validate``() =
        run [ "convention"; "license"; "validate" ]

    [<When>]
    member _.``the developer runs "rhino-cli convention audit"``() = run [ "convention"; "audit" ]

    [<Then>]
    member _.``the command exits successfully``() = Assert.Equal(0, exitCode)

    [<Then>]
    member _.``the command exits with a failure code``() = Assert.NotEqual(0, exitCode)

    [<Then>]
    member _.``the output reports zero license findings``() = Assert.Contains("no findings", output)

    [<Then>]
    member _.``the output identifies the missing LICENSE app directory``() = Assert.Contains("apps/foo", output)

    [<Then>]
    member _.``the output identifies the missing LICENSE lib directory``() = Assert.Contains("libs/bar", output)

    [<Then>]
    member _.``the output identifies the SPDX mismatch``() =
        Assert.Contains("spdx-mismatch", output)

    [<Then>]
    member _.``the output names the failing "(.*)" validator``(name: string) = Assert.Contains(name + ":", output)

    [<AfterScenario>]
    member _.Cleanup() =
        if Directory.Exists root then
            Directory.Delete(root, true)

module private FeatureRunner =
    let private root =
        Path.Combine(repositoryRoot, "specs/apps/rhino/cli/behaviours/convention")

    let run file title =
        let path = Path.Combine(root, file)
        let lines = File.ReadAllLines(path)

        let feature =
            lines |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:"))

        let start =
            lines |> Array.findIndex (fun line -> line.Trim() = "Scenario: " + title)

        let finish =
            lines
            |> Array.skip (start + 1)
            |> Array.tryFindIndex (fun line -> line.TrimStart().StartsWith("Scenario:"))
            |> Option.map (fun offset -> start + 1 + offset)
            |> Option.defaultValue lines.Length

        let generated =
            StepDefinitions([| typeof<ConventionProcessSteps> |])
                .GenerateFeature(path, Array.append [| feature; "" |] lines.[start .. finish - 1])

        (Seq.exactlyOne generated.Scenarios).Action.Invoke()

[<Theory>]
[<InlineData("convention-audit.feature", "A missing LICENSE fails the aggregate convention audit")>]
[<InlineData("repo-governance-license-audit.feature",
             "Clean repository where every app/lib/specs has matching LICENSE passes")>]
[<InlineData("repo-governance-license-audit.feature", "App directory missing LICENSE file fails")>]
[<InlineData("repo-governance-license-audit.feature", "Lib directory missing LICENSE file fails")>]
[<InlineData("repo-governance-license-audit.feature", "LICENSING-NOTICE.md table row mismatching SPDX in LICENSE fails")>]
let ``convention commands cross the published process boundary`` file title = FeatureRunner.run file title
