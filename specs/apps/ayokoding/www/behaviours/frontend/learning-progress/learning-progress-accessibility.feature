Feature: Learning progress accessibility

  As a keyboard, screen-reader, or phone user
  I want progress shown in words and controls I can reach and hear
  So that I get the same information and actions as every other learner

  Background:
    Given the app is running

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Status is shown in words, not only colour
  @integration-exempt
  Scenario: Status is shown in words, not only colour
    Given a reader has courses that are done, in progress, and not started
    When the reader opens a path page
    Then every course status is written as the words "Done", "In progress", or "Not started"
    And every progress bar has a text equivalent such as "3 of 13 core courses done"

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Progress controls work with the keyboard and announce changes
  @integration-exempt
  Scenario: Progress controls work with the keyboard and announce changes
    Given a reader on a learning page uses only the keyboard
    When the reader tabs to "Mark as complete" and presses Space
    Then the control's pressed state becomes true
    And a status message announces that the page is complete and the new count

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Reduced motion turns off progress animations
  @integration-exempt
  Scenario: Reduced motion turns off progress animations
    Given the reader's system asks for reduced motion
    When the reader marks a page as complete
    Then no progress bar or status element animates

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Progress screens fit a phone screen
  @integration-exempt
  Scenario: Progress screens fit a phone screen
    Given a 375 pixel wide viewport
    When the reader opens the Learn home, a path page, a learning page, and a course landing page
    Then no page scrolls horizontally
    And every progress control is at least 44 by 44 CSS pixels

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Progress screens pass automated accessibility checks
  @integration-exempt
  Scenario: Progress screens pass automated accessibility checks
    Given a reader has saved progress
    When the Learn home, a path page, a learning page, and a course landing page are scanned for WCAG 2 A and AA rules
    Then no scan reports a violation
