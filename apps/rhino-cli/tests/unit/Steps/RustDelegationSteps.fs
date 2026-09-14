/// In-process TickSpec proof for `gate/rust-delegation.feature` against the
/// pure core of `RhinoCli.Infrastructure.RustRhino` and the gate policy. RHINO
/// is a recording fake runner and the launcher is a record of functions, so no
/// step here starts a process or touches the filesystem. Integration proves the
/// real launch against a stub script, and E2E proves the published command.
module RhinoCli.Tests.Unit.Steps.RustDelegationSteps

/// Explicit static-coverage ownership; the validator scopes this file's
/// TickSpec bindings to these canonical features.
let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/gate/rust-delegation.feature" ]


open System
open System.ComponentModel
open System.Diagnostics
open System.IO
open System.Reflection
open System.Text
open System.Text.RegularExpressions
open TickSpec
open Xunit
open RhinoCli.Application.RepoConfig
open RhinoCli.Domain.Types
open RhinoCli.Infrastructure
open RhinoCli.Cli.Gate

/// A repository root no step ever reads; the fake runner and launcher stand in for it.
let private root = "/repo"

let private scopeOf (kind: ScopeKind) (glob: string option) : SurfaceScope =
    { Scope = kind
      Glob = glob
      Globs = []
      LintStagedShell = None
      Trigger = [] }

let private gateOf (id: string) (command: string) (surface: GateSurface) (scope: SurfaceScope) : GateEntry =
    { Id = id
      GateType = Check
      Command = command
      Kind = RhinoCli
      DoctorTools = []
      Wiring = None
      Restages = false
      Args = Map.empty
      Surfaces = [ surface, scope ]
      CarveOut = None
      Verifies = None
      Category = None
      CiGroup = None }

let private rowFor (command: string) : DelegationRow =
    { Command = command
      Class = "stay"
      Rhino = None
      Keeps = [ "kept-rule" ]
      Until = None }

let private words (text: string) : string list =
    text.Split(' ', StringSplitOptions.RemoveEmptyEntries) |> List.ofArray

/// Instance step-definition container; TickSpec creates one per scenario.
type RustDelegationSteps() =
    let mutable rhinoExit = 0
    let mutable rhinoPrints: string option = None
    let mutable launcher: RustRhino.Launcher option = None
    let mutable started: ProcessStartInfo option = None
    let mutable received: string list list = []
    let mutable remainderExit = 0
    let mutable remainderRan = false
    let mutable exitCode: int option = None
    let mutable perCommand: (string * string list) list = []
    let mutable gates: GateEntry list = []
    let mutable rows: DelegationRow list = []
    let mutable staged: string list = []
    let mutable findings: string list option = None
    /// Markdown paths and whether each holds a diagram; stands in for the F# file selection.
    let mutable markdownTree: (string * bool) list = []
    let stdout = StringBuilder()
    let errors = ResizeArray<string>()

    /// RHINO as the leaf sees it: the launcher when a scenario installs one,
    /// otherwise a fake that records its arguments and prints what it was told.
    let runner (argv: string list) : int =
        match launcher with
        | Some value -> RustRhino.runWith value errors.Add root argv
        | None ->
            received <- received @ [ argv ]

            rhinoPrints
            |> Option.iter (fun text -> stdout.Append(text).Append('\n') |> ignore)

            rhinoExit

    let remainder () : int =
        remainderRan <- true
        stdout.Append("F# links report\n") |> ignore
        remainderExit

    /// Splits a command line into its compiled delegation row and the leaf's own arguments.
    let run (commandLine: string) : int =
        let all = words commandLine

        let delegation, rest =
            [ 3; 2 ]
            |> List.pick (fun count ->
                if all.Length >= count then
                    RustRhino.tryFind (String.Join(" ", List.take count all))
                    |> Option.map (fun row -> row, List.skip count all)
                else
                    None)

        match delegation.Class with
        | RustRhino.Split when List.contains delegation.Command RustRhino.fileScoped ->
            // The fake selection keeps the diagram files outside every --exclude prefix and, when
            // paths are given, inside one of them, as the F# scan does.
            let rec partition (args: string list) (excluded: string list) (paths: string list) =
                match args with
                | "--exclude" :: value :: tail -> partition tail (excluded @ [ value ]) paths
                | "--max-label-len" :: _ :: tail -> partition tail excluded paths
                | flag :: tail when flag.StartsWith("-", StringComparison.Ordinal) -> partition tail excluded paths
                | path :: tail -> partition tail excluded (paths @ [ path ])
                | [] -> excluded, paths

            let excluded, paths = partition rest [] []

            let within (prefix: string) (path: string) =
                path = prefix || path.StartsWith(prefix + "/", StringComparison.Ordinal)

            let files =
                markdownTree
                |> List.filter (fun (path, hasDiagram) ->
                    hasDiagram
                    && not (excluded |> List.exists (fun prefix -> within prefix path))
                    && (List.isEmpty paths || paths |> List.exists (fun prefix -> within prefix path)))
                |> List.map fst

            RustRhino.runSplitOnFiles runner errors.Add delegation.Command rest files remainder
        | RustRhino.Delegate -> RustRhino.runDelegated runner errors.Add delegation.Command rest
        | RustRhino.Split -> RustRhino.runSplit runner errors.Add delegation.Command rest remainder

    [<Given>]
    member _.``a repository whose pinned RHINO records its arguments and exits (\d+)``(code: int) = rhinoExit <- code

    [<Given>]
    member _.``a repository whose pinned RHINO prints "([^"]*)" and exits (-?\d+)``(text: string, code: int) =
        rhinoPrints <- Some text
        rhinoExit <- code

    [<Given>]
    member _.``a repository whose \./rhino is (absent|not executable)``(_state: string) =
        launcher <-
            Some
                { CanExecute = fun _ -> false
                  Start = fun _ -> failwith "RHINO must not be started" }

    [<Given>]
    member _.``a repository whose pinned RHINO reports its working directory, OSE_GATE_SURFACE and standard input``() =
        launcher <-
            Some
                { CanExecute = fun _ -> true
                  Start =
                    fun info ->
                        started <- Some info
                        0 }

    [<Given>]
    member _.``a documentation tree (whose links all resolve|with a broken heading anchor)``(tree: string) =
        remainderExit <- if tree = "whose links all resolve" then 0 else 1

    [<Given>]
    member _.``a pre-commit gate "([^"]*)" running "([^"]*)" for staged "([^"]*)" files``
        (id: string, command: string, glob: string)
        =
        gates <- [ gateOf id command PreCommit (scopeOf AffectedFileType (Some glob)) ]

    [<Given>]
    member _.``a staged file "([^"]*)"``(path: string) = staged <- staged @ [ path ]

    [<Given>]
    member _.``a staged file "([^"]*)" that holds a diagram``(path: string) =
        staged <- staged @ [ path ]
        markdownTree <- markdownTree @ [ path, true ]

    [<Given>]
    member _.``a gate registry whose rhino-cli gates run "([^"]*)" and "([^"]*)"``(first: string, second: string) =
        gates <-
            [ gateOf "first" first PrePush (scopeOf Other None)
              gateOf "second" second PrePush (scopeOf Other None) ]

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

        rows <- listed |> List.map rowFor

    [<Given>]
    member _.``a Markdown tree with a diagram in "([^"]*)", none in "([^"]*)" and a diagram in "([^"]*)"``
        (first: string, plain: string, second: string)
        =
        markdownTree <- [ first, true; plain, false; second, true ]

    [<Given>]
    member _.``a Markdown tree with no diagram in "([^"]*)"``(plain: string) = markdownTree <- [ plain, false ]

    [<When>]
    member _.``the developer runs each command in this delegation table``(table: Table) =
        let expected = table.Rows |> Array.map (fun row -> row.[0], row.[1]) |> List.ofArray

        Assert.Equal<string list>(
            expected |> List.map fst |> List.sort,
            RustRhino.delegations
            |> List.map (fun delegation -> delegation.Command)
            |> List.filter (fun command -> not (List.contains command RustRhino.fileScoped))
            |> List.sort
        )

        for command, rhino in expected do
            received <- []
            exitCode <- Some(run command)
            perCommand <- perCommand @ [ rhino, List.exactlyOne received ]

    [<When>]
    member _.``the developer runs "([^"]*)"``(commandLine: string) = exitCode <- Some(run commandLine)

    [<When>]
    member _.``the developer runs "([^"]*)" with OSE_GATE_SURFACE "([^"]*)" and standard input "([^"]*)"``
        (commandLine: string, _surface: string, _input: string)
        =
        exitCode <- Some(run commandLine)

    [<When>]
    member _.``the developer runs the pre-commit surface for "([^"]*)" only``(id: string) =
        let input =
            { ChangedPaths = staged
              TrackedPaths = staged
              ExistingPaths = Set.ofList staged }

        match planRun { empty with Gates = gates } "pre-commit" (Some id) None input with
        | Error message -> failwith message
        | Ok plan ->
            let invocation = List.exactlyOne plan

            if List.contains invocation.Command RustRhino.fileScoped then
                Assert.Equal<string list>(staged, invocation.Files)
            else
                Assert.Empty(invocation.Files)

            exitCode <- Some(run (String.Join(" ", invocation.Arguments)))

    [<When>]
    member _.``the developer runs gate validate``() =
        findings <-
            Some(
                delegationFindings
                    { empty with
                        Gates = gates
                        Delegation = rows }
                    Set.empty
            )

    [<Then>]
    member _.``RHINO receives each command's own validator words``() =
        Assert.NotEmpty(perCommand)

        for rhino, argv in perCommand do
            Assert.Equal<string list>(words rhino, argv)

    [<Then>]
    member _.``RHINO receives the arguments "([^"]*)"``(expected: string) =
        Assert.Equal<string list>(words expected, List.last received)

    [<Then>]
    member _.``the command exits with code (-?\d+)``(code: int) = Assert.Equal(Some code, exitCode)

    [<Then>]
    member _.``standard output is exactly the line "([^"]*)"``(text: string) =
        Assert.Equal(text + "\n", stdout.ToString())
        Assert.Empty(errors)

    [<Then>]
    member _.``standard error names "([^"]*)" on a single line``(text: string) =
        let line = Assert.Single(errors)
        Assert.Contains(text, line)
        Assert.DoesNotContain("\n", line)

    [<Then>]
    member _.``standard error names the "([^"]*)" section of repo-config.yml``(section: string) =
        let line = Assert.Single(errors)
        Assert.Contains(section, line)
        Assert.Contains("repo-config.yml", line)

    [<Then>]
    member _.``RHINO was not started``() = Assert.Empty(received)

    [<Then>]
    member _.``RHINO reports the repository root, "([^"]*)" and "([^"]*)"``(_surface: string, _input: string) =
        let info =
            started |> Option.defaultWith (fun () -> failwith "RHINO was not started")

        Assert.Equal(RustRhino.resolve root, info.FileName)
        Assert.Equal(root, info.WorkingDirectory)
        Assert.Equal<string list>([ "convention"; "emoji"; "validate" ], List.ofSeq info.ArgumentList)
        Assert.False(info.UseShellExecute)
        Assert.False(info.RedirectStandardInput)
        Assert.False(info.RedirectStandardOutput)
        Assert.False(info.RedirectStandardError)

        // Nothing is added, removed or overridden: the caller's environment,
        // OSE_GATE_SURFACE included, is what the child inherits.
        let inherited = ProcessStartInfo().Environment
        Assert.Equal(inherited.Count, info.Environment.Count)

        for pair in inherited do
            Assert.Equal(pair.Value, info.Environment.[pair.Key])

    [<Then>]
    member _.``the rhino-cli links report (follows RHINO's output|is not printed)``(report: string) =
        if report = "is not printed" then
            Assert.False(remainderRan)
            Assert.Equal("rhino done\n", stdout.ToString())
        else
            Assert.True(remainderRan)
            Assert.Equal("rhino done\nF# links report\n", stdout.ToString())

    [<Then>]
    member _.``gate validation passes``() =
        Assert.Equal<string list>([], findings |> Option.defaultWith (fun () -> failwith "gate validate did not run"))

    [<Then>]
    member _.``gate validation fails naming "([^"]*)" as (missing|duplicate|extra)``(command: string, kind: string) =
        let all =
            findings |> Option.defaultWith (fun () -> failwith "gate validate did not run")

        Assert.Contains(all, fun finding -> finding.Contains(command) && finding.Contains(kind))

module private FeatureRunner =

    let private featurePath = "rust-delegation.feature"

    let private readFeature () =
        let assembly = Assembly.GetExecutingAssembly()

        let resourceName =
            assembly.GetManifestResourceNames()
            |> Array.filter (fun name -> name.EndsWith(featurePath, StringComparison.Ordinal))
            |> Array.exactlyOne

        use stream = assembly.GetManifestResourceStream(resourceName)
        use reader = new StreamReader(stream)
        reader.ReadToEnd().Replace("\r\n", "\n").Split('\n')

    let private isScenarioStart (line: string) =
        let trimmed = line.Trim()

        trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
        || trimmed.StartsWith("Scenario Outline:", StringComparison.Ordinal)
        || trimmed.StartsWith("@", StringComparison.Ordinal)

    let private extractScenario (featureLines: string[]) (scenarioTitle: string) : string[] =
        let featureLine =
            featureLines
            |> Array.find (fun l -> l.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let startIdx =
            featureLines
            |> Array.findIndex (fun l ->
                let trimmed = l.Trim()

                trimmed = "Scenario: " + scenarioTitle
                || trimmed = "Scenario Outline: " + scenarioTitle)

        let endIdx =
            featureLines
            |> Array.skip (startIdx + 1)
            |> Array.tryFindIndex isScenarioStart
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIdx .. endIdx - 1]

    let run (scenarioTitle: string) : unit =
        let snippet = extractScenario (readFeature ()) scenarioTitle
        let definitions = StepDefinitions([| typeof<RustDelegationSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)
        Assert.NotEmpty(feature.Scenarios)

        for scenario in feature.Scenarios do
            scenario.Action.Invoke()

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
let ``A split Mermaid check hands RHINO only the selected Markdown files that hold a diagram`` () =
    FeatureRunner.run "A split Mermaid check hands RHINO only the selected Markdown files that hold a diagram"

[<Fact>]
let ``A split Mermaid check does not start RHINO when no selected file holds a diagram`` () =
    FeatureRunner.run "A split Mermaid check does not start RHINO when no selected file holds a diagram"

[<Fact>]
let ``The gate runner hands a delegated gate no staged files`` () =
    FeatureRunner.run "The gate runner hands a delegated gate no staged files"

[<Fact>]
let ``The gate runner hands a file-scoped split gate its staged Markdown files`` () =
    FeatureRunner.run "The gate runner hands a file-scoped split gate its staged Markdown files"

[<Fact>]
let ``Gate validation requires one delegation row per rhino-cli gate command`` () =
    FeatureRunner.run "Gate validation requires one delegation row per rhino-cli gate command"

// Seams below the scenarios: argument spellings, exit combination, launcher
// failures, gate-command normalisation, and the compiled table against the registry.

let private delegation (command: string) : RustRhino.Delegation =
    RustRhino.tryFind command
    |> Option.defaultWith (fun () -> failwithf "no compiled row for %s" command)

let private recordingRunner (calls: ResizeArray<string list>) (code: int) : string list -> int =
    fun argv ->
        calls.Add argv
        code

[<Fact>]
let ``rhinoArgv accepts the equals spelling of output and the short presentation flags`` () =
    Assert.Equal(
        Ok [ "md"; "naming"; "validate"; "--output"; "text"; "--verbose"; "--quiet" ],
        RustRhino.rhinoArgv (delegation "md naming validate") [ "--output=text"; "-v"; "-q" ]
    )

[<Fact>]
let ``rhinoArgv refuses markdown output, a missing output value and an unknown flag on a delegated command`` () =
    let naming = delegation "md naming validate"
    Assert.True(Result.isError (RustRhino.rhinoArgv naming [ "--output"; "markdown" ]))
    Assert.True(Result.isError (RustRhino.rhinoArgv naming [ "--output" ]))
    Assert.True(Result.isError (RustRhino.rhinoArgv naming [ "--staged-only" ]))

[<Fact>]
let ``rhinoArgv leaves a split command's remainder arguments to the remainder`` () =
    Assert.Equal(
        Ok [ "md"; "readme-index"; "validate" ],
        RustRhino.rhinoArgv
            (delegation "governance readme-index validate")
            [ "--paths"; "docs/"; "--fail-kinds"; "orphan,ghost"; "specs/" ]
    )

[<Fact>]
let ``rhinoArgv refuses missing inside a comma-separated fail-kinds value`` () =
    match RustRhino.rhinoArgv (delegation "governance readme-index validate") [ "--fail-kinds"; "orphan,missing" ] with
    | Error message -> Assert.Contains("md-readme-index", message)
    | Ok argv -> failwithf "expected a refusal, got %A" argv

[<Fact>]
let ``combine returns an out-of-range exit from either half and otherwise the larger`` () =
    Assert.Equal(1, RustRhino.combine 0 (fun () -> 1))
    Assert.Equal(1, RustRhino.combine 1 (fun () -> 0))
    Assert.Equal(0, RustRhino.combine 0 (fun () -> 0))
    Assert.Equal(2, RustRhino.combine 0 (fun () -> 2))
    Assert.Equal(75, RustRhino.combine 75 (fun () -> failwith "the remainder must not run"))

[<Fact>]
let ``runSplit refuses JSON before starting RHINO or the remainder`` () =
    let calls = ResizeArray<string list>()
    let errors = ResizeArray<string>()

    let exit =
        RustRhino.runSplit (recordingRunner calls 0) errors.Add "md links validate" [ "-o"; "json" ] (fun () ->
            failwith "the remainder must not run")

    Assert.Equal(RustRhino.UsageFailure, exit)
    Assert.Empty(calls)
    Assert.Contains("./rhino md internal-link validate --output json", Assert.Single(errors))

[<Fact>]
let ``runSplitOnFiles appends one --file per selected path and skips RHINO for an empty selection`` () =
    let calls = ResizeArray<string list>()
    let errors = ResizeArray<string>()

    let exit =
        RustRhino.runSplitOnFiles
            (recordingRunner calls 0)
            errors.Add
            "md mermaid validate"
            [ "--exclude"; "plans/done" ]
            [ "docs/a.md"; "docs/c.md" ]
            (fun () -> 1)

    Assert.Equal(1, exit)

    Assert.Equal<string list>(
        [ "md"; "mermaid"; "validate"; "--file"; "docs/a.md"; "--file"; "docs/c.md" ],
        Assert.Single(calls)
    )

    calls.Clear()

    Assert.Equal(
        0,
        RustRhino.runSplitOnFiles (recordingRunner calls 1) errors.Add "md mermaid validate" [] [] (fun () -> 0)
    )

    Assert.Empty(calls)
    Assert.Empty(errors)

[<Fact>]
let ``runSplitOnFiles refuses JSON before starting RHINO or the remainder`` () =
    let calls = ResizeArray<string list>()
    let errors = ResizeArray<string>()

    let exit =
        RustRhino.runSplitOnFiles
            (recordingRunner calls 0)
            errors.Add
            "md mermaid validate"
            [ "-o"; "json" ]
            [ "docs/a.md" ]
            (fun () -> failwith "the remainder must not run")

    Assert.Equal(RustRhino.UsageFailure, exit)
    Assert.Empty(calls)
    Assert.Contains("./rhino md mermaid validate --output json", Assert.Single(errors))

[<Fact>]
let ``runWith reports exit 3 when starting RHINO throws`` () =
    let errors = ResizeArray<string>()

    let launcher: RustRhino.Launcher =
        { CanExecute = fun _ -> true
          Start = fun _ -> raise (Win32Exception "exec format error") }

    Assert.Equal(RustRhino.ExecutionFailure, RustRhino.runWith launcher errors.Add root [ "md"; "naming"; "validate" ])
    Assert.Contains("./rhino", Assert.Single(errors))

[<Fact>]
let ``resolve and startInfo name the repository's own rhino with no shell`` () =
    let info = RustRhino.startInfo root [ "repo-config"; "validate" ]
    Assert.Equal(Path.Combine(root, "rhino"), RustRhino.resolve root)
    Assert.Equal(RustRhino.resolve root, info.FileName)
    Assert.Equal(root, info.WorkingDirectory)
    Assert.Equal<string list>([ "repo-config"; "validate" ], List.ofSeq info.ArgumentList)
    Assert.False(info.UseShellExecute)

[<Fact>]
let ``delegationFindings keys a gate by its command words without trailing paths`` () =
    let config =
        { empty with
            Gates =
                [ gateOf "vendor" "repo-governance vendor validate repo-governance/" PrePush (scopeOf Other None)
                  gateOf "vendor-agents" "repo-governance vendor validate AGENTS.md" PrePush (scopeOf Other None) ]
            Delegation = [ rowFor "repo-governance vendor validate" ] }

    Assert.Equal<string list>([], delegationFindings config Set.empty)

[<Fact>]
let ``delegationFindings accepts a row for a known ungated validator`` () =
    let config =
        { empty with
            Gates = [ gateOf "md-naming" "md naming validate" PreCommit (scopeOf Other None) ]
            Delegation = [ rowFor "md naming validate"; rowFor "md frontmatter-dates validate" ] }

    Assert.Equal<string list>([], delegationFindings config (Set.ofList [ "md frontmatter-dates validate" ]))

[<Fact>]
let ``The compiled delegation table matches the registry's delegate and split rows`` () =
    let assembly = Assembly.GetExecutingAssembly()

    let text =
        use stream = assembly.GetManifestResourceStream("keep-list/repo-config.yml")
        use reader = new StreamReader(stream)
        reader.ReadToEnd()

    let config = parse text |> Result.defaultWith failwith

    let declared =
        config.Delegation
        |> List.filter (fun row -> row.Class = "delegate" || row.Class = "split")
        |> List.map (fun row -> row.Command, row.Class, row.Rhino)
        |> List.sort

    let compiled =
        RustRhino.delegations
        |> List.map (fun row ->
            let className =
                match row.Class with
                | RustRhino.Delegate -> "delegate"
                | RustRhino.Split -> "split"

            row.Command, className, Some row.Rhino)
        |> List.sort

    Assert.Equal<(string * string * string option) list>(compiled, declared)
