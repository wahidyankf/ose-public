@rust-delegation
Feature: Validators RHINO provides run through the repository's pinned RHINO

  As a maintainer keeping one implementation of every governance rule
  I want each rhino-cli validator that RHINO provides to run the repository's pinned ./rhino
  So that F# keeps only the rules RHINO lacks and never re-implements the rest

  Scenario: Every delegated and split command hands RHINO its own validator words
    Given a repository whose pinned RHINO records its arguments and exits 0
    When the developer runs each command in this delegation table
      | command                          | rhino                           |
      | repo-config validate             | repo-config validate            |
      | md naming validate               | md naming validate              |
      | md heading-hierarchy validate    | md heading-hierarchy validate   |
      | md frontmatter validate          | md frontmatter validate         |
      | md frontmatter-dates validate    | md frontmatter validate         |
      | md links validate                | md internal-link validate       |
      | convention emoji validate        | convention emoji validate       |
      | governance word-budget validate  | governance word-budget validate |
      | governance readme-index validate | md readme-index validate        |
      | harness bindings validate        | harness parity validate         |
      | harness claude validate          | harness parity validate         |
      | harness ownership validate       | harness parity validate         |
      | harness catalog validate         | harness parity validate         |
      | harness duplication validate     | harness parity validate         |
    Then RHINO receives each command's own validator words

  Scenario: Output flags reach RHINO in RHINO's own spelling
    Given a repository whose pinned RHINO records its arguments and exits 0
    When the developer runs "md naming validate -o json --quiet --no-color"
    Then RHINO receives the arguments "md naming validate --output json --quiet --no-color"

  Scenario Outline: A delegated command returns RHINO's exit code and output unchanged
    Given a repository whose pinned RHINO prints "rhino <code>" and exits <code>
    When the developer runs "md naming validate"
    Then the command exits with code <code>
    And standard output is exactly the line "rhino <code>"

    Examples:
      | code |
      | 0    |
      | 1    |
      | 2    |
      | 42   |
      | 75   |
      | 78   |

  Scenario Outline: A delegated command fails with exit 3 when RHINO cannot be started
    Given a repository whose ./rhino is <state>
    When the developer runs "md naming validate"
    Then the command exits with code 3
    And standard error names "./rhino" on a single line

    Examples:
      | state          |
      | absent         |
      | not executable |

  Scenario: RHINO runs in the repository root with the caller's environment and standard input
    Given a repository whose pinned RHINO reports its working directory, OSE_GATE_SURFACE and standard input
    When the developer runs "convention emoji validate" with OSE_GATE_SURFACE "pre-push" and standard input "staged payload"
    Then RHINO reports the repository root, "pre-push" and "staged payload"

  Scenario Outline: A retired policy flag names the repo-config.yml section that replaced it
    Given a repository whose pinned RHINO records its arguments and exits 0
    When the developer runs "<command>"
    Then the command exits with code 2
    And standard error names the "<section>" section of repo-config.yml
    And RHINO was not started

    Examples:
      | command                                               | section                |
      | md naming validate --exempt RTK.md                    | md-naming              |
      | md links validate --exclude plans/done                | md-internal-link       |
      | governance word-budget validate --exclude plans/      | governance-word-budget |
      | governance readme-index validate --fail-kinds missing | md-readme-index        |

  Scenario: A delegated command refuses a path because RHINO walks its declared surface
    Given a repository whose pinned RHINO records its arguments and exits 0
    When the developer runs "md heading-hierarchy validate docs/"
    Then the command exits with code 2
    And standard error names the "md-heading-hierarchy" section of repo-config.yml
    And RHINO was not started

  Scenario: A split command refuses JSON output and names the RHINO command that provides it
    Given a repository whose pinned RHINO records its arguments and exits 0
    When the developer runs "md links validate --output json"
    Then the command exits with code 2
    And standard error names "./rhino md internal-link validate --output json" on a single line
    And RHINO was not started

  Scenario Outline: A split command runs its F# remainder only after RHINO completed
    Given a repository whose pinned RHINO prints "rhino done" and exits <rhino>
    And a documentation tree <tree>
    When the developer runs "md links validate"
    Then the command exits with code <exit>
    And the rhino-cli links report <report>

    Examples:
      | rhino | tree                         | exit | report                 |
      | 0     | whose links all resolve      | 0    | follows RHINO's output |
      | 0     | with a broken heading anchor | 1    | follows RHINO's output |
      | 1     | whose links all resolve      | 1    | follows RHINO's output |
      | 2     | with a broken heading anchor | 2    | is not printed         |
      | 78    | whose links all resolve      | 78   | is not printed         |

  Scenario: The gate runner hands a delegated gate no staged files
    Given a repository whose pinned RHINO records its arguments and exits 0
    And a pre-commit gate "md-naming" running "md naming validate" for staged "*.md" files
    And a staged file "docs/guide.md"
    When the developer runs the pre-commit surface for "md-naming" only
    Then RHINO receives the arguments "md naming validate"

  Scenario Outline: Gate validation requires one delegation row per rhino-cli gate command
    Given a gate registry whose rhino-cli gates run "md naming validate" and "md links validate"
    And delegation rows <rows>
    When the developer runs gate validate
    Then gate validation <outcome>

    Examples:
      | rows                                                                  | outcome                                        |
      | for "md naming validate" and "md links validate"                      | passes                                         |
      | for "md naming validate" only                                         | fails naming "md links validate" as missing    |
      | for "md naming validate" twice and "md links validate"                | fails naming "md naming validate" as duplicate |
      | for "md naming validate", "md links validate" and "md shout validate" | fails naming "md shout validate" as extra      |
