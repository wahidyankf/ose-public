module CraneCore.Tests.Unit.Tests.ContractTests

// Unit proofs for the crane-core scenarios that have no other unit test: report
// and skiplist shapes, cache and report paths, adapter fakes, and the OCR failure.

open System
open System.Text.Json
open Xunit
open CraneCore.Domain.Finding
open CraneCore.Domain.PdfMetadata
open CraneCore.Domain.Report
open CraneCore.Ports
open CraneCore.Logic
open CraneCore.Adapters.Out

/// Runs `body` with the environment variable `name` set to `value`, restoring the prior value afterwards.
let private withEnvironment (name: string) (value: string) (body: unit -> unit) : unit =
    let previous = Environment.GetEnvironmentVariable name

    try
        Environment.SetEnvironmentVariable(name, value)
        body ()
    finally
        Environment.SetEnvironmentVariable(name, previous)

// @scenario specs/libs/fsharp-crane-core/behaviours/checks/checks.feature: A finding serialises with the report field names
[<Fact>]
let ``A finding serialises with the report field names`` () =
    let finding =
        { Category = "text-completeness"
          Criticality = "HIGH"
          Confidence = "HIGH"
          LocationPdf = Some "page 1"
          LocationMd = None
          Description = "chunk missing"
          PdfText = None
          FixSuggestion = None
          AutoFixable = false }

    let json = JsonSerializer.Serialize(finding)

    for name in
        [ "category"
          "criticality"
          "confidence"
          "location_pdf"
          "location_md"
          "description"
          "pdf_text"
          "fix_suggestion"
          "auto_fixable" ] do
        Assert.Contains($"\"{name}\"", json)

// @scenario specs/libs/fsharp-crane-core/behaviours/reports/reports.feature: Report stamps use UTC+7
[<Fact>]
let ``Report stamps use UTC+7`` () =
    let midnightUtc = DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero)
    Assert.Equal("2026-01-01--07-00", ReportManager.utc7TimestampAt midnightUtc)

// @scenario specs/libs/fsharp-crane-core/behaviours/reports/reports.feature: A skiplist finding is keyed by a stable hash and never added twice
[<Fact>]
let ``stableKey is deterministic per finding`` () =
    let key = SkiplistManager.stableKey "doc.md" "text-completeness" "chunk missing"

    let repeated: string =
        SkiplistManager.stableKey "doc.md" "text-completeness" "chunk missing"

    let otherFile: string =
        SkiplistManager.stableKey "other.md" "text-completeness" "chunk missing"

    Assert.Equal<string>(key, repeated)
    Assert.NotEqual<string>(key, otherFile)

// @scenario specs/libs/fsharp-crane-core/behaviours/reports/reports.feature: CRANE_SKIPLIST_PATH overrides the skiplist file path
[<Fact>]
let ``CRANE_SKIPLIST_PATH overrides the skiplist file path`` () =
    withEnvironment "CRANE_SKIPLIST_PATH" "/tmp/crane-override-skiplist.md" (fun () ->
        Assert.Equal("/tmp/crane-override-skiplist.md", SkiplistManager.resolveSkiplistPath ()))

// @scenario specs/libs/fsharp-crane-core/behaviours/reports/reports.feature: A skiplist entry carries its Markdown basename
[<Fact>]
let ``A skiplist entry carries its Markdown basename`` () =
    let entry =
        { MdBasename = "doc.md"
          Category = "text-completeness"
          Description = "chunk missing"
          Key = "0123456789abcdef"
          Accepted = "2026-01-01"
          Reason = "accepted" }

    Assert.Contains("\"md_basename\"", JsonSerializer.Serialize(entry))
    Assert.Equal("doc.md", entry.MdBasename)

// @scenario specs/libs/fsharp-crane-core/behaviours/reports/reports.feature: A report that cannot be written or finalized returns an Error
[<Fact>]
let ``finalizing a missing report returns an Error`` () =
    match ReportManager.finalizeReport "/nonexistent-crane-report-dir/report.md" "done" with
    | Error _ -> ()
    | Ok() -> Assert.Fail("expected an Error for a report that does not exist")

// @scenario specs/libs/fsharp-crane-core/behaviours/cache/cache.feature: The extraction cache proxies metadata to the PDF port
[<Fact>]
let ``The extraction cache proxies metadata to the PDF port`` () =
    let inner = PdfAdapter.FakePdfAdapter("text", 4, 1234L) :> IPdfPort
    let cached = PdfExtractionCache.wrap inner "/tmp/crane-unused-cache"

    match cached.GetMetadata "doc.pdf" with
    | Ok metadata -> Assert.Equal(4, metadata.Pages)
    | Error message -> Assert.Fail(message)

// @scenario specs/libs/fsharp-crane-core/behaviours/cache/cache.feature: XDG_CACHE_HOME sets the extraction cache directory
[<Fact>]
let ``XDG_CACHE_HOME sets the extraction cache directory`` () =
    withEnvironment "XDG_CACHE_HOME" "/tmp/crane-xdg-cache" (fun () ->
        Assert.StartsWith("/tmp/crane-xdg-cache", PdfExtractionCache.defaultCacheDir ()))

// @scenario specs/libs/fsharp-crane-core/behaviours/adapters/adapters.feature: PdfMetadata reports pages, title, author, file, and size
[<Fact>]
let ``PdfMetadata reports pages, title, author, file, and size`` () =
    let port = PdfAdapter.FakePdfAdapter("text", 4, 1234L) :> IPdfPort

    match port.GetMetadata "doc.pdf" with
    | Ok metadata ->
        Assert.Equal(4, metadata.Pages)
        Assert.Equal(Some "Fake Document", metadata.Title)
        Assert.True(Option.isNone metadata.Author)
        Assert.Equal("doc.pdf", metadata.File)
        Assert.Equal(1234L, metadata.SizeBytes)
    | Error message -> Assert.Fail(message)

// @scenario specs/libs/fsharp-crane-core/behaviours/adapters/adapters.feature: A fake PDF port serves its configured text, pages, and size
[<Fact>]
let ``A fake PDF port serves its configured text, pages, and size`` () =
    let port = PdfAdapter.FakePdfAdapter("configured text", 4, 1234L) :> IPdfPort

    Assert.Equal(Ok "configured text", port.SampleText("doc.pdf", 3))
    Assert.Equal(Ok "configured text", port.ExtractPages("doc.pdf", 1, 2))

    match port.GetMetadata "doc.pdf" with
    | Ok metadata ->
        Assert.Equal(4, metadata.Pages)
        Assert.Equal(1234L, metadata.SizeBytes)
    | Error message -> Assert.Fail(message)

// @scenario specs/libs/fsharp-crane-core/behaviours/adapters/adapters.feature: The file ports are plain function aliases
[<Fact>]
let ``The file ports are plain function aliases`` () =
    let readFile: ReadFile = fun path -> Ok $"contents of {path}"
    let writeFile: WriteFile = fun _ _ -> Ok()
    let appendReport: AppendReport = fun _ _ -> Ok()

    Assert.Equal(Ok "contents of a.md", readFile "a.md")
    Assert.Equal(Ok(), writeFile "a.md" "text")
    Assert.Equal(Ok(), appendReport "a.md" [])

// @scenario specs/libs/fsharp-crane-core/behaviours/adapters/adapters.feature: Extracted pages join with line breaks
[<Fact>]
let ``Extracted pages join with line breaks`` () =
    Assert.Equal("page one\npage two", PdfAdapter.joinExtractedPages [ "page one"; "page two" ])

// @scenario specs/libs/fsharp-crane-core/behaviours/adapters/adapters.feature: An OCR engine that cannot start reports the page that failed
[<Fact>]
let ``An OCR engine that cannot start reports the page that failed`` () =
    let port = OcrAdapter.RealOcrAdapter() :> IOcrPort

    match port.ExtractText("scan.pdf", 3) with
    | Error message -> Assert.StartsWith("OCR failed for scan.pdf page 3:", message)
    | Ok text -> Assert.Fail($"expected the OCR engine to fail without a tessdata directory, got Ok {text}")
