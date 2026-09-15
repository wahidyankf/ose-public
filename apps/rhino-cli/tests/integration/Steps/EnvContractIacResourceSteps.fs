/// TickSpec step definitions binding
/// `iac-env-validation.feature`'s single scenario to
/// `RhinoCli.Application.Env`'s `validateAll` dispatch [Repo-grounded —
/// `specs/apps/rhino/cli/behaviours/env-contract/iac-env-validation.feature`,
/// `apps/rhino-cli/src/application/env/validate.rs::validate_all`].
///
/// Follows `EnvValidateSteps.fs`'s `FeatureRunner`/`extractScenario`
/// boilerplate convention: the scenario is extracted from the real, frozen
/// feature file rather than a duplicated/rewritten copy of its wording. The
/// scenario's "the private sibling"/"ose-public" wording names narrative shapes, not
/// this repository's live `repo-config.yml` — both sides are built as
/// hermetic, synthetic fixtures under a temp directory so the test passes
/// identically in either physical repo this code is mirrored into. "the
/// private sibling declares terraform and ansible surfaces" is modeled as one
/// synthetic [`Contract`] whose `Terraform`/`Ansible` surfaces are backed by
/// fixture files with a deliberate mismatch (so real drift exists);
/// "ose-public, which declares no such surfaces" is modeled as a second
/// synthetic [`Contract`] with an empty surface list.
module RhinoCli.Tests.Integration.Steps.EnvContractIacResourceSteps

/// Explicit static-coverage ownership; the validator scopes this file's
/// TickSpec bindings to these canonical features.
let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/env-contract/iac-env-validation.feature" ]


open System
open System.IO
open TickSpec
open Xunit
open RhinoCli.Application.Env

/// Instance step-definition container — see `ConventionSteps.fs`'s module
/// doc comment for why TickSpec's one-instance-per-scenario lifecycle makes
/// instance-level mutable fields the idiomatic state-threading mechanism
/// here.
type EnvContractIacSteps() =
    let mutable driftRepoRoot: string option = None
    let mutable driftContract: Contract option = None
    let mutable driftFindingsResult: Result<Finding list, string> option = None
    let mutable ownedDirs: string list = []

    let newTempDir (prefix: string) : string =
        let dir =
            Path.Combine(
                Path.GetTempPath(),
                "rhino-cli-env-contract-iac-" + prefix + "-" + Guid.NewGuid().ToString("N")
            )

        Directory.CreateDirectory(dir) |> ignore
        ownedDirs <- dir :: ownedDirs
        dir

    let writeFile (root: string) (relativePath: string) (content: string) =
        let full = Path.Combine(root, relativePath)
        Directory.CreateDirectory(Path.GetDirectoryName(full)) |> ignore
        File.WriteAllText(full, content)

    // ---- Given ----

    [<Given>]
    member _.``the private sibling declares terraform and ansible surfaces in repo-config.yml``() =
        let root = newTempDir "with-drift"

        // Terraform surface: `terraform.tfvars.example` declares BOGUS_KEY
        // (no matching `variable` block: ExampleNotDeclared) and omits
        // REQUIRED_KEY, which has no `default` (RequiredMissingFromExample).
        writeFile
            root
            "infra/terraform-surface/main.tf"
            "variable \"DECLARED_KEY\" {\n  default = \"value\"\n}\n\nvariable \"REQUIRED_KEY\" {\n  description = \"no default, so required\"\n}\n"

        writeFile root "infra/terraform-surface/terraform.tfvars.example" "DECLARED_KEY = \"x\"\nBOGUS_KEY = \"y\"\n"

        // Ansible surface: playbook consumes CONSUMED_KEY via
        // `lookup('ansible.builtin.env', ...)`, absent from `.env.example`
        // (ConsumedNotDeclared).
        writeFile
            root
            "infra/ansible-surface/playbook-deploy.yml"
            "- name: deploy\n  tasks:\n    - debug: msg={{ lookup('ansible.builtin.env', 'CONSUMED_KEY') }}\n"

        writeFile root "infra/ansible-surface/.env.example" "# no vars declared\n"

        driftRepoRoot <- Some root

        driftContract <-
            Some
                { Surfaces =
                    [ { Root = "infra/terraform-surface"
                        Kind = Terraform
                        Lang = ""
                        Allowlist = [] }
                      { Root = "infra/ansible-surface"
                        Kind = Ansible
                        Lang = ""
                        Allowlist = [] } ] }

    // ---- When ----

    [<When>]
    member _.``env validate runs``() =
        let root =
            match driftRepoRoot with
            | Some r -> r
            | None -> failwith "no repo root has been prepared by a Given step"

        let contract =
            match driftContract with
            | Some c -> c
            | None -> failwith "no contract has been prepared by a Given step"

        driftFindingsResult <- Some(validateAll root contract)

    // ---- Then ----

    [<Then>]
    member _.``validate_terraform and validate_ansible execute and report drift``() =
        let findings =
            match driftFindingsResult with
            | Some(Ok findings) -> findings
            | Some(Error message) ->
                failwith (sprintf "expected env validate to return findings, got error: %s" message)
            | None -> failwith "no command has been run by a When step"

        Assert.NotEmpty findings

        Assert.Contains(
            findings,
            fun (f: Finding) ->
                f.Drift = ExampleNotDeclared
                && f.Key = "BOGUS_KEY"
                && f.Root = "infra/terraform-surface"
        )

        Assert.Contains(
            findings,
            fun (f: Finding) ->
                f.Drift = RequiredMissingFromExample
                && f.Key = "REQUIRED_KEY"
                && f.Root = "infra/terraform-surface"
        )

        Assert.Contains(
            findings,
            fun (f: Finding) ->
                f.Drift = ConsumedNotDeclared
                && f.Key = "CONSUMED_KEY"
                && f.Root = "infra/ansible-surface"
        )

    [<Then>]
    member _.``ose-public, which declares no such surfaces, skips validation by data, not by stub``() =
        let root = newTempDir "without-surfaces"
        let emptyContract: Contract = { Surfaces = [] }

        match validateAll root emptyContract with
        | Ok findings -> Assert.Empty findings
        | Error message ->
            Assert.Fail(
                sprintf
                    "expected a repo with no terraform/ansible surfaces to validate cleanly (skip by data), got error: %s"
                    message
            )

    [<AfterScenario>]
    member _.Cleanup() =
        for dir in ownedDirs do
            if Directory.Exists dir then
                Directory.Delete(dir, true)

/// Reads the single `Scenario:` block out of the real, frozen
/// `iac-env-validation.feature` file (leaving the file itself untouched) and
/// runs it through TickSpec bound only against `EnvContractIacSteps` — see
/// `EnvValidateSteps.fs`'s `FeatureRunner` for why this is per-scenario
/// rather than per-file.
module private FeatureRunner =

    let private featurePath: string =
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
                "env-contract",
                "iac-env-validation.feature"
            )
        )

    let private extractScenario (featureLines: string[]) (scenarioTitle: string) : string[] =
        let featureLine =
            featureLines
            |> Array.find (fun l -> l.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let scenarioHeader = sprintf "Scenario: %s" scenarioTitle

        let startIdx = featureLines |> Array.findIndex (fun l -> l.Trim() = scenarioHeader)

        let endIdx =
            featureLines
            |> Array.skip (startIdx + 1)
            |> Array.tryFindIndex (fun l ->
                let trimmed = l.Trim()

                trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
                || trimmed.StartsWith("Scenario Outline:", StringComparison.Ordinal)
                // iac-env-validation.feature tags only the feature itself
                // (`@env-contract-iac`), with no per-scenario tags — a
                // `@`-prefixed line still ends the slice, matching
                // `EnvValidateSteps.fs`'s tag-aware convention, even though
                // no scenario here actually carries one.
                || trimmed.StartsWith("@", StringComparison.Ordinal))
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIdx .. endIdx - 1]

    /// Runs the single scenario named `scenarioTitle` from
    /// `iac-env-validation.feature`, bound against `EnvContractIacSteps`.
    let run (scenarioTitle: string) : unit =
        let allLines = File.ReadAllLines featurePath
        let snippet = extractScenario allLines scenarioTitle
        let definitions = StepDefinitions([| typeof<EnvContractIacSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)
        let scenario = Seq.exactlyOne feature.Scenarios
        scenario.Action.Invoke()

[<Fact>]
let ``IaC env-validation is preserved in the canonical`` () =
    FeatureRunner.run "IaC env-validation is preserved in the canonical"
