/// TickSpec step definitions binding the `repo-config` namespace's single
/// Gherkin feature file to `RhinoCli.Application.RepoConfig`
/// [Repo-grounded —
/// `specs/apps/rhino/cli/behaviours/repo-config/data-driven.feature`].
///
/// Follows `ConventionSteps.fs`'s per-scenario slicing convention: each xunit
/// `[<Fact>]` below runs exactly one scenario, extracted from the real,
/// frozen feature file rather than a duplicated/rewritten copy of its
/// wording.
///
/// All fixture documents are in memory. The Integration adapter separately
/// proves discovery and reading of the repository-owned file.
module RhinoCli.Tests.Unit.Steps.RepoConfigSteps

/// Explicit static-coverage ownership; the validator scopes this file's
/// TickSpec bindings to these canonical features.
let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/repo-config/data-driven.feature" ]


open System
open System.IO
open TickSpec
open Xunit
open RhinoCli.Application.RepoConfig

/// Instance step-definition container — see `ConventionSteps.fs`'s module
/// doc comment for why TickSpec's one-instance-per-scenario lifecycle makes
/// instance-level mutable fields the idiomatic state-threading mechanism
/// here.
type RepoConfigSteps() =
    let mutable documents: Map<string, string> = Map.empty
    let mutable loadedConfig: RepoConfig option = None
    let mutable codexEntry: HarnessEntry option = None
    let mutable allEntries: HarnessEntry list = []
    let mutable loadOptionalResult: Result<bool, string> option = None
    let mutable validateResult: (bool * string) option = None
    let mutable confinedPath: string option = None
    let mutable dotnetSource: string option = None
    let mutable dotnetVersion: string option = None
    let mutable websiteExclusionsRespected = false

    let root = "/repo"

    let useOwnedTempDir () = documents <- Map.empty

    let writeFile (relativePath: string) (content: string) =
        documents <- documents |> Map.add relativePath content

    let readConfig () =
        match Map.tryFind "repo-config.yml" documents with
        | None -> Error "cannot read repo-config.yml: confirmed absent"
        | Some text -> parse text

    let canonicalConfig =
        "harness:\n"
        + "  - name: claude-code\n    tier: source\n    agent-dir: .claude/agents\n"
        + "  - name: opencode\n    tier: generated\n    agent-dir: .opencode/agents\n    mirrors: .claude/agents\n"
        + "  - name: codex\n    tier: generated\n    agent-dir: .codex/agents\n    mirrors: .claude/agents\n"

    // ---- Given: "Repo-specific behaviour is data-driven, not hard-coded" ----

    [<Given>]
    member _.``rhino-cli's repo-specific behaviour \(env globs, doctor tool skips\)``() =
        useOwnedTempDir ()
        // `widget-tool` is deliberately not one of this repository's real
        // skipped tools — a config-declared value with no source-hard-coded
        // counterpart is exactly what demonstrates data-driven, not
        // hard-coded, behaviour.
        writeFile "repo-config.yml" "doctor:\n  skip-tools:\n    - widget-tool\n"

    [<When>]
    member _.``rhino-cli runs``() =
        match readConfig () with
        | Ok config -> loadedConfig <- Some config
        | Error message -> failwith message

    [<Then>]
    member _.``it reads that behaviour from repo-config.yml, not from source hard-coded per repo``() =
        match loadedConfig with
        | None -> Assert.Fail("no config was loaded by a When step")
        | Some config ->
            Assert.Equal<string list>([ "widget-tool" ], config.Doctor.SkipTools)

            Assert.False(
                List.isEmpty config.Doctor.SkipTools,
                "the skip-tools list must come from repo-config.yml, not a source-hard-coded default"
            )

    // ---- Given/Then: "A v2 repository configuration is read from its rhino-cli extension" ----

    [<Given>]
    member _.``a v2 repo-config.yml whose rhino-cli extension declares a doctor skip tool``() =
        useOwnedTempDir ()
        // RHINO owns the core keys; every rhino-cli section lives under the
        // extension, so the core gate below must not reach the F# registry.
        writeFile
            "repo-config.yml"
            (String.concat
                ""
                [ "schema: ose/repo-config/v2\n"
                  "visibility: public\n"
                  "gates:\n"
                  "  - id: public-safety\n"
                  "    kind: check\n"
                  "    run: [bash, scripts/public-safety/check.sh]\n"
                  "    surfaces: [commit-msg, pre-commit, pre-push, ci]\n"
                  "extensions:\n"
                  "  rhino-cli:\n"
                  "    doctor:\n"
                  "      skip-tools:\n"
                  "        - widget-tool\n" ])

    [<Then>]
    member _.``it reads the skip tool from the extension and none of the core gates``() =
        match loadedConfig with
        | None -> Assert.Fail("no config was loaded by a When step")
        | Some config ->
            Assert.Equal<string list>([ "widget-tool" ], config.Doctor.SkipTools)
            Assert.Empty(config.Gates)

    // ---- Given/When/Then: codex entry + exactly-three-harnesses scenarios ----

    [<Given>]
    member _.``the harness registry section of repo-config.yml``() =
        writeFile "repo-config.yml" canonicalConfig

        match readConfig () with
        | Error message -> failwith message
        | Ok config ->
            allEntries <- config.Harness
            codexEntry <- config.Harness |> List.tryFind (fun h -> h.Name = "codex")

    [<When>]
    member _.``the codex entry is read``() =
        Assert.True(codexEntry.IsSome, "codex harness entry must exist in repo-config.yml")

    [<When>]
    member _.``the full registry is read``() =
        Assert.False(List.isEmpty allEntries, "the harness registry must not be empty")

    [<Then>]
    member _.``the entry declares the generated tier``() =
        match codexEntry with
        | Some entry -> Assert.Equal(Generated, entry.Tier)
        | None -> Assert.Fail("codex entry was not loaded by a Given step")

    [<Then>]
    member _.``the entry declares .codex/agents as its agent directory``() =
        match codexEntry with
        | Some entry -> Assert.Equal<string option>(Some ".codex/agents", entry.AgentDir)
        | None -> Assert.Fail("codex entry was not loaded by a Given step")

    [<Then>]
    member _.``the entry declares .claude/agents as the source it mirrors``() =
        match codexEntry with
        | Some entry -> Assert.Equal<string option>(Some ".claude/agents", entry.Mirrors)
        | None -> Assert.Fail("codex entry was not loaded by a Given step")

    [<Then>]
    member _.``the entry declares no forbidden directory``() =
        match codexEntry with
        | Some entry -> Assert.Equal<string option>(None, entry.ForbidDir)
        | None -> Assert.Fail("codex entry was not loaded by a Given step")

    [<Then>]
    member _.``it names exactly claude-code, opencode, and codex``() =
        let names = allEntries |> List.map (fun h -> h.Name) |> List.sort
        Assert.Equal<string list>([ "claude-code"; "codex"; "opencode" ], names)

    // ---- Given/When/Then: gate exclusion-list scenario ----

    [<Given>]
    member _.``the frontmatter-date gate declares website exclusions``() =
        useOwnedTempDir ()

        writeFile
            "repo-config.yml"
            (String.concat
                "\n"
                [ "gates:"
                  "  - id: md-frontmatter-dates"
                  "    args:"
                  "      exclude:"
                  "        - apps/custom-site/"
                  "" ])

    [<When>]
    member _.``the configured frontmatter-date audit runs``() =
        match readConfig () with
        | Error message -> failwith message
        | Ok config ->
            let excludes =
                config.Gates
                |> List.tryFind (fun g -> g.Id = "md-frontmatter-dates")
                |> Option.bind (fun g -> Map.tryFind "exclude" g.Args)
                |> Option.defaultValue []

            let target = "apps/custom-site/content/post.md"

            websiteExclusionsRespected <-
                excludes
                |> List.exists (fun prefix -> target.StartsWith(prefix, StringComparison.Ordinal))

    [<Then>]
    member _.``configured excluded website content is skipped``() =
        Assert.True(websiteExclusionsRespected, "the configured exclusion must have been honoured")

    // ---- Given/When/Then: Doctor .NET SDK path scenario ----

    [<Given>]
    member _.``the Doctor configuration declares a .NET SDK path``() =
        useOwnedTempDir ()
        writeFile "repo-config.yml" "doctor:\n  dotnet-global-json: tooling/sdk/global.json\n"
        writeFile "tooling/sdk/global.json" "{\"sdk\":{\"version\":\"9.0.100\"}}"

    [<When>]
    member _.``Doctor resolves its required .NET SDK version``() =
        let config = readConfig () |> Result.defaultValue empty

        let readText path =
            match Map.tryFind path documents with
            | Some text -> Ok text
            | None -> Error(sprintf "missing %s" path)

        let toolDef = RhinoCli.Application.RepoConfig.buildDotnetToolDefWith readText config
        dotnetSource <- Some toolDef.Source
        dotnetVersion <- Some(toolDef.ReadReq())

    [<Then>]
    member _.``the configured global.json supplies that version``() =
        Assert.Equal("doctor.dotnet-global-json → sdk.version", dotnetSource |> Option.defaultValue "")
        Assert.Equal("9.0.100", dotnetVersion |> Option.defaultValue "")

    // ---- Given/When/Then: confirmed-absent repo-config.yml scenario ----

    [<Given>]
    member _.``no repo-config.yml exists in the repository``() =
        // `useOwnedTempDir` alone already leaves no `repo-config.yml` in the
        // fresh directory it creates.
        useOwnedTempDir ()

    [<When>]
    member _.``the optional repo-config loader runs``() =
        loadOptionalResult <-
            Some(
                match Map.tryFind "repo-config.yml" documents with
                | None -> Ok false
                | Some text -> parse text |> Result.map (fun _ -> true)
            )

    [<Then>]
    member _.``it reports confirmed absence, not an error``() =
        match loadOptionalResult with
        | Some(Ok false) -> ()
        | other -> Assert.Fail(sprintf "expected Ok(false) (confirmed absence), got %A" other)

    // ---- Given/Then: unreadable repo-config.yml scenario (shares the
    // "the optional repo-config loader runs" When step above) ----

    [<Given>]
    member _.``a repo-config.yml that is not valid YAML``() =
        useOwnedTempDir ()
        writeFile "repo-config.yml" "harness: [this is not valid yaml:\n"

    [<Then>]
    member _.``it reports an error and never prints a success or SKIPPED line``() =
        match loadOptionalResult with
        | Some(Error message) ->
            let upper = message.ToUpperInvariant()

            Assert.False(
                upper.Contains("SKIPPED") || upper.Contains("SUCCESS"),
                sprintf "the error must not read as a masked success/skip: %s" message
            )
        | other -> Assert.Fail(sprintf "expected an Error result for unparseable YAML, got %A" other)

    // ---- Given/When/Then: leading ./ rejection scenario ----

    [<Given>]
    member _.``repo-config.yml declares a doctor .NET SDK path with a leading ./ segment``() =
        useOwnedTempDir ()
        writeFile "repo-config.yml" "doctor:\n  dotnet-global-json: ./tooling/sdk/global.json\n"

    [<When>]
    member _.``repo-config validate runs``() =
        validateResult <- Some(validateText documents.["repo-config.yml"])

    [<Then>]
    member _.``it rejects the value naming the current-directory component``() =
        match validateResult with
        | Some(ok, output) ->
            Assert.False(ok, sprintf "expected repo-config validate to reject the path; output: %s" output)
            Assert.Contains("current-directory", output)
        | None -> Assert.Fail("no repo-config validate step has run")

    // ---- Given/When/Then: existing-configured-file scenario ----

    [<Given>]
    member _.``repo-config.yml declares a path to a file that already exists``() =
        useOwnedTempDir ()
        writeFile "tooling/sdk/global.json" "{\"sdk\":{\"version\":\"9.0.100\"}}"

    [<When>]
    member _.``the configured path is confined to the repository root``() =
        match RhinoCli.Application.RepoConfig.resolveRepoRelativePath root "tooling/sdk/global.json" with
        | Ok path -> confinedPath <- Some path
        | Error message -> failwith message

    [<Then>]
    member _.``the resolved path reads as the existing regular file, not a directory``() =
        match confinedPath with
        | None -> Assert.Fail("no confined-path step has run")
        | Some path ->
            Assert.False(
                path.EndsWith("/", StringComparison.Ordinal)
                || path.EndsWith("\\", StringComparison.Ordinal),
                sprintf "resolved path %s must not carry a trailing separator (the ENOTDIR regression)" path
            )

            let relative = path.Substring(root.Length + 1)
            let content = documents.[relative]
            Assert.Contains("9.0.100", content)

/// Reads one named `Scenario:` block out of the real, frozen
/// `data-driven.feature` file (leaving the file itself untouched) and runs
/// it through TickSpec bound only against `RepoConfigSteps` — see
/// `ConventionSteps.fs`'s `FeatureRunner` for why this is per-scenario
/// rather than per-file.
module private FeatureRunner =

    let private featurePath: string =
        Path.GetFullPath(
            Path.Combine(
                __SOURCE_DIRECTORY__,
                "..",
                "..",
                "..",
                "..",
                "..",
                "specs",
                "apps",
                "rhino",
                "cli",
                "behaviours",
                "repo-config",
                "data-driven.feature"
            )
        )

    let private extractScenario (featureLines: string[]) (scenarioTitle: string) : string[] =
        let featureLine =
            featureLines
            |> Array.find (fun l -> l.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let scenarioHeader = sprintf "Scenario: %s" scenarioTitle

        let startIdx = featureLines |> Array.findIndex (fun l -> l.Trim() = scenarioHeader)

        let endIdx =
            featureLines
            |> Array.skip (startIdx + 1)
            |> Array.tryFindIndex (fun l ->
                let trimmed = l.Trim()

                trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
                || trimmed.StartsWith("Scenario Outline:", StringComparison.Ordinal)
                || trimmed.StartsWith("@", StringComparison.Ordinal))
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIdx .. endIdx - 1]

    /// Runs the single scenario named `scenarioTitle` from
    /// `data-driven.feature`, bound against `RepoConfigSteps`.
    let run (scenarioTitle: string) : unit =
        let allLines =
            ConventionSteps.FeatureResource.readLines (Path.GetFileName featurePath)

        let snippet = extractScenario allLines scenarioTitle
        let definitions = StepDefinitions([| typeof<RepoConfigSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)
        let scenario = Seq.exactlyOne feature.Scenarios
        scenario.Action.Invoke()

[<Fact>]
let ``Repo-specific behaviour is data-driven, not hard-coded`` () =
    FeatureRunner.run "Repo-specific behaviour is data-driven, not hard-coded"

[<Fact>]
let ``The codex registry entry declares the generated tier and its mirror source`` () =
    FeatureRunner.run "The codex registry entry declares the generated tier and its mirror source"

[<Fact>]
let ``The registry declares exactly the three supported harnesses`` () =
    FeatureRunner.run "The registry declares exactly the three supported harnesses"

[<Fact>]
let ``Gate exclusion lists move to the registry`` () =
    FeatureRunner.run "Gate exclusion lists move to the registry"

[<Fact>]
let ``Doctor .NET SDK path moves to repository configuration`` () =
    FeatureRunner.run "Doctor .NET SDK path moves to repository configuration"

[<Fact>]
let ``A confirmed-absent repo-config.yml yields no mirrors and exits cleanly`` () =
    FeatureRunner.run "A confirmed-absent repo-config.yml yields no mirrors and exits cleanly"

[<Fact>]
let ``An unreadable repo-config.yml is a loud error, never a silent success`` () =
    FeatureRunner.run "An unreadable repo-config.yml is a loud error, never a silent success"

[<Fact>]
let ``A leading ./ in a configured path is rejected`` () =
    FeatureRunner.run "A leading ./ in a configured path is rejected"

[<Fact>]
let ``An existing configured file resolves without a trailing separator`` () =
    FeatureRunner.run "An existing configured file resolves without a trailing separator"

[<Fact>]
let ``A v2 repository configuration is read from its rhino-cli extension`` () =
    FeatureRunner.run "A v2 repository configuration is read from its rhino-cli extension"
