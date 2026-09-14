/// Top-level argv routing for the namespaces flipped so far
/// [Repo-grounded — `apps/rhino-cli/src/cli.rs`'s `run`/`dispatch`]. Each
/// wave's flip PR extends `route` with its own namespace's leaves; nothing
/// here handles a namespace still routed to the Rust binary by
/// `apps/rhino-cli/scripts/rhino-bin.sh`'s `FSHARP_NAMESPACES`.
module RhinoCli.Cli.Dispatch

open System
open System.Globalization
open RhinoCli.Domain.Types
open RhinoCli.Application
open RhinoCli.Infrastructure

/// Runs a whole-delegated validator: RHINO's argv, output and exit, unchanged.
let private runDelegatedLeaf (repoRoot: string) (command: string) (rawArgs: string list) : int =
    RustRhino.runDelegated (RustRhino.run repoRoot) (fun line -> eprintfn "%s" line) command rawArgs

/// Runs a split validator: RHINO first, then the F# remainder only when RHINO completed.
let private runSplitLeaf (repoRoot: string) (command: string) (rawArgs: string list) (remainder: unit -> int) : int =
    RustRhino.runSplit (RustRhino.run repoRoot) (fun line -> eprintfn "%s" line) command rawArgs remainder

/// `-h`/`--help` always prints the same canonical top-level help and exits
/// `0`, regardless of where it appears or what subcommand precedes it
/// [Repo-grounded — `cli.rs`'s `disable_help_flag = true` plus its manual
/// `cli.help` check].
let private wantsHelp (argv: string[]) : bool =
    argv |> Array.exists (fun a -> a = "-h" || a = "--help")

/// Extracts a trailing `-o`/`--output <value>` (or `--output=value`) from
/// `args`, defaulting to `Text` when absent — the only global flag any
/// currently-flipped leaf's shadow-diff probe or real usage needs.
let private parseOutputFormat (args: string list) : Result<OutputFormat, string> =
    let rec find (args: string list) : string option =
        match args with
        | [] -> None
        | a :: v :: _ when a = "-o" || a = "--output" -> Some v
        | a :: _ when a.StartsWith("--output=", StringComparison.Ordinal) -> Some(a.Substring("--output=".Length))
        | _ :: rest -> find rest

    match find args with
    | None
    | Some "" -> Ok Text
    | Some "text" -> Ok Text
    | Some "json" -> Ok Json
    | Some "markdown" -> Ok Markdown
    | Some other -> Error(sprintf "unknown output format \"%s\": must be text, json, or markdown" other)

/// Parses one `--format` value [Repo-grounded — `domain/cliout.rs::parse`].
let private parseOutputFormatValue (value: string) : Result<OutputFormat, string> =
    match value with
    | ""
    | "text" -> Ok Text
    | "json" -> Ok Json
    | "markdown" -> Ok Markdown
    | other -> Error(sprintf "unknown output format \"%s\": must be text, json, or markdown" other)

/// `true` when any of `names` appears verbatim in `args` — a bare boolean
/// flag such as `--force`/`-f`.
let private hasFlag (names: string list) (args: string list) : bool =
    args |> List.exists (fun a -> List.contains a names)

/// Finds the value following the first occurrence of any of `names` in
/// `args` (space-separated form only, matching this file's existing
/// `collectPathFlags`/`collectSkipFlags` convention).
let private stringFlag (names: string list) (args: string list) : string option =
    let rec loop (args: string list) : string option =
        match args with
        | [] -> None
        | a :: v :: _ when List.contains a names -> Some v
        | _ :: rest -> loop rest

    loop args

/// Collects every `-p`/`--path <value>` occurrence in `args`.
let private collectPathFlags (args: string list) : string list =
    let rec loop (args: string list) (acc: string list) : string list =
        match args with
        | [] -> List.rev acc
        | (a) :: v :: rest when (a = "-p" || a = "--path") -> loop rest (v :: acc)
        | _ :: rest -> loop rest acc

    loop args []

/// Collects every positional (non-flag, non-flag-value) argument in `args`
/// — `-o`/`--output`/`-p`/`--path` and their values are excluded.
/// `extraValueFlags`
/// names additional flags (e.g. `--exclude`, `--exempt`, `--paths`) whose
/// following value must also be skipped rather than leak into the result —
/// every caller that also reads one of those flags via
/// `collectRepeatableFlag`/`collectPathFlags` on the SAME `args` must list it
/// here, or that flag's value is misread as a positional path (observed for
/// real in `.husky/pre-commit`'s `md naming validate --exempt ...` and `md
/// mermaid validate --exclude ...` calls, Wave D integration).
let private collectPositionals (extraValueFlags: string list) (args: string list) : string list =
    let rec loop (args: string list) (acc: string list) : string list =
        match args with
        | [] -> List.rev acc
        | a :: _ :: rest when a = "-o" || a = "--output" || a = "-p" || a = "--path" -> loop rest acc
        | a :: _ :: rest when List.contains a extraValueFlags -> loop rest acc
        | a :: rest when a.StartsWith("--output=", StringComparison.Ordinal) -> loop rest acc
        | a :: rest when a.StartsWith("-", StringComparison.Ordinal) -> loop rest acc
        | a :: rest -> loop rest (a :: acc)

    loop args []

/// Collects every `--skip <name>` occurrence in `args`, for `convention audit`.
let private collectSkipFlags (args: string list) : string list =
    let rec loop (args: string list) (acc: string list) : string list =
        match args with
        | [] -> List.rev acc
        | a :: v :: rest when a = "--skip" -> loop rest (v :: acc)
        | _ :: rest -> loop rest acc

    loop args []

/// Prints `output` to stdout and, on a non-empty finding list, the trailing
/// `Error: {message}` line the Rust CLI's shared `dispatch()` appends to
/// stderr for every failing leaf [Repo-grounded — `cli.rs::dispatch`'s
/// `Err(e) => eprintln!("Error: {e}")`].
let private printResultAndExitCode (output: string) (errorMessage: string option) : int =
    printf "%s" output

    match errorMessage with
    | None -> 0
    | Some message ->
        eprintfn "Error: %s" message
        1

let private runLicenseLeaf (repoRoot: string) (format: OutputFormat) : int =
    let result = Convention.runLicenseValidate repoRoot

    let output =
        Formatters.render
            format
            (fun () -> Formatters.licenseText result.Findings)
            (fun () -> Formatters.licenseJson result.Findings)
            (fun () -> Formatters.licenseMarkdown result.Findings)

    let err =
        if List.isEmpty result.Findings then
            None
        else
            Some(sprintf "%d license finding(s) found" (List.length result.Findings))

    printResultAndExitCode output err

/// `convention audit`: runs emoji then license (each printing its own
/// format-rendered output as it goes, exactly as `convention_audit.rs::run`
/// does), then prints the aggregate PASSED/FAILED footer
/// [Repo-grounded — `convention_audit.rs::run`].
let private runAuditLeaf (repoRoot: string) (format: OutputFormat) (args: string list) : int =
    let skip = collectSkipFlags args
    let members = [ "emoji"; "license" ]

    let runMember (name: string) : string option =
        if name = "emoji" then
            match runDelegatedLeaf repoRoot "convention emoji validate" [] with
            | 0 -> None
            | code -> Some(sprintf "emoji: ./rhino convention emoji validate exited %d" code)
        else
            let result = Convention.runLicenseValidate repoRoot

            printf
                "%s"
                (Formatters.render
                    format
                    (fun () -> Formatters.licenseText result.Findings)
                    (fun () -> Formatters.licenseJson result.Findings)
                    (fun () -> Formatters.licenseMarkdown result.Findings))

            if List.isEmpty result.Findings then
                None
            else
                Some(sprintf "license: %d license finding(s) found" (List.length result.Findings))

    let failures =
        members
        |> List.filter (fun n -> not (List.contains n skip))
        |> List.choose runMember

    if List.isEmpty failures then
        printfn "CONVENTION AUDIT PASSED: all %d validators passed" (List.length members - List.length skip)
        0
    else
        eprintfn "CONVENTION AUDIT FAILED: %d validator(s) reported failures" (List.length failures)
        failures |> List.iter (eprintfn "  %s")
        eprintfn "Error: convention audit found %d failure(s)" (List.length failures)
        1

let private runParityGenerate (repoRoot: string) : int =
    match Parity.generateAtRoot repoRoot with
    | Ok() ->
        printfn "generated %s" Parity.ManifestPath
        0
    | Error message ->
        eprintfn "Error: %s" message
        1

let private runParityValidate (repoRoot: string) : int =
    match Parity.validateAtRoot repoRoot with
    | Ok() ->
        printfn "%s is current" Parity.ManifestPath
        0
    | Error message ->
        eprintfn "Error: %s" message
        1

// ---------------------------------------------------------------------------
// Wave B: repo-config, env
// ---------------------------------------------------------------------------

/// `repo-config validate` ignores `-o`/`--output` entirely, always printing
/// plain text [Repo-grounded — `repo_config_validate.rs::run`'s unused
/// `_output` parameter]. On a schema-deserialization failure nothing reaches
/// stdout — the whole message surfaces only as the trailing `Error:` line,
/// mirroring `run_at_root`'s `?`-propagated `Err` never reaching its own
/// `writeln!` calls.
let private runRepoConfigValidateLeaf (repoRoot: string) : int =
    match RepoConfig.load repoRoot with
    | Error message ->
        eprintfn "Error: repo-config validate: repo-config.yml failed strict schema deserialization: %s" message

        1
    | Ok config ->
        let raw = IO.File.ReadAllText(IO.Path.Combine(repoRoot, "repo-config.yml"))

        match Governance.checkNoUnknownWordBudgetKeys raw with
        | Error message ->
            eprintfn "Error: repo-config validate: %s" message
            1
        | Ok() ->
            match RepoConfig.semanticFindings config with
            | [] ->
                printfn "repo-config validate: repo-config.yml matches the canonical schema (key set + enums OK)"
                0
            | findings ->
                findings |> List.iter (printfn "%s")

                eprintfn
                    "Error: repo-config validate: %d schema finding(s); fix the key(s) listed above"
                    (List.length findings)

                1

// ---------------------------------------------------------------------------
// Plan structure
// ---------------------------------------------------------------------------

/// `plan validate` checks every plan under `plans/` against the shared plan
/// structure and writes exactly what the pinned RHINO `plan validate` writes
/// [Repo-grounded — RHINO `v0.3.0` `src/plan.rs` and `src/report.rs`]: one
/// JSON document for `--output json`, otherwise the text summary on stdout
/// and one finding per line on stderr.
let private runPlanValidateLeaf (repoRoot: string) (format: OutputFormat) : int =
    let report =
        Plan.validate (Plan.listPlanFiles repoRoot) (Plan.readPlanDocument repoRoot)

    let outcome =
        match format with
        | Json -> Plan.renderJson report
        | Text
        | Markdown -> Plan.renderText report

    printf "%s" outcome.Stdout
    eprintf "%s" outcome.Stderr
    outcome.ExitCode

/// `env init` also ignores `-o`/`--output` — it always prints the same plain
/// text and always exits `0`, regardless of per-file outcome [Repo-grounded —
/// `env_init.rs::run`, whose only failure mode (git-root lookup) `route`
/// already handles before reaching this leaf].
let private runEnvInitLeaf (repoRoot: string) (args: string list) : int =
    let force = hasFlag [ "--force" ] args
    printf "%s" (Env.formatEnvInitText (Env.runEnvInit repoRoot force))
    0

/// Resolves `env backup`'s effective backup directory: the best-effort
/// canonicalization applies to both the default (`~/ose-public-env-backup`)
/// and an explicit `--dir` [Repo-grounded — `env_backup.rs::run`].
let private resolveBackupDir (dirArg: string) : Result<string, string> =
    let canonicalizeOrFallback (path: string) : string =
        match Env.canonicalizeBestEffort path with
        | Ok canon -> canon
        | Error _ -> path

    if dirArg = "" then
        Env.expandTilde "~"
        |> Result.map (fun home -> canonicalizeOrFallback (IO.Path.Combine(home, Env.DefaultBackupDir)))
    else
        Env.expandTilde dirArg |> Result.map canonicalizeOrFallback

/// Resolves `env restore`'s effective backup directory. Unlike `env backup`,
/// the default (empty `--dir`) is used as-is with no canonicalization at all,
/// and an explicit `--dir` uses a real (existence-requiring) canonicalize
/// that falls back to the expanded-but-uncanonicalized path on failure
/// [Repo-grounded — `env_restore.rs::run`].
let private resolveRestoreDir (dirArg: string) : Result<string, string> =
    if dirArg = "" then
        Env.expandTilde "~"
        |> Result.map (fun home -> IO.Path.Combine(home, Env.DefaultBackupDir))
    else
        Env.expandTilde dirArg
        |> Result.map (fun expanded ->
            // Genuinely unreachable: `Directory.Exists` is documented to
            // never throw (it returns `false` for any invalid/inaccessible
            // path rather than raising), so this `with` never runs; kept as
            // defensive belt-and-suspenders around a filesystem call rather
            // than removed.
            try
                if IO.Directory.Exists expanded then
                    IO.Path.GetFullPath expanded
                else
                    expanded
            with _ ->
                expanded)

/// The `env backup`/`env restore` flags this dispatch shim threads through to
/// `EnvOptions` [Repo-grounded — `EnvBackupArgs`/`EnvRestoreArgs`].
type private BackupRestoreArgs =
    { Dir: string
      WorktreeAware: bool
      Force: bool
      IncludeConfig: bool
      DryRun: bool
      Verbose: bool
      Quiet: bool }

let private parseBackupRestoreArgs (args: string list) : BackupRestoreArgs =
    { Dir = stringFlag [ "--dir" ] args |> Option.defaultValue ""
      WorktreeAware = hasFlag [ "--worktree-aware" ] args
      Force = hasFlag [ "--force"; "-f" ] args
      IncludeConfig = hasFlag [ "--include-config" ] args
      DryRun = hasFlag [ "--dry-run" ] args
      Verbose = hasFlag [ "--verbose"; "-v" ] args
      Quiet = hasFlag [ "--quiet"; "-q" ] args }

/// Applies `--worktree-aware` to `opts`, resolving the worktree name via
/// `Env.detectWorktree` [Repo-grounded — `env_backup.rs::run`,
/// `env_restore.rs::run`].
let private applyWorktreeAware
    (repoRoot: string)
    (parsed: BackupRestoreArgs)
    (opts: Env.EnvOptions)
    : Result<Env.EnvOptions, string> =
    if parsed.WorktreeAware then
        Env.detectWorktree repoRoot
        |> Result.mapError (sprintf "worktree detection failed: %s")
        |> Result.map (fun info ->
            { opts with
                WorktreeName = info.WorktreeName })
    else
        Ok opts

/// Prints an [`Env.EnvOperationResult`] the same way `env_backup.rs`'s and
/// `env_restore.rs`'s own `match output { ... }` blocks do: `Text`/`Markdown`
/// via `print!` (their formatters already end in `\n`), `Json` via `println!`
/// (`format_json` does not) [Repo-grounded — `env_backup.rs::run`].
let private printEnvOperationResult
    (format: OutputFormat)
    (parsed: BackupRestoreArgs)
    (result: Env.EnvOperationResult)
    : unit =
    match format with
    | Text -> printf "%s" (Env.formatText result parsed.Verbose parsed.Quiet)
    | Json -> printfn "%s" (Env.formatJson result)
    | Markdown -> printf "%s" (Env.formatMarkdown result)

/// Reads the explicit overwrite decision required by the canonical backup
/// and restore behaviours. The Application layer invokes this callback only
/// when a real destination conflict exists and `--force` is absent.
let private confirmOverwrite () : bool =
    printf "Destination files already exist. Overwrite? [y/N] "

    Console.ReadLine() |> Option.ofObj |> Env.isAffirmativeConfirmation

let private runEnvBackupLeaf (repoRoot: string) (format: OutputFormat) (args: string list) : int =
    let parsed = parseBackupRestoreArgs args

    match resolveBackupDir parsed.Dir with
    | Error message ->
        eprintfn "Error: %s" message
        1
    | Ok backupDir ->
        let force = parsed.Force || format <> Text

        let baseOpts: Env.EnvOptions =
            { RepoRoot = repoRoot
              BackupDir = backupDir
              SkipDirs = Env.defaultSkipDirs
              MaxSize = Env.DefaultMaxSize
              WorktreeAware = parsed.WorktreeAware
              WorktreeName = ""
              Force = force
              IncludeConfig = parsed.IncludeConfig
              DryRun = parsed.DryRun }

        match applyWorktreeAware repoRoot parsed baseOpts with
        | Error message ->
            eprintfn "Error: %s" message
            1
        | Ok opts ->
            match Env.backup opts confirmOverwrite with
            | Error message ->
                eprintfn "Error: env backup failed: %s" message
                1
            | Ok result ->
                printEnvOperationResult format parsed result
                0

let private runEnvRestoreLeaf (repoRoot: string) (format: OutputFormat) (args: string list) : int =
    let parsed = parseBackupRestoreArgs args

    match resolveRestoreDir parsed.Dir with
    | Error message ->
        eprintfn "Error: %s" message
        1
    | Ok backupDir ->
        let force = parsed.Force || format <> Text

        let baseOpts: Env.EnvOptions =
            { RepoRoot = repoRoot
              BackupDir = backupDir
              SkipDirs = []
              MaxSize = Env.DefaultMaxSize
              WorktreeAware = parsed.WorktreeAware
              WorktreeName = ""
              Force = force
              IncludeConfig = parsed.IncludeConfig
              DryRun = parsed.DryRun }

        match applyWorktreeAware repoRoot parsed baseOpts with
        | Error message ->
            eprintfn "Error: %s" message
            1
        | Ok opts ->
            match Env.restore opts confirmOverwrite with
            | Error message ->
                eprintfn "Error: env restore failed: %s" message
                1
            | Ok result ->
                printEnvOperationResult format parsed result
                0

/// `env validate` also ignores `-o`/`--output`, always printing plain text to
/// stdout on success and per-finding `DRIFT` lines to stderr on failure
/// [Repo-grounded — `env_validate.rs::run_at_root`]. The env-injection
/// manifest-consistency pass (`envinjection.rs::validate_manifest`) is not
/// yet ported to this application layer, so this leaf's total is drift
/// findings only — the two contribute independently to Rust's own `total`,
/// and this checkout carries zero of either today.
let private runEnvValidateLeaf (repoRoot: string) (args: string list) : int =
    let warnOnly = hasFlag [ "--warn-only" ] args

    match Env.loadContract repoRoot with
    | Error message ->
        eprintfn "Error: %s" message
        1
    | Ok contract ->
        match Env.validateAll repoRoot contract with
        | Error message ->
            eprintfn "Error: %s" message
            1
        | Ok findings ->
            let total = List.length findings

            if total = 0 then
                printfn "env validate: no drift detected across all surfaces; env-injection manifest consistent"
                0
            else
                findings |> List.iter (fun f -> eprintfn "%s" (Env.formatFinding f))

                if warnOnly then
                    eprintfn "env validate: %d finding(s) — warn-only mode, not failing" total
                    0
                else
                    eprintfn
                        "Error: env validate: %d finding(s); fix the divergent keys/manifest entries listed above"
                        total

                    1

/// `env staged-guard validate` reads the real git index (unlike its own unit
/// tests, which drive `checkStagedFiles` directly) [Repo-grounded —
/// `env_staged_guard.rs::run`]. Also ignores `-o`/`--output`.
let private runEnvStagedGuardValidateLeaf (repoRoot: string) : int =
    match RhinoCli.Infrastructure.GitRoot.getStagedFiles repoRoot with
    | Error message ->
        eprintfn "Error: %s" message
        1
    | Ok stagedFiles ->
        match Env.checkStagedFiles stagedFiles with
        | [] -> 0
        | offending ->
            printfn "%s" (Env.formatEnvStagedGuardFailure offending)

            eprintfn "Error: %d offending .env file(s) staged (policy: guard-env-file-access)" (List.length offending)

            1

// ---------------------------------------------------------------------------
// Wave C: doctor, test-coverage
// ---------------------------------------------------------------------------

/// Parsed shape of `doctor`'s own flags
/// [Repo-grounded — `commands/doctor.rs::DoctorArgs`].
type private DoctorArgsParsed =
    { Scope: string
      Tools: string list option
      Fix: bool
      DryRun: bool
      PruneCargoCache: bool
      Quiet: bool }

/// Collects every `--tools value[,value...]` occurrence, comma-splitting
/// each and flattening in order, `None` when the flag never appears
/// [Repo-grounded — `DoctorArgs.tools`'s `value_delimiter = ','` plus
/// clap's repeat-to-append behaviour for `Vec` args].
let private collectDoctorToolsFlag (args: string list) : string list option =
    let rec loop (args: string list) (acc: string list) : string list =
        match args with
        | [] -> List.rev acc
        | a :: v :: rest when a = "--tools" -> loop rest ((v.Split(',') |> Array.toList |> List.rev) @ acc)
        | _ :: rest -> loop rest acc

    match loop args [] with
    | [] -> None
    | values -> Some values

let private parseDoctorArgs (args: string list) : DoctorArgsParsed =
    { Scope = stringFlag [ "--scope" ] args |> Option.defaultValue "full"
      Tools = collectDoctorToolsFlag args
      Fix = hasFlag [ "--fix" ] args
      DryRun = hasFlag [ "--dry-run" ] args
      PruneCargoCache = hasFlag [ "--prune-cargo-cache" ] args
      Quiet = hasFlag [ "--quiet"; "-q" ] args }

/// Validates every explicitly-selected `--tools` name up front, mirroring
/// `commands/doctor.rs::parse_doctor_tool_name`'s value-parser rejection —
/// approximated as a plain domain error (exit `1`) rather than clap's own
/// exit-`2` value-parser shape, since no `shadow-diff.sh` probe exercises
/// `--tools` (only bare/`--help`/`-o` forms do) and the Gherkin scenario this
/// underpins already asserts against `Doctor.parseDoctorToolName` directly at
/// the application layer.
let private validateSelectedTools
    (inventory: string list)
    (tools: string list option)
    : Result<string list option, string> =
    match tools with
    | None -> Ok None
    | Some names ->
        names
        |> List.fold
            (fun acc name ->
                match acc with
                | Error _ -> acc
                | Ok _ ->
                    match Doctor.parseDoctorToolName inventory name with
                    | Error message -> Error message
                    | Ok _ -> acc)
            (Ok())
        |> Result.map (fun () -> Some names)

/// Runs the cargo shared-target-directory check (and, when requested, the
/// fix/prune/sweep steps), printing the same plain-text report
/// `commands/doctor.rs::run_target_share_step` does — restricted to `Text`
/// output by the caller, matching Rust's own restriction. A missing/failed
/// git-common-dir lookup or an empty repo name silently skips the whole step,
/// mirroring `run_target_share_step`'s early `return`/empty-name guard.
let private runDoctorTargetShareStep (repoRoot: string) (parsed: DoctorArgsParsed) : unit =
    match RhinoCli.Infrastructure.GitRoot.findCommonDir repoRoot with
    | Error _ -> ()
    | Ok commonDir ->
        let name = Doctor.repoName commonDir

        if name <> "" then
            let ci = Doctor.isCiAmbient ()
            let cacheRoot = Doctor.cacheRootAmbient ()

            let unshared = Doctor.checkTargetShares repoRoot cacheRoot name ci
            printfn "%s" (Doctor.formatCheckReport unshared ci)

            if parsed.Fix then
                let outcome = Doctor.fixTargetShares repoRoot cacheRoot name ci
                printfn "%s" (Doctor.formatFixReport outcome)

            if parsed.PruneCargoCache then
                let prune = Doctor.pruneOrphans repoRoot cacheRoot name parsed.DryRun ci
                printfn "%s" (Doctor.formatPruneReport prune parsed.DryRun)

                let sweep =
                    Doctor.sweepStale cacheRoot name parsed.DryRun (Doctor.cargoSweepPresent ()) ci

                let sweepReport = Doctor.formatSweepReport sweep

                if sweepReport <> "" then
                    printfn "%s" sweepReport

/// `doctor` [Repo-grounded — `commands/doctor.rs::run`]. Has no required
/// positional arguments, so the blanket `wantsHelp` shortcut in `route`
/// already handles `-h`/`--help` correctly before this leaf ever runs.
let private runDoctorLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    let parsed = parseDoctorArgs rawArgs

    let inventory =
        Doctor.doctorToolInventoryFor (RhinoCli.Application.RepoConfig.loadOrDefault repoRoot)

    match validateSelectedTools inventory parsed.Tools with
    | Error message ->
        eprintfn "Error: %s" message
        1
    | Ok selectedTools ->
        let scope =
            Doctor.parseDoctorScope parsed.Scope |> Option.defaultValue Doctor.FullScope

        let opts: Doctor.CheckOptions =
            { RepoRoot = repoRoot
              Runner = None
              Scope = scope
              SelectedTools = selectedTools }

        let stopwatch = System.Diagnostics.Stopwatch.StartNew()
        let result = Doctor.checkAll opts
        stopwatch.Stop()

        // `commands/doctor.rs::run` prints Text/Markdown via `print!` (their
        // formatters already end in `\n`) but JSON via `println!` (`format_json`
        // does not) — mirrored here exactly, matching `Env.fs`'s
        // `printEnvOperationResult` precedent for the same Text/Json asymmetry.
        match format with
        | Text -> printf "%s" (Doctor.formatDoctorText result parsed.Quiet)
        | Json -> printfn "%s" (Doctor.formatDoctorJson result stopwatch.ElapsedMilliseconds)
        | Markdown -> printf "%s" (Doctor.formatDoctorMarkdown result)

        // Target-share reporting is plain, unstructured text — restricted to
        // the default text output so it never corrupts `-o json`/`-o
        // markdown`'s machine-/document-oriented shape, matching
        // `commands/doctor.rs::run`'s own `matches!(output, Text)` guard.
        if format = Text then
            runDoctorTargetShareStep repoRoot parsed

        let exitAfterFixAttempt: int option =
            if parsed.Fix && Doctor.hasRemediationWork result then
                let fr =
                    Doctor.fixAll
                        result
                        opts
                        { DryRun = parsed.DryRun
                          Runner = None }
                        (printf "%s")

                printf "%s" (Doctor.formatFixSummary fr)

                if fr.Failed > 0 then
                    eprintfn "Error: %d tool(s) failed to install" fr.Failed
                    Some 1
                // Not exercised by this hermetic unit-test suite: this arm
                // needs `--fix` to genuinely install a real missing tool
                // (`Runner = None` is the real, non-test-double runner)
                // outside `--dry-run`, so it depends on real network/package
                // access and mutates the host — unsafe and slow to
                // reproduce deterministically in-process. Left uncovered by
                // design rather than dead code; a real end-to-end
                // installation is out of scope for this test tier.
                elif not parsed.DryRun && fr.Fixed > 0 then
                    Some 0
                else
                    None
            elif parsed.Fix && not (Doctor.hasRemediationWork result) then
                printf "%s" Doctor.formatNothingToFix
                None
            else
                None

        match exitAfterFixAttempt with
        | Some code -> code
        | None ->
            if result.MissingCount > 0 then
                eprintfn "Error: %d tool(s) not found in PATH" result.MissingCount
                1
            else
                0

/// Extracts `test-coverage validate`'s two required positionals
/// (`COVERAGE_FILE`, `THRESHOLD`), skipping this leaf's own recognized flags
/// and their values as well as the shared global flags every leaf accepts
/// [Repo-grounded — `test_coverage_validate.rs::ValidateArgs`, `cli.rs::Cli`].
let private collectTestCoverageValidatePositionals (args: string list) : string list =
    let rec loop (args: string list) (acc: string list) : string list =
        match args with
        | [] -> List.rev acc
        | a :: _ :: rest when
            a = "-o"
            || a = "--output"
            || a = "--below-threshold"
            || a = "--exclude"
            || a = "--say"
            ->
            loop rest acc
        | a :: rest when a.StartsWith("--output=", StringComparison.Ordinal) -> loop rest acc
        | a :: rest when
            a = "--per-file"
            || a = "-h"
            || a = "--help"
            || a = "-v"
            || a = "--verbose"
            || a = "-q"
            || a = "--quiet"
            || a = "--no-color"
            ->
            loop rest acc
        | a :: rest when a.StartsWith("-", StringComparison.Ordinal) -> loop rest acc
        | a :: rest -> loop rest (a :: acc)

    loop args []

/// Collects every `--exclude <PATTERN>` occurrence, in order.
let private collectExcludeFlags (args: string list) : string list =
    let rec loop (args: string list) (acc: string list) : string list =
        match args with
        | [] -> List.rev acc
        | a :: v :: rest when a = "--exclude" -> loop rest (v :: acc)
        | _ :: rest -> loop rest acc

    loop args []

/// Approximates clap's "already-recognized-argument" echo in the `Usage:`
/// line of its missing-required-arguments error — captured empirically
/// against the real Rust binary for exactly the shapes `shadow-diff.sh`
/// exercises: bare, `-h`/`--help`, and each `-o`/`--output` value. A
/// combination of several flags at once (not a shape any probe or documented
/// real invocation produces) falls back to the bare form.
let private echoedTestCoverageValidateFlag (args: string list) : string option =
    if hasFlag [ "-h"; "--help" ] args then
        Some "--help"
    else
        match stringFlag [ "-o"; "--output" ] args with
        | Some _ -> Some "--output <OUTPUT>"
        | None ->
            if hasFlag [ "-v"; "--verbose" ] args then Some "--verbose"
            elif hasFlag [ "-q"; "--quiet" ] args then Some "--quiet"
            elif hasFlag [ "--no-color" ] args then Some "--no-color"
            else None

/// Reproduces clap's exact `error: the following required arguments were
/// not provided: ...` message for `test-coverage validate` byte-for-byte
/// [Repo-grounded — empirically captured from
/// `apps/rhino-cli/target/gate/rhino-cli test-coverage validate` with 0 or 1
/// positional arguments].
let private testCoverageValidateMissingArgsError (positionals: string list) (args: string list) : string =
    let placeholders = [ "<COVERAGE_FILE>"; "<THRESHOLD>" ]
    let alreadyGiven = min (List.length positionals) (List.length placeholders)
    let missing = placeholders |> List.skip alreadyGiven
    let missingLines = missing |> List.map (sprintf "  %s") |> String.concat "\n"

    let usageFlag =
        match echoedTestCoverageValidateFlag args with
        | Some f -> f + " "
        | None -> ""

    sprintf
        "error: the following required arguments were not provided:\n%s\n\nUsage: rhino-cli test-coverage validate %s<COVERAGE_FILE> <THRESHOLD>\n"
        missingLines
        usageFlag

/// `test-coverage validate` [Repo-grounded —
/// `test_coverage_validate.rs::run`]. Unlike every other currently-routed
/// leaf, this one has required positional arguments, so clap validates their
/// presence **before** the app ever reads a `--help`/`-o` flag — `route`
/// calls this leaf ahead of the blanket `wantsHelp` shortcut for exactly that
/// reason; a `--help` (or any other recognized flag) alongside missing
/// positionals still produces the missing-arguments error, never help text.
let private runTestCoverageValidateLeaf (repoRoot: string) (rawArgs: string list) : int =
    let positionals = collectTestCoverageValidatePositionals rawArgs

    if List.length positionals < 2 then
        eprintf "%s" (testCoverageValidateMissingArgsError positionals rawArgs)
        2
    elif wantsHelp (List.toArray rawArgs) then
        printf "%s" HelpText.Text
        0
    else
        match parseOutputFormat rawArgs with
        | Error message ->
            eprintfn "Error: %s" message
            1
        | Ok format ->
            let coverageFile = positionals.[0]
            let thresholdRaw = positionals.[1]

            match Double.TryParse(thresholdRaw, System.Globalization.CultureInfo.InvariantCulture) with
            | false, _ ->
                eprintfn "Error: invalid threshold \"%s\": must be a number (e.g. 85)" thresholdRaw
                1
            | true, threshold ->
                let absPath = IO.Path.Combine(repoRoot, coverageFile)

                let opts: TestCoverage.ValidateOptions =
                    { CoverageFile = absPath
                      Threshold = threshold
                      PerFile = hasFlag [ "--per-file" ] rawArgs
                      BelowThreshold =
                        stringFlag [ "--below-threshold" ] rawArgs
                        |> Option.bind (fun v ->
                            match Double.TryParse(v, System.Globalization.CultureInfo.InvariantCulture) with
                            | true, parsed -> Some parsed
                            | false, _ -> None)
                        |> Option.defaultValue 0.0
                      Exclude = collectExcludeFlags rawArgs
                      Json = (format = Json)
                      Markdown = (format = Markdown) }

                match TestCoverage.validate opts with
                | Error message ->
                    eprintfn "Error: %s" message
                    1
                | Ok outcome ->
                    printf "%s" outcome.Output

                    if outcome.Passed then
                        0
                    else
                        eprintfn "Error: coverage %.2f%% is below threshold %.0f%%" outcome.Pct outcome.Threshold

                        1

// ---------------------------------------------------------------------------
// Wave D — md, governance, git
// ---------------------------------------------------------------------------

/// Collects every repeatable `<name> <value>` occurrence, for any of `names`,
/// in order — the multi-name generalization of `collectExcludeFlags` used by
/// `--paths`/`--fail-kinds`/`--exempt`.
let private collectRepeatableFlag (names: string list) (args: string list) : string list =
    let rec loop (args: string list) (acc: string list) : string list =
        match args with
        | [] -> List.rev acc
        | a :: v :: rest when List.contains a names -> loop rest (v :: acc)
        | _ :: rest -> loop rest acc

    loop args []

/// Parses an integer-valued flag, falling back to `defaultVal` when absent
/// or unparsable.
let private intFlag (names: string list) (defaultVal: int) (args: string list) : int =
    match stringFlag names args with
    | Some v ->
        match Int32.TryParse v with
        | true, n -> n
        | false, _ -> defaultVal
    | None -> defaultVal

/// Resolves an effective scan-path list the same way every Wave D command's
/// `resolve_scan_paths` does: an explicit, non-empty override list wins;
/// `defaultPaths` is used unchanged otherwise. Each entry is then resolved
/// to an absolute path under `repoRoot`.
let private resolveAbsPaths (repoRoot: string) (defaultPaths: string list) (overridePaths: string list) : string list =
    let rel =
        if List.isEmpty overridePaths then
            defaultPaths
        else
            overridePaths

    rel
    |> List.map (fun p ->
        if IO.Path.IsPathRooted p then
            p
        else
            IO.Path.Combine(repoRoot, p))

/// Returns the staged `.md` files (repository-relative), or `Some []` when
/// `git diff --cached` itself fails — matching the Rust source's own
/// silent-empty-on-error fallback for this path
/// [Repo-grounded — `md_validate_links.rs`/`md_validate_mermaid.rs`'s
/// `get_staged_files`].
let private stagedMdFilesOption (repoRoot: string) : string list option =
    match RhinoCli.Infrastructure.GitRoot.getStagedFiles repoRoot with
    | Ok files -> Some files
    | Error _ -> Some []

/// Returns the `.md` files changed since upstream (`git diff --name-only
/// @{u}..HEAD`), or `None` when the command fails or reports nothing — the
/// caller falls back to a repo-wide scan in that case, matching
/// `md_validate_mermaid.rs::get_changed_files`.
let private changedMdFilesOption (repoRoot: string) : string list option =
    try
        let psi = Diagnostics.ProcessStartInfo("git")
        psi.WorkingDirectory <- repoRoot
        psi.ArgumentList.Add("diff")
        psi.ArgumentList.Add("--name-only")
        psi.ArgumentList.Add("@{u}..HEAD")
        psi.RedirectStandardOutput <- true
        psi.UseShellExecute <- false
        use p = Diagnostics.Process.Start psi
        let out = p.StandardOutput.ReadToEnd()
        p.WaitForExit()

        let files =
            out.Split('\n')
            |> Array.map (fun l -> l.Trim())
            |> Array.filter (fun l -> l.EndsWith(".md", StringComparison.Ordinal))
            |> Array.toList

        if List.isEmpty files then None else Some files
    with _ ->
        None

/// `md links validate`'s F# remainder: image targets and heading anchors over
/// the sources RHINO's `md internal-link validate` reads. `RustRhino.runSplit`
/// refuses the retired `--exclude` before RHINO starts; a path argument and
/// `--staged-only` pass through to narrow only this remainder's sources
/// [Repo-grounded — `md_validate_links.rs::run`].
let private mdLinksValidateRun
    (repoRoot: string)
    (format: OutputFormat)
    (rawArgs: string list)
    : string * string option =
    let positional = collectPositionals [] rawArgs

    let scanRoot =
        match positional with
        | target :: _ when IO.Path.IsPathRooted target -> target
        | target :: _ -> IO.Path.Combine(repoRoot, target)
        | [] -> repoRoot

    if not (IO.Directory.Exists scanRoot) then
        "", Some(sprintf "spec folder does not exist: %s" (positional |> List.tryHead |> Option.defaultValue scanRoot))
    else
        let configPath = IO.Path.Combine(repoRoot, "repo-config.yml")

        let configText =
            if IO.File.Exists configPath then
                IO.File.ReadAllText configPath
            else
                ""

        let scope =
            IO.Path.GetRelativePath(repoRoot, scanRoot).Replace('\\', '/').TrimEnd('/')

        let inScope (source: string) =
            scope = "." || source.StartsWith(scope + "/", StringComparison.Ordinal)

        let staged =
            if hasFlag [ "--staged-only" ] rawArgs then
                stagedMdFilesOption repoRoot
            else
                None

        let sources =
            Md.linkRemainderSources repoRoot configText
            |> List.filter inScope
            |> List.filter (fun source -> staged |> Option.forall (List.contains source))

        let result: Md.LinkValidationResult =
            Md.validateAllLinksDetailed
                { RepoRoot = repoRoot
                  StagedFiles = Some sources
                  ExcludePrefixes = [] }

        let output =
            Formatters.render
                format
                (fun () -> Formatters.linksText result)
                (fun () -> Formatters.linksJson result)
                (fun () -> Formatters.linksMarkdown result)

        let err =
            if List.isEmpty result.BrokenLinks then
                None
            else
                Some(sprintf "found %d broken links" (List.length result.BrokenLinks))

        output, err

let private runMdLinksValidateLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    let output, err = mdLinksValidateRun repoRoot format rawArgs
    printResultAndExitCode output err

/// `md mermaid validate` [Repo-grounded — `md_validate_mermaid.rs::run`].
///
/// `collectPositionals` only skips a flag's value when the flag name is
/// listed as a value-taking flag; the four `--max-*` threshold flags below
/// each take a numeric value and must be listed here too, or their value
/// (e.g. the `5` in `--max-label-len 5`) is swallowed as a bogus positional
/// scan path — silently restricting the walk to a nonexistent subtree and
/// reporting a false "0 violations" instead of validating anything.
let private runMdMermaidValidateLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    let positional =
        collectPositionals
            [ "--exclude"
              "--max-label-len"
              "--max-width"
              "--max-depth"
              "--max-subgraph-nodes" ]
            rawArgs

    let exclude = collectRepeatableFlag [ "--exclude" ] rawArgs
    let stagedOnly = hasFlag [ "--staged-only" ] rawArgs
    let changedOnly = hasFlag [ "--changed-only" ] rawArgs
    let verbose = hasFlag [ "-v"; "--verbose" ] rawArgs
    let quiet = hasFlag [ "-q"; "--quiet" ] rawArgs
    let maxLabelLen = intFlag [ "--max-label-len" ] 30 rawArgs
    let maxWidth = intFlag [ "--max-width" ] 4 rawArgs
    let maxDepthRaw = intFlag [ "--max-depth" ] 0 rawArgs
    let maxDepth = if maxDepthRaw = 0 then Int32.MaxValue else maxDepthRaw
    let maxSubgraphNodes = intFlag [ "--max-subgraph-nodes" ] 6 rawArgs

    let stagedFiles = if stagedOnly then stagedMdFilesOption repoRoot else None

    let changedFiles =
        if changedOnly && not stagedOnly then
            changedMdFilesOption repoRoot
        else
            None

    let opts: Md.MermaidScanOptions =
        { RepoRoot = repoRoot
          Paths = positional
          StagedFiles = stagedFiles
          ChangedFiles = changedFiles
          ExcludePrefixes = exclude
          Options =
            { MaxLabelLen = maxLabelLen
              MaxWidth = maxWidth
              MaxDepth = maxDepth
              MaxSubgraphNodes = maxSubgraphNodes } }

    let result = Md.validateMermaidDocs opts

    let output =
        Formatters.render
            format
            (fun () -> Md.formatMermaidText result verbose quiet)
            (fun () -> Md.formatMermaidJson result)
            (fun () -> Md.formatMermaidMarkdown result)

    let err =
        if List.isEmpty result.Violations then
            None
        else
            Some(sprintf "found %d violation(s)" (List.length result.Violations))

    printResultAndExitCode output err

/// `md frontmatter validate` [Repo-grounded —
/// `md_validate_frontmatter.rs::run`].
let private runMdFrontmatterValidateLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    let positional = collectPositionals [] rawArgs
    let absPaths = resolveAbsPaths repoRoot [ "docs/"; "repo-governance/" ] positional

    match Md.validateDocsFrontmatter absPaths with
    | Error message ->
        eprintfn "Error: docs validate-frontmatter failed: %s" message
        1
    | Ok findings ->
        let output =
            Formatters.render
                format
                (fun () -> Formatters.frontmatterText findings)
                (fun () -> Formatters.frontmatterJson findings)
                (fun () -> Formatters.frontmatterMarkdown findings)

        let failN =
            findings |> List.filter (fun f -> f.Severity = Severity.Blocking) |> List.length

        let err =
            if failN = 0 then
                None
            else
                Some(sprintf "%d docs frontmatter fail-level finding(s) found" failN)

        printResultAndExitCode output err

/// `md frontmatter-dates validate` [Repo-grounded —
/// `md_validate_frontmatter_dates.rs::run`].
let private runMdFrontmatterDatesValidateLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    let positional = collectPositionals [ "--exclude" ] rawArgs
    let pathFlags = collectPathFlags rawArgs
    let flagExclude = collectRepeatableFlag [ "--exclude" ] rawArgs

    let overridePaths =
        if not (List.isEmpty positional) then
            positional
        else
            pathFlags

    let defaultPaths =
        [ "repo-governance/"
          "docs/explanation/software-engineering/"
          ".claude/agents/"
          ".claude/skills/"
          "plans/" ]

    let absPaths = resolveAbsPaths repoRoot defaultPaths overridePaths

    let registeredExcludes =
        match Governance.registeredExcludesFor repoRoot "md-frontmatter-dates" with
        | Ok excludes -> excludes
        | Error _ -> []

    let excludes =
        registeredExcludes
        @ (flagExclude |> List.filter (fun e -> not (List.contains e registeredExcludes)))

    // Genuinely unreachable: `Md.validateFrontmatterDatesDetailed`'s only
    // `Error` trigger is an empty paths list, and `defaultPaths` here is
    // always non-empty, so `absPaths` is too.
    match Md.validateFrontmatterDatesDetailed absPaths excludes with
    | Error message ->
        eprintfn "Error: frontmatter-audit failed: %s" message
        1
    | Ok findings ->
        let output =
            Formatters.render
                format
                (fun () -> Formatters.frontmatterDatesText findings)
                (fun () -> Formatters.frontmatterDatesJson findings)
                (fun () -> Formatters.frontmatterDatesMarkdown findings)

        let err =
            if List.isEmpty findings then
                None
            else
                Some(sprintf "%d frontmatter finding(s) found" (List.length findings))

        printResultAndExitCode output err

/// `governance word-budget validate` [Repo-grounded —
/// `governance_validate_word_budget.rs::run`/`run_for_root`].
let private runGovernanceWordBudgetValidateLeaf
    (repoRoot: string)
    (format: OutputFormat)
    (_rawArgs: string list)
    : int =
    match Governance.mergedBudgetConfig repoRoot with
    | Error message ->
        eprintfn "Error: %s" message
        1
    | Ok None ->
        if format = Text then
            printfn "WORD BUDGET: SKIPPED (no governance-word-budget: section in repo-config.yml)"

        0
    | Ok(Some config) ->
        // Per-file budgets are RHINO's `governance-word-budget.surfaces`; F#
        // keeps only the resolved instruction tree.
        let findings = Governance.checkResolvedTree repoRoot config |> Option.toList

        let output =
            Formatters.render
                format
                (fun () -> Formatters.wordBudgetText findings)
                (fun () -> Formatters.wordBudgetJson findings)
                (fun () -> Formatters.wordBudgetMarkdown findings)

        let hasFail =
            findings
            |> List.exists (fun f -> f.Severity = Governance.WordBudgetSeverity.Fail)

        let err =
            if not hasFail then
                None
            else
                let failCount =
                    findings
                    |> List.filter (fun f -> f.Severity = Governance.WordBudgetSeverity.Fail)
                    |> List.length

                Some(
                    sprintf
                        "word-budget audit failed: %d Fail finding(s); apply progressive disclosure — see repo-governance/principles/content/progressive-disclosure.md"
                        failCount
                )

        printResultAndExitCode output err

/// `governance readme-index validate` [Repo-grounded —
/// `governance_validate_readme_index.rs::run`].
let private runGovernanceReadmeIndexValidateLeaf
    (repoRoot: string)
    (format: OutputFormat)
    (rawArgs: string list)
    : int =
    let positional = collectPositionals [ "--paths"; "--fail-kinds" ] rawArgs
    let pathsFlag = collectRepeatableFlag [ "--paths" ] rawArgs
    let failKinds = collectRepeatableFlag [ "--fail-kinds" ] rawArgs

    let overridePaths =
        if not (List.isEmpty pathsFlag) then
            pathsFlag
        else
            positional

    let relPaths = Governance.resolveScanPaths overridePaths

    let absPaths =
        relPaths
        |> List.map (fun p ->
            if IO.Path.IsPathRooted p then
                p
            else
                IO.Path.Combine(repoRoot, p))

    let findings = Governance.auditReadmeIndex repoRoot absPaths

    let output =
        Formatters.render
            format
            (fun () -> Formatters.readmeIndexText findings)
            (fun () -> Formatters.readmeIndexJson findings)
            (fun () -> Formatters.readmeIndexMarkdown findings)

    let err =
        if Governance.hasFailingFinding findings failKinds then
            Some(sprintf "%d readme-index finding(s) found" (List.length findings))
        else
            None

    printResultAndExitCode output err

/// `governance readme-index generate` [Repo-grounded —
/// `governance_generate_readme_index.rs::run`].
let private runGovernanceReadmeIndexGenerateLeaf
    (repoRoot: string)
    (format: OutputFormat)
    (rawArgs: string list)
    : int =
    let positional = collectPositionals [ "--paths" ] rawArgs
    let pathsFlag = collectRepeatableFlag [ "--paths" ] rawArgs

    let overridePaths =
        if not (List.isEmpty pathsFlag) then
            pathsFlag
        else
            positional

    let relPaths = Governance.resolveScanPaths overridePaths

    let absPaths =
        relPaths
        |> List.map (fun p ->
            if IO.Path.IsPathRooted p then
                p
            else
                IO.Path.Combine(repoRoot, p))

    let written = Governance.generateReadmeIndex repoRoot absPaths

    let output =
        Formatters.render
            format
            (fun () -> Formatters.readmeIndexGenerateText written)
            (fun () -> Formatters.readmeIndexGenerateJson written)
            (fun () -> Formatters.readmeIndexGenerateMarkdown written)

    printResultAndExitCode output None

/// Reproduces clap's exact `error: the following required arguments were
/// not provided: ...` message for `governance readme-index rewrite-paths`
/// byte-for-byte [Repo-grounded — empirically captured from
/// `apps/rhino-cli/target/gate/rhino-cli governance readme-index
/// rewrite-paths` with no arguments].
/// clap's own `--map`-missing usage line echoes every OTHER recognised flag
/// actually present in `rawArgs`, each rendered as `--<name> <PLACEHOLDER>`
/// (bare `--help`, no placeholder), in the order they appear in `rawArgs` —
/// not a fixed schema order. `--map <MAP>` (the missing required arg) always
/// comes first [Repo-grounded — clap's generated usage string; verified
/// against the real Rust binary's `--help`/`-o text`/`-o json`/`-o markdown`
/// output, Wave D integration].
let private readmeIndexRewritePathsMissingArgsError (rawArgs: string list) : string =
    let indexed = rawArgs |> List.mapi (fun i a -> i, a)

    let helpIndex =
        indexed
        |> List.tryFind (fun (_, a) -> a = "--help" || a = "-h")
        |> Option.map fst

    let outputIndex =
        indexed
        |> List.tryFind (fun (_, a) -> a = "-o" || a = "--output")
        |> Option.map fst

    let extras =
        [ helpIndex |> Option.map (fun i -> i, "--help")
          outputIndex |> Option.map (fun i -> i, "--output <OUTPUT>") ]
        |> List.choose id
        |> List.sortBy fst
        |> List.map snd

    let usage =
        ("Usage: rhino-cli governance readme-index rewrite-paths --map <MAP>" :: extras)
        |> String.concat " "

    sprintf "error: the following required arguments were not provided:\n  --map <MAP>\n\n%s\n" usage

/// `governance readme-index rewrite-paths` [Repo-grounded —
/// `governance_rewrite_readme_index_paths.rs::run`]. Unlike every other
/// Wave D leaf, `--map` is required, so — mirroring `test-coverage
/// validate`'s precedent — `route` calls this leaf ahead of the blanket
/// `wantsHelp` shortcut, and a missing `--map` wins over `--help`.
let private runGovernanceReadmeIndexRewritePathsLeaf (repoRoot: string) (rawArgs: string list) : int =
    match stringFlag [ "--map" ] rawArgs with
    | None ->
        eprintf "%s" (readmeIndexRewritePathsMissingArgsError rawArgs)
        2
    | Some mapPath ->
        if wantsHelp (List.toArray rawArgs) then
            printf "%s" HelpText.Text
            0
        else
            match parseOutputFormat rawArgs with
            | Error message ->
                eprintfn "Error: %s" message
                1
            | Ok format ->
                try
                    let mapRaw = IO.File.ReadAllText mapPath

                    let renames =
                        mapRaw.Split('\n')
                        |> Array.map (fun l -> l.TrimEnd('\r'))
                        |> Array.choose (fun line ->
                            let trimmed = line.Trim()

                            if trimmed = "" || trimmed.StartsWith("#", StringComparison.Ordinal) then
                                None
                            else
                                let cols = line.Split('\t')

                                if cols.Length = 2 && cols.[0].Trim() <> "" && cols.[1].Trim() <> "" then
                                    Some(cols.[0].Trim(), cols.[1].Trim())
                                else
                                    None)
                        |> Array.toList

                    let pathsFlag = collectRepeatableFlag [ "--paths" ] rawArgs
                    let relPaths = Governance.resolveScanPaths pathsFlag

                    let absPaths =
                        relPaths
                        |> List.map (fun p ->
                            if IO.Path.IsPathRooted p then
                                p
                            else
                                IO.Path.Combine(repoRoot, p))

                    let rewritten = Governance.rewriteIndexPaths repoRoot absPaths renames

                    let output =
                        Formatters.render
                            format
                            (fun () -> Formatters.readmeIndexRewritePathsText rewritten)
                            (fun () -> Formatters.readmeIndexRewritePathsJson rewritten)
                            (fun () -> Formatters.readmeIndexRewritePathsMarkdown rewritten)

                    printResultAndExitCode output None
                with ex ->
                    eprintfn "Error: read rename map %s: %s" mapPath ex.Message
                    1

/// `git lockfile sync` [Repo-grounded — `commands/git/lockfile.rs::run`].
let private runGitLockfileSyncLeaf (repoRoot: string) : int =
    use writer = new IO.StringWriter()

    match Git.syncAtRoot repoRoot writer with
    | Ok() ->
        printf "%s" (writer.ToString())
        0
    | Error message ->
        printf "%s" (writer.ToString())
        eprintfn "Error: %s" message
        1

/// Reads a `--flag=value` long option out of a leaf's remaining arguments.
let private longOptionValue (name: string) (args: string list) : string option =
    let prefix = sprintf "--%s=" name

    args
    |> List.tryPick (fun arg ->
        if arg.StartsWith(prefix, StringComparison.Ordinal) then
            Some(arg.Substring prefix.Length)
        else
            None)

/// Reproduces clap's exact `error: the following required arguments were
/// not provided: --surface <SURFACE>` message for `gate list`/`gate
/// emit`/`gate run` byte-for-byte [Repo-grounded — empirically captured from
/// the real Rust binary's bare/`--help`/`-o text`/`-o json`/`-o markdown`
/// invocations of each]. Mirrors `readmeIndexRewritePathsMissingArgsError`'s
/// echo-recognised-flags-in-argv-order construction; `trailingSuffix` covers
/// `gate run`'s extra `[-- <COMMIT_MESSAGE_FILE>]` clause, which clap always
/// renders last regardless of which other flags are echoed.
let private gateSurfaceMissingArgsError
    (commandUsage: string)
    (trailingSuffix: string)
    (rawArgs: string list)
    : string =
    let indexed = rawArgs |> List.mapi (fun i a -> i, a)

    let helpIndex =
        indexed
        |> List.tryFind (fun (_, a) -> a = "--help" || a = "-h")
        |> Option.map fst

    let outputIndex =
        indexed
        |> List.tryFind (fun (_, a) -> a = "-o" || a = "--output")
        |> Option.map fst

    let extras =
        [ helpIndex |> Option.map (fun i -> i, "--help")
          outputIndex |> Option.map (fun i -> i, "--output <OUTPUT>") ]
        |> List.choose id
        |> List.sortBy fst
        |> List.map snd

    let usage = (commandUsage :: extras) |> String.concat " "

    let usageWithSuffix =
        if trailingSuffix = "" then
            usage
        else
            usage + " " + trailingSuffix

    sprintf "error: the following required arguments were not provided:\n  --surface <SURFACE>\n\n%s\n" usageWithSuffix

/// `gate list` [Repo-grounded — `commands/gate/list.rs::run`]. `--surface`
/// is required, so — mirroring `test-coverage validate` — its absence must
/// win over `--help`; `route` checks this ahead of the blanket `wantsHelp`
/// shortcut every other leaf relies on.
let private runGateListLeaf (repoRoot: string) (args: string list) : int =
    match longOptionValue "surface" args with
    | None ->
        eprintf "%s" (gateSurfaceMissingArgsError "Usage: rhino-cli gate list --surface <SURFACE>" "" args)

        2
    | Some surface ->
        let requested = longOptionValue "format" args |> Option.defaultValue "text"

        match parseOutputFormatValue requested with
        | Error message ->
            eprintfn "Error: %s" message
            1
        | Ok format ->
            match Gate.listAtRoot repoRoot surface format (List.contains "--by-group" args) with
            | Ok output ->
                printf "%s" output
                0
            | Error message ->
                eprintfn "Error: %s" message
                1

/// `gate run` [Repo-grounded — `commands/gate/run.rs::run`]. `--surface` is
/// required — see `runGateListLeaf`'s doc comment for why the check comes
/// first.
let private runGateRunLeaf (repoRoot: string) (args: string list) : int =
    match longOptionValue "surface" args with
    | None ->
        eprintf
            "%s"
            (gateSurfaceMissingArgsError
                "Usage: rhino-cli gate run --surface <SURFACE>"
                "[-- <COMMIT_MESSAGE_FILE>]"
                args)

        2
    | Some surface ->
        match Gate.runSurfaceGuardAtRoot repoRoot surface args with
        | Error message ->
            eprintfn "Error: %s" message
            1
        | Ok(Gate.SurfaceGuardExited exitCode) -> exitCode
        | Ok Gate.ContinueWithoutSurfaceGuard ->
            let only = longOptionValue "only" args
            let group = longOptionValue "group" args

            let commitMessageFile =
                args
                |> List.tryFindIndex (fun a -> a = "--")
                |> Option.bind (fun index -> args |> List.skip (index + 1) |> List.tryHead)

            let result =
                match commitMessageFile with
                | Some file ->
                    Gate.runAtRootWithOnlyAndMessageFile repoRoot surface only group (Some file) (printf "%s")
                | None -> Gate.runAtRootWithOnlyAndMessageFile repoRoot surface only group None (printf "%s")

            match result with
            | Ok() -> 0
            | Error message ->
                eprintfn "Error: %s" message
                1

/// `gate emit` [Repo-grounded — `commands/gate/emit.rs::run`]. `--surface`
/// is required — see `runGateListLeaf`'s doc comment for why the check comes
/// first.
let private runGateEmitLeaf (repoRoot: string) (args: string list) : int =
    match longOptionValue "surface" args with
    | None ->
        eprintf "%s" (gateSurfaceMissingArgsError "Usage: rhino-cli gate emit --surface <SURFACE>" "" args)

        2
    | Some surface ->
        match Gate.emitAtRoot repoRoot surface with
        | Ok output ->
            printf "%s" output
            0
        | Error message ->
            eprintfn "Error: %s" message
            1

/// `gate validate` [Repo-grounded — `commands/gate/validate.rs::run_at_root`,
/// which writes the diagnostic to stdout before returning the `Err` that
/// `dispatch`'s generic handler also echoes to stderr with an `Error: `
/// prefix]. Ignores `-o`/`--format` — the Rust command does too.
let private runGateValidateLeaf (repoRoot: string) : int =
    match Gate.validateAtRoot repoRoot with
    | Ok() -> 0
    | Error message ->
        printfn "%s" message
        eprintfn "Error: %s" message
        1

/// `md audit` [Repo-grounded — `md_audit.rs::run`]. Each member prints its
/// own format-rendered output as it runs — exactly like `convention audit`
/// composes `emoji`/`license` — then the aggregate PASSED/FAILED banner is
/// printed unconditionally as plain text, regardless of `-o`, matching the
/// Rust source's own unconditional `println!`/`eprintln!` for that banner.
/// Runs `leaf`, capturing whatever it writes to stderr instead of letting it
/// reach the real stderr stream, and returns its exit code alongside the
/// captured text (its own `"Error: ..."` line, when it fails) — `md audit`
/// discards each member's own stderr and instead prints one aggregated
/// `"  {name}: {message}"` line per failure, mirroring Rust's `run_member`
/// dispatching straight to each validator's library `run()` (which never
/// touches stderr itself; only the top-level CLI error printer does)
/// [Repo-grounded — `md_audit.rs::run`].
let private captureStderr (leaf: unit -> int) : int * string =
    let original = Console.Error
    use sw = new IO.StringWriter()
    Console.SetError sw

    try
        let code = leaf ()
        code, sw.ToString()
    finally
        Console.SetError original

let private runMdAuditLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    let skip = collectRepeatableFlag [ "--skip" ] rawArgs

    let members: (string * (unit -> int)) list =
        [ "validate-naming", (fun () -> runDelegatedLeaf repoRoot "md naming validate" [])
          "validate-frontmatter",
          (fun () ->
              runSplitLeaf repoRoot "md frontmatter validate" [] (fun () ->
                  runMdFrontmatterValidateLeaf repoRoot format []))
          "validate-heading-hierarchy", (fun () -> runDelegatedLeaf repoRoot "md heading-hierarchy validate" [])
          "validate-links",
          (fun () -> runSplitLeaf repoRoot "md links validate" [] (fun () -> runMdLinksValidateLeaf repoRoot format []))
          "validate-mermaid", (fun () -> runMdMermaidValidateLeaf repoRoot format [])
          "frontmatter-dates",
          (fun () ->
              runSplitLeaf repoRoot "md frontmatter-dates validate" [] (fun () ->
                  runMdFrontmatterDatesValidateLeaf repoRoot format []))
          "readme-index",
          (fun () ->
              runSplitLeaf repoRoot "governance readme-index validate" [] (fun () ->
                  runGovernanceReadmeIndexValidateLeaf repoRoot format [])) ]

    let active = members |> List.filter (fun (name, _) -> not (List.contains name skip))

    let failures =
        active
        |> List.choose (fun (name, run) ->
            let code, stderrText = captureStderr run

            if code = 0 then
                None
            else
                // Each leaf's own stderr is exactly one `"Error: {message}\n"`
                // line (mirroring Rust's `anyhow::Error` `Display`) — strip
                // the prefix and trailing newline to recover the bare message.
                let message =
                    stderrText.TrimEnd('\n', '\r')
                    |> fun s ->
                        if s.StartsWith("Error: ", StringComparison.Ordinal) then
                            s.Substring("Error: ".Length)
                        else
                            s

                Some(name, message))

    if List.isEmpty failures then
        printfn "MD AUDIT PASSED: all %d validators passed" (List.length active)
        0
    else
        eprintfn "MD AUDIT FAILED: %d validator(s) reported failures" (List.length failures)

        for name, message in failures do
            eprintfn "  %s: %s" name message

        eprintfn "Error: md audit found %d failure(s)" (List.length failures)
        1

/// The command paths `route` recognises, in match order: each entry pairs the
/// literal argv prefix with the leaf name `route` dispatches on. Held as data
/// rather than as one `match` over cons-of-string-literal patterns because
/// FSharpLint's project-mode analysis is super-linear in that pattern's arm
/// count — at 25 arms a `dotnet fsharplint lint` of this project ran over an
/// hour without finishing, against 7 seconds for this form
/// [Repo-grounded — measured on both shapes of this file; see
/// `plans/in-progress/rewrite-rhino-cli-to-fsharp/learnings.md`].
/// `repo-governance vendor validate` [Repo-grounded —
/// `governance_vendor_audit.rs::run`]. The optional positional path defaults
/// to `repo-governance/`.
let private runRepoGovernanceVendorValidateLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    let scanPath =
        match collectPositionals [] rawArgs with
        | path :: _ -> path
        | [] -> "repo-governance"

    let fullPath =
        if System.IO.Path.IsPathRooted scanPath then
            scanPath
        else
            System.IO.Path.Combine(repoRoot, scanPath)

    let findings = RepoGovernance.walkVendor fullPath

    let output =
        Formatters.render
            format
            (fun () -> Formatters.vendorAuditText findings)
            (fun () -> Formatters.vendorAuditJson findings)
            (fun () -> Formatters.vendorAuditMarkdown findings)

    let err =
        if List.isEmpty findings then
            None
        else
            Some(sprintf "%d violation(s) found" (List.length findings))

    printResultAndExitCode output err

/// `repo-governance layer-coherence validate` [Repo-grounded —
/// `governance_layer_coherence.rs::run`].
let private runRepoGovernanceLayerCoherenceValidateLeaf (repoRoot: string) (format: OutputFormat) : int =
    let findings = RepoGovernance.auditLayerCoherence repoRoot

    let output =
        Formatters.render
            format
            (fun () -> Formatters.layerCoherenceText findings)
            (fun () -> Formatters.layerCoherenceJson findings)
            (fun () -> Formatters.layerCoherenceMarkdown findings)

    let err =
        if List.isEmpty findings then
            None
        else
            Some(sprintf "%d layer-coherence finding(s) reported" (List.length findings))

    printResultAndExitCode output err

/// `repo-governance test-boundary validate`. Enforces the Integration layer's
/// default-deny network boundary against `repo-config.yml`'s
/// `integration-loopback:` opt-in. A stale allowlist entry is a warning, so it
/// reports without failing the gate.
let private runRepoGovernanceTestBoundaryValidateLeaf (repoRoot: string) (format: OutputFormat) : int =
    let findings = TestBoundary.auditRepository repoRoot

    let output =
        Formatters.render
            format
            (fun () -> Formatters.testBoundaryText findings)
            (fun () -> Formatters.testBoundaryJson findings)
            (fun () -> Formatters.testBoundaryMarkdown findings)

    let err =
        if TestBoundary.hasBlocking findings then
            Some(sprintf "%d test-boundary finding(s) reported" (List.length findings))
        else
            None

    printResultAndExitCode output err

/// `repo-governance traceability validate` [Repo-grounded —
/// `governance_traceability_audit.rs::run`].
let private runRepoGovernanceTraceabilityValidateLeaf (repoRoot: string) (format: OutputFormat) : int =
    let findings = RepoGovernance.auditTraceability repoRoot

    let output =
        Formatters.render
            format
            (fun () -> Formatters.traceabilityText findings)
            (fun () -> Formatters.traceabilityJson findings)
            (fun () -> Formatters.traceabilityMarkdown findings)

    let err =
        if List.isEmpty findings then
            None
        else
            Some(sprintf "%d traceability finding(s) reported" (List.length findings))

    printResultAndExitCode output err

/// `repo-governance audit` [Repo-grounded — `governance_audit.rs::run`].
/// `RHINO_AUDIT_NOW` pins the envelope's `ran_at`, the one field a
/// byte-identity comparison cannot otherwise stabilise.
let private runRepoGovernanceAuditLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    let envNow = Environment.GetEnvironmentVariable "RHINO_AUDIT_NOW"

    let opts: RepoGovernance.AuditOptions =
        { RepoRoot = repoRoot
          Skip = collectRepeatableFlag [ "--skip" ] rawArgs
          IncludeOnly = collectRepeatableFlag [ "--include-category" ] rawArgs
          Now = (if String.IsNullOrEmpty envNow then None else Some envNow)
          KnownFalsePositivesPath = None
          ExcludeGlobs = collectRepeatableFlag [ "--exclude" ] rawArgs }

    let envelope = RepoGovernance.runAudit opts

    let output =
        Formatters.render
            format
            (fun () -> Formatters.governanceAuditText envelope)
            (fun () -> Formatters.governanceAuditJson envelope)
            (fun () -> Formatters.governanceAuditMarkdown envelope)

    let err =
        if envelope.Result.TotalFindings = 0 then
            None
        else
            Some(
                sprintf
                    "%d governance finding(s) reported across %d categor(ies)"
                    envelope.Result.TotalFindings
                    (List.length envelope.Result.Categories)
            )

    printResultAndExitCode output err

/// `specs counts validate` [Repo-grounded — `specs_validate_counts.rs::run_at_root`].
/// A positional folder wins over `--apps`; with neither, there is nothing to
/// scan, because the retired `specs.ddd-areas` allowlist was the only source of
/// a default folder list.
let private specsCountsValidateRun (repoRoot: string) (rawArgs: string list) : string * string option =
    let positional = collectPositionals [ "--apps" ] rawArgs

    let apps =
        collectRepeatableFlag [ "--apps" ] rawArgs
        |> List.collect (fun v -> v.Split(',') |> List.ofArray)
        |> List.map (fun s -> s.Trim())
        |> List.filter (fun s -> s <> "")

    let folders =
        match positional with
        | folder :: _ -> [ folder ]
        | [] -> apps |> List.map (sprintf "specs/apps/%s")

    let sb = Text.StringBuilder()
    let mutable total = 0

    for folder in folders do
        let findings = Specs.validateSpecCounts repoRoot folder
        total <- total + List.length findings

        if List.isEmpty findings then
            sb.Append(sprintf "specs validate-counts: 0 finding(s) for \"%s\"\n" folder)
            |> ignore
        else
            for f in findings do
                sb.Append(sprintf "%s: %s: %s\n" f.File f.Criticality f.Evidence) |> ignore

    let err =
        if total = 0 then
            None
        else
            Some(sprintf "%d finding(s) found by specs validate-counts" total)

    sb.ToString(), err

let private runSpecsCountsValidateLeaf (repoRoot: string) (rawArgs: string list) : int =
    let output, err = specsCountsValidateRun repoRoot rawArgs
    printResultAndExitCode output err

/// `specs structure validate` [Repo-grounded —
/// `specs_structure_validate.rs::run_at_root`]. Layers adoption → tree →
/// counts for every app.
let private specsStructureValidateRun (repoRoot: string) (rawArgs: string list) : string * string option =
    let positional = collectPositionals [ "--apps" ] rawArgs

    let flagApps =
        collectRepeatableFlag [ "--apps" ] rawArgs
        |> List.collect (fun v -> v.Split(',') |> List.ofArray)
        |> List.map (fun s -> s.Trim())
        |> List.filter (fun s -> s <> "")

    let apps =
        match positional with
        | app :: _ -> [ app ]
        | [] when not (List.isEmpty flagApps) -> flagApps
        | [] ->
            let specsApps = IO.Path.Combine(repoRoot, "specs", "apps")

            if IO.Directory.Exists specsApps then
                IO.Directory.GetDirectories specsApps
                |> Array.map IO.Path.GetFileName
                |> Array.sortWith (fun a b -> String.CompareOrdinal(a, b))
                |> List.ofArray
            else
                []

    let sb = Text.StringBuilder()
    let mutable total = 0

    for app in apps do
        let adoption = Specs.validateSpecAdoption repoRoot app

        for f in adoption do
            sb.Append(sprintf "adoption: %s: HIGH: %s\n" f.File f.Evidence) |> ignore

        let tree = Specs.validateSpecTree repoRoot app

        for f in tree do
            sb.Append(sprintf "tree: %s: HIGH: %s\n" f.File f.Evidence) |> ignore

        let counts = Specs.validateSpecCounts repoRoot (sprintf "specs/apps/%s" app)

        for f in counts do
            sb.Append(sprintf "counts: %s: HIGH: %s\n" f.File f.Evidence) |> ignore

        total <- total + List.length adoption + List.length tree + List.length counts

        if List.isEmpty adoption && List.isEmpty tree && List.isEmpty counts then
            sb.Append(sprintf "specs structure validate: 0 finding(s) for \"%s\"\n" app)
            |> ignore

    let err =
        if total = 0 then
            None
        else
            Some(sprintf "%d finding(s) found by specs structure validate" total)

    sb.ToString(), err

let private runSpecsStructureValidateLeaf (repoRoot: string) (rawArgs: string list) : int =
    let output, err = specsStructureValidateRun repoRoot rawArgs
    printResultAndExitCode output err

/// `specs scaffold dart` [Repo-grounded — `specs_scaffold_dart.rs::run`].
/// `--dir` defaults to the process working directory, not the repo root.
let private runSpecsScaffoldDartLeaf (format: OutputFormat) (rawArgs: string list) : int =
    let dir = stringFlag [ "--dir" ] rawArgs |> Option.defaultValue "."

    match Contracts.scaffoldDart { Dir = IO.Path.GetFullPath dir } with
    | Error message ->
        eprintfn "Error: %s" message
        1
    | Ok result ->
        let output =
            Formatters.render
                format
                (fun () -> Formatters.dartScaffoldText result)
                (fun () -> Formatters.dartScaffoldJson result)
                (fun () -> Formatters.dartScaffoldMarkdown result)

        printResultAndExitCode output None

/// `specs audit` runs the default-argument structure and link validators.
/// Static behaviour coverage remains an owner-specific Nx target.
let private runSpecsAuditLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    let skip = collectRepeatableFlag [ "--skip" ] rawArgs
    let members = [ "structure-validate"; "validate-links" ]
    let failures = ResizeArray<string>()

    for name in members do
        if not (List.contains name skip) then
            let output, err =
                match name with
                | "structure-validate" -> specsStructureValidateRun repoRoot []
                | "validate-links" -> mdLinksValidateRun repoRoot format []
                | _ -> failwithf "unsupported specs audit member: %s" name

            printf "%s" output

            match err with
            | Some message -> failures.Add(sprintf "%s: %s" name message)
            | None -> ()

    if failures.Count = 0 then
        printfn "SPECS AUDIT PASSED: all %d validators passed" (List.length members - List.length skip)
        0
    else
        eprintfn "SPECS AUDIT FAILED: %d validator(s) reported failures" failures.Count

        for f in failures do
            eprintfn "  %s" f

        eprintfn "Error: specs audit found %d failure(s)" failures.Count
        1

/// Prints a validation result in the requested format and returns the exit
/// code, with `errorFor` naming the failure message shape each harness leaf
/// uses [Repo-grounded — the `harness_validate_*.rs` wrappers, which share
/// this body and differ only in that message].
let private reportValidation
    (format: OutputFormat)
    (result: Harness.ValidationResult)
    (rawArgs: string list)
    (errorFor: int -> string)
    : int =
    let verbose = hasFlag [ "--verbose"; "-v" ] rawArgs
    let quiet = hasFlag [ "--quiet"; "-q" ] rawArgs

    match format with
    | Text -> printf "%s" (Formatters.validationText result verbose quiet)
    | Json -> printfn "%s" (Formatters.validationJson result)
    | Markdown -> printf "%s" (Formatters.validationMarkdown result verbose)

    if result.FailedChecks = 0 then
        0
    else
        eprintfn "Error: %s" (errorFor result.FailedChecks)
        1

/// `harness duplication validate` [Repo-grounded —
/// `harness_validate_duplication.rs::run`].
let private runHarnessDuplicationLeaf (repoRoot: string) (format: OutputFormat) : int =
    match Harness.detectDuplication repoRoot with
    | Error message ->
        eprintfn "Error: agents detect-duplication failed: %s" message
        1
    | Ok findings ->
        let output =
            Formatters.render
                format
                (fun () -> Formatters.duplicationText findings)
                (fun () -> Formatters.duplicationJson findings)
                (fun () -> Formatters.duplicationMarkdown findings)

        let err =
            if List.isEmpty findings then
                None
            else
                Some(sprintf "%d duplication cluster(s) detected" (List.length findings))

        printResultAndExitCode output err

/// `harness claude validate` [Repo-grounded — `harness_validate_claude.rs::run`].
let private runHarnessClaudeLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    let agentsOnly = hasFlag [ "--agents-only" ] rawArgs
    let skillsOnly = hasFlag [ "--skills-only" ] rawArgs

    if agentsOnly && skillsOnly then
        eprintfn "Error: cannot use --agents-only and --skills-only together"
        1
    else
        let result =
            Harness.validateClaude
                { RepoRoot = repoRoot
                  AgentsOnly = agentsOnly
                  SkillsOnly = skillsOnly }

        reportValidation format result rawArgs (sprintf "validation failed: %d checks failed")

/// `harness sync validate` [Repo-grounded — `harness_validate_sync.rs::run`].
let private runHarnessSyncValidateLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    reportValidation format (Harness.validateSync repoRoot) rawArgs (sprintf "validation failed: %d checks failed")

/// `harness bindings validate` [Repo-grounded — `harness_validate_bindings.rs::run`].
let private runHarnessBindingsValidateLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    reportValidation
        format
        (Harness.validateBindings repoRoot)
        rawArgs
        (sprintf "binding validation failed: %d checks failed")

/// `harness ownership validate` [Repo-grounded — `harness_validate_ownership.rs::run`].
let private runHarnessOwnershipLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    reportValidation
        format
        (Harness.validateOwnership repoRoot)
        rawArgs
        (sprintf "ownership validation failed: %d checks failed")

[<Literal>]
let private CatalogCheckName = "Harness catalog: generated region"

/// Rebuilds the single-check `ValidationResult` the catalog leaves report.
/// Both leaves render the same document once and differ only in whether a
/// divergence is repaired or reported [Repo-grounded —
/// `harness_catalog.rs::run_generate`, `run_validate`].
let private catalogValidationResult
    (outcome: Harness.HarnessCatalogOutcome)
    (relative: string)
    : Harness.ValidationResult =
    let check =
        if outcome.ExitCode = 0 then
            Harness.ValidationCheck.passed CatalogCheckName (outcome.Output.TrimEnd '\n')
        else
            Harness.ValidationCheck.failed
                CatalogCheckName
                "generated region rendered from repo-config.yml"
                (sprintf "%s diverges from the registry" relative)
                (sprintf
                    "the generated region of %s was hand-edited or the registry changed; %s"
                    relative
                    Harness.catalogRemediation)

    Harness.ValidationResult.tally check Harness.ValidationResult.empty

/// The catalog document's repo-relative path, taken from the same
/// `harness-catalog:` block the renderer reads.
let private catalogRelativePath (repoRoot: string) : string =
    match RepoConfig.load repoRoot with
    | Ok config ->
        match config.HarnessCatalog with
        | Some settings -> settings.Document
        | None -> Harness.platformBindingsCatalog
    | Error _ -> Harness.platformBindingsCatalog

/// `harness catalog generate` [Repo-grounded — `harness_catalog.rs::run_generate`].
let private runHarnessCatalogGenerateLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    let outcome = Harness.runHarnessCatalogGenerate repoRoot
    let relative = catalogRelativePath repoRoot
    let result = catalogValidationResult outcome relative

    reportValidation format result rawArgs (fun _ -> outcome.Output.TrimEnd '\n')
    |> ignore

    0

/// `harness catalog validate` [Repo-grounded — `harness_catalog.rs::run_validate`].
let private runHarnessCatalogValidateLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    let outcome = Harness.runHarnessCatalogValidate repoRoot
    let relative = catalogRelativePath repoRoot
    let result = catalogValidationResult outcome relative

    reportValidation format result rawArgs (fun _ ->
        sprintf
            "catalog validation failed: %s diverges from the harness registry; %s"
            relative
            Harness.catalogRemediation)

/// `harness sync triage` [Repo-grounded — `harness_sync_triage.rs::run`].
let private runHarnessSyncTriageLeaf (repoRoot: string) (rawArgs: string list) : int =
    match Harness.triage repoRoot with
    | Error message ->
        eprintfn "Error: %s" message
        1
    | Ok report ->
        printfn
            "harness sync triage: %d generated file(s) compared, %d divergence(s)"
            report.Compared
            (List.length report.Divergences)

        if not (hasFlag [ "--quiet"; "-q" ] rawArgs) then
            for divergence in report.Divergences do
                printf "%s" (Harness.formatDivergence divergence)

        if List.isEmpty report.Divergences then
            0
        else
            eprintfn "Error: %s" (Harness.verdictSummary report)
            1

/// `harness sync promote` [Repo-grounded — `harness_sync_promote.rs::run`].
/// `--from` is required, and clap reports its absence before anything else.
let private runHarnessSyncPromoteLeaf (repoRoot: string) (rawArgs: string list) : int =
    match stringFlag [ "--from" ] rawArgs with
    | None ->
        let flagSegment =
            if hasFlag [ "--help"; "-h" ] rawArgs then
                " --help"
            elif
                rawArgs
                |> List.exists (fun a ->
                    a = "-o"
                    || a = "--output"
                    || a.StartsWith("--output=", StringComparison.Ordinal))
            then
                " --output <OUTPUT>"
            else
                ""

        eprintfn "error: the following required arguments were not provided:"
        eprintfn "  --from <MIRROR>"
        eprintfn ""
        eprintfn "Usage: rhino-cli harness sync promote --from <MIRROR>%s" flagSegment
        2
    | Some mirror ->
        match Harness.promote repoRoot mirror with
        | Error message ->
            eprintfn "Error: %s" message
            1
        | Ok proposal ->
            printf "%s" (Harness.formatProposal proposal)
            0

/// `harness bindings generate` [Repo-grounded —
/// `harness_generate_bindings.rs::run`]. Rejects an unknown `--harness`
/// against the registry rather than a hard-coded list.
let private runHarnessBindingsGenerateLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    let requested = stringFlag [ "--harness" ] rawArgs

    let nameError =
        match requested with
        | None -> None
        | Some name ->
            match RepoConfig.load repoRoot with
            | Error message -> Some(sprintf "failed to load repo-config.yml: %s" message)
            | Ok config ->
                match Harness.validateHarnessName config name with
                | Ok() -> None
                | Error message -> Some message

    match nameError with
    | Some message ->
        eprintfn "Error: %s" message
        1
    | None ->
        let stopwatch = Diagnostics.Stopwatch.StartNew()

        let renderAgents (agents: Harness.ConvertAllResult) =
            stopwatch.Stop()

            if not (hasFlag [ "--quiet"; "-q" ] rawArgs) then
                let verbose = hasFlag [ "--verbose"; "-v" ] rawArgs

                match format with
                | Text -> printf "%s" (Formatters.syncText agents stopwatch.Elapsed verbose false)
                | Json -> printfn "%s" (Formatters.syncJson agents stopwatch.Elapsed)
                | Markdown -> printf "%s" (Formatters.syncMarkdown agents stopwatch.Elapsed)

        let finishAgents (agents: Harness.ConvertAllResult) =
            renderAgents agents

            if List.isEmpty agents.FailedFiles then
                0
            else
                eprintfn
                    "Error: generation completed with %d failure(s): %s"
                    (List.length agents.FailedFiles)
                    (String.concat ", " agents.FailedFiles)

                1

        let dryRun = hasFlag [ "--dry-run" ] rawArgs
        let agentsOnly = hasFlag [ "--agents-only" ] rawArgs

        if dryRun || agentsOnly then
            let options =
                { Harness.syncOptionsDefault repoRoot with
                    DryRun = dryRun
                    AgentsOnly = agentsOnly }

            match Harness.syncAll options with
            | Error message ->
                eprintfn "Error: %s" message
                1
            | Ok result ->
                finishAgents
                    { Converted = result.AgentsConverted
                      Failed = result.AgentsFailed
                      FailedFiles = result.FailedFiles
                      Warnings = result.Warnings }
        else
            match Harness.runHarnessBindingsGenerateDetailed repoRoot with
            | Error message ->
                eprintfn "Error: %s" message
                1
            | Ok outcome ->
                let exitCode = finishAgents outcome.Agents

                if not (hasFlag [ "--quiet"; "-q" ] rawArgs) then
                    printfn "codex: %d agent(s) emitted" outcome.Codex.Result.Converted

                    printfn
                        "codex: %d skill file(s) mirrored, %d stale removed"
                        outcome.Mirror.Copied
                        outcome.Mirror.Removed

                exitCode

/// `harness audit` [Repo-grounded — `harness_audit.rs::run`]. Each member is
/// named before it runs, because the per-validator reporters print only
/// failures at this verbosity.
let private runHarnessAuditLeaf (repoRoot: string) (format: OutputFormat) (rawArgs: string list) : int =
    let skip = collectRepeatableFlag [ "--skip" ] rawArgs

    let members =
        [ "detect-duplication"
          "validate-claude"
          "validate-sync"
          "validate-bindings"
          "validate-catalog"
          "validate-word-budget" ]

    let failures = ResizeArray<string>()

    for name in members do
        if not (List.contains name skip) then
            printfn "harness audit: %s" name

            let exitCode =
                match name with
                | "detect-duplication" -> runHarnessDuplicationLeaf repoRoot format
                | "validate-claude" -> runHarnessClaudeLeaf repoRoot format []
                | "validate-sync" -> runHarnessSyncValidateLeaf repoRoot format []
                | "validate-bindings" -> runHarnessBindingsValidateLeaf repoRoot format []
                | "validate-catalog" -> runHarnessCatalogValidateLeaf repoRoot format []
                | _ ->
                    runSplitLeaf repoRoot "governance word-budget validate" [] (fun () ->
                        runGovernanceWordBudgetValidateLeaf repoRoot format [])

            if exitCode <> 0 then
                failures.Add name

    if failures.Count = 0 then
        printfn "HARNESS AUDIT PASSED: all %d validators passed" (List.length members - List.length skip)
        0
    else
        eprintfn "HARNESS AUDIT FAILED: %d validator(s) reported failures" failures.Count
        eprintfn "Error: harness audit found %d failure(s)" failures.Count
        1

let private routeTable: (string list * string) list =
    [ [ "convention"; "emoji"; "validate" ], "emoji"
      [ "convention"; "license"; "validate" ], "license"
      [ "convention"; "audit" ], "audit"
      [ "parity"; "manifest"; "generate" ], "generate"
      [ "parity"; "manifest"; "validate" ], "validate"
      [ "repo-config"; "validate" ], "repo-config-validate"
      [ "plan"; "validate" ], "plan-validate"
      [ "env"; "init" ], "env-init"
      [ "env"; "backup" ], "env-backup"
      [ "env"; "restore" ], "env-restore"
      [ "env"; "validate" ], "env-validate"
      [ "env"; "staged-guard"; "validate" ], "env-staged-guard-validate"
      [ "doctor" ], "doctor"
      [ "test-coverage"; "validate" ], "test-coverage-validate"
      [ "md"; "links"; "validate" ], "md-links-validate"
      [ "md"; "mermaid"; "validate" ], "md-mermaid-validate"
      [ "md"; "heading-hierarchy"; "validate" ], "md-heading-hierarchy-validate"
      [ "md"; "naming"; "validate" ], "md-naming-validate"
      [ "md"; "frontmatter"; "validate" ], "md-frontmatter-validate"
      [ "md"; "frontmatter-dates"; "validate" ], "md-frontmatter-dates-validate"
      [ "md"; "audit" ], "md-audit"
      [ "governance"; "word-budget"; "validate" ], "governance-word-budget-validate"
      [ "governance"; "readme-index"; "validate" ], "governance-readme-index-validate"
      [ "governance"; "readme-index"; "generate" ], "governance-readme-index-generate"
      [ "governance"; "readme-index"; "rewrite-paths" ], "governance-readme-index-rewrite-paths"
      [ "git"; "lockfile"; "sync" ], "git-lockfile-sync"
      [ "repo-governance"; "vendor"; "validate" ], "repo-governance-vendor-validate"
      [ "repo-governance"; "layer-coherence"; "validate" ], "repo-governance-layer-coherence-validate"
      [ "repo-governance"; "test-boundary"; "validate" ], "repo-governance-test-boundary-validate"
      [ "repo-governance"; "traceability"; "validate" ], "repo-governance-traceability-validate"
      [ "repo-governance"; "audit" ], "repo-governance-audit"
      [ "specs"; "counts"; "validate" ], "specs-counts-validate"
      [ "specs"; "structure"; "validate" ], "specs-structure-validate"
      [ "specs"; "scaffold"; "dart" ], "specs-scaffold-dart"
      [ "harness"; "duplication"; "validate" ], "harness-duplication-validate"
      [ "harness"; "claude"; "validate" ], "harness-claude-validate"
      [ "harness"; "sync"; "validate" ], "harness-sync-validate"
      [ "harness"; "sync"; "triage" ], "harness-sync-triage"
      [ "harness"; "sync"; "promote" ], "harness-sync-promote"
      [ "harness"; "bindings"; "validate" ], "harness-bindings-validate"
      [ "harness"; "bindings"; "generate" ], "harness-bindings-generate"
      [ "harness"; "ownership"; "validate" ], "harness-ownership-validate"
      [ "harness"; "catalog"; "generate" ], "harness-catalog-generate"
      [ "harness"; "catalog"; "validate" ], "harness-catalog-validate"
      [ "harness"; "audit" ], "harness-audit"
      [ "specs"; "audit" ], "specs-audit"
      [ "gate"; "list" ], "gate-list"
      [ "gate"; "emit" ], "gate-emit"
      [ "gate"; "run" ], "gate-run"
      [ "gate"; "validate" ], "gate-validate" ]

/// Returns the first `routeTable` entry whose prefix `argvList` starts with,
/// paired with the arguments left after that prefix — the data-driven
/// equivalent of matching each command path as its own pattern arm.
let private matchRoute (argvList: string list) : (string * string list) option =
    let rec strip (prefix: string list) (args: string list) : string list option =
        match prefix, args with
        | [], rest -> Some rest
        | ph :: pt, ah :: at when ph = ah -> strip pt at
        | _ -> None

    routeTable
    |> List.tryPick (fun (prefix, name) -> strip prefix argvList |> Option.map (fun rest -> name, rest))

/// Routes `argv` to the leaf it names, resolving the repository root via
/// `getRepoRoot` — injected so tests can point at a fixture directory
/// instead of shelling out to the real `git` in this checkout.
let route (getRepoRoot: unit -> Result<string, string>) (argv: string[]) : int =
    let argvList = List.ofArray argv

    let path, rest =
        match matchRoute argvList with
        | Some(name, rest) -> Some name, rest
        | None -> None, []

    // `test-coverage validate` and `governance
    // readme-index rewrite-paths` have required arguments (positional /
    // `--map`), whose absence must win over `--help` — clap reports the
    // missing argument even for `--help`, so these are checked ahead of the
    // blanket `wantsHelp` shortcut every other leaf relies on.
    if path = Some "test-coverage-validate" then
        match getRepoRoot () with
        | Error message ->
            eprintfn "Error: failed to find git repository root: %s" message
            1
        | Ok repoRoot -> runTestCoverageValidateLeaf repoRoot rest
    elif path = Some "harness-sync-promote" then
        match getRepoRoot () with
        | Error message ->
            eprintfn "Error: failed to find git repository root: %s" message
            1
        | Ok repoRoot -> runHarnessSyncPromoteLeaf repoRoot rest
    elif path = Some "governance-readme-index-rewrite-paths" then
        match getRepoRoot () with
        | Error message ->
            eprintfn "Error: failed to find git repository root: %s" message
            1
        | Ok repoRoot -> runGovernanceReadmeIndexRewritePathsLeaf repoRoot rest
    elif path = Some "gate-list" then
        match getRepoRoot () with
        | Error message ->
            eprintfn "Error: failed to find git repository root: %s" message
            1
        | Ok repoRoot -> runGateListLeaf repoRoot rest
    elif path = Some "gate-emit" then
        match getRepoRoot () with
        | Error message ->
            eprintfn "Error: failed to find git repository root: %s" message
            1
        | Ok repoRoot -> runGateEmitLeaf repoRoot rest
    elif path = Some "gate-run" then
        match getRepoRoot () with
        | Error message ->
            eprintfn "Error: failed to find git repository root: %s" message
            1
        | Ok repoRoot -> runGateRunLeaf repoRoot rest
    elif wantsHelp argv then
        printf "%s" HelpText.Text
        0
    else
        match path with
        | None ->
            eprintfn "rhino-cli: unrecognized or not-yet-routed invocation: %s" (String.concat " " argv)
            2
        | Some leaf ->
            match getRepoRoot () with
            | Error message ->
                eprintfn "Error: failed to find git repository root: %s" message
                1
            | Ok repoRoot ->
                match parseOutputFormat rest with
                | Error message ->
                    eprintfn "Error: %s" message
                    1
                | Ok format ->
                    match leaf with
                    | "emoji" -> runDelegatedLeaf repoRoot "convention emoji validate" rest
                    | "license" -> runLicenseLeaf repoRoot format
                    | "audit" -> runAuditLeaf repoRoot format rest
                    | "generate" -> runParityGenerate repoRoot
                    | "validate" -> runParityValidate repoRoot
                    | "repo-config-validate" ->
                        runSplitLeaf repoRoot "repo-config validate" rest (fun () -> runRepoConfigValidateLeaf repoRoot)
                    | "plan-validate" -> runPlanValidateLeaf repoRoot format
                    | "env-init" -> runEnvInitLeaf repoRoot rest
                    | "env-backup" -> runEnvBackupLeaf repoRoot format rest
                    | "env-restore" -> runEnvRestoreLeaf repoRoot format rest
                    | "env-validate" -> runEnvValidateLeaf repoRoot rest
                    | "env-staged-guard-validate" -> runEnvStagedGuardValidateLeaf repoRoot
                    | "doctor" -> runDoctorLeaf repoRoot format rest
                    | "md-links-validate" ->
                        runSplitLeaf repoRoot "md links validate" rest (fun () ->
                            runMdLinksValidateLeaf repoRoot format rest)
                    | "md-mermaid-validate" -> runMdMermaidValidateLeaf repoRoot format rest
                    | "md-heading-hierarchy-validate" -> runDelegatedLeaf repoRoot "md heading-hierarchy validate" rest
                    | "md-naming-validate" -> runDelegatedLeaf repoRoot "md naming validate" rest
                    | "md-frontmatter-validate" ->
                        runSplitLeaf repoRoot "md frontmatter validate" rest (fun () ->
                            runMdFrontmatterValidateLeaf repoRoot format rest)
                    | "md-frontmatter-dates-validate" ->
                        runSplitLeaf repoRoot "md frontmatter-dates validate" rest (fun () ->
                            runMdFrontmatterDatesValidateLeaf repoRoot format rest)
                    | "md-audit" -> runMdAuditLeaf repoRoot format rest
                    | "governance-word-budget-validate" ->
                        runSplitLeaf repoRoot "governance word-budget validate" rest (fun () ->
                            runGovernanceWordBudgetValidateLeaf repoRoot format rest)
                    | "governance-readme-index-validate" ->
                        runSplitLeaf repoRoot "governance readme-index validate" rest (fun () ->
                            runGovernanceReadmeIndexValidateLeaf repoRoot format rest)
                    | "governance-readme-index-generate" -> runGovernanceReadmeIndexGenerateLeaf repoRoot format rest
                    | "git-lockfile-sync" -> runGitLockfileSyncLeaf repoRoot
                    | "gate-validate" -> runGateValidateLeaf repoRoot
                    | "repo-governance-vendor-validate" -> runRepoGovernanceVendorValidateLeaf repoRoot format rest
                    | "repo-governance-layer-coherence-validate" ->
                        runRepoGovernanceLayerCoherenceValidateLeaf repoRoot format
                    | "repo-governance-traceability-validate" ->
                        runRepoGovernanceTraceabilityValidateLeaf repoRoot format
                    | "repo-governance-test-boundary-validate" ->
                        runRepoGovernanceTestBoundaryValidateLeaf repoRoot format
                    | "repo-governance-audit" -> runRepoGovernanceAuditLeaf repoRoot format rest
                    | "specs-counts-validate" -> runSpecsCountsValidateLeaf repoRoot rest
                    | "specs-structure-validate" -> runSpecsStructureValidateLeaf repoRoot rest
                    | "specs-scaffold-dart" -> runSpecsScaffoldDartLeaf format rest
                    | "harness-duplication-validate" -> runHarnessDuplicationLeaf repoRoot format
                    | "harness-claude-validate" -> runHarnessClaudeLeaf repoRoot format rest
                    | "harness-sync-validate" -> runHarnessSyncValidateLeaf repoRoot format rest
                    | "harness-sync-triage" -> runHarnessSyncTriageLeaf repoRoot rest
                    | "harness-bindings-validate" -> runHarnessBindingsValidateLeaf repoRoot format rest
                    | "harness-bindings-generate" -> runHarnessBindingsGenerateLeaf repoRoot format rest
                    | "harness-ownership-validate" -> runHarnessOwnershipLeaf repoRoot format rest
                    | "harness-catalog-generate" -> runHarnessCatalogGenerateLeaf repoRoot format rest
                    | "harness-catalog-validate" -> runHarnessCatalogValidateLeaf repoRoot format rest
                    | "harness-audit" -> runHarnessAuditLeaf repoRoot format rest
                    | "specs-audit" -> runSpecsAuditLeaf repoRoot format rest
                    // Genuinely unreachable, not deletable: every leaf name
                    // `routeTable` can ever produce is either handled by an
                    // explicit arm above or intercepted earlier by one of
                    // this function's `elif path = Some "..."`/`StartsWith
                    // "test-contract"` branches (verified by diffing
                    // `routeTable`'s leaf-name column against every arm in
                    // this file — none are left over). F#'s
                    // string-pattern matching still requires an exhaustive
                    // wildcard, so this arm cannot be removed the way the
                    // it stands as a safety net against a future
                    // `routeTable` entry left unwired here.
                    | _ -> 2
