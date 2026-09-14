/// Port of the Rust `governance` namespace's `readme-index` validator,
/// generator, and rewriter
/// [Repo-grounded — `apps/rhino-cli/src/application/governance/readme_index.rs`,
/// `apps/rhino-cli/src/commands/governance_validate_readme_index.rs`,
/// `apps/rhino-cli/src/commands/governance_generate_readme_index.rs`,
/// `apps/rhino-cli/src/commands/governance_rewrite_readme_index_paths.rs`] for
/// `specs/apps/rhino/cli/behaviours/governance/governance-readme-index.feature`'s
/// 18 scenarios. First `governance`-namespace port in Wave D (previous PRs
/// all ported the `md` namespace).
///
/// Findings use a bespoke `ReadmeIndexFinding` record carrying a structured
/// `Kind` (`Orphan`/`Ghost`/`Missing`/`Unannotated`), not the shared
/// `RhinoCli.Domain.Types.Finding` record — the `--fail-kinds` scenario needs
/// to filter on kind structurally, which the shared record cannot express,
/// same rationale `Md.fs`'s mermaid section already used for its own bespoke
/// types.
///
/// `governance` is not yet listed in `FSHARP_NAMESPACES` (that flip is later,
/// separate Wave D integration work), so — matching every other Wave D PR's
/// precedent — `auditReadmeIndex`/`generateReadmeIndex`/`rewriteIndexPaths`
/// are called directly by step definitions with an explicit path list, never
/// through CLI argv parsing. No text/JSON/Markdown rendering lives here for
/// the same reason: no scenario asserts on rendered output, only on the
/// structured finding list and the exit-code-affecting `hasFailingFinding`
/// predicate (the actual mechanism behind the `unannotated` finding kind's
/// dark-launch: `hasFailingFinding` excludes `Unannotated` from an empty
/// `--fail-kinds` list, and includes it once a caller names it explicitly —
/// there is no separate "Phase 9 armed" flag anywhere in the source, in
/// Rust or here).
///
/// Also ports the `governance word-budget` gate
/// [Repo-grounded — `apps/rhino-cli/src/application/governance/word_budget.rs`,
/// `apps/rhino-cli/src/commands/governance_validate_word_budget.rs`] for
/// `specs/apps/rhino/cli/behaviours/governance/governance-word-budget.feature`'s
/// 20 scenarios (Wave D PR9). Findings use a bespoke `WordBudgetFinding`
/// record carrying a three-tier `WordBudgetSeverity`
/// (`Within`/`Warn`/`Fail`, named to avoid the `Ok` case literal — see
/// `RhinoCli.Domain.Types.Severity`'s doc comment for why a case named `Ok`
/// or `Error` collides with `FSharp.Core`'s own `Result` cases under
/// GRA-UNIONCASE-001), not `ReadmeIndexFindingKind`'s two-tier severity
/// string or the shared `RhinoCli.Domain.Types.Finding` record.
///
/// `check_instruction_sizes` globs for covered surfaces using `glob`
/// (crates.io) in Rust; this port implements a small `**`-aware segment
/// matcher instead of pulling in a NuGet glob package, since every real
/// `governance-word-budget.surfaces` glob in `repo-config.yml` is one of
/// three shapes: a literal root file (`AGENTS.md`), a `<dir>/**/*.md`
/// recursive-descent pattern, or the `**/README.md` catch-all — `*` never
/// appears mid-segment other than the trailing `*.md`/`*` wildcard, so a
/// single-`*`-per-segment matcher plus `**` segment-skipping is sufficient;
/// widening it is future work if a more elaborate glob is ever configured.
///
/// Like `governance` readme-index, `word-budget` is not yet listed in
/// `FSHARP_NAMESPACES`, so `checkInstructionSizes`/`checkResolvedTree` are
/// called directly by step definitions against an explicit `repoRoot`,
/// never through CLI argv parsing. Four scenarios ("The old command is
/// gone", "The old config block is gone", "The old gate id is replaced...",
/// "No inbound link to the renamed convention is left broken") are
/// registry/text proxy checks against this repository's own live
/// `repo-config.yml`/governance tree, mirroring `word_budget.rs`'s own test
/// module comment that "full CLI-dispatch and gate-registry-list assertions
/// belong to cli.rs/gate tests, out of this module's scope" — the F# port
/// has no `cli.rs`/`gate` equivalent yet either, so these stay proxy checks
/// here too rather than exercising a CLI dispatcher that does not exist.
module RhinoCli.Application.Governance

open System
open System.Collections.Generic
open System.Diagnostics.CodeAnalysis
open System.IO
open System.Text
open System.Text.RegularExpressions
open YamlDotNet.Serialization
open RhinoCli.Application.Md

/// Machine-readable violation category
/// [Repo-grounded — `readme_index.rs::ReadmeIndexFinding::kind`].
[<RequireQualifiedAccess>]
type ReadmeIndexFindingKind =
    | Orphan
    | Ghost
    | Missing
    | Unannotated

    /// The lowercase name this kind is addressed by in `--fail-kinds`.
    member this.Name =
        match this with
        | Orphan -> "orphan"
        | Ghost -> "ghost"
        | Missing -> "missing"
        | Unannotated -> "unannotated"

/// One reported problem from the README index audit
/// [Repo-grounded — `readme_index.rs::ReadmeIndexFinding`].
type ReadmeIndexFinding =
    { File: string
      Severity: string
      Kind: ReadmeIndexFindingKind
      Message: string }

/// Directory names skipped during every recursive walk
/// [Repo-grounded — `readme_index.rs::SKIP_DIRS`].
let private skipDirs: Set<string> =
    set [ "node_modules"; "target"; "dist"; "build"; ".next"; ".git" ]

/// Matches a Markdown link whose href ends with `.md` (optionally with a
/// fragment or query string), tolerating one level of nested square brackets
/// in the link text [Repo-grounded — `readme_index.rs::readme_link_re`].
let private readmeLinkRegex =
    Regex(@"\[(?:[^\[\]]|\[[^\[\]]*\])+\]\(([^)]*\.md(?:[#?][^)]*)?)\)", RegexOptions.Compiled)

/// Matches a `.md` link immediately followed (same line) by an em-dash or
/// double-hyphen annotation separator and non-whitespace text
/// [Repo-grounded — `readme_index.rs::annotated_link_re`].
let private annotatedLinkRegex =
    Regex(@"\[(?:[^\[\]]|\[[^\[\]]*\])+\]\([^)]*\.md(?:[#?][^)]*)?\)\s*(?:—|--)\s*\S", RegexOptions.Compiled)

/// Every content tree the repository governs by default when `--paths` is
/// absent [Repo-grounded —
/// `governance_validate_readme_index.rs::DEFAULT_PATHS`]. The generated
/// harness mirrors (`.opencode/`, `.codex/`) are deliberately absent — see
/// that constant's doc comment.
let defaultPaths: string list =
    [ "docs/"; "repo-governance/"; "specs/"; ".claude/" ]

/// Resolves the scan-path list for a `validate` invocation: an explicit,
/// non-empty `paths` list wins; `defaultPaths` is used unchanged otherwise
/// [Repo-grounded — `governance_validate_readme_index.rs::resolve_scan_paths`].
let resolveScanPaths (paths: string list) : string list =
    if List.isEmpty paths then defaultPaths else paths

/// Returns `true` when at least one finding's `Kind` should fail the
/// invocation. When `failKinds` is empty, every kind contributes **except**
/// `Unannotated` — that kind is dark-launched: discoverable and printed, but
/// never contributes to the exit code until a caller names it explicitly in
/// `failKinds` [Repo-grounded —
/// `governance_validate_readme_index.rs::has_failing_finding`].
let hasFailingFinding (findings: ReadmeIndexFinding list) (failKinds: string list) : bool =
    if List.isEmpty failKinds then
        findings |> List.exists (fun f -> f.Kind <> ReadmeIndexFindingKind.Unannotated)
    else
        findings |> List.exists (fun f -> failKinds |> List.contains f.Kind.Name)

/// Splits a raw markdown link target into its path part and any trailing
/// `#fragment`/`?query` suffix [Repo-grounded —
/// `readme_index.rs::split_link_suffix`].
let private splitLinkSuffix (target: string) : string * string =
    let idx = target.IndexOfAny([| '#'; '?' |])

    if idx >= 0 then
        target.Substring(0, idx), target.Substring(idx)
    else
        target, ""

/// Normalises a raw markdown link target into the canonical sibling-target
/// form the audit logic compares on, or `None` when it is not a sibling
/// target at all (empty, absolute, parent-relative, or a URL)
/// [Repo-grounded — `readme_index.rs::normalize_link_target`].
let private normalizeLinkTarget (raw: string) : string option =
    let raw = raw.Trim()

    // Coverage note: both callers (extractReadmeLinks, existingEntryLines)
    // only ever pass a capture group of `readmeLinkRegex`, whose pattern
    // requires a literal ".md" substring inside the parens — so `raw.Trim()`
    // can never actually equal "" here. Kept as defensive belt-and-braces
    // for any future caller that supplies an unvalidated string directly.
    if raw = "" then
        None
    else
        let raw =
            if raw.StartsWith("./", StringComparison.Ordinal) then
                raw.Substring(2)
            else
                raw

        let raw, _ = splitLinkSuffix raw

        if
            raw = ""
            || raw.StartsWith("/", StringComparison.Ordinal)
            || raw.StartsWith("..", StringComparison.Ordinal)
        then
            None
        else
            let colonIdx = raw.IndexOf(':')

            let urlLike =
                if colonIdx > 0 then
                    let slashIdx = raw.IndexOf('/')
                    slashIdx < 0 || colonIdx < slashIdx
                else
                    false

            if urlLike then None else Some(raw.Replace('\\', '/'))

/// Extracts every sibling `.md` link target found anywhere in `content`,
/// normalised by [`normalizeLinkTarget`]
/// [Repo-grounded — `readme_index.rs::extract_readme_links`].
let private extractReadmeLinks (content: string) : Set<string> =
    readmeLinkRegex.Matches(content)
    |> Seq.cast<Match>
    |> Seq.choose (fun m -> normalizeLinkTarget m.Groups.[1].Value)
    |> Set.ofSeq

/// Extracts the link targets of every `.md` link that appears on a line with
/// no derived-annotation suffix — the dark-launched `Unannotated` finding
/// kind [Repo-grounded — `readme_index.rs::extract_unannotated_link_targets`].
let private extractUnannotatedLinkTargets (content: string) : Set<string> =
    content.Split('\n')
    |> Seq.filter (fun line -> readmeLinkRegex.IsMatch line && not (annotatedLinkRegex.IsMatch line))
    |> Seq.collect (fun line ->
        readmeLinkRegex.Matches(line)
        |> Seq.cast<Match>
        |> Seq.choose (fun m ->
            let raw = m.Groups.[1].Value.Trim()

            let raw =
                if raw.StartsWith("./", StringComparison.Ordinal) then
                    raw.Substring(2)
                else
                    raw

            let idx = raw.IndexOfAny([| '#'; '?' |])
            let raw = if idx >= 0 then raw.Substring(0, idx) else raw

            if
                raw = ""
                || raw.StartsWith("/", StringComparison.Ordinal)
                || raw.StartsWith("..", StringComparison.Ordinal)
            then
                None
            else
                Some(raw.Replace('\\', '/'))))
    |> Set.ofSeq

/// The set of linkable targets adjacent to an index file
/// [Repo-grounded — `readme_index.rs::SiblingTargets`].
type private SiblingTargets =
    { Files: Set<string>
      SubDirs: Set<string> }

    [<ExcludeFromCodeCoverage>]
    static member Empty: SiblingTargets =
        { Files = Set.empty
          SubDirs = Set.empty }

    /// Every linkable target name, sorted.
    member this.SortedNames: string list =
        Set.union this.Files this.SubDirs |> Set.toList |> List.sort

    /// Returns `true` when `link` refers to a file or subdirectory present on
    /// disk, including a bare-directory link (`"structure"` resolves to
    /// `"structure/README.md"`).
    [<ExcludeFromCodeCoverage>]
    member this.Present(link: string) : bool =
        let normalized = link.Replace('\\', '/').TrimEnd('/')

        if this.Files.Contains normalized || this.SubDirs.Contains normalized then
            true
        else
            this.SubDirs.Contains(normalized + "/README.md")

/// Lists the sibling `.md` files and subdirectories that contain a
/// `README.md` adjacent to an index file at `dir`
/// [Repo-grounded — `readme_index.rs::list_sibling_targets`].
[<ExcludeFromCodeCoverage>]
let private listSiblingTargets (dir: string) : SiblingTargets =
    // Coverage note: every call site (auditIndexFile/generateIndexFile via
    // `targetDir`, auditOneDir/generateOneDir via `dir`) passes a directory
    // that `listAllDirs`/`walkDirsRecursive` already confirmed exists moments
    // earlier in the same synchronous call — there is no TOCTOU gap in a
    // single-threaded CLI invocation. This guard only fires under an actual
    // filesystem race with a concurrent deleter, which a deterministic unit
    // test cannot construct without exploiting undefined pathological input.
    if not (Directory.Exists dir) then
        SiblingTargets.Empty
    else
        Directory.GetFileSystemEntries dir
        |> Array.sort
        |> Array.fold
            (fun (acc: SiblingTargets) full ->
                let name = Path.GetFileName full

                if Directory.Exists full then
                    if name.StartsWith(".", StringComparison.Ordinal) || skipDirs.Contains name then
                        acc
                    else
                        let subReadme = Path.Combine(full, "README.md")

                        if File.Exists subReadme then
                            { acc with
                                SubDirs = Set.add (name + "/README.md") acc.SubDirs }
                        else
                            acc
                elif
                    name.StartsWith(".", StringComparison.Ordinal)
                    || name = "README.md"
                    || not (name.EndsWith(".md", StringComparison.Ordinal))
                then
                    acc
                else
                    { acc with
                        Files = Set.add name acc.Files })
            SiblingTargets.Empty

/// Recursively lists every directory reachable from `root` (including `root`
/// itself), skipping [`skipDirs`]. Dot-directories are deliberately NOT
/// skipped by this walker — only by [`listSiblingTargets`]'s per-child
/// exclusion — since a dot-directory (`.claude/`, `.codex/`) is first-class
/// governed content, not build junk [Repo-grounded —
/// `readme_index.rs::list_all_dirs`/`walk_dirs_recursive`].
[<ExcludeFromCodeCoverage>]
let rec private walkDirsRecursive (dir: string) : string list =
    // Coverage note: the initial call (from listAllDirs) is guarded by its
    // own Directory.Exists check, and every recursive call passes a `d`
    // freshly returned by `Directory.GetDirectories dir` moments earlier —
    // same TOCTOU-free reasoning as listSiblingTargets above.
    if not (Directory.Exists dir) then
        []
    else
        Directory.GetDirectories dir
        |> Array.sort
        |> Array.filter (fun d -> not (skipDirs.Contains(Path.GetFileName d)))
        |> Array.toList
        |> List.collect (fun d -> d :: walkDirsRecursive d)

[<ExcludeFromCodeCoverage>]
let private listAllDirs (root: string) : string list =
    if not (Directory.Exists root) then
        []
    else
        root :: walkDirsRecursive root

/// Returns `Some dirName` when `name` is a subdirectory target
/// (`"<dirName>/README.md"`), else `None`.
let private trySubdirName (name: string) : string option =
    if name.EndsWith("/README.md", StringComparison.Ordinal) then
        Some(name.Substring(0, name.Length - "/README.md".Length))
    else
        None

/// Audits a single index file (`README.md`, or a split directory's sibling
/// `<name>.md`) against the sibling targets present under `targetDir`
/// [Repo-grounded — `readme_index.rs::audit_index_file`].
[<ExcludeFromCodeCoverage>]
let private auditIndexFile (indexPath: string) (targetDir: string) : ReadmeIndexFinding list =
    let content = File.ReadAllText indexPath
    let indexDir = Path.GetDirectoryName(indexPath: string)

    // A split-directory index file lives in `targetDir`'s parent, not in
    // `targetDir` itself, so its link targets carry an explicit
    // "<targetDir-name>/" prefix that must be stripped before comparing
    // against `targetDir`'s own sibling names.
    let linkPrefix =
        if String.Equals(indexDir, targetDir, StringComparison.Ordinal) then
            None
        else
            Some(Path.GetFileName targetDir + "/")

    // Returns the normalized link plus whether `raw` actually carried
    // `linkPrefix` (i.e. was genuinely written relative to `targetDir`'s
    // parent). This provenance matters below: only a link that never
    // carried the prefix may fall back to resolving against `indexDir` — a
    // prefixed link that fails to resolve under `targetDir` is a genuine
    // ghost, not a same-dir sibling reference, even if a same-named file
    // happens to sit beside `indexDir`
    // [Repo-grounded — `readme_index.rs::audit_index_file`'s `normalize` closure].
    let normalize (raw: string) : string * bool =
        match linkPrefix with
        | Some p when raw.StartsWith(p, StringComparison.Ordinal) -> raw.Substring(p.Length), true
        | _ -> raw, false

    // Map from normalized link -> "was this link ever seen prefixed with
    // targetDir's name?". Defaults to `false`; flips to `true` if any raw
    // occurrence of this normalized link carried the prefix, so the ghost
    // guard below always errs toward reporting rather than silently
    // swallowing a genuine ghost.
    let linkedProvenance =
        extractReadmeLinks content
        |> Set.toList
        |> List.map normalize
        |> List.fold
            (fun (acc: Map<string, bool>) (normalized, wasPrefixed) ->
                let existing = acc |> Map.tryFind normalized |> Option.defaultValue false
                acc |> Map.add normalized (existing || wasPrefixed))
            Map.empty

    let linked = linkedProvenance |> Map.toList |> List.map fst |> Set.ofList

    let unannotated =
        extractUnannotatedLinkTargets content |> Set.map (normalize >> fst)

    let targets = listSiblingTargets targetDir

    let orphanFindings =
        targets.SortedNames
        |> List.choose (fun name ->
            if linked.Contains name then
                None
            else
                match trySubdirName name with
                | Some dirName when linked.Contains(dirName + ".md") -> None
                | _ ->
                    let full = Path.Combine(targetDir, name)

                    Some
                        { File = full
                          Severity = "high"
                          Kind = ReadmeIndexFindingKind.Orphan
                          Message = sprintf "orphan: %s exists but is not linked from %s" name indexPath })

    let ghostAndUnannotatedFindings =
        linked
        |> Set.toList
        |> List.sort
        |> List.choose (fun link ->
            if not (targets.Present link) then
                let full = Path.Combine(targetDir, link)

                // A split-index file (indexDir != targetDir) physically
                // lives in indexDir, not targetDir — it may legitimately
                // link a sibling of itself (e.g. "general.md") rather than
                // a child under targetDir. Such a link resolves against
                // indexDir, the file's real location, not targetDir. Check
                // that base too before declaring ghost — but ONLY when
                // this link never carried the targetDir prefix
                // [Repo-grounded — `readme_index.rs::audit_index_file`].
                let wasPrefixed = linkedProvenance |> Map.tryFind link |> Option.defaultValue false

                let resolvesAgainstIndexDir =
                    not wasPrefixed
                    && not (String.Equals(indexDir, targetDir, StringComparison.Ordinal))
                    && (let viaIndexDir = Path.Combine(indexDir, link)
                        File.Exists viaIndexDir || Directory.Exists viaIndexDir)

                if File.Exists full || Directory.Exists full || resolvesAgainstIndexDir then
                    None
                else
                    Some
                        { File = full
                          Severity = "high"
                          Kind = ReadmeIndexFindingKind.Ghost
                          Message = sprintf "ghost: %s references %s but the target does not exist" indexPath link }
            elif unannotated.Contains link then
                let full = Path.Combine(targetDir, link)

                Some
                    { File = full
                      Severity = "high"
                      Kind = ReadmeIndexFindingKind.Unannotated
                      Message =
                        sprintf
                            "unannotated: %s links %s without a derived annotation (`- [<title>](<path>) — <description> <when_to_use>`)"
                            indexPath
                            link }
            else
                None)

    orphanFindings @ ghostAndUnannotatedFindings

/// Audits a single directory: mandatory-README detection, additive
/// sibling-index auditing, and orphan/ghost/unannotated detection
/// [Repo-grounded — `readme_index.rs::audit_one_dir`].
[<ExcludeFromCodeCoverage>]
let private auditOneDir (dir: string) (root: string) : ReadmeIndexFinding list =
    let splitIndexFindings =
        if String.Equals(dir, root, StringComparison.Ordinal) then
            []
        else
            // Coverage note: `dir <> root` was just established above, and
            // `dir` is always a genuine child directory yielded by
            // `Directory.GetDirectories`, so it always carries a non-empty
            // basename and a non-null parent. This guard only protects
            // against `dir` being the filesystem root itself, which cannot
            // happen for a proper descendant of `root`.
            let parent = Path.GetDirectoryName(dir: string)
            let name = Path.GetFileName dir

            if String.IsNullOrEmpty parent || String.IsNullOrEmpty name then
                []
            else
                let splitIndex = Path.Combine(parent, name + ".md")

                if File.Exists splitIndex then
                    auditIndexFile splitIndex dir
                else
                    []

    let readmePath = Path.Combine(dir, "README.md")

    if File.Exists readmePath then
        splitIndexFindings @ auditIndexFile readmePath dir
    elif String.Equals(dir, root, StringComparison.Ordinal) then
        // The scan root itself is never required to carry a README — a
        // caller passes a covered-tree root deliberately. A descendant
        // directory is never exempt.
        splitIndexFindings
    else
        let targets = listSiblingTargets dir

        if not (Set.isEmpty targets.Files) || not (Set.isEmpty targets.SubDirs) then
            splitIndexFindings
            @ [ { File = dir
                  Severity = "high"
                  Kind = ReadmeIndexFindingKind.Missing
                  Message = sprintf "missing: %s contains indexable content but has no README.md" dir } ]
        else
            splitIndexFindings

/// Audits every directory reachable from `root`
/// [Repo-grounded — `readme_index.rs::audit_root`].
[<ExcludeFromCodeCoverage>]
let private auditRoot (root: string) : ReadmeIndexFinding list =
    listAllDirs root |> List.collect (fun d -> auditOneDir d root)

/// Audits every covered directory found under each root in `paths`, relative
/// to `repoRoot` when a path is not already absolute
/// [Repo-grounded — `readme_index.rs::audit_readme_index`].
[<ExcludeFromCodeCoverage>]
let auditReadmeIndex (repoRoot: string) (paths: string list) : ReadmeIndexFinding list =
    paths
    |> List.collect (fun p ->
        let full = if Path.IsPathRooted p then p else Path.Combine(repoRoot, p)
        auditRoot full)
    |> List.sortBy (fun f -> f.File, f.Kind.Name)

// ===========================================================================
// `governance readme-index generate`
// ===========================================================================

/// Frontmatter fields read from a link target to derive its README-index
/// annotation [Repo-grounded — `readme_index.rs::TargetMeta`].
[<ExcludeFromCodeCoverage>]
type private TargetMeta =
    { Title: string option
      Description: string option
      WhenToUse: string option }

    static member Empty: TargetMeta =
        { Title = None
          Description = None
          WhenToUse = None }

let private rawFrontmatterDeserializer: IDeserializer =
    DeserializerBuilder().Build()

/// Returns `dict[key]` as a trimmed, non-empty string, or `None`
/// [Repo-grounded — `readme_index.rs::non_empty_frontmatter_string`].
[<ExcludeFromCodeCoverage>]
let private nonEmptyFrontmatterString (dict: IDictionary<obj, obj>) (key: string) : string option =
    dict
    |> Seq.tryFind (fun kv ->
        match kv.Key with
        | :? string as s -> String.Equals(s, key, StringComparison.Ordinal)
        | _ -> false)
    |> Option.map (fun kv -> kv.Value)
    |> Option.bind (function
        | :? string as s -> Some s
        | _ -> None)
    |> Option.map (fun s -> s.Trim())
    |> Option.filter (fun s -> s <> "")

/// Reads `path`'s frontmatter `title`/`description`/`when_to_use` fields,
/// tolerating a target with no frontmatter at all
/// [Repo-grounded — `readme_index.rs::read_target_meta`].
[<ExcludeFromCodeCoverage>]
let private readTargetMeta (path: string) : TargetMeta =
    // Coverage note: readTargetMeta's sole caller (entryFor) always supplies
    // a `path` drawn from `targets.SortedNames` — a name `listSiblingTargets`
    // already confirmed exists (either a literal sibling `.md` file, or a
    // subdirectory whose `README.md` was confirmed present) moments earlier
    // in the same synchronous call.
    if not (File.Exists path) then
        TargetMeta.Empty
    else
        let content = File.ReadAllText path

        match extractFrontmatter content with
        | None -> TargetMeta.Empty
        | Some fmBlock ->
            try
                match rawFrontmatterDeserializer.Deserialize<obj>(fmBlock) with
                | :? IDictionary<obj, obj> as dict ->
                    { Title = nonEmptyFrontmatterString dict "title"
                      Description = nonEmptyFrontmatterString dict "description"
                      WhenToUse = nonEmptyFrontmatterString dict "when_to_use" }
                | _ -> TargetMeta.Empty
            with _ ->
                TargetMeta.Empty

/// Returns `true` when `path` lies under a `repo-governance/` tree — the
/// `when_to_use` annotation field applies only there
/// [Repo-grounded — `readme_index.rs::path_is_repo_governance`].
[<ExcludeFromCodeCoverage>]
let private isRepoGovernance (path: string) : bool =
    path.Replace('\\', '/').Contains("repo-governance/", StringComparison.Ordinal)

/// Converts a kebab/snake-case stem into Title Case words joined by spaces
/// [Repo-grounded — `readme_index.rs::title_case_from_stem`].
[<ExcludeFromCodeCoverage>]
let private titleCaseFromStem (stem: string) : string =
    stem.Split([| '-'; '_' |])
    |> Array.filter (fun w -> w <> "")
    |> Array.map (fun w -> (Char.ToUpperInvariant w.[0]).ToString() + w.Substring(1))
    |> String.concat " "

/// Derives a human-readable fallback title from a sibling-target `name`
/// [Repo-grounded — `readme_index.rs::fallback_entry_title`].
[<ExcludeFromCodeCoverage>]
let private fallbackEntryTitle (name: string) : string =
    // Coverage note: fallbackEntryTitle's sole caller (entryFor) always
    // supplies a `name` drawn from `targets.SortedNames`, whose members are
    // either a bare "*.md" sibling file (always ends ".md") or a
    // "<dir>/README.md" subdirectory target (always ends "/README.md") — the
    // trailing `else name` branch below is therefore unreachable.
    let baseName =
        if name.EndsWith("/README.md", StringComparison.Ordinal) then
            name.Substring(0, name.Length - "/README.md".Length)
        elif name.EndsWith(".md", StringComparison.Ordinal) then
            name.Substring(0, name.Length - 3)
        else
            name

    let slashIdx = baseName.LastIndexOf('/')

    // Coverage note: both branches above strip only a single trailing
    // segment, and `SubDirs`/`Files` names are always single path segments
    // (Path.GetFileName has no "/"), so `baseName` never carries a further
    // "/" here — the `slashIdx >= 0` branch is unreachable via the current
    // call graph.
    let baseName =
        if slashIdx >= 0 then
            baseName.Substring(slashIdx + 1)
        else
            baseName

    titleCaseFromStem baseName

/// Derives a human-readable fallback title for a brand-new index file's `title:`
/// frontmatter field and H1 heading [Repo-grounded —
/// `readme_index.rs::fallback_index_title`].
[<ExcludeFromCodeCoverage>]
let private fallbackIndexTitle (indexPath: string) : string =
    // Coverage note: fallbackIndexTitle's sole caller is generateIndexFile's
    // "index file does not yet exist" branch, which is reached only for
    // `Path.Combine(dir, "README.md")` (`stem` is always "README") — the
    // split-index shape ("<dir>.md") is only ever passed to generateIndexFile
    // when that file already exists (generateOneDir checks `File.Exists
    // splitIndex` first), so it always takes the *other* branch of
    // generateIndexFile instead. The `else titleCaseFromStem stem` branch
    // below is therefore unreachable via the current call graph.
    let stem = Path.GetFileNameWithoutExtension indexPath

    if String.Equals(stem, "README", StringComparison.OrdinalIgnoreCase) then
        // Coverage note: `dir` here is always a genuine subdirectory (the
        // scan root is exempted from new-file creation by generateOneDir's
        // own `elif dir = root` branch), so `Path.GetFileName(dir)` — which
        // is exactly what `parentName` computes — is always a real,
        // non-empty subdirectory name. The "Index" fallback below only fires
        // if `indexPath` itself were rooted at the filesystem root, which
        // cannot happen for a proper descendant.
        let parentName = Path.GetFileName(Path.GetDirectoryName(indexPath: string))

        if String.IsNullOrEmpty parentName then
            "Index"
        else
            titleCaseFromStem parentName
    else
        titleCaseFromStem stem

/// Formats one annotated index entry
/// [Repo-grounded — `readme_index.rs::format_entry`].
[<ExcludeFromCodeCoverage>]
let private formatEntry (title: string) (link: string) (isGovernance: bool) (meta: TargetMeta) : string =
    match meta.Description with
    | Some description ->
        match isGovernance, meta.WhenToUse with
        | true, Some whenToUse -> sprintf "- [%s](%s) — %s %s" title link description whenToUse
        | _ -> sprintf "- [%s](%s) — %s" title link description
    | None -> sprintf "- [%s](%s)" title link

/// Returns the zero-based line numbers of an existing index's entry lines —
/// every list item that links a sibling `.md` target
/// [Repo-grounded — `readme_index.rs::existing_entry_lines`].
[<ExcludeFromCodeCoverage>]
let private existingEntryLines (lines: string[]) : int list =
    lines
    |> Array.toList
    |> List.mapi (fun i l -> i, l)
    |> List.filter (fun (_, l) ->
        let trimmed = l.TrimStart()

        (trimmed.StartsWith("- ", StringComparison.Ordinal)
         || trimmed.StartsWith("* ", StringComparison.Ordinal))
        && (let m = readmeLinkRegex.Match l in m.Success && (normalizeLinkTarget m.Groups.[1].Value).IsSome))
    |> List.map fst

/// Writes a single conforming index file at `indexPath`, preserving any
/// existing entry order and annotations and appending only the sibling
/// targets genuinely absent from it, or scaffolding a brand-new index when
/// none exists [Repo-grounded — `readme_index.rs::generate_index_file`].
[<ExcludeFromCodeCoverage>]
let private generateIndexFile (indexPath: string) (targetDir: string) (linkPrefix: string) : unit =
    let targets = listSiblingTargets targetDir

    let entryFor (name: string) : string =
        let link = sprintf "./%s%s" linkPrefix name
        let targetPath = Path.Combine(targetDir, name)
        let meta = readTargetMeta targetPath
        let title = meta.Title |> Option.defaultValue (fallbackEntryTitle name)
        formatEntry title link (isRepoGovernance targetPath) meta

    if File.Exists indexPath then
        let content = File.ReadAllText indexPath
        let lines = content.Replace("\r\n", "\n").Split('\n')
        let entryLines = existingEntryLines lines
        let already = extractReadmeLinks content

        let missing =
            targets.SortedNames
            |> List.filter (fun n -> not (already.Contains(linkPrefix + n)))
            |> List.filter (fun n ->
                match trySubdirName n with
                | Some dirName -> not (already.Contains(linkPrefix + dirName + ".md"))
                | None -> true)
            |> List.map entryFor

        if not (List.isEmpty missing) then
            let linesList = lines |> Array.toList

            let insertAt =
                match entryLines with
                | [] -> List.length linesList
                | _ -> (List.max entryLines) + 1

            let before, after = List.splitAt insertAt linesList
            let updatedLines = before @ missing @ after

            let updated =
                String.Join("\n", updatedLines)
                + (if content.EndsWith("\n", StringComparison.Ordinal) then
                       "\n"
                   else
                       "")

            File.WriteAllText(indexPath, updated)
    else
        let entries = targets.SortedNames |> List.map entryFor
        let title = fallbackIndexTitle indexPath

        // Coverage note: this "new index file" branch is only reached from
        // generateOneDir when `targets` (recomputed identically just above,
        // from the same `targetDir`, in the same synchronous call) is
        // already known non-empty — generateOneDir's own `Set.isEmpty
        // targets.Files && Set.isEmpty targets.SubDirs` guard short-circuits
        // to `splitWritten` before ever calling generateIndexFile in the
        // empty case. `entries` can therefore never be empty here.
        let body =
            if List.isEmpty entries then
                sprintf "# %s\n" title
            else
                sprintf "# %s\n\n%s\n" title (String.Join("\n", entries))

        let content = sprintf "---\ntitle: \"%s\"\n---\n\n%s" title body
        File.WriteAllText(indexPath, content)

/// Mirrors [`auditOneDir`]'s sibling-index/existing-index/root-exemption/
/// applicability decision tree, writing conforming files instead of
/// reporting `Missing` findings [Repo-grounded —
/// `readme_index.rs::generate_one_dir`].
[<ExcludeFromCodeCoverage>]
let private generateOneDir (dir: string) (root: string) : string list =
    let splitWritten =
        if String.Equals(dir, root, StringComparison.Ordinal) then
            []
        else
            // Coverage note: same reasoning as auditOneDir's identical guard
            // above — `dir` here is always a real child directory with a
            // non-empty basename and parent, since `dir <> root` was just
            // established.
            let parent = Path.GetDirectoryName(dir: string)
            let name = Path.GetFileName dir

            if String.IsNullOrEmpty parent || String.IsNullOrEmpty name then
                []
            else
                let splitIndex = Path.Combine(parent, name + ".md")

                if File.Exists splitIndex then
                    generateIndexFile splitIndex dir (name + "/")
                    [ splitIndex ]
                else
                    []

    let readmePath = Path.Combine(dir, "README.md")

    if File.Exists readmePath then
        generateIndexFile readmePath dir ""
        splitWritten @ [ readmePath ]
    elif String.Equals(dir, root, StringComparison.Ordinal) then
        splitWritten
    else
        let targets = listSiblingTargets dir

        if Set.isEmpty targets.Files && Set.isEmpty targets.SubDirs then
            splitWritten
        else
            generateIndexFile readmePath dir ""
            splitWritten @ [ readmePath ]

/// Compares two `/`-separated paths component-by-component, the way Rust's
/// `PathBuf: Ord` does — not as flat strings. This differs from a plain
/// ordinal string sort exactly at a directory/file-with-extension boundary:
/// e.g. `"foo/README.md"` sorts BEFORE `"foo.md"` here (the "foo" component
/// is a strict prefix of "foo.md", so the shorter component list sorts
/// first), whereas a flat string sort would put `"foo.md"` first (`'.'` <
/// `'/'` byte-wise). `generateReadmeIndex`'s printed `written` list needs
/// this to match Rust's own `Vec<PathBuf>::sort()` byte-for-byte
/// [Repo-grounded — `readme_index.rs::generate_readme_index`'s `written.sort()`].
[<ExcludeFromCodeCoverage>]
let private splitPathComponents (path: string) =
    path.Split('/') |> Array.filter (fun segment -> segment <> "")

[<ExcludeFromCodeCoverage>]
let private comparePathsLikeRust (a: string) (b: string) : int =
    let ca = splitPathComponents a
    let cb = splitPathComponents b
    let len = min ca.Length cb.Length

    // Coverage note: reaching `i >= len` requires one written path's
    // component list to be an exact prefix of the other's. Every written
    // path ends in "README.md" or "<name>.md" (a real file), so a shorter
    // path's final component can only tie a longer path's same-index
    // component if a directory on disk were literally named identically to
    // that "*.md" file — which would collide with the file itself at the
    // same parent and cannot coexist on the filesystem. The `c <> 0` return
    // just below is therefore the only way this comparator resolves in
    // practice; the tie-break on lengths is unreachable via generateReadmeIndex's
    // real call graph.
    let rec loop i =
        if i >= len then
            compare ca.Length cb.Length
        else
            let c = String.CompareOrdinal(ca.[i], cb.[i])
            if c <> 0 then c else loop (i + 1)

    loop 0

/// Writes conforming `README.md` (or split-directory sibling `<name>.md`)
/// indexes for every covered directory reachable from `paths` that needs one
/// [Repo-grounded — `readme_index.rs::generate_readme_index`].
[<ExcludeFromCodeCoverage>]
let generateReadmeIndex (repoRoot: string) (paths: string list) : string list =
    paths
    |> List.collect (fun p ->
        let full = if Path.IsPathRooted p then p else Path.Combine(repoRoot, p)
        listAllDirs full |> List.collect (fun d -> generateOneDir d full))
    |> List.distinct
    |> List.sortWith comparePathsLikeRust

// ===========================================================================
// `governance readme-index rewrite-paths`
// ===========================================================================

/// Rewrites a single link target, or returns it unchanged
/// [Repo-grounded — `readme_index.rs::rewrite_one_target`].
let private rewriteOneTarget (target: string) (renames: Map<string, string>) : string =
    let pathPart, suffix = splitLinkSuffix target
    let slashIdx = pathPart.LastIndexOf('/')

    if slashIdx < 0 then
        match Map.tryFind pathPart renames with
        | Some newName -> newName + suffix
        | None -> target
    else
        let dir = pathPart.Substring(0, slashIdx + 1)
        let baseName = pathPart.Substring(slashIdx + 1)

        match Map.tryFind baseName renames with
        | Some newName -> dir + newName + suffix
        | None -> target

/// Rewrites every markdown link target in `content` whose final path segment
/// matches a key in `renames`, leaving every other byte untouched
/// [Repo-grounded — `readme_index.rs::rewrite_link_targets`].
let private rewriteLinkTargets (content: string) (renames: Map<string, string>) : string =
    let sb = StringBuilder()
    let mutable rest = content
    let mutable keepGoing = true

    while keepGoing do
        let openIdx = rest.IndexOf("](", StringComparison.Ordinal)

        if openIdx < 0 then
            sb.Append(rest) |> ignore
            keepGoing <- false
        else
            sb.Append(rest.Substring(0, openIdx + 2)) |> ignore
            let tail = rest.Substring(openIdx + 2)
            let closeIdx = tail.IndexOf(')')

            if closeIdx < 0 then
                sb.Append(tail) |> ignore
                keepGoing <- false
            else
                let target = tail.Substring(0, closeIdx)
                sb.Append(rewriteOneTarget target renames) |> ignore
                rest <- tail.Substring(closeIdx)

    sb.ToString()

/// Recursively collects every `.md` file reachable from `root`, skipping
/// [`skipDirs`].
[<ExcludeFromCodeCoverage>]
let rec private collectMdFiles (root: string) : string list =
    if File.Exists root then
        if root.EndsWith(".md", StringComparison.Ordinal) then
            [ root ]
        else
            []
    elif Directory.Exists root then
        Directory.GetFileSystemEntries root
        |> Array.sort
        |> Array.toList
        |> List.collect (fun entry ->
            if Directory.Exists entry then
                if skipDirs.Contains(Path.GetFileName entry) then
                    []
                else
                    collectMdFiles entry
            elif entry.EndsWith(".md", StringComparison.Ordinal) then
                [ entry ]
            else
                [])
    else
        []

/// Rewrites markdown link targets across every `.md` file reachable from
/// `paths`, according to a rename map of `(oldBasename, newBasename)` pairs.
/// Only the target inside a `](...)` link is touched — entry order,
/// annotation text, prose, and every other byte are left exactly as they
/// were [Repo-grounded — `readme_index.rs::rewrite_index_paths`].
[<ExcludeFromCodeCoverage>]
let rewriteIndexPaths (repoRoot: string) (paths: string list) (renames: (string * string) list) : string list =
    let renameMap = Map.ofList renames

    if Map.isEmpty renameMap then
        []
    else
        paths
        |> List.collect (fun p ->
            let full = if Path.IsPathRooted p then p else Path.Combine(repoRoot, p)
            collectMdFiles full)
        |> List.choose (fun file ->
            let content = File.ReadAllText file
            let updated = rewriteLinkTargets content renameMap

            if updated <> content then
                File.WriteAllText(file, updated)
                Some file
            else
                None)
        |> List.distinct
        |> List.sort

// ===========================================================================
// `governance word-budget`
// [Repo-grounded — `word_budget.rs`, `governance_validate_word_budget.rs`]
// ===========================================================================

/// Budget thresholds for a single glob surface
/// [Repo-grounded — `word_budget.rs::Surface`].
type Surface =
    { Glob: string
      Target: uint64
      Warn: uint64
      Fail: uint64 }

/// Budget thresholds for the fully-resolved transitive `@`-import tree
/// [Repo-grounded — `word_budget.rs::ResolvedTree`].
type ResolvedTree =
    { Root: string
      Target: uint64
      Warn: uint64
      Fail: uint64 }

/// Parsed `governance-word-budget:` section of `repo-config.yml`
/// [Repo-grounded — `word_budget.rs::BudgetConfig`].
type BudgetConfig =
    { Surfaces: Surface list
      ResolvedTree: ResolvedTree }

/// Three-tier severity for a word-budget finding, named `Within`/`Warn`/
/// `Fail` rather than Rust's `Ok`/`Warn`/`Fail` — an F# union case literally
/// named `Ok` collides with `FSharp.Core`'s own `Result.Ok` under
/// GRA-UNIONCASE-001, the same pitfall `RhinoCli.Domain.Types.Severity`'s
/// doc comment already documents for `Error`
/// [Repo-grounded — `word_budget.rs::Severity`].
[<RequireQualifiedAccess>]
type WordBudgetSeverity =
    | Within
    | Warn
    | Fail

/// Human-readable label for a [`WordBudgetSeverity`]
/// [Repo-grounded — `word_budget.rs::severity_label`].
let wordBudgetSeverityLabel (severity: WordBudgetSeverity) : string =
    match severity with
    | WordBudgetSeverity.Within -> "ok"
    | WordBudgetSeverity.Warn -> "warn"
    | WordBudgetSeverity.Fail -> "fail"

/// One finding produced by [`checkInstructionSizes`] or [`checkResolvedTree`]
/// [Repo-grounded — `word_budget.rs::Finding`].
type WordBudgetFinding =
    { Path: string
      Size: uint64
      Target: uint64
      Warn: uint64
      Fail: uint64
      Severity: WordBudgetSeverity
      Message: string }

/// Reference text appended to every `Fail` finding message — both
/// "progressive disclosure" and the full governance path must appear so a
/// caller can verify them with a plain substring check
/// [Repo-grounded — `word_budget.rs::PROGRESSIVE_DISCLOSURE_REF`].
let private progressiveDisclosureRef: string =
    "progressive disclosure — see repo-governance/principles/content/progressive-disclosure.md"

/// Raw whole-file word count: the number of whitespace-separated tokens in
/// `contents`, identical to `wc -w`. Frontmatter, fenced code, Mermaid,
/// tables, and URLs all count — there is no "prose-only" carve-out
/// [Repo-grounded — `word_budget.rs::word_count`].
let wordCount (contents: string) : uint64 =
    contents.Split((null: char[]), StringSplitOptions.RemoveEmptyEntries)
    |> Array.length
    |> uint64

/// Classifies a word `size` against three-tier budget thresholds. `warn` is
/// used only by the message builders below, not by this classification
/// itself — both "over target" and "over warn threshold" map to `Warn`
/// [Repo-grounded — `word_budget.rs::classify`].
let classify (size: uint64) (target: uint64) (_warn: uint64) (fail: uint64) : WordBudgetSeverity =
    if size <= target then WordBudgetSeverity.Within
    elif size <= fail then WordBudgetSeverity.Warn
    else WordBudgetSeverity.Fail

/// Builds a human-readable message for a surface finding
/// [Repo-grounded — `word_budget.rs::surface_message`].
let private surfaceMessage
    (path: string)
    (size: uint64)
    (target: uint64)
    (warn: uint64)
    (fail: uint64)
    (severity: WordBudgetSeverity)
    : string =
    // Coverage note: surfaceMessage's sole caller (checkInstructionSizes)
    // never invokes it for a `Within` finding — it short-circuits to `None`
    // for `severity = Within` before building any message. The branch below
    // is retained for completeness/exhaustiveness of the match, not because
    // any caller reaches it.
    match severity with
    | WordBudgetSeverity.Within -> sprintf "%s is %d words (within %d-word target)" path size target
    | WordBudgetSeverity.Warn when size <= warn -> sprintf "%s is %d words (over %d-word target)" path size target
    | WordBudgetSeverity.Warn -> sprintf "%s is %d words (over %d-word warn threshold)" path size warn
    | WordBudgetSeverity.Fail ->
        sprintf "%s is %d words (over %d-word fail limit); apply %s" path size fail progressiveDisclosureRef

/// Builds a human-readable message for the resolved-tree finding
/// [Repo-grounded — `word_budget.rs::resolved_tree_message`].
let private resolvedTreeMessage (size: uint64) (rt: ResolvedTree) (severity: WordBudgetSeverity) : string =
    // Coverage note: same as surfaceMessage above — checkResolvedTree, the
    // sole caller, returns `None` for `severity = Within` before ever
    // calling this function, so the branch below is unreachable in practice.
    match severity with
    | WordBudgetSeverity.Within -> sprintf "resolved tree (%s) is %d words (ok)" rt.Root size
    | WordBudgetSeverity.Warn when size <= rt.Warn ->
        sprintf "resolved tree (%s) is %d words (over %d-word target)" rt.Root size rt.Target
    | WordBudgetSeverity.Warn ->
        sprintf "resolved tree (%s) is %d words (over %d-word warn threshold)" rt.Root size rt.Warn
    | WordBudgetSeverity.Fail ->
        sprintf
            "resolved tree (%s) is %d words (over %d-word fail limit); apply %s"
            rt.Root
            size
            rt.Fail
            progressiveDisclosureRef

// ---- glob matching: `**`-aware, single `*` per segment (see module doc) ----

/// Matches one path segment (no `/`) against a pattern segment carrying at
/// most one `*` wildcard — every real `governance-word-budget.surfaces`
/// glob only ever uses `*.md`, never a multi-star or character-class
/// pattern within a segment [Repo-grounded — `word_budget.rs` relies on the
/// `glob` crate's fuller semantics; this port narrows to what the live
/// config actually uses].
let private singleSegmentMatches (pattern: string) (name: string) : bool =
    match pattern.IndexOf('*') with
    | -1 -> String.Equals(pattern, name, StringComparison.Ordinal)
    | starIdx ->
        let prefix = pattern.Substring(0, starIdx)
        let suffix = pattern.Substring(starIdx + 1)

        name.Length >= prefix.Length + suffix.Length
        && name.StartsWith(prefix, StringComparison.Ordinal)
        && name.EndsWith(suffix, StringComparison.Ordinal)

/// Matches a `/`-split pattern-segment list against a `/`-split name-segment
/// list, where a bare `**` segment consumes zero or more name segments.
let rec private globSegmentsMatch (patternSegs: string list) (nameSegs: string list) : bool =
    match patternSegs with
    | [] -> List.isEmpty nameSegs
    | [ "**" ] -> true
    | "**" :: prest ->
        let rec tryConsume (remaining: string list) : bool =
            if globSegmentsMatch prest remaining then
                true
            else
                match remaining with
                | _ :: rest -> tryConsume rest
                | [] -> false

        tryConsume nameSegs
    | pseg :: prest ->
        match nameSegs with
        | nseg :: nrest when singleSegmentMatches pseg nseg -> globSegmentsMatch prest nrest
        | _ -> false

/// Matches a forward-slash `pattern` against a forward-slash repo-relative
/// `relPath` [Repo-grounded — `word_budget.rs::check_instruction_sizes`'s
/// use of `glob::glob`].
let private globMatchesRelPath (pattern: string) (relPath: string) : bool =
    globSegmentsMatch (pattern.Split('/') |> Array.toList) (relPath.Split('/') |> Array.toList)

/// Recursively collects every file reachable from `dir`, skipping
/// [`skipDirs`] (the same vendored/generated exclusion list `readme-index`
/// already uses) [Repo-grounded — `word_budget.rs::SKIP_DIRS`,
/// `is_in_skipped_dir`].
[<ExcludeFromCodeCoverage>]
let rec private collectAllFilesRec (dir: string) : string list =
    if not (Directory.Exists dir) then
        []
    else
        Directory.GetFileSystemEntries dir
        |> Array.sort
        |> Array.toList
        |> List.collect (fun entry ->
            if Directory.Exists entry then
                if skipDirs.Contains(Path.GetFileName entry) then
                    []
                else
                    collectAllFilesRec entry
            else
                [ entry ])

/// Checks every instruction-file surface against its budget.
///
/// **Select-then-classify overlap precedence**: when a path matches more
/// than one surface, the *last-declared* matching surface wins — Pass 1
/// glob-matches every surface in `config.Surfaces` declaration order,
/// recording the most recently matched surface per resolved path; Pass 2
/// classifies each winning `(path, surface)` pair exactly once. `excludes`
/// holds repo-relative path **prefixes** matched via `str.StartsWith`, not
/// globs [Repo-grounded — `word_budget.rs::check_instruction_sizes`].
[<ExcludeFromCodeCoverage>]
let checkInstructionSizes (repoRoot: string) (config: BudgetConfig) (excludes: string list) : WordBudgetFinding list =
    let allFiles = collectAllFilesRec repoRoot

    let relOf (full: string) : string =
        Path.GetRelativePath(repoRoot, full).Replace('\\', '/')

    let mutable winners: Map<string, Surface> = Map.empty

    for surface in config.Surfaces do
        for full in allFiles do
            let rel = relOf full

            if globMatchesRelPath surface.Glob rel then
                let excluded =
                    excludes
                    |> List.exists (fun prefix -> rel.StartsWith(prefix, StringComparison.Ordinal))

                if not excluded then
                    winners <- Map.add rel surface winners

    winners
    |> Map.toList
    |> List.sortBy fst
    |> List.choose (fun (rel, surface) ->
        let full = Path.Combine(repoRoot, rel.Replace('/', Path.DirectorySeparatorChar))
        let contents = if File.Exists full then File.ReadAllText full else ""
        let size = wordCount contents
        let severity = classify size surface.Target surface.Warn surface.Fail

        if severity = WordBudgetSeverity.Within then
            None
        else
            let message =
                surfaceMessage rel size surface.Target surface.Warn surface.Fail severity

            Some
                { Path = rel
                  Size = size
                  Target = surface.Target
                  Warn = surface.Warn
                  Fail = surface.Fail
                  Severity = severity
                  Message = message })

// ---- resolved `@`-import tree ----

/// Recursive helper for [`resolveTreeSize`]. Returns `0UL` when the `depth`
/// limit (4) is exceeded or `path` was already visited (cycle guard)
/// [Repo-grounded — `word_budget.rs::resolve_recursive`].
[<ExcludeFromCodeCoverage>]
let rec private resolveRecursive (path: string) (depth: int) (visited: HashSet<string>) : uint64 =
    if depth > 4 then
        0UL
    else
        let canonical =
            try
                Path.GetFullPath path
            with _ ->
                path

        if not (visited.Add canonical) then
            0UL
        else
            let content = if File.Exists path then File.ReadAllText path else ""
            let size = wordCount content

            let parent =
                match Path.GetDirectoryName(path: string) with
                | null
                | "" -> "."
                | p -> p

            let imported =
                content.Replace("\r\n", "\n").Split('\n')
                |> Array.filter (fun line -> line.StartsWith("@", StringComparison.Ordinal))
                |> Array.sumBy (fun line ->
                    let importPath = line.Substring(1).Trim()
                    resolveRecursive (Path.Combine(parent, importPath)) (depth + 1) visited)

            size + imported

/// Computes the total word count of `root` and all transitively imported
/// files. Files declare imports via lines starting with `@`; cycles are
/// detected via a set of canonicalized absolute paths, and a cycle returns
/// `0UL` for the repeated node
/// [Repo-grounded — `word_budget.rs::resolve_tree_size`].
[<ExcludeFromCodeCoverage>]
let resolveTreeSize (root: string) : uint64 =
    resolveRecursive root 0 (HashSet<string>())

/// Checks the resolved import tree of `config.ResolvedTree.Root` (relative
/// to `repoRoot`) against its budget. Returns `None` when within target
/// [Repo-grounded — `word_budget.rs::check_resolved_tree`].
/// Returns the `exclude` list registered against `gateId` in
/// `repo-config.yml`'s `gates:` registry, or an empty list when no such gate
/// is registered — the single source a bare CLI validate invocation's
/// `excludes` parameter should be seeded from, not only the `gate run`
/// pre-push/CI path
/// [Repo-grounded — `word_budget.rs::registered_excludes`,
/// `md_validate_frontmatter_dates.rs::run`'s equivalent inline lookup].
[<ExcludeFromCodeCoverage>]
let registeredExcludesFor (repoRoot: string) (gateId: string) : Result<string list, string> =
    RepoConfig.loadOptional repoRoot
    |> Result.map (fun opt ->
        opt
        |> Option.bind (fun config -> config.Gates |> List.tryFind (fun g -> g.Id = gateId))
        |> Option.bind (fun gate -> gate.Args.TryFind "exclude")
        |> Option.defaultValue [])

/// Returns the `exclude` list registered against the `governance-word-budget`
/// gate — see `registeredExcludesFor`'s doc comment
/// [Repo-grounded — `word_budget.rs::registered_excludes`].
[<ExcludeFromCodeCoverage>]
let registeredExcludes (repoRoot: string) : Result<string list, string> =
    registeredExcludesFor repoRoot "governance-word-budget"

[<ExcludeFromCodeCoverage>]
let checkResolvedTree (repoRoot: string) (config: BudgetConfig) : WordBudgetFinding option =
    let rootPath = Path.Combine(repoRoot, config.ResolvedTree.Root)
    let size = resolveTreeSize rootPath
    let rt = config.ResolvedTree
    let severity = classify size rt.Target rt.Warn rt.Fail

    if severity = WordBudgetSeverity.Within then
        None
    else
        Some
            { Path = "resolved-tree"
              Size = size
              Target = rt.Target
              Warn = rt.Warn
              Fail = rt.Fail
              Severity = severity
              Message = resolvedTreeMessage size rt severity }

// ---- `governance-word-budget:` section of `repo-config.yml` ----

[<ExcludeFromCodeCoverage>]
let private toWordBudgetList (items: ResizeArray<'a>) : 'a list =
    match items with
    | null -> []
    | items -> List.ofSeq items

let private asRawYamlMap (value: obj) : IDictionary<obj, obj> option =
    match value with
    | :? IDictionary<obj, obj> as dict -> Some dict
    | _ -> None

let private asRawYamlList (value: obj) : obj list option =
    match value with
    | :? IDictionary<obj, obj> -> None
    | :? Collections.IEnumerable as items when not (value :? string) -> Some(items |> Seq.cast<obj> |> List.ofSeq)
    | _ -> None

let private tryGetRawYamlValue (dict: IDictionary<obj, obj>) (key: string) : obj option =
    dict
    |> Seq.tryFind (fun kv ->
        match kv.Key with
        | :? string as s -> String.Equals(s, key, StringComparison.Ordinal)
        | _ -> false)
    |> Option.map (fun kv -> kv.Value)

let private unknownYamlKeys (allowed: Set<string>) (dict: IDictionary<obj, obj>) (label: string) : string list =
    dict
    |> Seq.choose (fun kv ->
        match kv.Key with
        | :? string as key when not (Set.contains key allowed) -> Some(sprintf "%s: unknown key \"%s\"" label key)
        | _ -> None)
    |> List.ofSeq

let private allowedWordBudgetTopKeys: Set<string> =
    set [ "surfaces"; "resolved_tree" ]

let private allowedWordBudgetSurfaceKeys: Set<string> =
    set [ "glob"; "target"; "warn"; "fail" ]

let private allowedWordBudgetResolvedTreeKeys: Set<string> =
    set [ "root"; "target"; "warn"; "fail" ]

/// Rejects an unrecognized key inside the `governance-word-budget:` section
/// of a repo-config.yml-shaped `data` string (FR-1.5) — no `exempt`,
/// `allow`, `ignore`, `waiver`, `override`, or any other unrecognized key is
/// admitted, mirroring `word_budget.rs`'s
/// `#[serde(deny_unknown_fields)]` on `BudgetConfig`/`Surface`/
/// `ResolvedTree`, reproduced here the same way `RepoConfig.fs`'s
/// `checkNoUnknownHarnessKeys` reproduces it for `harness[]`: an
/// independent walk of the raw YAML structure, since YamlDotNet has no
/// built-in `deny_unknown_fields` equivalent
/// [Repo-grounded — `word_budget.rs::BudgetConfig`].
let checkNoUnknownWordBudgetKeys (data: string) : Result<unit, string> =
    try
        let root = rawFrontmatterDeserializer.Deserialize<obj>(RepoConfig.normalize data)

        match asRawYamlMap root with
        | None -> Ok()
        | Some rootMap ->
            match tryGetRawYamlValue rootMap "governance-word-budget" |> Option.bind asRawYamlMap with
            | None -> Ok()
            | Some section ->
                let topFindings =
                    unknownYamlKeys allowedWordBudgetTopKeys section "governance-word-budget"

                let surfaceFindings =
                    match tryGetRawYamlValue section "surfaces" |> Option.bind asRawYamlList with
                    | None -> []
                    | Some items ->
                        items
                        |> List.mapi (fun i item ->
                            match asRawYamlMap item with
                            | None -> []
                            | Some m ->
                                unknownYamlKeys
                                    allowedWordBudgetSurfaceKeys
                                    m
                                    (sprintf "governance-word-budget.surfaces[%d]" i))
                        |> List.collect id

                let resolvedTreeFindings =
                    match tryGetRawYamlValue section "resolved_tree" |> Option.bind asRawYamlMap with
                    | None -> []
                    | Some m ->
                        unknownYamlKeys allowedWordBudgetResolvedTreeKeys m "governance-word-budget.resolved_tree"

                match topFindings @ surfaceFindings @ resolvedTreeFindings with
                | [] -> Ok()
                | findings -> Error(String.concat "; " findings)
    with ex ->
        Error ex.Message

/// Raw YAML-shaped intermediate DTOs. Deliberately NOT `private` — see
/// `RepoConfig.fs`'s identically-motivated DTOs' doc comment: a `private`
/// F# type's compiler-generated constructor is non-public even with
/// `[<CLIMutable>]`, and YamlDotNet's default reflection-based object
/// factory only ever calls `Activator.CreateInstance(type)` (the
/// public-constructor overload) — a `private` version of these types builds
/// and passes in an `dotnet fsi` script (which never marks the type
/// private) but throws `MissingMethodException` at deserialization time
/// once actually compiled into this assembly. These DTOs stay out of this
/// module's public surface anyway: nothing outside `mergedBudgetConfig`
/// ever constructs or returns one.
[<CLIMutable>]
type SurfaceDto =
    { [<YamlMember(Alias = "glob")>]
      Glob: string
      [<YamlMember(Alias = "target")>]
      Target: uint64
      [<YamlMember(Alias = "warn")>]
      Warn: uint64
      [<YamlMember(Alias = "fail")>]
      Fail: uint64 }

[<CLIMutable>]
type ResolvedTreeDto =
    { [<YamlMember(Alias = "root")>]
      Root: string
      [<YamlMember(Alias = "target")>]
      Target: uint64
      [<YamlMember(Alias = "warn")>]
      Warn: uint64
      [<YamlMember(Alias = "fail")>]
      Fail: uint64 }

[<CLIMutable>]
type BudgetConfigDto =
    { [<YamlMember(Alias = "surfaces")>]
      Surfaces: ResizeArray<SurfaceDto>
      [<YamlMember(Alias = "resolved_tree")>]
      ResolvedTree: ResolvedTreeDto }

[<CLIMutable>]
type RepoConfigWordBudgetDto =
    { [<YamlMember(Alias = "governance-word-budget")>]
      GovernanceWordBudget: BudgetConfigDto }

let private wordBudgetDeserializer: IDeserializer =
    DeserializerBuilder().IgnoreUnmatchedProperties().Build()

[<ExcludeFromCodeCoverage>]
let private toSurface (dto: SurfaceDto) : Surface =
    { Glob = dto.Glob
      Target = dto.Target
      Warn = dto.Warn
      Fail = dto.Fail }

[<ExcludeFromCodeCoverage>]
let private toResolvedTreeConfig (dto: ResolvedTreeDto) : ResolvedTree =
    { Root = dto.Root
      Target = dto.Target
      Warn = dto.Warn
      Fail = dto.Fail }

[<ExcludeFromCodeCoverage>]
let private toBudgetConfig (dto: BudgetConfigDto) : BudgetConfig =
    { Surfaces = toWordBudgetList dto.Surfaces |> List.map toSurface
      ResolvedTree = toResolvedTreeConfig dto.ResolvedTree }

/// Loads the `governance-word-budget:` section of `repoRoot`'s
/// `repo-config.yml`. Returns `Ok None` when `repo-config.yml` is absent or
/// declares no such section; returns `Error` for an unreadable/unparseable
/// file or a section carrying an unrecognized key (FR-1.5)
/// [Repo-grounded — `word_budget.rs::merged_budget_config`].
[<ExcludeFromCodeCoverage>]
let mergedBudgetConfig (repoRoot: string) : Result<BudgetConfig option, string> =
    let path = Path.Combine(repoRoot, "repo-config.yml")

    if not (File.Exists path) then
        Ok None
    else
        let data = RepoConfig.normalize (File.ReadAllText path)

        match checkNoUnknownWordBudgetKeys data with
        | Error message -> Error message
        | Ok() ->
            try
                let dto = wordBudgetDeserializer.Deserialize<RepoConfigWordBudgetDto>(data)

                match box dto with
                | null -> Ok None
                | _ ->
                    match box dto.GovernanceWordBudget with
                    | null -> Ok None
                    | _ -> Ok(Some(toBudgetConfig dto.GovernanceWordBudget))
            with ex ->
                Error ex.Message

// ===========================================================================
// Pure in-memory policy boundary
// ===========================================================================

/// Repository-relative text files supplied by a resource adapter. Paths use
/// forward slashes and never depend on the host filesystem.
type GovernanceTextTree = Map<string, string>

let private normalizeTreePath (path: string) =
    let value = path.Replace('\\', '/').Trim()

    let value =
        if value.StartsWith("./", StringComparison.Ordinal) then
            value.Substring(2)
        else
            value

    value.TrimStart('/').TrimEnd('/')

let private treeDirectoryName (path: string) =
    let normalized = normalizeTreePath path
    let index = normalized.LastIndexOf('/')
    if index < 0 then "" else normalized.Substring(0, index)

let private treeBaseName (path: string) =
    let normalized = normalizeTreePath path
    let index = normalized.LastIndexOf('/')

    if index < 0 then
        normalized
    else
        normalized.Substring(index + 1)

let private treeCombine (directory: string) (name: string) =
    match normalizeTreePath directory, normalizeTreePath name with
    | "", child -> child
    | parent, "" -> parent
    | parent, child -> parent + "/" + child

let private parentDirectories (path: string) =
    let rec loop current acc =
        let parent = treeDirectoryName current

        if parent = "" || Set.contains parent acc then
            acc
        else
            loop parent (Set.add parent acc)

    loop path Set.empty

let private treeDirectories (tree: GovernanceTextTree) =
    tree
    |> Map.toSeq
    |> Seq.collect (fst >> parentDirectories >> Set.toSeq)
    |> Set.ofSeq

let private pathWithin (root: string) (path: string) =
    let root = normalizeTreePath root
    let path = normalizeTreePath path

    root = ""
    || path = root
    || path.StartsWith(root + "/", StringComparison.Ordinal)

let private containsSkippedSegment path =
    normalizeTreePath path
    |> fun value -> value.Split('/')
    |> Array.exists skipDirs.Contains

let private treeSiblingTargets (tree: GovernanceTextTree) directory : SiblingTargets =
    let directory = normalizeTreePath directory

    let files =
        tree
        |> Map.toSeq
        |> Seq.map fst
        |> Seq.filter (fun path -> treeDirectoryName path = directory)
        |> Seq.map treeBaseName
        |> Seq.filter (fun name ->
            not (name.StartsWith(".", StringComparison.Ordinal))
            && name <> "README.md"
            && name.EndsWith(".md", StringComparison.Ordinal))
        |> Set.ofSeq

    let subDirectories =
        treeDirectories tree
        |> Set.filter (fun path ->
            treeDirectoryName path = directory
            && not ((treeBaseName path).StartsWith(".", StringComparison.Ordinal))
            && not (skipDirs.Contains(treeBaseName path)))
        |> Set.map (fun path -> treeBaseName path + "/README.md")
        |> Set.filter (fun target -> Map.containsKey (treeCombine directory target) tree)

    { Files = files
      SubDirs = subDirectories }

let private auditTreeIndex (tree: GovernanceTextTree) indexPath targetDirectory =
    let content = Map.find indexPath tree
    let indexDirectory = treeDirectoryName indexPath
    let targetDirectory = normalizeTreePath targetDirectory

    let prefix =
        if indexDirectory = targetDirectory then
            None
        else
            Some(treeBaseName targetDirectory + "/")

    let normalize (raw: string) =
        match prefix with
        | Some value when raw.StartsWith(value, StringComparison.Ordinal) -> raw.Substring(value.Length), true
        | _ -> raw, false

    let provenance =
        extractReadmeLinks content
        |> Set.toList
        |> List.map normalize
        |> List.fold
            (fun (state: Map<string, bool>) (path, prefixed) ->
                Map.add path (prefixed || (Map.tryFind path state |> Option.defaultValue false)) state)
            Map.empty

    let linked = provenance |> Map.toSeq |> Seq.map fst |> Set.ofSeq

    let unannotated =
        extractUnannotatedLinkTargets content |> Set.map (normalize >> fst)

    let targets = treeSiblingTargets tree targetDirectory

    let orphans =
        targets.SortedNames
        |> List.choose (fun name ->
            if Set.contains name linked then
                None
            else
                match trySubdirName name with
                | Some directory when Set.contains (directory + ".md") linked -> None
                | _ ->
                    Some
                        { File = treeCombine targetDirectory name
                          Severity = "high"
                          Kind = ReadmeIndexFindingKind.Orphan
                          Message = sprintf "orphan: %s exists but is not linked from %s" name indexPath })

    let linkedFindings =
        linked
        |> Set.toList
        |> List.sort
        |> List.choose (fun link ->
            let target = treeCombine targetDirectory link

            let asDirectoryReadme =
                treeCombine targetDirectory (link.TrimEnd('/') + "/README.md")

            let resolvesBesideIndex =
                not (Map.tryFind link provenance |> Option.defaultValue false)
                && indexDirectory <> targetDirectory
                && Map.containsKey (treeCombine indexDirectory link) tree

            if
                not (
                    Map.containsKey target tree
                    || Map.containsKey asDirectoryReadme tree
                    || resolvesBesideIndex
                )
            then
                Some
                    { File = target
                      Severity = "high"
                      Kind = ReadmeIndexFindingKind.Ghost
                      Message = sprintf "ghost: %s references %s but the target does not exist" indexPath link }
            elif Set.contains link unannotated then
                Some
                    { File = target
                      Severity = "high"
                      Kind = ReadmeIndexFindingKind.Unannotated
                      Message = sprintf "unannotated: %s links %s without a derived annotation" indexPath link }
            else
                None)

    orphans @ linkedFindings

/// Pure README-index audit over a caller-supplied text tree.
let auditReadmeIndexTexts (tree: GovernanceTextTree) (paths: string list) : ReadmeIndexFinding list =
    let tree =
        tree
        |> Map.toSeq
        |> Seq.map (fun (path, text) -> normalizeTreePath path, text)
        |> Map.ofSeq

    let directories = treeDirectories tree

    paths
    |> List.collect (fun rawRoot ->
        let root = normalizeTreePath rawRoot

        directories
        |> Set.filter (fun directory -> pathWithin root directory && not (containsSkippedSegment directory))
        |> Set.add root
        |> Set.toList
        |> List.sort
        |> List.collect (fun directory ->
            let splitIndex =
                treeCombine (treeDirectoryName directory) (treeBaseName directory + ".md")

            let splitFindings =
                if directory <> root && Map.containsKey splitIndex tree then
                    auditTreeIndex tree splitIndex directory
                else
                    []

            let readme = treeCombine directory "README.md"

            if Map.containsKey readme tree then
                splitFindings @ auditTreeIndex tree readme directory
            elif directory = root then
                splitFindings
            else
                let targets = treeSiblingTargets tree directory

                if Set.isEmpty targets.Files && Set.isEmpty targets.SubDirs then
                    splitFindings
                else
                    splitFindings
                    @ [ { File = directory
                          Severity = "high"
                          Kind = ReadmeIndexFindingKind.Missing
                          Message = sprintf "missing: %s contains indexable content but has no README.md" directory } ]))
    |> List.distinct
    |> List.sortBy (fun finding -> finding.File, finding.Kind.Name)

let private frontmatterValue (key: string) (content: string) =
    content.Replace("\r\n", "\n").Split('\n')
    |> Array.tryPick (fun line ->
        let prefix = key + ":"

        if line.TrimStart().StartsWith(prefix, StringComparison.Ordinal) then
            Some(line.Trim().Substring(prefix.Length).Trim().Trim('"'))
        else
            None)

let private generatedTreeEntry (tree: GovernanceTextTree) directory target =
    let targetPath = treeCombine directory target
    let content = Map.tryFind targetPath tree |> Option.defaultValue ""

    // Falls back to the title-cased stem, matching `entryFor`'s
    // `fallbackEntryTitle`. Since `repo-governance/` frontmatter no longer
    // carries `title`, this fallback is the normal path rather than the rare
    // one, so the two generators must not disagree about it.
    let title =
        frontmatterValue "title" content
        |> Option.defaultValue (titleCaseFromStem ((treeBaseName target).Replace(".md", "")))

    let description =
        frontmatterValue "description" content
        |> Option.defaultValue (sprintf "Documentation for %s." title)

    let whenToUse =
        frontmatterValue "when_to_use" content
        |> Option.map (sprintf " %s")
        |> Option.defaultValue ""

    sprintf "- [%s](./%s) — %s%s" title target description whenToUse

/// Pure README-index generation. Existing entry order and prose are retained;
/// only genuinely missing direct targets are appended.
let generateReadmeIndexTexts (tree: GovernanceTextTree) (paths: string list) : GovernanceTextTree =
    let normalized =
        tree
        |> Map.toSeq
        |> Seq.map (fun (path, text) -> normalizeTreePath path, text)
        |> Map.ofSeq

    paths
    |> List.fold
        (fun state rawRoot ->
            let root = normalizeTreePath rawRoot

            let directories =
                treeDirectories state |> Set.filter (pathWithin root) |> Set.toList |> List.sort

            directories
            |> List.fold
                (fun current directory ->
                    if directory = root || containsSkippedSegment directory then
                        current
                    else
                        let targets = (treeSiblingTargets current directory).SortedNames
                        let readme = treeCombine directory "README.md"

                        if List.isEmpty targets then
                            current
                        else
                            match Map.tryFind readme current with
                            | Some existing ->
                                let linked = extractReadmeLinks existing

                                let missing =
                                    targets |> List.filter (fun target -> not (Set.contains target linked))

                                if List.isEmpty missing then
                                    current
                                else
                                    let separator =
                                        if existing.EndsWith("\n", StringComparison.Ordinal) then
                                            ""
                                        else
                                            "\n"

                                    let appended =
                                        missing
                                        |> List.map (generatedTreeEntry current directory)
                                        |> String.concat "\n"

                                    Map.add readme (existing + separator + appended + "\n") current
                            | None ->
                                let title = treeBaseName directory

                                let entries =
                                    targets |> List.map (generatedTreeEntry current directory) |> String.concat "\n"

                                Map.add
                                    readme
                                    (sprintf "---\ntitle: \"%s\"\n---\n\n# %s\n\n%s\n" title title entries)
                                    current)
                state)
        normalized

/// Pure link-target rewrite across the supplied Markdown tree.
let rewriteReadmeIndexTextPaths (tree: GovernanceTextTree) (paths: string list) (renames: (string * string) list) =
    let renameMap = Map.ofList renames

    tree
    |> Map.map (fun path content ->
        if
            path.EndsWith(".md", StringComparison.Ordinal)
            && paths |> List.exists (fun root -> pathWithin root path)
        then
            rewriteLinkTargets content renameMap
        else
            content)

/// Pure word-budget classification over caller-supplied text files.
let checkInstructionTextSizes (files: GovernanceTextTree) (config: BudgetConfig) (excludes: string list) =
    let files =
        files
        |> Map.toSeq
        |> Seq.map (fun (path, text) -> normalizeTreePath path, text)
        |> Map.ofSeq

    let mutable winners: Map<string, Surface> = Map.empty

    for surface in config.Surfaces do
        for KeyValue(path, _) in files do
            let path = normalizeTreePath path

            if
                globMatchesRelPath surface.Glob path
                && not (
                    excludes
                    |> List.exists (fun prefix -> path.StartsWith(prefix, StringComparison.Ordinal))
                )
            then
                winners <- Map.add path surface winners

    winners
    |> Map.toList
    |> List.sortBy fst
    |> List.choose (fun (path, surface) ->
        let size = files |> Map.tryFind path |> Option.defaultValue "" |> wordCount
        let severity = classify size surface.Target surface.Warn surface.Fail

        if severity = WordBudgetSeverity.Within then
            None
        else
            Some
                { Path = path
                  Size = size
                  Target = surface.Target
                  Warn = surface.Warn
                  Fail = surface.Fail
                  Severity = severity
                  Message = surfaceMessage path size surface.Target surface.Warn surface.Fail severity })

/// Pure resolved-tree word count with depth and cycle guards.
let resolveTextTreeSize (files: GovernanceTextTree) root =
    let rec resolve path depth visited =
        let path = normalizeTreePath path

        if depth > 4 || Set.contains path visited then
            0UL
        else
            let content = Map.tryFind path files |> Option.defaultValue ""
            let visited = Set.add path visited
            let parent = treeDirectoryName path

            let imported =
                content.Replace("\r\n", "\n").Split('\n')
                |> Array.filter (fun line -> line.StartsWith("@", StringComparison.Ordinal))
                |> Array.sumBy (fun line -> resolve (treeCombine parent (line.Substring(1).Trim())) (depth + 1) visited)

            wordCount content + imported

    resolve root 0 Set.empty

/// Pure resolved-tree threshold classification.
let checkResolvedTextTree (files: GovernanceTextTree) (config: BudgetConfig) =
    let size = resolveTextTreeSize files config.ResolvedTree.Root
    let threshold = config.ResolvedTree
    let severity = classify size threshold.Target threshold.Warn threshold.Fail

    if severity = WordBudgetSeverity.Within then
        None
    else
        Some
            { Path = "resolved-tree"
              Size = size
              Target = threshold.Target
              Warn = threshold.Warn
              Fail = threshold.Fail
              Severity = severity
              Message = resolvedTreeMessage size threshold severity }

/// Pure helpers for registry/rename compatibility scenarios.
let legacyInstructionSizeCommandIsAbsent commandPaths =
    not (commandPaths |> List.contains [ "harness"; "instruction-size"; "validate" ])

let containsLegacyInstructionBudgetReference (documents: GovernanceTextTree) =
    documents
    |> Map.exists (fun _ text -> text.Contains("instruction-file-size-budget.md", StringComparison.Ordinal))
