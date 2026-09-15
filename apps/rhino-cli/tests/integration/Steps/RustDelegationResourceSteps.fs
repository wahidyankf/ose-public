/// Integration TickSpec proof for `gate/rust-delegation.feature`: every leaf
/// runs in-process through `Dispatch.route` against a temporary repository
/// whose `./rhino` is a stub shell script, so the real launcher, the real Git
/// index and the real repo-config reader are exercised. A child inherits this
/// process's standard streams, which xunit does not capture, so the stub
/// records what it saw in files beside itself; E2E proves the byte-exact
/// streams through the published executable.
module RhinoCli.Tests.Integration.Steps.RustDelegationResourceSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/gate/rust-delegation.feature" ]

open System
open System.Diagnostics
open System.IO
open System.Text.RegularExpressions
open TickSpec
open Xunit
open RhinoCli.Application.RepoConfig
open RhinoCli.Cli
open RhinoCli.Infrastructure

let private repositoryRoot: string =
    match GitRoot.findRoot () with
    | Ok root -> root
    | Error message -> failwithf "locate repository root: %s" message

let private executableMode =
    UnixFileMode.UserRead
    ||| UnixFileMode.UserWrite
    ||| UnixFileMode.UserExecute
    ||| UnixFileMode.GroupRead
    ||| UnixFileMode.GroupExecute
    ||| UnixFileMode.OtherRead
    ||| UnixFileMode.OtherExecute

let private words (text: string) : string list =
    text.Split(' ', StringSplitOptions.RemoveEmptyEntries) |> List.ofArray

let private runTool (fileName: string) (arguments: string list) (root: string) : string =
    let info =
        ProcessStartInfo(
            FileName = fileName,
            WorkingDirectory = root,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        )

    arguments |> List.iter info.ArgumentList.Add

    if fileName = "git" then
        for key, value in
            [ "GIT_DIR", Path.Combine(root, ".git")
              "GIT_WORK_TREE", root
              "GIT_CEILING_DIRECTORIES", root
              "GIT_CONFIG_GLOBAL", "/dev/null"
              "GIT_CONFIG_SYSTEM", "/dev/null" ] do
            info.Environment.[key] <- value

    use proc = Process.Start info
    let stdout = proc.StandardOutput.ReadToEnd()
    let stderr = proc.StandardError.ReadToEnd()
    proc.WaitForExit()
    Assert.True((proc.ExitCode = 0), sprintf "%s %A failed: %s" fileName arguments stderr)
    stdout

/// Runs `Dispatch.route` with the standard writers swapped, restoring them even if `route` throws.
let private runCaptured (root: string) (argv: string list) : int * string * string =
    let originalOut = Console.Out
    let originalErr = Console.Error
    use outWriter = new StringWriter()
    use errWriter = new StringWriter()

    try
        Console.SetOut outWriter
        Console.SetError errWriter
        let exitCode = Dispatch.route (fun () -> Ok root) (Array.ofList argv)
        exitCode, outWriter.ToString(), errWriter.ToString()
    finally
        Console.SetOut originalOut
        Console.SetError originalErr

/// A delegation row for a fixture command: the compiled class when RHINO provides it, a keep list otherwise.
let private delegationRow (command: string) : string =
    match RustRhino.tryFind command with
    | Some delegation ->
        let className =
            match delegation.Class with
            | RustRhino.Delegate -> "delegate"
            | RustRhino.Split -> "split"

        sprintf "  - command: %s\n    class: %s\n    rhino: %s\n" command className delegation.Rhino
    | None -> sprintf "  - command: %s\n    class: stay\n    keeps: [fixture-rule]\n" command

/// Markdown with one short, valid Mermaid diagram, and Markdown with none.
let private diagramDoc =
    "# Diagram\n\n```mermaid\nflowchart TD\n    A[Start] --> B[End]\n```\n"

let private plainDoc = "# Plain\n\nNo diagram here.\n"

type RustDelegationResourceSteps() =
    let root =
        let dir =
            Path.Combine(Path.GetTempPath(), "rhino-cli-rust-delegation-" + Guid.NewGuid().ToString("N"))

        Directory.CreateDirectory dir |> ignore
        dir

    let stubPath = Path.Combine(root, "rhino")
    let argvFile = Path.Combine(root, "rhino-argv.txt")
    let printFile = Path.Combine(root, "rhino-stdout.txt")
    let reportFile = Path.Combine(root, "rhino-report.txt")

    let mutable exitCode: int option = None
    let mutable stdout = ""
    let mutable brokenTree = false
    let mutable stderr = ""
    let mutable gatesYaml = ""
    let mutable rowsYaml = ""
    let mutable perCommand: (string * string) list = []
    let mutable validation: Result<unit, string> option = None

    let write (relative: string) (contents: string) =
        let path = Path.Combine(root, relative)
        Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore
        File.WriteAllText(path, contents)

    let stub (body: string) =
        write "rhino" ("#!/bin/sh\n" + body)
        File.SetUnixFileMode(stubPath, executableMode)

    let run (argv: string list) =
        let code, out, err = runCaptured root argv
        exitCode <- Some code
        stdout <- out
        stderr <- err

    let recordedArguments () : string list =
        if File.Exists argvFile then
            File.ReadAllLines argvFile |> List.ofArray
        else
            []

    let configText () =
        let delegation = if rowsYaml = "" then "" else "delegation:\n" + rowsYaml
        "gates:\n" + gatesYaml + delegation

    [<Given>]
    member _.``a repository whose pinned RHINO records its arguments and exits (\d+)``(code: int) =
        stub (sprintf "printf '%%s\\n' \"$*\" >> \"$(dirname \"$0\")/rhino-argv.txt\"\nexit %d\n" code)

    [<Given>]
    member _.``a repository whose pinned RHINO prints "([^"]*)" and exits (-?\d+)``(text: string, code: int) =
        stub (
            sprintf
                "printf '%%s\\n' \"$*\" >> \"$(dirname \"$0\")/rhino-argv.txt\"\nprintf '%%s\\n' '%s' > \"$(dirname \"$0\")/rhino-stdout.txt\"\nexit %d\n"
                text
                code
        )

    [<Given>]
    member _.``a repository whose \./rhino is (absent|not executable)``(state: string) =
        if state = "not executable" then
            write "rhino" "#!/bin/sh\nexit 0\n"
            File.SetUnixFileMode(stubPath, UnixFileMode.UserRead ||| UnixFileMode.UserWrite)

    [<Given>]
    member _.``a repository whose pinned RHINO reports its working directory, OSE_GATE_SURFACE and standard input``() =
        // The in-process leaf shares this test host's standard input, so the
        // stub never reads it here; E2E feeds and reads it for real.
        stub "{ pwd -P; printf '%s\\n' \"${OSE_GATE_SURFACE-}\"; } > \"$(dirname \"$0\")/rhino-report.txt\"\n"

    [<Given>]
    member _.``a documentation tree (whose links all resolve|with a broken heading anchor)``(tree: string) =
        // Targets containing "target", "link", "path" or an example name such as
        // "./reference.md" are placeholders the remainder skips.
        let anchor =
            if tree = "whose links all resolve" then
                "#manual"
            else
                "#missing"

        write "docs/guide.md" (sprintf "# Guide\n\nSee [the manual](./manual.md%s).\n" anchor)
        write "docs/manual.md" "# Manual\n"
        brokenTree <- (tree <> "whose links all resolve")

    [<Given>]
    member _.``a pre-commit gate "([^"]*)" running "([^"]*)" for staged "([^"]*)" files``
        (id: string, command: string, glob: string)
        =
        runTool "git" [ "init"; "--quiet" ] root |> ignore

        gatesYaml <-
            sprintf
                "  - id: %s\n    type: check\n    command: %s\n    kind: rhino-cli\n    surfaces:\n      pre-commit: { scope: affected-file-type, glob: '%s' }\n"
                id
                command
                glob

    [<Given>]
    member _.``a staged file "([^"]*)"``(path: string) =
        write path "# Guide\n"
        runTool "git" [ "add"; path ] root |> ignore

    [<Given>]
    member _.``a staged file "([^"]*)" that holds a diagram``(path: string) =
        write path diagramDoc
        runTool "git" [ "add"; path ] root |> ignore

    [<Given>]
    member _.``a gate registry whose rhino-cli gates run "([^"]*)" and "([^"]*)"``(first: string, second: string) =
        for hook in [ "commit-msg"; "pre-commit"; "pre-push" ] do
            write (".husky/" + hook) (sprintf "#!/bin/sh\nexec ./rhino gate run --surface %s\n" hook)
            File.SetUnixFileMode(Path.Combine(root, ".husky", hook), executableMode)

        gatesYaml <-
            String.concat
                ""
                [ "  - id: commit-msg-mutation\n    type: mutation\n    command: commitlint --edit\n    kind: external\n    surfaces:\n      commit-msg: { scope: other }\n"
                  "  - id: pre-commit-mutation\n    type: mutation\n    command: prettier --write\n    kind: external\n    surfaces:\n      pre-commit: { scope: other }\n"
                  sprintf
                      "  - id: first\n    type: mutation\n    command: %s\n    kind: rhino-cli\n    surfaces:\n      pre-push: { scope: other }\n"
                      first
                  sprintf
                      "  - id: second\n    type: mutation\n    command: %s\n    kind: rhino-cli\n    surfaces:\n      pre-push: { scope: other }\n"
                      second ]

    [<Given>]
    member _.``delegation rows for (.+)``(names: string) =
        let quoted =
            Regex.Matches(names, "\"([^\"]*)\"")
            |> Seq.map (fun m -> m.Groups.[1].Value)
            |> List.ofSeq

        let listed =
            if names.Contains(" twice", StringComparison.Ordinal) then
                List.head quoted :: quoted
            else
                quoted

        rowsYaml <- listed |> List.map delegationRow |> String.concat ""

    [<Given>]
    member _.``a Markdown tree with a diagram in "([^"]*)", none in "([^"]*)" and a diagram in "([^"]*)"``
        (first: string, plain: string, second: string)
        =
        write first diagramDoc
        write plain plainDoc
        write second diagramDoc

    [<Given>]
    member _.``a Markdown tree with no diagram in "([^"]*)"``(plain: string) = write plain plainDoc

    [<When>]
    member _.``the developer runs each command in this delegation table``(table: Table) =
        // The split commands' F# remainders read a v2 repo-config.yml; an empty one declares no rules.
        write "repo-config.yml" "schema: ose/repo-config/v2\n"

        for row in table.Rows do
            File.Delete argvFile
            run (words row.[0])
            // A refusal (2) or a launch failure (3) never starts RHINO; a split
            // remainder may still report findings (1) against this empty fixture.
            Assert.True((exitCode = Some 0 || exitCode = Some 1), sprintf "%s exited %A" row.[0] exitCode)
            perCommand <- perCommand @ [ row.[1], String.Join("\n", recordedArguments ()) ]

    [<When>]
    member _.``the developer runs "([^"]*)"``(commandLine: string) = run (words commandLine)

    [<When>]
    member _.``the developer runs "([^"]*)" with OSE_GATE_SURFACE "([^"]*)" and standard input "([^"]*)"``
        (commandLine: string, surface: string, _input: string)
        =
        let previous = Environment.GetEnvironmentVariable "OSE_GATE_SURFACE"

        try
            Environment.SetEnvironmentVariable("OSE_GATE_SURFACE", surface)
            run (words commandLine)
        finally
            Environment.SetEnvironmentVariable("OSE_GATE_SURFACE", previous)

    [<When>]
    member _.``the developer runs the pre-commit surface for "([^"]*)" only``(id: string) =
        write "repo-config.yml" (configText ())
        let config = load root |> Result.defaultWith failwith
        let staged = runTool "git" [ "diff"; "--cached"; "--name-only" ] root |> words

        let lines (text: string) =
            text.Split('\n', StringSplitOptions.RemoveEmptyEntries) |> List.ofArray

        let input: Gate.GatePlanningInput =
            { ChangedPaths = staged |> List.collect lines
              TrackedPaths = runTool "git" [ "ls-files" ] root |> lines
              ExistingPaths =
                staged
                |> List.collect lines
                |> List.filter (fun path -> File.Exists(Path.Combine(root, path)))
                |> Set.ofList }

        match Gate.planRun config "pre-commit" (Some id) None input with
        | Error message -> failwith message
        | Ok plan ->
            let invocation = List.exactlyOne plan

            if List.contains invocation.Command RustRhino.fileScoped then
                Assert.Equal<string list>(input.ChangedPaths, invocation.Files)
            else
                Assert.Empty(invocation.Files)

            run invocation.Arguments

    [<When>]
    member _.``the developer runs gate validate``() =
        write "repo-config.yml" (configText ())
        validation <- Some(Gate.validateAtRoot root)

    [<Then>]
    member _.``RHINO receives each command's own validator words``() =
        Assert.NotEmpty(perCommand)

        for rhino, received in perCommand do
            Assert.Equal(rhino, received)

    [<Then>]
    member _.``RHINO receives the arguments "([^"]*)"``(expected: string) =
        Assert.Equal<string list>([ expected ], recordedArguments ())

    [<Then>]
    member _.``the command exits with code (-?\d+)``(code: int) =
        Assert.True((exitCode = Some code), sprintf "exit %A, stdout %s, stderr %s" exitCode stdout stderr)

    [<Then>]
    member _.``standard output is exactly the line "([^"]*)"``(text: string) =
        // The leaf adds nothing of its own: RHINO's line is all there is.
        Assert.Equal("", stdout)
        Assert.Equal("", stderr)
        Assert.Equal(text + "\n", File.ReadAllText printFile)

    [<Then>]
    member _.``standard error names "([^"]*)" on a single line``(text: string) =
        let line = stderr.TrimEnd('\n')
        Assert.Contains(text, line)
        Assert.DoesNotContain("\n", line)

    [<Then>]
    member _.``standard error names the "([^"]*)" section of repo-config.yml``(section: string) =
        Assert.Contains(section, stderr)
        Assert.Contains("repo-config.yml", stderr)

    [<Then>]
    member _.``RHINO was not started``() = Assert.False(File.Exists argvFile)

    [<Then>]
    member _.``RHINO reports the repository root, "([^"]*)" and "([^"]*)"``(surface: string, _input: string) =
        let physicalRoot = (runTool "/bin/pwd" [ "-P" ] root).TrimEnd('\n')
        Assert.Equal(sprintf "%s\n%s\n" physicalRoot surface, File.ReadAllText reportFile)
        Assert.Equal(0, exitCode |> Option.defaultValue -1)

        let info = RustRhino.startInfo root [ "convention"; "emoji"; "validate" ]
        Assert.False(info.RedirectStandardInput)
        Assert.False(info.RedirectStandardOutput)

    [<Then>]
    member _.``the rhino-cli links report (follows RHINO's output|is not printed)``(report: string) =
        Assert.Equal("rhino done\n", File.ReadAllText printFile)

        match report with
        | "is not printed" -> Assert.Equal("", stdout)
        | _ when brokenTree ->
            Assert.StartsWith("# Broken Links Report\n", stdout)
            Assert.Contains("guide.md", stdout)
        | _ -> Assert.Equal("All links valid! No broken links found.\n", stdout)

    [<Then>]
    member _.``gate validation passes``() =
        match validation with
        | Some(Ok()) -> ()
        | other -> failwithf "expected gate validation to pass, got %A" other

    [<Then>]
    member _.``gate validation fails naming "([^"]*)" as (missing|duplicate|extra)``(command: string, kind: string) =
        match validation with
        | Some(Error message) ->
            Assert.Contains(command, message)
            Assert.Contains(kind, message)
        | other -> failwithf "expected gate validation to fail, got %A" other

    interface IDisposable with
        member _.Dispose() =
            if Directory.Exists root then
                Directory.Delete(root, true)

module private FeatureRunner =
    let private featurePath =
        Path.Combine(repositoryRoot, "specs", "apps", "rhino", "cli", "behaviours", "gate", "rust-delegation.feature")

    let private isTitle (line: string) (title: string) =
        let trimmed = line.Trim()
        trimmed = "Scenario: " + title || trimmed = "Scenario Outline: " + title

    let private isScenarioStart (line: string) =
        let trimmed = line.Trim()

        trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
        || trimmed.StartsWith("Scenario Outline:", StringComparison.Ordinal)

    let private extractScenario (lines: string[]) title =
        let featureLine =
            lines
            |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let startIndex = lines |> Array.findIndex (fun line -> isTitle line title)

        let endIndex =
            lines
            |> Array.skip (startIndex + 1)
            |> Array.tryFindIndex isScenarioStart
            |> Option.map (fun relative -> startIndex + 1 + relative)
            |> Option.defaultValue lines.Length

        Array.append [| featureLine; "" |] lines.[startIndex .. endIndex - 1]

    let run title =
        let definitions = StepDefinitions([| typeof<RustDelegationResourceSteps> |])

        let feature =
            definitions.GenerateFeature(featurePath, extractScenario (File.ReadAllLines featurePath) title)

        Assert.NotEmpty(feature.Scenarios)
        feature.Scenarios |> Seq.iter (fun scenario -> scenario.Action.Invoke())

[<Theory>]
[<InlineData("Every delegated and split command hands RHINO its own validator words")>]
[<InlineData("Output flags reach RHINO in RHINO's own spelling")>]
[<InlineData("A delegated command returns RHINO's exit code and output unchanged")>]
[<InlineData("A delegated command fails with exit 3 when RHINO cannot be started")>]
[<InlineData("RHINO runs in the repository root with the caller's environment and standard input")>]
[<InlineData("A retired policy flag names the repo-config.yml section that replaced it")>]
[<InlineData("A delegated command refuses a path because RHINO walks its declared surface")>]
[<InlineData("A split command refuses JSON output and names the RHINO command that provides it")>]
[<InlineData("A split command runs its F# remainder only after RHINO completed")>]
[<InlineData("A split Mermaid check hands RHINO only the selected Markdown files that hold a diagram")>]
[<InlineData("A split Mermaid check does not start RHINO when no selected file holds a diagram")>]
[<InlineData("The gate runner hands a delegated gate no staged files")>]
[<InlineData("The gate runner hands a file-scoped split gate its staged Markdown files")>]
[<InlineData("Gate validation requires one delegation row per rhino-cli gate command")>]
let ``delegated validators start the repository's stub RHINO through the real launcher`` title = FeatureRunner.run title
