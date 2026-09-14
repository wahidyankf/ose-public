/// Pure edge-case coverage for Markdown policy and parser code.
module RhinoCli.Tests.Unit.Steps.MdPureUnitTests

open System
open System.Text.Json
open Xunit
open RhinoCli.Application.Md
open RhinoCli.Domain.Types

let private softwareDoc body =
    "docs/explanation/software-engineering/example.md", body

[<Fact>]
let ``frontmatter documents accept an empty document list`` () =
    Assert.Empty(validateDocsFrontmatterDocuments [])

[<Theory>]
[<InlineData("---\ntitle: null\ndescription: D\ncategory: explanation\nsubcategory: S\ntags: [a]\n---\n",
             "\"title\" is empty")>]
[<InlineData("---\ntitle: T\ndescription: \"\"\ncategory: explanation\nsubcategory: S\ntags: [a]\n---\n",
             "\"description\" is empty")>]
[<InlineData("---\ntitle: T\ndescription: D\ncategory: explanation\nsubcategory: \"\"\ntags: [a]\n---\n",
             "\"subcategory\" is empty")>]
[<InlineData("---\ntitle: T\ndescription: D\ncategory: explanation\nsubcategory: S\ntags: 42\n---\n",
             "\"tags\" must be a non-empty list")>]
[<InlineData("---\ntitle: T\ndescription: D\ncategory: explanation\nsubcategory: S\ntags: {a: b}\n---\n",
             "\"tags\" must be a non-empty list")>]
let ``frontmatter documents report invalid required values`` (body: string) (expected: string) =
    let findings = validateDocsFrontmatterDocuments [ softwareDoc body ]
    Assert.Contains(findings, fun (finding: Finding) -> finding.Message.Contains(expected, StringComparison.Ordinal))

[<Fact>]
let ``frontmatter documents report invalid YAML`` () =
    let findings =
        validateDocsFrontmatterDocuments [ softwareDoc "---\ntitle: [unterminated\n---\n" ]

    Assert.Contains(
        findings,
        fun (finding: Finding) -> finding.Message.Contains("frontmatter is not valid YAML", StringComparison.Ordinal)
    )

[<Fact>]
let ``a document without frontmatter leaves the absent block to RHINO`` () =
    Assert.Empty(validateDocsFrontmatterDocuments [ softwareDoc "# No frontmatter\n" ])

[<Fact>]
let ``a YAML sequence frontmatter is treated as an empty mapping`` () =
    // An empty mapping has no present-but-blank value; RHINO reports the absent keys.
    Assert.Empty(validateDocsFrontmatterDocuments [ softwareDoc "---\n- a\n- b\n---\n" ])

[<Fact>]
let ``governance frontmatter accepts exactly description and when_to_use`` () =
    let findings =
        validateDocsFrontmatterDocuments
            [ "repo-governance/conventions/example.md", "---\ndescription: D\nwhen_to_use: Use this.\n---\n" ]

    Assert.Empty(findings)

[<Fact>]
let ``governance frontmatter rejects a key outside the two-key allow-list`` () =
    let findings =
        validateDocsFrontmatterDocuments
            [ "repo-governance/conventions/example.md", "---\ntitle: T\ndescription: D\nwhen_to_use: Use this.\n---\n" ]

    Assert.Single(findings) |> ignore
    Assert.Contains("field \"title\" is not permitted", findings.Head.Message)

[<Fact>]
let ``link helper classifications are deterministic`` () =
    Assert.True(shouldSkipLink "{{< ref \"foo\" >}}")
    Assert.True(shouldSkipLink "[placeholder]")
    Assert.True(shouldSkipLink "assets/images/logo.png")
    Assert.False(shouldSkipLink "../images/logo.png")
    Assert.Equal("workflows/ paths", categorizeBrokenLink "some/workflows/doc.md")
    Assert.Equal("vision/ paths", categorizeBrokenLink "some/vision/doc.md")
    Assert.Equal("conventions README", categorizeBrokenLink "repo-governance/conventions/README.md")
    Assert.Equal("Missing files", categorizeBrokenLink "CHANGELOG.md")
    Assert.Equal("General/other paths", categorizeBrokenLink "docs/reference/whatever.md")

[<Fact>]
let ``link documents validate same-file anchors and ignore a bare hash`` () =
    let findings =
        validateDocsLinksDocuments [ "self.md", "# Title\n\n## Section\n\n[valid](#section) [ignored](#)\n" ] None []

    Assert.Empty(findings)

[<Fact>]
let ``link documents ignore code external links placeholders and skill trees`` () =
    let documents =
        [ "docs/source.md",
          "# Source\n\n`[inline](./missing.md)` ``[double](./missing-2.md)``\n\n```\n[fenced](./missing-3.md)\n```\n\n[web](https://example.com) [mail](mailto:a@example.com) [absolute](/docs/x.md) [example](./guide.md) [image](docs/images/logo.png)"
          ".claude/skills/x/SKILL.md", "[missing](./missing.md)" ]

    Assert.Empty(validateDocsLinksDocuments documents None [])

[<Fact>]
let ``link documents resolve files directories duplicate anchors and report broken anchors`` () =
    let documents =
        [ "docs/source.md",
          "[file](./destination.md) [directory](./assets/) [duplicate](./destination.md#section-1) [broken](./destination.md#absent)"
          "docs/destination.md", "# Destination\n\n## Section\n\n## Section\n"
          "docs/assets/index.md", "# Asset" ]

    let findings = validateDocsLinksDocuments documents None []
    Assert.Single(findings) |> ignore
    Assert.Contains("#absent", findings.Head.Message)

[<Fact>]
let ``link document staging and exclusions select only requested inputs`` () =
    let documents =
        [ "docs/staged.md", "![missing](./gone.png)"
          "docs/unstaged.md", "![missing](./also-gone.png)"
          "plans/done/excluded.md", "![missing](./gone.png)" ]

    let findings =
        validateDocsLinksDocuments documents (Some [ "docs/staged.md" ]) [ "plans/done" ]

    Assert.Single(findings) |> ignore
    Assert.Equal(Some "docs/staged.md", findings.Head.Path)

[<Fact>]
let ``link anchors skip headings inside a longer fence and malformed ATX lines`` () =
    let content =
        String.concat
            "\n"
            [ "# Title"
              ""
              "[shown](#shown) [hidden](#hidden) [seven](#seven)"
              ""
              "````md"
              "## Hidden"
              "```"
              "## Still hidden"
              "````"
              "``not a fence``"
              "####### seven"
              "###"
              "#tag"
              "## Shown" ]

    let findings = validateDocsLinksDocuments [ "self.md", content ] None []
    Assert.Equal(2, findings.Length)
    Assert.Contains(findings, fun (finding: Finding) -> finding.Message.Contains("hidden", StringComparison.Ordinal))
    Assert.Contains(findings, fun (finding: Finding) -> finding.Message.Contains("seven", StringComparison.Ordinal))

[<Fact>]
let ``link source exclusions match globs case-insensitively with a star that crosses slashes`` () =
    let excluded (path: string) =
        linkSourceExclusions [ "plans/done/*"; "notes/?.md"; "a+b.md" ]
        |> List.exists (fun glob -> glob.IsMatch path)

    Assert.True(excluded "plans/done/2026/delivery.md")
    Assert.True(excluded "PLANS/DONE/README.md")
    Assert.True(excluded "notes/x.md")
    Assert.False(excluded "notes/xy.md")
    Assert.True(excluded "a+b.md")
    Assert.False(excluded "aab.md")
    Assert.False(excluded "docs/plans/done/x.md")

[<Fact>]
let ``GitHub slugging retains Unicode word characters and removes punctuation`` () =
    Assert.Equal("héllo_world--again", githubSlug "Héllo_world!  again")

[<Fact>]
let ``link skip policy covers literal placeholders and parent images`` () =
    for value in [ "path"; "target"; "link"; "./path/to/doc.md"; "{{% ref x %}}" ] do
        Assert.True(shouldSkipLink value)

    Assert.False(shouldSkipLink "../docs/images/logo.png")

[<Fact>]
let ``parseMermaidDiagram parses BT and RL flowchart directions`` () =
    for expected, direction in [ MermaidBT, "BT"; MermaidRL, "RL" ] do
        let blocks =
            extractMermaidBlocks "d.md" (sprintf "```mermaid\nflowchart %s\n A --> B\n```" direction)

        let diagram, headerCount = parseMermaidDiagram (List.head blocks)
        Assert.Equal(1, headerCount)
        Assert.Equal(expected, diagram.Direction)

[<Fact>]
let ``mermaid violation kind codes are stable`` () =
    Assert.Equal("width_exceeded", mermaidViolationKindCode MermaidWidthExceeded)
    Assert.Equal("multiple_diagrams", mermaidViolationKindCode MermaidMultipleDiagrams)

[<Fact>]
let ``comment-only Mermaid blocks are harmless`` () =
    let block =
        { FilePath = "x.md"
          BlockIndex = 0
          Source = "%% comment"
          StartLine = 1 }

    let result = validateMermaidBlocks [ block ] defaultMermaidValidateOptions
    Assert.Empty(result.Violations)
    Assert.Empty(result.Warnings)
    Assert.Equal(1, result.BlocksScanned)

[<Fact>]
let ``Mermaid quoted labels and later declarations retain useful labels`` () =
    let blocks =
        extractMermaidBlocks
            "d.md"
            "```mermaid\nflowchart TD\n A[\"Hello World\"] --> B[x]\n C --> D\n C[Later label]\n E\n```"

    let diagram, _ = parseMermaidDiagram (List.head blocks)

    let label id =
        (diagram.Nodes |> List.find (fun node -> node.Id = id)).Label

    Assert.Equal("Hello World", label "A")
    Assert.Equal("x", label "B")
    Assert.Equal("Later label", label "C")
    Assert.Equal("", label "E")

[<Fact>]
let ``Mermaid grouped sources expand and ignore separators`` () =
    let blocks =
        extractMermaidBlocks "d.md" "```mermaid\nflowchart TD\n A && B --> C\n```"

    let diagram, _ = parseMermaidDiagram (List.head blocks)
    let edges = diagram.Edges |> List.map (fun edge -> edge.From, edge.To) |> List.sort
    Assert.Equal<(string * string) list>([ "A", "C"; "B", "C" ], edges)

[<Fact>]
let ``Mermaid malformed edge targets do not create phantom edges`` () =
    let blocks =
        extractMermaidBlocks "d.md" "```mermaid\nflowchart TD\n A --> foo-bar\n```"

    let diagram, _ = parseMermaidDiagram (List.head blocks)
    Assert.Contains("A", diagram.Nodes |> List.map (fun node -> node.Id))
    Assert.Empty(diagram.Edges)

[<Fact>]
let ``Mermaid subgraphs support fallback labels and unclosed blocks`` () =
    let fallback =
        extractMermaidBlocks "d.md" "```mermaid\nflowchart TD\n subgraph My Custom Group\n A --> B\n end\n```"

    let fallbackDiagram, _ = parseMermaidDiagram (List.head fallback)
    Assert.Equal("My Custom Group", fallbackDiagram.Subgraphs.Head.Label)

    let unclosed =
        extractMermaidBlocks "d.md" "```mermaid\nflowchart TD\n subgraph WF [Group]\n A --> B\n```"

    let unclosedDiagram, _ = parseMermaidDiagram (List.head unclosed)
    Assert.Equal("Group", unclosedDiagram.Subgraphs.Head.Label)
    Assert.Equal<string list>([ "A"; "B" ], unclosedDiagram.Subgraphs.Head.NodeIds)

[<Fact>]
let ``Mermaid defaults and empty metrics are stable`` () =
    let block =
        { FilePath = "x.md"
          BlockIndex = 0
          Source = "A --> B"
          StartLine = 1 }

    let diagram, count = parseMermaidDiagram block
    Assert.Equal(0, count)
    Assert.Equal(MermaidTB, diagram.Direction)
    Assert.Empty(diagram.Nodes)
    Assert.Equal(0, mermaidMaxWidth [] [])
    Assert.Equal(0, mermaidDepth [] [])

[<Fact>]
let ``Mermaid graph metrics handle cycles diamonds and irrelevant edges`` () =
    let nodes =
        [ { Id = "A"; Label = "" }
          { Id = "B"; Label = "" }
          { Id = "C"; Label = "" }
          { Id = "D"; Label = "" } ]

    let edges =
        [ { From = "A"; To = "B"; Label = "" }
          { From = "A"; To = "C"; Label = "" }
          { From = "B"; To = "D"; Label = "" }
          { From = "C"; To = "D"; Label = "" }
          { From = "D"; To = "A"; Label = "" }
          { From = "missing"
            To = "A"
            Label = "" } ]

    Assert.Equal(2, mermaidMaxWidth nodes edges)
    Assert.Equal(3, mermaidDepth nodes edges)

[<Fact>]
let ``Mermaid label length counts Unicode scalars and normalized line breaks`` () =
    Assert.Equal(1, effectiveMermaidLabelLen (System.Char.ConvertFromUtf32(0x1F600)))
    Assert.Equal(4, effectiveMermaidLabelLen "abc<br/>wxyz")
    Assert.Equal(4, effectiveMermaidLabelLen "abc<BR>wxyz")

[<Fact>]
let ``a bare flowchart header defaults to top-to-bottom`` () =
    let blocks = extractMermaidBlocks "d.md" "```mermaid\nflowchart\n A --> B\n```"
    let diagram, count = parseMermaidDiagram (List.head blocks)
    Assert.Equal(1, count)
    Assert.Equal(MermaidTB, diagram.Direction)

let private validateState source =
    validateMermaidBlocks
        [ { FilePath = "state.md"
            BlockIndex = 0
            Source = source
            StartLine = 1 } ]
        { defaultMermaidValidateOptions with
            MaxLabelLen = 30 }

[<Fact>]
let ``state diagram edge labels participate in label-length validation`` () =
    let longLabel = String.replicate 35 "z"
    let result = validateState (sprintf "stateDiagram-v2\n a --> b: %s" longLabel)

    Assert.Contains(
        result.Violations,
        fun violation -> violation.Kind = MermaidLabelTooLong && violation.NodeId = "a-->b"
    )

[<Fact>]
let ``state diagrams ignore malformed arrows separators and declarations`` () =
    for source in
        [ "stateDiagram-v2\n --> orphan\n a --> b"
          "stateDiagram-v2\n [*] --> a\n --\n a --> b"
          "stateDiagram-v2\n [*] --> a\n state \"Unterminated label as X\n state \"Label\" alias Y\n a --> b" ] do
        let result = validateState source
        Assert.Empty(result.Violations)
        Assert.Empty(result.Warnings)

[<Fact>]
let ``horizontal state directions swap width and depth`` () =
    let fanOut direction =
        sprintf
            "stateDiagram-v2\n direction %s\n root --> a\n root --> b\n root --> c\n root --> d\n root --> e"
            direction

    for direction in [ "LR"; "RL" ] do
        Assert.Empty((validateState (fanOut direction)).Violations)

    for direction in [ "BT"; "SIDEWAYS" ] do
        Assert.Contains(
            (validateState (fanOut direction)).Violations,
            fun violation -> violation.Kind = MermaidWidthExceeded
        )

[<Fact>]
let ``state declarations validate their declared label`` () =
    let longLabel = String.replicate 35 "q"

    let result =
        validateState (sprintf "stateDiagram-v2\n state \"%s\" as N\n [*] --> N" longLabel)

    Assert.Contains(result.Violations, fun violation -> violation.Kind = MermaidLabelTooLong && violation.NodeId = "N")

[<Fact>]
let ``invalid flowchart headers are treated as unsupported diagrams`` () =
    let result =
        validateMermaidBlocks
            [ { FilePath = "d.md"
                BlockIndex = 0
                Source = "flowchart TD extra-junk\n A --> B"
                StartLine = 1 } ]
            defaultMermaidValidateOptions

    Assert.Empty(result.Violations)
    Assert.Empty(result.Warnings)

[<Fact>]
let ``zero subgraph threshold disables density warnings`` () =
    let block =
        { FilePath = "d.md"
          BlockIndex = 0
          Source =
            "flowchart TD\n subgraph WF [Group]\n A --> B\n B --> C\n C --> D\n D --> E\n E --> F\n F --> G\n end"
          StartLine = 1 }

    let options =
        { defaultMermaidValidateOptions with
            MaxSubgraphNodes = 0 }

    let result = validateMermaidBlocks [ block ] options
    Assert.DoesNotContain(result.Warnings, fun warning -> warning.Kind = MermaidSubgraphDense)

[<Fact>]
let ``Mermaid text formatter includes width and multiple-diagram details`` () =
    let violations =
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

    let result =
        { FilesScanned = 1
          BlocksScanned = 2
          Violations = violations
          Warnings = [] }

    let text = formatMermaidText result true false
    Assert.Contains("[FAIL] w.md", text)
    Assert.Contains("exceeds max-width", text)
    Assert.Contains("multiple flowchart/graph headers", text)

[<Fact>]
let ``Mermaid JSON formatter emits width values`` () =
    let violation =
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

    let result =
        { FilesScanned = 1
          BlocksScanned = 1
          Violations = [ violation ]
          Warnings = [] }

    use doc = JsonDocument.Parse(formatMermaidJson result)
    let value = doc.RootElement.GetProperty("violations").[0]
    Assert.Equal(5, value.GetProperty("actualWidth").GetInt32())
    Assert.Equal(4, value.GetProperty("maxWidth").GetInt32())

[<Fact>]
let ``document audit reports Mermaid failures`` () =
    let result =
        runAuditDocuments
            [ "doc.md", "# Title\n\n```mermaid\nflowchart TD\n A --> B\n A --> C\n A --> D\n A --> E\n A --> F\n```" ]

    Assert.False(List.isEmpty result.Failures)
    Assert.Contains(result.Failures, fun failure -> failure.StartsWith("validate-mermaid", StringComparison.Ordinal))
    Assert.Contains("MD AUDIT FAILED", result.Report)

[<Fact>]
let ``Mermaid Markdown and quiet text formatters cover pass and warning reports`` () =
    let passed =
        { FilesScanned = 2
          BlocksScanned = 3
          Violations = []
          Warnings = [] }

    Assert.Equal("", formatMermaidText passed false true)
    Assert.Contains("Found 0 violation(s)", formatMermaidText passed false false)
    Assert.Contains("All 3 block(s)", formatMermaidMarkdown passed)

    let warnings =
        [ { Kind = MermaidSubgraphDense
            FilePath = "dense.md"
            BlockIndex = 0
            StartLine = 2
            ActualWidth = 0
            MaxWidth = 0
            ActualDepth = 0
            MaxDepth = 0
            SubgraphLabel = ""
            SubgraphNodeCount = 7
            MaxSubgraphNodes = 6 }
          { Kind = MermaidComplexDiagram
            FilePath = "complex.md"
            BlockIndex = 1
            StartLine = 8
            ActualWidth = 5
            MaxWidth = 4
            ActualDepth = 6
            MaxDepth = 5
            SubgraphLabel = ""
            SubgraphNodeCount = 0
            MaxSubgraphNodes = 0 } ]

    let warned = { passed with Warnings = warnings }

    let text = formatMermaidText warned false false
    Assert.Contains("[WARN] dense.md", text)
    Assert.Contains("(unnamed)", text)
    Assert.Contains("both exceeded", text)

    let markdown = formatMermaidMarkdown warned
    Assert.Contains("| dense.md |", markdown)
    Assert.Contains("subgraph_density", markdown)

    use json = JsonDocument.Parse(formatMermaidJson warned)
    let dense = json.RootElement.GetProperty("warnings").[0]
    Assert.Equal(7, dense.GetProperty("subgraphNodeCount").GetInt32())
    Assert.Equal(6, dense.GetProperty("maxSubgraphNodes").GetInt32())

    let complex = json.RootElement.GetProperty("warnings").[1]
    Assert.Equal(5, complex.GetProperty("actualWidth").GetInt32())
    Assert.Equal(6, complex.GetProperty("actualDepth").GetInt32())

    let labeledDense =
        { warnings.Head with
            SubgraphLabel = "Payments" }

    let labeledResult =
        { passed with
            Warnings = [ labeledDense ] }

    Assert.Contains("Payments", formatMermaidText labeledResult false false)
    use labeledJson = JsonDocument.Parse(formatMermaidJson labeledResult)

    Assert.Equal(
        "Payments",
        labeledJson.RootElement.GetProperty("warnings").[0].GetProperty("subgraphLabel").GetString()
    )

[<Fact>]
let ``Mermaid formatters include optional label violation fields`` () =
    let violation =
        { Kind = MermaidLabelTooLong
          FilePath = "label.md"
          BlockIndex = 0
          StartLine = 3
          NodeId = "NODE"
          LabelText = "a long label"
          LabelLen = 12
          MaxLabelLen = 10
          ActualWidth = 0
          MaxWidth = 0 }

    let result =
        { FilesScanned = 1
          BlocksScanned = 1
          Violations = [ violation ]
          Warnings = [] }

    Assert.Contains("label \"a long label\"", formatMermaidMarkdown result)

    use json = JsonDocument.Parse(formatMermaidJson result)
    let value = json.RootElement.GetProperty("violations").[0]
    Assert.Equal("NODE", value.GetProperty("nodeId").GetString())
    Assert.Equal("a long label", value.GetProperty("labelText").GetString())
    Assert.Equal(12, value.GetProperty("labelLen").GetInt32())
    Assert.Equal(10, value.GetProperty("maxLabelLen").GetInt32())

[<Fact>]
let ``frontmatter date documents report body annotations and leave the updated key to RHINO`` () =
    let documents =
        [ "field.md", "---\ntitle: T\nupdated: 2026-01-01\n---\nbody"
          "inline.md", "# Title\n\n- **Created**: 2026-01-01\n"
          "footer.md", "---\ntitle: T\n---\nbody\n**Last Updated** today\n"
          "empty-body.md", "---\ntitle: T\n---"
          "unclosed.md", "---\ntitle: T\nbody"
          "sequence.md", "---\n- item\n---\nbody"
          "invalid.md", "---\ntitle: [unterminated\n---\nbody" ]

    let findings = validateFrontmatterDatesDocuments documents [] []
    Assert.Equal(2, findings.Length)
    Assert.DoesNotContain(findings, fun (finding: Finding) -> finding.Path = Some "field.md")
    Assert.Contains(findings, fun (finding: Finding) -> finding.Path = Some "inline.md")
    Assert.Contains(findings, fun (finding: Finding) -> finding.Path = Some "footer.md")

[<Fact>]
let ``frontmatter date document selection and exclusions are independent`` () =
    let documents =
        [ "docs/selected.md", "- **Created**: 2026-01-01"
          "docs/excluded.md", "- **Created**: 2026-01-01"
          "other/ignored.md", "- **Created**: 2026-01-01" ]

    let findings =
        validateFrontmatterDatesDocuments documents [ "docs" ] [ "docs/excluded.md" ]

    Assert.Single(findings) |> ignore
    Assert.Equal(Some "docs/selected.md", (findings.Head: Finding).Path)
