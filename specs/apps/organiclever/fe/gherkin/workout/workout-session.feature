Feature: Workout Session

  Scenario: Start a blank workout
    Given the workout screen is open with no routine
    When the user starts the workout
    Then the workout is in active exercising state

  Scenario: Log a set triggers rest timer
    Given an active workout with one exercise with rest
    When the user logs a set
    Then the rest timer is visible

  Scenario: Skip rest returns to exercising
    Given the rest timer is active
    When the user skips rest
    Then the workout returns to exercising state

  Scenario: End workout shows confirmation sheet
    Given an active workout
    When the user ends the workout
    Then the confirmation sheet is shown

  Scenario: Discard workout returns to idle
    Given the confirmation sheet is shown
    When the user discards the workout
    Then the workout is in idle state

  Scenario: Keep going continues exercising
    Given the confirmation sheet is shown
    When the user keeps going
    Then the workout returns to exercising state
