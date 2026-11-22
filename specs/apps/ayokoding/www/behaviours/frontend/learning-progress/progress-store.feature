Feature: Learning progress store

  As a learner without an account
  I want my progress kept in this browser only
  So that I can track what I finished without sending anything anywhere

  Background:
    Given the app is running

  # Behaviour: AYW-013
  Scenario: A completed page stays completed after a reload
    Given a reader has no saved progress
    When the reader marks a learning page as complete
    And the reader reloads the page
    Then the page is still shown as completed

  # Behaviour: AYW-013
  Scenario: Marking a page complete is saved in this browser only
    Given a reader has no saved progress
    When the reader marks a learning page as complete
    Then no network request sent while marking carries the progress data

  Scenario: A completed page can be un-checked
    Given a reader has marked a learning page as complete
    When the reader activates the completed control again
    Then the page is shown as not completed
    And the course's pages-done count goes down by one

  Scenario: Progress is shared by every path that contains the course
    Given a course belongs to two paths
    And the reader completed every learning page of that course while following the first path
    When the reader opens the second path's page
    Then that course's card shows "Done"

  # Behaviour: AYW-016
  Scenario: The site still works when browser storage is blocked
    Given the browser refuses to read or write site storage
    When the reader opens a learning page and marks it as complete
    Then the page is shown as completed for the rest of the visit
    And a notice says progress cannot be saved in this browser
    And the page shows no error

  Scenario: Unreadable saved progress is ignored and replaced
    Given the saved progress record cannot be read as valid progress
    When the reader opens a path page
    Then every course card shows "Not started"
    And marking a learning page as complete saves a valid progress record

  # Behaviour: AYW-014
  Scenario: Resetting progress clears it after confirmation
    Given a reader has saved progress
    When the reader chooses "Reset progress" on the Learn home and confirms
    Then every progress count on the Learn home shows nothing done
    And no saved progress record remains in this browser

  Scenario: Cancelling a reset keeps progress
    Given a reader has saved progress
    When the reader chooses "Reset progress" on the Learn home and cancels
    Then the saved progress is unchanged
    And focus returns to the "Reset progress" button

  Scenario: Progress appears without the page layout shifting
    Given a reader has saved progress
    When the reader opens a path page, a learning page, a course landing page, and the Learn home
    Then each progress area and the content below it sit at the same position as in the page served before scripts run
    And the browser console shows no hydration error

  # Behaviour: AYW-015
  Scenario: Progress updates in another open tab
    Given the same path page is open in two tabs
    When the reader marks a learning page as complete in a third tab
    Then both open tabs show the new count without a reload
