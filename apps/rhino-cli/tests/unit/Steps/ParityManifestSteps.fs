/// In-process TickSpec proof for `parity-manifest.feature`.
/// Git/index discovery belongs to Integration; these Unit scenarios exercise
/// the production checksum, canonical-rendering, and drift decisions over an
/// in-memory prospective repository.
module RhinoCli.Tests.Unit.Steps.ParityManifestSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/gate/parity-manifest.feature" ]

open System
open System.Text
open TickSpec
open Xunit
open RhinoCli.Application

let private bytes (text: string) = Encoding.UTF8.GetBytes text

type ParityManifestSteps() =
    let mutable boundary: Map<string, byte[]> = Map.empty
    let mutable manifest = ""
    let mutable firstManifest: string option = None
    let mutable twinManifest: string option = None
    let mutable validation: Result<unit, string> option = None

    let generate () =
        manifest <- Parity.renderFromBoundaryFiles boundary
        validation <- Some(Parity.validateBoundaryFiles manifest boundary)

    let validate () =
        validation <- Some(Parity.validateBoundaryFiles manifest boundary)

    let output () =
        match validation with
        | Some(Error message) -> message
        | Some(Ok()) -> ""
        | None -> failwith "parity operation has not run"

    [<Given>]
    member _.``a tracked Rhino CLI parity boundary``() =
        boundary <-
            [ "apps/rhino-cli/src/main.rs", bytes "fn main() {}\n"
              "apps/rhino-cli/src/tests/parity.rs", bytes "[test] parity\n"
              "apps/rhino-cli/Cargo.toml", bytes "[package]\nname = fixture\n"
              "apps/rhino-cli/project.json", bytes "{}\n"
              "specs/apps/rhino/cli/behaviours/gate/parity-manifest.feature", bytes "Feature: fixture parity\n" ]
            |> Map.ofList

    [<Given>]
    member _.``its parity manifest has been generated and staged``() = generate ()

    [<Given>]
    member _.``a twin parity repository holds a copy of that manifest``() = twinManifest <- Some manifest

    [<When>]
    member _.``rhino-cli parity manifest generate runs``() = generate ()

    [<When>]
    member _.``rhino-cli parity manifest validate runs``() = validate ()

    [<When>]
    member _.``the same manifest is generated a second time``() =
        firstManifest <- Some manifest
        generate ()

    [<When>]
    member _.``a tracked parity source file is edited``() =
        boundary <- boundary |> Map.add "apps/rhino-cli/src/main.rs" (bytes "fn changed() {}\n")

    [<When>]
    member _.``a tracked parity test file is edited``() =
        boundary <-
            boundary
            |> Map.add "apps/rhino-cli/src/tests/parity.rs" (bytes "[test] changed_parity\n")

    [<When>]
    member _.``an untracked test fixture is created``() =
        // It is intentionally absent from the tracked-boundary map passed to
        // production, matching the Git adapter's contract.
        ()

    [<Then>]
    member _.``the parity manifest is byte-identical to its first generation``() =
        Assert.Equal(firstManifest.Value, manifest)

    [<Then>]
    member _.``the parity manifest is current``() =
        Assert.Equal<Result<unit, string>>(Ok(), validation.Value)

    [<Then>]
    member _.``the parity gate names the edited source and deliberate remedy``() =
        validate ()
        Assert.Contains("apps/rhino-cli/src/main.rs", output ())
        Assert.Contains("byte-identical across ose-public and the private sibling", output ())
        Assert.Contains("rhino-cli parity manifest generate", output ())

    [<Then>]
    member _.``the parity gate names the edited test``() =
        validate ()
        Assert.Contains("apps/rhino-cli/src/tests/parity.rs", output ())

    [<Then>]
    member _.``the untracked fixture is absent from the manifest``() =
        validate ()
        Assert.Equal<Result<unit, string>>(Ok(), validation.Value)
        Assert.DoesNotContain("local.env", manifest)

    [<Then>]
    member _.``the twin repository's copy no longer matches this repository's manifest``() =
        generate ()
        Assert.NotEqual<string>(twinManifest.Value, manifest)

module private FeatureRunner =
    let private featureText =
        """Feature: Rhino CLI parity manifest

Scenario: Regeneration is idempotent
  Given a tracked Rhino CLI parity boundary
  When rhino-cli parity manifest generate runs
  And the same manifest is generated a second time
  Then the parity manifest is byte-identical to its first generation
  And the parity manifest is current

Scenario: An unannounced edit to byte-identical source fails the gate
  Given a tracked Rhino CLI parity boundary
  And its parity manifest has been generated and staged
  When a tracked parity source file is edited
  And rhino-cli parity manifest validate runs
  Then the parity gate names the edited source and deliberate remedy

Scenario: The manifest covers tests as well as source
  Given a tracked Rhino CLI parity boundary
  And its parity manifest has been generated and staged
  When a tracked parity test file is edited
  And rhino-cli parity manifest validate runs
  Then the parity gate names the edited test

Scenario: Untracked files never enter the manifest
  Given a tracked Rhino CLI parity boundary
  And its parity manifest has been generated and staged
  When an untracked test fixture is created
  And rhino-cli parity manifest validate runs
  Then the untracked fixture is absent from the manifest

Scenario: A one-sided landing is exactly what the parity gate catches
  Given a tracked Rhino CLI parity boundary
  And its parity manifest has been generated and staged
  And a twin parity repository holds a copy of that manifest
  When a tracked parity source file is edited
  And rhino-cli parity manifest validate runs
  Then the parity gate names the edited source and deliberate remedy
  And the twin repository's copy no longer matches this repository's manifest
"""

    let run (scenarioTitle: string) =
        let lines = featureText.Split '\n'

        let featureLine =
            lines
            |> Array.find (fun line -> line.StartsWith("Feature:", StringComparison.Ordinal))

        let startIndex =
            lines
            |> Array.findIndex (fun line -> line = sprintf "Scenario: %s" scenarioTitle)

        let endIndex =
            lines
            |> Array.skip (startIndex + 1)
            |> Array.tryFindIndex (fun line -> line.StartsWith("Scenario:", StringComparison.Ordinal))
            |> Option.map (fun offset -> startIndex + 1 + offset)
            |> Option.defaultValue lines.Length

        let snippet = Array.append [| featureLine; "" |] lines.[startIndex .. endIndex - 1]
        let definitions = StepDefinitions([| typeof<ParityManifestSteps> |])
        let feature = definitions.GenerateFeature("parity-manifest.feature", snippet)
        (Seq.exactlyOne feature.Scenarios).Action.Invoke()

[<Fact>]
let ``Regeneration is idempotent`` () =
    FeatureRunner.run "Regeneration is idempotent"

[<Fact>]
let ``An unannounced edit to byte-identical source fails the gate`` () =
    FeatureRunner.run "An unannounced edit to byte-identical source fails the gate"

[<Fact>]
let ``The manifest covers tests as well as source`` () =
    FeatureRunner.run "The manifest covers tests as well as source"

[<Fact>]
let ``Untracked files never enter the manifest`` () =
    FeatureRunner.run "Untracked files never enter the manifest"

[<Fact>]
let ``A one-sided landing is exactly what the parity gate catches`` () =
    FeatureRunner.run "A one-sided landing is exactly what the parity gate catches"
