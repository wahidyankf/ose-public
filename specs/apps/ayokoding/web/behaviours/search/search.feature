Feature: Locale-scoped site search

  As a reader looking for a topic
  I want relevant lessons and tools in the current language
  So that I can reach the right material quickly

  Background:
    Given the app is running

  Scenario: The keyboard shortcut opens search with input focus
    When a reader presses the platform's search shortcut
    Then the search dialog opens
    And the search input receives focus

  Scenario: Results stay within the current locale
    Given matching published content exists in both supported locales
    When a reader searches for the matching term in one locale
    Then results link only to that locale's published content
    And each result shows a title, section path, and matching excerpt

  Scenario: Empty search input does not display stale results
    Given the search dialog has results for an earlier query
    When the reader clears the query to whitespace
    Then the earlier results disappear
    And the dialog remains usable without an error

  Scenario: Choosing a result closes search and opens its destination
    Given a reader has search results for a published page
    When the reader chooses that result
    Then the corresponding content route opens
    And the search dialog closes

  Scenario: Search includes both interactive tools
    When a reader searches for the name of either interactive tool
    Then the matching tool page appears as a result in the current locale

  Scenario: Escape returns focus to the search opener
    Given the search dialog is open
    When the reader presses Escape
    Then the search dialog closes
    And focus returns to the control that opened it
