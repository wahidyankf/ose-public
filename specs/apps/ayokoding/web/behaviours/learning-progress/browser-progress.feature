Feature: Browser learning progress

  As a learner without an account
  I want progress stored in this browser only
  So that I can resume learning without uploading my learning history

  Background:
    Given the app is running

  # Exemption(integration): browser-origin storage has no separate Phoenix local-resource boundary; alternative-proof: ayokoding-web-e2e:test:e2e / Completion survives a reload without uploading progress
  @integration-exempt
  Scenario: Completion survives a reload without uploading progress
    Given a reader has no saved progress
    When the reader marks a learning page complete and reloads it
    Then the page remains marked complete
    And no HTTP request or LiveView event carries the stored progress record

  # Exemption(integration): browser-origin storage has no separate Phoenix local-resource boundary; alternative-proof: ayokoding-web-e2e:test:e2e / The current v1 record remains readable
  @integration-exempt
  Scenario: The current v1 record remains readable
    Given this origin contains a valid ayokoding-learn-progress-v1 record
    When the reader opens its saved course and path
    Then the saved completed pages and visit context appear correctly
    And the stored record keeps its version 1 schema

  # Exemption(integration): browser-origin storage has no separate Phoenix local-resource boundary; alternative-proof: ayokoding-web-e2e:test:e2e / Completion belongs to the course across its paths
  @integration-exempt
  Scenario: Completion belongs to the course across its paths
    Given a course appears in two paths
    And the reader has completed its learning pages through the first path
    When the reader opens the second path
    Then the course shows the same completed state

  # Exemption(integration): browser-origin storage has no separate Phoenix local-resource boundary; alternative-proof: ayokoding-web-e2e:test:e2e / A completion control can undo a completed page
  @integration-exempt
  Scenario: A completion control can undo a completed page
    Given a learning page is marked complete
    When the reader activates its completion control again
    Then the page becomes incomplete
    And the course completed-page count decreases by one

  # Exemption(integration): browser-origin storage has no separate Phoenix local-resource boundary; alternative-proof: ayokoding-web-e2e:test:e2e / Blocked storage keeps progress for the current visit
  @integration-exempt
  Scenario: Blocked storage keeps progress for the current visit
    Given the browser refuses storage reads and writes
    When the reader marks a learning page complete
    Then completion remains available for the current visit
    And a notice explains that progress cannot be saved
    And the page stays usable without an error

  # Exemption(integration): browser-origin storage has no separate Phoenix local-resource boundary; alternative-proof: ayokoding-web-e2e:test:e2e / Invalid saved progress recovers to an empty valid state
  @integration-exempt
  Scenario: Invalid saved progress recovers to an empty valid state
    Given the saved progress record is invalid
    When the reader opens a course and marks a page complete
    Then the invalid record does not prevent reading or completion
    And a valid version 1 record replaces it when storage is available

  # Exemption(integration): browser-origin storage has no separate Phoenix local-resource boundary; alternative-proof: ayokoding-web-e2e:test:e2e / Confirming reset clears only learning progress
  @integration-exempt
  Scenario: Confirming reset clears only learning progress
    Given a reader has saved progress and unrelated site settings
    When the reader confirms resetting learning progress
    Then the learning progress key is cleared
    And unrelated site settings remain unchanged

  # Exemption(integration): browser-origin storage has no separate Phoenix local-resource boundary; alternative-proof: ayokoding-web-e2e:test:e2e / Cancelling reset preserves progress and restores focus
  @integration-exempt
  Scenario: Cancelling reset preserves progress and restores focus
    Given a reader has saved progress
    When the reader opens reset confirmation and cancels it
    Then saved progress remains unchanged
    And focus returns to the reset control

  # Exemption(integration): browser-origin storage has no separate Phoenix local-resource boundary; alternative-proof: ayokoding-web-e2e:test:e2e / Another tab receives completion changes
  @integration-exempt
  Scenario: Another tab receives completion changes
    Given the same course is open in two tabs of this origin
    When the reader marks a learning page complete in one tab
    Then the other tab updates its progress without reloading

  # Exemption(integration): browser-origin storage has no separate Phoenix local-resource boundary; alternative-proof: ayokoding-web-e2e:test:e2e / Progress stays separate between the old and new local origins
  @integration-exempt
  Scenario: Progress stays separate between the old and new local origins
    Given a reader saved progress on the existing site at port 3101
    And the rewrite origin has no saved progress
    When the reader opens the rewrite at port 3102
    Then the rewrite does not claim to have imported the other origin's progress
    And the existing site's saved progress remains unchanged
