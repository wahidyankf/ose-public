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

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Progress is shared by every path that contains the course
  @integration-exempt
  Scenario: Progress is shared by every path that contains the course
    Given a course belongs to two paths
    And the reader completed every learning page of that course while following the first path
    When the reader opens the second path's page
    Then that course's card shows "Done"

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The site still works when browser storage is blocked
  @integration-exempt
  Scenario: The site still works when browser storage is blocked
    Given the browser refuses to read or write site storage
    When the reader opens a learning page and marks it as complete
    Then the page is shown as completed for the rest of the visit
    And a notice says progress cannot be saved in this browser
    And the page shows no error

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Unreadable saved progress is ignored and replaced
  @integration-exempt
  Scenario: Unreadable saved progress is ignored and replaced
    Given the saved progress record cannot be read as valid progress
    When the reader opens a path page
    Then every course card shows "Not started"
    And marking a learning page as complete saves a valid progress record

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Progress updates in another open tab
  @integration-exempt
  Scenario: Progress updates in another open tab
    Given the same path page is open in two tabs
    When the reader marks a learning page as complete in a third tab
    Then both open tabs show the new count without a reload
