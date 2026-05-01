Feature: History Screen
  Scenario: History shows entries in reverse order
    Given the history screen has entries
    Then entries are shown newest first

  Scenario: Empty history shows empty state
    Given the history screen has no entries
    Then the empty state message is shown

  Scenario: Session card expands on click
    Given the history screen shows a workout entry
    When the user taps the session card
    Then the card expands showing details
