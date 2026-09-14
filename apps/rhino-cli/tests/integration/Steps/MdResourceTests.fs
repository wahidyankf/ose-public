/// Direct real-filesystem Integration coverage for Markdown application adapters.
module RhinoCli.Tests.Integration.Steps.MdResourceTests

open System
open System.IO
open System.Text.Json
open Xunit
open RhinoCli.Application.Md
open RhinoCli.Domain.Types

module private DirectTestFixtures =

    let newTempDir () : string =
        let dir =
            Path.Combine(Path.GetTempPath(), "rhino-cli-md-direct-" + Guid.NewGuid().ToString("N"))

        Directory.CreateDirectory(dir) |> ignore
        dir

    let writeFile (root: string) (relativePath: string) (content: string) : string =
        let full = Path.Combine(root, relativePath)
        Directory.CreateDirectory(Path.GetDirectoryName(full: string)) |> ignore
        File.WriteAllText(full, content)
        full

// ---- docs-validate-frontmatter.feature — direct edge cases ----

[<Fact>]
let ``validateDocsFrontmatter rejects an empty path list`` () =
    match validateDocsFrontmatter [] with
    | Error message -> Assert.Equal("at least one path is required", message)
    | Ok _ -> Assert.Fail("expected an Error for an empty path list")

[<Fact>]
let ``An explicit YAML null value for a present frontmatter field is treated as empty`` () =
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile
        dir
        "docs/explanation/software-engineering/foo.md"
        "---\ntitle: null\ndescription: D\ncategory: explanation\nsubcategory: S\ntags: [a]\n---\nbody\n"
    |> ignore

    match validateDocsFrontmatter [ dir ] with
    | Ok findings ->
        Assert.Contains(
            findings,
            fun (f: Finding) ->
                f.Severity = Severity.Blocking
                && f.Message.Contains("\"title\" is empty", StringComparison.Ordinal)
        )
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``A tags field that is not a YAML sequence fails the non-empty-list requirement`` () =
    let mappingDir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile
        mappingDir
        "docs/explanation/software-engineering/foo.md"
        "---\ntitle: T\ndescription: D\ncategory: explanation\nsubcategory: S\ntags: {a: b}\n---\nbody\n"
    |> ignore

    let scalarDir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile
        scalarDir
        "docs/explanation/software-engineering/foo.md"
        "---\ntitle: T\ndescription: D\ncategory: explanation\nsubcategory: S\ntags: 42\n---\nbody\n"
    |> ignore

    for dir in [ mappingDir; scalarDir ] do
        match validateDocsFrontmatter [ dir ] with
        | Ok findings ->
            Assert.Contains(
                findings,
                fun (f: Finding) ->
                    f.Severity = Severity.Blocking
                    && f.Message.Contains("\"tags\" must be a non-empty list", StringComparison.Ordinal)
            )
        | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``Software-engineering doc with an empty description fails`` () =
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile
        dir
        "docs/explanation/software-engineering/foo.md"
        "---\ntitle: T\ndescription: \"\"\ncategory: explanation\nsubcategory: S\ntags: [a]\n---\nbody\n"
    |> ignore

    match validateDocsFrontmatter [ dir ] with
    | Ok findings ->
        Assert.Contains(
            findings,
            fun (f: Finding) ->
                f.Severity = Severity.Blocking
                && f.Message.Contains("\"description\" is empty", StringComparison.Ordinal)
        )
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``Software-engineering doc with an empty subcategory fails`` () =
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile
        dir
        "docs/explanation/software-engineering/foo.md"
        "---\ntitle: T\ndescription: D\ncategory: explanation\nsubcategory: \"\"\ntags: [a]\n---\nbody\n"
    |> ignore

    match validateDocsFrontmatter [ dir ] with
    | Ok findings ->
        Assert.Contains(
            findings,
            fun (f: Finding) ->
                f.Severity = Severity.Blocking
                && f.Message.Contains("\"subcategory\" is empty", StringComparison.Ordinal)
        )
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``Governance doc whose two allowed keys are present but empty fails on both`` () =
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile
        dir
        "repo-governance/conventions/foo.md"
        "---\ndescription: \"\"\nwhen_to_use: \"\"\n---\nbody\n"
    |> ignore

    match validateDocsFrontmatter [ dir ] with
    | Ok findings ->
        Assert.Contains(
            findings,
            fun (f: Finding) ->
                f.Severity = Severity.Blocking
                && f.Message.Contains("\"description\" is empty", StringComparison.Ordinal)
        )

        Assert.Contains(
            findings,
            fun (f: Finding) ->
                f.Severity = Severity.Blocking
                && f.Message.Contains("\"when_to_use\" is empty", StringComparison.Ordinal)
        )
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``A markdown file with no frontmatter fences at all leaves the absent block to RHINO`` () =
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile
        dir
        "docs/explanation/software-engineering/no-frontmatter.md"
        "# Just a title\n\nNo frontmatter here.\n"
    |> ignore

    match validateDocsFrontmatter [ dir ] with
    | Ok findings -> Assert.Empty(findings)
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``A frontmatter block that is not valid YAML fails with a parse-error finding`` () =
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile
        dir
        "docs/explanation/software-engineering/bad-yaml.md"
        "---\ntitle: [unterminated\n---\nbody\n"
    |> ignore

    match validateDocsFrontmatter [ dir ] with
    | Ok findings ->
        Assert.Contains(
            findings,
            fun (f: Finding) -> f.Message.Contains("frontmatter is not valid YAML", StringComparison.Ordinal)
        )
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``A frontmatter block that parses as a YAML sequence rather than a mapping is treated as an empty frontmatter map``
    ()
    =
    // Valid YAML, but not a mapping (`asRawMap`'s `_ -> None` arm) — falls
    // back to an empty map rather than an `invalid-yaml` finding. An empty map
    // has no present-but-blank value, and RHINO reports the absent keys.
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile
        dir
        "docs/explanation/software-engineering/list-frontmatter.md"
        "---\n- a\n- b\n---\nbody\n"
    |> ignore

    match validateDocsFrontmatter [ dir ] with
    | Ok findings -> Assert.Empty(findings)
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``validateDocsFrontmatter accepts a single markdown file path in place of a directory`` () =
    let dir = DirectTestFixtures.newTempDir ()

    let filePath =
        DirectTestFixtures.writeFile
            dir
            "docs/explanation/software-engineering/single.md"
            "---\ntitle: T\ndescription: D\ncategory: explanation\nsubcategory: S\ntags: [a]\n---\nbody\n"

    match validateDocsFrontmatter [ filePath ] with
    | Ok findings ->
        Assert.False(
            findings |> List.exists (fun f -> f.Severity = Severity.Blocking),
            "expected no fail-level findings"
        )
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``validateDocsFrontmatter skips files under a node_modules subdirectory`` () =
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile
        dir
        "node_modules/docs/explanation/software-engineering/bad.md"
        "no frontmatter at all\n"
    |> ignore

    DirectTestFixtures.writeFile
        dir
        "docs/explanation/software-engineering/good.md"
        "---\ntitle: T\ndescription: D\ncategory: explanation\nsubcategory: S\ntags: [a]\n---\nbody\n"
    |> ignore

    match validateDocsFrontmatter [ dir ] with
    | Ok findings ->
        Assert.DoesNotContain(
            findings,
            fun (f: Finding) ->
                (f.Path |> Option.defaultValue "").Replace('\\', '/').Contains("node_modules", StringComparison.Ordinal)
        )
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

// ---- docs-validate-links.feature — direct edge cases ----

[<Fact>]
let ``validateDocsLinks accepts a RepoRoot that points directly at a single markdown file`` () =
    let dir = DirectTestFixtures.newTempDir ()

    let filePath =
        DirectTestFixtures.writeFile dir "note.md" "See ![missing](./does-not-exist.png) for details.\n"

    let findings =
        validateDocsLinks
            { RepoRoot = filePath
              StagedFiles = None
              ExcludePrefixes = [] }

    Assert.Contains(findings, fun (f: Finding) -> f.Severity = Severity.Blocking)

[<Fact>]
let ``validateDocsLinks returns no findings when RepoRoot does not exist on the filesystem`` () =
    let dir = DirectTestFixtures.newTempDir ()
    let missing = Path.Combine(dir, "does-not-exist-subdir")

    let findings =
        validateDocsLinks
            { RepoRoot = missing
              StagedFiles = None
              ExcludePrefixes = [] }

    Assert.Empty(findings)

[<Fact>]
let ``A markdown file under a .claude/skills tree is exempt from link validation`` () =
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile dir ".claude/skills/foo/SKILL.md" "See [missing](./does-not-exist.md).\n"
    |> ignore

    let findings =
        validateDocsLinks
            { RepoRoot = dir
              StagedFiles = None
              ExcludePrefixes = [] }

    Assert.Empty(findings)

[<Fact>]
let ``A same-file anchor link that matches an existing heading passes validation`` () =
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile dir "self-anchor.md" "# Title\n\n## Section\n\nSee [here](#section).\n"
    |> ignore

    let findings =
        validateDocsLinks
            { RepoRoot = dir
              StagedFiles = None
              ExcludePrefixes = [] }

    Assert.Empty(findings)

[<Fact>]
let ``A markdown link whose URL is a bare hash with no anchor name is silently ignored`` () =
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile dir "bare-hash.md" "See [here](#) below.\n"
    |> ignore

    let findings =
        validateDocsLinks
            { RepoRoot = dir
              StagedFiles = None
              ExcludePrefixes = [] }

    Assert.Empty(findings)

[<Fact>]
let ``shouldSkipLink recognizes Hugo shortcodes, bracket placeholders, and non-relative image paths`` () =
    Assert.True(shouldSkipLink "{{< ref \"foo\" >}}")
    Assert.True(shouldSkipLink "[my-placeholder]")
    Assert.True(shouldSkipLink "assets/images/logo.png")
    Assert.False(shouldSkipLink "../images/logo.png")

[<Fact>]
let ``categorizeBrokenLink maps a broken link's path to its report category`` () =
    Assert.Equal("workflows/ paths", categorizeBrokenLink "some/workflows/doc.md")
    Assert.Equal("vision/ paths", categorizeBrokenLink "some/vision/doc.md")
    Assert.Equal("conventions README", categorizeBrokenLink "repo-governance/conventions/README.md")
    Assert.Equal("Missing files", categorizeBrokenLink "CODE_OF_CONDUCT.md")
    Assert.Equal("Missing files", categorizeBrokenLink "CHANGELOG.md")
    Assert.Equal("General/other paths", categorizeBrokenLink "docs/reference/whatever.md")

[<Fact>]
let ``validateAllLinksDetailed reports broken links, broken anchors, and their categories`` () =
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile dir "broken.md" "See ![missing](./workflows/gone.png) and [bare](#).\n"
    |> ignore

    let result =
        validateAllLinksDetailed
            { RepoRoot = dir
              StagedFiles = None
              ExcludePrefixes = [] }

    Assert.Equal(1, result.TotalFiles)
    Assert.Equal(2, result.TotalLinks)
    Assert.Contains(result.BrokenLinks, fun (b: BrokenLink) -> b.Category = "workflows/ paths")
    Assert.True(result.BrokenByCategory.ContainsKey "workflows/ paths")

// ---- docs-validate-mermaid.feature — direct edge cases ----

[<Fact>]
let ``parseMermaidDiagram parses BT and RL flowchart directions`` () =
    let btBlocks =
        extractMermaidBlocks "bt.md" "```mermaid\nflowchart BT\n    A --> B\n```\n"

    let btDiagram, btCount = parseMermaidDiagram (List.head btBlocks)
    Assert.Equal(1, btCount)
    Assert.Equal(MermaidBT, btDiagram.Direction)

    let rlBlocks =
        extractMermaidBlocks "rl.md" "```mermaid\nflowchart RL\n    A --> B\n```\n"

    let rlDiagram, rlCount = parseMermaidDiagram (List.head rlBlocks)
    Assert.Equal(1, rlCount)
    Assert.Equal(MermaidRL, rlDiagram.Direction)

[<Fact>]
let ``mermaidViolationKindCode maps every violation kind to its stable code`` () =
    Assert.Equal("width_exceeded", mermaidViolationKindCode MermaidWidthExceeded)
    Assert.Equal("multiple_diagrams", mermaidViolationKindCode MermaidMultipleDiagrams)

[<Fact>]
let ``A mermaid block containing only comments is treated as OtherKind and produces no findings`` () =
    let block: MermaidBlock =
        { FilePath = "x.md"
          BlockIndex = 0
          Source = "%% nothing here"
          StartLine = 1 }

    let result = validateMermaidBlocks [ block ] defaultMermaidValidateOptions

    Assert.Empty(result.Violations)
    Assert.Empty(result.Warnings)
    Assert.Equal(1, result.BlocksScanned)
    Assert.Equal(1, result.FilesScanned)

[<Fact>]
let ``Quoted node labels have their surrounding quotes stripped, and single-character labels pass through unchanged``
    ()
    =
    let blocks =
        extractMermaidBlocks "d.md" "```mermaid\nflowchart TD\n    A[\"Hello World\"] --> B[x]\n```\n"

    let diagram, _ = parseMermaidDiagram (List.head blocks)

    let labelOf id =
        (diagram.Nodes |> List.find (fun n -> n.Id = id)).Label

    Assert.Equal("Hello World", labelOf "A")
    Assert.Equal("x", labelOf "B")

[<Fact>]
let ``A node referenced bare in an edge and later declared with a label keeps the later label`` () =
    let blocks =
        extractMermaidBlocks "d.md" "```mermaid\nflowchart TD\n    A --> B\n    A[Node A Label]\n```\n"

    let diagram, _ = parseMermaidDiagram (List.head blocks)
    let nodeA = diagram.Nodes |> List.find (fun n -> n.Id = "A")
    Assert.Equal("Node A Label", nodeA.Label)

[<Fact>]
let ``A standalone bare node identifier line declares a new node with an empty label`` () =
    let blocks =
        extractMermaidBlocks "d.md" "```mermaid\nflowchart TD\n    A --> B\n    C\n```\n"

    let diagram, _ = parseMermaidDiagram (List.head blocks)
    let ids = diagram.Nodes |> List.map (fun n -> n.Id)
    Assert.Contains("C", ids)
    let nodeC = diagram.Nodes |> List.find (fun n -> n.Id = "C")
    Assert.Equal("", nodeC.Label)

[<Fact>]
let ``An unrecognized node-shape segment on an edge line contributes no node and no edge`` () =
    let blocks =
        extractMermaidBlocks "d.md" "```mermaid\nflowchart TD\n    A --> foo-bar\n```\n"

    let diagram, _ = parseMermaidDiagram (List.head blocks)
    Assert.Contains("A", diagram.Nodes |> List.map (fun n -> n.Id))
    Assert.Empty(diagram.Edges)

[<Fact>]
let ``A double-ampersand separator in an edge group is ignored rather than producing a phantom node`` () =
    let blocks =
        extractMermaidBlocks "d.md" "```mermaid\nflowchart TD\n    A && B --> C\n```\n"

    let diagram, _ = parseMermaidDiagram (List.head blocks)
    let ids = diagram.Nodes |> List.map (fun n -> n.Id) |> List.sort
    Assert.Equal<string list>([ "A"; "B"; "C" ], ids)
    let edgePairs = diagram.Edges |> List.map (fun e -> e.From, e.To) |> List.sort
    Assert.Equal<(string * string) list>([ "A", "C"; "B", "C" ], edgePairs)

[<Fact>]
let ``A subgraph header that does not match the strict grammar falls back to a plain-text label`` () =
    let blocks =
        extractMermaidBlocks
            "d.md"
            "```mermaid\nflowchart TD\n    subgraph My Custom Group\n    A --> B\n    end\n```\n"

    let diagram, _ = parseMermaidDiagram (List.head blocks)
    Assert.Equal(1, diagram.Subgraphs.Length)
    let sg = List.head diagram.Subgraphs
    Assert.Equal("", sg.Id)
    Assert.Equal("My Custom Group", sg.Label)

[<Fact>]
let ``parseMermaidDiagram reports a zero header count and an empty diagram for a block with no flowchart header`` () =
    let block: MermaidBlock =
        { FilePath = "x.md"
          BlockIndex = 0
          Source = "A --> B"
          StartLine = 1 }

    let diagram, count = parseMermaidDiagram block

    Assert.Equal(0, count)
    Assert.Equal(MermaidTB, diagram.Direction)
    Assert.Empty(diagram.Nodes)
    Assert.Empty(diagram.Edges)

[<Fact>]
let ``A bare "flowchart" header with no direction suffix defaults to top-to-bottom`` () =
    let blocks = extractMermaidBlocks "d.md" "```mermaid\nflowchart\n    A --> B\n```\n"
    let diagram, count = parseMermaidDiagram (List.head blocks)
    Assert.Equal(1, count)
    Assert.Equal(MermaidTB, diagram.Direction)

[<Fact>]
let ``A subgraph left unclosed at end of block is still recorded when the block ends`` () =
    let blocks =
        extractMermaidBlocks "d.md" "```mermaid\nflowchart TD\n    subgraph WF [Group]\n    A --> B\n```\n"

    let diagram, _ = parseMermaidDiagram (List.head blocks)
    Assert.Equal(1, diagram.Subgraphs.Length)
    let sg = List.head diagram.Subgraphs
    Assert.Equal("Group", sg.Label)
    Assert.Equal<string list>([ "A"; "B" ], sg.NodeIds)

[<Fact>]
let ``mermaidMaxWidth and mermaidDepth return zero for an empty diagram`` () =
    Assert.Equal(0, mermaidMaxWidth [] [])
    Assert.Equal(0, mermaidDepth [] [])

[<Fact>]
let ``A state-diagram edge label written as "b: label" without a leading space before the colon is parsed`` () =
    let longLabel = String.replicate 35 "z"

    let block: MermaidBlock =
        { FilePath = "state.md"
          BlockIndex = 0
          Source = sprintf "stateDiagram-v2\n    a --> b: %s" longLabel
          StartLine = 1 }

    let result =
        validateMermaidBlocks
            [ block ]
            { defaultMermaidValidateOptions with
                MaxLabelLen = 30 }

    Assert.Contains(
        result.Violations,
        fun (v: MermaidViolation) -> v.Kind = MermaidLabelTooLong && v.NodeId = "a-->b" && v.LabelText = longLabel
    )

[<Fact>]
let ``A state-diagram arrow line with an empty source is ignored without crashing the parser`` () =
    let block: MermaidBlock =
        { FilePath = "state.md"
          BlockIndex = 0
          Source = "stateDiagram-v2\n    --> orphan\n    a --> b\n"
          StartLine = 1 }

    let result = validateMermaidBlocks [ block ] defaultMermaidValidateOptions

    Assert.Empty(result.Violations)
    Assert.Empty(result.Warnings)
    Assert.Equal(1, result.BlocksScanned)

[<Fact>]
let ``A lone "--" separator line in a state diagram is ignored`` () =
    let block: MermaidBlock =
        { FilePath = "state.md"
          BlockIndex = 0
          Source = "stateDiagram-v2\n    [*] --> a\n    --\n    a --> b\n"
          StartLine = 1 }

    let result = validateMermaidBlocks [ block ] defaultMermaidValidateOptions

    Assert.Empty(result.Violations)
    Assert.Empty(result.Warnings)

[<Fact>]
let ``LR and RL directions swap width and depth for state diagrams`` () =
    let fanOut direction =
        sprintf
            "stateDiagram-v2\n    direction %s\n    root --> a\n    root --> b\n    root --> c\n    root --> d\n    root --> e"
            direction

    for direction in [ "LR"; "RL" ] do
        let block: MermaidBlock =
            { FilePath = "state.md"
              BlockIndex = 0
              Source = fanOut direction
              StartLine = 1 }

        let result = validateMermaidBlocks [ block ] defaultMermaidValidateOptions

        Assert.True(
            List.isEmpty result.Violations,
            sprintf
                "expected direction %s to swap width/depth and avoid a width violation, got %A"
                direction
                result.Violations
        )

[<Fact>]
let ``BT and an unrecognized direction word do not swap width and depth for state diagrams`` () =
    let fanOut direction =
        sprintf
            "stateDiagram-v2\n    direction %s\n    root --> a\n    root --> b\n    root --> c\n    root --> d\n    root --> e"
            direction

    for direction in [ "BT"; "SIDEWAYS" ] do
        let block: MermaidBlock =
            { FilePath = "state.md"
              BlockIndex = 0
              Source = fanOut direction
              StartLine = 1 }

        let result = validateMermaidBlocks [ block ] defaultMermaidValidateOptions

        Assert.Contains(result.Violations, fun (v: MermaidViolation) -> v.Kind = MermaidWidthExceeded)

[<Fact>]
let ``A state "label" as ID declaration with an oversized label reports a label-too-long violation for that node`` () =
    // `state "..." as N` must precede any bare reference to N: `ensureNode` is
    // first-write-wins, so a later `[*] --> N` edge line would otherwise
    // register N's label as the plain id "N" first and silently keep it.
    let longLabel = String.replicate 35 "q"

    let block: MermaidBlock =
        { FilePath = "state.md"
          BlockIndex = 0
          Source = sprintf "stateDiagram-v2\n    state \"%s\" as N\n    [*] --> N" longLabel
          StartLine = 1 }

    let result =
        validateMermaidBlocks
            [ block ]
            { defaultMermaidValidateOptions with
                MaxLabelLen = 30 }

    Assert.Contains(
        result.Violations,
        fun (v: MermaidViolation) -> v.Kind = MermaidLabelTooLong && v.NodeId = "N" && v.LabelText = longLabel
    )

[<Fact>]
let ``Malformed state declarations are silently ignored without crashing the parser`` () =
    let block: MermaidBlock =
        { FilePath = "state.md"
          BlockIndex = 0
          Source =
            "stateDiagram-v2\n    [*] --> a\n    state \"Unterminated label as X\n    state \"Label\" alias Y\n    a --> b"
          StartLine = 1 }

    let result = validateMermaidBlocks [ block ] defaultMermaidValidateOptions

    Assert.Empty(result.Violations)
    Assert.Empty(result.Warnings)

[<Fact>]
let ``A flowchart-looking header that does not cleanly match the direction grammar produces no findings`` () =
    let block: MermaidBlock =
        { FilePath = "d.md"
          BlockIndex = 0
          Source = "flowchart TD extra-junk\n    A --> B"
          StartLine = 1 }

    let result = validateMermaidBlocks [ block ] defaultMermaidValidateOptions

    Assert.Empty(result.Violations)
    Assert.Empty(result.Warnings)
    Assert.Equal(1, result.FilesScanned)
    Assert.Equal(1, result.BlocksScanned)

[<Fact>]
let ``A MaxSubgraphNodes of zero disables the subgraph density check entirely`` () =
    let block: MermaidBlock =
        { FilePath = "d.md"
          BlockIndex = 0
          Source =
            "flowchart TD\n    subgraph WF [Group]\n    A --> B\n    B --> C\n    C --> D\n    D --> E\n    E --> F\n    F --> G\n    end"
          StartLine = 1 }

    let opts =
        { defaultMermaidValidateOptions with
            MaxSubgraphNodes = 0 }

    let result = validateMermaidBlocks [ block ] opts

    Assert.DoesNotContain(result.Warnings, fun (w: MermaidWarning) -> w.Kind = MermaidSubgraphDense)

[<Fact>]
let ``validateMermaidDocs accepts an absolute path entry in opts.Paths`` () =
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile
        dir
        "sub/d.md"
        "# Diagram\n\n```mermaid\nflowchart TD\n    A[This label is definitely longer than thirty characters total]\n```\n"
    |> ignore

    let result =
        validateMermaidDocs
            { RepoRoot = dir
              Paths = [ Path.Combine(dir, "sub") ]
              StagedFiles = None
              ChangedFiles = None
              ExcludePrefixes = []
              Options =
                { defaultMermaidValidateOptions with
                    MaxLabelLen = 30 } }

    Assert.Contains(result.Violations, fun (v: MermaidViolation) -> v.Kind = MermaidLabelTooLong)

[<Fact>]
let ``formatMermaidText renders width-exceeded and multiple-diagrams violation detail lines`` () =
    let violations: MermaidViolation list =
        [ { Kind = MermaidWidthExceeded
            FilePath = "w.md"
            BlockIndex = 0
            StartLine = 1
            NodeId = ""
            LabelText = ""
            LabelLen = 0
            MaxLabelLen = 0
            ActualWidth = 5
            MaxWidth = 4 }
          { Kind = MermaidMultipleDiagrams
            FilePath = "w.md"
            BlockIndex = 1
            StartLine = 5
            NodeId = ""
            LabelText = ""
            LabelLen = 0
            MaxLabelLen = 0
            ActualWidth = 0
            MaxWidth = 0 } ]

    let result: MermaidValidationResult =
        { FilesScanned = 1
          BlocksScanned = 2
          Violations = violations
          Warnings = [] }

    let text = formatMermaidText result true false

    Assert.Contains("[FAIL] w.md", text)
    Assert.Contains("exceeds max-width", text)
    Assert.Contains("multiple flowchart/graph headers", text)

[<Fact>]
let ``formatMermaidJson includes actualWidth and maxWidth for a width-exceeded violation`` () =
    let violation: MermaidViolation =
        { Kind = MermaidWidthExceeded
          FilePath = "w.md"
          BlockIndex = 0
          StartLine = 1
          NodeId = ""
          LabelText = ""
          LabelLen = 0
          MaxLabelLen = 0
          ActualWidth = 5
          MaxWidth = 4 }

    let result: MermaidValidationResult =
        { FilesScanned = 1
          BlocksScanned = 1
          Violations = [ violation ]
          Warnings = [] }

    let text = formatMermaidJson result

    use doc = JsonDocument.Parse(text)
    let v = doc.RootElement.GetProperty("violations").[0]
    Assert.Equal(5, v.GetProperty("actualWidth").GetInt32())
    Assert.Equal(4, v.GetProperty("maxWidth").GetInt32())

// ---- repo-governance-frontmatter-audit.feature — direct edge cases ----

[<Fact>]
let ``An unclosed frontmatter fence is treated as no frontmatter, and the whole file is scanned as body`` () =
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile dir "unclosed.md" "---\ntitle: T\n\nNo closing fence, just prose.\n"
    |> ignore

    match validateFrontmatterDates [ dir ] [] with
    | Ok findings -> Assert.Empty(findings)
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``A frontmatter block whose closing fence is the file's last line leaves an empty body`` () =
    let dir = DirectTestFixtures.newTempDir ()
    DirectTestFixtures.writeFile dir "no-body.md" "---\ntitle: T\n---" |> ignore

    match validateFrontmatterDates [ dir ] [] with
    | Ok findings -> Assert.Empty(findings)
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

[<Fact>]
let ``validateFrontmatterDates rejects an empty path list`` () =
    match validateFrontmatterDates [] [] with
    | Error message -> Assert.Equal("at least one path is required", message)
    | Ok _ -> Assert.Fail("expected an Error for an empty path list")

[<Fact>]
let ``validateFrontmatterDatesDetailed rejects an empty path list and reports line numbers on a real violation`` () =
    match validateFrontmatterDatesDetailed [] [] with
    | Error message -> Assert.Equal("at least one path is required", message)
    | Ok _ -> Assert.Fail("expected an Error for an empty path list")

    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile dir "dated.md" "---\ntitle: T\n---\n\n- **Created**: 2026-01-01\n"
    |> ignore

    match validateFrontmatterDatesDetailed [ dir ] [] with
    | Ok findings ->
        Assert.Contains(
            findings,
            fun (f: FrontmatterDatesFinding) ->
                f.File.Replace('\\', '/').EndsWith("dated.md", StringComparison.Ordinal)
                && f.Line = 5
        )
    | Error message -> Assert.Fail(sprintf "expected Ok, got Error %s" message)

// ---- md-audit.feature — direct edge cases ----

[<Fact>]
let ``runAudit fails when the mermaid validator reports a violation`` () =
    let dir = DirectTestFixtures.newTempDir ()

    DirectTestFixtures.writeFile
        dir
        "doc.md"
        "# Title\n\n```mermaid\nflowchart TD\n    A --> B\n    A --> C\n    A --> D\n    A --> E\n    A --> F\n```\n"
    |> ignore

    let result = runAudit dir

    Assert.Contains(result.Failures, fun (f: string) -> f.StartsWith("validate-mermaid", StringComparison.Ordinal))
    Assert.Contains("MD AUDIT FAILED", result.Report)
