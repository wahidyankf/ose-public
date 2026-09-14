/// Public-process E2E bindings for Rhino's git and pre-commit Markdown
/// behaviours. Every When crosses the published executable boundary against
/// an isolated synthetic git repository.
module RhinoCli.Tests.E2E.Steps.GitProcessSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/git/git-lockfile.feature"
      "specs/apps/rhino/cli/behaviours/git/git-pre-commit.feature" ]

open System
open System.Diagnostics
open System.IO
open TickSpec
open Xunit

type private RunResult =
    { ExitCode: int
      Stdout: string
      Stderr: string }

let private repositoryRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

let private executable =
    Path.Combine(repositoryRoot, "apps", "rhino-cli", "src", "dist", "rhino-cli-fsharp")

let private isolatedGitEnvironment root =
    [ "GIT_DIR", Path.Combine(root, ".git")
      "GIT_CEILING_DIRECTORIES", root
      "GIT_CONFIG_GLOBAL", "/dev/null"
      "GIT_CONFIG_SYSTEM", "/dev/null" ]

let private runProcess executableName args workingDirectory environment =
    let info =
        ProcessStartInfo(
            FileName = executableName,
            WorkingDirectory = workingDirectory,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        )

    args |> List.iter info.ArgumentList.Add
    environment |> List.iter (fun (key, value) -> info.Environment.[key] <- value)
    use proc = Process.Start info
    let stdout = proc.StandardOutput.ReadToEnd()
    let stderr = proc.StandardError.ReadToEnd()
    proc.WaitForExit()

    { ExitCode = proc.ExitCode
      Stdout = stdout
      Stderr = stderr }

let private runGit root args =
    let result = runProcess "git" args root (isolatedGitEnvironment root)
    Assert.True(result.ExitCode = 0, sprintf "git %s failed: %s" (String.concat " " args) result.Stderr)
    result.Stdout

let private write (root: string) (relativePath: string) (content: string) =
    let absolutePath = Path.Combine(root, relativePath)
    Directory.CreateDirectory(Path.GetDirectoryName absolutePath) |> ignore
    File.WriteAllText(absolutePath, content)

/// `md links validate` is a split command that starts `./rhino` at the
/// repository root before its F# remainder; this no-op stand-in lets the
/// scenarios exercise that remainder.
let private stubRhino (root: string) =
    let path = Path.Combine(root, "rhino")
    File.WriteAllText(path, "#!/bin/sh\nexit 0\n")

    File.SetUnixFileMode(path, UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute)

type GitProcessSteps() =
    let root =
        Path.Combine(Path.GetTempPath(), "rhino-cli-git-e2e-" + Guid.NewGuid().ToString("N"))

    let mutable targetFile = ""
    let mutable lockfilePath = ""
    let mutable lockfileBefore = ""
    let mutable stagedBefore: string list = []
    let mutable result: RunResult option = None

    do
        Directory.CreateDirectory root |> ignore
        runGit root [ "init"; "-q"; "-b"; "main" ] |> ignore
        stubRhino root

    let stagedFiles () =
        (runGit root [ "diff"; "--cached"; "--name-only" ]).Split('\n', StringSplitOptions.RemoveEmptyEntries)
        |> Array.toList

    let invoke args =
        stagedBefore <- stagedFiles ()
        result <- Some(runProcess executable args root (isolatedGitEnvironment root))

    let combinedOutput () =
        result
        |> Option.map (fun value -> value.Stdout + value.Stderr)
        |> Option.defaultValue ""

    let setApp name manifestVersion lockVersion =
        let appDir = "apps/" + name
        targetFile <- appDir + "/package.json"
        lockfilePath <- appDir + "/package-lock.json"
        write root targetFile (sprintf "{\"name\":\"%s\",\"version\":\"%s\"}\n" name manifestVersion)

        lockfileBefore <-
            sprintf
                "{\"name\":\"%s\",\"version\":\"%s\",\"lockfileVersion\":3,\"packages\":{\"\":{\"name\":\"%s\",\"version\":\"%s\"}}}\n"
                name
                lockVersion
                name
                lockVersion

        write root lockfilePath lockfileBefore
        runGit root [ "add"; targetFile ] |> ignore

    [<Given>]
    member _.``a staged app package.json whose version disagrees with its package-lock.json``() =
        setApp "sample-app" "1.1.0" "1.0.0"

    [<Given>]
    member _.``a staged app package.json whose fields already agree with its package-lock.json``() =
        setApp "current-app" "1.1.0" "1.1.0"

    [<Given>]
    member _.``no app package.json file is staged``() =
        targetFile <- "README.md"
        write root targetFile "# Repository\n"
        runGit root [ "add"; targetFile ] |> ignore

    [<When>]
    member _.``the developer runs "git lockfile sync"``() = invoke [ "git"; "lockfile"; "sync" ]

    [<Then>]
    member _.``the command regenerates the app's package-lock.json to match the manifest``() =
        let after = File.ReadAllText(Path.Combine(root, lockfilePath))
        Assert.Contains("\"version\": \"1.1.0\"", after)
        Assert.NotEqual<string>(lockfileBefore, after)

    [<Then>]
    member _.``the regenerated package-lock.json is staged``() =
        Assert.Contains(lockfilePath, stagedFiles ())

    [<Then>]
    member _.``the command exits successfully``() = Assert.Equal(0, result.Value.ExitCode)

    [<Then>]
    member _.``the output reports no lockfile was synced``() =
        Assert.DoesNotContain("Syncing", combinedOutput ())

    [<Then>]
    member _.``the package-lock.json file is not modified``() =
        Assert.Equal(lockfileBefore, File.ReadAllText(Path.Combine(root, lockfilePath)))

    [<Then>]
    member _.``the output is empty``() = Assert.Equal("", combinedOutput ())

    [<Then>]
    member _.``the staged file set is unchanged``() =
        Assert.Equal<string list>(stagedBefore, stagedFiles ())

    [<Given>]
    member _.``staged markdown files contain a link to a non-existent target``() =
        targetFile <- "docs/index.md"
        write root targetFile "# Index\nSee ![missing](./does-not-exist.png).\n"
        runGit root [ "add"; targetFile ] |> ignore

    [<Given>]
    member _.``a staged markdown file under docs containing a mermaid diagram with a label exceeding the maximum length``
        ()
        =
        targetFile <- "docs/diagram.md"

        write
            root
            targetFile
            "# Diagram\n\n```mermaid\nflowchart TD\n    A[This label is definitely longer than thirty characters total]\n```\n"

        runGit root [ "add"; targetFile ] |> ignore

    [<Given>]
    member _.``a staged markdown file under plans/done containing a broken internal link``() =
        targetFile <- "plans/done/2024-01-01__old/notes.md"
        write root "repo-config.yml" "md-internal-link:\n  exclude-sources:\n    - 'plans/done/**'\n"
        write root targetFile "# Notes\nSee ![missing](./does-not-exist.png).\n"
        runGit root [ "add"; targetFile ] |> ignore

    [<When>]
    member _.``the pre-commit hook runs md links validate on staged files``() =
        // The remainder reads its source exclusions from repo-config.yml, as RHINO does.
        invoke [ "md"; "links"; "validate" ]

    [<When>]
    member _.``the pre-commit hook runs md mermaid validate on the staged file``() =
        // RHINO owns the default label limit; the strict pre-commit gate passes --max-label-len 20.
        invoke [ "md"; "mermaid"; "validate"; "--staged-only"; "--max-label-len"; "20" ]

    [<Then>]
    member _.``the command exits with a failure code``() =
        Assert.NotEqual(0, result.Value.ExitCode)

    [<Then>]
    member _.``the stderr output identifies the source file containing the broken link``() =
        Assert.Contains(targetFile, combinedOutput ())

    [<Then>]
    member _.``the stderr output identifies the line number of the broken link``() =
        Assert.Contains("Line 2", combinedOutput ())

    [<Then>]
    member _.``the stderr output identifies the broken link target``() =
        Assert.Contains("./does-not-exist.png", combinedOutput ())

    [<Then>]
    member _.``the output indicates a mermaid violation was found``() =
        Assert.Contains("violation", combinedOutput (), StringComparison.OrdinalIgnoreCase)

    [<Then>]
    member _.``the link validation step does not report a broken link for the plans/done file``() =
        Assert.Equal(0, result.Value.ExitCode)
        Assert.DoesNotContain(targetFile, combinedOutput ())

    [<AfterScenario>]
    member _.Cleanup() =
        if Directory.Exists root then
            Directory.Delete(root, true)

module private FeatureRunner =
    let private runFeature featureName scenarioTitle =
        let featurePath =
            Path.Combine(repositoryRoot, "specs", "apps", "rhino", "cli", "behaviours", "git", featureName)

        let lines = File.ReadAllLines featurePath

        let featureLine =
            lines |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:"))

        let header = "Scenario: " + scenarioTitle
        let startIndex = lines |> Array.findIndex (fun line -> line.Trim() = header)

        let endIndex =
            lines
            |> Array.skip (startIndex + 1)
            |> Array.tryFindIndex (fun line -> line.TrimStart().StartsWith("Scenario:"))
            |> Option.map (fun offset -> startIndex + 1 + offset)
            |> Option.defaultValue lines.Length

        let snippet = Array.append [| featureLine; "" |] lines.[startIndex .. endIndex - 1]
        let definitions = StepDefinitions([| typeof<GitProcessSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)
        let scenario = Seq.exactlyOne feature.Scenarios
        scenario.Action.Invoke()

    let runLockfile = runFeature "git-lockfile.feature"
    let runPreCommit = runFeature "git-pre-commit.feature"

[<Theory>]
[<InlineData("A staged package manifest with a stale lockfile is regenerated and staged")>]
[<InlineData("A staged package manifest whose lockfile is already current is left untouched")>]
[<InlineData("No staged app package.json means no lockfile work")>]
let ``lockfile scenario crosses the published CLI boundary`` scenario = FeatureRunner.runLockfile scenario

[<Theory>]
[<InlineData("Broken-link detection in step 7 reports per-link details")>]
[<InlineData("staged-mermaid-blocks — staged malformed mermaid diagram blocks commit")>]
[<InlineData("link-step-honors-exclusions — staged plans/done broken link does not block commit")>]
let ``pre-commit scenario crosses the published CLI boundary`` scenario = FeatureRunner.runPreCommit scenario
