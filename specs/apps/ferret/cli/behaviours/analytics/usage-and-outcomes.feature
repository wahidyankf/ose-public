Feature: Report operational proxies honestly
  As a maintainer who reads usage and outcome summaries
  I want observed, derived, and unknown outcomes kept apart
  So that an operational proxy is never mistaken for quality, causation, or zero usage

  # Behaviour: FRT-013
  Scenario: Summarize outcomes with incomplete visibility
    Given some completed operations have observed durations and some outcomes are unknown
    When the user requests outcome analytics
    Then outcomes and known durations are aggregated, with observed and derived outcomes counted separately
    And unknown outcomes remain in an explicit unknown bucket
    And the output states that the summary is not a semantic quality or causal evaluation

  # Behaviour: FRT-012
  Scenario Outline: Count usage by one to three dimensions and honour the filters
    Given the database holds agent-ended events from two harnesses
    When the user counts usage grouped by <dimensions> for the codex harness only
    Then each group names every dimension asked for and counts the matching events once
    And no event from the other harness is counted

    Examples:
      | dimensions         |
      | harness            |
      | harness,event_type |
      | harness,event_type,agent |

  # Behaviour: FRT-045
  Scenario Outline: Outcomes refuses a group-by list that repeats or misnames a dimension
    Given FERRET is initialized
    When the user runs outcomes grouped by <dimensions>
    Then the command exits 2 with ferret.args.invalid on stderr and nothing on stdout

    Examples:
      | dimensions      |
      | harness,harness |
      | colour          |
