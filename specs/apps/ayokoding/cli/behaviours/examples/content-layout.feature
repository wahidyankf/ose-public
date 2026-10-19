Feature: Course code lives in canonical units
  As a content author
  I want misplaced code reported
  So that every runnable program in an opted-in course has a unit

  Background:
    Given an opted-in course

  # Exemption(e2e): layout validation reads files and starts no container; alternative-proof: ayokoding-cli:test:integration / A flat example file is a layout finding
  @e2e-exempt
  Scenario: A flat example file is a layout finding
    Given the course has the file "learning/code/ex-03-loops.py"
    When I validate the course
    Then the finding "ayokoding.layout.flat-example" names "learning/code/ex-03-loops.py"

  # Exemption(e2e): layout validation reads files and starts no container; alternative-proof: ayokoding-cli:test:integration / Code outside the canonical places is a layout finding
  @e2e-exempt
  Scenario: Code outside the canonical places is a layout finding
    Given the course has code under "learning/coroutines/code"
    When I validate the course
    Then the finding "ayokoding.layout.unplaced-code" names "learning/coroutines/code"

  # Exemption(e2e): layout validation reads files and starts no container; alternative-proof: ayokoding-cli:test:integration / A unit without a run spec is a layout finding
  @e2e-exempt
  Scenario: A unit without a run spec is a layout finding
    Given the course has the unit "learning/code/ex-04-maps" without a run spec
    When I validate the course
    Then the finding "ayokoding.layout.missing-run-spec" names "learning/code/ex-04-maps"

  # Exemption(e2e): layout validation reads files and starts no container; alternative-proof: ayokoding-cli:test:integration / A run spec outside a unit folder is a layout finding
  @e2e-exempt
  Scenario: A run spec outside a unit folder is a layout finding
    Given the course has a run spec at "learning/run.yaml"
    When I validate the course
    Then the finding "ayokoding.layout.misplaced-run-spec" names "learning/run.yaml"
