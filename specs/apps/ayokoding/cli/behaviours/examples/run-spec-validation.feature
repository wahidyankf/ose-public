Feature: Run specs are strict
  As a content author
  I want an invalid run spec rejected with a precise reason
  So that a typo never silently weakens a check

  # Exemption(e2e): run spec validation is static decoding of local files with no container; alternative-proof: ayokoding-cli:test:integration / An unknown key is rejected
  @e2e-exempt
  Scenario: An unknown key is rejected
    Given a unit whose run spec has the key "expected_output"
    When I validate the course
    Then the finding "ayokoding.runspec.unknown-key" names the unit and line of "expected_output"

  # Exemption(e2e): run spec validation is static decoding of local files with no container; alternative-proof: ayokoding-cli:test:integration / An unknown toolchain is rejected
  @e2e-exempt
  Scenario: An unknown toolchain is rejected
    Given a unit whose run spec names the toolchain "cobol"
    When I validate the course
    Then the finding "ayokoding.runspec.unknown-toolchain" names "cobol"

  # Exemption(e2e): run spec validation is static decoding of local files with no container; alternative-proof: ayokoding-cli:test:integration / A path that leaves the unit is rejected
  @e2e-exempt
  Scenario: A path that leaves the unit is rejected
    Given a unit whose run expects standard output from "../shared/out.txt"
    When I validate the course
    Then the finding "ayokoding.runspec.path-escape" names "../shared/out.txt"

  # Exemption(e2e): run spec validation is static decoding of local files with no container; alternative-proof: ayokoding-cli:test:integration / A timeout above the maximum is rejected
  @e2e-exempt
  Scenario: A timeout above the maximum is rejected
    Given a unit whose run has the timeout "601s"
    When I validate the course
    Then the finding "ayokoding.runspec.timeout-out-of-range" names "601s"

  # Exemption(e2e): run spec validation is static decoding of local files with no container; alternative-proof: ayokoding-cli:test:integration / Ignored example output needs a stated invariant
  @e2e-exempt
  Scenario: Ignored example output needs a stated invariant
    Given a unit whose example run ignores standard output and states no invariant
    When I validate the course
    Then the finding "ayokoding.runspec.missing-invariant" names the run

  # Exemption(e2e): run spec validation is static decoding of local files with no container; alternative-proof: ayokoding-cli:test:integration / A complete run spec passes validation
  @e2e-exempt
  Scenario: A complete run spec passes validation
    Given a unit whose run spec declares a toolchain, a command, an exit status, and an expected output file
    When I validate the course
    Then no finding is reported for the unit
