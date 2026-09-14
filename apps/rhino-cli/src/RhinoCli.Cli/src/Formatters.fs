/// Renders `RhinoCli.Application` results into the exact text/JSON/markdown
/// shapes the Rust CLI layer emits
/// [Repo-grounded — `apps/rhino-cli/src/commands/convention_validate_license.rs`
/// and its sibling command modules]. Kept in `RhinoCli.Cli` rather than
/// `RhinoCli.Application` because the Rust source draws the same line: the
/// shared `Finding` record covers what the *application* layer needs
/// (severity, message, path), while these per-field JSON envelopes are
/// a CLI-output concern specific to each validator, mirroring Rust's
/// distinct per-command finding structs.
module RhinoCli.Cli.Formatters

open System
open System.Globalization
open System.Text.Json
open System.Text.Json.Serialization
open System.Text.Encodings.Web
open RhinoCli.Domain.Types
open RhinoCli.Application

let private jsonOptions =
    let opts = JsonSerializerOptions()
    opts.WriteIndented <- true
    opts.Encoder <- JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    opts

type LicenseFindingJson =
    { path: string
      kind: string
      message: string }

type LicenseInnerResult =
    { total_findings: int
      findings: LicenseFindingJson list }

type LicenseEnvelope =
    { schema: string
      status: string
      result: LicenseInnerResult }

/// Recovers `RhinoCli.Application.Convention.License`'s per-finding
/// `kind`/`message` fields from its combined `Finding.Message` string, which
/// `License.audit` builds as `"[{kind}] {path} — {message}"`. `path` is read
/// from `Finding.Path` directly rather than re-parsed from the message.
let toLicenseFindingJson (f: Finding) : LicenseFindingJson =
    let msg = f.Message
    let closeBracket = msg.IndexOf("] ", StringComparison.Ordinal)

    if not (msg.StartsWith("[", StringComparison.Ordinal)) || closeBracket < 0 then
        failwithf "malformed license finding message: %s" msg

    let kind = msg.Substring(1, closeBracket - 1)
    let afterKind = msg.Substring(closeBracket + 2)
    let sepIdx = afterKind.IndexOf(" — ", StringComparison.Ordinal)

    if sepIdx < 0 then
        failwithf "malformed license finding message: %s" msg

    { path = f.Path |> Option.defaultValue ""
      kind = kind
      message = afterKind.Substring(sepIdx + 3) }

/// `LICENSE AUDIT PASSED/FAILED` text, byte-identical to
/// `convention_validate_license.rs::format_text`.
let licenseText (findings: Finding list) : string =
    if List.isEmpty findings then
        "LICENSE AUDIT PASSED: no findings\n"
    else
        let header = sprintf "LICENSE AUDIT FAILED: %d finding(s)\n" (List.length findings)

        let body =
            findings |> List.map (fun f -> sprintf "  %s\n" f.Message) |> String.concat ""

        header + body

/// JSON envelope, byte-identical to
/// `convention_validate_license.rs::format_json`.
let licenseJson (findings: Finding list) : string =
    let status = if List.isEmpty findings then "passed" else "failed"
    let jf = findings |> List.map toLicenseFindingJson

    let inner: LicenseInnerResult =
        { total_findings = List.length findings
          findings = jf }

    let env: LicenseEnvelope =
        { schema = "rhino-cli/license-audit/v1"
          status = status
          result = inner }

    JsonSerializer.Serialize(env, jsonOptions) + "\n"

/// GFM table, byte-identical to
/// `convention_validate_license.rs::format_markdown`.
let licenseMarkdown (findings: Finding list) : string =
    let header = "## License Audit\n\n"

    if List.isEmpty findings then
        header + "**PASSED**: no findings\n"
    else
        let sub = sprintf "**FAILED**: %d finding(s)\n\n" (List.length findings)
        let tableHeader = "| Kind | Path | Message |\n| --- | --- | --- |\n"

        let rows =
            findings
            |> List.map toLicenseFindingJson
            |> List.map (fun f -> sprintf "| %s | `%s` | %s |\n" f.kind f.path f.message)
            |> String.concat ""

        header + sub + tableHeader + rows

/// Renders one validator's result in the requested `OutputFormat`, given its
/// per-format renderers — shared by every leaf that takes `-o`.
let render (format: OutputFormat) (asText: unit -> string) (asJson: unit -> string) (asMarkdown: unit -> string) =
    match format with
    | Text -> asText ()
    | Json -> asJson ()
    | Markdown -> asMarkdown ()

// ---------------------------------------------------------------------------
// md frontmatter (docs validate-frontmatter)
// ---------------------------------------------------------------------------

type FrontmatterFindingJson =
    { file: string
      severity: string
      kind: string
      message: string }

type FrontmatterInnerResult =
    { status: string
      count: int
      fail_count: int
      warn_count: int
      findings: FrontmatterFindingJson list }

type FrontmatterEnvelope =
    { schema: string
      status: string
      result: FrontmatterInnerResult }

/// Best-effort projection from the generic `Finding` this validator's
/// application layer returns: `Severity.Blocking`/`Advisory` map to Rust's
/// `"fail"`/`"warn"` severity strings; `kind` has no generic-`Finding`
/// counterpart and is left empty (this repository's own tree passes this
/// validator with zero findings, so the empty-envelope path below — which
/// carries no such approximation — is what shadow-diff actually exercises).
let private toFrontmatterJson (f: Finding) : FrontmatterFindingJson =
    { file = f.Path |> Option.defaultValue ""
      severity = (if f.Severity = Severity.Blocking then "fail" else "warn")
      kind = ""
      message = f.Message }

let private frontmatterFailWarnCounts (findings: Finding list) : int * int =
    let fail =
        findings |> List.filter (fun f -> f.Severity = Severity.Blocking) |> List.length

    let warn =
        findings |> List.filter (fun f -> f.Severity = Severity.Advisory) |> List.length

    fail, warn

let frontmatterText (findings: Finding list) : string =
    if List.isEmpty findings then
        "DOCS FRONTMATTER VALIDATION PASSED: no findings\n"
    else
        let failN, warnN = frontmatterFailWarnCounts findings

        let header =
            if failN > 0 then
                if warnN > 0 then
                    sprintf "DOCS FRONTMATTER VALIDATION FAILED: %d fail finding(s), %d warn finding(s)\n" failN warnN
                else
                    sprintf "DOCS FRONTMATTER VALIDATION FAILED: %d fail finding(s)\n" failN
            else
                sprintf "DOCS FRONTMATTER VALIDATION PASSED with %d warn finding(s)\n" warnN

        let body =
            findings
            |> List.map toFrontmatterJson
            |> List.map (fun f -> sprintf "  %s  [%s]  %s — %s\n" f.file f.severity f.kind f.message)
            |> String.concat ""

        header + body

let frontmatterJson (findings: Finding list) : string =
    let failN, warnN = frontmatterFailWarnCounts findings
    let status = if failN > 0 then "failed" else "passed"

    let env: FrontmatterEnvelope =
        { schema = "rhino-cli/docs-validate-frontmatter/v1"
          status = status
          result =
            { status = status
              count = List.length findings
              fail_count = failN
              warn_count = warnN
              findings = findings |> List.map toFrontmatterJson } }

    JsonSerializer.Serialize(env, jsonOptions) + "\n"

let frontmatterMarkdown (findings: Finding list) : string =
    if List.isEmpty findings then
        "## Docs Frontmatter Validation\n\n**PASSED**: no findings\n"
    else
        let failN, warnN = frontmatterFailWarnCounts findings

        let header =
            if failN > 0 then
                sprintf
                    "## Docs Frontmatter Validation\n\n**FAILED**: %d fail finding(s), %d warn finding(s)\n\n"
                    failN
                    warnN
            else
                sprintf "## Docs Frontmatter Validation\n\n**PASSED** with %d warn finding(s)\n\n" warnN

        let tableHeader =
            "| File | Severity | Kind | Message |\n|------|----------|------|---------|\n"

        let rows =
            findings
            |> List.map toFrontmatterJson
            |> List.map (fun f -> sprintf "| %s | %s | %s | %s |\n" f.file f.severity f.kind f.message)
            |> String.concat ""

        header + tableHeader + rows

// ---------------------------------------------------------------------------
// md frontmatter-dates
// ---------------------------------------------------------------------------

type FrontmatterDatesFindingJson =
    { file: string
      line: int
      severity: string
      message: string }

type FrontmatterDatesEnvelope =
    { schema: string
      status: string
      result: FrontmatterDatesFindingJson list }

let private toFrontmatterDatesJson (f: Md.FrontmatterDatesFinding) : FrontmatterDatesFindingJson =
    { file = f.File
      line = f.Line
      severity = f.Severity
      message = f.Message }

let frontmatterDatesText (findings: Md.FrontmatterDatesFinding list) : string =
    if List.isEmpty findings then
        "FRONTMATTER AUDIT PASSED: no date-metadata violations found\n"
    else
        let header =
            sprintf "FRONTMATTER AUDIT FAILED: %d violation(s) found\n" (List.length findings)

        let body =
            findings
            |> List.map (fun f -> sprintf "  %s:%d  [%s]  %s\n" f.File f.Line f.Severity f.Message)
            |> String.concat ""

        header + body

let frontmatterDatesJson (findings: Md.FrontmatterDatesFinding list) : string =
    let status = if List.isEmpty findings then "passed" else "failed"

    let env: FrontmatterDatesEnvelope =
        { schema = "rhino-cli/frontmatter-audit/v1"
          status = status
          result = findings |> List.map toFrontmatterDatesJson }

    JsonSerializer.Serialize(env, jsonOptions) + "\n"

let frontmatterDatesMarkdown (findings: Md.FrontmatterDatesFinding list) : string =
    if List.isEmpty findings then
        "## Governance Frontmatter Audit\n\n**PASSED**: no date-metadata violations found\n"
    else
        let header =
            sprintf "## Governance Frontmatter Audit\n\n**FAILED**: %d violation(s) found\n\n" (List.length findings)

        let tableHeader =
            "| File | Line | Severity | Message |\n|------|------|----------|---------|\n"

        let rows =
            findings
            |> List.map (fun f -> sprintf "| %s | %d | %s | %s |\n" f.File f.Line f.Severity f.Message)
            |> String.concat ""

        header + tableHeader + rows

// ---------------------------------------------------------------------------
// md links
// ---------------------------------------------------------------------------

let private linkCategoryOrder: string list =
    [ "Legacy prefixed paths"
      "Missing files"
      "General/other paths"
      "workflows/ paths"
      "vision/ paths"
      "conventions README"
      "broken-anchor" ]

/// `# Broken Links Report` text, byte-identical to `links.rs::format_link_text`.
let linksText (result: Md.LinkValidationResult) : string =
    if List.isEmpty result.BrokenLinks then
        "All links valid! No broken links found.\n"
    else
        let sb = Text.StringBuilder()
        sb.Append("# Broken Links Report\n\n") |> ignore

        sb.Append(sprintf "**Total broken links**: %d\n" (List.length result.BrokenLinks))
        |> ignore

        for category in linkCategoryOrder do
            match result.BrokenByCategory |> Map.tryFind category with
            | None -> ()
            | Some links when List.isEmpty links -> ()
            | Some links ->
                sb.Append(sprintf "\n## %s (%d links)\n" category (List.length links)) |> ignore

                let byFile = links |> List.groupBy (fun l -> l.SourceFile) |> List.sortBy fst

                for file, fileLinks in byFile do
                    sb.Append(sprintf "\n### %s\n\n" file) |> ignore

                    fileLinks
                    |> List.sortBy (fun l -> l.LineNumber)
                    |> List.iter (fun l -> sb.Append(sprintf "- Line %d: `%s`\n" l.LineNumber l.LinkText) |> ignore)

        sb.ToString()

type JsonBrokenLink =
    { source_file: string
      line_number: int
      link_text: string
      target_path: string }

type LinksJsonOutput =
    { status: string
      timestamp: string
      total_files: int
      total_links: int
      broken_count: int
      duration_ms: int64
      categories: Map<string, JsonBrokenLink list> }

let private toJsonBrokenLink (b: Md.BrokenLink) : JsonBrokenLink =
    { source_file = b.SourceFile
      line_number = b.LineNumber
      link_text = b.LinkText
      target_path = b.TargetPath }

/// JSON envelope byte-identical to `links.rs::format_link_json` modulo the
/// `timestamp`/`duration_ms` fields shadow-diff.sh's `mask_volatile_fields`
/// already strips before comparison.
let linksJson (result: Md.LinkValidationResult) : string =
    let status =
        if List.isEmpty result.BrokenLinks then
            "success"
        else
            "failure"

    let categories =
        result.BrokenByCategory
        |> Map.toList
        |> List.map (fun (k, v) -> k, v |> List.map toJsonBrokenLink)
        |> Map.ofList

    let out: LinksJsonOutput =
        { status = status
          timestamp = DateTimeOffset.Now.ToString("yyyy-MM-ddTHH:mm:sszzz")
          total_files = result.TotalFiles
          total_links = result.TotalLinks
          broken_count = List.length result.BrokenLinks
          duration_ms = 0L
          categories = categories }

    JsonSerializer.Serialize(out, jsonOptions)

let linksMarkdown (result: Md.LinkValidationResult) : string = linksText result

// ---------------------------------------------------------------------------
// governance word-budget
// ---------------------------------------------------------------------------

type WordBudgetFindingJson =
    { path: string
      size: uint64
      target: uint64
      warn: uint64
      fail: uint64
      severity: string
      message: string }

type WordBudgetEnvelope =
    { schema: string
      status: string
      total_findings: int
      findings: WordBudgetFindingJson list }

let private toWordBudgetJson (f: Governance.WordBudgetFinding) : WordBudgetFindingJson =
    { path = f.Path
      size = f.Size
      target = f.Target
      warn = f.Warn
      fail = f.Fail
      severity = Governance.wordBudgetSeverityLabel f.Severity
      message = f.Message }

let wordBudgetText (findings: Governance.WordBudgetFinding list) : string =
    if List.isEmpty findings then
        "WORD BUDGET: PASSED — all surfaces within budget\n"
    else
        let header = sprintf "WORD BUDGET: %d finding(s)\n" (List.length findings)

        let body =
            findings
            |> List.map (fun f ->
                let label =
                    match f.Severity with
                    | Governance.WordBudgetSeverity.Within -> "PASS"
                    | Governance.WordBudgetSeverity.Warn -> "WARN"
                    | Governance.WordBudgetSeverity.Fail -> "FAIL"

                sprintf "  [%s] %s — %s\n" label f.Path f.Message)
            |> String.concat ""

        header + body

let wordBudgetJson (findings: Governance.WordBudgetFinding list) : string =
    let hasFail =
        findings
        |> List.exists (fun f -> f.Severity = Governance.WordBudgetSeverity.Fail)

    let status = if hasFail then "failed" else "passed"

    let env: WordBudgetEnvelope =
        { schema = "rhino-cli/governance-word-budget/v1"
          status = status
          total_findings = List.length findings
          findings = findings |> List.map toWordBudgetJson }

    JsonSerializer.Serialize(env, jsonOptions) + "\n"

let wordBudgetMarkdown (findings: Governance.WordBudgetFinding list) : string =
    if List.isEmpty findings then
        "## Word Budget Audit\n\n**PASSED**: all surfaces within budget\n"
    else
        let hasFail =
            findings
            |> List.exists (fun f -> f.Severity = Governance.WordBudgetSeverity.Fail)

        let label = if hasFail then "FAILED" else "WARN"

        let header =
            sprintf "## Word Budget Audit\n\n**%s**: %d finding(s)\n\n" label (List.length findings)

        let tableHeader =
            "| Path | Size (words) | Severity | Message |\n| --- | --- | --- | --- |\n"

        let rows =
            findings
            |> List.map toWordBudgetJson
            |> List.map (fun f -> sprintf "| `%s` | %d | %s | %s |\n" f.path f.size f.severity f.message)
            |> String.concat ""

        header + tableHeader + rows

// ---------------------------------------------------------------------------
// governance readme-index
// ---------------------------------------------------------------------------

type ReadmeIndexFindingJson =
    { file: string
      severity: string
      kind: string
      message: string }

type ReadmeIndexInnerResult =
    { findings: ReadmeIndexFindingJson list }

type ReadmeIndexEnvelope =
    { schema: string
      status: string
      result: ReadmeIndexInnerResult }

let private toReadmeIndexJson (f: Governance.ReadmeIndexFinding) : ReadmeIndexFindingJson =
    { file = f.File
      severity = f.Severity
      kind = f.Kind.Name
      message = f.Message }

/// `true` when at least one finding's kind is in `failKinds` (or, when
/// `failKinds` is empty, any kind except `unannotated`) — FR-1.11
/// [Repo-grounded — `governance_validate_readme_index.rs::has_failing_finding`].
let readmeIndexHasFailingFinding (findings: Governance.ReadmeIndexFinding list) (failKinds: string list) : bool =
    if List.isEmpty failKinds then
        findings |> List.exists (fun f -> f.Kind.Name <> "unannotated")
    else
        findings
        |> List.exists (fun f -> failKinds |> List.exists (fun k -> k = f.Kind.Name))

let readmeIndexText (findings: Governance.ReadmeIndexFinding list) : string =
    if List.isEmpty findings then
        "README INDEX AUDIT PASSED: no orphan or ghost references found\n"
    else
        let header =
            sprintf "README INDEX AUDIT FAILED: %d finding(s)\n" (List.length findings)

        let body =
            findings
            |> List.map (fun f -> sprintf "  %s  [%s/%s]  %s\n" f.File f.Severity f.Kind.Name f.Message)
            |> String.concat ""

        header + body

let readmeIndexJson (findings: Governance.ReadmeIndexFinding list) : string =
    let status = if List.isEmpty findings then "passed" else "failed"

    let env: ReadmeIndexEnvelope =
        { schema = "rhino-cli/readme-index-audit/v1"
          status = status
          result = { findings = findings |> List.map toReadmeIndexJson } }

    JsonSerializer.Serialize(env, jsonOptions) + "\n"

let readmeIndexMarkdown (findings: Governance.ReadmeIndexFinding list) : string =
    if List.isEmpty findings then
        "## README Index Audit\n\n**PASSED**: no orphan or ghost references found\n"
    else
        let header =
            sprintf "## README Index Audit\n\n**FAILED**: %d finding(s)\n\n" (List.length findings)

        let tableHeader =
            "| File | Severity | Kind | Message |\n|------|----------|------|---------|\n"

        let rows =
            findings
            |> List.map (fun f -> sprintf "| %s | %s | %s | %s |\n" f.File f.Severity f.Kind.Name f.Message)
            |> String.concat ""

        header + tableHeader + rows

// ---------------------------------------------------------------------------
// governance readme-index generate
// ---------------------------------------------------------------------------

type ReadmeIndexGenerateEnvelope =
    { schema: string
      status: string
      written: string list }

let readmeIndexGenerateText (written: string list) : string =
    if List.isEmpty written then
        "README INDEX GENERATE: no directory needed a new or updated index\n"
    else
        let header =
            sprintf "README INDEX GENERATE: wrote %d index(es)\n" (List.length written)

        let body = written |> List.map (sprintf "  %s\n") |> String.concat ""
        header + body

let readmeIndexGenerateJson (written: string list) : string =
    let env: ReadmeIndexGenerateEnvelope =
        { schema = "rhino-cli/readme-index-generate/v1"
          status = "passed"
          written = written }

    JsonSerializer.Serialize(env, jsonOptions) + "\n"

let readmeIndexGenerateMarkdown (written: string list) : string =
    if List.isEmpty written then
        "## README Index Generate\n\nNo directory needed a new or updated index.\n"
    else
        let header =
            sprintf "## README Index Generate\n\nWrote %d index(es):\n\n" (List.length written)

        let body = written |> List.map (sprintf "- %s\n") |> String.concat ""
        header + body

// ---------------------------------------------------------------------------
// governance readme-index rewrite-paths
// ---------------------------------------------------------------------------

type ReadmeIndexRewritePathsEnvelope =
    { schema: string
      status: string
      rewritten: string list }

/// [Repo-grounded — `governance_rewrite_readme_index_paths.rs::run`'s
/// `OutputFormat::Text | OutputFormat::Markdown` arm — text and markdown are
/// byte-identical for this command, unlike every other Wave D leaf].
let readmeIndexRewritePathsText (rewritten: string list) : string =
    let header =
        sprintf "readme-index rewrite-paths: %d file(s) updated\n" (List.length rewritten)

    let body = rewritten |> List.map (sprintf "  %s\n") |> String.concat ""
    header + body

let readmeIndexRewritePathsJson (rewritten: string list) : string =
    let env: ReadmeIndexRewritePathsEnvelope =
        { schema = "rhino-cli/readme-index-rewrite-paths/v1"
          status = "passed"
          rewritten = rewritten }

    JsonSerializer.Serialize(env, jsonOptions) + "\n"

let readmeIndexRewritePathsMarkdown (rewritten: string list) : string = readmeIndexRewritePathsText rewritten

// ---------------------------------------------------------------------------
// repo-governance vendor / layer-coherence / traceability / audit
// [Repo-grounded — `governance_vendor_audit.rs`, `governance_layer_coherence.rs`,
// `governance_traceability_audit.rs`, `governance_audit.rs`]
// ---------------------------------------------------------------------------

type VendorFindingJson =
    {
        path: string
        line: int
        /// `match` is an F# keyword; the backticks are erased in the JSON name,
        /// which must stay `match` to mirror Rust's `r#match` field.
        ``match``: string
        replacement: string
    }

/// The vendor audit is the one repo-governance leaf whose JSON carries no
/// outer schema envelope [Repo-grounded — `governance_vendor_audit.rs`'s
/// `JsonResult`].
type VendorResultJson =
    { status: string
      count: int
      findings: VendorFindingJson list }

let vendorAuditText (findings: RepoGovernance.VendorFinding list) : string =
    RepoGovernance.formatVendorText findings

let vendorAuditJson (findings: RepoGovernance.VendorFinding list) : string =
    let result: VendorResultJson =
        { status = (if List.isEmpty findings then "passed" else "failed")
          count = List.length findings
          findings =
            findings
            |> List.map (fun f ->
                { path = f.Path
                  line = f.Line
                  ``match`` = f.Match
                  replacement = f.Replacement }) }

    JsonSerializer.Serialize(result, jsonOptions) + "\n"

let vendorAuditMarkdown (findings: RepoGovernance.VendorFinding list) : string =
    if List.isEmpty findings then
        "## Governance Vendor Audit\n\n**PASSED**: no violations found\n"
    else
        let header =
            sprintf
                "## Governance Vendor Audit\n\n**FAILED**: %d violation(s) found\n\n| File | Line | Term | Replacement |\n|------|------|------|-------------|\n"
                (List.length findings)

        let rows =
            findings
            |> List.map (fun f -> sprintf "| %s | %d | `%s` | %s |\n" f.Path f.Line f.Match f.Replacement)
            |> String.concat ""

        header + rows

type LayerCoherenceFindingJson =
    { file: string
      severity: string
      kind: string
      message: string }

type LayerCoherenceInnerResult =
    { status: string
      count: int
      findings: LayerCoherenceFindingJson list }

type LayerCoherenceEnvelope =
    { schema: string
      status: string
      result: LayerCoherenceInnerResult }

let layerCoherenceText (findings: RepoGovernance.LayerCoherenceFinding list) : string =
    RepoGovernance.formatLayerCoherenceText findings

let layerCoherenceJson (findings: RepoGovernance.LayerCoherenceFinding list) : string =
    let status = if List.isEmpty findings then "passed" else "failed"

    let env: LayerCoherenceEnvelope =
        { schema = "rhino-cli/layer-coherence/v1"
          status = status
          result =
            { status = status
              count = List.length findings
              findings =
                findings
                |> List.map (fun f ->
                    { file = f.File
                      severity = f.Severity
                      kind = f.Kind
                      message = f.Message }) } }

    JsonSerializer.Serialize(env, jsonOptions) + "\n"

let layerCoherenceMarkdown (findings: RepoGovernance.LayerCoherenceFinding list) : string =
    if List.isEmpty findings then
        "## Layer Coherence Audit\n\n**PASSED**: zero findings\n"
    else
        let header =
            sprintf
                "## Layer Coherence Audit\n\n**FAILED**: %d finding(s) reported\n\n| File | Severity | Kind | Message |\n|------|----------|------|---------|\n"
                (List.length findings)

        let rows =
            findings
            |> List.map (fun f -> sprintf "| %s | %s | %s | %s |\n" f.File f.Severity f.Kind f.Message)
            |> String.concat ""

        header + rows

type TestBoundaryFindingJson =
    { project: string
      path: string
      line: int
      severity: string
      kind: string
      message: string }

type TestBoundaryInnerResult =
    { status: string
      count: int
      findings: TestBoundaryFindingJson list }

type TestBoundaryEnvelope =
    { schema: string
      status: string
      result: TestBoundaryInnerResult }

let testBoundaryText (findings: TestBoundary.TestBoundaryFinding list) : string = TestBoundary.formatText findings

let testBoundaryJson (findings: TestBoundary.TestBoundaryFinding list) : string =
    let status =
        if TestBoundary.hasBlocking findings then
            "failed"
        else
            "passed"

    let env: TestBoundaryEnvelope =
        { schema = "rhino-cli/test-boundary/v1"
          status = status
          result =
            { status = status
              count = List.length findings
              findings =
                findings
                |> List.map (fun f ->
                    { project = f.Project
                      path = f.Path
                      line = f.Line
                      severity = f.Severity
                      kind = f.Kind
                      message = f.Message }) } }

    JsonSerializer.Serialize(env, jsonOptions) + "\n"

let testBoundaryMarkdown (findings: TestBoundary.TestBoundaryFinding list) : string =
    if List.isEmpty findings then
        "## Integration Test Network Boundary Audit\n\n**PASSED**: zero findings\n"
    else
        let verdict =
            if TestBoundary.hasBlocking findings then
                "FAILED"
            else
                "PASSED"

        let header =
            sprintf
                "## Integration Test Network Boundary Audit\n\n**%s**: %d finding(s) reported\n\n| Project | Path | Line | Severity | Kind | Message |\n|---------|------|------|----------|------|---------|\n"
                verdict
                (List.length findings)

        let rows =
            findings
            |> List.map (fun f ->
                sprintf "| %s | %s | %d | %s | %s | %s |\n" f.Project f.Path f.Line f.Severity f.Kind f.Message)
            |> String.concat ""

        header + rows

type TraceabilityFindingJson =
    { path: string
      line: int
      kind: string
      message: string }

type TraceabilityInnerResult =
    { status: string
      count: int
      findings: TraceabilityFindingJson list }

type TraceabilityEnvelope =
    { schema: string
      status: string
      result: TraceabilityInnerResult }

let traceabilityText (findings: RepoGovernance.TraceabilityFinding list) : string =
    RepoGovernance.formatTraceabilityText findings

let traceabilityJson (findings: RepoGovernance.TraceabilityFinding list) : string =
    let status = if List.isEmpty findings then "passed" else "failed"

    let env: TraceabilityEnvelope =
        { schema = "rhino-cli/traceability-audit/v1"
          status = status
          result =
            { status = status
              count = List.length findings
              findings =
                findings
                |> List.map (fun f ->
                    { path = f.Path
                      line = f.Line
                      kind = f.Kind
                      message = f.Message }) } }

    JsonSerializer.Serialize(env, jsonOptions) + "\n"

let traceabilityMarkdown (findings: RepoGovernance.TraceabilityFinding list) : string =
    if List.isEmpty findings then
        "## Traceability Audit\n\n**PASSED**: zero findings\n"
    else
        let header =
            sprintf
                "## Traceability Audit\n\n**FAILED**: %d finding(s) reported\n\n| File | Line | Kind | Message |\n|------|------|------|---------|\n"
                (List.length findings)

        let rows =
            findings
            |> List.map (fun f -> sprintf "| %s | %d | %s | %s |\n" f.Path f.Line f.Kind f.Message)
            |> String.concat ""

        header + rows

let governanceAuditText (envelope: RepoGovernance.AuditEnvelope) : string =
    let result = envelope.Result
    let sb = Text.StringBuilder()

    let headline =
        if result.TotalFindings = 0 then
            sprintf
                "GOVERNANCE AUDIT PASSED: 0 findings across %d categories (git_sha=%s, ran_at=%s)\n"
                (List.length result.Categories)
                result.GitSha
                result.RanAt
        else
            sprintf
                "GOVERNANCE AUDIT FAILED: %d finding(s) across %d categories (git_sha=%s, ran_at=%s)\n"
                result.TotalFindings
                (List.length result.Categories)
                result.GitSha
                result.RanAt

    sb.Append headline |> ignore

    for c in result.Categories do
        sb.Append(
            sprintf "  [%s] %-32s %d finding(s)\n" (if c.Passed then "PASS" else "FAIL") c.Name (List.length c.Findings)
        )
        |> ignore

        for f in c.Findings do
            let location = if f.Line > 0 then sprintf "%s:%d" f.File f.Line else f.File

            sb.Append(sprintf "         %s  %s\n" location f.Message) |> ignore

    if not (List.isEmpty result.SkippedFalsePositives) then
        sb.Append(sprintf "  %d skipped false-positive(s)\n" (List.length result.SkippedFalsePositives))
        |> ignore

    sb.ToString()

let governanceAuditJson (envelope: RepoGovernance.AuditEnvelope) : string =
    RepoGovernance.formatAuditJson envelope + "\n"

let governanceAuditMarkdown (envelope: RepoGovernance.AuditEnvelope) : string =
    let result = envelope.Result
    let sb = Text.StringBuilder()
    sb.Append "## Governance Audit\n\n" |> ignore

    let headline =
        if result.TotalFindings = 0 then
            sprintf
                "**PASSED**: 0 findings across %d categories (git_sha=`%s`, ran_at=`%s`)\n\n"
                (List.length result.Categories)
                result.GitSha
                result.RanAt
        else
            sprintf
                "**FAILED**: %d finding(s) across %d categories (git_sha=`%s`, ran_at=`%s`)\n\n"
                result.TotalFindings
                (List.length result.Categories)
                result.GitSha
                result.RanAt

    sb.Append(headline).Append("| Category | Status | Findings |\n")
    |> fun b -> b.Append "|----------|--------|---------:|\n"
    |> ignore

    for c in result.Categories do
        sb.Append(sprintf "| %s | %s | %d |\n" c.Name (if c.Passed then "PASS" else "FAIL") (List.length c.Findings))
        |> ignore

    if not (List.isEmpty result.SkippedFalsePositives) then
        sb.Append(sprintf "\n_%d skipped false-positive(s)._\n" (List.length result.SkippedFalsePositives))
        |> ignore

    sb.ToString()

// ---------------------------------------------------------------------------
// specs scaffold dart
// [Repo-grounded — `specs_scaffold_dart.rs`]
// ---------------------------------------------------------------------------

type DartScaffoldJson =
    { status: string
      pubspec_created: bool
      barrel_created: bool
      model_files: string list }

let dartScaffoldText (result: Contracts.DartScaffoldResult) : string =
    let header =
        sprintf
            "Dart scaffold created: pubspec.yaml + barrel library (%d model files).\n"
            (List.length result.ModelFiles)

    header + (result.ModelFiles |> List.map (sprintf "  %s\n") |> String.concat "")

let dartScaffoldJson (result: Contracts.DartScaffoldResult) : string =
    let env: DartScaffoldJson =
        { status = "success"
          pubspec_created = result.PubspecCreated
          barrel_created = result.BarrelCreated
          model_files = result.ModelFiles }

    JsonSerializer.Serialize(env, jsonOptions) + "\n"

let dartScaffoldMarkdown (result: Contracts.DartScaffoldResult) : string =
    let header =
        sprintf
            "# Dart Contract Scaffold Report\n\n- **pubspec.yaml**: %s\n- **Barrel library**: %s\n- **Model files**: %d\n"
            (if result.PubspecCreated then "created" else "not created")
            (if result.BarrelCreated then "created" else "not created")
            (List.length result.ModelFiles)

    if List.isEmpty result.ModelFiles then
        header
    else
        header
        + "\n## Model Files\n\n"
        + (result.ModelFiles |> List.map (sprintf "- `%s`\n") |> String.concat "")

// ---------------------------------------------------------------------------
// Shared harness validation reporter
// [Repo-grounded — `apps/rhino-cli/src/application/agents/reporter.rs`]
// ---------------------------------------------------------------------------

let private statusBanner (result: Harness.ValidationResult) : string =
    if result.FailedChecks > 0 then
        "\u274C VALIDATION FAILED"
    elif result.WarningChecks > 0 then
        "\u26A0 VALIDATION PASSED WITH WARNINGS"
    else
        "\u2713 VALIDATION PASSED"

let private statusJson (result: Harness.ValidationResult) : string =
    if result.FailedChecks > 0 then "failure"
    elif result.WarningChecks > 0 then "warning"
    else "success"

let private trimTrailingZeros (s: string) : string = s.TrimEnd '0'

/// Formats a duration the way Go's `time.Duration.String()` does — `1s`,
/// `100ms`, `1.5s`, `1µs`, `1ns`, `1m0s` — which is what the Rust reporter
/// reproduces and therefore what byte-identity requires.
let formatGoDuration (d: TimeSpan) : string =
    let nanos = int64 (d.TotalMilliseconds * 1_000_000.0)

    let formatFraction (nanos: int64) (scale: int64) (width: int) : string =
        let whole: int64 = nanos / scale
        let frac: int64 = nanos % scale

        if frac = 0L then
            whole.ToString(CultureInfo.InvariantCulture)
        else
            let trimmed =
                trimTrailingZeros (frac.ToString(CultureInfo.InvariantCulture).PadLeft(width, '0'))

            // Coverage note: unreachable. This branch only runs when
            // `frac <> 0L` (the `frac = 0L` case is handled above), so
            // `frac`'s undecorated decimal representation always ends in a
            // nonzero digit. `PadLeft` only prepends zero characters on the
            // left, so it cannot introduce new trailing zeros; `TrimEnd('0')`
            // therefore strips at most back down to that trailing nonzero
            // digit and can never reduce `trimmed` to the empty string.
            if trimmed = "" then
                whole.ToString(CultureInfo.InvariantCulture)
            else
                sprintf "%d.%s" whole trimmed

    if nanos = 0L then
        "0s"
    elif nanos < 1_000L then
        sprintf "%dns" nanos
    elif nanos < 1_000_000L then
        formatFraction nanos 1_000L 3 + "µs"
    elif nanos < 1_000_000_000L then
        formatFraction nanos 1_000_000L 6 + "ms"
    else
        let totalSecs = nanos / 1_000_000_000L
        let fracNs: int64 = nanos % 1_000_000_000L
        let hours = totalSecs / 3600L
        let mins = (totalSecs % 3600L) / 60L
        let secs = totalSecs % 60L

        let fracPart =
            if fracNs = 0L then
                ""
            else
                "."
                + trimTrailingZeros (fracNs.ToString(CultureInfo.InvariantCulture).PadLeft(9, '0'))

        if hours > 0L then
            sprintf "%dh%dm%d%ss" hours mins secs fracPart
        elif mins > 0L then
            sprintf "%dm%d%ss" mins secs fracPart
        else
            sprintf "%d%ss" secs fracPart

let private checkDetailLines (prefix: string) (c: Harness.ValidationCheck) : string =
    [ if c.Expected <> "" then
          sprintf "%sExpected: %s\n" prefix c.Expected
      if c.Actual <> "" then
          sprintf "%sActual: %s\n" prefix c.Actual
      if c.Message <> "" then
          sprintf "%sMessage: %s\n" prefix c.Message ]
    |> String.concat ""

let validationText (result: Harness.ValidationResult) (verbose: bool) (quiet: bool) : string =
    let sb = Text.StringBuilder()

    if not quiet then
        sb.Append("Validation Complete\n").Append(String('=', 50)).Append("\n\n")
        |> ignore

    sb.Append(sprintf "Total Checks: %d\n" result.TotalChecks) |> ignore
    sb.Append(sprintf "Passed: %d\n" result.PassedChecks) |> ignore

    if result.WarningChecks > 0 then
        sb.Append(sprintf "Warnings: %d\n" result.WarningChecks) |> ignore

    sb.Append(sprintf "Failed: %d\n" result.FailedChecks) |> ignore
    sb.Append(sprintf "Duration: %s\n" (formatGoDuration result.Duration)) |> ignore

    if result.FailedChecks > 0 then
        sb.Append "\nFailed Checks:\n" |> ignore

        for c in result.Checks do
            if c.Status = "failed" then
                sb.Append(sprintf "\n  \u274C %s\n" c.Name).Append(checkDetailLines "     " c)
                |> ignore

    if result.WarningChecks > 0 then
        sb.Append "\nWarnings:\n" |> ignore

        for c in result.Checks do
            if c.Status = "warning" then
                sb.Append(sprintf "\n  \u26A0 %s\n" c.Name).Append(checkDetailLines "     " c)
                |> ignore

    if verbose then
        sb.Append "\nAll Checks:\n" |> ignore

        for c in result.Checks do
            let marker =
                match c.Status with
                | "passed" -> "\u2713"
                | "warning" -> "\u26A0"
                | _ -> "\u274C"

            sb.Append(sprintf "  %s %s\n" marker c.Name) |> ignore

            if c.Message <> "" then
                sb.Append(sprintf "     %s\n" c.Message) |> ignore

    if not quiet then
        sb.Append("\n").Append(sprintf "Status: %s\n" (statusBanner result)) |> ignore

    sb.ToString()

type ValidationCheckJson =
    { name: string
      status: string
      expected: string
      actual: string
      message: string }

type ValidationJsonOut =
    { status: string
      timestamp: string
      total_checks: int
      passed_checks: int
      warning_checks: int
      failed_checks: int
      duration_ms: int64
      checks: ValidationCheckJson list }

/// Empty `expected`/`actual`/`message` fields are omitted, mirroring Rust's
/// `#[serde(skip_serializing_if = "str::is_empty")]`.
let private validationJsonOptions =
    let opts = JsonSerializerOptions()
    opts.WriteIndented <- true
    opts.Encoder <- JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    opts.DefaultIgnoreCondition <- JsonIgnoreCondition.WhenWritingNull
    opts

/// Renders an empty string as an omitted JSON field.
let private orNull (s: string) : string = if s = "" then null else s

let validationJson (result: Harness.ValidationResult) : string =
    let out: ValidationJsonOut =
        { status = statusJson result
          timestamp = DateTimeOffset.Now.ToString("yyyy-MM-ddTHH:mm:ssK")
          total_checks = result.TotalChecks
          passed_checks = result.PassedChecks
          warning_checks = result.WarningChecks
          failed_checks = result.FailedChecks
          duration_ms = int64 result.Duration.TotalMilliseconds
          checks =
            result.Checks
            |> List.map (fun c ->
                { name = c.Name
                  status = c.Status
                  expected = orNull c.Expected
                  actual = orNull c.Actual
                  message = orNull c.Message }) }

    JsonSerializer.Serialize(out, validationJsonOptions)

let validationMarkdown (result: Harness.ValidationResult) (verbose: bool) : string =
    let sb = Text.StringBuilder()
    sb.Append("# Validation Results\n\n## Summary\n\n") |> ignore
    sb.Append(sprintf "- **Total Checks**: %d\n" result.TotalChecks) |> ignore
    sb.Append(sprintf "- **Passed**: %d\n" result.PassedChecks) |> ignore

    if result.WarningChecks > 0 then
        sb.Append(sprintf "- **Warnings**: %d\n" result.WarningChecks) |> ignore

    sb.Append(sprintf "- **Failed**: %d\n" result.FailedChecks) |> ignore

    sb.Append(sprintf "- **Duration**: %s\n\n" (formatGoDuration result.Duration))
    |> ignore

    let section (heading: string) (status: string) (marker: string) =
        if
            (status = "failed" && result.FailedChecks > 0)
            || (status = "warning" && result.WarningChecks > 0)
        then
            sb.Append(sprintf "## %s\n\n" heading) |> ignore

            for c in result.Checks do
                if c.Status = status then
                    sb.Append(sprintf "### %s %s\n\n" marker c.Name) |> ignore

                    if c.Expected <> "" then
                        sb.Append(sprintf "- **Expected**: %s\n" c.Expected) |> ignore

                    if c.Actual <> "" then
                        sb.Append(sprintf "- **Actual**: %s\n" c.Actual) |> ignore

                    if c.Message <> "" then
                        sb.Append(sprintf "- **Message**: %s\n" c.Message) |> ignore

                    sb.Append "\n" |> ignore

    section "Failed Checks" "failed" "\u274C"
    section "Warnings" "warning" "\u26A0"

    if verbose then
        sb.Append "## All Checks\n\n" |> ignore

        for c in result.Checks do
            let marker =
                match c.Status with
                | "passed" -> "\u2713"
                | "warning" -> "\u26A0"
                | _ -> "\u274C"

            sb.Append(sprintf "- %s %s" marker c.Name) |> ignore

            if c.Message <> "" then
                sb.Append(sprintf " - %s" c.Message) |> ignore

            sb.Append "\n" |> ignore

        sb.Append "\n" |> ignore

    sb.Append(sprintf "**Status**: %s\n" (statusBanner result)) |> ignore
    sb.ToString()

// ---------------------------------------------------------------------------
// harness duplication / sync report
// [Repo-grounded — `harness_validate_duplication.rs`, `agents/reporter.rs`]
// ---------------------------------------------------------------------------

type DuplicationFindingJson =
    { files: string list
      start_lines: int list
      window_size: int
      severity: string
      message: string }

type DuplicationEnvelope =
    { schema: string
      status: string
      result: DuplicationFindingJson list }

let duplicationText (findings: Harness.DuplicationFinding list) : string =
    if List.isEmpty findings then
        "AGENTS DUPLICATION VALIDATION PASSED: 0 clusters\n"
    else
        let header =
            sprintf "AGENTS DUPLICATION VALIDATION FAILED: %d cluster(s)\n" (List.length findings)

        let body =
            findings
            |> List.map (fun f ->
                sprintf "  [%s] %s (window=%d)\n" f.Severity f.Message f.WindowSize
                + (List.zip f.Files f.StartLines
                   |> List.map (fun (path, line) -> sprintf "    - %s:%d\n" path line)
                   |> String.concat ""))
            |> String.concat ""

        header + body

let duplicationJson (findings: Harness.DuplicationFinding list) : string =
    let env: DuplicationEnvelope =
        { schema = "rhino-cli/agents-detect-duplication/v1"
          status = (if List.isEmpty findings then "passed" else "failed")
          result =
            findings
            |> List.map (fun f ->
                { files = f.Files
                  start_lines = f.StartLines
                  window_size = f.WindowSize
                  severity = f.Severity
                  message = f.Message }) }

    JsonSerializer.Serialize(env, jsonOptions) + "\n"

let duplicationMarkdown (findings: Harness.DuplicationFinding list) : string =
    if List.isEmpty findings then
        "## Agents Duplication Detection\n\n**PASSED**: 0 duplication clusters detected\n"
    else
        let header =
            sprintf
                "## Agents Duplication Detection\n\n**FAILED**: %d duplication cluster(s) detected\n\n| Severity | Window | Files | Start Lines | Message |\n|----------|--------|-------|-------------|---------|\n"
                (List.length findings)

        let rows =
            findings
            |> List.map (fun f ->
                sprintf
                    "| %s | %d | %s | %s | %s |\n"
                    f.Severity
                    f.WindowSize
                    (String.concat "<br>" f.Files)
                    (f.StartLines
                     |> List.map (fun (n: int) -> n.ToString(CultureInfo.InvariantCulture))
                     |> String.concat "<br>")
                    f.Message)
            |> String.concat ""

        header + rows

/// The sync report `harness bindings generate` prints. `skills_copied` /
/// `skills_failed` are structurally always `0`: OpenCode reads
/// `.claude/skills/` natively, so the sync leg copies no skills
/// [Repo-grounded — `agents/reporter.rs`'s own field doc comments].
type SyncWarningJson =
    { agent: string
      field: string
      reason: string }

type SyncJsonOut =
    { status: string
      timestamp: string
      agents_converted: int
      agents_failed: int
      skills_copied: int
      skills_failed: int
      failed_files: string list
      warnings: SyncWarningJson list
      duration_ms: int64 }

let syncText (result: Harness.ConvertAllResult) (duration: TimeSpan) (verbose: bool) (quiet: bool) : string =
    let sb = Text.StringBuilder()

    if not quiet then
        sb.Append("Sync Complete\n").Append(String('=', 50)).Append("\n\n") |> ignore

    sb.Append(sprintf "Agents: %d converted" result.Converted) |> ignore

    if result.Failed > 0 then
        sb.Append(sprintf ", %d failed" result.Failed) |> ignore

    sb.Append("\nSkills: 0 copied\n") |> ignore
    sb.Append(sprintf "Duration: %s\n" (formatGoDuration duration)) |> ignore

    if not (List.isEmpty result.FailedFiles) then
        sb.Append "\nFailed Files:\n" |> ignore

        for f in result.FailedFiles do
            sb.Append(sprintf "  - %s\n" f) |> ignore

    if not quiet then
        sb.Append "\n" |> ignore

        sb.Append(
            if List.isEmpty result.FailedFiles then
                "Status: \u2713 SUCCESS\n"
            else
                "Status: \u274C FAILED\n"
        )
        |> ignore

    if verbose && not (List.isEmpty result.Warnings) then
        sb.Append "\nWarnings:\n" |> ignore

        for w in result.Warnings do
            sb.Append(sprintf "  \u26A0 %s: dropped field \"%s\" (%s)\n" w.AgentName w.Field w.Reason)
            |> ignore

    sb.ToString()

let syncJson (result: Harness.ConvertAllResult) (duration: TimeSpan) : string =
    let out: SyncJsonOut =
        { status =
            (if List.isEmpty result.FailedFiles then
                 "success"
             else
                 "failure")
          timestamp = DateTimeOffset.Now.ToString("yyyy-MM-ddTHH:mm:ssK")
          agents_converted = result.Converted
          agents_failed = result.Failed
          skills_copied = 0
          skills_failed = 0
          failed_files = result.FailedFiles
          warnings =
            result.Warnings
            |> List.map (fun w ->
                { agent = w.AgentName
                  field = w.Field
                  reason = w.Reason })
          duration_ms = int64 duration.TotalMilliseconds }

    JsonSerializer.Serialize(out, jsonOptions)

let syncMarkdown (result: Harness.ConvertAllResult) (duration: TimeSpan) : string =
    let sb = Text.StringBuilder()
    sb.Append("# Sync Results\n\n## Summary\n\n") |> ignore
    sb.Append(sprintf "- **Agents Converted**: %d\n" result.Converted) |> ignore

    if result.Failed > 0 then
        sb.Append(sprintf "- **Agents Failed**: %d\n" result.Failed) |> ignore

    sb.Append("- **Skills Copied**: 0\n") |> ignore

    sb.Append(sprintf "- **Duration**: %s\n\n" (formatGoDuration duration))
    |> ignore

    if not (List.isEmpty result.FailedFiles) then
        sb.Append "## Failed Files\n\n" |> ignore

        for f in result.FailedFiles do
            sb.Append(sprintf "- `%s`\n" f) |> ignore

        sb.Append "\n" |> ignore

    sb.Append(
        if List.isEmpty result.FailedFiles then
            "**Status**: \u2713 SUCCESS\n"
        else
            "**Status**: \u274C FAILED\n"
    )
    |> ignore

    if not (List.isEmpty result.Warnings) then
        sb.Append "\n## Warnings\n\n" |> ignore

        for w in result.Warnings do
            sb.Append(sprintf "- \u26A0 `%s`: dropped field `%s` (%s)\n" w.AgentName w.Field w.Reason)
            |> ignore

    sb.ToString()
