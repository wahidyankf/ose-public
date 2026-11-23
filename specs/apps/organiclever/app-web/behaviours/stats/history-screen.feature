Feature: History Screen

  As an app user
  I want to view my past journal entries in reverse chronological order
  So that I can review my recent activity at a glance

  # Behaviour: OAW-002
  Scenario: History shows entries in reverse order
    When the history screen has entries
    Then entries are shown newest first

  # Behaviour: OAW-024
  Scenario: Empty history shows empty state
    When the history screen has no entries
    Then the empty state message is shown

  # Behaviour: OAW-025
  Scenario: Session card expands on click
    Given the history screen shows a workout entry
    When the user taps the session card
    Then the card expands showing details
