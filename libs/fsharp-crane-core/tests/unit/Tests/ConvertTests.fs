module CraneCore.Tests.Unit.Tests.ConvertTests

open Xunit
open CraneCore.Domain.PdfMetadata
open CraneCore.Ports
open CraneCore.Convert

type private FailingSamplePdfPort() =
    interface IPdfPort with
        member _.GetMetadata(_path) =
            Ok
                { Pages = 1
                  Title = None
                  Author = None
                  File = "mock.pdf"
                  SizeBytes = 0L }

        member _.SampleText(_path, _pageCount) = Error "cannot open file"
        member _.ExtractPages(_path, _startPage, _endPage) = Ok "unreachable"

type private UnusedOcrPort() =
    interface IOcrPort with
        member _.ExtractText(_path, _pageNum) = Ok "unreachable"

[<Fact>]
// @scenario specs/libs/fsharp-crane-core/behaviours/convert/pdf-to-markdown-sampling.feature: A PDF that cannot be sampled is reported as a sampling failure
let ``convertPdfToMarkdown surfaces a sampling failure instead of routing to OCR or extraction`` () =
    let pdfPort = FailingSamplePdfPort() :> IPdfPort
    let ocrPort = UnusedOcrPort() :> IOcrPort

    match convertPdfToMarkdown pdfPort ocrPort "unreadable.pdf" with
    | Error message -> Assert.Contains("Failed to sample PDF: cannot open file", message)
    | Ok text -> Assert.Fail(sprintf "expected a sampling failure, got Ok %s" text)

type private RecordingPageRangePdfPort() =
    let mutable requestedRange = (0, 0)
    member _.RequestedRange = requestedRange

    interface IPdfPort with
        member _.GetMetadata(_path) =
            Ok
                { Pages = 1
                  Title = None
                  Author = None
                  File = "mock.pdf"
                  SizeBytes = 0L }

        member _.SampleText(_path, _pageCount) =
            Ok "word one two three four five six seven eight nine ten eleven"

        member _.ExtractPages(_path, startPage, endPage) =
            requestedRange <- (startPage, endPage)
            Ok "extracted"

// @scenario specs/libs/fsharp-crane-core/behaviours/convert/pdf-to-markdown-sampling.feature: Text extraction reads pages 1 to 999 only
[<Fact>]
let ``Text extraction reads pages 1 to 999 only`` () =
    let pdfPort = RecordingPageRangePdfPort()

    let result =
        convertPdfToMarkdown (pdfPort :> IPdfPort) (UnusedOcrPort() :> IOcrPort) "text.pdf"

    Assert.Equal(Ok "extracted", result)
    Assert.Equal((1, 999), pdfPort.RequestedRange)
