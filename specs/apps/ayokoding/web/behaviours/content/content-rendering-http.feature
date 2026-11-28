Feature: Shared learning content rendering over HTTP

  As a learner reading lessons
  I want the authored content and its interactive formats to remain intact
  So that changing the application framework does not change the lesson

  Background:
    Given the app is running

  # Behaviour: AYB-018
  Scenario: A lesson page is readable without browser scripts
    Given a published Markdown lesson exists in the shared corpus
    When a reader requests its route without running browser scripts
    Then the response contains the lesson title and readable article body
    And the response does not depend on a client-side build artifact

  # Behaviour: AYB-008
  # Behaviour: AYB-054
  @fixture
  Scenario: A draft lesson's route returns not found
    Given a lesson is marked as a draft
    And draft viewing is disabled
    When a reader requests the draft lesson's route
    Then its direct route returns not found

  # Behaviour: AYB-008
  @fixture
  Scenario: A draft lesson is absent from search results
    Given a lesson is marked as a draft
    And draft viewing is disabled
    When a reader searches the corpus
    Then the lesson is absent from the public results

  # Behaviour: AYB-031
  Scenario: A missing page returns the locale's not-found experience
    When a reader requests a nonexistent content route in a supported locale
    Then the response status is 404
    And the reader sees a localized not-found page with usable navigation

  # Behaviour: AYB-007
  @fixture
  Scenario: With AYOKODING_WEB_SHOW_DRAFTS set to true a draft lesson is shown
    Given AYOKODING_WEB_SHOW_DRAFTS is set to true for the app
    And a lesson is marked as a draft
    When a reader requests the draft lesson's route
    Then the draft lesson's page shows its title and body
