@env-contract-iac
Feature: IaC env-validation dispatch for terraform and ansible surfaces

  As a maintainer keeping rhino-cli byte-identical across ose-public and the private sibling
  I want env validate to dispatch to the real terraform and ansible validators by declared surface kind
  So that infra's IaC env-drift detection survives the canonical synthesis and no-ops elsewhere by data

  Scenario: IaC env-validation is preserved in the canonical
    Given the private sibling declares terraform and ansible surfaces in repo-config.yml
    When env validate runs
    Then validate_terraform and validate_ansible execute and report drift
    And ose-public, which declares no such surfaces, skips validation by data, not by stub
