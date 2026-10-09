# Product Requirements — Code Harness

## Personas

- **Content author (human or agent).** Rewrites or audits a course in plans 06–13. Needs one
  command that lists everything still wrong with the course's code, and a way to repair lesson
  blocks from files.
- **Reviewer.** Reads a content PR. Needs CI to prove the code runs, so review can focus on
  teaching.
- **Maintainer.** Owns CI cost and toolchain versions. Needs untouched courses to cost nothing, and
  version bumps to be checked in full.
- **Plan 14 executor.** Needs one number for "harness coverage" and one command for "all green".
- **Reader (indirect).** Copies an example from a lesson and expects it to run and print what the
  lesson shows.

## User Stories

| ID    | Story                                                                                                                                                                       |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-1  | As a content author, I want `examples check --course <slug>` to run every unit of my course and list every finding, so that I know when the course's code is done.          |
| US-2  | As a content author, I want lesson code blocks checked against their files, and repaired from the files on request, so that readers see exactly the code that runs.         |
| US-3  | As a content author, I want a written contract for where code lives and what `run.yaml` declares, so that every course is migrated the same way.                            |
| US-4  | As a content author teaching distributed systems, I want a simulation convention with seeds and replay, so that my examples are deterministic and still show real failures. |
| US-5  | As a reviewer, I want the PR gate to run only the opted-in courses a PR changed, so that review gets a fast, trustworthy signal.                                            |
| US-6  | As a maintainer, I want a monthly full run and a full run whenever the toolchain catalog changes, so that version drift is caught without daily cost.                       |
| US-7  | As a maintainer, I want courses without a `run.yaml` ignored, so that merging this plan changes nothing for existing content.                                               |
| US-8  | As a plan 14 executor, I want a coverage report with a minimum-percent check, so that the end state is measured, not estimated.                                             |
| US-9  | As a maintainer, I want the CLI held to the HIPPO strictness bar and the repository's CLI convention, so that the harness itself is trustworthy.                            |
| US-10 | As a reader, I want platform-bound examples (iOS, Android, Windows, cloud, cluster) at least compiled or validated, so that they contain no syntax errors.                  |

## Functional Requirements

| ID    | Requirement                                                                                                                                                                                                                                                                                     | Stories    |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| FR-1  | The CLI provides `examples validate`, `sync`, `run`, `coverage`, `check`, and `affected`, plus `toolchains list` and `build`, and `help`, with the flags in [tech-docs/002](./tech-docs/002-cli-project-and-hippo-parity.md#command-tree).                                                      | US-1, US-9 |
| FR-2  | `validate` reports every `ayokoding.layout.*` and `ayokoding.runspec.*` finding for the selected courses, under the contract in [tech-docs/003](./tech-docs/003-run-yaml-contract.md).                                                                                                          | US-1, US-3 |
| FR-3  | `sync` reports every `ayokoding.sync.*` finding. `sync --write` rewrites anchored fence bodies from their target files and is idempotent.                                                                                                                                                       | US-2       |
| FR-4  | `run` executes each run of each selected unit in its pinned image, twice, under the isolation in [tech-docs/005](./tech-docs/005-runners-and-toolchain-catalog.md#container-invocation), and compares exit, stdout, and stderr with the expectation.                                            | US-1       |
| FR-5  | Runs have no network. Units that declare services share an internal network with those services, and nothing else.                                                                                                                                                                              | US-1, US-4 |
| FR-6  | A difference between a run's two executions is the finding `ayokoding.examples.nondeterministic`.                                                                                                                                                                                               | US-4       |
| FR-7  | `mode: static` accepts only the reasons `cloud`, `cluster`, `ios`, `android`, `windows`, each with a non-empty note, and allows no services.                                                                                                                                                    | US-10      |
| FR-8  | Runs with `simulation: true` must end standard output with the S7 summary line and a total of at least 32. `run --seed N` replays one seed through `AYOKODING_SEED` and skips the expected-output comparison.                                                                                   | US-4       |
| FR-9  | `--record` writes missing expected-output files and never overwrites an existing one.                                                                                                                                                                                                           | US-1, US-3 |
| FR-10 | Selection: `--since REV` selects opted-in courses with a changed file; any change under `apps/ayokoding-cli/toolchains/` selects every opted-in course; `--all` selects every opted-in course; `--course` selects the named courses, opted in or not; `--shard K/N` splits a selection by slug. | US-5, US-6 |
| FR-11 | A course without any `run.yaml` is inert. Automatic selection skips it, reports it as `inert`, and never turns that into a finding or a non-zero status.                                                                                                                                        | US-7       |
| FR-12 | `coverage` reports, per applicable course: units, covered units, code fences, anchored fences, illustration fences, static units, and `covered`. It also reports the covered percentage of applicable courses. `--min-percent N` exits 1 below N.                                               | US-8       |
| FR-13 | The catalog is embedded in the binary. Every image is digest-pinned; an unpinned image makes the CLI refuse to start (exit 2). `toolchains build` builds derived images with content-hash tags.                                                                                                 | US-6, US-9 |
| FR-14 | Exit statuses, streams, JSON output, colour, reserved flags, and error codes follow the CLI convention, including the supervisor statuses 124–127, 130, and 141 ([tech-docs/002](./tech-docs/002-cli-project-and-hippo-parity.md#streams-output-and-exit-statuses)).                            | US-9       |
| FR-15 | `ayokoding-www:examples:check` runs `examples check` in the PR gate (affected) and in the monthly workflow (full, four shards).                                                                                                                                                                 | US-5, US-6 |
| FR-16 | The governance surfaces in [tech-docs/011](./tech-docs/011-rule-and-docs-impact.md) state HC1–HC8 and point the tutorial gates at the harness.                                                                                                                                                  | US-3       |

## Non-Functional Requirements

| ID    | Requirement                                                                                                                                     | Measure                                                                                                                     |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| NFR-1 | Inert cost: with no opted-in course, `examples check` contacts no registry and starts no container.                                             | Manual check 6 in [tech-docs/008](./tech-docs/008-testing-and-manual-verification.md); fake-CLI log is empty in integration |
| NFR-2 | Determinism of the tool: the same inputs give the same stdout bytes.                                                                            | The JSON payload carries no time, duration, or absolute path; a unit test renders twice and compares                        |
| NFR-3 | Strictness: lint, NilAway, architecture tests, a 99% deterministic-core floor, and unit tests with `-race`.                                     | `ayokoding-cli:test:quick` exits 0                                                                                          |
| NFR-4 | Security: no secret in any spec, catalog, log, or diagnostic; no privileged container; no host path other than the temporary copy mounted.      | Argv unit tests; the PR leak review                                                                                         |
| NFR-5 | Bounded work: every wait is bounded (run timeout at most 600s, service readiness at most 120s, at most 20 runs per unit); no retry loop exists. | Validation rules and unit tests                                                                                             |
| NFR-6 | Portability: the container command is replaceable through `AYOKODING_CONTAINER_CLI`.                                                            | Integration tests use the fake CLI                                                                                          |
| NFR-7 | Output accessibility: status is conveyed in words (`passed`, `failed`, `inert`), never by colour alone.                                         | `NO_COLOR` scenario                                                                                                         |
| NFR-8 | Cost: no daily course run; full runs are monthly or on catalog changes, in at most four shards.                                                 | Workflow review in Phase 6                                                                                                  |

## Acceptance Criteria (Gherkin)

The corpus lives at `specs/apps/ayokoding/cli/behaviours/`. Every scenario has unit and integration
bindings. E2E binds the scenarios that need the real binary or real containers; every other
scenario carries `@e2e-exempt` with an exemption comment naming its integration proof. The steps
speak about courses, units, and lessons, never about Go types.

### New: `cli-contract/command-line-contract.feature`

```gherkin
Feature: The command line contract
  As a maintainer
  I want ayokoding-cli to follow the repository's command line convention
  So that scripts and people can rely on its statuses and streams

  Scenario: Help lists every command and every exit status
    When I ask ayokoding-cli for help
    Then it exits with status 0
    And standard output lists the commands "examples" and "toolchains"
    And standard output lists the exit statuses 0, 1, 2, 124, 125, 126, 127, 130, and 141 with their meanings

  Scenario: A bare invocation prints help to standard error
    When I run ayokoding-cli with no arguments
    Then it exits with status 2
    And standard output is empty
    And standard error shows the usage

  Scenario: The version names the build, the commit, and the catalog
    Given a build stamped with version "v0.0.0-test" and an all-zero commit
    When I ask ayokoding-cli for its version
    Then standard output names version "v0.0.0-test", the all-zero commit, and the catalog hash

  Scenario: An unknown flag is a usage error
    When I run ayokoding-cli with the flag "--no-such-flag"
    Then it exits with status 2
    And standard output is empty

  Scenario: A machine-readable error goes to standard error only
    When I run "examples run" with JSON output and no selection
    Then it exits with status 2
    And standard output is empty
    And standard error is one JSON document with error code "ayokoding.usage.missing-selection"

  Scenario: NO_COLOR removes colour from both streams
    Given the environment variable NO_COLOR is set
    And a fixture course with a failing run
    When I check that course with colour set to auto
    Then neither stream contains an escape sequence
    And each failed run is labelled with the word "failed"

  # Exemption(e2e): forcing an internal failure needs an in-process fault hook that the shipped binary does not expose; alternative-proof: ayokoding-cli:test:integration / An internal failure exits 2 without a stack trace
  @e2e-exempt
  Scenario: An internal failure exits 2 without a stack trace
    Given the harness fails internally while checking a course
    When the command ends
    Then it exits with status 2
    And standard error names error code "ayokoding.internal.panic"
    And standard error contains no stack trace

  # Exemption(e2e): the interrupt timing against real containers is not repeatable on shared runners; alternative-proof: ayokoding-cli:test:integration / An interrupt removes started containers and exits 130
  @e2e-exempt
  Scenario: An interrupt removes started containers and exits 130
    Given a fixture course whose run is still executing
    When the harness receives an interrupt
    Then every container and network labelled with this run is removed
    And it exits with status 130

  Scenario: A closed output pipe exits 141
    Given a reader that closes standard output after one line
    When I check a fixture course with many findings
    Then the exit status is 141
```

### New: `examples/inert-courses.feature`

```gherkin
Feature: Courses without a run spec are inert
  As a maintainer
  I want courses that have not opted in to be ignored
  So that the harness changes nothing until a content plan migrates a course

  Scenario: A content tree with no opted-in course runs nothing and passes
    Given a content tree in which no course has a run spec
    When I check the content tree for changes since the base revision
    Then it exits with status 0
    And standard output says "0 opted-in courses; nothing to run"
    And no container was started

  # Exemption(e2e): selection is decided before any container starts, so the built binary adds no proof beyond the integration run against a real git repository; alternative-proof: ayokoding-cli:test:integration / A changed course without a run spec is reported as inert
  @e2e-exempt
  Scenario: A changed course without a run spec is reported as inert
    Given a course without a run spec whose lesson changed since the base revision
    When I check the content tree for changes since the base revision
    Then the course is listed as "inert"
    And it exits with status 0

  # Exemption(e2e): previewing is static file reading with no container involved; alternative-proof: ayokoding-cli:test:integration / An explicitly named course is previewed before it opts in
  @e2e-exempt
  Scenario: An explicitly named course is previewed before it opts in
    Given a course without a run spec whose lesson block differs from its file
    When I sync that course by name
    Then the mismatch is reported with code "ayokoding.sync.mismatch"
    And it exits with status 1
```

### New: `examples/content-layout.feature`

All scenarios in this feature carry the same exemption, because layout checks read files only:
`# Exemption(e2e): layout validation reads files and starts no container; alternative-proof: ayokoding-cli:test:integration / <the same scenario title>`.

```gherkin
Feature: Course code lives in canonical units
  As a content author
  I want misplaced code reported
  So that every runnable program in an opted-in course has a unit

  Background:
    Given an opted-in course

  @e2e-exempt
  Scenario: A flat example file is a layout finding
    Given the course has the file "learning/code/ex-03-loops.py"
    When I validate the course
    Then the finding "ayokoding.layout.flat-example" names "learning/code/ex-03-loops.py"

  @e2e-exempt
  Scenario: Code outside the canonical places is a layout finding
    Given the course has code under "learning/coroutines/code"
    When I validate the course
    Then the finding "ayokoding.layout.unplaced-code" names "learning/coroutines/code"

  @e2e-exempt
  Scenario: A unit without a run spec is a layout finding
    Given the course has the unit "learning/code/ex-04-maps" without a run spec
    When I validate the course
    Then the finding "ayokoding.layout.missing-run-spec" names "learning/code/ex-04-maps"

  @e2e-exempt
  Scenario: A run spec outside a unit folder is a layout finding
    Given the course has a run spec at "learning/run.yaml"
    When I validate the course
    Then the finding "ayokoding.layout.misplaced-run-spec" names "learning/run.yaml"
```

### New: `examples/run-spec-validation.feature`

Every scenario carries
`# Exemption(e2e): run spec validation is static decoding with no container; alternative-proof: ayokoding-cli:test:integration / <the same scenario title>`.

```gherkin
Feature: Run specs are strict
  As a content author
  I want an invalid run spec rejected with a precise reason
  So that a typo never silently weakens a check

  @e2e-exempt
  Scenario: An unknown key is rejected
    Given a unit whose run spec has the key "expected_output"
    When I validate the course
    Then the finding "ayokoding.runspec.unknown-key" names the unit and line of "expected_output"

  @e2e-exempt
  Scenario: An unknown toolchain is rejected
    Given a unit whose run spec names the toolchain "cobol"
    When I validate the course
    Then the finding "ayokoding.runspec.unknown-toolchain" names "cobol"

  @e2e-exempt
  Scenario: A path that leaves the unit is rejected
    Given a unit whose run expects standard output from "../shared/out.txt"
    When I validate the course
    Then the finding "ayokoding.runspec.path-escape" names "../shared/out.txt"

  @e2e-exempt
  Scenario: A timeout above the maximum is rejected
    Given a unit whose run has the timeout "601s"
    When I validate the course
    Then the finding "ayokoding.runspec.timeout-out-of-range" names "601s"

  @e2e-exempt
  Scenario: Ignored example output needs a stated invariant
    Given a unit whose example run ignores standard output and states no invariant
    When I validate the course
    Then the finding "ayokoding.runspec.missing-invariant" names the run

  @e2e-exempt
  Scenario: A complete run spec passes validation
    Given a unit whose run spec declares a toolchain, a command, an exit status, and an expected output file
    When I validate the course
    Then no finding is reported for the unit
```

### New: `examples/markdown-file-sync.feature`

```gherkin
Feature: Lesson code matches the files that run
  As a reader
  I want every code block in a lesson to be the code that runs
  So that what I copy behaves as the lesson says

  Background:
    Given an opted-in course

  Scenario: A lesson block identical to its file passes
    Given a lesson block anchored to "learning/code/ex-01-hello/example.py" with the same bytes as the file
    When I sync the course
    Then no sync finding is reported

  # Exemption(e2e): sync compares files and starts no container; alternative-proof: ayokoding-cli:test:integration / A lesson block that differs from its file is a mismatch
  @e2e-exempt
  Scenario: A lesson block that differs from its file is a mismatch
    Given a lesson block anchored to "learning/code/ex-01-hello/example.py" that differs on its third line
    When I sync the course
    Then the finding "ayokoding.sync.mismatch" names the lesson file, the anchor line, and the third line

  # Exemption(e2e): sync compares files and starts no container; alternative-proof: ayokoding-cli:test:integration / An anchor to a missing file is reported
  @e2e-exempt
  Scenario: An anchor to a missing file is reported
    Given a lesson block anchored to "learning/code/ex-09-gone/example.py", which does not exist
    When I sync the course
    Then the finding "ayokoding.sync.missing-file" names "learning/code/ex-09-gone/example.py"

  # Exemption(e2e): sync compares files and starts no container; alternative-proof: ayokoding-cli:test:integration / A line-range anchor compares only the selected lines
  @e2e-exempt
  Scenario: A line-range anchor compares only the selected lines
    Given a lesson block anchored to lines 3 to 5 of a ten-line file and holding exactly those lines
    When I sync the course
    Then no sync finding is reported

  # Exemption(e2e): sync compares files and starts no container; alternative-proof: ayokoding-cli:test:integration / An unanchored code block is reported unless marked as an illustration
  @e2e-exempt
  Scenario: An unanchored code block is reported unless marked as an illustration
    Given a lesson with one unanchored "python" block and one "python" block marked as an illustration
    When I sync the course
    Then exactly one finding "ayokoding.sync.unanchored-fence" is reported, for the unmarked block

  # Exemption(e2e): sync compares files and starts no container; alternative-proof: ayokoding-cli:test:integration / An output block must be anchored to an expected-output file
  @e2e-exempt
  Scenario: An output block must be anchored to an expected-output file
    Given a lesson with an "Output" block that has no anchor
    When I sync the course
    Then the finding "ayokoding.sync.unanchored-output" names the lesson line

  # Exemption(e2e): sync compares files and starts no container; alternative-proof: ayokoding-cli:test:integration / A unit no lesson shows is reported
  @e2e-exempt
  Scenario: A unit no lesson shows is reported
    Given the unit "learning/code/ex-05-sets" that no lesson anchor targets
    When I sync the course
    Then the finding "ayokoding.sync.unreferenced-unit" names "learning/code/ex-05-sets"

  Scenario: Writing the sync repairs anchored blocks from their files
    Given a lesson block anchored to a file whose bytes differ from the block
    When I sync the course with writing enabled
    Then the lesson block holds the file's bytes
    And syncing again reports no finding and changes no file
```

### New: `examples/example-execution.feature`

```gherkin
Feature: Examples run and print what the lesson shows
  As a content author
  I want each run compared with its expectation
  So that a course is green only when its code works

  Background:
    Given an opted-in course

  Scenario: An example whose output matches its expected file passes
    Given a unit whose program prints exactly its expected output and exits 0
    When I check the course by name
    Then the run is labelled "passed"
    And it exits with status 0

  # Exemption(e2e): comparing a recorded exit status needs no real container beyond the passing scenario; alternative-proof: ayokoding-cli:test:integration / A different exit status fails the run
  @e2e-exempt
  Scenario: A different exit status fails the run
    Given a unit whose program exits 3 where the run spec expects 0
    When I check the course by name
    Then the finding "ayokoding.examples.exit-mismatch" names expected 0 and actual 3
    And it exits with status 1

  # Exemption(e2e): output comparison is the same code path the passing E2E scenario exercises; alternative-proof: ayokoding-cli:test:integration / Different standard output fails the run with the first differing line
  @e2e-exempt
  Scenario: Different standard output fails the run with the first differing line
    Given a unit whose program prints a different second line than its expected file
    When I check the course by name
    Then the finding "ayokoding.examples.stdout-mismatch" shows line 2 expected and actual

  # Exemption(e2e): the stderr rule is decided after the container exits and needs no real container; alternative-proof: ayokoding-cli:test:integration / Unexpected standard error fails the run
  @e2e-exempt
  Scenario: Unexpected standard error fails the run
    Given a unit whose program writes a warning to standard error where the run spec expects it empty
    When I check the course by name
    Then the finding "ayokoding.examples.stderr-mismatch" is reported

  # Exemption(e2e): a real timeout makes the scheduled suite slow without proving more than the fake runtime's sleep; alternative-proof: ayokoding-cli:test:integration / A run that exceeds its timeout fails as a timed-out result
  @e2e-exempt
  Scenario: A run that exceeds its timeout fails as a timed-out result
    Given a unit whose program runs longer than its two-second timeout
    When I check the course by name
    Then the finding "ayokoding.examples.run-timeout" is reported
    And it exits with status 1

  # Exemption(e2e): recording writes files after runs complete and is proved with the fake runtime's outputs; alternative-proof: ayokoding-cli:test:integration / Recording writes only missing expected files
  @e2e-exempt
  Scenario: Recording writes only missing expected files
    Given a unit with two runs, one with an expected output file and one without
    When I run the course by name with recording enabled
    Then the missing expected file is written with the run's output
    And the existing expected file is unchanged

  Scenario: An example with a service reaches it by name
    Given a unit that declares the "postgres" service and queries it at host "postgres"
    When I check the course by name
    Then the run is labelled "passed"
    And no service container or network remains afterwards
```

### New: `examples/determinism.feature`

```gherkin
Feature: Runs are deterministic
  As a reviewer
  I want the harness to block the common sources of flakiness
  So that a green check means the same thing every time

  Background:
    Given an opted-in course

  Scenario: A run cannot reach the network
    Given a unit whose program fetches a web address and prints the response
    When I check the course by name
    Then the run is labelled "failed"

  # Exemption(e2e): the environment is fixed by the argv the unit tests compare byte for byte and the fake runtime records; alternative-proof: ayokoding-cli:test:integration / A run sees only the fixed environment
  @e2e-exempt
  Scenario: A run sees only the fixed environment
    Given the host environment contains the variable "SECRET_TOKEN"
    When the harness runs a unit
    Then the run's environment does not contain "SECRET_TOKEN"
    And the run's environment sets "TZ" to "UTC" and "SOURCE_DATE_EPOCH" to "0"

  Scenario: A run whose two executions differ is reported as nondeterministic
    Given a unit whose program prints an unseeded random number
    When I check the course by name
    Then the finding "ayokoding.examples.nondeterministic" shows the first differing line

  Scenario: A run cannot change the course files
    Given a unit whose program overwrites its own source file
    When I check the course by name
    Then the source file in the course is unchanged
```

### New: `examples/static-mode.feature`

```gherkin
Feature: Platform-bound code is validated statically
  As a reader
  I want code that cannot run in a Linux container at least compiled or validated
  So that it contains no syntax errors

  Background:
    Given an opted-in course

  Scenario: A static unit runs its validator and never the program
    Given a static unit with reason "ios", a note, and a validator command
    When I check the course by name
    Then only the validator command was executed
    And the unit is labelled "passed (static)"

  # Exemption(e2e): reason validation is static decoding with no container; alternative-proof: ayokoding-cli:test:integration / Static mode needs a known reason and a note
  @e2e-exempt
  Scenario Outline: Static mode needs a known reason and a note
    Given a static unit with reason "<reason>" and note "<note>"
    When I validate the course
    Then the finding "<code>" is reported

    Examples:
      | reason  | note                   | code                                 |
      | desktop | Needs a desktop shell. | ayokoding.runspec.unknown-static-reason |
      | ios     |                        | ayokoding.runspec.missing-static-note   |

  # Exemption(e2e): the services rule is static decoding with no container; alternative-proof: ayokoding-cli:test:integration / Static mode with services is rejected
  @e2e-exempt
  Scenario: Static mode with services is rejected
    Given a static unit that declares the "postgres" service
    When I validate the course
    Then the finding "ayokoding.runspec.static-with-services" is reported
```

### New: `examples/simulation-runs.feature`

```gherkin
Feature: Simulation runs follow the seed convention
  As a content author teaching distributed systems
  I want simulations checked for their seed summary and replayable by seed
  So that failures are reproducible and visible

  Background:
    Given an opted-in course

  # Exemption(e2e): the summary rule parses the last output line after the container exits; alternative-proof: ayokoding-cli:test:integration / A simulation run must end with the seed summary
  @e2e-exempt
  Scenario: A simulation run must end with the seed summary
    Given a simulation unit whose program prints no summary line
    When I check the course by name
    Then the finding "ayokoding.examples.simulation-summary" is reported

  # Exemption(e2e): the seed count is parsed from the summary line after the container exits; alternative-proof: ayokoding-cli:test:integration / A simulation with fewer than 32 seeds is rejected
  @e2e-exempt
  Scenario: A simulation with fewer than 32 seeds is rejected
    Given a simulation unit whose summary reads "seeds: 8 passed, 0 failed (of 8)"
    When I check the course by name
    Then the finding "ayokoding.examples.simulation-summary" names the total 8

  Scenario: Replaying one seed prints its trace and skips the expected output
    Given a simulation unit with 64 seeds
    When I run that unit with seed 17
    Then the run receives AYOKODING_SEED set to "17"
    And standard output shows the trace for seed 17
    And no expected-output comparison is made

  # Exemption(e2e): an expected non-zero exit is the same comparison the exit-status scenarios prove; alternative-proof: ayokoding-cli:test:integration / A simulation expected to find failing seeds passes when it finds them
  @e2e-exempt
  Scenario: A simulation expected to find failing seeds passes when it finds them
    Given a simulation unit that expects exit status 1 and an output listing seeds 4 and 31 as failing
    When I check the course by name
    Then the run is labelled "passed"
```

### New: `examples/selection.feature`

Every scenario carries
`# Exemption(e2e): selection is decided from files and git before any container starts; alternative-proof: ayokoding-cli:test:integration / <the same scenario title>`.

```gherkin
Feature: The harness selects affected or all opted-in courses
  As a reviewer
  I want pull requests to run only what changed, and toolchain changes to run everything
  So that checks stay fast without missing version drift

  @e2e-exempt
  Scenario: Only opted-in courses with changed files are selected
    Given opted-in courses "alpha" and "beta" and an inert course "gamma"
    And files changed in "alpha" and "gamma" since the base revision
    When I list the affected selection since the base revision
    Then the mode is "affected"
    And the selected courses are exactly "alpha"
    And "gamma" is listed as inert

  @e2e-exempt
  Scenario: A toolchain catalog change selects every opted-in course
    Given opted-in courses "alpha" and "beta"
    And the toolchain catalog changed since the base revision
    When I list the affected selection since the base revision
    Then the mode is "full"
    And the selected courses are "alpha" and "beta"

  @e2e-exempt
  Scenario: Shards split the selection by slug without overlap
    Given opted-in courses "a1", "a2", "a3", "a4", and "a5"
    When I select all courses as shard 2 of 2
    Then the selected courses are exactly "a2" and "a4"

  @e2e-exempt
  Scenario: A run without a selection is a usage error
    When I run "examples check" with no course, no base revision, and no "all"
    Then it exits with status 2
    And standard error names error code "ayokoding.usage.missing-selection"
```

### New: `examples/coverage-report.feature`

Every scenario carries
`# Exemption(e2e): coverage is computed from files and starts no container; alternative-proof: ayokoding-cli:test:integration / <the same scenario title>`.

```gherkin
Feature: Harness coverage is measured per course
  As the plan 14 executor
  I want a coverage report with a minimum check
  So that the series end state is measured

  @e2e-exempt
  Scenario: A course is covered when every unit is covered and no finding remains
    Given an opted-in course whose two units both have valid run specs and whose lessons are in sync
    When I report coverage
    Then the course is reported as covered with 2 of 2 units

  @e2e-exempt
  Scenario: Courses without code are listed as not applicable
    Given a course with no code folder and no code block
    When I report coverage
    Then the course is listed as not applicable
    And it is not counted in the percentage

  @e2e-exempt
  Scenario: Coverage below the minimum exits 1
    Given two applicable courses of which one is covered
    When I report coverage with a minimum of 100 percent
    Then the report shows 50 percent
    And the finding "ayokoding.coverage.below-minimum" is reported
    And it exits with status 1

  @e2e-exempt
  Scenario: Illustration blocks and static units are counted per course
    Given an opted-in course with three illustration blocks and one static unit
    When I report coverage
    Then the course shows 3 illustration blocks and 1 static unit
```

### New: `examples/environment-failures.feature`

```gherkin
Feature: Environment failures use the supervisor statuses
  As a script author
  I want environment problems distinguished from failing examples
  So that a broken runner is never read as a broken course

  Background:
    Given an opted-in course with one unit

  Scenario: A missing container command exits 127
    Given the container command does not exist
    When I check the course by name
    Then it exits with status 127
    And standard error names error code "ayokoding.env.container-cli-not-found"

  # Exemption(e2e): a non-executable container command cannot be arranged against the runner's real Docker; alternative-proof: ayokoding-cli:test:integration / A container command that cannot run exits 126
  @e2e-exempt
  Scenario: A container command that cannot run exits 126
    Given the container command exists but is not executable
    When I check the course by name
    Then it exits with status 126

  # Exemption(e2e): stopping the runner's Docker daemon would break the scheduled suite; alternative-proof: ayokoding-cli:test:integration / An unavailable container runtime exits 125
  @e2e-exempt
  Scenario: An unavailable container runtime exits 125
    Given the container runtime reports that it is unavailable
    When I check the course by name
    Then it exits with status 125
    And standard error names error code "ayokoding.env.container-runtime-unavailable"

  # Exemption(e2e): a service that never becomes ready cannot be arranged with a pinned real image; alternative-proof: ayokoding-cli:test:integration / A service that never becomes ready exits 124
  @e2e-exempt
  Scenario: A service that never becomes ready exits 124
    Given the unit declares a service that never reports ready
    When I check the course by name
    Then it exits with status 124
    And no service container or network remains afterwards
```

### New: `toolchains/toolchain-catalog.feature`

Every scenario carries
`# Exemption(e2e): catalog decoding and tag computation need no container; alternative-proof: ayokoding-cli:test:integration / <the same scenario title>`.

```gherkin
Feature: The toolchain catalog is pinned
  As a maintainer
  I want every image pinned by digest and every derived image tagged by its recipe
  So that a run uses exactly the toolchain it was tested with

  @e2e-exempt
  Scenario: An image without a digest stops the CLI
    Given a catalog entry whose image has a tag but no digest
    When I list the toolchains
    Then it exits with status 2
    And standard error names error code "ayokoding.catalog.unpinned-image"

  @e2e-exempt
  Scenario: The toolchain list names each id, kind, and version
    Given the embedded catalog
    When I list the toolchains
    Then each line shows an id, a kind, a version, and a digest-pinned image

  @e2e-exempt
  Scenario: A derived image tag changes when its recipe changes
    Given a derived toolchain recipe
    When one byte of its Dockerfile changes
    Then its image tag changes
```

## BDD Delta Map

| Feature                              | Scenarios | E2E-bound                                  | Status |
| ------------------------------------ | --------- | ------------------------------------------ | ------ |
| `cli-contract/command-line-contract` | 9         | 7 (all but internal failure and interrupt) | New    |
| `examples/inert-courses`             | 3         | 1                                          | New    |
| `examples/content-layout`            | 4         | 0                                          | New    |
| `examples/run-spec-validation`       | 6         | 0                                          | New    |
| `examples/markdown-file-sync`        | 8         | 2                                          | New    |
| `examples/example-execution`         | 7         | 2                                          | New    |
| `examples/determinism`               | 4         | 3                                          | New    |
| `examples/static-mode`               | 3         | 1                                          | New    |
| `examples/simulation-runs`           | 4         | 1                                          | New    |
| `examples/selection`                 | 4         | 0                                          | New    |
| `examples/coverage-report`           | 4         | 0                                          | New    |
| `examples/environment-failures`      | 4         | 1                                          | New    |
| `toolchains/toolchain-catalog`       | 3         | 0                                          | New    |
| **Total**                            | **63**    | **18**                                     |        |

No existing feature file changes. `specs/apps/ayokoding/www/**` is untouched.
