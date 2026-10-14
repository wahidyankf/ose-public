Feature: Path roadmap

  As a path follower
  I want the path page to show phases, outcomes, and my progress
  So that I can see the journey and take the next step

  Background:
    Given the app is running

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Each core phase is a milestone with its outcome and progress
  @integration-exempt
  Scenario: Each core phase is a milestone with its outcome and progress
    When a reader opens a path page
    Then each core phase shows its number, title, and "After this phase you can" outcome when the path defines one
    And each core phase shows "x of y done" for its courses

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Course cards show order, time, format, and status in words
  @integration-exempt
  Scenario: Course cards show order, time, format, and status in words
    When a reader opens a path page
    Then each course card shows its position number, title, estimated time, and format
    And each course card shows "Done", "In progress", or "Not started" as text
    And an outline course card shows an "Outline" badge

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A new reader sees one Start button
  @integration-exempt
  Scenario: A new reader sees one Start button
    Given a reader has no saved progress
    When the reader opens a path page
    Then exactly one primary button reads "Start:" followed by the first course's title
    And it links to that course's landing page in path context

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A returning reader sees Continue with the next course
  @integration-exempt
  Scenario: A returning reader sees Continue with the next course
    Given a reader completed some learning pages of the path's second course
    When the reader opens the path page
    Then the primary button reads "Continue:" followed by the second course's title
    And it links to the first learning page of that course the reader has not completed

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Optional extensions are separate and closed by default
  @integration-exempt
  Scenario: Optional extensions are separate and closed by default
    When a reader opens a path that has extension phases
    Then an "Optional extensions" heading follows the last core phase
    And each extension phase is a closed section that shows its title and "x of y done"
    And opening an extension phase shows its course cards

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The path headline counts core courses only
  @integration-exempt
  Scenario: The path headline counts core courses only
    Given a reader completed every learning page of one extension course and nothing else
    When the reader opens the path page
    Then the headline reads "0 of N core courses done"
    And that extension phase shows "1 of M done"

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Finishing the core path shows completion
  @integration-exempt
  Scenario: Finishing the core path shows completion
    Given a reader completed every core course of a path
    When the reader opens the path page
    Then the headline says the core path is complete
    And no "Start" or "Continue" button is shown

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A skills path waiting for its restructure shows one flat list with progress
  @integration-exempt
  Scenario: A skills path waiting for its restructure shows one flat list with progress
    Given a skills path is marked as pending restructure
    When a reader opens that path page
    Then its courses appear in one list in today's order with status in words
    And no phase heading, outcome line, or "Optional extensions" heading appears
