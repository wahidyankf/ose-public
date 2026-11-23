Feature: Platform-bound code is validated statically
  As a reader
  I want code that cannot run in a Linux container at least compiled or validated
  So that it contains no syntax errors

  Background:
    Given an opted-in course

  # Behaviour: AYC-070
  Scenario: A static unit runs its validator and never the program
    Given a static unit with reason "ios", a note, and a validator command
    When I check the course by name
    Then only the validator command was executed
    And the unit is labelled "passed (static)"

  # Behaviour: AYC-055
  Scenario Outline: Static mode needs a known reason and a note
    Given a static unit with reason "<reason>" and note "<note>"
    When I validate the course
    Then the finding "<code>" is reported

    Examples:
      | reason  | note                   | code                                    |
      | desktop | Needs a desktop shell. | ayokoding.runspec.unknown-static-reason |
      | ios     |                        | ayokoding.runspec.missing-static-note   |

  # Behaviour: AYC-055
  Scenario: Static mode with services is rejected
    Given a static unit that declares the "postgres" service
    When I validate the course
    Then the finding "ayokoding.runspec.static-with-services" is reported
