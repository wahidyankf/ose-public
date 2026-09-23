Feature: Report operational proxies honestly
  As a maintainer who reads usage and outcome summaries
  I want observed, derived, and unknown outcomes kept apart
  So that an operational proxy is never mistaken for quality, causation, or zero usage

  Scenario: Summarize outcomes with incomplete visibility
    Given some completed operations have observed durations and some outcomes are unknown
    When the user requests outcome analytics
    Then outcomes and known durations are aggregated, with observed and derived outcomes counted separately
    And unknown outcomes remain in an explicit unknown bucket
    And the output states that the summary is not a semantic quality or causal evaluation
