module RhinoCli.Tests.Unit.Steps.EnvContractIacSteps

let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/env-contract/iac-env-validation.feature" ]

open TickSpec
open Xunit
open RhinoCli.Application.Env

type EnvContractIacSteps() =
    let mutable contract: Contract = { Surfaces = [] }
    let mutable findings: Finding list = []
    let mutable invoked: SurfaceKind list = []

    let result root exampleMissing requiredMissing consumedMissing =
        { SurfaceRoot = root
          DeclaredNotRead = []
          ReadNotDeclared = []
          ExampleNotDeclared = exampleMissing
          RequiredMissingFromExample = requiredMissing
          ConsumedNotDeclared = consumedMissing }

    let ports =
        { ValidateApp = fun _ -> Ok []
          ValidateTerraform =
            fun surface ->
                invoked <- invoked @ [ Terraform ]
                Ok(result surface.Root [ "BOGUS_KEY" ] [ "REQUIRED_KEY" ] [])
          ValidateAnsible =
            fun surface ->
                invoked <- invoked @ [ Ansible ]
                Ok(result surface.Root [] [] [ "CONSUMED_KEY" ]) }

    [<Given>]
    member _.``the private sibling declares terraform and ansible surfaces in repo-config.yml``() =
        contract <-
            { Surfaces =
                [ { Root = "infra/terraform-surface"
                    Kind = Terraform
                    Lang = ""
                    Allowlist = [] }
                  { Root = "infra/ansible-surface"
                    Kind = Ansible
                    Lang = ""
                    Allowlist = [] } ] }

    [<When>]
    member _.``env validate runs``() =
        findings <- validateAllWith ports contract |> Result.defaultWith failwith

    [<Then>]
    member _.``validate_terraform and validate_ansible execute and report drift``() =
        Assert.Equal<SurfaceKind list>([ Terraform; Ansible ], invoked)
        Assert.Contains(findings, fun finding -> finding.Drift = ExampleNotDeclared && finding.Key = "BOGUS_KEY")

        Assert.Contains(
            findings,
            fun finding -> finding.Drift = RequiredMissingFromExample && finding.Key = "REQUIRED_KEY"
        )

        Assert.Contains(findings, fun finding -> finding.Drift = ConsumedNotDeclared && finding.Key = "CONSUMED_KEY")

    [<Then>]
    member _.``ose-public, which declares no such surfaces, skips validation by data, not by stub``() =
        invoked <- []
        let empty = validateAllWith ports { Surfaces = [] } |> Result.defaultWith failwith
        Assert.Empty empty
        Assert.Empty invoked

[<Fact>]
let ``IaC dispatch is selected by declared surface data`` () =
    let steps = EnvContractIacSteps()
    steps.``the private sibling declares terraform and ansible surfaces in repo-config.yml`` ()
    steps.``env validate runs`` ()
    steps.``validate_terraform and validate_ansible execute and report drift`` ()
    steps.``ose-public, which declares no such surfaces, skips validation by data, not by stub`` ()
