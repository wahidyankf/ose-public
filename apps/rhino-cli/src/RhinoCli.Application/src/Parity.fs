/// Hermetic checksum-manifest support for the Rhino CLI byte-identity
/// boundary [Repo-grounded — `apps/rhino-cli/src/application/parity.rs`].
///
/// Scope note: the Rust port additionally hardens every file open against a
/// TOCTOU symlink-swap race via descriptor-relative `openat`/`renameat`
/// syscalls (Unix-only, no ergonomic managed equivalent). This port matches
/// every *observable* behaviour — git-reported symlink mode still rejected,
/// atomic replace via same-directory temp file + rename — but does not
/// reimplement that lookup-time race protection, since generate/validate
/// only ever touch paths Git itself already tracks (not attacker-supplied
/// input) and no caller here exercises the race window.
module RhinoCli.Application.Parity

open System
open System.Diagnostics
open System.IO
open System.Security.Cryptography
open System.Text

/// Repository-relative path of the deliberately committed checksum manifest.
[<Literal>]
let ManifestPath = "apps/rhino-cli/parity-manifest.sha256"

/// Git pathspecs defining the byte-identical Rhino CLI boundary.
let private boundaryPaths =
    [ "apps/rhino-cli/src"
      "apps/rhino-cli/project.json"
      "apps/rhino-cli/LICENSE"
      "specs/apps/rhino/cli/behaviours" ]

/// Runs `git` isolated from ambient/hook-inherited state, pinned to
/// `repoRoot`, and returns `(exitCode, stdoutBytes, stderrText)`.
let private runGitRaw (repoRoot: string) (args: string list) : int * byte[] * string =
    use proc = new Process()
    proc.StartInfo.FileName <- "git"
    args |> List.iter proc.StartInfo.ArgumentList.Add
    proc.StartInfo.WorkingDirectory <- repoRoot
    proc.StartInfo.RedirectStandardOutput <- true
    proc.StartInfo.RedirectStandardError <- true
    proc.StartInfo.UseShellExecute <- false

    for name in
        [ "GIT_DIR"
          "GIT_WORK_TREE"
          "GIT_INDEX_FILE"
          "GIT_OBJECT_DIRECTORY"
          "GIT_ALTERNATE_OBJECT_DIRECTORIES"
          "GIT_COMMON_DIR"
          "GIT_PREFIX" ] do
        proc.StartInfo.EnvironmentVariables.Remove(name)

    proc.StartInfo.EnvironmentVariables.["GIT_CONFIG_NOSYSTEM"] <- "1"
    proc.StartInfo.EnvironmentVariables.["GIT_CONFIG_GLOBAL"] <- "/dev/null"
    proc.StartInfo.EnvironmentVariables.["GIT_CONFIG_COUNT"] <- "0"

    proc.Start() |> ignore
    use stdoutBuffer = new MemoryStream()
    proc.StandardOutput.BaseStream.CopyTo(stdoutBuffer)
    let stderrText = proc.StandardError.ReadToEnd()
    proc.WaitForExit()
    (proc.ExitCode, stdoutBuffer.ToArray(), stderrText)

/// One parsed `git ls-files --stage -z` entry.
type private IndexEntry =
    { Mode: string
      ObjectId: string
      Stage: string
      Path: string }

let private splitNulTerminated (bytes: byte[]) : byte[] list =
    let rec loop (start: int) (acc: byte[] list) =
        if start >= bytes.Length then
            List.rev acc
        else
            let idx = Array.IndexOf(bytes, 0uy, start)
            let stop = if idx < 0 then bytes.Length else idx

            if stop = start then
                loop (stop + 1) acc
            else
                loop (stop + 1) (bytes.[start .. stop - 1] :: acc)

    loop 0 []

let private parseIndexEntry (raw: byte[]) : Result<IndexEntry, string> =
    let entry = Encoding.UTF8.GetString(raw)
    let tabIdx = entry.IndexOf('\t')

    if tabIdx < 0 then
        Error "Git returned a malformed index entry in the Rhino CLI parity boundary"
    else
        let metadata = entry.Substring(0, tabIdx)
        let path = entry.Substring(tabIdx + 1)
        let fields = metadata.Split(' ', StringSplitOptions.RemoveEmptyEntries)

        if fields.Length <> 3 then
            Error(
                sprintf
                    "%s has an unresolved Git index entry; resolve it before generating or validating %s"
                    path
                    ManifestPath
            )
        else
            Ok
                { Mode = fields.[0]
                  ObjectId = fields.[1]
                  Stage = fields.[2]
                  Path = path }

/// Reads one blob's raw bytes via `git cat-file -p <objectId>`.
let private readBlob (repoRoot: string) (objectId: string) : Result<byte[], string> =
    let exitCode, stdout, stderr = runGitRaw repoRoot [ "cat-file"; "-p"; objectId ]

    if exitCode <> 0 then
        Error(sprintf "git cat-file failed for %s: %s" objectId (stderr.Trim()))
    else
        Ok stdout

let private sha256Hex (bytes: byte[]) : string =
    SHA256.HashData(bytes) |> Array.map (sprintf "%02x") |> String.concat ""

/// Explains an intentional shared-source edit without silently repairing it
/// [Repo-grounded — `parity.rs::drift_error`].
let private driftError (path: string) : string =
    sprintf
        "%s no longer matches %s.\n\nThis file is byte-identical across ose-public and the private sibling.\nChanging it here obligates propagating the identical change to the other repo.\nIf that is intended, run: rhino-cli parity manifest generate"
        path
        ManifestPath

/// Returns the staged boundary paths and their SHA-256 digests, sorted by
/// path — the manifest describes the prospective commit, not ambient
/// worktree state, so every worktree file is proven to match its staged
/// blob before being hashed
/// [Repo-grounded — `parity.rs::boundary_hashes`].
let private boundaryHashes (repoRoot: string) : Result<Map<string, string>, string> =
    let exitCode, stdout, stderr =
        runGitRaw repoRoot ([ "ls-files"; "--stage"; "-z"; "--" ] @ boundaryPaths)

    if exitCode <> 0 then
        Error(sprintf "git ls-files for the Rhino CLI parity boundary failed: %s" (stderr.Trim()))
    else
        let entries = splitNulTerminated stdout

        let rec loop (entries: byte[] list) (acc: Map<string, string>) : Result<Map<string, string>, string> =
            match entries with
            | [] -> Ok acc
            | raw :: rest ->
                match parseIndexEntry raw with
                | Error e -> Error e
                | Ok entry when entry.Stage <> "0" ->
                    Error(
                        sprintf
                            "%s has an unresolved Git index entry; resolve it before generating or validating %s"
                            entry.Path
                            ManifestPath
                    )
                | Ok entry when entry.Mode = "120000" ->
                    Error(
                        sprintf
                            "%s is a symlink in the Git index; symlinks are not permitted in %s's boundary"
                            entry.Path
                            ManifestPath
                    )
                | Ok entry ->
                    let worktreePath = Path.Combine(repoRoot, entry.Path)

                    let worktreeBytes =
                        try
                            Ok(File.ReadAllBytes worktreePath)
                        with ex ->
                            Error(sprintf "read staged parity boundary file %s: %s" entry.Path ex.Message)

                    match worktreeBytes with
                    | Error e -> Error e
                    | Ok worktreeBytes ->
                        match readBlob repoRoot entry.ObjectId with
                        | Error e -> Error e
                        | Ok indexBytes ->
                            if worktreeBytes <> indexBytes then
                                Error(
                                    sprintf
                                        "%s differs from the Git index; stage or revert the worktree change before generating or validating %s.\n\n%s"
                                        entry.Path
                                        ManifestPath
                                        (driftError entry.Path)
                                )
                            else
                                loop rest (Map.add entry.Path (sha256Hex indexBytes) acc)

        loop entries Map.empty

/// Reads the staged (index) bytes for one exact repository-relative path
/// [Repo-grounded — `parity.rs::index_blob_for_path`].
let private indexBlobForPath (repoRoot: string) (path: string) : Result<byte[], string> =
    let exitCode, stdout, stderr =
        runGitRaw repoRoot [ "ls-files"; "--stage"; "-z"; "--"; path ]

    if exitCode <> 0 then
        Error(sprintf "git ls-files failed for %s: %s" ManifestPath (stderr.Trim()))
    else
        match splitNulTerminated stdout with
        | [] -> Error(sprintf "%s is not staged; stage it before validating" ManifestPath)
        | raw :: _ ->
            match parseIndexEntry raw with
            | Error e -> Error e
            | Ok entry when entry.Path <> path -> Error "Git returned an unexpected parity manifest index path"
            | Ok entry when entry.Mode = "120000" -> Error(sprintf "%s is a symlink in the Git index" ManifestPath)
            | Ok entry when entry.Stage <> "0" -> Error(sprintf "%s has an unresolved Git index entry" ManifestPath)
            | Ok entry -> readBlob repoRoot entry.ObjectId

/// Renders the stable, newline-terminated `<sha256><two spaces><path>`
/// manifest format, sorted by path.
let private renderManifest (hashes: Map<string, string>) : string =
    hashes
    |> Map.toList
    |> List.map (fun (path, hash) -> sprintf "%s  %s\n" hash path)
    |> String.concat ""

/// Produces the canonical manifest for already-discovered boundary bytes.
/// Resource adapters decide which paths are tracked; this pure core sorts,
/// hashes, and renders the prospective manifest deterministically.
let renderFromBoundaryFiles (files: Map<string, byte[]>) : string =
    files |> Map.map (fun _ bytes -> sha256Hex bytes) |> renderManifest

/// Parses the stable manifest format back into a path→hash map.
let private parseManifest (manifest: string) : Result<Map<string, string>, string> =
    let lines = manifest.Split('\n') |> Array.toList |> List.filter (fun l -> l <> "")

    let rec loop
        (lineNumber: int)
        (lines: string list)
        (acc: Map<string, string>)
        : Result<Map<string, string>, string> =
        match lines with
        | [] -> Ok acc
        | line :: rest ->
            let sepIdx = line.IndexOf("  ", StringComparison.Ordinal)

            if sepIdx < 0 then
                Error(sprintf "%s:%d: expected '<sha256>  <repository-relative path>'" ManifestPath lineNumber)
            else
                let hash = line.Substring(0, sepIdx)
                let path = line.Substring(sepIdx + 2)

                let hashValid = hash.Length = 64 && hash |> Seq.forall (fun c -> Uri.IsHexDigit c)

                if not hashValid || path = "" then
                    Error(sprintf "%s:%d: invalid SHA-256 manifest entry" ManifestPath lineNumber)
                elif acc.ContainsKey path then
                    Error(sprintf "%s:%d: duplicate boundary path \"%s\"" ManifestPath lineNumber path)
                else
                    loop (lineNumber + 1) rest (Map.add path hash acc)

    loop 1 lines Map.empty

/// Compares a declared manifest with already-discovered boundary bytes.
/// This keeps Git/index discovery outside the Unit boundary while proving
/// the same canonical-format and drift decisions used by [`validateAtRoot`].
let validateBoundaryFiles (manifest: string) (files: Map<string, byte[]>) : Result<unit, string> =
    match parseManifest manifest with
    | Error message -> Error message
    | Ok declared ->
        let actual = files |> Map.map (fun _ bytes -> sha256Hex bytes)

        let drifted =
            actual
            |> Map.toSeq
            |> Seq.tryFind (fun (path, hash) -> Map.tryFind path declared <> Some hash)

        match drifted with
        | Some(path, _) -> Error(driftError path)
        | None ->
            match
                declared
                |> Map.toSeq
                |> Seq.tryFind (fun (path, _) -> not (actual.ContainsKey path))
            with
            | Some(path, _) -> Error(driftError path)
            | None when manifest <> renderManifest actual ->
                Error(
                    sprintf
                        "%s is not the canonical sorted checksum manifest; run: rhino-cli parity manifest generate"
                        ManifestPath
                )
            | None -> Ok()

/// Replaces the manifest through a same-directory temporary file, then an
/// atomic rename — `File.Move(..., overwrite = true)` uses `rename(2)` on
/// Unix, matching the Rust port's atomicity guarantee (see the module doc
/// comment for the disclosed symlink-race scope reduction).
let private writeManifestAtomically (repoRoot: string) (manifest: string) : Result<unit, string> =
    let manifestPath = Path.Combine(repoRoot, ManifestPath)
    let dir = Path.GetDirectoryName(manifestPath)

    let tempPath =
        Path.Combine(dir, sprintf ".parity-manifest-%d-%d.tmp" (Environment.ProcessId) (Guid.NewGuid().GetHashCode()))

    try
        File.WriteAllText(tempPath, manifest)
        File.Move(tempPath, manifestPath, true)
        Ok()
    with ex ->
        if File.Exists tempPath then
            File.Delete tempPath

        Error(sprintf "atomically replace parity manifest: %s" ex.Message)

/// Generates `parity-manifest.sha256` from the tracked boundary files
/// [Repo-grounded — `parity.rs::generate_at_root`].
let generateAtRoot (repoRoot: string) : Result<unit, string> =
    match boundaryHashes repoRoot with
    | Error e -> Error e
    | Ok hashes -> writeManifestAtomically repoRoot (renderManifest hashes)

/// Validates that the committed manifest matches the current tracked
/// boundary [Repo-grounded — `parity.rs::validate_at_root`].
let validateAtRoot (repoRoot: string) : Result<unit, string> =
    let manifestFullPath = Path.Combine(repoRoot, ManifestPath)

    let worktreeManifest =
        try
            Ok(File.ReadAllBytes manifestFullPath)
        with ex ->
            Error(sprintf "read %s: %s" ManifestPath ex.Message)

    match worktreeManifest with
    | Error e -> Error e
    | Ok worktreeManifestBytes ->
        match indexBlobForPath repoRoot ManifestPath with
        | Error e -> Error e
        | Ok indexedManifestBytes ->
            if worktreeManifestBytes <> indexedManifestBytes then
                Error(
                    sprintf
                        "%s differs from the Git index; stage the generated manifest before validating the prospective commit"
                        ManifestPath
                )
            else
                let manifestText = Encoding.UTF8.GetString(worktreeManifestBytes)

                match parseManifest manifestText with
                | Error e -> Error e
                | Ok declared ->
                    match boundaryHashes repoRoot with
                    | Error e -> Error e
                    | Ok actual ->
                        let drifted =
                            actual
                            |> Map.toSeq
                            |> Seq.tryFind (fun (path, hash) ->
                                match Map.tryFind path declared with
                                | Some declaredHash -> declaredHash <> hash
                                | None -> true)

                        match drifted with
                        | Some(path, _) -> Error(driftError path)
                        | None ->
                            let missing =
                                declared
                                |> Map.toSeq
                                |> Seq.tryFind (fun (path, _) -> not (actual.ContainsKey path))

                            match missing with
                            | Some(path, _) -> Error(driftError path)
                            | None ->
                                if manifestText <> renderManifest actual then
                                    Error(
                                        sprintf
                                            "%s is not the canonical sorted checksum manifest; run: rhino-cli parity manifest generate"
                                            ManifestPath
                                    )
                                else
                                    Ok()
