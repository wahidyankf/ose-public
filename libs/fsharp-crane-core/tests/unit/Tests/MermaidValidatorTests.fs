module CraneCore.Tests.Unit.Tests.MermaidValidatorTests

open Xunit
open CraneCore.Logic.MermaidValidator

[<Fact>]
let ``validateBlock returns Ok for valid graph block`` () =
    let result = validateBlock "graph TD\n A-->B\n"
    Assert.Equal(Ok(), result)

[<Fact>]
let ``validateBlock returns Error for empty block`` () =
    match validateBlock "" with
    | Error _ -> ()
    | Ok() -> Assert.Fail("expected error")

[<Fact>]
let ``validateBlock returns Error for unknown diagram type`` () =
    match validateBlock "unknownType\n A-->B\n" with
    | Error msg -> Assert.Contains("unknown diagram type", msg)
    | Ok() -> Assert.Fail("expected error")

[<Fact>]
let ``validateBlock returns Error for unmatched brackets`` () =
    match validateBlock "graph TD\n A[ unclosed\n" with
    | Error msg -> Assert.Contains("unmatched brackets", msg)
    | Ok() -> Assert.Fail("expected error")

[<Fact>]
let ``extractBlocks returns empty for text without mermaid`` () =
    let result = extractBlocks "# Heading\n\nSome text"
    Assert.Empty(result)

[<Fact>]
let ``extractBlocks finds mermaid block`` () =
    let mdText = "```mermaid\ngraph TD\n A-->B\n```"
    let result = extractBlocks mdText
    Assert.Equal(1, result.Length)

[<Fact>]
let ``validateMd returns empty for valid mermaid`` () =
    let mdText = "```mermaid\ngraph TD\n A-->B\n```"
    let result = validateMd mdText
    Assert.Empty(result)

[<Fact>]
// @scenario specs/libs/fsharp-crane-core/behaviours/checks/checks.feature: An invalid Mermaid block is reported as a finding
let ``validateMd returns finding for invalid mermaid`` () =
    let mdText = "```mermaid\nunknownType\n A-->B\n```"
    let result = validateMd mdText
    Assert.NotEmpty(result)

[<Fact>]
let ``validateBlock returns Error for unmatched parentheses`` () =
    match validateBlock "graph TD\n A(unclosed\n" with
    | Error msg -> Assert.Contains("unmatched parentheses", msg)
    | Ok() -> Assert.Fail("expected error for unmatched parentheses")
