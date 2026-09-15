module CraneCli.Adapters.In.CliAdapter

open System
open System.IO
open System.Text.Json
open System.Text.Json.Serialization
open Argu
open CraneCore.Ports
open CraneCore.Logic

let private jsonOptions =
    let opts = JsonSerializerOptions()
    opts.WriteIndented <- false
    opts.DefaultIgnoreCondition <- JsonIgnoreCondition.WhenWritingNull
    opts

let private outputJson (writer: TextWriter) value =
    writer.WriteLine(JsonSerializer.Serialize(value, jsonOptions))

// ---- Argument types ----

type PdfArgs =
    | [<AltCommandLine("-f")>] Info of pdf: string
    | [<AltCommandLine("-t")>] Type of pdf: string
    | [<AltCommandLine("-e")>] Extract of pdf: string
    | [<AltCommandLine("-s")>] Start_Page of int
    | [<AltCommandLine("-n")>] End_Page of int
    | [<AltCommandLine("-o")>] Output of string

    interface IArgParserTemplate with
        member a.Usage =
            match a with
            | Info _ -> "Get PDF metadata as JSON"
            | Type _ -> "Detect if PDF is text-based or image-based"
            | Extract _ -> "Extract text from PDF pages"
            | Start_Page _ -> "Start page (default 1)"
            | End_Page _ -> "End page (default: last page)"
            | Output _ -> "Output file path (default: stdout)"

type TextArgs =
    | Check of pdf: string * md: string
    | Search of md: string * segment: string

    interface IArgParserTemplate with
        member a.Usage =
            match a with
            | Check _ -> "Check text completeness between PDF and MD"
            | Search _ -> "Search for a segment in MD"

type HeadingArgs =
    | Infer of pdf: string
    | Check of pdf: string * md: string

    interface IArgParserTemplate with
        member a.Usage =
            match a with
            | Infer _ -> "Infer heading depth from PDF numbering"
            | Check _ -> "Check heading consistency between PDF and MD"

type NestingArgs =
    | Infer of pdf: string
    | Check of pdf: string * md: string

    interface IArgParserTemplate with
        member a.Usage =
            match a with
            | Infer _ -> "Infer nesting levels from PDF"
            | Check _ -> "Check nesting consistency"

type TableArgs =
    | Detect of pdf: string
    | Check of pdf: string * md: string

    interface IArgParserTemplate with
        member a.Usage =
            match a with
            | Detect _ -> "Detect tables in PDF"
            | Check _ -> "Check table integrity"

type FigureArgs =
    | Detect of pdf: string
    | Check of pdf: string * md: string

    interface IArgParserTemplate with
        member a.Usage =
            match a with
            | Detect _ -> "Detect figures in PDF"
            | Check _ -> "Check figure coverage"

type MermaidArgs =
    | Validate of md: string

    interface IArgParserTemplate with
        member a.Usage =
            match a with
            | Validate _ -> "Validate Mermaid diagram syntax in MD"

type OcrArgs =
    | Quality of md: string
    | Extract of pdf: string

    interface IArgParserTemplate with
        member a.Usage =
            match a with
            | Quality _ -> "Assess OCR quality in MD"
            | Extract _ -> "Extract OCR sections from PDF"

type ReportArgs =
    | Init of scope: string * pdf: string * md: string
    | Finalize of report: string * status: string

    interface IArgParserTemplate with
        member a.Usage =
            match a with
            | Init _ -> "Initialize a new audit report"
            | Finalize _ -> "Finalize an audit report with status"

type SkiplistArgs =
    | Add of md: string * category: string * description: string
    | Check of md: string * category: string * description: string
    | List of md: string

    interface IArgParserTemplate with
        member a.Usage =
            match a with
            | Add _ -> "Add entry to skip list"
            | Check _ -> "Check if entry is in skip list"
            | List _ -> "List all skip list entries"

type CheckAllArgs =
    | [<MainCommand; ExactlyOnce; Last>] Pair of pdf: string * md: string
    | [<AltCommandLine("-c")>] Cache_Dir of dir: string

    interface IArgParserTemplate with
        member a.Usage =
            match a with
            | Pair _ -> "PDF and MD pair to check across all dimensions"
            | Cache_Dir _ -> "Directory to cache PDF extractions, keyed by SHA256(pdf-bytes)"

type CraneArgs =
    | [<CliPrefix(CliPrefix.None)>] Pdf of ParseResults<PdfArgs>
    | [<CliPrefix(CliPrefix.None)>] Text of ParseResults<TextArgs>
    | [<CliPrefix(CliPrefix.None)>] Heading of ParseResults<HeadingArgs>
    | [<CliPrefix(CliPrefix.None)>] Nesting of ParseResults<NestingArgs>
    | [<CliPrefix(CliPrefix.None)>] Table of ParseResults<TableArgs>
    | [<CliPrefix(CliPrefix.None)>] Figure of ParseResults<FigureArgs>
    | [<CliPrefix(CliPrefix.None)>] Mermaid of ParseResults<MermaidArgs>
    | [<CliPrefix(CliPrefix.None)>] Ocr of ParseResults<OcrArgs>
    | [<CliPrefix(CliPrefix.None)>] Report of ParseResults<ReportArgs>
    | [<CliPrefix(CliPrefix.None)>] Skiplist of ParseResults<SkiplistArgs>
    | [<CliPrefix(CliPrefix.None); CustomCommandLine("check-all")>] Check_All of ParseResults<CheckAllArgs>

    interface IArgParserTemplate with
        member a.Usage =
            match a with
            | Pdf _ -> "PDF operations (info, type, extract)"
            | Text _ -> "Text completeness checking"
            | Heading _ -> "Heading depth inference and checking"
            | Nesting _ -> "List nesting analysis"
            | Table _ -> "Table detection and checking"
            | Figure _ -> "Figure coverage checking"
            | Mermaid _ -> "Mermaid diagram validation"
            | Ocr _ -> "OCR quality assessment"
            | Report _ -> "Audit report management"
            | Skiplist _ -> "Skip list management"
            | Check_All _ -> "Run all check dimensions in one pass"

// ---- Command handlers ----

let private runPdfInfo (adapter: IPdfPort) (writer: TextWriter) (path: string) =
    match adapter.GetMetadata(path) with
    | Ok meta ->
        outputJson writer meta
        0
    | Error msg ->
        eprintfn "Error: %s" msg
        1

let private runPdfType (adapter: IPdfPort) (writer: TextWriter) (path: string) =
    match adapter.SampleText(path, 3) with
    | Ok text ->
        let wordCount =
            text.Split([| ' '; '\n'; '\t' |], StringSplitOptions.RemoveEmptyEntries).Length

        let docType = if wordCount > 10 then "text" else "image"
        outputJson writer {| ``type`` = docType |}
        if docType = "text" then 0 else 1
    | Error msg ->
        eprintfn "Error: %s" msg
        1

let private runPdfExtract
    (adapter: IPdfPort)
    (writer: TextWriter)
    (path: string)
    (startPage: int)
    (endPage: int)
    (output: string option)
    =
    match adapter.ExtractPages(path, startPage, endPage) with
    | Ok text ->
        match output with
        | Some outPath -> File.WriteAllText(outPath, text)
        | None -> writer.WriteLine(text)

        0
    | Error msg ->
        eprintfn "Error: %s" msg
        1

let private runTextCheck (adapter: IPdfPort) (pdfPath: string) (mdText: string) (output: TextWriter) =
    match adapter.SampleText(pdfPath, 999) with
    | Ok pdfText ->
        let chunks =
            pdfText.Split([| '\n' |], StringSplitOptions.RemoveEmptyEntries)
            |> Array.filter (fun s -> s.Trim().Length > 10)
            |> Array.toList

        let findings = TextChecker.checkText chunks mdText
        output.WriteLine(JsonSerializer.Serialize(findings, jsonOptions))
        if findings.IsEmpty then 0 else 1
    | Error msg ->
        eprintfn "Error: %s" msg
        1

let private runTextSearch (mdText: string) (segment: string) (output: TextWriter) =
    let found = TextChecker.segmentIsPresent segment mdText

    output.WriteLine(
        JsonSerializer.Serialize(
            {| found = found
               similarity = TextChecker.computeSimilarity segment mdText |},
            jsonOptions
        )
    )

    if found then 0 else 1

let private runHeadingInfer (text: string) (output: TextWriter) =
    match HeadingChecker.inferDepthFromNumbering text with
    | Some(depth, confidence) ->
        output.WriteLine(
            JsonSerializer.Serialize(
                {| depth = depth
                   confidence = confidence |},
                jsonOptions
            )
        )

        0
    | None ->
        output.WriteLine(
            JsonSerializer.Serialize(
                {| depth = (None: int option)
                   confidence = "NONE" |},
                jsonOptions
            )
        )

        0

let private runHeadingCheck (pdfText: string) (mdText: string) (output: TextWriter) =
    let findings = HeadingChecker.checkHeadings pdfText mdText
    output.WriteLine(JsonSerializer.Serialize(findings, jsonOptions))
    if findings.IsEmpty then 0 else 1

let private runNestingInfer (text: string) (output: TextWriter) =
    let items = NestingChecker.extractNestingLevels text
    output.WriteLine(JsonSerializer.Serialize(items, jsonOptions))
    0

let private runNestingCheck (pdfText: string) (mdText: string) (output: TextWriter) =
    let findings = NestingChecker.checkNesting pdfText mdText
    output.WriteLine(JsonSerializer.Serialize(findings, jsonOptions))
    if findings.IsEmpty then 0 else 1

let private runTableDetect (text: string) (output: TextWriter) =
    let tables = TableChecker.detectTables text
    output.WriteLine(JsonSerializer.Serialize(tables, jsonOptions))
    0

let private runTableCheck (pdfText: string) (mdText: string) (output: TextWriter) =
    let findings = TableChecker.checkTables pdfText mdText
    output.WriteLine(JsonSerializer.Serialize(findings, jsonOptions))
    if findings.IsEmpty then 0 else 1

let private runFigureDetect (text: string) (output: TextWriter) =
    let figures = FigureChecker.detectFigures text
    output.WriteLine(JsonSerializer.Serialize(figures, jsonOptions))
    0

let private runFigureCheck (pdfText: string) (mdText: string) (output: TextWriter) =
    let findings = FigureChecker.checkFigures pdfText mdText
    output.WriteLine(JsonSerializer.Serialize(findings, jsonOptions))
    if findings.IsEmpty then 0 else 1

let private runMermaidValidate (mdText: string) (output: TextWriter) =
    let findings = MermaidValidator.validateMd mdText
    output.WriteLine(JsonSerializer.Serialize(findings, jsonOptions))
    if findings.IsEmpty then 0 else 1

let private runOcrQuality (mdText: string) (output: TextWriter) =
    let findings = OcrAssessor.checkOCRQuality mdText
    output.WriteLine(JsonSerializer.Serialize(findings, jsonOptions))
    if findings.IsEmpty then 0 else 1

let private runOcrExtract (mdText: string) (output: TextWriter) =
    let sections = OcrAssessor.extractOCRSections mdText
    output.WriteLine(JsonSerializer.Serialize(sections, jsonOptions))
    0

let private runReportInit (scope: string) (pdf: string) (md: string) (output: TextWriter) =
    match ReportManager.initReport scope pdf md with
    | Ok path ->
        output.WriteLine(JsonSerializer.Serialize({| path = path |}, jsonOptions))
        0
    | Error msg ->
        eprintfn "Error: %s" msg
        1

let private runReportFinalize (reportPath: string) (status: string) (output: TextWriter) =
    match ReportManager.finalizeReport reportPath status with
    | Ok() ->
        output.WriteLine(JsonSerializer.Serialize({| status = status; path = reportPath |}, jsonOptions))
        0
    | Error msg ->
        eprintfn "Error: %s" msg
        1

let private runSkiplistAdd (mdBasename: string) (category: string) (description: string) (output: TextWriter) =
    match SkiplistManager.add mdBasename category description with
    | Ok added ->
        output.WriteLine(JsonSerializer.Serialize({| added = added |}, jsonOptions))
        0
    | Error msg ->
        eprintfn "Error: %s" msg
        1

let private runSkiplistCheck (mdBasename: string) (category: string) (description: string) (output: TextWriter) =
    match SkiplistManager.check mdBasename category description with
    | Ok found ->
        output.WriteLine(JsonSerializer.Serialize({| ``match`` = found |}, jsonOptions))
        if found then 0 else 1
    | Error msg ->
        eprintfn "Error: %s" msg
        1

let private runSkiplistList (mdBasename: string) (output: TextWriter) =
    match SkiplistManager.list mdBasename with
    | Ok entries ->
        output.WriteLine(JsonSerializer.Serialize(entries, jsonOptions))
        0
    | Error msg ->
        eprintfn "Error: %s" msg
        1

let private toChunks (pdfText: string) =
    pdfText.Split([| '\n' |], StringSplitOptions.RemoveEmptyEntries)
    |> Array.filter (fun s -> s.Trim().Length > 10)
    |> Array.toList

let private runCheckAll (adapter: IPdfPort) (pdfPath: string) (mdText: string) (output: TextWriter) =
    match adapter.SampleText(pdfPath, 999) with
    | Ok pdfText ->
        let chunks = toChunks pdfText

        let findings =
            [ yield! TextChecker.checkText chunks mdText
              yield! HeadingChecker.checkHeadings pdfText mdText
              yield! NestingChecker.checkNesting pdfText mdText
              yield! TableChecker.checkTables pdfText mdText
              yield! FigureChecker.checkFigures pdfText mdText
              yield! MermaidValidator.validateMd mdText ]

        output.WriteLine(JsonSerializer.Serialize(findings, jsonOptions))
        if findings.IsEmpty then 0 else 1
    | Error msg ->
        eprintfn "Error: %s" msg
        1

[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage>]
let private assemblyVersion () =
    let asm = Reflection.Assembly.GetExecutingAssembly()

    match asm.GetName().Version with
    | null -> "0.0.0"
    | v -> v.ToString()

// ---- Public entry point ----

[<System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage(Justification =
    "Integration-tested via CLI scenarios; composition root dispatching is not unit-tested")>]
let run (pdfAdapter: IPdfPort) (argv: string[]) : int =
    if Array.exists (fun a -> a = "--version" || a = "-V") argv then
        printfn "%s" (assemblyVersion ())
        0
    else

        let parser = ArgumentParser.Create<CraneArgs>(programName = "crane")

        try
            let results = parser.ParseCommandLine(argv)

            match results.GetSubCommand() with
            | Pdf subArgs ->
                let allArgs = subArgs.GetAllResults()

                let subCommand =
                    allArgs
                    |> List.tryPick (function
                        | PdfArgs.Info p -> Some("info", p)
                        | PdfArgs.Type p -> Some("type", p)
                        | PdfArgs.Extract p -> Some("extract", p)
                        | _ -> None)

                match subCommand with
                | Some("info", pdf) -> runPdfInfo pdfAdapter Console.Out pdf
                | Some("type", pdf) -> runPdfType pdfAdapter Console.Out pdf
                | Some("extract", pdf) ->
                    let startPage = subArgs.GetResult(PdfArgs.Start_Page, defaultValue = 1)
                    let endPage = subArgs.GetResult(PdfArgs.End_Page, defaultValue = 999)
                    let output = subArgs.TryGetResult(PdfArgs.Output)
                    runPdfExtract pdfAdapter Console.Out pdf startPage endPage output
                | _ ->
                    printfn "%s" (subArgs.Parser.PrintUsage())
                    1
            | Text subArgs ->
                let allArgs = subArgs.GetAllResults()

                let action =
                    allArgs
                    |> List.tryPick (function
                        | TextArgs.Check(pdf, md) -> Some(Choice1Of2(pdf, md))
                        | TextArgs.Search(md, seg) -> Some(Choice2Of2(md, seg)))

                match action with
                | Some(Choice1Of2(pdf, md)) ->
                    let mdText = File.ReadAllText(md)
                    runTextCheck pdfAdapter pdf mdText Console.Out
                | Some(Choice2Of2(md, seg)) ->
                    let mdText = File.ReadAllText(md)
                    runTextSearch mdText seg Console.Out
                | None ->
                    printfn "%s" (subArgs.Parser.PrintUsage())
                    1
            | Heading subArgs ->
                let allArgs = subArgs.GetAllResults()

                let action =
                    allArgs
                    |> List.tryPick (function
                        | HeadingArgs.Infer pdf -> Some(Choice1Of2 pdf)
                        | HeadingArgs.Check(pdf, md) -> Some(Choice2Of2(pdf, md)))

                match action with
                | Some(Choice1Of2 pdf) ->
                    match pdfAdapter.SampleText(pdf, 999) with
                    | Ok text -> runHeadingInfer text Console.Out
                    | Error msg ->
                        eprintfn "Error: %s" msg
                        1
                | Some(Choice2Of2(pdf, md)) ->
                    match pdfAdapter.SampleText(pdf, 999) with
                    | Ok pdfText ->
                        let mdText = File.ReadAllText(md)
                        runHeadingCheck pdfText mdText Console.Out
                    | Error msg ->
                        eprintfn "Error: %s" msg
                        1
                | None ->
                    printfn "%s" (subArgs.Parser.PrintUsage())
                    1
            | Nesting subArgs ->
                let allArgs = subArgs.GetAllResults()

                let action =
                    allArgs
                    |> List.tryPick (function
                        | NestingArgs.Infer pdf -> Some(Choice1Of2 pdf)
                        | NestingArgs.Check(pdf, md) -> Some(Choice2Of2(pdf, md)))

                match action with
                | Some(Choice1Of2 pdf) ->
                    match pdfAdapter.SampleText(pdf, 999) with
                    | Ok text -> runNestingInfer text Console.Out
                    | Error msg ->
                        eprintfn "Error: %s" msg
                        1
                | Some(Choice2Of2(pdf, md)) ->
                    match pdfAdapter.SampleText(pdf, 999) with
                    | Ok pdfText ->
                        let mdText = File.ReadAllText(md)
                        runNestingCheck pdfText mdText Console.Out
                    | Error msg ->
                        eprintfn "Error: %s" msg
                        1
                | None ->
                    printfn "%s" (subArgs.Parser.PrintUsage())
                    1
            | Table subArgs ->
                let allArgs = subArgs.GetAllResults()

                let action =
                    allArgs
                    |> List.tryPick (function
                        | TableArgs.Detect pdf -> Some(Choice1Of2 pdf)
                        | TableArgs.Check(pdf, md) -> Some(Choice2Of2(pdf, md)))

                match action with
                | Some(Choice1Of2 pdf) ->
                    match pdfAdapter.SampleText(pdf, 999) with
                    | Ok text -> runTableDetect text Console.Out
                    | Error msg ->
                        eprintfn "Error: %s" msg
                        1
                | Some(Choice2Of2(pdf, md)) ->
                    match pdfAdapter.SampleText(pdf, 999) with
                    | Ok pdfText ->
                        let mdText = File.ReadAllText(md)
                        runTableCheck pdfText mdText Console.Out
                    | Error msg ->
                        eprintfn "Error: %s" msg
                        1
                | None ->
                    printfn "%s" (subArgs.Parser.PrintUsage())
                    1
            | Figure subArgs ->
                let allArgs = subArgs.GetAllResults()

                let action =
                    allArgs
                    |> List.tryPick (function
                        | FigureArgs.Detect pdf -> Some(Choice1Of2 pdf)
                        | FigureArgs.Check(pdf, md) -> Some(Choice2Of2(pdf, md)))

                match action with
                | Some(Choice1Of2 pdf) ->
                    match pdfAdapter.SampleText(pdf, 999) with
                    | Ok text -> runFigureDetect text Console.Out
                    | Error msg ->
                        eprintfn "Error: %s" msg
                        1
                | Some(Choice2Of2(pdf, md)) ->
                    match pdfAdapter.SampleText(pdf, 999) with
                    | Ok pdfText ->
                        let mdText = File.ReadAllText(md)
                        runFigureCheck pdfText mdText Console.Out
                    | Error msg ->
                        eprintfn "Error: %s" msg
                        1
                | None ->
                    printfn "%s" (subArgs.Parser.PrintUsage())
                    1
            | Mermaid subArgs ->
                let allArgs = subArgs.GetAllResults()

                let action =
                    allArgs
                    |> List.tryPick (function
                        | MermaidArgs.Validate md -> Some md)

                match action with
                | Some md ->
                    let mdText = File.ReadAllText(md)
                    runMermaidValidate mdText Console.Out
                | None ->
                    printfn "%s" (subArgs.Parser.PrintUsage())
                    1
            | Ocr subArgs ->
                let allArgs = subArgs.GetAllResults()

                let action =
                    allArgs
                    |> List.tryPick (function
                        | OcrArgs.Quality md -> Some(Choice1Of2 md)
                        | OcrArgs.Extract pdf -> Some(Choice2Of2 pdf))

                match action with
                | Some(Choice1Of2 md) ->
                    let mdText = File.ReadAllText(md)
                    runOcrQuality mdText Console.Out
                | Some(Choice2Of2 pdf) ->
                    match pdfAdapter.SampleText(pdf, 999) with
                    | Ok pdfText -> runOcrExtract pdfText Console.Out
                    | Error msg ->
                        eprintfn "Error: %s" msg
                        1
                | None ->
                    printfn "%s" (subArgs.Parser.PrintUsage())
                    1
            | Report subArgs ->
                let allArgs = subArgs.GetAllResults()

                let action =
                    allArgs
                    |> List.tryPick (function
                        | ReportArgs.Init(scope, pdf, md) -> Some(Choice1Of2(scope, pdf, md))
                        | ReportArgs.Finalize(report, status) -> Some(Choice2Of2(report, status)))

                match action with
                | Some(Choice1Of2(scope, pdf, md)) -> runReportInit scope pdf md Console.Out
                | Some(Choice2Of2(report, status)) -> runReportFinalize report status Console.Out
                | None ->
                    printfn "%s" (subArgs.Parser.PrintUsage())
                    1
            | Skiplist subArgs ->
                let allArgs = subArgs.GetAllResults()

                let action =
                    allArgs
                    |> List.tryPick (function
                        | SkiplistArgs.Add(md, cat, desc) -> Some(Choice1Of3(md, cat, desc))
                        | SkiplistArgs.Check(md, cat, desc) -> Some(Choice2Of3(md, cat, desc))
                        | SkiplistArgs.List md -> Some(Choice3Of3 md))

                match action with
                | Some(Choice1Of3(md, cat, desc)) -> runSkiplistAdd md cat desc Console.Out
                | Some(Choice2Of3(md, cat, desc)) -> runSkiplistCheck md cat desc Console.Out
                | Some(Choice3Of3 md) -> runSkiplistList md Console.Out
                | None ->
                    printfn "%s" (subArgs.Parser.PrintUsage())
                    1
            | Check_All subArgs ->
                let pair = subArgs.TryGetResult(CheckAllArgs.Pair)
                let cacheDir = subArgs.TryGetResult(CheckAllArgs.Cache_Dir)

                match pair with
                | Some(pdf, md) ->
                    let adapter =
                        match cacheDir with
                        | Some dir -> PdfExtractionCache.wrap pdfAdapter dir
                        | None -> pdfAdapter

                    let mdText = File.ReadAllText(md)
                    runCheckAll adapter pdf mdText Console.Out
                | None ->
                    printfn "%s" (subArgs.Parser.PrintUsage())
                    1
        with :? ArguParseException as ex ->
            printfn "%s" ex.Message
            1
