/// Port of the slice of the Rust `repo_config` namespace needed by the
/// scenarios in
/// `specs/apps/rhino/cli/behaviours/repo-config/data-driven.feature`
/// and
/// `specs/apps/rhino/cli/behaviours/repo-config-validate/repo-config-validate.feature`,
/// and `specs/apps/rhino/cli/behaviours/harness/harness-catalog.feature`
/// [Repo-grounded — `apps/rhino-cli/src/application/repo_config/mod.rs`,
/// `apps/rhino-cli/src/commands/repo_config_validate.rs`].
///
/// Scope note: the Rust `RepoConfig` schema is a ~40-field struct covering
/// gate wiring, env contracts, word budgets, and the full Doctor tool
/// roster. This port models only `harness[].{name,tier,agent-dir,mirrors,
/// forbid-dir,skills-dir,skills-mirrors,vendored,catalog,ownership}`,
/// `gates[].{id,args}`, `doctor.dotnet-global-json`, and `harness-catalog.{document,verified}` —
/// the fields these three feature files' scenarios read — and deserializes
/// the rest of the document with
/// `IgnoreUnmatchedProperties` rather than Rust's `deny_unknown_fields`, so
/// every other real `repo-config.yml` key is silently accepted rather than
/// schema-validated. `harness[]` and `harness[].ownership[]` are the
/// exception: `checkNoUnknownHarnessKeys` below independently walks the raw
/// YAML structure to reject an unknown key in either, since the
/// repo-config-validate scenarios exercise exactly that. Widening this
/// strictness to the rest of the schema is future work for later waves.
module RhinoCli.Application.RepoConfig

open System
open System.Collections.Generic
open System.Diagnostics.CodeAnalysis
open System.IO
open System.Text.Json
open YamlDotNet.RepresentationModel
open YamlDotNet.Serialization
open YamlDotNet.Serialization.NamingConventions

/// The two binding tiers a harness entry may declare
/// [Repo-grounded — `repo_config/mod.rs::Tier`].
type Tier =
    | Source
    | Generated

/// The three ownership classes a binding path may declare in a harness
/// entry's `ownership:` list — named `Class*` rather than reusing `Tier`'s
/// `Source`/`Generated` case names, which would otherwise collide under a
/// single `open RhinoCli.Application.RepoConfig`
/// [Repo-grounded — `repo_config/mod.rs::OwnershipClass`].
type OwnershipClass =
    | ClassSource
    | ClassGenerated
    | ClassVendored

/// One entry in a harness entry's `ownership:` list, declaring which of the
/// three classes above a single binding path belongs to, and — for a
/// `vendored` path — why it is exempt from regeneration
/// [Repo-grounded — `repo_config/mod.rs::OwnershipEntry`].
type OwnershipEntry =
    { Path: string
      Class: OwnershipClass
      Reason: string option }

/// One harness's row in the generated platform-binding catalog table, read
/// from a harness entry's `catalog:` block
/// [Repo-grounded — `repo_config/mod.rs::CatalogEntry`].
type CatalogEntry =
    { Platform: string
      ReadsAgentsMd: string
      InstructionSurface: string
      McpConfig: string
      AgentSurface: string
      SkillsSurface: string
      Status: string }

/// One harness entry in the `harness:` section of `repo-config.yml`, trimmed
/// to the fields the codex-entry, three-harness-registry, and
/// repo-config-validate scenarios read
/// [Repo-grounded — `repo_config/mod.rs::HarnessEntry`].
type HarnessEntry =
    {
        Name: string
        Tier: Tier
        AgentDir: string option
        Mirrors: string option
        ForbidDir: string option
        SkillsDir: string option
        SkillsMirrors: string option
        Vendored: string list
        /// Capability grade -> this harness's model identifier. Empty when the
        /// harness declares no `model-map:`, which is what tells the emitter to
        /// write no `model` key at all rather than to guess one.
        ModelMap: Map<string, string>
        Catalog: CatalogEntry option
        Ownership: OwnershipEntry list
    }

/// Whether a gate validates or mutates repository content
/// [Repo-grounded — `repo_config/mod.rs::GateType`].
type GateType =
    | Check
    | Mutation

/// Command runner for a gate [Repo-grounded — `repo_config/mod.rs::GateKind`].
type GateKind =
    | RhinoCli
    | External
    | Nx

/// Execution wiring for a check gate
/// [Repo-grounded — `repo_config/mod.rs::GateWiring`].
type GateWiring =
    | Matrix
    | HandWired

/// A composition-rule exemption for a gate
/// [Repo-grounded — `repo_config/mod.rs::GateCarveOut`].
type GateCarveOut = StagedOnly

/// A gate execution surface
/// [Repo-grounded — `repo_config/mod.rs::GateSurface`].
type GateSurface =
    | CommitMsg
    | PreCommit
    | PrePush
    | Ci

/// Optional tool-neutral process wrapper for a complete gate surface run.
/// The configured command receives `Args`, followed by the current Rhino CLI
/// executable and its exact `gate run` argument vector. `ActiveEnv` is set by
/// the wrapper for its child and prevents recursive re-entry.
type GateSurfaceGuard =
    { Command: string
      Args: string list
      ActiveEnv: string }

/// The scope that determines a gate's inputs on a surface
/// [Repo-grounded — `repo_config/mod.rs::ScopeKind`].
type ScopeKind =
    | AffectedFileType
    | AllFileType
    | AffectedProjects
    | AllProjects
    | Other
    | PathGated

/// A gate's scope on one execution surface
/// [Repo-grounded — `repo_config/mod.rs::SurfaceScope`].
type SurfaceScope =
    { Scope: ScopeKind
      Glob: string option
      Globs: string list
      LintStagedShell: string option
      Trigger: string list }

/// One entry in the `gates:` registry of `repo-config.yml`
/// [Repo-grounded — `repo_config/mod.rs::GateEntry`].
type GateEntry =
    { Id: string
      GateType: GateType
      Command: string
      Kind: GateKind
      DoctorTools: string list
      Wiring: GateWiring option
      Restages: bool
      Args: Map<string, string list>
      Surfaces: (GateSurface * SurfaceScope) list
      CarveOut: GateCarveOut option
      Verifies: string option
      Category: string option
      CiGroup: string option }

/// Every tool identifier Doctor compiles in. Configuration may extend it —
/// `doctorToolInventoryFor` resolves the full set, and that resolved set, not
/// this list, is the authoritative validation source for per-gate
/// `doctor-tools` metadata
/// [Repo-grounded — `repo_config/mod.rs::DOCTOR_TOOL_INVENTORY`].
let builtinDoctorToolInventory: string list =
    [ "git"
      "volta"
      "node"
      "npm"
      "rust"
      "cargo-llvm-cov"
      "dotnet"
      "docker"
      "jq"
      "shellcheck"
      "hadolint"
      "actionlint"
      "playwright"
      "shfmt"
      "tofu"
      "clang-format" ]

/// Flattens a gate's declared `args` map into the ordered `--key value`
/// argument list a generated command appends
/// [Repo-grounded — `repo_config/mod.rs::fixed_arguments`].
///
/// Rust holds `args` in a `BTreeMap`, so iteration is by key; F#'s `Map` is
/// ordered the same way.
let fixedArguments (gate: GateEntry) : string list =
    gate.Args
    |> Map.toList
    |> List.collect (fun (key, values) -> values |> List.collect (fun value -> [ sprintf "--%s" key; value ]))

/// Which stream a configured tool writes its version banner to. `java
/// -version` writes to stderr, so a stdout-only probe would report an
/// installed JDK as missing; every built-in tool writes to stdout.
type DoctorVersionStream =
    | StdoutStream
    | StderrStream

/// A Doctor tool declared in `repo-config.yml` rather than compiled in.
/// Carries everything a built-in tool definition carries: what to run, which
/// stream to read, what version is required, and how to install it per
/// package manager.
type DoctorExtraTool =
    {
        Name: string
        Binary: string
        VersionArgs: string list
        VersionStream: DoctorVersionStream
        RequiredVersion: string
        /// Package manager (`brew`, `apt`) -> the full argv to run, command
        /// first. Doctor maps `darwin` to `brew` and `linux` to `apt`.
        Install: Map<string, string list>
    }

/// The `doctor:` section, trimmed to the .NET SDK path scenario's field plus
/// `skip-tools` (needed by
/// `specs/apps/rhino/cli/behaviours/system/doctor.feature`'s "A
/// repo-config-declared tool is skipped from the check" scenario) and
/// `extra-tools` (needed by its "A repo-config-declared extra tool is probed
/// like a built-in tool" scenario)
/// [Repo-grounded — `repo_config/mod.rs::DoctorConfig`].
type DoctorConfig =
    { DotnetGlobalJson: string option
      SkipTools: string list
      ExtraTools: DoctorExtraTool list }

/// One project permitted to bind a loopback socket in its Integration tests.
/// The allowlist is an opt-in for a socket the test itself owns; it is never a
/// licence to reach an external network, which stays forbidden at every layer
/// below E2E
/// [Repo-grounded — `repo-governance/development/infra/nx-targets/mandatory-targets-integration-tests.md`].
type IntegrationLoopbackEntry = { Project: string; Reason: string }

/// Document-level settings for the generated platform-binding catalog: where
/// it lives, and the date its claims were last verified against upstream
/// [Repo-grounded — `repo_config/mod.rs::HarnessCatalog`].
type HarnessCatalog = { Document: string; Verified: string }

/// Parsed `repo-config.yml`, trimmed to this port's scope (see module doc
/// comment) [Repo-grounded — `repo_config/mod.rs::RepoConfig`].
type RepoConfig =
    {
        Harness: HarnessEntry list
        Gates: GateEntry list
        GateSurfaceGuards: Map<GateSurface, GateSurfaceGuard>
        Doctor: DoctorConfig
        /// Capability grade -> the reasoning effort its agents declare.
        ModelGrades: Map<string, string>
        HarnessCatalog: HarnessCatalog option
        /// Projects allowed an owned loopback socket in `test:integration`.
        IntegrationLoopback: IntegrationLoopbackEntry list
    }

/// The value `load`/`loadOptional` never produce on their own but that
/// `loadOrDefault` falls back to on any load failure
/// [Repo-grounded — `repo_config/mod.rs::RepoConfig`'s `#[derive(Default)]`].
let empty: RepoConfig =
    { Harness = []
      Gates = []
      GateSurfaceGuards = Map.empty
      Doctor =
        { DotnetGlobalJson = None
          SkipTools = []
          ExtraTools = [] }
      ModelGrades = Map.empty
      HarnessCatalog = None
      IntegrationLoopback = [] }

/// The Doctor tool inventory `config` actually exposes: the compiled-in tools
/// plus every tool declared under `doctor.extra-tools`. A configuration that
/// declares none resolves to exactly `builtinDoctorToolInventory`, which is
/// what makes this split a no-op until a tool is declared.
let doctorToolInventoryFor (config: RepoConfig) : string list =
    builtinDoctorToolInventory
    @ (config.Doctor.ExtraTools |> List.map (fun tool -> tool.Name))

/// Raw YAML-shaped intermediate records. `[<CLIMutable>]` gives each record a
/// parameterless constructor and settable properties, which is what lets
/// YamlDotNet's reflection-based object builder populate an otherwise
/// immutable F# record — the same trick used for `System.Text.Json` DTOs,
/// applied here to YamlDotNet instead.
///
/// Deliberately NOT `private`: a `private` F# type's compiler-generated
/// constructor is non-public even with `[<CLIMutable>]`, and YamlDotNet's
/// default reflection-based object factory only ever calls
/// `Activator.CreateInstance(type)` (the public-constructor overload) — the
/// same pitfall `Convention.fs`'s module doc comment warns about for
/// `System.Text.Json`, reproduced here for YamlDotNet instead. These DTOs are
/// still excluded from this module's public surface indirectly: nothing
/// outside `parseRepoConfig` ever constructs or returns one.
[<CLIMutable>]
type OwnershipEntryDto =
    { Path: string
      Class: string
      Reason: string | null }

[<CLIMutable>]
type CatalogEntryDto =
    { Platform: string
      ReadsAgentsMd: string
      InstructionSurface: string
      McpConfig: string
      AgentSurface: string
      SkillsSurface: string
      Status: string }

[<CLIMutable>]
type HarnessEntryDto =
    { Name: string
      Tier: string
      AgentDir: string | null
      Mirrors: string | null
      ForbidDir: string | null
      SkillsDir: string | null
      SkillsMirrors: string | null
      Vendored: ResizeArray<string>
      ModelMap: Dictionary<string, string>
      Catalog: CatalogEntryDto
      Ownership: ResizeArray<OwnershipEntryDto> }

[<CLIMutable>]
type SurfaceScopeDto =
    { Scope: string
      Glob: string | null
      Globs: ResizeArray<string>
      LintStagedShell: string | null
      Trigger: ResizeArray<string> }

/// Enum-valued fields arrive as raw strings so an unknown variant is reported
/// by [`gateEnumFindings`] with the same wording, allowed-value list, and
/// source position serde produces, rather than as a bare deserializer fault.
[<CLIMutable>]
type GateEntryDto =
    { Id: string
      Type: string | null
      Command: string | null
      Kind: string | null
      DoctorTools: ResizeArray<string>
      Wiring: string | null
      Restages: bool
      Args: Dictionary<string, ResizeArray<string>>
      Surfaces: Dictionary<string, SurfaceScopeDto>
      CarveOut: string | null
      Verifies: string | null
      Category: string | null
      CiGroup: string | null }

[<CLIMutable>]
type GateSurfaceGuardDto =
    { Command: string | null
      Args: ResizeArray<string>
      ActiveEnv: string | null }

[<CLIMutable>]
type DoctorExtraToolDto =
    { Name: string | null
      Binary: string | null
      VersionArgs: ResizeArray<string>
      VersionStream: string | null
      RequiredVersion: string | null
      Install: Dictionary<string, ResizeArray<string>> }

[<CLIMutable>]
type DoctorConfigDto =
    { DotnetGlobalJson: string | null
      SkipTools: ResizeArray<string>
      ExtraTools: ResizeArray<DoctorExtraToolDto> }

[<CLIMutable>]
type HarnessCatalogDto = { Document: string; Verified: string }

[<CLIMutable>]
type ModelGradeDto = { Effort: string | null }

[<CLIMutable>]
type IntegrationLoopbackEntryDto =
    { Project: string | null
      Reason: string | null }

[<CLIMutable>]
type RepoConfigDto =
    { Harness: ResizeArray<HarnessEntryDto>
      Gates: ResizeArray<GateEntryDto>
      GateSurfaceGuards: Dictionary<string, GateSurfaceGuardDto>
      Doctor: DoctorConfigDto
      ModelGrades: Dictionary<string, ModelGradeDto>
      HarnessCatalog: HarnessCatalogDto
      IntegrationLoopback: ResizeArray<IntegrationLoopbackEntryDto> }

/// Matches `repo-config.yml`'s kebab-case keys (`agent-dir`,
/// `dotnet-global-json`, ...) against the DTOs' PascalCase properties without
/// per-property `[<YamlMember>]` attributes, and tolerates every real
/// `repo-config.yml` key this port does not model (see module doc comment).
let private deserializer: IDeserializer =
    DeserializerBuilder().WithNamingConvention(HyphenatedNamingConvention.Instance).IgnoreUnmatchedProperties().Build()

/// A `null` YAML mapping and an absent one are the same thing here: a harness
/// that declares no map.
let private toOptionMap (items: Dictionary<string, string>) : Map<string, string> =
    match items with
    | null -> Map.empty
    | items -> items |> Seq.map (fun kv -> kv.Key, kv.Value) |> Map.ofSeq

let private toOptionList (items: ResizeArray<'a>) : 'a list =
    match items with
    | null -> []
    | items -> List.ofSeq items

/// Folds a list of `Result`s into a single `Result` of a list, short
/// -circuiting on the first `Error` — small enough here that pulling in a
/// railway-oriented-programming library for one caller would cost more than
/// it saves.
let rec private sequenceResults (results: Result<'a, string> list) : Result<'a list, string> =
    match results with
    | [] -> Ok []
    | Error e :: _ -> Error e
    | Ok x :: rest ->
        match sequenceResults rest with
        | Ok xs -> Ok(x :: xs)
        | Error e -> Error e

let private parseTier (index: int) (raw: string) : Result<Tier, string> =
    match raw with
    | null -> Error(sprintf "harness[%d].tier: required key is missing" index)
    | "source" -> Ok Source
    | "generated" -> Ok Generated
    | other ->
        Error(sprintf "harness[%d].tier: invalid value \"%s\" (expected \"source\" or \"generated\")" index other)

/// Parses one `ownership[].class` value
/// [Repo-grounded — `repo_config/mod.rs::OwnershipClass`'s `Deserialize`
/// impl].
let private parseOwnershipClass
    (harnessIndex: int)
    (ownershipIndex: int)
    (raw: string)
    : Result<OwnershipClass, string> =
    match raw with
    | null -> Error(sprintf "harness[%d].ownership[%d].class: required key is missing" harnessIndex ownershipIndex)
    | "source" -> Ok ClassSource
    | "generated" -> Ok ClassGenerated
    | "vendored" -> Ok ClassVendored
    | other ->
        Error(
            sprintf
                "harness[%d].ownership[%d].class: invalid value \"%s\" (expected \"source\", \"generated\", or \"vendored\")"
                harnessIndex
                ownershipIndex
                other
        )

let private toOwnershipEntry
    (harnessIndex: int)
    (ownershipIndex: int)
    (dto: OwnershipEntryDto)
    : Result<OwnershipEntry, string> =
    parseOwnershipClass harnessIndex ownershipIndex dto.Class
    |> Result.map (fun cls ->
        { Path = dto.Path
          Class = cls
          Reason = Option.ofObj dto.Reason })

let private toCatalogEntry (dto: CatalogEntryDto) : CatalogEntry =
    { Platform = dto.Platform
      ReadsAgentsMd = dto.ReadsAgentsMd
      InstructionSurface = dto.InstructionSurface
      McpConfig = dto.McpConfig
      AgentSurface = dto.AgentSurface
      SkillsSurface = dto.SkillsSurface
      Status = dto.Status }

let private toHarnessEntry (index: int) (dto: HarnessEntryDto) : Result<HarnessEntry, string> =
    parseTier index dto.Tier
    |> Result.bind (fun tier ->
        toOptionList dto.Ownership
        |> List.mapi (toOwnershipEntry index)
        |> sequenceResults
        |> Result.map (fun ownership ->
            { Name = dto.Name
              Tier = tier
              AgentDir = Option.ofObj dto.AgentDir
              Mirrors = Option.ofObj dto.Mirrors
              ForbidDir = Option.ofObj dto.ForbidDir
              SkillsDir = Option.ofObj dto.SkillsDir
              SkillsMirrors = Option.ofObj dto.SkillsMirrors
              Vendored = toOptionList dto.Vendored
              ModelMap = toOptionMap dto.ModelMap
              Catalog =
                match box dto.Catalog with
                | null -> None
                | _ -> Some(toCatalogEntry dto.Catalog)
              Ownership = ownership }))

/// Kebab-case spellings, in the declaration order serde lists them in its
/// "expected one of" message.
let private gateTypeNames = [ "check", Check; "mutation", Mutation ]

let private gateKindNames =
    [ "rhino-cli", RhinoCli; "external", External; "nx", Nx ]

let private gateWiringNames = [ "matrix", Matrix; "hand-wired", HandWired ]
let private gateCarveOutNames = [ "staged-only", StagedOnly ]

let private gateSurfaceNames =
    [ "commit-msg", CommitMsg
      "pre-commit", PreCommit
      "pre-push", PrePush
      "ci", Ci ]

let private scopeKindNames =
    [ "affected-file-type", AffectedFileType
      "all-file-type", AllFileType
      "affected-projects", AffectedProjects
      "all-projects", AllProjects
      "other", Other
      "path-gated", PathGated ]

let private lookupVariant (table: (string * 'a) list) (raw: string) : 'a option =
    table |> List.tryFind (fst >> (=) raw) |> Option.map snd

let private isPortableEnvironmentVariableName (value: string) : bool =
    let isInitial character =
        Char.IsAsciiLetter character || character = '_'

    let isRemaining character =
        Char.IsAsciiLetterOrDigit character || character = '_'

    not (String.IsNullOrEmpty value)
    && isInitial value.[0]
    && (value |> Seq.skip 1 |> Seq.forall isRemaining)

let private toGateSurfaceGuard
    (surfaceName: string)
    (dto: GateSurfaceGuardDto)
    : Result<GateSurface * GateSurfaceGuard, string> =
    match lookupVariant gateSurfaceNames surfaceName with
    | None -> Error(sprintf "gate-surface-guards.%s: unknown gate surface" surfaceName)
    | Some surface ->
        let command = Option.ofObj dto.Command |> Option.defaultValue ""
        let activeEnv = Option.ofObj dto.ActiveEnv |> Option.defaultValue ""
        let args = toOptionList dto.Args

        if String.IsNullOrWhiteSpace command then
            Error(sprintf "gate-surface-guards.%s.command: must not be blank" surfaceName)
        elif command <> command.Trim() then
            Error(sprintf "gate-surface-guards.%s.command: must not carry leading or trailing whitespace" surfaceName)
        elif String.IsNullOrWhiteSpace activeEnv then
            Error(sprintf "gate-surface-guards.%s.active-env: must not be blank" surfaceName)
        elif not (isPortableEnvironmentVariableName activeEnv) then
            Error(sprintf "gate-surface-guards.%s.active-env: must be a valid environment variable name" surfaceName)
        else
            match args |> List.tryFindIndex isNull with
            | Some index -> Error(sprintf "gate-surface-guards.%s.args[%d]: must be a string" surfaceName index)
            | None ->
                Ok(
                    surface,
                    { Command = command
                      Args = args
                      ActiveEnv = activeEnv }
                )

let private toGateSurfaceGuards
    (dtos: Dictionary<string, GateSurfaceGuardDto>)
    : Result<Map<GateSurface, GateSurfaceGuard>, string> =
    match dtos with
    | null -> Ok Map.empty
    | entries ->
        entries
        |> Seq.map (fun kv -> toGateSurfaceGuard kv.Key kv.Value)
        |> List.ofSeq
        |> sequenceResults
        |> Result.map Map.ofList

let private toSurfaceScope (dto: SurfaceScopeDto) : SurfaceScope =
    { Scope = lookupVariant scopeKindNames dto.Scope |> Option.defaultValue Other
      Glob = Option.ofObj dto.Glob
      Globs = toOptionList dto.Globs
      LintStagedShell = Option.ofObj dto.LintStagedShell
      Trigger = toOptionList dto.Trigger }

let private toGateEntry (dto: GateEntryDto) : GateEntry =
    let args =
        match dto.Args with
        | null -> Map.empty
        | dict -> dict |> Seq.map (fun kv -> kv.Key, toOptionList kv.Value) |> Map.ofSeq

    let surfaces =
        match dto.Surfaces with
        | null -> []
        | dict ->
            dict
            |> Seq.choose (fun kv ->
                lookupVariant gateSurfaceNames kv.Key
                |> Option.map (fun surface -> surface, toSurfaceScope kv.Value))
            // Rust holds `surfaces` in a BTreeMap, so iteration is by the
            // enum's declared order, not by the order YAML happened to list
            // them. Findings and emitted output both depend on it.
            |> Seq.sortBy (fun (surface, _) -> gateSurfaceNames |> List.findIndex (snd >> (=) surface))
            |> List.ofSeq

    { Id = dto.Id
      GateType =
        lookupVariant gateTypeNames (Option.ofObj dto.Type |> Option.defaultValue "")
        |> Option.defaultValue Check
      Command = Option.ofObj dto.Command |> Option.defaultValue ""
      Kind =
        lookupVariant gateKindNames (Option.ofObj dto.Kind |> Option.defaultValue "")
        |> Option.defaultValue External
      DoctorTools = toOptionList dto.DoctorTools
      Wiring = Option.ofObj dto.Wiring |> Option.bind (lookupVariant gateWiringNames)
      Restages = dto.Restages
      Args = args
      Surfaces = surfaces
      CarveOut = Option.ofObj dto.CarveOut |> Option.bind (lookupVariant gateCarveOutNames)
      Verifies = Option.ofObj dto.Verifies
      Category = Option.ofObj dto.Category
      CiGroup = Option.ofObj dto.CiGroup }

let private doctorVersionStreamNames =
    [ "stdout", StdoutStream; "stderr", StderrStream ]

let private toDoctorExtraTool (dto: DoctorExtraToolDto) : DoctorExtraTool =
    { Name = Option.ofObj dto.Name |> Option.defaultValue ""
      Binary = Option.ofObj dto.Binary |> Option.defaultValue ""
      VersionArgs = toOptionList dto.VersionArgs
      VersionStream =
        Option.ofObj dto.VersionStream
        |> Option.bind (lookupVariant doctorVersionStreamNames)
        |> Option.defaultValue StdoutStream
      RequiredVersion = Option.ofObj dto.RequiredVersion |> Option.defaultValue ""
      Install =
        match dto.Install with
        | null -> Map.empty
        | dict -> dict |> Seq.map (fun kv -> kv.Key, toOptionList kv.Value) |> Map.ofSeq }

let private toDoctorConfig (dto: DoctorConfigDto) : DoctorConfig =
    match box dto with
    | null ->
        { DotnetGlobalJson = None
          SkipTools = []
          ExtraTools = [] }
    | _ ->
        { DotnetGlobalJson = Option.ofObj dto.DotnetGlobalJson
          SkipTools = toOptionList dto.SkipTools
          ExtraTools = toOptionList dto.ExtraTools |> List.map toDoctorExtraTool }

/// `harness[]` entries' allowed key set, matching `HarnessEntryDto`'s fields
/// in the kebab-case spelling `repo-config.yml` uses for them.
let private allowedHarnessKeys: Set<string> =
    Set.ofList
        [ "name"
          "tier"
          "agent-dir"
          "skills-dir"
          "rules-dir"
          "agent-name"
          "mirrors"
          "skills-mirrors"
          "vendored"
          "model-map"
          "config"
          "forbid-dir"
          "shadow"
          "instruction"
          "catalog"
          "ownership" ]

/// `harness[].ownership[]` entries' allowed key set, matching
/// `OwnershipEntryDto`'s fields.
let private allowedOwnershipKeys: Set<string> =
    Set.ofList [ "path"; "class"; "reason" ]

let private asRawMap (value: obj) : IDictionary<obj, obj> option =
    match value with
    | :? IDictionary<obj, obj> as dict -> Some dict
    | _ -> None

let private asRawList (value: obj) : obj list option =
    match value with
    | :? IDictionary<obj, obj> -> None
    | :? System.Collections.IEnumerable as items when not (value :? string) ->
        Some(items |> Seq.cast<obj> |> List.ofSeq)
    | _ -> None

let private tryGetRawValue (dict: IDictionary<obj, obj>) (key: string) : obj option =
    dict
    |> Seq.tryFind (fun kv ->
        match kv.Key with
        | :? string as candidate -> String.Equals(candidate, key, StringComparison.Ordinal)
        | _ -> false)
    |> Option.map (fun kv -> kv.Value)

let private unknownKeyFindings (allowed: Set<string>) (dict: IDictionary<obj, obj>) (label: string) : string list =
    dict
    |> Seq.choose (fun kv ->
        match kv.Key with
        | :? string as key when not (Set.contains key allowed) ->
            Some(
                sprintf
                    "%s: unknown key \"%s\" (expected one of %s)"
                    label
                    key
                    (String.concat ", " (Set.toList allowed))
            )
        | _ -> None)
    |> List.ofSeq

/// Independently walks `data`'s raw YAML structure (rather than the lenient
/// `RepoConfigDto`) to reject an unknown key inside a `harness[]` entry or a
/// `harness[].ownership[]` sub-entry, reproducing Rust's
/// `#[serde(deny_unknown_fields)]` on `HarnessEntry`/`OwnershipEntry` for
/// exactly these two substructures.
///
/// Scope note: this does NOT reproduce `deny_unknown_fields` for the rest of
/// the ~40-field `RepoConfig` schema (`gates[]`, `specs`, `doctor`, and
/// everything this port does not model at all) — see the module doc comment.
/// Widening this check to more of the schema is future work for later
/// waves, as this port grows to cover more of `repo-config.yml`.
/// Rejects an unknown enum spelling under `gates:` with serde's own wording,
/// allowed-value list, and source position.
///
/// Rust gets this for free: `GateType`, `GateKind`, `GateWiring`,
/// `GateCarveOut`, `GateSurface`, and `ScopeKind` are `Deserialize` enums, so
/// an unrecognised spelling is a deserialization fault carrying the variant
/// list and the YAML mark. YamlDotNet has no equivalent — an unmatched string
/// silently becomes whatever the converter defaults to — so the check is
/// explicit here, walking the representation model for the marks
/// [Repo-grounded — `repo_config/mod.rs`'s six `#[serde(rename_all = "kebab-case")]` enums].
let private gateEnumFindings (path: string) (data: string) : Result<unit, string> =
    let stream = YamlStream()
    use reader = new StringReader(data)

    try
        stream.Load reader
    with _ ->
        // A malformed document is not this check's concern; the deserializer
        // below reports it with its own message.
        ()

    let asMapping (node: YamlNode) =
        match node with
        | :? YamlMappingNode as m -> Some m
        | _ -> None

    let child (m: YamlMappingNode) (key: string) : YamlNode option =
        m.Children
        |> Seq.tryFind (fun kv ->
            match kv.Key with
            | :? YamlScalarNode as k -> k.Value = key
            | _ -> false)
        |> Option.map (fun kv -> kv.Value)

    let asScalar (node: YamlNode) =
        match node with
        | :? YamlScalarNode as sc -> Some sc
        | _ -> None

    /// serde renders its allowed set as backticked, comma-separated variants
    /// in declaration order.
    let expected (table: (string * 'a) list) =
        table |> List.map (fun (name, _) -> sprintf "`%s`" name) |> String.concat ", "

    let fault (field: string) (sc: YamlScalarNode) (table: (string * 'a) list) (gateId: string) =
        sprintf
            "failed to parse repo-config.yml at %s: %s: unknown variant `%s`, expected one of %s at line %d column %d (gate id \"%s\")"
            path
            field
            sc.Value
            (expected table)
            sc.Start.Line
            sc.Start.Column
            gateId

    let checkScalar field node table gateId =
        match node |> Option.bind asScalar with
        | Some sc when (lookupVariant table sc.Value).IsNone -> Some(fault field sc table gateId)
        | _ -> None

    let gateFindings (index: int) (gate: YamlMappingNode) : string option =
        let gateId =
            child gate "id"
            |> Option.bind asScalar
            |> Option.map (fun sc -> sc.Value)
            |> Option.defaultValue ""

        // Document order within the gate, then its surfaces — the order serde
        // itself visits the map in, so the first reported fault matches.
        let scalarChecks =
            [ "type",
              child gate "type",
              lazy (expected gateTypeNames),
              (fun (v: string) -> (lookupVariant gateTypeNames v).IsNone)
              "kind",
              child gate "kind",
              lazy (expected gateKindNames),
              (fun v -> (lookupVariant gateKindNames v).IsNone)
              "wiring",
              child gate "wiring",
              lazy (expected gateWiringNames),
              (fun v -> (lookupVariant gateWiringNames v).IsNone)
              "carve-out",
              child gate "carve-out",
              lazy (expected gateCarveOutNames),
              (fun v -> (lookupVariant gateCarveOutNames v).IsNone) ]
            |> List.tryPick (fun (field, node, allowed, isUnknown) ->
                match node |> Option.bind asScalar with
                | Some sc when isUnknown sc.Value ->
                    Some(
                        sprintf
                            "failed to parse repo-config.yml at %s: gates[%d].%s: unknown variant `%s`, expected one of %s at line %d column %d (gate id \"%s\")"
                            path
                            index
                            field
                            sc.Value
                            allowed.Value
                            sc.Start.Line
                            sc.Start.Column
                            gateId
                    )
                | _ -> None)

        match scalarChecks with
        | Some finding -> Some finding
        | None ->
            // Scope note: an unknown *surface key* is not checked here, only
            // an unknown `scope:` value. Rust rejects both, but no scenario
            // exercises the key direction and `gateSemanticFindings`'s
            // "at least one surface" rule already catches the shape that a
            // silently-dropped unknown key would produce.
            child gate "surfaces"
            |> Option.bind asMapping
            |> Option.bind (fun surfaces ->
                surfaces.Children
                |> Seq.tryPick (fun kv ->
                    let surfaceName =
                        match kv.Key with
                        | :? YamlScalarNode as k -> k.Value
                        | _ -> ""

                    kv.Value
                    |> asMapping
                    |> Option.bind (fun scope ->
                        checkScalar
                            (sprintf "gates[%d].surfaces.%s.scope" index surfaceName)
                            (child scope "scope")
                            scopeKindNames
                            gateId)))

    /// `doctor.extra-tools[].version-stream` is the seventh enum-shaped key in
    /// this document, and it needs the same treatment for the same reason: an
    /// unmatched string would silently become `stdout`, and a tool whose banner
    /// goes to stderr would then be reported missing while installed. Checked
    /// here rather than left to default, so the failure is a loud parse error
    /// instead of a quiet misdiagnosis.
    let extraToolFindings (index: int) (tool: YamlMappingNode) : string option =
        match child tool "version-stream" |> Option.bind asScalar with
        | Some sc when (lookupVariant doctorVersionStreamNames sc.Value).IsNone ->
            Some(
                sprintf
                    "failed to parse repo-config.yml at %s: doctor.extra-tools[%d].version-stream: unknown variant `%s`, expected one of %s at line %d column %d"
                    path
                    index
                    sc.Value
                    (expected doctorVersionStreamNames)
                    sc.Start.Line
                    sc.Start.Column
            )
        | _ -> None

    if stream.Documents.Count = 0 then
        Ok()
    else
        match asMapping stream.Documents[0].RootNode with
        | None -> Ok()
        | Some root ->
            let gateFault =
                match child root "gates" with
                | Some(:? YamlSequenceNode as gates) ->
                    gates.Children
                    |> Seq.indexed
                    |> Seq.tryPick (fun (i, node) -> asMapping node |> Option.bind (gateFindings i))
                | _ -> None

            let extraToolFault =
                child root "doctor"
                |> Option.bind asMapping
                |> Option.bind (fun doctor -> child doctor "extra-tools")
                |> Option.bind (fun node ->
                    match node with
                    | :? YamlSequenceNode as tools ->
                        tools.Children
                        |> Seq.indexed
                        |> Seq.tryPick (fun (i, item) -> asMapping item |> Option.bind (extraToolFindings i))
                    | _ -> None)

            match gateFault |> Option.orElse extraToolFault with
            | Some finding -> Error finding
            | None -> Ok()

let private checkNoUnknownHarnessKeys (data: string) : Result<unit, string> =
    try
        let root = deserializer.Deserialize<obj>(data)

        match asRawMap root with
        | None -> Ok()
        | Some rootMap ->
            match tryGetRawValue rootMap "harness" |> Option.bind asRawList with
            | None -> Ok()
            | Some harnessItems ->
                let findings =
                    harnessItems
                    |> List.mapi (fun i item ->
                        match asRawMap item with
                        | None -> []
                        | Some entryMap ->
                            let ownershipFindings =
                                match tryGetRawValue entryMap "ownership" |> Option.bind asRawList with
                                | None -> []
                                | Some ownershipItems ->
                                    ownershipItems
                                    |> List.mapi (fun j oitem ->
                                        match asRawMap oitem with
                                        | None -> []
                                        | Some ownedMap ->
                                            unknownKeyFindings
                                                allowedOwnershipKeys
                                                ownedMap
                                                (sprintf "harness[%d].ownership[%d]" i j))
                                    |> List.collect id

                            unknownKeyFindings allowedHarnessKeys entryMap (sprintf "harness[%d]" i)
                            @ ownershipFindings)
                    |> List.collect id

                match findings with
                | [] -> Ok()
                | _ -> Error(String.concat "; " findings)
    with ex ->
        Error ex.Message

/// Parses `data` (the contents of `repo-config.yml`) into a [`RepoConfig`]
/// [Repo-grounded — `repo_config/mod.rs::parse_repo_config`].
let private parseRepoConfig (data: string) : Result<RepoConfig, string> =
    match checkNoUnknownHarnessKeys data with
    | Error message -> Error message
    | Ok() ->
        try
            let dto = deserializer.Deserialize<RepoConfigDto>(data)

            match box dto with
            | null -> Ok empty
            | _ ->
                toOptionList dto.Harness
                |> List.mapi toHarnessEntry
                |> sequenceResults
                |> Result.bind (fun harness ->
                    toGateSurfaceGuards dto.GateSurfaceGuards
                    |> Result.map (fun gateSurfaceGuards ->
                        { Harness = harness
                          Gates = toOptionList dto.Gates |> List.map toGateEntry
                          GateSurfaceGuards = gateSurfaceGuards
                          Doctor = toDoctorConfig dto.Doctor
                          ModelGrades =
                            match dto.ModelGrades with
                            | null -> Map.empty
                            | grades ->
                                grades
                                |> Seq.choose (fun kv ->
                                    match box kv.Value with
                                    | null -> None
                                    | _ ->
                                        match kv.Value.Effort with
                                        | null -> None
                                        | effort -> Some(kv.Key, effort))
                                |> Map.ofSeq
                          HarnessCatalog =
                            match box dto.HarnessCatalog with
                            | null -> None
                            | _ ->
                                Some
                                    { Document = dto.HarnessCatalog.Document
                                      Verified = dto.HarnessCatalog.Verified }
                          IntegrationLoopback =
                            toOptionList dto.IntegrationLoopback
                            |> List.choose (fun entry ->
                                match box entry with
                                | null -> None
                                | _ ->
                                    match entry.Project with
                                    | null -> None
                                    | project ->
                                        Some
                                            { Project = project
                                              Reason =
                                                (match entry.Reason with
                                                 | null -> ""
                                                 | reason -> reason) }) }))
        with ex ->
            Error ex.Message

/// Returns the document every rhino-cli reader consumes. A v1 document is
/// returned unchanged. An `ose/repo-config/v2` document keeps its core keys
/// for the pinned Rust RHINO binary, so only its `extensions.rhino-cli`
/// mapping is returned, as a document of its own (empty when the extension is
/// absent). Text that does not load as YAML is returned unchanged, for the
/// strict parser to report.
let normalize (data: string) : string =
    let stream = YamlStream()

    let loaded =
        try
            use reader = new StringReader(data)
            stream.Load reader
            stream.Documents.Count > 0
        with _ ->
            false

    let child (mapping: YamlMappingNode) (key: string) : YamlNode option =
        mapping.Children
        |> Seq.tryFind (fun kv ->
            match kv.Key with
            | :? YamlScalarNode as k -> k.Value = key
            | _ -> false)
        |> Option.map (fun kv -> kv.Value)

    let asMapping (node: YamlNode) : YamlMappingNode option =
        match node with
        | :? YamlMappingNode as m -> Some m
        | _ -> None

    let render (extension: YamlMappingNode) : string =
        use writer = new StringWriter()
        YamlStream([| YamlDocument(extension) |]).Save(writer, false)
        writer.ToString()

    let root =
        if loaded then
            asMapping stream.Documents.[0].RootNode
        else
            None

    let isV2 =
        root
        |> Option.bind (fun rootMap -> child rootMap "schema")
        |> Option.exists (fun node ->
            match node with
            | :? YamlScalarNode as schema -> schema.Value = "ose/repo-config/v2"
            | _ -> false)

    match root with
    | Some rootMap when isV2 ->
        child rootMap "extensions"
        |> Option.bind asMapping
        |> Option.bind (fun extensions -> child extensions "rhino-cli")
        |> Option.bind asMapping
        |> Option.map render
        |> Option.defaultValue "{}\n"
    | _ -> data

/// Strictly parses an in-memory `repo-config.yml` document, v1 or v2 (see
/// [`normalize`]).
///
/// This is the application boundary used by callers that already own the
/// document bytes (for example an editor integration or a Unit test). File
/// discovery and reading remain the responsibility of [`load`].
let parse (data: string) : Result<RepoConfig, string> =
    let document = normalize data

    match gateEnumFindings "repo-config.yml" document with
    | Error message -> Error message
    | Ok() -> parseRepoConfig document

/// Loads and parses `repo-config.yml` at `repoRoot`
/// [Repo-grounded — `repo_config/mod.rs::load`].
[<ExcludeFromCodeCoverage>]
let load (repoRoot: string) : Result<RepoConfig, string> =
    let path = Path.Combine(repoRoot, "repo-config.yml")

    try
        let data = File.ReadAllText path

        parse data
    with ex ->
        Error(sprintf "cannot read repo-config.yml at %s: %s" path ex.Message)

/// Loads `repo-config.yml` at `repoRoot`, discriminating "no entry exists at
/// this path at all" (`Ok None`) from every other failure to read or parse it
/// (`Error`) [Repo-grounded — `repo_config/mod.rs::load_optional`].
///
/// Scope note: uses `File.Exists`, which follows symlinks, rather than the
/// Rust port's `symlink_metadata`-based check, which additionally
/// distinguishes a dangling symlink (declared, but unreadable — `Error`) from
/// a genuinely absent path (`Ok None`). None of these nine scenarios exercise
/// a dangling symlink.
[<ExcludeFromCodeCoverage>]
let loadOptional (repoRoot: string) : Result<RepoConfig option, string> =
    let path = Path.Combine(repoRoot, "repo-config.yml")

    if not (File.Exists path) then
        Ok None
    else
        load repoRoot |> Result.map Some

/// Loads `repo-config.yml` at `repoRoot`, falling back to [`empty`] when the
/// file is absent or cannot be parsed
/// [Repo-grounded — `repo_config/mod.rs::load_or_default`].
[<ExcludeFromCodeCoverage>]
let loadOrDefault (repoRoot: string) : RepoConfig =
    match load repoRoot with
    | Ok config -> config
    | Error _ -> empty

/// Validates a configured repository-relative file path before it is joined
/// to a repository root [Repo-grounded —
/// `repo_config/mod.rs::validate_repo_relative_path`].
///
/// Scope note: this port checks the three conditions these nine scenarios
/// exercise (empty/absolute, padded whitespace, `./`/`../` components) but
/// omits the Windows drive-prefix (`Component::Prefix`) case, which macOS/
/// Linux `Path` values can never produce.
///
/// # Errors
///
/// Returns an error when the path is empty, absolute, carries leading or
/// trailing whitespace, or contains a parent-directory or `./`
/// current-directory component.
let validateRepoRelativePath (value: string) : Result<unit, string> =
    if String.IsNullOrEmpty value || Path.IsPathRooted value then
        Error "must be a non-empty repository-relative path"
    elif value <> value.Trim() then
        Error
            "must not carry leading or trailing whitespace (a padded value like this can pass \
             validation yet fail to match the real file it names, silently orphaning whatever \
             it was declared to protect)"
    else
        let hasBadComponent =
            value.Split('/', '\\')
            |> Array.exists (fun segment -> segment = ".." || segment = ".")

        if hasBadComponent then
            Error "must not contain an absolute, parent-directory, or ./ current-directory component"
        else
            Ok()

/// Resolves a lexically valid repository-relative value without consulting
/// the filesystem. Resource adapters that also need symlink/ancestor checks
/// use [`confinedRepoPath`]; in-process policy callers use this pure form.
let resolveRepoRelativePath (repoRoot: string) (value: string) : Result<string, string> =
    validateRepoRelativePath value
    |> Result.map (fun () ->
        let root = repoRoot.TrimEnd('/', '\\')
        let relative = value.Replace('\\', '/').TrimEnd '/'
        sprintf "%s/%s" root relative)

/// Resolves a configured repository-relative path to its nearest existing
/// ancestor, confirming that ancestor lies within `repoRoot`
/// [Repo-grounded — `repo_config/mod.rs::confined_repo_path`].
///
/// Scope note: uses `Path.GetFullPath` (lexical normalization) rather than
/// the Rust port's `Path::canonicalize` (which additionally resolves
/// symlinks); the escape check below is consequently a defense-in-depth
/// approximation, not a true symlink-escape guard. None of these nine
/// scenarios exercises a symlinked repository ancestor.
///
/// # Errors
///
/// Returns an error when the value is lexically unsafe, no ancestor of the
/// candidate path exists, or the nearest existing ancestor lies outside
/// `repoRoot`.
[<ExcludeFromCodeCoverage>]
let confinedRepoPath (repoRoot: string) (value: string) : Result<string, string> =
    match validateRepoRelativePath value with
    | Error e -> Error e
    | Ok() ->
        try
            let canonicalRoot = Path.GetFullPath repoRoot
            let candidate = Path.Combine(repoRoot, value)

            let rec findExistingAncestor (path: string) : string option =
                if File.Exists path || Directory.Exists path then
                    Some path
                else
                    match Path.GetDirectoryName path with
                    | null
                    | "" -> None
                    | parent -> findExistingAncestor parent

            match findExistingAncestor candidate with
            | None -> Error "configured path has no existing repository ancestor"
            | Some existingAncestor ->
                let canonicalAncestor = Path.GetFullPath existingAncestor
                let rootWithSeparator = canonicalRoot + Path.DirectorySeparatorChar.ToString()

                if
                    not (
                        String.Equals(canonicalAncestor, canonicalRoot, StringComparison.Ordinal)
                        || canonicalAncestor.StartsWith(rootWithSeparator, StringComparison.Ordinal)
                    )
                then
                    Error(sprintf "configured path \"%s\" escapes the repository root through a symlink" value)
                else
                    let canonicalCandidate = Path.GetFullPath candidate

                    if String.Equals(canonicalCandidate, canonicalAncestor, StringComparison.Ordinal) then
                        Ok canonicalAncestor
                    else
                        let remaining = Path.GetRelativePath(existingAncestor, candidate)
                        Ok(Path.Combine(canonicalAncestor, remaining))
        with ex ->
            Error ex.Message

/// Splits a path into its non-empty components, tolerating either separator
/// so a trailing separator does not manufacture a spurious empty component
/// [Repo-grounded — `repo_config/mod.rs::paths_equal`/`path_is_under`'s use
/// of `Path::components()`].
let private pathComponents (path: string) : string list =
    path.Split('/', '\\')
    |> Array.filter (fun segment -> segment <> "")
    |> List.ofArray

/// Component-wise path equality — tolerates a trailing separator difference
/// but not a real typo [Repo-grounded — `repo_config/mod.rs::paths_equal`].
let pathsEqual (a: string) (b: string) : bool = pathComponents a = pathComponents b

/// True when `path` lies under `dir` (component-wise prefix). False when
/// `dir` is empty [Repo-grounded — `repo_config/mod.rs::path_is_under`].
let pathIsUnder (path: string) (dir: string) : bool =
    if String.IsNullOrEmpty dir then
        false
    else
        let dirComponents = pathComponents dir
        let pathParts = pathComponents path

        dirComponents.Length <= pathParts.Length
        && (pathParts |> List.take dirComponents.Length) = dirComponents

/// Forward direction: an ownership entry declared `class: vendored` under
/// this harness entry's `skills-dir`, with no matching `vendored[]` entry.
/// A no-op when `skills-dir` is unset
/// [Repo-grounded —
/// `repo_config/mod.rs::vendored_missing_from_ownership_backed_list`].
let vendoredMissingFromOwnershipBackedList (index: int) (entry: HarnessEntry) : string list =
    match entry.SkillsDir with
    | None -> []
    | Some skillsDir ->
        entry.Ownership
        |> List.filter (fun owned ->
            owned.Class = ClassVendored
            && pathIsUnder owned.Path skillsDir
            && not (entry.Vendored |> List.exists (fun v -> pathsEqual v owned.Path)))
        |> List.map (fun owned ->
            sprintf
                "harness[%d].ownership: \"%s\" is declared class: vendored under skills-dir \"%s\" but has no matching harness[%d].vendored entry (the skills mirror will delete it on the next regeneration)"
                index
                owned.Path
                skillsDir
                index)

/// Reverse direction: a `vendored[]` entry with no matching `ownership`
/// entry declared `class: vendored`. Always checked, with no `skills-dir`
/// gate — `vendored[]` itself only makes sense under `skills-dir`
/// [Repo-grounded — `repo_config/mod.rs::vendored_without_ownership_entry`].
let vendoredWithoutOwnershipEntry (index: int) (entry: HarnessEntry) : string list =
    entry.Vendored
    |> List.mapi (fun k vendoredPath ->
        let declared =
            entry.Ownership
            |> List.exists (fun owned -> owned.Class = ClassVendored && pathsEqual owned.Path vendoredPath)

        if declared then
            None
        else
            Some(
                sprintf
                    "harness[%d].vendored[%d]: \"%s\" has no matching harness[%d].ownership entry with class: vendored (a vendored[] entry that fails to match its real directory — most commonly a typo — leaves that real directory unprotected and the skills mirror will delete it on the next regeneration)"
                    index
                    k
                    vendoredPath
                    index
            ))
    |> List.choose id

/// Per-harness-entry semantic findings: every `class: vendored` ownership
/// declaration must carry a non-empty `reason`, plus both cross-checks above
/// [Repo-grounded —
/// `repo_config_validate.rs::harness_entry_semantic_findings`].
let harnessEntrySemanticFindings (index: int) (entry: HarnessEntry) : string list =
    let reasonFindings =
        entry.Ownership
        |> List.mapi (fun j owned ->
            let blank =
                owned.Reason
                |> Option.map (fun r -> r.Trim())
                |> Option.forall (fun r -> r = "")

            if owned.Class = ClassVendored && blank then
                Some(
                    sprintf
                        "harness[%d].ownership[%d].reason: required non-empty value for path \"%s\" (a vendored path must record why it cannot be regenerated)"
                        index
                        j
                        owned.Path
                )
            else
                None)
        |> List.choose id

    reasonFindings
    @ vendoredMissingFromOwnershipBackedList index entry
    @ vendoredWithoutOwnershipEntry index entry

/// Collects `repo-config validate`'s semantic findings
/// [Repo-grounded — `repo_config_validate.rs::semantic_findings`,
/// `harness_entry_semantic_findings`].
///
/// Scope note: the Rust validator additionally requires non-empty `harness`/
/// entries, validates every harness path field, and checks gate
/// wiring/carve-out/duplicate-id rules — none of which either feature file's
/// scenarios exercise, and none of which this trimmed `RepoConfig` type (see
/// module doc comment) carries enough data to check.
/// Reports the message `glob::Pattern::new` would produce for an invalid
/// pattern, or `None` when the pattern parses [Repo-grounded — the `glob`
/// crate's `PatternError`].
///
/// Scope note: reproduces the crate's four `ErrorKind` variants
/// (`InvalidRange`, `UnclosedClass`, `InvalidRecursion`, `WildcardsError`)
/// and its `Display` shape. No scenario declares an invalid glob; the check
/// exists so `repo-config validate` keeps rejecting exactly what Rust
/// rejects.
let globPatternError (pattern: string) : string option =
    let chars = pattern.ToCharArray()
    let n = chars.Length

    let rec starRun (k: int) : int =
        if k < n && chars.[k] = '*' then starRun (k + 1) else k

    let rec closingBracket (k: int) : int option =
        if k >= n then None
        elif chars.[k] = ']' then Some k
        else closingBracket (k + 1)

    let rec scan (i: int) : (int * string) option =
        if i >= n then
            None
        elif chars.[i] = '[' then
            let afterBang = if i + 1 < n && chars.[i + 1] = '!' then i + 2 else i + 1

            // A `]` in the first position of a class is a literal member, not
            // the class terminator.
            let bodyStart =
                if afterBang < n && chars.[afterBang] = ']' then
                    afterBang + 1
                else
                    afterBang

            match closingBracket bodyStart with
            | None -> Some(i, "unclosed character class")
            | Some closing ->
                let body = pattern.Substring(afterBang, closing - afterBang)

                let invalidRange =
                    seq { 1 .. body.Length - 2 }
                    |> Seq.exists (fun k -> body.[k] = '-' && body.[k - 1] > body.[k + 1])

                if invalidRange then
                    Some(i, "invalid range pattern")
                else
                    scan (closing + 1)
        elif chars.[i] = '*' then
            let past = starRun i
            let run = past - i

            if run > 2 then
                Some(i, "wildcards are either regular `*` or recursive `**`")
            elif
                run = 2
                && not ((i = 0 || chars.[i - 1] = '/') && (past = n || chars.[past] = '/'))
            then
                Some(i, "recursive wildcards must form a single path component")
            else
                scan past
        else
            scan (i + 1)

    scan 0
    |> Option.map (fun (position, message) -> sprintf "Pattern syntax error near position %d: %s" position message)

/// Collects semantic findings for a gate's optional ordered Doctor-tool list
/// [Repo-grounded — `repo_config_validate.rs::doctor_tools_semantic_findings`].
let private doctorToolsSemanticFindings (inventory: string list) (index: int) (gate: GateEntry) : string list =
    gate.DoctorTools
    |> List.mapi (fun position tool ->
        let unknown =
            if List.contains tool inventory then
                []
            else
                [ sprintf "gates[%d] (gate id \"%s\").doctor-tools: unknown Doctor tool \"%s\"" index gate.Id tool ]

        let duplicate =
            if gate.DoctorTools |> List.take position |> List.contains tool then
                [ sprintf "gates[%d] (gate id \"%s\").doctor-tools: duplicate Doctor tool \"%s\"" index gate.Id tool ]
            else
                []

        unknown @ duplicate)
    |> List.collect id

/// Collects findings for the pre-commit-only lint-staged shell override
/// [Repo-grounded — `repo_config_validate.rs::lint_staged_shell_findings`].
let private lintStagedShellFindings
    (index: int)
    (gate: GateEntry)
    (surface: GateSurface)
    (scope: SurfaceScope)
    : string list =
    match scope.LintStagedShell with
    | None -> []
    | Some shell ->
        let placement =
            if surface <> PreCommit || scope.Scope <> AffectedFileType then
                [ sprintf
                      "gates[%d] (gate id \"%s\").surfaces.%A.lint-staged-shell: only valid for pre-commit affected-file-type"
                      index
                      gate.Id
                      surface ]
            else
                []

        let blank =
            if shell.Trim() = "" then
                [ sprintf
                      "gates[%d] (gate id \"%s\").surfaces.%A.lint-staged-shell: must not be blank"
                      index
                      gate.Id
                      surface ]
            else
                []

        // Rust counts occurrences of the literal `{{command}}` while its
        // message renders `{command}` (format! collapses the doubled braces).
        let placeholder =
            let rec count (from: int) (total: int) : int =
                match shell.IndexOf("{{command}}", from, StringComparison.Ordinal) with
                | -1 -> total
                | at -> count (at + "{{command}}".Length) (total + 1)

            if count 0 0 > 1 then
                [ sprintf
                      "gates[%d] (gate id \"%s\").surfaces.%A.lint-staged-shell: {command} may appear at most once"
                      index
                      gate.Id
                      surface ]
            else
                []

        placement @ blank @ placeholder

/// Collects semantic findings for one gate on one declared surface
/// [Repo-grounded — `repo_config_validate.rs::gate_surface_semantic_findings`].
let private gateSurfaceSemanticFindings
    (index: int)
    (gate: GateEntry)
    (surface: GateSurface)
    (scope: SurfaceScope)
    : string list =
    let isFileScope = scope.Scope = AffectedFileType || scope.Scope = AllFileType

    let isProjectScope = scope.Scope = AffectedProjects || scope.Scope = AllProjects

    let allGlobs = Option.toList scope.Glob @ scope.Globs

    let globScope =
        if not (List.isEmpty allGlobs) && not isFileScope then
            [ sprintf
                  "gates[%d] (gate id \"%s\").surfaces.%A: glob and globs require a file scope"
                  index
                  gate.Id
                  surface ]
        else
            []

    let triggerScope =
        if not (List.isEmpty scope.Trigger) && scope.Scope <> PathGated then
            [ sprintf
                  "gates[%d] (gate id \"%s\").surfaces.%A.trigger: only valid for path-gated scope"
                  index
                  gate.Id
                  surface ]
        else
            []

    let missingTrigger =
        if scope.Scope = PathGated && List.isEmpty scope.Trigger then
            [ sprintf
                  "gates[%d] (gate id \"%s\").surfaces.%A.trigger: path-gated scope requires at least one trigger"
                  index
                  gate.Id
                  surface ]
        else
            []

    let globSyntax =
        allGlobs
        |> List.choose (fun glob ->
            globPatternError glob
            |> Option.map (fun error ->
                sprintf
                    "gates[%d] (gate id \"%s\").surfaces.%A: invalid glob \"%s\": %s"
                    index
                    gate.Id
                    surface
                    glob
                    error))

    let nxScope =
        if gate.Kind = Nx && not isProjectScope then
            [ sprintf
                  "gates[%d] (gate id \"%s\").surfaces.%A: nx kind requires an affected-projects or all-projects scope"
                  index
                  gate.Id
                  surface ]
        else
            []

    let nonNxScope =
        if gate.Kind <> Nx && isProjectScope then
            [ sprintf "gates[%d] (gate id \"%s\").surfaces.%A: project scopes require kind nx" index gate.Id surface ]
        else
            []

    globScope
    @ lintStagedShellFindings index gate surface scope
    @ triggerScope
    @ missingTrigger
    @ globSyntax
    @ nxScope
    @ nonNxScope

/// Collects the semantic findings that apply specifically to the gate
/// registry, shared by `repo-config validate` and `gate run` so dispatch
/// rejects a malformed entry before it selects or invokes a leaf
/// [Repo-grounded — `repo_config_validate.rs::gate_semantic_findings`].
let gateSemanticFindings (config: RepoConfig) : string list =
    config.Gates
    |> List.mapi (fun index gate ->
        let duplicate =
            if config.Gates |> List.take index |> List.exists (fun other -> other.Id = gate.Id) then
                [ sprintf "gates[%d].id: duplicate gate id \"%s\"" index gate.Id ]
            else
                []

        let charset =
            if
                gate.Id = ""
                || not (
                    gate.Id
                    |> Seq.forall (fun c -> (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c = '-')
                )
            then
                [ sprintf
                      "gates[%d].id: \"%s\" must be non-empty lowercase kebab-case (`[a-z0-9-]+`) — this value reaches shell contexts (CI matrix dispatch, hook generation) unescaped, so any other character is a defense-in-depth risk, not merely a style violation"
                      index
                      gate.Id ]
            else
                []

        let surfaces =
            if List.isEmpty gate.Surfaces then
                [ sprintf "gates[%d] (gate id \"%s\").surfaces: at least one surface is required" index gate.Id ]
            else
                []

        let wiring =
            if gate.Wiring.IsSome && gate.GateType <> Check then
                [ sprintf
                      "gates[%d] (gate id \"%s\").wiring: only valid for type \"check\" (found type \"mutation\")"
                      index
                      gate.Id ]
            else
                []

        let restages =
            if gate.Restages && gate.GateType <> Mutation then
                [ sprintf
                      "gates[%d] (gate id \"%s\").restages: only valid for type \"mutation\" (found type \"check\")"
                      index
                      gate.Id ]
            else
                []

        let carveOut =
            if gate.CarveOut.IsSome && gate.GateType <> Check then
                [ sprintf
                      "gates[%d] (gate id \"%s\").carve-out: only valid for type \"check\" (found type \"mutation\")"
                      index
                      gate.Id ]
            else
                []

        let surfaceFindings =
            gate.Surfaces
            |> List.collect (fun (surface, scope) -> gateSurfaceSemanticFindings index gate surface scope)

        duplicate
        @ charset
        @ surfaces
        @ wiring
        @ restages
        @ carveOut
        @ doctorToolsSemanticFindings (doctorToolInventoryFor config) index gate
        @ surfaceFindings)
    |> List.collect id

/// Collects semantic findings for `doctor.extra-tools`. A declaration is only
/// useful if Doctor can actually run it, so the three fields that make it
/// runnable are required rather than defaulted, and a name that shadows a
/// built-in or another declaration is rejected because which definition wins
/// would otherwise depend on list order.
let private doctorExtraToolsFindings (tools: DoctorExtraTool list) : string list =
    tools
    |> List.mapi (fun index tool ->
        let required =
            [ "name", tool.Name; "binary", tool.Binary ]
            |> List.filter (fun (_, value) -> String.IsNullOrWhiteSpace value)
            |> List.map (fun (field, _) ->
                sprintf "doctor.extra-tools[%d].%s: required field is missing or blank" index field)

        let versionArgs =
            if List.isEmpty tool.VersionArgs then
                [ sprintf
                      "doctor.extra-tools[%d].version-args: required field is missing or empty — a probe with no arguments cannot read a version"
                      index ]
            else
                []

        let shadowsBuiltin =
            if List.contains tool.Name builtinDoctorToolInventory then
                [ sprintf "doctor.extra-tools[%d].name: \"%s\" is already a built-in Doctor tool" index tool.Name ]
            else
                []

        let duplicate =
            if
                tools
                |> List.take index
                |> List.exists (fun earlier -> earlier.Name = tool.Name)
            then
                [ sprintf "doctor.extra-tools[%d].name: duplicate Doctor tool \"%s\"" index tool.Name ]
            else
                []

        required @ versionArgs @ shadowsBuiltin @ duplicate)
    |> List.collect id

let semanticFindings (config: RepoConfig) : string list =
    let doctorFindings =
        (match config.Doctor.DotnetGlobalJson with
         | None -> []
         | Some path ->
             match validateRepoRelativePath path with
             | Ok() -> []
             | Error message -> [ sprintf "doctor.dotnet-global-json: invalid value \"%s\" (%s)" path message ])
        @ doctorExtraToolsFindings config.Doctor.ExtraTools

    let harnessFindings =
        config.Harness |> List.mapi harnessEntrySemanticFindings |> List.collect id

    doctorFindings @ harnessFindings @ gateSemanticFindings config

/// Validates one already-read configuration document and renders the same
/// result envelope as the CLI-facing filesystem adapter.
let validateText (data: string) : bool * string =
    match parse data with
    | Error message ->
        false, sprintf "repo-config validate: repo-config.yml failed strict schema deserialization: %s\n" message
    | Ok config ->
        match semanticFindings config with
        | [] -> true, "repo-config validate: repo-config.yml matches the canonical schema (key set + enums OK)\n"
        | findings ->
            let body = findings |> List.map (fun finding -> finding + "\n") |> String.concat ""
            false, body

/// Runs `repo-config validate` from a known `repoRoot`, returning whether it
/// passed alongside the human-readable text a CLI invocation would print
/// [Repo-grounded — `repo_config_validate.rs::run_at_root`].
[<ExcludeFromCodeCoverage>]
let validateAtRoot (repoRoot: string) : bool * string =
    match load repoRoot with
    | Error message ->
        false, sprintf "repo-config validate: repo-config.yml failed strict schema deserialization: %s\n" message
    | Ok config ->
        match semanticFindings config with
        | [] -> true, "repo-config validate: repo-config.yml matches the canonical schema (key set + enums OK)\n"
        | findings ->
            let body = findings |> List.map (fun f -> f + "\n") |> String.concat ""
            false, body

/// The slice of a Doctor `ToolDef` the .NET SDK path scenario reads
/// [Repo-grounded — `doctor/tools.rs::ToolDef`].
///
/// Scope note: only `source` and `read_req` are ported. Doctor's full
/// `ToolDef` additionally carries the binary name, comparison args, version
/// parser/comparator, and install command — a much larger surface (~20
/// tools) untouched by this feature file's scenarios.
type DotnetToolDef =
    { Source: string
      ReadReq: unit -> string }

/// Builds the .NET SDK tool definition from an injected document reader.
/// The caller controls the resource boundary; the application logic only
/// selects the configured path and parses `sdk.version`.
let buildDotnetToolDefWith (readText: string -> Result<string, string>) (config: RepoConfig) : DotnetToolDef =
    let configuredPath =
        config.Doctor.DotnetGlobalJson |> Option.defaultValue "global.json"

    { Source = "doctor.dotnet-global-json → sdk.version"
      ReadReq =
        fun () ->
            match validateRepoRelativePath configuredPath, readText configuredPath with
            | Ok(), Ok text ->
                try
                    use doc = JsonDocument.Parse text

                    match doc.RootElement.TryGetProperty "sdk" with
                    | true, sdk ->
                        match sdk.TryGetProperty "version" with
                        | true, version when version.ValueKind = JsonValueKind.String -> version.GetString()
                        | _ -> ""
                    | _ -> ""
                with _ ->
                    ""
            | _ -> "" }

/// Reads `sdk.version` out of a `global.json`-shaped JSON file, returning an
/// empty string when the file is missing, unreadable, or lacks that key
/// [Repo-grounded — `doctor/checker.rs::read_dotnet_version`].
[<ExcludeFromCodeCoverage>]
let private readDotnetSdkVersion (path: string) : string =
    try
        use doc = JsonDocument.Parse(File.ReadAllText path)

        match doc.RootElement.TryGetProperty "sdk" with
        | true, sdk ->
            match sdk.TryGetProperty "version" with
            | true, version when version.ValueKind = JsonValueKind.String -> version.GetString()
            | _ -> ""
        | _ -> ""
    with _ ->
        ""

/// Resolves the repository's .NET SDK configuration path from
/// `repo-config.yml`, falling back to the conventional root `global.json`
/// when unset or invalid [Repo-grounded —
/// `doctor/tools.rs::configured_dotnet_global_json`].
[<ExcludeFromCodeCoverage>]
let private resolveDotnetGlobalJsonPath (repoRoot: string) (config: RepoConfig) : string =
    let fallback = Path.Combine(repoRoot, "global.json")

    match config.Doctor.DotnetGlobalJson with
    | None -> fallback
    | Some value ->
        match confinedRepoPath repoRoot value with
        | Ok path -> path
        | Error _ -> fallback

/// Builds the `dotnet` tool definition's `source` label and `read_req`
/// closure from `repoRoot`'s configuration
/// [Repo-grounded — `doctor/tools.rs::tool_defs_dotnet`].
[<ExcludeFromCodeCoverage>]
let buildDotnetToolDef (repoRoot: string) (config: RepoConfig) : DotnetToolDef =
    let path = resolveDotnetGlobalJsonPath repoRoot config

    { Source = "doctor.dotnet-global-json → sdk.version"
      ReadReq = fun () -> readDotnetSdkVersion path }
