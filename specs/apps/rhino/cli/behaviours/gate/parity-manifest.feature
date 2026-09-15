@gate
Feature: Rhino CLI parity manifest

  As a maintainer of the shared Rhino CLI boundary
  I want drift to require an explicit checksum regeneration
  So that an unannounced repository-specific edit cannot silently propagate

  Scenario: Regeneration is idempotent
    Given a tracked Rhino CLI parity boundary
    When rhino-cli parity manifest generate runs
    And the same manifest is generated a second time
    Then the parity manifest is byte-identical to its first generation
    And the parity manifest is current

  Scenario: An unannounced edit to byte-identical source fails the gate
    Given a tracked Rhino CLI parity boundary
    And its parity manifest has been generated and staged
    When a tracked parity source file is edited
    And rhino-cli parity manifest validate runs
    Then the parity gate names the edited source and deliberate remedy

  Scenario: The manifest covers tests as well as source
    Given a tracked Rhino CLI parity boundary
    And its parity manifest has been generated and staged
    When a tracked parity test file is edited
    And rhino-cli parity manifest validate runs
    Then the parity gate names the edited test

  Scenario: Untracked files never enter the manifest
    Given a tracked Rhino CLI parity boundary
    And its parity manifest has been generated and staged
    When an untracked test fixture is created
    And rhino-cli parity manifest validate runs
    Then the untracked fixture is absent from the manifest

  # US-10 of plans/in-progress/update-harness-support: the plan's
  # apps/rhino-cli/** changes must land in ose-public and the private sibling as one
  # paired merge. The PR-count half of that claim is a workflow fact recorded in
  # the plan's delivery checklist; the half a gate can actually enforce is this —
  # a boundary edit that lands on one side only leaves the two manifests
  # disagreeing, which is what turns the nightly parity audit red.
  Scenario: A one-sided landing is exactly what the parity gate catches
    Given a tracked Rhino CLI parity boundary
    And its parity manifest has been generated and staged
    And a twin parity repository holds a copy of that manifest
    When a tracked parity source file is edited
    And rhino-cli parity manifest validate runs
    Then the parity gate names the edited source and deliberate remedy
    And the twin repository's copy no longer matches this repository's manifest
