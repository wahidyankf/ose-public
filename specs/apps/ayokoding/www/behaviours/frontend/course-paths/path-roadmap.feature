Feature: Path roadmap

  As a path follower
  I want the path page to show phases, outcomes, and my progress
  So that I can see the journey and take the next step

  Background:
    Given the app is running

  # Behaviour: AYW-122
  Scenario: Each core phase is a milestone with its outcome and progress
    When a reader opens a path page
    Then each core phase shows its number, title, and "After this phase you can" outcome when the path defines one
    And "You cannot yet" is shown only for a phase that declares what the reader cannot yet do

  Scenario: Each phase shows how many of its courses are done
    When a reader opens a path page
    Then each core phase shows "x of y done" for its courses

  Scenario: A course card shows its position, title, time, and format
    When a reader opens a path page
    Then each course card shows its position number, title, estimated time, and format

  # Behaviour: AYW-124
  Scenario: A course card shows Done, In progress, or Not started as text
    When a reader opens a path page
    Then each course card shows "Done", "In progress", or "Not started" as text

  # Behaviour: AYW-125
  Scenario: A new reader sees one Start button
    Given a reader has no saved progress
    When the reader opens a path page
    Then exactly one primary button reads "Start:" followed by the first course's title
    And it links to that course's landing page in path context

  # Behaviour: AYW-125
  Scenario: A returning reader sees Continue with the next course
    Given a reader completed some learning pages of the path's second course
    When the reader opens the path page
    Then the primary button reads "Continue:" followed by the second course's title
    And it links to the first learning page of that course the reader has not completed

  # Behaviour: AYW-123
  Scenario: Optional extensions are separate and closed by default
    When a reader opens a path that has extension phases
    Then an "Optional extensions" heading follows the last core phase
    And every extension phase is listed under that heading
    And each extension phase is a closed section that shows its title and "x of y done"
    And opening an extension phase shows its course cards

  # Behaviour: AYW-126
  Scenario: The path headline counts core courses only
    Given a reader completed every learning page of one extension course and nothing else
    When the reader opens the path page
    Then the headline reads "0 of N core courses done"
    And that extension phase shows "1 of M done"

  # Behaviour: AYW-125
  Scenario: Finishing the core path shows completion
    Given a reader completed every core course of a path
    When the reader opens the path page
    Then the headline says the core path is complete
    And no "Start" or "Continue" button is shown

  # Behaviour: AYW-127
  Scenario: A skills path waiting for its restructure shows one flat list with progress
    Given a skills path is marked as pending restructure
    When a reader opens that path page
    Then its courses appear in one list in today's order with status in words
    And no phase heading, outcome line, "Before you start" note, or "Optional extensions" heading appears
