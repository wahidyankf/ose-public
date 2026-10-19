Feature: Platform-bound code is validated statically
  As a reader
  I want code that cannot run in a Linux container at least compiled or validated
  So that it contains no syntax errors

  Background:
    Given an opted-in course

  Scenario: A static unit runs its validator and never the program
    Given a static unit with reason "ios", a note, and a validator command
    When I check the course by name
    Then only the validator command was executed
    And the unit is labelled "passed (static)"

  # Exemption(e2e): reason validation is static decoding of local files with no container; alternative-proof: ayokoding-cli:test:integration / Static mode needs a known reason and a note
  @e2e-exempt
  Scenario Outline: Static mode needs a known reason and a note
    Given a static unit with reason "<reason>" and note "<note>"
    When I validate the course
    Then the finding "<code>" is reported

    Examples:
      | reason  | note                   | code                                 |
      | desktop | Needs a desktop shell. | ayokoding.runspec.unknown-static-reason |
      | ios     |                        | ayokoding.runspec.missing-static-note   |

  # Exemption(e2e): the services rule is static decoding of local files with no container; alternative-proof: ayokoding-cli:test:integration / Static mode with services is rejected
  @e2e-exempt
  Scenario: Static mode with services is rejected
    Given a static unit that declares the "postgres" service
    When I validate the course
    Then the finding "ayokoding.runspec.static-with-services" is reported
