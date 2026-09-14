/// TickSpec step definitions binding `gate-declaration.feature` to
/// `RhinoCli.Application.RepoConfig`'s gate-registry schema and semantic
/// findings, plus `RhinoCli.Cli.Gate`'s per-surface projection
/// [Repo-grounded —
/// `specs/apps/rhino/cli/behaviours/gate/gate-declaration.feature`,
/// `apps/rhino-cli/tests/gate_specs.rs`].
///
/// Each scenario writes a self-contained `repo-config.yml` into a throwaway
/// temp directory and calls the ported entry points in-process, mirroring
/// `RepoConfigValidateSteps.fs`'s convention rather than shelling out — the
/// Rust suite spawns the real binary only because Rust has no in-process
/// equivalent that also exercises its CLI error rendering.
///
/// Scope note: the feature file's last two scenarios ("lockfile-sync
/// regenerates the lockfile and restages it" and "lockfile-sync is a no-op
/// when the lockfile is already current") exercise `gate run`, whose port
/// lands with `gate-execution.feature`. They are bound there rather than
/// duplicated here.
module RhinoCli.Tests.E2E.Steps.GateDeclarationProcessSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/gate/gate-declaration.feature" ]

open System
open System.Diagnostics
open System.IO
open TickSpec
open Xunit

let private repoRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

let private executable =
    Path.Combine(repoRoot, "apps/rhino-cli/src/dist/rhino-cli-fsharp")

let private runCli (root: string) (arguments: string list) =
    let info =
        ProcessStartInfo(
            FileName = executable,
            WorkingDirectory = root,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        )

    arguments |> List.iter info.ArgumentList.Add
    use proc = Process.Start info
    let stdout = proc.StandardOutput.ReadToEnd()
    let stderr = proc.StandardError.ReadToEnd()
    proc.WaitForExit()
    proc.ExitCode, stdout + stderr

let private initializeGitRepository (root: string) =
    let info =
        ProcessStartInfo(FileName = "git", WorkingDirectory = root, UseShellExecute = false)

    info.ArgumentList.Add "init"
    info.ArgumentList.Add "--quiet"
    use proc = Process.Start info
    proc.WaitForExit()
    Assert.Equal(0, proc.ExitCode)

/// `repo-config validate` is a split command that starts `./rhino` at the
/// repository root before its F# remainder; this no-op stand-in lets the
/// scenarios exercise that remainder.
let private stubRhino (root: string) =
    let path = Path.Combine(root, "rhino")
    File.WriteAllText(path, "#!/bin/sh\nexit 0\n")

    File.SetUnixFileMode(path, UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute)

/// Mirrors `gate_specs.rs::config` — a registry-only document.
let private config (gates: string) : string = "gates:\n" + gates

/// Mirrors `gate_specs.rs::strict_config` — a registry plus the sections the
/// strict schema requires alongside it.
let private strictConfig (gates: string) : string =
    "harness:\n"
    + "  - { name: fixture, tier: source, agent-dir: .fixture/agents }\n"
    + "coverage:\n"
    + "  projects:\n"
    + "    - name: fixture\n"
    + "      levels: [unit]\n"
    + "      specs: \"specs/**\"\n"
    + "specs:\n"
    + "  ddd-areas: []\n"
    + "  domain-areas: []\n"
    + "gates:\n"
    + gates

/// Mirrors `gate_specs.rs::gate`.
let private gate (id: string) (gateType: string) (command: string) (kind: string) (surfaces: string) : string =
    sprintf
        "  - id: %s\n    type: %s\n    command: %s\n    kind: %s\n    surfaces:\n%s"
        id
        gateType
        command
        kind
        surfaces

/// Instance step-definition container — see `ConventionSteps.fs`'s module doc
/// comment for why TickSpec's one-instance-per-scenario lifecycle makes
/// instance-level mutable fields the idiomatic state-threading mechanism.
type GateDeclarationSteps() =
    let root =
        let dir =
            Path.Combine(Path.GetTempPath(), "rhino-cli-gate-declaration-" + Guid.NewGuid().ToString("N"))

        Directory.CreateDirectory dir |> ignore
        initializeGitRepository dir
        stubRhino dir
        dir

    let mutable pendingGateType: string option = None
    let mutable succeeded: bool option = None
    let mutable output: string = ""
    let mutable jsonOutput: string option = None

    let write (relative: string) (contents: string) =
        File.WriteAllText(Path.Combine(root, relative), contents)

    let isSuccess () =
        match succeeded with
        | Some value -> value
        | None -> failwith "scenario command ran"

    [<Given>]
    member _.``repo-config.yml declares a gate "([^"]+)" with command "([^"]+)"``(id: string, command: string) =
        write
            "repo-config.yml"
            (strictConfig (
                gate
                    id
                    "check"
                    command
                    "rhino-cli"
                    "      pre-push: { scope: all-file-type }\n      ci: { scope: all-file-type }\n"
            ))

    [<Given>]
    member _.``that gate declares surface "([^"]+)" with scope "([^"]+)"``(surface: string, scope: string) =
        let configText = File.ReadAllText(Path.Combine(root, "repo-config.yml"))

        Assert.Contains(sprintf "%s: { scope: %s }" surface scope, configText)

    [<When>]
    member _.``"rhino-cli gate list --surface=pre-push --format=json" runs``() =
        let exitCode, rendered =
            runCli root [ "gate"; "list"; "--surface=pre-push"; "--format=json" ]

        succeeded <- Some(exitCode = 0)
        output <- rendered
        jsonOutput <- if exitCode = 0 then Some rendered else None

    [<Then>]
    member _.``the output contains an entry with id "([^"]+)"``(id: string) =
        Assert.True(
            output.Contains(sprintf "\"id\": \"%s\"" id, StringComparison.Ordinal),
            sprintf "gate list output lacks %s: %s" id output
        )

    [<Then>]
    member _.``that entry reports scope "([^"]+)"``(scope: string) =
        Assert.True(
            jsonOutput.IsSome
            && output.Contains(sprintf "\"scope\": \"%s\"" scope, StringComparison.Ordinal),
            sprintf "gate list output lacks scope %s: %s" scope output
        )

    [<Given>]
    member _.``repo-config.yml declares a gate with scope "([^"]+)"``(scope: string) =
        write
            "repo-config.yml"
            (strictConfig (
                sprintf
                    "  - id: invalid-scope\n    type: check\n    command: true\n    kind: external\n    surfaces:\n      ci: { scope: %s }\n"
                    scope
            ))

    [<Given>]
    member _.``repo-config.yml declares a gate with id "([^"]+)"``(id: string) =
        write
            "repo-config.yml"
            (strictConfig (
                sprintf
                    "  - id: %s\n    type: check\n    command: true\n    kind: external\n    surfaces:\n      ci: { scope: all-file-type }\n"
                    id
            ))

    [<Given>]
    member _.``repo-config.yml declares two gates both with id "md-links"``() =
        let duplicate =
            gate "md-links" "check" "md links validate" "rhino-cli" "      ci: { scope: all-file-type }\n"

        write "repo-config.yml" (strictConfig (duplicate + duplicate))

    [<Given>]
    member _.``repo-config.yml declares a gate with type "([^"]+)"``(gateType: string) =
        write
            "repo-config.yml"
            (strictConfig (
                sprintf
                    "  - id: invalid-type\n    type: %s\n    command: true\n    kind: external\n    surfaces:\n      ci: { scope: all-file-type }\n"
                    gateType
            ))

    [<Given>]
    member _.``a gate declares type "mutation" and wiring "matrix"``() =
        write
            "repo-config.yml"
            (strictConfig (
                "  - id: invalid-wiring\n"
                + "    type: mutation\n"
                + "    command: prettier --write\n"
                + "    kind: external\n"
                + "    wiring: matrix\n"
                + "    surfaces:\n"
                + "      pre-commit: { scope: affected-file-type, glob: '*.md' }\n"
            ))

    member private this.WriteMisappliedField(field: string) =
        let gateType =
            match pendingGateType with
            | Some value -> value
            | None -> failwith "gate type precedes field declaration"

        let fieldYaml =
            match field with
            | "restages" -> "    restages: true\n"
            | "carve-out" -> "    carve-out: staged-only\n"
            | other -> failwithf "unsupported field applicability fixture %s" other

        write
            "repo-config.yml"
            (config (
                sprintf
                    "  - id: invalid-%s\n    type: %s\n    command: fixture\n    kind: external\n%s    surfaces:\n      pre-commit: { scope: other }\n"
                    field
                    gateType
                    fieldYaml
            ))

    [<Given>]
    member _.``a gate declares type "([^"]+)"``(gateType: string) = pendingGateType <- Some gateType

    [<Given>]
    member this.``it carries the field "([^"]+)"``(field: string) = this.WriteMisappliedField field

    [<Given>]
    member this.``a check gate carries the field "([^"]+)"``(field: string) =
        pendingGateType <- Some "check"
        this.WriteMisappliedField field

    [<Given>]
    member _.``a gate declares an empty "surfaces" map``() =
        write
            "repo-config.yml"
            (config "  - id: no-surfaces\n    type: check\n    command: fixture\n    kind: external\n    surfaces: {}\n")

    [<When>]
    member _.``"rhino-cli repo-config validate" runs``() =
        let exitCode, text = runCli root [ "repo-config"; "validate" ]
        succeeded <- Some(exitCode = 0)
        output <- text

    [<Then>]
    member _.``it exits non-zero``() =
        Assert.True(not (isSuccess ()), sprintf "command unexpectedly succeeded: %s" output)

    [<Then>]
    member _.``the message names the offending gate id and the allowed scope values``() =
        Assert.Contains("invalid-scope", output)
        Assert.Contains("affected-file-type", output)
        Assert.Contains("all-file-type", output)

    [<Then>]
    member _.``the message names the offending gate id and states it must be lowercase kebab-case``() =
        Assert.Contains("Invalid_ID", output)
        Assert.Contains("kebab-case", output)

    [<Then>]
    member _.``the message names the duplicated id``() = Assert.Contains("md-links", output)

    [<Then>]
    member _.``the message names the allowed type values``() =
        Assert.Contains("check", output)
        Assert.Contains("mutation", output)

    [<Then>]
    member _.``the message states that wiring applies to checks only``() =
        Assert.Contains("wiring", output)
        Assert.Contains("check", output)

    [<Then>]
    member _.``the message names the gate id and the misapplied field``() =
        let field =
            if pendingGateType = Some "check" then
                "restages"
            else
                "carve-out"

        Assert.Contains(sprintf "invalid-%s" field, output)
        Assert.Contains(field, output)

    [<Then>]
    member _.``the message names the gate id``() = Assert.Contains("no-surfaces", output)

    [<Then>]
    member _.``the message states that a gate must declare at least one surface``() =
        Assert.Contains("at least one surface", output)

module private FeatureRunner =

    let private featurePath: string =
        Path.Combine(repoRoot, "specs", "apps", "rhino", "cli", "behaviours", "gate", "gate-declaration.feature")

    let private extractScenario (featureLines: string[]) (scenarioTitle: string) : string[] =
        let featureLine =
            featureLines
            |> Array.find (fun l -> l.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let startIdx =
            featureLines
            |> Array.findIndex (fun l -> l.Trim() = sprintf "Scenario: %s" scenarioTitle)

        let endIdx =
            featureLines
            |> Array.skip (startIdx + 1)
            |> Array.tryFindIndex (fun l ->
                let trimmed = l.Trim()

                trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
                || trimmed.StartsWith("@", StringComparison.Ordinal))
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIdx .. endIdx - 1]

    let run (scenarioTitle: string) : unit =
        let allLines = File.ReadAllLines featurePath
        let snippet = extractScenario allLines scenarioTitle
        let definitions = StepDefinitions([| typeof<GateDeclarationSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)
        let scenario = Seq.exactlyOne feature.Scenarios
        scenario.Action.Invoke()

[<Fact>]
let ``A check declares a different scope per surface`` () =
    FeatureRunner.run "A check declares a different scope per surface"

[<Fact>]
let ``An unknown scope value is rejected at parse time`` () =
    FeatureRunner.run "An unknown scope value is rejected at parse time"

[<Fact>]
let ``A gate id with disallowed characters is rejected`` () =
    FeatureRunner.run "A gate id with disallowed characters is rejected"

[<Fact>]
let ``A duplicate gate id is rejected`` () =
    FeatureRunner.run "A duplicate gate id is rejected"

[<Fact>]
let ``An unknown type value is rejected at parse time`` () =
    FeatureRunner.run "An unknown type value is rejected at parse time"

[<Fact>]
let ``A mutation may not declare a wiring value`` () =
    FeatureRunner.run "A mutation may not declare a wiring value"

[<Fact>]
let ``A field applied to the wrong gate type is rejected`` () =
    FeatureRunner.run "A field applied to the wrong gate type is rejected"

[<Fact>]
let ``A mutation may not carry a check-only carve-out`` () =
    FeatureRunner.run "A mutation may not carry a check-only carve-out"

[<Fact>]
let ``A gate declaring no surfaces at all is rejected`` () =
    FeatureRunner.run "A gate declaring no surfaces at all is rejected"
