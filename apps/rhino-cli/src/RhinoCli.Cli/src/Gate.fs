/// Renders `gate list` for one declared surface, in the exact text and JSON
/// shapes the Rust CLI layer emits
/// [Repo-grounded — `apps/rhino-cli/src/commands/gate/list.rs`].
///
/// Kept in `RhinoCli.Cli` rather than `RhinoCli.Application` because the Rust
/// source draws the same line: the registry itself is application state
/// (`repo_config`), while this per-surface projection and its two output
/// envelopes are a CLI-output concern.
module RhinoCli.Cli.Gate

open System
open System.Diagnostics.CodeAnalysis
open System.IO
open System.Text.Json
open System.Text.Json.Nodes
open System.Text.RegularExpressions
open System.Diagnostics
open System.Text.Json.Serialization
open System.Text.Encodings.Web
open YamlDotNet.RepresentationModel
open RhinoCli.Domain.Types
open RhinoCli.Application.RepoConfig
open RhinoCli.Infrastructure

let private jsonOptions =
    let opts = JsonSerializerOptions()
    opts.WriteIndented <- true
    opts.Encoder <- JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    opts.DefaultIgnoreCondition <- JsonIgnoreCondition.WhenWritingNull
    opts

/// JSON-friendly projection of one gate on one surface, mirroring Rust's
/// `GateListEntry`. `hand_wired` is deliberately absent: Rust marks it
/// `#[serde(skip_serializing)]` and uses it only to pick the text-format
/// marker.
type GateListEntryJson =
    { id: string
      [<JsonPropertyName("type")>]
      gateType: string
      command: string
      doctor_tools: string list
      scope: string
      [<JsonPropertyName("carve-out")>]
      carveOut: string
      category: string
      verifies: string
      wiring: string
      surfaces: string list }

/// JSON-friendly projection of one declared `ci_group` and its members,
/// mirroring Rust's `GateGroupEntry`.
type GateGroupEntryJson =
    { group: string
      gates: string list
      doctor_tools: string list }

/// serde omits an absent optional string; System.Text.Json omits `null`.
let private orNull (value: string option) : string =
    match value with
    | Some text -> text
    | None -> null

let private surfaceName (surface: GateSurface) : string =
    match surface with
    | CommitMsg -> "commit-msg"
    | PreCommit -> "pre-commit"
    | PrePush -> "pre-push"
    | Ci -> "ci"

/// The environment a gate run hands every child it launches: `inherited`
/// with `OSE_GATE_SURFACE` naming the surface this run executes, replacing
/// any value a launcher exported. The pinned Rust RHINO runner exports the
/// same variable to its children, so a registry gate it launches for one
/// surface still tells its own children the surface they run for.
let surfaceEnvironment (surface: GateSurface) (inherited: Map<string, string>) : Map<string, string> =
    inherited |> Map.add "OSE_GATE_SURFACE" (surfaceName surface)

let private childEnvironment (surface: GateSurface) : (string * string) list =
    surfaceEnvironment surface Map.empty |> Map.toList

let private gateTypeName (gateType: GateType) : string =
    match gateType with
    | Check -> "check"
    | Mutation -> "mutation"

let private scopeName (scope: ScopeKind) : string =
    match scope with
    | AffectedFileType -> "affected-file-type"
    | AllFileType -> "all-file-type"
    | AffectedProjects -> "affected-projects"
    | AllProjects -> "all-projects"
    | Other -> "other"
    | PathGated -> "path-gated"

let private carveOutName (carveOut: GateCarveOut option) : string option =
    carveOut |> Option.map (fun StagedOnly -> "staged-only")

let private wiringName (wiring: GateWiring option) : string option =
    wiring
    |> Option.map (fun value ->
        match value with
        | Matrix -> "matrix"
        | HandWired -> "hand-wired")

/// Parses a command-line surface name into its registry variant
/// [Repo-grounded — `gate/list.rs::parse_surface`].
let parseSurface (surface: string) : Result<GateSurface, string> =
    match surface with
    | "commit-msg" -> Ok CommitMsg
    | "pre-commit" -> Ok PreCommit
    | "pre-push" -> Ok PrePush
    | "ci" -> Ok Ci
    | other -> Error(sprintf "unknown gate surface \"%s\": expected one of commit-msg, pre-commit, pre-push, ci" other)

/// Rejects a duplicate gate id on one surface, or an `--only` selector that
/// does not select exactly one gate
/// [Repo-grounded — `gate/list.rs::validate_gate_ids`].
let validateGateIds (gates: GateEntry list) (only: string option) : Result<unit, string> =
    match only with
    | Some id ->
        let count = gates |> List.filter (fun gate -> gate.Id = id) |> List.length

        if count <> 1 then
            Error(sprintf "--only gate id \"%s\" must select exactly one gate, found %d" id count)
        else
            Ok()
    | None ->
        let duplicate =
            gates
            |> List.mapi (fun index gate -> index, gate)
            |> List.tryFind (fun (index, gate) ->
                gates |> List.take index |> List.exists (fun other -> other.Id = gate.Id))

        match duplicate with
        | Some(_, gate) -> Error(sprintf "duplicate gate id \"%s\"" gate.Id)
        | None -> Ok()

/// Returns the gates whose declared `ci_group` equals `groupId`, preserving
/// registry declaration order
/// [Repo-grounded — `gate/list.rs::gates_in_ci_group`].
let gatesInCiGroup (gates: GateEntry list) (groupId: string) : GateEntry list =
    gates |> List.filter (fun gate -> gate.CiGroup = Some groupId)

/// Groups gates by their declared `ci_group`, preserving each group's
/// first-appearance order and each gate's registry declaration order within
/// the group [Repo-grounded — `gate/list.rs::group_by_ci_group`].
let private groupByCiGroup (gates: GateEntry list) : Result<(string * GateEntry list) list, string> =
    let missing = gates |> List.tryFind (fun gate -> gate.CiGroup.IsNone)

    match missing with
    | Some gate -> Error(sprintf "gate \"%s\" is missing ci_group required for grouped output" gate.Id)
    | None ->
        let groupIds =
            gates
            |> List.choose (fun gate -> gate.CiGroup)
            |> List.fold (fun acc id -> if List.contains id acc then acc else acc @ [ id ]) []

        Ok(groupIds |> List.map (fun groupId -> groupId, gatesInCiGroup gates groupId))

/// Returns the deduped, sorted union of every gate's declared `doctor_tools`
/// [Repo-grounded — `gate/list.rs::union_doctor_tools`].
let private unionDoctorTools (gates: GateEntry list) : string list =
    gates
    |> List.collect (fun gate -> gate.DoctorTools)
    |> List.distinct
    |> List.sort

let private writeGrouped (gates: GateEntry list) (outputFormat: OutputFormat) : Result<string, string> =
    match groupByCiGroup gates with
    | Error message -> Error message
    | Ok groups ->
        match outputFormat with
        | OutputFormat.Json ->
            let entries =
                groups
                |> List.map (fun (group, members) ->
                    { group = group
                      doctor_tools = unionDoctorTools members
                      gates = members |> List.map (fun gate -> gate.Id) })

            Ok(JsonSerializer.Serialize(entries, jsonOptions) + "\n")
        | OutputFormat.Text
        | OutputFormat.Markdown ->
            groups
            |> List.map (fun (group, members) ->
                let ids = members |> List.map (fun gate -> gate.Id) |> String.concat ", "
                sprintf "%s\t%s\n" group ids)
            |> String.concat ""
            |> Ok

/// Lists gates declared on one surface at a known repository root
/// [Repo-grounded — `gate/list.rs::run_at_root`].
let listFromConfig
    (config: RepoConfig)
    (surface: string)
    (outputFormat: OutputFormat)
    (byGroup: bool)
    : Result<string, string> =
    match parseSurface surface with
    | Error message -> Error message
    | Ok surface ->
        let surfaceGates =
            config.Gates
            |> List.filter (fun gate -> gate.Surfaces |> List.exists (fun (declared, _) -> declared = surface))

        match validateGateIds surfaceGates None with
        | Error message -> Error message
        | Ok() ->
            if byGroup then
                // Hand-wired gates are excluded from every grouped output
                // format, matching `gate run --group`'s unconditional
                // filter: they are dispatched by their own dedicated CI
                // workflow job rather than by `--group`.
                surfaceGates
                |> List.filter (fun gate -> gate.Wiring <> Some HandWired)
                |> fun gates -> writeGrouped gates outputFormat
            else
                let visibleGates =
                    surfaceGates
                    |> List.filter (fun gate -> outputFormat <> OutputFormat.Json || gate.Wiring <> Some HandWired)

                let scopeOf (gate: GateEntry) =
                    gate.Surfaces
                    |> List.pick (fun (declared, scope) -> if declared = surface then Some scope else None)

                match outputFormat with
                | OutputFormat.Json ->
                    let entries =
                        visibleGates
                        |> List.map (fun gate ->
                            { id = gate.Id
                              gateType = gateTypeName gate.GateType
                              command = gate.Command
                              doctor_tools = gate.DoctorTools
                              scope = scopeName (scopeOf gate).Scope
                              carveOut = orNull (carveOutName gate.CarveOut)
                              category = orNull gate.Category
                              verifies = orNull gate.Verifies
                              wiring = orNull (wiringName gate.Wiring)
                              surfaces = gate.Surfaces |> List.map (fst >> surfaceName) })

                    Ok(JsonSerializer.Serialize(entries, jsonOptions) + "\n")
                | OutputFormat.Text
                | OutputFormat.Markdown ->
                    visibleGates
                    |> List.map (fun gate ->
                        let marker = if gate.Wiring = Some HandWired then "\thand-wired" else ""

                        let carveOut =
                            match carveOutName gate.CarveOut with
                            | Some value -> sprintf "\tcarve-out=%s" value
                            | None -> ""

                        sprintf
                            "%s\t%s\t%s\t%s%s%s\n"
                            gate.Id
                            (gateTypeName gate.GateType)
                            gate.Command
                            (scopeName (scopeOf gate).Scope)
                            marker
                            carveOut)
                    |> String.concat ""
                    |> Ok

/// Lists gates after the filesystem adapter has loaded `repo-config.yml`.
[<ExcludeFromCodeCoverage>]
let listAtRoot
    (repoRoot: string)
    (surface: string)
    (outputFormat: OutputFormat)
    (byGroup: bool)
    : Result<string, string> =
    load repoRoot
    |> Result.bind (fun config -> listFromConfig config surface outputFormat byGroup)

/// The lightweight resolver shim generated `rhino-cli`-kind commands invoke
/// instead of a `cargo run` invocation, whose invocation-check tax every
/// hook/gate call would otherwise pay
/// [Repo-grounded — `gate/emit.rs::RHINO_CLI_RESOLVER_SHIM`].
let rhinoCliResolverShim = "apps/rhino-cli/scripts/rhino-bin.sh"

/// Splits a command string into its leading whitespace-delimited token and
/// the whitespace-trimmed remainder
/// [Repo-grounded — `gate/emit.rs::split_leading_token`].
let private splitLeadingToken (command: string) : string * string =
    match command |> Seq.tryFindIndex Char.IsWhiteSpace with
    | None -> command, ""
    | Some index -> command.Substring(0, index), command.Substring(index + 1).TrimStart()

/// Rewrites a node-resolved gate's command to invoke its tool through the
/// repository-local `node_modules/.bin` directory instead of `npx`, whose own
/// resolution/download check runs even when the package is installed
/// [Repo-grounded — `gate/emit.rs::node_modules_bin_command`].
let private nodeModulesBinCommand (command: string) : string =
    let rec skipNpxFlags (arguments: string) : string * string =
        let nextTool, nextArguments = splitLeadingToken arguments

        if nextTool.StartsWith("-", StringComparison.Ordinal) then
            skipNpxFlags nextArguments
        else
            nextTool, nextArguments

    let leadingTool, leadingArguments = splitLeadingToken command

    let tool, arguments =
        if leadingTool = "npx" then
            skipNpxFlags leadingArguments
        else
            leadingTool, leadingArguments

    if arguments = "" then
        sprintf "node_modules/.bin/%s" tool
    else
        sprintf "node_modules/.bin/%s %s" tool arguments

/// Whether a `kind: external` gate resolves its tool from this repository's
/// `node_modules` rather than a system `PATH` binary, signalled by the
/// registry's existing `doctor-tools: [npm]` declaration
/// [Repo-grounded — `gate/emit.rs::is_node_resolved`].
let private isNodeResolved (gate: GateEntry) : bool = gate.DoctorTools |> List.contains "npm"

/// Quotes one generated argument for lint-staged's POSIX-shell command
/// string, keeping configuration values literal
/// [Repo-grounded — `gate/emit.rs::shell_quote`].
let private shellQuote (argument: string) : string =
    let escaped =
        argument.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("$", "\\$").Replace("`", "\\`")

    sprintf "\"%s\"" escaped

/// Quotes a whole script for `bash -c`, retaining literal shell expansion
/// inside it [Repo-grounded — `gate/emit.rs::shell_script_quote`].
let private shellScriptQuote (script: string) : string =
    sprintf "'%s'" (script.Replace("'", "'\"'\"'"))

/// Renders a registry command with its fixed arguments for a generated shell
/// command [Repo-grounded — `gate/emit.rs::command_with_fixed_arguments`].
let private commandWithFixedArguments (gate: GateEntry) : string =
    let command =
        match gate.Kind with
        | RhinoCli -> sprintf "%s %s" rhinoCliResolverShim gate.Command
        | External when isNodeResolved gate -> nodeModulesBinCommand gate.Command
        | External
        | Nx -> gate.Command

    match fixedArguments gate with
    | [] -> command
    | arguments ->
        let quoted =
            arguments
            |> List.mapi (fun index argument -> if index % 2 = 0 then argument else shellQuote argument)
            |> String.concat " "

        sprintf "%s %s" command quoted

/// Whether a pre-commit file-scoped gate belongs in lint-staged's one batch:
/// formatter mutations run inside it so their output reaches later
/// validators, while other mutations stay direct hook work
/// [Repo-grounded — `gate/emit.rs::is_lint_staged_eligible`].
let private isLintStagedEligible (gate: GateEntry) : bool =
    gate.GateType = Check
    || (gate.GateType = Mutation && gate.Category = Some "formatter")

/// Renders one gate as the command lint-staged must execute for its glob
/// [Repo-grounded — `gate/emit.rs::lint_staged_command`].
let private lintStagedCommand (gate: GateEntry) (scope: SurfaceScope) : string =
    let command = commandWithFixedArguments gate

    match scope.LintStagedShell with
    | None -> command
    | Some template ->
        let body =
            match template.IndexOf("{{command}}", StringComparison.Ordinal) with
            | -1 -> template
            | at ->
                template.Substring(0, at)
                + command
                + template.Substring(at + "{{command}}".Length)

        sprintf "bash -c %s --" (shellScriptQuote body)

/// Derives the `lint-staged` block from pre-commit affected-file gates,
/// keeping each glob's first-occurrence order rather than sorting: that order
/// is the generated artifact's declaration-order contract
/// [Repo-grounded — `gate/emit.rs::lint_staged_from_config`].
let lintStagedFromConfig (config: RepoConfig) : (string * string list) list =
    let addCommand (acc: (string * string list) list) (glob: string) (command: string) =
        if acc |> List.exists (fun (declared, _) -> declared = glob) then
            acc
            |> List.map (fun (declared, commands) ->
                if declared = glob then
                    declared, commands @ [ command ]
                else
                    declared, commands)
        else
            acc @ [ glob, [ command ] ]

    config.Gates
    |> List.fold
        (fun acc gate ->
            let preCommit =
                gate.Surfaces
                |> List.tryPick (fun (surface, scope) -> if surface = PreCommit then Some scope else None)

            match preCommit with
            | Some scope when scope.Scope = AffectedFileType && isLintStagedEligible gate ->
                let command = lintStagedCommand gate scope

                Option.toList scope.Glob @ scope.Globs
                |> List.fold (fun acc glob -> addCommand acc glob command) acc
            | _ -> acc)
        []

/// Emits the configured gate surface into its generated artifact at a known
/// repository root [Repo-grounded — `gate/emit.rs::emit_at_root`].
let emitPackageText (config: RepoConfig) (surface: string) (packageText: string) : Result<string * string, string> =
    if surface <> "pre-commit" then
        Error "gate emit currently supports only surface pre-commit"
    else
        try
            match JsonNode.Parse packageText with
            | :? JsonObject as package ->
                let block = JsonObject()

                for glob, commands in lintStagedFromConfig config do
                    let array = JsonArray()

                    for command in commands do
                        array.Add(JsonValue.Create command)

                    block.Add(glob, array)

                // Marker-first: replacing an existing key in place keeps
                // its position, so re-emitting is byte-identical.
                if package.ContainsKey "lint-staged" then
                    package.["lint-staged"] <- block
                else
                    package.Add("lint-staged", block)

                Ok(package.ToJsonString(jsonOptions) + "\n", "Emitted lint-staged from gate surface pre-commit\n")
            | _ -> Error "package.json must contain a JSON object"
        with ex ->
            Error(sprintf "cannot parse package.json: %s" ex.Message)

[<ExcludeFromCodeCoverage>]
let emitAtRoot (repoRoot: string) (surface: string) : Result<string, string> =
    match load repoRoot with
    | Error message -> Error message
    | Ok config ->
        let packagePath = Path.Combine(repoRoot, "package.json")

        try
            let packageText = File.ReadAllText packagePath

            match emitPackageText config surface packageText with
            | Error message -> Error message
            | Ok(updatedPackage, output) ->
                File.WriteAllText(packagePath, updatedPackage)
                Ok output
        with ex ->
            Error(sprintf "cannot read %s: %s" packagePath ex.Message)

/// CI event baseline supplied by the workflow for a push-to-main run
/// [Repo-grounded — `gate/run.rs::GATE_CHANGED_BASE_ENV`].
let private gateChangedBaseEnv = "GATE_CHANGED_BASE"

/// Source of candidate paths used by a gate scope
/// [Repo-grounded — `gate/run.rs::CandidateScope`].
type private CandidateScope =
    | StagedFiles
    | TrackedFiles
    | PathTriggers
    | NoCandidates

/// Maps a registry scope to its candidate-path source
/// [Repo-grounded — `gate/run.rs::candidate_scope`].
let private candidateScope (scope: ScopeKind) : CandidateScope =
    match scope with
    | AffectedFileType -> StagedFiles
    | AllFileType -> TrackedFiles
    | PathGated -> PathTriggers
    | AffectedProjects
    | AllProjects
    | Other -> NoCandidates

/// Translates one `glob` crate pattern into an anchored .NET regex under the
/// crate's default `MatchOptions` — where `require_literal_separator` is
/// false, so `*`, `**`, and `?` all cross `/` [Repo-grounded — the `glob`
/// crate's `Pattern::matches`].
///
/// Returns `None` for a pattern the crate itself would reject, matching
/// Rust's `Pattern::new(..).is_ok_and(..)`, which treats an invalid pattern
/// as one that matches nothing.
///
/// The `Some _ -> None` arm below is unreachable through any CLI path:
/// `gate run` always calls `gateSemanticFindings` (via
/// `validateRegistrySemantics`, below) before evaluating any gate, and that
/// check already rejects a malformed glob with a registry-semantic-finding
/// error using this same `globPatternError` — so `globRegex` only ever runs
/// on globs already proven valid. Left uncovered by design; see
/// `WaveEFGateUnitTests.fs`'s "route rejects an unclosed glob character
/// class as a registry semantic finding".
let private globRegex (pattern: string) : Regex option =
    match globPatternError pattern with
    | Some _ -> None
    | None ->
        let builder = Text.StringBuilder()
        builder.Append '^' |> ignore
        let mutable index = 0

        while index < pattern.Length do
            match pattern.[index] with
            | '?' ->
                builder.Append '.' |> ignore
                index <- index + 1
            | '*' ->
                builder.Append ".*" |> ignore

                while index < pattern.Length && pattern.[index] = '*' do
                    index <- index + 1
            | '[' ->
                let negated = index + 1 < pattern.Length && pattern.[index + 1] = '!'
                let bodyStart = if negated then index + 2 else index + 1

                let closing =
                    seq { bodyStart .. pattern.Length - 1 }
                    |> Seq.find (fun candidate -> pattern.[candidate] = ']')

                let body = pattern.Substring(bodyStart, closing - bodyStart)
                builder.Append('[') |> ignore

                if negated then
                    builder.Append('^') |> ignore

                builder.Append(body.Replace("\\", "\\\\").Replace("^", "\\^")) |> ignore
                builder.Append(']') |> ignore
                index <- closing + 1
            | character ->
                builder.Append(Regex.Escape(string<char> character)) |> ignore
                index <- index + 1

        builder.Append '$' |> ignore
        Some(Regex(builder.ToString()))

/// Whether a path is equal to or below a configured exclusion
/// [Repo-grounded — `gate/run.rs::is_excluded`].
let private isExcluded (path: string) (excludes: string list) : bool =
    excludes
    |> List.exists (fun exclude ->
        let prefix = exclude.TrimEnd '/'

        path = prefix
        || (path.StartsWith(prefix, StringComparison.Ordinal)
            && path.Substring(prefix.Length).StartsWith("/", StringComparison.Ordinal)))

/// Filters candidate paths by configured glob patterns and exclusions
/// [Repo-grounded — `gate/run.rs::filter_candidates`].
let private filterCandidates (candidates: string list) (patterns: string list) (excludes: string list) : string list =
    let compiled = patterns |> List.map globRegex

    candidates
    |> List.filter (fun path ->
        not (isExcluded path excludes)
        && (List.isEmpty patterns
            || compiled
               |> List.exists (fun regex ->
                   match regex with
                   | Some regex -> regex.IsMatch path
                   | None -> false)))

/// Whether a file-scoped gate declares candidate-path patterns
/// [Repo-grounded — `gate/run.rs::scope_has_file_patterns`].
let private scopeHasFilePatterns (scope: SurfaceScope) : bool =
    scope.Glob.IsSome || not (List.isEmpty scope.Globs)

/// Selects candidate paths matching a surface scope and gate exclusions
/// [Repo-grounded — `gate/run.rs::matching_files`].
let private matchingFiles (changedPaths: string list) (scope: SurfaceScope) (excludes: string list) : string list =
    filterCandidates changedPaths (Option.toList scope.Glob @ scope.Globs) excludes

/// Whether any changed path is equal to or under a configured trigger
/// [Repo-grounded — `gate/run.rs::trigger_matches`].
let private triggerMatches (paths: string list) (triggers: string list) : bool =
    paths
    |> List.exists (fun path ->
        triggers
        |> List.exists (fun trigger ->
            let directory = trigger.TrimEnd '/'
            path = directory || path.StartsWith(trigger, StringComparison.Ordinal)))

/// Runs `git` with the given arguments at `repoRoot`, returning its exit
/// success and captured stdout lines. `removeGitEnv` strips `GIT_DIR`/
/// `GIT_WORK_TREE` from the child environment — required when this process
/// itself runs under a worktree-relative `GIT_DIR`/`GIT_WORK_TREE` (as this
/// port's own test harness does), matching Rust's explicit `env_remove`
/// calls at each corresponding call site.
[<ExcludeFromCodeCoverage>]
let private runGit (repoRoot: string) (removeGitEnv: bool) (arguments: string list) : bool * string list =
    let psi =
        ProcessStartInfo(
            FileName = "git",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            WorkingDirectory = repoRoot
        )

    for argument in arguments do
        psi.ArgumentList.Add argument

    if removeGitEnv then
        psi.Environment.Remove "GIT_DIR" |> ignore
        psi.Environment.Remove "GIT_WORK_TREE" |> ignore

    use proc = Process.Start psi
    let stdout = proc.StandardOutput.ReadToEnd()
    proc.StandardError.ReadToEnd() |> ignore
    proc.WaitForExit()

    proc.ExitCode = 0, stdout.Split('\n') |> Array.filter (fun line -> line <> "") |> Array.toList

/// Returns whether `rev` names a commit reachable in `repoRoot`. An
/// unresolvable base (all-zeroes on branch creation, absent after a
/// force-push, absent from an unrelated fixture repository) is treated as
/// "no explicit base" so the caller falls through to the merge base
/// [Repo-grounded — `gate/run.rs::commit_resolves`].
[<ExcludeFromCodeCoverage>]
let private commitResolves (repoRoot: string) (rev: string) : bool =
    fst (runGit repoRoot false [ "rev-parse"; "--verify"; "--quiet"; sprintf "%s^{commit}" rev ])

/// Returns paths changed from an explicit baseline commit to `HEAD`
/// [Repo-grounded — `gate/run.rs::changed_paths_from_base`].
[<ExcludeFromCodeCoverage>]
let private changedPathsFromBase (repoRoot: string) (baseRev: string) (label: string) : Result<string list, string> =
    match runGit repoRoot false [ "diff"; "--name-only"; baseRev.Trim(); "HEAD" ] with
    | true, lines -> Ok lines
    | false, _ -> Error(sprintf "git diff from %s to HEAD failed" label)

/// Returns paths staged in the Git index at the explicit repository root
/// [Repo-grounded — `gate/run.rs::staged_paths`].
[<ExcludeFromCodeCoverage>]
let private stagedPaths (repoRoot: string) : Result<string list, string> =
    let psi =
        ProcessStartInfo(
            FileName = "git",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            WorkingDirectory = repoRoot
        )

    for argument in [ "diff"; "--cached"; "--name-only" ] do
        psi.ArgumentList.Add argument

    psi.Environment.["GIT_DIR"] <- Path.Combine(repoRoot, ".git")
    psi.Environment.["GIT_CEILING_DIRECTORIES"] <- repoRoot

    use proc = Process.Start psi
    let stdout = proc.StandardOutput.ReadToEnd()
    proc.StandardError.ReadToEnd() |> ignore
    proc.WaitForExit()

    if proc.ExitCode = 0 then
        Ok(stdout.Split('\n') |> Array.filter (fun line -> line <> "") |> Array.toList)
    else
        Error "git diff --cached --name-only failed"

/// Returns paths tracked by Git at the repository root
/// [Repo-grounded — `gate/run.rs::tracked_paths`].
[<ExcludeFromCodeCoverage>]
let private trackedPaths (repoRoot: string) : Result<string list, string> =
    match runGit repoRoot true [ "ls-files" ] with
    | true, lines -> Ok lines
    | false, _ -> Error "git ls-files failed"

/// Returns paths changed from the branch merge base to `HEAD`, falling back
/// to staged paths when no merge base exists (a disposable fixture with no
/// configured origin) [Repo-grounded — `gate/run.rs::merge_base_paths`].
[<ExcludeFromCodeCoverage>]
let private mergeBasePaths (repoRoot: string) : Result<string list, string> =
    match runGit repoRoot false [ "merge-base"; "origin/main"; "HEAD" ] with
    | false, _ -> stagedPaths repoRoot
    | true, lines ->
        changedPathsFromBase repoRoot (List.tryHead lines |> Option.defaultValue "") "the branch merge base"

/// Returns files staged or changed for a file-scoped surface. `GATE_CHANGED_BASE`
/// is a CI-only baseline (see `gateChangedBaseEnv`'s doc comment) — it must
/// only be consulted for the `Ci` surface. A `PrePush` invocation always
/// falls back to `mergeBasePaths` regardless of whether that env var happens
/// to be set in the ambient environment (e.g. inherited from a CI job's
/// workflow-level `env:` block, or left over in a developer's shell);
/// treating it as authoritative for `PrePush` too would silently return no
/// changed paths whenever it happened to resolve in the current repo
/// [Repo-grounded — `gate/run.rs::changed_paths`].
[<ExcludeFromCodeCoverage>]
let private changedPaths (repoRoot: string) (surface: GateSurface) : Result<string list, string> =
    match surface with
    | PreCommit -> stagedPaths repoRoot
    | PrePush -> mergeBasePaths repoRoot
    | Ci ->
        let explicitBase =
            Environment.GetEnvironmentVariable gateChangedBaseEnv
            |> Option.ofObj
            |> Option.filter (fun value -> value.Trim() <> "")
            |> Option.filter (fun value -> commitResolves repoRoot (value.Trim()))

        match explicitBase with
        | Some baseRev -> changedPathsFromBase repoRoot (baseRev.Trim()) gateChangedBaseEnv
        | None -> mergeBasePaths repoRoot
    | _ -> Ok []

/// Returns modified and untracked worktree paths for mutation output
/// detection [Repo-grounded — `gate/run.rs::worktree_changed_paths`].
[<ExcludeFromCodeCoverage>]
let private worktreeChangedPaths (repoRoot: string) : Result<Set<string>, string> =
    match runGit repoRoot true [ "diff"; "--name-only" ] with
    | false, _ -> Error "git [\"diff\"; \"--name-only\"] failed"
    | true, modified ->
        match runGit repoRoot true [ "ls-files"; "--others"; "--exclude-standard" ] with
        | false, _ -> Error "git [\"ls-files\"; \"--others\"; \"--exclude-standard\"] failed"
        | true, untracked -> Ok(Set.union (Set.ofList modified) (Set.ofList untracked))

/// Returns paths introduced into the worktree after a mutation gate runs
/// [Repo-grounded — `gate/run.rs::mutation_output_delta`].
let private mutationOutputDelta (changedBefore: Set<string>) (changedAfter: Set<string>) : string list =
    Set.difference changedAfter changedBefore |> Set.toList

/// Stages files newly changed by a successful mutation gate, returning the
/// post-mutation snapshot with this gate's own just-staged outputs removed
/// so a later restaging gate's cache stays equivalent to a fresh rescan
/// [Repo-grounded — `gate/run.rs::restage_mutation_outputs`].
[<ExcludeFromCodeCoverage>]
let private restageMutationOutputs (repoRoot: string) (changedBefore: Set<string>) : Result<Set<string>, string> =
    match worktreeChangedPaths repoRoot with
    | Error message -> Error message
    | Ok changedAfter ->
        match mutationOutputDelta changedBefore changedAfter with
        | [] -> Ok changedAfter
        | outputs ->
            match runGit repoRoot true (("add" :: "--" :: outputs)) with
            | false, _ -> Error "git add mutation outputs failed"
            | true, _ -> Ok(Set.difference changedAfter (Set.ofList outputs))

/// Drops candidate paths no longer present in the working tree. Left for the
/// one call site that needs it — a `path-gated` gate reads changed paths
/// directly, including deletions, so this filter must not run upstream of
/// trigger detection [Repo-grounded — `gate/run.rs::retain_existing_paths`].
[<ExcludeFromCodeCoverage>]
let private retainExistingPaths (repoRoot: string) (files: string list) : string list =
    files
    |> List.filter (fun path ->
        File.Exists(Path.Combine(repoRoot, path))
        || Directory.Exists(Path.Combine(repoRoot, path)))

/// Splits a declared command and appends fixed arguments and derived files
/// [Repo-grounded — `gate/run.rs::arguments_with_derived_files`].
let private argumentsWithDerivedFiles
    (command: string)
    (fixedArgs: string list)
    (files: string list)
    : Result<string list, string> =
    let commandParts =
        command.Split([| ' '; '\t'; '\n'; '\r' |], StringSplitOptions.RemoveEmptyEntries)
        |> Array.toList

    if List.isEmpty commandParts then
        Error "gate command cannot be empty"
    else
        Ok(commandParts @ fixedArgs @ files)

/// One deterministic leaf invocation selected by the gate policy before any
/// filesystem, Git, or child-process adapter executes it.
type PlannedGateInvocation =
    { Id: string
      Kind: GateKind
      Command: string
      Arguments: string list
      Files: string list
      Restages: bool
      Batched: bool }

/// Candidate-path facts supplied by a resource adapter to the pure planner.
type GatePlanningInput =
    { ChangedPaths: string list
      TrackedPaths: string list
      ExistingPaths: Set<string> }

/// A gate command's validator words: the leading words before the first path
/// or flag argument (`repo-governance vendor validate AGENTS.md` keys as
/// `repo-governance vendor validate`).
let commandKey (command: string) : string =
    command.Split([| ' '; '\t' |], StringSplitOptions.RemoveEmptyEntries)
    |> Array.takeWhile (fun word ->
        not (
            word.StartsWith("-", StringComparison.Ordinal)
            || word.Contains "/"
            || word.Contains "."
        ))
    |> String.concat " "

/// A rhino-cli gate whose command RHINO runs walks its own declared surface,
/// so it is handed no files.
let private delegatesToRhino (gate: GateEntry) : bool =
    gate.Kind = RhinoCli && (RustRhino.tryFind (commandKey gate.Command)).IsSome

/// Produces the exact ordered leaf plan for one surface/selector. It shares
/// the registry, scope, glob, exclusion, group, and batch policies used by
/// the runtime executor while leaving Git/process work at the adapter edge.
let planRun
    (config: RepoConfig)
    (surfaceText: string)
    (only: string option)
    (group: string option)
    (input: GatePlanningInput)
    : Result<PlannedGateInvocation list, string> =
    match parseSurface surfaceText with
    | Error message -> Error message
    | Ok surface ->
        let surfaceGates =
            config.Gates
            |> List.filter (fun gate -> gate.Surfaces |> List.exists (fun (declared, _) -> declared = surface))

        let idValidation =
            if only.IsSome then
                validateGateIds surfaceGates only
            else
                Ok()

        let resolveGroup () =
            match group with
            | None -> Ok None
            | Some groupId ->
                let members =
                    gatesInCiGroup surfaceGates groupId
                    |> List.filter (fun gate -> gate.Wiring <> Some HandWired)

                if List.isEmpty members then
                    Error(sprintf "--group id \"%s\" matched no gates on surface" groupId)
                else
                    Ok(Some members)

        idValidation
        |> Result.bind (fun () -> resolveGroup ())
        |> Result.bind (fun grouped ->
            match gateSemanticFindings config with
            | finding :: _ -> Error finding
            | [] ->
                let selected =
                    grouped
                    |> Option.defaultValue surfaceGates
                    |> List.filter (fun gate -> only.IsNone || only = Some gate.Id)

                let mutable batchPlanned = false

                selected
                |> List.choose (fun gate ->
                    let scope =
                        gate.Surfaces
                        |> List.pick (fun (declared, value) -> if declared = surface then Some value else None)

                    if scope.Scope = PathGated && not (triggerMatches input.ChangedPaths scope.Trigger) then
                        None
                    else
                        let excludes = gate.Args |> Map.tryFind "exclude" |> Option.defaultValue []

                        let source =
                            match candidateScope scope.Scope with
                            | StagedFiles -> input.ChangedPaths
                            | TrackedFiles when scopeHasFilePatterns scope -> input.TrackedPaths
                            | _ -> []

                        let files =
                            matchingFiles source scope excludes |> List.filter input.ExistingPaths.Contains

                        if scopeHasFilePatterns scope && List.isEmpty files then
                            None
                        elif
                            surface = PreCommit
                            && only.IsNone
                            && scope.Scope = AffectedFileType
                            && (gate.GateType = Check
                                || (gate.GateType = Mutation && gate.Category = Some "formatter"))
                        then
                            if batchPlanned then
                                None
                            else
                                batchPlanned <- true

                                Some
                                    { Id = "lint-staged"
                                      Kind = External
                                      Command = "npx"
                                      Arguments = [ "--no"; "--"; "lint-staged" ]
                                      Files = []
                                      Restages = false
                                      Batched = true }
                        else
                            let derived = if delegatesToRhino gate then [] else files

                            match argumentsWithDerivedFiles gate.Command (fixedArguments gate) derived with
                            | Error _ ->
                                Some
                                    { Id = gate.Id
                                      Kind = gate.Kind
                                      Command = gate.Command
                                      Arguments = []
                                      Files = derived
                                      Restages = gate.Restages
                                      Batched = false }
                            | Ok arguments ->
                                Some
                                    { Id = gate.Id
                                      Kind = gate.Kind
                                      Command = gate.Command
                                      Arguments = arguments
                                      Files = derived
                                      Restages = gate.Restages
                                      Batched = false })
                |> Ok)

/// Returns only paths newly changed by one successful mutation.
let mutationOutputs (before: Set<string>) (after: Set<string>) : string list = mutationOutputDelta before after

/// Renders the public PASS/FAIL rows for an already-executed group and
/// returns the same overall success decision as the runtime reporter.
let summarizeGroup (groupId: string) (outcomes: (string * bool) list) : Result<string, string> =
    let rows =
        outcomes
        |> List.map (fun (id, passed) -> sprintf "%s\t%s\n" id (if passed then "PASS" else "FAIL"))
        |> String.concat ""

    if outcomes |> List.exists (snd >> not) then
        Error(sprintf "%sgate group %s failed" rows groupId)
    else
        Ok rows

/// Names composite-action steps that invoke `npm ci` without a name or
/// guard. The YAML adapter supplies individual step blocks; this function
/// owns the policy decision.
let unguardedNpmCiSteps (steps: string list) : string list =
    let activeRunLines (step: string) =
        step.Split '\n'
        |> Array.map (fun line -> line.Trim())
        |> Array.filter (fun line -> not (line.StartsWith("#", StringComparison.Ordinal)))

    steps
    |> List.filter (fun step ->
        let lines = activeRunLines step

        let invokesNpmCi =
            lines
            |> Array.exists (fun line -> line.Contains("run: npm ci", StringComparison.Ordinal))

        let named =
            lines
            |> Array.exists (fun line ->
                line.StartsWith("name:", StringComparison.Ordinal)
                || line.StartsWith("- name:", StringComparison.Ordinal))

        let guarded =
            lines
            |> Array.exists (fun line -> line.StartsWith("if:", StringComparison.Ordinal))

        invokesNpmCi && (not named || not guarded))

/// Runs a process to completion, inheriting stdio, returning its exit code
/// [Repo-grounded — every `Command::new(..).status()` call in `gate/run.rs`].
[<ExcludeFromCodeCoverage>]
let private runInherited
    (fileName: string)
    (arguments: string list)
    (workingDirectory: string)
    (env: (string * string) list)
    : int =
    let psi =
        ProcessStartInfo(FileName = fileName, UseShellExecute = false, WorkingDirectory = workingDirectory)

    for argument in arguments do
        psi.ArgumentList.Add argument

    for key, value in env do
        psi.Environment.[key] <- value

    use proc = Process.Start psi
    proc.WaitForExit()
    proc.ExitCode

/// Runs a Rhino CLI gate through the current executable with derived files
/// appended [Repo-grounded — `gate/run.rs::run_rhino_cli_leaf`].
///
/// The non-empty-command success path below (`argumentsWithDerivedFiles`'s
/// `Ok` branch, plus this function's own two lines) re-invokes the CURRENT
/// process's own executable — under `dotnet test` that is the shared test
/// host itself. Deliberately left uncovered by the unit suite: spawning a
/// second copy of the test host from inside a running test is unsafe
/// (unpredictable behaviour, possible recursive test execution). Only the
/// empty-command short-circuit is exercised, in `WaveEFGateUnitTests.fs`'s
/// "route rejects a rhino-cli-kind gate whose command is blank".
[<ExcludeFromCodeCoverage>]
let private runRhinoCliLeaf
    (command: string)
    (fixedArgs: string list)
    (files: string list)
    (repoRoot: string)
    (childEnv: (string * string) list)
    : Result<int, string> =
    match argumentsWithDerivedFiles command fixedArgs files with
    | Error message -> Error message
    | Ok arguments ->
        let currentExe = Diagnostics.Process.GetCurrentProcess().MainModule.FileName

        Ok(runInherited currentExe arguments repoRoot childEnv)

/// Prepends the repository's local Node executable directory to a child
/// `PATH`, matching the local-tool resolution npm scripts already receive
/// [Repo-grounded — `gate/run.rs::external_command_path`].
[<ExcludeFromCodeCoverage>]
let private externalCommandPath (repoRoot: string) : string =
    let inherited =
        Environment.GetEnvironmentVariable "PATH"
        |> Option.ofObj
        |> Option.defaultValue ""

    let localBin = Path.Combine(repoRoot, "node_modules/.bin")

    if inherited = "" then
        localBin
    else
        sprintf "%s%c%s" localBin Path.PathSeparator inherited

/// Runs an external shell command with matching files appended as arguments
/// [Repo-grounded — `gate/run.rs::run_external_leaf`].
[<ExcludeFromCodeCoverage>]
let private runExternalLeaf
    (command: string)
    (fixedArgs: string list)
    (files: string list)
    (commitMessageFile: string option)
    (repoRoot: string)
    (childEnv: (string * string) list)
    : Result<int, string> =
    if command.Trim() = "" then
        Error "external gate command cannot be empty"
    else
        let commandWithFiles = sprintf "%s \"$@\"" command
        let arguments = fixedArgs @ files @ Option.toList commitMessageFile
        let path = externalCommandPath repoRoot

        let script =
            match commitMessageFile with
            | Some _ -> command
            | None -> commandWithFiles

        Ok(runInherited "sh" ([ "-c"; script; "gate-external" ] @ arguments) repoRoot (("PATH", path) :: childEnv))

/// Runs an Nx target over all or affected projects for the declared scope
/// [Repo-grounded — `gate/run.rs::run_nx_leaf`].
[<ExcludeFromCodeCoverage>]
let private runNxLeaf
    (target: string)
    (fixedArgs: string list)
    (scope: ScopeKind)
    (repoRoot: string)
    (childEnv: (string * string) list)
    : int =
    let nxArguments =
        match scope with
        | AllProjects -> [ "exec"; "nx"; "--"; "run-many"; "--all"; "-t"; target ]
        | AffectedProjects
        | AffectedFileType
        | AllFileType
        | Other
        | PathGated -> [ "exec"; "nx"; "--"; "affected"; "-t"; target ]

    runInherited "npm" (nxArguments @ fixedArgs) repoRoot childEnv

/// Runs one declared gate through the executor for its declared kind
/// [Repo-grounded — `gate/run.rs::run_leaf`].
[<ExcludeFromCodeCoverage>]
let private runLeaf
    (kind: GateKind)
    (command: string)
    (fixedArgs: string list)
    (files: string list)
    (scope: ScopeKind)
    (commitMessageFile: string option)
    (repoRoot: string)
    (surface: GateSurface)
    : Result<int, string> =
    let childEnv = childEnvironment surface

    match kind with
    | RhinoCli -> runRhinoCliLeaf command fixedArgs files repoRoot childEnv
    | External -> runExternalLeaf command fixedArgs files commitMessageFile repoRoot childEnv
    | Nx -> Ok(runNxLeaf command fixedArgs scope repoRoot childEnv)

/// Returns whether this entry belongs to the single aggregate pre-commit
/// batch [Repo-grounded — `gate/run.rs::is_pre_commit_batch_eligible`].
[<ExcludeFromCodeCoverage>]
let private isPreCommitBatchEligible
    (gate: GateEntry)
    (scope: SurfaceScope)
    (surface: GateSurface)
    (only: string option)
    : bool =
    surface = PreCommit
    && only.IsNone
    && scope.Scope = AffectedFileType
    && (gate.GateType = Check
        || (gate.GateType = Mutation && gate.Category = Some "formatter"))

/// Runs the batched `lint-staged` invocation for eligible pre-commit gates
/// [Repo-grounded — `gate/run.rs::run_lint_staged_batch`].
[<ExcludeFromCodeCoverage>]
let private runLintStagedBatch
    (repoRoot: string)
    (surface: GateSurface)
    (write: string -> unit)
    : Result<unit, string> =
    write "Running lint-staged batch\n"

    if runInherited "npx" [ "--no"; "--"; "lint-staged" ] repoRoot (childEnvironment surface) = 0 then
        Ok()
    else
        Error "lint-staged batch failed"

/// Resolves a restaging gate's pre-mutation worktree snapshot, reusing the
/// previous restaging gate's post-mutation snapshot when still valid.
/// Returns `None` for a non-restaging gate
/// [Repo-grounded — `gate/run.rs::restaging_before_snapshot`].
[<ExcludeFromCodeCoverage>]
let private restagingBeforeSnapshot
    (gate: GateEntry)
    (worktreeSnapshot: Set<string> option)
    (repoRoot: string)
    : Result<Set<string> option, string> =
    if not gate.Restages then
        Ok None
    else
        match worktreeSnapshot with
        | Some snapshot -> Ok(Some snapshot)
        | None ->
            match worktreeChangedPaths repoRoot with
            | Ok snapshot -> Ok(Some snapshot)
            | Error message -> Error message

/// Reports and signals when a file-scoped gate has no matching candidates
/// [Repo-grounded — `gate/run.rs::report_empty_scope_skip`].
[<ExcludeFromCodeCoverage>]
let private reportEmptyScopeSkip
    (write: string -> unit)
    (gateId: string)
    (candidateScope: CandidateScope)
    (files: string list)
    : bool =
    match candidateScope, files with
    | (StagedFiles | TrackedFiles), [] ->
        write (sprintf "Skipping gate %s\n" gateId)
        true
    | _ -> false

/// Parses a command-line surface name into its registry variant
/// [Repo-grounded — `gate/run.rs::parse_surface`, distinct wording from
/// `Gate.fs::parseSurface` above: `gate run` names no valid values].
[<ExcludeFromCodeCoverage>]
let private parseRunSurface (surface: string) : Result<GateSurface, string> =
    match surface with
    | "commit-msg" -> Ok CommitMsg
    | "pre-commit" -> Ok PreCommit
    | "pre-push" -> Ok PrePush
    | "ci" -> Ok Ci
    | other -> Error(sprintf "unknown gate surface \"%s\"" other)

/// Result of checking the optional whole-surface execution guard. An active
/// marker or absent declaration continues in this process; otherwise the
/// complete invocation has already run as the configured guard's child and
/// its exact exit code must become this process's exit code.
type SurfaceGuardRun =
    | ContinueWithoutSurfaceGuard
    | SurfaceGuardExited of exitCode: int

/// Pure execution decision for an optional whole-surface guard. The caller
/// supplies environment lookup and executable identity so Unit proof does not
/// cross an operating-system or process boundary.
type SurfaceGuardPlan =
    | RunSurfaceDirectly
    | InvokeSurfaceGuard of command: string * arguments: string list

let planSurfaceGuard
    (config: RepoConfig)
    (surface: GateSurface)
    (gateRunArgs: string list)
    (currentExe: string)
    (environmentValue: string -> string option)
    : SurfaceGuardPlan =
    match Map.tryFind surface config.GateSurfaceGuards with
    | None -> RunSurfaceDirectly
    | Some guard ->
        match environmentValue guard.ActiveEnv with
        | Some value when not (String.IsNullOrEmpty value) -> RunSurfaceDirectly
        | _ -> InvokeSurfaceGuard(guard.Command, guard.Args @ [ currentExe; "gate"; "run" ] @ gateRunArgs)

let executeSurfaceGuardPlan
    (surface: string)
    (runGuard: string -> string list -> int)
    (plan: SurfaceGuardPlan)
    : Result<SurfaceGuardRun, string> =
    match plan with
    | RunSurfaceDirectly -> Ok ContinueWithoutSurfaceGuard
    | InvokeSurfaceGuard(command, arguments) ->
        try
            Ok(SurfaceGuardExited(runGuard command arguments))
        with ex ->
            Error(sprintf "gate surface guard for \"%s\" failed to start: %s" surface ex.Message)

/// Re-executes an entire `gate run` invocation through the configured
/// tool-neutral surface guard. The guard receives its configured arguments,
/// the current Rhino executable, then `gate run` and `gateRunArgs` unchanged.
/// Its `active-env` marker is expected to be present in the re-executed child,
/// which prevents recursive wrapping.
let runSurfaceGuardAtRoot
    (repoRoot: string)
    (surface: string)
    (gateRunArgs: string list)
    : Result<SurfaceGuardRun, string> =
    match parseRunSurface surface with
    | Error message -> Error message
    | Ok parsedSurface ->
        match load repoRoot with
        | Error message -> Error message
        | Ok config ->
            let currentExe = Diagnostics.Process.GetCurrentProcess().MainModule.FileName

            let plan =
                planSurfaceGuard config parsedSurface gateRunArgs currentExe (fun name ->
                    Environment.GetEnvironmentVariable name |> Option.ofObj)

            executeSurfaceGuardPlan
                surface
                (fun command arguments -> runInherited command arguments repoRoot (childEnvironment parsedSurface))
                plan

/// Resolves the gates selected by a declared CI group, excluding hand-wired
/// members: they are dispatched by their own dedicated CI workflow job, not
/// by `--group` [Repo-grounded — `gate/run.rs::resolve_group_gates`].
[<ExcludeFromCodeCoverage>]
let private resolveGroupGates
    (surfaceGates: GateEntry list)
    (group: string option)
    : Result<GateEntry list option, string> =
    match group with
    | None -> Ok None
    | Some groupId ->
        let members =
            gatesInCiGroup surfaceGates groupId
            |> List.filter (fun gate -> gate.Wiring <> Some HandWired)

        if List.isEmpty members then
            Error(sprintf "--group id \"%s\" matched no gates on surface" groupId)
        else
            Ok(Some members)

/// Writes every group member's `PASS`/`FAIL` outcome line, then fails the
/// overall group run if any member failed
/// [Repo-grounded — `gate/run.rs::report_group_summary`].
[<ExcludeFromCodeCoverage>]
let private reportGroupSummary
    (groupId: string)
    (summary: (string * bool) list)
    (write: string -> unit)
    : Result<unit, string> =
    for id, passed in summary do
        write (sprintf "%s\t%s\n" id (if passed then "PASS" else "FAIL"))

    if summary |> List.exists (fun (_, passed) -> not passed) then
        Error(sprintf "gate group %s failed" groupId)
    else
        Ok()

/// Load the candidate paths required by a collection of selected gates
/// [Repo-grounded — `gate/run.rs::candidate_paths`].
[<ExcludeFromCodeCoverage>]
let private scopeForSurface (surface: GateSurface) (gate: GateEntry) =
    gate.Surfaces
    |> List.pick (fun (declared, scope) -> if declared = surface then Some scope else None)

[<ExcludeFromCodeCoverage>]
let private candidatePaths
    (repoRoot: string)
    (selectedGates: GateEntry list)
    (surface: GateSurface)
    : Result<string list option * string list option, string> =
    let scopes = selectedGates |> List.map (scopeForSurface surface)

    let needsChanged =
        scopes
        |> List.exists (fun scope ->
            match candidateScope scope.Scope with
            | StagedFiles
            | PathTriggers -> true
            | _ -> false)

    let needsTracked =
        scopes
        |> List.exists (fun scope -> candidateScope scope.Scope = TrackedFiles && scopeHasFilePatterns scope)

    match
        (if needsChanged then
             changedPaths repoRoot surface |> Result.map Some
         else
             Ok None)
    with
    | Error message -> Error message
    | Ok changed ->
        match
            (if needsTracked then
                 trackedPaths repoRoot |> Result.map Some
             else
                 Ok None)
        with
        | Error message -> Error message
        | Ok tracked -> Ok(changed, tracked)

/// Rejects malformed gate configuration before selecting a gate or starting
/// a leaf, shared with `repo-config validate` so dispatch never runs a
/// malformed entry [Repo-grounded — `gate/run.rs::validate_registry_semantics`].
[<ExcludeFromCodeCoverage>]
let private validateRegistrySemantics (config: RepoConfig) (write: string -> unit) : Result<unit, string> =
    match gateSemanticFindings config with
    | [] -> Ok()
    | findings ->
        for finding in findings do
            write (finding + "\n")

        Error(sprintf "gate run: %d registry semantic finding(s); fix the key(s) listed above" (List.length findings))

/// Runs gates declared on a surface, optionally selecting one gate or CI
/// group and forwarding a commit message
/// [Repo-grounded — `gate/run.rs::run_at_root_with_only_and_message_file`].
[<ExcludeFromCodeCoverage>]
let runAtRootWithOnlyAndMessageFile
    (repoRoot: string)
    (surface: string)
    (only: string option)
    (group: string option)
    (commitMessageFile: string option)
    (write: string -> unit)
    : Result<unit, string> =
    match parseRunSurface surface with
    | Error message -> Error message
    | Ok surface ->
        if commitMessageFile.IsSome && surface <> CommitMsg then
            Error "a commit-message file is only valid for the commit-msg surface"
        else
            match load repoRoot with
            | Error message -> Error message
            | Ok config ->
                let surfaceGates =
                    config.Gates
                    |> List.filter (fun gate -> gate.Surfaces |> List.exists (fun (declared, _) -> declared = surface))

                match
                    (if only.IsSome then
                         validateGateIds surfaceGates only
                     else
                         Ok())
                with
                | Error message -> Error message
                | Ok() ->
                    match resolveGroupGates surfaceGates group with
                    | Error message -> Error message
                    | Ok groupGates ->
                        match validateRegistrySemantics config write with
                        | Error message -> Error message
                        | Ok() ->
                            let selectedGates =
                                (groupGates |> Option.defaultValue surfaceGates)
                                |> List.filter (fun gate -> only.IsNone || only = Some gate.Id)

                            match candidatePaths repoRoot selectedGates surface with
                            | Error message -> Error message
                            | Ok(changedPathsResult, trackedPathsResult) ->
                                let scopeOf (gate: GateEntry) =
                                    gate.Surfaces
                                    |> List.pick (fun (declared, scope) ->
                                        if declared = surface then Some scope else None)

                                let rec loop
                                    (gates: GateEntry list)
                                    (batchRan: bool)
                                    (worktreeSnapshot: Set<string> option)
                                    (groupSummary: (string * bool) list)
                                    : Result<(string * bool) list, string> =
                                    match gates with
                                    | [] -> Ok groupSummary
                                    | gate :: rest ->
                                        let scope = scopeOf gate

                                        if
                                            scope.Scope = PathGated
                                            && not (
                                                changedPathsResult
                                                |> Option.map (fun paths -> triggerMatches paths scope.Trigger)
                                                |> Option.defaultValue false
                                            )
                                        then
                                            loop rest batchRan worktreeSnapshot groupSummary
                                        else
                                            let candidate = candidateScope scope.Scope
                                            let excludes = gate.Args |> Map.tryFind "exclude" |> Option.defaultValue []

                                            let files =
                                                match candidate with
                                                | StagedFiles ->
                                                    retainExistingPaths
                                                        repoRoot
                                                        (matchingFiles
                                                            (changedPathsResult |> Option.defaultValue [])
                                                            scope
                                                            excludes)
                                                | TrackedFiles ->
                                                    matchingFiles
                                                        (if scopeHasFilePatterns scope then
                                                             trackedPathsResult |> Option.defaultValue []
                                                         else
                                                             [])
                                                        scope
                                                        excludes
                                                | _ -> []

                                            if
                                                scopeHasFilePatterns scope
                                                && reportEmptyScopeSkip write gate.Id candidate files
                                            then
                                                loop rest batchRan worktreeSnapshot groupSummary
                                            elif isPreCommitBatchEligible gate scope surface only then
                                                if batchRan then
                                                    loop rest batchRan worktreeSnapshot groupSummary
                                                else
                                                    match runLintStagedBatch repoRoot surface write with
                                                    | Error message -> Error message
                                                    | Ok() -> loop rest true None groupSummary
                                            else
                                                write (sprintf "Running gate %s\n" gate.Id)

                                                match restagingBeforeSnapshot gate worktreeSnapshot repoRoot with
                                                | Error message -> Error message
                                                | Ok changedBefore ->
                                                    match
                                                        runLeaf
                                                            gate.Kind
                                                            gate.Command
                                                            (fixedArguments gate)
                                                            (if delegatesToRhino gate then [] else files)
                                                            scope.Scope
                                                            commitMessageFile
                                                            repoRoot
                                                            surface
                                                    with
                                                    | Error message -> Error message
                                                    | Ok exitCode ->
                                                        let passed = exitCode = 0

                                                        let outcome =
                                                            match group with
                                                            | Some _ -> Ok(groupSummary @ [ gate.Id, passed ])
                                                            | None when not passed ->
                                                                Error(sprintf "gate %s failed" gate.Id)
                                                            | None -> Ok groupSummary

                                                        match outcome with
                                                        | Error message -> Error message
                                                        | Ok nextSummary ->
                                                            if passed then
                                                                match changedBefore with
                                                                | Some before ->
                                                                    match restageMutationOutputs repoRoot before with
                                                                    | Error message -> Error message
                                                                    | Ok after ->
                                                                        loop rest batchRan (Some after) nextSummary
                                                                | None when gate.GateType = Mutation ->
                                                                    loop rest batchRan None nextSummary
                                                                | None ->
                                                                    loop rest batchRan worktreeSnapshot nextSummary
                                                            else
                                                                loop rest batchRan worktreeSnapshot nextSummary

                                match loop selectedGates false None [] with
                                | Error message -> Error message
                                | Ok groupSummary ->
                                    match group with
                                    | Some groupId -> reportGroupSummary groupId groupSummary write
                                    | None -> Ok()

/// Runs gates declared on a surface at a known root, optionally selecting
/// one gate [Repo-grounded — `gate/run.rs::run_at_root_with_only`].
[<ExcludeFromCodeCoverage>]
let runAtRootWithOnly
    (repoRoot: string)
    (surface: string)
    (only: string option)
    (write: string -> unit)
    : Result<unit, string> =
    runAtRootWithOnlyAndMessageFile repoRoot surface only None None write

/// Runs gates declared on a surface at a known root
/// [Repo-grounded — `gate/run.rs::run_at_root`].
[<ExcludeFromCodeCoverage>]
let runAtRoot (repoRoot: string) (surface: string) (write: string -> unit) : Result<unit, string> =
    runAtRootWithOnly repoRoot surface None write

/// Runs gates declared on a surface at a known root, restricted to one
/// declared CI group [Repo-grounded — `gate/run.rs::run_at_root_with_group`].
[<ExcludeFromCodeCoverage>]
let runAtRootWithGroup
    (repoRoot: string)
    (surface: string)
    (group: string)
    (write: string -> unit)
    : Result<unit, string> =
    runAtRootWithOnlyAndMessageFile repoRoot surface None (Some group) None write

// --- `gate validate` -------------------------------------------------------
//
// [Repo-grounded — `apps/rhino-cli/src/commands/gate/validate.rs`]. Each
// `validate*` helper below writes nothing itself and returns `Error message`
// on the first rule it finds violated — `validateAtRoot` chains them in the
// same order Rust's `run_at_root` calls them, since composition-rule
// violations short-circuit at the first failure.

/// Whether a gate declares a surface, regardless of that surface's scope.
let private declaresSurface (surface: GateSurface) (gate: GateEntry) : bool =
    gate.Surfaces |> List.exists (fun (declared, _) -> declared = surface)

/// Validates that every gate declaring a `ci` surface also declares
/// `ci_group` [Repo-grounded — `gate/validate.rs::validate_ci_group_declared`].
let private validateCiGroupDeclared (config: RepoConfig) : Result<unit, string> =
    let rec loop gates =
        match gates with
        | [] -> Ok()
        | (gate: GateEntry) :: rest ->
            if declaresSurface Ci gate && gate.CiGroup.IsNone then
                Error(
                    sprintf
                        "Gate \"%s\" carries a ci surface but declares no ci_group; ci_group is required for gates carrying a ci surface"
                        gate.Id
                )
            else
                loop rest

    loop config.Gates

/// Validates the local-hook check-to-CI composition rule
/// [Repo-grounded — `gate/validate.rs::validate_local_hook_composition`].
let private validateLocalHookComposition (config: RepoConfig) : Result<unit, string> =
    let rec loop gates =
        match gates with
        | [] -> Ok()
        | (gate: GateEntry) :: rest ->
            let isLocalHookCheckWithoutCi =
                gate.GateType = Check
                && (declaresSurface PreCommit gate || declaresSurface PrePush gate)
                && not (declaresSurface Ci gate)
                && gate.CarveOut <> Some StagedOnly

            if isLocalHookCheckWithoutCi then
                Error(
                    sprintf
                        "Gate Composition Rule violation: gate \"%s\" declares a local hook surface but is missing ci"
                        gate.Id
                )
            else
                loop rest

    loop config.Gates

/// Validates that every `verifies` reference names a declared gate
/// [Repo-grounded — `gate/validate.rs::validate_verifies_references`].
let private validateVerifiesReferences (config: RepoConfig) : Result<unit, string> =
    let rec loop gates =
        match gates with
        | [] -> Ok()
        | (gate: GateEntry) :: rest ->
            match gate.Verifies with
            | None -> loop rest
            | Some verifiedGate ->
                match config.Gates |> List.tryFind (fun candidate -> candidate.Id = verifiedGate) with
                | None -> Error(sprintf "Gate \"%s\" verifies orphan gate \"%s\"" gate.Id verifiedGate)
                | Some target ->
                    if
                        gate.GateType <> Check
                        || target.GateType <> Mutation
                        || target.Category <> Some "formatter"
                    then
                        Error(
                            sprintf
                                "Gate \"%s\".verifies must link a check to a formatter mutation, not \"%s\""
                                gate.Id
                                verifiedGate
                        )
                    else
                        loop rest

    loop config.Gates

/// Validator commands that no gate runs but that still carry a `delegation:` row.
let private ungatedValidators: Set<string> =
    Set.ofList
        [ "md frontmatter-dates validate"
          "harness sync validate"
          "repo-governance layer-coherence validate"
          "repo-governance traceability validate" ]

/// Missing, duplicate and extra `delegation:` rows, keyed by validator command.
/// A row is extra when no rhino-cli gate runs its command and the command is
/// not one of `knownCommands`, the ungated validators.
let delegationFindings (config: RepoConfig) (knownCommands: Set<string>) : string list =
    let gateCommands =
        config.Gates
        |> List.filter (fun gate -> gate.Kind = RhinoCli)
        |> List.map (fun gate -> commandKey gate.Command)
        |> List.distinct

    let rows = config.Delegation |> List.map (fun row -> row.Command)

    let missing =
        gateCommands
        |> List.filter (fun command -> not (List.contains command rows))
        |> List.map (sprintf "delegation: the row for rhino-cli gate command \"%s\" is missing")

    let duplicate =
        rows
        |> List.countBy id
        |> List.filter (fun (_, count) -> count > 1)
        |> List.map (fst >> sprintf "delegation: the row for \"%s\" is a duplicate")

    let extra =
        rows
        |> List.distinct
        |> List.filter (fun command -> not (List.contains command gateCommands || knownCommands.Contains command))
        |> List.map (sprintf "delegation: the row for \"%s\" is extra; no rhino-cli gate or validator runs it")

    missing @ duplicate @ extra

/// Holds the `delegation:` rows to the rhino-cli gate registry once the
/// registry declares any row.
let private validateDelegationRows (config: RepoConfig) : Result<unit, string> =
    if List.isEmpty config.Delegation then
        Ok()
    else
        match delegationFindings config ungatedValidators with
        | [] -> Ok()
        | finding :: _ -> Error finding

/// Validates that each formatter mutation is covered by exactly one check
/// gate [Repo-grounded — `gate/validate.rs::validate_formatter_verification`].
let private validateFormatterVerification (config: RepoConfig) : Result<unit, string> =
    let formatters =
        config.Gates
        |> List.filter (fun gate -> gate.GateType = Mutation && gate.Category = Some "formatter")

    let rec loop formatters =
        match formatters with
        | [] -> Ok()
        | (formatter: GateEntry) :: rest ->
            let verifierCount =
                config.Gates
                |> List.filter (fun gate -> gate.GateType = Check && gate.Verifies = Some formatter.Id)
                |> List.length

            if verifierCount <> 1 then
                Error(
                    sprintf
                        "Formatter mutation \"%s\" requires exactly one check gate whose verifies field names it; found %d"
                        formatter.Id
                        verifierCount
                )
            else
                loop rest

    loop formatters

/// Returns whether a hook file has an executable permission bit
/// [Repo-grounded — `gate/validate.rs::has_executable_mode`].
[<ExcludeFromCodeCoverage>]
let private hasExecutableMode (path: string) : bool =
    if File.Exists path then
        let mode = File.GetUnixFileMode path

        (mode
         &&& (UnixFileMode.UserExecute
              ||| UnixFileMode.GroupExecute
              ||| UnixFileMode.OtherExecute))
        <> UnixFileMode.None
    else
        false

/// Returns whether a shell script contains a non-comment line with an
/// invocation [Repo-grounded — `gate/validate.rs::has_executable_shell_invocation`].
let private hasExecutableShellInvocation (contents: string) (expectedInvocation: string) : bool =
    contents.Split '\n'
    |> Array.exists (fun line ->
        let trimmed = line.TrimStart()

        not (trimmed.StartsWith("#", StringComparison.Ordinal))
        && trimmed.Contains expectedInvocation)

/// Validates every generated Husky shim required by declared local-hook gates
/// [Repo-grounded — `gate/validate.rs::validate_local_hook_shims`].
[<ExcludeFromCodeCoverage>]
let private validateLocalHookShims (repoRoot: string) (config: RepoConfig) : Result<unit, string> =
    let surfaces =
        [ CommitMsg, "commit-msg"; PreCommit, "pre-commit"; PrePush, "pre-push" ]

    let rec loop surfaces =
        match surfaces with
        | [] -> Ok()
        | (surface, shimName) :: rest ->
            if not (config.Gates |> List.exists (declaresSurface surface)) then
                loop rest
            else
                let shimPath = Path.Combine(repoRoot, ".husky", shimName)
                let expectedInvocation = sprintf "./rhino gate run --surface %s" shimName

                let hasRegistryInvocation =
                    File.Exists shimPath
                    && hasExecutableShellInvocation (File.ReadAllText shimPath) expectedInvocation

                if not (hasExecutableMode shimPath) || not hasRegistryInvocation then
                    Error(
                        sprintf
                            "Gate surface shim .husky/%s must be executable and invoke ./rhino gate run --surface %s"
                            shimName
                            shimName
                    )
                else
                    loop rest

    loop surfaces

/// One workflow step's optional `run:` body, `env:` map, and `if:` condition
/// (kept as raw text — see [`isLiteralFalseConditionString`])
/// [Repo-grounded — `gate/validate.rs::WorkflowStep`].
type private WorkflowStep =
    { Run: string option
      Env: (string * string) list
      Condition: string option }

/// One workflow job: its steps, prerequisite jobs, matrix dimensions, and
/// optional `if:` condition [Repo-grounded — `gate/validate.rs::WorkflowJob`].
type private WorkflowJob =
    { Steps: WorkflowStep list
      Needs: string list
      Matrix: (string * string) list
      Condition: string option }

/// The small subset of GitHub Actions workflow YAML needed for CI derivation
/// checks [Repo-grounded — `gate/validate.rs::Workflow`].
type private Workflow = { Jobs: (string * WorkflowJob) list }

let private emptyWorkflow: Workflow = { Jobs = [] }

let private jobsFind (workflow: Workflow) (id: string) : WorkflowJob option =
    workflow.Jobs |> List.tryFind (fun (jobId, _) -> jobId = id) |> Option.map snd

/// Whether a GitHub Actions `if:` condition is one of its literal-falsy
/// forms. Every fixture's native-boolean case is the bare word `false`,
/// which already appears in the falsy literal set below, so treating every
/// condition's raw scalar text uniformly (rather than modeling Rust's
/// `Boolean`/`String` enum split) produces the identical verdict for every
/// scenario this port exercises
/// [Repo-grounded — `gate/validate.rs::WorkflowCondition::is_literal_false`].
let private isLiteralFalseConditionString (raw: string) : bool =
    let trimmed = raw.Trim()

    let expression =
        if trimmed.StartsWith("${{", StringComparison.Ordinal) then
            let afterPrefix = trimmed.Substring 3

            if afterPrefix.EndsWith("}}", StringComparison.Ordinal) then
                afterPrefix.Substring(0, afterPrefix.Length - 2).Trim()
            else
                trimmed
        else
            trimmed

    [ "false"; "0"; "-0"; "''"; "\"\""; "null" ] |> List.contains expression

let private yamlAsMapping (node: YamlNode) =
    match node with
    | :? YamlMappingNode as m -> Some m
    | _ -> None

let private yamlAsSequence (node: YamlNode) =
    match node with
    | :? YamlSequenceNode as s -> Some s
    | _ -> None

let private yamlAsScalar (node: YamlNode) =
    match node with
    | :? YamlScalarNode as s -> Some s
    | _ -> None

let private yamlChild (m: YamlMappingNode) (key: string) : YamlNode option =
    m.Children
    |> Seq.tryFind (fun kv ->
        match kv.Key with
        | :? YamlScalarNode as k -> k.Value = key
        | _ -> false)
    |> Option.map (fun kv -> kv.Value)

/// Parses the small subset of GitHub Actions workflow YAML this port needs,
/// walking the raw representation model directly rather than a typed
/// deserializer: Rust's `Workflow` shape mixes untagged unions (`needs` is
/// one job or many; `if:` is a bare boolean or a string) that a
/// reflection-based .NET deserializer cannot resolve without custom
/// converters, so this mirrors `gateEnumFindings`'s AST-walking style instead
/// [Repo-grounded — `gate/validate.rs`'s `Workflow`/`WorkflowJob`/`WorkflowStep`/`WorkflowNeeds` `serde_norway::from_str`].
let private parseWorkflowYaml (yaml: string) : Result<Workflow, string> =
    try
        let stream = YamlStream()
        use reader = new StringReader(yaml)
        stream.Load reader

        if stream.Documents.Count = 0 then
            Ok emptyWorkflow
        else
            match yamlAsMapping stream.Documents.[0].RootNode with
            | None -> Ok emptyWorkflow
            | Some root ->
                match yamlChild root "jobs" |> Option.bind yamlAsMapping with
                | None -> Ok emptyWorkflow
                | Some jobsMapping ->
                    let parseStep (stepNode: YamlNode) : WorkflowStep option =
                        stepNode
                        |> yamlAsMapping
                        |> Option.map (fun stepMap ->
                            let run =
                                yamlChild stepMap "run"
                                |> Option.bind yamlAsScalar
                                |> Option.map (fun s -> s.Value)

                            let env =
                                yamlChild stepMap "env"
                                |> Option.bind yamlAsMapping
                                |> Option.map (fun envMap ->
                                    envMap.Children
                                    |> Seq.choose (fun kv ->
                                        match kv.Key, yamlAsScalar kv.Value with
                                        | (:? YamlScalarNode as k), Some v -> Some(k.Value, v.Value)
                                        | _ -> None)
                                    |> Seq.toList)
                                |> Option.defaultValue []

                            let condition =
                                yamlChild stepMap "if"
                                |> Option.bind yamlAsScalar
                                |> Option.map (fun s -> s.Value)

                            { Run = run
                              Env = env
                              Condition = condition })

                    let parseJob (jobNode: YamlNode) : WorkflowJob =
                        let jobMap = jobNode |> yamlAsMapping

                        let steps =
                            jobMap
                            |> Option.bind (fun m -> yamlChild m "steps")
                            |> Option.bind yamlAsSequence
                            |> Option.map (fun sequence -> sequence.Children |> Seq.choose parseStep |> Seq.toList)
                            |> Option.defaultValue []

                        let needs =
                            jobMap
                            |> Option.bind (fun m -> yamlChild m "needs")
                            |> Option.map (fun node ->
                                match node with
                                | :? YamlScalarNode as s -> [ s.Value ]
                                | :? YamlSequenceNode as sequence ->
                                    sequence.Children
                                    |> Seq.choose yamlAsScalar
                                    |> Seq.map (fun s -> s.Value)
                                    |> Seq.toList
                                | _ -> [])
                            |> Option.defaultValue []

                        let matrix =
                            jobMap
                            |> Option.bind (fun m -> yamlChild m "strategy")
                            |> Option.bind yamlAsMapping
                            |> Option.bind (fun strategy -> yamlChild strategy "matrix")
                            |> Option.bind yamlAsMapping
                            |> Option.map (fun matrixMap ->
                                matrixMap.Children
                                |> Seq.choose (fun kv ->
                                    match kv.Key, yamlAsScalar kv.Value with
                                    | (:? YamlScalarNode as k), Some v -> Some(k.Value, v.Value)
                                    | _ -> None)
                                |> Seq.toList)
                            |> Option.defaultValue []

                        let condition =
                            jobMap
                            |> Option.bind (fun m -> yamlChild m "if")
                            |> Option.bind yamlAsScalar
                            |> Option.map (fun s -> s.Value)

                        { Steps = steps
                          Needs = needs
                          Matrix = matrix
                          Condition = condition }

                    let jobs =
                        jobsMapping.Children
                        |> Seq.choose (fun kv ->
                            match kv.Key with
                            | :? YamlScalarNode as k -> Some(k.Value, parseJob kv.Value)
                            | _ -> None)
                        |> Seq.toList

                    Ok { Jobs = jobs }
    with ex ->
        Error ex.Message

/// Whether any step's `run:` body, in any job, references `needle` at all —
/// used to reject a raw, unindirected splice of a matrix expression into a
/// shell string [Repo-grounded — `gate/validate.rs::workflow_run_bodies_reference`].
let private workflowRunBodiesReference (workflow: Workflow) (needle: string) : bool =
    workflow.Jobs
    |> List.collect (fun (_, job) -> job.Steps)
    |> List.choose (fun step -> step.Run)
    |> List.exists (fun run -> run.Contains needle)

/// Collapses runs of whitespace the same way Rust's `str::split_whitespace`
/// does, so a `run: |` block's line breaks don't defeat a substring match
/// against a rewrapped invocation.
let private normalizedRun (run: string) : string =
    run.Split((null: char[]), StringSplitOptions.RemoveEmptyEntries)
    |> String.concat " "

/// Validates the generated CI matrix and its quality-gate dependency
/// [Repo-grounded — `gate/validate.rs::validate_ci_matrix_contract`].
let private validateCiMatrixContract (config: RepoConfig) (workflow: Workflow) : Result<unit, string> =
    let hasMatrixGates =
        config.Gates
        |> List.exists (fun gate -> declaresSurface Ci gate && gate.Wiring <> Some HandWired)

    if not hasMatrixGates then
        Ok()
    else
        let hasEnumeration =
            jobsFind workflow "enumerate"
            |> Option.map (fun job ->
                job.Steps
                |> List.choose (fun step -> step.Run)
                |> List.exists (fun run -> run.Contains "gate list --surface=ci"))
            |> Option.defaultValue false

        let hasMatrixDispatcher =
            jobsFind workflow "gate"
            |> Option.map (fun job ->
                let derivesGroupMatrix =
                    List.contains "enumerate" job.Needs
                    && (job.Matrix
                        |> List.tryFind (fun (key, _) -> key = "group")
                        |> Option.map (fun (_, value) -> value.Contains "fromJson(needs.enumerate.outputs.groups)")
                        |> Option.defaultValue false)

                let dispatchesSelectedGroup =
                    job.Steps
                    |> List.exists (fun step ->
                        match step.Run with
                        | None -> false
                        | Some run ->
                            let normalized = normalizedRun run

                            step.Env
                            |> List.exists (fun (name, value) ->
                                value.Contains "matrix.group.group"
                                && normalized.Contains(
                                    sprintf "./rhino gate run --surface ci -- --group=\"$%s\"" name
                                )))

                let noRawGroupIdSplice =
                    not (workflowRunBodiesReference workflow "matrix.group.group")

                derivesGroupMatrix && dispatchesSelectedGroup && noRawGroupIdSplice)
            |> Option.defaultValue false

        let aggregateRequiresMatrixPrerequisites =
            jobsFind workflow "quality-gate"
            |> Option.map (fun job ->
                List.contains "enumerate" job.Needs
                && List.contains "gate" job.Needs
                && List.contains "build-rhino" job.Needs)
            |> Option.defaultValue false

        if hasEnumeration && hasMatrixDispatcher && aggregateRequiresMatrixPrerequisites then
            Ok()
        else
            Error
                "CI workflow must derive its gate matrix from the enumerate job's grouped gate list, dispatch each group in the gate job through ./rhino gate run --surface ci -- --group=\"$<matrix group env>\", and make quality-gate depend on build-rhino, enumerate, and gate"

/// Validates that Doctor setup is selected from registry metadata rather than
/// performing a full bootstrap in every CI job
/// [Repo-grounded — `gate/validate.rs::validate_ci_doctor_bootstrap`].
let private validateCiDoctorBootstrap (config: RepoConfig) (workflow: Workflow) : Result<unit, string> =
    if not (config.Gates |> List.exists (fun gate -> not (List.isEmpty gate.DoctorTools))) then
        Ok()
    else
        let hasFullBootstrap =
            workflow.Jobs
            |> List.collect (fun (_, job) -> job.Steps)
            |> List.choose (fun step -> step.Run)
            |> List.exists (fun run -> run.Contains "npm run doctor -- --fix" && not (run.Contains "--tools"))

        if hasFullBootstrap then
            Error "CI workflow must not run an unconditional full Doctor bootstrap"
        else
            let formatDerivesToolUnion =
                jobsFind workflow "format"
                |> Option.map (fun job ->
                    job.Steps
                    |> List.choose (fun step -> step.Run)
                    |> List.exists (fun run ->
                        run.Contains "gate list --surface=pre-commit --format=json"
                        && run.Contains "[.[] | .doctor_tools[]]"
                        && run.Contains "unique"
                        && run.Contains "rhino-bin.sh doctor --fix --tools"
                        && run.Contains "if [ -n \"$tools\" ]"))
                |> Option.defaultValue false

            let matrixUsesDeclaredTools =
                jobsFind workflow "gate"
                |> Option.map (fun job ->
                    job.Steps
                    |> List.exists (fun step ->
                        match step.Run with
                        | None -> false
                        | Some run ->
                            let normalized = normalizedRun run

                            step.Env
                            |> List.exists (fun (name, value) ->
                                value.Contains "matrix.group.doctor_tools"
                                && normalized.Contains(sprintf "tools=\"$%s\"" name)
                                && normalized.Contains "rhino-bin.sh doctor --fix --tools"
                                && normalized.Contains "if [ -n \"$tools\" ]")))
                |> Option.defaultValue false

            let noRawDoctorToolsSplice =
                not (workflowRunBodiesReference workflow "matrix.group.doctor_tools")

            if formatDerivesToolUnion && matrixUsesDeclaredTools && noRawDoctorToolsSplice then
                Ok()
            else
                Error
                    "CI workflow must derive format and matrix Doctor selections from registry doctor_tools and skip empty selections"

/// Checks only explicit CI gate-driver invocations, leaving setup/control
/// shell alone [Repo-grounded — `gate/validate.rs::validate_ci_gate_invocations`].
let private validateCiGateInvocations (config: RepoConfig) (workflow: Workflow) : Result<unit, string> =
    let declaredCiGroups =
        config.Gates |> List.choose (fun gate -> gate.CiGroup) |> Set.ofList

    let trimQuotes (s: string) = s.Trim().Trim('"').Trim('\'')

    let commands =
        workflow.Jobs
        |> List.collect (fun (_, job) -> job.Steps)
        |> List.choose (fun step -> step.Run)
        |> List.collect (fun run -> run.Split '\n' |> Array.toList)
        |> List.map (fun line -> line.Trim())
        |> List.filter (fun line -> not (line.StartsWith("#", StringComparison.Ordinal)))

    let isDynamicSelector (selector: string) =
        selector.Contains "${{" || selector.StartsWith("$", StringComparison.Ordinal)

    let splitAfter (marker: string) (command: string) : string option =
        let parts = command.Split([| marker |], StringSplitOptions.None)

        if parts.Length > 1 then
            Some(trimQuotes parts.[1])
        else
            None

    let rec loop commands =
        match commands with
        | [] -> Ok()
        | (command: string) :: rest ->
            if
                not (
                    command.Contains "gate run --surface=ci"
                    || command.Contains "gate run --surface ci"
                )
            then
                loop rest
            else
                match splitAfter "--only=" command with
                | Some selector ->
                    if isDynamicSelector selector then
                        loop rest
                    elif
                        config.Gates
                        |> List.exists (fun gate -> gate.Id = selector && declaresSurface Ci gate)
                    then
                        loop rest
                    else
                        Error(
                            sprintf "CI workflow invokes undeclared CI gate selector \"%s\" via \"%s\"" selector command
                        )
                | None ->
                    match splitAfter "--group=" command with
                    | Some selector ->
                        if isDynamicSelector selector then
                            loop rest
                        elif declaredCiGroups.Contains selector then
                            loop rest
                        else
                            Error(
                                sprintf
                                    "CI workflow invokes undeclared CI group selector \"%s\" via \"%s\""
                                    selector
                                    command
                            )
                    | None ->
                        Error(
                            sprintf "CI workflow gate run invocation \"%s\" must select exactly one matrix gate" command
                        )

    loop commands

/// Splits one shell command line, stopping at unquoted comments
/// [Repo-grounded — `gate/validate.rs::shell_tokens`].
let private shellTokens (line: string) : string list =
    let tokens = ResizeArray<string>()
    let token = Text.StringBuilder()
    let mutable quote: char option = None
    let mutable escaped = false
    let mutable stopped = false

    for character in line do
        if not stopped then
            if escaped then
                token.Append character |> ignore
                escaped <- false
            else
                match quote, character with
                | Some '\'', '\'' -> quote <- None
                | Some '"', '"' -> quote <- None
                | None, '#' -> stopped <- true
                | None, ('\'' | '"') -> quote <- Some character
                | (Some '"' | None), '\\' -> escaped <- true
                | None, c when Char.IsWhiteSpace c ->
                    if token.Length > 0 then
                        tokens.Add(token.ToString())
                        token.Clear() |> ignore
                | _ -> token.Append character |> ignore

    if token.Length > 0 then
        tokens.Add(token.ToString())

    List.ofSeq tokens

/// Returns the declared targets of an executable `npx nx affected -t`
/// command [Repo-grounded — `gate/validate.rs::nx_targets`].
let private nxTargets (tokens: string list) : string list =
    match tokens with
    | executable :: rest when executable = "npx" ->
        match rest with
        | runner :: arguments when runner = "nx" ->
            match arguments with
            | first :: _ when first = "affected" ->
                match arguments |> List.tryFindIndex (fun a -> a = "-t" || a = "--targets") with
                | None -> []
                | Some targetIndex ->
                    arguments
                    |> List.skip (targetIndex + 1)
                    |> List.takeWhile (fun a ->
                        not (a.StartsWith("-", StringComparison.Ordinal))
                        && not (List.contains a [ "&&"; ";"; "|" ]))
                    |> List.collect (fun a -> a.Split ',' |> Array.toList)
            | _ -> []
        | _ -> []
    | _ -> []

/// Returns whether a shell command invokes the declared gate as an Nx target
/// [Repo-grounded — `gate/validate.rs::run_declares_command`].
let private runDeclaresCommand (run: string) (command: string) : bool =
    run.Split '\n'
    |> Array.exists (fun line ->
        let tokens = shellTokens line

        not (tokens |> List.exists (fun t -> List.contains t [ "&&"; "||"; ";"; "|" ]))
        && (nxTargets tokens |> List.exists (fun target -> target = command)))

/// Validates that every hand-wired CI command has an aggregated workflow job
/// [Repo-grounded — `gate/validate.rs::validate_hand_wired_ci_jobs`].
let private validateHandWiredCiJobs (config: RepoConfig) (workflow: Workflow) : Result<unit, string> =
    let handWiredCiGates =
        config.Gates
        |> List.filter (fun gate -> gate.Wiring = Some HandWired && declaresSurface Ci gate)

    if List.isEmpty handWiredCiGates then
        Ok()
    else
        match jobsFind workflow "quality-gate" with
        | None -> Error "CI workflow pr-quality-gate.yml must declare a quality-gate job for hand-wired CI gates"
        | Some qualityGate ->
            let isDisabled condition =
                condition
                |> Option.map isLiteralFalseConditionString
                |> Option.defaultValue false

            let rec loop gates =
                match gates with
                | [] -> Ok()
                | (handWiredGate: GateEntry) :: rest ->
                    let matchingJobs =
                        workflow.Jobs
                        |> List.filter (fun (_, job) ->
                            not (isDisabled job.Condition)
                            && job.Steps
                               |> List.exists (fun step ->
                                   not (isDisabled step.Condition)
                                   && (step.Run
                                       |> Option.map (fun run -> runDeclaresCommand run handWiredGate.Command)
                                       |> Option.defaultValue false)))
                        |> List.map fst

                    if List.isEmpty matchingJobs then
                        Error(
                            sprintf
                                "Hand-wired CI gate \"%s\" command \"%s\" is missing from pr-quality-gate.yml"
                                handWiredGate.Id
                                handWiredGate.Command
                        )
                    else
                        let unaggregatedJobs =
                            matchingJobs
                            |> List.filter (fun jobId -> not (List.contains jobId qualityGate.Needs))

                        if not (List.isEmpty unaggregatedJobs) then
                            Error(
                                sprintf
                                    "Hand-wired CI gate \"%s\" command \"%s\" maps to job(s) %s that must be direct quality-gate dependencies in pr-quality-gate.yml"
                                    handWiredGate.Id
                                    handWiredGate.Command
                                    (String.concat ", " unaggregatedJobs)
                            )
                        else
                            loop rest

            loop handWiredCiGates

/// Loads the CI workflow only when the registry declares a CI surface
/// [Repo-grounded — `gate/validate.rs::workflow_jobs`].
[<ExcludeFromCodeCoverage>]
let private workflowJobs (repoRoot: string) (config: RepoConfig) : Result<Workflow, string> =
    let hasCiGates = config.Gates |> List.exists (declaresSurface Ci)

    if not hasCiGates then
        Ok emptyWorkflow
    else
        let workflowPath =
            Path.Combine(repoRoot, ".github", "workflows", "pr-quality-gate.yml")

        if not (File.Exists workflowPath) then
            Error(
                sprintf
                    "CI workflow pr-quality-gate.yml is required for declared CI gates: no such file at %s"
                    workflowPath
            )
        else
            match parseWorkflowYaml (File.ReadAllText workflowPath) with
            | Error message -> Error(sprintf "CI workflow pr-quality-gate.yml is not valid YAML: %s" message)
            | Ok workflow ->
                if List.isEmpty workflow.Jobs then
                    let handWiredIds =
                        config.Gates
                        |> List.filter (fun gate -> gate.Wiring = Some HandWired && declaresSurface Ci gate)
                        |> List.map (fun gate -> gate.Id)

                    let suffix =
                        if List.isEmpty handWiredIds then
                            ""
                        else
                            sprintf "; missing hand-wired gate job(s): %s" (String.concat ", " handWiredIds)

                    Error(
                        sprintf
                            "CI workflow pr-quality-gate.yml must declare at least one job for declared CI gates%s"
                            suffix
                    )
                else
                    Ok workflow

/// Validates registry-backed commands and hand-wired jobs in the CI workflow
/// [Repo-grounded — `gate/validate.rs::validate_ci_workflow`].
[<ExcludeFromCodeCoverage>]
let private validateCiWorkflow (repoRoot: string) (config: RepoConfig) : Result<unit, string> =
    match workflowJobs repoRoot config with
    | Error message -> Error message
    | Ok workflow ->
        validateCiMatrixContract config workflow
        |> Result.bind (fun () -> validateCiDoctorBootstrap config workflow)
        |> Result.bind (fun () -> validateCiGateInvocations config workflow)
        |> Result.bind (fun () -> validateHandWiredCiJobs config workflow)

/// Validates that `package.json` contains the generated lint-staged block
/// [Repo-grounded — `gate/validate.rs::validate_lint_staged`].
[<ExcludeFromCodeCoverage>]
let private validateLintStaged (repoRoot: string) (config: RepoConfig) : Result<unit, string> =
    let packagePath = Path.Combine(repoRoot, "package.json")

    if not (File.Exists packagePath) then
        Ok()
    else
        try
            match JsonNode.Parse(File.ReadAllText packagePath) with
            | :? JsonObject as package ->
                let expected = JsonObject()

                for glob, commands in lintStagedFromConfig config do
                    let array = JsonArray()

                    for command in commands do
                        array.Add(JsonValue.Create command)

                    expected.Add(glob, array)

                let committed =
                    if package.ContainsKey "lint-staged" then
                        package.["lint-staged"]
                    else
                        null

                if JsonNode.DeepEquals(committed, expected) then
                    Ok()
                else
                    Error "package.json lint-staged differs from the gate registry; run gate emit --surface=pre-commit"
            | _ -> Ok()
        with ex ->
            Error(sprintf "cannot read %s: %s" packagePath ex.Message)

/// In-memory documents consumed by gate-conformance validation. Paths are
/// repository-relative and hook executability is explicit, so the policy
/// core does not infer either fact from an operating system.
type GateValidationDocuments =
    { Files: Map<string, string>
      ExecutableHooks: Set<string> }

/// Validates registry composition against already-read repository documents.
/// [`validateAtRoot`] remains the local-resource adapter.
let validateDocuments (config: RepoConfig) (documents: GateValidationDocuments) : Result<unit, string> =
    let validateHooks () =
        let rec loop surfaces =
            match surfaces with
            | [] -> Ok()
            | (surface, shimName) :: rest ->
                if not (config.Gates |> List.exists (declaresSurface surface)) then
                    loop rest
                else
                    let path = sprintf ".husky/%s" shimName
                    let expected = sprintf "./rhino gate run --surface %s" shimName
                    let contents = documents.Files |> Map.tryFind path |> Option.defaultValue ""

                    if
                        documents.ExecutableHooks.Contains path
                        && hasExecutableShellInvocation contents expected
                    then
                        loop rest
                    else
                        Error(
                            sprintf
                                "Gate surface shim .husky/%s must be executable and invoke ./rhino gate run --surface %s"
                                shimName
                                shimName
                        )

        loop [ CommitMsg, "commit-msg"; PreCommit, "pre-commit"; PrePush, "pre-push" ]

    let validateWorkflow () =
        let hasCiGates = config.Gates |> List.exists (declaresSurface Ci)

        if not hasCiGates then
            Ok()
        else
            match documents.Files |> Map.tryFind ".github/workflows/pr-quality-gate.yml" with
            | None -> Error "CI workflow pr-quality-gate.yml is required for declared CI gates"
            | Some yaml ->
                parseWorkflowYaml yaml
                |> Result.bind (fun workflow ->
                    if List.isEmpty workflow.Jobs then
                        let handWiredIds =
                            config.Gates
                            |> List.filter (fun gate -> gate.Wiring = Some HandWired && declaresSurface Ci gate)
                            |> List.map (fun gate -> gate.Id)

                        let suffix =
                            if List.isEmpty handWiredIds then
                                ""
                            else
                                sprintf "; missing hand-wired gate job(s): %s" (String.concat ", " handWiredIds)

                        Error(
                            sprintf
                                "CI workflow pr-quality-gate.yml must declare at least one job for declared CI gates%s"
                                suffix
                        )
                    else
                        validateCiMatrixContract config workflow
                        |> Result.bind (fun () -> validateCiDoctorBootstrap config workflow)
                        |> Result.bind (fun () -> validateCiGateInvocations config workflow)
                        |> Result.bind (fun () -> validateHandWiredCiJobs config workflow))

    let validatePackage () =
        match documents.Files |> Map.tryFind "package.json" with
        | None -> Ok()
        | Some packageText ->
            try
                match JsonNode.Parse packageText with
                | :? JsonObject as package ->
                    let expected = JsonObject()

                    for glob, commands in lintStagedFromConfig config do
                        let array = JsonArray()
                        commands |> List.iter (JsonValue.Create >> array.Add)
                        expected.Add(glob, array)

                    let committed =
                        if package.ContainsKey "lint-staged" then
                            package.["lint-staged"]
                        else
                            null

                    if JsonNode.DeepEquals(committed, expected) then
                        Ok()
                    else
                        Error
                            "package.json lint-staged differs from the gate registry; run gate emit --surface=pre-commit"
                | _ -> Ok()
            with ex ->
                Error(sprintf "cannot parse package.json: %s" ex.Message)

    validateCiGroupDeclared config
    |> Result.bind (fun () -> validateLocalHookComposition config)
    |> Result.bind (fun () -> validateVerifiesReferences config)
    |> Result.bind (fun () -> validateFormatterVerification config)
    |> Result.bind (fun () -> validateDelegationRows config)
    |> Result.bind validateHooks
    |> Result.bind validateWorkflow
    |> Result.bind validatePackage

/// Validates gate-registry composition rules at a known repository root
/// [Repo-grounded — `gate/validate.rs::run_at_root`].
[<ExcludeFromCodeCoverage>]
let validateAtRoot (repoRoot: string) : Result<unit, string> =
    match load repoRoot with
    | Error message -> Error message
    | Ok config ->
        validateCiGroupDeclared config
        |> Result.bind (fun () -> validateLocalHookComposition config)
        |> Result.bind (fun () -> validateVerifiesReferences config)
        |> Result.bind (fun () -> validateFormatterVerification config)
        |> Result.bind (fun () -> validateDelegationRows config)
        |> Result.bind (fun () -> validateLocalHookShims repoRoot config)
        |> Result.bind (fun () -> validateCiWorkflow repoRoot config)
        |> Result.bind (fun () -> validateLintStaged repoRoot config)
