Feature: Skills category landing fixed-arc statement

  As a reader exploring skills paths
  I want the skills category landing to state its one ramp promise plainly, with no chooser
  So that I'm not asked to pick among arcs that don't exist for this category

  # Bound Phase 3, Cycle 3.1b-ii — unit (category-landing.test.tsx) and e2e (course-paths.steps.ts).
  # Behaviour: AYW-113
  Scenario: The skills category landing states its fixed arc once, with no chooser
    Given a fixture skills manifest set is loaded
    When a reader opens the skills category landing at /en/learn/paths/skills/
    Then the page renders the ramp promise once as a statement, not a question
    And no arc-selection control is present anywhere on the page

  # Behaviour: AYW-117
  Scenario: Each skills path card shows the ramp milestone strip
    Given a fixture skills manifest set is loaded
    When a reader opens the skills category landing at /en/learn/paths/skills/
    Then each skills path card shows the ramp milestones "Dangerous", "Comfortable", and "Confident" in that order
