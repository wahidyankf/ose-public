Feature: Sheet component

  # Behaviour: WUI-011
  Scenario: Title renders
    When I render a Sheet with title "Settings"
    Then the heading "Settings" should be visible

  # Behaviour: WUI-011
  Scenario: Close button closes sheet
    Given I render a Sheet with title "Settings" and an onClose handler
    When the user clicks the close button
    Then onClose should be called

  # Behaviour: WUI-011
  Scenario: Has accessible title
    When I render a Sheet with title "My Sheet"
    Then the dialog should have accessible label "My Sheet"

  # Behaviour: WUI-047
  Scenario Outline: Pressing Escape or clicking the overlay closes the sheet
    Given I render a Sheet with title "Settings" and an onClose handler
    When the user <action>
    Then onClose should be called

    Examples:
      | action             |
      | presses Escape     |
      | clicks the overlay |
