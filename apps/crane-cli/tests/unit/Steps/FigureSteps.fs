module CraneCli.Tests.Unit.Steps.FigureSteps

open TickSpec
open Xunit
open CraneCore.Logic.FigureChecker
open CraneCli.Tests.Unit.Steps.BddState

// ---- BDD shared state ----
let mutable private pdfText: string = ""
let mutable private mdText: string = ""

// ---- BDD Given steps ----

[<Given>]
let ``a PDF fixture referencing "Figure (\d+)"`` (num: string) =
    pdfText <- sprintf "This document contains Figure %s" num

[<Given>]
let ``its Markdown with a Mermaid code block near that reference`` () =
    mdText <- "Some text\n```mermaid\ngraph TD\n A-->B\n```"

[<Given>]
let ``its Markdown with a "\[FIGURE (\d+): \.\.\.\]" placeholder`` (num: string) =
    mdText <- sprintf "[FIGURE %s: description of the figure]" num

[<Given>]
let ``a Markdown with no Mermaid block or placeholder for Figure (\d+)`` (_num: string) =
    mdText <- "Some completely unrelated text with no figures"

// ---- BDD When steps ----

[<When>]
let ``I run "crane figure check" on the pair`` () =
    RunWithWriter(fun w ->
        let findings = checkFigures pdfText mdText
        let opts = System.Text.Json.JsonSerializerOptions()
        opts.DefaultIgnoreCondition <- System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        w.WriteLine(System.Text.Json.JsonSerializer.Serialize(findings, opts))
        if findings.IsEmpty then 0 else 1)

[<When>]
let ``I run "crane figure detect" on the PDF fixture`` () =
    RunWithWriter(fun w ->
        let figures = detectFigures pdfText
        let opts = System.Text.Json.JsonSerializerOptions()
        opts.DefaultIgnoreCondition <- System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        w.WriteLine(System.Text.Json.JsonSerializer.Serialize(figures, opts))
        0)

// ---- BDD Then steps ----

[<Then>]
let ``the JSON output lists the figure "([^"]*)"`` (number: string) =
    let doc = System.Text.Json.JsonDocument.Parse(LastOutput)

    let numbers =
        doc.RootElement.EnumerateArray()
        |> Seq.map (fun figure -> figure.GetProperty("Number").GetString())
        |> Seq.toList

    Assert.Contains(number, numbers)
