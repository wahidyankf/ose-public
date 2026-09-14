/// Published-process E2E proof for specification and staged-env commands.
module RhinoCli.Tests.E2E.Steps.SpecsProcessSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/specs/env-staged-guard.feature"
      "specs/apps/rhino/cli/behaviours/specs/specs-audit.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-adoption.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-counts.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-links.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-logical-corpus.feature"
      "specs/apps/rhino/cli/behaviours/specs/validate-tree.feature" ]

open System
open System.Diagnostics
open System.IO
open TickSpec
open Xunit

type private ProcessResult = { ExitCode: int; Output: string }

let private repositoryRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

let private executable =
    Path.Combine(repositoryRoot, "apps", "rhino-cli", "src", "dist", "rhino-cli-fsharp")

/// `md links validate` is a split command that starts `./rhino` at the
/// repository root before its F# remainder; this no-op stand-in lets the
/// scenarios exercise that remainder.
let private stubRhino (root: string) =
    let path = Path.Combine(root, "rhino")
    File.WriteAllText(path, "#!/bin/sh\nexit 0\n")

    File.SetUnixFileMode(path, UnixFileMode.UserRead ||| UnixFileMode.UserWrite ||| UnixFileMode.UserExecute)

type SpecsProcessSteps() =
    let root =
        Path.Combine(Path.GetTempPath(), "rhino-specs-e2e-" + Guid.NewGuid().ToString("N"))

    let mutable result: ProcessResult option = None

    let run executableName arguments =
        let info =
            ProcessStartInfo(
                executableName,
                WorkingDirectory = root,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            )

        arguments |> List.iter info.ArgumentList.Add
        info.Environment.["GIT_CONFIG_GLOBAL"] <- "/dev/null"
        info.Environment.["GIT_CONFIG_SYSTEM"] <- "/dev/null"
        use childProcess = Process.Start info
        let stdout = childProcess.StandardOutput.ReadToEnd()
        let stderr = childProcess.StandardError.ReadToEnd()
        childProcess.WaitForExit()

        { ExitCode = childProcess.ExitCode
          Output = stdout + stderr }

    do
        Directory.CreateDirectory root |> ignore
        let initialized = run "git" [ "init"; "--quiet" ]
        Assert.Equal(0, initialized.ExitCode)
        stubRhino root

    let write (path: string) (content: string) =
        let absolute = Path.Combine(root, path.Replace('/', Path.DirectorySeparatorChar))
        Directory.CreateDirectory(Path.GetDirectoryName absolute) |> ignore
        File.WriteAllText(absolute, content)

    let addDirectory (path: string) =
        Directory.CreateDirectory(Path.Combine(root, path.Replace('/', Path.DirectorySeparatorChar)))
        |> ignore

    let addCorpus corpus withReadme withBehaviours withFeature withIndex =
        addDirectory corpus
        write (corpus + "/architecture.md") "# Architecture\n"

        if withReadme then
            write (corpus + "/README.md") "# Index\n"

        if withBehaviours then
            addDirectory (corpus + "/behaviours")

            if withIndex then
                write (corpus + "/behaviours/README.md") "# Behaviours\n"

            if withFeature then
                write
                    (corpus + "/behaviours/example.feature")
                    "Feature: Example\n\n  Scenario: Works\n    Given state\n    When action\n    Then result\n"

    let addRetired app =
        addDirectory (sprintf "specs/apps/%s" app)

        [ "product"; "system-context"; "containers"; "components"; "behavior" ]
        |> List.iter (fun folder -> addDirectory (sprintf "specs/apps/%s/%s" app folder))

    let invoke args = result <- Some(run executable args)

    let outcome () =
        result
        |> Option.defaultWith (fun () -> failwith "published Rhino process did not run")

    member private _.HandleGiven(step: string) =
        if step.Contains("real .env file", StringComparison.Ordinal) then
            write ".env" "SECRET=value\n"
            run "git" [ "add"; ".env" ] |> ignore
        elif step.Contains("only .env.example", StringComparison.Ordinal) then
            write ".env.example" "KEY=\n"
            run "git" [ "add"; ".env.example" ] |> ignore
        elif step.StartsWith("a git index with \"", StringComparison.Ordinal) then
            let path = step.Split('"').[1] in
            write path "SECRET=value\n"
            run "git" [ "add"; path ] |> ignore
        elif step.Contains("two primary \"When\"", StringComparison.Ordinal) then
            write
                "double-when.feature"
                "Feature: Cardinality\n\n  Scenario: Two primary When keywords\n    Given state\n    When first\n    When second\n    Then result\n"
        elif
            step.Contains("no spec-tree violations", StringComparison.Ordinal)
            || step.Contains("owner corpus and no ddd", StringComparison.Ordinal)
            || step.Contains("whose one owner corpus is complete", StringComparison.Ordinal)
            || step.Contains("with its README, architecture, and a behaviours feature", StringComparison.Ordinal)
        then
            addDirectory "specs/apps/testapp"
            addCorpus "specs/apps/testapp/cli" true true true true
        elif step.Contains("owner corpus and a retired ddd", StringComparison.Ordinal) then
            addDirectory "specs/apps/testapp"
            addDirectory "specs/apps/testapp/ddd"
            addCorpus "specs/apps/testapp/cli" true true true true
        elif step.Contains("holding only the retired five folders", StringComparison.Ordinal) then
            addRetired "testapp"
        elif step.Contains("library corpus", StringComparison.Ordinal) then
            addDirectory "specs/libs/testlib"

            addCorpus
                "specs/libs/testlib"
                true
                true
                true
                (not (step.Contains("has no README.md", StringComparison.Ordinal)))
        elif step.Contains("all internal markdown links resolve", StringComparison.Ordinal) then
            addDirectory "specs/apps/testapp"
            write "specs/apps/testapp/README.md" "[target](./target.md)\n"
            write "specs/apps/testapp/target.md" "# Target\n"
        elif step.Contains("broken internal link", StringComparison.Ordinal) then
            addDirectory "specs/apps/testapp"
            write "specs/apps/testapp/README.md" "![missing](./missing.png)\n"
        elif step.Contains("external HTTPS links", StringComparison.Ordinal) then
            addDirectory "specs/apps/testapp"
            write "specs/apps/testapp/README.md" "[external](https://example.com)\n"
        elif step.Contains("whose README.md is absent", StringComparison.Ordinal) then
            addDirectory "specs/apps/testapp"
            addCorpus "specs/apps/testapp/cli" false true true true
        elif step.Contains("behaviours directory is absent", StringComparison.Ordinal) then
            addDirectory "specs/apps/testapp"
            addCorpus "specs/apps/testapp/cli" true false false false
        elif step.Contains("holds no feature file", StringComparison.Ordinal) then
            addDirectory "specs/apps/testapp"
            addCorpus "specs/apps/testapp/cli" true true false true
        elif step.Contains("has no README.md", StringComparison.Ordinal) then
            addDirectory "specs/apps/testapp"
            addCorpus "specs/apps/testapp/cli" true true true false
        elif step.Contains("surviving \"product\" folder", StringComparison.Ordinal) then
            addDirectory "specs/apps/testapp"
            addDirectory "specs/apps/testapp/product"
            addCorpus "specs/apps/testapp/cli" true true true true
        elif
            step.Contains("no spec tree", StringComparison.Ordinal)
            || step.Contains("no directory exists", StringComparison.Ordinal)
        then
            ()
        else
            failwithf "unhandled Specs E2E Given: %s" step

    member private _.HandleWhen(step: string) =
        if step.Contains("env staged-guard", StringComparison.Ordinal) then
            invoke [ "env"; "staged-guard"; "validate" ]
        elif step.Contains("specs audit", StringComparison.Ordinal) then
            invoke [ "specs"; "audit" ]
        elif step.Contains("counts validate", StringComparison.Ordinal) then
            invoke
                [ "specs"
                  "counts"
                  "validate"
                  step.Split(' ').[step.Split(' ').Length - 1].Trim('"') ]
        elif step.Contains("md links validate", StringComparison.Ordinal) then
            invoke
                [ "md"
                  "links"
                  "validate"
                  step.Split(' ').[step.Split(' ').Length - 1].Trim('"') ]
        elif step.Contains("structure validate", StringComparison.Ordinal) then
            invoke
                [ "specs"
                  "structure"
                  "validate"
                  if step.Contains("unknownapp", StringComparison.Ordinal) then
                      "unknownapp"
                  else
                      "testapp" ]
        else
            failwithf "unhandled Specs E2E When: %s" step

    member private _.HandleThen(step: string) =
        let actual = outcome ()

        if
            step.Contains("exits successfully", StringComparison.Ordinal)
            || step.Contains("exits zero", StringComparison.Ordinal)
        then
            Assert.Equal(0, actual.ExitCode)
        elif
            step.Contains("exits with a failure", StringComparison.Ordinal)
            || step.Contains("exits non-zero", StringComparison.Ordinal)
            || step = "the commit is aborted"
        then
            Assert.NotEqual(0, actual.ExitCode)
        elif step.Contains("names the offending file", StringComparison.Ordinal) then
            Assert.Contains(".env", actual.Output, StringComparison.Ordinal)
        elif step.StartsWith("the output names \"", StringComparison.Ordinal) then
            Assert.Contains(step.Split('"').[1], actual.Output, StringComparison.Ordinal)
        elif step.StartsWith("the output contains \"", StringComparison.Ordinal) then
            Assert.Contains(step.Split('"').[1], actual.Output, StringComparison.Ordinal)
        else
            failwithf "unhandled Specs E2E Then: %s" step

    // GENERATED EXACT BINDINGS START
    [<Given>]
    member this.``a git index with "(.*)" staged``(file: string) =
        this.HandleGiven("a git index with \"" + file + "\" staged")

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
    member this.``a real \.env file is staged for commit``() =
        this.HandleGiven("a real .env file is staged for commit")

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

    [<Given>]
    member this.``only \.env\.example is staged for commit``() =
        this.HandleGiven("only .env.example is staged for commit")

    [<When>]
    member this.``"rhino-cli env staged-guard validate" runs``() =
        this.HandleWhen("\"rhino-cli env staged-guard validate\" runs")

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

    [<When>]
    member this.``the pre-commit hook runs rhino-cli env staged-guard validate``() =
        this.HandleWhen("the pre-commit hook runs rhino-cli env staged-guard validate")

    [<Then>]
    member this.``it exits non-zero and names the offending file``() =
        this.HandleThen("it exits non-zero and names the offending file")

    [<Then>]
    member this.``it exits zero and does not block the commit``() =
        this.HandleThen("it exits zero and does not block the commit")

    [<Then>]
    member this.``the command exits non-zero``() =
        this.HandleThen("the command exits non-zero")

    [<Then>]
    member this.``the command exits successfully``() =
        this.HandleThen("the command exits successfully")

    [<Then>]
    member this.``the command exits with a failure code``() =
        this.HandleThen("the command exits with a failure code")

    [<Then>]
    member this.``the commit is aborted``() =
        this.HandleThen("the commit is aborted")

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

    [<Then>]
    member this.``the output names "(.*)" as offending``(file: string) =
        this.HandleThen("the output names \"" + file + "\" as offending")

// GENERATED EXACT BINDINGS END

module private FeatureRunner =
    let private featureDirectory =
        Path.Combine(repositoryRoot, "specs", "apps", "rhino", "cli", "behaviours", "specs")

    let run featureFileName =
        let path = Path.Combine(featureDirectory, featureFileName)
        let definitions = StepDefinitions([| typeof<SpecsProcessSteps> |])
        let feature = definitions.GenerateFeature(path, File.ReadAllLines path)
        feature.Scenarios |> Seq.iter (fun scenario -> scenario.Action.Invoke())

[<Theory>]
[<InlineData("env-staged-guard.feature")>]
[<InlineData("specs-audit.feature")>]
[<InlineData("validate-adoption.feature")>]
[<InlineData("validate-counts.feature")>]
[<InlineData("validate-links.feature")>]
[<InlineData("validate-logical-corpus.feature")>]
[<InlineData("validate-tree.feature")>]
let ``published Rhino proves active specification behaviours`` featureFileName = FeatureRunner.run featureFileName
