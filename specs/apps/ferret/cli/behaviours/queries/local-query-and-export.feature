Feature: Query and export local telemetry deterministically
  As a developer who runs several coding-agent harnesses
  I want to filter and export the events stored on this machine in a stable order
  So that people and scripts read the same reproducible result and diagnostics never corrupt it

  # Behaviour: FRT-009
  # Behaviour: FRT-027
  # Behaviour: FRT-040
  Scenario: events list shows matching events newest first
    Given the database contains events from two workspaces and two harnesses
    When the user filters by UTC interval, harness, workspace, event type, and outcome
    Then only matching events are listed, newest first by timestamp and then event ID

  # Behaviour: FRT-010
  Scenario: events export writes one event per line oldest first
    Given the database contains events from two workspaces and two harnesses
    When the user filters by UTC interval, harness, workspace, event type, and outcome
    Then the JSON Lines export holds one canonical event object per line, oldest first by timestamp and then event ID

  Scenario: diagnostics never reach standard output
    Given the database contains events from two workspaces and two harnesses
    When the user filters by UTC interval, harness, workspace, event type, and outcome
    Then diagnostics do not contaminate standard output

  # Behaviour: FRT-021
  # Behaviour: FRT-022
  Scenario Outline: --json prints one object with schemaVersion and command
    Given FERRET is initialized
    When the user runs <command> with --json
    Then stdout is one JSON object carrying schemaVersion and command

    Examples:
      | command        |
      | init           |
      | events list    |
      | usage          |
      | outcomes       |
      | status         |
      | maintenance    |
      | self install   |
      | self uninstall |

  Scenario Outline: A --json failure prints a closed error code that exposes no path beyond the data home
    Given FERRET is initialized
    When the user runs <command> with --json
    Then a failure instead emits a closed error code exposing no path beyond the resolved data home

    Examples:
      | command        |
      | init           |
      | events list    |
      | usage          |
      | outcomes       |
      | status         |
      | maintenance    |
      | self install   |
      | self uninstall |

  # Behaviour: FRT-029
  # Behaviour: FRT-030
  # Behaviour: FRT-045
  Scenario: export --json exits 2 with ferret.args.invalid
    Given FERRET is initialized
    When the user exports events with --json
    Then the export with --json exits 2 with the closed ferret.args.invalid error on stderr and nothing on stdout

  Scenario: Every command works using only the local data home
    Given no backend URL, token, or process exists
    When the user captures, lists, exports, summarizes, and maintains local events
    Then every command completes using only the local data home
    And no network connection is attempted

  # Behaviour: FRT-008
  Scenario: status reports backend synchronization as unavailable by design
    Given no backend URL, token, or process exists
    When the user checks status
    Then status identifies backend synchronization as unavailable by design

  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_events_list_pages_results_with_limit_and_cursor
  @e2e-exempt
  # Behaviour: FRT-023
  # Behaviour: FRT-024
  Scenario: events list pages results with --limit and --cursor
    Given the database holds more events than one page
    When the user lists events with --limit 2 and --all-time, then resumes with each returned cursor
    Then the first page holds the two newest events and the second page holds the rest
    And a --limit outside 1 to 200 is refused with ferret.args.invalid

  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_a_cursor_this_query_did_not_issue_reports_cursor_invalid
  @e2e-exempt
  # Behaviour: FRT-050
  Scenario: A bad cursor reports ferret.cursor.invalid
    Given the database holds events
    When the user lists events with a cursor that this query did not issue
    Then the command exits 2 with the closed ferret.cursor.invalid error

  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_an_empty_query_result_exits_1
  @e2e-exempt
  # Behaviour: FRT-041
  Scenario Outline: An empty query result exits 1 for <command>
    Given FERRET is initialized with no events in the window
    When the user runs <command>
    Then the command exits 1 and reports that no rows matched

    Examples:
      | command                      |
      | events list                  |
      | usage --group-by harness     |
      | outcomes --group-by harness  |

  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_a_bad_filter_value_reports_filter_invalid
  @e2e-exempt
  # Behaviour: FRT-051
  Scenario: A bad filter value reports ferret.filter.invalid
    Given FERRET is initialized
    When the user lists events with a filter value that is not valid
    Then the command exits 2 with the closed ferret.filter.invalid error and reads no event

  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_every_query_filters_by_agent_skill_and_tool
  @e2e-exempt
  # Behaviour: FRT-028
  Scenario: events list, events export, usage, and outcomes filter by agent, skill, and tool
    Given the database contains events for several agents, skills, and tools
    When the user filters each command by one agent, skill, and tool
    Then each command returns only the events that carry that agent, skill, and tool

  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_the_default_window_is_the_last_seven_days
  @e2e-exempt
  # Behaviour: FRT-038
  Scenario: The default window is the last seven days
    Given events from eight days ago and from two days ago
    When the user lists events without a window option
    Then only the event from two days ago is listed

  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_from_and_to_bound_the_window
  @e2e-exempt
  # Behaviour: FRT-025
  Scenario: --from and --to bound the window
    Given events from three different days
    When the user lists events with --from and --to around the middle day
    Then only the events inside that interval are listed

  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_all_time_ignores_the_seven_day_window
  @e2e-exempt
  # Behaviour: FRT-026
  Scenario: --all-time ignores the seven-day window
    Given events from twenty days ago and from two days ago
    When the user lists events with --all-time
    Then both events are listed
