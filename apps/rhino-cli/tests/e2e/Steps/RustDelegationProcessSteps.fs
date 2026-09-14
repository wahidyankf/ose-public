/// Published-process E2E TickSpec proof for `gate/rust-delegation.feature`:
/// each scenario runs the built `rhino-cli-fsharp` in a temporary Git
/// repository whose `./rhino` is a stub shell script, and reads the child's
/// standard output, standard error and exit code byte for byte.
module RhinoCli.Tests.E2E.Steps.RustDelegationProcessSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/gate/rust-delegation.feature" ]

open System
open System.Diagnostics
open System.IO
open System.Text.RegularExpressions
open TickSpec
open Xunit

type private ProcessResult =
    { ExitCode: int
      Stdout: string
      Stderr: string }

let private repositoryRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

let private executable =
    Path.Combine(repositoryRoot, "apps", "rhino-cli", "src", "dist", "rhino-cli-fsharp")

let private executableMode =
    UnixFileMode.UserRead
    ||| UnixFileMode.UserWrite
    ||| UnixFileMode.UserExecute
    ||| UnixFileMode.GroupRead
    ||| UnixFileMode.GroupExecute
    ||| UnixFileMode.OtherRead
    ||| UnixFileMode.OtherExecute

let private isolatedGitEnvironment (root: string) : (string * string) list =
    [ "GIT_DIR", Path.Combine(root, ".git")
      "GIT_CEILING_DIRECTORIES", root
      "GIT_CONFIG_GLOBAL", "/dev/null"
      "GIT_CONFIG_SYSTEM", "/dev/null" ]

let private runProcess
    (fileName: string)
    (arguments: string list)
    (root: string)
    (extra: (string * string) list)
    (input: string)
    : ProcessResult =
    let info =
        ProcessStartInfo(
            FileName = fileName,
            WorkingDirectory = root,
            UseShellExecute = false,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        )

    arguments |> List.iter info.ArgumentList.Add

    isolatedGitEnvironment root @ extra
    |> List.iter (fun (key, value) -> info.Environment.[key] <- value)

    use proc = Process.Start info
    proc.StandardInput.Write input
    proc.StandardInput.Close()
    let stdout = proc.StandardOutput.ReadToEndAsync()
    let stderr = proc.StandardError.ReadToEnd()
    proc.WaitForExit()

    { ExitCode = proc.ExitCode
      Stdout = stdout.Result
      Stderr = stderr }

let private words (text: string) : string list =
    text.Split(' ', StringSplitOptions.RemoveEmptyEntries) |> List.ofArray

/// A delegation row for a fixture command; `delegate` for RHINO's own validator, a keep list otherwise.
let private delegationRow (command: string) : string =
    match command with
    | "md naming validate" -> "  - command: md naming validate\n    class: delegate\n    rhino: md naming validate\n"
    | "md links validate" -> "  - command: md links validate\n    class: split\n    rhino: md internal-link validate\n"
    | other -> sprintf "  - command: %s\n    class: stay\n    keeps: [fixture-rule]\n" other

type RustDelegationProcessSteps() =
    let root =
        let dir =
            Path.Combine(Path.GetTempPath(), "rhino-cli-rust-delegation-e2e-" + Guid.NewGuid().ToString("N"))

        Directory.CreateDirectory dir |> ignore
        dir

    let stubPath = Path.Combine(root, "rhino")
    let argvFile = Path.Combine(root, "rhino-argv.txt")
    let reportFile = Path.Combine(root, "rhino-report.txt")

    let mutable result: ProcessResult option = None
    let mutable gatesYaml = ""
    let mutable rowsYaml = ""
    let mutable perCommand: (string * string) list = []

    let git (arguments: string list) =
        let outcome = runProcess "git" arguments root [] ""
        Assert.True((outcome.ExitCode = 0), sprintf "git %A failed: %s" arguments outcome.Stderr)
        outcome.Stdout

    do git [ "init"; "--quiet" ] |> ignore

    let write (relative: string) (contents: string) =
        let path = Path.Combine(root, relative)
        Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore
        File.WriteAllText(path, contents)

    let stub (body: string) =
        write "rhino" ("#!/bin/sh\n" + body)
        File.SetUnixFileMode(stubPath, executableMode)

    let cli (arguments: string list) (extra: (string * string) list) (input: string) =
        result <- Some(runProcess executable arguments root extra input)

    let current () =
        result |> Option.defaultWith (fun () -> failwith "rhino-cli has not run yet")

    let recordedArguments () : string list =
        if File.Exists argvFile then
            File.ReadAllLines argvFile |> List.ofArray
        else
            []

    let writeConfig () =
        let delegation = if rowsYaml = "" then "" else "delegation:\n" + rowsYaml
        write "repo-config.yml" ("gates:\n" + gatesYaml + delegation)

    [<Given>]
    member _.``a repository whose pinned RHINO records its arguments and exits (\d+)``(code: int) =
        stub (sprintf "printf '%%s\\n' \"$*\" >> \"$(dirname \"$0\")/rhino-argv.txt\"\nexit %d\n" code)

    [<Given>]
    member _.``a repository whose pinned RHINO prints "([^"]*)" and exits (-?\d+)``(text: string, code: int) =
        stub (
            sprintf
                "printf '%%s\\n' \"$*\" >> \"$(dirname \"$0\")/rhino-argv.txt\"\nprintf '%%s\\n' '%s'\nexit %d\n"
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
        stub "{ pwd -P; printf '%s\\n' \"${OSE_GATE_SURFACE-}\"; cat; } > \"$(dirname \"$0\")/rhino-report.txt\"\n"

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

    [<Given>]
    member _.``a pre-commit gate "([^"]*)" running "([^"]*)" for staged "([^"]*)" files``
        (id: string, command: string, glob: string)
        =
        gatesYaml <-
            sprintf
                "  - id: %s\n    type: check\n    command: %s\n    kind: rhino-cli\n    surfaces:\n      pre-commit: { scope: affected-file-type, glob: '%s' }\n"
                id
                command
                glob

    [<Given>]
    member _.``a staged file "([^"]*)"``(path: string) =
        write path "# Guide\n"
        git [ "add"; path ] |> ignore

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

    [<When>]
    member _.``the developer runs each command in this delegation table``(table: Table) =
        // The split commands' F# remainders read a v2 repo-config.yml; an empty one declares no rules.
        write "repo-config.yml" "schema: ose/repo-config/v2\n"

        for row in table.Rows do
            File.Delete argvFile
            cli (words row.[0]) [] ""
            // A refusal (2) or a launch failure (3) never starts RHINO; a split
            // remainder may still report findings (1) against this empty fixture.
            let code = (current ()).ExitCode
            Assert.True((code = 0 || code = 1), sprintf "%s exited %d: %s" row.[0] code (current ()).Stderr)
            perCommand <- perCommand @ [ row.[1], String.Join("\n", recordedArguments ()) ]

    [<When>]
    member _.``the developer runs "([^"]*)"``(commandLine: string) = cli (words commandLine) [] ""

    [<When>]
    member _.``the developer runs "([^"]*)" with OSE_GATE_SURFACE "([^"]*)" and standard input "([^"]*)"``
        (commandLine: string, surface: string, input: string)
        =
        cli (words commandLine) [ "OSE_GATE_SURFACE", surface ] input

    [<When>]
    member _.``the developer runs the pre-commit surface for "([^"]*)" only``(id: string) =
        writeConfig ()
        cli [ "gate"; "run"; "--surface=pre-commit"; "--only=" + id ] [] ""

    [<When>]
    member _.``the developer runs gate validate``() =
        writeConfig ()
        cli [ "gate"; "validate" ] [] ""

    [<Then>]
    member _.``RHINO receives each command's own validator words``() =
        Assert.NotEmpty(perCommand)

        for rhino, received in perCommand do
            Assert.Equal(rhino, received)

    [<Then>]
    member _.``RHINO receives the arguments "([^"]*)"``(expected: string) =
        Assert.True(((current ()).ExitCode = 0), sprintf "run failed: %s%s" (current ()).Stdout (current ()).Stderr)
        Assert.Equal<string list>([ expected ], recordedArguments ())

    [<Then>]
    member _.``the command exits with code (-?\d+)``(code: int) =
        let outcome = current ()

        Assert.True(
            (outcome.ExitCode = code),
            sprintf "exit %d, stdout %s, stderr %s" outcome.ExitCode outcome.Stdout outcome.Stderr
        )

    [<Then>]
    member _.``standard output is exactly the line "([^"]*)"``(text: string) =
        Assert.Equal(text + "\n", (current ()).Stdout)
        Assert.Equal("", (current ()).Stderr)

    [<Then>]
    member _.``standard error names "([^"]*)" on a single line``(text: string) =
        let stderr = (current ()).Stderr
        Assert.EndsWith("\n", stderr)
        let line = stderr.Substring(0, stderr.Length - 1)
        Assert.Contains(text, line)
        Assert.DoesNotContain("\n", line)

    [<Then>]
    member _.``standard error names the "([^"]*)" section of repo-config.yml``(section: string) =
        let stderr = (current ()).Stderr
        Assert.Contains(section, stderr)
        Assert.Contains("repo-config.yml", stderr)

    [<Then>]
    member _.``RHINO was not started``() = Assert.False(File.Exists argvFile)

    [<Then>]
    member _.``RHINO reports the repository root, "([^"]*)" and "([^"]*)"``(surface: string, input: string) =
        Assert.Equal(0, (current ()).ExitCode)
        let physicalRoot = (runProcess "/bin/pwd" [ "-P" ] root [] "").Stdout.TrimEnd('\n')
        Assert.Equal(sprintf "%s\n%s\n%s" physicalRoot surface input, File.ReadAllText reportFile)

    [<Then>]
    member _.``the rhino-cli links report (follows RHINO's output|is not printed)``(report: string) =
        let stdout = (current ()).Stdout

        if report = "is not printed" then
            Assert.Equal("rhino done\n", stdout)
        else
            Assert.StartsWith("rhino done\n", stdout)
            Assert.True(stdout.Length > "rhino done\n".Length, "the F# links report is missing")

    [<Then>]
    member _.``gate validation passes``() =
        let outcome = current ()
        Assert.True((outcome.ExitCode = 0), sprintf "gate validate failed: %s%s" outcome.Stdout outcome.Stderr)

    [<Then>]
    member _.``gate validation fails naming "([^"]*)" as (missing|duplicate|extra)``(command: string, kind: string) =
        let outcome = current ()
        Assert.NotEqual(0, outcome.ExitCode)
        let text = outcome.Stdout + outcome.Stderr
        Assert.Contains(command, text)
        Assert.Contains(kind, text)

    interface IDisposable with
        member _.Dispose() =
            if Directory.Exists root then
                Directory.Delete(root, true)

module private FeatureRunner =
    let private featurePath =
        Path.Combine(repositoryRoot, "specs", "apps", "rhino", "cli", "behaviours", "gate", "rust-delegation.feature")

    let private isScenarioStart (line: string) =
        let trimmed = line.Trim()

        trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
        || trimmed.StartsWith("Scenario Outline:", StringComparison.Ordinal)

    let private extractScenario (featureLines: string[]) (scenarioTitle: string) =
        let featureLine =
            featureLines
            |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let startIndex =
            featureLines
            |> Array.findIndex (fun line ->
                let trimmed = line.Trim()

                trimmed = "Scenario: " + scenarioTitle
                || trimmed = "Scenario Outline: " + scenarioTitle)

        let endIndex =
            featureLines
            |> Array.skip (startIndex + 1)
            |> Array.tryFindIndex isScenarioStart
            |> Option.map (fun offset -> startIndex + 1 + offset)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIndex .. endIndex - 1]

    let run scenarioTitle =
        let lines = File.ReadAllLines featurePath

        let feature =
            StepDefinitions([| typeof<RustDelegationProcessSteps> |])
                .GenerateFeature(featurePath, extractScenario lines scenarioTitle)

        Assert.NotEmpty(feature.Scenarios)
        feature.Scenarios |> Seq.iter (fun scenario -> scenario.Action.Invoke())

[<Fact>]
let ``Every delegated and split command hands RHINO its own validator words`` () =
    FeatureRunner.run "Every delegated and split command hands RHINO its own validator words"

[<Fact>]
let ``Output flags reach RHINO in RHINO's own spelling`` () =
    FeatureRunner.run "Output flags reach RHINO in RHINO's own spelling"

[<Fact>]
let ``A delegated command returns RHINO's exit code and output unchanged`` () =
    FeatureRunner.run "A delegated command returns RHINO's exit code and output unchanged"

[<Fact>]
let ``A delegated command fails with exit 3 when RHINO cannot be started`` () =
    FeatureRunner.run "A delegated command fails with exit 3 when RHINO cannot be started"

[<Fact>]
let ``RHINO runs in the repository root with the caller's environment and standard input`` () =
    FeatureRunner.run "RHINO runs in the repository root with the caller's environment and standard input"

[<Fact>]
let ``A retired policy flag names the repo-config.yml section that replaced it`` () =
    FeatureRunner.run "A retired policy flag names the repo-config.yml section that replaced it"

[<Fact>]
let ``A delegated command refuses a path because RHINO walks its declared surface`` () =
    FeatureRunner.run "A delegated command refuses a path because RHINO walks its declared surface"

[<Fact>]
let ``A split command refuses JSON output and names the RHINO command that provides it`` () =
    FeatureRunner.run "A split command refuses JSON output and names the RHINO command that provides it"

[<Fact>]
let ``A split command runs its F# remainder only after RHINO completed`` () =
    FeatureRunner.run "A split command runs its F# remainder only after RHINO completed"

[<Fact>]
let ``The gate runner hands a delegated gate no staged files`` () =
    FeatureRunner.run "The gate runner hands a delegated gate no staged files"

[<Fact>]
let ``Gate validation requires one delegation row per rhino-cli gate command`` () =
    FeatureRunner.run "Gate validation requires one delegation row per rhino-cli gate command"
