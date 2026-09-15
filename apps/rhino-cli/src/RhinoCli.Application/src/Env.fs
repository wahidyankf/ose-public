/// Port of the slice of the Rust `env` namespace needed by
/// `env-backup.feature`'s 21 scenarios [Repo-grounded —
/// `apps/rhino-cli/src/application/env/backup.rs`,
/// `apps/rhino-cli/src/commands/env_backup.rs`].
///
/// Scope: this module ports `backup`, `env init`, and `restore`, plus the
/// helpers each (and their respective feature files' scenarios) needs. `env
/// validate-app-drift` is a separate later wave in this same namespace;
/// `discoverConfig`, `findExisting`, and `detectWorktree` are written here
/// because `backup` needs them, and are reused unchanged by `restore`. `env
/// init`'s own scan (`collectEnvExamples`) does not share `backup`'s
/// `discover`/`walkDir` machinery — it is deliberately simpler: two fixed
/// root directories, no skip-dirs list, and no file-size ceiling. `restore`
/// does share `discover`, but scans narrower than `backup`'s own scan: only
/// `.git` is skipped (not the full `defaultSkipDirs` list), matching
/// `backup.rs::restore`'s own
/// `Options { skip_dirs: vec![".git".to_string()], ..Default::default() }`.
///
/// Design decision — confirmation is real here, not a silent no-op: grepping
/// the Rust reference shows `Options.force` is threaded from the CLI args
/// into `Options` but never read inside `backup()`'s body, and `find_existing`
/// is only ever called from its own unit test — the Rust binary always
/// silently overwrites an existing backup file, regardless of `--force`. The
/// four `@env-backup-confirm` scenarios describe behaviour the current Rust
/// binary does not actually have, so `backup` below closes that gap rather
/// than reproducing it: it takes an explicit `confirm: unit -> bool`
/// callback and invokes it only when a real conflict exists in the
/// destination and `Force` is `false`. Whether to invoke the callback at all
/// is itself a pure function of `Options` and `findExisting`'s result — the
/// callback is the one deliberately impure seam — so tests can assert both
/// the decision made and that the callback fires exactly when (and only
/// when) a real decision is needed, without touching `Console.In`. `restore`
/// (below) closes the identical gap for its own `@env-restore-confirm`
/// scenarios: grepping `backup.rs::restore` shows zero references to
/// `force`, `confirm`, or any prompt at all — it always overwrites silently
/// — so `restore` also takes an explicit `confirm: unit -> bool` callback
/// with the same invoke-at-most-once-when-a-real-conflict-exists contract.
/// This PR additionally ports the `App`-surface-kind slice of `env validate`
/// (code↔`.env.example` drift detection) for
/// `env-validate-app-drift.feature`'s 3 scenarios. This PR (PR7) further
/// ports the `Terraform`/`Ansible` env-contract validators
/// (`env-contract/iac-env-validation.feature`), completing `env validate`'s
/// three-way `SurfaceKind` dispatch. This PR (PR8) ports `env staged-guard
/// validate` (`specs/env-staged-guard.feature`'s 3 scenarios) — relocated
/// into Wave B from a mis-scheduled Wave E slot, since it shares `env`'s CLI
/// namespace and `rhino-bin.sh` routes `FSHARP_NAMESPACES` on argv[0] only.
module RhinoCli.Application.Env

open System
open System.Collections.Generic
open System.Diagnostics.CodeAnalysis
open System.IO
open System.Text.Encodings.Web
open System.Text.Json
open System.Text.Json.Nodes
open System.Text.Json.Serialization
open System.Text.RegularExpressions
open YamlDotNet.Serialization
open YamlDotNet.Serialization.NamingConventions

/// Maximum file size (in bytes) that will be backed up (1 MiB) [Repo-grounded
/// — `backup.rs::DEFAULT_MAX_SIZE`].
[<Literal>]
let DefaultMaxSize: int64 = 1024L * 1024L

/// Default name of the backup directory placed outside the repository
/// [Repo-grounded — `backup.rs::DEFAULT_BACKUP_DIR`]. This is ose-public's
/// own canonical value; the private sibling's Rust constant differs and its F# port
/// must mirror whatever that repository's own constant currently is, not
/// this literal.
[<Literal>]
let DefaultBackupDir: string = "ose-public-env-backup"

/// Directory names the walker skips outright [Repo-grounded —
/// `backup.rs::default_skip_dirs`].
let defaultSkipDirs: string list =
    [ ".git"
      "node_modules"
      "bower_components"
      ".nx"
      ".next"
      ".turbo"
      ".cache"
      ".parcel-cache"
      ".nyc_output"
      "dist"
      "build"
      "coverage"
      "__pycache__"
      ".venv"
      "venv"
      "target"
      ".gradle"
      "vendor"
      "_build"
      "deps"
      ".elixir_ls"
      ".mix"
      ".dart_tool"
      ".cargo"
      "zig-cache"
      ".stack-work"
      "elm-stuff"
      "_deps"
      ".terraform"
      ".pulumi"
      "generated-contracts" ]

/// One well-known config file that `--include-config` may also back up
/// [Repo-grounded — `backup.rs::ConfigPattern`].
type ConfigPattern =
    { RelPath: string
      Description: string
      Category: string }

/// Default `--include-config` patterns [Repo-grounded —
/// `backup.rs::default_config_patterns`].
let defaultConfigPatterns: ConfigPattern list =
    [ { RelPath = ".claude/settings.local.json"
        Description = "Claude Code local settings"
        Category = "ai-tools" }
      { RelPath = ".claude/settings.local.json.bkup"
        Description = "Claude Code settings backup"
        Category = "ai-tools" }
      { RelPath = ".cursor/mcp.json"
        Description = "Cursor MCP configuration"
        Category = "ai-tools" }
      { RelPath = ".windsurfrules"
        Description = "Windsurf project rules"
        Category = "ai-tools" }
      { RelPath = ".clinerules"
        Description = "Cline project rules"
        Category = "ai-tools" }
      { RelPath = ".aider.conf.yml"
        Description = "Aider configuration"
        Category = "ai-tools" }
      { RelPath = ".aiderignore"
        Description = "Aider ignore patterns"
        Category = "ai-tools" }
      { RelPath = ".continue/config.json"
        Description = "Continue configuration"
        Category = "ai-tools" }
      { RelPath = ".gemini/settings.json"
        Description = "Gemini CLI settings"
        Category = "ai-tools" }
      { RelPath = ".amazonq/mcp.json"
        Description = "Amazon Q MCP configuration"
        Category = "ai-tools" }
      { RelPath = ".roomodes"
        Description = "Roo Code custom modes"
        Category = "ai-tools" }
      { RelPath = "docker-compose.override.yml"
        Description = "Docker Compose local overrides"
        Category = "docker" }
      { RelPath = "mise.local.toml"
        Description = "mise local overrides"
        Category = "version-mgrs" }
      { RelPath = ".envrc"
        Description = "direnv environment setup"
        Category = "environment" } ]

/// One file discovered during a scan, and its copy outcome [Repo-grounded —
/// `backup.rs::FileEntry`]. `Reason`/`Source` use `""` (rather than `option`)
/// as their unset sentinel, mirroring the Rust struct's `String` fields and
/// its `f.source.is_empty()`/`f.reason` emptiness checks in the reporters.
type EnvFileEntry =
    { RelPath: string
      AbsPath: string
      Size: int64
      Skipped: bool
      Reason: string
      Source: string }

/// Options for a [`backup`] operation [Repo-grounded — `backup.rs::Options`].
/// `Force` is threaded here (unlike the never-read Rust field it mirrors —
/// see the module doc comment) because `backup` below genuinely reads it.
type EnvOptions =
    { RepoRoot: string
      BackupDir: string
      SkipDirs: string list
      MaxSize: int64
      WorktreeAware: bool
      WorktreeName: string
      Force: bool
      IncludeConfig: bool
      DryRun: bool }

/// Outcome of a [`backup`] operation [Repo-grounded — `backup.rs::Result`].
/// Named `EnvOperationResult` rather than `Result` to avoid colliding with
/// `FSharp.Core.Result`.
type EnvOperationResult =
    { Direction: string
      Dir: string
      Files: EnvFileEntry list
      Copied: int
      Skipped: int
      Errors: string list
      WorktreeName: string
      Cancelled: bool
      DryRun: bool }

/// Expands a leading `~` in `path` to the value of the `HOME` environment
/// variable; returns `path` unchanged when it does not start with `~`
/// [Repo-grounded — `backup.rs::expand_tilde`].
///
/// # Errors
///
/// Returns an error when `path` starts with `~` but `HOME` is not set.
// Coverage boundary: ambient HOME lookup is exercised by Env Integration and published-process E2E proof.
[<ExcludeFromCodeCoverage>]
let expandTilde (path: string) : Result<string, string> =
    if not (path.StartsWith("~", StringComparison.Ordinal)) then
        Ok path
    else
        match Environment.GetEnvironmentVariable("HOME") with
        | null -> Error "HOME not set"
        | home ->
            let tail = path.Substring(1)

            if tail.StartsWith("/", StringComparison.Ordinal) then
                Ok(Path.Combine(home, tail.Substring(1)))
            elif tail = "" then
                Ok home
            else
                Ok(Path.Combine(home, tail))

/// Splits `path` into its non-empty components, tolerating either separator.
let private pathComponents (path: string) : string list =
    path.Split('/', '\\')
    |> Array.filter (fun segment -> segment <> "")
    |> List.ofArray

/// `true` when `backupDir` is `repoRoot` or a subdirectory of it, compared
/// component-wise on the raw (non-canonicalized) strings — mirroring Rust's
/// `Path::strip_prefix` [Repo-grounded — `backup.rs::is_inside_repo`].
let isInsideRepo (backupDir: string) (repoRoot: string) : bool =
    let backupParts = pathComponents backupDir
    let rootParts = pathComponents repoRoot

    rootParts.Length <= backupParts.Length
    && (backupParts |> List.take rootParts.Length) = rootParts

/// Canonicalizes `path`, falling back to the nearest existing ancestor when
/// `path` itself (or its trailing components) does not yet exist on disk
/// [Repo-grounded — `backup.rs::canonicalize_best_effort`].
///
/// A user-supplied `--dir` for `env backup` is frequently a directory that
/// has not been created yet, so a plain "canonicalize or fall back to the
/// raw path" approach would silently compare a non-canonical `backup_dir`
/// against a canonical `repo_root` in [`isInsideRepo`], defeating the safety
/// guard that check exists for (the same physical-vs-logical-path reasoning
/// `GitRoot.fs`'s module doc comment describes for macOS's `/private/var`).
/// This walks up to the nearest existing ancestor, resolves that ancestor's
/// full path, and rejoins the missing trailing components.
///
/// Existing components are resolved one at a time so directory symlinks in
/// the middle of a path are honoured too. This matters on macOS, where the
/// temp directory commonly enters through `/var` or `/tmp` while Git reports
/// the same repository below `/private/var` or `/private/tmp`.
///
/// # Errors
///
/// Returns an error when no ancestor of `path` exists, which should not
/// happen for any path derived from an absolute filesystem location.
// Coverage boundary: filesystem/symlink canonicalization is exercised by Env Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let private resolveExistingComponents (existingPath: string) : string =
    let fullPath = Path.GetFullPath existingPath
    let root = Path.GetPathRoot fullPath

    fullPath.Substring(root.Length).Split(Path.DirectorySeparatorChar, StringSplitOptions.RemoveEmptyEntries)
    |> Array.fold
        (fun current segment ->
            let candidate = Path.Combine(current, segment)

            let target =
                if Directory.Exists candidate then
                    let info = DirectoryInfo candidate

                    if isNull info.LinkTarget then
                        null
                    else
                        info.ResolveLinkTarget(true)
                elif File.Exists candidate then
                    let info = FileInfo candidate

                    if isNull info.LinkTarget then
                        null
                    else
                        info.ResolveLinkTarget(true)
                else
                    null

            if isNull target then candidate else target.FullName)
        root

// Coverage boundary: symlink resolution is exercised by Env Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let canonicalizeBestEffort (path: string) : Result<string, string> =
    if Directory.Exists path || File.Exists path then
        Ok(resolveExistingComponents path)
    else
        let rec walk (cursor: string) (tail: string list) : Result<string, string> =
            match Path.GetDirectoryName cursor with
            | null
            | "" -> Error(sprintf "no existing ancestor found while canonicalizing %s" path)
            | parent ->
                let name = Path.GetFileName cursor
                let tail = if name = "" then tail else name :: tail

                if Directory.Exists parent || File.Exists parent then
                    let canonicalParent = resolveExistingComponents parent

                    Ok(
                        tail
                        |> List.fold (fun acc segment -> Path.Combine(acc, segment)) canonicalParent
                    )
                else
                    walk parent tail

        walk path []

/// `true` for files that belong in a secret backup [Repo-grounded —
/// `backup.rs::is_secret_file`]: `.env`/`.env.*`, `secrets.json`, anything
/// under `.secrets/`, or a `.pem`/`.key`/`.crt`/`.pfx` file.
let isSecretFile (rel: string) (baseName: string) : bool =
    if
        baseName.StartsWith(".env", StringComparison.Ordinal)
        || baseName = "secrets.json"
        || rel.StartsWith(".secrets/", StringComparison.Ordinal)
    then
        true
    else
        let rawExt = Path.GetExtension baseName

        let ext =
            if rawExt.StartsWith(".", StringComparison.Ordinal) then
                rawExt.Substring(1)
            else
                // `Path.GetExtension` returns either an empty string or a dot-prefixed extension.
                rawExt

        match ext with
        | "pem"
        | "key"
        | "crt"
        | "pfx" -> true
        | _ -> false

/// `true` when a symlink is present at `path` [Repo-grounded —
/// `backup.rs::discover`'s `meta.file_type().is_symlink()` check].
// Coverage boundary: real file metadata inspection is exercised by Env Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let private isSymlink (path: string) : bool =
    match FileInfo(path).LinkTarget with
    | null -> false
    | _ -> true

/// Recursively walks `dir`, returning every secret-shaped file under it.
/// Hidden directories are skipped entirely except `.secrets/`, which is
/// descended; directories named in `skipDirs` are likewise skipped
/// [Repo-grounded — `backup.rs::discover`].
// Coverage boundary: recursive filesystem walking is exercised by Env Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let rec private walkDir (repoRoot: string) (skipDirs: Set<string>) (maxSize: int64) (dir: string) : EnvFileEntry list =
    let fileEntries =
        Directory.EnumerateFiles dir
        |> Seq.choose (fun filePath ->
            let baseName = Path.GetFileName filePath
            let rel = Path.GetRelativePath(repoRoot, filePath).Replace('\\', '/')

            if not (isSecretFile rel baseName) then
                None
            elif isSymlink filePath then
                Some
                    { RelPath = rel
                      AbsPath = filePath
                      Size = 0L
                      Skipped = true
                      Reason = "symlink"
                      Source = "" }
            else
                let size = FileInfo(filePath).Length

                if size > maxSize then
                    Some
                        { RelPath = rel
                          AbsPath = filePath
                          Size = size
                          Skipped = true
                          Reason = "exceeds 1 MB"
                          Source = "" }
                else
                    Some
                        { RelPath = rel
                          AbsPath = filePath
                          Size = size
                          Skipped = false
                          Reason = ""
                          Source = "" })
        |> List.ofSeq

    let dirEntries =
        Directory.EnumerateDirectories dir
        |> Seq.collect (fun subDir ->
            let baseName = Path.GetFileName subDir

            if baseName.StartsWith(".", StringComparison.Ordinal) then
                let relDir = Path.GetRelativePath(repoRoot, subDir).Replace('\\', '/')

                if relDir = ".secrets" then
                    walkDir repoRoot skipDirs maxSize subDir
                else
                    []
            elif Set.contains baseName skipDirs then
                []
            else
                walkDir repoRoot skipDirs maxSize subDir)
        |> List.ofSeq

    fileEntries @ dirEntries

/// Walks `opts.RepoRoot` and returns every `.env*`/secret-shaped file found,
/// sorted by relative path [Repo-grounded — `backup.rs::discover`].
// Coverage boundary: local discovery is exercised by Env Integration and published-process E2E proof.
[<ExcludeFromCodeCoverage>]
let discover (opts: EnvOptions) : EnvFileEntry list =
    let maxSize = if opts.MaxSize <= 0L then DefaultMaxSize else opts.MaxSize

    let skipDirs =
        if List.isEmpty opts.SkipDirs then
            Set.ofList defaultSkipDirs
        else
            Set.ofList opts.SkipDirs

    walkDir opts.RepoRoot skipDirs maxSize opts.RepoRoot
    |> List.sortWith (fun a b -> String.CompareOrdinal(a.RelPath, b.RelPath))

/// Checks each `ConfigPattern` relative to `repoRoot` and returns entries for
/// any that exist on disk, sorted by relative path [Repo-grounded —
/// `backup.rs::discover_config`].
// Coverage boundary: config-file discovery is exercised by Env Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let discoverConfig (repoRoot: string) (patterns: ConfigPattern list) (maxSize: int64) : EnvFileEntry list =
    let effectiveMax = if maxSize <= 0L then DefaultMaxSize else maxSize

    patterns
    |> List.choose (fun pattern ->
        let abs = Path.Combine(repoRoot, pattern.RelPath)

        if Directory.Exists abs || not (File.Exists abs) then
            None
        elif isSymlink abs then
            Some
                { RelPath = pattern.RelPath
                  AbsPath = abs
                  Size = 0L
                  Skipped = true
                  Reason = "symlink"
                  Source = "config" }
        else
            let size = FileInfo(abs).Length

            if size > effectiveMax then
                Some
                    { RelPath = pattern.RelPath
                      AbsPath = abs
                      Size = size
                      Skipped = true
                      Reason = sprintf "file too large (%d bytes > %d)" size effectiveMax
                      Source = "config" }
            else
                Some
                    { RelPath = pattern.RelPath
                      AbsPath = abs
                      Size = size
                      Skipped = false
                      Reason = ""
                      Source = "config" })
    |> List.sortWith (fun a b -> String.CompareOrdinal(a.RelPath, b.RelPath))

/// Returns the relative paths of the non-skipped `entries` that already
/// exist under `destRoot` [Repo-grounded — `backup.rs::find_existing`].
// Coverage boundary: destination filesystem inspection is exercised by Env Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let findExisting (entries: EnvFileEntry list) (destRoot: string) : string list =
    entries
    |> List.filter (fun e -> not e.Skipped)
    |> List.choose (fun e ->
        let dst = Path.Combine(destRoot, e.RelPath)

        if File.Exists dst || Directory.Exists dst then
            Some e.RelPath
        else
            None)

/// Whether a repository root is a linked Git worktree [Repo-grounded —
/// `backup.rs::WorktreeInfo`].
type WorktreeInfo =
    { IsWorktree: bool
      WorktreeName: string }

/// Detects whether `repoRoot` is a linked Git worktree by inspecting its
/// `.git` entry: a regular checkout has `.git` as a directory, a linked
/// worktree has `.git` as a file starting with `"gitdir:"` [Repo-grounded —
/// `backup.rs::detect_worktree`].
///
/// # Errors
///
/// Returns an error when `.git` does not exist at `repoRoot`, or when it
/// exists as a file that does not start with `"gitdir:"`.
// Coverage boundary: real Git worktree inspection is exercised by Env Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let detectWorktree (repoRoot: string) : Result<WorktreeInfo, string> =
    let gitPath = Path.Combine(repoRoot, ".git")
    let name = Path.GetFileName(repoRoot.TrimEnd('/', '\\'))

    if Directory.Exists gitPath then
        Ok
            { IsWorktree = false
              WorktreeName = name }
    elif File.Exists gitPath then
        let line = (File.ReadAllText gitPath).Trim()

        if line.StartsWith("gitdir:", StringComparison.Ordinal) then
            Ok
                { IsWorktree = true
                  WorktreeName = name }
        else
            Error(sprintf ".git file does not start with 'gitdir:' (got: %s)" line)
    else
        Error(sprintf "no .git found at %s" repoRoot)

/// Running total kept while copying `backup`'s discovered entries.
type private CopyAcc =
    { Copied: int
      Skipped: int
      Errors: string list }

/// Pure confirmation parser shared by the public CLI and Unit policy proof.
let isAffirmativeConfirmation (answer: string option) : bool =
    match answer with
    | Some value ->
        value.Equals("y", StringComparison.OrdinalIgnoreCase)
        || value.Equals("yes", StringComparison.OrdinalIgnoreCase)
    | None -> false

/// Plans the resource-independent part of backup/restore: dry-run,
/// conflict confirmation, cancellation, and the expected copy/skip counts.
/// Filesystem adapters execute the planned copies afterwards.
let planEnvOperation
    (direction: string)
    (directory: string)
    (entries: EnvFileEntry list)
    (existing: string list)
    (force: bool)
    (dryRun: bool)
    (worktreeName: string)
    (confirm: unit -> bool)
    : EnvOperationResult =
    let skipped = entries |> List.filter (fun entry -> entry.Skipped) |> List.length

    if dryRun then
        { Direction = direction
          Dir = directory
          Files = entries
          Copied = 0
          Skipped = skipped
          Errors = []
          WorktreeName = worktreeName
          Cancelled = false
          DryRun = true }
    elif not force && not (List.isEmpty existing) && not (confirm ()) then
        { Direction = direction
          Dir = directory
          Files = entries
          Copied = 0
          Skipped = 0
          Errors = []
          WorktreeName = worktreeName
          Cancelled = true
          DryRun = false }
    else
        { Direction = direction
          Dir = directory
          Files = entries
          Copied = entries.Length - skipped
          Skipped = skipped
          Errors = []
          WorktreeName = worktreeName
          Cancelled = false
          DryRun = false }

/// Copies one entry into `destRoot`, folding its outcome into `acc`
/// [Repo-grounded — `backup.rs::backup`'s per-entry copy loop].
// Coverage boundary: real directory creation and copying are exercised by Env Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let private copyOne (destRoot: string) (acc: CopyAcc) (e: EnvFileEntry) : CopyAcc =
    if e.Skipped then
        { acc with Skipped = acc.Skipped + 1 }
    else
        let dst = Path.Combine(destRoot, e.RelPath)

        try
            match Path.GetDirectoryName dst with
            | null
            | "" -> ()
            | parent -> Directory.CreateDirectory parent |> ignore

            File.Copy(e.AbsPath, dst, true)
            { acc with Copied = acc.Copied + 1 }
        with ex ->
            { acc with
                Skipped = acc.Skipped + 1
                Errors = acc.Errors @ [ sprintf "copy %s: %s" e.RelPath ex.Message ] }

/// Copies `.env*` files (and optionally config files) from
/// `opts.RepoRoot` to `opts.BackupDir` [Repo-grounded — `backup.rs::backup`].
///
/// `confirm` is invoked at most once, and only when the destination already
/// contains at least one of the non-skipped discovered files and
/// `opts.Force` is `false` — see the module doc comment for why this is a
/// real decision here rather than the dead `force` field it is ported from.
///
/// # Errors
///
/// Returns an error when `opts.BackupDir` (after tilde expansion) is inside
/// `opts.RepoRoot`.
// Coverage boundary: real discovery/copy/confirmation composition is exercised by Env Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let backup (opts: EnvOptions) (confirm: unit -> bool) : Result<EnvOperationResult, string> =
    match expandTilde opts.BackupDir with
    | Error message -> Error message
    | Ok expandedBackupDir ->
        let comparisonRepoRoot =
            canonicalizeBestEffort opts.RepoRoot |> Result.defaultValue opts.RepoRoot

        let comparisonBackupDir =
            canonicalizeBestEffort expandedBackupDir
            |> Result.defaultValue expandedBackupDir

        if isInsideRepo comparisonBackupDir comparisonRepoRoot then
            Error(
                sprintf
                    "backup dir %s is inside repo root %s; choose a directory outside the repo"
                    expandedBackupDir
                    opts.RepoRoot
            )
        else
            let maxSize = if opts.MaxSize <= 0L then DefaultMaxSize else opts.MaxSize

            let discoverOpts =
                { opts with
                    BackupDir = expandedBackupDir
                    MaxSize = maxSize }

            let envEntries = discover discoverOpts

            let entries =
                if opts.IncludeConfig then
                    let tagged =
                        envEntries
                        |> List.map (fun e -> if e.Source = "" then { e with Source = "env" } else e)

                    let configEntries = discoverConfig opts.RepoRoot defaultConfigPatterns maxSize

                    tagged @ configEntries
                    |> List.sortWith (fun a b -> String.CompareOrdinal(a.RelPath, b.RelPath))
                else
                    envEntries

            let destRoot =
                if opts.WorktreeAware && opts.WorktreeName <> "" then
                    Path.Combine(expandedBackupDir, opts.WorktreeName)
                else
                    expandedBackupDir

            let existing = if opts.DryRun then [] else findExisting entries destRoot

            let plan =
                planEnvOperation
                    "backup"
                    expandedBackupDir
                    entries
                    existing
                    opts.Force
                    opts.DryRun
                    opts.WorktreeName
                    confirm

            if plan.DryRun || plan.Cancelled then
                Ok plan
            else
                Directory.CreateDirectory destRoot |> ignore

                let finalAcc =
                    entries |> List.fold (copyOne destRoot) { Copied = 0; Skipped = 0; Errors = [] }

                Ok
                    { plan with
                        Copied = finalAcc.Copied
                        Skipped = finalAcc.Skipped
                        Errors = finalAcc.Errors }

// ---- Reporters ----

/// Capitalises the first character of `s`, leaving the rest unchanged
/// [Repo-grounded — `backup.rs::capitalize`].
let capitalize (s: string) : string =
    if s = "" then
        ""
    else
        (Char.ToUpperInvariant s.[0]).ToString() + s.Substring(1)

/// Formats an [`EnvOperationResult`] as human-readable text [Repo-grounded —
/// `backup.rs::format_text`]. When `quiet` is `true`, per-file lines are
/// suppressed. Skipped secret-shaped files are warnings and are always
/// listed in normal output; `verbose` remains accepted for CLI compatibility.
let formatText (r: EnvOperationResult) (verbose: bool) (quiet: bool) : string =
    if r.Cancelled then
        let label = if r.Direction = "" then "operation" else r.Direction
        sprintf "%s cancelled.\n" (capitalize label)
    else
        let sb = Text.StringBuilder()

        if not quiet then
            let action = if r.DryRun then "WOULD" else r.Direction.ToUpperInvariant()

            for f in r.Files do
                if f.Skipped then
                    let label = if verbose then "SKIPPED" else "WARNING"
                    sb.Append(sprintf "  %s  %s  (%s)\n" label f.RelPath f.Reason) |> ignore
                else
                    let tag = if f.Source = "config" then " [config]" else ""
                    sb.Append(sprintf "  %s  %s%s\n" action f.RelPath tag) |> ignore

            for e in r.Errors do
                sb.Append(sprintf "  WARNING  %s\n" e) |> ignore

        let label = if r.Direction = "" then "processed" else r.Direction

        if r.DryRun then
            let wouldCount = r.Files |> List.filter (fun f -> not f.Skipped) |> List.length

            sb.Append(sprintf "Dry-run %s: %d file(s) would be %sd, %d skipped" label wouldCount label r.Skipped)
            |> ignore
        else
            sb.Append(sprintf "%s complete: %d file(s) %sd, %d skipped" (capitalize label) r.Copied label r.Skipped)
            |> ignore

        let configCount =
            r.Files
            |> List.filter (fun f -> f.Source = "config" && not f.Skipped)
            |> List.length

        if configCount > 0 then
            sb.Append(sprintf " (%d config)" configCount) |> ignore

        if r.WorktreeName <> "" then
            sb.Append(sprintf "  [worktree: %s]" r.WorktreeName) |> ignore

        sb.Append('\n') |> ignore
        sb.ToString()

let private jsonOptions: JsonSerializerOptions =
    let opts = JsonSerializerOptions()
    opts.WriteIndented <- true
    opts.Encoder <- JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    opts

/// Serialises an [`EnvOperationResult`] to a pretty-printed JSON string,
/// byte-identical to the Rust CLI's own output [Repo-grounded —
/// `backup.rs::format_json`, `JsonOut`, `JsonEntry`]. Built field-by-field on
/// a `JsonObject` (which preserves insertion order) rather than through
/// `System.Text.Json`'s reflection-based record serializer, because Rust's
/// `#[serde(skip_serializing_if = ...)]` omits several fields when they carry
/// their zero/empty value — `System.Text.Json`'s built-in
/// `JsonIgnoreCondition.WhenWritingDefault`/`WhenWritingNull` do not treat an
/// empty string as "default" for a reference type, so matching Rust's
/// omissions exactly requires constructing the tree by hand.
let formatJson (r: EnvOperationResult) : string =
    let entryNode (f: EnvFileEntry) : JsonNode =
        let node = JsonObject()
        node.["relPath"] <- JsonValue.Create(f.RelPath)

        if f.Size <> 0L then
            node.["size"] <- JsonValue.Create(f.Size)

        if f.Skipped then
            node.["skipped"] <- JsonValue.Create(f.Skipped)

        if f.Reason <> "" then
            node.["reason"] <- JsonValue.Create(f.Reason)

        if f.Source <> "" then
            node.["source"] <- JsonValue.Create(f.Source)

        node :> JsonNode

    let root = JsonObject()
    root.["direction"] <- JsonValue.Create(r.Direction)
    root.["dir"] <- JsonValue.Create(r.Dir)
    root.["files"] <- JsonArray(r.Files |> List.map entryNode |> Array.ofList)
    root.["copied"] <- JsonValue.Create(r.Copied)
    root.["skipped"] <- JsonValue.Create(r.Skipped)

    if not (List.isEmpty r.Errors) then
        root.["errors"] <- JsonArray(r.Errors |> List.map (fun e -> JsonValue.Create(e) :> JsonNode) |> Array.ofList)

    if r.WorktreeName <> "" then
        root.["worktreeName"] <- JsonValue.Create(r.WorktreeName)

    if r.Cancelled then
        root.["cancelled"] <- JsonValue.Create(r.Cancelled)

    root.ToJsonString(jsonOptions)

/// Formats an [`EnvOperationResult`] as a Markdown report [Repo-grounded —
/// `backup.rs::format_markdown`].
let formatMarkdown (r: EnvOperationResult) : string =
    let sb = Text.StringBuilder()
    let action = capitalize r.Direction
    sb.Append(sprintf "## %s Report\n\n" action) |> ignore
    sb.Append(sprintf "**Directory**: `%s`\n\n" r.Dir) |> ignore

    sb.Append(sprintf "**Copied**: %d | **Skipped**: %d\n\n" r.Copied r.Skipped)
    |> ignore

    if r.WorktreeName <> "" then
        sb.Append(sprintf "**Worktree**: `%s`\n\n" r.WorktreeName) |> ignore

    if r.Cancelled then
        let label = if r.Direction = "" then "operation" else r.Direction
        sb.Append(sprintf "_%s cancelled._\n" (capitalize label)) |> ignore
        sb.ToString()
    elif List.isEmpty r.Files then
        sb.Append("_No .env files found._\n") |> ignore
        sb.ToString()
    else
        let hasConfig = r.Files |> List.exists (fun f -> f.Source = "config")

        if hasConfig then
            sb.Append("| File | Size (bytes) | Source | Status | Reason |\n") |> ignore
            sb.Append("|------|-------------|--------|--------|--------|\n") |> ignore
        else
            sb.Append("| File | Size (bytes) | Status | Reason |\n") |> ignore
            sb.Append("|------|-------------|--------|--------|\n") |> ignore

        for f in r.Files do
            let status = if f.Skipped then "skipped" else "copied"
            let reason = if f.Skipped then f.Reason else ""
            let display = f.RelPath.Replace('\\', '/')

            if hasConfig then
                let source = if f.Source = "" then "env" else f.Source

                sb.Append(sprintf "| `%s` | %d | %s | %s | %s |\n" display f.Size source status reason)
                |> ignore
            else
                sb.Append(sprintf "| `%s` | %d | %s | %s |\n" display f.Size status reason)
                |> ignore

        if not (List.isEmpty r.Errors) then
            sb.Append("\n### Warnings\n") |> ignore

            for e in r.Errors do
                sb.Append(sprintf "- %s\n" e) |> ignore

        sb.ToString()

// ---- env init ----

/// Directories under a repo root that `env init` scans for `.env.example`
/// files [Repo-grounded — `env_init.rs::SCAN_ROOTS`]. Deliberately not
/// `backup`'s `discover`/`walkDir`: this scan is two fixed roots, with no
/// skip-dirs list and no file-size ceiling — see the module doc comment.
let envInitScanRoots: string list = [ "infra/dev"; "apps" ]

/// The tier `env init` bootstraps: local development, never committed
/// [Repo-grounded — `env_init.rs::ENV_TIER_DEFAULT`].
[<Literal>]
let EnvInitTargetTier: string = ".env.local"

/// Recursively finds every `.env.example` file under `dir`, in a single pass
/// over the raw filesystem listing rather than files-then-subdirectories
/// [Repo-grounded — `env_init.rs::collect_examples`'s use of `WalkDir`, whose
/// default traversal recurses into each directory entry immediately upon
/// encountering it in `readdir()` order, rather than deferring every
/// directory until every file at the same level is visited]. A prior version
/// of this function enumerated files before subdirectories, which is a
/// stronger ordering guarantee than either language's underlying walk
/// actually provides, and diverged from the Rust CLI's real output order
/// whenever a directory's native `readdir()` listing put a subdirectory
/// entry ahead of a file entry — observed for `apps/ayokoding-www` in this
/// checkout, whose `.env.example` sorts alphabetically before `content/` but
/// is returned after it by both runtimes' unsorted directory enumeration.
// Coverage boundary: recursive example discovery is exercised by Env Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let rec private walkForExamples (dir: string) : string list =
    Directory.EnumerateFileSystemEntries dir
    |> Seq.collect (fun entry ->
        if Directory.Exists entry then walkForExamples entry
        elif Path.GetFileName entry = ".env.example" then [ entry ]
        else [])
    |> List.ofSeq

/// Collects every `.env.example` file found under `envInitScanRoots` inside
/// `repoRoot` [Repo-grounded — `env_init.rs::collect_examples`].
// Coverage boundary: root filesystem discovery is exercised by Env Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let collectEnvExamples (repoRoot: string) : string list =
    envInitScanRoots
    |> List.collect (fun root ->
        let scanDir = Path.Combine(repoRoot, root)

        if Directory.Exists scanDir then
            walkForExamples scanDir
        else
            [])

/// Computes the `.env.local` path that sits alongside `examplePath`, in the
/// same directory [Repo-grounded — `env_init.rs::target_env_path`]. Unlike
/// the Rust original this returns a plain `string` rather than an `Option`:
/// every `examplePath` this module passes in comes from `collectEnvExamples`
/// walking real files on disk, so it always has a parent directory.
let targetEnvPath (examplePath: string) : string =
    Path.Combine(Path.GetDirectoryName examplePath, EnvInitTargetTier)

/// One discovered `.env.example` file's copy outcome [Repo-grounded —
/// `env_init.rs::run`'s per-file `println!` branches].
type EnvInitFileOutcome =
    | EnvInitCreated of relPath: string * exampleFileName: string
    | EnvInitSkipped of relPath: string

/// Outcome of an `env init` operation [Repo-grounded — `env_init.rs::run`].
type EnvInitResult =
    { Files: EnvInitFileOutcome list
      Created: int
      Skipped: int }

let planEnvInit
    (repoRoot: string)
    (examples: string list)
    (targetExists: string -> bool)
    (force: bool)
    : EnvInitResult =
    let outcomes =
        examples
        |> List.map (fun examplePath ->
            let envPath = targetEnvPath examplePath
            let rel = Path.GetRelativePath(repoRoot, envPath).Replace('\\', '/')

            if not force && targetExists envPath then
                EnvInitSkipped rel
            else
                EnvInitCreated(rel, Path.GetFileName examplePath))

    let created =
        outcomes
        |> List.filter (function
            | EnvInitCreated _ -> true
            | EnvInitSkipped _ -> false)
        |> List.length

    { Files = outcomes
      Created = created
      Skipped = outcomes.Length - created }

/// Copies every `.env.example` file found under `repoRoot` to its sibling
/// `.env.local`, skipping files that already exist unless `force` is `true`
/// [Repo-grounded — `env_init.rs::run`]. Unlike `backup`, this has no
/// `Result` wrapper: `env_init.rs::run`'s only failure mode is git-root
/// discovery, which this port's callers (mirroring `backup`'s `EnvOptions`)
/// handle by passing `repoRoot` in directly rather than looking it up here.
// Coverage boundary: real `.env.example` discovery/copy is exercised by Env Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let runEnvInit (repoRoot: string) (force: bool) : EnvInitResult =
    let examples = collectEnvExamples repoRoot

    let result =
        planEnvInit repoRoot examples (fun path -> File.Exists path || Directory.Exists path) force

    List.zip examples result.Files
    |> List.iter (fun (examplePath, outcome) ->
        match outcome with
        | EnvInitCreated _ -> File.Copy(examplePath, targetEnvPath examplePath, true)
        | EnvInitSkipped _ -> ())

    result

/// Formats an [`EnvInitResult`] as human-readable text [Repo-grounded —
/// `env_init.rs::run`'s `println!` calls]. `env init` has no JSON/Markdown
/// Gherkin scenario, so unlike `backup`'s `formatText`/`formatJson`/
/// `formatMarkdown` trio this is the only formatter it needs.
let formatEnvInitText (r: EnvInitResult) : string =
    let sb = Text.StringBuilder()

    for f in r.Files do
        match f with
        | EnvInitCreated(rel, exampleFileName) ->
            sb.Append(sprintf "Created: %s (from %s)\n" rel exampleFileName) |> ignore
        | EnvInitSkipped rel ->
            sb.Append(sprintf "Skipped: %s (already exists, use --force to overwrite)\n" rel)
            |> ignore

    sb.Append(sprintf "\nSummary: %d created, %d skipped\n" r.Created r.Skipped)
    |> ignore

    sb.ToString()

// ---- restore ----

/// Copies `.env*` files (and optionally config files) from a backup
/// directory back into the repository [Repo-grounded — `backup.rs::restore`].
///
/// Scans the source directory with [`discover`], but narrower than
/// `backup`'s own scan — see the module doc comment for why only `.git` is
/// skipped here rather than the full `defaultSkipDirs` list.
///
/// `confirm` is invoked at most once, and only when the destination already
/// contains at least one of the restore candidates and `opts.Force` is
/// `false` — see the module doc comment for why this is a real decision here
/// rather than the confirm/force gap `backup.rs::restore` never has at all.
/// Dry-run never invokes `confirm`: there is nothing to write, so the
/// per-entry copy loop is skipped outright rather than reaching a real
/// decision point.
///
/// # Errors
///
/// Returns an error when the source directory (`opts.BackupDir`, joined with
/// `opts.WorktreeName` when `opts.WorktreeAware` is set) does not exist.
// Coverage boundary: real restore discovery/copy is exercised by Env Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let restore (opts: EnvOptions) (confirm: unit -> bool) : Result<EnvOperationResult, string> =
    match expandTilde opts.BackupDir with
    | Error message -> Error message
    | Ok expandedBackupDir ->
        let srcRoot =
            if opts.WorktreeAware && opts.WorktreeName <> "" then
                Path.Combine(expandedBackupDir, opts.WorktreeName)
            else
                expandedBackupDir

        if not (Directory.Exists srcRoot) then
            Error(sprintf "backup dir does not exist: %s" srcRoot)
        else
            let maxSize = if opts.MaxSize <= 0L then DefaultMaxSize else opts.MaxSize

            let discoverOpts: EnvOptions =
                { RepoRoot = srcRoot
                  BackupDir = ""
                  SkipDirs = [ ".git" ]
                  MaxSize = maxSize
                  WorktreeAware = false
                  WorktreeName = ""
                  Force = false
                  IncludeConfig = false
                  DryRun = false }

            let discovered = discover discoverOpts

            let entries =
                if opts.IncludeConfig then
                    let tagged =
                        discovered
                        |> List.map (fun e -> if e.Source = "" then { e with Source = "env" } else e)

                    let configEntries = discoverConfig srcRoot defaultConfigPatterns maxSize

                    tagged @ configEntries
                    |> List.sortWith (fun a b -> String.CompareOrdinal(a.RelPath, b.RelPath))
                else
                    discovered

            // Mirrors `backup.rs::restore`'s per-entry `if e.source != "config"
            // && !is_secret_file(...) { continue; }` check: entries from
            // `discover` are already secret-shaped (it pre-filters), so this
            // matters only for `discoverConfig` entries, which bypass
            // `isSecretFile` entirely.
            let restoreCandidates =
                entries
                |> List.filter (fun e ->
                    let baseName = Path.GetFileName e.RelPath
                    e.Source = "config" || isSecretFile e.RelPath baseName)

            let existing =
                if opts.DryRun then
                    []
                else
                    findExisting restoreCandidates opts.RepoRoot

            let plan =
                planEnvOperation
                    "restore"
                    expandedBackupDir
                    restoreCandidates
                    existing
                    opts.Force
                    opts.DryRun
                    opts.WorktreeName
                    confirm

            if plan.DryRun || plan.Cancelled then
                Ok plan
            else
                let finalAcc =
                    restoreCandidates
                    |> List.fold (copyOne opts.RepoRoot) { Copied = 0; Skipped = 0; Errors = [] }

                Ok
                    { plan with
                        Copied = finalAcc.Copied
                        Skipped = finalAcc.Skipped
                        Errors = finalAcc.Errors }

// ---- validate ----

/// Surface kind selecting which drift validator runs for one `env-contract:`
/// surface entry, deserialized case-insensitively from the lowercase `kind:`
/// value in `repo-config.yml` [Repo-grounded —
/// `apps/rhino-cli/src/application/env/validate.rs::SurfaceKind`].
///
/// All three variants dispatch to a real validator in `validateAll` below:
/// `App` to `validateAppSurface`, `Terraform` to `validateTerraform`, and
/// `Ansible` to `validateAnsible`.
type SurfaceKind =
    | App
    | Terraform
    | Ansible

/// A single env-validate surface entry from the `env-contract:` section
/// [Repo-grounded — `validate.rs::SurfaceConfig`].
type SurfaceConfig =
    {
        Root: string
        Kind: SurfaceKind
        /// Source language for the app validator: `"rust"`, `"typescript"`,
        /// `"fsharp"`, or `"go"`. Unused for `Terraform`/`Ansible` surfaces.
        /// Defaults to
        /// `""` when the YAML key is absent.
        Lang: string
        /// Keys intentionally exempt from drift detection (framework-injected,
        /// forward-declared-ahead-of-use, test-only, etc.).
        Allowlist: string list
    }

/// Top-level `env-contract:` structure [Repo-grounded —
/// `validate.rs::Contract`].
type Contract = { Surfaces: SurfaceConfig list }

/// Drift direction for a [`Finding`] [Repo-grounded —
/// `validate.rs::DriftKind`]. `DeclaredButUnread`/`ReadButUndeclared` are
/// produced by the `App`-surface validator below; `ExampleNotDeclared`/
/// `RequiredMissingFromExample` are produced by `validateTerraform`, and
/// `ConsumedNotDeclared` by `validateAnsible`.
type DriftKind =
    /// App: key present in `.env.example` but not consumed by any code in
    /// the surface.
    | DeclaredButUnread
    /// App: key consumed by code but absent from `.env.example`.
    | ReadButUndeclared
    /// Terraform: key in `terraform.tfvars.example` with no matching
    /// `variable` block.
    | ExampleNotDeclared
    /// Terraform: required variable (no `default`) missing from
    /// `terraform.tfvars.example`.
    | RequiredMissingFromExample
    /// Ansible: env lookup in a playbook not declared in `.env.example`.
    | ConsumedNotDeclared

/// Human-readable labels for [`DriftKind`], matching the Rust CLI's own
/// wording [Repo-grounded — `validate.rs::DriftKind::label`].
module DriftKind =
    let label (drift: DriftKind) : string =
        match drift with
        | DeclaredButUnread -> "declared-but-unread"
        | ReadButUndeclared -> "read-but-undeclared"
        | ExampleNotDeclared -> "example-not-declared"
        | RequiredMissingFromExample -> "required-missing-from-example"
        | ConsumedNotDeclared -> "consumed-not-declared"

/// A single drift finding produced by the validator [Repo-grounded —
/// `validate.rs::Finding`]. `Root` is a repo-relative path string (e.g.
/// `"apps/organiclever-be"`) — Rust uses `PathBuf`, but nothing downstream
/// here needs path-specific operations on it, so a plain string suffices.
type Finding =
    { Root: string
      Drift: DriftKind
      Key: string }

/// Formats one drift finding, matching the Rust CLI's own `DRIFT root label
/// key` output line shape [Repo-grounded — `commands/env_validate.rs`].
let formatFinding (finding: Finding) : string =
    sprintf "DRIFT  %s  %s  %s" finding.Root (DriftKind.label finding.Drift) finding.Key

/// Raw YAML-shaped intermediate records for the `env-contract:` section. See
/// `RepoConfig.fs`'s `OwnershipEntryDto`/etc. module doc comment for why
/// these are deliberately NOT `private`: a `private` F# type's
/// compiler-generated constructor is non-public even with
/// `[<CLIMutable>]`, and YamlDotNet's default reflection-based object
/// factory only ever calls the public-constructor `Activator.CreateInstance`
/// overload.
[<CLIMutable>]
type SurfaceConfigDto =
    { Root: string
      Kind: string
      Lang: string
      Allowlist: ResizeArray<string> }

[<CLIMutable>]
type ContractDto =
    { Surfaces: ResizeArray<SurfaceConfigDto> }

[<CLIMutable>]
type EnvContractWrapperDto = { EnvContract: ContractDto }

/// Matches `repo-config.yml`'s kebab-case keys (`env-contract`) against the
/// DTOs' PascalCase properties without per-property `[<YamlMember>]`
/// attributes, following the exact convention established by
/// `RepoConfig.fs`'s own `deserializer`.
let private validateDeserializer: IDeserializer =
    DeserializerBuilder().WithNamingConvention(HyphenatedNamingConvention.Instance).IgnoreUnmatchedProperties().Build()

let private toStringList (items: ResizeArray<string>) : string list =
    match items with
    | null -> []
    | items -> List.ofSeq items

let private toDtoList (items: ResizeArray<'a>) : 'a list =
    match items with
    | null -> []
    | items -> List.ofSeq items

/// Folds a list of `Result`s into a single `Result` of a list, short-
/// circuiting on the first `Error` — mirrors `RepoConfig.fs`'s own
/// `sequenceResults`, duplicated here rather than shared since it is small
/// enough that a cross-module dependency would cost more than it saves.
let rec private sequenceSurfaceResults (results: Result<'a, string> list) : Result<'a list, string> =
    match results with
    | [] -> Ok []
    | Error e :: _ -> Error e
    | Ok x :: rest ->
        match sequenceSurfaceResults rest with
        | Ok xs -> Ok(x :: xs)
        | Error e -> Error e

let private parseSurfaceKind (raw: string) : Result<SurfaceKind, string> =
    match raw with
    | null -> Error "kind: required key is missing"
    | value ->
        match value.ToLowerInvariant() with
        | "app" -> Ok App
        | "terraform" -> Ok Terraform
        | "ansible" -> Ok Ansible
        | other -> Error(sprintf "kind: invalid value \"%s\" (expected \"app\", \"terraform\", or \"ansible\")" other)

let private normalizeLang (raw: string) : string =
    match raw with
    | null -> ""
    | value -> value

let private toSurfaceConfig (dto: SurfaceConfigDto) : Result<SurfaceConfig, string> =
    parseSurfaceKind dto.Kind
    |> Result.map (fun kind ->
        { Root = dto.Root
          Kind = kind
          Lang = normalizeLang dto.Lang
          Allowlist = toStringList dto.Allowlist })

/// Parses `data` (the contents of `repo-config.yml`) into a [`Contract`],
/// mirroring `RepoConfig.fs`'s `parseRepoConfig`'s try/with → `Error
/// ex.Message` pattern.
let parseContractContent (data: string) (path: string) : Result<Contract, string> =
    try
        let wrapper =
            validateDeserializer.Deserialize<EnvContractWrapperDto>(RepoConfig.normalize data)

        match box wrapper.EnvContract with
        | null -> Error(sprintf "env-contract: section missing from repo-config.yml at %s" path)
        | _ ->
            wrapper.EnvContract.Surfaces
            |> toDtoList
            |> List.map toSurfaceConfig
            |> sequenceSurfaceResults
            |> Result.map (fun surfaces -> { Surfaces = surfaces })
    with ex ->
        Error ex.Message

/// Loads and parses the `env-contract:` section from `repo-config.yml` at
/// `repoRoot` [Repo-grounded — `validate.rs::load_contract`].
///
/// Follows `RepoConfig.fs`'s `load`/`parseRepoConfig` DTO-then-map
/// convention: a wrapper DTO carries a single `env-contract` field
/// (mirroring Rust's inline `Wrapper { #[serde(rename = "env-contract")]
/// env_contract: Option<Contract> }`) so an absent section (`null` at
/// runtime, despite the DTO's non-nullable-looking declared type — see
/// `RepoConfig.fs`'s `toSpecsConfig`/`toDoctorConfig` for the same pattern)
/// is distinguishable from a real parse failure.
///
/// # Errors
///
/// Returns an error when `repo-config.yml` cannot be read, is not valid
/// YAML, or the `env-contract:` section is absent.
// Coverage boundary: repository config I/O is exercised by Env-contract Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let loadContract (repoRoot: string) : Result<Contract, string> =
    let path = Path.Combine(repoRoot, "repo-config.yml")

    try
        let data = File.ReadAllText path
        parseContractContent data path
    with ex ->
        Error(sprintf "cannot read repo-config.yml at %s: %s" path ex.Message)

/// Returns `true` when `s` is a valid env var name: non-empty, and every
/// character is an ASCII uppercase letter, ASCII digit, or underscore
/// [Repo-grounded — `validate.rs::is_env_var_name`].
let isEnvVarName (s: string) : bool =
    not (String.IsNullOrEmpty s)
    && s
       |> Seq.forall (fun c -> (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c = '_')

/// Parses declared keys from a `.env.example` file [Repo-grounded —
/// `validate.rs::parse_declared_keys`].
///
/// A line is "declared" when, after trimming and stripping at most one
/// leading `#` (then trimming again), the result is non-empty, contains
/// `=`, and the substring before the first `=` (trimmed) passes
/// [`isEnvVarName`]. Blank lines and pure-comment lines (no `=`) are
/// ignored — both active (`KEY=value`) and commented-out (`# KEY=value`)
/// declarations count as declared.
///
/// # Errors
///
/// Returns an error when the file cannot be read.
// Coverage boundary: real `.env.example` reads are exercised by Env-contract Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let parseDeclaredKeys (envExample: string) : Result<string list, string> =
    try
        File.ReadAllLines envExample
        |> Array.choose (fun rawLine ->
            let trimmed = rawLine.Trim()

            let effective =
                if trimmed.StartsWith("#", StringComparison.Ordinal) then
                    trimmed.Substring(1).Trim()
                else
                    trimmed

            if effective = "" then
                None
            else
                match effective.IndexOf('=') with
                | -1 -> None
                | eqPos ->
                    let key = effective.Substring(0, eqPos).Trim()
                    if isEnvVarName key then Some key else None)
        |> Array.toList
        |> Ok
    with ex ->
        Error(sprintf "cannot read %s: %s" envExample ex.Message)

/// Recursively lists every file under `dir`, returning `[]` when `dir` does
/// not exist (a surface with no `src` directory simply reads zero keys,
/// matching Rust `WalkDir`'s own tolerant behaviour on a missing root).
// Coverage boundary: recursive source discovery is exercised by Env-contract Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let rec private allFilesUnder (dir: string) : string list =
    if not (Directory.Exists dir) then
        []
    else
        let files = Directory.EnumerateFiles dir |> List.ofSeq
        let subDirs = Directory.EnumerateDirectories dir |> List.ofSeq
        files @ (subDirs |> List.collect allFilesUnder)

let private rustEnvVarRegex =
    Regex(@"(?:std::)?env::var\s*\(\s*""([A-Z][A-Z0-9_]*)""\s*\)", RegexOptions.Compiled)

let private rustConfigStructRegex =
    Regex(@"^\s*pub\s+struct\s+Config\b", RegexOptions.Compiled)

let private rustPubFieldRegex =
    Regex(@"^\s+pub\s+([a-z][a-z0-9_]*)\s*:", RegexOptions.Compiled)

/// Scans Rust source under `root/src` for environment variable keys consumed
/// by the code [Repo-grounded — `validate.rs::scan_rust_reads`].
///
/// Detects direct `(std::)?env::var("KEY")` reads plus `pub struct Config {
/// ... }` block field names (brace-depth tracked), uppercased, as implied
/// config keys.
///
/// # Errors
///
/// Returns an error when a source file cannot be read.
// Coverage boundary: real Rust source scanning is exercised by Env-contract Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let scanRustReads (root: string) : Result<string list, string> =
    let srcDir = Path.Combine(root, "src")

    try
        let keys = HashSet<string>()

        let rustFiles =
            allFilesUnder srcDir
            |> List.filter (fun p -> p.EndsWith(".rs", StringComparison.Ordinal))

        for path in rustFiles do
            let content = File.ReadAllText path

            for m in rustEnvVarRegex.Matches content do
                keys.Add(m.Groups[1].Value) |> ignore

            let mutable inConfigStruct = false
            let mutable braceDepth = 0

            for line in content.Split('\n') do
                if not inConfigStruct && rustConfigStructRegex.IsMatch line then
                    inConfigStruct <- true
                    braceDepth <- 0

                if inConfigStruct then
                    for ch in line do
                        match ch with
                        | '{' -> braceDepth <- braceDepth + 1
                        | '}' ->
                            braceDepth <- braceDepth - 1

                            if braceDepth <= 0 then
                                inConfigStruct <- false
                        | _ -> ()

                    if inConfigStruct && braceDepth > 0 then
                        let fieldMatch = rustPubFieldRegex.Match line

                        if fieldMatch.Success then
                            keys.Add(fieldMatch.Groups[1].Value.ToUpperInvariant()) |> ignore

        Ok(keys |> List.ofSeq)
    with ex ->
        Error(sprintf "cannot read source under %s: %s" srcDir ex.Message)

let private tsEnvPropRegex =
    Regex(@"\benv\.([A-Z][A-Z0-9_]+)\b", RegexOptions.Compiled)

let private tsSchemaKeyRegex =
    Regex(@"^\s+([A-Z][A-Z0-9_]+)\s*:", RegexOptions.Compiled)

/// Scans TypeScript source under `root/src` for environment variable keys
/// consumed by the code [Repo-grounded — `validate.rs::scan_ts_reads`].
///
/// Detects `env.KEY` property accesses in any `.ts`/`.tsx` file (skipping
/// `.test.`/`.spec.` files — those set `process.env` for mocking, not for
/// production reads), plus `createEnv` schema keys (`UPPER_CASE_KEY:` lines)
/// but only inside a file literally named `env.ts`.
///
/// # Errors
///
/// Returns an error when a source file cannot be read.
// Coverage boundary: real TypeScript source scanning is exercised by Env-contract Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let scanTsReads (root: string) : Result<string list, string> =
    let srcDir = Path.Combine(root, "src")

    try
        let keys = HashSet<string>()

        let candidateFiles =
            allFilesUnder srcDir
            |> List.filter (fun p ->
                let name = Path.GetFileName p

                (name.EndsWith(".ts", StringComparison.Ordinal)
                 || name.EndsWith(".tsx", StringComparison.Ordinal))
                && not (name.Contains(".test.") || name.Contains(".spec.")))

        for path in candidateFiles do
            let name = Path.GetFileName path
            let content = File.ReadAllText path

            for m in tsEnvPropRegex.Matches content do
                keys.Add(m.Groups[1].Value) |> ignore

            if name = "env.ts" then
                for line in content.Split('\n') do
                    let m = tsSchemaKeyRegex.Match line

                    if m.Success then
                        keys.Add(m.Groups[1].Value) |> ignore

        Ok(keys |> List.ofSeq)
    with ex ->
        Error(sprintf "cannot read source under %s: %s" srcDir ex.Message)

/// Runtime-owned signals that are never application environment contract
/// keys [Repo-grounded —
/// `validate.rs::FRAMEWORK_OWNED_ENVIRONMENT_KEYS`].
let frameworkOwnedEnvironmentKeys: string list = [ "DOTNET_RUNNING_IN_CONTAINER" ]

let private fsharpEnvVarRegex =
    Regex(@"(?:System\.)?Environment\.GetEnvironmentVariable\s*\(\s*""([A-Z][A-Z0-9_]*)""\s*\)", RegexOptions.Compiled)

let private fsharpReaderWrapperRegex =
    Regex(@"\breadEnvironment\s+""([A-Z][A-Z0-9_]*)""", RegexOptions.Compiled)

/// Scans F# source under `root/src` for environment variable keys consumed
/// by the code [Repo-grounded — `validate.rs::scan_fsharp_reads`].
///
/// Detects `(System.)?Environment.GetEnvironmentVariable("VAR_NAME")` calls
/// plus the pure F# environment-reader wrapper pattern `readEnvironment
/// "VAR_NAME"`. Both exclude [`frameworkOwnedEnvironmentKeys`] — supplied by
/// the .NET runtime, not application configuration.
///
/// # Errors
///
/// Returns an error when a source file cannot be read.
// Coverage boundary: real F# source scanning is exercised by Env-contract Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let scanFsharpReads (root: string) : Result<string list, string> =
    let srcDir = Path.Combine(root, "src")

    try
        let keys = HashSet<string>()

        let addUnlessFrameworkOwned (key: string) =
            if not (List.contains key frameworkOwnedEnvironmentKeys) then
                keys.Add key |> ignore

        let fsharpFiles =
            allFilesUnder srcDir
            |> List.filter (fun p -> p.EndsWith(".fs", StringComparison.Ordinal))

        for path in fsharpFiles do
            let content = File.ReadAllText path

            for m in fsharpEnvVarRegex.Matches content do
                addUnlessFrameworkOwned m.Groups[1].Value

            for m in fsharpReaderWrapperRegex.Matches content do
                addUnlessFrameworkOwned m.Groups[1].Value

        Ok(keys |> List.ofSeq)
    with ex ->
        Error(sprintf "cannot read source under %s: %s" srcDir ex.Message)

let private goGetenvRegex =
    Regex(@"\bos\.Getenv\s*\(\s*""([A-Z][A-Z0-9_]*)""\s*\)", RegexOptions.Compiled)

let private goLookupEnvRegex =
    Regex(@"\bos\.LookupEnv\s*\(\s*""([A-Z][A-Z0-9_]*)""\s*\)", RegexOptions.Compiled)

let private goInjectedReaderRegex =
    Regex(@"\bos\.LookupEnv\s*,\s*""([A-Z][A-Z0-9_]*)""", RegexOptions.Compiled)

/// Scans Go source under `root` for environment variable keys consumed by the
/// code [Repo-grounded — mirrors `scanFsharpReads`].
///
/// Scans the module root rather than `root/src`: a Go module has no `src`
/// directory, its packages sit directly beneath `go.mod`. Skips
/// `generated-contracts/` — generated transport types are not an authored
/// environment contract — and `_test.go` files, which name keys to build
/// fixtures rather than to read application configuration (the rationale
/// [`scanTsReads`] applies to `.test.`/`.spec.`).
///
/// Detects the direct `os.Getenv("VAR_NAME")` and `os.LookupEnv("VAR_NAME")`
/// calls, plus the injected-reader form `os.LookupEnv, "VAR_NAME"`, where a
/// pure resolver is handed the reader and the key together at the composition
/// root. That third form is the Go analogue of F#'s `readEnvironment
/// "VAR_NAME"` wrapper pattern: in both, the key never appears as an argument
/// to the reader itself, so matching only direct calls would report a
/// genuinely read key as declared-but-unread. All three exclude
/// [`frameworkOwnedEnvironmentKeys`].
///
/// # Errors
///
/// Returns an error when a source file cannot be read.
// Coverage boundary: real Go source scanning is exercised by Env-contract Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let scanGoReads (root: string) : Result<string list, string> =
    try
        let keys = HashSet<string>()

        let addUnlessFrameworkOwned (key: string) =
            if not (List.contains key frameworkOwnedEnvironmentKeys) then
                keys.Add key |> ignore

        let generatedSegment =
            sprintf "%cgenerated-contracts%c" Path.DirectorySeparatorChar Path.DirectorySeparatorChar

        let goFiles =
            allFilesUnder root
            |> List.filter (fun p ->
                p.EndsWith(".go", StringComparison.Ordinal)
                && not (p.EndsWith("_test.go", StringComparison.Ordinal))
                && not (p.Contains generatedSegment))

        for path in goFiles do
            let content = File.ReadAllText path

            for m in goGetenvRegex.Matches content do
                addUnlessFrameworkOwned m.Groups[1].Value

            for m in goLookupEnvRegex.Matches content do
                addUnlessFrameworkOwned m.Groups[1].Value

            for m in goInjectedReaderRegex.Matches content do
                addUnlessFrameworkOwned m.Groups[1].Value

        Ok(keys |> List.ofSeq)
    with ex ->
        Error(sprintf "cannot read source under %s: %s" root ex.Message)

/// Validates a single `App`-kind surface against its `.env.example`
/// [Repo-grounded — `validate.rs::validate_app_surface`].
///
/// Returns zero or more drift findings, sorted by key.
///
/// # Errors
///
/// Returns an error when source files cannot be read or `surface.Lang`
/// names an unsupported language.
let validateAppKeys (surface: SurfaceConfig) (declaredKeys: string list) (readKeys: string list) : Finding list =
    let declared = Set.ofList declaredKeys
    let read = Set.ofList readKeys
    let allowlist = Set.ofList surface.Allowlist

    let declaredButUnread =
        declared
        |> Set.filter (fun key -> not (Set.contains key read) && not (Set.contains key allowlist))
        |> Set.toList
        |> List.map (fun key ->
            { Root = surface.Root
              Drift = DeclaredButUnread
              Key = key })

    let readButUndeclared =
        read
        |> Set.filter (fun key -> not (Set.contains key declared) && not (Set.contains key allowlist))
        |> Set.toList
        |> List.map (fun key ->
            { Root = surface.Root
              Drift = ReadButUndeclared
              Key = key })

    declaredButUnread @ readButUndeclared
    |> List.sortWith (fun a b -> String.CompareOrdinal(a.Key, b.Key))

// Coverage boundary: application filesystem scanning is exercised by Env-contract Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let validateAppSurface (repoRoot: string) (surface: SurfaceConfig) : Result<Finding list, string> =
    let root = Path.Combine(repoRoot, surface.Root)
    let envExample = Path.Combine(root, ".env.example")

    match parseDeclaredKeys envExample with
    | Error e -> Error e
    | Ok declaredKeys ->
        let readResult =
            match surface.Lang with
            | "rust" -> scanRustReads root
            | "typescript" -> scanTsReads root
            | "fsharp" -> scanFsharpReads root
            | "go" -> scanGoReads root
            | other -> Error(sprintf "unsupported lang: %s" other)

        match readResult with
        | Error e -> Error e
        | Ok readKeys -> validateAppKeys surface declaredKeys readKeys |> Ok

// ---- iac validators ----

/// Aggregated drift for a `Terraform` or `Ansible` surface [Repo-grounded —
/// `validate.rs::ValidationResult`]. App-surface drift is reported directly
/// through [`Finding`]/[`DriftKind`] by `validateAppSurface`; this record
/// backs the IaC validators below and is converted into [`Finding`]s by
/// [`resultToFindings`] for uniform reporting alongside app-surface findings.
/// `DeclaredNotRead`/`ReadNotDeclared` exist for record completeness (the
/// fields an app-surface result would populate in the Rust
/// `#[derive(Default)]` struct this ports) but are never set by
/// `validateTerraform`/`validateAnsible` below.
type ValidationResult =
    { SurfaceRoot: string
      DeclaredNotRead: string list
      ReadNotDeclared: string list
      ExampleNotDeclared: string list
      RequiredMissingFromExample: string list
      ConsumedNotDeclared: string list }

/// `true` when a [`ValidationResult`] carries no drift of any kind
/// [Repo-grounded — `validate.rs::ValidationResult::is_clean`].
module ValidationResult =
    let isClean (result: ValidationResult) : bool =
        List.isEmpty result.DeclaredNotRead
        && List.isEmpty result.ReadNotDeclared
        && List.isEmpty result.ExampleNotDeclared
        && List.isEmpty result.RequiredMissingFromExample
        && List.isEmpty result.ConsumedNotDeclared

/// Converts a Terraform/Ansible [`ValidationResult`] into [`Finding`]s rooted
/// at `surfaceRoot`, sorted by key [Repo-grounded —
/// `validate.rs::result_to_findings`].
let resultToFindings (surfaceRoot: string) (result: ValidationResult) : Finding list =
    let exampleNotDeclared =
        result.ExampleNotDeclared
        |> List.map (fun key ->
            { Root = surfaceRoot
              Drift = ExampleNotDeclared
              Key = key })

    let requiredMissingFromExample =
        result.RequiredMissingFromExample
        |> List.map (fun key ->
            { Root = surfaceRoot
              Drift = RequiredMissingFromExample
              Key = key })

    let consumedNotDeclared =
        result.ConsumedNotDeclared
        |> List.map (fun key ->
            { Root = surfaceRoot
              Drift = ConsumedNotDeclared
              Key = key })

    exampleNotDeclared @ requiredMissingFromExample @ consumedNotDeclared
    |> List.sortWith (fun a b -> String.CompareOrdinal(a.Key, b.Key))

let private terraformVariableBlockRegex =
    Regex(@"^\s*variable\s+""([A-Za-z_][A-Za-z0-9_]*)""\s*\{", RegexOptions.Compiled)

let private terraformDefaultAssignmentRegex =
    Regex(@"^\s*default\s*=", RegexOptions.Compiled)

/// Counts the occurrences of `target` in `line`.
// Coverage boundary: used only inside the real Terraform scanner proved by Integration/E2E.
[<ExcludeFromCodeCoverage>]
let private countChar (target: char) (line: string) : int =
    line |> Seq.filter (fun c -> c = target) |> Seq.length

/// Scans every `*.tf` file recursively under `root` for `variable "KEY" { }`
/// blocks, returning `(allDeclared, requiredOnly)` — `requiredOnly` is the
/// subset of `allDeclared` whose block has no `default = ...` line anywhere
/// inside it [Repo-grounded — `validate.rs::scan_terraform_variables`].
///
/// # Errors
///
/// Returns an error when a `*.tf` file cannot be read.
// Coverage boundary: real Terraform source scanning is exercised by Env-contract Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let scanTerraformVariables (root: string) : Result<Set<string> * Set<string>, string> =
    try
        let tfFiles =
            allFilesUnder root
            |> List.filter (fun p -> p.EndsWith(".tf", StringComparison.Ordinal))

        let mutable allDeclared = Set.empty
        let mutable required = Set.empty

        for path in tfFiles do
            let lines = File.ReadAllLines path
            let mutable i = 0

            while i < lines.Length do
                let line = lines.[i]
                let m = terraformVariableBlockRegex.Match line

                if m.Success then
                    let key = m.Groups.[1].Value
                    allDeclared <- Set.add key allDeclared

                    let mutable braceDepth = max 0 (countChar '{' line - countChar '}' line)
                    let mutable hasDefault = false
                    i <- i + 1

                    while i < lines.Length && braceDepth > 0 do
                        let inner = lines.[i]
                        braceDepth <- max 0 (braceDepth + countChar '{' inner - countChar '}' inner)

                        if terraformDefaultAssignmentRegex.IsMatch inner then
                            hasDefault <- true

                        i <- i + 1

                    if not hasDefault then
                        required <- Set.add key required
                else
                    i <- i + 1

        Ok(allDeclared, required)
    with ex ->
        Error(sprintf "cannot read *.tf files under %s: %s" root ex.Message)

let private tfvarsKeyRegex =
    Regex(@"^([A-Za-z_][A-Za-z0-9_]*)\s*=", RegexOptions.Compiled)

/// Parses `root/terraform.tfvars.example` for `KEY = ...` declarations,
/// returning an empty set (not an error) when the file does not exist
/// [Repo-grounded — `validate.rs::parse_tfvars_example`].
///
/// # Errors
///
/// Returns an error when the file exists but cannot be read.
// Coverage boundary: real tfvars reads are exercised by Env-contract Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let parseTfvarsExample (root: string) : Result<Set<string>, string> =
    let path = Path.Combine(root, "terraform.tfvars.example")

    if not (File.Exists path) then
        Ok Set.empty
    else
        try
            File.ReadAllLines path
            |> Array.filter (fun line ->
                let trimmed = line.Trim()
                trimmed <> "" && not (trimmed.StartsWith("#", StringComparison.Ordinal)))
            |> Array.choose (fun line ->
                let m = tfvarsKeyRegex.Match line
                if m.Success then Some m.Groups.[1].Value else None)
            |> Set.ofArray
            |> Ok
        with ex ->
            Error(sprintf "cannot read %s: %s" path ex.Message)

/// Validates a `Terraform`-kind surface: keys in `terraform.tfvars.example`
/// with no matching `variable` block are [`ExampleNotDeclared`]; required
/// variables (no `default`) missing from `terraform.tfvars.example` are
/// [`RequiredMissingFromExample`] [Repo-grounded —
/// `validate.rs::validate_terraform`]. Scans `root` directly (not
/// `root/src`) — unlike the `App`-surface scanners above, a
/// Terraform/Ansible surface's files live at its root.
///
/// # Errors
///
/// Returns an error when a `*.tf` file or `terraform.tfvars.example` cannot
/// be read.
// Coverage boundary: real Terraform validation is exercised by Env-contract Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let validateTerraform (root: string) (allowlist: string list) : Result<ValidationResult, string> =
    match scanTerraformVariables root with
    | Error e -> Error e
    | Ok(declaredKeys, requiredKeys) ->
        match parseTfvarsExample root with
        | Error e -> Error e
        | Ok exampleKeys ->
            let allow = Set.ofList allowlist

            let exampleNotDeclared =
                Set.difference exampleKeys declaredKeys
                |> Set.filter (fun key -> not (Set.contains key allow))
                |> Set.toList
                |> List.sortWith (fun a b -> String.CompareOrdinal(a, b))

            let requiredMissingFromExample =
                Set.difference requiredKeys exampleKeys
                |> Set.filter (fun key -> not (Set.contains key allow))
                |> Set.toList
                |> List.sortWith (fun a b -> String.CompareOrdinal(a, b))

            Ok
                { SurfaceRoot = root
                  DeclaredNotRead = []
                  ReadNotDeclared = []
                  ExampleNotDeclared = exampleNotDeclared
                  RequiredMissingFromExample = requiredMissingFromExample
                  ConsumedNotDeclared = [] }

let private ansibleBuiltinLookupRegex =
    Regex(@"lookup\(\s*'ansible\.builtin\.env'\s*,\s*'([A-Z_][A-Z0-9_]*)'\s*\)", RegexOptions.Compiled)

let private ansibleShortLookupRegex =
    Regex(@"lookup\(\s*'env'\s*,\s*'([A-Z_][A-Z0-9_]*)'\s*\)", RegexOptions.Compiled)

/// Scans every `playbook-*.yml` file recursively under `root` for
/// `lookup('ansible.builtin.env', 'KEY')` and `lookup('env', 'KEY')` calls
/// [Repo-grounded — `validate.rs::scan_ansible_playbooks`].
///
/// # Errors
///
/// Returns an error when a playbook file cannot be read.
// Coverage boundary: real Ansible playbook scanning is exercised by Env-contract Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let scanAnsiblePlaybooks (root: string) : Result<Set<string>, string> =
    try
        let playbookFiles =
            allFilesUnder root
            |> List.filter (fun p ->
                let name = Path.GetFileName p

                name.StartsWith("playbook-", StringComparison.Ordinal)
                && name.EndsWith(".yml", StringComparison.Ordinal))

        let keys = HashSet<string>()

        for path in playbookFiles do
            let content = File.ReadAllText path

            for m in ansibleBuiltinLookupRegex.Matches content do
                keys.Add(m.Groups.[1].Value) |> ignore

            for m in ansibleShortLookupRegex.Matches content do
                keys.Add(m.Groups.[1].Value) |> ignore

        Ok(Set.ofSeq keys)
    with ex ->
        Error(sprintf "cannot read playbook files under %s: %s" root ex.Message)

/// Parses `root/.env.example` for declared keys, treating a commented-out
/// declaration (`# KEY=value`) as declared and returning an empty set (not
/// an error) when the file does not exist [Repo-grounded —
/// `validate.rs::parse_env_example_with_comments`]. Deliberately more
/// permissive than [`parseDeclaredKeys`] above — no [`isEnvVarName`]
/// filtering — ported separately because `validate.rs` itself keeps the two
/// parsers distinct.
///
/// # Errors
///
/// Returns an error when the file exists but cannot be read.
// Coverage boundary: real `.env.example` reads are exercised by Env-contract Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let parseEnvExampleWithComments (root: string) : Result<Set<string>, string> =
    let path = Path.Combine(root, ".env.example")

    if not (File.Exists path) then
        Ok Set.empty
    else
        try
            File.ReadAllLines path
            |> Array.filter (fun line -> line.Trim() <> "")
            |> Array.choose (fun line ->
                let trimmed = line.Trim()

                let effective =
                    if trimmed.StartsWith("#", StringComparison.Ordinal) then
                        trimmed.TrimStart('#').Trim()
                    else
                        trimmed

                match effective.IndexOf('=') with
                | -1 -> None
                | eqPos ->
                    let key = effective.Substring(0, eqPos).Trim()
                    if key = "" then None else Some key)
            |> Set.ofArray
            |> Ok
        with ex ->
            Error(sprintf "cannot read %s: %s" path ex.Message)

/// Validates an `Ansible`-kind surface: an env-var lookup in a playbook with
/// no matching declaration in `.env.example` is [`ConsumedNotDeclared`]
/// [Repo-grounded — `validate.rs::validate_ansible`]. Scans `root` directly,
/// same rationale as [`validateTerraform`].
///
/// # Errors
///
/// Returns an error when a playbook or `.env.example` file cannot be read.
// Coverage boundary: real Ansible validation is exercised by Env-contract Integration and E2E proof.
[<ExcludeFromCodeCoverage>]
let validateAnsible (root: string) (allowlist: string list) : Result<ValidationResult, string> =
    match scanAnsiblePlaybooks root with
    | Error e -> Error e
    | Ok consumed ->
        match parseEnvExampleWithComments root with
        | Error e -> Error e
        | Ok declared ->
            let allow = Set.ofList allowlist

            let consumedNotDeclared =
                Set.difference consumed declared
                |> Set.filter (fun key -> not (Set.contains key allow))
                |> Set.toList
                |> List.sortWith (fun a b -> String.CompareOrdinal(a, b))

            Ok
                { SurfaceRoot = root
                  DeclaredNotRead = []
                  ReadNotDeclared = []
                  ExampleNotDeclared = []
                  RequiredMissingFromExample = []
                  ConsumedNotDeclared = consumedNotDeclared }

/// Validates every surface declared in `contract`, dispatching on each
/// surface's [`SurfaceKind`]: `App` surfaces run the code↔`.env.example`
/// drift scan, `Terraform` and `Ansible` surfaces run the real IaC drift
/// validators above [Repo-grounded — `validate.rs::validate_all`]. A repo
/// that declares no `Terraform`/`Ansible` surfaces simply never invokes
/// those validators — the no-op is driven by data (which surfaces are
/// declared), not by a source stub.
///
/// # Errors
///
/// Returns an error when any surface fails validation.
type EnvValidationPorts =
    { ValidateApp: SurfaceConfig -> Result<Finding list, string>
      ValidateTerraform: SurfaceConfig -> Result<ValidationResult, string>
      ValidateAnsible: SurfaceConfig -> Result<ValidationResult, string> }

let validateAllWith (ports: EnvValidationPorts) (contract: Contract) : Result<Finding list, string> =
    let rec go (surfaces: SurfaceConfig list) (acc: Finding list) : Result<Finding list, string> =
        match surfaces with
        | [] -> Ok acc
        | surface :: rest ->
            match surface.Kind with
            | App ->
                match ports.ValidateApp surface with
                | Error e -> Error e
                | Ok findings -> go rest (acc @ findings)
            | Terraform ->
                match ports.ValidateTerraform surface with
                | Error e -> Error e
                | Ok result -> go rest (acc @ resultToFindings surface.Root result)
            | Ansible ->
                match ports.ValidateAnsible surface with
                | Error e -> Error e
                | Ok result -> go rest (acc @ resultToFindings surface.Root result)

    go contract.Surfaces []

// Coverage boundary: real surface scanners are composed here and exercised by Integration/E2E proof.
[<ExcludeFromCodeCoverage>]
let validateAll (repoRoot: string) (contract: Contract) : Result<Finding list, string> =
    validateAllWith
        { ValidateApp = validateAppSurface repoRoot
          ValidateTerraform = fun surface -> validateTerraform (Path.Combine(repoRoot, surface.Root)) surface.Allowlist
          ValidateAnsible = fun surface -> validateAnsible (Path.Combine(repoRoot, surface.Root)) surface.Allowlist }
        contract

// ---- staged-guard ----

/// True when `path`'s basename looks like a real `.env*` file that is NOT
/// `.env.example` [Repo-grounded — `env_staged_guard.rs::is_offending`]. The
/// **commit** policy deliberately stays deny-all across every `.env*`
/// variant, even though the read policy (`readEnvironment`, above) narrows to
/// only `.env.prod`/`.env.stag` — the two policies are intentionally
/// decoupled, matching the Rust reference's own doc comment on this
/// function.
let isEnvStagedGuardOffending (path: string) : bool =
    let basename = Path.GetFileName(path)

    basename.StartsWith(".env", StringComparison.Ordinal)
    && basename <> ".env.example"

/// Checks `stagedFiles` against the commit policy, returning every offending
/// path in encounter order (empty when the commit is allowed) [Repo-grounded
/// — `env_staged_guard.rs::run_with_staged_files`]. The real git shell-out
/// (`git diff --cached --name-only --diff-filter=AM`) is a CLI-layer
/// concern, not this pure function's — mirrors the Rust reference's own
/// split between `run` (shells to git) and `run_with_staged_files` (pure,
/// and what its own unit tests call directly).
let checkStagedFiles (stagedFiles: string list) : string list =
    stagedFiles |> List.filter isEnvStagedGuardOffending

/// Renders the staged-guard failure message for `offending` — always
/// non-empty when called, since the CLI only calls this on a non-empty
/// result [Repo-grounded — `env_staged_guard.rs::run_with_staged_files`'s
/// `writeln!` block].
let formatEnvStagedGuardFailure (offending: string list) : string =
    let sb = System.Text.StringBuilder()

    sb.AppendLine("ERROR: refusing to commit real .env* files (policy: guard-env-file-access):")
    |> ignore

    for path in offending do
        sb.AppendLine(sprintf "  %s" path) |> ignore

    sb.AppendLine("Only .env.example may be committed.") |> ignore
    sb.Append("Unstage with: git restore --staged <file>") |> ignore
    sb.ToString()
