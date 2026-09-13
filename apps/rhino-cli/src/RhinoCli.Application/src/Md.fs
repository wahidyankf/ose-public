/// Port of the Rust `md` namespace's `docs validate-frontmatter` and
/// `docs validate-heading-hierarchy` validators
/// [Repo-grounded — `apps/rhino-cli/src/application/docs/frontmatter.rs`,
/// `apps/rhino-cli/src/commands/md_validate_frontmatter.rs`,
/// `apps/rhino-cli/src/application/docs/heading_hierarchy.rs`,
/// `apps/rhino-cli/src/commands/md_validate_heading_hierarchy.rs`] for
/// `specs/apps/rhino/cli/behaviours/md/docs-validate-frontmatter.feature`'s
/// 11 scenarios and
/// `specs/apps/rhino/cli/behaviours/md/docs-validate-heading-hierarchy.feature`'s
/// 12 scenarios.
///
/// Scope: this PR (Wave D PR2) additionally ports the heading-hierarchy
/// validator — the `md` namespace's remaining three feature files (links,
/// mermaid, naming, audit) land in later Wave D PRs against this same file.
/// Findings reuse the shared `RhinoCli.Domain.Types.Finding` record
/// (`Severity`/`Message`/`Path`) rather than a bespoke `DocsHeadingFinding`
/// type, matching `Convention.fs`'s established "shared Finding over bespoke
/// per-validator types" precedent and this file's own frontmatter-validator
/// precedent — the Rust source's separate `kind` and `line` fields are
/// folded into each finding's `Message` text instead of becoming extra
/// fields on the shared record, since every Rust `kind` value is already
/// reproduced verbatim inside its finding's message text and no scenario
/// here asserts on an exact line number.
///
/// `md` is not yet listed in `FSHARP_NAMESPACES` (that flip is later,
/// separate Wave D integration work), so — matching `TestCoverage.fs`'s
/// `validate`-before-the-Wave-C-flip precedent — both validators are called
/// directly by their step definitions with a path list (or repo root) built
/// by hand, not parsed from CLI argv. No text/JSON/Markdown rendering lives
/// in this file for the same reason `reporter.rs`'s formatting stays out of
/// `Doctor.fs` until a scenario needs it: none of these feature files'
/// scenarios assert on rendered output, only on the structured `Finding`
/// list.
///
/// Wave D PR4 additionally ports the `docs validate-mermaid` validator
/// [Repo-grounded — `apps/rhino-cli/src/domain/mermaid/{types,diagram,
/// flowchart,graph,state,validator}.rs`,
/// `apps/rhino-cli/src/infrastructure/mermaid/reporter.rs`,
/// `apps/rhino-cli/src/commands/md_validate_mermaid.rs`] for
/// `specs/apps/rhino/cli/behaviours/md/docs-validate-mermaid.feature`'s
/// 39 scenarios. Unlike the three validators above, several of this
/// feature's scenarios assert on rendered JSON/Markdown/text output and on
/// parser internals (edge counts, rank depth) directly, so this section
/// introduces real domain types (`MermaidViolation`/`MermaidWarning`/
/// `MermaidValidationResult`) mirroring the Rust source's own
/// `types.rs`/`validator.rs` split instead of folding findings into the
/// shared `Finding` record — the JSON scenario's structured field
/// assertions (`kind`/`filePath`/`blockIndex`/`nodeId`) have no equivalent
/// on `Finding`, and the Markdown-table scenario needs a `Kind`/`Severity`
/// split `Finding` cannot express. `--staged-only`/`--changed-only` take
/// their file lists as explicit `string list option` parameters — the same
/// pattern `LinkScanOptions.StagedFiles` established above — rather than
/// shelling out to git, and this section drops the Rust source's
/// empty-changed-list-falls-back-to-a-full-repo-scan quirk (no scenario
/// here exercises that fallback path, and reproducing it would make the
/// `--changed-only` scenario's fixture ambiguous between "nothing changed"
/// and "scan everything").
///
/// Wave D PR11 ports the git pre-commit hook shim's five resequenced
/// `git-pre-commit.feature` scenarios [Repo-grounded —
/// `apps/rhino-cli/tests/git_hooks.rs`'s markdown-validator scenarios],
/// **integration**-tier (unlike every scenario above): the fixture stages
/// real files in a throwaway git repo and asserts on rendered stdout/stderr
/// text, not on the structured `Finding` list alone, so line 22-23's "no
/// scenario here asserts on an exact line number" no longer holds for the
/// links validator specifically — its broken-file `Finding.Message` now
/// leads with `"Line %d: "` so the CLI-facing caller's rendered output
/// surfaces it. This section also adds
/// `validateDocsHeadingHierarchyForPaths`, the positional-path counterpart
/// to `validateDocsHeadingHierarchyAllowlisted` that
/// `md_validate_heading_hierarchy.rs::run` uses when lint-staged passes
/// explicit file arguments instead of scanning the whole repo. Per this
/// file's own "no rendering lives in this file" precedent above, the
/// integration test's step definitions
/// (`tests/integration/Steps/PreCommitHookSteps.fs`) compose these
/// functions' `Finding list`/`MermaidValidationResult` outputs into
/// printable text themselves — using the shared
/// `RhinoCli.Domain.Finding.hasBlocking`/`formatText` helpers folded out of
/// this file's own `findingsOutcome` — the same "call the internal function
/// directly, format nothing here" split `DoctorSteps.fs` already
/// establishes for CLI-adjacent testing without a compiled binary.
module RhinoCli.Application.Md

open System
open System.Collections.Generic
open System.IO
open System.Text.Encodings.Web
open System.Text.Json
open System.Text.Json.Nodes
open System.Text.RegularExpressions
open YamlDotNet.Serialization
open RhinoCli.Domain.Types

/// Path fragment that identifies software-engineering explanation documents
/// [Repo-grounded — `frontmatter.rs::SOFTWARE_DOC_PREFIX`].
let private softwareDocPrefix = "docs/explanation/software-engineering/"

/// Path fragments that identify governance documents. The whole
/// `repo-governance/` tree is covered, not four named sub-trees: `glossary/`,
/// `vision/`, `repository-governance-architecture/`, and the tree's own root
/// files bind exactly like the rest of it, and classifying them as
/// `UnknownArea` meant they were the only governance files never validated
/// [Repo-grounded — `frontmatter.rs::GOVERNANCE_DOC_PREFIXES`].
///
/// Gherkin (binds) — "Governance subtree outside the four sub-trees is still
/// validated" —
/// `specs/apps/rhino/cli/behaviours/md/docs-validate-frontmatter.feature`.
let private governanceDocPrefixes: string list = [ "repo-governance/" ]

/// The allowed values for the `category` frontmatter field (Diátaxis
/// framework) [Repo-grounded — `frontmatter.rs::VALID_CATEGORIES`].
let private validCategories: Set<string> =
    Set.ofList [ "tutorial"; "how-to"; "reference"; "explanation" ]

/// Directory names that are skipped during recursive walks
/// [Repo-grounded — `frontmatter.rs::SKIP_DIRS`].
let private skipDirs: Set<string> =
    Set.ofList [ "node_modules"; ".git"; ".next"; "dist"; "build"; "target" ]

/// Directory names that are skipped during the heading-hierarchy validator's
/// recursive walks — the Rust source keeps this as a second, separate
/// constant (`frontmatter.rs::SKIP_DIRS` above vs. `naming.rs::SKIP_DIRS`
/// here) rather than a single shared list, so this port mirrors that split
/// instead of merging them. A superset of `skipDirs` above: the same six
/// names, plus `generated-reports`
/// [Repo-grounded — `heading_hierarchy.rs`'s `use super::naming::SKIP_DIRS`,
/// `naming.rs::SKIP_DIRS`].
let private namingSkipDirs: Set<string> =
    Set.ofList
        [ "node_modules"
          ".git"
          ".next"
          "dist"
          "build"
          "target"
          "generated-reports" ]

/// Classifies a markdown file as belonging to a known documentation area
/// [Repo-grounded — `frontmatter.rs::DocArea`].
type private DocArea =
    /// The file is not in any recognised documentation area.
    | UnknownArea
    /// The file is in `docs/explanation/software-engineering/`.
    | SoftwareArea
    /// The file is under one of the `repo-governance/` sub-trees.
    | GovernanceArea

/// Determines which documentation area `path` belongs to
/// [Repo-grounded — `frontmatter.rs::classify_doc_area`]. A prefix counts only
/// where a path segment starts, so a folder whose name merely ends in
/// `repo-governance` (a plan record named after the rename, say) is not the
/// governance tree.
let private classifyDocArea (path: string) : DocArea =
    let slashed = path.Replace('\\', '/')

    let isUnder (prefix: string) =
        slashed.StartsWith(prefix, StringComparison.Ordinal)
        || slashed.Contains("/" + prefix, StringComparison.Ordinal)

    if isUnder softwareDocPrefix then
        SoftwareArea
    elif governanceDocPrefixes |> List.exists isUnder then
        GovernanceArea
    else
        UnknownArea

/// Extracts the YAML content between the first pair of `---` fences.
/// Returns `None` when `content` does not begin with `---` or has no closing
/// fence [Repo-grounded — `frontmatter.rs::extract_frontmatter`].
let extractFrontmatter (content: string) : string option =
    let lines = content.Split('\n')

    if lines.Length = 0 || lines.[0].Trim() <> "---" then
        None
    else
        [ 1 .. lines.Length - 1 ]
        |> List.tryFind (fun i -> lines.[i].Trim() = "---")
        |> Option.map (fun i -> String.Join("\n", lines.[1 .. i - 1]))

/// Deserializes raw YAML into `obj` without a naming convention — every
/// lookup below matches literal frontmatter keys (`title`, `when_to_use`, …)
/// by exact string equality rather than through a strongly typed DTO, so no
/// naming-convention translation is needed [Repo-grounded — mirrors
/// `RepoConfig.fs`'s `checkNoUnknownHarnessKeys` raw-YAML-walk technique].
let private deserializer: IDeserializer = DeserializerBuilder().Build()

let private asRawMap (value: obj) : IDictionary<obj, obj> option =
    match value with
    | :? IDictionary<obj, obj> as dict -> Some dict
    | _ -> None

let private asRawList (value: obj) : obj list option =
    match value with
    | :? IDictionary<obj, obj> -> None
    | :? Collections.IEnumerable as items when not (value :? string) -> Some(items |> Seq.cast<obj> |> List.ofSeq)
    | _ -> None

let private tryGetRawValue (dict: IDictionary<obj, obj>) (key: string) : obj option =
    dict
    |> Seq.tryFind (fun kv ->
        match kv.Key with
        | :? string as candidate -> String.Equals(candidate, key, StringComparison.Ordinal)
        | _ -> false)
    |> Option.map (fun kv -> kv.Value)

/// Coerces a raw YAML value to a `String` for display and comparison
/// purposes. `None`/`null` map to an empty string
/// [Repo-grounded — `frontmatter.rs::string_value`].
let private stringValue (value: obj option) : string =
    match value with
    | None -> ""
    | Some null -> ""
    | Some(:? string as s) -> s
    | Some(:? bool as b) -> if b then "true" else "false"
    | Some other -> other.ToString()

/// Returns `true` when `fm[key]` is a non-empty, non-whitespace-only string
/// [Repo-grounded — `frontmatter.rs::has_non_empty_string`].
let private hasNonEmptyString (fm: IDictionary<obj, obj>) (key: string) : bool =
    (stringValue (tryGetRawValue fm key)).Trim() <> ""

/// Returns `true` when `fm[key]` is a YAML sequence with at least one element
/// [Repo-grounded — `frontmatter.rs::has_non_empty_list`].
let private hasNonEmptyList (fm: IDictionary<obj, obj>) (key: string) : bool =
    match tryGetRawValue fm key |> Option.bind asRawList with
    | Some items -> not (List.isEmpty items)
    | None -> false

/// Constructs a `Blocking`-severity finding
/// [Repo-grounded — `frontmatter.rs::mk_fail`].
let private mkFail (path: string) (message: string) : Finding =
    { Severity = Severity.Blocking
      Message = message
      Path = Some path }

/// Constructs an `Advisory`-severity finding — used only for the deprecated
/// `category: software` case
/// [Repo-grounded — `frontmatter.rs::validate_software_schema`'s
/// `SEVERITY_WARN` branch].
let private mkWarn (path: string) (message: string) : Finding =
    { Severity = Severity.Advisory
      Message = message
      Path = Some path }

/// Validates the full software-engineering frontmatter schema. Required
/// fields: `title`, `description`, `category` (one of `validCategories`, or
/// the deprecated `"software"` value, which reports `Advisory` rather than
/// `Blocking`), `subcategory`, `tags` (non-empty list)
/// [Repo-grounded — `frontmatter.rs::validate_software_schema`].
///
/// Gherkin (binds) — "Software-engineering doc with all required frontmatter
/// fields passes", "...category tutorial...", "...category how-to...",
/// "...category reference...", "...category explanation..." passing
/// scenarios, and "Software-engineering doc missing title fails", "...missing
/// category field fails", "...category other than software fails", and
/// "...deprecated software category emits warn not fail" — all from
/// `specs/apps/rhino/cli/behaviours/md/docs-validate-frontmatter.feature`.
let private validateSoftwareSchema (path: string) (fm: IDictionary<obj, obj>) : Finding list =
    let titleFinding =
        if hasNonEmptyString fm "title" then
            []
        else
            [ mkFail path "required field \"title\" is missing or empty" ]

    let descriptionFinding =
        if hasNonEmptyString fm "description" then
            []
        else
            [ mkFail path "required field \"description\" is missing or empty" ]

    let categoryFindings =
        if hasNonEmptyString fm "category" then
            let v = stringValue (tryGetRawValue fm "category")

            if Set.contains v validCategories then
                []
            elif v = "software" then
                [ mkWarn
                      path
                      "field \"category\" value \"software\" is deprecated; use one of: tutorial, how-to, reference, explanation" ]
            else
                [ mkFail
                      path
                      (sprintf
                          "field \"category\" must be one of: tutorial, how-to, reference, explanation; found \"%s\""
                          v) ]
        else
            [ mkFail path "required field \"category\" is missing or empty" ]

    let subcategoryFinding =
        if hasNonEmptyString fm "subcategory" then
            []
        else
            [ mkFail path "required field \"subcategory\" is missing or empty" ]

    let tagsFinding =
        if hasNonEmptyList fm "tags" then
            []
        else
            [ mkFail path "required field \"tags\" must be a non-empty list" ]

    titleFinding
    @ descriptionFinding
    @ categoryFindings
    @ subcategoryFinding
    @ tagsFinding

/// The only frontmatter keys a `repo-governance/` file may carry. This is an
/// allow-list, not a minimum: a key outside the set is a `Blocking` finding,
/// which is what stops the metadata the sweep removed from accreting again
/// [Repo-grounded — `repo-governance/conventions/structure/governance-frontmatter.md`].
let private governanceAllowedKeys: Set<string> =
    Set.ofList [ "description"; "when_to_use" ]

/// Validates the governance-document frontmatter schema: `description` and
/// `when_to_use` are both required and non-empty, and no other key may be
/// present. `title` was dropped from the required set when the tree moved to
/// the two-key allow-list — its sole consumer was
/// `governance readme-index generate`'s link text, which falls back to the
/// title-cased filename stem
/// [Repo-grounded — `frontmatter.rs::validate_governance_schema`].
///
/// Gherkin (binds) — "Governance doc with only a description fails on the
/// missing when_to_use", "Governance doc with only a when_to_use fails on the
/// missing description", "Governance doc with description and when_to_use
/// passes the two-key schema", "Governance doc carrying a title field fails
/// the allow-list", and "Governance doc carrying any other key fails the
/// allow-list" —
/// `specs/apps/rhino/cli/behaviours/md/docs-validate-frontmatter.feature`.
let private validateGovernanceSchema (path: string) (fm: IDictionary<obj, obj>) : Finding list =
    let descriptionFinding =
        if hasNonEmptyString fm "description" then
            []
        else
            [ mkFail path "required field \"description\" is missing or empty" ]

    let whenToUseFinding =
        if hasNonEmptyString fm "when_to_use" then
            []
        else
            [ mkFail path "required field \"when_to_use\" is missing or empty" ]

    // Keys are compared as their raw scalar text so a non-string key (which
    // YAML permits) is reported rather than silently admitted.
    let disallowedFindings =
        fm.Keys
        |> Seq.map (fun k -> if isNull k then "" else string<obj> k)
        |> Seq.filter (fun k -> not (Set.contains k governanceAllowedKeys))
        |> Seq.sort
        |> Seq.map (fun k ->
            mkFail
                path
                (sprintf
                    "field \"%s\" is not permitted in repo-governance/ frontmatter; only \"description\" and \"when_to_use\" are allowed"
                    k))
        |> Seq.toList

    descriptionFinding @ whenToUseFinding @ disallowedFindings

/// Reads `path`, extracts its frontmatter block, parses it as YAML, and
/// delegates to the area-specific schema validator. Returns a single
/// `missing-frontmatter` finding when no `---` fence is found, or a single
/// `invalid-yaml` finding when the block is not valid YAML. A block that
/// parses to `null` or a non-mapping scalar (e.g. an empty `---\n---\n`
/// block) is treated as an empty frontmatter map — matching
/// `serde_norway::Value::get` returning `None` for every key on a
/// non-mapping value, rather than as a parse failure
/// [Repo-grounded — `frontmatter.rs::scan_frontmatter_file`].
let private scanFrontmatterContent (path: string) (area: DocArea) (content: string) : Finding list =
    match extractFrontmatter content with
    | None -> [ mkFail path "file has no YAML frontmatter (delimited by `---` fences)" ]
    | Some frontmatter ->
        try
            let parsed = deserializer.Deserialize<obj>(frontmatter)

            let fm =
                asRawMap parsed
                |> Option.defaultValue (Dictionary<obj, obj>() :> IDictionary<obj, obj>)

            // Coverage note: scanFrontmatterFile's sole caller (walkFrontmatterPath,
            // just below) already matches on `classifyDocArea path` itself and
            // short-circuits to `[]` for `UnknownArea` BEFORE ever calling this
            // function — so `area` here is always `SoftwareArea` or
            // `GovernanceArea`. This arm exists only to keep the match exhaustive.
            match area with
            | SoftwareArea -> validateSoftwareSchema path fm
            | GovernanceArea -> validateGovernanceSchema path fm
            | UnknownArea -> []
        with ex ->
            [ mkFail path (sprintf "frontmatter is not valid YAML: %s" ex.Message) ]

[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private scanFrontmatterFile (path: string) (area: DocArea) : Finding list =
    scanFrontmatterContent path area (File.ReadAllText path)

/// Recursively collects every file path reachable from `root`, skipping
/// directories named in `skip`. Mirrors `WalkDir`'s ability to accept either
/// a single file or a directory as its root
/// [Repo-grounded — `frontmatter.rs::walk_frontmatter_path`'s and
/// `heading_hierarchy.rs::walk_heading_hierarchy_path`'s shared `WalkDir`
/// use — parameterised over which `SKIP_DIRS` constant applies, since the
/// two validators use different lists].
/// As `collectFilesSkipping`, but preserves the operating system's raw
/// directory-enumeration order instead of sorting alphabetically. Used only
/// by the links validator's JSON output, whose `categories` array is not
/// independently re-sorted downstream (unlike every other `md` validator's
/// output, and unlike the links validator's own text/markdown output) —
/// matching Rust `walkdir::WalkDir`'s own unsorted-by-default enumeration
/// order is the only way that JSON array can agree between the two
/// binaries [Repo-grounded — `links.rs::get_all_markdown_files`'s bare
/// `WalkDir::new(repo_root)`, no `.sort_by`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let rec private collectFilesSkippingUnsorted (skip: Set<string>) (root: string) : string list =
    if File.Exists root then
        [ root ]
    elif Directory.Exists root then
        Directory.GetFileSystemEntries(root)
        |> Array.toList
        |> List.collect (fun entry ->
            if Directory.Exists entry then
                if Set.contains (Path.GetFileName entry) skip then
                    []
                else
                    collectFilesSkippingUnsorted skip entry
            else
                [ entry ])
    else
        []

[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let rec private collectFilesSkipping (skip: Set<string>) (root: string) : string list =
    if File.Exists root then
        [ root ]
    elif Directory.Exists root then
        Directory.GetFileSystemEntries(root)
        |> Array.sort
        |> Array.toList
        |> List.collect (fun entry ->
            if Directory.Exists entry then
                if Set.contains (Path.GetFileName entry) skip then
                    []
                else
                    collectFilesSkipping skip entry
            else
                [ entry ])
    else
        []

/// `collectFilesSkipping` specialised to the frontmatter validator's
/// `skipDirs` [Repo-grounded — `frontmatter.rs::walk_frontmatter_path`'s
/// `WalkDir` use].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private collectFiles (root: string) : string list = collectFilesSkipping skipDirs root

/// Walks `root` recursively and collects frontmatter findings from every
/// markdown file in a recognised documentation area. Returns an empty list
/// when `root` does not exist on the filesystem
/// [Repo-grounded — `frontmatter.rs::walk_frontmatter_path`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private walkFrontmatterPath (root: string) : Finding list =
    collectFiles root
    |> List.filter (fun p -> p.EndsWith(".md", StringComparison.Ordinal))
    |> List.collect (fun path ->
        match classifyDocArea path with
        | UnknownArea -> []
        | area -> scanFrontmatterFile path area)

/// Validates the YAML frontmatter of every markdown file reachable from
/// `paths`. Files outside the recognised documentation areas are silently
/// skipped. The returned list is sorted by file path, then by message
/// [Repo-grounded — `frontmatter.rs::validate_docs_frontmatter`].
///
/// Gherkin (binds) — "Software-engineering doc with all required frontmatter
/// fields passes":
///   Given a software-engineering doc with title, description, category, subcategory, and tags frontmatter
///   When the developer runs docs validate-frontmatter
///   Then the command exits successfully
///   And the frontmatter output reports zero fail-level findings
///
/// Gherkin (binds) — "Software-engineering doc missing title fails":
///   Given a software-engineering doc whose frontmatter omits the title field
///   When the developer runs docs validate-frontmatter
///   Then the command exits with a failure code
///   And the frontmatter output identifies the missing title field
///
/// Gherkin (binds) — "Software-engineering doc missing category field fails":
///   Given a software-engineering doc whose frontmatter omits the category field
///   When the developer runs docs validate-frontmatter
///   Then the command exits with a failure code
///   And the frontmatter output identifies the missing category field
///
/// Gherkin (binds) — "Software-engineering doc with category other than software fails":
///   Given a software-engineering doc whose frontmatter declares category as something other than software
///   When the developer runs docs validate-frontmatter
///   Then the command exits with a failure code
///   And the frontmatter output identifies the wrong category value
///
/// Gherkin (binds) — "Governance doc with only title fails once when_to_use and description are armed":
///   Given a governance doc carrying only a title frontmatter field
///   When the developer runs docs validate-frontmatter
///   Then the command exits with a failure code
///   And the frontmatter output identifies the missing when-to-use field
///   And the frontmatter output identifies the missing description field
///
/// Gherkin (binds) — "Governance doc with title, description, and when_to_use passes the lighter schema":
///   Given a governance doc with title, description, and when_to_use frontmatter
///   When the developer runs docs validate-frontmatter
///   Then the command exits successfully
///   And the frontmatter output reports zero fail-level findings
///
/// Gherkin (binds) — "Software-engineering doc with Diataxis tutorial category passes":
///   Given a software-engineering doc with title, description, category tutorial, subcategory, and tags frontmatter
///   When the developer runs docs validate-frontmatter
///   Then the command exits successfully
///   And the frontmatter output reports zero fail-level findings
///
/// Gherkin (binds) — "Software-engineering doc with Diataxis how-to category passes":
///   Given a software-engineering doc with title, description, category how-to, subcategory, and tags frontmatter
///   When the developer runs docs validate-frontmatter
///   Then the command exits successfully
///   And the frontmatter output reports zero fail-level findings
///
/// Gherkin (binds) — "Software-engineering doc with Diataxis reference category passes":
///   Given a software-engineering doc with title, description, category reference, subcategory, and tags frontmatter
///   When the developer runs docs validate-frontmatter
///   Then the command exits successfully
///   And the frontmatter output reports zero fail-level findings
///
/// Gherkin (binds) — "Software-engineering doc with Diataxis explanation category passes":
///   Given a software-engineering doc with title, description, category explanation, subcategory, and tags frontmatter
///   When the developer runs docs validate-frontmatter
///   Then the command exits successfully
///   And the frontmatter output reports zero fail-level findings
///
/// Gherkin (binds) — "Software-engineering doc with deprecated software category emits warn not fail":
///   Given a software-engineering doc with all required frontmatter fields
///   When the developer runs docs validate-frontmatter
///   Then the command exits successfully
///   And the frontmatter output reports zero fail-level findings
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let validateDocsFrontmatter (paths: string list) : Result<Finding list, string> =
    if List.isEmpty paths then
        Error "at least one path is required"
    else
        paths
        |> List.collect walkFrontmatterPath
        |> List.sortBy (fun f -> (f.Path |> Option.defaultValue "", f.Message))
        |> Ok

/// Validates repository-relative Markdown documents entirely in memory.
/// Files outside the documentation areas governed by the frontmatter rule
/// are ignored exactly as they are by the filesystem adapter above.
let validateDocsFrontmatterDocuments (documents: (string * string) list) : Finding list =
    documents
    |> List.collect (fun (path, content) ->
        match classifyDocArea path with
        | UnknownArea -> []
        | area -> scanFrontmatterContent path area content)
    |> List.sortBy (fun finding -> finding.Path |> Option.defaultValue "", finding.Message)

// ---------------------------------------------------------------------------
// docs validate-heading-hierarchy
// ---------------------------------------------------------------------------

/// One parsed ATX heading: its one-based source line number and level (1-6)
/// [Repo-grounded — `heading_hierarchy.rs::Heading`].
type private Heading = { Line: int; Level: int }

/// Parses the opening of a fenced code block from the start of a
/// (leading-whitespace-trimmed) line. Returns `Some (fenceChar, length)`
/// when the line begins with three or more identical backtick or tilde
/// characters; otherwise `None`
/// [Repo-grounded — `heading_hierarchy.rs::parse_fence_open`].
let private parseFenceOpen (s: string) : (char * int) option =
    if String.IsNullOrEmpty s then
        None
    else
        let first = s.[0]

        if first <> '`' && first <> '~' then
            None
        else
            let mutable n = 0
            let mutable i = 0

            while i < s.Length && s.[i] = first do
                n <- n + 1
                i <- i + 1

            if n < 3 then None else Some(first, n)

/// Parses the ATX heading level (1-6) from the start of a
/// (leading-whitespace-trimmed) line. Returns `None` when the line is not a
/// valid ATX heading (wrong prefix, no space/tab after the `#` run, or empty
/// heading text) [Repo-grounded — `heading_hierarchy.rs::parse_heading_level`].
let private parseHeadingLevel (s: string) : int option =
    if String.IsNullOrEmpty s || s.[0] <> '#' then
        None
    else
        let mutable level = 0

        while level < s.Length && s.[level] = '#' do
            level <- level + 1

        if level < 1 || level > 6 then
            None
        elif level >= s.Length then
            None
        else
            let next = s.[level]

            if next <> ' ' && next <> '\t' then
                None
            else
                let rest = s.Substring(level + 1).Trim()
                if rest = "" then None else Some level

/// Collects all ATX heading titles from `content` (fence-aware) as
/// `(line, level, title)` tuples. Shared by `collectHeadings` below (which
/// only needs `line`/`level`) and the links validator's anchor-slug logic
/// further down (which also needs `title`) — folding what would otherwise
/// be two near-identical fence-tracking loops into one
/// [Repo-grounded — `links.rs::collect_atx_headings`].
let private collectAtxHeadingTitles (content: string) : (int * int * string) list =
    let lines = content.Split('\n')
    let mutable inFence = false
    let mutable fenceChar = ' '
    let mutable fenceLen = 0
    let out = ResizeArray<int * int * string>()

    for i in 0 .. lines.Length - 1 do
        let lineNum = i + 1
        let trimmed = lines.[i].TrimStart([| ' '; '\t' |])

        match parseFenceOpen trimmed with
        | Some(ch, length) ->
            if not inFence then
                inFence <- true
                fenceChar <- ch
                fenceLen <- length
            elif ch = fenceChar && length >= fenceLen then
                inFence <- false
                fenceChar <- ' '
                fenceLen <- 0
        | None ->
            if not inFence then
                match parseHeadingLevel trimmed with
                | Some level ->
                    let title = trimmed.Substring(level + 1).Trim()

                    if title <> "" then
                        out.Add(lineNum, level, title)
                | None -> ()

    out |> List.ofSeq

/// Parses all ATX headings from `content`, skipping lines inside fenced code
/// blocks. A line that opens or closes a fence is itself never treated as a
/// heading candidate, matching the Rust source's `continue`-before-heading-
/// check ordering [Repo-grounded — `heading_hierarchy.rs::collect_headings`].
let private collectHeadings (content: string) : Heading list =
    collectAtxHeadingTitles content
    |> List.map (fun (line, level, _) -> { Line = line; Level = level })

/// Applies the H1-uniqueness and no-level-skipping rules to a file's parsed
/// headings. Returns an empty list when `headings` is empty (the file has no
/// headings at all) [Repo-grounded — `heading_hierarchy.rs::analyze_headings`].
///
/// Gherkin (binds) — "Tree where every .md has exactly one H1 and no skipped
/// levels passes", "File with two H1 headings fails", "File with H2 followed
/// directly by H4 (skipping H3) fails", and "Single-line file with no
/// headings is ignored (passes)" — all from
/// `specs/apps/rhino/cli/behaviours/md/docs-validate-heading-hierarchy.feature`.
/// One finding from [`analyzeHeadingsDetailed`], carrying the `line`/`kind`
/// fields the CLI's JSON/Markdown rendering needs beyond generic `Finding`
/// [Repo-grounded — `heading_hierarchy.rs::DocsHeadingFinding`].
type HeadingFinding =
    { File: string
      Line: int
      Severity: string
      Kind: string
      Message: string }

/// Same rule as `analyzeHeadings` but returns the richer per-finding shape
/// (line number, machine-readable kind) the CLI-facing formatters need
/// [Repo-grounded — `heading_hierarchy.rs::analyze_headings`].
let private analyzeHeadingsDetailed (path: string) (headings: Heading list) : HeadingFinding list =
    match headings with
    | [] -> []
    | _ ->
        let h1s = headings |> List.filter (fun h -> h.Level = 1)
        let h1Count = h1s.Length

        let h1Finding =
            match h1Count with
            | 0 ->
                [ { File = path
                    Line = headings.[0].Line
                    Severity = "high"
                    Kind = "missing-h1"
                    Message = "markdown file has no H1 heading; every documented file must have exactly one H1" } ]
            | 1 -> []
            | _ ->
                let firstH1Line = h1s.[0].Line
                let secondH1Line = h1s.[1].Line

                [ { File = path
                    Line = secondH1Line
                    Severity = "high"
                    Kind = "duplicate-h1"
                    Message =
                      sprintf
                          "markdown file has %d H1 headings (first at line %d); every file must have exactly one H1"
                          h1Count
                          firstH1Line } ]

        let skipFindings =
            headings
            |> List.pairwise
            |> List.choose (fun (prev, cur) ->
                if cur.Level > prev.Level + 1 then
                    Some
                        { File = path
                          Line = cur.Line
                          Severity = "high"
                          Kind = "skipped-level"
                          Message =
                            sprintf
                                "H%d heading follows H%d, skipping H%d; heading levels must not skip"
                                cur.Level
                                prev.Level
                                (prev.Level + 1) }
                else
                    None)

        h1Finding @ skipFindings

let private analyzeHeadings (path: string) (headings: Heading list) : Finding list =
    analyzeHeadingsDetailed path headings
    |> List.map (fun f -> mkFail f.File f.Message)

/// Reads `path`, extracts its headings, and applies the hierarchy rules
/// [Repo-grounded — `heading_hierarchy.rs::scan_file_heading_hierarchy`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private scanFileHeadingHierarchy (path: string) : Finding list =
    File.ReadAllText(path) |> collectHeadings |> analyzeHeadings path

/// Walks `root` recursively and validates each markdown file. Returns an
/// empty list when `root` does not exist on the filesystem
/// [Repo-grounded — `heading_hierarchy.rs::walk_heading_hierarchy_path`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private walkHeadingHierarchyPath (root: string) : Finding list =
    collectFilesSkipping namingSkipDirs root
    |> List.filter (fun p -> p.EndsWith(".md", StringComparison.Ordinal))
    |> List.collect scanFileHeadingHierarchy

/// Returns `true` when the repository-relative path `repoRel` is in the
/// heading-hierarchy validator's prose allowlist:
/// `docs/`, `repo-governance/`, `plans/` (except `plans/done/`), `specs/`,
/// root-level `*.md` files, `apps/<name>/README.md` and
/// `libs/<name>/README.md`, and `apps/<name>/docs/**` and
/// `libs/<name>/docs/**`. Everything else — including `.claude/`,
/// `.opencode/`, deep `apps/`/`libs/` internals, `plans/done/`, and noise
/// directories — is default-deny
/// [Repo-grounded — `heading_hierarchy.rs::is_prose_allowlisted`].
let private isProseAllowlisted (repoRel: string) : bool =
    let r = repoRel.Replace('\\', '/')

    let stripPrefix (prefix: string) (value: string) : string option =
        if value.StartsWith(prefix, StringComparison.Ordinal) then
            Some(value.Substring(prefix.Length))
        else
            None

    if r.StartsWith("plans/done/", StringComparison.Ordinal) || r = "plans/done" then
        false
    elif
        r.StartsWith("docs/", StringComparison.Ordinal)
        || r.StartsWith("repo-governance/", StringComparison.Ordinal)
        || r.StartsWith("plans/", StringComparison.Ordinal)
        || r.StartsWith("specs/", StringComparison.Ordinal)
    then
        true
    elif not (r.Contains('/')) && r.EndsWith(".md", StringComparison.Ordinal) then
        true
    else
        match stripPrefix "apps/" r |> Option.orElse (stripPrefix "libs/" r) with
        | None -> false
        | Some rest ->
            match rest.IndexOf('/') with
            | -1 -> false
            | idx ->
                let tail = rest.Substring(idx + 1)
                tail = "README.md" || tail.StartsWith("docs/", StringComparison.Ordinal)

/// Applies the heading-hierarchy rules to an in-memory staged document.
/// This is the pure core used by hook policy tests; filesystem enumeration
/// and reads remain adapter concerns in the functions below.
let validateDocsHeadingHierarchyContent (repoRelativePath: string) (content: string) : Finding list =
    if isProseAllowlisted repoRelativePath then
        content |> collectHeadings |> analyzeHeadings repoRelativePath
    else
        []

/// Validates an in-memory Markdown document set. `allowlistedOnly` selects
/// the repository prose policy used by the public command; the unrestricted
/// mode models explicit path operands, which validate every supplied file.
let validateDocsHeadingHierarchyDocuments
    (allowlistedOnly: bool)
    (excludePrefixes: string list)
    (documents: (string * string) list)
    : Finding list =
    let isExcluded (path: string) : bool =
        let normalized = path.Replace('\\', '/')

        excludePrefixes
        |> List.exists (fun prefix ->
            let trimmed = prefix.Replace('\\', '/').TrimEnd('/')

            trimmed <> ""
            && (normalized = trimmed
                || normalized.StartsWith(trimmed + "/", StringComparison.Ordinal)))

    documents
    |> List.filter (fun (path, _) -> path.EndsWith(".md", StringComparison.Ordinal))
    |> List.filter (fun (path, _) -> not (isExcluded path))
    |> List.filter (fun (path, _) -> not allowlistedOnly || isProseAllowlisted path)
    |> List.collect (fun (path, content) -> content |> collectHeadings |> analyzeHeadings path)
    |> List.sortBy (fun finding -> finding.Path |> Option.defaultValue "", finding.Message)

/// Performs an allowlisted heading-hierarchy scan rooted at `repoRoot`. Only
/// files whose repository-relative path satisfies `isProseAllowlisted` are
/// checked; `excludePrefixes` are additional repository-relative prefixes to
/// skip, applied after the allowlist filter. The returned list is sorted by
/// file path, then by message
/// [Repo-grounded — `heading_hierarchy.rs::validate_docs_heading_hierarchy_allowlisted`].
///
/// Gherkin (binds) — "prose-allowlist-runs — docs file triggers a heading
/// finding", "agent-skill-file-exempt — no finding for agent or skill
/// files", "plans-done-excluded — no finding for plans/done files",
/// "exclude-flag-suppresses-tree — --exclude docs suppresses docs findings",
/// "specs-allowlisted — specs tree triggers a heading finding",
/// "app-readme-allowlisted — project-root README triggers a heading
/// finding", "app-internals-default-deny — deep app files yield no finding",
/// and "project-docs-subtree-allowlisted — app and lib docs trees trigger
/// findings" — all from
/// `specs/apps/rhino/cli/behaviours/md/docs-validate-heading-hierarchy.feature`.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let validateDocsHeadingHierarchyAllowlisted (repoRoot: string) (excludePrefixes: string list) : Finding list =
    collectFilesSkipping namingSkipDirs repoRoot
    |> List.filter (fun p -> p.EndsWith(".md", StringComparison.Ordinal))
    |> List.choose (fun path ->
        let rel = Path.GetRelativePath(repoRoot, path).Replace('\\', '/')

        if not (isProseAllowlisted rel) then
            None
        elif
            excludePrefixes
            |> List.exists (fun pfx -> rel.StartsWith(pfx, StringComparison.Ordinal))
        then
            None
        else
            Some path)
    |> List.collect scanFileHeadingHierarchy
    |> List.sortBy (fun f -> (f.Path |> Option.defaultValue "", f.Message))

/// CLI-facing counterpart to `validateDocsHeadingHierarchyAllowlisted`
/// carrying the richer `HeadingFinding` shape (line, kind), sorted by file
/// then line — matching the Rust source's own sort key exactly, unlike the
/// generic-`Finding` overload above, which sorts by message for lack of a
/// `Line` field to sort on
/// [Repo-grounded — `heading_hierarchy.rs::validate_docs_heading_hierarchy_allowlisted`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let validateDocsHeadingHierarchyAllowlistedDetailed
    (repoRoot: string)
    (excludePrefixes: string list)
    : HeadingFinding list =
    collectFilesSkipping namingSkipDirs repoRoot
    |> List.filter (fun p -> p.EndsWith(".md", StringComparison.Ordinal))
    |> List.choose (fun path ->
        let rel = Path.GetRelativePath(repoRoot, path).Replace('\\', '/')

        if not (isProseAllowlisted rel) then
            None
        elif
            excludePrefixes
            |> List.exists (fun pfx -> rel.StartsWith(pfx, StringComparison.Ordinal))
        then
            None
        else
            Some path)
    |> List.collect (fun path -> File.ReadAllText(path) |> collectHeadings |> analyzeHeadingsDetailed path)
    |> List.sortBy (fun f -> (f.File, f.Line))

/// Validates heading hierarchy in every markdown file reachable from
/// `paths`, without any prose-allowlist filtering — the counterpart callers
/// use when they already know every supplied path should be checked. The
/// returned list is sorted by file path, then by message
/// [Repo-grounded — `heading_hierarchy.rs::validate_docs_heading_hierarchy`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let validateDocsHeadingHierarchy (paths: string list) : Result<Finding list, string> =
    if List.isEmpty paths then
        Error "at least one path is required"
    else
        paths
        |> List.collect walkHeadingHierarchyPath
        |> List.sortBy (fun f -> (f.Path |> Option.defaultValue "", f.Message))
        |> Ok

/// CLI-facing entry for `md heading-hierarchy validate <path>...`'s
/// positional-path branch: applies the same prose allowlist
/// `validateDocsHeadingHierarchyAllowlisted`'s repo-wide walk uses to each
/// explicit `paths` entry before validating, so a file outside the allowlist
/// (e.g. `.claude/skills/**`) staged and passed explicitly by lint-staged is
/// silently skipped rather than scanned. Returns an empty list — not an
/// error — when every path is filtered out, matching the Rust command's
/// early `return Ok(())` for that case
/// [Repo-grounded — `md_validate_heading_hierarchy.rs::run`'s
/// `args.positional`-non-empty branch].
///
/// Gherkin (binds) — "staged-prose-heading-blocks — staged docs file with bad
/// heading hierarchy blocks commit" and "staged-skill-file-exempt — staged
/// SKILL.md with bad heading hierarchy does not block commit" — both from
/// `specs/apps/rhino/cli/behaviours/git/git-pre-commit.feature`.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let validateDocsHeadingHierarchyForPaths (repoRoot: string) (paths: string list) : Finding list =
    let allowlisted =
        paths
        |> List.choose (fun p ->
            let abs = if Path.IsPathRooted p then p else Path.Combine(repoRoot, p)
            let rel = Path.GetRelativePath(repoRoot, abs).Replace('\\', '/')

            if isProseAllowlisted rel then Some abs else None)

    if List.isEmpty allowlisted then
        []
    else
        // Coverage note: `validateDocsHeadingHierarchy`'s only Error case is
        // an empty `paths` list — impossible here, since `allowlisted` was
        // just proven non-empty by the `if` above. This `Error` arm is
        // unreachable via this caller.
        match validateDocsHeadingHierarchy allowlisted with
        | Ok findings -> findings
        | Error _ -> []

// ---------------------------------------------------------------------------
// docs validate-links
// ---------------------------------------------------------------------------

/// Directories skipped by the links validator's full-repo walk — the
/// cross-repo noise-skip set shared by the markdown gate validators
/// (mermaid, links, heading-hierarchy) in the Rust source, a superset of
/// both `skipDirs` and `namingSkipDirs` above
/// [Repo-grounded — `links.rs::FULL_REPO_SKIP_DIRS`].
let private linksSkipDirs: Set<string> =
    Set.ofList
        [ "node_modules"
          "dist"
          "build"
          "target"
          ".next"
          "coverage"
          "generated-reports"
          "local-tmp"
          "archived"
          "apps-labs"
          "worktrees"
          ".terraform"
          "generated-contracts"
          ".nx"
          ".fvm-cache"
          ".git"
          "deps"
          "_build"
          "cover" ]

/// Path fragments identifying a skill tree, whose files are exempt from link
/// validation. `.agents/skills/` holds a byte-for-byte mirror of
/// `.claude/skills/`, so a rule keyed on the canonical path alone would
/// validate the copy while exempting the original
/// [Repo-grounded — `links.rs::SKILL_TREE_MARKERS`].
let private skillTreeMarkers: string list = [ ".claude/skills/"; ".agents/skills/" ]

/// One relative markdown link parsed out of a source line, before
/// validation [Repo-grounded — `links.rs::LinkInfo`].
type private LinkInfo = { LineNumber: int; Url: string }

/// Matches `[text](url)` markdown link syntax [Repo-grounded — `links.rs::link_re`].
let private linkRegex = Regex(@"\[([^\]]+)\]\(([^)]+)\)", RegexOptions.Compiled)

/// Matches bracket-style placeholder tokens such as `[placeholder-name]`
/// [Repo-grounded — `links.rs::bracket_placeholder_re`].
let private bracketPlaceholderRegex = Regex(@"\[[\w-]+\]", RegexOptions.Compiled)

/// Replaces inline code spans (`` `...` `` / ` ``...`` `) with spaces,
/// preserving character offsets so regex match positions remain valid
/// [Repo-grounded — `links.rs::strip_inline_code_spans`].
let private stripInlineCodeSpans (line: string) : string =
    let chars = line.ToCharArray()
    let len = chars.Length
    let mutable i = 0

    while i < len do
        if chars.[i] = '`' then
            let tickCount = if i + 1 < len && chars.[i + 1] = '`' then 2 else 1
            let start = i
            i <- i + tickCount
            let mutable found = false

            while i < len && not found do
                if tickCount = 2 && i + 1 < len && chars.[i] = '`' && chars.[i + 1] = '`' then
                    i <- i + 2
                    found <- true
                elif tickCount = 1 && chars.[i] = '`' then
                    i <- i + 1
                    found <- true
                else
                    i <- i + 1

            if found then
                for j in start .. i - 1 do
                    chars.[j] <- ' '
        else
            i <- i + 1

    String(chars)

/// Returns `true` when `link` matches a known placeholder or documentation-
/// example pattern that must not be validated against the filesystem
/// [Repo-grounded — `links.rs::should_skip_link`].
let shouldSkipLink (link: string) : bool =
    if link.StartsWith("/", StringComparison.Ordinal) then
        true
    elif link.Contains("{{<") || link.Contains("{{%") then
        true
    else
        let placeholders =
            [ "path.md"
              "target"
              "link"
              "./path/to/"
              "../path/to/"
              "path/to/convention.md"
              "path/to/practice.md"
              "path/to/rule.md"
              "./relative/path/to/" ]

        if placeholders |> List.exists link.Contains then
            true
        elif bracketPlaceholderRegex.IsMatch(link) then
            true
        elif link = "path" || link = "target" || link = "link" then
            true
        elif
            link.Contains("/images/")
            && not (link.StartsWith("../", StringComparison.Ordinal))
        then
            true
        else
            let examplePatterns =
                [ "./overview"
                  "./guide.md"
                  "./examples.md"
                  "./reference.md"
                  "./diagram.png"
                  "./image.png"
                  "./screenshots/"
                  "./auth-guide.md"
                  "by-concept/beginner"
                  "./by-example/beginner"
                  "swe/prog-lang/"
                  "../parent"
                  "./ai/"
                  "../swe/"
                  "../../advanced/"
                  "url"
                  "./LICENSE"
                  "../../features.md"
                  "../../.opencode/" ]

            examplePatterns |> List.exists link.Contains

/// Extracts every relative markdown link from `path`, skipping fenced code
/// blocks (a bare-`` ``` ``-prefix toggle, deliberately simpler than
/// `parseFenceOpen`'s tilde/length-aware tracking above — this mirrors the
/// Rust source's own, separate fence check rather than reusing the
/// heading-hierarchy one) and inline code spans, discarding external URLs,
/// `mailto:` links, and known placeholder patterns
/// [Repo-grounded — `links.rs::extract_links`].
let private extractLinksFromContent (content: string) : LinkInfo list =
    let lines = content.Split('\n')
    let mutable inCodeBlock = false
    let links = ResizeArray<LinkInfo>()

    for i in 0 .. lines.Length - 1 do
        let lineNum = i + 1
        let line = lines.[i]

        if line.TrimStart().StartsWith("```", StringComparison.Ordinal) then
            inCodeBlock <- not inCodeBlock
        elif not inCodeBlock then
            let stripped = stripInlineCodeSpans line

            for m in linkRegex.Matches(stripped) do
                let url = m.Groups.[2].Value.TrimStart('<').TrimEnd('>')

                let isExternal =
                    url.StartsWith("http://", StringComparison.Ordinal)
                    || url.StartsWith("https://", StringComparison.Ordinal)
                    || url.StartsWith("mailto:", StringComparison.Ordinal)

                if not isExternal && not (shouldSkipLink url) then
                    links.Add { LineNumber = lineNum; Url = url }

    links |> List.ofSeq

[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private extractLinks (path: string) : LinkInfo list =
    File.ReadAllText path |> extractLinksFromContent

/// Converts a heading title string to a GitHub-flavoured markdown anchor
/// slug. Rules: lowercase, remove all chars that are not alphanumeric,
/// underscore, space, or hyphen, then replace spaces with hyphens (no
/// collapsing). Verified against the `github-slugger` v2 reference
/// implementation — underscores and Unicode letters/digits are kept
/// [Repo-grounded — `links.rs::github_slug`].
let githubSlug (title: string) : string =
    title.ToLowerInvariant()
    |> Seq.choose (fun c ->
        if Char.IsLetterOrDigit c || c = '-' || c = '_' then Some c
        elif c = ' ' then Some '-'
        else None)
    |> Seq.toArray
    |> String

/// Builds a `Set` of all GitHub-slugified anchor names (with duplicate
/// collision suffixes applied in heading order) for `content`
/// [Repo-grounded — `links.rs::slugs_from_content`].
let private slugsFromContent (content: string) : Set<string> =
    let headings = collectAtxHeadingTitles content
    let mutable counts: Map<string, int> = Map.empty
    let mutable result = Set.empty

    for _, _, title in headings do
        let baseSlug = githubSlug title
        let count = counts |> Map.tryFind baseSlug |> Option.defaultValue 0

        let slug =
            if count = 0 then
                baseSlug
            else
                sprintf "%s-%d" baseSlug count

        counts <- counts |> Map.add baseSlug (count + 1)
        result <- Set.add slug result

    result

/// Splits a link's URL into its path part and an optional anchor fragment
/// (everything after the first `#`) [Repo-grounded — `links.rs::validate_file`'s
/// `hash_pos` split].
let private splitUrlFragment (url: string) : string * string option =
    match url.IndexOf('#') with
    | -1 -> url, None
    | idx -> url.Substring(0, idx), Some(url.Substring(idx + 1))

/// Resolves a relative `link` against the directory containing
/// `sourceFile`. An empty `link` (pure anchor) returns `sourceFile`
/// unchanged [Repo-grounded — `links.rs::resolve_link`/`clean_path`].
let private resolveLink (sourceFile: string) (link: string) : string =
    // Coverage note: both call sites (validateFileLinks, validateFileLinksDetailed)
    // already branch on `pathPart = ""` themselves — handling a pure-anchor
    // link entirely inline via `slugsFromContent` — and only call resolveLink
    // in the `else` arm, where `pathPart` (passed here as `link`) is
    // guaranteed non-empty. This `link = ""` branch is therefore unreachable
    // via either caller.
    if link = "" then
        sourceFile
    else
        let parent =
            Path.GetDirectoryName(sourceFile) |> Option.ofObj |> Option.defaultValue ""

        let resolved = Path.GetFullPath(Path.Combine(parent, link))
        // Rust's `clean_path` (a `filepath.Clean` port) never retains a
        // trailing separator on a non-root path — `.NET`'s `Path.Combine`
        // does when `link` itself ends in `/` (e.g. a directory link like
        // `./assets/`). Trimmed to match byte-for-byte
        // [Repo-grounded — `links.rs::clean_path`].
        if resolved.Length > 1 && resolved.EndsWith(Path.DirectorySeparatorChar) then
            resolved.TrimEnd(Path.DirectorySeparatorChar)
        else
            resolved

/// Options controlling `validateDocsLinks`'s file-selection behaviour.
/// `StagedFiles`, when `Some`, is the literal list of repository-relative
/// staged paths to scan in place of a full recursive walk — mirrors
/// `checkStagedFiles`'s precedent (see `Env.fs`) of taking the staged-file
/// list as a pure function parameter rather than shelling out to git from
/// application code; the real `git diff --cached` call is a CLI-layer
/// concern for later [Repo-grounded — `links.rs::ScanOptions`].
type LinkScanOptions =
    { RepoRoot: string
      StagedFiles: string list option
      ExcludePrefixes: string list }

/// Selects the absolute paths of markdown files to scan: `opts.StagedFiles`
/// (filtered to `.md`) when `Some`, otherwise every `.md` file reachable
/// from `opts.RepoRoot` via `linksSkipDirs`-filtered recursion; either way,
/// `opts.ExcludePrefixes` is then applied against each file's
/// repository-relative path [Repo-grounded — `links.rs::get_markdown_files`,
/// `links.rs::filter_skip_paths`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private getMarkdownLinkFiles (opts: LinkScanOptions) : string list =
    let files =
        match opts.StagedFiles with
        | Some staged ->
            staged
            |> List.filter (fun f -> f.EndsWith(".md", StringComparison.Ordinal))
            |> List.map (fun f -> Path.Combine(opts.RepoRoot, f))
        | None ->
            collectFilesSkippingUnsorted linksSkipDirs opts.RepoRoot
            |> List.filter (fun p -> p.EndsWith(".md", StringComparison.Ordinal))

    if List.isEmpty opts.ExcludePrefixes then
        files
    else
        files
        |> List.filter (fun f ->
            let rel = Path.GetRelativePath(opts.RepoRoot, f).Replace('\\', '/')

            opts.ExcludePrefixes
            |> List.forall (fun skip -> not (rel.StartsWith(skip, StringComparison.Ordinal))))

/// Validates every extracted `links` entry against the filesystem, relative
/// to `filePath`. Files inside a skill tree (see `skillTreeMarkers`) are
/// unconditionally exempt. After confirming a non-anchor-only link's target
/// exists, any anchor fragment is validated against the target's (or, for a
/// pure `#fragment` link, the source file's) heading slugs
/// [Repo-grounded — `links.rs::validate_file`].
let private validateFileLinksWith
    (repoRoot: string)
    (filePath: string)
    (links: LinkInfo list)
    (pathExists: string -> bool)
    (readContent: string -> string)
    : Finding list =
    let normalizedPath = filePath.Replace('\\', '/')

    if skillTreeMarkers |> List.exists normalizedPath.Contains then
        []
    else
        let rel = Path.GetRelativePath(repoRoot, filePath).Replace('\\', '/')

        links
        |> List.collect (fun link ->
            let pathPart, fragment = splitUrlFragment link.Url

            if pathPart = "" then
                match fragment with
                | Some frag when frag <> "" ->
                    let slugs = slugsFromContent (readContent filePath)

                    if Set.contains frag slugs then
                        []
                    else
                        [ mkFail
                              rel
                              (sprintf "link \"#%s\" in %s does not match any heading anchor in this file" frag rel) ]
                | _ -> []
            else
                let target = resolveLink filePath pathPart

                if not (pathExists target) then
                    [ mkFail
                          rel
                          (sprintf
                              "Line %d: link \"%s\" in %s points to a non-existent file: %s"
                              link.LineNumber
                              link.Url
                              rel
                              target) ]
                else
                    match fragment with
                    | Some frag when frag <> "" ->
                        let slugs = slugsFromContent (readContent target)

                        if Set.contains frag slugs then
                            []
                        else
                            let targetRel = Path.GetRelativePath(repoRoot, target).Replace('\\', '/')

                            [ mkFail
                                  rel
                                  (sprintf
                                      "link \"#%s\" in %s does not match any heading anchor in %s"
                                      frag
                                      rel
                                      targetRel) ]
                    | _ -> [])

[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private validateFileLinks (repoRoot: string) (filePath: string) (links: LinkInfo list) : Finding list =
    validateFileLinksWith
        repoRoot
        filePath
        links
        (fun target -> File.Exists target || Directory.Exists target)
        File.ReadAllText

/// Validates one staged Markdown document without touching the filesystem.
/// The caller owns target lookup through `pathExists` and `readContent`, so
/// Unit tests can prove hook policy with an in-memory repository while the
/// real links adapter continues to use filesystem functions above.
let validateDocsLinksContent
    (repoRoot: string)
    (repoRelativePath: string)
    (content: string)
    (excludePrefixes: string list)
    (pathExists: string -> bool)
    (readContent: string -> string)
    : Finding list =
    let normalized = repoRelativePath.Replace('\\', '/')

    if
        excludePrefixes
        |> List.exists (fun prefix ->
            let trimmed = prefix.TrimEnd('/')

            trimmed <> ""
            && (normalized = trimmed
                || normalized.StartsWith(trimmed + "/", StringComparison.Ordinal)))
    then
        []
    else
        let absolutePath = Path.GetFullPath(Path.Combine(repoRoot, repoRelativePath))
        let links = extractLinksFromContent content
        validateFileLinksWith repoRoot absolutePath links pathExists readContent

/// Validates a complete in-memory Markdown repository with the same staged
/// and exclusion selection semantics as `validateDocsLinks`. Target and
/// anchor resolution operate against the supplied document map, never the
/// host filesystem.
let validateDocsLinksDocuments
    (documents: (string * string) list)
    (stagedFiles: string list option)
    (excludePrefixes: string list)
    : Finding list =
    let repoRoot = Path.GetFullPath("/virtual-rhino-markdown-repository")

    let normalizedDocuments =
        documents
        |> List.map (fun (path, content) -> Path.GetFullPath(Path.Combine(repoRoot, path.Replace('\\', '/'))), content)
        |> Map.ofList

    let pathExists (path: string) : bool =
        let normalized = Path.GetFullPath(path)

        normalizedDocuments.ContainsKey normalized
        || (normalizedDocuments
            |> Map.exists (fun candidate _ ->
                candidate.StartsWith(normalized + Path.DirectorySeparatorChar.ToString(), StringComparison.Ordinal)))

    let readContent (path: string) : string =
        normalizedDocuments
        |> Map.tryFind (Path.GetFullPath path)
        |> Option.defaultWith (fun () -> failwithf "in-memory Markdown target does not exist: %s" path)

    let selected =
        match stagedFiles with
        | Some staged ->
            let stagedSet =
                staged |> List.map (fun path -> path.Replace('\\', '/')) |> Set.ofList

            documents
            |> List.filter (fun (path, _) -> stagedSet.Contains(path.Replace('\\', '/')))
        | None -> documents

    selected
    |> List.filter (fun (path, _) -> path.EndsWith(".md", StringComparison.Ordinal))
    |> List.collect (fun (path, content) ->
        validateDocsLinksContent repoRoot path content excludePrefixes pathExists readContent)
    |> List.sortBy (fun finding -> finding.Path |> Option.defaultValue "", finding.Message)

/// Validates every relative markdown link (and anchor fragment) reachable
/// from `opts.RepoRoot`, per `opts`'s staged-file and exclude-prefix
/// filters. The returned list is sorted by file path, then by message
/// [Repo-grounded — `links.rs::validate_all_links`].
///
/// Gherkin (binds) — "A document set with all valid internal links passes
/// validation":
///   Given markdown files where all internal links point to existing files
///   When the developer runs docs validate-links
///   Then the command exits successfully
///   And the output reports no broken links found
///
/// Gherkin (binds) — "A broken internal link is detected and reported":
///   Given a markdown file with a link pointing to a non-existent file
///   When the developer runs docs validate-links
///   Then the command exits with a failure code
///   And the output identifies the file containing the broken link
///
/// Gherkin (binds) — "External URLs are not validated":
///   Given a markdown file containing only external HTTPS links
///   When the developer runs docs validate-links
///   Then the command exits successfully
///   And the output reports no broken links found
///
/// Gherkin (binds) — "With --staged-only only staged files are checked":
///   Given a markdown file with a broken link that has not been staged in git
///   When the developer runs docs validate-links with the --staged-only flag
///   Then the command exits successfully
///
/// Gherkin (binds) — "exclude flag skips the named subtree":
///   Given a markdown file under plans/done with a broken internal link
///   And a markdown file under docs with a different broken internal link
///   When the developer runs docs validate-links with --exclude plans/done
///   Then the command exits with a failure code
///   And the output does not mention the plans/done file
///   But the output does mention the docs file
///
/// Gherkin (binds) — "repo-wide scan finds broken link outside original
/// three-directory scope":
///   Given a markdown file under libs with a broken internal link
///   When the developer runs docs validate-links
///   Then the command exits with a failure code
///   And the output identifies the libs file containing the broken link
///
/// Gherkin (binds) — "valid anchor link passes validation":
///   Given a markdown file that links to an existing heading anchor in another file
///   When the developer runs docs validate-links
///   Then the command exits successfully
///   And the output reports no broken links found
///
/// Gherkin (binds) — "broken anchor link produces a broken-anchor finding":
///   Given a markdown file that links to a non-existent heading anchor in an existing file
///   When the developer runs docs validate-links
///   Then the command exits with a failure code
///   And the output identifies the broken anchor
///
/// Gherkin (binds) — "same-file anchor with no matching heading produces a
/// broken-anchor finding":
///   Given a markdown file containing a same-file anchor link that has no matching heading
///   When the developer runs docs validate-links
///   Then the command exits with a failure code
///   And the output identifies the broken same-file anchor
///
/// Gherkin (binds) — "anchor slugs keep underscores per the GitHub
/// reference algorithm":
///   Given a markdown file that links to the anchor "#snake_case" of a file whose heading is "snake_case"
///   When the developer runs docs validate-links
///   Then the command exits successfully
///   And the output reports no broken links found
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let validateDocsLinks (opts: LinkScanOptions) : Finding list =
    getMarkdownLinkFiles opts
    |> List.collect (fun path -> validateFileLinks opts.RepoRoot path (extractLinks path))
    |> List.sortBy (fun f -> (f.Path |> Option.defaultValue "", f.Message))

/// A relative markdown link that could not be resolved to an existing file
/// [Repo-grounded — `links.rs::BrokenLink`].
type BrokenLink =
    { LineNumber: int
      SourceFile: string
      LinkText: string
      TargetPath: string
      Category: string }

/// Aggregated result of a link scan, carrying the rich per-link detail the
/// CLI's JSON/Markdown rendering needs beyond a generic `Finding list`
/// [Repo-grounded — `links.rs::LinkValidationResult`].
type LinkValidationResult =
    { TotalFiles: int
      TotalLinks: int
      BrokenLinks: BrokenLink list
      BrokenByCategory: Map<string, BrokenLink list> }

/// Assigns a human-readable category string to a broken link for report
/// grouping [Repo-grounded — `links.rs::categorize_broken_link`].
let categorizeBrokenLink (link: string) : string =
    if link.Contains("workflows/") && not (link.Contains("repo-governance/workflows/")) then
        "workflows/ paths"
    elif link.Contains("vision/") && not (link.Contains("repo-governance/vision/")) then
        "vision/ paths"
    elif link.Contains("conventions/README.md") then
        "conventions README"
    elif link = "CODE_OF_CONDUCT.md" || link = "CHANGELOG.md" then
        "Missing files"
    else
        "General/other paths"

/// As `validateFileLinks`, but returns the richer `BrokenLink` shape (line
/// number, link text, target path, category) the CLI's JSON/Markdown
/// rendering needs instead of a prose `Finding.Message`
/// [Repo-grounded — `links.rs::validate_file`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private validateFileLinksDetailed (repoRoot: string) (filePath: string) (links: LinkInfo list) : BrokenLink list =
    let normalizedPath = filePath.Replace('\\', '/')

    if skillTreeMarkers |> List.exists normalizedPath.Contains then
        []
    else
        let rel = Path.GetRelativePath(repoRoot, filePath).Replace('\\', '/')

        links
        |> List.collect (fun link ->
            let pathPart, fragment = splitUrlFragment link.Url

            if pathPart = "" then
                match fragment with
                | Some frag when frag <> "" ->
                    let slugs = slugsFromContent (File.ReadAllText filePath)

                    if Set.contains frag slugs then
                        []
                    else
                        [ { LineNumber = link.LineNumber
                            SourceFile = rel
                            LinkText = link.Url
                            TargetPath = sprintf "%s#%s" filePath frag
                            Category = "broken-anchor" } ]
                | _ -> []
            else
                let target = resolveLink filePath pathPart

                if not (File.Exists target || Directory.Exists target) then
                    [ { LineNumber = link.LineNumber
                        SourceFile = rel
                        LinkText = link.Url
                        TargetPath = target
                        Category = categorizeBrokenLink link.Url } ]
                else
                    match fragment with
                    | Some frag when frag <> "" ->
                        let slugs = slugsFromContent (File.ReadAllText target)

                        if Set.contains frag slugs then
                            []
                        else
                            [ { LineNumber = link.LineNumber
                                SourceFile = rel
                                LinkText = link.Url
                                TargetPath = sprintf "%s#%s" target frag
                                Category = "broken-anchor" } ]
                    | _ -> [])

/// As `validateDocsLinks`, but returns the richer `LinkValidationResult`
/// (total files/links scanned, category-grouped broken links) the CLI's
/// JSON/Markdown rendering needs
/// [Repo-grounded — `links.rs::validate_all_links`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let validateAllLinksDetailed (opts: LinkScanOptions) : LinkValidationResult =
    let files = getMarkdownLinkFiles opts

    let perFile = files |> List.map (fun path -> path, extractLinks path)

    let totalLinks = perFile |> List.sumBy (fun (_, links) -> List.length links)

    let broken =
        perFile
        |> List.collect (fun (path, links) -> validateFileLinksDetailed opts.RepoRoot path links)

    let byCategory = broken |> List.groupBy (fun b -> b.Category) |> Map.ofList

    { TotalFiles = List.length files
      TotalLinks = totalLinks
      BrokenLinks = broken
      BrokenByCategory = byCategory }

// ---------------------------------------------------------------------------
// docs validate-mermaid
// ---------------------------------------------------------------------------

/// Flow direction of a Mermaid flowchart/state diagram [Repo-grounded — `types.rs::Direction`].
type MermaidDirection =
    | MermaidTB
    | MermaidTD
    | MermaidBT
    | MermaidLR
    | MermaidRL

/// Parses a direction string from a `flowchart`/`graph`/`direction` header.
/// Unknown strings default to `MermaidTB` [Repo-grounded — `types.rs::Direction::parse`].
let private parseMermaidDirection (s: string) : MermaidDirection =
    match s with
    | "TD" -> MermaidTD
    | "BT" -> MermaidBT
    | "LR" -> MermaidLR
    | "RL" -> MermaidRL
    | _ -> MermaidTB

/// Category of a Mermaid diagram block [Repo-grounded — `types.rs::DiagramKind`].
type private MermaidDiagramKind =
    | FlowchartKind
    | StateKind
    | OtherKind

/// Category of a validation violation [Repo-grounded — `types.rs::ViolationKind`].
type MermaidViolationKind =
    | MermaidLabelTooLong
    | MermaidWidthExceeded
    | MermaidMultipleDiagrams

/// Returns the stable string code for a violation kind
/// [Repo-grounded — `types.rs::ViolationKind::code`].
let mermaidViolationKindCode (k: MermaidViolationKind) : string =
    match k with
    | MermaidLabelTooLong -> "label_too_long"
    | MermaidWidthExceeded -> "width_exceeded"
    | MermaidMultipleDiagrams -> "multiple_diagrams"

/// Category of a validation warning [Repo-grounded — `types.rs::WarningKind`].
type MermaidWarningKind =
    | MermaidComplexDiagram
    | MermaidSubgraphDense

/// Returns the stable string code for a warning kind
/// [Repo-grounded — `types.rs::WarningKind::code`].
let mermaidWarningKindCode (k: MermaidWarningKind) : string =
    match k with
    | MermaidComplexDiagram -> "complex_diagram"
    | MermaidSubgraphDense -> "subgraph_density"

/// A raw Mermaid code block extracted from a Markdown file
/// [Repo-grounded — `types.rs::MermaidBlock`].
type MermaidBlock =
    { FilePath: string
      BlockIndex: int
      Source: string
      StartLine: int }

/// A node in a parsed Mermaid diagram [Repo-grounded — `types.rs::Node`].
type MermaidNode = { Id: string; Label: string }

/// A directed edge between two nodes [Repo-grounded — `types.rs::Edge`].
type MermaidEdge =
    { From: string
      To: string
      Label: string }

/// A `subgraph` block parsed from a flowchart [Repo-grounded — `types.rs::Subgraph`].
type MermaidSubgraph =
    { Id: string
      Label: string
      NodeIds: string list
      StartLine: int }

/// A fully parsed Mermaid diagram with its structural metadata
/// [Repo-grounded — `types.rs::ParsedDiagram`].
type ParsedMermaidDiagram =
    { Block: MermaidBlock
      Direction: MermaidDirection
      Nodes: MermaidNode list
      Edges: MermaidEdge list
      Subgraphs: MermaidSubgraph list }

/// A single validation violation that blocks the check
/// [Repo-grounded — `types.rs::Violation`].
type MermaidViolation =
    { Kind: MermaidViolationKind
      FilePath: string
      BlockIndex: int
      StartLine: int
      NodeId: string
      LabelText: string
      LabelLen: int
      MaxLabelLen: int
      ActualWidth: int
      MaxWidth: int }

/// A non-blocking advisory about a diagram's complexity
/// [Repo-grounded — `types.rs::Warning`].
type MermaidWarning =
    { Kind: MermaidWarningKind
      FilePath: string
      BlockIndex: int
      StartLine: int
      ActualWidth: int
      ActualDepth: int
      MaxWidth: int
      MaxDepth: int
      SubgraphLabel: string
      SubgraphNodeCount: int
      MaxSubgraphNodes: int }

/// Tunable thresholds for Mermaid diagram validation
/// [Repo-grounded — `types.rs::ValidateOptions`].
type MermaidValidateOptions =
    { MaxLabelLen: int
      MaxWidth: int
      MaxDepth: int
      MaxSubgraphNodes: int }

/// Aggregated result of a `validateMermaidBlocks` call
/// [Repo-grounded — `types.rs::ValidationResult`].
type MermaidValidationResult =
    { FilesScanned: int
      BlocksScanned: int
      Violations: MermaidViolation list
      Warnings: MermaidWarning list }

/// The default validation options used by the CLI when no flags are
/// specified: `MaxLabelLen = 30`, `MaxWidth = 4`, `MaxDepth = Int32.MaxValue`
/// (the CLI's `0 = unlimited` sentinel, mapped once at the call site rather
/// than threaded as a magic `0` through the comparison logic below),
/// `MaxSubgraphNodes = 6`
/// [Repo-grounded — `validator.rs::default_validate_options`].
let defaultMermaidValidateOptions: MermaidValidateOptions =
    { MaxLabelLen = 30
      MaxWidth = 4
      MaxDepth = Int32.MaxValue
      MaxSubgraphNodes = 6 }

/// Extracts all ` ```mermaid ` / `~~~mermaid` code blocks from `content`, one
/// `MermaidBlock` per fenced block in document order. An unclosed block at
/// the end of the file is silently ignored
/// [Repo-grounded — `flowchart.rs::extract_blocks`].
let extractMermaidBlocks (filePath: string) (content: string) : MermaidBlock list =
    let lines = content.Split('\n')
    let blocks = ResizeArray<MermaidBlock>()
    let mutable inBlock = false
    let mutable sourceLines = ResizeArray<string>()
    let mutable blockIndex = 0
    let mutable startLine = 0

    for i in 0 .. lines.Length - 1 do
        let line = lines.[i]
        let trimmed = line.Trim()

        if not inBlock then
            if
                line.StartsWith("```mermaid", StringComparison.Ordinal)
                || line.StartsWith("~~~mermaid", StringComparison.Ordinal)
            then
                inBlock <- true
                sourceLines <- ResizeArray<string>()
                startLine <- i + 1
        elif trimmed = "```" || trimmed = "~~~" then
            blocks.Add
                { FilePath = filePath
                  BlockIndex = blockIndex
                  Source = String.Join("\n", sourceLines)
                  StartLine = startLine }

            blockIndex <- blockIndex + 1
            inBlock <- false
        else
            sourceLines.Add line

    blocks |> List.ofSeq

/// Detects the kind of a Mermaid diagram from its raw source. Blank lines and
/// `%%` comment lines (including `%%{init: ...}%%` directives) above the type
/// directive are skipped; the first remaining line is the header
/// [Repo-grounded — `diagram.rs::detect_kind`].
let private detectMermaidKind (source: string) : MermaidDiagramKind =
    let lines = source.Replace("\r\n", "\n").Split('\n')

    let rec loop i =
        if i >= lines.Length then
            OtherKind
        else
            let t = lines.[i].Trim()

            if t = "" || t.StartsWith("%%", StringComparison.Ordinal) then
                loop (i + 1)
            elif
                t.StartsWith("flowchart", StringComparison.Ordinal)
                || t.StartsWith("graph ", StringComparison.Ordinal)
                || t = "graph"
            then
                FlowchartKind
            elif
                t.StartsWith("stateDiagram-v2", StringComparison.Ordinal)
                || t.StartsWith("stateDiagram", StringComparison.Ordinal)
            then
                StateKind
            else
                OtherKind

    loop 0

/// Matches a `flowchart`/`graph` header line, capturing the optional
/// direction in group 3 — `RegexOptions.Multiline` makes `^`/`$` match line
/// boundaries within a whole block's source, mirroring the Rust regex's
/// `(?m)` flag [Repo-grounded — `flowchart.rs::flowchart_re`].
let private mermaidFlowchartLineRegex =
    Regex(@"^\s*(flowchart|graph)(\s+(TB|TD|BT|LR|RL))?\s*$", RegexOptions.Multiline ||| RegexOptions.Compiled)

/// Matches a `subgraph` header line [Repo-grounded — `flowchart.rs::subgraph_re`].
let private mermaidSubgraphHeaderRegex =
    Regex("^subgraph(?:\\s+([^\\s\\[\"]+))?(?:\\s*\\[\\s*\"?([^\"\\]]*)\"?\\s*\\])?\\s*$", RegexOptions.Compiled)

/// Matches Mermaid arrow/edge connectors [Repo-grounded — `flowchart.rs::arrow_re`].
let private mermaidArrowRegex =
    Regex(@"-->|---|-\.->|==>|--o|--x|<-->", RegexOptions.Compiled)

/// Matches edge labels of the form `-- text -->`
/// [Repo-grounded — `flowchart.rs::link_text_re`].
let private mermaidLinkTextRegex = Regex(@"--[^->\n]+?-->", RegexOptions.Compiled)

/// Matches a pipe-delimited edge label immediately following an arrow
/// (`-->|text|`) [Repo-grounded — `flowchart.rs::pipe_label_re`].
let private mermaidPipeLabelRegex =
    Regex(@"(-->|---|-\.->|==>|--o|--x|<-->)\s*\|[^|\n]*\|", RegexOptions.Compiled)

/// Matches a bare node identifier (word characters only)
/// [Repo-grounded — `flowchart.rs::node_id_re`].
let private mermaidNodeIdRegex = Regex(@"^(\w+)$", RegexOptions.Compiled)

/// All Mermaid node shape syntaxes, in match-priority order. Each pattern
/// captures `(id, label)` in groups 1 and 2
/// [Repo-grounded — `flowchart.rs::node_shape_patterns`].
let private mermaidNodeShapePatterns: Regex list =
    [ Regex(@"^(\w+)\(\(\(([^)]*)\)\)\)", RegexOptions.Compiled)
      Regex(@"^(\w+)\(\[([^\]]*)\]\)", RegexOptions.Compiled)
      Regex(@"^(\w+)\(\(([^)]*)\)\)", RegexOptions.Compiled)
      Regex(@"^(\w+)\[\[([^\]]*)\]\]", RegexOptions.Compiled)
      Regex(@"^(\w+)\[\(([^)]*)\)\]", RegexOptions.Compiled)
      Regex(@"^(\w+)\(([^)]*)\)", RegexOptions.Compiled)
      Regex(@"^(\w+)\{\{([^}]*)\}\}", RegexOptions.Compiled)
      Regex(@"^(\w+)\{([^}]*)\}", RegexOptions.Compiled)
      Regex(@"^(\w+)>([^\]]*)\]", RegexOptions.Compiled)
      Regex(@"^(\w+)\[/([^/]*)/\]", RegexOptions.Compiled)
      Regex(@"^(\w+)\[\\([^\\]*)\\]", RegexOptions.Compiled)
      Regex(@"^(\w+)\[([^\]]*)\]", RegexOptions.Compiled)
      Regex("^(\\w+)@\\{\\s*[^}]*label:\\s*\"([^\"]*)\"\\s*[^}]*\\}", RegexOptions.Compiled) ]

/// Strips surrounding quote characters (`"`, `'`, or `` ` ``) from a label
/// string [Repo-grounded — `flowchart.rs::normalize_label`].
let private normalizeMermaidLabel (s: string) : string =
    let s = s.Trim()

    if s.Length >= 2 then
        let first = s.[0]
        let last = s.[s.Length - 1]

        if
            (first = '"' && last = '"')
            || (first = '\'' && last = '\'')
            || (first = '`' && last = '`')
        then
            s.Substring(1, s.Length - 2)
        else
            s
    else
        s

/// Inserts a new node or updates an existing node's label in `nodeMap`,
/// keyed by position in `nodeIndex` [Repo-grounded — `flowchart.rs::upsert_node`].
let private upsertMermaidNode
    (nodeMap: ResizeArray<string * string>)
    (nodeIndex: Dictionary<string, int>)
    (id: string)
    (label: string)
    =
    match nodeIndex.TryGetValue id with
    | true, idx -> nodeMap.[idx] <- (id, label)
    | false, _ ->
        nodeIndex.[id] <- nodeMap.Count
        nodeMap.Add(id, label)

/// Extracts the node identifier from a single (non-`&`) segment. Returns an
/// empty string when no known shape pattern or bare identifier is recognised
/// [Repo-grounded — `flowchart.rs::extract_node_id_from_segment`].
let private extractMermaidNodeIdFromSegment (seg: string) : string =
    let seg = seg.Trim()

    if seg = "" then
        ""
    else
        let matched =
            mermaidNodeShapePatterns
            |> List.tryPick (fun re ->
                let m = re.Match(seg)
                if m.Success then Some m else None)

        match matched with
        | Some m -> m.Groups.[1].Value
        | None ->
            let m = mermaidNodeIdRegex.Match(seg)
            if m.Success then m.Groups.[1].Value else ""

/// Extracts node identifiers from a segment that may contain `&`-separated
/// groups [Repo-grounded — `flowchart.rs::extract_node_ids_from_segment`].
let private extractMermaidNodeIdsFromSegment (seg: string) : string list =
    seg.Split('&')
    |> Array.choose (fun sub ->
        let id = extractMermaidNodeIdFromSegment sub
        if id = "" then None else Some id)
    |> Array.toList

/// Extracts all node identifiers mentioned on `line`, handling both edge
/// lines (splitting on arrows) and standalone node lines
/// [Repo-grounded — `flowchart.rs::extract_all_node_ids`].
let private extractAllMermaidNodeIds (line: string) : string list =
    if mermaidArrowRegex.IsMatch line then
        mermaidArrowRegex.Split(line)
        |> Array.toList
        |> List.collect extractMermaidNodeIdsFromSegment
    else
        extractMermaidNodeIdsFromSegment line

/// Parses a standalone node declaration line (no arrow) and upserts it into
/// `nodeMap` [Repo-grounded — `flowchart.rs::extract_standalone_node`].
let private extractStandaloneMermaidNode
    (line: string)
    (nodeMap: ResizeArray<string * string>)
    (nodeIndex: Dictionary<string, int>)
    =
    let line = line.Trim()

    let matched =
        mermaidNodeShapePatterns
        |> List.tryPick (fun re ->
            let m = re.Match(line)
            if m.Success then Some m else None)

    match matched with
    | Some m -> upsertMermaidNode nodeMap nodeIndex m.Groups.[1].Value (normalizeMermaidLabel m.Groups.[2].Value)
    | None ->
        let m = mermaidNodeIdRegex.Match(line)

        if m.Success && not (nodeIndex.ContainsKey m.Groups.[1].Value) then
            upsertMermaidNode nodeMap nodeIndex m.Groups.[1].Value ""

/// Extracts a node identifier (and optional label) from `seg`, upserts it,
/// and returns the identifier string. Returns an empty string when
/// unrecognised
/// [Repo-grounded — `flowchart.rs::extract_node_id_and_label`].
let private extractMermaidNodeIdAndLabel
    (seg: string)
    (nodeMap: ResizeArray<string * string>)
    (nodeIndex: Dictionary<string, int>)
    : string =
    let matched =
        mermaidNodeShapePatterns
        |> List.tryPick (fun re ->
            let m = re.Match(seg)
            if m.Success then Some m else None)

    match matched with
    | Some m ->
        upsertMermaidNode nodeMap nodeIndex m.Groups.[1].Value (normalizeMermaidLabel m.Groups.[2].Value)
        m.Groups.[1].Value
    | None ->
        let m = mermaidNodeIdRegex.Match(seg)

        if m.Success then
            if not (nodeIndex.ContainsKey m.Groups.[1].Value) then
                upsertMermaidNode nodeMap nodeIndex m.Groups.[1].Value ""

            m.Groups.[1].Value
        else
            ""

/// Parses one arrow-separated segment which may contain `&`-separated node
/// references, upserts each node, and returns the list of identifiers
/// [Repo-grounded — `flowchart.rs::extract_node_group`].
let private extractMermaidNodeGroup
    (part: string)
    (nodeMap: ResizeArray<string * string>)
    (nodeIndex: Dictionary<string, int>)
    : string list =
    part.Split('&')
    |> Array.choose (fun seg ->
        let seg = seg.Trim()

        if seg = "" then
            None
        else
            let id = extractMermaidNodeIdAndLabel seg nodeMap nodeIndex
            if id = "" then None else Some id)
    |> Array.toList

/// Parses an edge line (containing at least one arrow), upserts all
/// referenced nodes, and appends cartesian-product edges for each `&`-group
/// pair [Repo-grounded — `flowchart.rs::extract_edge_line`].
let private extractMermaidEdgeLine
    (line: string)
    (nodeMap: ResizeArray<string * string>)
    (nodeIndex: Dictionary<string, int>)
    (edges: ResizeArray<MermaidEdge>)
    =
    let line = mermaidLinkTextRegex.Replace(line, "-->")
    let line = mermaidPipeLabelRegex.Replace(line, "$1")
    let parts = mermaidArrowRegex.Split(line)

    if parts.Length >= 2 then
        let groups =
            parts
            |> Array.choose (fun p ->
                let ids = extractMermaidNodeGroup p nodeMap nodeIndex
                if List.isEmpty ids then None else Some ids)

        for i in 0 .. groups.Length - 2 do
            for f in groups.[i] do
                for t in groups.[i + 1] do
                    edges.Add { From = f; To = t; Label = "" }

/// Extracts `(id, label)` from a `subgraph` header line. Falls back to an
/// empty id and the trimmed remainder as label when the regex does not match
/// [Repo-grounded — `flowchart.rs::parse_subgraph_header`].
let private parseMermaidSubgraphHeader (line: string) : string * string =
    let m = mermaidSubgraphHeaderRegex.Match(line)

    if m.Success then
        let id = if m.Groups.[1].Success then m.Groups.[1].Value else ""
        let label = if m.Groups.[2].Success then m.Groups.[2].Value else ""
        id, label
    else
        let rest = line.Substring("subgraph".Length).Trim().Trim('"')
        "", rest

/// Returns `ids` with duplicates removed, preserving first-occurrence order
/// [Repo-grounded — `flowchart.rs::dedup_order`].
let private dedupMermaidOrder (ids: string list) : string list =
    let seen = HashSet<string>()
    ids |> List.filter seen.Add

/// Collects node identifiers from `source` in the order they first appear,
/// filtered to only those present in `nodeIndex`
/// [Repo-grounded — `flowchart.rs::collect_node_order`].
let private collectMermaidNodeOrder (source: string) (nodeIndex: Dictionary<string, int>) : string list =
    let seen = HashSet<string>()
    let order = ResizeArray<string>()

    for raw in source.Split('\n') do
        let line = raw.Trim()

        if
            line <> ""
            && not (line.StartsWith("subgraph", StringComparison.Ordinal))
            && line <> "end"
            && not (mermaidFlowchartLineRegex.IsMatch line)
        then
            for id in extractAllMermaidNodeIds line do
                if nodeIndex.ContainsKey id && seen.Add id then
                    order.Add id

    // Sorted, not raw `Dictionary` key order — this fallback only fires
    // for node ids the line-by-line source scan above didn't already
    // capture; matches `flowchart.rs::collect_node_order`'s sorted
    // leftover loop (fixed alongside this port to eliminate Rust
    // `HashMap` iteration-order nondeterminism, Wave D integration).
    for k in nodeIndex.Keys |> Seq.sort do
        if seen.Add k then
            order.Add k

    order |> List.ofSeq

/// Parses a `MermaidBlock` into a `ParsedMermaidDiagram` and the number of
/// `flowchart`/`graph` headers found in the block. A count of `0` means the
/// block is not a flowchart; a count `> 1` indicates multiple diagrams
/// packed into one block, which is a violation
/// [Repo-grounded — `flowchart.rs::parse_diagram`].
let parseMermaidDiagram (block: MermaidBlock) : ParsedMermaidDiagram * int =
    let matches =
        mermaidFlowchartLineRegex.Matches(block.Source) |> Seq.cast<Match> |> List.ofSeq

    let count = matches.Length

    if count = 0 then
        { Block = block
          Direction = MermaidTB
          Nodes = []
          Edges = []
          Subgraphs = [] },
        0
    else
        let first = matches.[0]

        let dir =
            if first.Groups.[3].Success && first.Groups.[3].Value.Trim() <> "" then
                parseMermaidDirection (first.Groups.[3].Value.Trim())
            else
                MermaidTB

        let nodeMap = ResizeArray<string * string>()
        let nodeIndex = Dictionary<string, int>()
        let edges = ResizeArray<MermaidEdge>()
        let subgraphs = ResizeArray<MermaidSubgraph>()
        let stack = ResizeArray<MermaidSubgraph>()
        let lines = block.Source.Split('\n')

        for lineIdx in 0 .. lines.Length - 1 do
            let line = lines.[lineIdx].Trim()

            if line <> "" then
                if line.StartsWith("subgraph", StringComparison.Ordinal) then
                    let id, label = parseMermaidSubgraphHeader line

                    stack.Add
                        { Id = id
                          Label = label
                          NodeIds = []
                          StartLine = lineIdx + 1 }
                elif line = "end" then
                    if stack.Count > 0 then
                        let top = stack.[stack.Count - 1]
                        stack.RemoveAt(stack.Count - 1)
                        subgraphs.Add top
                elif mermaidFlowchartLineRegex.IsMatch line then
                    ()
                else
                    let before = HashSet<string>(nodeIndex.Keys)

                    if mermaidArrowRegex.IsMatch line then
                        extractMermaidEdgeLine line nodeMap nodeIndex edges
                    else
                        extractStandaloneMermaidNode line nodeMap nodeIndex

                    let newIds =
                        nodeIndex.Keys |> Seq.filter (fun k -> not (before.Contains k)) |> List.ofSeq

                    if not (List.isEmpty newIds) && stack.Count > 0 then
                        let topIdx = stack.Count - 1
                        let top = stack.[topIdx]
                        let mutable nodeIds = top.NodeIds

                        for id in dedupMermaidOrder newIds do
                            if not (List.contains id nodeIds) then
                                nodeIds <- nodeIds @ [ id ]

                        stack.[topIdx] <- { top with NodeIds = nodeIds }

        while stack.Count > 0 do
            let top = stack.[stack.Count - 1]
            stack.RemoveAt(stack.Count - 1)
            subgraphs.Add top

        let order = collectMermaidNodeOrder block.Source nodeIndex
        let nodeMapList = nodeMap |> List.ofSeq

        let nodes =
            order
            |> List.map (fun id ->
                let label =
                    nodeMapList
                    |> List.tryFind (fun (k, _) -> k = id)
                    |> Option.map snd
                    |> Option.defaultValue ""

                { Id = id; Label = label })

        { Block = block
          Direction = dir
          Nodes = nodes
          Edges = edges |> List.ofSeq
          Subgraphs = subgraphs |> List.ofSeq },
        count

/// Counts Unicode scalar values in `s`, treating a surrogate pair as one
/// unit. `String.Length` counts UTF-16 code units, so an astral character
/// (any emoji) would otherwise count as two where Rust's `chars().count()`
/// counts one — making a 30-scalar label measure 31 and trip a budget it
/// does not actually exceed
/// [Repo-grounded — matches `str::chars().count()`].
let private unicodeScalarCount (s: string) : int =
    let mutable count = 0
    let mutable i = 0

    while i < s.Length do
        i <- i + (if Char.IsSurrogatePair(s, i) then 2 else 1)
        count <- count + 1

    count

/// Returns the effective display length of `label` after normalising
/// line-break tokens (`<br/>`, `<BR/>`, `<br>`, `<BR>`, `\n`) to actual
/// newlines — the maximum character count across all resulting lines
/// [Repo-grounded — `graph.rs::effective_label_len`].
let effectiveMermaidLabelLen (label: string) : int =
    if label = "" then
        0
    else
        let normalized =
            label
                .Replace("<br/>", "\n")
                .Replace("<BR/>", "\n")
                .Replace("<br>", "\n")
                .Replace("<BR>", "\n")
                .Replace("\\n", "\n")

        normalized.Split('\n') |> Array.map unicodeScalarCount |> Array.max

/// Assigns a rank (depth level) to each node using a topological-sort-based
/// longest-path algorithm. Cycles are handled by first removing back edges
/// (detected via an iterative DFS in node-declaration order), then ranking
/// the remaining DAG. Disconnected nodes are assigned rank `0`. Returns an
/// empty map when `nodes` is empty
/// [Repo-grounded — `graph.rs::rank_assign`].
let private mermaidRankAssign (nodes: MermaidNode list) (edges: MermaidEdge list) : Dictionary<string, int64> =
    let rank = Dictionary<string, int64>()

    // Coverage note: both public callers (mermaidMaxWidth, mermaidDepth,
    // just below) already check `List.isEmpty nodes` themselves and
    // short-circuit before ever calling this function — so `nodes` is always
    // non-empty here. Kept for defensiveness in case a future caller skips
    // that check.
    if List.isEmpty nodes then
        rank
    else
        let nodeSet = HashSet<string>(nodes |> List.map (fun n -> n.Id))
        let adj = Dictionary<string, ResizeArray<string>>()

        for n in nodes do
            adj.[n.Id] <- ResizeArray<string>()

        for e in edges do
            if nodeSet.Contains e.From && nodeSet.Contains e.To then
                adj.[e.From].Add e.To

        // Pass 1: detect back edges via iterative DFS
        // (0/absent=white, 1=gray, 2=black), visiting unvisited nodes in
        // declaration order so the result is deterministic.
        let color = Dictionary<string, int>()
        let backEdges = HashSet<string * string>()

        for start in nodes do
            let startColor = if color.ContainsKey start.Id then color.[start.Id] else 0

            if startColor = 0 then
                let stack = ResizeArray<string * int>()
                stack.Add(start.Id, 0)
                color.[start.Id] <- 1

                while stack.Count > 0 do
                    let cur, idx = stack.[stack.Count - 1]
                    stack.RemoveAt(stack.Count - 1)

                    // Coverage note: `adj` is pre-populated with an entry for
                    // every node in `nodes` (the `for n in nodes do adj.[n.Id]
                    // <- ResizeArray<string>()` loop above), and `cur` here is
                    // always either `start.Id` (a real node) or a `next`
                    // value that was itself checked against `nodeSet` before
                    // being added to any adjacency list — so `cur` is always
                    // a key of `adj`. The `else` fallback below is
                    // unreachable.
                    let neighbors =
                        if adj.ContainsKey cur then
                            adj.[cur]
                        else
                            ResizeArray<string>()

                    if idx < neighbors.Count then
                        let next = neighbors.[idx]
                        stack.Add(cur, idx + 1)
                        let nextColor = if color.ContainsKey next then color.[next] else 0

                        if nextColor = 1 then
                            backEdges.Add(cur, next) |> ignore
                        elif nextColor = 0 then
                            color.[next] <- 1
                            stack.Add(next, 0)
                    else
                        color.[cur] <- 2

        // Pass 2: Kahn's longest-path ranking on the DAG that remains after
        // dropping the back edges.
        let inDegree = Dictionary<string, int>()

        for n in nodes do
            inDegree.[n.Id] <- 0

        for kv in adj do
            for t in kv.Value do
                if not (backEdges.Contains(kv.Key, t)) then
                    inDegree.[t] <- (if inDegree.ContainsKey t then inDegree.[t] else 0) + 1

        let visited = HashSet<string>()
        let queue = Queue<string>()

        for n in nodes do
            if inDegree.[n.Id] = 0 then
                queue.Enqueue n.Id
                rank.[n.Id] <- 0L

        while queue.Count > 0 do
            let cur = queue.Dequeue()
            visited.Add cur |> ignore
            let curRank = if rank.ContainsKey cur then rank.[cur] else 0L

            // Coverage note: same reasoning as the DFS pass above — `cur`
            // here is always a key already dequeued from `queue`, which only
            // ever holds node ids from `nodes`, all present as `adj` keys.
            let neighbors =
                if adj.ContainsKey cur then
                    adj.[cur]
                else
                    ResizeArray<string>()

            for next in neighbors do
                if not (backEdges.Contains(cur, next)) then
                    let existing = if rank.ContainsKey next then rank.[next] else 0L

                    if curRank + 1L > existing then
                        rank.[next] <- curRank + 1L

                    inDegree.[next] <- inDegree.[next] - 1

                    if inDegree.[next] = 0 then
                        queue.Enqueue next

        // Coverage note: after Pass 1 strips every back edge via DFS, the
        // remaining graph (`adj` minus `backEdges`) is a true DAG spanning
        // all of `nodes` — Kahn's algorithm on a genuine DAG always
        // terminates having visited and ranked every node (a DAG always has
        // at least one in-degree-0 node, and removing it inductively leaves
        // a smaller DAG). No input this module can construct from a parsed
        // mermaid diagram (including cycles, self-loops, and duplicate
        // edges — all checked by hand) leaves a node both unvisited and
        // unranked, so this fallback is unreachable in practice; kept as a
        // safety net against a future change to the ranking algorithm.
        for n in nodes do
            if not (visited.Contains n.Id) && not (rank.ContainsKey n.Id) then
                rank.[n.Id] <- 0L

        rank

/// Returns the maximum number of nodes sharing the same rank (diagram
/// width). Returns `0` when there are no nodes
/// [Repo-grounded — `graph.rs::max_width`].
let mermaidMaxWidth (nodes: MermaidNode list) (edges: MermaidEdge list) : int =
    if List.isEmpty nodes then
        0
    else
        let ranks = mermaidRankAssign nodes edges
        ranks.Values |> Seq.countBy id |> Seq.map snd |> Seq.max

/// Returns the number of distinct rank levels in the diagram (diagram
/// depth). Returns `0` when there are no nodes
/// [Repo-grounded — `graph.rs::depth`].
let mermaidDepth (nodes: MermaidNode list) (edges: MermaidEdge list) : int =
    if List.isEmpty nodes then
        0
    else
        let ranks = mermaidRankAssign nodes edges
        ranks.Values |> Seq.distinct |> Seq.length

/// Parses `FROM --> TO` or `FROM --> TO : label`, returning
/// `(from, to, label)`. Returns `None` when either side is empty after
/// trimming or when the line has no `-->` arrow
/// [Repo-grounded — `state.rs::parse_arrow`].
let private parseMermaidStateArrow (line: string) : (string * string * string) option =
    let idx = line.IndexOf("-->", StringComparison.Ordinal)

    // Coverage note: parseMermaidStateArrow's sole caller (parseMermaidState,
    // just below) only invokes it inside an `elif line.Contains("-->")`
    // branch, so `idx` is always >= 0 here. Unreachable via that caller.
    if idx < 0 then
        None
    else
        let from = line.Substring(0, idx).Trim()
        let rhs = line.Substring(idx + 3).Trim()

        let toPart, label =
            let spaceColonSpace = rhs.IndexOf(" : ", StringComparison.Ordinal)

            if spaceColonSpace >= 0 then
                rhs.Substring(0, spaceColonSpace).Trim(), rhs.Substring(spaceColonSpace + 3).Trim()
            else
                let colonSpace = rhs.IndexOf(": ", StringComparison.Ordinal)

                if colonSpace >= 0 then
                    rhs.Substring(0, colonSpace).Trim(), rhs.Substring(colonSpace + 2).Trim()
                else
                    rhs, ""

        if from = "" || toPart = "" then
            None
        else
            Some(from, toPart, label)

/// Parses a `stateDiagram-v2`/`stateDiagram` block into a
/// `ParsedMermaidDiagram`. Handles: header skip, `%%`/`#` comment skip,
/// `direction` keyword, `FROM --> TO`/`FROM --> TO : label` edges, and
/// `state "label" as ID` aliases — the latter added to match a real
/// repository fixture (`apps/rhino-cli/tests/fixtures/state/03-long-state-label.md`)
/// exercised by a repo-wide `md mermaid validate` scan; composite
/// `state X { }` blocks, `ID : description` lines, and pseudostate
/// stereotypes remain Rust-source features with no scenario coverage here,
/// so they are intentionally not ported
/// [Repo-grounded — `state.rs::parse_state`, `state.rs::parse_state_as`].
/// Parses `state "label" as ID`, returning `(id, label)`
/// [Repo-grounded — `state.rs::parse_state_as`].
let private parseMermaidStateAs (line: string) : (string * string) option =
    if line.StartsWith("state \"", StringComparison.Ordinal) then
        let rest = line.Substring("state \"".Length)
        let quoteEnd = rest.IndexOf('"')

        if quoteEnd < 0 then
            None
        else
            let label = rest.Substring(0, quoteEnd)
            let after = rest.Substring(quoteEnd + 1).Trim()

            if after.StartsWith("as ", StringComparison.Ordinal) then
                let id = after.Substring("as ".Length).Trim()
                if id = "" then None else Some(id, label)
            else
                None
    else
        None

let private parseMermaidState (block: MermaidBlock) : ParsedMermaidDiagram =
    let mutable direction = MermaidTB
    let nodeOrder = ResizeArray<string>()
    let nodeLabels = Dictionary<string, string>()
    let edges = ResizeArray<MermaidEdge>()

    let ensureNode (id: string) (label: string) =
        if not (nodeLabels.ContainsKey id) then
            nodeOrder.Add id
            nodeLabels.[id] <- label

    for raw in block.Source.Split('\n') do
        let line = raw.Trim()

        if line <> "" then
            if
                line.StartsWith("stateDiagram-v2", StringComparison.Ordinal)
                || line.StartsWith("stateDiagram", StringComparison.Ordinal)
            then
                ()
            elif
                line.StartsWith("%%", StringComparison.Ordinal)
                || line.StartsWith("#", StringComparison.Ordinal)
            then
                ()
            elif line = "--" then
                ()
            elif line.StartsWith("direction ", StringComparison.Ordinal) then
                let rest = line.Substring("direction ".Length).Trim()

                direction <-
                    match rest with
                    | "LR" -> MermaidLR
                    | "RL" -> MermaidRL
                    | "BT" -> MermaidBT
                    | _ -> MermaidTB
            elif line.Contains("-->") then
                match parseMermaidStateArrow line with
                | Some(from, toId, label) ->
                    ensureNode from from
                    ensureNode toId toId

                    edges.Add
                        { From = from
                          To = toId
                          Label = label }
                | None -> ()
            elif line.StartsWith("state \"", StringComparison.Ordinal) then
                match parseMermaidStateAs line with
                | Some(id, label) -> ensureNode id label
                | None -> ()

    let nodes =
        nodeOrder
        |> Seq.map (fun id -> { Id = id; Label = nodeLabels.[id] })
        |> List.ofSeq

    { Block = block
      Direction = direction
      Nodes = nodes
      Edges = edges |> List.ofSeq
      Subgraphs = [] }

/// Checks node and edge labels for length violations
/// [Repo-grounded — `validator.rs::check_labels`].
let private checkMermaidLabels
    (diagram: ParsedMermaidDiagram)
    (opts: MermaidValidateOptions)
    (fp: string)
    (bi: int)
    (sl: int)
    : MermaidViolation list =
    let nodeViolations =
        diagram.Nodes
        |> List.choose (fun node ->
            let len = effectiveMermaidLabelLen node.Label

            if len > opts.MaxLabelLen then
                Some
                    { Kind = MermaidLabelTooLong
                      FilePath = fp
                      BlockIndex = bi
                      StartLine = sl
                      NodeId = node.Id
                      LabelText = node.Label
                      LabelLen = len
                      MaxLabelLen = opts.MaxLabelLen
                      ActualWidth = 0
                      MaxWidth = 0 }
            else
                None)

    let edgeViolations =
        diagram.Edges
        |> List.choose (fun edge ->
            if edge.Label = "" then
                None
            else
                let len = effectiveMermaidLabelLen edge.Label

                if len > opts.MaxLabelLen then
                    Some
                        { Kind = MermaidLabelTooLong
                          FilePath = fp
                          BlockIndex = bi
                          StartLine = sl
                          NodeId = sprintf "%s-->%s" edge.From edge.To
                          LabelText = edge.Label
                          LabelLen = len
                          MaxLabelLen = opts.MaxLabelLen
                          ActualWidth = 0
                          MaxWidth = 0 }
                else
                    None)

    nodeViolations @ edgeViolations

/// Checks a parsed diagram's width/depth against `opts`, returning the
/// `WidthExceeded` violation or `ComplexDiagram` warning (mutually
/// exclusive: the warning wins when both thresholds are exceeded)
/// [Repo-grounded — `validator.rs::validate_one_block`'s span/depth branch].
let private checkMermaidWidthAndDepth
    (diagram: ParsedMermaidDiagram)
    (opts: MermaidValidateOptions)
    (fp: string)
    (bi: int)
    (sl: int)
    : MermaidViolation list * MermaidWarning list =
    let span = mermaidMaxWidth diagram.Nodes diagram.Edges
    let dep = mermaidDepth diagram.Nodes diagram.Edges

    let horizontal, vertical =
        match diagram.Direction with
        | MermaidLR
        | MermaidRL -> dep, span
        | _ -> span, dep

    if horizontal > opts.MaxWidth && vertical > opts.MaxDepth then
        [],
        [ { Kind = MermaidComplexDiagram
            FilePath = fp
            BlockIndex = bi
            StartLine = sl
            ActualWidth = horizontal
            ActualDepth = vertical
            MaxWidth = opts.MaxWidth
            MaxDepth = opts.MaxDepth
            SubgraphLabel = ""
            SubgraphNodeCount = 0
            MaxSubgraphNodes = 0 } ]
    elif horizontal > opts.MaxWidth then
        [ { Kind = MermaidWidthExceeded
            FilePath = fp
            BlockIndex = bi
            StartLine = sl
            NodeId = ""
            LabelText = ""
            LabelLen = 0
            MaxLabelLen = 0
            ActualWidth = horizontal
            MaxWidth = opts.MaxWidth } ],
        []
    else
        [], []

/// Validates a single `MermaidBlock`, returning its violations and warnings
/// [Repo-grounded — `validator.rs::validate_one_block`].
let private validateOneMermaidBlock
    (block: MermaidBlock)
    (opts: MermaidValidateOptions)
    : MermaidViolation list * MermaidWarning list =
    let fp = block.FilePath
    let bi = block.BlockIndex
    let sl = block.StartLine

    match detectMermaidKind block.Source with
    | OtherKind -> [], []
    | FlowchartKind ->
        let diagram, count = parseMermaidDiagram block

        let multiViolation =
            if count > 1 then
                [ { Kind = MermaidMultipleDiagrams
                    FilePath = fp
                    BlockIndex = bi
                    StartLine = sl
                    NodeId = ""
                    LabelText = ""
                    LabelLen = 0
                    MaxLabelLen = 0
                    ActualWidth = 0
                    MaxWidth = 0 } ]
            else
                []

        if count = 0 then
            [], []
        else
            let labelViolations = checkMermaidLabels diagram opts fp bi sl
            let widthViolations, warnings = checkMermaidWidthAndDepth diagram opts fp bi sl

            let subgraphWarnings =
                if opts.MaxSubgraphNodes > 0 then
                    diagram.Subgraphs
                    |> List.choose (fun sg ->
                        if sg.NodeIds.Length > opts.MaxSubgraphNodes then
                            Some
                                { Kind = MermaidSubgraphDense
                                  FilePath = fp
                                  BlockIndex = bi
                                  StartLine = sl + sg.StartLine
                                  ActualWidth = 0
                                  ActualDepth = 0
                                  MaxWidth = 0
                                  MaxDepth = 0
                                  SubgraphLabel = sg.Label
                                  SubgraphNodeCount = sg.NodeIds.Length
                                  MaxSubgraphNodes = opts.MaxSubgraphNodes }
                        else
                            None)
                else
                    []

            multiViolation @ labelViolations @ widthViolations, warnings @ subgraphWarnings
    | StateKind ->
        let diagram = parseMermaidState block
        let labelViolations = checkMermaidLabels diagram opts fp bi sl
        let widthViolations, warnings = checkMermaidWidthAndDepth diagram opts fp bi sl
        labelViolations @ widthViolations, warnings

/// Validates all `blocks` against `opts` and returns an aggregated
/// `MermaidValidationResult`. `FilesScanned` counts unique file paths across
/// `blocks` — a file that yielded zero blocks never appears here, matching
/// the Rust source's `file_set` (files that produced at least one block)
/// [Repo-grounded — `validator.rs::validate_blocks`].
let validateMermaidBlocks (blocks: MermaidBlock list) (opts: MermaidValidateOptions) : MermaidValidationResult =
    let filesSeen = HashSet<string>(blocks |> List.map (fun b -> b.FilePath))

    let violations, warnings =
        blocks
        |> List.fold
            (fun (accV, accW) block ->
                let v, w = validateOneMermaidBlock block opts
                accV @ v, accW @ w)
            ([], [])

    { FilesScanned = filesSeen.Count
      BlocksScanned = blocks.Length
      Violations = violations
      Warnings = warnings }

/// Directory names skipped during the mermaid validator's recursive markdown
/// file collection — the standardized cross-repo noise-skip set shared by
/// the markdown gate validators (mermaid, links, heading-hierarchy) in the
/// Rust source, though each validator's own constant lists a slightly
/// different subset — this one matches `md_validate_mermaid.rs::SKIP_DIRS`
/// exactly rather than reusing `linksSkipDirs` above
/// [Repo-grounded — `md_validate_mermaid.rs::SKIP_DIRS`].
let private mermaidSkipDirs: Set<string> =
    Set.ofList
        [ "node_modules"
          "dist"
          "target"
          ".next"
          "coverage"
          "generated-reports"
          "local-tmp"
          "archived"
          "apps-labs"
          "worktrees"
          ".terraform"
          "generated-contracts"
          ".nx"
          ".git" ]

/// Options controlling `validateMermaidDocs`'s file-selection behaviour.
/// `Paths`, when non-empty, restricts the scan to those repository-relative
/// (or absolute) subtrees — mirrors `md_validate_mermaid.rs::collect_md_files`.
/// `StagedFiles`/`ChangedFiles`, when `Some`, are the literal repository-
/// relative paths to scan in place of a walk, following `LinkScanOptions`'s
/// precedent of taking the file list as a pure parameter rather than
/// shelling out to git
/// [Repo-grounded — `md_validate_mermaid.rs::run`, `ValidateMermaidArgs`].
type MermaidScanOptions =
    { RepoRoot: string
      Paths: string list
      StagedFiles: string list option
      ChangedFiles: string list option
      ExcludePrefixes: string list
      Options: MermaidValidateOptions }

/// Filters `files` to those whose repository-relative path does not start
/// with any of the `exclude` prefixes. An empty `exclude` list, or an
/// individual empty prefix within it, excludes nothing
/// [Repo-grounded — `md_validate_mermaid.rs::apply_excludes`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private applyMermaidExcludes (repoRoot: string) (files: string list) (exclude: string list) : string list =
    if List.isEmpty exclude then
        files
    else
        files
        |> List.filter (fun f ->
            let rel = Path.GetRelativePath(repoRoot, f).Replace('\\', '/')

            not (
                exclude
                |> List.exists (fun e ->
                    let prefix = e.TrimEnd('/')

                    if prefix = "" then
                        false
                    else
                        rel = prefix || rel.StartsWith(prefix + "/", StringComparison.Ordinal))
            ))

/// Selects the absolute paths of markdown files to scan per `opts`: the
/// literal staged/changed list when set, `opts.Paths`-restricted subtrees
/// when non-empty, otherwise a full repository walk
/// [Repo-grounded — `md_validate_mermaid.rs::run`'s file-selection `if`/`else`
/// chain].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private collectMermaidFiles (opts: MermaidScanOptions) : string list =
    match opts.StagedFiles, opts.ChangedFiles with
    | Some staged, _ ->
        staged
        |> List.filter (fun f -> f.EndsWith(".md", StringComparison.Ordinal))
        |> List.map (fun f -> Path.Combine(opts.RepoRoot, f))
    | None, Some changed ->
        changed
        |> List.filter (fun f -> f.EndsWith(".md", StringComparison.Ordinal))
        |> List.map (fun f -> Path.Combine(opts.RepoRoot, f))
    | None, None when not (List.isEmpty opts.Paths) ->
        opts.Paths
        |> List.collect (fun p ->
            let abs =
                if Path.IsPathRooted p then
                    p
                else
                    Path.Combine(opts.RepoRoot, p)

            collectFilesSkipping mermaidSkipDirs abs)
        |> List.filter (fun p -> p.EndsWith(".md", StringComparison.Ordinal))
    | None, None ->
        collectFilesSkipping mermaidSkipDirs opts.RepoRoot
        |> List.filter (fun p -> p.EndsWith(".md", StringComparison.Ordinal))

/// Validates every Mermaid diagram block reachable from `opts`, per its
/// path/staged/changed/exclude filters
/// [Repo-grounded — `md_validate_mermaid.rs::run`].
///
/// Gherkin (binds) — this function backs all of
/// `specs/apps/rhino/cli/behaviours/md/docs-validate-mermaid.feature`'s
/// 39 scenarios; see `MdSteps.fs`'s `docs-validate-mermaid.feature` section
/// for the per-scenario step-definition bindings.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let validateMermaidDocs (opts: MermaidScanOptions) : MermaidValidationResult =
    let files =
        applyMermaidExcludes opts.RepoRoot (collectMermaidFiles opts) opts.ExcludePrefixes

    let blocks =
        files
        |> List.collect (fun f ->
            if File.Exists f then
                extractMermaidBlocks f (File.ReadAllText f)
            else
                [])

    validateMermaidBlocks blocks opts.Options

/// Validates Mermaid blocks from an in-memory repository while preserving
/// the public command's path, staged/changed, and exclusion precedence.
let validateMermaidDocuments
    (documents: (string * string) list)
    (paths: string list)
    (stagedFiles: string list option)
    (changedFiles: string list option)
    (excludePrefixes: string list)
    (options: MermaidValidateOptions)
    : MermaidValidationResult =
    let normalize (path: string) : string = path.Replace('\\', '/').TrimStart('/')

    let isWithin (prefix: string) (path: string) : bool =
        let normalizedPrefix = normalize prefix |> fun value -> value.TrimEnd('/')
        let normalizedPath = normalize path

        normalizedPrefix = ""
        || normalizedPath = normalizedPrefix
        || normalizedPath.StartsWith(normalizedPrefix + "/", StringComparison.Ordinal)

    let selected =
        match stagedFiles, changedFiles with
        | Some staged, _ ->
            let selectedPaths = staged |> List.map normalize |> Set.ofList

            documents
            |> List.filter (fun (path, _) -> selectedPaths.Contains(normalize path))
        | None, Some changed ->
            let selectedPaths = changed |> List.map normalize |> Set.ofList

            documents
            |> List.filter (fun (path, _) -> selectedPaths.Contains(normalize path))
        | None, None when not (List.isEmpty paths) ->
            documents
            |> List.filter (fun (path, _) -> paths |> List.exists (fun prefix -> isWithin prefix path))
        | None, None -> documents

    selected
    |> List.filter (fun (path, _) -> path.EndsWith(".md", StringComparison.Ordinal))
    |> List.filter (fun (path, _) ->
        excludePrefixes
        |> List.forall (fun prefix -> prefix.Trim('/') = "" || not (isWithin prefix path)))
    |> List.collect (fun (path, content) -> extractMermaidBlocks (normalize path) content)
    |> fun blocks -> validateMermaidBlocks blocks options

/// Returns a human-readable description of a single violation
/// [Repo-grounded — `reporter.rs::violation_detail`].
let private mermaidViolationDetail (v: MermaidViolation) : string =
    match v.Kind with
    | MermaidLabelTooLong ->
        sprintf
            "[%s] node \"%s\" label \"%s\" is %d chars (max %d)"
            (mermaidViolationKindCode v.Kind)
            v.NodeId
            v.LabelText
            v.LabelLen
            v.MaxLabelLen
    | MermaidWidthExceeded ->
        sprintf "[%s] span %d exceeds max-width %d" (mermaidViolationKindCode v.Kind) v.ActualWidth v.MaxWidth
    | MermaidMultipleDiagrams ->
        sprintf "[%s] block contains multiple flowchart/graph headers" (mermaidViolationKindCode v.Kind)

/// Returns a human-readable description of a single warning
/// [Repo-grounded — `reporter.rs::warning_detail`].
let private mermaidWarningDetail (w: MermaidWarning) : string =
    match w.Kind with
    | MermaidSubgraphDense ->
        let label =
            if w.SubgraphLabel = "" then
                "(unnamed)"
            else
                w.SubgraphLabel

        sprintf
            "[%s] subgraph \"%s\" has %d children; recommend \u2264 %d for mobile rendering"
            (mermaidWarningKindCode w.Kind)
            label
            w.SubgraphNodeCount
            w.MaxSubgraphNodes
    | MermaidComplexDiagram ->
        sprintf
            "[%s] span %d (max %d) and depth %d (max %d) both exceeded"
            (mermaidWarningKindCode w.Kind)
            w.ActualWidth
            w.MaxWidth
            w.ActualDepth
            w.MaxDepth

/// Formats a `MermaidValidationResult` as human-readable text. When `quiet`
/// is `true` and there are no findings, returns an empty string. Per-file
/// detail lines are included when `verbose` is `true` or there are findings
/// [Repo-grounded — `reporter.rs::format_text`].
let formatMermaidText (result: MermaidValidationResult) (verbose: bool) (quiet: bool) : string =
    let hasFindings =
        not (List.isEmpty result.Violations) || not (List.isEmpty result.Warnings)

    if quiet && not hasFindings then
        ""
    else
        let sb = Text.StringBuilder()

        if verbose || hasFindings then
            let fileViolations =
                result.Violations |> List.groupBy (fun v -> v.FilePath) |> Map.ofList

            let fileWarnings =
                result.Warnings |> List.groupBy (fun w -> w.FilePath) |> Map.ofList

            let fileSet =
                Set.union
                    (fileViolations |> Map.toList |> List.map fst |> Set.ofList)
                    (fileWarnings |> Map.toList |> List.map fst |> Set.ofList)

            for fp in fileSet do
                let vs = fileViolations |> Map.tryFind fp |> Option.defaultValue []
                let ws = fileWarnings |> Map.tryFind fp |> Option.defaultValue []

                if not (List.isEmpty vs) then
                    sb.Append(sprintf "[FAIL] %s\n" fp) |> ignore
                elif not (List.isEmpty ws) then
                    sb.Append(sprintf "[WARN] %s\n" fp) |> ignore
                else
                    // Coverage note: fileSet is the union of fileViolations's and
                    // fileWarnings's map keys, so any fp drawn from fileSet was a
                    // key in at least one of those two maps. Looking that same fp
                    // back up via Map.tryFind on those same two maps therefore
                    // guarantees at least one of vs/ws is non-empty — the "both
                    // empty" precondition needed to reach this [OK] branch is
                    // structurally impossible.
                    sb.Append(sprintf "[OK] %s\n" fp) |> ignore

                for v in vs do
                    sb.Append(sprintf "  block %d (line %d): %s\n" v.BlockIndex v.StartLine (mermaidViolationDetail v))
                    |> ignore

                for w in ws do
                    sb.Append(sprintf "  block %d (line %d): %s\n" w.BlockIndex w.StartLine (mermaidWarningDetail w))
                    |> ignore

        sb.Append(
            sprintf
                "Found %d violation(s) and %d warning(s) in %d file(s) (%d block(s) scanned).\n"
                result.Violations.Length
                result.Warnings.Length
                result.FilesScanned
                result.BlocksScanned
        )
        |> ignore

        sb.ToString()

/// Formats the validation result as a Markdown table. Returns a single-line
/// "all passed" message when there are no findings
/// [Repo-grounded — `reporter.rs::format_markdown`].
let formatMermaidMarkdown (result: MermaidValidationResult) : string =
    if List.isEmpty result.Violations && List.isEmpty result.Warnings then
        sprintf "All %d block(s) in %d file(s) passed mermaid validation.\n" result.BlocksScanned result.FilesScanned
    else
        let sb = Text.StringBuilder()
        sb.Append("| File | Block | Line | Severity | Kind | Detail |\n") |> ignore
        sb.Append("|------|-------|------|----------|------|--------|\n") |> ignore

        for v in result.Violations do
            sb.Append(
                sprintf
                    "| %s | %d | %d | error | %s | %s |\n"
                    v.FilePath
                    v.BlockIndex
                    v.StartLine
                    (mermaidViolationKindCode v.Kind)
                    (mermaidViolationDetail v)
            )
            |> ignore

        for w in result.Warnings do
            sb.Append(
                sprintf
                    "| %s | %d | %d | warning | %s | %s |\n"
                    w.FilePath
                    w.BlockIndex
                    w.StartLine
                    (mermaidWarningKindCode w.Kind)
                    (mermaidWarningDetail w)
            )
            |> ignore

        sb.ToString()

/// Serialises the validation result to a pretty-printed JSON string, one
/// object per violation/warning with `camelCase` field names
/// [Repo-grounded — `reporter.rs::format_json`].
let formatMermaidJson (result: MermaidValidationResult) : string =
    let violationNode (v: MermaidViolation) : JsonNode =
        let node = JsonObject()
        node.["kind"] <- JsonValue.Create(mermaidViolationKindCode v.Kind)
        node.["filePath"] <- JsonValue.Create(v.FilePath)
        node.["blockIndex"] <- JsonValue.Create(v.BlockIndex)
        node.["startLine"] <- JsonValue.Create(v.StartLine)

        if v.NodeId <> "" then
            node.["nodeId"] <- JsonValue.Create(v.NodeId)

        if v.LabelText <> "" then
            node.["labelText"] <- JsonValue.Create(v.LabelText)

        if v.LabelLen <> 0 then
            node.["labelLen"] <- JsonValue.Create(v.LabelLen)

        if v.MaxLabelLen <> 0 then
            node.["maxLabelLen"] <- JsonValue.Create(v.MaxLabelLen)

        if v.ActualWidth <> 0 then
            node.["actualWidth"] <- JsonValue.Create(v.ActualWidth)

        if v.MaxWidth <> 0 then
            node.["maxWidth"] <- JsonValue.Create(v.MaxWidth)

        node :> JsonNode

    let warningNode (w: MermaidWarning) : JsonNode =
        let node = JsonObject()
        node.["kind"] <- JsonValue.Create(mermaidWarningKindCode w.Kind)
        node.["filePath"] <- JsonValue.Create(w.FilePath)
        node.["blockIndex"] <- JsonValue.Create(w.BlockIndex)
        node.["startLine"] <- JsonValue.Create(w.StartLine)

        if w.ActualWidth <> 0 then
            node.["actualWidth"] <- JsonValue.Create(w.ActualWidth)

        if w.ActualDepth <> 0 then
            node.["actualDepth"] <- JsonValue.Create(w.ActualDepth)

        if w.MaxWidth <> 0 then
            node.["maxWidth"] <- JsonValue.Create(w.MaxWidth)

        if w.MaxDepth <> 0 then
            node.["maxDepth"] <- JsonValue.Create(w.MaxDepth)

        if w.SubgraphLabel <> "" then
            node.["subgraphLabel"] <- JsonValue.Create(w.SubgraphLabel)

        if w.SubgraphNodeCount <> 0 then
            node.["subgraphNodeCount"] <- JsonValue.Create(w.SubgraphNodeCount)

        if w.MaxSubgraphNodes <> 0 then
            node.["maxSubgraphNodes"] <- JsonValue.Create(w.MaxSubgraphNodes)

        node :> JsonNode

    let root = JsonObject()
    root.["filesScanned"] <- JsonValue.Create(result.FilesScanned)
    root.["blocksScanned"] <- JsonValue.Create(result.BlocksScanned)
    root.["violations"] <- JsonArray(result.Violations |> List.map violationNode |> Array.ofList)
    root.["warnings"] <- JsonArray(result.Warnings |> List.map warningNode |> Array.ofList)

    let options = JsonSerializerOptions()
    options.WriteIndented <- true
    options.Encoder <- JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    root.ToJsonString(options)

// ---------------------------------------------------------------------------
// docs validate-naming
// ---------------------------------------------------------------------------

/// Regex accepting valid lowercase-kebab-case markdown filenames
/// [Repo-grounded — `naming.rs::kebab_case_re`].
let private kebabCaseRegex = Regex(@"^[a-z0-9-]+\.md$", RegexOptions.Compiled)

/// Translates a `glob`-crate-style pattern (`*`, `?`, `[...]`) into an
/// anchored regex matching a bare filename — .NET has no built-in bare-glob
/// matcher, so this hand-rolls the small subset `--exempt` patterns actually
/// use (`*__linkedin__*.md`, exact names, etc.) [Repo-grounded — the `glob`
/// crate's `Pattern` semantics as used by `naming.rs::is_naming_exempt`].
let private globToRegex (pattern: string) : Regex =
    let sb = Text.StringBuilder("^")

    for c in pattern do
        match c with
        | '*' -> sb.Append(".*") |> ignore
        | '?' -> sb.Append(".") |> ignore
        | c -> sb.Append(Regex.Escape(string<char> c)) |> ignore

    sb.Append("$") |> ignore
    Regex(sb.ToString(), RegexOptions.Compiled)

/// Returns `true` when `basename` matches any pattern in `exemptGlobs`
/// [Repo-grounded — `naming.rs::is_naming_exempt`'s glob loop].
let private matchesAnyExemptGlob (exemptGlobs: string list) (basename: string) : bool =
    exemptGlobs |> List.exists (fun pat -> (globToRegex pat).IsMatch basename)

/// Basenames always exempt from the kebab-case rule, matching
/// ecosystem-standard or structurally-required filenames dictated by
/// external convention (GitHub directory indexes, the Claude Code Agent
/// Skills spec, the agents.md standard, Hugo's `_index.md` section-page
/// convention, GitHub's contributing-guide convention, etc.) rather than a
/// naming choice this repo's kebab-case rule governs. Callers may supply
/// additional `exemptGlobs` patterns, matched against the bare filename
/// [Repo-grounded — `naming.rs::is_naming_exempt`'s `matches!` literal set].
let private alwaysExemptNamingBasenames: Set<string> =
    Set.ofList
        [ "README.md"
          "SKILL.md"
          "AGENTS.md"
          "CLAUDE.md"
          "_index.md"
          "CONTRIBUTING.md"
          "LICENSING-NOTICE.md"
          "ROADMAP.md"
          "SECURITY.md" ]

/// Builds the lowercase-kebab-case violation message for `basename`
/// [Repo-grounded — `naming.rs::walk_naming_path`'s finding `message`].
let private namingViolationMessage (basename: string) : string =
    sprintf
        "filename \"%s\" violates lowercase-kebab-case rule (^[a-z0-9-]+\\.md$); rename to lowercase-kebab-case or add an exemption"
        basename

/// Returns `true` when `path` is an audit artifact below the repository's
/// mandated `generated-reports/` directory. The explicit component check is
/// needed because lint-staged passes individual files to this validator, so
/// a recursive directory walker never observes their parent directory entry
/// [Repo-grounded — `naming.rs::path_is_within_generated_reports`].
let private pathIsWithinGeneratedReports (path: string) : bool =
    path.Replace('\\', '/').Split('/') |> Array.contains "generated-reports"

/// Walks `root` recursively and collects naming findings for non-compliant
/// files, skipping any name matching `exemptGlobs`. Returns an empty list
/// when `root` does not exist on the filesystem
/// [Repo-grounded — `naming.rs::walk_naming_path`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private walkNamingPath (exemptGlobs: string list) (root: string) : Finding list =
    collectFilesSkipping namingSkipDirs root
    |> List.filter (fun p -> p.EndsWith(".md", StringComparison.Ordinal))
    |> List.filter (fun p -> not (pathIsWithinGeneratedReports p))
    |> List.choose (fun path ->
        let basename = Path.GetFileName path

        if Set.contains basename alwaysExemptNamingBasenames then
            None
        elif matchesAnyExemptGlob exemptGlobs basename then
            None
        elif kebabCaseRegex.IsMatch basename then
            None
        else
            Some(mkFail path (namingViolationMessage basename)))

/// Validates the lowercase-kebab-case filename convention for every markdown
/// file reachable from `paths`. The returned list is sorted by file path,
/// then by message [Repo-grounded — `naming.rs::validate_docs_naming`].
///
/// Gherkin (binds) — "Tree where every markdown file uses lowercase
/// kebab-case passes":
///   Given a documentation tree where every markdown file uses lowercase kebab-case
///   When the developer runs docs validate-naming
///   Then the command exits successfully
///   And the output reports zero docs naming findings
///
/// Gherkin (binds) — "File with uppercase characters fails":
///   Given a documentation tree containing a markdown file whose basename has uppercase characters
///   When the developer runs docs validate-naming
///   Then the command exits with a failure code
///   And the output identifies the offending filename and its rule violation
///
/// Gherkin (binds) — "README.md is exempt and passes regardless of placement":
///   Given a documentation tree where a nested directory contains only a README.md file
///   When the developer runs docs validate-naming
///   Then the command exits successfully
///   And the output reports zero docs naming findings
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let validateDocsNamingExempt (paths: string list) (exemptGlobs: string list) : Result<Finding list, string> =
    if List.isEmpty paths then
        Error "at least one path is required"
    else
        paths
        |> List.collect (walkNamingPath exemptGlobs)
        |> List.sortBy (fun f -> (f.Path |> Option.defaultValue "", f.Message))
        |> Ok

[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let validateDocsNaming (paths: string list) : Result<Finding list, string> = validateDocsNamingExempt paths []

/// Applies the Markdown filename policy to repository-relative in-memory
/// documents. Content is intentionally ignored because this rule concerns
/// names only.
let validateDocsNamingDocuments (documents: (string * string) list) (exemptGlobs: string list) : Finding list =
    documents
    |> List.map fst
    |> List.filter (fun path -> path.EndsWith(".md", StringComparison.Ordinal))
    |> List.filter (fun path -> not (pathIsWithinGeneratedReports path))
    |> List.choose (fun path ->
        let basename = Path.GetFileName path

        if
            Set.contains basename alwaysExemptNamingBasenames
            || matchesAnyExemptGlob exemptGlobs basename
            || kebabCaseRegex.IsMatch basename
        then
            None
        else
            Some(mkFail path (namingViolationMessage basename)))
    |> List.sortBy (fun finding -> finding.Path |> Option.defaultValue "", finding.Message)

// ---------------------------------------------------------------------------
// md frontmatter-dates validate
// ---------------------------------------------------------------------------

/// Matches a standalone `**Last Updated**` bold marker anywhere in a body
/// line [Repo-grounded — `frontmatter_audit.rs::last_updated_footer_re`].
let private lastUpdatedFooterRegex =
    Regex(@"\*\*Last Updated\*\*", RegexOptions.Compiled)

/// Matches an inline bullet `- **Created**: YYYY-MM-DD` or
/// `- **Last Updated**: YYYY-MM-DD` date annotation in body text
/// [Repo-grounded — `frontmatter_audit.rs::inline_date_annotation_re`].
let private inlineDateAnnotationRegex =
    Regex(@"^\s*-\s+\*\*(Created|Last Updated)\*\*:\s*\d{4}-\d{2}-\d{2}", RegexOptions.Compiled)

/// Splits `content` into its YAML frontmatter block and body, plus the
/// 1-based line number of the closing `---` delimiter (`0` when `content`
/// has no frontmatter block) — what
/// `frontmatter_audit.rs::check_body_annotations`'s `frontmatter_end_line`
/// parameter needs to convert body-relative line offsets into file-absolute
/// ones. An unclosed opening `---` fence is treated as if there is no
/// frontmatter at all — the entire `content` becomes the body. Unlike
/// `extractFrontmatter` above, this never discards the body half, since the
/// body-annotation scan below needs it too
/// [Repo-grounded — `frontmatter_audit.rs::split_frontmatter`].
let private splitFrontmatterAndBodyWithEndLine (content: string) : string * string * int =
    let lines = content.Split('\n')

    if lines.Length = 0 || lines.[0].Trim() <> "---" then
        "", content, 0
    else
        [ 1 .. lines.Length - 1 ]
        |> List.tryFind (fun i -> lines.[i].Trim() = "---")
        |> function
            | None -> "", content, 0
            | Some i ->
                let frontmatter = String.Join("\n", lines.[1 .. i - 1])
                let bodyStart = i + 1

                let body =
                    if bodyStart >= lines.Length then
                        ""
                    else
                        String.Join("\n", lines.[bodyStart..])

                frontmatter, body, i + 1

/// One finding from the frontmatter-dates audit, carrying the `line` field
/// the CLI's JSON/Markdown rendering needs beyond generic `Finding`
/// [Repo-grounded — `frontmatter_audit.rs::FrontmatterFinding`].
type FrontmatterDatesFinding =
    { File: string
      Line: int
      Severity: string
      Message: string }

/// Returns the 1-based file-level line number of the first occurrence of
/// `field:` within `frontmatter`, falling back to line 2 (the first line
/// after the opening `---`) when not found
/// [Repo-grounded — `frontmatter_audit.rs::find_field_line`].
let private findFieldLine (frontmatter: string) (field: string) : int =
    let prefix = field + ":"

    frontmatter.Split('\n')
    |> Array.toList
    |> List.mapi (fun i line -> i, line)
    |> List.tryFind (fun (_, line) -> line.TrimStart(' ').StartsWith(prefix, StringComparison.Ordinal))
    |> function
        | Some(i, _) -> i + 2
        | None -> 2

/// Returns a finding when the parsed `frontmatter` YAML contains a forbidden
/// top-level `updated` key. Unparseable YAML or a non-mapping block report no
/// finding — out of scope for this audit, matching the Rust source
/// [Repo-grounded — `frontmatter_audit.rs::check_frontmatter_updated_field`].
let private checkFrontmatterUpdatedFieldDetailed (path: string) (frontmatter: string) : FrontmatterDatesFinding list =
    if frontmatter.Trim() = "" then
        []
    else
        try
            let parsed = deserializer.Deserialize<obj>(frontmatter)

            let forbidden =
                // `updated` is forbidden everywhere this audit reaches.
                // `created` is forbidden only under `repo-governance/`, whose
                // frontmatter allow-list admits `description` and
                // `when_to_use` alone; `docs/` and site content still carry a
                // legitimate `created` date.
                if path.Replace('\\', '/').Contains("repo-governance/", StringComparison.Ordinal) then
                    [ "updated"; "created" ]
                else
                    [ "updated" ]

            match asRawMap parsed with
            | None -> []
            | Some fm ->
                forbidden
                |> List.choose (fun key ->
                    match tryGetRawValue fm key with
                    | None -> None
                    | Some _ ->
                        Some
                            { File = path
                              Line = findFieldLine frontmatter key
                              Severity = "high"
                              Message =
                                sprintf
                                    "forbidden \"%s:\" field in YAML frontmatter; remove per no-date-metadata convention"
                                    key })
        with _ ->
            []

/// Scans `body` line-by-line for forbidden inline date annotations and
/// `**Last Updated**` footer markers, checked in that order per line — a line
/// matching the inline-annotation pattern is not also checked against the
/// footer pattern, so a bullet like `- **Last Updated**: 2026-01-01` (which
/// matches both patterns) reports only once. `frontmatterEndLine` (the
/// 1-based line of the closing `---`, or `0` when there is no frontmatter
/// block) is added to each relative body-line index to produce absolute
/// file-level line numbers
/// [Repo-grounded — `frontmatter_audit.rs::check_body_annotations`].
let private checkBodyAnnotationsDetailed
    (path: string)
    (body: string)
    (frontmatterEndLine: int)
    : FrontmatterDatesFinding list =
    if body = "" then
        []
    else
        let startLine = if frontmatterEndLine = 0 then 1 else frontmatterEndLine + 1

        body.Split('\n')
        |> Array.toList
        |> List.mapi (fun i line -> startLine + i, line)
        |> List.collect (fun (lineNum, line) ->
            if inlineDateAnnotationRegex.IsMatch line then
                [ { File = path
                    Line = lineNum
                    Severity = "high"
                    Message = "forbidden inline date annotation in body; remove per no-date-metadata convention" } ]
            elif lastUpdatedFooterRegex.IsMatch line then
                [ { File = path
                    Line = lineNum
                    Severity = "high"
                    Message =
                      "forbidden **Last Updated** footer marker in body; remove per no-date-metadata convention" } ]
            else
                [])

/// Reads `path` and scans its content for both frontmatter and body
/// date-metadata violations, returning the richer per-finding shape (line
/// number) the CLI's JSON/Markdown rendering needs
/// [Repo-grounded — `frontmatter_audit.rs::scan_frontmatter_content`].
let private scanFrontmatterDatesContentDetailed (path: string) (content: string) : FrontmatterDatesFinding list =
    let frontmatter, body, frontmatterEndLine =
        splitFrontmatterAndBodyWithEndLine content

    checkFrontmatterUpdatedFieldDetailed path frontmatter
    @ checkBodyAnnotationsDetailed path body frontmatterEndLine

[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private scanFrontmatterDatesFileDetailed (path: string) : FrontmatterDatesFinding list =
    scanFrontmatterDatesContentDetailed path (File.ReadAllText path)

/// Reads `path` and scans its content for both frontmatter and body
/// date-metadata violations [Repo-grounded —
/// `frontmatter_audit.rs::scan_frontmatter_content`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private scanFrontmatterDatesFile (path: string) : Finding list =
    scanFrontmatterDatesFileDetailed path
    |> List.map (fun f -> mkFail f.File f.Message)

/// Returns `true` when `path` contains a configured exclusion prefix as a
/// literal substring — not a path-component prefix
/// [Repo-grounded — `frontmatter_audit.rs::is_excluded`].
let private isFrontmatterDatesExcluded (excludedPrefixes: string list) (path: string) : bool =
    let slashed = path.Replace('\\', '/')

    excludedPrefixes
    |> List.exists (fun prefix -> slashed.Contains(prefix, StringComparison.Ordinal))

/// Recursively collects sorted `.md` file paths reachable from `root`,
/// filtering out any path excluded by `excludedPrefixes`. No directory name
/// is itself skipped during the walk — unlike every other `md` validator
/// above, this one ports no `SKIP_DIRS` constant
/// [Repo-grounded — `frontmatter_audit.rs::walk_paths`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private walkFrontmatterDatesPath (excludedPrefixes: string list) (root: string) : string list =
    collectFilesSkipping Set.empty root
    |> List.filter (fun p -> p.EndsWith(".md", StringComparison.Ordinal))
    |> List.filter (fun p -> not (isFrontmatterDatesExcluded excludedPrefixes p))
    |> List.sort

/// Audits every markdown file reachable from `paths` for forbidden YAML
/// frontmatter date metadata and forbidden body-level date annotations,
/// skipping any file whose path contains one of `excludedPrefixes` as a
/// substring. The returned list is sorted by file path, then by message
/// [Repo-grounded — `frontmatter_audit.rs::audit_frontmatter`].
///
/// Gherkin (binds) — "Clean directory passes the audit":
///   Given a governance directory with no forbidden date metadata in markdown files
///   When the developer runs md frontmatter validate on the directory
///   Then the command exits successfully
///   And the output reports zero frontmatter findings
///
/// Gherkin (binds) — "Frontmatter with forbidden updated field fails":
///   Given a governance markdown file whose frontmatter contains a forbidden updated field
///   When the developer runs md frontmatter validate on the file
///   Then the command exits with a failure code
///   And the output identifies the forbidden frontmatter field and its location
///
/// Gherkin (binds) — "Body containing Last Updated footer block fails":
///   Given a governance markdown file whose body contains a Last Updated footer block
///   When the developer runs md frontmatter validate on the file
///   Then the command exits with a failure code
///   And the output identifies the forbidden footer block and its location
///
/// Gherkin (binds) — "Body containing standalone Created annotation fails":
///   Given a governance markdown file whose body contains a standalone Created date annotation
///   When the developer runs md frontmatter validate on the file
///   Then the command exits with a failure code
///   And the output identifies the forbidden inline annotation and its location
///
/// Gherkin (binds) — "File under website app directory is exempt and passes":
///   Given a markdown file with forbidden date metadata under a website app directory
///   When the developer runs md frontmatter validate on the file
///   Then the command exits successfully
///   And the output reports zero frontmatter findings
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let validateFrontmatterDates (paths: string list) (excludedPrefixes: string list) : Result<Finding list, string> =
    if List.isEmpty paths then
        Error "at least one path is required"
    else
        paths
        |> List.collect (walkFrontmatterDatesPath excludedPrefixes)
        |> List.collect scanFrontmatterDatesFile
        |> List.sortBy (fun f -> (f.Path |> Option.defaultValue "", f.Message))
        |> Ok

/// CLI-facing counterpart to `validateFrontmatterDates` carrying the richer
/// `FrontmatterDatesFinding` shape (line), sorted by file then line —
/// matching the Rust source's own sort key exactly
/// [Repo-grounded — `frontmatter_audit.rs::audit_frontmatter`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let validateFrontmatterDatesDetailed
    (paths: string list)
    (excludedPrefixes: string list)
    : Result<FrontmatterDatesFinding list, string> =
    if List.isEmpty paths then
        Error "at least one path is required"
    else
        paths
        |> List.collect (walkFrontmatterDatesPath excludedPrefixes)
        |> List.collect scanFrontmatterDatesFileDetailed
        |> List.sortBy (fun f -> (f.File, f.Line))
        |> Ok

/// Audits repository-relative in-memory Markdown documents for forbidden
/// date metadata, applying the same literal path-substring exclusions as the
/// filesystem command adapter.
let validateFrontmatterDatesDocuments
    (documents: (string * string) list)
    (selectedPrefixes: string list)
    (excludedPrefixes: string list)
    : Finding list =
    let isSelected (path: string) : bool =
        List.isEmpty selectedPrefixes
        || (selectedPrefixes
            |> List.exists (fun prefix ->
                let normalizedPrefix = prefix.Replace('\\', '/').TrimEnd('/')
                let normalizedPath = path.Replace('\\', '/')

                normalizedPath = normalizedPrefix
                || normalizedPath.StartsWith(normalizedPrefix + "/", StringComparison.Ordinal)))

    documents
    |> List.filter (fun (path, _) -> path.EndsWith(".md", StringComparison.Ordinal))
    |> List.filter (fun (path, _) -> isSelected path && not (isFrontmatterDatesExcluded excludedPrefixes path))
    |> List.collect (fun (path, content) ->
        scanFrontmatterDatesContentDetailed path content
        |> List.map (fun finding -> mkFail finding.File finding.Message))
    |> List.sortBy (fun finding -> finding.Path |> Option.defaultValue "", finding.Message)

// ---------------------------------------------------------------------------
// md audit
// ---------------------------------------------------------------------------

/// Member validators `runAudit` dispatches, in the same order the Rust
/// source's `MEMBERS` constant lists them — restricted to the five member
/// validators this file has ported so far. `frontmatter-dates` and
/// `readme-index` are not yet ported to F# (the latter is a `governance`-
/// namespace command not yet started); this PR's sole scenario (an empty
/// repository, where every member trivially passes) does not require either,
/// so — matching this file's own established "port only what a scenario
/// needs" precedent — they are left for the Wave D/governance PR that ports
/// them [Repo-grounded — `apps/rhino-cli/src/commands/md_audit.rs::MEMBERS`].
let private auditMembers: string list =
    [ "validate-naming"
      "validate-frontmatter"
      "validate-heading-hierarchy"
      "validate-links"
      "validate-mermaid" ]

/// The aggregated result of `runAudit`: every member validator's failure
/// message (empty when all passed) and the human-readable summary line the
/// Rust source prints [Repo-grounded — `md_audit.rs::run`'s PASSED/FAILED
/// banner].
type MdAuditResult =
    { Failures: string list
      Report: string }

/// Converts a `Finding`-list validator outcome into `runAuditMember`'s
/// shared `Result<unit, string>` shape: an `Error` is reformatted with
/// `name`, and a findings list containing at least one `Blocking` entry
/// becomes an `Error` too — folds what would otherwise be four near-identical
/// match expressions (one per `Finding`-returning member validator) into one.
/// The blocking-severity check itself is `RhinoCli.Domain.Finding.hasBlocking`
/// (Wave D PR11) rather than a private copy here, since the git pre-commit
/// hook shim's integration tests need the identical predicate.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private findingsOutcome (name: string) (result: Result<Finding list, string>) : Result<unit, string> =
    match result with
    // Coverage note: every call site of findingsOutcome in this file passes
    // either a hardcoded `Ok findings` (validate-links) or the result of
    // calling validateDocsNaming/validateDocsFrontmatter/
    // validateDocsHeadingHierarchy with a single-element `[ repoRoot ]` list —
    // and each of those three functions' sole Error case is an empty input
    // path list, which `[ repoRoot ]` can never be. This Error arm is
    // therefore unreachable from within runAuditMember; it exists for
    // findingsOutcome's own generality as a private helper.
    | Error e -> Error(sprintf "%s: %s" name e)
    | Ok findings when RhinoCli.Domain.Finding.hasBlocking findings ->
        Error(sprintf "%s: %d finding(s) reported" name findings.Length)
    | Ok _ -> Ok()

/// Runs one member validator against `repoRoot` with default arguments,
/// returning `Ok ()` when it reports no blocking findings (or, for
/// `validate-mermaid`, no violations), or `Error message` naming the
/// validator and the reason it failed
/// [Repo-grounded — `md_audit.rs::run_member`, restricted to `auditMembers`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private runAuditMember (repoRoot: string) (name: string) : Result<unit, string> =
    match name with
    | "validate-naming" -> findingsOutcome name (validateDocsNaming [ repoRoot ])
    | "validate-frontmatter" -> findingsOutcome name (validateDocsFrontmatter [ repoRoot ])
    | "validate-heading-hierarchy" -> findingsOutcome name (validateDocsHeadingHierarchy [ repoRoot ])
    | "validate-links" ->
        let findings =
            validateDocsLinks
                { RepoRoot = repoRoot
                  StagedFiles = None
                  ExcludePrefixes = [] }

        findingsOutcome name (Ok findings)
    | "validate-mermaid" ->
        let result =
            validateMermaidDocs
                { RepoRoot = repoRoot
                  Paths = []
                  StagedFiles = None
                  ChangedFiles = None
                  ExcludePrefixes = []
                  Options = defaultMermaidValidateOptions }

        if List.isEmpty result.Violations then
            Ok()
        else
            Error(sprintf "%s: %d violation(s) reported" name result.Violations.Length)
    // Coverage note: runAuditMember is `private` (unlike Convention.fs's
    // `internal` twin, which a test can drive directly with a bogus name),
    // so its sole reachable caller is runAudit, which only ever supplies
    // names drawn from the hardcoded `auditMembers` list five lines above —
    // itself an exact match for this function's five explicit cases. This
    // fallback can never actually fire.
    | _ -> Error(sprintf "unknown md validator: %s" name)

/// Runs every already-ported `md` validator against `repoRoot` in sequence
/// and aggregates their outcomes into a single pass/fail report, mirroring
/// `md audit`'s member-validator loop
/// [Repo-grounded — `apps/rhino-cli/src/commands/md_audit.rs::run`].
///
/// Gherkin (binds) — "Every md validator passes on a repository with no
/// markdown files":
///   Given a repository containing no markdown files
///   When the developer runs "rhino-cli md audit"
///   Then the command exits successfully
///   And the output reports all md validators passed
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let runAudit (repoRoot: string) : MdAuditResult =
    let failures =
        auditMembers
        |> List.choose (fun name ->
            match runAuditMember repoRoot name with
            | Ok() -> None
            | Error message -> Some message)

    if List.isEmpty failures then
        { Failures = []
          Report = sprintf "MD AUDIT PASSED: all %d validators passed" auditMembers.Length }
    else
        { Failures = failures
          Report = sprintf "MD AUDIT FAILED: %d validator(s) reported failures" failures.Length }

/// Runs the aggregate Markdown audit over an in-memory repository. This is
/// the policy core used by mandatory Unit scenarios; `runAudit` remains the
/// filesystem adapter used by Integration and the public CLI.
let runAuditDocuments (documents: (string * string) list) : MdAuditResult =
    let findingFailure (name: string) (findings: Finding list) : string option =
        if RhinoCli.Domain.Finding.hasBlocking findings then
            Some(sprintf "%s: %d finding(s) reported" name findings.Length)
        else
            None

    let mermaidResult =
        validateMermaidDocuments documents [] None None [] defaultMermaidValidateOptions

    let failures =
        [ findingFailure "validate-naming" (validateDocsNamingDocuments documents [])
          findingFailure "validate-frontmatter" (validateDocsFrontmatterDocuments documents)
          findingFailure "validate-heading-hierarchy" (validateDocsHeadingHierarchyDocuments false [] documents)
          findingFailure "validate-links" (validateDocsLinksDocuments documents None [])
          if List.isEmpty mermaidResult.Violations then
              None
          else
              Some(sprintf "validate-mermaid: %d violation(s) reported" mermaidResult.Violations.Length) ]
        |> List.choose id

    if List.isEmpty failures then
        { Failures = []
          Report = sprintf "MD AUDIT PASSED: all %d validators passed" auditMembers.Length }
    else
        { Failures = failures
          Report = sprintf "MD AUDIT FAILED: %d validator(s) reported failures" failures.Length }
