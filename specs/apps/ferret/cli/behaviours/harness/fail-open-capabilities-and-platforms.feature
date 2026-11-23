Feature: Fail open and report harness capabilities honestly
  As a developer who runs several coding-agent harnesses
  I want FERRET to say what it can and cannot observe about each one
  So that a gap in what a harness exposes is shown as unknown rather than as zero usage

  # Behaviour: FRT-047
  # Behaviour: FRT-058
  Scenario Outline: a hook adapter stays silent, exits zero, and returns within 1600 ms whatever fails
    Given <subject>
    And <condition>
    When the adapter handles a lifecycle event
    Then the adapter returns exit code zero within 1600 milliseconds on the exercised host
    And it writes no output into the harness conversation

    Examples:
      | subject                                            | condition                                                   |
      | a harness invokes the FERRET adapter               | FERRET is not installed                                     |
      | a harness invokes the FERRET adapter               | FERRET is given invalid metadata                            |
      | a harness invokes the FERRET adapter               | FERRET is unable to open SQLite                             |
      | a harness invokes the FERRET adapter               | FERRET is blocked by a concurrent writer beyond the timeout |
      | the claude_code hook runs the shared POSIX wrapper | stdin is forwarded byte-for-byte for a supported event      |
      | the claude_code hook runs the shared POSIX wrapper | the event is not one FERRET registers                       |
      | the codex hook runs the shared POSIX wrapper       | the payload carries raw content fields                      |
      | the codex hook runs the shared POSIX wrapper       | the ferret executable is missing                            |
      | the claude_code hook runs the shared POSIX wrapper | the child process hangs past the deadline                   |
      | OpenCode runs the FERRET plugin for a lifecycle hook | the plugin forwards an invalid payload                    |
      | OpenCode runs the FERRET plugin for a lifecycle hook | the child process hangs past the deadline                 |

  # Behaviour: FRT-011
  # Behaviour: FRT-057
  Scenario: Count skill invocations the harness could not name as unknown, not as zero usage
    Given a harness recorded skill invocations, some of which it could not name
    When the user requests usage grouped by skill for that harness
    Then each named skill is counted as observed usage
    And the unnamed invocations are counted as unknown subjects in a group of their own
    And no skill the harness never invoked is reported with a zero count
    And the result states that unknown subject visibility is not zero usage

  # Behaviour: FRT-017
  Scenario: After self uninstall every adapter still exits zero and stays silent
    Given supported harness adapters are configured to call FERRET
    When the user runs self uninstall
    Then every harness adapter still exits zero without writing to either stream or capturing an event

  # Behaviour: FRT-017
  Scenario: self uninstall keeps the data home unless --purge-data --yes is given
    Given supported harness adapters are configured to call FERRET
    When the user runs self uninstall
    Then the existing user database remains recoverable or removable by an explicit user action

  # Behaviour: FRT-016
  # Behaviour: FRT-031
  Scenario Outline: self install creates the artifact, launcher, and manifest with owner-only access
    Given a supported environment with no FERRET artifact installed where <situation>
    When the user runs self install --target user
    Then the artifact, launcher, and manifest are created with owner-only access

    Examples:
      | situation                                  |
      | the user bin directory is already on PATH  |
      | the user bin directory is absent from PATH |

  # Behaviour: FRT-016
  # Behaviour: FRT-031
  Scenario Outline: self install reports its path action
    Given a supported environment with no FERRET artifact installed where <situation>
    When the user runs self install --target user
    Then the command reports path action <path_action>

    Examples:
      | situation                                  | path_action        |
      | the user bin directory is already on PATH  | none               |
      | the user bin directory is absent from PATH | add_home_local_bin |

  # Behaviour: FRT-016
  Scenario Outline: self install edits no shell startup file or PATH
    Given a supported environment with no FERRET artifact installed where <situation>
    When the user runs self install --target user
    Then no shell startup file and no machine-wide PATH are modified

    Examples:
      | situation                                  |
      | the user bin directory is already on PATH  |
      | the user bin directory is absent from PATH |

  # Behaviour: FRT-036
  # Behaviour: FRT-042
  # Behaviour: FRT-054
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

  # Behaviour: FRT-052
  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_self_install_reports_a_collision_when_another_file_owns_the_launcher
  @e2e-exempt
  Scenario: self install reports ferret.install.collision when another file owns the launcher path
    Given a file that FERRET does not own stands where the launcher must go
    When the user runs self install --target user
    Then the command exits 2 with the closed ferret.install.collision error and changes nothing

  # Behaviour: FRT-018
  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_self_uninstall_purge_deletes_the_data_home
  @e2e-exempt
  Scenario: self uninstall --purge-data --yes deletes the data home
    Given FERRET is installed and holds telemetry data
    When the user runs self uninstall --purge-data --yes
    Then the data home is deleted and the command exits 0

  # Behaviour: FRT-018
  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_self_uninstall_purge_without_yes_refuses_and_keeps_the_data_home
  @e2e-exempt
  Scenario: self uninstall --purge-data without --yes refuses and keeps the data home
    Given FERRET is installed and holds telemetry data
    When the user runs self uninstall --purge-data without --yes
    Then the command exits 2 with the closed ferret.args.confirmation-required error and the data home is kept

  # Behaviour: FRT-035
  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_ferret_python_names_the_interpreter_outright
  @e2e-exempt
  Scenario: FERRET_PYTHON names the interpreter to use outright
    Given the artifact is started by an older interpreter and FERRET_PYTHON names a supported one
    And no PATH entry holds a supported interpreter
    When the user runs any FERRET command
    Then FERRET runs the command on the named interpreter

  # Behaviour: FRT-043
  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_an_interpreter_found_but_unstartable_exits_126
  @e2e-exempt
  Scenario: An interpreter that is found but cannot be started exits 126
    Given the artifact is started by an older interpreter and a supported one is found on PATH but cannot start
    When the user runs any FERRET command
    Then FERRET exits 126 and names the interpreter it could not start

  # Behaviour: FRT-044
  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_a_closed_output_pipe_exits_141_and_an_interrupt_exits_130
  @e2e-exempt
  Scenario: A closed output pipe exits 141 and an interrupt exits 130
    Given FERRET has events to export
    When a reader closes standard output before the export ends
    Then FERRET exits 141 with nothing on stderr
    And an interrupt while FERRET waits for input exits 130

  # Behaviour: FRT-019
  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_help_and_version_are_answered_by_the_built_artifact
  @e2e-exempt
  Scenario: ferret --help and ferret help list every command and exit status
    When the user asks for help with --help and with the help command
    Then both list every command and every exit status

  # Behaviour: FRT-020
  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_help_and_version_are_answered_by_the_built_artifact
  @e2e-exempt
  Scenario: ferret version and --version print the version and exit 0
    When the user asks for the version with version and with --version
    Then both print the installed version and exit 0

  # Behaviour: FRT-060
  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_status_reports_command_code_as_probe_required
  @e2e-exempt
  Scenario: status reports Command Code as probe_required
    Given FERRET is initialized
    When the user checks status
    Then status reports the Command Code adapter as probe_required

  # Behaviour: FRT-053
  # Exemption(e2e): no deployed FERRET environment exists: FERRET is a local-only zipapp with no server, so the e2e boundary of a deployed installation is absent; alternative-proof: ferret-cli:test:integration / test_an_internal_failure_escaping_the_command_line_exits_2
  @e2e-exempt
  Scenario: An internal failure exits 2 with ferret.internal.failure
    Given FERRET meets a fault that escapes its command line
    When the user runs a command
    Then FERRET writes ferret.internal.failure to stderr and exits 2
