Feature: Workout Session

  As an app user
  I want to start, log sets, and complete a workout session
  So that my exercise activity is recorded in the journal

  # Behaviour: OAW-006
  Scenario: Starting a blank workout lets the user begin logging sets
    Given the app shell has no selected routine
    When the user opens a blank workout
    Then the user can log sets

  # Behaviour: OAW-026
  Scenario: Log a set triggers rest timer
    Given an active workout with one exercise with rest
    When the user logs a set
    Then the rest timer is visible

  # Behaviour: OAW-026
  Scenario: Skipping rest hides the rest timer
    Given the rest timer is active
    When the user skips rest
    Then the rest timer is hidden

  # Behaviour: OAW-026
  Scenario: End workout shows confirmation sheet
    Given an active workout
    When the user ends the workout
    Then the confirmation sheet is shown

  # Behaviour: OAW-026
  Scenario: Discarding the workout ends it
    Given the user has opened the confirmation sheet
    When the user discards the workout
    Then no workout is in progress

  # Behaviour: OAW-026
  Scenario: Keep going closes the confirmation sheet and the workout continues
    Given the user has opened the confirmation sheet
    When the user keeps going
    Then the workout continues

  # Behaviour: OAW-007
  Scenario: Opening /app/workout/finish without a finished workout returns to /app/home
    Given no workout has been finished
    When the user opens the workout finish page
    Then the Home screen is visible
