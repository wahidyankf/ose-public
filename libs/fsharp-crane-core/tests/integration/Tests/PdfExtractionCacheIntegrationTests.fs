module CraneCore.Tests.Integration.Tests.PdfExtractionCacheIntegrationTests

open System
open System.IO
open Xunit
open CraneCore.Ports
open CraneCore.Logic.PdfExtractionCache
open CraneCore.Domain.PdfMetadata
open CraneCore.Adapters.Out.PdfAdapter

[<Fact>]
// @scenario specs/libs/fsharp-crane-core/behaviours/adapters/adapters.feature: Extracted pages join with line breaks
let ``joining extracted pages preserves line and indentation structure`` () =
    let pages = [ "- parent\n  - child"; "| A | B |\n|---|---|" ]

    Assert.Equal("- parent\n  - child\n| A | B |\n|---|---|", joinExtractedPages pages)

type FakePdfPort(text: string, pages: int, sizeBytes: int64) =
    interface IPdfPort with
        member _.GetMetadata(path) =
            Ok
                { Pages = pages
                  Title = Some "Fake"
                  Author = None
                  File = path
                  SizeBytes = sizeBytes }

        member _.SampleText(_path, _pageCount) = Ok text
        member _.ExtractPages(_path, _startPage, _endPage) = Ok text

type FailingPdfPort() =
    interface IPdfPort with
        member _.GetMetadata(_path) = Error "metadata not available"
        member _.SampleText(_path, _pageCount) = Error "sample failed"
        member _.ExtractPages(_path, _startPage, _endPage) = Error "extract failed"

let private withTempPdf (f: string -> string -> unit) =
    let tmpDir =
        Path.Combine(Path.GetTempPath(), sprintf "crane-cache-test-%s" (Guid.NewGuid().ToString("N").[..7]))

    Directory.CreateDirectory(tmpDir) |> ignore
    let pdfPath = Path.Combine(tmpDir, "test.pdf")
    File.WriteAllText(pdfPath, "fake pdf content for testing purposes")

    try
        f pdfPath tmpDir
    finally
        if Directory.Exists(tmpDir) then
            Directory.Delete(tmpDir, true)

[<Fact>]
// @scenario specs/libs/fsharp-crane-core/behaviours/cache/cache.feature: The extraction cache proxies metadata to the PDF port
let ``wrap returns IPdfPort that proxies metadata`` () =
    let inner = FakePdfPort("some text", 5, 1024L) :> IPdfPort
    let cacheDir = Path.GetTempPath()
    let cached = wrap inner cacheDir
    let result = cached.GetMetadata("fake.pdf")
    Assert.True(result.IsOk)

[<Fact>]
let ``defaultCacheDir returns a non-empty string`` () =
    let dir = defaultCacheDir ()
    Assert.NotEmpty(dir)

[<Fact>]
// @scenario specs/libs/fsharp-crane-core/behaviours/cache/cache.feature: XDG_CACHE_HOME sets the extraction cache directory
let ``defaultCacheDir uses XDG_CACHE_HOME when set`` () =
    let prev = Environment.GetEnvironmentVariable("XDG_CACHE_HOME")

    try
        let tmpXdg = Path.GetTempPath()
        Environment.SetEnvironmentVariable("XDG_CACHE_HOME", tmpXdg)
        let dir = defaultCacheDir ()
        Assert.True(dir.StartsWith(tmpXdg))
    finally
        Environment.SetEnvironmentVariable("XDG_CACHE_HOME", prev)

[<Fact>]
let ``wrap cached adapter returns same text on second call for nonexistent pdf`` () =
    let inner = FakePdfPort("hello world text", 1, 512L) :> IPdfPort
    let cacheDir = Path.GetTempPath()
    let cached = wrap inner cacheDir
    let result1 = cached.SampleText("fake.pdf", 5)
    let result2 = cached.SampleText("fake.pdf", 5)
    Assert.Equal(result1, result2)

[<Fact>]
let ``wrap with real file caches SampleText on first call`` () =
    withTempPdf (fun pdfPath cacheDir ->
        let inner = FakePdfPort("cached text content", 3, 1024L) :> IPdfPort
        let cached = wrap inner cacheDir
        let result = cached.SampleText(pdfPath, 3)

        match result with
        | Ok text -> Assert.Equal("cached text content", text)
        | Error msg -> Assert.Fail(sprintf "SampleText failed: %s" msg))

[<Fact>]
let ``wrap with real file returns cached SampleText on second call`` () =
    withTempPdf (fun pdfPath cacheDir ->
        let inner = FakePdfPort("cached sample result", 3, 1024L) :> IPdfPort
        let cached = wrap inner cacheDir
        let result1 = cached.SampleText(pdfPath, 3)
        let result2 = cached.SampleText(pdfPath, 3)

        match result1, result2 with
        | Ok t1, Ok t2 -> Assert.Equal(t1, t2)
        | _ -> Assert.Fail("Both calls should succeed"))

[<Fact>]
let ``wrap with real file caches ExtractPages on first call`` () =
    withTempPdf (fun pdfPath cacheDir ->
        let inner = FakePdfPort("extracted pages text", 10, 2048L) :> IPdfPort
        let cached = wrap inner cacheDir
        let result = cached.ExtractPages(pdfPath, 1, 5)

        match result with
        | Ok text -> Assert.Equal("extracted pages text", text)
        | Error msg -> Assert.Fail(sprintf "ExtractPages failed: %s" msg))

[<Fact>]
let ``wrap with real file returns cached ExtractPages on second call`` () =
    withTempPdf (fun pdfPath cacheDir ->
        let inner = FakePdfPort("pages cache result", 10, 2048L) :> IPdfPort
        let cached = wrap inner cacheDir
        let result1 = cached.ExtractPages(pdfPath, 1, 5)
        let result2 = cached.ExtractPages(pdfPath, 1, 5)

        match result1, result2 with
        | Ok t1, Ok t2 -> Assert.Equal(t1, t2)
        | _ -> Assert.Fail("Both ExtractPages calls should succeed"))

[<Fact>]
let ``wrap propagates inner SampleText error when pdf not readable`` () =
    let inner = FailingPdfPort() :> IPdfPort
    let cacheDir = Path.GetTempPath()
    let cached = wrap inner cacheDir

    match cached.SampleText("nonexistent.pdf", 3) with
    | Error _ -> ()
    | Ok _ -> Assert.Fail("Expected error for failing adapter")

[<Fact>]
let ``wrap propagates inner ExtractPages error when pdf not readable`` () =
    let inner = FailingPdfPort() :> IPdfPort
    let cacheDir = Path.GetTempPath()
    let cached = wrap inner cacheDir

    match cached.ExtractPages("nonexistent.pdf", 1, 5) with
    | Error _ -> ()
    | Ok _ -> Assert.Fail("Expected error for failing adapter")

type private CountingPdfPort(text: string) =
    let mutable calls = 0
    member _.Calls = calls

    interface IPdfPort with
        member _.GetMetadata(path) =
            Ok
                { Pages = 1
                  Title = None
                  Author = None
                  File = path
                  SizeBytes = 0L }

        member _.SampleText(_path, _pageCount) =
            calls <- calls + 1
            Ok text

        member _.ExtractPages(_path, _startPage, _endPage) =
            calls <- calls + 1
            Ok text

[<Fact>]
let ``wrap serves the second SampleText call from disk without calling the inner port again`` () =
    // Regression coverage for a real bug: `CachedExtraction` was declared
    // `private`, which caps its properties below the visibility
    // `JsonSerializer`'s default reflection-based converter requires. Every
    // write silently serialized as `{}` and every read then failed to
    // deserialize, so the cache never actually cached anything — every call
    // fell through to the inner port, which earlier tests could not catch
    // because their `FakePdfPort` returns the same fixed text either way.
    withTempPdf (fun pdfPath cacheDir ->
        let inner = CountingPdfPort("spy probe text")
        let cached = wrap (inner :> IPdfPort) cacheDir

        match cached.SampleText(pdfPath, 3), cached.SampleText(pdfPath, 3) with
        | Ok first, Ok second ->
            Assert.Equal("spy probe text", first)
            Assert.Equal("spy probe text", second)
            Assert.Equal(1, inner.Calls)
        | _ -> Assert.Fail("both calls should succeed"))

[<Fact>]
let ``wrap serves the second ExtractPages call from disk without calling the inner port again`` () =
    withTempPdf (fun pdfPath cacheDir ->
        let inner = CountingPdfPort("spy pages text")
        let cached = wrap (inner :> IPdfPort) cacheDir

        match cached.ExtractPages(pdfPath, 1, 5), cached.ExtractPages(pdfPath, 1, 5) with
        | Ok first, Ok second ->
            Assert.Equal("spy pages text", first)
            Assert.Equal("spy pages text", second)
            Assert.Equal(1, inner.Calls)
        | _ -> Assert.Fail("both calls should succeed"))

[<Fact>]
let ``wrap propagates a clean cache-miss SampleText failure without swallowing it`` () =
    // Distinct from the "not readable" cases above: pdfSha256 succeeds here
    // (a real file backs the hash), so this exercises the inner match's own
    // `Error msg -> Error msg` arm, not the outer catch-all around a failed
    // hash.
    withTempPdf (fun pdfPath cacheDir ->
        let inner = FailingPdfPort() :> IPdfPort
        let cached = wrap inner cacheDir

        match cached.SampleText(pdfPath, 3) with
        | Error message -> Assert.Equal("sample failed", message)
        | Ok text -> Assert.Fail(sprintf "expected the inner failure to propagate, got Ok %s" text))

[<Fact>]
let ``wrap propagates a clean cache-miss ExtractPages failure without swallowing it`` () =
    withTempPdf (fun pdfPath cacheDir ->
        let inner = FailingPdfPort() :> IPdfPort
        let cached = wrap inner cacheDir

        match cached.ExtractPages(pdfPath, 1, 5) with
        | Error message -> Assert.Equal("extract failed", message)
        | Ok text -> Assert.Fail(sprintf "expected the inner failure to propagate, got Ok %s" text))

[<Fact>]
let ``wrap still returns the inner result when the cache write itself cannot be persisted`` () =
    // cacheDir points at an existing file, so writeAtomic's own directory
    // creation throws; that failure must stay confined to the local
    // `try ... with _ -> ()` around the write and never surface to the
    // caller, who only asked for the extracted text.
    withTempPdf (fun pdfPath _unusedCacheDir ->
        let blockingFile =
            Path.Combine(Path.GetTempPath(), sprintf "crane-cache-blocker-%s" (Guid.NewGuid().ToString("N").[..7]))

        File.WriteAllText(blockingFile, "not a directory")

        try
            let inner = FakePdfPort("text despite a broken cache", 2, 256L) :> IPdfPort
            let cached = wrap inner blockingFile

            match cached.SampleText(pdfPath, 3) with
            | Ok text -> Assert.Equal("text despite a broken cache", text)
            | Error message -> Assert.Fail(sprintf "expected Ok despite a broken cache, got Error %s" message)
        finally
            File.Delete(blockingFile))

[<Fact>]
let ``wrap treats a corrupt cache entry as a miss and falls back to the inner port`` () =
    withTempPdf (fun pdfPath cacheDir ->
        let inner = CountingPdfPort("recovered after corruption")
        let cached = wrap (inner :> IPdfPort) cacheDir
        cached.SampleText(pdfPath, 3) |> ignore

        let extractDir = Path.Combine(cacheDir, "extract")
        let cacheFile = Directory.GetFiles(extractDir) |> Array.exactlyOne
        File.WriteAllText(cacheFile, "{ this is not valid json")

        match cached.SampleText(pdfPath, 3) with
        | Ok text ->
            Assert.Equal("recovered after corruption", text)
            Assert.Equal(2, inner.Calls)
        | Error message -> Assert.Fail(sprintf "expected recovery via the inner port, got Error %s" message))

[<Fact>]
let ``wrap treats a literal JSON null cache entry as a miss and falls back to the inner port`` () =
    withTempPdf (fun pdfPath cacheDir ->
        let inner = CountingPdfPort("recovered after null")
        let cached = wrap (inner :> IPdfPort) cacheDir
        cached.SampleText(pdfPath, 3) |> ignore

        let extractDir = Path.Combine(cacheDir, "extract")
        let cacheFile = Directory.GetFiles(extractDir) |> Array.exactlyOne
        File.WriteAllText(cacheFile, "null")

        match cached.SampleText(pdfPath, 3) with
        | Ok text ->
            Assert.Equal("recovered after null", text)
            Assert.Equal(2, inner.Calls)
        | Error message -> Assert.Fail(sprintf "expected recovery via the inner port, got Error %s" message))

[<Fact>]
let ``wrap still returns the inner ExtractPages result when the cache write itself cannot be persisted`` () =
    withTempPdf (fun pdfPath _unusedCacheDir ->
        let blockingFile =
            Path.Combine(
                Path.GetTempPath(),
                sprintf "crane-cache-blocker-pages-%s" (Guid.NewGuid().ToString("N").[..7])
            )

        File.WriteAllText(blockingFile, "not a directory")

        try
            let inner = FakePdfPort("pages despite a broken cache", 2, 256L) :> IPdfPort
            let cached = wrap inner blockingFile

            match cached.ExtractPages(pdfPath, 1, 5) with
            | Ok text -> Assert.Equal("pages despite a broken cache", text)
            | Error message -> Assert.Fail(sprintf "expected Ok despite a broken cache, got Error %s" message)
        finally
            File.Delete(blockingFile))

[<Fact>]
let ``wrap reuses the already-created extract directory for a second, differently-keyed cache write`` () =
    withTempPdf (fun pdfPath cacheDir ->
        let inner = FakePdfPort("first-kind text", 2, 256L) :> IPdfPort
        let cached = wrap inner cacheDir
        // First write creates cacheDir/extract/. A second write of a
        // different kind (ExtractPages vs. SampleText) against the same
        // cacheDir finds that directory already present.
        cached.SampleText(pdfPath, 3) |> ignore
        cached.ExtractPages(pdfPath, 1, 5) |> ignore

        let extractDir = Path.Combine(cacheDir, "extract")
        Assert.Equal(2, Directory.GetFiles(extractDir).Length))
