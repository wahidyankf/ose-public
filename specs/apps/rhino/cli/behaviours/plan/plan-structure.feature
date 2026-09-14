@plan-structure
Feature: Plan structure validation

  As a maintainer or an AI coding agent who writes plans
  I want rhino-cli plan validate to check every plan's lifecycle, documents, companions, criteria and delivery order
  So that a plan that drifts from the shared plan structure fails exactly as the pinned RHINO validator reports it

  Scenario: Every accepted corpus case validates clean
    Given the shared plan-structure corpus matches its recorded digest
    When the developer runs plan validate over every accepted case
    Then every case exits successfully and reports no findings

  Scenario: Every rejected corpus case reports exactly the rules its manifest names
    Given the shared plan-structure corpus matches its recorded digest
    When the developer runs plan validate over every rejected case
    Then every case exits with a failure code
    And every case reports exactly the rule identifiers its manifest row names

  Scenario: A clean tree reports how many plans it checked
    Given a plans tree holding one conforming backlog plan
    When the developer runs plan validate
    Then the command exits successfully
    And standard output reads "[plan] checked 1 plan, no findings"
    And standard error is empty

  Scenario: Findings go to standard error one per line in path order
    Given a plans tree holding two backlog plans that each lack learnings.md
    When the developer runs plan validate
    Then the command exits with a failure code
    And standard output reads "[plan] checked 2 plans, 2 findings"
    And standard error lists one "PLAN-DOCUMENT-001" line per plan with the earlier path first

  Scenario: JSON output carries the same findings
    Given a plans tree holding one backlog plan that lacks learnings.md
    When the developer runs plan validate with JSON output
    Then the command exits with a failure code
    And standard output is one JSON document whose violations name "PLAN-DOCUMENT-001"
    And standard error is empty

  Scenario: A plan document that is not text refuses the run
    Given a plans tree holding one backlog plan whose delivery.md is not UTF-8 text
    When the developer runs plan validate
    Then the command exits with code 2
    And standard output is empty
    And standard error names the delivery document and says it holds no text
