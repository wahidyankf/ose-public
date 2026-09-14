/// Plain xunit tests for `RhinoCli.Cli.Dispatch.route` — the argv router
/// wired into `RhinoCli.Program.Program.main`. `shadow-diff.sh` already
/// proves the routed leaves byte-match Rust against real repo data; these
/// tests pin `route`'s own argv-parsing and exit-code-mapping behaviour
/// (help scanning, unrecognized routes, repo-root/output-format error
/// branches) with `getRepoRoot` stubbed so no test depends on this
/// checkout's own state.
module RhinoCli.Tests.Integration.Steps.DispatchResourceTests

open System
open System.IO
open Xunit
open RhinoCli.Cli.Dispatch

let private newTempDir () =
    let dir =
        Path.Combine(Path.GetTempPath(), "rhino-cli-dispatch-unit-" + Guid.NewGuid().ToString("N"))

    Directory.CreateDirectory(dir) |> ignore
    dir

let private writeFile (root: string) (relativePath: string) (content: string) =
    let full = Path.Combine(root, relativePath)
    Directory.CreateDirectory(Path.GetDirectoryName(full)) |> ignore
    File.WriteAllText(full, content)

/// Delegated and split leaves start `./rhino` at the repository root before
/// any F# remainder; this stand-in exits with `exitCode` for every command.
let private stubRhino (root: string) (exitCode: int) =
    writeFile root "rhino" (sprintf "#!/bin/sh\nexit %d\n" exitCode)

    File.SetUnixFileMode(
        Path.Combine(root, "rhino"),
        UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute
    )

/// Runs `route`, capturing stdout/stderr around the call and restoring the
/// prior writers afterwards even if `route` throws.
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

let private runCapturedWithInput
    (input: string)
    (getRepoRoot: unit -> Result<string, string>)
    (argv: string[])
    : int * string * string =
    let originalIn = Console.In

    try
        use inputReader = new StringReader(input)
        Console.SetIn(inputReader)
        runCaptured getRepoRoot argv
    finally
        Console.SetIn(originalIn)

let private okRoot (root: string) () = Ok root
let private errRoot (message: string) () : Result<string, string> = Error message

// ---- help scanning ----

[<Fact>]
let ``route prints the canonical help text and exits 0 for bare -h`` () =
    let code, out, _ = runCaptured (errRoot "unused") [| "-h" |]
    Assert.Equal(0, code)
    Assert.Equal(RhinoCli.Cli.HelpText.Text, out)

[<Fact>]
let ``route prints help when --help trails a real subcommand`` () =
    let code, out, _ =
        runCaptured (errRoot "unused") [| "convention"; "emoji"; "validate"; "--help" |]

    Assert.Equal(0, code)
    Assert.Equal(RhinoCli.Cli.HelpText.Text, out)

// ---- unrecognized routes ----

[<Fact>]
let ``route exits 2 for an argv shape no flipped namespace recognizes`` () =
    let code, _, err = runCaptured (errRoot "unused") [| "md"; "validate" |]
    Assert.Equal(2, code)
    Assert.Contains("unrecognized or not-yet-routed invocation", err)

// ---- repo-root and output-format error branches ----

[<Fact>]
let ``route surfaces a repo-root lookup failure as exit 1`` () =
    let code, _, err =
        runCaptured (errRoot "not a git repo") [| "convention"; "audit" |]

    Assert.Equal(1, code)
    Assert.Contains("Error: failed to find git repository root: not a git repo", err)

[<Fact>]
let ``route rejects an unknown output format as exit 1`` () =
    let code, _, err =
        runCaptured (okRoot (newTempDir ())) [| "convention"; "audit"; "-o"; "xml" |]

    Assert.Equal(1, code)
    Assert.Contains("unknown output format", err)

// ---- convention license validate ----

[<Fact>]
let ``route reports PASSED when no apps or libs directories exist`` () =
    let root = newTempDir ()

    let code, out, _ =
        runCaptured (okRoot root) [| "convention"; "license"; "validate" |]

    Assert.Equal(0, code)
    Assert.Contains("LICENSE AUDIT PASSED", out)

[<Fact>]
let ``route reports FAILED and exit 1 for a missing LICENSE`` () =
    let root = newTempDir ()
    Directory.CreateDirectory(Path.Combine(root, "apps", "foo")) |> ignore

    let code, out, err =
        runCaptured (okRoot root) [| "convention"; "license"; "validate"; "-o"; "markdown" |]

    Assert.Equal(1, code)
    Assert.Contains("**FAILED**", out)
    Assert.Contains("Error: 1 license finding(s) found", err)

// ---- convention audit ----

[<Fact>]
let ``route passes convention audit when every member passes`` () =
    let root = newTempDir ()
    stubRhino root 0
    let code, out, _ = runCaptured (okRoot root) [| "convention"; "audit" |]
    Assert.Equal(0, code)
    Assert.Contains("CONVENTION AUDIT PASSED: all 2 validators passed", out)

[<Fact>]
let ``route fails convention audit and lists the failing member`` () =
    let root = newTempDir ()
    stubRhino root 0
    Directory.CreateDirectory(Path.Combine(root, "apps", "foo")) |> ignore
    let code, _, err = runCaptured (okRoot root) [| "convention"; "audit" |]
    Assert.Equal(1, code)
    Assert.Contains("CONVENTION AUDIT FAILED: 1 validator(s) reported failures", err)
    Assert.Contains("license: 1 license finding(s) found", err)
    Assert.Contains("Error: convention audit found 1 failure(s)", err)

[<Fact>]
let ``route passes convention audit when every member is skipped`` () =
    let root = newTempDir ()
    Directory.CreateDirectory(Path.Combine(root, "apps", "foo")) |> ignore

    let code, out, _ =
        runCaptured (okRoot root) [| "convention"; "audit"; "--skip"; "emoji"; "--skip"; "license" |]

    Assert.Equal(0, code)
    Assert.Contains("CONVENTION AUDIT PASSED: all 0 validators passed", out)

// ---- parity manifest generate / validate ----

[<Fact>]
let ``route surfaces a parity generate failure for a non-git repoRoot`` () =
    let root = newTempDir ()
    let code, _, err = runCaptured (okRoot root) [| "parity"; "manifest"; "generate" |]
    Assert.Equal(1, code)
    Assert.StartsWith("Error: ", err)

[<Fact>]
let ``route surfaces a parity validate failure for a non-git repoRoot`` () =
    let root = newTempDir ()
    let code, _, err = runCaptured (okRoot root) [| "parity"; "manifest"; "validate" |]
    Assert.Equal(1, code)
    Assert.StartsWith("Error: ", err)

// ---- repo-config validate ----

[<Fact>]
let ``route passes repo-config validate for a schema-clean fixture`` () =
    let root = newTempDir ()
    stubRhino root 0
    writeFile root "repo-config.yml" "harness:\n  - name: probe\n    tier: source\n"

    let code, out, _ = runCaptured (okRoot root) [| "repo-config"; "validate" |]

    Assert.Equal(0, code)
    Assert.Contains("matches the canonical schema", out)

[<Fact>]
let ``route fails repo-config validate and lists the finding`` () =
    let root = newTempDir ()
    stubRhino root 0

    writeFile
        root
        "repo-config.yml"
        "harness:\n  - name: probe\n    tier: source\n    ownership:\n      - { path: somewhere, class: vendored, reason: \"\" }\n"

    let code, out, err = runCaptured (okRoot root) [| "repo-config"; "validate" |]

    Assert.Equal(1, code)
    Assert.Contains("required non-empty value", out)
    Assert.Contains("Error: repo-config validate: 1 schema finding(s)", err)

[<Fact>]
let ``route surfaces a repo-config validate schema failure to stderr only`` () =
    let root = newTempDir ()
    stubRhino root 0
    writeFile root "repo-config.yml" "harness: \"not-a-list\"\n"

    let code, out, err = runCaptured (okRoot root) [| "repo-config"; "validate" |]

    Assert.Equal(1, code)
    Assert.Equal("", out)
    Assert.StartsWith("Error: repo-config validate: repo-config.yml failed strict schema deserialization", err)

// ---- env init ----

[<Fact>]
let ``route creates a env local file from a discovered example`` () =
    let root = newTempDir ()
    writeFile root "apps/foo/.env.example" "X=1\n"

    let code, out, _ = runCaptured (okRoot root) [| "env"; "init" |]

    Assert.Equal(0, code)
    Assert.Contains("Created: apps/foo/.env.local", out)
    Assert.True(File.Exists(Path.Combine(root, "apps", "foo", ".env.local")))

[<Fact>]
let ``route skips an existing env local file without --force`` () =
    let root = newTempDir ()
    writeFile root "apps/foo/.env.example" "X=1\n"
    writeFile root "apps/foo/.env.local" "X=0\n"

    let code, out, _ = runCaptured (okRoot root) [| "env"; "init" |]

    Assert.Equal(0, code)
    Assert.Contains("Skipped: apps/foo/.env.local", out)

// ---- env backup / env restore ----

[<Fact>]
let ``route backs up a discovered env file to --dir`` () =
    let root = newTempDir ()
    let backupDir = newTempDir ()
    writeFile root ".env" "SECRET=1\n"

    let code, out, _ =
        runCaptured (okRoot root) [| "env"; "backup"; "--dir"; backupDir |]

    Assert.Equal(0, code)
    Assert.Contains("Backup complete", out)
    Assert.True(File.Exists(Path.Combine(backupDir, ".env")))

[<Fact>]
let ``route restores a backed-up env file from --dir`` () =
    let root = newTempDir ()
    let backupDir = newTempDir ()
    writeFile backupDir ".env" "SECRET=1\n"

    let code, out, _ =
        runCaptured (okRoot root) [| "env"; "restore"; "--dir"; backupDir |]

    Assert.Equal(0, code)
    Assert.Contains("Restore complete", out)
    Assert.True(File.Exists(Path.Combine(root, ".env")))

[<Fact>]
let ``route surfaces a env restore failure for a missing backup dir`` () =
    let root = newTempDir ()
    let missingDir = Path.Combine(newTempDir (), "does-not-exist")

    let code, _, err =
        runCaptured (okRoot root) [| "env"; "restore"; "--dir"; missingDir |]

    Assert.Equal(1, code)
    Assert.Contains("backup dir does not exist", err)

// ---- env validate ----

[<Fact>]
let ``route passes env validate when the contract declares no surfaces`` () =
    let root = newTempDir ()
    writeFile root "repo-config.yml" "env-contract:\n  surfaces: []\n"

    let code, out, _ = runCaptured (okRoot root) [| "env"; "validate" |]

    Assert.Equal(0, code)
    Assert.Contains("no drift detected", out)

[<Fact>]
let ``route surfaces a env validate contract-load failure`` () =
    let root = newTempDir ()
    writeFile root "repo-config.yml" "harness: []\n"

    let code, _, err = runCaptured (okRoot root) [| "env"; "validate" |]

    Assert.Equal(1, code)
    Assert.Contains("env-contract: section missing", err)

[<Fact>]
let ``route fails env validate and lists a declared-but-unread finding`` () =
    let root = newTempDir ()

    writeFile
        root
        "repo-config.yml"
        "env-contract:\n  surfaces:\n    - root: surface\n      kind: app\n      lang: rust\n      allowlist: []\n"

    writeFile root "surface/.env.example" "UNREAD_KEY=some-value\n"
    writeFile root "surface/src/main.rs" "fn main() {}\n"

    let code, _, err = runCaptured (okRoot root) [| "env"; "validate" |]

    Assert.Equal(1, code)
    Assert.Contains("DRIFT  surface  declared-but-unread  UNREAD_KEY", err)
    Assert.Contains("Error: env validate: 1 finding(s)", err)

[<Fact>]
let ``route passes env validate in warn-only mode despite findings`` () =
    let root = newTempDir ()

    writeFile
        root
        "repo-config.yml"
        "env-contract:\n  surfaces:\n    - root: surface\n      kind: app\n      lang: rust\n      allowlist: []\n"

    writeFile root "surface/.env.example" "UNREAD_KEY=some-value\n"
    writeFile root "surface/src/main.rs" "fn main() {}\n"

    let code, _, err = runCaptured (okRoot root) [| "env"; "validate"; "--warn-only" |]

    Assert.Equal(0, code)
    Assert.Contains("warn-only mode, not failing", err)

// ---- env backup / env restore: worktree-aware, resolve-dir, json/markdown output ----

let private runGit (cwd: string) (args: string list) : unit =
    use proc = new Diagnostics.Process()
    proc.StartInfo.FileName <- "git"
    args |> List.iter proc.StartInfo.ArgumentList.Add
    proc.StartInfo.WorkingDirectory <- cwd
    proc.StartInfo.RedirectStandardOutput <- true
    proc.StartInfo.RedirectStandardError <- true
    proc.StartInfo.UseShellExecute <- false
    proc.StartInfo.EnvironmentVariables.Remove("GIT_DIR")
    proc.StartInfo.EnvironmentVariables.Remove("GIT_WORK_TREE")
    proc.Start() |> ignore
    let stderr = proc.StandardError.ReadToEnd()
    proc.WaitForExit()

    if proc.ExitCode <> 0 then
        failwithf "git %s failed in %s: %s" (String.concat " " args) cwd stderr

let private newGitRepoFixture () : string =
    let dir = newTempDir ()
    runGit dir [ "init"; "-q"; "-b"; "main" ]
    runGit dir [ "config"; "user.name"; "Rhino CLI Test" ]
    runGit dir [ "config"; "user.email"; "rhino-cli-test@example.invalid" ]
    dir

let private withHome (value: string option) (body: unit -> unit) =
    let original = Environment.GetEnvironmentVariable("HOME")

    try
        Environment.SetEnvironmentVariable("HOME", (value |> Option.defaultValue null))
        body ()
    finally
        Environment.SetEnvironmentVariable("HOME", original)

[<Fact>]
let ``route applies --worktree-aware for env backup at a real git root`` () =
    let root = newGitRepoFixture ()
    let backupDir = newTempDir ()
    writeFile root ".env" "SECRET=1\n"

    let code, out, _ =
        runCaptured (okRoot root) [| "env"; "backup"; "--dir"; backupDir; "--worktree-aware" |]

    Assert.Equal(0, code)
    Assert.Contains("Backup complete", out)

[<Fact>]
let ``route surfaces a env backup worktree detection failure`` () =
    let root = newTempDir ()
    let backupDir = newTempDir ()
    writeFile root ".env" "SECRET=1\n"

    let code, _, err =
        runCaptured (okRoot root) [| "env"; "backup"; "--dir"; backupDir; "--worktree-aware" |]

    Assert.Equal(1, code)
    Assert.Contains("worktree detection failed", err)

[<Fact>]
let ``route surfaces a env backup failure when --dir is inside the repo root`` () =
    let root = newTempDir ()
    writeFile root ".env" "SECRET=1\n"
    let insideDir = Path.Combine(root, "backup")

    let code, _, err =
        runCaptured (okRoot root) [| "env"; "backup"; "--dir"; insideDir |]

    Assert.Equal(1, code)
    Assert.Contains("is inside repo root", err)

[<Fact>]
let ``route surfaces a env backup resolve-dir failure when HOME is unset`` () =
    let root = newTempDir ()
    writeFile root ".env" "SECRET=1\n"

    withHome None (fun () ->
        let code, _, err = runCaptured (okRoot root) [| "env"; "backup" |]
        Assert.Equal(1, code)
        Assert.Contains("HOME not set", err))

[<Fact>]
let ``route surfaces a env restore resolve-dir failure when HOME is unset`` () =
    let root = newTempDir ()

    withHome None (fun () ->
        let code, _, err = runCaptured (okRoot root) [| "env"; "restore" |]
        Assert.Equal(1, code)
        Assert.Contains("HOME not set", err))

[<Fact>]
let ``route prints json output for env backup`` () =
    let root = newTempDir ()
    let backupDir = newTempDir ()
    writeFile root ".env" "SECRET=1\n"

    let code, out, _ =
        runCaptured (okRoot root) [| "env"; "backup"; "--dir"; backupDir; "-o"; "json" |]

    Assert.Equal(0, code)
    Assert.Contains("\"direction\": \"backup\"", out)

[<Fact>]
let ``route prints markdown output for env restore`` () =
    let root = newTempDir ()
    let backupDir = newTempDir ()
    writeFile backupDir ".env" "SECRET=1\n"

    let code, out, _ =
        runCaptured (okRoot root) [| "env"; "restore"; "--dir"; backupDir; "-o"; "markdown" |]

    Assert.Equal(0, code)
    Assert.Contains("## Restore Report", out)

// ---- env staged-guard validate ----

[<Fact>]
let ``route blocks env staged-guard validate when a real .env file is staged`` () =
    let root = newGitRepoFixture ()
    writeFile root ".env" "SECRET=1\n"
    runGit root [ "add"; ".env" ]

    let code, out, err =
        runCaptured (okRoot root) [| "env"; "staged-guard"; "validate" |]

    Assert.Equal(1, code)
    Assert.Contains(".env", out)
    Assert.Contains("offending .env file(s) staged", err)

[<Fact>]
let ``route passes env staged-guard validate when only .env.example is staged`` () =
    let root = newGitRepoFixture ()
    writeFile root ".env.example" "X=1\n"
    runGit root [ "add"; ".env.example" ]

    let code, _, _ = runCaptured (okRoot root) [| "env"; "staged-guard"; "validate" |]

    Assert.Equal(0, code)

[<Fact>]
let ``route surfaces a env staged-guard validate failure for a non-git repoRoot`` () =
    let root = newTempDir ()

    let code, _, err = runCaptured (okRoot root) [| "env"; "staged-guard"; "validate" |]

    Assert.Equal(1, code)
    Assert.StartsWith("Error: ", err)

// ---- doctor ----

[<Fact>]
let ``route rejects an unknown doctor tool selection before probing`` () =
    let root = newTempDir ()

    let code, _, err =
        runCaptured (okRoot root) [| "doctor"; "--tools"; "bogus-tool-xyz" |]

    Assert.Equal(1, code)
    Assert.Contains("Error: unknown Doctor tool", err)

[<Fact>]
let ``route reports doctor json output for a minimal-scope single-tool selection`` () =
    let root = newTempDir ()

    let code, out, _ =
        runCaptured (okRoot root) [| "doctor"; "-o"; "json"; "--scope"; "minimal"; "--tools"; "git" |]

    Assert.Equal(0, code)
    Assert.Contains("\"status\"", out)
    Assert.Contains("\"scope\": \"minimal\"", out)

[<Fact>]
let ``route reports doctor markdown output for a minimal-scope single-tool selection`` () =
    let root = newTempDir ()

    let code, out, _ =
        runCaptured (okRoot root) [| "doctor"; "-o"; "markdown"; "--scope"; "minimal"; "--tools"; "git" |]

    Assert.Equal(0, code)
    Assert.Contains("## Doctor Report", out)

[<Fact>]
let ``route reports doctor text output without a target-share section outside a git repository`` () =
    let root = newTempDir ()

    let code, out, _ =
        runCaptured (okRoot root) [| "doctor"; "--scope"; "minimal"; "--tools"; "git" |]

    Assert.Equal(0, code)
    Assert.DoesNotContain("Target-share:", out)

[<Fact>]
let ``route runs the target-share step against a real git repository root`` () =
    match RhinoCli.Infrastructure.GitRoot.findRoot () with
    | Error message -> Assert.Fail(sprintf "expected findRoot Ok, got Error %s" message)
    | Ok realRepoRoot ->
        let code, out, _ =
            runCaptured (okRoot realRepoRoot) [| "doctor"; "--scope"; "minimal"; "--tools"; "git" |]

        Assert.Equal(0, code)
        Assert.Contains("Target-share:", out)

[<Fact>]
let ``route runs doctor with no --tools selection at all`` () =
    let root = newTempDir ()

    let code, out, _ =
        runCaptured (okRoot root) [| "doctor"; "-o"; "json"; "--scope"; "minimal" |]

    Assert.True(code = 0 || code = 1, sprintf "expected exit 0 or 1, got %d" code)
    Assert.Contains("\"status\"", out)

[<Fact>]
let ``route runs doctor --fix --prune-cargo-cache --dry-run against a crate-free git repo`` () =
    // A fresh `git init` fixture has neither `apps/` nor `libs/`, so
    // `discoverCrates` finds zero crates — `Doctor.fixTargetShares` is then
    // a guaranteed no-op (nothing to symlink) and `pruneOrphans`/`sweepStale`
    // only ever look under this fixture's own never-before-seen repo-name
    // namespace in the shared cache, so this exercises the doctor `--fix` /
    // `--prune-cargo-cache` target-share wiring without mutating anything
    // outside this temp directory.
    let root = newGitRepoFixture ()

    let code, out, _ =
        runCaptured
            (okRoot root)
            [| "doctor"
               "--scope"
               "minimal"
               "--tools"
               "git"
               "--fix"
               "--prune-cargo-cache"
               "--dry-run" |]

    Assert.Equal(0, code)
    Assert.Contains("Target-share:", out)
    Assert.Contains("Target-share fix:", out)
    Assert.Contains("Nothing to fix", out)

// ---- test-coverage validate ----

[<Fact>]
let ``route reports the clap-style missing-arguments error for bare test-coverage validate`` () =
    let root = newTempDir ()
    let code, _, err = runCaptured (okRoot root) [| "test-coverage"; "validate" |]

    Assert.Equal(2, code)
    Assert.Contains("<COVERAGE_FILE>", err)
    Assert.Contains("<THRESHOLD>", err)
    Assert.Contains("Usage: rhino-cli test-coverage validate <COVERAGE_FILE> <THRESHOLD>", err)

[<Fact>]
let ``route echoes --help in the missing-arguments usage line`` () =
    let root = newTempDir ()

    let code, _, err =
        runCaptured (okRoot root) [| "test-coverage"; "validate"; "--help" |]

    Assert.Equal(2, code)
    Assert.Contains("Usage: rhino-cli test-coverage validate --help <COVERAGE_FILE> <THRESHOLD>", err)

[<Fact>]
let ``route echoes --output <OUTPUT> in the missing-arguments usage line`` () =
    let root = newTempDir ()

    let code, _, err =
        runCaptured (okRoot root) [| "test-coverage"; "validate"; "-o"; "json" |]

    Assert.Equal(2, code)
    Assert.Contains("Usage: rhino-cli test-coverage validate --output <OUTPUT> <COVERAGE_FILE> <THRESHOLD>", err)

[<Fact>]
let ``route echoes --verbose in the missing-arguments usage line`` () =
    let root = newTempDir ()
    let code, _, err = runCaptured (okRoot root) [| "test-coverage"; "validate"; "-v" |]

    Assert.Equal(2, code)
    Assert.Contains("Usage: rhino-cli test-coverage validate --verbose <COVERAGE_FILE> <THRESHOLD>", err)

[<Fact>]
let ``route echoes --quiet in the missing-arguments usage line`` () =
    let root = newTempDir ()
    let code, _, err = runCaptured (okRoot root) [| "test-coverage"; "validate"; "-q" |]

    Assert.Equal(2, code)
    Assert.Contains("Usage: rhino-cli test-coverage validate --quiet <COVERAGE_FILE> <THRESHOLD>", err)

[<Fact>]
let ``route echoes --no-color in the missing-arguments usage line`` () =
    let root = newTempDir ()

    let code, _, err =
        runCaptured (okRoot root) [| "test-coverage"; "validate"; "--no-color" |]

    Assert.Equal(2, code)
    Assert.Contains("Usage: rhino-cli test-coverage validate --no-color <COVERAGE_FILE> <THRESHOLD>", err)

[<Fact>]
let ``route reports only the missing threshold when the coverage file positional is already given`` () =
    let root = newTempDir ()

    let code, _, err =
        runCaptured (okRoot root) [| "test-coverage"; "validate"; "cover.out" |]

    Assert.Equal(2, code)
    Assert.DoesNotContain("  <COVERAGE_FILE>\n", err)
    Assert.Contains("  <THRESHOLD>\n", err)

[<Fact>]
let ``route surfaces a repo-root lookup failure for test-coverage validate`` () =
    let code, _, err =
        runCaptured (errRoot "boom") [| "test-coverage"; "validate"; "cover.out"; "50" |]

    Assert.Equal(1, code)
    Assert.Contains("Error: failed to find git repository root: boom", err)

[<Fact>]
let ``route rejects a non-numeric threshold`` () =
    let root = newTempDir ()
    writeFile root "cover.out" "mode: set\nfoo.go:1.1,2.2 1 1\n"

    let code, _, err =
        runCaptured (okRoot root) [| "test-coverage"; "validate"; "cover.out"; "not-a-number" |]

    Assert.Equal(1, code)
    Assert.Contains("Error: invalid threshold \"not-a-number\"", err)

[<Fact>]
let ``route surfaces a TestCoverage.validate error for a missing coverage file`` () =
    let root = newTempDir ()

    let code, _, err =
        runCaptured (okRoot root) [| "test-coverage"; "validate"; "does-not-exist.out"; "50" |]

    Assert.Equal(1, code)
    Assert.StartsWith("Error: ", err)

[<Fact>]
let ``route passes test-coverage validate text output for coverage at the threshold`` () =
    let root = newTempDir ()
    writeFile root "cover.out" "mode: set\nfoo.go:1.1,2.2 1 1\n"

    let code, out, _ =
        runCaptured (okRoot root) [| "test-coverage"; "validate"; "cover.out"; "50" |]

    Assert.Equal(0, code)
    Assert.Contains("100.00%", out)

[<Fact>]
let ``route passes test-coverage validate json output`` () =
    let root = newTempDir ()
    writeFile root "cover.out" "mode: set\nfoo.go:1.1,2.2 1 1\n"

    let code, out, _ =
        runCaptured (okRoot root) [| "test-coverage"; "validate"; "-o"; "json"; "cover.out"; "50" |]

    Assert.Equal(0, code)
    Assert.Contains("\"pct\"", out)

[<Fact>]
let ``route passes test-coverage validate markdown output`` () =
    let root = newTempDir ()
    writeFile root "cover.out" "mode: set\nfoo.go:1.1,2.2 1 1\n"

    let code, out, _ =
        runCaptured (okRoot root) [| "test-coverage"; "validate"; "-o"; "markdown"; "cover.out"; "50" |]

    Assert.Equal(0, code)
    Assert.Contains("## Coverage Report", out)

[<Fact>]
let ``route passes test-coverage validate with per-file and exclude flags`` () =
    let root = newTempDir ()
    writeFile root "cover.out" "mode: set\nfoo.go:1.1,2.2 1 1\nbar.go:1.1,2.2 1 1\n"

    let code, out, _ =
        runCaptured
            (okRoot root)
            [| "test-coverage"
               "validate"
               "--per-file"
               "--exclude"
               "nomatch/**"
               "cover.out"
               "50" |]

    Assert.Equal(0, code)
    Assert.Contains("100.00%", out)

[<Fact>]
let ``route passes test-coverage validate with a valid below-threshold filter`` () =
    let root = newTempDir ()
    writeFile root "cover.out" "mode: set\nfoo.go:1.1,2.2 1 1\n"

    let code, _, _ =
        runCaptured
            (okRoot root)
            [| "test-coverage"
               "validate"
               "--per-file"
               "--below-threshold"
               "10"
               "cover.out"
               "50" |]

    Assert.Equal(0, code)

[<Fact>]
let ``route ignores an unparseable below-threshold value`` () =
    let root = newTempDir ()
    writeFile root "cover.out" "mode: set\nfoo.go:1.1,2.2 1 1\n"

    let code, _, _ =
        runCaptured
            (okRoot root)
            [| "test-coverage"
               "validate"
               "--below-threshold"
               "not-a-number"
               "cover.out"
               "50" |]

    Assert.Equal(0, code)

[<Fact>]
let ``route fails test-coverage validate when coverage is below the threshold`` () =
    let root = newTempDir ()
    writeFile root "cover.out" "mode: set\nfoo.go:1.1,2.2 1 0\n"

    let code, _, err =
        runCaptured (okRoot root) [| "test-coverage"; "validate"; "cover.out"; "50" |]

    Assert.Equal(1, code)
    Assert.Contains("Error: coverage 0.00% is below threshold 50%", err)
    Assert.StartsWith("Error: ", err)

[<Fact>]
let ``route prints help for test-coverage validate when positionals are already satisfied`` () =
    let root = newTempDir ()
    writeFile root "cover.out" "mode: set\nfoo.go:1.1,2.2 1 1\n"

    let code, out, _ =
        runCaptured (okRoot root) [| "test-coverage"; "validate"; "cover.out"; "50"; "--help" |]

    Assert.Equal(0, code)
    Assert.Equal(RhinoCli.Cli.HelpText.Text, out)

[<Fact>]
let ``route rejects an unknown output format for test-coverage validate`` () =
    let root = newTempDir ()
    writeFile root "cover.out" "mode: set\nfoo.go:1.1,2.2 1 1\n"

    let code, _, err =
        runCaptured (okRoot root) [| "test-coverage"; "validate"; "cover.out"; "50"; "-o"; "xml" |]

    Assert.Equal(1, code)
    Assert.Contains("unknown output format", err)

// ---- output-format branches ----

[<Fact>]
let ``route accepts an explicit -o text on convention audit`` () =
    let root = newTempDir ()
    stubRhino root 0
    let code, _, _ = runCaptured (okRoot root) [| "convention"; "audit"; "-o"; "text" |]
    Assert.Equal(0, code)

[<Fact>]
let ``route accepts --format markdown on gate list`` () =
    let root = newTempDir ()
    writeFile root "repo-config.yml" "{}\n"

    let code, _, _ =
        runCaptured (okRoot root) [| "gate"; "list"; "--surface=pre-commit"; "--format=markdown" |]

    Assert.Equal(0, code)

[<Fact>]
let ``route surfaces an invalid --format value on gate list as exit 1`` () =
    let root = newTempDir ()
    writeFile root "repo-config.yml" "{}\n"

    let code, _, err =
        runCaptured (okRoot root) [| "gate"; "list"; "--surface=pre-commit"; "--format=bogus" |]

    Assert.Equal(1, code)
    Assert.Contains("unknown output format", err)

// ---- convention audit / emoji / license variants ----

[<Fact>]
let ``route resolves --skip after a preceding non-flag token on convention audit`` () =
    let root = newTempDir ()

    let code, _, _ =
        runCaptured (okRoot root) [| "convention"; "audit"; "-o"; "json"; "--skip"; "emoji" |]

    Assert.Equal(0, code)

[<Fact>]
let ``route renders JSON for a passing convention license validate`` () =
    let root = newTempDir ()

    let code, out, _ =
        runCaptured (okRoot root) [| "convention"; "license"; "validate"; "-o"; "json" |]

    Assert.Equal(0, code)
    Assert.Contains("\"status\": \"passed\"", out)

[<Fact>]
let ``route renders JSON for both members of a passing convention audit`` () =
    let root = newTempDir ()
    stubRhino root 0

    let code, out, _ =
        runCaptured (okRoot root) [| "convention"; "audit"; "-o"; "json" |]

    Assert.Equal(0, code)
    Assert.Contains("\"status\": \"passed\"", out)

[<Fact>]
let ``route reports a failing delegated emoji member inside convention audit`` () =
    let root = newTempDir ()
    stubRhino root 1
    let code, _, err = runCaptured (okRoot root) [| "convention"; "audit" |]
    Assert.Equal(1, code)
    Assert.Contains("emoji: ./rhino convention emoji validate exited 1", err)

// ---- parity manifest generate / validate round-trip ----

[<Fact>]
let ``route round-trips a parity manifest generate then validate against an empty boundary`` () =
    let root = newGitRepoFixture ()
    Directory.CreateDirectory(Path.Combine(root, "apps", "rhino-cli")) |> ignore

    let genCode, genOut, _ =
        runCaptured (okRoot root) [| "parity"; "manifest"; "generate" |]

    Assert.Equal(0, genCode)
    Assert.Contains("generated apps/rhino-cli/parity-manifest.sha256", genOut)

    runGit root [ "add"; "apps/rhino-cli/parity-manifest.sha256" ]

    let valCode, valOut, _ =
        runCaptured (okRoot root) [| "parity"; "manifest"; "validate" |]

    Assert.Equal(0, valCode)
    Assert.Contains("apps/rhino-cli/parity-manifest.sha256 is current", valOut)

// ---- env backup / restore / validate ----

[<Fact>]
let ``route surfaces a worktree-detection failure on env backup --worktree-aware`` () =
    let root = newTempDir ()

    let code, _, err =
        runCaptured (okRoot root) [| "env"; "backup"; "--worktree-aware"; "--dir"; Path.Combine(root, "backup") |]

    Assert.Equal(1, code)
    Assert.Contains("worktree detection failed: no .git found at", err)

[<Fact>]
let ``route surfaces a worktree-detection failure on env restore --worktree-aware`` () =
    let root = newTempDir ()

    let code, _, err =
        runCaptured
            (okRoot root)
            [| "env"
               "restore"
               "--worktree-aware"
               "--dir"
               Path.Combine(root, "backup") |]

    Assert.Equal(1, code)
    Assert.Contains("worktree detection failed: no .git found at", err)

[<Fact>]
let ``route surfaces an unsupported-lang error on env validate`` () =
    let root = newTempDir ()

    writeFile root "repo-config.yml" "env-contract:\n  surfaces:\n    - root: app\n      kind: app\n      lang: ruby\n"

    writeFile root "app/.env.example" ""

    let code, _, err = runCaptured (okRoot root) [| "env"; "validate" |]
    Assert.Equal(1, code)
    Assert.Contains("unsupported lang: ruby", err)

// ---- doctor ----

[<Fact>]
let ``route rejects every invalid name in a multi-value --tools list on doctor`` () =
    let root = newTempDir ()

    let code, _, err =
        runCaptured (okRoot root) [| "doctor"; "--tools"; "bogus-a,bogus-b" |]

    Assert.Equal(1, code)
    Assert.Contains("Error:", err)

// ---- md links / mermaid / heading-hierarchy / frontmatter / frontmatter-dates ----

[<Fact>]
let ``route falls back to the default --max-label-len on an unparsable value on md mermaid validate`` () =
    let root = newTempDir ()

    let code, _, _ =
        runCaptured (okRoot root) [| "md"; "mermaid"; "validate"; "--max-label-len"; "not-a-number" |]

    Assert.Equal(0, code)

[<Fact>]
let ``route reports a mermaid violation and its JSON kind for a too-long label`` () =
    let root = newTempDir ()

    writeFile root "docs/diagram.md" "```mermaid\nflowchart TD\n  A[This label is far longer than one character]\n```\n"

    let code, out, err =
        runCaptured (okRoot root) [| "md"; "mermaid"; "validate"; "-o"; "json" |]

    Assert.Equal(1, code)
    Assert.Contains("\"kind\"", out)
    Assert.Contains("violation(s)", err)

[<Fact>]
let ``route reports a Blocking frontmatter finding for a governance doc carrying a disallowed key`` () =
    let root = newTempDir ()
    stubRhino root 0
    writeFile root "repo-governance/conventions/example.md" "---\ntitle: T\ndescription: D\nwhen_to_use: W\n---\n"

    let code, _, err = runCaptured (okRoot root) [| "md"; "frontmatter"; "validate" |]

    Assert.Equal(1, code)
    Assert.Contains("frontmatter fail-level finding(s) found", err)

[<Fact>]
let ``route falls back past a registeredExcludesFor failure on md frontmatter-dates validate`` () =
    let root = newTempDir ()
    stubRhino root 0
    writeFile root "repo-config.yml" "harness:\n  - name: probe\n    bogus_key: true\n"

    let code, _, _ =
        runCaptured (okRoot root) [| "md"; "frontmatter-dates"; "validate" |]

    Assert.Equal(0, code)

// ---- governance word-budget / readme-index / rewrite-paths ----

[<Fact>]
let ``route surfaces a mergedBudgetConfig parse error on governance word-budget validate`` () =
    let root = newTempDir ()
    stubRhino root 0

    writeFile
        root
        "repo-config.yml"
        "harness:\n  - name: probe\n    bogus_key: true\ngovernance-word-budget:\n  bogus_key: true\n"

    let code, _, err =
        runCaptured (okRoot root) [| "governance"; "word-budget"; "validate" |]

    Assert.Equal(1, code)
    Assert.Contains("Error:", err)

[<Fact>]
let ``route resolves an absolute --paths entry on governance readme-index validate`` () =
    let root = newTempDir ()
    stubRhino root 0

    let code, _, _ =
        runCaptured (okRoot root) [| "governance"; "readme-index"; "validate"; "--paths"; root |]

    Assert.Equal(0, code)

[<Fact>]
let ``route reports a readme-index finding for a doc the README does not index`` () =
    let root = newTempDir ()
    stubRhino root 0
    writeFile root "docs/README.md" "# Docs\n"
    writeFile root "docs/orphan.md" "# Orphan\n"

    let code, _, err =
        runCaptured (okRoot root) [| "governance"; "readme-index"; "validate" |]

    Assert.Equal(1, code)
    Assert.Contains("readme-index finding(s) found", err)

[<Fact>]
let ``route resolves an absolute --paths entry on governance readme-index generate`` () =
    let root = newTempDir ()

    let code, _, _ =
        runCaptured (okRoot root) [| "governance"; "readme-index"; "generate"; "--paths"; root |]

    Assert.Equal(0, code)

[<Fact>]
let ``route rejects an unknown output format on governance readme-index rewrite-paths`` () =
    let root = newTempDir ()
    writeFile root "map.tsv" "old\tnew\n"

    let code, _, err =
        runCaptured
            (okRoot root)
            [| "governance"
               "readme-index"
               "rewrite-paths"
               "--map"
               Path.Combine(root, "map.tsv")
               "-o"
               "xml" |]

    Assert.Equal(1, code)
    Assert.Contains("unknown output format", err)

[<Fact>]
let ``route resolves an absolute --paths entry on governance readme-index rewrite-paths`` () =
    let root = newTempDir ()
    writeFile root "map.tsv" "old\tnew\n"

    let code, out, _ =
        runCaptured
            (okRoot root)
            [| "governance"
               "readme-index"
               "rewrite-paths"
               "--map"
               Path.Combine(root, "map.tsv")
               "--paths"
               root |]

    Assert.Equal(0, code)
    Assert.Contains("readme-index rewrite-paths:", out)

[<Fact>]
let ``route reports exit 0 for a git lockfile sync with nothing staged`` () =
    let root = newGitRepoFixture ()
    let code, _, _ = runCaptured (okRoot root) [| "git"; "lockfile"; "sync" |]
    Assert.Equal(0, code)

// ---- gate validate ----

[<Fact>]
let ``route reports exit 0 for gate validate against an empty gate registry`` () =
    let root = newTempDir ()
    writeFile root "repo-config.yml" "{}\n"
    let code, _, _ = runCaptured (okRoot root) [| "gate"; "validate" |]
    Assert.Equal(0, code)

// ---- repo-governance vendor / layer-coherence / traceability ----

[<Fact>]
let ``route reports a vendor-audit finding for a forbidden term at an absolute positional path`` () =
    let root = newTempDir ()
    writeFile root "notes.md" "Built with Anthropic tooling.\n"

    let code, _, err =
        runCaptured (okRoot root) [| "repo-governance"; "vendor"; "validate"; root |]

    Assert.Equal(1, code)
    Assert.Contains("violation(s) found", err)

[<Fact>]
let ``route reports a layer-coherence finding when repository-governance-architecture.md is absent`` () =
    let root = newTempDir ()

    let code, _, err =
        runCaptured (okRoot root) [| "repo-governance"; "layer-coherence"; "validate" |]

    Assert.Equal(1, code)
    Assert.Contains("layer-coherence finding(s) reported", err)

[<Fact>]
let ``route reports a traceability finding for a principles doc missing its vision-supported heading`` () =
    let root = newTempDir ()
    writeFile root "repo-governance/principles/foo.md" "# Foo\n\nBody text.\n"

    let code, _, err =
        runCaptured (okRoot root) [| "repo-governance"; "traceability"; "validate" |]

    Assert.Equal(1, code)
    Assert.Contains("traceability finding(s) reported", err)

// ---- specs structure / scaffold dart / e2e-coverage ----

[<Fact>]
let ``route reports zero findings when no specs-apps directory or --apps flag is given on specs structure validate``
    ()
    =
    let root = newTempDir ()
    let code, _, _ = runCaptured (okRoot root) [| "specs"; "structure"; "validate" |]
    Assert.Equal(0, code)

[<Fact>]
let ``route creates a missing parent for specs scaffold dart`` () =
    let missingParent =
        Path.Combine(Path.GetTempPath(), "rhino-cli-dart-missing-" + Guid.NewGuid().ToString("N"), "child")

    let code, _, err =
        runCaptured (okRoot (newTempDir ())) [| "specs"; "scaffold"; "dart"; "--dir"; missingParent |]

    Assert.Equal(0, code)
    Assert.DoesNotContain("Error:", err)
    Assert.True(File.Exists(Path.Combine(missingParent, "pubspec.yaml")))

[<Fact>]
let ``route renders JSON with pubspec_created for a successful specs scaffold dart`` () =
    let dir = newTempDir ()

    let code, out, _ =
        runCaptured (okRoot (newTempDir ())) [| "specs"; "scaffold"; "dart"; "--dir"; dir; "-o"; "json" |]

    Assert.Equal(0, code)
    Assert.Contains("\"pubspec_created\"", out)

// ---- harness sync promote / bindings generate / audit ----

[<Fact>]
let ``route echoes --help in the missing-MIRROR usage line for harness sync promote`` () =
    let code, _, err =
        runCaptured (okRoot (newTempDir ())) [| "harness"; "sync"; "promote"; "--help" |]

    Assert.Equal(2, code)
    Assert.Contains("Usage: rhino-cli harness sync promote --from <MIRROR> --help", err)

[<Fact>]
let ``route surfaces a repo-config.yml load failure when --harness names an entry on harness bindings generate`` () =
    let root = newTempDir ()
    writeFile root "repo-config.yml" "harness:\n  - name: probe\n    bogus_key: true\n"

    let code, _, err =
        runCaptured (okRoot root) [| "harness"; "bindings"; "generate"; "--harness"; "probe" |]

    Assert.Equal(1, code)
    Assert.Contains("failed to load repo-config.yml:", err)

[<Fact>]
let ``route rejects an unknown --harness name against a loadable empty registry on harness bindings generate`` () =
    let root = newTempDir ()
    writeFile root "repo-config.yml" "harness: []\n"

    let code, _, err =
        runCaptured (okRoot root) [| "harness"; "bindings"; "generate"; "--harness"; "bogus-name" |]

    Assert.Equal(1, code)
    Assert.Contains("Error:", err)

[<Fact>]
let ``route completes a quiet harness bindings generate run against an empty registry and empty agent source`` () =
    let root = newTempDir ()
    writeFile root "repo-config.yml" "harness: []\n"
    Directory.CreateDirectory(Path.Combine(root, ".claude", "agents")) |> ignore

    let code, _, _ =
        runCaptured (okRoot root) [| "harness"; "bindings"; "generate"; "--quiet" |]

    Assert.Equal(0, code)

// ---- env backup: canonicalize-fallback and alwaysConfirm coverage gaps ----

[<Fact>]
let ``route falls back to the raw --dir value when canonicalizeBestEffort finds no existing ancestor on env backup``
    ()
    =
    let root = newTempDir ()

    let code, out, _ =
        runCaptured (okRoot root) [| "env"; "backup"; "--dir"; "totally-made-up-dir-xyz-noexist"; "--dry-run" |]

    Assert.Equal(0, code)
    Assert.Contains("Dry-run backup:", out)

[<Fact>]
let ``route overwrites an existing backup destination file after public confirmation answers yes`` () =
    let root = newTempDir ()
    writeFile root ".env" "SECRET=1\n"
    let backupDir = newTempDir ()
    writeFile backupDir ".env" "OLD=1\n"

    let code, _, _ =
        runCapturedWithInput "yes\n" (okRoot root) [| "env"; "backup"; "--dir"; backupDir |]

    Assert.Equal(0, code)
    Assert.Contains("SECRET=1", File.ReadAllText(Path.Combine(backupDir, ".env")))

// ---- doctor --fix: reachable without a real missing tool, via an emptied PATH ----

[<Fact>]
let ``route previews a would-install step and reports a missing-tool error on doctor --fix --dry-run with PATH empty``
    ()
    =
    let root = newTempDir ()
    let originalPath = Environment.GetEnvironmentVariable("PATH")
    Environment.SetEnvironmentVariable("PATH", "")

    try
        let code, out, err =
            runCaptured (okRoot root) [| "doctor"; "--tools"; "git"; "--fix"; "--dry-run"; "-o"; "json" |]

        // The remediation command is host-platform-dependent (`installGit`'s
        // darwin vs. linux branch); this test exercises the real CLI, not a
        // pinned platform string, so it must assert whichever branch the
        // runner actually is.
        let expectedInstallLine =
            if
                System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(
                    System.Runtime.InteropServices.OSPlatform.OSX
                )
            then
                "Would install: git via xcode-select --install"
            else
                "Would install: git via sudo apt-get install -y git"

        Assert.Equal(1, code)
        Assert.Contains(expectedInstallLine, out)
        Assert.Contains("Fix summary: 0 fixed, 0 failed, 0 already OK", out)
        Assert.Contains("Error: 1 tool(s) not found in PATH", err)
    finally
        Environment.SetEnvironmentVariable("PATH", originalPath)

[<Fact>]
let ``route reports a failed install attempt and exits 1 on doctor --fix with PATH empty`` () =
    let root = newTempDir ()
    let originalPath = Environment.GetEnvironmentVariable("PATH")
    Environment.SetEnvironmentVariable("PATH", "")

    try
        let code, out, err =
            runCaptured (okRoot root) [| "doctor"; "--tools"; "git"; "--fix"; "-o"; "json" |]

        Assert.Equal(1, code)
        Assert.Contains("Fix summary: 0 fixed, 1 failed, 0 already OK", out)
        Assert.Contains("Error: 1 tool(s) failed to install", err)
    finally
        Environment.SetEnvironmentVariable("PATH", originalPath)

// ---- md leaves: git-unavailable fallback ----

[<Fact>]
let ``route falls back to a repo-wide scan when git is unavailable on md mermaid validate --changed-only`` () =
    let root = newTempDir ()
    let originalPath = Environment.GetEnvironmentVariable("PATH")
    Environment.SetEnvironmentVariable("PATH", "")

    try
        let code, out, _ =
            runCaptured (okRoot root) [| "md"; "mermaid"; "validate"; "--changed-only" |]

        Assert.Equal(0, code)
        Assert.Contains("Found 0 violation(s)", out)
    finally
        Environment.SetEnvironmentVariable("PATH", originalPath)

// ---- gate emit: missing --surface ----

[<Fact>]
let ``route echoes the missing --surface usage line for gate emit`` () =
    let code, _, err = runCaptured (okRoot (newTempDir ())) [| "gate"; "emit" |]
    Assert.Equal(2, code)
    Assert.Contains("Usage: rhino-cli gate emit --surface <SURFACE>", err)

// ---- harness duplication validate: unreadable source directory and a real cluster ----

[<Fact>]
let ``route surfaces a read failure as Error when the agents directory is unreadable on harness duplication validate``
    ()
    =
    let root = newTempDir ()
    let agentsDir = Path.Combine(root, ".claude", "agents")
    Directory.CreateDirectory(agentsDir) |> ignore
    File.SetUnixFileMode(agentsDir, UnixFileMode.None)

    try
        let code, _, err =
            runCaptured (okRoot root) [| "harness"; "duplication"; "validate" |]

        Assert.Equal(1, code)
        Assert.Contains("agents detect-duplication failed", err)
    finally
        File.SetUnixFileMode(agentsDir, UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute)

[<Fact>]
let ``route reports duplication clusters for two agents sharing a 10-line window on harness duplication validate`` () =
    let root = newTempDir ()

    let body =
        [ 1..10 ]
        |> List.map (sprintf "This is a shared line number %d of prose.")
        |> String.concat "\n"
        |> fun s -> s + "\n"

    writeFile root ".claude/agents/widget-alpha.md" body
    writeFile root ".claude/agents/widget-beta.md" body

    let code, _, err =
        runCaptured (okRoot root) [| "harness"; "duplication"; "validate" |]

    Assert.Equal(1, code)
    Assert.Contains("duplication cluster(s) detected", err)

// ---- harness catalog validate: RepoConfig.load failure falls back to the default catalog path ----

[<Fact>]
let ``route falls back to the default catalog path when repo-config.yml fails to load on harness catalog validate`` () =
    let root = newTempDir ()
    writeFile root "repo-config.yml" "harness:\n  - name: probe\n    bogus_key: true\n"

    let code, _, err = runCaptured (okRoot root) [| "harness"; "catalog"; "validate" |]

    Assert.Equal(1, code)
    Assert.Contains("docs/reference/platform-bindings.md", err)

// ---- harness sync triage: load failure and a real divergence report ----

[<Fact>]
let ``route surfaces a repo-config.yml load failure on harness sync triage`` () =
    let root = newTempDir ()
    writeFile root "repo-config.yml" "not: valid: yaml: [unclosed"

    let code, _, err = runCaptured (okRoot root) [| "harness"; "sync"; "triage" |]

    Assert.Equal(1, code)
    Assert.Contains("Error:", err)

[<Fact>]
let ``route reports and formats a divergence on harness sync triage`` () =
    let root = newGitRepoFixture ()

    writeFile
        root
        "repo-config.yml"
        ("harness:\n"
         + "  - name: opencode\n"
         + "    tier: generated\n"
         + "    agent-dir: .opencode/agents\n"
         + "    mirrors: .claude/agents\n"
         + "    ownership:\n"
         + "      - path: .opencode/agents\n"
         + "        class: generated\n"
         + "        reason: emitted from .claude/agents\n"
         + "      - path: .claude/agents\n"
         + "        class: source\n"
         + "        reason: canonical\n")

    writeFile root ".claude/agents/x.md" "---\nname: x\ndescription: canon-desc\n---\nBody.\n"
    let mirrorPath = Path.Combine(root, ".opencode", "agents", "x.md")
    writeFile root ".opencode/agents/x.md" "---\ndescription: stale-desc\n---\nBody.\n"

    runGit root [ "add"; "-A" ]
    runGit root [ "commit"; "-q"; "-m"; "initial" ]
    File.Delete mirrorPath

    let code, out, err = runCaptured (okRoot root) [| "harness"; "sync"; "triage" |]

    Assert.Equal(1, code)
    Assert.Contains("generated file(s) compared, 1 divergence(s)", out)
    Assert.Contains(".opencode/agents/x.md", out)
    Assert.Contains("Error:", err)

// ---- harness sync promote: --output echo, not-generated error, and a real proposal ----

[<Fact>]
let ``route echoes --output <OUTPUT> in the missing-MIRROR usage line for harness sync promote`` () =
    let code, _, err =
        runCaptured (okRoot (newTempDir ())) [| "harness"; "sync"; "promote"; "-o"; "json" |]

    Assert.Equal(2, code)
    Assert.Contains("Usage: rhino-cli harness sync promote --from <MIRROR> --output <OUTPUT>", err)

[<Fact>]
let ``route rejects a --from file the registry does not classify generated on harness sync promote`` () =
    let root = newTempDir ()
    writeFile root "repo-config.yml" "harness: []\n"

    let code, _, err =
        runCaptured (okRoot root) [| "harness"; "sync"; "promote"; "--from"; "nope.md" |]

    Assert.Equal(1, code)
    Assert.Contains("is not a generated binding file", err)

[<Fact>]
let ``route prints a proposed diff for a diverged generated mirror on harness sync promote`` () =
    let root = newGitRepoFixture ()

    writeFile
        root
        "repo-config.yml"
        ("harness:\n"
         + "  - name: opencode\n"
         + "    tier: generated\n"
         + "    agent-dir: .opencode/agents\n"
         + "    mirrors: .claude/agents\n"
         + "    ownership:\n"
         + "      - path: .opencode/agents\n"
         + "        class: generated\n"
         + "        reason: emitted from .claude/agents\n"
         + "      - path: .claude/agents\n"
         + "        class: source\n"
         + "        reason: canonical\n")

    writeFile root ".claude/agents/x.md" "---\nname: x\ndescription: canon-desc\n---\nBody.\n"
    writeFile root ".opencode/agents/x.md" "---\ndescription: stale-desc\n---\nBody.\n"
    runGit root [ "add"; "-A" ]
    runGit root [ "commit"; "-q"; "-m"; "initial" ]

    let code, out, _ =
        runCaptured (okRoot root) [| "harness"; "sync"; "promote"; "--from"; ".opencode/agents/x.md" |]

    Assert.Equal(0, code)
    Assert.Contains("proposed change to .claude/agents/x.md", out)

// ---- harness bindings generate: known --harness name, discovery failure, and a per-file write failure ----

[<Fact>]
let ``route accepts a --harness name the registry declares on harness bindings generate`` () =
    let root = newTempDir ()
    writeFile root "repo-config.yml" "harness:\n  - name: probe\n    tier: source\n"
    Directory.CreateDirectory(Path.Combine(root, ".claude", "agents")) |> ignore

    let code, _, _ =
        runCaptured (okRoot root) [| "harness"; "bindings"; "generate"; "--harness"; "probe"; "--quiet" |]

    Assert.Equal(0, code)

[<Fact>]
let ``route surfaces a discoverAgentSources failure for an agent file with no frontmatter on harness bindings generate``
    ()
    =
    let root = newTempDir ()
    writeFile root "repo-config.yml" "harness: []\n"
    writeFile root ".claude/agents/broken.md" "No frontmatter here at all.\n"

    let code, _, err = runCaptured (okRoot root) [| "harness"; "bindings"; "generate" |]

    Assert.Equal(1, code)
    Assert.Contains("failed to extract frontmatter", err)

[<Fact>]
let ``route reports a per-file failure when the OpenCode mirror directory cannot be written on harness bindings generate``
    ()
    =
    let root = newTempDir ()
    writeFile root "repo-config.yml" "harness: []\n"

    writeFile
        root
        ".claude/agents/valid.md"
        "---\nname: valid\ndescription: A valid test agent.\nmodel: sonnet\ntools: []\ncolor: purple\n---\n\nBody text.\n"

    let mirrorDir = Path.Combine(root, ".opencode", "agents")
    Directory.CreateDirectory(mirrorDir) |> ignore
    File.SetUnixFileMode(mirrorDir, UnixFileMode.None)

    try
        let code, out, err =
            runCaptured (okRoot root) [| "harness"; "bindings"; "generate" |]

        Assert.Equal(1, code)
        Assert.Contains("Failed Files:", out)
        Assert.Contains("codex: 1 agent(s) emitted", out)
        Assert.Contains("generation completed with 1 failure(s)", err)
    finally
        File.SetUnixFileMode(mirrorDir, UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute)

// ---- harness audit: one failing member ----

[<Fact>]
let ``route reports one failing validator on harness audit`` () =
    let root = newTempDir ()

    let code, _, err =
        runCaptured
            (okRoot root)
            [| "harness"
               "audit"
               "--skip"
               "detect-duplication"
               "--skip"
               "validate-claude"
               "--skip"
               "validate-sync"
               "--skip"
               "validate-bindings"
               "--skip"
               "validate-word-budget" |]

    Assert.Equal(1, code)
    Assert.Contains("HARNESS AUDIT FAILED: 1 validator(s) reported failures", err)
    Assert.Contains("Error: harness audit found 1 failure(s)", err)
