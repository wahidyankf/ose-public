/// TickSpec step definitions binding `plan/plan-structure.feature` to the pure
/// core of `RhinoCli.Application.Plan`. The shared plan-structure corpus is
/// embedded into this assembly and every other plans tree is built in memory,
/// so no step here touches the filesystem; the disk adapter is proven by the
/// Integration layer and the published command by the E2E layer.
module RhinoCli.Tests.Unit.Steps.PlanStructureSteps

/// Explicit static-coverage ownership; the validator scopes this file's
/// TickSpec bindings to these canonical features.
let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/plan/plan-structure.feature" ]


open System
open System.IO
open System.Reflection
open System.Security.Cryptography
open System.Text
open System.Text.Json
open TickSpec
open Xunit
open RhinoCli.Application.Plan

/// One `manifest.tsv` row: the case directory, its exit class, and its rule set.
type private CorpusCase =
    { Name: string
      ExpectExit: int
      ExpectRules: string list }

let private strictUtf8 = UTF8Encoding(false, true)

/// Decodes document bytes the way the disk adapter does: strict UTF-8.
let private decode (bytes: byte[]) : PlanRead =
    try
        Found(strictUtf8.GetString bytes)
    with :? DecoderFallbackException ->
        NotText

/// Runs the pure validator over an in-memory tree keyed by repository-relative path.
let private validateTree (tree: Map<string, byte[]>) : PlanReport =
    let read path =
        match Map.tryFind path tree with
        | Some bytes -> decode bytes
        | None -> PlanRead.Missing

    validate (tree |> Map.toList |> List.map fst) read

/// The shared corpus as embedded bytes, keyed by corpus-relative path.
module private Corpus =
    let private resourcePrefix = "plan-structure/"

    let private unlistedFiles = [ "README.md"; "SHA256SUMS"; "CORPUS-DIGEST" ]

    let files: Map<string, byte[]> =
        let assembly = Assembly.GetExecutingAssembly()

        assembly.GetManifestResourceNames()
        |> Array.choose (fun name ->
            let normalised = name.Replace('\\', '/')

            if normalised.StartsWith(resourcePrefix, StringComparison.Ordinal) then
                use stream = assembly.GetManifestResourceStream name
                use buffer = new MemoryStream()
                stream.CopyTo buffer
                Some(normalised.Substring resourcePrefix.Length, buffer.ToArray())
            else
                None)
        |> Map.ofArray

    let private sha256 (bytes: byte[]) =
        Convert.ToHexString(SHA256.HashData bytes).ToLowerInvariant()

    let private text (path: string) =
        Encoding.UTF8.GetString(Map.find path files)

    /// Every file `SHA256SUMS` lists is embedded with that digest, nothing else is
    /// embedded, and `CORPUS-DIGEST` is the digest of `SHA256SUMS` itself.
    let verify () =
        let sums = Map.find "SHA256SUMS" files

        let listed =
            (Encoding.UTF8.GetString sums).Split('\n', StringSplitOptions.RemoveEmptyEntries)
            |> Array.map (fun line ->
                let path = line.Substring(64).TrimStart(' ', '*')

                let path =
                    if path.StartsWith("./", StringComparison.Ordinal) then
                        path.Substring 2
                    else
                        path

                path, line.Substring(0, 64))

        let embedded =
            files
            |> Map.toList
            |> List.map fst
            |> List.filter (fun path -> not (List.contains path unlistedFiles))

        Assert.Equal<string list>(embedded, listed |> Array.map fst |> Array.sort |> List.ofArray)

        for path, digest in listed do
            Assert.True((sha256 (Map.find path files) = digest), sprintf "%s does not match SHA256SUMS" path)

        Assert.Equal((text "CORPUS-DIGEST").Trim(), sha256 sums)

    let cases (kind: string) : CorpusCase list =
        (text "manifest.tsv").Split('\n', StringSplitOptions.RemoveEmptyEntries)
        |> Array.skip 1
        |> Array.map (fun line -> line.TrimEnd('\r').Split('\t'))
        |> Array.filter (fun columns -> columns.[0].StartsWith(kind + "/", StringComparison.Ordinal))
        |> Array.map (fun columns ->
            { Name = columns.[0]
              ExpectExit = int columns.[1]
              ExpectRules =
                columns.[2].Split([| ','; ' ' |], StringSplitOptions.RemoveEmptyEntries)
                |> List.ofArray
                |> List.sort })
        |> List.ofArray

    /// One case's `plans/` tree, keyed by path relative to the case directory.
    let tree (case: CorpusCase) : Map<string, byte[]> =
        let root = case.Name + "/"

        files
        |> Map.toList
        |> List.choose (fun (path, bytes) ->
            if path.StartsWith(root, StringComparison.Ordinal) then
                Some(path.Substring root.Length, bytes)
            else
                None)
        |> Map.ofList

/// Small plans trees built in memory for the rendering scenarios.
module private Trees =
    let private utf8 (text: string) = Encoding.UTF8.GetBytes text

    /// The six documents with the single-file technical shape, one criterion, and one cited delivery item.
    let conforming (slug: string) : (string * byte[]) list =
        let file name body =
            sprintf "plans/backlog/%s/%s" slug name, utf8 body

        [ file "README.md" "# Plan\n"
          file "brd.md" "# BRD\n"
          file "delivery.md" "# Delivery\n\n## Phase 1\n\n- [ ] [AI] work [AC-01]\n"
          file "learnings.md" "# Learnings\n"
          file "prd.md" "# PRD\n\n```gherkin\nScenario: [AC-01] one\n```\n"
          file "tech-docs.md" "# Tech\n" ]

    let withoutLearnings (slug: string) =
        conforming slug
        |> List.filter (fun (path, _) -> not (path.EndsWith("/learnings.md", StringComparison.Ordinal)))

    let withBinaryDelivery (slug: string) =
        conforming slug
        |> List.map (fun (path, bytes) ->
            if path.EndsWith("/delivery.md", StringComparison.Ordinal) then
                path, [| 0x23uy; 0x20uy; 0xFFuy; 0xFEuy; 0x0Auy |]
            else
                path, bytes)

/// Instance step-definition container — TickSpec builds one per scenario, so
/// instance fields thread state from Given through Then.
type PlanStructureSteps() =
    let mutable caseRuns: (CorpusCase * PlanReport * PlanOutcome) list = []
    let mutable tree: Map<string, byte[]> = Map.empty
    let mutable outcome: PlanOutcome option = None

    let runCases (kind: string) =
        caseRuns <-
            Corpus.cases kind
            |> List.map (fun case ->
                let report = validateTree (Corpus.tree case)
                case, report, renderText report)

        Assert.NotEmpty(caseRuns)

    let result () =
        outcome |> Option.defaultWith (fun () -> failwith "plan validate has not run")

    // ---- Given ----

    [<Given>]
    member _.``the shared plan-structure corpus matches its recorded digest``() = Corpus.verify ()

    [<Given>]
    member _.``a plans tree holding one conforming backlog plan``() =
        tree <- Map.ofList (Trees.conforming "only-plan")

    [<Given>]
    member _.``a plans tree holding two backlog plans that each lack learnings.md``() =
        tree <- Map.ofList (Trees.withoutLearnings "alpha-plan" @ Trees.withoutLearnings "beta-plan")

    [<Given>]
    member _.``a plans tree holding one backlog plan that lacks learnings.md``() =
        tree <- Map.ofList (Trees.withoutLearnings "only-plan")

    [<Given>]
    member _.``a plans tree holding one backlog plan whose delivery.md is not UTF-8 text``() =
        tree <- Map.ofList (Trees.withBinaryDelivery "unreadable-delivery")

    // ---- When ----

    [<When>]
    member _.``the developer runs plan validate over every (accepted|rejected) case``(kind: string) = runCases kind

    [<When>]
    member _.``the developer runs plan validate``() =
        outcome <- Some(renderText (validateTree tree))

    [<When>]
    member _.``the developer runs plan validate with JSON output``() =
        outcome <- Some(renderJson (validateTree tree))

    // ---- Then ----

    [<Then>]
    member _.``every case exits successfully and reports no findings``() =
        for case, report, rendered in caseRuns do
            Assert.True(
                (rendered.ExitCode = case.ExpectExit
                 && rendered.ExitCode = 0
                 && List.isEmpty report.Findings
                 && rendered.Stderr = ""),
                sprintf "%s exited %d with %s" case.Name rendered.ExitCode rendered.Stderr
            )

    [<Then>]
    member _.``every case exits with a failure code``() =
        for case, _, rendered in caseRuns do
            Assert.True(
                (rendered.ExitCode = case.ExpectExit && rendered.ExitCode = 1),
                sprintf "%s exited %d" case.Name rendered.ExitCode
            )

    [<Then>]
    member _.``every case reports exactly the rule identifiers its manifest row names``() =
        for case, report, _ in caseRuns do
            let reported =
                report.Findings
                |> List.map (fun finding -> finding.Rule)
                |> List.distinct
                |> List.sort

            Assert.True(
                (reported = case.ExpectRules),
                sprintf "%s reported %A but its manifest names %A" case.Name reported case.ExpectRules
            )

    [<Then>]
    member _.``the command exits successfully``() = Assert.Equal(0, (result ()).ExitCode)

    [<Then>]
    member _.``the command exits with a failure code``() = Assert.Equal(1, (result ()).ExitCode)

    [<Then>]
    member _.``the command exits with code 2``() = Assert.Equal(2, (result ()).ExitCode)

    [<Then>]
    member _.``standard output reads "(.*)"``(expected: string) =
        Assert.Equal(expected + "\n", (result ()).Stdout)

    [<Then>]
    member _.``standard output is empty``() = Assert.Equal("", (result ()).Stdout)

    [<Then>]
    member _.``standard error is empty``() = Assert.Equal("", (result ()).Stderr)

    [<Then>]
    member _.``standard error lists one "(.*)" line per plan with the earlier path first``(rule: string) =
        let lines = (result ()).Stderr.Split('\n', StringSplitOptions.RemoveEmptyEntries)

        Assert.Equal(2, lines.Length)
        Assert.All(lines, (fun line -> Assert.Contains(sprintf " %s " rule, line)))
        Assert.Contains("alpha-plan", lines.[0])
        Assert.Contains("beta-plan", lines.[1])

    [<Then>]
    member _.``standard output is one JSON document whose violations name "(.*)"``(rule: string) =
        let stdout = (result ()).Stdout
        Assert.EndsWith("\n", stdout)
        Assert.DoesNotContain("\n", stdout.TrimEnd('\n'))
        use document = JsonDocument.Parse stdout

        let kinds =
            document.RootElement.GetProperty("violations").EnumerateArray()
            |> Seq.map (fun violation -> violation.GetProperty("kind").GetString())
            |> List.ofSeq

        Assert.Equal<string list>([ rule ], kinds)

    [<Then>]
    member _.``standard error names the delivery document and says it holds no text``() =
        Assert.Equal("[plan] plans/backlog/unreadable-delivery/delivery.md: holds no text\n", (result ()).Stderr)

/// Reads one named `Scenario:` block out of the embedded
/// `plan/plan-structure.feature` and runs it through TickSpec bound only
/// against `PlanStructureSteps` — see `EnvSteps.fs`'s `FeatureRunner` for why
/// this is per-scenario rather than per-file.
module private FeatureRunner =

    let private featurePath = "plan-structure.feature"

    let private readFeature () =
        let assembly = Assembly.GetExecutingAssembly()

        let resourceName =
            assembly.GetManifestResourceNames()
            |> Array.filter (fun name -> name.EndsWith(featurePath, StringComparison.Ordinal))
            |> Array.exactlyOne

        use stream = assembly.GetManifestResourceStream(resourceName)
        use reader = new StreamReader(stream)
        reader.ReadToEnd().Replace("\r\n", "\n").Split('\n')

    let private extractScenario (featureLines: string[]) (scenarioTitle: string) : string[] =
        let featureLine =
            featureLines
            |> Array.find (fun l -> l.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let startIdx =
            featureLines
            |> Array.findIndex (fun l -> l.Trim() = sprintf "Scenario: %s" scenarioTitle)

        let endIdx =
            featureLines
            |> Array.skip (startIdx + 1)
            |> Array.tryFindIndex (fun l ->
                let trimmed = l.Trim()

                trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
                || trimmed.StartsWith("@", StringComparison.Ordinal))
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIdx .. endIdx - 1]

    let run (scenarioTitle: string) : unit =
        let snippet = extractScenario (readFeature ()) scenarioTitle
        let definitions = StepDefinitions([| typeof<PlanStructureSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)

        for scenario in feature.Scenarios do
            scenario.Action.Invoke()

[<Fact>]
let ``Every accepted corpus case validates clean`` () =
    FeatureRunner.run "Every accepted corpus case validates clean"

[<Fact>]
let ``Every rejected corpus case reports exactly the rules its manifest names`` () =
    FeatureRunner.run "Every rejected corpus case reports exactly the rules its manifest names"

[<Fact>]
let ``A clean tree reports how many plans it checked`` () =
    FeatureRunner.run "A clean tree reports how many plans it checked"

[<Fact>]
let ``Findings go to standard error one per line in path order`` () =
    FeatureRunner.run "Findings go to standard error one per line in path order"

[<Fact>]
let ``JSON output carries the same findings`` () =
    FeatureRunner.run "JSON output carries the same findings"

[<Fact>]
let ``A plan document that is not text refuses the run`` () =
    FeatureRunner.run "A plan document that is not text refuses the run"
