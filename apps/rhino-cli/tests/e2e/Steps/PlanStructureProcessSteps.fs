/// Public-process bindings for the six plan-structure scenarios. Every
/// decision is observed through the published `rhino-cli-fsharp` executable
/// run inside a throwaway Git repository; the corpus files are only copied in.
module RhinoCli.Tests.E2E.Steps.PlanStructureProcessSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/plan/plan-structure.feature" ]

open System
open System.Diagnostics
open System.IO
open System.Security.Cryptography
open System.Text
open System.Text.Json
open TickSpec
open Xunit

let private repositoryRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

let private executable =
    Path.Combine(repositoryRoot, "apps", "rhino-cli", "src", "dist", "rhino-cli-fsharp")

let private corpusRoot =
    Path.Combine(repositoryRoot, "specs", "fixtures", "plan-structure")

type private CliResult =
    { ExitCode: int
      Stdout: string
      Stderr: string }

let private runCli (root: string) (arguments: string list) : CliResult =
    let info =
        ProcessStartInfo(
            FileName = executable,
            WorkingDirectory = root,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        )

    arguments |> List.iter info.ArgumentList.Add
    use proc = Process.Start info
    let stdout = proc.StandardOutput.ReadToEndAsync()
    let stderr = proc.StandardError.ReadToEnd()
    proc.WaitForExit()

    { ExitCode = proc.ExitCode
      Stdout = stdout.Result
      Stderr = stderr }

let private initializeGitRepository (root: string) =
    let info =
        ProcessStartInfo(FileName = "git", WorkingDirectory = root, UseShellExecute = false)

    info.ArgumentList.Add "init"
    info.ArgumentList.Add "--quiet"
    use proc = Process.Start info
    proc.WaitForExit()
    Assert.Equal(0, proc.ExitCode)

/// Creates a throwaway Git repository, lets `populate` write into it, runs the CLI there, and removes it.
let private inRepository (populate: string -> unit) (arguments: string list) : CliResult =
    let root =
        Path.Combine(Path.GetTempPath(), "rhino-plan-structure-e2e-" + Guid.NewGuid().ToString("N"))

    Directory.CreateDirectory root |> ignore

    try
        initializeGitRepository root
        populate root
        runCli root arguments
    finally
        Directory.Delete(root, true)

let rec private copyDirectory (source: string) (destination: string) =
    Directory.CreateDirectory destination |> ignore

    for file in Directory.GetFiles source do
        File.Copy(file, Path.Combine(destination, Path.GetFileName file))

    for directory in Directory.GetDirectories source do
        copyDirectory directory (Path.Combine(destination, Path.GetFileName directory))

/// One `manifest.tsv` row: the case directory, its exit class, and its rule set.
type private CorpusCase =
    { Name: string
      ExpectExit: int
      ExpectRules: string list }

module private Corpus =
    let private unlistedFiles = [ "README.md"; "SHA256SUMS"; "CORPUS-DIGEST" ]

    let private sha256 (path: string) =
        Convert.ToHexString(SHA256.HashData(File.ReadAllBytes path)).ToLowerInvariant()

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

    let write (files: (string * byte[]) list) (root: string) =
        for path, bytes in files do
            let full = Path.Combine(root, path)
            Directory.CreateDirectory(Path.GetDirectoryName full) |> ignore
            File.WriteAllBytes(full, bytes)

/// The rule identifiers a `--output json` run reports, sorted and distinct.
let private reportedRules (stdout: string) : string list =
    use document = JsonDocument.Parse stdout

    document.RootElement.GetProperty("violations").EnumerateArray()
    |> Seq.map (fun violation -> violation.GetProperty("kind").GetString())
    |> Seq.distinct
    |> Seq.sort
    |> List.ofSeq

type PlanStructureProcessSteps() =
    let mutable caseRuns: (CorpusCase * CliResult) list = []
    let mutable files: (string * byte[]) list = []
    let mutable outcome: CliResult option = None

    let runCases (kind: string) =
        caseRuns <-
            Corpus.cases kind
            |> List.map (fun case ->
                let populate root =
                    copyDirectory (Path.Combine(corpusRoot, case.Name, "plans")) (Path.Combine(root, "plans"))

                case, inRepository populate [ "plan"; "validate"; "--output"; "json" ])

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
        outcome <- Some(inRepository (Trees.write files) [ "plan"; "validate" ])

    [<When>]
    member _.``the developer runs plan validate with JSON output``() =
        outcome <- Some(inRepository (Trees.write files) [ "plan"; "validate"; "--output"; "json" ])

    [<Then>]
    member _.``every case exits successfully and reports no findings``() =
        for case, run in caseRuns do
            Assert.True(
                (run.ExitCode = case.ExpectExit && run.ExitCode = 0 && run.Stderr = ""),
                sprintf "%s exited %d with %s" case.Name run.ExitCode run.Stderr
            )

            Assert.Empty(reportedRules run.Stdout)

    [<Then>]
    member _.``every case exits with a failure code``() =
        for case, run in caseRuns do
            Assert.True(
                (run.ExitCode = case.ExpectExit && run.ExitCode = 1),
                sprintf "%s exited %d with %s" case.Name run.ExitCode run.Stderr
            )

    [<Then>]
    member _.``every case reports exactly the rule identifiers its manifest row names``() =
        for case, run in caseRuns do
            let reported = reportedRules run.Stdout

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
        Assert.Equal<string list>([ rule ], reportedRules stdout)

    [<Then>]
    member _.``standard error names the delivery document and says it holds no text``() =
        Assert.Equal("[plan] plans/backlog/unreadable-delivery/delivery.md: holds no text\n", (result ()).Stderr)

module private FeatureRunner =
    let private featurePath =
        Path.Combine(repositoryRoot, "specs", "apps", "rhino", "cli", "behaviours", "plan", "plan-structure.feature")

    let private extractScenario (featureLines: string[]) (scenarioTitle: string) =
        let featureLine =
            featureLines
            |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let startIndex =
            featureLines
            |> Array.findIndex (fun line -> line.Trim() = sprintf "Scenario: %s" scenarioTitle)

        let endIndex =
            featureLines
            |> Array.skip (startIndex + 1)
            |> Array.tryFindIndex (fun line -> line.Trim().StartsWith("Scenario:", StringComparison.Ordinal))
            |> Option.map (fun offset -> startIndex + 1 + offset)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIndex .. endIndex - 1]

    let run scenarioTitle =
        let lines = File.ReadAllLines featurePath

        let feature =
            StepDefinitions([| typeof<PlanStructureProcessSteps> |])
                .GenerateFeature(featurePath, extractScenario lines scenarioTitle)

        (Seq.exactlyOne feature.Scenarios).Action.Invoke()

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
