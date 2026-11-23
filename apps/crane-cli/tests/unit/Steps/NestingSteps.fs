module CraneCli.Tests.Unit.Steps.NestingSteps

open TickSpec
open Xunit
open CraneCore.Logic.NestingChecker
open CraneCli.Tests.Unit.Steps.BddState

// ---- BDD shared state ----
let mutable private pdfText: string = ""
let mutable private mdText: string = ""

// ---- BDD Given steps ----

[<Given>]
let ``a PDF fixture with a single-level bullet list`` () = pdfText <- "- item one\n- item two"

[<Given>]
let ``its Markdown conversion with matching single-level nesting`` () = mdText <- "- item one\n- item two"

[<Given>]
let ``a PDF fixture where nested items appear under a parent`` () =
    // child is at level 2 in PDF (2 spaces indent)
    pdfText <- "- parent\n  - child"

[<Given>]
let ``a Markdown with those items at the wrong nesting level`` () =
    // child is at level 1 in MD (inverted: MD level < PDF level -> HIGH)
    mdText <- "- child\n- parent"

[<Given>]
let ``a PDF fixture with two-level nesting`` () = pdfText <- "- parent\n  - child"

[<Given>]
let ``a Markdown with the second level at depth three instead of two`` () =
    // child at level 3 (indent 4) instead of level 2 (indent 2)
    // MD level (3) > PDF level (2) -> not inverted -> MEDIUM
    mdText <- "- parent\n    - child"

// ---- BDD When steps ----

[<When>]
let ``I run "crane nesting check" on the pair`` () =
    RunWithWriter(fun w ->
        let findings = checkNesting pdfText mdText
        let opts = System.Text.Json.JsonSerializerOptions()
        opts.DefaultIgnoreCondition <- System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        w.WriteLine(System.Text.Json.JsonSerializer.Serialize(findings, opts))
        if findings.IsEmpty then 0 else 1)

[<When>]
let ``I run "crane nesting infer" on the PDF fixture`` () =
    RunWithWriter(fun w ->
        let items = extractNestingLevels pdfText
        let opts = System.Text.Json.JsonSerializerOptions()
        opts.DefaultIgnoreCondition <- System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        w.WriteLine(System.Text.Json.JsonSerializer.Serialize(items, opts))
        0)

// ---- BDD Then steps ----

[<Then>]
let ``the JSON output lists "([^"]*)" at nesting level (\d+)`` (text: string) (level: int) =
    let doc = System.Text.Json.JsonDocument.Parse(LastOutput)

    let found =
        doc.RootElement.EnumerateArray()
        |> Seq.tryFind (fun item -> item.GetProperty("Text").GetString() = text)

    match found with
    | Some item -> Assert.Equal(level, item.GetProperty("Level").GetInt32())
    | None -> Assert.Fail($"no nesting item named {text} in {LastOutput}")
