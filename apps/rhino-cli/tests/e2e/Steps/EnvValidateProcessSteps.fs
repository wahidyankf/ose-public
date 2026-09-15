module RhinoCli.Tests.E2E.Steps.EnvValidateProcessSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/env/env-validate-app-drift.feature"
      "specs/apps/rhino/cli/behaviours/env-contract/iac-env-validation.feature" ]

open System
open System.Diagnostics
open System.IO
open TickSpec
open Xunit

let private repositoryRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

let private executable =
    Path.Combine(repositoryRoot, "apps", "rhino-cli", "src", "dist", "rhino-cli-fsharp")

let private write (root: string) relativePath (content: string) =
    let path = Path.Combine(root, relativePath)
    Directory.CreateDirectory(Path.GetDirectoryName path) |> ignore
    File.WriteAllText(path, content)

type EnvValidateProcessSteps() =
    let root =
        Path.Combine(Path.GetTempPath(), "rhino-cli-env-validate-e2e-" + Guid.NewGuid().ToString("N"))

    let mutable output = ""
    let mutable exitCode = 0

    do
        Directory.CreateDirectory(root) |> ignore

        let info =
            ProcessStartInfo(FileName = "git", WorkingDirectory = root, UseShellExecute = false)

        info.ArgumentList.Add("init")
        info.ArgumentList.Add("-q")
        use proc = Process.Start info
        proc.WaitForExit()

        if proc.ExitCode <> 0 then
            failwith "failed to initialize isolated git fixture"

    let run () =
        let info =
            ProcessStartInfo(
                FileName = executable,
                WorkingDirectory = root,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            )

        info.ArgumentList.Add("env")
        info.ArgumentList.Add("validate")
        use proc = Process.Start info
        output <- proc.StandardOutput.ReadToEnd() + proc.StandardError.ReadToEnd()
        proc.WaitForExit()
        exitCode <- proc.ExitCode

    [<Given>]
    member _.``an app surface whose .env.example declares a key the source code never reads``() =
        write root "surface/.env.example" "UNREAD_KEY=value\n"
        write root "surface/src/main.rs" "fn main() {}\n"

        write
            root
            "repo-config.yml"
            "env-contract:\n  surfaces:\n    - root: surface\n      kind: app\n      lang: rust\n"

    [<Given>]
    member _.``an app surface whose source code reads a key absent from .env.example``() =
        write root "surface/.env.example" ""
        write root "surface/src/main.rs" "let value = env::var(\"UNDECLARED_KEY\").unwrap();\n"

        write
            root
            "repo-config.yml"
            "env-contract:\n  surfaces:\n    - root: surface\n      kind: app\n      lang: rust\n"

    [<Given>]
    member _.``an F.*``() =
        write root "surface/.env.example" "WRAPPED_KEY=value\n"

        write
            root
            "surface/src/Config.fs"
            "let wrapped = readEnvironment \"WRAPPED_KEY\"\nlet runtime = System.Environment.GetEnvironmentVariable(\"DOTNET_RUNNING_IN_CONTAINER\")\n"

        write
            root
            "repo-config.yml"
            "env-contract:\n  surfaces:\n    - root: surface\n      kind: app\n      lang: fsharp\n"

    // The Go counterpart of the wrapper scenario above. The fixture uses the
    // injected-reader form — the key handed to a pure resolver alongside
    // `os.LookupEnv` rather than passed to it — because that is the shape
    // apps/roots-be actually uses, and a direct `os.Getenv` fixture would not
    // prove it crosses the published CLI boundary.
    [<Given>]
    member _.``a Go app surface that reads a declared key through an injected lookup``() =
        write root "surface/.env.example" "INJECTED_KEY=8402\n"

        write
            root
            "surface/cmd/app/main.go"
            "port, err := config.ResolvePort(*portFlag, os.LookupEnv, \"INJECTED_KEY\")\n"

        write
            root
            "repo-config.yml"
            "env-contract:\n  surfaces:\n    - root: surface\n      kind: app\n      lang: go\n"

    [<Given>]
    member _.``the private sibling declares terraform and ansible surfaces in repo-config.yml``() =
        write root "infra/terraform/main.tf" "variable \"REQUIRED_KEY\" {\n  description = \"required\"\n}\n"
        write root "infra/terraform/terraform.tfvars.example" "BOGUS_KEY = \"value\"\n"

        write
            root
            "infra/ansible/playbook-deploy.yml"
            "- debug: msg={{ lookup('ansible.builtin.env', 'CONSUMED_KEY') }}\n"

        write root "infra/ansible/.env.example" "# empty\n"

        write
            root
            "repo-config.yml"
            "env-contract:\n  surfaces:\n    - root: infra/terraform\n      kind: terraform\n    - root: infra/ansible\n      kind: ansible\n"

    [<When>]
    member _.``the developer runs env validate``() = run ()

    [<When>]
    member _.``env validate runs``() = run ()

    [<Then>]
    member _.``the command exits with a failure code``() = Assert.NotEqual(0, exitCode)

    [<Then>]
    member _.``the command exits successfully``() = Assert.Equal(0, exitCode)

    [<Then>]
    member _.``the output names the key as declared-but-unread``() = Assert.Contains("UNREAD_KEY", output)

    [<Then>]
    member _.``the output names the key as read-but-undeclared``() =
        Assert.Contains("UNDECLARED_KEY", output)

    [<Then>]
    member _.``validate_terraform and validate_ansible execute and report drift``() =
        Assert.Contains("BOGUS_KEY", output)
        Assert.Contains("REQUIRED_KEY", output)
        Assert.Contains("CONSUMED_KEY", output)

    [<Then>]
    member _.``ose-public, which declares no such surfaces, skips validation by data, not by stub``() =
        write root "repo-config.yml" "env-contract:\n  surfaces: []\n"
        run ()
        Assert.Equal(0, exitCode)
        Assert.Contains("no drift detected", output)

    [<AfterScenario>]
    member _.Cleanup() =
        if Directory.Exists root then
            Directory.Delete(root, true)

module private FeatureRunner =
    let run featureDirectory featureName scenarioTitle =
        let path =
            Path.Combine(repositoryRoot, "specs", "apps", "rhino", "cli", "behaviours", featureDirectory, featureName)

        let lines = File.ReadAllLines path

        let featureLine =
            lines |> Array.find (fun line -> line.TrimStart().StartsWith("Feature:"))

        let startIndex =
            lines
            |> Array.findIndex (fun line -> line.Trim() = "Scenario: " + scenarioTitle)

        let endIndex =
            lines
            |> Array.skip (startIndex + 1)
            |> Array.tryFindIndex (fun line -> line.TrimStart().StartsWith("Scenario:"))
            |> Option.map (fun offset -> startIndex + 1 + offset)
            |> Option.defaultValue lines.Length

        let snippet = Array.append [| featureLine; "" |] lines.[startIndex .. endIndex - 1]
        let definitions = StepDefinitions([| typeof<EnvValidateProcessSteps> |])
        let feature = definitions.GenerateFeature(path, snippet)
        (Seq.exactlyOne feature.Scenarios).Action.Invoke()

[<Theory>]
[<InlineData("A key declared in .env.example but never read by the app fails validation")>]
[<InlineData("A key read by the app but never declared in .env.example fails validation")>]
[<InlineData("F# environment wrapper reads remain detectable after convergence")>]
[<InlineData("Go environment reads through an injected lookup remain detectable")>]
let ``app env drift crosses the published CLI boundary`` title =
    FeatureRunner.run "env" "env-validate-app-drift.feature" title

[<Fact>]
let ``IaC env validation crosses the published CLI boundary`` () =
    FeatureRunner.run "env-contract" "iac-env-validation.feature" "IaC env-validation is preserved in the canonical"
