/// Port of the slice of the Rust `application::agents` namespace needed by the
/// scenarios in
/// `specs/apps/rhino/cli/behaviours/harness/agents-bindings.feature`
/// and
/// `specs/apps/rhino/cli/behaviours/harness/agents-detect-duplication.feature`,
/// and
/// `specs/apps/rhino/cli/behaviours/harness/agents-skills-mirror.feature`,
/// and
/// `specs/apps/rhino/cli/behaviours/harness/agents-sync.feature`,
/// and
/// `specs/apps/rhino/cli/behaviours/harness/agents-validate-claude.feature`,
/// and
/// `specs/apps/rhino/cli/behaviours/harness/codex-binding.feature`,
/// and
/// `specs/apps/rhino/cli/behaviours/harness/governance-word-budget-pre-push.feature`,
/// and
/// `specs/apps/rhino/cli/behaviours/harness/governance-word-budget-rule.feature`,
/// and
/// `specs/apps/rhino/cli/behaviours/harness/harness-audit.feature`,
/// and `specs/apps/rhino/cli/behaviours/harness/harness-catalog.feature`,
/// and `specs/apps/rhino/cli/behaviours/harness/harness-ownership.feature`,
/// and `specs/apps/rhino/cli/behaviours/harness/harness-sync-triage.feature`
/// [Repo-grounded — `apps/rhino-cli/src/application/agents/agent_validator.rs`,
/// `apps/rhino-cli/src/application/agents/bindings.rs`,
/// `apps/rhino-cli/src/application/agents/catalog.rs`,
/// `apps/rhino-cli/src/application/agents/claude_validator.rs`,
/// `apps/rhino-cli/src/application/agents/codex.rs`,
/// `apps/rhino-cli/src/application/agents/converter.rs`,
/// `apps/rhino-cli/src/application/agents/detect_duplication.rs`,
/// `apps/rhino-cli/src/application/agents/emit.rs`,
/// `apps/rhino-cli/src/application/agents/field_policy.rs`,
/// `apps/rhino-cli/src/application/agents/frontmatter.rs`,
/// `apps/rhino-cli/src/application/agents/ownership.rs`,
/// `apps/rhino-cli/src/application/agents/skill_validator.rs`,
/// `apps/rhino-cli/src/application/agents/skills_mirror.rs`,
/// `apps/rhino-cli/src/application/agents/sync.rs`,
/// `apps/rhino-cli/src/application/agents/sync_validator.rs`,
/// `apps/rhino-cli/src/application/agents/types.rs`,
/// `apps/rhino-cli/src/application/agents/yaml_formatting.rs`,
/// `apps/rhino-cli/src/application/governance/word_budget.rs`,
/// `apps/rhino-cli/src/application/repo_governance/audit_orchestrator.rs`,
/// `apps/rhino-cli/src/commands/gate/run.rs`,
/// `apps/rhino-cli/src/commands/governance_audit.rs`,
/// `apps/rhino-cli/src/commands/harness_audit.rs`,
/// `apps/rhino-cli/src/commands/harness_catalog.rs`,
/// `apps/rhino-cli/src/commands/harness_generate_bindings.rs`,
/// `apps/rhino-cli/src/commands/harness_sync_promote.rs`,
/// `apps/rhino-cli/src/commands/harness_sync_triage.rs`,
/// `apps/rhino-cli/src/commands/harness_validate_claude.rs`].
///
/// Scope note: Rust's `validate_bindings` tallies five check families —
/// static binding-file byte parity, `OpenCode`/Skills mirror sync, catalog
/// coverage, `.codex/agents/` file extensions, and the `.codex/config.toml`
/// generated region, plus the colour/tier translation maps. This module
/// currently implements the five the landed feature files exercise (catalog
/// coverage, the Codex agent-file extension, skills-mirror byte parity,
/// `OpenCode` agent-mirror sync, and Codex agent/`.codex/config.toml`
/// generation) and the registry-derived `--harness` name check. Static
/// binding-file byte parity remains out of scope as its own check family —
/// no landed scenario tallies it — but the remediation sentence it would
/// carry ([`driftRemediation`]) is ported and reused by
/// [`validateAgentYaml`]'s body-mismatch failure, which is the check family
/// `harness/harness-sync-triage.feature`'s "default failure behaviour"
/// scenario actually exercises against a hand-edited mirror.
///
/// A second scope note covers `sync_validator.rs::validate_sync`, which
/// tallies five check families of its own. This module implements only the
/// two `harness/agents-sync.feature`'s `@agents-validate-sync` scenarios
/// exercise — `validate_agent_count` and `validate_agent_equivalence` — and
/// omits `validate_no_stale_agent_dir`, `validate_no_synced_skills`, and
/// `validate_skills_mirror`, none of which any landed scenario reaches.
///
/// A third scope note covers `claude_validator.rs::validate_claude` and its
/// two check layers (`agent_validator.rs`, `skill_validator.rs`): this module
/// ports both layers in full, matching every check family Rust runs. Only
/// `reporter.rs`'s plain-text/JSON/Markdown renderers and
/// `harness_validate_claude.rs`'s CLI argument wiring stay out of scope,
/// since `harness/agents-validate-claude.feature`'s scenarios assert on the
/// returned `ValidationResult` directly rather than on rendered CLI output —
/// the same precedent every other scenario in this module follows.
///
/// A fourth scope note covers `ownership.rs::validate_ownership`, which folds
/// in Rust's `validate_bindings` checks wholesale because that one function
/// already tallies both the static-binding-file byte-parity family and the
/// `OpenCode` mirror sync family. This module ported those two families as
/// two separate functions instead ([`validateBindings`] and [`validateSync`],
/// per the first and second scope notes above), so [`validateOwnership`]
/// folds in both explicitly to reach the same effective coverage. `classify`,
/// `guard_emitter_targets`, and `binding_roots` are ported in full, with one
/// narrowing: `binding_roots` also walks `rules-dir`/`config`/`instruction`
/// roots, which this module's `HarnessEntry` does not model (see its own
/// scope note); every landed fixture's and the real registry's value for
/// those fields is already named by a separate `ownership:` entry, so the
/// narrower root set this module computes agrees with Rust's on every
/// scenario this feature file exercises.
///
/// A fifth scope note covers `triage.rs`'s divergence triage and promotion.
/// `triage`, `promote`, `resolve_canonical`, `unified_diff`, and every
/// formatter in `harness_sync_triage.rs`/`harness_sync_promote.rs` are
/// ported in full. `ScratchTree::build`'s symlink-aware `copy_path`/`copy_tree`
/// collapse into one [`copyPath`] that treats a missing root as a no-op the
/// same way, since no landed scenario exercises a symlinked or
/// permission-denied binding root — those are Rust-only regression tests
/// with no corresponding Gherkin scenario. `scratch_roots` includes the
/// Codex config path via the already-existing [`codexConfigFile`] constant
/// rather than a per-entry `config:` field, per the fourth scope note's
/// `HarnessEntry` narrowing.
///
/// The `harness` namespace stays on the Rust side of `FSHARP_NAMESPACES`
/// until every Wave E feature file has landed, so no CLI path reaches this
/// partial validator in the meantime.
module RhinoCli.Application.Harness

open System
open System.Collections.Generic
open System.Diagnostics
open System.IO
open System.Security.Cryptography
open System.Text
open System.Text.Json
open System.Text.Json.Nodes
open System.Text.RegularExpressions
open RhinoCli.Application.Governance
open YamlDotNet.Serialization
open YamlDotNet.Serialization.NamingConventions

// ---------------------------------------------------------------------------
// Validation check / result shapes
// ---------------------------------------------------------------------------

/// One validation outcome [Repo-grounded — `agents/types.rs::ValidationCheck`].
///
/// `Status` is a plain string rather than a discriminated union because the
/// JSON and text reporters both emit it verbatim, and Rust's reporter matches
/// on the literals `"passed"` / `"warning"` / anything-else-is-failed.
type ValidationCheck =
    { Name: string
      Status: string
      Expected: string
      Actual: string
      Message: string }

/// Constructors mirroring `ValidationCheck`'s Rust associated functions.
[<RequireQualifiedAccess>]
module ValidationCheck =

    /// A `passed` check carrying only a name and an explanatory message.
    let passed (name: string) (message: string) : ValidationCheck =
        { Name = name
          Status = "passed"
          Expected = ""
          Actual = ""
          Message = message }

    /// A `warning` check carrying the expected/actual pair alongside its message.
    let warning (name: string) (expected: string) (actual: string) (message: string) : ValidationCheck =
        { Name = name
          Status = "warning"
          Expected = expected
          Actual = actual
          Message = message }

    /// A `failed` check carrying the expected/actual pair alongside its message.
    let failed (name: string) (expected: string) (actual: string) (message: string) : ValidationCheck =
        { Name = name
          Status = "failed"
          Expected = expected
          Actual = actual
          Message = message }

    /// A `failed` check with no expected/actual pair — used where the failure
    /// is an I/O or parse error rather than a mismatch.
    let failedMsg (name: string) (message: string) : ValidationCheck =
        { Name = name
          Status = "failed"
          Expected = ""
          Actual = ""
          Message = message }

/// A tallied run of validation checks
/// [Repo-grounded — `agents/types.rs::ValidationResult`].
type ValidationResult =
    { TotalChecks: int
      PassedChecks: int
      WarningChecks: int
      FailedChecks: int
      Checks: ValidationCheck list
      Duration: TimeSpan }

/// Accumulation helpers for [`ValidationResult`].
[<RequireQualifiedAccess>]
module ValidationResult =

    /// The zero value every validator folds its checks onto
    /// [Repo-grounded — `#[derive(Default)]` on Rust's `ValidationResult`].
    let empty: ValidationResult =
        { TotalChecks = 0
          PassedChecks = 0
          WarningChecks = 0
          FailedChecks = 0
          Checks = []
          Duration = TimeSpan.Zero }

    /// Appends `check` and increments the counter its status selects. Anything
    /// that is neither `passed` nor `warning` counts as failed, matching Rust's
    /// catch-all match arm.
    let tally (check: ValidationCheck) (result: ValidationResult) : ValidationResult =
        let passedDelta = if check.Status = "passed" then 1 else 0
        let warningDelta = if check.Status = "warning" then 1 else 0
        let failedDelta = 1 - passedDelta - warningDelta

        { result with
            TotalChecks = result.TotalChecks + 1
            PassedChecks = result.PassedChecks + passedDelta
            WarningChecks = result.WarningChecks + warningDelta
            FailedChecks = result.FailedChecks + failedDelta
            Checks = result.Checks @ [ check ] }

// ---------------------------------------------------------------------------
// Binding surfaces
// ---------------------------------------------------------------------------

/// The binding directories checked for catalog coverage: if one exists on
/// disk, the platform-bindings catalog must reference it. Covers the three
/// supported harnesses (`.claude` source, `.opencode` and `.codex` generated
/// mirrors), the vendor-neutral skills surface `.agents`, and the
/// repository-level `.github` surface — and deliberately names no dropped
/// harness (`.cursor`, `.amazonq`, `.pi`)
/// [Repo-grounded — `bindings.rs::KNOWN_BINDING_DIRS`].
let knownBindingDirs: string list =
    [ ".claude"; ".opencode"; ".codex"; ".agents"; ".github" ]

/// Repo-relative path of the platform-bindings catalog document
/// [Repo-grounded — `bindings.rs::PLATFORM_BINDINGS_CATALOG`].
[<Literal>]
let platformBindingsCatalog = "docs/reference/platform-bindings.md"

/// Directory holding standalone Codex agent files
/// [Repo-grounded — `codex.rs::CODEX_AGENT_DIR`].
[<Literal>]
let codexAgentDir = ".codex/agents"

/// The only extension Codex CLI recognises for a standalone agent file under
/// [`codexAgentDir`]; a `.md` file there is silently ignored by Codex, which
/// is why the validator rejects one outright rather than warning
/// [Repo-grounded — `codex.rs::CODEX_AGENT_EXTENSION`].
[<Literal>]
let codexAgentExtension = "toml"

/// One canonical (relative path, expected content) pair for a generated file
/// [Repo-grounded — `bindings.rs::BindingFile`].
type BindingFile =
    {
        /// POSIX-style path relative to the repository root.
        RelPath: string
        /// Exact content the file must hold.
        Content: string
    }

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

/// Joins a POSIX-style relative path onto `repoRoot` for the host filesystem
/// [Repo-grounded — `bindings.rs::join_rel`].
let private joinRel (repoRoot: string) (rel: string) : string =
    rel.Split('/')
    |> Array.filter (fun segment -> segment <> "")
    |> Array.fold (fun (acc: string) segment -> Path.Combine(acc, segment)) repoRoot

/// Drops one leading `/` so a catalog entry written as an absolute-looking
/// path still resolves under the repository root
/// [Repo-grounded — `bindings.rs::strip_leading_slash`].
let private stripLeadingSlash (s: string) : string =
    if s.StartsWith("/", StringComparison.Ordinal) then
        s.Substring(1)
    else
        s

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

/// Matches a `key:value` line missing its space after the colon; list items
/// (`  - Read`) never match because the key must start the line
/// [Repo-grounded — `frontmatter.rs::yaml_colon_norm`].
let private yamlColonNorm: Regex =
    Regex(@"^([a-zA-Z0-9_-]+):([^\s])", RegexOptions.Multiline ||| RegexOptions.Compiled)

/// Inserts the missing space after a `key:value` colon
/// [Repo-grounded — `frontmatter.rs::normalize_yaml`].
let normalizeYaml (content: string) : string =
    yamlColonNorm.Replace(content, "$1: $2")

/// Splits `content` into its normalized YAML frontmatter and its body
/// [Repo-grounded — `frontmatter.rs::extract_frontmatter`].
let extractFrontmatter (content: string) : Result<string * string, string> =
    let lines = content.Split('\n')

    if lines.Length < 3 then
        Error "file too short to contain frontmatter"
    elif lines.[0].Trim() <> "---" then
        Error "frontmatter does not start with ---"
    else
        match
            lines
            |> Array.skip 1
            |> Array.tryFindIndex (fun line -> line.Trim() = "---")
            |> Option.map (fun relativeIdx -> relativeIdx + 1)
        with
        | None -> Error "frontmatter closing --- not found"
        | Some closingIdx ->
            let front = String.Join("\n", lines.[1 .. closingIdx - 1])

            let body =
                if closingIdx + 1 < lines.Length then
                    String.Join("\n", lines.[closingIdx + 1 ..])
                else
                    ""

            Ok(normalizeYaml front, body)

/// Deserializes a frontmatter block into its top-level key/value mapping.
/// `IgnoreUnmatchedProperties` is irrelevant for a dictionary target but is
/// kept for symmetry with `RepoConfig`'s builder.
let private yamlDeserializer: IDeserializer =
    DeserializerBuilder().WithNamingConvention(NullNamingConvention.Instance).IgnoreUnmatchedProperties().Build()

// ---------------------------------------------------------------------------
// Agent source discovery
// ---------------------------------------------------------------------------

/// Whether a `.claude/agents/` entry is a mirrorable agent definition:
/// a `.md` file that is not the directory's own `README.md`
/// [Repo-grounded — `converter.rs::is_mirrorable_agent_filename`].
let isMirrorableAgentFilename (name: string) (isDir: bool) : bool =
    not isDir
    && name.EndsWith(".md", StringComparison.Ordinal)
    && name <> "README.md"

/// Reads an agent's mirror name from its `name` frontmatter field — never
/// derived from the filename, because a grouped source
/// (`.claude/agents/<group>/<file>.md`) must still flatten to one mirror
/// filename [Repo-grounded — `converter.rs::read_agent_name`].
let readAgentName (path: string) : Result<string, string> =
    let content =
        try
            Ok(File.ReadAllText path)
        with ex ->
            Error(sprintf "failed to read file %s: %s" path ex.Message)

    content
    |> Result.bind (fun text ->
        extractFrontmatter text
        |> Result.mapError (fun e -> sprintf "failed to extract frontmatter from %s: %s" path e))
    |> Result.bind (fun (front, _body) ->
        try
            match yamlDeserializer.Deserialize<Dictionary<string, obj>>(front) with
            | null -> Error(sprintf "frontmatter is not a mapping in %s" path)
            | mapping ->
                match mapping.TryGetValue "name" with
                | true, (:? string as name) -> Ok name
                | _ -> Error(sprintf "agent file %s has no scalar 'name' frontmatter field" path)
        with ex ->
            Error(sprintf "failed to parse YAML frontmatter in %s: %s" path ex.Message))

/// Discovers mirrorable agent sources under `claudeDir`, walking files
/// directly in the directory plus exactly one level of group nesting.
/// Returns `(sourcePath, name)` pairs sorted by name, and fails on a name
/// collision — two sources flattening to the same mirror filename would make
/// the generated mirror non-deterministic
/// [Repo-grounded — `converter.rs::discover_agent_sources`].
let discoverAgentSources (claudeDir: string) : Result<(string * string) list, string> =
    let readEntries (dir: string) : Result<string list, string> =
        try
            Ok(Directory.GetFileSystemEntries dir |> List.ofArray)
        with ex ->
            Error(sprintf "failed to read %s directory: %s" dir ex.Message)

    let mirrorableIn (dir: string) : string list =
        // A group directory that cannot be read is skipped, matching Rust's
        // `let Ok(group_entries) = ... else { continue }`.
        try
            Directory.GetFileSystemEntries dir
            |> Array.filter (fun path -> isMirrorableAgentFilename (Path.GetFileName path) (Directory.Exists path))
            |> List.ofArray
        with _ ->
            []

    readEntries claudeDir
    |> Result.map (fun entries ->
        entries
        |> List.collect (fun path ->
            if Directory.Exists path then
                mirrorableIn path
            elif isMirrorableAgentFilename (Path.GetFileName path) false then
                [ path ]
            else
                []))
    |> Result.bind (fun files ->
        let seen = Dictionary<string, string>()

        let rec name (remaining: string list) (acc: (string * string) list) =
            match remaining with
            | [] -> Ok(List.rev acc)
            | path :: rest ->
                match readAgentName path with
                | Error e -> Error e
                | Ok agentName ->
                    match seen.TryGetValue agentName with
                    | true, existing ->
                        Error(
                            sprintf
                                "agent name collision: '%s' is used by both %s and %s — flat mirror filenames must be unique"
                                agentName
                                existing
                                path
                        )
                    | _ ->
                        seen.Add(agentName, path)
                        name rest ((path, agentName) :: acc)

        name files [])
    |> Result.map (List.sortBy snd)

/// The repo-relative paths of the binding files the parity guard expects to
/// find, one `.codex/agents/<name>.toml` per discovered `.claude/agents/`
/// agent. Empty when `.claude/agents/` does not exist, which is the case in
/// fixture repositories exercising only the other checks
/// [Repo-grounded — `bindings.rs::expected_bindings`].
///
/// The paths alone, not the `(path, content)` pairs Rust returns: rendering a
/// Codex agent's bytes is `codex.rs`'s job and lands with
/// `harness/codex-binding.feature`.
let expectedBindingPaths (repoRoot: string) : Result<string list, string> =
    let claudeDir = Path.Combine(repoRoot, ".claude", "agents")

    if not (Directory.Exists claudeDir) then
        Ok []
    else
        discoverAgentSources claudeDir
        |> Result.map (List.map (fun (_source, name) -> sprintf "%s/%s.%s" codexAgentDir name codexAgentExtension))

// ---------------------------------------------------------------------------
// Canonical-source resolution (harness sync triage / promote)
// ---------------------------------------------------------------------------

/// The remainder of `rel` below `dir`, comparing path components so
/// `.claude/skills` never claims `.claude/skills-archive/x.md`
/// [Repo-grounded — `ownership.rs::strip_dir`, reused by `triage.rs`].
let private stripDir (rel: string) (dir: string) : string option =
    let dirNorm = dir.TrimEnd('/')

    if rel = dirNorm then
        Some ""
    elif rel.StartsWith(dirNorm + "/", StringComparison.Ordinal) then
        Some(rel.Substring(dirNorm.Length + 1))
    else
        None

/// [`resolveCanonical`] for one registry entry: a skills mirror is a byte
/// copy, so its path maps one-to-one; an agent mirror is keyed on the
/// agent's `name`, which the emitter also uses as the mirror's filename, so
/// the stem identifies the source
/// [Repo-grounded — `triage.rs::canonical_for_entry`].
let private canonicalForEntry (repoRoot: string) (entry: RepoConfig.HarnessEntry) (mirrorRel: string) : string option =
    let bySkills =
        match entry.SkillsDir, entry.SkillsMirrors with
        | Some skillsDir, Some sourceDir ->
            stripDir mirrorRel skillsDir
            |> Option.map (fun suffix -> sprintf "%s/%s" sourceDir suffix)
        | _ -> None

    match bySkills with
    | Some found -> Some found
    | None ->
        match entry.AgentDir, entry.Mirrors with
        | Some agentDir, Some sourceDir ->
            match stripDir mirrorRel agentDir with
            | None -> None
            | Some suffix ->
                let stem = Path.GetFileNameWithoutExtension suffix

                match discoverAgentSources (Path.Combine(repoRoot, sourceDir)) with
                | Error _ -> None
                | Ok sources ->
                    sources
                    |> List.tryFind (fun (_, name) -> name = stem)
                    |> Option.bind (fun (path, _) ->
                        if path.StartsWith(repoRoot, StringComparison.Ordinal) then
                            Some(path.Substring(repoRoot.Length).TrimStart('/', '\\').Replace('\\', '/'))
                        else
                            None)
        | _ -> None

/// The canonical source path a mirror file is generated from, resolved
/// through the registry's `mirrors` / `skills-mirrors` declarations. `None`
/// when no harness entry claims the path
/// [Repo-grounded — `triage.rs::resolve_canonical`].
let resolveCanonical (repoRoot: string) (config: RepoConfig.RepoConfig) (mirrorRel: string) : string option =
    config.Harness
    |> List.tryPick (fun entry -> canonicalForEntry repoRoot entry mirrorRel)

/// The remediation sentence a drifted generated file carries. Names BOTH
/// ways out — the canonical file to edit, and the promote command that
/// keeps a mirror edit instead of discarding it — so a developer who hits a
/// drift failure learns promotion exists from the failure message itself
/// [Repo-grounded — `bindings.rs::drift_remediation`].
let driftRemediation (repoRoot: string) (mirrorRel: string) : string =
    let source =
        match RepoConfig.load repoRoot with
        | Error _ -> "its canonical .claude/ source"
        | Ok config ->
            match resolveCanonical repoRoot config mirrorRel with
            | Some path -> sprintf "`%s`" path
            | None -> "its canonical .claude/ source"

    sprintf
        "%s drifted from generated content. Edit %s and run `rhino-cli harness bindings generate` to regenerate it, or keep the mirror edit for review with `rhino-cli harness sync promote --from %s`."
        mirrorRel
        source
        mirrorRel

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/// Checks that `dir` is referenced in the platform-bindings catalog whenever
/// it exists on disk; an absent directory needs no catalog row
/// [Repo-grounded — `bindings.rs::validate_catalog_coverage`].
let validateCatalogCoverageState (dir: string) (exists: bool) (catalog: Result<string, string>) : ValidationCheck =
    let checkName = sprintf "Catalog Coverage: %s" dir

    if not exists then
        ValidationCheck.passed checkName (sprintf "%s absent on disk; no catalog row required" dir)
    else
        match catalog with
        | Error e -> ValidationCheck.failedMsg checkName (sprintf "failed to read %s: %s" platformBindingsCatalog e)
        | Ok catalog ->
            if catalog.Contains(dir, StringComparison.Ordinal) then
                ValidationCheck.passed checkName (sprintf "%s referenced in %s" dir platformBindingsCatalog)
            else
                ValidationCheck.failed
                    checkName
                    (sprintf "%s referenced in %s" dir platformBindingsCatalog)
                    (sprintf "%s present on disk but absent from catalog" dir)
                    (sprintf
                        "binding dir %s exists but is not referenced in %s; add a catalog row"
                        dir
                        platformBindingsCatalog)

let validateCatalogCoverage (repoRoot: string) (dir: string) : ValidationCheck =
    let dirPath = Path.Combine(repoRoot, stripLeadingSlash dir)
    let exists = Directory.Exists dirPath || File.Exists dirPath

    let catalog =
        try
            Ok(File.ReadAllText(joinRel repoRoot platformBindingsCatalog))
        with ex ->
            Error ex.Message

    validateCatalogCoverageState dir exists catalog

/// Whether `fileName` is something Codex CLI will not read as a standalone
/// agent definition under [`codexAgentDir`] — anything not ending in `.toml`
/// [Repo-grounded — `codex.rs::is_rejected_codex_agent_filename`].
let isRejectedCodexAgentFilename (fileName: string) : bool =
    not (fileName.EndsWith("." + codexAgentExtension, StringComparison.Ordinal))

let validateCodexAgentFilenames (directoryExists: bool) (files: Result<string list, unit>) : ValidationCheck =
    let checkName = sprintf "Codex Agent Files: %s" codexAgentDir

    if not directoryExists then
        ValidationCheck.passed checkName (sprintf "%s absent; nothing to check" codexAgentDir)
    else
        match files with
        | Error() -> ValidationCheck.failedMsg checkName (sprintf "failed to read %s" codexAgentDir)
        | Ok files ->
            let offenders =
                files
                |> List.map Path.GetFileName
                |> List.filter isRejectedCodexAgentFilename
                |> List.sortWith (fun a b -> String.CompareOrdinal(a, b))

            if List.isEmpty offenders then
                ValidationCheck.passed
                    checkName
                    (sprintf "every file under %s uses the .%s extension" codexAgentDir codexAgentExtension)
            else
                let joined = String.Join(", ", offenders)

                ValidationCheck.failed
                    checkName
                    (sprintf "every file under %s ends in .%s" codexAgentDir codexAgentExtension)
                    (sprintf "non-.%s file(s): %s" codexAgentExtension joined)
                    (sprintf
                        "%s/%s uses an extension Codex CLI does not recognise; a standalone Codex agent file must be <name>.%s (the alternative is an [agents.<name>] table in .codex/config.toml)"
                        codexAgentDir
                        joined
                        codexAgentExtension)

/// Checks that every file under `.codex/agents/` uses the officially
/// recognised `.toml` extension. The directory itself is permitted — a
/// standalone `<name>.toml` agent file IS a Codex CLI convention — and each
/// offender is named so the fix is unambiguous
/// [Repo-grounded — `bindings.rs::validate_codex_agents_dir`].
let validateCodexAgentsDir (repoRoot: string) : ValidationCheck =
    let dirPath = joinRel repoRoot codexAgentDir

    if not (Directory.Exists dirPath) then
        validateCodexAgentFilenames false (Ok [])
    else
        let files =
            try
                Ok(Directory.GetFiles dirPath |> Array.toList)
            with _ ->
                Error()

        validateCodexAgentFilenames true files

// ---------------------------------------------------------------------------
// `--harness` name acceptance
// ---------------------------------------------------------------------------

/// The `--harness` names `harness bindings generate` accepts, derived from the
/// `harness:` registry rather than a hard-coded list, so a registry
/// contraction rejects the dropped name automatically
/// [Repo-grounded — `harness_generate_bindings.rs::run`].
let acceptedHarnessNames (config: RepoConfig.RepoConfig) : string list =
    config.Harness |> List.map (fun entry -> entry.Name)

/// Accepts `requested` when the registry declares it, and otherwise reports
/// the registry-derived accepted set so the caller does not have to go and
/// find it [Repo-grounded — `harness_generate_bindings.rs::run`].
let validateHarnessName (config: RepoConfig.RepoConfig) (requested: string) : Result<unit, string> =
    HarnessPolicy.validateRequestedHarness (acceptedHarnessNames config) requested

// ---------------------------------------------------------------------------
// Verbatim duplication detection
// ---------------------------------------------------------------------------

/// Number of consecutive normalized lines that constitutes a duplication window
/// [Repo-grounded — `detect_duplication.rs::DUPLICATION_WINDOW_SIZE`].
[<Literal>]
let duplicationWindowSize = 10

/// One duplication finding: the same window appearing in two or more files
/// [Repo-grounded — `detect_duplication.rs::DuplicationFinding`].
type DuplicationFinding =
    {
        /// Sorted absolute paths where the duplicated window appears.
        Files: string list
        /// 1-based first line of the window in each corresponding file.
        StartLines: int list
        /// Always [`duplicationWindowSize`].
        WindowSize: int
        /// Always `"high"`.
        Severity: string
        /// Human-readable description.
        Message: string
    }

/// Role suffixes denoting the repository's sanctioned maker-checker-fixer,
/// swe-dev, and web-tester template families — agents in the same role are
/// *designed* to share workflow boilerplate verbatim
/// [Repo-grounded — `detect_duplication.rs::SANCTIONED_ROLE_SUFFIXES`].
let private sanctionedRoleSuffixes: string list =
    [ "-fixer"; "-checker"; "-maker"; "-deployer"; "-dev"; "-tester" ]

/// A stable label for `path`: `skills/<dir>` for a skill file (skill content is
/// keyed by its owning directory, since every skill file is literally named
/// `SKILL.md`), the bare file stem otherwise
/// [Repo-grounded — `detect_duplication.rs::family_label`].
let private familyLabel (path: string) : string =
    if Path.GetFileName path = "SKILL.md" then
        let dir =
            match Path.GetDirectoryName path with
            | null -> ""
            | parent -> Path.GetFileName parent

        sprintf "skills/%s" dir
    else
        Path.GetFileNameWithoutExtension path

/// The sanctioned role suffix `label` ends with, if any
/// [Repo-grounded — `detect_duplication.rs::role_suffix`].
let private roleSuffix (label: string) : string option =
    sanctionedRoleSuffixes
    |> List.tryFind (fun suffix -> label.EndsWith(suffix, StringComparison.Ordinal))

/// `label` with its role suffix stripped — the domain it belongs to — or
/// `label` unchanged when it carries no recognized suffix
/// [Repo-grounded — `detect_duplication.rs::domain_prefix`].
let private domainPrefix (label: string) : string =
    match roleSuffix label with
    | Some suffix -> label.Substring(0, label.Length - suffix.Length)
    | None -> label

/// Whether every file in a cluster belongs to the repository's own sanctioned
/// template family — all sharing one role suffix (e.g. every file a
/// `*-checker`), or all sharing one domain once the suffix is stripped (e.g.
/// the `foo-maker`/`foo-checker`/`foo-fixer` trio). Duplication spanning
/// different roles AND different domains is still reported
/// [Repo-grounded — `detect_duplication.rs::is_sanctioned_template_family`].
let private isSanctionedTemplateFamily (distinctFiles: (string * int) list) : bool =
    let labels = distinctFiles |> List.map (fst >> familyLabel)

    match labels |> List.map roleSuffix |> List.distinct with
    | [ Some _ ] -> true
    | _ -> (labels |> List.map domainPrefix |> List.distinct |> List.length) = 1

/// Removes the YAML frontmatter block, returning only the body. Distinct from
/// [`extractFrontmatter`]: this one keeps the body of a file that has no
/// frontmatter at all rather than rejecting it, because a duplication scan
/// must still read such a file
/// [Repo-grounded — `detect_duplication.rs::strip_frontmatter`].
let stripFrontmatterBody (s: string) : string =
    if
        not (
            s.StartsWith("---\n", StringComparison.Ordinal)
            || s.StartsWith("---\r\n", StringComparison.Ordinal)
        )
    then
        s
    else
        match s.IndexOf('\n') with
        | -1 -> s
        | openingNewline ->
            let body = s.Substring(openingNewline + 1)

            // Offset of the first line equal to `---` once a trailing `\r` is
            // trimmed — the closing fence.
            let rec fenceOffset (offset: int) : int option =
                if offset > body.Length then
                    None
                else
                    let slice = body.Substring offset

                    let line, hasNewline =
                        match slice.IndexOf('\n') with
                        | -1 -> slice, false
                        | idx -> slice.Substring(0, idx), true

                    if line.TrimEnd('\r') = "---" then Some offset
                    elif not hasNewline then None
                    else fenceOffset (offset + line.Length + 1)

            match fenceOffset 0 with
            | None -> s
            | Some idx ->
                match body.Substring(idx).IndexOf('\n') with
                | -1 -> ""
                | closingNewline -> body.Substring(idx + closingNewline + 1)

/// Splits into lines with trailing spaces and tabs trimmed and runs of blank
/// lines collapsed to one, so cosmetic whitespace edits cannot hide a
/// duplicated block [Repo-grounded — `detect_duplication.rs::normalize_lines`].
let normalizeLines (s: string) : string list =
    (([], false), s.Replace("\r\n", "\n").Split('\n'))
    ||> Array.fold (fun (acc, prevBlank) line ->
        let trimmed = line.TrimEnd([| ' '; '\t' |])
        let blank = trimmed = ""

        if blank && prevBlank then
            acc, prevBlank
        else
            trimmed :: acc, blank)
    |> fst
    |> List.rev

/// Whether a window is entirely blank lines, or entirely headings and blanks —
/// shared section scaffolding rather than shared prose, so not worth reporting
/// [Repo-grounded — `detect_duplication.rs::is_excluded_window`].
let isExcludedWindow (lines: string list) : bool =
    let nonBlank =
        lines |> List.map (fun line -> line.Trim()) |> List.filter (fun t -> t <> "")

    List.isEmpty nonBlank
    || nonBlank |> List.forall (fun t -> t.StartsWith("#", StringComparison.Ordinal))

/// Lowercase hex SHA-256 of the newline-joined window — the index key
/// [Repo-grounded — `detect_duplication.rs::hash_window`].
let private hashWindow (lines: string list) : string =
    SHA256.HashData(Encoding.UTF8.GetBytes(String.Join("\n", lines)))
    |> Convert.ToHexStringLower

/// Source-tier agent and skill directories derived from `repo-config.yml`,
/// falling back to `.claude/agents` + `.claude/skills` when the registry is
/// absent or declares no source tier — preserving pre-registry behaviour for
/// callers with no config file
/// [Repo-grounded — `detect_duplication.rs::source_dirs_from_registry`].
let sourceDirsFromRegistry (repoRoot: string) : string list * string list =
    let config = RepoConfig.loadOrDefault repoRoot

    let sourceDirs (select: RepoConfig.HarnessEntry -> string option) : string list =
        config.Harness
        |> List.filter (fun entry -> entry.Tier = RepoConfig.Tier.Source)
        |> List.choose select
        |> List.map (joinRel repoRoot)

    let orDefault (fallback: string) (dirs: string list) : string list =
        if List.isEmpty dirs then
            [ Path.Combine(repoRoot, ".claude", fallback) ]
        else
            dirs

    sourceDirs (fun entry -> entry.AgentDir) |> orDefault "agents",
    sourceDirs (fun entry -> entry.SkillsDir) |> orDefault "skills"

/// Every agent `.md` and skill `SKILL.md` path under `repoRoot`, sorted. A
/// directory that does not exist is skipped; one that exists but cannot be
/// read is an error
/// [Repo-grounded — `detect_duplication.rs::enumerate_agent_and_skill_files`].
let private enumerateAgentAndSkillFiles (repoRoot: string) : Result<string list, string> =
    let agentDirs, skillsDirs = sourceDirsFromRegistry repoRoot

    let listing (found: string -> string[]) (dir: string) : Result<string list, string> =
        if not (Directory.Exists dir) then
            Ok []
        else
            try
                Ok(found dir |> List.ofArray)
            with ex ->
                Error(sprintf "read %s: %s" dir ex.Message)

    let agentFiles =
        listing (fun dir ->
            Directory.GetFiles dir
            |> Array.filter (fun path ->
                let name = Path.GetFileName path
                name.EndsWith(".md", StringComparison.Ordinal) && name <> "README.md"))

    let skillFiles =
        listing (fun dir ->
            Directory.GetDirectories dir
            |> Array.map (fun skillDir -> Path.Combine(skillDir, "SKILL.md"))
            |> Array.filter File.Exists)

    let collect (lookup: string -> Result<string list, string>) (dirs: string list) =
        dirs
        |> List.fold
            (fun acc dir ->
                match acc, lookup dir with
                | Error e, _ -> Error e
                | _, Error e -> Error e
                | Ok found, Ok more -> Ok(found @ more))
            (Ok [])

    match collect agentFiles agentDirs, collect skillFiles skillsDirs with
    | Error e, _ -> Error e
    | _, Error e -> Error e
    | Ok agents, Ok skills -> Ok(agents @ skills |> List.sortWith (fun a b -> String.CompareOrdinal(a, b)))

/// Scans the source-tier agent and skill files for verbatim
/// [`duplicationWindowSize`]-line duplications, returning one finding per
/// cluster, ordered by first file then first start line
/// [Repo-grounded — `detect_duplication.rs::detect_duplication`].
let detectDuplicationFromContents (files: (string * string) list) : DuplicationFinding list =
    let index = Dictionary<string, ResizeArray<string * int>>()

    let indexOne (path: string, content: string) : unit =
        let lines = content |> stripFrontmatterBody |> normalizeLines |> Array.ofList

        if lines.Length >= duplicationWindowSize then
            for start in 0 .. lines.Length - duplicationWindowSize do
                let window = lines.[start .. start + duplicationWindowSize - 1] |> List.ofArray

                if not (isExcludedWindow window) then
                    let key = hashWindow window

                    match index.TryGetValue key with
                    | true, refs -> refs.Add(path, start + 1)
                    | _ ->
                        let refs = ResizeArray<string * int>()
                        refs.Add(path, start + 1)
                        index.Add(key, refs)

    let cluster (refs: ResizeArray<string * int>) : DuplicationFinding option =
        // First occurrence per distinct file: a window repeated inside ONE
        // file is repetition, not cross-file duplication.
        let seen = HashSet<string>()

        let distinctFiles =
            refs
            |> Seq.filter (fun (path, _) -> seen.Add path)
            |> Seq.sortWith (fun (a, _) (b, _) -> String.CompareOrdinal(a, b))
            |> List.ofSeq

        if List.length distinctFiles < 2 || isSanctionedTemplateFamily distinctFiles then
            None
        else
            Some
                { Files = distinctFiles |> List.map fst
                  StartLines = distinctFiles |> List.map snd
                  WindowSize = duplicationWindowSize
                  Severity = "high"
                  Message =
                    sprintf
                        "%d-line verbatim duplication across %d files"
                        duplicationWindowSize
                        (List.length distinctFiles) }

    files |> List.iter indexOne

    index.Values
    |> Seq.choose cluster
    |> Seq.sortWith (fun a b ->
        match String.CompareOrdinal(List.head a.Files, List.head b.Files) with
        | 0 -> compare (List.head a.StartLines) (List.head b.StartLines)
        | byFile -> byFile)
    |> List.ofSeq

let detectDuplication (repoRoot: string) : Result<DuplicationFinding list, string> =
    enumerateAgentAndSkillFiles repoRoot
    |> Result.bind (fun files ->
        files
        |> List.fold
            (fun acc path ->
                match acc with
                | Error error -> Error error
                | Ok contents ->
                    try
                        Ok((path, File.ReadAllText path) :: contents)
                    with ex ->
                        Error(sprintf "read %s: %s" path ex.Message))
            (Ok []))
    |> Result.map (List.rev >> detectDuplicationFromContents)

// ---------------------------------------------------------------------------
// Skills mirror
// ---------------------------------------------------------------------------

/// Outcome of one [`emitSkillsMirrors`] run
/// [Repo-grounded — `skills_mirror.rs::MirrorResult`].
type MirrorResult =
    {
        /// Files written (or that would be written under `dryRun`).
        Copied: int
        /// Files removed because their source counterpart no longer exists.
        Removed: int
        /// Mirror directories left untouched because the registry declares them vendored.
        VendoredSkipped: int
    }

/// The zero value every mirror run starts from
/// [Repo-grounded — `#[derive(Default)]` on Rust's `MirrorResult`].
let mirrorResultEmpty: MirrorResult =
    { Copied = 0
      Removed = 0
      VendoredSkipped = 0 }

/// One harness entry's mirror job, resolved from the registry
/// [Repo-grounded — `skills_mirror.rs::MirrorJob`].
type private MirrorJob =
    {
        /// Absolute path of the canonical source tree.
        Source: string
        /// Absolute path of the generated mirror tree.
        Target: string
        /// Repository-relative path of the mirror tree, tested against the
        /// registry's vendored declarations, which are repo-relative.
        TargetRel: string
        /// Repository-relative vendored directories the emitter must not touch.
        Vendored: string list
    }

/// Every mirror job the registry declares. A harness participates only when
/// it declares BOTH `skillsDir` (where the mirror goes) and `skillsMirrors`
/// (what it mirrors) — declaring one without the other is not an implicit
/// mirror. Fails loudly on a present-but-invalid registry rather than
/// collapsing to an empty job list, which would make every downstream reader
/// silently report zero mirrors
/// [Repo-grounded — `skills_mirror.rs::mirror_jobs`].
let private mirrorJobs (repoRoot: string) : Result<MirrorJob list, string> =
    match RepoConfig.loadOptional repoRoot with
    | Error e -> Error e
    | Ok config ->
        let harness = config |> Option.map (fun c -> c.Harness) |> Option.defaultValue []

        let buildJob (entry: RepoConfig.HarnessEntry) : (string * string) option -> Result<MirrorJob, string> option =
            fun targetSourcePair ->
                targetSourcePair
                |> Option.map (fun (targetRel, sourceRel) ->
                    // An ownership/`vendored[]` disagreement makes the removal
                    // path unsafe: a malformed cross-reference can flip a
                    // currently-protected file into the deletion set.
                    let crossCheckFindings =
                        RepoConfig.vendoredMissingFromOwnershipBackedList 0 entry
                        @ RepoConfig.vendoredWithoutOwnershipEntry 0 entry

                    if not (List.isEmpty crossCheckFindings) then
                        Error(
                            sprintf
                                "harness %s: ownership and vendored declarations disagree (%s) — refusing to mirror until the registry is internally consistent, because this exact disagreement is what lets a vendored directory silently lose its protection and get deleted as an orphan"
                                entry.Name
                                (String.Join("; ", crossCheckFindings))
                        )
                    else
                        match RepoConfig.confinedRepoPath repoRoot sourceRel with
                        | Error e -> Error(sprintf "harness %s skills-mirrors %s: %s" entry.Name sourceRel e)
                        | Ok source ->
                            match RepoConfig.confinedRepoPath repoRoot targetRel with
                            | Error e -> Error(sprintf "harness %s skills-dir %s: %s" entry.Name targetRel e)
                            | Ok target ->
                                // A malformed vendored declaration must not be
                                // treated as "nothing is vendored" — that would
                                // delete every mirrored file it was supposed to
                                // protect.
                                let vendoredErrors =
                                    entry.Vendored
                                    |> List.choose (fun v ->
                                        match RepoConfig.validateRepoRelativePath v with
                                        | Ok() -> None
                                        | Error e ->
                                            Some(
                                                sprintf
                                                    "harness %s vendored %s: %s (a malformed vendored declaration must not be treated as \"nothing is vendored\" — that would delete every mirrored file this entry was supposed to protect)"
                                                    entry.Name
                                                    v
                                                    e
                                            ))

                                match vendoredErrors with
                                | first :: _ -> Error first
                                | [] ->
                                    let missingVendored =
                                        entry.Vendored
                                        |> List.tryFind (fun rel ->
                                            match RepoConfig.confinedRepoPath repoRoot rel with
                                            | Error _ -> true
                                            | Ok path -> not (Directory.Exists path) && not (File.Exists path))

                                    match missingVendored with
                                    | Some rel ->
                                        Error(
                                            sprintf
                                                "harness %s vendored %s does not exist; refusing to mirror because a misspelled protection path would let the real external directory be deleted as an orphan"
                                                entry.Name
                                                rel
                                        )
                                    | None ->
                                        Ok
                                            { Source = source
                                              Target = target
                                              TargetRel = targetRel
                                              Vendored = entry.Vendored })

        let results =
            harness
            |> List.choose (fun entry ->
                match entry.SkillsDir, entry.SkillsMirrors with
                | Some targetRel, Some sourceRel -> buildJob entry (Some(targetRel, sourceRel))
                | _ -> None)

        results
        |> List.fold
            (fun acc result ->
                match acc, result with
                | Error e, _ -> Error e
                | _, Error e -> Error e
                | Ok jobs, Ok job -> Ok(jobs @ [ job ]))
            (Ok [])

/// Repository-relative paths of every regular file under `root`, sorted. A
/// symlinked directory is never traversed — the mirror must be able to
/// observe one rather than silently follow it
/// [Repo-grounded — `skills_mirror.rs::relative_files`].
let private relativeFiles (root: string) : string list =
    let rec walk (dir: string) : string list =
        if not (Directory.Exists dir) then
            []
        else
            Directory.GetFileSystemEntries dir
            |> Array.toList
            |> List.collect (fun path ->
                // `Directory.Exists` on a symlink to a directory follows the
                // link on .NET, which is exactly the traversal Rust's
                // `symlink_metadata` avoids — this port accepts that gap since
                // no scenario here constructs a symlinked mirror.
                if Directory.Exists path then
                    walk path
                else
                    [ Path.GetRelativePath(root, path).Replace('\\', '/') ])

    walk root |> List.sortWith (fun a b -> String.CompareOrdinal(a, b))

/// True when `rel` (a path relative to the repository root) lies inside any
/// declared vendored directory
/// [Repo-grounded — `skills_mirror.rs::is_vendored`].
let private isVendored (rel: string) (vendored: string list) : bool =
    vendored |> List.exists (RepoConfig.pathIsUnder rel)

/// What one mirror job would change, computed without touching the filesystem
/// [Repo-grounded — `skills_mirror.rs::JobDiff`].
type JobDiff =
    {
        /// Source-relative paths whose mirrored copy is missing or byte-different.
        ToWrite: string list
        /// Mirror-relative paths with no source counterpart and no vendored declaration.
        ToRemove: string list
        /// Mirrored files left alone because the registry declares them vendored.
        VendoredSkipped: int
    }

let planSkillsMirror
    (targetRel: string)
    (vendored: string list)
    (sourceFiles: Map<string, byte[]>)
    (targetFiles: Map<string, byte[]>)
    : JobDiff =
    let toWrite =
        sourceFiles
        |> Map.toList
        |> List.choose (fun (rel, bytes) ->
            match Map.tryFind rel targetFiles with
            | Some existing when existing = bytes -> None
            | _ -> Some rel)

    let mutable vendoredSkipped = 0

    let toRemove =
        targetFiles
        |> Map.toList
        |> List.map fst
        |> List.filter (fun rel ->
            if isVendored (targetRel + "/" + rel) vendored then
                vendoredSkipped <- vendoredSkipped + 1
                false
            else
                not (Map.containsKey rel sourceFiles))

    { ToWrite = toWrite
      ToRemove = toRemove
      VendoredSkipped = vendoredSkipped }

let validateVendoredDeclarations
    (declared: Set<string>)
    (ownershipVendored: Set<string>)
    (unmirroredDirectories: Set<string>)
    : Result<unit, string> =
    let disagreement =
        Set.union (Set.difference declared ownershipVendored) (Set.difference ownershipVendored declared)

    if not (Set.isEmpty disagreement) then
        Error(sprintf "ownership and vendored declarations disagree: %s" (String.Join(", ", disagreement)))
    else
        let missing = Set.difference unmirroredDirectories declared
        let typos = Set.difference declared unmirroredDirectories

        if not (Set.isEmpty missing) || not (Set.isEmpty typos) then
            Error(
                sprintf
                    "vendored declarations do not match real unmirrored directories; undeclared=%s missing=%s"
                    (String.Join(", ", missing))
                    (String.Join(", ", typos))
            )
        else
            Ok()

let validateRegistryDrivenScripts (generateScript: string) (validateScript: string) : ValidationCheck =
    let combined = generateScript + "\n" + validateScript

    if
        generateScript.Contains("harness bindings generate", StringComparison.Ordinal)
        && validateScript.Contains("harness bindings validate", StringComparison.Ordinal)
        && not (combined.Contains("--skills", StringComparison.Ordinal))
        && not (combined.Contains("--mirror", StringComparison.Ordinal))
    then
        ValidationCheck.passed "Registry-driven npm scripts" "both scripts delegate without surface-specific flags"
    else
        ValidationCheck.failedMsg
            "Registry-driven npm scripts"
            "generate:bindings and validate:sync must delegate to registry-driven harness commands"

/// Computes one job's pending changes. Both the emitter and the auditor call
/// this, so "what the mirror should contain" is decided exactly once
/// [Repo-grounded — `skills_mirror.rs::job_diff`].
let private jobDiff (job: MirrorJob) : Result<JobDiff, string> =
    let readTree root =
        relativeFiles root
        |> List.fold
            (fun (acc: Result<Map<string, byte[]>, string>) rel ->
                match acc with
                | Error e -> Error e
                | Ok found ->
                    let path = Path.Combine(root, rel)

                    try
                        Ok(Map.add rel (File.ReadAllBytes path) found)
                    with ex ->
                        Error(sprintf "failed to read %s: %s" path ex.Message))
            (Ok Map.empty)

    match readTree job.Source, readTree job.Target with
    | Error e, _
    | _, Error e -> Error e
    | Ok sourceFiles, Ok targetFiles -> Ok(planSkillsMirror job.TargetRel job.Vendored sourceFiles targetFiles)

/// A mirror file that disagrees with the canonical tree
/// [Repo-grounded — `skills_mirror.rs::MirrorDrift`].
type MirrorDrift =
    /// A source skill file with a missing or byte-different mirrored copy.
    | MirrorDriftMissing of string
    /// A mirrored file with neither a source counterpart nor a vendored declaration.
    | MirrorDriftUndeclared of string

/// Reports every mirror file that disagrees with the canonical tree, without
/// modifying anything [Repo-grounded — `skills_mirror.rs::audit_skills_mirrors`].
let auditSkillsMirrors (repoRoot: string) : Result<MirrorDrift list, string> =
    mirrorJobs repoRoot
    |> Result.bind (fun jobs ->
        jobs
        |> List.filter (fun job -> Directory.Exists job.Source)
        |> List.fold
            (fun (acc: Result<MirrorDrift list, string>) job ->
                match acc with
                | Error e -> Error e
                | Ok drifts ->
                    match jobDiff job with
                    | Error e -> Error e
                    | Ok diff ->
                        let rel (p: string) = job.TargetRel + "/" + p

                        let missing = diff.ToWrite |> List.map (rel >> MirrorDriftMissing)
                        let undeclared = diff.ToRemove |> List.map (rel >> MirrorDriftUndeclared)
                        Ok(drifts @ missing @ undeclared))
            (Ok []))

let skillsMirrorAuditCheck (audit: Result<MirrorDrift list, string>) : ValidationCheck =
    match audit with
    | Error message -> ValidationCheck.failedMsg "Skills mirror parity" message
    | Ok [] -> ValidationCheck.passed "Skills mirror parity" "every generated skill mirror matches its canonical source"
    | Ok drifts ->
        let paths =
            drifts
            |> List.map (function
                | MirrorDriftMissing path
                | MirrorDriftUndeclared path -> path)

        ValidationCheck.failedMsg
            "Skills mirror parity"
            (sprintf "generated skill mirror drift: %s" (String.Join(", ", paths)))

/// Walks upward from `dir` removing directories left empty by a deletion,
/// stopping at (and never removing) `stopAt`. A failed removal is
/// deliberately ignored: the only expected cause is a non-empty directory,
/// which is exactly the case where stopping is correct
/// [Repo-grounded — `skills_mirror.rs::prune_empty_dirs`].
let rec private pruneEmptyDirs (dir: string option) (stopAt: string) : unit =
    match dir with
    | None -> ()
    | Some path ->
        let normalized = Path.GetFullPath path
        let normalizedStop = Path.GetFullPath stopAt

        if
            String.Equals(normalized, normalizedStop, StringComparison.Ordinal)
            || not (normalized.StartsWith(normalizedStop, StringComparison.Ordinal))
        then
            ()
        else
            let removed =
                try
                    if Directory.Exists path && Array.isEmpty (Directory.GetFileSystemEntries path) then
                        Directory.Delete path
                        true
                    else
                        false
                with _ ->
                    false

            if removed then
                pruneEmptyDirs (Some(Path.GetDirectoryName path)) stopAt

/// Mirrors every registry-declared skills tree into its harness's skills
/// directory as real files, deleting mirrored files whose source counterpart
/// is gone and leaving every declared vendored directory alone
/// [Repo-grounded — `skills_mirror.rs::emit_skills_mirrors`].
let emitSkillsMirrors (repoRoot: string) (dryRun: bool) : Result<MirrorResult, string> =
    let canonicalRepoRoot = Path.GetFullPath repoRoot

    mirrorJobs repoRoot
    |> Result.bind (fun jobs ->
        jobs
        |> List.fold
            (fun (acc: Result<MirrorResult, string>) job ->
                match acc with
                | Error e -> Error e
                | Ok result ->
                    // Defense in depth alongside `mirrorJobs`'s
                    // `confinedRepoPath` proof: every write and delete stays
                    // inside `repoRoot`, full stop.
                    if
                        not (
                            job.Target.StartsWith(
                                canonicalRepoRoot + Path.DirectorySeparatorChar.ToString(),
                                StringComparison.Ordinal
                            )
                            || String.Equals(job.Target, canonicalRepoRoot, StringComparison.Ordinal)
                        )
                    then
                        Error(sprintf "refusing to write outside the repository: %s" job.Target)
                    elif not (Directory.Exists job.Source) then
                        Ok result
                    else
                        match jobDiff job with
                        | Error e -> Error e
                        | Ok diff ->
                            let updated =
                                { Copied = result.Copied + List.length diff.ToWrite
                                  Removed = result.Removed + List.length diff.ToRemove
                                  VendoredSkipped = result.VendoredSkipped + diff.VendoredSkipped }

                            if dryRun then
                                Ok updated
                            else
                                try
                                    for rel in diff.ToWrite do
                                        let src = Path.Combine(job.Source, rel)
                                        let dst = Path.Combine(job.Target, rel)
                                        Directory.CreateDirectory(Path.GetDirectoryName dst) |> ignore
                                        File.WriteAllBytes(dst, File.ReadAllBytes src)

                                    for rel in diff.ToRemove do
                                        let path = Path.Combine(job.Target, rel)
                                        File.Delete path
                                        pruneEmptyDirs (Some(Path.GetDirectoryName path)) job.Target

                                    Ok updated
                                with ex ->
                                    Error ex.Message)
            (Ok mirrorResultEmpty))

// ---------------------------------------------------------------------------
// Field policy (shared conversion vocabulary)
// ---------------------------------------------------------------------------

/// What happens to a Claude frontmatter field when converting to OpenCode
/// [Repo-grounded — `field_policy.rs::FieldAction`].
type FieldAction =
    | Preserve
    | Translate
    | Drop
    | DropWarn

/// One field's policy entry [Repo-grounded — `field_policy.rs::FieldPolicy`].
type FieldPolicy = { Action: FieldAction; Reason: string }

/// The reason attached to a field absent from the policy table
/// [Repo-grounded — `field_policy.rs::UNKNOWN_FIELD_REASON`].
let unknownFieldReason = "unknown claude code field"

/// A field the walk dropped, carried into a `ConversionWarning`
/// [Repo-grounded — `field_policy.rs::DroppedField`].
type DroppedField = { Field: string; Reason: string }

/// Splits a frontmatter mapping into the fields to apply (`Preserve` /
/// `Translate`) and the fields dropped (unknown, `Drop`, or `DropWarn`)
/// [Repo-grounded — `field_policy.rs::walk_frontmatter_fields`].
let private walkFrontmatterFields
    (mapping: Dictionary<string, obj>)
    (policy: Map<string, FieldPolicy>)
    : (FieldAction * string * obj) list * DroppedField list =
    let mutable applied = []
    let mutable dropped = []

    for kv in mapping do
        match policy.TryFind kv.Key with
        | None ->
            dropped <-
                { Field = kv.Key
                  Reason = unknownFieldReason }
                :: dropped
        | Some entry ->
            match entry.Action with
            | Drop -> ()
            | DropWarn ->
                dropped <-
                    { Field = kv.Key
                      Reason = entry.Reason }
                    :: dropped
            | Preserve
            | Translate -> applied <- (entry.Action, kv.Key, kv.Value) :: applied

    List.rev applied, List.rev dropped

/// Splits a Claude `tools` frontmatter value — either a YAML sequence or a
/// comma-separated string — into individual tool names
/// [Repo-grounded — `frontmatter.rs::parse_claude_tools`].
let parseClaudeTools (value: obj) : string list =
    match value with
    | :? string as s ->
        s.Split(',')
        |> Array.map (fun p -> p.Trim())
        |> Array.filter (fun p -> p <> "")
        |> List.ofArray
    | :? Collections.IEnumerable as items when not (value :? string) ->
        items
        |> Seq.cast<obj>
        |> Seq.choose (function
            | :? string as s -> Some s
            | _ -> None)
        |> List.ofSeq
    | _ -> []

// ---------------------------------------------------------------------------
// OpenCode agent conversion
// ---------------------------------------------------------------------------

/// Where converted agents land, relative to the repo root
/// [Repo-grounded — `converter.rs::OPENCODE_AGENT_DIR`].
let opencodeAgentDir = ".opencode/agents"

/// A frontmatter field dropped for one specific agent, tallied across a
/// whole `sync` run [Repo-grounded — `converter.rs::ConversionWarning`].
type ConversionWarning =
    { AgentName: string
      Field: string
      Reason: string }

/// The OpenCode agent shape emitted to the mirror
/// [Repo-grounded — `converter.rs::OpenCodeAgent`].
type OpenCodeAgent =
    { Description: string
      Model: string
      Permission: Map<string, string>
      Color: string
      Steps: int64
      Skills: string list }

let private openCodeAgentEmpty: OpenCodeAgent =
    { Description = ""
      Model = ""
      Permission = Map.empty
      Color = ""
      Steps = 0L
      Skills = [] }

/// Claude → OpenCode field policy, in Rust declaration order
/// [Repo-grounded — `converter.rs::OPENCODE_FIELD_POLICY_TABLE`].
let private opencodeFieldPolicyTable: (string * FieldAction * string) list =
    [ "name", Drop, "filename carries the agent name"
      "description", Preserve, ""
      "tools", Translate, ""
      "model", Drop, "the opencode registry entry declares no model-map, so the mirror pins no model"
      "color", Translate, ""
      "skills", Preserve, ""
      "maxTurns", Translate, ""
      "disallowedTools", DropWarn, "no OpenCode equivalent"
      "permissionMode", DropWarn, "use the OpenCode permission block instead"
      "effort", DropWarn, "Claude-only field"
      "memory", DropWarn, "Claude-only field"
      "isolation", DropWarn, "Claude-only field"
      "background", DropWarn, "Claude-only field"
      "initialPrompt", DropWarn, "Claude-only field"
      "mcpServers", DropWarn, "OpenCode declares MCP servers at the config level"
      "hooks", DropWarn, "no OpenCode equivalent" ]

let private claudeAgentFieldPolicy: Map<string, FieldPolicy> =
    opencodeFieldPolicyTable
    |> List.map (fun (key, action, reason) -> key, { Action = action; Reason = reason })
    |> Map.ofList

/// Claude agent color name → OpenCode color token
/// [Repo-grounded — `converter.rs::claude_to_opencode_color`].
let private claudeToOpencodeColor: Map<string, string> =
    Map.ofList
        [ "blue", "primary"
          "green", "success"
          "yellow", "warning"
          "purple", "secondary"
          "red", "error"
          "orange", "warning"
          "pink", "accent"
          "cyan", "info" ]

/// Maps a Claude color to its OpenCode token, passing an unrecognized color
/// through unchanged [Repo-grounded — `converter.rs::convert_color`].
let convertColor (color: string) : string =
    if color = "" then
        ""
    else
        claudeToOpencodeColor |> Map.tryFind color |> Option.defaultValue color

/// Lower-cases and dedupes-by-key each tool name into an `"allow"` grant
/// [Repo-grounded — `converter.rs::convert_permission`].
let convertPermission (claudeTools: string list) : Map<string, string> =
    claudeTools
    |> List.map (fun t -> t.Trim().ToLowerInvariant())
    |> List.filter (fun t -> t <> "")
    |> List.map (fun t -> t, "allow")
    |> Map.ofList

/// The source filename's stem, used to label a `ConversionWarning`
/// [Repo-grounded — `converter.rs::agent_name_from_path`].
let private agentNameFromPath (path: string) : string =
    let baseName = Path.GetFileName path

    if baseName.EndsWith(".md", StringComparison.Ordinal) then
        baseName.Substring(0, baseName.Length - 3)
    else
        baseName

/// Matches a markdown link target: `](target)`
/// [Repo-grounded — `converter.rs::agent_link_re`].
let private agentLinkRe: Regex = Regex(@"\]\(([^)]*)\)", RegexOptions.Compiled)

/// Collapses `.`/`..` components out of a `/`-joined relative path, without
/// touching the filesystem [Repo-grounded — `converter.rs::normalize_lexical`].
let private normalizeLexical (path: string) : string =
    let stack = ResizeArray<string>()

    for part in path.Replace('\\', '/').Split('/') do
        if part = ".." then
            if stack.Count > 0 then
                stack.RemoveAt(stack.Count - 1)
        elif part <> "." && part <> "" then
            stack.Add part

    String.Join("/", stack)

/// The `../`-prefixed path from `baseComponents` to `targetComponents`,
/// sharing their longest common prefix [Repo-grounded — `converter.rs::relative_from`].
let private relativeFrom (targetComponents: string[]) (baseComponents: string[]) : string =
    let mutable common = 0

    while (common < targetComponents.Length
           && common < baseComponents.Length
           && targetComponents.[common] = baseComponents.[common]) do
        common <- common + 1

    let ups = Array.create (baseComponents.Length - common) ".."
    let downs = targetComponents.[common..]
    String.Join("/", Array.append ups downs)

/// Rewrites a relative markdown link in `body` so it still resolves once the
/// agent moves from `inputPath` (under `claudeDir`) to `mirrorDir` — absolute,
/// URL, anchor-only, and empty links pass through unchanged
/// [Repo-grounded — `converter.rs::rebase_agent_links`].
let private rebaseAgentLinks (body: string) (inputPath: string) (claudeDir: string) (mirrorDir: string) : string =
    let inputDir =
        match Path.GetDirectoryName inputPath with
        | null
        | "" -> "."
        | d -> d

    let claudeDirNorm = normalizeLexical claudeDir
    let mirrorDirComponents = (normalizeLexical mirrorDir).Split('/')

    agentLinkRe.Replace(
        body,
        fun m ->
            let link = m.Groups.[1].Value

            let passThrough =
                link = ""
                || link.StartsWith("http://", StringComparison.Ordinal)
                || link.StartsWith("https://", StringComparison.Ordinal)
                || link.StartsWith("#", StringComparison.Ordinal)
                || link.StartsWith("/", StringComparison.Ordinal)

            if passThrough then
                sprintf "](%s)" link
            else
                let pathPart, anchor =
                    match link.IndexOf '#' with
                    | -1 -> link, ""
                    | idx -> link.Substring(0, idx), link.Substring(idx)

                if pathPart = "" then
                    sprintf "](%s)" link
                else
                    let resolved = normalizeLexical (inputDir + "/" + pathPart)

                    // A link resolving under `claudeDir` — at any nesting depth,
                    // not just directly inside it — targets another agent
                    // source the mirror also flattens, so it rebases to that
                    // sibling's flattened basename rather than a `../`-climb
                    // back through the (mirror-absent) `.claude/` tree.
                    let newPath =
                        if
                            resolved = claudeDirNorm
                            || resolved.StartsWith(claudeDirNorm + "/", StringComparison.Ordinal)
                        then
                            let rel = resolved.Substring(claudeDirNorm.Length).TrimStart('/')

                            if rel <> "" then
                                rel.Split('/') |> Array.last
                            else
                                relativeFrom (resolved.Split('/')) mirrorDirComponents
                        else
                            relativeFrom (resolved.Split('/')) mirrorDirComponents

                    sprintf "](%s%s)" newPath anchor
    )

/// Applies one `Preserve`/`Translate` field onto an in-progress `OpenCodeAgent`
/// [Repo-grounded — `converter.rs::apply_preserve` and `apply_translate`].
let private applyField (agent: OpenCodeAgent) (action: FieldAction) (key: string) (value: obj) : OpenCodeAgent =
    match action, key with
    | Preserve, "description" ->
        match value with
        | :? string as s -> { agent with Description = s }
        | _ -> agent
    | Preserve, "skills" ->
        match value with
        | :? Collections.IEnumerable as items when not (value :? string) ->
            { agent with
                Skills =
                    items
                    |> Seq.cast<obj>
                    |> Seq.choose (function
                        | :? string as s -> Some s
                        | _ -> None)
                    |> List.ofSeq }
        | _ -> agent
    | Translate, "tools" ->
        { agent with
            Permission = convertPermission (parseClaudeTools value) }
    | Translate, "color" ->
        match value with
        | :? string as s -> { agent with Color = convertColor s }
        | _ -> agent
    | Translate, "maxTurns" ->
        match value with
        | :? int as i -> { agent with Steps = int64 i }
        | :? int64 as i -> { agent with Steps = i }
        | :? float as f -> { agent with Steps = int64 f }
        | :? string as s ->
            match Int64.TryParse s with
            | true, i -> { agent with Steps = i }
            | false, _ -> agent
        | _ -> agent
    | _ -> agent

/// Whether a plain YAML scalar needs quoting under Go-`yaml.v3`'s rules
/// [Repo-grounded — `converter.rs::needs_quoting`].
let private needsQuoting (s: string) : bool =
    if s = "" then
        true
    elif "-?:,[]{}#&*!|>'\"%@`".IndexOf(s.[0]) >= 0 then
        true
    elif
        s.EndsWith(" ", StringComparison.Ordinal)
        || s.EndsWith("\t", StringComparison.Ordinal)
    then
        true
    elif s.Contains(": ") || s.EndsWith(":", StringComparison.Ordinal) then
        true
    elif s.Contains(" #") then
        true
    elif s.Contains("\n") then
        true
    else
        false

/// Emits a scalar, double-quoting and escaping it when required
/// [Repo-grounded — `converter.rs::yaml_string`].
let private yamlString (s: string) : string =
    if needsQuoting s then
        sprintf "\"%s\"" (s.Replace("\\", "\\\\").Replace("\"", "\\\""))
    else
        s

/// Hand-rolled Go-`yaml.v3`-compatible encoder: `description` always emits,
/// `model` emits only when the target harness declared one, `permission`
/// emits `{}` when empty else one entry per line sorted by key, and
/// `color`/`steps`/`skills` are omitted when at their zero value
/// [Repo-grounded — `converter.rs::encode_opencode_agent`].
///
/// An omitted `model` is not a degraded emission. OpenCode resolves the model
/// itself — a primary agent takes the globally configured model, a subagent
/// takes the model of the primary that invoked it — so writing no key is what
/// lets a mirror follow whatever the developer is running.
let private encodeOpenCodeAgent (agent: OpenCodeAgent) : string =
    let lines = ResizeArray<string>()
    lines.Add(sprintf "description: %s" (yamlString agent.Description))

    if agent.Model <> "" then
        lines.Add(sprintf "model: %s" (yamlString agent.Model))

    if Map.isEmpty agent.Permission then
        lines.Add "permission: {}"
    else
        lines.Add "permission:"

        for KeyValue(tool, grant) in agent.Permission do
            lines.Add(sprintf "  %s: %s" tool grant)

    if agent.Color <> "" then
        lines.Add(sprintf "color: %s" (yamlString agent.Color))

    if agent.Steps <> 0L then
        lines.Add(sprintf "steps: %d" agent.Steps)

    if not (List.isEmpty agent.Skills) then
        lines.Add "skills:"

        for skill in agent.Skills do
            lines.Add(sprintf "  - %s" (yamlString skill))

    String.Join("\n", lines) + "\n"

type ConvertedAgentContent =
    { Content: string
      Warnings: ConversionWarning list }

/// Converts one already-read Claude agent document into its OpenCode bytes.
/// The resource adapter owns reading and writing; this function owns field
/// policy, model translation, link rebasing, and emitted content.
let convertAgentContent
    (inputPath: string)
    (claudeDir: string)
    (mirrorDir: string)
    (content: string)
    : Result<ConvertedAgentContent, string> =
    match extractFrontmatter content with
    | Error e -> Error(sprintf "failed to extract frontmatter from %s: %s" inputPath e)
    | Ok(front, body) ->
        match yamlDeserializer.Deserialize<Dictionary<string, obj>>(front) with
        | null -> Error(sprintf "frontmatter is not a mapping in %s" inputPath)
        | mapping ->
            let agentName = agentNameFromPath inputPath
            let applied, dropped = walkFrontmatterFields mapping claudeAgentFieldPolicy

            let converted =
                applied
                |> List.fold (fun acc (action, key, value) -> applyField acc action key value) openCodeAgentEmpty

            let warnings =
                dropped
                |> List.map (fun d ->
                    { AgentName = agentName
                      Field = d.Field
                      Reason = d.Reason })

            let rebasedBody = rebaseAgentLinks body inputPath claudeDir mirrorDir

            Ok
                { Content = "---\n" + encodeOpenCodeAgent converted + "---\n" + rebasedBody
                  Warnings = warnings }

/// Converts one Claude agent file into its OpenCode mirror, writing it unless
/// `dryRun` [Repo-grounded — `converter.rs::convert_agent`].
let private convertAgent
    (inputPath: string)
    (outputPath: string)
    (claudeDir: string)
    (dryRun: bool)
    : Result<ConversionWarning list, string> =
    try
        let content = File.ReadAllText inputPath

        let mirrorDir =
            match Path.GetDirectoryName outputPath with
            | null
            | "" -> "."
            | d -> d

        convertAgentContent inputPath claudeDir mirrorDir content
        |> Result.map (fun converted ->
            if not dryRun then
                Directory.CreateDirectory mirrorDir |> ignore
                File.WriteAllText(outputPath, converted.Content)

            converted.Warnings)
    with ex ->
        Error(sprintf "failed to convert %s: %s" inputPath ex.Message)

/// A tallied run of `convertAgent` over every discovered source
/// [Repo-grounded — `converter.rs::ConvertAllResult`].
type ConvertAllResult =
    { Converted: int
      Failed: int
      FailedFiles: string list
      Warnings: ConversionWarning list }

let private convertAllResultEmpty: ConvertAllResult =
    { Converted = 0
      Failed = 0
      FailedFiles = []
      Warnings = [] }

/// Discovers every mirrorable Claude agent source under `repoRoot` and
/// converts each one to its flat `.opencode/agents/` mirror
/// [Repo-grounded — `converter.rs::convert_all_agents`].
let convertAllAgents (repoRoot: string) (dryRun: bool) : Result<ConvertAllResult, string> =
    let claudeDir = Path.Combine(repoRoot, ".claude", "agents")
    let opencodeDir = Path.Combine(repoRoot, opencodeAgentDir)

    discoverAgentSources claudeDir
    |> Result.map (fun sources ->
        sources
        |> List.fold
            (fun acc (input, name) ->
                let filename = name + ".md"
                let output = Path.Combine(opencodeDir, filename)

                match convertAgent input output claudeDir dryRun with
                | Ok warnings ->
                    { acc with
                        Converted = acc.Converted + 1
                        Warnings = acc.Warnings @ warnings }
                | Error _ ->
                    { acc with
                        Failed = acc.Failed + 1
                        FailedFiles = acc.FailedFiles @ [ filename ] })
            convertAllResultEmpty)

// ---------------------------------------------------------------------------
// Codex agent conversion
// ---------------------------------------------------------------------------

/// Relative path of the Codex configuration file, part of which this emitter
/// owns (see [`rewriteGeneratedRegion`])
/// [Repo-grounded — `codex.rs::CODEX_CONFIG_FILE`].
let codexConfigFile = ".codex/config.toml"

/// Opening delimiter of the region of [`codexConfigFile`] this emitter owns
/// [Repo-grounded — `codex.rs::GENERATED_REGION_START`].
let generatedRegionStart =
    "# >>> rhino-cli generated: codex agents - do not edit inside this region"

/// Closing delimiter of the generated region.
///
/// **Marker-first hazard**: [`rewriteGeneratedRegion`] looks for THIS marker
/// before it looks for any insertion anchor. An anchor-first implementation
/// finds the anchor on every run and appends a fresh region each time, so the
/// file grows a duplicate block per invocation and the idempotence gate fails
/// [Repo-grounded — `codex.rs::GENERATED_REGION_END`].
let generatedRegionEnd = "# <<< rhino-cli generated: codex agents"

/// Codex agent emit shape: `name`, `description`, `model`,
/// `model_reasoning_effort`, `developer_instructions`. `Model` and
/// `ModelReasoningEffort` are empty when the Claude source declares a tier
/// Codex has no counterpart for; the encoder then omits the key so Codex falls
/// back to its own default [Repo-grounded — `codex.rs::CodexAgent`].
type CodexAgent =
    { Name: string
      Description: string
      Model: string
      ModelReasoningEffort: string
      DeveloperInstructions: string }

let private codexAgentEmpty: CodexAgent =
    { Name = ""
      Description = ""
      Model = ""
      ModelReasoningEffort = ""
      DeveloperInstructions = "" }

/// One generated agent as the `.codex/config.toml` region needs it
/// [Repo-grounded — `codex.rs::EmittedCodexAgent`].
type EmittedCodexAgent = { Name: string; Description: string }

/// Everything one Codex emit run produced
/// [Repo-grounded — `codex.rs::CodexEmitResult`].
type CodexEmitResult =
    { Result: ConvertAllResult
      Agents: EmittedCodexAgent list }

let private codexEmitResultEmpty: CodexEmitResult =
    { Result = convertAllResultEmpty
      Agents = [] }

/// Escapes `s` for a TOML basic string (the `"…"` single-line form)
/// [Repo-grounded — `codex.rs::escape_toml_basic`].
let private escapeTomlBasic (s: string) : string =
    let out = StringBuilder(s.Length)

    for ch in s do
        match ch with
        | '\\' -> out.Append "\\\\" |> ignore
        | '"' -> out.Append "\\\"" |> ignore
        | '\n' -> out.Append "\\n" |> ignore
        | '\r' -> out.Append "\\r" |> ignore
        | '\t' -> out.Append "\\t" |> ignore
        | c when int c < 0x20 || int c = 0x7f -> out.Append(sprintf "\\u%04X" (int c)) |> ignore
        | c -> out.Append c |> ignore

    out.ToString()

/// Escapes `s` for a TOML multi-line basic string (the `"""…"""` form).
///
/// Every `"` is escaped rather than only runs of three, which keeps the
/// encoder from having to reason about where a run lands relative to the
/// closing delimiter — a `"""` sequence adjacent to the terminator would
/// otherwise end the string early [Repo-grounded — `codex.rs::escape_toml_multiline`].
let private escapeTomlMultiline (s: string) : string =
    let out = StringBuilder(s.Length)

    for ch in s do
        match ch with
        | '\\' -> out.Append "\\\\" |> ignore
        | '"' -> out.Append "\\\"" |> ignore
        | '\r' -> out.Append "\\r" |> ignore
        | '\n'
        | '\t' -> out.Append ch |> ignore
        | c when int c < 0x20 || int c = 0x7f -> out.Append(sprintf "\\u%04X" (int c)) |> ignore
        | c -> out.Append c |> ignore

    out.ToString()

/// Renders a [`CodexAgent`] as the bytes of a standalone `.codex/agents/*.toml`
/// file, emitting `name`, `description`, `model`, `model_reasoning_effort`,
/// `developer_instructions` in that fixed order. An empty `Model` or
/// `ModelReasoningEffort` omits its key entirely rather than emitting `""`,
/// which Codex would reject as an unknown model or effort level
/// [Repo-grounded — `codex.rs::encode_codex_agent`].
let encodeCodexAgent (agent: CodexAgent) : string =
    let lines = ResizeArray<string>()
    lines.Add(sprintf "name = \"%s\"" (escapeTomlBasic agent.Name))
    lines.Add(sprintf "description = \"%s\"" (escapeTomlBasic agent.Description))

    if agent.Model <> "" then
        lines.Add(sprintf "model = \"%s\"" (escapeTomlBasic agent.Model))

    if agent.ModelReasoningEffort <> "" then
        lines.Add(sprintf "model_reasoning_effort = \"%s\"" (escapeTomlBasic agent.ModelReasoningEffort))

    lines.Add(sprintf "developer_instructions = \"\"\"\n%s\"\"\"" (escapeTomlMultiline agent.DeveloperInstructions))

    String.Join("\n", lines) + "\n"

/// A short, stable name for `value`'s deserialized YAML kind, for a warning
/// message [Repo-grounded — `codex.rs::value_kind`].
let private describeYamlValueKind (value: obj) : string =
    match value with
    | null -> "null"
    | :? bool -> "a boolean"
    | :? string -> "a string"
    | :? int
    | :? int64
    | :? float
    | :? decimal -> "a number"
    | :? Collections.IDictionary -> "a mapping"
    | :? Collections.IEnumerable -> "a sequence"
    | _ -> "a tagged value"

/// Maps a Claude model alias onto the Codex model ID at the same grade of the
/// four-grade tier vocabulary. The pairing follows each vendor's own published
/// positioning of its lineup rather than a benchmark ranking.
///
/// The capability-grade translation resolved from `repo-config.yml`.
///
/// The grade is the pivot rather than the Claude alias: an agent declares a
/// `model:` alias, the `claude-code` entry's `model-map:` resolves it to a
/// grade, and each other harness realizes that grade through its own
/// `model-map:`. A harness that declares no map yields an empty
/// [`ModelOfGrade`], which is how "emit no model key at all" is expressed as
/// data instead of as a branch in the emitter.
type GradeMaps =
    {
        /// Claude `model:` alias -> capability grade
        GradeOfAlias: Map<string, string>
        /// Capability grade -> the reasoning effort its agents declare
        EffortOfGrade: Map<string, string>
        /// Capability grade -> the target harness's model identifier
        ModelOfGrade: Map<string, string>
    }

let emptyGradeMaps: GradeMaps =
    { GradeOfAlias = Map.empty
      EffortOfGrade = Map.empty
      ModelOfGrade = Map.empty }

let private harnessModelMap (config: RepoConfig.RepoConfig) (harnessName: string) : Map<string, string> =
    config.Harness
    |> List.tryFind (fun entry -> entry.Name = harnessName)
    |> Option.map (fun entry -> entry.ModelMap)
    |> Option.defaultValue Map.empty

/// Builds the translation targeting `harnessName`. The `claude-code` entry is
/// always the source of the alias vocabulary, whatever the target.
let gradeMapsFor (config: RepoConfig.RepoConfig) (harnessName: string) : GradeMaps =
    { GradeOfAlias =
        harnessModelMap config "claude-code"
        |> Map.toList
        |> List.map (fun (grade, alias) -> alias, grade)
        |> Map.ofList
      EffortOfGrade = config.ModelGrades
      ModelOfGrade = harnessModelMap config harnessName }

let loadGradeMaps (repoRoot: string) (harnessName: string) : GradeMaps =
    gradeMapsFor (RepoConfig.loadOrDefault repoRoot) harnessName

/// Returns `""` for a tier with no Codex counterpart — an empty alias,
/// `inherit`, a pinned `claude-*` ID, or a grade the target harness declares
/// no model for. The encoder then omits the `model` key and the harness
/// applies its own default, which is the honest outcome: there is no Codex
/// model that means "whatever the caller is running".
let convertCodexModel (maps: GradeMaps) (claudeModel: string) : string =
    maps.GradeOfAlias
    |> Map.tryFind claudeModel
    |> Option.bind (fun grade -> Map.tryFind grade maps.ModelOfGrade)
    |> Option.defaultValue ""

/// Maps a Claude `effort` level onto Codex's `model_reasoning_effort`.
///
/// Codex accepts `minimal|low|medium|high|xhigh`; Claude accepts
/// `low|medium|high|xhigh|max`. The overlap passes straight through and
/// Claude's `max` saturates at Codex's `xhigh` ceiling. Anything else returns
/// `""` so the encoder omits the key.
let convertCodexEffort (claudeEffort: string) : string =
    match claudeEffort with
    | "low"
    | "medium"
    | "high"
    | "xhigh" -> claudeEffort
    | "max" -> "xhigh"
    | _ -> ""

/// Copies a `description` frontmatter value into the Codex output. `name` is
/// already resolved from the discovery walk, so a frontmatter `name` copy is
/// ignored to keep one source of identity.
///
/// Returns `Some((field, reason))` when `description` is present but not a
/// string: every OTHER dropped field surfaces a `ConversionWarning` through
/// `DropWarn`; `description` is `Preserve`-class and would otherwise fall
/// through to an empty string with no signal at all
/// [Repo-grounded — `codex.rs::apply_preserve`].
let private applyCodexPreserve (agent: CodexAgent) (key: string) (value: obj) : CodexAgent * (string * string) option =
    if key = "description" then
        match value with
        | :? string as s -> { agent with Description = s }, None
        | _ ->
            agent,
            Some(
                key,
                sprintf
                    "description must be a string; got %s — left empty rather than silently coerced"
                    (describeYamlValueKind value)
            )
    else
        agent, None

/// Applies one `Translate` field onto an in-progress [`CodexAgent`].
///
/// Returns `Some((field, reason))` when the value is present and non-empty but
/// has no Codex counterpart, so a tier that silently vanished from the mirror
/// still surfaces a `ConversionWarning` — the same signal `DropWarn` gave
/// before these two fields became translatable.
let private applyCodexTranslate
    (maps: GradeMaps)
    (agent: CodexAgent)
    (key: string)
    (value: obj)
    : CodexAgent * (string * string) option =
    let asString =
        match value with
        | :? string as s -> s.Trim()
        | _ -> ""

    match key with
    | "model" ->
        let mapped = convertCodexModel maps asString

        if mapped <> "" then
            { agent with Model = mapped }, None
        elif asString = "" || asString = "inherit" then
            agent, None
        else
            agent, Some(key, sprintf "no codex counterpart for model %s; codex applies its own default" asString)
    | "effort" ->
        let mapped = convertCodexEffort asString

        if mapped <> "" then
            { agent with
                ModelReasoningEffort = mapped },
            None
        elif asString = "" then
            agent, None
        else
            agent, Some(key, sprintf "no codex counterpart for effort %s; codex applies its own default" asString)
    | _ -> agent, None

/// Codex field policy: `name`/`description` are preserved, `model`/`effort`
/// are translated onto their Codex counterparts, and everything else is
/// dropped — most with a conversion warning explaining why it has no Codex
/// counterpart [Repo-grounded — `codex.rs::CODEX_FIELD_POLICY_TABLE`].
let private codexFieldPolicyTable: (string * FieldAction * string) list =
    [ "name", Preserve, ""
      "description", Preserve, ""
      "model", Translate, ""
      "color", DropWarn, "codex agent files declare no color"
      "tools", DropWarn, "codex governs tool access through sandbox and approval policy, not per agent"
      "skills", DropWarn, "codex discovers skills from .agents/skills, not from an agent file"
      "maxTurns", DropWarn, "no codex equivalent"
      "disallowedTools", DropWarn, "no codex equivalent"
      "permissionMode", DropWarn, "codex declares sandbox_mode at config level"
      "effort", Translate, ""
      "memory", DropWarn, "claude-only"
      "isolation", DropWarn, "claude-only"
      "background", DropWarn, "claude-only"
      "initialPrompt", DropWarn, "claude-only"
      "mcpServers", DropWarn, "codex declares mcp_servers at config level"
      "hooks", DropWarn, "no codex equivalent" ]

let private codexAgentFieldPolicy: Map<string, FieldPolicy> =
    codexFieldPolicyTable
    |> List.map (fun (key, action, reason) -> key, { Action = action; Reason = reason })
    |> Map.ofList

/// Shared body of the Codex render and write paths: parses `inputPath`'s
/// frontmatter, applies the Codex field policy, and rebases relative links in
/// the body from `claudeDir` to `mirrorDir`
/// [Repo-grounded — `codex.rs::convert_codex_agent_inner`].
let convertCodexAgentContent
    (maps: GradeMaps)
    (inputPath: string)
    (agentName: string)
    (claudeDir: string)
    (mirrorDir: string)
    (content: string)
    : Result<CodexAgent * string * ConversionWarning list, string> =
    try
        match extractFrontmatter content with
        | Error e -> Error(sprintf "failed to extract frontmatter: %s" e)
        | Ok(front, body) ->
            match yamlDeserializer.Deserialize<Dictionary<string, obj>>(front) with
            | null -> Error "frontmatter is not a mapping"
            | mapping ->
                let applied, dropped = walkFrontmatterFields mapping codexAgentFieldPolicy

                let mutable out =
                    { codexAgentEmpty with
                        Name = agentName }

                let preserveFindings = ResizeArray<string * string>()

                for action, key, value in applied do
                    match action with
                    | Preserve ->
                        let next, finding = applyCodexPreserve out key value
                        out <- next
                        finding |> Option.iter preserveFindings.Add
                    | Translate ->
                        let next, finding = applyCodexTranslate maps out key value
                        out <- next
                        finding |> Option.iter preserveFindings.Add
                    | _ -> ()

                let warnings =
                    [ for d in dropped ->
                          { AgentName = agentName
                            Field = d.Field
                            Reason = d.Reason }
                      for field, reason in preserveFindings ->
                          { AgentName = agentName
                            Field = field
                            Reason = reason } ]

                let rebasedBody = rebaseAgentLinks body inputPath claudeDir mirrorDir

                let converted =
                    { out with
                        DeveloperInstructions = rebasedBody }

                Ok(converted, encodeCodexAgent converted, warnings)
    with ex ->
        Error(sprintf "failed to convert %s: %s" inputPath ex.Message)

let private convertCodexAgentInner
    (maps: GradeMaps)
    (inputPath: string)
    (agentName: string)
    (claudeDir: string)
    (mirrorDir: string)
    : Result<CodexAgent * string * ConversionWarning list, string> =
    try
        convertCodexAgentContent maps inputPath agentName claudeDir mirrorDir (File.ReadAllText inputPath)
    with ex ->
        Error(sprintf "failed to convert %s: %s" inputPath ex.Message)

/// Converts a single Claude agent file to Codex format and writes it to
/// `outputPath` unless `dryRun`
/// [Repo-grounded — `codex.rs::convert_codex_agent`].
///
/// The write is guarded by its own `try`/`with`, matching [`convertAgent`]'s
/// OpenCode counterpart: without it, a write failure (e.g. an unwritable
/// `.codex/agents/`) raised an unhandled exception straight through
/// [`convertAllCodexAgents`] instead of the per-file `Failed`/`FailedFiles`
/// accounting every other conversion failure gets.
let convertCodexAgent
    (maps: GradeMaps)
    (inputPath: string)
    (outputPath: string)
    (agentName: string)
    (claudeDir: string)
    (dryRun: bool)
    : Result<EmittedCodexAgent * ConversionWarning list, string> =
    let mirrorDir =
        match Path.GetDirectoryName outputPath with
        | null
        | "" -> "."
        | d -> d

    convertCodexAgentInner maps inputPath agentName claudeDir mirrorDir
    |> Result.bind (fun (agent, output, warnings) ->
        try
            if not dryRun then
                Directory.CreateDirectory mirrorDir |> ignore
                File.WriteAllText(outputPath, output)

            Ok(
                { Name = agent.Name
                  Description = agent.Description },
                warnings
            )
        with ex ->
            Error(sprintf "failed to write %s: %s" outputPath ex.Message))

/// Converts every `.claude/agents/` agent into `.codex/agents/<name>.toml`
/// [Repo-grounded — `codex.rs::convert_all_codex_agents`].
let convertAllCodexAgents (repoRoot: string) (dryRun: bool) : Result<CodexEmitResult, string> =
    let claudeDir = Path.Combine(repoRoot, ".claude", "agents")
    let codexDir = Path.Combine(repoRoot, codexAgentDir)
    let maps = loadGradeMaps repoRoot "codex"

    discoverAgentSources claudeDir
    |> Result.map (fun sources ->
        sources
        |> List.fold
            (fun acc (input, name) ->
                let filename = name + "." + codexAgentExtension
                let output = Path.Combine(codexDir, filename)

                match convertCodexAgent maps input output name claudeDir dryRun with
                | Ok(agent, warnings) ->
                    { acc with
                        Result =
                            { acc.Result with
                                Converted = acc.Result.Converted + 1
                                Warnings = acc.Result.Warnings @ warnings }
                        Agents = acc.Agents @ [ agent ] }
                | Error _ ->
                    { acc with
                        Result =
                            { acc.Result with
                                Failed = acc.Result.Failed + 1
                                FailedFiles = acc.Result.FailedFiles @ [ filename ] } })
            codexEmitResultEmpty)

/// Renders the generated region of [`codexConfigFile`]: one `[agents.<name>]`
/// table per emitted agent, between the two markers. The returned text
/// carries no trailing newline — [`rewriteGeneratedRegion`] owns the
/// surrounding whitespace so a rewrite is byte-stable
/// [Repo-grounded — `codex.rs::render_generated_region`].
let renderGeneratedRegion (agents: EmittedCodexAgent list) : string =
    let out = StringBuilder(generatedRegionStart)

    for agent in agents do
        out
            .Append("\n\n[agents.")
            .Append(agent.Name)
            .Append("]\ndescription = \"")
            .Append(escapeTomlBasic agent.Description)
            .Append("\"\nconfig_file = \"agents/")
            .Append(agent.Name)
            .Append(".")
            .Append(codexAgentExtension)
            .Append("\"")
        |> ignore

    out.Append("\n").Append(generatedRegionEnd) |> ignore
    out.ToString()

/// Replaces the generated region of `existing` with `region`, or appends it
/// when no region is present yet.
///
/// **Marker-first**: the already-present [`generatedRegionEnd`] marker is
/// searched for BEFORE the append anchor. Checking the anchor first would
/// match on every run and append a duplicate region each time — the
/// re-runnable substitution hazard this repository has hit before
/// [Repo-grounded — `codex.rs::rewrite_generated_region`].
let rewriteGeneratedRegion (existing: string) (region: string) : string =
    match existing.IndexOf(generatedRegionEnd, StringComparison.Ordinal) with
    | -1 ->
        if existing = "" then
            region + "\n"
        else
            let out = StringBuilder(existing)

            if not (existing.EndsWith("\n", StringComparison.Ordinal)) then
                out.Append("\n") |> ignore

            out.Append("\n").Append(region).Append("\n") |> ignore
            out.ToString()
    | endAt ->
        let startAt =
            match existing.IndexOf(generatedRegionStart, StringComparison.Ordinal) with
            | -1 -> endAt
            | idx -> idx

        let head = existing.Substring(0, startAt)
        let tailStart = endAt + generatedRegionEnd.Length
        let tail = existing.Substring(tailStart)
        head + region + tail

/// Emits every Codex binding: the standalone agent files and the generated
/// region of `.codex/config.toml`
/// [Repo-grounded — `codex.rs::emit_codex_bindings`].
///
/// The `.codex/config.toml` read/write is guarded by its own `try`/`with`,
/// matching [`convertAgent`]'s and [`convertCodexAgent`]'s write paths:
/// without it, an unwritable `.codex/` (e.g. blocked by a same-named file, or
/// a read-only config file) raised an unhandled exception straight through
/// this function instead of a graceful `Error`, even though every per-agent
/// write failure right above it already degrades gracefully.
let emitCodexBindings (repoRoot: string) (dryRun: bool) : Result<CodexEmitResult, string> =
    convertAllCodexAgents repoRoot dryRun
    |> Result.bind (fun emitted ->
        if not dryRun then
            try
                let configPath = Path.Combine(repoRoot, codexConfigFile)

                let existing =
                    if File.Exists configPath then
                        File.ReadAllText configPath
                    else
                        ""

                let updated = rewriteGeneratedRegion existing (renderGeneratedRegion emitted.Agents)

                if updated <> existing then
                    let configDir =
                        match Path.GetDirectoryName configPath with
                        | null
                        | "" -> "."
                        | d -> d

                    Directory.CreateDirectory configDir |> ignore
                    File.WriteAllText(configPath, updated)

                Ok emitted
            with ex ->
                Error(sprintf "failed to write %s: %s" codexConfigFile ex.Message)
        else
            Ok emitted)

// ---------------------------------------------------------------------------
// Sync (agents leg)
// ---------------------------------------------------------------------------

/// `rhino-cli harness sync` inputs [Repo-grounded — `sync.rs::SyncOptions`].
type SyncOptions =
    { RepoRoot: string
      DryRun: bool
      AgentsOnly: bool
      SkillsOnly: bool }

/// Defaults matching Rust's `SyncOptions::new` — every flag off
/// [Repo-grounded — `sync.rs::SyncOptions::new`].
let syncOptionsDefault (repoRoot: string) : SyncOptions =
    { RepoRoot = repoRoot
      DryRun = false
      AgentsOnly = false
      SkillsOnly = false }

/// `rhino-cli harness sync` outcome. `skills_copied`/`skills_failed` are
/// dropped: Rust's `SyncResult` carries them but they are permanently zero —
/// skills were never synced by this command, only agents
/// [Repo-grounded — `sync.rs::SyncResult`].
type SyncResult =
    { AgentsConverted: int
      AgentsFailed: int
      FailedFiles: string list
      Warnings: ConversionWarning list }

let syncResultEmpty: SyncResult =
    { AgentsConverted = 0
      AgentsFailed = 0
      FailedFiles = []
      Warnings = [] }

/// Runs the agents leg of a sync, unless `SkillsOnly` short-circuits it to a
/// no-op [Repo-grounded — `sync.rs::sync_all`].
let syncAll (opts: SyncOptions) : Result<SyncResult, string> =
    if opts.SkillsOnly then
        Ok syncResultEmpty
    else
        convertAllAgents opts.RepoRoot opts.DryRun
        |> Result.map (fun r ->
            { AgentsConverted = r.Converted
              AgentsFailed = r.Failed
              FailedFiles = r.FailedFiles
              Warnings = r.Warnings })

// ---------------------------------------------------------------------------
// Sync validation (scoped)
// ---------------------------------------------------------------------------
//
// Scope note: Rust's `validate_sync` tallies five check families. This module
// ports the two the three `@agents-validate-sync` scenarios exercise —
// `validate_agent_count` and `validate_agent_equivalence` — and omits
// `validate_no_stale_agent_dir`, `validate_no_synced_skills`, and
// `validate_skills_mirror`, none of which any landed scenario reaches.

let private countMarkdownFiles (dir: string) : int =
    if not (Directory.Exists dir) then
        0
    else
        Directory.GetFiles dir
        |> Array.filter (fun p -> isMirrorableAgentFilename (Path.GetFileName p) false)
        |> Array.length

let private countClaudeAgentSources (claudeDir: string) : int =
    match discoverAgentSources claudeDir with
    | Ok sources -> List.length sources
    | Error _ -> 0

/// Passes when the OpenCode mirror has at least as many agent files as
/// Claude has agent sources [Repo-grounded — `sync_validator.rs::validate_agent_count`].
let validateAgentCountValues (claudeCount: int) (opencodeCount: int) : ValidationCheck =
    if opencodeCount >= claudeCount then
        { ValidationCheck.passed "Agent Count" "OpenCode agents directory contains every Claude agent" with
            Expected = sprintf ">= %d agents" claudeCount
            Actual = sprintf "%d agents" opencodeCount }
    else
        ValidationCheck.failed
            "Agent Count"
            (sprintf ">= %d agents" claudeCount)
            (sprintf "%d agents" opencodeCount)
            "OpenCode agents directory missing one or more Claude agents"

let private validateAgentCount (repoRoot: string) : ValidationCheck =
    let claudeDir = Path.Combine(repoRoot, ".claude", "agents")
    let opencodeDir = Path.Combine(repoRoot, opencodeAgentDir)
    let claudeCount = countClaudeAgentSources claudeDir
    let opencodeCount = countMarkdownFiles opencodeDir

    validateAgentCountValues claudeCount opencodeCount

let private parseOpencodePermission (value: obj option) : Map<string, string> =
    match value with
    | Some(:? IDictionary<obj, obj> as m) ->
        m
        |> Seq.choose (fun kv ->
            match kv.Key, kv.Value with
            | (:? string as k), (:? string as v) -> Some(k, v)
            | _ -> None)
        |> Map.ofSeq
    | _ -> Map.empty

let private parseStringSeq (value: obj option) : string list =
    match value with
    | Some(:? Collections.IEnumerable as items) when not (value.Value :? string) ->
        items
        |> Seq.cast<obj>
        |> Seq.choose (function
            | :? string as s -> Some s
            | _ -> None)
        |> List.ofSeq
    | _ -> []

let private tryGetField (mapping: Dictionary<string, obj>) (key: string) : obj option =
    match mapping.TryGetValue key with
    | true, v -> Some v
    | _ -> None

/// Compares the source Claude agent's frontmatter/body against its OpenCode
/// mirror field by field, returning the first mismatch or a pass
/// [Repo-grounded — `sync_validator.rs::validate_agent_yaml`].
let validateAgentYaml
    (agentName: string)
    (claudeMapping: Dictionary<string, obj>)
    (opencodeMapping: Dictionary<string, obj>)
    (expectedBody: string)
    (actualBody: string)
    (bodyMismatchReason: string)
    : ValidationCheck =
    let checkName = sprintf "Agent: %s" agentName

    let claudeDescription =
        match tryGetField claudeMapping "description" with
        | Some(:? string as s) -> s
        | _ -> ""

    let opencodeDescription =
        match tryGetField opencodeMapping "description" with
        | Some(:? string as s) -> s
        | _ -> ""

    if claudeDescription <> opencodeDescription then
        ValidationCheck.failed checkName claudeDescription opencodeDescription "description mismatch"
    else
        // The opencode registry entry declares no `model-map:`, so the mirror
        // must pin no model and let OpenCode resolve one. Asserting the
        // absence is what makes that enforceable: a hand-edited mirror that
        // re-adds a `model:` key is caught here rather than silently
        // overriding the developer's active model.
        let actualModel =
            match tryGetField opencodeMapping "model" with
            | Some(:? string as s) -> s
            | _ -> ""

        if actualModel <> "" then
            ValidationCheck.failed checkName "no model key" actualModel "opencode mirrors pin no model"
        else
            let expectedPermission =
                tryGetField claudeMapping "tools"
                |> Option.map parseClaudeTools
                |> Option.defaultValue []
                |> convertPermission

            let actualPermission =
                parseOpencodePermission (tryGetField opencodeMapping "permission")

            if expectedPermission <> actualPermission then
                ValidationCheck.failed
                    checkName
                    (sprintf "%A" (Map.toList expectedPermission))
                    (sprintf "%A" (Map.toList actualPermission))
                    "permission mismatch"
            else
                let expectedSkills = parseStringSeq (tryGetField claudeMapping "skills")
                let actualSkills = parseStringSeq (tryGetField opencodeMapping "skills")

                if expectedSkills <> actualSkills then
                    ValidationCheck.failed
                        checkName
                        (sprintf "%A" expectedSkills)
                        (sprintf "%A" actualSkills)
                        "skills mismatch"
                elif expectedBody <> actualBody then
                    ValidationCheck.failed checkName expectedBody actualBody bodyMismatchReason
                else
                    ValidationCheck.passed checkName "Agent is semantically equivalent"

/// Reads one Claude agent source and its OpenCode mirror, rebases the
/// Claude body the same way `convertAgent` would, and delegates the field
/// comparison to `validateAgentYaml`
/// [Repo-grounded — `sync_validator.rs::validate_agent_file`].
let private validateAgentFile
    (repoRoot: string)
    (claudeDir: string)
    (opencodeDir: string)
    (sourcePath: string)
    (agentName: string)
    : ValidationCheck =
    let checkName = sprintf "Agent: %s" agentName
    let mirrorPath = Path.Combine(opencodeDir, agentName + ".md")
    let mirrorRel = sprintf "%s/%s.md" opencodeAgentDir agentName

    try
        let claudeContent = File.ReadAllText sourcePath

        if not (File.Exists mirrorPath) then
            ValidationCheck.failedMsg checkName (sprintf "OpenCode mirror not found: %s" mirrorPath)
        else
            let opencodeContent = File.ReadAllText mirrorPath

            match extractFrontmatter claudeContent, extractFrontmatter opencodeContent with
            | Error e, _ -> ValidationCheck.failedMsg checkName (sprintf "failed to parse Claude frontmatter: %s" e)
            | _, Error e -> ValidationCheck.failedMsg checkName (sprintf "failed to parse OpenCode frontmatter: %s" e)
            | Ok(claudeFront, claudeBody), Ok(_, opencodeBody) ->
                match
                    yamlDeserializer.Deserialize<Dictionary<string, obj>> claudeFront,
                    yamlDeserializer.Deserialize<Dictionary<string, obj>>(
                        (extractFrontmatter opencodeContent |> Result.map fst |> Result.defaultValue "")
                    )
                with
                | null, _
                | _, null -> ValidationCheck.failedMsg checkName "frontmatter is not a mapping"
                | claudeMapping, opencodeMapping ->
                    let expectedBody = rebaseAgentLinks claudeBody sourcePath claudeDir opencodeDir
                    let bodyMismatchReason = driftRemediation repoRoot mirrorRel

                    validateAgentYaml
                        agentName
                        claudeMapping
                        opencodeMapping
                        expectedBody
                        opencodeBody
                        bodyMismatchReason
    with ex ->
        ValidationCheck.failedMsg checkName (sprintf "failed to compare %s: %s" agentName ex.Message)

/// Walks every discovered Claude agent source and validates it against its
/// mirror [Repo-grounded — `sync_validator.rs::validate_agent_equivalence`].
let private validateAgentEquivalence (repoRoot: string) : ValidationCheck list =
    let claudeDir = Path.Combine(repoRoot, ".claude", "agents")
    let opencodeDir = Path.Combine(repoRoot, opencodeAgentDir)

    match discoverAgentSources claudeDir with
    | Error e ->
        [ ValidationCheck.failedMsg "Agent Equivalence" (sprintf "Failed to read Claude agents directory: %s" e) ]
    | Ok sources ->
        sources
        |> List.map (fun (path, name) -> validateAgentFile repoRoot claudeDir opencodeDir path name)

/// Rejects the legacy singular `.opencode/agent` path; the canonical OpenCode
/// location is `.opencode/agents/`
/// [Repo-grounded — `sync_validator.rs::validate_no_stale_agent_dir`].
let private validateNoStaleAgentDir (repoRoot: string) : ValidationCheck =
    let stale = Path.Combine(repoRoot, ".opencode", "agent")

    if Directory.Exists stale then
        ValidationCheck.failed
            "No Stale Agent Directory"
            ".opencode/agent does not exist"
            ".opencode/agent exists as a directory"
            "Stale singular .opencode/agent reappeared; canonical OpenCode path is .opencode/agents/ (plural). Remove the stale directory."
    elif File.Exists stale then
        ValidationCheck.failed
            "No Stale Agent Directory"
            ".opencode/agent does not exist"
            ".opencode/agent exists"
            "Stale .opencode/agent entry reappeared; canonical OpenCode path is .opencode/agents/ (plural). Remove the stale entry."
    else
        ValidationCheck.passed "No Stale Agent Directory" "Legacy singular .opencode/agent does not exist"

/// Rejects `.opencode/skill(s)/<name>/SKILL.md` copies of a `.claude/skills`
/// entry: OpenCode reads the source natively
/// [Repo-grounded — `sync_validator.rs::validate_no_synced_skills`].
///
/// Wrapped in its own `try`/`with`, matching every other check in this
/// module: without it, an unreadable `.claude/skills` (or `.opencode/skill(s)`)
/// raised an unhandled exception straight through `validateSync` instead of
/// reporting one failed check.
let private validateNoSyncedSkills (repoRoot: string) : ValidationCheck =
    let checkName = "No Synced Skill Mirror"
    let claudeDir = Path.Combine(repoRoot, ".claude", "skills")

    try
        let claudeNames =
            if Directory.Exists claudeDir then
                Directory.GetDirectories claudeDir
                |> Array.filter (fun d -> File.Exists(Path.Combine(d, "SKILL.md")))
                |> Array.map Path.GetFileName
                |> Set.ofArray
            else
                Set.empty

        let offenders =
            [ Path.Combine(repoRoot, ".opencode", "skill")
              Path.Combine(repoRoot, ".opencode", "skills") ]
            |> List.collect (fun dir ->
                if Directory.Exists dir then
                    Directory.GetDirectories dir
                    |> Array.filter (fun d ->
                        claudeNames.Contains(Path.GetFileName d)
                        && File.Exists(Path.Combine(d, "SKILL.md")))
                    |> Array.toList
                else
                    [])

        if List.isEmpty offenders then
            ValidationCheck.passed
                checkName
                "No rhino-cli-managed skill copies under .opencode/skill or .opencode/skills"
        else
            ValidationCheck.failed
                checkName
                "No skill copy mirroring .claude/skills/<name>"
                (sprintf
                    "Found %d mirrored skill dir(s): %s"
                    (List.length offenders)
                    (sprintf "[%s]" (String.Join(" ", offenders))))
                "OpenCode reads .claude/skills/ natively; remove the mirror copies"
    with ex ->
        ValidationCheck.failedMsg checkName (sprintf "failed to scan for synced skill mirrors: %s" ex.Message)

/// Compares every registry-declared skills mirror against its canonical source
/// tree, reusing the emitter's own diff
/// [Repo-grounded — `sync_validator.rs::validate_skills_mirror`].
let private validateSkillsMirror (repoRoot: string) : ValidationCheck =
    let checkName = "Skills Mirror: .agents/skills"

    match auditSkillsMirrors repoRoot with
    | Error e -> ValidationCheck.failedMsg checkName e
    | Ok [] -> ValidationCheck.passed checkName "skills mirror matches its source tree"
    | Ok drifts ->
        let detail =
            drifts
            |> List.map (function
                | MirrorDriftMissing p -> sprintf "missing or stale mirror for %s" p
                | MirrorDriftUndeclared p -> sprintf "undeclared directory in the mirror: %s" p)
            |> String.concat "; "

        let remediation =
            drifts
            |> List.map (function
                | MirrorDriftMissing mirrorRel -> driftRemediation repoRoot mirrorRel
                | MirrorDriftUndeclared mirrorRel ->
                    sprintf
                        "%s has no source counterpart and is not declared vendored; run `rhino-cli harness bindings generate` to remove it."
                        mirrorRel)
            |> String.concat " "

        ValidationCheck.failed checkName "mirror byte-equal to its canonical source tree" detail remediation

/// Runs the scoped sync validation: stale-directory guard, agent count,
/// per-agent equivalence, then the two skills-surface checks
/// [Repo-grounded — `sync_validator.rs::validate_sync`].
let validateSync (repoRoot: string) : ValidationResult =
    let stopwatch = Stopwatch.StartNew()

    let checks =
        [ validateNoStaleAgentDir repoRoot; validateAgentCount repoRoot ]
        @ validateAgentEquivalence repoRoot
        @ [ validateNoSyncedSkills repoRoot; validateSkillsMirror repoRoot ]

    let result =
        checks
        |> List.fold (fun acc check -> ValidationResult.tally check acc) ValidationResult.empty

    stopwatch.Stop()

    { result with
        Duration = stopwatch.Elapsed }

// ---------------------------------------------------------------------------
// All-harness binding parity (harness bindings validate)
// ---------------------------------------------------------------------------

/// The canonical (path, content) pairs the parity guard compares the working
/// tree against: one `.codex/agents/<name>.toml` per `.claude/agents/` agent,
/// rendered from the same source the emitter uses. `.codex/config.toml` is
/// deliberately absent — only its delimited region is emitter-owned, and
/// `validateCodexConfigRegion` checks that separately
/// [Repo-grounded — `bindings.rs::expected_bindings`].
let expectedBindings (repoRoot: string) : Result<BindingFile list, string> =
    let claudeDir = Path.Combine(repoRoot, ".claude", "agents")
    let maps = loadGradeMaps repoRoot "codex"

    if not (Directory.Exists claudeDir) then
        Ok []
    else
        let mirrorDir = Path.Combine(repoRoot, codexAgentDir)

        discoverAgentSources claudeDir
        |> Result.bind (fun sources ->
            sources
            |> List.fold
                (fun acc (input, name) ->
                    match acc with
                    | Error e -> Error e
                    | Ok bindings ->
                        match convertCodexAgentInner maps input name claudeDir mirrorDir with
                        | Error e -> Error e
                        | Ok(_agent, content, _warnings) ->
                            Ok(
                                bindings
                                @ [ { RelPath = sprintf "%s/%s.%s" codexAgentDir name codexAgentExtension
                                      Content = content } ]
                            ))
                (Ok []))

/// Compares one generated binding file against the bytes the emitter would
/// write right now [Repo-grounded — `bindings.rs::validate_binding_file`].
let validateBindingContent
    (binding: BindingFile)
    (actual: Result<string option, string>)
    (remediation: string)
    : ValidationCheck =
    let checkName = sprintf "Binding: %s" binding.RelPath

    match actual with
    | Error error -> ValidationCheck.failedMsg checkName (sprintf "failed to read %s: %s" binding.RelPath error)
    | Ok None ->
        ValidationCheck.failed
            checkName
            "file present and byte-equal to generated content"
            "file missing"
            (sprintf "%s is missing; run `rhino-cli harness bindings generate`" binding.RelPath)
    | Ok(Some content) when content = binding.Content ->
        ValidationCheck.passed checkName (sprintf "%s matches generated content" binding.RelPath)
    | Ok(Some _) ->
        ValidationCheck.failed
            checkName
            "byte-equal to generated content"
            "content differs from generated bytes"
            remediation

let private validateBindingFile (repoRoot: string) (binding: BindingFile) : ValidationCheck =
    let abs = joinRel repoRoot binding.RelPath

    let actual =
        try
            Ok(if File.Exists abs then Some(File.ReadAllText abs) else None)
        with ex ->
            Error ex.Message

    validateBindingContent binding actual (driftRemediation repoRoot binding.RelPath)

/// Checks the delimited generated region of `.codex/config.toml` against what
/// the emitter would write right now; everything outside the markers is
/// hand-maintained and deliberately unguarded
/// [Repo-grounded — `bindings.rs::validate_codex_config_region`].
let private validateCodexConfigRegion (repoRoot: string) : ValidationCheck =
    let maps = loadGradeMaps repoRoot "codex"
    let checkName = sprintf "Codex Config Region: %s" codexConfigFile
    let claudeDir = Path.Combine(repoRoot, ".claude", "agents")
    let configPath = joinRel repoRoot codexConfigFile

    if not (Directory.Exists claudeDir) || not (File.Exists configPath) then
        ValidationCheck.passed checkName (sprintf "%s absent; nothing to check" codexConfigFile)
    else
        let content =
            try
                Ok(File.ReadAllText configPath)
            with ex ->
                Error(sprintf "failed to read %s: %s" codexConfigFile ex.Message)

        match content with
        | Error e -> ValidationCheck.failedMsg checkName e
        | Ok content ->
            let planned =
                discoverAgentSources claudeDir
                |> Result.map (fun sources ->
                    let mirrorDir = Path.Combine(repoRoot, codexAgentDir)

                    sources
                    |> List.choose (fun (input, name) ->
                        match convertCodexAgentInner maps input name claudeDir mirrorDir with
                        | Ok(agent, _, _) ->
                            Some
                                { Name = agent.Name
                                  Description = agent.Description }
                        | Error _ -> None))

            match planned with
            | Error e -> ValidationCheck.failedMsg checkName e
            | Ok agents ->
                let expected = renderGeneratedRegion agents
                let startIdx = content.IndexOf(generatedRegionStart, StringComparison.Ordinal)
                let endIdx = content.IndexOf(generatedRegionEnd, StringComparison.Ordinal)

                if startIdx < 0 || endIdx < startIdx then
                    ValidationCheck.failed
                        checkName
                        "a delimited generated agents region"
                        "no generated region found"
                        (sprintf "%s has no generated region; run `rhino-cli harness bindings generate`" codexConfigFile)
                elif content.Substring(startIdx, endIdx + generatedRegionEnd.Length - startIdx) = expected then
                    ValidationCheck.passed checkName (sprintf "%s generated region matches" codexConfigFile)
                else
                    ValidationCheck.failed
                        checkName
                        "generated region byte-equal to emitted content"
                        "generated region drifted"
                        (sprintf
                            "%s generated region drifted; run `rhino-cli harness bindings generate`"
                            codexConfigFile)

/// OpenCode theme tokens that need no translation-map row.
let private opencodeDirectColors: string list =
    [ "primary"
      "success"
      "warning"
      "secondary"
      "error"
      "info"
      "accent"
      "muted" ]

/// Reads `path` plus every `.md` child of its sibling split directory. A
/// governance doc that relocated its tables into split children would
/// otherwise read as if the table were gone
/// [Repo-grounded — `bindings.rs::read_with_split_children`].
let private readWithSplitChildren (path: string) : string =
    let head =
        try
            File.ReadAllText path
        with _ ->
            ""

    let splitDir =
        match Path.GetDirectoryName path with
        | null
        | "" -> None
        | parent -> Some(Path.Combine(parent, Path.GetFileNameWithoutExtension path))

    match splitDir with
    | Some dir when Directory.Exists dir ->
        Directory.GetFiles(dir, "*.md")
        |> Array.sort
        |> Array.fold
            (fun (acc: string) child ->
                try
                    acc + "\n" + File.ReadAllText child
                with _ ->
                    acc)
            head
    | _ -> head

/// Checks that every `color:` and `model:` value used by any
/// `.claude/agents/**/*.md` resolves in its governance translation map
/// [Repo-grounded — `bindings.rs::validate_color_tier_maps`].
let private validateColorTierMaps (repoRoot: string) : ValidationCheck list =
    let agentsDir = Path.Combine(repoRoot, ".claude", "agents")

    if not (Directory.Exists agentsDir) then
        []
    else
        let colorMap =
            readWithSplitChildren (Path.Combine(repoRoot, "repo-governance/development/agents/ai-agents.md"))

        let tierMap =
            readWithSplitChildren (Path.Combine(repoRoot, "repo-governance/development/agents/model-selection.md"))

        let scalars (prefix: string) =
            Directory.GetFiles(agentsDir, "*.md", SearchOption.AllDirectories)
            |> Array.collect (fun path ->
                try
                    File.ReadAllText(path).Split('\n')
                with _ ->
                    [||])
            |> Array.choose (fun line ->
                if line.StartsWith(prefix, StringComparison.Ordinal) then
                    let value = line.Substring(prefix.Length).Trim()
                    if value = "" then None else Some value
                else
                    None)
            |> Set.ofArray
            |> Set.toList

        let seenColors = scalars "color:"
        let seenTiers = scalars "model:"

        let colorChecks =
            seenColors
            |> List.map (fun color ->
                let name = sprintf "Color translation: %s" color

                if List.contains color opencodeDirectColors then
                    ValidationCheck.passed
                        name
                        (sprintf "'%s' is a valid OpenCode theme token (no mapping needed)" color)
                elif colorMap.Contains(sprintf "`%s`" color) then
                    ValidationCheck.passed name (sprintf "'%s' is mapped in ai-agents.md" color)
                else
                    ValidationCheck.failed
                        name
                        "color mapped in repo-governance/development/agents/ai-agents.md"
                        (sprintf "'%s' is NOT in the color translation table" color)
                        (sprintf
                            "Add a row for '%s' in the Platform Binding Color Translation table in ai-agents.md"
                            color))

        let colorFallback =
            if List.isEmpty seenColors then
                [ ValidationCheck.passed
                      "Color translation map"
                      "No agent color values to verify (no agents or all use theme tokens)" ]
            else
                []

        let tierChecks =
            seenTiers
            |> List.map (fun tier ->
                let name = sprintf "Tier mapping: %s" tier

                if
                    tierMap.Contains(sprintf "`%s`" tier)
                    || tierMap.Contains(sprintf "model: %s" tier)
                then
                    ValidationCheck.passed name (sprintf "'%s' is mapped in model-selection.md" tier)
                else
                    ValidationCheck.failed
                        name
                        "model value mapped in repo-governance/development/agents/model-selection.md"
                        (sprintf "'%s' is NOT in the capability-tier map" tier)
                        (sprintf "Add a row for '%s' in the capability-tier table in model-selection.md" tier))

        let tierFallback =
            if List.isEmpty seenTiers then
                [ ValidationCheck.passed
                      "Capability-tier map"
                      "No agent model values to verify (all agents use planning-grade inherit)" ]
            else
                []

        colorChecks @ colorFallback @ tierChecks @ tierFallback

/// The mirror file names under a generated agent directory that no source
/// agent explains. Renaming a `.claude/agents/` file makes the emitter write
/// the new mirror but leaves the old one behind: nothing enumerates the mirror
/// directory looking for files the source tree no longer accounts for, so the
/// stale mirror survives regeneration and passes every other binding check.
/// `README.md` is excluded because it documents the directory rather than
/// mirroring an agent, and so is any file the registry declares `vendored` —
/// a hand-maintained file inside a generated tree has no source by design.
/// Matching is on the file stem, which is what the emitter uses as the
/// mirror's name for every generated harness.
let mirrorOrphanNames (mirrorNames: string list) (sourceNames: string list) (vendored: string list) : string list =
    let sources = Set.ofList sourceNames
    let exempt = Set.ofList vendored

    mirrorNames
    |> List.filter (fun name -> name <> "README.md")
    |> List.filter (fun name -> not (exempt.Contains name))
    |> List.filter (fun name -> not (sources.Contains(Path.GetFileNameWithoutExtension name)))
    |> List.sort

/// The orphan check for one generated agent directory, over already-read
/// directory contents so the decision is testable without a filesystem.
let validateMirrorOrphanState
    (agentDir: string)
    (mirrorNames: Result<string list, string>)
    (sourceNames: string list)
    (vendored: string list)
    : ValidationCheck =
    let checkName = sprintf "Mirror Orphans: %s" agentDir

    match mirrorNames with
    | Error e -> ValidationCheck.failedMsg checkName e
    | Ok names ->
        match mirrorOrphanNames names sourceNames vendored with
        | [] -> ValidationCheck.passed checkName (sprintf "every mirror under %s has a source agent" agentDir)
        | offenders ->
            let joined = String.Join(", ", offenders)

            ValidationCheck.failed
                checkName
                (sprintf "every mirror under %s resolves to a .claude/agents/ source" agentDir)
                (sprintf "orphaned mirror(s): %s" joined)
                (sprintf
                    "%s under %s: no .claude/agents/ source explains %s, so the agent was renamed or removed and the mirror was left behind. Delete the stale file; `rhino-cli harness bindings generate` writes new mirrors but never removes orphaned ones."
                    joined
                    agentDir
                    (if List.length offenders = 1 then "it" else "them"))

/// [`validateMirrorOrphanState`] for one registry entry, reading the mirror
/// directory and its declared source tree from disk.
let private validateMirrorOrphansForEntry (repoRoot: string) (entry: RepoConfig.HarnessEntry) : ValidationCheck option =
    match entry.AgentDir, entry.Mirrors with
    | Some agentDir, Some sourceDir ->
        let dirPath = joinRel repoRoot agentDir

        if not (Directory.Exists dirPath) then
            None
        else
            let mirrorNames =
                try
                    Ok(Directory.GetFiles dirPath |> Array.toList |> List.map Path.GetFileName)
                with ex ->
                    Error(sprintf "failed to read %s: %s" agentDir ex.Message)

            let sourceNames =
                match discoverAgentSources (Path.Combine(repoRoot, sourceDir)) with
                | Error _ -> []
                | Ok sources -> sources |> List.map snd

            // A path the entry's own `ownership:` list declares vendored is
            // hand-maintained inside a generated tree, so it is exempt by
            // declaration rather than by the check guessing at intent.
            let vendored =
                entry.Ownership
                |> List.filter (fun o -> o.Class = RepoConfig.OwnershipClass.ClassVendored)
                |> List.choose (fun o ->
                    match stripDir (o.Path.TrimStart('/')) agentDir with
                    | Some suffix when not (suffix.Contains "/") -> Some suffix
                    | _ -> None)

            Some(validateMirrorOrphanState agentDir mirrorNames sourceNames vendored)
    | _ -> None

/// [`validateMirrorOrphansForEntry`] across every generated-tier registry entry,
/// so a fourth harness is covered by its own entry rather than a code change.
let validateMirrorOrphans (repoRoot: string) : ValidationCheck list =
    match RepoConfig.load repoRoot with
    | Error e -> [ ValidationCheck.failedMsg "Mirror Orphans" e ]
    | Ok config ->
        config.Harness
        |> List.filter (fun entry -> entry.Tier = RepoConfig.Tier.Generated)
        |> List.choose (validateMirrorOrphansForEntry repoRoot)

/// Validates all 3 supported harnesses: static Codex binding files against the
/// emitter's own bytes, the OpenCode and Skills mirrors (via `validateSync`),
/// catalog coverage for every present binding directory, the Codex agent-file
/// extension and config-region checks, and the color/tier translation maps
/// [Repo-grounded — `bindings.rs::validate_bindings`].
let validateBindings (repoRoot: string) : ValidationResult =
    let stopwatch = Stopwatch.StartNew()

    let staticChecks =
        match expectedBindings repoRoot with
        | Error e -> [ ValidationCheck.failedMsg "Static binding configuration" e ]
        | Ok bindings -> bindings |> List.map (validateBindingFile repoRoot)

    let checks =
        staticChecks
        @ (validateSync repoRoot).Checks
        @ (knownBindingDirs |> List.map (validateCatalogCoverage repoRoot))
        @ [ validateCodexAgentsDir repoRoot; validateCodexConfigRegion repoRoot ]
        @ validateMirrorOrphans repoRoot
        @ validateColorTierMaps repoRoot
        @ [ skillsMirrorAuditCheck (auditSkillsMirrors repoRoot) ]

    let result =
        checks
        |> List.fold (fun acc check -> ValidationResult.tally check acc) ValidationResult.empty

    stopwatch.Stop()

    { result with
        Duration = stopwatch.Elapsed }

// ---------------------------------------------------------------------------
// Claude Code agent/skill validation (harness agents validate-claude)
// ---------------------------------------------------------------------------

/// Full Claude Code agent definition parsed from a `.claude/agents/*.md` file
/// [Repo-grounded — `agents/types.rs::ClaudeAgentFull`].
type ClaudeAgentFull =
    { Name: string
      Description: string
      Tools: string list
      Model: string
      Effort: string
      Color: string
      Skills: string list }

let private claudeAgentFullEmpty: ClaudeAgentFull =
    { Name = ""
      Description = ""
      Tools = []
      Model = ""
      Effort = ""
      Color = ""
      Skills = [] }

/// Minimal Claude Code skill definition parsed from a `SKILL.md` file
/// [Repo-grounded — `agents/types.rs::ClaudeSkill`].
type ClaudeSkill = { Name: string; Description: string }

/// Ordered list of required frontmatter fields for agent definitions
/// [Repo-grounded — `agents/types.rs::required_fields`].
let requiredFields: string list = [ "name"; "description" ]

/// Allow-list of known Claude Code tool names [Repo-grounded — `agents/types.rs::valid_tools`].
let validTools: Set<string> =
    set
        [ "Read"
          "Write"
          "Edit"
          "Glob"
          "Grep"
          "Bash"
          "BashOutput"
          "KillShell"
          "NotebookEdit"
          "TodoWrite"
          "WebFetch"
          "WebSearch"
          "Agent"
          "Task"
          "SlashCommand"
          "ExitPlanMode"
          "EnterPlanMode"
          "ListMcpResourcesTool"
          "ReadMcpResourceTool"
          "AskUserQuestion" ]

/// Sorted iteration of [`validTools`] for a check's `Expected` string
/// [Repo-grounded — `agents/types.rs::valid_tools_sorted`].
let validToolsSorted: string list = validTools |> Set.toList |> List.sort

/// Accepted `model:` aliases for a validation run.
///
/// Derived from the `claude-code` registry entry's `model-map:` rather than
/// hardcoded, so the grade vocabulary has one source of truth: renaming a
/// grade in `repo-config.yml` moves the validator with it. `inherit` is added
/// on top because it is a Claude Code semantic rather than a grade — it names
/// no capability, it defers to the caller.
let validModelAliasesFrom (maps: GradeMaps) : Set<string> =
    maps.GradeOfAlias
    |> Map.toList
    |> List.map fst
    |> Set.ofList
    |> Set.add "inherit"

/// Matches full Claude model IDs (e.g. `claude-sonnet-4-6`)
/// [Repo-grounded — `agents/types.rs::valid_model_id_pattern`].
let validModelIdPattern: Regex =
    Regex(@"^claude-[a-z0-9.-]+$", RegexOptions.Compiled)

/// Matches agent tool entries in call form (`ToolName(...)`)
/// [Repo-grounded — `agents/types.rs::agent_tool_pattern`].
let agentToolPattern: Regex =
    Regex(@"^([A-Za-z][A-Za-z0-9_]*)\(.*\)$", RegexOptions.Compiled)

/// Allow-list of accepted `color` values for agent definitions
/// [Repo-grounded — `agents/types.rs::valid_colors`].
let validColors: Set<string> =
    set [ "red"; "blue"; "green"; "yellow"; "purple"; "orange"; "pink"; "cyan" ]

/// [`validColors`] in the fixed order Rust's failure message lists them.
let private validColorsOrdered: string list =
    [ "red"; "blue"; "green"; "yellow"; "purple"; "orange"; "pink"; "cyan" ]

/// Matches valid skill directory names [Repo-grounded — `agents/types.rs::valid_skill_name_pattern`].
let validSkillNamePattern: Regex =
    Regex(@"^[a-z0-9-]{1,64}$", RegexOptions.Compiled)

/// Allow-list of known frontmatter field names for Claude Code agents
/// [Repo-grounded — `agents/types.rs::valid_claude_agent_fields`].
let validClaudeAgentFields: Set<string> =
    set
        [ "name"
          "description"
          "tools"
          "disallowedTools"
          "model"
          "permissionMode"
          "maxTurns"
          "skills"
          "mcpServers"
          "hooks"
          "memory"
          "background"
          "effort"
          "isolation"
          "color"
          "initialPrompt" ]

/// Allow-list of known frontmatter field names for Claude Code skills
/// [Repo-grounded — `agents/types.rs::valid_claude_skill_fields`].
let validClaudeSkillFields: Set<string> =
    set
        [ "name"
          "description"
          "license"
          "compatibility"
          "metadata"
          "when_to_use"
          "argument-hint"
          "arguments"
          "disable-model-invocation"
          "user-invocable"
          "allowed-tools"
          "model"
          "effort"
          "context"
          "agent"
          "hooks"
          "paths"
          "shell" ]

/// Formats a string list Go `%v`-style: `[a b c]`
/// [Repo-grounded — `agent_validator.rs::format_string_slice`].
let private formatStringSlice (items: string list) : string =
    sprintf "[%s]" (String.Join(" ", items))

/// Checks that every key-value line in `content`'s frontmatter has a space
/// after its colon [Repo-grounded — `yaml_formatting.rs::validate_yaml_formatting_raw`].
let validateYamlFormattingRaw (checkName: string) (content: string) : ValidationCheck =
    let lines = content.Split('\n')

    if lines.Length < 3 then
        ValidationCheck.passed checkName "File too short to check formatting"
    elif lines.[0].Trim() <> "---" then
        ValidationCheck.failedMsg checkName "Frontmatter does not start with ---"
    else
        match
            lines
            |> Array.skip 1
            |> Array.tryFindIndex (fun line -> line.Trim() = "---")
            |> Option.map (fun relativeIdx -> relativeIdx + 1)
        with
        | None -> ValidationCheck.failedMsg checkName "Frontmatter closing --- not found"
        | Some endIdx ->
            let issues =
                lines
                |> Array.indexed
                |> Array.skip 1
                |> Array.filter (fun (i, _) -> i < endIdx)
                |> Array.choose (fun (i, line) ->
                    let trimmed = line.Trim()

                    if
                        trimmed = ""
                        || trimmed.StartsWith("-", StringComparison.Ordinal)
                        || trimmed.StartsWith("#", StringComparison.Ordinal)
                    then
                        None
                    elif trimmed.Contains(":") then
                        let idx = trimmed.IndexOf ':'
                        let rest = trimmed.Substring(idx + 1)

                        if rest <> "" && not (rest.StartsWith(" ", StringComparison.Ordinal)) then
                            Some(sprintf "Line %d: '%s' (missing space after colon)" (i + 1) trimmed)
                        else
                            None
                    else
                        None)
                |> Array.toList

            if not issues.IsEmpty then
                ValidationCheck.failed
                    checkName
                    "Space after colon in YAML key-value pairs (e.g., 'name: value')"
                    (sprintf "Found %d formatting issues" issues.Length)
                    (sprintf "YAML formatting errors:\n  %s" (String.Join("\n  ", issues)))
            else
                ValidationCheck.passed checkName "YAML formatting correct (spaces after colons)"

/// Parses a YAML frontmatter string into a [`ClaudeAgentFull`]
/// [Repo-grounded — `agent_validator.rs::parse_agent_yaml`].
let private parseAgentYaml (frontmatter: string) : Result<ClaudeAgentFull, string> =
    try
        match yamlDeserializer.Deserialize<Dictionary<string, obj>> frontmatter with
        | null -> Ok claudeAgentFullEmpty
        | mapping ->
            let str key =
                match tryGetField mapping key with
                | Some(:? string as s) -> s
                | _ -> ""

            Ok
                { Name = str "name"
                  Description = str "description"
                  Model = str "model"
                  Effort = str "effort"
                  Color = str "color"
                  Tools =
                    tryGetField mapping "tools"
                    |> Option.map parseClaudeTools
                    |> Option.defaultValue []
                  Skills = parseStringSeq (tryGetField mapping "skills") }
    with ex ->
        Error ex.Message

/// Parses a YAML frontmatter string into a [`ClaudeSkill`]
/// [Repo-grounded — `skill_validator.rs::parse_skill_yaml`].
let private parseSkillYaml (frontmatter: string) : Result<ClaudeSkill, string> =
    try
        match yamlDeserializer.Deserialize<Dictionary<string, obj>> frontmatter with
        | null -> Ok { Name = ""; Description = "" }
        | mapping ->
            let str key =
                match tryGetField mapping key with
                | Some(:? string as s) -> s
                | _ -> ""

            Ok
                { Name = str "name"
                  Description = str "description" }
    with ex ->
        Error ex.Message

/// Checks that `name`, `description`, and `tools` are all non-empty
/// [Repo-grounded — `agent_validator.rs::validate_required_fields`].
let private validateRequiredFields (filename: string) (agent: ClaudeAgentFull) : ValidationCheck =
    let missing =
        [ if agent.Name = "" then
              "name"
          if agent.Description = "" then
              "description"
          if agent.Tools.IsEmpty then
              "tools" ]

    if not missing.IsEmpty then
        ValidationCheck.failed
            (sprintf "Agent: %s - Required Fields" filename)
            "All required fields present"
            (sprintf "Missing: %s" (formatStringSlice missing))
            "Required fields missing"
    else
        ValidationCheck.passed (sprintf "Agent: %s - Required Fields" filename) "All required fields present"

/// Checks that required fields appear before optional fields, and warns on
/// unknown fields [Repo-grounded — `agent_validator.rs::validate_field_order`].
let private validateFieldOrder (filename: string) (frontmatter: string) : ValidationCheck list =
    try
        match yamlDeserializer.Deserialize<Dictionary<string, obj>> frontmatter with
        | null ->
            [ ValidationCheck.passed
                  (sprintf "Agent: %s - Field Order" filename)
                  "Required fields appear before optional fields" ]
        | mapping ->
            let fieldNames = mapping.Keys |> List.ofSeq
            let required = Set.ofList requiredFields

            let _, outOfOrder =
                fieldNames
                |> List.fold
                    (fun (sawOptional, acc) f ->
                        if required.Contains f then
                            (sawOptional, (if sawOptional then acc @ [ f ] else acc))
                        else
                            (true, acc))
                    (false, [])

            let orderCheck =
                if outOfOrder.IsEmpty then
                    ValidationCheck.passed
                        (sprintf "Agent: %s - Field Order" filename)
                        "Required fields appear before optional fields"
                else
                    ValidationCheck.failed
                        (sprintf "Agent: %s - Field Order" filename)
                        (sprintf
                            "Required fields %s appear before any optional field"
                            (formatStringSlice requiredFields))
                        (sprintf "Required field(s) appear after optional field: %s" (formatStringSlice outOfOrder))
                        "Required fields must appear before optional fields"

            let unknownWarnings =
                fieldNames
                |> List.filter (fun f -> not (validClaudeAgentFields.Contains f))
                |> List.map (fun f ->
                    ValidationCheck.warning
                        (sprintf "Agent: %s - Unknown Field: %s" filename f)
                        "Field listed in ValidClaudeAgentFields"
                        (sprintf "Unknown field: %s" f)
                        (sprintf
                            "Field \"%s\" is not in the documented Claude Code agent field set; verify it is intentional"
                            f))

            orderCheck :: unknownWarnings
    with ex ->
        [ ValidationCheck.failedMsg
              (sprintf "Agent: %s - Field Order" filename)
              (sprintf "Failed to parse YAML for order check: %s" ex.Message) ]

/// Checks that every tool name (or base name of call-form entries) is in the
/// allow-list [Repo-grounded — `agent_validator.rs::validate_tools_check`].
let private validateToolsCheck (filename: string) (tools: string list) : ValidationCheck =
    let baseName (raw: string) =
        let tool = raw.Trim()
        let m = agentToolPattern.Match tool
        if m.Success then m.Groups.[1].Value else tool

    let invalid =
        tools
        |> List.choose (fun raw ->
            let tool = raw.Trim()

            if tool = "" then None
            elif validTools.Contains(baseName tool) then None
            else Some tool)

    if not invalid.IsEmpty then
        ValidationCheck.failed
            (sprintf "Agent: %s - Valid Tools" filename)
            (sprintf "Valid tools: %s" (formatStringSlice validToolsSorted))
            (sprintf "Invalid tools: %s" (formatStringSlice invalid))
            "Invalid tool names"
    else
        ValidationCheck.passed (sprintf "Agent: %s - Valid Tools" filename) "All tools valid"

/// Checks that `model` is a valid alias or a full `claude-*` model ID
/// [Repo-grounded — `agent_validator.rs::validate_model_check`].
let private validateModelCheck (maps: GradeMaps) (filename: string) (model: string) : ValidationCheck =
    let accepted = validModelAliasesFrom maps
    let name = sprintf "Agent: %s - Valid Model" filename

    if Map.isEmpty maps.GradeOfAlias then
        // Fail closed. An empty vocabulary means the registry could not be
        // read, and passing every model in that state would be the same false
        // zero as validating no agents at all.
        ValidationCheck.failed
            name
            "a claude-code model-map in repo-config.yml"
            "no grade vocabulary declared"
            "Cannot validate models: the claude-code registry entry declares no model-map"
    elif accepted.Contains model || validModelIdPattern.IsMatch model then
        ValidationCheck.passed name "Model valid"
    else
        ValidationCheck.failed
            name
            (String.Join("|", Set.toList accepted) + "|claude-*")
            (sprintf "Model: %s" model)
            "Invalid model"

/// Checks that an agent's `effort` matches the effort its grade declares.
///
/// Effort is a property of the capability grade, not of the individual agent:
/// a weaker model is compensated with more reasoning effort, so the pairing is
/// a repository-wide rule rather than a per-agent judgement. Agents that name
/// no grade — `inherit` or a pinned `claude-*` ID — are skipped, because there
/// is no grade whose effort they could contradict.
let private validateEffortCheck
    (maps: GradeMaps)
    (filename: string)
    (model: string)
    (effort: string)
    : ValidationCheck option =
    match Map.tryFind model maps.GradeOfAlias with
    | None -> None
    | Some grade ->
        match Map.tryFind grade maps.EffortOfGrade with
        | None -> None
        | Some expected ->
            let name = sprintf "Agent: %s - Grade Effort" filename

            if effort = expected then
                Some(ValidationCheck.passed name (sprintf "effort matches the %s grade" grade))
            else
                Some(
                    ValidationCheck.failed
                        name
                        (sprintf "effort: %s (the %s grade)" expected grade)
                        (sprintf "effort: %s" (if effort = "" then "<absent>" else effort))
                        (sprintf "effort contradicts the %s grade declared in repo-config.yml" grade)
                )

/// The literal every agent body must carry to state why its grade was chosen.
let private justificationMarker = "**Model Selection Justification**"

/// Checks that the agent body states why its grade was chosen.
///
/// The AI Agents Convention requires every agent to carry a Model Selection
/// Justification block. Without it a reader cannot tell a deliberate grade
/// assignment from an author who copied another agent's frontmatter, and a
/// grade nobody argued for is exactly what the decision tree exists to
/// prevent. Whether the prose beneath it is a *good* argument is a judgement
/// no validator can make; that it is present, and that it argues for the grade
/// the frontmatter actually declares, both are.
let private validateJustificationCheck (filename: string) (body: string) : ValidationCheck =
    let name = sprintf "Agent: %s - Model Selection Justification" filename

    if body.Contains justificationMarker then
        ValidationCheck.passed name "Justification block present"
    else
        ValidationCheck.failed
            name
            (sprintf "a %s block in the agent body" justificationMarker)
            "no justification block"
            "Agent does not state why its model grade was chosen"

/// The grade alias a justification block argues for, if it names one.
///
/// Only the block's own region is read — from the marker to the next `##`
/// heading — so a later paragraph contrasting with another grade is not
/// mistaken for the block's claim. The *first* alias is the claim: the block
/// opens by naming the grade it argues for, and anything after that is
/// comparison.
let private justificationGrade (maps: GradeMaps) (body: string) : string option =
    let markerAt = body.IndexOf(justificationMarker, StringComparison.Ordinal)

    if markerAt < 0 then
        None
    else
        let rest = body.Substring markerAt

        let region =
            match rest.IndexOf("\n## ", StringComparison.Ordinal) with
            | -1 -> rest
            | stop -> rest.Substring(0, stop)

        // Aliases are quoted in the prose, so an unquoted mention of the same
        // word in ordinary text cannot be read as the block's claim.
        let quoted =
            maps.GradeOfAlias
            |> Map.toList
            |> List.collect (fun (alias, _) -> [ sprintf "`model: %s`" alias, alias; sprintf "`%s`" alias, alias ])
            |> List.choose (fun (needle, alias) ->
                match region.IndexOf(needle, StringComparison.Ordinal) with
                | -1 -> None
                | at -> Some(at, alias))

        quoted |> List.sortBy fst |> List.tryHead |> Option.map snd

/// Checks that the justification argues for the grade the frontmatter declares.
///
/// A block that argues one grade while the frontmatter declares another is the
/// drift a presence-only check cannot see: it happens whenever a promotion
/// edits the frontmatter and leaves the prose behind, and the stale prose then
/// reads as an argument to undo the promotion. Agents naming no grade in the
/// block, and agents whose declared model is outside the vocabulary, are
/// skipped — the model check already owns the latter.
let private validateJustificationGradeCheck
    (maps: GradeMaps)
    (filename: string)
    (model: string)
    (body: string)
    : ValidationCheck option =
    let name = sprintf "Agent: %s - Justification Grade" filename

    match justificationGrade maps body with
    | None -> None
    | Some argued when argued = model -> Some(ValidationCheck.passed name "Justification argues the declared grade")
    | Some argued ->
        if not (maps.GradeOfAlias.ContainsKey model) then
            None
        else
            Some(
                ValidationCheck.failed
                    name
                    (sprintf "a justification for `%s`" model)
                    (sprintf "argues for `%s`" argued)
                    "Justification argues for a grade the frontmatter does not declare"
            )

/// Checks that `color` is in the allow-list of named color tokens
/// [Repo-grounded — `agent_validator.rs::validate_color_check`].
let private validateColorCheck (filename: string) (color: string) : ValidationCheck =
    if not (validColors.Contains color) then
        ValidationCheck.failed
            (sprintf "Agent: %s - Valid Color" filename)
            (sprintf "Valid colors: %s" (formatStringSlice validColorsOrdered))
            (sprintf "Color: %s" color)
            "Invalid color"
    else
        ValidationCheck.passed (sprintf "Agent: %s - Valid Color" filename) "Color valid"

/// Checks that the filename equals `<name>.md`
/// [Repo-grounded — `agent_validator.rs::validate_filename_check`].
let private validateFilenameCheck (filename: string) (name: string) : ValidationCheck =
    let expected = sprintf "%s.md" name

    if filename <> expected then
        ValidationCheck.failed
            (sprintf "Agent: %s - Filename Match" filename)
            (sprintf "Filename: %s" expected)
            (sprintf "Filename: %s" filename)
            "Filename does not match name field"
    else
        ValidationCheck.passed (sprintf "Agent: %s - Filename Match" filename) "Filename matches name"

/// Checks that `name` has not already been registered in `agentNames`
/// [Repo-grounded — `agent_validator.rs::validate_uniqueness`].
let private validateUniqueness (filename: string) (name: string) (agentNames: Set<string>) : ValidationCheck =
    if agentNames.Contains name then
        ValidationCheck.failed
            (sprintf "Agent: %s - Name Uniqueness" filename)
            "Unique agent name"
            (sprintf "Duplicate name: %s" name)
            "Agent name already used"
    else
        ValidationCheck.passed (sprintf "Agent: %s - Name Uniqueness" filename) "Agent name unique"

/// Checks that every skill listed in `skills` exists in `skillNames`
/// [Repo-grounded — `agent_validator.rs::validate_skills_exist`].
let private validateSkillsExist (filename: string) (skills: string list) (skillNames: Set<string>) : ValidationCheck =
    let missing = skills |> List.filter (fun s -> not (skillNames.Contains s))

    if not missing.IsEmpty then
        ValidationCheck.failed
            (sprintf "Agent: %s - Skills Exist" filename)
            "All skills exist"
            (sprintf "Missing skills: %s" (formatStringSlice missing))
            "Referenced skills not found"
    else
        ValidationCheck.passed (sprintf "Agent: %s - Skills Exist" filename) "All skills exist"

/// Checks that frontmatter contains no YAML comment lines (`#`)
/// [Repo-grounded — `agent_validator.rs::validate_no_comments`].
let private validateNoComments (filename: string) (frontmatter: string) : ValidationCheck =
    let hasComment =
        frontmatter.Split('\n')
        |> Array.exists (fun line -> line.Trim().StartsWith("#", StringComparison.Ordinal))

    if hasComment then
        ValidationCheck.failed
            (sprintf "Agent: %s - No Comments" filename)
            "No YAML comments"
            "Comments found"
            "YAML comments not allowed in frontmatter"
    else
        ValidationCheck.passed (sprintf "Agent: %s - No Comments" filename) "No YAML comments"

/// Checks that agents in `generated-reports/` declare both `Write` and `Bash`
/// tools [Repo-grounded — `agent_validator.rs::validate_generated_reports_tools`].
let private validateGeneratedReportsTools (filename: string) (tools: string list) : ValidationCheck =
    let baseName (raw: string) =
        let tool = raw.Trim()
        let m = agentToolPattern.Match tool
        if m.Success then m.Groups.[1].Value else tool

    let hasWrite = tools |> List.exists (fun t -> baseName t = "Write")
    let hasBash = tools |> List.exists (fun t -> baseName t = "Bash")

    if not hasWrite || not hasBash then
        ValidationCheck.failed
            (sprintf "Agent: %s - Generated Reports Tools" filename)
            "Tools must include: Write, Bash"
            (sprintf "Has Write: %b, Has Bash: %b" hasWrite hasBash)
            "generated-reports/ agents must have Write AND Bash tools"
    else
        ValidationCheck.passed
            (sprintf "Agent: %s - Generated Reports Tools" filename)
            "Has required Write and Bash tools"

/// Validates a single agent file and returns its check results, plus the
/// agent-name set updated with `agent.Name` when uniqueness passed
/// [Repo-grounded — `agent_validator.rs::validate_agent`].
let validateAgentDocument
    (maps: GradeMaps)
    (agentPath: string)
    (filename: string)
    (content: string)
    (agentNames: Set<string>)
    (skillNames: Set<string>)
    : ValidationCheck list * Set<string> =
    let formattingCheck =
        validateYamlFormattingRaw (sprintf "Agent: %s - YAML Formatting" filename) content

    if formattingCheck.Status = "failed" then
        [ formattingCheck ], agentNames
    else
        match extractFrontmatter content with
        | Error e ->
            [ formattingCheck
              ValidationCheck.failedMsg
                  (sprintf "Agent: %s - YAML Syntax" filename)
                  (sprintf "Invalid frontmatter: %s" e) ],
            agentNames
        | Ok(frontmatter, body) ->
            let syntaxCheck =
                ValidationCheck.passed (sprintf "Agent: %s - YAML Syntax" filename) "Valid YAML frontmatter"

            match parseAgentYaml frontmatter with
            | Error e ->
                [ formattingCheck
                  syntaxCheck
                  ValidationCheck.failedMsg
                      (sprintf "Agent: %s - YAML Parse" filename)
                      (sprintf "Failed to parse YAML: %s" e) ],
                agentNames
            | Ok agent ->
                let requiredCheck = validateRequiredFields filename agent

                if requiredCheck.Status = "failed" then
                    [ formattingCheck; syntaxCheck; requiredCheck ], agentNames
                else
                    let fieldOrderChecks = validateFieldOrder filename frontmatter
                    let toolsCheck = validateToolsCheck filename agent.Tools
                    let modelCheck = validateModelCheck maps filename agent.Model

                    let effortChecks =
                        validateEffortCheck maps filename agent.Model agent.Effort |> Option.toList

                    let colorChecks =
                        if agent.Color <> "" then
                            [ validateColorCheck filename agent.Color ]
                        else
                            []

                    let justificationCheck = validateJustificationCheck filename body

                    let justificationGradeChecks =
                        validateJustificationGradeCheck maps filename agent.Model body |> Option.toList

                    let filenameCheck = validateFilenameCheck filename agent.Name
                    let uniqueCheck = validateUniqueness filename agent.Name agentNames

                    let updatedNames =
                        if uniqueCheck.Status = "passed" then
                            Set.add agent.Name agentNames
                        else
                            agentNames

                    let skillsCheck = validateSkillsExist filename agent.Skills skillNames
                    let noCommentsCheck = validateNoComments filename frontmatter

                    let generatedReportsChecks =
                        if agentPath.Contains "generated-reports" then
                            [ validateGeneratedReportsTools filename agent.Tools ]
                        else
                            []

                    let allChecks =
                        [ formattingCheck; syntaxCheck; requiredCheck ]
                        @ fieldOrderChecks
                        @ [ toolsCheck; modelCheck ]
                        @ effortChecks
                        @ colorChecks
                        @ [ justificationCheck ]
                        @ justificationGradeChecks
                        @ [ filenameCheck; uniqueCheck; skillsCheck; noCommentsCheck ]
                        @ generatedReportsChecks

                    allChecks, updatedNames

let private validateAgent
    (maps: GradeMaps)
    (agentPath: string)
    (filename: string)
    (agentNames: Set<string>)
    (skillNames: Set<string>)
    : ValidationCheck list * Set<string> =
    try
        validateAgentDocument maps agentPath filename (File.ReadAllText agentPath) agentNames skillNames
    with ex ->
        [ ValidationCheck.failedMsg
              (sprintf "Agent: %s - Read File" filename)
              (sprintf "Failed to read file: %s" ex.Message) ],
        agentNames

/// Validates all `.md` agent files under `.claude/agents/` recursively (skipping `README.md`)
/// and returns every check result
/// [Repo-grounded — `agent_validator.rs::validate_all_agents`].
let private validateAllAgents (repoRoot: string) (skillNames: Set<string>) : ValidationCheck list =
    let agentsDir = Path.Combine(repoRoot, ".claude", "agents")
    let maps = loadGradeMaps repoRoot "claude-code"

    if not (Directory.Exists agentsDir) then
        [ ValidationCheck.failedMsg "Read Agents Directory" "Failed to read agents directory: directory not found" ]
    else
        let files =
            Directory.GetFiles(agentsDir, "*.md", SearchOption.AllDirectories)
            |> Array.filter (fun path ->
                let name = Path.GetFileName path
                // The "*.md" pattern alone is not enough: on Windows it also
                // matches longer extensions such as ".mdx".
                name.EndsWith(".md", StringComparison.Ordinal) && name <> "README.md")
            |> Array.sort

        files
        |> Array.fold
            (fun (checks, names) path ->
                let name = Path.GetFileName path
                let newChecks, updatedNames = validateAgent maps path name names skillNames
                checks @ newChecks, updatedNames)
            ([], Set.empty)
        |> fst

/// Field-level checks on a parsed skill: description, name, name format,
/// name-match, then unknown-field warnings
/// [Repo-grounded — `skill_validator.rs::validate_skill_fields`].
let private validateSkillFields (skill: ClaudeSkill) (frontmatter: string) (skillName: string) : ValidationCheck list =
    if skill.Description = "" then
        [ ValidationCheck.failed
              (sprintf "Skill: %s - Description Field Required" skillName)
              "description field present"
              "description field missing or empty"
              "Required description field missing" ]
    else
        let descCheck =
            ValidationCheck.passed
                (sprintf "Skill: %s - Description Field Required" skillName)
                "Required description field present"

        if skill.Name = "" then
            [ descCheck
              ValidationCheck.failed
                  (sprintf "Skill: %s - Name Field Required" skillName)
                  "name field present"
                  "name field missing or empty"
                  "Required name field missing" ]
        else
            let nameCheck =
                ValidationCheck.passed
                    (sprintf "Skill: %s - Name Field Required" skillName)
                    "Required name field present"

            if not (validSkillNamePattern.IsMatch skill.Name) then
                [ descCheck
                  nameCheck
                  ValidationCheck.failed
                      (sprintf "Skill: %s - Name Format" skillName)
                      "Lowercase letters/numbers/hyphens only, max 64 chars"
                      (sprintf "Name: %s" skill.Name)
                      "Invalid skill name format" ]
            else
                let formatCheck =
                    ValidationCheck.passed (sprintf "Skill: %s - Name Format" skillName) "Name format valid"

                if skill.Name <> skillName then
                    [ descCheck
                      nameCheck
                      formatCheck
                      ValidationCheck.failed
                          (sprintf "Skill: %s - Name Match" skillName)
                          (sprintf "name field matches directory: %s" skillName)
                          (sprintf "name field: %s" skill.Name)
                          "Skill name must match directory name" ]
                else
                    let matchCheck =
                        ValidationCheck.passed
                            (sprintf "Skill: %s - Name Match" skillName)
                            "Name matches directory name"

                    let unknownWarnings =
                        match yamlDeserializer.Deserialize<Dictionary<string, obj>> frontmatter with
                        | null -> []
                        | mapping ->
                            mapping.Keys
                            |> Seq.filter (fun k -> not (validClaudeSkillFields.Contains k))
                            |> Seq.map (fun k ->
                                ValidationCheck.warning
                                    (sprintf "Skill: %s - Unknown Field: %s" skillName k)
                                    "Field listed in ValidClaudeSkillFields"
                                    (sprintf "Unknown field: %s" k)
                                    (sprintf
                                        "Field \"%s\" is not in the documented Claude Code skill field set; verify it is intentional"
                                        k))
                            |> List.ofSeq

                    descCheck :: nameCheck :: formatCheck :: matchCheck :: unknownWarnings

/// Validates a single skill directory at `skillPath` and returns all check
/// results [Repo-grounded — `skill_validator.rs::validate_skill`].
let private validateSkill (skillPath: string) (skillName: string) : ValidationCheck list =
    let skillFile = Path.Combine(skillPath, "SKILL.md")

    if not (File.Exists skillFile) then
        [ ValidationCheck.failed
              (sprintf "Skill: %s - SKILL.md Exists" skillName)
              "SKILL.md file present"
              "SKILL.md file not found"
              "SKILL.md file missing" ]
    else
        let existsCheck =
            ValidationCheck.passed (sprintf "Skill: %s - SKILL.md Exists" skillName) "SKILL.md file exists"

        let readResult =
            try
                Ok(File.ReadAllText skillFile)
            with ex ->
                Error(sprintf "Failed to read SKILL.md: %s" ex.Message)

        match readResult with
        | Error msg ->
            [ existsCheck
              ValidationCheck.failedMsg (sprintf "Skill: %s - Read SKILL.md" skillName) msg ]
        | Ok content ->
            let formattingCheck =
                validateYamlFormattingRaw (sprintf "Skill: %s - YAML Formatting" skillName) content

            if formattingCheck.Status = "failed" then
                [ existsCheck; formattingCheck ]
            else
                match extractFrontmatter content with
                | Error e ->
                    [ existsCheck
                      formattingCheck
                      ValidationCheck.failedMsg
                          (sprintf "Skill: %s - YAML Syntax" skillName)
                          (sprintf "Invalid frontmatter: %s" e) ]
                | Ok(frontmatter, _body) ->
                    let syntaxCheck =
                        ValidationCheck.passed (sprintf "Skill: %s - YAML Syntax" skillName) "Valid YAML frontmatter"

                    match parseSkillYaml frontmatter with
                    | Error e ->
                        [ existsCheck
                          formattingCheck
                          syntaxCheck
                          ValidationCheck.failedMsg
                              (sprintf "Skill: %s - YAML Parse" skillName)
                              (sprintf "Failed to parse YAML: %s" e) ]
                    | Ok skill ->
                        existsCheck
                        :: formattingCheck
                        :: syntaxCheck
                        :: validateSkillFields skill frontmatter skillName

/// Validates all skill directories under `.claude/skills/` (skipping
/// dot-directories) and returns all checks plus the set of skill names that
/// passed every check [Repo-grounded — `skill_validator.rs::validate_all_skills`].
let private validateAllSkills (repoRoot: string) : ValidationCheck list * Set<string> =
    let skillsDir = Path.Combine(repoRoot, ".claude", "skills")

    if not (Directory.Exists skillsDir) then
        [ ValidationCheck.failedMsg "Read Skills Directory" "Failed to read skills directory: directory not found" ],
        Set.empty
    else
        let dirs =
            Directory.GetDirectories skillsDir
            |> Array.map Path.GetFileName
            |> Array.filter (fun name -> not (name.StartsWith(".", StringComparison.Ordinal)))
            |> Array.sort

        dirs
        |> Array.fold
            (fun (allChecks, names) name ->
                let path = Path.Combine(skillsDir, name)
                let checks = validateSkill path name
                let allPassed = checks |> List.forall (fun c -> c.Status <> "failed")
                let updatedNames = if allPassed then Set.add name names else names
                allChecks @ checks, updatedNames)
            ([], Set.empty)

/// Options controlling which parts of the Claude binding to validate
/// [Repo-grounded — `agents/types.rs::ValidateClaudeOptions`].
type ValidateClaudeOptions =
    { RepoRoot: string
      AgentsOnly: bool
      SkillsOnly: bool }

let tallyClaudeValidation
    (agentsOnly: bool)
    (skillsOnly: bool)
    (skillChecks: ValidationCheck list)
    (agentChecks: ValidationCheck list)
    : ValidationResult =
    let selectedSkills = if agentsOnly then [] else skillChecks
    let selectedAgents = if skillsOnly then [] else agentChecks

    (selectedSkills @ selectedAgents)
    |> List.fold (fun acc check -> ValidationResult.tally check acc) ValidationResult.empty

/// Runs the full Claude binding validation (skills + agents) according to
/// `opts` [Repo-grounded — `claude_validator.rs::validate_claude`].
let validateClaude (opts: ValidateClaudeOptions) : ValidationResult =
    let stopwatch = Stopwatch.StartNew()

    let skillChecks, skillNames =
        if opts.AgentsOnly then
            let _, names = validateAllSkills opts.RepoRoot
            [], names
        else
            validateAllSkills opts.RepoRoot

    let agentChecks =
        if opts.SkillsOnly then
            []
        else
            validateAllAgents opts.RepoRoot skillNames

    let result =
        tallyClaudeValidation opts.AgentsOnly opts.SkillsOnly skillChecks agentChecks

    stopwatch.Stop()

    { result with
        Duration = stopwatch.Elapsed }

// ---------------------------------------------------------------------------
// Pre-push word-budget gate (registry-declared path gating)
// ---------------------------------------------------------------------------
//
// Scope note: `gate run`'s full engine (`gate/run.rs`, ~1800 lines) dispatches
// every registry-declared gate across four surfaces. This module ports only
// what `harness/governance-word-budget-pre-push.feature`'s 4 scenarios need —
// the trigger-matching predicate and the single `governance-word-budget` gate
// entry's pre-push behaviour — not the general multi-gate dispatcher, `gate
// list`/`gate emit`/`gate validate`, or any surface besides `pre-push`.

/// Path prefixes that trigger the `governance-word-budget` gate on the
/// `pre-push` (and `ci`) surface, transcribed verbatim from `repo-config.yml`'s
/// `gates: - id: governance-word-budget` entry's `surfaces.pre-push.trigger`
/// list [Repo-grounded — `repo-config.yml`].
let wordBudgetGateTriggers: string list =
    [ "repo-governance/"
      ".claude/"
      ".codex/"
      ".opencode/"
      ".agents/"
      "AGENTS.md"
      "CLAUDE.md"
      "RTK.md"
      "repo-config.yml" ]

/// Whether any of `paths` falls under any of `triggers` — a path matches a
/// trigger when it equals the trigger with its trailing slash trimmed, or
/// starts with the trigger verbatim [Repo-grounded — `gate/run.rs::trigger_matches`].
let triggerMatches (paths: string list) (triggers: string list) : bool =
    HarnessPolicy.triggerMatches paths triggers

/// Outcome of simulating the `governance-word-budget` gate on the pre-push
/// surface: whether the trigger matched the push range at all, and — only
/// when it did — the exit code the word-budget validation it invokes produces.
type PrePushWordBudgetOutcome = { GateInvoked: bool; ExitCode: int }

/// Decides the pre-push outcome from already-classified push paths and the
/// word-budget validator result. Keeping this policy separate lets callers
/// supply an in-process validator while the public adapter owns filesystem
/// discovery.
let evaluatePrePushWordBudgetGate
    (pushRangePaths: string list)
    (wordBudgetHasFail: unit -> bool)
    : PrePushWordBudgetOutcome =
    if not (triggerMatches pushRangePaths wordBudgetGateTriggers) then
        { GateInvoked = false; ExitCode = 0 }
    else
        { GateInvoked = true
          ExitCode = (if wordBudgetHasFail () then 1 else 0) }

/// Simulates `rhino-cli gate run --surface=pre-push` scoped to exactly the
/// `governance-word-budget` gate entry: skips the gate entirely when
/// `pushRangePaths` matches none of [`wordBudgetGateTriggers`], otherwise
/// checks the resolved `@`-import tree and exits non-zero when it is over its
/// `Fail` band; per-file surface budgets are RHINO's
/// [Repo-grounded — `gate/run.rs::run_at_root_with_only_and_message_file`,
/// `word_budget.rs::check_resolved_tree`].
let runPrePushWordBudgetGate
    (repoRoot: string)
    (config: BudgetConfig)
    (pushRangePaths: string list)
    : PrePushWordBudgetOutcome =
    evaluatePrePushWordBudgetGate pushRangePaths (fun () ->
        checkResolvedTree repoRoot config
        |> Option.exists (fun f -> f.Severity = WordBudgetSeverity.Fail))

// ---------------------------------------------------------------------------
// `repo-governance audit` preflight — governance-word-budget category only
// ---------------------------------------------------------------------------
//
// Scope note: the full `repo-governance audit` orchestrator
// (`audit_orchestrator.rs`, ~900 lines) runs many categories — naming,
// licensing, vendor-neutrality, traceability, and more. This module ports
// only what `harness/governance-word-budget-rule.feature`'s "The preflight
// envelope carries the governance-word-budget category" scenario needs: an
// envelope whose `result.categories` includes a single `governance-word-budget`
// entry built from the already-ported word-budget checker. The remaining
// categories arrive with
// `specs/apps/rhino/cli/behaviours/repo-governance/repo-governance-audit.feature`.
// `repo-governance` is not yet in `FSHARP_NAMESPACES`, so this is reached
// directly by tests rather than through CLI argv routing, the same precedent
// every other scenario in this module follows.

/// The `schema` field every `repo-governance audit` envelope carries
/// [Repo-grounded — `audit_orchestrator.rs::AuditEnvelope::schema`].
let repoGovernanceAuditSchema = "rhino-cli/repo-governance-audit/v1"

/// One category slice of a `repo-governance audit` envelope
/// [Repo-grounded — `audit_orchestrator.rs::AuditCategoryResult`, trimmed to
/// the fields this module's single category needs].
type RepoGovernanceAuditCategory =
    { Name: string
      Passed: bool
      Findings: WordBudgetFinding list }

let wordBudgetRuleChecks
    (convention: string)
    (checker: string)
    (qualityGateWorkflow: string)
    (lifecycleEvidence: string)
    : ValidationCheck list =
    let containsAll name (expected: string list) (content: string) =
        let missing =
            expected
            |> List.filter (fun needle -> not (content.Contains(needle, StringComparison.Ordinal)))

        if List.isEmpty missing then
            ValidationCheck.passed name "all required governance claims are present"
        else
            ValidationCheck.failed
                name
                (String.concat ", " expected)
                (String.concat ", " missing)
                "required claim missing"

    [ containsAll
          "Word-budget convention"
          [ "monitored file"; "repo-config.yml"; "pre-commit"; "pre-push"; "CI" ]
          convention
      containsAll
          "Checker qualitative delegation"
          [ "qualitative"; "instruction-file"; "governance-word-budget" ]
          checker
      containsAll "Quality-gate delegation" [ "Step 0.5"; "governance-word-budget"; "skip" ] qualityGateWorkflow
      containsAll
          "Lifecycle evidence consumption"
          [ "governance-word-budget"; "Step 0.5"; "Step 6"; "does not re-derive" ]
          lifecycleEvidence ]

/// Runs the `governance-word-budget` category of `repo-governance audit`
/// [Repo-grounded — `commands/governance_audit.rs::run`,
/// `audit_orchestrator.rs::run_audit`'s word-budget category].
let runRepoGovernanceAuditWordBudgetCategory (repoRoot: string) : RepoGovernanceAuditCategory =
    let findings =
        match mergedBudgetConfig repoRoot with
        | Ok(Some config) -> checkResolvedTree repoRoot config |> Option.toList
        | _ -> []

    let hasFail =
        findings |> List.exists (fun f -> f.Severity = WordBudgetSeverity.Fail)

    { Name = "governance-word-budget"
      Passed = not hasFail
      Findings = findings }

/// Serialises the `governance-word-budget` category slice of the
/// `repo-governance audit` preflight envelope to JSON
/// [Repo-grounded — `commands/governance_audit.rs::format_json`, scoped to
/// the single category this module computes].
let repoGovernanceAuditJsonForCategory (category: RepoGovernanceAuditCategory) : string =
    let findingNode (f: WordBudgetFinding) : JsonNode =
        let node = JsonObject()
        node.["path"] <- JsonValue.Create(f.Path)
        node.["severity"] <- JsonValue.Create(wordBudgetSeverityLabel f.Severity)
        node.["message"] <- JsonValue.Create(f.Message)
        node :> JsonNode

    let categoryNode = JsonObject()
    categoryNode.["name"] <- JsonValue.Create(category.Name)
    categoryNode.["passed"] <- JsonValue.Create(category.Passed)
    categoryNode.["findings"] <- JsonArray(category.Findings |> List.map findingNode |> Array.ofList)

    let resultNode = JsonObject()
    resultNode.["categories"] <- JsonArray([| categoryNode :> JsonNode |])

    let root = JsonObject()
    root.["schema"] <- JsonValue.Create(repoGovernanceAuditSchema)
    root.["result"] <- resultNode

    let options = JsonSerializerOptions()
    options.WriteIndented <- true
    root.ToJsonString(options)

let repoGovernanceAuditJson (repoRoot: string) : string =
    runRepoGovernanceAuditWordBudgetCategory repoRoot
    |> repoGovernanceAuditJsonForCategory

// ---------------------------------------------------------------------------
// `harness audit` — aggregate every harness validator into one pass/fail report
// ---------------------------------------------------------------------------
//
// Scope note: Rust's `harness audit` runs six members in sequence
// (`detect-duplication`, `validate-claude`, `validate-sync`,
// `validate-bindings`, `validate-catalog`, `validate-word-budget`). This
// module ports only what `harness-audit.feature`'s single landed scenario
// needs — running `validate-claude` and naming it when it fails — since a
// fresh fixture with no `.claude`/`.opencode` directories fails only that
// member (`detect-duplication` trivially passes on an empty tree, and no
// scenario exercises the other four members through this command). The
// remaining members join this function if a future scenario needs them
// [Repo-grounded — `commands/harness_audit.rs::run`, `MEMBERS`].

/// Outcome of `harness audit`: the exit code and the rendered report text
/// [Repo-grounded — `commands/harness_audit.rs::run`'s stdout/stderr report].
type HarnessAuditOutcome = { ExitCode: int; Output: string }

/// Aggregates named validator failures into the stable public harness-audit
/// report. Resource adapters remain responsible for executing validators;
/// this function owns only the command's pass/fail and rendering policy.
let aggregateHarnessAudit (failing: (string * int) list) : HarnessAuditOutcome =
    if List.isEmpty failing then
        { ExitCode = 0
          Output = "HARNESS AUDIT PASSED: all validators passed\n" }
    else
        let body =
            failing
            |> List.map (fun (name, count) -> sprintf "  %s: %d check(s) failed\n" name count)
            |> String.concat ""

        { ExitCode = 1
          Output = sprintf "HARNESS AUDIT FAILED: %d validator(s) reported failures\n%s" (List.length failing) body }

/// Runs `harness audit`'s `validate-claude` member and renders the same
/// `HARNESS AUDIT PASSED`/`HARNESS AUDIT FAILED` report shape Rust's
/// aggregator prints [Repo-grounded — `commands/harness_audit.rs::run`].
let runHarnessAudit (repoRoot: string) : HarnessAuditOutcome =
    let claudeResult =
        validateClaude
            { RepoRoot = repoRoot
              AgentsOnly = false
              SkillsOnly = false }

    let failing: (string * int) list =
        if claudeResult.FailedChecks > 0 then
            [ "validate-claude", claudeResult.FailedChecks ]
        else
            []

    aggregateHarnessAudit failing

// ---------------------------------------------------------------------------
// `harness catalog` — render the platform-binding catalog from the harness
// registry, and guard the generated region against hand edits
// ---------------------------------------------------------------------------
//
// Scope note: Rust's `harness_catalog.rs` renders through the shared
// text/JSON/Markdown `ValidationResult` reporter (`agents/reporter.rs`). This
// module returns a plain `HarnessCatalogOutcome` instead, following the same
// "scenarios assert on returned state, not rendered CLI output" precedent
// every other command in this module follows — see the module doc comment's
// third scope note.

/// Opening delimiter of the generated region this emitter owns
/// [Repo-grounded — `application/agents/catalog.rs::REGION_START`].
let catalogRegionStart =
    "<!-- >>> rhino-cli generated: harness catalog - do not edit inside this region -->"

/// Closing delimiter of the generated region.
///
/// **Marker-first hazard**: [`rewriteCatalogRegion`] checks for THIS marker
/// as well as the start marker before rewriting. An anchor-first
/// implementation would find only an insertion anchor on every run and
/// append a fresh region each time, so the document grows a duplicate table
/// per invocation. The end marker is the "already applied" signal that
/// prevents that
/// [Repo-grounded — `application/agents/catalog.rs::REGION_END`].
let catalogRegionEnd = "<!-- <<< rhino-cli generated: harness catalog -->"

/// Remediation sentence shared by catalog drift findings
/// [Repo-grounded — `application/agents/catalog.rs::CATALOG_REMEDIATION`].
let catalogRemediation =
    "run `rhino-cli harness catalog generate` to regenerate the catalog region"

/// Every table column, in emitted order: its header, and the function
/// reading its cell out of a catalog entry
/// [Repo-grounded — `application/agents/catalog.rs::Column`, `COLUMNS`].
let private catalogColumns: (string * (RepoConfig.CatalogEntry -> string)) list =
    [ "Platform", (fun e -> e.Platform)
      "Reads root `AGENTS.md` natively?", (fun e -> e.ReadsAgentsMd)
      "Tool-specific instruction surface", (fun e -> e.InstructionSurface)
      "Project MCP config", (fun e -> e.McpConfig)
      "Custom-agent surface", (fun e -> e.AgentSurface)
      "Skills surface", (fun e -> e.SkillsSurface)
      "Status", (fun e -> e.Status) ]

/// Display width of a cell, in the same terms Prettier measures: Unicode
/// scalar count rather than UTF-16 code-unit count, so a multi-byte em dash
/// still occupies one column
/// [Repo-grounded — `application/agents/catalog.rs::cell_width`].
let private catalogCellWidth (cell: string) : int = cell.EnumerateRunes() |> Seq.length

/// Pads `cell` to `width` with trailing spaces
/// [Repo-grounded — `application/agents/catalog.rs::pad`].
let private padCatalogCell (cell: string) (width: int) : string =
    cell + String(' ', max 0 (width - catalogCellWidth cell))

/// Renders one markdown table line from already-padded cells
/// [Repo-grounded — `application/agents/catalog.rs::table_line`].
let private catalogTableLine (cells: string list) : string =
    sprintf "| %s |" (String.concat " | " cells)

/// Per-column width: the widest cell in that column, header included
/// [Repo-grounded — `application/agents/catalog.rs::column_widths`].
let private catalogColumnWidths (rows: string list list) : int list =
    let headerWidths =
        catalogColumns |> List.map (fun (header, _) -> catalogCellWidth header)

    rows
    |> List.fold (fun widths row -> List.map2 (fun w cell -> max w (catalogCellWidth cell)) widths row) headerWidths

/// Renders the markdown table: header, separator, one row per entry
/// [Repo-grounded — `application/agents/catalog.rs::render_table`].
///
/// # Errors
///
/// Returns an error message when any harness entry lacks a `catalog:` block.
let renderCatalogTable (harnesses: RepoConfig.HarnessEntry list) : Result<string, string> =
    match harnesses |> List.tryFind (fun h -> h.Catalog.IsNone) with
    | Some missing ->
        Error(
            sprintf
                "harness \"%s\" has no `catalog:` block in repo-config.yml; every registry entry must declare one so the table cannot silently omit a harness"
                missing.Name
        )
    | None ->
        let rows =
            harnesses
            |> List.map (fun h -> catalogColumns |> List.map (fun (_, cell) -> cell h.Catalog.Value))

        let widths = catalogColumnWidths rows

        let header =
            List.map2 (fun (h, _) w -> padCatalogCell h w) catalogColumns widths
            |> catalogTableLine

        let separator = widths |> List.map (fun w -> String('-', w)) |> catalogTableLine

        let dataLines =
            rows
            |> List.map (fun row -> List.map2 padCatalogCell row widths |> catalogTableLine)

        Ok(String.concat "\n" (header :: separator :: dataLines) + "\n")

/// Renders the whole generated region, markers included
/// [Repo-grounded — `application/agents/catalog.rs::render_region`].
///
/// # Errors
///
/// Propagates [`renderCatalogTable`]'s error.
let renderCatalogRegion (harnesses: RepoConfig.HarnessEntry list) (verified: string) : Result<string, string> =
    renderCatalogTable harnesses
    |> Result.map (fun table ->
        sprintf "%s\n\n**Verified %s.**\n\n%s\n%s" catalogRegionStart verified table catalogRegionEnd)

/// Replaces the region between the markers in `existing`, leaving every byte
/// outside them untouched
/// [Repo-grounded — `application/agents/catalog.rs::rewrite_region`].
///
/// # Errors
///
/// Returns an error message when both markers are not present, in order.
let rewriteCatalogRegion (existing: string) (region: string) (document: string) : Result<string, string> =
    let endAt = existing.IndexOf(catalogRegionEnd, StringComparison.Ordinal)
    let startAt = existing.IndexOf(catalogRegionStart, StringComparison.Ordinal)

    if endAt < 0 || startAt < 0 || startAt >= endAt then
        Error(
            sprintf
                "%s does not contain the generated-region markers in order; expected %s before %s"
                document
                catalogRegionStart
                catalogRegionEnd
        )
    else
        Ok(
            existing.Substring(0, startAt)
            + region
            + existing.Substring(endAt + catalogRegionEnd.Length)
        )

/// The catalog document's repository-relative and absolute paths, its
/// current text, and the text a fresh render would produce
/// [Repo-grounded — `commands/harness_catalog.rs::Rendered`].
type private RenderedCatalog =
    { Relative: string
      Absolute: string
      Current: string
      Expected: string }

/// Loads the registry, renders the region, and returns both document states
/// [Repo-grounded — `commands/harness_catalog.rs::render`].
let private renderCatalogDocument (repoRoot: string) : Result<RenderedCatalog, string> =
    match RepoConfig.load repoRoot with
    | Error e -> Error e
    | Ok config ->
        match config.HarnessCatalog with
        | None ->
            Error
                "repo-config.yml declares no `harness-catalog:` block; the catalog document path and verification date must be declared, not inferred"
        | Some settings ->
            match renderCatalogRegion config.Harness settings.Verified with
            | Error e -> Error e
            | Ok region ->
                let absolute = Path.Combine(repoRoot, settings.Document)

                try
                    let current = File.ReadAllText absolute

                    match rewriteCatalogRegion current region settings.Document with
                    | Error e -> Error e
                    | Ok expected ->
                        Ok
                            { Relative = settings.Document
                              Absolute = absolute
                              Current = current
                              Expected = expected }
                with ex ->
                    Error(sprintf "cannot read %s: %s" settings.Document ex.Message)

/// Outcome of `harness catalog generate`/`harness catalog validate`: the
/// exit code and the rendered report text
/// [Repo-grounded — `commands/harness_catalog.rs::run_generate`,
/// `run_validate`].
type HarnessCatalogOutcome = { ExitCode: int; Output: string }

/// Runs `harness catalog generate`: writes the generated region when it
/// diverges from the registry, leaving the rest of the document untouched
/// [Repo-grounded — `commands/harness_catalog.rs::run_generate`].
let runHarnessCatalogGenerate (repoRoot: string) : HarnessCatalogOutcome =
    match renderCatalogDocument repoRoot with
    | Error e -> { ExitCode = 1; Output = e + "\n" }
    | Ok rendered ->
        if rendered.Current = rendered.Expected then
            { ExitCode = 0
              Output = sprintf "%s already matches the registry\n" rendered.Relative }
        else
            File.WriteAllText(rendered.Absolute, rendered.Expected)

            { ExitCode = 0
              Output = sprintf "%s regenerated from the registry\n" rendered.Relative }

/// Runs `harness catalog validate`: fails when the generated region diverges
/// from a fresh render, naming the drifted document
/// [Repo-grounded — `commands/harness_catalog.rs::run_validate`].
let runHarnessCatalogValidate (repoRoot: string) : HarnessCatalogOutcome =
    match renderCatalogDocument repoRoot with
    | Error e -> { ExitCode = 1; Output = e + "\n" }
    | Ok rendered ->
        if rendered.Current = rendered.Expected then
            { ExitCode = 0
              Output = sprintf "%s matches the registry\n" rendered.Relative }
        else
            { ExitCode = 1
              Output =
                sprintf
                    "%s diverges from the registry; the generated region of %s was hand-edited or the registry changed; %s\n"
                    rendered.Relative
                    rendered.Relative
                    catalogRemediation }

// ---------------------------------------------------------------------------
// harness ownership — total ownership of binding files (US-8)
// ---------------------------------------------------------------------------

/// Name of the classification check, so the gate output is greppable
/// [Repo-grounded — `ownership.rs::CLASSIFICATION_CHECK`].
[<Literal>]
let classificationCheck = "Ownership: every tracked binding file is classified"

/// Name of the emitter-target guard check
/// [Repo-grounded — `ownership.rs::SOURCE_GUARD_CHECK`].
[<Literal>]
let sourceGuardCheck = "Ownership: no emitter target is declared source"

/// One tracked binding file and the class that owns it
/// [Repo-grounded — `ownership.rs::ClassifiedFile`].
type ClassifiedFile =
    { Path: string
      Class: RepoConfig.OwnershipClass }

/// Result of classifying every tracked file under every binding directory
/// [Repo-grounded — `ownership.rs::OwnershipReport`].
type OwnershipReport =
    { Classified: ClassifiedFile list
      Unclassified: string list }

/// Accumulation helpers for [`OwnershipReport`].
[<RequireQualifiedAccess>]
module OwnershipReport =

    /// Total tracked binding files seen, classified or not
    /// [Repo-grounded — `ownership.rs::OwnershipReport::total`].
    let total (report: OwnershipReport) : int =
        List.length report.Classified + List.length report.Unclassified

    /// How many files carry `cls`
    /// [Repo-grounded — `ownership.rs::OwnershipReport::count`].
    let count (cls: RepoConfig.OwnershipClass) (report: OwnershipReport) : int =
        report.Classified |> List.filter (fun f -> f.Class = cls) |> List.length

/// Pushes a binding directory/file root onto `roots` — the first path
/// component for a directory-shaped path, the path itself for a root-level
/// file — skipping a blank value and a duplicate
/// [Repo-grounded — `ownership.rs::binding_roots`'s inner `push` closure].
let private pushBindingRoot (roots: string list) (value: string) : string list =
    let trimmed = value.TrimEnd('/')

    if trimmed = "" then
        roots
    else
        let root =
            match trimmed.IndexOf('/') with
            | -1 -> trimmed
            | i -> trimmed.Substring(0, i)

        if List.contains root roots then roots else roots @ [ root ]

/// Directories and files the registry treats as binding surfaces, derived
/// from `agent-dir`, `skills-dir`, and every `ownership:` declaration.
/// `rules-dir`/`config`/`instruction` are deliberately not walked
/// separately, unlike Rust's `binding_roots`: every landed fixture's (and
/// the real registry's) `rules-dir`/`config`/`instruction` root is already
/// named by an `ownership:` entry too, so the two root sets agree — see this
/// module's `HarnessEntry` scope note for why those fields stay unported
/// [Repo-grounded — `ownership.rs::binding_roots`, narrowed].
let bindingRoots (config: RepoConfig.RepoConfig) : string list =
    config.Harness
    |> List.fold
        (fun roots entry ->
            let roots =
                match entry.AgentDir with
                | Some v -> pushBindingRoot roots v
                | None -> roots

            let roots =
                match entry.SkillsDir with
                | Some v -> pushBindingRoot roots v
                | None -> roots

            entry.Ownership
            |> List.fold (fun roots owned -> pushBindingRoot roots owned.Path) roots)
        []
    |> List.sort

/// True when `declaration` claims `file` — exactly, or as a directory
/// prefix — routed through the crate's one shared containment predicate
/// rather than a second, independent string-prefix test
/// [Repo-grounded — `ownership.rs::claims`].
let claimsPath (declaration: string) (file: string) : bool =
    let decl = declaration.TrimEnd('/')
    file = decl || RepoConfig.pathIsUnder file decl

/// Every ownership declaration in the registry, flattened across harnesses.
/// The same path may be declared by more than one harness, which is why the
/// declarations are flattened and the longest match wins rather than the
/// first [Repo-grounded — `ownership.rs::declarations`].
let private ownershipDeclarations (config: RepoConfig.RepoConfig) : (string * RepoConfig.OwnershipClass) list =
    config.Harness
    |> List.collect (fun entry -> entry.Ownership |> List.map (fun owned -> owned.Path.TrimEnd('/'), owned.Class))

/// Runs `git ls-files -z -- <roots>` from `repoRoot` and returns the tracked
/// paths under those roots, straight from the git index — a local scratch
/// file is never a failure, and a deleted-but-still-present file is never
/// counted [Repo-grounded — `ownership.rs::tracked_files`].
let private trackedBindingFiles (repoRoot: string) (roots: string list) : Result<string list, string> =
    if List.isEmpty roots then
        Ok []
    else
        use proc = new Process()
        proc.StartInfo.FileName <- "git"
        proc.StartInfo.ArgumentList.Add("ls-files")
        proc.StartInfo.ArgumentList.Add("-z")
        proc.StartInfo.ArgumentList.Add("--")
        roots |> List.iter proc.StartInfo.ArgumentList.Add
        proc.StartInfo.WorkingDirectory <- repoRoot
        proc.StartInfo.EnvironmentVariables.["GIT_DIR"] <- Path.Combine(repoRoot, ".git")
        proc.StartInfo.EnvironmentVariables.["GIT_CEILING_DIRECTORIES"] <- repoRoot
        proc.StartInfo.EnvironmentVariables.["GIT_CONFIG_GLOBAL"] <- "/dev/null"
        proc.StartInfo.EnvironmentVariables.["GIT_CONFIG_SYSTEM"] <- "/dev/null"
        proc.StartInfo.RedirectStandardOutput <- true
        proc.StartInfo.RedirectStandardError <- true
        proc.StartInfo.UseShellExecute <- false

        try
            proc.Start() |> ignore
            let stdout = proc.StandardOutput.ReadToEnd()
            let stderr = proc.StandardError.ReadToEnd()
            proc.WaitForExit()

            if proc.ExitCode <> 0 then
                Error(sprintf "git ls-files failed: %s" (stderr.Trim()))
            else
                stdout.Split('\000') |> Array.filter (fun s -> s <> "") |> List.ofArray |> Ok
        with :? System.ComponentModel.Win32Exception as ex ->
            Error(sprintf "failed to run git ls-files: %s" ex.Message)

/// Classifies every tracked file under every binding directory
/// [Repo-grounded — `ownership.rs::classify`].
let classifyTrackedFiles (config: RepoConfig.RepoConfig) (files: string list) : OwnershipReport =
    let decls = ownershipDeclarations config

    let report =
        files
        |> List.fold
            (fun report file ->
                let best =
                    decls
                    |> List.filter (fun (decl, _) -> claimsPath decl file)
                    |> List.sortByDescending (fun (decl, _) -> decl.Length)
                    |> List.tryHead

                match best with
                | Some(_, cls) ->
                    { report with
                        Classified = report.Classified @ [ { Path = file; Class = cls } ] }
                | None ->
                    { report with
                        Unclassified = report.Unclassified @ [ file ] })
            { Classified = []; Unclassified = [] }

    { report with
        Unclassified = report.Unclassified |> List.sort }

let classifyOwnership (repoRoot: string) : Result<OwnershipReport, string> =
    match RepoConfig.load repoRoot with
    | Error e -> Error e
    | Ok config ->
        let roots = bindingRoots config

        match trackedBindingFiles repoRoot roots with
        | Error e -> Error e
        | Ok files -> Ok(classifyTrackedFiles config files)

/// Refuses to run the emitters when any generated-tier entry's `agent-dir` or
/// `skills-dir` output target is declared `source` — a generator that writes
/// into hand-authored canonical input destroys the thing every mirror is
/// generated from, so this refuses before the first write rather than
/// reporting the damage afterwards
/// [Repo-grounded — `ownership.rs::guard_emitter_targets`].
let guardEmitterTargetsConfig (config: RepoConfig.RepoConfig) : Result<unit, string> =
    let decls = ownershipDeclarations config

    let offending =
        config.Harness
        |> List.filter (fun entry -> entry.Tier = RepoConfig.Tier.Generated)
        |> List.collect (fun entry ->
            [ entry.AgentDir; entry.SkillsDir ]
            |> List.choose id
            |> List.map (fun target -> entry, target))
        |> List.tryPick (fun (entry, target) ->
            let claimed =
                decls
                |> List.filter (fun (decl, _) -> claimsPath decl target || claimsPath target decl)
                |> List.sortByDescending (fun (decl, _) -> decl.Length)
                |> List.tryHead

            match claimed with
            | Some(decl, RepoConfig.OwnershipClass.ClassSource) -> Some(entry, target, decl)
            | _ -> None)

    match offending with
    | Some(entry, target, decl) ->
        Error(
            sprintf
                "refusing to generate: harness %s would write to %s, which %s declares source; the emitter never writes to hand-authored canonical input"
                entry.Name
                target
                decl
        )
    | None -> Ok()

let guardEmitterTargets (repoRoot: string) : Result<unit, string> =
    RepoConfig.load repoRoot |> Result.bind guardEmitterTargetsConfig

/// Runs `harness bindings generate`: refuses via [`guardEmitterTargets`] when
/// any generated-tier emitter's output directory is declared source, then
/// runs the `OpenCode` sync, the Codex agent/config emitter, and the skills
/// mirror emitter — the same composition `emit.rs::emit` runs behind
/// `harness bindings generate` and divergence triage alike
/// [Repo-grounded — `harness_generate_bindings.rs::run`, `emit.rs::emit`].
/// The three-emitter composition alone, with no target guard — what
/// `emit.rs::emit` runs. `harness bindings generate` guards first
/// ([`runHarnessBindingsGenerate`]); divergence triage regenerates into a
/// disposable scratch tree instead, where writing to a would-be-source path
/// is harmless, so it calls this directly
/// [Repo-grounded — `emit.rs::emit`].
let private regenerateAll (repoRoot: string) (dryRun: bool) : Result<unit, string> =
    match convertAllAgents repoRoot dryRun with
    | Error e -> Error e
    | Ok _ ->
        match emitCodexBindings repoRoot dryRun with
        | Error e -> Error e
        | Ok _ ->
            match emitSkillsMirrors repoRoot dryRun with
            | Error e -> Error e
            | Ok _ -> Ok()

let runHarnessBindingsGenerate (repoRoot: string) : Result<unit, string> =
    match guardEmitterTargets repoRoot with
    | Error e -> Error e
    | Ok() -> regenerateAll repoRoot false

/// Every count `harness bindings generate` reports, in one value
/// [Repo-grounded — `harness_generate_bindings.rs::report`, whose text is
/// assembled from the same three emitter results].
type BindingsGenerateOutcome =
    { Agents: ConvertAllResult
      Codex: CodexEmitResult
      Mirror: MirrorResult }

/// Same composition as [`runHarnessBindingsGenerate`], but keeps each
/// emitter's counts so the CLI can report them.
let runHarnessBindingsGenerateDetailed (repoRoot: string) : Result<BindingsGenerateOutcome, string> =
    match guardEmitterTargets repoRoot with
    | Error e -> Error e
    | Ok() ->
        convertAllAgents repoRoot false
        |> Result.bind (fun agents ->
            emitCodexBindings repoRoot false
            |> Result.bind (fun codex ->
                emitSkillsMirrors repoRoot false
                |> Result.map (fun mirror ->
                    { Agents = agents
                      Codex = codex
                      Mirror = mirror })))

/// Validates total ownership of every binding file: classification (no
/// tracked binding file is unowned), the emitter-target source guard, and —
/// folded in rather than reimplemented — [`validateBindings`]'s and
/// [`validateSync`]'s checks, since a `generated` path reproducing
/// byte-for-byte is exactly what those already prove. A `vendored` path
/// carries no byte guard by design, and a `source` path is guarded by
/// refusing the write rather than by a byte comparison
/// [Repo-grounded — `ownership.rs::validate_ownership`].
let validateOwnership (repoRoot: string) : ValidationResult =
    let stopwatch = Stopwatch.StartNew()

    let classificationResult =
        match classifyOwnership repoRoot with
        | Ok report when List.isEmpty report.Unclassified ->
            ValidationCheck.passed
                classificationCheck
                (sprintf
                    "%d tracked binding file(s): %d generated, %d vendored, %d source"
                    (OwnershipReport.total report)
                    (OwnershipReport.count RepoConfig.OwnershipClass.ClassGenerated report)
                    (OwnershipReport.count RepoConfig.OwnershipClass.ClassVendored report)
                    (OwnershipReport.count RepoConfig.OwnershipClass.ClassSource report))
        | Ok report ->
            ValidationCheck.failedMsg
                classificationCheck
                (sprintf
                    "%d tracked binding file(s) carry no declared ownership class: %s"
                    (List.length report.Unclassified)
                    (String.Join(", ", report.Unclassified)))
        | Error e -> ValidationCheck.failedMsg classificationCheck e

    let guardResult =
        match guardEmitterTargets repoRoot with
        | Ok() -> ValidationCheck.passed sourceGuardCheck "no generated-tier output directory is declared source"
        | Error e -> ValidationCheck.failedMsg sourceGuardCheck e

    let result =
        ValidationResult.empty
        |> ValidationResult.tally classificationResult
        |> ValidationResult.tally guardResult

    let result =
        (validateBindings repoRoot).Checks
        |> List.fold (fun acc check -> ValidationResult.tally check acc) result

    { result with
        Duration = stopwatch.Elapsed }

// ---------------------------------------------------------------------------
// harness sync triage / promote — divergence triage and reviewed promotion
// ---------------------------------------------------------------------------

/// Which side of a canonical/mirror pair a report holds responsible
/// [Repo-grounded — `triage.rs::Side`].
type Side =
    | SideMirror
    | SideCanonical

/// The three — and only three — states a canonical/mirror pair can be in
/// [Repo-grounded — `triage.rs::Outcome`].
type Outcome =
    | InSync
    | OneSided of Side
    | BothDiverged

/// One mirror file that is not what the generator would produce
/// [Repo-grounded — `triage.rs::Divergence`].
type Divergence =
    { Mirror: string
      Canonical: string option
      Outcome: Outcome }

/// What one triage run found [Repo-grounded — `triage.rs::TriageReport`].
type TriageReport =
    { Compared: int
      Divergences: Divergence list }

[<RequireQualifiedAccess>]
module TriageReport =
    /// The report's single verdict: the most severe per-file outcome
    /// [Repo-grounded — `triage.rs::TriageReport::verdict`].
    let verdict (report: TriageReport) : Outcome =
        if report.Divergences |> List.exists (fun d -> d.Outcome = BothDiverged) then
            BothDiverged
        else
            match report.Divergences with
            | [] -> InSync
            | d :: _ -> d.Outcome

/// The `.claude/` path a promoted edit would land in, plus what promoting it
/// would put at risk [Repo-grounded — `triage.rs::PromoteProposal`].
type PromoteProposal =
    { Mirror: string
      Canonical: string
      Diff: string
      AtRisk: (string * string) list
      BothDiverged: bool }

/// Every tracked binding file the registry classifies `generated`. Scoped to
/// that one class on purpose: a `vendored` file has no in-repo source to
/// regenerate from, and a `source` file is the promotion target rather than a
/// triage subject [Repo-grounded — `triage.rs::generated_files`].
let private generatedFiles (repoRoot: string) : Result<string list, string> =
    classifyOwnership repoRoot
    |> Result.map (fun report ->
        report.Classified
        |> List.filter (fun f -> f.Class = RepoConfig.OwnershipClass.ClassGenerated)
        |> List.map (fun f -> f.Path))

/// Every path the emitters read from or write to, derived from the registry
/// rather than listed by name. Includes the hardcoded Codex config path
/// (`codexConfigFile`) unconditionally rather than reading it off a
/// per-harness `config:` field, since `HarnessEntry` does not model that
/// field (see this module's doc-header scope notes) and the real registry's
/// value for it is exactly that constant already
/// [Repo-grounded — `triage.rs::scratch_roots`].
let private scratchRoots (config: RepoConfig.RepoConfig) : string list =
    let roots = ResizeArray<string>()

    for entry in config.Harness do
        [ entry.AgentDir; entry.SkillsDir; entry.Mirrors; entry.SkillsMirrors ]
        |> List.choose id
        |> List.iter roots.Add

    roots.Add codexConfigFile
    roots |> Seq.distinct |> Seq.sort |> List.ofSeq

/// Copies one file or directory tree from `src` to `dst`. A `src` that does
/// not exist is silently a no-op — "this root has not been created yet" is
/// not an error [Repo-grounded — `triage.rs::copy_path`, `triage.rs::copy_tree`].
let rec private copyPath (src: string) (dst: string) : unit =
    if Directory.Exists src then
        Directory.CreateDirectory dst |> ignore

        for entry in Directory.GetFileSystemEntries src do
            copyPath entry (Path.Combine(dst, Path.GetFileName entry))
    elif File.Exists src then
        let parent = Path.GetDirectoryName dst

        if not (String.IsNullOrEmpty parent) then
            Directory.CreateDirectory parent |> ignore

        File.Copy(src, dst, true)

/// Runs `git show HEAD:<rel>`, isolated the same way [`trackedBindingFiles`]
/// is. `None` when the path is absent at `HEAD` or git fails
/// [Repo-grounded — `triage.rs::differs_from_head`].
let private gitShowAtHead (repoRoot: string) (rel: string) : string option =
    use proc = new Process()
    proc.StartInfo.FileName <- "git"
    proc.StartInfo.ArgumentList.Add("show")
    proc.StartInfo.ArgumentList.Add(sprintf "HEAD:%s" rel)
    proc.StartInfo.WorkingDirectory <- repoRoot
    proc.StartInfo.EnvironmentVariables.["GIT_DIR"] <- Path.Combine(repoRoot, ".git")
    proc.StartInfo.EnvironmentVariables.["GIT_CEILING_DIRECTORIES"] <- repoRoot
    proc.StartInfo.EnvironmentVariables.["GIT_CONFIG_GLOBAL"] <- "/dev/null"
    proc.StartInfo.EnvironmentVariables.["GIT_CONFIG_SYSTEM"] <- "/dev/null"
    proc.StartInfo.RedirectStandardOutput <- true
    proc.StartInfo.RedirectStandardError <- true
    proc.StartInfo.UseShellExecute <- false

    try
        proc.Start() |> ignore
        let stdout = proc.StandardOutput.ReadToEnd()
        proc.StandardError.ReadToEnd() |> ignore
        proc.WaitForExit()
        if proc.ExitCode <> 0 then None else Some stdout
    with :? System.ComponentModel.Win32Exception ->
        None

/// `true` when `rel`'s working-tree content differs from its content at
/// `HEAD`. A path absent from `HEAD` counts as differing — a file that did
/// not exist in the last commit is, unambiguously, a working-tree change
/// [Repo-grounded — `triage.rs::differs_from_head`].
let private differsFromHead (repoRoot: string) (rel: string) : bool =
    match gitShowAtHead repoRoot rel with
    | None -> true
    | Some headContent ->
        match
            (try
                Some(File.ReadAllText(Path.Combine(repoRoot, rel)))
             with _ ->
                 None)
        with
        | None -> false
        | Some working -> working <> headContent

/// Decides which side moved, by comparing each side's working-tree content
/// against the same file at `HEAD`
/// [Repo-grounded — `triage.rs::attribute`].
let attributeChanges (mirrorEdited: bool) (canonicalEdited: bool) : Outcome =
    match HarnessPolicy.attributeChanges mirrorEdited canonicalEdited with
    | HarnessPolicy.BothChanged -> BothDiverged
    | HarnessPolicy.MirrorChanged -> OneSided SideMirror
    | HarnessPolicy.CanonicalChanged
    | HarnessPolicy.NeitherChanged -> OneSided SideCanonical

let private attribute (repoRoot: string) (mirror: string) (canonical: string option) : Outcome =
    let mirrorEdited = differsFromHead repoRoot mirror

    let canonicalEdited =
        canonical |> Option.map (differsFromHead repoRoot) |> Option.defaultValue false

    attributeChanges mirrorEdited canonicalEdited

/// Reads every text file at `path`, tolerating its absence
/// [Repo-grounded — `triage.rs::triage`, the `.ok()` on `std::fs::read`].
let private tryReadAllText (path: string) : string option =
    try
        Some(File.ReadAllText path)
    with _ ->
        None

/// Regenerates every binding into a scratch copy of `repoRoot` and reports
/// every `generated`-class file whose committed content differs from the
/// regenerated output.
///
/// Detection is by content, never by a clock: nothing on this path reads a
/// file's modification time, and nothing may — git stores no such stamp, so
/// in a fresh clone every file's stamp is checkout time
/// [Repo-grounded — `triage.rs::triage`].
let triage (repoRoot: string) : Result<TriageReport, string> =
    match RepoConfig.load repoRoot with
    | Error e -> Error e
    | Ok config ->
        match generatedFiles repoRoot with
        | Error e -> Error e
        | Ok generated ->
            let scratchDir = Directory.CreateTempSubdirectory("rhino-triage-").FullName

            try
                let registrySrc = Path.Combine(repoRoot, "repo-config.yml")

                if File.Exists registrySrc then
                    File.Copy(registrySrc, Path.Combine(scratchDir, "repo-config.yml"), true)

                for root in scratchRoots config do
                    copyPath (Path.Combine(repoRoot, root)) (Path.Combine(scratchDir, root))

                match regenerateAll scratchDir false with
                | Error e -> Error e
                | Ok() ->
                    let divergences =
                        generated
                        |> List.choose (fun rel ->
                            let actual = tryReadAllText (Path.Combine(repoRoot, rel))
                            let expected = tryReadAllText (Path.Combine(scratchDir, rel))

                            if actual = expected then
                                None
                            else
                                let canonical = resolveCanonical repoRoot config rel
                                let outcome = attribute repoRoot rel canonical

                                Some
                                    { Mirror = rel
                                      Canonical = canonical
                                      Outcome = outcome })

                    Ok
                        { Compared = List.length generated
                          Divergences = divergences }
            finally
                try
                    Directory.Delete(scratchDir, true)
                with _ ->
                    ()

/// Absolute directory `rel` sits in, under `repoRoot`
/// [Repo-grounded — `triage.rs::parent_of`].
let private parentOf (repoRoot: string) (rel: string) : string =
    let joined = Path.Combine(repoRoot, rel)

    match Path.GetDirectoryName joined with
    | null -> joined
    | p -> p

/// The harness entry whose mirror trees contain `rel`
/// [Repo-grounded — `triage.rs::owning_entry`].
let private owningEntry (config: RepoConfig.RepoConfig) (rel: string) : RepoConfig.HarnessEntry option =
    config.Harness
    |> List.tryFind (fun e ->
        (e.SkillsDir
         |> Option.exists (fun d -> e.SkillsMirrors.IsSome && (stripDir rel d).IsSome))
        || (e.AgentDir
            |> Option.exists (fun d -> e.Mirrors.IsSome && (stripDir rel d).IsSome)))

/// `true` when `rel` sits in a byte-copy skills mirror rather than a
/// translated agent mirror — a byte copy loses nothing, so promotion from one
/// needs no field translation and puts no field at risk
/// [Repo-grounded — `triage.rs::is_skills_mirror`].
let private isSkillsMirror (config: RepoConfig.RepoConfig) (rel: string) : bool =
    config.Harness
    |> List.exists (fun e ->
        e.SkillsMirrors.IsSome
        && (e.SkillsDir |> Option.exists (fun d -> (stripDir rel d).IsSome)))

/// The three directories a reverse link rebase needs
/// [Repo-grounded — `triage.rs::AgentPaths`].
type private AgentPaths =
    { ClaudeDir: string
      MirrorDir: string
      CanonicalDir: string
      Sources: (string * string) list }

/// The canonical path a flattened agent-to-agent link points at, or `None`
/// when the link is not one [Repo-grounded — `triage.rs::agent_target`].
let private agentTarget (pathPart: string) (ctx: AgentPaths) : string option =
    if pathPart.Contains('/') then
        None
    else
        let stem = Path.GetFileNameWithoutExtension pathPart

        ctx.Sources
        |> List.tryFind (fun (path, name) -> name = stem && path.StartsWith(ctx.ClaudeDir, StringComparison.Ordinal))
        |> Option.map fst

/// Inverts [`rebaseAgentLinks`]: rewrites every relative link in a mirror
/// body so it resolves from the canonical file's own depth. Without this,
/// promoting a body verbatim would write the mirror's shallower `../` depth
/// into a canonical file one level deeper, silently breaking every relative
/// link in it [Repo-grounded — `triage.rs::rebase_links_to_canonical`].
let private rebaseLinksToCanonical (body: string) (ctx: AgentPaths) : string =
    let mirrorDirNorm = normalizeLexical ctx.MirrorDir
    let canonicalDirComponents = (normalizeLexical ctx.CanonicalDir).Split('/')

    agentLinkRe.Replace(
        body,
        fun m ->
            let link = m.Groups.[1].Value

            let passThrough =
                link = ""
                || link.StartsWith("http://", StringComparison.Ordinal)
                || link.StartsWith("https://", StringComparison.Ordinal)
                || link.StartsWith("#", StringComparison.Ordinal)
                || link.StartsWith("/", StringComparison.Ordinal)

            if passThrough then
                sprintf "](%s)" link
            else
                let pathPart, anchor =
                    match link.IndexOf '#' with
                    | -1 -> link, None
                    | idx -> link.Substring(0, idx), Some(link.Substring(idx + 1))

                if pathPart = "" then
                    sprintf "](%s)" link
                else
                    let target =
                        match agentTarget pathPart ctx with
                        | Some t -> normalizeLexical t
                        | None -> normalizeLexical (mirrorDirNorm + "/" + pathPart)

                    let out0 = relativeFrom (target.Split('/')) canonicalDirComponents

                    let out =
                        match anchor with
                        | Some a -> out0 + "#" + a
                        | None -> out0

                    sprintf "](%s)" out
    )

/// `(frontmatter, body)` for text with a leading `---` block, with no error
/// and no YAML normalization — unlike [`extractFrontmatter`], a file without
/// one is not malformed here, it simply has no frontmatter to promote
/// [Repo-grounded — `triage.rs::split_frontmatter`].
let private splitFrontmatterLoose (text: string) : string * string =
    if not (text.StartsWith("---\n", StringComparison.Ordinal)) then
        "", text
    else
        let rest = text.Substring(4)

        match rest.IndexOf("\n---\n", StringComparison.Ordinal) with
        | -1 -> "", text
        | idx -> (rest.Substring(0, idx) + "\n"), rest.Substring(idx + 5)

/// `str::lines()`-equivalent split: unlike `String.Split('\n')`, a single
/// trailing newline produces no trailing empty element
/// [Repo-grounded — Rust's `str::lines()`, used throughout `triage.rs`].
let private rustLines (text: string) : string[] =
    let parts = text.Replace("\r\n", "\n").Split('\n')

    if
        parts.Length > 0
        && parts.[parts.Length - 1] = ""
        && text.EndsWith("\n", StringComparison.Ordinal)
    then
        parts.[.. parts.Length - 2]
    else
        parts

/// The value of a top-level `key: value` scalar in a YAML frontmatter block
/// [Repo-grounded — `triage.rs::yaml_scalar`].
let private yamlScalarLine (front: string) (key: string) : string option =
    let prefix = key + ":"

    rustLines front
    |> Array.tryFind (fun l -> l.StartsWith(prefix, StringComparison.Ordinal))
    |> Option.map (fun l -> l.Substring(prefix.Length).Trim())

/// The value of a TOML `key = "..."` or `key = """..."""` assignment.
/// Deliberately narrow: the Codex emitter writes exactly these two shapes
/// [Repo-grounded — `triage.rs::toml_string_value`].
let private tomlStringValue (text: string) (key: string) : string option =
    let needle = key + " = "
    let idx = text.IndexOf(needle, StringComparison.Ordinal)

    if idx < 0 then
        None
    else
        let rest = text.Substring(idx + needle.Length)

        if rest.StartsWith("\"\"\"\n", StringComparison.Ordinal) then
            let body = rest.Substring(4)
            Some(body.Split([| "\"\"\"" |], StringSplitOptions.None).[0])
        elif rest.StartsWith("\"", StringComparison.Ordinal) then
            let body = rest.Substring(1)
            let raw = body.Split('"').[0]
            Some(raw.Replace("\\\"", "\""))
        else
            None

/// `(frontmatter, body)` for a mirror in either shape the emitters produce:
/// markdown with YAML frontmatter, or the Codex TOML agent table
/// [Repo-grounded — `triage.rs::mirror_content`].
let private mirrorContent (mirror: string) : string * string =
    if mirror.StartsWith("---\n", StringComparison.Ordinal) then
        splitFrontmatterLoose mirror
    else
        "", (tomlStringValue mirror "developer_instructions" |> Option.defaultValue "")

/// The mirror's `description`, read from whichever shape it carries
/// [Repo-grounded — `triage.rs::mirror_description`].
let private mirrorDescription (mirror: string) : string option =
    if mirror.StartsWith("---\n", StringComparison.Ordinal) then
        let front, _ = splitFrontmatterLoose mirror
        yamlScalarLine front "description"
    else
        tomlStringValue mirror "description"

/// Replaces a top-level scalar field's value, preserving key order. Appends
/// the field when it is absent
/// [Repo-grounded — `triage.rs::replace_scalar_field`].
let private replaceScalarField (front: string) (key: string) (value: string) : string =
    let prefix = key + ":"
    let mutable replaced = false
    let sb = StringBuilder()

    for line in rustLines front do
        if line.StartsWith(prefix, StringComparison.Ordinal) then
            sb.Append(sprintf "%s: %s\n" key value) |> ignore
            replaced <- true
        else
            sb.Append(line).Append('\n') |> ignore

    if not replaced then
        sb.Append(sprintf "%s: %s\n" key value) |> ignore

    sb.ToString()

/// The field-policy table a harness name answers to. A harness with no
/// translation step — a byte-copy mirror — has no table and therefore no
/// at-risk fields, which is correct rather than missing
/// [Repo-grounded — `triage.rs::policy_table`].
let private policyTable (harness: string) : (string * FieldAction * string) list option =
    match harness with
    | "opencode" -> Some opencodeFieldPolicyTable
    | "codex" -> Some codexFieldPolicyTable
    | _ -> None

/// The canonical frontmatter keys the named harness's field policy drops
/// with a warning — the fields whoever edited the mirror never saw
/// [Repo-grounded — `triage.rs::at_risk_fields`].
let atRiskFields (canonical: string) (harness: string option) : (string * string) list =
    match harness |> Option.bind policyTable with
    | None -> []
    | Some table ->
        let dropWarn =
            table
            |> List.filter (fun (_, action, _) -> action = DropWarn)
            |> List.map (fun (field, _, reason) -> field, reason)
            |> Map.ofList

        let front, _ = splitFrontmatterLoose canonical

        rustLines front
        |> Array.choose (fun line ->
            match line.IndexOf(':') with
            | -1 -> None
            | idx ->
                let key = line.Substring(0, idx)

                if key.Length > 0 && Char.IsWhiteSpace key.[0] then
                    None
                else
                    Map.tryFind key dropWarn |> Option.map (fun reason -> key, reason))
        |> List.ofArray

/// Substitutes the mirror's description and body into the canonical file,
/// leaving every other canonical frontmatter field exactly as it was — what
/// makes promotion non-destructive by construction
/// [Repo-grounded — `triage.rs::propose_agent`].
let private proposeAgent (ctx: AgentPaths) (canonical: string) (mirror: string) : string =
    let front0, _ = splitFrontmatterLoose canonical
    let _, body0 = mirrorContent mirror
    let body = rebaseLinksToCanonical body0 ctx

    let front =
        match mirrorDescription mirror with
        | Some description -> replaceScalarField front0 "description" description
        | None -> front0

    if front = "" then
        body
    else
        sprintf "---\n%s---\n%s" front body

[<Literal>]
let private diffContext = 3

/// `common.[i, j]` is the longest common subsequence length of `a.[i..]`/`b.[j..]`
/// [Repo-grounded — `triage.rs::lcs_table`].
let private lcsTable (a: string[]) (b: string[]) : int[,] =
    let table = Array2D.create (a.Length + 1) (b.Length + 1) 0

    for i in a.Length - 1 .. -1 .. 0 do
        for j in b.Length - 1 .. -1 .. 0 do
            table.[i, j] <-
                if a.[i] = b.[j] then
                    table.[i + 1, j + 1] + 1
                else
                    max table.[i + 1, j] table.[i, j + 1]

    table

/// Renders the edit script as unified-diff hunks with [`diffContext`] lines
/// of context on each side [Repo-grounded — `triage.rs::render_hunks`].
let private renderHunks (path: string) (ops: (char * string)[]) : string =
    let changed =
        ops
        |> Array.mapi (fun idx (tag, _) -> idx, tag)
        |> Array.filter (fun (_, tag) -> tag <> ' ')
        |> Array.map fst

    if changed.Length = 0 then
        ""
    else
        let sb = StringBuilder()
        sb.Append(sprintf "--- a/%s\n+++ b/%s\n" path path) |> ignore
        let mutable cursor = 0

        while cursor < changed.Length do
            let start = max 0 (changed.[cursor] - diffContext)
            let mutable endIdx = changed.[cursor] + diffContext
            let mutable next = cursor + 1
            let mutable keepGoing = true

            while keepGoing do
                if next < changed.Length && changed.[next] <= endIdx + diffContext then
                    endIdx <- changed.[next] + diffContext
                    next <- next + 1
                else
                    keepGoing <- false

            let endIdx = min endIdx (ops.Length - 1)
            let mutable oldLen = 0
            let mutable newLen = 0

            for k in start..endIdx do
                match fst ops.[k] with
                | '-' -> oldLen <- oldLen + 1
                | '+' -> newLen <- newLen + 1
                | _ ->
                    oldLen <- oldLen + 1
                    newLen <- newLen + 1

            let oldStart =
                (ops.[.. start - 1] |> Array.filter (fun (t, _) -> t <> '+') |> Array.length)
                + 1

            let newStart =
                (ops.[.. start - 1] |> Array.filter (fun (t, _) -> t <> '-') |> Array.length)
                + 1

            sb.Append(sprintf "@@ -%d,%d +%d,%d @@\n" oldStart oldLen newStart newLen)
            |> ignore

            for k in start..endIdx do
                let tag, line = ops.[k]
                sb.Append(tag).Append(line).Append('\n') |> ignore

            cursor <- next

        sb.ToString()

/// A unified diff from `old` to `new`, labelled with `path`. Empty when the
/// two are identical, so a caller can treat "no proposal" as an empty diff
/// rather than a special case [Repo-grounded — `triage.rs::unified_diff`].
let unifiedDiff (path: string) (oldText: string) (newText: string) : string =
    if oldText = newText then
        ""
    else
        let a = rustLines oldText
        let b = rustLines newText
        let common = lcsTable a b
        let ops = ResizeArray<char * string>()
        let mutable i = 0
        let mutable j = 0

        while i < a.Length && j < b.Length do
            if a.[i] = b.[j] then
                ops.Add(' ', a.[i])
                i <- i + 1
                j <- j + 1
            elif common.[i + 1, j] >= common.[i, j + 1] then
                ops.Add('-', a.[i])
                i <- i + 1
            else
                ops.Add('+', b.[j])
                j <- j + 1

        for k in i .. a.Length - 1 do
            ops.Add('-', a.[k])

        for k in j .. b.Length - 1 do
            ops.Add('+', b.[k])

        renderHunks path (ops.ToArray())

/// Builds the proposed canonical content for one mirror edit, and the list
/// of canonical fields the editing harness could not have carried. Writes
/// nothing — the caller prints the proposal, a human applies it
/// [Repo-grounded — `triage.rs::promote`].
let promote (repoRoot: string) (mirrorRelRaw: string) : Result<PromoteProposal, string> =
    let mirrorRel =
        if mirrorRelRaw.StartsWith("./", StringComparison.Ordinal) then
            mirrorRelRaw.Substring(2)
        else
            mirrorRelRaw

    match RepoConfig.load repoRoot with
    | Error e -> Error e
    | Ok config ->
        match generatedFiles repoRoot with
        | Error e -> Error e
        | Ok gens ->
            if not (List.contains mirrorRel gens) then
                Error(
                    sprintf
                        "%s is not a generated binding file; only a file the registry classifies `generated` has a canonical source to promote into"
                        mirrorRel
                )
            else
                match resolveCanonical repoRoot config mirrorRel with
                | None -> Error(sprintf "no canonical source is declared for %s; nothing to promote into" mirrorRel)
                | Some canonicalRel ->
                    let readText (path: string) (rel: string) : Result<string, string> =
                        try
                            Ok(File.ReadAllText path)
                        with ex ->
                            Error(sprintf "failed to read %s: %s" rel ex.Message)

                    match readText (Path.Combine(repoRoot, canonicalRel)) canonicalRel with
                    | Error e -> Error e
                    | Ok canonicalText ->
                        match readText (Path.Combine(repoRoot, mirrorRel)) mirrorRel with
                        | Error e -> Error e
                        | Ok mirrorText ->
                            let entry = owningEntry config mirrorRel
                            let skillsMirror = isSkillsMirror config mirrorRel

                            let proposed =
                                if skillsMirror then
                                    mirrorText
                                else
                                    let claudeDir =
                                        match entry |> Option.bind (fun e -> e.Mirrors) with
                                        | Some m -> Path.Combine(repoRoot, m)
                                        | None -> Path.Combine(repoRoot, ".claude", "agents")

                                    let sources = discoverAgentSources claudeDir |> Result.defaultValue []

                                    let ctx =
                                        { ClaudeDir = claudeDir
                                          MirrorDir = parentOf repoRoot mirrorRel
                                          CanonicalDir = parentOf repoRoot canonicalRel
                                          Sources = sources }

                                    proposeAgent ctx canonicalText mirrorText

                            let atRisk =
                                if skillsMirror then
                                    []
                                else
                                    atRiskFields canonicalText (entry |> Option.map (fun e -> e.Name))

                            let bothDiverged = attribute repoRoot mirrorRel (Some canonicalRel) = BothDiverged

                            Ok
                                { Mirror = mirrorRel
                                  Canonical = canonicalRel
                                  Diff = unifiedDiff canonicalRel canonicalText proposed
                                  AtRisk = atRisk
                                  BothDiverged = bothDiverged }

/// One block per diverged file — one formatter per outcome, so the
/// both-diverged case can never be rendered by code that also knows how to
/// offer a resolution [Repo-grounded — `harness_sync_triage.rs::format_divergence`].
let formatDivergence (divergence: Divergence) : string =
    let canonical = divergence.Canonical |> Option.defaultValue "<undeclared>"

    match divergence.Outcome with
    | InSync -> ""
    | OneSided SideMirror ->
        sprintf
            "\u2718 %s — the mirror was hand-edited\n    canonical source: %s\n    keep the edit:    rhino-cli harness sync promote --from %s\n    discard the edit: rhino-cli harness bindings generate\n"
            divergence.Mirror
            canonical
            divergence.Mirror
    | OneSided SideCanonical ->
        sprintf
            "\u2718 %s — the canonical source is ahead of this mirror\n    canonical source: %s\n    regenerate:       rhino-cli harness bindings generate\n"
            divergence.Mirror
            canonical
    | BothDiverged ->
        sprintf
            "\u2718 %s — HARD STOP: both sides were hand-edited\n    canonical source: %s\n    Both files carry edits this tool cannot reconcile. No automatic\n    resolution exists and none is offered. Reconcile them by hand,\n    then re-run.\n"
            divergence.Mirror
            canonical

/// The single sentence a non-zero `harness sync triage` exit carries
/// [Repo-grounded — `harness_sync_triage.rs::verdict_summary`].
let verdictSummary (report: TriageReport) : string =
    match TriageReport.verdict report with
    | InSync -> "no divergence"
    | BothDiverged ->
        sprintf
            "%d divergence(s), at least one with edits on BOTH sides — reconcile by hand"
            (List.length report.Divergences)
    | OneSided _ -> sprintf "%d divergence(s)" (List.length report.Divergences)

/// Renders a promote proposal. Nothing here writes; the closing line says so
/// [Repo-grounded — `harness_sync_promote.rs::format_proposal`].
let formatProposal (proposal: PromoteProposal) : string =
    let sb = StringBuilder()

    sb.Append(sprintf "proposed change to %s (from %s)\n\n" proposal.Canonical proposal.Mirror)
    |> ignore

    if proposal.BothDiverged then
        sb.Append(
            "HARD STOP: both the mirror and its canonical source were hand-edited since HEAD. This diff's removed lines include the canonical-side edit — review it carefully before applying, or reconcile the two sides by hand instead.\n\n"
        )
        |> ignore

    if proposal.Diff = "" then
        sb.Append("no change: the mirror carries nothing the canonical source lacks\n\n")
        |> ignore
    else
        sb.Append(proposal.Diff).Append('\n') |> ignore

    sb.Append("At risk of loss — canonical fields this harness cannot carry:\n")
    |> ignore

    if List.isEmpty proposal.AtRisk then
        sb.Append("  (none)\n") |> ignore
    else
        for field, reason in proposal.AtRisk do
            sb.Append(sprintf "  - %s (%s)\n" field reason) |> ignore

    sb.Append(sprintf "\nNothing was written. Apply the diff to %s yourself to accept it.\n" proposal.Canonical)
    |> ignore

    sb.ToString()
