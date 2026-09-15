/// Plain xunit tests for `RhinoCli.Application.Env`'s `restore` port —
/// behaviour with no dedicated Gherkin scenario, or exercised only
/// indirectly there (mirrors the rationale `EnvUnitTests.fs`'s module doc
/// comment states for its own split from `EnvSteps.fs`). Ported from
/// `apps/rhino-cli/src/application/env/backup.rs`'s `#[cfg(test)] mod tests`
/// for `restore`.
module RhinoCli.Tests.Integration.Steps.EnvRestoreResourceTests

open System
open System.IO
open Xunit
open RhinoCli.Application.Env

let private newTempDir () : string =
    let dir =
        Path.Combine(Path.GetTempPath(), "rhino-cli-env-restore-unit-" + Guid.NewGuid().ToString("N"))

    Directory.CreateDirectory(dir) |> ignore
    dir

let private defaultOptions (repoRoot: string) (backupDir: string) : EnvOptions =
    { RepoRoot = repoRoot
      BackupDir = backupDir
      SkipDirs = []
      MaxSize = DefaultMaxSize
      WorktreeAware = false
      WorktreeName = ""
      Force = false
      IncludeConfig = false
      DryRun = false }

let private neverConfirm () : bool =
    failwith "confirm callback must not be invoked"

// ---- error path ----

[<Fact>]
let ``restore fails with a descriptive message when the source directory does not exist`` () =
    let repo = newTempDir ()

    try
        let missing = Path.Combine(repo, "does-not-exist")
        let opts = defaultOptions repo missing

        match restore opts neverConfirm with
        | Error message ->
            Assert.Contains("does not exist", message)
            Assert.Contains(missing, message)
        | Ok _ -> Assert.Fail("expected an error for a missing source directory")
    finally
        Directory.Delete(repo, true)

// ---- narrower skip-dirs than backup ----

[<Fact>]
let ``restore scans only .git as a skip-dir, unlike backup's full defaultSkipDirs list`` () =
    let repo = newTempDir ()
    let dest = newTempDir ()

    try
        Directory.CreateDirectory(Path.Combine(dest, "node_modules")) |> ignore
        File.WriteAllText(Path.Combine(dest, "node_modules", ".env"), "should-be-found")

        let opts = defaultOptions repo dest

        match restore opts neverConfirm with
        | Ok r ->
            Assert.Contains("node_modules/.env", r.Files |> List.map (fun f -> f.RelPath))
            Assert.True(File.Exists(Path.Combine(repo, "node_modules", ".env")))
        | Error message -> Assert.Fail(message)
    finally
        Directory.Delete(repo, true)
        Directory.Delete(dest, true)

[<Fact>]
let ``restore still skips the .git directory itself`` () =
    let repo = newTempDir ()
    let dest = newTempDir ()

    try
        Directory.CreateDirectory(Path.Combine(dest, ".git")) |> ignore
        File.WriteAllText(Path.Combine(dest, ".git", "config"), "gitconfig")
        File.WriteAllText(Path.Combine(dest, ".env"), "k=v")

        let opts = defaultOptions repo dest

        match restore opts neverConfirm with
        | Ok r ->
            Assert.DoesNotContain(
                r.Files,
                fun (f: EnvFileEntry) -> f.RelPath.StartsWith(".git/", StringComparison.Ordinal)
            )
        | Error message -> Assert.Fail(message)
    finally
        Directory.Delete(repo, true)
        Directory.Delete(dest, true)

// ---- worktree-aware source root ----

[<Fact>]
let ``restore does not join a worktree subdirectory when WorktreeName is empty`` () =
    let repo = newTempDir ()
    let dest = newTempDir ()

    try
        File.WriteAllText(Path.Combine(dest, ".env"), "k=v")

        let opts =
            { defaultOptions repo dest with
                WorktreeAware = true
                WorktreeName = "" }

        match restore opts neverConfirm with
        | Ok _ -> Assert.True(File.Exists(Path.Combine(repo, ".env")))
        | Error message -> Assert.Fail(message)
    finally
        Directory.Delete(repo, true)
        Directory.Delete(dest, true)

[<Fact>]
let ``restore does not join a worktree subdirectory when WorktreeAware is false even if WorktreeName is set`` () =
    let repo = newTempDir ()
    let dest = newTempDir ()

    try
        File.WriteAllText(Path.Combine(dest, ".env"), "k=v")

        let opts =
            { defaultOptions repo dest with
                WorktreeAware = false
                WorktreeName = "feature-branch" }

        match restore opts neverConfirm with
        | Ok _ -> Assert.True(File.Exists(Path.Combine(repo, ".env")))
        | Error message -> Assert.Fail(message)
    finally
        Directory.Delete(repo, true)
        Directory.Delete(dest, true)

[<Fact>]
let ``restore's Dir field reports the backup dir itself, not the worktree-joined source root`` () =
    let repo = newTempDir ()
    let dest = newTempDir ()

    try
        Directory.CreateDirectory(Path.Combine(dest, "feature-branch")) |> ignore
        File.WriteAllText(Path.Combine(dest, "feature-branch", ".env"), "k=v")

        let opts =
            { defaultOptions repo dest with
                WorktreeAware = true
                WorktreeName = "feature-branch" }

        match restore opts neverConfirm with
        | Ok r -> Assert.Equal(dest, r.Dir)
        | Error message -> Assert.Fail(message)
    finally
        Directory.Delete(repo, true)
        Directory.Delete(dest, true)

// ---- default max size ----

[<Fact>]
let ``restore applies the default max size when MaxSize is zero or negative`` () =
    let repo = newTempDir ()
    let dest = newTempDir ()

    try
        File.WriteAllBytes(Path.Combine(dest, ".env"), Array.zeroCreate<byte> 1000)

        let opts =
            { defaultOptions repo dest with
                MaxSize = 0L }

        match restore opts neverConfirm with
        | Ok r ->
            let entry = r.Files |> List.find (fun f -> f.RelPath = ".env")
            Assert.False(entry.Skipped)
        | Error message -> Assert.Fail(message)
    finally
        Directory.Delete(repo, true)
        Directory.Delete(dest, true)

// ---- skipped entries during restore ----

[<Fact>]
let ``restore counts an already-skipped entry without copying it`` () =
    let repo = newTempDir ()
    let dest = newTempDir ()

    try
        File.WriteAllBytes(Path.Combine(dest, ".env"), Array.zeroCreate<byte>(int DefaultMaxSize + 1))

        let opts = defaultOptions repo dest

        match restore opts neverConfirm with
        | Ok r ->
            Assert.Equal(0, r.Copied)
            Assert.Equal(1, r.Skipped)
            Assert.False(File.Exists(Path.Combine(repo, ".env")))
        | Error message -> Assert.Fail(message)
    finally
        Directory.Delete(repo, true)
        Directory.Delete(dest, true)

[<Fact>]
let ``restore's dry-run counts already-skipped entries but performs no copy`` () =
    let repo = newTempDir ()
    let dest = newTempDir ()

    try
        File.WriteAllBytes(Path.Combine(dest, ".env"), Array.zeroCreate<byte>(int DefaultMaxSize + 1))
        File.WriteAllText(Path.Combine(dest, "secrets.json"), "{}")

        let opts =
            { defaultOptions repo dest with
                DryRun = true }

        match restore opts neverConfirm with
        | Ok r ->
            Assert.True(r.DryRun)
            Assert.Equal(0, r.Copied)
            Assert.Equal(1, r.Skipped)
            Assert.Equal(2, List.length r.Files)
            Assert.False(File.Exists(Path.Combine(repo, "secrets.json")))
        | Error message -> Assert.Fail(message)
    finally
        Directory.Delete(repo, true)
        Directory.Delete(dest, true)

// ---- include-config ordering ----

[<Fact>]
let ``restore sorts merged env and config entries by relative path`` () =
    let repo = newTempDir ()
    let dest = newTempDir ()

    try
        File.WriteAllText(Path.Combine(dest, ".env"), "k=v")
        Directory.CreateDirectory(Path.Combine(dest, ".claude")) |> ignore
        File.WriteAllText(Path.Combine(dest, ".claude", "settings.local.json"), "{}")

        let opts =
            { defaultOptions repo dest with
                Force = true
                IncludeConfig = true }

        match restore opts neverConfirm with
        | Ok r ->
            let paths = r.Files |> List.map (fun f -> f.RelPath)
            let sorted = paths |> List.sortWith (fun a b -> String.CompareOrdinal(a, b))
            Assert.Equal<string list>(sorted, paths)

            let envEntry = r.Files |> List.find (fun f -> f.RelPath = ".env")
            Assert.Equal("env", envEntry.Source)
        | Error message -> Assert.Fail(message)
    finally
        Directory.Delete(repo, true)
        Directory.Delete(dest, true)

// ---- confirm contract ----

[<Fact>]
let ``restore never invokes confirm during a dry-run even with a real conflict`` () =
    let repo = newTempDir ()
    let dest = newTempDir ()

    try
        File.WriteAllText(Path.Combine(dest, ".env"), "new")
        File.WriteAllText(Path.Combine(repo, ".env"), "old")

        let opts =
            { defaultOptions repo dest with
                DryRun = true }

        match restore opts neverConfirm with
        | Ok r ->
            Assert.True(r.DryRun)
            Assert.Equal("old", File.ReadAllText(Path.Combine(repo, ".env")))
        | Error message -> Assert.Fail(message)
    finally
        Directory.Delete(repo, true)
        Directory.Delete(dest, true)

[<Fact>]
let ``restore invokes confirm exactly once on a real conflict and proceeds when it returns true`` () =
    let repo = newTempDir ()
    let dest = newTempDir ()

    try
        File.WriteAllText(Path.Combine(dest, ".env"), "new")
        File.WriteAllText(Path.Combine(repo, ".env"), "old")
        let opts = defaultOptions repo dest
        let mutable callCount = 0

        let confirm () =
            callCount <- callCount + 1
            true

        match restore opts confirm with
        | Ok r ->
            Assert.Equal(1, callCount)
            Assert.False(r.Cancelled)
            Assert.Equal("new", File.ReadAllText(Path.Combine(repo, ".env")))
        | Error message -> Assert.Fail(message)
    finally
        Directory.Delete(repo, true)
        Directory.Delete(dest, true)

// ---- expandTilde error propagation ----

[<Fact>]
let ``restore propagates an expandTilde error for the source dir`` () =
    let repo = newTempDir ()
    let savedHome = Environment.GetEnvironmentVariable("HOME")

    try
        Environment.SetEnvironmentVariable("HOME", null)
        let opts = defaultOptions repo "~/backup-source"

        match restore opts neverConfirm with
        | Error message -> Assert.Contains("HOME not set", message)
        | Ok _ -> Assert.Fail("expected an error when HOME is unset for a tilde-prefixed source dir")
    finally
        Environment.SetEnvironmentVariable("HOME", savedHome)
        Directory.Delete(repo, true)
