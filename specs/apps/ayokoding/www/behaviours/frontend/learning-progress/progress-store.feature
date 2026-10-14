Feature: Learning progress store

  As a learner without an account
  I want my progress kept in this browser only
  So that I can track what I finished without sending anything anywhere

  Background:
    Given the app is running

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Marking a page complete is saved in this browser only
  @integration-exempt
  Scenario: Marking a page complete is saved in this browser only
    Given a reader has no saved progress
    When the reader marks a learning page as complete
    And the reader reloads the page
    Then the page is still shown as completed
    And no network request sent while marking carries the progress data

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A completed page can be un-checked
  @integration-exempt
  Scenario: A completed page can be un-checked
    Given a reader has marked a learning page as complete
    When the reader activates the completed control again
    Then the page is shown as not completed
    And the course's pages-done count goes down by one

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The site still works when browser storage is blocked
  @integration-exempt
  Scenario: The site still works when browser storage is blocked
    Given the browser refuses to read or write site storage
    When the reader opens a learning page and marks it as complete
    Then the page is shown as completed for the rest of the visit
    And a notice says progress cannot be saved in this browser
    And the page shows no error
