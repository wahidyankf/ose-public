@golang-commons
Feature: Timestamp Utilities

  As a Go developer
  I want timestamp functions that return correctly formatted strings
  So that my application can display human-readable timestamps

  Scenario: Timestamp returns a valid RFC3339 formatted string
    When the developer calls Timestamp
    Then the result can be parsed as RFC3339

  Scenario: JakartaTimestamp returns a timestamp with the Jakarta timezone offset
    When the developer calls JakartaTimestamp
    Then the result contains the "+07:00" timezone offset
