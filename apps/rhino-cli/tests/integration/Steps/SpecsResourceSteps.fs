/// TickSpec bindings for the active specification structure corpus.
module RhinoCli.Tests.Integration.Steps.SpecsResourceSteps

/// Explicit static-coverage ownership; the validator scopes this file's
/// TickSpec bindings to these canonical features.
let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/specs/specs-audit.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-adoption.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-counts.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-links.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-logical-corpus.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-tree.feature" ]


open System
open System.IO
open TickSpec
open Xunit
open RhinoCli.Application
open RhinoCli.Application.Specs

type SpecsSteps() =
    // ---- spec-tree validator state (validate-adoption/counts/links/tree, specs-audit) ----

    let mutable specRoot: string option = None
    let mutable specApp: string = "testapp"
    let mutable specFolder: string = ""
    let mutable specFindings: SpecFinding list = []
    let mutable specOutput: string = ""
    let mutable specExit: int = 0

    // ---- harness-bindings / harness-registry-driven state ----

    let mutable harnessEntries: RepoConfig.HarnessEntry list = []
    let mutable harnessAccepted: string list = []
    let mutable harnessKnownNameResult: Result<unit, string> option = None
    let mutable harnessUnknownNameResult: Result<unit, string> option = None
    let mutable harnessTargetDirs: (string list * string list) option = None
    let mutable harnessExtendedDirs: (string list * string list) option = None
    let mutable retiredTierParse: Result<RepoConfig.RepoConfig, string> option = None

    // ---- worktree-agnostic state ----

    let mutable worktreeDetection: Result<Env.WorktreeInfo, string> option = None
    let mutable worktreeToplevel: string = ""

    /// Repository root, six levels above this steps file.
    let repositoryRoot: string =
        Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

    let specFixtureRoot () : string =
        match specRoot with
        | Some dir -> dir
        | None ->
            let dir =
                Path.Combine(Path.GetTempPath(), "rhino-cli-specs-" + Guid.NewGuid().ToString("N"))

            Directory.CreateDirectory dir |> ignore
            specRoot <- Some dir
            dir

    /// Creates the five retired spec subfolders for `app`, each with a
    /// `README.md`; `withSpecFile` additionally drops one non-README spec file
    /// into each. Only negative scenarios use this — it builds the shape the
    /// validators no longer accept.
    let specCreateTree (app: string) (withSpecFile: bool) : string =
        let baseDir = Path.Combine(specFixtureRoot (), "specs", "apps", app)

        for folder in retiredSpecFolders do
            let dir = Path.Combine(baseDir, folder)
            Directory.CreateDirectory dir |> ignore
            File.WriteAllText(Path.Combine(dir, "README.md"), "# Index\n")

            if withSpecFile then
                File.WriteAllText(Path.Combine(dir, "spec.md"), "# Spec\n")

        baseDir

    /// Builds one logical owner corpus under `specs/apps/<app>/<owner>/` and
    /// returns its absolute root. Each `with*` flag drops exactly one required
    /// entry, so a scenario names the single thing it is proving the validator
    /// notices rather than assembling a tree by hand.
    let specCreateCorpus
        (app: string)
        (owner: string)
        (withReadme: bool)
        (withBehaviors: bool)
        (withFeature: bool)
        (withBehaviorsReadme: bool)
        : string =
        let ownerDir = Path.Combine(specFixtureRoot (), "specs", "apps", app, owner)
        Directory.CreateDirectory ownerDir |> ignore
        File.WriteAllText(Path.Combine(ownerDir, "architecture.md"), "# Architecture\n")

        if withReadme then
            File.WriteAllText(Path.Combine(ownerDir, "README.md"), "# Index\n")

        if withBehaviors then
            let behavioursDir = Path.Combine(ownerDir, "behaviours")
            Directory.CreateDirectory behavioursDir |> ignore

            if withBehaviorsReadme then
                File.WriteAllText(Path.Combine(behavioursDir, "README.md"), "# Index\n")

            if withFeature then
                File.WriteAllText(
                    Path.Combine(behavioursDir, "example.feature"),
                    String.Join(
                        "\n",
                        [ "Feature: Example"
                          ""
                          "  Scenario: Works"
                          "    Given a thing"
                          "    When it runs"
                          "    Then it passes"
                          "" ]
                    )
                )

        ownerDir

    /// Builds one library corpus under `specs/libs/<lib>/` — the same three
    /// entries as an owner corpus, sitting at the library root because a
    /// library has no product directory to nest an owner under.
    let specCreateLibCorpus (lib: string) (withBehaviorsReadme: bool) : string =
        let libDir = Path.Combine(specFixtureRoot (), "specs", "libs", lib)
        let behavioursDir = Path.Combine(libDir, "behaviours")
        Directory.CreateDirectory behavioursDir |> ignore
        File.WriteAllText(Path.Combine(libDir, "architecture.md"), "# Architecture\n")
        File.WriteAllText(Path.Combine(libDir, "README.md"), "# Index\n")

        if withBehaviorsReadme then
            File.WriteAllText(Path.Combine(behavioursDir, "README.md"), "# Index\n")

        File.WriteAllText(
            Path.Combine(behavioursDir, "example.feature"),
            String.Join(
                "\n",
                [ "Feature: Example"
                  ""
                  "  Scenario: Works"
                  "    Given a thing"
                  "    When it runs"
                  "    Then it passes"
                  "" ]
            )
        )

        libDir

    /// Records one validator run's findings, rendered output, and exit code.
    let specRecord (findings: SpecFinding list) : unit =
        specFindings <- findings
        specOutput <- formatSpecFindingsText specApp findings
        specExit <- (if List.isEmpty findings then 0 else 1)

    /// Builds a `HarnessEntry` with only the fields these scenarios read.
    let harnessEntry (name: string) (tier: RepoConfig.Tier) (agentDir: string option) : RepoConfig.HarnessEntry =
        { Name = name
          Tier = tier
          AgentDir = agentDir
          Mirrors = None
          ForbidDir = None
          SkillsDir = None
          SkillsMirrors = None
          Vendored = []
          ModelMap = Map.empty
          Catalog = None
          Ownership = [] }

    // ---- Given/When/Then (`specs-audit.feature`) ----

    [<Given>]
    member _.``a repository with no spec-tree violations``() =
        specApp <- "testapp"
        specCreateCorpus "testapp" "cli" true true true true |> ignore

    [<When>]
    member _.``the developer runs rhino-cli specs audit``() =
        let root = specFixtureRoot ()

        // Every member runs for real against the clean fixture — a stubbed
        // runner would make the PASSED assertion vacuous.
        let runMember (name: string) : Result<unit, string> =
            let findings =
                match name with
                | "structure-validate" ->
                    validateSpecAdoption root specApp
                    @ validateSpecTree root specApp
                    @ validateSpecCounts root (sprintf "specs/apps/%s" specApp)
                | "validate-links" -> validateSpecLinks root (sprintf "specs/apps/%s" specApp)
                | other -> failwithf "unknown specs audit member: %s" other

            if List.isEmpty findings then
                Ok()
            else
                Error(sprintf "%d finding(s)" (List.length findings))

        let outcome = runSpecsAudit [] runMember
        specOutput <- outcome.Summary
        specExit <- (if outcome.Passed then 0 else 1)

    // ---- Given (`validate-adoption.feature`) ----

    [<Given>]
    member _.``an app "testapp" with an owner corpus and no ddd tree at specs/apps/testapp/ddd``() =
        specApp <- "testapp"
        specCreateCorpus "testapp" "cli" true true true true |> ignore

    [<Given>]
    member _.``an app "testapp" holding only the retired five folders``() =
        specApp <- "testapp"
        specCreateTree "testapp" true |> ignore

    [<Given>]
    member _.``an app "testapp" with an owner corpus and a retired ddd tree at specs/apps/testapp/ddd``() =
        specApp <- "testapp"
        specCreateCorpus "testapp" "cli" true true true true |> ignore

        Directory.CreateDirectory(Path.Combine(specFixtureRoot (), "specs", "apps", "testapp", "ddd"))
        |> ignore

    [<Given>]
    member _.``an app "unknownapp" with no spec tree at all``() =
        specApp <- "unknownapp"
        specFixtureRoot () |> ignore

    // ---- Given (`validate-counts.feature`) ----

    [<Given>]
    member _.``no directory exists at "specs/apps/nosuchapp"``() =
        specApp <- "nosuchapp"
        specFolder <- "specs/apps/nosuchapp"

        Assert.False(
            Directory.Exists(Path.Combine(specFixtureRoot (), "specs", "apps", "nosuchapp")),
            "fixture must not create the folder under test"
        )

    [<When>]
    member _.``the developer runs "rhino-cli specs counts validate specs/apps/testapp"``() =
        specRecord (validateSpecCounts (specFixtureRoot ()) "specs/apps/testapp")

    [<When>]
    member _.``the developer runs "rhino-cli specs counts validate specs/apps/nosuchapp"``() =
        specRecord (validateSpecCounts (specFixtureRoot ()) "specs/apps/nosuchapp")

    [<Given>]
    member _.``a library corpus at "specs/libs/testlib" carrying architecture.md and a non-empty behaviours/``() =
        specFolder <- "specs/libs/testlib"
        specCreateLibCorpus "testlib" true |> ignore

    [<Given>]
    member _.``a library corpus at "specs/libs/testlib" whose behaviours/ folder has no README.md``() =
        specFolder <- "specs/libs/testlib"
        specCreateLibCorpus "testlib" false |> ignore

    [<When>]
    member _.``the developer runs "rhino-cli specs counts validate specs/libs/testlib"``() =
        specRecord (validateSpecCounts (specFixtureRoot ()) "specs/libs/testlib")

    // ---- Given (`validate-links.feature`) ----

    [<Given>]
    member _.``a spec folder at "specs/apps/testapp" where all internal markdown links resolve to existing files``() =
        specApp <- "testapp"
        let baseDir = specCreateTree "testapp" true
        File.WriteAllText(Path.Combine(baseDir, "product", "target.md"), "# Target\n")
        File.WriteAllText(Path.Combine(baseDir, "product", "spec.md"), "# Spec\n\n[target](./target.md)\n")

    [<Given>]
    member _.``a spec folder at "specs/apps/testapp" containing a markdown file with a broken internal link``() =
        specApp <- "testapp"
        let baseDir = specCreateTree "testapp" true
        File.WriteAllText(Path.Combine(baseDir, "product", "spec.md"), "# Spec\n\n![missing](./no-such-file.png)\n")

    [<Given>]
    member _.``a spec folder at "specs/apps/testapp" containing only markdown files with external HTTPS links``() =
        specApp <- "testapp"
        let baseDir = specCreateTree "testapp" true
        File.WriteAllText(Path.Combine(baseDir, "product", "spec.md"), "# Spec\n\n[home](https://example.com)\n")

    [<When>]
    member _.``the developer runs "rhino-cli md links validate specs/apps/testapp"``() =
        specRecord (validateSpecLinks (specFixtureRoot ()) "specs/apps/testapp")

        if List.isEmpty specFindings then
            specOutput <- "All links valid! No broken links found.\n"

    [<When>]
    member _.``the developer runs "rhino-cli md links validate specs/apps/nosuchapp"``() =
        specRecord (validateSpecLinks (specFixtureRoot ()) "specs/apps/nosuchapp")

    // ---- Given (`validate-tree.feature`) ----

    [<Given>]
    member _.``a spec tree for "testapp" whose one owner corpus is complete``() =
        specApp <- "testapp"
        specFolder <- "specs/apps/testapp"
        specCreateCorpus "testapp" "cli" true true true true |> ignore

    [<Given>]
    member _.``a spec tree for "testapp" holding only the retired five folders``() =
        specApp <- "testapp"
        specFolder <- "specs/apps/testapp"
        specCreateTree "testapp" true |> ignore

    [<Given>]
    member _.``no spec tree exists for "unknownapp"``() =
        specApp <- "unknownapp"

        Assert.False(
            Directory.Exists(Path.Combine(specFixtureRoot (), "specs", "apps", "unknownapp")),
            "fixture must not create a spec tree for unknownapp"
        )

    // ---- Given/When (`validate-logical-corpus.feature`) ----

    [<Given>]
    member _.``a logical owner corpus for "testapp" at "cli" with its README, architecture, and a behaviours feature``
        ()
        =
        specApp <- "testapp"
        specCreateCorpus "testapp" "cli" true true true true |> ignore

    [<Given>]
    member _.``a logical owner corpus for "testapp" at "cli" whose README.md is absent``() =
        specApp <- "testapp"
        specCreateCorpus "testapp" "cli" false true true true |> ignore

    [<Given>]
    member _.``a logical owner corpus for "testapp" at "cli" whose behaviours directory is absent``() =
        specApp <- "testapp"
        specCreateCorpus "testapp" "cli" true false false false |> ignore

    [<Given>]
    member _.``a logical owner corpus for "testapp" at "cli" whose behaviours directory holds no feature file``() =
        specApp <- "testapp"
        specCreateCorpus "testapp" "cli" true true false true |> ignore

    [<Given>]
    member _.``a logical owner corpus for "testapp" at "cli" whose behaviours directory has no README.md``() =
        specApp <- "testapp"
        specCreateCorpus "testapp" "cli" true true true false |> ignore

    [<Given>]
    member _.``a logical owner corpus for "testapp" at "cli" beside a surviving "product" folder``() =
        specApp <- "testapp"
        specCreateCorpus "testapp" "cli" true true true true |> ignore

        Directory.CreateDirectory(Path.Combine(specFixtureRoot (), "specs", "apps", "testapp", "product"))
        |> ignore

    [<When>]
    member _.``the developer runs "rhino-cli specs structure validate testapp"``() =
        specRecord (
            validateSpecAdoption (specFixtureRoot ()) "testapp"
            @ validateSpecTree (specFixtureRoot ()) "testapp"
        )

    [<When>]
    member _.``the developer runs "rhino-cli specs structure validate unknownapp"``() =
        specRecord (
            validateSpecAdoption (specFixtureRoot ()) "unknownapp"
            @ validateSpecTree (specFixtureRoot ()) "unknownapp"
        )

    // ---- Then (shared by every spec-tree validator scenario) ----

    [<Then>]
    member _.``the command exits successfully``() = Assert.Equal(0, specExit)

    [<Then>]
    member _.``the command exits with a failure code``() = Assert.NotEqual(0, specExit)

    [<Then>]
    member _.``the output contains "0 finding"``() =
        Assert.Contains("0 finding", specOutput, StringComparison.Ordinal)

    [<Then>]
    member _.``the output contains "All links valid"``() =
        Assert.Contains("All links valid", specOutput, StringComparison.Ordinal)

    [<Then>]
    member _.``the output contains "missing required entry: README.md"``() =
        Assert.Contains("missing required entry: README.md", specOutput, StringComparison.Ordinal)

    [<Then>]
    member _.``the output contains "missing required entry: behaviours"``() =
        Assert.Contains("missing required entry: behaviours", specOutput, StringComparison.Ordinal)

    [<Then>]
    member _.``the output contains "missing required entry: behaviours/README.md"``() =
        Assert.Contains("missing required entry: behaviours/README.md", specOutput, StringComparison.Ordinal)

    [<Then>]
    member _.``the output contains "legacy folder product survives beside a logical owner corpus"``() =
        Assert.Contains(
            "legacy folder product survives beside a logical owner corpus",
            specOutput,
            StringComparison.Ordinal
        )

    [<Then>]
    member _.``the output contains "no feature files"``() =
        Assert.Contains("no feature files", specOutput, StringComparison.Ordinal)

    [<Then>]
    member _.``the output contains "no logical owner corpus"``() =
        Assert.Contains("no logical owner corpus", specOutput, StringComparison.Ordinal)

    [<Then>]
    member _.``the output contains "is neither a logical owner corpus nor a product holding one"``() =
        Assert.Contains(
            "is neither a logical owner corpus nor a product holding one",
            specOutput,
            StringComparison.Ordinal
        )

    [<Then>]
    member _.``the output contains "retired ddd/ tree"``() =
        Assert.Contains("retired ddd/ tree", specOutput, StringComparison.Ordinal)

    [<Then>]
    member _.``the output contains "does not exist"``() =
        Assert.Contains("does not exist", specOutput, StringComparison.Ordinal)

    [<Then>]
    member _.``the output contains "broken link"``() =
        Assert.Contains("broken link", specOutput, StringComparison.Ordinal)

    [<Then>]
    member _.``the output contains "SPECS AUDIT PASSED"``() =
        Assert.Contains("SPECS AUDIT PASSED", specOutput, StringComparison.Ordinal)

module private FeatureRunner =

    let private featureDir: string =
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
                "specs"
            )
        )

    let private extractScenario (featureLines: string[]) (scenarioTitle: string) : string[] =
        let featureLine =
            featureLines
            |> Array.find (fun l -> l.TrimStart().StartsWith("Feature:", System.StringComparison.Ordinal))

        let scenarioHeader = sprintf "Scenario: %s" scenarioTitle

        let startIdx = featureLines |> Array.findIndex (fun l -> l.Trim() = scenarioHeader)

        let endIdx =
            featureLines
            |> Array.skip (startIdx + 1)
            |> Array.tryFindIndex (fun l ->
                let trimmed = l.Trim()

                trimmed.StartsWith("Scenario:", System.StringComparison.Ordinal)
                || trimmed.StartsWith("Scenario Outline:", System.StringComparison.Ordinal)
                || trimmed.StartsWith("@", System.StringComparison.Ordinal))
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIdx .. endIdx - 1]

    let private runPath (featurePath: string) (scenarioTitle: string) : unit =
        let allLines = File.ReadAllLines featurePath
        let snippet = extractScenario allLines scenarioTitle
        let definitions = StepDefinitions([| typeof<SpecsSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)
        let scenario = Seq.exactlyOne feature.Scenarios
        scenario.Action.Invoke()

    /// Runs the single scenario named `scenarioTitle` from `featureFileName`
    /// (a file directly inside `gherkin/specs/`), bound against `SpecsSteps`.
    let run (featureFileName: string) (scenarioTitle: string) : unit =
        runPath (Path.Combine(featureDir, featureFileName)) scenarioTitle

    /// Same as [`run`], for a feature file in a sibling `gherkin/<subdir>/`
    /// folder rather than `gherkin/specs/`.
    let runFrom (subdir: string) (featureFileName: string) (scenarioTitle: string) : unit =
        runPath (Path.Combine(featureDir, "..", subdir, featureFileName)) scenarioTitle

[<Fact>]
let ``Every specs validator passes on a repository with no spec violations`` () =
    FeatureRunner.run "specs-audit.feature" "Every specs validator passes on a repository with no spec violations"

[<Fact>]
let ``app with an owner corpus and no retired ddd tree passes validation`` () =
    FeatureRunner.run "validate-adoption.feature" "app with an owner corpus and no retired ddd tree passes validation"

[<Fact>]
let ``app with no owner corpus reports a finding`` () =
    FeatureRunner.run "validate-adoption.feature" "app with no owner corpus reports a finding"

[<Fact>]
let ``app with a surviving retired ddd tree reports a finding`` () =
    FeatureRunner.run "validate-adoption.feature" "app with a surviving retired ddd tree reports a finding"

[<Fact>]
let ``unknown app with no spec tree at all reports an adoption finding`` () =
    FeatureRunner.run "validate-adoption.feature" "unknown app with no spec tree at all reports an adoption finding"

[<Fact>]
let ``product directory whose owners are corpora passes validation`` () =
    FeatureRunner.run "validate-counts.feature" "product directory whose owners are corpora passes validation"

[<Fact>]
let ``folder that is neither a corpus nor a product holding one reports a finding`` () =
    FeatureRunner.run
        "validate-counts.feature"
        "folder that is neither a corpus nor a product holding one reports a finding"

[<Fact(DisplayName = "folder path that does not exist reports an error (validate-counts)")>]
let ``folder path that does not exist reports an error - counts`` () =
    FeatureRunner.run "validate-counts.feature" "folder path that does not exist reports an error"

[<Fact>]
let ``a library corpus at the folder root is measured by the corpus rules`` () =
    FeatureRunner.run "validate-counts.feature" "a library corpus at the folder root is measured by the corpus rules"

[<Fact>]
let ``a library corpus missing its behaviours index reports a finding`` () =
    FeatureRunner.run "validate-counts.feature" "a library corpus missing its behaviours index reports a finding"

[<Fact>]
let ``folder with all valid internal links passes validation`` () =
    FeatureRunner.run "validate-links.feature" "folder with all valid internal links passes validation"

[<Fact>]
let ``markdown file with broken internal link reports a finding`` () =
    FeatureRunner.run "validate-links.feature" "markdown file with broken internal link reports a finding"

[<Fact>]
let ``markdown file with only external HTTPS links passes validation`` () =
    FeatureRunner.run "validate-links.feature" "markdown file with only external HTTPS links passes validation"

[<Fact(DisplayName = "folder path that does not exist reports an error (validate-links)")>]
let ``folder path that does not exist reports an error - links`` () =
    FeatureRunner.run "validate-links.feature" "folder path that does not exist reports an error"

[<Fact>]
let ``product whose owner corpus is complete passes validation`` () =
    FeatureRunner.run "validate-tree.feature" "product whose owner corpus is complete passes validation"

[<Fact>]
let ``product with no owner corpus at all reports a finding`` () =
    FeatureRunner.run "validate-tree.feature" "product with no owner corpus at all reports a finding"

[<Fact>]
let ``product directory holding only retired folders reports a finding`` () =
    FeatureRunner.run "validate-tree.feature" "product directory holding only retired folders reports a finding"

[<Fact>]
let ``a product whose single owner corpus is complete passes validation`` () =
    FeatureRunner.run
        "validate-logical-corpus.feature"
        "a product whose single owner corpus is complete passes validation"

[<Fact>]
let ``an owner corpus missing its README reports a finding`` () =
    FeatureRunner.run "validate-logical-corpus.feature" "an owner corpus missing its README reports a finding"

[<Fact>]
let ``an owner corpus with no behaviours directory reports a finding`` () =
    FeatureRunner.run "validate-logical-corpus.feature" "an owner corpus with no behaviours directory reports a finding"

[<Fact>]
let ``an owner corpus whose behaviours tree holds no feature file reports a finding`` () =
    FeatureRunner.run
        "validate-logical-corpus.feature"
        "an owner corpus whose behaviours tree holds no feature file reports a finding"

[<Fact>]
let ``an owner corpus whose behaviours tree has no index reports a finding`` () =
    FeatureRunner.run
        "validate-logical-corpus.feature"
        "an owner corpus whose behaviours tree has no index reports a finding"

[<Fact>]
let ``legacy five-folder scaffolding surviving beside a corpus reports a finding`` () =
    FeatureRunner.run
        "validate-logical-corpus.feature"
        "legacy five-folder scaffolding surviving beside a corpus reports a finding"
