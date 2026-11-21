module CraneCli.Tests.Unit.Steps.CheckAllSteps

open TickSpec
open Xunit
open CraneCore.Ports
open CraneCore.Adapters.Out.PdfAdapter
open CraneCore.Logic
open CraneCli.Tests.Unit.Steps.BddState

let mutable private pdfText: string = ""
let mutable private mdText: string = ""

[<Given>]
let ``a PDF fixture and an MD that matches across all dimensions`` () =
    let body =
        "Hello world section content. "
        + "This document covers introduction, scope, and requirements. "
        + "Each section is fully present and accurately transcribed."

    pdfText <- body
    mdText <- "# Title\n\n" + body + "\n"

[<Given>]
let ``a PDF fixture and an MD missing content`` () =
    pdfText <-
        "Critical missing section content goes here. "
        + "Important paragraph that the MD lacks entirely. "
        + "Another full passage that must not be dropped."

    mdText <- "# Title\n\nUnrelated short text.\n"

[<When>]
let ``I run "crane check-all" on the pair`` () =
    let fakeAdapter = FakePdfAdapter(pdfText, 1, 1024L) :> IPdfPort

    RunWithWriter(fun w ->
        match fakeAdapter.SampleText("fake.pdf", 999) with
        | Ok sampleText ->
            let chunks =
                sampleText.Split([| '\n' |], System.StringSplitOptions.RemoveEmptyEntries)
                |> Array.filter (fun s -> s.Trim().Length > 10)
                |> Array.toList

            let findings =
                [ yield! TextChecker.checkText chunks mdText
                  yield! HeadingChecker.checkHeadings sampleText mdText
                  yield! NestingChecker.checkNesting sampleText mdText
                  yield! TableChecker.checkTables sampleText mdText
                  yield! FigureChecker.checkFigures sampleText mdText
                  yield! MermaidValidator.validateMd mdText ]

            let opts = System.Text.Json.JsonSerializerOptions()
            opts.DefaultIgnoreCondition <- System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            w.WriteLine(System.Text.Json.JsonSerializer.Serialize(findings, opts))
            if findings.IsEmpty then 0 else 1
        | Error msg ->
            eprintfn "Error: %s" msg
            1)

[<Then>]
let ``every finding names its category`` () =
    let doc = System.Text.Json.JsonDocument.Parse(LastOutput)
    let findings = doc.RootElement.EnumerateArray() |> Seq.toList
    Assert.NotEmpty(findings)

    for finding in findings do
        Assert.False(System.String.IsNullOrWhiteSpace(finding.GetProperty("category").GetString()))
