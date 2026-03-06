@golang-commons
Feature: Stdout Capture Utility

  As a Go developer writing CLI tests
  I want to capture standard output during test execution
  So that I can verify what my functions print

  Scenario: CaptureStdout captures a single line written with fmt.Println
    Given a mock function that writes a single line to stdout
    When the developer uses CaptureStdout to capture the output
    Then the captured string equals the written line followed by a newline

  Scenario: CaptureStdout captures multiple writes to stdout
    Given a mock function that writes three distinct lines to stdout
    When the developer uses CaptureStdout to capture the output
    Then the captured string contains all three written lines
