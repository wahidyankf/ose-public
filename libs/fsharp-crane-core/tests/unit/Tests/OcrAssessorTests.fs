module CraneCore.Tests.Unit.Tests.OcrAssessorTests

open Xunit
open CraneCore.Logic.OcrAssessor

[<Fact>]
let ``estimateOCRErrorRate returns 0 for empty text`` () =
    let result = estimateOCRErrorRate ""
    Assert.Equal(0.0, result)

[<Fact>]
let ``estimateOCRErrorRate returns high rate for mostly non-ASCII`` () =
    // Using digit filler to avoid [a-zA-Z]{30,} pattern skewing the count
    let text = System.String('é', 20) + System.String('1', 80)
    let rate = estimateOCRErrorRate text
    Assert.True(rate > 0.0)

[<Fact>]
let ``extractOCRSections returns empty for text without OCR tags`` () =
    let result = extractOCRSections "# Heading\n\nSome normal text"
    Assert.Empty(result)

[<Fact>]
let ``extractOCRSections finds OCR comment tags`` () =
    let mdText = "<!-- OCR: some text here -->"
    let result = extractOCRSections mdText
    Assert.Equal(1, result.Length)

[<Fact>]
let ``checkOCRQuality returns empty for clean OCR`` () =
    let content =
        "The quick brown fox jumps over the lazy dog. "
        |> Seq.replicate 4
        |> String.concat ""

    let mdText = sprintf "<!-- OCR: %s -->" content
    let result = checkOCRQuality mdText
    Assert.Empty(result)

[<Fact>]
// @scenario specs/libs/fsharp-crane-core/behaviours/checks/checks.feature: OCR text with a high error rate is CRITICAL
let ``checkOCRQuality returns CRITICAL for high error rate`` () =
    // 20 non-ASCII + 80 digits = 20% > 10% -> CRITICAL
    let nonAscii = System.String('é', 20)
    let digits = System.String('1', 80)
    let mdText = sprintf "<!-- OCR: %s%s -->" nonAscii digits
    let result = checkOCRQuality mdText
    Assert.NotEmpty(result)
    Assert.Equal("CRITICAL", result.[0].Criticality)

[<Fact>]
let ``checkOCRQuality returns HIGH for error rate above 5 percent`` () =
    // 7 non-ASCII + 93 digits = 7% -> HIGH (>5% but <=10%)
    let nonAscii = System.String('é', 7)
    let digits = System.String('1', 93)
    let mdText = sprintf "<!-- OCR: %s%s -->" nonAscii digits
    let result = checkOCRQuality mdText
    Assert.NotEmpty(result)
    Assert.Equal("HIGH", result.[0].Criticality)

[<Fact>]
let ``checkOCRQuality returns MEDIUM for error rate above 2 percent`` () =
    // 4 non-ASCII + 96 digits = 4% -> MEDIUM (>2% but <=5%)
    let nonAscii = System.String('é', 4)
    let digits = System.String('1', 96)
    let mdText = sprintf "<!-- OCR: %s%s -->" nonAscii digits
    let result = checkOCRQuality mdText
    Assert.NotEmpty(result)
    Assert.Equal("MEDIUM", result.[0].Criticality)

[<Fact>]
let ``checkOCRQuality returns empty for no OCR tags`` () =
    let result = checkOCRQuality "## Heading\n\nSome normal text"
    Assert.Empty(result)
