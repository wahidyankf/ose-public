module RhinoCli.Tests.Unit.Steps.ConventionSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/convention/convention-audit.feature"
      "specs/apps/rhino/cli/behaviours/convention/repo-governance-license-audit.feature" ]

open System
open System.IO
open System.Reflection
open TickSpec
open Xunit
open RhinoCli.Application.Convention

module FeatureResource =
    let readLines (fileName: string) =
        let assembly = Assembly.GetExecutingAssembly()

        let resourceName =
            assembly.GetManifestResourceNames()
            |> Array.filter (fun name -> name.EndsWith(fileName, StringComparison.Ordinal))
            |> Array.exactlyOne

        use stream = assembly.GetManifestResourceStream(resourceName)
        use reader = new StreamReader(stream)
        reader.ReadToEnd().Replace("\r\n", "\n").Split('\n')

type ConventionSteps() =
    let mutable files: (string * string) list = []
    let mutable licenses: LicenseAuditSnapshot option = None
    let mutable result: ValidatorResult option = None

    let outcome () =
        result |> Option.defaultWith (fun () -> failwith "the policy was not evaluated")

    let missing directory =
        licenses <-
            Some
                { RequiredDirectories = [ directory ]
                  LicenseTexts = Map.empty
                  LicensingNotice = None }

    [<Given>]
    member _.``a repository where every required directory has a matching MIT LICENSE file``() =
        licenses <-
            Some
                { RequiredDirectories = [ "apps/foo"; "libs/bar"; "specs" ]
                  LicenseTexts =
                    Map.ofList
                        [ "apps/foo", "MIT License\n"
                          "libs/bar", "MIT License\n"
                          "specs", "MIT License\n" ]
                  LicensingNotice = None }

    [<Given>]
    member _.``a repository where one app directory is missing its LICENSE file``() = missing "apps/foo"

    [<Given>]
    member _.``a repository where one lib directory is missing its LICENSE file``() = missing "libs/bar"

    [<Given>]
    member _.``a repository where a LICENSING-NOTICE.md table row claims a license that disagrees with the on-disk LICENSE file``
        ()
        =
        licenses <-
            Some
                { RequiredDirectories = [ "apps/foo" ]
                  LicenseTexts = Map.ofList [ "apps/foo", "MIT License\n" ]
                  LicensingNotice = Some "| Path | License |\n| --- | --- |\n| apps/foo | Apache-2.0 |\n" }

    [<When>]
    member _.``the developer runs convention license validate``() =
        result <- Some(validateLicenseSnapshot (Option.get licenses))

    [<When>]
    member _.``the developer runs "rhino-cli convention audit"``() =
        let license = validateLicenseSnapshot (Option.get licenses)
        result <- Some(aggregateConventionResults [ "license", license ] [])

    [<Then>]
    member _.``the command exits successfully``() =
        Assert.True((outcome ()).Success, (outcome ()).Output)

    [<Then>]
    member _.``the command exits with a failure code``() =
        Assert.False((outcome ()).Success, (outcome ()).Output)

    [<Then>]
    member _.``the output reports zero license findings``() = Assert.Empty((outcome ()).Findings)

    [<Then>]
    member _.``the output identifies the missing LICENSE app directory``() =
        Assert.Contains((outcome ()).Findings, fun finding -> finding.Path = Some "apps/foo")

    [<Then>]
    member _.``the output identifies the missing LICENSE lib directory``() =
        Assert.Contains((outcome ()).Findings, fun finding -> finding.Path = Some "libs/bar")

    [<Then>]
    member _.``the output identifies the SPDX mismatch``() =
        Assert.Contains((outcome ()).Findings, fun finding -> finding.Message.Contains("spdx-mismatch"))

    [<Then>]
    member _.``the output names the failing "(.*)" validator``(name: string) =
        Assert.Contains(name + ":", (outcome ()).Output)

module private FeatureRunner =
    let private root =
        Path.GetFullPath(
            Path.Combine(
                __SOURCE_DIRECTORY__,
                "..",
                "..",
                "..",
                "..",
                "..",
                "specs",
                "apps",
                "rhino",
                "cli",
                "behaviours",
                "convention"
            )
        )

    let run file title =
        let path = Path.Combine(root, file)
        let lines = FeatureResource.readLines file

        let feature =
            lines |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:"))

        let header = "Scenario: " + title
        let start = lines |> Array.findIndex (fun line -> line.Trim() = header)

        let finish =
            lines
            |> Array.skip (start + 1)
            |> Array.tryFindIndex (fun line -> line.TrimStart().StartsWith("Scenario:"))
            |> Option.map (fun offset -> start + 1 + offset)
            |> Option.defaultValue lines.Length

        let snippet = Array.append [| feature; "" |] lines.[start .. finish - 1]

        let generated =
            StepDefinitions([| typeof<ConventionSteps> |]).GenerateFeature(path, snippet)

        (Seq.exactlyOne generated.Scenarios).Action.Invoke()

[<Theory>]
[<InlineData("convention-audit.feature", "A missing LICENSE fails the aggregate convention audit")>]
[<InlineData("repo-governance-license-audit.feature",
             "Clean repository where every app/lib/specs has matching LICENSE passes")>]
[<InlineData("repo-governance-license-audit.feature", "App directory missing LICENSE file fails")>]
[<InlineData("repo-governance-license-audit.feature", "Lib directory missing LICENSE file fails")>]
[<InlineData("repo-governance-license-audit.feature", "LICENSING-NOTICE.md table row mismatching SPDX in LICENSE fails")>]
let ``convention policy scenarios stay in process`` file title = FeatureRunner.run file title

[<Fact>]
let ``aggregate convention policy reports the selected passing validators`` () =
    let passing =
        { Success = true
          Output = "passed"
          Findings = [] }

    let result =
        aggregateConventionResults [ "emoji", passing; "license", passing ] [ "emoji" ]

    Assert.True(result.Success)
    Assert.Contains("all 1 validators passed", result.Output)
