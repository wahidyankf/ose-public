Feature: Locale-scoped site search over HTTP

  As a reader looking for a topic
  I want relevant lessons and tools in the current language
  So that I can reach the right material quickly

  Background:
    Given the app is running

  # Behaviour: AYB-023
  Scenario: The search page route returns results for a query without the dialog
    Given matching published content exists in both supported locales
    When a reader opens the search page for the matching term in one locale
    Then the search page lists the matching results for that locale only
