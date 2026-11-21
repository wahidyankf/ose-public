Feature: Course code lives in canonical units
  As a content author
  I want misplaced code reported
  So that every runnable program in an opted-in course has a unit

  Background:
    Given an opted-in course

  # Behaviour: AYC-005
  # Behaviour: AYC-052
  Scenario: A flat example file is a layout finding
    Given the course has the file "learning/code/ex-03-loops.py"
    When I validate the course
    Then the finding "ayokoding.layout.flat-example" names "learning/code/ex-03-loops.py"

  # Behaviour: AYC-052
  Scenario: Code outside the canonical places is a layout finding
    Given the course has code under "learning/coroutines/code"
    When I validate the course
    Then the finding "ayokoding.layout.unplaced-code" names "learning/coroutines/code"

  # Behaviour: AYC-052
  Scenario: A unit without a run spec is a layout finding
    Given the course has the unit "learning/code/ex-04-maps" without a run spec
    When I validate the course
    Then the finding "ayokoding.layout.missing-run-spec" names "learning/code/ex-04-maps"

  # Behaviour: AYC-052
  Scenario: A run spec outside a unit folder is a layout finding
    Given the course has a run spec at "learning/run.yaml"
    When I validate the course
    Then the finding "ayokoding.layout.misplaced-run-spec" names "learning/run.yaml"
