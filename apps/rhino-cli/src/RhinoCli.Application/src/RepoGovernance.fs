/// Repo-governance audits: layer coherence across the two governance index
/// documents, and the text renderer `repo-governance layer-coherence validate`
/// prints
/// [Repo-grounded — `apps/rhino-cli/src/application/repo_governance/layer_coherence.rs`,
/// `apps/rhino-cli/src/commands/governance_layer_coherence.rs`], binding
/// `specs/apps/rhino/cli/behaviours/repo-governance/repo-governance-layer-coherence.feature`.
module RhinoCli.Application.RepoGovernance

open System
open System.IO
open System.Text
open System.Text.RegularExpressions
open System.Text.Json
open System.Text.Json.Nodes

/// A single finding emitted by the layer coherence audit.
type LayerCoherenceFinding =
    {
        /// Path, or the composite `arch+readme` path, of the offending file(s).
        File: string
        Severity: string
        /// Machine-readable violation category.
        Kind: string
        Message: string
    }

/// The same layer number is declared with two different names in one file.
[<Literal>]
let KindIntraFileNameConflict = "intra-file-name-conflict"

/// A layer number exists in one governance document but not the other.
[<Literal>]
let KindCrossFileNumberMismatch = "cross-file-number-mismatch"

/// The same layer number carries different names in the two documents.
[<Literal>]
let KindCrossFileNameMismatch = "cross-file-name-mismatch"

/// An integer in `[0, max]` is declared in neither document.
[<Literal>]
let KindNumberingGap = "numbering-gap"

/// A required governance document is absent.
[<Literal>]
let KindMissingDoc = "missing-doc"

[<Literal>]
let private ArchPath = "repo-governance/repository-governance-architecture.md"

[<Literal>]
let private ReadmePath = "repo-governance/README.md"

/// Bold layer declarations, e.g. `**Layer 0: Vision**`.
let private boldRe = Regex(@"\*\*Layer (\d+):\s*([A-Za-z][A-Za-z0-9 -]+?)\*\*")

/// ATX heading layer declarations, e.g. `## Layer 0: Vision (the why)`.
let private headRe =
    Regex(@"^##\s+Layer (\d+):\s*([A-Za-z][A-Za-z0-9 -]+?)\s*\(", RegexOptions.Multiline)

let private failFinding (file: string) (kind: string) (message: string) : LayerCoherenceFinding =
    { File = file
      Severity = "fail"
      Kind = kind
      Message = message }

/// Reads one document's layer declarations. Returns `None` for the map when
/// the file is absent, alongside the `missing-doc` finding that records it.
let private readLayerMapContent
    (path: string)
    (content: string option)
    : Map<int64, string> option * LayerCoherenceFinding list =
    match content with
    | None -> None, [ failFinding path KindMissingDoc (sprintf "governance doc \"%s\" does not exist" path) ]
    | Some data ->
        let layers = Collections.Generic.Dictionary<int64, string>()
        let findings = ResizeArray<LayerCoherenceFinding>()

        let addMatch (numStr: string) (name: string) =
            match
                Int64.TryParse(numStr, Globalization.NumberStyles.Integer, Globalization.CultureInfo.InvariantCulture)
            with
            | false, _ -> ()
            | true, num ->
                match layers.TryGetValue num with
                | true, existing ->
                    if existing <> name then
                        findings.Add(
                            failFinding
                                path
                                KindIntraFileNameConflict
                                (sprintf
                                    "file declares Layer %d with two different names: \"%s\" and \"%s\""
                                    num
                                    existing
                                    name)
                        )
                | _ -> layers.[num] <- name

        for m in boldRe.Matches data do
            addMatch m.Groups.[1].Value m.Groups.[2].Value

        for m in headRe.Matches data do
            addMatch m.Groups.[1].Value m.Groups.[2].Value

        let map = layers |> Seq.map (fun kv -> kv.Key, kv.Value) |> Map.ofSeq
        Some map, List.ofSeq findings

[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private readLayerMap (path: string) : Map<int64, string> option * LayerCoherenceFinding list =
    readLayerMapContent
        path
        (if File.Exists path then
             Some(File.ReadAllText path)
         else
             None)

/// Cross-checks the two layer maps for numbers present in only one document
/// and for numbers whose names disagree.
let private compareLayerMaps
    (arch: Map<int64, string>)
    (readme: Map<int64, string>)
    (archPath: string)
    (readmePath: string)
    : LayerCoherenceFinding list =
    let composite = sprintf "%s+%s" archPath readmePath

    let seen =
        Set.union (arch |> Map.keys |> Set.ofSeq) (readme |> Map.keys |> Set.ofSeq)

    seen
    |> Seq.choose (fun n ->
        match Map.tryFind n arch, Map.tryFind n readme with
        | Some name, None ->
            Some(
                failFinding
                    composite
                    KindCrossFileNumberMismatch
                    (sprintf "Layer %d (\"%s\") is declared in %s but missing from %s" n name archPath readmePath)
            )
        | None, Some name ->
            Some(
                failFinding
                    composite
                    KindCrossFileNumberMismatch
                    (sprintf "Layer %d (\"%s\") is declared in %s but missing from %s" n name readmePath archPath)
            )
        | Some archName, Some readmeName when archName <> readmeName ->
            Some(
                failFinding
                    composite
                    KindCrossFileNameMismatch
                    (sprintf "Layer %d named \"%s\" in %s but \"%s\" in %s" n archName archPath readmeName readmePath)
            )
        | _ -> None)
    |> List.ofSeq

/// Reports every integer in `[0, max]` declared in neither document.
let private checkNumberingGap
    (arch: Map<int64, string>)
    (readme: Map<int64, string>)
    (archPath: string)
    (readmePath: string)
    : LayerCoherenceFinding list =
    let composite = sprintf "%s+%s" archPath readmePath

    let seen =
        Set.union (arch |> Map.keys |> Set.ofSeq) (readme |> Map.keys |> Set.ofSeq)

    if Set.isEmpty seen then
        []
    else
        let maxLayer = Set.maxElement seen

        [ for i in 0L .. maxLayer do
              if not (Set.contains i seen) then
                  yield
                      failFinding
                          composite
                          KindNumberingGap
                          (sprintf "layer numbering is not contiguous: Layer %d is missing between 0 and %d" i maxLayer) ]

/// Audits that the two governance index documents agree on layer numbering and
/// names, and that the numbering is contiguous. Findings sort by file, then
/// kind.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let auditLayerCoherence (repoRoot: string) : LayerCoherenceFinding list =
    let archPath = Path.Combine(repoRoot, ArchPath)
    let readmePath = Path.Combine(repoRoot, ReadmePath)
    let archMap, archFindings = readLayerMap archPath
    let readmeMap, readmeFindings = readLayerMap readmePath

    let crossFindings =
        match archMap, readmeMap with
        | Some am, Some rm ->
            compareLayerMaps am rm archPath readmePath
            @ checkNumberingGap am rm archPath readmePath
        | _ -> []

    archFindings @ readmeFindings @ crossFindings
    |> List.sortWith (fun a b ->
        match String.CompareOrdinal(a.File, b.File) with
        | 0 -> String.CompareOrdinal(a.Kind, b.Kind)
        | other -> other)

/// Audits layer coherence entirely from repository-relative document text.
let auditLayerCoherenceDocuments (documents: Map<string, string>) : LayerCoherenceFinding list =
    let archMap, archFindings =
        readLayerMapContent ArchPath (Map.tryFind ArchPath documents)

    let readmeMap, readmeFindings =
        readLayerMapContent ReadmePath (Map.tryFind ReadmePath documents)

    let crossFindings =
        match archMap, readmeMap with
        | Some arch, Some readme ->
            compareLayerMaps arch readme ArchPath ReadmePath
            @ checkNumberingGap arch readme ArchPath ReadmePath
        | _ -> []

    archFindings @ readmeFindings @ crossFindings
    |> List.sortWith (fun left right ->
        match String.CompareOrdinal(left.File, right.File) with
        | 0 -> String.CompareOrdinal(left.Kind, right.Kind)
        | other -> other)

/// Renders layer coherence findings the way the CLI's text output does.
let formatLayerCoherenceText (findings: LayerCoherenceFinding list) : string =
    if List.isEmpty findings then
        "LAYER COHERENCE AUDIT PASSED: zero findings\n"
    else
        let sb = StringBuilder()

        sb.Append(sprintf "LAYER COHERENCE AUDIT FAILED: %d finding(s) reported\n" (List.length findings))
        |> ignore

        for f in findings do
            sb.Append(sprintf "  %s  [%s]  %s — %s\n" f.File f.Severity f.Kind f.Message)
            |> ignore

        sb.ToString()

// ---------------------------------------------------------------------------
// Traceability audit
// [Repo-grounded — `apps/rhino-cli/src/application/repo_governance/traceability_audit.rs`,
// `apps/rhino-cli/src/commands/governance_traceability_audit.rs`]
// ---------------------------------------------------------------------------

/// A single finding from the traceability audit.
type TraceabilityFinding =
    {
        Path: string
        /// 1-based line; `1` when the heading is absent entirely.
        Line: int
        Kind: string
        Message: string
    }

/// A principle document lacks its `Vision Supported` section.
[<Literal>]
let KindMissingVisionSupported = "missing-vision-supported"

/// A convention or development document lacks its
/// `Principles Implemented/Respected` section.
[<Literal>]
let KindMissingPrinciplesImplemented = "missing-principles-implemented"

/// A development document lacks its `Conventions Implemented/Respected`
/// section.
[<Literal>]
let KindMissingConventionsImplemented = "missing-conventions-implemented"

/// A workflow document references no `.claude/agents/<name>.md` file.
[<Literal>]
let KindMissingAgentReference = "missing-agent-reference"

/// Matches the traceability heading as an H2 in a parent or an H1 in a
/// progressively disclosed child.
let private visionRe =
    Regex(@"^#{1,2}\s+Vision Supported\s*$", RegexOptions.Multiline)

let private principlesRe =
    Regex(@"^#{1,2}\s+Principles Implemented/Respected\s*$", RegexOptions.Multiline)

let private conventionsRe =
    Regex(@"^#{1,2}\s+Conventions Implemented/Respected\s*$", RegexOptions.Multiline)

/// Agent definitions live one directory deep, so the domain segment is
/// optional rather than required.
let private agentRefRe = Regex(@"\.claude/agents/(?:[a-z0-9-]+/)?[a-z0-9-]+\.md")

/// Workflow paths exempt from the agent-reference requirement.
let private metaExempt =
    [ "meta/execution-modes.md"; "meta/workflow-identifier.md" ]

/// Recursively lists every file under `root`, sorted. Empty when `root` does
/// not exist.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let rec private walkAllFiles (root: string) : string list =
    if not (Directory.Exists root) then
        []
    else
        let files = Directory.GetFiles root |> List.ofArray

        let subdirs = Directory.GetDirectories root |> List.ofArray

        (files @ (subdirs |> List.collect walkAllFiles))
        |> List.sortWith (fun a b -> String.CompareOrdinal(a, b))

[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private isFile (path: string) : bool = File.Exists path

/// `true` when `path` is a progressive-disclosure split child: it sits
/// anywhere below a directory that both carries a `README.md` index and has a
/// same-named sibling parent document. Recognised by position, not filename —
/// nested fragments belong to the same parent family, which
/// [`readDocumentFamily`] reads whole, so auditing them standalone would
/// double-report.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private isSplitChild (path: string) : bool =
    let mutable ancestor = Path.GetDirectoryName path
    let mutable found = false

    while not found && not (String.IsNullOrEmpty ancestor) do
        let dirName = Path.GetFileName ancestor
        let grandparent = Path.GetDirectoryName ancestor

        if
            isFile (Path.Combine(ancestor, "README.md"))
            && not (String.IsNullOrEmpty dirName)
            && not (String.IsNullOrEmpty grandparent)
            && isFile (Path.Combine(grandparent, dirName + ".md"))
        then
            found <- true
        else
            ancestor <- grandparent

    found

/// Reads a progressively disclosed document as one traceability unit: the
/// parent plus, when an indexed same-named child directory exists, every
/// non-README child. The parent stays the finding location.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private readDocumentFamily (parent: string) : string =
    let data = File.ReadAllText parent
    let stem = Path.GetFileNameWithoutExtension parent

    if stem = "" then
        data
    else
        let childDir = Path.Combine(Path.GetDirectoryName parent, stem)

        if not (isFile (Path.Combine(childDir, "README.md"))) then
            data
        else
            let children =
                walkAllFiles childDir
                |> List.filter (fun p ->
                    let name = Path.GetFileName p
                    name.EndsWith(".md", StringComparison.Ordinal) && name <> "README.md")

            children
            |> List.fold (fun acc child -> acc + "\n" + File.ReadAllText child) data

/// Sorted `.md` files under `root`, excluding `README.md` and every
/// progressive-disclosure split child.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private listGovernanceMarkdown (root: string) : string list =
    walkAllFiles root
    |> List.filter (fun p ->
        let name = Path.GetFileName p
        name.EndsWith(".md", StringComparison.Ordinal) && name <> "README.md")
    |> List.filter (fun p -> not (isSplitChild p))

/// 1-based line number of the first non-empty line; `1` when there is none.
let private firstNonEmptyLine (data: string) : int =
    data.Split('\n')
    |> Array.tryFindIndex (fun line -> line.Trim() <> "")
    |> Option.map (fun idx -> idx + 1)
    |> Option.defaultValue 1

let private traceFinding (path: string) (line: int) (kind: string) (message: string) =
    { Path = path
      Line = line
      Kind = kind
      Message = message }

let private normalizeGovernancePath (path: string) : string = path.Replace('\\', '/').Trim('/')

let private isSplitChildDocument (documents: Map<string, string>) (path: string) : bool =
    let normalized = normalizeGovernancePath path
    let segments = normalized.Split('/')

    [ 1 .. segments.Length - 2 ]
    |> List.exists (fun endIndex ->
        let ancestor = String.Join("/", segments.[0..endIndex])
        let parentDir = String.Join("/", segments.[0 .. endIndex - 1])
        let dirName = segments.[endIndex]

        Map.containsKey (ancestor + "/README.md") documents
        && Map.containsKey (parentDir + "/" + dirName + ".md") documents)

let private readDocumentFamilyContent (documents: Map<string, string>) (parent: string) : string =
    let data = Map.find parent documents
    let stem = Path.GetFileNameWithoutExtension parent
    let parentDir = Path.GetDirectoryName(parent).Replace('\\', '/')
    let childDir = parentDir + "/" + stem

    if stem = "" || not (Map.containsKey (childDir + "/README.md") documents) then
        data
    else
        documents
        |> Map.toList
        |> List.filter (fun (path, _) ->
            path.StartsWith(childDir + "/", StringComparison.Ordinal)
            && path.EndsWith(".md", StringComparison.Ordinal)
            && Path.GetFileName path <> "README.md")
        |> List.sortBy fst
        |> List.fold (fun content (_, child) -> content + "\n" + child) data

let private governanceDocumentsUnder (documents: Map<string, string>) (root: string) : string list =
    documents
    |> Map.keys
    |> Seq.filter (fun path ->
        path.StartsWith(root + "/", StringComparison.Ordinal)
        && path.EndsWith(".md", StringComparison.Ordinal)
        && Path.GetFileName path <> "README.md"
        && not (isSplitChildDocument documents path))
    |> Seq.sortWith (fun left right -> String.CompareOrdinal(left, right))
    |> List.ofSeq

/// Audits traceability over an in-memory repository document map.
let auditTraceabilityDocuments (inputDocuments: Map<string, string>) : TraceabilityFinding list =
    let documents =
        inputDocuments
        |> Map.toList
        |> List.map (fun (path, content) -> normalizeGovernancePath path, content)
        |> Map.ofList

    let auditRequired root (regex: Regex) kind message =
        governanceDocumentsUnder documents root
        |> List.choose (fun path ->
            if regex.IsMatch(readDocumentFamilyContent documents path) then
                None
            else
                Some(traceFinding path 1 kind message))

    let development =
        governanceDocumentsUnder documents "repo-governance/development"
        |> List.collect (fun path ->
            let content = readDocumentFamilyContent documents path

            [ if not (principlesRe.IsMatch content) then
                  yield
                      traceFinding
                          path
                          1
                          KindMissingPrinciplesImplemented
                          "development doc is missing its required Principles Implemented/Respected traceability section"
              if not (conventionsRe.IsMatch content) then
                  yield
                      traceFinding
                          path
                          1
                          KindMissingConventionsImplemented
                          "development doc is missing its required Conventions Implemented/Respected traceability section" ])

    let workflows =
        governanceDocumentsUnder documents "repo-governance/workflows"
        |> List.choose (fun path ->
            let relative = path.Substring("repo-governance/workflows/".Length)
            let content = readDocumentFamilyContent documents path

            if List.contains relative metaExempt || agentRefRe.IsMatch content then
                None
            else
                Some(
                    traceFinding
                        path
                        (firstNonEmptyLine content)
                        KindMissingAgentReference
                        "workflow does not reference any .claude/agents/<name>.md file"
                ))

    auditRequired
        "repo-governance/principles"
        visionRe
        KindMissingVisionSupported
        "principle is missing its required Vision Supported traceability section"
    @ auditRequired
        "repo-governance/conventions"
        principlesRe
        KindMissingPrinciplesImplemented
        "convention is missing its required Principles Implemented/Respected traceability section"
    @ development
    @ workflows
    |> List.sortWith (fun left right ->
        match String.CompareOrdinal(left.Path, right.Path) with
        | 0 -> compare left.Line right.Line
        | other -> other)

[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private auditPrinciples (root: string) : TraceabilityFinding list =
    listGovernanceMarkdown root
    |> List.choose (fun path ->
        if visionRe.IsMatch(readDocumentFamily path) then
            None
        else
            Some(
                traceFinding
                    path
                    1
                    KindMissingVisionSupported
                    "principle is missing its required Vision Supported traceability section"
            ))

[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private auditConventions (root: string) : TraceabilityFinding list =
    listGovernanceMarkdown root
    |> List.choose (fun path ->
        if principlesRe.IsMatch(readDocumentFamily path) then
            None
        else
            Some(
                traceFinding
                    path
                    1
                    KindMissingPrinciplesImplemented
                    "convention is missing its required Principles Implemented/Respected traceability section"
            ))

[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private auditDevelopment (root: string) : TraceabilityFinding list =
    listGovernanceMarkdown root
    |> List.collect (fun path ->
        let data = readDocumentFamily path

        [ if not (principlesRe.IsMatch data) then
              yield
                  traceFinding
                      path
                      1
                      KindMissingPrinciplesImplemented
                      "development doc is missing its required Principles Implemented/Respected traceability section"
          if not (conventionsRe.IsMatch data) then
              yield
                  traceFinding
                      path
                      1
                      KindMissingConventionsImplemented
                      "development doc is missing its required Conventions Implemented/Respected traceability section" ])

[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private auditWorkflows (root: string) : TraceabilityFinding list =
    listGovernanceMarkdown root
    |> List.choose (fun path ->
        // Coverage note: every `path` this `List.choose` sees comes from
        // `listGovernanceMarkdown root` -> `walkAllFiles root`, which builds
        // every returned path by recursively concatenating `root` with
        // `Directory.GetFiles`/`Directory.GetDirectories` entry names — a
        // path built this way always begins with the literal `root` string
        // it was combined from. `auditWorkflows` is also only ever called
        // (at `auditTraceability` below) with the same `root` value used to
        // build `path`, so the `else` arm here is unreachable via the
        // public `auditTraceability` entry point.
        let rel =
            if path.StartsWith(root, StringComparison.Ordinal) then
                path.Substring(root.Length).TrimStart(Path.DirectorySeparatorChar).Replace('\\', '/')
            else
                ""

        if List.contains rel metaExempt then
            None
        else
            let data = readDocumentFamily path

            if agentRefRe.IsMatch data then
                None
            else
                Some(
                    traceFinding
                        path
                        (firstNonEmptyLine data)
                        KindMissingAgentReference
                        "workflow does not reference any .claude/agents/<name>.md file"
                ))

/// Audits traceability across the principles, conventions, development, and
/// workflows families. Findings sort by path, then line.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let auditTraceability (repoRoot: string) : TraceabilityFinding list =
    auditPrinciples (Path.Combine(repoRoot, "repo-governance", "principles"))
    @ auditConventions (Path.Combine(repoRoot, "repo-governance", "conventions"))
    @ auditDevelopment (Path.Combine(repoRoot, "repo-governance", "development"))
    @ auditWorkflows (Path.Combine(repoRoot, "repo-governance", "workflows"))
    |> List.sortWith (fun a b ->
        match String.CompareOrdinal(a.Path, b.Path) with
        | 0 -> compare a.Line b.Line
        | other -> other)

/// Renders traceability findings the way the CLI's text output does.
let formatTraceabilityText (findings: TraceabilityFinding list) : string =
    if List.isEmpty findings then
        "TRACEABILITY AUDIT PASSED: zero findings\n"
    else
        let sb = StringBuilder()

        sb.Append(sprintf "TRACEABILITY AUDIT FAILED: %d finding(s) reported\n" (List.length findings))
        |> ignore

        for f in findings do
            sb.Append(sprintf "  %s:%d  %s  %s\n" f.Path f.Line f.Kind f.Message) |> ignore

        sb.ToString()

// ---------------------------------------------------------------------------
// Vendor-independence audit
// [Repo-grounded — `apps/rhino-cli/src/application/repo_governance/vendor_audit.rs`,
// `apps/rhino-cli/src/commands/governance_vendor_audit.rs`]
// ---------------------------------------------------------------------------

/// A single vendor-term finding in a governance Markdown document.
type VendorFinding =
    {
        Path: string
        Line: int
        /// Display name of the matched term.
        Match: string
        /// Suggested vendor-neutral replacement text.
        Replacement: string
    }

/// The convention-definition file, always exempt: it names the forbidden terms
/// as examples.
[<Literal>]
let private ForbiddenConventionSuffix =
    "repo-governance/conventions/structure/governance-vendor-independence.md"

/// The convention-definition file's split-directory children, exempt for the
/// same reason as their parent.
[<Literal>]
let private ForbiddenConventionDirSuffix =
    "repo-governance/conventions/structure/governance-vendor-independence/"

/// `(pattern, display term, replacement)` for every forbidden vendor term.
///
/// This table detects vendor leakage into vendor-neutral prose. It is NOT a
/// supported-harness declaration — `repo-config.yml` `harness:` is the sole
/// authority there. Names of harnesses the repository has dropped stay here on
/// purpose: prose must not name them either, and a dropped name is exactly the
/// leakage this audit exists to catch.
let private forbidden: (string * string * string) list =
    [ "Claude Code", "Claude Code", "\"the coding agent\""
      "OpenCode", "OpenCode", "\"the coding agent\" or drop where redundant"
      @"\bCursor\b", "Cursor", "\"the coding agent\" or \"AI coding editor\""
      @"\bWindsurf\b", "Windsurf", "\"the coding agent\" or \"AI coding editor\""
      @"\bCodeium\b", "Codeium", "\"the coding agent\" (legacy Windsurf brand)"
      @"\bCopilot\b", "Copilot", "\"the coding agent\" or \"AI coding assistant\""
      @"\bAider\b", "Aider", "\"the coding agent\" or \"AI coding assistant\""
      @"\bCline\b", "Cline", "\"the coding agent\" or \"AI coding assistant\""
      @"\bDevin\b", "Devin", "\"the coding agent\" (false-positive risk: personal name; review context)"
      @"\bJunie\b", "Junie", "\"the coding agent\" or \"AI coding assistant\""
      @"\bJetBrains\b", "JetBrains", "\"the model vendor\" or drop"
      @"\bAmazon Q\b", "Amazon Q", "\"the coding agent\""
      @"\bAntigravity\b", "Antigravity", "\"the coding agent\" or \"AI coding editor\""
      "Pi Coding Agent", "Pi Coding Agent", "\"the coding agent\""
      @"pi\.dev", "pi.dev", "\"the coding agent\""
      @"\bEarendil\b", "Earendil", "\"the model vendor\" or drop"
      @"\.claude/", ".claude/", "\"primary binding directory\""
      @"\.opencode/", ".opencode/", "\"secondary binding directory\""
      @"\.cursor/", ".cursor/", "\"the platform binding directory\""
      @"\.windsurf/", ".windsurf/", "\"the platform binding directory\""
      @"\.continue/", ".continue/", "\"the platform binding directory\""
      @"\.clinerules/", ".clinerules/", "\"the platform binding directory\""
      @"\.junie/", ".junie/", "\"the platform binding directory\""
      @"\.amazonq/", ".amazonq/", "\"the platform binding directory\""
      @"\.pi/", ".pi/", "\"the platform binding directory\""
      @"\.gemini/", ".gemini/", "\"the platform binding directory\""
      @"\.agent/", ".agent/", "\"the platform binding directory\""
      @"\.agents/", ".agents/", "\"the platform binding directory\""
      "Anthropic", "Anthropic", "\"the model vendor\" or drop"
      @"\bOpenAI\b", "OpenAI", "\"the model vendor\" or drop"
      @"\bxAI\b", "xAI", "\"the model vendor\" or drop"
      @"\bSonnet\b", "Sonnet", "\"execution-grade\""
      @"\bOpus\b", "Opus", "\"planning-grade\""
      @"\bHaiku\b", "Haiku", "\"fast\""
      @"\bGPT\b", "GPT", "\"AI model\" or capability tier"
      @"\bGemini\b", "Gemini", "\"AI model\" or capability tier"
      @"\bDeepSeek\b", "DeepSeek", "\"AI model\" or capability tier"
      @"\bQwen\b", "Qwen", "\"AI model\" or capability tier"
      @"\bLlama\b", "Llama", "\"AI model\" or capability tier"
      @"\bMistral\b", "Mistral", "\"AI model\" or capability tier"
      @"\bGrok\b", "Grok", "\"AI model\" (false-positive risk: verb \"to grok\"; review context)"
      @"\bSkills\b", "Skills", "\"agent skills\" (lowercase)" ]

let private forbiddenTerms =
    forbidden
    |> List.map (fun (pattern, term, replacement) -> Regex pattern, term, replacement)

let private htmlCommentRe = Regex(@"<!--.*?-->")
let private inlineCodeRe = Regex(@"`[^`]*`")
let private linkUrlRe = Regex(@"\[([^\]]*)\]\([^)]*\)")

/// Strips inline HTML comments, inline code spans, and link URLs so only prose
/// remains for vendor-term matching.
let private stripNonProse (line: string) : string =
    let s = htmlCommentRe.Replace(line, "")
    let s = inlineCodeRe.Replace(s, "``")
    linkUrlRe.Replace(s, "[$1]")

/// Leading backtick count when `line` is a CommonMark code fence (3+), else 0.
let private fenceLineLen (line: string) : int =
    let trimmed = line.Trim()
    let n = trimmed |> Seq.takeWhile (fun ch -> ch = '`') |> Seq.length
    if n >= 3 then n else 0

/// ATX heading level (1–6), or `None` when `line` is not a valid heading.
let private parseHeading (line: string) : int option =
    let trimmed = line.Trim()

    if not (trimmed.StartsWith("#", StringComparison.Ordinal)) then
        None
    else
        let level = trimmed |> Seq.takeWhile (fun ch -> ch = '#') |> Seq.length

        if level > 6 || trimmed.Length <= level || trimmed.[level] <> ' ' then
            None
        else
            Some level

/// `true` when `line` opens a vendor-exempt "Platform Binding Examples"
/// section.
let private isPlatformBindingHeading (line: string) : bool =
    line.ToLowerInvariant().Contains "platform binding examples"

/// Scans `content` line-by-line, respecting YAML frontmatter, code fences,
/// HTML comments, inline code, link URLs, and the "Platform Binding Examples"
/// heading scope.
let scanVendorLines (path: string) (content: string) : VendorFinding list =
    let findings = ResizeArray<VendorFinding>()
    let mutable inCodeFenceLen = 0
    let mutable inFrontmatter = false
    let mutable inHtmlComment = false
    let mutable inPlatformBindingSection = false
    let mutable platformBindingHeadingLevel = 0

    let matchTerms (lineNum: int) (text: string) =
        for (re, term, replacement) in forbiddenTerms do
            if re.IsMatch text then
                findings.Add
                    { Path = path
                      Line = lineNum
                      Match = term
                      Replacement = replacement }

    content.Split('\n')
    |> Array.iteri (fun i line ->
        let lineNum = i + 1

        if lineNum = 1 && line.Trim() = "---" then
            inFrontmatter <- true
        elif inFrontmatter then
            if line.Trim() = "---" then
                inFrontmatter <- false
        elif inHtmlComment then
            if line.Contains "-->" then
                inHtmlComment <- false
        elif line.Contains "<!--" && not (line.Contains "-->") then
            inHtmlComment <- true
            let idx = line.IndexOf("<!--", StringComparison.Ordinal)
            let stripped = stripNonProse (line.Substring(0, idx))

            if stripped <> "" then
                matchTerms lineNum stripped
        else
            let fl = fenceLineLen line
            // A fence line shorter than the opener is inner content, not a
            // close — it falls through to the in-fence skip below.
            let mutable handled = false

            if fl > 0 then
                if inCodeFenceLen = 0 then
                    inCodeFenceLen <- fl
                    handled <- true
                elif fl >= inCodeFenceLen then
                    inCodeFenceLen <- 0
                    handled <- true

            if not handled && inCodeFenceLen = 0 then
                let mutable skip = false

                match parseHeading line with
                | Some level ->
                    if isPlatformBindingHeading line then
                        inPlatformBindingSection <- true
                        platformBindingHeadingLevel <- level
                        skip <- true
                    elif inPlatformBindingSection && level <= platformBindingHeadingLevel then
                        inPlatformBindingSection <- false
                        platformBindingHeadingLevel <- 0
                | None -> ()

                if not skip && not inPlatformBindingSection then
                    matchTerms lineNum (stripNonProse line))

    List.ofSeq findings

/// Reads and scans one Markdown file.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let scanVendorFile (path: string) : VendorFinding list =
    scanVendorLines path (File.ReadAllText path)

/// Recursively scans every `.md` file under `root`, skipping the
/// convention-definition file and its split children.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let walkVendor (root: string) : VendorFinding list =
    walkAllFiles root
    |> List.filter (fun p -> p.EndsWith(".md", StringComparison.Ordinal))
    |> List.filter (fun p ->
        let slashed = p.Replace('\\', '/')

        not (
            slashed.EndsWith(ForbiddenConventionSuffix, StringComparison.Ordinal)
            || slashed.Contains ForbiddenConventionDirSuffix
        ))
    |> List.collect scanVendorFile

/// Root-level instruction files in scope alongside the `repo-governance/`
/// subtree.
let private rootInstructionSurfaces = [ "AGENTS.md"; "CLAUDE.md" ]

/// Scans the canonical governance scope from an in-memory repository map.
let scanVendorGovernanceDocuments (documents: Map<string, string>) : VendorFinding list =
    documents
    |> Map.toList
    |> List.filter (fun (path, _) ->
        let normalized = path.Replace('\\', '/')

        normalized.StartsWith("repo-governance/", StringComparison.Ordinal)
        || List.contains normalized rootInstructionSurfaces)
    |> List.filter (fun (path, _) -> path.EndsWith(".md", StringComparison.OrdinalIgnoreCase))
    |> List.collect (fun (path, content) -> scanVendorLines path content)
    |> List.sortBy (fun finding -> finding.Path, finding.Line, finding.Match)

/// Walks the canonical governance audit scope: every `.md` file under
/// `repo-governance/` plus the root instruction surfaces. Narrower than a
/// whole-repo walk, so build caches, app content, worktrees, and vendored
/// third-party skills are never scanned.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let walkVendorGovernanceScope (repoRoot: string) : VendorFinding list =
    walkVendor (Path.Combine(repoRoot, "repo-governance"))
    @ (rootInstructionSurfaces
       |> List.map (fun name -> Path.Combine(repoRoot, name))
       |> List.filter isFile
       |> List.collect scanVendorFile)

/// Renders vendor findings the way the CLI's text output does.
let formatVendorText (findings: VendorFinding list) : string =
    if List.isEmpty findings then
        "GOVERNANCE VENDOR AUDIT PASSED: no violations found\n"
    else
        let sb = StringBuilder()

        sb.Append(sprintf "GOVERNANCE VENDOR AUDIT FAILED: %d violation(s) found\n" (List.length findings))
        |> ignore

        for f in findings do
            sb.Append(sprintf "  %s:%d  %s  →  %s\n" f.Path f.Line f.Match f.Replacement)
            |> ignore

        sb.ToString()

// ---------------------------------------------------------------------------
// Governance audit orchestrator
// [Repo-grounded — `apps/rhino-cli/src/application/repo_governance/audit_orchestrator.rs`]
// ---------------------------------------------------------------------------

/// JSON schema identifier embedded in every audit envelope.
[<Literal>]
let AuditEnvelopeSchema = "rhino-cli/repo-governance-audit/v1"

[<Literal>]
let private AuditSeverityHigh = "high"

[<Literal>]
let private AuditCriticalityHigh = "HIGH"

/// The fixed execution order of the audit categories.
let auditCategoryOrder: string list =
    [ "layer-coherence"
      "traceability-audit"
      "vendor-audit"
      "governance-word-budget" ]

/// The CLI sub-command that runs `name`; empty for an unrecognised name.
let auditCategoryCommand (name: string) : string =
    match name with
    | "layer-coherence" -> "repo-governance layer-coherence validate"
    | "traceability-audit" -> "repo-governance traceability validate"
    | "vendor-audit" -> "repo-governance vendor validate"
    | "governance-word-budget" -> "governance word-budget validate"
    | _ -> ""

/// Configuration for a single audit run.
type AuditOptions =
    {
        RepoRoot: string
        /// Category names to skip entirely.
        Skip: string list
        /// When non-empty, only these categories run.
        IncludeOnly: string list
        /// Override for the `ran_at` timestamp; `None` uses the current UTC time.
        Now: string option
        /// Known-false-positives Markdown file; `None` defaults to
        /// `local-tmp/.known-false-positives.md` under the repo root.
        KnownFalsePositivesPath: string option
        /// Findings whose `File` matches any of these globs are dropped.
        ExcludeGlobs: string list
    }

/// A single governance finding, in the orchestrator's normalised shape.
type AuditFinding =
    {
        /// Stable suppression key: `<category>|<file>|<sha256 prefix 8>`.
        Key: string
        Severity: string
        Criticality: string
        File: string
        /// 1-based line; `0` means "no line", and is omitted from JSON.
        Line: int
        Message: string
    }

/// One category's outcome.
type AuditCategoryResult =
    { Name: string
      Command: string
      Passed: bool
      Findings: AuditFinding list }

/// The audit's detailed result.
type AuditResult =
    { GitSha: string
      RanAt: string
      TotalFindings: int
      BySeverity: Map<string, int>
      ByCategory: Map<string, int>
      Categories: AuditCategoryResult list
      SkippedFalsePositives: AuditFinding list }

/// Top-level envelope returned by [`runAudit`].
type AuditEnvelope =
    {
        Schema: string
        /// `"ok"` when zero findings survive, else `"failed"`.
        Status: string
        Result: AuditResult
    }

/// Stable, human-readable key: the message's SHA-256 prefix, qualified by
/// category and file.
let private buildAuditKey (category: string) (file: string) (message: string) : string =
    use sha = Security.Cryptography.SHA256.Create()
    let digest = sha.ComputeHash(Encoding.UTF8.GetBytes message)

    let hex =
        digest
        |> Array.take 4
        |> Array.map (fun b -> b.ToString "x2")
        |> String.concat ""

    sprintf "%s|%s|%s" category file hex

/// Creates one deterministic normalized finding without consulting resources.
/// This is the pure boundary used by Unit tests and category adapters alike.
let createAuditFinding (category: string) (file: string) (line: int) (message: string) =
    { Key = buildAuditKey category file message
      Severity = AuditSeverityHigh
      Criticality = AuditCriticalityHigh
      File = file
      Line = line
      Message = message }

/// Minimal `*`-wildcard matcher: the segments between `*`s must appear in
/// order, with the first anchored to the start and the last to the end.
let private simpleMatch (pattern: string) (s: string) : bool =
    let parts = pattern.Split('*')

    if parts.Length = 1 then
        pattern = s
    else
        let mutable pos = 0
        let mutable ok = true
        let mutable finished = false
        let mutable result = true

        for i in 0 .. parts.Length - 1 do
            if ok && not finished then
                let part = parts.[i]

                if i = 0 then
                    if not (s.Substring(pos).StartsWith(part, StringComparison.Ordinal)) then
                        ok <- false
                    else
                        pos <- pos + part.Length
                elif i = parts.Length - 1 then
                    result <- s.Substring(pos).EndsWith(part, StringComparison.Ordinal)
                    finished <- true
                else
                    let idx = s.Substring(pos).IndexOf(part, StringComparison.Ordinal)

                    if idx < 0 then
                        ok <- false
                    else
                        pos <- pos + idx + part.Length

        ok && result

/// `true` when `path` matches at least one glob. Supports a `/**` subtree
/// suffix plus simple `*` wildcards.
let private pathMatchesAnyGlob (path: string) (globs: string list) : bool =
    let slashedPath = path.Replace('\\', '/')

    globs
    |> List.exists (fun g ->
        let slashedGlob = g.Replace('\\', '/')

        if slashedGlob.EndsWith("/**", StringComparison.Ordinal) then
            let prefix = slashedGlob.Substring(0, slashedGlob.Length - 3)

            slashedPath.Contains(sprintf "/%s/" prefix)
            || slashedPath.StartsWith(sprintf "%s/" prefix, StringComparison.Ordinal)
            || slashedPath.EndsWith(sprintf "/%s" prefix, StringComparison.Ordinal)
            || slashedPath.Split('/') |> Array.exists (fun part -> part = prefix)
        else
            simpleMatch g path || simpleMatch slashedGlob slashedPath)

let private filterExcluded (findings: AuditFinding list) (excludeGlobs: string list) =
    if List.isEmpty excludeGlobs then
        findings
    else
        findings |> List.filter (fun f -> not (pathMatchesAnyGlob f.File excludeGlobs))

/// Sorts by file, then line, then key — a stable, deterministic order.
let private sortAuditFindings (findings: AuditFinding list) : AuditFinding list =
    findings
    |> List.sortWith (fun a b ->
        match String.CompareOrdinal(a.File, b.File) with
        | 0 ->
            match compare a.Line b.Line with
            | 0 -> String.CompareOrdinal(a.Key, b.Key)
            | other -> other
        | other -> other)

/// Backtick-quoted keys in a known-false-positives Markdown bullet list.
let private knownFalsePositiveRe =
    Regex(@"^\s*-\s+`([^`]+)`", RegexOptions.Multiline)

/// Loads the suppression keys; an absent file yields an empty set.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private loadKnownFalsePositives (opts: AuditOptions) : Set<string> =
    let path =
        opts.KnownFalsePositivesPath
        |> Option.defaultValue (Path.Combine(opts.RepoRoot, "local-tmp", ".known-false-positives.md"))

    if not (File.Exists path) then
        Set.empty
    else
        knownFalsePositiveRe.Matches(File.ReadAllText path)
        |> Seq.map (fun m -> m.Groups.[1].Value)
        |> Set.ofSeq

/// Moves every finding whose key is suppressed out of its category. The
/// skipped list sorts by key for deterministic output.
let private partitionFalsePositives
    (categories: AuditCategoryResult list)
    (skipSet: Set<string>)
    : AuditCategoryResult list * AuditFinding list =
    let skipped = ResizeArray<AuditFinding>()

    let kept =
        categories
        |> List.map (fun c ->
            let keptFindings, suppressed =
                c.Findings |> List.partition (fun f -> not (Set.contains f.Key skipSet))

            skipped.AddRange suppressed

            { c with
                Findings = keptFindings
                Passed = List.isEmpty keptFindings })

    kept,
    skipped
    |> List.ofSeq
    |> List.sortWith (fun a b -> String.CompareOrdinal(a.Key, b.Key))

/// Short `HEAD` SHA, or `"unknown"` when git cannot answer.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private readGitSha (repoRoot: string) : string =
    try
        let psi =
            Diagnostics.ProcessStartInfo(
                FileName = "git",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false
            )

        [ "-C"; repoRoot; "rev-parse"; "--short"; "HEAD" ]
        |> List.iter psi.ArgumentList.Add

        psi.Environment.Remove "GIT_DIR" |> ignore
        psi.Environment.Remove "GIT_WORK_TREE" |> ignore

        use proc = Diagnostics.Process.Start psi
        let stdout = proc.StandardOutput.ReadToEnd()
        proc.WaitForExit()

        if proc.ExitCode = 0 then stdout.Trim() else "unknown"
    with _ ->
        "unknown"

/// Only hard `Fail` word-budget findings block this preflight — `Warn` is
/// advisory, matching `governance word-budget validate`'s own exit gating.
/// Per-file surface budgets are RHINO's; this category measures only the
/// resolved `@`-import tree.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private auditWordBudget (repoRoot: string) : AuditFinding list =
    match Governance.mergedBudgetConfig repoRoot with
    | Error _
    | Ok None -> []
    | Ok(Some config) ->
        Governance.checkResolvedTree repoRoot config
        |> Option.toList
        |> List.filter (fun f -> f.Severity = Governance.WordBudgetSeverity.Fail)
        |> List.map (fun f -> createAuditFinding "governance-word-budget" f.Path 0 f.Message)

/// Runs one category and normalises its findings.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let runAuditCategory (name: string) (opts: AuditOptions) : AuditFinding list =
    match name with
    | "layer-coherence" ->
        auditLayerCoherence opts.RepoRoot
        |> List.map (fun f -> createAuditFinding name f.File 0 f.Message)
    | "traceability-audit" ->
        auditTraceability opts.RepoRoot
        |> List.map (fun f -> createAuditFinding name f.Path f.Line f.Message)
    | "vendor-audit" ->
        walkVendorGovernanceScope opts.RepoRoot
        |> List.map (fun f ->
            createAuditFinding name f.Path f.Line (sprintf "forbidden term '%s' → use '%s'" f.Match f.Replacement))
    | "governance-word-budget" -> auditWordBudget opts.RepoRoot
    | other -> failwithf "unknown category %s" other

/// Pure audit orchestration over supplied category results and environmental
/// values. Mandatory Unit tests call this function without filesystem,
/// process, clock, or network access.
let runAuditCore
    (runCategory: string -> AuditOptions -> AuditFinding list)
    (knownFalsePositives: Set<string>)
    (gitSha: string)
    (ranAt: string)
    (opts: AuditOptions)
    : AuditEnvelope =
    let categories =
        auditCategoryOrder
        |> List.filter (fun name ->
            not (List.contains name opts.Skip)
            && (List.isEmpty opts.IncludeOnly || List.contains name opts.IncludeOnly))
        |> List.map (fun name ->
            let findings =
                filterExcluded (runCategory name opts) opts.ExcludeGlobs |> sortAuditFindings

            { Name = name
              Command = auditCategoryCommand name
              Passed = List.isEmpty findings
              Findings = findings })

    let categories, skipped = partitionFalsePositives categories knownFalsePositives

    let total = categories |> List.sumBy (fun c -> List.length c.Findings)

    let byCategory =
        categories |> List.map (fun c -> c.Name, List.length c.Findings) |> Map.ofList

    let bySeverity =
        categories
        |> List.collect (fun c -> c.Findings)
        |> List.countBy (fun f -> f.Severity)
        |> Map.ofList

    { Schema = AuditEnvelopeSchema
      Status = (if total > 0 then "failed" else "ok")
      Result =
        { GitSha = gitSha
          RanAt = ranAt
          TotalFindings = total
          BySeverity = bySeverity
          ByCategory = byCategory
          Categories = categories
          SkippedFalsePositives = skipped } }

/// Runs every selected governance audit and returns one consolidated
/// envelope. `runCategory` is the category runner — the real one by default;
/// scenarios inject a fixed finding set through [`runAuditWith`].
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let runAuditWith (runCategory: string -> AuditOptions -> AuditFinding list) (opts: AuditOptions) : AuditEnvelope =
    let ranAt =
        opts.Now
        |> Option.defaultWith (fun () ->
            DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ", Globalization.CultureInfo.InvariantCulture))

    runAuditCore runCategory (loadKnownFalsePositives opts) (readGitSha opts.RepoRoot) ranAt opts

/// Runs every selected governance audit against the real repository tree.
[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let runAudit (opts: AuditOptions) : AuditEnvelope = runAuditWith runAuditCategory opts

let private auditJsonOptions =
    JsonSerializerOptions(WriteIndented = true, Encoder = Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping)

/// Renders `envelope` as the JSON the CLI prints. Field order is fixed and
/// `file`/`line` are omitted when empty or zero, so two runs over identical
/// inputs produce byte-identical output.
let formatAuditJson (envelope: AuditEnvelope) : string =
    let findingNode (f: AuditFinding) : JsonNode =
        let node = JsonObject()
        node.["key"] <- JsonValue.Create f.Key
        node.["severity"] <- JsonValue.Create f.Severity
        node.["criticality"] <- JsonValue.Create f.Criticality

        if f.File <> "" then
            node.["file"] <- JsonValue.Create f.File

        if f.Line <> 0 then
            node.["line"] <- JsonValue.Create f.Line

        node.["message"] <- JsonValue.Create f.Message
        node :> JsonNode

    let counts (m: Map<string, int>) : JsonNode =
        let node = JsonObject()

        for KeyValue(key, value) in m do
            node.[key] <- JsonValue.Create value

        node :> JsonNode

    let categoryNode (c: AuditCategoryResult) : JsonNode =
        let node = JsonObject()
        node.["name"] <- JsonValue.Create c.Name
        node.["command"] <- JsonValue.Create c.Command
        node.["passed"] <- JsonValue.Create c.Passed
        node.["findings"] <- JsonArray(c.Findings |> List.map findingNode |> Array.ofList)
        node :> JsonNode

    let result = JsonObject()
    result.["git_sha"] <- JsonValue.Create envelope.Result.GitSha
    result.["ran_at"] <- JsonValue.Create envelope.Result.RanAt
    result.["total_findings"] <- JsonValue.Create envelope.Result.TotalFindings
    result.["by_severity"] <- counts envelope.Result.BySeverity
    result.["by_category"] <- counts envelope.Result.ByCategory
    result.["categories"] <- JsonArray(envelope.Result.Categories |> List.map categoryNode |> Array.ofList)

    result.["skipped_false_positives"] <-
        JsonArray(envelope.Result.SkippedFalsePositives |> List.map findingNode |> Array.ofList)

    let root = JsonObject()
    root.["schema"] <- JsonValue.Create envelope.Schema
    root.["status"] <- JsonValue.Create envelope.Status
    root.["result"] <- result
    root.ToJsonString auditJsonOptions
