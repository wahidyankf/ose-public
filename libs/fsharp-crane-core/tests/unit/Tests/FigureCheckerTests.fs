module CraneCore.Tests.Unit.Tests.FigureCheckerTests

open Xunit
open CraneCore.Logic.FigureChecker

[<Fact>]
let ``detectFigures returns empty for text without figure references`` () =
    let result = detectFigures "some plain text"
    Assert.Empty(result)

[<Fact>]
let ``detectFigures finds Figure 1 reference`` () =
    let result = detectFigures "This document contains Figure 1"
    Assert.Equal(1, result.Length)
    Assert.Equal("1", result.[0].Number)

[<Fact>]
let ``checkFigures returns empty when figure covered by Mermaid`` () =
    let pdfText = "This document contains Figure 1"
    let mdText = "Some text\n```mermaid\ngraph TD\n A-->B\n```"
    let result = checkFigures pdfText mdText
    Assert.Empty(result)

[<Fact>]
// @scenario specs/libs/fsharp-crane-core/behaviours/checks/checks.feature: A figure with no Mermaid, placeholder, or label is a HIGH finding
let ``checkFigures returns HIGH finding when figure not covered`` () =
    let pdfText = "This document contains Figure 1"
    let mdText = "Some completely unrelated text with no figures"
    let result = checkFigures pdfText mdText
    Assert.NotEmpty(result)
    Assert.Equal("HIGH", result.[0].Criticality)

[<Fact>]
let ``checkFigures returns empty when figure covered by placeholder`` () =
    let pdfText = "This document contains Figure 1"
    let mdText = "[FIGURE 1: Architecture diagram showing components]"
    let result = checkFigures pdfText mdText
    Assert.Empty(result)

[<Fact>]
let ``checkFigures returns empty when figure covered by figure label in MD`` () =
    let pdfText = "See Figure 2 for details"
    let mdText = "Figure 2 shows the system architecture diagram"
    let result = checkFigures pdfText mdText
    Assert.Empty(result)
