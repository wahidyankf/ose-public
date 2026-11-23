module CraneCore.Tests.Unit.Tests.PdfToMarkdownRoutingSteps

open TickSpec
open Xunit
open CraneCore.Domain.PdfMetadata
open CraneCore.Ports
open CraneCore.Convert

type RecordingPdfPort(sampleText: string) =
    let mutable extractPagesCalled = false
    member _.ExtractPagesCalled = extractPagesCalled

    interface IPdfPort with
        member _.GetMetadata(_path) =
            Ok
                { Pages = 1
                  Title = None
                  Author = None
                  File = "mock.pdf"
                  SizeBytes = 0L }

        member _.SampleText(_path, _pageCount) = Ok sampleText

        member _.ExtractPages(_path, _startPage, _endPage) =
            extractPagesCalled <- true
            Ok sampleText

type RecordingOcrPort() =
    let mutable extractTextCalled = false
    member _.ExtractTextCalled = extractTextCalled

    interface IOcrPort with
        member _.ExtractText(_path, _pageNum) =
            extractTextCalled <- true
            Ok "ocr result"

type ConvertState =
    { PdfPort: RecordingPdfPort option
      OcrPort: RecordingOcrPort
      Result: Result<string, string> option }

let emptyState =
    { PdfPort = None
      OcrPort = RecordingOcrPort()
      Result = None }

[<Given>]
let ``a PDF whose sampled text has more than 10 words`` (state: ConvertState) =
    { state with
        PdfPort = Some(RecordingPdfPort("word one two three four five six seven eight nine ten eleven")) }

[<Given>]
let ``a PDF whose sampled text has 10 words or fewer`` (state: ConvertState) =
    { state with
        PdfPort = Some(RecordingPdfPort("just a few words")) }

[<When>]
let ``I call convertPdfToMarkdown`` (state: ConvertState) =
    let pdfPort = state.PdfPort.Value :> IPdfPort
    let ocrPort = state.OcrPort :> IOcrPort

    { state with
        Result = Some(convertPdfToMarkdown pdfPort ocrPort "fake.pdf") }

[<Then>]
let ``the returned Markdown is the extracted page text`` (state: ConvertState) =
    Assert.Equal(Some(Ok "word one two three four five six seven eight nine ten eleven"), state.Result)
    Assert.True(state.PdfPort.Value.ExtractPagesCalled)
    Assert.False(state.OcrPort.ExtractTextCalled)
    state

[<Then>]
let ``the returned Markdown is the OCR text`` (state: ConvertState) =
    Assert.Equal(Some(Ok "ocr result"), state.Result)
    Assert.True(state.OcrPort.ExtractTextCalled)
    Assert.False(state.PdfPort.Value.ExtractPagesCalled)
    state
