module CraneCore.Tests.Unit.Tests.HeadingCheckerTests

open Xunit
open CraneCore.Logic.HeadingChecker

[<Fact>]
let ``inferDepthFromNumbering returns None for non-numbered line`` () =
    let result = inferDepthFromNumbering "Introduction"
    Assert.Equal(None, result)

[<Fact>]
let ``inferDepthFromNumbering returns depth 2 for top-level numbered section`` () =
    let result = inferDepthFromNumbering "1. Introduction"
    Assert.Equal(Some(2, "HIGH"), result)

[<Fact>]
let ``inferDepthFromNumbering returns depth 3 for second-level`` () =
    let result = inferDepthFromNumbering "1.1 Overview"
    Assert.Equal(Some(3, "HIGH"), result)

[<Fact>]
let ``extractMdHeadings returns empty list for text without headings`` () =
    let result = extractMdHeadings "some plain text\nno headings here"
    Assert.Empty(result)

[<Fact>]
let ``extractMdHeadings extracts H2 heading`` () =
    let result = extractMdHeadings "## Section Title"
    Assert.Equal(1, result.Length)
    Assert.Equal(2, result.[0].Depth)

[<Fact>]
let ``checkHeadings returns empty for matching headings`` () =
    let pdfText = "1. Introduction"
    let mdText = "## Introduction"
    let result = checkHeadings pdfText mdText
    Assert.Empty(result)

[<Fact>]
let ``checkHeadings skips plain text lines in pdfText`` () =
    let pdfText = "Some plain text line\n1. Introduction"
    let mdText = "## Introduction"
    let result = checkHeadings pdfText mdText
    Assert.Empty(result)

[<Fact>]
// @scenario specs/libs/fsharp-crane-core/behaviours/checks/checks.feature: A heading whose depth differs from the PDF is a HIGH finding
let ``checkHeadings returns HIGH finding for depth mismatch`` () =
    let pdfText = "1. Introduction"
    let mdText = "### Introduction"
    let result = checkHeadings pdfText mdText
    Assert.NotEmpty(result)
    Assert.Equal("heading-depth", result.[0].Category)
    Assert.Equal("HIGH", result.[0].Criticality)

[<Fact>]
let ``checkHeadings returns None when heading not found in md`` () =
    let pdfText = "1. Introduction"
    let mdText = "## Completely Different Topic"
    let result = checkHeadings pdfText mdText
    Assert.Empty(result)
