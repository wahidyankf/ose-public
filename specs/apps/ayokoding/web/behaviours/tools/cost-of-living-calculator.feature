Feature: Cost-of-living and savings calculation

  As a reader comparing places to live
  I want the existing cost and income calculations with shareable inputs
  So that I can compare consistent estimates across both implementations

  Background:
    Given the app is running

  # Behaviour: AYB-025
  Scenario: Calculator costs, savings, and minimum qualifying role match the published reference results
    Given the current shared city, role, and foreign-exchange data
    When a reader enters an established calculator vector's inputs
    Then the displayed costs, savings, and minimum qualifying role match that vector
    And TypeScript and Go produce the same accepted results

  # Behaviour: AYB-052
  Scenario: A calculator URL restores all supported input state
    Given a calculator URL encodes supported geography, household, schooling, and income options
    When a reader opens that URL
    Then every supported input reflects the encoded state
    And copying the current URL preserves the inputs for a new visit

  # Behaviour: AYB-052
  Scenario: Invalid calculator input shows a recovered value or a message, never a misleading estimate
    Given a reader provides an invalid or out-of-range calculator input
    When the tool validates that input
    Then it applies the existing input codec's accepted recovery or validation result
    And the tool does not display a misleading finite estimate from invalid arithmetic

  # Behaviour: AYB-052
  Scenario: Changing geography clears a city that no longer applies
    Given a reader has selected a city
    When the reader changes geography so that city is no longer eligible
    Then the selection follows the current tool's fallback behavior
    And the visible results match the resulting geography and city selection

  Scenario: Currency-converted estimates show the FX snapshot date and each currency's source
    Given the city, salary, and currency datasets have their own source dates
    When either implementation calculates a currency-converted estimate
    Then it uses the shared USD-per-unit rates without refreshing them
    And the independent FX snapshot date and per-currency provenance remain available
