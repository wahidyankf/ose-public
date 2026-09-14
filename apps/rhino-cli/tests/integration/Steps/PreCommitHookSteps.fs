/// TickSpec step definitions binding the resequenced `git-pre-commit.feature`'s
/// 3 scenarios to the git pre-commit hook's `md links validate` and `md mermaid
/// validate` steps
/// [Repo-grounded — `specs/apps/rhino/cli/behaviours/git/git-pre-commit.feature`,
/// `apps/rhino-cli/tests/git_hooks.rs`].
///
/// **Integration-tier**, unlike every other Wave D feature file: the Rust
/// counterpart shells out to the compiled binary against a throwaway git-rooted
/// fixture. `md` is not yet listed in `FSHARP_NAMESPACES` (that flip is later,
/// separate Wave D integration work — see `Md.fs`'s own module doc comment),
/// so there is no compiled F# binary command to shell out to yet. Instead,
/// each `When` step below composes `RhinoCli.Application.Md`'s validators with
/// a real `git diff --cached` staged-file query
/// (`RhinoCli.Infrastructure.GitRoot.getStagedFiles`) and renders the result
/// to text itself, the same "call the internal function directly, format
/// nothing in the Application layer" split `DoctorSteps.fs` already
/// establishes for CLI-adjacent testing without a compiled binary — the
/// difference from `MdSteps.fs`'s unit-tier scenarios is that this file drives
/// real git-staged-file detection against a throwaway fixture repo rather than
/// hand-building a path list, exercising the CLI-facing composition the unit
/// tests skip.
///
/// Rust's `combined_output()` precedent (stdout + stderr concatenated, since a
/// developer watching a failed hook sees both streams interleaved) is followed
/// here too: `Then` steps assert against `combinedOutput()`.
///
/// All fixture git usage below implements the full [Git Fixture Isolation
/// Convention](../../../../../../repo-governance/development/quality/git-fixture-isolation.md)
/// six layers, not just the `GIT_DIR`/`GIT_WORK_TREE`-stripping subset
/// `DoctorSteps.fs`/`ParityUnitTests.fs`/`GitRootUnitTests.fs` implement —
/// this is the first F# git-fixture helper in this port to do so, since it is
/// the first whose `git init`/`add`/`commit` sequence a CRITICAL-severity
/// convention (per that document's Enforcement section) governs end to end.
module RhinoCli.Tests.Integration.Steps.PreCommitHookSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/git/git-pre-commit.feature" ]

open System
open System.Diagnostics
open System.IO
open TickSpec
open Xunit
open RhinoCli.Application
open RhinoCli.Domain
open RhinoCli.Infrastructure

// ---------------------------------------------------------------------------
// Git Fixture Isolation Convention — all six layers
// ---------------------------------------------------------------------------

/// Standards 1-3: the mandatory isolation environment variables, scoped to
/// `repoDir`. `GIT_WORK_TREE` is deliberately omitted per Standard 2 — with
/// `GIT_DIR` set explicitly, `GIT_WORK_TREE` would make the Standard 4 escape
/// guard's `--show-toplevel` merely echo the variable, defeating it.
let private isolationEnv (repoDir: string) : (string * string) list =
    [ "GIT_CEILING_DIRECTORIES", repoDir
      "GIT_DIR", Path.Combine(repoDir, ".git")
      "GIT_CONFIG_GLOBAL", "/dev/null"
      "GIT_CONFIG_SYSTEM", "/dev/null" ]

/// Builds a not-yet-started `git` process targeting `repoDir`, with the
/// isolation env vars and a throwaway commit identity applied.
let private startGit (repoDir: string) (args: string list) : Process =
    let proc = new Process()
    proc.StartInfo.FileName <- "git"
    args |> List.iter proc.StartInfo.ArgumentList.Add
    proc.StartInfo.WorkingDirectory <- repoDir
    proc.StartInfo.RedirectStandardOutput <- true
    proc.StartInfo.RedirectStandardError <- true
    proc.StartInfo.UseShellExecute <- false

    for key, value in isolationEnv repoDir do
        proc.StartInfo.EnvironmentVariables.[key] <- value

    proc.StartInfo.EnvironmentVariables.["GIT_AUTHOR_NAME"] <- "Rhino CLI Test"
    proc.StartInfo.EnvironmentVariables.["GIT_AUTHOR_EMAIL"] <- "rhino-cli-test@example.invalid"
    proc.StartInfo.EnvironmentVariables.["GIT_COMMITTER_NAME"] <- "Rhino CLI Test"
    proc.StartInfo.EnvironmentVariables.["GIT_COMMITTER_EMAIL"] <- "rhino-cli-test@example.invalid"
    proc

/// Standard 5: exit-status checking — inspects `ExitCode`, not a bare
/// `.Start()`/wait pair, so a `git` command that ran and failed is caught.
let private runGit (repoDir: string) (args: string list) : unit =
    use proc = startGit repoDir args
    proc.Start() |> ignore
    let stderr = proc.StandardError.ReadToEnd()
    proc.WaitForExit()

    if proc.ExitCode <> 0 then
        failwithf "git %s failed in %s: %s" (String.concat " " args) repoDir stderr

/// Resolves `path` to its OS-canonical, symlink-free form via `sh -c "pwd
/// -P"` — `Path.GetFullPath` alone is a lexical operation and does not
/// resolve symlinks, but macOS's system temp directory
/// (`Path.GetTempPath()`) lives under `/var/folders/...`, itself a symlink
/// to `/private/var/folders/...`, which is what `git rev-parse
/// --show-toplevel` (which does resolve symlinks) actually returns. Without
/// this, the Standard 4 escape guard below trips on every macOS run even
/// when nothing is actually wrong.
let private canonicalize (path: string) : string =
    use proc = new Process()
    proc.StartInfo.FileName <- "sh"
    proc.StartInfo.ArgumentList.Add("-c")
    proc.StartInfo.ArgumentList.Add("pwd -P")
    proc.StartInfo.WorkingDirectory <- path
    proc.StartInfo.RedirectStandardOutput <- true
    proc.StartInfo.UseShellExecute <- false
    proc.Start() |> ignore
    let out = proc.StandardOutput.ReadToEnd()
    proc.WaitForExit()

    if proc.ExitCode <> 0 then
        failwithf "git fixture escape guard: failed to canonicalize %s" path

    out.Trim()

/// Standard 4: pre-write escape guard — asserts `git rev-parse
/// --show-toplevel` resolves to `repoDir` before any write subcommand runs,
/// so a CWD race, a `TMPDIR`-under-repo misconfiguration, or any future
/// refactor that drops an isolation env var is caught here rather than
/// silently mutating the real repository.
let private assertRepoRootIs (repoDir: string) : unit =
    use proc = startGit repoDir [ "rev-parse"; "--show-toplevel" ]
    proc.Start() |> ignore
    let stdout = proc.StandardOutput.ReadToEnd()
    proc.WaitForExit()

    if proc.ExitCode <> 0 then
        failwith "git fixture escape guard: rev-parse --show-toplevel failed"

    let resolved = stdout.Trim().TrimEnd(Path.DirectorySeparatorChar)
    let expected = (canonicalize repoDir).TrimEnd(Path.DirectorySeparatorChar)

    if resolved <> expected then
        failwithf
            "git fixture escape guard tripped: expected repo root %s, git resolved %s — refusing to run a write command against the wrong repository"
            expected
            resolved

/// Runs a write subcommand (`add`/`commit`/`config`) against the throwaway
/// fixture repo, guarded per Standard 4. `git init` itself is not routed
/// through this — there is nothing yet for `rev-parse --show-toplevel` to
/// resolve before it runs; `GIT_DIR` alone (Standard 2) already fully
/// determines where `init` creates the repo.
let private runGitWrite (repoDir: string) (args: string list) : unit =
    assertRepoRootIs repoDir
    runGit repoDir args

/// Initializes a minimal real git repo with one commit, so `getStagedFiles`
/// resolves here and staged-file queries succeed
/// [Repo-grounded — `git_hooks.rs::init_git_repo`].
let private initGitRepo (repoDir: string) : unit =
    Directory.CreateDirectory(repoDir) |> ignore
    runGit repoDir [ "init"; "-q" ]
    File.WriteAllText(Path.Combine(repoDir, "seed.txt"), "seed\n")
    runGitWrite repoDir [ "add"; "-A" ]
    runGitWrite repoDir [ "commit"; "-q"; "-m"; "seed" ]

/// Writes `content` at repo-relative path `rel` inside `repoDir`, creating
/// parent directories as needed.
let private write (repoDir: string) (rel: string) (content: string) : unit =
    let full = Path.Combine(repoDir, rel)
    Directory.CreateDirectory(Path.GetDirectoryName(full: string)) |> ignore
    File.WriteAllText(full, content)

/// Writes `content` at `rel` and stages it.
let private writeAndStage (repoDir: string) (rel: string) (content: string) : unit =
    write repoDir rel content
    runGitWrite repoDir [ "add"; rel ]

// ---------------------------------------------------------------------------
// Step-definition container
// ---------------------------------------------------------------------------

/// Instance step-definition container — see `ConventionSteps.fs`'s module
/// doc comment for why TickSpec's one-instance-per-scenario lifecycle makes
/// instance-level mutable fields the idiomatic state-threading mechanism
/// here.
type PreCommitHookSteps() =
    let workDir =
        let dir =
            Path.Combine(Path.GetTempPath(), "rhino-cli-pre-commit-hook-" + Guid.NewGuid().ToString("N"))

        initGitRepo dir
        dir

    let mutable targetFile = ""
    let mutable stdoutText = ""
    let mutable stderrText = ""
    let mutable exitCode = 0

    /// Mirrors `git_hooks.rs::GitHooksWorld::combined_output` — a developer
    /// watching a failed hook in their terminal sees both streams
    /// interleaved, so `Then` steps assert against this instead of stdout or
    /// stderr alone.
    let combinedOutput () = stdoutText + stderrText

    // ---- Given ----

    [<Given>]
    member _.``staged markdown files contain a link to a non-existent target``() =
        targetFile <- "docs/index.md"
        writeAndStage workDir targetFile "# Index\nSee ![missing](./does-not-exist.png).\n"

    [<Given>]
    member _.``a staged markdown file under docs containing a mermaid diagram with a label exceeding the maximum length``
        ()
        =
        targetFile <- "docs/diagram.md"

        let content =
            "# Diagram\n\n```mermaid\nflowchart TD\n    A[This label is definitely longer than thirty characters total]\n```\n"

        writeAndStage workDir targetFile content

    [<Given>]
    member _.``a staged markdown file under plans/done containing a broken internal link``() =
        targetFile <- "plans/done/2024-01-01__old/notes.md"
        writeAndStage workDir targetFile "# Notes\nSee ![missing](./does-not-exist.png).\n"

    // ---- When ----

    /// Mirrors the real `.husky/pre-push` invocation: staged-only scope plus
    /// `--exclude plans/done`, matching both this scenario and
    /// "link-step-honors-exclusions"'s identical When-step text
    /// [Repo-grounded — `git_hooks.rs::when_run_links_validate_staged`].
    [<When>]
    member _.``the pre-commit hook runs md links validate on staged files``() =
        match GitRoot.getStagedFiles workDir with
        | Error e -> failwithf "git diff --cached failed: %s" e
        | Ok staged ->
            let findings =
                Md.validateDocsLinks
                    { RepoRoot = workDir
                      StagedFiles = Some staged
                      ExcludePrefixes = [ "plans/done" ] }

            if List.isEmpty findings then
                stdoutText <- "All links valid! No broken links found.\n"
                stderrText <- ""
                exitCode <- 0
            else
                stdoutText <- Finding.formatText findings + "\n"
                stderrText <- sprintf "Error: found %d broken link(s)\n" findings.Length
                exitCode <- (if Finding.hasBlocking findings then 1 else 0)

    [<When>]
    member _.``the pre-commit hook runs md mermaid validate on the staged file``() =
        match GitRoot.getStagedFiles workDir with
        | Error e -> failwithf "git diff --cached failed: %s" e
        | Ok staged ->
            let result =
                Md.validateMermaidDocs
                    { RepoRoot = workDir
                      Paths = []
                      StagedFiles = Some staged
                      ChangedFiles = None
                      ExcludePrefixes = []
                      // RHINO owns the default label limit; the strict pre-commit gate passes --max-label-len 20.
                      Options =
                        { Md.defaultMermaidValidateOptions with
                            MaxLabelLen = 20 } }

            stdoutText <- Md.formatMermaidText result false false

            if List.isEmpty result.Violations then
                stderrText <- ""
                exitCode <- 0
            else
                stderrText <- sprintf "Error: %d mermaid violation(s) found\n" result.Violations.Length
                exitCode <- 1

    // ---- Then ----

    [<Then>]
    member _.``the command exits with a failure code``() = Assert.Equal(1, exitCode)

    [<Then>]
    member _.``the stderr output identifies the source file containing the broken link``() =
        Assert.Contains(targetFile, combinedOutput ())

    [<Then>]
    member _.``the stderr output identifies the line number of the broken link``() =
        Assert.Contains("Line 2:", combinedOutput ())

    [<Then>]
    member _.``the stderr output identifies the broken link target``() =
        Assert.Contains("./does-not-exist.png", combinedOutput ())

    [<Then>]
    member _.``the output indicates a mermaid violation was found``() =
        Assert.Contains("[FAIL]", stdoutText)
        Assert.Contains("Found 1 violation(s)", stdoutText)

    [<Then>]
    member _.``the link validation step does not report a broken link for the plans/done file``() =
        Assert.Equal(0, exitCode)
        Assert.DoesNotContain(targetFile, combinedOutput ())

    [<AfterScenario>]
    member _.Cleanup() =
        if Directory.Exists workDir then
            Directory.Delete(workDir, true)

// ---------------------------------------------------------------------------
// FeatureRunner
// ---------------------------------------------------------------------------

/// Reads one named `Scenario:` block out of the real, frozen
/// `git-pre-commit.feature` file (leaving the file itself untouched) and runs
/// it through TickSpec bound only against `PreCommitHookSteps` — see
/// `DoctorSteps.fs`'s `FeatureRunner` for why this is per-scenario rather than
/// per-file.
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
                "git",
                "git-pre-commit.feature"
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
                || trimmed.StartsWith("@", StringComparison.Ordinal))
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIdx .. endIdx - 1]

    /// Runs the single scenario named `scenarioTitle` from
    /// `git-pre-commit.feature`, bound against `PreCommitHookSteps`.
    let run (scenarioTitle: string) : unit =
        let allLines = File.ReadAllLines featurePath
        let snippet = extractScenario allLines scenarioTitle
        let definitions = StepDefinitions([| typeof<PreCommitHookSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)
        let scenario = Seq.exactlyOne feature.Scenarios
        scenario.Action.Invoke()

[<Fact>]
let ``Broken-link detection in step 7 reports per-link details`` () =
    FeatureRunner.run "Broken-link detection in step 7 reports per-link details"

[<Fact>]
let ``staged-mermaid-blocks — staged malformed mermaid diagram blocks commit`` () =
    FeatureRunner.run "staged-mermaid-blocks — staged malformed mermaid diagram blocks commit"

[<Fact>]
let ``link-step-honors-exclusions — staged plans/done broken link does not block commit`` () =
    FeatureRunner.run "link-step-honors-exclusions — staged plans/done broken link does not block commit"
