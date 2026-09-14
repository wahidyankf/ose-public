/// Public-process bindings for the five repo-config validation scenarios.
/// Behavioural decisions are observed through the published `rhino`
/// executable; raw YAML inspection only arranges fixtures or verifies the
/// repository declaration named by a scenario.
module RhinoCli.Tests.E2E.Steps.RepoConfigValidateProcessSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/repo-config-validate/repo-config-validate.feature" ]

open System
open System.Diagnostics
open System.IO
open TickSpec
open Xunit

let private repositoryRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

let private executable =
    Path.Combine(repositoryRoot, "apps", "rhino-cli", "src", "dist", "rhino-cli-fsharp")

let private runCli (root: string) =
    let info =
        ProcessStartInfo(
            FileName = executable,
            WorkingDirectory = root,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        )

    info.ArgumentList.Add "repo-config"
    info.ArgumentList.Add "validate"
    use proc = Process.Start info
    let stdout = proc.StandardOutput.ReadToEnd()
    let stderr = proc.StandardError.ReadToEnd()
    proc.WaitForExit()
    proc.ExitCode, stdout + stderr

let private initializeGitRepository (root: string) =
    let info =
        ProcessStartInfo(FileName = "git", WorkingDirectory = root, UseShellExecute = false)

    info.ArgumentList.Add "init"
    info.ArgumentList.Add "--quiet"
    use proc = Process.Start info
    proc.WaitForExit()
    Assert.Equal(0, proc.ExitCode)

let private replaceFirst (pattern: string) (replacement: string) (input: string) =
    let index = input.IndexOf(pattern, StringComparison.Ordinal)

    if index < 0 then
        failwithf "fixture pattern not found: %s" pattern

    input.Substring(0, index)
    + replacement
    + input.Substring(index + pattern.Length)

/// The rhino-cli registry's indentation in raw repo-config.yml text: a v2
/// document nests it under `extensions.rhino-cli`, four columns in; a v1
/// document keeps it at the root.
let private registryIndent (text: string) : string =
    if text.Contains("\nextensions:\n  rhino-cli:\n", StringComparison.Ordinal) then
        "    "
    else
        ""

/// Shifts a registry fragment written in v1 column positions to where the
/// registry sits in `text`, so one mutation reads the same for v1 and v2.
let private reindent (text: string) (fragment: string) : string =
    let indent = registryIndent text

    fragment.Split('\n')
    |> Array.map (fun line -> if line = "" then line else indent + line)
    |> String.concat "\n"

let private sliceHarnessEntry (name: string) (text: string) =
    let indent = registryIndent text
    let marker = sprintf "\n%s  - name: %s" indent name
    let index = text.IndexOf(marker, StringComparison.Ordinal)

    if index < 0 then
        failwithf "%s harness entry not found" name

    let lines = text.Substring(index + 1).Split('\n')

    let body =
        lines
        |> Array.skip 1
        |> Array.takeWhile (fun line -> line.Length = 0 || line.StartsWith(indent + " ", StringComparison.Ordinal))

    String.concat "\n" (Array.append [| lines.[0] |] body)

let private syntheticConfigWithVendoredProbe probePath =
    String.concat
        "\n"
        [ "harness:"
          "  - name: codex"
          "    tier: generated"
          "    agent-dir: .codex/agents"
          "    mirrors: .claude/agents"
          "    skills-dir: .agents/skills"
          "    skills-mirrors: .claude/skills"
          "    vendored:"
          sprintf "      - %s" probePath
          "    ownership:"
          sprintf "      - { path: %s, class: vendored, reason: synthetic plugin probe for the cross-check }" probePath
          "" ]

type RepoConfigValidateSteps() =
    let probePath = ".agents/skills/probe"
    let mutable canonicalText: string option = None
    let mutable codexEntryText: string option = None
    let mutable baselineText: string option = None
    let mutable workingText: string option = None
    let mutable lastValidation: (int * string) option = None

    let validateText (text: string) =
        let root =
            Path.Combine(Path.GetTempPath(), "rhino-repo-config-validate-e2e-" + Guid.NewGuid().ToString("N"))

        Directory.CreateDirectory root |> ignore
        initializeGitRepository root

        try
            File.WriteAllText(Path.Combine(root, "repo-config.yml"), text)
            runCli root
        finally
            Directory.Delete(root, true)

    let canonical () =
        canonicalText
        |> Option.defaultWith (fun () ->
            let text = File.ReadAllText(Path.Combine(repositoryRoot, "repo-config.yml"))
            canonicalText <- Some text
            text)

    let assertValid text context =
        let exitCode, output = validateText text
        Assert.True((exitCode = 0), sprintf "%s: %s" context output)

    let assertInvalid text context =
        let exitCode, output = validateText text
        Assert.NotEqual(0, exitCode)
        Assert.False(String.IsNullOrWhiteSpace output, context + " must explain the failure")
        output

    [<Given>]
    member _.``"rhino-cli repo-config validate" in each repo's pre-commit and pre-push/PR``() =
        canonicalText <- Some(File.ReadAllText(Path.Combine(repositoryRoot, "repo-config.yml")))

    [<When>]
    member _.``repo-config.yml is validated``() =
        lastValidation <- Some(validateText (canonical ()))

    [<Then>]
    member _.``the command strict-deserializes it against the canonical RepoConfig schema``() =
        let exitCode, output = Option.get lastValidation
        Assert.True((exitCode = 0), sprintf "canonical repo-config.yml failed validation: %s" output)

    [<Then>]
    member _.``it passes when only values differ``() =
        canonical ()
        |> replaceFirst "config: .opencode/opencode.json" "config: .opencode/opencode-alt.json"
        |> fun text -> assertValid text "value-only mutation changed the schema"

    [<Then>]
    member _.``it fails when a required key is missing or an unknown key is present``() =
        let text = canonical ()

        text
        |> replaceFirst
            (reindent text "  - name: claude-code\n")
            (reindent text "  - name: claude-code\n    unknown-key: true\n")
        |> fun value -> assertInvalid value "unknown harness key" |> ignore

        text
        |> replaceFirst
            (reindent text "  - name: claude-code\n    tier: source\n")
            (reindent text "  - name: claude-code\n")
        |> fun value -> assertInvalid value "missing harness tier" |> ignore

    [<Then>]
    member _.``running it independently against the byte-identical schema in both repos is equivalent to an identical key set across both repo-config.yml files``
        ()
        =
        let text = canonical ()

        text
        |> replaceFirst "config: .opencode/opencode.json" "config: .opencode/opencode-alt.json"
        |> fun value -> assertValid value "same keys with different values"

        text
        |> replaceFirst
            (reindent text "  - name: claude-code\n")
            (reindent text "  - name: claude-code\n    unknown-key: true\n")
        |> fun value -> assertInvalid value "different key set" |> ignore

    [<Given>]
    member _.``the canonical repo-config.yml``() =
        canonicalText <- Some(File.ReadAllText(Path.Combine(repositoryRoot, "repo-config.yml")))

    [<When>]
    member _.``the codex harness entry is inspected``() =
        codexEntryText <- Some(sliceHarnessEntry "codex" (canonical ()))

    [<Then>]
    member _.``it declares ".agents/skills" as a mirror of ".claude/skills"``() =
        let entry = Option.get codexEntryText
        Assert.Contains("skills-dir: .agents/skills", entry)
        Assert.Contains("skills-mirrors: .claude/skills", entry)
        assertValid (canonical ()) "canonical skills mirror declaration"

    [<Then>]
    member _.``it declares every vendored skill subdirectory``() =
        let mirror = Path.Combine(repositoryRoot, ".agents", "skills")
        let source = Path.Combine(repositoryRoot, ".claude", "skills")
        let entry = Option.get codexEntryText

        if Directory.Exists mirror then
            for directory in Directory.GetDirectories mirror do
                let name = Path.GetFileName directory

                if not (Directory.Exists(Path.Combine(source, name))) then
                    Assert.Contains("- .agents/skills/" + name, entry)

    [<Then>]
    member _.``each vendored entry names the plugin it came from``() =
        Option.get codexEntryText
        |> fun entry -> entry.Split('\n')
        |> Array.filter (fun line -> line.TrimStart().StartsWith("- .agents/skills/", StringComparison.Ordinal))
        |> Array.iter (fun line -> Assert.Contains("plugin", line.ToLowerInvariant()))

    [<Then>]
    member _.``the schema rejects a typo'd key inside the vendored declaration``() =
        let baseline =
            String.concat
                "\n"
                [ "harness:"
                  "  - name: probe"
                  "    tier: generated"
                  "    ownership:"
                  "      - { path: probe/path, class: vendored, reason: synthetic plugin probe }"
                  "" ]

        assertValid baseline "ownership baseline"

        baseline
        |> replaceFirst "reason:" "resaon:"
        |> fun value -> assertInvalid value "typo'd ownership key" |> ignore

    [<When>]
    member _.``the harness ownership declarations are inspected``() =
        assertValid (canonical ()) "canonical ownership declarations"

    [<Then>]
    member _.``every binding path a harness entry claims carries exactly one of the classes "generated", "vendored", or "source"``
        ()
        =
        let text = canonical ()

        let harnessEnd =
            text.IndexOf("\n" + registryIndent text + "harness-catalog:", StringComparison.Ordinal)

        let harnessText = text.Substring(0, harnessEnd)

        let ownershipLines =
            harnessText.Split('\n')
            |> Array.filter (fun line -> line.Contains(" class: ", StringComparison.Ordinal))

        Assert.NotEmpty ownershipLines

        for line in ownershipLines do
            Assert.True(
                line.Contains("class: generated", StringComparison.Ordinal)
                || line.Contains("class: vendored", StringComparison.Ordinal)
                || line.Contains("class: source", StringComparison.Ordinal),
                sprintf "unsupported ownership class: %s" line
            )

    [<Then>]
    member _.``a registry entry declaring a fourth class value fails to deserialize``() =
        canonical ()
        |> replaceFirst "class: source" "class: bespoke"
        |> fun value -> assertInvalid value "fourth ownership class" |> ignore

    [<Then>]
    member _.``a vendored declaration carrying an empty reason fails validation``() =
        let text = canonical ()

        let line =
            text.Split('\n')
            |> Array.find (fun value -> value.Contains("class: vendored", StringComparison.Ordinal))

        let reasonIndex = line.IndexOf("reason:", StringComparison.Ordinal)
        let blankReason = line.Substring(0, reasonIndex) + "reason: \"\" }"

        text
        |> replaceFirst line blankReason
        |> fun value -> assertInvalid value "empty vendored reason" |> ignore

    [<Then>]
    member _.``the canonical config carrying a non-empty reason on every vendored declaration exits 0``() =
        assertValid (canonical ()) "canonical vendored reasons"

    [<Given>]
    member _.``a synthetic registry entry whose skills-dir vendored path is declared in both hand-maintained lists``() =
        let text = syntheticConfigWithVendoredProbe probePath
        assertValid text "synthetic vendored baseline"
        baselineText <- Some text
        workingText <- Some text

    [<When>]
    member _.``the vendored: entry for that path is removed``() =
        workingText <- workingText |> Option.map (replaceFirst (sprintf "      - %s\n" probePath) "")

    [<Then>]
    member _.``rhino-cli repo-config validate fails naming the ownership path with no matching vendored entry``() =
        let output =
            assertInvalid (Option.get workingText) "ownership without vendored entry"

        Assert.Contains(probePath, output)
        Assert.Contains("no matching", output)

    [<Then>]
    member _.``it exits 0 once the vendored entry is restored, proving the check is falsifiable in both directions``() =
        assertValid (Option.get baselineText) "restored vendored entry"

    [<When>]
    member _.``the matching "class: vendored" ownership declaration for that path is changed to another class``() =
        workingText <- workingText |> Option.map (replaceFirst "class: vendored" "class: generated")

    [<Then>]
    member _.``rhino-cli repo-config validate fails naming the vendored entry with no matching ownership declaration``
        ()
        =
        let output =
            assertInvalid (Option.get workingText) "vendored entry without ownership"

        Assert.Contains(probePath, output)
        Assert.Contains("no matching", output)

    [<Then>]
    member _.``it exits 0 once the ownership declaration is restored to "class: vendored", proving the check is falsifiable in both directions``
        ()
        =
        assertValid (Option.get baselineText) "restored vendored ownership"

module private FeatureRunner =
    let private featurePath =
        Path.Combine(
            repositoryRoot,
            "specs",
            "apps",
            "rhino",
            "cli",
            "behaviours",
            "repo-config-validate",
            "repo-config-validate.feature"
        )

    let private extractScenario (featureLines: string[]) scenarioTitle =
        let featureLine =
            featureLines
            |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let startIndex =
            featureLines
            |> Array.findIndex (fun line -> line.Trim() = sprintf "Scenario: %s" scenarioTitle)

        let endIndex =
            featureLines
            |> Array.skip (startIndex + 1)
            |> Array.tryFindIndex (fun line ->
                let trimmed = line.Trim()

                trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
                || trimmed.StartsWith("Scenario Outline:", StringComparison.Ordinal))
            |> Option.map (fun offset -> startIndex + 1 + offset)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIndex .. endIndex - 1]

    let run scenarioTitle =
        let lines = File.ReadAllLines featurePath

        let feature =
            StepDefinitions([| typeof<RepoConfigValidateSteps> |])
                .GenerateFeature(featurePath, extractScenario lines scenarioTitle)

        (Seq.exactlyOne feature.Scenarios).Action.Invoke()

[<Fact>]
let ``A schema-parity gate enforces the identical key set`` () =
    FeatureRunner.run "A schema-parity gate enforces the identical key set"

[<Fact>]
let ``The registry declares the Codex skills mirror and its vendored exclusions`` () =
    FeatureRunner.run "The registry declares the Codex skills mirror and its vendored exclusions"

[<Fact>]
let ``There is no fourth ownership class and no undeclared reason`` () =
    FeatureRunner.run "There is no fourth ownership class and no undeclared reason"

[<Fact>]
let ``A vendored ownership declaration under skills-dir requires a matching vendored entry`` () =
    FeatureRunner.run "A vendored ownership declaration under skills-dir requires a matching vendored entry"

[<Fact>]
let ``A vendored entry under skills-dir requires a matching ownership declaration`` () =
    FeatureRunner.run "A vendored entry under skills-dir requires a matching ownership declaration"
