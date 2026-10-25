Feature: AI model benchmark comparison

  As a reader comparing AI models
  I want the existing benchmark results and shareable filters
  So that I can compare the same evidence in either implementation

  Background:
    Given the app is running

  Scenario: Benchmark calculations match the shared reference vectors
    Given the current shared benchmark data and an established calculation vector
    When the reader applies that vector's filters and comparison options
    Then the displayed figures, ordering, and value results match the vector
    And TypeScript and Elixir produce the same accepted results

  Scenario: A benchmark URL restores all supported filter state
    Given a benchmark URL encodes supported comparison options
    When a reader opens that URL
    Then every supported option reflects the encoded state
    And copying the current URL preserves that state for a new visit

  Scenario: Invalid benchmark URL values recover using existing defaults
    Given a benchmark URL contains invalid or unknown filter values
    When a reader opens that URL
    Then the tool uses the existing codec's valid defaults for those values
    And the comparison remains usable without an error

  Scenario: Shared-data extraction preserves benchmark provenance
    Given the benchmark data has been extracted into shared JSON
    When either implementation reads the data and generates its reference results
    Then model figures, prices, ordering policies, and reference results remain unchanged
    And the source links, source dates, notes, and methodology remain available

  Scenario: A benchmark filter with no matches shows an empty result
    Given a supported filter combination matches no model
    When the reader applies that combination
    Then the tool shows an intentional no-results state
    And the reader can change or reset the filters
