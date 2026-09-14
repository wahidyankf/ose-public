/// Plain xunit tests for the Wave D half of `RhinoCli.Cli.Formatters` — the
/// `md frontmatter`, `md frontmatter-dates`, `md links`, `governance word-budget`, and
/// `governance readme-index` renderers, in all three output formats.
///
/// `shadow-diff.sh` proves these byte-match the Rust binary, but only for the
/// branch the live corpus happens to take: on a clean repository every one of
/// these renderers takes its empty-findings arm, so the whole
/// findings-present half — headers, table shapes, per-row formatting — runs
/// unexercised. That is exactly how the Wave D word-budget table drift
/// reached `main` (see `learnings.md`, 2026-08-28). These tests construct
/// findings directly so both arms are pinned regardless of corpus.
module RhinoCli.Tests.Unit.Steps.WaveDFormattersUnitTests

open System.Text.Json
open Xunit
open RhinoCli.Domain.Types
open RhinoCli.Application
open RhinoCli.Cli.Formatters

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let private finding (severity: Severity) (path: string) (message: string) : Finding =
    { Severity = severity
      Message = message
      Path = Some path }

let private frontmatterDatesFinding: Md.FrontmatterDatesFinding =
    { File = "docs/b.md"
      Line = 3
      Severity = "high"
      Message = "date is in the future" }

let private brokenLink: Md.BrokenLink =
    { LineNumber = 7
      SourceFile = "docs/c.md"
      LinkText = "the guide"
      TargetPath = "docs/missing.md"
      Category = "Missing files" }

let private linkResult: Md.LinkValidationResult =
    { TotalFiles = 3
      TotalLinks = 9
      BrokenLinks = [ brokenLink ]
      BrokenByCategory = Map.ofList [ "Missing files", [ brokenLink ] ] }

let private cleanLinkResult: Md.LinkValidationResult =
    { TotalFiles = 3
      TotalLinks = 9
      BrokenLinks = []
      BrokenByCategory = Map.empty }

let private wordBudgetFinding: Governance.WordBudgetFinding =
    { Path = "repo-governance/x.md"
      Size = 901UL
      Target = 900UL
      Warn = 950UL
      Fail = 1000UL
      Severity = Governance.WordBudgetSeverity.Warn
      Message = "over target" }

let private readmeIndexFinding: Governance.ReadmeIndexFinding =
    { File = "docs/README.md"
      Severity = "high"
      Kind = Governance.ReadmeIndexFindingKind.Orphan
      Message = "not listed in any index" }

/// Asserts `text` is syntactically valid JSON and carries the given `schema`.
let private assertJsonSchema (expected: string) (text: string) : unit =
    use doc = JsonDocument.Parse(text)
    Assert.Equal(expected, doc.RootElement.GetProperty("schema").GetString())

// ---------------------------------------------------------------------------
// render
// ---------------------------------------------------------------------------

[<Fact>]
let ``render dispatches to the arm its format names`` () =
    let pick (format: OutputFormat) =
        render format (fun () -> "T") (fun () -> "J") (fun () -> "M")

    Assert.Equal("T", pick Text)
    Assert.Equal("J", pick Json)
    Assert.Equal("M", pick Markdown)

// ---------------------------------------------------------------------------
// md frontmatter
// ---------------------------------------------------------------------------

[<Fact>]
let ``frontmatterText reports the passing line when there are no findings`` () =
    Assert.Equal("DOCS FRONTMATTER VALIDATION PASSED: no findings\n", frontmatterText [])

[<Fact>]
let ``frontmatterText separates blocking failures from advisory warnings`` () =
    let text =
        frontmatterText
            [ finding Severity.Blocking "docs/a.md" "missing title"
              finding Severity.Advisory "docs/b.md" "missing summary" ]

    Assert.Contains("docs/a.md", text)
    Assert.Contains("docs/b.md", text)
    Assert.DoesNotContain("PASSED: no findings", text)

[<Fact>]
let ``frontmatterJson and frontmatterMarkdown render both arms`` () =
    let passedJson = frontmatterJson []
    Assert.Contains("\"status\": \"passed\"", passedJson)

    let failedJson =
        frontmatterJson [ finding Severity.Blocking "docs/a.md" "missing title" ]

    Assert.Contains("\"status\": \"failed\"", failedJson)
    Assert.Contains("docs/a.md", failedJson)

    Assert.Contains("**PASSED**", frontmatterMarkdown [])

    let failedMarkdown =
        frontmatterMarkdown [ finding Severity.Blocking "docs/a.md" "missing title" ]

    Assert.Contains("docs/a.md", failedMarkdown)

// ---------------------------------------------------------------------------
// md frontmatter-dates
// ---------------------------------------------------------------------------

[<Fact>]
let ``frontmatterDatesText reports the passing line when there are no findings`` () =
    Assert.Equal("FRONTMATTER AUDIT PASSED: no date-metadata violations found\n", frontmatterDatesText [])

[<Fact>]
let ``frontmatterDatesText renders file, line and severity per row`` () =
    let text = frontmatterDatesText [ frontmatterDatesFinding ]
    Assert.StartsWith("FRONTMATTER AUDIT FAILED: 1 violation(s) found\n", text)
    Assert.Contains("  docs/b.md:3  [high]  date is in the future\n", text)

[<Fact>]
let ``frontmatterDatesJson and frontmatterDatesMarkdown render both arms`` () =
    Assert.Contains("\"status\": \"passed\"", frontmatterDatesJson [])

    let failed = frontmatterDatesJson [ frontmatterDatesFinding ]
    Assert.Contains("\"status\": \"failed\"", failed)
    Assert.Contains("docs/b.md", failed)

    Assert.Contains("**PASSED**", frontmatterDatesMarkdown [])
    Assert.Contains("docs/b.md", frontmatterDatesMarkdown [ frontmatterDatesFinding ])

// ---------------------------------------------------------------------------
// md links
// ---------------------------------------------------------------------------

[<Fact>]
let ``linksText reports all-valid when nothing is broken`` () =
    Assert.Equal("All links valid! No broken links found.\n", linksText cleanLinkResult)

[<Fact>]
let ``linksText groups broken links under their category heading`` () =
    let text = linksText linkResult
    Assert.StartsWith("# Broken Links Report\n\n", text)
    Assert.Contains("**Total broken links**: 1", text)
    Assert.Contains("## Missing files (1 links)", text)
    Assert.Contains("### docs/c.md", text)
    // The text report renders the link *text*, never the target path — the
    // target only reaches the JSON form [Repo-grounded — `links.rs`].
    Assert.Contains("- Line 7: `the guide`", text)
    Assert.DoesNotContain("docs/missing.md", text)

[<Fact>]
let ``linksJson carries every broken-link field`` () =
    let json = linksJson linkResult
    use doc = JsonDocument.Parse(json)
    Assert.Contains("docs/c.md", json)
    Assert.Contains("docs/missing.md", json)
    Assert.Contains("the guide", json)
    Assert.True(doc.RootElement.ValueKind = JsonValueKind.Object)

[<Fact>]
let ``linksMarkdown is byte-identical to linksText`` () =
    Assert.Equal(linksText linkResult, linksMarkdown linkResult)
    Assert.Equal(linksText cleanLinkResult, linksMarkdown cleanLinkResult)

// ---------------------------------------------------------------------------
// governance word-budget
// ---------------------------------------------------------------------------

[<Fact>]
let ``wordBudgetText reports the passing line when there are no findings`` () =
    Assert.Equal("WORD BUDGET: PASSED — all surfaces within budget\n", wordBudgetText [])

[<Fact>]
let ``wordBudgetText counts findings and names the offending path`` () =
    let text = wordBudgetText [ wordBudgetFinding ]
    Assert.StartsWith("WORD BUDGET: 1 finding(s)\n", text)
    Assert.Contains("repo-governance/x.md", text)

[<Fact>]
let ``wordBudgetJson carries the numeric budget fields and the severity label`` () =
    let json = wordBudgetJson [ wordBudgetFinding ]
    use doc = JsonDocument.Parse(json)
    Assert.Contains("\"size\": 901", json)
    Assert.Contains("\"target\": 900", json)
    Assert.Contains("\"warn\": 950", json)
    Assert.Contains("\"fail\": 1000", json)
    Assert.Contains("warn", json)
    Assert.True(doc.RootElement.ValueKind = JsonValueKind.Object)

[<Fact>]
let ``wordBudgetMarkdown renders the four-column table Rust renders`` () =
    Assert.Contains("**PASSED**", wordBudgetMarkdown [])

    let markdown = wordBudgetMarkdown [ wordBudgetFinding ]
    Assert.Contains("| Path | Size (words) | Severity | Message |", markdown)
    Assert.Contains("`repo-governance/x.md`", markdown)
    Assert.DoesNotContain("| Target |", markdown)

// ---------------------------------------------------------------------------
// governance readme-index
// ---------------------------------------------------------------------------

[<Fact>]
let ``readmeIndexHasFailingFinding ignores unannotated unless it is named`` () =
    let unannotated =
        { readmeIndexFinding with
            Kind = Governance.ReadmeIndexFindingKind.Unannotated }

    Assert.False(readmeIndexHasFailingFinding [ unannotated ] [])
    Assert.True(readmeIndexHasFailingFinding [ unannotated ] [ "unannotated" ])
    Assert.True(readmeIndexHasFailingFinding [ readmeIndexFinding ] [])
    Assert.False(readmeIndexHasFailingFinding [ readmeIndexFinding ] [ "ghost" ])
    Assert.False(readmeIndexHasFailingFinding [] [])

[<Fact>]
let ``readmeIndexText reports the passing line when there are no findings`` () =
    Assert.Equal("README INDEX AUDIT PASSED: no orphan or ghost references found\n", readmeIndexText [])

[<Fact>]
let ``readmeIndexText counts findings and names the offending file`` () =
    let text = readmeIndexText [ readmeIndexFinding ]
    Assert.StartsWith("README INDEX AUDIT FAILED: 1 finding(s)\n", text)
    Assert.Contains("docs/README.md", text)

[<Fact>]
let ``readmeIndexJson and readmeIndexMarkdown render both arms`` () =
    Assert.Contains("\"status\": \"passed\"", readmeIndexJson [])

    let failed = readmeIndexJson [ readmeIndexFinding ]
    Assert.Contains("\"status\": \"failed\"", failed)
    Assert.Contains("orphan", failed)

    Assert.Contains("**PASSED**", readmeIndexMarkdown [])
    Assert.Contains("docs/README.md", readmeIndexMarkdown [ readmeIndexFinding ])

// ---------------------------------------------------------------------------
// governance readme-index generate
// ---------------------------------------------------------------------------

[<Fact>]
let ``readmeIndexGenerateText distinguishes nothing-written from a write list`` () =
    Assert.Equal("README INDEX GENERATE: no directory needed a new or updated index\n", readmeIndexGenerateText [])

    let text = readmeIndexGenerateText [ "docs/README.md"; "specs/README.md" ]
    Assert.StartsWith("README INDEX GENERATE: wrote 2 index(es)\n", text)
    Assert.Contains("  docs/README.md\n", text)
    Assert.Contains("  specs/README.md\n", text)

[<Fact>]
let ``readmeIndexGenerateJson always reports passed and lists what was written`` () =
    let json = readmeIndexGenerateJson [ "docs/README.md" ]
    assertJsonSchema "rhino-cli/readme-index-generate/v1" json
    Assert.Contains("\"status\": \"passed\"", json)
    Assert.Contains("docs/README.md", json)
    assertJsonSchema "rhino-cli/readme-index-generate/v1" (readmeIndexGenerateJson [])

[<Fact>]
let ``readmeIndexGenerateMarkdown renders a bullet per written index`` () =
    Assert.Equal(
        "## README Index Generate\n\nNo directory needed a new or updated index.\n",
        readmeIndexGenerateMarkdown []
    )

    let markdown = readmeIndexGenerateMarkdown [ "docs/README.md" ]
    Assert.Contains("Wrote 1 index(es):", markdown)
    Assert.Contains("- docs/README.md\n", markdown)

// ---------------------------------------------------------------------------
// governance readme-index rewrite-paths
// ---------------------------------------------------------------------------

[<Fact>]
let ``readmeIndexRewritePathsText always prints its count header`` () =
    Assert.Equal("readme-index rewrite-paths: 0 file(s) updated\n", readmeIndexRewritePathsText [])

    let text = readmeIndexRewritePathsText [ "docs/README.md" ]
    Assert.StartsWith("readme-index rewrite-paths: 1 file(s) updated\n", text)
    Assert.Contains("  docs/README.md\n", text)

[<Fact>]
let ``readmeIndexRewritePathsJson carries its schema`` () =
    let json = readmeIndexRewritePathsJson [ "docs/README.md" ]
    assertJsonSchema "rhino-cli/readme-index-rewrite-paths/v1" json
    Assert.Contains("docs/README.md", json)

[<Fact>]
let ``readmeIndexRewritePathsMarkdown is byte-identical to its text form`` () =
    Assert.Equal(readmeIndexRewritePathsText [], readmeIndexRewritePathsMarkdown [])

    Assert.Equal(readmeIndexRewritePathsText [ "docs/README.md" ], readmeIndexRewritePathsMarkdown [ "docs/README.md" ])

// ---------------------------------------------------------------------------
// Remaining single-arm branches
//
// Each of the four cases below is a branch no other test reaches: a
// fail-without-warn and a warn-without-fail frontmatter header, the
// all-links-valid JSON status, and the `Within` word-budget row label.
// ---------------------------------------------------------------------------

[<Fact>]
let ``frontmatterText drops the warn clause when there are no warnings`` () =
    let text = frontmatterText [ finding Severity.Blocking "docs/a.md" "missing title" ]
    Assert.StartsWith("DOCS FRONTMATTER VALIDATION FAILED: 1 fail finding(s)\n", text)
    Assert.DoesNotContain("warn finding(s)", text)

[<Fact>]
let ``frontmatterText still passes when every finding is advisory`` () =
    let text =
        frontmatterText [ finding Severity.Advisory "docs/b.md" "missing summary" ]

    Assert.StartsWith("DOCS FRONTMATTER VALIDATION PASSED with 1 warn finding(s)\n", text)

[<Fact>]
let ``frontmatterMarkdown still passes when every finding is advisory`` () =
    let markdown =
        frontmatterMarkdown [ finding Severity.Advisory "docs/b.md" "missing summary" ]

    Assert.Contains("**PASSED** with 1 warn finding(s)", markdown)
    Assert.Contains("| File | Severity | Kind | Message |", markdown)

[<Fact>]
let ``linksJson reports success when nothing is broken`` () =
    let json = linksJson cleanLinkResult
    Assert.Contains("\"status\": \"success\"", json)
    Assert.Contains("\"broken_count\": 0", json)

[<Fact>]
let ``wordBudgetText labels a within-budget finding PASS`` () =
    let within =
        { wordBudgetFinding with
            Size = 10UL
            Severity = Governance.WordBudgetSeverity.Within }

    let text = wordBudgetText [ within ]
    Assert.Contains("  [PASS] repo-governance/x.md — over target\n", text)
