/// Pure TickSpec bindings for the active specification corpus.
module RhinoCli.Tests.Unit.Steps.SpecsSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/specs/specs-audit.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-adoption.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-counts.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-links.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-logical-corpus.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-tree.feature" ]

open System
open System.IO
open TickSpec
open Xunit
open RhinoCli.Application.Specs

type SpecsSteps() =
    let mutable directories: Set<string> = Set.empty
    let mutable files: Map<string, string> = Map.empty
    let mutable findings: SpecFinding list = []
    let mutable output = ""
    let mutable exitCode = 0

    let addDirectory path = directories <- Set.add path directories
    let addFile path content = files <- Map.add path content files

    let addCorpus root withReadme withBehaviours withFeature withBehavioursReadme =
        addDirectory root
        addFile (root + "/architecture.md") "# Architecture\n"

        if withReadme then
            addFile (root + "/README.md") "# Index\n"

        if withBehaviours then
            addDirectory (root + "/behaviours")

            if withBehavioursReadme then
                addFile (root + "/behaviours/README.md") "# Behaviours\n"

            if withFeature then
                addFile
                    (root + "/behaviours/example.feature")
                    "Feature: Example\n\n  Scenario: Works\n    Given a state\n    When it runs\n    Then it passes\n"

    let addRetiredFolders app =
        addDirectory (sprintf "specs/apps/%s" app)

        [ "product"; "system-context"; "containers"; "components"; "behavior" ]
        |> List.iter (fun folder -> addDirectory (sprintf "specs/apps/%s/%s" app folder))

    let tree () =
        { Directories = directories
          Files = files }

    let record app result =
        findings <- result
        output <- formatSpecFindingsText app result
        exitCode <- if List.isEmpty result then 0 else 1

    member private _.HandleGiven(step: string) =
        match step with
        | "a repository with no spec-tree violations" ->
            addDirectory "specs/apps/testapp"
            addCorpus "specs/apps/testapp/cli" true true true true
        | text when text.Contains("with an owner corpus and no ddd tree", StringComparison.Ordinal) ->
            addDirectory "specs/apps/testapp"
            addCorpus "specs/apps/testapp/cli" true true true true
        | text when text.Contains("with an owner corpus and a retired ddd tree", StringComparison.Ordinal) ->
            addDirectory "specs/apps/testapp"
            addDirectory "specs/apps/testapp/ddd"
            addCorpus "specs/apps/testapp/cli" true true true true
        | text when text.Contains("holding only the retired five folders", StringComparison.Ordinal) ->
            addRetiredFolders "testapp"
        | text when text.Contains("whose one owner corpus is complete", StringComparison.Ordinal) ->
            addDirectory "specs/apps/testapp"
            addCorpus "specs/apps/testapp/cli" true true true true
        | text when text.Contains("library corpus", StringComparison.Ordinal) ->
            addDirectory "specs/libs/testlib"
            let indexed = not (text.Contains("has no README.md", StringComparison.Ordinal))
            addCorpus "specs/libs/testlib" true true true indexed
        | text when text.Contains("all internal markdown links resolve", StringComparison.Ordinal) ->
            addDirectory "specs/apps/testapp"
            addFile "specs/apps/testapp/README.md" "[target](./target.md)\n"
            addFile "specs/apps/testapp/target.md" "# Target\n"
        | text when text.Contains("broken internal link", StringComparison.Ordinal) ->
            addDirectory "specs/apps/testapp"
            addFile "specs/apps/testapp/README.md" "![missing](./missing.png)\n"
        | text when text.Contains("only markdown files with external HTTPS links", StringComparison.Ordinal) ->
            addDirectory "specs/apps/testapp"
            addFile "specs/apps/testapp/README.md" "[external](https://example.com)\n"
        | text when text.Contains("with its README, architecture, and a behaviours feature", StringComparison.Ordinal) ->
            addDirectory "specs/apps/testapp"
            addCorpus "specs/apps/testapp/cli" true true true true
        | text when text.Contains("whose README.md is absent", StringComparison.Ordinal) ->
            addDirectory "specs/apps/testapp"
            addCorpus "specs/apps/testapp/cli" false true true true
        | text when text.Contains("whose behaviours directory is absent", StringComparison.Ordinal) ->
            addDirectory "specs/apps/testapp"
            addCorpus "specs/apps/testapp/cli" true false false false
        | text when text.Contains("whose behaviours directory holds no feature file", StringComparison.Ordinal) ->
            addDirectory "specs/apps/testapp"
            addCorpus "specs/apps/testapp/cli" true true false true
        | text when text.Contains("whose behaviours directory has no README.md", StringComparison.Ordinal) ->
            addDirectory "specs/apps/testapp"
            addCorpus "specs/apps/testapp/cli" true true true false
        | text when text.Contains("beside a surviving \"product\" folder", StringComparison.Ordinal) ->
            addDirectory "specs/apps/testapp"
            addDirectory "specs/apps/testapp/product"
            addCorpus "specs/apps/testapp/cli" true true true true
        | text when
            text.Contains("no spec tree", StringComparison.Ordinal)
            || text.Contains("no directory exists", StringComparison.Ordinal)
            ->
            ()
        | unknown -> failwithf "unhandled Specs Given: %s" unknown

    member private _.HandleWhen(step: string) =
        if step.Contains("specs audit", StringComparison.Ordinal) then
            let outcome = runSpecsAudit [] (fun _ -> Ok())
            output <- outcome.Summary
            exitCode <- if outcome.Passed then 0 else 1
        elif step.Contains("counts validate", StringComparison.Ordinal) then
            let folder =
                if step.Contains("specs/libs/testlib", StringComparison.Ordinal) then
                    "specs/libs/testlib"
                elif step.Contains("nosuchapp", StringComparison.Ordinal) then
                    "specs/apps/nosuchapp"
                else
                    "specs/apps/testapp"

            record folder (validateSpecCountsTree (tree ()) folder)
        elif step.Contains("md links validate", StringComparison.Ordinal) then
            let folder =
                if step.Contains("nosuchapp", StringComparison.Ordinal) then
                    "specs/apps/nosuchapp"
                else
                    "specs/apps/testapp"

            record folder (validateSpecLinksTree (tree ()) folder)

            if List.isEmpty findings then
                output <- "All links valid! No broken links found.\n"
        elif step.Contains("structure validate", StringComparison.Ordinal) then
            let app =
                if step.Contains("unknownapp", StringComparison.Ordinal) then
                    "unknownapp"
                else
                    "testapp"

            record app (validateSpecAdoptionTree (tree ()) app @ validateSpecTreeEntries (tree ()) app)
        else
            failwithf "unhandled Specs When: %s" step

    member private _.HandleThen(step: string) =
        match step with
        | "the command exits successfully" -> Assert.Equal(0, exitCode)
        | "the command exits with a failure code" -> Assert.NotEqual(0, exitCode)
        | text when text.StartsWith("the output contains \"", StringComparison.Ordinal) ->
            let expected = text.Substring(21, text.Length - 22)
            Assert.Contains(expected, output, StringComparison.Ordinal)
        | unknown -> failwithf "unhandled Specs Then: %s" unknown

    // GENERATED EXACT BINDINGS START
    [<Given>]
    member this.``a library corpus at "specs/libs/testlib" carrying architecture\.md and a non-empty behaviours/``() =
        this.HandleGiven(
            "a library corpus at \"specs/libs/testlib\" carrying architecture.md and a non-empty behaviours/"
        )

    [<Given>]
    member this.``a library corpus at "specs/libs/testlib" whose behaviours/ folder has no README\.md``() =
        this.HandleGiven("a library corpus at \"specs/libs/testlib\" whose behaviours/ folder has no README.md")

    [<Given>]
    member this.``a logical owner corpus for "testapp" at "cli" beside a surviving "product" folder``() =
        this.HandleGiven("a logical owner corpus for \"testapp\" at \"cli\" beside a surviving \"product\" folder")

    [<Given>]
    member this.``a logical owner corpus for "testapp" at "cli" whose README\.md is absent``() =
        this.HandleGiven("a logical owner corpus for \"testapp\" at \"cli\" whose README.md is absent")

    [<Given>]
    member this.``a logical owner corpus for "testapp" at "cli" whose behaviours directory has no README\.md``() =
        this.HandleGiven(
            "a logical owner corpus for \"testapp\" at \"cli\" whose behaviours directory has no README.md"
        )

    [<Given>]
    member this.``a logical owner corpus for "testapp" at "cli" whose behaviours directory holds no feature file``() =
        this.HandleGiven(
            "a logical owner corpus for \"testapp\" at \"cli\" whose behaviours directory holds no feature file"
        )

    [<Given>]
    member this.``a logical owner corpus for "testapp" at "cli" whose behaviours directory is absent``() =
        this.HandleGiven("a logical owner corpus for \"testapp\" at \"cli\" whose behaviours directory is absent")

    [<Given>]
    member this.``a logical owner corpus for "testapp" at "cli" with its README, architecture, and a behaviours feature``
        ()
        =
        this.HandleGiven(
            "a logical owner corpus for \"testapp\" at \"cli\" with its README, architecture, and a behaviours feature"
        )

    [<Given>]
    member this.``a repository with no spec-tree violations``() =
        this.HandleGiven("a repository with no spec-tree violations")

    [<Given>]
    member this.``a spec folder at "specs/apps/testapp" containing a markdown file with a broken internal link``() =
        this.HandleGiven(
            "a spec folder at \"specs/apps/testapp\" containing a markdown file with a broken internal link"
        )

    [<Given>]
    member this.``a spec folder at "specs/apps/testapp" containing only markdown files with external HTTPS links``() =
        this.HandleGiven(
            "a spec folder at \"specs/apps/testapp\" containing only markdown files with external HTTPS links"
        )

    [<Given>]
    member this.``a spec folder at "specs/apps/testapp" where all internal markdown links resolve to existing files``
        ()
        =
        this.HandleGiven(
            "a spec folder at \"specs/apps/testapp\" where all internal markdown links resolve to existing files"
        )

    [<Given>]
    member this.``a spec tree for "testapp" holding only the retired five folders``() =
        this.HandleGiven("a spec tree for \"testapp\" holding only the retired five folders")

    [<Given>]
    member this.``a spec tree for "testapp" whose one owner corpus is complete``() =
        this.HandleGiven("a spec tree for \"testapp\" whose one owner corpus is complete")

    [<Given>]
    member this.``an app "testapp" holding only the retired five folders``() =
        this.HandleGiven("an app \"testapp\" holding only the retired five folders")

    [<Given>]
    member this.``an app "testapp" with an owner corpus and a retired ddd tree at specs/apps/testapp/ddd``() =
        this.HandleGiven("an app \"testapp\" with an owner corpus and a retired ddd tree at specs/apps/testapp/ddd")

    [<Given>]
    member this.``an app "testapp" with an owner corpus and no ddd tree at specs/apps/testapp/ddd``() =
        this.HandleGiven("an app \"testapp\" with an owner corpus and no ddd tree at specs/apps/testapp/ddd")

    [<Given>]
    member this.``an app "unknownapp" with no spec tree at all``() =
        this.HandleGiven("an app \"unknownapp\" with no spec tree at all")

    [<Given>]
    member this.``no directory exists at "specs/apps/nosuchapp"``() =
        this.HandleGiven("no directory exists at \"specs/apps/nosuchapp\"")

    [<Given>]
    member this.``no spec tree exists for "unknownapp"``() =
        this.HandleGiven("no spec tree exists for \"unknownapp\"")

    [<When>]
    member this.``the developer runs "rhino-cli md links validate specs/apps/nosuchapp"``() =
        this.HandleWhen("the developer runs \"rhino-cli md links validate specs/apps/nosuchapp\"")

    [<When>]
    member this.``the developer runs "rhino-cli md links validate specs/apps/testapp"``() =
        this.HandleWhen("the developer runs \"rhino-cli md links validate specs/apps/testapp\"")

    [<When>]
    member this.``the developer runs "rhino-cli specs counts validate specs/apps/nosuchapp"``() =
        this.HandleWhen("the developer runs \"rhino-cli specs counts validate specs/apps/nosuchapp\"")

    [<When>]
    member this.``the developer runs "rhino-cli specs counts validate specs/apps/testapp"``() =
        this.HandleWhen("the developer runs \"rhino-cli specs counts validate specs/apps/testapp\"")

    [<When>]
    member this.``the developer runs "rhino-cli specs counts validate specs/libs/testlib"``() =
        this.HandleWhen("the developer runs \"rhino-cli specs counts validate specs/libs/testlib\"")

    [<When>]
    member this.``the developer runs "rhino-cli specs structure validate testapp"``() =
        this.HandleWhen("the developer runs \"rhino-cli specs structure validate testapp\"")

    [<When>]
    member this.``the developer runs "rhino-cli specs structure validate unknownapp"``() =
        this.HandleWhen("the developer runs \"rhino-cli specs structure validate unknownapp\"")

    [<When>]
    member this.``the developer runs rhino-cli specs audit``() =
        this.HandleWhen("the developer runs rhino-cli specs audit")

    [<Then>]
    member this.``the command exits successfully``() =
        this.HandleThen("the command exits successfully")

    [<Then>]
    member this.``the command exits with a failure code``() =
        this.HandleThen("the command exits with a failure code")

    [<Then>]
    member this.``the output contains "0 finding"``() =
        this.HandleThen("the output contains \"0 finding\"")

    [<Then>]
    member this.``the output contains "All links valid"``() =
        this.HandleThen("the output contains \"All links valid\"")

    [<Then>]
    member this.``the output contains "SPECS AUDIT PASSED"``() =
        this.HandleThen("the output contains \"SPECS AUDIT PASSED\"")

    [<Then>]
    member this.``the output contains "broken link"``() =
        this.HandleThen("the output contains \"broken link\"")

    [<Then>]
    member this.``the output contains "does not exist"``() =
        this.HandleThen("the output contains \"does not exist\"")

    [<Then>]
    member this.``the output contains "is neither a logical owner corpus nor a product holding one"``() =
        this.HandleThen("the output contains \"is neither a logical owner corpus nor a product holding one\"")

    [<Then>]
    member this.``the output contains "legacy folder product survives beside a logical owner corpus"``() =
        this.HandleThen("the output contains \"legacy folder product survives beside a logical owner corpus\"")

    [<Then>]
    member this.``the output contains "missing required entry: README\.md"``() =
        this.HandleThen("the output contains \"missing required entry: README.md\"")

    [<Then>]
    member this.``the output contains "missing required entry: behaviours"``() =
        this.HandleThen("the output contains \"missing required entry: behaviours\"")

    [<Then>]
    member this.``the output contains "missing required entry: behaviours/README\.md"``() =
        this.HandleThen("the output contains \"missing required entry: behaviours/README.md\"")

    [<Then>]
    member this.``the output contains "no feature files"``() =
        this.HandleThen("the output contains \"no feature files\"")

    [<Then>]
    member this.``the output contains "no logical owner corpus"``() =
        this.HandleThen("the output contains \"no logical owner corpus\"")

    [<Then>]
    member this.``the output contains "retired ddd/ tree"``() =
        this.HandleThen("the output contains \"retired ddd/ tree\"")

// GENERATED EXACT BINDINGS END

module private FeatureRunner =
    let private readEmbeddedFeature featureFileName =
        let assembly = typeof<SpecsSteps>.Assembly

        let resourceName =
            assembly.GetManifestResourceNames()
            |> Array.tryFind (fun name -> name.EndsWith("." + featureFileName, StringComparison.Ordinal))
            |> Option.defaultWith (fun () -> failwithf "embedded Specs feature not found: %s" featureFileName)

        use stream = assembly.GetManifestResourceStream(resourceName)
        use reader = new StreamReader(stream)
        reader.ReadToEnd().Split('\n')

    let run featureFileName =
        let definitions = StepDefinitions([| typeof<SpecsSteps> |])

        let feature =
            definitions.GenerateFeature(featureFileName, readEmbeddedFeature featureFileName)

        feature.Scenarios |> Seq.iter (fun scenario -> scenario.Action.Invoke())

[<Theory>]
[<InlineData("specs-audit.feature")>]
[<InlineData("validate-adoption.feature")>]
[<InlineData("validate-counts.feature")>]
[<InlineData("validate-links.feature")>]
[<InlineData("validate-logical-corpus.feature")>]
[<InlineData("validate-tree.feature")>]
let ``active specification behaviours have pure Unit proof`` featureFileName = FeatureRunner.run featureFileName

[<Fact>]
let ``pure specification validation covers a missing architecture`` () =
    let owner = "specs/apps/example/cli"

    let tree =
        { Directories = Set.ofList [ owner; owner + "/behaviours" ]
          Files =
            Map.ofList
                [ owner + "/README.md", "# Index\n"
                  owner + "/behaviours/README.md", "# Behaviours\n"
                  owner + "/behaviours/example.feature", "Feature: Example\n" ] }

    let missing = validateOwnerCorpusTree tree owner
    Assert.Contains(missing, fun finding -> finding.File = owner + "/architecture.md")

[<Fact>]
let ``pure specification audit reports member failures`` () =
    let outcome =
        runSpecsAudit [ "validate-links" ] (fun memberName ->
            if memberName = "structure-validate" then
                Error "invalid tree"
            else
                Ok())

    Assert.False outcome.Passed
    Assert.Single outcome.Failures |> ignore
    Assert.Contains("structure-validate: invalid tree", outcome.Summary + String.concat "\n" outcome.Failures)
