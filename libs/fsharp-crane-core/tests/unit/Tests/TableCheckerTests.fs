module CraneCore.Tests.Unit.Tests.TableCheckerTests

open Xunit
open CraneCore.Logic.TableChecker

let private makeTable (cols: int) (dataRows: int) =
    let header =
        [ 1..cols ] |> List.map (fun i -> sprintf " Col%d " i) |> String.concat "|"

    let headerRow = sprintf "|%s|" header

    let separator =
        [ 1..cols ] |> List.map (fun _ -> "---|") |> String.concat "" |> sprintf "|%s"

    let dataRow =
        [ 1..cols ]
        |> List.map (fun i -> sprintf " val%d " i)
        |> String.concat "|"
        |> sprintf "|%s|"

    let rows = [ 0 .. dataRows - 1 ] |> List.map (fun _ -> dataRow)
    (headerRow :: separator :: rows) |> String.concat "\n"

[<Fact>]
let ``detectTables returns empty for plain text`` () =
    let result = detectTables "plain text no tables"
    Assert.Empty(result)

[<Fact>]
let ``detectTables detects 3-column table`` () =
    let text = makeTable 3 1
    let result = detectTables text
    Assert.Equal(1, result.Length)
    Assert.Equal(3, result.[0].ColCount)

[<Fact>]
let ``checkTables returns empty for matching tables`` () =
    let pdfText = makeTable 3 1
    let mdText = makeTable 3 1
    let result = checkTables pdfText mdText
    Assert.Empty(result)

[<Fact>]
// @scenario specs/libs/fsharp-crane-core/behaviours/checks/checks.feature: A table missing from the Markdown is CRITICAL
let ``checkTables returns CRITICAL finding for missing table`` () =
    let pdfText = makeTable 3 1
    let mdText = "No table here"
    let result = checkTables pdfText mdText
    Assert.NotEmpty(result)
    Assert.Equal("CRITICAL", result.[0].Criticality)

[<Fact>]
let ``checkTables returns MEDIUM finding for row count mismatch`` () =
    let pdfText = makeTable 3 3
    let mdText = makeTable 3 1
    let result = checkTables pdfText mdText
    Assert.NotEmpty(result)
    Assert.Equal("MEDIUM", result.[0].Criticality)
    Assert.Equal("table-integrity", result.[0].Category)

[<Fact>]
let ``detectTables skips a header candidate whose next line is not a separator`` () =
    let text = "| a | b |\nnot a separator\n| x | y |\n---\n| 1 | 2 |"
    let result = detectTables text
    Assert.Single(result) |> ignore
    Assert.Equal("| x | y |", (List.head result).HeaderRow)
