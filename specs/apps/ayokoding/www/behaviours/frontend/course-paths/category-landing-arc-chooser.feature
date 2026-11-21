Feature: Careers category landing arc chooser

  As a reader exploring careers paths
  I want the careers category landing to offer an arc chooser
  So that I can pick the career arc that matches my situation before picking a specific role

  # Behaviour: AYW-112
  Scenario: The careers category landing groups path cards by arc
    Given a fixture careers manifest set with three arcs is loaded
    When a reader opens the careers category landing at /en/learn/paths/careers/
    Then the page renders one section per arc, each arc heading linking to the arc page
    And the immediately-effective section shows exactly two path cards
