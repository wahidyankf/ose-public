/// TickSpec step definitions binding `harness/agents-bindings.feature`'s 10
/// scenarios to `RhinoCli.Application.Harness`
/// [Repo-grounded —
/// `specs/apps/rhino/cli/behaviours/harness/agents-bindings.feature`,
/// `apps/rhino-cli/src/application/agents/bindings.rs`,
/// `apps/rhino-cli/src/commands/harness_generate_bindings.rs`].
///
/// Follows `GovernanceSteps.fs`'s per-scenario slicing convention: each xunit
/// `[<Fact>]` below runs exactly one scenario, extracted from the real, frozen
/// feature file. `harness` is not yet listed in `FSHARP_NAMESPACES` (that flip
/// closes Wave E), so every scenario calls `RhinoCli.Application.Harness`'s
/// functions directly rather than through CLI argv parsing.
///
/// Two scenario families read this repository itself rather than a fixture,
/// because that is what they assert about:
///
///   - the `@harness-purge` scenario is a claim about the committed tree —
///     that `.cursor/`, `.amazonq/`, and `.pi/` hold zero tracked files — so
///     it shells out to `git ls-files` at the real repository root, the same
///     evidence the scenario's own `When` step names;
///   - the `@harness-name-registry-derived` scenarios assert that `--harness`
///     acceptance is derived from `repo-config.yml`'s `harness:` registry, so
///     they load this repository's real registry (mirroring
///     `RepoConfigSteps.fs`'s precedent) instead of a synthetic one — a
///     fixture registry would prove only that the lookup works, never that
///     the live registry declares `codex` and does not declare `cursor`.
///
/// Every other scenario builds a throwaway fixture repository under its own
/// fresh `scenarioRoot()` temp directory, mirroring `bindings.rs`'s own unit
/// tests, which likewise always pass a `TempDir` as the repository root.
module RhinoCli.Tests.Integration.Steps.HarnessResourceSteps

/// Explicit static-coverage ownership; the validator scopes this file's
/// TickSpec bindings to these canonical features.
let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/harness/agents-bindings.feature"
      "specs/apps/rhino/cli/behaviours/harness/agents-detect-duplication.feature"
      "specs/apps/rhino/cli/behaviours/harness/agents-skills-mirror.feature"
      "specs/apps/rhino/cli/behaviours/harness/agents-sync.feature"
      "specs/apps/rhino/cli/behaviours/harness/agents-validate-claude.feature"
      "specs/apps/rhino/cli/behaviours/harness/codex-binding.feature"
      "specs/apps/rhino/cli/behaviours/harness/governance-word-budget-pre-push.feature"
      "specs/apps/rhino/cli/behaviours/harness/governance-word-budget-rule.feature"
      "specs/apps/rhino/cli/behaviours/harness/harness-audit.feature"
      "specs/apps/rhino/cli/behaviours/harness/harness-catalog.feature"
      "specs/apps/rhino/cli/behaviours/harness/harness-ownership.feature"
      "specs/apps/rhino/cli/behaviours/harness/harness-sync-triage.feature"
      "specs/apps/rhino/cli/behaviours/harness/opencode-conformance.feature"
      "specs/apps/rhino/cli/behaviours/harness/opencode-skills-removal.feature"
      "specs/apps/rhino/cli/behaviours/harness/vendored-skill-preservation.feature" ]


open System
open System.Diagnostics
open System.IO
open System.Text.Json
open TickSpec
open Xunit
open RhinoCli.Application

/// Absolute path of the repository root this test assembly was built from,
/// derived from the source location so a worktree checkout resolves to its
/// own root rather than the primary checkout's.
let private repositoryRoot: string =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

/// The binding surfaces the purge removed. Every assertion about "a dropped
/// harness surface" is stated against this list, so re-adding one of them to
/// `knownBindingDirs` fails the `@binding-surface-set` scenarios rather than
/// silently passing.
let private droppedHarnessSurfaces: string list = [ ".cursor"; ".amazonq"; ".pi" ]

/// Reads a governance document plus, when the document has a same-named
/// sibling directory (progressive disclosure's split-file convention), every
/// `.md` file under it in sorted order [Repo-grounded —
/// `apps/rhino-cli/tests/agents.rs::read_document_tree`].
let private readDocumentTree (rel: string) : string =
    let parentPath = Path.Combine(repositoryRoot, rel)
    let mutable out = File.ReadAllText(parentPath)
    let childrenDir = Path.ChangeExtension(parentPath, null)

    if Directory.Exists(childrenDir) then
        for child in Directory.GetFiles(childrenDir, "*.md") |> Array.sort do
            out <- out + "\n" + File.ReadAllText(child)

    out

/// Reads an agent's full instruction surface: its own definition plus every
/// skill it declares in `skills:` (each skill's `SKILL.md` and every file
/// under its `reference/` in sorted order) [Repo-grounded —
/// `apps/rhino-cli/tests/agents.rs::read_agent_surface`].
let private readAgentSurface (agentRel: string) : string =
    let agentPath = Path.Combine(repositoryRoot, agentRel)
    let mutable out = File.ReadAllText(agentPath)
    let mutable inSkills = false
    let declared = ResizeArray<string>()

    for line in out.Split('\n') do
        if line.StartsWith("skills:") then
            inSkills <- true
        elif inSkills then
            if line.StartsWith("  - ") then
                declared.Add(line.Substring(4).Trim())
            else
                inSkills <- false

    for skill in declared do
        let dir = Path.Combine(repositoryRoot, ".claude", "skills", skill)
        let refDir = Path.Combine(dir, "reference")

        let paths =
            Path.Combine(dir, "SKILL.md")
            :: (if Directory.Exists(refDir) then
                    Directory.GetFiles(refDir, "*.md") |> Array.sort |> Array.toList
                else
                    [])

        for path in paths do
            if File.Exists(path) then
                out <- out + "\n" + File.ReadAllText(path)

    out

/// The organization the OpenCode repository moved away from, split from its
/// path so no tracked file carries the full citation
/// [Repo-grounded — `tests/opencode_conformance.rs::FORMER_ORG`].
let private formerOrg = "sst"

/// The organization the OpenCode repository moved to.
let private currentOrg = "anomalyco"

/// The repository name, shared by both citations.
let private opencodeRepoName = "opencode"

let private formerCitation () : string =
    sprintf "%s/%s" formerOrg opencodeRepoName

let private currentCitation () : string =
    sprintf "%s/%s" currentOrg opencodeRepoName

/// Every `.md` file directly under `root`, sorted, mirroring
/// `ConformanceWorld::docs`.
let private conformanceDocs (root: string) : string list =
    Directory.GetFiles(root, "*.md") |> Array.sort |> Array.toList

let private countCiting (root: string) (needle: string) : int =
    conformanceDocs root
    |> List.filter (fun p -> (File.ReadAllText p).Contains(needle))
    |> List.length

/// Whether a directory name is an Eisenhower quadrant subfolder
/// [Repo-grounded — `tests/opencode_conformance.rs::is_quadrant`].
let private isQuadrant (name: string) : bool =
    name.Length >= 3
    && name.[0] = 'q'
    && name.[1] >= '1'
    && name.[1] <= '4'
    && name.[2] = '-'

/// Every `.md` brief under the given quadrant directories, as (quadrant,
/// file), sorted [Repo-grounded — `tests/opencode_conformance.rs::briefs_in`].
let private briefsIn (quadrants: string list) : (string * string) list =
    quadrants
    |> List.collect (fun quadrant ->
        let name = Path.GetFileName(quadrant.TrimEnd('/', '\\'))

        Directory.GetFiles(quadrant, "*.md")
        |> Array.toList
        |> List.map (fun path -> name, Path.GetFileName path))
    |> List.sort

/// Immediate `.agents/skills/` subdirectory names the emitter did not
/// generate, i.e. those with no `.claude/skills/` counterpart. Derived from
/// the tree itself, never hard-coded, because the vendored payload is
/// repository-local while this suite is byte-identical across sibling
/// repositories [Repo-grounded — `tests/skills_mirror.rs::unmirrored_agents_dirs`].
let private unmirroredAgentsSkillsDirs (root: string) : string list =
    let agentsSkills = Path.Combine(root, ".agents", "skills")

    if not (Directory.Exists agentsSkills) then
        []
    else
        Directory.GetDirectories agentsSkills
        |> Array.map Path.GetFileName
        |> Array.filter (fun name -> not (Directory.Exists(Path.Combine(root, ".claude", "skills", name))))
        |> Array.sort
        |> Array.toList

/// The `.agents/skills/` directory names the real repository's registry
/// declares as vendored, parsed out of `repo-config.yml`'s `vendored:` list.
/// Derived rather than hard-coded, because the vendored payload is
/// repository-local while this suite is byte-identical across sibling
/// repositories [Repo-grounded — `tests/skills_mirror.rs::vendored_from_registry`].
let private vendoredFromRegistry (root: string) : string list =
    File.ReadAllLines(Path.Combine(root, "repo-config.yml"))
    |> Array.choose (fun line ->
        let trimmed = line.Trim()

        if trimmed.StartsWith("- .agents/skills/", StringComparison.Ordinal) then
            let rest = trimmed.Substring("- .agents/skills/".Length)
            let token = rest.Split([| '/'; ' '; '#' |]).[0].Trim()
            if token = "" then None else Some token
        else
            None)
    |> Array.toList
    |> List.sort
    |> List.distinct

/// Fixture-only vendored directory names the `@vendored-skill-preservation`
/// stale-mirror scenario writes payload files under, mirroring
/// `VENDORED_DIRS` in the Rust suite — the real repository's vendored set is
/// read from its registry via [`vendoredFromRegistry`], never from this list.
let private vendoredFixtureDirs: string list =
    [ "vendor-alpha"
      "vendor-bravo"
      "vendor-charlie"
      "vendor-delta"
      "vendor-echo"
      "vendor-foxtrot"
      "vendor-golf"
      "vendor-hotel" ]

type private PlanStatus =
    | Draft
    | Complete

/// Instance step-definition container — see `ConventionSteps.fs`'s module doc
/// comment for why TickSpec's one-instance-per-scenario lifecycle makes
/// instance-level mutable fields the idiomatic state-threading mechanism here.
type HarnessResourceSteps() =
    let mutable scenarioRootDir: string option = None
    let mutable lastResult: Harness.ValidationResult option = None
    let mutable lastExitCode: int option = None
    let mutable lastNameError: string option = None
    let mutable trackedFileCounts: (string * int) list = []
    let mutable expectedPaths: string list = []
    let mutable knownDirs: string list = []
    let mutable duplicationFindings: Harness.DuplicationFinding list = []
    let mutable fixtureAgentPaths: string list = []
    let mutable fixtureSkillPaths: string list = []
    let mutable registryDeclaresSkillsMirror: bool = false
    let mutable mirrorResult: Harness.MirrorResult option = None
    let mutable mirrorDrift: Harness.MirrorDrift list option = None
    let mutable fixtureSkillNames: string list = []
    let mutable lastSyncOutcome: Result<Harness.SyncResult, string> option = None
    let mutable fixtureCodexAgentNames: string list = []
    let mutable fixtureRoleSubfolders: string list = []
    let mutable claudeRejectedAgent: string = ""
    let mutable claudeRejectedModel: string = ""

    /// One agent per grade of the four-grade vocabulary, paired with the Codex
    /// model and reasoning effort its mirror must carry.
    let mutable fixtureCodexTiers: (string * string * string) list = []
    let mutable configAfterFirstRun: string option = None
    let mutable configAfterSecondRun: string option = None
    let mutable pushRangePaths: string list = []
    let mutable lastPrePushOutcome: Harness.PrePushWordBudgetOutcome option = None
    let mutable lookupDir: string = ""
    let mutable lookupFileContent: string = ""
    let mutable lastAuditJson: string option = None
    let mutable lastHarnessAuditOutcome: Harness.HarnessAuditOutcome option = None
    let mutable lastCatalogOutcome: Harness.HarnessCatalogOutcome option = None
    let mutable catalogDocBefore: string option = None
    let mutable ownershipSourceDigestBefore: string option = None
    let mutable triageCloneRootDir: string option = None
    let mutable triageUseRealRepo: bool = false
    let mutable triageOutput: string = ""
    let mutable triageExitCode: int option = None
    let mutable promoteOutput: string = ""
    let mutable promoteExitCode: int option = None
    let mutable triageCanonicalBefore: string option = None
    let mutable bindingsValidateOutput: string = ""
    let mutable bindingsValidateExitCode: int option = None
    let mutable conformanceBefore: int option = None
    let mutable conformanceAfter: int option = None
    let mutable conformanceBriefs: (string * string) list = []
    let mutable vendoredGenerateOutcome: Result<unit, string> option = None
    let mutable planStatus = Draft
    let mutable lifecycleEvidence: Map<string, string> = Map.empty

    let scenarioRoot () : string =
        match scenarioRootDir with
        | Some dir -> dir
        | None ->
            let dir =
                Path.Combine(Path.GetTempPath(), "rhino-cli-harness-" + Guid.NewGuid().ToString("N"))

            Directory.CreateDirectory dir |> ignore
            scenarioRootDir <- Some dir
            dir

    /// The grade vocabulary both the Claude validator and the Codex emitter
    /// read from `repo-config.yml` at runtime. A fixture repository without it
    /// makes the validator fail closed and the emitter pin no Codex model, so
    /// every scenario that exercises a grade seeds one just as a real
    /// repository carries one.
    let writeGradeRegistry (root: string) : unit =
        File.WriteAllText(
            Path.Combine(root, "repo-config.yml"),
            String.Join(
                "\n",
                [ "model-grades:"
                  "  ultra: { effort: high }"
                  "  planning: { effort: high }"
                  "  execution: { effort: xhigh }"
                  "  fast: { effort: xhigh }"
                  "harness:"
                  "  - name: claude-code"
                  "    tier: source"
                  "    agent-dir: .claude/agents"
                  "    model-map: { ultra: fable, planning: opus, execution: sonnet, fast: haiku }"
                  "  - name: codex"
                  "    tier: generated"
                  "    agent-dir: .codex/agents"
                  "    mirrors: .claude/agents"
                  "    model-map: { ultra: gpt-6-astra, planning: gpt-5.6-sol, execution: gpt-5.6-terra, fast: gpt-5.6-luna }"
                  "" ]
            )
        )


    /// The smallest registry a fixture repository needs: a source tier plus the
    /// two generated mirrors, matching the shape production carries
    /// [Repo-grounded — `bindings.rs`'s `write_three_harness_config`].
    let writeThreeHarnessConfig (root: string) : unit =
        File.WriteAllText(
            Path.Combine(root, "repo-config.yml"),
            String.Join(
                "\n",
                [ "harness:"
                  "  - { name: claude-code, tier: source, agent-dir: .claude/agents }"
                  "  - name: opencode"
                  "    tier: generated"
                  "    agent-dir: .opencode/agents"
                  "    mirrors: .claude/agents"
                  "  - name: codex"
                  "    tier: generated"
                  "    agent-dir: .codex/agents"
                  "    mirrors: .claude/agents"
                  "coverage:"
                  "  projects: []"
                  "" ]
            )
        )

    /// The same registry, with the codex entry additionally declaring one file
    /// inside its generated agent directory as `vendored` — the shape a real
    /// repository uses for a hand-maintained tooling agent that has no
    /// `.claude/agents/` source and never will.
    let writeThreeHarnessConfigWithVendoredMirror (root: string) : unit =
        File.WriteAllText(
            Path.Combine(root, "repo-config.yml"),
            String.Join(
                "\n",
                [ "harness:"
                  "  - { name: claude-code, tier: source, agent-dir: .claude/agents }"
                  "  - name: opencode"
                  "    tier: generated"
                  "    agent-dir: .opencode/agents"
                  "    mirrors: .claude/agents"
                  "  - name: codex"
                  "    tier: generated"
                  "    agent-dir: .codex/agents"
                  "    mirrors: .claude/agents"
                  "    ownership:"
                  "      - { path: .codex/agents/vendored-probe.toml, class: vendored, reason: hand-maintained tooling agent }"
                  "coverage:"
                  "  projects: []"
                  "" ]
            )
        )

    /// The same registry, with the codex entry additionally declaring a
    /// skills-directory mirror alongside its existing agent-directory mirror
    /// — the shape `mirror_jobs` reads to build a [`Harness.MirrorJob`]
    /// [Repo-grounded — `skills_mirror.rs`'s test fixture builder].
    let writeThreeHarnessConfigWithSkillsMirror (root: string) : unit =
        File.WriteAllText(
            Path.Combine(root, "repo-config.yml"),
            String.Join(
                "\n",
                [ "harness:"
                  "  - { name: claude-code, tier: source, agent-dir: .claude/agents }"
                  "  - name: opencode"
                  "    tier: generated"
                  "    agent-dir: .opencode/agents"
                  "    mirrors: .claude/agents"
                  "  - name: codex"
                  "    tier: generated"
                  "    agent-dir: .codex/agents"
                  "    mirrors: .claude/agents"
                  "    skills-dir: .agents/skills"
                  "    skills-mirrors: .claude/skills"
                  "coverage:"
                  "  projects: []"
                  "" ]
            )
        )

    /// Repository-relative path of the catalog document in the fixture
    /// [Repo-grounded — `tests/harness_catalog.rs::CATALOG_DOC`].
    let catalogDoc = "docs/reference/platform-bindings.md"

    /// Prose the fixture carries above the generated region. Byte-identity
    /// of this text after a generate run is what proves the emitter rewrites
    /// only its own region [Repo-grounded —
    /// `tests/harness_catalog.rs::PROSE_BEFORE`].
    let catalogProseBefore =
        "# Platform Bindings\n\nFixture prose that the emitter must never touch. It carries a `pipe | character`\nand a trailing sentence so a naive whole-file rewrite is detectable.\n"

    /// Prose the fixture carries below the generated region, including a
    /// footnote definition the table cells reference but the emitter does
    /// not own [Repo-grounded — `tests/harness_catalog.rs::PROSE_AFTER`].
    let catalogProseAfter =
        "[^mcp]: A footnote definition the emitter does not own.\n\n## Related\n\n- A trailing list item.\n"

    /// Writes a fixture registry whose three harness entries each carry a
    /// full `catalog:` block, plus the sibling `harness-catalog:` block
    /// naming the document and the verification date
    /// [Repo-grounded — `tests/harness_catalog.rs::write_fixture_registry`].
    let writeFixtureCatalogRegistry (root: string) : unit =
        File.WriteAllText(
            Path.Combine(root, "repo-config.yml"),
            String.Join(
                "\n",
                [ "harness-catalog:"
                  "  document: docs/reference/platform-bindings.md"
                  "  verified: 2026-05-24"
                  ""
                  "harness:"
                  "  - name: alpha-harness"
                  "    tier: source"
                  "    agent-dir: .alpha/agents"
                  "    catalog:"
                  "      platform: Alpha Harness"
                  "      reads-agents-md: 'No -- reads `ALPHA.md`'"
                  "      instruction-surface: '`ALPHA.md`, `.alpha/`'"
                  "      mcp-config: '`.mcp.json`'"
                  "      agent-surface: '`.alpha/agents/*.md`'"
                  "      skills-surface: '`.alpha/skills/*/SKILL.md`'"
                  "      status: Active"
                  "  - name: beta-harness"
                  "    tier: generated"
                  "    agent-dir: .beta/agents"
                  "    mirrors: .alpha/agents"
                  "    catalog:"
                  "      platform: Beta Harness"
                  "      reads-agents-md: 'Yes'"
                  "      instruction-surface: '`.beta/agents/` (auto-synced)'"
                  "      mcp-config: '`beta.json`'"
                  "      agent-surface: '`.beta/agents/*.md`'"
                  "      skills-surface: 'reads `.alpha/skills/`'"
                  "      status: Active"
                  "  - name: gamma-harness"
                  "    tier: generated"
                  "    agent-dir: .gamma/agents"
                  "    mirrors: .alpha/agents"
                  "    catalog:"
                  "      platform: Gamma Harness"
                  "      reads-agents-md: 'Yes (since Apr 2025)'"
                  "      instruction-surface: '`.gamma/config.toml`'"
                  "      mcp-config: '`.gamma/config.toml` `[mcp_servers]`[^mcp]'"
                  "      agent-surface: '`.gamma/agents/<name>.toml`'"
                  "      skills-surface: '`.agents/skills/`'"
                  "      status: Partial"
                  "" ]
            )
        )

    /// Writes the catalog document with an EMPTY generated region, so a
    /// generate run has something to fill and the before-state carries no
    /// rows [Repo-grounded — `tests/harness_catalog.rs::write_fixture_document`].
    let writeFixtureCatalogDocument (root: string) : unit =
        let path = Path.Combine(root, catalogDoc)
        Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore

        File.WriteAllText(
            path,
            sprintf
                "%s\n%s\n%s\n\n%s"
                catalogProseBefore
                Harness.catalogRegionStart
                Harness.catalogRegionEnd
                catalogProseAfter
        )

    let catalogDocPath (root: string) : string = Path.Combine(root, catalogDoc)

    let readCatalogDoc (root: string) : string = File.ReadAllText(catalogDocPath root)

    /// The text strictly between the two markers, marker lines excluded
    /// [Repo-grounded — `tests/harness_catalog.rs::CatalogWorld::region`].
    let catalogRegionBody (root: string) : string =
        let body = readCatalogDoc root
        let start = body.IndexOf(Harness.catalogRegionStart, StringComparison.Ordinal)
        let stop = body.IndexOf(Harness.catalogRegionEnd, StringComparison.Ordinal)
        body.Substring(start + Harness.catalogRegionStart.Length, stop - (start + Harness.catalogRegionStart.Length))

    /// Everything outside the markers, with the region collapsed away, so a
    /// before/after comparison isolates the prose
    /// [Repo-grounded — `tests/harness_catalog.rs::CatalogWorld::outside`].
    let catalogOutsideRegion (body: string) : string =
        let start = body.IndexOf(Harness.catalogRegionStart, StringComparison.Ordinal)
        let stop = body.IndexOf(Harness.catalogRegionEnd, StringComparison.Ordinal)

        body.Substring(0, start)
        + body.Substring(stop + Harness.catalogRegionEnd.Length)

    /// Table rows inside the region — data rows only, excluding the header
    /// and the `| --- |` separator [Repo-grounded —
    /// `tests/harness_catalog.rs::CatalogWorld::row_count`].
    let catalogRowCount (root: string) : int =
        let dataRows =
            (catalogRegionBody root).Split('\n')
            |> Array.map (fun line -> line.TrimStart())
            |> Array.filter (fun line -> line.StartsWith("|"))
            |> Array.filter (fun line -> not (line.Contains("---")))

        max 0 (dataRows.Length - 1)

    let writeSkillFile (root: string) (name: string) (relPath: string) (body: string) : string =
        let path = Path.Combine(root, ".claude", "skills", name, relPath)
        Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore
        File.WriteAllText(path, body)
        path

    /// Every real (non-symlink) file under `dir`, checked via
    /// `FileSystemInfo.LinkTarget` — non-null only for a reparse point —
    /// which is .NET's cross-platform symlink detector.
    let rec allEntriesAreReal (dir: string) : bool =
        if not (Directory.Exists dir) then
            true
        else
            Directory.GetFileSystemEntries dir
            |> Array.forall (fun path ->
                let isDir = Directory.Exists path

                let info: FileSystemInfo = if isDir then DirectoryInfo path else FileInfo path

                isNull info.LinkTarget && (not isDir || allEntriesAreReal path))

    /// Materializes the mirror pair every sync check expects to find
    /// [Repo-grounded — `bindings.rs`'s `write_empty_mirror_pair`].
    let writeEmptyMirrorPair (root: string) : unit =
        Directory.CreateDirectory(Path.Combine(root, ".claude", "agents")) |> ignore
        Directory.CreateDirectory(Path.Combine(root, ".opencode", "agents")) |> ignore

    let writeCatalog (root: string) (body: string) : unit =
        let path = Path.Combine(root, "docs", "reference", "platform-bindings.md")
        Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore
        File.WriteAllText(path, body)

    /// A catalog body referencing every known binding directory, so coverage
    /// passes for whichever directories a fixture materializes
    /// [Repo-grounded — `bindings.rs`'s `full_catalog`].
    let fullCatalog () : string =
        let rows =
            Harness.knownBindingDirs |> List.map (fun dir -> sprintf "- `%s` row" dir)

        String.Join("\n", "# Platform Bindings" :: "" :: rows) + "\n"

    let runValidate (root: string) : unit =
        let result = Harness.validateBindings root
        lastResult <- Some result
        lastExitCode <- Some(if result.FailedChecks = 0 then 0 else 1)

    let result () : Harness.ValidationResult =
        match lastResult with
        | Some r -> r
        | None -> failwith "no validation has been run in this scenario"

    let exitCode () : int =
        match lastExitCode with
        | Some code -> code
        | None -> failwith "no command has been run in this scenario"

    // ---- @binding-ownership ----

    /// The undeclared file the falsifiability probe introduces
    /// [Repo-grounded — `tests/harness_ownership.rs::PROBE`].
    let ownershipProbe = ".opencode/probe-unowned.md"

    /// The single vendored directory the fixture registry declares
    /// [Repo-grounded — `tests/harness_ownership.rs::VENDOR_DIR`].
    let ownershipVendorDir = "vendor-plugin"

    /// Isolates a `git` subprocess against `root` per the Git Fixture
    /// Isolation Convention's Standards 1-3
    /// [Repo-grounded — `tests/support/git_fixture.rs::run_git`].
    let isolateOwnershipGit (root: string) (psi: ProcessStartInfo) =
        psi.EnvironmentVariables.["GIT_DIR"] <- Path.Combine(root, ".git")
        psi.EnvironmentVariables.["GIT_CEILING_DIRECTORIES"] <- root
        psi.EnvironmentVariables.["GIT_CONFIG_GLOBAL"] <- "/dev/null"
        psi.EnvironmentVariables.["GIT_CONFIG_SYSTEM"] <- "/dev/null"

    /// Runs a `git` subcommand against `root`, isolated, failing loud on a
    /// non-zero exit [Repo-grounded — `tests/support/git_fixture.rs::run_git`].
    let runOwnershipGit (root: string) (args: string list) : unit =
        use proc = new Process()
        proc.StartInfo.FileName <- "git"
        args |> List.iter proc.StartInfo.ArgumentList.Add
        proc.StartInfo.WorkingDirectory <- root
        proc.StartInfo.RedirectStandardOutput <- true
        proc.StartInfo.RedirectStandardError <- true
        proc.StartInfo.UseShellExecute <- false
        isolateOwnershipGit root proc.StartInfo
        proc.Start() |> ignore
        let stderr = proc.StandardError.ReadToEnd()
        proc.WaitForExit()

        if proc.ExitCode <> 0 then
            failwithf "git %s failed in %s: %s" (String.concat " " args) root stderr

    /// A fresh `git init` repository with a committable local identity
    /// [Repo-grounded — `tests/harness_ownership.rs::OwnershipWorld::new`].
    let initOwnershipGitFixture (root: string) : unit =
        runOwnershipGit root [ "init"; "-q"; "-b"; "main" ]
        runOwnershipGit root [ "config"; "user.name"; "Rhino CLI Test" ]
        runOwnershipGit root [ "config"; "user.email"; "rhino-cli-test@example.invalid" ]

    /// The fixture registry: three harnesses, every binding path classified.
    /// When `emitterTargetIsSource`, the OpenCode entry misdeclares its own
    /// output directory as source — the condition the generator must refuse
    /// [Repo-grounded — `tests/harness_ownership.rs::registry_yaml`].
    let ownershipRegistryYaml (emitterTargetIsSource: bool) : string =
        let opencodeAgentsClass = if emitterTargetIsSource then "source" else "generated"

        String.Join(
            "\n",
            [ "harness:"
              "  - name: claude-code"
              "    tier: source"
              "    agent-dir: .claude/agents"
              "    skills-dir: .claude/skills"
              "    ownership:"
              "      - { path: .claude/, class: source, reason: canonical hand-authored tree }"
              "  - name: opencode"
              "    tier: generated"
              "    agent-dir: .opencode/agents"
              "    mirrors: .claude/agents"
              "    ownership:"
              sprintf
                  "      - { path: .opencode/agents, class: %s, reason: emitted from .claude/agents }"
                  opencodeAgentsClass
              "  - name: codex"
              "    tier: generated"
              "    agent-dir: .codex/agents"
              "    mirrors: .claude/agents"
              "    config: .codex/config.toml"
              "    skills-dir: .agents/skills"
              "    skills-mirrors: .claude/skills"
              "    vendored:"
              sprintf "      - .agents/skills/%s" ownershipVendorDir
              "    ownership:"
              "      - { path: .codex/agents, class: generated, reason: emitted from .claude/agents }"
              "      - { path: .codex/config.toml, class: vendored, reason: tooling config with a delimited region }"
              "      - { path: .agents/skills, class: generated, reason: mirrored from .claude/skills }"
              sprintf
                  "      - { path: .agents/skills/%s, class: vendored, reason: third-party plugin skill; no in-repo source }"
                  ownershipVendorDir
              "coverage:"
              "  projects: []"
              "" ]
        )

    let writeOwnershipRegistry (root: string) (emitterTargetIsSource: bool) : unit =
        File.WriteAllText(Path.Combine(root, "repo-config.yml"), ownershipRegistryYaml emitterTargetIsSource)

    /// `harness bindings validate` asserts every present binding directory is
    /// referenced in the catalog; a fixture missing it fails for a reason
    /// unrelated to ownership
    /// [Repo-grounded — `tests/harness_ownership.rs::write_supporting_docs`].
    /// `harness bindings validate` resolves every agent `color:`/`model:`
    /// value against a governance map, so a fixture lacking those two docs
    /// would fail for a reason unrelated to ownership
    /// [Repo-grounded — `tests/harness_ownership.rs::write_supporting_docs`].
    let writeOwnershipSupportingDocs (root: string) : unit =
        writeCatalog root (fullCatalog ())

        let govDir = Path.Combine(root, "repo-governance", "development", "agents")
        Directory.CreateDirectory govDir |> ignore

        File.WriteAllText(Path.Combine(govDir, "ai-agents.md"), "# AI Agents\n\nColor translation: `blue`\n")

        File.WriteAllText(
            Path.Combine(govDir, "model-selection.md"),
            "# Model Selection\n\nCapability tiers: `sonnet`, `haiku`, `opus`\n"
        )

    /// A valid Claude agent. `tools:`/`model:` are present because the
    /// OpenCode equivalence check translates both; `color:` is omitted
    /// because its translation map is governance prose this fixture has no
    /// reason to carry [Repo-grounded — `tests/harness_ownership.rs::write_agent`].
    let writeOwnershipAgent (root: string) (name: string) : unit =
        let dir = Path.Combine(root, ".claude", "agents")
        Directory.CreateDirectory dir |> ignore

        File.WriteAllText(
            Path.Combine(dir, name + ".md"),
            sprintf "---\nname: %s\ndescription: Agent %s.\ntools: Read, Write\nmodel: sonnet\n---\n# Body\n" name name
        )

    let writeOwnershipSkill (root: string) (name: string) : unit =
        let dir = Path.Combine(root, ".claude", "skills", name)
        Directory.CreateDirectory dir |> ignore

        File.WriteAllText(
            Path.Combine(dir, "SKILL.md"),
            sprintf "---\nname: %s\ndescription: Skill %s.\n---\n# Skill body\n" name name
        )

    /// Builds a complete fixture, generates the bindings, and commits
    /// everything so the validator — which reads the git index — can see it
    /// [Repo-grounded — `tests/harness_ownership.rs::OwnershipWorld::build_and_commit`].
    let buildAndCommitOwnershipFixture (root: string) : unit =
        writeOwnershipRegistry root false
        writeOwnershipSupportingDocs root
        writeOwnershipAgent root "alpha"
        writeOwnershipSkill root "beta"

        let vendorDir = Path.Combine(root, ".agents", "skills", ownershipVendorDir)
        Directory.CreateDirectory vendorDir |> ignore

        File.WriteAllText(
            Path.Combine(vendorDir, "SKILL.md"),
            "---\nname: vendor-plugin\ndescription: Third-party.\n---\n# Vendored\n"
        )

        initOwnershipGitFixture root

        match Harness.runHarnessBindingsGenerate root with
        | Ok() -> ()
        | Error e -> failwithf "fixture generate: %s" e

        runOwnershipGit root [ "add"; "-A" ]
        runOwnershipGit root [ "commit"; "-q"; "-m"; "fixture" ]

    /// A stable digest of every file under `rel`, so a before/after
    /// comparison catches a rewrite as well as an addition or deletion
    /// [Repo-grounded — `tests/harness_ownership.rs::tree_digest`].
    let ownershipTreeDigest (root: string) (rel: string) : string =
        let rec walk (dir: string) : (string * int64) list =
            if not (Directory.Exists dir) then
                []
            else
                let files =
                    Directory.GetFiles dir
                    |> Array.map (fun f -> Path.GetRelativePath(root, f).Replace('\\', '/'), FileInfo(f).Length)
                    |> List.ofArray

                let subdirs = Directory.GetDirectories dir |> Array.toList |> List.collect walk
                files @ subdirs

        walk (Path.Combine(root, rel))
        |> List.sortBy fst
        |> List.map (fun (p, len) -> sprintf "%s:%d" p len)
        |> String.concat "|"

    let runOwnershipValidate (root: string) : unit =
        let outcome = Harness.validateOwnership root
        lastResult <- Some outcome
        lastExitCode <- Some(if outcome.FailedChecks = 0 then 0 else 1)

    let ownershipMentions (target: string) : bool =
        (result ()).Checks
        |> List.exists (fun c ->
            c.Status <> "passed"
            && (c.Name.Contains(target, StringComparison.Ordinal)
                || c.Message.Contains(target, StringComparison.Ordinal)))

    // ---- @sync-triage ----

    /// The plain agent: nothing in its frontmatter is unrepresentable
    /// downstream [Repo-grounded — `tests/harness_sync_triage.rs::PLAIN`].
    let triagePlainAgent = "alpha"

    /// The rich agent: carries two fields every downstream policy drops with
    /// a warning, so the at-risk list has something real to compute
    /// [Repo-grounded — `tests/harness_sync_triage.rs::RICH`].
    let triageRichAgent = "rich"

    /// The two canonical fields [`triageRichAgent`] carries that no mirror
    /// schema can hold
    /// [Repo-grounded — `tests/harness_sync_triage.rs::UNREPRESENTABLE`].
    let triageUnrepresentableFields = [ "permissionMode"; "isolation" ]

    /// The root the next command runs against: the real repository, a fresh
    /// clone, or the scenario's own fixture — mirroring
    /// `TriageWorld::root`'s three-way choice.
    let triageRoot () : string =
        match triageCloneRootDir with
        | Some dir -> dir
        | None ->
            if triageUseRealRepo then
                repositoryRoot
            else
                scenarioRoot ()

    /// A Claude agent with extra frontmatter lines injected before the
    /// closing `---`, so the same writer produces both the plain and the
    /// rich fixture agent
    /// [Repo-grounded — `tests/harness_sync_triage.rs::TriageWorld::build_and_commit`].
    let writeTriageAgent (root: string) (name: string) (extraFrontmatter: string) : unit =
        let dir = Path.Combine(root, ".claude", "agents")
        Directory.CreateDirectory dir |> ignore

        File.WriteAllText(
            Path.Combine(dir, name + ".md"),
            sprintf
                "---\nname: %s\ndescription: Agent %s.\ntools: Read, Write\nmodel: sonnet\n%s---\n# Body\n"
                name
                name
                extraFrontmatter
        )

    /// A complete fixture — the same registry shape [`ownershipRegistryYaml`]
    /// already builds, two agents, one skill, one vendored plugin directory —
    /// generated, then committed so the classifier (which reads the git
    /// index) and the attribution step (which compares against `HEAD`) both
    /// have something to read
    /// [Repo-grounded — `tests/harness_sync_triage.rs::TriageWorld::build_and_commit`].
    let buildAndCommitTriageFixture (root: string) : unit =
        writeOwnershipRegistry root false
        writeOwnershipSupportingDocs root
        writeTriageAgent root triagePlainAgent ""
        writeTriageAgent root triageRichAgent "permissionMode: acceptEdits\nisolation: worktree\n"
        writeOwnershipSkill root "beta"

        let vendorDir = Path.Combine(root, ".agents", "skills", ownershipVendorDir)
        Directory.CreateDirectory vendorDir |> ignore

        File.WriteAllText(
            Path.Combine(vendorDir, "SKILL.md"),
            "---\nname: vendor-plugin\ndescription: Third-party.\n---\n# Vendored\n"
        )

        initOwnershipGitFixture root

        match Harness.runHarnessBindingsGenerate root with
        | Ok() -> ()
        | Error e -> failwithf "fixture generate: %s" e

        runOwnershipGit root [ "add"; "-A" ]
        runOwnershipGit root [ "commit"; "-q"; "-m"; "fixture" ]

    /// Appends `line` to the working-tree file at `rel`, under `root`.
    let appendToTriageFile (root: string) (rel: string) (line: string) : unit =
        let path = Path.Combine(root, rel.Replace('/', Path.DirectorySeparatorChar))
        File.AppendAllText(path, line)

    /// Restores `rel` to its `HEAD` content via `git checkout --`, the
    /// falsifiability half of every triage scenario
    /// [Repo-grounded — `tests/harness_sync_triage.rs::TriageWorld::restore`].
    let restoreTriageFile (root: string) (rel: string) : unit =
        runOwnershipGit root [ "checkout"; "--"; rel ]

    /// Runs [`Harness.triage`] against `root`, rendering the same summary
    /// line and per-divergence blocks `harness_sync_triage.rs::run` prints
    /// [Repo-grounded — `harness_sync_triage.rs::run`].
    let runTriage (root: string) : unit =
        match Harness.triage root with
        | Error e ->
            triageOutput <- e
            triageExitCode <- Some 1
        | Ok report ->
            let summary =
                sprintf
                    "harness sync triage: %d generated file(s) compared, %d divergence(s)"
                    report.Compared
                    (List.length report.Divergences)

            let body =
                report.Divergences |> List.map Harness.formatDivergence |> String.concat ""

            triageOutput <- summary + "\n" + body
            triageExitCode <- Some(if List.isEmpty report.Divergences then 0 else 1)

    /// Runs [`Harness.promote`] against `root`, rendering the same proposal
    /// text `harness_sync_promote.rs::run` prints
    /// [Repo-grounded — `harness_sync_promote.rs::run`].
    let runPromote (root: string) (mirrorRel: string) : unit =
        match Harness.promote root mirrorRel with
        | Error e ->
            promoteOutput <- e
            promoteExitCode <- Some 1
        | Ok proposal ->
            promoteOutput <- Harness.formatProposal proposal
            promoteExitCode <- Some 0

    /// Runs the check family a hand-edited generated mirror actually reaches
    /// today — [`Harness.validateSync`]'s per-agent equivalence check, now
    /// carrying [`Harness.driftRemediation`]'s canonical+promote wording on
    /// its body-mismatch failure. Static binding-file byte parity
    /// (`bindings.rs::validate_binding_file`, the check family Rust's own
    /// fixture edits a `.codex/agents/*.toml` mirror to reach) stays out of
    /// scope per this module's doc-header scope notes, so this scenario's
    /// fixture hand-edits the `.opencode/` mirror instead — the same
    /// "generated mirror carries a hand edit" behaviour, reached through the
    /// check family this port actually implements.
    let runBindingsValidateNoTriage (root: string) : unit =
        let outcome = Harness.validateSync root

        bindingsValidateOutput <-
            outcome.Checks
            |> List.map (fun c -> sprintf "%s: %s (%s)" c.Name c.Status c.Message)
            |> String.concat "\n"

        bindingsValidateExitCode <- Some(if outcome.FailedChecks = 0 then 0 else 1)

    /// The hard-stop block alone, so an assertion about what it does NOT
    /// offer is not satisfied — or defeated — by a neighbouring divergence's
    /// block. The both-diverged fixture's canonical edit also leaves the
    /// unrelated Codex mirror one step behind (a real, correctly-detected
    /// "canonical is ahead" divergence alongside the intended both-diverged
    /// one), so isolating this block is load-bearing, not defensive
    /// [Repo-grounded — `tests/harness_sync_triage.rs::hard_stop_block`].
    let triageHardStopBlock (output: string) : string =
        let marker = output.IndexOf("HARD STOP", StringComparison.Ordinal)

        if marker < 0 then
            failwith "no hard stop block in triage output"
        else
            let start =
                match output.LastIndexOf('\n', marker) with
                | -1 -> 0
                | i -> i + 1

            let rest = output.Substring(start)
            let searchFrom = marker - start + 1

            match rest.IndexOf("\n\u2718", searchFrom, StringComparison.Ordinal) with
            | -1 -> rest
            | endIdx -> rest.Substring(0, endIdx)

    /// Runs `git ls-files -- <path>` at the repository root and returns the
    /// number of tracked paths it reports.
    let trackedFileCount (path: string) : int =
        let psi = ProcessStartInfo("git")
        psi.WorkingDirectory <- repositoryRoot
        psi.RedirectStandardOutput <- true
        psi.RedirectStandardError <- true
        psi.UseShellExecute <- false
        psi.ArgumentList.Add "ls-files"
        psi.ArgumentList.Add "--"
        psi.ArgumentList.Add path

        use proc = Process.Start psi
        let stdout = proc.StandardOutput.ReadToEnd()
        proc.WaitForExit()

        Assert.Equal(0, proc.ExitCode)

        stdout.Split('\n')
        |> Array.filter (fun line -> line.Trim() <> "")
        |> Array.length

    // ---- @agents-detect-duplication ----

    /// Writes an agent definition under the fixture's `.claude/agents/` and
    /// records its path. Names deliberately avoid the sanctioned role suffixes
    /// (`-maker`, `-checker`, `-fixer`, `-deployer`, `-dev`, `-tester`): two
    /// files in the same template family are *expected* to share boilerplate,
    /// so a fixture named `alpha-checker`/`beta-checker` would be exempted and
    /// the scenario would pass for the wrong reason.
    let writeAgent (root: string) (name: string) (body: string) : string =
        let dir = Path.Combine(root, ".claude", "agents")
        Directory.CreateDirectory dir |> ignore
        let path = Path.Combine(dir, name + ".md")
        File.WriteAllText(path, sprintf "---\nname: %s\ndescription: fixture\n---\n%s" name body)
        fixtureAgentPaths <- fixtureAgentPaths @ [ path ]
        path

    let writeSkill (root: string) (name: string) (body: string) : string =
        let dir = Path.Combine(root, ".claude", "skills", name)
        Directory.CreateDirectory dir |> ignore
        let path = Path.Combine(dir, "SKILL.md")
        File.WriteAllText(path, sprintf "---\nname: %s\ndescription: fixture\n---\n%s" name body)
        fixtureSkillPaths <- fixtureSkillPaths @ [ path ]
        path

    /// `count` distinct prose lines seeded by `tag`, so two blocks built with
    /// different tags share no window and one block repeated verbatim does.
    let prose (tag: string) (count: int) : string =
        String.Join("\n", [ for i in 1..count -> sprintf "%s line %d carries its own sentence." tag i ])
        + "\n"

    let findingSpanning (paths: string list) : Harness.DuplicationFinding list =
        duplicationFindings
        |> List.filter (fun finding -> paths |> List.forall (fun path -> List.contains path finding.Files))

    // ---- @agents-sync / @agents-validate-sync ----

    let writeAgentWithModel (root: string) (name: string) (model: string) : string =
        let dir = Path.Combine(root, ".claude", "agents")
        Directory.CreateDirectory dir |> ignore
        let path = Path.Combine(dir, name + ".md")

        File.WriteAllText(
            path,
            sprintf
                "---\nname: %s\ndescription: fixture\ntools: Read, Write\nmodel: %s\ncolor: blue\n---\nAgent body.\n"
                name
                model
        )

        path

    let readFrontmatterField (path: string) (field: string) : string option =
        File.ReadAllText(path).Split('\n')
        |> Array.tryPick (fun line ->
            let trimmed = line.Trim()

            if trimmed.StartsWith(field + ":", StringComparison.Ordinal) then
                Some(trimmed.Substring(field.Length + 1).Trim().Trim('"'))
            else
                None)

    let runSyncOnce (opts: Harness.SyncOptions) : unit =
        let outcome = Harness.syncAll opts
        lastSyncOutcome <- Some outcome

        lastExitCode <-
            Some(
                match outcome with
                | Ok _ -> 0
                | Error _ -> 1
            )

    /// The block the AI Agents Convention requires in every agent body. A
    /// fixture that omitted it would fail validation on that ground alone,
    /// masking whatever its scenario is actually about.
    let justifiedBodyFor (model: string) =
        sprintf "**Model Selection Justification**: `model: %s` — fixture.\n" model

    let justifiedBody = justifiedBodyFor "sonnet"

    /// Writes a fully valid agent: every required and known optional field
    /// present, so it triggers neither a failed nor a warning check.
    let writeValidatedAgent (root: string) (name: string) (skills: string list) : string =
        let dir = Path.Combine(root, ".claude", "agents")
        Directory.CreateDirectory dir |> ignore
        let path = Path.Combine(dir, name + ".md")

        let skillsBlock =
            if skills.IsEmpty then
                ""
            else
                "skills:\n" + String.Join("\n", skills |> List.map (sprintf "  - %s")) + "\n"

        File.WriteAllText(
            path,
            sprintf
                // `sonnet` is the execution grade, whose declared effort is
                // `xhigh`; a fixture that omitted it would contradict its own grade.
                "---\nname: %s\ndescription: fixture agent\ntools: Read, Write\nmodel: sonnet\neffort: xhigh\ncolor: blue\n%s---\n%s"
                name
                skillsBlock
                justifiedBody
        )

        path

    /// Writes a fully valid skill: `SKILL.md` present with a `description`
    /// and a `name` matching the directory.
    let writeValidatedSkill (root: string) (name: string) : string =
        let dir = Path.Combine(root, ".claude", "skills", name)
        Directory.CreateDirectory dir |> ignore
        let path = Path.Combine(dir, "SKILL.md")
        File.WriteAllText(path, sprintf "---\nname: %s\ndescription: fixture skill\n---\nBody.\n" name)
        path

    let runValidateClaudeOnce (opts: Harness.ValidateClaudeOptions) : unit =
        let r = Harness.validateClaude opts
        lastResult <- Some r
        lastExitCode <- Some(if r.FailedChecks = 0 then 0 else 1)

    /// Writes a Claude agent under a role subfolder — `.claude/agents/<subfolder>/<fileStem>.md` —
    /// with `name` frontmatter that may differ from `fileStem`, matching
    /// `discover_agent_sources`'s one-level group-nesting walk.
    let writeCodexAgentUnderSubfolder
        (root: string)
        (subfolder: string)
        (fileStem: string)
        (name: string)
        (description: string)
        (body: string)
        : string =
        let dir = Path.Combine(root, ".claude", "agents", subfolder)
        Directory.CreateDirectory dir |> ignore
        let path = Path.Combine(dir, fileStem + ".md")
        File.WriteAllText(path, sprintf "---\nname: %s\ndescription: %s\n---\n%s" name description body)
        path

    /// As `writeCodexAgentUnderSubfolder`, plus the `model` and `effort`
    /// frontmatter the Codex mirror translates onto `model` and
    /// `model_reasoning_effort`.
    let writeTieredCodexAgent
        (root: string)
        (subfolder: string)
        (name: string)
        (model: string)
        (effort: string)
        : string =
        let dir = Path.Combine(root, ".claude", "agents", subfolder)
        Directory.CreateDirectory dir |> ignore
        let path = Path.Combine(dir, name + ".md")

        File.WriteAllText(
            path,
            sprintf "---\nname: %s\ndescription: %s fixture\nmodel: %s\neffort: %s\n---\nBody.\n" name name model effort
        )

        path

    /// Mirrors the live `governance-word-budget:` surfaces for `AGENTS.md` and
    /// `RTK.md` in `repo-config.yml` (650/750/750), scoped to just the two
    /// surfaces this feature's scenarios name — not the full 9-surface table
    /// `GovernanceWordBudgetSteps.fs`'s own canonical fixture carries. The F#
    /// pre-push gate reads only its resolved tree (CLAUDE.md, fail 1500).
    let wordBudgetFixtureConfig: Governance.BudgetConfig =
        let surface (glob: string) : Governance.Surface =
            { Glob = glob
              Target = 650UL
              Warn = 750UL
              Fail = 750UL }

        { Surfaces = [ surface "AGENTS.md"; surface "RTK.md" ]
          ResolvedTree =
            { Root = "CLAUDE.md"
              Target = 1200UL
              Warn = 1500UL
              Fail = 1500UL } }

    /// `n` single-character, single-space-separated "words" — the same
    /// fixture-construction trick `GovernanceWordBudgetSteps.fs`'s `nWords` uses.
    let nWordsBudget (n: int) : string =
        String.Join(" ", Array.create (max 0 n) "w")

    let writeBudgetFixture (root: string) (relPath: string) (n: int) : unit =
        File.WriteAllText(Path.Combine(root, relPath), nWordsBudget n)

    [<Given>]
    member _.``a \.claude/ directory with valid agents and skills``() =
        let root = scenarioRoot ()
        writeAgent root "sync-fixture-agent" "Agent body.\n" |> ignore
        writeSkill root "sync-fixture-skill" "Skill body.\n" |> ignore

    [<Given>]
    member _.``a \.claude/ directory with agents and skills to convert``() =
        let root = scenarioRoot ()
        writeAgent root "sync-fixture-agent" "Agent body.\n" |> ignore
        writeSkill root "sync-fixture-skill" "Skill body.\n" |> ignore

    [<Given>]
    member _.``a \.claude/ directory with both agents and skills``() =
        let root = scenarioRoot ()
        writeAgent root "sync-fixture-agent" "Agent body.\n" |> ignore
        writeSkill root "sync-fixture-skill" "Skill body.\n" |> ignore

    [<Given>]
    member _.``a \.claude/ agent configured with the "([^"]+)" model``(model: string) =
        writeAgentWithModel (scenarioRoot ()) "sync-model-agent" model |> ignore

    [<Given>]
    member _.``\.claude/ and \.opencode/ configurations that are fully synchronised``() =
        let root = scenarioRoot ()
        writeAgentWithModel root "sync-parity-agent" "sonnet" |> ignore

        match Harness.convertAllAgents root false with
        | Ok _ -> ()
        | Error e -> failwith e

    [<Given>]
    member _.``an agent in \.claude/ whose description differs from its \.opencode/ counterpart``() =
        let root = scenarioRoot ()
        writeAgentWithModel root "sync-mismatch-agent" "sonnet" |> ignore

        match Harness.convertAllAgents root false with
        | Ok _ -> ()
        | Error e -> failwith e

        let mirrorPath = Path.Combine(root, ".opencode", "agents", "sync-mismatch-agent.md")
        let content = File.ReadAllText mirrorPath

        File.WriteAllText(
            mirrorPath,
            content.Replace("description: fixture", "description: \"a different description\"")
        )

    [<Given>]
    member _.``\.claude/ containing more agents than \.opencode/``() =
        let root = scenarioRoot ()
        writeAgent root "sync-count-agent-one" "Agent body.\n" |> ignore
        writeAgent root "sync-count-agent-two" "Agent body.\n" |> ignore
        Directory.CreateDirectory(Path.Combine(root, ".opencode", "agents")) |> ignore

    [<When>]
    member _.``the developer runs rhino-cli harness bindings generate``() =
        runSyncOnce (Harness.syncOptionsDefault (scenarioRoot ()))

    [<When>]
    member _.``the developer runs rhino-cli harness bindings generate with the --dry-run flag``() =
        runSyncOnce
            { Harness.syncOptionsDefault (scenarioRoot ()) with
                DryRun = true }

    [<When>]
    member _.``the developer runs rhino-cli harness bindings generate with the --agents-only flag``() =
        runSyncOnce
            { Harness.syncOptionsDefault (scenarioRoot ()) with
                AgentsOnly = true }

    [<When>]
    member _.``the developer runs rhino-cli harness sync validate``() =
        let r = Harness.validateSync (scenarioRoot ())
        lastResult <- Some r
        lastExitCode <- Some(if r.FailedChecks = 0 then 0 else 1)

    [<Then>]
    member _.``the \.opencode/ directory contains the converted configuration``() =
        let root = scenarioRoot ()
        Assert.True(File.Exists(Path.Combine(root, ".opencode", "agents", "sync-fixture-agent.md")))
        Assert.True(Directory.Exists(Path.Combine(root, ".claude", "skills", "sync-fixture-skill")))

    [<Then>]
    member _.``the output describes the planned operations``() =
        match lastSyncOutcome with
        | Some(Ok r) -> Assert.True(r.AgentsConverted > 0)
        | Some(Error e) -> failwith e
        | None -> failwith "no sync has run in this scenario"

    [<Then>]
    member _.``no files are written to the \.opencode/ directory``() =
        Assert.False(Directory.Exists(Path.Combine(scenarioRoot (), ".opencode")))

    [<Then>]
    member _.``only agent files are written to the \.opencode/ directory``() =
        let root = scenarioRoot ()
        Assert.True(File.Exists(Path.Combine(root, ".opencode", "agents", "sync-fixture-agent.md")))
        Assert.False(Directory.Exists(Path.Combine(root, ".opencode", "skills")))

    [<Then>]
    member _.``the corresponding \.opencode/ agent declares no model identifier``() =
        let mirrorPath =
            Path.Combine(scenarioRoot (), ".opencode", "agents", "sync-model-agent.md")

        match readFrontmatterField mirrorPath "model" with
        | Some m -> failwithf "mirror pins model %s; it should declare none" m
        | None -> ()

    [<Then>]
    member _.``the output reports all sync checks as passing``() =
        let notPassed = (result ()).Checks |> List.filter (fun c -> c.Status <> "passed")

        Assert.Equal<Harness.ValidationCheck list>([], notPassed)

    [<Then>]
    member _.``the output identifies the agent with the mismatched description``() =
        let mismatch =
            (result ()).Checks
            |> List.tryFind (fun c -> c.Status = "failed" && c.Message = "description mismatch")

        Assert.True(mismatch.IsSome)

    [<Then>]
    member _.``the output reports the agent count mismatch``() =
        match (result ()).Checks |> List.tryFind (fun c -> c.Name = "Agent Count") with
        | Some c -> Assert.Equal("failed", c.Status)
        | None -> failwith "no Agent Count check found"

    // ---- @agents-validate-claude ----

    [<Given>]
    member _.``a \.claude/ directory where all agents and skills are valid``() =
        let root = scenarioRoot ()
        writeGradeRegistry root
        writeValidatedAgent root "validate-claude-ok-agent" [] |> ignore
        writeValidatedSkill root "validate-claude-ok-skill" |> ignore

    [<Given>]
    member _.``a \.claude/ directory where one agent is missing the required "description" field``() =
        let root = scenarioRoot ()
        writeGradeRegistry root
        let dir = Path.Combine(root, ".claude", "agents")
        Directory.CreateDirectory dir |> ignore

        File.WriteAllText(
            Path.Combine(dir, "validate-claude-missing-desc.md"),
            "---\nname: validate-claude-missing-desc\ntools: Read, Write\nmodel: sonnet\ncolor: blue\n---\nBody.\n"
        )

    [<Given>]
    member _.``a \.claude/ directory where one agent declares the "fable" model alias``() =
        let root = scenarioRoot ()
        writeGradeRegistry root
        let dir = Path.Combine(root, ".claude", "agents")
        Directory.CreateDirectory dir |> ignore

        File.WriteAllText(
            Path.Combine(dir, "validate-claude-ultra.md"),
            "---\nname: validate-claude-ultra\ndescription: fixture agent\ntools: Read, Write\nmodel: fable\neffort: high\ncolor: blue\n---\n"
            + justifiedBodyFor "fable"
        )

        writeValidatedSkill root "validate-claude-ultra-skill" |> ignore

    [<Given>]
    member _.``a \.claude/ directory where one agent declares the "gpt-4" model alias``() =
        let root = scenarioRoot ()
        writeGradeRegistry root
        let dir = Path.Combine(root, ".claude", "agents")
        Directory.CreateDirectory dir |> ignore
        claudeRejectedAgent <- "validate-claude-foreign-model"
        claudeRejectedModel <- "gpt-4"

        File.WriteAllText(
            Path.Combine(dir, "validate-claude-foreign-model.md"),
            "---\nname: validate-claude-foreign-model\ndescription: fixture agent\ntools: Read, Write\nmodel: gpt-4\ncolor: blue\n---\nBody.\n"
        )

    /// The fixture is deliberately INVALID: a passing result would be
    /// indistinguishable from the file never having been discovered, which is
    /// exactly the false zero the recursive walk fixes.
    [<Given>]
    member _.``a \.claude/ directory where the only agent sits in a role subfolder``() =
        let root = scenarioRoot ()
        writeGradeRegistry root
        let dir = Path.Combine(root, ".claude", "agents", "swe")
        Directory.CreateDirectory dir |> ignore
        claudeRejectedAgent <- "validate-claude-nested"
        claudeRejectedModel <- "gpt-4"

        File.WriteAllText(
            Path.Combine(dir, "validate-claude-nested.md"),
            "---\nname: validate-claude-nested\ndescription: fixture agent\ntools: Read, Write\nmodel: gpt-4\ncolor: blue\n---\nBody.\n"
        )

    [<Given>]
    member _.``a \.claude/ directory where one agent declares no model field``() =
        let root = scenarioRoot ()
        writeGradeRegistry root
        let dir = Path.Combine(root, ".claude", "agents")
        Directory.CreateDirectory dir |> ignore
        claudeRejectedAgent <- "validate-claude-no-model"
        claudeRejectedModel <- ""

        File.WriteAllText(
            Path.Combine(dir, "validate-claude-no-model.md"),
            "---\nname: validate-claude-no-model\ndescription: fixture agent\ntools: Read, Write\ncolor: blue\n---\nBody.\n"
        )

    [<Given>]
    member _.``a \.claude/ directory where one agent declares an effort its grade does not``() =
        let root = scenarioRoot ()
        writeGradeRegistry root
        let dir = Path.Combine(root, ".claude", "agents")
        Directory.CreateDirectory dir |> ignore

        // `sonnet` is the execution grade, whose declared effort is `xhigh`.
        File.WriteAllText(
            Path.Combine(dir, "validate-claude-wrong-effort.md"),
            "---\nname: validate-claude-wrong-effort\ndescription: fixture agent\ntools: Read, Write\nmodel: sonnet\neffort: low\ncolor: blue\n---\nBody.\n"
        )

    /// A registry whose claude-code entry declares no `model-map` leaves the
    /// validator with an empty vocabulary — the state it must refuse rather
    /// than wave through.
    [<Given>]
    member _.``a \.claude/ directory whose repo-config\.yml declares no model-map for claude-code``() =
        let root = scenarioRoot ()

        File.WriteAllText(
            Path.Combine(root, "repo-config.yml"),
            "harness:\n  - { name: claude-code, tier: source, agent-dir: .claude/agents }\n"
        )

        writeValidatedAgent root "validate-claude-no-vocabulary" [] |> ignore

    [<Given>]
    member _.``a \.claude/ directory where one agent's body states no model selection justification``() =
        let root = scenarioRoot ()
        writeGradeRegistry root
        let dir = Path.Combine(root, ".claude", "agents")
        Directory.CreateDirectory dir |> ignore

        // Conforming frontmatter, a body that argues nothing.
        File.WriteAllText(
            Path.Combine(dir, "validate-claude-unargued.md"),
            "---\nname: validate-claude-unargued\ndescription: fixture agent\ntools: Read, Write\nmodel: sonnet\neffort: xhigh\ncolor: blue\n---\nBody.\n"
        )

    /// Conforming frontmatter whose block argues for a different grade — the
    /// drift a promotion leaves behind when it edits the frontmatter only.
    [<Given>]
    member _.``a \.claude/ directory where one agent's justification names a grade its frontmatter does not``() =
        let root = scenarioRoot ()
        writeGradeRegistry root
        let dir = Path.Combine(root, ".claude", "agents")
        Directory.CreateDirectory dir |> ignore

        File.WriteAllText(
            Path.Combine(dir, "validate-claude-drifted.md"),
            "---\nname: validate-claude-drifted\ndescription: fixture agent\ntools: Read, Write\nmodel: opus\neffort: high\ncolor: blue\n---\n"
            + justifiedBodyFor "sonnet"
        )

    [<Given>]
    member _.``a \.claude/ directory containing two agent files declaring the same name``() =
        let root = scenarioRoot ()
        writeGradeRegistry root
        let dir = Path.Combine(root, ".claude", "agents")
        Directory.CreateDirectory dir |> ignore

        for suffix in [ "a"; "b" ] do
            File.WriteAllText(
                Path.Combine(dir, sprintf "validate-claude-dup-%s.md" suffix),
                "---\nname: validate-claude-dup\ndescription: fixture agent\ntools: Read, Write\nmodel: sonnet\ncolor: blue\n---\nBody.\n"
            )

    [<Given>]
    member _.``a \.claude/ directory where agents are valid but skills have issues``() =
        let root = scenarioRoot ()
        writeGradeRegistry root
        writeValidatedAgent root "validate-claude-agents-only-ok" [] |> ignore
        // Deliberately no SKILL.md — a skill-side failure --agents-only must not surface.
        Directory.CreateDirectory(Path.Combine(root, ".claude", "skills", "validate-claude-broken-skill"))
        |> ignore

    [<Given>]
    member _.``a \.claude/ directory where skills are valid but agents have issues``() =
        let root = scenarioRoot ()
        writeGradeRegistry root
        writeValidatedSkill root "validate-claude-skills-only-ok" |> ignore
        let dir = Path.Combine(root, ".claude", "agents")
        Directory.CreateDirectory dir |> ignore

        // Deliberately missing description — an agent-side failure --skills-only must not surface.
        File.WriteAllText(
            Path.Combine(dir, "validate-claude-broken-agent.md"),
            "---\nname: validate-claude-broken-agent\ntools: Read, Write\nmodel: sonnet\ncolor: blue\n---\nBody.\n"
        )

    [<When>]
    member _.``the developer runs agents validate-claude``() =
        let opts: Harness.ValidateClaudeOptions =
            { RepoRoot = scenarioRoot ()
              AgentsOnly = false
              SkillsOnly = false }

        runValidateClaudeOnce opts

    [<When>]
    member _.``the developer runs agents validate-claude with the --agents-only flag``() =
        let opts: Harness.ValidateClaudeOptions =
            { RepoRoot = scenarioRoot ()
              AgentsOnly = true
              SkillsOnly = false }

        runValidateClaudeOnce opts

    [<When>]
    member _.``the developer runs agents validate-claude with the --skills-only flag``() =
        let opts: Harness.ValidateClaudeOptions =
            { RepoRoot = scenarioRoot ()
              AgentsOnly = false
              SkillsOnly = true }

        runValidateClaudeOnce opts

    [<Then>]
    member _.``the output reports all checks as passing``() =
        let notPassed = (result ()).Checks |> List.filter (fun c -> c.Status <> "passed")

        Assert.Equal<Harness.ValidationCheck list>([], notPassed)

    [<Then>]
    member _.``the output identifies the agent and the missing field``() =
        let identifies =
            (result ()).Checks
            |> List.tryFind (fun c ->
                c.Status = "failed"
                && c.Name.Contains("Required Fields", StringComparison.Ordinal)
                && c.Actual.Contains("description", StringComparison.Ordinal))

        Assert.True(identifies.IsSome)

    [<Then>]
    member _.``the output reports the rejected model value``() =
        let rejected =
            (result ()).Checks
            |> List.tryFind (fun c ->
                c.Status = "failed"
                && c.Name.Contains(claudeRejectedAgent, StringComparison.Ordinal)
                && c.Actual = $"Model: {claudeRejectedModel}")

        Assert.True(rejected.IsSome)

    [<Then>]
    member _.``the output identifies the nested agent``() =
        let nested =
            (result ()).Checks
            |> List.tryFind (fun c -> c.Name.Contains("validate-claude-nested", StringComparison.Ordinal))

        Assert.True(nested.IsSome)

    [<Then>]
    member _.``the output reports the effort the grade declares``() =
        let contradiction =
            (result ()).Checks
            |> List.tryFind (fun c ->
                c.Status = "failed"
                && c.Name.Contains("validate-claude-wrong-effort", StringComparison.Ordinal)
                && c.Expected = "effort: xhigh (the execution grade)"
                && c.Actual = "effort: low")

        Assert.True(contradiction.IsSome)

    [<Then>]
    member _.``the output reports the grade the justification argues for``() =
        let drifted =
            (result ()).Checks
            |> List.tryFind (fun c ->
                c.Status = "failed"
                && c.Name.Contains("validate-claude-drifted", StringComparison.Ordinal)
                && c.Expected = "a justification for `opus`"
                && c.Actual = "argues for `sonnet`")

        Assert.True(drifted.IsSome)

    [<Then>]
    member _.``the output reports the missing justification block``() =
        let unargued =
            (result ()).Checks
            |> List.tryFind (fun c ->
                c.Status = "failed"
                && c.Name.Contains("validate-claude-unargued", StringComparison.Ordinal)
                && c.Actual = "no justification block")

        Assert.True(unargued.IsSome)

    [<Then>]
    member _.``the output reports that no grade vocabulary is declared``() =
        let failClosed =
            (result ()).Checks
            |> List.tryFind (fun c -> c.Status = "failed" && c.Actual = "no grade vocabulary declared")

        Assert.True(failClosed.IsSome)

    [<Then>]
    member _.``the output reports the duplicate agent name``() =
        let duplicate =
            (result ()).Checks
            |> List.tryFind (fun c -> c.Status = "failed" && c.Message = "Agent name already used")

        Assert.True(duplicate.IsSome)

    // ---- @harness-name-registry-derived ----

    [<Given>]
    member _.``the repo-config\.yml harness registry declares ([a-z-]+)``(name: string) =
        match RepoConfig.load repositoryRoot with
        | Ok config -> Assert.Contains(name, Harness.acceptedHarnessNames config)
        | Error e -> failwith e

    [<Given>]
    member _.``the repo-config\.yml harness registry does not declare ([a-z-]+)``(name: string) =
        match RepoConfig.load repositoryRoot with
        | Ok config -> Assert.DoesNotContain(name, Harness.acceptedHarnessNames config)
        | Error e -> failwith e

    [<When>]
    member _.``the developer runs harness bindings generate for ([a-z-]+)``(name: string) =
        match RepoConfig.load repositoryRoot with
        | Error e -> failwith e
        | Ok config ->
            match Harness.validateHarnessName config name with
            | Ok() ->
                lastNameError <- None
                lastExitCode <- Some 0
            | Error message ->
                lastNameError <- Some message
                lastExitCode <- Some 1

    [<Then>]
    member _.``the harness name is not rejected as unknown``() =
        Assert.Null(Option.toObj lastNameError)
        Assert.Equal(0, exitCode ())

    [<Then>]
    member _.``the error names the registry-derived accepted set``() =
        let message =
            match lastNameError with
            | Some m -> m
            | None -> failwith "the command did not report a harness-name error"

        match RepoConfig.load repositoryRoot with
        | Error e -> failwith e
        | Ok config ->
            // Every registry-declared name, quoted, has to appear — a message
            // naming only some of them would send the developer looking for
            // the rest.
            for name in Harness.acceptedHarnessNames config do
                Assert.Contains(sprintf "'%s'" name, message)

    // ---- @agents-validate-bindings ----

    [<Given>]
    member _.``a repository whose generated binding files match the generated content``() =
        let root = scenarioRoot ()
        writeThreeHarnessConfig root
        writeEmptyMirrorPair root
        Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
        Directory.CreateDirectory(Path.Combine(root, ".codex")) |> ignore

    [<Given>]
    member _.``the platform-bindings catalog references every present binding directory``() =
        writeCatalog (scenarioRoot ()) (fullCatalog ())

    [<Given>]
    member _.``a repository with a known binding directory that the platform-bindings catalog does not reference``() =
        let root = scenarioRoot ()
        writeThreeHarnessConfig root
        writeEmptyMirrorPair root
        // `.github` is materialized but deliberately left out of the catalog.
        Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
        writeCatalog root "# Platform Bindings\n\n- `.claude` row\n- `.opencode` row\n"

    [<Given>]
    member _.``a repository where some known binding directories do not exist on disk``() =
        let root = scenarioRoot ()
        writeThreeHarnessConfig root
        writeEmptyMirrorPair root
        // `.codex`, `.agents`, and `.github` are never created; the catalog
        // references only the two directories that are.
        writeCatalog root "# Platform Bindings\n\n- `.claude` row\n- `.opencode` row\n"

    [<When>]
    member _.``the developer runs harness bindings validate``() = runValidate (scenarioRoot ())

    /// Shared by the `harness bindings validate` and `agents
    /// detect-duplication` scenarios. When the command that ran produces a
    /// `ValidationResult`, the offending checks are asserted first so a
    /// failure names them rather than reporting only "expected 0, got 1";
    /// `detect-duplication` produces findings instead, and is covered by the
    /// zero-clusters step.
    [<Then>]
    member _.``the command exits successfully``() =
        match lastResult with
        | Some validation ->
            let notPassed =
                validation.Checks
                |> List.filter (fun (check: Harness.ValidationCheck) -> check.Status <> "passed")

            Assert.Equal<Harness.ValidationCheck list>([], notPassed)
        | None -> ()

        Assert.Equal(0, exitCode ())

    [<Then>]
    member _.``the command exits with a failure code``() = Assert.Equal(1, exitCode ())

    [<Then>]
    member _.``the output reports all binding checks as passing``() =
        let actual = (result ())
        Assert.Equal(actual.TotalChecks, actual.PassedChecks)
        Assert.True(actual.TotalChecks > 0)

    [<Then>]
    member _.``the output identifies the binding directory missing a catalog row``() =
        let failing =
            (result ()).Checks
            |> List.filter (fun (check: Harness.ValidationCheck) ->
                check.Status = "failed" && check.Name = "Catalog Coverage: .github")

        Assert.NotEmpty failing

        for check in failing do
            Assert.Contains(Harness.platformBindingsCatalog, check.Message)

    [<Then>]
    member _.``no catalog row is required for the absent binding directories``() =
        let absent =
            Harness.knownBindingDirs
            |> List.filter (fun dir -> not (Directory.Exists(Path.Combine(scenarioRoot (), dir))))

        Assert.NotEmpty absent

        for dir in absent do
            let check =
                (result ()).Checks
                |> List.find (fun (c: Harness.ValidationCheck) -> c.Name = sprintf "Catalog Coverage: %s" dir)

            Assert.Equal("passed", check.Status)
            Assert.Contains("no catalog row required", check.Message)

    // ---- @codex-agents-extension ----

    /// The `.toml` file is the emitter's own output for a real source agent
    /// rather than a hand-written stub: since the orphan check landed, a mirror
    /// with no `.claude/agents/` source fails validation, so a stub would have
    /// made this scenario assert the wrong thing.
    [<Given>]
    member _.``a repository whose \.codex/agents directory holds a standalone \.toml agent file``() =
        let root = scenarioRoot ()
        writeThreeHarnessConfig root
        writeEmptyMirrorPair root
        Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
        writeOwnershipSupportingDocs root
        writeValidatedAgent root "probe-maker" [] |> ignore
        Harness.runHarnessBindingsGenerate root |> ignore

    /// The `.md` file shares the stem of a real source agent, so it is a wrong
    /// extension rather than an orphan — this scenario is about the extension
    /// check alone.
    [<Given>]
    member _.``a repository whose \.codex/agents directory holds a \.md agent file``() =
        let root = scenarioRoot ()
        writeThreeHarnessConfig root
        writeEmptyMirrorPair root
        Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
        writeOwnershipSupportingDocs root
        writeValidatedAgent root "probe-maker" [] |> ignore
        Harness.runHarnessBindingsGenerate root |> ignore

        let agentsDir = Path.Combine(root, ".codex", "agents")
        File.WriteAllText(Path.Combine(agentsDir, "probe-maker.md"), "# probe\n")

    // ---- @mirror-orphans ----

    /// Reproduces the observed defect exactly: an agent is renamed, the emitter
    /// writes the new mirror, and the mirror under the old name is left behind.
    [<Given>]
    member _.``a repository whose generated agent directory holds a mirror with no source agent``() =
        let root = scenarioRoot ()
        writeThreeHarnessConfig root
        writeEmptyMirrorPair root
        Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
        writeOwnershipSupportingDocs root
        writeValidatedAgent root "probe-maker" [] |> ignore
        Harness.runHarnessBindingsGenerate root |> ignore

        let agentsDir = Path.Combine(root, ".codex", "agents")
        let generated = File.ReadAllText(Path.Combine(agentsDir, "probe-maker.toml"))
        File.WriteAllText(Path.Combine(agentsDir, "repo-probe-maker.toml"), generated)

    [<Given>]
    member _.``a repository whose generated agent mirrors each have a source agent``() =
        let root = scenarioRoot ()
        writeThreeHarnessConfig root
        writeEmptyMirrorPair root
        Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
        writeOwnershipSupportingDocs root
        writeValidatedAgent root "probe-maker" [] |> ignore
        Harness.runHarnessBindingsGenerate root |> ignore

    /// The vendored file is deliberately given a stem no source agent carries,
    /// so it would be reported as an orphan if the declaration were ignored.
    [<Given>]
    member _.``a repository whose generated agent directory holds a vendored mirror with no source agent``() =
        let root = scenarioRoot ()
        writeThreeHarnessConfigWithVendoredMirror root
        writeEmptyMirrorPair root
        Directory.CreateDirectory(Path.Combine(root, ".github")) |> ignore
        writeOwnershipSupportingDocs root
        writeValidatedAgent root "probe-maker" [] |> ignore
        Harness.runHarnessBindingsGenerate root |> ignore

        let agentsDir = Path.Combine(root, ".codex", "agents")
        let generated = File.ReadAllText(Path.Combine(agentsDir, "probe-maker.toml"))
        File.WriteAllText(Path.Combine(agentsDir, "vendored-probe.toml"), generated)

    [<Then>]
    member _.``the output names the orphaned mirror and the source that no longer exists``() =
        let check =
            (result ()).Checks
            |> List.find (fun (check: Harness.ValidationCheck) -> check.Name = "Mirror Orphans: .codex/agents")

        Assert.Equal("failed", check.Status)
        Assert.Equal("orphaned mirror(s): repo-probe-maker.toml", check.Actual)
        Assert.Contains("no .claude/agents/ source explains it", check.Message)

    [<Then>]
    member _.``the output names \.toml as the officially-correct extension``() =
        let failing =
            (result ()).Checks
            |> List.filter (fun (check: Harness.ValidationCheck) ->
                check.Status = "failed"
                && check.Message.Contains("probe-maker.md", StringComparison.Ordinal))

        Assert.NotEmpty failing

        for check in failing do
            Assert.Contains(".toml", check.Message)

    // ---- @codex-binding ----

    [<Given>]
    member _.``a repository whose \.claude/agents/ directory holds one agent under a role subfolder``() =
        let root = scenarioRoot ()

        writeCodexAgentUnderSubfolder
            root
            "reviewers"
            "role-agent"
            "role-agent"
            "Role fixture agent."
            "Body instructions.\n"
        |> ignore

        fixtureCodexAgentNames <- [ "role-agent" ]

    [<Given>]
    member _.``a repository whose \.claude/agents/ holds two agents in different role subfolders whose name frontmatter differs from their filename``
        ()
        =
        let root = scenarioRoot ()

        writeCodexAgentUnderSubfolder
            root
            "reviewers"
            "reviewer-file"
            "reviewer-identity"
            "Reviewer fixture."
            "Reviewer body.\n"
        |> ignore

        writeCodexAgentUnderSubfolder root "makers" "maker-file" "maker-identity" "Maker fixture." "Maker body.\n"
        |> ignore

        fixtureCodexAgentNames <- [ "reviewer-identity"; "maker-identity" ]
        fixtureRoleSubfolders <- [ "reviewers"; "makers" ]

    [<Given>]
    member _.``a repository whose \.claude/agents/ holds one agent per model tier``() =
        let root = scenarioRoot ()
        writeGradeRegistry root

        let tiers =
            [ "ultra-agent", "fable", "high", "gpt-6-astra", "high"
              "planning-agent", "opus", "high", "gpt-5.6-sol", "high"
              "execution-agent", "sonnet", "xhigh", "gpt-5.6-terra", "xhigh"
              "fast-agent", "haiku", "max", "gpt-5.6-luna", "xhigh" ]

        for name, model, effort, _, _ in tiers do
            writeTieredCodexAgent root "roles" name model effort |> ignore

        fixtureCodexAgentNames <- tiers |> List.map (fun (name, _, _, _, _) -> name)

        fixtureCodexTiers <-
            tiers
            |> List.map (fun (name, _, _, codexModel, codexEffort) -> name, codexModel, codexEffort)

    [<Given>]
    member _.``a repository whose \.claude/agents/ holds one agent declaring model inherit``() =
        let root = scenarioRoot ()
        writeGradeRegistry root
        writeTieredCodexAgent root "roles" "inheriting" "inherit" "high" |> ignore
        fixtureCodexAgentNames <- [ "inheriting" ]

    [<Given>]
    member _.``a repository whose \.codex/config\.toml carries hand-maintained mcp_servers, features, and ci-monitor-subagent tables``
        ()
        =
        let root = scenarioRoot ()

        writeCodexAgentUnderSubfolder root "makers" "fixture-agent" "fixture-agent" "Fixture agent." "Body.\n"
        |> ignore

        fixtureCodexAgentNames <- [ "fixture-agent" ]
        let codexDir = Path.Combine(root, ".codex")
        Directory.CreateDirectory codexDir |> ignore

        File.WriteAllText(
            Path.Combine(codexDir, "config.toml"),
            String.Join(
                "\n",
                [ "[mcp_servers.example]"
                  "command = \"example-server\""
                  ""
                  "[features]"
                  "multi_agent = true"
                  ""
                  "[ci-monitor-subagent]"
                  "enabled = true" ]
            )
            + "\n"
        )

    [<When>]
    member _.``the developer runs harness bindings generate``() =
        let root = scenarioRoot ()
        let outcome = Harness.emitCodexBindings root false

        lastExitCode <-
            Some(
                match outcome with
                | Ok _ -> 0
                | Error _ -> 1
            )

    [<When>]
    member _.``the developer runs harness bindings generate twice``() =
        let root = scenarioRoot ()
        let configPath = Path.Combine(root, ".codex", "config.toml")
        let first = Harness.emitCodexBindings root false
        configAfterFirstRun <- Some(File.ReadAllText configPath)
        let second = Harness.emitCodexBindings root false
        configAfterSecondRun <- Some(File.ReadAllText configPath)

        lastExitCode <-
            Some(
                match first, second with
                | Ok _, Ok _ -> 0
                | _ -> 1
            )

    [<Then>]
    member _.``\.codex/agents/ holds exactly one TOML file named for that agent``() =
        let root = scenarioRoot ()
        let dir = Path.Combine(root, ".codex", "agents")
        let files = Directory.GetFiles dir |> Array.map Path.GetFileName
        Assert.Equal(1, files.Length)
        Assert.Equal(fixtureCodexAgentNames.[0] + ".toml", files.[0])

    [<Then>]
    member _.``the emitted Codex agent declares name, description, and developer_instructions``() =
        let root = scenarioRoot ()

        let path =
            Path.Combine(root, ".codex", "agents", fixtureCodexAgentNames.[0] + ".toml")

        let content = File.ReadAllText path
        Assert.Contains("name = \"", content)
        Assert.Contains("description = \"", content)
        Assert.Contains("developer_instructions = \"\"\"", content)

    [<Then>]
    member _.``the emitted Codex agent declares no model field``() =
        let root = scenarioRoot ()

        let path =
            Path.Combine(root, ".codex", "agents", fixtureCodexAgentNames.[0] + ".toml")

        let content = File.ReadAllText path
        Assert.DoesNotContain("model = ", content)

    [<Then>]
    member _.``each emitted Codex agent declares the Codex model at the same tier``() =
        let root = scenarioRoot ()

        for name, codexModel, _ in fixtureCodexTiers do
            let content =
                File.ReadAllText(Path.Combine(root, ".codex", "agents", name + ".toml"))

            Assert.Contains(sprintf "model = \"%s\"" codexModel, content)

    [<Then>]
    member _.``each emitted Codex agent declares model_reasoning_effort matching its Claude effort``() =
        let root = scenarioRoot ()

        for name, _, codexEffort in fixtureCodexTiers do
            let content =
                File.ReadAllText(Path.Combine(root, ".codex", "agents", name + ".toml"))

            Assert.Contains(sprintf "model_reasoning_effort = \"%s\"" codexEffort, content)

    [<Then>]
    member _.``\.codex/agents/ holds one flat TOML file per agent keyed on the name frontmatter``() =
        let root = scenarioRoot ()
        let dir = Path.Combine(root, ".codex", "agents")

        let files =
            Directory.GetFiles dir
            |> Array.map Path.GetFileName
            |> Array.sort
            |> List.ofArray

        let expected =
            fixtureCodexAgentNames |> List.map (fun n -> n + ".toml") |> List.sort

        Assert.Equal<string list>(expected, files)

    [<Then>]
    member _.``no emitted filename repeats a role subfolder name``() =
        let root = scenarioRoot ()
        let dir = Path.Combine(root, ".codex", "agents")
        let files = Directory.GetFiles dir |> Array.map Path.GetFileName |> List.ofArray

        for subfolder in fixtureRoleSubfolders do
            Assert.DoesNotContain(subfolder + ".toml", files)

    [<Then>]
    member _.``\.codex/config\.toml declares a generated agents table for the fixture agent``() =
        let root = scenarioRoot ()
        let content = File.ReadAllText(Path.Combine(root, ".codex", "config.toml"))
        Assert.Contains(sprintf "[agents.%s]" fixtureCodexAgentNames.[0], content)

    [<Then>]
    member _.``the hand-maintained mcp_servers, features, and ci-monitor-subagent tables are unchanged``() =
        let root = scenarioRoot ()
        let content = File.ReadAllText(Path.Combine(root, ".codex", "config.toml"))
        Assert.Contains("[mcp_servers.example]", content)
        Assert.Contains("command = \"example-server\"", content)
        Assert.Contains("[features]", content)
        Assert.Contains("multi_agent = true", content)
        Assert.Contains("[ci-monitor-subagent]", content)
        Assert.Contains("enabled = true", content)

    [<Then>]
    member _.``the second run left \.codex/config\.toml byte-identical to the first``() =
        match configAfterFirstRun, configAfterSecondRun with
        | Some first, Some second -> Assert.Equal(first, second)
        | _ -> failwith "config.toml was not captured after both runs"

    // ---- @governance-word-budget-pre-push ----

    [<Given>]
    member _.``my push range modifies "([^"]+)"``(path: string) = pushRangePaths <- [ path ]

    [<Given>]
    member _.``my push range modifies only "([^"]+)"``(path: string) = pushRangePaths <- [ path ]

    [<Given>]
    member _.``"([^"]+)" exceeds its fail ceiling``(path: string) =
        // Per-file budgets are RHINO's; the F# gate fails only on the resolved
        // tree, so its root imports the oversized file.
        let root = scenarioRoot ()
        let treeRoot = wordBudgetFixtureConfig.ResolvedTree.Root
        writeBudgetFixture root path 1600

        if path <> treeRoot then
            File.WriteAllText(Path.Combine(root, treeRoot), sprintf "@%s\n" path)

    [<Given>]
    member _.``"([^"]+)" is within its fail ceiling``(path: string) =
        writeBudgetFixture (scenarioRoot ()) path 10

    [<When>]
    member _.``the pre-push hook runs``() =
        lastPrePushOutcome <-
            Some(Harness.runPrePushWordBudgetGate (scenarioRoot ()) wordBudgetFixtureConfig pushRangePaths)

    [<Then>]
    member _.``the word-budget gate runs``() =
        match lastPrePushOutcome with
        | Some outcome -> Assert.True(outcome.GateInvoked)
        | None -> failwith "the pre-push hook has not run in this scenario"

    [<Then>]
    member _.``the word-budget validation target is not invoked``() =
        match lastPrePushOutcome with
        | Some outcome -> Assert.False(outcome.GateInvoked)
        | None -> failwith "the pre-push hook has not run in this scenario"

    [<Then>]
    member _.``the word-budget validation target runs and exits 0``() =
        match lastPrePushOutcome with
        | Some outcome ->
            Assert.True(outcome.GateInvoked)
            Assert.Equal(0, outcome.ExitCode)
        | None -> failwith "the pre-push hook has not run in this scenario"

    [<Then>]
    member _.``the push is aborted with a non-zero exit``() =
        match lastPrePushOutcome with
        | Some outcome -> Assert.NotEqual(0, outcome.ExitCode)
        | None -> failwith "the pre-push hook has not run in this scenario"

    [<Then>]
    member _.``the push proceeds``() =
        match lastPrePushOutcome with
        | Some outcome -> Assert.Equal(0, outcome.ExitCode)
        | None -> failwith "the pre-push hook has not run in this scenario"

    // ---- @governance-word-budget-rule ----

    [<Given>]
    member _.``the plan is complete``() = planStatus <- Complete

    [<When>]
    member _.``I look under "([^"]+)"``(dir: string) =
        Assert.Equal(Complete, planStatus)
        lookupDir <- dir

    [<Then>]
    member _.``"([^"]+)" exists``(filename: string) =
        let path = Path.Combine(repositoryRoot, lookupDir, filename)
        Assert.True(File.Exists(path), sprintf "expected %s to exist" path)
        lookupFileContent <- File.ReadAllText(path)

    [<Then>]
    member _.``the file lists the monitored file classes, configured threshold source, and enforcement points``() =
        Assert.Contains("Monitored Surfaces", lookupFileContent)
        Assert.Contains("repo-config.yml", lookupFileContent)
        Assert.Contains("target", lookupFileContent)
        Assert.Contains("fail", lookupFileContent)
        Assert.Contains("Enforcement Points", lookupFileContent)

    [<When>]
    member _.``"rules-checker" runs Step 6``() =
        Assert.Equal(Complete, planStatus)
        lookupFileContent <- readAgentSurface ".claude/agents/repo/rules-checker.md"

    [<Then>]
    member _.``it reports qualitative bloat concerns across the whole instruction-file class``() =
        Assert.Contains("qualitative concerns a mechanical gate cannot measure", lookupFileContent)
        Assert.Contains("progressive disclosure", lookupFileContent)

    [<Then>]
    member _.``it annotates that the word ceiling is enforced by the deterministic "governance-word-budget" gate``() =
        Assert.Contains("enforced by the deterministic", lookupFileContent)
        Assert.Contains("governance word-budget validate", lookupFileContent)

    [<When>]
    member _.``I read "([^"]+)"``(path: string) =
        Assert.Equal(Complete, planStatus)
        lookupFileContent <- readDocumentTree path

    [<Then>]
    member _.``"governance-word-budget" is skipped locally and delegated by exact gate ID``() =
        Assert.Contains("governance-word-budget` skipped", lookupFileContent)
        Assert.Contains("`delegated-gate-ids`", lookupFileContent)

    [<Given>]
    member _.``a repo with instruction files within the configured budgets``() =
        let root = scenarioRoot ()
        writeBudgetFixture root "AGENTS.md" 10
        writeBudgetFixture root "RTK.md" 10
        writeBudgetFixture root "CLAUDE.md" 10

        Assert.True((Governance.checkResolvedTree root wordBudgetFixtureConfig).IsNone)

    [<When>]
    member _.``the developer runs "rhino-cli repo-governance audit" with JSON output``() =
        lastAuditJson <- Some(Harness.repoGovernanceAuditJson (scenarioRoot ()))

    [<Then>]
    member _.``the envelope schema is "rhino-cli/repo-governance-audit/v1"``() =
        match lastAuditJson with
        | Some json ->
            use doc = JsonDocument.Parse(json)
            Assert.Equal("rhino-cli/repo-governance-audit/v1", doc.RootElement.GetProperty("schema").GetString())
        | None -> failwith "the repo-governance audit has not run in this scenario"

    [<Then>]
    member _.``"result\.categories" contains a category named "governance-word-budget"``() =
        match lastAuditJson with
        | Some json ->
            use doc = JsonDocument.Parse(json)

            let categories =
                doc.RootElement.GetProperty("result").GetProperty("categories").EnumerateArray()
                |> Seq.toList

            Assert.True(
                categories
                |> List.exists (fun c -> c.GetProperty("name").GetString() = "governance-word-budget")
            )
        | None -> failwith "the repo-governance audit has not run in this scenario"

    [<Given>]
    member _.``lifecycle evidence contains a current "governance-word-budget" result``() =
        lifecycleEvidence <- Map.ofList [ "governance-word-budget", "passed" ]

    [<When>]
    member _.``"rules-checker" runs Step 0\.5``() =
        Assert.Equal(Some "passed", Map.tryFind "governance-word-budget" lifecycleEvidence)
        lookupFileContent <- readAgentSurface ".claude/agents/repo/rules-checker.md"

    [<Then>]
    member _.``it consumes the exact delegated gate ID "governance-word-budget"``() =
        Assert.Contains("`delegated-gate-ids`", lookupFileContent)
        Assert.Contains("word budgets are all mechanically enforced", lookupFileContent)

    [<Then>]
    member _.``it does not re-derive word counts in Step 6``() =
        let normalized =
            lookupFileContent.Split([| ' '; '\n'; '\t'; '\r' |], StringSplitOptions.RemoveEmptyEntries)
            |> String.concat " "

        Assert.Contains("Do not run or AI-rederive those predicates", normalized)

    // ---- @harness-audit ----

    [<Given>]
    member _.``a repository with no \.claude or \.opencode agent directories``() =
        let root = scenarioRoot ()
        Assert.False(Directory.Exists(Path.Combine(root, ".claude", "agents")))
        Assert.False(Directory.Exists(Path.Combine(root, ".opencode", "agents")))

    [<When>]
    member _.``the developer runs "rhino-cli harness audit"``() =
        let outcome = Harness.runHarnessAudit (scenarioRoot ())
        lastHarnessAuditOutcome <- Some outcome
        lastExitCode <- Some outcome.ExitCode

    [<Then>]
    member _.``the output names the failing "([a-z-]+)" harness validator``(memberName: string) =
        match lastHarnessAuditOutcome with
        | Some outcome ->
            Assert.Contains("HARNESS AUDIT FAILED", outcome.Output)
            Assert.Contains(memberName, outcome.Output)
        | None -> failwith "harness audit has not run in this scenario"

    // ---- @catalog-generation ----

    [<Given>]
    member _.``each harness entry in repo-config\.yml carries catalog fields including display name, instruction surfaces, agent surface, skills surface, and status``
        ()
        =
        let root = scenarioRoot ()
        writeFixtureCatalogRegistry root
        writeFixtureCatalogDocument root
        catalogDocBefore <- Some(readCatalogDoc root)
        Assert.Equal(0, catalogRowCount root)

    [<When>]
    member _.``rhino-cli harness catalog generate runs``() =
        let outcome = Harness.runHarnessCatalogGenerate (scenarioRoot ())
        lastCatalogOutcome <- Some outcome
        lastExitCode <- Some outcome.ExitCode

    [<Then>]
    member _.``docs/reference/platform-bindings\.md contains one table row per registry entry between the generated-region markers``
        ()
        =
        match lastCatalogOutcome with
        | Some outcome -> Assert.Equal(0, outcome.ExitCode)
        | None -> failwith "harness catalog generate has not run in this scenario"

        let root = scenarioRoot ()
        Assert.Equal(3, catalogRowCount root)
        let region = catalogRegionBody root

        for platform in [ "Alpha Harness"; "Beta Harness"; "Gamma Harness" ] do
            Assert.Contains(platform, region)

    [<Then>]
    member _.``prose outside those markers is byte-identical to its pre-run content``() =
        let root = scenarioRoot ()

        match catalogDocBefore with
        | Some before -> Assert.Equal(catalogOutsideRegion before, catalogOutsideRegion (readCatalogDoc root))
        | None -> failwith "no pre-run document content was recorded in this scenario"

        Assert.Contains("[^mcp]: A footnote definition", readCatalogDoc root)

    [<Given>]
    member _.``a freshly generated catalog with a clean git diff``() =
        let root = scenarioRoot ()
        writeFixtureCatalogRegistry root
        writeFixtureCatalogDocument root
        let generated = Harness.runHarnessCatalogGenerate root
        Assert.Equal(0, generated.ExitCode)

    [<When>]
    member _.``one cell inside the generated region is edited by hand``() =
        let root = scenarioRoot ()
        let body = readCatalogDoc root
        let edited = body.Replace("Alpha Harness", "Tampered Harness")
        Assert.NotEqual<string>(body, edited)
        File.WriteAllText(catalogDocPath root, edited)

    [<Then>]
    member _.``rhino-cli harness catalog validate exits non-zero naming the drifted region``() =
        let outcome = Harness.runHarnessCatalogValidate (scenarioRoot ())
        Assert.NotEqual(0, outcome.ExitCode)
        Assert.Contains(catalogDoc, outcome.Output)
        lastCatalogOutcome <- Some outcome
        lastExitCode <- Some outcome.ExitCode

    [<Then>]
    member _.``it exits 0 after rhino-cli harness catalog generate is re-run``() =
        let root = scenarioRoot ()
        let regenerated = Harness.runHarnessCatalogGenerate root
        Assert.Equal(0, regenerated.ExitCode)
        let outcome = Harness.runHarnessCatalogValidate root
        Assert.Equal(0, outcome.ExitCode)
        Assert.DoesNotContain("Tampered Harness", readCatalogDoc root)

    [<Given>]
    member _.``a repository with agent and skill files whose bodies share no 10-line verbatim windows``() =
        let root = scenarioRoot ()
        writeThreeHarnessConfig root
        writeAgent root "alpha-one" (prose "alpha" 14) |> ignore
        writeAgent root "beta-two" (prose "beta" 14) |> ignore
        writeSkill root "gamma-notes" (prose "gamma" 14) |> ignore

    [<Given>]
    member _.``a repository with two agent files that share (\d+) consecutive lines verbatim``(shared: int) =
        let root = scenarioRoot ()
        writeThreeHarnessConfig root
        let block = prose "shared" shared
        writeAgent root "alpha-one" (block + prose "alpha" 6) |> ignore
        writeAgent root "beta-two" (block + prose "beta" 6) |> ignore

    [<Given>]
    member _.``a repository with an agent file whose body matches (\d+) consecutive lines of a SKILL\.md``
        (shared: int)
        =
        let root = scenarioRoot ()
        writeThreeHarnessConfig root
        let block = prose "shared" shared
        writeAgent root "alpha-one" (block + prose "alpha" 6) |> ignore
        writeSkill root "gamma-notes" (block + prose "gamma" 6) |> ignore

    [<Given>]
    member _.``a repository where two agent files share a (\d+)-line window composed only of headings or blank lines``
        (windowSize: int)
        =
        let root = scenarioRoot ()
        writeThreeHarnessConfig root

        // Heading/blank pairs, so the shared window is exactly `windowSize`
        // normalized lines and every one of them is a heading or a blank.
        let scaffold =
            String.Join("\n", [ for i in 1 .. windowSize / 2 -> sprintf "%s Section %d\n" (String.replicate i "#") i ])
            + "\n"

        writeAgent root "alpha-one" (scaffold + prose "alpha" 6) |> ignore
        writeAgent root "beta-two" (scaffold + prose "beta" 6) |> ignore

    [<When>]
    member _.``the developer runs agents detect-duplication``() =
        match Harness.detectDuplication (scenarioRoot ()) with
        | Ok findings ->
            duplicationFindings <- findings
            lastExitCode <- Some(if List.isEmpty findings then 0 else 1)
        | Error message -> failwith message

    [<Then>]
    member _.``the output reports zero duplication clusters``() =
        Assert.Equal<Harness.DuplicationFinding list>([], duplicationFindings)

    [<Then>]
    member _.``the output identifies the duplicated cluster across both agents``() =
        let spanning = findingSpanning fixtureAgentPaths
        Assert.NotEmpty spanning

        for finding in spanning do
            Assert.Equal(Harness.duplicationWindowSize, finding.WindowSize)
            Assert.Equal("high", finding.Severity)
            // One start line per file, so a report can point at both sites.
            Assert.Equal(List.length finding.Files, List.length finding.StartLines)

    [<Then>]
    member _.``the output identifies the duplicated cluster across the agent and the skill``() =
        let spanning = findingSpanning (fixtureAgentPaths @ fixtureSkillPaths)
        Assert.NotEmpty spanning

        for finding in spanning do
            Assert.Contains("SKILL.md", String.Join(", ", finding.Files))

    // ---- @agents-skills-mirror ----
    //
    // Two scenarios ("The npm entry points cover the new mirror",
    // "The emitted mirror survives the formatter") read this repository's
    // real `package.json` / prettier binary rather than a synthetic fixture,
    // following the same precedent `@harness-name-registry-derived` set in
    // `agents-bindings.feature`: the claim is about the real repo's wiring,
    // so a fixture would prove only that the lookup works, never that the
    // live scripts and formatter actually agree with the mirror. Neither
    // spawns `npm`/`cargo` (the Rust CLI still owns `harness bindings
    // generate` until Wave E's flip) — each stands in with the equivalent
    // `Harness` function, documented at the call site.

    [<Given>]
    member _.``the harness registry declares an agent-directory mirror for the OpenCode entry``() =
        let root = scenarioRoot ()
        writeThreeHarnessConfig root

        match RepoConfig.load root with
        | Error e -> failwith e
        | Ok config ->
            let opencode = config.Harness |> List.find (fun e -> e.Name = "opencode")
            Assert.True(opencode.AgentDir.IsSome && opencode.Mirrors.IsSome)

    [<When>]
    member _.``the codex entry is updated to declare \.agents/skills as a mirror of \.claude/skills``() =
        writeThreeHarnessConfigWithSkillsMirror (scenarioRoot ())

    [<Then>]
    member _.``rhino-cli repo-config validate exits 0 with both kinds of mirror relationship declared: agent directories and skill directories``
        ()
        =
        match RepoConfig.load (scenarioRoot ()) with
        | Error e -> failwith e
        | Ok config ->
            let opencode = config.Harness |> List.find (fun e -> e.Name = "opencode")
            let codex = config.Harness |> List.find (fun e -> e.Name = "codex")
            Assert.True(opencode.AgentDir.IsSome && opencode.Mirrors.IsSome)
            Assert.True(codex.SkillsDir.IsSome && codex.SkillsMirrors.IsSome)

    [<Then>]
    member _.``rhino-cli harness bindings generate emits the \.agents/skills mirror without a new command-line flag``
        ()
        =
        let root = scenarioRoot ()

        writeSkillFile root "gamma-notes" "SKILL.md" "---\nname: gamma-notes\n---\nBody\n"
        |> ignore

        // `emitSkillsMirrors` takes only `repoRoot` and `dryRun` — no
        // skills-specific parameter exists to add a flag for.
        match Harness.emitSkillsMirrors root false with
        | Error e -> failwith e
        | Ok result ->
            Assert.True(result.Copied > 0)
            Assert.True(Directory.Exists(Path.Combine(root, ".agents", "skills", "gamma-notes")))

    [<Given>]
    member _.``\.claude/skills/ holds the repository's canonical skill directories and every one of them is tracked``
        ()
        =
        let root = scenarioRoot ()
        writeThreeHarnessConfigWithSkillsMirror root
        // `harness bindings generate` also runs the OpenCode/Codex agent
        // emitters (see the `@binding-ownership` scenario sharing this same
        // step text), which need `.claude/agents/` to exist even when this
        // scenario has no agent of its own to mirror.
        Directory.CreateDirectory(Path.Combine(root, ".claude", "agents")) |> ignore
        fixtureSkillNames <- [ "alpha-skill"; "beta-skill"; "gamma-skill" ]

        for name in fixtureSkillNames do
            writeSkillFile root name "SKILL.md" (sprintf "---\nname: %s\n---\nBody for %s.\n" name name)
            |> ignore

            writeSkillFile root name "reference/notes.md" "extra reference content\n"
            |> ignore

    /// Shared by `@agents-skills-mirror` and `@binding-ownership`, since both
    /// feature files use this exact Gherkin step text for a full
    /// `harness bindings generate` run.
    [<When>]
    member _.``rhino-cli harness bindings generate runs``() =
        match Harness.runHarnessBindingsGenerate (scenarioRoot ()) with
        | Ok() -> ()
        | Error e -> failwith e

    [<Then>]
    member _.``\.agents/skills/ contains one real directory per \.claude/skills/ skill``() =
        let root = scenarioRoot ()

        for name in fixtureSkillNames do
            let mirrored = Path.Combine(root, ".agents", "skills", name, "SKILL.md")
            let source = Path.Combine(root, ".claude", "skills", name, "SKILL.md")
            Assert.True(File.Exists mirrored)
            Assert.Equal(File.ReadAllText source, File.ReadAllText mirrored)

    [<Then>]
    member _.``find \.agents/skills -type l returns zero results, proving no symlink was created in either direction``
        ()
        =
        Assert.True(allEntriesAreReal (Path.Combine(scenarioRoot (), ".agents", "skills")))

    [<Given>]
    member _.``a clean tree immediately after rhino-cli harness bindings generate``() =
        let root = scenarioRoot ()
        writeThreeHarnessConfigWithSkillsMirror root

        writeSkillFile root "alpha-skill" "SKILL.md" "---\nname: alpha-skill\n---\nBody.\n"
        |> ignore

        match Harness.emitSkillsMirrors root false with
        | Ok _ -> ()
        | Error e -> failwith e

    [<When>]
    member _.``the command runs a second time``() =
        match Harness.emitSkillsMirrors (scenarioRoot ()) false with
        | Ok result -> mirrorResult <- Some result
        | Error e -> failwith e

    [<Then>]
    member _.``git diff --quiet \.agents/ exits 0, proving no churn``() =
        // No filesystem write is pending on a clean regeneration — the F#
        // analogue of a quiet `git diff`, since nothing changed for git to
        // report.
        match mirrorResult with
        | None -> failwith "no regeneration has run in this scenario"
        | Some result ->
            Assert.Equal(0, result.Copied)
            Assert.Equal(0, result.Removed)

    [<Then>]
    member _.``after a single character is changed in one mirrored file, rhino-cli harness bindings validate exits non-zero naming that file, where it exited 0 before the edit``
        ()
        =
        let root = scenarioRoot ()
        let mirrored = Path.Combine(root, ".agents", "skills", "alpha-skill", "SKILL.md")

        let before =
            match Harness.auditSkillsMirrors root with
            | Ok drift -> drift
            | Error e -> failwith e

        Assert.Equal<Harness.MirrorDrift list>([], before)

        File.WriteAllText(mirrored, File.ReadAllText(mirrored) + "x")

        match Harness.auditSkillsMirrors root with
        | Error e -> failwith e
        | Ok after ->
            Assert.NotEmpty after

            Assert.Contains(
                after,
                fun drift ->
                    match drift with
                    | Harness.MirrorDriftMissing path -> path.Contains("alpha-skill", StringComparison.Ordinal)
                    | Harness.MirrorDriftUndeclared _ -> false
            )

    [<Given>]
    member _.``npm run generate:bindings and npm run validate:sync covered only the OpenCode and Amazon Q surfaces``() =
        // Narrative provenance only, matching `@harness-purge`'s precedent:
        // the pre-mirror coverage is history, not state this scenario
        // reconstructs. What it asserts is the post-change invariant below.
        ()

    [<When>]
    member _.``both scripts run after the mirror is wired``() =
        let root = scenarioRoot ()
        writeThreeHarnessConfigWithSkillsMirror root

        writeSkillFile root "delta-skill" "SKILL.md" "---\nname: delta-skill\n---\nBody.\n"
        |> ignore

        // Stands in for `npm run generate:bindings` / `npm run validate:sync`:
        // both ultimately call these two registry-driven functions, and
        // spawning the real `cargo`-backed CLI here would rebuild the Rust
        // binary for no assertion this scenario needs.
        match Harness.emitSkillsMirrors root false with
        | Error e -> failwith e
        | Ok result ->
            mirrorResult <- Some result

            match Harness.auditSkillsMirrors root with
            | Ok drift -> mirrorDrift <- Some drift
            | Error e -> failwith e

    [<Then>]
    member _.``generate:bindings emits \.agents/skills/ and validate:sync reports it as in-parity``() =
        Assert.True(Directory.Exists(Path.Combine(scenarioRoot (), ".agents", "skills", "delta-skill")))

        Assert.Equal<Harness.MirrorDrift list>(
            [],
            mirrorDrift |> Option.defaultValue [ Harness.MirrorDriftMissing "unset" ]
        )

    [<Then>]
    member _.``neither script names a skills-specific or mirror-specific flag, because both delegate to the registry-driven commands``
        ()
        =
        let packageJsonPath = Path.Combine(repositoryRoot, "package.json")
        let packageJson = File.ReadAllText packageJsonPath

        let scriptLine (name: string) : string =
            let marker = sprintf "\"%s\":" name
            let start = packageJson.IndexOf(marker, StringComparison.Ordinal)
            Assert.True(start >= 0, sprintf "%s script not found in package.json" name)
            let lineEnd = packageJson.IndexOf('\n', start)
            packageJson.Substring(start, lineEnd - start)

        for line in [ scriptLine "generate:bindings"; scriptLine "validate:sync" ] do
            Assert.Contains("harness", line)
            Assert.DoesNotContain("--skills", line)
            Assert.DoesNotContain("--mirror", line)

    [<Given>]
    member _.``this repository has previously broken a generated byte-equality guard by letting the formatter rewrite emitted files``
        ()
        =
        // Narrative provenance — see `feedback_prettier_breaks_generated_byte_equality.md`.
        // Nothing to construct: the claim below is about whether THIS
        // scenario's mirrored content survives the real formatter.
        ()

    [<When>]
    member _.``rhino-cli harness bindings generate is followed by prettier --write over \.agents/ and then rhino-cli harness bindings validate``
        ()
        =
        let root = scenarioRoot ()
        writeThreeHarnessConfigWithSkillsMirror root

        // Prettier-clean on arrival: the same well-formed markdown shape the
        // repo's own PostToolUse hook produces, so the claim under test is
        // "prettier leaves already-clean content alone", not "prettier
        // reformats messy content" (a different, already-known failure mode).
        writeSkillFile
            root
            "epsilon-skill"
            "SKILL.md"
            "---\nname: epsilon-skill\n---\n\n# Epsilon Skill\n\nBody paragraph.\n"
        |> ignore

        match Harness.emitSkillsMirrors root false with
        | Error e -> failwith e
        | Ok _ ->
            let prettierBin = Path.Combine(repositoryRoot, "node_modules", ".bin", "prettier")
            let mirrorDir = Path.Combine(root, ".agents")

            let psi = ProcessStartInfo(prettierBin)
            psi.RedirectStandardOutput <- true
            psi.RedirectStandardError <- true
            psi.UseShellExecute <- false
            psi.ArgumentList.Add "--write"
            psi.ArgumentList.Add mirrorDir

            use proc = Process.Start psi
            proc.WaitForExit()
            Assert.Equal(0, proc.ExitCode)

            match Harness.auditSkillsMirrors root with
            | Ok drift -> mirrorDrift <- Some drift
            | Error e -> failwith e

    [<Then>]
    member _.``the validator exits 0``() =
        Assert.Equal<Harness.MirrorDrift list>(
            [],
            mirrorDrift |> Option.defaultValue [ Harness.MirrorDriftMissing "unset" ]
        )

    [<Then>]
    member _.``where it exits non-zero instead, \.agents/ is added to \.prettierignore and the same sequence then exits 0``
        ()
        =
        // The prior Then already proved the zero-drift branch for this
        // repository's current formatter configuration; this step documents
        // the untaken remedial branch rather than asserting on it, matching
        // the Gherkin's own conditional phrasing ("where it exits non-zero
        // instead").
        Assert.Equal<Harness.MirrorDrift list>(
            [],
            mirrorDrift |> Option.defaultValue [ Harness.MirrorDriftMissing "unset" ]
        )

    // ---- @binding-ownership ----

    [<Given>]
    member _.``a fixture repository whose binding files are all declared generated, vendored, or source``() =
        let root = scenarioRoot ()
        buildAndCommitOwnershipFixture root
        runOwnershipValidate root

        Assert.Equal(
            (0, ""),
            (exitCode (),
             if exitCode () = 0 then
                 ""
             else
                 (result ()).Checks
                 |> List.filter (fun c -> c.Status <> "passed")
                 |> List.map (fun c -> sprintf "%s: %s" c.Name c.Message)
                 |> String.concat "; ")
        )

    [<When>]
    member _.``a tracked file with no declared class is introduced under a binding directory``() =
        let root = scenarioRoot ()

        let path =
            Path.Combine(root, ownershipProbe.Replace('/', Path.DirectorySeparatorChar))

        Directory.CreateDirectory(Path.GetDirectoryName(path: string)) |> ignore
        File.WriteAllText(path, "# unowned\n")
        runOwnershipGit root [ "add"; ownershipProbe ]

    [<Then>]
    member _.``rhino-cli harness ownership validate exits non-zero naming that exact file as unclassified``() =
        let root = scenarioRoot ()
        runOwnershipValidate root
        Assert.NotEqual(0, exitCode ())
        Assert.True(ownershipMentions ownershipProbe)

    [<Then>]
    member _.``it exits 0 once the file is removed, proving the check is falsifiable in both directions rather than always-green``
        ()
        =
        let root = scenarioRoot ()
        runOwnershipGit root [ "rm"; "-q"; "-f"; ownershipProbe ]
        runOwnershipValidate root
        Assert.Equal(0, exitCode ())

    [<Given>]
    member _.``a fixture repository whose mirror trees are declared generated``() =
        buildAndCommitOwnershipFixture (scenarioRoot ())

    [<When>]
    member _.``one emitted file is hand-edited``() =
        let root = scenarioRoot ()
        let path = Path.Combine(root, ".opencode", "agents", "alpha.md")
        let body = File.ReadAllText path
        File.WriteAllText(path, body + "\nhand-edited\n")

    [<Then>]
    member _.``rhino-cli harness ownership validate exits non-zero naming the drifted generated file``() =
        let root = scenarioRoot ()
        runOwnershipValidate root
        Assert.NotEqual(0, exitCode ())
        Assert.True(ownershipMentions "alpha")

    [<Then>]
    member _.``it exits 0 after regeneration restores the canonical bytes``() =
        let root = scenarioRoot ()

        match Harness.runHarnessBindingsGenerate root with
        | Ok() -> ()
        | Error e -> failwithf "regenerate: %s" e

        runOwnershipValidate root
        Assert.Equal(0, exitCode ())

    [<Given>]
    member _.``a fixture repository declaring one vendored skill directory with a recorded reason``() =
        buildAndCommitOwnershipFixture (scenarioRoot ())

    [<When>]
    member _.``the vendored file is hand-edited``() =
        let root = scenarioRoot ()
        let path = Path.Combine(root, ".agents", "skills", ownershipVendorDir, "SKILL.md")
        let body = File.ReadAllText path
        File.WriteAllText(path, body + "\nlocal edit\n")

    [<Then>]
    member _.``rhino-cli harness ownership validate still exits 0, because a vendored path has no in-repo source to compare against``
        ()
        =
        runOwnershipValidate (scenarioRoot ())
        Assert.Equal(0, exitCode ())

    [<Then>]
    member _.``the vendored file is still present, so nothing deleted it in passing``() =
        let root = scenarioRoot ()
        let path = Path.Combine(root, ".agents", "skills", ownershipVendorDir, "SKILL.md")
        Assert.True(File.Exists path)
        Assert.Contains("local edit", File.ReadAllText path)

    [<Given>]
    member _.``a fixture repository declaring the \.claude tree as source``() =
        let root = scenarioRoot ()
        buildAndCommitOwnershipFixture root
        ownershipSourceDigestBefore <- Some(ownershipTreeDigest root ".claude")

    [<Then>]
    member _.``every declared source path is byte-identical to what it was before the run``() =
        let root = scenarioRoot ()

        match ownershipSourceDigestBefore with
        | Some before -> Assert.Equal(before, ownershipTreeDigest root ".claude")
        | None -> failwith "no pre-run digest was recorded in this scenario"

    [<Then>]
    member _.``a registry declaring an emitter output directory as source makes the generator refuse rather than silently succeed``
        ()
        =
        let root = scenarioRoot ()
        writeOwnershipRegistry root true

        match Harness.runHarnessBindingsGenerate root with
        | Ok() -> failwith "a source-declared emitter target must refuse"
        | Error e -> Assert.Contains(".opencode/agents", e)

    [<Given>]
    member _.``this repository's registry declares an ownership class for every binding path``() =
        let text = File.ReadAllText(Path.Combine(repositoryRoot, "repo-config.yml"))
        Assert.Contains("ownership:", text)

    [<When>]
    member _.``rhino-cli harness ownership validate runs against it``() =
        match Harness.classifyOwnership repositoryRoot with
        | Error _ -> lastExitCode <- Some 1
        | Ok report -> lastExitCode <- Some(if List.isEmpty report.Unclassified then 0 else 1)

    [<Then>]
    member _.``it exits 0``() = Assert.Equal(0, exitCode ())

    [<Then>]
    member _.``it reports a per-class count that sums to the total tracked binding-file count``() =
        match Harness.classifyOwnership repositoryRoot with
        | Error e -> failwithf "classify: %s" e
        | Ok report ->
            let total = Harness.OwnershipReport.total report
            Assert.True(total > 0)

            let sum =
                Harness.OwnershipReport.count RepoConfig.OwnershipClass.ClassGenerated report
                + Harness.OwnershipReport.count RepoConfig.OwnershipClass.ClassVendored report
                + Harness.OwnershipReport.count RepoConfig.OwnershipClass.ClassSource report

            Assert.Equal(total, sum)

    // ---- @sync-triage ----

    [<Given>]
    member _.``every generated mirror matches what the generator produces from canonical source``() =
        buildAndCommitTriageFixture (scenarioRoot ())

    [<Given>]
    member _.``a fixture repository cloned fresh, so every file's modification time is its checkout time and carries no information``
        ()
        =
        let root = scenarioRoot ()
        buildAndCommitTriageFixture root

        let clone =
            Path.Combine(Path.GetTempPath(), "rhino-cli-harness-clone-" + Guid.NewGuid().ToString("N"))

        runOwnershipGit root [ "clone"; "-q"; root; clone ]
        triageCloneRootDir <- Some clone

    [<Given>]
    member _.``a tree that reported zero divergences and then had exactly one generated mirror hand-edited``() =
        let root = scenarioRoot ()
        buildAndCommitTriageFixture root
        runTriage root
        Assert.Equal(0, triageExitCode |> Option.defaultValue -1)
        appendToTriageFile root (sprintf ".opencode/agents/%s.md" triagePlainAgent) "\n<!-- edit -->\n"

    [<Given>]
    member _.``a canonical source agent was hand-edited and the generator has not been run since``() =
        let root = scenarioRoot ()
        buildAndCommitTriageFixture root
        appendToTriageFile root (sprintf ".claude/agents/%s.md" triagePlainAgent) "\nExtra canonical prose.\n"

    [<Given>]
    member _.``a canonical source file and its corresponding generated mirror have both been hand-edited``() =
        let root = scenarioRoot ()
        buildAndCommitTriageFixture root
        appendToTriageFile root (sprintf ".claude/agents/%s.md" triagePlainAgent) "\nExtra canonical prose.\n"
        appendToTriageFile root (sprintf ".opencode/agents/%s.md" triagePlainAgent) "\n<!-- edit -->\n"

    [<Given>]
    member _.``a generated OpenCode mirror carries a hand edit worth keeping``() =
        let root = scenarioRoot ()
        buildAndCommitTriageFixture root
        appendToTriageFile root (sprintf ".opencode/agents/%s.md" triagePlainAgent) "\nA paragraph worth keeping.\n"

        triageCanonicalBefore <-
            Some(File.ReadAllText(Path.Combine(root, ".claude", "agents", triagePlainAgent + ".md")))

    [<Given>]
    member _.``a canonical agent carrying fields the editing harness's field policy drops with a warning``() =
        buildAndCommitTriageFixture (scenarioRoot ())

    [<Given>]
    member _.``a generated skills mirror carries a hand edit``() =
        let root = scenarioRoot ()
        buildAndCommitTriageFixture root
        appendToTriageFile root ".agents/skills/beta/SKILL.md" "\n<!-- skill mirror edit -->\n"

    [<Given>]
    member _.``a vendored skill directory declared in the registry and a generated mirror file beside it``() =
        let root = scenarioRoot ()
        buildAndCommitTriageFixture root
        Assert.True(File.Exists(Path.Combine(root, ".agents", "skills", "beta", "SKILL.md")))

    [<Given>]
    member _.``a generated mirror carries a hand edit``() =
        let root = scenarioRoot ()
        buildAndCommitTriageFixture root
        appendToTriageFile root (sprintf ".opencode/agents/%s.md" triagePlainAgent) "\n<!-- edit -->\n"

    [<Given>]
    member _.``this repository's generated mirrors were produced by the current generator``() =
        triageUseRealRepo <- true

    [<When>]
    member _.``rhino-cli harness sync triage runs``() = runTriage (triageRoot ())

    [<When>]
    member _.``rhino-cli harness sync triage runs against it``() = runTriage (triageRoot ())

    [<When>]
    member _.``rhino-cli harness sync promote runs against that mirror``() =
        runPromote (triageRoot ()) (sprintf ".opencode/agents/%s.md" triagePlainAgent)

    [<When>]
    member _.``rhino-cli harness sync promote runs against that harness's mirror``() =
        runPromote (triageRoot ()) (sprintf ".opencode/agents/%s.md" triageRichAgent)

    [<When>]
    member _.``rhino-cli harness sync promote runs against that mirror, without triage having run first``() =
        runPromote (triageRoot ()) (sprintf ".opencode/agents/%s.md" triagePlainAgent)

    [<When>]
    member _.``rhino-cli harness sync promote runs against that skills mirror``() =
        runPromote (triageRoot ()) ".agents/skills/beta/SKILL.md"

    [<When>]
    member _.``the vendored file is hand-edited and rhino-cli harness sync triage runs``() =
        let root = triageRoot ()
        appendToTriageFile root (sprintf ".agents/skills/%s/SKILL.md" ownershipVendorDir) "\n<!-- vendor edit -->\n"
        runTriage root

    [<When>]
    member _.``rhino-cli harness bindings validate runs without triage``() =
        runBindingsValidateNoTriage (triageRoot ())

    [<Then>]
    member _.``it exits 0 reporting zero divergences``() =
        Assert.Equal(0, triageExitCode |> Option.defaultValue -1)
        Assert.Contains("0 divergence(s)", triageOutput)

    [<Then>]
    member _.``it exits 0 reporting zero divergences, because detection compares content and never a clock``() =
        Assert.Equal(0, triageExitCode |> Option.defaultValue -1)
        Assert.Contains("0 divergence(s)", triageOutput)

    [<Then>]
    member _.``no clock-reading call appears anywhere on the detection path``() =
        let sourceRoot =
            Path.Combine(repositoryRoot, "apps", "rhino-cli", "src", "RhinoCli.Application", "src")

        let source =
            [ "HarnessPolicy.fs"; "HarnessRuntime.fs" ]
            |> List.map (fun fileName -> File.ReadAllText(Path.Combine(sourceRoot, fileName)))
            |> String.concat Environment.NewLine

        for forbidden in [ "LastWriteTime"; "LastAccessTime"; "CreationTime" ] do
            Assert.DoesNotContain(forbidden, source)

    [<Then>]
    member _.``it exits non-zero naming that mirror as the hand-edited side and naming the promote command``() =
        Assert.NotEqual(0, triageExitCode |> Option.defaultValue 0)
        Assert.Contains(sprintf ".opencode/agents/%s.md" triagePlainAgent, triageOutput)
        Assert.Contains("the mirror was hand-edited", triageOutput)
        Assert.Contains("harness sync promote --from", triageOutput)

    [<Then>]
    member _.``it exits 0 again once the mirror is restored, so the detection is falsifiable in both directions``() =
        let root = triageRoot ()
        restoreTriageFile root (sprintf ".opencode/agents/%s.md" triagePlainAgent)
        runTriage root
        Assert.Equal(0, triageExitCode |> Option.defaultValue -1)

    [<Then>]
    member _.``it exits non-zero naming the canonical side and naming the generate command rather than the promote command``
        ()
        =
        Assert.NotEqual(0, triageExitCode |> Option.defaultValue 0)
        Assert.Contains("the canonical source is ahead", triageOutput)
        Assert.Contains(sprintf ".claude/agents/%s.md" triagePlainAgent, triageOutput)
        Assert.Contains("harness bindings generate", triageOutput)
        Assert.DoesNotContain("harness sync promote", triageOutput)

    [<Then>]
    member _.``it exits 0 once the generator is run``() =
        let root = triageRoot ()

        match Harness.runHarnessBindingsGenerate root with
        | Ok() -> ()
        | Error e -> failwithf "regenerate: %s" e

        runTriage root
        Assert.Equal(0, triageExitCode |> Option.defaultValue -1)

    [<Then>]
    member _.``it exits non-zero naming both files``() =
        Assert.NotEqual(0, triageExitCode |> Option.defaultValue 0)
        Assert.Contains(sprintf ".opencode/agents/%s.md" triagePlainAgent, triageOutput)
        Assert.Contains(sprintf ".claude/agents/%s.md" triagePlainAgent, triageOutput)

    [<Then>]
    member _.``it offers neither promotion nor any automatic resolution, because no correct automatic answer exists``
        ()
        =
        let block = triageHardStopBlock triageOutput
        Assert.DoesNotContain("promote", block)
        Assert.DoesNotContain("bindings generate", block)

    [<Then>]
    member _.``it exits 0 once both files are restored``() =
        let root = triageRoot ()
        restoreTriageFile root (sprintf ".claude/agents/%s.md" triagePlainAgent)
        restoreTriageFile root (sprintf ".opencode/agents/%s.md" triagePlainAgent)
        runTriage root
        Assert.Equal(0, triageExitCode |> Option.defaultValue -1)

    [<Then>]
    member _.``a proposed unified diff against the canonical source is emitted``() =
        Assert.Equal(0, promoteExitCode |> Option.defaultValue -1)
        Assert.Contains(sprintf "--- a/.claude/agents/%s.md" triagePlainAgent, promoteOutput)
        Assert.Contains(sprintf "+++ b/.claude/agents/%s.md" triagePlainAgent, promoteOutput)
        Assert.Contains("+A paragraph worth keeping.", promoteOutput)

    [<Then>]
    member _.``the canonical source file is byte-identical to what it was before the promote run, proving nothing was overwritten``
        ()
        =
        let root = triageRoot ()

        let after =
            File.ReadAllText(Path.Combine(root, ".claude", "agents", triagePlainAgent + ".md"))

        Assert.Equal(triageCanonicalBefore |> Option.defaultValue "<no snapshot recorded>", after)

    [<Then>]
    member _.``the output lists exactly those fields under an at-risk heading``() =
        Assert.Equal(0, promoteExitCode |> Option.defaultValue -1)
        Assert.Contains("At risk of loss", promoteOutput)

        for field in triageUnrepresentableFields do
            Assert.Contains(sprintf "- %s (" field, promoteOutput)

    [<Then>]
    member _.``an agent whose canonical source carries none of them lists nothing, proving the list is computed rather than hardcoded``
        ()
        =
        runPromote (triageRoot ()) (sprintf ".opencode/agents/%s.md" triagePlainAgent)
        Assert.Equal(0, promoteExitCode |> Option.defaultValue -1)
        Assert.Contains("(none)", promoteOutput)

        for field in triageUnrepresentableFields do
            Assert.DoesNotContain(field, promoteOutput)

    [<Then>]
    member _.``the output carries a hard-stop warning naming both sides as hand-edited``() =
        Assert.Contains("HARD STOP", promoteOutput)
        Assert.Contains("both the mirror and its canonical source", promoteOutput)

    [<Then>]
    member _.``nothing was written to canonical source``() =
        Assert.Contains("Nothing was written", promoteOutput)

    [<Then>]
    member _.``the output lists nothing under the at-risk heading``() =
        Assert.Equal(0, promoteExitCode |> Option.defaultValue -1)
        Assert.Contains("At risk of loss", promoteOutput)
        Assert.Contains("(none)", promoteOutput)

    [<Then>]
    member _.``no divergence is reported for the vendored file, because the generator does not own it``() =
        Assert.Equal(0, triageExitCode |> Option.defaultValue -1)
        Assert.Contains("0 divergence(s)", triageOutput)

    [<Then>]
    member _.``hand-editing the generated file instead does report a divergence``() =
        let root = triageRoot ()
        restoreTriageFile root (sprintf ".agents/skills/%s/SKILL.md" ownershipVendorDir)
        appendToTriageFile root ".agents/skills/beta/SKILL.md" "\n<!-- generated edit -->\n"
        runTriage root
        Assert.NotEqual(0, triageExitCode |> Option.defaultValue 0)
        Assert.Contains(".agents/skills/beta/SKILL.md", triageOutput)

    [<Then>]
    member _.``it exits non-zero exactly as it did before triage existed``() =
        Assert.NotEqual(0, bindingsValidateExitCode |> Option.defaultValue 0)

    [<Then>]
    member _.``the failure message names both the canonical source file to edit and the harness sync promote command``
        ()
        =
        Assert.Contains(sprintf ".claude/agents/%s.md" triagePlainAgent, bindingsValidateOutput)
        Assert.Contains("harness sync promote --from", bindingsValidateOutput)

    [<Then>]
    member _.``it exits 0 and reports the number of generated files compared``() =
        Assert.Equal(0, triageExitCode |> Option.defaultValue -1)
        Assert.Contains("generated file(s) compared", triageOutput)
        Assert.Contains("0 divergence(s)", triageOutput)

    // ---- @vendored-skill-preservation ----
    //
    // Vendored directory names used by the fixture in the second scenario
    // only, mirroring `VENDORED_DIRS` in the Rust suite — the real
    // repository's vendored set is read from its registry via
    // `vendoredFromRegistry`, never from this list.

    [<Given>]
    member _.``every \.agents/skills/ directory without a \.claude/skills/ source is one the emitter cannot regenerate``
        ()
        =
        let root = repositoryRoot

        for dir in unmirroredAgentsSkillsDirs root do
            Assert.False(
                Directory.Exists(Path.Combine(root, ".claude", "skills", dir)),
                sprintf "%s was selected for having no .claude/skills/ source" dir
            )

            Assert.True(
                Directory.Exists(Path.Combine(root, ".agents", "skills", dir)),
                sprintf "%s must be a real directory carrying a payload" dir
            )

    [<When>]
    member _.``the harness registry declares each of those directories as vendored``() =
        let root = repositoryRoot
        let declared = vendoredFromRegistry root

        let undeclared =
            unmirroredAgentsSkillsDirs root
            |> List.filter (fun d -> not (List.contains d declared))

        Assert.True(
            List.isEmpty undeclared,
            sprintf "ownership is declared, not inferred: %A carry no vendored declaration" undeclared
        )

    [<Then>]
    member _.``rhino-cli repo-config validate exits 0``() =
        let passed, _ = RepoConfig.validateAtRoot repositoryRoot
        Assert.True(passed, "repo-config validate must exit 0")

    /// `Harness.validateSync` does not yet fold in the skills-mirror audit the
    /// way Rust's `validate_sync`/`validate_bindings` do (see this module's
    /// scope note on `runBindingsValidateNoTriage`), so this scenario calls
    /// `Harness.auditSkillsMirrors` directly — the exact check family Rust's
    /// `harness bindings validate` routes an undeclared mirror file through,
    /// per `sync_validator.rs`'s own doc comment that the two commands report
    /// this family identically.
    [<Then>]
    member _.``an undeclared directory appearing under \.agents/skills/ with no \.claude/skills/ counterpart makes rhino-cli harness bindings validate exit non-zero, where an ownership heuristic would have silently deleted it instead``
        ()
        =
        let root = scenarioRoot ()
        writeOwnershipRegistry root false
        writeOwnershipAgent root "alpha-maker"
        writeOwnershipSkill root "alpha-skill"

        let declaredVendor =
            Path.Combine(root, ".agents", "skills", ownershipVendorDir, "SKILL.md")

        Directory.CreateDirectory(Path.GetDirectoryName declaredVendor) |> ignore
        File.WriteAllText(declaredVendor, "vendored\n")

        match Harness.runHarnessBindingsGenerate root with
        | Ok() -> ()
        | Error e -> failwithf "fixture generate: %s" e

        let probe = Path.Combine(root, ".agents", "skills", "probe-undeclared", "SKILL.md")
        Directory.CreateDirectory(Path.GetDirectoryName probe) |> ignore
        File.WriteAllText(probe, "probe\n")

        match Harness.auditSkillsMirrors root with
        | Error e -> failwith e
        | Ok drift ->
            Assert.NotEmpty drift

            Assert.Contains(
                drift,
                fun d ->
                    match d with
                    | Harness.MirrorDriftUndeclared path -> path.Contains("probe-undeclared", StringComparison.Ordinal)
                    | Harness.MirrorDriftMissing _ -> false
            )

        Assert.True(
            File.Exists probe,
            "validation must REPORT the directory, never delete it — that is the whole \
             difference between a declared boundary and an ownership heuristic"
        )

        // Declared vendored directories, by contrast, are silently accepted.
        let vendorFile =
            Path.Combine(root, ".agents", "skills", "vendor-plugin", "SKILL.md")

        Directory.CreateDirectory(Path.GetDirectoryName vendorFile) |> ignore
        File.WriteAllText(vendorFile, "vendored\n")
        Directory.Delete(Path.Combine(root, ".agents", "skills", "probe-undeclared"), true)

        match Harness.auditSkillsMirrors root with
        | Error e -> failwith e
        | Ok drift -> Assert.Equal<Harness.MirrorDrift list>([], drift)

    [<Given>]
    member _.``a skill directory is renamed under \.claude/skills/ so its old mirror becomes stale``() =
        let root = scenarioRoot ()
        writeOwnershipRegistry root false
        writeOwnershipAgent root "alpha-maker"
        writeOwnershipSkill root "old-name"

        let declaredVendor =
            Path.Combine(root, ".agents", "skills", ownershipVendorDir, "SKILL.md")

        Directory.CreateDirectory(Path.GetDirectoryName declaredVendor) |> ignore
        File.WriteAllText(declaredVendor, "vendored\n")

        match Harness.runHarnessBindingsGenerate root with
        | Ok() -> ()
        | Error e -> failwithf "fixture generate: %s" e

        Assert.True(File.Exists(Path.Combine(root, ".agents", "skills", "old-name", "SKILL.md")))

        for dir in vendoredFixtureDirs do
            let path = Path.Combine(root, ".agents", "skills", ownershipVendorDir, dir + ".md")
            Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore
            File.WriteAllText(path, sprintf "vendored %s\n" dir)

        Directory.Delete(Path.Combine(root, ".claude", "skills", "old-name"), true)
        writeOwnershipSkill root "new-name"

    [<Then>]
    member _.``the stale mirrored directory is removed and the new one created``() =
        let root = scenarioRoot ()
        Assert.False(Directory.Exists(Path.Combine(root, ".agents", "skills", "old-name")))
        Assert.True(File.Exists(Path.Combine(root, ".agents", "skills", "new-name", "SKILL.md")))

    [<Then>]
    member _.``every vendored directory is still present, proving cleanup is scoped to emitter-owned paths``() =
        let root = scenarioRoot ()

        for dir in vendoredFixtureDirs do
            let path = Path.Combine(root, ".agents", "skills", ownershipVendorDir, dir + ".md")
            Assert.True(File.Exists path, sprintf "vendored payload %s must survive cleanup" dir)
            Assert.Equal(sprintf "vendored %s\n" dir, File.ReadAllText path)

    [<Given>]
    member _.``a harness declares \.agents/skills/vendor-plugin as ownership class vendored but its vendored list names a different value for it``
        ()
        =
        let root = scenarioRoot ()

        File.WriteAllText(
            Path.Combine(root, "repo-config.yml"),
            String.Join(
                "\n",
                [ "harness:"
                  "  - { name: claude-code, tier: source, agent-dir: .claude/agents, skills-dir: .claude/skills }"
                  "  - name: opencode"
                  "    tier: generated"
                  "    agent-dir: .opencode/agents"
                  "    mirrors: .claude/agents"
                  "  - name: codex"
                  "    tier: generated"
                  "    agent-dir: .codex/agents"
                  "    mirrors: .claude/agents"
                  "    skills-dir: .agents/skills"
                  "    skills-mirrors: .claude/skills"
                  "    vendored:"
                  "      - .agents/skills/vendor-plugin-typo"
                  "    ownership:"
                  "      - { path: .agents/skills/vendor-plugin, class: vendored, reason: third-party plugin skill; no in-repo source }"
                  "coverage:"
                  "  projects: []"
                  "" ]
            )
        )

        writeOwnershipAgent root "alpha-maker"
        writeOwnershipSkill root "alpha-skill"
        let path = Path.Combine(root, ".agents", "skills", "vendor-plugin", "SKILL.md")
        Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore
        File.WriteAllText(path, "vendored payload\n")

    [<When>]
    member _.``rhino-cli harness bindings generate runs against that mismatched registry``() =
        vendoredGenerateOutcome <- Some(Harness.runHarnessBindingsGenerate (scenarioRoot ()))

    [<Then>]
    member _.``the run fails loudly instead of deleting the directory the ownership record protects``() =
        match vendoredGenerateOutcome with
        | Some(Ok()) -> failwith "an ownership/vendored[] disagreement must be refused, not silently applied"
        | Some(Error _) -> ()
        | None -> failwith "no generate run has happened in this scenario"

        Assert.True(File.Exists(Path.Combine(scenarioRoot (), ".agents", "skills", "vendor-plugin", "SKILL.md")))

    [<Given>]
    member _.``a harness's vendored list names a typo'd path with no ownership record for the real directory it was meant to protect``
        ()
        =
        let root = scenarioRoot ()

        File.WriteAllText(
            Path.Combine(root, "repo-config.yml"),
            String.Join(
                "\n",
                [ "harness:"
                  "  - { name: claude-code, tier: source, agent-dir: .claude/agents, skills-dir: .claude/skills }"
                  "  - name: opencode"
                  "    tier: generated"
                  "    agent-dir: .opencode/agents"
                  "    mirrors: .claude/agents"
                  "  - name: codex"
                  "    tier: generated"
                  "    agent-dir: .codex/agents"
                  "    mirrors: .claude/agents"
                  "    skills-dir: .agents/skills"
                  "    skills-mirrors: .claude/skills"
                  "    vendored:"
                  "      - .agents/skills/vendor-plugin-typo"
                  "coverage:"
                  "  projects: []"
                  "" ]
            )
        )

        writeOwnershipAgent root "alpha-maker"
        writeOwnershipSkill root "alpha-skill"
        let path = Path.Combine(root, ".agents", "skills", "vendor-plugin", "SKILL.md")
        Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore
        File.WriteAllText(path, "vendored payload\n")

    [<When>]
    member _.``rhino-cli harness bindings generate runs against that under-declared registry``() =
        vendoredGenerateOutcome <- Some(Harness.runHarnessBindingsGenerate (scenarioRoot ()))

    [<Then>]
    member _.``the run fails loudly instead of deleting the real directory the typo'd entry was meant to protect``() =
        match vendoredGenerateOutcome with
        | Some(Ok()) ->
            failwith "a vendored[] entry with no matching ownership entry must be refused, not silently applied"
        | Some(Error _) -> ()
        | None -> failwith "no generate run has happened in this scenario"

        Assert.True(File.Exists(Path.Combine(scenarioRoot (), ".agents", "skills", "vendor-plugin", "SKILL.md")))

/// Slices one scenario out of the real, frozen feature file and runs it
/// against `HarnessSteps` — see `GovernanceSteps.fs`'s runner for the shared
/// convention.
module private FeatureRunner =

    let private featurePath (fileName: string) : string =
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
                "harness",
                fileName
            )
        )

    let private extractScenario (featureLines: string[]) (scenarioTitle: string) : string[] =
        let featureLine =
            featureLines
            |> Array.find (fun l -> l.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let startIdx =
            featureLines
            |> Array.findIndex (fun l -> l.Trim() = sprintf "Scenario: %s" scenarioTitle)

        let endIdx =
            featureLines
            |> Array.skip (startIdx + 1)
            |> Array.tryFindIndex (fun l ->
                let trimmed = l.Trim()

                // A `Rule:` block is introduced by its own `@tag` line, which
                // sits BEFORE the `Rule:` keyword. Stopping only at `Rule:`
                // would leave that dangling tag as the slice's last line, and
                // TickSpec rejects a tag with no block after it ("File
                // continues unexpectedly").
                trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
                || trimmed.StartsWith("Rule:", StringComparison.Ordinal)
                || trimmed.StartsWith("@", StringComparison.Ordinal))
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        Array.concat [ [| featureLine; "" |]; featureLines.[startIdx .. endIdx - 1] ]

    let private runIn (fileName: string) (scenarioTitle: string) : unit =
        let path = featurePath fileName
        let snippet = extractScenario (File.ReadAllLines path) scenarioTitle
        let definitions = StepDefinitions([| typeof<HarnessResourceSteps> |])
        let feature = definitions.GenerateFeature(path, snippet)

        for scenario in feature.Scenarios do
            scenario.Action.Invoke()

    /// Runs one scenario of `agents-bindings.feature`.
    let run (scenarioTitle: string) : unit =
        runIn "agents-bindings.feature" scenarioTitle

    /// Runs one scenario of `agents-detect-duplication.feature`.
    let runDuplication (scenarioTitle: string) : unit =
        runIn "agents-detect-duplication.feature" scenarioTitle

    /// Runs one scenario of `agents-skills-mirror.feature`.
    let runSkillsMirror (scenarioTitle: string) : unit =
        runIn "agents-skills-mirror.feature" scenarioTitle

    /// Runs one scenario of `agents-sync.feature`.
    let runSync (scenarioTitle: string) : unit =
        runIn "agents-sync.feature" scenarioTitle

    /// Runs one scenario of `agents-validate-claude.feature`.
    let runValidateClaude (scenarioTitle: string) : unit =
        runIn "agents-validate-claude.feature" scenarioTitle

    /// Runs one scenario of `codex-binding.feature`.
    let runCodexBinding (scenarioTitle: string) : unit =
        runIn "codex-binding.feature" scenarioTitle

    /// Runs one scenario of `governance-word-budget-pre-push.feature`.
    let runWordBudgetPrePush (scenarioTitle: string) : unit =
        runIn "governance-word-budget-pre-push.feature" scenarioTitle

    /// Runs one scenario of `governance-word-budget-rule.feature`.
    let runWordBudgetRule (scenarioTitle: string) : unit =
        runIn "governance-word-budget-rule.feature" scenarioTitle

    /// Runs one scenario of `harness-audit.feature`.
    let runHarnessAudit (scenarioTitle: string) : unit =
        runIn "harness-audit.feature" scenarioTitle

    /// Runs one scenario of `harness-catalog.feature`.
    let runHarnessCatalog (scenarioTitle: string) : unit =
        runIn "harness-catalog.feature" scenarioTitle

    /// Runs one scenario of `harness-ownership.feature`.
    let runHarnessOwnership (scenarioTitle: string) : unit =
        runIn "harness-ownership.feature" scenarioTitle

    /// Runs one scenario of `harness-sync-triage.feature`.
    let runHarnessSyncTriage (scenarioTitle: string) : unit =
        runIn "harness-sync-triage.feature" scenarioTitle

    /// Runs one scenario of `vendored-skill-preservation.feature`.
    let runVendoredSkillPreservation (scenarioTitle: string) : unit =
        runIn "vendored-skill-preservation.feature" scenarioTitle

[<Fact>]
let ``A registry-declared harness name is accepted`` () =
    FeatureRunner.run "A registry-declared harness name is accepted"

[<Fact>]
let ``A harness name absent from the registry is rejected`` () =
    FeatureRunner.run "A harness name absent from the registry is rejected"

[<Fact>]
let ``A repository matching the generator passes validation`` () =
    FeatureRunner.run "A repository matching the generator passes validation"

[<Fact>]
let ``A present binding directory absent from the catalog fails validation`` () =
    FeatureRunner.run "A present binding directory absent from the catalog fails validation"

[<Fact>]
let ``Absent binding directories require no catalog row`` () =
    FeatureRunner.run "Absent binding directories require no catalog row"

[<Fact>]
let ``A .codex/agents directory holding only .toml files passes validation`` () =
    FeatureRunner.run "A .codex/agents directory holding only .toml files passes validation"

[<Fact>]
let ``A mirror whose source agent was renamed away fails validation`` () =
    FeatureRunner.run "A mirror whose source agent was renamed away fails validation"

[<Fact>]
let ``A generated agent directory whose mirrors all have sources passes validation`` () =
    FeatureRunner.run "A generated agent directory whose mirrors all have sources passes validation"

[<Fact>]
let ``A mirror the registry declares vendored is exempt from the orphan check`` () =
    FeatureRunner.run "A mirror the registry declares vendored is exempt from the orphan check"

[<Fact>]
let ``A .md file under .codex/agents fails validation`` () =
    FeatureRunner.run "A .md file under .codex/agents fails validation"

[<Fact>]
let ``Set of distinct agents and skills passes`` () =
    FeatureRunner.runDuplication "Set of distinct agents and skills passes"

[<Fact>]
let ``Two agents sharing 12 consecutive lines verbatim fails`` () =
    FeatureRunner.runDuplication "Two agents sharing 12 consecutive lines verbatim fails"

[<Fact>]
let ``Agent body matching 10+ consecutive lines of a SKILL.md fails (agent-skill duplication)`` () =
    FeatureRunner.runDuplication
        "Agent body matching 10+ consecutive lines of a SKILL.md fails (agent-skill duplication)"

[<Fact>]
let ``Heading-only or whitespace-only 10-line window does NOT trigger a finding`` () =
    FeatureRunner.runDuplication "Heading-only or whitespace-only 10-line window does NOT trigger a finding"

[<Fact>]
let ``The mirror target is declared in the registry`` () =
    FeatureRunner.runSkillsMirror "The mirror target is declared in the registry"

[<Fact>]
let ``Every repository skill is mirrored as real files, not links`` () =
    FeatureRunner.runSkillsMirror "Every repository skill is mirrored as real files, not links"

[<Fact>]
let ``Regeneration is idempotent and a hand edit is caught`` () =
    FeatureRunner.runSkillsMirror "Regeneration is idempotent and a hand edit is caught"

[<Fact>]
let ``The npm entry points cover the new mirror`` () =
    FeatureRunner.runSkillsMirror "The npm entry points cover the new mirror"

[<Fact>]
let ``The emitted mirror survives the formatter`` () =
    FeatureRunner.runSkillsMirror "The emitted mirror survives the formatter"

[<Fact>]
let ``Syncing converts Claude agents to OpenCode format and leaves skills in place`` () =
    FeatureRunner.runSync "Syncing converts Claude agents to OpenCode format and leaves skills in place"

[<Fact>]
let ``The --dry-run flag previews changes without modifying files`` () =
    FeatureRunner.runSync "The --dry-run flag previews changes without modifying files"

[<Fact>]
let ``The --agents-only flag syncs agents without touching skills`` () =
    FeatureRunner.runSync "The --agents-only flag syncs agents without touching skills"

[<Fact>]
let ``An OpenCode mirror pins no model, so the developer's active model applies`` () =
    FeatureRunner.runSync "An OpenCode mirror pins no model, so the developer's active model applies"

[<Fact>]
let ``A mirror pins no model whatever grade the source declares`` () =
    FeatureRunner.runSync "A mirror pins no model whatever grade the source declares"

[<Fact>]
let ``Directories that are in sync pass validation`` () =
    FeatureRunner.runSync "Directories that are in sync pass validation"

[<Fact>]
let ``A description mismatch between directories fails validation`` () =
    FeatureRunner.runSync "A description mismatch between directories fails validation"

[<Fact>]
let ``A count mismatch between directories fails validation`` () =
    FeatureRunner.runSync "A count mismatch between directories fails validation"

[<Fact>]
let ``A directory with all agents and skills correctly configured passes validation`` () =
    FeatureRunner.runValidateClaude "A directory with all agents and skills correctly configured passes validation"

[<Fact>]
let ``An agent file missing a required frontmatter field fails validation`` () =
    FeatureRunner.runValidateClaude "An agent file missing a required frontmatter field fails validation"

[<Fact>]
let ``An agent declaring the ultra-tier fable model alias passes validation`` () =
    FeatureRunner.runValidateClaude "An agent declaring the ultra-tier fable model alias passes validation"

[<Fact>]
let ``An agent declaring a model outside the tier vocabulary fails validation`` () =
    FeatureRunner.runValidateClaude "An agent declaring a model outside the tier vocabulary fails validation"

[<Fact>]
let ``An agent nested in a role subfolder is validated`` () =
    FeatureRunner.runValidateClaude "An agent nested in a role subfolder is validated"

[<Fact>]
let ``An agent declaring no model fails validation`` () =
    FeatureRunner.runValidateClaude "An agent declaring no model fails validation"

[<Fact>]
let ``Two agents with the same name fail validation`` () =
    FeatureRunner.runValidateClaude "Two agents with the same name fail validation"

[<Fact>]
let ``--agents-only validates agents without checking skills`` () =
    FeatureRunner.runValidateClaude "--agents-only validates agents without checking skills"

[<Fact>]
let ``--skills-only validates skills without checking agents`` () =
    FeatureRunner.runValidateClaude "--skills-only validates skills without checking agents"

[<Fact>]
let ``An agent whose effort contradicts its grade fails validation`` () =
    FeatureRunner.runValidateClaude "An agent whose effort contradicts its grade fails validation"

[<Fact>]
let ``An agent whose justification argues for a grade it does not declare fails validation`` () =
    FeatureRunner.runValidateClaude
        "An agent whose justification argues for a grade it does not declare fails validation"

[<Fact>]
let ``An agent stating no model selection justification fails validation`` () =
    FeatureRunner.runValidateClaude "An agent stating no model selection justification fails validation"

[<Fact>]
let ``A registry declaring no grade vocabulary fails closed`` () =
    FeatureRunner.runValidateClaude "A registry declaring no grade vocabulary fails closed"

[<Fact>]
let ``A Claude agent under a role subfolder gets a flat Codex TOML counterpart`` () =
    FeatureRunner.runCodexBinding "A Claude agent under a role subfolder gets a flat Codex TOML counterpart"

[<Fact>]
let ``An agent's model and effort tier is carried onto its Codex counterparts`` () =
    FeatureRunner.runCodexBinding "An agent's model and effort tier is carried onto its Codex counterparts"

[<Fact>]
let ``A tier with no Codex counterpart is omitted rather than guessed`` () =
    FeatureRunner.runCodexBinding "A tier with no Codex counterpart is omitted rather than guessed"

[<Fact>]
let ``Agent identity comes from the name frontmatter, not the source subfolder`` () =
    FeatureRunner.runCodexBinding "Agent identity comes from the name frontmatter, not the source subfolder"

[<Fact>]
let ``Regenerating rewrites only the delimited region of .codex/config.toml`` () =
    FeatureRunner.runCodexBinding "Regenerating rewrites only the delimited region of .codex/config.toml"

[<Fact>]
let ``Pushing an over-budget instruction file is blocked`` () =
    FeatureRunner.runWordBudgetPrePush "Pushing an over-budget instruction file is blocked"

[<Fact>]
let ``Pushing changes that do not touch instruction files skips the gate`` () =
    FeatureRunner.runWordBudgetPrePush "Pushing changes that do not touch instruction files skips the gate"

[<Fact>]
let ``Pushing an in-budget instruction-file edit passes`` () =
    FeatureRunner.runWordBudgetPrePush "Pushing an in-budget instruction-file edit passes"

[<Fact>]
let ``Pushing an RTK-only change invokes its configured gate`` () =
    FeatureRunner.runWordBudgetPrePush "Pushing an RTK-only change invokes its configured gate"

[<Fact>]
let ``The rule is documented as a convention`` () =
    FeatureRunner.runWordBudgetRule "The rule is documented as a convention"

[<Fact>]
let ``rules-checker validates the budget qualitatively`` () =
    FeatureRunner.runWordBudgetRule "rules-checker validates the budget qualitatively"

[<Fact>]
let ``The quality gate leaves the word-budget validator to deterministic tooling`` () =
    FeatureRunner.runWordBudgetRule "The quality gate leaves the word-budget validator to deterministic tooling"

[<Fact>]
let ``The preflight envelope carries the governance-word-budget category`` () =
    FeatureRunner.runWordBudgetRule "The preflight envelope carries the governance-word-budget category"

[<Fact>]
let ``The AI checker defers to lifecycle-gate evidence`` () =
    FeatureRunner.runWordBudgetRule "The AI checker defers to lifecycle-gate evidence"

[<Fact>]
let ``Missing agent directories fail the aggregate harness audit`` () =
    FeatureRunner.runHarnessAudit "Missing agent directories fail the aggregate harness audit"

[<Fact>]
let ``The catalog table renders from the harness registry`` () =
    FeatureRunner.runHarnessCatalog "The catalog table renders from the harness registry"

[<Fact>]
let ``A hand edit inside the generated region is rejected`` () =
    FeatureRunner.runHarnessCatalog "A hand edit inside the generated region is rejected"

[<Fact>]
let ``An unclassified file under a binding directory fails the validator`` () =
    FeatureRunner.runHarnessOwnership "An unclassified file under a binding directory fails the validator"

[<Fact>]
let ``A generated file must reproduce byte-for-byte`` () =
    FeatureRunner.runHarnessOwnership "A generated file must reproduce byte-for-byte"

[<Fact>]
let ``A vendored file carries no byte guard`` () =
    FeatureRunner.runHarnessOwnership "A vendored file carries no byte guard"

[<Fact>]
let ``A source path is never written by the emitter`` () =
    FeatureRunner.runHarnessOwnership "A source path is never written by the emitter"

[<Fact>]
let ``Every tracked binding file in this repository carries exactly one class`` () =
    FeatureRunner.runHarnessOwnership "Every tracked binding file in this repository carries exactly one class"

[<Fact>]
let ``An in-sync tree reports no divergence`` () =
    FeatureRunner.runHarnessSyncTriage "An in-sync tree reports no divergence"

[<Fact>]
let ``Detection survives a fresh clone where every file carries checkout time`` () =
    FeatureRunner.runHarnessSyncTriage "Detection survives a fresh clone where every file carries checkout time"

[<Fact>]
let ``One-sided divergence is detected and promotion is offered`` () =
    FeatureRunner.runHarnessSyncTriage "One-sided divergence is detected and promotion is offered"

[<Fact>]
let ``A canonical edit that was never regenerated is reported against the canonical side`` () =
    FeatureRunner.runHarnessSyncTriage
        "A canonical edit that was never regenerated is reported against the canonical side"

[<Fact>]
let ``Divergence on both sides is a hard stop with no automatic resolution`` () =
    FeatureRunner.runHarnessSyncTriage "Divergence on both sides is a hard stop with no automatic resolution"

[<Fact>]
let ``Promotion emits a reviewable diff and never writes canonical source`` () =
    FeatureRunner.runHarnessSyncTriage "Promotion emits a reviewable diff and never writes canonical source"

[<Fact>]
let ``Promotion lists the canonical fields the editing harness cannot carry`` () =
    FeatureRunner.runHarnessSyncTriage "Promotion lists the canonical fields the editing harness cannot carry"

[<Fact>]
let ``Promoting a both-diverged mirror directly still warns, without requiring triage first`` () =
    FeatureRunner.runHarnessSyncTriage
        "Promoting a both-diverged mirror directly still warns, without requiring triage first"

[<Fact>]
let ``Promoting a skills mirror lists no field at risk, because a byte copy translates nothing`` () =
    FeatureRunner.runHarnessSyncTriage
        "Promoting a skills mirror lists no field at risk, because a byte copy translates nothing"

[<Fact>]
let ``A vendored file is excluded from triage entirely`` () =
    FeatureRunner.runHarnessSyncTriage "A vendored file is excluded from triage entirely"

[<Fact>]
let ``The default failure behaviour is unchanged and now names the way out`` () =
    FeatureRunner.runHarnessSyncTriage "The default failure behaviour is unchanged and now names the way out"

[<Fact>]
let ``This repository's own tree reports zero divergences`` () =
    FeatureRunner.runHarnessSyncTriage "This repository's own tree reports zero divergences"

[<Fact>]
let ``Vendored subdirectories are declared, not inferred`` () =
    FeatureRunner.runVendoredSkillPreservation "Vendored subdirectories are declared, not inferred"

[<Fact>]
let ``Stale-mirror cleanup never reaches a vendored directory`` () =
    FeatureRunner.runVendoredSkillPreservation "Stale-mirror cleanup never reaches a vendored directory"

[<Fact>]
let ``A vendored declaration that disagrees with its own ownership record is refused`` () =
    FeatureRunner.runVendoredSkillPreservation
        "A vendored declaration that disagrees with its own ownership record is refused"

[<Fact>]
let ``A vendored entry naming no real directory is refused even when no ownership record contradicts it`` () =
    FeatureRunner.runVendoredSkillPreservation
        "A vendored entry naming no real directory is refused even when no ownership record contradicts it"
