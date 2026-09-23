Feature: Fail open and report harness capabilities honestly
  As a developer who runs several coding-agent harnesses
  I want FERRET to say what it can and cannot observe about each one
  So that a gap in what a harness exposes is shown as unknown rather than as zero usage

  Scenario Outline: Keep a harness fail-open after a local failure
    Given a harness invokes the FERRET adapter
    And FERRET is <condition>
    When the adapter handles a lifecycle event
    Then the adapter returns exit code zero within 1000 milliseconds
    And it writes no output into the harness conversation

    Examples:
      | condition                                         |
      | not installed                                     |
      | given invalid metadata                            |
      | unable to open SQLite                             |
      | blocked by a concurrent writer beyond the timeout |

  Scenario: Count skill invocations the harness could not name as unknown, not as zero usage
    Given a harness recorded skill invocations, some of which it could not name
    When the user requests usage grouped by skill for that harness
    Then each named skill is counted as observed usage
    And the unnamed invocations are counted as unknown subjects in a group of their own
    And no skill the harness never invoked is reported with a zero count
    And the result states that unknown subject visibility is not zero usage

  Scenario: Remove FERRET without changing harness behaviour
    Given supported harness adapters are configured to call FERRET
    When the user runs self uninstall
    Then every harness adapter still exits zero without writing to either stream or capturing an event
    And the repository contains no newly generated telemetry data
    And the existing user database remains recoverable or removable by an explicit user action

  Scenario Outline: Install privately for the current user
    Given a supported environment with no FERRET artifact installed where <situation>
    When the user runs self install --target user
    Then the artifact, launcher, and manifest are created with owner-only access
    And the command reports path action <path_action>
    And no shell startup file and no machine-wide PATH are modified

    Examples:
      | situation                                  | path_action        |
      | the user bin directory is already on PATH  | none               |
      | the user bin directory is absent from PATH | add_home_local_bin |

  Scenario Outline: Run on a host whose default interpreter is older than FERRET requires
    Given the artifact is started by <interpreter>
    When the user runs any FERRET command
    Then FERRET <outcome>
    And no Python traceback reaches the caller

    Examples:
      | interpreter                                             | outcome                                            |
      | an interpreter FERRET supports                          | runs the command on that interpreter               |
      | an older interpreter while a supported one is reachable | restarts itself on the supported interpreter       |
      | an older interpreter with no supported one reachable    | exits 2 naming the version it requires             |

  Scenario Outline: Keep one POSIX adapter fail-open at the wrapper boundary
    Given the <harness> hook runs the shared POSIX wrapper
    When <condition>
    Then the wrapper exits zero and writes nothing to either stream
    And any surviving child is terminated by TERM at 900 milliseconds and KILL at 1000 milliseconds

    Examples:
      | harness     | condition                                              |
      | claude_code | stdin is forwarded byte-for-byte for a supported event |
      | claude_code | the event is not one FERRET registers                  |
      | codex       | the payload carries raw content fields                 |
      | codex       | the ferret executable is missing                       |
      | claude_code | the child process hangs past the deadline              |

  Scenario Outline: Keep the OpenCode plugin fail-open at its process boundary
    Given OpenCode runs the FERRET plugin for a lifecycle hook
    When <condition>
    Then the plugin completes the hook without an error and writes nothing to either stream
    And any surviving child is terminated by TERM at 900 milliseconds and KILL at 1000 milliseconds

    Examples:
      | condition                                 |
      | the plugin forwards an invalid payload    |
      | the child process hangs past the deadline |
