/// Plain xunit tests for `RhinoCli.Cli.Dispatch.route`'s `gate run`/`gate
/// list` leaves, driven **in-process** against a disposable Git fixture.
/// `GateExecutionSteps.fs`'s 35 scenarios spawn the real, prebuilt CLI as a
/// subprocess (`gate run`'s `rhino-cli`-kind leaf spawns the current
/// executable, so an in-process call would resolve to the test host) — that
/// makes them invisible to coverlet's line-coverage instrumentation, which is
/// why `Gate.fs`'s internals (`runGit`, `stagedPaths`, `changedPaths`,
/// `candidatePaths`, `globRegex`, the `gate run` loop) sat at 57% line
/// coverage despite extensive scenario coverage — see `learnings.md`,
/// 2026-08-30. This file exercises the same fixture shapes through `route`
/// directly so coverlet can see them.
module RhinoCli.Tests.Integration.Steps.GateResourceTests

open System
open System.Diagnostics
open System.IO
open Xunit
open RhinoCli.Cli.Dispatch

let private runCaptured (getRepoRoot: unit -> Result<string, string>) (argv: string[]) : int * string * string =
    let originalOut = Console.Out
    let originalErr = Console.Error
    use outWriter = new StringWriter()
    use errWriter = new StringWriter()

    try
        Console.SetOut(outWriter)
        Console.SetError(errWriter)
        let exitCode = route getRepoRoot argv
        exitCode, outWriter.ToString(), errWriter.ToString()
    finally
        Console.SetOut(originalOut)
        Console.SetError(originalErr)

let private okRoot (root: string) () = Ok root

/// Mirrors `GateExecutionSteps.fs`'s `gate`/`config` fixture helpers.
let private gate (id: string) (gateType: string) (command: string) (kind: string) (surfaces: string) : string =
    sprintf
        "  - id: %s\n    type: %s\n    command: %s\n    kind: %s\n    surfaces:\n%s"
        id
        gateType
        command
        kind
        surfaces

let private config (gates: string) : string = "gates:\n" + gates

type private RunResult =
    { ExitCode: int
      Stdout: string
      Stderr: string }

let private runProcess (exe: string) (args: string list) (cwd: string) (env: (string * string) list) : RunResult =
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

/// A fresh temp dir with an initialized Git repository, ready for
/// `write`/`stage`/`commit`. Only the fixture's OWN `git` subprocess calls
/// get `GIT_DIR`/`GIT_WORK_TREE` overrides — the test host process's own
/// environment is never touched, so `Gate.fs`'s in-process `runGit`/
/// `stagedPaths` calls (which use `WorkingDirectory = repoRoot`) resolve
/// this fixture correctly via cwd-based discovery.
type private GitFixture() =
    let root =
        let dir =
            Path.Combine(Path.GetTempPath(), "rhino-cli-waveef-gate-" + Guid.NewGuid().ToString("N"))

        Directory.CreateDirectory dir |> ignore
        dir

    let fixtureGitEnv =
        [ "GIT_DIR", Path.Combine(root, ".git")
          "GIT_CEILING_DIRECTORIES", root
          "GIT_CONFIG_GLOBAL", "/dev/null"
          "GIT_CONFIG_SYSTEM", "/dev/null" ]

    let runGit (args: string list) : RunResult =
        runProcess "git" args root fixtureGitEnv

    member _.Root = root

    member _.Write(relative: string, contents: string) =
        let path = Path.Combine(root, relative)
        Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore
        File.WriteAllText(path, contents)

    member _.Init() = runGit [ "init"; "--quiet" ] |> ignore

    member _.Stage(paths: string list) = runGit ("add" :: paths) |> ignore

    member _.Commit(message: string) =
        let result =
            runProcess
                "git"
                [ "commit"; "--quiet"; "-m"; message ]
                root
                (fixtureGitEnv
                 @ [ "GIT_AUTHOR_NAME", "waveef-gate-fixture"
                     "GIT_AUTHOR_EMAIL", "waveef-gate-fixture@example.invalid"
                     "GIT_COMMITTER_NAME", "waveef-gate-fixture"
                     "GIT_COMMITTER_EMAIL", "waveef-gate-fixture@example.invalid" ])

        Assert.Equal(0, result.ExitCode)

/// Resolves the real `git` binary's absolute path via `sh -c 'command -v
/// git'`, used to build a shim `git` that forwards to the genuine binary for
/// every subcommand except the one it deliberately fails.
let private resolveRealGit () : string =
    let psi =
        ProcessStartInfo(
            FileName = "sh",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        )

    psi.ArgumentList.Add "-c"
    psi.ArgumentList.Add "command -v git"
    use proc = Process.Start psi
    let out = proc.StandardOutput.ReadToEnd()
    proc.StandardError.ReadToEnd() |> ignore
    proc.WaitForExit()
    out.Trim()

/// Writes an executable `git` shim to `dir` that runs `interceptBody` first
/// (typically an `if ...; then exit 1; fi` guard matching one exact
/// subcommand invocation) before falling through to the real `git` binary —
/// lets a test force a *specific* `git` subprocess call to fail while every
/// other call in the same `gate run` invocation still behaves normally,
/// which a missing-binary PATH trick cannot do since it fails every call
/// uniformly.
let private writeGitShim (dir: string) (interceptBody: string) : unit =
    Directory.CreateDirectory dir |> ignore
    let realGit = resolveRealGit ()
    let scriptPath = Path.Combine(dir, "git")
    File.WriteAllText(scriptPath, sprintf "#!/bin/sh\n%s\nexec \"%s\" \"$@\"\n" interceptBody realGit)

    File.SetUnixFileMode(
        scriptPath,
        UnixFileMode.UserRead
        ||| UnixFileMode.UserWrite
        ||| UnixFileMode.UserExecute
        ||| UnixFileMode.GroupRead
        ||| UnixFileMode.GroupExecute
        ||| UnixFileMode.OtherRead
        ||| UnixFileMode.OtherExecute
    )

/// Prepends `dir` to the test host process's own `PATH` for the duration of
/// `f`, then restores it — safe here because
/// `[<assembly: CollectionBehavior(DisableTestParallelization = true)>]`
/// (declared in `GitRootUnitTests.fs`) means no other test observes the
/// mutated value concurrently.
let private withPathPrepended (dir: string) (f: unit -> 'a) : 'a =
    let original = Environment.GetEnvironmentVariable "PATH"

    try
        Environment.SetEnvironmentVariable("PATH", dir + string Path.PathSeparator + original)
        f ()
    finally
        Environment.SetEnvironmentVariable("PATH", original)

let private withEnvironmentVariable (name: string) (value: string) (f: unit -> 'a) : 'a =
    let original = Environment.GetEnvironmentVariable name

    try
        Environment.SetEnvironmentVariable(name, value)
        f ()
    finally
        Environment.SetEnvironmentVariable(name, original)

/// An always-runs `external`-kind gate declared on `pre-push`.
let private alwaysRunsConfig =
    config (gate "always-runs" "check" "sh -c 'exit 0'" "external" "      pre-push: { scope: other }\n")

let private guardedConfig (command: string) (args: string list) =
    String.concat
        "\n"
        ([ "gate-surface-guards:"; "  pre-push:"; sprintf "    command: %s" command ]
         @ (if List.isEmpty args then
                []
            else
                "    args:" :: (args |> List.map (sprintf "      - '%s'")))
         @ [ "    active-env: RHINO_TEST_GUARD_ACTIVE"; "gates: []"; "" ])

[<Fact>]
let ``route preserves the configured surface guard process exit code`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", guardedConfig "sh" [ "-c"; "exit 23" ])

    let code, _, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(23, code)

[<Fact>]
let ``route fails closed when the configured surface guard cannot start`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", guardedConfig "./missing-guard" [])

    let code, _, err =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(1, code)
    Assert.Contains("gate surface guard", err)

[<Fact>]
let ``route bypasses the configured surface guard when its marker is active`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", guardedConfig "./missing-guard" [])

    let code, _, _ =
        withEnvironmentVariable "RHINO_TEST_GUARD_ACTIVE" "active" (fun () ->
            runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |])

    Assert.Equal(0, code)

[<Fact>]
let ``route runs an unconditional gate on pre-push`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Write("package.json", "{}\n")
    fx.Stage [ "repo-config.yml"; "package.json" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(0, code)
    Assert.Contains("Running gate always-runs", out)

[<Fact>]
let ``route runs a named gate via --only`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push"; "--only=always-runs" |]

    Assert.Equal(0, code)
    Assert.Contains("Running gate always-runs", out)

[<Fact>]
let ``route surfaces a failing gate's error on pre-push`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (gate "always-fails" "check" "sh -c 'exit 1'" "external" "      pre-push: { scope: other }\n")
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, _, err =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(1, code)
    Assert.Contains("gate always-fails failed", err)

[<Fact>]
let ``route runs a path-gated gate on pre-push when the trigger path is staged`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "path-gated-check"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      pre-push:\n        scope: path-gated\n        trigger:\n          - docs/\n"
        )
    )

    fx.Write("docs/a.md", "# A\n")
    fx.Stage [ "repo-config.yml"; "docs/a.md" ]
    fx.Commit "initial"

    fx.Write("docs/a.md", "# A changed\n")
    fx.Stage [ "docs/a.md" ]

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(0, code)
    Assert.Contains("Running gate path-gated-check", out)

[<Fact>]
let ``route skips a path-gated gate on pre-push when no changed path matches the trigger`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "path-gated-check"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      pre-push:\n        scope: path-gated\n        trigger:\n          - docs/\n"
        )
    )

    fx.Write("src/a.txt", "one\n")
    fx.Stage [ "repo-config.yml"; "src/a.txt" ]
    fx.Commit "initial"

    fx.Write("src/a.txt", "two\n")
    fx.Stage [ "src/a.txt" ]

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(0, code)
    Assert.DoesNotContain("Running gate path-gated-check", out)

[<Fact>]
let ``route reports missing --surface on gate run`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, _, err = runCaptured (okRoot fx.Root) [| "gate"; "run" |]
    Assert.Equal(2, code)
    Assert.Contains("--surface <SURFACE>", err)

[<Fact>]
let ``route reports missing --surface on gate run with --help`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, _, err = runCaptured (okRoot fx.Root) [| "gate"; "run"; "--help" |]
    Assert.Equal(2, code)
    Assert.Contains("--help", err)

[<Fact>]
let ``route threads a commit-message file through gate run on commit-msg`` () =
    // A commit-message file is only valid on the `commit-msg` surface — see
    // `runAtRootWithOnlyAndMessageFile`'s guard in Gate.fs.
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (gate "msg-check" "check" "sh -c 'exit 0'" "external" "      commit-msg: { scope: other }\n")
    )

    fx.Write("msg.txt", "a commit message\n")
    fx.Stage [ "repo-config.yml"; "msg.txt" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured
            (okRoot fx.Root)
            [| "gate"
               "run"
               "--surface=commit-msg"
               "--"
               Path.Combine(fx.Root, "msg.txt") |]

    Assert.Equal(0, code)
    Assert.Contains("Running gate msg-check", out)

[<Fact>]
let ``route rejects a commit-message file on a non-commit-msg surface`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Write("msg.txt", "a commit message\n")
    fx.Stage [ "repo-config.yml"; "msg.txt" ]
    fx.Commit "initial"

    let code, _, err =
        runCaptured
            (okRoot fx.Root)
            [| "gate"
               "run"
               "--surface=pre-push"
               "--"
               Path.Combine(fx.Root, "msg.txt") |]

    Assert.Equal(1, code)
    Assert.Contains("commit-message file is only valid for the commit-msg surface", err)

[<Fact>]
let ``route reports missing --surface on gate list`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, _, err = runCaptured (okRoot fx.Root) [| "gate"; "list" |]
    Assert.Equal(2, code)
    Assert.Contains("--surface <SURFACE>", err)

[<Fact>]
let ``route lists gates declared on a surface`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "list"; "--surface=pre-push" |]

    Assert.Equal(0, code)
    Assert.Contains("always-runs", out)

[<Fact>]
let ``route lists gates declared on a surface as JSON`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "list"; "--surface=pre-push"; "--format=json" |]

    Assert.Equal(0, code)
    Assert.Contains("always-runs", out)

[<Fact>]
let ``route reports a gate missing ci_group when listing --by-group`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, _, err =
        runCaptured (okRoot fx.Root) [| "gate"; "list"; "--surface=pre-push"; "--by-group" |]

    Assert.Equal(1, code)
    Assert.Contains("missing ci_group required for grouped output", err)

// ---------------------------------------------------------------------------
// AffectedFileType / AllFileType candidate scopes — matchingFiles,
// filterCandidates, globRegex, isExcluded, reportEmptyScopeSkip
// ---------------------------------------------------------------------------

[<Fact>]
let ``route skips a file-scoped gate on pre-commit when no staged file matches its glob`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "md-only-check"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      pre-commit: { scope: affected-file-type, glob: \"*.md\" }\n"
        )
    )

    fx.Write("src/a.txt", "one\n")
    fx.Stage [ "repo-config.yml"; "src/a.txt" ]
    fx.Commit "initial"

    fx.Write("src/a.txt", "two\n")
    fx.Stage [ "src/a.txt" ]

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-commit" |]

    Assert.Equal(0, code)
    Assert.Contains("Skipping gate md-only-check", out)

[<Fact>]
let ``route runs an all-file-type-scoped gate on pre-push when a tracked file matches its glob`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "md-tree-check"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      pre-push: { scope: all-file-type, glob: \"**/*.md\", exclude: [\"vendor\"] }\n"
        )
    )

    fx.Write("docs/a.md", "# A\n")
    fx.Write("vendor/skip.md", "# skip\n")
    fx.Stage [ "repo-config.yml"; "docs/a.md"; "vendor/skip.md" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(0, code)
    Assert.Contains("Running gate md-tree-check", out)

// ---------------------------------------------------------------------------
// `ci` surface — the `GATE_CHANGED_BASE` explicit-base branch of `changedPaths`
// ---------------------------------------------------------------------------

[<Fact>]
let ``route falls back to the merge base on ci when GATE_CHANGED_BASE is unset`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "ci-path-gated"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      ci:\n        scope: path-gated\n        trigger:\n          - docs/\n"
        )
    )

    fx.Write("docs/a.md", "# A\n")
    fx.Stage [ "repo-config.yml"; "docs/a.md" ]
    fx.Commit "initial"

    fx.Write("docs/a.md", "# A changed\n")
    fx.Stage [ "docs/a.md" ]

    let code, out, _ = runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=ci" |]
    Assert.Equal(0, code)
    Assert.Contains("Running gate ci-path-gated", out)

[<Fact>]
let ``route honors an explicit GATE_CHANGED_BASE on ci`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "ci-path-gated"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      ci:\n        scope: path-gated\n        trigger:\n          - docs/\n"
        )
    )

    fx.Write("docs/a.md", "# A\n")
    fx.Stage [ "repo-config.yml"; "docs/a.md" ]
    fx.Commit "first"

    fx.Write("docs/a.md", "# A changed\n")
    fx.Stage [ "docs/a.md" ]
    fx.Commit "second"

    let firstSha =
        let result =
            runProcess "git" [ "rev-parse"; "HEAD~1" ] fx.Root [ "GIT_DIR", Path.Combine(fx.Root, ".git") ]

        result.Stdout.Trim()

    let previous = Environment.GetEnvironmentVariable "GATE_CHANGED_BASE"

    try
        Environment.SetEnvironmentVariable("GATE_CHANGED_BASE", firstSha)
        let code, out, _ = runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=ci" |]
        Assert.Equal(0, code)
        Assert.Contains("Running gate ci-path-gated", out)
    finally
        Environment.SetEnvironmentVariable("GATE_CHANGED_BASE", previous)

// ---------------------------------------------------------------------------
// `--group` — resolveGroupGates, reportGroupSummary
// ---------------------------------------------------------------------------

let private groupedConfig (secondCommand: string) =
    config (
        "  - id: group-a\n    type: check\n    command: sh -c 'exit 0'\n    kind: external\n    ci-group: my-group\n    surfaces:\n      pre-push: { scope: other }\n"
        + sprintf
            "  - id: group-b\n    type: check\n    command: %s\n    kind: external\n    ci-group: my-group\n    surfaces:\n      pre-push: { scope: other }\n"
            secondCommand
    )

[<Fact>]
let ``route runs every gate in a passing --group`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", groupedConfig "sh -c 'exit 0'")
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push"; "--group=my-group" |]

    Assert.Equal(0, code)
    Assert.Contains("group-a\tPASS", out)
    Assert.Contains("group-b\tPASS", out)

[<Fact>]
let ``route reports a failing member of a --group`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", groupedConfig "sh -c 'exit 1'")
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, out, err =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push"; "--group=my-group" |]

    Assert.Equal(1, code)
    Assert.Contains("group-b\tFAIL", out)
    Assert.Contains("gate group my-group failed", err)

[<Fact>]
let ``route reports an unmatched --group id`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, _, err =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push"; "--group=no-such-group" |]

    Assert.Equal(1, code)
    Assert.Contains("matched no gates on surface", err)

// ---------------------------------------------------------------------------
// `restages: true` — restagingBeforeSnapshot, restageMutationOutputs,
// worktreeChangedPaths, mutationOutputDelta
// ---------------------------------------------------------------------------

[<Fact>]
let ``route restages a mutation gate's new output file`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            "  - id: mutating-check\n    type: mutation\n    command: touch generated.txt\n    kind: external\n    restages: true\n    surfaces:\n      pre-push: { scope: other }\n"
        )
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(0, code)
    Assert.Contains("Running gate mutating-check", out)
    Assert.True(File.Exists(Path.Combine(fx.Root, "generated.txt")))

    let staged =
        (runProcess "git" [ "diff"; "--cached"; "--name-only" ] fx.Root [ "GIT_DIR", Path.Combine(fx.Root, ".git") ])
            .Stdout

    Assert.Contains("generated.txt", staged)

// ---------------------------------------------------------------------------
// `gate list` JSON projections — surfaceName, gateTypeName, scopeName,
// wiringName, orNull
// ---------------------------------------------------------------------------

[<Fact>]
let ``route lists JSON scope, type, wiring, and category projections for a mutation gate declared on three surfaces``
    ()
    =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "multi-surface"
                "mutation"
                "prettier --write"
                "external"
                "      commit-msg: { scope: affected-file-type, glob: \"*.md\" }\n      pre-commit: { scope: all-projects }\n      pre-push:\n        scope: path-gated\n        trigger:\n          - docs/\n"
            + "    wiring: matrix\n    category: formatter\n"
        )
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let codePrePush, outPrePush, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "list"; "--surface=pre-push"; "--format=json" |]

    Assert.Equal(0, codePrePush)
    Assert.Contains("\"type\": \"mutation\"", outPrePush)
    Assert.Contains("\"scope\": \"path-gated\"", outPrePush)
    Assert.Contains("\"category\": \"formatter\"", outPrePush)
    Assert.Contains("\"wiring\": \"matrix\"", outPrePush)
    Assert.Contains("\"commit-msg\"", outPrePush)
    Assert.Contains("\"pre-commit\"", outPrePush)

    let codeCommitMsg, outCommitMsg, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "list"; "--surface=commit-msg"; "--format=json" |]

    Assert.Equal(0, codeCommitMsg)
    Assert.Contains("\"scope\": \"affected-file-type\"", outCommitMsg)

    let codePreCommit, outPreCommit, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "list"; "--surface=pre-commit"; "--format=json" |]

    Assert.Equal(0, codePreCommit)
    Assert.Contains("\"scope\": \"all-projects\"", outPreCommit)

// ---------------------------------------------------------------------------
// validateGateIds — unmatched `--only`, duplicate gate id
// ---------------------------------------------------------------------------

[<Fact>]
let ``route reports an --only selector matching no gate on the surface`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, _, err =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push"; "--only=does-not-exist" |]

    Assert.Equal(1, code)
    Assert.Contains("must select exactly one gate, found 0", err)

[<Fact>]
let ``route reports a duplicate gate id when listing a surface`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate "dup-id" "check" "sh -c 'exit 0'" "external" "      pre-push: { scope: other }\n"
            + gate "dup-id" "check" "sh -c 'exit 0'" "external" "      pre-push: { scope: other }\n"
        )
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, _, err =
        runCaptured (okRoot fx.Root) [| "gate"; "list"; "--surface=pre-push" |]

    Assert.Equal(1, code)
    Assert.Contains("duplicate gate id \"dup-id\"", err)

// ---------------------------------------------------------------------------
// `gate list --by-group` text output — writeGrouped
// ---------------------------------------------------------------------------

[<Fact>]
let ``route lists grouped gates as text`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", groupedConfig "sh -c 'exit 0'")
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "list"; "--surface=pre-push"; "--by-group" |]

    Assert.Equal(0, code)
    Assert.Contains("my-group\tgroup-a, group-b", out)

// ---------------------------------------------------------------------------
// Missing repo-config.yml on `gate list` / `gate run` / `gate emit`
// ---------------------------------------------------------------------------

[<Fact>]
let ``route reports a repo-config load failure on gate list`` () =
    let dir =
        Path.Combine(Path.GetTempPath(), "rhino-cli-waveef-gate-noconfig-" + Guid.NewGuid().ToString("N"))

    Directory.CreateDirectory dir |> ignore

    let code, _, err =
        runCaptured (okRoot dir) [| "gate"; "list"; "--surface=pre-push" |]

    Assert.Equal(1, code)
    Assert.Contains("cannot read repo-config.yml", err)

[<Fact>]
let ``route reports a repo-config load failure on gate emit`` () =
    let dir =
        Path.Combine(Path.GetTempPath(), "rhino-cli-waveef-gate-emit-noconfig-" + Guid.NewGuid().ToString("N"))

    Directory.CreateDirectory dir |> ignore

    let code, _, err =
        runCaptured (okRoot dir) [| "gate"; "emit"; "--surface=pre-commit" |]

    Assert.Equal(1, code)
    Assert.Contains("cannot read repo-config.yml", err)

[<Fact>]
let ``route reports a repo-config load failure on gate run`` () =
    let dir =
        Path.Combine(Path.GetTempPath(), "rhino-cli-waveef-gate-run-noconfig-" + Guid.NewGuid().ToString("N"))

    Directory.CreateDirectory dir |> ignore

    let code, _, err =
        runCaptured (okRoot dir) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(1, code)
    Assert.Contains("cannot read repo-config.yml", err)

// ---------------------------------------------------------------------------
// `gate emit` — non-pre-commit surface, node-resolved npx rewriting, quoted
// fixed args, and package.json edge cases
// ---------------------------------------------------------------------------

[<Fact>]
let ``route rejects gate emit for a non-pre-commit surface`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Write("package.json", "{}\n")
    fx.Stage [ "repo-config.yml"; "package.json" ]
    fx.Commit "initial"

    let code, _, err =
        runCaptured (okRoot fx.Root) [| "gate"; "emit"; "--surface=pre-push" |]

    Assert.Equal(1, code)
    Assert.Contains("gate emit currently supports only surface pre-commit", err)

[<Fact>]
let ``route emits a node-resolved lint-staged command rewritten from npx, with quoted fixed args`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "eslint-check"
                "check"
                "npx --no-install eslint --fix src"
                "external"
                "      pre-commit: { scope: affected-file-type, glob: \"*.js\" }\n"
            + "    doctor-tools: [npm]\n    args:\n      max-warnings: [\"5\"]\n"
        )
    )

    fx.Write("package.json", "{}\n")
    fx.Stage [ "repo-config.yml"; "package.json" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "emit"; "--surface=pre-commit" |]

    Assert.Equal(0, code)
    Assert.Contains("Emitted lint-staged from gate surface pre-commit", out)

    let packageJson = File.ReadAllText(Path.Combine(fx.Root, "package.json"))
    Assert.Contains("node_modules/.bin/eslint --fix src", packageJson)

    let firstCommand =
        System.Text.Json.Nodes.JsonNode.Parse(packageJson).["lint-staged"].["*.js"].AsArray().[0].GetValue<string>()

    Assert.Contains("--max-warnings", firstCommand)
    Assert.Contains("\"5\"", firstCommand)

[<Fact>]
let ``route rejects gate emit when package.json is not a JSON object`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Write("package.json", "[]\n")
    fx.Stage [ "repo-config.yml"; "package.json" ]
    fx.Commit "initial"

    let code, _, err =
        runCaptured (okRoot fx.Root) [| "gate"; "emit"; "--surface=pre-commit" |]

    Assert.Equal(1, code)
    Assert.Contains("package.json must contain a JSON object", err)

[<Fact>]
let ``route reports an unreadable package.json on gate emit`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, _, err =
        runCaptured (okRoot fx.Root) [| "gate"; "emit"; "--surface=pre-commit" |]

    Assert.Equal(1, code)
    Assert.Contains("cannot read", err)

// ---------------------------------------------------------------------------
// globRegex — unparsable patterns, `?`, and character classes
// ---------------------------------------------------------------------------

[<Fact>]
let ``route rejects an unparsable glob pattern as a registry semantic finding`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "bad-glob"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      pre-commit: { scope: affected-file-type, glob: \"[unclosed\" }\n"
        )
    )

    fx.Write("src/a.txt", "one\n")
    fx.Stage [ "repo-config.yml"; "src/a.txt" ]
    fx.Commit "initial"

    fx.Write("src/a.txt", "two\n")
    fx.Stage [ "src/a.txt" ]

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-commit" |]

    Assert.Equal(1, code)
    Assert.Contains("invalid glob", out)

[<Fact>]
let ``route matches a glob using the single-character ? wildcard`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "q-glob"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      pre-push: { scope: affected-file-type, glob: \"file?.txt\" }\n"
        )
    )

    fx.Write("file1.txt", "one\n")
    fx.Stage [ "repo-config.yml"; "file1.txt" ]
    fx.Commit "initial"

    fx.Write("file1.txt", "two\n")
    fx.Stage [ "file1.txt" ]

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(0, code)
    Assert.Contains("Running gate q-glob", out)

[<Fact>]
let ``route matches a glob using a negated character class`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "class-glob"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      pre-push: { scope: affected-file-type, glob: \"f[!0-9]le.txt\" }\n"
        )
    )

    fx.Write("file.txt", "one\n")
    fx.Stage [ "repo-config.yml"; "file.txt" ]
    fx.Commit "initial"

    fx.Write("file.txt", "two\n")
    fx.Stage [ "file.txt" ]

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(0, code)
    Assert.Contains("Running gate class-glob", out)

// ---------------------------------------------------------------------------
// isExcluded — exact-match and directory-prefix exclusions
// ---------------------------------------------------------------------------

[<Fact>]
let ``route excludes tracked paths by exact match and by directory prefix`` () =
    // `exclude` is a gate-level `args` entry (`Gate.fs`'s `matchingFiles` call
    // site reads it from `gate.Args`), not a per-surface `scope` key — a
    // `surfaces.<surface>.exclude` key like an earlier version of this test
    // declared is silently ignored by `RepoConfig`'s
    // `IgnoreUnmatchedProperties` deserializer, so `isExcluded` never actually
    // ran with a non-empty exclude list.
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "exclude-check"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      pre-push: { scope: all-file-type, glob: \"**/*\" }\n"
            + "    args:\n      exclude: [\"scripts\", \"notes.md\"]\n"
        )
    )

    fx.Write("scripts/tool.sh", "#!/bin/sh\n")
    fx.Write("notes.md", "notes\n")
    fx.Write("src/main.py", "print(1)\n")
    fx.Stage [ "repo-config.yml"; "scripts/tool.sh"; "notes.md"; "src/main.py" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(0, code)
    Assert.Contains("Running gate exclude-check", out)

// ---------------------------------------------------------------------------
// git-subprocess failures reached through a repository with no `.git`, or
// whose `.git` a mutation gate itself destroys
// ---------------------------------------------------------------------------

[<Fact>]
let ``route reports a git failure when pre-commit staged-file candidates cannot be read`` () =
    let dir =
        Path.Combine(Path.GetTempPath(), "rhino-cli-waveef-gate-nongit-staged-" + Guid.NewGuid().ToString("N"))

    Directory.CreateDirectory dir |> ignore

    File.WriteAllText(
        Path.Combine(dir, "repo-config.yml"),
        config (
            gate
                "staged-check"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      pre-commit: { scope: affected-file-type, glob: \"*.md\" }\n"
        )
    )

    let code, _, err =
        runCaptured (okRoot dir) [| "gate"; "run"; "--surface=pre-commit" |]

    Assert.Equal(1, code)
    Assert.Contains("git diff --cached --name-only failed", err)

[<Fact>]
let ``route reports a git failure when tracked-file candidates cannot be read`` () =
    let dir =
        Path.Combine(Path.GetTempPath(), "rhino-cli-waveef-gate-nongit-tracked-" + Guid.NewGuid().ToString("N"))

    Directory.CreateDirectory dir |> ignore

    File.WriteAllText(
        Path.Combine(dir, "repo-config.yml"),
        config (
            gate
                "tracked-check"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      pre-push: { scope: all-file-type, glob: \"**/*.md\" }\n"
        )
    )

    let code, _, err =
        runCaptured (okRoot dir) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(1, code)
    Assert.Contains("git ls-files failed", err)

[<Fact>]
let ``route reports a git failure when a restaging gate's pre-mutation snapshot cannot be captured`` () =
    let dir =
        Path.Combine(Path.GetTempPath(), "rhino-cli-waveef-gate-nongit-restage-" + Guid.NewGuid().ToString("N"))

    Directory.CreateDirectory dir |> ignore

    File.WriteAllText(
        Path.Combine(dir, "repo-config.yml"),
        config (
            "  - id: restage-check\n    type: mutation\n    command: sh -c 'exit 0'\n    kind: external\n    restages: true\n    surfaces:\n      pre-push: { scope: other }\n"
        )
    )

    let code, _, err =
        runCaptured (okRoot dir) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(1, code)
    Assert.Contains("git [\"diff\"; \"--name-only\"] failed", err)

[<Fact>]
let ``route reports a git failure when a restaging gate's own mutation destroys the Git repository`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            "  - id: destroy-git\n    type: mutation\n    command: rm -rf .git\n    kind: external\n    restages: true\n    surfaces:\n      pre-push: { scope: other }\n"
        )
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, out, err =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(1, code)
    Assert.Contains("Running gate destroy-git", out)
    Assert.Contains("git [\"diff\"; \"--name-only\"] failed", err)

[<Fact>]
let ``route reuses a prior restaging gate's snapshot for a second restaging gate`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            "  - id: mutating-one\n    type: mutation\n    command: touch generated1.txt\n    kind: external\n    restages: true\n    surfaces:\n      pre-push: { scope: other }\n"
            + "  - id: mutating-two\n    type: mutation\n    command: touch generated2.txt\n    kind: external\n    restages: true\n    surfaces:\n      pre-push: { scope: other }\n"
        )
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(0, code)
    Assert.Contains("Running gate mutating-one", out)
    Assert.Contains("Running gate mutating-two", out)
    Assert.True(File.Exists(Path.Combine(fx.Root, "generated1.txt")))
    Assert.True(File.Exists(Path.Combine(fx.Root, "generated2.txt")))

    let staged =
        (runProcess "git" [ "diff"; "--cached"; "--name-only" ] fx.Root [ "GIT_DIR", Path.Combine(fx.Root, ".git") ])
            .Stdout

    Assert.Contains("generated1.txt", staged)
    Assert.Contains("generated2.txt", staged)

// ---------------------------------------------------------------------------
// retainExistingPaths / isPreCommitBatchEligible — a matching pre-commit
// mutation gate that is not lint-staged eligible
// ---------------------------------------------------------------------------

[<Fact>]
let ``route runs a pre-commit affected-file-type mutation gate that is not lint-staged eligible`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            "  - id: custom-mutation\n    type: mutation\n    command: sh -c 'exit 0'\n    kind: external\n    surfaces:\n      pre-commit: { scope: affected-file-type, glob: \"*.txt\" }\n"
        )
    )

    fx.Write("notes.txt", "one\n")
    fx.Stage [ "repo-config.yml"; "notes.txt" ]
    fx.Commit "initial"

    fx.Write("notes.txt", "two\n")
    fx.Stage [ "notes.txt" ]

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-commit" |]

    Assert.Equal(0, code)
    Assert.Contains("Running gate custom-mutation", out)
    Assert.DoesNotContain("Running lint-staged batch", out)

// ---------------------------------------------------------------------------
// changedPaths' commit-msg fallback (`| _ -> Ok []`)
// ---------------------------------------------------------------------------

[<Fact>]
let ``route treats commit-msg as having no changed-path candidates for a path-gated gate`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "commit-msg-path-gated"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      commit-msg:\n        scope: path-gated\n        trigger:\n          - docs/\n"
        )
    )

    fx.Write("msg.txt", "a commit message\n")
    fx.Stage [ "repo-config.yml"; "msg.txt" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured
            (okRoot fx.Root)
            [| "gate"
               "run"
               "--surface=commit-msg"
               "--"
               Path.Combine(fx.Root, "msg.txt") |]

    Assert.Equal(0, code)
    Assert.DoesNotContain("Running gate commit-msg-path-gated", out)

// ---------------------------------------------------------------------------
// `gate run` top-level errors — unknown surface, registry semantic findings
// ---------------------------------------------------------------------------

[<Fact>]
let ``route reports an unknown gate run surface`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, _, err =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=bogus" |]

    Assert.Equal(1, code)
    Assert.Contains("unknown gate surface \"bogus\"", err)

[<Fact>]
let ``route reports a registry semantic finding before running any gate`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (gate "BadID" "check" "sh -c 'exit 0'" "external" "      pre-push: { scope: other }\n")
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, out, err =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(1, code)
    Assert.Contains("must be non-empty lowercase kebab-case", out)
    Assert.Contains("registry semantic finding(s)", err)

// ---------------------------------------------------------------------------
// runRhinoCliLeaf / runExternalLeaf — empty commands, and a real rhino-cli
// -kind leaf spawning the current executable
// ---------------------------------------------------------------------------

[<Fact>]
let ``route reports an empty command for a rhino-cli-kind gate`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (gate "rhino-empty" "check" "\"\"" "rhino-cli" "      pre-push: { scope: other }\n")
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, out, err =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(1, code)
    Assert.Contains("Running gate rhino-empty", out)
    Assert.Contains("gate command cannot be empty", err)

[<Fact>]
let ``route runs a rhino-cli-kind gate by spawning the current executable`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (gate "rhino-version" "check" "--version" "rhino-cli" "      pre-push: { scope: other }\n")
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let _, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Contains("Running gate rhino-version", out)

[<Fact>]
let ``route reports an empty command for an external-kind gate`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (gate "external-empty" "check" "\"   \"" "external" "      pre-push: { scope: other }\n")
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, _, err =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(1, code)
    Assert.Contains("external gate command cannot be empty", err)

// ---------------------------------------------------------------------------
// all-file-type scope declared without a glob — matches unconditionally
// ---------------------------------------------------------------------------

[<Fact>]
let ``route runs an all-file-type gate declared without a glob unconditionally`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (gate "no-glob-check" "check" "sh -c 'exit 0'" "external" "      pre-push: { scope: all-file-type }\n")
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(0, code)
    Assert.Contains("Running gate no-glob-check", out)

// ---------------------------------------------------------------------------
// `mergeBasePaths`' real-merge-base branch — a disposable fixture normally
// has no `origin/main` ref at all (exercising only the "no merge base,
// fall back to staged paths" branch already covered above), so this test
// fabricates one via `git update-ref` to reach the branch that actually
// calls `changedPathsFromBase`
// ---------------------------------------------------------------------------

[<Fact>]
let ``route resolves changed paths through a real origin/main merge base`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "path-gated-check"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      pre-push:\n        scope: path-gated\n        trigger:\n          - docs/\n"
        )
    )

    fx.Write("docs/a.md", "# A\n")
    fx.Stage [ "repo-config.yml"; "docs/a.md" ]
    fx.Commit "initial"

    let headSha =
        (runProcess "git" [ "rev-parse"; "HEAD" ] fx.Root [ "GIT_DIR", Path.Combine(fx.Root, ".git") ]).Stdout.Trim()

    let updateRef =
        runProcess
            "git"
            [ "update-ref"; "refs/remotes/origin/main"; headSha ]
            fx.Root
            [ "GIT_DIR", Path.Combine(fx.Root, ".git") ]

    Assert.Equal(0, updateRef.ExitCode)

    fx.Write("docs/a.md", "# A changed\n")
    fx.Stage [ "docs/a.md" ]
    fx.Commit "second"

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(0, code)
    Assert.Contains("Running gate path-gated-check", out)

// ---------------------------------------------------------------------------
// Individually-forced `git` subprocess failures via a shim `git` binary that
// fails one exact subcommand invocation and forwards every other call to the
// real binary — a whole-PATH "git is missing" trick cannot isolate a single
// call the way these tests need to
// ---------------------------------------------------------------------------

[<Fact>]
let ``route reports a git failure when a restaging gate's untracked-file scan fails`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            "  - id: restage-check\n    type: mutation\n    command: sh -c 'exit 0'\n    kind: external\n    restages: true\n    surfaces:\n      pre-push: { scope: other }\n"
        )
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let shimDir =
        Path.Combine(Path.GetTempPath(), "rhino-cli-waveef-gate-shim-lsfiles-" + Guid.NewGuid().ToString("N"))

    writeGitShim
        shimDir
        "if [ \"$1\" = \"ls-files\" ] && [ \"$2\" = \"--others\" ] && [ \"$3\" = \"--exclude-standard\" ]; then exit 1; fi"

    let code, out, err =
        withPathPrepended shimDir (fun () -> runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |])

    Assert.Equal(1, code)
    Assert.Contains("Running gate restage-check", out)
    Assert.Contains("git [\"ls-files\"; \"--others\"; \"--exclude-standard\"] failed", err)

[<Fact>]
let ``route reports a git failure when the explicit GATE_CHANGED_BASE diff itself fails`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "ci-path-gated"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      ci:\n        scope: path-gated\n        trigger:\n          - docs/\n"
        )
    )

    fx.Write("docs/a.md", "# A\n")
    fx.Stage [ "repo-config.yml"; "docs/a.md" ]
    fx.Commit "first"

    fx.Write("docs/a.md", "# A changed\n")
    fx.Stage [ "docs/a.md" ]
    fx.Commit "second"

    let firstSha =
        (runProcess "git" [ "rev-parse"; "HEAD~1" ] fx.Root [ "GIT_DIR", Path.Combine(fx.Root, ".git") ]).Stdout.Trim()

    let shimDir =
        Path.Combine(Path.GetTempPath(), "rhino-cli-waveef-gate-shim-cidiff-" + Guid.NewGuid().ToString("N"))

    writeGitShim
        shimDir
        (sprintf
            "if [ \"$1\" = \"diff\" ] && [ \"$2\" = \"--name-only\" ] && [ \"$3\" = \"%s\" ] && [ \"$4\" = \"HEAD\" ]; then exit 1; fi"
            firstSha)

    let previousBase = Environment.GetEnvironmentVariable "GATE_CHANGED_BASE"

    try
        Environment.SetEnvironmentVariable("GATE_CHANGED_BASE", firstSha)

        let code, _, err =
            withPathPrepended shimDir (fun () -> runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=ci" |])

        Assert.Equal(1, code)
        Assert.Contains("git diff from GATE_CHANGED_BASE to HEAD failed", err)
    finally
        Environment.SetEnvironmentVariable("GATE_CHANGED_BASE", previousBase)

// ---------------------------------------------------------------------------
// `restageMutationOutputs` — an empty output delta, and a `git add` failure
// forced by a stale `.git/index.lock` (present before `gate run` starts, so
// every read-only `diff`/`ls-files` call still succeeds and only the later
// index-writing `git add` fails)
// ---------------------------------------------------------------------------

[<Fact>]
let ``route restages nothing when a restaging gate produces no new output`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            "  - id: no-output-restage\n    type: mutation\n    command: sh -c 'exit 0'\n    kind: external\n    restages: true\n    surfaces:\n      pre-push: { scope: other }\n"
        )
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let code, out, _ =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(0, code)
    Assert.Contains("Running gate no-output-restage", out)

[<Fact>]
let ``route reports a git failure when restaging a mutation gate's output cannot be added`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            "  - id: mutating-check\n    type: mutation\n    command: touch generated.txt\n    kind: external\n    restages: true\n    surfaces:\n      pre-push: { scope: other }\n"
        )
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    File.WriteAllText(Path.Combine(fx.Root, ".git", "index.lock"), "")

    let code, out, err =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |]

    Assert.Equal(1, code)
    Assert.Contains("Running gate mutating-check", out)
    Assert.Contains("git add mutation outputs failed", err)

// ---------------------------------------------------------------------------
// `runNxLeaf` / `runLeaf`'s `Nx` branch — a `kind: nx` gate must declare
// either `all-projects` or `affected-projects` scope (registry validation
// rejects every other scope for that kind), so those are the only two
// `ScopeKind` values `runNxLeaf` is ever actually invoked with
// ---------------------------------------------------------------------------

[<Fact>]
let ``route runs nx-kind gates for both all-projects and affected-projects scopes`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate "nx-all" "check" "target-a" "nx" "      pre-push: { scope: all-projects }\n"
            + gate "nx-affected" "check" "target-b" "nx" "      pre-push: { scope: affected-projects }\n"
        )
    )

    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let codeAll, outAll, errAll =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push"; "--only=nx-all" |]

    Assert.Equal(1, codeAll)
    Assert.Contains("Running gate nx-all", outAll)
    Assert.Contains("gate nx-all failed", errAll)

    let codeAffected, outAffected, errAffected =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push"; "--only=nx-affected" |]

    Assert.Equal(1, codeAffected)
    Assert.Contains("Running gate nx-affected", outAffected)
    Assert.Contains("gate nx-affected failed", errAffected)

// ---------------------------------------------------------------------------
// `runLintStagedBatch` — the batch's own write/invocation/failure lines
// (843, 845, 848 in `Gate.fs`) and the `loop`'s first-invocation call site
// (1085-1086). The batch's *success* branch (846) and the
// "batch already ran, skip" branch (1082-1083, reached only once a prior
// batch invocation in the same run has succeeded) both require
// `npx --no -- lint-staged` to actually succeed, which needs a real,
// installed `lint-staged` reachable from this disposable fixture's cwd —
// per this file's module doc comment and the sandbox's offline `npx --no`
// behaviour, that is not reproducible here, so those branches are not
// covered by this test.
// ---------------------------------------------------------------------------

[<Fact>]
let ``route runs the lint-staged batch for an eligible pre-commit gate and surfaces its failure`` () =
    let fx = GitFixture()
    fx.Init()

    fx.Write(
        "repo-config.yml",
        config (
            gate
                "md-check"
                "check"
                "sh -c 'exit 0'"
                "external"
                "      pre-commit: { scope: affected-file-type, glob: \"*.md\" }\n"
        )
    )

    fx.Write("a.md", "one\n")
    fx.Stage [ "repo-config.yml"; "a.md" ]
    fx.Commit "initial"

    fx.Write("a.md", "two\n")
    fx.Stage [ "a.md" ]

    let code, out, err =
        runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-commit" |]

    Assert.Equal(1, code)
    Assert.Contains("Running lint-staged batch", out)
    Assert.Contains("lint-staged batch failed", err)

// ---------------------------------------------------------------------------
// `externalCommandPath`'s empty-inherited-`PATH` branch (line 769) — the
// branch itself always runs before the child `sh` process ever starts, so
// it is exercised regardless of what happens next; with `PATH` completely
// empty, .NET cannot resolve `sh` itself and `Process.Start` throws rather
// than returning a graceful `Result.Error` (`runInherited` has no
// try/catch), so this test asserts the actual current behaviour.
// ---------------------------------------------------------------------------

[<Fact>]
let ``route throws when PATH is completely empty for an external gate's shell invocation`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let originalPath = Environment.GetEnvironmentVariable "PATH"

    try
        Environment.SetEnvironmentVariable("PATH", "")

        Assert.Throws<System.ComponentModel.Win32Exception>(fun () ->
            runCaptured (okRoot fx.Root) [| "gate"; "run"; "--surface=pre-push" |] |> ignore)
        |> ignore
    finally
        Environment.SetEnvironmentVariable("PATH", originalPath)

// ---------------------------------------------------------------------------
// Direct calls to the public wrapper entry points — never reached through
// `route`/`Dispatch`, which always calls `runAtRootWithOnlyAndMessageFile`
// ---------------------------------------------------------------------------

[<Fact>]
let ``runAtRoot runs gates declared on a surface directly`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let output = Text.StringBuilder()

    match RhinoCli.Cli.Gate.runAtRoot fx.Root "pre-push" (fun s -> output.Append(s: string) |> ignore) with
    | Ok() -> Assert.Contains("Running gate always-runs", output.ToString())
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``runAtRootWithOnly runs a single named gate directly`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", alwaysRunsConfig)
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let output = Text.StringBuilder()

    match
        RhinoCli.Cli.Gate.runAtRootWithOnly fx.Root "pre-push" (Some "always-runs") (fun s ->
            output.Append(s: string) |> ignore)
    with
    | Ok() -> Assert.Contains("Running gate always-runs", output.ToString())
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``runAtRootWithGroup runs every gate in a declared group directly`` () =
    let fx = GitFixture()
    fx.Init()
    fx.Write("repo-config.yml", groupedConfig "sh -c 'exit 0'")
    fx.Stage [ "repo-config.yml" ]
    fx.Commit "initial"

    let output = Text.StringBuilder()

    match
        RhinoCli.Cli.Gate.runAtRootWithGroup fx.Root "pre-push" "my-group" (fun s -> output.Append(s: string) |> ignore)
    with
    | Ok() ->
        Assert.Contains("group-a\tPASS", output.ToString())
        Assert.Contains("group-b\tPASS", output.ToString())
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

// ---------------------------------------------------------------------------
// `gate validate` — direct calls to `Gate.validateAtRoot`. This chain never
// touches Git, so a plain temp directory (no GitFixture) is enough.
// ---------------------------------------------------------------------------

let private newPlainFixture () : string =
    let dir =
        Path.Combine(Path.GetTempPath(), "rhino-cli-waveef-gate-validate-" + Guid.NewGuid().ToString("N"))

    Directory.CreateDirectory dir |> ignore
    dir

let private writeAt (root: string) (relative: string) (contents: string) =
    let path = Path.Combine(root, relative)
    Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore
    File.WriteAllText(path, contents)

let private makeExecutableAt (root: string) (relative: string) =
    File.SetUnixFileMode(
        Path.Combine(root, relative),
        UnixFileMode.UserRead
        ||| UnixFileMode.UserWrite
        ||| UnixFileMode.UserExecute
        ||| UnixFileMode.GroupRead
        ||| UnixFileMode.GroupExecute
        ||| UnixFileMode.OtherRead
        ||| UnixFileMode.OtherExecute
    )

let private soloCiGateConfig =
    config (
        gate "known-check" "check" "known-check" "external" "      ci: { scope: affected-projects }\n"
        + "    ci-group: fixture-group\n"
    )

[<Fact>]
let ``validateAtRoot rejects a verifies link to a gate that is not a formatter mutation`` () =
    let root = newPlainFixture ()

    writeAt
        root
        "repo-config.yml"
        (config (
            gate "verify-x" "check" "check-x" "external" "      commit-msg: { scope: other }\n"
            + "    verifies: target-x\n"
            + gate "target-x" "check" "check-target" "external" "      commit-msg: { scope: other }\n"
        ))

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> Assert.Fail("expected Error for a verifies link to a non-formatter-mutation gate")
    | Error message -> Assert.Contains("must link a check to a formatter mutation", message)

[<Fact>]
let ``validateAtRoot rejects a missing local-hook shim file`` () =
    let root = newPlainFixture ()

    writeAt
        root
        "repo-config.yml"
        (config (gate "solo-hook" "check" "solo-check" "external" "      commit-msg: { scope: other }\n"))

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> Assert.Fail("expected Error for a missing .husky/commit-msg shim")
    | Error message -> Assert.Contains("must be executable and invoke ./rhino gate run --surface commit-msg", message)

[<Fact>]
let ``validateAtRoot treats an empty CI workflow document as declaring no jobs`` () =
    let root = newPlainFixture ()
    writeAt root "repo-config.yml" soloCiGateConfig
    writeAt root ".github/workflows/pr-quality-gate.yml" ""

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> Assert.Fail("expected Error for an empty CI workflow document")
    | Error message -> Assert.Contains("must declare at least one job for declared CI gates", message)

[<Fact>]
let ``validateAtRoot treats a non-mapping CI workflow root as declaring no jobs`` () =
    let root = newPlainFixture ()
    writeAt root "repo-config.yml" soloCiGateConfig
    writeAt root ".github/workflows/pr-quality-gate.yml" "- just\n- a\n- list\n"

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> Assert.Fail("expected Error for a non-mapping CI workflow root")
    | Error message -> Assert.Contains("must declare at least one job for declared CI gates", message)

[<Fact>]
let ``validateAtRoot treats a non-mapping jobs key as declaring no jobs`` () =
    let root = newPlainFixture ()
    writeAt root "repo-config.yml" soloCiGateConfig
    writeAt root ".github/workflows/pr-quality-gate.yml" "jobs: not-a-mapping\n"

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> Assert.Fail("expected Error for a non-mapping jobs key")
    | Error message -> Assert.Contains("must declare at least one job for declared CI gates", message)

[<Fact>]
let ``validateAtRoot tolerates a non-sequence steps list and a non-scalar run body while still deriving no matrix jobs``
    ()
    =
    let root = newPlainFixture ()
    writeAt root "repo-config.yml" soloCiGateConfig

    writeAt
        root
        ".github/workflows/pr-quality-gate.yml"
        (String.concat
            ""
            [ "jobs:\n"
              "  weird-steps-job:\n    steps: not-a-list\n"
              "  weird-run-job:\n    steps:\n      - run:\n          nested: mapping\n" ])

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> Assert.Fail("expected Error for a CI workflow missing a derived gate matrix")
    | Error message -> Assert.Contains("must derive its gate matrix", message)

[<Fact>]
let ``validateAtRoot treats a malformed if template as not literally false`` () =
    let root = newPlainFixture ()

    writeAt
        root
        "repo-config.yml"
        (config (
            gate "test-quick" "check" "test:quick" "nx" "      ci: { scope: affected-projects }\n"
            + "    wiring: hand-wired\n    ci-group: fixture-group\n"
        ))

    writeAt
        root
        ".github/workflows/pr-quality-gate.yml"
        (String.concat
            ""
            [ "jobs:\n"
              "  test-quick:\n    if: '${{ still-open'\n    steps:\n      - run: npx nx affected -t test:quick\n"
              "  quality-gate:\n    needs: [test-quick]\n" ])

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> ()
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``validateAtRoot reports a YAML parse failure in the CI workflow`` () =
    let root = newPlainFixture ()
    writeAt root "repo-config.yml" soloCiGateConfig
    writeAt root ".github/workflows/pr-quality-gate.yml" "jobs:\n  bad: [unclosed\n"

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> Assert.Fail("expected Error for unparsable CI workflow YAML")
    | Error message -> Assert.Contains("is not valid YAML", message)

[<Fact>]
let ``validateAtRoot rejects an unconditional full Doctor bootstrap in the CI workflow`` () =
    let root = newPlainFixture ()

    writeAt
        root
        "repo-config.yml"
        (config (
            gate "known-check" "check" "known-check" "external" "      ci: { scope: affected-projects }\n"
            + "    ci-group: fixture-group\n    doctor-tools: [git]\n"
        ))

    writeAt
        root
        ".github/workflows/pr-quality-gate.yml"
        (String.concat
            ""
            [ "jobs:\n"
              "  build-rhino:\n    steps:\n      - uses: actions/upload-artifact@v4\n      - run: npm run doctor -- --fix\n"
              "  enumerate:\n    needs: build-rhino\n    steps:\n      - run: rhino-cli gate list --surface=ci --format=json --by-group\n"
              "  gate:\n    needs: [build-rhino, enumerate]\n    strategy:\n      matrix:\n        group: '${{ fromJson(needs.enumerate.outputs.groups) }}'\n    steps:\n      - run: ./rhino gate run --surface ci -- --group=\"$GROUP_ID\"\n        env:\n          GROUP_ID: ${{ matrix.group.group }}\n"
              "  quality-gate:\n    needs: [build-rhino, enumerate, gate]\n    steps:\n      - run: echo done\n" ])

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> Assert.Fail("expected Error for an unconditional full Doctor bootstrap")
    | Error message -> Assert.Contains("must not run an unconditional full Doctor bootstrap", message)

[<Fact>]
let ``validateAtRoot accepts a literal --only selector naming a declared CI gate`` () =
    let root = newPlainFixture ()

    writeAt
        root
        "repo-config.yml"
        (config (
            gate "known-check" "check" "known-check" "external" "      ci: { scope: affected-projects }\n"
            + "    ci-group: fixture-group\n"
        ))

    writeAt
        root
        ".github/workflows/pr-quality-gate.yml"
        (String.concat
            ""
            [ "jobs:\n"
              "  build-rhino:\n    steps:\n      - uses: actions/upload-artifact@v4\n"
              "  enumerate:\n    needs: build-rhino\n    steps:\n      - run: rhino-cli gate list --surface=ci --format=json --by-group\n"
              "  gate:\n    needs: [build-rhino, enumerate]\n    strategy:\n      matrix:\n        group: '${{ fromJson(needs.enumerate.outputs.groups) }}'\n    steps:\n      - run: ./rhino gate run --surface ci -- --group=\"$GROUP_ID\"\n        env:\n          GROUP_ID: ${{ matrix.group.group }}\n"
              "  quality-gate:\n    needs: [build-rhino, enumerate, gate]\n    steps:\n      - run: rhino-cli gate run --surface=ci --only=known-check\n" ])

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> ()
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``validateAtRoot rejects a hand-wired CI gate when the CI workflow has no quality-gate job`` () =
    let root = newPlainFixture ()

    writeAt
        root
        "repo-config.yml"
        (config (
            gate "solo-quick" "check" "test:quick" "nx" "      ci: { scope: affected-projects }\n"
            + "    wiring: hand-wired\n    ci-group: fixture-group\n"
        ))

    writeAt
        root
        ".github/workflows/pr-quality-gate.yml"
        "jobs:\n  build-rhino:\n    steps:\n      - uses: actions/upload-artifact@v4\n"

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> Assert.Fail("expected Error for a missing quality-gate job")
    | Error message -> Assert.Contains("must declare a quality-gate job for hand-wired CI gates", message)

[<Fact>]
let ``validateAtRoot rejects a hand-wired CI gate whose matching job is missing from quality-gate's dependencies`` () =
    let root = newPlainFixture ()

    writeAt
        root
        "repo-config.yml"
        (config (
            gate "test-quick" "check" "test:quick" "nx" "      ci: { scope: affected-projects }\n"
            + "    wiring: hand-wired\n    ci-group: fixture-group\n"
        ))

    writeAt
        root
        ".github/workflows/pr-quality-gate.yml"
        (String.concat
            ""
            [ "jobs:\n"
              "  enumerate:\n    steps:\n      - run: rhino-cli gate list --surface=ci --format=json\n"
              "  gate:\n    needs: enumerate\n    strategy:\n      matrix:\n        gate: '${{ fromJson(needs.enumerate.outputs.gates) }}'\n    steps:\n      - run: rhino-cli gate run --surface=ci --only=\"$GATE_ID\"\n        env:\n          GATE_ID: ${{ matrix.gate.id }}\n"
              "  no-target-job:\n    steps:\n      - run: npx nx affected\n"
              "  test-quick:\n    steps:\n      - run: npx nx affected -t test:quick\n"
              "  quality-gate:\n    needs: [enumerate, gate]\n" ])

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> Assert.Fail("expected Error for an unaggregated hand-wired job")
    | Error message -> Assert.Contains("must be direct quality-gate dependencies", message)

[<Fact>]
let ``validateAtRoot rejects a declared CI gate with no CI workflow file at all`` () =
    let root = newPlainFixture ()
    writeAt root "repo-config.yml" soloCiGateConfig

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> Assert.Fail("expected Error for a missing CI workflow file")
    | Error message -> Assert.Contains("is required for declared CI gates: no such file at", message)

let private lintStagedEligibleConfig =
    config (
        gate
            "format-md"
            "mutation"
            "prettier --write"
            "external"
            "      pre-commit: { scope: affected-file-type, glob: \"*.md\" }\n"
        + "    category: formatter\n"
        + gate
            "check-md"
            "check"
            "prettier --check"
            "external"
            "      pre-commit: { scope: affected-file-type, glob: \"*.md\" }\n"
        + "    verifies: format-md\n    carve-out: staged-only\n"
    )

let private writeLintStagedFixture (root: string) =
    writeAt root "repo-config.yml" lintStagedEligibleConfig
    writeAt root ".husky/pre-commit" "#!/bin/sh\nexec ./rhino gate run --surface pre-commit\n"
    makeExecutableAt root ".husky/pre-commit"

[<Fact>]
let ``validateAtRoot rejects package.json when lint-staged is absent from an otherwise-valid file`` () =
    let root = newPlainFixture ()
    writeLintStagedFixture root
    writeAt root "package.json" "{}\n"

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> Assert.Fail("expected Error for package.json missing the lint-staged block")
    | Error message -> Assert.Contains("lint-staged differs from the gate registry", message)

[<Fact>]
let ``validateAtRoot accepts package.json when lint-staged exactly matches the derived registry projection`` () =
    let root = newPlainFixture ()
    writeLintStagedFixture root
    writeAt root "package.json" """{"lint-staged":{"*.md":["prettier --write","prettier --check"]}}"""

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> ()
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``validateAtRoot treats a non-object package.json as nothing to validate`` () =
    let root = newPlainFixture ()
    writeLintStagedFixture root
    writeAt root "package.json" "[]\n"

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> ()
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``validateAtRoot reports an unreadable package.json`` () =
    let root = newPlainFixture ()
    writeLintStagedFixture root
    writeAt root "package.json" "not valid json"

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> Assert.Fail("expected Error for malformed package.json")
    | Error message -> Assert.Contains("cannot read", message)

[<Fact>]
let ``validateAtRoot reports a repo-config load failure directly`` () =
    let root = newPlainFixture ()

    match RhinoCli.Cli.Gate.validateAtRoot root with
    | Ok() -> Assert.Fail("expected Error for a missing repo-config.yml")
    | Error message -> Assert.Contains("cannot read repo-config.yml", message)
