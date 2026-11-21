Feature: Version flag
  As a workflow runner verifying the install
  I want crane --version to print the assembly version
  So that setup instructions have an accurate first-line check

  # Behaviour: CRN-024
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: crane --version prints a SemVer-shaped version and exits 0
    When I run "crane --version"
    Then the version string matches a SemVer-shaped pattern
    And the exit code is 0
