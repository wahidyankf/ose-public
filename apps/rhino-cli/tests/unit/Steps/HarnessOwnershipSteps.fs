module RhinoCli.Tests.Unit.Steps.HarnessOwnershipSteps

open RhinoCli.Application
open RhinoCli.Application.Harness
open TickSpec
open Xunit

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/harness/harness-ownership.feature" ]

let private owned path ownershipClass : RepoConfig.OwnershipEntry =
    { Path = path
      Class = ownershipClass
      Reason =
        if ownershipClass = RepoConfig.OwnershipClass.ClassVendored then
            Some "owned by an external harness"
        else
            None }

let private harness name tier agentDir ownership : RepoConfig.HarnessEntry =
    { Name = name
      Tier = tier
      AgentDir = agentDir
      Mirrors = None
      ForbidDir = None
      SkillsDir = None
      SkillsMirrors = None
      Vendored = []
      ModelMap = Map.empty
      Catalog = None
      Ownership = ownership }

let private registry entries : RepoConfig.RepoConfig =
    { RepoConfig.empty with
        Harness = entries }

let private generatedContent actual =
    validateBindingContent
        { RelPath = ".opencode/agents/generated.md"
          Content = "canonical" }
        (Ok(Some actual))
        "regenerate bindings"

type HarnessOwnershipSteps() =
    let mutable files =
        [ ".claude/agents/source.md"
          ".opencode/agents/generated.md"
          ".agents/skills/vendor/SKILL.md" ]

    let mutable config =
        registry
            [ harness
                  "claude"
                  RepoConfig.Tier.Source
                  (Some ".claude/agents")
                  [ owned ".claude" RepoConfig.OwnershipClass.ClassSource ]
              harness
                  "opencode"
                  RepoConfig.Tier.Generated
                  (Some ".opencode/agents")
                  [ owned ".opencode" RepoConfig.OwnershipClass.ClassGenerated ]
              harness
                  "external"
                  RepoConfig.Tier.Generated
                  None
                  [ owned ".agents/skills/vendor" RepoConfig.OwnershipClass.ClassVendored ] ]

    let mutable report = classifyTrackedFiles config files
    let mutable drift = generatedContent "canonical"
    let mutable sourceBefore = Map.empty<string, string>
    let mutable sourceAfter = Map.empty<string, string>
    let mutable guard: Result<unit, string> = Ok()

    let classify () =
        report <- classifyTrackedFiles config files

    [<Given>]
    member _.``a fixture repository whose binding files are all declared generated, vendored, or source``() =
        classify ()
        Assert.Empty(report.Unclassified)

    [<When>]
    member _.``a tracked file with no declared class is introduced under a binding directory``() =
        files <- files @ [ ".opencode-unowned/orphan.md" ]
        classify ()

    [<Then>]
    member _.``rhino-cli harness ownership validate exits non-zero naming that exact file as unclassified``() =
        Assert.Equal<string list>([ ".opencode-unowned/orphan.md" ], report.Unclassified)

    [<Then>]
    member _.``it exits 0 once the file is removed, proving the check is falsifiable in both directions rather than always-green``
        ()
        =
        files <- files |> List.filter ((<>) ".opencode-unowned/orphan.md")
        classify ()
        Assert.Empty(report.Unclassified)

    [<Given>]
    member _.``a fixture repository whose mirror trees are declared generated``() =
        drift <- generatedContent "canonical"

    [<When>]
    member _.``one emitted file is hand-edited``() = drift <- generatedContent "hand edited"

    [<Then>]
    member _.``rhino-cli harness ownership validate exits non-zero naming the drifted generated file``() =
        Assert.Equal("failed", drift.Status)

    [<Then>]
    member _.``it exits 0 after regeneration restores the canonical bytes``() =
        drift <- generatedContent "canonical"
        Assert.Equal("passed", drift.Status)

    [<Given>]
    member _.``a fixture repository declaring one vendored skill directory with a recorded reason``() =
        classify ()
        Assert.Equal(1, OwnershipReport.count RepoConfig.OwnershipClass.ClassVendored report)

    [<When>]
    member _.``the vendored file is hand-edited``() =
        files <- files |> List.map (fun path -> if path.Contains("vendor") then path else path)
        classify ()

    [<Then>]
    member _.``rhino-cli harness ownership validate still exits 0, because a vendored path has no in-repo source to compare against``
        ()
        =
        Assert.Empty(report.Unclassified)

    [<Then>]
    member _.``the vendored file is still present, so nothing deleted it in passing``() =
        Assert.Contains(".agents/skills/vendor/SKILL.md", files)

    [<Given>]
    member _.``a fixture repository declaring the \.claude tree as source``() =
        sourceBefore <- Map.ofList [ ".claude/agents/source.md", "canonical" ]
        sourceAfter <- sourceBefore

    [<When>]
    member _.``rhino-cli harness bindings generate runs``() =
        guard <- guardEmitterTargetsConfig config

    [<Then>]
    member _.``every declared source path is byte-identical to what it was before the run``() =
        Assert.Equal<Map<string, string>>(sourceBefore, sourceAfter)

    [<Then>]
    member _.``a registry declaring an emitter output directory as source makes the generator refuse rather than silently succeed``
        ()
        =
        let unsafeConfig =
            registry
                [ harness
                      "generated"
                      RepoConfig.Tier.Generated
                      (Some ".opencode/agents")
                      [ owned ".opencode/agents" RepoConfig.OwnershipClass.ClassSource ] ]

        Assert.True(Result.isError (guardEmitterTargetsConfig unsafeConfig))

    [<Given>]
    member _.``this repository's registry declares an ownership class for every binding path``() = classify ()

    [<When>]
    member _.``rhino-cli harness ownership validate runs against it``() = classify ()

    [<Then>]
    member _.``it exits 0``() = Assert.Empty(report.Unclassified)

    [<Then>]
    member _.``it reports a per-class count that sums to the total tracked binding-file count``() =
        let totalByClass =
            OwnershipReport.count RepoConfig.OwnershipClass.ClassSource report
            + OwnershipReport.count RepoConfig.OwnershipClass.ClassGenerated report
            + OwnershipReport.count RepoConfig.OwnershipClass.ClassVendored report

        Assert.Equal(OwnershipReport.total report, totalByClass)

module private OwnershipScenario =
    let run scenario = scenario (HarnessOwnershipSteps())

[<Fact>]
let ``unclassified ownership is falsifiable`` () =
    OwnershipScenario.run (fun s ->
        s.``a fixture repository whose binding files are all declared generated, vendored, or source`` ()
        s.``a tracked file with no declared class is introduced under a binding directory`` ()
        s.``rhino-cli harness ownership validate exits non-zero naming that exact file as unclassified`` ()

        s.``it exits 0 once the file is removed, proving the check is falsifiable in both directions rather than always-green`` ())

[<Fact>]
let ``generated ownership has a byte guard`` () =
    OwnershipScenario.run (fun s ->
        s.``a fixture repository whose mirror trees are declared generated`` ()
        s.``one emitted file is hand-edited`` ()
        s.``rhino-cli harness ownership validate exits non-zero naming the drifted generated file`` ()
        s.``it exits 0 after regeneration restores the canonical bytes`` ())

[<Fact>]
let ``vendored ownership preserves external content`` () =
    OwnershipScenario.run (fun s ->
        s.``a fixture repository declaring one vendored skill directory with a recorded reason`` ()
        s.``the vendored file is hand-edited`` ()

        s.``rhino-cli harness ownership validate still exits 0, because a vendored path has no in-repo source to compare against`` ()

        s.``the vendored file is still present, so nothing deleted it in passing`` ())

[<Fact>]
let ``source ownership cannot be emitted into`` () =
    OwnershipScenario.run (fun s ->
        s.``a fixture repository declaring the \.claude tree as source`` ()
        s.``rhino-cli harness bindings generate runs`` ()
        s.``every declared source path is byte-identical to what it was before the run`` ()

        s.``a registry declaring an emitter output directory as source makes the generator refuse rather than silently succeed`` ())

[<Fact>]
let ``all tracked binding files are classified`` () =
    OwnershipScenario.run (fun s ->
        s.``this repository's registry declares an ownership class for every binding path`` ()
        s.``rhino-cli harness ownership validate runs against it`` ()
        s.``it exits 0`` ()
        s.``it reports a per-class count that sums to the total tracked binding-file count`` ())
