/// TickSpec step definitions binding `gate-execution.feature`'s 35 scenarios
/// [Repo-grounded —
/// `specs/apps/rhino/cli/behaviours/gate/gate-execution.feature`,
/// `apps/rhino-cli/tests/gate_specs.rs`].
///
/// Most scenarios spawn the real, prebuilt F# CLI binary against a
/// disposable Git fixture, mirroring `GateWorld::fixture_rhino_command` —
/// `gate run`'s `rhino-cli`-kind leaf spawns the current executable, so an
/// in-process call (unlike `GateDeclarationSteps.fs`'s convention) would
/// resolve to the test host rather than a real CLI. The five CI-infra
/// scenarios ("Gate group jobs consume a prebuilt binary" and its four
/// siblings) instead assert on the real, checked-in `.github/workflows/` and
/// `.github/actions/` YAML — their subject is that static shape, not `gate
/// run` itself, matching how `gate_specs.rs` binds them.
module RhinoCli.Tests.E2E.Steps.GateExecutionProcessSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/gate/gate-execution.feature" ]

open System
open System.Diagnostics
open System.IO
open TickSpec
open Xunit

let private repoRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

/// Mirrors `gate_specs.rs::config`.
let private config (gates: string) : string = "gates:\n" + gates

/// Mirrors `gate_specs.rs::gate`.
let private gate (id: string) (gateType: string) (command: string) (kind: string) (surfaces: string) : string =
    sprintf
        "  - id: %s\n    type: %s\n    command: %s\n    kind: %s\n    surfaces:\n%s"
        id
        gateType
        command
        kind
        surfaces

let private makeExecutable (path: string) : unit =
    File.SetUnixFileMode(
        path,
        UnixFileMode.UserRead
        ||| UnixFileMode.UserWrite
        ||| UnixFileMode.UserExecute
        ||| UnixFileMode.GroupRead
        ||| UnixFileMode.GroupExecute
        ||| UnixFileMode.OtherRead
        ||| UnixFileMode.OtherExecute
    )

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
                 failwith "publish the F# CLI for gate-execution scenarios"

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
/// comment for why TickSpec's one-instance-per-scenario lifecycle makes
/// instance-level mutable fields the idiomatic state-threading mechanism.
type GateExecutionSteps() =
    let root =
        let dir =
            Path.Combine(Path.GetTempPath(), "rhino-cli-gate-execution-" + Guid.NewGuid().ToString("N"))

        Directory.CreateDirectory dir |> ignore
        dir

    let mutable succeeded: bool option = None
    let mutable lastExitCode: int option = None
    let mutable output: string = ""
    let mutable pathOverride: string option = None
    let mutable ciChangedBase: string option = None
    let mutable ciArguments: string option = None
    let mutable pendingCiGroup: string option = None
    let mutable unnamedNpmCiUnguarded: bool option = None
    let mutable compositeActionUnderInspection: string option = None

    let write (relative: string) (contents: string) =
        let path = Path.Combine(root, relative)
        Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore
        File.WriteAllText(path, contents)

    /// Mirrors `fixture_git_command` — used only for verification calls, not
    /// for driving `rhino-cli` itself.
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

    let commit (message: string) =
        let psi =
            ProcessStartInfo(
                FileName = "git",
                UseShellExecute = false,
                WorkingDirectory = root,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            )

        for a in [ "commit"; "--quiet"; "-m"; message ] do
            psi.ArgumentList.Add a

        for k, v in
            [ "GIT_DIR", Path.Combine(root, ".git")
              "GIT_CEILING_DIRECTORIES", root
              "GIT_CONFIG_GLOBAL", "/dev/null"
              "GIT_CONFIG_SYSTEM", "/dev/null"
              "GIT_AUTHOR_NAME", "gate-spec-fixture"
              "GIT_AUTHOR_EMAIL", "gate-spec-fixture@example.invalid"
              "GIT_COMMITTER_NAME", "gate-spec-fixture"
              "GIT_COMMITTER_EMAIL", "gate-spec-fixture@example.invalid" ] do
            psi.Environment.[k] <- v

        use p = Process.Start psi
        p.StandardOutput.ReadToEnd() |> ignore
        p.StandardError.ReadToEnd() |> ignore
        p.WaitForExit()
        Assert.Equal(0, p.ExitCode)

    let prependBinToPath (relative: string) =
        let bin = Path.Combine(root, relative)
        let existing = Environment.GetEnvironmentVariable "PATH"
        pathOverride <- Some(sprintf "%s%c%s" bin Path.PathSeparator existing)

    let fixtureEnv (extra: (string * string) list) : (string * string) list =
        [ "GIT_DIR", Path.Combine(root, ".git")
          "GIT_WORK_TREE", root
          "GIT_CEILING_DIRECTORIES", root
          "GIT_CONFIG_GLOBAL", "/dev/null"
          "GIT_CONFIG_SYSTEM", "/dev/null" ]
        @ (pathOverride |> Option.map (fun p -> [ "PATH", p ]) |> Option.defaultValue [])
        @ extra

    let recordRun (result: RunResult) =
        lastExitCode <- Some result.ExitCode
        succeeded <- Some(result.ExitCode = 0)
        output <- result.Stdout + result.Stderr

    let runGate (surface: string) (only: string option) =
        let args =
            [ "gate"; "run"; sprintf "--surface=%s" surface ]
            @ (only
               |> Option.map (fun id -> [ sprintf "--only=%s" id ])
               |> Option.defaultValue [])

        recordRun (run prebuiltFsharpCli.Value args root (fixtureEnv []))

    let runGateGroup (surface: string) (group: string) =
        let args =
            [ "gate"; "run"; sprintf "--surface=%s" surface; sprintf "--group=%s" group ]

        recordRun (run prebuiltFsharpCli.Value args root (fixtureEnv []))

    let runGateWithEnvironment (surface: string) (only: string option) (extra: (string * string) list) =
        let args =
            [ "gate"; "run"; sprintf "--surface=%s" surface ]
            @ (only
               |> Option.map (fun id -> [ sprintf "--only=%s" id ])
               |> Option.defaultValue [])

        recordRun (run prebuiltFsharpCli.Value args root (fixtureEnv extra))

    let appendRun (surface: string) (only: string) =
        runGate surface (Some only)
        output <- output + "\n"

    let runCiChangedBaseGateFor (only: string) =
        let baseRev = ciChangedBase.Value
        let arguments = ciArguments.Value

        let args = [ "gate"; "run"; "--surface=ci"; sprintf "--only=%s" only ]

        recordRun (
            run
                prebuiltFsharpCli.Value
                args
                root
                (fixtureEnv [ "GATE_CHANGED_BASE", baseRev; "GATE_CI_ARGUMENTS", arguments ])
        )

    let isSuccess () =
        match succeeded with
        | Some v -> v
        | None -> failwith "scenario command ran"

    let formatterWrapperPath (name: string) : string = Path.Combine(repoRoot, "scripts", name)

    let formatterVerifierConfig (id: string) (command: string) (glob: string) : string =
        sprintf
            "  - id: %s\n    type: check\n    command: %s\n    kind: external\n    surfaces:\n      ci: { scope: all-file-type, glob: '%s' }\n"
            id
            command
            glob

    let writeUnformattedElixirFixture () =
        initGit ()

        write
            "mix.exs"
            "defmodule WrapperFixture.MixProject do\n  use Mix.Project\n\n  def project, do: [app: :wrapper_fixture, version: \"0.1.0\", elixir: \"~> 1.18\"]\nend\n"

        write "unformatted.ex" "defmodule Fixture do\ndef hello,do: :world\nend\n"

        write
            "repo-config.yml"
            (config (
                formatterVerifierConfig
                    "format-verify-elixir"
                    (sprintf "%s --check" (formatterWrapperPath "format-elixir.sh"))
                    "*.ex"
            ))

        stage [ "mix.exs"; "unformatted.ex"; "repo-config.yml" ]

    let jobBlock (workflow: string) (jobName: string) : string =
        let header = sprintf "  %s:" jobName
        let lines = workflow.Split '\n'

        let startIdx = lines |> Array.tryFindIndex (fun l -> l.TrimEnd() = header)

        match startIdx with
        | None -> ""
        | Some start ->
            let rest = lines.[start + 1 ..]

            let endIdx =
                rest
                |> Array.tryFindIndex (fun l ->
                    l.StartsWith("  ") && not (l.StartsWith "   ") && l.TrimEnd().EndsWith ":")
                |> Option.defaultValue rest.Length

            rest.[.. endIdx - 1] |> String.concat "\n"

    let prQualityGateWorkflow () : string =
        File.ReadAllText(Path.Combine(repoRoot, ".github", "workflows", "pr-quality-gate.yml"))

    let mutable buildRhinoPublishesArtifact: bool option = None
    let mutable workflowYaml: string option = None
    let mutable gateJobBlock: string option = None
    let mutable gateJobNeedsBuildRhino: bool option = None
    let mutable noNpmGroupId: string option = None

    let actionSteps (actionYaml: string) : string list =
        let lines = actionYaml.Split '\n'
        let stepsHeader = lines |> Array.findIndex (fun l -> l.Trim() = "steps:")

        let stepsIndent =
            lines.[stepsHeader].Length - lines.[stepsHeader].TrimStart().Length

        let itemIndent =
            lines.[stepsHeader + 1 ..]
            |> Array.pick (fun l ->
                let indent = l.Length - l.TrimStart().Length

                if indent > stepsIndent && l.TrimStart().StartsWith "- " then
                    Some indent
                else
                    None)

        let isItemHeader (l: string) =
            let indent = l.Length - l.TrimStart().Length
            indent = itemIndent && l.TrimStart().StartsWith "- "

        let body = lines.[stepsHeader + 1 ..]

        body
        |> Array.mapi (fun i l -> i, l)
        |> Array.filter (fun (_, l) -> isItemHeader l)
        |> Array.map (fun (start, _) ->
            let endOffset =
                body.[start + 1 ..]
                |> Array.tryFindIndex (fun l -> isItemHeader l)
                |> Option.defaultValue (body.Length - start - 1)

            body.[start .. start + endOffset] |> String.concat "\n")
        |> Array.toList

    let runBlockFromStep (step: string) : string option =
        let lines = step.Split '\n'

        let found =
            lines
            |> Array.mapi (fun i l -> i, l)
            |> Array.tryPick (fun (i, l) ->
                let trimmed = l.TrimStart()

                if trimmed.StartsWith "run: " then
                    Some(i, trimmed.Substring "run: ".Length)
                elif trimmed.StartsWith "- run: " then
                    Some(i, trimmed.Substring "- run: ".Length)
                else
                    None)

        match found with
        | None -> None
        | Some(_, scalarCommand) when scalarCommand <> "|" -> Some scalarCommand
        | Some(runIdx, _) -> Some(lines.[runIdx + 1 ..] |> String.concat "\n")

    let hasNpmCiCommand (run: string) : bool =
        run.Split '\n'
        |> Array.map (fun l -> l.TrimStart())
        |> Array.filter (fun l -> not (l.StartsWith "#"))
        |> Array.exists (fun l -> l = "npm ci" || l.StartsWith "npm ci ")

    let stepBlock (actionYaml: string) (stepNameFragment: string) : string =
        actionSteps actionYaml
        |> List.find (fun step ->
            step.Split '\n'
            |> Array.exists (fun l ->
                let trimmed = l.TrimStart()

                (trimmed.StartsWith "name:" || trimmed.StartsWith "- name:")
                && l.Contains stepNameFragment))

    let recordingGateConfig (guard: string) : string =
        guard
        + config (gate "recording" "check" "sh record-leaf.sh" "external" "      pre-push: { scope: other }\n")

    let prepareRecordingGate (guard: string) =
        initGit ()
        write "record-leaf.sh" "#!/bin/sh\nprintf 'leaf-ran\\n' > leaf.txt\n"
        write "repo-config.yml" (recordingGateConfig guard)

    // --- Optional whole-surface execution guard ---------------------------

    [<Given>]
    member _.``pre-push has a configured execution guard and a recording gate``() =
        prepareRecordingGate (
            String.concat
                "\n"
                [ "gate-surface-guards:"
                  "  pre-push:"
                  "    command: sh"
                  "    args: [guard.sh]"
                  "    active-env: RHINO_TEST_GUARD_ACTIVE"
                  "" ]
        )

        write
            "guard.sh"
            "#!/bin/sh\nprintf '%s\\n' \"$@\" > guard-arguments.txt\ncount=0\nif [ -f guard-count.txt ]; then count=$(cat guard-count.txt); fi\ncount=$((count + 1))\nprintf '%s\\n' \"$count\" > guard-count.txt\nexport RHINO_TEST_GUARD_ACTIVE=1\nexec \"$@\"\n"

    [<When>]
    member _.``the guarded gate runs with an only selector``() = runGate "pre-push" (Some "recording")

    [<Then>]
    member _.``the guard receives the complete gate run arguments``() =
        Assert.True(isSuccess (), sprintf "guarded gate failed: %s" output)

        let arguments =
            File.ReadAllLines(Path.Combine(root, "guard-arguments.txt")) |> Array.toList

        Assert.True(arguments.Head.EndsWith("rhino-cli-fsharp", StringComparison.Ordinal))
        Assert.Equal<string list>([ "gate"; "run"; "--surface=pre-push"; "--only=recording" ], arguments.Tail)

    [<Then>]
    member _.``the guard runs exactly once``() =
        Assert.Equal("1\n", File.ReadAllText(Path.Combine(root, "guard-count.txt")))

    [<Then>]
    member _.``the selected gate still runs``() =
        Assert.Equal("leaf-ran\n", File.ReadAllText(Path.Combine(root, "leaf.txt")))

    [<When>]
    member _.``the gate runs with the configured guard marker active``() =
        runGateWithEnvironment "pre-push" (Some "recording") [ "RHINO_TEST_GUARD_ACTIVE", "already-active" ]

    [<Then>]
    member _.``the guard is bypassed``() =
        Assert.True(isSuccess (), sprintf "active-marker gate failed: %s" output)
        Assert.False(File.Exists(Path.Combine(root, "guard-arguments.txt")))
        Assert.False(File.Exists(Path.Combine(root, "guard-count.txt")))

    [<Given>]
    member _.``pre-push has a configured execution guard that exits with code 23``() =
        initGit ()
        write "exit-23.sh" "#!/bin/sh\nexit 23\n"

        write
            "repo-config.yml"
            (String.concat
                "\n"
                [ "gate-surface-guards:"
                  "  pre-push:"
                  "    command: sh"
                  "    args: [exit-23.sh]"
                  "    active-env: RHINO_TEST_GUARD_ACTIVE"
                  "gates: []"
                  "" ])

    [<Given>]
    member _.``pre-push has a missing configured execution guard and a recording gate``() =
        prepareRecordingGate (
            String.concat
                "\n"
                [ "gate-surface-guards:"
                  "  pre-push:"
                  "    command: ./missing-guard"
                  "    active-env: RHINO_TEST_GUARD_ACTIVE"
                  "" ]
        )

    [<Given>]
    member _.``pre-push has no execution guard and has a recording gate``() = prepareRecordingGate ""

    [<When>]
    member _.``the guarded pre-push surface runs``() =
        runGate
            "pre-push"
            (if File.Exists(Path.Combine(root, "record-leaf.sh")) then
                 Some "recording"
             else
                 None)

    [<Then>]
    member _.``gate run exits with code 23``() =
        Assert.Equal<int option>(Some 23, lastExitCode)

    [<Then>]
    member _.``gate run fails without running the selected gate``() =
        Assert.False(isSuccess ())
        Assert.Contains("surface guard", output)
        Assert.False(File.Exists(Path.Combine(root, "leaf.txt")))

    [<Then>]
    member _.``the selected gate runs without a guard invocation``() =
        Assert.True(isSuccess (), sprintf "unguarded gate failed: %s" output)
        Assert.Equal("leaf-ran\n", File.ReadAllText(Path.Combine(root, "leaf.txt")))
        Assert.False(File.Exists(Path.Combine(root, "guard-arguments.txt")))

    // --- Rhino CLI kind receives derived files -----------------------------

    [<Given>]
    member _.``a rhino-cli gate matches staged files "a.md" and "b.md"``() =
        initGit ()
        write "a.md" "# A\n"
        write "b.md" "# B\n"

        write
            "repo-config.yml"
            (config (
                gate
                    "md-naming"
                    "check"
                    "md naming validate"
                    "rhino-cli"
                    "      pre-commit: { scope: affected-file-type, glob: '*.md' }\n"
            ))

        stage [ "a.md"; "b.md" ]

    [<When>]
    member _.``"rhino-cli gate run --surface=pre-commit --only=md-naming" runs``() =
        runGate "pre-commit" (Some "md-naming")

    [<Then>]
    member _.``the local rhino-cli leaf receives only "a.md" and "b.md"``() =
        Assert.True(isSuccess (), sprintf "rhino-cli leaf failed: %s" output)

    // --- External kind preserves fixed argv before files / Nx delegation ---

    [<Given>]
    member _.``an external gate declares fixed arguments and matches a shell file``() =
        initGit ()
        write "tool.sh" "#!/bin/sh\nexit 0\n"
        write "capture.sh" "#!/bin/sh\nprintf '%s\\n' \"$@\" > arguments.txt\n"

        write
            "repo-config.yml"
            (config (
                gate
                    "shellcheck"
                    "check"
                    "sh capture.sh --severity=warning"
                    "external"
                    "      pre-commit: { scope: affected-file-type, glob: '*.sh' }\n"
            ))

        stage [ "tool.sh" ]

    [<Given>]
    member _.``an nx gate declares scope "affected-projects" and fixed parallel argument "([^"]*)"``(value: string) =
        initGit ()
        write "bin/npm" "#!/bin/sh\nprintf '%s\\n' \"$@\" > npm-arguments.txt\n"
        makeExecutable (Path.Combine(root, "bin/npm"))
        prependBinToPath "bin"

        write
            "repo-config.yml"
            (config (
                gate "test-quick" "check" "test:quick" "nx" "      pre-push: { scope: affected-projects }\n"
                + sprintf "    args: { parallel: [\"%s\"] }\n" value
            ))

    [<When>]
    member _.``the selected gate runs``() =
        if File.Exists(Path.Combine(root, "bin/npm")) then
            runGate "pre-push" (Some "test-quick")
        else
            runGate "pre-commit" (Some "shellcheck")

    [<Then>]
    member _.``its fixed arguments precede its derived files``() =
        Assert.True(isSuccess (), sprintf "external gate failed: %s" output)
        Assert.Equal("--severity=warning\ntool.sh\n", File.ReadAllText(Path.Combine(root, "arguments.txt")))

    [<Then>]
    member _.``npm invokes the affected project graph target with parallel argument "([^"]*)"``(value: string) =
        Assert.True(isSuccess (), sprintf "nx gate failed: %s" output)

        Assert.Equal(
            sprintf "exec\nnx\n--\naffected\n-t\ntest:quick\n--parallel\n%s\n" value,
            File.ReadAllText(Path.Combine(root, "npm-arguments.txt"))
        )

    // --- CI affected-file-type gates use the supplied event base -----------

    [<Given>]
    member _.``a CI event supplies its preceding commit as the changed base``() =
        Directory.CreateDirectory(Path.Combine(root, "bin")) |> ignore
        let arguments = Path.Combine(root, "captured-ci-arguments.txt")
        write "changed.md" "# Before\n"

        write
            "repo-config.yml"
            (config (
                gate
                    "ci-markdown"
                    "check"
                    "capture"
                    "external"
                    "      ci: { scope: affected-file-type, glob: '*.md' }\n"
            ))

        write "bin/capture" "#!/bin/sh\nprintf '%s\\n' \"$@\" > \"$GATE_CI_ARGUMENTS\"\n"
        makeExecutable (Path.Combine(root, "bin/capture"))
        initGit ()
        stage [ "repo-config.yml"; "changed.md" ]
        commit "test: baseline"
        let baseResult = runFixtureGit [ "rev-parse"; "HEAD" ]
        Assert.Equal(0, baseResult.ExitCode)
        ciChangedBase <- Some(baseResult.Stdout.Trim())
        write "changed.md" "# After\n"
        stage [ "changed.md" ]
        commit "test: changed file"
        prependBinToPath "bin"
        ciArguments <- Some arguments

    [<When>]
    member _.``an affected-file-type CI gate runs after main advances``() = runCiChangedBaseGateFor "ci-markdown"

    [<Then>]
    member _.``the gate receives the files changed from the supplied base``() =
        Assert.True(isSuccess (), sprintf "CI gate failed: %s" output)

        Assert.Equal(
            "changed.md\n",
            (if File.Exists ciArguments.Value then
                 File.ReadAllText ciArguments.Value
             else
                 "")
        )

    // --- Deleted paths excluded from affected-file-type candidates ---------

    [<Given>]
    member _.``a changed-path set contains a deleted file alongside a modified file``() =
        Directory.CreateDirectory(Path.Combine(root, "bin")) |> ignore
        let arguments = Path.Combine(root, "captured-affected-arguments.txt")
        write "kept.rs" "fn kept() {}\n"
        write "deleted.rs" "fn deleted() {}\n"

        write
            "repo-config.yml"
            (config (
                gate
                    "capture-affected-rs"
                    "check"
                    "capture"
                    "external"
                    "      ci: { scope: affected-file-type, glob: '*.rs' }\n"
            ))

        write "bin/capture" "#!/bin/sh\nprintf '%s\\n' \"$@\" > \"$GATE_CI_ARGUMENTS\"\n"
        makeExecutable (Path.Combine(root, "bin/capture"))
        initGit ()
        stage [ "repo-config.yml"; "kept.rs"; "deleted.rs" ]
        commit "test: baseline"
        let baseResult = runFixtureGit [ "rev-parse"; "HEAD" ]
        Assert.Equal(0, baseResult.ExitCode)
        ciChangedBase <- Some(baseResult.Stdout.Trim())
        write "kept.rs" "fn kept() { /* changed */ }\n"
        File.Delete(Path.Combine(root, "deleted.rs"))
        stage [ "kept.rs"; "deleted.rs" ]
        commit "test: delete one .rs file, modify another"
        prependBinToPath "bin"
        ciArguments <- Some arguments

    [<When>]
    member _.``an affected-file-type gate resolves its candidate files``() =
        runCiChangedBaseGateFor "capture-affected-rs"

    [<Then>]
    member _.``the deleted file is excluded because it no longer exists on disk``() =
        Assert.True(isSuccess (), sprintf "affected-file-type gate failed: %s" output)

        let argv =
            if File.Exists ciArguments.Value then
                File.ReadAllText ciArguments.Value
            else
                ""

        Assert.DoesNotContain("deleted.rs", argv)

    [<Then>]
    member _.``the modified file is still passed to the gate command``() =
        let argv =
            if File.Exists ciArguments.Value then
                File.ReadAllText ciArguments.Value
            else
                ""

        Assert.Contains("kept.rs", argv)

    // --- Path-gated gates still fire when a trigger path is only deleted ---

    [<Given>]
    member _.``a path-gated gate's trigger directory contains only a deleted file``() =
        write ".claude/agents/example.md" "an agent\n"

        write
            "repo-config.yml"
            (config (
                gate
                    "path-gated-check"
                    "check"
                    "touch was-run.txt"
                    "external"
                    "      pre-push:\n        scope: path-gated\n        trigger:\n          - .claude/\n"
            ))

        initGit ()
        stage [ "repo-config.yml"; ".claude/agents/example.md" ]
        commit "test: baseline"
        runFixtureGit [ "branch"; "origin/main" ] |> ignore
        File.Delete(Path.Combine(root, ".claude/agents/example.md"))
        stage [ ".claude/agents/example.md" ]
        commit "test: delete the triggering agent file"

    [<When>]
    member _.``the path-gated gate evaluates its trigger``() =
        runGate "pre-push" (Some "path-gated-check")

    [<Then>]
    member _.``the gate still runs because trigger matching is unaffected by on-disk existence``() =
        Assert.True(isSuccess (), sprintf "path-gated gate failed: %s" output)
        Assert.True(File.Exists(Path.Combine(root, "was-run.txt")))

    // --- External kind resolves a repository-local binary -------------------

    [<Given>]
    member _.``an external gate command exists only in the repository node_modules bin directory``() =
        initGit ()

        let executable =
            Path.Combine(root, "node_modules/.bin/repository-local-external-gate")

        write
            "node_modules/.bin/repository-local-external-gate"
            "#!/bin/sh\nprintf 'repository local gate\\n' > repository-local-gate.txt\n"

        makeExecutable executable

        write
            "repo-config.yml"
            (config (
                gate
                    "repository-local-external-gate"
                    "check"
                    "repository-local-external-gate"
                    "external"
                    "      pre-commit: { scope: other }\n"
            ))

    [<When>]
    member _.``its repository-local external gate runs``() =
        runGate "pre-commit" (Some "repository-local-external-gate")

    [<Then>]
    member _.``the repository-local external gate succeeds``() =
        Assert.True(isSuccess (), sprintf "repository-local external gate failed: %s" output)
        Assert.Equal("repository local gate\n", File.ReadAllText(Path.Combine(root, "repository-local-gate.txt")))

    // --- All supported scopes derive their specified inputs -----------------

    [<Given>]
    member _.``one registry fixture covers every declared scope``() =
        initGit ()

        write
            "record.sh"
            "#!/bin/sh\nlabel=$1\nshift\nprintf '%s:' \"$label\" >> calls.txt\nprintf '%s,' \"$@\" >> calls.txt\nprintf '\\n' >> calls.txt\n"

        write "bin/npm" "#!/bin/sh\nprintf 'npm:%s\\n' \"$*\" >> calls.txt\n"
        makeExecutable (Path.Combine(root, "bin/npm"))
        prependBinToPath "bin"
        write "note.md" "# Note\n"
        write "lib.rs" "fn main() {}\n"
        write "docs/note.md" "# Docs\n"

        write
            "repo-config.yml"
            (config (
                "  - id: affected\n    type: check\n    command: sh record.sh affected\n    kind: external\n    surfaces:\n      pre-commit: { scope: affected-file-type, glob: '*.md' }\n"
                + "  - id: all-files\n    type: check\n    command: sh record.sh all-files\n    kind: external\n    surfaces:\n      pre-commit: { scope: all-file-type, glob: '*.rs' }\n"
                + "  - id: path\n    type: check\n    command: sh record.sh path\n    kind: external\n    surfaces:\n      pre-commit: { scope: path-gated, trigger: ['docs/'] }\n"
                + "  - id: affected-projects\n    type: check\n    command: affected-target\n    kind: nx\n    surfaces:\n      pre-push: { scope: affected-projects }\n"
                + "  - id: all-projects\n    type: check\n    command: all-target\n    kind: nx\n    surfaces:\n      pre-push: { scope: all-projects }\n"
                + "  - id: other\n    type: check\n    command: sh record.sh other\n    kind: external\n    surfaces:\n      pre-push: { scope: other }\n"
            ))

        stage [ "note.md"; "lib.rs"; "docs/note.md" ]

    [<When>]
    member _.``each selected gate runs``() =
        for surface, id in
            [ "pre-commit", "affected"
              "pre-commit", "all-files"
              "pre-commit", "path"
              "pre-push", "affected-projects"
              "pre-push", "all-projects"
              "pre-push", "other" ] do
            appendRun surface id
            Assert.True(isSuccess (), sprintf "%s failed: %s" id output)

    [<Then>]
    member _.``each leaf receives its declared input contract``() =
        let calls = File.ReadAllText(Path.Combine(root, "calls.txt"))

        for expected in
            [ "affected:docs/note.md,note.md,"
              "all-files:lib.rs,"
              "path:"
              "npm:exec nx -- affected -t affected-target"
              "npm:exec nx -- run-many --all -t all-target"
              "other:" ] do
            Assert.Contains(expected, calls)

    // --- Glob lists and excludes are applied before invocation --------------

    [<Given>]
    member _.``a file gate declares globs and excluded paths``() =
        initGit ()
        write "capture.sh" "#!/bin/sh\nprintf '%s\\n' \"$@\" > arguments.txt\n"
        write "keep.md" "# Keep\n"
        write "also.txt" "Keep\n"
        write "docs/skip.md" "# Skip\n"

        write
            "repo-config.yml"
            (config
                "  - id: files\n    type: check\n    command: sh capture.sh\n    kind: external\n    args:\n      exclude:\n        - docs\n    surfaces:\n      pre-commit:\n        scope: affected-file-type\n        globs:\n          - '*.md'\n          - '*.txt'\n")

        stage [ "keep.md"; "also.txt"; "docs/skip.md" ]

    [<When>]
    member _.``its candidate set contains matching and excluded paths``() = runGate "pre-commit" (Some "files")

    [<Then>]
    member _.``the leaf receives only matching non-excluded repository-relative paths``() =
        Assert.True(isSuccess (), sprintf "glob gate failed: %s" output)
        let arguments = File.ReadAllText(Path.Combine(root, "arguments.txt"))
        Assert.Contains("keep.md", arguments)
        Assert.Contains("also.txt", arguments)
        Assert.DoesNotContain("docs/skip.md", arguments)

    // --- A registered Rhino CLI gate forwards and enforces exclusions -------

    [<Given>]
    member _.``the frontmatter-date gate declares an excluded violating website path``() =
        initGit ()

        write
            "repo-config.yml"
            (config
                "  - id: md-frontmatter-dates\n    type: check\n    command: md frontmatter-dates validate\n    kind: rhino-cli\n    args:\n      exclude:\n        - apps/website\n    surfaces:\n      ci: { scope: all-file-type }\n")

        write "repo-governance/clean.md" "# Clean\n"
        write "repo-governance/apps/website/dated.md" "---\ntitle: Excluded\nupdated: 2026-08-05\n---\n"

        stage
            [ "repo-config.yml"
              "repo-governance/clean.md"
              "repo-governance/apps/website/dated.md" ]

    [<When>]
    member _.``its CI gate runs by id``() =
        runGate "ci" (Some "md-frontmatter-dates")

    [<Then>]
    member _.``the frontmatter-date gate suppresses the excluded finding``() =
        Assert.True(
            isSuccess (),
            sprintf "frontmatter-date gate must pass --exclude to its leaf and suppress the excluded finding: %s" output
        )

        Assert.DoesNotContain("dated.md", output)

    // --- An empty scoped match is a successful skip --------------------------

    [<Given>]
    member _.``a file-scoped gate has no eligible paths``() =
        initGit ()
        write "capture.sh" "#!/bin/sh\ntouch invoked.txt\n"
        write "note.rs" "fn main() {}\n"

        write
            "repo-config.yml"
            (config (
                gate
                    "markdown"
                    "check"
                    "sh capture.sh"
                    "external"
                    "      pre-commit: { scope: affected-file-type, glob: '*.md' }\n"
            ))

        stage [ "note.rs" ]

    [<When>]
    member _.``that gate runs``() = runGate "pre-commit" (Some "markdown")

    [<Then>]
    member _.``it succeeds without invoking its leaf and reports the skip``() =
        Assert.True(isSuccess (), sprintf "empty scope failed: %s" output)
        Assert.Contains("Skipping gate markdown", output)
        Assert.False(File.Exists(Path.Combine(root, "invoked.txt")))

    // --- Only executes exactly one direct leaf -------------------------------

    [<Given>]
    member _.``pre-commit declares batch entries and a direct mutation``() =
        initGit ()
        write "bin/npx" "#!/bin/sh\nprintf 'batch\\n' >> calls.txt\n"
        makeExecutable (Path.Combine(root, "bin/npx"))
        prependBinToPath "bin"
        write "direct.sh" "#!/bin/sh\nprintf 'direct\\n' >> calls.txt\n"
        write "note.md" "# Note\n"

        write
            "repo-config.yml"
            (config (
                "  - id: batch-check\n    type: check\n    command: true\n    kind: external\n    surfaces:\n      pre-commit: { scope: affected-file-type, glob: '*.md' }\n"
                + "  - id: direct\n    type: mutation\n    command: sh direct.sh\n    kind: external\n    surfaces:\n      pre-commit: { scope: other }\n"
            ))

        stage [ "note.md" ]

    [<When>]
    member _.``a valid --only selector runs``() = runGate "pre-commit" (Some "direct")

    [<Then>]
    member _.``only the selected leaf runs directly``() =
        Assert.True(isSuccess (), sprintf "selected leaf failed: %s" output)
        Assert.Equal("direct\n", File.ReadAllText(Path.Combine(root, "calls.txt")))

    // --- Unknown or duplicate only ids fail before execution -----------------

    [<Given>]
    member _.``an --only selector is absent or duplicated``() =
        initGit ()

        write
            "repo-config.yml"
            (config (
                "  - id: duplicate\n    type: check\n    command: true\n    kind: external\n    surfaces:\n      pre-push: { scope: other }\n"
                + "  - id: duplicate\n    type: check\n    command: true\n    kind: external\n    surfaces:\n      pre-push: { scope: other }\n"
            ))

    [<When>]
    member _.``gate run executes``() =
        if File.Exists(Path.Combine(root, "bin/npx")) then
            runGate "pre-commit" None
        else
            runGate "pre-push" (Some "missing")
            let missingOutput = output
            let missingFailed = not (isSuccess ())
            runGate "pre-push" (Some "duplicate")
            let duplicateFailed = not (isSuccess ())
            output <- missingOutput + "\n" + output
            succeeded <- Some(not missingFailed || not duplicateFailed)

    [<Then>]
    member _.``it fails before any leaf invocation``() =
        Assert.False(isSuccess ())
        Assert.Contains("must select exactly one gate", output)

    // --- An unknown group id fails before execution --------------------------

    [<Given>]
    member _.``a --group selector names a CI group id absent from the registry``() =
        initGit ()

        write
            "repo-config.yml"
            (config
                "  - id: group-member\n    type: check\n    command: touch must-not-run.txt\n    kind: external\n    ci-group: real-group\n    surfaces:\n      ci: { scope: other }\n")

        pendingCiGroup <- Some "unregistered-group"

    [<When>]
    member _.``"rhino-cli gate run --surface=ci --group=<id>" runs``() = runGateGroup "ci" pendingCiGroup.Value

    [<Then>]
    member _.``it fails before any leaf invocation and names the unknown group id``() =
        Assert.False(isSuccess ())
        Assert.Contains("unregistered-group", output)
        Assert.False(File.Exists(Path.Combine(root, "must-not-run.txt")))

    // --- Restaging mutations --------------------------------------------------

    [<Given>]
    member _.``a successful restaging mutation changes generated output``() =
        initGit ()
        write "mutate.sh" "#!/bin/sh\nprintf generated > generated.txt\n"

        write
            "repo-config.yml"
            (config (
                gate "generate" "mutation" "sh mutate.sh" "external" "      pre-push: { scope: other }\n"
                + "    restages: true\n"
            ))

    [<When>]
    member _.``it runs with unrelated worktree edits``() =
        write "unrelated.txt" "unrelated\n"
        runGate "pre-push" (Some "generate")

    [<Then>]
    member _.``only the mutation output is staged``() =
        Assert.True(isSuccess (), sprintf "restaging failed: %s" output)
        let staged = runFixtureGit [ "diff"; "--cached"; "--name-only" ]
        Assert.Equal("generated.txt\n", staged.Stdout)

    [<Given>]
    member _.``a restaging mutation changes output then fails``() =
        initGit ()
        write "mutate.sh" "#!/bin/sh\nprintf generated > generated.txt\nexit 1\n"

        write
            "repo-config.yml"
            (config (
                gate "generate" "mutation" "sh mutate.sh" "external" "      pre-push: { scope: other }\n"
                + "    restages: true\n"
            ))

    [<When>]
    member _.``it runs``() = runGate "pre-push" (Some "generate")

    [<Then>]
    member _.``it returns non-zero without staging that output``() =
        Assert.False(isSuccess ())
        let staged = runFixtureGit [ "diff"; "--cached"; "--name-only" ]
        Assert.Equal("", staged.Stdout)

    [<Given>]
    member _.``two successful restaging mutations each change a distinct output file``() =
        initGit ()
        write "mutate-first.sh" "#!/bin/sh\nprintf first > first.txt\n"
        write "mutate-second.sh" "#!/bin/sh\nprintf second > second.txt\n"

        write
            "repo-config.yml"
            (config (
                gate "generate-first" "mutation" "sh mutate-first.sh" "external" "      pre-push: { scope: other }\n"
                + "    restages: true\n"
                + gate
                    "generate-second"
                    "mutation"
                    "sh mutate-second.sh"
                    "external"
                    "      pre-push: { scope: other }\n"
                + "    restages: true\n"
            ))

    [<When>]
    member _.``they run back to back``() =
        write "unrelated.txt" "unrelated\n"
        runGate "pre-push" None

    [<Then>]
    member _.``each mutation's own output is staged and neither is attributed to the other``() =
        Assert.True(isSuccess (), sprintf "restaging failed: %s" output)
        let staged = runFixtureGit [ "diff"; "--cached"; "--name-only" ]

        let lines =
            staged.Stdout.Split('\n')
            |> Array.filter (fun l -> l <> "")
            |> Array.sort
            |> Array.toList

        Assert.Equal<string list>([ "first.txt"; "second.txt" ], lines)
        Assert.True(File.Exists(Path.Combine(root, "unrelated.txt")))

    [<Given>]
    member _.``two successful restaging mutations, the second of which also re-touches the first mutation's output file``
        ()
        =
        initGit ()
        write "mutate-first.sh" "#!/bin/sh\nprintf first > first.txt\n"
        write "mutate-second.sh" "#!/bin/sh\nprintf overwritten > first.txt\nprintf second > second.txt\n"

        write
            "repo-config.yml"
            (config (
                gate "generate-first" "mutation" "sh mutate-first.sh" "external" "      pre-push: { scope: other }\n"
                + "    restages: true\n"
                + gate
                    "generate-second"
                    "mutation"
                    "sh mutate-second.sh"
                    "external"
                    "      pre-push: { scope: other }\n"
                + "    restages: true\n"
            ))

    [<Then>]
    member _.``the second mutation's re-touch of that shared file is staged, not silently dropped by the threaded snapshot``
        ()
        =
        Assert.True(isSuccess (), sprintf "restaging failed: %s" output)
        let stagedFirst = runFixtureGit [ "show"; ":first.txt" ]
        let stagedSecond = runFixtureGit [ "show"; ":second.txt" ]
        let worktreeDiff = runFixtureGit [ "diff"; "--name-only" ]
        Assert.Equal("overwritten", stagedFirst.Stdout)
        Assert.Equal("second", stagedSecond.Stdout)
        Assert.Equal("", worktreeDiff.Stdout)

    // --- Pre-commit batching ---------------------------------------------------

    [<Given>]
    member this.``pre-commit contains eligible file gates and direct mutations``() =
        this.``pre-commit declares batch entries and a direct mutation`` ()

    [<Then>]
    member _.``one lint-staged batch runs at its declaration position``() =
        Assert.True(isSuccess (), sprintf "pre-commit batch failed: %s" output)
        Assert.Equal("batch\ndirect\n", File.ReadAllText(Path.Combine(root, "calls.txt")))

    [<Given>]
    member _.``a restaging mutation, then a batch-eligible entry that leaves its file modified, then another restaging mutation``
        ()
        =
        initGit ()
        write "bin/generate-first" "#!/bin/sh\nprintf 'first\\n' > first.txt\n"
        makeExecutable (Path.Combine(root, "bin/generate-first"))
        write "bin/generate-second" "#!/bin/sh\nprintf 'second\\n' > second.txt\n"
        makeExecutable (Path.Combine(root, "bin/generate-second"))
        write "bin/npx" "#!/bin/sh\nprintf '# Changed\\nformatted\\n' > changed.md\n"
        makeExecutable (Path.Combine(root, "bin/npx"))
        prependBinToPath "bin"
        write "changed.md" "# Changed\n"

        write
            "repo-config.yml"
            (config (
                gate "generate-first" "mutation" "generate-first" "external" "      pre-commit: { scope: other }\n"
                + "    restages: true\n"
                + "  - id: format-markdown\n    type: mutation\n    command: dirty-markdown\n    kind: external\n    category: formatter\n    surfaces:\n      pre-commit: { scope: affected-file-type, glob: '*.md' }\n"
                + gate "generate-second" "mutation" "generate-second" "external" "      pre-commit: { scope: other }\n"
                + "    restages: true\n"
            ))

        stage [ "changed.md" ]

    [<When>]
    member _.``they run in that order``() = runGate "pre-commit" None

    [<Then>]
    member _.``the second restaging gate stages only its own output and leaves the batch's leftover mutation unstaged``
        ()
        =
        Assert.True(isSuccess (), sprintf "gate run failed: %s" output)
        let stagedFirst = runFixtureGit [ "show"; ":first.txt" ]
        let stagedSecond = runFixtureGit [ "show"; ":second.txt" ]
        let stagedChangedMd = runFixtureGit [ "show"; ":changed.md" ]
        let worktreeDiff = runFixtureGit [ "diff"; "--name-only" ]

        let worktreeLines =
            worktreeDiff.Stdout.Split('\n')
            |> Array.filter (fun l -> l <> "")
            |> Array.toList

        Assert.Equal("first\n", stagedFirst.Stdout)
        Assert.Equal("second\n", stagedSecond.Stdout)
        Assert.Equal("# Changed\n", stagedChangedMd.Stdout)
        Assert.Equal<string list>([ "changed.md" ], worktreeLines)

    // --- gofmt / Elixir formatter wrapper scenarios -----------------------------

    [<Given>]
    member _.``a tracked ".go" file is not formatted``() =
        initGit ()
        write "unformatted.go" "package fixture\nfunc main(){println(\"hello\")}\n"

        write
            "repo-config.yml"
            (config (formatterVerifierConfig "format-verify-gofmt" (formatterWrapperPath "verify-gofmt.sh") "*.go"))

        stage [ "unformatted.go"; "repo-config.yml" ]

    [<When>]
    member _.``the gate with id "format-verify-gofmt" runs``() =
        runGate "ci" (Some "format-verify-gofmt")

    [<Then>]
    member _.``the wrapper treats non-empty "gofmt -l" output as failure``() =
        Assert.Contains("Go files need formatting:", output)
        Assert.Contains("unformatted.go", output)

    [<Given>]
    member _.``a tracked ".ex" file is not formatted``() = writeUnformattedElixirFixture ()

    [<When>]
    member _.``the gate with id "format-verify-elixir" runs``() =
        runGate "ci" (Some "format-verify-elixir")

    [<Then>]
    member _.``it exits non-zero``() = Assert.False(isSuccess ())

    [<Then>]
    member _.``it exits zero``() =
        Assert.True(isSuccess (), sprintf "elixir gate failed: %s" output)

    [<Then>]
    member _.``no tracked file is rewritten``() =
        if File.Exists(Path.Combine(root, "unformatted.ex")) then
            Assert.Equal(
                "defmodule Fixture do\ndef hello,do: :world\nend\n",
                File.ReadAllText(Path.Combine(root, "unformatted.ex"))
            )
        else
            Assert.Equal(
                "defmodule Fixture do\n  def hello, do: :world\nend\n",
                File.ReadAllText(Path.Combine(root, "formatted.ex"))
            )

            Assert.Equal("IO.puts(\"hello\")\n", File.ReadAllText(Path.Combine(root, "formatted.exs")))

    [<Given>]
    member _.``every tracked ".ex" and ".exs" file is formatted``() =
        initGit ()

        write
            "mix.exs"
            "defmodule WrapperFixture.MixProject do\n  use Mix.Project\n\n  def project, do: [app: :wrapper_fixture, version: \"0.1.0\", elixir: \"~> 1.18\"]\nend\n"

        write "formatted.ex" "defmodule Fixture do\n  def hello, do: :world\nend\n"
        write "formatted.exs" "IO.puts(\"hello\")\n"

        write
            "repo-config.yml"
            (config (
                formatterVerifierConfig
                    "format-verify-elixir"
                    (sprintf "%s --check" (formatterWrapperPath "format-elixir.sh"))
                    "*.{ex,exs}"
            ))

        stage [ "mix.exs"; "formatted.ex"; "formatted.exs"; "repo-config.yml" ]

    // --- CI group summary scenarios ----------------------------------------

    [<Given>]
    member _.``a CI group containing several gates where exactly one fails``() =
        initGit ()

        write
            "repo-config.yml"
            (config (
                "  - id: group-first\n    type: check\n    command: true\n    kind: external\n    ci-group: sample-group\n    surfaces:\n      ci: { scope: other }\n"
                + "  - id: group-failing\n    type: check\n    command: false\n    kind: external\n    ci-group: sample-group\n    surfaces:\n      ci: { scope: other }\n"
                + "  - id: group-third\n    type: check\n    command: true\n    kind: external\n    ci-group: sample-group\n    surfaces:\n      ci: { scope: other }\n"
                + "  - id: other-group-gate\n    type: check\n    command: touch must-not-run.txt\n    kind: external\n    ci-group: other-group\n    surfaces:\n      ci: { scope: other }\n"
            ))

        pendingCiGroup <- Some "sample-group"

    [<Then>]
    member _.``its output contains a per-gate summary line for every gate in the group``() =
        for id in [ "group-first"; "group-failing"; "group-third" ] do
            Assert.Contains(id, output)

        Assert.DoesNotContain("other-group-gate", output)
        Assert.False(File.Exists(Path.Combine(root, "must-not-run.txt")))

    [<Then>]
    member _.``the failing gate id appears on a line marked FAIL``() =
        Assert.True(
            output.Split('\n')
            |> Array.exists (fun l -> l.Contains "group-failing" && l.Contains "FAIL"),
            sprintf "no FAIL line naming group-failing in %s" output
        )

    [<Given>]
    member _.``a CI group contains both an auto-dispatched gate and a hand-wired gate``() =
        initGit ()

        write
            "repo-config.yml"
            (config (
                "  - id: auto-dispatched\n    type: check\n    command: true\n    kind: external\n    ci-group: sample-group\n    surfaces:\n      ci: { scope: other }\n"
                + "  - id: hand-wired-gate\n    type: check\n    command: false\n    kind: external\n    wiring: hand-wired\n    ci-group: sample-group\n    surfaces:\n      ci: { scope: other }\n"
            ))

        pendingCiGroup <- Some "sample-group"

    [<Then>]
    member _.``only the auto-dispatched gate executes``() =
        Assert.True((succeeded = Some true), sprintf "group with only auto-dispatched must succeed: %s" output)
        Assert.Contains("auto-dispatched", output)

    [<Then>]
    member _.``the hand-wired gate is absent from the group's summary``() =
        Assert.DoesNotContain("hand-wired-gate", output)

    // --- CI-infra static-shape scenarios -------------------------------------

    [<Given>]
    member _.``the build-rhino job has published the rhino-cli artifact for the run``() =
        let workflow = prQualityGateWorkflow ()
        let buildRhino = jobBlock workflow "build-rhino"
        buildRhinoPublishesArtifact <- Some(buildRhino.Contains "actions/upload-artifact")
        workflowYaml <- Some workflow

    [<When>]
    member _.``a gate group job executes``() =
        Assert.True(
            (buildRhinoPublishesArtifact = Some true),
            "build-rhino must publish the rhino-cli artifact before a gate group job can consume it"
        )

        let workflow = workflowYaml.Value
        let gateJob = jobBlock workflow "gate"

        let needsLine =
            gateJob.Split('\n')
            |> Array.tryFind (fun l -> l.TrimStart().StartsWith "needs:")
            |> Option.defaultValue ""

        gateJobNeedsBuildRhino <- Some(needsLine.Contains "build-rhino")
        gateJobBlock <- Some gateJob

    [<Then>]
    member _.``it downloads the artifact rather than building from source``() =
        Assert.True((gateJobNeedsBuildRhino = Some true), "the gate job must declare needs: build-rhino")
        Assert.Contains("actions/download-artifact", gateJobBlock.Value)

    [<Then>]
    member _.``it runs no cargo install command``() =
        Assert.DoesNotContain("cargo install", gateJobBlock.Value)

    [<Then>]
    member _.``its step list contains no Rust toolchain setup``() =
        Assert.DoesNotContain("setup-rust", gateJobBlock.Value)

    [<Given>]
    member _.``a CI gate group whose gates require no node-resolved tool``() =
        let repoConfig = File.ReadAllText(Path.Combine(repoRoot, "repo-config.yml"))
        let groupHasNpm = Collections.Generic.Dictionary<string, bool>()
        let mutable currentGroup: string option = None

        for line in repoConfig.Split '\n' do
            let trimmed = line.TrimStart()

            if trimmed.StartsWith "- id:" then
                currentGroup <- None
            elif trimmed.StartsWith "ci-group:" then
                let group = trimmed.Substring("ci-group:".Length).Trim()

                if not (groupHasNpm.ContainsKey group) then
                    groupHasNpm.[group] <- false

                currentGroup <- Some group
            elif trimmed.StartsWith "doctor-tools:" && trimmed.Contains "npm" then
                match currentGroup with
                | Some group -> groupHasNpm.[group] <- true
                | None -> ()

        noNpmGroupId <-
            groupHasNpm
            |> Seq.tryFind (fun kv -> not kv.Value)
            |> Option.map (fun kv -> kv.Key)

        workflowYaml <- Some(prQualityGateWorkflow ())

    [<When>]
    member _.``that group's job executes``() =
        gateJobBlock <- Some(jobBlock workflowYaml.Value "gate")

    [<Then>]
    member _.``its step list contains no npm ci invocation``() =
        let groupId = noNpmGroupId.Value
        let gateJob = gateJobBlock.Value

        // The gate job installs node_modules only when setup-node's run-npm-ci input is true. That input ORs the
        // group's declared npm doctor tool with any group the workflow names explicitly, so the selected group, which
        // declares no npm tool, must not be named.
        let runNpmCi =
            gateJob.Split '\n'
            |> Array.map (fun l -> l.Trim())
            |> Array.tryFind (fun l -> l.StartsWith "run-npm-ci:")
            |> Option.defaultWith (fun () -> failwith "gate job must pass run-npm-ci to setup-node")

        Assert.Contains("contains(matrix.group.doctor_tools, 'npm')", runNpmCi)
        Assert.DoesNotContain(sprintf "matrix.group.group == '%s'" groupId, runNpmCi)

        // setup-node runs npm ci only behind that input.
        let actionLines =
            File.ReadAllText(Path.Combine(repoRoot, ".github", "actions", "setup-node", "action.yml")).Split '\n'

        let npmCiLines =
            actionLines
            |> Array.indexed
            |> Array.filter (fun (_, l) -> l.Trim() = "run: npm ci" || l.Trim().StartsWith "run: npm ci ")
            |> Array.map fst

        Assert.True(npmCiLines.Length > 0, "setup-node must carry an npm ci step")

        for i in npmCiLines do
            let mutable start = i

            while start > 0 && not (actionLines.[start].TrimStart().StartsWith "- ") do
                start <- start - 1

            let guarded =
                actionLines.[start..i]
                |> Array.exists (fun l -> l.Trim() = "if: inputs.run-npm-ci == 'true'")

            Assert.True(guarded, sprintf "setup-node npm ci step at line %d must be guarded by run-npm-ci" (i + 1))

        Assert.Contains("run-npm-ci", setupNodeAction)

    [<Then>]
    member _.``every gate in the group still reports its baseline result``() =
        let groupId = noNpmGroupId.Value
        let gateJob = gateJobBlock.Value
        let lines = gateJob.Split '\n'

        let idx =
            lines
            |> Array.tryFindIndex (fun l -> l.Contains "gate run --surface=ci")
            |> Option.defaultWith (fun () ->
                failwithf "gate job must contain the gate run --surface=ci step for group %s" groupId)

        let mutable start = idx

        while start > 0 && not (lines.[start].TrimStart().StartsWith "- ") do
            start <- start - 1

        let stepLines = lines.[start..idx]
        Assert.False(stepLines |> Array.exists (fun l -> l.TrimStart().StartsWith "if:"))

    // --- Unnamed npm ci action step -------------------------------------------

    [<Given>]
    member _.``a composite action with an unnamed unguarded npm ci step``() =
        compositeActionUnderInspection <-
            Some
                "runs:\n  using: composite\n  steps:\n    - name: guarded install\n      if: inputs.run-npm-ci == 'true'\n      run: npm ci\n    - run: npm ci --ignore-scripts\n"

    [<When>]
    member _.``its npm ci steps are inspected``() =
        let action =
            compositeActionUnderInspection
            |> Option.defaultWith (fun () -> failwith "the composite action fixture has not been established")

        let npmCiSteps =
            actionSteps action
            |> List.filter (fun step ->
                runBlockFromStep step |> Option.map hasNpmCiCommand |> Option.defaultValue false)

        unnamedNpmCiUnguarded <-
            Some(
                List.length npmCiSteps = 2
                && npmCiSteps
                   |> List.exists (fun step -> not (step.Contains "if: inputs.run-npm-ci == 'true'"))
            )

    [<Then>]
    member _.``the unnamed npm ci step is reported unguarded``() =
        Assert.True((unnamedNpmCiUnguarded = Some true))

    // --- gate-declaration.feature: lockfile-sync ------------------------------
    //
    // Deferred from `GateDeclarationSteps.fs` until `gate run` existed —
    // `lockfile-sync` is a `rhino-cli`-kind mutation whose command runs
    // through `gate run`, so it needs this file's subprocess-spawning
    // harness rather than `GateDeclarationSteps.fs`'s in-process parsing.

    [<Given>]
    member _.``a staged package.json changes a dependency``() =
        initGit ()

        write
            "bin/npm"
            "#!/bin/sh\nprintf '{\"name\":\"lock-app\",\"version\":\"2.0.0\",\"packages\":{\"\":{\"name\":\"lock-app\",\"version\":\"2.0.0\"}}}' > apps/lock-app/package-lock.json\n"

        makeExecutable (Path.Combine(root, "bin", "npm"))
        prependBinToPath "bin"
        write "apps/lock-app/package.json" "{\"name\":\"lock-app\",\"version\":\"2.0.0\"}\n"

        write
            "apps/lock-app/package-lock.json"
            "{\"name\":\"lock-app\",\"version\":\"1.0.0\",\"packages\":{\"\":{\"name\":\"lock-app\",\"version\":\"1.0.0\"}}}\n"

        write
            "repo-config.yml"
            (config (
                gate "lockfile-sync" "mutation" "git lockfile sync" "rhino-cli" "      pre-commit: { scope: other }\n"
                + "    restages: true\n"
            ))

        stage [ "apps/lock-app/package.json" ]

    [<Given>]
    member _.``package-lock.json is stale with respect to it``() =
        Assert.Contains("1.0.0", File.ReadAllText(Path.Combine(root, "apps", "lock-app", "package-lock.json")))

    [<When>]
    member _.``the gate with id "lockfile-sync" runs on surface "pre-commit"``() =
        runGate "pre-commit" (Some "lockfile-sync")

    [<Then>]
    member _.``package-lock.json is regenerated``() =
        Assert.True(isSuccess (), sprintf "lockfile gate failed: %s" output)
        Assert.Contains("2.0.0", File.ReadAllText(Path.Combine(root, "apps", "lock-app", "package-lock.json")))

    [<Then>]
    member _.``the regenerated package-lock.json is staged``() =
        let staged = runFixtureGit [ "diff"; "--cached"; "--name-only" ]
        Assert.Contains("apps/lock-app/package-lock.json", staged.Stdout)

    [<Then>]
    member _.``the commit proceeds with both files in the same commit``() =
        let staged = runFixtureGit [ "diff"; "--cached"; "--name-only" ]
        Assert.Contains("apps/lock-app/package.json", staged.Stdout)
        Assert.Contains("apps/lock-app/package-lock.json", staged.Stdout)

    [<Given>]
    member _.``a staged package.json matches package-lock.json``() =
        initGit ()
        write "apps/lock-app/package.json" "{\"name\":\"lock-app\",\"version\":\"2.0.0\"}\n"

        write
            "apps/lock-app/package-lock.json"
            "{\"name\":\"lock-app\",\"version\":\"2.0.0\",\"packages\":{\"\":{\"name\":\"lock-app\",\"version\":\"2.0.0\"}}}\n"

        write
            "repo-config.yml"
            (config (
                gate "lockfile-sync" "mutation" "git lockfile sync" "rhino-cli" "      pre-commit: { scope: other }\n"
                + "    restages: true\n"
            ))

        stage [ "apps/lock-app/package.json" ]

    [<Then>]
    member _.``package-lock.json is unchanged``() =
        Assert.True(isSuccess (), sprintf "lockfile gate failed: %s" output)
        Assert.Contains("2.0.0", File.ReadAllText(Path.Combine(root, "apps", "lock-app", "package-lock.json")))

    [<Then>]
    member _.``nothing additional is staged``() =
        let staged = runFixtureGit [ "diff"; "--cached"; "--name-only" ]
        Assert.Equal("apps/lock-app/package.json\n", staged.Stdout)

module private FeatureRunner =

    let private featurePath: string =
        Path.Combine(repoRoot, "specs", "apps", "rhino", "cli", "behaviours", "gate", "gate-execution.feature")

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
        let definitions = StepDefinitions([| typeof<GateExecutionSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)
        let scenario = Seq.exactlyOne feature.Scenarios
        scenario.Action.Invoke()

    /// The two `gate-declaration.feature` lockfile-sync scenarios exercise
    /// `gate run` and so need this file's subprocess-spawning harness, but
    /// their Gherkin lives in a different feature file than the one `run`
    /// above reads from.
    let runFrom (otherFeaturePath: string) (scenarioTitle: string) : unit =
        let allLines = File.ReadAllLines otherFeaturePath
        let snippet = extractScenario allLines scenarioTitle
        let definitions = StepDefinitions([| typeof<GateExecutionSteps> |])
        let feature = definitions.GenerateFeature(otherFeaturePath, snippet)
        let scenario = Seq.exactlyOne feature.Scenarios
        scenario.Action.Invoke()

    let gateDeclarationFeaturePath: string =
        Path.Combine(repoRoot, "specs", "apps", "rhino", "cli", "behaviours", "gate", "gate-declaration.feature")

[<Fact>]
let ``A configured surface guard re-executes the complete gate run exactly once`` () =
    FeatureRunner.run "A configured surface guard re-executes the complete gate run exactly once"

[<Fact>]
let ``An active surface guard marker prevents recursive re-execution`` () =
    FeatureRunner.run "An active surface guard marker prevents recursive re-execution"

[<Fact>]
let ``A surface guard child exit code is preserved`` () =
    FeatureRunner.run "A surface guard child exit code is preserved"

[<Fact>]
let ``A configured surface guard fails closed when it cannot start`` () =
    FeatureRunner.run "A configured surface guard fails closed when it cannot start"

[<Fact>]
let ``An unconfigured surface executes gates directly`` () =
    FeatureRunner.run "An unconfigured surface executes gates directly"

[<Fact>]
let ``Rhino CLI kind receives derived files`` () =
    FeatureRunner.run "Rhino CLI kind receives derived files"

[<Fact>]
let ``External kind preserves fixed argv before files`` () =
    FeatureRunner.run "External kind preserves fixed argv before files"

[<Fact>]
let ``CI affected-file-type gates use the supplied event base`` () =
    FeatureRunner.run "CI affected-file-type gates use the supplied event base"

[<Fact>]
let ``Affected-file-type gates exclude deleted paths on both CI and pre-commit surfaces`` () =
    FeatureRunner.run "Affected-file-type gates exclude deleted paths on both CI and pre-commit surfaces"

[<Fact>]
let ``Path-gated gates still fire when a trigger path is only deleted`` () =
    FeatureRunner.run "Path-gated gates still fire when a trigger path is only deleted"

[<Fact>]
let ``External kind resolves a repository-local binary`` () =
    FeatureRunner.run "External kind resolves a repository-local binary"

[<Fact>]
let ``Nx kind delegates the affected project graph`` () =
    FeatureRunner.run "Nx kind delegates the affected project graph with fixed arguments"

[<Fact>]
let ``All supported scopes derive their specified inputs`` () =
    FeatureRunner.run "All supported scopes derive their specified inputs"

[<Fact>]
let ``Glob lists and excludes are applied before invocation`` () =
    FeatureRunner.run "Glob lists and excludes are applied before invocation"

[<Fact>]
let ``A registered Rhino CLI gate forwards and enforces configured exclusions`` () =
    FeatureRunner.run "A registered Rhino CLI gate forwards and enforces configured exclusions"

[<Fact>]
let ``An empty scoped match is a successful skip`` () =
    FeatureRunner.run "An empty scoped match is a successful skip"

[<Fact>]
let ``Only executes exactly one direct leaf`` () =
    FeatureRunner.run "Only executes exactly one direct leaf"

[<Fact>]
let ``Unknown or duplicate only ids fail before execution`` () =
    FeatureRunner.run "Unknown or duplicate only ids fail before execution"

[<Fact>]
let ``An unknown group id fails before execution`` () =
    FeatureRunner.run "An unknown group id fails before execution"

[<Fact>]
let ``A re-staging mutation stages only its outputs`` () =
    FeatureRunner.run "A re-staging mutation stages only its outputs"

[<Fact>]
let ``A failed mutation never re-stages output`` () =
    FeatureRunner.run "A failed mutation never re-stages output"

[<Fact>]
let ``Two consecutive re-staging mutations each attribute only their own output`` () =
    FeatureRunner.run "Two consecutive re-staging mutations each attribute only their own output"

[<Fact>]
let ``A second re-staging mutation that re-touches the first mutation's output is still staged`` () =
    FeatureRunner.run "A second re-staging mutation that re-touches the first mutation's output is still staged"

[<Fact>]
let ``Pre-commit has one declaration-positioned batch`` () =
    FeatureRunner.run "Pre-commit has one declaration-positioned batch"

[<Fact>]
let ``A restaging gate after the lint-staged batch never re-stages the batch's own leftover mutation`` () =
    FeatureRunner.run "A restaging gate after the lint-staged batch never re-stages the batch's own leftover mutation"

[<Fact>]
let ``gofmt is wrapped because it cannot fail on its own`` () =
    FeatureRunner.run "gofmt is wrapped because it cannot fail on its own"

[<Fact>]
let ``The Elixir formatter script gains a check mode that fails`` () =
    FeatureRunner.run "The Elixir formatter script gains a check mode that fails"

[<Fact>]
let ``The Elixir check mode passes on formatted sources`` () =
    FeatureRunner.run "The Elixir check mode passes on formatted sources"

[<Fact>]
let ``A failing gate inside a group is named in the output`` () =
    FeatureRunner.run "A failing gate inside a group is named in the output"

[<Fact>]
let ``A hand-wired gate never runs a second time inside its CI group`` () =
    FeatureRunner.run "A hand-wired gate never runs a second time inside its CI group"

[<Fact>]
let ``Gate group jobs consume a prebuilt binary`` () =
    FeatureRunner.run "Gate group jobs consume a prebuilt binary"

[<Fact>]
let ``A gate group with no node tooling skips npm ci`` () =
    FeatureRunner.run "A gate group with no node tooling skips npm ci"

[<Fact>]
let ``An unnamed npm ci action step is detected`` () =
    FeatureRunner.run "An unnamed npm ci action step is detected"

[<Fact>]
let ``lockfile-sync regenerates the lockfile and restages it`` () =
    FeatureRunner.run "lockfile-sync regenerates the lockfile and restages it"

[<Fact>]
let ``lockfile-sync is a no-op when the lockfile is already current`` () =
    FeatureRunner.run "lockfile-sync is a no-op when the lockfile is already current"
