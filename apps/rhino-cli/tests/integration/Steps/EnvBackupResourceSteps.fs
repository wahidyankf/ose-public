/// TickSpec step definitions binding `env-backup.feature`'s 21 scenarios to
/// `RhinoCli.Application.Env` [Repo-grounded —
/// `specs/apps/rhino/cli/behaviours/env/env-backup.feature`,
/// `apps/rhino-cli/src/application/env/backup.rs`,
/// `apps/rhino-cli/src/commands/env_backup.rs`].
///
/// Follows `RepoConfigSteps.fs`'s per-scenario slicing convention: each xunit
/// `[<Fact>]` below runs exactly one scenario, extracted from the real,
/// frozen feature file rather than a duplicated/rewritten copy of its
/// wording.
///
/// Every scenario builds its own throwaway temp-directory fixtures for both
/// the repository root and the backup destination — this feature file never
/// reads this repository's own real files, unlike some `repo-config`/
/// `repo-config-validate` scenarios.
module RhinoCli.Tests.Integration.Steps.EnvBackupResourceSteps

/// Explicit static-coverage ownership; the validator scopes this file's
/// TickSpec bindings to these canonical features.
let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/env/env-backup.feature" ]


open System
open System.IO
open System.Text.Json
open TickSpec
open Xunit
open RhinoCli.Application.Env

/// Instance step-definition container — see `ConventionSteps.fs`'s module
/// doc comment for why TickSpec's one-instance-per-scenario lifecycle makes
/// instance-level mutable fields the idiomatic state-threading mechanism
/// here.
type EnvSteps() =
    let mutable repoRoot: string option = None
    let mutable backupDir: string option = None
    let mutable expectedEnvRelPaths: string list = []
    let mutable worktreeAware = false
    let mutable worktreeName: string option = None
    let mutable forceFlag = false
    let mutable includeConfigFlag = false
    let mutable dryRunFlag = false
    let mutable confirmChoice: bool option = None
    let mutable confirmCallCount = 0
    let mutable opResult: Result<EnvOperationResult, string> option = None
    let mutable ownedDirs: string list = []

    let newTempDir (prefix: string) : string =
        let dir =
            Path.Combine(Path.GetTempPath(), "rhino-cli-env-" + prefix + "-" + Guid.NewGuid().ToString("N"))

        Directory.CreateDirectory(dir) |> ignore
        ownedDirs <- dir :: ownedDirs
        dir

    let writeFile (root: string) (relativePath: string) (content: string) =
        let full = Path.Combine(root, relativePath)
        Directory.CreateDirectory(Path.GetDirectoryName(full)) |> ignore
        File.WriteAllText(full, content)

    let root () : string =
        match repoRoot with
        | Some dir -> dir
        | None -> failwith "no repository root has been prepared by a Given step"

    /// Reuses the repository root when a prior `Given` already created one
    /// (the secrets-pattern and dry-run scenarios chain three `Given`/`And`
    /// steps against the same repository), otherwise creates a fresh one.
    let ensureRoot () : string =
        match repoRoot with
        | Some dir -> dir
        | None ->
            let dir = newTempDir "repo"
            repoRoot <- Some dir
            dir

    let ensureBackupDir () : string =
        match backupDir with
        | Some dir -> dir
        | None ->
            let dir = newTempDir "backup"
            backupDir <- Some dir
            dir

    let outcome () : EnvOperationResult =
        match opResult with
        | Some(Ok r) -> r
        | Some(Error message) -> failwith (sprintf "expected a successful backup, got error: %s" message)
        | None -> failwith "no command has been run by a When step"

    let confirm () : bool =
        confirmCallCount <- confirmCallCount + 1

        match confirmChoice with
        | Some v -> v
        | None -> failwith "confirm callback invoked but no confirm/decline choice was set by a When step"

    let runBackup () =
        let repo = root ()
        let dest = ensureBackupDir ()

        let opts: EnvOptions =
            { RepoRoot = repo
              BackupDir = dest
              SkipDirs = defaultSkipDirs
              MaxSize = DefaultMaxSize
              WorktreeAware = worktreeAware
              WorktreeName = worktreeName |> Option.defaultValue ""
              Force = forceFlag
              IncludeConfig = includeConfigFlag
              DryRun = dryRunFlag }

        opResult <- Some(backup opts confirm)

    // ---- Given ----

    [<Given>]
    member _.``a git repository containing .env files at the root and in app subdirectories``() =
        let dir = ensureRoot ()
        writeFile dir ".env" "root=1"
        writeFile dir "apps/web/.env" "web=1"
        writeFile dir "apps/api/.env" "api=1"
        expectedEnvRelPaths <- [ ".env"; "apps/web/.env"; "apps/api/.env" ]

    [<Given>]
    member _.``a git repository containing a .env file at the root``() =
        let dir = ensureRoot ()
        writeFile dir ".env" "k=v"

    [<Given>]
    member _.``the backup directory already contains a backed-up .env file``() =
        let dest = ensureBackupDir ()
        writeFile dest ".env" "old-backup"

    [<Given>]
    member _.``the backup directory is empty``() = ensureBackupDir () |> ignore

    [<Given>]
    member _.``a git repository containing a symlinked .env file, a .env file larger than 1 MB, and a regular .env file``
        ()
        =
        let dir = ensureRoot ()
        let targetFile = Path.Combine(dir, "target.txt")
        File.WriteAllText(targetFile, "target contents")
        File.CreateSymbolicLink(Path.Combine(dir, ".env.symlink"), targetFile) |> ignore
        File.WriteAllBytes(Path.Combine(dir, ".env.large"), Array.zeroCreate<byte>(int DefaultMaxSize + 1))
        writeFile dir ".env" "regular=1"

    [<Given>]
    member _.``a git repository containing no .env files``() =
        let dir = ensureRoot ()
        writeFile dir "README.md" "nothing secret here"

    [<Given>]
    member _.``a git repository containing .env files inside node_modules, dist, build, .next, __pycache__, target, vendor, coverage, and generated-contracts directories``
        ()
        =
        let dir = ensureRoot ()

        for name in
            [ "node_modules"
              "dist"
              "build"
              ".next"
              "__pycache__"
              "target"
              "vendor"
              "coverage"
              "generated-contracts" ] do
            writeFile dir (sprintf "%s/.env" name) "should-not-be-found"

    [<Given>]
    member _.``a git repository where apps/web/node_modules contains a .env file and apps/web contains a .env.local file``
        ()
        =
        let dir = ensureRoot ()
        writeFile dir "apps/web/node_modules/.env" "should-not-be-found"
        writeFile dir "apps/web/.env.local" "web-local=1"

    [<Given>]
    member _.``a git worktree containing a .env file at its root``() =
        let dir = ensureRoot ()
        File.WriteAllText(Path.Combine(dir, ".git"), "gitdir: /elsewhere/.git")
        writeFile dir ".env" "k=v"

    [<Given>]
    member _.``a git worktree named "(.*)" containing a .env file at its root``(name: string) =
        let parent = newTempDir "worktree-parent"
        let dir = Path.Combine(parent, name)
        Directory.CreateDirectory(dir) |> ignore
        repoRoot <- Some dir
        File.WriteAllText(Path.Combine(dir, ".git"), "gitdir: /elsewhere/.git")
        writeFile dir ".env" "k=v"

    [<Given>]
    member _.``the main git repository named "(.*)" containing a .env file at its root``(name: string) =
        let parent = newTempDir "repo-parent"
        let dir = Path.Combine(parent, name)
        Directory.CreateDirectory(dir) |> ignore
        repoRoot <- Some dir
        Directory.CreateDirectory(Path.Combine(dir, ".git")) |> ignore
        writeFile dir ".env" "k=v"

    [<Given>]
    member _.``a git repository containing a .env file and a .claude/settings.local.json file``() =
        let dir = ensureRoot ()
        writeFile dir ".env" "k=v"
        writeFile dir ".claude/settings.local.json" "{}"

    [<Given>]
    member _.``a git repository containing a .env file but no known config files``() =
        let dir = ensureRoot ()
        writeFile dir ".env" "k=v"

    [<Given>]
    member _.``a git repository containing a secrets.json file at the root``() =
        let dir = ensureRoot ()
        writeFile dir "secrets.json" "{\"key\":\"val\"}"

    [<Given>]
    member _.``a git repository containing a cert.pem file at the root``() =
        let dir = ensureRoot ()
        writeFile dir "cert.pem" "-----BEGIN CERTIFICATE-----"

    [<Given>]
    member _.``a git repository containing a .secrets/notes.md file``() =
        let dir = ensureRoot ()
        writeFile dir ".secrets/notes.md" "secret notes"

    [<Given>]
    member _.``a git repository containing a .env file and a secrets.json file``() =
        let dir = ensureRoot ()
        writeFile dir ".env" "k=v"
        writeFile dir "secrets.json" "{\"key\":\"val\"}"
        writeFile dir ".git/config" "[core]\n"

    // ---- When ----

    [<When>]
    member _.``the developer runs rhino-cli env backup``() = runBackup ()

    [<When>]
    member _.``the developer runs rhino-cli env backup with --dir pointing to a directory outside the repository``() =
        ensureBackupDir () |> ignore
        runBackup ()

    [<When>]
    member _.``the developer runs rhino-cli env backup with --dir pointing to a path inside the git root``() =
        backupDir <- Some(Path.Combine(root (), "inside-backup"))
        runBackup ()

    [<When>]
    member _.``the developer runs rhino-cli env backup with --output json``() = runBackup ()

    [<When>]
    member _.``the developer runs rhino-cli env backup with --worktree-aware``() =
        worktreeAware <- true

        match detectWorktree (root ()) with
        | Ok info -> worktreeName <- Some info.WorktreeName
        | Error message -> failwith message

        runBackup ()

    [<When>]
    member _.``the developer runs rhino-cli env backup and confirms the overwrite``() =
        confirmChoice <- Some true
        runBackup ()

    [<When>]
    member _.``the developer runs rhino-cli env backup and declines the overwrite``() =
        confirmChoice <- Some false
        runBackup ()

    [<When>]
    member _.``the developer runs rhino-cli env backup with --force``() =
        forceFlag <- true
        runBackup ()

    [<When>]
    member _.``the developer runs rhino-cli env backup with --include-config and --force``() =
        forceFlag <- true
        includeConfigFlag <- true
        runBackup ()

    [<When>]
    member _.``the developer runs rhino-cli env backup with --dry-run``() =
        dryRunFlag <- true
        runBackup ()

    // ---- Then ----

    [<Then>]
    member _.``the command exits successfully``() =
        match opResult with
        | Some(Ok _) -> ()
        | Some(Error message) -> Assert.Fail(sprintf "expected success, got error: %s" message)
        | None -> Assert.Fail("no command has been run by a When step")

    [<Then>]
    member _.``the command exits with a failure code``() =
        match opResult with
        | Some(Error _) -> ()
        | Some(Ok _) -> Assert.Fail("expected a failure code, got success")
        | None -> Assert.Fail("no command has been run by a When step")

    [<Then>]
    member _.``each .env file is copied to the backup directory preserving its relative path``() =
        let dest = ensureBackupDir ()

        for relPath in expectedEnvRelPaths do
            Assert.True(File.Exists(Path.Combine(dest, relPath)), sprintf "expected %s to be backed up" relPath)

    [<Then>]
    member _.``the output lists each backed-up file``() =
        let text = formatText (outcome ()) false false

        for relPath in expectedEnvRelPaths do
            Assert.Contains(relPath, text)

    [<Then>]
    member _.``the .env file is copied to the specified directory preserving its relative path``() =
        let dest = ensureBackupDir ()
        Assert.True(File.Exists(Path.Combine(dest, ".env")))
        Assert.Equal("k=v", File.ReadAllText(Path.Combine(dest, ".env")))

    [<Then>]
    member _.``the output warns that the backup directory must be outside the repository``() =
        match opResult with
        | Some(Error message) -> Assert.Contains("outside the repo", message)
        | other -> Assert.Fail(sprintf "expected an error, got %A" other)

    [<Then>]
    member _.``the symlinked .env file is skipped with a warning``() =
        let entry = (outcome ()).Files |> List.find (fun f -> f.RelPath = ".env.symlink")
        Assert.True(entry.Skipped)
        Assert.Equal("symlink", entry.Reason)

    [<Then>]
    member _.``the oversized .env file is skipped with a warning``() =
        let entry = (outcome ()).Files |> List.find (fun f -> f.RelPath = ".env.large")
        Assert.True(entry.Skipped)
        Assert.Contains("exceeds", entry.Reason)

    [<Then>]
    member _.``the regular .env file is copied to the backup directory``() =
        Assert.True(File.Exists(Path.Combine(ensureBackupDir (), ".env")))

    [<Then>]
    member _.``the output reports that zero files were backed up``() =
        let r = outcome ()
        Assert.Equal(0, r.Copied)
        Assert.Contains("0 file(s)", formatText r false false)

    [<Then>]
    member _.``the output is valid JSON``() =
        use _doc = JsonDocument.Parse(formatJson (outcome ()))
        ()

    [<Then>]
    member _.``the JSON includes the direction, backup directory, list of files, copied count, and skipped count``() =
        use doc = JsonDocument.Parse(formatJson (outcome ()))
        let rootElement = doc.RootElement
        Assert.True(rootElement.TryGetProperty("direction") |> fst)
        Assert.True(rootElement.TryGetProperty("dir") |> fst)
        Assert.True(rootElement.TryGetProperty("files") |> fst)
        Assert.True(rootElement.TryGetProperty("copied") |> fst)
        Assert.True(rootElement.TryGetProperty("skipped") |> fst)

    [<Then>]
    member _.``none of the .env files inside auto-generated directories are backed up``() =
        let r = outcome ()
        Assert.Empty(r.Files)
        Assert.Equal(0, r.Copied)

    [<Then>]
    member _.``only apps/web/.env.local is copied to the backup directory``() =
        Assert.True(File.Exists(Path.Combine(ensureBackupDir (), "apps", "web", ".env.local")))

    [<Then>]
    member _.``the .env file inside apps/web/node_modules is not backed up``() =
        Assert.False(File.Exists(Path.Combine(ensureBackupDir (), "apps", "web", "node_modules", ".env")))

    [<Then>]
    member _.``the .env file is copied to the backup directory with a flat structure``() =
        Assert.True(File.Exists(Path.Combine(ensureBackupDir (), ".env")))

    [<Then>]
    member _.``the .env file is copied under a feature-branch subdirectory inside the backup directory``() =
        Assert.True(File.Exists(Path.Combine(ensureBackupDir (), "feature-branch", ".env")))

    [<Then>]
    member _.``the .env file is copied under an open-sharia-enterprise subdirectory inside the backup directory``() =
        Assert.True(File.Exists(Path.Combine(ensureBackupDir (), "open-sharia-enterprise", ".env")))

    [<Then>]
    member _.``the .env file is overwritten in the backup directory``() =
        Assert.Equal(1, confirmCallCount)
        Assert.Equal("k=v", File.ReadAllText(Path.Combine(ensureBackupDir (), ".env")))

    [<Then>]
    member _.``the output reports that backup was cancelled``() =
        Assert.Contains("cancelled", formatText (outcome ()) false false)

    [<Then>]
    member _.``the existing backup file is unchanged``() =
        Assert.Equal(1, confirmCallCount)
        Assert.Equal("old-backup", File.ReadAllText(Path.Combine(ensureBackupDir (), ".env")))

    [<Then>]
    member _.``the .env file is overwritten in the backup directory without prompting``() =
        Assert.Equal(0, confirmCallCount)
        Assert.Equal("k=v", File.ReadAllText(Path.Combine(ensureBackupDir (), ".env")))

    [<Then>]
    member _.``no confirmation prompt is shown``() = Assert.Equal(0, confirmCallCount)

    [<Then>]
    member _.``the .env file is copied to the backup directory``() =
        Assert.True(File.Exists(Path.Combine(ensureBackupDir (), ".env")))

    [<Then>]
    member _.``the .claude/settings.local.json is copied to the backup directory preserving its relative path``() =
        Assert.True(File.Exists(Path.Combine(ensureBackupDir (), ".claude", "settings.local.json")))

    [<Then>]
    member _.``the .claude/settings.local.json is not copied to the backup directory``() =
        Assert.False(File.Exists(Path.Combine(ensureBackupDir (), ".claude", "settings.local.json")))

    [<Then>]
    member _.``only the .env file is copied to the backup directory``() =
        let r = outcome ()
        Assert.Equal(1, r.Copied)

        let copiedPaths =
            r.Files |> List.filter (fun f -> not f.Skipped) |> List.map (fun f -> f.RelPath)

        Assert.Equal<string list>([ ".env" ], copiedPaths)

    [<Then>]
    member _.``secrets.json is copied to the backup directory``() =
        Assert.True(File.Exists(Path.Combine(ensureBackupDir (), "secrets.json")))

    [<Then>]
    member _.``cert.pem is copied to the backup directory``() =
        Assert.True(File.Exists(Path.Combine(ensureBackupDir (), "cert.pem")))

    [<Then>]
    member _.``.secrets/notes.md is copied to the backup directory preserving its relative path``() =
        Assert.True(File.Exists(Path.Combine(ensureBackupDir (), ".secrets", "notes.md")))

    [<Then>]
    member _.``no files from the .git directory are backed up``() =
        let r = outcome ()
        Assert.False(Directory.Exists(Path.Combine(ensureBackupDir (), ".git")))

        Assert.DoesNotContain(r.Files, fun (f: EnvFileEntry) -> f.RelPath.StartsWith(".git/", StringComparison.Ordinal))

    [<Then>]
    member _.``no files are written to the backup directory``() =
        let dest = ensureBackupDir ()
        Assert.Empty(Directory.EnumerateFileSystemEntries dest)

    [<Then>]
    member _.``the output lists the files that would be backed up``() =
        let text = formatText (outcome ()) false false
        Assert.Contains("secrets.json", text)
        Assert.Contains("cert.pem", text)
        Assert.Contains(".secrets/notes.md", text)
        Assert.Contains("WOULD", text)

    [<AfterScenario>]
    member _.Cleanup() =
        for dir in ownedDirs do
            if Directory.Exists dir then
                Directory.Delete(dir, true)

/// Reads one named `Scenario:` block out of the real, frozen
/// `env-backup.feature` file (leaving the file itself untouched) and runs it
/// through TickSpec bound only against `EnvSteps` — see `RepoConfigSteps.fs`'s
/// `FeatureRunner` for why this is per-scenario rather than per-file.
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
                "env",
                "env-backup.feature"
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
                // env-backup.feature tags every scenario with a leading
                // `@tag` line (unlike repo-config-validate.feature/
                // convention-audit.feature, which this slicing pattern was
                // first written against) — the next scenario's tag line must
                // also end the slice, or it gets pulled in as a dangling
                // trailing line with no scenario body to attach to.
                || trimmed.StartsWith("@", StringComparison.Ordinal))
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIdx .. endIdx - 1]

    /// Runs the single scenario named `scenarioTitle` from
    /// `env-backup.feature`, bound against `EnvSteps`.
    let run (scenarioTitle: string) : unit =
        let allLines = File.ReadAllLines featurePath
        let snippet = extractScenario allLines scenarioTitle
        let definitions = StepDefinitions([| typeof<EnvSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)
        let scenario = Seq.exactlyOne feature.Scenarios
        scenario.Action.Invoke()

[<Fact>]
let ``Backup discovers and copies all .env files`` () =
    FeatureRunner.run "Backup discovers and copies all .env files"

[<Fact>]
let ``Backup with custom directory`` () =
    FeatureRunner.run "Backup with custom directory"

[<Fact>]
let ``Backup rejects a directory inside the repository`` () =
    FeatureRunner.run "Backup rejects a directory inside the repository"

[<Fact>]
let ``Symlinks and oversized files are skipped`` () =
    FeatureRunner.run "Symlinks and oversized files are skipped"

[<Fact>]
let ``Backup with zero .env files`` () =
    FeatureRunner.run "Backup with zero .env files"

[<Fact>]
let ``JSON output for backup`` () =
    FeatureRunner.run "JSON output for backup"

[<Fact>]
let ``Env files inside auto-generated directories are not discovered`` () =
    FeatureRunner.run "Env files inside auto-generated directories are not discovered"

[<Fact>]
let ``Env files inside nested auto-generated directories are not discovered`` () =
    FeatureRunner.run "Env files inside nested auto-generated directories are not discovered"

[<Fact>]
let ``Backup works in a git worktree`` () =
    FeatureRunner.run "Backup works in a git worktree"

[<Fact>]
let ``Worktree-aware backup namespaces by worktree name`` () =
    FeatureRunner.run "Worktree-aware backup namespaces by worktree name"

[<Fact>]
let ``Main repo with worktree-aware uses repository directory name`` () =
    FeatureRunner.run "Main repo with worktree-aware uses repository directory name"

[<Fact>]
let ``Backup prompts when destination files already exist`` () =
    FeatureRunner.run "Backup prompts when destination files already exist"

[<Fact>]
let ``Backup aborts when user declines overwrite`` () =
    FeatureRunner.run "Backup aborts when user declines overwrite"

[<Fact>]
let ``Backup with --force skips confirmation`` () =
    FeatureRunner.run "Backup with --force skips confirmation"

[<Fact>]
let ``Backup proceeds without prompt when no conflicts exist`` () =
    FeatureRunner.run "Backup proceeds without prompt when no conflicts exist"

[<Fact>]
let ``Backup includes config files with --include-config`` () =
    FeatureRunner.run "Backup includes config files with --include-config"

[<Fact>]
let ``Backup without --include-config ignores config files`` () =
    FeatureRunner.run "Backup without --include-config ignores config files"

[<Fact>]
let ``Backup with --include-config and no config files found`` () =
    FeatureRunner.run "Backup with --include-config and no config files found"

[<Fact>]
let ``Backup discovers common secret file patterns`` () =
    FeatureRunner.run "Backup discovers common secret file patterns"

[<Fact>]
let ``The .git directory itself is never backed up`` () =
    FeatureRunner.run "The .git directory itself is never backed up"

[<Fact>]
let ``Dry-run backup previews without writing files`` () =
    FeatureRunner.run "Dry-run backup previews without writing files"
