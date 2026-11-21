module CraneCli.Tests.E2E.Steps.CraneCliE2eSteps

open System
open System.Diagnostics
open System.Globalization
open System.IO
open System.Text
open System.Text.Json
open TickSpec
open Xunit

type private RunResult =
    { ExitCode: int
      Stdout: string
      Stderr: string }

let private escapePdfText (text: string) =
    text.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)")

/// Writes a deterministic, dependency-free PDF with one Helvetica text stream per page.
/// The resulting bytes cross Crane's real PdfPig adapter rather than substituting a test double.
let private writePdf (path: string) (pages: string list) =
    let pageCount = pages.Length
    let objects = ResizeArray<int * string>()

    let kids =
        [ 0 .. pageCount - 1 ]
        |> List.map (fun index -> sprintf "%d 0 R" (4 + (index * 2)))

    objects.Add(1, "<< /Type /Catalog /Pages 2 0 R >>")
    objects.Add(2, sprintf "<< /Type /Pages /Kids [%s] /Count %d >>" (String.concat " " kids) pageCount)
    objects.Add(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    pages
    |> List.iteri (fun index pageText ->
        let pageObject = 4 + (index * 2)
        let contentObject = pageObject + 1

        let commands =
            pageText.Split('\n')
            |> Array.mapi (fun lineIndex line ->
                let y = 720 - (lineIndex * 18)
                sprintf "BT /F1 12 Tf 72 %d Td (%s) Tj ET" y (escapePdfText line))
            |> String.concat "\n"

        objects.Add(
            pageObject,
            sprintf
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents %d 0 R >>"
                contentObject
        )

        objects.Add(contentObject, sprintf "<< /Length %d >>\nstream\n%s\nendstream" commands.Length commands))

    use stream = new MemoryStream()
    use writer = new StreamWriter(stream, Encoding.ASCII, 1024, true)
    writer.NewLine <- "\n"
    writer.WriteLine("%PDF-1.4")
    writer.Flush()
    let offsets = ResizeArray<int64>()
    offsets.Add 0L

    for number, body in objects do
        offsets.Add stream.Position
        writer.WriteLine(sprintf "%d 0 obj" number)
        writer.WriteLine(body)
        writer.WriteLine("endobj")
        writer.Flush()

    let xref = stream.Position
    writer.WriteLine("xref")
    writer.WriteLine(sprintf "0 %d" (objects.Count + 1))
    writer.WriteLine("0000000000 65535 f ")

    offsets
    |> Seq.skip 1
    |> Seq.iter (fun offset -> writer.WriteLine(sprintf "%010d 00000 n " offset))

    writer.WriteLine("trailer")
    writer.WriteLine(sprintf "<< /Size %d /Root 1 0 R >>" (objects.Count + 1))
    writer.WriteLine("startxref")
    writer.WriteLine(xref.ToString(CultureInfo.InvariantCulture))
    writer.WriteLine("%%EOF")
    writer.Flush()
    File.WriteAllBytes(path, stream.ToArray())

let private executablePath =
    match Environment.GetEnvironmentVariable("CRANE_E2E_BINARY") with
    | null ->
        let suffix = if OperatingSystem.IsWindows() then ".exe" else ""
        Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "../../../dist/crane" + suffix))
    | path -> path

type CraneCliE2eSteps() =
    let workDir =
        Path.Combine(Path.GetTempPath(), "crane-cli-e2e-" + Guid.NewGuid().ToString("N"))

    let pdfPath = Path.Combine(workDir, "fixture.pdf")
    let mdPath = Path.Combine(workDir, "fixture.md")
    let skiplistPath = Path.Combine(workDir, "skiplist.md")
    let mutable knownPageCount = 1
    let mutable exitCode = -1
    let mutable stdoutText = ""
    let mutable stderrText = ""
    let mutable currentScope = "pdf-to-md"
    let mutable lastReportPath = ""

    do Directory.CreateDirectory(workDir) |> ignore

    let writeMarkdown (content: string) = File.WriteAllText(mdPath, content)
    let writePdfText content = writePdf pdfPath [ content ]

    let writePdfLinesAsPages (content: string) =
        writePdf pdfPath (content.Split('\n') |> Array.toList)

    let run args =
        if not (File.Exists executablePath) then
            failwithf "the built Crane executable does not exist: %s" executablePath

        let startInfo =
            ProcessStartInfo(
                FileName = executablePath,
                WorkingDirectory = workDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false
            )

        args |> List.iter startInfo.ArgumentList.Add
        startInfo.Environment.["CRANE_SKIPLIST_PATH"] <- skiplistPath
        use childProcess = Process.Start startInfo
        stdoutText <- childProcess.StandardOutput.ReadToEnd().Trim()
        stderrText <- childProcess.StandardError.ReadToEnd().Trim()
        childProcess.WaitForExit()
        exitCode <- childProcess.ExitCode

    let json () = JsonDocument.Parse(stdoutText)

    let firstFinding () =
        let document = json ()
        Assert.Equal(JsonValueKind.Array, document.RootElement.ValueKind)
        Assert.True(document.RootElement.GetArrayLength() > 0, stdoutText + stderrText)
        document.RootElement.EnumerateArray() |> Seq.head

    let table cols dataRows =
        let header =
            [ 1..cols ]
            |> List.map (sprintf " Col%d ")
            |> String.concat "|"
            |> sprintf "|%s|"

        let separator =
            [ 1..cols ] |> List.map (fun _ -> "---|") |> String.concat "" |> sprintf "|%s"

        let row =
            [ 1..cols ]
            |> List.map (sprintf " val%d ")
            |> String.concat "|"
            |> sprintf "|%s|"

        header :: separator :: List.replicate dataRows row |> String.concat "\n"

    [<Given>]
    member _.``a PDF fixture and its complete Markdown pair``() =
        let text = "Hello world this is section one content here and more text"
        writePdfText text
        writeMarkdown text

    [<Given>]
    member _.``a PDF fixture and a Markdown missing one section``() =
        writePdfText "Missing section here"
        writeMarkdown "completely different content with no overlap at all"

    [<Given>]
    member _.``a PDF with multiple consecutive spaces and its normalized Markdown``() =
        writePdfText "hello   world   text   content"
        writeMarkdown "hello world text content"

    [<Given>]
    member _.``a PDF with "Organisation" and a Markdown with "Organization"``() =
        writePdfText "Organisation"
        writeMarkdown "Organization"

    [<When>]
    member _.``I run "crane text check" on the pair``() =
        run [ "text"; "--check"; pdfPath; mdPath ]

    [<Given>]
    member _.``a PDF fixture where heading "([^"]*)" implies depth (\d+)``(heading: string, _depth: int) =
        writePdfText heading

    [<Given>]
    member _.``the Markdown has that heading at depth (\d+)``(depth: int) =
        writeMarkdown (sprintf "%s Title" (String('#', depth)))

    [<Given>]
    member _.``the text "([^"]*)"``(text: string) = writePdfText text

    [<When>]
    member _.``I run "crane heading check" on the pair``() =
        run [ "heading"; "--check"; pdfPath; mdPath ]

    [<When>]
    member _.``I run "crane heading infer" on that text``() = run [ "heading"; "--infer"; pdfPath ]

    [<Given>]
    member _.``a PDF fixture with a single-level bullet list``() =
        writePdfLinesAsPages "- item one\n- item two"

    [<Given>]
    member _.``its Markdown conversion with matching single-level nesting``() = writeMarkdown "- item one\n- item two"

    [<Given>]
    member _.``a PDF fixture where nested items appear under a parent``() =
        writePdfLinesAsPages "- parent\n  - child"

    [<Given>]
    member _.``a Markdown with those items at the wrong nesting level``() = writeMarkdown "- child\n- parent"

    [<Given>]
    member _.``a PDF fixture with two-level nesting``() =
        writePdfLinesAsPages "- parent\n  - child"

    [<Given>]
    member _.``a Markdown with the second level at depth three instead of two``() =
        writeMarkdown "- parent\n    - child"

    [<When>]
    member _.``I run "crane nesting check" on the pair``() =
        run [ "nesting"; "--check"; pdfPath; mdPath ]

    [<Given>]
    member _.``a PDF fixture referencing "Figure (\d+)"``(number: string) =
        writePdfText (sprintf "This document contains Figure %s" number)

    [<Given>]
    member _.``its Markdown with a Mermaid code block near that reference``() =
        writeMarkdown "Some text\n```mermaid\ngraph TD\n A-->B\n```"

    [<Given>]
    member _.``its Markdown with a "\[FIGURE (\d+): \.\.\.\]" placeholder``(number: string) =
        writeMarkdown (sprintf "[FIGURE %s: description of the figure]" number)

    [<Given>]
    member _.``a Markdown with no Mermaid block or placeholder for Figure (\d+)``(_number: string) =
        writeMarkdown "Some completely unrelated text with no figures"

    [<When>]
    member _.``I run "crane figure check" on the pair``() =
        run [ "figure"; "--check"; pdfPath; mdPath ]

    [<Given>]
    member _.``a Markdown fixture with a syntactically valid "([^"]*)" block``(blockType: string) =
        writeMarkdown (sprintf "```mermaid\n%s\n A-->B\n```" blockType)

    [<Given>]
    member _.``a Markdown fixture with a Mermaid block starting with "([^"]*)"``(keyword: string) =
        writeMarkdown (sprintf "```mermaid\n%s content\n```" keyword)

    [<Given>]
    member _.``a Markdown fixture with a Mermaid block containing unbalanced "\["``() =
        writeMarkdown "```mermaid\ngraph TD\n A[ unclosed\n```"

    [<When>]
    member _.``I run "crane mermaid validate" on the fixture``() = run [ "mermaid"; "--validate"; mdPath ]

    [<Given>]
    member _.``a Markdown fixture with an OCR-tagged section at 15% estimated error rate``() =
        writeMarkdown (sprintf "<!-- OCR: %s%s -->" (String('é', 20)) (String('a', 80)))

    [<Given>]
    member _.``a Markdown fixture with an OCR-tagged section at 1% estimated error rate``() =
        writeMarkdown (
            sprintf
                "<!-- OCR: %s -->"
                (String.concat "" (Seq.replicate 4 "The quick brown fox jumps over the lazy dog. "))
        )

    [<Given>]
    member _.``a Markdown fixture with no OCR page tags``() =
        writeMarkdown "# Heading\n\nSome normal markdown text with no OCR tags."

    [<When>]
    member _.``I run "crane ocr quality" on the fixture``() = run [ "ocr"; "--quality"; mdPath ]

    [<Given>]
    member _.``a PDF fixture with a 3-column table``() = writePdfLinesAsPages (table 3 1)

    [<Given>]
    member _.``its Markdown conversion with a matching 3-column table``() = writeMarkdown (table 3 1)

    [<Given>]
    member _.``a PDF fixture with a table``() = writePdfLinesAsPages (table 3 1)

    [<Given>]
    member _.``a Markdown missing that table entirely``() =
        writeMarkdown "No table here, just prose."

    [<Given>]
    member _.``a PDF fixture with a 5-row table``() = writePdfLinesAsPages (table 3 5)

    [<Given>]
    member _.``a Markdown with a matching header but only 3 rows``() = writeMarkdown (table 3 3)

    [<Given>]
    member _.``layout text containing a 3-column columnar table``() = writePdfLinesAsPages (table 3 1)

    [<When>]
    member _.``I run "crane table check" on the pair``() =
        run [ "table"; "--check"; pdfPath; mdPath ]

    [<When>]
    member _.``I run "crane table detect" on the text``() = run [ "table"; "--detect"; pdfPath ]

    [<Given>]
    member _.``a text-based PDF fixture with a known page count``() =
        knownPageCount <- 3

        writePdf
            pdfPath
            [ "Page one has enough text words to be recognised as a text document"
              "Page two"
              "Page three" ]

    [<Given>]
    member _.``a text-based PDF fixture exists``() =
        writePdfText "Sample text content with many words for testing purposes and more content here"

    [<Given>]
    member _.``an image-only PDF fixture exists``() = writePdfText ""

    [<When>]
    member _.``I run "crane pdf info" on the fixture``() = run [ "pdf"; "--info"; pdfPath ]

    [<When>]
    member _.``I run "crane pdf type" on the fixture``() = run [ "pdf"; "--type"; pdfPath ]

    [<Given>]
    member _.``no existing chain file for scope "([^"]*)"``(scope: string) = currentScope <- scope

    [<Given>]
    member _.``a chain file for "([^"]*)" created (\d+) seconds ago with UUID "([^"]*)"``
        (scope: string, seconds: int, uuid: string)
        =
        currentScope <- scope

        let chainFile =
            Path.Combine(workDir, "local-tmp", sprintf ".execution-chain-%s" scope)

        Directory.CreateDirectory(Path.GetDirectoryName chainFile) |> ignore
        let timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - int64 seconds
        File.WriteAllText(chainFile, sprintf "%d %s" timestamp uuid)

    [<When>]
    member _.``I run "crane report init" with scope "([^"]*)"``(scope: string) =
        run [ "report"; "--init"; scope; pdfPath; mdPath ]
        use document = json ()
        lastReportPath <- document.RootElement.GetProperty("path").GetString()

    [<Given>]
    member _.``no existing skip list for "([^"]*)"``(_md: string) =
        if File.Exists(skiplistPath) then
            File.Delete(skiplistPath)

        Assert.False(File.Exists(skiplistPath))

    [<Given>]
    member _.``a skip list for "([^"]*)" already containing the entry for text-completeness "([^"]*)"``
        (md: string, description: string)
        =
        run [ "skiplist"; "--add"; md; "text-completeness"; description ]

    [<Given>]
    member _.``a skip list containing "([^|]*)\| ([^|]*)\| ([^"]*)"``
        (category: string, md: string, description: string)
        =
        run [ "skiplist"; "--add"; md.Trim(); category.Trim(); description.Trim() ]

    [<When>]
    member _.``I run "crane skiplist add nist-sp-800-53 text-completeness '([^']*)'"``(description: string) =
        run [ "skiplist"; "--add"; "nist-sp-800-53"; "text-completeness"; description ]

    [<When>]
    member _.``I run "crane skiplist add" with the same arguments``() =
        run
            [ "skiplist"
              "--add"
              "nist-sp-800-53"
              "text-completeness"
              "Page header on p.3" ]

    [<When>]
    member _.``I run "crane skiplist check nist-sp-800-53 mermaid-syntax '([^']*)'"``(description: string) =
        run [ "skiplist"; "--check"; "nist-sp-800-53"; "mermaid-syntax"; description ]

    [<When>]
    member _.``I run "crane skiplist check nist-sp-800-53 text-completeness '([^']*)'"``(description: string) =
        run [ "skiplist"; "--check"; "nist-sp-800-53"; "text-completeness"; description ]

    [<Given>]
    member _.``a PDF fixture and an MD that matches across all dimensions``() =
        let body =
            "Hello world section content. This document covers introduction, scope, and requirements. Each section is fully present and accurately transcribed."

        writePdfText body
        writeMarkdown ("# Title\n\n" + body + "\n")

    [<Given>]
    member _.``a PDF fixture and an MD missing content``() =
        writePdfText
            "Critical missing section content goes here. Important paragraph that the MD lacks entirely. Another full passage that must not be dropped."

        writeMarkdown "# Title\n\nUnrelated short text.\n"

    [<When>]
    member _.``I run "crane check-all" on the pair``() = run [ "check-all"; pdfPath; mdPath ]

    [<When>]
    member _.``I run "crane --version"``() = run [ "--version" ]

    [<Then>]
    member _.``the JSON output is an empty array``() =
        use document = json ()
        Assert.Equal(JsonValueKind.Array, document.RootElement.ValueKind)
        Assert.Equal(0, document.RootElement.GetArrayLength())

    [<Then>]
    member _.``the JSON output contains a finding``() = firstFinding () |> ignore

    [<Then>]
    member _.``every finding names its category``() =
        use document = json ()
        Assert.True(document.RootElement.GetArrayLength() > 0)

        for finding in document.RootElement.EnumerateArray() do
            Assert.False(String.IsNullOrWhiteSpace(finding.GetProperty("category").GetString()))

    [<Then>]
    member _.``a finding with criticality "([^"]*)" is returned``(expected: string) =
        Assert.Equal(expected, firstFinding().GetProperty("criticality").GetString())

    [<Then>]
    member _.``a finding with criticality "([^"]*)" and category "([^"]*)" is returned``
        (criticality: string, category: string)
        =
        let finding = firstFinding ()
        Assert.Equal(criticality, finding.GetProperty("criticality").GetString())
        Assert.Equal(category, finding.GetProperty("category").GetString())

    [<Then>]
    member _.``the finding criticality is "([^"]*)"``(expected: string) =
        Assert.Equal(expected, firstFinding().GetProperty("criticality").GetString())

    [<Then>]
    member _.``the finding category is "([^"]*)"``(expected: string) =
        Assert.Equal(expected, firstFinding().GetProperty("category").GetString())

    [<Then>]
    member _.``the finding states expected_depth (\d+) and found_depth (\d+)``(expectedDepth: int, foundDepth: int) =
        let description = firstFinding().GetProperty("description").GetString()
        Assert.Contains(sprintf "H%d" expectedDepth, description)
        Assert.Contains(sprintf "H%d" foundDepth, description)

    [<Then>]
    member _.``the JSON output shows depth (\d+) and confidence "([^"]*)"``(depth: int, confidence: string) =
        use document = json ()
        Assert.Equal(depth, document.RootElement.GetProperty("depth").GetInt32())
        Assert.Equal(confidence, document.RootElement.GetProperty("confidence").GetString())

    [<Then>]
    member _.``the finding description mentions "([^"]*)"``(keyword: string) =
        Assert.Contains(keyword, firstFinding().GetProperty("description").GetString())

    [<Then>]
    member _.``the finding includes the OCR page number``() =
        Assert.NotEmpty(firstFinding().GetProperty("location_md").GetString())

    [<Then>]
    member _.``the JSON output lists one table with col_count (\d+)``(expected: int) =
        use document = json ()
        Assert.Equal(1, document.RootElement.GetArrayLength())
        Assert.Equal(expected, (document.RootElement.EnumerateArray() |> Seq.head).GetProperty("ColCount").GetInt32())

    [<Then>]
    member _.``the JSON output is valid``() = use _document = json () in ()

    [<Then>]
    member _.``the JSON field "pages" matches the known page count``() =
        use document = json ()
        Assert.Equal(knownPageCount, document.RootElement.GetProperty("pages").GetInt32())

    [<Then>]
    member _.``the JSON field "size_bytes" is greater than 0``() =
        use document = json ()
        Assert.True(document.RootElement.GetProperty("size_bytes").GetInt64() > 0L)

    [<Then>]
    member _.``the JSON output contains type "([^"]*)"``(expected: string) =
        use document = json ()
        Assert.Equal(expected, document.RootElement.GetProperty("type").GetString())

    [<Then>]
    member _.``the exit code is (\d+)``(expected: int) = Assert.Equal(expected, exitCode)

    [<Then>]
    member _.``no CRITICAL or HIGH finding is raised for that word``() =
        use document = json ()

        let blocked =
            document.RootElement.EnumerateArray()
            |> Seq.exists (fun finding ->
                let value = finding.GetProperty("criticality").GetString()
                value = "CRITICAL" || value = "HIGH")

        Assert.False(blocked)

    [<Then>]
    member _.``a report file is created in "([^"]*)"``(directory: string) =
        Assert.True(File.Exists(Path.Combine(workDir, lastReportPath)))
        Assert.StartsWith(directory, lastReportPath)

    [<Then>]
    member _.``the filename matches the pattern "([^"]*)"``(_pattern: string) =
        let filename = Path.GetFileName(lastReportPath)

        Assert.Matches(
            sprintf "^%s__[0-9a-f]{6}__[0-9]{4}-[0-9]{2}-[0-9]{2}--[0-9]{2}-[0-9]{2}__audit\\.md$" currentScope,
            filename
        )

    [<Then>]
    member _.``the JSON output contains the report path``() = Assert.NotEmpty(lastReportPath)

    [<Then>]
    member _.``the report filename contains "([^"]*)" followed by a new 6-hex UUID``(prefix: string) =
        Assert.Matches(sprintf "^%s__%s[0-9a-f]{6}__" currentScope prefix, Path.GetFileName(lastReportPath))

    [<Then>]
    member _.``the report filename contains only the new 6-hex UUID .no "([^"]*)".``(uuid: string) =
        Assert.DoesNotContain(uuid, Path.GetFileName(lastReportPath))

    [<Then>]
    member _.``the skip list file is created``() = Assert.True(File.Exists(skiplistPath))

    [<Then>]
    member _.``it contains one entry with category "([^"]*)"``(category: string) =
        Assert.Contains(sprintf "## FALSE_POSITIVE: %s |" category, File.ReadAllText(skiplistPath))

    [<Then>]
    member _.``the skip list file contains exactly one matching entry``() =
        let occurrences =
            File.ReadAllText(skiplistPath).Split("## FALSE_POSITIVE:").Length - 1

        Assert.Equal(1, occurrences)

    [<Then>]
    member _.``the JSON output contains match true``() =
        use document = json ()
        Assert.True(document.RootElement.GetProperty("match").GetBoolean())

    [<Then>]
    member _.``the JSON output contains match false``() =
        use document = json ()
        Assert.False(document.RootElement.GetProperty("match").GetBoolean())

    [<Then>]
    member _.``the version string matches a SemVer-shaped pattern``() =
        Assert.Matches(@"^\d+\.\d+\.\d+(\.\d+)?$", stdoutText)

    [<Given>]
    member _.``a PDF whose page text is "([^"]*)"``(text: string) = writePdfText text

    [<Given>]
    member _.``a PDF path that cannot be read``() = ()

    [<Given>]
    member _.``a Markdown document containing "([^"]*)"``(text: string) = writeMarkdown text

    [<When>]
    member _.``I run "crane pdf extract" for pages (\d+) to (\d+)``(first: int, last: int) =
        run [ "pdf"; "-e"; pdfPath; "-s"; string first; "-n"; string last ]

    [<When>]
    member _.``I run "crane text search" for "([^"]*)"``(segment: string) =
        run [ "text"; "--search"; mdPath; segment ]

    [<When>]
    member _.``I run the unknown command "([^"]*)"``(commandLine: string) =
        run (commandLine.Split(' ') |> Array.skip 1 |> Array.toList)

    [<Then>]
    member _.``standard output is "([^"]*)"``(expected: string) = Assert.Equal(expected, stdoutText)

    [<Then>]
    member _.``standard output contains "([^"]*)"``(expected: string) = Assert.Contains(expected, stdoutText)

    [<Then>]
    member _.``standard error starts with "([^"]*)"``(expected: string) = Assert.StartsWith(expected, stderrText)

    [<Then>]
    member _.``the JSON output contains found (true|false)``(expected: string) =
        use document = json ()
        Assert.Equal(Boolean.Parse expected, document.RootElement.GetProperty("found").GetBoolean())

    [<Then>]
    member _.``the JSON output contains a similarity score``() =
        use document = json ()
        Assert.InRange(document.RootElement.GetProperty("similarity").GetDouble(), 0.0, 1.0)

    interface IDisposable with
        member _.Dispose() =
            if Directory.Exists workDir then
                Directory.Delete(workDir, true)
