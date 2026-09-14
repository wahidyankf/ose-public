/// TickSpec step definitions binding the `convention` namespace's two
/// Gherkin feature files to `RhinoCli.Application.Convention`
/// [Repo-grounded —
/// `specs/apps/rhino/cli/behaviours/convention/convention-audit.feature`,
/// `.../repo-governance-license-audit.feature`]. Emoji rules are RHINO's
/// `convention-emoji` section.
///
/// Each xunit `[<Fact>]` below runs exactly one scenario at a time: it slices
/// the single named scenario's lines out of the real, frozen feature file
/// (never rewriting or duplicating its wording) and hands that snippet to
/// `TickSpec.StepDefinitions.GenerateFeature`, so binding is per-scenario
/// rather than per-file — an unbound scenario elsewhere in the same feature
/// file cannot block a scenario whose steps are already implemented.
module RhinoCli.Tests.Integration.Steps.ConventionResourceSteps

/// Explicit static-coverage ownership; the validator scopes this file's
/// TickSpec bindings to these canonical features.
let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/convention/convention-audit.feature"
      "specs/apps/rhino/cli/behaviours/convention/repo-governance-license-audit.feature" ]


open System
open System.IO
open TickSpec
open Xunit
open RhinoCli.Application.Convention

/// Instance step-definition container. TickSpec instantiates one fresh
/// instance per scenario invocation, so instance-level mutable fields are
/// the idiomatic way to thread state from Given through When to Then without
/// leaking it across scenarios or xunit test parallelism.
type ConventionSteps() =
    let mutable rootDir: string option = None
    let mutable targetPath: string option = None
    let mutable result: ValidatorResult option = None

    let root () =
        match rootDir with
        | Some dir -> dir
        | None -> failwith "no repository root has been prepared by a Given step"

    let target () =
        match targetPath with
        | Some path -> path
        | None -> failwith "no target path has been prepared by a Given step"

    let outcome () =
        match result with
        | Some r -> r
        | None -> failwith "no command has been run by a When step"

    let newTempDir () =
        let dir =
            Path.Combine(Path.GetTempPath(), "rhino-cli-convention-" + Guid.NewGuid().ToString("N"))

        Directory.CreateDirectory(dir) |> ignore
        dir

    let writeFile (relativePath: string) (content: string) =
        let full = Path.Combine(root (), relativePath)
        Directory.CreateDirectory(Path.GetDirectoryName(full)) |> ignore
        File.WriteAllText(full, content)

    // ---- Given: repo-governance-license-audit.feature ----

    [<Given>]
    member _.``a repository where every required directory has a matching MIT LICENSE file``() =
        rootDir <- Some(newTempDir ())
        writeFile "apps/foo/LICENSE" "MIT License\n"
        writeFile "libs/bar/LICENSE" "MIT License\n"
        writeFile "specs/LICENSE" "MIT License\n"

    [<Given>]
    member _.``a repository where one app directory is missing its LICENSE file``() =
        rootDir <- Some(newTempDir ())
        Directory.CreateDirectory(Path.Combine(root (), "apps", "foo")) |> ignore

    [<Given>]
    member _.``a repository where one lib directory is missing its LICENSE file``() =
        rootDir <- Some(newTempDir ())
        Directory.CreateDirectory(Path.Combine(root (), "libs", "bar")) |> ignore

    [<Given>]
    member _.``a repository where a LICENSING-NOTICE.md table row claims a license that disagrees with the on-disk LICENSE file``
        ()
        =
        rootDir <- Some(newTempDir ())
        writeFile "apps/foo/LICENSE" "MIT License\n"

        writeFile "LICENSING-NOTICE.md" "# Notice\n\n| Path | License |\n| --- | --- |\n| apps/foo | Apache-2.0 |\n"

    // ---- When ----

    [<When>]
    member _.``the developer runs convention license validate``() =
        result <- Some(runLicenseValidate (root ()))

    [<When>]
    member _.``the developer runs "rhino-cli convention audit"``() =
        // Emoji is RHINO's `convention emoji validate`; F# aggregates the license member.
        result <- Some(aggregateConventionResults [ "license", runLicenseValidate (root ()) ] [])

    // ---- Then ----

    [<Then>]
    member _.``the command exits successfully``() =
        let r = outcome ()
        Assert.True(r.Success, sprintf "expected success, got output:\n%s" r.Output)

    [<Then>]
    member _.``the command exits with a failure code``() =
        let r = outcome ()
        Assert.False(r.Success, sprintf "expected failure, got output:\n%s" r.Output)

    [<Then>]
    member _.``the output reports zero license findings``() = Assert.Empty((outcome ()).Findings)

    [<Then>]
    member _.``the output identifies the missing LICENSE app directory``() =
        let r = outcome ()

        Assert.Contains(
            r.Findings,
            fun (f: RhinoCli.Domain.Types.Finding) -> f.Message.Contains("missing-license") && f.Path = Some "apps/foo"
        )

    [<Then>]
    member _.``the output identifies the missing LICENSE lib directory``() =
        let r = outcome ()

        Assert.Contains(
            r.Findings,
            fun (f: RhinoCli.Domain.Types.Finding) -> f.Message.Contains("missing-license") && f.Path = Some "libs/bar"
        )

    [<Then>]
    member _.``the output identifies the SPDX mismatch``() =
        let r = outcome ()

        Assert.Contains(r.Findings, fun (f: RhinoCli.Domain.Types.Finding) -> f.Message.Contains("spdx-mismatch"))

    [<Then>]
    member _.``the output names the failing "(.*)" validator``(name: string) =
        let r = outcome ()
        Assert.Contains(sprintf "%s:" name, r.Output)

    [<AfterScenario>]
    member _.Cleanup() =
        match rootDir with
        | Some dir when Directory.Exists dir -> Directory.Delete(dir, true)
        | _ -> ()

/// Reads one named `Scenario:` block out of a real, frozen feature file
/// (leaving the file itself untouched) and runs it through TickSpec bound
/// only against `ConventionSteps` — see the module doc comment for why this
/// is per-scenario rather than per-file.
module private FeatureRunner =

    let private specsRoot: string =
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
                "convention"
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
                || trimmed.StartsWith("Scenario Outline:", StringComparison.Ordinal))
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIdx .. endIdx - 1]

    /// Runs the single scenario named `scenarioTitle` from `featureFileName`
    /// (a file name under the `convention` Gherkin directory), bound against
    /// `ConventionSteps`.
    let run (featureFileName: string) (scenarioTitle: string) : unit =
        let featurePath = Path.Combine(specsRoot, featureFileName)
        let allLines = File.ReadAllLines featurePath
        let snippet = extractScenario allLines scenarioTitle
        let definitions = StepDefinitions([| typeof<ConventionSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)
        let scenario = Seq.exactlyOne feature.Scenarios
        scenario.Action.Invoke()

// ---- convention-audit.feature ----

[<Fact>]
let ``A missing LICENSE fails the aggregate convention audit`` () =
    FeatureRunner.run "convention-audit.feature" "A missing LICENSE fails the aggregate convention audit"

// ---- repo-governance-license-audit.feature ----

[<Fact>]
let ``Clean repository where every app/lib/specs has matching LICENSE passes`` () =
    FeatureRunner.run
        "repo-governance-license-audit.feature"
        "Clean repository where every app/lib/specs has matching LICENSE passes"

[<Fact>]
let ``App directory missing LICENSE file fails`` () =
    FeatureRunner.run "repo-governance-license-audit.feature" "App directory missing LICENSE file fails"

[<Fact>]
let ``Lib directory missing LICENSE file fails`` () =
    FeatureRunner.run "repo-governance-license-audit.feature" "Lib directory missing LICENSE file fails"

[<Fact>]
let ``LICENSING-NOTICE.md table row mismatching SPDX in LICENSE fails`` () =
    FeatureRunner.run
        "repo-governance-license-audit.feature"
        "LICENSING-NOTICE.md table row mismatching SPDX in LICENSE fails"
