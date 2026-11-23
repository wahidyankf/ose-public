module CraneCli.Tests.Unit.Steps.MermaidSteps

open TickSpec
open Xunit
open CraneCore.Logic.MermaidValidator
open CraneCli.Tests.Unit.Steps.BddState

// ---- BDD shared state ----
let mutable private mdFixture: string = ""

// ---- BDD Given steps ----

[<Given>]
let ``a Markdown fixture with a syntactically valid "([^"]*)" block`` (blockType: string) =
    mdFixture <- sprintf "```mermaid\n%s\n A-->B\n```" blockType

[<Given>]
let ``a Markdown fixture with a Mermaid block starting with "([^"]*)"`` (keyword: string) =
    mdFixture <- sprintf "```mermaid\n%s content\n```" keyword

[<Given>]
let ``a Markdown fixture with a Mermaid block containing unbalanced "\["`` () =
    mdFixture <- "```mermaid\ngraph TD\n A[ unclosed\n```"

// ---- BDD When steps ----

[<When>]
let ``I run "crane mermaid validate" on the fixture`` () =
    RunWithWriter(fun w ->
        let findings = validateMd mdFixture
        let opts = System.Text.Json.JsonSerializerOptions()
        opts.DefaultIgnoreCondition <- System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        w.WriteLine(System.Text.Json.JsonSerializer.Serialize(findings, opts))
        if findings.IsEmpty then 0 else 1)

// ---- BDD Then steps ----

[<Then>]
let ``the finding description mentions "([^"]*)"`` (keyword: string) =
    let doc = System.Text.Json.JsonDocument.Parse(LastOutput)
    let first = doc.RootElement.EnumerateArray() |> Seq.head
    Assert.Contains(keyword, first.GetProperty("description").GetString())

[<Then>]
let ``a finding with criticality "([^"]*)" and category "([^"]*)" is returned`` (crit: string) (cat: string) =
    let doc = System.Text.Json.JsonDocument.Parse(LastOutput)
    Assert.True(doc.RootElement.GetArrayLength() > 0)
    let first = doc.RootElement.EnumerateArray() |> Seq.head
    Assert.Equal(crit, first.GetProperty("criticality").GetString())
    Assert.Equal(cat, first.GetProperty("category").GetString())
