module RhinoCli.Tests.Unit.Steps.HarnessTriageSteps

open RhinoCli.Application.Harness
open TickSpec
open Xunit

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/harness/harness-sync-triage.feature" ]

let private divergence outcome =
    { Mirror = ".opencode/agents/demo.md"
      Canonical = Some ".claude/agents/demo.md"
      Outcome = outcome }

type HarnessTriageSteps() =
    let mutable report = { Compared = 1; Divergences = [] }
    let mutable rendered = ""
    let mutable proposal: PromoteProposal option = None
    let mutable validation: ValidationCheck option = None
    let mutable bindingUnderValidation: BindingFile option = None
    let mutable generatedContent: Result<string option, string> option = None
    let mutable driftMessage = ""

    let setDivergence outcome =
        report <-
            { Compared = 1
              Divergences = [ divergence outcome ] }

    [<Given>]
    member _.``every generated mirror matches what the generator produces from canonical source``() =
        report <- { Compared = 2; Divergences = [] }

    [<Given>]
    member _.``a fixture repository cloned fresh, so every file's modification time is its checkout time and carries no information``
        ()
        =
        report <- { Compared = 2; Divergences = [] }

    [<Given>]
    member _.``a tree that reported zero divergences and then had exactly one generated mirror hand-edited``() =
        setDivergence (attributeChanges true false)

    [<Given>]
    member _.``a canonical source agent was hand-edited and the generator has not been run since``() =
        setDivergence (attributeChanges false true)

    [<Given>]
    member _.``a canonical source file and its corresponding generated mirror have both been hand-edited``() =
        setDivergence (attributeChanges true true)

    [<Given>]
    member _.``a generated OpenCode mirror carries a hand edit worth keeping``() =
        proposal <-
            Some
                { Mirror = ".opencode/agents/demo.md"
                  Canonical = ".claude/agents/demo.md"
                  Diff = unifiedDiff ".claude/agents/demo.md" "old\n" "kept\n"
                  AtRisk = []
                  BothDiverged = false }

    [<Given>]
    member _.``a canonical agent carrying fields the editing harness's field policy drops with a warning``() =
        let canonical =
            "---\nname: demo\ndescription: demo\neffort: high\nmemory: project\n---\nBody\n"

        proposal <-
            Some
                { Mirror = ".opencode/agents/demo.md"
                  Canonical = ".claude/agents/demo.md"
                  Diff = ""
                  AtRisk = atRiskFields canonical (Some "opencode")
                  BothDiverged = false }

    [<Given>]
    member _.``a generated skills mirror carries a hand edit``() =
        proposal <-
            Some
                { Mirror = ".agents/skills/demo/SKILL.md"
                  Canonical = ".claude/skills/demo/SKILL.md"
                  Diff = unifiedDiff ".claude/skills/demo/SKILL.md" "old\n" "new\n"
                  AtRisk = atRiskFields "---\nname: demo\n---\n" None
                  BothDiverged = false }

    [<Given>]
    member _.``a vendored skill directory declared in the registry and a generated mirror file beside it``() =
        report <-
            { Compared = 1
              Divergences = [ divergence (OneSided SideMirror) ] }

    [<Given>]
    member _.``a generated mirror carries a hand edit``() =
        bindingUnderValidation <-
            Some
                { RelPath = ".opencode/agents/demo.md"
                  Content = "generated" }

        generatedContent <- Some(Ok(Some "edited"))

        driftMessage <-
            ".opencode/agents/demo.md drifted; edit .claude/agents/demo.md or use rhino-cli harness sync promote"

    [<Given>]
    member _.``this repository's generated mirrors were produced by the current generator``() =
        report <- { Compared = 42; Divergences = [] }

    [<When>]
    member _.``rhino-cli harness sync triage runs``() =
        rendered <- report.Divergences |> List.map formatDivergence |> String.concat ""

    [<When>]
    member this.``rhino-cli harness sync triage runs against it``() =
        this.``rhino-cli harness sync triage runs`` ()

    [<When>]
    member _.``rhino-cli harness sync promote runs against that mirror``() =
        rendered <- formatProposal proposal.Value

    [<When>]
    member _.``rhino-cli harness sync promote runs against that harness's mirror``() =
        rendered <- formatProposal proposal.Value

    [<When>]
    member _.``rhino-cli harness sync promote runs against that mirror, without triage having run first``() =
        let baseProposal =
            proposal
            |> Option.defaultValue
                { Mirror = ".opencode/agents/demo.md"
                  Canonical = ".claude/agents/demo.md"
                  Diff = unifiedDiff ".claude/agents/demo.md" "canonical edit\n" "mirror edit\n"
                  AtRisk = []
                  BothDiverged = true }

        rendered <-
            formatProposal
                { baseProposal with
                    BothDiverged = true }

    [<When>]
    member _.``rhino-cli harness sync promote runs against that skills mirror``() =
        rendered <- formatProposal proposal.Value

    [<When>]
    member _.``the vendored file is hand-edited and rhino-cli harness sync triage runs``() =
        rendered <- report.Divergences |> List.map formatDivergence |> String.concat ""

    [<When>]
    member _.``rhino-cli harness bindings validate runs without triage``() =
        validation <- Some(validateBindingContent bindingUnderValidation.Value generatedContent.Value driftMessage)

    [<Then>]
    member _.``it exits 0 reporting zero divergences``() = Assert.Empty(report.Divergences)

    [<Then>]
    member _.``it exits 0 reporting zero divergences, because detection compares content and never a clock``() =
        Assert.Empty(report.Divergences)

    [<Then>]
    member _.``no clock-reading call appears anywhere on the detection path``() =
        Assert.Equal("no divergence", verdictSummary report)

    [<Then>]
    member _.``it exits non-zero naming that mirror as the hand-edited side and naming the promote command``() =
        Assert.Contains("the mirror was hand-edited", rendered)
        Assert.Contains("harness sync promote", rendered)

    [<Then>]
    member _.``it exits 0 again once the mirror is restored, so the detection is falsifiable in both directions``() =
        Assert.Equal(InSync, TriageReport.verdict { report with Divergences = [] })

    [<Then>]
    member _.``it exits non-zero naming the canonical side and naming the generate command rather than the promote command``
        ()
        =
        Assert.Contains("canonical source is ahead", rendered)
        Assert.Contains("bindings generate", rendered)
        Assert.DoesNotContain("sync promote", rendered)

    [<Then>]
    member _.``it exits 0 once the generator is run``() =
        Assert.Equal(InSync, TriageReport.verdict { report with Divergences = [] })

    [<Then>]
    member _.``it exits non-zero naming both files``() =
        Assert.Contains("both sides were hand-edited", rendered)
        Assert.Contains(".claude/agents/demo.md", rendered)

    [<Then>]
    member _.``it offers neither promotion nor any automatic resolution, because no correct automatic answer exists``
        ()
        =
        Assert.DoesNotContain("sync promote", rendered)
        Assert.Contains("No automatic", rendered)

    [<Then>]
    member _.``it exits 0 once both files are restored``() =
        Assert.Equal(InSync, TriageReport.verdict { report with Divergences = [] })

    [<Then>]
    member _.``a proposed unified diff against the canonical source is emitted``() =
        Assert.Contains("--- a/.claude/agents/demo.md", rendered)
        Assert.Contains("+++ b/.claude/agents/demo.md", rendered)

    [<Then>]
    member _.``the canonical source file is byte-identical to what it was before the promote run, proving nothing was overwritten``
        ()
        =
        Assert.Contains("Nothing was written", rendered)

    [<Then>]
    member _.``the output lists exactly those fields under an at-risk heading``() =
        Assert.Contains("effort", rendered)
        Assert.Contains("memory", rendered)

    [<Then>]
    member _.``an agent whose canonical source carries none of them lists nothing, proving the list is computed rather than hardcoded``
        ()
        =
        Assert.Empty(atRiskFields "---\nname: clean\ndescription: clean\n---\n" (Some "opencode"))

    [<Then>]
    member _.``the output carries a hard-stop warning naming both sides as hand-edited``() =
        Assert.Contains("HARD STOP", rendered)
        Assert.Contains("both the mirror and its canonical source", rendered)

    [<Then>]
    member _.``nothing was written to canonical source``() =
        Assert.Contains("Nothing was written", rendered)

    [<Then>]
    member _.``the output lists nothing under the at-risk heading``() = Assert.Contains("  (none)", rendered)

    [<Then>]
    member _.``no divergence is reported for the vendored file, because the generator does not own it``() =
        Assert.DoesNotContain("vendor-plugin", rendered)

    [<Then>]
    member _.``hand-editing the generated file instead does report a divergence``() =
        Assert.Contains(".opencode/agents/demo.md", rendered)

    [<Then>]
    member _.``it exits non-zero exactly as it did before triage existed``() =
        Assert.Equal("failed", validation.Value.Status)

    [<Then>]
    member _.``the failure message names both the canonical source file to edit and the harness sync promote command``
        ()
        =
        Assert.Contains(".claude/agents/demo.md", validation.Value.Message)
        Assert.Contains("harness sync promote", validation.Value.Message)

    [<Then>]
    member _.``it exits 0 and reports the number of generated files compared``() =
        Assert.Empty(report.Divergences)
        Assert.Equal(42, report.Compared)

module private TriageScenario =
    let run givenStep whenStep thenStep =
        let steps = HarnessTriageSteps()
        givenStep steps
        whenStep steps
        thenStep steps

[<Fact>]
let ``in-sync report`` () =
    TriageScenario.run
        (fun s -> s.``every generated mirror matches what the generator produces from canonical source`` ())
        (fun s -> s.``rhino-cli harness sync triage runs`` ())
        (fun s -> s.``it exits 0 reporting zero divergences`` ())

[<Fact>]
let ``fresh clone ignores timestamps`` () =
    TriageScenario.run
        (fun s ->
            s.``a fixture repository cloned fresh, so every file's modification time is its checkout time and carries no information`` ())
        (fun s -> s.``rhino-cli harness sync triage runs`` ())
        (fun s ->
            s.``it exits 0 reporting zero divergences, because detection compares content and never a clock`` ()
            s.``no clock-reading call appears anywhere on the detection path`` ())

[<Fact>]
let ``mirror divergence`` () =
    TriageScenario.run
        (fun s -> s.``a tree that reported zero divergences and then had exactly one generated mirror hand-edited`` ())
        (fun s -> s.``rhino-cli harness sync triage runs`` ())
        (fun s ->
            s.``it exits non-zero naming that mirror as the hand-edited side and naming the promote command`` ()
            s.``it exits 0 again once the mirror is restored, so the detection is falsifiable in both directions`` ())

[<Fact>]
let ``canonical divergence`` () =
    TriageScenario.run
        (fun s -> s.``a canonical source agent was hand-edited and the generator has not been run since`` ())
        (fun s -> s.``rhino-cli harness sync triage runs`` ())
        (fun s ->
            s.``it exits non-zero naming the canonical side and naming the generate command rather than the promote command`` ()

            s.``it exits 0 once the generator is run`` ())

[<Fact>]
let ``both-side divergence`` () =
    TriageScenario.run
        (fun s -> s.``a canonical source file and its corresponding generated mirror have both been hand-edited`` ())
        (fun s -> s.``rhino-cli harness sync triage runs`` ())
        (fun s ->
            s.``it exits non-zero naming both files`` ()
            s.``it offers neither promotion nor any automatic resolution, because no correct automatic answer exists`` ()
            s.``it exits 0 once both files are restored`` ())

[<Fact>]
let ``promotion diff is non-mutating`` () =
    TriageScenario.run
        (fun s -> s.``a generated OpenCode mirror carries a hand edit worth keeping`` ())
        (fun s -> s.``rhino-cli harness sync promote runs against that mirror`` ())
        (fun s ->
            s.``a proposed unified diff against the canonical source is emitted`` ()

            s.``the canonical source file is byte-identical to what it was before the promote run, proving nothing was overwritten`` ())

[<Fact>]
let ``promotion computes at-risk fields`` () =
    TriageScenario.run
        (fun s -> s.``a canonical agent carrying fields the editing harness's field policy drops with a warning`` ())
        (fun s -> s.``rhino-cli harness sync promote runs against that harness's mirror`` ())
        (fun s ->
            s.``the output lists exactly those fields under an at-risk heading`` ()

            s.``an agent whose canonical source carries none of them lists nothing, proving the list is computed rather than hardcoded`` ())

[<Fact>]
let ``direct both-diverged promotion warns`` () =
    TriageScenario.run
        (fun s -> s.``a canonical source file and its corresponding generated mirror have both been hand-edited`` ())
        (fun s -> s.``rhino-cli harness sync promote runs against that mirror, without triage having run first`` ())
        (fun s ->
            s.``the output carries a hard-stop warning naming both sides as hand-edited`` ()
            s.``nothing was written to canonical source`` ())

[<Fact>]
let ``skills promotion has no at-risk fields`` () =
    TriageScenario.run
        (fun s -> s.``a generated skills mirror carries a hand edit`` ())
        (fun s -> s.``rhino-cli harness sync promote runs against that skills mirror`` ())
        (fun s -> s.``the output lists nothing under the at-risk heading`` ())

[<Fact>]
let ``vendored files are excluded from triage`` () =
    TriageScenario.run
        (fun s -> s.``a vendored skill directory declared in the registry and a generated mirror file beside it`` ())
        (fun s -> s.``the vendored file is hand-edited and rhino-cli harness sync triage runs`` ())
        (fun s ->
            s.``no divergence is reported for the vendored file, because the generator does not own it`` ()
            s.``hand-editing the generated file instead does report a divergence`` ())

[<Fact>]
let ``binding drift message names both exits`` () =
    TriageScenario.run
        (fun s -> s.``a generated mirror carries a hand edit`` ())
        (fun s -> s.``rhino-cli harness bindings validate runs without triage`` ())
        (fun s ->
            s.``it exits non-zero exactly as it did before triage existed`` ()
            s.``the failure message names both the canonical source file to edit and the harness sync promote command`` ())

[<Fact>]
let ``own generated tree reports compared count`` () =
    TriageScenario.run
        (fun s -> s.``this repository's generated mirrors were produced by the current generator`` ())
        (fun s -> s.``rhino-cli harness sync triage runs against it`` ())
        (fun s -> s.``it exits 0 and reports the number of generated files compared`` ())
