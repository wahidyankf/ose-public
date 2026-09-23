Feature: Query and export local telemetry deterministically
  As a developer who runs several coding-agent harnesses
  I want to filter and export the events stored on this machine in a stable order
  So that people and scripts read the same reproducible result and diagnostics never corrupt it

  Scenario: Filter and export deterministic local events
    Given the database contains events from two workspaces and two harnesses
    When the user filters by UTC interval, harness, workspace, event type, and outcome
    Then only matching events are listed, newest first by timestamp and then event ID
    And the JSON Lines export holds one canonical event object per line, oldest first by timestamp and then event ID
    And diagnostics do not contaminate standard output

  Scenario Outline: Emit a stable machine-readable command result
    Given FERRET is initialized
    When the user runs <command> with --json
    Then stdout is one JSON object carrying schemaVersion and command
    And the human output of the same command derives from that same result
    And a failure instead emits a closed error code exposing no path beyond the resolved data home

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

  Scenario: Keep the export a raw stream when JSON is requested
    Given FERRET is initialized
    When the user exports events once with --json and once without it
    Then the export with --json exits 2 with the closed ferret.args.invalid error on stderr and nothing on stdout
    And the export without --json writes one canonical event object per line

  Scenario: Use FERRET without a backend
    Given no backend URL, token, or process exists
    When the user captures, lists, exports, summarizes, and maintains local events
    Then every command completes using only the local data home
    And status identifies backend synchronization as unavailable by design
    And no network connection is attempted
