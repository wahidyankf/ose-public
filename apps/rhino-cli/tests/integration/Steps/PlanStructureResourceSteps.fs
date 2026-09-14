/// Integration proof for `plan validate` against the real shared corpus on disk
/// and real temporary plans trees, read through `Plan.listPlanFiles` and
/// `Plan.readPlanDocument` rather than an in-memory tree.
module RhinoCli.Tests.Integration.Steps.PlanStructureResourceSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/plan/plan-structure.feature" ]

open System
open System.IO
open System.Security.Cryptography
open System.Text
open System.Text.Json
open TickSpec
open Xunit
open RhinoCli.Application.Plan

let private repositoryRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

let private corpusRoot =
    Path.Combine(repositoryRoot, "specs", "fixtures", "plan-structure")

/// One `manifest.tsv` row: the case directory, its exit class, and its rule set.
type private CorpusCase =
    { Name: string
      ExpectExit: int
      ExpectRules: string list }

module private Corpus =
    let private unlistedFiles = [ "README.md"; "SHA256SUMS"; "CORPUS-DIGEST" ]

    let private sha256 (path: string) =
        Convert.ToHexString(SHA256.HashData(File.ReadAllBytes path)).ToLowerInvariant()

    /// Every file on disk except the three unlisted ones appears in `SHA256SUMS`
    /// with its digest, and `CORPUS-DIGEST` is the digest of `SHA256SUMS`.
    let verify () =
        let sumsPath = Path.Combine(corpusRoot, "SHA256SUMS")

        let listed =
            File.ReadAllLines sumsPath
            |> Array.filter (fun line -> line.Length > 64)
            |> Array.map (fun line ->
                let path = line.Substring(64).TrimStart(' ', '*')

                let path =
                    if path.StartsWith("./", StringComparison.Ordinal) then
                        path.Substring 2
                    else
                        path

                path, line.Substring(0, 64))

        let onDisk =
            Directory.EnumerateFiles(corpusRoot, "*", SearchOption.AllDirectories)
            |> Seq.map (fun path -> Path.GetRelativePath(corpusRoot, path).Replace('\\', '/'))
            |> Seq.filter (fun path -> not (List.contains path unlistedFiles))
            |> Seq.sort
            |> List.ofSeq

        Assert.Equal<string list>(onDisk, listed |> Array.map fst |> Array.sort |> List.ofArray)

        for path, digest in listed do
            Assert.True((sha256 (Path.Combine(corpusRoot, path)) = digest), sprintf "%s does not match SHA256SUMS" path)

        Assert.Equal(File.ReadAllText(Path.Combine(corpusRoot, "CORPUS-DIGEST")).Trim(), sha256 sumsPath)

    let cases (kind: string) : CorpusCase list =
        File.ReadAllLines(Path.Combine(corpusRoot, "manifest.tsv"))
        |> Array.skip 1
        |> Array.filter (fun line -> line.Length > 0)
        |> Array.map (fun line -> line.Split('\t'))
        |> Array.filter (fun columns -> columns.[0].StartsWith(kind + "/", StringComparison.Ordinal))
        |> Array.map (fun columns ->
            { Name = columns.[0]
              ExpectExit = int columns.[1]
              ExpectRules =
                columns.[2].Split([| ','; ' ' |], StringSplitOptions.RemoveEmptyEntries)
                |> List.ofArray
                |> List.sort })
        |> List.ofArray

/// Small plans trees written to a real temporary directory.
module private Trees =
    let private utf8 (text: string) = Encoding.UTF8.GetBytes text

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

    /// Writes `files` under a fresh temporary root, runs `action` on that root, and removes it.
    let onDisk (files: (string * byte[]) list) (action: string -> 'T) : 'T =
        let root =
            Path.Combine(Path.GetTempPath(), "rhino-plan-structure-" + Guid.NewGuid().ToString("N"))

        Directory.CreateDirectory root |> ignore

        try
            for path, bytes in files do
                let full = Path.Combine(root, path)
                Directory.CreateDirectory(Path.GetDirectoryName(full: string)) |> ignore
                File.WriteAllBytes(full, bytes)

            action root
        finally
            Directory.Delete(root, true)

let private validateOnDisk (root: string) : PlanReport =
    validate (listPlanFiles root) (readPlanDocument root)

type PlanStructureResourceSteps() =
    let mutable caseRuns: (CorpusCase * PlanReport * PlanOutcome) list = []
    let mutable files: (string * byte[]) list = []
    let mutable outcome: PlanOutcome option = None

    let runCases (kind: string) =
        caseRuns <-
            Corpus.cases kind
            |> List.map (fun case ->
                let report = validateOnDisk (Path.Combine(corpusRoot, case.Name))
                case, report, renderText report)

        Assert.NotEmpty(caseRuns)

    let result () =
        outcome |> Option.defaultWith (fun () -> failwith "plan validate has not run")

    [<Given>]
    member _.``the shared plan-structure corpus matches its recorded digest``() = Corpus.verify ()

    [<Given>]
    member _.``a plans tree holding one conforming backlog plan``() = files <- Trees.conforming "only-plan"

    [<Given>]
    member _.``a plans tree holding two backlog plans that each lack learnings.md``() =
        files <- Trees.withoutLearnings "alpha-plan" @ Trees.withoutLearnings "beta-plan"

    [<Given>]
    member _.``a plans tree holding one backlog plan that lacks learnings.md``() =
        files <- Trees.withoutLearnings "only-plan"

    [<Given>]
    member _.``a plans tree holding one backlog plan whose delivery.md is not UTF-8 text``() =
        files <- Trees.withBinaryDelivery "unreadable-delivery"

    [<When>]
    member _.``the developer runs plan validate over every (accepted|rejected) case``(kind: string) = runCases kind

    [<When>]
    member _.``the developer runs plan validate``() =
        outcome <- Some(Trees.onDisk files (validateOnDisk >> renderText))

    [<When>]
    member _.``the developer runs plan validate with JSON output``() =
        outcome <- Some(Trees.onDisk files (validateOnDisk >> renderJson))

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

module private FeatureRunner =
    let private featurePath =
        Path.Combine(repositoryRoot, "specs", "apps", "rhino", "cli", "behaviours", "plan", "plan-structure.feature")

    let private extractScenario (lines: string[]) title =
        let featureLine =
            lines
            |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let startIndex =
            lines
            |> Array.findIndex (fun line -> line.Trim() = sprintf "Scenario: %s" title)

        let endIndex =
            lines
            |> Array.skip (startIndex + 1)
            |> Array.tryFindIndex (fun line -> line.Trim().StartsWith("Scenario:", StringComparison.Ordinal))
            |> Option.map (fun relative -> startIndex + 1 + relative)
            |> Option.defaultValue lines.Length

        Array.append [| featureLine; "" |] lines.[startIndex .. endIndex - 1]

    let run title =
        let definitions = StepDefinitions([| typeof<PlanStructureResourceSteps> |])

        let feature =
            definitions.GenerateFeature(featurePath, extractScenario (File.ReadAllLines featurePath) title)

        feature.Scenarios |> Seq.iter (fun scenario -> scenario.Action.Invoke())

[<Theory>]
[<InlineData("Every accepted corpus case validates clean")>]
[<InlineData("Every rejected corpus case reports exactly the rules its manifest names")>]
[<InlineData("A clean tree reports how many plans it checked")>]
[<InlineData("Findings go to standard error one per line in path order")>]
[<InlineData("JSON output carries the same findings")>]
[<InlineData("A plan document that is not text refuses the run")>]
let ``plan validate reads the real corpus and real plans trees through the disk adapter`` title =
    FeatureRunner.run title
