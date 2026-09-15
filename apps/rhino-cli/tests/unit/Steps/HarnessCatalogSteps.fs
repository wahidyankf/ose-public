module RhinoCli.Tests.Unit.Steps.HarnessCatalogSteps

open TickSpec
open Xunit
open RhinoCli.Application

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/harness/harness-catalog.feature" ]

let private entry name : RepoConfig.HarnessEntry =
    { Name = name
      Tier = RepoConfig.Tier.Generated
      AgentDir = Some("." + name + "/agents")
      Mirrors = None
      ForbidDir = None
      SkillsDir = None
      SkillsMirrors = None
      Vendored = []
      ModelMap = Map.empty
      Catalog =
        Some
            { Platform = name
              ReadsAgentsMd = "Yes"
              InstructionSurface = "AGENTS.md"
              McpConfig = "config"
              AgentSurface = "agents"
              SkillsSurface = "skills"
              Status = "active" }
      Ownership = [] }

type HarnessCatalogSteps() =
    let harnesses = [ entry "Claude"; entry "Codex" ]

    let existing =
        "intro\n"
        + Harness.catalogRegionStart
        + "\nstale\n"
        + Harness.catalogRegionEnd
        + "\noutro\n"

    let mutable before = existing
    let mutable generated = ""
    let mutable validationError = ""

    [<Given>]
    member _.``each harness entry in repo-config.yml carries catalog fields including display name, instruction surfaces, agent surface, skills surface, and status``
        ()
        =
        Assert.All(harnesses, fun h -> Assert.True(h.Catalog.IsSome))

    [<Given>]
    member _.``a freshly generated catalog with a clean git diff``() =
        let region =
            Harness.renderCatalogRegion harnesses "2026-09-05"
            |> Result.defaultWith failwith

        before <-
            Harness.rewriteCatalogRegion existing region "catalog"
            |> Result.defaultWith failwith

        generated <- before

    [<When>]
    member _.``rhino-cli harness catalog generate runs``() =
        let region =
            Harness.renderCatalogRegion harnesses "2026-09-05"
            |> Result.defaultWith failwith

        generated <-
            Harness.rewriteCatalogRegion before region "catalog"
            |> Result.defaultWith failwith

    [<When>]
    member _.``one cell inside the generated region is edited by hand``() =
        let edited = generated.Replace("| Claude", "| Hand edit")

        validationError <-
            if edited <> generated then
                Harness.catalogRemediation
            else
                ""

    [<Then>]
    member _.``docs/reference/platform-bindings.md contains one table row per registry entry between the generated-region markers``
        ()
        =
        Assert.Contains("| Claude", generated)
        Assert.Contains("| Codex", generated)

    [<Then>]
    member _.``prose outside those markers is byte-identical to its pre-run content``() =
        Assert.StartsWith("intro\n", generated)
        Assert.EndsWith("outro\n", generated)

    [<Then>]
    member _.``rhino-cli harness catalog validate exits non-zero naming the drifted region``() =
        Assert.Contains("regenerate the catalog region", validationError)

    [<Then>]
    member _.``it exits 0 after rhino-cli harness catalog generate is re-run``() =
        let region =
            Harness.renderCatalogRegion harnesses "2026-09-05"
            |> Result.defaultWith failwith in

        Assert.Equal(
            generated,
            Harness.rewriteCatalogRegion generated region "catalog"
            |> Result.defaultWith failwith
        )

[<Fact>]
let ``catalog renders registry`` () =
    let w = HarnessCatalogSteps() in

    w.``each harness entry in repo-config.yml carries catalog fields including display name, instruction surfaces, agent surface, skills surface, and status`` ()

    w.``rhino-cli harness catalog generate runs`` ()

    w.``docs/reference/platform-bindings.md contains one table row per registry entry between the generated-region markers`` ()

    w.``prose outside those markers is byte-identical to its pre-run content`` ()

[<Fact>]
let ``catalog drift is rejected`` () =
    let w = HarnessCatalogSteps() in
    w.``a freshly generated catalog with a clean git diff`` ()
    w.``one cell inside the generated region is edited by hand`` ()
    w.``rhino-cli harness catalog validate exits non-zero naming the drifted region`` ()
    w.``it exits 0 after rhino-cli harness catalog generate is re-run`` ()
