module CraneCli.Tests.Unit.Steps.CommandSteps

open System
open System.IO
open System.Text.Json
open TickSpec
open Xunit
open CraneCore.Ports
open CraneCore.Adapters.Out.PdfAdapter
open CraneCore.Logic
open CraneCli.Adapters.In.CliAdapter
open CraneCli.Tests.Unit.Steps.BddState

let private failingPort: IPdfPort =
    { new IPdfPort with
        member _.GetMetadata(path) = Error $"cannot read {path}"
        member _.SampleText(path, _) = Error $"cannot read {path}"
        member _.ExtractPages(path, _, _) = Error $"cannot read {path}" }

let mutable private pdfPort: IPdfPort = FakePdfAdapter("", 1, 0L) :> IPdfPort
let mutable private mdDocument: string = ""
let mutable private stderrText: string = ""

/// Runs a CLI action with standard output and standard error captured in-process.
let private capture (action: unit -> int) =
    use outWriter = new StringWriter()
    use errWriter = new StringWriter()
    let originalOut = Console.Out
    let originalErr = Console.Error
    Console.SetOut outWriter
    Console.SetError errWriter

    try
        LastExitCode <- action ()
    finally
        Console.SetOut originalOut
        Console.SetError originalErr

    LastOutput <- outWriter.ToString().Trim()
    stderrText <- errWriter.ToString().Trim()

// ---- BDD Given steps ----

[<Given>]
let ``a PDF whose page text is "([^"]*)"`` (text: string) =
    pdfPort <- FakePdfAdapter(text, 2, 1024L) :> IPdfPort

[<Given>]
let ``a PDF path that cannot be read`` () = pdfPort <- failingPort

[<Given>]
let ``a Markdown document containing "([^"]*)"`` (text: string) = mdDocument <- text

// ---- BDD When steps ----

[<When>]
let ``I run "crane pdf extract" for pages (\d+) to (\d+)`` (first: int) (last: int) =
    capture (fun () -> run pdfPort [| "pdf"; "-e"; "fixture.pdf"; "-s"; string first; "-n"; string last |])

[<When>]
let ``I run "crane text search" for "([^"]*)"`` (segment: string) =
    let found = TextChecker.segmentIsPresent segment mdDocument
    let similarity = TextChecker.computeSimilarity segment mdDocument

    LastOutput <-
        JsonSerializer.Serialize(
            {| found = found
               similarity = similarity |}
        )

    LastExitCode <- if found then 0 else 1

[<When>]
let ``I run the unknown command "([^"]*)"`` (commandLine: string) =
    let args = commandLine.Split(' ') |> Array.skip 1
    capture (fun () -> run pdfPort args)

// ---- BDD Then steps ----

[<Then>]
let ``standard output is "([^"]*)"`` (expected: string) = Assert.Equal(expected, LastOutput)

[<Then>]
let ``standard output contains "([^"]*)"`` (expected: string) = Assert.Contains(expected, LastOutput)

[<Then>]
let ``standard error starts with "([^"]*)"`` (expected: string) = Assert.StartsWith(expected, stderrText)

[<Then>]
let ``the JSON output contains found (true|false)`` (expected: string) =
    let document = JsonDocument.Parse(LastOutput)
    Assert.Equal(bool.Parse expected, document.RootElement.GetProperty("found").GetBoolean())

[<Then>]
let ``the JSON output contains a similarity score`` () =
    let document = JsonDocument.Parse(LastOutput)
    Assert.InRange(document.RootElement.GetProperty("similarity").GetDouble(), 0.0, 1.0)
