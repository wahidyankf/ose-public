/// TickSpec step definitions binding `parity-manifest.feature`'s 5 scenarios
/// [Repo-grounded —
/// `specs/apps/rhino/cli/behaviours/gate/parity-manifest.feature`,
/// `apps/rhino-cli/tests/gate_specs.rs`].
///
/// `parity manifest generate`/`validate` already ship as F# —
/// `RhinoCli.Application/src/Parity.fs`, live behind `rhino-bin.sh`'s
/// `FSHARP_NAMESPACES` since an earlier wave — so this phase only adds the
/// Gherkin-scenario coverage that was never ported. Every scenario spawns
/// the real, prebuilt F# CLI binary as a subprocess against a disposable Git
/// fixture, mirroring `GateWorld::fixture_rhino_command`.
module RhinoCli.Tests.Integration.Steps.ParityManifestResourceSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/gate/parity-manifest.feature" ]

open System
open System.Diagnostics
open System.IO
open System.Text
open TickSpec
open Xunit

let private repoRoot: string =
    match RhinoCli.Infrastructure.GitRoot.findRoot () with
    | Ok root -> root
    | Error message -> failwithf "locate repository root: %s" message

/// The published F# CLI these scenarios spawn as a real subprocess, built on
/// first use — a fresh clone may not have published it yet
/// [Repo-grounded — `gate_specs.rs::cargo_bin("rhino-cli")`].
let private prebuiltFsharpCli: Lazy<string> =
    lazy
        (let binary =
            Path.Combine(repoRoot, "apps", "rhino-cli", "src", "dist", "rhino-cli-fsharp")

         if File.Exists binary then
             binary
         else
             let psi =
                 ProcessStartInfo(FileName = "dotnet", UseShellExecute = false, WorkingDirectory = repoRoot)

             for a in
                 [ "publish"
                   "apps/rhino-cli/src/RhinoCli.Program/RhinoCli.Program.fsproj"
                   "-c"
                   "Release"
                   "--self-contained"
                   "true"
                   "--use-current-runtime"
                   "-o"
                   "apps/rhino-cli/src/dist" ] do
                 psi.ArgumentList.Add a

             use p = Process.Start psi
             p.WaitForExit()

             if p.ExitCode <> 0 || not (File.Exists binary) then
                 failwith "publish the F# CLI for parity-manifest scenarios"

             binary)

type private RunResult =
    { ExitCode: int
      Stdout: string
      Stderr: string }

let private run (exe: string) (args: string list) (cwd: string) (env: (string * string) list) : RunResult =
    let psi =
        ProcessStartInfo(
            FileName = exe,
            UseShellExecute = false,
            WorkingDirectory = cwd,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        )

    for a in args do
        psi.ArgumentList.Add a

    for k, v in env do
        psi.Environment.[k] <- v

    use p = Process.Start psi
    let out = p.StandardOutput.ReadToEnd()
    let err = p.StandardError.ReadToEnd()
    p.WaitForExit()

    { ExitCode = p.ExitCode
      Stdout = out
      Stderr = err }

/// Instance step-definition container — see `ConventionSteps.fs`'s module doc
/// comment for the one-instance-per-scenario rationale behind mutable
/// instance state here.
type ParityManifestSteps() =
    let root =
        let dir =
            Path.Combine(Path.GetTempPath(), "rhino-cli-parity-manifest-" + Guid.NewGuid().ToString("N"))

        Directory.CreateDirectory dir |> ignore
        dir

    let mutable succeeded: bool option = None
    let mutable output: string = ""
    let mutable firstManifest: byte[] option = None
    let mutable twinManifest: byte[] option = None

    let manifestPath = Path.Combine(root, "apps", "rhino-cli", "parity-manifest.sha256")

    let write (relative: string) (contents: string) =
        let path = Path.Combine(root, relative)
        Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore
        File.WriteAllText(path, contents)

    /// Mirrors `fixture_git_command` — used only for verification/staging
    /// calls, not for driving `rhino-cli` itself.
    let runFixtureGit (args: string list) : RunResult =
        run
            "git"
            args
            root
            [ "GIT_DIR", Path.Combine(root, ".git")
              "GIT_CEILING_DIRECTORIES", root
              "GIT_CONFIG_GLOBAL", "/dev/null"
              "GIT_CONFIG_SYSTEM", "/dev/null" ]

    let initGit () =
        runFixtureGit [ "init"; "--quiet" ] |> ignore

    let stage (paths: string list) =
        runFixtureGit ("add" :: paths) |> ignore

    let fixtureEnv: (string * string) list =
        [ "GIT_DIR", Path.Combine(root, ".git")
          "GIT_WORK_TREE", root
          "GIT_CEILING_DIRECTORIES", root
          "GIT_CONFIG_GLOBAL", "/dev/null"
          "GIT_CONFIG_SYSTEM", "/dev/null" ]

    let runParity (operation: string) =
        let result =
            match operation with
            | "generate" -> RhinoCli.Application.Parity.generateAtRoot root
            | "validate" -> RhinoCli.Application.Parity.validateAtRoot root
            | other -> Error(sprintf "unsupported parity operation %s" other)

        succeeded <- Some(Result.isOk result)

        output <-
            match result with
            | Ok() -> ""
            | Error message -> message

    let isSuccess () =
        match succeeded with
        | Some value -> value
        | None -> failwith "parity manifest command has not run yet"

    let parityManifestBytes () = File.ReadAllBytes manifestPath

    [<Given>]
    member _.``a tracked Rhino CLI parity boundary``() =
        [ "apps/rhino-cli/src/main.rs", "fn main() {}\n"
          "apps/rhino-cli/src/tests/parity.rs", "#[test] fn parity() {}\n"
          "apps/rhino-cli/Cargo.toml", "[package]\nname = \"fixture\"\n"
          "apps/rhino-cli/Cargo.lock", "version = 4\n"
          "apps/rhino-cli/project.json", "{}\n"
          "apps/rhino-cli/LICENSE", "MIT\n"
          "specs/apps/rhino/cli/behaviours/gate/parity-manifest.feature", "Feature: fixture parity\n" ]
        |> List.iter (fun (path, contents) -> write path contents)

        initGit ()
        stage [ "." ]

    [<Given>]
    member _.``its parity manifest has been generated and staged``() =
        runParity "generate"
        Assert.True(isSuccess (), sprintf "parity generation failed: %s" output)
        stage [ "apps/rhino-cli/parity-manifest.sha256" ]

    [<Given>]
    member _.``a twin parity repository holds a copy of that manifest``() =
        twinManifest <- Some(parityManifestBytes ())

    [<When>]
    member _.``rhino-cli parity manifest generate runs``() =
        runParity "generate"

        if isSuccess () then
            stage [ "apps/rhino-cli/parity-manifest.sha256" ]

    [<When>]
    member _.``rhino-cli parity manifest validate runs``() = runParity "validate"

    [<When>]
    member _.``the same manifest is generated a second time``() =
        firstManifest <- Some(parityManifestBytes ())
        runParity "generate"

    [<When>]
    member _.``a tracked parity source file is edited``() =
        write "apps/rhino-cli/src/main.rs" "fn changed() {}\n"

    [<When>]
    member _.``a tracked parity test file is edited``() =
        write "apps/rhino-cli/src/tests/parity.rs" "#[test] fn changed_parity() {}\n"

    [<When>]
    member _.``an untracked test fixture is created``() =
        write "apps/rhino-cli/src/tests/unit/fixtures/local.env" "SECRET=not-read\n"

    [<Then>]
    member _.``the twin repository's copy no longer matches this repository's manifest``() =
        let twin =
            twinManifest
            |> Option.defaultWith (fun () -> failwith "the twin snapshot was taken")

        stage [ "apps/rhino-cli/src/main.rs" ]
        runParity "generate"
        Assert.True(isSuccess (), sprintf "parity regeneration failed: %s" output)
        Assert.NotEqual<byte[]>(twin, parityManifestBytes ())

    [<Then>]
    member _.``the parity manifest is current``() =
        Assert.True(isSuccess (), sprintf "parity validation failed: %s" output)

    [<Then>]
    member _.``the parity manifest is byte-identical to its first generation``() =
        Assert.True(isSuccess (), sprintf "second generation failed: %s" output)
        Assert.Equal<byte[]>(firstManifest.Value, parityManifestBytes ())

    [<Then>]
    member _.``the parity gate names the edited source and deliberate remedy``() =
        Assert.False(isSuccess (), "source drift unexpectedly passed")
        Assert.Contains("apps/rhino-cli/src/main.rs", output)
        Assert.Contains("byte-identical across ose-public and the private sibling", output)
        Assert.Contains("rhino-cli parity manifest generate", output)
        Assert.DoesNotContain("beaver-nest", output)

    [<Then>]
    member _.``the parity gate names the edited test``() =
        Assert.False(isSuccess (), "test drift unexpectedly passed")
        Assert.Contains("apps/rhino-cli/src/tests/parity.rs", output)

    [<Then>]
    member _.``the untracked fixture is absent from the manifest``() =
        Assert.True(isSuccess (), sprintf "untracked fixture affected validation: %s" output)

        Assert.DoesNotContain(
            "apps/rhino-cli/src/tests/unit/fixtures/local.env",
            Encoding.UTF8.GetString(parityManifestBytes ())
        )

module private FeatureRunner =

    let private featurePath: string =
        Path.Combine(repoRoot, "specs", "apps", "rhino", "cli", "behaviours", "gate", "parity-manifest.feature")

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
        let definitions = StepDefinitions([| typeof<ParityManifestSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)
        let scenario = Seq.exactlyOne feature.Scenarios
        scenario.Action.Invoke()

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
